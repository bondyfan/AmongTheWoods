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
         makeBerryBush } from './models.js';
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
function latticeHash(ix, iz, seed) {
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
    this._genRings();
    this._genLakes();
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

  // How strongly (0..1) a mountain massif rises here — masked low-frequency
  // noise, kept away from ring barriers so gates and bridges stay usable.
  _mountainK(x, z, r = radiusOf(x, z)) {
    const m = valueNoise(x, z, 420, this.seed + 57);
    if (m <= 0.62) return 0;
    // fade massifs out SMOOTHLY near ring barriers (a hard cutoff would
    // leave impassable vertical walls circling every ring)
    let fade = 1;
    for (const w of this.rings || []) {
      const d = Math.abs(r - w.r);
      if (d < 55) fade = Math.min(fade, Math.max(0, (d - 25) / 30));
    }
    if (fade <= 0) return 0;
    const k = (m - 0.62) / 0.38;
    return k * k * fade;
  }

  // Terrain height — detail bumps + long rolling hills + occasional mountain
  // massifs with rugged tops; flattened around the cave & camp.
  heightAt(x, z) {
    let h = valueNoise(x, z, 30, this.seed) * 1.9
          + valueNoise(x, z, 10, this.seed + 7) * 0.55
          - 1.2;
    const r = radiusOf(x, z);
    h += (valueNoise(x, z, 160, this.seed + 31) - 0.5) * 5;
    const mk = this._mountainK(x, z, r);
    if (mk > 0) {
      let m = mk * (20 + valueNoise(x, z, 55, this.seed + 91) * 12);
      // terraces: flat plateaus separated by short CLIFF walls — too steep to
      // walk up (the player's slope gate blocks them) but fine to drop off
      const t = m / TERRACE_STEP, fl = Math.floor(t), f = t - fl;
      const RAMP = 0.25; // last quarter of each band is the cliff face
      const s = f < 1 - RAMP ? 0 : (f - (1 - RAMP)) / RAMP;
      m = (fl + s * s * (3 - 2 * s)) * TERRACE_STEP;
      h += m;
    }
    if (r < 28) h *= Math.max(0.1, (r - 10) / 18);
    return h;
  }

  // ---- ring barriers at the biome edges: ridge (boulders + gates) or river
  // (water ring + bridges). Bigger rings get more gates. ----
  _genRings() {
    const rng = mulberry32(this.seed ^ 0x5eed);
    const radii = BIOMES.slice(0, -1).map(b => b.rMax);
    this.rings = radii.map((r, i) => {
      const type = i % 2 === 0 ? 'ridge' : 'river';
      const gaps = [];
      const count = Math.max(2, Math.round(r / 250));
      for (let g = 0; g < count; g++) {
        const width = (type === 'river' ? 9 : 15) + rng() * 8; // meters of opening
        gaps.push({ a: rng() * Math.PI * 2, w: width / r });   // width in radians
      }
      return { r, type, gaps };
    });
  }

  // ---- lakes are generated lazily per region cell (the world is huge) ----
  _genLakes() {} // kept for subclass overrides (MOBA disables lakes)

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
    for (let a = OPEN_HALF; a < Math.PI * 2 - OPEN_HALF; a += 1.7 / R) {
      const bx = Math.sin(a) * R, bz = Math.cos(a) * R; // a=0 → +z (the opening)
      const scale = 1.4 + rng() * 0.8;
      const b = makeBoulder(scale, 0x5c584e, rng);
      b.position.set(bx, this.heightAt(bx, bz) + 0.3, bz);
      this._addStatic(b);
      this.obstacles.push({ x: bx, z: bz, r: scale * 0.85 }); // matches the rock
    }
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 0.6 + rng() * Math.PI * 0.8; // back of the cave
      const d = 3 + rng() * (R - 5);
      const sx = Math.sin(a) * d, sz = Math.cos(a) * d;
      const s = makeStalagmite(rng);
      s.position.set(sx, this.heightAt(sx, sz), sz);
      this._addStatic(s);
    }
    // a small campfire just outside the cave mouth — home
    const fire = makeCampfire();
    fire.position.set(2, this.heightAt(2, 14), 14);
    this._addStatic(fire);
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

    // the cave floor is dark rock
    if (r < WORLD.caveR + 2.5) out.lerp(new THREE.Color(0x2a2a26), Math.min(1, (WORLD.caveR + 2.5 - r) / 3));

    // subtle per-vertex jitter so large flats never look uniform
    const j = (latticeHash(Math.round(x * 3), Math.round(z * 3), this.seed + 99) - 0.5) * 0.05;
    out.offsetHSL(0, 0, j);
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
    const segs = this._mountainK(cxw + CHUNK / 2, czw + CHUNK / 2) > 0 ? 20 : 10;
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
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.receiveShadow = true;
    return mesh;
  }

  _chunkKey(cx, cz) { return cx + ',' + cz; }

  _place(obj, x, z) {
    obj.position.set(x, this.heightAt(x, z), z);
    return obj;
  }

  isWater(x, z) {
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
        count = Math.min(64, Math.round(count * (2 + k * k * 3.5)));
        denseWood = true; // thick woods grow TALL trees, not saplings
      }
    }
    for (let i = 0; i < count; i++) {
      const x = cxw + rng() * CHUNK;
      const z = czw + rng() * CHUNK;
      if (!inBounds(x, z)) continue;
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

    this.scene.add(group);
    this.chunks.set(key, { group, trees, rocks, bushes });
  }

  update(dt, playerPos) {
    this.time += dt;
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
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++)
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++)
        this._genChunk(pcx + dx, pcz + dz);

    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > VIEW_RADIUS + 1 || Math.abs(cz - pcz) > VIEW_RADIUS + 1) {
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
    audio.sfx('base_hit', 0.5);
    if (rock.hp > 0) return 0;
    rock.alive = false;
    this.fallingTrees.push({ mesh: rock.mesh, t: 0, dirX: 0, dirZ: 0, kind: 'rock' });
    audio.sfx('tower_build', 0.5);
    return rock.stone;
  }
}
