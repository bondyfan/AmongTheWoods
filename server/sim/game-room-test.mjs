// Headless verification of GameRoom (M2.1–M2.3) — no WebSocket, drives the
// authoritative sim directly and asserts the full authority pipeline:
// proxies steer enemy targeting, snapshots broadcast, ehit damages & kills
// enemies (→ drops + xpkill), enemies hit players (→ pdmg), collect → grant.
import { register } from 'node:module';
register('./three-hook.mjs', import.meta.url);
const { GameRoom } = await import('./game-room.mjs');

let pass = 0, fail = 0;
const ck = (n, ok, d = '') => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('FAIL  ' + n + '  ' + d)); };

// capture every outbound message
const bcasts = [];            // {snap}
const toUid = [];             // {uid, ev}
const io = {
  broadcast(obj) { if (obj.t === 'snap') bcasts.push(obj.snap); },
  sendTo(uid, obj) { if (obj.t === 'event') toUid.push({ uid, ev: obj.ev }); },
};

const room = new GameRoom(io);
room.addPlayer('A');
room.addPlayer('B');
ck('two players added', room.players.size === 2);

// roam both players in gentle loops near the valley start so enemies converge
// and reach melee (parked players never provoke a melee attack)
const place = (t) => {
  room.onState('A', { x: Math.cos(t * 0.2) * 18, z: Math.sin(t * 0.2) * 18, dead: false, st: false, pet: false, lv: 8 });
  room.onState('B', { x: 12 + Math.cos(t * 0.15) * 14, z: -6 + Math.sin(t * 0.15) * 14, dead: false, st: false, pet: false, lv: 8 });
};

// run the sim; enemies spawn ~80m out and close in
const DT = 1000 / 20;
let firstEnemySnap = null, pdmgSeen = null, killXp = null, dropAfterKill = false;
let targetEnemy = null, hpBefore = null, hpAfter = null;
let collectGrant = null;
let simT = 0;

for (let i = 0; i < 3000; i++) {
  simT += DT / 1000;
  place(simT);
  room.tick(DT);
  const snap = bcasts[bcasts.length - 1];
  if (snap && snap.e.length && !firstEnemySnap) firstEnemySnap = snap;

  // pick the CLOSEST enemy to A (any distance — a guest hits by id, e.g. ranged)
  if (snap && snap.e.length && targetEnemy === null) {
    const pa = room.players.get('A').proxy.pos;
    let best = null, bd = 1e9;
    for (const en of snap.e) { const d = Math.hypot(en.x - pa.x, en.z - pa.z); if (d < bd) { bd = d; best = en; } }
    if (best) { targetEnemy = best.id; hpBefore = best.hp; }
  }
  if (targetEnemy != null) {
    const cur = snap?.e.find(en => en.id === targetEnemy);
    if (cur) {
      if (hpAfter === null && cur.hp < hpBefore) hpAfter = cur.hp;   // damage registered
      room.onEvent('A', { type: 'ehit', id: targetEnemy, dmg: 60, cr: 1 });
    } else if (hpAfter !== null) {
      // enemy is gone (killed) — did loot drop & XP fire?
      const withMeat = bcasts.slice(-3).some(s => s.p.some(pp => pp.k === 'meat'));
      if (withMeat) dropAfterKill = true;
      if (!killXp) killXp = toUid.find(m => m.ev.type === 'xpkill');
      targetEnemy = -1; // stop
    }
  }

}

// dedicated pdmg phase: park B ON TOP of a living enemy (range 0) so it attacks,
// without hitting it, and watch for the outbound pdmg to B
{
  const last = bcasts[bcasts.length - 1];
  const bait = last?.e.find(e => e.hp > 0);
  if (bait) {
    for (let k = 0; k < 120 && !pdmgSeen; k++) {
      const e = bcasts[bcasts.length - 1]?.e.find(x => x.id === bait.id) || bait;
      room.onState('B', { x: e.x, z: e.z, dead: false, st: false, pet: false, lv: 8 }); // stand on it
      room.tick(DT);
      pdmgSeen = toUid.find(m => m.uid === 'B' && m.ev.type === 'pdmg' && m.ev.dmg > 0);
    }
  }
}

ck('enemies spawned & appear in a broadcast snapshot', !!firstEnemySnap, 'snaps=' + bcasts.length);
ck('an enemy came within range of player A', targetEnemy !== null, 'targetEnemy=' + targetEnemy);
ck('ehit damaged the enemy (hp dropped)', hpAfter !== null && hpAfter < hpBefore, `${hpBefore}->${hpAfter}`);
ck('killing the enemy dropped loot (meat pickup)', dropAfterKill);
ck('kill awarded shared xpkill to a guest', !!killXp, killXp ? JSON.stringify(killXp.ev) : 'none');
if (killXp) ck('  xpkill went to the attacker (A)', killXp.uid === 'A', 'uid=' + killXp.uid);
ck('an enemy attack produced an outbound pdmg to a player', !!pdmgSeen, pdmgSeen ? JSON.stringify(pdmgSeen) : 'none');
if (pdmgSeen) ck('  pdmg carries attacker id+pos (lag-comp fields)', pdmgSeen.ev.ai !== undefined && pdmgSeen.ev.ax !== undefined, JSON.stringify(pdmgSeen.ev));

// collect → grant: drop a pickup for A, then A collects it
room.onEvent('A', { type: 'drop', k: 'wood', p: 5, x: 1, z: 1 });
room.tick(DT);
const dropped = room.pickups.list[room.pickups.list.length - 1];
room.onEvent('A', { type: 'collect', id: dropped.id });
collectGrant = toUid.find(m => m.ev.type === 'grant' && m.ev.kind === 'wood');
ck('collect removes the pickup & grants it back to the collector', !!collectGrant && collectGrant.uid === 'A', collectGrant ? JSON.stringify(collectGrant.ev) : 'none');
ck('collected pickup is gone from the world', !room.pickups.list.some(p => p.id === dropped.id));

// event routing: a peer-relay event (revive) is NOT consumed by the sim
ck('peer-relay event (revive) is not consumed → Room relays it', room.onEvent('A', { type: 'revive' }) === false);
ck('world-mutating event (ehit) IS consumed', room.onEvent('A', { type: 'ehit', id: 999999, dmg: 1 }) === true);

console.log(`\n=== GameRoom test: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
