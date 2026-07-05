// ---- Sound / music manager (assets reused from the era-battle project) ----

const SFX_PATH = 'assets/sounds/';
const MUSIC_PATH = 'assets/music/';

class AudioManager {
  constructor() {
    this.muted = false;
    this.cache = new Map();
    this.music = null;
    this.musicName = null;
    this.musicVolume = 0.35;
    this.lastPlayed = new Map(); // throttle per-sfx
  }

  _base(name) {
    if (!this.cache.has(name)) {
      const a = new Audio(SFX_PATH + name + '.mp3');
      a.preload = 'auto';
      this.cache.set(name, a);
    }
    return this.cache.get(name);
  }

  sfx(name, volume = 0.5, throttleMs = 60) {
    if (this.muted) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) || 0) < throttleMs) return;
    this.lastPlayed.set(name, now);
    const a = this._base(name).cloneNode();
    a.volume = volume;
    a.play().catch(() => {});
  }

  playMusic(name) {
    if (this.musicName === name) return;
    this.stopMusic();
    this.musicName = name;
    const a = new Audio(MUSIC_PATH + name + '.mp3');
    a.loop = true;
    a.volume = this.muted ? 0 : this.musicVolume;
    a.play().catch(() => {});
    this.music = a;
  }

  stopMusic() {
    if (this.music) { this.music.pause(); this.music = null; this.musicName = null; }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.music) this.music.volume = this.muted ? 0 : this.musicVolume;
    return this.muted;
  }

  // -------- creature voices --------
  // Per-family attack/death SFX generated with the ElevenLabs Sound Effects API
  // (see scripts/gen-sounds.mjs). Files live in assets/sounds/<family>_<kind>.mp3.
  _family(type) {
    if (/spider/i.test(type)) return 'spider';
    if (/snake|serpent/i.test(type)) return 'snake';
    if (/wolf/i.test(type)) return 'wolf';
    if (type === 'rat') return 'rat';
    if (type === 'bat') return 'bat';
    return 'beast'; // boar, elk, bear, wendigo, yeti, golem, ...
  }

  // kind: 'attack' | 'death'. Reuses the sfx cache/clone/throttle machinery.
  creature(type, kind, volume = 0.5, throttleMs = 70) {
    this.sfx(this._family(type) + '_' + kind, volume, throttleMs);
  }
}

export const audio = new AudioManager();
