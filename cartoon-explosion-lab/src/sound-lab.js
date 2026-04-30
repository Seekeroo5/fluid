import { cloneDefaultExplosionPreset } from './audio/defaultExplosionPreset.js';
import { createExplosionAudioBuffer, renderExplosionSamples } from './audio/explosionSynth.js';
import { coercePreset, randomizePreset } from './audio/presetSchema.js';
import { createWavBlob } from './audio/wavExport.js';

const CONTROL_DEFS = [
  { key: 'punch', label: 'Punch', min: 0, max: 1, step: 0.01, hint: 'How hard the pop hits up front.', format: formatUnit },
  { key: 'brightness', label: 'Brightness', min: 0, max: 1, step: 0.01, hint: 'How crisp and shiny the burst feels.', format: formatUnit },
  { key: 'tail', label: 'Tail', min: 0, max: 1, step: 0.01, hint: 'How long the puff hangs in the air.', format: formatUnit },
  { key: 'fizz', label: 'Fizz', min: 0, max: 1, step: 0.01, hint: 'How sparkly the back half of the sound feels.', format: formatUnit },
  { key: 'pitchDrop', label: 'Pitch Drop', min: 0, max: 1, step: 0.01, hint: 'How much the pop falls from high to low.', format: formatUnit },
  { key: 'bodySoftness', label: 'Body Softness', min: 0, max: 1, step: 0.01, hint: 'How soft and rounded the boom body sounds.', format: formatUnit },
  { key: 'eqLow', label: 'Low EQ', min: -12, max: 12, step: 0.1, hint: 'Trim mud or add a little chest.', format: formatDb },
  { key: 'eqMid', label: 'Mid EQ', min: -12, max: 12, step: 0.1, hint: 'Push or soften the arcade pop zone.', format: formatDb },
  { key: 'eqHigh', label: 'High EQ', min: -12, max: 12, step: 0.1, hint: 'Control sparkle and bite.', format: formatDb },
  { key: 'masterVolume', label: 'Master Volume', min: 0, max: 1, step: 0.01, hint: 'Overall loudness before export.', format: formatPercent },
];

const controlsRoot = document.getElementById('controls');
const presetCode = document.getElementById('preset-json');
const statusLabel = document.getElementById('audio-status-label');
const durationStat = document.getElementById('duration-stat');
const peakStat = document.getElementById('peak-stat');
const flavorStat = document.getElementById('flavor-stat');
const waveformCanvas = document.getElementById('waveform');
const waveformContext = waveformCanvas.getContext('2d');

let preset = cloneDefaultExplosionPreset();
let audioContext = null;
let activeSource = null;
let renderCache = renderExplosionSamples({ preset });

buildControls();
refreshView();

document.getElementById('preview-current').addEventListener('click', async () => {
  await previewPreset(preset, 1337);
});

document.getElementById('preview-default').addEventListener('click', async () => {
  await previewPreset(cloneDefaultExplosionPreset(), 1337);
});

document.getElementById('randomize-sound').addEventListener('click', () => {
  preset = randomizePreset(preset, 0.08);
  syncControlsFromPreset();
  refreshView();
});

document.getElementById('reset-sound').addEventListener('click', () => {
  preset = cloneDefaultExplosionPreset();
  syncControlsFromPreset();
  refreshView();
});

document.getElementById('export-wav').addEventListener('click', () => {
  const blob = createWavBlob(renderCache.samples, renderCache.sampleRate);
  downloadBlob(blob, 'cartoon-explosion.wav');
});

document.getElementById('export-preset').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(coercePreset(preset), null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'cartoon-explosion.preset.json');
});

document.getElementById('import-preset').addEventListener('change', async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;

  try {
    const text = await file.text();
    const importedPreset = coercePreset(JSON.parse(text));
    preset = importedPreset;
    syncControlsFromPreset();
    refreshView();
  } catch (error) {
    statusLabel.textContent = `Preset load failed: ${error.message}`;
  }

  event.target.value = '';
});

