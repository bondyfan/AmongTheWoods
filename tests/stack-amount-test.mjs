// Moving PART of a stack: the ground drop and the chest, which used to be
// all-or-fixed-5 and all-or-nothing respectively.
//
// The picker itself is DOM, so it is exercised against a small stub document;
// the two things it feeds — dropResource/dropItem/dropConsumable and
// camp.deposit/withdraw — are checked for the arithmetic that actually loses
// items when it is wrong (over-drawing a stack, or a partial move that quietly
// rounds).

import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m, extra = '') => {
  if (c) { pass++; console.log(`  ok  ${m}${extra ? '  ' + extra : ''}`); }
  else { fail++; console.log(`  FAIL ${m}${extra ? '  ' + extra : ''}`); }
};
const eq = (a, b, m) => ok(a === b, m, `got ${a}, want ${b}`);

// ---------------------------------------------------------------- the picker
console.log('-- the "how many?" popup --');
{
  // the smallest DOM the module touches
  const listeners = new Map();
  const mkEl = () => {
    const el = {
      children: [], style: {}, dataset: {}, classList: { add() {}, remove() {} },
      _h: {}, value: '', textContent: '', offsetWidth: 226, offsetHeight: 190,
      set className(v) { this._cls = v; }, get className() { return this._cls; },
      set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
      appendChild(c) { el.children.push(c); return c; },
      remove() { el._gone = true; },
      contains() { return true; },
      focus() {}, select() {},
      addEventListener(t, f) { (el._h[t] ||= []).push(f); },
      querySelector(sel) { return (el._q ||= {})[sel] ||= mkEl(); },
      querySelectorAll() { return []; },
    };
    return el;
  };
  const body = mkEl();
  global.document = { createElement: mkEl, body };
  global.window = {
    addEventListener: (t, f) => listeners.set(t, f),
    removeEventListener: (t) => listeners.delete(t),
    innerWidth: 1400, innerHeight: 900,
  };
  global.innerWidth = 1400; global.innerHeight = 900;
  global.requestAnimationFrame = (f) => f();

  const { askAmount, amountPickerOpen, closeAmountPicker } =
    await import('../js/amount.js');

  // A stack of one is not a question — asking it would put a modal in front of
  // every single dropped sword.
  let got = 'unset';
  askAmount({ max: 1 }, (n) => { got = n; });
  eq(got, 1, 'a stack of one moves straight away');
  ok(!amountPickerOpen(), 'and nothing is left open');

  askAmount({ max: 9 }, (n) => { got = n; });
  ok(amountPickerOpen(), 'a real stack opens the popup');
  closeAmountPicker();
  eq(got, null, 'cancelling reports null, not 0 — "none" and "no answer" differ');
  ok(!amountPickerOpen(), 'and it closes');

  // Two popups at once would leave the first one orphaned, listeners and all.
  askAmount({ max: 4 }, (n) => { got = n; });
  let second = 'unset';
  askAmount({ max: 4 }, (n) => { second = n; });
  eq(got, null, 'opening a second popup settles the first');
  ok(amountPickerOpen(), 'and only the second is live');
  closeAmountPicker();
  eq(second, null, 'which closes too');
  ok(listeners.size === 0, 'every window listener is torn down again');

  delete global.document; delete global.window;
  delete global.innerWidth; delete global.innerHeight;
  delete global.requestAnimationFrame;
}

