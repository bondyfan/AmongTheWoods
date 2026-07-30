// ---- Among The Woods: game bootstrap & main loop ----

import * as THREE from 'three';
import { WORLD, ITEMS, SPELLS, ENEMY_TYPES, BOSS_RANKS, BIOMES, STAT_TRACKS, MOBA,
         RESOURCES, RES_ICONS, HIDE_BEARING, VERDANT_HIDE_DROP, hideForLevel, radiusOf, costFor,
         biomeIndexAt, progressAt, fmtResource, roundResource, itemById, spellById,
         consumableById, essenceDropFor, MAX_LEVEL, XP_LEVELS, questFor, repeatableQuestFor,
         questXpFor, BIOME_LAIRS, CAMP_BUILDINGS, trainingLevelFor, CLASS_TREES,
         classTreeById, classSkillById, classSkillRequiredLevel, classSkillMeatCost, classSkillEssenceCost,
         CLASS_CHOOSE_COST, firstClassSkillId, MAX_SPELL_SLOTS, SLOT_CODES,
         WEAPON_RING_SLOT, WEAPON_RING_MAX, ringPlace } from './config.js';
import { makeAimArc, updateAimArc, makeRaft, makeBlacksmith, makeHorse, makeWisp, makeMan,
         makeGriffin, makeGriffinRoost, makeTumbleweed, BAKED_MAT, WATER_SHADERS,
         makeSkyDome, setSpectralLook, makeCorpse } from './models.js';
import { PostFX } from './postfx.js';
import { CanopyShade } from './canopy.js';
import { Camp } from './camp.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { initTouch } from './touch.js';
import { World, latticeHash } from './world.js';
import { ShipLine } from './ship.js';
import { loadWorldPatch, applyTweaks, worldPatch } from './worldpatch.js';
import { fetchCurrent, setLoadedVersion } from './worldsync.js';
import { startUpdateWatch } from './updatecheck.js';
import { WorldEditor } from './editor.js';
import { MobaWorld } from './mobaworld.js';
import { DungeonWorld } from './dungeon.js';
import { Moba } from './moba.js';
import { Player } from './player.js';
import { preloadHumanModel, setHumanModelOptIn, humanClipCount, optInFromStorage } from './humanmodel.js';
import * as vegKit from './vegekit.js';
import { EnemyManager } from './enemies.js';
import { Projectiles } from './projectiles.js';
import { Companions } from './companions.js';
import { Targeting } from './targeting.js';
import { Pickups, pickupSfx } from './pickups.js';
import { Minimap, MobaMinimap } from './minimap.js';
import { UI, MOB_INFO_RADIUS, mobLevelBadge } from './ui.js';
import { Panels } from './panels.js';
import { DevDistanceRadius } from './dev-distance-radius.js';
import { resIcon } from './icons.js';
import { LocalSaves } from './localsaves.js';

// ---------- PWA: installable + full-screen on the home screen ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {}); // fine if it fails
  });
}
// tag standalone launches (iOS/Android) so CSS can add safe-area padding
if (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) {
  document.documentElement.classList.add('standalone');
}

// NEVER let the page zoom — a zoomed viewport pushes the HUD/controls off
// screen. Blocks pinch (Safari gesture events + ctrl-wheel trackpad pinch)
// and the ctrl/cmd +/-/0 keyboard shortcuts, on desktop and mobile alike.
// (CSS touch-action: manipulation already kills double-tap-to-zoom.)
for (const t of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
}
window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_', '0'].includes(e.key)) e.preventDefault();
});

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

let postfx = null; // created on demand by applyGraphics (bloom)
let _postNightActive = false; // true while the shader owns the night darkening
let canopyShade = null; // world-space crown-shade map (the visible half of AO)

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BIOMES[0].fog, 35, 110);
scene.background = new THREE.Color(BIOMES[0].sky);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);

// gradient sky dome: replaces the old flat scene.background color with a
// horizon→zenith gradient + a glowing sun disc. The horizon band is kept
// equal to the current fog color every frame (see updateAtmosphere), so
// terrain fades into the sky with zero seam. Re-centered on the camera each
// frame — at 45 m radius (well inside the smallest camera.far the game ever
// uses) it shows no parallax at any zoom or view mode.
const skyDome = makeSkyDome(45);
scene.add(skyDome);

// lighting leans DIRECTIONAL: a strong warm sun against a modest ambient —
// deep readable shadows and punchy sun-lit faces instead of a flat wash
const hemi = new THREE.HemisphereLight(0xdfeadf, 0x2e3c2a, 0.74);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 1.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 120;
scene.add(sun, sun.target);

// ---------- adaptive quality: weak laptops get smoother frames ----------
// Watches the real frame rate and steps quality DOWN (never up mid-session):
// 1) render at 1.25x pixel ratio  2) 1x + soft shadows off  3) shorter view
// user FPS cap (0 = unlimited) + a smoothed FPS readout for the on-screen meter
let fpsFrameCap = 0;
let _fpsSmooth = 60, _fpsMeterT = 0;

// foliage-density graphics setting → scatter-count multiplier in _genChunk
// high = "lush" (the classic look); ultra switches on the dense grass-fill
const FOLIAGE_MULT = { low: 0.35, normal: 1, high: 1.7, ultra: 3.2 };
const TREE_DETAIL = { low: 0, high: 2 };
// vegetation draw distance: metres past which ground vegetation (grass carpet +
// baked scatter) is culled per chunk. "furthest" = everything that's generated
// (the old behaviour); the shorter tiers trade far grass for fill-rate.
const VEG_DRAW_DIST = { short: 46, medium: 85, far: 130, furthest: Infinity };
// shadow-distance rigs: {b = ortho half-extent m, s = map px}. The far plane
// and the sun's stand-off distance are derived from b so the whole frustum is
// always covered (updateCamera parks the sun at b*2 along the fixed sun dir).
const SHADOW_DIST = {
  low: { b: 40, s: 2048 },
  medium: { b: 85, s: 3072 },
  high: { b: 135, s: 4096 },
};
let _shadowB = 40; // active half-extent (updateCamera positions the sun by it)
let _windT = 0; // wind-shader clock (keeps blowing across pauses/menus)
// disturbance trail: the player's recent path, fed to the foliage shader so
// brushed vegetation keeps ringing (damped spring) after you pass through
const _folTrail = []; // ring buffer of {x, z, t, s, dx, dz}
let _folTrailIdx = 0;
const _folLastPos = { x: 0, z: 0 };  // last frame's pos (for velocity)
const _folStepPos = { x: 0, z: 0 };  // last footfall drop (every ~0.35 m)
const _folDir = { x: 0, z: -1 };     // smoothed walk direction
let _folMoveK = 0;                    // 0 idle → 1 moving (lay-over strength)
const _waterSunDir = new THREE.Vector3();
const _sunDir = new THREE.Vector3(0.704, 0.557, 0.440); // live time-of-day sun direction

// Automatic graphics downgrade REMOVED (user request): the game never lowers
// quality on its own any more — shadows, resolution and view distance stay
// exactly where the player set them, even if the FPS dips. `stage` is frozen at
// 0 so the `autoQuality.stage` checks scattered through the code always resolve
// to full quality, and tick() is a no-op.
const autoQuality = {
  stage: 0,
  tick() {},
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx?.setSize(renderer.domElement.width, renderer.domElement.height);
});

// ---------- game state ----------
const DEVMODE = /(?:^|[?&])devmode/i.test(location.search); // admin tools only with ?devmode
// The World Editor is locked to the owner account: available with ?devmode OR
// when signed in with this email. isAdmin() reads authUser (set once auth resolves).
const ADMIN_EMAIL = 'bondyfanfrankwild@gmail.com';
function isAdmin() { return DEVMODE || authUser?.email === ADMIN_EMAIL; }
const devDistanceRadius = DEVMODE ? new DevDistanceRadius(scene) : null;
let devTimeSync = null; // set by the ?devmode panel: mirrors the clock into its slider
let worldEditor = null; // created lazily on first F2 (admin only)
let openingEditor = false; // true while the menu shortcut is diving into the editor
                           // — suppresses the survival New/Load character prompt
const game = {
  mode: 'menu',   // menu | play | dead | won
  kind: 'survival', // survival | moba
  paused: false,
  time: 0,
  tod: 8 / 24,    // time of day 0..1 (0 = midnight) — the day opens at 08:00
  nightK: 0,      // 0 = full day, 1 = deep night (drives lights/spawns/fireflies)
  devTimeLock: false, // ?devmode: freeze the clock where it stands
  devTimeScale: 1,    // ?devmode: clock multiplier (0.25× … 64×)
  biomeIndex: 0,
  touch: false,   // set once the player uses the on-screen touch controls
  guest: false,   // playing without a Google account (no cloud save)
  seed: 1, // THE world seed — one canonical world everywhere (solo + multiplayer)
  editorView: false, // admin World-Editor top-down mode (freezes the sim)
  devFly: false,
  // Serializable world snapshot for future multiplayer (host → guests).
  snapshot() {
    return {
      t: Math.round(game.time * 1000),
      seed: game.seed,
      p: { u_local: player.snapshot() },
      e: enemyMgr.snapshot(),
    };
  },
};
if (DEVMODE) game.adminMode = true; // ?devmode boots straight into admin mode
// ?devmode also records every sound that plays into window.__sfxLog, so an
// "I can't hear X" report can be checked from the console.
if (DEVMODE) { audio.debugLog = true; window.audio = audio; }

// multiplayer session (loaded on demand from the menu; null in solo play)
let mp = null;
// MOBA state (created when the mode starts)
let moba = null;
let mobaMini = null;
let mobaSide = 'player';
// survival camp (created when a survival run starts)
let camp = null;
const combatMgr = () => {
  if (mp?.active) return mp.combatMgr();
  if (game.kind === 'moba') return moba.hostileMgr('player');
  return enemyMgr;
};

const ui = new UI({
  // the Single Player button starts whichever mode is selected in the menu
  onStart: async () => {
    if (!requireName()) return;
    if (selectedMode === 'moba') { startMobaSolo(); return; }
    // pick WHO you are before a single chunk is generated
    if (!await chooseCharacter(false)) return;
    startGame();
  },
  onCastSpell: (i) => useBarSlot(i),
});

const panels = new Panels({
  // in multiplayer the world can't stop for one player's shopping trip
  onPauseChange: (open) => {
    game.paused = open && !mp?.active;
    ui.setPaused(false);
    if (open) {
      input.cancelCombat();
      player.charging = false;
      player.castWindup = null;
      player.cancelTame?.(false);
      player.blocking = false;
      document.exitPointerLock?.(); // panels need the cursor back
    }
  },
  onBuyItem: (id) => { buyItem(id); requestAutosave(); },
  onBuySpell: (id) => { buySpell(id); requestAutosave(); },
  onRepairItem: (id) => { // blacksmith repair — free, id=null repairs everything
    const ids = id ? [id] : Object.keys(player.weaponWearById || {});
    let fixed = 0;
    for (const wid of ids) if (player.repairWeapon(wid)) fixed++;
    if (fixed) {
      ui.toast(`🔧 The smith hammers your ${fixed > 1 ? 'weapons' : 'weapon'} back into shape — good as new.`, 'level');
      audio.sfx('upgrade', 0.5);
      refreshHud();
      requestAutosave();
    }
    panels.refresh();
  },
  onBuyStat: buyStat,
  onChooseClass: chooseClass,
  onTrainClassSkill: trainClassSkill,
  onResetClass: resetClassTree,
  canResetClass: () => nearHome(),
  onEquip: (id) => {
    const item = itemById(id);
    if (item && item.level > player.level) {
      ui.toast(`🔒 ${item.name} needs level ${item.level}`, 'error');
      audio.sfx('error', 0.4);
      return;
    }
    if (!player.equip(id)) {
      panels.refresh();
      return;
    }
    // a burning torch lights with a whoomp; everything else buckles on
    audio.sfx(item?.torch ? 'torch_equip' : 'equip_gear', 0.5);
    panels.refresh();
    refreshHud();   // the weapon readout is behind the panel, not hidden by it
  },
  onToast: (msg) => ui.toast(msg, 'error'),
  onUnequip: (slot) => { player.unequip(slot); panels.refresh(); refreshHud(); },
  onToggleSpell: (id) => {
    player.toggleSpellSlot(id);
    if (player.spellSlots.includes(id)) localStorage.setItem('woods_slot_hint_done', '1');
    panels.refresh();
    ui.updateSpellbar(player); // repaint the 1–9 bar NOW — the loop is paused
  },
  onBuild: (id, lane) => buildBase(id, lane),
  onBuyConsumable: (id) => { buyConsumable(id); requestAutosave(); },
  onChestChange: () => mp?.sendCampSync?.(),
  onAssignSlot: (i, id, ringIdx = null) => {
    while (player.spellSlots.length <= i) player.spellSlots.push(undefined);
    // ---- Q: the weapon ring ----
    // Q holds a LIST of up to five weapons/tools rather than one thing, and
    // each press equips the next. Only gear you can actually swing belongs in
    // it; anything else would stall the cycle on something unequippable.
    if (i === WEAPON_RING_SLOT) {
      const it = itemById(id);
      if (!it || it.slot !== 'weapon') {
        ui.toast('🔁 Q is the weapon ring — only weapons and tools go in it.', 'boss');
        audio.sfx('error', 0.4);
        return;
      }
      const ring = weaponRing();
      // Dropped on a SPECIFIC place in the fanned-out ring: that place is the
      // instruction, so it replaces whatever sat there. Dropped on Q itself:
      // append, as before.
      if (ringIdx != null && ringIdx >= 0 && ringIdx < WEAPON_RING_MAX) {
        const next = ringPlace(ring, id, ringIdx);
        if (next === ring || next.join() === ring.join()) return;   // no-op drop
        player.spellSlots[i] = next;
        ui.toast(`🔁 ${it.name} → ring slot ${ringIdx + 1}.`, 'level');
        audio.sfx('click', 0.4);
        ui.updateSpellbar(player);
        return;
      }
      if (ring.includes(id)) { ui.toast(`${it.name} is already on the ring.`, ''); return; }
      if (ring.length >= WEAPON_RING_MAX) {
        ui.toast(`🔁 The ring is full — drop this on one of its five places to replace that weapon.`, 'boss');
        audio.sfx('error', 0.4);
        return;
      }
      ring.push(id);
      player.spellSlots[i] = ring;
      ui.toast(`🔁 ${it.name} added to the Q ring (${ring.length}/${WEAPON_RING_MAX}).`, 'level');
      audio.sfx('click', 0.4);
      ui.updateSpellbar(player);
      return;
    }
    // an ability lives in ONE slot: clear any earlier slot holding it
    const prev = player.spellSlots.findIndex(v => v === id);
    if (prev >= 0 && prev !== i) player.spellSlots[prev] = undefined;
    player.spellSlots[i] = id;
    localStorage.setItem('woods_slot_hint_done', '1'); // the drag lesson is learned
    audio.sfx('click', 0.4);
    ui.updateSpellbar(player); // repaint the bar NOW — the loop is paused while the modal is open
  },
  onDropRes: (key) => dropResource(key),
  onDropItem: (id) => dropItem(id),
  onPlaceNest: (id) => placeNest(id),
  onPlaceItem: (id) => placeCampItem(id),
  onDropConsumable: (id) => dropConsumable(id),
  onEatBerry: () => { player.eatBerry(); refreshHud(); },
  onUseConsumable: (id) => { player.useConsumable(id); refreshHud(); },
  onBuyBag: (cost) => {
    if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
    for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
    player.invSlots = Math.min(26, player.invSlots + 4);
    audio.sfx('upgrade', 0.5);
    requestAutosave();
    panels.refresh();
  },
  mobaTeam: () => mobaSide,
  nearHome: () => nearHome(), // the home building only upgrades in person
  nearSmith: () => nearSmith(), // weapons & gear can only be forged here
  onAcceptQuest: (bi, idx) => acceptQuest(bi, idx),
  onAbandonQuest: () => abandonQuest(),
  currentBiome: () => biomeIndexAt(player.pos.x, player.pos.z),
  isAdmin: () => !!game.adminMode,
  adminValues: () => ({ level: player.level, ...(player.adminOverrides ?? {}) }),
  onAdminStat: (key, val) => {
    if (key === 'level') {
      if (val != null) player.level = Math.max(1, Math.min(MAX_LEVEL, Math.round(val)));
    } else {
      player.adminOverrides ??= {};
      if (val == null) delete player.adminOverrides[key];
      else player.adminOverrides[key] = val;
    }
    player.recompute();
    panels.refresh();
  },
  onAdminAddItem: (id) => {
    if (id.startsWith('c:')) {
      const cid = id.slice(2);
      player.consumables[cid] = (player.consumables[cid] ?? 0) + 1;
    } else {
      player.invItems.push(id); // supply gear is ordinary items now — equip in Character
    }
    audio.sfx('special', 0.4);
    panels.refresh();
  },
  onAdminAddRes: () => {
    for (const k of RESOURCES) player[k] = roundResource(player[k] + 100);
    audio.sfx('kill_gold', 0.4);
    panels.refresh();
  },
});

// the LIVE map: the admin's latest cloud Save (Firebase) wins over the shipped
// assets/world-patch.json baseline; a missing/slow cloud just falls back to it
const _cloudMap = await fetchCurrent();
if (_cloudMap?.patch && worldPatch.load(_cloudMap.patch)) {
  setLoadedVersion(_cloudMap.id); // the update watchdog compares against this
  console.log('[worldpatch] live cloud version', _cloudMap.id, 'loaded');
} else {
  await loadWorldPatch(); // static baseline (assets/world-patch.json)
}
applyTweaks();          // …including enemy/item stat tweaks from the object editor
// The rigged avatar — a Dev-tab experiment, so ?devmode only. Gate the download
// on the OPT-IN (a setting), never on humanModelEnabled(): that reports whether
// the CLIPS loaded, and the clips load right here, so guarding the load with it
// was circular and pinned the avatar off forever. That is how the box man came
// back last time. Setting first, then load, then the gate reports the outcome.
// NB optInFromStorage(), not `settings` — that const is declared ~2,500 lines
// below this line, and reading it here is a temporal dead zone error that takes
// the whole module down. vegKit.enabled() just below does the same thing.
const _wantRig = DEVMODE && optInFromStorage();
setHumanModelOptIn(_wantRig);
if (_wantRig) {
  try { await preloadHumanModel(); }
  catch (e) { console.warn('[human] model load failed, using box man', e); }
}
if (vegKit.enabled()) { // quality-vegetation glTF kit (Graphics settings)
  try { await vegKit.preload(); } catch (e) { console.warn('[vegekit] preload failed, using procedural greenery', e); }
}
let world = new World(scene, game.seed);

const player = new Player(scene, {
  classRulesEnabled: () => game.kind === 'survival',
  // weapons only wear out where a blacksmith exists to fix them
  durabilityOn: () => game.kind === 'survival',
  onWeaponBreak: (id) => {
    const it = itemById(id);
    ui.toast(`💔 ${it?.name ?? 'Weapon'} BROKE — you fight bare-handed until a blacksmith repairs it (free, ⚒ on the map).`, 'boss');
    refreshHud();
    panels.refresh();
    requestAutosave();
  },
  popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
  shake: (dur, amp) => shakeCamera(dur, amp),
  onHurt: () => { ui.hurtFlash(); shakeCamera(0.18, 0.45); },
  onParry: (src) => {
    if (src?.id == null) return;
    const em = combatMgr();
    const attacker = em?.alive?.().find(e => e.id === src.id);
    if (attacker) em.stun?.(attacker, 1.25);
  },
  onHiveHit: (hive, res) => {
    if (res.firstHit) {
      // The swarm pours out — ONCE. Whoever owns the simulation must spawn it:
      // spawning locally as a guest produced bees you could SEE but not hit
      // (your blows go to the shadow world) and that never moved (a guest never
      // ticks its own enemyMgr).
      if (mp?.active && !mp.isHost) {
        mp.sendHive(hive.x, hive.z);
      } else {
        const n = 10 + Math.floor(Math.random() * 11); // 10-20
        const prog = progressAt(hive.x, hive.z);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const e = enemyMgr._spawn('bee', hive.x + Math.cos(a) * 1.4, hive.z + Math.sin(a) * 1.4, prog * 0.3);
          e.aggroed = true;
        }
      }
      ui.toast('🐝 You crack the hive — the swarm is FURIOUS!', 'boss');
      audio.sfx('special', 0.4);
    }
    if (res.destroyed) {
      const at = { x: hive.x, z: hive.z };
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) pickups.spawn('honey', 1, at, 1.0);
      ui.toast('🍯 The hive breaks open — honeycomb!', 'level');
      audio.sfx('kill_gold', 0.45);
    }
  },
  onCampHit: (camp, res) => {
    if (res.firstHit) audio.sfx('mine_hit', 0.4, 120); // timber thudding
    if (res.destroyed) {
      pickups.spawn('scroll', 1, { x: camp.x, z: camp.z }, 1.0);
      ui.toast('📜 The dwelling caves in — a Scroll of Discovery spills from the wreckage!', 'level');
      audio.sfx('rock_crack', 0.5);
      audio.sfx('kill_gold', 0.4, 120);
    }
  },
  onScrollUse: () => startDiscovery(300),
  onTorchOut: () => {
    ui.toast('🔥 Your torch burned down to ash — equip a spare or craft another (Supplies).', 'boss');
    audio.sfx('error', 0.4);
    refreshHud();
    panels.refresh();
  },
  onLevelUp: (level) => {
    requestAutosave(); // a new level is worth saving promptly
    player.essence = roundResource((player.essence || 0) + 1); // +1 Ethereal Essence per level
    audio.sfx('evolve', 0.55);
    player.spawnLevelUpEffect();
    ui.banner('⭐ LEVEL UP!');
    ui.goldFlash();
    const freshItems = ITEMS.filter(i => i.level === level).map(i => i.name);
    const freshBuildings = CAMP_BUILDINGS.flatMap(b => b.levels
      .map((upgrade, i) => ({ upgrade, name: b.names[i] })))
      .filter(x => x.upgrade.level === level).map(x => x.name);
    const trees = player.selectedClass ? [classTreeById(player.selectedClass)].filter(Boolean) : CLASS_TREES;
    const freshClass = trees.some(tree => [...tree.passives, ...tree.actives]
      .some(skill => [1, 2, 3].some(rank => classSkillRequiredLevel(skill, rank) === level)))
      ? ['new class training'] : [];
    const fresh = [...freshItems, ...freshBuildings, ...freshClass];
    ui.toast(`⭐ Level ${level}!` + (fresh.length ? ` New: ${fresh.join(', ')}` : ''), 'level');
    audio.sfx('evolve_ready', 0.4);
    ui.pulseShopButton(true);
  },
  onDeath: () => {
    if (game.kind === 'moba') { mobaRespawn(); return; }   // MOBA: respawn at base
    if (mp?.active && mp.handleLocalDeath()) return;       // MP: arena loss / respawn
    survivalRespawn();                                      // solo: wake at the cabin
  },
  // EVERY equip change repaints the open panels — not just the ones triggered
  // from the Character modal. Equipping off the 1–9 bar, a torch burning out or
  // an item being consumed all land here, and used to leave an open gear modal
  // showing stale slots until you closed and reopened it.
  onEquipChange: () => { companions.sync(player); panels.refresh?.(); refreshHud(); },
  onPetChange: () => { companions.sync(player); panels.refresh?.(); },
  onSummonImp: (spec) => { companions.spawnImp(player, spec); panels.refresh?.(); },
  onClassWorldAction: (action, skill, rank, ctx) => handleClassWorldAction(action, skill, rank, ctx),
  onChop: (tree, power) => mp?.sendChop(tree, power),
  onBerry: (key) => mp?.sendBerry(key),
});
panels.player = player;

// Apply a pickup's contents to the LOCAL player (used by direct collection
// and by the co-op 'grant' event from the host).
const RES_POPUP = { meat: ['🍖', '#ff9d76'], wood: ['🪵', '#d8a468'],
                    stone: ['🪨', '#c8c8c0'], hide: ['🟫', '#c9986a'], iron: ['🔩', '#c8d0d8'],
                    berry: ['🫐', '#c9a4ff'], wool: ['🧶', '#f2efe6'], essence: ['🧪', '#5fe07f'] };
// ---------- horse race: 4 checkpoints, beat the clock, win essence ----------
let race = null; // { flags: [mesh], next, t }
function startRace(poi) {
  if (race) { ui.toast('🏁 Already racing!', ''); return; }
  if (!player.mounted) { ui.toast('🏁 Come back ON A HORSE to race.', ''); audio.sfx('error', 0.4); return; }
  const flags = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const fx = poi.x + Math.cos(a) * 62, fz = poi.z + Math.sin(a) * 62;
    const flag = makeRaceFlag(i === 3 ? 0x4a8ad8 : 0xd83c2e);
    flag.position.set(fx, world.heightAt(fx, fz), fz);
    scene.add(flag);
    flags.push(flag);
  }
  race = { flags, next: 0, t: 75, poi };
  showPing(flags[0].position.x, flags[0].position.z);
  ui.banner('— 🏁 RACE! 4 flags, 75 s —');
  audio.sfx('lane_unlock', 0.6);
}
function endRace(won) {
  for (const f of race.flags) scene.remove(f);
  if (won) {
    const xp = questXpFor(player.level);
    player.addXp(xp);
    player.essence = roundResource(player.essence + 5);
    recordQuestEvent('raceWin', race.poi.ring);
    recordQuestEvent('landmark', race.poi.ring);
    ui.banner('— 🏆 RACE WON —');
    ui.toast(`🏆 Checkered flag! +5 🧪, +${xp} XP.`, 'level');
    audio.sfx('victory', 0.55);
  } else {
    ui.toast('🏁 Too slow — the race is lost. Try again!', 'boss');
    audio.sfx('defeat', 0.4);
  }
  race = null;
}
function tickRace(dt) {
  if (!race) return;
  race.t -= dt;
  if (race.t <= 0) { endRace(false); return; }
  if (!player.mounted) { ui.toast('🏁 You fell out of the saddle — race void.', ''); endRace(false); return; }
  const f = race.flags[race.next];
  f.userData.flag.rotation.y = Math.sin(game.time * 5) * 0.4; // beckoning wave
  if (Math.hypot(player.pos.x - f.position.x, player.pos.z - f.position.z) < 4.5) {
    scene.remove(f);
    race.next++;
    audio.sfx('click', 0.6);
    if (race.next >= race.flags.length) { endRace(true); return; }
    const nf = race.flags[race.next];
    showPing(nf.position.x, nf.position.z);
    ui.toast(`🏁 ${race.next}/4 — ${Math.ceil(race.t)}s left!`, 'level');
  }
}

// ---------- jungle temple traps: floor darts jab in a telegraphed rhythm ----------
function tickTempleTraps(dt) {
  if (BIOMES[game.biomeIndex]?.name !== 'Jungle') return;
  const temple = world.pois?.find(p => p.type === 'temple' && !p.claimed
    && Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < 9);
  if (!temple) return;
  // three fire windows per 4 s cycle; the ring around the temple hurts on the beat
  const phase = game.time % 4;
  const firing = phase < 0.25 || (phase > 1.9 && phase < 2.15);
  if (firing && !player.dead) {
    const d = Math.hypot(temple.x - player.pos.x, temple.z - player.pos.z);
    if (d > 3.5 && d < 8) { // safe on the steps (centre) or outside the ring
      player.takeDamage(Math.max(9, Math.round(player.maxHp * 0.07)), { name: 'a temple dart trap' });
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2), '🏹 dart!', '#e8d84a');
    }
  }
}

// ---------- liana glide: E at a pole slings you to its partner ----------
let glide = null; // { fx, fz, tx, tz, t }
function startGlide(poi) {
  if (glide) return;
  glide = { fx: player.pos.x, fz: player.pos.z, tx: poi.tx, tz: poi.tz, t: 0 };
  audio.sfx('special', 0.45);
  ui.toast('🌿 Wheee!', '');
}
function tickGlide(dt) {
  if (!glide) return;
  glide.t += dt;
  const k = Math.min(1, glide.t / 2);
  const ease = k * k * (3 - 2 * k);
  player.pos.x = glide.fx + (glide.tx - glide.fx) * ease;
  player.pos.z = glide.fz + (glide.tz - glide.fz) * ease;
  // a graceful arc: the player mesh lifts along the vine
  player.mesh.position.y += Math.sin(k * Math.PI) * 3.2;
  if (k >= 1) glide = null;
}

// ---------- frozen peak: avalanches answer the noise of battle ----------
let avaCd = 15;
const boulders = []; // { mesh, dx, dz, t, hit }
function tickAvalanche(dt) {
  const inPeak = BIOMES[game.biomeIndex]?.name === 'Frozen Peak';
  for (let i = boulders.length - 1; i >= 0; i--) {
    const b = boulders[i];
    b.t += dt;
    b.mesh.position.x += b.dx * 13 * dt;
    b.mesh.position.z += b.dz * 13 * dt;
    b.mesh.position.y = world.heightAt(b.mesh.position.x, b.mesh.position.z) + 0.8;
    b.mesh.rotation.x += dt * 6;
    if (!b.hit && !player.dead
        && Math.hypot(player.pos.x - b.mesh.position.x, player.pos.z - b.mesh.position.z) < 1.9) {
      b.hit = true;
      player.takeDamage(Math.max(25, Math.round(player.maxHp * 0.18)), { name: 'an avalanche' });
      ui.toast('🏔️ Buried by the snow!', 'boss');
    }
    if (b.t > 3.5) { scene.remove(b.mesh); boulders.splice(i, 1); }
  }
  if (!inPeak) return;
  avaCd -= dt;
  if (avaCd > 0) return;
  avaCd = 18 + Math.random() * 14;
  // combat noise wakes the mountain
  const fighting = enemyMgr.alive().some(e => e.aggroed
    && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 30);
  if (!fighting || Math.random() > 0.45) return;
  // boulders roll DOWNHILL through the player's position
  const h0 = world.heightAt(player.pos.x, player.pos.z);
  let dx = world.heightAt(player.pos.x - 3, player.pos.z) - world.heightAt(player.pos.x + 3, player.pos.z);
  let dz = world.heightAt(player.pos.x, player.pos.z - 3) - world.heightAt(player.pos.x, player.pos.z + 3);
  const l = Math.hypot(dx, dz) || 1;
  dx /= l; dz /= l;
  ui.toast('🏔️ AVALANCHE — the fight woke the mountain!', 'boss');
  audio.sfx('rock_crack', 0.6);
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * 3.5;
    const sx = player.pos.x - dx * 26 + dz * off;
    const sz = player.pos.z - dz * 26 - dx * off;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 0.5, 0),
      new THREE.MeshLambertMaterial({ color: 0xeef4f8 }));
    m.position.set(sx, world.heightAt(sx, sz) + 0.8, sz);
    scene.add(m);
    boulders.push({ mesh: m, dx, dz, t: 0, hit: false });
  }
}

// ---------- rain: falling streaks recycled in a box around the camera ----------
let rainMesh = null, rainOn = false;
function setRain(on, dt) {
  if (on && !rainMesh) {
    const N = 320, pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 60, y = Math.random() * 40, z = (Math.random() - 0.5) * 60;
      pos[i*6] = x; pos[i*6+1] = y; pos[i*6+2] = z;
      pos[i*6+3] = x + 0.2; pos[i*6+4] = y - 1.2; pos[i*6+5] = z; // a short slanted streak
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rainMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xaebfd0, transparent: true, opacity: 0.5 }));
    rainMesh.frustumCulled = false;
    scene.add(rainMesh);
  }
  // layer the rain hiss under the biome music while it pours (seamless loop)
  if (on !== rainOn) { if (on) audio.loopStart('jungle_rain', 0.5); else audio.loopStop('jungle_rain'); }
  rainOn = on;
  if (rainMesh) {
    rainMesh.visible = on;
    if (on) {
      // follow the camera and rain DOWN, wrapping streaks back to the top
      rainMesh.position.set(camera.position.x, 0, camera.position.z);
      const a = rainMesh.geometry.attributes.position;
      for (let i = 0; i < a.count; i += 2) {
        let y0 = a.getY(i) - 34 * dt, y1 = a.getY(i + 1) - 34 * dt;
        if (y1 < 0) { const ny = 40 + Math.random() * 6; y1 = ny - 1.2; y0 = ny; }
        a.setY(i, y0); a.setY(i + 1, y1);
      }
      a.needsUpdate = true;
    }
  }
}

// ---------- whiteout weather: blizzards, sandstorms, downpours, mists ----------
// blizzard.k is the SMOOTHED storm intensity (0..1). Storms are VOLUMETRIC:
// the draw distance never changes — visibility dies under a blowing wall of
// particles (snow flakes / sand streaks / mist banks), an air tint and a
// screen wash, all scaled by k. Foliage wind surges with the same k.
let blizzard = { on: false, t: 0, cd: 45, k: 0, spec: null };

// a soft radial dot texture shared by the snow flakes and mist banks
let _softDot = null;
function softDotTex() {
  if (_softDot) return _softDot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  _softDot = new THREE.CanvasTexture(c);
  return _softDot;
}

const STORM_DIR = { x: 0.83, z: 0.55 }; // matches the foliage shader's wind
let stormFx = null; // { kind, mesh, spd, baseOp }

function buildStormFx(kind, tintC) {
  if (kind === 'snow') {
    // a horizontal BLAST of flakes around the camera
    const N = 3000;
    const pos = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 26;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      spd[i] = 0.7 + Math.random() * 0.9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.34, map: softDotTex(), transparent: true,
      opacity: 0, depthWrite: false }));
    mesh.frustumCulled = false;
    return { kind, mesh, spd, baseOp: 0.95 };
  }
  if (kind === 'sand') {
    // a DENSE wall of blowing sand — thousands of big soft ochre motes packed
    // tight around the camera, so the desert genuinely blinds you
    const N = 3000;
    const pos = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 64;
      pos[i * 3 + 1] = Math.random() * 17;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 64;
      spd[i] = 0.7 + Math.random() * 0.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xcaa869, size: 3.6, map: softDotTex(), transparent: true,
      opacity: 0, depthWrite: false }));
    mesh.frustumCulled = false;
    return { kind, mesh, spd, baseOp: 0.95 };
  }
  // mist: a few dozen huge soft banks drifting between the trees
  const N = 34;
  const pos = new Float32Array(N * 3);
  const spd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 100;
    pos[i * 3 + 1] = 1 + Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    spd[i] = 0.5 + Math.random() * 0.9;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
    color: tintC ?? 0xaab5a5, size: 30, map: softDotTex(), transparent: true,
    opacity: 0, depthWrite: false }));
  mesh.frustumCulled = false;
  return { kind, mesh, spd, baseOp: 0.42 };
}

function tickStormFx(dt) {
  const want = blizzard.k > 0.02 && blizzard.spec?.fx ? blizzard.spec.fx : null;
  if (!want || stormFx?.kind !== want) {
    if (stormFx) {
      scene.remove(stormFx.mesh);
      stormFx.mesh.geometry.dispose();
      stormFx.mesh.material.dispose();
      stormFx = null;
    }
    if (!want) return;
    stormFx = buildStormFx(want, blizzard.spec?.mistC);
    scene.add(stormFx.mesh);
  }
  const m = stormFx.mesh;
  m.position.set(camera.position.x, 0, camera.position.z);
  m.material.opacity = stormFx.baseOp * blizzard.k;
  const arr = m.geometry.attributes.position.array;
  const gust = 1 + 0.4 * Math.sin(game.time * 1.6) + 0.2 * Math.sin(game.time * 4.3);
  if (stormFx.kind === 'snow') {
    const w = 15 * gust * dt;
    for (let i = 0; i < arr.length; i += 3) {
      const s = stormFx.spd[i / 3];
      arr[i] += STORM_DIR.x * w * s;
      arr[i + 1] -= (2.6 + 2.4 * s) * dt;
      arr[i + 2] += STORM_DIR.z * w * s;
      if (arr[i + 1] < 0) arr[i + 1] += 26;
      if (arr[i] > 40) arr[i] -= 80; else if (arr[i] < -40) arr[i] += 80;
      if (arr[i + 2] > 40) arr[i + 2] -= 80; else if (arr[i + 2] < -40) arr[i + 2] += 80;
    }
  } else if (stormFx.kind === 'sand') {
    // driven hard along the wind with a slow settle; wrapped tight (±32) so
    // the cloud stays packed around the camera
    const w = 32 * gust * dt;
    for (let i = 0; i < arr.length; i += 3) {
      const s = stormFx.spd[i / 3];
      arr[i] += STORM_DIR.x * w * s;
      arr[i + 1] -= (0.8 + 1.4 * s) * dt;
      arr[i + 2] += STORM_DIR.z * w * s;
      if (arr[i + 1] < 0) arr[i + 1] += 17;
      if (arr[i] > 32) arr[i] -= 64; else if (arr[i] < -32) arr[i] += 64;
      if (arr[i + 2] > 32) arr[i + 2] -= 64; else if (arr[i + 2] < -32) arr[i + 2] += 64;
    }
  } else { // mist banks crawl
    for (let i = 0; i < arr.length; i += 3) {
      const s = stormFx.spd[i / 3];
      arr[i] += STORM_DIR.x * 1.4 * s * dt;
      arr[i + 2] += STORM_DIR.z * 1.4 * s * dt;
      if (arr[i] > 50) arr[i] -= 100; else if (arr[i] < -50) arr[i] += 100;
      if (arr[i + 2] > 50) arr[i + 2] -= 100; else if (arr[i + 2] < -50) arr[i + 2] += 100;
    }
  }
  m.geometry.attributes.position.needsUpdate = true;
}
function tickBlizzard(dt) {
  const name = BIOMES[game.biomeIndex]?.name;
  const spec = name === 'Frozen Peak'
      ? { fx: 'snow', fogC: 0xdfe7ee, tint: 'rgba(230,238,245,0.85)', dur: 22, cdMin: 70, cdRng: 50,
          on: '🌨️ A BLIZZARD swallows the world — stay close to the bonfires!', off: '🌨️ The blizzard passes…' }
    : name === 'Scorched Desert'
      ? { fx: 'sand', fogC: 0xd8bc86, tint: 'rgba(224,196,130,0.82)', dur: 15, cdMin: 55, cdRng: 45,
          on: '🏜️ A SANDSTORM rolls in — you can barely see your hands!', off: '🏜️ The sandstorm settles…' }
    : name === 'Jungle'
      ? { fogC: 0x7b98a8, tint: 'rgba(120,150,170,0.32)', dur: 26, cdMin: 45, cdRng: 40, rain: true,
          on: '🌧️ A jungle downpour opens up!', off: '🌧️ The rain eases off…' }
    : name === 'Murky Swamp'
      ? { fx: 'mist', mistC: 0xc4ccc2, fogC: 0x99a495, tint: 'rgba(150,160,150,0.5)', dur: 30, cdMin: 40, cdRng: 45,
          on: '🌫️ A thick fog rolls across the mire — you can barely see.', off: '🌫️ The fog thins…' }
    : name === 'Dark Forest'
      // mist is WHITE — pale banks drifting through the black woods
      ? { fx: 'mist', mistC: 0xd2d8d0, fogC: 0x89948a, tint: 'rgba(190,198,190,0.4)', dur: 24, cdMin: 50, cdRng: 55,
          on: '🌫️ A cold mist creeps between the trees…', off: '🌫️ The mist lifts…' }
    : name === 'Haunted Forest'
      ? { fx: 'mist', mistC: 0xd6d6de, fogC: 0x8e8c9c, tint: 'rgba(196,194,208,0.4)', dur: 26, cdMin: 45, cdRng: 50,
          on: '🌫️ A pale mist seeps between the dead trees…', off: '🌫️ The mist recedes…' }
    : null;
  const el = $id('blizzard');
  if (!spec) {
    blizzard.on = false;
    setRain(false, dt); // leaving a weather biome kills the downpour + its rain loop
  } else {
    el.style.background = `radial-gradient(ellipse at center, ${spec.tint.replace(/[\d.]+\)$/, '0.15)')} 0%, ${spec.tint} 100%)`;
    setRain(!!(blizzard.on && spec.rain), dt);
    if (blizzard.on) {
      blizzard.t -= dt;
      if (blizzard.t <= 0) {
        blizzard.on = false;
        blizzard.cd = spec.cdMin + Math.random() * spec.cdRng;
        ui.toast(spec.off, '');
      }
    } else {
      blizzard.cd -= dt;
      if (blizzard.cd <= 0) {
        blizzard.on = true;
        blizzard.t = spec.dur;
        ui.toast(spec.on, 'boss');
        audio.sfx('special', 0.4);
      }
    }
  }
  // intensity ramps in over ~2 s and fades out over ~3; the last spec is
  // kept while fading so leaving the biome mid-storm eases out gracefully
  if (blizzard.on && spec) blizzard.spec = spec;
  blizzard.k += ((blizzard.on ? 1 : 0) - blizzard.k) * Math.min(1, dt * (blizzard.on ? 0.7 : 0.45));
  if (!blizzard.on && blizzard.k < 0.01) blizzard.spec = null;
  // screen wash: sand blinds hardest, snow next, rain barely
  const washMax = blizzard.spec
    ? (blizzard.spec.rain ? 0.3 : blizzard.spec.fx === 'sand' ? 0.94
      : blizzard.spec.fx === 'snow' ? 0.88 : 0.8)
    : 0;
  el.style.opacity = (washMax * blizzard.k).toFixed(3);
  tickStormFx(dt); // the volumetric half: particle walls riding the wind
}

// ---------- swamp sulfur bubbles: telegraphed geysers on a hash grid ----------
// Each 16 m grid cell may hold a vent; it erupts every 9 s (offset by its
// hash). The last second is the telegraph; the pop hurts EVERYTHING near it.
const BUBBLE_CELL = 16;
const bubbleFx = new Map(); // cellKey -> ring mesh while telegraphing
function bubbleVent(gx, gz) {
  const h = latticeHash(gx * 7 + 3, gz * 11 + 5, world.seed + 909);
  if (h < 0.72) return null;
  const x = (gx + 0.25 + (h * 5 % 0.5)) * BUBBLE_CELL;
  const z = (gz + 0.25 + (h * 9 % 0.5)) * BUBBLE_CELL;
  const zone = world.swampZone?.(x, z);
  if (zone !== 'water' && zone !== 'mud') return null;
  return { x, z, off: h * 9 };
}
function tickBubbles(dt) {
  if (BIOMES[game.biomeIndex]?.name !== 'Murky Swamp') {
    for (const [k, m] of bubbleFx) { scene.remove(m); bubbleFx.delete(k); }
    return;
  }
  const pgx = Math.floor(player.pos.x / BUBBLE_CELL), pgz = Math.floor(player.pos.z / BUBBLE_CELL);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const gx = pgx + dx, gz = pgz + dz;
    const v = bubbleVent(gx, gz);
    if (!v) continue;
    const key = gx + ',' + gz;
    const phase = (game.time + v.off) % 9;
    if (phase > 8 && !bubbleFx.has(key)) {
      // telegraph: a swelling brown ring for the last second
      const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 16),
        new THREE.MeshBasicMaterial({ color: 0xb8a24a, transparent: true, opacity: 0.7 }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(v.x, world.heightAt(v.x, v.z) + 0.95, v.z);
      scene.add(m);
      bubbleFx.set(key, m);
      audio.sfx('click', 0.25, 300);
    } else if (phase <= 8 && bubbleFx.has(key)) {
      // POP — anything within 2.6 m takes the burst
      const m = bubbleFx.get(key);
      scene.remove(m);
      bubbleFx.delete(key);
      ui.popup(new THREE.Vector3(v.x, world.heightAt(v.x, v.z) + 1.6, v.z), '💨', '#e8d84a');
      if (Math.hypot(player.pos.x - v.x, player.pos.z - v.z) < 2.6 && !player.dead) {
        player.takeDamage(Math.max(12, Math.round(player.maxHp * 0.08)), { name: 'a sulfur geyser' });
      }
      for (const e of enemyMgr.alive()) {
        if (Math.hypot(e.pos.x - v.x, e.pos.z - v.z) < 2.6) enemyMgr.damage(e, Math.max(15, Math.round(e.maxHp * 0.06)), null, 'tower');
      }
      audio.sfx('rock_crack', 0.35, 200);
    }
    const fx = bubbleFx.get(key);
    if (fx) fx.scale.setScalar(1 + ((game.time + v.off) % 9 - 8) * 2.2);
  }
}

// ---------- highland gusts: the wind SHOVES everyone downwind ----------
let gust = null; // { dx, dz, t }
let gustCd = 40;
function tickGust(dt) {
  if (BIOMES[game.biomeIndex]?.name !== 'Highlands') { gust = null; return; }
  if (!gust) {
    gustCd -= dt;
    if (gustCd > 0) return;
    gustCd = 55 + Math.random() * 55;
    const a = Math.random() * Math.PI * 2;
    gust = { dx: Math.cos(a), dz: Math.sin(a), t: 16 };
    ui.toast(`💨 A gust roars across the highlands — lean into it!`, 'boss');
    audio.sfx('special', 0.35);
    return;
  }
  gust.t -= dt;
  if (gust.t <= 0) { gust = null; return; }
  if (!player.dead) {
    const push = player.mounted ? 0.6 : 1.3; // horses hold their footing
    player.pos.x += gust.dx * push * dt;
    player.pos.z += gust.dz * push * dt;
  }
}

// ---------- rolling tumbleweeds: western flavour across the Highlands ----------
const tumbleweeds = [];
let tumbleCd = 3, windDir = { x: 1, z: 0 };
function tickTumbleweeds(dt) {
  const inHi = BIOMES[game.biomeIndex]?.name === 'Highlands';
  // roll & retire the live ones
  for (let i = tumbleweeds.length - 1; i >= 0; i--) {
    const t = tumbleweeds[i];
    t.t += dt;
    t.x += t.dx * t.spd * dt;
    t.z += t.dz * t.spd * dt;
    const gy = world.heightAt(t.x, t.z);
    t.mesh.position.set(t.x, gy + 0.75 + Math.abs(Math.sin(t.t * 3)) * 0.12, t.z);
    // roll forward around the axis perpendicular to travel
    t.mesh.rotation.x += t.spd * dt * 1.1;
    t.mesh.rotation.z = Math.atan2(t.dx, t.dz);
    if (Math.hypot(t.x - player.pos.x, t.z - player.pos.z) > 95 || t.t > 30) {
      scene.remove(t.mesh); tumbleweeds.splice(i, 1);
    }
  }
  if (!inHi) return;
  // wind heading drifts slowly (or snaps to an active gust)
  if (gust) { windDir.x = gust.dx; windDir.z = gust.dz; }
  tumbleCd -= dt;
  if (tumbleCd > 0 || tumbleweeds.length > 8) return;
  tumbleCd = 2.5 + Math.random() * 4;
  // spawn UPWIND of the player, ~60 m out, offset sideways so it rolls across view
  const px = -windDir.z, pz = windDir.x; // perpendicular
  const off = (Math.random() - 0.5) * 70;
  const sx = player.pos.x - windDir.x * 60 + px * off;
  const sz = player.pos.z - windDir.z * 60 + pz * off;
  if (radiusOf(sx, sz) > WORLD.radius - 5) return;
  const mesh = makeTumbleweed();
  mesh.position.set(sx, world.heightAt(sx, sz) + 0.75, sz);
  scene.add(mesh);
  tumbleweeds.push({ mesh, x: sx, z: sz, dx: windDir.x, dz: windDir.z, spd: 5 + Math.random() * 4, t: 0 });
}

// ---------- griffins: flight-master bosses of the open rings ----------
// A griffin roosts in the Desert, the Highlands and the Frozen Peak, guarded
// by its fledglings. At half health it takes wing and puts 100 m between
// you; beaten, it drops its NEST instead of dying and flies beyond the
// horizon (respawning ~20 minutes later). Place the nest anywhere on the
// ground and it becomes a flight roost: stand beside it and a called
// griffin will CARRY you to any other roost — WoW flight-master style.
const GRIFFIN_BIOMES = {
  1: { fleeSpeed: 12, nestItem: 'desertNest' },   // Scorched Desert
  6: { fleeSpeed: 24, nestItem: 'highlandNest' }, // Highlands
  7: { fleeSpeed: 36, nestItem: 'frozenNest' },   // Frozen Peak
};
const griffinNextAt = { 1: 90, 6: 90, 7: 90 };    // game.time gate per biome
let griffinCheckT = 6;

function tickGriffin(dt) {
  if (game.kind !== 'survival' || (mp?.active && !mp.isHost)) return;
  griffinCheckT -= dt;
  if (griffinCheckT > 0) return;
  griffinCheckT = 6;
  const bi = game.biomeIndex;
  const spec = GRIFFIN_BIOMES[bi];
  if (!spec || game.time < griffinNextAt[bi]) return;
  if (enemyMgr.list.some(e => e.cfg.griffin)) return; // one griffin at a time
  if (Math.random() < 0.5) return; // roll the dice every few seconds
  // land 80–120 m out; in the Highlands griffins roost on the HIGH peaks
  let best = null;
  for (let t = 0; t < 12; t++) {
    const a = Math.random() * Math.PI * 2;
    const d = 80 + Math.random() * 40;
    const x = player.pos.x + Math.cos(a) * d, z = player.pos.z + Math.sin(a) * d;
    if (biomeIndexAt(x, z) !== bi || world.isWater(x, z)) continue;
    const h = world.heightAt(x, z);
    if (!best || (bi === 6 && h > best.h)) best = { x, z, h };
  }
  if (!best) return;
  const prog = progressAt(best.x, best.z);
  const gid = 990000 + bi;
  const g = enemyMgr._spawn('griffin', best.x, best.z, prog, 1, {
    fleeSpeed: spec.fleeSpeed, nestItem: spec.nestItem, griffinBiome: bi,
    noReinforce: true, ambush: true, groupId: gid,
  });
  for (let i = 0; i < 3; i++) {
    enemyMgr._spawn('griffinChick',
      best.x + Math.cos(i * 2.1) * 4.5, best.z + Math.sin(i * 2.1) * 4.5, prog, 0,
      { groupId: gid });
  }
  ui.toast(`🦅 ${g.bossName} has landed nearby with its fledglings — defeat it and it will DROP ITS NEST!`, 'boss');
  audio.sfx('lane_unlock', 0.5);
}

// ---- placed griffin roosts (flight network nodes) ----
const flightNests = [];

// A roost is PLACED with the cursor: using the item arms a translucent ghost
// that follows the ground under the mouse; left-click drops it where you aim.
// placeable ghosts never wander off: the aim point is CLAMPED to a short
// leash around the player, so you always plant things right beside you
const PLACE_RANGE = 6;
function clampPlacePoint(max = PLACE_RANGE) {
  const dx = aimPoint.x - player.pos.x, dz = aimPoint.z - player.pos.z;
  const d = Math.hypot(dx, dz);
  if (d <= max) return { x: aimPoint.x, z: aimPoint.z };
  return { x: player.pos.x + (dx / d) * max, z: player.pos.z + (dz / d) * max };
}

let pendingNest = null; // { id, ghost }
function placeNest(id) {
  if (game.kind !== 'survival' || !inPlay()) return;
  if (!player.invItems.includes(id)) return;
  if (panels.open) panels.toggle(null);
  if (pendingCampItem) cancelCampItemPlacement();
  if (pendingNest) cancelNestPlacement();
  const ghost = makeGriffinRoost();
  ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; } });
  scene.add(ghost);
  pendingNest = { id, ghost };
  ui.toast('🪺 Aim with the cursor and click the ground to place the roost. (Esc cancels)', 'level');
  audio.sfx('click', 0.5);
}
function cancelNestPlacement() {
  if (!pendingNest) return;
  scene.remove(pendingNest.ghost);
  pendingNest = null;
}
// each frame: slide the ghost to the (leash-clamped) aim point
function updateNestGhost() {
  if (!pendingNest) return;
  const { x, z } = clampPlacePoint();
  pendingNest.ghost.position.set(x, world.heightAt(x, z), z);
  pendingNest.valid = !world.isWater(x, z)
    && biomeIndexAt(x, z) <= itemById(pendingNest.id).nest.biomeMax;
}
function confirmNestPlacement() {
  if (!pendingNest) return true;
  const id = pendingNest.id, item = itemById(id);
  const { x, z } = clampPlacePoint();
  if (world.isWater(x, z)) { ui.toast('🪺 Not on water — the twigs would drift apart.', ''); audio.sfx('error', 0.5); return true; }
  if (biomeIndexAt(x, z) > item.nest.biomeMax) {
    ui.toast(`🪺 The ${item.name} only settles in the ${BIOMES[item.nest.biomeMax].name} or an earlier zone.`, ''); audio.sfx('error', 0.5); return true;
  }
  const ix = player.invItems.indexOf(id);
  if (ix < 0) { cancelNestPlacement(); return true; }
  player.invItems.splice(ix, 1);
  const mesh = makeGriffinRoost();
  mesh.position.set(x, world.heightAt(x, z), z);
  scene.add(mesh);
  flightNests.push({ x, z, mesh, name: item.name });
  minimap.reveal(x, z);
  minimap.redrawT = 0;
  cancelNestPlacement();
  ui.toast('🪺 Roost placed! Stand beside it and press E to open the flight map.', 'level');
  audio.sfx('tower_build', 0.55);
  return true;
}

// ---- ordinary placeable items (chest, boat, guard tower, graveyard) ----
let pendingCampItem = null; // { id, kind, ghost, valid }
function placeCampItem(id) {
  const item = itemById(id);
  const kind = item?.placeable?.kind;
  if (game.kind !== 'survival' || !inPlay() || !camp || !kind) return;
  if (!player.invItems.includes(id)) return;
  if (camp.has(kind)) {
    ui.toast(`${item.icon} ${item.name} is already placed.`, '');
    audio.sfx('error', 0.4);
    return;
  }
  if (panels.open) panels.toggle(null);
  if (pendingNest) cancelNestPlacement();
  if (pendingCampItem) cancelCampItemPlacement();
  const ghost = camp.makePlaceableMesh(kind);
  if (!ghost) return;
  ghost.traverse(o => {
    if (!o.material) return;
    o.material = o.material.clone();
    o.material.transparent = true;
    o.material.opacity = 0.5;
  });
  scene.add(ghost);
  pendingCampItem = { id, kind, ghost, valid: false };
  ui.toast(`${item.icon} Aim with the cursor and click solid ground to place ${item.name}. (Esc cancels)`, 'level');
  audio.sfx('click', 0.5);
}

function cancelCampItemPlacement() {
  if (!pendingCampItem) return;
  scene.remove(pendingCampItem.ghost);
  pendingCampItem = null;
}

function updateCampItemGhost() {
  if (!pendingCampItem) return;
  const { x, z } = clampPlacePoint();
  pendingCampItem.ghost.position.set(x, world.heightAt(x, z) + (pendingCampItem.kind === 'boat' ? 0.16 : 0), z);
  pendingCampItem.valid = !world.isWater(x, z);
}

function confirmCampItemPlacement() {
  if (!pendingCampItem) return true;
  const { id, kind } = pendingCampItem;
  const item = itemById(id);
  const { x, z } = clampPlacePoint();
  if (world.isWater(x, z)) {
    ui.toast(`${item.icon} Place ${item.name} on solid ground.`, '');
    audio.sfx('error', 0.5);
    return true;
  }
  const ix = player.invItems.indexOf(id);
  if (ix < 0 || !camp.placeItem(kind, { x, z })) {
    cancelCampItemPlacement();
    return true;
  }
  player.invItems.splice(ix, 1);
  cancelCampItemPlacement();
  minimap.reveal(x, z);
  minimap.redrawT = 0;
  panels.refresh();
  mp?.sendCampSync?.();
  return true;
}

function nearFlightNest() {
  if (game.kind !== 'survival') return null;
  return flightNests.find(n => Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 5) ?? null;
}

// ---- the flight map: the world map with wing icons on every roost ----
let flightmapOpen = false;
let flightNodes = []; // canvas-space hit targets rebuilt on every draw
let flightZoom = 0;   // 0 = auto-fit the flight network; wheel overrides

function drawFlightMap() {
  const canvas = $id('flightmap-canvas');
  const here = nearFlightNest();
  const nodes = [
    { wx: 0, wz: 0, label: 'Home Camp', icon: '🏠' },
    ...flightNests.map(n => ({ wx: n.x, wz: n.z, label: n.name, icon: '🪽', isHere: n === here })),
  ];
  // frame the view around the flight NETWORK (plus the player), not the
  // whole world — the map opens usefully zoomed-in, and the wheel zooms on
  let minX = player.pos.x, maxX = player.pos.x, minZ = player.pos.z, maxZ = player.pos.z;
  for (const n of nodes) {
    minX = Math.min(minX, n.wx); maxX = Math.max(maxX, n.wx);
    minZ = Math.min(minZ, n.wz); maxZ = Math.max(maxZ, n.wz);
  }
  const span = Math.max(maxX - minX, maxZ - minZ) + 800; // breathing room
  const autoZoom = Math.max(1, Math.min(8, (WORLD.radius * 2) / span));
  drawFlightMap._autoZoom = autoZoom;
  const zoom = flightZoom || autoZoom;
  // borrow the discovered-world rendering, aimed at the network's center
  const saveZoom = minimap.bigZoom, savePX = minimap.bigPanX, savePZ = minimap.bigPanZ;
  minimap.bigZoom = zoom;
  minimap.bigPanX = (minX + maxX) / 2 - player.pos.x;
  minimap.bigPanZ = (minZ + maxZ) / 2 - player.pos.z;
  minimap.drawBig(canvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  const ox = minimap._bigOx, oz = minimap._bigOz, scale = minimap.bigScale;
  minimap.bigZoom = saveZoom; minimap.bigPanX = savePX; minimap.bigPanZ = savePZ;
  const ctx = canvas.getContext('2d');
  const toPx = (wx, wz) => ({ x: (wx - ox) * scale, y: (wz - oz) * scale });
  flightNodes = [];
  ctx.textAlign = 'center';
  for (const n of nodes) {
    const p = toPx(n.wx, n.wz);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = n.isHere ? 'rgba(255,210,74,0.35)' : 'rgba(90,200,255,0.25)';
    ctx.fill();
    ctx.strokeStyle = n.isHere ? '#ffd24a' : '#5ac8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '15px sans-serif';
    ctx.fillText(n.icon, p.x, p.y + 5);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#e8f4ff';
    ctx.fillText(n.isHere ? `${n.label} (you are here)` : n.label, p.x, p.y + 26);
    flightNodes.push({ ...p, wx: n.wx, wz: n.wz });
  }
}

function toggleFlightMap(force) {
  flightmapOpen = force !== undefined ? force : !flightmapOpen;
  if (flight) flightmapOpen = false; // already in the air
  $id('flightmap').classList.toggle('hidden', !flightmapOpen);
  if (flightmapOpen) { flightZoom = 0; audio.sfx('click', 0.4); drawFlightMap(); }
}

// ---- the flight itself: 5 s arrival, then the griffin carries you ----
let flight = null; // { phase: 'arrive'|'ride', t, mesh, to, from, y, walkT }

function startFlight(tx, tz) {
  if (flight) return;
  const mesh = makeGriffin(1.15);
  scene.add(mesh);
  const a = Math.random() * Math.PI * 2;
  flight = {
    phase: 'arrive', t: 5, mesh, walkT: 0, to: { x: tx, z: tz },
    from: { x: player.pos.x + Math.cos(a) * 60, z: player.pos.z + Math.sin(a) * 60 },
  };
  ui.toast('🪽 A griffin answers the call — it lands in 5 seconds…', 'level');
  audio.sfx('spawn', 0.5);
}

function tickFlight(dt) {
  if (!flight) return;
  const m = flight.mesh;
  if (player.dead) { // slain while waiting — the griffin leaves without you
    scene.remove(m);
    flight = null;
    player.flying = false;
    return;
  }
  flight.walkT += dt * 9;
  (m.userData.wings || []).forEach((w, wi) => {
    w.rotation.z = Math.sin(flight.walkT * 5 + wi * Math.PI) * 0.6;
  });
  if (flight.phase === 'arrive') {
    flight.t -= dt;
    const k = Math.max(0, flight.t / 5); // 1 → 0 as it swoops in
    const x = player.pos.x + (flight.from.x - player.pos.x) * k;
    const z = player.pos.z + (flight.from.z - player.pos.z) * k;
    m.position.set(x, world.heightAt(x, z) + 16 * k, z);
    m.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z) + Math.PI;
    if (flight.t <= 0) {
      flight.phase = 'ride';
      player.flying = true;
      if (player.mounted) dismountHorse();
      audio.creature('griffin', 'attack', 0.4);
      ui.toast('🪽 You swing onto the griffin\'s back — hold on!', 'level');
    }
  } else {
    const dx = flight.to.x - player.pos.x, dz = flight.to.z - player.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 3) { // touchdown
      player.flying = false;
      scene.remove(m);
      flight = null;
      ui.toast('🪽 The griffin sets you down and wheels away.', 'level');
      audio.sfx('kill_gold', 0.4);
      return;
    }
    const step = Math.min(d, 34 * dt); // griffin flight — the fastest way to travel
    player.pos.x += (dx / d) * step;
    player.pos.z += (dz / d) * step;
    player.facing.set(dx / d, 0, dz / d);
    // cruise well above the terrain, dipping in toward the landing
    const cruise = world.heightAt(player.pos.x, player.pos.z) + Math.min(16, 3 + d * 0.25);
    flight.y = flight.y == null ? cruise : flight.y + (cruise - flight.y) * Math.min(1, dt * 2);
    m.position.set(player.pos.x, flight.y, player.pos.z);
    m.rotation.y = Math.atan2(dx, dz) + Math.PI;
    player.mesh.position.set(player.pos.x, flight.y + 0.95, player.pos.z);
    player.mesh.rotation.y = Math.atan2(dx, dz);
  }
}

// ---------- drowning: deep water is lethal without Swimming ----------
let drownT = 0, drownWarned = false, drownTickT = 0;
function tickDrowning(dt) {
  const swimmer = !!player.upgrades?.swim;
  const kind = world.waterKindAt?.(player.pos.x, player.pos.z) ?? 0;
  const inDanger = game.kind === 'survival' && inPlay() && !player.dead
    && kind === 2 && !swimmer && !boatMounted && !player.flying && !shipRiding();
  if (!inDanger) {
    drownT = Math.max(0, drownT - dt * 2);
    if (drownT === 0) drownWarned = false;
    return;
  }
  drownT += dt;
  if (drownT > 0.6 && !drownWarned) {
    drownWarned = true;
    ui.toast('🌊 DEEP water — you can\'t swim! Get out or drown. (Swimming Lessons: Upgrades → Supplies, level 14)', 'boss');
  }
  if (drownT >= 1.4) {
    drownTickT -= dt;
    if (drownTickT <= 0) {
      drownTickT = 0.8;
      const dmg = Math.max(4, Math.round(player.maxHp * 0.06));
      player.takeDamage(dmg, { silent: true });
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 1.9), `-${dmg} 🌊`, '#6fc8ff');
      audio.sfx('base_hit', 0.3);
    }
  }
}

// ---------- the pirate ship line (see ship.js for the timetable) ----------
let shipLine = null;
let pierHintAt = -99; // last time the "next ship in Xs" sign was shown
const shipRiding = () => shipLine?.rider === player;

function tickShip() {
  if (game.kind !== 'survival' || !world.harbors?.length) {
    if (shipLine) { shipLine.dispose(); shipLine = null; }
    return;
  }
  if (!shipLine || shipLine.world !== world) {
    shipLine?.dispose();
    shipLine = new ShipLine(scene, world);
  }
  const wasSailing = shipLine.state.phase !== 'docked';
  const ev = shipLine.update(game.time);
  world.shipPos = { x: shipLine.mesh.position.x, z: shipLine.mesh.position.z,
    docked: shipLine.state.phase === 'docked' };
  if (shipRiding()) {
    // stand amidships: the deck carries the player mesh over the water
    player.mesh.position.set(player.pos.x, shipLine.mesh.position.y + 2.75, player.pos.z);
    player.mesh.rotation.y = shipLine.mesh.rotation.y;
    if (!wasSailing && shipLine.state.phase !== 'docked') {
      ui.toast('⛵ Cast off! She sails the long way around the island…', 'level');
      audio.sfx('tower_build', 0.5);
    }
  }
  if (ev === 'arrived') {
    ui.toast(`⚓ ${shipLine.state.harbor?.name ?? 'Harbor'} — you step off onto the pier.`, 'level');
    audio.sfx('kill_gold', 0.4);
  }
  // pier signboard: standing on the pier while the ship is elsewhere tells
  // you when she docks here next (repeats every ~20 s while you wait)
  if (!shipRiding() && game.time - pierHintAt > 20) {
    for (const h of world.harbors) {
      const head = { x: h.x + h.outX * 16, z: h.z + h.outZ * 16 };
      if (Math.hypot(player.pos.x - head.x, player.pos.z - head.z) > 14) continue;
      const wait = shipLine.nextDockIn(h, game.time);
      if (wait > 3) {
        pierHintAt = game.time;
        const m = Math.floor(wait / 60), s = Math.ceil(wait % 60);
        ui.toast(`⛵ The ship docks at ${h.name} in ${m ? `${m} min ` : ''}${s} s.`, 'level');
      }
      break;
    }
  }
}

// E at a pier while the ship is moored: climb aboard (or step off again)
function shipTryBoard() {
  if (!shipLine) return false;
  if (shipRiding()) {
    if (shipLine.state.phase === 'docked') {
      const h = shipLine.state.harbor;
      player.pos.x = h.x + h.outX * 19;
      player.pos.z = h.z + h.outZ * 19;
      shipLine.rider = null;
      ui.toast('⚓ You step back onto the pier.', '');
      return true;
    }
    ui.toast('🌊 Open sea in every direction — wait for the far harbor.', '');
    return true;
  }
  const h = shipLine.boardableAt(player.pos, game.time);
  if (!h) return false;
  shipLine.board(player);
  const dep = Math.ceil(shipLine.departureIn(game.time) ?? 0);
  const dest = world.harbors.find(o => o !== h);
  ui.toast(`⛵ Aboard! She casts off for ${dest?.name ?? 'the far harbor'} in ${dep} s.`, 'level');
  audio.sfx('lane_unlock', 0.5);
  return true;
}

// ---------- magical blue fireflies drift over the black swamp water ----------
const fireflies = [];
let fireflyGroup = null;

function tickFireflies(dt) {
  const inSwamp = game.kind === 'survival'
    && BIOMES[game.biomeIndex]?.name === 'Murky Swamp';
  if (!fireflyGroup) {
    if (!inSwamp) return;
    fireflyGroup = new THREE.Group();
    for (let i = 0; i < 34; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0x5ac8ff, transparent: true }));
      const f = { mesh, a: Math.random() * Math.PI * 2, r: 4 + Math.random() * 26,
        sp: 0.2 + Math.random() * 0.5, ph: Math.random() * 10, y: 0.6 + Math.random() * 1.8 };
      mesh.position.set(player.pos.x + Math.cos(f.a) * f.r, 0, player.pos.z + Math.sin(f.a) * f.r);
      fireflies.push(f);
      fireflyGroup.add(mesh);
    }
    scene.add(fireflyGroup);
  }
  if (!inSwamp) {
    scene.remove(fireflyGroup);
    fireflyGroup = null;
    fireflies.length = 0;
    return;
  }
  for (const f of fireflies) {
    f.ph += dt;
    f.a += f.sp * dt * 0.3;
    // each one slowly circles the player while bobbing and pulsing
    const tx = player.pos.x + Math.cos(f.a) * f.r + Math.sin(f.ph * 0.7) * 3;
    const tz = player.pos.z + Math.sin(f.a) * f.r + Math.cos(f.ph * 0.9) * 3;
    f.mesh.position.x += (tx - f.mesh.position.x) * Math.min(1, dt * 0.8);
    f.mesh.position.z += (tz - f.mesh.position.z) * Math.min(1, dt * 0.8);
    f.mesh.position.y = world.heightAt(f.mesh.position.x, f.mesh.position.z)
      + f.y + Math.sin(f.ph * 1.7) * 0.35;
    f.mesh.material.opacity = 0.2 + 0.8 * (0.5 + Math.sin(f.ph * 2.3) * 0.5);
  }
}

// ---------- held torch: the stick in your hand blazes and casts real light ----------
// The light burns whenever a torch is equipped (its GLOW reads even in
// daylight); in the dark — night, dark biomes, the cave, lair dungeons — it
// carves out a bubble of the tier's radius (5 / 10 / 15 m).
let torchLight = null, torchT = 0;

// ---- Magic Light (mage, Lv10) ---------------------------------------------
// A mote that circles the caster and lights like a torch, minus the flame: it
// glows steadily rather than guttering, because the fiction is arcane, not fire.
// Rides its own PointLight so it stacks with a real torch instead of fighting it.
let orbLight = null, orbMesh = null, orbT = 0;

function tickMagicLight(dt) {
  const on = inPlay() && !player.dead && !player.ghost && !!player.magicLight;
  if (on && !orbLight) {
    orbLight = new THREE.PointLight(0x9fd0ff, 10, 24, 1.0);
    orbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xdcefff }));
    scene.add(orbLight, orbMesh);
  } else if (!on && orbLight) {
    scene.remove(orbLight, orbMesh);
    orbMesh.geometry.dispose(); orbMesh.material.dispose();
    orbLight = null; orbMesh = null;
  }
  if (!orbLight) return;
  orbT += dt;
  // a slow orbit at shoulder height, bobbing gently so it reads as floating
  const R = 0.95;
  const a = orbT * 1.5;
  const p = player.mesh.position;
  orbMesh.position.set(p.x + Math.cos(a) * R,
                       p.y + 1.55 + Math.sin(orbT * 2.3) * 0.12,
                       p.z + Math.sin(a) * R);
  orbLight.position.copy(orbMesh.position);
  const radius = player.magicLight.radius ?? 8;
  orbLight.distance = radius * 2.6;
  const dark = !!game.dungeon
    || (BIOMES[game.biomeIndex]?.darkness ?? 0) >= 0.35
    || (game.nightK || 0) > 0.55;
  // a soft arcane pulse, nothing like the torch's flicker
  const pulse = 1 + Math.sin(orbT * 2.6) * 0.07;
  orbLight.intensity = (dark ? 16 + radius * 1.3 : 3.0) * pulse;
  // keep the bright-pass from blowing it out into a white blob
  orbMesh.material.color.setRGB(0.86 * pulse, 0.94 * pulse, 1.0);
}

function tickTorch(dt) {
  const dark = !!game.dungeon // lair dungeons are always torch-dark
    || (BIOMES[game.biomeIndex]?.darkness ?? 0) >= 0.35
    || (game.nightK || 0) > 0.55;   // home is an open yard now, never torch-dark
  const on = game.kind === 'survival' && inPlay()
    && player.torchGear && !player.dead;
  if (on && !torchLight) {
    torchLight = new THREE.PointLight(0xffc06a, 12, 20, 1.0);   // 2x — it was too dim to walk by
    scene.add(torchLight);
    audio.loopStart('torch_loop', 0.3); // the flame crackles while it's lit
  } else if (!on && torchLight) {
    scene.remove(torchLight);
    torchLight.dispose?.();
    torchLight = null;
    audio.loopStop('torch_loop');
  }
  if (!torchLight) return;
  torchT += dt;
  const radius = player.torchGear.radius ?? 5;
  // reach a good bit PAST the nominal radius so the whole bubble is genuinely
  // lit (decay 1 = a soft, far-carrying falloff, not a tight 5 m dot)
  torchLight.distance = radius * 2.8;
  // real fire never burns steady: layered sine flicker + a slow guttering
  // wave. Scales with the tier so a 15 m torch blazes far brighter than a 5 m.
  const flick = Math.sin(torchT * 9) * 0.9 + Math.sin(torchT * 23.7) * 0.6
    + Math.sin(torchT * 3.1) * 0.4;
  const base = dark ? 18 + radius * 1.4 : 3.2; // 2x: 5m→25, 10m→32, 15m→39 in the dark
  torchLight.intensity = Math.max(1.0, base + flick * (dark ? 2.8 : 0.8));
  const p = player.mesh.position;
  torchLight.position.set(p.x, p.y + 1.6, p.z);
  // flicker the HELD flame (mesh lives in the player's hand socket)
  const t = player.mesh.userData.torchRef;
  if (t) {
    const k = 1 + Math.sin(torchT * 11) * 0.16 + Math.sin(torchT * 27.3) * 0.1;
    t.userData.flame.scale.set(k, 1 + (k - 1) * 1.7, k);
    t.userData.flameCore.scale.set(k, k, k);
    t.userData.glow.scale.setScalar(1.25 + (k - 1) * 1.4);
  }
}

// ---------- desert dust devils: giant sand tornadoes that SWALLOW you ----------
// The funnel sucks the player in, whirls them high off the ground (draining
// half their max HP and cutting all regen while aloft), then flings them out.
let devil = null, devilCd = 45;
const DEVIL_CAPTURE_R = 3.6;   // funnel is ~2× the old size, so a wider mouth
const DEVIL_RIDE_T = 4.5;      // seconds spent whirling before it lets go

function releaseFromDevil(fling) {
  if (!player.captured) return;
  player.captured = false;
  player.mesh.rotation.y = 0;
  const cx = devil ? devil.mesh.position.x : player.pos.x;
  const cz = devil ? devil.mesh.position.z : player.pos.z;
  if (fling) {
    const fa = Math.random() * Math.PI * 2;
    player.pos.x = cx + Math.cos(fa) * 6;
    player.pos.z = cz + Math.sin(fa) * 6;
  }
  player.y = world.heightAt(player.pos.x, player.pos.z); // set down gently, no fall dmg
}

function tickDustDevil(dt) {
  if (game.kind !== 'survival' || BIOMES[game.biomeIndex]?.name !== 'Scorched Desert') {
    if (devil) { releaseFromDevil(false); scene.remove(devil.mesh); devil = null; }
    return;
  }
  if (!devil) {
    devilCd -= dt;
    if (devilCd > 0) return;
    devilCd = 50 + Math.random() * 40;
    const a = Math.random() * Math.PI * 2;
    const x = player.pos.x + Math.cos(a) * 55, z = player.pos.z + Math.sin(a) * 55;
    const g = new THREE.Group();
    // 2× bigger: doubled cone radii/heights and stacked twice as tall
    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((0.7 + i * 0.55) * 2, 3.2, 8, 1, true),
        new THREE.MeshLambertMaterial({ color: 0xd8bd88, transparent: true,
          opacity: 0.44 - i * 0.055, side: THREE.DoubleSide }));
      cone.position.y = (0.9 + i * 1.5) * 2;
      cone.rotation.x = Math.PI; // funnel narrows toward the ground
      g.add(cone);
    }
    g.position.set(x, world.heightAt(x, z), z);
    scene.add(g);
    devil = { mesh: g, t: 22, dir: Math.random() * Math.PI * 2, ride: 0, ang: 0 };
    ui.toast('🌪️ A towering sand tornado prowls the desert — don\'t let it swallow you!', 'boss');
    return;
  }
  const m = devil.mesh;
  m.rotation.y += dt * 9;

  // -- riding the funnel: whirl the player around the eye, high off the sand --
  if (player.captured) {
    if (player.dead) { releaseFromDevil(false); return; }
    devil.ride -= dt;
    devil.ang += dt * 6;
    const orbitR = 1.8;
    const cx = m.position.x, cz = m.position.z;
    // keep dragging toward the player a touch so the storm carries them along
    m.position.x += Math.sin(devil.dir) * 2.5 * dt;
    m.position.z += Math.cos(devil.dir) * 2.5 * dt;
    m.position.y = world.heightAt(m.position.x, m.position.z);
    player.pos.x = cx + Math.cos(devil.ang) * orbitR;
    player.pos.z = cz + Math.sin(devil.ang) * orbitR;
    // rise quickly, hover near the top, then the release drops them
    const up = Math.min(1, (DEVIL_RIDE_T - devil.ride) / 0.7) * Math.min(1, devil.ride / 0.5 + 0.15);
    player.mesh.position.set(player.pos.x, world.heightAt(cx, cz) + 2 + 6 * up, player.pos.z);
    player.mesh.rotation.y += dt * 9;
    if (devil.ride <= 0) {
      releaseFromDevil(true);
      ui.toast('🌪️ The tornado hurls you back down to the sand!', 'boss');
      audio.sfx('special', 0.5);
    }
    return; // frozen lifetime & no re-capture while already aboard
  }

  devil.t -= dt;
  if (devil.t <= 0) { scene.remove(devil.mesh); devil = null; return; }
  // wanders drunkenly, drifting a little toward the player
  devil.dir += (Math.random() - 0.5) * dt * 1.6;
  const toP = Math.atan2(player.pos.x - m.position.x, player.pos.z - m.position.z);
  m.position.x += (Math.sin(devil.dir) * 4 + Math.sin(toP) * 2) * dt;
  m.position.z += (Math.cos(devil.dir) * 4 + Math.cos(toP) * 2) * dt;
  m.position.y = world.heightAt(m.position.x, m.position.z);
  const d = Math.hypot(player.pos.x - m.position.x, player.pos.z - m.position.z);
  // -- swallow the player: drain half their MAX hp, then whirl them aloft --
  if (d < DEVIL_CAPTURE_R && !player.dead && !player.flying) {
    const drain = player.maxHp * 0.5;
    player.killedBy = 'a sand tornado';
    player.hurtT = 0;
    player.hp -= drain;
    ui.hurtFlash();
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.2),
      '-' + Math.round(drain) + ' 🌪️', '#ffb27a');
    audio.sfx('special', 0.6);
    if (player.hp <= 0) {
      player.hp = 0; player.dead = true;
      player.hooks.onDeath?.();
      return;
    }
    player.captured = true;
    devil.ride = DEVIL_RIDE_T;
    devil.ang = Math.atan2(player.pos.z - m.position.z, player.pos.x - m.position.x);
    ui.toast('🌪️ The tornado sweeps you up — you\'re spinning helplessly!', 'boss');
  }
}

// ---------- Frozen Peak cold: the chill builds until you find warmth ----------
// Bonfires / safe havens melt it off fast; the everburning torch halves the
// buildup. Fully frozen you slow down and bleed 2 HP a second.
let coldK = 0, coldTickT = 0, coldWarned = false;

function tickCold(dt) {
  const inFrozen = game.kind === 'survival' && inPlay()
    && BIOMES[game.biomeIndex]?.name === 'Frozen Peak' && !player.dead;
  if (!inFrozen) {
    coldK = Math.max(0, coldK - dt * 0.15);
    if (coldK === 0) coldWarned = false;
    return;
  }
  const warm = world.isTargetSafe?.(player.pos) || player.coldProof; // the Colossus mantle IS warmth
  const rate = warm ? -0.3 : (player.torchGear ? 0.5 : 1) / 75; // ~75 s to freeze
  coldK = Math.max(0, Math.min(1, coldK + rate * dt));
  if (coldK > 0.55 && !coldWarned) {
    coldWarned = true;
    ui.toast('🥶 You are freezing — find a bonfire, or keep a torch burning!', 'boss');
  }
  if (coldK >= 1) {
    coldTickT -= dt;
    if (coldTickT <= 0) {
      coldTickT = 1;
      player.takeDamage(Math.max(2, Math.round(player.maxHp * 0.015)), { silent: true });
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 1.9), '-2 ❄️', '#9fe8ff');
    }
  } else coldTickT = 0;
}

// ---------- wandering trader: sells your surplus for essence ----------
const TRADE_RATES = [['wood', 20], ['stone', 20], ['hide', 10], ['meat', 30], ['wool', 12]];
function tradeWith(poi) {
  // hand over the biggest sellable stack for 1 essence
  const deal = TRADE_RATES.filter(([k, n]) => player[k] >= n)
    .sort((a, b) => player[b[0]] / b[1] - player[a[0]] / a[1])[0];
  if (!deal) {
    ui.toast(`🛒 The trader shrugs — bring ${TRADE_RATES.map(([k, n]) => `${n} ${k}`).join(' / ')} for 1 🧪 each.`, '');
    audio.sfx('error', 0.4);
    return;
  }
  player[deal[0]] = roundResource(player[deal[0]] - deal[1]);
  player.essence = roundResource(player.essence + 1);
  ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.2), `-${deal[1]} ${deal[0]} → +1 🧪`, '#5fe07f');
  audio.sfx('purchase', 0.5);
  panels.refresh();
}

// ---------- graveyard defense: waves of the restless dead ----------
let graveEvent = null; // { poi, wave, alive: Set }
function startGraveyardEvent(poi) {
  if (graveEvent) { ui.toast('☠️ One graveyard at a time…', ''); return; }
  graveEvent = { poi, wave: 0, ids: new Set() };
  ui.banner('— The dead stir… —');
  audio.sfx('lane_unlock', 0.6);
  spawnGraveWave();
}
function spawnGraveWave() {
  const { poi } = graveEvent;
  graveEvent.wave++;
  const n = 3 + graveEvent.wave;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const type = Math.random() < 0.75 ? 'zombie' : 'bat';
    const e = enemyMgr._spawn(type, poi.x + Math.cos(a) * 7, poi.z + Math.sin(a) * 7,
      progressAt(poi.x, poi.z));
    e.aggroed = true;
    graveEvent.ids.add(e.id);
  }
  ui.toast(`☠️ Wave ${graveEvent.wave}/3 — ${n} risen!`, 'boss');
}
function tickGraveEvent() {
  if (!graveEvent) return;
  const anyAlive = enemyMgr.list.some(e => graveEvent.ids.has(e.id) && !e.dying);
  if (anyAlive) return;
  if (graveEvent.wave < 3) { spawnGraveWave(); return; }
  const poi = graveEvent.poi;
  markPoiClaimed(poi);
  graveEvent = null;
  recordQuestEvent('graveyardRest', poi.ring);
  recordQuestEvent('landmark', poi.ring);
  const xp = questXpFor(player.level);
  player.addXp(xp);
  pickups.spawn('essence', 3 + poi.ring, { x: poi.x, z: poi.z }, 1.5);
  ui.banner('— The graveyard rests —');
  ui.toast(`⚰️ The dead rest again: +${xp} XP and a cache of essence.`, 'level');
  audio.sfx('victory', 0.5);
  minimap.redrawT = 0;
}

// ---------- will-o-wisps: follow the light… to fortune or teeth ----------
let wisp = null; // { mesh, tx, tz, t }
let wispCd = 50;
function tickWisp(dt) {
  const inHaunted = BIOMES[game.biomeIndex]?.name === 'Haunted Forest';
  if (!wisp) {
    if (!inHaunted) return;
    wispCd -= dt;
    if (wispCd > 0) return;
    wispCd = 75 + Math.random() * 45;
    const a = Math.random() * Math.PI * 2;
    const sx = player.pos.x + Math.cos(a) * 30, sz = player.pos.z + Math.sin(a) * 30;
    const b = Math.random() * Math.PI * 2;
    wisp = { mesh: makeWisp(), tx: sx + Math.cos(b) * 65, tz: sz + Math.sin(b) * 65, t: 0 };
    wisp.mesh.position.set(sx, world.heightAt(sx, sz), sz);
    scene.add(wisp.mesh);
    ui.toast('💫 A pale light flickers between the trees…', '');
    return;
  }
  wisp.t += dt;
  const m = wisp.mesh;
  m.userData.core.material.opacity = 0.7 + Math.sin(wisp.t * 6) * 0.3;
  const dx = wisp.tx - m.position.x, dz = wisp.tz - m.position.z;
  const d = Math.hypot(dx, dz);
  const pd = Math.hypot(player.pos.x - m.position.x, player.pos.z - m.position.z);
  if (pd < 26 && d > 1.5) { // it drifts on only while you follow
    m.position.x += (dx / d) * 4.5 * dt;
    m.position.z += (dz / d) * 4.5 * dt;
    m.position.y = world.heightAt(m.position.x, m.position.z);
  }
  if (d <= 1.5 && pd < 10) { // journey's end — fortune or ambush
    scene.remove(m);
    const at = { x: m.position.x, z: m.position.z };
    if (Math.random() < 0.6) {
      pickups.spawn('essence', 2, at, 1.2);
      pickups.spawn('meat', 10, at, 1.4);
      ui.toast('💫 The wisp fades over a forgotten cache!', 'level');
      audio.sfx('kill_gold', 0.5);
    } else {
      for (let i = 0; i < 3; i++) {
        const e = enemyMgr._spawn('zombie', at.x + (Math.random() - 0.5) * 4, at.z + (Math.random() - 0.5) * 4,
          progressAt(at.x, at.z));
        e.aggroed = true;
      }
      ui.toast('💀 The light was BAIT!', 'boss');
      audio.sfx('lane_unlock', 0.6);
    }
    wisp = null;
  } else if (pd > 60 || wisp.t > 90) { // lost interest / gave up
    scene.remove(m);
    wisp = null;
  }
}

// ---------- chunk props: beehives, cocoons, firefly glades (E) ----------
function usePropNear() {
  const pr = world.propNear?.(player.pos.x, player.pos.z, 3);
  if (!pr) return false;
  pr.used = true;
  pr.mesh.visible = pr.kind === 'glade'; // glade keeps its fireflies
  if (pr.kind === 'cocoon') {
    if (Math.random() < 0.5) {
      pickups.spawn('essence', 1, { x: pr.x, z: pr.z }, 0.8);
      pickups.spawn('hide', 2, { x: pr.x, z: pr.z }, 0.9);
      if (Math.random() < 0.12) {
        const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
          && i.level <= player.level + 1);
        pickups.spawn('item', c[Math.floor(Math.random() * c.length)].id, { x: pr.x, z: pr.z }, 0.5);
      }
      ui.toast('🕸️ The cocoon splits — someone\'s last belongings.', 'level');
      audio.sfx('kill_gold', 0.45);
    } else {
      for (let i = 0; i < 2 + (Math.random() < 0.5 ? 1 : 0); i++) {
        const e = enemyMgr._spawn('spider', pr.x + (Math.random() - 0.5) * 3, pr.z + (Math.random() - 0.5) * 3,
          progressAt(pr.x, pr.z));
        e.aggroed = true;
      }
      ui.toast('🕷️ The cocoon was FULL!', 'boss');
      audio.sfx('lane_unlock', 0.55);
    }
    pr.mesh.visible = false;
  } else if (pr.kind === 'glade') {
    player.essence = roundResource(player.essence + 2);
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.2), '+2 🧪', '#7fffd4');
    ui.toast('🍄 The glowing mushroom hums with essence.', 'level');
    audio.sfx('evolve_ready', 0.45);
    pr.mesh.children[1].visible = false; // the cap is picked, fireflies remain
    pr.mesh.children[0].visible = false;
  }
  panels.refresh();
  return true;
}

// ---------- caged prisoners at humanoid camps ----------
function freePrisoner(pr) {
  pr.freed = true;
  pr.mesh.userData.prisoner.visible = false; // he bolts for freedom
  const xp = questXpFor(player.level);
  player.addXp(xp);
  player.essence = roundResource(player.essence + 2);
  recordQuestEvent('rescue', biomeIndexAt(pr.x, pr.z));
  // in thanks he marks landmarks he saw from the cage onto your map
  let revealed = 0;
  for (const poi of world.pois) {
    if (revealed >= 2 || poi.claimed) continue;
    if (Math.hypot(poi.x - pr.x, poi.z - pr.z) < 500 && !minimap._isDiscovered(poi.x, poi.z)) {
      minimap.reveal(poi.x, poi.z);
      revealed++;
    }
  }
  ui.toast(`🔓 The prisoner thanks you: +${xp} XP, +2 🧪${revealed ? ` — and marks ${revealed} landmark${revealed > 1 ? 's' : ''} on your map` : ''}.`, 'level');
  audio.sfx('victory', 0.4);
}

// ---------- blacksmith quests: accept, track, auto-complete ----------
function acceptQuest(bi, idx) {
  if (player.quest) return;
  const repeatable = idx === 'repeatable';
  if (!repeatable && (player.questDone[bi] ?? 0) !== idx) return; // story line stays ordered
  const q = repeatable
    ? repeatableQuestFor(bi, player.repeatableDone?.[bi] ?? 0)
    : questFor(bi, idx);
  if (!q) return;
  const prior = q.type === 'event'
    ? player.questFlags[`${q.event}:${bi}`] || 0
    : 0;
  player.quest = { ...q, count: Math.min(q.need, prior) };
  ui.toast(`📜 Quest accepted: ${player.quest.name}`, 'level');
  audio.sfx('click', 0.5);
  panels.refresh();
  if (player.quest?.count >= player.quest?.need) questProgress(0); // already changed this part of the world
}

function abandonQuest() {
  if (!player.quest) return;
  ui.toast(`✖ Quest abandoned: ${player.quest.name}`, '');
  player.quest = null;
  audio.sfx('click', 0.4);
  panels.refresh();
}

function questProgress(n = 1) {
  const q = player.quest;
  if (!q) return;
  q.count += n;
  if (q.count < q.need) { panels.refresh(); return; }
  if (q.repeatable) {
    player.repeatableDone[q.biome] = (player.repeatableDone[q.biome] ?? 0) + 1;
  } else {
    player.questDone[q.biome] = Math.max(player.questDone[q.biome] ?? 0, Number(q.idx) + 1);
  }
  player.questHistory.push({ name: q.name, biome: q.biome, category: q.category });
  const xp = Math.round(questXpFor(player.level) * (q.xpMult || 1));
  player.addXp(xp);
  const rewardLine = grantQuestReward(q);
  player.quest = null;
  ui.banner('📜 Quest complete!');
  ui.toast(`📜 ${q.name} — +${xp} XP${rewardLine ? ` · ${rewardLine}` : ''}`, 'level');
  audio.sfx('victory', 0.45);
  panels.refresh();
}

function grantQuestReward(q) {
  const reward = q.reward || {};
  const lines = [];
  if (reward.resources) {
    for (const [key, amount] of Object.entries(reward.resources)) {
      player[key] = roundResource((player[key] || 0) + amount);
      lines.push(`+${fmtResource(amount)} ${RES_ICONS[key] ?? key}`);
    }
  }
  if (reward.unlock) {
    player.upgrades[reward.unlock] = true;
    const labels = { broadheadArrows: 'Broadhead arrows unlocked (Z)', fireArrows: 'Fire arrows unlocked (Z)' };
    lines.push(labels[reward.unlock] || 'new combat recipe');
  }
  if (reward.resident === 'hunter' && !player.upgrades.hunterResident) {
    player.upgrades.hunterResident = true;
    lines.push('Hunter joins camp: +4% critical chance');
  }
  if (reward.maxHp) {
    player.upgrades.questHp = (player.upgrades.questHp || 0) + reward.maxHp;
    lines.push(`+${reward.maxHp} permanent max HP`);
  }
  if (reward.questPower) {
    player.upgrades.questPower = (player.upgrades.questPower || 0) + reward.questPower;
    lines.push('+3% permanent weapon damage');
  }
  if (reward.bagSlots) {
    player.invSlots = Math.min(30, player.invSlots + reward.bagSlots);
    lines.push(`+${reward.bagSlots} backpack slot`);
  }
  if (reward.safeRoute) {
    player.upgrades.trailblazer = (player.upgrades.trailblazer || 0) + 1;
    lines.push('safe route: permanent movement bonus');
  }
  if (reward.reveal) {
    let revealed = 0;
    for (const poi of world.pois.filter(p => p.ring === q.biome && !minimap._isDiscovered(p.x, p.z))) {
      minimap.revealArea(poi.x, poi.z, 90);
      if (++revealed >= reward.reveal) break;
    }
    if (revealed) lines.push(`${revealed} routes marked on map`);
  }
  player.recompute();
  syncQuestResidents();
  return lines.join(' · ');
}

let questHunterMesh = null;
function syncQuestResidents() {
  if (!player.upgrades.hunterResident || questHunterMesh || game.kind !== 'survival') return;
  questHunterMesh = makeMan();
  const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x355b2d }));
  cloak.position.set(0, 0.9, 0.2);
  questHunterMesh.add(cloak);
  questHunterMesh.position.set(4, world.heightAt(4, 3), 3);
  questHunterMesh.rotation.y = -2.3;
  scene.add(questHunterMesh);
  ui.addTracker('quest-hunter',
    () => questHunterMesh?.parent ? questHunterMesh.position.clone().setY(questHunterMesh.position.y + 2.1) : null,
    '<div class="mp-name" style="color:#cfe8a8">Camp Hunter</div>', 'hpwrap', null,
    { worldRadius: 60 });
}

function recordQuestEvent(event, bi = game.biomeIndex) {
  player.questFlags[event] = (player.questFlags[event] || 0) + 1;
  const scoped = `${event}:${bi}`;
  player.questFlags[scoped] = (player.questFlags[scoped] || 0) + 1;
  const q = player.quest;
  if (!q || q.type !== 'event' || q.event !== event) return;
  if (q.biome !== bi) return;
  questProgress();
}

const QUEST_KILL_SHARE_RADIUS = 20;

function trackQuestKill(enemy, requireNearby = true) {
  const q = player.quest;
  if (!q || player.dead) return;
  if (requireNearby
      && Math.hypot(player.pos.x - enemy.pos.x, player.pos.z - enemy.pos.z) > QUEST_KILL_SHARE_RADIUS) return;
  const killedBiome = Number.isInteger(enemy.questBiome) ? enemy.questBiome
    : game.dungeon?.poi && enemy.lairId
      ? game.dungeon.poi.ring : biomeIndexAt(enemy.pos.x, enemy.pos.z);
  if (q.type === 'kill' && enemy.type === q.target && killedBiome === q.biome) questProgress();
  else if (q.type === 'boss' && enemy.bossRank > 0
           && killedBiome === q.biome) questProgress();
  else if (q.type === 'killAny' && !enemy.cfg?.passive
           && killedBiome === q.biome) questProgress();
}

function grantPickup(kind, payload) {
  if (kind === 'item') {
    const item = itemById(payload);
    player.ownItem(payload);
    ui.toast(item.nest
      ? `🎁 Loot: ${item.icon} ${item.name} — open your bag (C) and CLICK it to place a flight roost.`
      : `🎁 Loot: ${item.icon} ${item.name} — in your bag (equip in Character, C).`, 'level');
  } else if (kind === 'salve' || kind === 'roast' || kind === 'venom' || kind === 'honey' || kind === 'scroll') {
    player.consumables[kind] = (player.consumables[kind] ?? 0) + payload;
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2),
      `+${payload} ${consumableById(kind).icon}`, '#c9e8a4');
  } else {
    const gained = kind === 'essence' ? payload * (player.essenceMult || 1)
      : kind === 'meat' ? payload * (player.meatMult || 1) : payload;
    player[kind] = roundResource(player[kind] + gained);
    const [icon, color] = RES_POPUP[kind];
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2), `+${fmtResource(gained)} ${icon}`, color);
    if (player.quest?.type === 'gather' && player.quest.res === kind) questProgress(gained);
  }
  pickupSfx[kind]?.();
  // every branch, not just items: with a panel open in co-op the resource line
  // and the "too expensive" styling stayed on pre-pickup numbers
  panels.refresh();
  refreshHud();
}

const pickups = new Pickups(scene, world, {
  onCollect: (p, target) => {
    if (target === player) grantPickup(p.kind, p.payload);
    else mp?.onRemoteCollect(p, target.ownerUid); // co-op host: an ally's proxy grabbed it
  },
});
// fallen logs become wood pickups — host-side only, like island treasure,
// so the co-op guest doesn't mint unsynced local duplicates
const spawnWoodLog = (pos) => {
  if (mp?.active && !mp.isHost) return;
  pickups.spawn('wood', 1, pos, 0.15);
};
world.onWoodLog = spawnWoodLog;

// the pet is a REAL combat target: enemies chase and hit it through the
// same seam as players, and its bites pull threat onto it
const petProxy = {
  id: 'pet', isPet: true, hitR: 0.5, sizeMult: 1, stunT: 0,
  get pos() { return companions.wolf?.pos ?? null; },
  get mesh() { return companions.wolf?.mesh ?? null; },
  get hp() { return companions.wolf?.hp ?? 0; },
  get maxHp() { return companions.wolf?.maxHp ?? 0; },
  get dead() { return !companions.wolf || player.petDead; },
  takeDamage: (dmg, src) => companions.damagePet(dmg, player),
  applyStun: () => {},
};
// current combat target list for the local sim
function combatTargets() {
  return (companions.wolf && !player.petDead) ? [player, petProxy] : [player];
}

function discoverType(type) {
  panels.discover(type);
  const cfg = ENEMY_TYPES[type];
  ui.toast(`🆕 New creature discovered: ${cfg.icon} ${cfg.name}! (see Bestiary — N)`, 'discover');
  audio.sfx('evolve_ready', 0.35);
}

// anime impact words cycled per hit so a flurry doesn't read as one repeated word
const POW_WORDS = ['POW!', 'BAM!', 'WHAM!', 'THWACK!', 'SMASH!'];
let powTick = 0;
const enemyMgr = new EnemyManager(scene, world, {
  popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
  onKill: (enemy) => {
    // A keeper died in a real fight — retire its POI from the garrison sweep.
    // Marked before anything can return: however it died, the player was
    // standing there, and restocking a fight they already won is worse than
    // leaving a half-cleared crypt. (Melted keepers never reach this path.)
    if (enemy.cryptId != null) {
      const guarded = world.pois?.find(p => p.id === enemy.cryptId);
      if (guarded) guarded.cleared = true;
    }
    // a fallen village guard yields nothing — no XP, meat or hide (and no
    // quest credit); killing the law is its own punishment
    if (enemy.cfg?.friendly) return;
    // Kill XP follows the GROUP: whoever landed the killing blow scores, and so
    // do their group-mates near the corpse (75% each once two or more share).
    // Ungrouped players keep their own kills — no free XP from a stranger.
    const shareUids = (mp?.active && mp.killShareUids?.(enemy)) || [];
    const meGot = !player.dead && (mp?.active ? mp.meScoresKill(enemy, player.pos) : true);
    const sharers = shareUids.length + (meGot ? 1 : 0);
    const xp = Math.max(1, Math.round(enemy.xp * (sharers >= 2 ? 0.75 : 1)));
    for (const uid of shareUids) mp.sendKillXp(xp, uid);
    if (meGot) {
      player.kills++;
      player.addXp(xp);
      if (player.classEffects.lifeOnKillPct) {
        player._healSelf(player.maxHp * player.classEffects.lifeOnKillPct);
      }
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.3), `+${xp} XP`, '#c9a4ff');
    }
    // Quest credit follows the same group rule: my own kills always count, a
    // group-mate's kill counts when I'm close, a stranger's never does.
    if (meGot) trackQuestKill(enemy);
    mp?.shareQuestKill?.(enemy, QUEST_KILL_SHARE_RADIUS);
    // meat falls to the ground and is magnet-collected (shared in co-op)
    const piles = Math.min(4, Math.max(1, Math.round(enemy.meat / 2)));
    let left = enemy.meat;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(enemy.meat / piles);
      left -= amount;
      pickups.spawn('meat', amount, enemy.pos, 0.9 * enemy.sizeMult, null, true);
    }
    // big animals always drop their full hide (even if they chased you back
    // into the Verdant Forest); small critters there — and bats — leave a
    // scrap, with an occasional whole pelt so Lv3 hide gear is reachable early
    if (enemy.type === 'sheep') pickups.spawn('wool', 1 + (Math.random() < 0.5 ? 1 : 0), enemy.pos, 0.8, null, true);
    if (enemy.type === 'snapper' && Math.random() < 0.65) pickups.spawn('venom', 1, enemy.pos, 0.7, null, true);
    if (HIDE_BEARING.has(enemy.type)) {
      pickups.spawn('hide', hideForLevel(enemy.level), enemy.pos, 1.1 * enemy.sizeMult, null, true);
    } else if (biomeIndexAt(enemy.pos.x, enemy.pos.z) === 0 || enemy.type === 'bat') {
      pickups.spawn('hide', Math.random() < 0.1 ? 1 : VERDANT_HIDE_DROP, enemy.pos, 0.9, null, true);
    }
    // deep-woods kills bleed Ethereal Essence — the arcane currency
    if (!enemy.cfg.passive) {
      const ess = essenceDropFor(biomeIndexAt(enemy.pos.x, enemy.pos.z));
      if (ess > 0) pickups.spawn('essence', ess, enemy.pos, 0.8, null, true);
    }
    if (enemy.lairDrop) {
      // a NAMED lair boss: its unique item is GUARANTEED, plus a fat cache
      pickups.spawn('item', enemy.lairDrop, enemy.pos, 0.4, null, true);
      pickups.spawn('essence', 5, enemy.pos, 1.2, null, true);
      // in a dungeon the overworld poi list is swapped out — use the door ref
      const poi = (game.dungeon?.poi.id === enemy.lairId ? game.dungeon.poi : null)
        ?? world.pois?.find(p => p.id === enemy.lairId);
      if (poi) {
        markPoiClaimed(poi);
        recordQuestEvent('lair', poi.ring);
        recordQuestEvent('landmark', poi.ring);
        minimap.redrawT = 0;
      }
      ui.banner(`— ${enemy.bossName} falls! —`);
      ui.toast(`🏆 ${enemy.bossName} is slain — its unique treasure is yours!`, 'level');
      audio.sfx('victory', 0.6);
      if (game.dungeon && game.dungeon.poi.id === enemy.lairId) {
        world.openExit?.();
        ui.toast('✨ A green way out shimmers open at the back of the hall — press E there to leave.', 'level');
        audio.sfx('map_reveal', 0.6);
      }
    } else if (enemy.bossRank > 0) rollBossDrop(enemy);
  },
  onDiscover: discoverType,
  onLairBrood: (enemy) => {
    if (game.editorView) return; // no combat theatrics while sculpting the map
    ui.toast(`💀 ${enemy.bossName} calls the brood — cut them down fast!`, 'boss');
    ui.hurtFlash();
    audio.sfx('lane_unlock', 0.5);
  },
  onBossSpawn: (enemy) => {
    // the editor previews spawns silently — no boss toast, screen flash,
    // camera shake or health tracker leaking over the god view
    if (game.editorView) return;
    const skulls = '💀'.repeat(enemy.bossRank);
    ui.addTracker('boss' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 2.6 * enemy.sizeMult) : null,
      `<div class="boss-name">${enemy.bossName ?? ''}</div>${skulls}`, 'skulls', null,
      { worldRadius: MOB_INFO_RADIUS });
    // herd-guardian ambush bosses stay quiet — finding them is the surprise
    if (!enemy.ambush) {
      ui.toast(`${skulls} ${enemy.bossName ?? 'A pack mother'} appears! Her children keep coming until she falls.`, 'boss');
      ui.hurtFlash();
      shakeCamera(0.35, 0.5); // the ground trembles when a mother arrives
    }
  },
  onBossDeath: (enemy) => ui.removeTracker('boss' + enemy.id),
  // HP bar above every enemy (+ spell charge bar for casters)
  onSpawn: (enemy) => {
    const ranged = enemy.cfg.ranged;
    const shotColor = ranged ? '#' + enemy.cfg.shotColor.toString(16).padStart(6, '0') : '';
    const label = enemy.bossName ?? enemy.cfg.name;
    // elites get a red half-skull badge above the bar — a rank below a boss skull
    const badge = enemy.elite ? '<div class="elite-badge" title="Elite">☠</div>' : '';
    const html = '<div class="hpbar"><div class="hpbar-fill"></div></div>' +
      (ranged ? `<div class="castbar"><div class="castbar-fill" style="background:${shotColor}"></div></div>` : '') +
      `<div class="unit-name"><span class="unit-label">${label}</span>${mobLevelBadge(enemy.level)}</div>` + badge;
    ui.addTracker('hp' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 1.5 * enemy.sizeMult + 0.5) : null,
      html, 'hpwrap' + (enemy.bossRank > 0 ? ' boss' : '') + (enemy.elite ? ' elite' : ''),
      (el) => {
        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        const fill = el.children[0].firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = pct > 0.5 ? '#5fd35f' : pct > 0.25 ? '#e0c040' : '#e05050';
        if (ranged) {
          const charge = 1 - Math.max(0, enemy.spellTimer) / enemy.cfg.spellCd;
          el.children[1].firstChild.style.width = (charge * 100) + '%';
        }
      }, { worldRadius: MOB_INFO_RADIUS });
  },
  onRemove: (enemy) => ui.removeTracker('hp' + enemy.id),
  // every landed blow: punch the camera and pop an anime impact word. Crits
  // hit harder and shout louder; ordinary swings just thump.
  onLocalHit: (enemy, dmg, opts) => {
    player.combatNoiseT = 0;
    shakeCamera(opts?.crit ? 0.17 : 0.09, opts?.crit ? 0.55 : 0.24);
    if (enemy?.mesh) {
      const at = enemy.mesh.position.clone()
        .setY(enemy.mesh.position.y + 1.15 * (enemy.sizeMult || 1) + 0.5);
      const word = opts?.weakPoint ? 'CRACK!' : opts?.crit ? 'POW!' : POW_WORDS[(powTick++) % POW_WORDS.length];
      ui.popup(at, word, opts?.crit ? '#ffd23a' : '#fff3c4', 'pow');
      player._fxBurst?.(enemy.pos, opts?.crit ? 0xffd23a : 0xfff0b0, opts?.crit ? 10 : 6, 4, 0.28);
    }
  },
  // a beaten griffin drops its nest and flees; it may return in ~20 minutes
  onGriffinEscape: (enemy) => {
    pickups.spawn('item', enemy.nestItem ?? 'desertNest', enemy.pos, 0.8, null, true);
    if (enemy.griffinBiome != null) griffinNextAt[enemy.griffinBiome] = game.time + 1200;
    ui.banner('🪽 The griffin yields!');
    ui.toast('🪺 Beaten, the griffin drops its NEST and flees beyond the horizon. Place the nest to make a flight roost!', 'level');
    audio.sfx('victory', 0.5);
  },
});
// landing any hit flags the player "in combat" — pauses the fast WoW-style
// out-of-combat recovery for a few seconds
enemyMgr.onLocalHit = () => { player.combatNoiseT = 0; };

const projectiles = new Projectiles(scene);
const targeting = new Targeting(scene, camera);
const companions = new Companions(scene, {
  popup: (pos, text, color) => ui.popup(pos, text, color),
  toast: (text, cls) => ui.toast(text, cls),
  addTracker: (...a) => ui.addTracker(...a),
  removeTracker: (id) => ui.removeTracker(id),
});
const minimap = new Minimap(document.getElementById('minimap'), world);
minimap.flightNests = flightNests; // 🪽 roost markers on the mini + world map

// Boss loot: a chance to drop an unowned item near the player's level.
function rollBossDrop(enemy) {
  const rank = BOSS_RANKS[enemy.bossRank - 1];
  if (Math.random() < rank.dropChance) {
    // companions are never loot — you TAME a wolf, you don't skin one for it
    // Boss-only trade-off gear is the reason to fight a boss at all, so give it
    // its own roll first: it is never for sale, and the ordinary pool would
    // drown it (it is 9 items against ~80).
    const bossPool = ITEMS.filter(i =>
      i.bossOnly && !player.hasItem(i.id) && i.level <= player.level + 3);
    if (bossPool.length && Math.random() < 0.45) {
      const pick = bossPool[Math.floor(Math.random() * bossPool.length)];
      pickups.spawn('item', pick.id, enemy.pos, 0.5, null, true);
      return;
    }
    const candidates = ITEMS.filter(i =>
      !i.free && !i.unique && !i.bossOnly && !player.hasItem(i.id)
      && i.level <= player.level + 1 && i.slot !== 'companion');
    if (!candidates.length) { pickups.spawn('meat', 5, enemy.pos, 1, null, true); return; }
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    pickups.spawn('item', item.id, enemy.pos, 0.5, null, true);
    return;
  }
  // no item? she may cough up a TREASURE MAP instead — an X somewhere out
  // there, dig it up with E for a fat cache
  if (game.kind === 'survival' && !player.treasureAt && Math.random() < 0.3) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.min(WORLD.radius - 150,
      Math.max(120, radiusOf(enemy.pos.x, enemy.pos.z) + (Math.random() - 0.3) * 300));
    player.treasureAt = { x: Math.sin(a) * r, z: Math.cos(a) * r };
    minimap.treasureAt = player.treasureAt;
    ui.toast('🗺️ The boss dropped a TREASURE MAP! An ✖ marks the spot on your maps.', 'level');
    audio.sfx('kill_gold', 0.5);
  }
}

function endStats() {
  const m = Math.floor(game.time / 60), s = Math.floor(game.time % 60);
  return {
    level: player.level,
    kills: player.kills,
    distance: Math.max(0, Math.round(radiusOf(player.pos.x, player.pos.z))),
    wood: player.wood,
    time: `${m}:${String(s).padStart(2, '0')}`,
  };
}

// Shared entry into play mode (solo start button + multiplayer session begin).
// cover the spawn while the surrounding chunks build, then reveal once the
// near view radius is fully generated (no more first-seconds hitch). Runs on
// desktop and mobile alike; a 3 s safety cap guarantees it always lifts.
function warmUpAndReveal() {
  const ov = $id('enter-overlay');
  if (!ov) return;
  ov.classList.remove('hidden', 'fade');
  let frames = 0;
  const step = () => {
    frames++;
    const missing = world.warmUp(player.pos, 14);
    if (missing === 0 || frames > 180) {
      // let this frame's fresh meshes upload to the GPU, then fade out
      requestAnimationFrame(() => {
        ov.classList.add('fade');
        setTimeout(() => ov.classList.add('hidden'), 500);
      });
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function startPlaying() {
  ui.hideMenu();
  const ov = $id('enter-overlay');
  if (ov) { ov.classList.remove('hidden', 'fade'); } // cover the menu→game cut at once
  hideJoinCodeHud(); // solo runs show nothing; a co-op host re-shows it after host()
  // ?devmode is a SINGLEPLAYER sandbox only: in any multiplayer session strip
  // admin mode and its stat overrides so everyone plays on equal footing. Solo
  // devmode keeps admin mode on.
  if (mp?.active) {
    if (game.adminMode || player.adminOverrides) {
      game.adminMode = false;
      player.adminOverrides = null;
      player.recompute();
    }
  } else if (DEVMODE) {
    game.adminMode = true;
  }
  if (game.kind === 'survival') clearHunterTraps();
  // safety: never carry a half-open lair dungeon into a fresh run
  if (game.dungeon) { try { exitLair(false); } catch {} game.dungeon = null; enemyMgr.suspend = false; $id('minimap').style.display = ''; }
  game.mode = 'play';
  game.tod = START_TOD; // every run opens at 08:00 (co-op then syncs to the room epoch)
  // survival always wakes in the Verdant camp — start ITS biome track straight
  // away. (updateAtmosphere only swaps music on a biome CHANGE, and you begin
  // in biome 0, so the first track has to be set here or it never plays.)
  if (game.kind === 'survival') {
    game.biomeIndex = 0;
    audio.playMusic(BIOME_MUSIC[0]);
  } else {
    audio.playMusic('level1');
  }
  if (game.kind === 'survival') {
    // everyone gets their own camp at the cave mouth
    camp = new Camp(scene, world, player, {
      popup: (pos, text, color) => ui.popup(pos, text, color),
      toast: (text, cls) => ui.toast(text, cls),
    });
    panels.camp = camp;
    $id('minimap-zoom').classList.remove('hidden');
    player.pos.set(0, 0, -2); // wake up inside the cave
    // treasure islands spawn their loot lazily as their chunk is discovered
    world.onIsland = (lake) => {
      if (mp?.active && !mp.isHost) return; // co-op guest sees the host's loot
      const at = { x: lake.x, z: lake.z };
      // island treasure scales with the biome ring — deep islands pay deep
      const bi = biomeIndexAt(lake.x, lake.z);
      const k = 1 + bi * 0.6;
      pickups.spawn('meat', Math.round(8 * k), at, 1.2);
      pickups.spawn('stone', Math.round(6 * k), at, 1.2);
      pickups.spawn('hide', Math.round(3 * k), at, 1.2);
      if (bi >= 3) pickups.spawn('iron', 2 + bi, at, 1.2);
      if (Math.random() < 0.4 + bi * 0.06) {
        const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
          && i.level <= player.level + 1);
        pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, at, 0.6);
      }
    };
    // the starting biome's lair rumor lands after a short grace (the biome
    // banner never fires for the ring you wake up in)
    setTimeout(() => { if (game.mode === 'play') hintLair(game.biomeIndex); }, 30_000);
    // crypts, jungle temples and the summit come pre-garrisoned with a
    // silent guard pack — the summit's keeper is a colossal named boss
    const postGuards = (poi) => {
      if (poiClaimActive(poi.id)) poi.claimed = true;   // honour the saved ledger
      // NOT gated on poi.guarded: EnemyManager melts units past ZONE_RELEASE
      // (205 m) back into their zone pool, so a garrison you walked away from
      // genuinely evaporates. Gating on "was it ever manned" meant the keepers
      // never came back and the crypt was free loot on the second visit.
      // regarrisonNearby re-enters here; poi.cleared is what retires a POI.
      if (poi.claimed || poi.cleared) return;
      if (!['crypt', 'temple', 'summit', 'lair', 'captive'].includes(poi.type)) return;
      if (mp?.active && !mp.isHost) return; // host simulates the guards
      poi.guarded = true;
      const biome = BIOMES[biomeIndexAt(poi.x, poi.z)];
      const type = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
      const progress = progressAt(poi.x, poi.z);
      if (poi.type === 'lair') {
        // Singleplayer: the crypt is a DOOR — the named boss lives inside its
        // own instanced dungeon (walk up and press E). Co-op keeps the
        // classic outdoor fight so nothing needs syncing.
        if (!mp?.active) return;
        const lair = BIOME_LAIRS[poi.ring];
        if (!lair) return;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const g = enemyMgr._spawn(type, poi.x + Math.cos(a) * 5, poi.z + Math.sin(a) * 5, progress);
          g.aggroed = false; g.cryptId = poi.id;
        }
        const boss = enemyMgr._spawn(lair.type, poi.x, poi.z - 4, progress, 3, { ambush: true });
        dressLairBoss(boss, lair, poi.id);
        boss.aggroed = false; boss.cryptId = poi.id;
        // the master of the lair stirs — a proper entrance
        ui.banner(`💀 ${lair.name} 💀`);
        ui.toast(`💀 You have found the lair of ${lair.name}. Slay the master for a UNIQUE treasure!`, 'boss');
        audio.creature(lair.type, 'attack', 0.6, 50);
        return;
      }
      if (poi.type === 'summit') {
        // The Father of the Mountain: a 3-skull colossus flanked by wardens
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const g = enemyMgr._spawn('yeti', poi.x + Math.cos(a) * 6, poi.z + Math.sin(a) * 6, progress);
          g.aggroed = false; g.cryptId = poi.id;
        }
        const boss = enemyMgr._spawn('icegolem', poi.x, poi.z - 5, progress, 3,
          { ambush: true, noReinforce: false });
        boss.bossName = 'Ymir, Father of the Mountain';
        boss.aggroed = false; boss.cryptId = poi.id;
        return;
      }
      const rank = poi.type === 'temple' ? 3 : (poi.ring < 2 ? 1 : poi.ring < 4 ? 2 : 3);
      const count = poi.type === 'captive' ? 8 : (poi.type === 'temple' ? 6 : 4 + rank);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const g = enemyMgr._spawn(type, poi.x + Math.cos(a) * 4.5, poi.z + Math.sin(a) * 4.5, progress);
        g.aggroed = false;
        g.cryptId = poi.id;
      }
      if (poi.type !== 'captive') {
        const boss = enemyMgr._spawn(type, poi.x + 3, poi.z + 3, progress, rank,
          { ambush: true, noReinforce: true });
        boss.aggroed = false;
        boss.cryptId = poi.id;
      }
    };
    world.onPoiSpawned = (poi) => {
      postGuards(poi);
      // How many keepers this POI is SUPPOSED to have. Zero means it was never
      // meant to have any — a singleplayer lair is a door to an instanced
      // dungeon, not an outdoor fight — so the sweep leaves those alone.
      poi.garrison = (enemyMgr.alive?.() ?? []).filter(e => e.cryptId === poi.id).length;
    };
    // the co-op guest renders the HOST's enemies
    if (!(mp?.active && mp.mode === 'coop' && !mp.isHost)) enemyMgr.spawnInitialWave();
  }
  // ?devmode boots at max level so class trees and late-game gear are testable —
  // SINGLEPLAYER only (no free levels handed out in a multiplayer session)
  if (DEVMODE && !mp?.active) player.setLevel(MAX_LEVEL);
  // build the world around the spawn behind the overlay, then reveal
  warmUpAndReveal();
  // become the character picked on the menu (the world is ready for it now)
  if (game.kind === 'survival') applyPendingCharacter();
  // You never wake up winded: whichever way you got here — new run, loaded
  // save, co-op join, MOBA — the action bars start full.
  player.recompute();
  player.energy = player.maxEnergy;
  player.mana = player.maxMana;
}

function startGame() {
  stopServerStatusWatch(); // leaving the lobby — stop polling the dedicated server
  startPlaying();
  ui.toast('You wake in a cave… follow the light. Punch small trees for wood, craft at the camp (U).', 'info');
}

// Camp buildings: pay, build, apply effects (home hp bonus, era unlocks).

// era perks: hp bonus + magnet reach + chop power + XP gain
function applyCampPerks() {
  if (!camp) return;
  player.campBonus = camp.homeHpBonus();
  player.chopMult = camp.chopMult();
  player.xpMult = camp.xpMult();
  player.forgeTier = camp.forgeTier();
  pickups.magnetMult = camp.magnetMult();
  player.recompute();
}

// ---------- MOBA mode ----------
// Swap the survival strip for the square three-lane map and place the hero.
function setupMobaWorld(seed, side) {
  game.kind = 'moba';
  mobaSide = side;
  camp?.dispose(); camp = null; panels.camp = null; // no survival camp in MOBA
  $id('minimap-zoom').classList.add('hidden');
  world.dispose();
  world = new MobaWorld(scene, seed);
  world.onWoodLog = spawnWoodLog;
  pickups.world = world;
  enemyMgr.world = world;
  game.seed = seed;
  const bp = MOBA.basePos[side];
  const inward = side === 'player' ? 1 : -1;
  player.pos.set(bp.x + 9 * inward, 0, bp.z - 9 * inward);
  player.meat = 15;
  // MOBA creep XP payouts are small flat values — boost the hero's XP intake
  // so match pacing survives the much taller survival XP curve
  player.xpMult = 2.5;
  $id('base-btn').classList.remove('hidden');
}

function mobaHooks() {
  return {
    popup: (pos, text, color) => ui.popup(pos, text, color),
    discover: discoverType,
    rewardLocal: (xp, meat, pos) => {
      if (xp > 0) {
        player.addXp(xp);
        ui.popup(pos.clone().setY(2), `+${xp} XP`, '#c9a4ff');
      }
      if (meat > 0) pickups.spawn('meat', meat, pos, 0.8);
    },
    rewardPartner: (xp, meat) => mp?.sendMobaReward?.(xp, meat),
    onBuilt: () => panels.refresh(),
    onEnd: (playerWon) => {
      const iWon = mobaSide === 'player' ? playerWon : !playerWon;
      mp?.sendMobaEnd?.(!iWon); // tell the partner whether THEY won
      endMoba(iWon);
    },
  };
}

function endMoba(iWon) {
  if (game.mode !== 'play') return;
  game.mode = iWon ? 'won' : 'dead';
  aimArc.visible = false;
  audio.stopMusic(); setAmbience(null); audio.loopStop('jungle_rain');
  audio.sfx(iWon ? 'victory' : 'defeat', 0.6);
  const end = document.getElementById('end-title');
  ui.showEnd(iWon, endStats());
  end.textContent = iWon ? 'Enemy base destroyed — VICTORY!' : 'Your base has fallen…';
}

function startMobaSolo() {
  setupMobaWorld(Math.floor(Math.random() * 1e9), 'player');
  moba = new Moba(scene, world, player, projectiles, pickups, ui, mobaHooks());
  panels.moba = moba;
  mobaMini = new MobaMinimap(document.getElementById('minimap'), moba);
  startPlaying();
  ui.toast('🏰 MOBA! Farm the jungle camps, then build Creep Dens & Towers (shop → Base tab).', 'level');
}

function healAtMobaBase(dt) {
  const bp = MOBA.basePos[mobaSide];
  if (!bp || player.dead || player.hp >= player.maxHp) return;
  if (Math.hypot(player.pos.x - bp.x, player.pos.z - bp.z) > MOBA.baseR) return;
  player.hp = Math.min(player.maxHp, player.hp + 18 * dt);
}

// On death, HALF of every CARRIED resource spills onto the ground where you
// fell — recoverable if you fight your way back; the rest is lost. Resources
// stored in the camp chest are untouched (that's what it's for).
function dropHalfMeat(pos) {
  let totalDropped = 0;
  for (const res of RESOURCES) {
    const dropped = Math.floor(player[res] / 2); // spill HALF (whole numbers)
    player[res] = roundResource(player[res] - dropped); // …and KEEP the rest
    if (dropped <= 0) continue;
    totalDropped += dropped;
    const piles = Math.min(3, Math.max(1, Math.round(dropped / 5)));
    let left = dropped;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(dropped / piles);
      left -= amount;
      // in co-op the HOST owns pickups — routed there, everyone sees the spill
      if (mp?.active && !mp.isHost) {
        mp.sendDrop(res, amount, pos.x + (Math.random() - 0.5) * 3, pos.z + (Math.random() - 0.5) * 3);
      } else {
        pickups.spawn(res, amount, pos, 1.6);
      }
    }
  }
  return totalDropped;
}

// Survival death is soft: you wake up at the spawn cottage, but you lose a
// full level (XP resets to that level's start) and half your meat spills where
// you fell.
// ---------- death → ghost → resurrection (WoW-style) ----------
// Dying does NOT cost you the level any more. You rise as a ghost at the
// nearest graveyard you know and run — at 2.5× speed — back to your corpse.
// Reaching it restores you intact; giving up and resurrecting at the graveyard
// costs this level's XP progress. Your loot still spills where you fell.
const ghost = { active: false, corpse: null, grave: null, mesh: null };

// ---- POI claim ledger ----
// poi.claimed lived only on the in-memory world, so quitting and rejoining
// handed you every shrine and every caged captive again. Claims are recorded
// here with a real timestamp and saved with the character; a claim older than
// one full game day (DAY_LENGTH real minutes = 24 game hours) lapses, so these
// become daily rather than infinite.
const poiClaims = Object.create(null);
const POI_COOLDOWN_MS = 24 * 60 * 1000;      // 24 game hours == 24 real minutes

function markPoiClaimed(poi) {
  if (!poi?.id) return;
  poiClaims[poi.id] = Date.now();
  // The line below used to read `markPoiClaimed(poi)` — the function called
  // ITSELF, so every claim threw RangeError out of the first statement of the
  // reward block and took the rest with it: no quest credit, no XP, no loot,
  // no banner, and the dungeon exit never opened after a lair boss died. It
  // also left the POI unclaimed in the live session; only a relog picked the
  // ledger back up through applyPoiClaims.
  poi.claimed = true;
}
// has this claim lapsed? (also the seam that re-opens a POI after a day)
function poiClaimActive(id) {
  const at = poiClaims[id];
  return !!at && (Date.now() - at) < POI_COOLDOWN_MS;
}
// Re-man POIs whose keepers evaporated. EnemyManager melts any unit further
// than ZONE_RELEASE (205 m) from the player back into its zone pool, so a
// garrison you walked away from is simply GONE — and the claim check counts
// live keepers, so the second visit to any crypt used to be free loot. Mirrors
// GameRoom._garrisonNear; kept just under the melt radius so fresh keepers
// don't dissolve on the tick they spawn.
const GARRISON_R = 180;
const GARRISON_EVERY = 0.5;
let garrisonAcc = 0;
function regarrisonNearby(dt) {
  if (mp?.active && !mp.isHost) return;   // the host/server owns the guards
  if (!world.onPoiSpawned || game.dungeon) return;
  garrisonAcc += dt;
  if (garrisonAcc < GARRISON_EVERY) return;
  garrisonAcc = 0;
  const manned = new Set();
  for (const e of enemyMgr.alive?.() ?? []) {
    if (e.cryptId != null && !e.dying) manned.add(e.cryptId);
  }
  for (const poi of world.pois ?? []) {
    // garrison > 0 means keepers were posted here once, so they belong here.
    // A singleplayer lair never posts any (it is a door into an instanced
    // dungeon), which is exactly how it stays out of this sweep.
    if (!poi.garrison || poi.claimed || poi.cleared || manned.has(poi.id)) continue;
    if (Math.hypot(player.pos.x - poi.x, player.pos.z - poi.z) > GARRISON_R) continue;
    poi.guarded = false;
    world.onPoiSpawned(poi);
  }
}

// re-apply the ledger to the freshly generated world, and expire old claims
function applyPoiClaims() {
  for (const id of Object.keys(poiClaims)) {
    if (!poiClaimActive(id)) delete poiClaims[id];
  }
  for (const poi of (world.pois || [])) {
    if (poiClaimActive(poi.id)) poi.claimed = true;
  }
}

// every graveyard the player may wake at: the world's own, plus a grave they
// placed themselves
function knownGraveyards() {
  const out = world.graveyards ? world.graveyards() : [{ x: 0, z: 4, name: 'your homestead' }];
  if (camp?.has('grave') && camp.gravePos) {
    out.push({ x: camp.gravePos.x, z: camp.gravePos.z + 2, name: 'your own grave' });
  }
  return out;
}

function nearestGraveyard(from) {
  const list = knownGraveyards();
  let best = list[0], bd = Infinity;
  for (const g of list) {
    const d = Math.hypot(g.x - from.x, g.z - from.z);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}

function survivalRespawn() {
  if (boatMounted) dismountBoat();
  if (player.mounted) dismountHorse();
  const at = player.pos.clone();
  minimap.deathAt = { x: at.x, z: at.z };          // the corpse marker on the map
  const dropped = dropHalfMeat(at);
  audio.sfx('defeat', 0.5);
  const by = player.killedBy || 'the wilds';
  ui.banner(`☠️ Slain by ${by}`);
  ui.toast(`☠️ Slain by ${by} · ${dropped} loot spilled. Run back to your body to keep your XP (you revive weak) — or resurrect at the graveyard at full strength and lose this level's XP.`, 'boss');
  player.killedBy = null;
  player.mesh.rotation.z = Math.PI / 2;            // lie down while "out"
  setTimeout(() => { if (game.mode === 'play') enterGhost(at); }, 2000);
}

function enterGhost(corpseAt) {
  // dying inside a lair throws you back out — your spilled loot waits at the door
  if (game.dungeon) exitLair(false);
  const grave = nearestGraveyard(corpseAt);
  ghost.active = true;
  ghost.corpse = { x: corpseAt.x, z: corpseAt.z };
  ghost.grave = grave;
  // leave the actual BODY behind — without it there is nothing to run back to
  ghost.mesh = makeCorpse();
  ghost.mesh.position.set(corpseAt.x, world.heightAt(corpseAt.x, corpseAt.z), corpseAt.z);
  scene.add(ghost.mesh);
  player.ghost = true;
  player.revive(1);                                // upright and moving, but dead
  player.pos.set(grave.x, 0, grave.z);
  setGhostVisual(true);
  ui.banner('👻 You are a ghost');
  ui.toast(`👻 You rise at ${grave.name}. Run to your body (👻 2.5× speed) and press E to return — or resurrect here and lose this level's XP.`, 'boss');
}

// the ghost look on your OWN body: the same spectral wash every other player
// sees on you, so a mirror and a bystander agree
function setGhostVisual(on) { setSpectralLook(player.mesh, on); }

// the screen-wide drain eases in and out instead of snapping
let ghostFade = 0;
function tickGhostFade(dt) {
  const want = ghost.active ? 1 : 0;
  const rate = want ? 1.6 : 2.6;               // fade in slower than it clears
  ghostFade += Math.sign(want - ghostFade) * Math.min(Math.abs(want - ghostFade), rate * dt);
}

function leaveGhost() {
  ghost.active = false;
  ghost.corpse = null;
  if (ghost.mesh) { scene.remove(ghost.mesh); ghost.mesh = null; }
  player.ghost = false;
  setGhostVisual(false);
  $id('respawn-choice').classList.add('hidden');
  $id('ghost-hint')?.classList.add('hidden');
  minimap.deathAt = null;
}

// reached the body: you come back where you fell, keeping every scrap of XP
function resurrectAtCorpse() {
  if (!ghost.active || !ghost.corpse) return;
  const { x, z } = ghost.corpse;
  leaveGhost();
  // Crawling back into your own body costs you: you keep every scrap of XP,
  // but you come round at 10% health with an EMPTY energy bar — wherever you
  // died is still dangerous, and you cannot simply resume the fight that killed
  // you. revive() refills both, so the drain has to come after it.
  player.revive(0.10);
  player.energy = 0;
  player.energySpentT = 0;
  player.pos.set(x, 0, z);
  audio.sfx('evolve_ready', 0.55);
  ui.banner('✨ Back from the dead');
  ui.toast('✨ You claw back into your body — XP intact, but you are spent: 10% health and no energy.', 'level');
}

// gave up on the run: full health at the graveyard, but this level's XP is gone
function resurrectAtGraveyard() {
  if (!ghost.active) return;
  const g = ghost.grave || { x: 0, z: 4 };
  leaveGhost();
  player.loseLevel();
  player.revive(1);          // full health, energy and mana — the trade is the XP
  player.pos.set(g.x, 0, g.z);
  audio.sfx('defeat', 0.45);
  ui.banner('⚰️ Resurrected');
  ui.toast(`⚰️ The spirits rebuild you at ${g.name ?? 'the graveyard'} — this level's XP progress is gone.`, 'boss');
}

// per-frame ghost bookkeeping: offer the body when you reach it
function tickGhost() {
  const hint = $id('ghost-hint');
  // the beacon over the body breathes so it catches the eye across the valley
  if (ghost.mesh) {
    const k = 0.85 + 0.15 * Math.sin(game.time * 2.2);
    ghost.mesh.userData.beam.material.opacity = 0.13 * k;
    ghost.mesh.userData.ring.material.opacity = 0.5 * k;
    ghost.mesh.userData.ring.scale.setScalar(k);
  }
  if (!ghost.active || !ghost.corpse) {
    hint?.classList.add('hidden');
    $id('respawn-choice')?.classList.add('hidden');
    return;
  }
  // hold the spectral look: the class-visual system owns these same materials
  // and resets their opacity, so a one-shot application silently wore off
  setGhostVisual(true);
  // "Resurrect here" is a GRAVEYARD service — it only makes sense while you are
  // standing at one, not the whole way across the map
  const g = ghost.grave;
  const atGrave = !!g && Math.hypot(player.pos.x - g.x, player.pos.z - g.z) < GRAVE_SERVICE_R;
  $id('respawn-choice')?.classList.toggle('hidden', !atGrave);
  const d = Math.hypot(player.pos.x - ghost.corpse.x, player.pos.z - ghost.corpse.z);
  if (hint) {
    if (d < GHOST_CORPSE_R) {
      hint.innerHTML = '✨ Your body — press <kbd>E</kbd> to return to life';
      hint.classList.remove('hidden');
    } else {
      hint.textContent = `👻 ${Math.round(d)} m to your body`;
      hint.classList.remove('hidden');
    }
  }
}
const GHOST_CORPSE_R = 3.2;
// a graveyard's resurrection is only offered while you stand at one
const GRAVE_SERVICE_R = 50;

function mobaRespawn() {
  ui.toast('☠️ You fell — respawning at your base…', 'boss');
  setTimeout(() => {
    if (game.mode !== 'play') return;
    player.revive(1);
    const bp = MOBA.basePos[mobaSide];
    const inward = mobaSide === 'player' ? 1 : -1;
    player.pos.set(bp.x + 9 * inward, 0, bp.z - 9 * inward);
  }, Math.min(10_000, 3000 + player.level * 500));
}

// Base tab purchases (solo & multiplayer; the MP guest builds via events).
function buildBase(id, lane) {
  const view = panels.moba;
  if (!view) return;
  const info = view.buildingInfo(mobaSide, id, lane);
  if (!info.cost) return;
  if (!Object.entries(info.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(info.cost)) player[k] -= v;
  if (view === moba) moba.build('player', id, lane);
  else { mp.sendMobaBuild(id, lane); view.registerBuild(id, lane); }
  audio.sfx('purchase', 0.5);
  panels.refresh();
}

// ---------- multiplayer lobby ----------
const $id = (id) => document.getElementById(id);

// ---------- username (required before entering any game) ----------
// Shown above your head to every other player instead of P1/P2/P3 labels.
const nameInput = $id('username');
function sanitizeName(s) { return String(s || '').replace(/[<>&"'`]/g, '').trim().slice(0, 14); }
function playerName() { return sanitizeName(nameInput?.value); }
if (nameInput) {
  nameInput.value = sanitizeName(localStorage.getItem('atw-name') || '');
  nameInput.addEventListener('input', () => {
    nameInput.classList.remove('name-missing');
    localStorage.setItem('atw-name', sanitizeName(nameInput.value));
  });
}
function requireName() {
  if (playerName()) return true;
  nameInput?.classList.remove('name-missing');
  void nameInput?.offsetWidth; // restart the shake animation
  nameInput?.classList.add('name-missing');
  nameInput?.focus();
  ui.toast('🧑 Choose a username first!', 'boss');
  return false;
}

// ?devmode-only left-side tools: a world-space ruler and free RPG flight.
// Opening the ruler panel turns its terrain-following circle on.
// main-menu shortcut into the World Editor. Idempotent, so it can be added
// either at boot (?devmode) or once auth resolves to the admin email.
function addWorldEditorMenuButton() {
  if ($id('menu-world-editor')) return;
  const modeSel = $id('mode-select');
  if (!modeSel) return;
  const web = document.createElement('button');
  web.id = 'menu-world-editor';
  web.innerHTML = '🛠️ World Editor<br><small>Admin: sculpt the island</small>';
  web.addEventListener('click', () => {
    openingEditor = true; // you're here to sculpt, not to play — skip New/Load
    startGame();
    setTimeout(() => { toggleWorldEditor(); openingEditor = false; }, 350);
  });
  modeSel.appendChild(web);
}
if (DEVMODE) addWorldEditorMenuButton();

if (DEVMODE) {
  const tool = $id('dev-distance-tool');
  const toggle = $id('dev-distance-toggle');
  const panel = $id('dev-distance-panel');
  const slider = $id('dev-distance-slider');
  const value = $id('dev-distance-value');
  const fly = $id('dev-fly-toggle');
  tool.classList.remove('hidden');
  tool.addEventListener('mousedown', (e) => e.stopPropagation());
  toggle.addEventListener('click', () => {
    const open = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    devDistanceRadius.setEnabled(open);
    if (open) devDistanceRadius.update(player, world, game.mode === 'play');
  });
  slider.addEventListener('input', () => {
    const metres = Number(slider.value);
    value.textContent = `${metres} m`;
    devDistanceRadius.setRadius(metres);
    devDistanceRadius.update(player, world, game.mode === 'play');
  });
  fly.addEventListener('change', () => {
    game.devFly = fly.checked;
    fly.closest('label')?.classList.toggle('active', fly.checked);
    if (fly.checked) {
      if (player.mounted) dismountHorse();
      if (!game.rpgView) {
        settings.rpgView = true;
        $id('set-rpgview').checked = true;
        localStorage.setItem('atw-settings', JSON.stringify(settings));
        applyViewMode();
      }
    }
    ui.toast(fly.checked
      ? '🪽 Fly mode ON — W/S follow the camera pitch'
      : '🪽 Fly mode off', 'level');
  });

  // ---- time of day: freeze it, run it fast, or jump straight to an hour.
  // Lighting work (night darkness, god rays, canopy shade) needs a specific
  // hour on demand — waiting out 24 real minutes for dusk is not a workflow.
  const timeToggle = $id('dev-time-toggle');
  const timePanel = $id('dev-time-panel');
  const timeLock = $id('dev-time-lock-toggle');
  const timeSet = $id('dev-time-set');
  const timeValue = $id('dev-time-value');
  const timeSpeed = $id('dev-time-speed');
  const timeSpeedValue = $id('dev-time-speed-value');
  const SPEEDS = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64]; // slider index → multiplier
  let timeDragging = false;
  const hhmm = (tod) => {
    const mins = ((Math.round(tod * 1440) % 1440) + 1440) % 1440;
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  };
  // the clock keeps running under the open panel, so mirror it back into the
  // slider — but never while it is being dragged, which would fight the drag
  devTimeSync = () => {
    if (timePanel.classList.contains('hidden') || timeDragging) return;
    timeSet.value = String(Math.round(game.tod * 1440 / 5) * 5 % 1440);
    timeValue.textContent = hhmm(game.tod);
  };

  timeToggle.addEventListener('click', () => {
    const open = timePanel.classList.contains('hidden');
    timePanel.classList.toggle('hidden', !open);
    timeToggle.classList.toggle('active', open);
    timeToggle.setAttribute('aria-expanded', String(open));
    if (open) devTimeSync();
  });
  timeLock.addEventListener('change', () => {
    game.devTimeLock = timeLock.checked;
    timeLock.closest('label')?.classList.toggle('active', timeLock.checked);
    ui.toast(timeLock.checked
      ? `⏸ Time locked at ${hhmm(game.tod)}`
      : '▶ Time running again', 'level');
  });
  timeSpeed.addEventListener('input', () => {
    game.devTimeScale = SPEEDS[Number(timeSpeed.value)] ?? 1;
    timeSpeedValue.textContent = `${game.devTimeScale}×`;
  });
  timeSet.addEventListener('input', () => {
    game.tod = (Number(timeSet.value) / 1440) % 1;
    timeValue.textContent = hhmm(game.tod);
  });
  timeSet.addEventListener('pointerdown', () => { timeDragging = true; });
  window.addEventListener('pointerup', () => { timeDragging = false; });
}

// ---------- settings (persisted in localStorage) ----------
const settings = Object.assign(
  { mouseMove: false },
  JSON.parse(localStorage.getItem('atw-settings') || '{}'),
);
// RPG view and free mouse-look are the intended default experience. They were
// already the default for a FRESH profile (the ??= below), but anyone who had
// switched them off — or whose profile predates them being defaults — stayed
// switched off forever. This is a ONE-TIME nudge, versioned so it never fights
// the player again: turn it off after this and it stays off.
const CONTROLS_DEFAULT_VERSION = 2;
if ((settings.controlsRev ?? 0) < CONTROLS_DEFAULT_VERSION) {
  settings.controlsRev = CONTROLS_DEFAULT_VERSION;
  settings.rpgView = true;
  settings.mouseLook = true;
  try { localStorage.setItem('atw-settings', JSON.stringify(settings)); } catch {}
}
{
  const box = $id('set-mousemove');
  box.checked = settings.mouseMove;
  box.addEventListener('change', () => {
    settings.mouseMove = box.checked;
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    audio.sfx('click', 0.4);
  });
  const mute = $id('set-mute');
  mute.addEventListener('change', () => {
    if (mute.checked !== audio.muted) audio.toggleMute();
  });

  // RPG third-person view: camera, fog and view distance all switch together
  const rpgBox = $id('set-rpgview');
  settings.rpgView ??= true; // RPG behind-the-shoulder is the default first impression
  rpgBox.checked = settings.rpgView;
  applyViewMode();
  rpgBox.addEventListener('change', () => {
    settings.rpgView = rpgBox.checked;
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    applyViewMode();
    ui.toast(settings.rpgView
      ? '🎮 RPG view — A/D turn, right-drag to look, wheel zooms'
      : '🗺️ Top-down view', 'level');
    audio.sfx('click', 0.4);
  });

  // free mouse-look (RPG only): pointer locks into the game and every mouse
  // move steers; A/D strafe. Esc (or opening any panel) frees the cursor.
  const lookBox = $id('set-mouselook');
  settings.mouseLook ??= true; // free mouse-look on by default (pairs with RPG view)
  lookBox.checked = settings.mouseLook;
  input.mouseLook = settings.mouseLook;
  lookBox.addEventListener('change', () => {
    settings.mouseLook = lookBox.checked;
    input.mouseLook = settings.mouseLook;
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    if (!settings.mouseLook) document.exitPointerLock?.();
    ui.toast(settings.mouseLook
      ? '🖱️ Mouse-look ON — click the world to lock the cursor in'
      : '🖱️ Mouse-look off', 'level');
    audio.sfx('click', 0.4);
  });

  // auto camera rotate: after 5 s of moving in one direction the camera (and
  // the minimap) turn so that direction reads as "up"; in RPG view, backing
  // up for 5 s spins the camera behind you instead
  const autoRotBox = $id('set-autorotate');
  settings.autoRotate ??= false;
  autoRotBox.checked = settings.autoRotate;
  autoRotBox.addEventListener('change', () => {
    settings.autoRotate = autoRotBox.checked;
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    ui.toast(settings.autoRotate
      ? '🔄 Auto camera rotate ON — hold a direction 5 s to turn the view'
      : '🔄 Auto camera rotate off', 'level');
    audio.sfx('click', 0.4);
  });

  // Players choose which carried resources remain visible during survival.
  const resourceNames = {
    meat: 'Meat', wood: 'Wood', stone: 'Stone', hide: 'Hide',
    iron: 'Iron', berry: 'Berries', wool: 'Wool', essence: 'Essence',
  };
  const savedHudResources = Array.isArray(settings.hudResources) ? settings.hudResources : RESOURCES;
  settings.hudResources = RESOURCES.filter(key => savedHudResources.includes(key));
  const resourceSettings = $id('set-hud-resources');
  resourceSettings.innerHTML = RESOURCES.map(key =>
    `<label><input type="checkbox" value="${key}"${settings.hudResources.includes(key) ? ' checked' : ''}>`
    + `<span>${resIcon(key, RES_ICONS[key])} ${resourceNames[key]}</span></label>`).join('');
  ui.setTrackedResources(settings.hudResources);
  resourceSettings.addEventListener('change', () => {
    settings.hudResources = [...resourceSettings.querySelectorAll('input:checked')].map(input => input.value);
    ui.setTrackedResources(settings.hudResources);
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    refreshHud();
    audio.sfx('click', 0.35);
  });

  // true fullscreen: the browser's tab strip and address bar go away. Must be
  // driven by a real click (browsers reject requestFullscreen otherwise), so
  // it's a button rather than a persisted setting.
  const fsBtn = $id('set-fullscreen');
  const fsLabel = () => {
    fsBtn.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Go fullscreen';
  };
  fsBtn.addEventListener('click', async () => {
    audio.sfx('click', 0.35);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch (e) {
      ui.toast('🖥️ Fullscreen was blocked by the browser — press F11 instead.', 'level');
    }
  });
  document.addEventListener('fullscreenchange', fsLabel);
  fsLabel();

  // hide any tracked resource whose total is 0 (on by default — a cleaner HUD)
  settings.hideZeroRes ??= true;
  const ownedBox = $id('set-ownedres');
  ownedBox.checked = settings.hideZeroRes !== false;
  ui.setHideZeroResources(settings.hideZeroRes !== false);
  ownedBox.addEventListener('change', () => {
    settings.hideZeroRes = ownedBox.checked;
    ui.setHideZeroResources(ownedBox.checked);
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    refreshHud();
    audio.sfx('click', 0.35);
  });

  // graphics: only ground texture detail is user-facing now. Bloom is OFF by
  // default (it dulled the image), and the shadow/filmic toggles are gone.
  // bloom is a real option again: it used to "dull the image" only because the
  // whole post path was writing linear light straight to the canvas (~60% too
  // dark). With that fixed and the scene rendering to an HDR target, bloom
  // catches the sun disc, water glints and flames the way it always should have.
  settings.bloom ??= true;
  settings.rays ??= true;   // crepuscular shafts through the canopy
  settings.hiShadows = false;
  settings.filmic = false;
  // retired options (removed from the UI): vivid grading is always ON, the
  // quality-vegetation kit and the experimental human avatar are always OFF,
  // and "distant terrain" is no longer a toggle — it derives from draw
  // distance (on for far/furthest, off below).
  settings.vivid = true;
  settings.vegQuality = false;
  settings.humanModel = false;
  // phones/tablets default to lighter graphics (short draw distance) — they
  // can raise it in Settings; desktops keep the generous default
  const onMobile = window.matchMedia?.('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 0;
  settings.texDetail ??= 1; // Medium ground detail by default — richer terrain
  settings.shadows ??= true;
  settings.resScale ??= 'auto';
  settings.drawDist ??= onMobile ? 'short' : 'far';
  settings.treeDetail ??= 'low';
  if (settings.treeDetail === 'medium') settings.treeDetail = 'low'; // tier removed
  settings.shadowDist ??= 'low';
  settings.ssao ??= false;
  settings.showFps ??= false;
  settings.fpsCap ??= 0; // 0 = unlimited
  settings.vegDist ??= 'furthest'; // ground-vegetation draw distance
  // "distant terrain" follows draw distance now (no standalone toggle)
  const syncFarTerrain = () => {
    settings.farTerrain = settings.drawDist === 'far' || settings.drawDist === 'furthest';
  };
  syncFarTerrain();
  const syncGfxControls = () => {
    $id('set-texdetail').value = String(settings.texDetail);
    $id('set-shadows').checked = settings.shadows !== false;
    $id('set-resscale').value = String(settings.resScale);
    $id('set-drawdist').value = String(settings.drawDist);
    $id('set-treedetail').value = String(settings.treeDetail);
    $id('set-shadowdist').value = String(settings.shadowDist);
    $id('set-vegdist').value = String(settings.vegDist);
    $id('set-ssao').checked = !!settings.ssao;
    $id('set-foliage').value = String(settings.foliage);
    $id('set-foliagemove').checked = settings.foliageMove !== false;
    $id('set-clouds').checked = settings.clouds !== false;
    $id('set-waterfx').checked = settings.waterFx !== false;
    $id('set-bloom').checked = settings.bloom !== false;
    $id('set-rays').checked = settings.rays !== false;
  };
  applyGraphics();

  // FPS meter toggle
  const fpsBox = $id('set-showfps');
  fpsBox.checked = !!settings.showFps;
  $id('fps-meter').classList.toggle('hidden', !settings.showFps);
  fpsBox.addEventListener('change', () => {
    settings.showFps = fpsBox.checked;
    $id('fps-meter').classList.toggle('hidden', !settings.showFps);
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    audio.sfx('click', 0.4);
  });

  // FPS cap slider (150 on the track = unlimited → stored as 0)
  const fpsCapSlider = $id('set-fpscap'), fpsCapOut = $id('set-fpscap-out');
  const fpsCapLabel = () => { fpsCapOut.textContent = fpsFrameCap > 0 ? `${fpsFrameCap}` : '∞'; };
  fpsCapSlider.value = String(settings.fpsCap && settings.fpsCap <= 144 ? settings.fpsCap : 150);
  fpsFrameCap = settings.fpsCap || 0;
  fpsCapLabel();
  fpsCapSlider.addEventListener('input', () => {
    const v = +fpsCapSlider.value;
    fpsFrameCap = v >= 150 ? 0 : v; // top of the track = unlimited
    settings.fpsCap = fpsFrameCap;
    fpsCapLabel();
    localStorage.setItem('atw-settings', JSON.stringify(settings));
  });
  // any hand-tweak in Advanced options flips the quality preset to Custom
  // (preset application itself sets this flag so it doesn't self-demote)
  let applyingPreset = false;
  const saveGfx = () => {
    if (!applyingPreset && settings.gfxPreset !== 'custom') {
      settings.gfxPreset = 'custom';
      $id('set-gfxpreset').value = 'custom';
    }
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    applyGraphics();
    audio.sfx('click', 0.4);
  };
  $id('set-texdetail').addEventListener('change', () => {
    settings.texDetail = +$id('set-texdetail').value;
    saveGfx();
    world.regenChunks(); // ground tiles rebuild at the new detail
    world.update(0, player.pos);
  });
  $id('set-shadows').addEventListener('change', () => {
    settings.shadows = $id('set-shadows').checked;
    saveGfx();
  });
  // Dev-tab experiment. It only takes effect on a reload, because the avatar is
  // chosen once when Player is constructed — say so rather than let it look broken.
  $id('set-rigged')?.addEventListener('change', () => {
    settings.riggedAvatar = $id('set-rigged').checked;
    saveGfx();
    ui.toast(settings.riggedAvatar
      ? '🧍 Rigged avatar ON — reload the page to see it.'
      : '🧍 Rigged avatar OFF — reload the page.', '');
  });
  $id('set-resscale').addEventListener('change', () => {
    settings.resScale = $id('set-resscale').value;
    saveGfx();
  });
  $id('set-drawdist').addEventListener('change', () => {
    settings.drawDist = $id('set-drawdist').value;
    syncFarTerrain(); // distant terrain rides the draw distance
    saveGfx();
    applyViewMode(); // fog baseline shifts with the new distance
  });
  $id('set-treedetail').addEventListener('change', () => {
    settings.treeDetail = $id('set-treedetail').value;
    saveGfx(); // sets world.treeDetail
    // trees are baked per-detail templates → rebuild the near ring NOW
    // (the sim is paused while Settings is open)
    world.regenChunks();
    for (let i = 0; i < 24 && world.warmUp(player.pos, 30) > 0; i++) { /* fill */ }
  });
  $id('set-shadowdist').addEventListener('change', () => {
    settings.shadowDist = $id('set-shadowdist').value;
    saveGfx(); // applyGraphics resizes the shadow frustum + map
  });
  $id('set-vegdist').addEventListener('change', () => {
    settings.vegDist = $id('set-vegdist').value;
    saveGfx(); // applyGraphics sets world.vegDrawDist
    world.refreshVegVisibility(player.pos); // apply live (sim is paused here)
  });
  $id('set-ssao').addEventListener('change', () => {
    settings.ssao = $id('set-ssao').checked;
    saveGfx(); // applyGraphics builds the post stack on demand
  });

  // foliage: density regenerates the world's decoration meshes; motion just
  // flips the wind/trample shader uniforms (free, no rebuild). Desktops get
  // the lush grass by default; phones stay lighter. The UI now offers just
  // two tiers — Low (internal 'high') and High (internal 'ultra') — so any
  // older stored value below 'high' migrates up to the new floor.
  settings.foliage ??= onMobile ? 'high' : 'ultra';
  if (settings.foliage !== 'high' && settings.foliage !== 'ultra') settings.foliage = 'high';
  settings.foliageMove ??= true;
  world.foliageMult = FOLIAGE_MULT[settings.foliage] ?? 1;
  $id('set-foliage').addEventListener('change', () => {
    settings.foliage = $id('set-foliage').value;
    world.foliageMult = FOLIAGE_MULT[settings.foliage] ?? 1;
    saveGfx();
    // rebuild decoration meshes NOW — the sim is paused while Settings is
    // open, so pumping world.update wouldn't fill anything; regen + a bounded
    // synchronous warm-up refills the near ring immediately
    world.regenChunks();
    for (let i = 0; i < 24 && world.warmUp(player.pos, 30) > 0; i++) { /* fill */ }
  });
  $id('set-foliagemove').addEventListener('change', () => {
    settings.foliageMove = $id('set-foliagemove').checked;
    saveGfx();
  });

  // sky/world extras — each is a straight uniform or radius gate, so
  // toggling is instant (no chunk rebuilds)
  settings.clouds ??= true;
  settings.waterFx ??= true;
  for (const [id, key] of [['set-clouds', 'clouds'], ['set-waterfx', 'waterFx'],
                           ['set-bloom', 'bloom'], ['set-rays', 'rays']]) {
    $id(id).addEventListener('change', () => {
      settings[key] = $id(id).checked;
      saveGfx();
    });
  }

  // ---- graphics quality presets ----
  // One dropdown drives the whole Advanced grid. Picking a preset stamps its
  // values over the settings and rebuilds what needs rebuilding; touching any
  // Advanced control afterwards renames the preset to Custom (see saveGfx).
  const GFX_PRESETS = {
    low:    { shadows: false, texDetail: 1, resScale: '1',    drawDist: 'normal',
              vegDist: 'medium',   shadowDist: 'low',    foliage: 'high',
              foliageMove: true, clouds: true, waterFx: false,
              bloom: false, rays: false },
    medium: { shadows: true,  texDetail: 2, resScale: '1',    drawDist: 'normal',
              vegDist: 'furthest', shadowDist: 'medium', foliage: 'ultra',
              foliageMove: true, clouds: true, waterFx: true,
              bloom: true, rays: true },
    high:   { shadows: true,  texDetail: 2, resScale: 'auto', drawDist: 'far',
              vegDist: 'furthest', shadowDist: 'high',   foliage: 'ultra',
              foliageMove: true, clouds: true, waterFx: true,
              bloom: true, rays: true },
  };
  settings.gfxPreset ??= 'custom';
  if (!GFX_PRESETS[settings.gfxPreset] && settings.gfxPreset !== 'custom') settings.gfxPreset = 'custom';
  const presetSel = $id('set-gfxpreset');
  presetSel.value = settings.gfxPreset;
  presetSel.addEventListener('change', () => {
    const p = GFX_PRESETS[presetSel.value];
    settings.gfxPreset = p ? presetSel.value : 'custom';
    if (!p) { localStorage.setItem('atw-settings', JSON.stringify(settings)); return; }
    applyingPreset = true;
    Object.assign(settings, p);
    syncFarTerrain();
    world.foliageMult = FOLIAGE_MULT[settings.foliage] ?? 1;
    syncGfxControls();
    saveGfx();
    applyViewMode(); // fog baseline follows the preset's draw distance
    world.vegDrawDist && world.refreshVegVisibility?.(player.pos);
    // texture/foliage/tree changes bake into chunk meshes → rebuild the near
    // ring now (the sim is paused while Settings is open)
    world.regenChunks();
    for (let i = 0; i < 24 && world.warmUp(player.pos, 30) > 0; i++) { /* fill */ }
    applyingPreset = false;
  });

  // Advanced options fold out under the preset picker
  const advBtn = $id('gfx-advanced-btn'), advBox = $id('gfx-advanced');
  advBtn.addEventListener('click', () => {
    advBox.classList.toggle('hidden');
    advBtn.textContent = advBox.classList.contains('hidden')
      ? 'Advanced options ▾' : 'Advanced options ▴';
    audio.sfx('click', 0.35);
  });

  syncGfxControls(); // stamp every Advanced control from the (migrated) settings

  // volume sliders (persisted); music slider maps 100% → volume 0.7
  const sfxSlider = $id('set-sfx'), musicSlider = $id('set-music');
  settings.sfxVol ??= 100;
  settings.musicVol ??= 50;
  sfxSlider.value = settings.sfxVol;
  musicSlider.value = settings.musicVol;
  audio.setSfxVolume(settings.sfxVol / 100);
  audio.setMusicVolume((settings.musicVol / 100) * 0.7);
  sfxSlider.addEventListener('input', () => {
    settings.sfxVol = +sfxSlider.value;
    audio.setSfxVolume(settings.sfxVol / 100);
    localStorage.setItem('atw-settings', JSON.stringify(settings));
    audio.sfx('click', 0.4);
  });
  musicSlider.addEventListener('input', () => {
    settings.musicVol = +musicSlider.value;
    audio.setMusicVolume((settings.musicVol / 100) * 0.7);
    localStorage.setItem('atw-settings', JSON.stringify(settings));
  });

  // settings tabs (Graphics / Controls / Audio / General) — click a header to
  // swap the visible page; only one page is in the DOM flow at a time.
  const settingsTabs = [...$id('settings-tabs').querySelectorAll('.tab')];
  const settingsPages = [...document.querySelectorAll('#settings-body .settings-page')];
  const showSettingsPage = (page) => {
    settingsTabs.forEach(t => t.classList.toggle('active', t.dataset.page === page));
    settingsPages.forEach(p => p.classList.toggle('active', p.dataset.page === page));
  };
  settingsTabs.forEach(t => t.addEventListener('click', () => {
    showSettingsPage(t.dataset.page);
    audio.sfx('click', 0.35);
  }));

  // show the room code so a friend can join the running game; admin mode
  // is offered only in singleplayer (it would wreck a shared session)
  $id('settings-btn').addEventListener('click', () => {
    $id('set-mpcode').textContent = mp?.isServer
      ? '🖥️ Server world — everyone joins automatically (no code)'
      : (mp?.active && mpCode) ? mpCode : '— (not in a multiplayer game)';
    $id('mpcode-note').textContent = mp?.isServer
      ? 'Everyone who picks 🖥️ Server drops into this same shared world.'
      : 'Share this code so a friend can join your running game.';
    $id('admin-row').style.display = (DEVMODE && game.kind === 'survival' && !mp?.active) ? '' : 'none';
    // the Dev tab exists only with ?devmode
    $id('settings-tab-dev')?.classList.toggle('hidden', !DEVMODE);
    const rg = $id('set-rigged');
    if (rg) {
      rg.checked = settings.riggedAvatar === true;
      const n = humanClipCount();
      $id('rigged-note').textContent = !settings.riggedAvatar
        ? 'Off — the blocky hero is in use.'
        : n > 0
          ? `On — ${n} animation clips loaded.`
          : 'On, but no clips loaded: falling back to the blocky hero on purpose.';
    }
    $id('set-admin').checked = !!game.adminMode;
    // characters autosave continuously — there is no manual save to offer, so
    // the row just tells you WHERE this character lives and that it's safe
    const cloud = saveIsCloud();
    $id('cloud-row').style.display = saveAvailable() ? '' : 'none';
    $id('save-title').textContent = cloud ? '☁️ Cloud character' : '💾 Character (this device)';
    $id('save-desc').textContent = saveAvailable()
      ? `Autosaves as you play${cloud && authUser ? ` — ${authUser.name}` : ''}. Pick or create characters on the menu.`
      : '';
  });
  $id('set-admin').addEventListener('change', () => {
    game.adminMode = $id('set-admin').checked;
    if (!game.adminMode && player.adminOverrides) {
      player.adminOverrides = null; // back to honest stats
      player.recompute();
    }
    panels.refresh();
    ui.toast(game.adminMode ? '🛠 Admin mode ON' : 'Admin mode off', 'level');
  });
}

// ---------- Google auth GATE (blocks everything until signed in) ----------
let AuthMod = null, authUser = null;
async function ensureAuth() {
  if (!AuthMod) AuthMod = (await import('./auth.js')).Auth;
  return AuthMod;
}
function openGate() {
  // reveal the sign-in / guest buttons: we've confirmed nobody is signed in, so
  // the "Checking sign-in…" placeholder can step aside
  $id('auth-gate').classList.remove('gone', 'checking');
  const g = $id('gate-guest');
  if (g) { g.disabled = false; g.classList.remove('loading'); }
}
function passGate() { $id('auth-gate').classList.add('gone'); }

// reflect the signed-in identity in the menu (top-right badge) so you can
// always see WHO you are — and sign out to switch accounts.
function renderUserBadge(u) {
  // a signed-in player with no username yet inherits their Google first name
  if (u && nameInput && !nameInput.value) {
    nameInput.value = sanitizeName((u.name || '').split(' ')[0]);
    if (nameInput.value) localStorage.setItem('atw-name', nameInput.value);
  }
  const badge = $id('user-badge');
  if (!badge) return;
  if (DEVMODE || !u) { badge.classList.add('hidden'); return; }
  $id('user-name').textContent = u.name || 'Adventurer';
  const photo = $id('user-photo');
  if (u.photo) { photo.src = u.photo; photo.style.display = ''; }
  else photo.style.display = 'none';
  badge.classList.remove('hidden');
}

// ?devmode skips the gate entirely (for local testing without Google set up)
if (DEVMODE) {
  passGate();
} else {
  // The gate starts in a "checking" state (spinner, no buttons — see the
  // `checking` class in index.html) so an ALREADY signed-in player never sees a
  // fake "Sign in with Google" flash for the 1-2 s Firebase takes to resolve
  // the session. We only reveal the buttons once we KNOW nobody is signed in.
  // A late-firing auth callback (onAuthStateChanged is async, sometimes fires
  // after a guest click) must not slam the gate back open.
  // Safety net: if the auth check stalls (offline / Firebase blocked), reveal
  // the buttons anyway so nobody is stuck staring at the spinner.
  const gateFallback = setTimeout(() => { if (!authUser && !game.guest) openGate(); }, 6000);
  (async () => {
    try {
      (await ensureAuth()).watch((u) => {
        clearTimeout(gateFallback);
        authUser = (u && u.uid) ? u : null;
        renderUserBadge(authUser);
        if (authUser?.email === ADMIN_EMAIL) addWorldEditorMenuButton();
        if (authUser) passGate(); else if (!game.guest) openGate();
      });
    } catch (e) {
      clearTimeout(gateFallback);
      openGate(); // reveal the buttons so the player can still continue as guest / retry
      $id('gate-msg').textContent = 'Could not reach Google sign-in: ' + (e?.message || e);
    }
  })();
  // play without an account: drop the gate but leave authUser null, so cloud
  // save stays unavailable (the Settings panel already gates on authUser)
  $id('gate-guest').addEventListener('click', () => {
    game.guest = true;
    authUser = null;
    renderUserBadge(null);
    const g = $id('gate-guest');
    g.disabled = true;
    g.classList.add('loading');
    // let the button paint its loading state, then drop the gate
    requestAnimationFrame(() => requestAnimationFrame(passGate));
  });
  $id('gate-signin').addEventListener('click', async () => {
    const msg = $id('gate-msg');
    msg.textContent = 'Opening Google…';
    try {
      const a = await ensureAuth();
      const u = await a.signIn();
      // only pass once we truly have an authenticated account
      if (u && u.uid) {
        authUser = u;
        renderUserBadge(u);
        passGate();
      } else {
        msg.textContent = 'Sign-in did not complete. Please try again.';
      }
    } catch (e) {
      msg.textContent = 'Sign-in failed: ' + (e?.message || e);
    }
  });
  $id('user-signout').addEventListener('click', async () => {
    try { await (await ensureAuth()).signOutUser(); } catch {}
    authUser = null;
    renderUserBadge(null);
    openGate();
  });
}

// serialize the essentials of the current character + camp
function serializeState() {
  const p = player;
  const data = {
    charId: p.charId, name: playerName(),
    level: p.level, xp: p.xp, hp: Math.round(p.hp),
    energy: Math.round(p.energy), mana: Math.round(p.mana),
    res: Object.fromEntries(RESOURCES.map(k => [k, p[k] || 0])),
    equipment: { ...p.equipment },
    invItems: [...p.invItems],
    consumables: { ...p.consumables },
    stats: { ...p.stats },
    selectedClass: p.selectedClass,
    classTraining: { ...p.classTraining },
    tamedPet: p.tamedPet ? { ...p.tamedPet } : null,
    petDead: !!p.petDead,
    spellsOwned: [...p.spellsOwned],
    spellSlots: p.spellSlots.map(s => s ?? null),
    upgrades: { ...p.upgrades },
    torchFuel: { ...(p.torchFuelById || {}) },
    weaponWear: { ...(p.weaponWearById || {}) },
    invSlots: p.invSlots,
    questDone: { ...p.questDone },
    questHistory: [...p.questHistory],
    questFlags: { ...p.questFlags },
    repeatableDone: { ...p.repeatableDone },
    quest: p.quest ? { ...p.quest } : null,
    shrineBonus: p.shrineBonus || 0,
    camp: camp ? { levels: { ...camp.levels }, storage: { ...camp.storage },
      positions: JSON.parse(JSON.stringify(camp.positions)) } : null,
    biomeIndex: game.biomeIndex,
    map: minimap.serializeDiscovery(),
    poiClaims: { ...poiClaims },   // shrines/captives stay claimed for a game day
  };
  return JSON.parse(JSON.stringify(data)); // strip undefined for Firebase
}

// ---------- character storage seam: cloud (multiplayer) vs local (solo) ----------
// Multiplayer characters live in the CLOUD (tied to the Google account) so they
// follow you between devices and sessions; solo characters live on THIS device
// — no sign-in, offline, entirely separate. Both stores expose the same tiny API
// (saveChar / listChars / loadChar / deleteChar).
//
// `cloud` is decided by the mode the player is ABOUT to enter, which at
// character-select time is not yet reflected in mp — hence the explicit arg.
async function saveBackend(cloud = saveIsCloud()) {
  return cloud ? await ensureAuth() : LocalSaves;
}
function saveIsCloud() { return !!(mp?.active && mp.mode === 'coop'); }
// characters exist in any survival game EXCEPT pvp (its world is throwaway)
function saveAvailable() {
  return game.kind === 'survival' && (!mp?.active || mp.mode === 'coop');
}
const newCharId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- autosave (single rolling slot) ----------
// One mechanism catches everything the player asked for — level-ups, purchases
// and picked-up items/resources — by watching a cheap "progression signature".
// When it changes we write serializeState() to the ONE autosave slot (auth.js
// overwrites it each time). Writes are rate-limited so grinding resources can't
// spam Firebase; level-ups and purchases flag an "urgent" save so they land
// almost immediately instead of waiting out the full interval.
const AS_INTERVAL = 20;   // s — normal minimum gap between autosaves
const AS_URGENT_GAP = 3;  // s — shortened gap after a level-up / purchase
let _asSig = '', _asPrimed = false, _asBusy = false, _asUrgent = false, _asAccum = 0;

function autosaveEligible() {
  if (!(game.kind === 'survival' && game.mode === 'play' && !player.dead)) return false;
  // co-op autosaves to the cloud (needs sign-in); solo autosaves locally, always
  if (mp?.active) return !!(authUser && mp.mode === 'coop');
  return true;
}

// a compact string that changes whenever the player gains a level, buys/loots
// an item, or a resource count moves — the trigger for an autosave
function autosaveSignature() {
  const p = player;
  let res = 0; for (const k of RESOURCES) res += Math.round(p[k] || 0);
  const eq = Object.values(p.equipment).filter(Boolean).length;
  const con = (p.consumables?.salve || 0) + (p.consumables?.roast || 0) + (p.consumables?.honey || 0);
  return `${p.level}|${res}|${p.invItems.length}|${eq}|${p.spellsOwned.size}|${con}|${p.invSlots}`;
}

// milestones (level-up, purchase) ask for a prompt save rather than waiting the
// whole interval; harmless if nothing actually changed (the signature gate wins)
function requestAutosave() { _asUrgent = true; }

// re-baseline so a fresh cloud LOAD doesn't immediately re-save over itself
function resetAutosaveBaseline() { _asPrimed = false; }

function tickAutosave(dt) {
  if (!autosaveEligible()) { _asPrimed = false; _asUrgent = false; return; }
  _asAccum += dt;
  if (!_asPrimed) { _asSig = autosaveSignature(); _asPrimed = true; _asAccum = 0; return; }
  if (_asBusy) return;
  const sig = autosaveSignature();
  if (sig === _asSig) { _asUrgent = false; return; }        // nothing changed
  if (_asAccum < (_asUrgent ? AS_URGENT_GAP : AS_INTERVAL)) return; // rate-limit
  _asSig = sig; _asAccum = 0; _asUrgent = false;
  doAutosave();
}

async function doAutosave() {
  if (!player.charId) return;            // no character bound yet — nothing to write
  _asBusy = true;
  try {
    await (await saveBackend()).saveChar(player.charId, {
      name: playerName(), cls: player.selectedClass || null,
      biome: BIOMES[game.biomeIndex]?.name, level: player.level,
    }, serializeState());
  } catch { /* autosave stays quiet on failure — it retries on the next change */ }
  finally { _asBusy = false; }
}

function applyLoadedState(d) {
  const p = player;
  clearHunterTraps();
  // bind this run to the loaded character so its autosave slot keeps rolling
  p.charId = d.charId || p.charId || newCharId();
  if (d.name && nameInput) {
    nameInput.value = sanitizeName(d.name);
    localStorage.setItem('atw-name', nameInput.value);
  }
  p.level = Math.max(1, Math.min(MAX_LEVEL, d.level ?? 1));
  // clamp saved XP into the loaded level's bracket — saves from before an
  // XP-curve change would otherwise land outside the new table
  p.xp = Math.max(XP_LEVELS[p.level],
    Math.min(d.xp ?? 0, (XP_LEVELS[p.level + 1] ?? XP_LEVELS[p.level] + 1) - 1));
  for (const k of RESOURCES) p[k] = d.res?.[k] ?? 0;
  p.equipment = { weapon: 'fists', offhand: null, head: null, chest: null, underlayer: null,
                  legs: null, boots: null, back: null, mount: null, charm: null, companion: null,
                  ...(d.equipment || {}) };
  p.invItems = Array.isArray(d.invItems) ? d.invItems.filter(Boolean) : [];
  p.consumables = { salve: 0, roast: 0, honey: 0, ...(d.consumables || {}) };
  p.stats = { range: 0, power: 0, swift: 0, pet: 0, gather: 0, ...(d.stats || {}) };
  const savedTree = classTreeById(d.selectedClass);
  p.selectedClass = savedTree?.id || null;
  p.classTraining = {};
  // Renamed ability ids would silently orphan a character's training, so old
  // saves are mapped forward before the tree is read.
  const RENAMED_SKILLS = { rogue_shadow_step: 'rogue_shadow_portal' };
  if (d.classTraining && typeof d.classTraining === 'object') {
    for (const [oldId, newId] of Object.entries(RENAMED_SKILLS)) {
      if (d.classTraining[oldId] != null && d.classTraining[newId] == null) {
        d.classTraining[newId] = d.classTraining[oldId];
      }
      delete d.classTraining[oldId];
    }
  }
  if (Array.isArray(d.spellSlots)) {
    d.spellSlots = d.spellSlots.map(v =>
      (typeof v === 'string' && RENAMED_SKILLS[v]) ? RENAMED_SKILLS[v] : v);
  }
  if (savedTree && d.classTraining && typeof d.classTraining === 'object') {
    for (const skill of [...savedTree.passives, ...savedTree.actives]) {
      const savedRank = Math.max(0, Math.min(skill.maxRank, Math.floor(Number(d.classTraining[skill.id]) || 0)));
      for (let rank = 1; rank <= savedRank; rank++) {
        if (p.level >= classSkillRequiredLevel(skill, rank)) p.classTraining[skill.id] = rank;
      }
    }
  }
  // the tamed beast companion (validated so a corrupt type can't crash the mesh)
  p.petDead = !!d.petDead;
  p.tamedPet = (d.tamedPet && typeof d.tamedPet.type === 'string' && ENEMY_TYPES[d.tamedPet.type])
    ? { type: d.tamedPet.type, name: d.tamedPet.name || d.tamedPet.type } : null;
  p.spellsOwned = new Set(d.spellsOwned || []);
  p.spellSlots = Array.isArray(d.spellSlots) ? d.spellSlots.slice(0, MAX_SPELL_SLOTS).map(s => s ?? undefined) : [];
  p.spellSlots = p.spellSlots.map(id => {
    const classSkill = classSkillById(id);
    if (classSkill) return classSkill.type === 'active' && classSkill.classId === p.selectedClass
      && (p.classTraining[classSkill.id] || 0) > 0 ? id : undefined;
    return id;
  });
  p.upgrades = { ...(d.upgrades || {}) };
  p.torchFuelById = (d.torchFuel && typeof d.torchFuel === 'object') ? { ...d.torchFuel } : {};
  p.weaponWearById = (d.weaponWear && typeof d.weaponWear === 'object') ? { ...d.weaponWear } : {};
  // MIGRATION: old saves stored supply gear as boolean upgrades — convert each
  // owned flag into the real item (equipped straight into its new slot)
  const upgradeSlots = { torch: 'offhand', torchoil: 'offhand', socks: 'legs',
                         lining: 'underlayer', bedroll: 'back', saddle: 'mount' };
  for (const [uid, slot] of Object.entries(upgradeSlots)) {
    if (!p.upgrades[uid]) continue;
    delete p.upgrades[uid];
    if (!p.equipment[slot]) p.equipment[slot] = uid;      // torchoil wins over torch below
    else if (uid === 'torchoil') { p.invItems.push(p.equipment[slot]); p.equipment[slot] = uid; }
    else if (!p.invItems.includes(uid)) p.invItems.push(uid);
  }
  if (d.invSlots) p.invSlots = d.invSlots;
  p.questDone = { ...(d.questDone || {}) };
  p.questHistory = Array.isArray(d.questHistory) ? d.questHistory : [];
  p.questFlags = { ...(d.questFlags || {}) };
  p.repeatableDone = { ...(d.repeatableDone || {}) };
  p.quest = d.quest || null;
  p.shrineBonus = d.shrineBonus || 0;
  for (const k of Object.keys(poiClaims)) delete poiClaims[k];
  if (d.poiClaims && typeof d.poiClaims === 'object') Object.assign(poiClaims, d.poiClaims);
  applyPoiClaims();
  if (d.map) minimap.restoreDiscovery(d.map); // old saves simply keep the current fog state
  if (camp && d.camp) {
    Object.assign(camp.levels, d.camp.levels || {});
    Object.assign(camp.storage, d.camp.storage || {});
    Object.assign(camp.positions, d.camp.positions || {});
    if (camp.levels.home > 0) world.buildHome(camp.levels.home);
    for (const id of ['chest', 'furnace', 'boat', 'tower', 'banner', 'grave']) {
      if ((camp.levels[id] || 0) > 0) { try { camp._placeMesh(id, camp.positions[id]); } catch {} }
    }
    applyCampPerks();
  }
  p.clearClassCombatState();
  p.enforceClassEquipment();
  p.recompute();
  p.hp = Math.min(p.maxHp, d.hp ?? p.maxHp);
  // You always start a session ready to fight — loading a save never drops you
  // into the world on an empty bar (the saved value is deliberately ignored).
  p.energy = p.maxEnergy;
  p.mana = p.maxMana;
  companions.sync(player);
  syncQuestResidents();
  resetAutosaveBaseline(); // don't let the loaded state trigger an instant re-save
  panels.refresh();
  ui.banner('☁️ Save loaded');
  ui.toast('☁️ Your character has been restored into this game.', 'level');
  audio.sfx('victory', 0.4);
}

// ---------- character select (WoW-style) ----------
// Entering a survival world opens a character screen listing your autosaved
// characters (each has its own rolling slot) plus "+ New character". Picking one
// restores it; the new one starts fresh at level 1. There are no manual saves.
const CLASS_ICON = { warrior: '⚔️', ranger: '🏹', mage: '🔮', priest: '✨', beastmaster: '🐺' };

// The character screen runs ON THE MENU, before a single chunk is generated:
// you pick who you are, THEN the world loads as that character. The chosen
// save is parked in pendingCharLoad and applied once the world exists.
let pendingCharLoad = null;

// Resolves true once a character is chosen (or none exist / none is needed),
// false if the player backs out to the menu.
async function chooseCharacter(cloud) {
  pendingCharLoad = null;
  if (openingEditor || game.editorView) return true;   // the editor is not a play session
  // guests (and anyone the store is unreachable for) simply play an unsaved run
  if (cloud && !authUser) { player.charId = newCharId(); return true; }
  let chars = [];
  try { chars = await (await saveBackend(cloud)).listChars(); } catch { /* offline → new char */ }
  if (!chars.length) { player.charId = newCharId(); return true; }  // first time: just play
  return new Promise((resolve) => {
    renderCharSelect(chars, cloud, resolve);
    $id('coopstart').classList.remove('hidden');
  });
}

// pick handlers call this: park the save, remember the slot, let the game start
async function pickCharacter(id, cloud, resolve) {
  try {
    const data = await (await saveBackend(cloud)).loadChar(id);
    if (!data) { ui.toast('That character is empty.', 'boss'); player.charId = newCharId(); }
    else {
      pendingCharLoad = data;
      player.charId = id === 'autosave' ? newCharId() : id; // legacy slot graduates
    }
  } catch (e) {
    ui.toast('Could not load that character: ' + (e?.message || e), 'boss');
    player.charId = newCharId();
  }
  closeCharSelect();
  resolve(true);
}

function renderCharSelect(chars, cloud, resolve) {
  $id('cs-lead-note').textContent = cloud
    ? 'Your cloud characters — pick one to continue, or roll a new one.'
    : 'Your characters on this device — pick one to continue, or roll a new one.';
  const list = $id('charselect-list');
  list.innerHTML = '';
  for (const c of chars) {
    const row = document.createElement('button');
    row.className = 'char-row';
    const cls = c.cls ? `${CLASS_ICON[c.cls] || '🎓'} ${c.cls}` : 'no class yet';
    row.innerHTML = `<span class="char-lv">${c.level ?? 1}</span>
      <span class="char-main"><b class="char-name"></b>
        <small class="char-sub"></small></span>
      <span class="char-del" title="Delete this character">🗑</span>`;
    row.querySelector('.char-name').textContent = c.name || 'Adventurer';
    row.querySelector('.char-sub').textContent =
      `${cls} · ${c.biome ?? 'the woods'} · ${new Date(c.at || 0).toLocaleString()}`;
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('char-del')) return;   // the bin has its own job
      audio.sfx('click', 0.4);
      pickCharacter(c.id, cloud, resolve);
    });
    row.querySelector('.char-del').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${c.name || 'Adventurer'}" (level ${c.level ?? 1})? This cannot be undone.`)) return;
      try { await (await saveBackend(cloud)).deleteChar(c.id); row.remove(); } catch {}
      // deleting the last one leaves nothing to pick — roll a fresh character
      if (!list.children.length) { player.charId = newCharId(); closeCharSelect(); resolve(true); }
    });
    list.appendChild(row);
  }
  // "＋ New character" and "← Back" are re-bound per open so they resolve THIS
  // prompt (cloning drops any listener left over from a previous run)
  const newBtn = $id('cs-new'), fresh = newBtn.cloneNode(true);
  newBtn.replaceWith(fresh);
  fresh.addEventListener('click', () => {
    audio.sfx('click', 0.4);
    player.charId = newCharId();
    pendingCharLoad = null;
    closeCharSelect();
    resolve(true);
  });
  const backBtn = $id('cs-cancel'), backFresh = backBtn.cloneNode(true);
  backBtn.replaceWith(backFresh);
  backFresh.addEventListener('click', () => {
    audio.sfx('click', 0.35);
    closeCharSelect();
    resolve(false);          // back to the menu, nothing started
  });
}

function closeCharSelect() { $id('coopstart').classList.add('hidden'); }

// called once the world exists: become the character that was chosen on the menu
function applyPendingCharacter() {
  if (!pendingCharLoad) return;
  const data = pendingCharLoad;
  pendingCharLoad = null;
  try { applyLoadedState(data); }
  catch (e) { ui.toast('Could not restore that character: ' + (e?.message || e), 'boss'); }
}

// ==================== social UI: group, duel, inspect ====================
// Shift-locking another player raises an action bar; the bar stays up after you
// let go of Shift so you can actually click it, and closes when the target
// wanders off, dies, or you press Esc.
let socialTarget = null;      // the RemotePlayer the action bar refers to

let stickyMob = null;   // the last mob you Shift-locked, kept until it dies

function updateSocialTarget() {
  const locked = targeting.selectedPlayer;
  if (locked && locked !== socialTarget) socialTarget = locked;
  // Shift-lock CLEARS the moment you release Shift, so remember the mob: a
  // target frame that vanishes with the key would be unreadable.
  if (targeting.selected) { stickyMob = targeting.selected; socialTarget = locked || null; }
  if (stickyMob && (stickyMob.dying || stickyMob.dead
      || !(combatMgr()?.alive?.() ?? []).includes(stickyMob))) stickyMob = null;
  // drop the bar when the target is gone from the world
  if (socialTarget && (!mp?.active || !mp.remotes.has(socialTarget.uid))) socialTarget = null;
  renderPlayerActions();
  renderTargetFrame();
}

// ---- Shift-lock target frame ----
// Whatever you have locked — a mob or another player — gets the same readout,
// in the same place: avatar, name, level and a health bar WITH the numbers.
// It sits directly under the resource strip so your eye has one place to look.
//
// It does not outstay its welcome: a target that isn't fighting you, isn't
// being duelled, and is more than TF_KEEP_R away holds for TF_HOLD and then
// fades. Something you merely glanced at on the way past shouldn't sit at the
// top of the screen for the rest of the run.
const TF_KEEP_R = 4;        // metres — standing this close counts as interest
const TF_HOLD = 3000;       // ms of grace before the fade begins
const TF_FADE = 500;        // ms the fade itself takes
// -1 rather than 0 for "still matters": performance.now() can legitimately BE
// 0, and a falsy check there quietly disabled the whole countdown
let tfIdleAt = -1;
let tfTarget = null;        // what the countdown belongs to

function renderTargetFrame() {
  const el = $id('target-frame');
  if (!el) return;
  const mob = targeting.selected || stickyMob;
  const who = targeting.selectedPlayer || socialTarget;
  const t = who || mob;
  const alive = t && !(t.dying || t.dead);
  if (t !== tfTarget) { tfTarget = t; tfIdleAt = -1; }  // a new target starts fresh
  if (!t || !alive || game.mode !== 'play' || game.paused) {
    el.classList.add('hidden'); el.style.opacity = ''; return;
  }
  const isPlayer = !!who;
  // reasons to keep it up: it's swinging at you, you're duelling it, you're
  // standing on top of it, or Shift is down on it right now
  const engaged = isPlayer
    ? !!(mp?.duel?.active && mp.duel.oppUid === t.uid)
    : !!t.aggroed;
  const near = !!t.pos
    && Math.hypot(t.pos.x - player.pos.x, t.pos.z - player.pos.z) <= TF_KEEP_R;
  const held = targeting.selected === t || targeting.selectedPlayer === t;
  if (engaged || near || held) tfIdleAt = -1;
  else if (tfIdleAt < 0) tfIdleAt = performance.now();
  if (tfIdleAt >= 0) {
    const fading = performance.now() - tfIdleAt - TF_HOLD;
    if (fading > TF_FADE) {
      el.classList.add('hidden');
      el.style.opacity = '';
      // drop the remembered mob, or walking back past it would pop the frame
      // up again without a fresh Shift-lock. socialTarget is left alone — it
      // also drives the invite/duel/inspect bar.
      if (!isPlayer) stickyMob = null;
      return;
    }
    el.style.opacity = fading > 0 ? String(1 - fading / TF_FADE) : '1';
  } else {
    el.style.opacity = '1';
  }
  el.classList.remove('hidden');
  el.classList.toggle('tf-player', isPlayer);
  const hp = Math.max(0, Math.round(t.hp ?? 0));
  const maxHp = Math.max(1, Math.round(t.maxHp ?? 1));
  const name = isPlayer ? (t.name || 'Player')
    : (t.name ?? t.cfg?.name ?? ENEMY_TYPES[t.type]?.name ?? t.type ?? 'Creature');
  const icon = isPlayer ? '🧑' : (ENEMY_TYPES[t.type]?.icon ?? '❔');
  const lvl = t.level ?? null;
  el.querySelector('.tf-av').textContent = icon;
  el.querySelector('.tf-name').textContent = name;
  el.querySelector('.tf-lv').innerHTML = lvl != null
    ? (isPlayer ? `Lv ${lvl}` : mobLevelBadge(lvl)) : '';
  el.querySelector('.tf-bar > i').style.width =
    Math.max(0, Math.min(100, (hp / maxHp) * 100)) + '%';
  el.querySelector('.tf-hp').textContent = `${hp} / ${maxHp}`;
}

function renderPlayerActions() {
  const el = $id('player-actions');
  if (!el) return;
  const t = socialTarget;
  if (!t || game.mode !== 'play' || game.paused) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  $id('pa-name').textContent = t.name || 'Player';
  const rel = t.inGroup ? 'in your group' : 'not grouped';
  $id('pa-sub').textContent = `Lv ${t.level ?? '?'} · ${rel}`;
  const duelling = !!mp?.duel?.active;
  const inv = $id('pa-invite');
  inv.textContent = t.inGroup ? '👥 In your group' : '🤝 Invite to group';
  inv.disabled = t.inGroup || duelling;
  $id('pa-duel').disabled = duelling;
  const fol = $id('pa-follow');
  if (fol) fol.textContent = followUid === t.uid ? '👣 Stop following' : '👣 Follow';
  // Leaving is only meaningful when you actually share a group with them, so the
  // button appears on a group-mate (including via their party frame) and hides
  // otherwise rather than sitting there greyed out.
  const leave = $id('pa-leave');
  if (leave) {
    leave.classList.toggle('hidden', !t.inGroup);
    leave.disabled = duelling;
  }
}
function closePlayerActions() { socialTarget = null; renderPlayerActions(); }

$id('pa-close')?.addEventListener('click', () => { audio.sfx('click', 0.35); closePlayerActions(); });
$id('pa-invite')?.addEventListener('click', () => {
  if (socialTarget) mp?.inviteToGroup(socialTarget.uid);
  audio.sfx('click', 0.4); closePlayerActions();
});
$id('pa-duel')?.addEventListener('click', () => {
  if (socialTarget) mp?.challengeDuel(socialTarget.uid);
  audio.sfx('click', 0.4); closePlayerActions();
});
$id('pa-leave')?.addEventListener('click', () => {
  audio.sfx('click', 0.4);
  mp?.leaveGroup?.();
  closePlayerActions();
});
// ---- follow a player (WoW-style) ------------------------------------------
// Walk after someone until you steer yourself. It feeds input.follow rather than
// moving the player directly, so everything downstream — speed, roads, water,
// collision, the animation state machine — keeps working exactly as it does when
// you drive. Cancelled by ANY movement key, which is the behaviour people expect.
let followUid = null;
const FOLLOW_STOP = 3;      // stop this close…
const FOLLOW_GO = 4.5;      // …and set off again past this
const FOLLOW_DROP = 60;     // lost them
let followMoving = false;

function stopFollow(why) {
  if (!followUid) return;
  followUid = null; followMoving = false;
  input.follow = null;
  if (why) ui.toast(why, '');
}

function tickFollow() {
  if (!followUid) return;
  const r = mp?.remotes?.get?.(followUid);
  if (!r || !r.pos) { stopFollow('👣 Lost them.'); return; }
  if (player.dead || player.ghost || game.mode !== 'play') { stopFollow(); return; }
  // your own hands on the controls always win, and end the follow
  if (input.steering) { stopFollow('👣 Follow off.'); return; }
  const dx = r.pos.x - player.pos.x, dz = r.pos.z - player.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > FOLLOW_DROP) { stopFollow(`👣 ${r.name || 'They'} got too far away.`); return; }
  // hysteresis, or you jitter on the spot at exactly the stopping distance
  if (followMoving && d < FOLLOW_STOP) followMoving = false;
  else if (!followMoving && d > FOLLOW_GO) followMoving = true;
  input.follow = followMoving ? { x: dx / (d || 1), z: dz / (d || 1) } : null;
}

$id('pa-follow')?.addEventListener('click', () => {
  if (!socialTarget) return;
  audio.sfx('click', 0.4);
  if (followUid === socialTarget.uid) { stopFollow('👣 Follow off.'); }
  else {
    followUid = socialTarget.uid;
    followMoving = true;
    ui.toast(`👣 Following ${socialTarget.name || 'them'} — move to stop.`, 'level');
  }
  closePlayerActions();
});

$id('pa-inspect')?.addEventListener('click', () => {
  if (!socialTarget) return;
  audio.sfx('click', 0.4);
  openInspect(socialTarget);
  closePlayerActions();
});

// ---- accept/decline prompt, shared by group invites and duel challenges ----
let askAction = null;
function showSocialAsk(title, text, yesLabel, onYes, onNo) {
  askAction = { onYes, onNo };
  $id('ask-title').textContent = title;
  $id('ask-text').textContent = text;
  $id('ask-yes').textContent = yesLabel;
  $id('social-ask').classList.remove('hidden');
}
function closeSocialAsk() { $id('social-ask').classList.add('hidden'); askAction = null; }
$id('ask-yes')?.addEventListener('click', () => {
  const a = askAction; closeSocialAsk(); audio.sfx('click', 0.4); a?.onYes?.();
});
$id('ask-no')?.addEventListener('click', () => {
  const a = askAction; closeSocialAsk(); audio.sfx('click', 0.35); a?.onNo?.();
});

// ---- party frames (group members, top-left under your own bars) ----
function renderPartyFrames() {
  const box = $id('party-frames');
  if (!box) return;
  const mates = mp?.active ? (mp.groupRemotes?.() || []) : [];
  if (!mates.length) { box.innerHTML = ''; box._keys = ''; return; }
  const keys = mates.map(r => r.uid).join('|');
  if (box._keys !== keys) {           // rebuild only when the roster changes
    box.innerHTML = '';
    for (const r of mates) {
      const row = document.createElement('div');
      row.className = 'pf';
      row.innerHTML = `<div class="pf-av"></div>
        <div class="pf-main"><div class="pf-name"></div>
          <div class="pf-bars">
            <div class="pf-bar pf-hp"><i></i></div>
            <div class="pf-bar pf-en"><i></i></div>
            <div class="pf-bar pf-mn"><i></i></div>
          </div></div>`;
      row.addEventListener('click', () => { socialTarget = r; renderPlayerActions(); });
      box.appendChild(row);
      r._pf = row;
    }
    box._keys = keys;
  }
  for (const r of mates) {
    const row = r._pf; if (!row) continue;
    row.classList.toggle('pf-dead', !!r.dead);
    row.querySelector('.pf-av').textContent = (r.name || '?').slice(0, 2).toUpperCase();
    row.querySelector('.pf-name').textContent = `${r.name || 'Player'} · ${r.level ?? '?'}`;
    const pct = (v, m) => Math.max(0, Math.min(100, (v / Math.max(1, m)) * 100)) + '%';
    row.querySelector('.pf-hp > i').style.width = pct(r.hp, r.maxHp);
    row.querySelector('.pf-en > i').style.width = pct(r.energy ?? 0, r.maxEnergy ?? 100);
    const manaBar = row.querySelector('.pf-mn');
    manaBar.style.display = (r.maxMana > 0) ? '' : 'none';
    if (r.maxMana > 0) manaBar.querySelector('i').style.width = pct(r.mana, r.maxMana);
  }
}

// ---- inspect: what I show others, and the modal that shows theirs ----
function inspectPayload() {
  const p = player;
  return {
    name: playerName(), lv: p.level, cls: p.selectedClass || null,
    eq: { ...p.equipment },
    st: {
      hp: Math.round(p.maxHp), dmg: Math.round(p.damage ?? 0),
      armor: +(p.armor ?? 0).toFixed(2), crit: +(p.critChance ?? 0).toFixed(2),
      energy: Math.round(p.maxEnergy || 0), mana: Math.round(p.maxMana || 0),
      speed: +(p.moveSpeed ?? 0).toFixed(1),
    },
  };
}

function openInspect(remote) {
  $id('inspect').classList.remove('hidden');
  $id('inspect-title').textContent = `🔍 ${remote.name || 'Player'}`;
  $id('inspect-empty').textContent = 'Asking them to show their gear…';
  $id('inspect-empty').style.display = '';
  $id('inspect-content').classList.add('hidden');
  mp?.requestInspect(remote.uid);
}

function showInspectData(uid, d) {
  const panel = $id('inspect');
  if (panel.classList.contains('hidden')) return;    // they answered after I closed it
  $id('inspect-empty').style.display = 'none';
  $id('inspect-content').classList.remove('hidden');
  $id('inspect-title').textContent =
    `🔍 ${d.name || 'Player'} · Lv ${d.lv ?? '?'}${d.cls ? ` · ${d.cls}` : ''}`;
  const gear = $id('inspect-gear');
  gear.innerHTML = '';
  const SLOTS = [['weapon', 'Weapon'], ['offhand', 'Offhand'], ['head', 'Head'], ['chest', 'Chest'],
    ['underlayer', 'Underlayer'], ['legs', 'Legs'], ['boots', 'Boots'], ['back', 'Back'],
    ['mount', 'Mount'], ['charm', 'Charm'], ['companion', 'Companion']];
  for (const [key, label] of SLOTS) {
    const id = d.eq?.[key];
    if (!id || id === 'fists') continue;
    const item = itemById(id);
    const row = document.createElement('div');
    row.className = 'insp-slot';
    row.innerHTML = `<span class="islot"></span><b></b>`;
    row.querySelector('.islot').textContent = label;
    row.querySelector('b').textContent = item?.name || id;
    gear.appendChild(row);
  }
  if (!gear.children.length) gear.innerHTML = '<div class="insp-slot">Nothing equipped.</div>';
  const stats = $id('inspect-stats');
  stats.innerHTML = '';
  const S = d.st || {};
  const rows = [['Health', S.hp], ['Damage', S.dmg], ['Armor', S.armor],
    ['Crit', S.crit != null ? Math.round(S.crit * 100) + '%' : null],
    ['Energy', S.energy], ['Mana', S.mana || null], ['Speed', S.speed]];
  for (const [label, v] of rows) {
    if (v == null || v === '' ) continue;
    const el = document.createElement('div');
    el.className = 'insp-stat';
    el.innerHTML = `<span></span> <b></b>`;
    el.querySelector('span').textContent = label;
    el.querySelector('b').textContent = String(v);
    stats.appendChild(el);
  }
}
$id('inspect')?.querySelector('.panel-close')
  ?.addEventListener('click', () => $id('inspect').classList.add('hidden'));

async function ensureMp() {
  if (!mp) {
    const { Multiplayer } = await import('./multiplayer.js');
    mp = new Multiplayer({
      scene, player, enemyMgr, pickups, projectiles, ui, panels, game, input,
      get world() { return world; }, // MOBA swaps the world object at begin
      get camp() { return camp; },
      get petTarget() { return (companions.wolf && !player.petDead) ? petProxy : null; },
      get playerName() { return playerName(); },
      arrowHitsHive,   // arrows crack beehives in multiplayer too
      popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
      onDiscover: discoverType,
      onSharedQuestKill: (enemy) => trackQuestKill(enemy, false),
      grantPickup,
      dropHalfMeat,
      markDeath: (pos) => { minimap.deathAt = { x: pos.x, z: pos.z }; },
      // a multiplayer death that nobody revived goes through the SAME ghost
      // flow as solo — corpse, graveyard, the lot
      onRealDeath: () => survivalRespawn(),
      onPartnerJoin: () => hideJoinCodeHud(), // first friend arrives → code goes to Settings only
      // ---- social hooks ----
      onGroupChange: () => renderPartyFrames(),
      onGroupInvite: (inv) => {
        if (!inv) { closeSocialAsk(); return; }
        showSocialAsk('🤝 Group invitation',
          `${inv.name} invites you to join their group. Grouped players share kill XP and quest progress.`,
          '✅ Join the group',
          () => mp.acceptGroupInvite(), () => mp.declineGroupInvite());
      },
      onDuelChallenge: (d) => {
        if (!d) { closeSocialAsk(); return; }
        showSocialAsk('⚔️ Duel challenge',
          `${d.name} challenges you to a duel. Nobody dies — the loser stops at 1 HP.`,
          '⚔️ Accept the duel',
          () => mp.acceptDuel(), () => mp.declineDuel());
      },
      inspectPayload,
      onInspectData: (uid, d) => showInspectData(uid, d),
      startPlaying,
      showPing: (x, z) => showPing(x, z),
      // shared base: apply the partner's camp levels/storage locally
      onCampSync: (lv, st, gp, positions) => {
        if (!camp || !lv) return;
        if (gp) camp.gravePos = gp;
        if (positions) Object.assign(camp.positions, positions);
        for (const [id, v] of Object.entries(lv)) {
          while ((camp.levels[id] ?? 0) < v) {
            camp.levels[id]++;
          }
          if ((camp.levels[id] ?? 0) > 0)
            camp._placeMesh(id, camp.positions[id] ?? (id === 'grave' ? gp : undefined));
        }
        if (st) Object.assign(camp.storage, st);
        applyCampPerks();
        panels.refresh();
        ui.toast('🏕️ Camp updated by your partner.', '');
      },
      onCoopWin: () => {
        if (game.mode !== 'play') return;
        game.mode = 'won';
        audio.stopMusic(); setAmbience(null); audio.loopStop('jungle_rain');
        hideJoinCodeHud();
        audio.sfx('victory', 0.6);
        ui.showEnd(true, endStats());
      },
      // ---- MOBA multiplayer wiring ----
      setupMobaWorld,
      createMobaHost: (seed) => {
        setupMobaWorld(seed, 'player');
        moba = new Moba(scene, world, player, projectiles, pickups, ui, mobaHooks());
        moba.aiEnabled = false; // the other player IS the enemy team
        panels.moba = moba;
        mobaMini = new MobaMinimap(document.getElementById('minimap'), moba);
        return moba;
      },
      attachMobaGuest: (seed, shadowView) => {
        setupMobaWorld(seed, 'enemy');
        panels.moba = shadowView;
        mobaMini = new MobaMinimap(document.getElementById('minimap'), shadowView);
      },
      endMoba,
    });
    window.__game.mp = mp;
  }
  return mp;
}

function mpError(err) { $id('mp-error').textContent = err?.message || String(err); }

// ---- main menu: pick a mode first, then solo / multiplayer ----
let selectedMode = 'survival';

function resetLobbyUI() {
  $id('mp-choose')?.classList.remove('hidden');
  $id('mp-wait')?.classList.add('hidden');
  $id('start-btn')?.classList.remove('hidden');
  const err = $id('mp-error'); if (err) err.textContent = '';
  mpCode = null;
  hideJoinCodeHud();
  // a room was being hosted but we backed out — tear it down so it doesn't linger
  if (mp && game.mode !== 'play') { try { mp.dispose?.(); } catch {} mp = null; }
}

function showModeOptions(mode) {
  audio.sfx('click', 0.4);
  selectedMode = mode;
  resetLobbyUI();
  $id('mode-select').classList.add('hidden');
  const opts = $id('mode-options');
  opts.classList.remove('hidden');
  opts.classList.toggle('is-moba', mode === 'moba');
  $id('mode-title').textContent = mode === 'moba' ? '🏰 MOBA' : '🌲 Survival';
  if (mode === 'survival') startServerStatusWatch(); else stopServerStatusWatch();
}

// ---- dedicated-server ("Server" button) live availability ----
// The button is enabled ONLY while the server's /health says it's ready; the
// small label shows why it's greyed out (offline / not configured) or the live
// player/room count when it's up.
let ServerStatusMod = null, _serverUnsub = null;
async function startServerStatusWatch() {
  const btn = $id('mp-server-btn'), status = $id('mp-server-status');
  if (!btn) return;
  try {
    if (!ServerStatusMod) ServerStatusMod = (await import('./serverstatus.js')).ServerStatus;
  } catch { return; }
  ServerStatusMod.start();
  _serverUnsub?.();
  const pub = $id('mode-public-btn'), pubStatus = $id('public-status');
  _serverUnsub = ServerStatusMod.onChange((online, detail) => {
    btn.disabled = !online;
    btn.classList.toggle('is-offline', !online);
    if (status) status.textContent = `· ${detail}`;
    // the headline Multiplayer button mirrors it
    if (pub) { pub.disabled = !online; pub.classList.toggle('is-offline', !online); }
    if (pubStatus) pubStatus.textContent = online ? detail : `public server ${detail}`;
  });
}
function stopServerStatusWatch() {
  _serverUnsub?.(); _serverUnsub = null;
  ServerStatusMod?.stop();
}

$id('mp-server-btn')?.addEventListener('click', async () => {
  const btn = $id('mp-server-btn');
  if (btn.disabled) return;
  if (!requireName()) return;
  if (!await chooseCharacter(true)) return;   // pick a character before connecting
  btn.disabled = true;
  try {
    stopServerStatusWatch();
    const session = await ensureMp();
    // ONE shared server world — the neutral server runs it and everyone joins the
    // SAME room automatically. No codes, so no invite beacon to show.
    await session.serverStart();
    mpCode = null;
    hideJoinCodeHud();
  } catch (e) {
    mpError(e);
    startServerStatusWatch();
    btn.disabled = false;
  }
});
// Survival single player starts straight away — the old two-step (pick a mode,
// then pick solo/multi) was a menu in front of a menu.
$id('mode-survival-btn').addEventListener('click', () => {
  audio.sfx('click', 0.4);
  selectedMode = 'survival';
  if (!requireName()) return;
  startGame();
});
// The public dedicated server is the headline multiplayer button now; it drives
// the same handler the old in-lobby Server button used.
$id('mode-public-btn')?.addEventListener('click', () => $id('mp-server-btn')?.click());
// Local Server = the code-based private world (what used to be "Create Co-op").
$id('mode-local-btn')?.addEventListener('click', () => showModeOptions('survival'));
// Save & Quit: flush the character to its slot, drop any multiplayer session,
// then return to the menu. The autosave is rate-limited, so quitting without
// this could throw away the last few minutes of play.
$id('quit-btn')?.addEventListener('click', async () => {
  if (game.mode !== 'play') return;
  document.body.classList.remove('menu-open');
  const btn = $id('quit-btn');
  btn.disabled = true; btn.textContent = '💾 Saving…';
  try { await doAutosave(); } catch {}
  try { mp?.dispose?.(); } catch {}
  mp = null;
  // A full reload is the only honest way back to a clean menu: the world,
  // enemies, camp and class state are live module singletons with no teardown.
  location.reload();
});

$id('mode-moba-btn').addEventListener('click', () => showModeOptions('moba'));
// the public-server button lives on the FIRST screen now, so its health poll
// has to start with the menu rather than when a submenu opens
startServerStatusWatch();
$id('mode-back-btn').addEventListener('click', () => {
  audio.sfx('click', 0.4);
  resetLobbyUI();
  $id('mode-options').classList.add('hidden');
  $id('mode-select').classList.remove('hidden');
});
$id('mp-moba-btn').addEventListener('click', async () => {
  if (!requireName()) return;
  try {
    const session = await ensureMp();
    showWaiting(await session.host('moba', null));
  } catch (e) { mpError(e); }
});
let mpCode = null; // current room code, shown in Settings for late joiners

function showWaiting(code) {
  mpCode = code;
  $id('mp-code-display').title = 'Click to copy';
  $id('mp-code-display').style.cursor = 'pointer';
  $id('mp-choose').classList.add('hidden');
  $id('mp-wait').classList.remove('hidden');
  $id('mp-code-display').textContent = code;
  $id('start-btn').classList.add('hidden'); // no solo start while hosting
}
$id('mp-coop-btn').addEventListener('click', async () => {
  if (!requireName()) return;
  if (!await chooseCharacter(true)) return;   // pick a character before hosting
  const btn = $id('mp-coop-btn');
  btn.disabled = true;
  try {
    const session = await ensureMp();
    // co-op launches straight into the world; the code lives in a corner
    // beacon until the first friend joins, then only in Settings
    const code = await session.host('coop', null);
    mpCode = code;
    stopServerStatusWatch();
    showJoinCodeHud(code);
  } catch (e) { mpError(e); }
  btn.disabled = false;
});

// corner join-code beacon shown while a co-op host waits for their first friend
function showJoinCodeHud(code) {
  const el = $id('mp-joincode');
  if (!el) return;
  el.querySelector('.jc-code').textContent = code;
  el.classList.remove('hidden');
}
function hideJoinCodeHud() { $id('mp-joincode')?.classList.add('hidden'); }
$id('mp-joincode')?.addEventListener('click', async () => {
  if (!mpCode) return;
  try { await navigator.clipboard.writeText(mpCode); ui.toast('📋 Join code copied!', 'level'); } catch {}
});
$id('mp-pvp-btn').addEventListener('click', async () => {
  if (!requireName()) return;
  try {
    const session = await ensureMp();
    const interval = Number($id('mp-interval').value);
    showWaiting(await session.host('pvp', interval));
  } catch (e) { mpError(e); }
});
$id('mp-join-btn').addEventListener('click', async () => {
  if (!requireName()) return;
  if (!await chooseCharacter(true)) return;   // pick a character before joining
  const btn = $id('mp-join-btn');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Connecting…';
  try {
    const session = await ensureMp();
    await session.join($id('mp-code').value);
    mpCode = $id('mp-code').value.trim().toUpperCase();
  } catch (e) { mpError(e); }
  btn.disabled = false;
  btn.textContent = label;
});

// the room code is a copy button — share it with one click
$id('mp-code-display').addEventListener('click', async () => {
  if (!mpCode) return;
  try {
    await navigator.clipboard.writeText(mpCode);
    ui.toast('📋 Game code copied!', 'level');
  } catch { /* clipboard may be unavailable — the code is on screen anyway */ }
});

function buyItem(id) {
  const item = itemById(id);
  if (!item || player.level < item.level) return; // re-buying copies is fine
  if (item.training && player.upgrades?.[item.training]) return; // skills are one-time
  if (player.invFullFor(id)) { ui.toast('🎒 Inventory full — drop or use something first.', ''); audio.sfx('error', 0.5); return; }
  const cost = costFor(item.cost, game.kind === 'moba');
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  if (item.training) { // pure skill (e.g. Swimming) — learned, not carried
    player.upgrades[item.training] = true;
    ui.toast(`${item.icon} ${item.name} learned!`, 'level');
    audio.sfx('upgrade', 0.5);
    panels.refresh();
    panels.flashCard(item.name);
    return;
  }
  player.ownItem(id);
  ui.toast(item.placeable
    ? `🎒 ${item.name} is in your bag — click it in Character (C) to place it.`
    : `🎒 ${item.name} is in your bag — equip it in Character (C).`, 'level');
  audio.sfx('buy', 0.5);
  panels.refresh();
  panels.flashCard(item.name);
}

function buySpell(id) {
  const spell = spellById(id);
  if (!spell || player.spellsOwned.has(id) || player.level < spell.level) return;
  const cost = costFor(spell.cost, game.kind === 'moba');
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.ownSpell(id);
  audio.sfx('upgrade', 0.5);
  panels.refresh();
  panels.flashCard(spell.name);
}

function buyStat(id) {
  const track = STAT_TRACKS.find(t => t.id === id);
  const tier = player.stats[id];
  if (!track || tier >= track.max || player.level < trainingLevelFor(track, tier + 1)) return;
  if (game.kind === 'survival' && id === 'pet' && player.selectedClass !== 'beastmaster') {
    ui.toast('🔒 Pet Training requires the Beastmaster class.', 'error');
    audio.sfx('error', 0.4);
    return;
  }
  const cost = costFor(track.cost(tier + 1), game.kind === 'moba');
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.stats[id]++;
  player.recompute();
  audio.sfx('upgrade', 0.5);
  panels.refresh();
  panels.flashCard(track.name);
}

// Committing to a class is now an explicit, cheap step: it just spends the
// choose fee and locks the tree in. Skills are trained afterwards along the path.
function chooseClass(classId) {
  const tree = classTreeById(classId);
  if (!tree) return;
  if (!nearClassMaster()) {
    ui.toast('🧙 A Class Master must induct you — find one (homestead or village).', 'error');
    audio.sfx('error', 0.4);
    return;
  }
  if (player.selectedClass) {
    if (player.selectedClass !== classId) {
      ui.toast(`🔒 You are already committed to ${classTreeById(player.selectedClass)?.name}.`, 'error');
      audio.sfx('error', 0.4);
    }
    return;
  }
  if (player.meat < CLASS_CHOOSE_COST) {
    ui.toast(`🍖 Choosing ${tree.name} costs ${CLASS_CHOOSE_COST} meat.`, 'error');
    audio.sfx('error', 0.4);
    return;
  }
  player.meat = roundResource(player.meat - CLASS_CHOOSE_COST);
  player.selectedClass = classId;
  player.enforceClassEquipment();
  player.recompute();
  companions.sync(player);
  ui.toast(`${tree.icon} You have chosen the ${tree.name} path!`, 'level');
  audio.sfx('upgrade', 0.6);
  panels.refresh();
  panels.flashCard(tree.name);
}

function trainClassSkill(id) {
  const skill = classSkillById(id);
  if (!skill) return;
  if (!nearClassMaster()) {
    ui.toast('🧙 Only a Class Master can teach that — find one (homestead or village).', 'error');
    audio.sfx('error', 0.4);
    return;
  }
  if (!player.selectedClass) {
    ui.toast('🧬 Choose a class first.', 'error');
    audio.sfx('error', 0.4);
    return;
  }
  if (player.selectedClass !== skill.classId) {
    ui.toast(`🔒 You are already committed to ${classTreeById(player.selectedClass)?.name}.`, 'error');
    audio.sfx('error', 0.4);
    return;
  }
  const current = player.classRank(id);
  const nextRank = current + 1;
  if (nextRank > skill.maxRank) return;
  const requiredLevel = classSkillRequiredLevel(skill, nextRank);
  if (player.level < requiredLevel) {
    ui.toast(`🔒 ${skill.name} rank ${nextRank} requires level ${requiredLevel}.`, 'error');
    audio.sfx('error', 0.4);
    return;
  }
  const firstOfClass = id === firstClassSkillId(skill.classId);
  const meatCost = classSkillMeatCost(skill, nextRank, firstOfClass);
  const essenceCost = classSkillEssenceCost(skill, nextRank, firstOfClass);
  if (player.meat < meatCost) {
    ui.toast(`🍖 ${skill.name} rank ${nextRank} costs ${meatCost} meat.`, 'error');
    audio.sfx('error', 0.4);
    return;
  }
  if (player.essence < essenceCost) {
    ui.toast(`🧪 ${skill.name} rank ${nextRank} costs ${essenceCost} essence — hunt the deeper biomes.`, 'error');
    audio.sfx('error', 0.4);
    return;
  }
  player.meat = roundResource(player.meat - meatCost);
  if (essenceCost) player.essence = roundResource(player.essence - essenceCost);
  player.selectedClass = skill.classId;
  player.classTraining[id] = nextRank;
  player.enforceClassEquipment();
  player.recompute();
  companions.sync(player);
  const tree = classTreeById(skill.classId);
  // New actives are NOT auto-slotted — the player drags them onto the 1–9 bar
  // (a one-time hint above the bar teaches this on the very first ability).
  ui.toast(skill.type === 'active' && nextRank === 1 && !player.spellSlots.includes(id)
    ? `${tree.icon} Learned: ${skill.name} — drag it onto the action bar!`
    : `${tree.icon} Trained: ${skill.name} — rank ${nextRank}/${skill.maxRank}`, 'level');
  audio.sfx('upgrade', 0.55);
  panels.refresh();
  panels.flashCard(skill.name);
}

function resetClassTree() {
  if (!player.selectedClass) return;
  // The panel arms this with a two-click confirm, so no blocking dialog here.
  const oldActives = new Set(player.trainedClassActives().map(skill => skill.id));
  player.clearClassCombatState();
  player.selectedClass = null;
  player.classTraining = {};
  player.spellSlots = player.spellSlots.map(id => oldActives.has(id) ? undefined : id);
  ui.updateSpellbar(player);   // the bar still showed the reset abilities
  for (const id of oldActives) delete player.spellCds[id];
  player.enforceClassEquipment();
  player.recompute();
  companions.sync(player);
  clearHunterTraps();
  ui.toast('🔄 Class reset. Trained ranks are gone; spent meat was not refunded.', 'level');
  audio.sfx('upgrade', 0.5);
  panels.refresh();
}

function buyConsumable(id) {
  const c = consumableById(id);
  if (!c) return;
  if (!Object.entries(c.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(c.cost)) player[k] = roundResource(player[k] - v);
  player.consumables[id] = (player.consumables[id] ?? 0) + 1;
  audio.sfx('buy', 0.5);
  panels.refresh();
  panels.flashCard(c.name);
}

// ---- dropping things at your feet (so a co-op friend can grab them) ----
function dropAt() {
  return player.pos.clone().add(player.facing.clone().multiplyScalar(1.6));
}

function dropResource(key) {
  const amt = Math.min(5, player[key]);
  if (amt <= 0) return;
  player[key] = roundResource(player[key] - amt);
  const at = dropAt();
  // the HOST owns pickups in co-op — a guest asks the host to spawn it
  if (mp?.active && !mp.isHost) mp.sendDrop(key, amt, at.x, at.z, true);
  else pickups.spawn(key, amt, at, 0.6, { id: player.id, t: 10 });
  audio.sfx('click', 0.4);
}

function dropItem(id) {
  if (id === 'fists' || !player.removeItem(id)) return;
  // clear the hotkey only when the LAST copy left your hands
  if (!player.hasItem(id)) {
    player.spellSlots = player.spellSlots.map(sid => (sid === id ? undefined : sid));
    ui.updateSpellbar(player);
  }
  const at = dropAt();
  if (mp?.active && !mp.isHost) mp.sendDrop('item', id, at.x, at.z, true);
  else pickups.spawn('item', id, at, 0.4, { id: player.id, t: 10 });
  audio.sfx('click', 0.4);
}

function dropConsumable(id) {
  if ((player.consumables[id] ?? 0) <= 0) return;
  player.consumables[id]--;
  const at = dropAt();
  if (mp?.active && !mp.isHost) mp.sendDrop(id, 1, at.x, at.z, true);
  else pickups.spawn(id, 1, at, 0.5, { id: player.id, t: 10 });
  audio.sfx('click', 0.4);
}

// action bar 1–9: spells and trained class abilities cast, items equip
// The Q ring: player.spellSlots[Q] holds an ARRAY of weapon ids instead of a
// single id. Everything that reads a slot has to cope with both shapes.
function weaponRing() {
  const v = player.spellSlots[WEAPON_RING_SLOT];
  return Array.isArray(v) ? v : (v ? [v] : []);
}

// press Q: equip the next weapon on the ring (wrapping), skipping anything you
// no longer own so a sold or broken tool cannot jam the cycle
function cycleWeaponRing() {
  const ring = weaponRing().filter(id => player.hasItem(id) || id === 'fists');
  if (!ring.length) {
    ui.toast('🔁 Q is empty — drag weapons onto it (up to 5) to build a swap ring.', '');
    return;
  }
  const here = ring.indexOf(player.equipment.weapon);
  const next = ring[(here + 1) % ring.length];
  if (next === player.equipment.weapon && ring.length === 1) {
    ui.toast(`🔁 ${itemById(next)?.name ?? next} is the only thing on the ring.`, '');
    return;
  }
  player.equip(next);
  ui.flashSpell(WEAPON_RING_SLOT);
  audio.sfx('equip_gear', 0.45);
}

function useBarSlot(i) {
  if (i === WEAPON_RING_SLOT) { cycleWeaponRing(); return; }
  const id = player.spellSlots[i];
  if (!id) return;
  // consumables and berries are slottable now, so a slot may hold something you
  // EAT rather than something you cast or equip
  if (id === 'berry') {
    if (!player.eatBerry()) ui.toast('🫐 No berries — pick some from a bush (E).', '');
    ui.flashSpell(i);
    refreshHud();
    return;
  }
  if (consumableById(id)) {
    if (!player.useConsumable(id) && (player.consumables[id] ?? 0) <= 0) {
      ui.toast(`${consumableById(id).icon} None left.`, '');
    }
    ui.flashSpell(i);
    refreshHud();
    return;
  }
  // ground-targeted abilities enter aim-and-click placement instead of firing
  const skill = classSkillById(id);
  if (skill && GROUND_TARGETED.has(skill.action) && player.hasClassSkill(id)) {
    beginAbilityPlacement(i, id, skill);
    return;
  }
  if (spellById(id) || classSkillById(id)) player.castSpell(i, {
    enemyMgr: combatMgr(), projectiles, aimPoint, world, rpgView: game.rpgView,
  });
  else if (itemById(id)?.placeable) placeCampItem(id);
  else if (itemById(id)) player.equip(id);
  ui.flashSpell(i);
}

// ---------- keys ----------
const inPlay = () => game.mode === 'play' && !game.editorView;
input.onKey('KeyU', () => inPlay() && panels.toggle('shop'));
input.onKey('KeyB', () => inPlay() && openBasePanel());

// In MOBA, B (or the 🏰 Base button) jumps straight to the build tab.
function openBasePanel() {
  if (game.kind === 'moba') panels.shopTab = 'base';
  panels.toggle('shop');
}
$id('base-btn').addEventListener('click', () => inPlay() && openBasePanel());
input.onKey('KeyC', () => inPlay() && panels.toggle('character'));
input.onKey('KeyN', () => inPlay() && panels.toggle('bestiary'));
// M / minimap click → the big world map (mute moved to Settings)
let bigmapOpen = false;
let bigmapT = 0;
let discoveryMode = null; // { radius } while a Scroll of Discovery awaits a click
function toggleBigMap(force) {
  if (game.kind !== 'survival' || game.mode !== 'play') { bigmapOpen = false; return; }
  bigmapOpen = force !== undefined ? force : !bigmapOpen;
  $id('bigmap').classList.toggle('hidden', !bigmapOpen);
  if (bigmapOpen) {
    audio.sfx('click', 0.4);
    minimap.bigPanX = minimap.bigPanZ = 0; // reopen centered on the player
    // admin mode only: the one-click full-map reveal
    $id('bigmap-discover').classList.toggle('hidden', !game.adminMode);
    minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  } else if (discoveryMode) {
    // closing the map cancels an unused scroll draw — refund it
    discoveryMode = null;
    $id('bigmap').classList.remove('discovery');
  }
}

// Scroll of Discovery: open the map and wait for the player to pick a spot,
// then reveal the fog within `radius` metres of it with a satisfying pulse.
function startDiscovery(radius) {
  if (panels.open) panels.toggle(null); // close the bag so the map is clickable
  discoveryMode = { radius };
  toggleBigMap(true);
  $id('bigmap').classList.add('discovery');
  ui.toast('📜 Pick a spot on the map to unfurl the scroll and reveal the land around it.', 'level');
  audio.sfx('special', 0.5);
}
input.onKey('KeyM', () => toggleBigMap());
$id('minimap').addEventListener('click', () => toggleBigMap());
// admin: rip the fog off the whole world in one click
$id('bigmap-discover').addEventListener('click', () => {
  if (!game.adminMode) return;
  minimap.discovered.fill(1);
  minimap.redrawT = 0;
  minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  audio.sfx('map_reveal', 0.7);
  ui.toast('🔍 The whole world lies bare.', 'level');
});

// click & drag the big map with the mouse to pan around (when zoomed in)
{
  const bigCanvas = $id('bigmap-canvas');
  let dragFrom = null;
  // client px → world coords, and → canvas px (shared by drag/waypoint/scroll)
  const canvasPx = (e) => {
    const rect = bigCanvas.getBoundingClientRect();
    const css2px = bigCanvas.width / (rect.width || bigCanvas.width);
    return { cx: (e.clientX - rect.left) * css2px, cy: (e.clientY - rect.top) * css2px };
  };
  const toWorld = ({ cx, cy }) => ({
    wx: (minimap._bigOx ?? -WORLD.radius) + cx / (minimap.bigScale || 1),
    wz: (minimap._bigOz ?? -WORLD.radius) + cy / (minimap.bigScale || 1),
  });
  bigCanvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    // Scroll of Discovery: left-click PICKS a spot instead of dragging
    if (discoveryMode) { revealDiscovery(e); return; }
    dragFrom = { x: e.clientX, y: e.clientY };
    bigCanvas.setPointerCapture(e.pointerId);
    bigCanvas.classList.add('dragging');
  });
  bigCanvas.addEventListener('pointermove', (e) => {
    // while a scroll is open, draw the 300 m reveal ring under the cursor
    if (discoveryMode) {
      minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
      const { cx, cy } = canvasPx(e);
      const rpx = discoveryMode.radius * (minimap.bigScale || 1);
      const ctx = bigCanvas.getContext('2d');
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, rpx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 226, 120, 0.14)';
      ctx.strokeStyle = 'rgba(255, 226, 120, 0.9)';
      ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    if (!dragFrom) return;
    // clientX is CSS px; the canvas may be shrunk by max-width — rescale
    const css2px = bigCanvas.width / (bigCanvas.clientWidth || bigCanvas.width);
    const s = minimap.bigScale || 1;
    minimap.bigPanX -= ((e.clientX - dragFrom.x) * css2px) / s;
    minimap.bigPanZ -= ((e.clientY - dragFrom.y) * css2px) / s;
    dragFrom = { x: e.clientX, y: e.clientY };
    minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  });
  const stopDrag = () => { dragFrom = null; bigCanvas.classList.remove('dragging'); };
  bigCanvas.addEventListener('pointerup', stopDrag);
  bigCanvas.addEventListener('pointercancel', stopDrag);

  // unfurl the scroll at the clicked spot: reveal the ring + a golden pulse
  function revealDiscovery(e) {
    const px = canvasPx(e);
    const { wx, wz } = toWorld(px);
    const radius = discoveryMode.radius;
    discoveryMode = null;
    $id('bigmap').classList.remove('discovery');
    minimap.revealArea(wx, wz, radius);
    minimap.redrawT = 0;
    audio.sfx('map_reveal', 0.7);
    ui.toast('📜 The scroll flares — the mist peels back!', 'level');
    // a golden ring blooms outward from the chosen spot, then settles
    const rpx = radius * (minimap.bigScale || 1);
    let t = 0;
    const pulse = () => {
      if (!bigmapOpen) return;
      t += 1 / 60;
      minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
      const ctx = bigCanvas.getContext('2d');
      const k = Math.min(1, t / 0.7);
      ctx.save();
      ctx.beginPath(); ctx.arc(px.cx, px.cy, rpx * k, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 226, 120, ${1 - k})`;
      ctx.lineWidth = 3 + 4 * (1 - k);
      ctx.shadowColor = 'rgba(255, 210, 90, 0.9)'; ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(px.cx, px.cy, rpx, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 226, 120, ${0.16 * (1 - k)})`;
      ctx.fill();
      ctx.restore();
      if (t < 0.7) requestAnimationFrame(pulse);
      else minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
    };
    requestAnimationFrame(pulse);
  }
  // RIGHT-click drops a navigation waypoint at the clicked world point
  bigCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = bigCanvas.getBoundingClientRect();
    const css2px = bigCanvas.width / (rect.width || bigCanvas.width);
    const cx = (e.clientX - rect.left) * css2px, cy = (e.clientY - rect.top) * css2px;
    const wx = (minimap._bigOx ?? -WORLD.radius) + cx / (minimap.bigScale || 1);
    const wz = (minimap._bigOz ?? -WORLD.radius) + cy / (minimap.bigScale || 1);
    if (radiusOf(wx, wz) > WORLD.radius) { minimap.waypoint = null; }
    else {
      minimap.waypoint = { x: wx, z: wz };
      ui.toast('📍 Waypoint set — follow the arrow.', 'level');
      audio.sfx('click', 0.4);
    }
    minimap.redrawT = 0;
    minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  });
}

// minimap zoom buttons (don't let their clicks open the big map)
function updateZoomButtons() {
  $id('mm-zoom-in').disabled = minimap.zoom <= 0;
  $id('mm-zoom-out').disabled = minimap.zoom >= minimap.viewSpans.length - 1;
}
$id('mm-zoom-in').addEventListener('click', (e) => { e.stopPropagation(); minimap.zoomBy(-1); updateZoomButtons(); audio.sfx('click', 0.3); });
$id('mm-zoom-out').addEventListener('click', (e) => { e.stopPropagation(); minimap.zoomBy(1); updateZoomButtons(); audio.sfx('click', 0.3); });
updateZoomButtons();

// Walk INTO your home (the cave at first, the upgraded building later) and
// press E to open the build & upgrade menu.
function nearHome() {
  if (game.kind !== 'survival' || !camp) return false;
  // your home IS the center structure (cave → tent → … → keep)
  return radiusOf(player.pos.x, player.pos.z) < WORLD.caveR + 5;
}
// E is contextual: revive partner > chest > home > landmark > treasure dig
function nearChest() {
  const at = camp?.positionOf('chest');
  return game.kind === 'survival' && camp?.has('chest') && at
    && Math.hypot(player.pos.x - at.x, player.pos.z - at.z) < 4;
}
function nearPoi() {
  if (game.kind !== 'survival') return null;
  return world.poisNear?.(player.pos.x, player.pos.z, 4).find(p => !p.claimed) ?? null;
}
function nearSmith() {
  return game.kind === 'survival' && !!world.smithNear?.(player.pos.x, player.pos.z, 4.5);
}

// A class is CHOSEN and abilities are TRAINED at a Class Master, nowhere else.
// One stands at the homestead so a fresh character isn't stranded; the village
// keeps the other.
function nearClassMaster() {
  return game.kind === 'survival' && !!world.classMasterNear?.(player.pos.x, player.pos.z, 4.5);
}
function nearTreasure() {
  return game.kind === 'survival' && player.treasureAt
    && Math.hypot(player.pos.x - player.treasureAt.x, player.pos.z - player.treasureAt.z) < 5;
}

// ---------- lair dungeons: every named boss lives in its own instance ----------
// Entering swaps the loop's `world` for a DungeonWorld pocket (the same swap
// trick the MOBA uses); leaving swaps the untouched overworld right back.
let dungeonOverworld = null, dungeonReturn = null, dungeonHiddenPickups = [];

function dressLairBoss(boss, lair, poiId) {
  boss.bossName = lair.name;
  boss.lairDrop = lair.drop;   // guaranteed unique on death
  boss.lairId = poiId;
  boss.lairBoss = true;        // calls its brood at half health
  // some masters outgrow even a 3-skull frame (Grimfrost the Colossus)
  if (lair.extraScale) {
    boss.mesh.scale.multiplyScalar(lair.extraScale);
    boss.sizeMult *= lair.extraScale;
    boss.hitR *= lair.extraScale;
    boss.range *= lair.extraScale;
  }
  if (lair.hpMult) {
    boss.hp *= lair.hpMult;
    boss.maxHp = boss.hp;
  }
}

function populateDungeon(dw, poi, lair, progress) {
  const mobs = lair.mobs ?? [lair.type];
  let mi = 0;
  // three broods barring the corridor
  for (const s of [26, 48, 70]) {
    for (let i = 0; i < 3; i++) {
      const pt = dw.corridorPoint(s + (i === 2 ? 3 : 0), (i - 1) * 3.4);
      const e = enemyMgr._spawn(mobs[mi++ % mobs.length], pt.x, pt.z, progress);
      e.aggroed = false; e.dungeonMob = true; e.cryptId = poi.id;
    }
  }
  // two hall wardens flanking the master
  for (const off of [-7, 7]) {
    const pt = dw.hallPoint(off);
    const e = enemyMgr._spawn(mobs[Math.floor(Math.random() * mobs.length)], pt.x, pt.z, progress);
    e.aggroed = false; e.dungeonMob = true; e.cryptId = poi.id;
  }
  const hc = dw.hallCenter();
  const boss = enemyMgr._spawn(lair.type, hc.x, hc.z, progress, 3, { ambush: true });
  dressLairBoss(boss, lair, poi.id);
  boss.dungeonMob = true;
  boss.aggroed = false;
}

function enterLair(poi) {
  if (mp?.active || game.dungeon) return;
  const lair = BIOME_LAIRS[poi.ring];
  if (!lair) return;
  clearHunterTraps(); // surface traps do not follow the player underground
  if (player.mounted) dismountHorse();
  const progress = progressAt(poi.x, poi.z);
  // freeze the overworld: every creature melts back into its zone pool
  enemyMgr.suspend = true;
  enemyMgr.clearAll(true);
  dungeonOverworld = world;
  dungeonReturn = { x: player.pos.x, z: player.pos.z };
  const dw = new DungeonWorld(scene, { entry: { x: poi.x, z: poi.z }, lair });
  world = dw;
  pickups.world = dw;
  enemyMgr.world = dw;
  // overworld ground loot would sink onto the dungeon floor — hide it
  dungeonHiddenPickups = pickups.list.slice();
  for (const p of dungeonHiddenPickups) p.mesh.visible = false;
  game.dungeon = { poi, lair };
  const start = dw.startPos();
  player.pos.set(start.x, 0, start.z);
  player.y = null; // snap the vertical to the dungeon floor
  populateDungeon(dw, poi, lair, progress);
  $id('minimap').style.display = 'none';
  $id('blizzard').style.opacity = 0; // no surface weather follows you down
  ui.banner(`— ${lair.den ?? 'The Lair'} —`);
  ui.toast(`💀 ${lair.name} waits in the far hall. Fight through the brood — or slip back out through the blue arch (E).`, 'boss');
  audio.sfx('lane_unlock', 0.6);
}

function exitLair(cleared) {
  if (!game.dungeon) return;
  clearHunterTraps(); // dungeon traps must not remain in the restored overworld scene
  // whatever loot still lies on the dungeon floor comes out WITH you
  // (the hidden overworld pickups are exactly dungeonHiddenPickups)
  const hidden = new Set(dungeonHiddenPickups);
  enemyMgr.clearAll(false); // dungeon dwellers simply vanish
  world.dispose();
  world = dungeonOverworld;
  dungeonOverworld = null;
  pickups.world = world;
  enemyMgr.world = world;
  enemyMgr.suspend = false;
  for (const p of pickups.list) {
    if (hidden.has(p)) continue;
    p.x = dungeonReturn.x + (Math.random() - 0.5) * 3;
    p.z = dungeonReturn.z + (Math.random() - 0.5) * 3;
    p.mesh.position.set(p.x, world.heightAt(p.x, p.z) + 0.45, p.z);
  }
  for (const p of dungeonHiddenPickups) p.mesh.visible = true;
  dungeonHiddenPickups = [];
  game.dungeon = null;
  player.pos.set(dungeonReturn.x, 0, dungeonReturn.z);
  player.y = null;
  $id('minimap').style.display = '';
  minimap.redrawT = 0;
  if (cleared) ui.banner('— You emerge victorious —');
  else ui.toast('🌲 You slip back out into the open air.', '');
  audio.sfx('click', 0.5);
}

// landmark rewards: shrines bless, monoliths pay out, crypts must be cleared
function claimPoi(poi) {
  // singleplayer lairs are DOORS — E walks you into the boss's dungeon
  if (poi.type === 'lair' && !mp?.active) { enterLair(poi); return; }
  if (['crypt', 'temple', 'summit', 'lair', 'captive'].includes(poi.type)) {
    // combatMgr(), not enemyMgr: on the dedicated server the enemies you can
    // see and fight live in the shadow world, and the local enemyMgr is EMPTY.
    // Asking the wrong one found zero keepers and claimed the lair instantly.
    const guards = (combatMgr()?.alive?.() ?? []).filter(e => e.cryptId === poi.id);
    if (guards.length) {
      ui.toast(`☠️ Still guarded — ${guards.length} keeper${guards.length > 1 ? 's' : ''} left!`, 'boss');
      audio.sfx('error', 0.5);
      return;
    }
  }
  if (poi.type === 'trader') { tradeWith(poi); return; }         // repeatable
  if (poi.type === 'graveyard') { startGraveyardEvent(poi); return; }
  if (poi.type === 'village') {
    if (player.upgrades.tribePass) { ui.toast('🪶 The tribes already count you a friend.', ''); return; }
    if (player.meat < 15) {
      ui.toast('🪶 The elder wants a tribute of 15 🍖 — then the tribes will let you walk their lands.', '');
      audio.sfx('error', 0.4);
      return;
    }
    player.meat = roundResource(player.meat - 15);
    player.upgrades.tribePass = true;
    enemyMgr.tribePass = true;
    recordQuestEvent('tribeAlliance', poi.ring);
    recordQuestEvent('landmark', poi.ring);
    ui.toast('🪶 Tribute accepted — tribesmen and shamans will no longer attack you!', 'level');
    audio.sfx('victory', 0.45);
    panels.refresh();
    return; // village stays (repeat E just greets you)
  }
  if (poi.type === 'race') { startRace(poi); return; }             // repeatable
  if (poi.type === 'liana') { startGlide(poi); return; }           // repeatable
  if (poi.type === 'bonfire') {                                     // repeatable rest stop
    player.hp = player.maxHp;
    if (!world.safeZones.some(sz => sz.x === poi.x && sz.z === poi.z)) {
      world.safeZones.push({ x: poi.x, z: poi.z, r: 10 });
      recordQuestEvent('bonfire', poi.ring);
      recordQuestEvent('landmark', poi.ring);
    }
    ui.toast('🔥 You warm up by the bonfire — fully healed, and this camp is safe now.', 'level');
    audio.sfx('evolve_ready', 0.5);
    return;
  }
  if (poi.type === 'captive') {
    markPoiClaimed(poi);
    if (poi.mesh?.userData.prisoner) poi.mesh.userData.prisoner.visible = false;
    recordQuestEvent('rescue', poi.ring);
    recordQuestEvent('landmark', poi.ring);
    player.essence = roundResource(player.essence + 2);
    ui.toast('🔓 The captive escapes toward camp — +2 🧪.', 'level');
    audio.sfx('victory', 0.4);
    return;
  }
  markPoiClaimed(poi);
  recordQuestEvent(poi.type, poi.ring);
  recordQuestEvent('landmark', poi.ring);
  const ring = poi.ring;
  const at = { x: poi.x + 1.8, z: poi.z + 1.8 };
  if (poi.type === 'farm') {
    // restoring the old farmstead makes it a small haven with a stocked larder
    world.safeZones.push({ x: poi.x, z: poi.z, r: 14 });
    pickups.spawn('wool', 6, at, 1.4);
    pickups.spawn('berry', 10, at, 1.4);
    pickups.spawn('meat', 12, at, 1.4);
    ui.toast('🏚️ You patch up the old farm — a safe haven now, larder included.', 'level');
    audio.sfx('tower_build', 0.5);
  } else if (poi.type === 'temple') {
    pickups.spawn('essence', 6, at, 1.6);
    pickups.spawn('iron', 8, at, 1.6);
    pickups.spawn('meat', 25, at, 1.8);
    const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
      && i.level <= player.level + 1);
    pickups.spawn('item', c[Math.floor(Math.random() * c.length)].id, at, 0.6);
    ui.banner('— The temple treasury is yours —');
    audio.sfx('victory', 0.5);
  } else if (poi.type === 'summit') {
    const xp = questXpFor(player.level) * 3;
    player.addXp(xp);
    pickups.spawn('essence', 15, at, 2);
    pickups.spawn('iron', 12, at, 2);
    const cc = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
      && i.level <= player.level + 1);
    for (let i = 0; i < 2; i++) pickups.spawn('item', cc[Math.floor(Math.random() * cc.length)].id, at, 1);
    ui.banner('— ⛰️ THE SUMMIT IS YOURS —');
    ui.toast(`⛰️ You raise your banner over the world: +${xp} XP. There is nothing above you now.`, 'level');
    audio.sfx('victory', 0.7);
  } else if (poi.type === 'nest') {
    pickups.spawn('essence', 2 + ring, at, 1.2);
    pickups.spawn('iron', 3 + ring, at, 1.2);
    if (Math.random() < 0.3) {
      const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
        && i.level <= player.level + 1);
      pickups.spawn('item', c[Math.floor(Math.random() * c.length)].id, at, 0.6);
    }
    for (let i = 0; i < 2; i++) {
      const h = enemyMgr._spawn('harpy', poi.x + (i ? 4 : -4), poi.z + 3, progressAt(poi.x, poi.z));
      h.aggroed = true;
    }
    ui.toast('🥚 You rob the nest — and the harpies OBJECT.', 'boss');
    audio.sfx('lane_unlock', 0.55);
  } else if (poi.type === 'statue') {
    // a pact: pick your poison — every boon carries a bane (120 s)
    const pacts = [
      { boon: { dmg: 1.3, speed: -1.2, t: 120 }, label: '+30% damage, −1.2 speed' },
      { boon: { speed: 2.5, dmg: 0.85, t: 120 }, label: '+2.5 speed, −15% damage' },
      { boon: { regen: 2, speed: -0.8, dmg: 0.92, t: 120 }, label: '+2 regen/s, slower & weaker' },
    ];
    const pact = pacts[Math.floor(Math.random() * pacts.length)];
    player.boon = pact.boon;
    player.recompute();
    ui.toast(`🗿 The statue whispers a pact: ${pact.label} for 120 s.`, 'boss');
    audio.sfx('evolve_ready', 0.5);
  } else if (poi.type === 'shrine') {
    player.shrineBonus += 10;
    player.recompute();
    player.hp = player.maxHp;
    ui.toast('✦ The shrine blesses you: +10 max health, wounds healed.', 'level');
    audio.sfx('evolve_ready', 0.5);
  } else if (poi.type === 'monolith') {
    pickups.spawn('stone', 12 + ring * 6, at, 1.5);
    pickups.spawn('meat', 8 + ring * 5, at, 1.5);
    if (ring >= 2) pickups.spawn('iron', 2 + ring * 2, at, 1.2);
    ui.toast('▲ The monolith crumbles — a cache of resources spills out.', 'level');
    audio.sfx('kill_gold', 0.5);
  } else { // crypt
    pickups.spawn('meat', 15 + ring * 6, at, 1.7);
    pickups.spawn('hide', 3 + ring * 2, at, 1.4);
    const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
      && !player.hasItem(i.id) && i.level <= player.level + 1);
    if (candidates.length) {
      pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, at, 0.6);
    }
    ui.toast('☗ The crypt gives up its treasure!', 'level');
    audio.sfx('victory', 0.45);
  }
  minimap.redrawT = 0;
}

function digTreasure() {
  const t = player.treasureAt;
  const ring = biomeIndexAt(t.x, t.z);
  pickups.spawn('meat', 20 + ring * 8, t, 1.7);
  pickups.spawn('stone', 10 + ring * 5, t, 1.5);
  pickups.spawn('hide', 4 + ring * 2, t, 1.4);
  if (ring >= 2) pickups.spawn('iron', 3 + ring * 2, t, 1.2);
  if (Math.random() < 0.35) {
    const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique
      && !player.hasItem(i.id) && i.level <= player.level + 1);
    if (candidates.length) {
      pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, t, 0.6);
    }
  }
  player.treasureAt = null;
  minimap.treasureAt = null;
  ui.toast('💰 You dug up the treasure!', 'level');
  audio.sfx('victory', 0.5);
}

// The one context action. Bound to E on a keyboard and to the on-screen
// action button on a phone, so touch players can do everything E does.
function interactE() {
  if (!inPlay()) return;
  // as a ghost the ONLY interaction is climbing back into your own body
  if (ghost.active) {
    if (ghost.corpse && Math.hypot(player.pos.x - ghost.corpse.x,
                                   player.pos.z - ghost.corpse.z) < GHOST_CORPSE_R) {
      resurrectAtCorpse();
    }
    return;
  }
  // inside a lair dungeon the only interactions are the two portals
  if (game.dungeon) {
    if (world.atExit?.(player.pos)) { exitLair(true); return; }
    if (world.atEntrance?.(player.pos)) { exitLair(false); return; }
    return;
  }
  if (player.mounted) { dismountHorse(); return; } // E or X gets you off the horse
  if (boatMounted) { dismountBoat(); return; }
  const downedAlly = mp?.revivablePartner?.(); // co-op: helping a downed friend wins
  if (downedAlly) {
    const t = downedAlly.targetPos;
    startChannel(2, '💚 Reviving ally…', { x: t.x, z: t.z }, () => mp.tryRevivePartner());
    return;
  }
  if (nearChest()) panels.toggle('chest');
  else if (nearPlacedBoat()) mountBoat();
  else if (shipTryBoard()) { /* ship line boarding handled */ }
  else if (nearWildHorse()) tameHorse(nearWildHorse());
  else if (nearParkedHorse()) { mountUp(); audio.sfx('click', 0.5); }
  else if (nearClassMaster()) {   // the master teaches — class tree, no gear
    panels.openClassOnly?.();
    audio.sfx('special', 0.45);
  }
  else if (nearSmith()) { // the forge: quests + weapons & gear live HERE
    if (!panels.openSet.has('smith')) panels.toggle('smith');
    else panels.renderSmith();
    audio.loopStart('smith_forge', 0.5);
  }
  else if (nearFlightNest()) toggleFlightMap(true);
  else if (usePropNear()) { /* hive/cocoon/glade handled */ }
  else if (enemyMgr.prisonerNear?.(player.pos.x, player.pos.z, 3)) {
    freePrisoner(enemyMgr.prisonerNear(player.pos.x, player.pos.z, 3));
  }
  else if (nearPoi()) claimPoi(nearPoi());
  else if (nearTreasure()) digTreasure();
  // ripe berries are PICKED, not punched
  else if (nearBerryBush()) pickBerryBush(nearBerryBush());
}
input.onKey('KeyE', interactE);
$id('tc-action')?.addEventListener('click', () => { if (game.touch) interactE(); });

// Touch players get a button instead of E. It only appears when E would
// actually do something, and its icon says WHAT — so the phone build never
// shows a 'press E' prompt with no key to press.
function tickTouchAction() {
  const btn = $id('tc-action');
  if (!btn) return;
  if (!game.touch || !inPlay()) { btn.classList.add('hidden'); return; }
  let icon = null;
  if (ghost.active) {
    if (ghost.corpse && Math.hypot(player.pos.x - ghost.corpse.x,
        player.pos.z - ghost.corpse.z) < GHOST_CORPSE_R) icon = '\u2728';
  }
  else if (mp?.revivablePartner?.()) icon = '\ud83d\udc9a';
  else if (nearBerryBush()) icon = '\ud83e\uded0';
  else if (nearClassMaster()) icon = '\ud83e\uddd9';
  else if (nearChest?.()) icon = '\ud83d\udce6';
  else if (nearHome?.()) icon = '\ud83c\udfe0';
  else if (nearPoi?.()) icon = '\ud83d\udea9';
  else if (nearTreasure?.()) icon = '\ud83d\udcb0';
  btn.textContent = icon ?? '';
  btn.classList.toggle('hidden', !icon);
}

// the nearest bush with fruit on it, within arm's reach
const BERRY_REACH = 2.6;
function nearBerryBush() {
  for (const b of (world.bushesNear?.(player.pos, BERRY_REACH) ?? [])) {
    if (b.berries) return b;
  }
  return null;
}
function pickBerryBush(bush) {
  if (!bush || !world.pickBerries(bush)) return;
  pickups.spawn('berry', bush.mult ?? 1, new THREE.Vector3(bush.x, 0, bush.z), 0.7);
  mp?.sendBerry?.(bush.key);   // co-op: the partner's bush empties too
  audio.sfx('click', 0.4, 120);
}

// F2 — the admin World Editor: a top-down god view with brushes (DEVMODE)
let edPopT = 0;
function toggleWorldEditor() {
  if (!isAdmin() || game.mode !== 'play' || game.kind !== 'survival' || mp?.active || game.dungeon) return;
  worldEditor ??= new WorldEditor({
    scene, world,
    getAim: () => aimPoint,
    getMobs: () => enemyMgr.list,
    onTest: (x, z) => {
      if ((world.waterKindAt?.(x, z) ?? 0) === 2) {
        ui.toast('🌊 Deep water — pick a dry spot to test.', 'level');
        return;
      }
      worldEditor.toggle(false);
      if (shipLine?.rider === player) shipLine.rider = null; // never dragged back aboard
      if (flight) { scene.remove(flight.mesh); flight = null; player.flying = false; }
      player.pos.x = x;
      player.pos.z = z;
      player.y = null;           // snap onto the new ground — no phantom fall damage
      player.testGhost = true;   // creatures can't see a test-ghost (survives stealth ticks)
      game.testMode = true;
      ui.toast('▶ TEST MODE — you are invisible to mobs. F2 returns to the editor.', 'level');
    },
    toast: (m) => ui.toast(m, 'level'),
    onDirty: (kind, info = {}) => {
      if (kind === 'entities') world.applyPatchEntities(true);
      if (kind === 'ground' && info.area) {
        // live brushing: repaint tiles in place — zero flicker. Height-only
        // sculpt strokes (raise/lower/smooth/restore) skip the costly color
        // pass so they stay at high FPS; paint/water strokes do the full pass.
        if (info.heightsOnly) world.refreshGroundHeights(info.area.x, info.area.z, info.area.r);
        else world.refreshGroundNear(info.area.x, info.area.z, info.area.r);
      } else if (kind === 'sculpt' && info.area) {
        // sculpt stroke FINISHED: a full-color in-place repaint (no dispose →
        // no rebuild flash / no holes showing the underlay) + drop trees/rocks
        // and mobs back onto the new ground. Replaces the old regen "reload".
        const { x, z, r } = info.area;
        world.refreshGroundNear(x, z, r);
        world.regroundProps(x, z, r);
        enemyMgr.regroundMobs(x, z, r + 30);
      } else if (info.area) {
        world.regenChunksNear(info.area.x, info.area.z, info.area.r);
        if (kind === 'chunks') { // sculpt stroke finished: mobs follow the ground
          enemyMgr.regroundMobs(info.area.x, info.area.z, info.area.r + 30);
        }
      } else if (kind === 'ground') {
        world.refreshGroundAll(); // in-place repaint, amortized — no flash
      } else {
        world.regenChunks();
      }
      if (game.editorView && info.packs) { enemyMgr.editorReset(); edPopT = 0; }
      minimap?.clearBiomeCache?.();
    },
    onToggle: (on) => {
      game.editorView = on;
      if (on) closeCharSelect(); // never leave the New/Load character prompt over the editor
      document.body.classList.toggle('we-on', on); // hides the game HUD
      if (on && panels.open) panels.toggle(null);
      enemyMgr.zoneScale = on ? 3 : 1;   // mobs stay alive across the whole view
      enemyMgr.maxAlive = on ? 400 : null;
      if (on) {
        camera.far = 6500;               // god view must see kilometres
        camera.updateProjectionMatrix();
      }
      if (on) {
        player.testGhost = false;
        game.testMode = false;
        worldEditor.centerView(player.pos.x, player.pos.z);
        world.viewRadius = 5;              // stream a wide apron of chunks
        scene.fog.near = 400; scene.fog.far = 4000; // see the map, not the fog
        // the god view is ALWAYS forced to fast graphics — sparse vegetation,
        // low-detail trees, no shadows — so a whole biome stays fast & readable
        // (restored from the player's settings on exit). The Options → Graphics
        // tier only trades resolution + ground-tile density on top of this.
        world.foliageMult = FOLIAGE_MULT.low;
        world.treeDetail = TREE_DETAIL.low;
        renderer.shadowMap.enabled = false;
        sun.castShadow = false;
        scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
        world.regenChunks();               // rebuild loaded chunks at the forced settings
      } else {
        world.viewRadius = null;
        world.groundOnly = false;
        world.foliageMult = FOLIAGE_MULT[settings.foliage] ?? 1;
        applyGraphics(); // restore the player's tree detail / shadows / tile detail / resolution
        applyViewMode(); // restores fog / camera.far / view radius for the CURRENT mode
        world.regenChunks(); // rebuild with the player's real foliage / trees
      }
    },
    // editor-only render quality — resolution + ground-tile density ONLY (foliage,
    // trees and shadows are already forced fast on enter; view distance / chunk
    // radius is never touched, so the map stays as far-reaching at every tier)
    onGfx: (level) => {
      const dpr = window.devicePixelRatio;
      renderer.setPixelRatio(level === 'low' ? 1 : level === 'medium' ? Math.min(dpr, 1.35) : Math.min(dpr, 2));
      const detail = level === 'low' ? 0 : level === 'medium' ? Math.min(settings.texDetail ?? 0, 1) : (settings.texDetail ?? 0);
      if (world.groundDetail !== detail) { world.groundDetail = detail; world.regenChunks(); }
    },
  });
  worldEditor.o.world = world; // survive world swaps
  worldEditor.toggle();
}
input.onKey('F2', toggleWorldEditor);

// H — the keybind legend; I — inventory; F / G — field consumables
input.onKey('KeyH', () => { if (inPlay()) panels.toggle('help'); });
input.onKey('KeyI', () => { if (inPlay()) panels.toggle('character'); }); // inventory lives in the Armory
// F is an action slot now, but an EMPTY F keeps its old reflex: drink a salve.
function quaffSalve() {
  if (!player.useConsumable('salve') && player.consumables.salve <= 0) {
    ui.toast('🧪 No Healing Salve — buy some in Upgrades → Supplies.', '');
  }
  refreshHud();
}
input.onKey('KeyG', () => {
  if (!inPlay() || game.paused) return;
  if (!player.useConsumable('roast') && player.consumables.roast <= 0) {
    ui.toast('🍗 No Roasted Meat — buy some in Upgrades → Supplies.', '');
  }
});

// ---- Beastmaster class traps and companion maintenance ----
const hunterTraps = [];

function removeHunterTrap(trap) {
  const i = hunterTraps.indexOf(trap);
  if (i >= 0) hunterTraps.splice(i, 1);
  scene.remove(trap.mesh);
  trap.mesh.traverse(o => {
    o.geometry?.dispose?.();
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
    else o.material?.dispose?.();
  });
}

function clearHunterTraps() {
  while (hunterTraps.length) removeHunterTrap(hunterTraps[0]);
}

// arrows (and companion/orb shots) can crack a wild beehive open in flight
function arrowHitsHive(p) {
  if (game.kind !== 'survival') return false;
  const pos = p.mesh.position;
  for (const hive of (world.hivesNear?.(pos, 1.4) ?? [])) {
    if (hive.dead) continue;
    if (Math.hypot(hive.x - pos.x, hive.z - pos.z) < (hive.radius || 1) + 0.4) {
      const res = world.hitHive(hive, p.dmg);
      player.hooks.onHiveHit?.(hive, res);
      return true;
    }
  }
  return false;
}

// ---- ground-targeted class abilities: press the key, aim with the free
// cursor, click the ground to cast (capped at 20 m). Esc cancels. ----
let pendingAbility = null; // { slot, id, skill, ghost }
const GROUND_TARGETED = new Set(['zone', 'zoneBurst']);

function makeAbilityReticle(radius) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.2, radius - 0.25), radius, 40),
    new THREE.MeshBasicMaterial({ color: 0x8fd6ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  dot.rotation.x = -Math.PI / 2;
  g.add(ring, dot);
  return g;
}

function beginAbilityPlacement(slot, id, skill) {
  if (!inPlay() || player.dead) return;
  if ((player.spellCds[id] || 0) > 0) { audio.sfx('error', 0.35, 300); return; }
  if (player.castWindup || player.tameChannel) return;
  if (pendingCampItem) cancelCampItemPlacement();
  if (pendingNest) cancelNestPlacement();
  if (pendingAbility) cancelAbilityPlacement();
  if (panels.open) panels.toggle(null);
  const radius = classRankValue(skill, 'radius', player.classRank(id), 3);
  const ghost = makeAbilityReticle(radius);
  scene.add(ghost);
  pendingAbility = { slot, id, skill, ghost };
  document.exitPointerLock?.(); // free the cursor so you can aim on the ground
  ui.toast('🎯 Aim with the cursor and click the ground to cast. (Esc cancels)', 'level');
}

function cancelAbilityPlacement() {
  if (!pendingAbility) return;
  scene.remove(pendingAbility.ghost);
  pendingAbility = null;
}

function updateAbilityGhost() {
  if (!pendingAbility) return;
  // clamp the reticle to the 20 m cast range
  let dx = aimPoint.x - player.pos.x, dz = aimPoint.z - player.pos.z;
  const d = Math.hypot(dx, dz);
  const max = 20;
  const x = d > max ? player.pos.x + dx / d * max : aimPoint.x;
  const z = d > max ? player.pos.z + dz / d * max : aimPoint.z;
  pendingAbility.ghost.position.set(x, world.heightAt(x, z) + 0.08, z);
}

function confirmAbilityPlacement() {
  if (!pendingAbility) return true;
  const { slot } = pendingAbility;
  cancelAbilityPlacement();
  // cast at the aimed ground point (rpgView:false → castSpell uses aimPoint)
  player.castSpell(slot, { enemyMgr: combatMgr(), projectiles, aimPoint, world, rpgView: false });
  ui.flashSpell(slot);
  return true;
}

function placeHunterTrap(count = 1, power = 1, field = false, dmgPct = 0.55, stun = 3.5) {
  if (game.kind !== 'survival' || player.selectedClass !== 'beastmaster' || player.dead || player.mounted) return false;
  for (let n = 0; n < count; n++) {
    const angle = count > 1 ? n / count * Math.PI * 2 : 0;
    const spread = field ? 2.2 : 0;
    const x = player.pos.x + Math.cos(angle) * spread;
    const z = player.pos.z + Math.sin(angle) * spread;
    const mesh = new THREE.Group();
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x6f5634 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0xaeb7ad });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 5, 18), ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 4), metalMat);
      tooth.position.set(Math.cos(a) * 0.52, 0.13, Math.sin(a) * 0.52);
      tooth.rotation.z = Math.cos(a) * 0.65;
      tooth.rotation.x = Math.sin(a) * -0.65;
      mesh.add(tooth);
    }
    mesh.position.set(x, world.heightAt(x, z) + 0.07, z);
    scene.add(mesh);
    hunterTraps.push({ mesh, x, z, power, life: 90, armT: 0.4, dmgPct, stun });
    // a dust puff + a green arming-ring pulse as each trap latches into place
    player._fxBurst(new THREE.Vector3(x, world.heightAt(x, z) + 0.2, z), 0xbfae86, 6, 3, 0.4);
    player._spawnClassRing(new THREE.Vector3(x, world.heightAt(x, z), z), 1.1, 0x9bd94a, 0.5);
  }
  while (hunterTraps.length > 8) removeHunterTrap(hunterTraps[0]);
  ui.toast(count > 1 ? `🪤 Trap field placed (${count}).` : '🪤 Snare placed.', '');
  // a metallic set/latch instead of the menu blip
  audio.sfx('equip_gear', 0.55, 0);
  return true;
}

function updateHunterTraps(dt, enemyManager) {
  for (let i = hunterTraps.length - 1; i >= 0; i--) {
    const trap = hunterTraps[i];
    trap.life -= dt;
    trap.armT -= dt;
    trap.mesh.rotation.y += dt * 0.35;
    if (trap.life <= 0) { removeHunterTrap(trap); continue; }
    if (trap.armT > 0) continue;
    const target = enemyManager?.alive?.().find(e => !e.cfg?.passive
      && Math.hypot(e.pos.x - trap.x, e.pos.z - trap.z) < 1.15 + (e.hitR || 0));
    if (!target) continue;
    const trapPower = (trap.power || 1) * (1 + (player.classEffects.trapPower || 0));
    enemyManager.damage(target, Math.max(20, player.weapon.dmg * (trap.dmgPct ?? 0.55)) * trapPower, null, 'local',
      { bleed: { dps: 4 + player.level * 0.4, dur: 4 } });
    enemyManager.stun?.(target, trap.stun ?? 3.5);
    ui.popup(target.mesh.position.clone().setY(target.mesh.position.y + 1.8), '🪤 SNARED', '#d9e88a', 'big');
    player._fxBurst?.(target.pos, 0xaeb7ad, 12, 5, 0.45); // steel jaws snap shut
    player._spawnClassRing?.(target.pos, 1.3, 0xd9e88a, 0.4);
    audio.sfx('base_hit', 0.7, 0);
    audio.sfx('hit', 0.5, 0);
    removeHunterTrap(trap);
  }
}

const classRankValue = (skill, key, rank, fallback = 0) => {
  const value = skill?.[key];
  return Array.isArray(value) ? (value[Math.max(0, rank - 1)] ?? fallback) : (value ?? fallback);
};

function healLocalCompanion(amount) {
  const wolf = companions.wolf;
  if (!wolf || player.petDead) return false;
  const gained = Math.max(0, Math.min(wolf.maxHp - wolf.hp, Math.round(amount)));
  if (!gained) return false;
  wolf.hp += gained;
  ui.popup(wolf.mesh.position.clone().setY(wolf.mesh.position.y + 1.5), `+${gained} ❤️`, '#7fe07f');
  return true;
}

function handleClassWorldAction(action, skill, rank, ctx = {}) {
  const rv = (key, fallback = 0) => classRankValue(skill, key, rank, fallback);
  if (action === 'trap') return placeHunterTrap(rv('count', 1), rv('power', 1), false, rv('trapDmgPct', 0.55), rv('trapStun', 3.5));
  if (action === 'trapField') return placeHunterTrap(rv('count', 3), rv('power', 1), true, rv('trapDmgPct', 0.55), rv('trapStun', 3.5));
  if (action === 'mendPet') {
    const wolf = companions.wolf;
    if (!wolf || player.petDead) {
      ui.toast('🐾 You have no living companion to mend.', 'error');
      return false;
    }
    healLocalCompanion(wolf.maxHp * rv('power', 0.35));
    player.petCommandPower = Math.max(player.petCommandPower || 0, rv('power', 0.35) * 0.5);
    player.petCommandT = Math.max(player.petCommandT || 0, 6);
    // green healing sparkle column + empowered-claw glow on the companion
    player._fxBurst(wolf.mesh.position.clone(), 0x8ee87f, 12, 4, 0.5);
    player._spawnClassRing(wolf.pos, 1.4, 0x8ee87f, 0.5);
    for (let i = 0; i < 4; i++) {
      player._fxRiser(wolf.mesh.position.clone(), 0xbfffb0,
        new THREE.Vector3((Math.random() - 0.5), 2 + Math.random(), (Math.random() - 0.5)), 0.5, 0.14, 0.7);
    }
    audio.sfx('chime', 0.5, 0);
    return true;
  }
  if (action === 'petCommand') {
    if (!companions.wolf || player.petDead) {
      ui.toast('🐾 You need a living animal companion.', 'error');
      return false;
    }
    const commandAim = ctx.rpgView
      ? player.pos.clone().addScaledVector(player.facing, 32) : (ctx.aimPoint || aimPoint);
    // a Shift-locked enemy wins if it's in range; otherwise nearest-to-aim
    const sel = player._selectedTarget;
    const target = (sel && !sel.dying && !sel.dead && !sel.cfg?.passive
      && Math.hypot(sel.pos.x - player.pos.x, sel.pos.z - player.pos.z) < 32) ? sel
      : combatMgr()?.alive?.()
        .filter(e => !e.cfg?.passive && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 32)
        .map(e => ({ e, d: Math.hypot(e.pos.x - commandAim.x, e.pos.z - commandAim.z) }))
        .sort((a, b) => a.d - b.d)[0]?.e;
    if (!target) {
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.2),
        'Select an enemy first (hold Shift)', '#ffcc66');
      ui.toast('📣 Select an enemy first (hold Shift).', 'error');
      return false;
    }
    player.petCommandTargetId = target.id;
    player.petCommandT = 8;
    player.petCommandPower = rv('power', 0);
    // a red command marker over the quarry + a shout burst from the player
    player._spawnClassRing(target.pos, (target.hitR || 0.6) * 2, 0xff5a44, 0.6);
    player._fxBurst(target.mesh.position.clone(), 0xff7a5a, 10, 4, 0.5);
    player._fxBurst(player.mesh.position.clone().setY(player.mesh.position.y + 1.4), 0xffcf8a, 6, 4, 0.4);
    ui.popup(target.mesh.position.clone().setY(target.mesh.position.y + 2), '🎯', '#ff6b52', 'big');
    audio.sfx('aggro', 0.7, 0);
    ui.toast(`📣 Hunt Command: ${target.cfg?.name ?? target.type}`, 'level');
    return true;
  }
  if (action === 'groupHeal') {
    const base = rv('amount');
    player._healSelf(player._classHeal(base, player));
    if (companions.wolf) healLocalCompanion(player._classHeal(base, companions.wolf));
    const radius = rv('radius', 10) * (1 + (player.classEffects.healRadius || 0));
    mp?.sendClassHeal?.(player._classHeal(base, mp?.remote), radius);
    // a soft holy dome showing the heal radius + rising light motes
    player._spawnClassRing(player.pos, radius, 0xbfe8a0, 0.8);
    player._spawnClassRing(player.pos, radius * 0.6, 0xffe6a0, 0.6);
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius;
      player._fxRiser(new THREE.Vector3(player.pos.x + Math.cos(a) * r, player.mesh.position.y + 0.3, player.pos.z + Math.sin(a) * r),
        0xbfffb0, new THREE.Vector3(0, 1.6 + Math.random(), 0), 0.6, 0.14, 0.7);
    }
    audio.sfx('holy', 0.55, 0);
    return true;
  }
  if (action === 'healAlly') {
    const amount = player._classHeal(rv('amount'), mp?.remote);
    mp?.sendClassHeal?.(amount, 14);
    return true;
  }
  if (action === 'zoneHeal') {
    const amount = player._classHeal(rv('amount'), mp?.remote);
    mp?.sendClassHeal?.(amount, ctx.zone?.radius || rv('radius', 8), ctx.zone?.pos);
    return true;
  }
  if (action === 'resurrection') {
    const restored = rv('amount', 0.45);
    // a triumphant pillar of light + golden ring + rising sparks (self or ally)
    player._spawnClassRing(player.pos, 3, 0xfff0b0, 0.8);
    const pillar = player.pos.clone().setY(player.mesh.position.y + 2.2);
    player._fxStreak(pillar, 0, 0xfff0c0, 1.4, 4.2, 0.7, 0.85);
    player._fxStreak(pillar, Math.PI / 2, 0xfff0c0, 1.4, 4.2, 0.7, 0.85);
    for (let i = 0; i < 14; i++) {
      player._fxRiser(player.mesh.position.clone(), 0xfff0a5,
        new THREE.Vector3((Math.random() - 0.5) * 1.5, 3 + Math.random() * 2, (Math.random() - 0.5) * 1.5), 0.8, 0.18, 0.85);
    }
    audio.sfx('holy', 0.75, 0);
    if (mp?.sendClassRevive?.(restored, 14)) return true;
    player._healSelf(player.maxHp * restored);
    ui.toast('✝️ No fallen ally nearby — the miracle restores your health.', 'level');
    return true;
  }
  return false;
}

function nearGrave() {
  return camp?.gravePos
    && Math.hypot(player.pos.x - camp.gravePos.x, player.pos.z - camp.gravePos.z) < 6;
}

// bringing a fallen tamed pet back costs a modest level-scaled toll plus 10% of
// everything sunk into Pet Training (you can also just tame a NEW beast instead).
function petResurrectCost() {
  if (!player.tamedPet) return null;
  const total = { meat: 40 + player.level * 4, essence: 2 + Math.floor(player.level / 8) };
  const track = STAT_TRACKS.find(t => t.id === 'pet');
  if (track) for (let t = 1; t <= player.stats.pet; t++) {
    for (const [k, v] of Object.entries(track.cost(t))) total[k] = (total[k] || 0) + v * 0.1;
  }
  const out = {};
  for (const [k, v] of Object.entries(total)) out[k] = Math.max(1, Math.ceil(v));
  return out;
}

function canResurrectPetHere() {
  return game.kind === 'survival' && player.petDead && player.tamedPet
    && !player.dead && (nearHome() || nearGrave());
}

input.onKey('KeyX', () => {
  if (game.mode !== 'play') return;
  // dead → respawn at base immediately instead of waiting out the pause /
  // partner rescue. Co-op downed goes through the MP path (drops loot, etc.).
  if (player.dead) {
    if (mp?.respawnNow?.()) return;
  }
  if (player.mounted) dismountHorse();
  else if (boatMounted) dismountBoat();
});

input.onKey('KeyZ', () => {
  if (!inPlay() || game.paused) return;
  const mode = player.cycleArrowMode();
  if (!mode) return;
  const labels = {
    standard: 'Standard arrows', broadhead: 'Broadhead arrows — bleeding',
    fire: 'Fire arrows — burning',
  };
  ui.toast(`🏹 ${labels[mode]}`, 'level');
  audio.sfx('click', 0.35);
});

// R at a home/graveyard raises a fallen pet; elsewhere R is an action slot
function resurrectPet() {
  if (!inPlay() || !canResurrectPetHere()) return;
  const cost = petResurrectCost();
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  startChannel(2, '🐺 Resurrecting pet…', { x: player.pos.x, z: player.pos.z }, () => {
    if (!canResurrectPetHere()) return; // wandered off / pet state changed
    if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) return;
    for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
    player.petDead = false;
    companions.sync(player);
    ui.toast('🐺 Your pet is back at your side!', 'level');
    audio.sfx('spawn', 0.6);
    panels.refresh();
  });
}

const PET_MODES = ['aggressive', 'defensive', 'passive'];
const PET_MODE_LABEL = {
  aggressive: '🗡️ Aggressive — attacks anything near you',
  defensive: '🛡️ Defensive — only fights what attacks you',
  passive: '💤 Passive — never attacks',
};
input.onKey('KeyP', () => {
  if (!inPlay() || !(player.tamedPet || player.impActive)) return;
  player.petMode = PET_MODES[(PET_MODES.indexOf(player.petMode) + 1) % PET_MODES.length];
  ui.toast(`🐾 Pet mode: ${PET_MODE_LABEL[player.petMode]}`, 'level');
  audio.sfx('click', 0.4);
});
$id('bigmap').querySelector('.panel-close').addEventListener('click', () => toggleBigMap(false));
$id('flightmap-close').addEventListener('click', () => toggleFlightMap(false));
// clicking a roost on the flight map calls a griffin to carry you there
$id('flightmap-canvas').addEventListener('click', (e) => {
  if (!flightmapOpen) return;
  const c = e.currentTarget;
  const rect = c.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (c.width / rect.width);
  const py = (e.clientY - rect.top) * (c.height / rect.height);
  const node = flightNodes.find(n => Math.hypot(n.x - px, n.y - py) < 24);
  if (!node) return;
  if (Math.hypot(node.wx - player.pos.x, node.wz - player.pos.z) < 12) {
    ui.toast('🪽 You are already standing at this roost.', '');
    audio.sfx('error', 0.4);
    return;
  }
  toggleFlightMap(false);
  startFlight(node.wx, node.wz);
});
// mouse wheel zooms the flight map (starts from the auto-fit level)
$id('flightmap-canvas').addEventListener('wheel', (e) => {
  if (!flightmapOpen) return;
  e.preventDefault();
  const cur = flightZoom || drawFlightMap._autoZoom || 1;
  flightZoom = Math.max(1, Math.min(8, cur * (e.deltaY < 0 ? 1.4 : 1 / 1.4)));
  drawFlightMap();
}, { passive: false });
for (const [btnId, d] of [['bigmap-zoomin', 1], ['bigmap-zoomout', -1]]) {
  $id(btnId).addEventListener('click', () => {
    minimap.bigZoomBy?.(d);
    minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
  });
}
$id('respawn-grave').addEventListener('click', () => resurrectAtGraveyard());
for (let i = 0; i < MAX_SPELL_SLOTS; i++) {
  const code = SLOT_CODES[i];
  if (!code) continue;
  input.onKey(code, () => {
    if (!inPlay() || game.paused) return;
    // R doubles as "resurrect pet" at a home/graveyard — that wins when it is
    // actually available, otherwise R is just another action slot
    if (code === 'KeyR' && canResurrectPetHere()) { resurrectPet(); return; }
    // an unassigned F still drinks a salve, so the old muscle memory survives
    if (code === 'KeyF' && !player.spellSlots[i]) { quaffSalve(); return; }
    useBarSlot(i);
  });
}
input.onKey('Escape', () => {
  if (!inPlay()) return;
  if (!$id('inspect').classList.contains('hidden')) { $id('inspect').classList.add('hidden'); return; }
  if (socialTarget) { closePlayerActions(); return; }
  if (pendingAbility) { cancelAbilityPlacement(); ui.toast('Cast cancelled.', ''); return; }
  if (pendingCampItem) { cancelCampItemPlacement(); ui.toast('Placement cancelled.', ''); return; }
  if (pendingNest) { cancelNestPlacement(); ui.toast('🪺 Placement cancelled.', ''); return; }
  if (flightmapOpen) { toggleFlightMap(false); return; }
  if (bigmapOpen) { toggleBigMap(false); return; }
  if (panels.open) { panels.toggle(null); return; }
  if (mp?.active) return; // the shared world can't pause
  game.paused = !game.paused;
  ui.setPaused(game.paused);
});

// ---------- co-op ping (middle mouse): 3D ring + minimap marker ----------
const pingMarkers = [];
function showPing(x, z, mine = false) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xffa528, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, world.heightAt(x, z) + 0.15, z);
  scene.add(mesh);
  pingMarkers.push({ mesh, t: 8 });
  minimap.addPing(x, z);
  audio.sfx('click', 0.5, mine ? 350 : 0);
}
function updatePings(dt) {
  for (let i = pingMarkers.length - 1; i >= 0; i--) {
    const p = pingMarkers[i];
    p.t -= dt;
    const k = 1 + Math.sin(performance.now() / 160) * 0.18;
    p.mesh.scale.set(k, k, k);
    p.mesh.material.opacity = Math.min(0.9, p.t / 2);
    if (p.t <= 0) { scene.remove(p.mesh); pingMarkers.splice(i, 1); }
  }
}
window.addEventListener('pointerdown', (e) => {
  if (e.button !== 1 || !inPlay() || game.paused) return;
  e.preventDefault();
  showPing(aimPoint.x, aimPoint.z, true);
  mp?.sendPing?.(aimPoint.x, aimPoint.z);
});
window.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });

// ---------- aiming: the marker is clamped to the equipped weapon's range ----------
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimPoint = new THREE.Vector3(0, 0, -10);

// A short arc of the weapon-range circle, shown in the aim direction.
const aimArc = makeAimArc();
aimArc.visible = false;
scene.add(aimArc);

// the boat raft shown under the hero while crossing water
const raft = makeRaft();
raft.visible = false;
scene.add(raft);
let wasOnWater = false, boatPlaceT = 0, waveT = 0, lastWaveX = 0, lastWaveZ = 0;

// ---- riding: saddle a wild horse (E), ride with +9 speed, X dismounts ----
let horseMesh = null;     // the tamed horse's mesh (under you, or parked)
let parkedAt = null;      // { x, z } while dismounted
function nearWildHorse() {
  if (!player.hasSaddle || player.mounted || game.kind !== 'survival') return null;
  return enemyMgr.list.find(e => e.type === 'horse' && !e.dying
    && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 3.4) ?? null;
}
function nearParkedHorse() {
  return !player.mounted && horseMesh && parkedAt
    && Math.hypot(parkedAt.x - player.pos.x, parkedAt.z - player.pos.z) < 3.4;
}
function tameHorse(e) {
  const i = enemyMgr.list.indexOf(e);
  if (i >= 0) { scene.remove(e.mesh); enemyMgr.list.splice(i, 1); }
  if (!horseMesh) { horseMesh = makeHorse(); scene.add(horseMesh); }
  mountUp();
  ui.toast('🐴 Saddled! +9 speed — mounted attacks hit harder but recover slower. X to dismount.', 'level');
  audio.sfx('spawn', 0.5);
}
function mountUp() {
  player.mounted = true;
  parkedAt = null;
  horseMesh.visible = true;
}
function dismountHorse() {
  if (!player.mounted) return;
  player.mounted = false;
  // park the horse a couple metres to the side so it isn't inside the rider
  const sx = player.pos.x - player.facing.x * 2.2, sz = player.pos.z - player.facing.z * 2.2;
  parkedAt = { x: sx, z: sz };
  if (horseMesh) {
    horseMesh.visible = true;
    horseMesh.position.set(sx, world.heightAt(sx, sz), sz);
  }
  player.mesh.position.y = world.heightAt(player.pos.x, player.pos.z); // back on your feet
  ui.toast('🐴 Dismounted — press E beside the horse to ride again.', '');
  audio.sfx('click', 0.4);
}

// The placed Log Boat is a world mount: E picks it up underneath the player,
// X parks it at the current position. Merely owning/placing it no longer makes
// every lake passable.
let boatMounted = false;
function nearPlacedBoat() {
  if (boatMounted || game.kind !== 'survival' || !camp?.has('boat')) return false;
  const at = camp.positionOf('boat');
  return !!at && Math.hypot(at.x - player.pos.x, at.z - player.pos.z) < 3.6;
}

function mountBoat() {
  if (!nearPlacedBoat()) return;
  boatMounted = true;
  if (camp.meshes.boat) camp.meshes.boat.visible = false;
  boatPlaceT = 0;
  raft.visible = true;
  ui.toast('🛶 Log Boat mounted — paddle into water, X to dismount and park it.', 'level');
  audio.sfx('spawn', 0.45);
}

function dismountBoat() {
  if (!boatMounted) return;
  boatMounted = false;
  raft.visible = false;
  camp?.moveItem('boat', { x: player.pos.x, z: player.pos.z });
  mp?.sendCampSync?.();
  ui.toast('🛶 Log Boat parked — press E beside it to mount again.', '');
  audio.sfx('click', 0.4);
}

// ---- channeled actions (revive / pet resurrection): 2 s of standing still
// with a pulsing green ring; moving or dying interrupts ----
let channel = null;
function startChannel(dur, label, at, onDone) {
  cancelChannel(true);
  const fx = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.92, 24),
    new THREE.MeshBasicMaterial({ color: 0x7fff9f, transparent: true, opacity: 0.85 }));
  fx.rotation.x = -Math.PI / 2;
  fx.position.set(at.x, world.heightAt(at.x, at.z) + 0.15, at.z);
  scene.add(fx);
  channel = { t: 0, dur, label, sx: player.pos.x, sz: player.pos.z, fx, onDone };
  audio.sfx('evolve_ready', 0.4);
}
function cancelChannel(silent = false) {
  if (!channel) return;
  scene.remove(channel.fx);
  channel.fx.material.dispose();
  channel = null;
  if (!silent) { ui.toast('✋ Interrupted!', ''); audio.sfx('click', 0.35); }
}
function updateChannel(dt) {
  if (!channel) return;
  if (player.dead
      || Math.hypot(player.pos.x - channel.sx, player.pos.z - channel.sz) > 0.8) {
    cancelChannel();
    return;
  }
  channel.t += dt;
  const k = channel.t / channel.dur;
  channel.fx.scale.setScalar(1 + k * 1.4 + Math.sin(k * Math.PI * 6) * 0.12);
  channel.fx.material.opacity = 0.85 * (0.55 + 0.45 * Math.abs(Math.sin(k * 14)));
  if (channel.t >= channel.dur) {
    const done = channel.onDone;
    cancelChannel(true);
    audio.sfx('purchase', 0.5);
    done();
  }
}
const waves = [];
const waveGeo = new THREE.RingGeometry(0.5, 0.62, 20);
function spawnWave(x, z) {
  const m = new THREE.Mesh(waveGeo,
    new THREE.MeshBasicMaterial({ color: 0xdfeeff, transparent: true, opacity: 0.55 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, world.heightAt(x, z) + 0.28, z);
  scene.add(m);
  waves.push({ m, t: 0 });
}
function updateWaves(dt) {
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.t += dt;
    const k = w.t / 1.2;
    w.m.scale.setScalar(1 + k * 2.6);
    w.m.material.opacity = 0.55 * Math.max(0, 1 - k);
    if (k >= 1) { scene.remove(w.m); w.m.material.dispose(); waves.splice(i, 1); }
  }
}

// touch controls are live once the player has used them (set by js/touch.js)
function touchActive() { return !!game.touch; }

// nearest attackable enemy within ~50° of a heading and the player's reach+a
// bit — used so mobile attacks feel like they lock onto what you face
function nearestAimTarget(dirx, dirz) {
  const list = combatMgr()?.alive?.() ?? enemyMgr.list;
  const reach = player.attackRange + 3;
  let best = null, bestD = reach * reach;
  for (const e of list) {
    if (e.dying || e.friendly || e.cfg?.passive) continue;
    const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > bestD) continue;
    const dl = Math.sqrt(d2) || 1;
    if ((dx / dl) * dirx + (dz / dl) * dirz < 0.64) continue; // outside ~50° cone
    best = e; bestD = d2;
  }
  return best;
}

function updateAim() {
  // during any ground placement the free cursor drives the aim, even in RPG view
  const placing = pendingAbility || pendingCampItem || pendingNest;
  if (touchActive() && !placing && !game.rpgView) {
    // phone top-down: strike the way the stick points (or the last direction
    // while standing still), and snap toward the nearest enemy in that arc so
    // tapping attack feels like it locks on
    const a = input.touch.active
      ? { x: input.touch.mx, z: input.touch.mz } : input.touchAim;
    let dirx = a.x, dirz = a.z;
    const dl = Math.hypot(dirx, dirz) || 1; dirx /= dl; dirz /= dl;
    const foe = nearestAimTarget(dirx, dirz);
    if (foe) {
      const fx = foe.pos.x - player.pos.x, fz = foe.pos.z - player.pos.z, fl = Math.hypot(fx, fz) || 1;
      dirx = fx / fl; dirz = fz / fl;
    }
    input.touchAim.x = dirx; input.touchAim.z = dirz;
    aimPoint.set(player.pos.x + dirx * player.attackRange, 0, player.pos.z + dirz * player.attackRange);
  } else if (game.rpgView && !placing) {
    // third person: you strike what's in FRONT of you — aim rides the facing
    aimPoint.set(player.pos.x + player.facing.x * player.attackRange,
      0, player.pos.z + player.facing.z * player.attackRange);
  } else {
    // normal free cursor: the aim point is exactly where the mouse hits the
    // ground, and the player simply faces it (no clamping). The plane rides
    // at the PLAYER's height — critical in lair dungeons (floor at y=-60),
    // where a fixed y=0 plane sits behind the camera and aiming froze.
    groundPlane.constant = -(player.y ?? 0);
    raycaster.setFromCamera(new THREE.Vector2(input.mouse.x, input.mouse.y), camera);
    raycaster.ray.intersectPlane(groundPlane, aimPoint);
  }

  // aim marker matches the REAL attack: melee is a forward chop now, so it
  // shows a slim ground-hugging blade line out to the weapon's reach (no more
  // circular wedge). Bows keep a narrow slice at their (huge) range circle.
  const dx = aimPoint.x - player.pos.x, dz = aimPoint.z - player.pos.z;
  const range = player.attackRange;
  const bow = player.weapon.kind === 'bow';
  const halfAngle = bow ? 0.22 : 0.09;
  const thickness = bow ? 0.35 : Math.max(0.6, range - 0.55);
  aimArc.visible = true;
  updateAimArc(aimArc, player.pos.x, player.pos.z, Math.atan2(dx, dz),
    range, halfAngle, thickness, (x, z) => world.heightAt(x, z));
  aimArc.material.color.setHex(bow ? 0x9fd8ff : 0xffe9a8);
  // melee: depth-test ON so the marker never shines THROUGH the player's own
  // body; the bow's distant slice keeps rendering over rises in the terrain
  aimArc.material.depthTest = !bow;
  aimArc.renderOrder = bow ? 10 : 0;
}

// ---------- biome / atmosphere transitions ----------
const fogColor = new THREE.Color(BIOMES[0].fog);
const skyColor = new THREE.Color(BIOMES[0].sky);

const caveFog = new THREE.Color(0x0c0f0a);

// biomes with teeth announce their hazard the first time you step in
const BIOME_HAZARD_NOTES = {
  'Murky Swamp': '🛶 Deep black water everywhere — without a boat the swamp will not let you through.',
  'Haunted Forest': '☠️ Zombie claws fester: their hits poison you for a few seconds.',
  'Frozen Peak': '❄️ The cold gnaws at you — keep moving, warm up at bonfires (a torch helps too).',
};
let envSpeedMult = 1;
let biomeLightK = 1; // smoothed per-biome light dimming factor
let atmoCaveK = 0;   // how deep in the home cave we are (sky dome fades out)

// per-biome music: the big hour-long tracks stream lazily on first entry
const BIOME_MUSIC = [
  'biome_verdant',     // 0 Verdant Forest — Elwynn-style forest theme (15-min loop)
  'biome_desert',      // 1 Scorched Desert
  'biome_jungle',      // 2 Jungle
  'biome_swamp',       // 3 Murky Swamp
  'biome_darkforest',  // 4 Dark Forest
  'biome_darkforest',  // 5 Haunted Forest
  'biome_highlands',   // 6 Highlands
  'level3',            // 7 Frozen Peak
];

// living soundscape: each biome breathes its own nature ambience loop, laid
// UNDER the music. Verdant sings with birds, the swamp croaks, the peaks howl.
const BIOME_AMBIENCE = [
  'verdant_birds',   // 0 Verdant — rich daytime birdsong & nature
  'wind_ambience',   // 1 Scorched Desert — hot whistling wind
  'forest_ambience', // 2 Jungle — dense birds & insects
  'swamp_ambience',  // 3 Murky Swamp — frogs & bubbling
  null,              // 4 Dark Forest — eerie hush (the gloom sells it)
  null,              // 5 Haunted Forest — dead silence
  'wind_ambience',   // 6 Highlands — open windswept moor
  'wind_ambience',   // 7 Frozen Peak — howling gale
];
let ambienceName = null;
function setAmbience(name) {
  // leaving the world (name === null on death / menu / win) silences every
  // ambient layer, including the crickets and the torch flame
  if (name === null) { setNightAmbience(false); audio.loopStop('torch_loop'); }
  if (name === ambienceName) return;
  if (ambienceName) audio.loopStop(ambienceName);
  ambienceName = name;
  if (name) audio.loopStart(name, 0.32);
}
// a second, independent ambience layer for the evening crickets
let nightAmbienceOn = false;
function setNightAmbience(on) {
  if (on === nightAmbienceOn) return;
  nightAmbienceOn = on;
  if (on) audio.loopStart('night_crickets', 0.28);
  else audio.loopStop('night_crickets');
}

// ---------- waypoint compass: an arrow pointing to the map flag ----------
// A flat yellow arrow also lies on the ground under the player, pointing the
// way — so you never have to glance up at the minimap to stay on course.
let wpGroundArrow = null;
function ensureWpGroundArrow() {
  if (wpGroundArrow) return wpGroundArrow;
  const v = new Float32Array([
    -0.16, 0, -0.9,   0.16, 0, -0.9,   0.16, 0, 0.25,  -0.16, 0, 0.25, // shaft quad
    -0.5, 0, 0.25,    0.5, 0, 0.25,    0.0, 0, 1.15,                    // head triangle
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(v, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6]);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    color: 0xffd21a, transparent: true, opacity: 0.92,
    side: THREE.DoubleSide, depthWrite: false,
  }));
  m.scale.setScalar(1.35);
  m.renderOrder = 5;
  m.visible = false;
  scene.add(m);
  return (wpGroundArrow = m);
}
function hideWpGroundArrow() { if (wpGroundArrow) wpGroundArrow.visible = false; }

function updateWaypoint() {
  const arrow = $id('waypoint-arrow');
  const wp = minimap.waypoint;
  if (!wp || game.mode !== 'play') { arrow.classList.add('hidden'); hideWpGroundArrow(); return; }
  const dx = wp.x - player.pos.x, dz = wp.z - player.pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 6) { // arrived — retire the flag
    minimap.waypoint = null; minimap.redrawT = 0;
    arrow.classList.add('hidden');
    hideWpGroundArrow();
    ui.toast('📍 Waypoint reached.', '');
    return;
  }
  // ground arrow: a couple of steps ahead of the player's feet, facing the flag
  const ga = ensureWpGroundArrow();
  const nx = dx / dist, nz = dz / dist;
  const gx = player.pos.x + nx * 0.7, gz = player.pos.z + nz * 0.7;
  ga.position.set(gx, world.heightAt(gx, gz) + 0.08, gz);
  ga.rotation.y = Math.atan2(dx, dz);
  ga.visible = true;
  arrow.classList.remove('hidden');
  arrow.querySelector('.wp-dist').textContent = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
}

// ---------- day / night cycle ----------
// game.tod runs 0..1 over one in-game day. One in-game HOUR = one real
// minute, so a full day is 24 real minutes. The day opens at 08:00. Night is
// 23:00-05:00; nightK is a smooth 0 (day) .. 1 (deep night).
const DAY_LENGTH = 24 * 60; // 24 real minutes per day (1 game hour = 1 real minute)
const START_TOD = 8 / 24;   // the game opens at 08:00
const nightFlies = [];
let fireflyGeo = null, fireflyMat = null, starField = null;

// ---- the sun's path, and the darkness that FOLLOWS from it ----
// The sun rises in the east at SUNRISE, peaks at SUN_PEAK° over noon, sets in
// the west at SUNSET and then keeps travelling BELOW the horizon until it
// comes back round. One continuous angle, so elevation genuinely goes negative
// at night — the old arc floored at 14° and simply parked there, which meant
// the sun disc hung in the night sky and a real sunset never happened at all.
const SUNRISE = 5, SUNSET = 21, SUN_PEAK = 75;
// 0..1 from sunrise to sunset, then 1..2 on through the night
function solarPhase(h) {
  if (h >= SUNRISE && h < SUNSET) return (h - SUNRISE) / (SUNSET - SUNRISE);
  const nh = h < SUNRISE ? h + 24 : h;
  return 1 + (nh - SUNSET) / (24 - SUNSET + SUNRISE);
}
const sunElevAt = h => SUN_PEAK * Math.sin(Math.PI * solarPhase(h));
const smooth01 = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

// Darkness is derived from the SUN, never from its own hour table: full day
// while it is well up, twilight as it sinks through the horizon, full night
// once it is properly under. (The old table declared 22:00 "night" while the
// sun still stood 24° high — stars over a lit sky, and no sunset in between.)
const TWILIGHT_TOP = 8, TWILIGHT_BOTTOM = -10; // degrees of elevation
const nightAtHour = h => smooth01(
  (TWILIGHT_TOP - sunElevAt(h)) / (TWILIGHT_TOP - TWILIGHT_BOTTOM));

function tickDayNight(dt) {
  // co-op: derive the clock from the shared room epoch so both players see
  // the exact same time of day, no messages needed
  if (mp?.active && mp.mode === 'coop' && mp.meta?.created) {
    game.tod = (START_TOD + (Date.now() - mp.meta.created) / 1000 / DAY_LENGTH) % 1;
  } else if (!game.devTimeLock) {
    // devTimeScale is 1 for everyone but ?devmode, where the panel can freeze
    // the clock or run the day in fast-forward. Co-op keeps the shared epoch
    // above, so neither knob can desync a room.
    game.tod = (game.tod + dt * game.devTimeScale / DAY_LENGTH) % 1;
  }
  game.nightK = nightAtHour(game.tod * 24);
  if (enemyMgr) enemyMgr.nightK = game.nightK;
  world.nightK = game.nightK;   // the great fires blaze brighter after dark
  devTimeSync?.();

  // HUD clock: a sun that sets into a moon
  const clock = $id('tod-clock');
  if (clock) {
    const icon = game.nightK > 0.75 ? '🌙' : game.nightK > 0.45 ? '🌆' : game.nightK > 0.2 ? '🌤️' : '☀️';
    const hh = Math.floor(game.tod * 24); // tod 0 = 00:00 (midnight), 0.5 = 12:00 (noon)
    clock.textContent = `${icon} ${String(hh).padStart(2, '0')}:00`;
  }

  // screen darkening — never underground: the dungeon does its own gloom, and
  // a DOM overlay would flatten the torchlight into darkness
  // The DOM overlay is the fallback for the no-postfx path. When the post
  // stack runs, night is applied inside the composite instead (before bloom),
  // so fires can still blaze — a CSS multiply over the finished frame crushed
  // them to ~45% grey no matter how hot they were.
  $id('night-tint').style.opacity = (game.dungeon || _postNightActive)
    ? '0' : (game.nightK * 0.6).toFixed(2);

  // stars fade in on the night sky (a static field parked on the camera)
  if (!starField) {
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // scatter over the upper dome, well beyond the world but inside camera.far
      const a = Math.random() * Math.PI * 2, el = Math.random() * 0.9 + 0.08, r = 95;
      pos[i*3] = Math.cos(a) * Math.cos(el) * r;
      pos[i*3+1] = Math.sin(el) * r;
      pos[i*3+2] = Math.sin(a) * Math.cos(el) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starField = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xfdfbef, size: 1.6, sizeAttenuation: false,
      transparent: true, opacity: 0, depthWrite: false, fog: false }));
    starField.frustumCulled = false;
    scene.add(starField);
  }
  starField.material.opacity = Math.max(0, (game.nightK - 0.25) / 0.75); // appear as dusk deepens
  starField.visible = starField.material.opacity > 0.01;
  if (starField.visible) {
    starField.position.copy(camera.position);
    starField.rotation.y += dt * 0.006; // a slow celestial drift
  }

  // fireflies drift around the player once it's dark enough
  if (!fireflyGeo) {
    fireflyGeo = new THREE.SphereGeometry(0.05, 5, 4);
    fireflyMat = new THREE.MeshBasicMaterial({ color: 0xc9ff7f });
  }
  const wantFlies = game.nightK > 0.35 && game.mode === 'play' ? Math.round(game.nightK * 14) : 0;
  while (nightFlies.length < wantFlies) {
    const m = new THREE.Mesh(fireflyGeo, fireflyMat);
    nightFlies.push({ mesh: m, a: Math.random() * 6.28, r: 4 + Math.random() * 9, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5 });
    scene.add(m);
  }
  while (nightFlies.length > wantFlies) { const f = nightFlies.pop(); scene.remove(f.mesh); }
  for (const f of nightFlies) {
    f.a += f.sp * dt * 0.3;
    const x = player.pos.x + Math.cos(f.a) * f.r;
    const z = player.pos.z + Math.sin(f.a) * f.r;
    f.mesh.position.set(x, world.heightAt(x, z) + 1 + Math.sin(game.time * 2 + f.ph) * 0.5, z);
    f.mesh.visible = Math.sin(game.time * 3 + f.ph) > -0.3; // gentle blink
  }
}

// entering a biome spreads a RUMOR of its named boss: the lair's surroundings
// are revealed on the map so the red skull badge is findable, once per lair
function hintLair(idx) {
  const poi = world.pois?.find(p => p.type === 'lair' && p.ring === idx && !p.claimed);
  if (!poi || poi.rumored) return;
  poi.rumored = true;
  // a rumor is just words — the lair only appears on the map once you have
  // actually walked its ground and discovered it yourself
  const lair = BIOME_LAIRS[idx];
  if (lair) ui.toast(`💀 Rumors speak of ${lair.name} lurking somewhere in this land…`, 'boss');
}

function updateAtmosphere(dt) {
  // inside a lair dungeon: tight themed fog, deep gloom, cave echo — and none
  // of the overworld's biome logic
  if (game.dungeon) {
    const fogC = game.dungeon.lair.theme?.fog ?? 0x0b0d10;
    scene.fog.color.set(fogC);
    scene.background.set(fogC);
    scene.fog.near = 18;
    scene.fog.far = 82;   // pulled back so the torch-lit room reads clearly
    syncFarToFog();
    hemi.intensity = 0.34; // a faint base so you're never fully blind…
    sun.intensity = 0.16;  // …the torch does the real lighting on top
    $id('biome-gloom').style.opacity = 0.22; // a soft edge vignette only
    setAmbience('cave_ambience');
    envSpeedMult = 1;
    return;
  }
  const idx = biomeIndexAt(player.pos.x, player.pos.z);
  if (idx !== game.biomeIndex) {
    game.biomeIndex = idx;
    const biome = BIOMES[idx];
    ui.banner(`— ${biome.name} —`);
    audio.sfx('lane_unlock', 0.5);
    audio.playMusic(BIOME_MUSIC[idx] ?? 'level3');
    const note = BIOME_HAZARD_NOTES[biome.name];
    if (note) ui.toast(note, 'boss');
    if (game.kind === 'survival') hintLair(idx);
  }
  // ambience: the cave near home overrides the biome; open water laps under it
  const rHome = Math.hypot(player.pos.x, player.pos.z);
  const onWater = world.isWater?.(player.pos.x, player.pos.z);
  const night = (game.nightK || 0) > 0.6;
  let amb = rHome < 34 ? 'cave_ambience'
    : onWater ? 'water_lapping'
    : BIOME_AMBIENCE[game.biomeIndex] ?? null;
  // birdsong is a DAYTIME sound — at night the outdoor crickets carry it
  if (night && (game.biomeIndex === 0 || game.biomeIndex === 6)) amb = null;
  setAmbience(amb);
  // night crickets: a separate outdoor overlay layered under everything,
  // never underground and never at home in the cave
  setNightAmbience(!game.dungeon && night && rHome >= 34);
  envSpeedMult = world.swampZone?.(player.pos.x, player.pos.z) === 'mud' ? 0.78 : 1;
  $id('biome-gloom').style.opacity = BIOMES[game.biomeIndex].darkness ?? 0;
  envSpeedMult *= Math.min(
    enemyMgr?.webSlowAt?.(player.pos.x, player.pos.z) ?? 1,
    world.webSlowAt?.(player.pos.x, player.pos.z) ?? 1);
  // thick wool socks (legs slot): mud and webs only bite half as hard
  if (player.mudguard < 1) envSpeedMult = 1 - (1 - envSpeedMult) * player.mudguard;
  // Frozen Peak chill: stiff, frozen legs move up to 30% slower
  envSpeedMult *= 1 - 0.3 * coldK;
  const biome = BIOMES[game.biomeIndex];

  // home is a fenced yard under open sky now, not a cave — no darkening
  const r = radiusOf(player.pos.x, player.pos.z);
  const caveK = 0;
  atmoCaveK = caveK;
  // gloomy biomes (Dark Forest, Haunted Forest, swamp) dim the world lights
  // themselves — the screen overlay alone left the geometry too bright
  biomeLightK += (Math.min(1, biome.light ?? 1) - biomeLightK) * Math.min(1, dt * 1.5);
  const nightK = game.nightK || 0;
  // night bites harder now: the world's own lights drop close to nothing after
  // dark (hemi ~0.10, sun ~0.11 at deep night) so a held torch's real point
  // light is what actually carves out the visible bubble — night without a
  // torch is genuinely gloomy. (We darken the LIGHTS, not the screen overlay,
  // which would flatten the torchlight too.)
  hemi.intensity = (0.74 - 0.5 * caveK) * biomeLightK * (1 - 0.86 * nightK);
  // the directional sun switches off as it crosses the horizon — below it
  // there is no sunlight, only the hemisphere's moonlit base
  const sunElev = Math.asin(Math.max(-1, Math.min(1, _sunDir.y))) * 180 / Math.PI;
  // fades across the ~4° around the horizon, like the disc sinking into it —
  // the sun must still rake warm light over the land AT sunset, not switch off
  // a degree early (that left the golden hour lit by nothing but ambient)
  const above = Math.max(0, Math.min(1, (sunElev + 2) / 4));
  sun.intensity = 1.8 * (1 - 0.8 * caveK) * biomeLightK * (1 - 0.94 * nightK) * above;
  // GOLDEN HOUR, driven purely by how low the sun hangs: neutral warm-white
  // high up, deepening through amber to a proper sunset orange as it touches
  // the horizon. NOT gated by nightK any more — the old `* (1 - nightK)`
  // cancelled the warmth exactly when the sun sat lowest, so the light never
  // actually went gold (it peaked at a dingy off-white and faded to silver).
  // The sky dome's disc, its cloud lining and the god rays all read this color.
  const warm = smooth01((GOLDEN_TOP - sunElev) / GOLDEN_TOP);
  sun.color.copy(SUN_DAY).lerp(SUN_LOW, warm);
  // afterglow weight for the AIR (fog + sky): peaks across the golden hour and
  // dies once the sun is well under, so the warm band fades instead of being
  // dragged through the night
  const glowK = warm * Math.max(0, Math.min(1, (sunElev + 8) / 10));
  // the camera sits ~30 m away — keep the fog behind the hero so the cave
  // interior stays dimly visible while the outside world is swallowed.
  // RPG view looks along the ground, so it gets a much deeper fog wall —
  // the far-LOD chunk tier (world.farRadius) fills the land out to it.
  const fogK = (FOG_SCALE[settings.drawDist ?? 'normal'] ?? 1)
    * (autoQuality.stage >= 3 ? 0.75 : 1);
  // with distant terrain OFF the land still ends at viewRadius, so the fog
  // wall pulls in to hide the edge (the pre-far-LOD look, cheapest)
  const farLod = settings.farTerrain !== false;
  const baseNear = game.rpgView ? 46 : 35;
  const baseFar = game.rpgView ? (farLod ? 205 : 150) : (farLod ? 115 : 110);
  let fogNear = (baseNear - 16 * caveK) * fogK;
  let fogFar = (baseFar - (baseFar - 50) * caveK) * fogK;
  if (!farLod) fogFar = Math.min(fogFar, 150);
  // gloomy biomes CAP the fog wall in absolute meters (Dark Forest ~90,
  // Haunted ~42 — darkness ahead, whatever the draw-distance setting says);
  // smoothed so crossing the border closes the dark in over a few seconds
  _fogCap += ((biome.fogCap ?? 999) - _fogCap) * Math.min(1, dt * 1.1);
  if (_fogCap < fogFar) {
    fogFar = _fogCap;
    fogNear = Math.min(fogNear, _fogCap * 0.3);
  }
  world.farRadius = (game.kind === 'survival' && farLod)
    ? Math.min(14, Math.ceil((fogFar * 1.05) / 40) + 1)
    : 0; // MOBA / arena maps are small and walled — no far tier
  // storms are VOLUMETRIC (particles + air tint + gale-force foliage wind in
  // tickStormFx) — the fog wall stays where it is, per feedback: shrinking
  // the draw distance read as fake
  scene.fog.near = fogNear;
  scene.fog.far = fogFar;
  syncFarToFog(); // the camera stops rendering what the fog already hides

  // caveK already fades smoothly with distance, so apply it directly; the
  // slow time-lerp is only for biome-to-biome transitions out in the open.
  // Gloomy biomes (fogCap) barely take the night tint — their air is already
  // BLACKER than the navy night fog, and lerping toward it LIGHTENED them.
  const nightBlend = biome.fogCap ? nightK * 0.15 : nightK;
  // SUNSET first, then night. The warm band across the horizon haze (and the
  // pink-violet wash above it) is what actually reads as a sunset — sun colour
  // alone barely registers when most of the frame is ground and trees. Applied
  // BEFORE the night lerp so the gold gets swallowed by the dark as it should.
  // Then pull the fog wall + horizon almost fully into the night colors, or the
  // distant mist stays lighter than the dark ground and glows on the horizon.
  const fogTarget = _atmoA.set(biome.fog)
    .lerp(SUNSET_FOG, glowK * 0.75)
    .lerp(NIGHT_FOG, nightBlend * 0.94).lerp(caveFog, caveK);
  const skyTarget = _atmoB.set(biome.sky)
    .lerp(SUNSET_SKY, glowK * 0.62)
    .lerp(NIGHT_SKY, nightBlend * 0.94).lerp(caveFog, caveK);
  if (blizzard.k > 0.01 && blizzard.spec?.fogC) {
    // the storm colors the AIR (white blizzard, ochre sand wall…) without
    // moving the fog wall — distant terrain drowns in the storm's hue
    fogTarget.lerp(_stormC.set(blizzard.spec.fogC), blizzard.k * 0.75);
    skyTarget.lerp(_stormC, blizzard.k * 0.75);
  }
  if (caveK > 0.01) {
    fogColor.copy(fogTarget);
    skyColor.copy(skyTarget);
  } else {
    fogColor.lerp(fogTarget, Math.min(1, dt * 1.5));
    skyColor.lerp(skyTarget, Math.min(1, dt * 1.5));
  }
  scene.fog.color.copy(fogColor);
  scene.background.copy(skyColor);
}

// draw-distance option scales the fog wall; the camera far plane then hugs
// the fog (plus a small margin) so nothing invisible is ever drawn or
// shadow-cast — in RPG view this culls ~2/3 of the old frustum
const FOG_SCALE = { short: 0.72, normal: 1, far: 1.6, furthest: 2.4 };
const NIGHT_SKY = new THREE.Color(0x070c22), NIGHT_FOG = new THREE.Color(0x0d1226);
// sunset palette: warm haze along the horizon, pink-violet in the sky above it
const SUNSET_FOG = new THREE.Color(0xe08c4a), SUNSET_SKY = new THREE.Color(0x9c5f80);
// sun light colour, in LINEAR working space (as setRGB always was here):
// neutral warm-white high up → deep sunset orange at the horizon. GOLDEN_TOP
// is the elevation where the warming starts.
const GOLDEN_TOP = 30;
const SUN_DAY = new THREE.Color(1.0, 0.97, 0.92);
const SUN_LOW = new THREE.Color(1.0, 0.38, 0.13);
const _atmoA = new THREE.Color(), _atmoB = new THREE.Color();
const _stormC = new THREE.Color();
let _fogCap = 999; // smoothed per-biome fog ceiling (Dark/Haunted close in)
function syncFarToFog() {
  if (game.editorView) return; // the god view manages its own far plane
  const want = scene.fog.far * 1.22 + 14;
  if (Math.abs(camera.far - want) > 2) {
    camera.far = want;
    camera.updateProjectionMatrix();
  }
}

// ---------- camera ----------
// Screen shake: every impact feeds it. `shakeT` is how long the tremble lasts
// and `shakeAmp` how hard it hits — repeated calls take the strongest of each,
// so a flurry of blows reads as one sustained rumble instead of restarting.
let shakeT = 0, shakeAmp = 0, shakeDur = 0.35;
function shakeCamera(dur = 0.2, amp = 0.5) {
  if (game.editorView) return;
  shakeT = Math.max(shakeT, dur);
  shakeDur = Math.max(shakeDur, dur);
  shakeAmp = Math.max(shakeAmp, amp);
}
// switching view modes retunes the whole render pipeline: the third-person
// camera needs to SEE further (fog, far plane, more chunks) but the wider
// fov + fog wall keep the draw load in check
// free mouse-look: clicking the world (with no panel open) locks the pointer
renderer.domElement.addEventListener('click', () => {
  if (pendingAbility) { confirmAbilityPlacement(); return; }
  if (pendingCampItem) { confirmCampItemPlacement(); return; }
  if (pendingNest) { confirmNestPlacement(); return; }
  if (game.rpgView && settings.mouseLook && game.mode === 'play'
      && !panels.openSet.size && !document.pointerLockElement) {
    renderer.domElement.requestPointerLock?.();
  }
});

function applyViewMode() {
  const rpg = !!settings.rpgView;
  game.rpgView = rpg;
  input.rpgMode = rpg;
  // controls that only apply to ONE camera mode are hidden in the other:
  // free mouse-look is RPG-only; mouse-directed movement and auto-rotate are
  // top-down-only (they don't do anything meaningful behind-the-shoulder).
  document.querySelectorAll('.rpg-only').forEach(el => el.classList.toggle('hidden', !rpg));
  document.querySelectorAll('.topdown-only').forEach(el => el.classList.toggle('hidden', rpg));
  // initial values only — updateAtmosphere recomputes fog (and the far-LOD
  // radius that goes with it) every frame from the same base numbers
  scene.fog.near = rpg ? 46 : 35;
  scene.fog.far = rpg ? (autoQuality.stage >= 3 ? 154 : 205) : (autoQuality.stage >= 3 ? 90 : 115);
  camera.far = rpg ? 340 : 300;
  camera.fov = rpg ? 60 : 50;
  camera.updateProjectionMatrix();
  world.viewRadius = autoQuality.stage >= 3 ? (rpg ? 3 : 2) : (rpg ? 4 : 3);
}

// graphics options: bloom pipeline, ground detail, shadow res, tone mapping
function applyGraphics() {
  world.groundDetail = settings.texDetail ?? 0;
  world.treeDetail = TREE_DETAIL[settings.treeDetail ?? 'low'] ?? 0;
  world.qualityVeg = !!settings.vegQuality && vegKit.ready();
  world.vegDrawDist = VEG_DRAW_DIST[settings.vegDist ?? 'furthest'] ?? Infinity;
  // shadows: purely the user's toggle now (auto-downgrade removed, so the
  // stage < 2 guard is always true — kept only so the expression is explicit)
  const shadowsOn = settings.shadows !== false && autoQuality.stage < 2;
  if (renderer.shadowMap.enabled !== shadowsOn) {
    renderer.shadowMap.enabled = shadowsOn;
    sun.castShadow = shadowsOn;
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  // render resolution
  const pr = settings.resScale === '1' ? 1
    : settings.resScale === '1.5' ? Math.min(window.devicePixelRatio, 1.5)
    : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  // the post stack is needed for bloom, ambient occlusion or god rays
  if ((settings.bloom || settings.ssao || settings.rays) && !postfx) {
    postfx = new PostFX(renderer);
  }
  // Keep the post targets matched to the canvas backing store. setPixelRatio
  // above resizes the drawing buffer, and this used to run ONLY when the stack
  // was first created — so after a resolution change the whole post path kept
  // rendering at the old size (the new setting appeared to do nothing).
  postfx?.setSize(renderer.domElement.width, renderer.domElement.height);
  // shadow DISTANCE: how far the sun's shadow frustum reaches around the
  // player (High casts shadows across ~270 m). Bigger area → bigger map so
  // it doesn't go blurry, hence "heavier".
  const sd = SHADOW_DIST[settings.shadowDist ?? 'low'] ?? SHADOW_DIST.low;
  _shadowB = sd.b;
  if (sun.shadow.camera.right !== sd.b) {
    sun.shadow.camera.left = -sd.b; sun.shadow.camera.right = sd.b;
    sun.shadow.camera.top = sd.b; sun.shadow.camera.bottom = -sd.b;
    // sun sits at b*2 from the player; the frustum must reach the far edge
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = sd.b * 3.4;
    sun.shadow.camera.updateProjectionMatrix();
  }
  if (sun.shadow.mapSize.x !== sd.s) {
    sun.shadow.mapSize.set(sd.s, sd.s);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  // tone mapping: filmic (ACES) if the player picked it, otherwise the raw look
  renderer.toneMapping = settings.filmic ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = settings.filmic ? 1.12 : 1;
  // vivid grading: a free GPU-composited CSS filter on the canvas. It is the SAME
  // whether or not the post path runs, so toggling AO doesn't cause an incidental
  // brightness/contrast jump — you see ONLY the AO effect. (AO is localized by
  // the SSAO above-plane guard, so a mild global contrast here doesn't crush it.)
  renderer.domElement.style.filter = settings.vivid === false
    ? '' : 'contrast(1.06) brightness(1.03)';
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
}

const camSmooth = new THREE.Vector3();
let camInit = false;
let rpgPitch = 0.34; // radians above the horizontal; negative looks UP
let rpgDist = 8.6;   // wheel-zoomed camera distance
let _camZoomK = 1;   // top-down rig scale (pulled IN on landscape phones)

// ---- auto camera rotate (Settings): hold ONE direction for 5 s and the
// camera turns so that direction reads as "up" (top-down: an orbit yaw that
// the minimap mirrors; RPG: a 180° spin when you back up on S) ----
let camYaw = 0;          // top-down orbit angle; 0 = the classic north-up view
let camYawTarget = 0;
let topHoldDir = null;   // direction held in top-down mode + for how long
let topHoldT = 0;
let rpgHoldT = 0;        // how long S has been backing the character up
let rpgFlip = 0;         // remaining radians of the RPG auto-180° turn
let rpgFlipArmed = true; // S must be released before another auto-flip

function trackAutoRotate(dt) {
  if (!settings.autoRotate || game.mode !== 'play' || game.paused || player.dead) {
    topHoldDir = null; topHoldT = 0; rpgHoldT = 0;
    if (!settings.autoRotate) camYawTarget = 0;
    return;
  }
  if (game.rpgView) {
    topHoldDir = null; topHoldT = 0;
    camYawTarget = 0; // top-down yaw resets while RPG drives the camera
    if (input.moveZ > 0 && input.moveX === 0) { // pure backing up on S
      rpgHoldT += dt;
      if (rpgHoldT >= 5 && rpgFlipArmed && rpgFlip <= 0) {
        rpgFlip = Math.PI;
        rpgFlipArmed = false;
      }
    } else { rpgHoldT = 0; rpgFlipArmed = true; }
  } else {
    rpgHoldT = 0; rpgFlipArmed = true; rpgFlip = 0;
    const d = player.moveDir; // world-space walk direction (all control modes)
    if (!d) { topHoldDir = null; topHoldT = 0; return; }
    if (topHoldDir && d.x * topHoldDir.x + d.z * topHoldDir.z > 0.94) {
      topHoldT += dt; // still the same direction (within ~20°)
      if (topHoldT >= 5) camYawTarget = Math.atan2(-d.x, -d.z);
    } else { topHoldDir = { x: d.x, z: d.z }; topHoldT = 0; }
  }
}

function updateCamera(dt = 0) {
  if (game.editorView) { input.takeWheel(); return; } // the editor owns the camera
  trackAutoRotate(dt);
  const py = player.mesh.position.y;
  let sx = 0, sz = 0, sy = 0;
  if (shakeT > 0) {
    shakeT -= dt;
    const k = Math.min(1, shakeT / Math.max(0.001, shakeDur)) * shakeAmp;
    sx = (Math.random() - 0.5) * k;
    sz = (Math.random() - 0.5) * k;
    sy = (Math.random() - 0.5) * k * 0.6;
    if (shakeT <= 0) { shakeAmp = 0; shakeDur = 0.35; }
  }
  if (game.rpgView) {
    // MMORPG chase camera: right-drag steers the character AND tilts the
    // camera up/down; the wheel zooms; it never dips under the terrain
    const drag = input.takeDrag();
    if (drag.x && !player.dead) {
      const yaw = Math.atan2(player.facing.x, player.facing.z) - drag.x * 0.0045;
      player.facing.set(Math.sin(yaw), 0, Math.cos(yaw));
    }
    // auto camera rotate: smoothly spin the character (and so the chase
    // camera) 180° after 5 s of backing up on S
    if (rpgFlip > 0 && !player.dead) {
      const step = Math.min(rpgFlip, 3.2 * dt);
      rpgFlip -= step;
      const yaw = Math.atan2(player.facing.x, player.facing.z) + step;
      player.facing.set(Math.sin(yaw), 0, Math.cos(yaw));
    }
    rpgPitch = Math.max(-0.5, Math.min(1.25, rpgPitch + drag.y * 0.004));
    rpgDist = Math.max(3.5, Math.min(15, rpgDist + input.takeWheel() * 0.9));
    const flat = Math.cos(rpgPitch) * rpgDist;
    const tx = player.pos.x - player.facing.x * flat;
    const tz = player.pos.z - player.facing.z * flat;
    const groundY = world.heightAt(tx, tz);
    const ty = Math.max(py + 1.7 + Math.sin(rpgPitch) * rpgDist, groundY + 1.2);
    if (!camInit) { camSmooth.set(tx, ty, tz); camInit = true; }
    camSmooth.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * 8));
    camera.position.set(camSmooth.x + sx, camSmooth.y + sy, camSmooth.z + sz);
    camera.lookAt(player.pos.x + player.facing.x * 2, py + 1.7, player.pos.z + player.facing.z * 2);
  } else {
    camInit = false;
    // ease the orbit yaw toward its target the short way around; at yaw 0
    // this is exactly the classic fixed top-down camera
    const diff = camYawTarget - camYaw;
    camYaw += Math.atan2(Math.sin(diff), Math.cos(diff)) * Math.min(1, dt * 3);
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    // landscape phones are wide but short, so the fixed rig reads as
    // zoomed-OUT — pull the camera in (lower + closer, same tilt)
    const landscapePhone = game.touch && window.innerWidth > window.innerHeight
      && window.innerHeight < 560;
    _camZoomK += ((landscapePhone ? 0.64 : 1) - _camZoomK) * Math.min(1, dt * 6);
    const H = 26 * _camZoomK, OFF = 14 * _camZoomK;
    camera.position.set(player.pos.x + fx * OFF + sx, py + H + sy, player.pos.z + fz * OFF + sz);
    camera.lookAt(player.pos.x - fx * 2, py, player.pos.z - fz * 2);
  }
  // time-driven sun: rises in the east (+x) at 05:00, arcs through the
  // southern sky, SETS in the west at 21:00 and travels on beneath the horizon
  // through the night (solarPhase runs 0..1 over the day, 1..2 over the night).
  // Noon sun stands nearly overhead (short, tucked-in shadows); evening sun
  // hangs low, so shadows stretch long and dramatic toward sunset. The same
  // _sunDir feeds the sky dome's disc and the water glints — always in step.
  const h24 = (game.tod ?? START_TOD) * 24;
  const sp = solarPhase(h24);
  const elev = SUN_PEAK * Math.sin(Math.PI * sp) * (Math.PI / 180); // ±75°
  const az = Math.PI * sp; // east → south → west, then on under the horizon
  _sunDir.set(
    Math.cos(elev) * Math.cos(az),
    Math.sin(elev),
    Math.cos(elev) * Math.sin(az));
  // stand-off scales with the shadow distance so the whole ortho frustum
  // stays inside near/far. The light's HEIGHT is floored just above ground:
  // once the sun is down its intensity is zero anyway, and a light placed
  // below the terrain would throw the shadow frustum upside down.
  const sdist = Math.max(35, _shadowB * 2);
  sun.position.set(
    player.pos.x + _sunDir.x * sdist,
    Math.max(0.12, _sunDir.y) * sdist,
    player.pos.z + _sunDir.z * sdist);
  sun.target.position.set(player.pos.x, 0, player.pos.z);
}

// force the HUD (hp/xp/etc.) to redraw right now — needed when the player
// acts while a panel is open (the sim, and its per-frame HUD update, is paused)
function refreshHud() {
  if (game.mode !== 'play' || game.kind !== 'survival') return;
  const progress = progressAt(player.pos.x, player.pos.z);
  ui.updateHUD(player, progress, BIOMES[game.biomeIndex].name);
}

// ---------- main loop ----------
const clock = new THREE.Clock();

let _lastFrameMs = 0;
function tick(nowMs) {
  requestAnimationFrame(tick);
  // optional FPS cap: skip this rAF frame if it arrived too soon. The 1 ms
  // slack keeps us from perpetually landing just under the interval on
  // displays whose refresh doesn't divide the target evenly.
  if (fpsFrameCap > 0 && nowMs) {
    if (nowMs - _lastFrameMs < 1000 / fpsFrameCap - 1) return;
    _lastFrameMs = nowMs;
  }
  step();
}

// One simulation step. Normally driven by rAF; in multiplayer a Web-Worker
// clock keeps stepping while the tab is HIDDEN (rAF pauses there, which froze
// the shared world for the partner — enemies, snapshots, everything).
function step() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!document.hidden) autoQuality.tick(dt);
  tickAutosave(dt); // co-op single-slot autosave (self-gates on eligibility)

  // foliage wind + player-trample shader uniforms (shared by every baked
  // mesh; wrapping the clock keeps sin() precise on mobile GPUs — the
  // once-per-15-min phase jump is invisible)
  _windT = (_windT + dt) % 900;
  // track the player's smoothed walk direction — the grass lays over the way
  // you move (fed to the shader as uPlayerVel) and every trail footfall
  // remembers the direction it was laid, so it rises back up cleanly
  if (game.mode === 'play' && !game.paused) {
    const mvx = player.pos.x - _folLastPos.x, mvz = player.pos.z - _folLastPos.z;
    const moved = Math.hypot(mvx, mvz);
    if (moved > 1e-4) {
      const k = Math.min(1, dt * 10);
      _folDir.x += (mvx / moved - _folDir.x) * k;
      _folDir.z += (mvz / moved - _folDir.z) * k;
    }
    // "am I moving?" ramps the lay-over strength up/down smoothly
    _folMoveK += ((moved / Math.max(dt, 0.001) > 0.6 ? 1 : 0) - _folMoveK) * Math.min(1, dt * 8);
    // drop a footfall every ~0.35 m, carrying the current walk direction
    const md = Math.hypot(player.pos.x - _folStepPos.x, player.pos.z - _folStepPos.z);
    if (md > 0.35) {
      const dl = Math.hypot(_folDir.x, _folDir.z) || 1;
      _folTrail[_folTrailIdx % 8] = {
        x: player.pos.x, z: player.pos.z, t: _windT, s: 1,
        dx: _folDir.x / dl, dz: _folDir.z / dl,
      };
      _folTrailIdx++;
      _folStepPos.x = player.pos.x; _folStepPos.z = player.pos.z;
    }
    _folLastPos.x = player.pos.x; _folLastPos.z = player.pos.z; // velocity ref
  } else {
    _folMoveK += (0 - _folMoveK) * Math.min(1, dt * 8);
    _folLastPos.x = player.pos.x; _folLastPos.z = player.pos.z;
  }
  const folShaders = BAKED_MAT.userData.shaders;
  if (folShaders.length) {
    const folOn = settings.foliageMove !== false ? 1 : 0;
    // storms whip the vegetation — wind amplitude surges with intensity
    const folWind = folOn * (1 + (blizzard.k ?? 0) * 2.2);
    const vl = Math.hypot(_folDir.x, _folDir.z) || 1;
    const vx = (_folDir.x / vl) * _folMoveK, vz = (_folDir.z / vl) * _folMoveK;
    for (const sh of folShaders) {
      sh.uniforms.uTime.value = _windT;
      sh.uniforms.uWind.value = folWind;
      sh.uniforms.uPush.value = folOn;
      sh.uniforms.uPlayer.value.set(player.pos.x, player.mesh.position.y, player.pos.z);
      sh.uniforms.uPlayerVel.value.set(vx, vz);
      const dst = sh.uniforms.uDist.value, ddir = sh.uniforms.uDistDir.value;
      for (let i = 0; i < 8; i++) {
        const p = _folTrail[i];
        if (p) { dst[i].set(p.x, p.z, p.t, p.s); ddir[i].set(p.dx, p.dz); }
      }
    }
  }
  // the full-screen blue "caustic net" overlay was removed — it read as an
  // ugly grid over the whole screen; keep the layer permanently off
  $id('underwater').classList.remove('on');
  // water surfaces (ocean/lakes/rivers) share the same clock + sun direction
  _waterSunDir.copy(_sunDir); // the live time-of-day sun (updateCamera drives it)
  if (WATER_SHADERS.length) {
    const waterFx = settings.waterFx !== false ? 1 : 0;
    for (const sh of WATER_SHADERS) {
      sh.uniforms.uTime.value = _windT;
      sh.uniforms.uSunDir.value.copy(_waterSunDir);
      sh.uniforms.uFx.value = waterFx;
    }
  }
  // sky dome: re-center on the camera (no parallax at any radius/zoom).
  // Horizon = scene.fog.color, zenith = scene.background — both are kept
  // current by updateAtmosphere in EVERY branch (overworld/dungeon/bigmap),
  // so the dome tracks biome/night/cave darkening for free and collapses to
  // a flat tint (no fake sky) wherever those two are already set equal.
  skyDome.position.copy(camera.position);
  skyDome.updateMatrix();
  const skyU = skyDome.material.uniforms;
  skyU.uHorizon.value.copy(scene.fog.color);
  skyU.uZenith.value.copy(scene.background);
  skyU.uSunDir.value.copy(_waterSunDir);
  skyU.uSunColor.value.copy(sun.color);
  skyU.uTime.value = _windT;
  // sun + clouds fade at night, in the home cave and underground (the dome
  // then collapses to the plain fog/sky gradient — no sun in a dungeon).
  // Gloomy biomes deliberately KEEP their sky — clouds glowing above a
  // pitch-dark tree line is the look.
  const dayK = game.dungeon ? 0 : (1 - (game.nightK || 0) * 0.92) * (1 - atmoCaveK);
  skyU.uDay.value = dayK;
  // the moon takes over as the sun goes under — never in a dungeon or the cave
  skyU.uMoon.value = (game.dungeon ? 0 : (game.nightK || 0)) * (1 - atmoCaveK);
  skyU.uCloudAmt.value = (game.dungeon || settings.clouds === false)
    ? 0 : 0.82 * (1 - atmoCaveK);

  // on-screen FPS meter (smoothed; refreshes the label ~5×/s)
  if (settings.showFps && dt > 0) {
    _fpsSmooth += (1 / dt - _fpsSmooth) * 0.1;
    _fpsMeterT += dt;
    if (_fpsMeterT >= 0.2) {
      _fpsMeterT = 0;
      const el = $id('fps-meter');
      if (el) el.textContent = `${Math.round(_fpsSmooth)} FPS`;
    }
  }

  if (game.mode === 'play' && !game.paused && !game.editorView) {
    game.time += dt;
    updateAim(dt);
    targeting.update(dt, { input, player, alive: combatMgr()?.alive?.() || [],
      players: (mp?.active && mp.mode === 'coop') ? mp.mapRemotes() : [] });
    updateSocialTarget();
    tickFollow();
    renderPartyFrames();
    updateNestGhost();
    updateCampItemGhost();
    updateAbilityGhost();
    const em = combatMgr(); // real mgr / co-op shadow / pvp arena / moba units
    // while a griffin carries you the flight drives your position — the
    // normal walk/attack simulation pauses until touchdown
    if (!(flight && flight.phase === 'ride') && !shipRiding()) player.update(dt, {
      input, world, enemyMgr: em, projectiles, pickups, aimPoint,
      arenaZone: mp?.active ? mp.arenaZone() : null,
      mobaBounds: game.kind === 'moba' ? MOBA.half : null,
      mouseMove: settings.mouseMove,
      boat: game.kind === 'survival' && boatMounted,
      boatMount: game.kind === 'survival' && boatMounted,
      boatPlacing: boatPlaceT > 0,
      rpgView: game.rpgView,
      mounted: player.mounted,
      onShip: shipRiding(), // riding the ferry over the sea isn't swimming
      mouseLook: game.rpgView && settings.mouseLook && !!input.locked,
      devFly: DEVMODE && !mp?.active && game.devFly && game.rpgView && !player.flying,
      devFlyPitch: rpgPitch,
      envSpeedMult,
    });

    // Solve the rigged avatar's skeleton — exactly once, here, AFTER _animate
    // has set this frame's pose. It used to hang off the skinned mesh's
    // onBeforeRender, which fires once per RENDER PASS: shadow map + postfx +
    // character preview meant 65 bones re-solved three times a frame. A box
    // body has no rig and this is a no-op.
    player.mesh.userData.rig?.update(dt);

    if (game.kind === 'moba') {
      if (mp?.active) {
        mp.updateWorldSim(dt);
        mp.update(dt);
      } else {
        moba.update(dt, [{ obj: player, team: 'player' }]);
        projectiles.update(dt, em, [player]);
        pickups.update(dt, [player]);
      }
      healAtMobaBase(dt);
      companions.update(dt, player, em, projectiles, world);
      world.update(dt, player.pos);
      mobaMini?.update(dt, player);
      const st = document.getElementById('mp-status');
      const line = panels.moba?.statusLine?.();
      if (line) { st.textContent = line; st.classList.remove('hidden'); }
      ui.updateHUD(player, 0, 'MOBA — destroy the enemy base', false);
    } else {
      updateHunterTraps(dt, em);
      if (mp?.active) {
        mp.updateWorldSim(dt);
        mp.update(dt);
      } else {
        const targets = combatTargets();
        enemyMgr.update(dt, targets, projectiles);
        projectiles.update(dt, enemyMgr, targets, arrowHitsHive);
        pickups.update(dt, [player]);
      }
      companions.update(dt, player, em, projectiles, world);
      if (!game.dungeon) camp?.update(dt, em, projectiles); // towers can't shoot through the floor
      world.update(dt, player.pos);
      regarrisonNearby(dt);
      // co-op: show the partner on the minimap too; in top-down view the
      // minimap turns together with the auto-rotated camera (RPG: north-up)
      minimap.rotation = game.rpgView ? Math.atan2(-player.facing.x, -player.facing.z) : camYaw;
      minimap.update(dt, player, em,
        mp?.active && mp.mode === 'coop' ? mp.mapRemotes() : null);
      tickDayNight(dt);
      updateAtmosphere(dt);
      updateWaypoint(dt);
      updatePings(dt);
      tickGhost();
      tickGhostFade(dt);
      tickTouchAction();
      // ?devmode debug handle (same pattern as window.audio) — lets a console
      // or an automated check drive death/ghost states without a real fight
      if (DEVMODE && !window.WOODS) {
        window.WOODS = { game, get player() { return player; }, get world() { return world; },
          get camp() { return camp; }, get ghost() { return ghost; },
          get enemyMgr() { return combatMgr(); },
          get targeting() { return targeting; },
          kill: () => { player.hp = 0; player.dead = true; player.killedBy = 'a test'; survivalRespawn(); },
          claimPoi: (poi) => markPoiClaimed(poi),
          graveyards: () => knownGraveyards() };
      }
      world.noteVillageSeen?.(player.pos.x, player.pos.z); // unlocks its graveyard

      // the horse carries you: mesh rides under the player, legs trot
      if (player.mounted && horseMesh) {
        if (world.isWater(player.pos.x, player.pos.z)) dismountHorse();
        else {
          horseMesh.position.set(player.pos.x, world.heightAt(player.pos.x, player.pos.z), player.pos.z);
          horseMesh.rotation.y = player.mesh.rotation.y + Math.PI;
          player.mesh.position.y += 0.95; // sit in the saddle
          const legs = horseMesh.userData.legs ?? [];
          legs.forEach((leg, li) => {
            leg.rotation.x = Math.sin(player.walkT * 1.6 + (li % 2) * Math.PI) * 0.55;
          });
        }
      }

      // The Log Boat is an explicit mount. It follows beneath the rider on
      // land and water, and only a mounted boat makes deep water passable.
      const onWater = !player.flying && boatMounted && world.isWater(player.pos.x, player.pos.z);
      wasOnWater = !!onWater;
      if (boatPlaceT > 0) boatPlaceT -= dt;
      raft.visible = boatMounted;
      if (boatMounted) {
        const k = 1;
        raft.position.set(player.pos.x, player.mesh.position.y + 0.12, player.pos.z);
        raft.rotation.y = player.mesh.rotation.y;
        raft.scale.setScalar(k);
        player.mesh.position.y += 0.32;
        // wake rings while actually moving
        waveT -= dt;
        if (onWater && waveT <= 0
            && (Math.abs(player.pos.x - lastWaveX) > 0.6 || Math.abs(player.pos.z - lastWaveZ) > 0.6)) {
          waveT = 0.35;
          lastWaveX = player.pos.x; lastWaveZ = player.pos.z;
          spawnWave(player.pos.x, player.pos.z);
        }
      }
      updateWaves(dt);

      updateChannel(dt);
      if (!game.dungeon) { // surface weather & events sleep while you're below
        tickGraveEvent();
        tickWisp(dt);
        tickRace(dt);
        tickGust(dt);
        tickTumbleweeds(dt);
        tickBubbles(dt);
        tickGlide(dt);
        tickAvalanche(dt);
        tickBlizzard(dt);
        tickTempleTraps(dt);
        tickGriffin(dt);
        tickFlight(dt);
        tickShip();
        tickDrowning(dt);
        tickFireflies(dt);
        tickDustDevil(dt);
        tickCold(dt);
      }
      tickTorch(dt);      // your torch burns down there too
      tickMagicLight(dt); // …and the mage's mote circles alongside it

      // aggro sting: plays ONCE when you go from "nothing chasing me" to
      // "something is coming" — not again for each extra attacker
      if (game.kind === 'survival') {
        const anyAggro = enemyMgr.list.some(e =>
          e.aggroed && !e.dying && !e.cfg?.passive
          && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 26);
        if (anyAggro && !game._anyAggro && !player.dead) audio.sfx('aggro', 0.5);
        game._anyAggro = anyAggro;
      }

      // contextual E hint: revive > chest > home > landmark > treasure
      const hintEl = $id('home-hint');
      const poi = nearPoi();
      const POI_HINTS2 = {
        farm: '🏚️ An abandoned farm — press <kbd>E</kbd> to restore it (safe haven + supplies)',
        trader: '🛒 Wandering trader — press <kbd>E</kbd> to sell surplus for essence',
        graveyard: '⚰️ Restless graveyard — press <kbd>E</kbd> to face the dead (3 waves)',
        village: '🪶 Tribal village — press <kbd>E</kbd> to offer tribute (15 🍖) for peace',
        race: '🏁 Race post — ride up ON A HORSE and press <kbd>E</kbd> to race',
        nest: '🥚 An eagle nest — press <kbd>E</kbd> to rob it (they will mind)',
        temple: '🏛️ A jungle temple — clear the guards, then press <kbd>E</kbd> for the treasury',
        liana: '🌿 A vine line — press <kbd>E</kbd> to glide across',
        bonfire: '🔥 A bonfire — press <kbd>E</kbd> to rest (full heal, safe camp)',
        summit: '⛰️ The summit — defeat its keeper, then press <kbd>E</kbd> to claim the peak',
        captive: '🔓 A guarded captive — defeat the guards, then press <kbd>E</kbd> to free them',
        lair: mp?.active ? '💀 A boss lair — slay its named master for a UNIQUE treasure'
          : '💀 A boss lair — press <kbd>E</kbd> to enter its master\'s den',
        statue: '🗿 Cursed statue — press <kbd>E</kbd> to strike a pact (boon + bane)',
      };
      const POI_HINTS = {
        shrine: '✦ Ancient shrine — press <kbd>E</kbd> to receive its blessing',
        monolith: '▲ Rune monolith — press <kbd>E</kbd> to break the seal',
        crypt: '☗ Forgotten crypt — clear the keepers, then <kbd>E</kbd> to loot',
      };
      const hint = panels.open ? null
        : game.dungeon ? (world.atExit?.(player.pos) ? '✨ The way out — press <kbd>E</kbd> to leave the lair'
            : world.atEntrance?.(player.pos) ? '🚪 The entrance arch — press <kbd>E</kbd> to flee the lair'
            : null)
        : channel ? `✨ ${channel.label} ${Math.min(99, Math.round((channel.t / channel.dur) * 100))}%`
        : mp?.revivablePartner?.() ? '💚 Your partner is DOWN — press <kbd>E</kbd> to revive!'
        : nearChest() ? '📦 Storage chest — press <kbd>E</kbd> to open'
        : nearWildHorse() ? '🐴 A wild horse — press <kbd>E</kbd> to saddle and ride it'
        : nearParkedHorse() ? '🐴 Your horse — press <kbd>E</kbd> to mount'
        : nearClassMaster() ? (player.selectedClass
            ? '🧙 Class Master — press <kbd>E</kbd> to train your abilities'
            : '🧙 Class Master — press <kbd>E</kbd> to CHOOSE your class')
        : nearSmith() ? '⚒️ Blacksmith — press <kbd>E</kbd> for quests &amp; the forge'
        : nearFlightNest() ? '🪽 Griffin roost — press <kbd>E</kbd> to open the flight map'
        : world.propNear?.(player.pos.x, player.pos.z, 3) ? {
            hive: '🍯 A humming beehive — press <kbd>E</kbd> to raid it (mind the bees)',
            cocoon: '🕸️ A silk cocoon — press <kbd>E</kbd> to cut it open',
            glade: '🍄 A glowing mushroom — press <kbd>E</kbd> to harvest it',
          }[world.propNear(player.pos.x, player.pos.z, 3).kind]
        : enemyMgr.prisonerNear?.(player.pos.x, player.pos.z, 3) ? '🔓 A caged prisoner — press <kbd>E</kbd> to free him'
        : poi ? (POI_HINTS2[poi.type] ?? POI_HINTS[poi.type])
        : nearTreasure() ? '💰 This is the spot — press <kbd>E</kbd> to dig' : null;
      if (hint) { hintEl.innerHTML = hint; hintEl.classList.remove('hidden'); }
      else hintEl.classList.add('hidden');

      // the anvil rings only while the smith modal is open at the smith
      if (!panels.openSet.has('smith') || !nearSmith()) audio.loopStop('smith_forge');

      // fallen-pet resurrection hint (at home or at the graveyard)
      const petHint = $id('pet-hint');
      if (canResurrectPetHere() && !panels.open) {
        const cost = petResurrectCost();
        petHint.textContent = `🐺 Resurrect pet — press R (${Object.entries(cost)
          .map(([k, v]) => `${fmtResource(v)} ${RES_ICONS[k] ?? k}`).join(' + ')})`;
        petHint.classList.remove('hidden');
      } else petHint.classList.add('hidden');

      // the big map refreshes while open
      if (bigmapOpen) {
        bigmapT -= dt;
        if (bigmapT <= 0) {
          bigmapT = 0.5;
          minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.mapRemotes() : null);
        }
      }

      const progress = progressAt(player.pos.x, player.pos.z);
      ui.updateHUD(player, progress, BIOMES[game.biomeIndex].name);

      // crossing the whole wilds is a MILESTONE, not the end — celebrate once
      // (fat XP + fanfare) and keep the world running: Grimfrost, the summit
      // and everything else are still out there. It takes standing DEEP in
      // the Frozen Peak — the last country of the spiral — to earn it.
      if (!game.crossedWilds && game.biomeIndex === BIOMES.length - 1
          && radiusOf(player.pos.x, player.pos.z) >= WORLD.goalR) {
        game.crossedWilds = true;
        const xp = questXpFor(player.level) * 4;
        player.addXp(xp);
        audio.sfx('victory', 0.7);
        ui.banner('🏔️ YOU CROSSED THE WHOLE WILDS!');
        ui.goldFlash();
        ui.toast(`🏔️ From the cave to the world's icy rim: +${xp} XP. The peak still holds its masters — Grimfrost's lair and the summit await.`, 'level');
      }
    }
  } else if (game.mode === 'play' && game.paused && !game.editorView) {
    // PAUSED — a panel is open, so the simulation is frozen. But the graphics
    // settings LIVE in a panel, and world streaming + atmosphere are what
    // actually realise most of them (chunk detail, foliage density, vegetation
    // and shadow distance, the fog wall and far plane, light levels). Stepping
    // them with dt = 0 keeps the picture in step with the settings while
    // advancing no game state at all: no world clock, no regrowth, no
    // smoothing lerps. Without this, changing any of those options did nothing
    // visible until the panel was closed.
    world.update(0, player.pos);
    updateAtmosphere(0);
  }

  updateCamera(dt);
  if (game.editorView && worldEditor) {
    worldEditor.updateView(dt, camera, input);
    // zoomed way out → terrain-only LOD chunks over a much wider radius,
    // so a whole biome fits on screen at smooth FPS
    // hysteresis: enter the terrain-only LOD past 300 m, leave under 235 m
    const far = world.groundOnly
      ? worldEditor.view.dist > 235
      : worldEditor.view.dist > 300;
    if (far !== !!world.groundOnly) {
      world.groundOnly = far;
      world.regenChunks();
    }
    world.viewRadius = far
      ? Math.min(24, Math.round(worldEditor.view.dist / 55) + 8)
      : Math.min(7, Math.round(worldEditor.view.dist / 60) + 3);
    world.update(dt, worldEditor.viewTarget()); // chunks follow the editor camera
    edPopT -= dt;
    if (edPopT <= 0) { // wake the spawn zones under the camera (mobs stay frozen)
      // populate the whole VISIBLE area, not a fixed ring: at far zoom the
      // release/activate radii and the alive cap scale with the view (and
      // the scan gets pricier, so the tick spaces out accordingly)
      const zs = Math.min(9, Math.max(3, worldEditor.view.dist / 85));
      edPopT = 0.25 + zs * 0.07;
      enemyMgr.zoneScale = zs;
      enemyMgr.maxAlive = Math.round(250 + zs * 90);
      enemyMgr.editorPopulate(worldEditor.viewTarget(), player.pos);
    }
    // studio lighting: the frozen sim would otherwise leave night / cave
    // gloom / dark-biome fog hanging over the whole map
    hemi.intensity = 1.0;
    sun.intensity = 1.45;
    scene.fog.color.set(0xbcd4e6);
    scene.background.set(0xbcd4e6);
    scene.fog.near = 400;
    scene.fog.far = 4000;
  }
  devDistanceRadius?.update(player, world, game.mode === 'play');
  worldEditor?.update(dt);
  ui.updateOverlays(dt, camera, player.pos);
  renderCharPreview(dt);
  renderSmithPreview(dt);
  // the World Editor renders CLEAN — no bloom / AO / vignette
  // being a ghost drains the world of colour, so the post path has to run even
  // for a player with every graphics effect switched off — build the stack on
  // demand (applyGraphics only creates it for bloom/AO/rays) and size it now
  const ghostK = ghostFade;
  if (ghostK > 0 && !postfx && !game.editorView) {
    postfx = new PostFX(renderer);
    postfx.setSize(renderer.domElement.width, renderer.domElement.height);
  }
  const usePost = (settings.bloom || settings.ssao || settings.rays || ghostK > 0)
    && postfx && !game.editorView;
  // tell the DOM overlay to stand down while the shader owns the night
  _postNightActive = usePost && !game.dungeon;
  if (usePost) {
    // "Ambient occlusion" = canopy shade ONLY: soft pools of shade under tree
    // crowns, nothing global. The screen-space SSAO term is gone — THAT was the
    // "whole screen dark + contrast" the player disliked. Open ground, sky and
    // anything not under a crown pass through the post path unchanged.
    let canopy = null;
    if (settings.ssao) {
      canopyShade ??= new CanopyShade();
      canopyShade.update(world, player.pos.x, player.pos.z);
      if (canopyShade.ready) {
        canopy = {
          densTex: canopyShade.densTex, metaTex: canopyShade.metaTex,
          cx: canopyShade.cx, cz: canopyShade.cz, size: canopyShade.size,
          strength: 1.0,
        };
      }
    }
    // God rays: shafts spill through gaps in the canopy toward the sun. They
    // fade out at night, underground and in a lair, and swell at dawn/dusk
    // when the low sun rakes through the trees.
    let rays = null;
    if (settings.rays && !game.dungeon) {
      const dayK = (1 - (game.nightK || 0)) * (1 - atmoCaveK);
      // low sun = long, obvious shafts; overhead noon sun still gets a solid
      // wash (the old 0.34 floor left midday shafts invisible once the
      // off-screen fade took its cut on top)
      const lowSun = 1 - Math.min(1, Math.max(0, (_sunDir.y - 0.25) / 0.65));
      const k = dayK * (0.62 + 0.38 * lowSun);
      if (k > 0.01) rays = { dir: _sunDir, color: sun.color, strength: k * 0.85 };
    }
    postfx.render(scene, camera, {
      ssao: false, bloom: !!settings.bloom, // no screen-space contact term
      canopy, rays, ghost: ghostK,
      night: game.dungeon ? 0 : (game.nightK || 0),
    });
  } else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
}

// ---- armory paper-doll: a second small camera orbiting the actual player ----
let previewRenderer = null;
const previewCam = new THREE.PerspectiveCamera(40, 210 / 270, 0.1, 60);
let previewAngle = Math.PI;
function renderCharPreview(dt) {
  if (panels.open !== 'character' || game.mode !== 'play') return;
  if (!previewRenderer) {
    previewRenderer = new THREE.WebGLRenderer({
      canvas: $id('char-preview'), antialias: true, alpha: true });
    previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  previewAngle += dt * 0.5;
  previewCam.position.set(
    player.pos.x + Math.sin(previewAngle) * 4.4,
    player.mesh.position.y + 2.1,
    player.pos.z + Math.cos(previewAngle) * 4.4);
  previewCam.lookAt(player.pos.x, player.mesh.position.y + 0.9, player.pos.z);
  previewRenderer.render(scene, previewCam);
}

// ---- blacksmith modal portrait: the smith model in his own little scene ----
let smithPrev = null;
function renderSmithPreview(dt) {
  if (!panels.openSet?.has('smith') || game.mode !== 'play') return;
  if (!smithPrev) {
    const sscene = new THREE.Scene();
    const model = makeBlacksmith();
    sscene.add(model);
    sscene.add(new THREE.HemisphereLight(0xffe8c8, 0x3a2c1c, 1.1));
    const glow = new THREE.PointLight(0xff8a30, 1.4, 8);
    glow.position.set(0.8, 1.4, 1.2);
    sscene.add(glow);
    const cam = new THREE.PerspectiveCamera(38, 190 / 240, 0.1, 30);
    const r = new THREE.WebGLRenderer({ canvas: $id('smith-preview'), antialias: true, alpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    smithPrev = { scene: sscene, model, cam, r, angle: 0.4 };
  }
  smithPrev.angle += dt * 0.35;
  const a = Math.sin(smithPrev.angle) * 0.6; // sway, don't spin — he's working
  smithPrev.cam.position.set(Math.sin(a) * 4.2, 2.2, Math.cos(a) * 4.2);
  smithPrev.cam.lookAt(0, 1.0, 0);
  // embers flicker
  const ember = smithPrev.model.userData?.embers;
  if (ember) ember.material.color.setHSL(0.06, 1, 0.45 + Math.sin(smithPrev.angle * 9) * 0.15);
  smithPrev.r.render(smithPrev.scene, smithPrev.cam);
}

world.update(0, player.pos); // pre-generate the starting forest
updateCamera();
initTouch(game); // on-screen controls arm on the first touch (phones/tablets)
tick();

// boot loading screen: preload every sound before the menu unlocks so
// nothing stutters in — and a co-op guest hears wolves from second one
{
  const overlay = $id('loading');
  audio.preloadAll((done, total) => {
    const pct = Math.round((done / total) * 100);
    $id('loading-fill').style.width = pct + '%';
    $id('loading-label').textContent = `Loading… ${pct}%`;
  }).then(() => {
    overlay.classList.add('done');
    setTimeout(() => overlay.remove(), 600);
  });
}

// Web-Worker heartbeat: worker timers aren't visibility-throttled, so a
// hidden multiplayer tab keeps simulating (~10 Hz) instead of freezing the
// shared world for the partner. Solo games still pause in the background.
const bgClock = new Worker(URL.createObjectURL(
  new Blob(['setInterval(() => postMessage(0), 100);'], { type: 'text/javascript' })));
bgClock.onmessage = () => { if (document.hidden && mp?.active) step(); };

// a tab left open across a deploy (or a map save) is running stale code —
// check every 5 minutes and gate it behind a blocking "UPDATE AVAILABLE" modal
startUpdateWatch({
  // freeze the sim behind the gate so nothing keeps ticking on the old build
  onBlock: () => { game.paused = true; },
  // one last write so nothing earned since the last autosave is lost
  onSave: () => (autosaveEligible() ? doAutosave() : null),
  // never interrupt the admin mid-edit — they'd lose unsaved World-Editor work
  isBusy: () => !!game.editorView,
});

// debug handle (also handy for the future multiplayer host loop)
window.__game = { game, scene, player, enemyMgr, companions, pickups, panels, input, updateAim, minimap,
  get world() { return world; }, get camp() { return camp; } };
