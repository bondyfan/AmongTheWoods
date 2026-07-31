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
// Asserting the TEXT of these rules is what let them be dead for so long — the
// declarations were there and simply lost the cascade. The real check is the
// "what a phone actually WINS" section at the bottom of this file; what is left
// here is only what no cascade can express.
ok(/body\.touch kbd \{ display: none/.test(css),
  'the keyboard hints are hidden — there is no keyboard to press');
ok(!/@media \(pointer: coarse\)[\s\S]{0,400}#hud-buttons \{/.test(css),
  'and the dead copy inside the coarse block is gone, not left to confuse');

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

// =========================================================================
// A media query adds NO specificity. The phone-scale block was written as
// `@media (pointer: coarse) { #hud-buttons { ... } }` and did nothing at all,
// because `body.touch.menu-open #hud-buttons` (1,2,1) elsewhere in the file
// beat a bare `#hud-buttons` (1,0,0). Nobody notices, because the rule LOOKS
// right and the media query LOOKS like it is scoping it.
//
// So rather than assert that some text is present, resolve the cascade and ask
// what a phone actually gets.
// =========================================================================
console.log('\n-- what a phone actually WINS, after the cascade --');
{
  const css = readFileSync('css/style.css', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');          // comments first, they contain braces

  // Two screens, because "does the phone get it" and "did the desktop keep
  // what it had" are different questions and must not share a rule set.
  const screen = (w, h, coarse) => (q) => {
    if (/portrait/.test(q)) return false;                 // both are landscape
    if (/pointer:\s*coarse/.test(q)) return coarse;
    if (/pointer:\s*fine|hover:\s*hover/.test(q)) return !coarse;
    const maxH = /max-height:\s*(\d+)/.exec(q);
    if (maxH && h > +maxH[1]) return false;
    const maxW = /max-width:\s*(\d+)/.exec(q);
    if (maxW && w > +maxW[1]) return false;
    const minW = /min-width:\s*(\d+)/.exec(q);
    if (minW && w < +minW[1]) return false;
    return true;
  };
  const PHONE = screen(667, 308, true);      // the screen this was reported from
  const DESKTOP = screen(1728, 962, false);

  // flatten to { selector, body, order }, keeping only rules that screen sees
  const flatten = (matches) => {
    const rules = [];
    let order = 0;
    const eat = (text) => {
      const re = /([^{}@]+)\{([^{}]*)\}/g;
      let m;
      while ((m = re.exec(text))) {
        for (const sel of m[1].split(',')) rules.push({ sel: sel.trim(), body: m[2], order: order++ });
      }
    };
    let i = 0;
    while (i < css.length) {
      if (css.startsWith('@media', i)) {
        const open = css.indexOf('{', i);
        const query = css.slice(i + 6, open);
        let j = open, d = 0;
        do { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } while (d > 0 && j < css.length);
        // order still advances for a skipped block? No — a rule the screen never
        // sees is not in the cascade at all, and its position cannot matter.
        if (matches(query)) eat(css.slice(open + 1, j - 1));
        i = j;
      } else {
        const next = css.indexOf('@media', i);
        eat(css.slice(i, next === -1 ? css.length : next));
        i = next === -1 ? css.length : next;
      }
    }
    return rules;
  };
  const phoneRules = flatten(PHONE), deskRules = flatten(DESKTOP);
  ok(phoneRules.length > 400, `${phoneRules.length} rules a phone sees, ${deskRules.length} a desktop`);

  const spec = (sel) => {
    const ids = (sel.match(/#[\w-]+/g) || []).length;
    const cls = (sel.match(/[.:\[][\w-]+/g) || []).length;
    return ids * 1000 + cls * 10;
  };

  // Which of them apply to one element, given the body's classes? Simple, and
  // enough: the selector must name the element, must not demand a body class we
  // do not have, and must not be a :not() of one we do.
  // `elClasses` matters: `.bar-wrap` and `.bar-wrap.energy` are different
  // elements, and a matcher that only asks "does the selector contain the
  // target" happily answers about the energy strip when you asked about the
  // health bar.
  const winner = (prop, target, bodyClasses, rules = phoneRules, elClasses = []) => {
    let best = null;
    for (const r of rules) {
      if (!target.split(/\s+/).every(part => r.sel.includes(part))) continue;
      if (/:hover|::/.test(r.sel)) continue;
      if (/body:not\(\.touch\)/.test(r.sel) && bodyClasses.includes('touch')) continue;
      const need = r.sel.match(/body((?:\.[\w-]+)+)/);
      if (need && !need[1].slice(1).split('.').every(c => bodyClasses.includes(c))) continue;
      // The compound the selector actually LANDS on has to be our element, not
      // merely contain its name: `#minimap-zoom button` contains "#minimap" and
      // is a different element entirely, and `.bar-wrap.energy` is not
      // `.bar-wrap`. So both sides are parsed into id + classes and compared.
      const lastOf = (sel) => {
        const c = sel.split(/[\s>+~]+/).pop();
        return { id: (c.match(/#[\w-]+/) || [null])[0],
                 cls: (c.match(/\.[\w-]+/g) || []).map(x => x.slice(1)) };
      };
      const l = lastOf(r.sel), t = lastOf(target);
      if (l.id !== t.id) continue;                       // both null, or the same id
      const own = [...t.cls, ...elClasses];
      if (!l.cls.every(c => own.includes(c))) continue;  // demands a class we lack
      const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`).exec(r.body);
      if (!m) continue;
      const s = spec(r.sel);
      if (!best || s > best.s || (s === best.s && r.order > best.order))
        best = { s, order: r.order, value: m[1].trim(), sel: r.sel };
    }
    return best;
  };

  const open = ['touch', 'menu-open'];
  const menu = winner('display', '#hud-buttons', open);
  ok(menu?.value === 'grid',
    `the open burger menu is a grid, not a column — won by "${menu?.sel}" (${menu?.value})`);
  const cols = winner('grid-template-columns', '#hud-buttons', open);
  ok(/1fr 1fr/.test(cols?.value ?? ''), `two buttons per row (${cols?.value})`);

  const font = winner('font-size', '#hud-buttons button', open);
  ok(parseFloat(font?.value) <= 12,
    `and its buttons are ${font?.value}, not 16px — won by "${font?.sel}"`);

  // The stack of bars: it was 230x75 on a 308 px tall screen.
  const barsW = winner('width', '#top-left', ['touch']);
  ok(/165px|190px/.test(barsW?.value ?? ''),
    `the HP stack is narrowed for a phone (${barsW?.value})`);
  const barH = winner('height', '.bar-wrap', ['touch'], phoneRules, ['hp']);
  ok(parseFloat(barH?.value) <= 13, `and the health bar is ${barH?.value} tall, not 20px`);
  const energyH = winner('height', '.bar-wrap', ['touch'], phoneRules, ['energy']);
  ok(parseFloat(energyH?.value) <= 10, `the energy strip ${energyH?.value}, not 13px`);

  // Desktop must be untouched by every one of those.
  // ---- the second pass of shrinking ----
  const q = winner('font-size', '#active-quest', ['touch']);
  ok(parseFloat(q?.value) <= 10, `the quest line is ${q?.value}, not 13px`);
  const res = winner('font-size', '#resource-hud .hud-resource', ['touch']);
  ok(parseFloat(res?.value) <= 10, `each resource chip is ${res?.value}, not 13px`);
  const resPad = winner('padding', '#resource-hud .hud-resource', ['touch']);
  ok(/1px/.test(resPad?.value ?? ''), `and barely padded (${resPad?.value})`);

  // the left column, pulled into the corner it was floating off
  const burgerL = winner('left', '#burger-btn', ['touch']);
  ok(/6px/.test(burgerL?.value ?? ''), `the burger sits at ${burgerL?.value}`);
  const barsL = winner('left', '#top-left', ['touch']);
  ok(/50px/.test(barsL?.value ?? ''), `and the bars follow it in (${barsL?.value})`);
  const colL = winner('left', '#hud-buttons', ['touch', 'menu-open']);
  ok(/6px/.test(colL?.value ?? ''), `as does the menu column (${colL?.value})`);
  // ...but they must not COLLIDE: the bars start after the burger ends
  const burgerW = parseFloat(winner('width', '#burger-btn', ['touch'])?.value);
  ok(6 + burgerW <= 50, `burger ends at ${6 + burgerW}px, bars start at 50px`);

  // the map takes the corner and the clock goes under it
  const mapW = parseFloat(winner('width', '#minimap', ['touch'])?.value);
  ok(mapW >= 76, `the minimap is ${mapW}px, up from 74`);
  const mapT = parseFloat(winner('top', '#minimap', ['touch'])?.value.match(/[\d.]+/)[0]);
  const clockT = parseFloat(winner('top', '#tod-clock', ['touch'])?.value.match(/[\d.]+/)[0]);
  ok(clockT >= mapT + mapW, `the clock (${clockT}px) clears the map (ends ${mapT + mapW}px)`);
  const clockR = winner('right', '#tod-clock', ['touch']);
  ok(clockR != null, `and stays on the right (${clockR?.value})`);

  const deskMenu = winner('display', '#hud-buttons', ['menu-open'], deskRules);
  ok(deskMenu?.value === 'flex', `desktop still gets a flex column (${deskMenu?.value})`);
  const deskFont = winner('font-size', '#hud-buttons button', ['menu-open'], deskRules);
  ok(deskFont == null || parseFloat(deskFont.value) > 12,
    `and desktop button text is left alone (${deskFont?.value ?? 'unset'})`);
  const deskQuest = winner('font-size', '#active-quest', [], deskRules);
  ok(parseFloat(deskQuest?.value) === 13, `desktop quest text stays 13px (${deskQuest?.value})`);
  const deskMap = winner('width', '#minimap', [], deskRules);
  ok(deskMap == null, 'and the desktop minimap keeps its own size');
  const deskBar = winner('height', '.bar-wrap', [], deskRules, ['hp']);
  ok(parseFloat(deskBar?.value) === 20, `and desktop bars stay 20px (${deskBar?.value})`);
  const deskEnergy = winner('height', '.bar-wrap', [], deskRules, ['energy']);
  ok(parseFloat(deskEnergy?.value) === 13, `its energy strip 13px (${deskEnergy?.value})`);
}

console.log('\n-- the shield button only exists when you can block --');
{
  const fn = main.slice(main.indexOf('function tickTouchAction'),
    main.indexOf('function tickTouchAction') + 900);
  ok(/\$id\('tc-block'\)/.test(fn), 'the block button is ticked with the action button');
  ok(/player\.canBlock/.test(fn),
    'and gated on canBlock — the same flag the Ctrl path checks, not a copy of the rule');
  ok(/classList\.toggle\('hidden'/.test(fn), 'shown and hidden, not merely dimmed');
  const p = readFileSync('js/player.js', 'utf8');
  ok(/this\.canBlock = !!this\.shield \|\| !!this\.weapon\.parry;/.test(p),
    'canBlock means a shield OR a weapon that parries — a parrying sword still gets it');
}

console.log('\n-- the camera settles back quickly --');
{
  ok(/const CAM_ORBIT_HOLD = 0\.7;/.test(main),
    'the swung camera waits 0.7 s, not two and a half');
  // and the ease that follows still lands on exactly 0, at the new delay
  let o = 1.2, hold = 0.7, dt = 1 / 60, t = 0, overshoot = false;
  while (t < 6) {
    if (hold > 0) hold -= dt;
    else { o += (0 - o) * Math.min(1, dt * 2.2); if (Math.abs(o) < 0.003) o = 0; }
    if (o < -1e-9) overshoot = true;
    t += dt;
  }
  ok(!overshoot && o === 0, 'and is fully home well inside 6 s, without overshooting');
}

console.log('\n-- the campfire outside the gate is gone --');
{
  const w = readFileSync('js/world.js', 'utf8');
  ok(!/makeCampfire\(\)/.test(w), 'no little hearth is built at the homestead');
  ok(!/makeCampfire,/.test(w), 'and the import went with it');
  ok(/co-op, where the camp is shared/.test(w), 'with the reason recorded');
  // the GREAT fire is a different thing and must survive — it owns the light
  ok(/makeGreatFire/.test(w), 'the great fire, which owns a real light, stays');
  const m = readFileSync('js/models.js', 'utf8');
  ok(/export function makeCampfire/.test(m),
    'and the model itself stays for the POI fires that still use it');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
