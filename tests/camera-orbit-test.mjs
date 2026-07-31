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

console.log('\n-- DRAGGING to look does not turn the character --');
{
  // Just the drag branch. Slicing as far as rpgPitch also swallowed the rpgFlip
  // block, which turns the character on PURPOSE after backing up on S — that is
  // a deliberate turn, not a look.
  const blk = main.slice(main.indexOf('if (drag.x && !player.dead) {'));
  const body = blk.slice(0, blk.indexOf('\n    }\n') + 7);
  ok(/if \(input\.locked\) \{/.test(body),
    'the two gestures are told apart by the pointer lock');
  const [locked, dragged] = body.split('} else {');
  ok(/camOrbit -= drag\.x/.test(dragged), 'a visible-cursor drag moves camOrbit');
  ok(!/player\.facing\.set/.test(dragged),
    'and does NOT touch player.facing — you keep running where you were');
  ok(/camOrbitHold = CAM_ORBIT_HOLD/.test(dragged), 'and arms the settle timer');

  // ...but MOUSE-LOOK, with the cursor hidden, must steer. Folding both into
  // camOrbit left the character unable to turn at all without the keyboard.
  ok(/player\.facing\.set\(Math\.sin\(yaw\), 0, Math\.cos\(yaw\)\)/.test(locked),
    'a locked-pointer move turns the CHARACTER');
  ok(/Math\.atan2\(player\.facing\.x, player\.facing\.z\) - drag\.x \* 0\.0045/.test(locked),
    'the same rate and direction the old mouse-look had');
  ok(!/camOrbit/.test(locked),
    'and leaves the orbit alone, so the camera does not drift back mid-turn');
}

console.log('\n-- the right-button swing pivots on the CHARACTER --');
{
  // The aim point used to sit 2 m along player.facing. Swinging the camera then
  // orbited a point in FRONT of the character, so they slid across the screen.
  // Along camF instead, camera and target share one axis through the character.
  ok(/camera\.lookAt\(player\.pos\.x \+ camFx \* 2, py \+ 1\.7, player\.pos\.z \+ camFz \* 2\)/.test(main),
    'the aim point follows the camera heading, not the facing');
  ok(!/camera\.lookAt\(player\.pos\.x \+ player\.facing\.x \* 2/.test(main),
    'the off-centre pivot is gone');

  // The character must land on the view axis for every orbit angle — that IS
  // "the pivot is the character", stated as geometry rather than as a string.
  let worst = 0;
  for (let yaw = -3; yaw <= 3; yaw += 0.25) {
    for (const orbit of [-1.2, -0.4, 0, 0.4, 1.2]) {
      const camA = yaw + orbit, flat = 4.6;
      const camFx = Math.sin(camA), camFz = Math.cos(camA);
      // player at the origin; camera back along camF, aim 2 m forward along it
      const cx = -camFx * flat, cz = -camFz * flat;
      const ax = camFx * 2, az = camFz * 2;
      // distance from the character (0,0) to the camera->aim line
      const vx = ax - cx, vz = az - cz;
      const len = Math.hypot(vx, vz);
      worst = Math.max(worst, Math.abs((-cx) * vz - (-cz) * vx) / len);
    }
  }
  ok(worst < 1e-9, `the character is on the view axis at every angle (max off-axis ${worst.toExponential(1)})`);
}

console.log('\n-- and a REAL camera puts them dead centre while it swings --');
{
  // The geometry above, run through an actual THREE.PerspectiveCamera with the
  // real position/lookAt formulas — the character's projected x is what the
  // player literally sees slide across the screen.
  const THREE = await import('three');
  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 340);
  const px = 12, pz = -30, py = 4;          // character, somewhere off-origin
  const yaw = 0.7;                           // ...facing some way
  let worstNdc = 0, worstOld = 0;
  for (const orbit of [-1.4, -0.8, -0.3, 0, 0.3, 0.8, 1.4]) {
    for (const pitch of [-0.3, 0.15, 0.8]) {
      const dist = 6.2, flat = Math.cos(pitch) * dist;
      const camA = yaw + orbit;
      const camFx = Math.sin(camA), camFz = Math.cos(camA);
      cam.position.set(px - camFx * flat, py + 1.7 + Math.sin(pitch) * dist, pz - camFz * flat);
      const head = new THREE.Vector3(px, py + 1.7, pz);

      cam.lookAt(px + camFx * 2, py + 1.7, pz + camFz * 2);      // now
      cam.updateMatrixWorld(true);
      worstNdc = Math.max(worstNdc, Math.abs(head.clone().project(cam).x));

      cam.lookAt(px + Math.sin(yaw) * 2, py + 1.7, pz + Math.cos(yaw) * 2); // before
      cam.updateMatrixWorld(true);
      worstOld = Math.max(worstOld, Math.abs(head.clone().project(cam).x));
    }
  }
  ok(worstNdc < 1e-6,
    `the character never leaves screen centre (worst |ndc.x| ${worstNdc.toExponential(1)})`);
  // 0.29 NDC is a bit under a third of the half-width — roughly 220 px off
  // centre on a 1500 px window, which is exactly the slide being complained of.
  ok(worstOld > 0.2,
    `and the old aim point really did shove them off it (worst |ndc.x| ${worstOld.toFixed(2)})`);
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

console.log('\n-- and the click that takes it back does not also swing --');
{
  const down = input.slice(input.indexOf("window.addEventListener('mousedown'"),
    input.indexOf("window.addEventListener('mouseup'"));
  ok(/this\.rpgMode && this\.mouseLook && !this\.locked/.test(down),
    'a left press with mouse-look on but the pointer loose is the re-capture click');
  ok(/this\.swallowLeftUp = true;\s*\n\s*return;/.test(down),
    'it never reaches mouse.left / leftPressed, so nothing attacks');
  // The press alone is not enough: attacks are edge-tracked on RELEASE too
  // (hold-to-charge), so a live mouseup would still let the blow off.
  const up = input.slice(input.indexOf("window.addEventListener('mouseup'"),
    input.indexOf("window.addEventListener('contextmenu'"));
  ok(/if \(this\.swallowLeftUp\) \{ this\.swallowLeftUp = false; return; \}/.test(up),
    'and its release is swallowed with it — one press-release pair, exactly one');
  ok(up.indexOf('swallowLeftUp') < up.indexOf('this.leftReleased = true'),
    'checked BEFORE leftReleased is armed');
  ok(/this\.swallowLeftUp = false;/.test(
    input.slice(input.indexOf("window.addEventListener('blur'"), input.indexOf("window.addEventListener('mousemove'"))),
    'a blur mid-click clears it, or it would eat the NEXT click instead');

  // The second click has the pointer locked, so it falls through to the
  // ordinary attack path — that is the whole point of the rule.
  const simulate = (locked) => {
    const i = { rpgMode: true, mouseLook: true, locked, swallowLeftUp: false,
      mouse: { left: false }, leftPressed: false, leftReleased: false };
    if (i.rpgMode && i.mouseLook && !i.locked) i.swallowLeftUp = true;
    else { i.mouse.left = true; i.leftPressed = true; }
    if (i.swallowLeftUp) i.swallowLeftUp = false;
    else if (i.mouse.left) { i.leftReleased = true; i.mouse.left = false; }
    return i;
  };
  const first = simulate(false), second = simulate(true);
  ok(!first.leftPressed && !first.leftReleased, 'first click: no press, no release');
  ok(!first.swallowLeftUp, 'and it leaves no flag behind');
  ok(second.leftPressed && second.leftReleased, 'second click: a normal attack');
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
