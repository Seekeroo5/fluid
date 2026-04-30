export class ThreeGameAudio {
  constructor({ THREE, scene, camera, assetUrl = './audio/cartoon-explosion.wav', poolSize = 4, volume = 0.92 }) {
    this.THREE = THREE;
    this.scene = scene;
    this.camera = camera;
    this.assetUrl = assetUrl;
    this.poolSize = poolSize;
    this.volume = volume;
    this.buffer = null;
    this.listener = new THREE.AudioListener();
    this.loader = new THREE.AudioLoader();
    this.voices = [];

    this.camera.add(this.listener);

    for (let index = 0; index < this.poolSize; index += 1) {
      const emitter = new THREE.Group();
      const sound = new THREE.PositionalAudio(this.listener);
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
  }

  async unlockAudio() {
    await this.listener.context.resume();
  }

  playExplosionAt(position) {
    if (!this.buffer) return;

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

    voice.emitter.position.copy(position);
    voice.sound.play();
    voice.availableAt = now + this.buffer.duration * 1000 + 48;
  }
}
