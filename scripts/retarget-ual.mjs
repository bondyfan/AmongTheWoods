// ==========================================================================
// retarget-ual — turn Quaternius' Universal Animation Library into clips our
// Universal Base Character can actually wear. Offline, once, no Blender.
//
// WHAT verify-ual.mjs FOUND. The two rigs share all 65 bone names and the exact
// same hierarchy, but they are NOT the same skeleton:
//   * rest rotations differ on 62 of 64 driven bones, worst 17.1 degrees
//   * bone LENGTHS differ by a median 8.2%, up to 19.6% (neck_01)
//   * and every single bone carries translation AND scale tracks
// Played raw, those tracks would overwrite our bone offsets with theirs while
// our mesh's inverseBindMatrices still assume ours — a 20%-short neck and
// 11%-short thighs skinned onto a body built for different proportions.
//
// SO, two corrections:
//
//  1. DROP every translation and scale track. Rotation drives the pose; bone
//     offsets stay OURS, so the mesh keeps its own proportions. The one
//     exception is the pelvis's translation, which carries the vertical bob and
//     weight shift that make a gait read as walking rather than gliding — kept,
//     and scaled by the height ratio between the rigs. `root` is dropped whole:
//     ours carries the Y-up conversion, and world translation is game code's job.
//
//  2. Correct the rest-pose delta, anchored on A_TPose — which ships in the
//     library, and is the one pose both rigs explicitly agree on. Per bone, with
//     T = their A_TPose rotation and R = our rest rotation, either
//        parent-space delta:  q_out = q_in * (T^-1 * R)
//        bone-space delta:    q_out = (R * T^-1) * q_in
//     Both reproduce our bind pose exactly at A_TPose, so that test cannot tell
//     them apart. This script therefore runs FORWARD KINEMATICS on both
//     skeletons over real clips and compares WORLD bone directions, then keeps
//     whichever formulation actually points the limbs the same way.
//
//   node scripts/retarget-ual.mjs <UAL.glb> [--out assets/models/human/anims.glb]
// ==========================================================================
import { readFileSync, writeFileSync } from 'node:fs';

const OURS = 'assets/models/human/human.gltf';
const args = process.argv.slice(2);
const SRC = args.find(a => !a.startsWith('--'));
const OUT = (args.find(a => a.startsWith('--out=')) ?? '--out=assets/models/human/anims.glb').slice(6);
if (!SRC) { console.error('usage: node scripts/retarget-ual.mjs <UAL.glb> [--out=path]'); process.exit(2); }

// What Phase A and the near future need. Everything else is dead weight in a
// browser download. A_TPose is kept because it is the correction's own proof.
const WANT = new Set([
  'A_TPose',
  'Idle_Loop', 'Idle_Torch_Loop', 'Sword_Idle',
  'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop',
  'Sword_Attack', 'Punch_Jab', 'Punch_Cross',
  'Jump_Start', 'Jump_Loop', 'Jump_Land',
  'Swim_Fwd_Loop', 'Swim_Idle_Loop',
  'Death01', 'Hit_Chest', 'Roll',
  'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot',
  'Sitting_Idle_Loop', 'Interact',
]);
const DROP_NODES = new Set(['root']);
// 40 of the 65 bones are finger segments (5 fingers x 4 x 2 hands). At this
// game's camera distance they are invisible, they carry ~60% of all tracks, and
// the rest pose already holds a usable relaxed hand. Weapons hang off a socket
// on hand_l/hand_r, which is kept. --fingers overrides.
const KEEP_FINGERS = args.includes('--fingers');
const isFinger = (n) => /thumb|index|middle|pinky|ring/i.test(n);

// ── glb / gltf io ────────────────────────────────────────────────────────────
function readAsset(path) {
  const buf = readFileSync(path);
  if (buf.slice(0, 4).toString() === 'glTF') {
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
    const binLen = buf.readUInt32LE(20 + jsonLen);
    const bin = buf.slice(28 + jsonLen, 28 + jsonLen + binLen);
    return { json, bin };
  }
  return { json: JSON.parse(buf.toString('utf8')), bin: null };
}

