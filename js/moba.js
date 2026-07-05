// ==========================================================================
// MOBA mode — units (creeps, neutrals, towers, bases), buildings, wave clock,
// jungle camps and the singleplayer AI opponent.
//
// The player fights through the SAME combat seam as survival: hostileMgr()
// implements { alive(), damage(), stun() }, so melee, arrows, spells and
// companions all work unchanged.
// ==========================================================================

import * as THREE from 'three';
import { MOBA, CREEP_TYPES, DEN_WAVES, MOBA_BUILDINGS, MOBA_AI_TIMELINE,
         ENEMY_TYPES, meatForHp, roundResource } from './config.js';
import { lanePoint } from './mobaworld.js';
import { makeEnemyMesh, makeWolf, makeMobaTower, makeMobaBase, makeDenHut,
         makeSmallHut, makeTeamFlag, TEAM_COLORS } from './models.js';
import { audio } from './audio.js';

let nextUnitId = 1;
const LANES = ['mid', 'top', 'bot'];
const BASE_BLOCK_R = 9.5;
const otherTeam = (t) => (t === 'player' ? 'enemy' : 'player');

function newTeamState() {
  return { dens: { mid: 0, top: 0, bot: 0 }, towers: { mid: 0, top: 0, bot: 0 },
           forge: 0, lodge: 0, walls: 0 };
}

export class Moba {
  // hooks: { popup(pos,text,color), onEnd(playerWon), discover(type),
  //          rewardLocal(xp, meat, pos), rewardPartner(xp, meat, pos)|null,
  //          onBuilt(team,id,lane) }
  constructor(scene, world, player, projectiles, pickups, ui, hooks) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.projectiles = projectiles;
    this.pickups = pickups;
    this.ui = ui;
    this.hooks = hooks;

    this.teams = { player: newTeamState(), enemy: newTeamState() };
    this.units = [];
    this.time = 0;
    this.waveT = 8;                 // first wave check soon after dens exist
    this.incomeT = 10;
    this.aiDone = new Set();
    this.aiEnabled = true;          // multiplayer turns the scripted AI off
    this.heroes = [];               // set each frame by main/multiplayer

    world.obstacles = [];           // building collision circles

    // bases
    this.bases = {};
    for (const team of ['player', 'enemy']) {
      const bp = MOBA.basePos[team];
      const mesh = makeMobaBase(TEAM_COLORS[team]);
      const u = this._makeUnit({
        kind: 'base', team, type: 'base', mesh,
        x: bp.x, z: bp.z, hp: MOBA.baseHp, dmg: 0, speed: 0, range: 0, hitR: MOBA.baseR,
      });
      this.bases[team] = u;
      world.obstacles.push({ x: bp.x, z: bp.z, r: BASE_BLOCK_R });
      world.safeZones.push({ x: bp.x, z: bp.z, r: MOBA.baseR, team });
    }

    // jungle camps
    this.camps = MOBA.camps.map(c => ({ cfg: c, unitIds: [], respawnT: 0 }));
    for (const camp of this.camps) this._spawnCamp(camp);

