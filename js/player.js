// ---- Player: movement, aiming, equipment (WoW-style slots), weapons,
// spells, XP & resources ----
// All gameplay state lives in plain fields (serializable for future
// multiplayer snapshots); the THREE mesh is pure presentation.

import * as THREE from 'three';
import { WORLD, XP_LEVELS, MAX_LEVEL, itemById, spellById, consumableById,
         biomeIndexAt, RESOURCES, MAX_SPELL_SLOTS } from './config.js';
import { makeMan, makeAxe, makeBow, makePickaxe, makeTorchMesh, makeClub,
         makeSword, makeHandSpear, makeCrossbow, makeShield } from './models.js';
import { audio } from './audio.js';

const MAX_CLIMB_SLOPE = 1.0; // steeper ground than this is a wall
const GRAVITY = 34;
const SAFE_FALL = 5.5;       // meters of free fall before damage kicks in
const CRIT_CHANCE = 0.1;     // every attack can crit for CRIT_MULT damage
const CRIT_MULT = 1.6;

export class Player {
  constructor(scene, hooks) {
    this.hooks = hooks; // { popup, onLevelUp, onDeath, onHurt, onEquipChange }
    this.scene = scene;
    this.mesh = makeMan();
    scene.add(this.mesh);
    this.slashes = []; // short-lived melee swing arcs
    this.levelFx = []; // short-lived level-up burst pieces

    this.id = 'local'; // threat-system identity (enemies track damage by source)
    this.pos = new THREE.Vector3(0, 0, 0);
    this.facing = new THREE.Vector3(0, 0, -1);
    this.hp = 100;
    this.xp = 0;
    this.level = 1;
    for (const k of RESOURCES) this[k] = 0; // every resource starts at zero
    this.kills = 0;
    this.campBonus = 0; // extra max hp from the camp home building

    // -- items & equipment --
    // invItems = UNEQUIPPED copies in the backpack (duplicates allowed);
    // equipped pieces live only in `equipment`. 'fists' are innate.
    this.invItems = [];
    this.invSlots = 10; // backpack stack slots (upgradeable in Supplies)
    this.equipment = { weapon: 'fists', offhand: null, head: null, chest: null, underlayer: null,
                       legs: null, boots: null, back: null, mount: null, charm: null, companion: null };

    // -- trainable stat tracks (individual caps/unlocks live in config) --
    this.stats = { range: 0, power: 0, swift: 0, pet: 0, gather: 0 };
    this.petDead = false;             // a dead pet stays dead until resurrected
    this.petMode = 'aggressive';      // 'aggressive' | 'defensive' | 'passive'

    // -- consumables (F/G), poison, camp era perks --
    this.consumables = { salve: 0, roast: 0, honey: 0 };
    this.boon = null; // cursed-statue pact: { dmg, speed, regen, t } — bane included
    this.venomT = 0;  // snapjaw venom on the blade: attacks poison enemies
    this.upgrades = {};   // rare boolean perks (tribePass); supply gear is real items now
    this.idleT = 0;       // seconds standing still (bedroll rest bonus)
    this.hurtT = 999;     // seconds since last damage taken
    this.killedBy = null; // name of the last source that damaged us (death recap)
    // blacksmith quest line: one active quest, per-biome completion counters
    this.quest = null;        // { biome, idx, type, need, count, name, ... }
    this.questDone = {};      // biomeIndex -> completed count (next idx to offer)
    this.questHistory = [];   // [{ name, biome }]
    this.questFlags = {};     // persistent world-event counters used by narrative quests
    this.repeatableDone = {}; // biomeIndex -> completed repeatable contracts
    this.roastT = 0;                  // roasted-meat speed buff timer
    this.poisonT = 0;                 // zombie poison DoT
    this.poisonDps = 0;
    this.poisonTickT = 0;
    this.xpMult = 1;                  // keep perk
    this.chopMult = 1;                // stone-house perk
    this.shrineBonus = 0;             // permanent +max HP from claimed shrines

    // -- spells --
    this.spellsOwned = new Set();
    this.spellSlots = [];           // up to MAX_SPELL_SLOTS spell ids
    this.spellCds = {};             // id -> seconds remaining

    // -- timed effects --
    this.hasteT = 0;
    this.rageT = 0;
    this.stoneSkinT = 0;
    this.spiritWardT = 0;
    this.dashT = 0;
    this.dashDir = new THREE.Vector3();
    this.dashHit = new Set();
    this.dashSpec = null;

    this.attackCd = 0;
    this.attackT = 0;
    this.attackDur = 0.3;
    this.charging = false;
    this.chargeT = 0;
    this.comboStep = 0;
    this.comboT = 0;
    this.arrowMode = 'standard';
    this.blocking = false;
    this.parryT = 0;
    this.dodgeT = 0;
    this.dodgeCd = 0;
    this.invulnT = 0;
    this.dodgeDir = new THREE.Vector3();
    this.stunT = 0;
    this.walkT = 0;
    this.dead = false;
    this.hintedAxe = false;

    this.recompute();
  }

  // ---------- items ----------
  // "owned" = equipped somewhere OR at least one copy in the backpack
  hasItem(id) {
    return id === 'fists'
      || Object.values(this.equipment).includes(id)
      || this.invItems.includes(id);
  }

  // a bought/looted item lands in the BACKPACK (duplicates stack)
  // new gear ALWAYS lands in the bag — equipping is a deliberate act in the
  // Character modal (click it or drag it onto the paper doll)
  ownItem(id) {
    if (!itemById(id)) return false;
    this.invItems.push(id);
    return true;
  }

