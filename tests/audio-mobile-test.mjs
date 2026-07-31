// ==========================================================================
// MOBILE AUDIO + STARTUP — regression test.
//
// Three measured defects, all reported from a phone:
//
//  1. NO sound effects at all, while music played fine. iOS Safari unlocks audio
//     PER ELEMENT and only inside a user gesture. Music worked because playMusic
//     runs from a pointerdown handler; every sfx was a fresh element made later,
//     outside any gesture, so play() was refused. There was no unlock path in
//     the file at all. Fixed by moving sfx to Web Audio: one AudioContext
//     resumed by any gesture, and BufferSources have no such rule.
//  2. Menu music started ~20 s late: preloadAll queued 15.53 MB and put
//     mainmenu.mp3 LAST of 176 requests, behind 11.91 MB.
//  3. An earlier attempt at (1) preloaded ~650 audio elements and silenced
//     everything — iOS caps how many can exist. Guarded here forever.
//
// Run: node tests/audio-mobile-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const src = readFileSync('js/audio.js', 'utf8');
const code = src.replace(/^\s*\/\/.*$/gm, '');

console.log('\n-- sound effects go through Web Audio, not elements --');
ok(/AudioContext/.test(code), 'there is an AudioContext');
ok(/createBufferSource\(\)/.test(code), 'sfx plays a BufferSource');
ok(/decodeAudioData/.test(code), 'and buffers are decoded up front');
{
  // slice from sfx() to whatever method follows it — setSfxVolume sits ABOVE it
  // in the file, so slicing to that ran backwards and matched nothing
  const at = code.indexOf('sfx(name, volume');
  const after = code.indexOf('\n  ', code.indexOf('\n  }', at));
  const sfxFn = code.slice(at, after > at ? after : at + 1200);
  ok(/createBufferSource/.test(sfxFn), 'sfx() itself uses the buffer path');
  ok(/cloneNode\(\)/.test(sfxFn),
    'and keeps the element path as a fallback where Web Audio is missing');
  ok(sfxFn.indexOf('createBufferSource') < sfxFn.indexOf('cloneNode'),
    'buffer FIRST, element only as the fallback');
}

console.log('\n-- and something actually unlocks it --');
{
  ok(/unlock\(\)\s*\{/.test(code), 'audio.js exposes unlock()');
  ok(/ctx\.resume\(\)/.test(code), 'which resumes the context');
  const ui = readFileSync('js/ui.js', 'utf8');
  ok(/audio\.unlock\(\)/.test(ui), 'and the UI calls it');
  ok(/'pointerdown', unlockOnce/.test(ui) && /'touchstart', unlockOnce/.test(ui),
    'from a real gesture — touchstart too, or iPhones never fire it');
}

console.log('\n-- the boot download is sound effects ONLY --');
{
  const pre = code.slice(code.indexOf('async preloadAll'), code.indexOf('_ac()'));
  ok(!/const MUSIC = \[/.test(pre), 'music is not preloaded — it streams (10.17 MB saved)');
  ok(!/AMB\.map/.test(pre), 'nor is ambience (2.76 MB saved)');
  ok(/SFX\.map\(n => SFX_PATH/.test(pre), 'only the sfx are fetched');
  ok(!/new Audio\(/.test(pre),
    'and preload creates NO audio elements — ~650 of them silenced iOS entirely');
}

console.log('\n-- music still streams, and is NOT decoded into memory --');
{
  const music = code.slice(code.indexOf('playMusic(name)'));
  ok(/new Audio\(MUSIC_PATH/.test(music), 'music is an element');
  ok(!/decodeAudioData/.test(music.slice(0, 800)),
    'never decoded — some tracks are tens of megabytes');
}

console.log('\n-- the view switch no longer rebuilds the world --');
{
  const main = readFileSync('js/main.js', 'utf8');
  ok(!/world\.viewRadius = .*rpg \?/.test(main),
    'the streaming radius is the same in both view modes');
  ok(/world\.viewRadius = autoQuality\.stage >= 3 \? 3 : 4;/.test(main),
    'one radius, chosen by quality alone');
  ok(/if \(next === picked\) \{[^}]*return;/.test(main),
    'and the first-run picker no-ops when you tap the option you are already in');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
