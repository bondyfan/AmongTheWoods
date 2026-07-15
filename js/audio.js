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
      'tower_build', 'upgrade', 'victory', 'wolf_attack', 'wolf_death',
      // distinct creature voices (attack + death per family)
      'horse_death',
      'ghost_attack', 'ghost_death', 'griffin_attack', 'griffin_death',
      'panther_attack', 'panther_death', 'zombie_attack', 'zombie_death',
      'wendigo_attack', 'wendigo_death', 'yeti_attack', 'yeti_death',
      'treant_attack', 'treant_death', 'bird_attack', 'bird_death',
      'golem_attack', 'golem_death', 'wisp_attack', 'wisp_death',
      'snapper_attack', 'snapper_death', 'scorpion_attack', 'scorpion_death',
      'thornling_attack', 'thornling_death', 'boar_attack', 'boar_death',
      'elk_attack', 'elk_death', 'bear_attack', 'bear_death',
      'bee_attack', 'bee_death', 'cactus_attack', 'cactus_death',
      'spear_throw', 'map_reveal'];
    // nature ambience loops — warmed via HTTP cache, played through loopStart
    const AMB = ['forest_ambience', 'wind_ambience', 'swamp_ambience', 'cave_ambience', 'water_lapping'];
    const MUSIC = ['level1', 'level3', 'mainmenu'];
    const urls = [...SFX.map(n => SFX_PATH + n + '.mp3'), ...AMB.map(n => SFX_PATH + n + '.mp3'),
      ...MUSIC.map(n => MUSIC_PATH + n + '.mp3')];
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
    if (this.music && !this.muted) {
      clearInterval(this._fades?.get(this.music)); // don't fight a running fade
      this._fades?.delete(this.music);
      this.music.volume = this.musicVolume;
    }
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

  // Music tracks are STREAMED on demand (some biome tracks are 50-130 MB /
  // an hour long — they must never be preloaded or fully downloaded up
  // front). Track switches crossfade, and every track remembers its playback
  // position so re-entering a biome resumes where its music left off.
  playMusic(name) {
    if (this.musicName === name) return;
    this._musicPos ??= new Map();
    // fade the old track out, then release it
    if (this.music) {
      const old = this.music, oldName = this.musicName;
      this._musicPos.set(oldName, old.currentTime || 0);
      this._fade(old, 0, 1.2, () => old.pause());
    }
    this.musicName = name;
    const a = new Audio(MUSIC_PATH + name + '.mp3');
    a.loop = true;
    a.preload = 'auto';        // the browser streams progressively — no full download
    const resume = this._musicPos.get(name);
    if (resume) {
      a.addEventListener('loadedmetadata', () => { try { a.currentTime = resume; } catch {} }, { once: true });
    }
    a.volume = 0;
    a.play().catch(() => {});
    this.music = a;
    this._fade(a, this.muted ? 0 : this.musicVolume, 1.2);
  }

  // linear volume fade using a small interval; onDone fires at the end
  _fade(el, target, dur, onDone) {
    this._fades ??= new Map();
    clearInterval(this._fades.get(el));
    const step = 60;                       // ms per tick
    const delta = (target - el.volume) / (dur * 1000 / step);
    const iv = setInterval(() => {
      const v = el.volume + delta;
      if ((delta >= 0 && v >= target) || (delta < 0 && v <= target)) {
        el.volume = Math.max(0, Math.min(1, target));
        clearInterval(iv);
        this._fades.delete(el);
        onDone?.();
      } else el.volume = Math.max(0, Math.min(1, v));
    }, step);
    this._fades.set(el, iv);
  }

  stopMusic() {
    if (this.music) {
      this._musicPos ??= new Map();
      this._musicPos.set(this.musicName, this.music.currentTime || 0);
      const old = this.music;
      this._fade(old, 0, 0.8, () => old.pause());
      this.music = null;
      this.musicName = null;
    }
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
    if (this.music) {
      clearInterval(this._fades?.get(this.music));
      this._fades?.delete(this.music);
      this.music.volume = this.muted ? 0 : this.musicVolume;
    }
    return this.muted;
  }

  // -------- creature voices --------
  // Per-family attack/death SFX generated with the ElevenLabs Sound Effects API
  // (see scripts/gen-sounds.mjs). Files live in assets/sounds/<family>_<kind>.mp3.
  _family(type) {
    if (/spider|crawler/i.test(type)) return 'spider';   // incl. bogCrawler
    if (/snake|serpent|cobra/i.test(type)) return 'snake';
    if (/wolf/i.test(type)) return 'wolf';
    if (type === 'rat') return 'rat';
    if (type === 'bat') return 'bat';
    if (type === 'bee') return 'bee';
    if (type === 'rabbit') return 'rabbit';
    if (type === 'sheep') return 'sheep';
    if (type === 'horse') return 'horse';
    if (/bandit|tribesman|shaman|poacher/i.test(type)) return 'human';
    if (/vulture|harpy/i.test(type)) return 'bird';
    if (/ghost/i.test(type)) return 'ghost';
    if (/griffin/i.test(type)) return 'griffin';         // incl. griffinChick
    if (/panther/i.test(type)) return 'panther';
    if (/zombie/i.test(type)) return 'zombie';
    if (/wendigo/i.test(type)) return 'wendigo';
    if (/yeti/i.test(type)) return 'yeti';
    if (/treant/i.test(type)) return 'treant';
    if (/cactus/i.test(type)) return 'cactus';
    if (/thornling/i.test(type)) return 'thornling';
    if (/snapper/i.test(type)) return 'snapper';
    if (/scorpion/i.test(type)) return 'scorpion';
    if (/golem/i.test(type)) return 'golem';             // incl. icegolem
    if (/wisp/i.test(type)) return 'wisp';               // incl. frostWisp
    if (/boar/i.test(type)) return 'boar';
    if (/elk/i.test(type)) return 'elk';
    if (/bear/i.test(type)) return 'bear';
    return 'beast'; // safety fallback for any future type
  }

  // kind: 'attack' | 'death'. Reuses the sfx cache/clone/throttle machinery.
  creature(type, kind, volume = 0.5, throttleMs = 70) {
    this.sfx(this._family(type) + '_' + kind, volume, throttleMs);
  }
}

export const audio = new AudioManager();
