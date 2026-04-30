import { AudioListener, AudioLoader, Group, PositionalAudio, Vector3 } from 'three';

export class GameAudio {
  constructor(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.assetUrl = options.assetUrl ?? '/audio/cartoon-explosion.wav';
    this.poolSize = options.poolSize ?? 4;
    this.volume = options.volume ?? 0.92;
    this.buffer = null;
    this.listener = new AudioListener();
    this.loader = new AudioLoader();
    this.voices = [];
    this.ready = false;
    this.tmpPosition = new Vector3();

    this.camera.add(this.listener);

    for (let index = 0; index < this.poolSize; index += 1) {
      const emitter = new Group();
      const sound = new PositionalAudio(this.listener);
      sound.setRefDistance(18);
      sound.setRolloffFactor(0.9);
      sound.setDistanceModel('inverse');
      sound.setMaxDistance(120);
      sound.setLoop(false);
      sound.setVolume(this.volume);
      emitter.add(sound);
      this.scene.add(emitter);
      this.voices.push({ emitter, sound, availableAt: 0 });
    }
  }

  async init() {
    this.buffer = await this.loader.loadAsync(this.assetUrl);

    for (const voice of this.voices) {
      voice.sound.setBuffer(this.buffer);
    }

    this.ready = true;
  }

  async unlockAudio() {
    await this.listener.context.resume();
  }

  playExplosionAt(position) {
    if (!this.ready || !this.buffer) return;

    this.tmpPosition.copy(position);
    const now = performance.now();
    let voice = this.voices.find((candidate) => candidate.availableAt <= now);

    if (!voice) {
      voice = this.voices.reduce((oldest, candidate) => {
        return candidate.availableAt < oldest.availableAt ? candidate : oldest;
      }, this.voices[0]);
    }

    if (voice.sound.isPlaying) {
      voice.sound.stop();
    }

    voice.emitter.position.copy(this.tmpPosition);
    voice.sound.play();
    voice.availableAt = now + this.buffer.duration * 1000 + 48;
  }
}