function buildControls() {
  const fragment = document.createDocumentFragment();

  for (const controlDef of CONTROL_DEFS) {
    const row = document.createElement('div');
    row.className = 'control-row';

    const head = document.createElement('div');
    head.className = 'control-head';

    const label = document.createElement('label');
    label.htmlFor = controlDef.key;
    label.textContent = controlDef.label;

    const output = document.createElement('output');
    output.id = `${controlDef.key}-value`;

    head.append(label, output);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = controlDef.key;
    input.min = String(controlDef.min);
    input.max = String(controlDef.max);
    input.step = String(controlDef.step);
    input.value = String(preset[controlDef.key]);
    input.addEventListener('input', () => {
      preset = {
        ...preset,
        [controlDef.key]: Number(input.value),
      };
      refreshView();
    });

    const hint = document.createElement('p');
    hint.textContent = controlDef.hint;

    row.append(head, input, hint);
    fragment.append(row);
  }

  controlsRoot.append(fragment);
  syncControlsFromPreset();
}

function syncControlsFromPreset() {
  for (const controlDef of CONTROL_DEFS) {
    const input = document.getElementById(controlDef.key);
    const output = document.getElementById(`${controlDef.key}-value`);
    input.value = String(preset[controlDef.key]);
    output.textContent = controlDef.format(preset[controlDef.key]);
  }
}

function refreshView() {
  preset = coercePreset(preset);
  renderCache = renderExplosionSamples({ preset });
  syncControlsFromPreset();
  presetCode.textContent = JSON.stringify(preset, null, 2);
  durationStat.textContent = `${renderCache.duration.toFixed(3)}s`;
  peakStat.textContent = renderCache.peak.toFixed(2);
  flavorStat.textContent = describeFlavor(preset);
  statusLabel.textContent = audioContext ? 'Audio unlocked' : 'Click Preview to unlock audio';
  drawWaveform(renderCache.samples);
}

async function previewPreset(nextPreset, seed) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  audioContext = audioContext ?? new AudioContextCtor();
  await audioContext.resume();
  statusLabel.textContent = 'Audio unlocked';

  if (activeSource) {
    activeSource.stop();
    activeSource.disconnect();
  }

  const { audioBuffer } = createExplosionAudioBuffer(audioContext, nextPreset, seed);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  source.onended = () => {
    if (activeSource === source) {
      activeSource.disconnect();
      activeSource = null;
    }
  };
  activeSource = source;
}

function drawWaveform(samples) {
  const width = waveformCanvas.width;
  const height = waveformCanvas.height;
  waveformContext.clearRect(0, 0, width, height);

  const background = waveformContext.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#211814');
  background.addColorStop(1, '#0d0a08');
  waveformContext.fillStyle = background;
  waveformContext.fillRect(0, 0, width, height);

  waveformContext.strokeStyle = 'rgba(255, 232, 201, 0.16)';
  waveformContext.lineWidth = 1;
  waveformContext.beginPath();
  waveformContext.moveTo(0, height / 2);
  waveformContext.lineTo(width, height / 2);
  waveformContext.stroke();

  waveformContext.lineWidth = 2;
  const gradient = waveformContext.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#ff7e5f');
  gradient.addColorStop(1, '#ffd166');
  waveformContext.strokeStyle = gradient;
  waveformContext.beginPath();

  const samplesPerPixel = Math.max(1, Math.floor(samples.length / width));
  for (let x = 0; x < width; x += 1) {
    const start = x * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, samples.length);
    let peak = 0;
    for (let index = start; index < end; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    const y = height / 2 - peak * (height * 0.38);
    if (x === 0) {
      waveformContext.moveTo(x, y);
    } else {
      waveformContext.lineTo(x, y);
    }
  }

  for (let x = width - 1; x >= 0; x -= 1) {
    const start = x * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, samples.length);
    let trough = 0;
    for (let index = start; index < end; index += 1) {
      trough = Math.min(trough, samples[index]);
    }
    const y = height / 2 - trough * (height * 0.38);
    waveformContext.lineTo(x, y);
  }

  waveformContext.closePath();
  waveformContext.fillStyle = 'rgba(255, 191, 105, 0.18)';
  waveformContext.fill();
  waveformContext.stroke();
}

function describeFlavor(currentPreset) {
  const warmth = currentPreset.bodySoftness + currentPreset.tail;
  const sparkle = currentPreset.brightness + currentPreset.fizz;

  if (sparkle > 1.45 && warmth < 1.0) return 'Bright spark burst';
  if (warmth > 1.3) return 'Chunky cartoon pop';
  if (currentPreset.punch > 0.78) return 'Hard arcade hit';
  return 'Balanced playful burst';
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatUnit(value) {
  return value.toFixed(2);
}

function formatDb(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}
