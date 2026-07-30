// ==========================================================================
// BODY FACING — regression test.
//
// models.js builds humanoids with two different front conventions: makeMan (the
// player body, and therefore the VILLAGER) faces +Z, while every humanoid()/
// beast body faces -Z. enemies.js turns units toward a target and was adding a
// blanket + Math.PI at all six facing sites, so villagers walked backwards.
// Bodies now declare frontZ and enemies.js reads it via faceYaw().
//
// The check reads the front off GEOMETRY — the brightest/outermost face plate —
// rather than off the frontZ flag, so it can't just restate the code under test.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/facing-test.mjs'); })"
// ==========================================================================
import * as THREE from 'three';
import { bootWorld } from '../server/sim/world-sim.mjs';
import { EnemyManager } from '../js/enemies.js';
import { audio } from '../js/audio.js';
audio.muted = true;

const { world, scene } = bootWorld();
const noop = () => {};
const em = new EnemyManager(scene, world, new Proxy({}, { get: () => noop }));

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

// Where does this body actually LOOK? Read it off the geometry, not off the
// frontZ flag the fix introduced — otherwise the test just restates the code.
// makeMan puts bright eyes on its front face; humanoid() bodies get a `face`
// panel. Fall back to the head's brightest forward child.
function eyeDir(mesh) {
  mesh.updateMatrixWorld(true);
  // The face is whichever small plate sits furthest off the body's mid-plane:
  // makeMan's eye whites at z=+0.17, humanoid()'s face panel at z=-0.29. Reading
  // the sign off geometry is the point — asking userData.frontZ would just
  // restate the code under test.
  let best = null;
  mesh.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const z = Math.abs(o.position.z);
    if (z > 0.1 && (!best || z > Math.abs(best.o.position.z))) best = { o };
  });
  if (!best) return null;
  const local = best.o.position.clone();                    // in body space
  const world = best.o.getWorldPosition(new THREE.Vector3());
  const origin = mesh.getWorldPosition(new THREE.Vector3());
  const v = world.sub(origin); v.y = 0;
  return { dir: v.normalize(), localZ: local.z };
}

function faceTest(type, label) {
  const e = em._spawn(type, 300, 300, 0.5);
  if (!e) { ok(false, `${label}: could not spawn`); return; }
  const eye = eyeDir(e.mesh);
  if (!eye) { ok(false, `${label}: no face geometry found`); return; }
  ok(Math.abs(eye.localZ) > 0.1, `${label}: face plate at local z=${eye.localZ.toFixed(2)}`);

  // point it at a target 10 m along +X and see where the eyes end up
  const dx = 1, dz = 0;
  const front = e.mesh.userData?.frontZ > 0 ? 0 : Math.PI;
  e.mesh.rotation.y = Math.atan2(dx, dz) + front;
  const after = eyeDir(e.mesh).dir;
  const dot = after.x * dx + after.z * dz;
  ok(dot > 0.9, `${label}: face points AT the target (dot ${dot.toFixed(2)})`);
  return e;
}

console.log('\n-- villager (makeMan body, front +Z) --');
faceTest('villager', 'villager');
console.log('\n-- bandit (humanoid body, front -Z) — must be unchanged --');
faceTest('bandit', 'bandit');

console.log('\n-- and the old blanket +PI really was backwards --');
{
  const e = em._spawn('villager', 500, 500, 0.5);
  e.mesh.rotation.y = Math.atan2(1, 0) + Math.PI;   // what the code used to do
  const d = eyeDir(e.mesh).dir;
  ok(d.x < -0.9, `with +PI the villager's face pointed AWAY (dot ${d.x.toFixed(2)})`);
}

console.log('\n-- the flag itself --');
const v = em._spawn('villager', 400, 400, 0.5);
const b = em._spawn('bandit', 410, 410, 0.5);
ok(v?.mesh.userData.frontZ === 1, 'makeMan body is tagged frontZ: 1');
ok(b?.mesh.userData.frontZ === undefined, 'humanoid body carries no flag (defaults to -Z)');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
