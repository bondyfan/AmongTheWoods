// ---- Enemy spawning (singles + packs with boss mothers + reinforcements),
// AI (melee, ranged spitters, flyers), damage ----

import * as THREE from 'three';
import { WORLD, ENEMY_TYPES, BOSS_RANKS, BIOMES, biomeAt, biomeIndexAt, progressAt,
         meatForHp, bossNameFor } from './config.js';
import { makeEnemyMesh, makeCobweb, makeHumanCamp } from './models.js';
import { audio } from './audio.js';

let nextEnemyId = 1;
let nextGroupId = 1; // herds of passive critters (rabbits) share a group
const SPAWN_DENSITY = 2.16; // dense, dangerous woods (+30% again)
const MAX_ALIVE_HARD = 140; // hard cap on simultaneously live units
// give up a chase after this long without reaching the target, then jog home
const LEASH_TIME = 7;
const LEASH_TIME_BOSS = 16;
// Persistent zone population: the world is carved into ZONE×ZONE cells; each
// cell populates ONCE (always out of the player's sight), the dead STAY dead,
// and a fully wiped cell only repopulates REPOP_COOLDOWN after the wipe.
// Units left far behind melt back into their zone's pool (they're remembered,
// not respawned) and rematerialize when someone returns.
const ZONE = 120;
const ZONE_ACTIVATE = 175;   // zones this close to a player materialize
const ZONE_RELEASE = 205;    // live units further than this return to the pool
const SPAWN_MIN_DIST = 62;   // nothing ever appears closer than this to a player
const REPOP_COOLDOWN = 1800; // 30 minutes

class Enemy {
  constructor(type, x, z, difficulty, bossRank = 0) {
    const base = ENEMY_TYPES[type];
    this.id = nextEnemyId++;
    this.type = type;
    this.cfg = base;
    this.bossRank = bossRank; // 0 = normal, 1..3 = skull rank
    const boss = bossRank > 0 ? BOSS_RANKS[bossRank - 1] : null;

    this.hp = base.hp * (1 + difficulty * 1.2) * (boss ? boss.hpMult : 1);
    this.maxHp = this.hp;
    this.dmg = base.dmg * (1 + difficulty * 0.8) * (boss ? boss.dmgMult : 1);
    this.xp = Math.round(base.xp * (boss ? boss.xpMult : 1));
    this.meat = meatForHp(this.maxHp); // 1 meat / 30 HP — bosses pay out big
    this.sizeMult = boss ? boss.sizeMult : 1;
    this.hitR = base.hitR * this.sizeMult;
    this.range = base.range * this.sizeMult;
    this.speed = base.speed * (boss ? 0.9 : 1);
    if (boss) this.reinforceT = boss.reinforceInterval;

    this.meleeDmg = (base.meleeDmg ?? base.dmg) * (1 + difficulty * 0.8) * (boss ? boss.dmgMult : 1);

    this.pos = new THREE.Vector3(x, 0, z);
    this.mesh = makeEnemyMesh(type);
    if (this.sizeMult !== 1) this.mesh.scale.multiplyScalar(this.sizeMult);
    this.mesh.position.copy(this.pos);
    this.attackCd = 0;
    // ranged shot is a "spell": charges up, then a short stationary cast
    this.spellTimer = base.ranged ? base.spellCd * (0.5 + Math.random() * 0.5) : 0;
    this.pauseT = 0;
    this.stunT = 0;
    this.windupT = 0;   // heavy attackers telegraph before landing the blow
    this.flashT = 0;    // hit-feedback scale pop
    this.enraged = false;
    this.aggroed = bossRank > 0;
    this.groupId = 0;     // passive herd membership
    this.spooked = false; // passive critters flee only after the herd is hurt
    this.spawnPos = { x, z }; // leash: where to run back to after a failed chase
    this.chaseT = 0;
    this.returning = false;
    this.threatLog = []; // { src, dmg, t } — who hurt me, when, how much
    this.wanderDir = Math.random() * Math.PI * 2;
    this.wanderT = 0;
    this.walkT = Math.random() * 10;
    this.lungeT = 0;
    this.dying = 0;
    this.flyY = base.flying ? 1.5 : 0;
  }
}

export class EnemyManager {
  constructor(scene, world, hooks) {
    this.scene = scene;
    this.world = world;
    // hooks: { popup, onKill(e), onDiscover(type), onBossSpawn(e), onBossDeath(e),
    //          onSpawn(e), onRemove(e) }  — onSpawn/onRemove drive the HP bars.
    this.hooks = hooks;
    this.list = [];
    this.webs = []; // decorative cobwebs left around spider packs
    this.slams = []; // telegraphed boss ground-slam rings
    this.zones = new Map(); // "zx,zz" -> { pool, everPopulated, cleared, nextRepopAt }
    this.zoneTimer = 1;
    this.discovered = new Set();
  }

