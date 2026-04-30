import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  brass: 0xc28b35,
  copper: 0x9c5634,
  canvas: 0xd8c28c,
  wood: 0x6a3f24,
  smoke: 0x7c8584,
  glow: 0xffb65c,
};

const blocks = [
  { part: 'boilerBody', material: 'copper', size: [2.35, 1.35, 2.2], position: [0, 0, 1.25] },
  { part: 'boilerBody', material: 'brass', size: [2.8, 1.15, 2.3], position: [0, 0, -0.85] },
  { part: 'boilerBody', material: 'wood', size: [1.75, 0.85, 1.35], position: [0, -0.05, -2.65] },
  { part: 'noseBoiler', material: 'brass', size: [1.35, 1.05, 0.95], position: [0, 0, -3.75] },
  { part: 'noseBoiler', material: 'glow', size: [0.72, 0.62, 0.28], position: [0, 0, -4.38] },
  { part: 'cockpit', material: 'smoke', size: [1.05, 0.68, 0.95], position: [0, 1.05, -1.55] },
  { part: 'canvasWings', material: 'canvas', size: [4.1, 0.22, 1.15], position: [-3.15, 0.08, -0.25] },
  { part: 'canvasWings', material: 'canvas', size: [4.1, 0.22, 1.15], position: [3.15, 0.08, -0.25] },
  { part: 'canvasWings', material: 'canvas', size: [3.6, 0.2, 0.9], position: [-5.45, 0.02, -0.95] },
  { part: 'canvasWings', material: 'canvas', size: [3.6, 0.2, 0.9], position: [5.45, 0.02, -0.95] },
  { part: 'struts', material: 'wood', size: [0.22, 1.25, 0.22], position: [-2.7, -0.5, -0.45] },
  { part: 'struts', material: 'wood', size: [0.22, 1.25, 0.22], position: [2.7, -0.5, -0.45] },
  { part: 'struts', material: 'wood', size: [0.22, 1.1, 0.22], position: [-5.2, -0.48, -0.95] },
  { part: 'struts', material: 'wood', size: [0.22, 1.1, 0.22], position: [5.2, -0.48, -0.95] },
  { part: 'struts', material: 'brass', size: [5.8, 0.16, 0.16], position: [-3.5, -0.92, -0.68] },
  { part: 'struts', material: 'brass', size: [5.8, 0.16, 0.16], position: [3.5, -0.92, -0.68] },
  { part: 'propeller', material: 'wood', size: [0.42, 3.8, 0.24], position: [0, 0, -4.85] },
  { part: 'propeller', material: 'wood', size: [3.8, 0.42, 0.24], position: [0, 0, -4.86] },
  { part: 'propeller', material: 'brass', size: [0.76, 0.76, 0.45], position: [0, 0, -4.65] },
  { part: 'smokestacks', material: 'smoke', size: [0.36, 1.15, 0.36], position: [-0.55, 1.25, 0.85] },
  { part: 'smokestacks', material: 'smoke', size: [0.36, 1.15, 0.36], position: [0.55, 1.25, 0.85] },
  { part: 'smokestacks', material: 'glow', size: [0.52, 0.18, 0.52], position: [-0.55, 1.9, 0.85] },
  { part: 'smokestacks', material: 'glow', size: [0.52, 0.18, 0.52], position: [0.55, 1.9, 0.85] },
  { part: 'tailRudder', material: 'canvas', size: [0.42, 1.75, 1.2], position: [0, 1, 2.65] },
  { part: 'tailRudder', material: 'wood', size: [2.4, 0.28, 1.2], position: [0, 0.24, 2.75] },
  { part: 'gear', material: 'wood', size: [0.3, 0.3, 2.5], position: [-0.9, -1.08, -0.4] },
  { part: 'gear', material: 'wood', size: [0.3, 0.3, 2.5], position: [0.9, -1.08, -0.4] },
  { part: 'gear', material: 'brass', size: [0.55, 0.55, 0.32], position: [-0.9, -1.1, -1.75] },
  { part: 'gear', material: 'brass', size: [0.55, 0.55, 0.32], position: [0.9, -1.1, -1.75] },
];

export function createSteampunkAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'SteampunkVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    brass: { color: colors.brass, roughness: 0.38, metalness: 0.48 },
    copper: { color: colors.copper, roughness: 0.45, metalness: 0.35 },
    canvas: { color: colors.canvas, roughness: 0.86 },
    wood: { color: colors.wood, roughness: 0.75 },
    smoke: { color: colors.smoke, opacity: 0.74, roughness: 0.6 },
    glow: { color: colors.glow, emissive: colors.glow, emissiveIntensity: 0.75, roughness: 0.35 },
  });

  createVoxelCluster(group, blocks, materials, parts);
  group.scale.setScalar(options.scale ?? 1);

  let elapsed = 0;
  let animationSpeed = options.animationSpeed ?? 1;

  return {
    group,
    parts,
    palette: colors,
    colorParts: ['brass', 'copper', 'canvas', 'wood', 'smoke', 'glow'],
    toggleParts: ['smokestacks', 'gear', 'struts', 'propeller'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.glow, elapsed, 3.4, 0.65, 0.22);
      if (parts.propeller?.visible) parts.propeller.rotation.z += delta * animationSpeed * 7;
      group.position.y = Math.sin(elapsed * 1.15) * 0.07;
    },
    setColor(partName, color) {
      if (materials[partName]) {
        materials[partName].color.set(color);
        if (materials[partName].emissiveIntensity > 0) materials[partName].emissive.set(color);
      } else if (parts[partName]) {
        setGroupMaterialColor(parts[partName], color);
      }
    },
    setPartVisible(partName, visible) {
      if (parts[partName]) parts[partName].visible = visible;
    },
    setScale(scale) {
      group.scale.setScalar(scale);
    },
    setAnimationSpeed(speed) {
      animationSpeed = speed;
    },
    dispose() {
      disposeGroup(group);
    },
  };
}
