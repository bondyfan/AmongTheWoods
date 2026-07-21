// ==========================================================================
// GameRoom — the authoritative co-op simulation for ONE room, running the REAL
// game modules headless (Milestone 2). It replaces the host player: it owns a
// World + EnemyManager + Pickups + Projectiles, drives them from each connected
// guest's STATE (via per-uid target proxies), and broadcasts the same {e,p,s}
// wire snapshot the existing co-op guest already renders — plus the outbound
// authority messages the host used to send (pdmg / petDmg / grant / xpkill /
// questKill). Enemy HP is server-authoritative; player HP stays guest-owned.
//
// Must be imported AFTER the 'three' resolve hook is registered.
// ==========================================================================
import * as THREE from 'three';
import { bootWorld } from './world-sim.mjs';
import { EnemyManager } from '../../js/enemies.js';
import { Pickups } from '../../js/pickups.js';
import { Projectiles } from '../../js/projectiles.js';
import { audio } from '../../js/audio.js';
import { makeOnKill } from './onkill.mjs';

audio.muted = true;                    // silence all SFX before anything plays

const SNAP_HZ = 10;                    // 10 Hz world snapshot (matches host's 0.1s)
const NEAR = 130;                      // only stream entities within 130m of a player
const XP_SHARE_RADIUS = 100;
const QUEST_KILL_SHARE_RADIUS = 20;
const DAY = 600;                       // 10-min day/night cycle for spawn density

const noop = () => {};

export class GameRoom {
  // io = { broadcast(obj, exceptUid?), sendTo(uid, obj) }  (from Room)
  constructor(io) {
    this.io = io;
    const { world, scene } = bootWorld();
    this.world = world; this.scene = scene;
    world.time = 0;
    this.pickups = new Pickups(scene, world, { onCollect: noop });
    this.projectiles = new Projectiles(scene);
    this._onKill = makeOnKill({ pickups: this.pickups, awardKill: (e) => this._awardKill(e) });
    const hooks = new Proxy({ onKill: (e) => this._onKill(e) },
      { get: (t, k) => (k in t ? t[k] : noop) });
    this.enemyMgr = new EnemyManager(scene, world, hooks);
    this.players = new Map();          // uid -> { proxy, petProxy, hasPet }
    this._snapAcc = 0;
  }

  // ---- lifecycle ----
  addPlayer(uid) {
    const self = this;
    const proxy = {
      id: uid, pos: new THREE.Vector3(0, 0, 0),
      dead: false, stealthed: false, editorGhost: false, isPet: false, level: 1,
      takeDamage(dmg, src) { self._sendDamage(uid, 'pdmg', dmg, src, 0); },
      applyStun(sec, src) { self._sendDamage(uid, 'pdmg', 0, src, sec); },
    };
    const petProxy = {
      id: uid + '#pet', isPet: true, hitR: 0.5, sizeMult: 1, stunT: 0,
      pos: new THREE.Vector3(0, 0, 0), hp: 0, maxHp: 0, dead: true,
      takeDamage(dmg, src) { self._sendDamage(uid, 'petDmg', dmg, src, 0); },
      applyStun() {},
    };
    this.players.set(uid, { proxy, petProxy, hasPet: false });
  }

  removePlayer(uid) { this.players.delete(uid); }
  get empty() { return this.players.size === 0; }

  // ---- ingest a guest's STATE packet into its proxy ----
  onState(uid, st) {
    const P = this.players.get(uid);
    if (!P || !st) return;
    if (typeof st.x === 'number') P.proxy.pos.x = st.x;
    if (typeof st.z === 'number') P.proxy.pos.z = st.z;
    P.proxy.pos.y = this.world.heightAt(P.proxy.pos.x, P.proxy.pos.z);
    P.proxy.dead = !!st.dead;
    P.proxy.stealthed = !!st.st;
    P.proxy.level = st.lv || P.proxy.level;
    P.hasPet = !!st.pet;
    if (st.pet && typeof st.px === 'number') {
      P.petProxy.pos.set(st.px, this.world.heightAt(st.px, st.pz), st.pz);
      P.petProxy.hp = st.php ?? 0; P.petProxy.maxHp = st.pmhp ?? 0;
      P.petProxy.dead = !((st.php ?? 0) > 0);
    } else { P.petProxy.dead = true; }
  }

