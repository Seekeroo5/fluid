import * as THREE from 'three';
import {
  createPaletteMaterialMap,
  createVoxelCluster,
  disposeGroup,
  pulseMaterial,
  setGroupMaterialColor,
} from './voxelHelpers.js';

const defaultColors = {
  body: 0xb98245,
  trim: 0xffd36a,
  crystal: 0x9cf6ff,
  wing: 0xf7f0d2,
  rune: 0x7cffb2,
  shadow: 0x4b2f24,
};

const featherBlocks = [];
for (let side of [-1, 1]) {
  for (let i = 0; i < 6; i += 1) {
    featherBlocks.push({
      part: 'featherWings',
      material: i % 2 === 0 ? 'wing' : 'trim',
      size: [2.25 - i * 0.14, 0.24, 0.55],
      position: [side * (2.7 + i * 1.28), -0.12 - i * 0.03, -0.65 + i * 0.52],
    });
  }
}

const blockRows = [
  { part: 'body', material: 'body', size: [2.4, 1.25, 2.1], position: [0, 0, 1.8] },
  { part: 'body', material: 'body', size: [2.9, 1.35, 2.35], position: [0, 0, -0.25] },
  { part: 'body', material: 'body', size: [2.1, 1, 1.7], position: [0, 0, -2.25] },
  { part: 'body', material: 'trim', size: [1.65, 0.32, 1.4], position: [0, 0.86, 0.4] },
  { part: 'body', material: 'shadow', size: [1.7, 0.35, 1.35], position: [0, -0.82, 0.25] },
  { part: 'crystalNose', material: 'crystal', size: [1.55, 0.85, 1], position: [0, 0, -3.35] },
  { part: 'crystalNose', material: 'crystal', size: [0.95, 0.62, 0.8], position: [0, 0.03, -4.08] },
  { part: 'crystalNose', material: 'rune', size: [0.42, 0.36, 0.42], position: [0, 0.04, -4.68] },
  { part: 'canopy', material: 'crystal', size: [1.15, 0.68, 1.05], position: [0, 1.02, -0.9] },
  { part: 'canopy', material: 'trim', size: [1.4, 0.2, 1.25], position: [0, 0.68, -0.9] },
  { part: 'innerWings', material: 'body', size: [3.2, 0.42, 1.35], position: [-2.2, -0.02, 0.2] },
  { part: 'innerWings', material: 'body', size: [3.2, 0.42, 1.35], position: [2.2, -0.02, 0.2] },
  { part: 'innerWings', material: 'trim', size: [2.7, 0.28, 0.68], position: [-4.2, 0.1, -0.2] },
  { part: 'innerWings', material: 'trim', size: [2.7, 0.28, 0.68], position: [4.2, 0.1, -0.2] },
  ...featherBlocks,
  { part: 'tailFan', material: 'wing', size: [0.62, 0.28, 2.15], position: [0, 0.08, 3.28] },
  { part: 'tailFan', material: 'wing', size: [0.62, 0.28, 1.95], position: [-0.82, 0.22, 3.18] },
  { part: 'tailFan', material: 'wing', size: [0.62, 0.28, 1.95], position: [0.82, 0.22, 3.18] },
  { part: 'tailFan', material: 'trim', size: [0.46, 0.42, 1.42], position: [-1.5, 0.34, 3.02] },
  { part: 'tailFan', material: 'trim', size: [0.46, 0.42, 1.42], position: [1.5, 0.34, 3.02] },
  { part: 'runeBlocks', material: 'rune', size: [0.32, 0.28, 0.32], position: [-1.18, 0.72, -0.25] },
  { part: 'runeBlocks', material: 'rune', size: [0.32, 0.28, 0.32], position: [1.18, 0.72, -0.25] },
  { part: 'runeBlocks', material: 'rune', size: [0.28, 0.24, 0.28], position: [-3.6, 0.38, -0.72] },
  { part: 'runeBlocks', material: 'rune', size: [0.28, 0.24, 0.28], position: [3.6, 0.38, -0.72] },
  { part: 'runeBlocks', material: 'rune', size: [0.28, 0.24, 0.28], position: [-6.2, 0.18, 0.3] },
  { part: 'runeBlocks', material: 'rune', size: [0.28, 0.24, 0.28], position: [6.2, 0.18, 0.3] },
  { part: 'skyCrystals', material: 'crystal', size: [0.42, 0.7, 0.42], position: [-2.1, 1.05, 0.75] },
  { part: 'skyCrystals', material: 'crystal', size: [0.42, 0.7, 0.42], position: [2.1, 1.05, 0.75] },
  { part: 'skyCrystals', material: 'rune', size: [0.28, 0.42, 0.28], position: [-2.7, 0.86, -1.2] },
  { part: 'skyCrystals', material: 'rune', size: [0.28, 0.42, 0.28], position: [2.7, 0.86, -1.2] },
  { part: 'landingSkids', material: 'shadow', size: [0.26, 0.26, 3], position: [-0.85, -1.05, 0.1] },
  { part: 'landingSkids', material: 'shadow', size: [0.26, 0.26, 3], position: [0.85, -1.05, 0.1] },
  { part: 'landingSkids', material: 'trim', size: [0.28, 0.58, 0.28], position: [-0.85, -0.72, -1] },
  { part: 'landingSkids', material: 'trim', size: [0.28, 0.58, 0.28], position: [0.85, -0.72, -1] },
  { part: 'landingSkids', material: 'trim', size: [0.28, 0.58, 0.28], position: [-0.85, -0.72, 1.05] },
  { part: 'landingSkids', material: 'trim', size: [0.28, 0.58, 0.28], position: [0.85, -0.72, 1.05] },
];

