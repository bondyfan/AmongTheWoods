// ---- Minimap with fog of war (bottom-left corner) ----

import { WORLD, BIOMES, MOBA, biomeAt } from './config.js';
import { lanePoint } from './mobaworld.js';

const CELL = 25;                       // world units per discovery cell
const REVEAL_RADIUS = 45;              // world units revealed around the player

// ---- MOBA minimap: square, full visibility, lanes + units + buildings ----
export class MobaMinimap {
  constructor(canvas, moba) {
    this.canvas = canvas;
    this.moba = moba;
    canvas.width = 160; canvas.height = 160;
    this.ctx = canvas.getContext('2d');
    this.redrawT = 0;
  }

  _pt(x, z) {
    const s = this.canvas.width / (MOBA.half * 2 + 10);
    return { x: (x + MOBA.half + 5) * s, y: (z + MOBA.half + 5) * s };
  }

  update(dt, player) {
    this.redrawT -= dt;
    if (this.redrawT > 0) return;
    this.redrawT = 0.25;
    const { ctx, canvas } = this;
    ctx.fillStyle = '#2c4423';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // lanes
    ctx.strokeStyle = '#8a6b42';
    ctx.lineWidth = 3;
    for (const lane of ['mid', 'top', 'bot']) {
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.05) {
        const p = lanePoint(lane, Math.min(1, t));
        const c = this._pt(p.x, p.z);
        t === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
      }
      ctx.stroke();
    }

    // camps
    ctx.fillStyle = '#c9a94e';
    for (const camp of MOBA.camps) {
      const c = this._pt(camp.x, camp.z);
      ctx.fillRect(c.x - 1.5, c.y - 1.5, 3, 3);
    }

    // units & buildings
    for (const u of this.moba.units) {
      if (u.dying) continue;
      const c = this._pt(u.pos.x, u.pos.z);
      const col = u.team === 'player' ? '#5fa8e0' : u.team === 'enemy' ? '#e05050' : '#e0c040';
      ctx.fillStyle = col;
      if (u.kind === 'base') { ctx.fillRect(c.x - 5, c.y - 5, 10, 10); }
      else if (u.kind === 'tower') { ctx.fillRect(c.x - 2.5, c.y - 2.5, 5, 5); }
      else { ctx.beginPath(); ctx.arc(c.x, c.y, u.kind === 'neutral' ? 1.4 : 1.8, 0, Math.PI * 2); ctx.fill(); }
    }

    // hero
    const hc = this._pt(player.pos.x, player.pos.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(hc.x, hc.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
  }
}

export class Minimap {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.ctx = canvas.getContext('2d');
    this.worldW = WORLD.halfWidth * 2;                    // 300
    this.worldL = WORLD.southEdge - WORLD.goalZ + 40;     // ~1580
    this.cols = Math.ceil(this.worldW / CELL);
    this.rows = Math.ceil(this.worldL / CELL);
    this.discovered = new Uint8Array(this.cols * this.rows);
    this.redrawT = 0;
  }

  _cellAt(x, z) {
    const cx = Math.floor((x + WORLD.halfWidth) / CELL);
    const cz = Math.floor((WORLD.southEdge - z) / CELL); // row 0 = south edge
    return { cx, cz };
  }

  reveal(x, z) {
    const r = Math.ceil(REVEAL_RADIUS / CELL);
    const { cx, cz } = this._cellAt(x, z);
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nx >= this.cols || nz < 0 || nz >= this.rows) continue;
        if (dx * dx + dz * dz > r * r) continue;
        this.discovered[nz * this.cols + nx] = 1;
      }
    }
  }

  update(dt, player, enemyMgr, partner = null) {
    this.reveal(player.pos.x, player.pos.z);
    if (partner?.mesh?.visible) this.reveal(partner.pos.x, partner.pos.z);
    this.redrawT -= dt;
    if (this.redrawT <= 0) {
      this.redrawT = 0.25;
      this._draw(player, enemyMgr, partner);
    }
  }

  _toCanvas(x, z) {
    return {
      x: ((x + WORLD.halfWidth) / this.worldW) * this.canvas.width,
      y: this.canvas.height - ((WORLD.southEdge - z) / this.worldL) * this.canvas.height,
    };
  }

  _draw(player, enemyMgr, partner = null) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const sx = W / this.cols, sz = H / this.rows;

    ctx.fillStyle = '#0a0f08';
    ctx.fillRect(0, 0, W, H);

    for (let rz = 0; rz < this.rows; rz++) {
      const worldZ = WORLD.southEdge - (rz + 0.5) * CELL;
      const biome = biomeAt(worldZ);
      const color = '#' + biome.ground.toString(16).padStart(6, '0');
      for (let cx = 0; cx < this.cols; cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        ctx.fillStyle = color;
        // map: north (goal) at top → row 0 (south) at bottom
        ctx.fillRect(cx * sx, H - (rz + 1) * sz, Math.ceil(sx), Math.ceil(sz));
      }
    }

    // barriers (ridges dark, rivers blue) with their openings — only where discovered
    for (const wall of this.world.walls) {
      const rz = Math.floor((WORLD.southEdge - wall.z) / CELL);
      if (rz < 0 || rz >= this.rows) continue;
      ctx.fillStyle = wall.type === 'river' ? '#3f6f9e' : '#26261f';
      const y = H - (rz + 1) * sz;
      for (let cx = 0; cx < this.cols; cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        const x0 = cx * CELL - WORLD.halfWidth, x1 = x0 + CELL;
        const inGap = wall.gaps.some(g => x1 > g.x - g.w / 2 && x0 < g.x + g.w / 2);
        if (!inGap) ctx.fillRect(cx * sx, y + sz * 0.3, Math.ceil(sx), Math.max(2, sz * 0.4));
      }
    }

    // goal marker
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ PEAK', W / 2, 10);

    // enemies: red dots, pack mothers: skulls
    if (enemyMgr) {
      for (const e of enemyMgr.alive()) {
        const p = this._toCanvas(e.pos.x, e.pos.z);
        if (p.y < 0 || p.y > H) continue;
        if (e.bossRank > 0) {
          ctx.font = '9px sans-serif';
          ctx.fillText('💀', p.x, p.y + 3);
        } else {
          ctx.fillStyle = '#e04040';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // co-op partner: blue dot
    if (partner?.mesh?.visible) {
      const tp = this._toCanvas(partner.pos.x, partner.pos.z);
      ctx.fillStyle = '#5fa8e0';
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }

    // player dot
    const pp = this._toCanvas(player.pos.x, player.pos.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
}
