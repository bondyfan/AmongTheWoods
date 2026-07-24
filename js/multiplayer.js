// ==========================================================================
// Among The Woods — multiplayer session (co-op & PvP arena duels)
//
//  CO-OP  — one shared world (same seed). The HOST simulates enemies and
//           pickups and streams a snapshot (~7 Hz); the GUEST renders shadow
//           copies and sends hit/collect events. Both players see each other.
//
//  PVP    — each player farms their OWN world fully locally (zero sync lag).
//           Every `interval` minutes both are teleported into a boulder arena
//           and fight with their current gear until one dies. The winner gets
//           a big meat+XP reward; after 5 s both return to where they were
//           (the loser revived at 50% hp).
//
// Both players are authoritative over their OWN hp: attacks are sent as
// events, the receiving client applies the damage to itself.
// ==========================================================================

import * as THREE from 'three';
import { COOP_WORLD_SEED, WoodsNet } from './net.js';
import { WoodsNetWS } from './netws.js';
import { ARENA, ARENA_RETURN_DELAY, arenaReward, ENEMY_TYPES, BOSS_RANKS, BIOMES,
         MOBA_BUILDINGS, roundResource, itemById, enemyLevelFor } from './config.js';
import { makeMan, makeAxe, makeBow, makePickaxe, makeClub, makeSword, makeHandSpear,
         makeCrossbow, makeShield, makeEnemyMesh, makeMeatDrop, makeWoodDrop,
         makeStoneDrop, makeHideDrop, makeIronDrop, makeBerryDrop, makeSalveDrop, makeRoastDrop,
         makeEssenceDrop, makeWoolDrop, makeItemDrop,
         makeEnemyShot, makeSpear, makeWolf, makeMobaTower, makeMobaBase,
         makeTeamFlag, TEAM_COLORS, mat, makeTorchMesh } from './models.js';
import { audio } from './audio.js';
import { MOB_INFO_RADIUS, mobLevelBadge } from './ui.js';

// Remote avatars must own their materials: model factories intentionally share
// many materials, so changing opacity without cloning would fade local actors too.
function setRemoteStealthVisual(root, stealthed) {
  root.traverse(part => {
    if (!part.material) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    const owned = materials.map(source => {
      if (source.userData?._remotePlayerMaterial) return source;
      const material = source.clone();
      material.userData = {
        ...(source.userData || {}),
        _remotePlayerMaterial: true,
        _remoteBaseOpacity: source.opacity ?? 1,
        _remoteBaseTransparent: !!source.transparent,
        _remoteBaseDepthWrite: source.depthWrite,
      };
      return material;
    });
    part.material = Array.isArray(part.material) ? owned : owned[0];
    for (const material of owned) {
      const data = material.userData;
      material.transparent = stealthed || data._remoteBaseTransparent;
      material.opacity = data._remoteBaseOpacity * (stealthed ? 0.16 : 1);
      material.depthWrite = stealthed ? false : data._remoteBaseDepthWrite;
      material.needsUpdate = true;
    }
  });
}

// ---------- the other player's avatar ----------
class RemotePlayer {
  constructor(scene, world, ui, name, uid = 'partner') {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.uid = uid;                       // network identity of this peer
    this.trackerKey = 'mp-' + uid;        // unique HP-bar tracker keys per peer
    this.name = name;
    this.mesh = makeMan();
    // blue scarf so the partner is recognizable
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.34), mat(0x3a6fb5));
    scarf.position.y = 1.12;
    this.mesh.add(scarf);
    this.mesh.visible = false;
    scene.add(this.mesh);

    this.pos = new THREE.Vector3(0, 0, 0);     // interpolated (world truth)
    this.targetPos = new THREE.Vector3();
    this.facing = new THREE.Vector3(0, 0, -1);
    this.hp = 100; this.maxHp = 100; this.level = 1;
    this.dead = false;
    this.stealthed = false;
    this.walkT = 0;
    this.moving = false;
    this.attackT = 0;
    this.weaponId = 'fists';
    this.offhandId = null;
    this._shownWeapon = null;
    this.petId = 0;              // partner's pet, mirrored locally
    this.petMesh = null;
    this.petPos = new THREE.Vector3();
    this.petTargetPos = new THREE.Vector3();
    this.petHp = 0;
    this.petMaxHp = 0;
    this.petWalkT = 0;
    this.lastSeen = 0;

    ui.addTracker(this.trackerKey,
      () => this.mesh.visible ? this.mesh.position.clone().setY(this.mesh.position.y + 2.1) : null,
      `<div class="mp-name"></div><div class="hpbar"><div class="hpbar-fill"></div></div>`, 'hpwrap',
      (el) => {
        // textContent (not innerHTML) — the name arrives over the network
        if (el.children[0].textContent !== this.name) el.children[0].textContent = this.name;
        const pct = Math.max(0, this.hp / this.maxHp);
        const fill = el.children[1].firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = '#5fa8e0';
      });
  }

  setState(s) {
    if (!s) return;
    this.lastSeen = performance.now();
    // the peer's chosen username replaces the P2/P3 fallback label. Sanitized
    // here because it lands in tracker DOM — textContent keeps it inert.
    if (typeof s.nm === 'string') {
      const nm = s.nm.replace(/[<>&"'`]/g, '').trim().slice(0, 14);
      if (nm) this.name = nm;
    }
    const jump = Math.hypot(s.x - this.targetPos.x, s.z - this.targetPos.z) > 20;
    this.targetPos.set(s.x, 0, s.z);
    if (jump) this.pos.copy(this.targetPos); // teleport, don't glide across the map
    this.facing.set(s.fx, 0, s.fz);
    this.hp = s.hp; this.maxHp = s.mhp; this.level = s.lv;
    this.moving = !!s.mv;
    if (s.atk && this.attackT <= 0) this.attackT = 0.25;
    this.dead = !!s.dead;
    this.downed = !!s.dn; // co-op: down but revivable
    const nextStealthed = !!s.st;
    if (nextStealthed !== this.stealthed) {
      this.stealthed = nextStealthed;
      setRemoteStealthVisual(this.mesh, this.stealthed);
    }
    const nextOffhand = s.oh || null;
    if (s.w !== this.weaponId || nextOffhand !== this.offhandId) {
      this.weaponId = s.w;
      this.offhandId = nextOffhand;
      this._refreshWeapon();
      if (this.stealthed) setRemoteStealthVisual(this.mesh, true);
    }

    // partner's pet: a mirrored wolf trotting at their side
    const pet = s.pet || 0;
    if (pet !== this.petId) {
      this.petId = pet;
      if (this.petMesh) {
        this.scene.remove(this.petMesh);
        this.ui.removeTracker(this.trackerKey + '-pet');
        this.petMesh = null;
      }
      if (pet) {
        this.petMesh = (pet === 'wolf' || pet === true) ? makeWolf('tame') : makeEnemyMesh(pet);
        this.scene.add(this.petMesh);
        this.petTargetPos.set(Number.isFinite(s.px) ? s.px : this.targetPos.x, 0,
          Number.isFinite(s.pz) ? s.pz : this.targetPos.z);
        this.petPos.copy(this.petTargetPos);
        this.ui.addTracker(this.trackerKey + '-pet',
          () => this.petMesh?.parent && this.petMesh.visible
            ? this.petMesh.position.clone().setY(this.petMesh.position.y + 1.35) : null,
          '<div class="hpbar"><div class="hpbar-fill"></div></div>', 'hpwrap',
          (el) => {
            el.firstChild.firstChild.style.width = Math.max(0,
              this.petHp / Math.max(1, this.petMaxHp) * 100) + '%';
          });
      }
    }
    if (pet) {
      if (Number.isFinite(s.px) && Number.isFinite(s.pz)) this.petTargetPos.set(s.px, 0, s.pz);
      else this.petTargetPos.copy(this.targetPos).add(new THREE.Vector3(1.4, 0, 1.6));
      this.petHp = Math.max(0, s.php ?? this.petHp);
      this.petMaxHp = Math.max(1, s.pmhp ?? this.petMaxHp ?? 1);
      if (this.petPos.distanceTo(this.petTargetPos) > 20) this.petPos.copy(this.petTargetPos);
    } else {
      this.petHp = 0;
      this.petMaxHp = 0;
    }
  }

  _refreshWeapon() {
    const { rightSocket, leftSocket } = this.mesh.userData;
    rightSocket.clear(); leftSocket.clear();
    this.torchMesh = null; this.torchLight = null;
    const w = itemById(this.weaponId)?.weapon;
    const offItem = itemById(this.offhandId);
    if (w) {
      if (w.kind === 'melee' && w.tier > 0) {
        const makers = { club: makeClub, sword: makeSword, spear: makeHandSpear, pick: makePickaxe, axe: makeAxe };
        const tool = (makers[w.style] || makeAxe)(w.tier);
        tool.rotation.x = -0.2;
        rightSocket.add(tool);
      } else if (w.kind === 'bow') {
        leftSocket.add(w.style === 'crossbow' ? makeCrossbow(w.tier) : makeBow(w.tier));
      }
    }
    // a held torch: the burning stick AND its light, so allies see each other's
    // torches glowing at night exactly like their own (bow → torch in the right)
    const offhandSocket = (w?.kind === 'bow') ? rightSocket : leftSocket;
    if (offItem?.torch) {
      const t = makeTorchMesh();
      t.rotation.x = 0.3;
      this.torchRadius = offItem.torch.radius ?? 5;
      this.torchLight = new THREE.PointLight(0xffc06a, 2, this.torchRadius * 2.8, 1.0);
      this.torchLight.position.y = 0.6;
      t.add(this.torchLight);
      offhandSocket.add(t);
      this.torchMesh = t;
    } else if (offItem?.shield) {
      const mesh = makeShield(offItem.shield.block >= 0.7 ? 2 : 1);
      mesh.rotation.z = -0.3;
      offhandSocket.add(mesh);
    }
  }

  update(dt, torchDark = false) {
    if (!this.mesh.visible) {
      if (this.petMesh) this.petMesh.visible = false;
      return;
    }
    // held torch: mirror the local flame flicker + light so allies' torches
    // genuinely light up the night for everyone
    if (this.torchMesh) {
      this._torchT = (this._torchT || 0) + dt;
      const tt = this._torchT;
      const k = 1 + Math.sin(tt * 11) * 0.16 + Math.sin(tt * 27.3) * 0.1;
      const u = this.torchMesh.userData;
      u.flame.scale.set(k, 1 + (k - 1) * 1.7, k);
      u.flameCore.scale.set(k, k, k);
      u.glow.scale.setScalar(1.25 + (k - 1) * 1.4);
      if (this.torchLight) {
        if (this.dead || this.stealthed) this.torchLight.intensity = 0;
        else {
          const flick = Math.sin(tt * 9) * 0.9 + Math.sin(tt * 23.7) * 0.6 + Math.sin(tt * 3.1) * 0.4;
          const base = torchDark ? 9 + (this.torchRadius ?? 5) * 0.7 : 1.6;
          this.torchLight.intensity = Math.max(0.5, base + flick * (torchDark ? 1.4 : 0.4));
        }
      }
    }
    this.pos.lerp(this.targetPos, Math.min(1, dt * 10));
    this.mesh.position.set(this.pos.x, this.world.heightAt(this.pos.x, this.pos.z), this.pos.z);
    this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    const { leftLeg, rightLeg, rightArm, leftArm } = this.mesh.userData;
    if (this.moving) this.walkT += dt * 8;
    const swing = this.moving ? Math.sin(this.walkT * 1.4) * 0.55 : 0;
    leftLeg.rotation.x = swing; rightLeg.rotation.x = -swing;
    if (this.attackT > 0) {
      this.attackT -= dt;
      rightArm.rotation.x = -2.1 * Math.sin((1 - this.attackT / 0.25) * Math.PI);
    } else { rightArm.rotation.x = -swing * 0.6; leftArm.rotation.x = swing * 0.6; }
    this.mesh.rotation.z = this.dead ? Math.PI / 2 : 0;

    // the mirrored pet trots after its owner
    if (this.petMesh) {
      this.petMesh.visible = this.mesh.visible;
      const dest = this.petTargetPos.clone();
      const to = dest.sub(this.petPos);
      const d = to.length();
      if (d > 0.35) {
        this.petPos.addScaledVector(to, Math.min(1, (9.5 * dt) / d));
        this.petWalkT += dt * 9.5;
        this.petMesh.rotation.y = Math.atan2(to.x, to.z) + Math.PI;
        this.world.collide?.(this.petPos, 0.35);
        if (this.petPos.distanceTo(this.petTargetPos) > 40) // pet teleported with its owner
          this.petPos.copy(this.petTargetPos);
      }
      this.petMesh.position.set(this.petPos.x,
        this.world.heightAt(this.petPos.x, this.petPos.z), this.petPos.z);
      (this.petMesh.userData.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(this.petWalkT * 2.0 + (li % 2) * Math.PI) * 0.6;
      });
    }
  }

  dispose() {
    this.ui.removeTracker(this.trackerKey);
    this.ui.removeTracker(this.trackerKey + '-pet');
    this.scene.remove(this.mesh);
    if (this.petMesh) this.scene.remove(this.petMesh);
  }
}