    // building visual slots around each base (forge/lodge/walls huts)
    this._hutCount = { player: 0, enemy: 0 };
  }

  // ---------- unit factory ----------
  _makeUnit({ kind, team, type, mesh, x, z, hp, dmg, speed, range, hitR, cd = 1, xp = 0, meat = 0, lane = null, camp = null, cfg = null }) {
    const u = {
      id: nextUnitId++, kind, team, type, cfg,
      pos: new THREE.Vector3(x, 0, z),
      mesh, hp, maxHp: hp, dmg, speed, range, hitR, attackCd: 0, atkInterval: cd,
      xp, meat, lane, wp: 0, camp, stunT: 0, dying: 0, walkT: Math.random() * 10,
      lastHitBy: null, spellT: 2,
    };
    mesh.position.set(x, this.world.heightAt(x, z), z);
    this.scene.add(mesh); // every unit is visible in the world
    this.units.push(u);
    if (kind !== 'base') this._addHpTracker(u);
    else this._addHpTracker(u, 3.5, 64);
    return u;
  }

  _addHpTracker(u, yOff = null, width = null) {
    const y = yOff ?? (u.kind === 'tower' ? 5.4 : 1.9);
    this.ui.addTracker('mu' + u.id,
      () => u.mesh.parent && !u.dying ? u.mesh.position.clone().setY(u.mesh.position.y + y) : null,
      `<div class="hpbar"${width ? ` style="width:${width}px"` : ''}><div class="hpbar-fill"></div></div>`, 'hpwrap',
      (el) => {
        const pct = Math.max(0, u.hp / u.maxHp);
        const fill = el.firstChild.firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = u.team === 'player' ? '#5fa8e0' : u.team === 'enemy' ? '#e05050' : '#e0c040';
      });
  }

  _spawnCamp(camp) {
    camp.unitIds = [];
    for (let i = 0; i < camp.cfg.types.length; i++) {
      const type = camp.cfg.types[i];
      const cfg = ENEMY_TYPES[type];
      const a = (i / camp.cfg.types.length) * Math.PI * 2;
      const u = this._makeUnit({
        kind: 'neutral', team: 'neutral', type, cfg,
        mesh: makeEnemyMesh(type),
        x: camp.cfg.x + Math.cos(a) * 2, z: camp.cfg.z + Math.sin(a) * 2,
        hp: cfg.hp * 1.4, dmg: (cfg.meleeDmg ?? cfg.dmg), speed: cfg.speed,
        range: cfg.range, hitR: cfg.hitR, cd: cfg.attackCd,
        xp: cfg.xp, meat: meatForHp(cfg.hp * 1.4), camp,
      });
      camp.unitIds.push(u.id);
      this.hooks.discover?.(type);
    }
  }

  _spawnCreep(team, lane, type) {
    const t = this.teams[team];
    const c = CREEP_TYPES[type];
    const forge = 1 + 0.15 * t.forge;
    const start = lanePoint(lane, team === 'player' ? 0.04 : 0.96);
    // player wolves use the tame (brown) skin so the teams read instantly
    const mesh = team === 'player' && type === 'wolf' ? makeWolf('tame') : makeEnemyMesh(type);
    const flag = makeTeamFlag(TEAM_COLORS[team]);
    flag.position.set(0, type === 'bear' ? 1.4 : 1.0, 0.3);
    mesh.add(flag);
    this._makeUnit({
      kind: 'creep', team, type, mesh,
      x: start.x + (Math.random() - 0.5) * 2, z: start.z + (Math.random() - 0.5) * 2,
      hp: c.hp * forge, dmg: c.dmg * forge, speed: c.speed,
      range: c.range, hitR: c.hitR, cd: c.cd, xp: c.xp, meat: meatForHp(c.hp * forge), lane,
    });
  }

  // ---------- building ----------
  buildingInfo(team, id, lane) {
    const t = this.teams[team];
    const def = MOBA_BUILDINGS.find(b => b.id === id);
    const level = id === 'den' ? t.dens[lane] : id === 'tower' ? t.towers[lane] : t[id];
    return { def, level, maxed: level >= def.max, cost: level >= def.max ? null : def.cost(level + 1) };
  }

  build(team, id, lane = null) {
    const info = this.buildingInfo(team, id, lane);
    if (info.maxed) return false;
    const t = this.teams[team];
    const color = TEAM_COLORS[team];
    const bp = MOBA.basePos[team];

    if (id === 'den') {
      t.dens[lane]++;
      if (t.dens[lane] === 1) {
        // hut at the base edge facing its lane
        const p = lanePoint(lane, team === 'player' ? 0.03 : 0.97);
        const mesh = makeDenHut(color);
        mesh.position.set(p.x, this.world.heightAt(p.x, p.z), p.z);
        this.scene.add(mesh);
        this.world.obstacles.push({ x: p.x, z: p.z, r: 1.6 });
      }
    } else if (id === 'tower') {
      const n = t.towers[lane]++;
      const frac = MOBA.towerSlotsT[n];
      const p = lanePoint(lane, team === 'player' ? frac : 1 - frac);
      // offset slightly off the lane so creeps can pass
      const off = 4;
      const mesh = makeMobaTower(color);
      const tx = p.x + (lane === 'bot' ? -off : off) * (team === 'player' ? 1 : -1) * 0.7;
      const tz = p.z + (lane === 'top' ? off : -off) * (team === 'player' ? 1 : -1) * 0.7;
      this._makeUnit({
        kind: 'tower', team, type: 'tower', mesh, x: tx, z: tz,
        hp: MOBA.tower.hp, dmg: MOBA.tower.dmg, speed: 0,
        range: MOBA.tower.range, hitR: 1.4, cd: MOBA.tower.cd, lane,
      });
      this.world.obstacles.push({ x: tx, z: tz, r: 1.5 });
    } else {
      t[id]++;
      if (id === 'walls') {
        const base = this.bases[team];
        base.maxHp += 500;
        base.hp = Math.min(base.maxHp, base.hp + 250);
      }
      // decorative hut in the base ring
      const n = this._hutCount[team]++;
      const a = Math.PI / 4 + n * 0.7 + (team === 'enemy' ? Math.PI : 0);
      const hx = bp.x + Math.cos(a) * 11, hz = bp.z + Math.sin(a) * 11;
      const hut = makeSmallHut(id === 'forge' ? 0x5c5c66 : id === 'lodge' ? 0x6e5a2a : 0x8a8578);
      hut.position.set(hx, this.world.heightAt(hx, hz), hz);
      this.scene.add(hut);
    }
    audio.sfx('tower_build', 0.5);
    this.hooks.onBuilt?.(team, id, lane);
    return true;
  }

  // ---------- combat seam (what the local hero can hit) ----------
  hostileMgr(heroTeam = 'player') {
    const self = this;
    return {
      alive: () => self.units.filter(u => !u.dying && u.team !== heroTeam),
      damage: (u, dmg, dir, src = 'local') => self.damageUnit(u, dmg, src),
      stun: (u, sec) => { if (u.kind === 'creep' || u.kind === 'neutral') u.stunT = Math.max(u.stunT, sec); },
      list: this.units, // for event lookup by id
    };
  }

  damageUnit(u, dmg, src = null) {
    if (u.dying) return;
    u.hp -= dmg;
    if (src) u.lastHitBy = src;
    this.hooks.popup(u.mesh.position.clone().setY(u.mesh.position.y + (u.kind === 'tower' ? 4.5 : 1.4)),
      Math.round(dmg).toString(), '#ffffff');
    audio.sfx('hit', 0.2, 120);
    if (u.hp <= 0) this._killUnit(u);
  }

  _killUnit(u) {
    u.dying = 0.0001;
    this.ui.removeTracker('mu' + u.id);
    audio.sfx(u.kind === 'tower' || u.kind === 'base' ? 'base_hit' : 'death', 0.4, 60);

    // rewards to whichever hero landed the kill
    if (u.lastHitBy === 'local') this.hooks.rewardLocal?.(u.xp, u.meat, u.pos);
    else if (u.lastHitBy === 'partner') this.hooks.rewardPartner?.(u.xp, u.meat, u.pos);

    if (u.kind === 'neutral' && u.camp) u.camp.respawnT = u.camp.cfg.respawn;
    if (u.kind === 'base') this.hooks.onEnd(u.team === 'enemy');
  }

  // ---------- per-frame ----------
  update(dt, heroes) {
    this.time += dt;
    this.heroes = heroes;

    // scripted AI opponent (singleplayer only)
    if (this.aiEnabled) {
      for (let i = 0; i < MOBA_AI_TIMELINE.length; i++) {
        const [at, act, lane] = MOBA_AI_TIMELINE[i];
        if (this.time >= at && !this.aiDone.has(i)) {
          this.aiDone.add(i);
          this.build('enemy', act, lane);
        }
      }
    }

    // wave clock — all dens fire together so waves clash mid-lane
    this.waveT -= dt;
    if (this.waveT <= 0) {
      this.waveT = MOBA.waveInterval;
      let fired = false;
      for (const team of ['player', 'enemy']) {
        for (const lane of LANES) {
          const lvl = this.teams[team].dens[lane];
          if (lvl > 0 && this.units.filter(u => u.kind === 'creep' && u.team === team).length < 26) {
            for (const type of DEN_WAVES[lvl - 1]) this._spawnCreep(team, lane, type);
            fired = true;
          }
        }
      }
      if (fired) audio.sfx('spawn', 0.4);
    }

    // lodge income
    this.incomeT -= dt;
    if (this.incomeT <= 0) {
      this.incomeT = 10;
      const gain = this.teams.player.lodge * 2;
      if (gain > 0) {
        this.player.meat = roundResource(this.player.meat + gain);
        this.hooks.popup(this.player.mesh.position.clone().setY(this.player.mesh.position.y + 2.2), `+${gain} 🍖`, '#ff9d76');
      }
    }

    // camp respawns
    for (const camp of this.camps) {
      if (camp.respawnT > 0 && !this.units.some(u => camp.unitIds.includes(u.id) && !u.dying)) {
        camp.respawnT -= dt;
        if (camp.respawnT <= 0) this._spawnCamp(camp);
      }
    }

    this._updateUnits(dt);
  }

  _heroTargets(vsTeam) {
    return this.heroes
      .filter(h => h.team !== vsTeam && !h.obj.dead && !this.world.isTargetSafe?.(h.obj.pos, h.team))
      .map(h => h.obj);
  }

  _updateUnits(dt) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];

      if (u.dying) {
        u.dying += dt;
        if (u.kind === 'tower' || u.kind === 'base') {
          u.mesh.position.y -= dt * 2.2;
          u.mesh.rotation.z += dt * 0.3;
        } else {
          u.mesh.rotation.z = Math.min(Math.PI / 2, u.dying * 4);
          u.mesh.position.y -= Math.max(0, u.dying - 0.5) * dt * 2;
        }
        if (u.dying > 1.1) { this.scene.remove(u.mesh); this.units.splice(i, 1); }
        continue;
      }
      if (u.kind === 'base') continue;

      if (u.stunT > 0) { u.stunT -= dt; continue; }
      u.attackCd -= dt;

      if (u.kind === 'tower') { this._towerAI(u); continue; }
      if (u.kind === 'neutral') { this._neutralAI(u, dt); continue; }
      this._creepAI(u, dt);
    }
  }

  _nearestEnemyOf(u, maxDist, includeHeroes = true) {
    let best = null, bd = maxDist;
    for (const o of this.units) {
      if (o.dying || o.team === u.team || o.team === 'neutral') continue;
      const d = u.pos.distanceTo(o.pos) - o.hitR;
      if (d < bd) { bd = d; best = o; }
    }
    if (includeHeroes) {
      for (const h of this._heroTargets(u.team)) {
        const d = u.pos.distanceTo(h.pos) - 0.6;
        if (d < bd) { bd = d; best = { hero: h, pos: h.pos, hitR: 0.6 }; }
      }
    }
    return best;
  }

  _attack(u, target) {
    u.attackCd = u.atkInterval;
    u.lungeT = 0.2;
    if (target.hero) target.hero.takeDamage(u.dmg, { pos: u.pos, range: u.range });
    else this.damageUnit(target, u.dmg, u.team === 'player' ? null : null);
  }

  _moveUnit(u, tx, tz, dt, speedMult = 1) {
    const dx = tx - u.pos.x, dz = tz - u.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    u.pos.x += (dx / d) * u.speed * speedMult * dt;
    u.pos.z += (dz / d) * u.speed * speedMult * dt;
    this.world.collide(u.pos, 0.4);
    this.world.pushOutOfSafeZones?.(u.pos, 0.4);
    u.walkT += dt * u.speed * speedMult;
    u.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;
  }

  _animateUnit(u, dt) {
    const ud = u.mesh.userData;
    (ud.legs || []).forEach((leg, li) => {
      leg.rotation.x = Math.sin(u.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
    });
    (ud.wings || []).forEach((w, wi) => { w.rotation.z = Math.sin(u.walkT * 6 + wi * Math.PI) * 0.55; });
    (ud.segments || []).forEach((seg, si) => { seg.position.x = Math.sin(u.walkT * 2.4 + si * 1.1) * 0.13; });
    const fly = u.cfg?.flying ? 1.5 : 0;
    u.mesh.position.set(u.pos.x, this.world.heightAt(u.pos.x, u.pos.z) + fly, u.pos.z);
  }

  _creepAI(u, dt) {
    const target = this._nearestEnemyOf(u, 9);
    if (target) {
      const d = u.pos.distanceTo(target.pos);
      if (d > u.range + target.hitR) this._moveUnit(u, target.pos.x, target.pos.z, dt);
      else if (u.attackCd <= 0) this._attack(u, target);
    } else {
      // march down the lane (enemy team walks the path backwards)
      const pts = MOBA.lanes[u.lane];
      const seq = u.team === 'player' ? pts : [...pts].reverse();
      if (u.wp < seq.length) {
        const [wx, wz] = seq[u.wp];
        if (Math.hypot(u.pos.x - wx, u.pos.z - wz) < 3) u.wp++;
        else this._moveUnit(u, wx, wz, dt);
      } else {
        const base = this.bases[otherTeam(u.team)];
        if (u.pos.distanceTo(base.pos) > u.range + base.hitR) this._moveUnit(u, base.pos.x, base.pos.z, dt);
        else if (u.attackCd <= 0) this._attack(u, base);
      }
    }
    this._animateUnit(u, dt);
  }

  _neutralAI(u, dt) {
    const camp = u.camp.cfg;
    const heroes = this._heroTargets('neutral');
    let target = null, bd = 11;
    for (const h of heroes) {
      const d = u.pos.distanceTo(h.pos);
      if (d < bd) { bd = d; target = h; }
    }
    const distHome = Math.hypot(u.pos.x - camp.x, u.pos.z - camp.z);
    if (distHome > 22 || (!target && distHome > 2)) {
      // leash back home & heal
      this._moveUnit(u, camp.x, camp.z, dt, 1.3);
      u.hp = Math.min(u.maxHp, u.hp + u.maxHp * dt * 0.3);
    } else if (target) {
      const d = u.pos.distanceTo(target.pos);
      if (u.cfg?.ranged) {
        u.spellT -= dt;
        if (d < u.cfg.shootRange && u.spellT <= 0) {
          u.spellT = u.cfg.spellCd;
          this.projectiles.spawnEnemyShot(
            u.mesh.position.clone().setY(u.mesh.position.y + 0.8), target,
            { dmg: u.cfg.dmg, speed: u.cfg.projectileSpeed, color: u.cfg.shotColor, stun: u.cfg.stun || 0 });
          audio.sfx('attack_ranged', 0.15, 250);
        }
      }
      if (d > u.range + 0.6) this._moveUnit(u, target.pos.x, target.pos.z, dt);
      else if (u.attackCd <= 0) { u.attackCd = u.atkInterval; target.takeDamage(u.dmg); }
    }
    this._animateUnit(u, dt);
  }

  _towerAI(u) {
    if (u.attackCd > 0) return;
    const target = this._nearestEnemyOf(u, u.range);
    if (!target) return;
    u.attackCd = u.atkInterval;
    const from = u.mesh.position.clone().setY(u.mesh.position.y + 4.7);
    // homing bolt (same projectile the guardian sphere uses); the resolver
    // routes damage to heroes and units alike
    const proxy = target.hero
      ? { pos: target.pos, mesh: { position: target.pos }, dying: false, hitR: 0.6 }
      : target;
    this.projectiles.spawnBolt(from, proxy, {
      dmg: u.dmg,
      onHit: () => target.hero
        ? target.hero.takeDamage(u.dmg, { pos: target.pos, range: 1.6 })
        : this.damageUnit(target, u.dmg),
    });
    audio.sfx('attack_ranged', 0.18, 200);
  }

  // status line for the HUD
  statusLine() {
    const pb = this.bases.player, eb = this.bases.enemy;
    const w = Math.max(0, Math.ceil(this.waveT));
    return `🏰 ${Math.max(0, Math.round(pb.hp))}/${pb.maxHp} · Enemy 🏰 ${Math.max(0, Math.round(eb.hp))}/${eb.maxHp}`
      + ` · Wave in ${Math.floor(w / 60)}:${String(w % 60).padStart(2, '0')}`;
  }

  // plain-data snapshot for multiplayer guests
  snapshot() {
    return this.units.filter(u => !u.dying).map(u => ({
      id: u.id, k: u.kind, t: u.type, tm: u.team,
      x: +u.pos.x.toFixed(1), z: +u.pos.z.toFixed(1),
      hp: Math.round(u.hp), m: Math.round(u.maxHp), ln: u.lane || 0,
    }));
  }

  dispose() {
    for (const u of this.units) { this.scene.remove(u.mesh); this.ui.removeTracker('mu' + u.id); }
    this.units = [];
    this.world.obstacles = [];
  }
}
