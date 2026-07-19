// ---- Player: movement, aiming, equipment (WoW-style slots), weapons,
// spells, XP & resources ----
// All gameplay state lives in plain fields (serializable for future
// multiplayer snapshots); the THREE mesh is pure presentation.

import * as THREE from 'three';
import { WORLD, XP_LEVELS, MAX_LEVEL, itemById, spellById, consumableById,
         biomeIndexAt, RESOURCES, MAX_SPELL_SLOTS, classSkillById,
         classEffectsFor, requiredClassForItem } from './config.js';
import { makeMan, makeAxe, makeBow, makePickaxe, makeTorchMesh, makeClub,
         makeSword, makeHandSpear, makeCrossbow, makeShield } from './models.js';
import { audio } from './audio.js';

const MAX_CLIMB_SLOPE = 1.0; // steeper ground than this is a wall
const GRAVITY = 34;
const SAFE_FALL = 5.5;       // meters of free fall before damage kicks in
const CRIT_CHANCE = 0.1;     // every attack can crit for CRIT_MULT damage
const CRIT_MULT = 1.6;

const rankValue = (skill, key, rank, fallback = 0) => {
  const value = skill?.[key];
  if (Array.isArray(value)) return value[Math.max(0, Math.min(value.length - 1, rank - 1))] ?? fallback;
  return value ?? fallback;
};

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
    this.selectedClass = null;        // first trained rank locks one exclusive class
    this.classTraining = {};          // class skill id -> rank (1..3)
    this.classEffects = {};
    this.petDead = false;             // a dead pet stays dead until resurrected
    this.petMode = 'aggressive';      // 'aggressive' | 'defensive' | 'passive'
    this.petCommandTargetId = null;
    this.petCommandT = 0;
    this.petCommandPower = 0;

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
    this.classZones = [];
    this.classFx = [];
    this.stealthT = 0;
    this.stealthed = false;
    this.evadeT = 0;
    this.classShield = 0;
    this.hotT = 0;
    this.hotRate = 0;
    this.hotTickT = 0;
    this.guardianSpiritT = 0;
    this.guardianSpiritHeal = 0;
    this.combatDots = {};            // PvP bleed/burn/poison/Rend received over the network
    this.combatDotTickT = 0;
    this.escapeRushT = 0;
    this.warCryT = 0;
    this.warCryPower = 0;
    this.bloodFuryT = 0;
    this.bloodFuryPower = 0;
    this.avatarT = 0;
    this.avatarPower = 0;
    this.arrowHasteT = 0;
    this.arrowHastePower = 0;
    this.poisonBladesT = 0;
    this.poisonBladesPower = 0;
    this.sprintT = 0;
    this.sprintPower = 0;
    this.combustionT = 0;
    this.combustionPower = 0;

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
    if (!item) return false;
    if (item.placeable) return false; // world items are used from the bag, never worn
    if (id !== 'fists' && !this.invItems.includes(id)
        && !Object.values(this.equipment).includes(id)) return false;
    const requiredClass = this.hooks.classRulesEnabled?.() === false ? null : requiredClassForItem(item);
    if (requiredClass && this.selectedClass !== requiredClass) {
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        'Requires Beastmaster class to equip', '#ffcc66');
      audio.sfx('error', 0.4);
      return false;
    }
    if (item.level > this.level) { // dropped gear waits until you grow into it
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        `${item.name} needs level ${item.level}`, '#ffcc66');
      audio.sfx('error', 0.4);
      return false;
    }
    if (this.equipment[item.slot] === id) return true; // already worn
    // take one copy out of the backpack; the replaced piece goes back in
    const idx = this.invItems.indexOf(id);
    if (idx >= 0) this.invItems.splice(idx, 1);
    const prev = this.equipment[item.slot];
    if (prev && prev !== 'fists') this.invItems.push(prev);
    this.equipment[item.slot] = id;
    this.recompute();
    this.hooks.onEquipChange?.(item.slot);
    return true;
  }

  enforceClassEquipment() {
    if (this.hooks.classRulesEnabled?.() === false) return false;
    let changed = false;
    for (const [slot, id] of Object.entries(this.equipment)) {
      const item = itemById(id);
      const required = requiredClassForItem(item);
      if (!required || this.selectedClass === required) continue;
      if (id && id !== 'fists') this.invItems.push(id);
      this.equipment[slot] = slot === 'weapon' ? 'fists' : null;
      changed = true;
    }
    if (changed) {
      this.petDead = false;
      this.petCommandTargetId = null;
      this.petCommandT = 0;
      this.hooks.onEquipChange?.('class');
    }
    return changed;
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
    this.assignAbilitySlot(id);
    return true;
  }

  assignAbilitySlot(id) {
    if (this.spellSlots.includes(id)) return true;
    let open = this.spellSlots.findIndex(v => !v);
    if (open < 0 && this.spellSlots.length < MAX_SPELL_SLOTS) open = this.spellSlots.length;
    if (open < 0 || open >= MAX_SPELL_SLOTS) return false;
    this.spellSlots[open] = id;
    return true;
  }

  toggleSpellSlot(id) {
    const i = this.spellSlots.indexOf(id);
    if (i >= 0) this.spellSlots[i] = undefined;
    else if (this.spellsOwned.has(id) || this.hasClassSkill(id)) this.assignAbilitySlot(id);
  }

  classRank(id) {
    return Math.max(0, Math.min(classSkillById(id)?.maxRank || 0, this.classTraining?.[id] || 0));
  }

  hasClassSkill(id) {
    const skill = classSkillById(id);
    return !!skill && skill.classId === this.selectedClass && this.classRank(id) > 0;
  }

  trainedClassActives() {
    return Object.keys(this.classTraining || {})
      .map(id => classSkillById(id))
      .filter(skill => skill?.type === 'active' && skill.classId === this.selectedClass && this.classRank(skill.id) > 0);
  }

  classAbilityCooldown(id) {
    const skill = classSkillById(id);
    if (!skill || skill.type !== 'active') return 0;
    return skill.cd * Math.max(0.35, 1 - (this.classEffects?.classCdReduction || 0));
  }

  clearClassCombatState() {
    for (const zone of this.classZones) this._removeClassZone(zone);
    this.classZones.length = 0;
    this.breakStealth();
    this.evadeT = 0;
    this.classShield = 0;
    this.hotT = this.hotRate = 0;
    this.guardianSpiritT = 0;
    this.combatDots = {};
    this.combatDotTickT = 0;
    this.petCommandTargetId = null;
    this.petCommandT = this.petCommandPower = 0;
    for (const key of ['warCryT', 'bloodFuryT', 'avatarT', 'arrowHasteT',
      'poisonBladesT', 'sprintT', 'combustionT', 'escapeRushT']) this[key] = 0;
  }

  castSpell(slotIndex, ctx) {
    const id = this.spellSlots[slotIndex];
    const classSkill = id ? classSkillById(id) : null;
    const canCleanseStun = classSkill?.action === 'cleanse';
    if (!id || this.dead || (this.stunT > 0 && !canCleanseStun)) return false;
    if ((this.spellCds[id] || 0) > 0) { audio.sfx('error', 0.35, 300); return false; }
    if (classSkill) {
      if (classSkill.type !== 'active' || !this.hasClassSkill(id)) return false;
      const rank = this.classRank(id);
      if (!this._castClassAbility(classSkill, rank, ctx)) {
        audio.sfx('error', 0.35, 300);
        return false;
      }
      this.spellCds[id] = this.classAbilityCooldown(id);
      audio.sfx('special', 0.45);
      return true;
    }
    const spell = spellById(id);
    if (!spell || !this.spellsOwned.has(id)) return false;
    this.spellCds[id] = spell.cd * (this.spellCdMult || 1);
    audio.sfx('special', 0.45);

    const { enemyMgr } = ctx;
    const spellPower = this.spellPower || 1;
    const spellDuration = this.spellDuration || 1;
    if (!['haste', 'rage', 'heal', 'stoneSkin', 'spiritWard'].includes(id)) this.breakStealth();
    switch (id) {
      case 'haste': this.hasteT = 10 * spellDuration; break;
      case 'rage': this.rageT = 12 * spellDuration; break;
      case 'heal':
        {
          const heal = Math.round(50 * spellPower);
          this.hp = Math.min(this.maxHp, this.hp + heal);
          this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2), `+${heal} ❤️`, '#7fe07f');
        }
        break;
      case 'powerDash':
      case 'stunDash':
        this.dashT = 0.28;
        this.dashDir.copy(this.facing);
        this.dashHit.clear();
        this.dashSpec = id === 'stunDash'
          ? { dmg: 30 * spellPower, stun: 3 * spellDuration }
          : { dmg: 40 * spellPower, stun: 0 };
        break;
      case 'shockwave':
        for (const e of enemyMgr.alive()) {
          const d = e.pos.distanceTo(this.pos);
          if (d < 6.5) {
            const dir = new THREE.Vector3().subVectors(e.pos, this.pos).normalize();
            e.pos.addScaledVector(dir, 4);
            enemyMgr.damage(e, this.dmgMult * 25 * spellPower, null);
          }
        }
        break;
      case 'frostNova':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 7) enemyMgr.stun(e, 4 * spellDuration);
        }
        break;
      case 'stoneSkin': this.stoneSkinT = 12 * spellDuration; break;
      case 'spiritWard':
        this.spiritWardT = 15 * spellDuration;
        this.poisonT = 0;
        break;
      case 'whirlwind':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) >= 6) continue;
          const dir = new THREE.Vector3().subVectors(e.pos, this.pos).normalize();
          e.pos.addScaledVector(dir, 3);
          enemyMgr.damage(e, this.dmgMult * this.weapon.dmg * 0.75 * spellPower, null);
        }
        break;
      case 'venomRain':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 9) {
            enemyMgr.damage(e, this.dmgMult * 45 * spellPower, null, 'local',
              { poison: { dps: 15 * spellPower, dur: 6 * spellDuration } });
          }
        }
        break;
      case 'blizzard':
        for (const e of enemyMgr.alive()) {
          if (e.pos.distanceTo(this.pos) < 11) {
            enemyMgr.damage(e, this.dmgMult * 120 * spellPower, null);
            enemyMgr.stun(e, 5 * spellDuration);
          }
        }
        break;
    }
    return true;
  }

  _findClassTarget(enemyMgr, aimPoint, range = 12) {
    const list = enemyMgr?.alive?.() || [];
    const point = aimPoint || this.pos.clone().addScaledVector(this.facing, range);
    return list
      .filter(e => !e.dying && e.pos && e.pos.distanceTo(this.pos) <= range + (e.hitR || 0))
      .map(e => ({ e, score: Math.hypot(e.pos.x - point.x, e.pos.z - point.z) }))
      .sort((a, b) => a.score - b.score)[0]?.e || null;
  }

  _classAimPoint(aimPoint, maxRange = 18, useFacing = false) {
    const out = useFacing
      ? this.pos.clone().addScaledVector(this.facing, maxRange)
      : aimPoint?.clone?.() || this.pos.clone().addScaledVector(this.facing, maxRange);
    out.y = 0;
    const dx = out.x - this.pos.x, dz = out.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > maxRange) {
      out.x = this.pos.x + dx / dist * maxRange;
      out.z = this.pos.z + dz / dist * maxRange;
    }
    return out;
  }

  _isBehind(enemy) {
    const ry = enemy.mesh?.rotation?.y ?? 0;
    const fx = -Math.sin(ry), fz = -Math.cos(ry);
    const dx = this.pos.x - enemy.pos.x, dz = this.pos.z - enemy.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    return fx * dx / len + fz * dz / len < -0.35;
  }

  _classWeaponDamage(enemy, mult = 1, forceBackstab = false) {
    let damage = this.weapon.dmg * mult * this.dmgMult;
    if ((enemy.hp || 0) / Math.max(1, enemy.maxHp || 1) < 0.35) {
      damage *= 1 + (this.classEffects.executeDmg || 0);
    }
    if ((forceBackstab || this._isBehind(enemy)) && this.classEffects.backstab) {
      damage *= 1 + this.classEffects.backstab;
    }
    return damage;
  }

  _classMagicMultiplier(element = null) {
    let mult = 1 + (this.classEffects.spellPower || 0);
    const fire = (this.classEffects.firePower || 0)
      + (this.combustionT > 0 ? this.combustionPower : 0);
    const frost = this.classEffects.frostPower || 0;
    if (element === 'fire') mult *= 1 + fire;
    if (element === 'frost') mult *= 1 + frost;
    // Elemental Storm is half fire and half frost, so both mastery paths
    // contribute without either one being counted twice.
    if (element === 'elemental') mult *= 1 + (fire + frost) * 0.5;
    if (element === 'holy') mult *= 1 + (this.classEffects.holyPower || 0);
    return mult;
  }

  _classMagicDamage(base, element = null) {
    const amount = base * this._classMagicMultiplier(element);
    const crit = Math.random() < (this.classEffects.spellCrit || 0);
    return { amount: amount * (crit ? CRIT_MULT : 1), crit };
  }

  _classBurnDamage(base) {
    return base * this._classMagicMultiplier('fire');
  }

  _classHeal(base, target = this) {
    let amount = base * (1 + (this.classEffects.healPower || 0));
    if ((target?.hp ?? target?.maxHp ?? 1) / Math.max(1, target?.maxHp || 1) < 0.5) {
      amount *= 1 + (this.classEffects.lowHpHeal || 0);
    }
    return Math.round(amount);
  }

  _castClassAbility(skill, rank, ctx) {
    const enemyMgr = ctx.enemyMgr;
    const rv = (key, fallback = 0) => rankValue(skill, key, rank, fallback);
    const bowSkills = new Set(['beast_arrow_haste', 'beast_ten_arrows', 'beast_arrow_rain',
      'beast_piercing_shot', 'beast_explosive_arrow']);
    if (bowSkills.has(skill.id) && this.weapon.kind !== 'bow') {
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        'Equip a bow or crossbow first', '#ffcc66');
      return false;
    }
    const target = () => {
      const range = rv('range', 12);
      const targetAim = ctx.rpgView
        ? this.pos.clone().addScaledVector(this.facing, range) : ctx.aimPoint;
      return this._findClassTarget(enemyMgr, targetAim, range);
    };
    const damageTarget = (enemy, amount, opts = null) => {
      if (!enemy) return false;
      enemyMgr.damage(enemy, amount, this.facing, 'local', opts);
      if (skill.classId === 'warrior' && Math.random() < (this.classEffects.staggerChance || 0)) {
        enemyMgr.stun?.(enemy, 0.8);
      }
      return true;
    };
    const hostile = !['buff', 'stealth', 'evade', 'shield', 'heal', 'hot', 'cleanse', 'guardian', 'world'].includes(skill.action)
      || ['trap', 'trapField', 'petCommand'].includes(skill.worldAction);

    if (skill.action === 'target' || skill.action === 'execute') {
      const enemy = target();
      if (!enemy) return false;
      if (skill.action === 'execute' && enemy.hp / Math.max(1, enemy.maxHp) > skill.threshold) {
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
          `Target must be below ${Math.round(skill.threshold * 100)}% health`, '#ffcc66');
        return false;
      }
      const opts = {};
      if (skill.bleedPct) opts.rend = {
        dps: enemy.maxHp * rv('bleedPct') / Math.max(1, skill.bleedDur), dur: skill.bleedDur,
      };
      if (skill.poison) opts.poison = { dps: rv('poison') * (1 + (this.classEffects.poisonPower || 0)), dur: 6 };
      let amount = this._classWeaponDamage(enemy, rv('weaponMult', 1));
      if (skill.backstab && this._isBehind(enemy)) amount *= 1.35 + rank * 0.15;
      const ok = damageTarget(enemy, amount, opts);
      if (skill.stun) enemyMgr.stun?.(enemy, rv('stun'));
      if (skill.bleedPct) this.hooks.popup(enemy.mesh.position.clone().setY(enemy.mesh.position.y + 2),
        `🩸 ${Math.round(rv('bleedPct') * 100)}% bleed / 30s`, '#ff6b68', 'big');
      if (hostile) this.breakStealth();
      return ok;
    }

    if (skill.action === 'buff') {
      const duration = rv('duration');
      const power = rv('power');
      const field = {
        warCry: ['warCryT', 'warCryPower'], bloodFury: ['bloodFuryT', 'bloodFuryPower'],
        avatar: ['avatarT', 'avatarPower'], arrowHaste: ['arrowHasteT', 'arrowHastePower'],
        poisonBlades: ['poisonBladesT', 'poisonBladesPower'], sprint: ['sprintT', 'sprintPower'],
        combustion: ['combustionT', 'combustionPower'],
      }[skill.buff];
      if (!field) return false;
      this[field[0]] = duration;
      this[field[1]] = power;
      if (skill.buff === 'avatar') this.classShield = Math.max(this.classShield, this.maxHp * power);
      return true;
    }

    if (skill.action === 'aoe' || skill.action === 'magicAoe' || skill.action === 'holyNova') {
      const radius = rv('radius', 5) * (skill.action === 'holyNova'
        ? 1 + (this.classEffects.healRadius || 0)
        : skill.element === 'fire' ? 1 + (this.classEffects.fireRadius || 0)
          : skill.element === 'frost' ? 1 + (this.classEffects.frostRadius || 0) : 1);
      let hits = 0;
      for (const enemy of enemyMgr?.alive?.() || []) {
        if (enemy.pos.distanceTo(this.pos) > radius + (enemy.hitR || 0)) continue;
        const result = skill.damage
          ? this._classMagicDamage(rv('damage'), skill.action === 'holyNova' ? 'holy' : skill.element)
          : { amount: this._classWeaponDamage(enemy, rv('weaponMult', 1)), crit: false };
        const opts = {
          ...(result.crit ? { crit: true } : {}),
          ...(skill.poison
            ? { poison: { dps: rv('poison') * (1 + (this.classEffects.poisonPower || 0)), dur: 6 } }
            : {}),
        };
        damageTarget(enemy, result.amount, Object.keys(opts).length ? opts : null);
        if (skill.stun) enemyMgr.stun?.(enemy, rv('stun'));
        hits++;
      }
      if (skill.action === 'holyNova') this._healSelf(this._classHeal(rv('amount')));
      this._spawnClassRing(this.pos, radius, skill.element === 'frost' ? 0x75cfff : 0xffc85a);
      if (hostile) this.breakStealth();
      return true;
    }

    if (skill.action === 'cone' || skill.action === 'magicCone') {
      const range = rv('range', 7) * (skill.element === 'fire'
        ? 1 + (this.classEffects.fireRadius || 0)
        : skill.element === 'frost' ? 1 + (this.classEffects.frostRadius || 0) : 1);
      let hits = 0;
      for (const enemy of enemyMgr?.alive?.() || []) {
        if (!this._inArc(enemy.pos.x, enemy.pos.z, range, enemy.hitR || 0, 0.15)) continue;
        const result = skill.damage
          ? this._classMagicDamage(rv('damage'), skill.element)
          : { amount: this._classWeaponDamage(enemy, rv('weaponMult', 1)) };
        const opts = skill.burn ? { burn: { dps: skill.element === 'fire'
          ? this._classBurnDamage(rv('burn')) : rv('burn'), dur: 6 } } : null;
        damageTarget(enemy, result.amount, opts);
        hits++;
      }
      this.breakStealth();
      return true;
    }

    if (skill.action === 'dash') {
      this.dashT = rv('distance', 8) / 34;
      this.dashDir.copy(this.facing);
      this.dashHit.clear();
      this.dashSpec = { dmg: this.weapon.dmg * rv('weaponMult', 1), stun: rv('stun'),
        staggerChance: skill.classId === 'warrior' ? (this.classEffects.staggerChance || 0) : 0 };
      this.breakStealth();
      return true;
    }

    if (skill.action === 'multishot') {
      if (!ctx.projectiles || this.weapon.kind !== 'bow') {
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
          'Equip a bow or crossbow first', '#ffcc66');
        return false;
      }
      const count = rv('count', 1), spread = rv('spread', 0), speed = this.weapon.style === 'crossbow' ? 31 : 26;
      const origin = this.pos.clone().addScaledVector(this.facing, 0.6).setY(this.mesh.position.y + 1.1);
      for (let i = 0; i < count; i++) {
        const crit = Math.random() < this.critChance + (this.bowCritBonus || 0);
        const angle = count <= 1 ? 0 : -spread / 2 + spread * i / (count - 1);
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const dir = new THREE.Vector3(
          this.facing.x * cos + this.facing.z * sin, 0,
          -this.facing.x * sin + this.facing.z * cos,
        ).normalize();
        ctx.projectiles.spawnArrow(origin, dir, {
          dmg: this.weapon.dmg * rv('weaponMult', 1) * this.dmgMult * (crit ? CRIT_MULT : 1),
          crit,
          pierce: !!skill.pierce, speed, life: this.weapon.range / speed,
          effects: this.classEffects.arrowBleed
            ? { bleed: { dps: this.weapon.dmg * this.classEffects.arrowBleed, dur: 5 } } : null,
        });
      }
      this.breakStealth();
      return true;
    }

    if (skill.action === 'zone') {
      const castRange = rv('castRange', 18);
      const at = this._classAimPoint(ctx.aimPoint, castRange, !!ctx.rpgView);
      this._addClassZone(skill, rank, at);
      if (skill.zone !== 'healing' && skill.zone !== 'smoke') this.breakStealth();
      return true;
    }

    if (skill.action === 'zoneBurst') {
      const castRange = rv('castRange', 18);
      const at = this._classAimPoint(ctx.aimPoint, castRange, !!ctx.rpgView);
      const radius = rv('radius', 4) * (skill.element === 'fire'
        ? 1 + (this.classEffects.fireRadius || 0)
        : skill.element === 'frost' ? 1 + (this.classEffects.frostRadius || 0) : 1);
      let hits = 0;
      for (const enemy of enemyMgr?.alive?.() || []) {
        if (enemy.pos.distanceTo(at) > radius + (enemy.hitR || 0)) continue;
        let result = skill.damage
          ? this._classMagicDamage(rv('damage'), skill.element)
          : { amount: this._classWeaponDamage(enemy, rv('weaponMult', 1)) };
        if (skill.classId === 'beastmaster') {
          const crit = Math.random() < this.critChance + (this.bowCritBonus || 0);
          result = { amount: result.amount * (crit ? CRIT_MULT : 1), crit };
        }
        const opts = {
          ...(result.crit ? { crit: true } : {}),
          ...(skill.burn ? { burn: { dps: skill.element === 'fire'
            ? this._classBurnDamage(rv('burn')) : rv('burn'), dur: 6 } } : {}),
          ...(skill.classId === 'beastmaster' && this.classEffects.arrowBleed
            ? { bleed: { dps: this.weapon.dmg * this.classEffects.arrowBleed, dur: 5 } } : {}),
        };
        damageTarget(enemy, result.amount, Object.keys(opts).length ? opts : null);
        hits++;
      }
      this._spawnClassRing(at, radius, skill.element === 'fire' || skill.burn ? 0xff6b2f : 0xd9e88a);
      this.breakStealth();
      return true;
    }

    if (skill.action === 'petAoe') {
      if (!this.pet || this.petDead) {
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
          'You need a living animal companion', '#ffcc66');
        return false;
      }
      const radius = rv('radius', 7);
      const petPower = this.pet.classPowerApplied ? 0 : (this.classEffects.petPower || 0);
      const damage = this.pet.dmg * (1 + petPower) * rv('petMult', 3);
      for (const enemy of enemyMgr?.alive?.() || []) {
        if (enemy.pos.distanceTo(this.pos) > radius + (enemy.hitR || 0)) continue;
        damageTarget(enemy, damage);
        if (skill.stun) enemyMgr.stun?.(enemy, rv('stun'));
      }
      this._spawnClassRing(this.pos, radius, 0xd6a94f, 0.9);
      this.breakStealth();
      return true;
    }

    if (skill.action === 'stealth') {
      this.stealthT = rv('duration') + (this.classEffects.stealthDuration || 0);
      this._setStealth(true);
      return true;
    }

    if (skill.action === 'evade') {
      this.evadeT = rv('duration') + (this.classEffects.evadeDuration || 0);
      this._spawnClassRing(this.pos, 2.3, 0x7ee8ff, this.evadeT);
      return true;
    }

    if (skill.action === 'shadowstep') {
      const enemy = target();
      if (!enemy) return false;
      const ry = enemy.mesh?.rotation?.y ?? 0;
      const enemyForward = new THREE.Vector3(-Math.sin(ry), 0, -Math.cos(ry));
      this.pos.copy(enemy.pos).addScaledVector(enemyForward, -1.4);
      this.facing.copy(enemyForward);
      damageTarget(enemy, this._classWeaponDamage(enemy, rv('weaponMult', 1), true));
      this.breakStealth();
      return true;
    }

    if (skill.action === 'magicTarget') {
      const enemy = target();
      if (!enemy) return false;
      const result = this._classMagicDamage(rv('damage'), skill.element);
      const opts = skill.burn
        ? { burn: { dps: skill.element === 'fire' ? this._classBurnDamage(rv('burn')) : rv('burn'), dur: 6 } }
        : null;
      damageTarget(enemy, result.amount, opts);
      if (skill.stun) enemyMgr.stun?.(enemy, rv('stun'));
      this.breakStealth();
      return true;
    }

    if (skill.action === 'shield') {
      this.classShield = Math.max(this.classShield,
        rv('amount') * (1 + (this.classEffects.shieldPower || 0)));
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
        `🛡️ ${Math.round(this.classShield)} shield`, '#8ed8ff');
      return true;
    }

    if (skill.action === 'heal') {
      this._healSelf(this._classHeal(rv('amount')));
      this.hooks.onClassWorldAction?.('healAlly', skill, rank, ctx);
      return true;
    }

    if (skill.action === 'hot') {
      this.hotT = rv('duration');
      this.hotRate = this._classHeal(rv('amount') * (1 + (this.classEffects.hotPower || 0)));
      this.hotTickT = 0;
      return true;
    }

    if (skill.action === 'cleanse') {
      this.poisonT = this.poisonDps = 0;
      this.combatDots = {};
      this.combatDotTickT = 0;
      this.stunT = 0;
      this._healSelf(this._classHeal(rv('amount')));
      return true;
    }

    if (skill.action === 'guardian') {
      this.guardianSpiritT = rv('duration');
      this.guardianSpiritHeal = Math.min(1, rv('amount') * (1 + (this.classEffects.guardianPower || 0)));
      return true;
    }

    if (skill.action === 'world') {
      const used = this.hooks.onClassWorldAction?.(skill.worldAction, skill, rank, ctx) !== false;
      if (used && ['trap', 'trapField', 'petCommand'].includes(skill.worldAction)) this.breakStealth();
      return used;
    }
    return false;
  }

  _healSelf(amount) {
    const actual = Math.max(0, Math.min(this.maxHp - this.hp, Math.round(amount)));
    if (actual <= 0) return 0;
    this.hp += actual;
    this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.2),
      `+${actual} ❤️`, '#7fe07f');
    return actual;
  }

  _setStealth(active) {
    this.stealthed = !!active;
    this.mesh.traverse(part => {
      if (!part.material) return;
      const materials = Array.isArray(part.material) ? part.material : [part.material];
      const changed = materials.map(material => {
        let mat = material;
        if (!mat.userData?.classVisualCopy) {
          mat = material.clone();
          mat.userData.classVisualCopy = true;
          mat.userData.classBaseOpacity = material.opacity ?? 1;
          mat.userData.classBaseTransparent = !!material.transparent;
        }
        const baseOpacity = mat.userData.classBaseOpacity ?? 1;
        mat.transparent = active || !!mat.userData.classBaseTransparent;
        mat.opacity = active ? Math.min(baseOpacity, 0.22) : baseOpacity;
        mat.depthWrite = !active;
        mat.needsUpdate = true;
        return mat;
      });
      part.material = Array.isArray(part.material) ? changed : changed[0];
    });
  }

  breakStealth() {
    this.stealthT = 0;
    if (this.stealthed) this._setStealth(false);
  }

  _zoneColor(kind) {
    return ({ arrows: 0xe7d16f, fire: 0xff6b2f, frost: 0x75cfff, elemental: 0xb58aff,
      smoke: 0x65707d, healing: 0x8ee87f })[kind] || 0xffffff;
  }

  _addClassZone(skill, rank, pos) {
    const rv = (key, fallback = 0) => rankValue(skill, key, rank, fallback);
    let radius = rv('radius', 5);
    if (skill.zone === 'fire') radius *= 1 + (this.classEffects.fireRadius || 0);
    if (skill.zone === 'frost') radius *= 1 + (this.classEffects.frostRadius || 0);
    if (skill.zone === 'elemental') radius *= 1
      + ((this.classEffects.fireRadius || 0) + (this.classEffects.frostRadius || 0)) * 0.5;
    if (skill.zone === 'healing') radius *= 1 + (this.classEffects.healRadius || 0);
    const duration = rv('duration', 8) * (1 + (this.classEffects.zoneDuration || 0));
    const geo = new THREE.RingGeometry(Math.max(0.1, radius - 0.18), radius, 48);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: this._zoneColor(skill.zone), transparent: true, opacity: 0.42,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, this.mesh.position.y + 0.08, pos.z);
    this.scene.add(mesh);
    const castSnapshot = skill.zone === 'arrows' ? {
      weaponDmg: this.weapon.dmg,
      damageMult: this.dmgMult,
      critChance: this.critChance + (this.bowCritBonus || 0),
      bleedDps: this.classEffects.arrowBleed
        ? this.weapon.dmg * this.classEffects.arrowBleed : 0,
    } : null;
    this.classZones.push({ skill, rank, pos: pos.clone(), radius, t: duration,
      duration, tickT: 0, interval: rv('interval', 1), mesh, castSnapshot });
  }

  _removeClassZone(zone) {
    if (!zone?.mesh) return;
    this.scene.remove(zone.mesh);
    zone.mesh.geometry?.dispose?.();
    zone.mesh.material?.dispose?.();
  }

  _updateClassZones(dt, enemyMgr, ctx) {
    for (let i = this.classZones.length - 1; i >= 0; i--) {
      const zone = this.classZones[i];
      zone.t -= dt;
      zone.tickT -= dt;
      zone.mesh.position.y = (ctx.world?.heightAt?.(zone.pos.x, zone.pos.z) ?? this.mesh.position.y) + 0.08;
      zone.mesh.rotation.z += dt * 0.12;
      zone.mesh.material.opacity = 0.22 + 0.2 * Math.abs(Math.sin(zone.t * 3));
      const inside = Math.hypot(this.pos.x - zone.pos.x, this.pos.z - zone.pos.z) <= zone.radius;
      if (zone.skill.zone === 'smoke' && inside) {
        this.stealthT = Math.max(this.stealthT, 0.6);
        this._setStealth(true);
      }
      if (zone.tickT <= 0) {
        zone.tickT = Math.max(0.2, zone.interval);
        const skill = zone.skill;
        const rv = (key, fallback = 0) => rankValue(skill, key, zone.rank, fallback);
        if (skill.zone === 'healing') {
          if (inside) this._healSelf(this._classHeal(rv('amount')));
          this.hooks.onClassWorldAction?.('zoneHeal', skill, zone.rank, { ...ctx, zone });
        } else if (skill.zone !== 'smoke') {
          if (skill.zone === 'arrows') this._spawnArrowRainFx(zone);
          for (const enemy of enemyMgr?.alive?.() || []) {
            if (enemy.pos.distanceTo(zone.pos) > zone.radius + (enemy.hitR || 0)) continue;
            let result;
            if (skill.zone === 'arrows' && zone.castSnapshot) {
              const crit = Math.random() < zone.castSnapshot.critChance;
              result = { amount: zone.castSnapshot.weaponDmg * zone.castSnapshot.damageMult
                * rv('weaponMult', 1) * (crit ? CRIT_MULT : 1), crit };
            } else if (skill.weaponMult) {
              const crit = skill.classId === 'beastmaster'
                && Math.random() < this.critChance + (this.bowCritBonus || 0);
              result = { amount: this._classWeaponDamage(enemy, rv('weaponMult', 1))
                * (crit ? CRIT_MULT : 1), crit };
            } else result = this._classMagicDamage(rv('damage'),
              skill.zone === 'fire' ? 'fire' : skill.zone === 'frost' ? 'frost'
                : skill.zone === 'elemental' ? 'elemental' : null);
            const opts = {
              ...(result.crit ? { crit: true } : {}),
              ...(skill.zone === 'fire'
                ? { burn: { dps: Math.max(2, result.amount * 0.12), dur: 3 } } : {}),
              ...(skill.zone === 'arrows' && zone.castSnapshot?.bleedDps
                ? { bleed: { dps: zone.castSnapshot.bleedDps, dur: 5 } } : {}),
            };
            enemyMgr.damage(enemy, result.amount, null, 'local', Object.keys(opts).length ? opts : null);
            if (skill.zone === 'frost' || skill.zone === 'elemental') {
              enemyMgr.stun?.(enemy, rv('stun', 0.25));
            }
          }
        }
      }
      if (zone.t <= 0) {
        this._removeClassZone(zone);
        this.classZones.splice(i, 1);
      }
    }
  }

  _spawnClassRing(pos, radius, color, life = 0.55) {
    const geo = new THREE.RingGeometry(Math.max(0.1, radius * 0.72), radius, 40);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, this.mesh.position.y + 0.12, pos.z);
    this.scene.add(mesh);
    this.classFx.push({ mesh, t: life, life, kind: 'ring' });
  }

  _spawnArrowRainFx(zone) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * zone.radius;
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5),
        new THREE.MeshBasicMaterial({ color: 0xe8dfb0, transparent: true, opacity: 0.9 }),
      );
      mesh.position.set(zone.pos.x + Math.cos(angle) * radius,
        zone.mesh.position.y + 7 + Math.random() * 3, zone.pos.z + Math.sin(angle) * radius);
      mesh.rotation.z = 0.18;
      this.scene.add(mesh);
      this.classFx.push({ mesh, t: 0.65, life: 0.65, kind: 'fallingArrow' });
    }
  }

  _updateClassFx(dt) {
    for (let i = this.classFx.length - 1; i >= 0; i--) {
      const fx = this.classFx[i];
      fx.t -= dt;
      const k = 1 - Math.max(0, fx.t) / fx.life;
      if (fx.kind === 'fallingArrow') fx.mesh.position.y -= dt * 16;
      else fx.mesh.scale.setScalar(0.65 + k * 0.65);
      fx.mesh.material.opacity = 0.8 * (1 - k);
      if (fx.t > 0) continue;
      this.scene.remove(fx.mesh);
      fx.mesh.geometry?.dispose?.();
      fx.mesh.material?.dispose?.();
      this.classFx.splice(i, 1);
    }
  }

  // ---------- derived stats ----------
  recompute() {
    const equipped = (slot) => itemById(this.equipment[slot]);
    const oldMax = this.maxHp || 100;
    this.classEffects = classEffectsFor(this.selectedClass, this.classTraining);
    this.gearMult = 1 + 0.1 * (this.forgeTier || 0);
    let hp = 100 + (this.level - 1) * 10 + (this.shrineBonus || 0)
      + (this.upgrades.questHp || 0), speedAdd = 0;
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = equipped(slot);
      if (it?.stats?.hp) hp += it.stats.hp * this.gearMult;
      if (it?.stats?.speed) speedAdd += it.stats.speed;
    }
    hp = (hp + (this.campBonus || 0)) * (1 + (this.classEffects.hpPct || 0));
    this.maxHp = Math.round(hp);
    if (this.maxHp > oldMax) this.hp += this.maxHp - oldMax;
    this.hp = Math.min(this.hp, this.maxHp);
    // every level keeps granting +10 hp, +0.1 speed and +0.1 regen; weapon
    // power gains +1% per level while attack-speed growth softens after Lv14
    const lvl = this.level - 1;
    this.speed = 5.5 + 0.1 * lvl + speedAdd + (this.upgrades.trailblazer || 0) * 0.2
      + (this.classEffects.speed || 0);
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
    if (base.kind === 'bow') {
      this.weapon.dmg *= 1 + (this.classEffects.rangedDmg || 0);
      this.weapon.cd *= Math.max(0.35, 1 - (this.classEffects.rangedSpeed || 0));
    } else {
      this.weapon.dmg *= 1 + (this.classEffects.meleeDmg || 0);
      this.weapon.cd *= Math.max(0.35, 1 - (this.classEffects.meleeSpeed || 0));
    }
    if (this.upgrades.questPower) this.weapon.dmg *= 1 + this.upgrades.questPower * 0.03;
    this.shield = equipped('offhand')?.shield || null;
    this.canBlock = !!this.shield || !!this.weapon.parry;
    this.critChance = CRIT_CHANCE + (this.upgrades.hunterResident ? 0.04 : 0)
      + (base.kind === 'bow' ? 0 : (this.classEffects.meleeCrit || 0));
    this.bowCritBonus = this.classEffects.rangedCrit || 0;
    this.weakPointBonus = this.classEffects.rangedCrit ? 0.2 : 0;
    this.blockBonus = this.classEffects.blockBonus || 0;
    this.meleeArcBonus = this.classEffects.arcBonus || 0;
    // Class recovery/power passives affect only the abilities in that class
    // tree; legacy world spells remain neutral and available to every class.
    this.spellCdMult = 1;
    this.essenceMult = 1 + (this.classEffects.essenceMult || 0);
    this.meatMult = 1 + (this.classEffects.meatMult || 0);
    this.spellPower = 1;
    this.spellDuration = 1;
    this.gatherMult = 1 + 0.15 * s.gather;
    // expedition gear: each comfort lives in its own slot now (no more flags)
    this.torchGear = equipped('offhand')?.torch || null;   // { radius } while a torch is in hand
    this.dmgCut = Math.min(0.8, (equipped('underlayer')?.dmgCut || 0)
      + (this.classEffects.damageCut || 0));               // gear + class mitigation
    this.poisonCut = Math.min(0.9, (equipped('underlayer')?.poisonCut || 0)
      + (this.classEffects.poisonCut || 0));
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
    const comp = (this.hooks.classRulesEnabled?.() === false || this.selectedClass === 'beastmaster')
      ? equipped('companion') : null;
    const petBase = comp?.pet;
    const petPower = this.classEffects.petPower || 0;
    this.pet = petBase
      ? { dmg: petBase.dmg * (1 + 0.25 * s.pet) * (1 + 0.03 * this.level) * this.gearMult * (1 + petPower),
          maxHp: Math.round((100 + 100 * s.pet + 50 * Math.floor(this.level / 2)) * this.gearMult * (1 + petPower)),
          classPowerApplied: true }
      : null;
    const orbBase = comp?.orb;
    this.orb = orbBase
      ? { ...orbBase, dmg: orbBase.dmg * (1 + 0.05 * s.power) * this.gearMult * (1 + petPower) }
      : null;

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
    if (this.evadeT > 0) return;
    sec *= Math.max(0.1, 1 - (this.classEffects.stunResist || 0));
    this.stunT = Math.max(this.stunT, sec);
    this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.3), '⚡ Stunned!', '#ffe94a');
    this.hooks.onHurt?.();
  }

  get dmgMult() {
    let mult = this.rageT > 0 ? 1.5 : 1;
    if (this.warCryT > 0) mult *= 1 + this.warCryPower;
    if (this.avatarT > 0) mult *= 1 + this.avatarPower;
    return mult;
  }

  get cdMult() {
    let mult = this.hasteT > 0 ? 0.5 : 1;
    if (this.weapon?.kind === 'bow' && this.arrowHasteT > 0) mult *= Math.max(0.2, 1 - this.arrowHastePower);
    if (this.weapon?.kind !== 'bow' && this.bloodFuryT > 0) mult *= Math.max(0.35, 1 - this.bloodFuryPower);
    return mult;
  }

  get moveSpeedBonus() {
    return (this.sprintT > 0 ? this.sprintPower : 0)
      + (this.escapeRushT > 0 ? (this.classEffects.hurtSpeed || 0) * 5 : 0);
  }

  get activeDamageCut() {
    let cut = 0;
    if (this.warCryT > 0) cut += this.warCryPower * 0.5;
    if (this.avatarT > 0) cut += this.avatarPower * 0.45;
    return Math.min(0.65, cut);
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
    if (this.evadeT > 0) {
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.1), 'EVADE', '#7ee8ff', 'big');
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
      const reduction = Math.min(0.9, (this.shield?.block ?? 0.35) + (this.blockBonus || 0));
      dmg *= 1 - reduction;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.15),
        `🛡️ blocked ${Math.round(reduction * 100)}%`, '#9fd7ff');
      audio.sfx('base_hit', 0.35, 120);
    }
    if (this.dmgCut) dmg *= 1 - this.dmgCut; // quilted wool lining soaks a bit of everything
    if (this.activeDamageCut) dmg *= 1 - this.activeDamageCut;
    if (this.stoneSkinT > 0) dmg *= 0.6;
    if (this.spiritWardT > 0) dmg *= 0.7;
    if (this.classShield > 0) {
      const absorbed = Math.min(this.classShield, dmg);
      this.classShield -= absorbed;
      dmg -= absorbed;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.1),
        `🛡️ ${Math.round(absorbed)} absorbed`, '#8ed8ff');
      if (dmg <= 0.01) return;
    }
    this.breakStealth();
    this.hurtT = 0;
    if (this.classEffects.hurtSpeed) this.escapeRushT = 3;
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
      if (this.guardianSpiritT > 0) {
        this.guardianSpiritT = 0;
        this.hp = Math.min(this.maxHp, Math.max(1, Math.round(this.maxHp * this.guardianSpiritHeal)));
        this.poisonT = this.poisonDps = 0;
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.35),
          `👼 Guardian Spirit +${this.hp} ❤️`, '#fff0a5', 'big');
        audio.sfx('evolve', 0.55);
        return;
      }
      this.hp = 0;
      this.dead = true;
      this.hooks.onDeath();
    }
  }

  applyCombatDot(kind, dps, duration, src = null) {
    if (this.dead || !(dps > 0) || !(duration > 0)) return false;
    if (kind === 'poison') dps *= Math.max(0, 1 - (this.poisonCut || 0));
    if (!(dps > 0)) return false;
    const current = this.combatDots[kind];
    const currentDamage = (current?.t || 0) * (current?.dps || 0);
    const newDamage = duration * dps;
    if (!current || newDamage >= currentDamage) {
      this.combatDots[kind] = { t: duration, dps, src };
      this.combatDotTickT = 0;
    }
    return true;
  }

  _updateCombatDots(dt) {
    const icons = { bleed: '🩸', rend: '🩸', burn: '🔥', poison: '☠️' };
    let damage = 0, shownDps = 0, lastSrc = null;
    const activeIcons = [];
    for (const [kind, dot] of Object.entries(this.combatDots)) {
      if (!(dot.t > 0) || !(dot.dps > 0)) { delete this.combatDots[kind]; continue; }
      const activeDt = Math.min(dt, dot.t);
      dot.t = Math.max(0, dot.t - dt);
      damage += dot.dps * activeDt;
      shownDps += dot.dps;
      lastSrc = dot.src || lastSrc;
      activeIcons.push(icons[kind] || '•');
      if (dot.t <= 0) delete this.combatDots[kind];
    }
    if (!(damage > 0)) return false;
    this.hp -= damage;
    this.combatDotTickT -= dt;
    if (this.combatDotTickT <= 0) {
      this.combatDotTickT = 1;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2),
        `-${Math.max(1, Math.round(shownDps))} ${activeIcons.join('')}`, '#ff6b68');
    }
    if (lastSrc?.name) this.killedBy = lastSrc.name;
    if (this.hp > 0) return false;
    if (this.guardianSpiritT > 0) {
      this.guardianSpiritT = 0;
      this.hp = Math.min(this.maxHp, Math.max(1, Math.round(this.maxHp * this.guardianSpiritHeal)));
      this.combatDots = {};
      this.combatDotTickT = 0;
      this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.35),
        `👼 Guardian Spirit +${this.hp} ❤️`, '#fff0a5', 'big');
      audio.sfx('evolve', 0.55);
      return false;
    }
    this.hp = 0;
    this.dead = true;
    this.hooks.onDeath();
    return true;
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
    this._updateClassFx(dt);
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
    this.evadeT = Math.max(0, this.evadeT - dt);
    this.guardianSpiritT = Math.max(0, this.guardianSpiritT - dt);
    this.escapeRushT = Math.max(0, this.escapeRushT - dt);
    for (const key of ['warCryT', 'bloodFuryT', 'avatarT', 'arrowHasteT',
      'poisonBladesT', 'sprintT', 'combustionT']) this[key] = Math.max(0, this[key] - dt);
    this.stealthT = Math.max(0, this.stealthT - dt);
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
    if (this.hotT > 0) {
      this.hotT = Math.max(0, this.hotT - dt);
      this.hotTickT -= dt;
      if (this.hotTickT <= 0) {
        this.hotTickT = 1;
        this._healSelf(this.hotRate);
      }
    }
    this._updateClassZones(dt, enemyMgr, ctx);
    this._setStealth(this.stealthT > 0);
    if (this._updateCombatDots(dt)) return;

    // poison ticks in whole numbers once a second so the popups stay readable
    if (this.poisonT > 0) {
      this.poisonT -= dt;
      this.poisonTickT -= dt;
      if (this.poisonTickT <= 0) {
        this.poisonTickT = 1;
        this.hp -= this.poisonDps;
        this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 1.9), `-${this.poisonDps} ☠️`, '#8aff3a');
        if (this.hp <= 0 && this.guardianSpiritT > 0) {
          this.guardianSpiritT = 0;
          this.hp = Math.min(this.maxHp, Math.max(1, Math.round(this.maxHp * this.guardianSpiritHeal)));
          this.poisonT = this.poisonDps = 0;
          this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y + 2.35),
            `👼 Guardian Spirit +${this.hp} ❤️`, '#fff0a5', 'big');
        } else if (this.hp <= 0) {
          this.hp = 0; this.dead = true; this.hooks.onDeath(); return;
        }
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
    const wantsBlock = input.block && this.canBlock && !this.charging && this.dashT <= 0;
    if (wantsBlock && !this.blocking) this.parryT = 0.22;
    this.blocking = wantsBlock;

    // -- dash overrides normal movement --
    let moving = false;
    this.moveDir = null; // world-space walk direction this frame (auto camera rotate)
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.pos.addScaledVector(this.dashDir, 34 * dt);
      world.collide(this.pos, 0.45, { boat: ctx.boat });
      this._applyBounds(ctx);
      for (const e of enemyMgr.alive()) {
        if (this.dashHit.has(e.id)) continue;
        if (e.pos.distanceTo(this.pos) < 1.7 + e.hitR) {
          this.dashHit.add(e.id);
          if (this.dashSpec.stun) enemyMgr.stun(e, this.dashSpec.stun);
          if (Math.random() < (this.dashSpec.staggerChance || 0)) enemyMgr.stun?.(e, 0.8);
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
        const speed = (this.speed + this.moveSpeedBonus + mountBonus) * terrainMult
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

    // -- attack with the equipped weapon: hold the attack button (LMB, or RMB in
    // top-down view) to auto-swing repeatedly at the weapon's normal cadence.
    // There is no charge-up — every hit lands at full, immediate strength. --
    this.attackCd -= dt;
    input.takeLeftPressed();          // consume edge state (charging removed)
    input.takeLeftReleased();
    const wantAttack = input.mouse.left || input.quickAttack;
    if (wantAttack && this.attackCd <= 0 && this.dashT <= 0 && !this.blocking) {
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
    this.clearClassCombatState();
    this.hp = Math.max(1, Math.round(this.maxHp * hpFrac));
    this.stunT = 0;
    this.dashT = 0;
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
    this.breakStealth();
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

    const baseArcDot = w.style === 'axe' ? 0.22 : w.style === 'spear' || w.style === 'pick' ? 0.76 : 0.5;
    const arcDot = Math.max(-0.1, baseArcDot - (this.meleeArcBonus || 0));
    const baseCrit = Math.random() < this.critChance;
    for (const e of enemyMgr.alive()) {
      if (this._inArc(e.pos.x, e.pos.z, w.range + (moving ? 0.25 : 0), e.hitR, arcDot)) {
        const weakPoint = this._hitsWeakPoint(e, charge);
        const crit = baseCrit || weakPoint;
        const armored = (e.armor ?? (/golem|snapper|colossus/i.test(e.type) ? 0.3 : 0)) > 0;
        const armorMult = armored && w.armoredBonus ? w.armoredBonus : 1;
        const dmg = this._classWeaponDamage(e, impactMult) * armorMult * (crit ? CRIT_MULT : 1);
        const poisonActive = this.poisonBladesT > 0
          ? 4 * this.poisonBladesPower * (1 + (this.classEffects.poisonPower || 0))
          : this.venomT > 0 ? 4 * (1 + (this.classEffects.poisonPower || 0)) : 0;
        const opts = {
          crit, weakPoint,
          ...(w.armorPierce ? { armorPierce: w.armorPierce } : {}),
          ...(w.armorBreak ? { armorBreak: w.armorBreak * (0.7 + charge * 0.6), breakDur: 6 } : {}),
          ...(w.bleed ? { bleed: { dps: w.bleed * (0.75 + charge * 0.6), dur: 4 } } : {}),
          ...(w.burn ? { burn: { dps: w.burn * (0.7 + charge * 0.5), dur: 4 } } : {}),
          ...(poisonActive ? { poison: { dps: poisonActive, dur: 5 } } : {}),
        };
        enemyMgr.damage(e, dmg, this.facing, 'local', opts);
        if (this.bloodFuryT > 0) this._healSelf(dmg * this.bloodFuryPower);
        if (Math.random() < (this.classEffects.staggerChance || 0)) enemyMgr.stun?.(e, 0.8);
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
    this.breakStealth();
    const crossbow = w.style === 'crossbow';
    const charged = charge >= 0.42;
    this.attackCd = w.cd * this.cdMult * (mounted ? 1.2 : 1);
    this.attackDur = 0.25;
    this.attackT = 0.25;
    audio.sfx('attack_ranged', 0.4);
    const speed = crossbow ? 31 : 23 + charge * 9;
    const weakPoint = !crossbow && charge >= 0.78;
    const crit = weakPoint || Math.random() < this.critChance + (this.bowCritBonus || 0);
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
    if (this.classEffects.arrowBleed) {
      const passiveBleed = w.dmg * this.classEffects.arrowBleed;
      effects.bleed = { dps: Math.max(effects.bleed?.dps || 0, passiveBleed), dur: 5 };
    }
    const origin = this.pos.clone().add(this.facing.clone().multiplyScalar(0.6))
      .setY(this.mesh.position.y + 1.1 + (mounted ? 0.9 : 0));
    projectiles.spawnArrow(origin, this.facing.clone(), {
      dmg: this.dmgMult * w.dmg * drawMult * mountMult
        * (crit ? CRIT_MULT + (weakPoint ? (this.weakPointBonus || 0) : 0) : 1),
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
      eq: { ...this.equipment }, items: [...this.invItems], spells: [...this.spellSlots],
      classId: this.selectedClass, classTraining: { ...this.classTraining }, stealthed: this.stealthed,
    };
  }
}
