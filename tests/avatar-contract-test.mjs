// ==========================================================================
// AVATAR CONTRACT — regression test.
//
// makeMan() (boxes) and makeHumanMan() (rigged glTF) are interchangeable player
// bodies, and the ONLY thing holding that together is a set of userData keys.
// The first rigged attempt published twelve of them, five backed by bare Groups
// that were never added to the scene — so five consumers failed SILENTLY. The
// hero could not show the starter leaf, and `legs` was absent entirely, so
// villager and remote-player leg animation drove nothing at all. Nothing threw.
//
// So: assert the guard actually catches each of those shapes, and assert the
// CONTRACT list still covers everything makeMan publishes — if someone adds a
// handle to the box body, the rigged body has to grow one too.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/avatar-contract-test.mjs'); })"
// ==========================================================================
import * as THREE from 'three';
import { makeMan } from '../js/models.js';
import { assertContract } from '../js/humanmodel.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const throws = (fn, needle) => {
  try { fn(); return null; } catch (e) { return needle && !e.message.includes(needle) ? `wrong error: ${e.message}` : e.message; }
};

// keys assigned at RUNTIME rather than by the factory, so not the factory's job
const RUNTIME_ONLY = new Set(['torchRef']);

console.log('\n-- the box body is the reference, and must satisfy its own contract --');
const box = makeMan();
let err = null;
try { assertContract(box, 'makeMan'); } catch (e) { err = e.message; }
ok(!err, `makeMan passes assertContract${err ? ' — ' + err : ''}`);

console.log('\n-- the contract has not drifted from what makeMan publishes --');
// Re-derive the list the guard checks by probing: delete one key at a time and
// see whether the guard notices. Anything it ignores is a hole in the contract.
const published = Object.keys(box.userData).filter(k => !RUNTIME_ONLY.has(k));
const unguarded = [];
for (const k of published) {
  const probe = makeMan();
  delete probe.userData[k];
  let caught = false;
  try { assertContract(probe); } catch { caught = true; }
  if (!caught) unguarded.push(k);
}
ok(unguarded.length === 0,
  `every key makeMan publishes is guarded${unguarded.length ? ' — UNGUARDED: ' + unguarded.join(', ') : ''} (${published.length} keys)`);

console.log('\n-- the exact failures the first attempt shipped silently --');
{
  const p = makeMan(); delete p.userData.legs;
  ok(throws(() => assertContract(p), "missing 'legs'"),
    "a body with no `legs` is rejected (villagers/remotes animated nothing)");
}
{
  const p = makeMan(); p.userData.leaf = new THREE.Group();   // orphan, as before
  const msg = throws(() => assertContract(p), 'scene graph');
  ok(msg, `an orphan Group for 'leaf' is rejected — ${msg ?? 'NOT CAUGHT'}`);
}
{
  const p = makeMan(); p.userData.torso = new THREE.Group();  // no .material
  const msg = throws(() => assertContract(p), 'scene graph');
  ok(msg, `an orphan 'torso' is rejected (player.js assigns .material to it)`);
}
{
  const p = makeMan();
  const g = new THREE.Group(); p.add(g);       // in-graph but no material
  p.userData.torso = g;
  ok(throws(() => assertContract(p), 'no .material'),
    "an in-graph 'torso' with no .material is still rejected");
}

console.log('\n-- and the guard names the body it was given --');
{
  const p = makeMan(); delete p.userData.capSlot;
  const msg = throws(() => assertContract(p, 'rigged hero'), 'rigged hero');
  ok(msg, `the label reaches the message — ${msg ?? 'NOT CAUGHT'}`);
}

console.log('\n-- makeMan facing, as the rigged body must match it --');
ok(box.userData.frontZ === 1, 'the box body fronts +Z, so the rigged body must too');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
