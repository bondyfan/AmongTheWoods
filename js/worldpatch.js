// ---- World patch: the admin's hand-made edits over the procedural world ----
// The island is generated from ONE canonical seed; this module holds the
// World-Editor overrides applied on top of it: sculpted heights, painted
// terrain / water / roads, and entity edits (added / moved / deleted POIs,
// blacksmiths and monster camps). It ships as a static JSON asset
// (assets/world-patch.json) versioned with the build, so every client —
// singleplayer or multiplayer guest — derives the exact same world.
//
// All layers are SPARSE 4 m cell grids (Map keyed "cx,cz"), so an empty or
// small patch costs nothing at runtime; heightAt short-circuits through a
// bounding box before touching the maps.

export const PATCH_CELL = 4;

// paintable terrain palette (index stored per cell)
export const TERRAIN_PAINTS = [
  { id: 'grass',  name: 'Grass',      ground: 0x55803c, ground2: 0x669147 },
  { id: 'lush',   name: 'Lush grass', ground: 0x2f8a28, ground2: 0x3a9c32 },
  { id: 'sand',   name: 'Sand',       ground: 0xd8b878, ground2: 0xc9a860 },
  { id: 'dirt',   name: 'Dirt',       ground: 0x8a6b42, ground2: 0x75552f },
  { id: 'rock',   name: 'Rock',       ground: 0x8a8a84, ground2: 0x75756e },
  { id: 'snow',   name: 'Snow',       ground: 0xf2f6fa, ground2: 0xe4ecf3 },
  { id: 'mud',    name: 'Mud',        ground: 0x3a3c28, ground2: 0x2c2e20 },
  { id: 'ash',    name: 'Ashen',      ground: 0x3a3a44, ground2: 0x32323c },
];

const key = (cx, cz) => cx + ',' + cz;

class WorldPatch {
  constructor() { this.clear(); }

  clear() {
    this.height = new Map();   // cell corner -> height delta (m)
    this.terrain = new Map();  // cell -> TERRAIN_PAINTS index
    this.water = new Map();    // cell -> 1 shallow | 2 forced-dry | 3 DEEP (6 m)
    this.path = new Map();     // cell -> 1 painted road
    this.entities = [];        // { id, kind:'poi'|'smith'|'pack'|'tree'|'rock'|'meadow', type, x, z, … }
    this.removed = new Set();  // 'poi:<genId>' | 'smith:<genId>'
    this.moved = new Map();    // 'poi:<genId>' -> { x, z }
    this.tweaks = { enemies: {}, items: {}, biomes: {} }; // object-editor overrides
    this._nextId = 1;
    this._bbox = null;         // {x0,x1,z0,z1} of ALL cell layers, world meters
    this._townFlag = new Map();
    this._townSegs = [];
    this._townCenters = [];
    this._bBuckets = new Map();
    this.dirty = false;
  }

  isEmpty() {
    return !this.height.size && !this.terrain.size && !this.water.size
      && !this.path.size && !this.entities.length && !this.removed.size
      && !this.moved.size;
  }

  _grow(x, z) {
    const b = this._bbox ??= { x0: x, x1: x, z0: z, z1: z };
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x;
    if (z < b.z0) b.z0 = z; if (z > b.z1) b.z1 = z;
  }

  _inBBox(x, z, pad = PATCH_CELL * 2) {
    const b = this._bbox;
    return b && x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad;
  }

  // ---- runtime sampling ----

  // bilinear height delta across the 4 surrounding painted corners
  heightAt(x, z) {
    if (!this.height.size || !this._inBBox(x, z)) return 0;
    const fx = x / PATCH_CELL, fz = z / PATCH_CELL;
    const cx = Math.floor(fx), cz = Math.floor(fz);
    const tx = fx - cx, tz = fz - cz;
    const h00 = this.height.get(key(cx, cz)) ?? 0;
    const h10 = this.height.get(key(cx + 1, cz)) ?? 0;
    const h01 = this.height.get(key(cx, cz + 1)) ?? 0;
    const h11 = this.height.get(key(cx + 1, cz + 1)) ?? 0;
    if (!h00 && !h10 && !h01 && !h11) return 0;
    return (h00 + (h10 - h00) * tx) + ((h01 + (h11 - h01) * tx) - (h00 + (h10 - h00) * tx)) * tz;
  }

