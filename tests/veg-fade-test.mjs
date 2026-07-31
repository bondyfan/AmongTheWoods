// ==========================================================================
// VEGETATION GROW-IN — regression test.
//
// Vegetation appeared a whole 40 m CHUNK at a time: _applyVegVisibility flips
// chunk.grass.visible the instant the chunk centre crosses vegDrawDist. Walking
// forward made whole fields of grass snap into existence at once.
//
// Blades now SINK into the ground across a band before the cut, so distant
// vegetation rises out of the earth as you approach. Sinking rather than
// alpha-fading keeps everything opaque — no transparency, no sort order, no
// extra pass — and the distance it needs was already being computed for the
// trample effect, so it is close to free.
//
// Run: node tests/veg-fade-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const models = readFileSync('js/models.js', 'utf8');
const main = readFileSync('js/main.js', 'utf8');

console.log('\n-- the shader sinks distant blades --');
ok(/uniform vec2 uVegFade;/.test(models), 'a fade band uniform exists');
ok(/transformed\.y -= smoothstep\(uVegFade\.x, uVegFade\.y, dFol\) \* sway \* 1\.6;/.test(models),
  'and the vertex sinks across it');
{
  const body = models.slice(models.indexOf('const _folBody'));
  const fade = body.indexOf('uVegFade.x, uVegFade.y, dFol');
  ok(body.indexOf('float dFol = length(dpFol);') < fade,
    'it reuses dFol, already computed for the trample — no new distance maths');
  ok(/\* sway \*/.test(body.slice(fade - 5, fade + 80)),
    'weighted by sway, so the root stays and only the blade travels');
}
ok(/uVegFade = \{ value: new THREE\.Vector2\(1e6, 1e6 \+ 1\) \}/.test(models),
  'and it defaults to "so far away it never triggers"');

console.log('\n-- the band sits INSIDE the cull, not on top of it --');
{
  const blk = main.slice(main.indexOf('world.vegDrawDist = VEG_DRAW_DIST'));
  const setup = blk.slice(0, 700);
  ok(/vegFadeB = world\.vegDrawDist;/.test(setup), 'the fade ends at the old cut distance');
  ok(/vegFadeA = Math\.max\(8, world\.vegDrawDist - 35\)/.test(setup), 'and starts 35 m before it');
  ok(/world\.vegDrawDist \+= 40;/.test(setup),
    'then the cut is pushed a chunk further out, so the sink FINISHES before anything hides');
  ok(/=== Infinity\) \{ vegFadeA = 1e6/.test(setup),
    "and at 'furthest' there is no cut, so there is nothing to fade");
}

console.log('\n-- and it is driven every frame, with the other foliage uniforms --');
ok(/sh\.uniforms\.uVegFade\.value\.set\(vegFadeA, vegFadeB\)/.test(main),
  'the band is pushed to every foliage shader');
ok(/if \(sh\.uniforms\.uVegFade\)/.test(main),
  'guarded, so a shader compiled before this existed cannot throw');

console.log('\n-- the numbers actually order correctly --');
{
  const DIST = { short: 46, medium: 85, far: 130 };
  for (const [k, d] of Object.entries(DIST)) {
    const b = d, a = Math.max(8, d - 35), cut = d + 40;
    ok(a < b && b < cut, `${k}: grows in ${a}-${b} m, culled at ${cut} m`);
  }
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
