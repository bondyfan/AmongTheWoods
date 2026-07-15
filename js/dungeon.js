// ---- Lair dungeons: a WoW-style instanced interior for every named boss ----
//
// A DungeonWorld is a POCKET dimension: a walled corridor + boss hall built
// 60 m below the overworld at the lair's map spot (the corridor runs toward
// the world center so it always stays in bounds). While you're inside, the
// main loop's `world` reference points HERE, so movement, collision, spawns
// and pickups all live on the dungeon floor; the overworld sleeps untouched
// and is swapped back the moment you leave.
//
// It implements the small "world interface" the game loop consumes:
//   heightAt / collide / update / time / clampToBand / treesNear / poisNear /
//   isWater / dispose  (+ everything else the loop calls via ?. is absent)

import * as THREE from 'three';
import { mat, makeCobweb } from './models.js';

const FLOOR_Y = -60;      // far below any overworld terrain
const ENTRY_R = 8;        // the round antechamber you arrive in
const CORR_L = 84;        // corridor length
const CORR_W = 13;        // corridor width
const HALL_R = 21;        // the boss hall

export class DungeonWorld {
  constructor(scene, { entry, lair }) {
    this.scene = scene;
    this.lair = lair;
    this.time = 0;
    this.exitOpen = false;
    this.pois = [];
    this.obstacles = [];
    this.safeZones = [];

    // corridor axis: from the entry toward the WORLD CENTER (always in-bounds)
    const len = Math.hypot(entry.x, entry.z) || 1;
    this.u = { x: -entry.x / len, z: -entry.z / len };
    this.v = { x: -this.u.z, z: this.u.x };
    this.entry = { x: entry.x, z: entry.z };
    const hallD = ENTRY_R + CORR_L + HALL_R - 5;
    this.hallC = { x: entry.x + this.u.x * hallD, z: entry.z + this.u.z * hallD };
    this.exitAt = { x: this.hallC.x + this.u.x * (HALL_R - 4), z: this.hallC.z + this.u.z * (HALL_R - 4) };
    this.doorAt = { x: entry.x - this.u.x * (ENTRY_R - 3), z: entry.z - this.u.z * (ENTRY_R - 3) };

    this._build();
  }

  // point s metres down the corridor, t metres off its centerline
  corridorPoint(s, t = 0) {
    return { x: this.entry.x + this.u.x * s + this.v.x * t,
             z: this.entry.z + this.u.z * s + this.v.z * t };
  }
  hallPoint(off) { return { x: this.hallC.x + this.v.x * off, z: this.hallC.z + this.v.z * off }; }
  hallCenter() { return { ...this.hallC }; }
  startPos() { return this.corridorPoint(2, 0); }

  // ---------- world interface ----------
  heightAt() { return FLOOR_Y; }
  isWater() { return false; }
  treesNear() { return []; }
  poisNear() { return []; }

  update(dt) {
    this.time += dt;
    // torch flames never burn steady
    for (const t of this._torches) {
      t.light.intensity = t.base + Math.sin(this.time * 9 + t.ph) * 0.22
        + Math.sin(this.time * 21.7 + t.ph * 2) * 0.12;
    }
    if (this.exitOpen && this._exitRing) {
      this._exitRing.rotation.z += dt * 1.2;
      this._exitRing.scale.setScalar(1 + Math.sin(this.time * 3) * 0.06);
    }
    if (this._entryRing) this._entryRing.rotation.z -= dt * 0.8;
  }

  // nearest point inside the walkable union (entry disc ∪ corridor ∪ hall)
  _clampPoint(x, z, pad) {
    const cand = [];
    // entry disc
    {
      const dx = x - this.entry.x, dz = z - this.entry.z;
      const d = Math.hypot(dx, dz), r = ENTRY_R - pad;
      cand.push(d <= r ? { x, z, d: 0 }
        : { x: this.entry.x + dx / d * r, z: this.entry.z + dz / d * r, d: d - r });
    }
    // corridor rectangle
    {
      const rx = x - this.entry.x, rz = z - this.entry.z;
      const s = rx * this.u.x + rz * this.u.z;
      const t = rx * this.v.x + rz * this.v.z;
      const cs = Math.max(2, Math.min(ENTRY_R + CORR_L + 4, s));
      const ct = Math.max(-(CORR_W / 2 - pad), Math.min(CORR_W / 2 - pad, t));
      const qx = this.entry.x + this.u.x * cs + this.v.x * ct;
      const qz = this.entry.z + this.u.z * cs + this.v.z * ct;
      cand.push({ x: qx, z: qz, d: Math.hypot(x - qx, z - qz) });
    }
    // hall disc
    {
      const dx = x - this.hallC.x, dz = z - this.hallC.z;
      const d = Math.hypot(dx, dz), r = HALL_R - pad;
      cand.push(d <= r ? { x, z, d: 0 }
        : { x: this.hallC.x + dx / d * r, z: this.hallC.z + dz / d * r, d: d - r });
    }
    cand.sort((a, b) => a.d - b.d);
    return cand[0];
  }

