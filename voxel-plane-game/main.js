import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameAudio } from './audio/GameAudio.js';

// ============================================================================
// SCENE SETUP
// ============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Isometric orthographic camera for that voxel game look
const aspect = window.innerWidth / window.innerHeight;
const d = 30;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(50, 50, 50);
camera.lookAt(scene.position);

// Renderer optimized for web
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let gameAudio = null;
setupAudio();

// ============================================================================
// PHYSICS WORLD
// ============================================================================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Physics materials
const groundMaterial = new CANNON.Material('ground');
const planeMaterial = new CANNON.Material('plane');

const planeGroundContact = new CANNON.ContactMaterial(groundMaterial, planeMaterial, {
  friction: 0.3,
  restitution: 0.5,
});
world.addContactMaterial(planeGroundContact);

// ============================================================================
// GROUND (Voxel Style)
// ============================================================================
const groundSize = 200;
const groundGeo = new THREE.BoxGeometry(groundSize, 1, groundSize);
const groundMat = new THREE.MeshStandardMaterial({ 
  color: 0x4a7c23,
  flatShading: true,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// Ground physics body
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(groundSize / 2, 0.5, groundSize / 2)),
  material: groundMaterial,
});
world.addBody(groundBody);

// Add some voxel-style ground details (grass blocks)
function createVoxelBlock(x, z, color = 0x3d6b1c) {
  const size = 2;
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshStandardMaterial({ 
    color, 
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, size / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// Scatter some blocks
for (let i = 0; i < 30; i++) {
  const x = (Math.random() - 0.5) * 150;
  const z = (Math.random() - 0.5) * 150;
  createVoxelBlock(x, z);
}

// ============================================================================
// VOXEL AIRPLANE
// ============================================================================
const airplane = new THREE.Group();

// Voxel colors
const colors = {
  fuselage: 0xE74C3C,
  wing: 0xECF0F1,
  tail: 0x3498DB,
  propeller: 0x2C3E50,
  cockpit: 0x95A5A6,
};

// Create voxel box helper
function createVoxelBox(width, height, depth, color, position = { x: 0, y: 0, z: 0 }) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial({ 
    color, 
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Fuselage (main body) - made of multiple voxel blocks
const fuselage1 = createVoxelBox(2, 2, 6, colors.fuselage, { x: 0, y: 0, z: 0 });
const fuselage2 = createVoxelBox(2, 2, 2, colors.fuselage, { x: 0, y: 0, z: -4 });
airplane.add(fuselage1, fuselage2);

// Wings
const leftWing = createVoxelBox(6, 0.5, 3, colors.wing, { x: -4, y: 0, z: 1 });
const rightWing = createVoxelBox(6, 0.5, 3, colors.wing, { x: 4, y: 0, z: 1 });
airplane.add(leftWing, rightWing);

// Tail
const tailVertical = createVoxelBox(0.5, 3, 2, colors.tail, { x: 0, y: 1.5, z: 4 });
const tailHorizontal = createVoxelBox(3, 0.5, 2, colors.tail, { x: 0, y: 0, z: 4.5 });
airplane.add(tailVertical, tailHorizontal);

// Cockpit
const cockpit = createVoxelBox(1.5, 1.5, 2, colors.cockpit, { x: 0, y: 1.25, z: -1 });
airplane.add(cockpit);

// Propeller
const propellerHub = createVoxelBox(0.5, 0.5, 0.5, colors.propeller, { x: 0, y: 0, z: -5 });
const propellerBlade = createVoxelBox(3, 0.3, 0.5, colors.propeller, { x: 0, y: 0, z: -5.2 });
airplane.add(propellerHub, propellerBlade);

scene.add(airplane);

// Physics body for airplane
const planeShape = new CANNON.Box(new CANNON.Vec3(3, 1.5, 7));
const airplaneBody = new CANNON.Body({
  mass: 100,
  material: planeMaterial,
  linearDamping: 0.5,
  angularDamping: 0.5,
});
airplaneBody.addShape(planeShape);
airplaneBody.position.set(0, 5, 0);
world.addBody(airplaneBody);

// ============================================================================
// LIGHTING
// ============================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// ============================================================================
// CONTROLS
// ============================================================================
const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  rotateLeft: false,
  rotateRight: false,
};

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW': keys.forward = true; break;
    case 'KeyS': keys.backward = true; break;
    case 'KeyA': keys.left = true; break;
    case 'KeyD': keys.right = true; break;
    case 'Space': keys.up = true; break;
    case 'ShiftLeft': keys.down = true; break;
    case 'KeyQ': keys.rotateLeft = true; break;
    case 'KeyE': keys.rotateRight = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': keys.forward = false; break;
    case 'KeyS': keys.backward = false; break;
    case 'KeyA': keys.left = false; break;
    case 'KeyD': keys.right = false; break;
    case 'Space': keys.up = false; break;
    case 'ShiftLeft': keys.down = false; break;
    case 'KeyQ': keys.rotateLeft = false; break;
    case 'KeyE': keys.rotateRight = false; break;
  }
});

// ============================================================================
// GAME LOOP
// ============================================================================
const clock = new THREE.Clock();
const speed = 30;
const rotationSpeed = 2;
const verticalSpeed = 20;

function playMissileImpactExplosion(position) {
  if (!gameAudio) return;
  gameAudio.playExplosionAt(position);
}

async function setupAudio() {
  gameAudio = new GameAudio(scene, camera, { assetUrl: '/audio/cartoon-explosion.wav' });

  const unlock = async () => {
    try {
      await gameAudio.unlockAudio();
    } finally {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  try {
    await gameAudio.init();
  } catch (error) {
    console.warn('Audio init failed:', error);
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = Math.min(clock.getDelta(), 0.1);
  
  // Apply forces based on input
  const force = new CANNON.Vec3(0, 0, 0);
  const torque = new CANNON.Vec3(0, 0, 0);
  
  // Get airplane's forward direction
  const forward = new CANNON.Vec3(0, 0, -1);
  airplaneBody.quaternion.vmult(forward, forward);
  
  // Forward/Backward
  if (keys.forward) {
    force.x += forward.x * speed;
    force.z += forward.z * speed;
  }
  if (keys.backward) {
    force.x -= forward.x * speed * 0.5;
    force.z -= forward.z * speed * 0.5;
  }
  
  // Left/Right (strafe)
  const right = new CANNON.Vec3(1, 0, 0);
  airplaneBody.quaternion.vmult(right, right);
  if (keys.left) {
    force.x -= right.x * speed * 0.5;
    force.z -= right.z * speed * 0.5;
  }
  if (keys.right) {
    force.x += right.x * speed * 0.5;
    force.z += right.z * speed * 0.5;
  }
  
  // Up/Down
  if (keys.up) {
    force.y += verticalSpeed;
  }
  if (keys.down) {
    force.y -= verticalSpeed;
  }
  
  // Rotation
  if (keys.rotateLeft) {
    torque.y += rotationSpeed;
  }
  if (keys.rotateRight) {
    torque.y -= rotationSpeed;
  }
  
  // Apply forces
  airplaneBody.applyForce(force, airplaneBody.position);
  airplaneBody.angularVelocity.y += torque.y * delta;
  
  // Update physics
  world.step(1 / 60, delta, 3);
  
  // Sync visual mesh with physics body
  airplane.position.copy(airplaneBody.position);
  airplane.quaternion.copy(airplaneBody.quaternion);
  
  // Rotate propeller
  propellerBlade.rotation.z += 20 * delta;
  
  // Camera follows airplane (isometric view maintained)
  const offset = new THREE.Vector3(50, 50, 50);
  camera.position.x = airplane.position.x + offset.x;
  camera.position.y = airplane.position.y + offset.y;
  camera.position.z = airplane.position.z + offset.z;
  camera.lookAt(airplane.position);
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
