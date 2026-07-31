// ==========================================================================
// JUMPING OVER LOW OBSTACLES — regression test.
//
// The player could jump, and it did nothing: world.collide() works in 2D, so
// every obstacle is an infinitely tall cylinder. You could sail visibly over a
// waist-high fence and still be shoved back by it.
//
// An obstacle that declares a height `h` is now cleared once the feet are above
// it. Anything WITHOUT an h stays solid at any height, so trees, rocks and
// buildings behave exactly as before — the blast radius is only what opts in.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/jump-clearance-test.mjs'); })"
// ==========================================================================
import { bootWorld } from '../server/sim/world-sim.mjs';
import { audio } from '../js/audio.js';
audio.muted = true;

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const { world } = bootWorld();

// a clean patch of ground to plant test obstacles on
const BX = 900, BZ = 900;
const low  = { x: BX,     z: BZ, r: 2, h: 1.3 };   // a fence
const tall = { x: BX + 40, z: BZ, r: 2 };          // no h — a tree
world.obstacles.push(low, tall);

const nudge = (o, air) => {
  const p = { x: o.x + 0.2, y: 0, z: o.z };        // well inside its radius
  world.collide(p, 0.45, { air });
  return Math.hypot(p.x - o.x, p.z - o.z);
};

console.log('\n-- on the ground, a low obstacle still stops you --');
{
  const d = nudge(low, 0);
  ok(d > 2, `pushed clear of the fence (${d.toFixed(2)} m from centre)`);
}

console.log('\n-- mid-jump, you clear it --');
{
  ok(nudge(low, 1.4) < 0.5, 'at 1.4 m the fence no longer pushes');
  ok(nudge(low, 2.4) < 0.5, 'nor at the top of a jump');
  // and the edge: just below its height it must still block
  ok(nudge(low, 1.2) > 2, 'at 1.2 m — below the 1.3 m posts — it still does');
}

console.log('\n-- but anything without a declared height is solid, always --');
{
  ok(nudge(tall, 0) > 2, 'a tree stops you on the ground');
  ok(nudge(tall, 2.4) > 2, 'and at the top of a jump');
  ok(nudge(tall, 50) > 2, 'and at fifty metres — no accidental fly-through');
}

console.log('\n-- the homestead paling is the one that opted in --');
{
  const paling = world.obstacles.filter(o => o.home && o.h === 1.3);
  ok(paling.length > 10, `${paling.length} fence runs declare a height`);
  const solid = world.obstacles.filter(o => o.home && o.h == null);
  ok(solid.length > 0, `and the cottage and hay do not (${solid.length} still solid)`);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
