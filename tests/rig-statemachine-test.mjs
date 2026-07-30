// ==========================================================================
// RIG STATE MACHINE — regression test for the bug that froze the hero.
//
// THE BUG, as reported: "when he swings, after that he can't attack any more."
// trigger() called fadeTo(name, …, once=true), and fadeTo only assigned `cur`
// for looping clips. So the swing faded the base OUT, `cur` still pointed at the
// (now weight-0) base, and when the one-shot expired setState asked for that
// same base again — fadeTo saw `a === cur` and returned early. Nothing faded
// back in, and the swing action, with clampWhenFinished, sat at the last frame
// at weight 1 forever. One swing and the hero locked in the follow-through.
//
// Same root cause as the second report, "when he walks it looks like a battle
// stance": a stuck swing pose blended over the walk. (The other half of that was
// mapping "holds a melee weapon" to Sword_Idle, which made a combat guard the
// resting pose essentially always. Also checked here.)
//
// Loads the real glTF and the real retargeted clips through GLTFLoader with a
// minimal DOM/fetch stub, builds a real avatar, and drives the real machine.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/rig-statemachine-test.mjs'); })"
// ==========================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---- the smallest DOM three's loaders will accept -------------------------
// GLTFLoader reaches for fetch (for .gltf/.bin/.glb) and, for textures, an
// Image via document. Textures are irrelevant to skeleton animation, so the
// stub hands back an object that never fires onload and nothing waits on it.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
// three's FileLoader builds a Request before fetching, and Node's real Request
// rejects a relative URL outright — so both have to be stubbed, not just fetch.
globalThis.Request = class { constructor(url, init = {}) { this.url = String(url); Object.assign(this, init); } };
globalThis.Headers = globalThis.Headers ?? class { get() { return null; } };
globalThis.fetch = async (req) => {
  const url = typeof req === 'string' ? req : req?.url ?? String(req);
  const path = ROOT + String(url).replace(/^\.?\//, '').replace(/^file:\/\//, '');
  const buf = readFileSync(path);
  return {
    ok: true, status: 200,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => buf.toString('utf8'),
    json: async () => JSON.parse(buf.toString('utf8')),
    headers: { get: () => null },
    // must be UNDEFINED, not null: three checks `response.body === undefined`
    // to pick its non-streaming path, and null slips past that into .getReader()
  };
};
// A fake <img> that reports itself loaded as soon as anything sets .src. Both
// the WebP capability probe and TextureLoader block on this, and a stub that
// never fires just hangs the whole glTF load. Pixels don't matter here — this
// test is about the skeleton — but the promises have to settle.
function fakeImage() {
  const img = { width: 1, height: 1, style: {}, _src: '', _l: [],
    setAttribute() {}, removeAttribute() {},
    addEventListener(t, fn) { if (t === 'load') img._l.push(fn); },
    removeEventListener() {}, getContext: () => null };
  Object.defineProperty(img, 'src', {
    get: () => img._src,
    set(v) { img._src = v; queueMicrotask(() => { img.onload?.(); img._l.forEach(f => f({ target: img })); }); },
  });
  return img;
}
globalThis.Image = function Image() { return fakeImage(); };
globalThis.document = { createElementNS: fakeImage, createElement: fakeImage };
globalThis.self = globalThis;
globalThis.createImageBitmap = undefined;

const THREE = await import('three');
const hm = await import('../js/humanmodel.js');

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

await hm.preloadHumanModel();
hm.setHumanModelOptIn(true);
console.log(`\nloaded: ready=${hm.humanReady()} clips=${hm.humanClipCount()} enabled=${hm.humanModelEnabled()}`);
if (!hm.humanClipCount()) { console.log('FAIL  no clips loaded — cannot test the machine'); process.exit(1); }

const body = hm.makeHumanMan();
hm.assertContract(body, 'rigged');
const rig = body.userData.rig;
const step = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) rig.update(dt); };

