// ==========================================================================
// FIREBALL / FIRE BLAST — regression test.
//
// Fireball became a 4 s cast with NO cooldown, and Fire Blast is its instant
// counterpart on a cooldown. Two things could break that quietly:
//
//   * `cd: 0` passing through a `|| default` somewhere and silently becoming a
//     real cooldown, or through a truthiness gate that treats 0 as "on cooldown"
//   * the windup path being special-cased to Pyroblast, which is where the only
//     other long cast in the game lives — Fireball would then fire instantly and
//     nobody would notice except that it felt too good
//
// Run: node tests/mage-spells-test.mjs
// ==========================================================================
import { readFileSync } from 'node:fs';
import { classSkillById } from '../js/config.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const player = readFileSync('js/player.js', 'utf8');

console.log('\n-- Fireball: slow, and free to repeat --');
{
  const s = classSkillById('mage_fireball');
  ok(!!s, 'it exists');
  ok(s.cd === 0, `no cooldown at all (cd ${s.cd})`);
  ok(s.windup === 4, `a 4 s cast (windup ${s.windup})`);
  ok(/4 s cast/i.test(s.desc) && /no cooldown/i.test(s.desc),
    'and the card says BOTH — the cast time is the whole cost now');
}

console.log('\n-- Fire Blast: instant, and rationed --');
{
  const s = classSkillById('mage_fire_blast');
  ok(!!s, 'it exists');
  ok(s.level === 5, `trainable from level 5 (${s.level})`);
  ok(!s.windup, `no cast time (windup ${s.windup ?? 'none'})`);
  ok(s.cd > 0, `on a real cooldown (${s.cd}s)`);
  // "8s" or "8 s" — the house style is the ability audit's business, not this test's
  ok(new RegExp(`${s.cd}\\s?s\\b`).test(s.desc), `the card names the ${s.cd}s cooldown`);
  ok(s.element === 'fire' && s.action === 'magicTarget', 'a single-target fire nuke');
}

console.log('\n-- the two are a PAIR: one slow and free, one instant and gated --');
{
  const fb = classSkillById('mage_fireball'), bl = classSkillById('mage_fire_blast');
  ok(fb.cd === 0 && bl.cd > 0, 'exactly one of them has a cooldown');
  ok(!!fb.windup && !bl.windup, 'and exactly one of them has a cast time');
  const dmg = (s) => s.damage[s.damage.length - 1];
  ok(dmg(bl) < dmg(fb), `the instant hits softer (${dmg(bl)} vs ${dmg(fb)}) — that is what pays for it`);
}

console.log('\n-- cd 0 survives the plumbing --');
{
  // the readiness gate must be a strict `> 0`, or a 0 would read as "blocked"
  ok(/\(this\.spellCds\[id\] \|\| 0\) > 0/.test(player),
    'the cast gate compares > 0, so a 0 cooldown never blocks');
  // and the cooldown must be a plain multiply, with no `|| fallback` to sneak a
  // default in when cd is 0
  const m = player.match(/classAbilityCooldown\(id\) \{[\s\S]*?\n  \}/);
  ok(!!m, 'found classAbilityCooldown');
  ok(/return skill\.cd \* /.test(m[0]), 'it multiplies skill.cd rather than defaulting it');
  ok(!/skill\.cd \|\|/.test(m[0]), 'and has no `skill.cd || …` that would resurrect a cooldown');
}

console.log('\n-- the windup path is GENERIC, not Pyroblast-only --');
{
  // Pyroblast gets one special case (Combustion makes it instant). If the branch
  // that STARTS a windup were also keyed to Pyroblast, Fireball would fire
  // instantly and read as a balance problem rather than a bug.
  const m = player.match(/const windupT = [\s\S]*?\n      if \(windupT\) \{/);
  ok(!!m, 'found the windup branch');
  ok(/if \(windupT\) \{/.test(m[0]), 'it triggers on ANY skill with a windup');
  const special = (m[0].match(/mage_pyroblast/g) ?? []).length;
  ok(special === 1, `Pyroblast is named exactly once, for its Combustion case (${special})`);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
