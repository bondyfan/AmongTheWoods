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

const THREE = await import('three');
const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
// the stone's real height at (x,z), independent of anything in world.js
const stoneY = (rock, x, z) => {
  ray.set(new THREE.Vector3(x, world.heightAt(rock.x, rock.z) + rock.top + 2, z), DOWN);
  return ray.intersectObject(rock.mesh, false)[0]?.point.y ?? null;
};

console.log('\n-- every boulder knows its own summit --');
{
  const rocks = allRocks();
  ok(rocks.length > 100, `${rocks.length} rocks in the loaded chunks`);
  ok(rocks.every(r => r.top > 0), 'all of them carry a top');

  // `top` must be the mesh's REAL summit — it is where the surface ray starts,
  // so an underestimate would start the ray inside the stone and miss the peak.
  const box = new THREE.Box3();
  let worstErr = 0, worstFormula = 0;
  for (const r of rocks) {
    const baseY = world.heightAt(r.x, r.z);
    worstErr = Math.max(worstErr, Math.abs((box.setFromObject(r.mesh).max.y - baseY) - r.top));
    // the tidy formula this replaced: scale * (0.25 + the y-squash)
    worstFormula = Math.max(worstFormula,
      Math.abs((r.radius / 0.9) * (0.25 + r.mesh.scale.y) - r.top));
  }
  ok(worstErr < 1e-9, `every top IS the mesh's summit (worst error ${worstErr.toExponential(1)})`);
  ok(worstFormula > 0.3,
    `the derived formula was out by up to ${worstFormula.toFixed(2)} m — makeBoulder rotates at random`);

  const tops = rocks.map(r => r.top);
  ok(Math.max(...tops) - Math.min(...tops) > 0.8,
    `tops span a real range (${Math.min(...tops).toFixed(2)} – ${Math.max(...tops).toFixed(2)} m)`);
}

console.log('\n-- a flat top is what put the gap under the feet --');
{
  // The reported bug. A disc at summit height means that everywhere but the
  // peak you stand above the stone, and on a rotated dodecahedron the summit
  // is a single vertex off to one side — so "everywhere but the peak" is
  // nearly the whole rock.
  let worstDrop = 0;
  for (const rock of allRocks()) {
    const summit = world.heightAt(rock.x, rock.z) + rock.top;
    for (let a = 0; a < 6.28; a += 0.4)
      for (let d = 0; d < rock.radius; d += 0.1) {
        const y = stoneY(rock, rock.x + Math.cos(a) * d, rock.z + Math.sin(a) * d);
        if (y !== null) worstDrop = Math.max(worstDrop, summit - y);
      }
  }
  ok(worstDrop > 1,
    `a flat top would have floated you by up to ${worstDrop.toFixed(2)} m`);
}

console.log('\n-- so the surface IS the stone, everywhere on it --');
{
  let checked = 0, worstGap = 0;
  for (const rock of allRocks().slice(0, 40)) {
    const summit = world.heightAt(rock.x, rock.z) + rock.top;
    for (let a = 0; a < 6.28; a += 0.4)
      for (let d = 0; d < rock.radius; d += 0.1) {
        const x = rock.x + Math.cos(a) * d, z = rock.z + Math.sin(a) * d;
        const stone = stoneY(rock, x, z);
        if (stone === null || stone <= world.heightAt(x, z) + 0.05) continue;
        // come down onto it from above
        const y = world.surfaceAt(x, z, summit + 0.5);
        worstGap = Math.max(worstGap, Math.abs(y - stone));
        checked++;
      }
  }
  ok(checked > 500, `${checked} points sampled across 40 boulders`);
  ok(worstGap < 1e-9, `feet sit exactly on the stone at every one (worst gap ${worstGap})`);
}

console.log('\n-- and wherever you can stand, the rock stops pushing --');
{
  // One rule serving both questions, which is the point: if surfaceAt said
  // "you are on the rock here" and collide said "you are inside it", landing
  // would be followed by being flicked off sideways.
  let stood = 0, ejected = 0;
  for (const rock of allRocks().slice(0, 40)) {
    const summit = world.heightAt(rock.x, rock.z) + rock.top;
    for (let a = 0; a < 6.28; a += 0.4)
      for (let d = 0; d < rock.radius; d += 0.1) {
        const x = rock.x + Math.cos(a) * d, z = rock.z + Math.sin(a) * d;
        const y = world.surfaceAt(x, z, summit + 0.5);
        if (y <= world.heightAt(x, z) + 0.05) continue;   // not on stone here
        stood++;
        const p = { x, y: 0, z };
        world.collide(p, 0.45, { feetY: y });
        if (Math.hypot(p.x - x, p.z - z) < 1e-6) continue;
        // Something moved us — but these points are scattered across open
        // world, so it may well be a tree or a fence standing there. Ask again
        // with the feet impossibly high: if it STILL pushes, no rock did it.
        const q = { x, y: 0, z };
        world.collide(q, 0.45, { feetY: 1e6 });
        if (Math.hypot(q.x - x, q.z - z) < 1e-6) ejected++;
      }
  }
  ok(stood > 500, `${stood} standable points across 40 boulders`);
  ok(ejected === 0, `and the rock pushes at none of them (${ejected} ejections)`);
}

