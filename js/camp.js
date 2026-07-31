// ---- Survival camp: buildings at the cave mouth ----
// Your HOME advances through the ages (Hide Tent → Wooden Cabin → Stone
// House) and gates gear; the chest stores resources that survive death; the
// furnace smelts stone into iron. The chest, log boat, guard tower and
// graveyard are ordinary inventory items placed wherever the player chooses.

import { CAMP_BUILDINGS, ERAS, RESOURCES, fmtResource, roundResource } from './config.js';
import { makeFurnace, makeChest, makeRaft, makeMobaTower, makeGraveyard, makeBanner } from './models.js';
import { audio } from './audio.js';

const SPOTS = {
  // 'home' has no spot — it IS the center structure (world.buildHome)
  // Legacy save fallbacks for objects created before free placement existed.
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
    this.positions = {}; // player-positioned item buildings (chest/boat/tower/grave)
    this.obstacles = {};
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
    if (need === 'runic') return this.levels.home >= 5;
    if (need === 'mountain') return this.levels.home >= 6;
    if (need === 'spirit') return this.levels.home >= 7;
    if (need === 'primal') return this.levels.home >= 8;
    if (need === 'frosthold') return this.levels.home >= 9;
    return this.levels[need] >= 1;
  }

  // The base upgrade tree is gone: home is a fixed fenced homestead, so none of
  // these scale any more. They stay as neutral constants because player.recompute
  // and the pickup magnet still read them.
  era() { return 'Homestead'; }
  homeHpBonus() { return 0; }
  forgeTier() { return 0; }
  magnetMult() { return 1; }
  chopMult() { return 1; }
  xpMult() { return 1; }

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

  // Upgrades are gone. The homestead you wake in IS the base for the whole run
  // — there is no ladder to climb, which is the point of a fixed starting yard.
  // Kept as a guarded seam rather than deleted, so nothing that calls it breaks.
  canUpgrade() { return false; }

  build(id) {
    this.hooks.toast?.('🏕️ Your camp is what it is — there is nothing to upgrade.', '');
    return false;
  }

  // Placeable camp objects arrive here from ordinary backpack items. Their
  // level flag preserves all existing feature checks and old-save migration,
  // while the position is now chosen in the world instead of fixed by an
  // upgrade card.
  placeItem(id, spot) {
    if (!['chest', 'boat', 'tower', 'grave'].includes(id) || this.has(id)) return false;
    this.levels[id] = 1;
    this.positions[id] = { x: Math.round(spot.x * 10) / 10, z: Math.round(spot.z * 10) / 10 };
    this._placeMesh(id, this.positions[id]);
    const names = { chest: 'Storage Chest', boat: 'Log Boat', tower: 'Guard Tower', grave: 'Graveyard' };
    audio.sfx('tower_build', 0.55);
    this.hooks.toast?.(`🏕️ Placed: ${names[id]}!`, 'level');
    return true;
  }

  moveItem(id, spot) {
    if (!this.has(id)) return;
    this.positions[id] = { x: Math.round(spot.x * 10) / 10, z: Math.round(spot.z * 10) / 10 };
    this._placeMesh(id, this.positions[id]);
  }

  positionOf(id) {
    return this.positions[id] ?? (id === 'grave' ? this.gravePos : SPOTS[id]) ?? null;
  }

  makePlaceableMesh(id) {
    if (id === 'chest') return makeChest();
    if (id === 'boat') return makeRaft();
    if (id === 'grave') return makeGraveyard();
    if (id === 'tower') {
      const tower = makeMobaTower(0x86b45e);
      tower.scale.setScalar(0.8);
      return tower;
    }
    return null;
  }

  _placeMesh(id, spotOverride = null) {
    if (this.meshes[id]) this.scene.remove(this.meshes[id]);
    // the graveyard is a remote shrine built wherever the player stands
    const spot = spotOverride
      ?? this.positions[id]
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
    if (['chest', 'boat', 'grave', 'tower'].includes(id)) mesh = this.makePlaceableMesh(id);
    else if (id === 'furnace') mesh = makeFurnace();
    else if (id === 'banner') mesh = makeBanner(this.levels.banner);
    if (id === 'grave') this.gravePos = { x: spot.x, z: spot.z };
    const y = this.world.heightAt(spot.x, spot.z) + (id === 'boat' ? 0.16 : 0);
    mesh.position.set(spot.x, y, spot.z);
    this.scene.add(mesh);
    this.meshes[id] = mesh;
    if (['chest', 'tower', 'furnace', 'banner'].includes(id)) {
      if (this.obstacles[id]) this.world.obstacles = this.world.obstacles.filter(o => o !== this.obstacles[id]);
      this.obstacles[id] = { x: spot.x, z: spot.z, r: 1.1 };
      this.world.obstacles.push(this.obstacles[id]);
    }
  }

  // ---- chest ----
  // One resource at a time, for the times "all of everything" is not what you
  // meant. depositAll/withdrawAll below are these in a loop, and stay because
  // emptying your pockets before a risky trip is the common case.
  deposit(key, amt) {
    if (!RESOURCES.includes(key)) return 0;
    const n = Math.min(Math.max(0, Math.floor(amt ?? 0)), this.player[key]);
    if (n <= 0) return 0;
    this.player[key] = roundResource(this.player[key] - n);
    this.storage[key] = roundResource((this.storage[key] ?? 0) + n);
    audio.sfx('click', 0.5);
    return n;
  }

  withdraw(key, amt) {
    if (!RESOURCES.includes(key)) return 0;
    const n = Math.min(Math.max(0, Math.floor(amt ?? 0)), this.storage[key] ?? 0);
    if (n <= 0) return 0;
    this.storage[key] = roundResource(this.storage[key] - n);
    this.player[key] = roundResource(this.player[key] + n);
    audio.sfx('click', 0.5);
    return n;
  }

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
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.max(HOME_HEAL_PER_SEC, this.player.maxHp * 0.12) * dt);
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
        if (!t) return;
        let best = null, bd = 20;
        for (const e of enemyMgr.alive()) {
          if (e.cfg?.friendly || e.cfg?.passive) continue; // hold fire on friendlies
          const d = Math.hypot(e.pos.x - t.position.x, e.pos.z - t.position.z);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          this.towerCd = 1.2;
          // Scale with the target's own health so the tower stays relevant deep
          // in the game (a flat 25 was ~13 min/kill at L50). ~2.5% max HP/bolt,
          // floored at 25 so it still one-shots trickles of early critters.
          const tdmg = Math.max(25, Math.round((best.maxHp || 0) * 0.025));
          projectiles.spawnBolt(t.position.clone().setY(t.position.y + 3.8), best, {
            dmg: tdmg, onHit: () => enemyMgr.damage(best, tdmg, null, 'tower'),
          });
          audio.sfx('attack_ranged', 0.2, 300);
        }
      }
    }
  }

  dispose() {
    this.world.safeZones = this.world.safeZones.filter(z => z !== this.safeZone);
    const obstacles = new Set(Object.values(this.obstacles));
    this.world.obstacles = this.world.obstacles.filter(o => !obstacles.has(o));
    for (const m of Object.values(this.meshes)) this.scene.remove(m);
    this.meshes = {};
    this.obstacles = {};
  }
}
