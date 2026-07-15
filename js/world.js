// ---- Radial survival world ----
// You start in a dark cave at the center; biome rings expand outward in every
// direction. Ring barriers (boulder ridges / ring rivers with bridges) carve
// the circle into bands with gate chokepoints. Lakes dot the wilds — the big
// ones hide treasure islands you can only reach by boat. Trees give wood,
// scattered rocks give stone.

import * as THREE from 'three';
import { WORLD, BIOMES, biomeAt, radiusOf } from './config.js';
import { makeTree, makeRock, makeGrassTuft, makeFlower, makeMushroom, makeBush,
         makeLog, makeBoulder, makeBridge, makeCampfire, makeStalagmite,
         makeBerryBush, makeShrine, makeMonolith, makeCrypt, makeBlacksmith, makeCobweb,
         makeFarm, makeTrader, makeBeehive, makeBeehiveBig, makeCocoon, makeGlade, makeGraveyardRuin,
         makeCursedStatue, makeVillage, makeRaceFlag, makeNest, makeLilypad,
         makeTemple, makeLianaPole, makeBonfire, makeSummitCairn, makeCactus,
         makeLairEntrance } from './models.js';
import { audio } from './audio.js';

const CHUNK = 40;
const VIEW_RADIUS = 3;   // chunks around the player kept alive
const RING_HALF = { ridge: 2.2, river: 2.7 };

// Deterministic per-chunk RNG so the forest is identical for every client —
// a multiplayer guest can rebuild the exact same world from the seed alone.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- deterministic value noise (terrain height & ground color patches) ----
export function latticeHash(ix, iz, seed) {
  let h = ix * 374761393 + iz * 668265263 + seed * 1442695;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t) => t * t * (3 - 2 * t);

