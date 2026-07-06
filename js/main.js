// ---- Among The Woods: game bootstrap & main loop ----

import * as THREE from 'three';
import { WORLD, ITEMS, SPELLS, ENEMY_TYPES, BOSS_RANKS, BIOMES, STAT_TRACKS, MOBA,
         RESOURCES, RES_ICONS, HIDE_BEARING, VERDANT_HIDE_DROP, hideForHp, radiusOf, costFor,
         biomeIndexAt, progressAt, fmtResource, roundResource, itemById, spellById } from './config.js';
import { makeAimArc, updateAimArc, makeRaft } from './models.js';
import { Camp } from './camp.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { World } from './world.js';
import { MobaWorld } from './mobaworld.js';
import { Moba } from './moba.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { Projectiles } from './projectiles.js';
import { Companions } from './companions.js';
import { Pickups, pickupSfx } from './pickups.js';
import { Minimap, MobaMinimap } from './minimap.js';
import { UI } from './ui.js';
import { Panels } from './panels.js';

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BIOMES[0].fog, 35, 110);
scene.background = new THREE.Color(BIOMES[0].sky);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(0xdfeadf, 0x3a4a35, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 1.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 120;
scene.add(sun, sun.target);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- game state ----------
const game = {
  mode: 'menu',   // menu | play | dead | won
  kind: 'survival', // survival | moba
  paused: false,
  time: 0,
  biomeIndex: 0,
  seed: 20260704,
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
  onStart: () => (selectedMode === 'moba' ? startMobaSolo() : startGame()),
  onCastSpell: (i) => player.castSpell(i, { enemyMgr: combatMgr() }),
});

const panels = new Panels({
  // in multiplayer the world can't stop for one player's shopping trip
  onPauseChange: (open) => { game.paused = open && !mp?.active; ui.setPaused(false); },
  onBuyItem: buyItem,
  onBuySpell: buySpell,
  onBuyStat: buyStat,
  onEquip: (id) => { player.equip(id); panels.refresh(); },
  onUnequip: (slot) => { player.unequip(slot); panels.refresh(); },
  onToggleSpell: (id) => { player.toggleSpellSlot(id); panels.refresh(); },
  onBuild: (id, lane) => buildBase(id, lane),
  onCampBuild: (id) => campBuild(id),
  mobaTeam: () => mobaSide,
  nearHome: () => nearHome(), // the home building only upgrades in person
});

let world = new World(scene, game.seed);

const player = new Player(scene, {
  popup: (pos, text, color) => ui.popup(pos, text, color),
  onHurt: () => ui.hurtFlash(),
  onLevelUp: (level) => {
    audio.sfx('evolve', 0.55);
    player.spawnLevelUpEffect();
    const freshItems = ITEMS.filter(i => i.level === level).map(i => i.name);
    const freshSpells = SPELLS.filter(s => s.level === level).map(s => s.name);
    const fresh = [...freshItems, ...freshSpells];
    ui.toast(`⭐ Level ${level}!` + (fresh.length ? ` New: ${fresh.join(', ')}` : ''), 'level');
    audio.sfx('evolve_ready', 0.4);
    ui.pulseShopButton(true);
  },
  onDeath: () => {
    if (game.kind === 'moba') { mobaRespawn(); return; }   // MOBA: respawn at base
    if (mp?.active && mp.handleLocalDeath()) return;       // MP: arena loss / respawn
    survivalRespawn();                                      // solo: wake at the cabin
  },
  onEquipChange: () => companions.sync(player),
  onChop: (tree, power) => mp?.sendChop(tree, power),
});
panels.player = player;

// Apply a pickup's contents to the LOCAL player (used by direct collection
// and by the co-op 'grant' event from the host).
const RES_POPUP = { meat: ['🍖', '#ff9d76'], wood: ['🪵', '#d8a468'],
                    stone: ['🪨', '#c8c8c0'], hide: ['🟫', '#c9986a'], iron: ['🔩', '#c8d0d8'] };
