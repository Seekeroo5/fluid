import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defaultExplosionPreset } from '../src/audio/defaultExplosionPreset.js';
import { renderExplosionSamples } from '../src/audio/explosionSynth.js';
import { encodeMono16BitWav } from '../src/audio/wavExport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'audio', 'cartoon-explosion.wav');

const render = renderExplosionSamples({
  preset: defaultExplosionPreset,
  sampleRate: 48000,
  seed: 1337,
});

const wav = Buffer.from(encodeMono16BitWav(render.samples, render.sampleRate));
fs.writeFileSync(outputPath, wav);

console.log(JSON.stringify({
  outputPath,
  duration: render.duration,
  peak: render.peak,
  bytes: wav.length,
}, null, 2));