  collide(pos, r = 0.45) {
    const c = this._clampPoint(pos.x, pos.z, Math.max(0.6, r));
    pos.x = c.x; pos.z = c.z;
  }

  clampToBand(x, z) { const c = this._clampPoint(x, z, 1.2); return { x: c.x, z: c.z }; }

  openExit() {
    this.exitOpen = true;
    if (this._exitRing) this._exitRing.visible = true;
    if (this._exitGlow) this._exitGlow.visible = true;
  }
  atExit(pos) {
    return this.exitOpen && Math.hypot(pos.x - this.exitAt.x, pos.z - this.exitAt.z) < 3.5;
  }
  atEntrance(pos) {
    return Math.hypot(pos.x - this.doorAt.x, pos.z - this.doorAt.z) < 3.2;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(o => { o.geometry?.dispose?.(); });
  }

  // ---------- geometry ----------
  _build() {
    const th = this.lair.theme ?? {};
    const g = this.group = new THREE.Group();
    this._torches = [];
    const floorMat = new THREE.MeshLambertMaterial({ color: th.floor ?? 0x2a2a30 });
    const wallMat = new THREE.MeshLambertMaterial({ color: th.wall ?? 0x3a3a44 });

    const flat = (geo, x, z, y = FLOOR_Y) => {
      const m = new THREE.Mesh(geo, floorMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      return m;
    };
    // floor: entry disc + corridor strip + hall disc
    g.add(flat(new THREE.CircleGeometry(ENTRY_R + 1.5, 22), this.entry.x, this.entry.z));
    const corr = flat(new THREE.PlaneGeometry(CORR_W + 3, CORR_L + 12), 0, 0);
    const mid = this.corridorPoint(ENTRY_R + CORR_L / 2 - 2, 0);
    corr.position.set(mid.x, FLOOR_Y - 0.02, mid.z);
    corr.rotation.z = -Math.atan2(this.u.x, this.u.z); // align strip with the axis
    g.add(corr);
    g.add(flat(new THREE.CircleGeometry(HALL_R + 1.5, 26), this.hallC.x, this.hallC.z));

    // walls: rough blocks ringing every region (visual only — collide() is math)
    const wallBlock = (x, z, s = 1) => {
      const h = 4.5 + Math.random() * 2.5;
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.6 * s, h, 2.6 * s), wallMat);
      m.position.set(x + (Math.random() - 0.5) * 0.7, FLOOR_Y + h / 2 - 0.3, z + (Math.random() - 0.5) * 0.7);
      m.rotation.y = Math.random() * Math.PI;
      m.castShadow = true;
      g.add(m);
    };
    for (let a = 0; a < Math.PI * 2; a += 0.42) { // antechamber ring (leave the corridor mouth)
      const px = this.entry.x + Math.cos(a) * (ENTRY_R + 1.6);
      const pz = this.entry.z + Math.sin(a) * (ENTRY_R + 1.6);
      const toC = (px - this.entry.x) * this.u.x + (pz - this.entry.z) * this.u.z;
      if (toC > ENTRY_R * 0.55) continue; // gap toward the corridor
      wallBlock(px, pz);
    }
    for (let s = ENTRY_R + 1; s < ENTRY_R + CORR_L + 2; s += 3.4) { // corridor edges
      for (const side of [-1, 1]) {
        const p = this.corridorPoint(s, side * (CORR_W / 2 + 1.6));
        wallBlock(p.x, p.z);
      }
    }
    for (let a = 0; a < Math.PI * 2; a += 0.3) { // hall ring (gap at the corridor mouth)
      const px = this.hallC.x + Math.cos(a) * (HALL_R + 1.6);
      const pz = this.hallC.z + Math.sin(a) * (HALL_R + 1.6);
      const toE = (px - this.hallC.x) * -this.u.x + (pz - this.hallC.z) * -this.u.z;
      if (toE > HALL_R * 0.82) continue;
      wallBlock(px, pz, 1.15);
    }

    this._props(g, th.prop ?? 'pillar');

