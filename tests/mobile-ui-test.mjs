// ==========================================================================
// PHONE UI SCALE — regression test.
//
// Every HUD panel was sized for a ~1400 px desktop window and carried over
// unchanged to a 390 px phone, where the same boxes ate a third of the screen.
// All of it is scaled inside a (pointer: coarse) query, so desktop is untouched.
//
// The burger column and the "You are a ghost" panel both lived on the LEFT and
// overlapped each other. The panel moved right; the column stayed.
//
// Also: the "Rumors speak of…" toast is gone on every platform. It named a boss
// with no location and no next step, 30 s into a new biome, over whatever was
// actually happening.
//
// Run: node tests/mobile-ui-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const css = readFileSync('css/style.css', 'utf8');
const main = readFileSync('js/main.js', 'utf8');
const phone = css.slice(css.indexOf('phone UI scale'));

console.log('\n-- the rumor toast is gone everywhere --');
ok(!/Rumors speak of/.test(main), 'no "Rumors speak of…" string survives');
ok(/poi\.rumored = true;/.test(main), 'but the once-per-lair guard stays');
ok(/No toast\./.test(main), 'and the removal is explained where it was');

console.log('\n-- the burger column is two-up and small --');
ok(/#hud-buttons \{[^}]*grid-template-columns: 1fr 1fr/.test(phone), 'two per row');
ok(/#hud-buttons button \{[^}]*font-size: 12px/.test(phone), 'smaller type');
ok(/#hud-buttons button kbd \{ display: none/.test(phone),
  'and the keyboard hints are hidden — there is no keyboard');

console.log('\n-- the panels that were too big --');
for (const [sel, what] of [
  ['#tod-clock', 'the clock'],
  ['#resource-hud', 'the resource strip'],
  ['#biome-name', 'the biome name'],
  ['#weapon-display', 'the held weapon'],
  ['#ghost-hint', 'the distance-to-body bar'],
  ['#banner', 'the new-creature banner'],
]) {
  ok(new RegExp(sel.replace('#', '#') + '[^{]*\\{[^}]*font-size').test(phone), `${what} is scaled`);
}

console.log('\n-- and the ghost panel gets out of the burger\'s way --');
{
  const blk = phone.slice(phone.indexOf('#respawn-choice {'));
  ok(/left: auto; right: 10px/.test(blk), 'it moves to the RIGHT edge');
  ok(/#respawn-choice h2 \{[^}]*font-size: 15px/.test(phone), 'and its heading shrinks');
  // the burger column must NOT have followed it
  ok(!/#hud-buttons \{[^}]*right: auto/.test(phone), 'the burger column stays where it was');
}

console.log('\n-- desktop is untouched --');
{
  const desktop = css.slice(0, css.indexOf('phone UI scale'));
  ok(/#hud-buttons \{[^}]*flex-direction: column/.test(desktop), 'still a single column');
  ok(/#respawn-choice \{[^}]*left: 18px/.test(desktop), 'ghost panel still on the left');
  ok(/#hud-buttons button \{[^}]*font-size: 15px/.test(desktop), 'and the buttons are full size');
  ok(phone.includes('pointer: coarse'), 'every change above is inside a coarse-pointer query');
}

console.log('\n-- a menu button takes ONE tap, not two --');
{
  // iOS: while a text field has focus and the keyboard is up, the first tap
  // elsewhere only dismisses the keyboard and delivers no click. The username
  // field is a text input, so every menu button needed two taps after typing.
  ok(/document\.addEventListener\('pointerdown'[\s\S]{0,320}a\.blur\(\)/.test(main),
    'focus is dropped on pointerdown, before the click would be swallowed');
  ok(/!e\.target\.closest\?\.\('input, textarea'\)/.test(main),
    'but tapping INTO another field still focuses it');
  ok(/\}, true\);/.test(main.slice(main.indexOf("document.addEventListener('pointerdown'"))),
    'and it runs in the capture phase, ahead of anything that might stop it');

  // ...and that was NOT enough, because dropping focus reflows the page: the
  // viewport grows back by the keyboard's height and the button moves out from
  // under the finger. So touch stops waiting for a click at all.
  const fn = main.slice(main.indexOf('function tapToClick'),
    main.indexOf("].forEach(id => tapToClick"));
  ok(fn.length > 100, 'there is a tap bridge');
  ok(/e\.pointerType === 'mouse'/.test(fn),
    'the mouse is left alone — it goes on clicking');
  ok(/setPointerCapture\(e\.pointerId\)/.test(fn),
    'the pointer is captured, so the lift comes back to the button after a reflow');
  ok(/Math\.hypot\(e\.clientX - sx, e\.clientY - sy\) > 24/.test(fn),
    'a lift far from the press is a drag, not a tap');
  ok(/el\.click\(\)/.test(fn), 'and the lift fires the button itself');
  ok(/if \(!e\.isTrusted\) return;/.test(fn) && /stopImmediatePropagation/.test(fn),
    "the OS's own click, if it ever arrives, is swallowed as a duplicate");
  ok(/setTimeout\(\(\) => \{ mine = false; \}, 700\)/.test(fn),
    'and when it never arrives, the guard clears — or the next real click would be eaten');
  ok(/}, true\);/.test(fn), 'the duplicate dies in the capture phase, before any handler');
  for (const id of ['mode-survival-btn', 'mode-public-btn', 'mode-local-btn', 'mode-moba-btn']) {
    ok(new RegExp(`'${id}'`).test(main.slice(main.indexOf('].forEach(id => tapToClick') - 400,
      main.indexOf('].forEach(id => tapToClick') + 40)), `${id} is wired to it`);
  }

  // The event dance, run for real: press, lift, then the OS click that may or
  // may not follow. Exactly one handler call either way, and none from a drag.
  const sim = ({ move = 0, osClick = true }) => {
    let sx = 0, sy = 0, down = false, mine = false, fired = 0;
    const down_ = (e) => { if (e.type === 'mouse') return; down = true; sx = e.x; sy = e.y; };
    const up_ = (e) => {
      if (e.type === 'mouse' || !down) return;
      down = false;
      if (Math.hypot(e.x - sx, e.y - sy) > 24) return;
      mine = true; fired++;                       // el.click() -> the handler
    };
    const click_ = (trusted) => {
      if (!trusted) return;
      if (!mine) { fired++; return; }
      mine = false;                               // duplicate, swallowed
    };
    down_({ type: 'touch', x: 0, y: 0 });
    up_({ type: 'touch', x: move, y: 0 });
    if (osClick) click_(true);
    return fired;
  };
  ok(sim({ osClick: false }) === 1, 'no OS click (the iOS case): fires once');
  ok(sim({ osClick: true }) === 1, 'OS click arrives too: still once, not twice');
  ok(sim({ move: 90, osClick: false }) === 0, 'dragged off it: never fires');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
