// ---- Terrain (heightfield + vertex-colored ground), biomes, trees, decor ----

import * as THREE from 'three';
import { WORLD, BIOMES, biomeAt, biomeIndexAt } from './config.js';
import * as MODELS from './models.js';
import { makeTree, makeRock, makeGrassTuft, makeFlower, makeMushroom, makeBush, makeLog, makeBoulder, makeCottage } from './models.js';
import { audio } from './audio.js';

const CHUNK = 40;
const VIEW_RADIUS = 3;   // chunks around the player kept alive
const WALL_HALF = 2.2;   // ridge wall half-thickness (collision)

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

export class World {
  constructor(scene, seed = 1337) {
    this.scene = scene;
    this.seed = seed;
    this.chunks = new Map();     // "cx,cz" -> { group, trees: [] }
    this.fallingTrees = [];
    this.nextTreeId = 1;
    this._statics = [];          // ground/lake/river meshes (for reset)
    this._arena = null;
    this._genWalls();
    this._genLakes();
    this._buildGround();
    this._buildLakes();
    this._buildRivers();
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
    this.nextTreeId = 1;
  }

  // Rebuild the whole world from a new seed (multiplayer sessions pick their
  // seed at lobby time, after the world was first built).
  reset(seed) {
    this.dispose();
    this.seed = seed;
    this._genWalls();
    this._genLakes();
    this._buildGround();
    this._buildLakes();
    this._buildRivers();
  }

  // ---- PvP arena: a sand circle ringed by boulders, south of the map ----
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

    // boulder ring
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

