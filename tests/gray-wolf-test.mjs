// ==========================================================================
// GRAY WOLF + SPIDER SPEED — regression test.
//
// A new Verdant Forest predator, and the spider slowed to make room for it.
// The spawn table is a flat array the spawner picks from at random, so rarity
// is expressed by REPETITION — which is easy to get subtly wrong, hence the
// ratio being asserted rather than eyeballed.
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/gray-wolf-test.mjs'); })"
// ==========================================================================
import { ENEMY_TYPES, BIOMES } from '../js/config.js';
import { makeEnemyMesh } from '../js/models.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

console.log('\n-- the wolf exists and runs at the spider\'s old pace --');
{
  const w = ENEMY_TYPES.grayWolf, sp = ENEMY_TYPES.spider;
  ok(!!w, 'grayWolf is defined');
  ok(w.name === 'Gray Wolf', `named "${w.name}"`);
  ok(w.speed === 6, `it runs at 6 — the spider's old speed (${w.speed})`);
  ok(sp.speed === 4.2, `and the spider is now 4.2, i.e. 70% of 6 (${sp.speed})`);
  ok(Math.abs(sp.speed / 6 - 0.7) < 1e-9, 'exactly 70%, not approximately');
  ok(w.speed > sp.speed, 'so the wolf is the thing that can actually catch you');
}

console.log('\n-- it is 3.5x rarer than a spider in the Verdant Forest --');
{
  const verdant = BIOMES.find(b => /verdant/i.test(b.name));
  ok(!!verdant, `found ${verdant?.name}`);
  const n = (t) => verdant.enemies.filter(e => e === t).length;
  ok(n('grayWolf') > 0, `it is in the table (${n('grayWolf')} entries)`);
  const ratio = n('spider') / n('grayWolf');
  ok(Math.abs(ratio - 3.5) < 1e-9, `spider:wolf is exactly ${ratio}:1`);
  ok(n('rat') === n('spider') && n('snake') === n('spider'),
    'and rat/spider/snake are still equally common with each other');
}

console.log('\n-- and it has a body --');
{
  const mesh = makeEnemyMesh('grayWolf');
  ok(!!mesh, 'enemyMesh builds one');
  let meshes = 0;
  mesh.traverse(o => { if (o.isMesh) meshes++; });
  ok(meshes > 4, `made of ${meshes} parts, so it is a real wolf and not a fallback cube`);
  const black = makeEnemyMesh('wolf');
  let bn = 0; black.traverse(o => { if (o.isMesh) bn++; });
  ok(bn === meshes, 'same build as the black wolf — only the colours differ');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