// Is this action actually posing the skeleton right now? Three subtleties:
//  * an AnimationAction reports weight 1 even if it has NEVER been played, so
//    the weight alone means nothing — hence the time > 0 check
//  * clampWhenFinished sets paused = true when a one-shot lands, so a held death
//    pose is contributing while isRunning() is false
const contrib = (a) => (a.enabled && (a.isRunning() || a.paused) && a.time > 0)
  ? a.getEffectiveWeight() : 0;
const live = () => [...rig.actions].filter(([, a]) => contrib(a) > 0.02)
  .map(([n, a]) => `${n}:${contrib(a).toFixed(2)}`);
const weight = (n) => { const a = rig.actions.get(n); return a ? contrib(a) : 0; };
const dominant = () => {
  let best = null, w = 0;
  for (const [n, a] of rig.actions) { const x = contrib(a); if (x > w) { w = x; best = n; } }
  return best;
};

console.log('\n-- it stands in an idle, not a T-pose --');
rig.setState({});
step(30);
ok(dominant() === 'Idle_Loop', `dominant clip is Idle_Loop (${dominant()})`);

console.log('\n-- walking is a WALK, not a weapon stance --');
rig.setState({ moving: true, speed: 2 });
step(30);
ok(dominant() === 'Walk_Loop', `dominant is Walk_Loop (${dominant()})`);
ok(weight('Sword_Idle') < 0.02, `Sword_Idle contributes nothing (${weight('Sword_Idle').toFixed(3)})`);
rig.setState({ moving: true, speed: 5 });   step(30);
ok(dominant() === 'Jog_Fwd_Loop', `5 m/s picks Jog_Fwd_Loop (${dominant()})`);
rig.setState({ moving: true, speed: 8 });   step(30);
ok(dominant() === 'Sprint_Loop', `8 m/s picks Sprint_Loop (${dominant()})`);

console.log('\n-- THE BUG: swing, then swing again --');
rig.setState({});
step(30);
ok(rig.trigger('Sword_Attack', 0.5), 'the swing fires');
step(6);
ok(dominant() === 'Sword_Attack', `swing takes over (${dominant()})`);
step(40);                                    // 0.66 s — past the 0.5 s swing
rig.setState({});
step(30);
ok(dominant() === 'Idle_Loop', `and it RETURNS to idle afterwards (${dominant()})`);
ok(weight('Sword_Attack') < 0.02,
  `the swing is not left clamped at weight 1 (${weight('Sword_Attack').toFixed(3)})`);
ok(rig.trigger('Sword_Attack', 0.5), 'a SECOND swing fires');
step(6);
ok(dominant() === 'Sword_Attack', `and lands (${dominant()})`);
step(40); rig.setState({}); step(30);
ok(dominant() === 'Idle_Loop', 'back to idle again');
for (let i = 0; i < 5; i++) { rig.trigger('Sword_Attack', 0.5); step(40); rig.setState({}); step(20); }
ok(dominant() === 'Idle_Loop', 'still healthy after five more swings');

console.log('\n-- exactly one clip ever dominates: nothing is orphaned at weight 1 --');
{
  const seq = [{}, { moving: true, speed: 2 }, { swimming: true }, { swimming: true, moving: true },
    { blocking: true }, { casting: true }, { sitting: true }, {}];
  let worst = 0, at = '';
  for (const s of seq) {
    rig.setState(s); step(30);
    const l = live();
    if (l.length > worst) { worst = l.length; at = JSON.stringify(s) + ' -> ' + l.join(' '); }
  }
  ok(worst <= 1, `never more than one live action after a settled blend (worst ${worst}: ${at})`);
}

console.log('\n-- and death stays down --');
rig.setState({ dead: true });
step(300);                                   // 5 s — the clip itself is 2.4 s
ok(dominant() === 'Death01', `death holds (${dominant()})`);
const t1 = rig.actions.get('Death01').time;
step(60);
ok(Math.abs(rig.actions.get('Death01').time - t1) < 1e-6,
  'and does not restart or loop (clamped at the end)');

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
