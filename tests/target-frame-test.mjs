// ==========================================================================
// TARGET FRAME auto-hide — regression test.
//
// The Shift-lock frame holds while the target still matters (it is swinging at
// you, you are duelling it, you are standing within 4 m, or Shift is down on
// it) and otherwise fades out after a 3 s grace period. Something you merely
// glanced at on the way past must not sit at the top of the screen for the
// rest of the run.
//
// Runs the REAL renderTargetFrame text lifted out of js/main.js against a DOM
// stub and a controlled clock, so it cannot drift from what ships. It caught
// the sentinel bug this was written with: `if (!tfIdleAt)` treated a legitimate
// performance.now() of 0 as "not idle yet" and disabled the countdown.
//
// Run: node tests/target-frame-test.mjs   (from the repo root)
// ==========================================================================
import { readFileSync } from 'node:fs';
const src = readFileSync('js/main.js', 'utf8');
const block = src.match(/const TF_KEEP_R[\s\S]*?\nfunction renderTargetFrame\(\) \{[\s\S]*?\n\}/)[0];

// a DOM stub just wide enough for the function under test
const mkEl = () => {
  const cls = new Set(['hidden']);
  return { style: {}, classList: {
      add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c),
      toggle: (c, on) => on ? cls.add(c) : cls.delete(c) },
    _cls: cls, querySelector: () => ({ style: {}, textContent: '', innerHTML: '' }) };
};

let T = 0;
const harness = new Function('el', 'state', `
  const performance = { now: () => state.T };
  const $id = () => el;
  const player = state.player, targeting = state.targeting, game = state.game;
  const mp = state.mp, ENEMY_TYPES = {}, mobLevelBadge = () => '';
  let stickyMob = state.stickyMob, socialTarget = state.socialTarget;
  ${block}
  return () => { stickyMob = state.stickyMob; socialTarget = state.socialTarget;
                 renderTargetFrame(); state.stickyMob = stickyMob; };
`);

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

function scenario(name, { aggroed, dist }) {
  const el = mkEl();
  const mob = { hp: 50, maxHp: 100, level: 3, type: 'wolf', aggroed,
                pos: { x: dist, y: 0, z: 0 } };
  const state = { T: 0, player: { pos: { x: 0, y: 0, z: 0 } },
    targeting: { selected: mob, selectedPlayer: null },
    game: { mode: 'play', paused: false }, mp: null,
    stickyMob: mob, socialTarget: null };
  const render = harness(el, state);
  render();                                   // Shift held: locked
  state.targeting.selected = null;            // Shift released
  const step = (ms) => { state.T += ms; render(); };
  const vis = () => !el._cls.has('hidden');
  const op = () => el.style.opacity;
  console.log(`\n${name}  (aggro=${aggroed}, ${dist} m)`);
  return { state, step, vis, op, el };
}

// 1 — idle and far: holds 3 s, fades, gone
{
  const s = scenario('idle wolf 10 m away', { aggroed: false, dist: 10 });
  s.step(0);    ok(s.vis() && s.op() === '1', 'visible and solid right after the lock');
  s.step(2900); ok(s.vis() && s.op() === '1', 'still fully solid at 2.9 s');
  s.step(350);  ok(s.vis() && +s.op() > 0 && +s.op() < 1, `fading at 3.25 s (opacity ${(+s.op()).toFixed(2)})`);
  s.step(400);  ok(!s.vis(), 'gone by 3.65 s');
  ok(s.state.stickyMob === null, 'and the remembered mob is dropped, so it cannot pop back');
}
// 2 — aggroed: never leaves
{
  const s = scenario('wolf chewing on you from 10 m', { aggroed: true, dist: 10 });
  s.step(3000); s.step(3000); s.step(6000);
  ok(s.vis() && s.op() === '1', 'still there after 12 s — aggro overrides the timer');
}
// 3 — within 4 m: never leaves
{
  const s = scenario('passive deer 3 m away', { aggroed: false, dist: 3 });
  s.step(6000);
  ok(s.vis() && s.op() === '1', 'still there after 6 s — you are standing next to it');
}
// 4 — the 4 m edge
{
  const s = scenario('exactly 4 m', { aggroed: false, dist: 4 });
  s.step(5000); ok(s.vis(), '4.0 m counts as close enough');
  const s2 = scenario('just past 4 m', { aggroed: false, dist: 4.2 });
  s2.step(0);                 // the frame the countdown starts on
  s2.step(5000); ok(!s2.vis(), '4.2 m does not');
}
// 5 — walking back inside 4 m before the fade cancels it
{
  const s = scenario('walk away, then back', { aggroed: false, dist: 10 });
  s.step(2500); ok(s.vis(), 'ticking down at 2.5 s');
  s.state.player.pos.x = 8;             // now 2 m from the wolf
  s.step(3000); ok(s.vis() && s.op() === '1', 'stepping back inside 4 m resets the countdown');
}
// 6 — aggro dropping mid-fight starts the timer
{
  const s = scenario('wolf loses interest', { aggroed: true, dist: 10 });
  s.step(5000); ok(s.vis(), 'held while aggroed');
  s.state.stickyMob.aggroed = false;
  s.step(0);                  // the frame aggro drops on
  s.step(2000); ok(s.vis(), 'grace period begins when aggro drops');
  s.step(2000); ok(!s.vis(), 'and it goes 3.5 s later');
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
