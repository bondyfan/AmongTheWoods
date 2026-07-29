// ==========================================================================
// POI GARRISON — regression test.
//
// The crypts, temples, summits, lairs and captive cages on the dedicated
// server stood COMPLETELY EMPTY. _garrisonPoi was hung off world.onPoiSpawned,
// which World fires from _genChunk when the landmark MESH goes up — and the
// server never builds chunk meshes (it calls only heightAt and chop). The
// callback never fired once, so walking to a lair and pressing E sailed past
// the "any keepers left?" check and handed out the reward.
//
// Proximity is the honest trigger, and it has to KEEP checking: EnemyManager
// melts anything past ZONE_RELEASE (205 m) back into its zone pool, so guards
// left behind evaporate and the POI must be re-manned when someone returns.
// Guards that were actually fought stay dead.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./sim/three-hook.mjs', import.meta.url); \
//   await import('./sim/poi-garrison-test.mjs'); })"
// ==========================================================================
import { GameRoom } from './game-room.mjs';
const io = { broadcast(){}, sendTo(){} };
const room = new GameRoom(io);
const w = room.world;

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok' : 'FAIL'}  ${m}`); };
const guards = (poi) => (room.enemyMgr.alive?.() ?? []).filter(e => e.cryptId === poi.id && !e.dying);
const run = (n) => { for (let i = 0; i < n; i++) room.tick(1000 / 15); };

room.addPlayer('u1');
const P = room.players.get('u1').proxy;
const at = (x, z) => P.pos.set(x, 0, z);

const poi = w.pois.find(p => p.type === 'crypt');
console.log(`world has ${w.pois.length} POIs; testing crypt #${poi.id} at ${poi.x.toFixed(0)},${poi.z.toFixed(0)}\n`);

// 1 — far away: nothing
at(poi.x + 600, poi.z); run(30);
ok(guards(poi).length === 0, 'a crypt 600 m away stays empty');

// 2 — walk up: it gets manned
// 170 m: inside GARRISON_R (180) but far outside aggro range, so they must
// be standing there BEFORE the player can see or provoke them
at(poi.x + 170, poi.z); run(30);
const n = guards(poi).length;
ok(n > 0, `it is manned from 170 m away, before you arrive (${n} keepers)`);
ok(guards(poi).every(g => g.aggroed === false), 'and they wait un-aggroed until approached');
at(poi.x + 20, poi.z); run(30);
ok(guards(poi).some(g => g.aggroed), 'walking up wakes them');

// 3 — walk away: they melt (this is what silently emptied crypts before)
at(poi.x + 900, poi.z); run(60);
ok(guards(poi).length === 0, 'walking 900 m off melts them back into the pool');

// 4 — come back: re-manned, NOT left empty
at(poi.x + 20, poi.z); run(30);
ok(guards(poi).length > 0, 'coming back re-mans it instead of handing out a free crypt');

// 5 — kill one for real: the POI retires from the sweep
const victim = guards(poi)[0];
room.enemyMgr.damage(victim, 99999, null, 'u1'); run(120);
ok(poi.cleared === true, 'killing a keeper marks the crypt fought-over');
const left = guards(poi).length;
at(poi.x + 900, poi.z); run(60);
at(poi.x + 20, poi.z); run(30);
ok(guards(poi).length === 0, `a cleared crypt is never restocked behind you (had ${left} left)`);

// 6 — claimed POIs are skipped
const poi2 = w.pois.find(p => p.type === 'crypt' && p.id !== poi.id);
poi2.claimed = true;
at(poi2.x, poi2.z); run(30);
ok(guards(poi2).length === 0, 'an already-claimed crypt is not re-manned');

// 7 — unguarded types ignored
const shrine = w.pois.find(p => p.type === 'shrine');
if (shrine) { at(shrine.x, shrine.z); run(30);
  ok(guards(shrine).length === 0, 'shrines get no garrison'); }

// 8 — cost
const t0 = process.hrtime.bigint();
at(poi.x + 20, poi.z); run(150);
const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 150;
ok(ms < 3, `tick still cheap with a manned crypt (${ms.toFixed(2)} ms/tick)`);
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
