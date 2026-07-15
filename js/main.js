// ---- Among The Woods: game bootstrap & main loop ----

import * as THREE from 'three';
import { WORLD, ITEMS, SPELLS, ENEMY_TYPES, BOSS_RANKS, BIOMES, STAT_TRACKS, MOBA,
         RESOURCES, RES_ICONS, HIDE_BEARING, VERDANT_HIDE_DROP, hideForHp, radiusOf, costFor,
         biomeIndexAt, progressAt, fmtResource, roundResource, itemById, spellById,
         consumableById, essenceDropFor, MAX_LEVEL, questFor, questXpFor, BIOME_LAIRS } from './config.js';
import { makeAimArc, updateAimArc, makeRaft, makeBlacksmith, makeHorse, makeWisp,
         makeGriffin, makeGriffinRoost, makeTumbleweed } from './models.js';
import { PostFX } from './postfx.js';
import { Camp } from './camp.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { World, latticeHash } from './world.js';
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

let postfx = null; // created on demand by applyGraphics (bloom)

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

// ---------- adaptive quality: weak laptops get smoother frames ----------
// Watches the real frame rate and steps quality DOWN (never up mid-session):
// 1) render at 1.25x pixel ratio  2) 1x + soft shadows off  3) shorter view
const autoQuality = {
  stage: 0, t: 0, frames: 0, low: 0,
  tick(dt) {
    this.frames++; this.t += dt;
    if (this.t < 4) return;               // judge in 4 s windows
    const fps = this.frames / this.t;
    this.t = 0; this.frames = 0;
    if (fps >= 38) { this.low = 0; return; }
    if (++this.low < 2 || this.stage >= 3) return; // two bad windows in a row
    this.low = 0;
    this.stage++;
    if (this.stage === 1) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else if (this.stage === 2) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
      scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    } else if (this.stage === 3) {
      applyViewMode(); // stage-aware: shorter fog + view radius for the mode
      camera.far = game.rpgView ? 260 : 200;
      camera.updateProjectionMatrix();
    }
    ui.toast('⚙️ Graphics lowered automatically for smoother FPS', 'info');
  },
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx?.setSize(renderer.domElement.width, renderer.domElement.height);
});

// ---------- game state ----------
const DEVMODE = /(?:^|[?&])devmode/i.test(location.search); // admin tools only with ?devmode
const game = {
  mode: 'menu',   // menu | play | dead | won
  kind: 'survival', // survival | moba
  paused: false,
  time: 0,
  tod: 0.28,      // time of day 0..1 (0 = midnight, 0.5 = noon) — starts mid-morning
  nightK: 0,      // 0 = full day, 1 = deep night (drives lights/spawns/fireflies)
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
  onCastSpell: (i) => useBarSlot(i),
});