  equip(id) {
    const item = itemById(id);
    if (!item) return;
    if (item.placeable) return; // world items are used from the bag, never worn
    if (id !== 'fists' && !this.invItems.includes(id)
        && !Object.values(this.equipment).includes(id)) return;
    if (item.level > this.level) { // dropped gear waits until you grow into it
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        `${item.name} needs level ${item.level}`, '#ffcc66');
      audio.sfx('error', 0.4);
      return;
    }
    if (this.equipment[item.slot] === id) return; // already worn
    // take one copy out of the backpack; the replaced piece goes back in
    const idx = this.invItems.indexOf(id);
    if (idx >= 0) this.invItems.splice(idx, 1);
    const prev = this.equipment[item.slot];
    if (prev && prev !== 'fists') this.invItems.push(prev);
    this.equipment[item.slot] = id;
    this.recompute();
    this.hooks.onEquipChange?.(item.slot);
  }

  unequip(slot) {
    const prev = this.equipment[slot];
    if (prev && prev !== 'fists') this.invItems.push(prev);
    if (slot === 'weapon') { this.equipment.weapon = 'fists'; }
    else this.equipment[slot] = null;
    this.recompute();
    this.hooks.onEquipChange?.(slot);
  }

  // one backpack SLOT per stack: each resource kind, each consumable kind,
  // each distinct piece of gear (equipped gear doesn't count — it's worn)
  invCellCount() {
    let cells = new Set(this.invItems).size;
    for (const k of RESOURCES) if (this[k] > 0) cells++;
    for (const c of ['salve', 'roast', 'honey']) if ((this.consumables[c] ?? 0) > 0) cells++;
    return cells;
  }

  invFullFor(id) {
    return this.invCellCount() >= this.invSlots && !this.invItems.includes(id);
  }

  // remove ONE copy (equipped first if that's where it lives) — for drops
  removeItem(id) {
    const idx = this.invItems.indexOf(id);
    if (idx >= 0) { this.invItems.splice(idx, 1); return true; }
    for (const [slot, eid] of Object.entries(this.equipment)) {
      if (eid === id) {
        this.equipment[slot] = slot === 'weapon' ? 'fists' : null;
        this.recompute();
        this.hooks.onEquipChange?.(slot);
        return true;
      }
    }
    return false;
  }

  // Q — cycle through carried weapons (equipped + backpack, deduped).
  // ---------- spells ----------
  ownSpell(id) {
    if (this.spellsOwned.has(id)) return false;
    this.spellsOwned.add(id);
    if (this.spellSlots.length < MAX_SPELL_SLOTS) this.spellSlots.push(id);
    return true;
  }

  toggleSpellSlot(id) {
    const i = this.spellSlots.indexOf(id);
    if (i >= 0) this.spellSlots.splice(i, 1);
    else if (this.spellsOwned.has(id) && this.spellSlots.length < MAX_SPELL_SLOTS) this.spellSlots.push(id);
  }

  castSpell(slotIndex, ctx) {
    const id = this.spellSlots[slotIndex];
    if (!id || this.dead || this.stunT > 0) return;
    if ((this.spellCds[id] || 0) > 0) { audio.sfx('error', 0.35, 300); return; }
    const spell = spellById(id);
    this.spellCds[id] = spell.cd;
    audio.sfx('special', 0.45);

    const { enemyMgr } = ctx;
    switch (id) {
      case 'haste': this.hasteT = 10; break;
      case 'rage': this.rageT = 12; break;
      case 'heal':
        this.hp = Math.min(this.maxHp, this.hp + 50);
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), '+50 ❤️', '#7fe07f');
        break;
      case 'powerDash':
      case 'stunDash':
        this.dashT = 0.28;
        this.dashDir.copy(this.facing);
        this.dashHit.clear();
        this.dashSpec = id === 'stunDash' ? { dmg: 30, stun: 3 } : { dmg: 40, stun: 0 };
        break;
      case 'shockwave':
        for (const e of enemyMgr.alive()) {
          const d = e.pos.distanceTo(this.pos);
          if (d < 6.5) {
            const dir = new THREE.Vector3().subVectors(e.pos, this.pos).normalize();
            e.pos.addScaledVector(dir, 4);
            enemyMgr.damage(e, this.dmgMult * 25, null);
          }
        }
        break;
      case 'frostNova':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 7) enemyMgr.stun(e, 4);
        }
        break;
      case 'stoneSkin': this.stoneSkinT = 12; break;
      case 'spiritWard':
        this.spiritWardT = 15;
        this.poisonT = 0;
        break;
      case 'whirlwind':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) >= 6) continue;
          const dir = new THREE.Vector3().subVectors(e.pos, this.pos).normalize();
          e.pos.addScaledVector(dir, 3);
          enemyMgr.damage(e, this.dmgMult * this.weapon.dmg * 0.75, null);
        }
        break;
      case 'venomRain':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 9) {
            enemyMgr.damage(e, this.dmgMult * 45, null, 'local',
              { poison: { dps: 15, dur: 6 } });
          }
        }
        break;
      case 'blizzard':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 11) {
            enemyMgr.damage(e, this.dmgMult * 120, null);
            enemyMgr.stun(e, 5);
          }
        }
        break;
    }
  }

  // ---------- derived stats ----------
  recompute() {
    const equipped = (slot) => itemById(this.equipment[slot]);
    const oldMax = this.maxHp || 100;
    this.gearMult = 1 + 0.1 * (this.forgeTier || 0);
    let hp = 100 + (this.level - 1) * 10 + (this.shrineBonus || 0)
      + (this.upgrades.questHp || 0), speedAdd = 0;
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = equipped(slot);
      if (it?.stats?.hp) hp += it.stats.hp * this.gearMult;
      if (it?.stats?.speed) speedAdd += it.stats.speed;
    }
    this.maxHp = Math.round(hp + (this.campBonus || 0));
    if (this.maxHp > oldMax) this.hp += this.maxHp - oldMax;
    this.hp = Math.min(this.hp, this.maxHp);
    // every level keeps granting +10 hp, +0.1 speed and +0.1 regen; weapon
    // power gains +1% per level while attack-speed growth softens after Lv14
    const lvl = this.level - 1;
    this.speed = 5.5 + 0.1 * lvl + speedAdd + (this.upgrades.trailblazer || 0) * 0.2;
    // passive regeneration: everyone knits back slowly; gear can stack it up
    let regen = 0.1 + 0.1 * lvl;
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = equipped(slot);
      if (it?.stats?.regen) regen += it.stats.regen * this.gearMult;
    }
    this.hpRegen = regen;

    // effective weapon = base weapon + training (range/power/swift tracks)
    const base = equipped('weapon')?.weapon || itemById('fists').weapon;
    const s = this.stats;
    // Keep the established attack-speed curve through Lv14, then slow it so
    // late levels do not erase the identity of slow and fast weapons.
    this.levelAttackSpeedBonus = 0.1 * Math.min(lvl, 13) + 0.025 * Math.max(0, lvl - 13);
    this.levelDamagePct = 0.01 * lvl; // small +1% weapon power per level
    const lvlCd = (cd) => 1 / (1 / cd + this.levelAttackSpeedBonus);
    this.weapon = {
      ...base,
      dmg: base.dmg * (1 + 0.05 * s.power) * (1 + this.levelDamagePct) * this.gearMult,
      cd: lvlCd(base.cd * (1 - 0.04 * s.swift)),
      range: base.range + (base.kind === 'bow' ? 2.0 : 0.1) * s.range,
    };
    if (this.upgrades.questPower) this.weapon.dmg *= 1 + this.upgrades.questPower * 0.03;
    this.shield = equipped('offhand')?.shield || null;
    this.canBlock = !!this.shield || !!this.weapon.parry;
    this.critChance = CRIT_CHANCE + (this.upgrades.hunterResident ? 0.04 : 0);
    this.gatherMult = 1 + 0.15 * s.gather; // Gathering training: fatter yields
    // expedition gear: each comfort lives in its own slot now (no more flags)
    this.torchGear = equipped('offhand')?.torch || null;   // { radius } while a torch is in hand
    this.dmgCut = equipped('underlayer')?.dmgCut || 0;     // quilted lining soak
    this.poisonCut = equipped('underlayer')?.poisonCut || 0;
    this.mudguard = Math.min(equipped('legs')?.mudguard ?? 1, equipped('boots')?.mudguard ?? 1);
    this.restMult = equipped('back')?.rest || 1;           // bedroll rest regen
    this.hasSaddle = !!equipped('mount')?.saddle;          // can mount wild horses
    this.coldProof = !!equipped('back')?.coldproof;        // Colossus mantle shrugs off the chill
    // charm: a single trinket slot with a flat percentage bonus
    const charm = equipped('charm');
    if (charm?.stats?.dmgPct) this.weapon.dmg *= 1 + charm.stats.dmgPct;
    if (charm?.stats?.aspd) this.weapon.cd *= 1 - charm.stats.aspd;
    this.attackRange = this.weapon.range; // aim marker clamps to this
    // ONE companion slot: a wolf (pet) or a sphere (orb), never both.
    // Pets scale with training AND the owner's level; orbs with Power.
    const comp = equipped('companion');
    const petBase = comp?.pet;
    this.pet = petBase
      ? { dmg: petBase.dmg * (1 + 0.25 * s.pet) * (1 + 0.03 * this.level) * this.gearMult,
          maxHp: Math.round((100 + 100 * s.pet + 50 * Math.floor(this.level / 2)) * this.gearMult) }
      : null;
    const orbBase = comp?.orb;
    this.orb = orbBase ? { ...orbBase, dmg: orbBase.dmg * (1 + 0.05 * s.power) * this.gearMult } : null;

    // cursed-statue pact: a strong boon lashed to a bane, until it expires
    if (this.boon) {
      if (this.boon.dmg) this.weapon.dmg *= this.boon.dmg;
      if (this.boon.speed) this.speed += this.boon.speed;
      if (this.boon.regen) this.hpRegen = Math.max(0, this.hpRegen + this.boon.regen);
    }

    // admin mode (singleplayer testing): direct stat overrides win over
    // everything derived above
    const ov = this.adminOverrides;
    if (ov) {
      if (ov.speed != null) this.speed = ov.speed;
      if (ov.maxHp != null) { this.maxHp = ov.maxHp; this.hp = Math.min(this.hp, this.maxHp); }
      if (ov.regen != null) this.hpRegen = ov.regen;
      if (ov.attack != null) this.weapon.dmg = ov.attack;
      if (ov.aspd != null) this.weapon.cd = 1 / Math.max(0.1, ov.aspd);
      if (ov.range != null) { this.weapon.range = ov.range; this.attackRange = ov.range; }
    }

    this._refreshWeaponMeshes();
    this._refreshOutfit();
  }

  // Naked-with-a-leaf until clothes are crafted: chest gear recolors the torso
  // & arms and hides the leaf; head gear adds a cap.
  _refreshOutfit() {
    const ud = this.mesh.userData;
    if (!ud.torso) return;
    const chestColors = { leatherArmor: 0x8a5a2b, furCoat: 0x6e5a40, bearHide: 0x4a3a2a,
      widowShroud: 0x273521, graveplate: 0x4d485c, iceplate: 0xa9c8d8 };
    const headColors = { leatherCap: 0x8a5a2b, furHood: 0x6e5a40, bearHelm: 0xb8bec6 };
    const skin = 0xd9a066;
    const chestId = this.equipment.chest;
    const color = chestId ? (chestColors[chestId] ?? 0x7a5230) : skin;
    for (const part of [ud.torso, ud.armL, ud.armR]) {
      part.material = new THREE.MeshLambertMaterial({ color });
    }
    ud.leaf.visible = !chestId;
    ud.capSlot.clear();
    const headId = this.equipment.head;
    if (headId) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.38),
        new THREE.MeshLambertMaterial({ color: headColors[headId] ?? 0x8a5a2b }));
      ud.capSlot.add(cap);
      ud.hair.visible = false;
    } else ud.hair.visible = true;
  }

  applyStun(sec) {
    if (this.dead) return;
    if (this.invulnT > 0) return;
    this.stunT = Math.max(this.stunT, sec);
    this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.3), '⚡ Stunned!', '#ffe94a');
    this.hooks.onHurt?.();
  }

  get dmgMult() { return this.rageT > 0 ? 1.5 : 1; }
  get cdMult() { return this.hasteT > 0 ? 0.5 : 1; }

  startDodge() {
    if (this.dead || this.stunT > 0 || this.dodgeCd > 0 || this.dashT > 0 || this.mounted) return false;
    const d = this.moveDir ? new THREE.Vector3(this.moveDir.x, 0, this.moveDir.z) : this.facing.clone();
    if (d.lengthSq() < 0.01) d.set(0, 0, -1);
    this.dodgeDir.copy(d.normalize());
    this.dodgeT = 0.22;
    this.dodgeCd = 1.05;
    this.invulnT = 0.28;
    this.charging = false;
    this.blocking = false;
    audio.sfx('special', 0.28, 180);
    return true;
  }

  cycleArrowMode() {
    if (this.weapon.style !== 'bow') return null;
    const modes = ['standard'];
    if (this.upgrades.broadheadArrows) modes.push('broadhead');
    if (this.upgrades.fireArrows) modes.push('fire');
    const i = modes.indexOf(this.arrowMode);
    this.arrowMode = modes[(i + 1 + modes.length) % modes.length];
    return this.arrowMode;
  }

  _refreshWeaponMeshes() {
    const { rightSocket, leftSocket } = this.mesh.userData;
    rightSocket.clear();
    leftSocket.clear();
    if (this.weapon.kind === 'melee' && this.weapon.tier > 0) {
      const makers = {
        club: makeClub, sword: makeSword, spear: makeHandSpear,
        pick: makePickaxe, axe: makeAxe,
      };
      const tool = (makers[this.weapon.style] || makeAxe)(this.weapon.tier);
      tool.rotation.x = -0.2;
      rightSocket.add(tool);
    }
    if (this.weapon.kind === 'bow') {
      leftSocket.add(this.weapon.style === 'crossbow' ? makeCrossbow(this.weapon.tier) : makeBow(this.weapon.tier));
    }
    // a torch is truly HELD: free hand gets the burning stick (the bow claims
    // the left hand, so archers carry the torch on the right)
    this.mesh.userData.torchRef = null;
    if (this.torchGear) {
      const t = makeTorchMesh();
      t.rotation.x = 0.3; // tipped slightly forward, away from the face
      (this.weapon.kind === 'bow' ? rightSocket : leftSocket).add(t);
      this.mesh.userData.torchRef = t;
    } else if (this.shield) {
      const shield = makeShield(this.shield.block >= 0.7 ? 2 : 1);
      shield.rotation.z = -0.3;
      (this.weapon.kind === 'bow' ? rightSocket : leftSocket).add(shield);
    }
  }

  // ---------- progression ----------
  addXp(n) {
    this.xp += Math.round(n * (this.xpMult || 1));
    while (this.level < MAX_LEVEL && this.xp >= XP_LEVELS[this.level + 1]) {
      this.level++;
      this.recompute(); // level-scaled stats (pet) pick the level up immediately
      this.hooks.onLevelUp(this.level);
    }
  }

  xpProgress() {
    if (this.level >= MAX_LEVEL) return 1;
    const cur = XP_LEVELS[this.level], next = XP_LEVELS[this.level + 1];
    return (this.xp - cur) / (next - cur);
  }

  // Vertical motion: glide smoothly over hills; walking off a cliff means
  // free fall — and a long enough drop costs health on landing.
  _updateVertical(dt, world, devFly = false) {
    const ground = world.heightAt(this.pos.x, this.pos.z);
    if (devFly) {
      if (!Number.isFinite(this.y)) this.y = ground;
      this.y = Math.max(ground, this.y);
      this.vy = 0;
      this.fallFrom = null;
      return this.y;
    }
    if (this.y == null) { this.y = ground; this.vy = 0; this.fallFrom = null; }
    if (this.y > ground + 0.3) {
      if (this.fallFrom == null) { this.fallFrom = this.y; this.vy = 0; }
      this.vy -= GRAVITY * dt;
      this.y = Math.max(ground, this.y + this.vy * dt);
      if (this.y <= ground + 1e-6) {
        const fall = this.fallFrom - ground;
        this.fallFrom = null; this.vy = 0;
        if (fall > SAFE_FALL) {
          const dmg = Math.round((fall - SAFE_FALL) * 6);
          this.hooks.popup?.(this.mesh.position.clone().setY(this.mesh.position.y + 2), `-${dmg} 🩸 fall`, '#ff6a5a');
          audio.sfx('hit', 0.5, 60);
          this.takeDamage(dmg, { silent: true, name: 'a nasty fall' });
        } else if (fall > 1.2) audio.sfx('base_hit', 0.25, 200);
      }
    } else {
      this.fallFrom = null; this.vy = 0;
      const gap = ground - this.y;
      // big gap = teleport/respawn → snap; otherwise glide up/down smoothly
      if (Math.abs(gap) > 3) this.y = ground;
      else this.y += gap * Math.min(1, dt * 18);
    }
    return this.y;
  }

  takeDamage(dmg, src = null) {
    if (this.dead) return;
    if (this.flying) return; // riding a griffin — far out of anyone's reach
    if (this.invulnT > 0) {
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.1), 'DODGE', '#b8f4ff');
      return;
    }
    const sx = src?.pos?.x, sz = src?.pos?.z;
    const sl = sx == null ? 0 : Math.hypot(sx - this.pos.x, sz - this.pos.z);
    const inFront = sx == null || sl < 0.01
      || ((sx - this.pos.x) / sl) * this.facing.x + ((sz - this.pos.z) / sl) * this.facing.z > 0.05;
    if (this.blocking && this.canBlock && inFront) {
      if (this.parryT > 0 && this.weapon.parry) {
        this.parryT = 0;
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), '⚔️ PARRY!', '#ffe36e', 'big');
        this.hooks.onParry?.(src);
        audio.sfx('base_hit', 0.5, 100);
        return;
      }
      const reduction = this.shield?.block ?? 0.35;
      dmg *= 1 - reduction;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.15),
        `🛡️ blocked ${Math.round(reduction * 100)}%`, '#9fd7ff');
      audio.sfx('base_hit', 0.35, 120);
    }
    if (this.dmgCut) dmg *= 1 - this.dmgCut; // quilted wool lining soaks a bit of everything
    if (this.stoneSkinT > 0) dmg *= 0.6;
    if (this.spiritWardT > 0) dmg *= 0.7;
    this.hurtT = 0;
    if (src?.name) this.killedBy = src.name; // remember the last thing that hurt us
    this.hp -= dmg;
    // every hit shows its number — incoming damage floats red above you
    if (!src?.silent) {
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.1),
        '-' + Math.round(dmg), '#ff5a4a');
    }
    // rotting claws (zombies): a festering DoT — the Haunted Forest hazard
    if (src?.poison && this.spiritWardT <= 0) {
      this.poisonT = src.poison.dur ?? 4;
      this.poisonDps = (src.poison.dps ?? 2) * (1 - this.poisonCut);
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), '☠️ poisoned', '#8aff3a');
    }
    audio.sfx('hit', 0.45, 120);
    this.hooks.onHurt?.();
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.hooks.onDeath();
    }
  }

  eatBerry() {
    if (this.dead || this.berry < 1) return false;
    this.berry = Math.round((this.berry - 1) * 10) / 10;
    this.hp = Math.min(this.maxHp, this.hp + 7);
    this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), '🫐 +7 ❤️', '#c9a4ff');
    audio.sfx('eat_food', 0.55, 300);
    return true;
  }

  // consumables bought in the Supplies tab, used in the field with F / G
  useConsumable(id) {
    if (this.dead || (this.consumables[id] ?? 0) <= 0) return false;
    const c = consumableById(id);
    if (!c) return false;
    this.consumables[id]--;
    if (c.reveal) {
      // Scroll of Discovery: hand off to the UI to open the map & reveal a ring
      this.hooks.onScrollUse?.(c);
      return true;
    }
    if (c.venomDur) {
      this.venomT = c.venomDur;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), '☠️ venom coat', '#8aff3a');
      audio.sfx('special', 0.5);
      return true;
    }
    this.hp = Math.min(this.maxHp, this.hp + c.heal);
    if (c.speedDur) this.roastT = c.speedDur;
    this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
      `${c.icon} +${c.heal} ❤️${c.speedDur ? ' +🏃' : ''}`, '#7fe07f');
    audio.sfx('eat_food', 0.6, 250);
    return true;
  }

  // ---------- per-frame ----------
  update(dt, ctx) {
    const { input, world, enemyMgr, projectiles, aimPoint } = ctx;
    this._updateLevelFx(dt); // cosmetic — keeps animating regardless of state
    // Leaving dev flight always returns safely to the terrain instead of
    // converting the inspection altitude into lethal fall damage.
    if (this._devFlyActive && !ctx.devFly) {
      this.y = world.heightAt(this.pos.x, this.pos.z);
      this.vy = 0;
      this.fallFrom = null;
    }
    this._devFlyActive = !!ctx.devFly;
    if (this.dead) return;

    // caught in a dust devil: the tornado owns our position & vertical this
    // frame — no walking, no attacks, and (crucially) NO regen while aloft.
    if (this.captured) {
      this.hurtT += dt;
      this.attackCd = Math.max(0, this.attackCd - dt);
      this._updateSlashes?.(dt);
      return;
    }

    // timed effects
    this.hasteT = Math.max(0, this.hasteT - dt);
    this.rageT = Math.max(0, this.rageT - dt);
    this.stoneSkinT = Math.max(0, this.stoneSkinT - dt);
    this.spiritWardT = Math.max(0, this.spiritWardT - dt);
    this.roastT = Math.max(0, this.roastT - dt);
    if (this.boon && (this.boon.t -= dt) <= 0) { this.boon = null; this.recompute(); }
    this.venomT = Math.max(0, this.venomT - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.parryT = Math.max(0, this.parryT - dt);
    this.comboT = Math.max(0, this.comboT - dt);
    this.hurtT += dt;
    // a held torch BURNS: ~5 real minutes (5 in-game hours) per stick, then
    // it crumbles to ash and leaves your hand empty. Fuel is tracked PER TIER
    // (swapping torches never refills one) and only ticks while it's in hand.
    if (this.torchGear && !this.torchGear.permanent) {
      const tid = this.equipment.offhand;
      this.torchFuelById ??= {};
      this.torchFuelById[tid] ??= 300;
      this.torchFuelById[tid] -= dt;
      if (this.torchFuelById[tid] <= 30 && !this._torchWarned) {
        this._torchWarned = true;
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
          '🔥 Torch is guttering…', '#ffcc66');
      }
      if (this.torchFuelById[tid] <= 0) {
        this.equipment.offhand = null;      // ash — the stick is gone for good
        delete this.torchFuelById[tid];     // the NEXT one of this tier starts fresh
        this._torchWarned = false;
        this.recompute();
        this.hooks.onEquipChange?.('offhand');
        this.hooks.onTorchOut?.(tid);
      }
    } else this._torchWarned = false;

    // wool bedroll (worn on the back): stillness out of combat knits wounds fast
    const rest = (this.restMult > 1 && this.idleT > 3 && this.hurtT > 5) ? this.restMult : 1;
    if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * rest * dt);
    for (const id in this.spellCds) this.spellCds[id] = Math.max(0, this.spellCds[id] - dt);

    // poison ticks in whole numbers once a second so the popups stay readable
    if (this.poisonT > 0) {
      this.poisonT -= dt;
      this.poisonTickT -= dt;
      if (this.poisonTickT <= 0) {
        this.poisonTickT = 1;
        this.hp -= this.poisonDps;
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 1.9), `-${this.poisonDps} ☠️`, '#8aff3a');
        if (this.hp <= 0) { this.hp = 0; this.dead = true; this.hooks.onDeath(); return; }
      }
    }

    // stunned: frozen in place, can't move or attack
    if (this.stunT > 0) {
      this.stunT -= dt;
      this.blocking = false;
      this.charging = false;
      this.mesh.position.set(this.pos.x, this._updateVertical(dt, world, ctx.devFly), this.pos.z);
      this.attackCd -= dt;
      this._updateSlashes(dt);
      return;
    }

    // A sword can parry during the first instant of its guard; shields sustain
    // a stronger block. Guarding slows movement and prevents attacking.
    const wantsBlock = input.block && this.canBlock && !this.charging && this.dodgeT <= 0 && this.dashT <= 0;
    if (wantsBlock && !this.blocking) this.parryT = 0.22;
    this.blocking = wantsBlock;

    // -- dash overrides normal movement --
    let moving = false;
    this.moveDir = null; // world-space walk direction this frame (auto camera rotate)
    if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      this.pos.addScaledVector(this.dodgeDir, 19 * dt);
      world.collide(this.pos, 0.45, { boat: ctx.boat });
      this._applyBounds(ctx);
      moving = true;
      this.walkT += dt * 24;
    } else if (this.dashT > 0) {
      this.dashT -= dt;
      this.pos.addScaledVector(this.dashDir, 34 * dt);
      world.collide(this.pos, 0.45, { boat: ctx.boat });
      this._applyBounds(ctx);
      for (const e of enemyMgr.alive()) {
        if (this.dashHit.has(e.id)) continue;
        if (e.pos.distanceTo(this.pos) < 1.7 + e.hitR) {
          this.dashHit.add(e.id);
          if (this.dashSpec.stun) enemyMgr.stun(e, this.dashSpec.stun);
          enemyMgr.damage(e, this.dmgMult * this.dashSpec.dmg, this.dashDir);
        }
      }
      moving = true;
      this.walkT += dt * 20;
    } else {
      let mx = input.moveX, mz = input.moveZ;
      let flyY = 0;
      // RPG third-person mode: WoW-style tank controls — A/D TURN the
      // character, W drives forward, S backs up; the camera hangs behind
      if (ctx.rpgView) {
        const pitch = ctx.devFly ? (ctx.devFlyPitch ?? 0) : 0;
        const forwardFlat = ctx.devFly ? Math.cos(pitch) : 1;
        const forwardY = ctx.devFly ? -Math.sin(pitch) : 0;
        if (ctx.mouseLook) {
          // mouse steers the character — A/D become pure strafing
          const fwd = -mz, strafe = mx;
          const dX = this.facing.x, dZ = this.facing.z;
          mx = dX * fwd * forwardFlat - dZ * strafe;
          mz = dZ * fwd * forwardFlat + dX * strafe;
          flyY = fwd * forwardY;
        } else {
          if (mx !== 0) {
            const yaw = Math.atan2(this.facing.x, this.facing.z) - mx * 2.8 * dt;
            this.facing.set(Math.sin(yaw), 0, Math.cos(yaw));
          }
          const drive = -mz; // W = 1, S = -1
          mx = this.facing.x * drive * forwardFlat;
          mz = this.facing.z * drive * forwardFlat;
          flyY = drive * forwardY;
        }
      } else if (ctx.mouseMove && (mx !== 0 || mz !== 0)) {
        const fx = aimPoint.x - this.pos.x, fz = aimPoint.z - this.pos.z;
        const fl = Math.hypot(fx, fz);
        if (fl > 0.01) {
          const dX = fx / fl, dZ = fz / fl;   // forward = toward the cursor
          const fwd = -mz, strafe = mx;       // W → forward, D → strafe right
          mx = dX * fwd - dZ * strafe;
          mz = dZ * fwd + dX * strafe;
        }
      }
      moving = (mx !== 0 || mz !== 0 || flyY !== 0) && !ctx.boatPlacing; // raft being set up
      this.idleT = moving ? 0 : this.idleT + dt;
      if (moving) {
        const len = Math.hypot(mx, mz, flyY);
        mx /= len; mz /= len; flyY /= len;
        this.moveDir = { x: mx, z: mz };
        // paddling is a touch slower than running; roast buff speeds you up;
        // the swamp (ctx.envSpeedMult) drags at your boots
        const onWater = !ctx.devFly && ctx.boat && world.isWater?.(this.pos.x, this.pos.z);
        const guardSlow = this.blocking ? 0.48 : 1;
        const mountBonus = ctx.mounted ? 9 : ctx.boatMount ? 6 : 0;
        const terrainMult = onWater ? (ctx.boatMount ? 0.65 : 0.4) : (ctx.boatMount ? 0.45 : 1);
        const speed = (this.speed + mountBonus) * terrainMult
          * guardSlow
          * (this.roastT > 0 ? 1.1 : 1) * (ctx.devFly ? 1 : (ctx.envSpeedMult ?? 1));
        // cliffs are walls: block any step that climbs too steeply (walking
        // DOWN or falling off is always allowed); sliding along one is fine.
        // Deep swamp water is a wall too unless you carry the boat — but
        // never trap someone already standing in it.
        const h0 = world.heightAt(this.pos.x, this.pos.z);
        const canStep = (dx, dz) => {
          const l = Math.hypot(dx, dz);
          if (l < 1e-6) return false;
          const ax = this.pos.x + (dx / l) * 0.9, az = this.pos.z + (dz / l) * 0.9;
          // deep swamp water is a WALL without the boat — you may only reach it
          // by paddling. (A step whose DESTINATION is water is blocked, so a
          // player caught in water can still wade OUT toward any shore.)
          if (!ctx.boat && world.swampZone?.(ax, az) === 'water'
              && !world._lilypadAt?.(ax, az)) return false;
          const ahead = world.heightAt(ax, az);
          return (ahead - h0) / 0.9 <= MAX_CLIMB_SLOPE;
        };
        const dx = mx * speed * dt, dz = mz * speed * dt;
        if (ctx.devFly) {
          const ground = world.heightAt(this.pos.x, this.pos.z);
          if (!Number.isFinite(this.y)) this.y = ground;
          this.pos.x += dx;
          this.pos.z += dz;
          this.y = Math.max(ground, this.y + flyY * speed * dt);
          this.vy = 0;
          this.fallFrom = null;
        } else {
          if (canStep(dx, dz)) { this.pos.x += dx; this.pos.z += dz; }
          else if (canStep(dx, 0)) this.pos.x += dx;
          else if (canStep(0, dz)) this.pos.z += dz;
          world.collide(this.pos, 0.45, { boat: ctx.boat });
        }
        this._applyBounds(ctx);
        this.walkT += dt * speed;
      }
    }

    // -- aim: face the mouse point (RPG mode faces where the keys steer) --
    if (!ctx.rpgView) {
      this.facing.set(aimPoint.x - this.pos.x, 0, aimPoint.z - this.pos.z);
      if (this.facing.lengthSq() < 0.01) this.facing.set(0, 0, -1);
      this.facing.normalize();
    }
    this.mesh.position.set(this.pos.x, this._updateVertical(dt, world, ctx.devFly), this.pos.z);
    // local +z toward the aim point, so arm swings (toward +z) punch forward
    this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);

    // -- attack with the equipped weapon: tap LMB for a normal hit, hold and
    // release for a charged strike. RMB remains quick-repeat in top-down view. --
    this.attackCd -= dt;
    const pressed = input.takeLeftPressed();
    const released = input.takeLeftReleased();
    if (pressed && this.attackCd <= 0 && this.dashT <= 0 && this.dodgeT <= 0 && !this.blocking) {
      this.charging = true;
      this.chargeT = 0;
    }
    if (this.charging) {
      if (input.mouse.left) this.chargeT = Math.min(1.2, this.chargeT + dt);
      if (released || !input.mouse.left) {
        const charge = Math.min(1, this.chargeT / 1.05);
        this.charging = false;
        if (this.weapon.kind === 'bow') this._doShoot(projectiles, charge, ctx.mounted);
        else this._doMelee(world, enemyMgr, ctx.pickups, charge, moving, ctx.mounted);
      }
    } else if (input.quickAttack && this.attackCd <= 0 && this.dashT <= 0 && this.dodgeT <= 0 && !this.blocking) {
      if (this.weapon.kind === 'bow') this._doShoot(projectiles, 0, ctx.mounted);
      else this._doMelee(world, enemyMgr, ctx.pickups, 0, moving, ctx.mounted);
    }

    this._animate(dt, moving);
    this._updateSlashes(dt);
  }

  _clampToWorld() {
    const r = Math.hypot(this.pos.x, this.pos.z);
    const max = WORLD.radius - 2;
    if (r > max) {
      const k = max / r;
      this.pos.x *= k; this.pos.z *= k;
    }
  }

  // Bounds depend on the mode: arena circle (PvP duel), square map (MOBA),
  // or the survival world strip.
  _applyBounds(ctx) {
    const zone = ctx.arenaZone;
    if (zone) {
      const dx = this.pos.x - zone.x, dz = this.pos.z - zone.z;
      const d = Math.hypot(dx, dz);
      const maxR = zone.r - 0.6;
      if (d > maxR) {
        this.pos.x = zone.x + (dx / d) * maxR;
        this.pos.z = zone.z + (dz / d) * maxR;
      }
      return;
    }
    if (ctx.mobaBounds) {
      const h = ctx.mobaBounds - 1;
      this.pos.x = Math.max(-h, Math.min(h, this.pos.x));
      this.pos.z = Math.max(-h, Math.min(h, this.pos.z));
      return;
    }
    this._clampToWorld();
  }

  // Bring a dead player back (multiplayer respawn / post-duel return).
  revive(hpFrac = 1) {
    this.dead = false;
    this.hp = Math.max(1, Math.round(this.maxHp * hpFrac));
    this.stunT = 0;
    this.dashT = 0;
    this.dodgeT = 0;
    this.invulnT = 0;
    this.blocking = false;
    this.charging = false;
    this.mesh.rotation.z = 0;
  }

  // Death penalty: drop one full level — back to the previous level with 0 XP
  // progress into it (at level 1 the XP bar just resets to zero).
  // death wipes the CURRENT level's progress — the level itself stays
  loseLevel() {
    this.xp = XP_LEVELS[this.level];
  }

  _inArc(tx, tz, maxDist, extraR = 0, minDot = 0.55) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > maxDist + extraR) return false;
    if (dist < 0.4) return true;
    const dot = (dx / dist) * this.facing.x + (dz / dist) * this.facing.z;
    return dot > minDot;
  }

  // Visible swing arc — a crescent that sweeps and fades with the strike.
  // Its outer radius matches the weapon's melee reach so the effect never
  // looks bigger than the actual hit range.
  _spawnSlash() {
    const r = this.weapon.range;
    const geo = new THREE.RingGeometry(r * 0.4, r, 14, 1, Math.PI / 2 - 1.1, 2.2);
    geo.rotateX(Math.PI / 2); // arc lies flat, centered on local +z
    const mat = new THREE.MeshBasicMaterial({
      color: this.weapon.tier > 0 ? 0xffd98a : 0xffffff,
      transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const baseRy = Math.atan2(this.facing.x, this.facing.z);
    mesh.position.set(this.pos.x, this.mesh.position.y + 0.85, this.pos.z);
    mesh.rotation.y = baseRy - 0.5;
    this.scene.add(mesh);
    this.slashes.push({ mesh, baseRy, t: 0, life: 0.2 });
  }

  // ---------- level-up burst ----------
  // Golden shockwave rings, a rising light column and a shower of sparks around
  // the player. Purely cosmetic; pieces live in this.levelFx and self-dispose.
  spawnLevelUpEffect() {
    const cx = this.pos.x, cz = this.pos.z;
    const baseY = this.mesh.position.y;
    const GOLD = 0xffd24a, PALE = 0xfff2b0;

    // two expanding ground rings
    for (let r = 0; r < 2; r++) {
      const geo = new THREE.RingGeometry(0.5, 0.75, 40);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: r ? PALE : GOLD, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx, baseY + 0.06, cz);
      this.scene.add(mesh);
      this.levelFx.push({ mesh, t: 0, life: 0.75, delay: r * 0.12, kind: 'ring' });
    }

    // vertical light column
    const colGeo = new THREE.CylinderGeometry(0.7, 0.7, 4.5, 20, 1, true);
    const colMat = new THREE.MeshBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(cx, baseY + 2.25, cz);
    this.scene.add(col);
    this.levelFx.push({ mesh: col, t: 0, life: 0.7, delay: 0, kind: 'column' });

    // spark shower
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.11, 0.11),
        new THREE.MeshBasicMaterial({ color: i % 2 ? PALE : GOLD, transparent: true, opacity: 1, depthWrite: false }),
      );
      const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const spd = 3 + Math.random() * 3.5;
      s.position.set(cx, baseY + 0.4, cz);
      this.scene.add(s);
      this.levelFx.push({
        mesh: s, t: 0, life: 0.6 + Math.random() * 0.3, delay: 0, kind: 'spark',
        vel: new THREE.Vector3(Math.cos(ang) * spd, 6 + Math.random() * 3, Math.sin(ang) * spd),
      });
    }
  }

  _updateLevelFx(dt) {
    for (let i = this.levelFx.length - 1; i >= 0; i--) {
      const f = this.levelFx[i];
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.t += dt;
      const k = Math.min(1, f.t / f.life);
      const m = f.mesh;
      if (f.kind === 'ring') {
        const s = 0.4 + k * 3.2;
        m.scale.set(s, 1, s);
        m.material.opacity = 0.85 * (1 - k);
      } else if (f.kind === 'column') {
        m.scale.set(1 + k * 0.4, 1, 1 + k * 0.4);
        m.position.y += dt * 1.5;
        m.material.opacity = 0.5 * (1 - k);
      } else { // spark
        f.vel.y -= 16 * dt; // gravity
        m.position.addScaledVector(f.vel, dt);
        m.rotation.x += dt * 8; m.rotation.y += dt * 6;
        m.material.opacity = 1 - k;
      }
      if (f.t >= f.life) {
        this.scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
        this.levelFx.splice(i, 1);
      }
    }
  }

  _updateSlashes(dt) {
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.t += dt;
      const k = Math.min(1, s.t / s.life);
      s.mesh.rotation.y = s.baseRy - 0.5 + k * 1.1;         // sweep across the arc
      s.mesh.material.opacity = 0.7 * (1 - k);
      s.mesh.scale.setScalar(0.92 + k * 0.08);              // settles at 1.0 = full reach
      if (s.t >= s.life) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        this.slashes.splice(i, 1);
      }
    }
  }

  _hitsWeakPoint(enemy, charge) {
    if (charge < 0.72) return false;
    if (enemy.stunT > 0 || enemy.windupT > 0) return true;
    const ry = enemy.mesh?.rotation?.y ?? 0;
    const fx = -Math.sin(ry), fz = -Math.cos(ry); // enemy model's forward direction
    const dx = this.pos.x - enemy.pos.x, dz = this.pos.z - enemy.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    return fx * (dx / len) + fz * (dz / len) < -0.45; // charged back strike
  }

  _doMelee(world, enemyMgr, pickups, charge = 0, moving = false, mounted = false) {
    const w = this.weapon;
    const combo = w.combo || [1];
    this.comboStep = this.comboT > 0 ? (this.comboStep + 1) % combo.length : 0;
    this.comboT = Math.max(0.8, w.cd * 1.8);
    const comboMult = combo[this.comboStep] ?? 1;
    const charged = charge >= 0.42;
    const chargeMult = 1 + charge * 1.15;
    const runMult = moving ? 1.16 : 1;
    const mountMult = mounted ? 1.28 : 1;
    const impactMult = comboMult * chargeMult * runMult * mountMult;
    this.attackCd = w.cd * this.cdMult * (charged ? 1.18 : 1) * (mounted ? 1.25 : 1);
    this.attackDur = Math.min(0.42, w.cd * 0.8);
    this.attackT = this.attackDur;
    this._spawnSlash();
    audio.sfx('attack_melee', 0.4);

    // Running attacks carry momentum; a charged spear turns that momentum into
    // a real forward lunge while still respecting terrain collision.
    const lunge = (moving ? 0.28 : 0) + (w.chargeLunge ? w.chargeLunge * charge : 0);
    if (lunge > 0) {
      this.pos.addScaledVector(this.facing, lunge);
      world.collide(this.pos, 0.45);
      this._clampToWorld();
    }

    const arcDot = w.style === 'axe' ? 0.22 : w.style === 'spear' || w.style === 'pick' ? 0.76 : 0.5;
    const baseCrit = Math.random() < this.critChance;
    for (const e of enemyMgr.alive()) {
      if (this._inArc(e.pos.x, e.pos.z, w.range + (moving ? 0.25 : 0), e.hitR, arcDot)) {
        const weakPoint = this._hitsWeakPoint(e, charge);
        const crit = baseCrit || weakPoint;
        const armored = (e.armor ?? (/golem|snapper|colossus/i.test(e.type) ? 0.3 : 0)) > 0;
        const armorMult = armored && w.armoredBonus ? w.armoredBonus : 1;
        const dmg = this.dmgMult * w.dmg * impactMult * armorMult * (crit ? CRIT_MULT : 1);
        const opts = {
          crit, weakPoint,
          ...(w.armorPierce ? { armorPierce: w.armorPierce } : {}),
          ...(w.armorBreak ? { armorBreak: w.armorBreak * (0.7 + charge * 0.6), breakDur: 6 } : {}),
          ...(w.bleed ? { bleed: { dps: w.bleed * (0.75 + charge * 0.6), dur: 4 } } : {}),
          ...(w.burn ? { burn: { dps: w.burn * (0.7 + charge * 0.5), dur: 4 } } : {}),
          ...(this.venomT > 0 ? { poison: { dps: 4, dur: 3 } } : {}),
        };
        enemyMgr.damage(e, dmg, this.facing, 'local', opts);
        if (w.stun && (charged || this.comboStep === combo.length - 1)) {
          enemyMgr.stun(e, w.stun * (1 + charge * 0.8));
        }
        if (weakPoint) this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y + 2),
          '✦ WEAK POINT', '#fff08a', 'big');
      }
    }

    // bash a wild beehive open with any weapon
    for (const hive of (world.hivesNear?.(this.pos, w.range + 0.6) ?? [])) {
      if (!this._inArc(hive.x, hive.z, w.range, hive.radius)) continue;
      const res = world.hitHive(hive, this.dmgMult * w.dmg * impactMult);
      this.hooks.onHiveHit?.(hive, res);
      break; // one hive per swing
    }

    // raid a bandit dwelling — smash it apart for a Scroll of Discovery
    for (const camp of (enemyMgr.campsNear?.(this.pos, w.range + 0.8) ?? [])) {
      if (!this._inArc(camp.x, camp.z, w.range, camp.radius)) continue;
      const res = enemyMgr.hitCamp(camp, this.dmgMult * w.dmg * impactMult);
      this.hooks.onCampHit?.(camp, res);
      break; // one dwelling per swing
    }

    // berry bushes: any melee swing knocks ripe berries to the ground
    for (const bush of (world.bushesNear?.(this.pos, w.range + 0.6) ?? [])) {
      if (!bush.berries || !this._inArc(bush.x, bush.z, w.range, bush.radius)) continue;
      if (world.pickBerries(bush)) {
        pickups.spawn('berry', 1, new THREE.Vector3(bush.x, 0, bush.z), 0.7);
        this.hooks.onBerry?.(bush.key); // co-op: the partner's bush empties too
      }
    }

    // ---- harvesting: the RIGHT tool for the job ----
    // trees need chop power (club slowly, axes fast); rocks need a PICKAXE
    const arcSort = (list) => list
      .filter(t => this._inArc(t.x, t.z, w.range, t.radius))
      .sort((a, b) => (a.x - this.pos.x) ** 2 + (a.z - this.pos.z) ** 2
                    - ((b.x - this.pos.x) ** 2 + (b.z - this.pos.z) ** 2));
    const trees = arcSort(world.treesNear(this.pos, w.range + 0.6));
    const rocks = arcSort(world.rocksNear?.(this.pos, w.range + 0.6) ?? []);

    if (trees.length && w.chop > 0) {
      const tree = trees[0];
      const power = w.chop * this.chopMult * (1 + charge * 0.5);
      const wood = world.chop(tree, power, this.pos);
      this.hooks.onChop?.(tree, power); // co-op keeps the partner's forest in sync
      if (wood > 0) {
        const total = Math.max(1, Math.round(wood * this.gatherMult));
        const dropPos = new THREE.Vector3(tree.x, 0, tree.z);
        const piles = Math.min(3, Math.max(1, Math.round(total / 3)));
        let left = total;
        for (let i = 0; i < piles; i++) {
          const amount = i === piles - 1 ? left : Math.ceil(total / piles);
          left -= amount;
          pickups.spawn('wood', amount, dropPos, 1.2);
        }
      }
    } else if (rocks.length && w.mine > 0) {
      const stone = world.mineRock(rocks[0], w.mine * this.chopMult * (1 + charge * 0.5), this.pos);
      if (stone > 0) {
        const total = Math.max(1, Math.round(stone * this.gatherMult));
        const dropPos = new THREE.Vector3(rocks[0].x, 0, rocks[0].z);
        pickups.spawn('stone', Math.ceil(total / 2), dropPos, 1.0);
        pickups.spawn('stone', Math.floor(total / 2) || 1, dropPos, 1.0);
        // Dark Forest onward, rocks carry veins of raw iron
        if (biomeIndexAt(this.pos.x, this.pos.z) >= 1 && Math.random() < 0.15) {
          pickups.spawn('iron', 1, dropPos, 0.8);
          this.hooks.popup(dropPos.clone().setY(1.6), '🔩 iron vein!', '#c8d0d8');
        }
      }
    } else if (trees.length && w.chop <= 0 && !this.hintedAxe) {
      this.hintedAxe = true;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        'You can\'t fell trees with that — craft a club or an axe!', '#ffcc66');
    } else if (rocks.length && !(w.mine > 0) && !this.hintedRock) {
      this.hintedRock = true;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        'Rock needs a PICKAXE — craft a Bone Pickaxe!', '#ffcc66');
    }
  }

  _doShoot(projectiles, charge = 0, mounted = false) {
    const w = this.weapon;
    const crossbow = w.style === 'crossbow';
    const charged = charge >= 0.42;
    this.attackCd = w.cd * this.cdMult * (mounted ? 1.2 : 1);
    this.attackDur = 0.25;
    this.attackT = 0.25;
    audio.sfx('attack_ranged', 0.4);
    const speed = crossbow ? 31 : 23 + charge * 9;
    const weakPoint = !crossbow && charge >= 0.78;
    const crit = weakPoint || Math.random() < this.critChance;
    const drawMult = crossbow ? 1 + charge * 0.25 : 0.85 + charge * 1.05;
    const mountMult = mounted ? 1.18 : 1;
    const arrowMode = crossbow ? 'bolt' : this.arrowMode;
    const effects = arrowMode === 'broadhead'
      ? { bleed: { dps: 5 + w.tier * 2, dur: 5 } }
      : arrowMode === 'fire'
        ? { burn: { dps: 6 + w.tier * 2, dur: 4 } }
        : crossbow
          ? { armorPierce: w.armorPierce, armorBreak: w.armorBreak, breakDur: 7 }
          : {};
    const origin = this.pos.clone().add(this.facing.clone().multiplyScalar(0.6))
      .setY(this.mesh.position.y + 1.1 + (mounted ? 0.9 : 0));
    projectiles.spawnArrow(origin, this.facing.clone(), {
      dmg: this.dmgMult * w.dmg * drawMult * mountMult * (crit ? CRIT_MULT : 1),
      pierce: w.pierce || weakPoint, speed, crit, weakPoint, effects,
      life: w.range / speed, // arrows fall dead at the weapon's max range
    });
    if (weakPoint) this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
      '🎯 precision shot', '#fff08a');
  }

  _animate(dt, moving) {
    const { leftLeg, rightLeg, leftArm, rightArm, rightSocket } = this.mesh.userData;
    const swing = moving ? Math.sin(this.walkT * 1.4) * 0.55 : 0;
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;

    const bowEquipped = this.weapon.kind === 'bow';
    if (this.blocking) {
      leftArm.rotation.x = -1.25;
      rightArm.rotation.x = -0.75;
      rightArm.rotation.z = -0.25;
    } else if (this.charging) {
      const draw = Math.min(1, this.chargeT / 1.05);
      if (bowEquipped) {
        leftArm.rotation.x = -1.45;
        rightArm.rotation.x = -0.55 - draw * 0.9;
      } else {
        rightArm.rotation.x = 0.45 + draw * 0.75;
        rightArm.rotation.z = -0.2 - draw * 0.25;
      }
    } else if (this.attackT > 0) {
      this.attackT -= dt;
      const k = 1 - Math.max(0, this.attackT) / this.attackDur; // 0 → 1 over the swing
      if (bowEquipped) {
        leftArm.rotation.x = -1.5;
        rightArm.rotation.x = -1.2 * Math.sin(k * Math.PI);
      } else {
        // real chop: wind up behind the shoulder, then whip down through the arc
        const windup = 0.85 * Math.min(1, k / 0.3);
        const strike = k <= 0.3 ? 0 : (k - 0.3) / 0.7;
        const whip = strike * strike * (3 - 2 * strike); // smoothstep
        rightArm.rotation.x = windup * (1 - whip) - 2.6 * whip;
        rightArm.rotation.z = -0.35 * Math.sin(k * Math.PI); // slight diagonal sweep
        rightSocket.rotation.x = -1.1 * whip * (1 - strike * 0.4); // wrist flick
      }
    } else {
      rightArm.rotation.x = -swing * 0.6;
      rightArm.rotation.z = 0;
      rightSocket.rotation.x = 0;
      leftArm.rotation.x = bowEquipped ? -0.5 : swing * 0.6;
    }
  }

  // Plain-data state for future multiplayer snapshots.
  snapshot() {
    return {
      x: +this.pos.x.toFixed(2), z: +this.pos.z.toFixed(2),
      fx: +this.facing.x.toFixed(2), fz: +this.facing.z.toFixed(2),
      hp: Math.round(this.hp), xp: this.xp, level: this.level,
      meat: this.meat, wood: this.wood, stats: { ...this.stats },
      eq: { ...this.equipment }, items: [...this.itemsOwned], spells: [...this.spellSlots],
    };
  }
}
