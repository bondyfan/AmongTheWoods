// ==========================================================================
// HOMESTEAD FENCE + BAKING — regression test.
//
// The starting yard's fence stood as a ring of radial SPOKES instead of a wall.
// makeFenceRun laid its posts and rails along +X, while every caller orients it
// with the engine's Z-forward convention — a+PI/2 tangent to the yard ring, and
// atan2(dirX, dirZ) at the village — so every run came out at a right angle to
// where it belonged. Both fences were wrong; only the round one looked absurd.
//
// And the yard is 300-odd boxes that never move. Unbaked it was 313 of the
// frame's 748 draw calls: 42% of the budget, every frame, for scenery.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/homestead-test.mjs'); })"
// ==========================================================================
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { makeFenceRun, makeFenceGate } from '../js/models.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

// which way is this thing long?
function longAxis(obj) {
  const b = new THREE.Box3().setFromObject(obj);
  const s = b.getSize(new THREE.Vector3());
  return s.x > s.z ? 'x' : 'z';
}

console.log('\n-- a fence run is built along +Z, the engine convention --');
{
  const run = makeFenceRun(6);
  ok(longAxis(run) === 'z', `its long axis is Z (${longAxis(run)})`);
  const b = new THREE.Box3().setFromObject(run);
  const s = b.getSize(new THREE.Vector3());
  ok(s.z > 5.5 && s.x < 1, `6 m along Z, thin across (${s.z.toFixed(1)} x ${s.x.toFixed(2)})`);
  ok(longAxis(makeFenceGate(3)) === 'z', 'and the gate spans the same axis');
}

console.log('\n-- so a run laid tangent to the yard ring really IS tangent --');
{
  // the homestead places each run at (sin a, cos a)*R and rotates by a + PI/2
  const R = 18;
  let worst = 0, worstA = 0;
  for (const a of [0.62, 1.2, 2.0, Math.PI, 4.0, 5.6]) {
    const run = makeFenceRun(3.6);
    run.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    run.rotation.y = a + Math.PI / 2;
    run.updateMatrixWorld(true);
    // the run's own +Z, in world space
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(run.quaternion);
    const tangent = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const off = Math.abs(Math.abs(dir.dot(tangent)) - 1);
    if (off > worst) { worst = off; worstA = a; }
  }
  ok(worst < 1e-6,
    `every run lies along the tangent (worst deviation ${worst.toExponential(1)} at a=${worstA.toFixed(2)})`);
}

console.log('\n-- and it is NOT radial, which is what it used to be --');
{
  const a = 1.2, R = 18;
  const run = makeFenceRun(3.6);
  run.rotation.y = a + Math.PI / 2;
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(run.quaternion);
  const radial = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
  ok(Math.abs(dir.dot(radial)) < 1e-6,
    `perpendicular to the radius (dot ${dir.dot(radial).toExponential(1)})`);
}

console.log('\n-- the homestead is baked --');
{
  const world = readFileSync('js/world.js', 'utf8');
  ok(/this\._homeGroup = this\._addStatic\(bakeGroup\(group, true\)\);/.test(world),
    'the yard goes through bakeGroup before it reaches the scene');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
