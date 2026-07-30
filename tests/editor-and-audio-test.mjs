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

console.log('\n-- landscape is asked for, in the three places it can be --');
{
  const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  ok(man.orientation === 'landscape', `the installed PWA asks for landscape (${man.orientation})`);
  const main = readFileSync('js/main.js', 'utf8');
  const css = readFileSync('css/style.css', 'utf8');
  const html = readFileSync('index.html', 'utf8');
  ok(/screen\.orientation\?\.lock\?\.\('landscape'\)/.test(main),
    'fullscreen locks it where the browser allows a lock');
  ok(/id="rotate-me"/.test(html), 'and a prompt covers iOS, where no lock exists');
  ok(/orientation: portrait/.test(css) && /pointer: coarse/.test(css),
    'shown on portrait phones only — a narrow desktop window is not a phone');

  // CSS-rotating the whole page was tried and reverted. It cannot tell how the
  // phone is physically held when the OS reports nothing — an iPhone with the
  // orientation lock on never says "landscape" — so the picture flipped at the
  // wrong times. If it is ever attempted again, the input layer has to be
  // compensated too, and that is what these guard against half-doing.
  // the only rotate left in the prompt block is the little phone ICON's wiggle
  ok(!/body \{[^}]*transform:[^;]*rotate/.test(css),
    'the page itself is no longer rotated');
  ok(!/orient\.js/.test(main) && !/orient\.js/.test(readFileSync('js/input.js', 'utf8')),
    'and no half-removed coordinate plumbing is left behind');
  ok(!/viewW\(\)/.test(main), 'the renderer is back on the plain viewport');
}

console.log('\n-- the first-run view picker --');
{
  const main = readFileSync('js/main.js', 'utf8');
  const html = readFileSync('index.html', 'utf8');
  const css = readFileSync('css/style.css', 'utf8');
  ok(/id="view-pick"/.test(html) && /class="hidden"/.test(html.split('id="view-pick"')[1].slice(0, 40)),
    'it starts hidden');
  ok((html.match(/class="vp-opt"/g) ?? []).length === 2, 'exactly two choices');
  ok(/data-rpg="1"/.test(html) && /data-rpg="0"/.test(html), '3D and top-down');
  ok(/vp-blink/.test(css), 'the buttons blink for attention');
  ok(/#view-pick\.touched \.vp-opt \{ animation: none/.test(css),
    'and STOP blinking once touched — a control that nags after you engage is rude');
  ok(/localStorage\.getItem\(VIEW_PICK_KEY\)/.test(main), 'shown once, ever');
  ok(/localStorage\.setItem\(VIEW_PICK_KEY, '1'\)/.test(main), 'and remembered on confirm');
  ok(/go\.disabled = true/.test(main), 'Confirm is dead until something is picked');
  ok(/applyViewMode\(\);/.test(main.split('maybeAskViewMode')[1] ?? ''),
    'the choice applies LIVE, so Confirm agrees with something you can see');
  ok(/Settings . Graphics . RPG view mode/.test(main),
    'and the tip afterwards says exactly where to change it again');
  ok(/game\.kind !== 'survival'/.test(main),
    'survival only — it would be nonsense in the MOBA');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
