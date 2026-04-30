import { cloneDefaultExplosionPreset } from './defaultExplosionPreset.js';
import { coercePreset } from './presetSchema.js';

const TAU = Math.PI * 2;
const DEFAULT_SEED = 1337;

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class BiquadFilter {
  constructor() {
    this.reset();
    this.b0 = 1;
    this.b1 = 0;
    this.b2 = 0;
    this.a1 = 0;
    this.a2 = 0;
  }

  reset() {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }

  setCoefficients(b0, b1, b2, a0, a1, a2) {
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  setBandPass(sampleRate, frequency, q) {
    const omega = TAU * frequency / sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const cosOmega = Math.cos(omega);
    this.setCoefficients(alpha, 0, -alpha, 1 + alpha, -2 * cosOmega, 1 - alpha);
  }

  setHighPass(sampleRate, frequency, q) {
    const omega = TAU * frequency / sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const cosOmega = Math.cos(omega);
    this.setCoefficients(
      (1 + cosOmega) / 2,
      -(1 + cosOmega),
      (1 + cosOmega) / 2,
      1 + alpha,
      -2 * cosOmega,
      1 - alpha,
    );
  }

  setLowShelf(sampleRate, frequency, dbGain) {
    const gain = Math.pow(10, dbGain / 40);
    const omega = TAU * frequency / sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / 2 * Math.sqrt((gain + 1 / gain) * (1 / 0.707 - 1) + 2);
    const twoRootGainAlpha = 2 * Math.sqrt(gain) * alpha;
    this.setCoefficients(
      gain * ((gain + 1) - (gain - 1) * cosOmega + twoRootGainAlpha),
      2 * gain * ((gain - 1) - (gain + 1) * cosOmega),
      gain * ((gain + 1) - (gain - 1) * cosOmega - twoRootGainAlpha),
      (gain + 1) + (gain - 1) * cosOmega + twoRootGainAlpha,
      -2 * ((gain - 1) + (gain + 1) * cosOmega),
      (gain + 1) + (gain - 1) * cosOmega - twoRootGainAlpha,
    );
  }

  setHighShelf(sampleRate, frequency, dbGain) {
    const gain = Math.pow(10, dbGain / 40);
    const omega = TAU * frequency / sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / 2 * Math.sqrt((gain + 1 / gain) * (1 / 0.707 - 1) + 2);
    const twoRootGainAlpha = 2 * Math.sqrt(gain) * alpha;
    this.setCoefficients(
      gain * ((gain + 1) + (gain - 1) * cosOmega + twoRootGainAlpha),
      -2 * gain * ((gain - 1) + (gain + 1) * cosOmega),
      gain * ((gain + 1) + (gain - 1) * cosOmega - twoRootGainAlpha),
      (gain + 1) - (gain - 1) * cosOmega + twoRootGainAlpha,
      2 * ((gain - 1) - (gain + 1) * cosOmega),
      (gain + 1) - (gain - 1) * cosOmega - twoRootGainAlpha,
    );
  }

  setPeaking(sampleRate, frequency, q, dbGain) {
    const gain = Math.pow(10, dbGain / 40);
    const omega = TAU * frequency / sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const cosOmega = Math.cos(omega);
    this.setCoefficients(
      1 + alpha * gain,
      -2 * cosOmega,
      1 - alpha * gain,
      1 + alpha / gain,
      -2 * cosOmega,
      1 - alpha / gain,
    );
  }

  process(input) {
    const output = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;
    return output;
  }
}

function lerp(min, max, amount) {
  return min + (max - min) * amount;
}

function triangle(phase) {
  return 1 - 4 * Math.abs(0.5 - (phase - Math.floor(phase)));
}

function envelope(time, attack, decay, slope = 5) {
  if (time < 0) return 0;
  if (time < attack) {
    return attack === 0 ? 1 : Math.pow(time / attack, 0.65);
  }
  const normalized = (time - attack) / Math.max(decay, 1e-6);
  if (normalized >= 1) return 0;
  return Math.exp(-normalized * slope);
}

export function getExplosionDuration(inputPreset = cloneDefaultExplosionPreset()) {
  const preset = coercePreset(inputPreset);
  const bodyDuration = lerp(0.16, 0.34, preset.tail);
  const fizzDuration = lerp(0.08, 0.24, preset.fizz);
  return Math.max(0.28, bodyDuration + 0.08, fizzDuration + 0.12);
}

export function renderExplosionSamples({
  preset: inputPreset = cloneDefaultExplosionPreset(),
  sampleRate = 48000,
  seed = DEFAULT_SEED,
} = {}) {
  const preset = coercePreset(inputPreset);
  const totalDuration = getExplosionDuration(preset);
  const sampleCount = Math.ceil((totalDuration + 0.02) * sampleRate);
  const samples = new Float32Array(sampleCount);
  const random = createSeededRandom(seed);

  const popDuration = lerp(0.045, 0.095, preset.punch);
  const popStartFrequency = lerp(220, 410, preset.brightness) + preset.punch * 80;
  const popEndFrequency = lerp(45, 120, 1 - preset.pitchDrop);

  const bodyDuration = lerp(0.16, 0.34, preset.tail);
  const bodyCenterFrequency = lerp(130, 320, preset.bodySoftness) + lerp(20, 100, 1 - preset.brightness);
  const bodyQ = lerp(0.55, 1.1, 1 - preset.bodySoftness);

  const sparkDuration = lerp(0.08, 0.24, preset.fizz);
  const sparkFrequency = lerp(1900, 5200, preset.brightness);

  const bodyFilter = new BiquadFilter();
  bodyFilter.setBandPass(sampleRate, bodyCenterFrequency, bodyQ);

  const sparkFilter = new BiquadFilter();
  sparkFilter.setHighPass(sampleRate, sparkFrequency, 0.74);

  const lowShelf = new BiquadFilter();
  lowShelf.setLowShelf(sampleRate, 180, preset.eqLow);

  const midPeak = new BiquadFilter();
  midPeak.setPeaking(sampleRate, 820, 0.9, preset.eqMid);

  const highShelf = new BiquadFilter();
  highShelf.setHighShelf(sampleRate, 3400, preset.eqHigh);

  const drive = lerp(1.4, 2.7, preset.punch);
  const driveNormalizer = Math.tanh(drive);
  const bodyGain = 0.24 + preset.bodySoftness * 0.26 + preset.tail * 0.08;
  const sparkGain = 0.08 + preset.fizz * 0.26 + preset.brightness * 0.08;
  const popGain = 0.42 + preset.punch * 0.34;
  const chirpGain = 0.04 + preset.fizz * 0.11;

  let popPhase = 0;
  let chirpPhase = 0;
  let peak = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const popProgress = Math.min(time / popDuration, 1);
    const popFrequency = lerp(popStartFrequency, popEndFrequency, Math.pow(popProgress, 0.78));
    popPhase = (popPhase + popFrequency / sampleRate) % 1;

    const popEnv = envelope(time, 0.0015, popDuration, 8);
    const popSample = (triangle(popPhase) * 0.8 + Math.sin(TAU * popPhase) * 0.2) * popEnv * popGain;

    const bodyEnv = envelope(time, 0.008, bodyDuration, 5.3);
    const bodyNoise = random() * 2 - 1;
    const bodySample = bodyFilter.process(bodyNoise) * bodyEnv * bodyGain;

    const sparkEnv = envelope(time, 0.002, sparkDuration, 7.2);
    const sparkNoise = random() * 2 - 1;
    const sparkSample = sparkFilter.process(sparkNoise) * sparkEnv * sparkGain;

    const chirpFrequency = lerp(900, 1850, preset.brightness) + preset.fizz * 350;
    chirpPhase = (chirpPhase + chirpFrequency / sampleRate) % 1;
    const chirpEnv = envelope(time, 0.001, lerp(0.03, 0.08, preset.fizz), 10);
    const chirpSample = Math.sin(TAU * chirpPhase) * chirpEnv * chirpGain;

    let sample = popSample + bodySample + sparkSample + chirpSample;
    sample = lowShelf.process(sample);
    sample = midPeak.process(sample);
    sample = highShelf.process(sample);
    sample = Math.tanh(sample * drive) / driveNormalizer;
    sample *= preset.masterVolume;

    const fadeStart = sampleCount - Math.floor(sampleRate * 0.015);
    if (index > fadeStart) {
      sample *= 1 - (index - fadeStart) / Math.max(sampleCount - fadeStart, 1);
    }

    samples[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  if (peak > 0.94) {
    const correction = 0.94 / peak;
    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] *= correction;
    }
    peak = 0.94;
  }

  return {
    samples,
    sampleRate,
    peak,
    duration: sampleCount / sampleRate,
    preset,
    seed,
  };
}

export function createExplosionAudioBuffer(audioContext, inputPreset, seed = DEFAULT_SEED) {
  const render = renderExplosionSamples({
    preset: inputPreset,
    sampleRate: audioContext.sampleRate,
    seed,
  });
  const audioBuffer = audioContext.createBuffer(1, render.samples.length, render.sampleRate);
  audioBuffer.copyToChannel(render.samples, 0);
  return { ...render, audioBuffer };
}
