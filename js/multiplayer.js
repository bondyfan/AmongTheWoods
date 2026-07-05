// ==========================================================================
// Among The Woods — multiplayer session (co-op & PvP arena duels)
//
//  CO-OP  — one shared world (same seed). The HOST simulates enemies and
//           pickups and streams a snapshot (~7 Hz); the GUEST renders shadow
//           copies and sends hit/collect events. Both players see each other.
//
//  PVP    — each player farms their OWN world fully locally (zero sync lag).
//           Every `interval` minutes both are teleported into a boulder arena
//           and fight with their current gear until one dies. The winner gets
//           a big meat+XP reward; after 5 s both return to where they were
//           (the loser revived at 50% hp).
//
// Both players are authoritative over their OWN hp: attacks are sent as
// events, the receiving client applies the damage to itself.
// ==========================================================================

import * as THREE from 'three';
import { WoodsNet } from './net.js';
import { ARENA, ARENA_RETURN_DELAY, arenaReward, ENEMY_TYPES, BOSS_RANKS,
         MOBA_BUILDINGS, itemById } from './config.js';
import { makeMan, makeAxe, makeBow, makeEnemyMesh, makeMeatDrop, makeWoodDrop,
         makeItemDrop, makeEnemyShot, makeWolf, makeMobaTower, makeMobaBase,
         makeTeamFlag, TEAM_COLORS, mat } from './models.js';
import { audio } from './audio.js';

// ---------- the other player's avatar ----------
class RemotePlayer {
  constructor(scene, world, ui, name) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.mesh = makeMan();
    // blue scarf so the partner is recognizable
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.34), mat(0x3a6fb5));
    scarf.position.y = 1.12;
    this.mesh.add(scarf);
    this.mesh.visible = false;
    scene.add(this.mesh);

    this.pos = new THREE.Vector3(0, 0, 0);     // interpolated (world truth)
    this.targetPos = new THREE.Vector3();
    this.facing = new THREE.Vector3(0, 0, -1);
    this.hp = 100; this.maxHp = 100; this.level = 1;
    this.dead = false;
    this.walkT = 0;
    this.moving = false;
    this.attackT = 0;
    this.weaponId = 'fists';
    this._shownWeapon = null;
    this.lastSeen = 0;

    ui.addTracker('mp-partner',
      () => this.mesh.visible ? this.mesh.position.clone().setY(this.mesh.position.y + 2.1) : null,
      `<div class="mp-name">${name}</div><div class="hpbar"><div class="hpbar-fill"></div></div>`, 'hpwrap',
      (el) => {
        const pct = Math.max(0, this.hp / this.maxHp);
        const fill = el.children[1].firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = '#5fa8e0';
      });
  }

  setState(s) {
    if (!s) return;
    this.lastSeen = performance.now();
    const jump = Math.hypot(s.x - this.targetPos.x, s.z - this.targetPos.z) > 20;
    this.targetPos.set(s.x, 0, s.z);
    if (jump) this.pos.copy(this.targetPos); // teleport, don't glide across the map
    this.facing.set(s.fx, 0, s.fz);
    this.hp = s.hp; this.maxHp = s.mhp; this.level = s.lv;
    this.moving = !!s.mv;
    if (s.atk && this.attackT <= 0) this.attackT = 0.25;
    this.dead = !!s.dead;
    if (s.w !== this.weaponId) { this.weaponId = s.w; this._refreshWeapon(); }
  }

  _refreshWeapon() {
    const { rightSocket, leftSocket } = this.mesh.userData;
    rightSocket.clear(); leftSocket.clear();
    const w = itemById(this.weaponId)?.weapon;
    if (!w) return;
    if (w.kind === 'melee' && w.tier > 0) {
      const axe = makeAxe(w.tier); axe.rotation.x = -0.2; rightSocket.add(axe);
    } else if (w.kind === 'bow') leftSocket.add(makeBow(w.tier));
  }

  update(dt) {
    if (!this.mesh.visible) return;
    this.pos.lerp(this.targetPos, Math.min(1, dt * 10));
    this.mesh.position.set(this.pos.x, this.world.heightAt(this.pos.x, this.pos.z), this.pos.z);
    this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    const { leftLeg, rightLeg, rightArm, leftArm } = this.mesh.userData;
    if (this.moving) this.walkT += dt * 8;
    const swing = this.moving ? Math.sin(this.walkT * 1.4) * 0.55 : 0;
    leftLeg.rotation.x = swing; rightLeg.rotation.x = -swing;
    if (this.attackT > 0) {
      this.attackT -= dt;
      rightArm.rotation.x = -2.1 * Math.sin((1 - this.attackT / 0.25) * Math.PI);
    } else { rightArm.rotation.x = -swing * 0.6; leftArm.rotation.x = swing * 0.6; }
    this.mesh.rotation.z = this.dead ? Math.PI / 2 : 0;
  }

  dispose() {
    this.ui.removeTracker('mp-partner');
    this.scene.remove(this.mesh);
  }
}