  _cellGet(map, x, z) {
    if (!map.size || !this._inBBox(x, z)) return undefined;
    return map.get(key(Math.round(x / PATCH_CELL), Math.round(z / PATCH_CELL)));
  }

  terrainAt(x, z) {
    const i = this._cellGet(this.terrain, x, z);
    return i === undefined ? null : TERRAIN_PAINTS[i] ?? null;
  }

  // 0 = untouched, 1 = shallow water, 2 = painted dry, 3 = deep water
  waterAt(x, z) { return this._cellGet(this.water, x, z) ?? 0; }

  pathAt(x, z) { return this._cellGet(this.path, x, z) === 1; }

  // ---- brushes (editor only) ----

  // visit every cell center within `radius` of (x,z); fn(cx, cz, k 0..1)
  _stroke(x, z, radius, fn) {
    const c0x = Math.floor((x - radius) / PATCH_CELL), c1x = Math.ceil((x + radius) / PATCH_CELL);
    const c0z = Math.floor((z - radius) / PATCH_CELL), c1z = Math.ceil((z + radius) / PATCH_CELL);
    for (let cz = c0z; cz <= c1z; cz++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        const wx = cx * PATCH_CELL, wz = cz * PATCH_CELL;
        const d = Math.hypot(wx - x, wz - z);
        if (d > radius) continue;
        const k = 1 - (d / radius) ** 2; // soft falloff toward the rim
        fn(cx, cz, k, wx, wz);
        this._grow(wx, wz);
      }
    }
    this.dirty = true;
  }

  // raise (+amount) / lower (−amount) with soft falloff
  brushHeight(x, z, radius, amount) {
    this._stroke(x, z, radius, (cx, cz, k) => {
      const kk = key(cx, cz);
      const v = (this.height.get(kk) ?? 0) + amount * k;
      if (Math.abs(v) < 0.01) this.height.delete(kk); else this.height.set(kk, v);
    });
  }

  // pull painted deltas toward the brush average (needs baseH for unpainted)
  brushSmooth(x, z, radius, k0) {
    let sum = 0, n = 0;
    this._stroke(x, z, radius, (cx, cz) => { sum += this.height.get(key(cx, cz)) ?? 0; n++; });
    if (!n) return;
    const avg = sum / n;
    this._stroke(x, z, radius, (cx, cz, k) => {
      const kk = key(cx, cz);
      const v = this.height.get(kk) ?? 0;
      const nv = v + (avg - v) * Math.min(1, k0 * k);
      if (Math.abs(nv) < 0.01) this.height.delete(kk); else this.height.set(kk, nv);
    });
  }

  // erase sculpting back to the procedural ground
  brushHeightErase(x, z, radius) {
    this._stroke(x, z, radius, (cx, cz) => this.height.delete(key(cx, cz)));
  }

  // paint / erase a cell layer (terrain index, water flag, path flag)
  brushCells(layer, x, z, radius, value) {
    const map = this[layer];
    this._stroke(x, z, radius, (cx, cz) => {
      if (value === null) map.delete(key(cx, cz));
      else map.set(key(cx, cz), value);
    });
  }

  // plain Lower support: pin every stroked cell whose NATURAL terrain is water
  // to forced-dry (=2), so a dug valley never fills — even below sea level or
  // through a lake/bog/river. Cells already dry are left untouched (no bloat).
  brushDryWater(x, z, radius, isNaturalWater) {
    this._stroke(x, z, radius, (cx, cz, k, wx, wz) => {
      const kk = key(cx, cz);
      if (this.water.get(kk) === 2) return;         // already pinned dry
      if (isNaturalWater(wx, wz)) this.water.set(kk, 2);
    });
  }

  // ---- entities ----
  addEntity(kind, type, x, z, extra = {}) {
    const e = { id: 'e' + this._nextId++, kind, type,
      x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, ...extra };
    this.entities.push(e);
    if (kind === 'building') this.rebuildTowns();
    this.dirty = true;
    return e;
  }

  removeEntity(id) {
    const wasBuilding = this.entities.some(e => e.id === id && e.kind === 'building');
    this.entities = this.entities.filter(e => e.id !== id);
    if (wasBuilding) this.rebuildTowns();
    this.dirty = true;
  }

  // hide or drag a GENERATED landmark ('poi:12', 'smith:3')
  removeGenerated(genKey) { this.removed.add(genKey); this.dirty = true; }
  moveGenerated(genKey, x, z) {
    this.moved.set(genKey, { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 });
    this.dirty = true;
  }

  // doodads (trees / rocks / flower meadows) intersecting a chunk rect —
  // meadows count when their circle reaches into it
  doodadsIn(x0, z0, size) {
    if (!this.entities.length) return [];
    return this.entities.filter(e => {
      if (!['tree', 'rock', 'meadow', 'building', 'field', 'deco', 'hive', 'berry'].includes(e.kind)) return false;
      const pad = (e.kind === 'meadow' || e.kind === 'field') ? (e.r ?? 10) : 0;
      return e.x >= x0 - pad && e.x < x0 + size + pad
          && e.z >= z0 - pad && e.z < z0 + size + pad;
    });
  }

  // ---- towns ----
  // Placed buildings cluster into settlements: every building gets a packed
  // sand pad; once a cluster reaches TOWN_MIN buildings it upgrades to a
  // cobblestone town — pads widen, lanes auto-link neighbouring buildings,
  // and villagers stroll the square (enemies.js reads townCentersIn).
  rebuildTowns() {
    const bs = this.entities.filter(e => e.kind === 'building');
    this._townFlag = new Map();   // building id -> is part of a town
    this._townSegs = [];          // auto lanes between neighbours
    this._townCenters = [];       // { x, z, size } per cluster
    this._bBuckets = new Map();   // 40 m grid -> building refs
    const TOWN_MIN = 10, LINK = 90;
    // union-find over 'close enough' pairs
    const parent = bs.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        if (Math.hypot(bs[i].x - bs[j].x, bs[i].z - bs[j].z) < LINK) {
          parent[find(i)] = find(j);
        }
      }
    }
    const clusters = new Map();
    bs.forEach((b, i) => {
      const root = find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(b);
    });
    for (const members of clusters.values()) {
      const town = members.length >= TOWN_MIN;
      let cx = 0, cz = 0;
      for (const b of members) {
        this._townFlag.set(b.id, town);
        cx += b.x; cz += b.z;
      }
      if (town) this._townCenters.push({ x: cx / members.length, z: cz / members.length, size: members.length });
      // lanes: each building links to its nearest neighbour (towns knit tight)
      for (const b of members) {
        let best = null, bd = LINK;
        for (const o of members) {
          if (o === b) continue;
          const d = Math.hypot(b.x - o.x, b.z - o.z);
          if (d < bd) { bd = d; best = o; }
        }
        if (best && !this._townSegs.some(sg =>
          (sg.a === best && sg.b === b) || (sg.a === b && sg.b === best))) {
          this._townSegs.push({ a: b, b: best });
        }
      }
    }
    for (const b of bs) {
      const k = Math.floor(b.x / 40) + ',' + Math.floor(b.z / 40);
      if (!this._bBuckets.has(k)) this._bBuckets.set(k, []);
      this._bBuckets.get(k).push(b);
    }
  }

  // 0 = wild ground · 1 = packed sand pad · 2 = cobblestone (a real town)
  buildingGroundAt(x, z) {
    if (!this._bBuckets?.size) return 0;
    const cx = Math.floor(x / 40), cz = Math.floor(z / 40);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      for (const b of this._bBuckets.get((cx + dx) + ',' + (cz + dz)) ?? []) {
        const town = this._townFlag?.get(b.id);
        if (Math.hypot(x - b.x, z - b.z) < (town ? 13 : 8)) return town ? 2 : 1;
      }
    }
    return 0;
  }

  // within an auto lane between two clustered buildings?
  townRoadAt(x, z) {
    if (!this._townSegs?.length) return false;
    for (const sg of this._townSegs) {
      if ((Math.abs(x - sg.a.x) > 100 && Math.abs(x - sg.b.x) > 100)
          || (Math.abs(z - sg.a.z) > 100 && Math.abs(z - sg.b.z) > 100)) continue;
      const dx = sg.b.x - sg.a.x, dz = sg.b.z - sg.a.z;
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - sg.a.x) * dx + (z - sg.a.z) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      if (Math.hypot(x - (sg.a.x + dx * t), z - (sg.a.z + dz * t)) < 2.2) return true;
    }
    return false;
  }

  townCentersIn(cx, cz, size) {
    return (this._townCenters ?? []).filter(t =>
      Math.abs(t.x - cx) <= size / 2 && Math.abs(t.z - cz) <= size / 2);
  }

  // admin-placed monster camps inside a spawn-zone cell (for enemies.js)
  packsIn(cx, cz, size) {
    if (!this.entities.length) return [];
    return this.entities.filter(e => e.kind === 'pack'
      && Math.abs(e.x - cx) <= size / 2 && Math.abs(e.z - cz) <= size / 2);
  }

  // ---- persistence ----
  serialize() {
    const enc = (map) => [...map.entries()];
    return {
      v: 1, nextId: this._nextId,
      height: enc(this.height).map(([k, v]) => [k, Math.round(v * 100) / 100]),
      terrain: enc(this.terrain), water: enc(this.water), path: enc(this.path),
      entities: this.entities,
      removed: [...this.removed],
      moved: enc(this.moved),
      tweaks: this.tweaks,
    };
  }

  load(data) {
    if (!data || data.v !== 1) return false; // don't wipe on a foreign file
    this.clear();
    this._nextId = data.nextId ?? 1;
    for (const [k, v] of data.height ?? []) this.height.set(k, v);
    for (const [k, v] of data.terrain ?? []) this.terrain.set(k, v);
    for (const [k, v] of data.water ?? []) this.water.set(k, v);
    for (const [k, v] of data.path ?? []) this.path.set(k, v);
    this.entities = data.entities ?? [];
    this.removed = new Set(data.removed ?? []);
    this.moved = new Map(data.moved ?? []);
    this.tweaks = { enemies: {}, items: {}, biomes: {}, ...(data.tweaks ?? {}) };
    // rebuild the bbox from every stored cell + entity
    for (const map of [this.height, this.terrain, this.water, this.path]) {
      for (const k of map.keys()) {
        const [cx, cz] = k.split(',').map(Number);
        this._grow(cx * PATCH_CELL, cz * PATCH_CELL);
      }
    }
    // ids must stay unique even if nextId is stale in the file
    for (const e of this.entities) {
      const n = parseInt(String(e.id).slice(1), 10);
      if (Number.isFinite(n) && n >= this._nextId) this._nextId = n + 1;
    }
    this.rebuildTowns();
    this.dirty = false;
    return true;
  }
}