// ---------- co-op guest: shadow world (host-simulated enemies & pickups) ----------
class ShadowWorld {
  constructor(scene, world, ui, hooks) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.hooks = hooks; // { sendEvent, popup, discover }
    this.enemies = new Map();  // id -> shadow
    this.pickups = new Map();
    this.shots = new Map();
    this.dyingMeshes = [];
    this.seenTypes = new Set();
    this.pendingCollect = new Set();
  }

  applySnap(snap) {
    // --- enemies ---
    const liveIds = new Set();
    for (const e of snap.e || []) {
      liveIds.add(e.id);
      let s = this.enemies.get(e.id);
      if (!s) {
        const cfg = ENEMY_TYPES[e.t];
        const sizeMult = e.b > 0 ? BOSS_RANKS[e.b - 1].sizeMult : 1;
        const mesh = makeEnemyMesh(e.t);
        if (sizeMult !== 1) mesh.scale.multiplyScalar(sizeMult);
        this.scene.add(mesh);
        s = {
          id: e.id, type: e.t, cfg, mesh, bossRank: e.b, sizeMult,
          name: e.n ?? cfg.name, level: e.l ?? enemyLevelFor(e.t, 0, e.b),
          pos: new THREE.Vector3(e.x, 0, e.z), target: new THREE.Vector3(e.x, 0, e.z),
          hp: e.hp, maxHp: e.m, hitR: cfg.hitR * sizeMult,
          armor: cfg.armor ?? (/golem|snapper|colossus/i.test(e.t) ? 0.34 : 0),
          dying: 0, stunT: 0, walkT: Math.random() * 10,
        };
        const flyY = cfg.flying ? 1.5 : 0;
        mesh.position.set(e.x, this.world.heightAt(e.x, e.z) + flyY, e.z);
        this.enemies.set(e.id, s);
        this._addBars(s);
        if (e.b > 0) {
          this.ui.addTracker('sboss' + e.id,
            () => s.mesh.parent ? s.mesh.position.clone().setY(s.mesh.position.y + 2.6 * sizeMult) : null,
            `<div class="boss-name">${s.name ?? ''}</div>${'💀'.repeat(e.b)}`, 'skulls', null,
            { worldRadius: MOB_INFO_RADIUS });
        }
        if (!this.seenTypes.has(e.t)) { this.seenTypes.add(e.t); this.hooks.discover(e.t); }
      }
      s.target.set(e.x, 0, e.z);
      s.hp = e.hp; s.maxHp = e.m;
      if (e.a) s.pendingAtk = true; // host says it just attacked — voice it
    }
    for (const [id, s] of this.enemies) {
      if (!liveIds.has(id)) this._killShadow(id, s);
    }

    // --- pickups ---
    const pickIds = new Set();
    for (const p of snap.p || []) {
      pickIds.add(p.i);
      let s = this.pickups.get(p.i);
      if (!s) {
        const makers = { meat: makeMeatDrop, wood: makeWoodDrop, stone: makeStoneDrop,
                         hide: makeHideDrop, iron: makeIronDrop, berry: makeBerryDrop,
                         salve: makeSalveDrop, roast: makeRoastDrop, essence: makeEssenceDrop, wool: makeWoolDrop, item: makeItemDrop };
        const mesh = (makers[p.k] || makeItemDrop)();
        mesh.position.set(p.x, this.world.heightAt(p.x, p.z) + 0.45, p.z);
        this.scene.add(mesh);
        s = { id: p.i, kind: p.k, mesh, x: p.x, z: p.z, t: Math.random() * 6 };
        this.pickups.set(p.i, s);
      }
      s.x = p.x; s.z = p.z;
      // o carries the dropper's uid — only THAT player keeps hands off while
      // the lock runs; everyone else may grab the drop immediately
      s.locked = !!p.o && p.o === this.hooks.myUid;
      // mob-loot pop still running on the host: mirror the oversized shrink
      // locally (burstT counts down in the bob loop) and don't grab it yet
      if (p.b !== undefined) s.burstT = Math.max(s.burstT ?? 0, p.b);
    }
    for (const [id, s] of this.pickups) {
      if (!pickIds.has(id)) { this.scene.remove(s.mesh); this.pickups.delete(id); this.pendingCollect.delete(id); }
    }

    // --- enemy shots (projectile visibility) ---
    const shotIds = new Set();
    for (const sh of snap.s || []) {
      shotIds.add(sh.i);
      let s = this.shots.get(sh.i);
      if (!s) {
        const mesh = sh.sp ? makeSpear() : makeEnemyShot(sh.c || 0x8aff3a);
        this.scene.add(mesh);
        s = { mesh, spear: !!sh.sp, target: new THREE.Vector3(sh.x, 0.9, sh.z) };
        s.mesh.position.copy(s.target);
        this.shots.set(sh.i, s);
      }
      s.target.set(sh.x, 0.9, sh.z);
    }
    for (const [id, s] of this.shots) {
      if (!shotIds.has(id)) { this.scene.remove(s.mesh); this.shots.delete(id); }
    }
  }

  _addBars(s) {
    this.ui.addTracker('shp' + s.id,
      () => s.mesh.parent && !s.dying ? s.mesh.position.clone().setY(s.mesh.position.y + 1.5 * s.sizeMult + 0.5) : null,
      `<div class="hpbar"><div class="hpbar-fill"></div></div>`
        + `<div class="unit-name"><span class="unit-label">${s.name ?? s.cfg?.name ?? s.type}</span>${mobLevelBadge(s.level)}</div>`, 'hpwrap',
      (el) => {
        const pct = Math.max(0, s.hp / s.maxHp);
        const fill = el.firstChild.firstChild;
        fill.style.width = (pct * 100) + '%';
        fill.style.background = pct > 0.5 ? '#5fd35f' : pct > 0.25 ? '#e0c040' : '#e05050';
      }, { worldRadius: MOB_INFO_RADIUS });
  }

  _killShadow(id, s) {
    this.enemies.delete(id);
    this.ui.removeTracker('shp' + id);
    this.ui.removeTracker('sboss' + id);
    // low hp = a real death; full hp = the host just culled it out of range
    if (s.hp <= s.maxHp * 0.35) {
      s.dying = 0.0001;
      this.dyingMeshes.push(s);
      audio.creature(s.type, 'death', 0.45, 30);
    } else {
      this.scene.remove(s.mesh);
    }
  }

  // ---- EnemyManager-compatible interface for the guest's combat code ----
  alive() { return [...this.enemies.values()]; }
  damage(e, dmg, knockDir, srcId = 'local', opts = null) {
    this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y + 1.4 * e.sizeMult + 0.4),
      Math.round(dmg).toString(), opts?.crit ? '#ffd23a' : '#ffffff', opts?.crit ? 'big' : '');
    this.hooks.sendEvent({
      type: 'ehit', id: e.id, dmg: Math.round(dmg * 10) / 10,
      ...(opts?.crit ? { cr: 1 } : {}),
      ...(opts?.weakPoint ? { wp: 1 } : {}),
      ...(opts?.armorPierce ? { ap: opts.armorPierce } : {}),
      ...(opts?.armorBreak ? { ab: opts.armorBreak, ad: opts.breakDur || 6 } : {}),
      ...(opts?.bleed ? { bl: opts.bleed.dps, bt: opts.bleed.dur } : {}),
      ...(opts?.rend ? { rd: opts.rend.dps, rt: opts.rend.dur } : {}),
      ...(opts?.burn ? { bu: opts.burn.dps, bd: opts.burn.dur } : {}),
      ...(opts?.poison ? { po: opts.poison.dps, pt: opts.poison.dur } : {}),
      ...(srcId === 'pet' ? { ps: 1 } : {}),
    });
    audio.sfx('hit', 0.25, 90);
  }
  stun(e, sec) { this.hooks.sendEvent({ type: 'ehit', id: e.id, dmg: 0, stun: sec }); }

  update(dt, localPlayer) {
    for (const s of this.enemies.values()) {
      const prev = s.pos.clone();
      // big jumps (respawn/teleport/stale) snap instead of sliding across
      if (s.pos.distanceToSquared(s.target) > 144) s.pos.copy(s.target);
      s.pos.lerp(s.target, Math.min(1, dt * 11));
      const moved = s.pos.distanceTo(prev);
      if (moved > 0.01) {
        s.walkT += moved * 2.5;
        s.mesh.rotation.y = Math.atan2(s.pos.x - prev.x, s.pos.z - prev.z) + Math.PI;
      }
      const ud = s.mesh.userData;
      (ud.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(s.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
      });
      (ud.wings || []).forEach((w, wi) => { w.rotation.z = Math.sin(s.walkT * 6 + wi * Math.PI) * 0.55; });
      (ud.segments || []).forEach((seg, si) => { seg.position.x = Math.sin(s.walkT * 2.4 + si * 1.1) * 0.13; });
      const flyY = s.cfg.flying ? 1.5 : 0;
      s.mesh.position.set(s.pos.x, this.world.heightAt(s.pos.x, s.pos.z) + flyY, s.pos.z);
      if (s.pendingAtk) {
        s.pendingAtk = false;
        const d = Math.hypot(localPlayer.pos.x - s.pos.x, localPlayer.pos.z - s.pos.z);
        if (d < 45) audio.creature(s.type, 'attack', Math.max(0.15, 0.5 - d / 120), 120);
      }
    }

    // death animations for removed shadows
    for (let i = this.dyingMeshes.length - 1; i >= 0; i--) {
      const s = this.dyingMeshes[i];
      s.dying += dt;
      s.mesh.rotation.z = Math.min(Math.PI / 2, s.dying * 4);
      s.mesh.position.y -= dt * 0.8;
      if (s.dying > 1) { this.scene.remove(s.mesh); this.dyingMeshes.splice(i, 1); }
    }

    // pickups: bob locally; request collection when the player is close
    for (const s of this.pickups.values()) {
      s.t += dt;
      s.mesh.position.y = this.world.heightAt(s.x, s.z) + 0.45 + Math.sin(s.t * 3) * 0.12;
      s.mesh.rotation.y += dt * 1.2;
      // mirrored mob-loot pop: oversized and untouchable until the timer runs out
      if (s.burstT > 0) {
        s.burstT -= dt;
        s.mesh.scale.setScalar(s.burstT > 0 ? 1 + 2 * s.burstT : 1);
        if (s.burstT > 0) continue;
      }
      if (!this.pendingCollect.has(s.id) && !localPlayer.dead && !s.locked) {
        const d = Math.hypot(localPlayer.pos.x - s.x, localPlayer.pos.z - s.z);
        if (d < 3.0) {
          this.pendingCollect.add(s.id);
          this.hooks.sendEvent({ type: 'collect', id: s.id });
        }
      }
    }

    for (const s of this.shots.values()) {
      if (s.spear) {
        const dx = s.target.x - s.mesh.position.x, dz = s.target.z - s.mesh.position.z;
        if (dx * dx + dz * dz > 1e-4) s.mesh.rotation.y = Math.atan2(dx, dz);
      }
      s.mesh.position.lerp(s.target, Math.min(1, dt * 10));
    }
  }

  dispose() {
    for (const [id, s] of this.enemies) { this.scene.remove(s.mesh); this.ui.removeTracker('shp' + id); this.ui.removeTracker('sboss' + id); }
    for (const s of this.pickups.values()) this.scene.remove(s.mesh);
    for (const s of this.shots.values()) this.scene.remove(s.mesh);
    for (const s of this.dyingMeshes) this.scene.remove(s.mesh);
    this.enemies.clear(); this.pickups.clear(); this.shots.clear();
  }
}

