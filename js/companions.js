// ---- Companions driven by equipment: pet slot (wolf) & orb slot (spheres) ----

import * as THREE from 'three';
import { makeWolf, makeGuardianSphere } from './models.js';
import { audio } from './audio.js';

let nextCompanionId = 1;

class PetWolf {
  constructor(scene, alpha) {
    this.id = nextCompanionId++;
    this.mesh = makeWolf('tame');
    if (alpha) this.mesh.scale.multiplyScalar(1.45);
    scene.add(this.mesh);
    this.pos = new THREE.Vector3(0, 0, 0);
    this.biteCd = 0;
    this.walkT = 0;
  }

  update(dt, player, enemyMgr, dmg, world) {
    this.biteCd -= dt;

    let target = null, best = 18 * 18;
    for (const e of enemyMgr.alive()) {
      const d2 = e.pos.distanceToSquared(player.pos);
      if (d2 < best) { best = d2; target = e; }
    }

    const dest = target ? target.pos
      : player.pos.clone().add(new THREE.Vector3(1.4, 0, 1.6));

    const to = new THREE.Vector3().subVectors(dest, this.pos);
    const dist = to.length();
    const speed = 9.5;
    if (dist > (target ? 1.2 : 0.4)) {
      this.pos.addScaledVector(to, Math.min(1, (speed * dt) / dist));
      this.walkT += dt * speed;
    }

    if (target && dist < 1.5 + target.hitR && this.biteCd <= 0) {
      this.biteCd = 0.9;
      enemyMgr.damage(target, dmg, null);
    }

    this.mesh.position.set(this.pos.x, world.heightAt(this.pos.x, this.pos.z), this.pos.z);
    if (dist > 0.2) this.mesh.rotation.y = Math.atan2(to.x, to.z) + Math.PI;
    (this.mesh.userData.legs || []).forEach((leg, li) => {
      leg.rotation.x = Math.sin(this.walkT * 2.0 + (li % 2) * Math.PI) * 0.6;
    });
  }
}

class GuardianSphere {
  constructor(scene, slot) {
    this.id = nextCompanionId++;
    this.slot = slot;
    this.mesh = makeGuardianSphere();
    scene.add(this.mesh);
    this.t = slot * Math.PI; // opposite phases
    this.shootCd = 0;
  }

  update(dt, player, enemyMgr, projectiles, orb) {
    this.t += dt * 1.6;
    const r = 2.6;
    this.mesh.position.set(
      player.pos.x + Math.cos(this.t) * r,
      player.mesh.position.y + 1.7 + Math.sin(this.t * 2.5) * 0.15,
      player.pos.z + Math.sin(this.t) * r
    );
    this.mesh.userData.ring.rotation.z += dt * 3;

    this.shootCd -= dt;
    if (this.shootCd > 0) return;

    const inRange = enemyMgr.alive()
      .map(e => ({ e, d2: e.pos.distanceToSquared(player.pos) }))
      .filter(o => o.d2 < 15 * 15)
      .sort((a, b) => a.d2 - b.d2)
      .slice(0, orb.targets);

    if (inRange.length) {
      this.shootCd = 1.1;
      audio.sfx('attack_ranged', 0.22, 150);
      for (const { e } of inRange) {
        projectiles.spawnBolt(this.mesh.position.clone(), e, {
          dmg: orb.dmg,
          onHit: () => enemyMgr.damage(e, orb.dmg, null),
        });
      }
    }
  }
}

export class Companions {
  constructor(scene) {
    this.scene = scene;
    this.wolf = null;
    this.wolfItem = null;
    this.spheres = [];
    this.orbItem = null;
  }

  // Rebuild companions to match the player's pet/orb equipment.
  sync(player) {
    const petId = player.equipment.pet;
    if (petId !== this.wolfItem) {
      if (this.wolf) { this.scene.remove(this.wolf.mesh); this.wolf = null; }
      this.wolfItem = petId;
      if (petId) {
        this.wolf = new PetWolf(this.scene, petId === 'alphaWolf');
        this.wolf.pos.copy(player.pos).add(new THREE.Vector3(1.5, 0, 1.5));
        audio.sfx('spawn', 0.5);
      }
    }

    const orbId = player.equipment.orb;
    if (orbId !== this.orbItem) {
      for (const s of this.spheres) this.scene.remove(s.mesh);
      this.spheres = [];
      this.orbItem = orbId;
      if (orbId && player.orb) {
        for (let i = 0; i < player.orb.count; i++) this.spheres.push(new GuardianSphere(this.scene, i));
        audio.sfx('special', 0.5);
      }
    }
  }

  update(dt, player, enemyMgr, projectiles, world) {
    if (this.wolf && player.pet) this.wolf.update(dt, player, enemyMgr, player.pet.dmg, world);
    if (player.orb) for (const s of this.spheres) s.update(dt, player, enemyMgr, projectiles, player.orb);
  }
}
