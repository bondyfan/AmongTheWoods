// ==========================================================================
// ACTION BAR FOLD + Q FAN ON TOUCH — regression test.
//
// Twelve slots across the bottom is a wall of nothing when eleven are blank, so
// anything past 5 that is not Q hides while empty — and comes back the moment a
// drag starts, because a hidden slot you cannot drop into is worse than a blank
// one you can.
//
// And the Q ring's fan opened on :hover, which a phone does not have. The ring
// could be filled by dragging and then never emptied again. Tapping Q pins it.
//
// Run: node tests/actionbar-fold-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const css = readFileSync('css/style.css', 'utf8');
const ui = readFileSync('js/ui.js', 'utf8');
const panels = readFileSync('js/panels.js', 'utf8');

console.log('\n-- the fold is REVERTED: every slot stays visible --');
{
  // Dropping a weapon onto Q started putting the item on the ground instead,
  // and the fold was the change immediately before it: hiding slots changes the
  // bar's width, which moves every slot that remains. Q working matters more
  // than a tidy bar, so the CSS is gone.
  ok(!/\[data-optional\]\[data-empty\] \{ display: none/.test(css),
    'no rule hides an empty slot');
  ok(!/body\.slotting #spellbar \.spell-slot\[data-optional\]/.test(css),
    'and none reveals it either — the bar simply does not move');
  ok(/REVERTED/.test(css), 'and the reason is written where the rule was');
  // the marking is harmless and stays, so a second attempt has the hooks
  ok(/el\.toggleAttribute\('data-optional', optional\)/.test(ui),
    'ui.js still marks the slots — inert without a rule, ready if this is retried');
}

console.log('\n-- Q opens on a tap, because a phone has no hover --');
ok(/matchMedia\?\.\('\(pointer: coarse\)'\)\.matches/.test(ui),
  'the tap path is coarse-pointer only, so a mouse still uses hover');
ok(/slot\.toggleAttribute\('data-fan'\)/.test(ui), 'tapping Q pins the fan open');
ok(/#spellbar \.spell-slot\[data-fan\] \.ring-fan \{ display: flex; \}/.test(css),
  'and the CSS honours it');
ok(/_slotClickSuppressUntil = performance\.now\(\) \+ 250/.test(ui),
  'the tap does not also fire the slot — that would swap your weapon');
{
  // the hover and drag paths must survive
  ok(/#spellbar \.spell-slot\[data-slot="9"\]:hover \.ring-fan/.test(css), 'hover still opens it');
  ok(/body\.slotting-weapon #spellbar \.spell-slot\[data-slot="9"\] \.ring-fan/.test(css),
    'and so does dragging a weapon');
}

console.log('\n-- and a near miss over the bar no longer drops the item on the floor --');
{
  const drop = panels.slice(panels.indexOf('const under = document.elementFromPoint'));
  ok(/under\?\.closest\?\.\('#actionbar'\)/.test(drop.slice(0, 1400)),
    'a release anywhere over the action bar is rescued');
  ok(/getBoundingClientRect/.test(drop.slice(0, 1400)),
    'by finding the slot whose box actually contains the point');
  ok(/bestD < 40/.test(drop.slice(0, 1400)),
    'within a sane radius, so a genuine drop elsewhere still reaches the ground');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