function addHalo(parts, materials) {
  const halo = new THREE.Group();
  halo.name = 'haloRing';
  halo.position.set(0, 1.55, 3.65);
  parts.haloRing = halo;

  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 2.25;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 0.64),
      i % 2 === 0 ? materials.trim : materials.rune,
    );
    mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    halo.add(mesh);
  }

  return halo;
}

export function createMythicAircraft(options = {}) {
  const colors = { ...defaultColors, ...options.colors };
  const group = new THREE.Group();
  group.name = 'MythicVoxelAircraft';
  const parts = {};
  const materials = createPaletteMaterialMap({
    body: { color: colors.body, roughness: 0.72, metalness: 0.08 },
    trim: { color: colors.trim, emissive: colors.trim, emissiveIntensity: 0.18, roughness: 0.42, metalness: 0.2 },
    crystal: { color: colors.crystal, emissive: colors.crystal, emissiveIntensity: 0.52, opacity: 0.78, roughness: 0.18 },
    wing: { color: colors.wing, roughness: 0.8 },
    rune: { color: colors.rune, emissive: colors.rune, emissiveIntensity: 1.05, roughness: 0.32 },
    shadow: { color: colors.shadow, roughness: 0.74 },
  });

  createVoxelCluster(group, blockRows, materials, parts);
  group.add(addHalo(parts, materials));
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
    colorParts: ['body', 'trim', 'crystal', 'wing', 'rune', 'shadow'],
    toggleParts: ['skyCrystals', 'landingSkids', 'haloRing', 'runeBlocks'],
    update(delta) {
      elapsed += delta * animationSpeed;
      pulseMaterial(materials.rune, elapsed, 5.5, 1, 0.42);
      pulseMaterial(materials.crystal, elapsed, 3.2, 0.5, 0.2);
      if (parts.haloRing?.visible) parts.haloRing.rotation.z += delta * animationSpeed * 0.55;
      if (parts.skyCrystals?.visible) parts.skyCrystals.position.y = Math.sin(elapsed * 2) * 0.14;
      group.position.y = Math.sin(elapsed * 1.1) * 0.1;
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
