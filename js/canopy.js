// ---- Canopy shade map: world-space ambient occlusion from tree crowns ----
// A small canvas centered on the player accumulates one soft dark blob per
// LIVING tree (bigger tree → wider, deeper blob). Blobs multiply where crowns
// overlap, so a thick wood reads genuinely dim while a lone tree only casts a
// gentle pool of shade. A second canvas stores each tree's ground height and
// canopy-top height, so the composite pass shades ONLY what sits UNDER the
// crown — sunlit canopy tops, hilltops and open ground stay untouched. The
// post stack samples both maps by world position reconstructed from depth.

import * as THREE from 'three';

const MAP_PX = 512;      // texel resolution of the shade map
const MAP_SIZE = 400;    // meters covered (±200 m around the player)
const RECENTER = 32;     // rebuild once the player strays this far off-center

// canopy footprint radius + darkness by tree size (sapling → forest giant)
const CANOPY_R = [1.6, 2.4, 3.2, 4.2, 5.4];
const CANOPY_A = [0.16, 0.22, 0.30, 0.36, 0.42];
// canopy TOP height by size, world meters (trees bake with scale.y = 3)
const CANOPY_TOP = [6, 9, 13, 17, 22];

// ground-height encoding shared with the composite shader: -16..160 m in R,
// canopy-top 0..32 m in G
export const CANOPY_H_OFF = 16, CANOPY_H_RANGE = 176, CANOPY_TOP_RANGE = 32;

export class CanopyShade {
  constructor() {
    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = MAP_PX;
      return cv;
    };
    this.densCv = mk();   // R: remaining light (255 = open sky, dark = crowns)
    this.metaCv = mk();   // R: ground height, G: canopy-top height
    this.densTex = new THREE.CanvasTexture(this.densCv);
    this.metaTex = new THREE.CanvasTexture(this.metaCv);
    for (const t of [this.densTex, this.metaTex]) {
      t.flipY = false;                 // canvas rows map straight onto +Z
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    }
    this.cx = 0; this.cz = 0;          // world center of the current map
    this.size = MAP_SIZE;
    this.ready = false;
    this._chunkCount = -1;
  }

  // rebuild when: a tree fell (world.canopyDirty), chunks loaded/unloaded, or
  // the player wandered far enough that the map should recenter
  update(world, px, pz) {
    if (!world?.chunks) { this.ready = false; return; }
    const moved = Math.hypot(px - this.cx, pz - this.cz) > RECENTER;
    if (this.ready && !world.canopyDirty
        && world.chunks.size === this._chunkCount && !moved) return;
    world.canopyDirty = false;
    this._chunkCount = world.chunks.size;
    this.cx = px; this.cz = pz;
    this._rebuild(world);
    this.ready = true;
  }

  _rebuild(world) {
    const half = MAP_SIZE / 2, px2m = MAP_PX / MAP_SIZE;
    const minX = this.cx - half, minZ = this.cz - half;
    const gd = this.densCv.getContext('2d');
    const gm = this.metaCv.getContext('2d');
    gd.fillStyle = '#fff'; gd.fillRect(0, 0, MAP_PX, MAP_PX);
    gm.fillStyle = '#000'; gm.fillRect(0, 0, MAP_PX, MAP_PX);
    for (const chunk of world.chunks.values()) {
      for (const t of chunk.trees) {
        if (!t.alive || t.kind !== 'tree') continue;
        const size = Math.min(4, t.size ?? 2);
        const r = CANOPY_R[size];
        if (t.x < minX - r || t.x > minX + MAP_SIZE + r
          || t.z < minZ - r || t.z > minZ + MAP_SIZE + r) continue;
        const gx = (t.x - minX) * px2m, gz = (t.z - minZ) * px2m;
        const rp = Math.max(2, r * px2m);
        // meta first (opaque, slightly wider so blob edges never sample the
        // black no-tree background through bilinear filtering)
        const hEnc = Math.max(0, Math.min(255, Math.round(
          (world.heightAt(t.x, t.z) + CANOPY_H_OFF) / CANOPY_H_RANGE * 255)));
        const topEnc = Math.min(255, Math.round(CANOPY_TOP[size] / CANOPY_TOP_RANGE * 255));
        gm.fillStyle = `rgb(${hEnc},${topEnc},0)`;
        gm.beginPath(); gm.arc(gx, gz, rp + 2, 0, Math.PI * 2); gm.fill();
        // the shade blob itself: soft radial pool of darkness
        const a = CANOPY_A[size];
        const grad = gd.createRadialGradient(gx, gz, rp * 0.25, gx, gz, rp);
        grad.addColorStop(0, `rgba(0,0,0,${a})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        gd.fillStyle = grad;
        gd.beginPath(); gd.arc(gx, gz, rp, 0, Math.PI * 2); gd.fill();
      }
    }
    this.densTex.needsUpdate = true;
    this.metaTex.needsUpdate = true;
  }

  dispose() {
    this.densTex.dispose();
    this.metaTex.dispose();
  }
}
