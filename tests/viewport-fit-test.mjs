// ==========================================================================
// VIEWPORT FIT — regression test.
//
// On a phone, turning to landscape left the game filling half the screen; you
// had to flip back and forth to fix it. iOS Safari fires `resize` BEFORE
// innerWidth/innerHeight settle during an orientation change, so a single
// listener sized the canvas to the PRE-rotation width. The second flip only
// "fixed" it because that reading happened to arrive after the values were
// correct — pure luck, which is why it was intermittent.
//
// Run: node tests/viewport-fit-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const main = readFileSync('js/main.js', 'utf8');

console.log('\n-- every signal that a viewport moved is listened to --');
ok(/window\.addEventListener\('resize', \(\) => fitToView\(\)\)/.test(main), 'resize');
ok(/window\.addEventListener\('orientationchange', fitSoon\)/.test(main), 'orientationchange');
ok(/window\.visualViewport\?\.addEventListener\('resize'/.test(main), 'visualViewport resize');
ok(/matchMedia\?\.\('\(orientation: portrait\)'\)/.test(main), 'the orientation media query');
ok(/new ResizeObserver\(\(\) => fitToView\(\)\)/.test(main),
  'and a ResizeObserver — the element box is the truth when the events lie');

console.log('\n-- a flip re-checks, because the right size can arrive late --');
{
  const fn = main.slice(main.indexOf('function fitSoon'), main.indexOf('window.addEventListener(\'resize\''));
  const delays = (fn.match(/\[([^\]]+)\]/) ?? [])[1] ?? '';
  const n = delays.split(',').length;
  ok(n >= 4, `it re-fits ${n} times over the following second (${delays})`);
  ok(/requestAnimationFrame/.test(fn), 'and once on the next frame');
}

console.log('\n-- but it does no work when nothing changed --');
{
  const fn = main.slice(main.indexOf('function fitToView'), main.indexOf('function fitSoon'));
  ok(/if \(!force && w === _fitW && h === _fitH\) return;/.test(fn),
    'identical dimensions are a no-op, so six timers cost nothing');
  ok(/if \(!w \|\| !h\) return;/.test(fn),
    'and a zero reading mid-rotation is discarded rather than applied');
  ok(/visualViewport\?\.width \?\? window\.innerWidth/.test(fn),
    'it prefers visualViewport, which is correct sooner than innerWidth');
}

console.log('\n-- and a pixelRatio change re-fits too --');
ok(/renderer\.setPixelRatio\(pr\);\s*\n\s*fitToView\(true\);/.test(main),
  'setPixelRatio alone would leave the drawing buffer at the old scale');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
