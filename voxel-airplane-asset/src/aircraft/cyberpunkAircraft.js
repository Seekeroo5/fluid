import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  shell: 0x141923,
  neonPink: 0xff2bd6,
  neonCyan: 0x20f4ff,
  glass: 0x6df7ff,
  carbon: 0x303845,
  warning: 0xffe05a,
};

const blocks = [
  { part: 'hull', material: 'shell', size: [2.2, 1, 2], position: [0, 0, 2.2] },
  { part: 'hull', material: 'shell', size: [3.1, 1.2, 2.4], position: [0, 0, 0] },
  { part: 'hull', material: 'carbon', size: [2.6, 0.9, 1.9], position: [0, -0.05, -2.15] },
  { part: 'nose', material: 'shell', size: [1.65, 0.72, 1], position: [0, 0, -3.75] },
  { part: 'nose', material: 'neonCyan', size: [0.62, 0.34, 0.38], position: [0, 0.04, -4.42] },
  { part: 'canopy', material: 'glass', size: [1.1, 0.58, 1.25], position: [0, 0.92, -1.2] },
  { part: 'canopy', material: 'glass', size: [0.72, 0.46, 0.8], position: [0, 1.05, -2.05] },
  { part: 'billboards', material: 'neonPink', size: [0.22, 0.82, 1.4], position: [-1.72, 0.52, 0.25] },
  { part: 'billboards', material: 'neonCyan', size: [0.22, 0.82, 1.4], position: [1.72, 0.52, 0.25] },
  { part: 'wings', material: 'carbon', size: [3.4, 0.24, 1.1], position: [-3.3, -0.1, -0.2] },
  { part: 'wings', material: 'carbon', size: [3.4, 0.24, 1.1], position: [3.3, -0.1, -0.2] },
  { part: 'wings', material: 'shell', size: [3.2, 0.22, 0.88], position: [-5.35, -0.14, -1.1] },
  { part: 'wings', material: 'shell', size: [3.2, 0.22, 0.88], position: [5.35, -0.14, -1.1] },
  { part: 'wings', material: 'neonPink', size: [2.7, 0.18, 0.2], position: [-5.5, 0.06, -1.55] },
  { part: 'wings', material: 'neonPink', size: [2.7, 0.18, 0.2], position: [5.5, 0.06, -1.55] },
  { part: 'wingTips', material: 'neonCyan', size: [0.48, 0.48, 1.15], position: [-7.25, 0.05, -1.2] },
  { part: 'wingTips', material: 'neonCyan', size: [0.48, 0.48, 1.15], position: [7.25, 0.05, -1.2] },
  { part: 'ductFans', material: 'carbon', size: [1.2, 1.2, 0.52], position: [-2.35, -0.35, 2.65] },
  { part: 'ductFans', material: 'carbon', size: [1.2, 1.2, 0.52], position: [2.35, -0.35, 2.65] },
  { part: 'ductFans', material: 'neonCyan', size: [0.68, 0.68, 0.22], position: [-2.35, -0.35, 2.98] },
  { part: 'ductFans', material: 'neonCyan', size: [0.68, 0.68, 0.22], position: [2.35, -0.35, 2.98] },
  { part: 'tailFins', material: 'shell', size: [0.38, 1.8, 1.1], position: [-0.65, 1.05, 2.95] },
  { part: 'tailFins', material: 'shell', size: [0.38, 1.8, 1.1], position: [0.65, 1.05, 2.95] },
  { part: 'tailFins', material: 'neonPink', size: [0.22, 0.78, 0.85], position: [-1.15, 1.42, 3.1] },
  { part: 'tailFins', material: 'neonPink', size: [0.22, 0.78, 0.85], position: [1.15, 1.42, 3.1] },
  { part: 'dataSpines', material: 'warning', size: [0.32, 0.22, 0.32], position: [0, 1.02, 1.55] },
  { part: 'dataSpines', material: 'neonPink', size: [0.32, 0.22, 0.32], position: [0, 1.16, 0.75] },
  { part: 'dataSpines', material: 'neonCyan', size: [0.32, 0.22, 0.32], position: [0, 1.2, -0.05] },
];

export function createCyberpunkAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'CyberpunkVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    shell: { color: colors.shell, roughness: 0.5, metalness: 0.35 },
    neonPink: { color: colors.neonPink, emissive: colors.neonPink, emissiveIntensity: 1.2, roughness: 0.25 },
    neonCyan: { color: colors.neonCyan, emissive: colors.neonCyan, emissiveIntensity: 1.2, roughness: 0.25 },
    glass: { color: colors.glass, emissive: colors.glass, emissiveIntensity: 0.4, opacity: 0.68, roughness: 0.18 },
    carbon: { color: colors.carbon, roughness: 0.62, metalness: 0.25 },
    warning: { color: colors.warning, emissive: colors.warning, emissiveIntensity: 0.45, roughness: 0.36 },
  });

  createVoxelCluster(group, blocks, materials, parts);
  group.scale.setScalar(options.scale ?? 1);

  let elapsed = 0;
  let animationSpeed = options.animationSpeed ?? 1;

  return {
    group,
    parts,
    palette: colors,
    colorParts: ['shell', 'neonPink', 'neonCyan', 'glass', 'carbon', 'warning'],
    toggleParts: ['billboards', 'ductFans', 'wingTips', 'dataSpines'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.neonPink, elapsed, 8, 1.05, 0.42);
      pulseMaterial(materials.neonCyan, elapsed, 6.5, 1.1, 0.36);
      group.position.y = Math.sin(elapsed * 1.8) * 0.09;
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
