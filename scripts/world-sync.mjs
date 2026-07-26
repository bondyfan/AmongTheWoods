#!/usr/bin/env node
// ==========================================================================
// world-sync — bridge between the LIVE cloud world and the repo.
//
// What players actually run = procedural generation (code, seed 1) + the
// World-Editor patch (a JSON blob in Firebase). That patch carries BOTH halves
// of the editor's power:
//   • the MAP — sculpted height, painted surface/water/roads, placed entities,
//     deleted and moved landmarks;
//   • the NUMBERS — per-object overrides of ENEMY_TYPES, ITEMS, BIOMES and
//     class SKILLS, which silently replace the values in config.js at runtime.
// Editing in the browser only ever writes the CLOUD half, so the repo — and
// anyone reading it — drifts out of sync with what is live. Worse, the numbers
// drift invisibly: config.js can say an ability unlocks at level 12 while every
// player unlocks it at 8. This script closes both gaps:
//
//   node scripts/world-sync.mjs info [--local]   everything the live world overrides
//   node scripts/world-sync.mjs pull             cloud  -> assets/world-patch.json
//   node scripts/world-sync.mjs push ["note"]    assets/world-patch.json -> new cloud version
//   node scripts/world-sync.mjs versions         cloud version history
//   node scripts/world-sync.mjs diff             local baseline vs live cloud
//
// Run `info` before ANY world-shape or balance work; `pull` + commit whenever
// the repo should carry the real world (and give the map a git history).
// ==========================================================================

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const LOCAL = join(ROOT, 'assets/world-patch.json');
const CELL = 4; // PATCH_CELL — every cell key is a 4 m grid coordinate

const { firebaseConfig } = await import(join(ROOT, 'firebase-config.js'));
const MAP = `${(firebaseConfig.databaseURL || '').replace(/\/$/, '')}/games/woods-map`;

