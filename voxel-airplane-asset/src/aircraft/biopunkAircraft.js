import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  bone: 0xd8c8a4,
  flesh: 0x8f3350,
  membrane: 0x7b4d9d,
  vein: 0x55ff99,
  eye: 0xfff06a,
  chitin: 0x2b1f33,
};

const ribBlocks = [];
for (let i = 0; i < 6; i += 1) {
  const z = 1.65 - i * 0.72;
  const width = 2.15 + Math.sin(i * 0.8) * 0.4;
  ribBlocks.push(
    { part: 'ribs', material: 'bone', size: [0.24, 1.25, 0.28], position: [-width / 2, 0.05, z] },
    { part: 'ribs', material: 'bone', size: [0.24, 1.25, 0.28], position: [width / 2, 0.05, z] },
    { part: 'ribs', material: 'bone', size: [width, 0.22, 0.24], position: [0, 0.72, z] },
  );
}

const wingBlocks = [];
for (let side of [-1, 1]) {
  for (let i = 0; i < 5; i += 1) {
    wingBlocks.push({
      part: 'membraneWings',
      material: i % 2 === 0 ? 'membrane' : 'flesh',
      size: [2.25 - i * 0.16, 0.18, 0.72],
      position: [side * (2.1 + i * 1.14), -0.08 - i * 0.04, -0.35 + i * 0.48],
    });
    wingBlocks.push({
      part: 'wingBones',
      material: 'bone',
      size: [2.1 - i * 0.12, 0.16, 0.16],
      position: [side * (2.1 + i * 1.14), 0.13, -0.7 + i * 0.48],
    });
  }
}

const blocks = [
  { part: 'spineHull', material: 'chitin', size: [1.45, 1.05, 2], position: [0, 0, 1.65] },
  { part: 'spineHull', material: 'flesh', size: [1.8, 1.15, 2.15], position: [0, 0, -0.35] },
  { part: 'spineHull', material: 'chitin', size: [1.35, 0.9, 1.45], position: [0, -0.02, -2.15] },
  { part: 'spineHull', material: 'bone', size: [0.34, 0.38, 4.8], position: [0, 0.82, -0.1] },
  ...ribBlocks,
  { part: 'eyeCockpit', material: 'eye', size: [1.05, 0.62, 0.58], position: [0, 0.58, -3.05] },
  { part: 'eyeCockpit', material: 'chitin', size: [1.42, 0.28, 0.32], position: [0, 0.92, -3.1] },
  { part: 'beakNose', material: 'bone', size: [0.9, 0.5, 0.82], position: [0, 0.1, -3.65] },
  { part: 'beakNose', material: 'vein', size: [0.38, 0.24, 0.32], position: [0, 0.12, -4.22] },
  ...wingBlocks,
  { part: 'veinLines', material: 'vein', size: [0.18, 0.18, 2.1], position: [-3.6, 0.08, 0.08] },
  { part: 'veinLines', material: 'vein', size: [0.18, 0.18, 2.1], position: [3.6, 0.08, 0.08] },
  { part: 'veinLines', material: 'vein', size: [0.16, 0.16, 1.6], position: [-5.6, -0.05, 0.62] },
  { part: 'veinLines', material: 'vein', size: [0.16, 0.16, 1.6], position: [5.6, -0.05, 0.62] },
  { part: 'organPods', material: 'flesh', size: [0.86, 0.7, 1.05], position: [-1.05, -0.45, 1.9] },
  { part: 'organPods', material: 'flesh', size: [0.86, 0.7, 1.05], position: [1.05, -0.45, 1.9] },
  { part: 'organPods', material: 'vein', size: [0.48, 0.36, 0.32], position: [-1.05, -0.45, 2.58] },
  { part: 'organPods', material: 'vein', size: [0.48, 0.36, 0.32], position: [1.05, -0.45, 2.58] },
  { part: 'tailStinger', material: 'chitin', size: [0.55, 0.55, 1.9], position: [0, 0, 3.05] },
  { part: 'tailStinger', material: 'bone', size: [0.34, 0.34, 0.9], position: [0, 0, 4.35] },
  { part: 'tailStinger', material: 'vein', size: [0.26, 0.26, 0.28], position: [0, 0, 4.95] },
  { part: 'feelers', material: 'bone', size: [0.18, 0.18, 1.25], position: [-0.62, 0.6, -3.8] },
  { part: 'feelers', material: 'bone', size: [0.18, 0.18, 1.25], position: [0.62, 0.6, -3.8] },
  { part: 'feelers', material: 'eye', size: [0.24, 0.24, 0.24], position: [-0.62, 0.6, -4.55] },
  { part: 'feelers', material: 'eye', size: [0.24, 0.24, 0.24], position: [0.62, 0.6, -4.55] },
];

export function createBiopunkAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'BiopunkVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    bone: { color: colors.bone, roughness: 0.8 },
    flesh: { color: colors.flesh, roughness: 0.62 },
    membrane: { color: colors.membrane, emissive: colors.membrane, emissiveIntensity: 0.16, opacity: 0.72, roughness: 0.36 },
    vein: { color: colors.vein, emissive: colors.vein, emissiveIntensity: 1.05, roughness: 0.3 },
    eye: { color: colors.eye, emissive: colors.eye, emissiveIntensity: 0.95, roughness: 0.24 },
    chitin: { color: colors.chitin, roughness: 0.48, metalness: 0.12 },
  });

  createVoxelCluster(group, blocks, materials, parts);
  group.scale.setScalar(options.scale ?? 1);

  let elapsed = 0;
  let animationSpeed = options.animationSpeed ?? 1;

  return {
    group,
    parts,
    palette: colors,
    colorParts: ['bone', 'flesh', 'membrane', 'vein', 'eye', 'chitin'],
    toggleParts: ['ribs', 'veinLines', 'organPods', 'feelers', 'tailStinger'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.vein, elapsed, 5.8, 1, 0.42);
      pulseMaterial(materials.eye, elapsed, 3.6, 0.85, 0.26);
      if (parts.membraneWings?.visible) {
        parts.membraneWings.scale.y = 1 + Math.sin(elapsed * 2.2) * 0.08;
      }
      if (parts.organPods?.visible) {
        parts.organPods.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.035);
      }
      group.position.y = Math.sin(elapsed * 1.25) * 0.1;
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
