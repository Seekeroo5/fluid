# Voxel Aircraft Asset Pack

Standalone hostable Three.js project containing two separate editable voxel aircraft:

- `Sci-Fi Aircraft`: hard-surface block jet with swept wings, armor panels, glowing thrusters, pods, and antenna details.
- `Mythical Aircraft`: celestial bird-like craft with feathered voxel wings, crystals, rune blocks, landing skids, and a rotating halo.
- `Cyberpunk Aircraft`: dark city-runner with neon strips, duct fans, data spines, and side billboard panels.
- `Steampunk Aircraft`: brass-and-canvas boiler plane with propeller, struts, smokestacks, and landing gear.
- `Solarpunk Aircraft`: bright eco-plane with leaf wings, solar panels, vine rails, garden pods, and seed thrusters.
- `Biopunk Aircraft`: living bone-and-membrane craft with ribs, vein glow, eye cockpit, organ pods, and stinger tail.

## Run

```bash
npm install
npm run dev
```

## Build For Hosting

```bash
npm run build
```

The static site is emitted to `dist/`.

## Source Files

- `src/aircraft/sciFiAircraft.js` defines the sci-fi asset.
- `src/aircraft/mythicAircraft.js` defines the mythical asset.
- `src/aircraft/cyberpunkAircraft.js` defines the cyberpunk asset.
- `src/aircraft/steampunkAircraft.js` defines the steampunk asset.
- `src/aircraft/solarpunkAircraft.js` defines the solarpunk asset.
- `src/aircraft/biopunkAircraft.js` defines the biopunk asset.
- `src/aircraft/voxelHelpers.js` contains shared box/material helpers.
- `src/editor.js` creates the browser controls.
- `src/main.js` creates the Three.js viewer.

## Editing The Aircraft

Each aircraft is made from arrays of voxel block definitions:

```js
{ part: 'fuselage', material: 'hull', size: [2.8, 1.2, 2], position: [0, 0, 2.8] }
```

Change `size`, `position`, `part`, or `material` to reshape the asset. Parts are grouped by `part`, which lets the browser editor toggle sections and recolor material families.

## Importing Into Another Three.js Scene

```js
import { createSciFiAircraft } from './src/aircraft/sciFiAircraft.js';

const aircraft = createSciFiAircraft({ scale: 1.2 });
scene.add(aircraft.group);

function animate(delta) {
  aircraft.update(delta);
}
```

The mythical asset uses the same API:

```js
import { createMythicAircraft } from './src/aircraft/mythicAircraft.js';
```