  alive() { return this.list.filter(e => !e.dying); }

  spawnInitialWave() {
    // first prey waits south of the camp, outside the cave clearing
    this._spawn('rat', -8, 42, 0);
    this._spawn('spider', 0, 46, 0);
    this._spawn('rat', 8, 42, 0);
  }

  _spawn(type, x, z, difficulty, bossRank = 0, flags = null) {
    const e = new Enemy(type, x, z, difficulty, bossRank);
    if (flags) Object.assign(e, flags); // ambush/noReinforce BEFORE the hooks fire
    if (bossRank > 0 && !e.bossName) e.bossName = bossNameFor(type, e.id);
    this.scene.add(e.mesh);
    this.list.push(e);
    if (bossRank > 0) this.hooks.onBossSpawn(e);
    this.hooks.onSpawn(e);
    return e;
  }

  _remove(e, index) {
    this.hooks.onRemove(e);
    this.scene.remove(e.mesh);
    this.list.splice(index, 1);
  }

  _spawnPoint(anchor, { allSides = false, spread = 0 } = {}) {
    const ar = Math.hypot(anchor.pos.x, anchor.pos.z);
    // bias spawns AWAY from home (outward) most of the time
    const outAngle = Math.atan2(anchor.pos.x, anchor.pos.z);
    const theta = (!allSides && ar > 5 && Math.random() < 0.65)
      ? outAngle + (Math.random() - 0.5) * 1.8
      : Math.random() * Math.PI * 2;
    // reinforcements arrive from OFF-SCREEN — spawns must never be visible
    const dist = SPAWN_MIN_DIST + Math.random() * 14;
    let x = anchor.pos.x + Math.sin(theta) * dist + (Math.random() - 0.5) * spread;
    let z = anchor.pos.z + Math.cos(theta) * dist + (Math.random() - 0.5) * spread;
    // stay in the anchor's ring band so they actually have to fight
    ({ x, z } = this.world.clampToBand(x, z, anchor.pos.x, anchor.pos.z));
    const r = Math.hypot(x, z);
    if (r < 28) { const k = 28 / (r || 1); x *= k; z *= k; } // never at the camp
    if (r > WORLD.radius - 6) { const k = (WORLD.radius - 6) / r; x *= k; z *= k; }
    return { x, z };
  }

  // random living target as the anchor for spawn placement (co-op spreads
  // spawns between both players; solo this is always the player)
  _anchor(targets) {
    const living = targets.filter(t => !t.dead);
    if (!living.length) return targets[0];
    const vulnerable = living.filter(t => !this.world.isTargetSafe?.(t.pos));
    if (vulnerable.length) return vulnerable[Math.floor(Math.random() * vulnerable.length)];
    return living[Math.floor(Math.random() * living.length)];
  }

  _spawnAnchors(targets) {
    return targets.filter(t => !t.dead && !this.world.isTargetSafe?.(t.pos));
  }

  // ---------- persistent zone population ----------

  // Roll what LIVES in this zone: a few singles, maybe a pack with a boss
  // mother, maybe a grazing critter herd (with its lurking guardian).
  _generatePool(cx, cz) {
    const biome = biomeAt(cx, cz);
    const progress = progressAt(cx, cz);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const pool = [];
    const singles = Math.round((3 + progress * 7) * SPAWN_DENSITY);
    for (let i = 0; i < singles; i++) pool.push({ type: pick(biome.enemies) });

    if (biome.packs && Math.random() < 0.4) {
      const type = pick(biome.enemies);
      let rank = 0;
      if (Math.random() < 0.7) {
        let roll = Math.random();
        rank = 1;
        for (let i = 0; i < 3; i++) {
          roll -= biome.packs.skulls[i];
          if (roll <= 0) { rank = i + 1; break; }
        }
      }
      const gid = nextGroupId++;
      const count = rank > 0 ? BOSS_RANKS[rank - 1].packSize : 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) pool.push({ type, groupId: gid });
      if (rank > 0) pool.push({ type, bossRank: rank, groupId: gid });
    }

    // humanoids are RARE — but where they do settle, they build a proper
    // camp: a dwelling with a fire, and the whole band lives around it
    if (biome.humanoids?.length && Math.random() < 0.12) {
      const type = pick(biome.humanoids);
      const gid = nextGroupId++;
      const count = 3 + Math.floor(Math.random() * 4); // a camp of 3-6
      for (let i = 0; i < count; i++) pool.push({ type, groupId: gid, camp: true });
    }

