// ==========================================================================
// EDITOR ENUM FIELDS · AUDIO VOICE POOL · LANDSCAPE — regression test.
//
//  * The World Editor could only change NUMBERS, and it hides any field an item
//    has no value for — so "which class is this item for" was both untyped and,
//    for every item that had no requirement yet, invisible. Backwards.
//  * sfx() cloneNode()'d its element on every play. A clone copies the src but
//    not the decoded audio, so each hit fetched and DECODED an mp3 before it
//    could make a noise: silent first swing, then a hitch. Now a warm pool.
//
// Run: node tests/editor-and-audio-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';
import { ITEM_TWEAK_FIELDS, ITEM_ENUM_FIELDS, tweakOriginal, applyTweaks } from '../js/worldpatch.js';
import { itemById, requiredClassForItem, canWield } from '../js/config.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

console.log('\n-- the editor can set a required class, on ANY item --');
{
  ok(ITEM_TWEAK_FIELDS.includes('reqClass'), 'reqClass is an editable field');
  ok(ITEM_TWEAK_FIELDS.includes('weapon.style'),
    'so is weapon.style — it is what decides whether a caster may hold it');
  const classes = ITEM_ENUM_FIELDS.reqClass;
  ok(classes[0] === '', 'the first option is "none", so clearing is one click');
  for (const c of ['warrior', 'rogue', 'mage', 'priest', 'beastmaster']) {
    ok(classes.includes(c), `${c} is offered`);
  }
  // an item with NO requirement must still show the row, or you could only edit
  // items that already had one
  ok(tweakOriginal('item', 'stoneAxe', 'reqClass') === '',
    'an item with no requirement still reports an original, so the row renders');
  ok(tweakOriginal('item', 'stoneAxe', 'level') !== undefined, 'numeric fields still work');
}

console.log('\n-- and setting one actually gates the item --');
{
  const axe = itemById('stoneAxe');
  ok(requiredClassForItem(axe) === null, 'the Stone Axe starts unrestricted');
  axe.reqClass = 'warrior';
  ok(requiredClassForItem(axe) === 'warrior', 'setting reqClass takes effect');
  axe.reqClass = '';
  ok(requiredClassForItem(axe) === null,
    'and an empty string means NO requirement — it must beat the built-in rules');
  delete axe.reqClass;
  // the built-in beastmaster rule still applies when nothing is set
  ok(requiredClassForItem(itemById('huntingBow')) === 'beastmaster',
    'with nothing set, the built-in bow rule still holds');
}

console.log('\n-- audio plays from a warm pool, not a fresh clone --');
{
  const src = readFileSync('js/audio.js', 'utf8');
  // strip comments first — the explanation of the bug naturally names cloneNode
  const code = src.replace(/^\s*\/\/.*$/gm, '');
  ok(!/cloneNode\(\)/.test(code), 'sfx() no longer clones an element per play (code, not comments)');
  ok(/_voices\(name\)/.test(src), 'it takes a voice from the pool');
  const m = src.match(/_voices\(name\) \{[\s\S]*?\n  \}/);
  ok(!!m, 'found the pool');
  ok(/a\.load\(\)/.test(m[0]), 'the voices are load()ed up front, not on first use');
  const n = (m[0].match(/k < (\d+)/) ?? [])[1];
  ok(Number(n) >= 2, `more than one voice, so overlapping hits do not cut off (${n})`);
  ok(/for \(const n of SFX\) this\._voices\(n\);/.test(src),
    'and every SFX is warmed during the loading screen');
  ok(/currentTime = 0/.test(src), 'a reused voice rewinds before it plays');
}

console.log('\n-- landscape is asked for in all three places it can be --');
{
  const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  ok(man.orientation === 'landscape', `the installed PWA asks for landscape (${man.orientation})`);
  const main = readFileSync('js/main.js', 'utf8');
  ok(/screen\.orientation\?\.lock\?\.\('landscape'\)/.test(main),
    'fullscreen locks it where the browser allows a lock');
  ok(/catch \{ \/\* not permitted here \*\/ \}/.test(main),
    'and a refusal is swallowed — it throws on desktop and does not exist on iOS');
  const css = readFileSync('css/style.css', 'utf8');
  ok(/#rotate-me/.test(css) && /orientation: portrait/.test(css),
    'and a rotate prompt covers iOS, where neither of the above works');
  ok(/pointer: coarse/.test(css),
    'gated on a coarse pointer — a narrow desktop window is not a phone');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
