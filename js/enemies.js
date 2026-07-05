// ---- Enemy spawning (singles + packs with boss mothers + reinforcements),
// AI (melee, ranged spitters, flyers), damage ----

import * as THREE from 'three';
import { WORLD, ENEMY_TYPES, BOSS_RANKS, BIOMES, biomeAt, biomeIndexAt, progressAt, meatForHp } from './config.js';
import { makeEnemyMesh } from './models.js';
import { audio } from './audio.js';

let nextEnemyId = 1;
const SPAWN_DENSITY = 1.25;
const SPAWN_INTERVAL_MULT = 0.8;
const MAX_ALIVE_HARD = 35; // absolute cap, reinforcements included

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
    this.meat = base.meat ?? meatForHp(this.maxHp);
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
    this.aggroed = bossRank > 0;
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
    this.spawnTimer = 1.5;
    this.packTimer = 20;
    this.discovered = new Set();
  }

  alive() { return this.list.filter(e => !e.dying); }

  spawnInitialWave() {
    // first prey waits south of the camp, outside the cave clearing
    this._spawn('rat', -8, 42, 0);
    this._spawn('spider', 0, 46, 0);
    this._spawn('rat', 8, 42, 0);
  }

  _spawn(type, x, z, difficulty, bossRank = 0) {
    const e = new Enemy(type, x, z, difficulty, bossRank);
    this.scene.add(e.mesh);
    this.list.push(e);
    if (!this.discovered.has(type)) {
      this.discovered.add(type);
      this.hooks.onDiscover(type);
    }
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
    const dist = 30 + Math.random() * 14;
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

  _nearbyAlive(pos, radius) {
    return this.alive().filter(e =>
      Math.hypot(e.pos.x - pos.x, e.pos.z - pos.z) < radius).length;
  }

  _trySpawnAt(anchor) {
    const progress = progressAt(anchor.pos.x, anchor.pos.z);
    const maxActive = Math.round((8 + Math.floor(progress * 12)) * SPAWN_DENSITY);
    if (this._nearbyAlive(anchor.pos, 95) >= maxActive) return;
    const { x, z } = this._spawnPoint(anchor);
    // creature type is chosen from the ring the ANCHOR is standing in, so a
    // next-ring creature (e.g. bats) can never appear before you reach its
    // biome — even if the spawn point lands just across a ring border
    const biome = biomeAt(anchor.pos.x, anchor.pos.z);
    const type = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
    const e = this._spawn(type, x, z, progress);
    if (!e.cfg.passive) e.aggroed = true;
  }

  _trySpawn(targets) {
    for (const anchor of this._spawnAnchors(targets)) this._trySpawnAt(anchor);
  }

  // A pack ("smečka"): a burst of one type, often led by a boss mother.
  _trySpawnPack(targets) {
    const anchor = this._anchor(targets);
    if (!anchor || this.world.isTargetSafe?.(anchor.pos)) return;
    const biome = BIOMES[biomeIndexAt(anchor.pos.x, anchor.pos.z)];
    if (!biome.packs) return; // no packs in the Verdant Forest

    const progress = progressAt(anchor.pos.x, anchor.pos.z);
    const type = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
    const center = this._spawnPoint(anchor);

    // the mother/boss with a skull rank rolled from the biome's weights
    let rank = 0;
    if (Math.random() < 0.7) {
      let roll = Math.random();
      rank = 1;
      for (let i = 0; i < 3; i++) {
        roll -= biome.packs.skulls[i];
        if (roll <= 0) { rank = i + 1; break; }
      }
    }

    const count = rank > 0 ? BOSS_RANKS[rank - 1].packSize : 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2 + Math.random() * 4;
      const e = this._spawn(type, center.x + Math.cos(a) * r, center.z + Math.sin(a) * r, progress);
      if (!e.cfg.passive) e.aggroed = true;
    }
    if (rank > 0) {
      this._spawn(type, center.x, center.z, progress, rank);
      audio.sfx('lane_unlock', 0.45);
    }
  }

  // While a boss lives, her children keep arriving from ALL directions.
  _bossReinforcements(dt, targets) {
    const anchor = this._anchor(targets);
    if (!anchor || this.world.isTargetSafe?.(anchor.pos)) return;
    const progress = progressAt(anchor.pos.x, anchor.pos.z);
    for (const boss of this.list) {
      if (boss.bossRank === 0 || boss.dying) continue;
      boss.reinforceT -= dt;
      if (boss.reinforceT > 0) continue;
      const rank = BOSS_RANKS[boss.bossRank - 1];
      boss.reinforceT = rank.reinforceInterval;
      if (this.alive().length >= MAX_ALIVE_HARD) continue;
      for (let i = 0; i < rank.reinforceCount; i++) {
        const { x, z } = this._spawnPoint(anchor, { allSides: true });
        const e = this._spawn(boss.type, x, z, progress);
        if (!e.cfg.passive) e.aggroed = true;
      }
    }
  }

  stun(enemy, sec) {
    if (!enemy.dying) enemy.stunT = Math.max(enemy.stunT, sec);
  }

  damage(enemy, dmg, knockDir, srcId = 'local') {
    if (enemy.dying) return;
    enemy.hp -= dmg;
    enemy.aggroed = true;
    enemy.lastHitBy = srcId; // kill credit (co-op XP attribution)
    this.hooks.popup(enemy.mesh.position.clone().setY(enemy.mesh.position.y + 1.4 * enemy.sizeMult + 0.4),
      Math.round(dmg).toString(), '#ffffff');
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
    const progress = progressAt(anchor.pos.x, anchor.pos.z);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = (2.2 - 1.2 * progress) * SPAWN_INTERVAL_MULT;
      this._trySpawn(targets);
    }

    this.packTimer -= dt;
    if (this.packTimer <= 0) {
      this.packTimer = (26 + Math.random() * 18 - progress * 8) * SPAWN_INTERVAL_MULT;
      this._trySpawnPack(targets);
    }

    this._bossReinforcements(dt, targets);

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

      if (!e.cfg.flying) this.world.pushOutOfSafeZones?.(e.pos, e.hitR ?? 0.5);

      // chase the nearest living target
      let target = null, dist = Infinity;
      for (const t of targets) {
        if (t.dead) continue;
        if (this.world.isTargetSafe?.(t.pos)) continue;
        const d = Math.hypot(t.pos.x - e.pos.x, t.pos.z - e.pos.z);
        if (d < dist) { dist = d; target = t; }
      }
      if (!target) e.aggroed = false;
      const toPlayer = target
        ? new THREE.Vector3().subVectors(target.pos, e.pos)
        : new THREE.Vector3();
      if (!target) dist = Math.hypot(anchor.pos.x - e.pos.x, anchor.pos.z - e.pos.z);

      // despawn if left far behind (bosses persist longer)
      if (dist > (e.bossRank ? 110 : 75)) {
        if (e.bossRank > 0) this.hooks.onBossDeath(e);
        this._remove(e, i);
        continue;
      }

      // stunned/frozen: no movement, no attacks
      if (e.stunT > 0) {
        e.stunT -= dt;
        e.mesh.position.set(e.pos.x, this.world.heightAt(e.pos.x, e.pos.z) + e.flyY, e.pos.z);
        continue;
      }

      if (e.cfg.passive && target && dist < 10) {
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

      if (dist < e.cfg.aggro) e.aggroed = true;

      // the ranged "spell" charges over time; firing freezes the caster briefly
      if (e.cfg.ranged) e.spellTimer -= dt;
      if (e.pauseT > 0) e.pauseT -= dt;

      let vx = 0, vz = 0;
      if (e.pauseT > 0) {
        // stopped to cast — no movement this frame
      } else if (e.aggroed && target) {
        if (dist > e.range * 0.75) {
          vx = (toPlayer.x / dist) * e.speed;
          vz = (toPlayer.z / dist) * e.speed;
        }
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
      if (!e.cfg.flying) this.world.pushOutOfSafeZones?.(e.pos, e.hitR ?? 0.5);

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
      }

      // melee attack (everyone bites/claws up close, ranged types included).
      // The attacker is passed along so a lagging co-op guest can reject
      // phantom hits computed against its stale proxy position.
      e.attackCd -= dt;
      if (!e.cfg.passive && target && e.attackCd <= 0 && dist < e.range) {
        e.attackCd = e.cfg.attackCd;
        e.lungeT = 0.25;
        target.takeDamage(e.meleeDmg, { id: e.id, pos: e.pos, range: e.range, melee: true });
        audio.creature(e.type, 'attack', 0.3, 110);
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
    }));
  }
}