function grantPickup(kind, payload) {
  if (kind === 'item') {
    const item = itemById(payload);
    player.ownItem(payload);
    ui.toast(`🎁 Loot: ${item.icon} ${item.name}!`, 'level');
    panels.refresh();
  } else if (kind === 'berry') {
    // berries are eaten on pickup: +10 health each
    player.hp = Math.min(player.maxHp, player.hp + 10 * payload);
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2), `+${Math.round(10 * payload)} ❤️`, '#ff7a7a');
    audio.sfx('purchase', 0.35, 400);
    return;
  } else {
    player[kind] = roundResource(player[kind] + payload);
    const [icon, color] = RES_POPUP[kind];
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2), `+${fmtResource(payload)} ${icon}`, color);
  }
  pickupSfx[kind]?.();
}

const pickups = new Pickups(scene, world, {
  onCollect: (p, target) => {
    if (target === player) grantPickup(p.kind, p.payload);
    else mp?.onRemoteCollect(p); // co-op host: the partner's proxy grabbed it
  },
});
// fallen logs become wood pickups — host-side only, like island treasure,
// so the co-op guest doesn't mint unsynced local duplicates
const spawnWoodLog = (pos) => {
  if (mp?.active && !mp.isHost) return;
  pickups.spawn('wood', 1, pos, 0.15);
};
world.onWoodLog = spawnWoodLog;

function discoverType(type) {
  panels.discover(type);
  const cfg = ENEMY_TYPES[type];
  ui.toast(`🆕 New creature discovered: ${cfg.icon} ${cfg.name}! (see Bestiary — N)`, 'discover');
  audio.sfx('evolve_ready', 0.35);
}

const enemyMgr = new EnemyManager(scene, world, {
  popup: (pos, text, color) => ui.popup(pos, text, color),
  onKill: (enemy) => {
    // co-op: XP goes to whoever landed the killing blow
    const creditedToPartner = mp?.active && mp.onKillCredit(enemy);
    if (!creditedToPartner) {
      player.kills++;
      player.addXp(enemy.xp);
      ui.popup(enemy.mesh.position.clone().setY(enemy.mesh.position.y + 2.1), `+${enemy.xp} XP`, '#c9a4ff');
    }
    // meat falls to the ground and is magnet-collected (shared in co-op)
    const piles = Math.min(4, Math.max(1, Math.round(enemy.meat / 2)));
    let left = enemy.meat;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(enemy.meat / piles);
      left -= amount;
      pickups.spawn('meat', amount, enemy.pos, 0.9 * enemy.sizeMult);
    }
    // big animals always drop their full hide (even if they chased you back
    // into the Verdant Forest); small critters there — and bats — leave a scrap
    if (HIDE_BEARING.has(enemy.type)) {
      pickups.spawn('hide', hideForHp(enemy.maxHp), enemy.pos, 1.1 * enemy.sizeMult);
    } else if (biomeIndexAt(enemy.pos.x, enemy.pos.z) === 0 || enemy.type === 'bat') {
      pickups.spawn('hide', VERDANT_HIDE_DROP, enemy.pos, 0.9);
    }
    if (enemy.bossRank > 0) rollBossDrop(enemy);
  },
  onDiscover: discoverType,
  onBossSpawn: (enemy) => {
    ui.addTracker('boss' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 2.6 * enemy.sizeMult) : null,
      '💀'.repeat(enemy.bossRank), 'skulls');
    // herd-guardian ambush bosses stay quiet — finding them is the surprise
    if (!enemy.ambush) ui.toast(`${'💀'.repeat(enemy.bossRank)} A pack mother appears! Her children keep coming until she falls.`, 'boss');
  },
  onBossDeath: (enemy) => ui.removeTracker('boss' + enemy.id),
  // HP bar above every enemy (+ spell charge bar for casters)
  onSpawn: (enemy) => {
    const ranged = enemy.cfg.ranged;
    const shotColor = ranged ? '#' + enemy.cfg.shotColor.toString(16).padStart(6, '0') : '';
    const html = '<div class="hpbar"><div class="hpbar-fill"></div></div>' +
      (ranged ? `<div class="castbar"><div class="castbar-fill" style="background:${shotColor}"></div></div>` : '');
    ui.addTracker('hp' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 1.5 * enemy.sizeMult + 0.5) : null,
      html, 'hpwrap',
      (el) => {
        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        const fill = el.children[0].firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = pct > 0.5 ? '#5fd35f' : pct > 0.25 ? '#e0c040' : '#e05050';
        if (ranged) {
          const charge = 1 - Math.max(0, enemy.spellTimer) / enemy.cfg.spellCd;
          el.children[1].firstChild.style.width = (charge * 100) + '%';
        }
      });
  },
  onRemove: (enemy) => ui.removeTracker('hp' + enemy.id),
});

