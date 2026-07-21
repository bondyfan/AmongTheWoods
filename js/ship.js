// ---- The pirate ship line ----
// A big square-rigged ship runs between the island's two harbors: the Cape
// Harbor on the Jungle's southern tip and Frost Landing on the Frozen
// Peak's western shore. Timetable (all from SHIP in config.js):
//   docked DOCK_T s (gangplank down — time to board, E at the pier)
//   sails out for SAIL_T s, then TELEPORTS across the ocean and sails the
//   last SAIL_T s into the other harbor — nobody rides the whole way round.
// The whole voyage is a pure function of world time, so co-op clients agree
// on where the ship is without any networking.

import * as THREE from 'three';
import { SHIP } from './config.js';

const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
const box = (w, h, d, c) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c));
  m.castShadow = true;
  return m;
};

// a wooden pier reaching from the beach out over the sea (local +z = out)
export function makePier() {
  const g = new THREE.Group();
  const deck = box(4.2, 0.18, 30, 0x8a6238);
  deck.position.set(0, 0.75, 9);
  deck.receiveShadow = true;
  g.add(deck);
  for (let z = -5; z <= 23; z += 1.1) { // plank seams
    const plank = box(4.26, 0.04, 0.1, 0x6e4d2a);
    plank.position.set(0, 0.86, z);
    g.add(plank);
  }
  for (const side of [-1, 1]) { // piles + mooring posts
    for (let z = -4; z <= 23; z += 4.5) {
      const pile = box(0.28, 3.4, 0.28, 0x5c4326);
      pile.position.set(side * 1.95, -0.7, z);
      g.add(pile);
    }
    const bollard = box(0.3, 0.9, 0.3, 0x4c3520);
    bollard.position.set(side * 1.8, 1.2, 22.5);
    g.add(bollard);
  }
  // a lantern post at the pier head so the harbor reads from afar
  const post = box(0.16, 2.6, 0.16, 0x4c3520);
  post.position.set(-1.7, 2.0, 21.5);
  g.add(post);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd98a }));
  lantern.position.set(-1.7, 3.1, 21.5);
  g.add(lantern);
  return g;
}

// the big ship (local +z = bow). Low-poly pirate silhouette: dark hull,
// raised quarterdeck, two masts of square sails and a black flag.
export function makeShip() {
  const g = new THREE.Group();
  const hullC = 0x4a3423, trimC = 0x2e1f14, deckC = 0x8a6238, sailC = 0xe8e0cc;
  // hull: three stacked, tapering boxes fake the curve
  const keel = box(4.2, 1.4, 16, trimC); keel.position.y = 0.2; g.add(keel);
  const hull = box(5.2, 1.5, 19, hullC); hull.position.y = 1.4; g.add(hull);
  const gunwale = box(5.5, 0.5, 19.6, trimC); gunwale.position.y = 2.3; g.add(gunwale);
  const deck = box(4.8, 0.15, 18.6, deckC); deck.position.y = 2.6; deck.receiveShadow = true; g.add(deck);
  // bow wedge + bowsprit
  const bow = box(2.2, 1.8, 3.4, hullC);
  bow.position.set(0, 1.6, 10.6); bow.rotation.x = 0.35; g.add(bow);
  const sprit = box(0.24, 0.24, 5.2, trimC);
  sprit.position.set(0, 3.0, 12.6); sprit.rotation.x = -0.28; g.add(sprit);
  // raised quarterdeck at the stern with the wheel
  const quarter = box(4.6, 1.4, 4.6, hullC); quarter.position.set(0, 3.2, -7.6); g.add(quarter);
  const qdeck = box(4.2, 0.14, 4.2, deckC); qdeck.position.set(0, 4.0, -7.6); g.add(qdeck);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 6, 10), lam(0x3a2a18));
  wheel.position.set(0, 4.9, -6.2); g.add(wheel);
  // masts + square sails
  for (const [mz, mh, sw] of [[3.5, 11, 6.2], [-3.2, 9.5, 5.4]]) {
    const mast = box(0.34, mh, 0.34, trimC);
    mast.position.set(0, 2.6 + mh / 2, mz); g.add(mast);
    for (const [sy, sh] of [[0.62, 3.2], [0.32, 2.4]]) {
      const sail = box(sw, sh, 0.12, sailC);
      sail.position.set(0, 2.6 + mh * sy, mz - 0.35);
      g.add(sail);
      const yard = box(sw + 0.7, 0.14, 0.14, trimC);
      yard.position.set(0, 2.6 + mh * sy + sh / 2 + 0.1, mz - 0.2);
      g.add(yard);
    }
  }
  // the black flag
  const flag = box(1.5, 0.9, 0.06, 0x17181c);
  flag.position.set(0.8, 2.6 + 11 + 0.5, 3.5);
  g.add(flag);
  // side lanterns
  for (const side of [-1, 1]) {
    const lt = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    lt.position.set(side * 2.6, 3.2, -9.2);
    g.add(lt);
  }
  return g;
}

// ---- the timetable + motion ----
// One full loop: dock A → sail out → (teleport) → sail in → dock B → sail
// out → (teleport) → sail in → back to dock A.
const LEG_T = SHIP.SAIL_T * 2;
const CYCLE = (SHIP.DOCK_T + LEG_T) * 2;