// -------------------------------------------------------------- the ground
console.log('\n-- dropping part of a stack on the ground --');
{
  const main = readFileSync('js/main.js', 'utf8');
  const cut = (from, to) => main.slice(main.indexOf(from), main.indexOf(to));

  const res = cut('function dropResource', 'function dropItem');
  ok(/dropResource\(key, amt = 5\)/.test(res), 'dropResource takes an amount');
  ok(/Math\.min\(Math\.max\(1, Math\.floor\(amt\)\), player\[key\]\)/.test(res),
    'clamped to a whole number you actually have — no dropping 8 of 3');

  const item = cut('function dropItem', 'function dropConsumable');
  ok(/dropItem\(id, n = 1\)/.test(item), 'dropItem takes a count');
  ok(/for \(let i = 0; i < Math\.max\(1, Math\.floor\(n\)\); i\+\+\)/.test(item),
    'gear does not stack as a pickup, so it drops one at a time');
  ok(/if \(!player\.removeItem\(id\)\) break;/.test(item),
    'and stops the moment you run out, rather than spawning free copies');
  ok(item.indexOf('if (!player.hasItem(id))') > item.indexOf('dropped++'),
    'the hotkey is cleared AFTER the loop, once the last copy is gone');

  const con = cut('function dropConsumable', 'function useBarSlot');
  ok(/Math\.min\(Math\.max\(1, Math\.floor\(n\)\), have\)/.test(con),
    'consumables clamp to what you carry');
  ok(/player\.consumables\[id\] -= amt/.test(con) && /spawn\(id, amt/.test(con),
    'and the pile on the ground is the amount taken off you');

  ok(/onDropRes: \(key, n\) => dropResource\(key, n\)/.test(main)
    && /onDropItem: \(id, n\) => dropItem\(id, n\)/.test(main)
    && /onDropConsumable: \(id, n\) => dropConsumable\(id, n\)/.test(main),
    'and all three hooks pass the amount through');
}

console.log('\n-- the inventory asks before it throws --');
{
  const p = readFileSync('js/panels.js', 'utf8');
  const blk = p.slice(p.indexOf('released outside every panel'),
    p.indexOf('released outside every panel') + 1400);
  ok(/askAmount\(/.test(blk), 'a stack asks how many');
  ok(/have > 1 && !e\.shiftKey/.test(blk),
    'a single item still drops in one gesture, and Shift skips the question');
  ok(/Math\.floor\(cell\.count \|\| 1\)/.test(blk),
    'count is 0 for an unstacked item, so it falls back to 1');
  ok(!/onDropRes\?\.\(cell\.id\)/.test(p), 'the old amount-less call is gone');
  ok(/closeAmountPicker\(\)/.test(p),
    'and closing a panel takes its popup with it');
}

// --------------------------------------------------------------- the chest
console.log('\n-- the chest moves one resource at a time --');
{
  const camp = readFileSync('js/camp.js', 'utf8');
  const dep = camp.slice(camp.indexOf('  deposit(key, amt)'), camp.indexOf('  withdrawAll()'));
  ok(/deposit\(key, amt\)/.test(dep) && /withdraw\(key, amt\)/.test(dep),
    'deposit and withdraw take a key and an amount');
  ok((dep.match(/RESOURCES\.includes\(key\)/g) || []).length === 2,
    'both refuse a key that is not a resource');
  ok((dep.match(/Math\.min\(Math\.max\(0, Math\.floor\(amt \?\? 0\)\)/g) || []).length === 2,
    'both clamp to what is on that side of the chest');
  ok(/depositAll\(\)/.test(camp) && /withdrawAll\(\)/.test(camp),
    'and the all-at-once buttons survive — they are still the common case');

  // The arithmetic, run for real.
  const RESOURCES = ['wood', 'stone'];
  const roundResource = (v) => Math.round(v * 100) / 100;
  const chest = {
    player: { wood: 10, stone: 0 }, storage: { wood: 4, stone: 0 },
    deposit(key, amt) {
      if (!RESOURCES.includes(key)) return 0;
      const n = Math.min(Math.max(0, Math.floor(amt ?? 0)), this.player[key]);
      if (n <= 0) return 0;
      this.player[key] = roundResource(this.player[key] - n);
      this.storage[key] = roundResource((this.storage[key] ?? 0) + n);
      return n;
    },
  };
  eq(chest.deposit('wood', 3), 3, 'storing 3 of 10 moves 3');
  eq(chest.player.wood, 7, 'you keep the rest');
  eq(chest.storage.wood, 7, 'and the chest gains exactly that');
  eq(chest.deposit('wood', 99), 7, 'asking for more than you hold moves what you hold');
  eq(chest.player.wood, 0, 'leaving nothing behind');
  eq(chest.deposit('wood', 5), 0, 'and an empty pocket moves nothing');
  eq(chest.deposit('gold', 5), 0, 'an unknown resource is refused outright');

  const panels = readFileSync('js/panels.js', 'utf8');
  const ui = panels.slice(panels.indexOf('renderChest()'), panels.indexOf('---------- bestiary'));
  ok(/data-move="in"/.test(ui) && /data-move="out"/.test(ui),
    'the chest has a per-resource store and take');
  ok(/\$\{have \? '' : 'disabled'\}/.test(ui) && /\$\{kept \? '' : 'disabled'\}/.test(ui),
    'greyed out when there is nothing on that side');
  ok(/camp\.deposit\(k, n\)/.test(ui) && /camp\.withdraw\(k, n\)/.test(ui),
    'and they go through the per-resource methods');
  ok(/onChestChange/.test(ui), 'co-op still gets told the chest changed');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