  // Rivers are terrain-hugging water ribbons; each gap gets a wooden bridge.
  _buildRivers() {
    const rng = mulberry32(this.seed ^ 0x11e5);
    for (const wall of this.walls) {
      if (wall.type !== 'river') continue;
      const width = WORLD.halfWidth * 2 + 220;
      const segX = 90;
      const geo = new THREE.PlaneGeometry(width, 5.4, segX, 1);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, this.heightAt(pos.getX(i), wall.z) + 0.18);
      }
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        color: 0x3f6f9e, transparent: true, opacity: 0.88,
      }));
      mesh.position.z = wall.z;
      this._addStatic(mesh);

      const { makeBridge } = MODELS;
      for (const gap of wall.gaps) {
        const bridge = makeBridge(Math.min(gap.w - 1.5, 5), 8.5);
        bridge.position.set(gap.x, this.heightAt(gap.x, wall.z), wall.z);
        bridge.rotation.y = (rng() - 0.5) * 0.06;
        this._addStatic(bridge);
      }
    }
  }

  // ---- barriers across the world: rock ridges with gate openings, or rivers
  // crossed by wooden bridges. They carve the open world into
  // Alien-Shooter-style "rooms" so enemies can corner the player at the
  // chokepoints. Deterministic from the seed. ----
  _genWalls() {
    const rng = mulberry32(this.seed ^ 0x5eed);
    this.walls = [];
    let z = -60 - rng() * 30;
    let idx = 0;
    while (z > WORLD.goalZ + 70) {
      const type = idx === 0 ? 'ridge' : (rng() < 0.45 ? 'river' : 'ridge');
      const gaps = [];
      const gapCount = rng() < (type === 'river' ? 0.3 : 0.4) ? 2 : 1;
      for (let i = 0; i < gapCount; i++) {
        gaps.push({
          x: -WORLD.halfWidth + 25 + rng() * (WORLD.halfWidth * 2 - 50),
          w: type === 'river' ? 6 + rng() * 3 : 13 + rng() * 8,
        });
      }
      this.walls.push({ z, gaps, type });
      z -= 100 + rng() * 80;
      idx++;
    }
  }

  // ---- lakes: circular water obstacles to walk around ----
  _genLakes() {
    const rng = mulberry32(this.seed ^ 0xa9ae);
    this.lakes = [];
    for (let i = 0; i < 90; i++) {
      const x = (rng() * 2 - 1) * (WORLD.halfWidth - 25);
      const z = -60 - rng() * 1400;
      const r = 5 + rng() * 7;
      if (Math.hypot(x, z) < 55) continue;
      if (this.walls.some(w => Math.abs(z - w.z) < r + 14)) continue;
      if (this.lakes.some(l => Math.hypot(x - l.x, z - l.z) < r + l.r + 18)) continue;
      this.lakes.push({ x, z, r });
    }
  }

  _buildLakes() {
    for (const lake of this.lakes) {
      const geo = new THREE.CircleGeometry(lake.r, 18);
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        color: 0x3f6f9e, transparent: true, opacity: 0.85,
      }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(lake.x, this.heightAt(lake.x, lake.z) + 0.22, lake.z);
      this._addStatic(mesh);
    }
  }

  // Terrain height — gentle rolling hills, flattened around the spawn clearing.
  heightAt(x, z) {
    let h = valueNoise(x, z, 30, this.seed) * 1.9
          + valueNoise(x, z, 10, this.seed + 7) * 0.55
          - 1.2;
    const r = Math.hypot(x, z);
    if (r < 30) h *= Math.max(0.15, (r - 10) / 20);
    return h;
  }

  // Ground tone at a world position: two grass tones blended by noise, dirt
  // patches, cross-fade between biomes near their borders.
  _groundColor(x, z, out) {
    const idx = biomeIndexAt(z);
    const biome = BIOMES[idx];
    const cA = new THREE.Color(biome.ground);
    const cB = new THREE.Color(biome.ground2);
    const cDirt = new THREE.Color(biome.dirt);

    const grassMix = valueNoise(x, z, 5, this.seed + 21);
    out.copy(cA).lerp(cB, grassMix);

    const patch = valueNoise(x, z, 15, this.seed + 13);
    if (patch > 0.55) out.lerp(cDirt, Math.min(1, (patch - 0.55) / 0.2));

    // blend into the next biome across the border
    if (idx < BIOMES.length - 1) {
      const distToBorder = z - biome.zMin;
      if (distToBorder < 24) {
        const next = BIOMES[idx + 1];
        const nextCol = new THREE.Color(next.ground).lerp(new THREE.Color(next.ground2), grassMix);
        out.lerp(nextCol, 1 - distToBorder / 24 * 0.5 - 0.5);
      }
    }

    // subtle per-vertex jitter so large flats never look uniform
    const j = (latticeHash(Math.round(x * 3), Math.round(z * 3), this.seed + 99) - 0.5) * 0.05;
    out.offsetHSL(0, 0, j);
    return out;
  }

  _buildGround() {
    const width = WORLD.halfWidth * 2 + 220;
    const zStart = WORLD.southEdge + 80;     // south edge of the mesh
    const zEnd = WORLD.goalZ - 220;          // beyond the goal
    const length = zStart - zEnd;
    const segX = Math.round(width / 3.5), segZ = Math.round(length / 3.5);

    const geo = new THREE.PlaneGeometry(width, length, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, zStart - length / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, this.heightAt(x, z));
      this._groundColor(x, z, col);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.receiveShadow = true;
    this._addStatic(mesh);
    this._buildSpawnPoint();
  }

  // The starting / revive spot: a stone circle with a small cottage beside it.
  _buildSpawnPoint() {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 4.3, 28),
      new THREE.MeshLambertMaterial({ color: 0x9a958a }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, this.heightAt(0, 3) + 0.06, 3);
    ring.receiveShadow = true;
    this._addStatic(ring);

    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 28),
      new THREE.MeshLambertMaterial({ color: 0x7c8a68 }));
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(0, this.heightAt(0, 3) + 0.05, 3);
    inner.receiveShadow = true;
    this._addStatic(inner);

    const cottage = makeCottage();
    cottage.position.set(-7, this.heightAt(-7, 5), 5);
    cottage.rotation.y = 0.5;
    this._addStatic(cottage);
    this.obstacles = this.obstacles || [];
    this.obstacles.push({ x: -7, z: 5, r: 2.4 });
  }

  _chunkKey(cx, cz) { return cx + ',' + cz; }

  _place(obj, x, z) {
    obj.position.set(x, this.heightAt(x, z), z);
    return obj;
  }

  _genChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    const group = new THREE.Group();
    const trees = [];
    const rng = mulberry32(this.seed ^ (cx * 73856093) ^ (cz * 19349663));
    const cxw = cx * CHUNK, czw = cz * CHUNK;
    const biome = biomeAt(czw + CHUNK / 2);

    const inBounds = (x, z) =>
      Math.abs(x) <= WORLD.halfWidth && z <= WORLD.southEdge && z >= WORLD.goalZ - 40 &&
      !this.walls.some(w => Math.abs(z - w.z) < 4.5) &&
      !this.lakes.some(l => (x - l.x) ** 2 + (z - l.z) ** 2 < (l.r + 1.2) ** 2);

    // -- trees --
    const count = Math.round((8 + rng() * 8) * biome.treeDensity);
    for (let i = 0; i < count; i++) {
      const x = cxw + rng() * CHUNK;
      const z = czw + rng() * CHUNK;
      if (!inBounds(x, z)) continue;
      if (x * x + z * z < 100) continue; // keep the spawn clearing (ring + cottage) open
      const size = rng() < 0.45 ? 0 : rng() < 0.75 ? 1 : 2;
      const { mesh, radius } = makeTree(size, biome, rng);
      this._place(mesh, x, z);
      mesh.rotation.y = rng() * Math.PI * 2;
      group.add(mesh);
      trees.push({
        id: this.nextTreeId++,
        mesh, x, z, radius, size,
        hp: [2, 4, 6][size],
        wood: [2, 4, 7][size],
        alive: true,
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
    scatter(1 + Math.floor(rng() * 3), () => makeRock(rng));
    if (biome.flowers) scatter(2 + Math.floor(rng() * 5), () => makeFlower(rng));
    if (biome.mushrooms) scatter(1 + Math.floor(rng() * 3), () => makeMushroom(rng));
    if (rng() < 0.35) scatter(1, () => makeLog(biome.trunk, rng));

    // -- ridge wall boulders crossing this chunk (rivers are built globally) --
    const rockColor = biome.snowy ? 0xc8d4dc : 0x82817a;
    for (const wall of this.walls) {
      if (wall.type !== 'ridge') continue;
      if (wall.z < czw - 4 || wall.z > czw + CHUNK + 4) continue;
      for (let x = cxw; x < cxw + CHUNK; x += 2.3) {
        if (Math.abs(x) > WORLD.halfWidth + 12) continue;
        // leave the gates visually open (slightly narrower than the collision gap)
        if (wall.gaps.some(g => x > g.x - g.w / 2 - 0.5 && x < g.x + g.w / 2 + 0.5)) continue;
        const bx = x + (rng() - 0.5) * 1.2;
        const bz = wall.z + (rng() - 0.5) * 1.8;
        const b = makeBoulder(1.5 + rng() * 1.1, rockColor, rng);
        b.position.set(bx, this.heightAt(bx, bz) + 0.35, bz);
        group.add(b);
        if (rng() < 0.35) {
          const small = makeBoulder(0.6 + rng() * 0.5, rockColor, rng);
          small.position.set(bx + (rng() - 0.5) * 3, this.heightAt(bx, bz) + 0.1, bz + (rng() - 0.5) * 4);
          group.add(small);
        }
      }
    }

    this.scene.add(group);
    this.chunks.set(key, { group, trees });
  }

  update(dt, playerPos) {
    const pcx = Math.floor(playerPos.x / CHUNK), pcz = Math.floor(playerPos.z / CHUNK);
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++)
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++)
        this._genChunk(pcx + dx, pcz + dz);

    // drop far chunks
    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > VIEW_RADIUS + 1 || Math.abs(cz - pcz) > VIEW_RADIUS + 1) {
        this.scene.remove(chunk.group);
        this.chunks.delete(key);
      }
    }

    // animate falling trees
    for (let i = this.fallingTrees.length - 1; i >= 0; i--) {
      const f = this.fallingTrees[i];
      f.t += dt;
      const k = Math.min(1, f.t / 0.9);
      f.mesh.rotation.x = f.dirX * k * k * (Math.PI / 2 - 0.1);
      f.mesh.rotation.z = f.dirZ * k * k * (Math.PI / 2 - 0.1);
      if (f.t > 1.6) {
        f.mesh.parent?.remove(f.mesh);
        this.fallingTrees.splice(i, 1);
      }
    }

    // tree hit shake
    for (const chunk of this.chunks.values()) {
      for (const tree of chunk.trees) {
        if (tree.shake > 0) {
          tree.shake -= dt;
          tree.mesh.rotation.z = Math.sin(tree.shake * 40) * 0.05 * tree.shake;
          if (tree.shake <= 0) tree.mesh.rotation.z = 0;
        }
      }
    }
  }

  treesNear(pos, radius) {
    const out = [];
    const pcx = Math.floor(pos.x / CHUNK), pcz = Math.floor(pos.z / CHUNK);
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const chunk = this.chunks.get(this._chunkKey(pcx + dx, pcz + dz));
        if (!chunk) continue;
        for (const tree of chunk.trees) {
          if (!tree.alive) continue;
          const ddx = tree.x - pos.x, ddz = tree.z - pos.z;
          if (ddx * ddx + ddz * ddz < (radius + tree.radius) ** 2) out.push(tree);
        }
      }
    return out;
  }

  // Push a circle (pos, r) out of tree trunks, ridge walls and lakes.
  // Mutates pos, returns it.
  collide(pos, r) {
    for (const tree of this.treesNear(pos, r + 0.5)) {
      const dx = pos.x - tree.x, dz = pos.z - tree.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + tree.radius;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        pos.x = tree.x + (dx / dist) * minDist;
        pos.z = tree.z + (dz / dist) * minDist;
      }
    }

    // barriers: ridges & rivers (pass only through the gates/bridges)
    for (const wall of this.walls) {
      const half = wall.type === 'river' ? 2.7 : WALL_HALF;
      const dz = pos.z - wall.z;
      if (Math.abs(dz) > half + r) continue;
      const inGap = wall.gaps.some(g => pos.x > g.x - g.w / 2 && pos.x < g.x + g.w / 2);
      if (inGap) continue;
      pos.z = wall.z + (dz >= 0 ? 1 : -1) * (half + r);
    }

    // lakes (circular)
    for (const lake of this.lakes) {
      const dx = pos.x - lake.x, dz = pos.z - lake.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + lake.r;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        pos.x = lake.x + (dx / dist) * minDist;
        pos.z = lake.z + (dz / dist) * minDist;
      }
    }

    // building obstacles (MOBA towers/bases register circles here)
    for (const o of this.obstacles || []) {
      const dx = pos.x - o.x, dz = pos.z - o.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + o.r;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        pos.x = o.x + (dx / dist) * minDist;
        pos.z = o.z + (dz / dist) * minDist;
      }
    }
    return pos;
  }

  // Clamp a z coordinate into the same wall-to-wall "room" as anchorZ, so
  // reinforcements arrive inside the player's section instead of behind a wall.
  clampToSection(z, anchorZ, margin = 5) {
    let north = WORLD.goalZ, south = WORLD.southEdge;
    for (const wall of this.walls) {
      if (wall.z < anchorZ && wall.z > north) north = wall.z;
      if (wall.z >= anchorZ && wall.z < south) south = wall.z;
    }
    return Math.max(north + margin, Math.min(south - margin, z));
  }

  // Returns wood dropped (0 if the tree survives the chop).
  chop(tree, power, fromPos) {
    tree.hp -= power;
    tree.shake = 0.35;
    audio.sfx('base_hit', 0.4);
    if (tree.hp > 0) return 0;
    tree.alive = false;
    const dx = tree.x - fromPos.x, dz = tree.z - fromPos.z;
    const len = Math.hypot(dx, dz) || 1;
    this.fallingTrees.push({ mesh: tree.mesh, t: 0, dirX: (dz / len), dirZ: (dx / len) });
    audio.sfx('tower_build', 0.55);
    return tree.wood;
  }
}