// ---------- co-op guest: shadow world (host-simulated enemies & pickups) ----------
class ShadowWorld {
  constructor(scene, world, ui, hooks) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.hooks = hooks; // { sendEvent, popup, discover }
    this.enemies = new Map();  // id -> shadow
    this.pickups = new Map();
    this.shots = new Map();
    this.dyingMeshes = [];
    this.seenTypes = new Set();
    this.pendingCollect = new Set();
  }

  applySnap(snap) {
    // --- enemies ---
    const liveIds = new Set();
    for (const e of snap.e || []) {
      liveIds.add(e.id);
      let s = this.enemies.get(e.id);
      if (!s) {
        const cfg = ENEMY_TYPES[e.t];
        const sizeMult = e.b > 0 ? BOSS_RANKS[e.b - 1].sizeMult : 1;
        const mesh = makeEnemyMesh(e.t);
        if (sizeMult !== 1) mesh.scale.multiplyScalar(sizeMult);
        this.scene.add(mesh);
        s = {
          id: e.id, type: e.t, cfg, mesh, bossRank: e.b, sizeMult,
          pos: new THREE.Vector3(e.x, 0, e.z), target: new THREE.Vector3(e.x, 0, e.z),
          hp: e.hp, maxHp: e.m, hitR: cfg.hitR * sizeMult,
          dying: 0, stunT: 0, walkT: Math.random() * 10,
        };
        this.enemies.set(e.id, s);
        this._addBars(s);
        if (e.b > 0) {
          this.ui.addTracker('sboss' + e.id,
            () => s.mesh.parent ? s.mesh.position.clone().setY(s.mesh.position.y + 2.6 * sizeMult) : null,
            '💀'.repeat(e.b), 'skulls');
        }
        if (!this.seenTypes.has(e.t)) { this.seenTypes.add(e.t); this.hooks.discover(e.t); }
      }
      s.target.set(e.x, 0, e.z);
      s.hp = e.hp; s.maxHp = e.m;
    }
    for (const [id, s] of this.enemies) {
      if (!liveIds.has(id)) this._killShadow(id, s);
    }

    // --- pickups ---
    const pickIds = new Set();
    for (const p of snap.p || []) {
      pickIds.add(p.i);
      let s = this.pickups.get(p.i);
      if (!s) {
        const mesh = p.k === 'meat' ? makeMeatDrop() : p.k === 'wood' ? makeWoodDrop() : makeItemDrop();
        mesh.position.set(p.x, this.world.heightAt(p.x, p.z) + 0.45, p.z);
        this.scene.add(mesh);
        s = { id: p.i, kind: p.k, mesh, x: p.x, z: p.z, t: Math.random() * 6 };
        this.pickups.set(p.i, s);
      }
      s.x = p.x; s.z = p.z;
    }
    for (const [id, s] of this.pickups) {
      if (!pickIds.has(id)) { this.scene.remove(s.mesh); this.pickups.delete(id); this.pendingCollect.delete(id); }
    }

    // --- enemy shots (dodge visibility) ---
    const shotIds = new Set();
    for (const sh of snap.s || []) {
      shotIds.add(sh.i);
      let s = this.shots.get(sh.i);
      if (!s) {
        const mesh = makeEnemyShot(sh.c || 0x8aff3a);
        this.scene.add(mesh);
        s = { mesh, target: new THREE.Vector3(sh.x, 0.9, sh.z) };
        s.mesh.position.copy(s.target);
        this.shots.set(sh.i, s);
      }
      s.target.set(sh.x, 0.9, sh.z);
    }
    for (const [id, s] of this.shots) {
      if (!shotIds.has(id)) { this.scene.remove(s.mesh); this.shots.delete(id); }
    }
  }

  _addBars(s) {
    this.ui.addTracker('shp' + s.id,
      () => s.mesh.parent && !s.dying ? s.mesh.position.clone().setY(s.mesh.position.y + 1.5 * s.sizeMult + 0.5) : null,
      '<div class="hpbar"><div class="hpbar-fill"></div></div>', 'hpwrap',
      (el) => {
        const pct = Math.max(0, s.hp / s.maxHp);
        const fill = el.firstChild.firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = pct > 0.5 ? '#5fd35f' : pct > 0.25 ? '#e0c040' : '#e05050';
      });
  }

  _killShadow(id, s) {
    this.enemies.delete(id);
    this.ui.removeTracker('shp' + id);
    this.ui.removeTracker('sboss' + id);
    s.dying = 0.0001;
    this.dyingMeshes.push(s);
    audio.sfx('death', 0.3, 60);
  }

  // ---- EnemyManager-compatible interface for the guest's combat code ----
  alive() { return [...this.enemies.values()]; }
  damage(e, dmg, knockDir) {
    this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y + 1.4 * e.sizeMult + 0.4),
      Math.round(dmg).toString(), '#ffffff');
    this.hooks.sendEvent({ type: 'ehit', id: e.id, dmg: Math.round(dmg * 10) / 10 });
    audio.sfx('hit', 0.25, 90);
  }
  stun(e, sec) { this.hooks.sendEvent({ type: 'ehit', id: e.id, dmg: 0, stun: sec }); }

  update(dt, localPlayer) {
    for (const s of this.enemies.values()) {
      const prev = s.pos.clone();
      s.pos.lerp(s.target, Math.min(1, dt * 8));
      const moved = s.pos.distanceTo(prev);
      if (moved > 0.01) {
        s.walkT += moved * 2.5;
        s.mesh.rotation.y = Math.atan2(s.pos.x - prev.x, s.pos.z - prev.z) + Math.PI;
      }
      const ud = s.mesh.userData;
      (ud.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(s.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
      });
      (ud.wings || []).forEach((w, wi) => { w.rotation.z = Math.sin(s.walkT * 6 + wi * Math.PI) * 0.55; });
      (ud.segments || []).forEach((seg, si) => { seg.position.x = Math.sin(s.walkT * 2.4 + si * 1.1) * 0.13; });
      const flyY = s.cfg.flying ? 1.5 : 0;
      s.mesh.position.set(s.pos.x, this.world.heightAt(s.pos.x, s.pos.z) + flyY, s.pos.z);
    }

    // death animations for removed shadows
    for (let i = this.dyingMeshes.length - 1; i >= 0; i--) {
      const s = this.dyingMeshes[i];
      s.dying += dt;
      s.mesh.rotation.z = Math.min(Math.PI / 2, s.dying * 4);
      s.mesh.position.y -= dt * 0.8;
      if (s.dying > 1) { this.scene.remove(s.mesh); this.dyingMeshes.splice(i, 1); }
    }

    // pickups: bob locally; request collection when the player is close
    for (const s of this.pickups.values()) {
      s.t += dt;
      s.mesh.position.y = this.world.heightAt(s.x, s.z) + 0.45 + Math.sin(s.t * 3) * 0.12;
      s.mesh.rotation.y += dt * 1.2;
      if (!this.pendingCollect.has(s.id) && !localPlayer.dead) {
        const d = Math.hypot(localPlayer.pos.x - s.x, localPlayer.pos.z - s.z);
        if (d < 3.0) {
          this.pendingCollect.add(s.id);
          this.hooks.sendEvent({ type: 'collect', id: s.id });
        }
      }
    }

    for (const s of this.shots.values()) s.mesh.position.lerp(s.target, Math.min(1, dt * 10));
  }

  dispose() {
    for (const [id, s] of this.enemies) { this.scene.remove(s.mesh); this.ui.removeTracker('shp' + id); this.ui.removeTracker('sboss' + id); }
    for (const s of this.pickups.values()) this.scene.remove(s.mesh);
    for (const s of this.shots.values()) this.scene.remove(s.mesh);
    for (const s of this.dyingMeshes) this.scene.remove(s.mesh);
    this.enemies.clear(); this.pickups.clear(); this.shots.clear();
  }
}

