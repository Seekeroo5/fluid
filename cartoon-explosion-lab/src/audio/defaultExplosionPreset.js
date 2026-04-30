export const defaultExplosionPreset = {
  punch: 0.74,
  brightness: 0.82,
  tail: 0.38,
  fizz: 0.88,
  pitchDrop: 0.7,
  bodySoftness: 0.52,
  eqLow: -5.0,
  eqMid: 1.5,
  eqHigh: 4.5,
  masterVolume: 0.86,
};

export function cloneDefaultExplosionPreset() {
  return { ...defaultExplosionPreset };
}
