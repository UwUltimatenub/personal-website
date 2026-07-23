import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const projects = {
  midkey: {
    title: 'Midkey',
    description: 'An interactive view of the Midkey CAD assembly. Rotate, zoom, pan, or enable wireframe mode to inspect the model.',
    file: '/models/midkey-web.glb',
  },
  robot: {
    title: 'Competition Robot',
    description: 'A representative drivetrain and superstructure assembly inspired by my work leading Team 9659 from early prototypes through competition.',
  },
  camera: {
    title: 'Sensor Mount',
    description: 'A compact, adjustable camera and sensor bracket representative of my CAD work for an autonomous airport wheelchair at Cyberworks Robotics.',
  },
  vision: {
    title: 'Vision System',
    description: 'A representative vision stack showing the relationship between camera, sensor enclosure, and adjustable mounting hardware.',
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
  scene.background = new THREE.Color(0xdeddd6);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
  camera.position.set(7, 5, 8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.prepend(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2;
  controls.maxDistance = 35;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x484842, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(5, 9, 6);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8ff35, 1.8);
  rim.position.set(-7, 3, -5);
  scene.add(rim);

  const grid = new THREE.GridHelper(30, 30, 0x999990, 0xc7c6bf);
  grid.position.y = -1.55;
  scene.add(grid);

  let activeModel;
  const defaultMaterial = () => new THREE.MeshStandardMaterial({ color: 0xaeb4b3, metalness: 0.72, roughness: 0.28 });
  const accentMaterial = () => new THREE.MeshStandardMaterial({ color: 0xd8ff35, metalness: 0.15, roughness: 0.42 });
  const darkMaterial = () => new THREE.MeshStandardMaterial({ color: 0x242526, metalness: 0.65, roughness: 0.35 });

  function mesh(geometry, material, position, rotation = [0, 0, 0]) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position);
    item.rotation.set(...rotation);
    item.castShadow = true;
    item.receiveShadow = true;
    return item;
  }

  function robotAssembly() {
    const group = new THREE.Group();
    const metal = defaultMaterial();
    const dark = darkMaterial();
    const accent = accentMaterial();
    group.add(mesh(new THREE.BoxGeometry(4.8, .25, 3.5), metal, [0, -.55, 0]));
    [[-2.05, -1.8], [2.05, -1.8], [-2.05, 1.8], [2.05, 1.8]].forEach(([x, z]) => {
      group.add(mesh(new THREE.CylinderGeometry(.54, .54, .42, 24), dark, [x, -.68, z], [0, 0, Math.PI / 2]));
      group.add(mesh(new THREE.CylinderGeometry(.22, .22, .5, 18), accent, [x, -.68, z], [0, 0, Math.PI / 2]));
    });
    [-1.65, 1.65].forEach((x) => group.add(mesh(new THREE.BoxGeometry(.18, 3.4, .18), metal, [x, .95, .65])));
    group.add(mesh(new THREE.BoxGeometry(3.6, .22, .8), metal, [0, 2.5, .65]));
    group.add(mesh(new THREE.BoxGeometry(2.25, .18, 1.05), accent, [0, 1.15, -.55], [-.25, 0, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.38, .38, 2.6, 24), dark, [0, 1.2, .75], [0, 0, Math.PI / 2]));
    group.add(mesh(new THREE.BoxGeometry(.8, .45, .65), dark, [0, 2.55, .6]));
    return group;
  }

  function cameraMount() {
    const group = new THREE.Group();
    const metal = defaultMaterial();
    const dark = darkMaterial();
    const accent = accentMaterial();
    group.add(mesh(new THREE.BoxGeometry(4.6, .28, 3.2), metal, [0, -1.1, 0]));
    group.add(mesh(new THREE.BoxGeometry(.3, 3.4, 2.5), metal, [-1.8, .45, 0]));
    group.add(mesh(new THREE.BoxGeometry(2.4, 1.65, 1.9), dark, [.25, .65, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.58, .58, .5, 32), accent, [1.68, .75, 0], [0, 0, Math.PI / 2]));
    group.add(mesh(new THREE.CylinderGeometry(.26, .26, .58, 32), dark, [1.82, .75, 0], [0, 0, Math.PI / 2]));
    [[-1.8, -1.15], [1.8, -1.15]].forEach(([x, y]) => group.add(mesh(new THREE.CylinderGeometry(.12, .12, .36, 18), dark, [x, y, 1.05])));
    return group;
  }

  function visionAssembly() {
    const group = new THREE.Group();
    const metal = defaultMaterial();
    const dark = darkMaterial();
    const accent = accentMaterial();
    group.add(mesh(new THREE.CylinderGeometry(2.5, 2.8, .35, 8), metal, [0, -1.15, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.35, .5, 2.7, 20), metal, [0, .15, 0]));
    group.add(mesh(new THREE.BoxGeometry(3.3, .25, .5), metal, [0, 1.5, 0], [0, 0, -.15]));
    group.add(mesh(new THREE.BoxGeometry(1.6, 1.05, 1.15), dark, [1.15, 1.33, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.35, .35, .35, 24), accent, [2.05, 1.33, 0], [0, 0, Math.PI / 2]));
    [-1.25, 0, 1.25].forEach((x, index) => group.add(mesh(new THREE.BoxGeometry(.65, .48, .8), index === 1 ? accent : dark, [x, -.72, 1.35])));
    return group;
  }

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
    const factories = { robot: robotAssembly, camera: cameraMount, vision: visionAssembly };
    try {
      if (projects[keyName].file) {
        document.querySelector('#viewer-status').textContent = 'LOADING CAD ASSEMBLY';
        const result = await gltfLoader.loadAsync(projects[keyName].file);
        showModel(result.scene, projects[keyName]);
      } else {
        requestAnimationFrame(() => showModel(factories[keyName](), projects[keyName]));
      }
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
  selectProject('midkey');
  resize();
  animate();
}
