// Reference integration only.
// This file stays isolated in the lab folder and shows the intended hook shape.

import { ThreeGameAudio } from '../src/runtime/ThreeGameAudio.js';

export async function attachFluidBoidsExplosionAudio({ THREE, scene, camera, boidsSystem }) {
  const gameAudio = new ThreeGameAudio({
    THREE,
    scene,
    camera,
    assetUrl: './audio/cartoon-explosion.wav',
  });

  await gameAudio.init();

  const unlock = async () => {
    await gameAudio.unlockAudio();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  boidsSystem.setAudio({
    playExplosionAt(position) {
      gameAudio.playExplosionAt(position);
    },
  });

  return gameAudio;
}