// ---------- MOBA guest: shadow units + local mirror of own buildings ----------
class MobaShadow {
  constructor(scene, world, ui, hooks) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.hooks = hooks; // { sendEvent, popup }
    this.unitsMap = new Map();
    this.dyingMeshes = [];
    this.waveT = 60;
    // local mirror of MY team's building levels (guest = 'enemy' team on host)
    this.mirror = { dens: { mid: 0, top: 0, bot: 0 }, towers: { mid: 0, top: 0, bot: 0 },
                    forge: 0, lodge: 0, walls: 0 };
  }

  get units() { return [...this.unitsMap.values()]; }

  buildingInfo(team, id, lane) {
    const def = MOBA_BUILDINGS.find(b => b.id === id);
    const level = id === 'den' ? this.mirror.dens[lane]
      : id === 'tower' ? this.mirror.towers[lane] : this.mirror[id];
    return { def, level, maxed: level >= def.max, cost: level >= def.max ? null : def.cost(level + 1) };
  }

  registerBuild(id, lane) {
    if (id === 'den') this.mirror.dens[lane]++;
    else if (id === 'tower') this.mirror.towers[lane]++;
    else this.mirror[id]++;
  }

  _makeMesh(u) {
    const color = TEAM_COLORS[u.tm] || 0xe0c040;
    if (u.k === 'base') return makeMobaBase(color);
    if (u.k === 'tower') return makeMobaTower(color);
    const mesh = u.tm === 'player' && u.t === 'wolf' ? makeWolf('tame') : makeEnemyMesh(u.t);
    if (u.k === 'creep') {
      const flag = makeTeamFlag(color);
      flag.position.set(0, u.t === 'bear' ? 1.4 : 1.0, 0.3);
      mesh.add(flag);
    }
    return mesh;
  }

  applySnap(snap) {
    this.waveT = snap.w ?? this.waveT;
    const live = new Set();
    for (const su of snap.m || []) {
      live.add(su.id);
      let s = this.unitsMap.get(su.id);
      if (!s) {
        const mesh = this._makeMesh(su);
        this.scene.add(mesh);
        const cfg = ENEMY_TYPES[su.t];
        s = {
          id: su.id, kind: su.k, team: su.tm, type: su.t, mesh, cfg,
          pos: new THREE.Vector3(su.x, 0, su.z), target: new THREE.Vector3(su.x, 0, su.z),
          hp: su.hp, maxHp: su.m, hitR: su.k === 'base' ? 7 : su.k === 'tower' ? 1.4 : (cfg?.hitR ?? 0.8),
          dying: false, stunT: 0, walkT: Math.random() * 10,
        };
        this.unitsMap.set(su.id, s);
        const y = s.kind === 'base' ? 3.5 : s.kind === 'tower' ? 5.4 : 1.9;
        this.ui.addTracker('mmu' + s.id,
          () => s.mesh.parent && !s.dying ? s.mesh.position.clone().setY(s.mesh.position.y + y) : null,
          '<div class="hpbar"><div class="hpbar-fill"></div></div>', 'hpwrap',
          (el) => {
            const pct = Math.max(0, s.hp / s.maxHp);
            const fill = el.firstChild.firstChild;
            fill.style.width = (pct * 100) + '%';
            // from the GUEST's view: my team is 'enemy' on the host → blue
            fill.style.background = s.team === 'enemy' ? '#5fa8e0' : s.team === 'player' ? '#e05050' : '#e0c040';
          });
      }
      s.target.set(su.x, 0, su.z);
      s.hp = su.hp; s.maxHp = su.m;
    }
    for (const [id, s] of this.unitsMap) {
      if (!live.has(id)) {
        this.unitsMap.delete(id);
        this.ui.removeTracker('mmu' + id);
        s.dying = 0.0001;
        this.dyingMeshes.push(s);
        audio.sfx('death', 0.25, 80);
      }
    }
  }

  // combat seam for the guest hero (hostile = host's team + neutrals)
  alive() { return this.units.filter(u => !u.dying && u.team !== 'enemy'); }
  damage(u, dmg) {
    this.hooks.popup(u.mesh.position.clone().setY(u.mesh.position.y + 1.4), Math.round(dmg).toString(), '#ffffff');
    this.hooks.sendEvent({ type: 'mhit', id: u.id, dmg: Math.round(dmg * 10) / 10 });
    audio.sfx('hit', 0.25, 90);
  }
  stun(u, sec) { this.hooks.sendEvent({ type: 'mhit', id: u.id, dmg: 0, stun: sec }); }

  statusLine() {
    let mine = null, theirs = null;
    for (const u of this.unitsMap.values()) {
      if (u.kind !== 'base') continue;
      if (u.team === 'enemy') mine = u; else theirs = u;
    }
    const w = Math.max(0, Math.ceil(this.waveT));
    return `🏰 ${mine ? Math.round(mine.hp) + '/' + mine.maxHp : '—'} · Enemy 🏰 ${theirs ? Math.round(theirs.hp) + '/' + theirs.maxHp : '—'}`
      + ` · Wave in ${Math.floor(w / 60)}:${String(w % 60).padStart(2, '0')}`;
  }

  update(dt) {
    this.waveT = Math.max(0, this.waveT - dt);
    for (const s of this.unitsMap.values()) {
      if (s.kind === 'base' || s.kind === 'tower') continue;
      const prev = s.pos.clone();
      s.pos.lerp(s.target, Math.min(1, dt * 8));
      const moved = s.pos.distanceTo(prev);
      if (moved > 0.01) {
        s.walkT += moved * 2.5;
        s.mesh.rotation.y = Math.atan2(s.pos.x - prev.x, s.pos.z - prev.z) + Math.PI;
      }
      const ud = s.mesh.userData;
      (ud.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(s.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
      });
      (ud.segments || []).forEach((seg, si) => { seg.position.x = Math.sin(s.walkT * 2.4 + si * 1.1) * 0.13; });
      s.mesh.position.set(s.pos.x, this.world.heightAt(s.pos.x, s.pos.z), s.pos.z);
    }
    for (let i = this.dyingMeshes.length - 1; i >= 0; i--) {
      const s = this.dyingMeshes[i];
      s.dying += dt;
      s.mesh.rotation.z = Math.min(Math.PI / 2, s.dying * 3);
      s.mesh.position.y -= dt * 1.5;
      if (s.dying > 1.1) { this.scene.remove(s.mesh); this.dyingMeshes.splice(i, 1); }
    }
  }

  dispose() {
    for (const [id, s] of this.unitsMap) { this.scene.remove(s.mesh); this.ui.removeTracker('mmu' + id); }
    for (const s of this.dyingMeshes) this.scene.remove(s.mesh);
    this.unitsMap.clear();
  }
}

