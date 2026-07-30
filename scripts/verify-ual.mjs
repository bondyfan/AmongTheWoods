// ==========================================================================
// verify-ual — the gate before any mixer code gets written.
//
// The whole plan rests on ONE assumption: that Quaternius' Universal Animation
// Library was authored on the same skeleton as our Universal Base Character, so
// its clips bind to our bones by node name with no retargeting.
//
// Bone NAMES are already confirmed to match. Names are the easy half. glTF
// rotation tracks are expressed in each bone's PARENT frame, so what actually
// decides drop-in is the per-bone local REST rotation — and 63 of our 65 joints
// carry a non-identity one (upperarm_l is a ~90 degree twist). If those rest
// poses differ, clips bind "successfully" and the character comes out bent.
//
// This compares them, and inventories the clips' tracks so we know up front
// which ones touch `root` (those must be stripped — our root carries the
// Y-up/Z-up conversion, and a foreign root track throws the origin to the waist).
//
// Pure JSON: no three, no loaders, works on .gltf or .glb.
//
//   node scripts/verify-ual.mjs <path-to-ual.gltf|.glb> [more...]
// ==========================================================================
import { readFileSync } from 'node:fs';

const OURS = 'assets/models/human/human.gltf';
const TOL = 1e-4;              // float noise, not a real difference

// A .glb is a 12-byte header then length-prefixed chunks; the first is JSON.
function readGltf(path) {
  const buf = readFileSync(path);
  if (buf.slice(0, 4).toString() === 'glTF') {
    const len = buf.readUInt32LE(12);
    return JSON.parse(buf.slice(20, 20 + len).toString('utf8'));
  }
  return JSON.parse(buf.toString('utf8'));
}

// name -> { parent, rot[4], pos[3] } for every joint of the first skin
function skeletonOf(doc) {
  const nodes = doc.nodes ?? [];
  const parent = new Map();
  nodes.forEach((n, i) => (n.children ?? []).forEach(c => parent.set(c, i)));
  const joints = doc.skins?.[0]?.joints;
  const idx = joints ?? nodes.map((_, i) => i);   // clip-only files have no skin
  const out = new Map();
  for (const i of idx) {
    const n = nodes[i];
    if (!n?.name) continue;
    out.set(n.name, {
      parent: parent.has(i) ? (nodes[parent.get(i)]?.name ?? '<root>') : '<none>',
      rot: n.rotation ?? [0, 0, 0, 1],
      pos: n.translation ?? [0, 0, 0],
    });
  }
  return out;
}

// Angle between two rest rotations, in radians. Normalize first: the exporter
// writes quaternions that are only unit-length to ~1e-5, and an un-normalized
// self-comparison reports a spurious ~0.4 degrees on every bone (this script's
// own self-test caught that). q and -q are the same rotation, hence the abs.
const quatDelta = (a, b) => {
  const na = Math.hypot(a[0], a[1], a[2], a[3]) || 1;
  const nb = Math.hypot(b[0], b[1], b[2], b[3]) || 1;
  const d = Math.abs((a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) / (na * nb));
  return 2 * Math.acos(Math.min(1, d));
};

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/verify-ual.mjs <ual.glb> [...]');
  process.exit(2);
}

const ours = skeletonOf(readGltf(OURS));
console.log(`ours: ${OURS} — ${ours.size} joints\n`);

let verdict = 0;
for (const f of files) {
  const doc = readGltf(f);
  const theirs = skeletonOf(doc);
  const clips = doc.animations ?? [];
  console.log('='.repeat(66));
  console.log(`${f}\n  ${theirs.size} nodes, ${clips.length} clips`);

  // ---- which bones do the clips actually drive? --------------------------
  const driven = new Set();
  const rootTracks = [];
  for (const a of clips) {
    for (const ch of a.channels ?? []) {
      const n = doc.nodes?.[ch.target?.node]?.name;
      if (!n) continue;
      if (n === 'root') { rootTracks.push(`${a.name}:${ch.target.path}`); continue; }
      driven.add(n);   // `root` deliberately excluded — check [4] owns it
    }
  }
  // No clips means every check below passes vacuously, which would read as a
  // green light. Almost always the wrong download tier (source .blend, or the
  // FBX-only bundle) rather than a real answer.
  if (!clips.length || !driven.size) {
    console.log(`\n  NO ANIMATION TRACKS in this file — nothing to verify.`);
    console.log(`  Wrong tier? Want the glTF/GLB export that contains the clips.`);
    verdict = 1;
    continue;
  }
  console.log(`  clips drive ${driven.size} distinct bones`);
  console.log(`  clip names: ${clips.slice(0, 8).map(c => c.name).join(', ')}` +
    (clips.length > 8 ? `, …(+${clips.length - 8})` : ''));

  // ---- 1. do the driven bones exist in our rig? --------------------------
  const missing = [...driven].filter(n => !ours.has(n));
  console.log(`\n  [1] driven bones missing from our rig: ` +
    (missing.length ? `${missing.length} — ${missing.slice(0, 12).join(', ')}` : 'NONE'));
  if (missing.length) verdict = 1;

  // ---- 2. hierarchy ------------------------------------------------------
  const reparented = [...driven].filter(n =>
    ours.has(n) && theirs.has(n) && ours.get(n).parent !== theirs.get(n).parent);
  console.log(`  [2] driven bones with a DIFFERENT parent: ` +
    (reparented.length
      ? `${reparented.length} — ` + reparented.slice(0, 6)
          .map(n => `${n} (ours:${ours.get(n).parent} vs theirs:${theirs.get(n).parent})`).join('; ')
      : 'NONE'));
  if (reparented.length) verdict = 1;

  // ---- 3. THE load-bearing check: rest rotations -------------------------
  const drift = [];
  for (const n of driven) {
    if (!ours.has(n) || !theirs.has(n)) continue;
    const d = quatDelta(ours.get(n).rot, theirs.get(n).rot);
    if (d > TOL) drift.push([n, d]);
  }
  drift.sort((a, b) => b[1] - a[1]);
  if (!drift.length) {
    console.log(`  [3] rest rotations: IDENTICAL on every driven bone  -> DROP-IN`);
  } else {
    const deg = (r) => (r * 180 / Math.PI).toFixed(1) + '°';
    console.log(`  [3] rest rotations DIFFER on ${drift.length}/${driven.size} driven bones:`);
    for (const [n, d] of drift.slice(0, 12)) console.log(`        ${n.padEnd(14)} ${deg(d)}`);
    const worst = drift[0][1] * 180 / Math.PI;
    console.log(`      worst ${deg(drift[0][1])} — ` + (worst < 1
      ? 'under a degree, cosmetic; try it before retargeting'
      : 'this needs a ONE-OFF rest-pose correction in Blender, not runtime retargeting'));
    verdict = 1;
  }

  // ---- 4. root tracks ---------------------------------------------------
  // Not a failure — expected, and fixed in the same offline pass that trims the
  // clip list. Flagged so it can't be forgotten.
  console.log(`  [4] tracks targeting \`root\`: ` +
    (rootTracks.length ? `${rootTracks.length} — strip these offline (not a blocker)` : 'none'));
}

console.log('\n' + '='.repeat(66));
console.log(verdict === 0
  ? 'PASS — clips bind by node name with no retargeting. Write the mixer.'
  : 'NOT A CLEAN DROP-IN — see above. Fix offline in Blender, or fall back to KayKit.');
process.exit(verdict);
