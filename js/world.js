// ---- Continent survival world ----
// You start in a dark cave inside the walled Verdant valley; seven wild
// zones are stacked around it like the Eastern Kingdoms, and only
// consecutive tiers share a gated border (boulder ridge or border river
// with a bridge) — every other border is an impassable mountain wall, so
// the journey runs the whole chain zone by zone. Lakes dot the wilds — the
// big ones hide treasure islands you can only reach by boat. Trees give
// wood, scattered rocks give stone.

import * as THREE from 'three';
import { WORLD, BIOMES, biomeAt, biomeIndexAt, radiusOf, zoneInfoAt,
         ZONE_LINES, wobX, wobZ, hubEdgeR, coastRAt, coastDistAt,
         HARBOR_SPECS } from './config.js';
import { makeTree, makeRock, makeGrassTuft, makeFlower, makeMushroom, makeBush,
         makeLog, makeBoulder, makeBridge, makeCampfire, makeStalagmite,
         makeBerryBush, makeShrine, makeMonolith, makeCrypt, makeBlacksmith, makeCobweb,
         makeFarm, makeTrader, makeBeehive, makeBeehiveBig, makeCocoon, makeGlade, makeGraveyardRuin,
         makeCursedStatue, makeVillage, makeRaceFlag, makeNest, makeLilypad,
         makeTemple, makeLianaPole, makeBonfire, makeSummitCairn, makeCactus,
         makeLairEntrance, makeCage, makeFern, makeTownHouse, makeChurch,
         makeFountain, makeWheatTuft, makeJunglePlant, makeReeds, makePebbles,
         makePalm, makeGroundLeaves, makeFarTree } from './models.js';
import { makePier } from './ship.js';
import { bakeGroup, bakeAccumulator, buildBakedMesh, bakeAt, BAKED_MAT,
         isSharedMaterial, waterMaterial } from './models.js';
import { worldPatch } from './worldpatch.js';
import { audio } from './audio.js';

const CHUNK = 40;
const VIEW_RADIUS = 3;   // chunks around the player kept alive
// half-width of the border barrier bands (the Frostwall is a fat ridge)
const BORDER_HALF = { ridge: 2.2, river: 2.7, wall: 2.8 };

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
const _gcTmp = new THREE.Color(); // scratches for the hot per-vertex color path
const _gcTmp2 = new THREE.Color();

// hypsometric tint for the editor's elevation view: deep blue → green →
// yellow → orange → white with altitude
const ELEV_STOPS = [[-6, 0x1d3a5f], [-0.8, 0x3f6f9e], [0.2, 0x3f7a4a], [5, 0x9ac25a],
  [11, 0xe0c95e], [18, 0xd08a4a], [26, 0xb0524a], [36, 0xffffff]];
const _elevA = new THREE.Color(), _elevB = new THREE.Color();
function elevationColor(h) {
  for (let i = 1; i < ELEV_STOPS.length; i++) {
    if (h <= ELEV_STOPS[i][0] || i === ELEV_STOPS.length - 1) {
      const [h0, c0] = ELEV_STOPS[i - 1], [h1, c1] = ELEV_STOPS[i];
      const t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
      return _elevA.set(c0).lerp(_elevB.set(c1), t);
    }
  }
  return _elevA.set(0xffffff);
}