// ---------- MOBA guest: shadow units + local mirror of own buildings ----------
class MobaShadow {
  constructor(scene, world, ui, hooks) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.hooks = hooks; // { sendEvent, popup }
    this.unitsMap = new Map();
    this.dyingMeshes = [];
    this.waveT = 60;
    // local mirror of MY team's building levels (guest = 'enemy' team on host)
    this.mirror = { dens: { mid: 0, top: 0, bot: 0 }, towers: { mid: 0, top: 0, bot: 0 },
                    forge: 0, lodge: 0, walls: 0 };
  }

  get units() { return [...this.unitsMap.values()]; }

  buildingInfo(team, id, lane) {
    const def = MOBA_BUILDINGS.find(b => b.id === id);
    const level = id === 'den' ? this.mirror.dens[lane]
      : id === 'tower' ? this.mirror.towers[lane] : this.mirror[id];
    return { def, level, maxed: level >= def.max, cost: level >= def.max ? null : def.cost(level + 1) };
  }

  registerBuild(id, lane) {
    if (id === 'den') this.mirror.dens[lane]++;
    else if (id === 'tower') this.mirror.towers[lane]++;
    else this.mirror[id]++;
  }

  _makeMesh(u) {
    const color = TEAM_COLORS[u.tm] || 0xe0c040;
    if (u.k === 'base') return makeMobaBase(color);
    if (u.k === 'tower') return makeMobaTower(color);
    const mesh = u.tm === 'player' && u.t === 'wolf' ? makeWolf('tame') : makeEnemyMesh(u.t);
    if (u.k === 'creep') {
      const flag = makeTeamFlag(color);
      flag.position.set(0, u.t === 'bear' ? 1.4 : 1.0, 0.3);
      mesh.add(flag);
    }
    return mesh;
  }

  applySnap(snap) {
    this.waveT = snap.w ?? this.waveT;
    const live = new Set();
    for (const su of snap.m || []) {
      live.add(su.id);
      let s = this.unitsMap.get(su.id);
      if (!s) {
        const mesh = this._makeMesh(su);
        this.scene.add(mesh);
        const cfg = ENEMY_TYPES[su.t];
        s = {
          id: su.id, kind: su.k, team: su.tm, type: su.t, mesh, cfg,
          level: su.lv || 0,
          pos: new THREE.Vector3(su.x, 0, su.z), target: new THREE.Vector3(su.x, 0, su.z),
          hp: su.hp, maxHp: su.m, hitR: su.k === 'base' ? 7 : su.k === 'tower' ? 1.4 : (cfg?.hitR ?? 0.8),
          dying: false, stunT: 0, walkT: Math.random() * 10,
        };
        this.unitsMap.set(su.id, s);
        const y = s.kind === 'base' ? 3.5 : s.kind === 'tower' ? 5.4 : 1.9;
        this.ui.addTracker('mmu' + s.id,
          () => s.mesh.parent && !s.dying ? s.mesh.position.clone().setY(s.mesh.position.y + y) : null,
          `<div class="hpbar"><div class="hpbar-fill"></div></div><div class="unit-name">`
            + `<span class="unit-label">${s.cfg?.name ?? s.kind}</span>${s.level ? mobLevelBadge(s.level) : ''}</div>`, 'hpwrap',
          (el) => {
            const pct = Math.max(0, s.hp / s.maxHp);
            const fill = el.firstChild.firstChild;
            fill.style.width = (pct * 100) + '%';
            // from the GUEST's view: my team is 'enemy' on the host → blue
            fill.style.background = s.team === 'enemy' ? '#5fa8e0' : s.team === 'player' ? '#e05050' : '#e0c040';
          }, { worldRadius: MOB_INFO_RADIUS });
      }
      s.target.set(su.x, 0, su.z);
      s.hp = su.hp; s.maxHp = su.m;
    }
    for (const [id, s] of this.unitsMap) {
      if (!live.has(id)) {
        this.unitsMap.delete(id);
        this.ui.removeTracker('mmu' + id);
        s.dying = 0.0001;
        this.dyingMeshes.push(s);
        audio.sfx('death', 0.25, 80);
      }
    }
  }

  // combat seam for the guest hero (hostile = host's team + neutrals)
  alive() { return this.units.filter(u => !u.dying && u.team !== 'enemy'); }
  damage(u, dmg) {
    this.hooks.popup(u.mesh.position.clone().setY(u.mesh.position.y + 1.4), Math.round(dmg).toString(), '#ffffff');
    this.hooks.sendEvent({ type: 'mhit', id: u.id, dmg: Math.round(dmg * 10) / 10 });
    audio.sfx('hit', 0.25, 90);
  }
  stun(u, sec) { this.hooks.sendEvent({ type: 'mhit', id: u.id, dmg: 0, stun: sec }); }

  statusLine() {
    let mine = null, theirs = null;
    for (const u of this.unitsMap.values()) {
      if (u.kind !== 'base') continue;
      if (u.team === 'enemy') mine = u; else theirs = u;
    }
    const w = Math.max(0, Math.ceil(this.waveT));
    return `🏰 ${mine ? Math.round(mine.hp) + '/' + mine.maxHp : '—'} · Enemy 🏰 ${theirs ? Math.round(theirs.hp) + '/' + theirs.maxHp : '—'}`
      + ` · Wave in ${Math.floor(w / 60)}:${String(w % 60).padStart(2, '0')}`;
  }

  update(dt) {
    this.waveT = Math.max(0, this.waveT - dt);
    for (const s of this.unitsMap.values()) {
      if (s.kind === 'base' || s.kind === 'tower') continue;
      const prev = s.pos.clone();
      s.pos.lerp(s.target, Math.min(1, dt * 8));
      const moved = s.pos.distanceTo(prev);
      if (moved > 0.01) {
        s.walkT += moved * 2.5;
        s.mesh.rotation.y = Math.atan2(s.pos.x - prev.x, s.pos.z - prev.z) + Math.PI;
      }
      const ud = s.mesh.userData;
      (ud.legs || []).forEach((leg, li) => {
        leg.rotation.x = Math.sin(s.walkT * 2.2 + (li % 2) * Math.PI) * (ud.spider ? 0.3 : 0.6);
      });
      (ud.segments || []).forEach((seg, si) => { seg.position.x = Math.sin(s.walkT * 2.4 + si * 1.1) * 0.13; });
      s.mesh.position.set(s.pos.x, this.world.heightAt(s.pos.x, s.pos.z), s.pos.z);
    }
    for (let i = this.dyingMeshes.length - 1; i >= 0; i--) {
      const s = this.dyingMeshes[i];
      s.dying += dt;
      s.mesh.rotation.z = Math.min(Math.PI / 2, s.dying * 3);
      s.mesh.position.y -= dt * 1.5;
      if (s.dying > 1.1) { this.scene.remove(s.mesh); this.dyingMeshes.splice(i, 1); }
    }
  }

  dispose() {
    for (const [id, s] of this.unitsMap) { this.scene.remove(s.mesh); this.ui.removeTracker('mmu' + id); }
    for (const s of this.dyingMeshes) this.scene.remove(s.mesh);
    this.unitsMap.clear();
  }
}

