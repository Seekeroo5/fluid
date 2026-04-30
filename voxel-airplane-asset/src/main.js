import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBiopunkAircraft } from './aircraft/biopunkAircraft.js';
import { createCyberpunkAircraft } from './aircraft/cyberpunkAircraft.js';
import { createSciFiAircraft } from './aircraft/sciFiAircraft.js';
import { createMythicAircraft } from './aircraft/mythicAircraft.js';
import { createSolarpunkAircraft } from './aircraft/solarpunkAircraft.js';
import { createSteampunkAircraft } from './aircraft/steampunkAircraft.js';
import { createEditor } from './editor.js';
import './styles.css';

const app = document.querySelector('#app');
const editorMount = document.querySelector('#editor');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182a38);
scene.fog = new THREE.Fog(0x182a38, 32, 84);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(14, 9, 16);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.2, 0);
controls.minDistance = 9;
controls.maxDistance = 42;
controls.maxPolarAngle = Math.PI * 0.48;

const hemiLight = new THREE.HemisphereLight(0xdff7ff, 0x26341f, 2.2);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(10, 16, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -18;
keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8fe7ff, 0.8);
fillLight.position.set(-12, 7, -10);
scene.add(fillLight);

const platform = new THREE.Mesh(
  new THREE.BoxGeometry(28, 0.45, 20),
  new THREE.MeshStandardMaterial({ color: 0x304a42, roughness: 0.75, metalness: 0.05 }),
);
platform.position.y = -2.25;
platform.receiveShadow = true;
scene.add(platform);

const grid = new THREE.GridHelper(28, 28, 0x95d8bd, 0x4c6d63);
grid.position.y = -1.99;
scene.add(grid);

const state = {
  aircraftType: 'sciFi',
  scale: 1,
  animationSpeed: 1,
  idleRotation: true,
};

const creators = {
  sciFi: createSciFiAircraft,
  mythic: createMythicAircraft,
  cyberpunk: createCyberpunkAircraft,
  steampunk: createSteampunkAircraft,
  solarpunk: createSolarpunkAircraft,
  biopunk: createBiopunkAircraft,
};

let activeAircraft = null;
let editor = null;

function createActiveAircraft(type) {
  if (activeAircraft) {
    scene.remove(activeAircraft.group);
    activeAircraft.dispose();
  }

  activeAircraft = creators[type]({
    scale: state.scale,
    animationSpeed: state.animationSpeed,
  });
  scene.add(activeAircraft.group);
  controls.target.set(0, 0.15, 0);
  controls.update();
}

function setAircraftType(type) {
  state.aircraftType = type;
  createActiveAircraft(type);
  editor.render();
}

function resetActiveAircraft() {
  state.scale = 1;
  state.animationSpeed = 1;
  createActiveAircraft(state.aircraftType);
  editor.render();
}

function setIdleRotation(enabled) {
  state.idleRotation = enabled;
}

createActiveAircraft(state.aircraftType);

editor = createEditor({
  mount: editorMount,
  state,
  getActiveAircraft: () => activeAircraft,
  setAircraftType,
  setIdleRotation,
  resetActiveAircraft,
});

const hint = document.createElement('div');
hint.className = 'hud-chip';
hint.textContent = 'Drag to orbit. Scroll to zoom.';
document.body.append(hint);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  activeAircraft.update(delta);
  if (state.idleRotation) activeAircraft.group.rotation.y += delta * 0.28;

  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
animate();