const jget = async (path) => {
  const res = await fetch(`${MAP}/${path}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
};
const jput = async (path, body) => {
  const res = await fetch(`${MAP}/${path}.json`, { method: 'PUT', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
};

const readLocal = async () => JSON.parse(await readFile(LOCAL, 'utf8'));
const fmtDate = (t) => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 16) : '—');

// ---- cell-layer helpers -------------------------------------------------
function cellStats(pairs = []) {
  if (!pairs.length) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [k] of pairs) {
    const [cx, cz] = k.split(',').map(Number);
    const x = cx * CELL, z = cz * CELL;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  return { n: pairs.length, x0, x1, z0, z1 };
}
const bbox = (s) => (s ? `x ${s.x0}…${s.x1}, z ${s.z0}…${s.z1}` : '—');

// connected blobs of cells (8-neighbour) — turns a bag of painted cells into
// "there are 3 roads, here is each one's extent", which is what you need to
// answer "make THAT road longer"
function blobs(pairs = []) {
  const set = new Set(pairs.map(([k]) => k));
  const seen = new Set(), out = [];
  for (const key of set) {
    if (seen.has(key)) continue;
    const stack = [key], cells = [];
    seen.add(key);
    while (stack.length) {
      const cur = stack.pop();
      cells.push(cur);
      const [cx, cz] = cur.split(',').map(Number);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const nk = `${cx + dx},${cz + dz}`;
        if (set.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
      }
    }
    const pts = cells.map((c) => c.split(',').map(Number));
    const xs = pts.map((p) => p[0] * CELL), zs = pts.map((p) => p[1] * CELL);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    // the two cells furthest apart read as the run's endpoints
    let a = pts[0], b = pts[0], best = -1;
    for (const p of pts) for (const q of pts) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
      if (d > best) { best = d; a = p; b = q; }
    }
    out.push({
      cells: cells.length, x0, x1, z0, z1,
      from: [a[0] * CELL, a[1] * CELL], to: [b[0] * CELL, b[1] * CELL],
      span: Math.round(Math.sqrt(best) * CELL),
    });
  }
  return out.sort((p, q) => q.cells - p.cells);
}

// ---- commands -----------------------------------------------------------
async function report(patch, label, meta = null) {
  console.log(`\n=== ${label} ===`);
  if (meta) console.log(`version ${meta.id}   saved ${fmtDate(meta.at)}   ${meta.note || ''}`);
  if (!patch) { console.log('(no patch)'); return; }

  const H = cellStats(patch.height), T = cellStats(patch.terrain);
  const W = patch.water ?? [], P = patch.path ?? [];
  console.log(`\nTERRAIN LAYERS (4 m cells)`);
  console.log(`  sculpted height : ${H?.n ?? 0}${H ? `   [${bbox(H)}]` : ''}`);
  console.log(`  painted surface : ${T?.n ?? 0}${T ? `   [${bbox(T)}]` : ''}`);
  const wk = { 1: 0, 2: 0, 3: 0 };
  for (const [, v] of W) wk[v] = (wk[v] ?? 0) + 1;
  console.log(`  water           : ${W.length}   (shallow ${wk[1]}, forced-dry ${wk[2]}, deep ${wk[3]})`);
  console.log(`  painted roads   : ${P.length}`);

  const roads = blobs(P);
  if (roads.length) {
    console.log(`\nPAINTED ROADS — ${roads.length} separate run(s):`);
    roads.slice(0, 12).forEach((r, i) => console.log(
      `  #${i + 1}  ${r.cells} cells, ~${r.span} m long,`
      + ` from (${r.from[0]}, ${r.from[1]}) to (${r.to[0]}, ${r.to[1]})`));
  } else {
    console.log(`\nPAINTED ROADS — none. Every road in the world is PROCEDURAL`);
    console.log(`  (world.js _genPaths) — change the code, not the patch.`);
  }

  const water = blobs(W.filter(([, v]) => v === 1 || v === 3));
  if (water.length) {
    console.log(`\nHAND-DUG WATER — ${water.length} body/bodies:`);
    water.slice(0, 8).forEach((r, i) => console.log(
      `  #${i + 1}  ${r.cells} cells, ~${r.span} m across, centred near`
      + ` (${Math.round((r.x0 + r.x1) / 2)}, ${Math.round((r.z0 + r.z1) / 2)})`));
  }

  const ents = patch.entities ?? [];
  if (ents.length) {
    const byKind = {};
    for (const e of ents) (byKind[e.kind] ??= []).push(e);
    console.log(`\nPLACED ENTITIES — ${ents.length} total:`);
    for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${kind} × ${list.length}`);
      for (const e of list.slice(0, 8)) {
        const extra = [e.type && e.type !== kind ? e.type : null,
          e.enemy, e.count ? `×${e.count}` : null, e.r ? `r${e.r}` : null]
          .filter(Boolean).join(' ');
        console.log(`      (${e.x}, ${e.z})  ${extra}`);
      }
      if (list.length > 8) console.log(`      … ${list.length - 8} more`);
    }
  }
  if (patch.removed?.length) console.log(`\nDELETED generated landmarks: ${patch.removed.join(', ')}`);
  if (patch.moved?.length) {
    console.log(`\nMOVED generated landmarks:`);
    for (const [k, p] of patch.moved) console.log(`  ${k} -> (${p.x}, ${p.z})`);
  }

  await reportTweaks(patch.tweaks ?? {});
}

// ---- gameplay overrides: mobs / items / biomes / abilities --------------
// The editor's Stats + Biomes tabs write here, and applyTweaks() lays them over
// config.js at boot. Reading config.js therefore tells you nothing about what
// actually runs — so resolve each override against the real config and print
// "was -> now", plus the object's human name, and flag ids config no longer has.
const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
const hex = (v) => (typeof v === 'number' ? '#' + v.toString(16).padStart(6, '0') : String(v));

async function resolvers() {
  const cfg = await import(join(ROOT, 'js/config.js'));
  const wp = await import(join(ROOT, 'js/worldpatch.js'));
  const skills = cfg.allClassSkills ? cfg.allClassSkills() : [];
  return {
    enemies: {
      title: 'MOBS', fields: wp.ENEMY_TWEAK_FIELDS,
      find: (id) => cfg.ENEMY_TYPES?.[id],
      name: (o) => o?.name ?? '',
      orig: (o, f) => o?.[f],
    },
    items: {
      title: 'ITEMS', fields: wp.ITEM_TWEAK_FIELDS,
      find: (id) => cfg.ITEMS?.find((i) => i.id === id),
      name: (o) => o?.name ?? '',
      orig: (o, f) => getPath(o, f),
    },
    biomes: {
      title: 'BIOMES', fields: [...(wp.BIOME_TWEAK_FIELDS ?? []), ...(wp.BIOME_COLOR_FIELDS ?? [])],
      colorFields: new Set(wp.BIOME_COLOR_FIELDS ?? []),
      find: (idx) => cfg.BIOMES?.[+idx],
      name: (o) => o?.name ?? '',
      orig: (o, f) => o?.[f],
    },
    skills: {
      title: 'ABILITIES', fields: wp.SKILL_TWEAK_FIELDS,
      find: (id) => skills.find((s) => s.id === id),
      name: (o) => o?.name ?? '',
      orig: (o, f) => o?.[f],
    },
  };
}

async function reportTweaks(tw) {
  const groups = Object.entries(tw).filter(([, v]) => v && Object.keys(v).length);
  if (!groups.length) {
    console.log(`\nGAMEPLAY OVERRIDES: none — config.js is the truth for mobs,`
      + ` items, biomes and abilities.`);
    return;
  }
  const R = await resolvers();
  let objs = 0, fields = 0;
  const lines = [];
  for (const [group, table] of groups) {
    const r = R[group];
    lines.push(`\n  ${r?.title ?? group.toUpperCase()}`);
    for (const [id, over] of Object.entries(table)) {
      const obj = r?.find(id);
      objs++;
      const label = `${id}${obj && r.name(obj) ? ` "${r.name(obj)}"` : ''}`;
      lines.push(`    ${label}${obj ? '' : '   ⚠ NOT IN config.js (stale override)'}`);
      for (const [f, v] of Object.entries(over)) {
        fields++;
        const was = obj ? r.orig(obj, f) : undefined;
        const isColor = r?.colorFields?.has(f);
        const fmt = isColor ? hex : (x) => (x === undefined ? '(unset)' : String(x));
        const known = r?.fields?.includes(f);
        lines.push(`        ${f.padEnd(14)} ${fmt(was).padStart(9)}  ->  ${fmt(v)}`
          + (known ? '' : '   ⚠ unknown field'));
      }
    }
  }
  console.log(`\n⚠ GAMEPLAY OVERRIDES — these REPLACE config.js at runtime`);
  console.log(`  (${objs} object(s), ${fields} field(s) changed — editing the`
    + ` config.js value alone will NOT change the game)`);
  console.log(lines.join('\n'));
}

const [cmd = 'info', ...rest] = process.argv.slice(2);

if (cmd === 'info') {
  if (rest.includes('--local')) {
    await report(await readLocal(), 'LOCAL assets/world-patch.json');
  } else {
    const cur = await jget('current');
    if (!cur) { console.log('No cloud map saved yet — the live world is the repo baseline.'); }
    else await report(cur.patch, 'LIVE CLOUD WORLD', cur);
  }
} else if (cmd === 'pull') {
  const cur = await jget('current');
  if (!cur?.patch) { console.error('Nothing in the cloud to pull.'); process.exit(1); }
  await writeFile(LOCAL, JSON.stringify(cur.patch, null, 1));
  console.log(`Pulled cloud version ${cur.id} (${fmtDate(cur.at)}) -> assets/world-patch.json`);
  console.log('Commit it so the repo and the live world agree.');
} else if (cmd === 'push') {
  const patch = await readLocal();
  const at = Date.now();
  const id = 'v' + at.toString(36);
  const meta = { at, note: (rest.join(' ') || 'pushed from repo').slice(0, 120), by: 'map-sync' };
  await jput(`patches/${id}`, patch);
  await jput(`versions/${id}`, meta);
  await jput('current', { id, ...meta, patch });
  console.log(`Pushed assets/world-patch.json as cloud version ${id} — LIVE for players.`);
} else if (cmd === 'versions') {
  const all = (await jget('versions')) ?? {};
  const cur = await jget('current');
  const rows = Object.entries(all).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.at - a.at);
  if (!rows.length) console.log('No cloud versions yet.');
  for (const r of rows) {
    console.log(`${r.id === cur?.id ? '* LIVE ' : '       '}${fmtDate(r.at)}  ${r.id}  ${r.note || ''}`);
  }
} else if (cmd === 'diff') {
  const cur = await jget('current');
  let local = null;
  try { local = await readLocal(); } catch { /* no baseline file */ }
  const size = (p) => (p ? {
    height: p.height?.length ?? 0, terrain: p.terrain?.length ?? 0,
    water: p.water?.length ?? 0, path: p.path?.length ?? 0,
    entities: p.entities?.length ?? 0,
  } : null);
  const a = size(local), b = size(cur?.patch);
  console.log('layer        local      cloud');
  for (const k of ['height', 'terrain', 'water', 'path', 'entities']) {
    const same = a?.[k] === b?.[k];
    console.log(`${k.padEnd(12)} ${String(a?.[k] ?? '—').padEnd(10)} ${b?.[k] ?? '—'}  ${same ? '' : '  <-- DIFFERS'}`);
  }
  console.log(`\ncloud version: ${cur?.id ?? 'none'} (${fmtDate(cur?.at)})`);
  console.log(JSON.stringify(local) === JSON.stringify(cur?.patch)
    ? '\nIn sync.' : '\nOUT OF SYNC — run `pull` to bring the repo up to date.');
} else {
  console.log('usage: map-sync.mjs [info [--local] | pull | push "note" | versions | diff]');
  process.exit(1);
}