console.log('\n-- on foot it is still a rock, not a ramp --');
{
  // a boulder standing on its own: rocks can overlap, and a neighbour poking
  // into the same spot would answer for it
  let rock = null;
  for (const r of allRocks()) {
    if (world.rocksNear({ x: r.x, z: r.z }, 2.6).length !== 1) continue;
    if (!rock || r.top > rock.top) rock = r;
  }
  ok(!!rock, `found a boulder with no neighbours (top ${rock?.top.toFixed(2)} m)`);
  const base = world.heightAt(rock.x, rock.z);
  const summit = base + rock.top;

  const walk = (d) => {                    // walking in at ground level
    const x = rock.x + d;
    const p = { x, y: 0, z: rock.z };
    world.collide(p, 0.45, { feetY: world.surfaceAt(x, rock.z, world.heightAt(x, rock.z)) });
    return Math.hypot(p.x - rock.x, p.z - rock.z);
  };
  ok(walk(0.1) > rock.radius, 'walking into the middle of it shoves you clear');
  ok(walk(rock.radius * 0.5) > rock.radius, 'and halfway in as well');
  // ...and the shove puts you outside the whole footprint, so there is no rim
  // to creep up: the ramp only opens once you are airborne above the stone
  ok(walk(0.1) >= rock.radius + 0.45 - 1e-9, 'clear of the footprint, not just off the stone');

  // feet below the stone → you are UNDER it, so it is not a floor
  ok(world.surfaceAt(rock.x, rock.z, base) <= world.heightAt(rock.x, rock.z) + 1e-9,
    'standing at its foot, the surface is still the ground');
  // no feetY at all → the old two-argument behaviour, untouched
  ok(world.surfaceAt(rock.x, rock.z) <= world.heightAt(rock.x, rock.z) + 1e-9,
    'and callers that do not pass feet get the terrain, as before');
  // an enemy reports no feet, so a rock is solid to it at any height
  const e = { x: rock.x + 0.1, y: 0, z: rock.z };
  world.collide(e, 0.45, {});
  ok(Math.hypot(e.x - rock.x, e.z - rock.z) > rock.radius,
    'and enemies, which pass no feet, are blocked as before');

  // past the silhouette there is nothing to stand on
  const off = world.surfaceAt(rock.x + rock.radius * 3, rock.z, summit + 0.5);
  ok(off <= world.heightAt(rock.x + rock.radius * 3, rock.z) + 1e-9,
    'well clear of it you are over open ground again');

  // a rock you have smashed is not a platform
  rock.alive = false;
  ok(world.surfaceAt(rock.x, rock.z, summit + 0.5) <= world.heightAt(rock.x, rock.z) + 1e-9,
    'and a broken rock holds nobody up');
  rock.alive = true;
}

console.log('\n-- actually running at one, step by step --');
{
  // The unit tests above all teleport to a point and ask a question. This one
  // walks: the bug they missed was that the collision circle is WIDER than the
  // silhouette, so the ray under your feet found no stone, the rock stayed
  // solid at any height, and you were stopped a body's width short of the part
  // you were allowed to jump onto. You could never get in.
  let rock = null;
  for (const r of allRocks()) {
    if (world.rocksNear({ x: r.x, z: r.z }, 3.5).length !== 1) continue;
    if (r.top > 1.9) continue;                      // one a jump comfortably tops
    if (!rock || r.top > rock.top) rock = r;
  }
  ok(!!rock, `picked a lone boulder ${rock?.top.toFixed(2)} m tall`);
  const base = world.heightAt(rock.x, rock.z);

  // Walk in from 4 m out, 0.1 m a step, feet always on whatever holds them up.
  // `run` returns how close to the centre we ever got, and how high we ended.
  const run = (launchY) => {
    const pos = { x: rock.x - 4, z: rock.z };
    let y = world.heightAt(pos.x, pos.z) + launchY;
    let closest = 4;
    for (let i = 0; i < 60; i++) {
      pos.x += 0.1;
      world.collide(pos, 0.45, { feetY: y, air: y - world.heightAt(pos.x, pos.z) });
      y = Math.max(y, world.surfaceAt(pos.x, pos.z, y));   // stand on what is there
      closest = Math.min(closest, Math.hypot(pos.x - rock.x, pos.z - rock.z));
    }
    return { closest, y, lifted: y - base };
  };

  const walked = run(0);
  ok(walked.closest > rock.radius * 0.8,
    `on foot you are stopped short of it (${walked.closest.toFixed(2)} m from centre)`);
  ok(walked.lifted < 0.3, 'and you never get lifted onto it');

  // ...and at jump height you get in and are carried up onto the stone
  const jumped = run(rock.top + 0.3);
  ok(jumped.closest < rock.radius * 0.5,
    `mid-jump you reach the middle of it (${jumped.closest.toFixed(2)} m from centre)`);
  ok(jumped.lifted > rock.top - 0.5,
    `and come down standing on it, ${jumped.lifted.toFixed(2)} m up`);
}

