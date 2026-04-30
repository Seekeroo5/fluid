import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  hull: 0xd9e3ea,
  armor: 0x4d6575,
  cockpit: 0x7ee7ff,
  engine: 0x25f0ff,
  accent: 0xffc857,
  weapon: 0x1b2430,
};

const blockRows = [
  { part: 'fuselage', material: 'hull', size: [2.8, 1.2, 2], position: [0, 0, 2.8] },
  { part: 'fuselage', material: 'hull', size: [3.6, 1.4, 2.4], position: [0, 0, 0.6] },
  { part: 'fuselage', material: 'hull', size: [4.2, 1.3, 2.4], position: [0, 0, -1.8] },
  { part: 'fuselage', material: 'hull', size: [3.2, 1.1, 2], position: [0, -0.05, -4] },
  { part: 'armor', material: 'armor', size: [2.2, 0.45, 1.4], position: [0, 0.95, 1.4] },
  { part: 'armor', material: 'armor', size: [3, 0.42, 1.4], position: [0, 1.02, -1.2] },
  { part: 'armor', material: 'armor', size: [2.2, 0.35, 1.2], position: [0, -0.92, -0.6] },
  { part: 'nose', material: 'hull', size: [2.1, 1.05, 1.2], position: [0, 0, -5.6] },
  { part: 'nose', material: 'armor', size: [1.35, 0.82, 0.85], position: [0, 0, -6.6] },
  { part: 'nose', material: 'accent', size: [0.65, 0.45, 0.5], position: [0, 0, -7.25] },
  { part: 'cockpit', material: 'cockpit', size: [1.45, 0.65, 1.25], position: [0, 1.28, -2.6] },
  { part: 'cockpit', material: 'cockpit', size: [1.05, 0.55, 1.05], position: [0, 1.45, -3.5] },
  { part: 'cockpit', material: 'cockpit', size: [0.7, 0.45, 0.8], position: [0, 1.42, -1.75] },
  { part: 'mainWings', material: 'hull', size: [4.8, 0.34, 1.5], position: [-3.8, -0.05, -0.8] },
  { part: 'mainWings', material: 'hull', size: [4.8, 0.34, 1.5], position: [3.8, -0.05, -0.8] },
  { part: 'mainWings', material: 'armor', size: [4.1, 0.28, 1.2], position: [-6.3, -0.1, -1.7] },
  { part: 'mainWings', material: 'armor', size: [4.1, 0.28, 1.2], position: [6.3, -0.1, -1.7] },
  { part: 'mainWings', material: 'hull', size: [2.8, 0.26, 1], position: [-8.6, -0.16, -2.7] },
  { part: 'mainWings', material: 'hull', size: [2.8, 0.26, 1], position: [8.6, -0.16, -2.7] },
  { part: 'mainWings', material: 'armor', size: [2.2, 0.22, 0.8], position: [-2.6, -0.18, 0.65] },
  { part: 'mainWings', material: 'armor', size: [2.2, 0.22, 0.8], position: [2.6, -0.18, 0.65] },
  { part: 'wingTips', material: 'accent', size: [0.75, 0.42, 1.45], position: [-10.25, 0.05, -2.75] },
  { part: 'wingTips', material: 'accent', size: [0.75, 0.42, 1.45], position: [10.25, 0.05, -2.75] },
  { part: 'rearFins', material: 'armor', size: [0.55, 2.4, 1.4], position: [0, 1.3, 3.9] },
  { part: 'rearFins', material: 'hull', size: [1.1, 0.35, 2.6], position: [-2.2, 0.38, 3.6] },
  { part: 'rearFins', material: 'hull', size: [1.1, 0.35, 2.6], position: [2.2, 0.38, 3.6] },
  { part: 'rearFins', material: 'accent', size: [0.45, 0.55, 1], position: [0, 2.75, 4.2] },
  { part: 'engines', material: 'armor', size: [1.15, 1.15, 1.8], position: [-1.45, -0.15, 4.2] },
  { part: 'engines', material: 'armor', size: [1.15, 1.15, 1.8], position: [1.45, -0.15, 4.2] },
  { part: 'thrusters', material: 'engine', size: [0.75, 0.75, 0.55], position: [-1.45, -0.15, 5.35] },
  { part: 'thrusters', material: 'engine', size: [0.75, 0.75, 0.55], position: [1.45, -0.15, 5.35] },
  { part: 'weaponPods', material: 'weapon', size: [0.65, 0.55, 1.75], position: [-4.8, -0.62, -1.15] },
  { part: 'weaponPods', material: 'weapon', size: [0.65, 0.55, 1.75], position: [4.8, -0.62, -1.15] },
  { part: 'weaponPods', material: 'accent', size: [0.48, 0.35, 0.45], position: [-4.8, -0.62, -2.25] },
  { part: 'weaponPods', material: 'accent', size: [0.48, 0.35, 0.45], position: [4.8, -0.62, -2.25] },
  { part: 'antenna', material: 'accent', size: [0.28, 1, 0.28], position: [0, 2.1, 0.35] },
  { part: 'antenna', material: 'engine', size: [0.42, 0.28, 0.42], position: [0, 2.75, 0.35] },
];

export function createSciFiAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'SciFiVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    hull: { color: colors.hull, roughness: 0.52, metalness: 0.28 },
    armor: { color: colors.armor, roughness: 0.45, metalness: 0.38 },
    cockpit: { color: colors.cockpit, emissive: colors.cockpit, emissiveIntensity: 0.28, opacity: 0.72, roughness: 0.2 },
    engine: { color: colors.engine, emissive: colors.engine, emissiveIntensity: 1.1, roughness: 0.25 },
    accent: { color: colors.accent, emissive: colors.accent, emissiveIntensity: 0.35, roughness: 0.4 },
    weapon: { color: colors.weapon, roughness: 0.55, metalness: 0.45 },
  });

  createVoxelCluster(group, blockRows, materials, parts);
  group.scale.setScalar(options.scale ?? 1);

  const visibleParts = options.visibleParts ?? {};
  for (const [partName, visible] of Object.entries(visibleParts)) {
    if (parts[partName]) parts[partName].visible = visible;
  }

  let elapsed = 0;
  let animationSpeed = options.animationSpeed ?? 1;

  return {
    group,
    parts,
    palette: colors,
    colorParts: ['hull', 'armor', 'cockpit', 'engine', 'accent', 'weapon'],
    toggleParts: ['weaponPods', 'antenna', 'thrusters', 'wingTips'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.engine, elapsed, 7, 1.05, 0.42);
      pulseMaterial(materials.accent, elapsed, 4, 0.32, 0.18);
      group.position.y = Math.sin(elapsed * 1.4) * 0.12;
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
