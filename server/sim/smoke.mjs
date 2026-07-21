// ==========================================================================
// Milestone 2.0 — first slice: prove the REAL Among The Woods simulation
// (World + EnemyManager + Pickups + Projectiles) runs headless under Node and
// emits a contract-conformant { e, p, s } snapshot deterministically, with ZERO
// WebSocket / client wiring. This is the ground truth that Approach A works.
//
// Run:  node server/sim/smoke.mjs
// Gate: exits 0, no throw over 1200 ticks, world determinism holds, snapshot
//       shapes conform, enemy ids monotonic, at least one enemy spawns.
// ==========================================================================

import { register } from 'node:module';

// 1) map bare 'three' → vendored build BEFORE any game module loads
register('./three-hook.mjs', import.meta.url);

// 2) now the game modules resolve 'three'; import them dynamically
const THREE = await import('three');
const { bootWorld, COOP_WORLD_SEED } = await import('./world-sim.mjs');
const { EnemyManager } = await import('../../js/enemies.js');
const { Pickups } = await import('../../js/pickups.js');
const { Projectiles } = await import('../../js/projectiles.js');
const { audio } = await import('../../js/audio.js');

audio.muted = true;                     // neutralize all SFX before any playback

let pass = 0, fail = 0;
const ck = (n, ok, d = '') => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('FAIL  ' + n + '  ' + d)); };

// ---- no-op hook set (the client wires these to UI/XP; server slice ignores) ----
const noopHooks = new Proxy({}, { get: () => () => {} });

// ---- synthetic guest target proxies (stand in for connected players) ----
function makeProxy(world, x, z, level = 6) {
  const p = {
    pos: new THREE.Vector3(x, 0, z),
    dead: false, stealthed: false, editorGhost: false, isPet: false, level,
    _dmg: 0,
    takeDamage(dmg) { this._dmg += dmg; return dmg; },
  };
  p.pos.y = world.heightAt(x, z);
  return p;
}

// ================= boot the real sim =================
const { world, scene } = bootWorld();
ck('world booted headless (seed ' + COOP_WORLD_SEED + ')', !!world && typeof world.heightAt === 'function');

const enemyMgr = new EnemyManager(scene, world, noopHooks);
const pickups = new Pickups(scene, world, noopHooks);
const projectiles = new Projectiles(scene);
ck('managers constructed', !!enemyMgr && !!pickups && !!projectiles);

// two guests roaming a small loop near the valley start
const proxies = [makeProxy(world, 0, 0), makeProxy(world, 12, -8)];
const nearAny = (x, z) => proxies.some(p => Math.hypot(x - p.pos.x, z - p.pos.z) < 130);

// ================= determinism: two independent boots agree on terrain =================
{
  const b2 = bootWorld();
  const pts = [[0, 0], [120, 60], [-80, 200], [300, -150], [0, -420], [500, 500]];
  const a = pts.map(([x, z]) => world.heightAt(x, z));
  const b = pts.map(([x, z]) => b2.world.heightAt(x, z));
  ck('terrain deterministic across two boots', JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' vs ' + JSON.stringify(b));
}

// ================= run 1200 ticks =================
const DT = 1 / 20;
let ticks = 0, sawEnemy = false, lastSnap = null, threw = null;
const seenEnemyIds = [];
try {
  for (let i = 0; i < 1200; i++) {
    world.time += DT;
    enemyMgr.nightK = 0.5 + 0.5 * Math.sin(world.time * 0.03); // fake day/night sweep
    // roam the proxies along gentle loops so seeded spawn near players fires
    const t = world.time;
    proxies[0].pos.set(Math.cos(t * 0.2) * 22, 0, Math.sin(t * 0.2) * 22);
    proxies[1].pos.set(14 + Math.cos(t * 0.15) * 16, 0, -6 + Math.sin(t * 0.15) * 16);
    for (const p of proxies) p.pos.y = world.heightAt(p.pos.x, p.pos.z);

    enemyMgr.update(DT, proxies, projectiles);
    pickups.update(DT, proxies);
    projectiles.update(DT, enemyMgr, proxies);
    ticks++;

    if (i % 100 === 0) {
      lastSnap = {
        e: enemyMgr.snapshot().filter(s => nearAny(s.x, s.z)),
        p: pickups.snapshot().filter(s => nearAny(s.x, s.z)),
        s: projectiles.snapshotShots(),
      };
      if (lastSnap.e.length) { sawEnemy = true; for (const e of lastSnap.e) seenEnemyIds.push(e.id); }
      console.log(`  tick ${i}: e=${lastSnap.e.length} p=${lastSnap.p.length} s=${lastSnap.s.length}` +
        (lastSnap.e[0] ? `  e0=${JSON.stringify(lastSnap.e[0])}` : ''));
    }
  }
} catch (e) { threw = e; }

ck('1200 ticks ran without throwing', threw === null, threw ? (threw.stack || String(threw)) : '');
ck('sim reached 1200 ticks', ticks === 1200, 'ticks=' + ticks);
ck('at least one enemy spawned & entered a snapshot', sawEnemy, 'seen=' + seenEnemyIds.length);

// ================= snapshot-shape conformance (final full snapshot) =================
const full = {
  e: enemyMgr.snapshot(),
  p: pickups.snapshot(),
  s: projectiles.snapshotShots(),
};
const isInt = (v) => Number.isInteger(v);
const oneDec = (v) => typeof v === 'number' && Math.round(v * 10) === v * 10;
const eOk = full.e.every(e =>
  isInt(e.id) && typeof e.t === 'string' && isInt(e.b) && e.b >= 0 && e.b <= 3 &&
  isInt(e.l) && oneDec(e.x) && oneDec(e.z) && isInt(e.hp) && isInt(e.m) &&
  (e.a === undefined || e.a === 1) && (e.n === undefined || typeof e.n === 'string'));
ck('every e[] entry conforms {id,t,b,l,x,z,hp,m,a?,n?}', eOk, 'sample=' + JSON.stringify(full.e[0] ?? null));

const pOk = full.p.every(p => isInt(p.i) && typeof p.k === 'string' && oneDec(p.x) && oneDec(p.z) && (p.o === undefined || p.o === 1));
ck('every p[] entry conforms {i,k,pl,x,z,o?}', pOk, 'sample=' + JSON.stringify(full.p[0] ?? null));

const sOk = full.s.every(s => isInt(s.i) && oneDec(s.x) && oneDec(s.z) && (s.sp === undefined || s.sp === 1));
ck('every s[] entry conforms {i,x,z,c,sp?}', sOk, 'sample=' + JSON.stringify(full.s[0] ?? null));

// ids monotonic & positive
const allIds = full.e.map(e => e.id);
ck('enemy ids are positive integers', allIds.every(id => isInt(id) && id >= 1), JSON.stringify(allIds.slice(0, 8)));

// no forbidden fields leaked (mesh/y/rotation/null)
const noLeak = [...full.e, ...full.p, ...full.s].every(o =>
  !('y' in o) && !('mesh' in o) && !('rot' in o) && Object.values(o).every(v => v !== null));
ck('no leaked render fields (mesh/y/rot) or nulls', noLeak);

console.log(`\n=== M2.0 smoke: ${pass} passed, ${fail} failed ===`);
console.log(`final pool: enemies=${full.e.length} pickups=${full.p.length} shots=${full.s.length}`);
process.exit(fail ? 1 : 0);
