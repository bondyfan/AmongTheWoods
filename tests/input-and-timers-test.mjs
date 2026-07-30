// ==========================================================================
// INPUT BINDINGS + GAMEPLAY TIMERS — regression test.
//
// THE BUG, as reported twice: "he still can't attack." It was never the
// animation. `this.attackT -= dt` — the SWING COOLDOWN, which update() gates the
// next attack on with `attackT <= 0` — lived inside _animate's box-man branch.
// The rigged avatar's branch returns early, so the cooldown never ticked down:
// one swing set it to 0.3 and it stayed there forever. Attack exactly once, then
// never again, with no error and no clue.
//
// The lesson generalises past this one line: an animation function must not own
// a gameplay timer, because there is more than one animation path and only one
// of them runs. That is the invariant checked here.
//
// Also covers the rebinding: Space is JUMP now, hold-to-attack moved to Cmd
// (Mac) / Alt (Windows), driven through the real Input class with a stubbed
// window rather than by reading the source.
//
// Run: node tests/input-and-timers-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

// ---- source invariant: no gameplay timer decrement inside _animate --------
console.log('\n-- an animation function must not own a gameplay timer --');
{
  const src = readFileSync('js/player.js', 'utf8').split('\n');
  const start = src.findIndex(l => /^  _animate\(dt, moving\)/.test(l));
  ok(start > 0, `found _animate at line ${start + 1}`);
  let end = src.length;
  for (let i = start + 1; i < src.length; i++) {
    if (/^  [_a-zA-Z][a-zA-Z0-9_]*\(/.test(src[i])) { end = i; break; }
  }
  // `this.fooT -= dt` or `this.fooT = Math.max(0, this.fooT - dt)`
  const decl = /this\.(\w*T)\s*-=\s*dt|this\.(\w*T)\s*=\s*Math\.max\(\s*0\s*,\s*this\.\2\s*-\s*dt/;
  const hits = [];
  for (let i = start; i < end; i++) {
    const line = src[i].replace(/\/\/.*$/, '');
    if (decl.test(line)) hits.push(`${i + 1}: ${line.trim()}`);
  }
  ok(hits.length === 0,
    `_animate (lines ${start + 1}-${end}) decrements no timer` +
    (hits.length ? ` — ${hits.join(' | ')}` : ''));
}

console.log('-- and the swing cooldown ticks in update(), where it belongs --');
{
  const src = readFileSync('js/player.js', 'utf8');
  ok(/this\.attackT = Math\.max\(0, this\.attackT - dt\);/.test(src),
    'attackT is decremented once, unconditionally');
  const n = (src.match(/this\.attackT\s*(-=|= Math\.max\(0, this\.attackT -)/g) ?? []).length;
  ok(n === 1, `exactly one place decrements it (${n}) — two would double-tick the cooldown`);
}

// ---- the real Input class, driven by synthetic key events -----------------
console.log('\n-- Space is JUMP, and hold-to-attack is Cmd / Alt --');
const handlers = {};
globalThis.window = {
  addEventListener: (t, fn) => { (handlers[t] ??= []).push(fn); },
  removeEventListener: () => {},
};
globalThis.document = { addEventListener: () => {}, removeEventListener: () => {}, body: {} };
const { input } = await import('../js/input.js');
const fire = (type, ev) => (handlers[type] ?? []).forEach(fn => fn({
  preventDefault() {}, repeat: false, target: { tagName: 'BODY' }, ...ev }));
const down = (code, extra) => fire('keydown', { code, ...extra });
const up = (code) => fire('keyup', { code });

down('Space');
ok(input.attackHeld === false, 'holding Space does NOT attack any more');
ok(input.takeJump() === true, 'Space raises a jump');
ok(input.takeJump() === false, 'and it is consumed — one press, one jump');
up('Space');

down('Space'); down('Space');           // repeat=false both times
ok(input.takeJump() === true, 'a second press jumps again');
up('Space');

// a HELD space must not pogo: the browser sends repeat=true, which is ignored
input.takeJump();
fire('keydown', { code: 'Space', repeat: true });
ok(input.takeJump() === false, 'auto-repeat while held does not pogo');

down('MetaLeft');
ok(input.attackHeld === true, 'Cmd holds the attack (macOS)');
up('MetaLeft');
ok(input.attackHeld === false, 'and releasing it stops');

down('AltLeft');
ok(input.attackHeld === true, 'Alt holds the attack (Windows)');
up('AltLeft');

console.log('\n-- releasing Cmd clears stuck movement keys --');
{
  // macOS suppresses keyup for every other key while Cmd is held, so W would
  // stay "down" forever after a Cmd-attack while running.
  down('KeyW'); down('MetaLeft');
  ok(input.moveZ === -1, 'W is held while Cmd goes down');
  up('MetaLeft');                        // no keyup for W ever arrives — as on macOS
  ok(input.moveZ === 0, 'releasing Cmd clears the stuck W');
}

console.log('\n-- typing in a text field still types --');
{
  const before = input.takeJump();
  fire('keydown', { code: 'Space', target: { tagName: 'INPUT' } });
  ok(input.takeJump() === false, 'Space in an <input> does not jump');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
