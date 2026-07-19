// ---- Arrows (player), bolts (guardian sphere) & enemy shots (poison/ice) ----

import * as THREE from 'three';
import { makeArrow, makeBolt, makeEnemyShot, makeSpear } from './models.js';

let nextProjectileId = 1;

export class Projectiles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  spawnArrow(origin, dir, { dmg, pierce, speed, life, crit, weakPoint = false, effects = null }) {
    const mesh = makeArrow();
    let customMaterials = false;
    if (effects?.burn || effects?.bleed) {
      customMaterials = true;
      const color = effects.burn ? 0xff7a24 : 0xbfd5df;
      mesh.traverse(part => {
        if (!part.material) return;
        part.material = part.material.clone();
        part.material.color?.setHex(color);
        if (effects.burn && 'emissive' in part.material) part.material.emissive.setHex(0x662000);
      });
    }
    mesh.position.copy(origin);
    mesh.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
    this.scene.add(mesh);
    this.list.push({
      id: nextProjectileId++, kind: 'arrow', mesh,
      vel: dir.clone().multiplyScalar(speed),
      dmg, pierce, life, crit, weakPoint, effects, customMaterials, hit: new Set(),
    });
  }

  // Homing bolt. onHit (optional) resolves the damage — used by guardian
  // spheres (enemyMgr.damage) and MOBA towers (units/heroes alike).
  spawnBolt(origin, target, { dmg, onHit = null }) {
    const mesh = makeBolt();
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.list.push({
      id: nextProjectileId++, kind: 'bolt', mesh,
      target, speed: 26, dmg, onHit, life: 2.0, hit: new Set(),
    });
  }

  // Enemy spit: flies straight at where the player is right now.
  spawnEnemyShot(origin, player, { dmg, speed, color, stun = 0, srcName = null, spear = false }) {
    const dir = new THREE.Vector3(player.pos.x, origin.y, player.pos.z).sub(origin).normalize();
    const mesh = spear ? makeSpear() : makeEnemyShot(color);
    mesh.position.copy(origin);
    if (spear) mesh.rotation.y = Math.atan2(dir.x, dir.z); // point along its flight
    this.scene.add(mesh);
    this.list.push({
      id: nextProjectileId++, kind: 'enemyShot', mesh, color, srcName, spear,
      vel: dir.multiplyScalar(speed), dmg, stun, life: 2.2, hit: new Set(),
    });
  }

  // enemy shots only — streamed to the co-op guest for projectile visibility
  snapshotShots() {
    return this.list.filter(p => p.kind === 'enemyShot').map(p => ({
      i: p.id, x: +p.mesh.position.x.toFixed(1), z: +p.mesh.position.z.toFixed(1), c: p.color,
      ...(p.spear ? { sp: 1 } : {}),
    }));
  }

  // playerTargets: who enemy shots can hit (solo: [player]; co-op host: both).
  update(dt, enemyMgr, playerTargets) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;

      if (p.kind === 'bolt' && p.target && !p.target.dying) {
        // home in on the target
        const to = new THREE.Vector3(p.target.pos.x, p.target.mesh.position.y + 0.9, p.target.pos.z).sub(p.mesh.position);
        const d = to.length() || 1;
        p.mesh.position.addScaledVector(to, (p.speed * dt) / d);
      } else {
        const vel = p.vel || new THREE.Vector3(0, 0, -p.speed);
        p.mesh.position.addScaledVector(vel, dt);
      }

      let consumed = false;
      if (p.kind === 'bolt' && p.onHit) {
        // homing bolts with a resolver hit their own target directly
        if (p.target && !p.target.dying) {
          const dx = p.target.pos.x - p.mesh.position.x, dz = p.target.pos.z - p.mesh.position.z;
          if (dx * dx + dz * dz < ((p.target.hitR || 0.6) + 0.3) ** 2) {
            p.onHit();
            consumed = true;
          }
        } else consumed = true; // target died mid-flight
      } else if (p.kind === 'enemyShot') {
        // enemy shots only hurt players (attacker info → co-op lag validation)
        for (const t of playerTargets) {
          if (t.dead) continue;
          const dx = t.pos.x - p.mesh.position.x, dz = t.pos.z - p.mesh.position.z;
          if (dx * dx + dz * dz < 0.72 ** 2) {
            t.takeDamage(p.dmg, { name: p.srcName, pos: { x: p.mesh.position.x, z: p.mesh.position.z }, range: 1.4, shot: true });
            if (p.stun) t.applyStun?.(p.stun, { pos: { x: p.mesh.position.x, z: p.mesh.position.z }, range: 1.4, shot: true });
            consumed = true;
            break;
          }
        }
      } else {
        // player/sphere projectiles hurt enemies
        for (const e of enemyMgr.alive()) {
          if (p.hit.has(e.id)) continue;
          const dx = e.pos.x - p.mesh.position.x, dz = e.pos.z - p.mesh.position.z;
          if (dx * dx + dz * dz < (e.hitR + 0.25) ** 2) {
            p.hit.add(e.id);
            enemyMgr.damage(e, p.dmg, null, 'local', {
              crit: p.crit, weakPoint: p.weakPoint, ...(p.effects || {}),
            });
            if (!(p.kind === 'arrow' && p.pierce)) { consumed = true; break; }
          }
        }
      }

      if (consumed || p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.customMaterials) p.mesh.traverse(part => part.material?.dispose?.());
        this.list.splice(i, 1);
      }
    }
  }
}
