// ---- Ground loot: meat, wood and item drops that bob in place and fly to
// the player when they come close. ----

import * as THREE from 'three';
import { makeMeatDrop, makeWoodDrop, makeItemDrop, makeStoneDrop, makeHideDrop, makeIronDrop,
         makeBerryDrop } from './models.js';
import { roundResource } from './config.js';
import { audio } from './audio.js';

const MAGNET_RADIUS = 3.2;
const COLLECT_RADIUS = 0.9;

let nextPickupId = 1;

export class Pickups {
  constructor(scene, world, hooks) {
    this.scene = scene;
    this.world = world;
    this.hooks = hooks; // { onCollect(pickup) }
    this.list = [];
    this.magnetMult = 1; // camp cabin perk widens the loot magnet
  }

  // kind: 'meat'|'wood'|'stone'|'hide'|'iron'|'item'; payload: amount (or itemId)
  spawn(kind, payload, pos, scatter = 0.8) {
    if (kind !== 'item') payload = roundResource(payload);
    const makers = { meat: makeMeatDrop, wood: makeWoodDrop, stone: makeStoneDrop,
                     hide: makeHideDrop, iron: makeIronDrop, berry: makeBerryDrop, item: makeItemDrop };
    const mesh = (makers[kind] || makeItemDrop)();
    const x = pos.x + (Math.random() - 0.5) * scatter * 2;
    const z = pos.z + (Math.random() - 0.5) * scatter * 2;
    mesh.position.set(x, this.world.heightAt(x, z) + 0.45, z);
    this.scene.add(mesh);
    this.list.push({
      id: nextPickupId++, kind, payload, mesh,
      x, z, t: Math.random() * 6, magnet: false,
    });
  }

  // targets: players that attract loot (solo: [player]; co-op host: both).
  update(dt, targets) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.t += dt;

      // nearest living target
      let target = null, dist = Infinity;
      for (const t of targets) {
        if (t.dead) continue;
        const d = Math.hypot(t.pos.x - p.mesh.position.x, t.pos.z - p.mesh.position.z);
        if (d < dist) { dist = d; target = t; }
      }

      if (target && !p.magnet && dist < MAGNET_RADIUS * this.magnetMult) p.magnet = true;

      if (p.magnet && target) {
        // fly to the player, faster the closer it gets
        const dx = target.pos.x - p.mesh.position.x;
        const dz = target.pos.z - p.mesh.position.z;
        const speed = 10 + (MAGNET_RADIUS - Math.min(dist, MAGNET_RADIUS)) * 9;
        const targetY = (target.mesh?.position.y ?? 0) + 0.7;
        p.mesh.position.x += (dx / (dist || 1)) * speed * dt;
        p.mesh.position.z += (dz / (dist || 1)) * speed * dt;
        p.mesh.position.y += (targetY - p.mesh.position.y) * Math.min(1, dt * 8);
        if (dist < COLLECT_RADIUS) {
          this.hooks.onCollect(p, target);
          this.scene.remove(p.mesh);
          this.list.splice(i, 1);
          continue;
        }
      } else {
        // idle bob & spin
        p.mesh.position.y = this.world.heightAt(p.x, p.z) + 0.45 + Math.sin(p.t * 3) * 0.12;
      }
      p.mesh.rotation.y += dt * (p.kind === 'item' ? 2.4 : 1.2);
    }
  }

  snapshot() {
    return this.list.map(p => ({
      i: p.id, k: p.kind, pl: p.payload,
      x: +p.mesh.position.x.toFixed(1), z: +p.mesh.position.z.toFixed(1),
    }));
  }

  removeById(id) {
    const i = this.list.findIndex(p => p.id === id);
    if (i < 0) return null;
    const p = this.list[i];
    this.scene.remove(p.mesh);
    this.list.splice(i, 1);
    return p;
  }
}

export const pickupSfx = {
  meat: () => audio.sfx('kill_gold', 0.35, 80),
  wood: () => audio.sfx('click', 0.45, 80),
  stone: () => audio.sfx('click', 0.4, 80),
  hide: () => audio.sfx('kill_gold', 0.3, 80),
  iron: () => audio.sfx('upgrade', 0.35, 120),
  item: () => audio.sfx('special', 0.55),
};
