// ==========================================================================
// RETARGETED CLIPS — regression test on assets/models/human/anims.glb.
//
// scripts/retarget-ual.mjs rebuilds this file from Quaternius' Universal
// Animation Library. Everything it must get right fails SILENTLY if it doesn't:
//
//  * a track naming a bone our rig doesn't have simply never binds — three logs
//    nothing and that limb stays in its rest pose
//  * a surviving translation/scale track overwrites our bone OFFSETS with the
//    source rig's, and its bones are up to 19.6% different in length, so the
//    mesh skins onto proportions it wasn't bound for
//  * a `root` track fights the Y-up conversion our root carries and throws the
//    character's origin to its waist
//  * and a clip name drifting from humanmodel.js's CLIP table means the state
//    machine asks for something that doesn't exist and just… doesn't animate
//
// Pure JSON — no three, no loader.
//
// Run: node tests/anims-asset-test.mjs
// ==========================================================================
import { readFileSync, existsSync } from 'node:fs';
import { CLIP } from '../js/humanmodel.js';

const ANIMS = 'assets/models/human/anims.glb';
const RIG = 'assets/models/human/human.gltf';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

if (!existsSync(ANIMS)) {
  console.log(`FAIL  ${ANIMS} is missing — run scripts/retarget-ual.mjs`);
  process.exit(1);
}
const glb = readFileSync(ANIMS);
const doc = JSON.parse(glb.slice(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
const rig = JSON.parse(readFileSync(RIG, 'utf8'));

const rigNames = new Set((rig.nodes ?? []).map(n => n.name).filter(Boolean));
const clipNames = new Set((doc.animations ?? []).map(a => a.name));

console.log(`\n${ANIMS} — ${(glb.length / 1024).toFixed(0)} KB, ${clipNames.size} clips`);

console.log('\n-- every clip the state machine can ask for exists --');
{
  const wanted = [...new Set(Object.values(CLIP))];
  const missing = wanted.filter(n => !clipNames.has(n));
  ok(missing.length === 0,
    `all ${wanted.length} names in humanmodel.js CLIP are present${missing.length ? ' — MISSING: ' + missing.join(', ') : ''}`);
}

console.log('\n-- every track binds to a bone our rig actually has --');
{
  const bad = new Set();
  for (const a of doc.animations ?? []) {
    for (const ch of a.channels ?? []) {
      const n = doc.nodes?.[ch.target?.node]?.name;
      if (!n || !rigNames.has(n)) bad.add(n ?? `<node ${ch.target?.node}>`);
    }
  }
  ok(bad.size === 0, `no track names an unknown bone${bad.size ? ' — ' + [...bad].slice(0, 8).join(', ') : ''}`);
}

console.log('-- and the node names line up index-for-index with the rig --');
{
  // The retargeter emits OUR node array, so a clip's node index must resolve to
  // the same bone in both files. If that ever drifts, every track binds to the
  // WRONG bone and the character contorts instead of failing.
  let mismatched = 0;
  for (const a of doc.animations ?? []) {
    for (const ch of a.channels ?? []) {
      const i = ch.target.node;
      if (doc.nodes[i]?.name !== rig.nodes[i]?.name) mismatched++;
    }
  }
  ok(mismatched === 0, `all track node indices agree with the rig (${mismatched} mismatched)`);
}

console.log('\n-- the tracks that would silently deform the mesh are gone --');
{
  const byPath = { rotation: 0, translation: 0, scale: 0 };
  const trBones = new Set(), rootTracks = [];
  for (const a of doc.animations ?? []) {
    for (const ch of a.channels ?? []) {
      byPath[ch.target.path] = (byPath[ch.target.path] ?? 0) + 1;
      const n = doc.nodes?.[ch.target.node]?.name;
      if (ch.target.path === 'translation') trBones.add(n);
      if (n === 'root') rootTracks.push(a.name);
    }
  }
  ok(byPath.scale === 0, `no scale tracks (${byPath.scale})`);
  ok(rootTracks.length === 0, `no root tracks (${rootTracks.length})`);
  ok([...trBones].every(n => n === 'pelvis'),
    `translation only on pelvis — the gait bob — and nowhere else (${[...trBones].join(', ') || 'none'})`);
  ok(byPath.rotation > 0, `rotation tracks present (${byPath.rotation})`);
}

console.log('\n-- fingers were dropped, hands were kept --');
{
  const driven = new Set();
  for (const a of doc.animations ?? []) for (const ch of a.channels ?? []) {
    driven.add(doc.nodes?.[ch.target.node]?.name);
  }
  const fingers = [...driven].filter(n => /thumb|index|middle|pinky|ring/i.test(n ?? ''));
  ok(fingers.length === 0, `no finger tracks — 40 of 65 bones, invisible at this camera (${fingers.length})`);
  ok(driven.has('hand_l') && driven.has('hand_r'), 'hand_l/hand_r ARE driven (the weapon sockets ride them)');
}

console.log('\n-- and it is small enough to ship --');
ok(glb.length < 1_500_000, `${(glb.length / 1024).toFixed(0)} KB, under the 1.5 MB budget`);

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
