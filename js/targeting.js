// ---- Hold-Shift target lock ----
// Holding Shift raises a centre-screen reticle and locks the unit nearest to
// the screen centre (within MAX_RANGE). The locked unit gets a pulsing energy
// column + ground ring + a one-shot vertical "scan" sweep, and a lock-on
// blip plays on each new lock. Single-target abilities read player._selectedTarget.

import * as THREE from 'three';
import { audio } from './audio.js';

const MAX_RANGE = 35;          // metres — nothing further can be locked
const MAX_RANGE_2 = MAX_RANGE * MAX_RANGE;
const CENTER_TOLERANCE = 0.55; // NDC radius from screen centre the unit must fall within

export class Targeting {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.selected = null;      // the locked Enemy (or unit) object
    this._selId = null;
    this.scanT = 0;            // one-shot scan sweep timer
    this.spin = 0;
    this._v = new THREE.Vector3();
    this._buildMarker();
    this._reticle = null;      // DOM crosshair, attached lazily
  }

  _buildMarker() {
    const g = new THREE.Group();
    g.visible = false;
    const addMat = (color, opacity) => new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    // ground ring under the unit
    const ringGeo = new THREE.RingGeometry(0.82, 1.0, 44); ringGeo.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(ringGeo, addMat(0xff5a44, 0.85));
    // spinning reticle ring (a dashed look via a thin torus)
    const retGeo = new THREE.TorusGeometry(1.12, 0.05, 6, 4); retGeo.rotateX(-Math.PI / 2);
    this.reticle = new THREE.Mesh(retGeo, addMat(0xffd08a, 0.9));
    // an open energy column around the body — reads as a highlight outline
    const colGeo = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
    this.column = new THREE.Mesh(colGeo, addMat(0xff7a5a, 0.16));
    this.column.material.side = THREE.BackSide;
    // scan ring that sweeps up the column once on lock
    const scanGeo = new THREE.RingGeometry(0.7, 0.98, 40); scanGeo.rotateX(-Math.PI / 2);
    this.scan = new THREE.Mesh(scanGeo, addMat(0x9fe8ff, 0));
    g.add(this.ring, this.reticle, this.column, this.scan);
    this.marker = g;
    this.scene.add(g);
  }

  _reticleEl() {
    if (this._reticle) return this._reticle;
    this._reticle = document.getElementById('reticle');
    return this._reticle;
  }

  // Called each frame. `alive` is an array of candidate units (enemyMgr.alive()).
  update(dt, { input, player, alive }) {
    const on = !!input?.selecting && !player?.dead;
    const el = this._reticleEl();
    if (el) el.classList.toggle('hidden', !on);

    if (!on) { this._setSelected(null, player); this.marker.visible = false; return; }

    // pick the unit nearest the screen centre, within range and in front of us
    let best = null, bestScore = Infinity;
    for (const e of alive || []) {
      if (!e || e.dying || e.dead || !e.pos || e.cfg?.passive) continue;
      const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z;
      if (dx * dx + dz * dz > MAX_RANGE_2) continue;
      this._v.copy(e.mesh?.position ?? e.pos).project(this.camera);
      if (this._v.z > 1) continue;                     // behind the camera
      const s = Math.hypot(this._v.x, this._v.y);      // NDC distance from centre
      if (s > CENTER_TOLERANCE) continue;
      if (s < bestScore) { bestScore = s; best = e; }
    }
    this._setSelected(best, player);
    if (el) el.classList.toggle('locked', !!best);

    this._animate(dt, player);
  }

  _setSelected(next, player) {
    if (next === this.selected) {
      // still valid? drop it if it died / went out of range
      if (next && (next.dying || next.dead
        || (player && Math.hypot(next.pos.x - player.pos.x, next.pos.z - player.pos.z) > MAX_RANGE + 4))) {
        this.selected = null; this._selId = null;
        if (player) player._selectedTarget = null;
      }
      return;
    }
    this.selected = next;
    this._selId = next?.id ?? null;
    if (player) player._selectedTarget = next;
    if (next) { this.scanT = 0.55; audio.sfx('select', 0.5, 90); }
  }

  _animate(dt, player) {
    const e = this.selected;
    if (!e || e.dying || e.dead) { this.marker.visible = false; return; }
    this.marker.visible = true;
    this.spin += dt * 2.2;

    const r = Math.max(0.7, (e.hitR || 0.6) * 1.7);
    const height = Math.max(1.6, (e.hitR || 0.6) * 3.4);
    const cx = e.pos.x, cz = e.pos.z;
    const base = (e.mesh?.position?.y ?? e.pos.y ?? 0);

    this.ring.position.set(cx, base + 0.06, cz);
    this.ring.scale.setScalar(r);
    this.ring.rotation.y = this.spin * 0.5;
    const pulse = 0.7 + 0.3 * Math.sin(this.spin * 3);
    this.ring.material.opacity = 0.55 + 0.35 * pulse;

    this.reticle.position.set(cx, base + 0.08, cz);
    this.reticle.scale.setScalar(r * 1.04);
    this.reticle.rotation.y = -this.spin;

    this.column.position.set(cx, base + height / 2, cz);
    this.column.scale.set(r, height, r);
    this.column.material.opacity = 0.10 + 0.08 * pulse;

    // one-shot scan sweep up the body
    if (this.scanT > 0) {
      this.scanT -= dt;
      const k = 1 - Math.max(0, this.scanT) / 0.55;   // 0→1
      this.scan.visible = true;
      this.scan.position.set(cx, base + 0.1 + k * height, cz);
      this.scan.scale.setScalar(r * (1.0 + 0.15 * Math.sin(k * Math.PI)));
      this.scan.material.opacity = 0.9 * (1 - k);
    } else {
      this.scan.visible = false;
    }
  }
}
