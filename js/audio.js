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
    this.sfxVolume = 1;          // master multiplier from the settings slider
    this.lastPlayed = new Map(); // throttle per-sfx
  }

  // Preload every SFX + music track up front (loading screen) so the first
  // wolf bite doesn't stutter — and so a co-op guest has them from second one.
  async preloadAll(onProgress) {
    const SFX = ['attack_melee', 'attack_ranged', 'base_hit', 'bat_attack', 'bat_death',
      'beast_attack', 'beast_death', 'click', 'death', 'defeat', 'eat_food', 'error',
      'evolve', 'evolve_ready', 'hit', 'human_attack', 'human_death', 'kill_gold', 'lane_unlock', 'mine_hit', 'purchase',
      'rabbit_death', 'rat_attack', 'rat_death', 'rock_crack', 'sheep_death', 'smith_forge',
      'snake_attack', 'snake_death', 'spawn', 'special', 'spider_attack', 'spider_death',
      'tower_build', 'upgrade', 'victory', 'wolf_attack', 'wolf_death'];
    const MUSIC = ['level1', 'level3', 'mainmenu'];
    const urls = [...SFX.map(n => SFX_PATH + n + '.mp3'), ...MUSIC.map(n => MUSIC_PATH + n + '.mp3')];
    let done = 0;
    await Promise.all(urls.map(async (url) => {
      // never let one stuck request hold the whole loading screen hostage
      const timeout = new Promise(r => setTimeout(r, 6000));
      try { await Promise.race([fetch(url, { cache: 'force-cache' }).then(r => r.blob?.()), timeout]); } catch {}
      done++;
      onProgress?.(done, urls.length);
    }));
    // warm the Audio cache for sfx (they now come from the HTTP cache)
    for (const n of SFX) this._base(n);
  }

  setSfxVolume(v) { this.sfxVolume = Math.max(0, Math.min(1, v)); }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.music && !this.muted) this.music.volume = this.musicVolume;
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
    a.volume = Math.min(1, volume * this.sfxVolume);
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

  // -------- ambient SFX loops (e.g. the blacksmith hammering while his
  // shop is open); one loop per name, start is idempotent --------
  loopStart(name, volume = 0.5) {
    if (this.muted) return;
    this._loops ??= new Map();
    if (this._loops.has(name)) return;
    const a = new Audio(SFX_PATH + name + '.mp3');
    a.loop = true;
    a.volume = Math.min(1, volume * this.sfxVolume);
    a.play().catch(() => {});
    this._loops.set(name, a);
  }

  loopStop(name) {
    const a = this._loops?.get(name);
    if (a) { a.pause(); this._loops.delete(name); }
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
    if (type === 'rabbit') return 'rabbit';
    if (type === 'sheep') return 'sheep';
    if (/bandit|tribesman|shaman|poacher/i.test(type)) return 'human';
    if (/harpy/i.test(type)) return 'bat';
    if (/crawler/i.test(type)) return 'spider';
    return 'beast'; // boar, elk, bear, wendigo, yeti, golem, treant, wisp, ...
  }

  // kind: 'attack' | 'death'. Reuses the sfx cache/clone/throttle machinery.
  creature(type, kind, volume = 0.5, throttleMs = 70) {
    this.sfx(this._family(type) + '_' + kind, volume, throttleMs);
  }
}

export const audio = new AudioManager();