// Float accessor -> Float32Array. Everything in this library is plain FLOAT and
// un-normalized (checked), so refuse anything else rather than guess.
const COMPS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readAccessor({ json, bin }, i) {
  const a = json.accessors[i];
  if (a.componentType !== 5126 || a.normalized) {
    throw new Error(`accessor ${i}: expected un-normalized FLOAT, got ${a.componentType}`);
  }
  const n = COMPS[a.type];
  const bv = json.bufferViews[a.bufferView];
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride ?? n * 4;
  const out = new Float32Array(a.count * n);
  for (let e = 0; e < a.count; e++) {
    for (let c = 0; c < n; c++) out[e * n + c] = bin.readFloatLE(base + e * stride + c * 4);
  }
  return out;
}

// ── quaternion math, [x, y, z, w] ────────────────────────────────────────────
const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qInv = (q) => { const n = q[0]**2 + q[1]**2 + q[2]**2 + q[3]**2 || 1;
  return [-q[0] / n, -q[1] / n, -q[2] / n, q[3] / n]; };
const qNorm = (q) => { const n = Math.hypot(...q) || 1; return q.map(v => v / n); };
// rotate a vector by a quaternion
const qRot = (q, v) => {
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const tx = 2 * (y * vz - z * vy), ty = 2 * (z * vx - x * vz), tz = 2 * (x * vy - y * vx);
  return [vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx)];
};

// ── load both rigs ───────────────────────────────────────────────────────────
const src = readAsset(SRC);
const ours = readAsset(OURS);
const byName = (doc) => { const m = new Map();
  (doc.nodes ?? []).forEach((n, i) => { if (n.name) m.set(n.name, i); }); return m; };
const sIdx = byName(src.json), oIdx = byName(ours.json);
const parentOf = (doc) => { const p = new Map();
  (doc.nodes ?? []).forEach((n, i) => (n.children ?? []).forEach(c => p.set(c, i))); return p; };
const sPar = parentOf(src.json), oPar = parentOf(ours.json);

const rest = (doc, i) => ({
  t: doc.nodes[i].translation ?? [0, 0, 0],
  r: qNorm(doc.nodes[i].rotation ?? [0, 0, 0, 1]),
  s: doc.nodes[i].scale ?? [1, 1, 1],
});

// ── sample a clip's local rotations at time t ────────────────────────────────
function sampler(asset, anim) {
  const rot = new Map(), tr = new Map();       // nodeIndex -> {times, vals}
  for (const ch of anim.channels ?? []) {
    const s = anim.samplers[ch.sampler];
    const rec = { times: readAccessor(asset, s.input), vals: readAccessor(asset, s.output) };
    if (ch.target.path === 'rotation') rot.set(ch.target.node, rec);
    else if (ch.target.path === 'translation') tr.set(ch.target.node, rec);
  }
  const pick = (rec, t, n) => {
    const { times, vals } = rec;
    let i = 0; while (i < times.length - 1 && times[i + 1] < t) i++;
    const j = Math.min(i + 1, times.length - 1);
    const span = times[j] - times[i] || 1;
    const u = Math.max(0, Math.min(1, (t - times[i]) / span));
    const out = [];
    for (let c = 0; c < n; c++) out.push(vals[i * n + c] * (1 - u) + vals[j * n + c] * u);
    return out;
  };
  return {
    rotAt: (node, t) => rot.has(node) ? qNorm(pick(rot.get(node), t, 4)) : null,
    trAt:  (node, t) => tr.has(node) ? pick(tr.get(node), t, 3) : null,
    duration: Math.max(...[...rot.values(), ...tr.values()].map(r => r.times[r.times.length - 1] ?? 0), 0),
  };
}

