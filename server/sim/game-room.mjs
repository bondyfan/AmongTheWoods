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
import { BIOMES, BIOME_LAIRS, biomeIndexAt, progressAt } from '../../js/config.js';

audio.muted = true;                    // silence all SFX before anything plays

// One snapshot per tick. Anything slower shows up as visibly surging enemies:
// the client smooths toward the last known position, so a long gap means a
// fast catch-up right after each packet and a crawl before the next one.
const SNAP_HZ = Number(process.env.SNAP_HZ || 15);
const NEAR = 130;                      // stream entities within 130m of a player…
const NEAR_KEEP = 175;                 // …and keep streaming them out to here
const XP_SHARE_RADIUS = 100;
const QUEST_KILL_SHARE_RADIUS = 20;
const DAY = 600;                       // 10-min day/night cycle for spawn density
// Man a POI once a player is this close. Must stay UNDER EnemyManager's
// ZONE_RELEASE (205 m) or the guards would melt back into the zone pool on the
// very tick they spawned; comfortably over NEAR (130 m) so they exist before
// anyone can see them appear.
const GARRISON_R = 180;
const GARRISON_HZ = 2;                 // rechecked twice a second

const noop = () => {};
const GUARDED_POI = new Set(['crypt', 'temple', 'summit', 'lair', 'captive']);

export class GameRoom {
  // io = { broadcast(obj, exceptUid?), sendTo(uid, obj) }  (from Room)
  constructor(io) {
    this.io = io;
    const { world, scene } = bootWorld();
    this.world = world; this.scene = scene;
    world.time = 0;
    this.pickups = new Pickups(scene, world, { onCollect: noop });
    // felled trees drop wood server-side (the client host used to mint these)
    world.onWoodLog = (pos) => this.pickups.spawn('wood', 1, pos, 0.15);
    this.projectiles = new Projectiles(scene);
    this._onKill = makeOnKill({ pickups: this.pickups, awardKill: (e) => this._awardKill(e) });
    const hooks = new Proxy({ onKill: (e) => this._onKill(e) },
      { get: (t, k) => (k in t ? t[k] : noop) });
    this.enemyMgr = new EnemyManager(scene, world, hooks);
    // GUARDED POIs. On a dedicated server nobody is the host, and the client
    // spawner bails out with `if (mp.active && !mp.isHost) return` — so crypts,
    // temples, summits, captives and boss LAIRS came up completely unguarded.
    // Walking to a lair and pressing E then passed the "any keepers left?"
    // check trivially and handed out the reward. The authority has to spawn
    // them, and the authority is here — see _garrisonNear, which is driven off
    // player proximity from tick(). It used to hang off world.onPoiSpawned, but
    // that fires from World._genChunk (it is the LANDMARK MESH going up), and
    // the server never builds chunk meshes: it calls only heightAt and chop.
    // The callback never ran once, and every crypt on the live server has been
    // standing empty.
    this.players = new Map();          // uid -> { proxy, petProxy, hasPet }
    this.groups = new Map();           // uid -> Set(uids) — who shares kills with whom
    this._snapAcc = 0;
    this._garrisonAcc = 0;
  }

  // Keep every POI near a player manned. This has to re-check rather than run
  // once: EnemyManager melts any unit further than ZONE_RELEASE from a player
  // back into its zone pool, so guards left behind DO evaporate and the crypt
  // has to be re-manned when someone walks back. Guards that were actually
  // FOUGHT stay dead — _awardKill marks the POI cleared, so we never quietly
  // restock a fight the player already won.
  _garrisonNear() {
    const near = [];
    for (const P of this.players.values()) if (!P.proxy.dead) near.push(P.proxy);
    if (!near.length) return;
    const manned = new Set();
    for (const e of this.enemyMgr.alive?.() ?? []) {
      if (e.cryptId != null && !e.dying) manned.add(e.cryptId);
    }
    for (const poi of this.world.pois) {
      if (poi.claimed || poi.cleared || manned.has(poi.id)) continue;
      if (!GUARDED_POI.has(poi.type)) continue;
      if (!near.some(p => Math.hypot(p.pos.x - poi.x, p.pos.z - poi.z) <= GARRISON_R)) continue;
      this._garrisonPoi(poi);
    }
  }