// ---------- the session ----------
export class Multiplayer {
  // ctx: { scene, world, player, enemyMgr, pickups, projectiles, ui, panels, game,
  //        startPlaying(), popup(pos,text,color) }
  constructor(ctx) {
    this.ctx = ctx;
    this.active = false;
    this.mode = null;          // 'coop' | 'pvp'
    this.isHost = false;
    this.remote = null;        // RemotePlayer
    this.shadow = null;        // ShadowWorld (co-op guest)
    this.meta = null;
    this._snapT = 0;
    this._deadSince = 0;

    this.arena = {
      active: false, nextAt: 0, prevPos: null,
      overT: 0, iWon: false, resolved: false,
    };

    // combat proxy: lets the local player's melee/arrows/companions hit the
    // remote player in the arena through the normal EnemyManager interface
    const self = this;
    this.arenaProxy = {
      get id() { return 'partner'; },
      get pos() { return self.remote.pos; },
      get mesh() { return self.remote.mesh; },
      get dying() { return self.remote.dead; },
      get dead() { return self.remote.dead; },
      hitR: 0.6, sizeMult: 1, stunT: 0,
      cfg: { hitR: 0.6 },
      takeDamage: () => {}, applyStun: () => {},
    };
    this.arenaAdapter = {
      alive: () => (this.arena.active && this.remote && !this.remote.dead) ? [this.arenaProxy] : [],
      damage: (e, dmg) => {
        WoodsNet.sendEvent({ type: 'hit', dmg: Math.round(dmg * 10) / 10 });
        ctx.popup(this.remote.mesh.position.clone().setY(this.remote.mesh.position.y + 2), Math.round(dmg).toString(), '#ffb3b3');
        audio.sfx('hit', 0.3, 90);
      },
      stun: (e, sec) => WoodsNet.sendEvent({ type: 'hit', dmg: 0, stun: sec }),
    };

    // enemy-attack proxy for co-op host: enemies can chase & hurt the partner
    this.coopProxy = {
      get pos() { return self.remote.pos; },
      get mesh() { return self.remote.mesh; },
      get dead() { return self.remote.dead; },
      takeDamage: (dmg) => WoodsNet.sendEvent({ type: 'pdmg', dmg: Math.round(dmg * 10) / 10 }),
      applyStun: (sec) => WoodsNet.sendEvent({ type: 'pdmg', dmg: 0, stun: sec }),
    };
  }