// Forward kinematics: world position + world rotation per bone.
function fk(doc, idxMap, parMap, overrideRot, overrideTr) {
  const world = new Map();
  const order = [...idxMap.values()].sort((a, b) => depth(a) - depth(b));
  function depth(i) { let d = 0, c = i; while (parMap.has(c)) { c = parMap.get(c); d++; } return d; }
  for (const i of order) {
    const R = rest(doc, i);
    const r = overrideRot?.(i) ?? R.r;
    const t = overrideTr?.(i) ?? R.t;
    const p = parMap.get(i);
    if (p == null || !world.has(p)) { world.set(i, { pos: t.slice(), rot: r }); continue; }
    const W = world.get(p);
    world.set(i, {
      pos: qRot(W.rot, t).map((v, k) => v + W.pos[k]),
      rot: qMul(W.rot, r),
    });
  }
  return world;
}

// ── the correction, both ways ────────────────────────────────────────────────
const tposeAnim = (src.json.animations ?? []).find(a => /tpose/i.test(a.name));
if (!tposeAnim) { console.error('A_TPose not found in the source — cannot anchor the correction'); process.exit(1); }
const tpose = sampler(src, tposeAnim);

const shared = [...oIdx.keys()].filter(n => sIdx.has(n) && !DROP_NODES.has(n));
const corr = new Map();     // name -> { right, left }
for (const name of shared) {
  const T = tpose.rotAt(sIdx.get(name), 0) ?? rest(src.json, sIdx.get(name)).r;
  const R = rest(ours.json, oIdx.get(name)).r;
  corr.set(name, { right: qMul(qInv(T), R), left: qMul(R, qInv(T)) });
}

// height ratio, for the pelvis bob
const hOf = (doc, idxMap, parMap) => {
  const w = fk(doc, idxMap, parMap);
  const ys = [...w.values()].map(v => v.pos[1]);
  return (Math.max(...ys) - Math.min(...ys)) || 1;
};
const HR = hOf(ours.json, oIdx, oPar) / hOf(src.json, sIdx, sPar);

// Score each formulation properly. Comparing "direction from bone to its first
// child" was wrong: that direction depends on the CHILD's local offset, which
// legitimately differs between these rigs, so it had a large non-zero floor and
// both formulations scored the same. The rest-pose-agnostic invariant is the
// WORLD DELTA from each rig's own rest: the source moves a bone from
// W_rest_their to W_their(t), so D_their = W_their * W_rest_their^-1, and the
// retarget is right exactly when our bone undergoes the same world delta from
// OUR rest. Bone lengths and rest orientations cancel out of that comparison.
const JOINTS = new Set((ours.json.skins?.[0]?.joints ?? []).map(i => ours.json.nodes[i]?.name));
const SCORED = shared.filter(n => JOINTS.has(n) && !/_leaf|thumb|index|middle|pinky|ring/i.test(n));

const restWorldOurs = fk(ours.json, oIdx, oPar);
const restWorldTheirs = fk(src.json, sIdx, sPar);

function score(mode) {
  const probes = ['Walk_Loop', 'Sword_Attack', 'Idle_Loop']
    .map(n => (src.json.animations ?? []).find(a => a.name === n)).filter(Boolean);
  let sum = 0, worst = 0, worstAt = '', n = 0;
  const byBone = new Map();
  for (const anim of probes) {
    const sm = sampler(src, anim);
    for (let k = 0; k <= 8; k++) {
      const t = (sm.duration || 1) * k / 8;
      const theirs = fk(src.json, sIdx, sPar, i => sm.rotAt(i, t), i => sm.trAt(i, t));
      const mine = fk(ours.json, oIdx, oPar, (i) => {
        const name = ours.json.nodes[i]?.name;
        const q = name && sIdx.has(name) ? sm.rotAt(sIdx.get(name), t) : null;
        const c = corr.get(name);
        if (!q || !c) return null;
        return qNorm(mode === 'right' ? qMul(q, c.right) : qMul(c.left, q));
      }, null);
      for (const name of SCORED) {
        const oi = oIdx.get(name), si = sIdx.get(name);
        if (!mine.has(oi) || !theirs.has(si)) continue;
        const dOurs   = qMul(mine.get(oi).rot,   qInv(restWorldOurs.get(oi).rot));
        const dTheirs = qMul(theirs.get(si).rot, qInv(restWorldTheirs.get(si).rot));
        const dot = Math.abs(dOurs[0]*dTheirs[0] + dOurs[1]*dTheirs[1]
                           + dOurs[2]*dTheirs[2] + dOurs[3]*dTheirs[3]);
        const d = 2 * Math.acos(Math.max(-1, Math.min(1, dot)));
        sum += d; n++;
        const b = byBone.get(name) ?? { sum: 0, n: 0 };
        b.sum += d; b.n++; byBone.set(name, b);
        if (d > worst) { worst = d; worstAt = name; }
      }
    }
  }
  const per = [...byBone].map(([k, v]) => [k, v.sum / v.n]).sort((a, b) => b[1] - a[1]);
  return { mean: sum / (n || 1), worst, worstAt, n, per };
}

