import * as THREE from 'three';

const geometryCache = new Map();

function geometryKey(size) {
  return `${size[0]}:${size[1]}:${size[2]}`;
}

export function createPaletteMaterialMap(palette) {
  const materials = {};

  for (const [name, config] of Object.entries(palette)) {
    const materialConfig = typeof config === 'number' ? { color: config } : config;
    const color = materialConfig.color ?? 0xffffff;
    const emissive = materialConfig.emissive ?? 0x000000;
    const opacity = materialConfig.opacity ?? 1;

    materials[name] = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: materialConfig.emissiveIntensity ?? 0,
      roughness: materialConfig.roughness ?? 0.68,
      metalness: materialConfig.metalness ?? 0.08,
      transparent: opacity < 1,
      opacity,
      flatShading: true,
    });
  }

  return materials;
}

export function createVoxelBox({ name, size, position, material }) {
  const key = geometryKey(size);
  let geometry = geometryCache.get(key);

  if (!geometry) {
    geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    geometryCache.set(key, geometry);
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createVoxelCluster(root, blocks, materials, parts) {
  for (const block of blocks) {
    const partName = block.part;
    if (!parts[partName]) {
      parts[partName] = new THREE.Group();
      parts[partName].name = partName;
      root.add(parts[partName]);
    }

    const mesh = createVoxelBox({
      name: block.name ?? partName,
      size: block.size,
      position: block.position,
      material: materials[block.material],
    });

    mesh.userData.materialKey = block.material;
    parts[partName].add(mesh);
  }
}

export function setGroupMaterialColor(group, color) {
  group.traverse((node) => {
    if (node.isMesh && node.material?.color) {
      node.material.color.set(color);
    }
  });
}

export function pulseMaterial(material, elapsed, speed, baseIntensity, amount) {
  if (!material) return;
  material.emissiveIntensity = baseIntensity + Math.sin(elapsed * speed) * amount;
}

export function disposeGroup(group) {
  const disposedMaterials = new Set();

  group.traverse((node) => {
    if (!node.isMesh) return;

    if (node.material && !disposedMaterials.has(node.material)) {
      node.material.dispose();
      disposedMaterials.add(node.material);
    }
  });
}