  // ---- apply a world-mutating event; return true if consumed (else Room relays) ----
  onEvent(uid, ev) {
    switch (ev?.type) {
      case 'ehit': {
        const e = this.enemyMgr.list.find(x => x.id === ev.id);
        if (e) {
          if (ev.dmg > 0) this.enemyMgr.damage(e, ev.dmg, null, ev.ps ? uid + '#pet' : uid, {
            crit: !!ev.cr, weakPoint: !!ev.wp,
            ...(ev.ap ? { armorPierce: ev.ap } : {}),
            ...(ev.ab ? { armorBreak: ev.ab, breakDur: ev.ad || 6 } : {}),
            ...(ev.bl ? { bleed: { dps: ev.bl, dur: ev.bt || 4 } } : {}),
            ...(ev.rd ? { rend: { dps: ev.rd, dur: ev.rt || 30 } } : {}),
            ...(ev.bu ? { burn: { dps: ev.bu, dur: ev.bd || 4 } } : {}),
            ...(ev.po ? { poison: { dps: ev.po, dur: ev.pt || 3 } } : {}),
          });
          if (ev.stun) this.enemyMgr.stun(e, ev.stun);
        }
        return true;
      }
      case 'collect': {
        const cand = this.pickups.list.find(x => x.id === ev.id);
        if (cand && cand.lockT > 0 && cand.lockId && cand.lockId !== uid) return true; // reserved for another
        const pk = this.pickups.removeById(ev.id);
        if (pk) this.io.sendTo(uid, { t: 'event', ev: { type: 'grant', kind: pk.kind, payload: pk.payload } });
        return true;
      }
      case 'drop':
        this.pickups.spawn(ev.k, ev.p, { x: ev.x, z: ev.z }, 0.5, ev.lk ? { id: uid, t: 10 } : null);
        return true;
      case 'chop': {
        const trees = this.world.treesNear?.({ x: ev.x, z: ev.z }, 1.5);
        if (trees?.length) this.world.chop(trees[0], ev.power, { x: ev.x + 1, z: ev.z });
        return true;
      }
      case 'berry':
        this.world.applyRemoteBerry?.(ev.k);
        return true;
      default:
        return false; // revive/ping/classHeal/… are peer relays — Room forwards them
    }
  }

  // ---- the authoritative tick (called from Room.tick) ----
  tick(dtMs) {
    if (this.players.size === 0) return;      // nothing to simulate for
    const dt = Math.min(dtMs / 1000, 0.1);
    this.world.time += dt;
    this.enemyMgr.nightK = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.world.time / DAY);
    const targets = this._targets();
    this.enemyMgr.update(dt, targets, this.projectiles);
    this.pickups.update(dt, []);              // NO auto-collect — guests send 'collect'
    this.projectiles.update(dt, this.enemyMgr, targets);
    this._snapAcc += dt;
    if (this._snapAcc >= 1 / SNAP_HZ) { this._snapAcc = 0; this._broadcastSnap(); }
  }

  // ---- internals ----
  _targets() {
    const out = [];
    for (const P of this.players.values()) {
      if (!P.proxy.dead) out.push(P.proxy);   // enemyMgr skips stealthed itself
      if (P.hasPet && !P.petProxy.dead) out.push(P.petProxy);
    }
    return out;
  }

  _broadcastSnap() {
    const alive = [...this.players.values()].filter(P => !P.proxy.dead).map(P => P.proxy.pos);
    const near = (x, z) => alive.some(p => Math.hypot(x - p.x, z - p.z) < NEAR);
    const snap = {
      e: this.enemyMgr.snapshot().filter(s => near(s.x, s.z)),
      p: this.pickups.snapshot().filter(s => near(s.x, s.z)),
      s: this.projectiles.snapshotShots(),
    };
    this.io.broadcast({ t: 'snap', snap });
  }

  _sendDamage(uid, type, dmg, src, stun) {
    const ev = { type, dmg: Math.round(dmg * 10) / 10 };
    if (src && src.id !== undefined) ev.ai = src.id;
    if (src && src.pos) { ev.ax = +src.pos.x.toFixed(1); ev.az = +src.pos.z.toFixed(1); }
    if (type === 'pdmg') {
      if (src && src.range != null) ev.ar = +src.range.toFixed(1);
      if (src && src.shot) ev.sh = 1;
      if (stun) ev.stun = stun;
    }
    this.io.sendTo(uid, { t: 'event', ev });
  }

  _awardKill(enemy) {
    const ex = enemy.pos.x, ez = enemy.pos.z;
    // shared kill XP: guests within 100m OR the killer; 75% each when two share
    const eligible = [];
    for (const [uid, P] of this.players) {
      const near = !P.proxy.dead && Math.hypot(P.proxy.pos.x - ex, P.proxy.pos.z - ez) < XP_SHARE_RADIUS;
      const credit = enemy.lastHitBy === uid || enemy.lastHitBy === uid + '#pet';
      if (near || credit) eligible.push(uid);
    }
    const share = eligible.length >= 2 ? 0.75 : 1;
    const xp = Math.max(1, Math.round(enemy.xp * share));
    for (const uid of eligible) this.io.sendTo(uid, { t: 'event', ev: { type: 'xpkill', xp } });
    // shared quest progress within 20m
    for (const [uid, P] of this.players) {
      if (P.proxy.dead) continue;
      if (Math.hypot(P.proxy.pos.x - ex, P.proxy.pos.z - ez) > QUEST_KILL_SHARE_RADIUS) continue;
      this.io.sendTo(uid, { t: 'event', ev: {
        type: 'questKill', t: enemy.type, b: enemy.bossRank || 0,
        x: +ex.toFixed(1), z: +ez.toFixed(1), pa: enemy.cfg?.passive ? 1 : 0,
        ...(Number.isInteger(enemy.questBiome) ? { bi: enemy.questBiome } : {}),
      } });
    }
  }
}