const projectiles = new Projectiles(scene);
const companions = new Companions(scene, {
  popup: (pos, text, color) => ui.popup(pos, text, color),
  toast: (text, cls) => ui.toast(text, cls),
  addTracker: (...a) => ui.addTracker(...a),
  removeTracker: (id) => ui.removeTracker(id),
});
const minimap = new Minimap(document.getElementById('minimap'), world);

// Boss loot: a chance to drop an unowned item near the player's level.
function rollBossDrop(enemy) {
  const rank = BOSS_RANKS[enemy.bossRank - 1];
  if (Math.random() >= rank.dropChance) return;
  const candidates = ITEMS.filter(i =>
    !i.free && !player.hasItem(i.id) && i.level <= player.level + 1);
  if (!candidates.length) { pickups.spawn('meat', 5, enemy.pos, 1); return; }
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  pickups.spawn('item', item.id, enemy.pos, 0.5);
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
function startPlaying() {
  ui.hideMenu();
  game.mode = 'play';
  audio.playMusic('level1');
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
      pickups.spawn('meat', 8, at, 1.2);
      pickups.spawn('stone', 6, at, 1.2);
      pickups.spawn('hide', 3, at, 1.2);
      if (Math.random() < 0.4) {
        const candidates = ITEMS.filter(i => !i.free);
        pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, at, 0.6);
      }
    };
    // the co-op guest renders the HOST's enemies
    if (!(mp?.active && mp.mode === 'coop' && !mp.isHost)) enemyMgr.spawnInitialWave();
  }
}

function startGame() {
  startPlaying();
  ui.toast('You wake in a cave… follow the light. Punch small trees for wood, craft at the camp (U).', 'info');
}

// Camp buildings: pay, build, apply effects (home hp bonus, era unlocks).
function campBuild(id) {
  if (!camp) return;
  const info = camp.buildingInfo(id);
  if (info.maxed || player.level < info.reqLevel) return;
  if (!Object.entries(info.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(info.cost)) player[k] = roundResource(player[k] - v);
  camp.build(id);
  player.campBonus = camp.homeHpBonus();
  player.recompute();
  panels.refresh();
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
  audio.stopMusic();
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
    const dropped = Math.floor(player[res] * 5) / 10;
    player[res] = 0;
    if (dropped <= 0) continue;
    totalDropped = roundResource(totalDropped + dropped);
    const piles = Math.min(3, Math.max(1, Math.round(dropped / 5)));
    let left = dropped;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(dropped / piles);
      left -= amount;
      pickups.spawn(res, amount, pos, 1.6);
    }
  }
  return totalDropped;
}

// Survival death is soft: you wake up at the spawn cottage, but you lose a
// full level (XP resets to that level's start) and half your meat spills where
// you fell.
function survivalRespawn() {
  minimap.deathAt = { x: player.pos.x, z: player.pos.z }; // mark the death spot
  const dropped = dropHalfMeat(player.pos.clone());
  player.loseLevel();
  player.mesh.rotation.z = Math.PI / 2; // lie down while "out"
  audio.sfx('defeat', 0.5);
  ui.toast(`☠️ You fell… Level lost (now ${player.level}); half your carried loot (${dropped}) spilled where you died. Chest storage is safe.`, 'boss');
  setTimeout(() => {
    if (game.mode !== 'play') return;
    // with a graveyard built you choose where to wake up
    if (camp?.has('grave') && camp.gravePos) $id('respawn-choice').classList.remove('hidden');
    else reviveAt('cave');
  }, 2500);
}

