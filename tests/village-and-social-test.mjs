// ==========================================================================
// VILLAGE GUARDS · FOLLOW · MAGIC LIGHT — regression test.
//
// Three small features that are easy to half-wire and hard to notice:
//   * the hamlet posted two soldiers at its gate and nobody at the smith's end,
//     so half the village was unwatched
//   * follow has to steer the player WITHOUT taking the controls away — the
//     moment you touch a movement key it must let go, WoW-style
//   * and Magic Light is a toggle, so its ability card has to promise a number
//     the ranks actually deliver
//
// Run: node -e "import('node:module').then(async m=>{ \
//   m.register('./server/sim/three-hook.mjs', import.meta.url); \
//   await import('./tests/village-and-social-test.mjs'); })"
// ==========================================================================
import { readFileSync } from 'node:fs';
import { bootWorld } from '../server/sim/world-sim.mjs';
import { classSkillById } from '../js/config.js';

// rankValue is private to player.js; the spec shape is `[r1, r2, r3]` or a scalar
const rankValue = (skill, key, rank, fb = 0) => {
  const v = skill?.[key];
  return Array.isArray(v) ? (v[rank - 1] ?? v[v.length - 1] ?? fb) : (v ?? fb);
};
import { audio } from '../js/audio.js';
audio.muted = true;

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };

console.log('\n-- the village is watched from BOTH ends --');
{
  const { world } = bootWorld();
  const v = world.village;
  ok(!!v, 'the world has a village');
  ok(v.guards.length === 4, `four soldiers, not two (${v.guards.length})`);
  // project each post onto the street axis: two must sit at each end
  const cx = v.x, cz = v.z;
  const along = v.guards.map(g => {
    const dx = g.x - cx, dz = g.z - cz;
    return Math.hypot(dx, dz) * Math.sign(dx * (v.dirX ?? 1) + dz * (v.dirZ ?? 0) || 1);
  });
  const far = along.filter(a => a > 0).length, near = along.filter(a => a < 0).length;
  ok(far === 2 && near === 2, `split two and two down the street (${near} / ${far})`);
  const spread = Math.max(...along) - Math.min(...along);
  ok(spread > 40, `and the two pairs are at OPPOSITE ends (${spread.toFixed(0)} m apart)`);
}

console.log('\n-- follow steers, but never takes the controls --');
{
  const handlers = {};
  globalThis.window = { addEventListener: (t, fn) => { (handlers[t] ??= []).push(fn); },
                        removeEventListener: () => {} };
  globalThis.document = { addEventListener: () => {}, removeEventListener: () => {}, body: {} };
  const { input } = await import('../js/input.js');
  const fire = (t, ev) => (handlers[t] ?? []).forEach(fn => fn({
    preventDefault() {}, repeat: false, target: { tagName: 'BODY' }, ...ev }));

  input.follow = { x: 1, z: 0 };
  ok(input.moveX === 1 && input.moveZ === 0, 'with hands off, follow drives');
  ok(input.steering === false, 'and that does not count as steering');

  fire('keydown', { code: 'KeyW' });
  ok(input.steering === true, 'a movement key IS steering — this is what cancels follow');
  ok(input.moveZ === -1, 'and your key wins over the follow vector');
  ok(input.moveX === 1, 'the unopposed axis still follows until the caller drops it');
  fire('keyup', { code: 'KeyW' });

  input.follow = null;
  ok(input.moveX === 0 && input.moveZ === 0, 'dropping follow stops the player dead');

  // and the follow tick must actually be wired into the frame
  const main = readFileSync('js/main.js', 'utf8');
  ok(/\n\s*tickFollow\(\);/.test(main), 'tickFollow() runs every frame');
  ok(/stopFollow\(/.test(main) && /input\.steering/.test(main),
    'and steering cancels it');
}

console.log('\n-- Magic Light: a mage toggle from level 10 --');
{
  const s = classSkillById('mage_magic_light');
  ok(!!s, 'the ability exists');
  ok(s.level === 10, `trainable from level 10 (${s.level})`);
  ok(s.action === 'lightOrb', `its action is lightOrb (${s.action})`);
  const radii = [1, 2, 3].map(r => rankValue(s, 'radius', r, 0));
  ok(radii.every(v => v > 0) && radii[0] < radii[2],
    `three ranks that actually grow: ${radii.join(' / ')} m`);
  // the card must name the numbers, or the player is guessing
  for (const v of radii) ok(s.desc.includes(String(v)), `the card names ${v} m`);
  const player = readFileSync('js/player.js', 'utf8');
  ok(/skill\.action === 'lightOrb'/.test(player), 'player.js handles lightOrb');
  ok(/this\.magicLight = null/.test(player), 'and casting it again snuffs it (a toggle)');
  const main = readFileSync('js/main.js', 'utf8');
  ok(/tickMagicLight\(dt\);/.test(main), 'the orb is ticked every frame');
  ok(/player\.magicLight/.test(main), 'and the render reads the flag');
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