// ---------- the session ----------
export class Multiplayer {
  // ctx: { scene, world, player, enemyMgr, pickups, projectiles, ui, panels, game,
  //        startPlaying(), popup(pos,text,color) }
  constructor(ctx) {
    this.ctx = ctx;
    // transport: Firebase (WoodsNet) for Create Co-op / PvP / MOBA; the dedicated
    // WebSocket server (WoodsNetWS) for "Server" games. Swapped in serverStart().
    this.net = WoodsNet;
    this.active = false;
    this.mode = null;          // 'coop' | 'pvp'
    this.isHost = false;
    this.isServer = false;     // true once serverStart() joins the shared server world
    // co-op supports up to 20 players: one RemotePlayer per peer, keyed by uid.
    // pvp/moba stay strictly 1v1 and use the single first entry (this.remote).
    this.remotes = new Map();  // uid -> RemotePlayer
    this._peerSeq = 1;         // label counter (I am P1 from my own point of view)
    this._campSyncedTo = new Set(); // host: peers already sent the camp state
    this.shadow = null;        // ShadowWorld (co-op guest)
    this.meta = null;
    this._snapT = 0;
    this._deadSince = 0;
    this._posHist = []; // my recent positions — lag-compensated hit validation
    this.downedUntil = null; // co-op: I'm down, partner can revive me until then

    this.arena = {
      active: false, nextAt: 0, prevPos: null,
      overT: 0, iWon: false, resolved: false,
    };

    // combat proxy: lets the local player's melee/arrows/companions hit the
    // remote player in the arena through the normal EnemyManager interface
    const self = this;
    this.arenaProxy = {
      get id() { return 'partner'; },
      get pos() { return self.remote.pos; },
      get mesh() { return self.remote.mesh; },
      get dying() { return self.remote.dead; },
      get dead() { return self.remote.dead; },
      get stealthed() { return self.remote.stealthed; },
      get hp() { return self.remote.hp; },
      get maxHp() { return self.remote.maxHp; },
      hitR: 0.6, sizeMult: 1, stunT: 0,
      cfg: { hitR: 0.6 },
      takeDamage: () => {}, applyStun: () => {},
    };
    this.arenaAdapter = {
      alive: () => {
        if (!this.arena.active || !this.remote) return [];
        const targets = this.remote.dead ? [] : [this.arenaProxy];
        if (!this.coopPetProxy.dead) targets.push(this.coopPetProxy);
        return targets;
      },
      damage: (e, dmg, knockDir = null, srcId = 'local', opts = null) => {
        if (e?.id === 'partnerPet') {
          this.coopPetProxy.takeDamage(dmg, ctx.player);
          ctx.popup(this.remote.petMesh.position.clone().setY(this.remote.petMesh.position.y + 1.4),
            Math.round(dmg).toString(), '#ffb3b3');
          audio.sfx('hit', 0.3, 110);
          return;
        }
        this.net.sendEvent({
          type: 'hit', dmg: Math.round(dmg * 10) / 10,
          ax: +ctx.player.pos.x.toFixed(1), az: +ctx.player.pos.z.toFixed(1),
          ...(opts?.bleed ? { bl: opts.bleed.dps, bt: opts.bleed.dur } : {}),
          ...(opts?.rend ? { rd: opts.rend.dps, rt: opts.rend.dur } : {}),
          ...(opts?.burn ? { bu: opts.burn.dps, bd: opts.burn.dur } : {}),
          ...(opts?.poison ? { po: opts.poison.dps, pt: opts.poison.dur } : {}),
        });
        ctx.popup(this.remote.mesh.position.clone().setY(this.remote.mesh.position.y + 2), Math.round(dmg).toString(), '#ffb3b3');
        audio.sfx('hit', 0.3, 90);
      },
      stun: (e, sec) => {
        if (e?.id === 'partnerPet') return;
        this.net.sendEvent({
          type: 'hit', dmg: 0, stun: sec,
          ax: +ctx.player.pos.x.toFixed(1), az: +ctx.player.pos.z.toFixed(1),
        });
      },
    };

    // enemy-attack proxy for co-op host: enemies can chase & hurt the partner.
    // The attacker's position/range travel with the hit so the guest can
    // reject phantom hits caused by its proxy position lagging behind.
    this.coopProxy = {
      id: 'partner', // threat-system identity
      // combat uses the FRESHEST known position (targetPos), not the smoothed
      // one — that alone removes ~100 ms of interpolation lag on the host
      get pos() { return self.remote.targetPos; },
      get mesh() { return self.remote.mesh; },
      get dead() { return self.remote.dead; },
      get stealthed() { return self.remote.stealthed; },
      takeDamage: (dmg, src) => this.net.sendEvent({
        type: 'pdmg', dmg: Math.round(dmg * 10) / 10,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
        ar: src?.range != null ? +src.range.toFixed(1) : undefined,
        sh: src?.shot ? 1 : undefined,
      }),
      applyStun: (sec, src) => this.net.sendEvent({
        type: 'pdmg', dmg: 0, stun: sec,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
        ar: src?.range != null ? +src.range.toFixed(1) : undefined,
        sh: src?.shot ? 1 : undefined,
      }),
    };
    // Host-side combat body for the guest's Beastmaster companion. Its real
    // HP and position are streamed by the owner; hits travel back to that
    // owner, so the pet can genuinely pull threat, tank and die in co-op.
    this.coopPetProxy = {
      id: 'partnerPet', isPet: true, hitR: 0.5, sizeMult: 1, stunT: 0,
      get pos() { return self.remote?.petTargetPos ?? null; },
      get mesh() { return self.remote?.petMesh ?? null; },
      get hp() { return self.remote?.petHp ?? 0; },
      get maxHp() { return self.remote?.petMaxHp ?? 0; },
      get dead() { return !self.remote?.petId || (self.remote?.petHp ?? 0) <= 0; },
      takeDamage: (dmg, src) => this.net.sendEvent({
        type: 'petDmg', dmg: Math.round(dmg * 10) / 10,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
      }),
      applyStun: () => {},
    };
  }

  // legacy single-peer view: pvp arena & MOBA are strictly 1v1, and a handful
  // of call sites only care about "the other player" — first remote wins
  get remote() { return this.remotes.values().next().value ?? null; }

  // minimap: every co-op ally currently rendered
  mapRemotes() { return [...this.remotes.values()]; }

  // get-or-create the RemotePlayer for a peer uid. In co-op it also carries its
  // own host-side combat proxies, so enemies simulated HERE can chase/hurt THAT
  // player (and their pet) and the damage travels to the right inbox.
  _remoteFor(uid) {
    let r = this.remotes.get(uid);
    if (r) return r;
    r = new RemotePlayer(this.ctx.scene, this.ctx.world, this.ctx.ui, `P${++this._peerSeq}`, uid);
    r.mesh.visible = this.mode !== 'pvp';
    const net = () => this.net;
    r.proxy = {
      id: uid, // threat-system identity == network identity
      // combat uses the FRESHEST known position (targetPos), not the smoothed
      // one — that alone removes ~100 ms of interpolation lag on the host
      get pos() { return r.targetPos; },
      get mesh() { return r.mesh; },
      get dead() { return r.dead; },
      get stealthed() { return r.stealthed; },
      ownerUid: uid, // pickups: magnet-collects are granted back to this uid
      takeDamage: (dmg, src) => net().sendEvent({
        type: 'pdmg', dmg: Math.round(dmg * 10) / 10,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
        ar: src?.range != null ? +src.range.toFixed(1) : undefined,
        sh: src?.shot ? 1 : undefined,
      }, uid),
      applyStun: (sec, src) => net().sendEvent({
        type: 'pdmg', dmg: 0, stun: sec,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
        ar: src?.range != null ? +src.range.toFixed(1) : undefined,
        sh: src?.shot ? 1 : undefined,
      }, uid),
    };
    r.petProxy = {
      id: uid + '#pet', isPet: true, hitR: 0.5, sizeMult: 1, stunT: 0,
      get pos() { return r.petTargetPos ?? null; },
      get mesh() { return r.petMesh ?? null; },
      get hp() { return r.petHp ?? 0; },
      get maxHp() { return r.petMaxHp ?? 0; },
      get dead() { return !r.petId || (r.petHp ?? 0) <= 0; },
      takeDamage: (dmg, src) => net().sendEvent({
        type: 'petDmg', dmg: Math.round(dmg * 10) / 10,
        ai: src?.id,
        ax: src?.pos ? +src.pos.x.toFixed(1) : undefined,
        az: src?.pos ? +src.pos.z.toFixed(1) : undefined,
      }, uid),
      applyStun: () => {},
    };
    this.remotes.set(uid, r);
    return r;
  }