function reviveAt(where) {
  $id('respawn-choice').classList.add('hidden');
  if (game.mode !== 'play') return;
  player.revive(1);
  if (where === 'grave' && camp?.gravePos) player.pos.set(camp.gravePos.x, 0, camp.gravePos.z + 2);
  else player.pos.set(0, 0, -2);
}

function mobaRespawn() {
  ui.toast('☠️ You fell — respawning at your base…', 'boss');
  setTimeout(() => {
    if (game.mode !== 'play') return;
    player.revive(1);
    const bp = MOBA.basePos[mobaSide];
    const inward = mobaSide === 'player' ? 1 : -1;
    player.pos.set(bp.x + 9 * inward, 0, bp.z - 9 * inward);
  }, 3000 + player.level * 500);
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

// ---------- settings (persisted in localStorage) ----------
const settings = Object.assign(
  { mouseMove: false },
  JSON.parse(localStorage.getItem('atw-settings') || '{}'),
);
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

  // show the room code so a friend can join the running game
  $id('settings-btn').addEventListener('click', () => {
    $id('set-mpcode').textContent = (mp?.active && mpCode) ? mpCode : '— (not in a multiplayer game)';
  });
}

async function ensureMp() {
  if (!mp) {
    const { Multiplayer } = await import('./multiplayer.js');
    mp = new Multiplayer({
      scene, player, enemyMgr, pickups, projectiles, ui, panels, game, input,
      get world() { return world; }, // MOBA swaps the world object at begin
      popup: (pos, text, color) => ui.popup(pos, text, color),
      onDiscover: discoverType,
      grantPickup,
      dropHalfMeat,
      markDeath: (pos) => { minimap.deathAt = { x: pos.x, z: pos.z }; },
      startPlaying,
      onCoopWin: () => {
        if (game.mode !== 'play') return;
        game.mode = 'won';
        audio.stopMusic();
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

function showModeOptions(mode) {
  audio.sfx('click', 0.4);
  selectedMode = mode;
  $id('mode-select').classList.add('hidden');
  const opts = $id('mode-options');
  opts.classList.remove('hidden');
  opts.classList.toggle('is-moba', mode === 'moba');
  $id('mode-title').textContent = mode === 'moba' ? '🏰 MOBA' : '🌲 Survival';
}
$id('mode-survival-btn').addEventListener('click', () => showModeOptions('survival'));
$id('mode-moba-btn').addEventListener('click', () => showModeOptions('moba'));
$id('mode-back-btn').addEventListener('click', () => {
  audio.sfx('click', 0.4);
  $id('mode-options').classList.add('hidden');
  $id('mode-select').classList.remove('hidden');
  $id('mp-error').textContent = '';
});
$id('mp-moba-btn').addEventListener('click', async () => {
  try {
    const session = await ensureMp();
    showWaiting(await session.host('moba', null));
  } catch (e) { mpError(e); }
});
let mpCode = null; // current room code, shown in Settings for late joiners

function showWaiting(code) {
  mpCode = code;
  $id('mp-choose').classList.add('hidden');
  $id('mp-wait').classList.remove('hidden');
  $id('mp-code-display').textContent = code;
  $id('start-btn').classList.add('hidden'); // no solo start while hosting
}
$id('mp-coop-btn').addEventListener('click', async () => {
  try {
    const session = await ensureMp();
    showWaiting(await session.host('coop', null));
  } catch (e) { mpError(e); }
});
$id('mp-pvp-btn').addEventListener('click', async () => {
  try {
    const session = await ensureMp();
    const interval = Number($id('mp-interval').value);
    showWaiting(await session.host('pvp', interval));
  } catch (e) { mpError(e); }
});
$id('mp-join-btn').addEventListener('click', async () => {
  try {
    const session = await ensureMp();
    await session.join($id('mp-code').value);
    mpCode = $id('mp-code').value.trim().toUpperCase();
  } catch (e) { mpError(e); }
});

function buyItem(id) {
  const item = itemById(id);
  if (!item || player.hasItem(id) || player.level < item.level) return;
  if (item.needs && camp && !camp.has(item.needs)) return; // era gate (survival)
  const cost = costFor(item.cost, game.kind === 'moba');
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.ownItem(id);
  audio.sfx('purchase', 0.5);
  panels.refresh();
}

function buySpell(id) {
  const spell = spellById(id);
  if (!spell || player.spellsOwned.has(id) || player.level < spell.level) return;
  if (!Object.entries(spell.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(spell.cost)) player[k] = roundResource(player[k] - v);
  player.ownSpell(id);
  audio.sfx('upgrade', 0.5);
  panels.refresh();
}

function buyStat(id) {
  const track = STAT_TRACKS.find(t => t.id === id);
  const tier = player.stats[id];
  if (!track || tier >= track.max || player.level < tier + 1) return;
  const cost = track.cost(tier + 1);
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.stats[id]++;
  player.recompute();
  audio.sfx('upgrade', 0.5);
  panels.refresh();
}

// ---------- keys ----------
const inPlay = () => game.mode === 'play';
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
input.onKey('KeyQ', () => inPlay() && !game.paused && player.cycleWeapon());
// M / minimap click → the big world map (mute moved to Settings)
let bigmapOpen = false;
let bigmapT = 0;
function toggleBigMap(force) {
  if (game.kind !== 'survival' || game.mode !== 'play') { bigmapOpen = false; return; }
  bigmapOpen = force !== undefined ? force : !bigmapOpen;
  $id('bigmap').classList.toggle('hidden', !bigmapOpen);
  if (bigmapOpen) {
    audio.sfx('click', 0.4);
    minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.remote : null);
  }
}
input.onKey('KeyM', () => toggleBigMap());
$id('minimap').addEventListener('click', () => toggleBigMap());

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
  if (radiusOf(player.pos.x, player.pos.z) < WORLD.caveR + 4) return true; // in/at the cave
  return Math.hypot(player.pos.x - (-9), player.pos.z - 13) < 6;           // at the home building
}
// E is contextual: at the chest it opens the chest, at home the base modal
function nearChest() {
  return game.kind === 'survival' && camp?.has('chest')
    && Math.hypot(player.pos.x - 6, player.pos.z - 16) < 4;
}
input.onKey('KeyE', () => {
  if (!inPlay()) return;
  if (nearChest()) panels.toggle('chest');
  else if (nearHome()) panels.toggle('base');
});

// ---- pet: resurrection (R at home / the graveyard) & mode cycling (P) ----
function nearGrave() {
  return camp?.gravePos
    && Math.hypot(player.pos.x - camp.gravePos.x, player.pos.z - camp.gravePos.z) < 6;
}

// resurrection costs 10% of everything invested in the pet (item + training)
function petResurrectCost() {
  const item = itemById(player.equipment.pet);
  if (!item) return null;
  const total = { ...item.cost };
  const track = STAT_TRACKS.find(t => t.id === 'pet');
  for (let t = 1; t <= player.stats.pet; t++) {
    for (const [k, v] of Object.entries(track.cost(t))) total[k] = (total[k] || 0) + v;
  }
  const out = {};
  for (const [k, v] of Object.entries(total)) out[k] = Math.max(1, Math.ceil(v * 0.1));
  return out;
}

function canResurrectPetHere() {
  return game.kind === 'survival' && player.petDead && player.equipment.pet
    && !player.dead && (nearHome() || nearGrave());
}

input.onKey('KeyR', () => {
  if (!inPlay() || !canResurrectPetHere()) return;
  const cost = petResurrectCost();
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.petDead = false;
  companions.sync(player);
  ui.toast('🐺 Your pet is back at your side!', 'level');
  audio.sfx('spawn', 0.6);
  panels.refresh();
});

const PET_MODES = ['aggressive', 'defensive', 'passive'];
const PET_MODE_LABEL = {
  aggressive: '🗡️ Aggressive — attacks anything near you',
  defensive: '🛡️ Defensive — only fights what attacks you',
  passive: '💤 Passive — never attacks',
};
input.onKey('KeyP', () => {
  if (!inPlay() || !player.equipment.pet) return;
  player.petMode = PET_MODES[(PET_MODES.indexOf(player.petMode) + 1) % PET_MODES.length];
  ui.toast(`🐺 Pet mode: ${PET_MODE_LABEL[player.petMode]}`, 'level');
  audio.sfx('click', 0.4);
});
$id('bigmap').querySelector('.panel-close').addEventListener('click', () => toggleBigMap(false));
$id('respawn-cave').addEventListener('click', () => reviveAt('cave'));
$id('respawn-grave').addEventListener('click', () => reviveAt('grave'));
for (let i = 0; i < 6; i++) {
  input.onKey('Digit' + (i + 1), () => inPlay() && !game.paused && player.castSpell(i, { enemyMgr: combatMgr() }));
}
input.onKey('Escape', () => {
  if (!inPlay()) return;
  if (bigmapOpen) { toggleBigMap(false); return; }
  if (panels.open) { panels.toggle(null); return; }
  if (mp?.active) return; // the shared world can't pause
  game.paused = !game.paused;
  ui.setPaused(game.paused);
});

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

function updateAim() {
  // normal free cursor: the aim point is exactly where the mouse hits the
  // ground, and the player simply faces it (no clamping — cursor goes anywhere)
  raycaster.setFromCamera(new THREE.Vector2(input.mouse.x, input.mouse.y), camera);
  raycaster.ray.intersectPlane(groundPlane, aimPoint);

  // range arc: a short, ground-hugging slice of the weapon's reach circle in
  // the facing dir. The bow gets a narrower, thinner slice (its range is huge).
  const dx = aimPoint.x - player.pos.x, dz = aimPoint.z - player.pos.z;
  const range = player.attackRange;
  const bow = player.weapon.kind === 'bow';
  const halfAngle = bow ? 0.22 : 0.55;
  const thickness = bow ? 0.35 : Math.min(0.5, range * 0.22);
  aimArc.visible = true;
  updateAimArc(aimArc, player.pos.x, player.pos.z, Math.atan2(dx, dz),
    range, halfAngle, thickness, (x, z) => world.heightAt(x, z));
  aimArc.material.color.setHex(bow ? 0x9fd8ff : 0xffe9a8);
}

// ---------- biome / atmosphere transitions ----------
const fogColor = new THREE.Color(BIOMES[0].fog);
const skyColor = new THREE.Color(BIOMES[0].sky);

const caveFog = new THREE.Color(0x0c0f0a);

function updateAtmosphere(dt) {
  const idx = biomeIndexAt(player.pos.x, player.pos.z);
  if (idx !== game.biomeIndex) {
    game.biomeIndex = idx;
    const biome = BIOMES[idx];
    ui.banner(`— ${biome.name} —`);
    audio.sfx('lane_unlock', 0.5);
    audio.playMusic(idx >= 3 ? 'level3' : 'level1');
  }
  const biome = BIOMES[game.biomeIndex];

  // the cave is dark; light floods in as you walk toward the mouth
  const r = radiusOf(player.pos.x, player.pos.z);
  const caveK = Math.max(0, Math.min(1, (WORLD.caveR + 6 - r) / (WORLD.caveR + 3)));
  hemi.intensity = 0.9 - 0.62 * caveK;
  sun.intensity = 1.4 * (1 - 0.8 * caveK);
  // the camera sits ~30 m away — keep the fog behind the hero so the cave
  // interior stays dimly visible while the outside world is swallowed
  scene.fog.near = 35 - 14 * caveK;
  scene.fog.far = 110 - 60 * caveK;

  // caveK already fades smoothly with distance, so apply it directly; the
  // slow time-lerp is only for biome-to-biome transitions out in the open
  const fogTarget = new THREE.Color(biome.fog).lerp(caveFog, caveK);
  const skyTarget = new THREE.Color(biome.sky).lerp(caveFog, caveK);
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

// ---------- camera ----------
function updateCamera() {
  const py = player.mesh.position.y;
  camera.position.set(player.pos.x, py + 26, player.pos.z + 14);
  camera.lookAt(player.pos.x, py, player.pos.z - 2);
  sun.position.set(player.pos.x + 18, 35, player.pos.z + 12);
  sun.target.position.set(player.pos.x, 0, player.pos.z);
}

// ---------- main loop ----------
const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  step();
}

// One simulation step. Normally driven by rAF; in multiplayer a Web-Worker
// clock keeps stepping while the tab is HIDDEN (rAF pauses there, which froze
// the shared world for the partner — enemies, snapshots, everything).
function step() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (game.mode === 'play' && !game.paused) {
    game.time += dt;
    updateAim(dt);
    const em = combatMgr(); // real mgr / co-op shadow / pvp arena / moba units
    player.update(dt, {
      input, world, enemyMgr: em, projectiles, pickups, aimPoint,
      arenaZone: mp?.active ? mp.arenaZone() : null,
      mobaBounds: game.kind === 'moba' ? MOBA.half : null,
      mouseMove: settings.mouseMove,
      boat: game.kind === 'survival' && camp?.has('boat'),
    });

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
      ui.updateHUD(player, 0, 'MOBA — destroy the enemy base');
    } else {
      if (mp?.active) {
        mp.updateWorldSim(dt);
        mp.update(dt);
      } else {
        enemyMgr.update(dt, [player], projectiles);
        projectiles.update(dt, enemyMgr, [player]);
        pickups.update(dt, [player]);
      }
      companions.update(dt, player, em, projectiles, world);
      camp?.update(dt, em, projectiles);
      world.update(dt, player.pos);
      // co-op: show the partner on the minimap too
      minimap.update(dt, player, em,
        mp?.active && mp.mode === 'coop' ? mp.remote : null);
      updateAtmosphere(dt);

      // raft under the hero while paddling
      const onWater = camp?.has('boat') && world.isWater(player.pos.x, player.pos.z);
      raft.visible = !!onWater;
      if (onWater) {
        raft.position.set(player.pos.x, player.mesh.position.y + 0.12, player.pos.z);
        raft.rotation.y = player.mesh.rotation.y;
      }

      // contextual E hint: chest, or home build & upgrade
      const hintEl = $id('home-hint');
      const hint = panels.open ? null
        : nearChest() ? '📦 Storage chest — press <kbd>E</kbd> to open'
        : nearHome() ? '🏠 Your home — press <kbd>E</kbd> to build &amp; upgrade' : null;
      if (hint) { hintEl.innerHTML = hint; hintEl.classList.remove('hidden'); }
      else hintEl.classList.add('hidden');

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
          minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.remote : null);
        }
      }

      const progress = progressAt(player.pos.x, player.pos.z);
      ui.updateHUD(player, progress, BIOMES[game.biomeIndex].name);

      if (radiusOf(player.pos.x, player.pos.z) >= WORLD.goalR) {
        game.mode = 'won';
        aimArc.visible = false;
        audio.stopMusic();
        audio.sfx('victory', 0.6);
        mp?.broadcastWin();
        ui.showEnd(true, endStats());
        document.getElementById('end-title').textContent = 'You crossed the whole wilds!';
      }
    }
  }

  updateCamera();
  ui.updateOverlays(dt, camera);
  renderer.render(scene, camera);
}

world.update(0, player.pos); // pre-generate the starting forest
updateCamera();
tick();

// Web-Worker heartbeat: worker timers aren't visibility-throttled, so a
// hidden multiplayer tab keeps simulating (~10 Hz) instead of freezing the
// shared world for the partner. Solo games still pause in the background.
const bgClock = new Worker(URL.createObjectURL(
  new Blob(['setInterval(() => postMessage(0), 100);'], { type: 'text/javascript' })));
bgClock.onmessage = () => { if (document.hidden && mp?.active) step(); };

// debug handle (also handy for the future multiplayer host loop)
window.__game = { game, scene, player, enemyMgr, companions, pickups, panels, input, updateAim, minimap,
  get world() { return world; }, get camp() { return camp; } };
