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
  // resScale (pixelRatio 2 everywhere) and shadowQuality (a phone cannot afford
  // 16 shadow taps per lit pixel) are the only two things a mobile tier changes.
  ok(diffs.every(k => k === 'resScale' || k === 'shadowQuality'),
    `${m} differs from ${d} only in resScale/shadowQuality (${diffs.join(', ') || 'identical'})`);
}

console.log('\n-- every mobile tier renders at the panel ratio --');
{
  for (const k of ['mlow', 'mmedium', 'mhigh']) {
    ok(PRESETS[k].resScale === 'auto', `${k} is 'auto' — the panel's own ratio, capped at 2`);
  }
  // 'auto' has to really mean 2, or the label is a lie
  ok(/: Math\.min\(window\.devicePixelRatio, 2\);/.test(main),
    "'auto' resolves to min(dpr, 2) with nothing clamping it lower");
  ok(/settings\.resScale === '1' \? 1/.test(main),
    "and Resolution '1' is still there as the escape hatch if a phone struggles");
}

console.log('\n-- no preset reaches for the farthest vegetation --');
{
  // 'furthest' streams a wider ring of full-detail vegetation than any preset
  // needs, and it is the setting whose chunk-by-chunk pop-in is most visible.
  for (const [k, p] of Object.entries(PRESETS)) {
    ok(p.vegDist !== 'furthest', `${k} is '${p.vegDist}', not 'furthest'`);
  }
}

console.log('\n-- a device is only offered its own tiers --');
{
  ok(/o\.hidden = onMobile \? !mobileOnly : mobileOnly;/.test(main),
    'desktop tiers are hidden on a phone, and the mobile tiers on a desktop');
  ok(/if \(o\.value === 'custom'\) continue;/.test(main),
    "but Custom stays on both — it is not a tier, it is 'you changed something'");
}

console.log('\n-- a phone lands on a preset, not on "custom" --');
ok(/settings\.gfxPreset \?\?= onMobile \? 'mmedium' : 'custom';/.test(main),
  'mobile defaults to Medium (mobile); desktop keeps custom');

console.log('\n-- shadow quality is a real, three-way setting --');
{
  const html2 = readFileSync('index.html', 'utf8');
  ok(/id="set-shadowquality"/.test(html2), 'the dropdown exists');
  for (const v of ['low', 'medium', 'high']) {
    ok(new RegExp(`<option value="${v}"[^>]*>[^<]*`).test(
        html2.slice(html2.indexOf('set-shadowquality'), html2.indexOf('set-shadowdist'))),
      `it offers ${v}`);
  }
  // the three map types, cheapest to dearest: 1 tap, 4 taps, 16 taps
  ok(/low: THREE\.BasicShadowMap/.test(main), 'low is BasicShadowMap (1 tap, hard edge)');
  ok(/medium: THREE\.PCFShadowMap/.test(main), 'medium is PCFShadowMap (4 taps)');
  ok(/high: THREE\.PCFSoftShadowMap/.test(main), 'high is PCFSoftShadowMap — what desktop had');
  ok(/renderer\.shadowMap\.type !== wantType/.test(main),
    'and a change in TYPE recompiles materials, like toggling shadows does');
  ok(/settings\.shadowQuality \?\?= onMobile \? 'medium' : 'high';/.test(main),
    'desktop keeps the softest edge; a phone starts one tier down');
  ok(PRESETS.mlow.shadowQuality === 'low' && PRESETS.mmedium.shadowQuality === 'medium'
     && PRESETS.mhigh.shadowQuality === 'medium',
    'and no mobile tier asks for 16 taps per lit pixel');
}

console.log('\n-- the desktop tiers are untouched --');
{
  ok(PRESETS.low.resScale === '1' && PRESETS.medium.resScale === '1',
    'desktop low/medium still render at 1x');
  ok(PRESETS.low.bloom === false && PRESETS.high.bloom === true,
    'and their feature sets are unchanged');
  ok(PRESETS.high.shadowQuality === 'high' && PRESETS.medium.shadowQuality === 'high',
    'desktop medium/high keep the soft shadows they always had');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