export class ShipLine {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mesh = null;
    this.rider = null;      // the player object while aboard
    this.state = { phase: 'away', harbor: null, from: null, to: null };
    if ((world.harbors?.length ?? 0) >= 2) {
      this.mesh = makeShip();
      this.scene.add(this.mesh);
    }
  }

  dispose() {
    if (this.mesh) this.scene.remove(this.mesh);
    this.mesh = null;
    this.rider = null;
  }

  // where the ship floats while docked: alongside the pier head
  _dockPos(h) {
    // starboard side against the pier: offset sideways from the pier line
    const sideX = h.outZ, sideZ = -h.outX; // perpendicular to "out"
    return {
      x: h.x + h.outX * 20 + sideX * 5.4,
      z: h.z + h.outZ * 20 + sideZ * 5.4,
      headX: sideX, headZ: sideZ, // moored facing along the coast
    };
  }

  // deterministic position/heading for a moment of the cycle
  _poseAt(time) {
    const [A, B] = this.world.harbors;
    const t = ((time % CYCLE) + CYCLE) % CYCLE;
    const seg = (from, to, u) => ({ from, to, u });
    let leg;
    if (t < SHIP.DOCK_T) return { phase: 'docked', harbor: A, ...this._dockPos(A) };
    else if (t < SHIP.DOCK_T + LEG_T) leg = seg(A, B, (t - SHIP.DOCK_T) / LEG_T);
    else if (t < SHIP.DOCK_T * 2 + LEG_T) return { phase: 'docked', harbor: B, ...this._dockPos(B) };
    else leg = seg(B, A, (t - SHIP.DOCK_T * 2 - LEG_T) / LEG_T);

    // each half of the leg hugs one harbor: out from `from`, in to `to`
    // (the jump between halves IS the mid-ocean teleport)
    const { from, to, u } = leg;
    const out = u < 0.5;
    const h = out ? from : to;
    const d = this._dockPos(h);
    // distance along the ship's escape/approach arc
    const k = out ? u * 2 : (1 - u) * 2;         // 1 at the far point, 0 at dock
    const run = SHIP.SPEED * SHIP.SAIL_T * k;     // meters from the dock
    const dir = out ? 1 : -1;                     // out: bow along heading
    const x = d.x + d.headX * run * dir + h.outX * run * 0.45;
    const z = d.z + d.headZ * run * dir + h.outZ * run * 0.45;
    // heading: away from dock when leaving, toward it when arriving
    const hx = d.headX * dir + h.outX * 0.45 * dir;
    const hz = d.headZ * dir + h.outZ * 0.45 * dir;
    const hl = Math.hypot(hx, hz) || 1;
    return { phase: out ? 'out' : 'in', harbor: null, from, to,
             x, z, headX: hx / hl, headZ: hz / hl };
  }

  // harbor with a boarded gangplank near this point (for the E prompt)
  boardableAt(pos, time) {
    const p = this._poseAt(time);
    if (p.phase !== 'docked') return null;
    const h = p.harbor;
    const head = { x: h.x + h.outX * 21, z: h.z + h.outZ * 21 };
    return Math.hypot(pos.x - head.x, pos.z - head.z) < 9 ? h : null;
  }

  // seconds until the docked ship casts off (null when not docked)
  departureIn(time) {
    const t = ((time % CYCLE) + CYCLE) % CYCLE;
    if (t < SHIP.DOCK_T) return SHIP.DOCK_T - t;
    if (t >= SHIP.DOCK_T + LEG_T && t < SHIP.DOCK_T * 2 + LEG_T) {
      return SHIP.DOCK_T * 2 + LEG_T - t;
    }
    return null;
  }

  // seconds until the ship next lies moored at THIS harbor (0 while docked
  // there) — the pier signboard countdown
  nextDockIn(harbor, time) {
    const [A] = this.world.harbors;
    const t = ((time % CYCLE) + CYCLE) % CYCLE;
    const start = harbor === A ? 0 : SHIP.DOCK_T + LEG_T;
    const end = start + SHIP.DOCK_T;
    if (t >= start && t < end) return 0;
    return ((start - t) % CYCLE + CYCLE) % CYCLE;
  }

  board(player) { this.rider = player; }

  // Move the ship (and its rider). Returns 'arrived' the moment a carried
  // player should be set down on the destination pier.
  update(time) {
    if (!this.mesh) return null;
    const p = this._poseAt(time);
    const bob = Math.sin(time * 0.8) * 0.12;
    this.mesh.position.set(p.x, -0.85 + bob, p.z);
    this.mesh.rotation.y = Math.atan2(p.headX, p.headZ);
    this.mesh.rotation.z = Math.sin(time * 0.6) * 0.015;
    const prevPhase = this.state.phase;
    this.state = p;
    if (this.rider) {
      // the rider stands amidships, riding every bob and teleport
      this.rider.pos.x = p.x;
      this.rider.pos.z = p.z;
      if (p.phase === 'docked' && prevPhase === 'in') {
        // set the traveller down at the pier head
        const h = p.harbor;
        this.rider.pos.x = h.x + h.outX * 19;
        this.rider.pos.z = h.z + h.outZ * 19;
        this.rider = null;
        return 'arrived';
      }
    }
    return null;
  }
}