  // ---------- lobby ----------
  async host(mode, intervalMin) {
    const code = await WoodsNet.createGame(mode, intervalMin);
    this.isHost = true;
    WoodsNet.onMeta((meta) => {
      if (!meta) { this._partnerLeft(); return; }
      this.meta = meta;
      if (meta.guest && !this.active) {
        WoodsNet.setPartner(meta.guest);
        this._begin(meta);
      }
    });
    return code;
  }

  async join(code) {
    const meta = await WoodsNet.joinGame(code);
    this.isHost = false;
    this.meta = meta;
    WoodsNet.onMeta((m) => {
      if (!m) { this._partnerLeft(); return; }
      this.meta = m;
    });
    this._begin(meta);
  }

  _begin(meta) {
    const { ctx } = this;
    this.active = true;
    this.mode = meta.mode;

    if (meta.mode === 'moba') {
      // one shared three-lane map; host runs the sim, guest plays the red team
      if (this.isHost) {
        this.moba = ctx.createMobaHost(meta.seed);
      } else {
        this.mobaShadow = new MobaShadow(ctx.scene, null, ctx.ui, {
          sendEvent: (e) => WoodsNet.sendEvent(e),
          popup: ctx.popup,
        });
        ctx.attachMobaGuest(meta.seed, this.mobaShadow);
        this.mobaShadow.world = ctx.world; // the fresh MobaWorld from the swap
        WoodsNet.onSnap((snap) => this.mobaShadow.applySnap(snap));
      }
    } else {
      // world seed: shared in co-op, per-player in pvp (own worlds)
      const seed = meta.mode === 'coop' ? meta.seed : meta.seed + (this.isHost ? 0 : 1);
      ctx.world.reset(seed);
      ctx.game.seed = seed;
    }

    this.remote = new RemotePlayer(ctx.scene, ctx.world, ctx.ui, this.isHost ? 'P2' : 'P1');
    if (this.mode === 'coop' || this.mode === 'moba') this.remote.mesh.visible = true;

    if (this.mode === 'coop' && !this.isHost) {
      this.shadow = new ShadowWorld(ctx.scene, ctx.world, ctx.ui, {
        sendEvent: (e) => WoodsNet.sendEvent(e),
        popup: ctx.popup,
        discover: (t) => ctx.onDiscover(t),
      });
      WoodsNet.onSnap((snap) => this.shadow.applySnap(snap));
    }

    WoodsNet.onPartnerState((s) => {
      if (s) this.remote.setState(s);
    });
    WoodsNet.onEvent((ev) => this._onEvent(ev));

    if (this.mode === 'pvp' && this.isHost) {
      WoodsNet.updateMeta({ nextArenaAt: Date.now() + meta.interval * 60000 });
    }

    ctx.startPlaying(); // hides menu, starts music, spawns the local wave
    ctx.ui.toast(this.mode === 'coop'
      ? '🤝 Co-op! Fight side by side and head north together.'
      : this.mode === 'moba'
        ? '🏰 MOBA 1v1! Farm the jungle, build dens & towers, raze their base.'
        : `⚔️ PvP! Farm your world — the arena calls every ${meta.interval} min.`, 'level');
  }

