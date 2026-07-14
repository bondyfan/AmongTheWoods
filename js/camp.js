// ---- Survival camp: buildings at the cave mouth ----
// Your HOME advances through the ages (Hide Tent → Wooden Cabin → Stone
// House) and gates gear; the chest stores resources that survive death; the
// furnace smelts stone into iron; the boat opens the lakes; the guard tower
// watches over home. Built things appear physically at fixed camp spots.

import { CAMP_BUILDINGS, ERAS, RESOURCES, fmtResource, roundResource } from './config.js';
import { makeFurnace, makeChest, makeBoatRack, makeMobaTower, makeGraveyard, makeBanner } from './models.js';
import { audio } from './audio.js';

const SPOTS = {
  // 'home' has no spot — it IS the center structure (world.buildHome)
  chest:   { x: 6,  z: 16 },
  furnace: { x: 11, z: 11 },
  boat:    { x: 0,  z: 21 },
  tower:   { x: 13, z: 17 },
  banner:  { x: -8, z: 14 },
  // 'grave' has no fixed spot — it is built wherever the player stands
};
const HOME_HEAL_RADIUS = 10; // inside your home building (the center)
const HOME_HEAL_PER_SEC = 12;

export class Camp {
  constructor(scene, world, player, hooks) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.hooks = hooks; // { popup, toast }
    this.levels = { home: 0, chest: 0, furnace: 0, boat: 0, tower: 0, grave: 0, banner: 0 };
    this.storage = Object.fromEntries(RESOURCES.map(k => [k, 0])); // incl. wool/essence
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

  // max-hp bonus from the home building — worth building FOR, not box-ticking
  homeHpBonus() {
    return [0, 20, 60, 120, 180][Math.min(this.levels.home, 4)]
      + [0, 0, 40, 90][Math.min(this.levels.banner, 3)];
  }

  // secondary era perks: cabin pulls loot from further, the stone house
  // swings harder at trees & rocks, the keep sharpens your wits (+XP)
  magnetMult() { return (this.has('cabin') ? 1.3 : 1) * (1 + 0.18 * this.levels.banner); }
  chopMult() { return this.has('stonehouse') ? 1.25 : 1; }
  xpMult() { return (this.has('keep') ? 1.15 : 1) * (1 + [0, 0.08, 0.16, 0.25][Math.min(this.levels.banner, 3)]); }

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

  _placeMesh(id, spotOverride = null) {
    if (this.meshes[id]) this.scene.remove(this.meshes[id]);
    // the graveyard is a remote shrine built wherever the player stands
    const spot = spotOverride
      ?? (id === 'grave'
        ? { x: Math.round(this.player.pos.x), z: Math.round(this.player.pos.z) }
        : SPOTS[id]);
    // your HOME is the center structure itself — the cave transforms into a
    // walk-in tent/cabin/stone house/keep of the same footprint
    if (id === 'home') {
      this.world.buildHome(this.levels.home);
      return;
    }
    let mesh;
    if (id === 'chest') mesh = makeChest();
    else if (id === 'furnace') mesh = makeFurnace();
    else if (id === 'boat') mesh = makeBoatRack();
    else if (id === 'grave') { mesh = makeGraveyard(); this.gravePos = { x: spot.x, z: spot.z }; }
    else if (id === 'tower') { mesh = makeMobaTower(0x86b45e); mesh.scale.setScalar(0.8); }
    else if (id === 'banner') mesh = makeBanner(this.levels.banner);
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
    const d = Math.hypot(this.player.pos.x, this.player.pos.z); // home = center
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
            dmg: 25, onHit: () => enemyMgr.damage(best, 25, null, 'tower'),
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