  // a peer's avatar appeared for the first time (their first state packet)
  _peerJoined(uid) {
    if (this.mode !== 'coop') return;
    // a backgrounded tab stops streaming and gets reaped; don't re-fanfare it
    this._everSeen ??= new Set();
    if (!this._everSeen.has(uid)) {
      this._everSeen.add(uid);
      this.ctx.ui.toast(`🤝 ${this.remotes.get(uid)?.name ?? 'A player'} joined the world!`, 'level');
      audio.sfx('spawn', 0.5);
    }
    this.ctx.onPartnerJoin?.(); // UI: retire the on-screen join code
    // Firebase co-op: the host owns the camp state — push it to the newcomer.
    // (Server worlds replay the last camp event server-side instead.)
    if (this.isHost && !this._campSyncedTo.has(uid)) {
      this._campSyncedTo.add(uid);
      this.sendCampSync(uid);
    }
  }

  // a peer disconnected — tear down their avatar/pet/trackers
  _peerLeft(uid) {
    const r = this.remotes.get(uid);
    if (!r) return;
    this.remotes.delete(uid);
    this._campSyncedTo.delete(uid);
    r.dispose();
    if (this.mode === 'coop') this.ctx.ui.toast(`👋 ${r.name} left the world.`, 'boss');
  }

  // ---------- lobby ----------
  async host(mode, intervalMin) {
    const { code, meta } = await this.net.createGame(mode, intervalMin);
    this.isHost = true;
    this.meta = meta;
    this._watchMeta();
    // Co-op starts RIGHT AWAY — the host plays solo and friends drop in live
    // via the join code. (PvP / MOBA still wait in the lobby for their 1 rival.)
    if (mode === 'coop') this._begin(meta);
    return code;
  }

  async join(code) {
    const meta = await this.net.joinGame(code);
    this.isHost = false;
    this.meta = meta;
    this._watchMeta();
    this._begin(meta);
  }

  // "Server" games: ONE shared world on the neutral server. The server is the
  // authority, so every player is a pure GUEST (renders the server's snapshots,
  // sends events). There are no per-room codes — everyone joins the same world.
  async serverStart() {
    this.net = WoodsNetWS;
    this.isHost = false;
    this.isServer = true;
    const meta = (await this.net.createGame('coop')).meta;
    meta.mode = 'coop';
    this.meta = meta;
    this._watchMeta();
    this._begin(meta);
    return this.net.code;
  }

  // one meta watcher for both roles: it starts the game, promotes a
  // survivor to host when the creator vanishes, and greets mid-game joiners
  _watchMeta() {
    this.net.onMeta((m) => {
      if (!m) { this._partnerLeft(); return; } // room truly gone
      this.meta = m;
      // the creator disappeared → ONE remaining player takes over the room.
      // With N co-op players the oldest-seated uid claims (no thundering herd);
      // if that one is gone too, its roster entry disappears and the next
      // onMeta fires with a new oldest.
      if (!m.host && !this.isHost && this.active && !this._promoting && m.host !== 'server') {
        if (this.mode === 'coop') {
          const roster = Object.entries(m.players || {}).sort((a, b) => a[1] - b[1]);
          if (roster.length && roster[0][0] !== this.net.uid) return; // not my claim
        }
        this._becomeHost();
        return;
      }
      // pvp/moba: the single rival seat filled (first time or mid-game).
      // Co-op peers attach via their state streams instead (_peerJoined).
      if (this.isHost && m.mode !== 'coop' && m.guest && m.guest !== this.net.partnerUid) {
        if (this.active && this.mode === 'moba') return; // 1v1 seats don't refill
        this.net.setPartner(m.guest);
        if (!this.active) this._begin(m);
        else {
          const r = this.remote;
          if (r) { r.lastSeen = 0; r.mesh.visible = this.mode !== 'pvp'; }
          this.ctx.ui.toast('🤝 A new rival joined your world!', 'level');
        }
      }
    });
  }

  // co-op only: the world keeps running under new management. The shadow
  // dissolves and my OWN simulation takes over; the code stays joinable.
  async _becomeHost() {
    // server-authoritative games have no player host to promote to — the neutral
    // server always runs the sim. Never spin up a competing client sim.
    if (this.meta?.host === 'server') return;
    if (this.mode !== 'coop') { this._partnerLeft(); return; }
    this._promoting = true;
    this.isHost = true;
    try { await this.net.becomeHost(); } catch { /* net hiccup — play on */ }
    this.shadow?.dispose();
    this.shadow = null;
    // the departed host's avatar is torn down by its own peer-state removal;
    // everyone still here keeps rendering. Re-push camp state as the new owner.
    this._campSyncedTo.clear();
    this._promoting = false;
    this.ctx.ui.toast(`👑 The host left — YOU run the world now. Code ${this.net.code} stays open (Settings).`, 'boss');
  }

  _begin(meta) {
    const { ctx } = this;
    this.active = true;
    this.mode = meta.mode;

    if (meta.mode === 'moba') {
      // one shared three-lane map; host runs the sim, guest plays the red team
      if (this.isHost) {
        this.moba = ctx.createMobaHost(meta.seed);
      } else {
        this.mobaShadow = new MobaShadow(ctx.scene, null, ctx.ui, {
          sendEvent: (e) => this.net.sendEvent(e),
          popup: ctx.popup,
        });
        ctx.attachMobaGuest(meta.seed, this.mobaShadow);
        this.mobaShadow.world = ctx.world; // the fresh MobaWorld from the swap
        this.net.onSnap((snap) => this.mobaShadow.applySnap(snap));
      }
    } else {
      // world seed: shared in co-op, per-player in pvp (own worlds)
      const seed = meta.mode === 'coop' ? COOP_WORLD_SEED : meta.seed + (this.isHost ? 0 : 1);
      ctx.world.reset(seed);
      ctx.game.seed = seed;
    }

    // pvp/moba are strictly 1v1 — build the single rival avatar eagerly (MOBA
    // shows both seats at once). Co-op peers materialize lazily, one avatar per
    // player, when their first state packet arrives.
    if (this.mode !== 'coop') {
      const r = this._remoteFor(this.net.partnerUid || 'peer');
      r.name = this.isHost ? 'P2' : 'P1';
      r.mesh.visible = this.mode === 'moba';
    }

    if (this.mode === 'coop' && !this.isHost) {
      this.shadow = new ShadowWorld(ctx.scene, ctx.world, ctx.ui, {
        sendEvent: (e) => this.net.sendEvent(e),
        popup: ctx.popup,
        discover: (t) => ctx.onDiscover(t),
        // own network identity — a drop tagged with MY uid is untouchable for me
        myUid: typeof this.net.uid === 'function' ? this.net.uid() : this.net.uid,
      });
      this.net.onSnap((snap) => this.shadow.applySnap(snap));
    }

    this.net.onPeerState((uid, s) => {
      if (s) {
        // pvp/moba pre-created the rival under a placeholder key — rebind it
        if (this.mode !== 'coop' && !this.remotes.has(uid)) {
          const r = this.remote;
          if (r) { this.remotes.delete(r.uid); r.uid = uid; this.remotes.set(uid, r); }
        }
        const isNew = !this.remotes.has(uid);
        this._remoteFor(uid).setState(s);
        if (isNew) this._peerJoined(uid);
        return;
      }
      // their state stream ended → they disconnected
      if (this.mode === 'moba') { if (this.remote?.lastSeen) this._partnerLeft(); return; }
      if (this.mode === 'coop') this._peerLeft(uid);
    });
    this.net.onEvent((ev) => this._onEvent(ev));

    if (this.mode === 'pvp' && this.isHost) {
      this.net.updateMeta({ nextArenaAt: Date.now() + meta.interval * 60000 });
    }

    ctx.startPlaying(); // hides menu, starts music, spawns the local wave
    ctx.ui.toast(this.mode === 'coop'
      ? '🤝 Co-op! Fight side by side and head north together.'
      : this.mode === 'moba'
        ? '🏰 MOBA 1v1! Farm the jungle, build dens & towers, raze their base.'
        : `⚔️ PvP! Farm your world — the arena calls every ${meta.interval} min.`, 'level');
  }

  _partnerLeft() {
    if (!this.active) return;
    // MOBA is 1v1: an opponent who vanishes forfeits. Disposing without
    // ending used to strip every shadow unit (bases included) and leave a
    // frozen, broken map behind.
    if (this.mode === 'moba') {
      const end = this.ctx.endMoba;
      this.ctx.ui.toast('👋 Your opponent left — victory by forfeit!', 'level');
      this.dispose();
      end?.(true);
      return;
    }
    this.ctx.ui.toast('👋 Your partner left — continuing solo.', 'boss');
    this.dispose();
  }

