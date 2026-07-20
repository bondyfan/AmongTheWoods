// ---- Minimap with fog of war (bottom-left corner) ----

import { WORLD, BIOMES, MOBA, biomeIndexAt, radiusOf, coastDistAt } from './config.js';
import { lanePoint } from './mobaworld.js';

const CELL = 25;                       // world units per discovery cell
const REVEAL_RADIUS = 45;              // world units revealed around the player

const WP_COLOR = '#ffd21a';            // waypoint yellow (map flag + arrows)

// a yellow map-pin (teardrop) whose point sits exactly on (x, y). `rot`
// counter-rotates it so it stays upright when the minimap is spinning.
function drawWpPin(ctx, x, y, s = 1, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = WP_COLOR;
  ctx.strokeStyle = 'rgba(40,30,0,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);                                  // the tip on the target
  ctx.bezierCurveTo(-5.5, -6, -6, -12, 0, -13.5);    // left side up to the head
  ctx.bezierCurveTo(6, -12, 5.5, -6, 0, 0);          // right side back to the tip
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();                                   // dark eye of the pin
  ctx.arc(0, -9, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40,30,0,0.9)';
  ctx.fill();
  ctx.restore();
}

// a filled yellow ARROW pointing +X (caller rotates it toward the target)
function drawWpArrow(ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = WP_COLOR;
  ctx.strokeStyle = 'rgba(40,30,0,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, -2);   // shaft back-top
  ctx.lineTo(1, -2);    // shaft to head base
  ctx.lineTo(1, -5.5);  // head barb (top)
  ctx.lineTo(9, 0);     // arrow tip
  ctx.lineTo(1, 5.5);   // head barb (bottom)
  ctx.lineTo(1, 2);     // back to shaft
  ctx.lineTo(-8, 2);    // shaft back-bottom
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

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
    // biomeAt is noise-based now — cache the zone per discovery cell so the
    // big-map redraw doesn't reclassify the whole world every half second
    this._biomeCell = new Int8Array(this.cols * this.rows).fill(-1);
    this.redrawT = 0;
    // zoom levels: how many world meters the minimap shows across. Level 0 is
    // the default close-up; +/- steps out 3 further (per user request).
    this.viewSpans = [280, 480, 820, 1400];
    this.zoom = 0;
    this.deathAt = null;   // last place the player died (⚰️ marker)
    this.treasureAt = null; // active treasure-map dig site (✖)
    this.waypoint = null;   // player-set navigation flag (📍)
    this.pings = [];       // co-op pings: { x, z, t }
    this.rotation = 0;     // radians; auto camera rotate turns the map with the view
    this._drawnRot = 0;
    this.bigPanX = 0;      // big-map drag pan (world units)
    this.bigPanZ = 0;
    this.flightNests = null; // placed griffin roosts (main assigns its array)
  }

  addPing(x, z) {
    this.pings.push({ x, z, t: 8 });
    this.redrawT = 0;
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

  _isDiscovered(x, z) {
    const { cx, cz } = this._cellAt(x, z);
    if (cx < 0 || cx >= this.cols || cz < 0 || cz >= this.rows) return false;
    return !!this.discovered[cz * this.cols + cx];
  }

  // zone index of a discovery cell, classified once and cached (the zone
  // map never changes within a session)
  _biomeAtCell(cx, rz, wx, wz) {
    const i = rz * this.cols + cx;
    let b = this._biomeCell[i];
    if (b < 0) {
      b = this._biomeCell[i] = coastDistAt(wx, wz) < 0 ? 8 : biomeIndexAt(wx, wz);
    }
    return b; // 8 = the ocean
  }

  // World-Editor repainted the ground — reclassify cells lazily
  clearBiomeCache() { this._biomeCell?.fill?.(-1); }

  reveal(x, z) { this.revealArea(x, z, REVEAL_RADIUS); }

  // reveal all cells within `radius` world-metres of (x, z) — used by both the
  // walking fog-of-war and the Scroll of Discovery.
  revealArea(x, z, radius) {
    const r = Math.ceil(radius / CELL);
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

  // Pack fog-of-war into one bit per discovery cell. A plain JSON array would
  // store ~194k numbers; the packed save is only about 32 KB as base64.
  serializeDiscovery() {
    const bytes = new Uint8Array(Math.ceil(this.discovered.length / 8));
    for (let i = 0; i < this.discovered.length; i++) {
      if (this.discovered[i]) bytes[i >> 3] |= 1 << (i & 7);
    }
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return { v: 1, cols: this.cols, rows: this.rows, bits: btoa(binary) };
  }

  restoreDiscovery(saved) {
    if (!saved?.bits || saved.v !== 1) return false;
    try {
      const binary = atob(saved.bits);
      const savedCols = Number(saved.cols);
      const savedRows = Number(saved.rows);
      if (!Number.isInteger(savedCols) || !Number.isInteger(savedRows) || savedCols < 1 || savedRows < 1) return false;
      if (binary.length < Math.ceil((savedCols * savedRows) / 8)) return false;

      const restored = new Uint8Array(this.discovered.length);
      const cols = Math.min(this.cols, savedCols);
      const rows = Math.min(this.rows, savedRows);
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          const savedIndex = z * savedCols + x;
          restored[z * this.cols + x] = (binary.charCodeAt(savedIndex >> 3) >> (savedIndex & 7)) & 1;
        }
      }
      this.discovered.set(restored);
      this.redrawT = 0;
      return true;
    } catch {
      return false;
    }
  }

  update(dt, player, enemyMgr, partner = null) {
    this.reveal(player.pos.x, player.pos.z);
    if (partner?.mesh?.visible) this.reveal(partner.pos.x, partner.pos.z);
    this.pings = this.pings.filter(p => (p.t -= dt) > 0);
    this.redrawT -= dt;
    // while the camera is turning, redraw every frame so the map spins smoothly
    if (Math.abs((this.rotation || 0) - this._drawnRot) > 0.045) this.redrawT = 0;
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

    // auto camera rotate: spin the whole map around the player (canvas center)
    // so "up" on the minimap always matches "up" on the screen
    const rot = this.rotation || 0;
    this._drawnRot = rot;
    ctx.save();
    if (rot) {
      ctx.translate(W / 2, H / 2);
      ctx.rotate(rot);
      ctx.translate(-W / 2, -H / 2);
    }
    // glyphs (🏠, 💀, ⚒ …) stay upright: counter-rotate around their anchor
    const text = (t, x, y) => {
      if (!rot) { ctx.fillText(t, x, y); return; }
      ctx.save(); ctx.translate(x, y); ctx.rotate(-rot); ctx.fillText(t, 0, 0); ctx.restore();
    };
    // a rotated square shows its corners — overscan so no black wedges appear
    const M = rot ? W * 0.21 : 0;
    const inView = (p) => p.x >= -M && p.x <= W + M && p.y >= -M && p.y <= H + M;

    // discovered cells in view, colored by their biome
    const Mw = M / scale;
    const c0x = Math.max(0, Math.floor((ox - Mw + WORLD.radius) / CELL));
    const c0z = Math.max(0, Math.floor((oz - Mw + WORLD.radius) / CELL));
    const cN = Math.ceil((SPAN + 2 * Mw) / CELL) + 1;
    for (let rz = c0z; rz < Math.min(this.rows, c0z + cN); rz++) {
      for (let cx = c0x; cx < Math.min(this.cols, c0x + cN); cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        const wx = (cx + 0.5) * CELL - WORLD.radius;
        const wz = (rz + 0.5) * CELL - WORLD.radius;
        if (radiusOf(wx, wz) > WORLD.radius) continue;
        const bi = this._biomeAtCell(cx, rz, wx, wz);
        ctx.fillStyle = bi === 8 ? '#1d3a4f' // the ocean
          : '#' + BIOMES[bi].ground.toString(16).padStart(6, '0');
        const p = toC(wx - CELL / 2, wz - CELL / 2);
        ctx.fillRect(p.x, p.y, CELL * scale + 1, CELL * scale + 1);
      }
    }

    // ---- biome-ring borders + gate entrances + the road ----
    // EVERYTHING here is part of the discoverable map: only the stretches over
    // already-explored ground are drawn (contiguous runs of discovered points).
    const drawClipped = (poly, color, width, dash) => {
      if (!poly || poly.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash(dash);
      ctx.beginPath();
      let pen = false;
      for (const q of poly) {
        if (this._isDiscovered(q.x, q.z)) {
          const p = toC(q.x, q.z);
          if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; }
        } else pen = false;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    // zone borders (sampled polylines, clipped to the fog like the road)
    for (const bl of this.world.borderLines ?? [])
      drawClipped(bl.pts, bl.type === 'river' ? 'rgba(120,180,230,0.5)' : 'rgba(190,160,115,0.55)', 1.3, [4, 3]);
    // all trails look IDENTICAL — the player can't tell which fork leads where
    for (const br of this.world.branches ?? [])
      drawClipped(br.pts, 'rgba(236, 210, 146, 0.85)', 2.2, [5, 4]);
    drawClipped(this.world.pathPts, 'rgba(236, 210, 146, 0.85)', 2.2, [5, 4]);
    // gate entrances — bold, only once discovered (bright doorway beacon)
    for (const g of this.world.gateList ?? []) {
      if (!this._isDiscovered(g.x, g.z)) continue;
      const gp = toC(g.x, g.z);
      if (!inView(gp)) continue;
      this._drawGate(ctx, gp.x, gp.y, -rot);
    }

    // home marker (only when it's inside the view)
    const hc = toC(0, 0);
    if (inView(hc)) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      text('🏠', hc.x, hc.y + 3);
    }

    // enemies: red dots, pack mothers: skulls
    if (enemyMgr) {
      ctx.textAlign = 'center';
      for (const e of enemyMgr.alive()) {
        const p = toC(e.pos.x, e.pos.z);
        if (!inView(p)) continue;
        // the fog of war hides creatures in unexplored land
        if (!this._isDiscovered(e.pos.x, e.pos.z)) continue;
        if (e.bossRank > 0) {
          // bosses PULSE so they read at a glance
          const pulse = 3 + Math.sin(performance.now() / 220) * 1.6;
          ctx.save();
          ctx.shadowColor = '#ff4030';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(255, 60, 40, 0.85)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          ctx.font = '9px sans-serif';
          text('💀', p.x, p.y + 3);
        } else {
          // hostiles are red; harmless grazing critters are white
          ctx.fillStyle = e.cfg?.passive ? '#f2efe6' : '#e04040';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // blacksmiths — once discovered, an orange badge marks the camp
    for (const sm of this.world.smiths ?? []) {
      if (!this._isDiscovered(sm.x, sm.z)) continue;
      const p = toC(sm.x, sm.z);
      if (!inView(p)) continue;
      ctx.fillStyle = '#ffa528';
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#2a1c08';
      text('⚒', p.x, p.y + 3);
    }

    // placed griffin roosts — the flight network is always shown
    // harbors are landmarks sailors steer by — always on the map
    for (const h of this.world.harbors ?? []) {
      const p = toC(h.x, h.z);
      if (!inView(p)) continue;
      ctx.fillStyle = '#2e5f8e';
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dfeaf2'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#eaf4fb';
      text('⚓', p.x, p.y + 3);
    }
    // the ship, wherever she sails
    if (this.world.shipPos) {
      const sp = toC(this.world.shipPos.x, this.world.shipPos.z);
      if (inView(sp)) {
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        text('⛵', sp.x, sp.y + 3);
      }
    }
    for (const n of this.flightNests ?? []) {
      const p = toC(n.x, n.z);
      if (!inView(p)) continue;
      ctx.fillStyle = '#5ac8ff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0a2a3a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = '8px sans-serif';
      text('🪽', p.x, p.y + 3);
    }

    // landmarks — only once their cell has been explored
    for (const poi of this.world.pois ?? []) {
      if (!this._isDiscovered(poi.x, poi.z)) continue;
      const p = toC(poi.x, poi.z);
      if (!inView(p)) continue;
      ctx.textAlign = 'center';
      ctx.globalAlpha = poi.claimed ? 0.35 : 1;
      if (poi.type === 'lair') {
        // the biome's NAMED boss: a pulsing blood-red badge under the skull
        // (emoji ignore fillStyle, so the red must be a drawn disc)
        const pulse = poi.claimed ? 7 : 7 + Math.sin(performance.now() / 300) * 1.2;
        ctx.save();
        if (!poi.claimed) { ctx.shadowColor = '#ff3020'; ctx.shadowBlur = 9; }
        ctx.fillStyle = '#9e1412';
        ctx.beginPath(); ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
        ctx.font = '9px sans-serif';
        text('💀', p.x, p.y + 3);
      } else {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = poi.type === 'shrine' ? '#7fd1ff' : poi.type === 'crypt' ? '#f0ead8' : '#c9b8ff';
        text(poi.type === 'shrine' ? '✦' : poi.type === 'crypt' ? '☗' : '▲', p.x, p.y + 3);
      }
      ctx.globalAlpha = 1;
    }

    // player waypoint — a yellow flag, always shown. When it's off the
    // minimap, pin a yellow ARROW to the rim pointing the way to it.
    if (this.waypoint) {
      const p = toC(this.waypoint.x, this.waypoint.z);
      if (inView(p)) {
        drawWpPin(ctx, p.x, p.y, 1, -rot); // stay upright while the map spins
      } else {
        const cxp = W / 2, cyp = H / 2;
        const dx = p.x - cxp, dy = p.y - cyp;
        const len = Math.hypot(dx, dy) || 1;
        const R = W / 2 - 11; // sit just inside the circular rim
        ctx.save();
        ctx.translate(cxp + dx / len * R, cyp + dy / len * R);
        ctx.rotate(Math.atan2(dy, dx));
        drawWpArrow(ctx, 1);
        ctx.restore();
      }
    }

    // active treasure map: X marks the spot (it's a map — always shown)
    if (this.treasureAt) {
      const p = toC(this.treasureAt.x, this.treasureAt.z);
      if (inView(p)) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ff5030';
        text('✖', p.x, p.y + 4);
      }
    }

    // co-op pings: fading orange rings
    for (const ping of this.pings) {
      const p = toC(ping.x, ping.z);
      if (!inView(p)) continue;
      ctx.strokeStyle = `rgba(255, 165, 40, ${Math.min(1, ping.t / 2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + Math.sin(performance.now() / 150) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // last death spot (also where your dropped loot lies)
    if (this.deathAt) {
      const dp = toC(this.deathAt.x, this.deathAt.z);
      let x = dp.x, y = dp.y + 4;
      if (rot) {
        // pin far-away coffins to the inscribed circle so the marker still
        // shows on the canvas after the map is rotated
        const dx = x - W / 2, dy = y - H / 2, r = Math.hypot(dx, dy), rm = W / 2 - 8;
        if (r > rm) { x = W / 2 + (dx / r) * rm; y = H / 2 + (dy / r) * rm; }
      } else {
        x = Math.max(6, Math.min(W - 6, x));
        y = Math.max(11, Math.min(H - 2, y));
      }
      ctx.textAlign = 'center';
      ctx.font = '12px sans-serif';
      text('⚰️', x, y);
    }

    // co-op partner: blue dot
    if (partner?.mesh?.visible) {
      const tp = toC(partner.pos.x, partner.pos.z);
      if (inView(tp)) {
        ctx.fillStyle = '#5fa8e0';
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.stroke();
      }
    }

    ctx.restore(); // end of the rotated map — the player marker stays screen-fixed

    // player: a bold GREEN arrow at dead center pointing where they're headed.
    // world facing (fx,fz) shown through the map's rotation:
    const fx = player.facing?.x ?? 0, fz = player.facing?.z ?? 1;
    const sx = fx * Math.cos(rot) - fz * Math.sin(rot);
    const sy = fx * Math.sin(rot) + fz * Math.cos(rot);
    this._drawPlayerArrow(ctx, W / 2, H / 2, Math.atan2(sy, sx));
  }

  // a chunky green heading arrow (angle 0 = +x screen); used on both maps
  _drawPlayerArrow(ctx, cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#4dff5a';
    ctx.strokeStyle = '#0a2a0c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // a bold biome-gate beacon: a bright gold ring around a dark doorway.
  // `upright` counter-rotates the glyph so it stays level on a spinning map.
  _drawGate(ctx, x, y, upright = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (upright) ctx.rotate(upright);
    ctx.shadowColor = 'rgba(255, 214, 74, 0.9)';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#ffe14a';
    ctx.strokeStyle = '#5a3d0a';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    // a little archway/door cut into the middle
    ctx.fillStyle = '#3a2708';
    ctx.beginPath();
    ctx.moveTo(-2.4, 3); ctx.lineTo(-2.4, -0.6);
    ctx.arc(0, -0.6, 2.4, Math.PI, 0); ctx.lineTo(2.4, 3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Big-map zoom: 1 = whole world; each step halves the visible span and
  // centers the view on the player (clamped to the world square).
  bigZoomBy(delta) {
    this.bigZoom = Math.max(1, Math.min(8, (this.bigZoom ?? 1) * (delta > 0 ? 2 : 0.5)));
    return this.bigZoom;
  }

  // The BIG map (M / minimap click): everything discovered so far, scaled to
  // fit — the undiscovered world stays black.
  drawBig(canvas, player, partner = null) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0f08';
    ctx.fillRect(0, 0, W, H);
    const zoom = this.bigZoom ?? 1;
    const vspan = this.span / zoom;
    const clamp = (v) => Math.max(-WORLD.radius, Math.min(WORLD.radius - vspan, v));
    let ox, oz;
    if (zoom === 1) {
      ox = -WORLD.radius; oz = -WORLD.radius;
      this.bigPanX = 0; this.bigPanZ = 0; // whole world visible — nothing to pan
    } else {
      ox = clamp(player.pos.x - vspan / 2 + this.bigPanX);
      oz = clamp(player.pos.z - vspan / 2 + this.bigPanZ);
      // write the clamped pan back so dragging never piles up past the edge
      this.bigPanX = ox - (player.pos.x - vspan / 2);
      this.bigPanZ = oz - (player.pos.z - vspan / 2);
    }
    const scale = W / vspan;
    this.bigScale = scale; // canvas px per world unit — the drag handler needs it
    this._bigOx = ox; this._bigOz = oz; // world origin of the view (waypoint clicks invert this)
    const toX = (wx) => (wx - ox) * scale;
    const toY = (wz) => (wz - oz) * scale;
    const c0x = Math.max(0, Math.floor((ox + WORLD.radius) / CELL));
    const c0z = Math.max(0, Math.floor((oz + WORLD.radius) / CELL));
    const cN = Math.ceil(vspan / CELL) + 1;
    for (let rz = c0z; rz < Math.min(this.rows, c0z + cN); rz++) {
      for (let cx = c0x; cx < Math.min(this.cols, c0x + cN); cx++) {
        if (!this.discovered[rz * this.cols + cx]) continue;
        const wx = (cx + 0.5) * CELL - WORLD.radius;
        const wz = (rz + 0.5) * CELL - WORLD.radius;
        if (radiusOf(wx, wz) > WORLD.radius) continue;
        const bi = this._biomeAtCell(cx, rz, wx, wz);
        ctx.fillStyle = bi === 8 ? '#1d3a4f' // the ocean
          : '#' + BIOMES[bi].ground.toString(16).padStart(6, '0');
        ctx.fillRect(toX(wx - CELL / 2), toY(wz - CELL / 2),
          Math.max(1.5, CELL * scale + 0.5), Math.max(1.5, CELL * scale + 0.5));
      }
    }
    const inView = (wx, wz) => wx >= ox && wx <= ox + vspan && wz >= oz && wz <= oz + vspan;

    // ---- ring borders + road + fork spurs — ALL part of the discoverable
    // map: only the stretches over explored ground are drawn ----
    const roadW = Math.max(1.6, 2.4 * Math.min(1, scale * 8));
    const dash = [Math.max(3, 5 * Math.min(1, scale * 6)), 4];
    const drawClippedBig = (poly, color, width, dsh) => {
      if (!poly || poly.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash(dsh);
      ctx.beginPath();
      let pen = false;
      for (const q of poly) {
        if (this._isDiscovered(q.x, q.z)) {
          if (pen) ctx.lineTo(toX(q.x), toY(q.z)); else { ctx.moveTo(toX(q.x), toY(q.z)); pen = true; }
        } else pen = false;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    for (const bl of this.world.borderLines ?? [])
      drawClippedBig(bl.pts, bl.type === 'river' ? 'rgba(120,180,230,0.5)' : 'rgba(180,150,110,0.55)', 1.4, [5, 4]);
    // every fork looks the SAME as the main road — no telling where each leads
    for (const br of this.world.branches ?? [])
      drawClippedBig(br.pts, 'rgba(232, 206, 140, 0.8)', roadW, dash);
    drawClippedBig(this.world.pathPts, 'rgba(232, 206, 140, 0.8)', roadW, dash);
    // gate entrances — bold beacons, only once their cell is discovered
    for (const g of this.world.gateList ?? []) {
      if (!inView(g.x, g.z) || !this._isDiscovered(g.x, g.z)) continue;
      this._drawGate(ctx, toX(g.x), toY(g.z), 0);
    }

    ctx.textAlign = 'center';
    ctx.font = '13px sans-serif';
    if (inView(0, 0)) ctx.fillText('🏠', toX(0), toY(0) + 4);
    // discovered landmarks + blacksmiths + the active treasure map
    ctx.font = '11px sans-serif';
    for (const sm of this.world.smiths ?? []) {
      if (!this._isDiscovered(sm.x, sm.z) || !inView(sm.x, sm.z)) continue;
      const bx = toX(sm.x), by = toY(sm.z);
      ctx.fillStyle = '#ffa528';
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#2a1c08';
      ctx.fillText('⚒', bx, by + 3);
      ctx.font = '11px sans-serif';
    }
    // placed griffin roosts
    // harbors + the ship line
    for (const h of this.world.harbors ?? []) {
      if (!inView(h.x, h.z)) continue;
      const bx = toX(h.x), by = toY(h.z);
      ctx.fillStyle = '#2e5f8e';
      ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dfeaf2'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#eaf4fb';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚓', bx, by + 3.5);
    }
    if (this.world.shipPos && inView(this.world.shipPos.x, this.world.shipPos.z)) {
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⛵', toX(this.world.shipPos.x), toY(this.world.shipPos.z) + 3.5);
    }
    for (const n of this.flightNests ?? []) {
      if (!inView(n.x, n.z)) continue;
      const bx = toX(n.x), by = toY(n.z);
      ctx.fillStyle = '#5ac8ff';
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0a2a3a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = '9px sans-serif';
      ctx.fillText('🪽', bx, by + 3);
      ctx.font = '11px sans-serif';
    }
    for (const poi of this.world.pois ?? []) {
      if (!this._isDiscovered(poi.x, poi.z) || !inView(poi.x, poi.z)) continue;
      ctx.globalAlpha = poi.claimed ? 0.35 : 1;
      if (poi.type === 'lair') {
        // named-boss lair: blood-red badge behind the skull (emoji stay white)
        const bx = toX(poi.x), by = toY(poi.z);
        ctx.save();
        if (!poi.claimed) { ctx.shadowColor = '#ff3020'; ctx.shadowBlur = 10; }
        ctx.fillStyle = '#9e1412';
        ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        ctx.font = '11px sans-serif';
        ctx.fillText('💀', bx, by + 4);
        ctx.font = '11px sans-serif';
      } else {
        ctx.fillStyle = poi.type === 'shrine' ? '#7fd1ff' : poi.type === 'crypt' ? '#f0ead8' : '#c9b8ff';
        ctx.fillText(poi.type === 'shrine' ? '✦' : poi.type === 'crypt' ? '☗' : '▲',
          toX(poi.x), toY(poi.z) + 4);
      }
      ctx.globalAlpha = 1;
    }
    if (this.waypoint && inView(this.waypoint.x, this.waypoint.z)) {
      drawWpPin(ctx, toX(this.waypoint.x), toY(this.waypoint.z), 1.35);
    }
    if (this.treasureAt && inView(this.treasureAt.x, this.treasureAt.z)) {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#ff5030';
      ctx.fillText('✖', toX(this.treasureAt.x), toY(this.treasureAt.z) + 5);
      ctx.font = '11px sans-serif';
    }
    if (this.deathAt && inView(this.deathAt.x, this.deathAt.z)) {
      ctx.font = '15px sans-serif';
      ctx.fillText('⚰️', toX(this.deathAt.x), toY(this.deathAt.z) + 5);
    }
    if (partner?.mesh?.visible && inView(partner.pos.x, partner.pos.z)) {
      ctx.fillStyle = '#5fa8e0';
      ctx.beginPath(); ctx.arc(toX(partner.pos.x), toY(partner.pos.z), 4, 0, Math.PI * 2); ctx.fill();
    }
    // player: a bold green heading arrow (no map rotation on the big map)
    this._drawPlayerArrow(ctx, toX(player.pos.x), toY(player.pos.z),
      Math.atan2(player.facing?.z ?? 1, player.facing?.x ?? 0));
  }
}
