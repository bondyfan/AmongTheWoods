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

console.log('\n-- the bar folds to 1-5 and Q while empty --');
ok(/const optional = i > 4 && i !== WEAPON_RING_SLOT;/.test(ui),
  'slots past 5 are optional — Q never is');
ok(/el\.toggleAttribute\('data-optional', optional\)/.test(ui), 'and they are marked');
ok(/el\.toggleAttribute\('data-empty', !filled\)/.test(ui), 'along with whether they hold anything');
ok(/#spellbar \.spell-slot\[data-optional\]\[data-empty\] \{ display: none; \}/.test(css),
  'optional AND empty is hidden');
{
  // a filled slot must never fold away, whatever its index
  const m = ui.match(/const filled = ([^;]+);/);
  ok(!!m && /Array\.isArray\(raw\) \? raw\.length > 0 : raw != null/.test(m[1]),
    'filled counts an empty ARRAY as empty too — Q holds a list, not a value');
}

console.log('\n-- and every one comes back the moment you drag --');
ok(/body\.slotting #spellbar \.spell-slot\[data-optional\]\[data-empty\]/.test(css),
  'body.slotting reveals them');
{
  const blk = css.slice(css.indexOf('body.slotting #spellbar .spell-slot[data-optional]'));
  ok(/display: flex/.test(blk.slice(0, 160)), 'as real, droppable targets');
}
ok(/cell\.kind === 'item' \|\| cell\.kind === 'consumable'[\s\S]{0,120}classList\.add\('slotting'\)/.test(panels),
  'and EVERY slottable drag sets it — not just gear');

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

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
