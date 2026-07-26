// ==========================================================================
// Ability card audit — run with:  node server/sim/ability-info-test.mjs
//
// The bug this exists to prevent: an ability's real numbers living only in
// js/player.js while the card in the Class panel says "huge bonus damage" and
// quantifies nothing. Ambush did exactly that — a hardcoded `amount *= 2.2`
// plus a guaranteed crit, none of which the player could see anywhere.
//
// Rule: if a description PROMISES a magnitude, the info line the player reads
// must contain a number. Fix a failure by DECLARING the value on the skill (so
// classActiveInfo can print it) and having player.js read it back — never by
// softening the wording to dodge the check.
// ==========================================================================
import { CLASS_TREES, classActiveInfo, classPassiveInfo } from '../../js/config.js';

const VAGUE = /\b(huge|hugely|big|bigger|greatly|great|massive|massively|tremendous|strong|strongly|much|significantly|enormous|deadlier|brutal|fat)\b/i;
const hasNumber = (s) => /\d/.test(s);

let total = 0, failures = [];
for (const tree of CLASS_TREES) {
  for (const sk of [...(tree.actives || []), ...(tree.passives || [])]) {
    total++;
    const maxRank = sk.maxRank || 1;
    let info = [];
    try {
      info = (sk.type === 'active' ? classActiveInfo(sk, maxRank) : classPassiveInfo(sk, maxRank)) || [];
    } catch (e) {
      failures.push({ cls: tree.id, name: sk.name, why: 'info builder threw: ' + e.message });
      continue;
    }
    const line = info.join(' · ');
    if (VAGUE.test(sk.desc || '') && !hasNumber(line)) {
      failures.push({
        cls: tree.id, name: sk.name,
        why: 'promises a magnitude but its card shows no number',
        desc: sk.desc, shows: line || '(nothing)',
      });
    }
    // every active should say SOMETHING quantitative — a card with an empty
    // info line tells the player nothing about what training it buys
    if (sk.type === 'active' && !line) {
      failures.push({ cls: tree.id, name: sk.name, why: 'active with a completely empty info line' });
    }
  }
}

console.log(`audited ${total} abilities across ${CLASS_TREES.length} classes`);
for (const f of failures) {
  console.log(`  FAIL [${f.cls}] ${f.name} — ${f.why}`);
  if (f.desc) console.log(`        desc:  ${f.desc.slice(0, 120)}`);
  if (f.shows) console.log(`        shows: ${f.shows}`);
}
console.log(failures.length
  ? `\n=== ability audit: ${failures.length} failed ===`
  : '\n=== ability audit: every card quantifies what it promises ===');
process.exit(failures.length ? 1 : 0);
