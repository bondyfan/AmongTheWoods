// ==========================================================================
// FORCED LANDSCAPE — coordinate test.
//
// A portrait phone is DRAWN sideways rather than shown a "please rotate"
// message. That is one CSS rule, and it would be free except that a transform
// moves PIXELS, not POINTER EVENTS: clientX/clientY keep arriving in the
// untransformed viewport frame. Left uncompensated, mouse aim transposes and a
// drag up the physical screen steers sideways.
//
// So the inverse mapping has to be exactly right, and "exactly" is testable:
// round-trip every corner through the forward CSS transform and back.
//
// Run: node tests/orient-test.mjs
// ==========================================================================
const W = 390, H = 844;                     // a portrait phone
globalThis.window = { innerWidth: W, innerHeight: H, addEventListener() {} };
let PORTRAIT = true;
globalThis.matchMedia = () => ({ get matches() { return PORTRAIT; }, addEventListener() {} });
const o = await import('../js/orient.js');

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

console.log('\n-- sideways, the render surface has its axes swapped --');
ok(o.rotated() === true, 'a portrait phone counts as rotated');
ok(o.viewW() === H && o.viewH() === W, `surface is ${o.viewW()}x${o.viewH()}, not ${W}x${H}`);

console.log('\n-- and the pointer mapping is the exact inverse of the CSS --');
{
  // the CSS is rotate(90deg) about top-left then translateY(-100vh), i.e.
  //   screenX = innerWidth - viewY,  screenY = viewX
  let worst = 0;
  for (const [vx, vy] of [[0, 0], [H - 1, 0], [0, W - 1], [H - 1, W - 1], [400, 200], [123, 45]]) {
    const sx = W - vy, sy = vx;
    worst = Math.max(worst, Math.abs(o.toViewX(sx, sy) - vx), Math.abs(o.toViewY(sx, sy) - vy));
  }
  ok(worst === 0, `every corner round-trips exactly (worst error ${worst})`);
}

console.log('\n-- drags rotate too, and keep their sign --');
{
  // with the game's top edge on the phone's right, dragging DOWN the physical
  // screen is dragging RIGHT in the game
  ok(o.toViewDX(0, 10) === 10 && o.toViewDY(0, 10) === 0, 'screen-down reads as game-right');
  ok(o.toViewDX(10, 0) === 0 && o.toViewDY(10, 0) === -10, 'screen-right reads as game-up');
  // a sign slip here is worse than no rotation at all: movement would invert
  // rather than merely transpose, which feels broken instead of odd
  ok(o.toViewDY(10, 0) < 0, 'the sign is carried, not dropped');
}

console.log('\n-- upright, everything is a pass-through --');
{
  PORTRAIT = false;
  ok(o.rotated() === false, 'landscape (or any fine pointer) is not rotated');
  ok(o.viewW() === W && o.viewH() === H, 'the surface is just the viewport');
  ok(o.toViewX(37, 91) === 37 && o.toViewY(37, 91) === 91, 'coords pass straight through');
  ok(o.toViewDX(5, -8) === 5 && o.toViewDY(5, -8) === -8, 'and so do deltas');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