  // ---------- per-frame ----------
  update(dt) {
    if (!this.active) return;
    const { ctx } = this;
    const p = ctx.player;

    // remember where I've been for ~0.9 s — incoming hits were computed by the
    // host against a position of mine that old, so they must be checked
    // against my recent path, not just against where I am right now
    const now = performance.now();
    this._posHist.push({ x: p.pos.x, z: p.pos.z, t: now });
    while (this._posHist.length && now - this._posHist[0].t > 900) this._posHist.shift();

    // broadcast own state (fast in co-op/moba/arena so proxy lag stays small)
    const arenaHot = this.arena.active;
    const rate = this.mode === 'coop' ? 70 : this.mode === 'moba' ? 80 : (arenaHot ? 70 : 500);
    const localPet = ctx.petTarget && !ctx.petTarget.dead ? ctx.petTarget : null;
    this.net.sendState({
      x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1),
      fx: +p.facing.x.toFixed(2), fz: +p.facing.z.toFixed(2),
      hp: Math.round(p.hp), mhp: p.maxHp, lv: p.level,
      w: p.equipment.weapon, oh: p.equipment.offhand || 0, mv: (ctx.input.moveX || ctx.input.moveZ) ? 1 : 0,
      atk: p.attackT > 0 ? 1 : 0, dead: p.dead ? 1 : 0,
      dn: (p.dead && this.downedUntil) ? 1 : 0,
      st: p.stealthed ? 1 : 0,
      ...(ctx.playerName ? { nm: ctx.playerName } : {}),
      pet: ((p.hooks.classRulesEnabled?.() === false || p.selectedClass === 'beastmaster')
        && p.pet && !p.petDead && localPet)
        ? (p.pet.type || 'wolf') : 0,
      ...(localPet?.pos ? {
        px: +localPet.pos.x.toFixed(1), pz: +localPet.pos.z.toFixed(1),
        php: Math.max(0, Math.round(localPet.hp)), pmhp: Math.max(1, Math.round(localPet.maxHp)),
      } : {}),
    }, rate);

    // allies' torch lights burn bright in darkness, faint by day (mirrors tickTorch)
    const torchDark = !!ctx.game.dungeon
      || (BIOMES[ctx.game.biomeIndex]?.darkness ?? 0) >= 0.35
      || (ctx.game.nightK || 0) > 0.55;
    for (const r of this.remotes.values()) r.update(dt, torchDark);
    this.shadow?.update(dt, p);
    this.mobaShadow?.update(dt);

    // co-op safety net: a peer whose client crashed (no clean disconnect) stops
    // streaming state — reap the frozen avatar after 30 s of silence. (30 s, not
    // less: a merely BACKGROUNDED tab also stops streaming and comes back.)
    if (this.mode === 'coop') {
      const now = performance.now();
      for (const [uid, r] of [...this.remotes]) {
        if (r.lastSeen && now - r.lastSeen > 30000) this._peerLeft(uid);
      }
    }

    // downed: live countdown; nobody came → bleed out with the full penalty
    const downedEl = document.getElementById('downed-hint');
    if (this.downedUntil && p.dead) {
      const left = Math.max(0, this.downedUntil - performance.now());
      if (downedEl) {
        downedEl.textContent = `☠️ DOWNED — an ally can revive you (${Math.ceil(left / 1000)} s) · press X to respawn at base now`;
        downedEl.classList.remove('hidden');
      }
      if (left <= 0) this._bleedOut();
    } else downedEl?.classList.add('hidden');

    // host: stream the world snapshot. Only entities near SOME player are
    // sent — a full-map snapshot grows unbounded (stale pickups, far enemies)
    // and a fat payload at 7 Hz backs up the Firebase write queue, which is
    // exactly what the guest experiences as units lagging seconds behind.
    if (this.isHost && this.mode === 'coop') {
      this._snapT -= dt;
      if (this._snapT <= 0) {
        this._snapT = 0.1;
        const anchors = [ctx.player.pos];
        for (const r of this.remotes.values()) if (r.lastSeen) anchors.push(r.targetPos);
        const nearAny = (x, z) => anchors.some(a => Math.hypot(x - a.x, z - a.z) < 130);
        this.net.sendSnap({
          e: ctx.enemyMgr.snapshot().filter(s => nearAny(s.x, s.z)),
          p: ctx.pickups.snapshot().filter(s => nearAny(s.x, s.z)),
          s: ctx.projectiles.snapshotShots(),
        });
      }
    } else if (this.isHost && this.mode === 'moba') {
      this._snapT -= dt;
      if (this._snapT <= 0) {
        this._snapT = 0.2;
        this.net.sendSnap({ m: this.moba.snapshot(), w: Math.round(this.moba.waveT) });
      }
    }

