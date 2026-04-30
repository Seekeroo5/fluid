import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  ceramic: 0xf4f1dc,
  leaf: 0x4fbf73,
  solar: 0x173b4d,
  flower: 0xffd166,
  glass: 0x9ee8d8,
  vine: 0x2f7d4d,
};

const petalBlocks = [];
for (let side of [-1, 1]) {
  for (let i = 0; i < 5; i += 1) {
    petalBlocks.push({
      part: 'leafWings',
      material: i % 2 === 0 ? 'leaf' : 'ceramic',
      size: [2.4 - i * 0.18, 0.2, 0.72],
      position: [side * (2.5 + i * 1.05), -0.1 + i * 0.03, -0.55 + i * 0.38],
    });
  }
}

const blocks = [
  { part: 'body', material: 'ceramic', size: [2.2, 1.05, 1.95], position: [0, 0, 1.65] },
  { part: 'body', material: 'ceramic', size: [2.75, 1.18, 2.2], position: [0, 0, -0.35] },
  { part: 'body', material: 'leaf', size: [1.95, 0.86, 1.45], position: [0, -0.02, -2.15] },
  { part: 'noseBloom', material: 'flower', size: [1.05, 0.72, 0.82], position: [0, 0, -3.25] },
  { part: 'noseBloom', material: 'glass', size: [0.55, 0.38, 0.38], position: [0, 0.02, -3.82] },
  { part: 'canopy', material: 'glass', size: [1.12, 0.58, 1.05], position: [0, 0.92, -0.95] },
  { part: 'canopy', material: 'vine', size: [1.36, 0.18, 1.25], position: [0, 0.62, -0.95] },
  { part: 'solarPanels', material: 'solar', size: [2.5, 0.12, 0.78], position: [-2.45, 0.18, -0.2] },
  { part: 'solarPanels', material: 'solar', size: [2.5, 0.12, 0.78], position: [2.45, 0.18, -0.2] },
  { part: 'solarPanels', material: 'solar', size: [2.1, 0.12, 0.6], position: [-4.55, 0.28, 0.25] },
  { part: 'solarPanels', material: 'solar', size: [2.1, 0.12, 0.6], position: [4.55, 0.28, 0.25] },
  ...petalBlocks,
  { part: 'vineRails', material: 'vine', size: [5.4, 0.16, 0.16], position: [-3.55, -0.42, -0.22] },
  { part: 'vineRails', material: 'vine', size: [5.4, 0.16, 0.16], position: [3.55, -0.42, -0.22] },
  { part: 'vineRails', material: 'vine', size: [0.22, 0.78, 0.22], position: [-2.2, -0.28, 0.1] },
  { part: 'vineRails', material: 'vine', size: [0.22, 0.78, 0.22], position: [2.2, -0.28, 0.1] },
  { part: 'seedThrusters', material: 'leaf', size: [0.95, 0.95, 1.1], position: [-1.15, -0.1, 2.8] },
  { part: 'seedThrusters', material: 'leaf', size: [0.95, 0.95, 1.1], position: [1.15, -0.1, 2.8] },
  { part: 'seedThrusters', material: 'flower', size: [0.58, 0.58, 0.34], position: [-1.15, -0.1, 3.48] },
  { part: 'seedThrusters', material: 'flower', size: [0.58, 0.58, 0.34], position: [1.15, -0.1, 3.48] },
  { part: 'tailGarden', material: 'leaf', size: [0.42, 1.45, 1.15], position: [0, 0.9, 2.65] },
  { part: 'tailGarden', material: 'flower', size: [0.38, 0.38, 0.38], position: [-0.68, 1.52, 2.55] },
  { part: 'tailGarden', material: 'flower', size: [0.38, 0.38, 0.38], position: [0.68, 1.52, 2.55] },
  { part: 'tailGarden', material: 'ceramic', size: [2.3, 0.24, 1.1], position: [0, 0.22, 2.62] },
  { part: 'gardenPods', material: 'glass', size: [0.62, 0.62, 0.62], position: [-1.25, 0.78, 0.6] },
  { part: 'gardenPods', material: 'glass', size: [0.62, 0.62, 0.62], position: [1.25, 0.78, 0.6] },
  { part: 'gardenPods', material: 'flower', size: [0.3, 0.3, 0.3], position: [-1.25, 1.2, 0.6] },
  { part: 'gardenPods', material: 'flower', size: [0.3, 0.3, 0.3], position: [1.25, 1.2, 0.6] },
];

export function createSolarpunkAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'SolarpunkVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    ceramic: { color: colors.ceramic, roughness: 0.72, metalness: 0.04 },
    leaf: { color: colors.leaf, roughness: 0.82 },
    solar: { color: colors.solar, emissive: colors.solar, emissiveIntensity: 0.18, roughness: 0.22, metalness: 0.18 },
    flower: { color: colors.flower, emissive: colors.flower, emissiveIntensity: 0.42, roughness: 0.44 },
    glass: { color: colors.glass, emissive: colors.glass, emissiveIntensity: 0.25, opacity: 0.66, roughness: 0.2 },
    vine: { color: colors.vine, roughness: 0.8 },
  });

  createVoxelCluster(group, blocks, materials, parts);
  group.scale.setScalar(options.scale ?? 1);

  let elapsed = 0;
  let animationSpeed = options.animationSpeed ?? 1;

  return {
    group,
    parts,
    palette: colors,
    colorParts: ['ceramic', 'leaf', 'solar', 'flower', 'glass', 'vine'],
    toggleParts: ['solarPanels', 'vineRails', 'gardenPods', 'seedThrusters'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.flower, elapsed, 2.8, 0.4, 0.16);
      pulseMaterial(materials.glass, elapsed, 2.2, 0.24, 0.08);
      group.position.y = Math.sin(elapsed * 1) * 0.08;
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
