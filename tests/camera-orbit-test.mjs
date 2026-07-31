// ==========================================================================
// LOOK WITHOUT TURNING — regression test.
//
// Dragging to look used to rotate player.facing, and the chase camera sits
// directly behind that — so looking around turned the character. You could not
// run one way and look another, on either desktop or phone.
//
// The camera now carries its own yaw OFFSET from the facing. Drag moves the
// offset; a couple of seconds after you let go it eases back to zero and the
// camera settles behind you again.
//
// Run: node tests/camera-orbit-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const main = readFileSync('js/main.js', 'utf8');
const input = readFileSync('js/input.js', 'utf8');
const touch = readFileSync('js/touch.js', 'utf8');

console.log('\n-- looking no longer turns the character --');
{
  // Just the drag branch. Slicing as far as rpgPitch also swallowed the rpgFlip
  // block, which turns the character on PURPOSE after backing up on S — that is
  // a deliberate turn, not a look.
  const blk = main.slice(main.indexOf('if (drag.x && !player.dead) {'));
  const body = blk.slice(0, blk.indexOf('\n    }') + 6);
  ok(/camOrbit -= drag\.x/.test(body), 'the drag moves camOrbit');
  ok(!/player\.facing\.set/.test(body),
    'and does NOT touch player.facing — that was the whole bug');
  ok(/camOrbitHold = CAM_ORBIT_HOLD/.test(body), 'and arms the settle timer');
}

console.log('\n-- the camera reads facing PLUS the offset --');
ok(/const camA = Math\.atan2\(player\.facing\.x, player\.facing\.z\) \+ camOrbit;/.test(main),
  'the camera heading is the sum of the two');
ok(/const tx = player\.pos\.x - camFx \* flat;/.test(main),
  'and the camera position follows that heading, not the raw facing');

console.log('\n-- it settles back behind you, smoothly --');
{
  ok(/if \(camOrbitHold > 0\) camOrbitHold -= dt;/.test(main), 'a hold before it moves');
  ok(/camOrbit \+= \(0 - camOrbit\) \* Math\.min\(1, dt \* 2\.2\)/.test(main),
    'then eases toward 0 rather than snapping');
  ok(/if \(Math\.abs\(camOrbit\) < 0\.003\) camOrbit = 0;/.test(main),
    'and lands exactly on 0 instead of creeping forever');
  // Run the real ease and check the WHOLE curve in one assertion: it must
  // converge to exactly 0, never overshoot past it, and hold still for the
  // first 2.5 s so a pause mid-look doesn't yank the camera away.
  let o = 1.2, hold = 2.5, dt = 1 / 60, t = 0, overshoot = false, movedEarly = false;
  while (t < 12) {
    if (hold > 0) { hold -= dt; if (o !== 1.2) movedEarly = true; }
    else { o += (0 - o) * Math.min(1, dt * 2.2); if (Math.abs(o) < 0.003) o = 0; }
    if (o < -1e-9) overshoot = true;
    t += dt;
  }
  ok(!movedEarly, 'it holds still for the full 2.5 s before easing');
  ok(!overshoot, 'and never swings past centre on the way back');
  ok(o === 0, `a 1.2 rad swing lands exactly on 0 within 12 s (${o})`);
}

console.log('\n-- and the phone goes through the very same path --');
ok(/input\.dragX \+= dx;/.test(touch),
  'touch look feeds input.dragX, so one fix covers both');

console.log('\n-- right-button hands the cursor back --');
ok(/if \(document\.pointerLockElement\) document\.exitPointerLock\?\.\(\);/.test(input),
  'right mousedown exits pointer lock');
{
  const blk = input.slice(input.indexOf('if (e.button === 2)'));
  ok(/this\.mouse\.right = true;/.test(blk.slice(0, 300)),
    'and still starts the look drag — one gesture does both');
}

console.log('\n-- the hint appears only while it is TRUE --');
{
  const fn = main.slice(main.indexOf('function tickLookHint'), main.indexOf('let camYaw'));
  ok(/document\.pointerLockElement/.test(fn), 'only while the cursor is actually hidden');
  ok(/game\.mode === 'play'/.test(fn) && /!game\.paused/.test(fn), 'only while playing');
  ok(/lookHintT < 3/.test(fn), 'and only after 3 s, so it never interrupts');
  ok(/localStorage\.setItem\(LOOK_HINT_KEY/.test(fn), 'retired once used');
  ok(/!document\.pointerLockElement && lookHintT > 3/.test(fn),
    'and USING it is what retires it — not merely seeing it');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