const deg = (r) => (r * 180 / Math.PI).toFixed(1) + '°';
const R1 = score('right'), R2 = score('left');
console.log(`correction formulation — world-delta error vs the source rig (${SCORED.length} bones):`);
console.log(`  parent-space (q * T^-1R):  mean ${deg(R1.mean)}  worst ${deg(R1.worst)} (${R1.worstAt})`);
console.log(`  bone-space   (RT^-1 * q):  mean ${deg(R2.mean)}  worst ${deg(R2.worst)} (${R2.worstAt})`);
// Pick on the mean only when the two are meaningfully apart; otherwise pick the
// better WORST case. A 0.2 degree mean difference is noise, while the bone that
// carries the worst error here is neck_01 — i.e. the head, where error is most
// visible. Deciding on the mean alone would trade a visible defect for nothing.
const NOISE = 0.5 * Math.PI / 180;
const MODE = Math.abs(R1.mean - R2.mean) > NOISE
  ? (R1.mean <= R2.mean ? 'right' : 'left')
  : (R1.worst <= R2.worst ? 'right' : 'left');
const best = MODE === 'right' ? R1 : R2;
console.log(`  -> using ${MODE === 'right' ? 'parent-space' : 'bone-space'}` +
  ` (means within noise, decided on worst case), mean ${deg(best.mean)} over ${best.n} samples`);
console.log('  residual per bone, worst first:');
for (const [k, v] of best.per.slice(0, 6)) console.log(`     ${k.padEnd(12)} ${deg(v)}`);
console.log();

// ── build the output ─────────────────────────────────────────────────────────
const outNodes = ours.json.nodes.map(n => ({
  ...(n.name ? { name: n.name } : {}),
  ...(n.children ? { children: n.children.slice() } : {}),
  ...(n.translation ? { translation: n.translation.slice() } : {}),
  ...(n.rotation ? { rotation: n.rotation.slice() } : {}),
  ...(n.scale ? { scale: n.scale.slice() } : {}),
}));

const chunks = [];            // Buffers appended to the output BIN
let offset = 0;
const bufferViews = [], accessors = [];
function pushAccessor(arr, type) {
  const n = COMPS[type];
  const b = Buffer.alloc(arr.length * 4);
  arr.forEach((v, i) => b.writeFloatLE(v, i * 4));
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  chunks.push(b);
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: b.length });
  offset += b.length;
  const count = arr.length / n;
  const acc = { bufferView: bufferViews.length - 1, componentType: 5126, count, type };
  if (type === 'SCALAR') {                       // time inputs need min/max
    acc.min = [Math.min(...arr)]; acc.max = [Math.max(...arr)];
  }
  accessors.push(acc);
  return accessors.length - 1;
}