function valueNoise(x, z, scale, seed) {
  const fx = x / scale, fz = z / scale;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const tx = smooth(fx - ix), tz = smooth(fz - iz);
  const a = latticeHash(ix, iz, seed), b = latticeHash(ix + 1, iz, seed);
  const c = latticeHash(ix, iz + 1, seed), d = latticeHash(ix + 1, iz + 1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

const LAKE_REGION = 220; // deterministic lakes are generated per region cell
const BERRY_REGROW = 600; // seconds until a harvested bush bears fruit again
// five tree sizes (sapling → forest giant): hidden trunk health an axe must
// chew through, and the wood paid out on the fall. Only axes chop (weapon.chop).
const TREE_HP = [3, 6, 10, 16, 24];
const TREE_WOOD = [1, 2, 3, 4, 5];
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
    this.foliageMult = 1;        // graphics setting: scatter-density multiplier
    this.farChunks = new Map();  // cheap far-LOD tiles (terrain + tree impostors)
    this.farRadius = 0;          // chunks of far tier past viewRadius (main sets it)
    this._berryEaten = new Map(); // bush key -> world time it was harvested
    this.pois = [];              // landmarks: shrines / monoliths / crypts
    this.onPoiSpawned = null;    // main hooks this to post crypt guards
    this.smiths = [];            // wandering blacksmiths — forge gear at them
    this._patchObstacles = new Set(); // building obstacles already pushed
    this._genRings();
    this._genLakes();
    this._genPois();
    this._genSmiths();
    this._genPaths();
    this._buildGround();
    this._buildRingRivers();
    this._buildCave();
    this._buildHarbors();
  }

  _addStatic(mesh) {
    this.scene.add(mesh);
    this._statics.push(mesh);
    return mesh;
  }

  // Remove everything this world put into the scene (mode/world swap).
  dispose() {
    for (const m of this._statics) { this.scene.remove(m); this._disposeGroup(m); }
    this._statics = [];
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.group);
      this._disposeGroup(chunk.group);
    }
    this.chunks.clear();
    for (const key of [...this.farChunks.keys()]) this._dropFarChunk(key);
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
    this._buildHarbors();
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

  // 0..1: how deep inside the (flat) Murky Swamp this point is — blends
  // over 40 m so the bog floor meets its neighbour zones smoothly
  _swampFlatK(zi) {
    return zi.idx === 3 ? Math.min(1, zi.borderDist / 40) : 0;
  }

  // 0..1: how deep inside the Highlands — its massifs grow EXTREME
  _highlandsK(zi) {
    return zi.idx === 6 ? Math.min(1, zi.borderDist / 50) : 0;
  }

  // How strongly (0..1) a mountain massif rises here — masked low-frequency
  // noise, kept away from zone borders so gates and bridges stay usable.
  // In the Highlands the mask opens wide (mountains everywhere); in the
  // swamp it closes completely (dead flat bog).
  _mountainK(x, z, zi = zoneInfoAt(x, z)) {
    if (zi.idx === 3) return 0; // the swamp has NO hills or mountains
    const thr = 0.62 - 0.17 * this._highlandsK(zi);
    const m = valueNoise(x, z, 420, this.seed + 57);
    if (m <= thr) return 0;
    // fade massifs out SMOOTHLY near zone borders (a hard cutoff would
    // leave impassable vertical walls along every seam)
    let fade = 1;
    if (this._hasBorders && zi.borderDist < 55) {
      fade = Math.max(0, (zi.borderDist - 25) / 30);
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
  _terrainH(x, z, zi = zoneInfoAt(x, z)) {
    let h = valueNoise(x, z, 30, this.seed) * 1.9
          + valueNoise(x, z, 10, this.seed + 7) * 0.55
          - 1.2;
    const r = radiusOf(x, z);
    h += (valueNoise(x, z, 160, this.seed + 31) - 0.5) * 5;
    // the Murky Swamp is dead flat — only faint ripples in the peat
    const flat = this._swampFlatK(zi);
    if (flat > 0) h *= 1 - 0.88 * flat;
    const mk = this._mountainK(x, z, zi);
    if (mk > 0) {
      const highK = this._highlandsK(zi); // Highlands: EXTREMELY tall massifs
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
  swampZone(x, z, zi = null) {
    zi ??= zoneInfoAt(x, z);
    if (zi.idx !== 3) return null;                               // not in the swamp
    if (zi.borderDist < 14) return 'mud';                        // passable border band
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
    const zi = zoneInfoAt(x, z);
    let h = this._terrainH(x, z, zi);
    const sz = this.swampZone(x, z, zi);
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
    // the island falls into the sea past the coastline: a short beach, then
    // a seabed shelf (the ocean plane floats at y = -0.85)
    const cd = coastDistAt(x, z);
    if (cd < 20) {
      // beach → wadeable shallows shelf…
      const k = Math.max(0, Math.min(1, (20 - cd) / 50));
      h = h * (1 - k) - 1.6 * k;
    }
    if (cd < -30) {
      // …then the bottom drops to the deep (the ocean is ~6 m deep)
      const k2 = Math.max(0, Math.min(1, (-30 - cd) / 60));
      h = h * (1 - k2) - 7 * k2;
    }
    // harbors rest on a gentle flattened apron — the pier connects to the
    // shore without a step or a cliff
    for (const hb of this.harbors ?? []) {
      const hd = Math.hypot(x - hb.x, z - hb.z);
      if (hd < 24) {
        const k = smooth(1 - hd / 24);
        h = h * (1 - k) + 0.5 * k;
      }
    }
    // World-Editor overrides: sculpted height deltas; painted shallow water
    // sits in a hand-dug basin, painted DEEP water in a 6 m pit
    h += worldPatch.heightAt(x, z);
    const pw = worldPatch.waterAt(x, z);
    if (pw === 1) h -= 1.1;
    else if (pw === 3) h -= 6;
    return h;
  }

  // ---- zone borders: every border line is walked into a dense list of
  // SAMPLES (~3 m apart), each typed by probing what actually lies on its
  // two sides — a consecutive-tier pair gets its ridge/river type, anything
  // else becomes an impassable wall, and stretches where both sides match
  // (the Desert west wrap, the inside of the valley) get no barrier at all.
  // Collision, water, boulders and the minimap all read these same samples,
  // so they always agree with biomeIndexAt. Gates are the only crossings,
  // and only consecutive tiers get one. ----
  _genRings() {
    this.rings = [];        // legacy: nothing is radial anymore
    this.edges = [];        // legacy (MOBA override compat)
    this._hasBorders = true;
    const rng = mulberry32(this.seed ^ 0x5eed);

    // bisection solvers against the wobble fields (both are monotone)
    const solveZ = (x, c) => {
      let lo = c - 170, hi = c + 170;
      for (let i = 0; i < 20; i++) {
        const m = (lo + hi) / 2;
        if (m + wobZ(x, m) < c) lo = m; else hi = m;
      }
      return (lo + hi) / 2;
    };
    const solveX = (z, c) => {
      let lo = c - 170, hi = c + 170;
      for (let i = 0; i < 20; i++) {
        const m = (lo + hi) / 2;
        if (m + wobX(m, z) < c) lo = m; else hi = m;
      }
      return (lo + hi) / 2;
    };
    const solveBlob = (a) => {
      const sa = Math.sin(a), ca = Math.cos(a);
      let lo = WORLD.hubR - 140, hi = WORLD.hubR + 140;
      for (let i = 0; i < 18; i++) {
        const m = (lo + hi) / 2;
        if (m - hubEdgeR(sa * m, ca * m) < 0) lo = m; else hi = m;
      }
      const r0 = (lo + hi) / 2;
      return { x: sa * r0, z: ca * r0 };
    };

    const PAIR_TYPE = { '0,1': 'ridge', '1,2': 'river', '2,3': 'ridge',
      '3,4': 'river', '4,5': 'ridge', '5,6': 'river', '6,7': 'ridge' };
    const R2 = WORLD.radius - 6;
    this.borderSamples = [];
    const addSample = (x, z, nx, nz) => {
      if (Math.hypot(x, z) > R2) return;
      if (coastDistAt(x, z) < -85) return; // barriers reach past the swimmable band (hard swim limit is −80)
      const a = zoneInfoAt(x - nx * 7, z - nz * 7, true).idx;
      const b = zoneInfoAt(x + nx * 7, z + nz * 7, true).idx;
      if (a === b) return; // not a real border here
      const pair = Math.min(a, b) + ',' + Math.max(a, b);
      const type = Math.abs(a - b) === 1 && PAIR_TYPE[pair] ? PAIR_TYPE[pair] : 'wall';
      // biomes flow into each other freely now — only the border RIVERS
      // stay, as natural geography (bridges at the crossings, swimmable)
      if (type !== 'river') return;
      this.borderSamples.push({ x, z, nx, nz, type, pair });
    };
    for (const L of ZONE_LINES) {
      if (L.axis === 'z') {
        for (let x = -R2; x <= R2; x += 3) addSample(x, solveZ(x, L.c), 0, 1);
      } else {
        for (let z = L.lo - 150; z <= L.hi + 150; z += 3) addSample(solveX(z, L.c), z, 1, 0);
      }
    }
    // the valley rim
    for (let a = 0; a < Math.PI * 2; a += 2.2 / WORLD.hubR) {
      const p = solveBlob(a);
      const rr = Math.hypot(p.x, p.z) || 1;
      addSample(p.x, p.z, p.x / rr, p.z / rr);
    }

    // bucket the samples for cheap runtime lookups (collision & water)
    this._borderCell = 60;
    this._borderBuckets = new Map();
    this.borderSamples.forEach((s, i) => {
      const k = Math.floor(s.x / this._borderCell) + ',' + Math.floor(s.z / this._borderCell);
      if (!this._borderBuckets.has(k)) this._borderBuckets.set(k, []);
      this._borderBuckets.get(k).push(i);
    });

    // ---- gates: the ONLY crossings, one consecutive-tier pair each ----
    this.gates = [];
    const addGate = (x, z, pair, across) => this.gates.push({
      x, z, w: PAIR_TYPE[pair] === 'river' ? 6 : 8.5, pair, across });
    // valley gate: on the south-west arc, opening into the Desert
    for (let t = 0; t < 14; t++) {
      const a = -(0.35 + rng() * 0.85);
      const p = solveBlob(a);
      const rr = Math.hypot(p.x, p.z) || 1;
      if (zoneInfoAt(p.x * (1 + 12 / rr), p.z * (1 + 12 / rr), true).idx !== 1) continue;
      addGate(p.x, p.z, '0,1', { x: p.x / rr, z: p.z / rr });
      break;
    }
    // border-line gates; dir points from zone i INTO zone i+1
    const GATE_SPECS = [
      { pair: '1,2', axis: 'z', c: 1480, lo: -1500, hi: -280, dir: { x: 0, z: 1 } },
      { pair: '2,3', axis: 'z', c: 1480, lo: 280, hi: 1500, dir: { x: 0, z: -1 } },
      { pair: '3,4', axis: 'z', c: 630, lo: 720, hi: 1700, dir: { x: 0, z: -1 } },
      { pair: '4,5', axis: 'z', c: -520, lo: 720, hi: 1700, dir: { x: 0, z: -1 } },
      { pair: '5,6', axis: 'x', c: -160, lo: -1350, hi: -660, dir: { x: -1, z: 0 } },
      { pair: '6,7', axis: 'z', c: -1480, lo: -1750, hi: -380, dir: { x: 0, z: -1 } },
    ];
    for (const spec of GATE_SPECS) {
      const placed = [];
      for (let g = 0; g < 2; g++) {
        for (let t = 0; t < 12; t++) {
          const p = spec.lo + rng() * (spec.hi - spec.lo);
          if (placed.some(q => Math.abs(q - p) < 330)) continue;
          const gx = spec.axis === 'z' ? p : solveX(p, spec.c);
          const gz = spec.axis === 'z' ? solveZ(p, spec.c) : p;
          const a = zoneInfoAt(gx - spec.dir.x * 12, gz - spec.dir.z * 12, true).idx;
          const b = zoneInfoAt(gx + spec.dir.x * 12, gz + spec.dir.z * 12, true).idx;
          if (Math.min(a, b) + ',' + Math.max(a, b) !== spec.pair) continue;
          if (coastDistAt(gx, gz) < 60) continue; // keep crossings off the beach
          placed.push(p);
          addGate(gx, gz, spec.pair, spec.dir);
          break;
        }
      }
    }
    this.hubGates = this.gates.filter(g => g.pair === '0,1'); // compat
    // only river crossings matter on the map now (walls are gone)
    this.gateList = this.gates
      .filter(g => PAIR_TYPE[g.pair] === 'river')
      .map(g => ({ x: g.x, z: g.z }));

    // ---- harbors: the ship line's two piers, resolved against the real
    // coastline (nudged along the shore until they sit in the right zone) ----
    this.harbors = [];
    for (const spec of HARBOR_SPECS) {
      for (let t = 0; t < 30; t++) {
        const a = spec.a + (t % 2 ? -1 : 1) * 0.05 * Math.ceil(t / 2);
        const sa = Math.sin(a), ca = Math.cos(a);
        const cr = coastRAt(sa * 2000, ca * 2000);
        const hx = sa * (cr - 8), hz = ca * (cr - 8);
        if (zoneInfoAt(hx, hz, true).idx !== spec.zone) continue;
        this.harbors.push({ id: spec.id, name: spec.name, x: hx, z: hz, outX: sa, outZ: ca });
        break;
      }
    }

    // minimap polylines: contiguous same-type runs of decimated samples
    this.borderLines = [];
    let run = null, lastS = null, lastPt = null;
    for (const s of this.borderSamples) {
      if (!run || !lastS || s.type !== run.type
          || Math.hypot(s.x - lastS.x, s.z - lastS.z) > 30) {
        run = { type: s.type, pts: [{ x: s.x, z: s.z }] };
        this.borderLines.push(run);
        lastPt = s;
      } else if (Math.hypot(s.x - lastPt.x, s.z - lastPt.z) > 55) {
        run.pts.push({ x: s.x, z: s.z });
        lastPt = s;
      }
      lastS = s;
    }
    this.borderLines = this.borderLines.filter(bl => bl.pts.length >= 2);
  }

  // Nearest blocked border sample at pos (null when clear): gates punch an
  // open hole, boats cross border rivers anywhere, and boulder walls open
  // where a road runs (rivers never do — trails only cross at bridges).
  // Returns the pushed-out position.
  _borderHit(pos, pr, opts = {}) {
    if (!this._hasBorders) return null;
    const C = this._borderCell;
    const cx = Math.floor(pos.x / C), cz = Math.floor(pos.z / C);
    let best = null, bestD = BORDER_HALF.wall + pr;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const list = this._borderBuckets.get((cx + dx) + ',' + (cz + dz));
      if (!list) continue;
      for (const i of list) {
        const s = this.borderSamples[i];
        if ((opts.boat || opts.swimmer) && s.type === 'river') continue;
        const d = Math.hypot(pos.x - s.x, pos.z - s.z);
        if (d >= BORDER_HALF[s.type] + pr || d >= bestD) continue;
        bestD = d; best = s;
      }
    }
    if (!best) return null;
    if (this.gates.some(g => Math.hypot(pos.x - g.x, pos.z - g.z) < g.w + pr)) return null;
    if (best.type !== 'river' && this.pathDistance(pos.x, pos.z) < 4) return null;
    const side = (pos.x - best.x) * best.nx + (pos.z - best.z) * best.nz >= 0 ? 1 : -1;
    const push = BORDER_HALF[best.type] + pr;
    return { x: best.x + best.nx * side * push, z: best.z + best.nz * side * push };
  }

  // ---- winding field paths: the main road leaves camp through the
  // homeland gate of the Desert, crosses every wedge seam at its low gate
  // in tier order, and ends at the Frozen summit. Side trails run from camp
  // to the other homeland gates, and every zone forks toward its boss lair
  // plus one red-herring dead end. ----
  _genPaths() {
    this.pathPts = [];
    this.branches = [];       // fork spurs: { kind:'lair'|'deadend', pts:[...] }
    this._pathBuckets = new Map();
    this._pathSegs = [];      // every walkable segment (main road + branches)
    if (!this.gates?.length) return;
    const rng = mulberry32(this.seed ^ 0xf1e1d);

    // A gently-meandering trail between two points: straight line plus a
    // perpendicular sine sway that fades to 0 at both ends, so every leg
    // hits its endpoint dead-on.
    const trail = (sx, sz, ex, ez, meanderAmp) => {
      const dx = ex - sx, dz = ez - sz;
      const dist = Math.hypot(dx, dz) || 1;
      const n = Math.max(4, Math.ceil(dist / 22));
      const waves = 2 + Math.floor(rng() * 3), phase = rng() * Math.PI * 2;
      const amp = Math.min(meanderAmp, dist * 0.06);
      const px = -dz / dist, pz = dx / dist;
      const out = [];
      for (let i = 1; i <= n; i++) {
        const t = i / n, fade = Math.sin(t * Math.PI);
        const off = Math.sin(t * Math.PI * waves + phase) * amp * fade;
        out.push({ x: sx + dx * t + px * off, z: sz + dz * t + pz * off });
      }
      return out;
    };

    let cur = { x: 0, z: 26 };
    const pts = [{ ...cur }];
    const pushLeg = (to, amp = 45) => {
      pts.push(...trail(cur.x, cur.z, to.x, to.z, amp));
      cur = { x: to.x, z: to.z };
    };
    const gateOf = (pair) => this.gates.find(g => g.pair === pair);

    // zone hearts: where the road pauses inside each country before pushing
    // on toward the next crossing (nominal spots, jittered per seed)
    const HEARTS = [null, [-1150, 990], [-280, 1870], [1100, 1050],
      [1370, 60], [720, -990], [-1050, -990]];
    const hearts = [null];
    for (let i = 1; i <= 6; i++) {
      let h = { x: HEARTS[i][0], z: HEARTS[i][1] };
      for (let t = 0; t < 6; t++) {
        const c = { x: HEARTS[i][0] + (rng() - 0.5) * 280,
                    z: HEARTS[i][1] + (rng() - 0.5) * 280 };
        if (zoneInfoAt(c.x, c.z, true).idx === i) { h = c; break; }
      }
      hearts.push(h);
    }

    // main road: camp → valley gate → Desert heart → 1|2 gate → Dark heart
    // → … → Jungle heart → 6|7 gate → bonfires → the summit cairn. After
    // every crossing the road steps FIRMLY into the next zone before
    // turning: the borders sway ±110 m, and without the step the road could
    // dip back into a border river just past its bridge. Branch forks start
    // at these step points (they lie on the main road).
    const entered = [null];
    // approach every gate head-on: a waypoint 140 m before and after the
    // crossing keeps the road perpendicular to the border, so it only
    // touches the barrier band at the gate (bridge) itself
    const step = (g, s) => ({ x: g.x + g.across.x * 110 * s, z: g.z + g.across.z * 110 * s });
    const crossGate = (g, amp) => {
      pushLeg(step(g, -1), amp);
      pushLeg(g, 5);
      pushLeg(step(g, 1), 5);
    };
    const g01 = gateOf('0,1');
    if (g01) crossGate(g01, 15);
    entered[1] = { ...cur };
    for (let i = 1; i <= 6; i++) {
      pushLeg(hearts[i], 60);
      const gate = gateOf(i + ',' + (i + 1));
      if (!gate) break;
      crossGate(gate, 45);
      entered[i + 1] = { ...cur };
    }
    // …then up the Frozen Peak: bonfire, bonfire, summit cairn
    for (const p of this.pois.filter(p => p.ring === 7
        && (p.type === 'bonfire' || p.type === 'summit'))) {
      pushLeg(p, 30);
    }
    this.pathPts = pts;

    // a trail that never breaches a border: re-roll the meander if a bend
    // dips into a river or wanders across a wobbled zone line (a trail
    // through a wall would OPEN it — roads part boulder barriers)
    const safeTrail = (sx, sz, ex, ez, amp, zone = null) => {
      let best = null;
      for (let t = 0; t < 5; t++) {
        const cand = trail(sx, sz, ex, ez, amp);
        const wet = cand.some(p => this._borderRiverAt(p.x, p.z));
        const strays = zone != null
          && cand.some(p => zoneInfoAt(p.x, p.z, true).idx !== zone);
        if (!wet && !strays) return cand;
        best = cand;
        amp *= 0.5;
      }
      return best;
    };
    // per zone: the entrance opens onto a 3-WAY FORK — the main road pushes
    // on, a spur runs to the boss lair, and a dead end wanders off nowhere
    for (let i = 1; i <= 7; i++) {
      const from = entered[i];
      if (!from) break;
      const lair = this.pois.find(p => p.type === 'lair' && p.ring === i);
      if (lair) {
        this.branches.push({ kind: 'lair',
          pts: [{ ...from }, ...safeTrail(from.x, from.z, lair.x, lair.z, 40, i)] });
      }
      const dead = this._randPointInZone(rng, i, 80);
      if (dead) {
        this.branches.push({ kind: 'deadend',
          pts: [{ ...from }, ...safeTrail(from.x, from.z, dead.x, dead.z, 60, i)] });
      }
    }
    // a couple of valley strolls — short trails to nowhere around home
    for (let i = 0; i < 2; i++) {
      const dead = this._randPointInZone(rng, 0, 40);
      if (dead) {
        this.branches.push({ kind: 'deadend',
          pts: [{ x: 0, z: 26 }, ...trail(0, 26, dead.x, dead.z, 30)] });
      }
    }
    // harbor spurs: a trail from each harbor's country down to its pier
    for (const h of this.harbors ?? []) {
      const from = h.id === 'jungle' ? hearts[2] : entered[7];
      if (!from) continue;
      const base = { x: h.x - h.outX * 10, z: h.z - h.outZ * 10 };
      this.branches.push({ kind: 'deadend',
        pts: [{ ...from }, ...safeTrail(from.x, from.z, base.x, base.z, 40, h.id === 'jungle' ? 2 : 7)] });
    }

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
    if (worldPatch.pathAt(x, z)) return 0;      // World-Editor painted road
    if (worldPatch.townRoadAt?.(x, z)) return 0; // auto lanes between buildings
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

  // Rough sampling box per zone (rejection-checked against zoneInfoAt, so
  // the wobbled reality always wins). Zone 0 samples radially in the valley.
  static ZONE_BOX = {
    1: [-1980, -140, -440, 1400],   // Desert (wraps up the west flank)
    2: [-1540, 1540, 1570, 2500],   // Jungle — the southern lobe
    3: [140, 1980, 720, 1400],      // Murky Swamp
    4: [850, 2200, -440, 550],      // Dark Forest
    5: [-80, 1870, -1400, -600],    // Haunted Forest
    6: [-1980, -250, -1400, -600],  // Highlands
    7: [-1540, 1540, -2500, -1570], // Frozen Peak
  };

  // random point well inside a zone (away from its borders); null if unlucky
  _randPointInZone(rng, zone, margin = 60, tries = 16) {
    const box = World.ZONE_BOX[zone];
    for (let t = 0; t < tries; t++) {
      let x, z;
      if (zone === 0) {
        const a = rng() * Math.PI * 2, r = 120 + rng() * (WORLD.hubR - 280);
        x = Math.sin(a) * r; z = Math.cos(a) * r;
      } else {
        x = box[0] + rng() * (box[1] - box[0]);
        z = box[2] + rng() * (box[3] - box[2]);
      }
      if (coastDistAt(x, z) < margin + 25) continue; // never in the surf
      const zi = zoneInfoAt(x, z, true);
      if (zi.idx !== zone || zi.borderDist < margin) continue;
      return { x, z };
    }
    return null;
  }

  // ---- landmarks: a handful of seeded POIs per zone. Shrines bless,
  // monoliths hoard resources, crypts hide treasure behind a guard pack.
  // (poi.ring is the ZONE index — the name survives from the ring era.) ----
  _genPois() {
    const rng = mulberry32(this.seed ^ 0x9013);
    this.pois = [];
    this._dryIslands = []; // carved dry pads in the swamp (POIs, smiths)
    let id = 1;

    // random point well inside a zone, away from borders / lakes / others
    const sample = (zone, { margin = 60, minPoi = 0 } = {}) => {
      for (let tries = 0; tries < 20; tries++) {
        const p = this._randPointInZone(rng, zone, zone === 0 ? Math.min(margin, 40) : margin);
        if (!p) continue;
        if (this.lakesNear(p.x, p.z).some(l => Math.hypot(p.x - l.x, p.z - l.z) < l.r + 10)) continue;
        if (minPoi && this.pois.some(pp => Math.hypot(pp.x - p.x, pp.z - p.z) < minPoi)) continue;
        return p;
      }
      return null;
    };
    const add = (type, zone, p) => {
      this.pois.push({ id: id++, type, x: p.x, z: p.z, ring: zone,
        claimed: false, guarded: false, mesh: null });
      if (zone === 3) this._dryIslands.push({ x: p.x, z: p.z, r: 24 });
    };

    const types = ['shrine', 'monolith', 'crypt'];
    for (let zone = 0; zone < BIOMES.length; zone++) {
      const count = zone === 0 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        const p = sample(zone);
        if (p) add(types[Math.floor(rng() * types.length)], zone, p);
      }
    }

    // zone-SPECIFIC landmarks: each biome gets its own signature encounters
    const place = (type, zone, count) => {
      for (let i = 0; i < count; i++) {
        const p = sample(zone, { margin: 70, minPoi: 90 });
        if (p) add(type, zone, p);
      }
    };
    for (let zone = 0; zone < 8; zone++) place('lair', zone, 1); // one named boss lair per zone (incl. Frozen Peak)
    // Quest-critical encounters are deterministic and guaranteed. Random
    // crypt/camp generation must never be able to block an eight-part line.
    place('crypt', 1, 1);
    place('crypt', 2, 1);
    for (let zone = 0; zone < 7; zone++) place('captive', zone, 1);
    place('village', 3, 2);    // Swamp: tribute buys you peace with the tribes
    place('temple', 6, 2);     // Jungle: trapped step pyramids with a treasury

    // Jungle liana ziplines come in PAIRS — E at one end glides you across
    for (let i = 0; i < 3; i++) {
      const p = sample(6, { margin: 70, minPoi: 50 });
      if (!p) continue;
      const b = rng() * Math.PI * 2;
      const tx = p.x + Math.cos(b) * 38, tz = p.z + Math.sin(b) * 38;
      if (zoneInfoAt(tx, tz).idx !== 6) continue;
      this.pois.push(
        { id: id++, type: 'liana', x: p.x, z: p.z, tx, tz, ring: 6, claimed: false, guarded: false, mesh: null },
        { id: id++, type: 'liana', x: tx, z: tz, tx: p.x, tz: p.z, ring: 6, claimed: false, guarded: false, mesh: null });
    }

    // Frozen Peak: the summit pilgrimage — two bonfire checkpoints leading
    // due north to the cairn where the Father of the Mountain waits
    {
      const x0 = (rng() - 0.5) * 400;
      for (const [type, xx, zz] of [['bonfire', x0 * 0.9, -1800],
          ['bonfire', x0 * 0.95, -2100], ['summit', x0 * 0.4, -2440]]) {
        this.pois.push({ id: id++, type, x: xx, z: zz,
          ring: 7, claimed: false, guarded: false, mesh: null });
      }
    }
    place('race', 4, 2);       // Highlands: horse races
    place('nest', 4, 3);       // Highlands: eagle nests on rock pillars
    place('farm', 0, 1);       // Verdant: an abandoned farmstead to restore
    place('trader', 0, 2);     // Verdant: wandering merchants buying surplus
    place('graveyard', 5, 2);  // Haunted: undead-wave defense events
    place('statue', 5, 3);     // Haunted: cursed statues (boon + bane)

    // ---- World-Editor overrides: deleted / moved / added landmarks ----
    // Generated ids are deterministic (fixed seed), so the patch can key
    // them; added entities get ids far above the generated range.
    this.pois = this.pois.filter(p => !worldPatch.removed.has('poi:' + p.id));
    for (const p of this.pois) {
      const mv = worldPatch.moved.get('poi:' + p.id);
      if (mv) { p.x = mv.x; p.z = mv.z; }
    }
    let extraId = 100000;
    for (const e of worldPatch.entities) {
      if (e.kind !== 'poi') continue;
      const ring = biomeIndexAt(e.x, e.z);
      this.pois.push({ id: extraId++, patchId: e.id, type: e.type, x: e.x, z: e.z,
        ring, claimed: false, guarded: false, mesh: null });
      if (ring === 3) this._dryIslands.push({ x: e.x, z: e.z, r: 24 });
    }
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
        if (r < 70 || coastDistAt(x, z) < 45) continue;
        const zi = zoneInfoAt(x, z);
        if (zi.borderDist < 18) continue;
        if (this.lakesNear(x, z).some(l => Math.hypot(x - l.x, z - l.z) < l.r + 6)) continue;
        this.smiths.push({ id: id++, x, z, obstacleAdded: false });
        // swamp smiths get a dry island too (list may not exist yet — genPois
        // runs before genSmiths and creates it; be safe either way)
        if (zi.idx === 3) (this._dryIslands ??= []).push({ x, z, r: 22 });
      }
    }

    // World-Editor overrides (delete / move / add blacksmith camps)
    this.smiths = this.smiths.filter(sm => !worldPatch.removed.has('smith:' + sm.id));
    for (const sm of this.smiths) {
      const mv = worldPatch.moved.get('smith:' + sm.id);
      if (mv) { sm.x = mv.x; sm.z = mv.z; }
    }
    let extraSmith = 100000;
    for (const e of worldPatch.entities) {
      if (e.kind !== 'smith') continue;
      this.smiths.push({ id: extraSmith++, patchId: e.id, x: e.x, z: e.z, obstacleAdded: false });
      if (zoneInfoAt(e.x, e.z, true).idx === 3) (this._dryIslands ??= []).push({ x: e.x, z: e.z, r: 22 });
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
      if (r < 70 || coastDistAt(x, z) < lr + 20) continue;
      if (zoneInfoAt(x, z, true).idx === 1) continue; // no lakes in the Desert
      const zi = zoneInfoAt(x, z);
      if (zi.borderDist < lr + 12) continue;
      if (this._mountainK(x, z, zi) > 0.02) continue; // no lakes up a mountainside
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

  // Border rivers hug the terrain: ribbons of water built from the SAME
  // border samples isWater blocks on, so the visual always matches the
  // physics. Every river gate gets a bridge.
  _buildRingRivers() {
    if (!this._hasBorders) return;
    // contiguous runs of river-typed samples → one ribbon each
    const runs = [];
    let run = null, last = null;
    for (const s of this.borderSamples) {
      if (s.type !== 'river'
          || (last && Math.hypot(s.x - last.x, s.z - last.z) > 8)) run = null;
      if (s.type === 'river') {
        if (!run) { run = []; runs.push(run); }
        run.push(s);
      }
      last = s;
    }
    const half = BORDER_HALF.river;
    for (const r0 of runs) {
      const pts = r0.filter((s, i) => i % 3 === 0);
      if (pts.length < 2) continue;
      const verts = new Float32Array(pts.length * 2 * 3);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)];
        const o = pts[Math.max(i - 1, 0)];
        const dx = q.x - o.x, dz = q.z - o.z;
        const dl = Math.hypot(dx, dz) || 1;
        const px = -dz / dl, pz = dx / dl; // perpendicular to the border
        const y = this.heightAt(p.x, p.z) + 0.18;
        verts.set([p.x + px * half, y, p.z + pz * half,
                   p.x - px * half, y, p.z - pz * half], i * 6);
      }
      const idx = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, waterMaterial(0x3f6f9e, 0.87));
      this._addStatic(mesh);
    }
    for (const gate of this.gates) {
      const river = this.borderSamples.some(s => s.type === 'river'
        && Math.hypot(s.x - gate.x, s.z - gate.z) < 12);
      if (!river) continue;
      const bridge = makeBridge(5, 8.5);
      bridge.position.set(gate.x, this.heightAt(gate.x, gate.z), gate.z);
      // the deck runs along the crossing direction
      bridge.rotation.y = Math.atan2(gate.across.x, gate.across.z);
      this._addStatic(bridge);
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

  // wooden piers reaching from each harbor's beach out over the sea
  _buildHarbors() {
    for (const h of this.harbors ?? []) {
      const pier = makePier();
      pier.position.set(h.x, 0, h.z);
      pier.rotation.y = Math.atan2(h.outX, h.outZ);
      this._addStatic(pier);
      this.obstacles.push({ x: h.x - h.outX * 4, z: h.z - h.outZ * 4, r: 0.001 });
    }
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
    const floorColor = [0, 0xa8845c, 0x9c6b38, 0x8f8a7c, 0x646b76,
      0x65527a, 0x656b70, 0x4e4965, 0x405f46, 0x9eb7c7][Math.min(level, 9)];
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 1.4, 28),
      new THREE.MeshLambertMaterial({ color: floorColor }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, y0 + 0.08, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // wall ring with the door gap toward +z (rotation.y = a makes the
    // segment's local X tangential at that angle)
    const wallH = [0, 3.0, 3.2, 3.6, 4.8, 5.0, 5.2, 5.4, 5.6, 5.9][Math.min(level, 9)];
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
            new THREE.MeshLambertMaterial({ color: level >= 8 ? 0x405f46
              : level >= 7 ? 0x554d6c : level >= 5 ? 0x5d536f
                : level >= 4 ? 0x565e6a : level >= 3 ? 0x6e6a60 : 0x5c4326 }));
      post.castShadow = true;
      post.position.set(x, this.heightAt(x, z) + (wallH + 0.6) / 2, z);
      group.add(post);
    }
    if (level >= 4) { // the keep flies its colors above the gate
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 5),
        new THREE.MeshLambertMaterial({ color: 0x4c3520 }));
      const px = Math.sin(OPEN_HALF + 0.06) * R, pz = Math.cos(OPEN_HALF + 0.06) * R;
      pole.position.set(px, this.heightAt(px, pz) + wallH + 1.4, pz);
      const flagColors = [0, 0, 0, 0, 0xb53a3a, 0x8e63b8, 0x6383a6, 0x7765a8, 0x4f9b62, 0xb8e6ff];
      const flag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.06),
        new THREE.MeshLambertMaterial({ color: flagColors[Math.min(level, 9)] }));
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
    } else { // keep and the five late-game fortress eras
      const palettes = [
        [0x6e7280, 0x5c6670], [0x746489, 0x5b4d70], [0x69737c, 0x505a64],
        [0x5c5474, 0x443d5e], [0x4f7458, 0x385440], [0xb8cedb, 0x86a9bc],
      ];
      const [wall, merlon] = palettes[Math.min(5, Math.max(0, level - 4))];
      g.add(boxMesh(2.3, h, 0.72, wall));
      g.add(boxMesh(0.95, 0.6, 0.74, merlon, h + 0.3));
    }
    return g;
  }

  // Ground tone at a world position: neighbouring zones blended along the
  // borders, dirt patches, dark cave rock at the center, sandy island shores.
  _groundColor(x, z, out) {
    const r = radiusOf(x, z);
    const zi = zoneInfoAt(x, z);
    const biome = BIOMES[zi.idx];
    // (scratch colors — this runs for every terrain vertex)

    const grassMix = valueNoise(x, z, 5, this.seed + 21);
    out.set(biome.ground).lerp(_gcTmp.set(biome.ground2), grassMix);

    const patch = valueNoise(x, z, 15, this.seed + 13);
    if (patch > 0.55) out.lerp(_gcTmp.set(biome.dirt), Math.min(1, (patch - 0.55) / 0.2));

    // World-Editor terrain paint replaces the biome base tone
    const tp = worldPatch.terrainAt(x, z);
    if (tp) out.set(tp.ground).lerp(_gcTmp.set(tp.ground2), grassMix);

    // cross-fade into the neighbouring zone near its border
    if (this._hasBorders && zi.borderDist < 24) {
      const next = BIOMES[zi.nearIdx];
      const nextCol = _gcTmp2.set(next.ground).lerp(_gcTmp.set(next.ground2), grassMix);
      out.lerp(nextCol, 0.5 - (zi.borderDist / 24) * 0.5);
    }

    // the swamp reads at a glance: deep black-teal water, black mud, moss.
    // A faint blue-green shimmer patches make the water look enchanted.
    const sz = this.swampZone(x, z, zi);
    if (sz === 'water') {
      out.set(0x16262c).lerp(_gcTmp.set(0x101c22), grassMix);
      const glow = valueNoise(x, z, 12, this.seed + 909);
      if (glow > 0.72) out.lerp(_gcTmp.set(0x1e4a5a), (glow - 0.72) / 0.28 * 0.8);
    } else if (sz === 'mud') out.lerp(_gcTmp.set(0x1c1810), 0.7);

    // Highlands mountain trails read as pale packed gravel on the rock
    if (zi.idx === 6) {
      const mk = this._mountainK(x, z, zi);
      if (mk > 0.02) {
        const pk = this._mountainPathK(x, z);
        if (pk > 0.3) out.lerp(_gcTmp.set(0xb7a97e), (pk - 0.3) / 0.7 * 0.75);
      }
    }

    // trodden field path: packed pale sand, wide and unmistakable
    const pd = this.pathDistance(x, z);
    if (pd < 5.2) {
      const trail = _gcTmp.set(0xd8b878);
      out.lerp(trail, pd < 3.6 ? 0.95 : 0.95 * (1 - (pd - 3.6) / 1.6));
    }

    // towns: packed pads around placed buildings; ten-plus buildings make
    // a real town — cobblestone squares with knitted lanes
    const tg = worldPatch.buildingGroundAt?.(x, z) ?? 0;
    if (tg === 2) {
      out.set(0x8f8c86).lerp(_gcTmp.set(0x7a776f), grassMix);
      const cobble = latticeHash(Math.round(x * 1.3), Math.round(z * 1.3), 77);
      if (cobble > 0.8) out.offsetHSL(0, 0, -0.055);      // dark set stones
      else if (cobble < 0.14) out.offsetHSL(0, 0, 0.05);  // pale worn stones
    } else if (tg === 1) {
      out.set(0xcfba86).lerp(_gcTmp.set(0xbfa878), grassMix);
    }

    // World-Editor painted water reads like still water — deep is DARK
    const pw = worldPatch.waterAt(x, z);
    if (pw === 1) out.set(0x274a5e).lerp(_gcTmp.set(0x1b3644), grassMix);
    else if (pw === 3) out.set(0x142c3c).lerp(_gcTmp.set(0x0d2030), grassMix);

    // beaches: a pale sand ribbon along the waterline, wet sand seabed below
    const cd = coastDistAt(x, z);
    if (cd < 14) {
      const sand = _gcTmp2.set(0xd6c188);
      if (cd > 0) out.lerp(sand, 1 - cd / 14);
      else out.copy(sand).lerp(_gcTmp.set(0x5e6e66), Math.min(1, -cd / 40));
    }

    // the cave floor is dark rock
    if (r < WORLD.caveR + 2.5) out.lerp(_gcTmp.set(0x2a2a26), Math.min(1, (WORLD.caveR + 2.5 - r) / 3));

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
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x14232c }));
    mesh.position.y = -4.2;
    this._addStatic(mesh);
    // the OCEAN — a ring hugging the coastline (a full-map sheet would leak
    // through every inland dip and flood the deserts with phantom water)
    const SEG = 240;
    const verts = new Float32Array((SEG + 1) * 2 * 3);
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const sa = Math.sin(a), ca = Math.cos(a);
      const inner = coastRAt(sa * 2000, ca * 2000) - 8;
      const outer = WORLD.radius + 300;
      verts.set([sa * inner, 0, ca * inner, sa * outer, 0, ca * outer], i * 6);
    }
    const sidx = [];
    for (let i = 0; i < SEG; i++) {
      const b = i * 2;
      sidx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const seaGeo = new THREE.BufferGeometry();
    seaGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    seaGeo.setIndex(sidx);
    seaGeo.computeVertexNormals();
    const sea = new THREE.Mesh(seaGeo, waterMaterial(0x2e5f8e, 0.92));
    sea.position.y = -0.85;
    this._addStatic(sea);
  }

  // vertex-colored terrain tile for one chunk (finer mesh where cliffs are)
  // (re)compute a tile's heights, colors and analytic normals in place
  _fillGroundGeo(geo) {
    const pos = geo.attributes.position;
    let colAttr = geo.attributes.color;
    if (!colAttr) {
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
      colAttr = geo.attributes.color;
    }
    const colors = colAttr.array;
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
        if (this.debugElevation) col.lerp(elevationColor(h), 0.68);
        // steep ground reads as bare rock, so cliff faces stand out
        const slope = Math.max(
          Math.abs(this.heightAt(x + 1.4, z) - h),
          Math.abs(this.heightAt(x, z + 1.4) - h)) / 1.4;
        if (slope > 0.55) col.lerp(rock, Math.min(1, (slope - 0.55) / 0.7));
      }
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    // ANALYTIC normals from heightAt (central differences): the same height
    // function on both sides of a chunk border gives continuous lighting.
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const nrm = geo.attributes.normal;
    const E = 1.2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const nx = (this.heightAt(x - E, z) - this.heightAt(x + E, z)) / (2 * E) * 0.4;
      const nz = (this.heightAt(x, z - E) - this.heightAt(x, z + E)) / (2 * E) * 0.4;
      const l = Math.hypot(nx, 1, nz);
      nrm.setXYZ(i, nx / l, 1 / l, nz / l);
    }
    pos.needsUpdate = true;
    colAttr.needsUpdate = true;
    nrm.needsUpdate = true;
    geo.computeBoundingSphere(); // sculpted peaks must not get frustum-culled
  }

  _groundTile(cxw, czw) {
    // ONE grid density for every tile of a detail level. Mixing densities
    // (finer near cliffs/paths) left T-junctions on shared edges — vertices
    // of the coarse tile interpolated across gaps the fine tile shaded
    // per-vertex, and every border showed as a seam line.
    const segs = [14, 20, 28][this.groundDetail ?? 0];
    const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, segs, segs);
    geo.rotateX(-Math.PI / 2);
    geo.translate(cxw + CHUNK / 2, 0, czw + CHUNK / 2);
    this._fillGroundGeo(geo);
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
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.group);
      this._disposeGroup(chunk.group);
    }
    this.chunks.clear();
    for (const key of [...this.farChunks.keys()]) this._dropFarChunk(key);
  }

  // rebuild ONLY the chunks touching a circle — editor strokes repaint the
  // spot they touched instead of flashing the whole island away
  regenChunksNear(x, z, r = 60) {
    const redo = [];
    for (const [key, fc] of [...this.farChunks]) {
      const [cx, cz] = key.split(',').map(Number);
      const nx = Math.max(cx * 40, Math.min(x, cx * 40 + 40));
      const nz = Math.max(cz * 40, Math.min(z, cz * 40 + 40));
      if (Math.hypot(nx - x, nz - z) <= r) this._dropFarChunk(key); // re-streams fresh
    }
    for (const [key, chunk] of [...this.chunks]) {
      const [cx, cz] = key.split(',').map(Number);
      const nx = Math.max(cx * 40, Math.min(x, cx * 40 + 40));
      const nz = Math.max(cz * 40, Math.min(z, cz * 40 + 40));
      if (Math.hypot(nx - x, nz - z) > r) continue;
      this.scene.remove(chunk.group);
      this._disposeGroup(chunk.group);
      this.chunks.delete(key);
      redo.push([cx, cz]);
    }
    // rebuild in the SAME frame — a removed-then-queued chunk would flash
    // the sea ring / underlay through the hole. Huge strokes rebuild the
    // nearest 24 now and let world.update amortize the rest.
    redo.sort((a, b) =>
      Math.hypot(a[0] * 40 + 20 - x, a[1] * 40 + 20 - z)
      - Math.hypot(b[0] * 40 + 20 - x, b[1] * 40 + 20 - z));
    for (const [cx, cz] of redo.slice(0, 24)) this._genChunk(cx, cz);
  }

  // repaint EVERY loaded tile in place, a few per frame (biome recolors,
  // elevation toggle) — nothing is removed, so nothing ever flashes
  refreshGroundAll() {
    this._retileQueue = [...this.chunks.keys()];
  }

  // repaint ground tiles in place (heights + colors only, nothing removed) —
  // this is what live terrain brushing uses: zero flicker, no model rebuilds
  refreshGroundNear(x, z, r = 60) {
    for (const [key, chunk] of this.chunks) {
      if (!chunk.tile) continue;
      const [cx, cz] = key.split(',').map(Number);
      const nx = Math.max(cx * 40, Math.min(x, cx * 40 + 40));
      const nz = Math.max(cz * 40, Math.min(z, cz * 40 + 40));
      if (Math.hypot(nx - x, nz - z) > r) continue;
      this._fillGroundGeo(chunk.tile.geometry);
    }
  }

  // World-Editor entity edits changed → regenerate landmarks, smiths and
  // trails (all deterministic, so this just re-applies the patch) and let
  // the chunks rebuild around the player. Landmark obstacles are tagged and
  // dropped here; chunk regen pushes them back at their current spots.
  applyPatchEntities(skipRegen = false) {
    worldPatch.rebuildTowns?.();
    // landmark state must SURVIVE the deterministic re-roll — otherwise
    // every editor tweak re-armed looted POIs and re-posted crypt guards
    const prevState = new Map(this.pois.map(p =>
      [p.patchId ?? ('g' + p.id), { claimed: p.claimed, guarded: p.guarded }]));
    this._patchObstacles.clear();
    this.obstacles = this.obstacles.filter(o => !o.tag);
    for (const sm of this.smiths) sm.obstacleAdded = false;
    this._genPois();
    this._genSmiths();
    this._genPaths();
    for (const p of this.pois) {
      const old = prevState.get(p.patchId ?? ('g' + p.id));
      if (old) { p.claimed = old.claimed; p.guarded = old.guarded; }
    }
    // collision comes back island-wide RIGHT NOW — chunk regen (which only
    // covers the edited area) merely re-renders the meshes
    for (const poi of this.pois) {
      poi.obstacleAdded = true;
      this.obstacles.push({ x: poi.x, z: poi.z,
        r: poi.type === 'crypt' ? 2.2 : 1.6, tag: 'poi:' + poi.id });
    }
    for (const sm of this.smiths) {
      sm.obstacleAdded = true;
      this.obstacles.push({ x: sm.x, z: sm.z, r: 1.4, tag: 'smith:' + sm.id });
    }
    for (const e of worldPatch.entities) {
      if (e.kind === 'building') {
        this._patchObstacles.add(e.id);
        this.obstacles.push({ x: e.x, z: e.z, tag: 'b:' + e.id,
          r: e.type === 'church' ? 3.4 : e.type === 'fountain' ? 1.9 : 2.3 });
      } else if (e.kind === 'hive') {
        this._patchObstacles.add(e.id);
        this.obstacles.push({ x: e.x, z: e.z, r: 0.9, tag: 'b:' + e.id });
      }
    }
    if (!skipRegen) this.regenChunks();
  }

  _chunkKey(cx, cz) { return cx + ',' + cz; }

  // free the GPU buffers of an evicted chunk (shared cache materials and the
  // shared ground-detail texture are left alone; geometries are per-chunk)
  _disposeGroup(root) {
    root.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        if (m === BAKED_MAT || isSharedMaterial(m)) continue;
        m.dispose?.(); // never m.map — the ground texture is module-shared
      }
    });
  }

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

  // standing room on a harbor pier (a dry capsule along its deck)
  _harborDry(x, z) {
    for (const h of this.harbors ?? []) {
      const ex = h.outX * 26, ez = h.outZ * 26;
      const len2 = ex * ex + ez * ez;
      let t = ((x - h.x) * ex + (z - h.z) * ez) / len2;
      t = Math.max(0, Math.min(1, t));
      if (Math.hypot(x - (h.x + ex * t), z - (h.z + ez * t)) < 3.4) return true;
    }
    return false;
  }

  isWater(x, z) { return this.waterKindAt(x, z) > 0; }

  // 0 = dry land · 1 = SHALLOW water (wadeable by anyone, slow) ·
  // 2 = DEEP water (6 m — drowns non-swimmers; learn Swimming, or boat it).
  // Deep: the open ocean past the beach shallows, the black bog, border
  // rapids, island lakes and editor-painted deep water.
  waterKindAt(x, z) {
    const pw = worldPatch.waterAt(x, z);          // World-Editor paint wins
    if (pw) return pw === 2 ? 0 : pw === 3 ? 2 : 1;
    if (this._harborDry(x, z)) return 0;          // piers stand over the sea
    const cd = coastDistAt(x, z);
    if (cd < 0) return cd < -25 ? 2 : 1;          // beach shallows, then the deep
    if (this.swampZone(x, z) === 'water' && !this._lilypadAt(x, z)) return 2;
    for (const lake of this.lakesNear(x, z)) {
      const d = Math.hypot(x - lake.x, z - lake.z);
      if (d < lake.r) {
        if (lake.island && d < lake.island.r) return 0; // the island is land
        return lake.island ? 2 : 1;  // treasure lakes are deep, ponds wadeable
      }
    }
    if (this._borderRiverAt(x, z)) return 2;
    return 0;
  }

  // the y of the water surface over deep water (for the swimming float)
  waterYAt(x, z) {
    if (worldPatch.waterAt(x, z) === 3) return this.heightAt(x, z) + 6 - 0.35;
    if (coastDistAt(x, z) < 0) return -0.9;
    return this.heightAt(x, z) + 0.2; // bog / lakes / rapids sit on their bed
  }

  // inside a border-river band (and not on a bridge)?
  _borderRiverAt(x, z) {
    if (!this._hasBorders) return false;
    const C = this._borderCell;
    const cx = Math.floor(x / C), cz = Math.floor(z / C);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const list = this._borderBuckets.get((cx + dx) + ',' + (cz + dz));
      if (!list) continue;
      for (const i of list) {
        const s = this.borderSamples[i];
        if (s.type !== 'river') continue;
        if (Math.hypot(x - s.x, z - s.z) < BORDER_HALF.river
            && !this.gates.some(g => Math.hypot(x - g.x, z - g.z) < g.w)) return true;
      }
    }
    return false;
  }

  _genChunk(cx, cz) {
    if (!Number.isFinite(cx) || !Number.isFinite(cz)) return;
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    this._dropFarChunk(key); // the real chunk replaces its far-LOD stand-in
    const group = new THREE.Group();
    const trees = [];
    const rocks = [];
    const rng = mulberry32(this.seed ^ (cx * 73856093) ^ (cz * 19349663));
    const cxw = cx * CHUNK, czw = cz * CHUNK;
    const midR = radiusOf(cxw + CHUNK / 2, czw + CHUNK / 2);
    const biome = biomeAt(cxw + CHUNK / 2, czw + CHUNK / 2);

    // detailed vertex-colored terrain for this chunk
    const tile = this._groundTile(cxw, czw);
    tile.updateMatrix();
    tile.matrixAutoUpdate = false;
    group.add(tile);

    // far god-view LOD: terrain only — the map stays readable and FAST when
    // the editor camera looks at a whole biome at once
    if (this.groundOnly) {
      this.scene.add(group);
      this.chunks.set(key, { group, tile, trees: [], rocks: [], webs: [], bushes: [], props: [], hives: [] });
      return;
    }

    // lakes whose center falls in this chunk get their water mesh here
    const chunkLakes = this.lakesNear(cxw + CHUNK / 2, czw + CHUNK / 2);
    for (const lake of chunkLakes) {
      if (lake.x < cxw || lake.x >= cxw + CHUNK || lake.z < czw || lake.z >= czw + CHUNK) continue;
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(lake.r, 20), waterMaterial(0x3f6f9e, 0.87));
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
      if (r < 14 || coastDistAt(x, z) < 8) return false;              // cave + beach/sea
      if (this.isWater(x, z)) return false;                           // nothing grows in water
      if (worldPatch.buildingGroundAt?.(x, z)) return false;          // town squares stay clear
      if (x > -13 && x < 16 && z > 8 && z < 24) return false;         // camp building spots
      if (this._hasBorders && zoneInfoAt(x, z).borderDist < 6) return false; // border bands
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
        count = Math.min(70, Math.round(count * (3 + k * k * 4)));
        denseWood = true; // thick woods grow TALL trees, not saplings
      }
    }
    for (let i = 0; i < count; i++) {
      const x = cxw + rng() * CHUNK;
      const z = czw + rng() * CHUNK;
      if (!inBounds(x, z)) continue;
      if (radiusOf(x, z) < 100) continue; // open meadow around the base
      // five tree sizes: sapling → forest giant. Deep woods grow the big ones.
      const roll = rng();
      const size = denseWood
        ? (roll < 0.08 ? 0 : roll < 0.30 ? 1 : roll < 0.60 ? 2 : roll < 0.85 ? 3 : 4)
        : (roll < 0.30 ? 0 : roll < 0.60 ? 1 : roll < 0.82 ? 2 : roll < 0.95 ? 3 : 4);
      const made = makeTree(size, biome, rng);
      // one draw call per tree; the canopy gets a subtle wind ripple
      // (trunk anchored below y0, leaves at full amplitude by y1)
      const mesh = bakeGroup(made.mesh, true, { amp: 0.35, y0: 1.6, y1: 6 });
      this._place(mesh, x, z);
      mesh.rotation.y = rng() * Math.PI * 2;
      group.add(mesh);
      trees.push({
        id: this.nextTreeId++, mesh, x, z, radius: made.radius, size,
        hp: TREE_HP[size], wood: TREE_WOOD[size], alive: true, kind: 'tree',
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

    // -- decorations (visual only): ALL of them bake into a single
    // per-chunk mesh — grass, ferns, flowers, cacti, pads… one draw call.
    // Foliage density scales with the user's graphics setting; sway makes
    // plants ride the wind shader and part around the walking player --
    const fm = this.foliageMult ?? 1;
    const deco = bakeAccumulator();
    const scatter = (n, maker, sway = null, filter = null) => {
      for (let i = 0; i < n; i++) {
        const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
        if (!inBounds(x, z)) continue;
        if (filter && !filter(x, z)) continue;
        bakeAt(deco, maker(), x, this.heightAt(x, z), z, rng() * Math.PI * 2, 1, sway);
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
        const hive = bakeGroup(makeBeehiveBig(rng));
        hive.position.set(x, this.heightAt(x, z), z);
        group.add(hive);
        hives.push({ id: this.nextTreeId++, x, z, mesh: hive, hp: 40, maxHp: 40,
                     disturbed: false, dead: false, regrowAt: 0, radius: 1.0, alive: true });
        const hobKey = 'genhive:' + key;
        if (!this._patchObstacles.has(hobKey)) {
          this._patchObstacles.add(hobKey);
          this.obstacles.push({ x, z, r: 0.9, tag: hobKey });
        }
      }
    }
    if (biome.name === 'Highlands' || biome.name === 'Scorched Desert') {
      // scattered saguaro cacti — a couple per chunk in the dry country
      const n = biome.name === 'Scorched Desert' ? 3 : 2;
      for (let i = 0; i < n; i++) {
        if (rng() > 0.5) continue;
        const x = cxw + 4 + rng() * (CHUNK - 8), z = czw + 4 + rng() * (CHUNK - 8);
        if (!inBounds(x, z)) continue;
        bakeAt(deco, makeCactus(rng), x, this.heightAt(x, z), z, rng() * Math.PI * 2);
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
          bakeAt(deco, makeLilypad(rng), px, this.heightAt(px, pz) + 0.96, pz, 0, 1.5,
            { amp: 0.12, h: 0.3 }); // pads drift gently on the bog water
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

    // sway profiles: {amp = how far tips lean, h = height of full amplitude}
    const SW_GRASS = { amp: 1, h: 0.6 }, SW_FERN = { amp: 0.8, h: 0.7 };
    const SW_PLANT = { amp: 0.7, h: 1.2 }, SW_BUSH = { amp: 0.45, h: 0.8 };
    const SW_FLOWER = { amp: 0.9, h: 0.35 }, SW_REED = { amp: 1, h: 1.5 };
    const SW_LEAF = { amp: 0.6, h: 0.4 }, SW_PALM = { amp: 0.5, h: 3.2 };
    scatter(Math.round((22 + rng() * 12) * fm), () => makeGrassTuft(biome.grass, rng), SW_GRASS);
    if (biome.jungleFlora) {
      // RAINFOREST layers: understory palms above banana plants above a
      // floor of ferns, broad leaves and grass — wall-to-wall green
      scatter(Math.round((3 + rng() * 3) * Math.min(fm, 2)), () => makePalm(rng), SW_PALM);
      scatter(Math.round((7 + rng() * 5) * fm), () => makeJunglePlant(rng), SW_PLANT);
      scatter(Math.round((14 + rng() * 8) * fm), () => makeFern(rng), SW_FERN);
      scatter(Math.round((10 + rng() * 6) * fm), () => makeGroundLeaves(rng), SW_LEAF);
      scatter(Math.round((12 + rng() * 8) * fm), () => makeGrassTuft(0x3f8a30, rng), SW_GRASS);
      scatter(Math.round((3 + rng() * 3) * fm), () => {
        const b = makeBush(biome.foliage[1 + Math.floor(rng() * 2)], rng);
        b.scale.setScalar(1.2 + rng() * 0.4);
        return b;
      }, SW_BUSH);
    } else if (denseWood) {
      // thick woods grow a forest floor: ferns, low leaves, mushroom rings
      scatter(Math.round((6 + rng() * 4) * fm), () => makeFern(rng), SW_FERN);
      scatter(Math.round((4 + rng() * 3) * fm), () => makeGroundLeaves(rng), SW_LEAF);
      scatter(Math.round((2 + rng() * 3) * fm), () => makeMushroom(rng));
    }
    if (biome.name === 'Murky Swamp') {
      scatter(Math.round((5 + rng() * 4) * fm), () => makeGroundLeaves(rng), SW_LEAF);
    }
    scatter(Math.round((2 + rng() * 3) * Math.min(fm, 2)), () => makeBush(biome.foliage[0], rng), SW_BUSH);
    scatter(1 + Math.floor(rng() * 2), () => makeRock(rng));
    scatter(Math.round((2 + rng() * 3) * Math.min(fm, 2)),
      () => makePebbles(rng, rng() < 0.5 ? 0x8a8a84 : biome.trunk));
    if (biome.flowers) scatter(Math.round((3 + rng() * 5) * fm), () => makeFlower(rng), SW_FLOWER);
    if (biome.mushrooms) scatter(Math.round((1 + rng() * 3) * fm), () => makeMushroom(rng));
    // waterside reeds hug the banks of bog pools, lakes and rivers (not the
    // open ocean beach — coastDist keeps them inland, except in the swamp)
    if (biome.name !== 'Scorched Desert' && biome.name !== 'Frozen Peak') {
      const nearWater = (x, z) =>
        (biome.name === 'Murky Swamp' || coastDistAt(x, z) > 30)
        && (this.isWater(x + 1.6, z) || this.isWater(x - 1.6, z)
         || this.isWater(x, z + 1.6) || this.isWater(x, z - 1.6));
      scatter(Math.round((biome.name === 'Murky Swamp' ? 10 : 5) * fm),
        () => makeReeds(rng), SW_REED, nearWater);
    }
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

    // -- border barriers crossing this chunk (rivers are built globally):
    // one boulder per precomputed ridge/wall sample (~3 m apart — a solid
    // wall) that falls inside this chunk --
    const rockColor = biome.snowy ? 0xc8d4dc : 0x82817a;
    if (this._hasBorders) {
      const c0x = Math.floor((cxw - 4) / this._borderCell), c1x = Math.floor((cxw + CHUNK + 4) / this._borderCell);
      const c0z = Math.floor((czw - 4) / this._borderCell), c1z = Math.floor((czw + CHUNK + 4) / this._borderCell);
      for (let bx = c0x; bx <= c1x; bx++) for (let bz = c0z; bz <= c1z; bz++) {
        for (const i of this._borderBuckets.get(bx + ',' + bz) ?? []) {
          const s = this.borderSamples[i];
          if (s.type === 'river') continue;
          if (s.x < cxw - 2 || s.x > cxw + CHUNK + 2 || s.z < czw - 2 || s.z > czw + CHUNK + 2) continue;
          if (this.gates.some(g => Math.hypot(s.x - g.x, s.z - g.z) < g.w + 1.6)) continue;
          if (this.pathDistance(s.x, s.z) < 4) continue; // never wall off a road
          const jx = s.x + (rng() - 0.5) * 1.4, jz = s.z + (rng() - 0.5) * 1.8;
          const scale = s.type === 'wall' ? 2.0 + rng() * 1.3 : 1.5 + rng() * 1.1;
          const b = makeBoulder(scale, rockColor, rng);
          b.position.set(jx, this.heightAt(jx, jz) + 0.35, jz);
          group.add(b);
        }
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

    // -- World-Editor doodads pinned in this chunk (deterministic per id) --
    for (const e of worldPatch.doodadsIn(cxw, czw, CHUNK)) {
      const drng = mulberry32((this.seed ^ 0xd00d) + (parseInt(e.id.slice(1), 10) || 0) * 7919);
      if (e.kind === 'tree') {
        const size = Math.min(4, Math.max(0, e.size ?? 1));
        // style variants: default = the local biome's tree, or a forced look
        const tb = e.variant === 'jungle' ? BIOMES[2]
          : e.variant === 'winter' ? BIOMES[7]
          : e.variant === 'dead' ? { ...BIOMES[5], trees: { pine: 0, leafy: 0, birch: 0, dead: 1 } }
          : biomeAt(e.x, e.z);
        const made2 = makeTree(size, tb, drng);
        const mesh = bakeGroup(made2.mesh, true, { amp: 0.35, y0: 1.6, y1: 6 });
        const radius = made2.radius;
        this._place(mesh, e.x, e.z);
        mesh.rotation.y = drng() * Math.PI * 2;
        group.add(mesh);
        trees.push({ id: this.nextTreeId++, mesh, x: e.x, z: e.z, radius, size,
          hp: TREE_HP[Math.min(4, size)], wood: TREE_WOOD[Math.min(4, size)],
          alive: true, kind: 'tree', patchId: e.id });
      } else if (e.kind === 'rock') {
        const sc = e.size ? 1.4 + drng() * 0.3 : 0.9 + drng() * 0.3;
        const mesh = makeBoulder(sc, 0x8a8a84, drng);
        mesh.position.set(e.x, this.heightAt(e.x, e.z) + sc * 0.25, e.z);
        group.add(mesh);
        rocks.push({ id: this.nextTreeId++, mesh, x: e.x, z: e.z, radius: sc * 0.9,
          hp: e.size ? 5 : 3, stone: e.size ? 6 : 3, alive: true, kind: 'rock', patchId: e.id });
      } else if (e.kind === 'building') {
        const mesh = bakeGroup(e.type === 'church' ? makeChurch(drng)
          : e.type === 'fountain' ? makeFountain(drng) : makeTownHouse(drng));
        this._place(mesh, e.x, e.z);
        mesh.rotation.y = e.rot ?? 0;
        group.add(mesh);
        if (!this._patchObstacles.has(e.id)) {
          this._patchObstacles.add(e.id);
          this.obstacles.push({ x: e.x, z: e.z, tag: 'b:' + e.id,
            r: e.type === 'church' ? 3.4 : e.type === 'fountain' ? 1.9 : 2.3 });
        }
      } else if (e.kind === 'deco') {
        // single decorations (visual only) join the chunk's baked deco mesh —
        // and pick up the same wind/trample sway as generated foliage
        const obj = e.type === 'cactus' ? makeCactus(drng)
          : e.type === 'fern' ? makeFern(drng)
          : e.type === 'bush' ? makeBush(biomeAt(e.x, e.z).foliage[0], drng)
          : e.type === 'mushroom' ? makeMushroom(drng)
          : e.type === 'flower' ? makeFlower(drng)
          : e.type === 'log' ? makeLog(biomeAt(e.x, e.z).trunk, drng)
          : makeGrassTuft(biomeAt(e.x, e.z).grass, drng);
        const dsway = e.type === 'fern' ? { amp: 0.8, h: 0.7 }
          : e.type === 'bush' ? { amp: 0.45, h: 0.8 }
          : e.type === 'flower' ? { amp: 0.9, h: 0.35 }
          : e.type === 'grass' || !['cactus', 'mushroom', 'log'].includes(e.type)
            ? { amp: 1, h: 0.6 } : null;
        bakeAt(deco, obj, e.x, this.heightAt(e.x, e.z), e.z, drng() * Math.PI * 2, 1, dsway);
      } else if (e.kind === 'berry') {
        // a harvestable berry bush; raspberries pay out DOUBLE
        const rasp = e.type === 'rasp';
        const mesh = makeBerryBush(drng, rasp ? 0xd8486a : undefined);
        this._place(mesh, e.x, e.z);
        group.add(mesh);
        const bkey = 'patchberry:' + e.id;
        const eatenAt = this._berryEaten.get(bkey);
        const ripe = eatenAt === undefined || this.time >= eatenAt + BERRY_REGROW;
        if (!ripe) mesh.userData.berries.forEach(m => m.visible = false);
        bushes.push({ id: this.nextTreeId++, key: bkey, mesh, x: e.x, z: e.z,
                      radius: 0.75, alive: true, berries: ripe, kind: 'bush',
                      mult: rasp ? 2 : 1, patchId: e.id });
      } else if (e.kind === 'hive') {
        // a destructible beehive — wired into the same hive systems the
        // generated ones use (bees, honey, regrow)
        const mesh = bakeGroup(makeBeehiveBig(drng));
        mesh.position.set(e.x, this.heightAt(e.x, e.z), e.z);
        group.add(mesh);
        hives.push({ id: this.nextTreeId++, x: e.x, z: e.z, mesh, hp: 40, maxHp: 40,
                     disturbed: false, dead: false, regrowAt: 0, radius: 1.0, alive: true, patchId: e.id });
        if (!this._patchObstacles.has(e.id)) {
          this._patchObstacles.add(e.id);
          this.obstacles.push({ x: e.x, z: e.z, r: 0.9, tag: 'b:' + e.id });
        }
      } else if (e.kind === 'field') {
        // wheat field / tall-grass meadow: an area sown with stalks
        const n = Math.min(160, e.count ?? 40);
        const fr = e.r ?? 10;
        for (let i = 0; i < n; i++) {
          const a = drng() * Math.PI * 2, rr = Math.sqrt(drng()) * fr;
          const fx = e.x + Math.cos(a) * rr, fz = e.z + Math.sin(a) * rr;
          if (fx < cxw || fx >= cxw + CHUNK || fz < czw || fz >= czw + CHUNK) continue;
          if (this.isWater(fx, fz)) continue;
          let obj, fsway;
          if (e.type === 'wheat') { obj = makeWheatTuft(drng); fsway = { amp: 1, h: 1.1 }; }
          else {
            obj = makeGrassTuft(0x7fa04e, drng);
            obj.scale.y = 1.9 + drng() * 0.5;
            fsway = { amp: 1, h: 1.4 };
          }
          bakeAt(deco, obj, fx, this.heightAt(fx, fz), fz, drng() * Math.PI * 2, 1, fsway);
        }
      } else if (e.kind === 'meadow') {
        // a flower meadow: the same flowers every visit, only the ones
        // whose spot falls inside THIS chunk are added here
        const n = Math.min(120, e.count ?? 24);
        const mr = e.r ?? 10;
        for (let i = 0; i < n; i++) {
          const a = drng() * Math.PI * 2, rr = Math.sqrt(drng()) * mr;
          const fx = e.x + Math.cos(a) * rr, fz = e.z + Math.sin(a) * rr;
          if (fx < cxw || fx >= cxw + CHUNK || fz < czw || fz >= czw + CHUNK) continue;
          if (this.isWater(fx, fz)) continue;
          const flower = drng() < 0.8;
          const f = flower ? makeFlower(drng) : makeGrassTuft(0x6fa04c, drng);
          bakeAt(deco, f, fx, this.heightAt(fx, fz), fz, drng() * Math.PI * 2, 1,
            flower ? { amp: 0.9, h: 0.35 } : { amp: 1, h: 0.6 });
        }
      }
    }

    // -- blacksmith camps in this chunk --
    for (const sm of this.smiths) {
      if (sm.x < cxw || sm.x >= cxw + CHUNK || sm.z < czw || sm.z >= czw + CHUNK) continue;
      const mesh = bakeGroup(makeBlacksmith());
      mesh.position.set(sm.x, this.heightAt(sm.x, sm.z), sm.z);
      mesh.rotation.y = (sm.id * 1.7) % (Math.PI * 2);
      group.add(mesh);
      sm.mesh = mesh;
      if (!sm.obstacleAdded) {
        sm.obstacleAdded = true;
        this.obstacles.push({ x: sm.x, z: sm.z, r: 1.4, tag: 'smith:' + sm.id });
      }
    }

    // -- landmarks whose spot falls inside this chunk --
    for (const poi of this.pois) {
      if (poi.x < cxw || poi.x >= cxw + CHUNK || poi.z < czw || poi.z >= czw + CHUNK) continue;
      const raw = poi.type === 'lair' ? makeLairEntrance(poi.ring)
        : poi.type === 'captive' ? makeCage()
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
      // one draw call per landmark (the captive cage keeps its live prisoner)
      const mesh = poi.type === 'captive' ? raw : bakeGroup(raw);
      mesh.position.set(poi.x, this.heightAt(poi.x, poi.z), poi.z);
      group.add(mesh);
      poi.mesh = mesh;
      if (!poi.obstacleAdded) {
        poi.obstacleAdded = true;
        this.obstacles.push({ x: poi.x, z: poi.z, r: poi.type === 'crypt' ? 2.2 : 1.6, tag: 'poi:' + poi.id });
      }
      this.onPoiSpawned?.(poi); // main posts crypt guards (once per session)
    }

    const decoMesh = buildBakedMesh(deco, false); // decorations never cast shadows
    if (decoMesh) {
      decoMesh.receiveShadow = false;
      decoMesh.updateMatrix();
      decoMesh.matrixAutoUpdate = false;
      group.add(decoMesh);
    }

    this.scene.add(group);
    this.chunks.set(key, { group, tile, trees, rocks, webs: chunkWebs, bushes, props, hives });
  }

  // ---- far-LOD tier: the world out to the fog wall ----
  // Beyond viewRadius the land used to just END (~160 m) while the fog wall
  // sat much further — the island visibly ran out of world. Far chunks are
  // CHEAP stand-ins: the same vertex-colored terrain tile plus all of the
  // chunk's trees as low-poly impostors merged into ONE mesh — 2 draw calls
  // instead of ~35, no entities, no collision, no shadows. When the player
  // walks close, the real chunk replaces the stand-in (and vice versa).
  _genFarChunk(cx, cz) {
    if (!Number.isFinite(cx) || !Number.isFinite(cz)) return;
    const key = this._chunkKey(cx, cz);
    if (this.farChunks.has(key) || this.chunks.has(key)) return;
    const cxw = cx * CHUNK, czw = cz * CHUNK;
    const midR = radiusOf(cxw + CHUNK / 2, czw + CHUNK / 2);
    // fully out at sea: the ocean ring covers it — store a tombstone so the
    // streaming loop doesn't retry the spot every frame
    if (midR > WORLD.radius + 80) { this.farChunks.set(key, { group: null }); return; }
    const biome = biomeAt(cxw + CHUNK / 2, czw + CHUNK / 2);
    const group = new THREE.Group();
    const tile = this._groundTile(cxw, czw);
    tile.updateMatrix();
    tile.matrixAutoUpdate = false;
    group.add(tile);

    // lakes read as water even from afar (visual only — no treasure hooks)
    for (const lake of this.lakesNear(cxw + CHUNK / 2, czw + CHUNK / 2)) {
      if (lake.x < cxw || lake.x >= cxw + CHUNK || lake.z < czw || lake.z >= czw + CHUNK) continue;
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(lake.r, 14), waterMaterial(0x3f6f9e, 0.87));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(lake.x, this.heightAt(lake.x, lake.z) + 0.22, lake.z);
      group.add(mesh);
    }

    // impostor forest: same density/size logic as the real chunk (its own rng
    // stream — exact positions differ, but through 150+ m of fog the swap to
    // real trees on approach is imperceptible)
    const rng = mulberry32((this.seed ^ 0xFA7) ^ (cx * 73856093) ^ (cz * 19349663));
    let count = Math.round((8 + rng() * 8) * biome.treeDensity);
    if (biome.denseForests) {
      const f = valueNoise(cxw + CHUNK / 2, czw + CHUNK / 2, 240, this.seed + 133);
      if (f > 0.68) {
        const k = Math.min(1, (f - 0.68) / 0.1);
        count = Math.min(70, Math.round(count * (3 + k * k * 4)));
      }
    }
    const acc = bakeAccumulator();
    for (let i = 0; i < count; i++) {
      const x = cxw + rng() * CHUNK;
      const z = czw + rng() * CHUNK;
      if (radiusOf(x, z) < 100) continue;      // base meadow stays open
      if (this.isWater(x, z)) continue;
      if (this.pathDistance(x, z) < 4.5) continue;
      const roll = rng();
      const size = roll < 0.30 ? 0 : roll < 0.60 ? 1 : roll < 0.82 ? 2 : roll < 0.95 ? 3 : 4;
      bakeAt(acc, makeFarTree(size, biome, rng), x, this.heightAt(x, z), z, rng() * Math.PI * 2);
    }
    const forest = buildBakedMesh(acc, false);
    if (forest) {
      forest.receiveShadow = false;
      forest.updateMatrix();
      forest.matrixAutoUpdate = false;
      group.add(forest);
    }
    this.scene.add(group);
    this.farChunks.set(key, { group });
  }

  _dropFarChunk(key) {
    const fc = this.farChunks.get(key);
    if (!fc) return;
    if (fc.group) {
      this.scene.remove(fc.group);
      this._disposeGroup(fc.group);
    }
    this.farChunks.delete(key);
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
    // pending in-place repaints (biome recolor / elevation tint)
    if (this._retileQueue?.length) {
      for (let i = 0; i < 6 && this._retileQueue.length; i++) {
        const chunk = this.chunks.get(this._retileQueue.pop());
        if (chunk?.tile) this._fillGroundGeo(chunk.tile.geometry);
      }
    }

    const pcx = Math.floor(playerPos.x / CHUNK), pcz = Math.floor(playerPos.z / CHUNK);
    const vr = this.viewRadius ?? VIEW_RADIUS; // adaptive quality can shrink it
    // nearest-first, a handful per frame — no hitches when crossing into
    // fresh country (or flying the editor camera)
    let budget = this.groundOnly ? 26 : 6;
    for (let ring = 0; ring <= vr && budget > 0; ring++) {
      for (let dx = -ring; dx <= ring && budget > 0; dx++) {
        for (let dz = -ring; dz <= ring && budget > 0; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
          if (this.chunks.has(this._chunkKey(pcx + dx, pcz + dz))) continue;
          this._genChunk(pcx + dx, pcz + dz);
          budget--;
        }
      }
    }

    // far-LOD tier: cheap terrain+forest tiles from the full-detail edge out
    // to the fog wall, so the world never visibly runs out
    const fr = this.groundOnly ? 0 : Math.min(this.farRadius ?? 0, 14);
    if (fr > vr) {
      let fbudget = 2;
      for (let ring = vr + 1; ring <= fr && fbudget > 0; ring++) {
        for (let dx = -ring; dx <= ring && fbudget > 0; dx++) {
          for (let dz = -ring; dz <= ring && fbudget > 0; dz++) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
            const k = this._chunkKey(pcx + dx, pcz + dz);
            if (this.chunks.has(k) || this.farChunks.has(k)) continue;
            this._genFarChunk(pcx + dx, pcz + dz);
            fbudget--;
          }
        }
      }
    }

    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(',').map(Number);
      const d = Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz));
      if (d > (this.viewRadius ?? VIEW_RADIUS) + 1) {
        this.scene.remove(chunk.group);
        this._disposeGroup(chunk.group);
        this.chunks.delete(key);
        // no hole while walking away: swap the evicted chunk for a far tile
        if (d <= fr) this._genFarChunk(cx, cz);
      }
    }
    for (const [key, fc] of this.farChunks) {
      const [cx, cz] = key.split(',').map(Number);
      const d = Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz));
      if (d > fr + 1 || (fc.group === null && d > fr)) this._dropFarChunk(key);
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
        this._disposeGroup(f.mesh);
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

    // the coastline: creatures are pushed back onto the island; players
    // (opts.wade) and boats may enter the sea, but a hard limit ~80 m out
    // keeps everyone from paddling off the map
    if (!this._harborDry(pos.x, pos.z)) {
      const lim = (opts.wade || opts.boat) ? -80 : 0;
      const cd = coastDistAt(pos.x, pos.z);
      if (cd < lim + r + 0.4) {
        const rr = radiusOf(pos.x, pos.z) || 1;
        const k = Math.max(0.01, (rr - (lim + r + 0.4 - cd)) / rr);
        pos.x *= k; pos.z *= k;
      }
    }

    // zone borders (pass through the gates; boats cross border rivers
    // anywhere). Two passes: a push off one border can land in another
    // barrier band at a corner.
    for (let pass = 0; pass < 2; pass++) {
      const hit = this._borderHit(pos, r, opts);
      if (!hit) break;
      pos.x = hit.x; pos.z = hit.z;
    }

    // lakes (boats float over them, waders walk in; islands are solid)
    if (!opts.boat && !opts.wade) {
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

  // Clamp a point into the same ZONE as the anchor (spawns stay in the
  // player's country instead of materializing across a border).
  clampToBand(x, z, ax, az, margin = 5) {
    const cd = coastDistAt(x, z);
    if (cd < margin + 3) {
      const rr = radiusOf(x, z) || 1;
      const k = Math.max(0.01, (rr - (margin + 3 - cd)) / rr);
      x *= k; z *= k;
    }
    const target = biomeIndexAt(ax, az);
    if (biomeIndexAt(x, z) === target) return { x, z };
    // bisect along the anchor→point segment for the last in-zone spot
    let lo = 0, hi = 1;
    for (let it = 0; it < 10; it++) {
      const m = (lo + hi) / 2;
      if (biomeIndexAt(ax + (x - ax) * m, az + (z - az) * m) === target) lo = m;
      else hi = m;
    }
    return { x: ax + (x - ax) * lo, z: az + (z - az) * lo };
  }

  // ---- harvesting ----
  chop(tree, power, fromPos) {
    tree.hp -= power;
    tree.shake = 0.35;
    audio.sfx('wood_chop', 0.55);
    if (tree.hp > 0) return 0;
    tree.alive = false;
    const dx = tree.x - fromPos.x, dz = tree.z - fromPos.z;
    const len = Math.hypot(dx, dz) || 1;
    this.fallingTrees.push({ mesh: tree.mesh, t: 0, dirX: (dz / len), dirZ: (dx / len), kind: 'tree' });
    audio.sfx('tree_fall', 0.7);
    return tree.wood;
  }

  mineRock(rock, power, fromPos) {
    rock.hp -= power;
    rock.shake = 0.3;
    audio.sfx('stone_mine', 0.55);
    if (rock.hp > 0) return 0;
    rock.alive = false;
    this.fallingTrees.push({ mesh: rock.mesh, t: 0, dirX: 0, dirZ: 0, kind: 'rock' });
    audio.sfx('rock_crack', 0.6);
    return rock.stone;
  }
}