function valueNoise(x, z, scale, seed) {
  const fx = x / scale, fz = z / scale;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const tx = smooth(fx - ix), tz = smooth(fz - iz);
  const a = latticeHash(ix, iz, seed), b = latticeHash(ix + 1, iz, seed);
  const c = latticeHash(ix, iz + 1, seed), d = latticeHash(ix + 1, iz + 1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

// smallest absolute angle difference
const angDiff = (a, b) => {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
};

const LAKE_REGION = 220; // deterministic lakes are generated per region cell
const BERRY_REGROW = 600; // seconds until a harvested bush bears fruit again
const TERRACE_STEP = 5;   // mountain plateau height — cliffs between them

// ---- procedural ground detail textures (medium/high graphics) ----
// Multi-octave mottling + speckle + grass-blade strokes drawn once into a
// canvas; MirroredRepeatWrapping makes any content tile without visible
// borders. The map MULTIPLIES the biome vertex colors, so one neutral
// grayscale texture works from Verdant grass to Frozen Peak snow.
const _detailTex = {};
function groundDetailTexture(level) {
  if (_detailTex[level]) return _detailTex[level];
  const size = level === 2 ? 512 : 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgb(232,232,230)';
  g.fillRect(0, 0, size, size);
  const rnd = mulberry32(0xbeef ^ level);
  // large soft mottling
  for (let i = 0; i < size * 2.2; i++) {
    const r = 6 + rnd() * 26;
    const v = 200 + Math.floor(rnd() * 55);
    g.fillStyle = `rgba(${v},${v},${v - 4},${0.10 + rnd() * 0.12})`;
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    g.fill();
  }
  // fine grain
  for (let i = 0; i < size * 22; i++) {
    const v = 185 + Math.floor(rnd() * 70);
    g.fillStyle = `rgba(${v},${v},${v},${0.16 + rnd() * 0.2})`;
    const px = rnd() * size, py = rnd() * size;
    g.fillRect(px, py, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
  }
  // grass-blade strokes (high adds more, longer, with slight curvature)
  const blades = level === 2 ? size * 5 : size * 2;
  for (let i = 0; i < blades; i++) {
    const x = rnd() * size, y = rnd() * size;
    const len = (level === 2 ? 4 : 3) + rnd() * (level === 2 ? 7 : 4);
    const a = rnd() * Math.PI;
    const v = 190 + Math.floor(rnd() * 60);
    g.strokeStyle = `rgba(${v},${v + 6},${v - 8},${0.22 + rnd() * 0.2})`;
    g.lineWidth = 0.8 + rnd() * 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (rnd() - 0.5) * 2,
      y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  if (level === 2) {
    // tiny pebbles with a hint of shadow
    for (let i = 0; i < size; i++) {
      const x = rnd() * size, y = rnd() * size, r = 0.8 + rnd() * 1.8;
      g.fillStyle = 'rgba(120,118,110,0.28)';
      g.beginPath(); g.arc(x + 0.6, y + 0.7, r, 0, Math.PI * 2); g.fill();
      const v = 205 + Math.floor(rnd() * 40);
      g.fillStyle = `rgba(${v},${v},${v - 6},0.5)`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
  tex.repeat.set(level === 2 ? 7 : 5, level === 2 ? 7 : 5);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  _detailTex[level] = tex;
  return tex;
}

export class World {
  constructor(scene, seed = 1337) {
    this.scene = scene;
    this.seed = seed;
    this.chunks = new Map();     // "cx,cz" -> { group, trees: [], rocks: [] }
    this.fallingTrees = [];
    this.nextTreeId = 1;
    this._statics = [];          // underlay/river/cave meshes (for reset)
    this._arena = null;
    this.obstacles = [];
    this.safeZones = [];
    this.rings = [];
    this.lakes = [];             // kept for API compat (MOBA overrides); unused here
    this._lakeRegions = new Map();
    this._treasured = new Set();
    this.onIsland = null;        // main hooks this to drop island treasure
    this.onWoodLog = null;       // main turns decorative fallen logs into pickups
    this._woodLogDrops = new Set();
    this.time = 0;               // world clock (drives berry regrowth)
    this._berryEaten = new Map(); // bush key -> world time it was harvested
    this.pois = [];              // landmarks: shrines / monoliths / crypts
    this.onPoiSpawned = null;    // main hooks this to post crypt guards
    this.smiths = [];            // wandering blacksmiths — forge gear at them
    this._genRings();
    this._genLakes();
    this._genPois();
    this._genSmiths();
    this._genPaths();
    this._buildGround();
    this._buildRingRivers();
    this._buildCave();
  }

  _addStatic(mesh) {
    this.scene.add(mesh);
    this._statics.push(mesh);
    return mesh;
  }

  // Remove everything this world put into the scene (mode/world swap).
  dispose() {
    for (const m of this._statics) this.scene.remove(m);
    this._statics = [];
    for (const chunk of this.chunks.values()) this.scene.remove(chunk.group);
    this.chunks.clear();
    for (const f of this.fallingTrees) f.mesh.parent?.remove(f.mesh);
    this.fallingTrees = [];
    this.removeArena();
    this.obstacles = [];
    this.safeZones = [];
    this.nextTreeId = 1;
  }

  reset(seed) {
    this.dispose();
    this.seed = seed;
    this.rings = []; this.lakes = [];
    this._lakeRegions.clear();
    this._treasured.clear();
    this._woodLogDrops.clear();
    this._berryEaten.clear();
    this.time = 0;
    this._genRings();
    this._genLakes();
    this._genPois();
    this._genSmiths();
    this._genPaths();
    this._buildGround();
    this._buildRingRivers();
    this._buildCave();
  }

  // ---- PvP arena (unchanged: a sand circle ringed by boulders, off-world) ----
  buildArena(cx, cz, r) {
    this.removeArena();
    const group = new THREE.Group();
    const rng = mulberry32(this.seed ^ 0xa7e4a);
    const geo = new THREE.CircleGeometry(r + 4, 40);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, this.heightAt(cx + pos.getX(i), cz + pos.getZ(i)) + 0.05);
    }
    geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xc2a76a }));
    floor.receiveShadow = true;
    floor.position.set(cx, 0, cz);
    group.add(floor);
    for (let a = 0; a < Math.PI * 2; a += 0.28) {
      const bx = cx + Math.cos(a) * (r + 1.2) + (rng() - 0.5);
      const bz = cz + Math.sin(a) * (r + 1.2) + (rng() - 0.5);
      const b = makeBoulder(1.6 + rng() * 0.9, 0x8a8578, rng);
      b.position.set(bx, this.heightAt(bx, bz) + 0.3, bz);
      group.add(b);
    }
    this.scene.add(group);
    this._arena = group;
  }

  removeArena() {
    if (this._arena) { this.scene.remove(this._arena); this._arena = null; }
  }

  // 0..1: how deep inside the (flat) Murky Swamp ring this radius is —
  // blends over 40 m so the swamp floor meets its neighbours smoothly
  _swampFlatK(r) {
    const d = Math.min(r - BIOMES[2].rMax, BIOMES[3].rMax - r);
    return Math.max(0, Math.min(1, d / 40));
  }

  // 0..1: how deep inside the Highlands ring — its massifs grow EXTREME
  _highlandsK(r) {
    const d = Math.min(r - BIOMES[3].rMax, BIOMES[4].rMax - r);
    return Math.max(0, Math.min(1, d / 50));
  }

  // How strongly (0..1) a mountain massif rises here — masked low-frequency
  // noise, kept away from ring barriers so gates and bridges stay usable.
  // In the Highlands the mask opens wide (mountains everywhere); in the
  // swamp it closes completely (dead flat bog).
  _mountainK(x, z, r = radiusOf(x, z)) {
    if (this._swampFlatK(r) > 0) return 0; // the swamp has NO hills or mountains
    const thr = 0.62 - 0.17 * this._highlandsK(r);
    const m = valueNoise(x, z, 420, this.seed + 57);
    if (m <= thr) return 0;
    // fade massifs out SMOOTHLY near ring barriers (a hard cutoff would
    // leave impassable vertical walls circling every ring)
    let fade = 1;
    for (const w of this.rings || []) {
      const d = Math.abs(r - w.r);
      if (d < 55) fade = Math.min(fade, Math.max(0, (d - 25) / 30));
    }
    if (fade <= 0) return 0;
    const k = (m - thr) / (1 - thr);
    return k * k * fade;
  }

  // 0..1: winding mountain-trail band — where it crosses a massif the
  // terrain stays SMOOTH (no cliff terraces) so the trail is climbable
  _mountainPathK(x, z) {
    const pv = valueNoise(x, z, 90, this.seed + 877);
    const d = Math.abs(pv - 0.55);
    return d >= 0.05 ? 0 : 1 - d / 0.05;
  }

  // Terrain height — detail bumps + long rolling hills + occasional mountain
  // massifs with rugged tops; flattened around the cave & camp.
  // raw terrain height, before lake basins are carved out
  _terrainH(x, z) {
    let h = valueNoise(x, z, 30, this.seed) * 1.9
          + valueNoise(x, z, 10, this.seed + 7) * 0.55
          - 1.2;
    const r = radiusOf(x, z);
    h += (valueNoise(x, z, 160, this.seed + 31) - 0.5) * 5;
    // the Murky Swamp is dead flat — only faint ripples in the peat
    const flat = this._swampFlatK(r);
    if (flat > 0) h *= 1 - 0.88 * flat;
    const mk = this._mountainK(x, z, r);
    if (mk > 0) {
      const highK = this._highlandsK(r); // Highlands: EXTREMELY tall massifs
      const detail = valueNoise(x, z, 55, this.seed + 91);
      const amp = (20 + detail * 12) * (1 + 2.0 * highK);
      let m = mk * amp;
      // terraces: flat plateaus separated by short CLIFF walls — too steep to
      // walk up (the player's slope gate blocks them) but fine to drop off
      const t = m / TERRACE_STEP, fl = Math.floor(t), f = t - fl;
      const RAMP = 0.25; // last quarter of each band is the cliff face
      const s = f < 1 - RAMP ? 0 : (f - (1 - RAMP)) / RAMP;
      let terraced = (fl + s * s * (3 - 2 * s)) * TERRACE_STEP;
      // mountain trails: along the path band the slope stays smooth and
      // slightly carved into the rock, so you can WALK to the summits
      const pathK = this._mountainPathK(x, z);
      if (pathK > 0) {
        const smoothM = mk * (20 + detail * 4) * (1 + 2.0 * highK) * 0.82;
        terraced = terraced * (1 - pathK) + smoothM * pathK;
      }
      h += terraced;
    }
    if (r < 28) h *= Math.max(0.1, (r - 10) / 18);
    return h;
  }

  // ---- Murky Swamp zoning: ~80% open black water (BOAT country), the rest
  // mud banks and rare dry hummocks. Paths, POIs and smiths sit on carved
  // dry ground so the world stays traversable on foot — barely. ----
  swampZone(x, z) {
    const r = radiusOf(x, z);
    if (r <= BIOMES[2].rMax || r > BIOMES[3].rMax) return null; // not in the swamp ring
    if (this.pathDistance(x, z) < 4) return 'dry';               // a NARROW causeway
    if (this._dryIslands?.some(d => Math.hypot(d.x - x, d.z - z) < d.r)) return 'dry';
    // measured on the real noise field: <0.70 ≈ 82% water, mud ≈ 10%, dry ≈ 8%
    const n = valueNoise(x, z, 85, this.seed + 404);
    if (n < 0.70) return 'water';
    if (n < 0.80) return 'mud';
    return 'dry';
  }

  // deterministic lilypads: hash-grid stepping stones across the swamp water
  _lilypadAt(x, z) {
    const CELLP = 9;
    const cx = Math.floor(x / CELLP), cz = Math.floor(z / CELLP);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const h = latticeHash(cx + dx, cz + dz, this.seed + 808);
      if (h < 0.85) continue; // pads are RARE — they can't replace the boat
      const px = (cx + dx + 0.2 + (h * 7 % 0.6)) * CELLP;
      const pz = (cz + dz + 0.2 + (h * 13 % 0.6)) * CELLP;
      if (this.swampZone(px, pz) !== 'water') continue;
      if (Math.hypot(x - px, z - pz) < 1.5) return { x: px, z: pz, r: 1.5 };
    }
    return null;
  }

  // lakes carve a flat basin: without this a hill next to (or under) a lake
  // buries the water plane under the terrain
  heightAt(x, z) {
    let h = this._terrainH(x, z);
    const sz = this.swampZone(x, z);
    if (sz === 'water') h -= 0.9;      // open water sits in a shallow basin
    else if (sz === 'mud') h -= 0.35;  // mud squelches a little lower
    for (const lake of this.lakesNear(x, z)) {
      const d = Math.hypot(x - lake.x, z - lake.z);
      const R = lake.r + 14;
      if (d >= R) continue;
      lake.bed ??= this._terrainH(lake.x, lake.z) - 0.6;
      if (d <= lake.r) {
        h = lake.bed;
      } else {
        const t = (d - lake.r) / 14, k = t * t * (3 - 2 * t);
        h = lake.bed * (1 - k) + h * k;
      }
    }
    return h;
  }

  // ---- ring barriers at the biome edges: ridge (boulders + gates) or river
  // (water ring + bridges). Bigger rings get more gates. ----
  _genRings() {
    const rng = mulberry32(this.seed ^ 0x5eed);
    const radii = BIOMES.slice(0, -1).map(b => b.rMax);
    const MIN_SEP = Math.PI * 2 * 0.1; // gates at least 10% of the circle apart
    this.rings = radii.map((r, i) => {
      const type = i % 2 === 0 ? 'ridge' : 'river';
      const gaps = [];
      // 2–5 randomly placed exits per ring (huge outer rings get a few more
      // so the trek along the wall never becomes a chore)
      const count = Math.max(2 + Math.floor(rng() * 4), Math.round(r / 900));
      for (let g = 0; g < count; g++) {
        let a = rng() * Math.PI * 2;
        // keep exits spread out: re-roll while too close to an earlier gate
        for (let tries = 0; tries < 20
             && gaps.some(gap => angDiff(a, gap.a) < MIN_SEP); tries++) {
          a = rng() * Math.PI * 2;
        }
        if (gaps.some(gap => angDiff(a, gap.a) < MIN_SEP)) continue;
        const width = (type === 'river' ? 9 : 15) + rng() * 8; // meters of opening
        gaps.push({ a, w: width / r });                         // width in radians
      }
      return { r, type, gaps };
    });
  }

  // ---- winding field paths: from the base out through a gate of every
  // ring, gate to gate, so following the trail always leads you deeper ----
  _genPaths() {
    this.pathPts = [];
    this.branches = [];       // fork spurs: { kind:'lair'|'deadend', pts:[...] }
    this._pathBuckets = new Map();
    this._pathSegs = [];      // every walkable segment (main road + branches)
    if (!this.rings?.length) return;
    const rng = mulberry32(this.seed ^ 0xf1e1d);

    // A gently-meandering trail between two (angle, radius) endpoints, built in
    // POLAR space so it always sweeps AROUND the map rather than cutting a
    // straight chord back through the center. Returns points i=1..n (the far
    // endpoint is hit dead-on because the meander fades to 0 at both ends).
    const trail = (sA, sR, eA, eR, meanderAmp) => {
      let dA = eA - sA;
      while (dA > Math.PI) dA -= Math.PI * 2;
      while (dA < -Math.PI) dA += Math.PI * 2;
      const arcLen = Math.abs(dA) * (sR + eR) * 0.5;
      const dist = Math.hypot(arcLen, eR - sR);
      const n = Math.max(4, Math.ceil(dist / 22));
      const waves = 2 + Math.floor(rng() * 3), phase = rng() * Math.PI * 2;
      const amp = Math.min(meanderAmp, dist * 0.06);
      const out = [];
      for (let i = 1; i <= n; i++) {
        const t = i / n, fade = Math.sin(t * Math.PI);
        const off = Math.sin(t * Math.PI * waves + phase) * amp * fade;
        const a = sA + dA * t, r = sR + (eR - sR) * t + off;
        out.push({ x: Math.sin(a) * r, z: Math.cos(a) * r });
      }
      return out;
    };

    // gates store a as atan2(x, z) → world pos is (r sin a, r cos a)
    let cur = { x: 0, z: 26 };
    let curA = Math.atan2(cur.x, cur.z);
    const pts = [{ x: cur.x, z: cur.z }];
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (!ring.gaps.length) break;
      let gate = ring.gaps[0];
      for (const g of ring.gaps) if (angDiff(g.a, curA) < angDiff(gate.a, curA)) gate = g;
      const startR = Math.hypot(cur.x, cur.z) || 1;

      // From the 2nd biome onward (i >= 1), the entrance opens onto a 3-WAY
      // FORK: the main road pushes on to the next gate, a spur runs to this
      // biome's boss lair, and a dead-end trail wanders off to the far side.
      if (i >= 1) {
        const lair = this.pois.find(p => p.type === 'lair' && p.ring === i);
        if (lair) {
          const lA = Math.atan2(lair.x, lair.z), lR = Math.hypot(lair.x, lair.z) || 1;
          this.branches.push({ kind: 'lair',
            pts: [{ x: cur.x, z: cur.z }, ...trail(curA, startR, lA, lR, 40)] });
        }
        // a red-herring spur: opposite side from the NEXT gate, ending partway
        // into the biome at nothing in particular
        const deadA = gate.a + Math.PI + (rng() - 0.5) * 0.7;
        const deadR = startR + (ring.r - startR) * (0.4 + rng() * 0.25);
        this.branches.push({ kind: 'deadend',
          pts: [{ x: cur.x, z: cur.z }, ...trail(curA, startR, deadA, deadR, 60)] });
      }

      // main road: sweep on to this ring's gate, then step just past it
      pts.push(...trail(curA, startR, gate.a, ring.r, 50));
      curA = gate.a;
      const outR = ring.r + 30;
      cur = { x: Math.sin(gate.a) * outR, z: Math.cos(gate.a) * outR };
      pts.push({ x: cur.x, z: cur.z });
    }
    this.pathPts = pts;

    // every trail (main road + all fork branches) is walkable dry ground, so
    // bucket ALL their segments on an 80 m grid for a cheap pathDistance()
    const CELLB = 80;
    const key = (cx, cz) => cx + ',' + cz;
    const addPolyline = (poly) => {
      for (let i = 0; i < poly.length - 1; i++) {
        const si = this._pathSegs.length;
        this._pathSegs.push([poly[i], poly[i + 1]]);
        const a = poly[i], b = poly[i + 1];
        const x0 = Math.floor((Math.min(a.x, b.x) - 8) / CELLB), x1 = Math.floor((Math.max(a.x, b.x) + 8) / CELLB);
        const z0 = Math.floor((Math.min(a.z, b.z) - 8) / CELLB), z1 = Math.floor((Math.max(a.z, b.z) + 8) / CELLB);
        for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
          const k = key(cx, cz);
          if (!this._pathBuckets.has(k)) this._pathBuckets.set(k, []);
          this._pathBuckets.get(k).push(si);
        }
      }
    };
    addPolyline(pts);
    for (const br of this.branches) addPolyline(br.pts);
    this._pathCellB = CELLB;
  }

  pathDistance(x, z) {
    if (!this._pathBuckets?.size) return Infinity;
    const segs = this._pathBuckets.get(
      Math.floor(x / this._pathCellB) + ',' + Math.floor(z / this._pathCellB));
    if (!segs) return Infinity;
    let best = Infinity;
    for (const si of segs) {
      const [a, b] = this._pathSegs[si];
      const dx = b.x - a.x, dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - a.x) * dx + (z - a.z) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t)));
    }
    return best;
  }

  // ---- lakes are generated lazily per region cell (the world is huge) ----
  _genLakes() {} // kept for subclass overrides (MOBA disables lakes)

  // ---- landmarks: a handful of seeded POIs per biome ring. Shrines bless,
  // monoliths hoard resources, crypts hide treasure behind a guard pack. ----
  _genPois() {
    const rng = mulberry32(this.seed ^ 0x9013);
    this.pois = [];
    this._dryIslands = []; // carved dry pads in the swamp ring (POIs, smiths)
    const types = ['shrine', 'monolith', 'crypt'];
    let id = 1;
    for (let ring = 0; ring < BIOMES.length; ring++) {
      const rMin = ring === 0 ? 130 : BIOMES[ring - 1].rMax + 70;
      const rMax = Math.min(BIOMES[ring].rMax - 70, WORLD.radius - 120);
      if (rMax <= rMin) continue;
      const count = ring === 0 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        let placed = null;
        for (let tries = 0; tries < 10 && !placed; tries++) {
          const a = rng() * Math.PI * 2;
          const r = rMin + rng() * (rMax - rMin);
          const x = Math.sin(a) * r, z = Math.cos(a) * r;
          if (this.rings.some(w => Math.abs(r - w.r) < 25)) continue;
          if (this.lakesNear(x, z).some(l => Math.hypot(x - l.x, z - l.z) < l.r + 8)) continue;
          placed = { x, z };
        }
        if (!placed) continue;
        this.pois.push({
          id: id++, type: types[Math.floor(rng() * types.length)],
          x: placed.x, z: placed.z, ring, claimed: false, guarded: false, mesh: null,
        });
        if (ring === 3) (this._dryIslands ??= []).push({ x: placed.x, z: placed.z, r: 24 });
      }
    }

    // ring-SPECIFIC landmarks: each biome gets its own signature encounters
    const place = (type, ring, count) => {
      const rMin = ring === 0 ? 150 : BIOMES[ring - 1].rMax + 80;
      const rMax = Math.min(BIOMES[ring].rMax - 80, WORLD.radius - 130);
      if (rMax <= rMin) return;
      for (let i = 0; i < count; i++) {
        for (let tries = 0; tries < 12; tries++) {
          const a = rng() * Math.PI * 2;
          const r = rMin + rng() * (rMax - rMin);
          const x = Math.sin(a) * r, z = Math.cos(a) * r;
          if (this.rings.some(w => Math.abs(r - w.r) < 25)) continue;
          if (this.lakesNear(x, z).some(l => Math.hypot(x - l.x, z - l.z) < l.r + 10)) continue;
          if (this.pois.some(pp => Math.hypot(pp.x - x, pp.z - z) < 90)) continue;
          this.pois.push({ id: id++, type, x, z, ring, claimed: false, guarded: false, mesh: null });
          if (ring === 3) this._dryIslands.push({ x, z, r: 24 });
          break;
        }
      }
    };
    for (let ring = 0; ring < 8; ring++) place('lair', ring, 1); // one named boss lair per biome (incl. Frozen Peak)
    place('village', 3, 2);    // Swamp: tribute buys you peace with the tribes
    place('temple', 6, 2);     // Jungle: trapped step pyramids with a treasury

    // Jungle liana ziplines come in PAIRS — E at one end glides you across
    for (let i = 0; i < 3; i++) {
      const rMin = BIOMES[5].rMax + 80, rMax = BIOMES[6].rMax - 80;
      const a = rng() * Math.PI * 2;
      const r = rMin + rng() * (rMax - rMin);
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      const b = rng() * Math.PI * 2;
      const tx = x + Math.cos(b) * 38, tz = z + Math.sin(b) * 38;
      if (this.rings.some(w => Math.abs(r - w.r) < 25)) continue;
      const p1 = { id: id++, type: 'liana', x, z, tx, tz, ring: 6, claimed: false, guarded: false, mesh: null };
      const p2 = { id: id++, type: 'liana', x: tx, z: tz, tx: x, tz: z, ring: 6, claimed: false, guarded: false, mesh: null };
      this.pois.push(p1, p2);
    }

    // Frozen Peak: the summit pilgrimage — two bonfire checkpoints leading
    // to the cairn where the Father of the Mountain waits
    {
      const a = rng() * Math.PI * 2;
      for (const [type, rr] of [['bonfire', WORLD.radius - 560], ['bonfire', WORLD.radius - 380], ['summit', WORLD.radius - 210]]) {
        this.pois.push({ id: id++, type, x: Math.sin(a) * rr, z: Math.cos(a) * rr,
          ring: 7, claimed: false, guarded: false, mesh: null });
      }
    }
    place('race', 4, 2);       // Highlands: horse races
    place('nest', 4, 3);       // Highlands: eagle nests on rock pillars
    place('farm', 0, 1);       // Verdant: an abandoned farmstead to restore
    place('trader', 0, 2);     // Verdant: wandering merchants buying surplus
    place('graveyard', 5, 2);  // Haunted (now ring 5): undead-wave defense events
    place('statue', 5, 3);     // Haunted: cursed statues (boon + bane)
  }

  poisNear(x, z, radius) {
    return this.pois.filter(p => Math.hypot(p.x - x, p.z - z) < radius);
  }

  // Blacksmiths camp in ~300 m grid cells (roughly as common as a sheep
  // herd) — weapons & gear can only be forged at one.
  _genSmiths() {
    const rng = mulberry32(this.seed ^ 0x51117);
    this.smiths = [];
    const CELL = 300;
    let id = 1;
    const cells = Math.ceil(WORLD.radius / CELL);
    for (let gx = -cells; gx <= cells; gx++) {
      for (let gz = -cells; gz <= cells; gz++) {
        if (rng() > 0.35) continue;
        const x = gx * CELL + 40 + rng() * (CELL - 80);
        const z = gz * CELL + 40 + rng() * (CELL - 80);
        const r = radiusOf(x, z);
        if (r < 70 || r > WORLD.radius - 60) continue;
        if (this.rings.some(w => Math.abs(r - w.r) < 18)) continue;
        if (this.lakesNear(x, z).some(l => Math.hypot(x - l.x, z - l.z) < l.r + 6)) continue;
        this.smiths.push({ id: id++, x, z, obstacleAdded: false });
        // swamp smiths get a dry island too (list may not exist yet — genPois
        // runs before genSmiths and creates it; be safe either way)
        if (r > BIOMES[2].rMax && r <= BIOMES[3].rMax) {
          (this._dryIslands ??= []).push({ x, z, r: 22 });
        }
      }
    }
  }

  smithNear(x, z, radius) {
    return this.smiths.find(sm => Math.hypot(sm.x - x, sm.z - z) < radius) ?? null;
  }

  _regionLakes(rx, rz) {
    const key = rx + ',' + rz;
    let list = this._lakeRegions.get(key);
    if (list) return list;
    list = [];
    const rng = mulberry32(this.seed ^ (rx * 92821) ^ (rz * 68917) ^ 0xa9ae);
    const count = rng() < 0.55 ? 1 : rng() < 0.4 ? 2 : 0;
    for (let i = 0; i < count; i++) {
      const x = rx * LAKE_REGION + 20 + rng() * (LAKE_REGION - 40);
      const z = rz * LAKE_REGION + 20 + rng() * (LAKE_REGION - 40);
      const lr = 6 + rng() * 12;
      const r = radiusOf(x, z);
      if (r < 70 || r > WORLD.radius - 30) continue;
      if (this.rings.some(w => Math.abs(r - w.r) < lr + 12)) continue;
      if (this._mountainK(x, z, r) > 0.02) continue; // no lakes up a mountainside
      const island = lr >= 14 ? { r: 4.5 } : null;
      list.push({ x, z, r: lr, island, id: key + ':' + i });
    }
    this._lakeRegions.set(key, list);
    return list;
  }

  lakesNear(x, z) {
    const rx = Math.floor(x / LAKE_REGION), rz = Math.floor(z / LAKE_REGION);
    const out = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        out.push(...this._regionLakes(rx + dx, rz + dz));
    return out;
  }

  // river rings hug the terrain; every gate gets a bridge
  _buildRingRivers() {
    for (const ring of this.rings) {
      if (ring.type !== 'river') continue;
      const half = RING_HALF.river;
      const segs = Math.max(64, Math.min(4096, Math.round(ring.r)));
      const geo = new THREE.RingGeometry(ring.r - half, ring.r + half, segs, 1);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, this.heightAt(pos.getX(i), pos.getZ(i)) + 0.18);
      }
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        color: 0x3f6f9e, transparent: true, opacity: 0.88, side: THREE.DoubleSide,
      }));
      this._addStatic(mesh);

      for (const gap of ring.gaps) {
        const gx = Math.sin(gap.a) * ring.r, gz = Math.cos(gap.a) * ring.r;
        const bridge = makeBridge(Math.min(gap.w * ring.r - 2, 5), 8.5);
        bridge.position.set(gx, this.heightAt(gx, gz), gz);
        bridge.rotation.y = Math.atan2(gx, gz); // deck runs across the river
        this._addStatic(bridge);
      }
    }
  }

  // ---- the starting cave: a small boulder horseshoe, opening toward +z
  // (down-screen, where the camp is). Every boulder gets its own collision
  // circle so the walls block EXACTLY where the rocks are. ----
  _buildCave() {
    const rng = mulberry32(this.seed ^ 0xca4e);
    const R = WORLD.caveR;
    const OPEN_HALF = 0.62; // radians of clear opening around the +z direction
    const group = new THREE.Group();
    for (let a = OPEN_HALF; a < Math.PI * 2 - OPEN_HALF; a += 1.7 / R) {
      const bx = Math.sin(a) * R, bz = Math.cos(a) * R; // a=0 → +z (the opening)
      const scale = 1.4 + rng() * 0.8;
      const b = makeBoulder(scale, 0x5c584e, rng);
      b.position.set(bx, this.heightAt(bx, bz) + 0.3, bz);
      group.add(b);
      this.obstacles.push({ x: bx, z: bz, r: scale * 0.85, home: true }); // matches the rock
    }
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 0.6 + rng() * Math.PI * 0.8; // back of the cave
      const d = 3 + rng() * (R - 5);
      const sx = Math.sin(a) * d, sz = Math.cos(a) * d;
      const s = makeStalagmite(rng);
      s.position.set(sx, this.heightAt(sx, sz), sz);
      group.add(s);
    }
    this._homeGroup = this._addStatic(group);
    // a small campfire just outside the cave mouth — home
    const fire = makeCampfire();
    fire.position.set(2, this.heightAt(2, 14), 14);
    this._addStatic(fire);
  }

  // The CENTER structure is your home. Level 0 is the starting cave; every
  // era REPLACES it with a bigger walk-in building of the same footprint —
  // a ring of walls with the same door gap toward +z, open to the sky so the
  // top-down camera can see you inside.
  buildHome(level) {
    if (this._homeGroup) {
      this.scene.remove(this._homeGroup);
      this._statics = this._statics.filter(m => m !== this._homeGroup);
      this._homeGroup = null;
    }
    this.obstacles = this.obstacles.filter(o => !o.home);
    this.homeLevel = level;
    if (level <= 0) { this._buildCave(); return; }

    const group = new THREE.Group();
    const R = WORLD.caveR;
    const OPEN_HALF = 0.55;
    const y0 = this.heightAt(0, 0);

    // interior floor: hides > planks > flagstones > keep stone
    const floorColor = [0, 0xa8845c, 0x9c6b38, 0x8f8a7c, 0x646b76][level];
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 1.4, 28),
      new THREE.MeshLambertMaterial({ color: floorColor }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, y0 + 0.08, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // wall ring with the door gap toward +z (rotation.y = a makes the
    // segment's local X tangential at that angle)
    const wallH = [0, 3.0, 3.2, 3.6, 4.8][level];
    for (let a = OPEN_HALF; a < Math.PI * 2 - OPEN_HALF; a += 2.0 / R) {
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      const seg = this._homeWallSegment(level, wallH);
      seg.position.set(x, this.heightAt(x, z), z);
      seg.rotation.y = a;
      group.add(seg);
      this.obstacles.push({ x, z, r: 1.35, home: true });
    }

    // door posts on both sides of the entrance (+ a banner for the keep)
    for (const side of [-1, 1]) {
      const a = side * (OPEN_HALF + 0.06);
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      const post = level === 1
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, wallH + 0.7, 6),
            new THREE.MeshLambertMaterial({ color: 0x6b4a2d }))
        : new THREE.Mesh(new THREE.BoxGeometry(0.7, wallH + 0.6, 0.7),
            new THREE.MeshLambertMaterial({ color: level >= 4 ? 0x565e6a : level >= 3 ? 0x6e6a60 : 0x5c4326 }));
      post.castShadow = true;
      post.position.set(x, this.heightAt(x, z) + (wallH + 0.6) / 2, z);
      group.add(post);
    }
    if (level >= 4) { // the keep flies its colors above the gate
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 5),
        new THREE.MeshLambertMaterial({ color: 0x4c3520 }));
      const px = Math.sin(OPEN_HALF + 0.06) * R, pz = Math.cos(OPEN_HALF + 0.06) * R;
      pole.position.set(px, this.heightAt(px, pz) + wallH + 1.4, pz);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.06),
        new THREE.MeshLambertMaterial({ color: 0xb53a3a }));
      flag.position.set(px + 0.6, this.heightAt(px, pz) + wallH + 1.7, pz);
      group.add(pole, flag);
    }

    this.scene.add(group);
    this._statics.push(group);
    this._homeGroup = group;
  }

  // one tangential wall piece per era: hide panel / log courses / masonry /
  // battlemented keep wall
  _homeWallSegment(level, h) {
    const g = new THREE.Group();
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
    const boxMesh = (w, hh, d, c, y = hh / 2) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), lam(c));
      m.castShadow = true;
      m.position.y = y;
      return m;
    };
    if (level === 1) { // hide tent: leaning tan panels with a support pole
      const panel = boxMesh(2.4, h, 0.26, 0xb5824a);
      panel.rotation.x = -0.14; // top leans toward the center, tent-like
      const seam = boxMesh(0.14, h, 0.3, 0x8a5f33);
      seam.rotation.x = -0.14;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, h + 0.35, 5), lam(0x6b4a2d));
      pole.castShadow = true;
      pole.position.set(1.1, (h + 0.35) / 2, 0.15);
      g.add(panel, seam, pole);
    } else if (level === 2) { // timber cabin: stacked log courses
      for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.5, 7), lam(i % 2 ? 0x8a6238 : 0x7a5630));
        log.castShadow = true;
        log.rotation.z = Math.PI / 2;
        log.position.y = 0.36 + i * 0.7;
        g.add(log);
      }
    } else if (level === 3) { // stone house: masonry with a darker top course
      g.add(boxMesh(2.3, h, 0.62, 0x8f8a7c));
      g.add(boxMesh(2.3, 0.34, 0.68, 0x6e6a60, h + 0.17));
    } else { // keep: tall wall + merlon battlement
      g.add(boxMesh(2.3, h, 0.72, 0x6e7280));
      g.add(boxMesh(0.95, 0.6, 0.74, 0x5c6670, h + 0.3));
    }
    return g;
  }

  // Ground tone at a world position: biome rings blended at the edges, dirt
  // patches, dark cave rock at the center, sandy island shores.
  _groundColor(x, z, out) {
    const r = radiusOf(x, z);
    const biome = biomeAt(x, z);
    const cA = new THREE.Color(biome.ground);
    const cB = new THREE.Color(biome.ground2);
    const cDirt = new THREE.Color(biome.dirt);

    const grassMix = valueNoise(x, z, 5, this.seed + 21);
    out.copy(cA).lerp(cB, grassMix);

    const patch = valueNoise(x, z, 15, this.seed + 13);
    if (patch > 0.55) out.lerp(cDirt, Math.min(1, (patch - 0.55) / 0.2));

    // cross-fade into the next ring near its edge
    const idx = BIOMES.indexOf(biome);
    if (idx < BIOMES.length - 1) {
      const distToEdge = biome.rMax - r;
      if (distToEdge < 24) {
        const next = BIOMES[idx + 1];
        const nextCol = new THREE.Color(next.ground).lerp(new THREE.Color(next.ground2), grassMix);
        out.lerp(nextCol, 0.5 - (distToEdge / 24) * 0.5);
      }
    }

    // the swamp reads at a glance: deep black-teal water, black mud, moss.
    // A faint blue-green shimmer patches make the water look enchanted.
    const sz = this.swampZone(x, z);
    if (sz === 'water') {
      out.copy(new THREE.Color(0x16262c)).lerp(new THREE.Color(0x101c22), grassMix);
      const glow = valueNoise(x, z, 12, this.seed + 909);
      if (glow > 0.72) out.lerp(new THREE.Color(0x1e4a5a), (glow - 0.72) / 0.28 * 0.8);
    } else if (sz === 'mud') out.lerp(new THREE.Color(0x1c1810), 0.7);

    // Highlands mountain trails read as pale packed gravel on the rock
    if (this._highlandsK(r) > 0) {
      const mk = this._mountainK(x, z, r);
      if (mk > 0.02) {
        const pk = this._mountainPathK(x, z);
        if (pk > 0.3) out.lerp(new THREE.Color(0xb7a97e), (pk - 0.3) / 0.7 * 0.75);
      }
    }

    // trodden field path: packed pale sand, wide and unmistakable
    const pd = this.pathDistance(x, z);
    if (pd < 5.2) {
      const trail = new THREE.Color(0xd8b878);
      out.lerp(trail, pd < 3.6 ? 0.95 : 0.95 * (1 - (pd - 3.6) / 1.6));
    }

    // the cave floor is dark rock
    if (r < WORLD.caveR + 2.5) out.lerp(new THREE.Color(0x2a2a26), Math.min(1, (WORLD.caveR + 2.5 - r) / 3));

    // subtle per-vertex jitter so large flats never look uniform
    const j = (latticeHash(Math.round(x * 3), Math.round(z * 3), this.seed + 99) - 0.5) * 0.05;
    out.offsetHSL(0, 0, j);
    // medium/high texture detail: extra fine-grained mottling + micro speckle
    if (this.groundDetail >= 1) {
      const fine = valueNoise(x, z, 2.2, this.seed + 141) - 0.5;
      out.offsetHSL(0, fine * 0.06, fine * 0.05);
    }
    if (this.groundDetail >= 2) {
      const speck = latticeHash(Math.round(x * 7), Math.round(z * 7), this.seed + 171);
      if (speck > 0.93) out.offsetHSL(0, 0.04, 0.05);
      else if (speck < 0.07) out.offsetHSL(0, -0.03, -0.045);
    }
    return out;
  }

  // The world is far too big for one vertex-colored plane — the detailed
  // ground is built per chunk (see _genChunk); this is just a dark underlay
  // so the fog-shrouded distance never shows the void.
  _buildGround() {
    const size = WORLD.radius * 2 + 400;
    const geo = new THREE.PlaneGeometry(size, size, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x2c3a24 }));
    mesh.position.y = -2.6;
    this._addStatic(mesh);
  }

  // vertex-colored terrain tile for one chunk (finer mesh where cliffs are)
  _groundTile(cxw, czw) {
    // ONE grid density for every tile of a detail level. Mixing densities
    // (finer near cliffs/paths) left T-junctions on shared edges — vertices
    // of the coarse tile interpolated across gaps the fine tile shaded
    // per-vertex, and every border showed as a seam line.
    const segs = [14, 20, 28][this.groundDetail ?? 0];
    const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, segs, segs);
    geo.rotateX(-Math.PI / 2);
    geo.translate(cxw + CHUNK / 2, 0, czw + CHUNK / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    const void_ = new THREE.Color(0x11170e);
    const rock = new THREE.Color(0x7a766b);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this.heightAt(x, z);
      pos.setY(i, h);
      if (radiusOf(x, z) > WORLD.radius + 6) col.copy(void_);
      else {
        this._groundColor(x, z, col);
        // steep ground reads as bare rock, so cliff faces stand out
        const slope = Math.max(
          Math.abs(this.heightAt(x + 1.4, z) - h),
          Math.abs(this.heightAt(x, z + 1.4) - h)) / 1.4;
        if (slope > 0.55) col.lerp(rock, Math.min(1, (slope - 0.55) / 0.7));
      }
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // ANALYTIC normals from heightAt (central differences): per-tile
    // computeVertexNormals only sees its own triangles, so every chunk edge
    // shaded differently — visible seams across the whole world. The same
    // height function on both sides of a border gives continuous lighting.
    // (x/z squashed 0.4 toward 'up' so shaded valleys stay readable.)
    geo.computeVertexNormals(); // allocates the attribute
    const nrm = geo.attributes.normal;
    const E = 1.2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const nx = (this.heightAt(x - E, z) - this.heightAt(x + E, z)) / (2 * E) * 0.4;
      const nz = (this.heightAt(x, z - E) - this.heightAt(x, z + E)) / (2 * E) * 0.4;
      const l = Math.hypot(nx, 1, nz);
      nrm.setXYZ(i, nx / l, 1 / l, nz / l);
    }
    const mat = { vertexColors: true };
    if ((this.groundDetail ?? 0) > 0) {
      // medium/high: a real tiling detail texture over the vertex colors
      mat.map = groundDetailTexture(this.groundDetail);
      mat.color = new THREE.Color(1.12, 1.12, 1.12); // the map's mean is ~0.9
    }
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial(mat));
    mesh.receiveShadow = true;
    return mesh;
  }

  // graphics setting changed → rebuild loaded ground tiles at the new detail
  regenChunks() {
    for (const chunk of this.chunks.values()) this.scene.remove(chunk.group);
    this.chunks.clear();
  }

  _chunkKey(cx, cz) { return cx + ',' + cz; }

  _place(obj, x, z) {
    obj.position.set(x, this.heightAt(x, z), z);
    return obj;
  }

  // 60% slow inside any static web field (Dark Forest ground webs)
  webSlowAt(x, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const chunk = this.chunks.get(this._chunkKey(cx + dx, cz + dz));
      if (!chunk?.webs?.length) continue;
      for (const w of chunk.webs) {
        if (Math.hypot(x - w.x, z - w.z) < w.r) return 0.4;
      }
    }
    return 1;
  }

  isWater(x, z) {
    if (this.swampZone(x, z) === 'water' && !this._lilypadAt(x, z)) return true;
    for (const lake of this.lakesNear(x, z)) {
      const d = Math.hypot(x - lake.x, z - lake.z);
      if (d < lake.r) {
        if (lake.island && d < lake.island.r) return false; // the island is land
        return true;
      }
    }
    for (const ring of this.rings) {
      if (ring.type !== 'river') continue;
      const r = radiusOf(x, z);
      if (Math.abs(r - ring.r) < RING_HALF.river) {
        const a = Math.atan2(x, z);
        if (!ring.gaps.some(g => angDiff(a, g.a) < g.w / 2)) return true;
      }
    }
    return false;
  }

  _genChunk(cx, cz) {
    if (!Number.isFinite(cx) || !Number.isFinite(cz)) return;
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    const group = new THREE.Group();
    const trees = [];
    const rocks = [];
    const rng = mulberry32(this.seed ^ (cx * 73856093) ^ (cz * 19349663));
    const cxw = cx * CHUNK, czw = cz * CHUNK;
    const midR = radiusOf(cxw + CHUNK / 2, czw + CHUNK / 2);
    const biome = biomeAt(cxw + CHUNK / 2, czw + CHUNK / 2);

    // detailed vertex-colored terrain for this chunk
    group.add(this._groundTile(cxw, czw));

    // lakes whose center falls in this chunk get their water mesh here
    const chunkLakes = this.lakesNear(cxw + CHUNK / 2, czw + CHUNK / 2);
    for (const lake of chunkLakes) {
      if (lake.x < cxw || lake.x >= cxw + CHUNK || lake.z < czw || lake.z >= czw + CHUNK) continue;
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(lake.r, 20),
        new THREE.MeshLambertMaterial({ color: 0x3f6f9e, transparent: true, opacity: 0.85 }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(lake.x, this.heightAt(lake.x, lake.z) + 0.22, lake.z);
      group.add(mesh);
      if (lake.island) {
        const sand = new THREE.Mesh(new THREE.CircleGeometry(lake.island.r + 0.8, 14),
          new THREE.MeshLambertMaterial({ color: 0xd8c58a }));
        sand.rotation.x = -Math.PI / 2;
        sand.position.set(lake.x, this.heightAt(lake.x, lake.z) + 0.28, lake.z);
        group.add(sand);
        if (!this._treasured.has(lake.id)) {
          this._treasured.add(lake.id);
          this.onIsland?.(lake); // main drops the island treasure
        }
      }
    }

    const inBounds = (x, z) => {
      const r = radiusOf(x, z);
      if (r > WORLD.radius - 3 || r < 14) return false;               // world edge + cave
      if (x > -13 && x < 16 && z > 8 && z < 24) return false;         // camp building spots
      if (this.rings.some(w => Math.abs(r - w.r) < 5)) return false;  // ring bands
      if (this.pathDistance(x, z) < 4.5) return false;                // keep trails clear
      if (chunkLakes.some(l => {
        const d = Math.hypot(x - l.x, z - l.z);
        return d < l.r + 1.2 && !(l.island && d < l.island.r);
      })) return false;
      return true;
    };

    // -- trees -- (low-frequency noise carves occasional DENSE forest patches:
    // full-strength patches pack ~4x the trees, wall-to-wall woods)
    let count = Math.round((8 + rng() * 8) * biome.treeDensity);
    let denseWood = false;
    if (biome.denseForests) {
      // high threshold → thick woods are OCCASIONAL landmarks, not the norm
      const f = valueNoise(cxw + CHUNK / 2, czw + CHUNK / 2, 240, this.seed + 133);
      if (f > 0.68) {
        const k = Math.min(1, (f - 0.68) / 0.1);
        count = Math.min(110, Math.round(count * (3.5 + k * k * 6)));
        denseWood = true; // thick woods grow TALL trees, not saplings
      }
    }
    for (let i = 0; i < count; i++) {
      const x = cxw + rng() * CHUNK;
      const z = czw + rng() * CHUNK;
      if (!inBounds(x, z)) continue;
      if (radiusOf(x, z) < 100) continue; // open meadow around the base
      const size = denseWood
        ? (rng() < 0.12 ? 0 : rng() < 0.5 ? 1 : 2)
        : (rng() < 0.45 ? 0 : rng() < 0.75 ? 1 : 2);
      const { mesh, radius } = makeTree(size, biome, rng);
      this._place(mesh, x, z);
      mesh.rotation.y = rng() * Math.PI * 2;
      group.add(mesh);
      trees.push({
        id: this.nextTreeId++, mesh, x, z, radius, size,
        hp: [2, 4, 6][size], wood: [2, 4, 7][size], alive: true, kind: 'tree',
      });
    }

    // -- mineable rocks (stone) --
    const rockCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < rockCount; i++) {
      const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
      if (!inBounds(x, z)) continue;
      const size = rng() < 0.6 ? 0 : 1;
      const scale = size === 0 ? 0.9 + rng() * 0.3 : 1.3 + rng() * 0.4;
      const mesh = makeBoulder(scale, 0x8a8a84, rng);
      mesh.position.set(x, this.heightAt(x, z) + scale * 0.25, z);
      group.add(mesh);
      rocks.push({
        id: this.nextTreeId++, mesh, x, z, radius: scale * 0.9,
        hp: [3, 5][size], stone: [3, 6][size], alive: true, kind: 'rock',
      });
    }

    // -- decorations (visual only) --
    const scatter = (n, maker) => {
      for (let i = 0; i < n; i++) {
        const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
        if (!inBounds(x, z)) continue;
        const obj = maker();
        this._place(obj, x, z);
        obj.rotation.y = rng() * Math.PI * 2;
        group.add(obj);
      }
    };
    // biome-signature chunk props: silk cocoons & firefly glades (Dark Forest)
    const props = [];
    // big destructible beehives in the warm biomes (NOT frozen/dark/haunted).
    // Bash one open: 10-20 bees pour out, and it drops honeycomb when it breaks.
    const hives = [];
    const HONEY_BIOMES = ['Verdant Forest', 'Scorched Desert', 'Highlands', 'Murky Swamp', 'Jungle'];
    if (HONEY_BIOMES.includes(biome.name) && rng() < 0.16) {
      const x = cxw + 6 + rng() * (CHUNK - 12), z = czw + 6 + rng() * (CHUNK - 12);
      if (inBounds(x, z) && radiusOf(x, z) > 110) {
        const hive = makeBeehiveBig(rng);
        hive.position.set(x, this.heightAt(x, z), z);
        group.add(hive);
        hives.push({ id: this.nextTreeId++, x, z, mesh: hive, hp: 40, maxHp: 40,
                     disturbed: false, dead: false, regrowAt: 0, radius: 1.0, alive: true });
        this.obstacles.push({ x, z, r: 0.9 });
      }
    }
    if (biome.name === 'Highlands' || biome.name === 'Scorched Desert') {
      // scattered saguaro cacti — a couple per chunk in the dry country
      const n = biome.name === 'Scorched Desert' ? 3 : 2;
      for (let i = 0; i < n; i++) {
        if (rng() > 0.5) continue;
        const x = cxw + 4 + rng() * (CHUNK - 8), z = czw + 4 + rng() * (CHUNK - 8);
        if (!inBounds(x, z)) continue;
        const c = makeCactus(rng);
        this._place(c, x, z);
        c.rotation.y = rng() * Math.PI * 2;
        group.add(c);
      }
    }
    if (biome.name === 'Dark Forest') {
      if (rng() < 0.18) {
        const x = cxw + 6 + rng() * (CHUNK - 12), z = czw + 6 + rng() * (CHUNK - 12);
        if (inBounds(x, z)) {
          const c = makeCocoon(rng);
          this._place(c, x, z);
          group.add(c);
          props.push({ kind: 'cocoon', x, z, mesh: c, used: false });
        }
      }
      if (rng() < 0.08) {
        const x = cxw + 8 + rng() * (CHUNK - 16), z = czw + 8 + rng() * (CHUNK - 16);
        if (inBounds(x, z)) {
          const gl = makeGlade(rng);
          this._place(gl, x, z);
          group.add(gl);
          props.push({ kind: 'glade', x, z, mesh: gl, used: false });
        }
      }
    }

    // swamp: draw the lilypad stepping stones this chunk owns
    if (biome.name === 'Murky Swamp') {
      const CELLP = 9;
      for (let gx = Math.floor(cxw / CELLP); gx <= Math.floor((cxw + CHUNK) / CELLP); gx++) {
        for (let gz = Math.floor(czw / CELLP); gz <= Math.floor((czw + CHUNK) / CELLP); gz++) {
          const h = latticeHash(gx, gz, this.seed + 808);
          if (h < 0.85) continue; // must match _lilypadAt — pads are rare
          const px = (gx + 0.2 + (h * 7 % 0.6)) * CELLP;
          const pz = (gz + 0.2 + (h * 13 % 0.6)) * CELLP;
          if (px < cxw || px >= cxw + CHUNK || pz < czw || pz >= czw + CHUNK) continue;
          if (this.swampZone(px, pz) !== 'water') continue;
          const pad = makeLilypad(rng);
          pad.scale.setScalar(1.5);
          pad.position.set(px, this.heightAt(px, pz) + 0.9 + 0.06, pz); // rides at water level
          group.add(pad);
        }
      }
    }

    // spider-web fields: clusters of big sticky webs over ~30% of the biome
    const chunkWebs = [];
    if (biome.webField) {
      const wf = valueNoise(cxw + CHUNK / 2, czw + CHUNK / 2, 130, this.seed + 555);
      if (wf > 0.42) {
        const n = Math.round((6 + rng() * 8) * Math.min(1, (wf - 0.42) / 0.3 + 0.4));
        for (let i = 0; i < n; i++) {
          const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
          if (!inBounds(x, z)) continue;
          const web = makeCobweb(rng);
          web.position.set(x, this.heightAt(x, z) + 0.07, z);
          web.rotation.y = rng() * Math.PI * 2;
          group.add(web);
          chunkWebs.push({ x, z, r: web.userData.radius ?? 2.5 });
        }
      }
    }

    scatter(22 + Math.floor(rng() * 12), () => makeGrassTuft(biome.grass, rng));
    scatter(2 + Math.floor(rng() * 3), () => makeBush(biome.foliage[0], rng));
    scatter(1 + Math.floor(rng() * 2), () => makeRock(rng));
    if (biome.flowers) scatter(2 + Math.floor(rng() * 5), () => makeFlower(rng));
    if (biome.mushrooms) scatter(1 + Math.floor(rng() * 3), () => makeMushroom(rng));
    if (rng() < 0.175) {
      const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
      if (inBounds(x, z)) {
        const id = `${key}:woodlog`;
        if (this.onWoodLog && !this._woodLogDrops.has(id)) {
          this._woodLogDrops.add(id);
          this.onWoodLog({ x, z });
        } else if (!this.onWoodLog) {
          const obj = makeLog(biome.trunk, rng);
          this._place(obj, x, z);
          obj.rotation.y = rng() * Math.PI * 2;
          group.add(obj);
        }
      }
    }

    // -- ridge-ring boulders crossing this chunk (rivers are built globally) --
    const rockColor = biome.snowy ? 0xc8d4dc : 0x82817a;
    for (const ring of this.rings) {
      if (ring.type !== 'ridge') continue;
      if (Math.abs(midR - ring.r) > CHUNK) continue;
      // only walk the angle range this chunk subtends (rings are HUGE)
      const aMid = Math.atan2(cxw + CHUNK / 2, czw + CHUNK / 2);
      const aSpan = (CHUNK * 1.5) / ring.r;
      for (let a = aMid - aSpan; a < aMid + aSpan; a += 2.3 / ring.r) {
        const bx = Math.sin(a) * ring.r, bz = Math.cos(a) * ring.r;
        if (bx < cxw - 2 || bx > cxw + CHUNK + 2 || bz < czw - 2 || bz > czw + CHUNK + 2) continue;
        if (ring.gaps.some(g => angDiff(a, g.a) < g.w / 2 + 0.6 / ring.r)) continue;
        const jx = bx + (rng() - 0.5) * 1.2, jz = bz + (rng() - 0.5) * 1.8;
        const b = makeBoulder(1.5 + rng() * 1.1, rockColor, rng);
        b.position.set(jx, this.heightAt(jx, jz) + 0.35, jz);
        group.add(b);
      }
    }

    // -- world-edge boulders --
    if (Math.abs(midR - WORLD.radius) < CHUNK * 1.5) {
      const aMid = Math.atan2(cxw + CHUNK / 2, czw + CHUNK / 2);
      const aSpan = (CHUNK * 1.5) / WORLD.radius;
      for (let a = aMid - aSpan; a < aMid + aSpan; a += 2.6 / WORLD.radius) {
        const bx = Math.sin(a) * WORLD.radius, bz = Math.cos(a) * WORLD.radius;
        if (bx < cxw - 4 || bx > cxw + CHUNK + 4 || bz < czw - 4 || bz > czw + CHUNK + 4) continue;
        const b = makeBoulder(1.9 + rng() * 1.2, 0x7c786c, rng);
        b.position.set(bx, this.heightAt(bx, bz) + 0.3, bz);
        group.add(b);
      }
    }

    // -- a berry bush (about as common as fallen logs); berries regrow --
    const bushes = [];
    if (rng() < 0.35) {
      const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
      if (inBounds(x, z)) {
        const bkey = key + ':berry';
        const mesh = makeBerryBush(rng);
        this._place(mesh, x, z);
        group.add(mesh);
        const eatenAt = this._berryEaten.get(bkey);
        const ripe = eatenAt === undefined || this.time >= eatenAt + BERRY_REGROW;
        if (!ripe) mesh.userData.berries.forEach(m => m.visible = false);
        bushes.push({ id: this.nextTreeId++, key: bkey, mesh, x, z,
                      radius: 0.75, alive: true, berries: ripe, kind: 'bush' });
      }
    }

    // -- blacksmith camps in this chunk --
    for (const sm of this.smiths) {
      if (sm.x < cxw || sm.x >= cxw + CHUNK || sm.z < czw || sm.z >= czw + CHUNK) continue;
      const mesh = makeBlacksmith();
      mesh.position.set(sm.x, this.heightAt(sm.x, sm.z), sm.z);
      mesh.rotation.y = (sm.id * 1.7) % (Math.PI * 2);
      group.add(mesh);
      sm.mesh = mesh;
      if (!sm.obstacleAdded) {
        sm.obstacleAdded = true;
        this.obstacles.push({ x: sm.x, z: sm.z, r: 1.4 });
      }
    }

    // -- landmarks whose spot falls inside this chunk --
    for (const poi of this.pois) {
      if (poi.x < cxw || poi.x >= cxw + CHUNK || poi.z < czw || poi.z >= czw + CHUNK) continue;
      const mesh = poi.type === 'lair' ? makeLairEntrance(poi.ring)
        : poi.type === 'temple' ? makeTemple()
        : poi.type === 'liana' ? makeLianaPole()
        : poi.type === 'bonfire' ? makeBonfire()
        : poi.type === 'summit' ? makeSummitCairn()
        : poi.type === 'village' ? makeVillage()
        : poi.type === 'race' ? makeRaceFlag()
        : poi.type === 'nest' ? makeNest()
        : poi.type === 'farm' ? makeFarm()
        : poi.type === 'trader' ? makeTrader()
        : poi.type === 'graveyard' ? makeGraveyardRuin()
        : poi.type === 'statue' ? makeCursedStatue()
        : poi.type === 'shrine' ? makeShrine()
        : poi.type === 'monolith' ? makeMonolith() : makeCrypt();
      mesh.position.set(poi.x, this.heightAt(poi.x, poi.z), poi.z);
      group.add(mesh);
      poi.mesh = mesh;
      if (!poi.obstacleAdded) {
        poi.obstacleAdded = true;
        this.obstacles.push({ x: poi.x, z: poi.z, r: poi.type === 'crypt' ? 2.2 : 1.6 });
      }
      this.onPoiSpawned?.(poi); // main posts crypt guards (once per session)
    }

    this.scene.add(group);
    this.chunks.set(key, { group, trees, rocks, webs: chunkWebs, bushes, props, hives });
  }

  update(dt, playerPos) {
    this.time += dt;
    // beehives rebuild themselves a while after being smashed
    for (const chunk of this.chunks.values()) {
      for (const h of chunk.hives ?? []) {
        if (h.dead && this.time >= h.regrowAt) {
          h.dead = false; h.disturbed = false; h.hp = h.maxHp;
          h.mesh.visible = true; h.mesh.rotation.z = 0;
        }
      }
    }
    // berry regrowth on loaded bushes (unloaded ones re-check on chunk gen)
    for (const chunk of this.chunks.values()) {
      for (const b of chunk.bushes ?? []) {
        if (!b.berries && this.time >= (this._berryEaten.get(b.key) ?? 0) + BERRY_REGROW) {
          b.berries = true;
          b.mesh.userData.berries.forEach(m => m.visible = true);
        }
      }
    }
    const pcx = Math.floor(playerPos.x / CHUNK), pcz = Math.floor(playerPos.z / CHUNK);
    const vr = this.viewRadius ?? VIEW_RADIUS; // adaptive quality can shrink it
    for (let dx = -vr; dx <= vr; dx++)
      for (let dz = -vr; dz <= vr; dz++)
        this._genChunk(pcx + dx, pcz + dz);

    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > (this.viewRadius ?? VIEW_RADIUS) + 1 || Math.abs(cz - pcz) > (this.viewRadius ?? VIEW_RADIUS) + 1) {
        this.scene.remove(chunk.group);
        this.chunks.delete(key);
      }
    }

    for (let i = this.fallingTrees.length - 1; i >= 0; i--) {
      const f = this.fallingTrees[i];
      f.t += dt;
      const k = Math.min(1, f.t / 0.9);
      if (f.kind === 'rock') {
        f.mesh.scale.setScalar(Math.max(0.01, 1 - k));
        f.mesh.position.y -= dt * 0.8;
      } else {
        f.mesh.rotation.x = f.dirX * k * k * (Math.PI / 2 - 0.1);
        f.mesh.rotation.z = f.dirZ * k * k * (Math.PI / 2 - 0.1);
      }
      if (f.t > 1.6) {
        f.mesh.parent?.remove(f.mesh);
        this.fallingTrees.splice(i, 1);
      }
    }

    for (const chunk of this.chunks.values()) {
      for (const t of [...chunk.trees, ...chunk.rocks, ...(chunk.bushes ?? [])]) {
        if (t.shake > 0) {
          t.shake -= dt;
          t.mesh.rotation.z = Math.sin(t.shake * 40) * 0.05 * t.shake;
          if (t.shake <= 0) t.mesh.rotation.z = 0;
        }
      }
    }
  }

  _near(pos, radius, listKey) {
    const out = [];
    const pcx = Math.floor(pos.x / CHUNK), pcz = Math.floor(pos.z / CHUNK);
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const chunk = this.chunks.get(this._chunkKey(pcx + dx, pcz + dz));
        if (!chunk) continue;
        for (const t of chunk[listKey] ?? []) {
          if (!t.alive) continue;
          const ddx = t.x - pos.x, ddz = t.z - pos.z;
          if (ddx * ddx + ddz * ddz < (radius + t.radius) ** 2) out.push(t);
        }
      }
    return out;
  }

  treesNear(pos, radius) { return this._near(pos, radius, 'trees'); }
  // beehives within reach (alive only)
  hivesNear(pos, radius) {
    const out = [];
    const pcx = Math.floor(pos.x / CHUNK), pcz = Math.floor(pos.z / CHUNK);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const chunk = this.chunks.get(this._chunkKey(pcx + dx, pcz + dz));
      for (const h of chunk?.hives ?? []) {
        if (h.dead) continue;
        if (Math.hypot(h.x - pos.x, h.z - pos.z) < radius + h.radius) out.push(h);
      }
    }
    return out;
  }
  // bash a hive; returns { firstHit, destroyed }
  hitHive(hive, dmg) {
    const res = { firstHit: !hive.disturbed, destroyed: false };
    hive.disturbed = true;
    hive.hp -= dmg;
    hive.mesh.rotation.z = (Math.random() - 0.5) * 0.15; // shudder
    if (hive.hp <= 0) {
      hive.dead = true;
      hive.mesh.visible = false;
      hive.regrowAt = this.time + 150; // rebuilds after a while
      res.destroyed = true;
    }
    return res;
  }
  // nearest unused biome prop (hive/cocoon/glade) within reach
  propNear(x, z, radius = 3) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const chunk = this.chunks.get(this._chunkKey(cx + dx, cz + dz));
      for (const pr of chunk?.props ?? []) {
        if (!pr.used && Math.hypot(pr.x - x, pr.z - z) < radius) return pr;
      }
    }
    return null;
  }
  rocksNear(pos, radius) { return this._near(pos, radius, 'rocks'); }
  bushesNear(pos, radius) { return this._near(pos, radius, 'bushes'); }

  // knock the ripe berries off a bush; they regrow after BERRY_REGROW seconds
  pickBerries(bush) {
    if (!bush.berries) return false;
    bush.berries = false;
    this._berryEaten.set(bush.key, this.time);
    bush.mesh.userData.berries.forEach(m => m.visible = false);
    bush.shake = 0.3;
    audio.sfx('base_hit', 0.3);
    return true;
  }

  // co-op: the partner harvested this bush — empty it here too (bushes are
  // seed-deterministic, so the key matches on both clients)
  applyRemoteBerry(key) {
    this._berryEaten.set(key, this.time);
    for (const chunk of this.chunks.values()) {
      for (const b of chunk.bushes ?? []) {
        if (b.key === key && b.berries) {
          b.berries = false;
          b.mesh.userData.berries.forEach(m => m.visible = false);
        }
      }
    }
  }

  // Push a circle (pos, r) out of solids. opts.boat lets the circle float
  // over lakes and ring rivers (but never past the world edge).
  collide(pos, r, opts = {}) {
    const pushOut = (ox, oz, minDist) => {
      const dx = pos.x - ox, dz = pos.z - oz;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        pos.x = ox + (dx / dist) * minDist;
        pos.z = oz + (dz / dist) * minDist;
      }
    };

    for (const tree of this.treesNear(pos, r + 0.5)) pushOut(tree.x, tree.z, r + tree.radius);
    for (const rock of this.rocksNear(pos, r + 0.5)) pushOut(rock.x, rock.z, r + rock.radius);
    for (const o of this.obstacles) pushOut(o.x, o.z, r + o.r);

    // ring barriers (pass through the gates; boats cross river rings anywhere)
    const pr = radiusOf(pos.x, pos.z);
    for (const ring of this.rings) {
      if (opts.boat && ring.type === 'river') continue;
      const half = RING_HALF[ring.type];
      if (Math.abs(pr - ring.r) > half + r) continue;
      const a = Math.atan2(pos.x, pos.z);
      if (ring.gaps.some(g => angDiff(a, g.a) < g.w / 2)) continue;
      const target = ring.r + (pr >= ring.r ? 1 : -1) * (half + r);
      const k = target / (pr || 1);
      pos.x *= k; pos.z *= k;
    }

    // lakes (boats float over them; islands are solid ground)
    if (!opts.boat) {
      for (const lake of this.lakesNear(pos.x, pos.z)) {
        const d = Math.hypot(pos.x - lake.x, pos.z - lake.z);
        if (lake.island && d < lake.island.r + r * 0.5) continue; // on the island
        if (d < lake.r + r) pushOut(lake.x, lake.z, r + lake.r);
      }
    }
    return pos;
  }

  isTargetSafe(pos, team = null) {
    return this.safeZones.some(z => {
      if (z.team != null && z.team !== team) return false;
      return Math.hypot(pos.x - z.x, pos.z - z.z) < z.r;
    });
  }

  pushOutOfSafeZones(pos, r = 0) {
    for (const z of this.safeZones) {
      const dx = pos.x - z.x, dz = pos.z - z.z;
      const minDist = z.r + r;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDist * minDist) continue;
      const dist = Math.sqrt(distSq) || 1;
      const nx = distSq > 1e-6 ? dx / dist : 1;
      const nz = distSq > 1e-6 ? dz / dist : 0;
      pos.x = z.x + nx * minDist;
      pos.z = z.z + nz * minDist;
    }
    return pos;
  }

  // Clamp a point into the same ring band as the anchor (spawns stay in the
  // player's "room" between two ring barriers).
  clampToBand(x, z, ax, az, margin = 5) {
    const ar = radiusOf(ax, az);
    let lo = 20, hi = WORLD.radius - 5;
    for (const ring of this.rings) {
      if (ring.r < ar && ring.r + margin > lo) lo = ring.r + margin;
      if (ring.r >= ar && ring.r - margin < hi) hi = ring.r - margin;
    }
    const r = radiusOf(x, z) || 1;
    const cl = Math.max(lo, Math.min(hi, r));
    return { x: x * (cl / r), z: z * (cl / r) };
  }

  // ---- harvesting ----
  chop(tree, power, fromPos) {
    tree.hp -= power;
    tree.shake = 0.35;
    audio.sfx('base_hit', 0.4);
    if (tree.hp > 0) return 0;
    tree.alive = false;
    const dx = tree.x - fromPos.x, dz = tree.z - fromPos.z;
    const len = Math.hypot(dx, dz) || 1;
    this.fallingTrees.push({ mesh: tree.mesh, t: 0, dirX: (dz / len), dirZ: (dx / len), kind: 'tree' });
    audio.sfx('tower_build', 0.55);
    return tree.wood;
  }

  mineRock(rock, power, fromPos) {
    rock.hp -= power;
    rock.shake = 0.3;
    audio.sfx('mine_hit', 0.55);
    if (rock.hp > 0) return 0;
    rock.alive = false;
    this.fallingTrees.push({ mesh: rock.mesh, t: 0, dirX: 0, dirZ: 0, kind: 'rock' });
    audio.sfx('rock_crack', 0.6);
    return rock.stone;
  }
}
