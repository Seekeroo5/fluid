# Cartoon Explosion Lab

This folder is a fully isolated implementation of the planned missile-impact sound workflow.

What is inside:
- A standalone browser sound lab
- A deterministic cartoon explosion synthesizer
- WAV export
- Preset save and load
- A baked default explosion asset
- Generic Three.js runtime audio code
- Example integration hooks for the two game variants

What is not touched:
- No files outside this folder are required for the prototype to work
- Existing game folders are treated as read-only references

## Layout
- [index.html](/home/madira/games/fluid/cartoon-explosion-lab/index.html): standalone sound-lab entry page
- [src/sound-lab.js](/home/madira/games/fluid/cartoon-explosion-lab/src/sound-lab.js:1): preview UI logic
- [src/audio/explosionSynth.js](/home/madira/games/fluid/cartoon-explosion-lab/src/audio/explosionSynth.js:1): cartoon spark-burst synthesis engine
- [audio/cartoon-explosion.wav](/home/madira/games/fluid/cartoon-explosion-lab/audio/cartoon-explosion.wav): baked default sound
- [presets/cartoon-explosion.preset.json](/home/madira/games/fluid/cartoon-explosion-lab/presets/cartoon-explosion.preset.json:1): editable preset
- [src/runtime/ThreeGameAudio.js](/home/madira/games/fluid/cartoon-explosion-lab/src/runtime/ThreeGameAudio.js:1): reusable positional audio runtime helper
- [examples/fluid-boids-hook.js](/home/madira/games/fluid/cartoon-explosion-lab/examples/fluid-boids-hook.js:1): integration example for the boids project
- [examples/voxel-plane-hook.js](/home/madira/games/fluid/cartoon-explosion-lab/examples/voxel-plane-hook.js:1): integration example for the voxel plane game

## Run
Use any static server from inside this folder. Example:

```bash
cd /home/madira/games/fluid/cartoon-explosion-lab
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Rebuild Default WAV
If you want to regenerate the baked default sound:

```bash
cd /home/madira/games/fluid/cartoon-explosion-lab
node ./scripts/export-default-wav.mjs
```
