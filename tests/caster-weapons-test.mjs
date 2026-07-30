// ==========================================================================
// CASTER WEAPONS — regression test.
//
// Mages and priests are not soldiers. They may hold tools up to the Stone Axe
// (the second-worst axe), picks at any tier, and staves — and nothing else. The
// martial styles belong to the warrior, the beastmaster and the rogue.
//
// The cap is a NUMBER (dmg 76) rather than a list of ids, so a new weapon can't
// quietly slip through by not being on anyone's list. This test pins both ends:
// every existing weapon is classified, and the classification is the one meant.
//
// Run: node tests/caster-weapons-test.mjs
// ==========================================================================
import { ITEMS, itemById, canWield, wieldError, CASTER_CLASSES, CASTER_WEAPON_CAP }
  from '../js/config.js';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${m}`); };
const weapons = ITEMS.filter(i => i.slot === 'weapon' && i.weapon);

console.log('\n-- the cap is the Stone Axe, and it is the SECOND-worst axe --');
{
  const axes = weapons.filter(w => w.weapon.style === 'axe')
    .sort((a, b) => a.weapon.dmg - b.weapon.dmg);
  ok(axes[0].id === 'boneAxe', `worst axe is the Bone Axe (${axes[0].id})`);
  ok(axes[1].id === 'stoneAxe', `second-worst is the Stone Axe (${axes[1].id})`);
  ok(CASTER_WEAPON_CAP === axes[1].weapon.dmg,
    `the cap equals its damage (${CASTER_WEAPON_CAP})`);
  ok(canWield('mage', axes[1]), 'a mage may hold the Stone Axe');
  ok(!canWield('mage', axes[2]), `but not the next one up (${axes[2].id})`);
}

console.log('\n-- no bladed or martial weapon, at any damage --');
for (const style of ['sword', 'spear', 'bow', 'crossbow']) {
  const w = weapons.filter(x => x.weapon.style === style)
    .sort((a, b) => a.weapon.dmg - b.weapon.dmg)[0];
  if (!w) continue;
  ok(!canWield('mage', w),
    `even the weakest ${style} is refused (${w.id}, dmg ${w.weapon.dmg}` +
    `${w.weapon.dmg <= CASTER_WEAPON_CAP ? ' — UNDER the cap, so style must decide' : ''})`);
}

console.log('\n-- staves and picks are theirs --');
{
  const staves = weapons.filter(w => w.weapon.style === 'staff');
  ok(staves.length >= 3, `there are staves to hold (${staves.length})`);
  for (const s of staves) ok(canWield('mage', s), `${s.name} is wieldable`);
  const picks = weapons.filter(w => w.weapon.style === 'pick');
  ok(picks.every(p => canWield('mage', p)),
    `every pick stays available (${picks.length}) — mining is not combat`);
}

console.log('\n-- and it applies to the priest too, but to nobody else --');
{
  const sword = weapons.find(w => w.weapon.style === 'sword');
  ok(CASTER_CLASSES.has('priest') && CASTER_CLASSES.has('mage'), 'both are casters');
  ok(!canWield('priest', sword), 'a priest cannot hold a sword either');
  for (const c of ['warrior', 'rogue', 'beastmaster']) {
    ok(weapons.every(w => canWield(c, w)), `${c} may hold every weapon in the game`);
  }
}

console.log('\n-- the refusal explains itself --');
{
  const sword = weapons.find(w => w.weapon.style === 'sword');
  const bigAxe = weapons.filter(w => w.weapon.style === 'axe')
    .sort((a, b) => b.weapon.dmg - a.weapon.dmg)[0];
  ok(/staff/i.test(wieldError('mage', sword) ?? ''), 'a sword points you at a staff');
  ok(/stone axe/i.test(wieldError('mage', bigAxe) ?? ''), 'a big axe names the limit');
  ok(wieldError('mage', itemById('stoneAxe')) === null, 'and an allowed weapon has no error');
  ok(/priest/i.test(wieldError('priest', sword) ?? ''), 'the message names the class');
}

console.log('\n-- what a staff actually does --');
for (const s of weapons.filter(w => w.weapon.style === 'staff')) {
  const st = s.stats ?? {};
  ok(st.mana > 0 && st.spellPower > 0 && st.energy === -20,
    `${s.name}: +${st.mana} mana, +${Math.round(st.spellPower * 100)}% spell power, ${st.energy} energy`);
  ok(s.desc.includes(String(st.mana)) && s.desc.includes(String(Math.round(st.spellPower * 100))),
    '…and the card says so');
}

console.log('\n-- a staff is a poor club --');
{
  const staff = itemById('arcaneStaff'), axe = itemById('warAxe');
  ok(staff.weapon.dmg < axe.weapon.dmg,
    `the best staff hits softer than a war axe (${staff.weapon.dmg} vs ${axe.weapon.dmg})`);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
