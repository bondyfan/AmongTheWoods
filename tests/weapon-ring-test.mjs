// ==========================================================================
// WEAPON RING placement — regression test.
//
// Q holds up to five weapons behind one key, and until now you could only ever
// APPEND to it: no way to see what sat in position 3, swap two around, or drop
// one. The bar now fans Q out into its five places, which means a drop can name
// a position — and the rules for that are fiddlier than they look:
//
//   * dropping a weapon that is ALREADY on the ring is a MOVE, not a copy
//   * the ring must stay gap-free, or Q cycles through holes
//   * and it must never exceed WEAPON_RING_MAX
//
// Run: node tests/weapon-ring-test.mjs
// ==========================================================================
import { ringPlace, WEAPON_RING_MAX } from '../js/config.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const eq = (a, b, m) => ok(a.join() === b.join(), `${m}  [${a.join(', ') || '—'}]`);

console.log('\n-- no position given: append, as Q always did --');
eq(ringPlace([], 'axe', null), ['axe'], 'into an empty ring');
eq(ringPlace(['axe'], 'bow', null), ['axe', 'bow'], 'onto the end');
eq(ringPlace(['axe'], 'axe', null), ['axe'], 'the same weapon twice is refused');

console.log('\n-- a named position REPLACES what sat there --');
eq(ringPlace(['axe', 'bow', 'pick'], 'sword', 1), ['axe', 'sword', 'pick'],
  'dropping on place 2 swaps out the bow');
eq(ringPlace(['axe', 'bow'], 'sword', 0), ['sword', 'bow'], 'and on place 1');

console.log('\n-- dropping something already on the ring MOVES it --');
{
  const out = ringPlace(['axe', 'bow', 'pick'], 'pick', 0);
  eq(out, ['pick', 'bow', 'axe'], 'pick moves to the front and axe takes its place');
  ok(out.filter(w => w === 'pick').length === 1, 'it appears exactly once');
  ok(out.includes('axe'), 'and NOTHING is lost — rearranging must not cost a weapon');
}
eq(ringPlace(['axe', 'bow'], 'axe', 1), ['bow', 'axe'], 'a straight two-way swap');

console.log('\n-- the ring stays gap-free --');
{
  const out = ringPlace(['axe'], 'bow', 3);   // dropped past the end
  ok(out.every(Boolean), `no holes  [${out.join(', ')}]`);
  ok(out.includes('bow'), 'and the weapon still landed');
}

console.log('\n-- and never exceeds the cap --');
{
  const full = ['a', 'b', 'c', 'd', 'e'];
  ok(full.length === WEAPON_RING_MAX, `the cap is ${WEAPON_RING_MAX}`);
  eq(ringPlace(full, 'f', null), full, 'appending to a full ring is refused');
  const swapped = ringPlace(full, 'f', 2);
  eq(swapped, ['a', 'b', 'f', 'd', 'e'], 'but naming a place still replaces');
  ok(swapped.length <= WEAPON_RING_MAX, 'and the length holds');
}

console.log('\n-- junk in, sane out --');
eq(ringPlace(null, 'axe', null), ['axe'], 'a missing ring is an empty one');
eq(ringPlace([undefined, 'bow'], 'axe', 0), ['axe'], 'existing holes are cleaned out');
eq(ringPlace(['axe'], 'bow', 99), ['axe', 'bow'], 'an out-of-range place falls back to append');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