    // torches: pooled warm lights along the way (the only light down here)
    const torch = (x, z, color = 0xffb45a, base = 1.7) => {
      const light = new THREE.PointLight(color, base, 26, 1.5);
      light.position.set(x, FLOOR_Y + 3.2, z);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffc86a }));
      flame.position.copy(light.position);
      g.add(light, flame);
      this._torches.push({ light, base, ph: Math.random() * 9 });
    };
    torch(this.entry.x, this.entry.z);
    for (const s of [24, 46, 68]) { const p = this.corridorPoint(s, 0); torch(p.x, p.z); }
    torch(this.hallC.x, this.hallC.z, 0xff8a4a, 2.2); // the hall burns hotter
    const hp = this.hallPoint(HALL_R * 0.55);
    const hp2 = this.hallPoint(-HALL_R * 0.55);
    torch(hp.x, hp.z); torch(hp2.x, hp2.z);

    // entrance arch: a cool-blue ring you can always flee back through (E)
    this._entryRing = this._portal(this.doorAt, 0x7fd1ff);
    // exit portal: hidden until the master falls
    this._exitRing = this._portal(this.exitAt, 0x7fe07f);
    this._exitRing.visible = false;
    const glow = new THREE.PointLight(0x7fe07f, 1.6, 18, 1.6);
    glow.position.set(this.exitAt.x, FLOOR_Y + 2.4, this.exitAt.z);
    glow.visible = false;
    this._exitGlow = glow;
    g.add(glow);

    this.scene.add(g);
  }

  _portal(at, color) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.16, 8, 22),
      new THREE.MeshBasicMaterial({ color }));
    ring.position.set(at.x, FLOOR_Y + 2.1, at.z);
    ring.rotation.y = Math.atan2(this.u.x, this.u.z);
    this.group.add(ring);
    return ring;
  }

  // theme dressing scattered along the walls — each den reads as ITS boss
  _props(g, kind) {
    const th = this.lair.theme ?? {};
    const spots = [];
    for (let s = ENTRY_R + 4; s < ENTRY_R + CORR_L; s += 5.5) {
      spots.push(this.corridorPoint(s, (Math.random() < 0.5 ? -1 : 1) * (CORR_W / 2 - 1.6)));
    }
    for (let a = 0; a < Math.PI * 2; a += 0.7) {
      spots.push({ x: this.hallC.x + Math.cos(a) * (HALL_R - 2.5),
                   z: this.hallC.z + Math.sin(a) * (HALL_R - 2.5) });
    }
    for (const p of spots) {
      let m = null;
      if (kind === 'web') {
        if (Math.random() < 0.55) {
          m = makeCobweb();
          m.position.set(p.x, FLOOR_Y + 0.06, p.z);
        } else { // egg sac
          m = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.5, 7, 6),
            mat(0xe8e4d8));
          m.scale.y = 1.25;
          m.position.set(p.x, FLOOR_Y + 0.5, p.z);
        }
      } else if (kind === 'sand') {
        m = new THREE.Mesh(new THREE.ConeGeometry(0.8 + Math.random() * 0.6, 2.2 + Math.random() * 1.6, 6),
          mat(th.wall ?? 0x9a7c48));
        m.position.set(p.x, FLOOR_Y + 1.1, p.z);
      } else if (kind === 'bone') {
        m = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.6 + Math.random(), 5),
            mat(0xe8e2d0));
          b.rotation.set(Math.random() * 0.8, Math.random() * Math.PI, Math.PI / 2 - 0.4 + Math.random() * 0.8);
          b.position.set((Math.random() - 0.5) * 0.8, 0.25, (Math.random() - 0.5) * 0.8);
          m.add(b);
        }
        m.position.set(p.x, FLOOR_Y, p.z);
      } else if (kind === 'ghost') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 4.6 + Math.random() * 1.6, 6),
          mat(th.wall ?? 0x3a3a48));
        m.position.set(p.x, FLOOR_Y + 2.4, p.z);
      } else if (kind === 'vine') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 4.5 + Math.random() * 2, 5),
          mat(0x3a7a2e));
        m.rotation.z = (Math.random() - 0.5) * 0.5;
        m.position.set(p.x, FLOOR_Y + 2.2, p.z);
      } else if (kind === 'ice') {
        m = new THREE.Mesh(new THREE.ConeGeometry(0.7 + Math.random() * 0.7, 2.6 + Math.random() * 2.4, 5),
          new THREE.MeshLambertMaterial({ color: 0xcfe6f2, emissive: 0x223744 }));
        m.position.set(p.x, FLOOR_Y + 1.4, p.z);
        m.rotation.y = Math.random() * Math.PI;
      } else if (kind === 'mud') {
        m = new THREE.Mesh(new THREE.SphereGeometry(1.0 + Math.random() * 0.7, 7, 5),
          mat(th.wall ?? 0x39402a));
        m.scale.y = 0.35;
        m.position.set(p.x, FLOOR_Y + 0.15, p.z);
      } else { // pillar
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 5, 6), mat(th.wall ?? 0x3a3a44));
        m.position.set(p.x, FLOOR_Y + 2.5, p.z);
      }
      if (m) g.add(m);
    }
  }
}
