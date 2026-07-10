// ---- MOBA map: square jungle, three dirt lanes, two base clearings ----
// Subclasses the survival World so trees/chopping/collision/chunks all reuse
// the exact same code — only terrain shape and placement rules differ.

import * as THREE from 'three';
import { MOBA, BIOMES } from './config.js';
import { World } from './world.js';
import { makeTree, makeRock, makeGrassTuft, makeFlower, makeBush, makeBoulder } from './models.js';

const JUNGLE = BIOMES[0]; // verdant palette

// distance from point to a polyline (lane path)
function distToLane(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t, pz = az + dz * t;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

export function laneDistance(x, z) {
  let best = Infinity;
  for (const pts of Object.values(MOBA.lanes)) best = Math.min(best, distToLane(x, z, pts));
  return best;
}

// point at fraction t (0..1) along a lane polyline
export function lanePoint(lane, t) {
  const pts = MOBA.lanes[lane];
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(d); total += d;
  }
  let want = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i]) {
      const k = want / segs[i];
      return {
        x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
        z: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
      };
    }
    want -= segs[i];
  }
  return { x: pts[pts.length - 1][0], z: pts[pts.length - 1][1] };
}

const baseDist = (x, z) => Math.min(
  Math.hypot(x - MOBA.basePos.player.x, z - MOBA.basePos.player.z),
  Math.hypot(x - MOBA.basePos.enemy.x, z - MOBA.basePos.enemy.z));

const campDist = (x, z) => Math.min(...MOBA.camps.map(c => Math.hypot(x - c.x, z - c.z)));

export class MobaWorld extends World {
  _mountainK() { return 0; } // no mountains on the MOBA map

  // flat-ish terrain, fully flat on lanes and bases
  heightAt(x, z) {
    let h = super.heightAt(x, z) * 0.5;
    const flat = Math.min(laneDistance(x, z) / 6, baseDist(x, z) / MOBA.baseR, 1);
    return h * Math.max(0.1, Math.min(1, flat));
  }

  _genRings() { this.rings = []; }   // no ring barriers on the MOBA map
  _genLakes() { this.lakes = []; }   // no lakes (keeps lanes reliable)
  _genPois() { this.pois = []; }     // no survival landmarks either
  _genSmiths() { this.smiths = []; }
  _genPaths() { this.pathPts = []; this._pathBuckets = new Map(); }
  lakesNear() { return []; }
  _buildRingRivers() {}
  _buildCave() {}                    // no starting cave either

  _buildGround() {
    const size = MOBA.half * 2 + 40;
    const seg = Math.round(size / 3);
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    const grass = new THREE.Color(JUNGLE.ground), grass2 = new THREE.Color(JUNGLE.ground2);
    const dirt = new THREE.Color(JUNGLE.dirt), stone = new THREE.Color(0x8f8a7c);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, this.heightAt(x, z));
      const mix = (Math.sin(x * 0.37) * Math.cos(z * 0.31) + 1) / 2;
      col.copy(grass).lerp(grass2, mix);
      const ld = laneDistance(x, z);
      if (ld < 4.5) col.lerp(dirt, Math.min(1, (4.5 - ld) / 2.2));   // dirt lanes
      const bd = baseDist(x, z);
      if (bd < MOBA.baseR) col.lerp(stone, Math.min(1, (MOBA.baseR - bd) / 6));
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.receiveShadow = true;
    this._addStatic(mesh);

    // border ring of boulders so the map is enclosed
    const rng = () => Math.abs(Math.sin(this.seed + this._statics.length * 13.7)) % 1;
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const r = MOBA.half + 3;
      const bx = Math.cos(a) * r * 1.02, bz = Math.sin(a) * r * 1.02;
      if (Math.abs(bx) > MOBA.half + 8 || Math.abs(bz) > MOBA.half + 8) continue;
      const b = makeBoulder(1.8 + rng() * 1.2, 0x7c786c, rng);
      b.position.set(bx, this.heightAt(bx, bz) + 0.3, bz);
      this._addStatic(b);
    }
  }

  _genChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    const group = new THREE.Group();
    const trees = [];
    // deterministic per-chunk rng (same scheme as survival)
    let s = this.seed ^ (cx * 73856093) ^ (cz * 19349663);
    const rng = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const CHUNK = 40;
    const cxw = cx * CHUNK, czw = cz * CHUNK;

    const ok = (x, z, clearance) =>
      Math.abs(x) < MOBA.half - 2 && Math.abs(z) < MOBA.half - 2 &&
      laneDistance(x, z) > clearance &&
      baseDist(x, z) > MOBA.baseR + 2 &&
      campDist(x, z) > 6;

    // dense jungle trees between the lanes
    for (let i = 0; i < 16; i++) {
      const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
      if (!ok(x, z, 5)) continue;
      const size = rng() < 0.4 ? 0 : rng() < 0.75 ? 1 : 2;
      const { mesh, radius } = makeTree(size, JUNGLE, rng);
      mesh.position.set(x, this.heightAt(x, z), z);
      mesh.rotation.y = rng() * Math.PI * 2;
      group.add(mesh);
      trees.push({
        id: this.nextTreeId++, mesh, x, z, radius, size,
        hp: [2, 4, 6][size], wood: [2, 4, 7][size], alive: true,
      });
    }
    // decorations (sparser near lanes so paths read clean)
    for (let i = 0; i < 14; i++) {
      const x = cxw + rng() * CHUNK, z = czw + rng() * CHUNK;
      if (!ok(x, z, 2.5)) continue;
      const r = rng();
      const obj = r < 0.55 ? makeGrassTuft(JUNGLE.grass, rng)
        : r < 0.75 ? makeBush(JUNGLE.foliage[0], rng)
        : r < 0.9 ? makeFlower(rng) : makeRock(rng);
      obj.position.set(x, this.heightAt(x, z), z);
      obj.rotation.y = rng() * Math.PI * 2;
      group.add(obj);
    }

    this.scene.add(group);
    this.chunks.set(key, { group, trees, rocks: [] });
  }

  clampToSection(z) { return z; } // no walled sections here
}