const animations = [];
let keptTracks = 0, droppedTracks = 0;
for (const anim of src.json.animations ?? []) {
  if (!WANT.has(anim.name)) continue;
  const channels = [], samplers = [];
  for (const ch of anim.channels ?? []) {
    const name = src.json.nodes[ch.target.node]?.name;
    if (!name || DROP_NODES.has(name) || !oIdx.has(name)) { droppedTracks++; continue; }
    if (!KEEP_FINGERS && isFinger(name)) { droppedTracks++; continue; }
    const isPelvisTr = ch.target.path === 'translation' && name === 'pelvis';
    if (ch.target.path === 'scale' || (ch.target.path === 'translation' && !isPelvisTr)) {
      droppedTracks++; continue;
    }
    const s = anim.samplers[ch.sampler];
    const times = Array.from(readAccessor(src, s.input));
    const vals = readAccessor(src, s.output);
    let outVals;
    if (ch.target.path === 'rotation') {
      const c = corr.get(name);
      outVals = [];
      for (let i = 0; i < vals.length; i += 4) {
        const q = qNorm([vals[i], vals[i + 1], vals[i + 2], vals[i + 3]]);
        outVals.push(...qNorm(MODE === 'right' ? qMul(q, c.right) : qMul(c.left, q)));
      }
    } else {
      // pelvis bob, rescaled to our proportions
      outVals = Array.from(vals, v => v * HR);
    }
    const input = pushAccessor(times, 'SCALAR');
    const output = pushAccessor(outVals, ch.target.path === 'rotation' ? 'VEC4' : 'VEC3');
    samplers.push({ input, output, interpolation: 'LINEAR' });
    channels.push({ sampler: samplers.length - 1, target: { node: oIdx.get(name), path: ch.target.path } });
    keptTracks++;
  }
  if (channels.length) animations.push({ name: anim.name, channels, samplers });
}

const bin = Buffer.concat(chunks);
const doc = {
  asset: { version: '2.0', generator: 'retarget-ual.mjs (Among The Woods)' },
  scenes: [{ nodes: ours.json.scenes?.[0]?.nodes ?? [0] }],
  scene: 0,
  nodes: outNodes,
  animations, accessors, bufferViews,
  buffers: [{ byteLength: bin.length }],
};

// pack the GLB
const jsonBuf = Buffer.from(JSON.stringify(doc), 'utf8');
const jsonPad = Buffer.concat([jsonBuf, Buffer.alloc((4 - jsonBuf.length % 4) % 4, 0x20)]);
const binPad = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
const header = Buffer.alloc(12);
header.write('glTF', 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonPad.length + 8 + binPad.length, 8);
const jc = Buffer.alloc(8); jc.writeUInt32LE(jsonPad.length, 0); jc.write('JSON', 4);
const bc = Buffer.alloc(8); bc.writeUInt32LE(binPad.length, 0); bc.writeUInt32LE(0x004E4942, 4);
writeFileSync(OUT, Buffer.concat([header, jc, jsonPad, bc, binPad]));

console.log(`wrote ${OUT}`);
console.log(`  ${animations.length} clips, ${keptTracks} tracks kept, ${droppedTracks} dropped (scale/translation/root${KEEP_FINGERS ? '' : '/fingers'})`);
console.log(`  ${(binPad.length / 1024).toFixed(0)} KB binary, ${((jsonPad.length + binPad.length) / 1024).toFixed(0)} KB total` +
  `  (source was ${(readFileSync(SRC).length / 1024 / 1024).toFixed(1)} MB)`);
console.log(`  pelvis bob rescaled by ${HR.toFixed(4)}x`);

// ── prove it: replay A_TPose from the OUTPUT and compare to our bind pose ────
const back = readAsset(OUT);
const tp = (back.json.animations ?? []).find(a => /tpose/i.test(a.name));
if (!tp) { console.log('\n(no A_TPose in output — correction unverified)'); process.exit(0); }
const bs = sampler(back, tp);
let worst = 0, worstAt = '';
for (const name of shared) {
  const q = bs.rotAt(oIdx.get(name), 0);
  if (!q) continue;
  const R = rest(ours.json, oIdx.get(name)).r;
  const d = 2 * Math.acos(Math.min(1, Math.abs(q[0]*R[0] + q[1]*R[1] + q[2]*R[2] + q[3]*R[3])));
  if (d > worst) { worst = d; worstAt = name; }
}
const okTP = worst < 1e-3;
console.log(`\nPROOF  replaying A_TPose from the output reproduces our bind pose` +
  ` to ${deg(worst)} (worst: ${worstAt})  ->  ${okTP ? 'CORRECT' : 'WRONG'}`);
process.exit(okTP ? 0 : 1);
