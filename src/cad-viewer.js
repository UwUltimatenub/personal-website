import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const projects = {
  lickitung: {
    title: 'Lickitung',
    description: 'Team 9785 Alectrona’s 2026 REBUILT competition robot.',
    file: '/models/lickitung-web.glb',
  },
  midkey: {
    title: 'Midkey',
    description: 'A personal showcase robot currently being manufactured and assembled.',
    file: '/models/midkey-web.glb',
  },
  furlin: {
    title: 'Furlin',
    description: 'Team 9659’s 2025 REEFSCAPE competition robot.',
    file: '/models/furlin-web.glb',
  },
  toyota: {
    title: 'Toyota',
    description: 'An unbuilt 2025 robot architecture and CAD study.',
    file: '/models/toyota-web.glb',
  },
};

export function createCadViewer() {
  const container = document.querySelector('#cad-viewer');
  const loading = document.querySelector('.viewer-loading');
  const status = document.querySelector('#viewer-status');
  const title = document.querySelector('#model-dialog-title');
  const description = document.querySelector('#model-description');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202a33);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  container.prepend(renderer.domElement);

  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  environmentGenerator.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2;
  controls.maxDistance = 40;

  scene.add(new THREE.HemisphereLight(0xdfe8ed, 0x15181b, 1));
  const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.1);
  keyLight.position.set(5, 9, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xbddcff, 0.8);
  rimLight.position.set(-7, 3, -5);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(30, 30, 0x4e7795, 0x303e49);
  grid.position.y = -1.55;
  scene.add(grid);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  let active = false;
  let activeModel;
  let framedPosition;
  let animationFrame;
  let requestId = 0;

  function disposeModel() {
    if (!activeModel) return;
    scene.remove(activeModel);
    activeModel.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material).forEach((value) => value?.isTexture && value.dispose());
        material.dispose();
      });
    });
    activeModel = undefined;
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
    framedPosition = new THREE.Vector3(distance * 0.8, distance * 0.55, distance);
    camera.position.copy(framedPosition);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
    renderer.render(scene, camera);
  }

  function animate() {
    if (!active) return;
    controls.update();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  }

  function setActive(nextActive) {
    active = nextActive;
    cancelAnimationFrame(animationFrame);
    if (active) {
      resize();
      animate();
    }
  }

  async function openProject(projectKey) {
    const info = projects[projectKey];
    if (!info) throw new Error(`Unknown project: ${projectKey}`);
    const currentRequest = ++requestId;
    setActive(true);
    loading.classList.remove('hidden');
    status.textContent = 'LOADING INTERACTIVE MODEL';
    title.textContent = info.title;
    description.textContent = info.description;

    const result = await gltfLoader.loadAsync(info.file);
    if (currentRequest !== requestId) return;
    disposeModel();
    activeModel = result.scene;
    activeModel.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        if ('roughness' in material) material.roughness = Math.min(material.roughness, 0.3);
        if ('metalness' in material) material.metalness = Math.max(material.metalness, 0.16);
        if ('envMapIntensity' in material) material.envMapIntensity = 0.9;
        material.needsUpdate = true;
      });
    });
    scene.add(activeModel);
    frameModel(activeModel);
    loading.classList.add('hidden');
    status.textContent = 'INTERACTIVE CAD MODEL';
  }

  function reset() {
    if (!activeModel || !framedPosition) return;
    camera.position.copy(framedPosition);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  document.addEventListener('fullscreenchange', resize);
  resize();

  return { openProject, reset, setActive };
}