console.log('\n-- and every boulder is reachable that way --');
{
  const APEX = 12.8 * 12.8 / (2 * 34);
  const rocks = allRocks();
  let reachable = 0;
  for (const rock of rocks) {
    const base = world.heightAt(rock.x, rock.z);
    let lowest = Infinity;
    for (let a = 0; a < 6.28; a += 0.4)
      for (let d = 0; d < rock.radius; d += 0.1) {
        const x = rock.x + Math.cos(a) * d, z = rock.z + Math.sin(a) * d;
        const stone = stoneY(rock, x, z);
        if (stone !== null && stone > world.heightAt(x, z) + 0.3)
          lowest = Math.min(lowest, stone - base);
      }
    if (lowest < APEX) reachable++;
  }
  ok(reachable === rocks.length,
    `all ${rocks.length} boulders have a foothold within a ${APEX.toFixed(2)} m jump`);
}

console.log('\n-- a fence run is a LINE, not a blob --');
{
  // Given as a circle, a run needs a radius long enough to span it — and that
  // radius then bulges the same distance out to either SIDE. A 3.6 m paling
  // became a 1.5 m thick wall (1.95 m with the body), which you bounced off a
  // metre before reaching the planks.
  const runs = world.obstacles.filter(o => o.home && o.h === 1.3);
  ok(runs.length > 10, `${runs.length} homestead runs`);
  ok(runs.every(o => o.x2 != null && o.z2 != null), 'each one carries both ends');
  ok(runs.every(o => Math.abs(Math.hypot(o.x2 - o.x, o.z2 - o.z) - 3.6) < 1e-9),
    'and they are 3.6 m long — the length makeFenceRun builds');
  ok(runs.every(o => o.r <= 0.35), `with a post-width radius (${runs[0].r} m)`);

  // How far out does it actually stop you? Perpendicular to the middle of a run.
  const o = runs[0];
  const mx = (o.x + o.x2) / 2, mz = (o.z + o.z2) / 2;
  const ux = (o.x2 - o.x) / 3.6, uz = (o.z2 - o.z) / 3.6;
  const nx = -uz, nz = ux;                                  // the perpendicular
  const standOff = (side) => {
    const p = { x: mx + nx * 0.05 * side, z: mz + nz * 0.05 * side };
    world.collide(p, 0.45, { air: 0 });
    return Math.abs((p.x - mx) * nx + (p.z - mz) * nz);
  };
  const out = Math.max(standOff(1), standOff(-1));
  ok(out < 0.9, `stopped ${out.toFixed(2)} m from the planks, not 1.95`);
  ok(out > 0.4, 'but still a body clear of them, not clipping through');

  // ...and it must still be a WALL: no gaps between consecutive runs. Sampled
  // a few centimetres off the line rather than on it — pushOut has no
  // direction to push a point sitting exactly on top of its target, and a
  // body never lands there anyway, having been pushed on the way in.
  let leaks = 0, probes = 0;
  for (const run of runs) {
    const dx = run.x2 - run.x, dz = run.z2 - run.z;
    const l = Math.hypot(dx, dz);
    const px = -dz / l, pz = dx / l;
    for (let t = 0; t <= 1.0001; t += 0.05)
      for (const side of [1, -1]) {
        const x = run.x + dx * t + px * 0.06 * side;
        const z = run.z + dz * t + pz * 0.06 * side;
        const p = { x, z };
        world.collide(p, 0.45, { air: 0 });
        probes++;
        if (Math.hypot(p.x - x, p.z - z) < 1e-6) leaks++;
      }
  }
  ok(leaks === 0, `nowhere along the paling can you stand in it (${leaks} of ${probes} probes leaked)`);

  // the yard has to stay a yard: walk the whole ring and check the only way
  // through is the gateway the homestead deliberately leaves open
  const R = Math.hypot(runs[0].x, runs[0].z);
  let open = 0;
  for (let a = 0; a < 6.283; a += 0.01) {
    const x = Math.sin(a) * R, z = Math.cos(a) * R;
    const p = { x, z };
    world.collide(p, 0.45, { air: 0 });
    if (Math.hypot(p.x - x, p.z - z) < 1e-6) open++;
  }
  const openArc = (open / 629) * 360;
  ok(openArc > 5 && openArc < 90,
    `one gateway, and only one (${openArc.toFixed(0)}° of the ring is open)`);

  // and a 2.4 m jump still clears it, which segments must not have broken
  const p = { x: mx, z: mz };
  world.collide(p, 0.45, { air: 2.4 });
  ok(Math.hypot(p.x - mx, p.z - mz) < 1e-6, 'and a jump still carries you over');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
