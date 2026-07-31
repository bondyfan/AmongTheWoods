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

console.log('\n-- and the ring refuses what you could not equip --');
{
  const { readFileSync } = await import('node:fs');
  const main = readFileSync('js/main.js', 'utf8');
  const blk = main.slice(main.indexOf('Q is the weapon ring'), main.indexOf('const ring = weaponRing()'));
  // The ring cycles by EQUIPPING the next entry, so anything that refuses to
  // equip stalls the cycle and Q just appears to stop working.
  ok(/requiredClassForItem\(it\)/.test(blk), 'a class-locked weapon is turned away');
  ok(/wieldError\(player\.selectedClass, it\)/.test(blk),
    'so is one this class may not wield — a mage cannot ring a sword');
  ok(/\(it\.level \|\| 0\) > player\.level/.test(blk), 'and one above your level');
  ok(/the ring would stall on it/.test(blk),
    'and it says WHY, rather than just refusing');
  ok(/game\.kind === 'survival'/.test(blk),
    'checked only where class rules apply — the MOBA has its own loadout');
}

console.log('\n-- the fan is actually VISIBLE, not just present --');
{
  const { readFileSync } = await import('node:fs');
  const css = readFileSync('css/style.css', 'utf8');
  const ui = readFileSync('js/ui.js', 'utf8');

  // Three separate things each made the fan invisible while the DOM said it was
  // there, display:flex and all. Every one of them is asserted here because
  // "the element exists" was exactly the check that kept passing.

  // 1. .spell-slot is overflow:hidden and the fan is an absolutely positioned
  //    CHILD sitting ABOVE it — so the whole fan was clipped to the 52x52 box.
  ok(/\.spell-slot\[data-slot="9"\][^{]*\{[^}]*overflow:\s*visible/.test(css),
    'Q stops clipping, or the fan is cut off at the slot border');
  ok(/\.spell-slot\s*\{[^}]*overflow:\s*hidden/.test(css),
    '(the other slots still clip their cooldown sweep)');

  // 2. the caption needs flex-basis:100%, which makes the row width
  //    self-referential — the fan collapsed to one cell wide, five cells tall.
  ok(/\.ring-fan\s*\{[^}]*width:\s*226px/.test(css),
    'the fan states its width, so the caption cannot collapse the row');

  // 3. the tooltip is z-index 500 against the fan's 40, and flips ABOVE the
  //    cursor near the bottom edge — landing straight on top of the fan.
  ok(/_tipHtml\s*=\s*''/.test(ui), 'Q carries no tooltip to cover its own fan');

  ok(/pointerenter/.test(ui) && /setAttribute\('data-fan'/.test(ui),
    'and hover is driven by pointer events, not by :hover alone');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