export const worldPatch = new WorldPatch();

// fetched before the world is built (main.js awaits this at boot); a missing
// or invalid file just means "no edits yet"
export async function loadWorldPatch(url = 'assets/world-patch.json') {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) worldPatch.load(await res.json());
  } catch { /* no patch shipped — pure procedural world */ }
  return worldPatch;
}

// ---- object editor: stat overrides for enemy types and items ----
// A restricted field list is snapshotted once, so overrides can always be
// re-applied from pristine values (and removed cleanly).
import { ENEMY_TYPES, ITEMS, BIOMES } from './config.js';

export const ENEMY_TWEAK_FIELDS = ['hpMult', 'dmgMult', 'meleeDmgMult', 'xpMult', 'speed', 'range', 'attackCd', 'aggro', 'spellCd'];
// per-biome globals: numbers + colors (colors edited as hex in the editor)
export const BIOME_TWEAK_FIELDS = ['treeDensity', 'darkness', 'light'];
export const BIOME_COLOR_FIELDS = ['ground', 'ground2', 'dirt', 'grass', 'fog', 'sky'];
export const ITEM_TWEAK_FIELDS = ['level', 'weapon.dmg', 'weapon.cd', 'weapon.range',
  'stats.hp', 'stats.regen', 'stats.speed', 'stats.dmgPct'];

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
const setPath = (obj, path, v) => {
  const ks = path.split('.');
  const last = ks.pop();
  let o = obj;
  for (const k of ks) { if (!o[k]) return; o = o[k]; }
  o[last] = v;
};