    if (this.mode === 'pvp') this._updatePvp(dt);
    this._updateHudLine();
  }

  _updateHudLine() {
    if (this.mode === 'moba') return; // the MOBA status line owns that element
    const el = document.getElementById('mp-status');
    if (!el) return;
    let line, color;
    const rs = this.mapRemotes().filter(r => r.lastSeen);
    if (this.mode === 'coop' && rs.length !== 1) {
      // N-player summary: ally count + the loudest emergency
      const downed = rs.filter(r => r.dead && r.downed).length;
      line = rs.length ? `🤝 ${rs.length + 1} players` : '🤝 waiting for allies…';
      if (downed) line = `☠️ ${downed === 1 ? 'ALLY DOWN' : downed + ' ALLIES DOWN'} — go revive! · ` + line;
      color = downed ? '#ff6a5a' : '#cfe3b8';
    } else {
      // one rival/ally: the classic detailed line
      const r = rs[0] ?? this.remote;
      line = `${r?.name ?? 'P2'} Lv${r?.level ?? '?'} ❤️${r ? Math.max(0, Math.round(r.hp)) : '?'}/${r?.maxHp ?? '?'}`;
      if (r?.dead) line = (r.downed ? '☠️ PARTNER DOWN — go revive them! · ' : '💀 partner out · ') + line;
      const frac = r ? Math.max(0, r.hp) / (r.maxHp || 100) : 1;
      color = r?.dead ? '#ff6a5a' : frac > 0.5 ? '#cfe3b8' : frac > 0.25 ? '#ffd23a' : '#ff8a6a';
    }
    el.style.color = color;
    if (this.mode === 'pvp' && !this.arena.active && this.meta?.nextArenaAt) {
      const s = Math.max(0, Math.ceil((this.meta.nextArenaAt - Date.now()) / 1000));
      line = `⚔️ Arena in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · ` + line;
    }
    if (this.arena.active) line = '⚔️ DUEL! · ' + line;
    el.textContent = line;
    el.classList.remove('hidden');
  }

  // ---------- pvp arena flow ----------
  _updatePvp(dt) {
    const { ctx } = this;
    if (!this.arena.active) {
      if (this.meta?.nextArenaAt && Date.now() >= this.meta.nextArenaAt && !ctx.player.dead) {
        this._startArena();
      }
      return;
    }

    // arena running — resolve the end
    if (this.arena.resolved) {
      this.arena.overT -= dt;
      if (this.arena.overT <= 0) this._leaveArena();
    }
  }

  _startArena() {
    const { ctx } = this;
    const p = ctx.player;
    this.arena.active = true;
    this.arena.resolved = false;
    this.arena.iWon = false;
    this.arena.prevPos = p.pos.clone();
    if (ctx.panels.open) ctx.panels.toggle(null);

    ctx.world.buildArena(ARENA.x, ARENA.z, ARENA.r);
    const side = this.isHost ? -1 : 1;
    p.pos.set(ARENA.x + side * (ARENA.r - 4), 0, ARENA.z);
    p.facing.set(-side, 0, 0);
    this.remote.mesh.visible = true;
    this.remote.pos.set(ARENA.x - side * (ARENA.r - 4), 0, ARENA.z);
    this.remote.targetPos.copy(this.remote.pos);

    audio.sfx('lane_unlock', 0.6);
    ctx.ui.banner('⚔️ FIGHT ⚔️');
    ctx.ui.toast('Duel! Winner takes a mountain of meat & XP.', 'boss');
  }

  // my player died in the arena → tell the winner, wait, revive & return
  _onArenaDeath() {
    this.arena.resolved = true;
    this.arena.iWon = false;
    this.arena.overT = ARENA_RETURN_DELAY;
    this.net.sendEvent({ type: 'arenaDeath' });
    this.ctx.ui.toast('☠️ Defeated… returning in 5 s.', 'boss');
  }

  // the opponent died → reward, wait, return
  _onArenaWin() {
    if (this.arena.resolved) return;
    this.arena.resolved = true;
    this.arena.iWon = true;
    this.arena.overT = ARENA_RETURN_DELAY;
    const reward = arenaReward(this.remote.level);
    const p = this.ctx.player;
    p.meat += reward.meat;
    p.addXp(reward.xp);
    audio.sfx('victory', 0.5);
    this.ctx.ui.toast(`🏆 Duel won! +${reward.meat} 🍖 +${reward.xp} XP`, 'level');
  }

  _leaveArena() {
    const { ctx } = this;
    const p = ctx.player;
    this.arena.active = false;
    ctx.world.removeArena();
    if (p.dead) p.revive(0.5);
    p.combatDots = {};
    p.combatDotTickT = 0;
    p.pos.copy(this.arena.prevPos);
    if (this.mode === 'pvp') this.remote.mesh.visible = false;
    if (this.isHost) {
      this.net.updateMeta({ nextArenaAt: Date.now() + (this.meta.interval || 3) * 60000 });
    }
    ctx.ui.toast('Back to the hunt. Next duel is ticking…', 'info');
  }

  arenaZone() { return this.arena.active ? ARENA : null; }

  // what the local combat systems should target this frame
  combatMgr() {
    if (this.mode === 'moba') return this.isHost ? this.moba.hostileMgr('player') : this.mobaShadow;
    if (this.mode === 'pvp') return this.arena.active ? this.arenaAdapter : this.ctx.enemyMgr;
    return this.isHost ? this.ctx.enemyMgr : this.shadow;
  }

  // world simulation step (replaces the solo enemy/pickup update)
  updateWorldSim(dt) {
    const { ctx } = this;
    if (this.mode === 'moba') {
      if (this.isHost) {
        const heroes = [{ obj: ctx.player, team: 'player' }];
        if (this.remote.lastSeen) heroes.push({ obj: this.coopProxy, team: 'enemy' });
        this.moba.update(dt, heroes);
        ctx.projectiles.update(dt, this.moba.hostileMgr('player'), [ctx.player, this.coopProxy]);
        ctx.pickups.update(dt, [ctx.player]);
      } else {
        ctx.projectiles.update(dt, this.mobaShadow, [ctx.player]);
        ctx.pickups.update(dt, [ctx.player]);
      }
      return;
    }
    if (this.mode === 'coop') {
      if (this.isHost) {
        const playerTargets = [ctx.player];
        const combatTargets = [ctx.player];
        if (ctx.petTarget) combatTargets.push(ctx.petTarget);
        for (const r of this.remotes.values()) {
          if (!r.lastSeen) continue;
          playerTargets.push(r.proxy);
          combatTargets.push(r.proxy);
          if (!r.petProxy.dead) combatTargets.push(r.petProxy);
        }
        ctx.enemyMgr.update(dt, combatTargets, ctx.projectiles);
        // Pets fight, but never magnet-collect their owner's or allies' loot.
        ctx.pickups.update(dt, playerTargets);
        ctx.projectiles.update(dt, ctx.enemyMgr, combatTargets);
      } else {
        // shadow world handles enemy/pickup rendering; local projectiles hit
        // shadow enemies, and locally-chopped wood still drops locally
        ctx.projectiles.update(dt, this.shadow, [ctx.player]);
        ctx.pickups.update(dt, [ctx.player]);
      }
    } else {
      // pvp: own world, fully local — frozen during the duel
      if (!this.arena.active) {
        const soloTargets = ctx.petTarget ? [ctx.player, ctx.petTarget] : [ctx.player];
        ctx.enemyMgr.update(dt, soloTargets, ctx.projectiles);
        ctx.pickups.update(dt, [ctx.player]);
        ctx.projectiles.update(dt, ctx.enemyMgr, soloTargets);
      } else {
        ctx.projectiles.update(dt, this.arenaAdapter, [ctx.player]);
      }
    }
  }

  // ---------- MOBA event senders ----------
  sendMobaBuild(id, lane) { this.net.sendEvent({ type: 'mbuild', id, lane }); }
  sendMobaReward(xp, meat) { this.net.sendEvent({ type: 'mreward', xp, meat }); }
  sendMobaEnd(partnerWon) { this.net.sendEvent({ type: 'mobaEnd', won: partnerWon }); }

  // local player died — true means "handled, don't show the end screen"
  handleLocalDeath() {
    if (!this.active) return false;
    if (this.arena.active) { this._onArenaDeath(); return true; }
    const { ctx } = this;
    const p = ctx.player;
    const allyUp = this.mode === 'coop'
      && [...this.remotes.values()].some(r => r.lastSeen && !r.dead);
    if (allyUp) {
      // DOWNED: an ally has 20 s to reach you and press E — a rescue
      // costs you nothing; bleeding out costs the usual level + half loot
      this.downedUntil = performance.now() + 20000;
      p.mesh.rotation.z = Math.PI / 2;
      ctx.ui.toast('☠️ You are DOWN! An ally has 20 s to revive you (E)…', 'boss');
      return true;
    }
    this._bleedOut();
    return true;
  }

  // the un-rescued death: level lost, half of everything spilled, wake at camp.
  // `immediate` (player chose to respawn now, pressing X) skips the dramatic
  // pause and stands them up at the cabin right away.
  _bleedOut(immediate = false) {
    const { ctx } = this;
    const p = ctx.player;
    this.downedUntil = null;
    ctx.markDeath?.(p.pos);
    const dropped = ctx.dropHalfMeat(p.pos.clone());
    p.loseLevel();
    p.mesh.rotation.z = Math.PI / 2; // lie down while "out"
    ctx.ui.toast(immediate
      ? `☠️ You wake at the cabin. This level's XP progress is gone; ${dropped} 🍖 spilled where you died.`
      : `☠️ You fell… you wake at the cabin. This level's XP progress is gone; ${dropped} 🍖 spilled where you died.`, 'boss');
    const stand = () => {
      if (!this.active) return;
      p.revive(1);
      p.pos.set(0, 0, 3);
      p.mesh.rotation.z = 0;
    };
    if (immediate) stand(); else setTimeout(stand, 3000);
  }

  // X while downed: give up waiting for a partner rescue and respawn at base now
  respawnNow() {
    if (!this.active || !this.downedUntil || !this.ctx.player.dead) return false;
    document.getElementById('downed-hint')?.classList.add('hidden');
    this._bleedOut(true);
    return true;
  }

  // E near a downed ally revives them (they get half health, no penalty).
  // Returns the nearest revivable RemotePlayer (truthy) or null.
  revivablePartner() {
    if (!this.active || this.mode !== 'coop' || this.ctx.player.dead) return null;
    const p = this.ctx.player.pos;
    let best = null, bestD = 3.2;
    for (const r of this.remotes.values()) {
      if (!r.dead || !r.downed) continue;
      const d = Math.hypot(p.x - r.targetPos.x, p.z - r.targetPos.z);
      if (d < bestD) { best = r; bestD = d; }
    }
    return best;
  }

  tryRevivePartner() {
    const target = this.revivablePartner();
    if (!target) return false;
    this.net.sendEvent({ type: 'revive' }, target.uid);
    this.ctx.ui.toast(`💚 You pull ${target.name} back to their feet!`, 'level');
    audio.sfx('purchase', 0.5, 200);
    return true;
  }

  sendClassHeal(amount, radius = 12, center = null) {
    if (!this.active || this.mode !== 'coop') return false;
    const from = center || this.ctx.player.pos;
    let healed = false;
    for (const r of this.remotes.values()) {
      if (!r.lastSeen || r.dead) continue;
      const to = r.targetPos || r.pos;
      if (!to || Math.hypot(from.x - to.x, from.z - to.z) > radius) continue;
      this.net.sendEvent({ type: 'classHeal', a: Math.max(1, Math.round(amount)) }, r.uid);
      healed = true;
    }
    return healed;
  }

  sendClassRevive(hpFrac = 0.5, radius = 14) {
    if (!this.active || this.mode !== 'coop') return false;
    const from = this.ctx.player.pos;
    let best = null, bestD = radius;
    for (const r of this.remotes.values()) {
      if (!r.lastSeen || !r.dead) continue;
      const to = r.targetPos || r.pos;
      const d = to ? Math.hypot(from.x - to.x, from.z - to.z) : Infinity;
      if (d < bestD) { best = r; bestD = d; }
    }
    if (!best) return false;
    this.net.sendEvent({ type: 'classRevive', hp: Math.max(0.1, Math.min(1, hpFrac)) }, best.uid);
    return true;
  }

  sendCampSync(toUid = null) {
    if (!this.active || this.mode !== 'coop' || !this.ctx.camp) return;
    const camp = this.ctx.camp;
    this.net.sendEvent({ type: 'camp', lv: camp.levels, st: camp.storage, pos: camp.positions,
      ...(camp.gravePos ? { gp: camp.gravePos } : {}) }, toUid);
  }

  sendPing(x, z) {
    if (!this.active) return;
    this.net.sendEvent({ type: 'ping', x: +x.toFixed(1), z: +z.toFixed(1) });
  }

  // guest → host: "spawn this dropped stack/item on the ground for everyone"
  sendDrop(kind, payload, x, z, ownerLock = false) {
    if (!this.active || this.mode !== 'coop') return;
    this.net.sendEvent({ type: 'drop', k: kind, p: payload, x: +x.toFixed(1), z: +z.toFixed(1),
      ...(ownerLock ? { lk: 1 } : {}) });
  }

  // co-op host: every ally eligible for this kill's XP — within 100 m of the
  // kill, or they landed the killing blow from beyond it. Returns uids.
  killShareUids(enemy) {
    if (!this.active || this.mode !== 'coop' || !this.isHost) return [];
    const out = [];
    for (const [uid, r] of this.remotes) {
      const up = r.mesh?.visible && !r.dead;
      const near = up && Math.hypot(r.pos.x - enemy.pos.x, r.pos.z - enemy.pos.z) < 100;
      const credit = enemy.lastHitBy === uid || enemy.lastHitBy === uid + '#pet';
      if (near || credit) out.push(uid);
    }
    return out;
  }

  // did one of my allies (or their pet) land the killing blow?
  killerIsRemote(enemy) {
    for (const uid of this.remotes.keys()) {
      if (enemy.lastHitBy === uid || enemy.lastHitBy === uid + '#pet') return true;
    }
    return false;
  }

  sendKillXp(xp, toUid) {
    this.net.sendEvent({ type: 'xpkill', xp }, toUid);
  }

  // Co-op host: share a slain creature with every ally close enough at the
  // moment of death. The receiving player still decides whether their currently
  // active quest matches this creature/boss/biome.
  shareQuestKill(enemy, radius = 20) {
    if (!this.active || this.mode !== 'coop' || !this.isHost) return;
    for (const r of this.remotes.values()) {
      if (!r.mesh?.visible || r.dead || !r.lastSeen) continue;
      const pos = r.targetPos ?? r.pos;
      if (Math.hypot(pos.x - enemy.pos.x, pos.z - enemy.pos.z) > radius) continue;
      this.net.sendEvent({
        type: 'questKill',
        t: enemy.type,
        b: enemy.bossRank || 0,
        x: +enemy.pos.x.toFixed(1),
        z: +enemy.pos.z.toFixed(1),
        bi: this.ctx.game.dungeon?.poi && enemy.lairId
          ? this.ctx.game.dungeon.poi.ring : undefined,
        pa: enemy.cfg?.passive ? 1 : 0,
      }, r.uid);
    }
  }

  // co-op host: a pickup was magnet-collected by an ally's proxy
  onRemoteCollect(pickup, toUid) {
    this.net.sendEvent({ type: 'grant', kind: pickup.kind, payload: pickup.payload }, toUid);
  }

  sendChop(tree, power) {
    if (this.active && this.mode === 'coop') {
      this.net.sendEvent({ type: 'chop', x: +tree.x.toFixed(1), z: +tree.z.toFixed(1), power });
    }
  }

  sendBerry(key) {
    if (this.active && this.mode === 'coop') this.net.sendEvent({ type: 'berry', k: key });
  }

  // The host computed this hit against my position as it knew it — which is
  // 100–300 ms stale by the time the event arrives. Checking the attacker
  // against where I am NOW rejects nearly every hit on a moving player, so
  // instead the attacker is checked against my recent PATH: if it was within
  // reach of any spot I stood on in the last ~0.6 s, the hit is honest and
  // lands; a true phantom (attacker never near my path) is still rejected.
  _acceptPartnerDamage(ev, player) {
    const wasNear = (x, z, r) => {
      if (x === undefined) return true; // no attacker info → fail open
      const now = performance.now();
      if (Math.hypot(player.pos.x - x, player.pos.z - z) <= r) return true;
      return this._posHist.some(h => now - h.t < 600 && Math.hypot(h.x - x, h.z - z) <= r);
    };

    if (ev.sh) return wasNear(ev.ax, ev.az, (ev.ar ?? 1.4) + 0.8);

    // melee: prefer the attacker as I see it on my screen (shadow enemy),
    // fall back to the position the host reported with the hit
    if (ev.ai !== undefined && this.shadow?.enemies) {
      const attacker = this.shadow.enemies.get(ev.ai);
      if (attacker && !attacker.dying && attacker.mesh.parent
          && wasNear(attacker.mesh.position.x, attacker.mesh.position.z, (ev.ar ?? 1.4) + 0.8)) {
        return true;
      }
    }
    return wasNear(ev.ax, ev.az, (ev.ar ?? 2) + 0.8);
  }

  // ---------- incoming events ----------
  _onEvent(ev) {
    const { ctx } = this;
    const p = ctx.player;
    switch (ev.type) {
      case 'hit': // pvp arena: opponent's attack landed on me
        if (!this.arena.active || p.dead) break;
        {
          const evaded = p.evadeT > 0 || p.flying;
          const source = {
          id: 'partner',
          name: 'your arena opponent',
          pos: ev.ax == null ? null : { x: ev.ax, z: ev.az }, shot: !!ev.sh,
          };
          if (ev.dmg > 0) p.takeDamage(ev.dmg, source);
          if (!evaded && !p.dead) {
            if (ev.bl) p.applyCombatDot?.('bleed', ev.bl, ev.bt || 4, source);
            if (ev.rd) p.applyCombatDot?.('rend', ev.rd, ev.rt || 30, source);
            if (ev.bu) p.applyCombatDot?.('burn', ev.bu, ev.bd || 4, source);
            if (ev.po) p.applyCombatDot?.('poison', ev.po, ev.pt || 3, source);
          }
          if (ev.stun) p.applyStun(ev.stun);
        }
        break;
      case 'arenaDeath': this._onArenaWin(); break;

      case 'pdmg': { // co-op guest: an enemy (simulated on the host) hit me
        if (p.dead) break;
        // lag compensation: the host computed this hit against my STALE proxy
        // position — if the attacker is nowhere near where I actually am now,
        // it's a phantom hit and I reject it.
        if (!this._acceptPartnerDamage(ev, p)) break;
        if (ev.dmg > 0) p.takeDamage(ev.dmg, {
          id: ev.ai,
          pos: ev.ax == null ? null : { x: ev.ax, z: ev.az },
          range: ev.ar,
          shot: !!ev.sh,
        });
        if (ev.stun) p.applyStun(ev.stun);
        break;
      }
      case 'petDmg': { // host-authoritative enemy hit on my streamed companion
        const pet = ctx.petTarget;
        if (!pet || pet.dead || !(ev.dmg > 0)) break;
        pet.takeDamage(ev.dmg, {
          id: ev.ai,
          pos: ev.ax == null ? null : { x: ev.ax, z: ev.az },
        });
        break;
      }
      case 'ehit': { // co-op host: ally damaged enemy #id
        const e = ctx.enemyMgr.list.find(x => x.id === ev.id);
        if (e) {
          const srcId = ev.ps ? `${ev.from}#pet` : (ev.from || 'partner');
          if (ev.dmg > 0) ctx.enemyMgr.damage(e, ev.dmg, null, srcId, {
            crit: !!ev.cr, weakPoint: !!ev.wp,
            ...(ev.ap ? { armorPierce: ev.ap } : {}),
            ...(ev.ab ? { armorBreak: ev.ab, breakDur: ev.ad || 6 } : {}),
            ...(ev.bl ? { bleed: { dps: ev.bl, dur: ev.bt || 4 } } : {}),
            ...(ev.rd ? { rend: { dps: ev.rd, dur: ev.rt || 30 } } : {}),
            ...(ev.bu ? { burn: { dps: ev.bu, dur: ev.bd || 4 } } : {}),
            ...(ev.po ? { poison: { dps: ev.po, dur: ev.pt || 3 } } : {}),
          });
          if (ev.stun) ctx.enemyMgr.stun(e, ev.stun);
        }
        break;
      }
      case 'collect': { // co-op host: an ally wants pickup #id
        const cand = ctx.pickups.list.find(x => x.id === ev.id);
        // the DROPPER can't take their own drop back while the lock runs;
        // everyone else may (matches the magnet rule in pickups.js)
        if (cand && cand.lockT > 0 && cand.lockId === ev.from) break;
        if (cand && !ctx.pickups.collectible(ev.id)) break; // mob-loot pop still running
        const pk = ctx.pickups.removeById(ev.id);
        if (pk) this.onRemoteCollect(pk, ev.from);
        break;
      }
      case 'grant': // co-op guest: host confirmed my pickup
        ctx.grantPickup(ev.kind, ev.payload);
        break;
      case 'xpkill': // co-op guest: shared kill XP (within 100 m of the kill)
        p.kills++;
        p.addXp(ev.xp);
        if (p.classEffects?.lifeOnKillPct) p._healSelf?.(p.maxHp * p.classEffects.lifeOnKillPct);
        ctx.popup(p.mesh.position.clone().setY(p.mesh.position.y + 2.1), `+${ev.xp} XP`, '#c9a4ff');
        audio.sfx('kill_gold', 0.3, 100);
        break;
      case 'questKill': // co-op guest: matching quest progress shared within 20 m
        ctx.onSharedQuestKill?.({
          type: ev.t,
          bossRank: ev.b || 0,
          pos: { x: ev.x, z: ev.z },
          questBiome: Number.isInteger(ev.bi) ? ev.bi : undefined,
          cfg: { passive: !!ev.pa },
        });
        break;
      case 'classHeal':
        if (!p.dead) {
          p._healSelf?.(Math.max(0, ev.a || 0));
          ctx.ui.toast('💚 Your Priest ally healed you.', 'level');
        }
        break;
      case 'classRevive':
        if (p.dead) {
          this.downedUntil = null;
          p.revive(Math.max(0.1, Math.min(1, ev.hp || 0.5)));
          p.mesh.rotation.z = 0;
          ctx.ui.toast('✝️ Your Priest ally resurrected you!', 'level');
          audio.sfx('evolve_ready', 0.55);
        }
        break;
      case 'chop': { // partner chopped a tree — mirror it
        const trees = ctx.world.treesNear({ x: ev.x, z: ev.z }, 1.5);
        if (trees.length) ctx.world.chop(trees[0], ev.power, { x: ev.x + 1, z: ev.z });
        break;
      }
      case 'berry': ctx.world.applyRemoteBerry?.(ev.k); break; // partner emptied a bush
      case 'revive': { // partner picked me up — half health, NO penalty
        if (this.downedUntil && p.dead) {
          this.downedUntil = null;
          p.revive(0.5);
          p.mesh.rotation.z = 0;
          ctx.ui.toast('💚 Your partner revived you!', 'level');
          audio.sfx('evolve_ready', 0.5);
        }
        break;
      }
      case 'camp': ctx.onCampSync?.(ev.lv, ev.st, ev.gp, ev.pos); break; // shared base
      case 'ping': ctx.showPing?.(ev.x, ev.z); break;
      case 'drop': // an ally dropped loot — the host materializes it
        if (this.isHost) ctx.pickups.spawn(ev.k, ev.p, { x: ev.x, z: ev.z }, 0.5,
          ev.lk ? { id: ev.from || 'partner', t: 10 } : null);
        break;
      case 'win': ctx.onCoopWin?.(); break;

      // ---------- MOBA ----------
      case 'mhit': { // host: guest hero damaged unit #id
        const u = this.moba?.units.find(x => x.id === ev.id && x.team !== 'enemy');
        if (u) {
          if (ev.dmg > 0) this.moba.damageUnit(u, ev.dmg, 'partner');
          if (ev.stun && (u.kind === 'creep' || u.kind === 'neutral')) u.stunT = Math.max(u.stunT, ev.stun);
        }
        break;
      }
      case 'mbuild': this.moba?.build('enemy', ev.id, ev.lane || null); break;
      case 'mreward': // guest: my kill on the host's sim
        p.addXp(ev.xp);
        p.meat = roundResource(p.meat + ev.meat);
        ctx.popup(p.mesh.position.clone().setY(p.mesh.position.y + 2.1), `+${ev.xp} XP +${ev.meat} 🍖`, '#c9a4ff');
        audio.sfx('kill_gold', 0.3, 100);
        break;
      case 'mobaEnd': ctx.endMoba(ev.won); break;
    }
  }

  broadcastWin() {
    if (this.active && this.mode === 'coop') this.net.sendEvent({ type: 'win' });
  }

  dispose() {
    this.active = false;
    this.arena.active = false;
    this.ctx.world.removeArena();
    for (const r of this.remotes.values()) r.dispose();
    this.remotes.clear();
    this._campSyncedTo.clear();
    this.shadow?.dispose(); this.shadow = null;
    this.mobaShadow?.dispose(); this.mobaShadow = null;
    document.getElementById('mp-status')?.classList.add('hidden');
    document.getElementById('downed-hint')?.classList.add('hidden');
    this.net.leave();
  }
}
