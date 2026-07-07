// ---- Survival camp: buildings at the cave mouth ----
// Your HOME advances through the ages (Hide Tent → Wooden Cabin → Stone
// House) and gates gear; the chest stores resources that survive death; the
// furnace smelts stone into iron; the boat opens the lakes; the guard tower
// watches over home. Built things appear physically at fixed camp spots.

import { CAMP_BUILDINGS, ERAS, RESOURCES, fmtResource, roundResource } from './config.js';
import { makeTent, makeCottage, makeFurnace, makeChest, makeBoatRack,
         makeMobaTower, makeGraveyard } from './models.js';
import { audio } from './audio.js';

const SPOTS = {
  home:    { x: -9, z: 13 },
  chest:   { x: 6,  z: 16 },
  furnace: { x: 11, z: 11 },
  boat:    { x: 0,  z: 21 },
  tower:   { x: 13, z: 17 },
  // 'grave' has no fixed spot — it is built wherever the player stands
};
const HOME_HEAL_RADIUS = 6;
const HOME_HEAL_PER_SEC = 12;

export class Camp {
  constructor(scene, world, player, hooks) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.hooks = hooks; // { popup, toast }
    this.levels = { home: 0, chest: 0, furnace: 0, boat: 0, tower: 0, grave: 0 };
    this.storage = { meat: 0, wood: 0, stone: 0, hide: 0, iron: 0 };
    this.meshes = {};
    this.gravePos = null;
    this.smeltT = 20;
    this.towerCd = 0;
    this.healPopupT = 0;
    // the whole base (cave + camp spots) is a no-attack zone from the very
    // start: creatures neither see nor enter it. Healing still needs the tent.
    this.safeZone = { x: 0, z: 6, r: 20 };
    this.world.safeZones.push(this.safeZone);
  }

  has(need) {
    if (need === 'tent') return this.levels.home >= 1;
    if (need === 'cabin') return this.levels.home >= 2;
    if (need === 'stonehouse') return this.levels.home >= 3;
    if (need === 'keep') return this.levels.home >= 4;
    return this.levels[need] >= 1;
  }

  era() { return ERAS[Math.min(this.levels.home, ERAS.length - 1)]; }

  // max-hp bonus from the home building
  homeHpBonus() {
    return [0, 0, 15, 40, 80][Math.min(this.levels.home, 4)];
  }

  buildingInfo(id) {
    const def = CAMP_BUILDINGS.find(b => b.id === id);
    const level = this.levels[id];
    const maxed = level >= def.max;
    const next = maxed ? null : def.levels[level];
    return {
      def, level, maxed,
      name: def.names[Math.min(level, def.names.length - 1)],
      nextName: maxed ? null : def.names[level],
      cost: next?.cost ?? null,
      reqLevel: next?.level ?? null,
      desc: (maxed ? def.levels[def.max - 1] : next).desc,
    };
  }

  build(id) {
    const info = this.buildingInfo(id);
    if (info.maxed) return false;
    this.levels[id]++;
    this._placeMesh(id);
    audio.sfx('tower_build', 0.55);
    this.hooks.toast?.(`🏕️ Built: ${this.buildingInfo(id).name}!`, 'level');
    return true;
  }

  _placeMesh(id) {
    if (this.meshes[id]) this.scene.remove(this.meshes[id]);
    // the graveyard is a remote shrine built wherever the player stands
    const spot = id === 'grave'
      ? { x: Math.round(this.player.pos.x), z: Math.round(this.player.pos.z) }
      : SPOTS[id];
    let mesh;
    if (id === 'home') {
      const lvl = this.levels.home;
      mesh = lvl === 1 ? makeTent() : makeCottage();
      if (lvl >= 3) { // stone house / keep: recolor the walls
        const wallColor = lvl === 4 ? 0x6e7280 : 0x8f8a7c;
        mesh.traverse(o => { if (o.isMesh && o.material?.color?.getHex?.() === 0x6e4d2a) {
          o.material = o.material.clone(); o.material.color.setHex(wallColor);
        } });
        if (lvl === 4) mesh.scale.setScalar(1.25); // the keep looms larger
      }
      mesh.rotation.y = 0.4;
    } else if (id === 'chest') mesh = makeChest();
    else if (id === 'furnace') mesh = makeFurnace();
    else if (id === 'boat') mesh = makeBoatRack();
    else if (id === 'grave') { mesh = makeGraveyard(); this.gravePos = { x: spot.x, z: spot.z }; }
    else if (id === 'tower') { mesh = makeMobaTower(0x86b45e); mesh.scale.setScalar(0.8); }
    mesh.position.set(spot.x, this.world.heightAt(spot.x, spot.z), spot.z);
    this.scene.add(mesh);
    this.meshes[id] = mesh;
    if (id !== 'grave') this.world.obstacles.push({ x: spot.x, z: spot.z, r: id === 'home' ? 3.2 : 1.1 });
  }

  // ---- chest ----
  depositAll() {
    let moved = 0;
    for (const k of RESOURCES) {
      this.storage[k] = roundResource(this.storage[k] + this.player[k]);
      moved = roundResource(moved + this.player[k]);
      this.player[k] = 0;
    }
    if (moved) audio.sfx('click', 0.5);
    return moved;
  }

  withdrawAll() {
    let moved = 0;
    for (const k of RESOURCES) {
      this.player[k] = roundResource(this.player[k] + this.storage[k]);
      moved = roundResource(moved + this.storage[k]);
      this.storage[k] = 0;
    }
    if (moved) audio.sfx('click', 0.5);
    return moved;
  }

  storageLine() {
    return RESOURCES.map(k => fmtResource(this.storage[k])).join(' / ');
  }

  // ---- per-frame: furnace smelting + guard tower ----
  update(dt, enemyMgr, projectiles) {
    this.healPopupT = Math.max(0, this.healPopupT - dt);
    const d = Math.hypot(this.player.pos.x - SPOTS.home.x, this.player.pos.z - SPOTS.home.z);
    if (this.levels.home >= 1 && !this.player.dead
        && d < HOME_HEAL_RADIUS && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + HOME_HEAL_PER_SEC * dt);
      if (this.healPopupT <= 0) {
        this.healPopupT = 1.2;
        this.hooks.popup?.(this.player.mesh.position.clone().setY(this.player.mesh.position.y + 2.3), '+ heal', '#7dff8a');
      }
    }

    if (this.levels.furnace >= 1) {
      this.smeltT -= dt;
      if (this.smeltT <= 0) {
        this.smeltT = 20;
        // smelt from carried stone first, then from the chest
        if (this.player.stone >= 4) {
          this.player.stone = roundResource(this.player.stone - 4);
          this.player.iron = roundResource(this.player.iron + 1);
        } else if (this.storage.stone >= 4) {
          this.storage.stone = roundResource(this.storage.stone - 4);
          this.storage.iron = roundResource(this.storage.iron + 1);
        }
        else return;
        audio.sfx('upgrade', 0.3, 500);
        const m = this.meshes.furnace;
        if (m) this.hooks.popup?.(m.position.clone().setY(m.position.y + 2.2), '+1 🔩', '#c8d0d8');
      }
    }

    if (this.levels.tower >= 1 && enemyMgr && projectiles) {
      this.towerCd -= dt;
      if (this.towerCd <= 0) {
        const t = this.meshes.tower;
        let best = null, bd = 20;
        for (const e of enemyMgr.alive()) {
          const d = Math.hypot(e.pos.x - t.position.x, e.pos.z - t.position.z);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          this.towerCd = 1.2;
          projectiles.spawnBolt(t.position.clone().setY(t.position.y + 3.8), best, {
            dmg: 25, onHit: () => enemyMgr.damage(best, 25, null),
          });
          audio.sfx('attack_ranged', 0.2, 300);
        }
      }
    }
  }

  dispose() {
    this.world.safeZones = this.world.safeZones.filter(z => z !== this.safeZone);
    for (const m of Object.values(this.meshes)) this.scene.remove(m);
    this.meshes = {};
  }
}
