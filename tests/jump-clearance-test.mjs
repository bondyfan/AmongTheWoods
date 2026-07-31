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

// =========================================================================
// ...and the part that made ALL of the above dead code: the ordinary walking
// path called collide() with no `air` at all. Only a dash ever passed it, so
// running and jumping at a fence bounced off it exactly as before.
// =========================================================================
console.log('\n-- every movement path reports how high the feet are --');
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync('js/player.js', 'utf8');
  const calls = [...src.matchAll(/world\.collide\(this\.pos, 0\.45,\s*\{([\s\S]{0,600}?)\}\);/g)]
    .map(m => m[1]);
  ok(calls.length >= 2, `${calls.length} collide calls on the movement paths`);
  ok(calls.every(c => /air: Math\.max\(0, \(this\.y \?\? 0\) - world\.heightAt\(/.test(c)),
    'and every one of them passes air — walking as well as dashing');
  ok(calls.every(c => /feetY: this\.y/.test(c)),
    'and the absolute foot height, which is what rocks are judged on');
}

// =========================================================================
// Rocks: the other half of the complaint. They had no height at all, so the
// clearance rule skipped them and every boulder was an infinite pillar.
// =========================================================================
// chunks are streamed, not built at boot — walk the world once so there are
// real generated rocks to measure rather than hand-made stand-ins
// chunks are generated a couple per frame, so one update() call yields almost
// nothing — stand still and let the whole view radius fill in
for (let i = 0; i < 200; i++) world.update(0.016, { x: 260, y: 0, z: 260 });
const allRocks = () => {
  const out = [];
  for (const ch of world.chunks.values()) out.push(...(ch.rocks ?? []));
  return out;
};

console.log('\n-- boulders declare a height, and it matches the mesh --');
{
  const rocks = allRocks();
  ok(rocks.length > 20, `${rocks.length} rocks in the loaded chunks`);
  ok(rocks.every(r => r.top > 0 && r.h > 0), 'all of them carry a top and a clearance');
  ok(rocks.every(r => r.h < r.top), 'clearance is under the top — legs scrape over');
  // the numbers have to line up with makeBoulder or you clear thin air
  const bad = rocks.filter(r =>
    Math.abs(r.top - (r.radius / 0.9) * (0.25 + r.mesh.scale.y)) > 1e-9);
  ok(bad.length === 0, `every top matches its own mesh (${bad.length} off)`);

  // Heights must actually VARY — a constant would have been far simpler, and
  // wrong, since these are the numbers the jump is measured against.
  const tops = rocks.map(r => r.top);
  const lo = Math.min(...tops), hi = Math.max(...tops);
  ok(hi - lo > 0.8, `tops span a real range (${lo.toFixed(2)} – ${hi.toFixed(2)} m)`);

  // At a 2.41 m apex nearly every boulder in the ground is clearable, which is
  // the point — the ask was to be able to hop the breakable rocks. The ceiling
  // still exists: the largest the generator can produce stays solid.
  const APEX = 12.8 * 12.8 / (2 * 34);
  const clearable = rocks.filter(r => r.h < APEX).length;
  ok(clearable / rocks.length > 0.9,
    `${clearable} of ${rocks.length} clear a ${APEX.toFixed(2)} m jump`);
  const MAX_TOP = 1.7 * (0.25 + 1.3);
  ok(MAX_TOP - 0.15 > APEX,
    `but the largest a boulder can get (${MAX_TOP.toFixed(2)} m) is still too tall to hop`);
}

console.log('\n-- and a rock stops you on foot but not mid-jump --');
{
  let rock = null;
  for (const r of allRocks()) if (r.h < 1.6 && (!rock || r.h < rock.h)) rock = r;
  ok(!!rock, `found a low boulder to test (h ${rock?.h.toFixed(2)} m)`);
  const base = world.heightAt(rock.x, rock.z);
  const at = (feetY) => {
    const p = { x: rock.x + 0.1, y: 0, z: rock.z };
    world.collide(p, 0.45, { feetY });
    return Math.hypot(p.x - rock.x, p.z - rock.z);
  };
  ok(at(base) > rock.radius, 'on the ground it shoves you out');
  ok(at(base + rock.h + 0.05) < 0.5, 'above its clearance you pass straight over');
  ok(at(base + rock.top) < 0.5, 'and standing on its top you are left alone');
  // a caller that says nothing about height gets the old, always-solid rock
  ok((() => { const p = { x: rock.x + 0.1, y: 0, z: rock.z };
    world.collide(p, 0.45, {}); return Math.hypot(p.x - rock.x, p.z - rock.z); })() > rock.radius,
    'and one that reports no feet at all — enemies — is blocked as before');
}

console.log('\n-- landing ON a boulder --');
{
  let rock = null;
  for (const r of allRocks()) if (!rock || r.top > rock.top) rock = r;
  const base = world.heightAt(rock.x, rock.z);
  const top = base + rock.top;

  // feet above it, in the middle of it → you stand on the rock
  ok(Math.abs(world.surfaceAt(rock.x, rock.z, top + 0.5) - top) < 1e-9,
    'coming down onto the middle of it, the surface IS the rock');
  // feet below it → it is something you are UNDER, not on. Otherwise walking
  // past a boulder would jerk you up onto it.
  ok(world.surfaceAt(rock.x, rock.z, base) < top - 0.3,
    'standing at its foot, the surface is still the ground');
  // no feetY at all → the old two-argument behaviour, untouched
  ok(world.surfaceAt(rock.x, rock.z) < top - 0.3,
    'and callers that do not pass feet get the terrain, as before');
  // step off the edge and you fall
  const off = world.surfaceAt(rock.x + rock.radius * 0.95, rock.z, top + 0.5);
  ok(off < top - 0.2, 'past the standable rim you are over open ground again');

  // a rock you have smashed is not a platform
  rock.alive = false;
  ok(world.surfaceAt(rock.x, rock.z, top + 0.5) < top - 0.3,
    'and a broken rock holds nobody up');
  rock.alive = true;
}

console.log('\n-- while standing on top, the rock does not shove you off --');
{
  // The clearance is deliberately UNDER the top, so a player standing at `top`
  // still counts as clear and collide leaves them alone. If the two numbers
  // were equal, landing would be followed instantly by being ejected sideways.
  let worst = 1;
  for (const r of allRocks()) worst = Math.min(worst, r.top - r.h);
  ok(worst > 0, `every rock keeps a margin (smallest ${worst.toFixed(2)} m)`);
  // and the margin only has to hold because both sides are measured from the
  // SAME terrain sample — `air`, taken under the player, drifts on a slope
  const { readFileSync } = await import('node:fs');
  const w = readFileSync('js/world.js', 'utf8');
  ok(/feetY > this\.heightAt\(rock\.x, rock\.z\) \+ rock\.h/.test(w),
    'rocks compare absolute heights, not height-above-the-player');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