  _partnerLeft() {
    if (!this.active) return;
    this.ctx.ui.toast('👋 Your partner left — continuing solo.', 'boss');
    this.dispose();
  }

  // ---------- per-frame ----------
  update(dt) {
    if (!this.active) return;
    const { ctx } = this;
    const p = ctx.player;

    // broadcast own state
    const arenaHot = this.arena.active;
    const rate = this.mode === 'coop' ? 110 : (arenaHot ? 80 : 500);
    WoodsNet.sendState({
      x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1),
      fx: +p.facing.x.toFixed(2), fz: +p.facing.z.toFixed(2),
      hp: Math.round(p.hp), mhp: p.maxHp, lv: p.level,
      w: p.equipment.weapon, mv: (ctx.input.moveX || ctx.input.moveZ) ? 1 : 0,
      atk: p.attackT > 0 ? 1 : 0, dead: p.dead ? 1 : 0,
    }, rate);

    this.remote?.update(dt);
    this.shadow?.update(dt, p);
    this.mobaShadow?.update(dt);

    // host: stream the world snapshot
    if (this.isHost && this.mode === 'coop') {
      this._snapT -= dt;
      if (this._snapT <= 0) {
        this._snapT = 0.14;
        WoodsNet.sendSnap({
          e: ctx.enemyMgr.snapshot(),
          p: ctx.pickups.snapshot(),
          s: ctx.projectiles.snapshotShots(),
        });
      }
    } else if (this.isHost && this.mode === 'moba') {
      this._snapT -= dt;
      if (this._snapT <= 0) {
        this._snapT = 0.2;
        WoodsNet.sendSnap({ m: this.moba.snapshot(), w: Math.round(this.moba.waveT) });
      }
    }

