// ---- Hold-Shift target lock (single + opt-in multi) ----
// Holding Shift raises a centre-screen reticle and locks the unit(s) nearest to
// the screen centre (within MAX_RANGE). Normally exactly ONE unit is locked.
// If a slotted ability supports multi-marking (player.multiSelectCap() > 1),
// up to that many nearest units are locked at once. Each locked unit gets a
// pulsing energy column + ground ring + a one-shot vertical "scan" sweep, and a
// lock-on blip plays whenever a new unit joins the set. Abilities read
// player._selectedTarget (primary) and player._selectedTargets (the whole set).

import * as THREE from 'three';
import { audio } from './audio.js';

const MAX_RANGE = 35;          // metres — nothing further can be locked
const MAX_RANGE_2 = MAX_RANGE * MAX_RANGE;
const TOL_SINGLE = 0.55;       // NDC radius from centre a unit must fall within (single)
const TOL_MULTI = 0.95;        // wider grab so a cluster gets marked (multi)

export class Targeting {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.selected = null;      // primary locked unit (nearest to centre)
    this.spin = 0;
    this._v = new THREE.Vector3();
    this._markedIds = new Set();
    this.markers = [];         // pool, one per locked unit
    this._reticle = null;
  }

  _addMat(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
  }

  _makeMarker() {
    const g = new THREE.Group();
    g.visible = false;
    const ringGeo = new THREE.RingGeometry(0.82, 1.0, 44); ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this._addMat(0xff5a44, 0.85));
    const retGeo = new THREE.TorusGeometry(1.12, 0.05, 6, 4); retGeo.rotateX(-Math.PI / 2);
    const reticle = new THREE.Mesh(retGeo, this._addMat(0xffd08a, 0.9));
    const colGeo = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
    const column = new THREE.Mesh(colGeo, this._addMat(0xff7a5a, 0.16));
    column.material.side = THREE.BackSide;
    const scanGeo = new THREE.RingGeometry(0.7, 0.98, 40); scanGeo.rotateX(-Math.PI / 2);
    const scan = new THREE.Mesh(scanGeo, this._addMat(0x9fe8ff, 0));
    g.add(ring, reticle, column, scan);
    this.scene.add(g);
    return { group: g, ring, reticle, column, scan, scanT: 0, id: null };
  }

  _marker(i) {
    while (this.markers.length <= i) this.markers.push(this._makeMarker());
    return this.markers[i];
  }

  _reticleEl() {
    if (!this._reticle) this._reticle = document.getElementById('reticle');
    return this._reticle;
  }

  // `alive` is enemyMgr.alive() — the candidate units.
  update(dt, { input, player, alive }) {
    const on = !!input?.selecting && !player?.dead;
    const el = this._reticleEl();
    if (el) el.classList.toggle('hidden', !on);

    if (!on) {
      if (player) { player._selectedTarget = null; player._selectedTargets = []; }
      this.selected = null;
      this._markedIds.clear();
      for (const m of this.markers) m.group.visible = false;
      return;
    }

    const cap = Math.max(1, player.multiSelectCap?.() || 1);
    const multi = cap > 1;
    const tol = multi ? TOL_MULTI : TOL_SINGLE;

    // rank every candidate by how close it projects to the screen centre
    const cands = [];
    for (const e of alive || []) {
      // critters (passive herds) can be Shift-locked too now — some abilities
      // hunt them for meat/XP, so they must be markable like any other unit.
      if (!e || e.dying || e.dead || !e.pos) continue;
      const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z;
      if (dx * dx + dz * dz > MAX_RANGE_2) continue;
      this._v.copy(e.mesh?.position ?? e.pos).project(this.camera);
      if (this._v.z > 1) continue;                 // behind the camera
      const s = Math.hypot(this._v.x, this._v.y);
      if (s > tol) continue;
      cands.push({ e, s });
    }
    cands.sort((a, b) => a.s - b.s);
    const picked = cands.slice(0, cap).map(c => c.e);

    player._selectedTargets = picked;
    player._selectedTarget = picked[0] || null;
    this.selected = picked[0] || null;
    if (el) {
      el.classList.toggle('locked', picked.length > 0);
      el.classList.toggle('multi', multi);
    }

    // blip whenever a NEW unit enters the locked set
    const ids = new Set(picked.map(e => e.id));
    let added = false;
    for (const id of ids) if (!this._markedIds.has(id)) { added = true; break; }
    this._markedIds = ids;
    if (added) audio.sfx('select', 0.5, 90);

    // drive one marker per locked unit; hide the rest
    this.spin += dt * 2.2;
    for (let i = 0; i < picked.length; i++) this._animateMarker(this._marker(i), picked[i], dt);
    for (let i = picked.length; i < this.markers.length; i++) this.markers[i].group.visible = false;
  }

  _animateMarker(m, e, dt) {
    if (m.id !== e.id) { m.id = e.id; m.scanT = 0.55; } // fresh lock → replay scan
    m.group.visible = true;

    const r = Math.max(0.7, (e.hitR || 0.6) * 1.7);
    const height = Math.max(1.6, (e.hitR || 0.6) * 3.4);
    const cx = e.pos.x, cz = e.pos.z;
    const base = (e.mesh?.position?.y ?? e.pos.y ?? 0);
    const pulse = 0.7 + 0.3 * Math.sin(this.spin * 3);

    m.ring.position.set(cx, base + 0.06, cz);
    m.ring.scale.setScalar(r);
    m.ring.rotation.y = this.spin * 0.5;
    m.ring.material.opacity = 0.55 + 0.35 * pulse;

    m.reticle.position.set(cx, base + 0.08, cz);
    m.reticle.scale.setScalar(r * 1.04);
    m.reticle.rotation.y = -this.spin;

    m.column.position.set(cx, base + height / 2, cz);
    m.column.scale.set(r, height, r);
    m.column.material.opacity = 0.10 + 0.08 * pulse;

    if (m.scanT > 0) {
      m.scanT -= dt;
      const k = 1 - Math.max(0, m.scanT) / 0.55;
      m.scan.visible = true;
      m.scan.position.set(cx, base + 0.1 + k * height, cz);
      m.scan.scale.setScalar(r * (1.0 + 0.15 * Math.sin(k * Math.PI)));
      m.scan.material.opacity = 0.9 * (1 - k);
    } else {
      m.scan.visible = false;
    }
  }
}
