// ---- Minimap with fog of war (bottom-left corner) ----

import { WORLD, BIOMES, MOBA, biomeAt, radiusOf } from './config.js';
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
    canvas.width = 170; canvas.height = 170; // radial world → square map
    this.ctx = canvas.getContext('2d');
    this.span = WORLD.radius * 2;             // world square that holds the circle
    this.cols = Math.ceil(this.span / CELL);
    this.rows = this.cols;
    this.discovered = new Uint8Array(this.cols * this.rows);
    this.redrawT = 0;
    // zoom levels: how many world meters the minimap shows across. Level 0 is
    // the default close-up; +/- steps out 3 further (per user request).
    this.viewSpans = [280, 480, 820, 1400];
    this.zoom = 0;
    this.deathAt = null; // last place the player died (⚰️ marker)
  }

  zoomBy(delta) {
    this.zoom = Math.max(0, Math.min(this.viewSpans.length - 1, this.zoom + delta));
    this.redrawT = 0; // redraw immediately
    return this.zoom;
  }

  _cellAt(x, z) {
    const cx = Math.floor((x + WORLD.radius) / CELL);
    const cz = Math.floor((z + WORLD.radius) / CELL);
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

  // The minimap is a ZOOMED-IN local view centered on the player — it never
  // betrays how big the world really is or where the next ring begins; you
  // only see what you've discovered.
  _draw(player, enemyMgr, partner = null) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const SPAN = this.viewSpans[this.zoom]; // world meters shown across the minimap
    const scale = W / SPAN;
    const ox = player.pos.x - SPAN / 2, oz = player.pos.z - SPAN / 2;
    const toC = (x, z) => ({ x: (x - ox) * scale, y: (z - oz) * scale });

    ctx.fillStyle = '#0a0f08';
    ctx.fillRect(0, 0, W, H);

    // discovered cells in view, colored by their biome
    const c0x = Math.max(0, Math.floor((ox + WORLD.radius) / CELL));
    const c0z = Math.max(0, Math.floor((oz + WORLD.radius) / CELL));
    const cN = Math.ceil(SPAN / CELL) + 1;
    for (let rz = c0z; rz < Math.min(this.rows, c0z + cN); rz++) {
      for (let cx = c0x; cx < Math.min(this.cols, c0x + cN); cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        const wx = (cx + 0.5) * CELL - WORLD.radius;
        const wz = (rz + 0.5) * CELL - WORLD.radius;
        if (radiusOf(wx, wz) > WORLD.radius) continue;
        const biome = biomeAt(wx, wz);
        ctx.fillStyle = '#' + biome.ground.toString(16).padStart(6, '0');
        const p = toC(wx - CELL / 2, wz - CELL / 2);
        ctx.fillRect(p.x, p.y, CELL * scale + 1, CELL * scale + 1);
      }
    }

    // home marker (only when it's inside the view)
    const hc = toC(0, 0);
    if (hc.x > 0 && hc.x < W && hc.y > 0 && hc.y < H) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏠', hc.x, hc.y + 3);
    }

    // enemies: red dots, pack mothers: skulls
    if (enemyMgr) {
      ctx.textAlign = 'center';
      for (const e of enemyMgr.alive()) {
        const p = toC(e.pos.x, e.pos.z);
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
        if (e.bossRank > 0) {
          ctx.font = '9px sans-serif';
          ctx.fillText('💀', p.x, p.y + 3);
        } else {
          ctx.fillStyle = '#e04040';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // last death spot (also where your dropped loot lies)
    if (this.deathAt) {
      const dp = toC(this.deathAt.x, this.deathAt.z);
      ctx.textAlign = 'center';
      ctx.font = '12px sans-serif';
      ctx.fillText('⚰️', Math.max(6, Math.min(W - 6, dp.x)), Math.max(11, Math.min(H - 2, dp.y + 4)));
    }

    // co-op partner: blue dot
    if (partner?.mesh?.visible) {
      const tp = toC(partner.pos.x, partner.pos.z);
      if (tp.x > 0 && tp.x < W && tp.y > 0 && tp.y < H) {
        ctx.fillStyle = '#5fa8e0';
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.stroke();
      }
    }

    // player: always dead center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.stroke();
  }

  // The BIG map (M / minimap click): everything discovered so far, scaled to
  // fit — the undiscovered world stays black.
  drawBig(canvas, player, partner = null) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0f08';
    ctx.fillRect(0, 0, W, H);
    const scale = W / this.span;
    for (let rz = 0; rz < this.rows; rz++) {
      for (let cx = 0; cx < this.cols; cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        const wx = (cx + 0.5) * CELL - WORLD.radius;
        const wz = (rz + 0.5) * CELL - WORLD.radius;
        if (radiusOf(wx, wz) > WORLD.radius) continue;
        const biome = biomeAt(wx, wz);
        ctx.fillStyle = '#' + biome.ground.toString(16).padStart(6, '0');
        ctx.fillRect(cx * CELL * scale, rz * CELL * scale,
          Math.max(1.5, CELL * scale + 0.5), Math.max(1.5, CELL * scale + 0.5));
      }
    }
    ctx.textAlign = 'center';
    ctx.font = '13px sans-serif';
    ctx.fillText('🏠', W / 2, H / 2 + 4);
    if (this.deathAt) {
      const dx = (this.deathAt.x + WORLD.radius) * scale;
      const dy = (this.deathAt.z + WORLD.radius) * scale;
      ctx.font = '15px sans-serif';
      ctx.fillText('⚰️', dx, dy + 5);
    }
    if (partner?.mesh?.visible) {
      const px = (partner.pos.x + WORLD.radius) * scale;
      const py = (partner.pos.z + WORLD.radius) * scale;
      ctx.fillStyle = '#5fa8e0';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    }
    const px = (player.pos.x + WORLD.radius) * scale;
    const py = (player.pos.z + WORLD.radius) * scale;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.stroke();
  }
}