const panels = new Panels({
  // in multiplayer the world can't stop for one player's shopping trip
  onPauseChange: (open) => {
    game.paused = open && !mp?.active;
    ui.setPaused(false);
    if (open) document.exitPointerLock?.(); // panels need the cursor back
  },
  onBuyItem: buyItem,
  onBuySpell: buySpell,
  onBuyStat: buyStat,
  onEquip: (id) => {
    const item = itemById(id);
    if (item && item.level > player.level) {
      ui.toast(`🔒 ${item.name} needs level ${item.level}`, 'error');
      audio.sfx('error', 0.4);
      return;
    }
    player.equip(id);
    audio.sfx('click', 0.5);
    panels.refresh();
  },
  onToast: (msg) => ui.toast(msg, 'error'),
  onUnequip: (slot) => { player.unequip(slot); panels.refresh(); },
  onToggleSpell: (id) => { player.toggleSpellSlot(id); panels.refresh(); },
  onBuild: (id, lane) => buildBase(id, lane),
  onCampBuild: (id) => campBuild(id),
  onBuyConsumable: (id) => buyConsumable(id),
  onChestChange: () => mp?.sendCampSync?.(),
  onAssignSlot: (i, id) => { player.spellSlots[i] = id; audio.sfx('click', 0.4); },
  onDropRes: (key) => dropResource(key),
  onDropItem: (id) => dropItem(id),
  onPlaceNest: (id) => placeNest(id),
  onDropConsumable: (id) => dropConsumable(id),
  onEatBerry: () => { player.eatBerry(); refreshHud(); },
  onUseConsumable: (id) => { player.useConsumable(id); refreshHud(); },
  onBuyBag: (cost) => {
    if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
    for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
    player.invSlots = Math.min(26, player.invSlots + 4);
    audio.sfx('upgrade', 0.5);
    panels.refresh();
  },
  mobaTeam: () => mobaSide,
  nearHome: () => nearHome(), // the home building only upgrades in person
  nearSmith: () => nearSmith(), // weapons & gear can only be forged here
  // -- admin mode (singleplayer testing) --
  onBuySupplyUpgrade: (id, cost) => {
    if (player.upgrades[id]) return;
    if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
    for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
    player.upgrades[id] = true;
    audio.sfx('upgrade', 0.5);
    ui.toast('✔ Bought — it works from now on.', 'level');
    panels.refresh();
  },
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
      player.invItems.push(id);
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

let world = new World(scene, game.seed);

const player = new Player(scene, {
  popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
  onHurt: () => ui.hurtFlash(),
  onHiveHit: (hive, res) => {
    if (res.firstHit) {
      // the swarm pours out — ONCE
      const n = 10 + Math.floor(Math.random() * 11); // 10-20
      const prog = progressAt(hive.x, hive.z);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const e = enemyMgr._spawn('bee', hive.x + Math.cos(a) * 1.4, hive.z + Math.sin(a) * 1.4, prog * 0.3);
        e.aggroed = true;
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
  onLevelUp: (level) => {
    audio.sfx('evolve', 0.55);
    player.spawnLevelUpEffect();
    ui.banner('⭐ LEVEL UP!');
    ui.goldFlash();
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
      player.takeDamage(9, { name: 'a temple dart trap' });
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
      player.takeDamage(25, { name: 'an avalanche' });
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

// ---------- whiteout weather: Frozen Peak blizzards & Desert sandstorms ----------
let blizzard = { on: false, t: 0, cd: 45 };
function tickBlizzard(dt) {
  const name = BIOMES[game.biomeIndex]?.name;
  const spec = name === 'Frozen Peak'
      ? { fog: 60, tint: 'rgba(230,238,245,0.62)', dur: 22, cdMin: 70, cdRng: 50,
          on: '🌨️ A BLIZZARD swallows the world — stay close to the bonfires!', off: '🌨️ The blizzard passes…' }
    : name === 'Scorched Desert'
      ? { fog: 70, tint: 'rgba(224,196,130,0.55)', dur: 15, cdMin: 55, cdRng: 45,
          on: '🏜️ A SANDSTORM rolls in — visibility drops!', off: '🏜️ The sandstorm settles…' }
    : name === 'Jungle'
      ? { fog: 80, tint: 'rgba(120,150,170,0.32)', dur: 26, cdMin: 45, cdRng: 40, rain: true,
          on: '🌧️ A jungle downpour opens up!', off: '🌧️ The rain eases off…' }
    : name === 'Murky Swamp'
      ? { fog: 55, tint: 'rgba(150,160,150,0.42)', dur: 30, cdMin: 40, cdRng: 45,
          on: '🌫️ A thick fog rolls across the mire — you can barely see.', off: '🌫️ The fog thins…' }
    : null;
  const el = $id('blizzard');
  if (!spec) {
    if (blizzard.on) { blizzard.on = false; applyViewMode(); }
    el.style.opacity = 0;
    return;
  }
  el.style.background = `radial-gradient(ellipse at center, ${spec.tint.replace(/[\d.]+\)$/, '0.15)')} 0%, ${spec.tint} 100%)`;
  setRain(!!(blizzard.on && spec.rain), dt);
  if (blizzard.on) {
    blizzard.t -= dt;
    scene.fog.far += (spec.fog - scene.fog.far) * Math.min(1, dt * 2);
    el.style.opacity = spec.rain ? 0.28 : 0.55; // rain is a light wash, not a whiteout
    if (blizzard.t <= 0) {
      blizzard.on = false;
      blizzard.cd = spec.cdMin + Math.random() * spec.cdRng;
      applyViewMode(); // restores the mode's fog distance
      ui.toast(spec.off, '');
    }
  } else {
    blizzard.cd -= dt;
    el.style.opacity = 0;
    if (blizzard.cd <= 0) {
      blizzard.on = true;
      blizzard.t = spec.dur;
      ui.toast(spec.on, 'boss');
      audio.sfx('special', 0.4);
    }
  }
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
        player.takeDamage(12, { name: 'a sulfur geyser' });
      }
      for (const e of enemyMgr.alive()) {
        if (Math.hypot(e.pos.x - v.x, e.pos.z - v.z) < 2.6) enemyMgr.damage(e, 15, null, 'local');
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
  4: { fleeSpeed: 24, nestItem: 'highlandNest' }, // Highlands
  7: { fleeSpeed: 36, nestItem: 'frozenNest' },   // Frozen Peak
};
const griffinNextAt = { 1: 90, 4: 90, 7: 90 };    // game.time gate per biome
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
    if (!best || (bi === 4 && h > best.h)) best = { x, z, h };
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
let pendingNest = null; // { id, ghost }
function placeNest(id) {
  if (game.kind !== 'survival' || !inPlay()) return;
  if (!player.invItems.includes(id)) return;
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
// each frame: slide the ghost to the aim point and tint it by validity
function updateNestGhost() {
  if (!pendingNest) return;
  const x = aimPoint.x, z = aimPoint.z;
  pendingNest.ghost.position.set(x, world.heightAt(x, z), z);
  pendingNest.valid = !world.isWater(x, z)
    && biomeIndexAt(x, z) <= itemById(pendingNest.id).nest.biomeMax
    && Math.hypot(x - player.pos.x, z - player.pos.z) < 40;
}
function confirmNestPlacement() {
  if (!pendingNest) return true;
  const id = pendingNest.id, item = itemById(id);
  const x = aimPoint.x, z = aimPoint.z;
  if (world.isWater(x, z)) { ui.toast('🪺 Not on water — the twigs would drift apart.', ''); audio.sfx('error', 0.5); return true; }
  if (biomeIndexAt(x, z) > item.nest.biomeMax) {
    ui.toast(`🪺 The ${item.name} only settles in the ${BIOMES[item.nest.biomeMax].name} or an earlier ring.`, ''); audio.sfx('error', 0.5); return true;
  }
  if (Math.hypot(x - player.pos.x, z - player.pos.z) > 40) { ui.toast('🪺 Too far — pick a spot closer to you.', ''); audio.sfx('error', 0.5); return true; }
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

function nearFlightNest() {
  if (game.kind !== 'survival') return null;
  return flightNests.find(n => Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 5) ?? null;
}

// ---- the flight map: the world map with wing icons on every roost ----
let flightmapOpen = false;
let flightNodes = []; // canvas-space hit targets rebuilt on every draw

function drawFlightMap() {
  const canvas = $id('flightmap-canvas');
  // borrow the discovered-world rendering, forced to the whole-world view
  const saveZoom = minimap.bigZoom, savePX = minimap.bigPanX, savePZ = minimap.bigPanZ;
  minimap.bigZoom = 1;
  minimap.drawBig(canvas, player, mp?.mode === 'coop' ? mp.remote : null);
  minimap.bigZoom = saveZoom; minimap.bigPanX = savePX; minimap.bigPanZ = savePZ;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const toPx = (wx, wz) => ({
    x: ((wx + WORLD.radius) / (WORLD.radius * 2)) * W,
    y: ((wz + WORLD.radius) / (WORLD.radius * 2)) * W,
  });
  flightNodes = [];
  const here = nearFlightNest();
  const nodes = [
    { wx: 0, wz: 0, label: 'Home Camp', icon: '🏠' },
    ...flightNests.map(n => ({ wx: n.x, wz: n.z, label: n.name, icon: '🪽', isHere: n === here })),
  ];
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
  if (flightmapOpen) { audio.sfx('click', 0.4); drawFlightMap(); }
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

// ---------- everburning torch: a warm light bubble in the dark biomes ----------
let torchLight = null, torchFlame = null, torchT = 0;

function tickTorch(dt) {
  const dark = (BIOMES[game.biomeIndex]?.darkness ?? 0) >= 0.35
    || radiusOf(player.pos.x, player.pos.z) < WORLD.caveR + 6;
  const on = game.kind === 'survival' && inPlay()
    && player.upgrades.torch && dark && !player.dead;
  if (on && !torchLight) {
    torchLight = new THREE.PointLight(0xffb45a, 2.2, player.upgrades.torchoil ? 30 : 18, 1.6);
    torchFlame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffc86a }));
    scene.add(torchLight, torchFlame);
  } else if (!on && torchLight) {
    scene.remove(torchLight, torchFlame);
    torchLight.dispose?.();
    torchLight = torchFlame = null;
  }
  if (!torchLight) return;
  torchT += dt;
  const p = player.mesh.position;
  torchLight.position.set(p.x + 0.45, p.y + 2.1, p.z);
  torchFlame.position.copy(torchLight.position);
  // real fire never burns steady
  torchLight.intensity = 2.1 + Math.sin(torchT * 9) * 0.25 + Math.sin(torchT * 23.7) * 0.15;
}

// ---------- desert dust devils: wandering sand vortices that FLING you ----------
let devil = null, devilCd = 45;

function tickDustDevil(dt) {
  if (game.kind !== 'survival' || BIOMES[game.biomeIndex]?.name !== 'Scorched Desert') {
    if (devil) { scene.remove(devil.mesh); devil = null; }
    return;
  }
  if (!devil) {
    devilCd -= dt;
    if (devilCd > 0) return;
    devilCd = 50 + Math.random() * 40;
    const a = Math.random() * Math.PI * 2;
    const x = player.pos.x + Math.cos(a) * 55, z = player.pos.z + Math.sin(a) * 55;
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7 + i * 0.55, 1.6, 7, 1, true),
        new THREE.MeshLambertMaterial({ color: 0xd8bd88, transparent: true,
          opacity: 0.42 - i * 0.06, side: THREE.DoubleSide }));
      cone.position.y = 0.9 + i * 1.5;
      cone.rotation.x = Math.PI; // funnel narrows toward the ground
      g.add(cone);
    }
    g.position.set(x, world.heightAt(x, z), z);
    scene.add(g);
    devil = { mesh: g, t: 22, dir: Math.random() * Math.PI * 2, hitCd: 0 };
    ui.toast('🌪️ A dust devil twists across the sand — don\'t let it catch you!', 'boss');
    return;
  }
  devil.t -= dt;
  devil.hitCd -= dt;
  if (devil.t <= 0) { scene.remove(devil.mesh); devil = null; return; }
  // wanders drunkenly, drifting a little toward the player
  devil.dir += (Math.random() - 0.5) * dt * 1.6;
  const m = devil.mesh;
  const toP = Math.atan2(player.pos.x - m.position.x, player.pos.z - m.position.z);
  m.position.x += (Math.sin(devil.dir) * 4 + Math.sin(toP) * 2) * dt;
  m.position.z += (Math.cos(devil.dir) * 4 + Math.cos(toP) * 2) * dt;
  m.position.y = world.heightAt(m.position.x, m.position.z);
  m.rotation.y += dt * 9;
  const d = Math.hypot(player.pos.x - m.position.x, player.pos.z - m.position.z);
  if (d < 2.4 && devil.hitCd <= 0 && !player.dead && !player.flying) {
    devil.hitCd = 1.5;
    player.takeDamage(8, { name: 'a dust devil' });
    const kx = (player.pos.x - m.position.x) / (d || 1);
    const kz = (player.pos.z - m.position.z) / (d || 1);
    player.pos.x += kx * 5;
    player.pos.z += kz * 5;
    ui.hurtFlash();
    audio.sfx('special', 0.5);
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
  const warm = world.isTargetSafe?.(player.pos);
  const rate = warm ? -0.3 : (player.upgrades.torch ? 0.5 : 1) / 75; // ~75 s to freeze
  coldK = Math.max(0, Math.min(1, coldK + rate * dt));
  if (coldK > 0.55 && !coldWarned) {
    coldWarned = true;
    ui.toast('🥶 You are freezing — find a bonfire, or keep a torch burning!', 'boss');
  }
  if (coldK >= 1) {
    coldTickT -= dt;
    if (coldTickT <= 0) {
      coldTickT = 1;
      player.takeDamage(2, { silent: true });
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
  poi.claimed = true;
  graveEvent = null;
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
        const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique);
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
  if ((player.questDone[bi] ?? 0) !== idx) return; // strictly in order
  player.quest = { ...questFor(bi, idx), count: 0 };
  ui.toast(`📜 Quest accepted: ${player.quest.name}`, 'level');
  audio.sfx('click', 0.5);
  panels.refresh();
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
  q.count += n;
  if (q.count < q.need) { panels.refresh(); return; }
  // done — quests pay XP ONLY, scaled to your level at completion
  player.questDone[q.biome] = (player.questDone[q.biome] ?? 0) + 1;
  player.questHistory.push({ name: q.name, biome: q.biome });
  const xp = questXpFor(player.level);
  player.addXp(xp);
  player.quest = null;
  ui.banner('📜 Quest complete!');
  ui.toast(`📜 ${q.name} — +${xp} XP. The smith has more work for you.`, 'level');
  audio.sfx('victory', 0.45);
  panels.refresh();
}

function trackQuestKill(enemy) {
  const q = player.quest;
  if (!q) return;
  if (q.type === 'kill' && enemy.type === q.target) questProgress();
  else if (q.type === 'boss' && enemy.bossRank > 0
           && biomeIndexAt(enemy.pos.x, enemy.pos.z) === q.biome) questProgress();
  else if (q.type === 'killAny' && !enemy.cfg?.passive
           && biomeIndexAt(enemy.pos.x, enemy.pos.z) === q.biome) questProgress();
}

function grantPickup(kind, payload) {
  if (kind === 'item') {
    const item = itemById(payload);
    player.ownItem(payload);
    ui.toast(item.nest
      ? `🎁 Loot: ${item.icon} ${item.name} — open your bag (C) and CLICK it to place a flight roost.`
      : `🎁 Loot: ${item.icon} ${item.name} — in your bag (equip in Character, C).`, 'level');
    panels.refresh();
  } else if (kind === 'salve' || kind === 'roast' || kind === 'venom' || kind === 'honey') {
    player.consumables[kind] = (player.consumables[kind] ?? 0) + payload;
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2),
      `+${payload} ${consumableById(kind).icon}`, '#c9e8a4');
  } else {
    player[kind] = roundResource(player[kind] + payload);
    const [icon, color] = RES_POPUP[kind];
    ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2), `+${fmtResource(payload)} ${icon}`, color);
    if (player.quest?.type === 'gather' && player.quest.res === kind) questProgress(payload);
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

// the pet is a REAL combat target: enemies chase and hit it through the
// same seam as players, and its bites pull threat onto it
const petProxy = {
  id: 'pet', isPet: true, hitR: 0.5, sizeMult: 1, stunT: 0,
  get pos() { return companions.wolf?.pos ?? null; },
  get mesh() { return companions.wolf?.mesh ?? null; },
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

const enemyMgr = new EnemyManager(scene, world, {
  popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
  onKill: (enemy) => {
    // kill XP is SHARED: every player within 100 m of the kill is rewarded —
    // 75% each when both share, the full amount when only one collects. The
    // +XP counter pops above the CHARACTER, not the corpse.
    const partnerGot = mp?.active && mp.partnerNearKill?.(enemy);
    const nearMe = !player.dead
      && Math.hypot(player.pos.x - enemy.pos.x, player.pos.z - enemy.pos.z) < 100;
    const meGot = nearMe || (!partnerGot && enemy.lastHitBy !== 'partner');
    const xp = Math.max(1, Math.round(enemy.xp * (meGot && partnerGot ? 0.75 : 1)));
    if (partnerGot) mp.sendKillXp(xp);
    if (meGot) {
      player.kills++;
      player.addXp(xp);
      ui.popup(player.mesh.position.clone().setY(player.mesh.position.y + 2.3), `+${xp} XP`, '#c9a4ff');
    }
    trackQuestKill(enemy);
    // meat falls to the ground and is magnet-collected (shared in co-op)
    const piles = Math.min(4, Math.max(1, Math.round(enemy.meat / 2)));
    let left = enemy.meat;
    for (let i = 0; i < piles; i++) {
      const amount = i === piles - 1 ? left : Math.ceil(enemy.meat / piles);
      left -= amount;
      pickups.spawn('meat', amount, enemy.pos, 0.9 * enemy.sizeMult);
    }
    // big animals always drop their full hide (even if they chased you back
    // into the Verdant Forest); small critters there — and bats — leave a
    // scrap, with an occasional whole pelt so Lv3 hide gear is reachable early
    if (enemy.type === 'sheep') pickups.spawn('wool', 1 + (Math.random() < 0.5 ? 1 : 0), enemy.pos, 0.8);
    if (enemy.type === 'snapper' && Math.random() < 0.65) pickups.spawn('venom', 1, enemy.pos, 0.7);
    if (HIDE_BEARING.has(enemy.type)) {
      pickups.spawn('hide', hideForHp(enemy.maxHp), enemy.pos, 1.1 * enemy.sizeMult);
    } else if (biomeIndexAt(enemy.pos.x, enemy.pos.z) === 0 || enemy.type === 'bat') {
      pickups.spawn('hide', Math.random() < 0.1 ? 1 : VERDANT_HIDE_DROP, enemy.pos, 0.9);
    }
    // deep-woods kills bleed Ethereal Essence — the arcane currency
    if (!enemy.cfg.passive) {
      const ess = essenceDropFor(biomeIndexAt(enemy.pos.x, enemy.pos.z));
      if (ess > 0) pickups.spawn('essence', ess, enemy.pos, 0.8);
    }
    if (enemy.lairDrop) {
      // a NAMED lair boss: its unique item is GUARANTEED, plus a fat cache
      pickups.spawn('item', enemy.lairDrop, enemy.pos, 0.4);
      pickups.spawn('essence', 5, enemy.pos, 1.2);
      const poi = world.pois?.find(p => p.id === enemy.lairId);
      if (poi) { poi.claimed = true; minimap.redrawT = 0; }
      ui.banner(`— ${enemy.bossName} falls! —`);
      ui.toast(`🏆 ${enemy.bossName} is slain — its unique treasure is yours!`, 'level');
      audio.sfx('victory', 0.6);
    } else if (enemy.bossRank > 0) rollBossDrop(enemy);
  },
  onDiscover: discoverType,
  onBossSpawn: (enemy) => {
    const skulls = '💀'.repeat(enemy.bossRank);
    ui.addTracker('boss' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 2.6 * enemy.sizeMult) : null,
      `<div class="boss-name">${enemy.bossName ?? ''}</div>${skulls}`, 'skulls');
    // herd-guardian ambush bosses stay quiet — finding them is the surprise
    if (!enemy.ambush) {
      ui.toast(`${skulls} ${enemy.bossName ?? 'A pack mother'} appears! Her children keep coming until she falls.`, 'boss');
      ui.hurtFlash();
      shakeT = 0.35; // the ground trembles when a mother arrives
    }
  },
  onBossDeath: (enemy) => ui.removeTracker('boss' + enemy.id),
  // HP bar above every enemy (+ spell charge bar for casters)
  onSpawn: (enemy) => {
    const ranged = enemy.cfg.ranged;
    const shotColor = ranged ? '#' + enemy.cfg.shotColor.toString(16).padStart(6, '0') : '';
    const label = enemy.bossName ?? enemy.cfg.name;
    const html = '<div class="hpbar"><div class="hpbar-fill"></div></div>' +
      (ranged ? `<div class="castbar"><div class="castbar-fill" style="background:${shotColor}"></div></div>` : '') +
      `<div class="unit-name">${label}</div>`;
    ui.addTracker('hp' + enemy.id,
      () => enemy.mesh.parent ? enemy.mesh.position.clone().setY(enemy.mesh.position.y + 1.5 * enemy.sizeMult + 0.5) : null,
      html, 'hpwrap' + (enemy.bossRank > 0 ? ' boss' : ''),
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
  // a beaten griffin drops its nest and flees; it may return in ~20 minutes
  onGriffinEscape: (enemy) => {
    pickups.spawn('item', enemy.nestItem ?? 'desertNest', enemy.pos, 0.8);
    if (enemy.griffinBiome != null) griffinNextAt[enemy.griffinBiome] = game.time + 1200;
    ui.banner('🪽 The griffin yields!');
    ui.toast('🪺 Beaten, the griffin drops its NEST and flees beyond the horizon. Place the nest to make a flight roost!', 'level');
    audio.sfx('victory', 0.5);
  },
});

const projectiles = new Projectiles(scene);
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
    const candidates = ITEMS.filter(i =>
      !i.free && !i.unique && !player.hasItem(i.id) && i.level <= player.level + 1
      && i.slot !== 'companion');
    if (!candidates.length) { pickups.spawn('meat', 5, enemy.pos, 1); return; }
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    pickups.spawn('item', item.id, enemy.pos, 0.5);
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
      // island treasure scales with the biome ring — deep islands pay deep
      const bi = biomeIndexAt(lake.x, lake.z);
      const k = 1 + bi * 0.6;
      pickups.spawn('meat', Math.round(8 * k), at, 1.2);
      pickups.spawn('stone', Math.round(6 * k), at, 1.2);
      pickups.spawn('hide', Math.round(3 * k), at, 1.2);
      if (bi >= 3) pickups.spawn('iron', 2 + bi, at, 1.2);
      if (Math.random() < 0.4 + bi * 0.06) {
        const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique);
        pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, at, 0.6);
      }
    };
    // crypts, jungle temples and the summit come pre-garrisoned with a
    // silent guard pack — the summit's keeper is a colossal named boss
    world.onPoiSpawned = (poi) => {
      if (poi.claimed || poi.guarded) return;
      if (!['crypt', 'temple', 'summit', 'lair'].includes(poi.type)) return;
      if (mp?.active && !mp.isHost) return; // host simulates the guards
      poi.guarded = true;
      const biome = BIOMES[biomeIndexAt(poi.x, poi.z)];
      const type = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
      const progress = progressAt(poi.x, poi.z);
      if (poi.type === 'lair') {
        // a biome's NAMED boss, roosting in its lair with a guaranteed unique drop
        const lair = BIOME_LAIRS[poi.ring];
        if (!lair) return;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const g = enemyMgr._spawn(type, poi.x + Math.cos(a) * 5, poi.z + Math.sin(a) * 5, progress);
          g.aggroed = false; g.cryptId = poi.id;
        }
        const boss = enemyMgr._spawn(lair.type, poi.x, poi.z - 4, progress, 3, { ambush: true });
        boss.bossName = lair.name;
        boss.lairDrop = lair.drop;   // guaranteed unique on death
        boss.lairId = poi.id;
        boss.aggroed = false; boss.cryptId = poi.id;
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
      const count = poi.type === 'temple' ? 6 : 4 + rank;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const g = enemyMgr._spawn(type, poi.x + Math.cos(a) * 4.5, poi.z + Math.sin(a) * 4.5, progress);
        g.aggroed = false;
        g.cryptId = poi.id;
      }
      const boss = enemyMgr._spawn(type, poi.x + 3, poi.z + 3, progress, rank,
        { ambush: true, noReinforce: true });
      boss.aggroed = false;
      boss.cryptId = poi.id;
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
  applyCampPerks();
  panels.refresh();
  mp?.sendCampSync?.();
}

// era perks: hp bonus + magnet reach + chop power + XP gain
function applyCampPerks() {
  if (!camp) return;
  player.campBonus = camp.homeHpBonus();
  player.chopMult = camp.chopMult();
  player.xpMult = camp.xpMult();
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
  audio.stopMusic(); setAmbience(null);
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
    const dropped = Math.floor(player[res] / 2); // whole numbers only
    player[res] = 0;
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
function survivalRespawn() {
  minimap.deathAt = { x: player.pos.x, z: player.pos.z }; // mark the death spot
  const dropped = dropHalfMeat(player.pos.clone());
  player.loseLevel();
  player.mesh.rotation.z = Math.PI / 2; // lie down while "out"
  audio.sfx('defeat', 0.5);
  const by = player.killedBy || 'the wilds';
  const surv = Math.floor(game.time / 60), survS = Math.floor(game.time % 60);
  ui.banner(`☠️ Slain by ${by}`);
  ui.toast(`☠️ Slain by ${by} · Lv ${player.level} · survived ${surv}:${String(survS).padStart(2, '0')} · this level's XP progress is gone, ${dropped} loot spilled. Chest storage is safe.`, 'boss');
  player.killedBy = null;
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

  // RPG third-person view: camera, fog and view distance all switch together
  const rpgBox = $id('set-rpgview');
  settings.rpgView ??= false;
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
  settings.mouseLook ??= false;
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

  // graphics: only ground texture detail is user-facing now. Bloom is OFF by
  // default (it dulled the image), and the shadow/filmic toggles are gone.
  settings.bloom = false;
  settings.hiShadows = false;
  settings.filmic = false;
  settings.texDetail ??= 0;
  $id('set-texdetail').value = String(settings.texDetail);
  applyGraphics();
  const saveGfx = () => {
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

  // show the room code so a friend can join the running game; admin mode
  // is offered only in singleplayer (it would wreck a shared session)
  $id('settings-btn').addEventListener('click', () => {
    $id('set-mpcode').textContent = (mp?.active && mpCode) ? mpCode : '— (not in a multiplayer game)';
    $id('admin-row').style.display = (DEVMODE && game.kind === 'survival' && !mp?.active) ? '' : 'none';
    $id('set-admin').checked = !!game.adminMode;
    // cloud save/load is only offered inside a co-op survival game while signed in
    const canCloud = mp?.active && mp.mode === 'coop' && game.kind === 'survival';
    const cloudRow = $id('cloud-row');
    cloudRow.style.display = canCloud ? '' : 'none';
    $id('cloud-who').textContent = authUser ? `— ${authUser.name}` : '— sign in on the menu first';
    $id('set-savegame').disabled = !authUser;
    $id('set-loadgame').disabled = !authUser;
  });
  $id('set-savegame').addEventListener('click', saveGameCloud);
  $id('set-loadgame').addEventListener('click', openLoadGame);
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
function openGate() { $id('auth-gate').classList.remove('gone'); }
function passGate() { $id('auth-gate').classList.add('gone'); }

// ?devmode skips the gate entirely (for local testing without Google set up)
if (DEVMODE) {
  passGate();
} else {
  // watch the session: signed in → drop the gate; signed out → keep it up
  (async () => {
    try {
      (await ensureAuth()).watch((u) => {
        authUser = u;
        if (u) passGate(); else openGate();
      });
    } catch (e) {
      $id('gate-msg').textContent = 'Could not reach Google sign-in: ' + (e?.message || e);
    }
  })();
  $id('gate-signin').addEventListener('click', async () => {
    const msg = $id('gate-msg');
    msg.textContent = 'Opening Google…';
    try {
      const a = await ensureAuth();
      authUser = await a.signIn();
      passGate();
    } catch (e) {
      msg.textContent = 'Sign-in failed: ' + (e?.message || e);
    }
  });
}

// serialize the essentials of the current character + camp
function serializeState() {
  const p = player;
  const data = {
    level: p.level, xp: p.xp, hp: Math.round(p.hp),
    res: Object.fromEntries(RESOURCES.map(k => [k, p[k] || 0])),
    equipment: { ...p.equipment },
    invItems: [...p.invItems],
    consumables: { ...p.consumables },
    stats: { ...p.stats },
    spellsOwned: [...p.spellsOwned],
    spellSlots: p.spellSlots.map(s => s ?? null),
    upgrades: { ...p.upgrades },
    invSlots: p.invSlots,
    questDone: { ...p.questDone },
    questHistory: [...p.questHistory],
    quest: p.quest ? { ...p.quest } : null,
    shrineBonus: p.shrineBonus || 0,
    camp: camp ? { levels: { ...camp.levels }, storage: { ...camp.storage } } : null,
    biomeIndex: game.biomeIndex,
  };
  return JSON.parse(JSON.stringify(data)); // strip undefined for Firebase
}

async function saveGameCloud() {
  if (!authUser) { ui.toast('Sign in first (on the menu).', 'boss'); return; }
  if (!(mp?.active && mp.mode === 'coop' && game.kind === 'survival')) {
    ui.toast('You can only save inside a co-op survival game.', 'boss'); return;
  }
  try {
    await (await ensureAuth()).saveGame(
      { biome: BIOMES[game.biomeIndex].name, level: player.level }, serializeState());
    ui.toast('💾 Game saved to the cloud!', 'level');
    audio.sfx('upgrade', 0.5);
  } catch (e) { ui.toast('Save failed: ' + (e?.message || e), 'boss'); }
}

async function openLoadGame() {
  if (!authUser) { ui.toast('Sign in first (on the menu).', 'boss'); return; }
  $id('loadgame').classList.remove('hidden');
  const list = $id('loadgame-list'), empty = $id('loadgame-empty');
  list.innerHTML = ''; empty.textContent = 'Loading your saves…'; empty.style.display = '';
  try {
    const saves = await (await ensureAuth()).listSaves();
    if (!saves.length) { empty.textContent = 'No saves yet — hit Save first.'; return; }
    empty.style.display = 'none';
    for (const sv of saves) {
      const row = document.createElement('div');
      row.className = 'save-row';
      const when = new Date(sv.at).toLocaleString();
      row.innerHTML = `<div class="save-meta"><b>${sv.biome ?? '?'} · Lv ${sv.level ?? '?'}</b>
        <div class="save-when">${when}</div></div>
        <button class="mini-btn" data-load="${sv.id}">📂 Load</button>
        <button class="mini-btn" data-del="${sv.id}">🗑</button>`;
      row.querySelector('[data-load]').addEventListener('click', () => doLoad(sv.id));
      row.querySelector('[data-del]').addEventListener('click', async () => {
        try { await (await ensureAuth()).deleteSave(sv.id); row.remove(); } catch {}
      });
      list.appendChild(row);
    }
  } catch (e) { empty.textContent = 'Could not load saves: ' + (e?.message || e); }
}

async function doLoad(id) {
  try {
    const data = await (await ensureAuth()).loadSave(id);
    if (!data) { ui.toast('That save is empty.', 'boss'); return; }
    applyLoadedState(data);
    $id('loadgame').classList.add('hidden');
  } catch (e) { ui.toast('Load failed: ' + (e?.message || e), 'boss'); }
}

function applyLoadedState(d) {
  const p = player;
  p.level = Math.max(1, Math.min(MAX_LEVEL, d.level ?? 1));
  p.xp = d.xp ?? 0;
  for (const k of RESOURCES) p[k] = d.res?.[k] ?? 0;
  p.equipment = { weapon: 'fists', head: null, chest: null, boots: null, charm: null, companion: null, ...(d.equipment || {}) };
  p.invItems = Array.isArray(d.invItems) ? d.invItems.filter(Boolean) : [];
  p.consumables = { salve: 0, roast: 0, honey: 0, ...(d.consumables || {}) };
  p.stats = { range: 0, power: 0, swift: 0, pet: 0, gather: 0, ...(d.stats || {}) };
  p.spellsOwned = new Set(d.spellsOwned || []);
  p.spellSlots = Array.isArray(d.spellSlots) ? d.spellSlots.map(s => s ?? undefined) : [];
  p.upgrades = { ...(d.upgrades || {}) };
  if (d.invSlots) p.invSlots = d.invSlots;
  p.questDone = { ...(d.questDone || {}) };
  p.questHistory = Array.isArray(d.questHistory) ? d.questHistory : [];
  p.quest = d.quest || null;
  p.shrineBonus = d.shrineBonus || 0;
  if (camp && d.camp) {
    Object.assign(camp.levels, d.camp.levels || {});
    Object.assign(camp.storage, d.camp.storage || {});
    if (camp.levels.home > 0) world.buildHome(camp.levels.home);
    for (const id of ['chest', 'furnace', 'boat', 'tower', 'banner', 'grave']) {
      if ((camp.levels[id] || 0) > 0) { try { camp._placeMesh(id); } catch {} }
    }
    applyCampPerks();
  }
  p.recompute();
  p.hp = Math.min(p.maxHp, d.hp ?? p.maxHp);
  companions.sync(player);
  panels.refresh();
  ui.banner('☁️ Save loaded');
  ui.toast('☁️ Your character has been restored into this game.', 'level');
  audio.sfx('victory', 0.4);
}
$id('loadgame').querySelector('.panel-close').addEventListener('click', () => $id('loadgame').classList.add('hidden'));

async function ensureMp() {
  if (!mp) {
    const { Multiplayer } = await import('./multiplayer.js');
    mp = new Multiplayer({
      scene, player, enemyMgr, pickups, projectiles, ui, panels, game, input,
      get world() { return world; }, // MOBA swaps the world object at begin
      get camp() { return camp; },
      get petTarget() { return (companions.wolf && !player.petDead) ? petProxy : null; },
      popup: (pos, text, color, cls) => ui.popup(pos, text, color, cls),
      onDiscover: discoverType,
      grantPickup,
      dropHalfMeat,
      markDeath: (pos) => { minimap.deathAt = { x: pos.x, z: pos.z }; },
      startPlaying,
      showPing: (x, z) => showPing(x, z),
      // shared base: apply the partner's camp levels/storage locally
      onCampSync: (lv, st, gp) => {
        if (!camp || !lv) return;
        if (gp) camp.gravePos = gp;
        for (const [id, v] of Object.entries(lv)) {
          while ((camp.levels[id] ?? 0) < v) {
            camp.levels[id]++;
            camp._placeMesh(id, id === 'grave' ? gp : undefined);
          }
        }
        if (st) Object.assign(camp.storage, st);
        applyCampPerks();
        panels.refresh();
        ui.toast('🏕️ Camp updated by your partner.', '');
      },
      onCoopWin: () => {
        if (game.mode !== 'play') return;
        game.mode = 'won';
        audio.stopMusic(); setAmbience(null);
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
}
$id('mode-survival-btn').addEventListener('click', () => showModeOptions('survival'));
$id('mode-moba-btn').addEventListener('click', () => showModeOptions('moba'));
$id('mode-back-btn').addEventListener('click', () => {
  audio.sfx('click', 0.4);
  resetLobbyUI();
  $id('mode-options').classList.add('hidden');
  $id('mode-select').classList.remove('hidden');
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
  $id('mp-code-display').title = 'Click to copy';
  $id('mp-code-display').style.cursor = 'pointer';
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
  if (player.invFullFor(id)) { ui.toast('🎒 Inventory full — drop or use something first.', ''); audio.sfx('error', 0.5); return; }
  if (item.needs && camp && !camp.has(item.needs)) return; // era gate (survival)
  const cost = costFor(item.cost, game.kind === 'moba');
  if (!Object.entries(cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(cost)) player[k] = roundResource(player[k] - v);
  player.ownItem(id);
  ui.toast(`🎒 ${item.name} is in your bag — equip it in Character (C).`, 'level');
  audio.sfx('purchase', 0.5);
  panels.refresh();
  panels.flashCard(item.name);
}

function buySpell(id) {
  const spell = spellById(id);
  if (!spell || player.spellsOwned.has(id) || player.level < spell.level) return;
  if (!Object.entries(spell.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(spell.cost)) player[k] = roundResource(player[k] - v);
  player.ownSpell(id);
  audio.sfx('upgrade', 0.5);
  panels.refresh();
  panels.flashCard(spell.name);
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
  panels.flashCard(track.name);
}

function buyConsumable(id) {
  const c = consumableById(id);
  if (!c) return;
  if (!Object.entries(c.cost).every(([k, v]) => player[k] >= v)) { audio.sfx('error', 0.5); return; }
  for (const [k, v] of Object.entries(c.cost)) player[k] = roundResource(player[k] - v);
  player.consumables[id] = (player.consumables[id] ?? 0) + 1;
  audio.sfx('purchase', 0.5);
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

// action bar 1–6: spells cast, items EQUIP
function useBarSlot(i) {
  const id = player.spellSlots[i];
  if (!id) return;
  if (spellById(id)) player.castSpell(i, { enemyMgr: combatMgr() });
  else if (itemById(id)) player.equip(id);
  ui.flashSpell(i);
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
// M / minimap click → the big world map (mute moved to Settings)
let bigmapOpen = false;
let bigmapT = 0;
function toggleBigMap(force) {
  if (game.kind !== 'survival' || game.mode !== 'play') { bigmapOpen = false; return; }
  bigmapOpen = force !== undefined ? force : !bigmapOpen;
  $id('bigmap').classList.toggle('hidden', !bigmapOpen);
  if (bigmapOpen) {
    audio.sfx('click', 0.4);
    minimap.bigPanX = minimap.bigPanZ = 0; // reopen centered on the player
    minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.remote : null);
  }
}
input.onKey('KeyM', () => toggleBigMap());
$id('minimap').addEventListener('click', () => toggleBigMap());

// click & drag the big map with the mouse to pan around (when zoomed in)
{
  const bigCanvas = $id('bigmap-canvas');
  let dragFrom = null;
  bigCanvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragFrom = { x: e.clientX, y: e.clientY };
    bigCanvas.setPointerCapture(e.pointerId);
    bigCanvas.classList.add('dragging');
  });
  bigCanvas.addEventListener('pointermove', (e) => {
    if (!dragFrom) return;
    // clientX is CSS px; the canvas may be shrunk by max-width — rescale
    const css2px = bigCanvas.width / (bigCanvas.clientWidth || bigCanvas.width);
    const s = minimap.bigScale || 1;
    minimap.bigPanX -= ((e.clientX - dragFrom.x) * css2px) / s;
    minimap.bigPanZ -= ((e.clientY - dragFrom.y) * css2px) / s;
    dragFrom = { x: e.clientX, y: e.clientY };
    minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.remote : null);
  });
  const stopDrag = () => { dragFrom = null; bigCanvas.classList.remove('dragging'); };
  bigCanvas.addEventListener('pointerup', stopDrag);
  bigCanvas.addEventListener('pointercancel', stopDrag);
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
    minimap.drawBig(bigCanvas, player, mp?.mode === 'coop' ? mp.remote : null);
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
  return game.kind === 'survival' && camp?.has('chest')
    && Math.hypot(player.pos.x - 6, player.pos.z - 16) < 4;
}
function nearPoi() {
  if (game.kind !== 'survival') return null;
  return world.poisNear?.(player.pos.x, player.pos.z, 4).find(p => !p.claimed) ?? null;
}
function nearSmith() {
  return game.kind === 'survival' && !!world.smithNear?.(player.pos.x, player.pos.z, 4.5);
}
function nearTreasure() {
  return game.kind === 'survival' && player.treasureAt
    && Math.hypot(player.pos.x - player.treasureAt.x, player.pos.z - player.treasureAt.z) < 5;
}

// landmark rewards: shrines bless, monoliths pay out, crypts must be cleared
function claimPoi(poi) {
  if (['crypt', 'temple', 'summit', 'lair'].includes(poi.type)) {
    const guards = enemyMgr.alive().filter(e => e.cryptId === poi.id);
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
    }
    ui.toast('🔥 You warm up by the bonfire — fully healed, and this camp is safe now.', 'level');
    audio.sfx('evolve_ready', 0.5);
    return;
  }
  poi.claimed = true;
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
    const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique);
    pickups.spawn('item', c[Math.floor(Math.random() * c.length)].id, at, 0.6);
    ui.banner('— The temple treasury is yours —');
    audio.sfx('victory', 0.5);
  } else if (poi.type === 'summit') {
    const xp = questXpFor(player.level) * 3;
    player.addXp(xp);
    pickups.spawn('essence', 15, at, 2);
    pickups.spawn('iron', 12, at, 2);
    const cc = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique);
    for (let i = 0; i < 2; i++) pickups.spawn('item', cc[Math.floor(Math.random() * cc.length)].id, at, 1);
    ui.banner('— ⛰️ THE SUMMIT IS YOURS —');
    ui.toast(`⛰️ You raise your banner over the world: +${xp} XP. There is nothing above you now.`, 'level');
    audio.sfx('victory', 0.7);
  } else if (poi.type === 'nest') {
    pickups.spawn('essence', 2 + ring, at, 1.2);
    pickups.spawn('iron', 3 + ring, at, 1.2);
    if (Math.random() < 0.3) {
      const c = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique);
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
    const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique && !player.hasItem(i.id));
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
    const candidates = ITEMS.filter(i => !i.free && i.slot !== 'companion' && !i.unique && !player.hasItem(i.id));
    if (candidates.length) {
      pickups.spawn('item', candidates[Math.floor(Math.random() * candidates.length)].id, t, 0.6);
    }
  }
  player.treasureAt = null;
  minimap.treasureAt = null;
  ui.toast('💰 You dug up the treasure!', 'level');
  audio.sfx('victory', 0.5);
}

input.onKey('KeyE', () => {
  if (!inPlay()) return;
  if (player.mounted) { dismountHorse(); return; } // E or X gets you off the horse
  if (mp?.revivablePartner?.()) { // co-op: helping a downed friend wins
    const t = mp.remote.targetPos;
    startChannel(2, '💚 Reviving partner…', { x: t.x, z: t.z }, () => mp.tryRevivePartner());
    return;
  }
  if (nearChest()) panels.toggle('chest');
  else if (nearHome()) panels.toggle('base');
  else if (nearWildHorse()) tameHorse(nearWildHorse());
  else if (nearParkedHorse()) { mountUp(); audio.sfx('click', 0.5); }
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
});

// H — the keybind legend; I — inventory; F / G — field consumables
input.onKey('KeyH', () => { if (inPlay()) panels.toggle('help'); });
input.onKey('KeyI', () => { if (inPlay()) panels.toggle('character'); }); // inventory lives in the Armory
input.onKey('KeyF', () => {
  if (!inPlay() || game.paused) return;
  if (!player.useConsumable('salve') && player.consumables.salve <= 0) {
    ui.toast('🧪 No Healing Salve — buy some in Upgrades → Supplies.', '');
  }
});
input.onKey('KeyG', () => {
  if (!inPlay() || game.paused) return;
  if (!player.useConsumable('roast') && player.consumables.roast <= 0) {
    ui.toast('🍗 No Roasted Meat — buy some in Upgrades → Supplies.', '');
  }
});

// ---- pet: resurrection (R at home / the graveyard) & mode cycling (P) ----
function nearGrave() {
  return camp?.gravePos
    && Math.hypot(player.pos.x - camp.gravePos.x, player.pos.z - camp.gravePos.z) < 6;
}

// resurrection costs 10% of everything invested in the pet (item + training)
function petResurrectCost() {
  const item = itemById(player.equipment.companion);
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
  return game.kind === 'survival' && player.petDead
    && itemById(player.equipment.companion)?.pet
    && !player.dead && (nearHome() || nearGrave());
}

input.onKey('KeyX', () => { if (game.mode === 'play' && player.mounted) dismountHorse(); });

input.onKey('KeyR', () => {
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
});

const PET_MODES = ['aggressive', 'defensive', 'passive'];
const PET_MODE_LABEL = {
  aggressive: '🗡️ Aggressive — attacks anything near you',
  defensive: '🛡️ Defensive — only fights what attacks you',
  passive: '💤 Passive — never attacks',
};
input.onKey('KeyP', () => {
  if (!inPlay() || !itemById(player.equipment.companion)?.pet) return;
  player.petMode = PET_MODES[(PET_MODES.indexOf(player.petMode) + 1) % PET_MODES.length];
  ui.toast(`🐺 Pet mode: ${PET_MODE_LABEL[player.petMode]}`, 'level');
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
for (const [btnId, d] of [['bigmap-zoomin', 1], ['bigmap-zoomout', -1]]) {
  $id(btnId).addEventListener('click', () => {
    minimap.bigZoomBy?.(d);
    minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.remote : null);
  });
}
$id('respawn-cave').addEventListener('click', () => reviveAt('cave'));
$id('respawn-grave').addEventListener('click', () => reviveAt('grave'));
for (let i = 0; i < 6; i++) {
  input.onKey('Digit' + (i + 1), () => {
    if (!inPlay() || game.paused) return;
    useBarSlot(i);
  });
}
input.onKey('Escape', () => {
  if (!inPlay()) return;
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
  if (!player.upgrades.saddle || player.mounted || game.kind !== 'survival') return null;
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
  ui.toast('🐴 Saddled! +9 speed while riding — you cannot attack. X to dismount.', 'level');
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

function updateAim() {
  if (game.rpgView) {
    // third person: you strike what's in FRONT of you — aim rides the facing
    aimPoint.set(player.pos.x + player.facing.x * player.attackRange,
      0, player.pos.z + player.facing.z * player.attackRange);
  } else {
    // normal free cursor: the aim point is exactly where the mouse hits the
    // ground, and the player simply faces it (no clamping)
    raycaster.setFromCamera(new THREE.Vector2(input.mouse.x, input.mouse.y), camera);
    raycaster.ray.intersectPlane(groundPlane, aimPoint);
  }

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

// biomes with teeth announce their hazard the first time you step in
const BIOME_HAZARD_NOTES = {
  'Murky Swamp': '🛶 Deep black water everywhere — without a boat the swamp will not let you through.',
  'Haunted Forest': '☠️ Zombie claws fester: their hits poison you for a few seconds.',
  'Frozen Peak': '❄️ The cold gnaws at you — keep moving, warm up at bonfires (a torch helps too).',
};
let envSpeedMult = 1;
let biomeLightK = 1; // smoothed per-biome light dimming factor

// per-biome music: the big hour-long tracks stream lazily on first entry
const BIOME_MUSIC = [
  'level1',            // 0 Verdant Forest
  'biome_desert',      // 1 Scorched Desert
  'biome_darkforest',  // 2 Dark Forest
  'biome_swamp',       // 3 Murky Swamp
  'biome_highlands',   // 4 Highlands
  'biome_darkforest',  // 5 Haunted Forest
  'biome_jungle',      // 6 Jungle
  'level3',            // 7 Frozen Peak
];

// living soundscape: each biome breathes its own nature ambience loop, laid
// UNDER the music. Verdant sings with birds, the swamp croaks, the peaks howl.
const BIOME_AMBIENCE = [
  'forest_ambience', // 0 Verdant — birdsong & leaves
  'wind_ambience',   // 1 Scorched Desert — hot whistling wind
  null,              // 2 Dark Forest — eerie hush (the gloom sells it)
  'swamp_ambience',  // 3 Murky Swamp — frogs & bubbling
  'wind_ambience',   // 4 Highlands — open windswept moor
  null,              // 5 Haunted Forest — dead silence
  'forest_ambience', // 6 Jungle — dense birds & insects
  'wind_ambience',   // 7 Frozen Peak — howling gale
];
let ambienceName = null;
function setAmbience(name) {
  if (name === ambienceName) return;
  if (ambienceName) audio.loopStop(ambienceName);
  ambienceName = name;
  if (name) audio.loopStart(name, 0.32);
}

// ---------- waypoint compass: an arrow pointing to the map flag ----------
const _wpFwd = new THREE.Vector3();
function updateWaypoint() {
  const arrow = $id('waypoint-arrow');
  const wp = minimap.waypoint;
  if (!wp || game.mode !== 'play') { arrow.classList.add('hidden'); return; }
  const dx = wp.x - player.pos.x, dz = wp.z - player.pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 6) { // arrived — retire the flag
    minimap.waypoint = null; minimap.redrawT = 0;
    arrow.classList.add('hidden');
    ui.toast('📍 Waypoint reached.', '');
    return;
  }
  camera.getWorldDirection(_wpFwd); _wpFwd.y = 0;
  const fl = Math.hypot(_wpFwd.x, _wpFwd.z) || 1; _wpFwd.x /= fl; _wpFwd.z /= fl;
  // signed angle from camera-forward to the target (0 = dead ahead / up)
  const ang = Math.atan2(_wpFwd.x * dz - _wpFwd.z * dx, _wpFwd.x * dx + _wpFwd.z * dz);
  arrow.classList.remove('hidden');
  arrow.querySelector('.wp-tri').style.transform = `rotate(${ang}rad)`;
  arrow.querySelector('.wp-dist').textContent = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
}

// ---------- day / night cycle ----------
// A full day is DAY_LENGTH seconds. game.tod runs 0..1 (0 = midnight,
// 0.5 = noon). nightK is a smooth 0 (day) .. 1 (deep night) used to dim the
// world lights, tint the sky, swell spawns/aggro and scatter fireflies.
const DAY_LENGTH = 600; // 10 real minutes per in-game day
const nightFlies = [];
let fireflyGeo = null, fireflyMat = null, starField = null;
function tickDayNight(dt) {
  game.tod = (game.tod + dt / DAY_LENGTH) % 1;
  // sun elevation: -1 midnight, +1 noon → dayness in [0,1]
  const elev = Math.sin(game.tod * Math.PI * 2 - Math.PI / 2);
  const dayness = Math.max(0, Math.min(1, elev * 1.6 + 0.5));
  game.nightK = 1 - dayness;
  if (enemyMgr) enemyMgr.nightK = game.nightK;

  // HUD clock: a sun that sets into a moon
  const clock = $id('tod-clock');
  if (clock) {
    const icon = game.nightK > 0.75 ? '🌙' : game.nightK > 0.45 ? '🌆' : game.nightK > 0.2 ? '🌤️' : '☀️';
    const hh = Math.floor(((game.tod + 0.5) % 1) * 24); // tod 0 = 00:00 midnight
    clock.textContent = `${icon} ${String(hh).padStart(2, '0')}:00`;
  }

  // screen darkening
  $id('night-tint').style.opacity = (game.nightK * 0.6).toFixed(2);

  // stars fade in on the night sky (a static field parked on the camera)
  if (!starField) {
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // scatter over the upper dome, well beyond the world but inside camera.far
      const a = Math.random() * Math.PI * 2, el = Math.random() * 0.9 + 0.08, r = 240;
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

function updateAtmosphere(dt) {
  const idx = biomeIndexAt(player.pos.x, player.pos.z);
  if (idx !== game.biomeIndex) {
    game.biomeIndex = idx;
    const biome = BIOMES[idx];
    ui.banner(`— ${biome.name} —`);
    audio.sfx('lane_unlock', 0.5);
    audio.playMusic(BIOME_MUSIC[idx] ?? 'level3');
    const note = BIOME_HAZARD_NOTES[biome.name];
    if (note) ui.toast(note, 'boss');
  }
  // ambience: the cave near home overrides the biome; open water laps under it
  const rHome = Math.hypot(player.pos.x, player.pos.z);
  const onWater = world.isWater?.(player.pos.x, player.pos.z);
  setAmbience(rHome < 34 ? 'cave_ambience'
    : onWater ? 'water_lapping'
    : BIOME_AMBIENCE[game.biomeIndex] ?? null);
  envSpeedMult = world.swampZone?.(player.pos.x, player.pos.z) === 'mud' ? 0.78 : 1;
  $id('biome-gloom').style.opacity = BIOMES[game.biomeIndex].darkness ?? 0;
  envSpeedMult *= Math.min(
    enemyMgr?.webSlowAt?.(player.pos.x, player.pos.z) ?? 1,
    world.webSlowAt?.(player.pos.x, player.pos.z) ?? 1);
  // thick wool socks: mud and webs only bite half as hard
  if (player.upgrades.socks) envSpeedMult = 1 - (1 - envSpeedMult) * 0.5;
  // Frozen Peak chill: stiff, frozen legs move up to 30% slower
  envSpeedMult *= 1 - 0.3 * coldK;
  const biome = BIOMES[game.biomeIndex];

  // the cave is dark; light floods in as you walk toward the mouth
  const r = radiusOf(player.pos.x, player.pos.z);
  // the cave is pitch dark — but once a home is BUILT over it, it's lit
  const caveK = (camp?.levels.home ?? 0) > 0 ? 0
    : Math.max(0, Math.min(1, (WORLD.caveR + 6 - r) / (WORLD.caveR + 3)));
  // gloomy biomes (Dark Forest, Haunted Forest, swamp) dim the world lights
  // themselves — the screen overlay alone left the geometry too bright
  biomeLightK += (Math.min(1, biome.light ?? 1) - biomeLightK) * Math.min(1, dt * 1.5);
  const nightK = game.nightK || 0;
  hemi.intensity = (0.9 - 0.62 * caveK) * biomeLightK * (1 - 0.68 * nightK);
  sun.intensity = 1.4 * (1 - 0.8 * caveK) * biomeLightK * (1 - 0.85 * nightK);
  // warm the sun at dawn/dusk, silver it at deep night
  const dusk = Math.max(0, 1 - Math.abs(nightK - 0.5) * 4); // peaks at the twilight band
  sun.color.setRGB(1 - 0.25 * nightK, 0.95 - 0.2 * nightK + 0.05 * dusk, 0.87 - 0.15 * nightK - 0.15 * dusk);
  // the camera sits ~30 m away — keep the fog behind the hero so the cave
  // interior stays dimly visible while the outside world is swallowed
  scene.fog.near = 35 - 14 * caveK;
  scene.fog.far = 110 - 60 * caveK;

  // caveK already fades smoothly with distance, so apply it directly; the
  // slow time-lerp is only for biome-to-biome transitions out in the open
  const nightSky = new THREE.Color(0x0a1230), nightFog = new THREE.Color(0x141a34);
  const fogTarget = new THREE.Color(biome.fog).lerp(nightFog, nightK * 0.8).lerp(caveFog, caveK);
  const skyTarget = new THREE.Color(biome.sky).lerp(nightSky, nightK * 0.85).lerp(caveFog, caveK);
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
let shakeT = 0; // brief tremble on boss entrances
// switching view modes retunes the whole render pipeline: the third-person
// camera needs to SEE further (fog, far plane, more chunks) but the wider
// fov + fog wall keep the draw load in check
// free mouse-look: clicking the world (with no panel open) locks the pointer
renderer.domElement.addEventListener('click', () => {
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
  // the free mouse-look option only makes sense in RPG view — hide it otherwise
  $id('mouselook-row').classList.toggle('hidden', !rpg);
  scene.fog.near = rpg ? 45 : 35;
  scene.fog.far = rpg ? (autoQuality.stage >= 3 ? 150 : 195) : (autoQuality.stage >= 3 ? 90 : 110);
  camera.far = rpg ? 340 : 300;
  camera.fov = rpg ? 60 : 50;
  camera.updateProjectionMatrix();
  world.viewRadius = autoQuality.stage >= 3 ? (rpg ? 3 : 2) : (rpg ? 4 : 3);
}

// graphics options: bloom pipeline, ground detail, shadow res, tone mapping
function applyGraphics() {
  world.groundDetail = settings.texDetail ?? 0;
  if (settings.bloom && !postfx) postfx = new PostFX(renderer);
  // high shadows: sharper map over a wider area
  const size = settings.hiShadows ? 4096 : 2048;
  if (sun.shadow.mapSize.x !== size) {
    sun.shadow.mapSize.set(size, size);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  renderer.toneMapping = settings.filmic ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = settings.filmic ? 1.12 : 1;
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
}

const camSmooth = new THREE.Vector3();
let camInit = false;
let rpgPitch = 0.34; // radians above the horizontal; negative looks UP
let rpgDist = 8.6;   // wheel-zoomed camera distance

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
  trackAutoRotate(dt);
  const py = player.mesh.position.y;
  let sx = 0, sz = 0;
  if (shakeT > 0) {
    shakeT -= dt;
    const k = Math.min(1, shakeT / 0.35) * 0.5;
    sx = (Math.random() - 0.5) * k;
    sz = (Math.random() - 0.5) * k;
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
    camera.position.set(camSmooth.x + sx, camSmooth.y, camSmooth.z + sz);
    camera.lookAt(player.pos.x + player.facing.x * 2 + sx, py + 1.7, player.pos.z + player.facing.z * 2 + sz);
  } else {
    camInit = false;
    // ease the orbit yaw toward its target the short way around; at yaw 0
    // this is exactly the classic fixed top-down camera
    const diff = camYawTarget - camYaw;
    camYaw += Math.atan2(Math.sin(diff), Math.cos(diff)) * Math.min(1, dt * 3);
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    camera.position.set(player.pos.x + fx * 14 + sx, py + 26, player.pos.z + fz * 14 + sz);
    camera.lookAt(player.pos.x - fx * 2 + sx, py, player.pos.z - fz * 2 + sz);
  }
  sun.position.set(player.pos.x + 18, 35, player.pos.z + 12);
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

function tick() {
  requestAnimationFrame(tick);
  step();
}

// One simulation step. Normally driven by rAF; in multiplayer a Web-Worker
// clock keeps stepping while the tab is HIDDEN (rAF pauses there, which froze
// the shared world for the partner — enemies, snapshots, everything).
function step() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!document.hidden) autoQuality.tick(dt);

  if (game.mode === 'play' && !game.paused) {
    game.time += dt;
    updateAim(dt);
    updateNestGhost();
    const em = combatMgr(); // real mgr / co-op shadow / pvp arena / moba units
    // while a griffin carries you the flight drives your position — the
    // normal walk/attack simulation pauses until touchdown
    if (!(flight && flight.phase === 'ride')) player.update(dt, {
      input, world, enemyMgr: em, projectiles, pickups, aimPoint,
      arenaZone: mp?.active ? mp.arenaZone() : null,
      mobaBounds: game.kind === 'moba' ? MOBA.half : null,
      mouseMove: settings.mouseMove,
      boat: game.kind === 'survival' && camp?.has('boat'),
      boatPlacing: boatPlaceT > 0,
      rpgView: game.rpgView,
      mounted: player.mounted,
      mouseLook: game.rpgView && settings.mouseLook && !!input.locked,
      envSpeedMult,
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
        const targets = combatTargets();
        enemyMgr.update(dt, targets, projectiles);
        projectiles.update(dt, enemyMgr, targets);
        pickups.update(dt, [player]);
      }
      companions.update(dt, player, em, projectiles, world);
      camp?.update(dt, em, projectiles);
      world.update(dt, player.pos);
      // co-op: show the partner on the minimap too; in top-down view the
      // minimap turns together with the auto-rotated camera (RPG: north-up)
      minimap.rotation = game.rpgView ? Math.atan2(-player.facing.x, -player.facing.z) : camYaw;
      minimap.update(dt, player, em,
        mp?.active && mp.mode === 'coop' ? mp.remote : null);
      tickDayNight(dt);
      updateAtmosphere(dt);
      updateWaypoint(dt);
      updatePings(dt);

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

      // raft under the hero while paddling — stepping onto water first means
      // 2 s of setting the raft down (no moving), then a slow paddle with a
      // simple wake of expanding wave rings
      const onWater = !player.flying && camp?.has('boat') && world.isWater(player.pos.x, player.pos.z);
      if (onWater && !wasOnWater) {
        boatPlaceT = 2;
        audio.sfx('tower_build', 0.5);
      }
      wasOnWater = !!onWater;
      if (boatPlaceT > 0) boatPlaceT -= dt;
      raft.visible = !!onWater;
      if (onWater) {
        const k = boatPlaceT > 0 ? 1 - boatPlaceT / 2 : 1; // raft settles in
        raft.position.set(player.pos.x, player.mesh.position.y + 0.12 + (1 - k) * 1.6, player.pos.z);
        raft.rotation.y = player.mesh.rotation.y;
        raft.scale.setScalar(0.4 + 0.6 * k);
        // wake rings while actually moving
        waveT -= dt;
        if (boatPlaceT <= 0 && waveT <= 0
            && (Math.abs(player.pos.x - lastWaveX) > 0.6 || Math.abs(player.pos.z - lastWaveZ) > 0.6)) {
          waveT = 0.35;
          lastWaveX = player.pos.x; lastWaveZ = player.pos.z;
          spawnWave(player.pos.x, player.pos.z);
        }
      }
      updateWaves(dt);

      updateChannel(dt);
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
      tickFireflies(dt);
      tickTorch(dt);
      tickDustDevil(dt);
      tickCold(dt);

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
        lair: '💀 A boss lair — slay its named master for a UNIQUE treasure',
        statue: '🗿 Cursed statue — press <kbd>E</kbd> to strike a pact (boon + bane)',
      };
      const POI_HINTS = {
        shrine: '✦ Ancient shrine — press <kbd>E</kbd> to receive its blessing',
        monolith: '▲ Rune monolith — press <kbd>E</kbd> to break the seal',
        crypt: '☗ Forgotten crypt — clear the keepers, then <kbd>E</kbd> to loot',
      };
      const hint = panels.open ? null
        : channel ? `✨ ${channel.label} ${Math.min(99, Math.round((channel.t / channel.dur) * 100))}%`
        : mp?.revivablePartner?.() ? '💚 Your partner is DOWN — press <kbd>E</kbd> to revive!'
        : nearChest() ? '📦 Storage chest — press <kbd>E</kbd> to open'
        : nearHome() ? '🏠 Your home — press <kbd>E</kbd> to build &amp; upgrade'
        : nearWildHorse() ? '🐴 A wild horse — press <kbd>E</kbd> to saddle and ride it'
        : nearParkedHorse() ? '🐴 Your horse — press <kbd>E</kbd> to mount'
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
          minimap.drawBig($id('bigmap-canvas'), player, mp?.mode === 'coop' ? mp.remote : null);
        }
      }

      const progress = progressAt(player.pos.x, player.pos.z);
      ui.updateHUD(player, progress, BIOMES[game.biomeIndex].name);

      if (radiusOf(player.pos.x, player.pos.z) >= WORLD.goalR) {
        game.mode = 'won';
        aimArc.visible = false;
        audio.stopMusic(); setAmbience(null);
        audio.sfx('victory', 0.6);
        mp?.broadcastWin();
        ui.showEnd(true, endStats());
        document.getElementById('end-title').textContent = 'You crossed the whole wilds!';
      }
    }
  }

  updateCamera(dt);
  ui.updateOverlays(dt, camera);
  renderCharPreview(dt);
  renderSmithPreview(dt);
  if (settings.bloom && postfx) postfx.render(scene, camera);
  else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
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

// debug handle (also handy for the future multiplayer host loop)
window.__game = { game, scene, player, enemyMgr, companions, pickups, panels, input, updateAim, minimap,
  get world() { return world; }, get camp() { return camp; } };