  // Mirror of the client's world.onPoiSpawned, minus the UI. Guards are spawned
  // un-aggroed and tagged with cryptId so "is it still guarded?" works.
  _garrisonPoi(poi) {
    if (!poi || poi.claimed) return;
    if (!GUARDED_POI.has(poi.type)) return;
    poi.guarded = true;
    const biome = BIOMES[biomeIndexAt(poi.x, poi.z)];
    const type = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
    const progress = progressAt(poi.x, poi.z);
    const ring = (n, radius, what) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const g = this.enemyMgr._spawn(what, poi.x + Math.cos(a) * radius,
          poi.z + Math.sin(a) * radius, progress);
        if (g) { g.aggroed = false; g.cryptId = poi.id; }
      }
    };
    if (poi.type === 'lair') {
      const lair = BIOME_LAIRS[poi.ring];
      if (!lair) return;
      ring(5, 5, type);
      const boss = this.enemyMgr._spawn(lair.type, poi.x, poi.z - 4, progress, 3, { ambush: true });
      if (boss) {
        boss.aggroed = false; boss.cryptId = poi.id;
        boss.bossName = lair.name;      // the snapshot streams this as `n`
        boss.lairId = poi.id;
      }
      return;
    }
    if (poi.type === 'summit') {
      ring(6, 6, 'yeti');
      const boss = this.enemyMgr._spawn('icegolem', poi.x, poi.z - 5, progress, 3, { ambush: true });
      if (boss) {
        boss.aggroed = false; boss.cryptId = poi.id;
        boss.bossName = 'Ymir, Father of the Mountain';
      }
      return;
    }
    const rank = poi.type === 'temple' ? 3 : (poi.ring < 2 ? 1 : poi.ring < 4 ? 2 : 3);
    const count = poi.type === 'captive' ? 8 : (poi.type === 'temple' ? 6 : 4 + rank);
    ring(count, 4.5, type);
    if (poi.type !== 'captive') {
      const boss = this.enemyMgr._spawn(type, poi.x + 3, poi.z + 3, progress, rank,
        { ambush: true, noReinforce: true });
      if (boss) { boss.aggroed = false; boss.cryptId = poi.id; }
    }
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

  removePlayer(uid) { this.players.delete(uid); this.groups.delete(uid); }
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
    // a ghost is walking but not present: enemies must not chase or hit it, and
    // it cannot hoover loot. validTarget in enemies.js already honours `ghost`.
    P.proxy.ghost = !!st.gh;
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
        // lock semantics (pickups.js): the DROPPER can't take their own drop
        // back for lockT seconds — everyone else may grab it right away
        if (cand && cand.lockT > 0 && cand.lockId === uid) return true;
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
      case 'hive': {
        // a guest cracked a beehive: the swarm has to live HERE, or it is bees
        // the player can see but never hit and that never move
        const n = 10 + Math.floor(Math.random() * 11);
        const prog = progressAt(ev.x, ev.z);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const e = this.enemyMgr._spawn('bee',
            ev.x + Math.cos(a) * 1.4, ev.z + Math.sin(a) * 1.4, prog * 0.3);
          if (e) e.aggroed = true;
        }
        return true;
      }
      case 'gset': {
        // a client's group roster — kill XP and quest credit are shared inside
        // it and nowhere else. Consumed here; peers learn it from the leader.
        const mem = Array.isArray(ev.mem) ? ev.mem.filter(u => typeof u === 'string') : [];
        if (mem.length > 1) this.groups.set(uid, new Set(mem));
        else this.groups.delete(uid);
        return true;
      }
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
    // before the AI runs, so a freshly manned crypt ticks the same frame
    this._garrisonAcc += dt;
    if (this._garrisonAcc >= 1 / GARRISON_HZ) { this._garrisonAcc = 0; this._garrisonNear(); }
    this.enemyMgr.update(dt, targets, this.projectiles);
    this.pickups.update(dt, []);              // NO auto-collect — guests send 'collect'
    this.projectiles.update(dt, this.enemyMgr, targets);
    this._snapAcc += dt;
    if (this._snapAcc >= 1 / SNAP_HZ) {
      // subtract the period instead of zeroing it: zeroing threw away the
      // leftover time every tick, which silently paced 10 Hz down to 7.5 Hz
      this._snapAcc = Math.min(this._snapAcc - 1 / SNAP_HZ, 1 / SNAP_HZ);
      this._broadcastSnap();
    }
  }

  // ---- internals ----
  _targets() {
    const out = [];
    for (const P of this.players.values()) {
      // ALWAYS include the player proxy, even when dead — the enemy AI needs it
      // as a spatial anchor (_anchor falls back to targets[0]) and filters
      // dead/stealthed for actual targeting itself. The client does the same;
      // passing an empty array crashes enemyMgr.update (anchor undefined).
      out.push(P.proxy);
      if (P.hasPet && !P.petProxy.dead) out.push(P.petProxy);
    }
    return out;
  }

  _broadcastSnap() {
    // near-filter on ALL players (alive or downed) — a downed player is still in
    // the world watching, so enemies around them must keep streaming (an
    // alive-only filter emptied the snapshot and culled every enemy client-side)
    const positions = [...this.players.values()].map(P => P.proxy.pos);
    // HYSTERESIS. A single radius makes every enemy that drifts across the
    // boundary pop out of the snapshot and back in, and the client hard-removes
    // anything missing from a snapshot — so it reads as mobs despawning and
    // respawning around you. It is worst when they scatter, e.g. the moment a
    // rogue vanishes and they all lose their target. Enter at NEAR, leave only
    // past NEAR_KEEP.
    const inRange = (x, z, r) => positions.some(p => Math.hypot(x - p.x, z - p.z) < r);
    const prev = this._streamed || (this._streamed = new Set());
    const nowStreamed = new Set();
    const near = (id, x, z) => {
      const keep = prev.has(id) ? NEAR_KEEP : NEAR;
      if (!inRange(x, z, keep)) return false;
      nowStreamed.add(id);
      return true;
    };
    const snap = {
      e: this.enemyMgr.snapshot().filter(s => near('e' + s.id, s.x, s.z)),
      p: this.pickups.snapshot().filter(s => near('p' + s.i, s.x, s.z)),
      s: this.projectiles.snapshotShots(),
    };
    this._streamed = nowStreamed;
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

  // who landed the killing blow (uid), or null if nobody tracked did
  _killerUid(enemy) {
    const by = enemy.lastHitBy;
    if (!by || by === 'local') return null;
    const base = by.endsWith('#pet') ? by.slice(0, -4) : by;
    return this.players.has(base) ? base : null;
  }

  // does `uid` share `killer`'s kills? Only inside a group both agree on.
  _sharesWith(killer, uid) {
    if (killer === uid) return true;
    const g = this.groups.get(killer);
    return !!(g && g.has(uid) && this.groups.get(uid)?.has(killer));
  }

  _awardKill(enemy) {
    const ex = enemy.pos.x, ez = enemy.pos.z;
    // A keeper died in a real fight — retire the POI from the garrison sweep.
    // Marked before the killer check on purpose: however it died, someone was
    // standing there, and restocking a crypt behind their back is worse than
    // leaving a half-cleared one. (Melted guards never reach this path.)
    if (enemy.cryptId != null) {
      const poi = this.world.pois.find(p => p.id === enemy.cryptId);
      if (poi) poi.cleared = true;
    }
    // kill XP goes to the KILLER, plus their group-mates near the corpse.
    // Ungrouped bystanders get nothing — no free XP off a stranger's work.
    const killer = this._killerUid(enemy);
    if (!killer) return;                       // nothing tracked landed the blow
    const eligible = [];
    for (const [uid, P] of this.players) {
      if (!this._sharesWith(killer, uid)) continue;
      const near = !P.proxy.dead && Math.hypot(P.proxy.pos.x - ex, P.proxy.pos.z - ez) < XP_SHARE_RADIUS;
      if (uid === killer || near) eligible.push(uid);
    }
    const share = eligible.length >= 2 ? 0.75 : 1;
    const xp = Math.max(1, Math.round(enemy.xp * share));
    for (const uid of eligible) this.io.sendTo(uid, { t: 'event', ev: { type: 'xpkill', xp } });
    // quest progress: same group rule, tighter radius
    for (const [uid, P] of this.players) {
      if (P.proxy.dead) continue;
      if (!this._sharesWith(killer, uid)) continue;
      if (uid !== killer && Math.hypot(P.proxy.pos.x - ex, P.proxy.pos.z - ez) > QUEST_KILL_SHARE_RADIUS) continue;
      this.io.sendTo(uid, { t: 'event', ev: {
        type: 'questKill', t: enemy.type, b: enemy.bossRank || 0,
        x: +ex.toFixed(1), z: +ez.toFixed(1), pa: enemy.cfg?.passive ? 1 : 0,
        ...(Number.isInteger(enemy.questBiome) ? { bi: enemy.questBiome } : {}),
      } });
    }
  }
}
