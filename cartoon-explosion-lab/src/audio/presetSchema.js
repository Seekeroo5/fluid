import { defaultExplosionPreset } from './defaultExplosionPreset.js';

export const PRESET_LIMITS = {
  punch: { min: 0, max: 1 },
  brightness: { min: 0, max: 1 },
  tail: { min: 0, max: 1 },
  fizz: { min: 0, max: 1 },
  pitchDrop: { min: 0, max: 1 },
  bodySoftness: { min: 0, max: 1 },
  eqLow: { min: -12, max: 12 },
  eqMid: { min: -12, max: 12 },
  eqHigh: { min: -12, max: 12 },
  masterVolume: { min: 0, max: 1 },
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function coercePreset(input = {}) {
  const preset = {};

  for (const [key, fallbackValue] of Object.entries(defaultExplosionPreset)) {
    const limits = PRESET_LIMITS[key];
    const rawValue = Number.isFinite(input[key]) ? input[key] : fallbackValue;
    preset[key] = limits ? clamp(rawValue, limits.min, limits.max) : rawValue;
  }

  return preset;
}

export function randomizePreset(basePreset, amount = 0.14, random = Math.random) {
  const nextPreset = coercePreset(basePreset);

  for (const [key, limits] of Object.entries(PRESET_LIMITS)) {
    const span = limits.max - limits.min;
    const delta = (random() * 2 - 1) * span * amount;
    nextPreset[key] = clamp(nextPreset[key] + delta, limits.min, limits.max);
  }

  return nextPreset;
}