    if (this.mode === 'pvp') this._updatePvp(dt);
    this._updateHudLine();
  }

  _updateHudLine() {
    if (this.mode === 'moba') return; // the MOBA status line owns that element
    const el = document.getElementById('mp-status');
    if (!el) return;
    const r = this.remote;
    let line = `${this.isHost ? 'P2' : 'P1'} Lv${r?.level ?? '?'} ❤️${r ? Math.max(0, Math.round(r.hp)) : '?'}`;
    if (this.mode === 'pvp' && !this.arena.active && this.meta?.nextArenaAt) {
      const s = Math.max(0, Math.ceil((this.meta.nextArenaAt - Date.now()) / 1000));
      line = `⚔️ Arena in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · ` + line;
    }
    if (this.arena.active) line = '⚔️ DUEL! · ' + line;
    el.textContent = line;
    el.classList.remove('hidden');
  }

  // ---------- pvp arena flow ----------
  _updatePvp(dt) {
    const { ctx } = this;
    if (!this.arena.active) {
      if (this.meta?.nextArenaAt && Date.now() >= this.meta.nextArenaAt && !ctx.player.dead) {
        this._startArena();
      }
      return;
    }

    // arena running — resolve the end
    if (this.arena.resolved) {
      this.arena.overT -= dt;
      if (this.arena.overT <= 0) this._leaveArena();
    }
  }

  _startArena() {
    const { ctx } = this;
    const p = ctx.player;
    this.arena.active = true;
    this.arena.resolved = false;
    this.arena.iWon = false;
    this.arena.prevPos = p.pos.clone();
    if (ctx.panels.open) ctx.panels.toggle(null);

    ctx.world.buildArena(ARENA.x, ARENA.z, ARENA.r);
    const side = this.isHost ? -1 : 1;
    p.pos.set(ARENA.x + side * (ARENA.r - 4), 0, ARENA.z);
    p.facing.set(-side, 0, 0);
    this.remote.mesh.visible = true;
    this.remote.pos.set(ARENA.x - side * (ARENA.r - 4), 0, ARENA.z);
    this.remote.targetPos.copy(this.remote.pos);

    audio.sfx('lane_unlock', 0.6);
    ctx.ui.banner('⚔️ FIGHT ⚔️');
    ctx.ui.toast('Duel! Winner takes a mountain of meat & XP.', 'boss');
  }

  // my player died in the arena → tell the winner, wait, revive & return
  _onArenaDeath() {
    this.arena.resolved = true;
    this.arena.iWon = false;
    this.arena.overT = ARENA_RETURN_DELAY;
    WoodsNet.sendEvent({ type: 'arenaDeath' });
    this.ctx.ui.toast('☠️ Defeated… returning in 5 s.', 'boss');
  }

  // the opponent died → reward, wait, return
  _onArenaWin() {
    if (this.arena.resolved) return;
    this.arena.resolved = true;
    this.arena.iWon = true;
    this.arena.overT = ARENA_RETURN_DELAY;
    const reward = arenaReward(this.remote.level);
    const p = this.ctx.player;
    p.meat += reward.meat;
    p.addXp(reward.xp);
    audio.sfx('victory', 0.5);
    this.ctx.ui.toast(`🏆 Duel won! +${reward.meat} 🍖 +${reward.xp} XP`, 'level');
  }

  _leaveArena() {
    const { ctx } = this;
    const p = ctx.player;
    this.arena.active = false;
    ctx.world.removeArena();
    if (p.dead) p.revive(0.5);
    p.pos.copy(this.arena.prevPos);
    if (this.mode === 'pvp') this.remote.mesh.visible = false;
    if (this.isHost) {
      WoodsNet.updateMeta({ nextArenaAt: Date.now() + (this.meta.interval || 3) * 60000 });
    }
    ctx.ui.toast('Back to the hunt. Next duel is ticking…', 'info');
  }

  arenaZone() { return this.arena.active ? ARENA : null; }

  // what the local combat systems should target this frame
  combatMgr() {
    if (this.mode === 'moba') return this.isHost ? this.moba.hostileMgr('player') : this.mobaShadow;
    if (this.mode === 'pvp') return this.arena.active ? this.arenaAdapter : this.ctx.enemyMgr;
    return this.isHost ? this.ctx.enemyMgr : this.shadow;
  }

  // world simulation step (replaces the solo enemy/pickup update)
  updateWorldSim(dt) {
    const { ctx } = this;
    if (this.mode === 'moba') {
      if (this.isHost) {
        const heroes = [{ obj: ctx.player, team: 'player' }];
        if (this.remote.lastSeen) heroes.push({ obj: this.coopProxy, team: 'enemy' });
        this.moba.update(dt, heroes);
        ctx.projectiles.update(dt, this.moba.hostileMgr('player'), [ctx.player, this.coopProxy]);
        ctx.pickups.update(dt, [ctx.player]);
      } else {
        ctx.projectiles.update(dt, this.mobaShadow, [ctx.player]);
        ctx.pickups.update(dt, [ctx.player]);
      }
      return;
    }
    if (this.mode === 'coop') {
      if (this.isHost) {
        const targets = this.remote.lastSeen ? [ctx.player, this.coopProxy] : [ctx.player];
        ctx.enemyMgr.update(dt, targets, ctx.projectiles);
        ctx.pickups.update(dt, targets);
        ctx.projectiles.update(dt, ctx.enemyMgr, targets);
      } else {
        // shadow world handles enemy/pickup rendering; local projectiles hit
        // shadow enemies, and locally-chopped wood still drops locally
        ctx.projectiles.update(dt, this.shadow, [ctx.player]);
        ctx.pickups.update(dt, [ctx.player]);
      }
    } else {
      // pvp: own world, fully local — frozen during the duel
      if (!this.arena.active) {
        ctx.enemyMgr.update(dt, [ctx.player], ctx.projectiles);
        ctx.pickups.update(dt, [ctx.player]);
        ctx.projectiles.update(dt, ctx.enemyMgr, [ctx.player]);
      } else {
        ctx.projectiles.update(dt, this.arenaAdapter, [ctx.player]);
      }
    }
  }

  // ---------- MOBA event senders ----------
  sendMobaBuild(id, lane) { WoodsNet.sendEvent({ type: 'mbuild', id, lane }); }
  sendMobaReward(xp, meat) { WoodsNet.sendEvent({ type: 'mreward', xp, meat }); }
  sendMobaEnd(partnerWon) { WoodsNet.sendEvent({ type: 'mobaEnd', won: partnerWon }); }

  // local player died — true means "handled, don't show the end screen"
  handleLocalDeath() {
    if (!this.active) return false;
    if (this.arena.active) { this._onArenaDeath(); return true; }
    // out in the world: respawn at the spawn clearing — ALL meat is lost
    const { ctx } = this;
    const p = ctx.player;
    p.meat = 0;
    ctx.ui.toast('☠️ You fell… respawning at the meadow — all your meat is gone!', 'boss');
    setTimeout(() => {
      if (!this.active) return;
      p.revive(1);
      p.pos.set(0, 0, 4);
    }, 3000);
    return true;
  }

  // co-op: forward kill credit to whoever landed the killing blow
  onKillCredit(enemy) {
    if (!this.active || this.mode !== 'coop' || !this.isHost) return false;
    if (enemy.lastHitBy === 'partner') {
      WoodsNet.sendEvent({ type: 'xpkill', xp: enemy.xp });
      return true; // XP goes to the partner, not to me
    }
    return false;
  }

  // co-op host: a pickup was magnet-collected by the partner's proxy
  onRemoteCollect(pickup) {
    WoodsNet.sendEvent({ type: 'grant', kind: pickup.kind, payload: pickup.payload });
  }

  sendChop(tree, power) {
    if (this.active && this.mode === 'coop') {
      WoodsNet.sendEvent({ type: 'chop', x: +tree.x.toFixed(1), z: +tree.z.toFixed(1), power });
    }
  }

  // ---------- incoming events ----------
  _onEvent(ev) {
    const { ctx } = this;
    const p = ctx.player;
    switch (ev.type) {
      case 'hit': // pvp arena: opponent's attack landed on me
        if (!this.arena.active || p.dead) break;
        if (ev.dmg > 0) p.takeDamage(ev.dmg);
        if (ev.stun) p.applyStun(ev.stun);
        break;
      case 'arenaDeath': this._onArenaWin(); break;

      case 'pdmg': // co-op guest: an enemy (simulated on the host) hit me
        if (p.dead) break;
        if (ev.dmg > 0) p.takeDamage(ev.dmg);
        if (ev.stun) p.applyStun(ev.stun);
        break;
      case 'ehit': { // co-op host: partner damaged enemy #id
        const e = ctx.enemyMgr.list.find(x => x.id === ev.id);
        if (e) {
          if (ev.dmg > 0) ctx.enemyMgr.damage(e, ev.dmg, null, 'partner');
          if (ev.stun) ctx.enemyMgr.stun(e, ev.stun);
        }
        break;
      }
      case 'collect': { // co-op host: partner wants pickup #id
        const pk = ctx.pickups.removeById(ev.id);
        if (pk) this.onRemoteCollect(pk);
        break;
      }
      case 'grant': // co-op guest: host confirmed my pickup
        ctx.grantPickup(ev.kind, ev.payload);
        break;
      case 'xpkill': // co-op guest: my kill, my XP
        p.addXp(ev.xp);
        ctx.popup(p.mesh.position.clone().setY(p.mesh.position.y + 2.1), `+${ev.xp} XP`, '#c9a4ff');
        audio.sfx('kill_gold', 0.3, 100);
        break;
      case 'chop': { // partner chopped a tree — mirror it
        const trees = ctx.world.treesNear({ x: ev.x, z: ev.z }, 1.5);
        if (trees.length) ctx.world.chop(trees[0], ev.power, { x: ev.x + 1, z: ev.z });
        break;
      }
      case 'win': ctx.onCoopWin?.(); break;

      // ---------- MOBA ----------
      case 'mhit': { // host: guest hero damaged unit #id
        const u = this.moba?.units.find(x => x.id === ev.id && x.team !== 'enemy');
        if (u) {
          if (ev.dmg > 0) this.moba.damageUnit(u, ev.dmg, 'partner');
          if (ev.stun && (u.kind === 'creep' || u.kind === 'neutral')) u.stunT = Math.max(u.stunT, ev.stun);
        }
        break;
      }
      case 'mbuild': this.moba?.build('enemy', ev.id, ev.lane || null); break;
      case 'mreward': // guest: my kill on the host's sim
        p.addXp(ev.xp);
        p.meat += ev.meat;
        ctx.popup(p.mesh.position.clone().setY(p.mesh.position.y + 2.1), `+${ev.xp} XP +${ev.meat} 🍖`, '#c9a4ff');
        audio.sfx('kill_gold', 0.3, 100);
        break;
      case 'mobaEnd': ctx.endMoba(ev.won); break;
    }
  }

  broadcastWin() {
    if (this.active && this.mode === 'coop') WoodsNet.sendEvent({ type: 'win' });
  }

  dispose() {
    this.active = false;
    this.arena.active = false;
    this.ctx.world.removeArena();
    this.remote?.dispose(); this.remote = null;
    this.shadow?.dispose(); this.shadow = null;
    this.mobaShadow?.dispose(); this.mobaShadow = null;
    document.getElementById('mp-status')?.classList.add('hidden');
    WoodsNet.leave();
  }
}
