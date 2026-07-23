import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const projects = {
  midkey: {
    title: 'Midkey',
    description: 'An interactive view of the Midkey CAD assembly. Rotate, zoom, and pan to inspect the model.',
    file: '/models/midkey-web.glb',
  },
  furlin: {
    title: 'Furlin',
    description: 'An interactive view of the Furlin CAD assembly. Rotate, zoom, and pan to inspect the model.',
    file: '/models/furlin-web.glb',
  },
  lickitung: {
    title: 'Lickitung',
    description: 'An interactive view of the Lickitung CAD assembly. Rotate, zoom, and pan to inspect the model.',
    file: '/models/lickitung-web.glb',
  },
  toyota: {
    title: 'Toyota',
    description: 'An interactive view of the Toyota CAD assembly. Rotate, zoom, and pan to inspect the model.',
    file: '/models/toyota-web.glb',
  },
};

export function initCadViewer() {
  const container = document.querySelector('#cad-viewer');
  if (!container) return;

  const scene = new THREE.Scene();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  scene.background = new THREE.Color(0x252a2e);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
  camera.position.set(7, 5, 8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.prepend(renderer.domElement);

  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  environmentGenerator.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2;
  controls.maxDistance = 35;

  scene.add(new THREE.HemisphereLight(0xdfe8ed, 0x15181b, 0.85));
  const key = new THREE.DirectionalLight(0xfff8ee, 2.1);
  key.position.set(5, 9, 6);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbddcff, 0.75);
  rim.position.set(-7, 3, -5);
  scene.add(rim);

  const grid = new THREE.GridHelper(30, 30, 0x69747a, 0x353c40);
  grid.position.y = -1.55;
  scene.add(grid);

  let activeModel;
  const defaultMaterial = () => new THREE.MeshStandardMaterial({ color: 0xaeb4b3, metalness: 0.72, roughness: 0.28 });
  function disposeModel() {
    if (!activeModel) return;
    scene.remove(activeModel);
    activeModel.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    });
  }

  function frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    const max = Math.max(size.x, size.y, size.z) || 1;
    const distance = max / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45;
    camera.position.set(distance * .8, distance * .55, distance);
    camera.near = Math.max(distance / 100, .01);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
    renderer.render(scene, camera);
  }

  function showModel(model, info) {
    disposeModel();
    activeModel = model;
    activeModel.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = !info.file;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          if ('roughness' in material) material.roughness = Math.min(material.roughness, 0.26);
          if ('metalness' in material) material.metalness = Math.max(material.metalness, 0.18);
          if ('envMapIntensity' in material) material.envMapIntensity = 0.9;
          material.needsUpdate = true;
        });
      }
    });
    scene.add(activeModel);
    document.querySelector('#model-title').textContent = info.title;
    document.querySelector('#model-description').textContent = info.description;
    frameModel(activeModel);
    document.querySelector('.viewer-loading').classList.add('hidden');
  }

  async function selectProject(keyName) {
    document.querySelector('.viewer-loading').classList.remove('hidden');
    try {
      document.querySelector('#viewer-status').textContent = 'LOADING CAD ASSEMBLY';
      const result = await gltfLoader.loadAsync(projects[keyName].file);
      showModel(result.scene, projects[keyName]);
    } catch (error) {
      document.querySelector('.viewer-loading').classList.add('hidden');
      document.querySelector('#viewer-status').textContent = 'COULD NOT LOAD MODEL';
      console.error(error);
    }
  }

  document.querySelectorAll('.project-option').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.project-option').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelector('#viewer-status').textContent = 'INTERACTIVE CONCEPT MODEL';
    selectProject(button.dataset.model);
  }));

  document.querySelector('#reset-view').addEventListener('click', () => activeModel && frameModel(activeModel));
  document.querySelector('#fullscreen-view').addEventListener('click', () => {
    const workspace = document.querySelector('.cad-workspace');
    if (document.fullscreenElement) document.exitFullscreen();
    else workspace.requestFullscreen?.();
  });

  document.querySelector('#model-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    const loading = document.querySelector('.viewer-loading');
    loading.classList.remove('hidden');
    try {
      let model;
      if (extension === 'stl') {
        const geometry = new STLLoader().parse(await file.arrayBuffer());
        geometry.computeVertexNormals();
        model = new THREE.Mesh(geometry, defaultMaterial());
      } else if (extension === 'obj') {
        model = new OBJLoader().parse(await file.text());
        model.traverse((object) => { if (object.isMesh) object.material = defaultMaterial(); });
      } else if (extension === 'glb' || extension === 'gltf') {
        const data = extension === 'glb' ? await file.arrayBuffer() : await file.text();
        const result = await new Promise((resolve, reject) => gltfLoader.parse(data, '', resolve, reject));
        model = result.scene;
      } else throw new Error('Unsupported file format');
      document.querySelectorAll('.project-option').forEach((item) => item.classList.remove('active'));
      document.querySelector('#viewer-status').textContent = `LOCAL FILE · ${extension.toUpperCase()}`;
      showModel(model, { title: file.name, description: 'Loaded locally in your browser. Your CAD file is not uploaded or stored anywhere.' });
    } catch (error) {
      loading.classList.add('hidden');
      document.querySelector('#viewer-status').textContent = 'COULD NOT LOAD FILE';
      console.error(error);
    } finally {
      event.target.value = '';
    }
  });

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  document.addEventListener('fullscreenchange', resize);

  function animate() {
    if (controls.update()) renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  selectProject('lickitung');
  resize();
  animate();
}
