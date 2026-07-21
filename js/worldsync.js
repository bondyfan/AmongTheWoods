// ==========================================================================
// World-patch CLOUD SYNC — Firebase Realtime Database over its REST API.
//
// The shared era-battle project allows public read/write under `games`, so the
// World Editor can Save straight from the deployed STATIC site (no server, no
// git dance) and every player loads the live map — with a rolling version
// history to browse and roll back. No Firebase SDK: plain fetch() only, so this
// costs nothing at boot beyond one small GET.
//
// Layout under  games/woods-map :
//   current            { id, at, note, by, patch }   — the LIVE map (one-GET load)
//   versions/<id>      { at, note, by }               — light index for the list
//   patches/<id>       <serialized patch>             — heavy body, fetched on restore
// ==========================================================================

import { firebaseConfig } from '../firebase-config.js';

const BASE = (firebaseConfig.databaseURL || '').replace(/\/$/, '');
const MAP = `${BASE}/games/woods-map`;
const MAX_VERSIONS = 40;

const withTimeout = (p, ms) => Promise.race([
  p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
]);

const jput = (url, body, ms = 9000) =>
  withTimeout(fetch(url, { method: 'PUT', body: JSON.stringify(body) }), ms);

// ---- boot: the live patch (null when none saved yet / unreachable) ----
export async function fetchCurrent(ms = 3500) {
  if (!BASE) return null;
  try {
    const res = await withTimeout(fetch(`${MAP}/current.json`, { cache: 'no-store' }), ms);
    if (!res.ok) return null;
    return await res.json(); // { id, at, note, by, patch } | null
  } catch { return null; }
}

// ---- editor Save: store a new version and make it the live map ----
export async function saveVersion(patch, note = '', by = 'admin') {
  if (!BASE) throw new Error('no databaseURL configured');
  const at = Date.now();
  const id = 'v' + at.toString(36); // one admin at a time → timestamp id is unique
  const meta = { at, note: String(note).slice(0, 120), by };
  await jput(`${MAP}/patches/${id}.json`, patch);
  await jput(`${MAP}/versions/${id}.json`, meta);
  await jput(`${MAP}/current.json`, { id, ...meta, patch });
  prune().catch(() => {});
  return { id, ...meta };
}

// ---- version history (newest first, metadata only) ----
export async function listVersions(ms = 6000) {
  if (!BASE) return [];
  try {
    const res = await withTimeout(fetch(`${MAP}/versions.json`, { cache: 'no-store' }), ms);
    if (!res.ok) return [];
    const all = await res.json();
    if (!all) return [];
    return Object.entries(all)
      .map(([id, v]) => ({ id, at: v.at ?? 0, note: v.note ?? '', by: v.by ?? '' }))
      .sort((a, b) => b.at - a.at);
  } catch { return []; }
}

// ---- fetch one version's full patch body ----
export async function fetchVersion(id, ms = 8000) {
  if (!BASE || !id) return null;
  try {
    const res = await withTimeout(fetch(`${MAP}/patches/${id}.json`, { cache: 'no-store' }), ms);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---- make an existing version the live map again (restore) ----
export async function makeCurrent(id) {
  const patch = await fetchVersion(id);
  if (!patch) throw new Error('version not found');
  const metaRes = await withTimeout(fetch(`${MAP}/versions/${id}.json`, { cache: 'no-store' }), 6000);
  const meta = metaRes.ok ? (await metaRes.json()) : {};
  await jput(`${MAP}/current.json`, { id, at: meta.at ?? Date.now(), note: meta.note ?? '', by: meta.by ?? '', patch });
  return patch;
}

// keep the history bounded — delete the oldest bodies + index rows past the cap
async function prune() {
  const vs = await listVersions();
  if (vs.length <= MAX_VERSIONS) return;
  for (const v of vs.slice(MAX_VERSIONS)) {
    fetch(`${MAP}/versions/${v.id}.json`, { method: 'DELETE' }).catch(() => {});
    fetch(`${MAP}/patches/${v.id}.json`, { method: 'DELETE' }).catch(() => {});
  }
}
