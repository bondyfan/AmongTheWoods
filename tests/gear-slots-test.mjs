// ==========================================================================
// Q / R / F ARE THE ITEM KEYS — regression test.
//
// 1-9 hold class abilities; Q, R and F take weapons, tools and consumables as
// well. Nothing on the bar said so, and "drag something and see whether it
// sticks" is a poor way to learn a rule. They are now split off by a gap and a
// divider, and framed in a warmer colour.
//
// Run: node tests/gear-slots-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';
import { WEAPON_RING_SLOT, SLOT_KEYS, MAX_SPELL_SLOTS } from '../js/config.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const ui = readFileSync('js/ui.js', 'utf8');
const css = readFileSync('css/style.css', 'utf8');

console.log('\n-- the item keys are exactly Q, R and F --');
{
  const gear = [];
  for (let i = 0; i < MAX_SPELL_SLOTS; i++) if (i >= WEAPON_RING_SLOT) gear.push(SLOT_KEYS[i]);
  ok(gear.join('') === 'QRF', `they are ${gear.join('/')}`);
  ok(/el\.toggleAttribute\('data-gear', i >= WEAPON_RING_SLOT\)/.test(ui),
    'and the bar marks them with data-gear');
}

console.log('\n-- and they LOOK different from the ability keys --');
ok(/#spellbar \.spell-slot\[data-gear\] \{[^}]*border-color/.test(css), 'a warmer frame');
ok(/#spellbar \.spell-slot\[data-gear\] \.spell-key \{[^}]*color/.test(css), 'and a warmer key label');

console.log('\n-- with a real break between the two groups --');
{
  ok(/#spellbar \.spell-slot\[data-slot="9"\] \{ margin-left: 14px; \}/.test(css),
    'a gap before Q');
  ok(/#spellbar \.spell-slot\[data-slot="9"\]::before \{/.test(css), 'and a divider');
  // :first-of-type would match slot 1 — every slot is a div — and put the
  // divider at the far LEFT of the bar
  ok(!/\[data-gear\]:first-of-type/.test(css),
    'keyed on Q by index, not :first-of-type, which would have matched slot 1');
  ok(String(WEAPON_RING_SLOT) === '9',
    'and 9 really is Q, so the selector points at the right slot');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
