// ---- Sound / music manager (assets reused from the era-battle project) ----

import { CLASS_TREES } from './config.js';

const SFX_PATH = 'assets/sounds/';
// every class active ability now has its own cast sound named by its id
const ABILITY_SFX = CLASS_TREES.flatMap(t => t.actives.map(a => a.id));
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
      'spear_throw', 'map_reveal',
      'torch_equip', 'aggro', 'equip_gear', 'buy',
      // harvesting: axe biting wood, pick striking stone, a tree keeling over
      'punch_hit', 'slash_hit', 'chop_hit', 'crush_hit', 'pierce_hit', 'arrow_hit',
      'swing_light', 'swing_heavy', 'swing_fist', 'player_hurt',
      'wood_chop', 'stone_mine', 'tree_fall',
      // ability / UI FX: target lock-on + spell voices (fire/frost/holy/boom/chime)
      'select', 'chime', 'boom', 'flame', 'freeze', 'holy',
      // one dedicated cast sound per class active ability (keyed by ability id)
      ...ABILITY_SFX];
    // nature ambience loops — warmed via HTTP cache, played through loopStart
    const AMB = ['forest_ambience', 'wind_ambience', 'swamp_ambience', 'cave_ambience', 'water_lapping',
      'torch_loop', 'night_crickets', 'verdant_birds', 'jungle_rain'];
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

  // NB a voice POOL was tried here and reverted. Preloading 3 elements for each
  // of ~220 sounds meant ~650 HTMLAudioElements created and load()ed at once on
  // the loading screen; iOS Safari caps how many can exist, and past the cap it
  // fails SILENTLY — no sfx, no music, and the page wedged. cloneNode costs a
  // decode on first use of each sound, which is the stutter this was meant to
  // cure, but the cure has to be Web Audio (one context, decoded AudioBuffers,
  // no element limit), not more elements.
  _base(name) {
    if (!this.cache.has(name)) {
      const a = new Audio(SFX_PATH + name + '.mp3');
      a.preload = 'auto';
      this.cache.set(name, a);
    }
    return this.cache.get(name);
  }

  // ?devmode: window.__sfxLog keeps the last 40 sounds actually played, so a
  // "why can't I hear X" question can be answered from the console instead of
  // guessed at. Costs nothing when the flag is off.
  _log(name) {
    if (!this.debugLog) return;
    (window.__sfxLog ||= []).push(name);
    if (window.__sfxLog.length > 40) window.__sfxLog.shift();
  }

  sfx(name, volume = 0.5, throttleMs = 60) {
    if (this.muted) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) || 0) < throttleMs) return;
    this._log(name);
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
    if (this.musicName === name && this.music) return;
    this._musicPos ??= new Map();
    // fade the old track out, then release it
    if (this.music) {
      const old = this.music, oldName = this.musicName;
      this._musicPos.set(oldName, old.currentTime || 0);
      this.music = null;                     // the watchdog must stop reviving it
      // belt and braces: the fade pauses it, and a hard deadline pauses it even
      // if that fade is superseded — a track left rolling here is the "menu
      // music never stops" bug, and it is worse than a clipped crossfade
      this._fade(old, 0, 1.2, () => old.pause());
      setTimeout(() => { try { old.pause(); } catch {} }, 1500);
    }
    this.musicName = name;
    this._startMusic(name);
  }

  // Create the streaming <audio> for a track and wire up the self-healing
  // handlers. The tracks are baked as seamless crossfade loops, so a plain
  // loop=true wraps cleanly — no click at the 15-minute seam.
  _startMusic(name) {
    const a = new Audio(MUSIC_PATH + name + '.mp3');
    a.loop = true;
    a.preload = 'auto';        // the browser streams progressively — no full download
    const resume = this._musicPos.get(name);
    if (resume) {
      a.addEventListener('loadedmetadata', () => { try { a.currentTime = resume; } catch {} }, { once: true });
    }
    a.volume = 0;
    // --- robust download+play: a biome track must NEVER end up silent. If the
    // stream stalls or errors, force a reload and keep trying until it plays. ---
    const kick = () => { if (this.music === a) a.play().catch(() => {}); };
    const reload = () => { if (this.music === a) { try { a.load(); } catch {} kick(); } };
    a.addEventListener('canplay', kick);
    a.addEventListener('stalled', () => setTimeout(kick, 1000));
    a.addEventListener('error',   () => setTimeout(reload, 1500));
    this.music = a;
    // registered, but NOT reaped here — the outgoing track is still crossfading
    // and the watchdog is what guarantees it eventually goes quiet
    this._allMusic ??= new Set();
    this._allMusic.add(a);
    kick();
    this._fade(a, this.muted ? 0 : this.musicVolume, 1.2);
    this._ensureMusicWatchdog();
  }

  // Watchdog: every few seconds, make sure the current track is actually
  // rolling. Covers the case where the very first play() was blocked (autoplay
  // policy) or the browser quietly paused a stalled stream — once the page has
  // any user gesture, this resumes it. Redownloads a track that errored out.
  _ensureMusicWatchdog() {
    if (this._musicWatch) return;
    this._musicWatch = setInterval(() => {
      this._reapStrayMusic();          // never let two tracks overlap
      const a = this.music;
      if (!a) return;
      if (a.error) { try { a.load(); } catch {} }
      if (a.paused || a.ended || a.error) a.play().catch(() => {});
    }, 4000);
  }

  // The definitive fix for "the menu music never stops". Fading a track out and
  // pausing it in the fade's callback is fragile: the callback is skipped if
  // that fade is superseded, timers throttle in a backgrounded PWA, and iOS
  // ignores volume writes altogether — on every one of those paths the old
  // element just keeps playing. So every music element ever created is tracked,
  // and anything that is not the CURRENT track is paused outright, here and
  // from the watchdog every few seconds.
  _reapStrayMusic() {
    if (!this._allMusic) return;
    for (const el of this._allMusic) {
      if (el === this.music) continue;
      try { el.pause(); el.src = ''; } catch {}
      this._allMusic.delete(el);
    }
  }

  // iOS refuses to let script set HTMLMediaElement.volume (hardware buttons
  // only). Detected once, because a fade that watches el.volume can never
  // converge there — which is exactly how the menu track used to keep playing
  // for ever underneath a biome track: its fade-out never finished, so the
  // pause() in its completion callback never ran.
  _volumeControllable() {
    if (this._volOK !== undefined) return this._volOK;
    try {
      const probe = new Audio();
      probe.volume = 0.42;
      this._volOK = Math.abs(probe.volume - 0.42) < 0.01;
    } catch { this._volOK = false; }
    return this._volOK;
  }

  // linear volume fade using a small interval; onDone fires at the end.
  // Progress is driven by a TICK COUNT, not by reading el.volume back, so the
  // fade always completes in `dur` seconds even if the volume write is ignored.
  _fade(el, target, dur, onDone) {
    this._fades ??= new Map();
    clearInterval(this._fades.get(el));
    const clamp = (v) => Math.max(0, Math.min(1, v));
    // no volume control (iOS): make it a clean cut instead of a crossfade,
    // otherwise both tracks would blare at full volume for the whole duration
    if (!this._volumeControllable()) {
      try { el.volume = clamp(target); } catch {}
      onDone?.();
      return;
    }
    const step = 60;                       // ms per tick
    const ticks = Math.max(1, Math.round(dur * 1000 / step));
    const from = el.volume;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      try { el.volume = clamp(from + (target - from) * (i / ticks)); } catch {}
      if (i >= ticks) {
        clearInterval(iv);
        this._fades.delete(el);
        onDone?.();
      }
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
    if (/panther|cheetah/i.test(type)) return 'panther'; // both are big cats
    if (/crocodile/i.test(type)) return 'snapper';       // wet snapping jaws
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