    // spider-haunted woods: almost every zone hides a spider (or bat) nest,
    // usually with a brood mother — these packs drape the ground in webs
    if (biome.spiderHaunt && Math.random() < 0.85) {
      const nest = biome.enemies.filter(t => /spider|bat/i.test(t));
      if (nest.length) {
        const type = pick(nest);
        let rank = Math.random() < 0.6 ? 1 : 0;
        if (rank && Math.random() < 0.25) rank = 2;
        const gid = nextGroupId++;
        const count = rank > 0 ? BOSS_RANKS[rank - 1].packSize : 5 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) pool.push({ type, groupId: gid });
        if (rank > 0) pool.push({ type, bossRank: rank, groupId: gid });
      }
    }

    if (biome.critters && Math.random() < 0.55) {
      const type = pick(biome.critters);
      const cfg = ENEMY_TYPES[type];
      const [lo, hi] = cfg.herd ?? [3, 10];
      const gid = nextGroupId++;
      const count = lo + Math.floor(Math.random() * (hi - lo + 1));
      for (let i = 0; i < count; i++) pool.push({ type, groupId: gid });
      if (cfg.guardian) pool.push({ type: cfg.guardian, bossRank: 1, groupId: gid, guardian: true });
    }
    return pool;
  }

  // Materialize a zone's pool into live units — every placement is at least
  // SPAWN_MIN_DIST from every player, so nothing ever pops in on screen.
  _materializeZone(zone, key, cx, cz, targets) {
    const living = targets.filter(t => !t.dead);
    const tryPoint = () => {
      for (let i = 0; i < 14; i++) {
        const x = cx + (Math.random() - 0.5) * ZONE;
        const z = cz + (Math.random() - 0.5) * ZONE;
        const r = Math.hypot(x, z);
        if (r < 45 || r > WORLD.radius - 6) continue;
        if (living.some(t => Math.hypot(t.pos.x - x, t.pos.z - z) < SPAWN_MIN_DIST)) continue;
        return { x, z };
      }
      return null; // player is covering the zone — retry on a later tick
    };

    const progress = progressAt(cx, cz);
    const byGroup = new Map();
    for (const spec of zone.pool) {
      const gk = spec.groupId ?? `solo-${nextGroupId++}`;
      if (!byGroup.has(gk)) byGroup.set(gk, []);
      byGroup.get(gk).push(spec);
    }
    const remaining = [];
    for (const [, specs] of byGroup) {
      if (this.alive().length >= MAX_ALIVE_HARD) { remaining.push(...specs); continue; }
      // humanoid bands settle a permanent camp site: first visit builds the
      // dwelling, and every re-materialization brings them home to it
      const isCamp = specs.some(sp => sp.camp);
      let at;
      if (isCamp && zone.campAt) {
        at = zone.campAt;
        if (living.some(t => Math.hypot(t.pos.x - at.x, t.pos.z - at.z) < SPAWN_MIN_DIST)) {
          remaining.push(...specs); continue; // someone is looking at the camp
        }
      } else {
        at = tryPoint();
        if (!at) { remaining.push(...specs); continue; }
      }
      if (isCamp && !zone.campAt) {
        zone.campAt = at;
        this._buildCampSite(at, specs[0].type);
      }
      const ringR = 1.5 + Math.sqrt(specs.length) * 1.6;
      specs.forEach((spec, i) => {
        const a = (i / specs.length) * Math.PI * 2;
        const rr = specs.length > 1 ? ringR * (0.4 + Math.random() * 0.6) : 0;
        const e = this._spawn(spec.type, at.x + Math.cos(a) * rr, at.z + Math.sin(a) * rr,
          progress, spec.bossRank || 0, {
            // repeat announcements are muted; herd guardians are always quiet
            ambush: !!(spec.guardian || spec.announced),
            noReinforce: !!spec.guardian,
          });
        e.aggroed = false;
        e.zoneKey = key;
        e.groupId = spec.groupId || 0;
        // remembered when the unit melts back into the pool later
        e._spec = { type: spec.type, bossRank: spec.bossRank || 0, camp: spec.camp,
                    groupId: spec.groupId, guardian: spec.guardian, announced: true };
        if (spec.bossRank && !spec.guardian && !spec.announced) audio.sfx('lane_unlock', 0.45);
      });
      if (specs.length > 3 && /spider/i.test(specs[0].type)) this._spawnWebs(at);
    }
    zone.pool = remaining;
  }

  _updateZones(targets) {
    const anchors = this._spawnAnchors(targets);
    if (!anchors.length) return;
    // live head-count per zone (dead/dying don't count — the dead STAY dead)
    const liveByZone = new Map();
    for (const e of this.list) {
      if (e.dying || !e.zoneKey) continue;
      liveByZone.set(e.zoneKey, (liveByZone.get(e.zoneKey) || 0) + 1);
    }
    const seen = new Set();
    for (const a of anchors) {
      const z0 = Math.floor((a.pos.z - ZONE_ACTIVATE) / ZONE), z1 = Math.floor((a.pos.z + ZONE_ACTIVATE) / ZONE);
      const x0 = Math.floor((a.pos.x - ZONE_ACTIVATE) / ZONE), x1 = Math.floor((a.pos.x + ZONE_ACTIVATE) / ZONE);
      for (let zx = x0; zx <= x1; zx++) for (let zz = z0; zz <= z1; zz++) {
        const key = zx + ',' + zz;
        if (seen.has(key)) continue;
        seen.add(key);
        const cx = zx * ZONE + ZONE / 2, cz = zz * ZONE + ZONE / 2;
        if (Math.hypot(cx - a.pos.x, cz - a.pos.z) > ZONE_ACTIVATE) continue;
        const zr = Math.hypot(cx, cz);
        if (zr < 60 || zr > WORLD.radius) continue; // the camp area stays wild-free
        let zone = this.zones.get(key);
        if (!zone) { zone = { pool: null, everPopulated: false, cleared: false, nextRepopAt: 0 }; this.zones.set(key, zone); }
        const live = liveByZone.get(key) || 0;
        const poolEmpty = !zone.pool || zone.pool.length === 0;

        if (poolEmpty && live === 0) {
          if (!zone.everPopulated) {
            zone.pool = this._generatePool(cx, cz);   // first visit ever
            zone.everPopulated = true;
          } else if (!zone.cleared) {
            zone.cleared = true;                       // the wipe starts the clock
            zone.nextRepopAt = this.world.time + REPOP_COOLDOWN;
          } else if (this.world.time >= zone.nextRepopAt) {
            zone.pool = this._generatePool(cx, cz);   // 30 min later: new blood
            zone.cleared = false;
          }
        }
        if (zone.pool?.length) this._materializeZone(zone, key, cx, cz, targets);
      }
    }
  }

  // humanoid camp: dwelling + campfire, planted once and left standing
  // (a raided camp stays as a landmark). Blocks movement like a boulder.
  _buildCampSite(at, type) {
    const kind = /tribesman|shaman/.test(type) ? 'tribal' : 'bandit';
    const mesh = makeHumanCamp(kind);
    mesh.position.set(at.x, this.world.heightAt(at.x, at.z), at.z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.campSites ??= [];
    this.campSites.push(mesh);
    this.world.obstacles?.push({ x: at.x, z: at.z, r: kind === 'tribal' ? 1.8 : 1.9 });
  }

  // spider packs leave their hunting ground draped in cobwebs for a while
  _spawnWebs(center) {
    const n = 10 + Math.floor(Math.random() * 7);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 15;
      const x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r;
      const web = makeCobweb();
      web.position.set(x, this.world.heightAt(x, z) + 0.07, z);
      web.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(web);
      // webs are sticky: anything walking through one is slowed hard
      this.webs.push({ mesh: web, t: 120, x, z, r: web.userData.radius ?? 2.5 });
    }
  }

  // 60% movement slow while standing in a cobweb
  webSlowAt(x, z) {
    for (const w of this.webs) {
      const d = Math.hypot(x - w.x, z - w.z);
      if (d < w.r) return 0.4;
    }
    return 1;
  }

  // While a boss lives, her children keep arriving from ALL directions.
  _bossReinforcements(dt, targets) {
    const anchor = this._anchor(targets);
    if (!anchor || this.world.isTargetSafe?.(anchor.pos)) return;
    const progress = progressAt(anchor.pos.x, anchor.pos.z);
    for (const boss of this.list) {
      if (boss.bossRank === 0 || boss.dying || boss.noReinforce) continue;
      boss.reinforceT -= dt;
      if (boss.reinforceT > 0) continue;
      const rank = BOSS_RANKS[boss.bossRank - 1];
      boss.reinforceT = rank.reinforceInterval;
      if (this.alive().length >= MAX_ALIVE_HARD) continue;
      for (let i = 0; i < rank.reinforceCount; i++) {
        const { x, z } = this._spawnPoint(anchor, { allSides: true });
        this._spawn(boss.type, x, z, progress);
      }
    }
  }

  stun(enemy, sec) {
    if (!enemy.dying) enemy.stunT = Math.max(enemy.stunT, sec);
  }

  damage(enemy, dmg, knockDir, srcId = 'local', opts = null) {
    if (enemy.dying) return;
    enemy.hp -= dmg;
    enemy.aggroed = true;
    enemy.returning = false; // getting hit re-engages a leashed enemy
    enemy.chaseT = 0;
    enemy.flashT = 0.12;     // brief white-hot scale pop so hits READ
    enemy.threatLog.push({ src: srcId, dmg, t: this.world.time });
    if (enemy.cfg.passive && !enemy.spooked) {
      // one hurt rabbit spooks the whole herd
      enemy.spooked = true;
      if (enemy.groupId) for (const o of this.list) {
        if (o.groupId === enemy.groupId) o.spooked = true;
      }
    }
    // hurting ANY group member enrages its protectors (the herd's guardian
    // wolf, the pack around a mother) — instantly, however far they stand
    if (enemy.groupId) {
      for (const o of this.list) {
        if (o.dying || o === enemy || o.groupId !== enemy.groupId || o.cfg.passive) continue;
        o.aggroed = true;
        o.returning = false;
        o.chaseT = 0;
        o.threatLog.push({ src: srcId, dmg: dmg * 0.6, t: this.world.time });
      }
    }
    enemy.lastHitBy = srcId; // kill credit (co-op XP attribution)
    this.hooks.popup(enemy.mesh.position.clone().setY(enemy.mesh.position.y + 1.4 * enemy.sizeMult + 0.4),
      Math.round(dmg).toString(), opts?.crit ? '#ffd23a' : '#ffffff', opts?.crit ? 'big' : '');
    if (knockDir && enemy.bossRank === 0) {
      enemy.pos.x += knockDir.x * 0.45;
      enemy.pos.z += knockDir.z * 0.45;
    }
    if (enemy.hp <= 0) this._kill(enemy);
    else audio.sfx('hit', 0.25, 90);
  }

  _kill(enemy) {
    enemy.dying = 0.0001;
    audio.sfx('death', 0.28, 40);
    audio.creature(enemy.type, 'death', 0.45, 30);
    if (enemy.bossRank > 0) this.hooks.onBossDeath(enemy);
    this.hooks.onRemove(enemy);
    this.hooks.onKill(enemy);
  }

  // targets: array of { pos, dead, takeDamage(d), applyStun?(s) } — the local
  // player solo, or both players in co-op (the remote one via a network proxy).
  update(dt, targets, projectiles) {
    const anchor = this._anchor(targets);

    this.zoneTimer -= dt;
    if (this.zoneTimer <= 0) {
      this.zoneTimer = 0.8;
      this._updateZones(targets);
    }

    this._bossReinforcements(dt, targets);

    // bestiary: a creature counts as discovered only once you've SEEN it up
    // close (12 m) — not when it spawns somewhere off-screen
    this.discoverT = (this.discoverT ?? 0) - dt;
    if (this.discoverT <= 0) {
      this.discoverT = 0.5;
      for (const e of this.list) {
        if (e.dead || this.discovered.has(e.type)) continue;
        for (const t of targets) {
          if (t.dead || t.isPet || !t.pos) continue;
          if (Math.hypot(e.pos.x - t.pos.x, e.pos.z - t.pos.z) < 12) {
            this.discovered.add(e.type);
            this.hooks.onDiscover(e.type);
            break;
          }
        }
      }
    }

    // canopy ambush: in thick woods a spider may rappel out of the trees
    // right on top of you — the denser the stand, the likelier the drop
    this.treeDropT = (this.treeDropT ?? 4) - dt;
    if (this.treeDropT <= 0) {
      this.treeDropT = 2.5;
      for (const t of targets) {
        if (t.dead || t.isPet || !t.pos || this.world.isTargetSafe?.(t.pos)) continue;
        const trees = this.world.treesNear?.({ x: t.pos.x, z: t.pos.z }, 11) ?? [];
        const tall = trees.filter(tr => tr.alive && tr.size > 0);
        if (tall.length < 4) continue;                    // needs a real thicket
        if (Math.random() > 0.10 + tall.length * 0.012) continue;
        if (this.world.time < (this._lastTreeDrop ?? 0) + 16) continue;
        const nearby = this.alive().filter(e =>
          /spider/i.test(e.type) && Math.hypot(e.pos.x - t.pos.x, e.pos.z - t.pos.z) < 25);
        if (nearby.length >= 4) continue;                 // don't stack an army
        this._lastTreeDrop = this.world.time;
        const biome = biomeAt(t.pos.x, t.pos.z);
        const type = biome.enemies.find(ty => /spider/i.test(ty)) ?? 'spider';
        const tree = tall[Math.floor(Math.random() * tall.length)];
        const e = this._spawn(type, tree.x, tree.z, progressAt(t.pos.x, t.pos.z));
        e.dropT = 1;           // 1 s descent, then it attacks
        e.ambush = true;       // no boss fanfare
        e.mesh.position.y += 7;
        this.hooks.popup?.(e.mesh.position.clone(), '🕷️!', '#c9ffa4');
      }
    }

    // cobwebs slowly fade and vanish
    for (let i = this.webs.length - 1; i >= 0; i--) {
      const w = this.webs[i];
      w.t -= dt;
      if (w.t < 8) w.mesh.children[0].material.opacity = 0.55 * Math.max(0, w.t / 8);
      if (w.t <= 0) { this.scene.remove(w.mesh); this.webs.splice(i, 1); }
    }

    // boss ground slams: the red ring is the warning — get OUT of it
    for (let i = this.slams.length - 1; i >= 0; i--) {
      const s = this.slams[i];
      s.t -= dt;
      s.mesh.material.opacity = 0.18 + 0.42 * (1 - Math.max(0, s.t) / 0.75);
      if (s.t <= 0) {
        for (const t of targets) {
          if (t.dead) continue;
          if (Math.hypot(t.pos.x - s.x, t.pos.z - s.z) < s.r + 0.4) {
            t.takeDamage(s.dmg, { pos: { x: s.x, z: s.z }, range: s.r + 0.4 });
          }
        }
        audio.sfx('special', 0.5, 100);
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        this.slams.splice(i, 1);
      }
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];

      if (e.dying) {
        e.dying += dt;
        e.mesh.rotation.z = Math.min(Math.PI / 2, e.dying * 4);
        e.mesh.position.y = this.world.heightAt(e.pos.x, e.pos.z) + e.flyY * Math.max(0, 1 - e.dying * 2)
          - Math.max(0, e.dying - 0.5) * 1.2;
        if (e.dying > 1.0) {
          this.scene.remove(e.mesh);
          this.list.splice(i, 1);
        }
        continue;
      }

      // canopy ambusher still descending on its silk thread (1 s)
      if (e.dropT > 0) {
        e.dropT -= dt;
        const ground = this.world.heightAt(e.pos.x, e.pos.z);
        e.mesh.position.set(e.pos.x, ground + Math.max(0, e.dropT) * 7, e.pos.z);
        e.mesh.rotation.y += dt * 2;
        if (e.dropT <= 0) e.aggroed = true; // hits the ground furious
        continue;
      }

      if (!e.cfg.flying) this.world.pushOutOfSafeZones?.(e.pos, e.hitR ?? 0.5);

      // pick a target: whoever dealt the most damage in the last 5 s owns
      // this creature's attention (so a biting pet PULLS enemies off you);
      // with no recent attacker it's the nearest visible target. Creatures
      // never see across a biome border.
      const eBiome = biomeIndexAt(e.pos.x, e.pos.z);
      const validTarget = (t) => t && !t.dead && t.pos
        && !this.world.isTargetSafe?.(t.pos)
        && biomeIndexAt(t.pos.x, t.pos.z) === eBiome;
      let target = null, dist = Infinity;
      if (e.threatLog.length) {
        const now = this.world.time;
        e.threatLog = e.threatLog.filter(en => now - en.t < 5);
        const sums = {};
        for (const en of e.threatLog) sums[en.src] = (sums[en.src] || 0) + en.dmg;
        let bestSrc = null, bestDmg = 0;
        for (const src in sums) if (sums[src] > bestDmg) { bestDmg = sums[src]; bestSrc = src; }
        const tt = targets.find(t => t.id === bestSrc);
        if (validTarget(tt)) {
          target = tt;
          dist = Math.hypot(tt.pos.x - e.pos.x, tt.pos.z - e.pos.z);
          e.aggroed = true;
        }
      }
      if (!target) {
        for (const t of targets) {
          if (!validTarget(t)) continue;
          const d = Math.hypot(t.pos.x - e.pos.x, t.pos.z - e.pos.z);
          if (d < dist) { dist = d; target = t; }
        }
      }
      if (!target) e.aggroed = false;
      const toPlayer = target
        ? new THREE.Vector3().subVectors(target.pos, e.pos)
        : new THREE.Vector3();
      if (!target) dist = Math.hypot(anchor.pos.x - e.pos.x, anchor.pos.z - e.pos.z);

      // left far behind → the unit melts back into its zone's pool (it's
      // REMEMBERED, not killed — it rematerializes when someone returns)
      if (dist > ZONE_RELEASE) {
        if (e.zoneKey) {
          const zone = this.zones.get(e.zoneKey);
          zone?.pool?.push(e._spec ?? {
            type: e.type, bossRank: e.bossRank, groupId: e.groupId, announced: true,
          });
        }
        if (e.bossRank > 0) this.hooks.onBossDeath(e); // clears the skull tracker
        this._remove(e, i);
        continue;
      }

      // stunned/frozen: no movement, no attacks
      if (e.stunT > 0) {
        e.stunT -= dt;
        e.mesh.position.set(e.pos.x, this.world.heightAt(e.pos.x, e.pos.z) + e.flyY, e.pos.z);
        continue;
      }

      // ---- boss abilities ----
      if (e.bossRank > 0) {
        // 2+ skull mothers slam the ground: telegraphed AoE around them
        if (e.bossRank >= 2) {
          e.slamCd = (e.slamCd ?? 5) - dt;
          if (e.slamCd <= 0 && target && dist < 5) {
            e.slamCd = 8;
            e.pauseT = Math.max(e.pauseT, 0.8); // she rears up for the blow
            const mesh = new THREE.Mesh(
              new THREE.RingGeometry(0.5, 4.5, 28),
              new THREE.MeshBasicMaterial({ color: 0xff5030, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(e.pos.x, this.world.heightAt(e.pos.x, e.pos.z) + 0.12, e.pos.z);
            this.scene.add(mesh);
            this.slams.push({ t: 0.75, x: e.pos.x, z: e.pos.z, r: 4.5,
                              dmg: Math.round(e.meleeDmg * 1.3), mesh });
            audio.creature(e.type, 'attack', 0.5, 80);
          e.atkAt = this.world.time;
          }
        }
        // below 30% health the mother fights like a cornered animal
        if (!e.enraged && e.hp < e.maxHp * 0.3) {
          e.enraged = true;
          e.speed *= 1.25; e.meleeDmg *= 1.3; e.dmg *= 1.3;
          this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y + 2), 'ENRAGED!', '#ff5030', 'big');
          audio.creature(e.type, 'attack', 0.55, 60);
          e.atkAt = this.world.time;
        }
      }

      if (e.cfg.passive && e.spooked && target && dist < 14) {
        const away = new THREE.Vector3().subVectors(e.pos, target.pos);
        const len = Math.hypot(away.x, away.z) || 1;
        e.pos.x += (away.x / len) * e.speed * dt;
        e.pos.z += (away.z / len) * e.speed * dt;
        this.world.collide(e.pos, 0.3 * e.sizeMult);
        e.mesh.rotation.y = Math.atan2(away.x, away.z);
        e.walkT += dt * e.speed;
        const ud = e.mesh.userData;
        (ud.legs || []).forEach((leg, li) => {
          leg.rotation.x = Math.sin(e.walkT * 3.4 + (li % 2) * Math.PI) * 0.7;
        });
        e.mesh.position.set(e.pos.x, this.world.heightAt(e.pos.x, e.pos.z), e.pos.z);
        continue;
      }

      // aggro + leash: a chase that never reaches its target is abandoned
      // after LEASH_TIME and the enemy jogs back to where it spawned
      if (e.returning) {
        if (target && dist < e.cfg.aggro * 0.5) { e.returning = false; e.aggroed = true; e.chaseT = 0; }
      } else if (target && dist < e.cfg.aggro) e.aggroed = true;
      if (e.aggroed && target && !e.returning) {
        if (dist > e.range * 1.5) e.chaseT += dt; else e.chaseT = 0;
        if (e.chaseT > (e.bossRank ? LEASH_TIME_BOSS : LEASH_TIME)) {
          e.aggroed = false;
          e.returning = true;
          e.chaseT = 0;
        }
      }

      // the ranged "spell" charges over time (only while angry, so casters
      // don't sit charged waiting to snipe); firing freezes the caster briefly
      if (e.cfg.ranged && e.aggroed) e.spellTimer -= dt;
      if (e.pauseT > 0) e.pauseT -= dt;

      let vx = 0, vz = 0;
      if (e.pauseT > 0 || e.windupT > 0) {
        // stopped to cast / winding up a haymaker — no movement this frame
      } else if (e.aggroed && target) {
        const beh = e.cfg.behavior;
        if (beh === 'kite' && e.cfg.ranged) {
          // skirmishers hold their preferred distance and back off when rushed
          const sr = e.cfg.shootRange;
          if (dist < sr * 0.55) {
            vx = -(toPlayer.x / dist) * e.speed * 0.9;
            vz = -(toPlayer.z / dist) * e.speed * 0.9;
          } else if (dist > sr * 0.9) {
            vx = (toPlayer.x / dist) * e.speed;
            vz = (toPlayer.z / dist) * e.speed;
          }
        } else if (dist > e.range * 0.75) {
          vx = (toPlayer.x / dist) * e.speed;
          vz = (toPlayer.z / dist) * e.speed;
          // pack hunters fan out and close in from the flanks
          if (beh === 'pack' && dist > 3) {
            const a = (e.id % 2 ? 1 : -1) * Math.min(0.85, (dist - 2) / 15);
            const cos = Math.cos(a), sin = Math.sin(a);
            const nx = vx * cos - vz * sin, nz = vx * sin + vz * cos;
            vx = nx; vz = nz;
          }
        }
      } else if (e.returning) {
        const hx = e.spawnPos.x - e.pos.x, hz = e.spawnPos.z - e.pos.z;
        const hd = Math.hypot(hx, hz);
        if (hd < 2) e.returning = false;
        else { vx = (hx / hd) * e.speed * 0.8; vz = (hz / hd) * e.speed * 0.8; }
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          e.wanderT = 2 + Math.random() * 3;
          e.wanderDir = Math.random() * Math.PI * 2;
        }
        vx = Math.cos(e.wanderDir) * e.speed * 0.25;
        vz = Math.sin(e.wanderDir) * e.speed * 0.25;
      }

      // separation from other enemies
      for (const o of this.list) {
        if (o === e || o.dying) continue;
        const sx = e.pos.x - o.pos.x, sz = e.pos.z - o.pos.z;
        const d2 = sx * sx + sz * sz;
        if (d2 < 1.44 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          vx += (sx / d) * 3;
          vz += (sz / d) * 3;
        }
      }

      e.pos.x += vx * dt;
      e.pos.z += vz * dt;
      if (!e.cfg.flying) this.world.collide(e.pos, 0.4 * e.sizeMult);

      // ranged spell: charged + target in shoot range → stop, fire, resume after 0.5 s
      if (target && e.cfg.ranged && e.aggroed && e.spellTimer <= 0
          && dist < e.cfg.shootRange && dist > 2.2) {
        e.spellTimer = e.cfg.spellCd;
        e.pauseT = 0.5;
        e.lungeT = 0.2;
        const origin = e.mesh.position.clone().setY(e.mesh.position.y + 0.8 * e.sizeMult);
        projectiles.spawnEnemyShot(origin, target, {
          dmg: e.dmg, speed: e.cfg.projectileSpeed, color: e.cfg.shotColor, stun: e.cfg.stun || 0,
        });
        audio.sfx('attack_ranged', 0.18, 200);
        audio.creature(e.type, 'attack', 0.32, 200);
          e.atkAt = this.world.time;
      }

      // melee attack (everyone bites/claws up close, ranged types included).
      // The attacker is passed along so a lagging co-op guest can reject
      // phantom hits computed against its stale proxy position.
      e.attackCd -= dt;
      if (e.windupT > 0) {
        // heavy hitters (bears, yetis) telegraph a slow haymaker — step out!
        e.windupT -= dt;
        if (e.windupT <= 0) {
          e.lungeT = 0.25;
          if (target && dist < e.range * 1.35) {
            target.takeDamage(e.meleeDmg * 1.25,
              { id: e.id, pos: e.pos, range: e.range * 1.35, melee: true, poison: e.cfg.poison });
          }
          audio.creature(e.type, 'attack', 0.4, 110);
          e.atkAt = this.world.time;
        }
      } else if (!e.cfg.passive && target && e.attackCd <= 0 && dist < e.range) {
        e.attackCd = e.cfg.attackCd;
        if (e.cfg.behavior === 'heavy') {
          e.windupT = 0.55;
          e.flashT = 0.55; // visible swell while it winds up
        } else {
          e.lungeT = 0.25;
          target.takeDamage(e.meleeDmg,
            { id: e.id, pos: e.pos, range: e.range, melee: true, poison: e.cfg.poison });
          audio.creature(e.type, 'attack', 0.3, 110);
          e.atkAt = this.world.time;
        }
      }

      // presentation
      const speed = Math.hypot(vx, vz);
      if (speed > 0.1) {
        e.mesh.rotation.y = Math.atan2(vx, vz) + Math.PI;
        e.walkT += dt * speed;
      } else if (e.aggroed) {
        e.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z) + Math.PI;
        e.walkT += dt * 2; // idle shuffle so wings/segments keep moving
      }
      const ud = e.mesh.userData;
      (ud.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(e.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
      });
      (ud.wings || []).forEach((wing, wi) => {
        wing.rotation.z = Math.sin(e.walkT * 6 + wi * Math.PI) * 0.55;
      });
      (ud.segments || []).forEach((seg, si) => {
        seg.position.x = Math.sin(e.walkT * 2.4 + si * 1.1) * 0.13;
      });

      // hit-flash / windup swell / enraged bulk — all read through scale
      if (e.flashT > 0) e.flashT -= dt;
      const pulse = (e.flashT > 0 ? 1 + 0.14 * Math.min(1, e.flashT / 0.12) : 1)
        * (e.enraged ? 1.08 : 1);
      e.mesh.scale.setScalar(e.sizeMult * pulse);

      const groundY = this.world.heightAt(e.pos.x, e.pos.z)
        + e.flyY + (e.cfg.flying ? Math.sin(e.walkT * 1.5) * 0.25 : 0);
      if (e.lungeT > 0) {
        e.lungeT -= dt;
        const k = Math.sin((1 - e.lungeT / 0.25) * Math.PI);
        e.mesh.position.set(
          e.pos.x + (toPlayer.x / (dist || 1)) * k * 0.5,
          groundY,
          e.pos.z + (toPlayer.z / (dist || 1)) * k * 0.5
        );
      } else {
        e.mesh.position.set(e.pos.x, groundY, e.pos.z);
      }
    }
  }

  snapshot() {
    return this.alive().map(e => ({
      id: e.id, t: e.type, b: e.bossRank,
      x: +e.pos.x.toFixed(1), z: +e.pos.z.toFixed(1),
      hp: Math.round(e.hp), m: Math.round(e.maxHp),
      ...(this.world.time - (e.atkAt ?? -9) < 0.3 ? { a: 1 } : {}),
      ...(e.bossRank > 0 && e.bossName ? { n: e.bossName } : {}),
    }));
  }
}