let _origEnemies = null, _origItems = null, _origBiomes = null;
function snapshotOriginals() {
  if (_origEnemies) return;
  _origEnemies = {};
  for (const [t, cfg] of Object.entries(ENEMY_TYPES)) {
    _origEnemies[t] = {};
    for (const f of ENEMY_TWEAK_FIELDS) if (cfg[f] !== undefined) _origEnemies[t][f] = cfg[f];
  }
  _origItems = {};
  for (const it of ITEMS) {
    _origItems[it.id] = {};
    for (const f of ITEM_TWEAK_FIELDS) {
      const v = getPath(it, f);
      if (v !== undefined) _origItems[it.id][f] = v;
    }
  }
  _origBiomes = BIOMES.map((b) => {
    const o = {};
    for (const f of [...BIOME_TWEAK_FIELDS, ...BIOME_COLOR_FIELDS]) {
      if (b[f] !== undefined) o[f] = b[f];
    }
    return o;
  });
}

export function tweakOriginal(kind, id, field) {
  snapshotOriginals();
  if (kind === 'enemy') return _origEnemies[id]?.[field];
  if (kind === 'biome') return _origBiomes[id]?.[field];
  return _origItems[id]?.[field];
}

// restore pristine values (deleting whitelisted fields the pristine config
// never had), then lay the patch overrides on top — whitelisted only, so a
// hand-edited JSON can't inject arbitrary fields into live config tables
export function applyTweaks() {
  snapshotOriginals();
  for (const [t, cfg] of Object.entries(ENEMY_TYPES)) {
    const o = _origEnemies[t] ?? {};
    for (const f of ENEMY_TWEAK_FIELDS) {
      if (o[f] !== undefined) cfg[f] = o[f];
      else delete cfg[f];
    }
  }
  for (const it of ITEMS) {
    const o = _origItems[it.id] ?? {};
    for (const f of ITEM_TWEAK_FIELDS) {
      if (o[f] !== undefined) setPath(it, f, o[f]);
    }
  }
  const BIOME_ALL = [...BIOME_TWEAK_FIELDS, ...BIOME_COLOR_FIELDS];
  BIOMES.forEach((b, i) => {
    const o = _origBiomes[i] ?? {};
    for (const f of BIOME_ALL) {
      if (o[f] !== undefined) b[f] = o[f];
      else delete b[f];
    }
  });
  for (const [t, ov] of Object.entries(worldPatch.tweaks.enemies)) {
    const cfg = ENEMY_TYPES[t];
    if (!cfg) continue;
    for (const f of ENEMY_TWEAK_FIELDS) if (ov[f] !== undefined) cfg[f] = ov[f];
  }
  for (const [id, ov] of Object.entries(worldPatch.tweaks.items)) {
    const it = ITEMS.find(i => i.id === id);
    if (!it) continue;
    for (const f of ITEM_TWEAK_FIELDS) if (ov[f] !== undefined) setPath(it, f, ov[f]);
  }
  for (const [idx, ov] of Object.entries(worldPatch.tweaks.biomes ?? {})) {
    const b = BIOMES[+idx];
    if (!b) continue;
    for (const f of BIOME_ALL) if (ov[f] !== undefined) b[f] = ov[f];
  }
}
