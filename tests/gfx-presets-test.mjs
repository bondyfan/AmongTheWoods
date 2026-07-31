// ==========================================================================
// GRAPHICS PRESETS — regression test.
//
// A phone defaulted to 'custom', which is not a preset at all: it silently kept
// every desktop default — bloom, god rays, the whole offscreen post stack and
// 2048 shadow maps — because no mobile preset existed to land on.
//
// The three mobile tiers mirror their desktop namesakes feature-for-feature and
// differ ONLY in resolution: all of them run at pixelRatio 2 ('auto'), where
// desktop low/medium drop to 1.
//
// Run: node tests/gfx-presets-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const main = readFileSync('js/main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');

// pull the literal out of main.js and evaluate just that object
const blk = main.slice(main.indexOf('const GFX_PRESETS = {'));
const body = blk.slice(blk.indexOf('{'), blk.indexOf('\n  };') + 4);
const PRESETS = new Function('return ' + body.replace(/;$/, ''))();

console.log('\n-- three mobile tiers exist, and are offered --');
for (const k of ['mlow', 'mmedium', 'mhigh']) {
  ok(!!PRESETS[k], `${k} is defined`);
  ok(new RegExp(`value="${k}"`).test(html), `${k} is in the dropdown`);
}

console.log('\n-- each mirrors its desktop namesake, feature for feature --');
for (const [m, d] of [['mlow', 'low'], ['mmedium', 'medium'], ['mhigh', 'high']]) {
  const diffs = Object.keys(PRESETS[d]).filter(k => PRESETS[m][k] !== PRESETS[d][k]);
  // at most one difference, and if there is one it must be resScale. mhigh
  // matches high exactly, because desktop High already renders at 'auto'.
  ok(diffs.every(k => k === 'resScale'),
    `${m} differs from ${d} in nothing but resScale (${diffs.join(', ') || 'identical'})`);
}

console.log('\n-- and every mobile tier runs at pixelRatio 2 --');
{
  for (const k of ['mlow', 'mmedium', 'mhigh']) {
    ok(PRESETS[k].resScale === 'auto', `${k} is 'auto' (caps at devicePixelRatio 2)`);
  }
  // 'auto' must actually mean 2 — a stray mobile clamp would make this a lie
  ok(/: Math\.min\(window\.devicePixelRatio, 2\);/.test(main),
    "and 'auto' resolves to min(dpr, 2) with no mobile clamp undercutting it");
}

console.log('\n-- a phone lands on a preset, not on "custom" --');
ok(/settings\.gfxPreset \?\?= onMobile \? 'mmedium' : 'custom';/.test(main),
  'mobile defaults to Medium (mobile); desktop keeps custom');

console.log('\n-- the desktop tiers are untouched --');
{
  ok(PRESETS.low.resScale === '1' && PRESETS.medium.resScale === '1',
    'desktop low/medium still render at 1x');
  ok(PRESETS.low.bloom === false && PRESETS.high.bloom === true,
    'and their feature sets are unchanged');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
