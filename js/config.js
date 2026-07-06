// ---- World & progression configuration ----

// The survival world is RADIAL: you start in a cave at the center and the
// biomes are concentric rings expanding outward in every direction. It is
// HUGE — what fits on the minimap is barely the first ring.
export const WORLD = {
  radius: 5500,     // playable circle — 10× the old world
  goalR: 5400,      // reach this distance from home to win
  caveR: 9,         // the starting cave at the center
};

export const radiusOf = (x, z) => Math.hypot(x, z);

// Biome rings from the center outward. rMax = outer edge of the ring.
// ground/ground2 = two grass tones blended by noise, dirt = patch color.
// trees = weights for tree variants, snowy adds snow caps to pines.
// packs: null = no packs in this ring, otherwise spawn config.
export const BIOMES = [
  { name: 'Verdant Forest', rMax: 550,  ground: 0x55803c, ground2: 0x669147, dirt: 0x8a6b42,
    fog: 0xc8dcae, sky: 0xaecfe8,
    foliage: [0x2d6a2d, 0x3c7f37, 0x4c8f3f], trunk: 0x6b4a2d,
    trees: { pine: 0.4, leafy: 0.4, birch: 0.2, dead: 0 }, snowy: false,
    grass: 0x6fa04c, flowers: true, mushrooms: false,
    enemies: ['rabbit', 'rat', 'spider', 'snake'], packs: null, treeDensity: 1.0 },
  { name: 'Dark Forest',    rMax: 1200, ground: 0x3d5c2f, ground2: 0x33502a, dirt: 0x5c4a30,
    fog: 0x93a986, sky: 0x8fa8b8,
    foliage: [0x1e4a22, 0x27552a, 0x1a3f2e], trunk: 0x4c3520,
    trees: { pine: 0.55, leafy: 0.25, birch: 0, dead: 0.2 }, snowy: false,
    grass: 0x44663a, flowers: false, mushrooms: true,
    enemies: ['spider', 'snake', 'wolf', 'venomspider', 'bat'], packs: { skulls: [0.8, 0.2, 0] }, treeDensity: 1.3 },
  { name: 'Haunted Forest', rMax: 2000, ground: 0x414b38, ground2: 0x39432f, dirt: 0x544a52,
    fog: 0x8a86a0, sky: 0x9a92b0,
    foliage: [0x2a3a28, 0x1e2e20, 0x3a3448], trunk: 0x3a3230,
    trees: { pine: 0.3, leafy: 0.1, birch: 0, dead: 0.6 }, snowy: false,
    grass: 0x5c6650, flowers: false, mushrooms: true,
    enemies: ['zombie', 'bat', 'venomspider', 'wolf'], packs: { skulls: [0.6, 0.3, 0.1] }, treeDensity: 1.1 },
  { name: 'Murky Swamp',    rMax: 2900, ground: 0x4a5a3a, ground2: 0x40503a, dirt: 0x3d4a3a,
    fog: 0xa3b096, sky: 0xa8b4a0,
    foliage: [0x3a5a30, 0x2e4a2a, 0x4a6438], trunk: 0x453a28,
    trees: { pine: 0.2, leafy: 0.5, birch: 0, dead: 0.3 }, snowy: false,
    grass: 0x60704a, flowers: false, mushrooms: true,
    enemies: ['snake', 'venomspider', 'stormsnake', 'boar'], packs: { skulls: [0.5, 0.4, 0.1] }, treeDensity: 0.9 },
  { name: 'Highlands',      rMax: 3800, ground: 0x7a7a55, ground2: 0x8b845e, dirt: 0x97815a,
    fog: 0xb9b9a2, sky: 0x9db4c4,
    foliage: [0x5c6e33, 0x6d7d3a, 0x4e5e2c], trunk: 0x5c4a33,
    trees: { pine: 0.5, leafy: 0.1, birch: 0.1, dead: 0.3 }, snowy: false,
    grass: 0x8f9060, flowers: false, mushrooms: false,
    enemies: ['wolf', 'boar', 'elk', 'venomspider', 'stormsnake'], packs: { skulls: [0.4, 0.4, 0.2] }, treeDensity: 0.7 },
  { name: 'Snowfall Woods', rMax: 4700, ground: 0xdfe7ec, ground2: 0xd0dce4, dirt: 0xb4c4d1,
    fog: 0xe6edf2, sky: 0xc9d9e4,
    foliage: [0x3d6155, 0x4a6e60, 0x35564b], trunk: 0x4a3a30,
    trees: { pine: 0.8, leafy: 0, birch: 0, dead: 0.2 }, snowy: true,
    grass: 0xc2d2dc, flowers: false, mushrooms: false,
    enemies: ['icewolf', 'icespider', 'bear', 'stormsnake'], packs: { skulls: [0.3, 0.5, 0.2] }, treeDensity: 0.85 },
  { name: 'Frozen Peak',    rMax: 99999, ground: 0xf2f6fa, ground2: 0xe4ecf3, dirt: 0xc9d6e1,
    fog: 0xf4f8fc, sky: 0xdfe9f2,
    foliage: [0x8fb0c0, 0x3d6155, 0xcfdfe8], trunk: 0x3d3229,
    trees: { pine: 0.7, leafy: 0, birch: 0, dead: 0.3 }, snowy: true,
    grass: 0xdde7ee, flowers: false, mushrooms: false,
    enemies: ['icewolf', 'wendigo', 'yeti', 'icegolem'], packs: { skulls: [0, 0.5, 0.5] }, treeDensity: 0.5 },
];

export function biomeIndexAt(x, z) {
  const r = radiusOf(x, z);
  for (let i = 0; i < BIOMES.length; i++) if (r <= BIOMES[i].rMax) return i;
  return BIOMES.length - 1;
}
export function biomeAt(x, z) { return BIOMES[biomeIndexAt(x, z)]; }

// 0..1 journey progress used for difficulty scaling
export function progressAt(x, z) {
  return Math.min(1, radiusOf(x, z) / WORLD.goalR);
}

// ---- resources ----
export const RESOURCES = ['meat', 'wood', 'stone', 'hide', 'iron'];
export const RES_ICONS = { meat: '🍖', wood: '🪵', stone: '🪨', hide: '🟫', iron: '🔩' };
// resources come in tenths (hide scraps); ×10/÷10 keeps whole numbers exact
export const roundResource = (value) => Math.round((Number(value) || 0) * 10) / 10;
export const fmtResource = (value) => {
  const r = roundResource(value);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// hide drops only from animals that realistically have one
export const HIDE_BEARING = new Set(['wolf', 'boar', 'elk', 'bear', 'icewolf', 'wendigo', 'yeti']);
export const hideForHp = (hp) => Math.max(1, Math.round(hp / 80));
export const VERDANT_HIDE_DROP = 0.1;

// ---- Enemies. Spiders are the weak starter enemy; the animals get bigger
// and meaner the further north you go. ----
// Ranged enemies chase and melee like everyone else, but ALSO have a shot
// "spell": every spellCd seconds they stop for half a second, fire, then run
// again (a charge bar above them shows the spell loading). dmg = shot damage,
// meleeDmg = bite/claw damage. Flying enemies hover above the ground.
export const ENEMY_TYPES = {
  // -- Verdant Forest --
  rabbit: { name: 'Rabbit', icon: '🐇',
             hp: 1,   dmg: 0,  speed: 7.8, range: 0,   attackCd: 1.0, xp: 1,  meat: 1, hitR: 0.35, aggro: 0, passive: true },
  rat:     { name: 'Giant Rat', icon: '🐀',
             hp: 12,  dmg: 4,  speed: 7.2, range: 1.2, attackCd: 0.9, xp: 5,  meat: 1, hitR: 0.5,  aggro: 22 },
  spider:  { name: 'Forest Spider', icon: '🕷️',
             hp: 20,  dmg: 6,  speed: 6.0, range: 1.3, attackCd: 1.0, xp: 8,  meat: 1, hitR: 0.7,  aggro: 22 },
  snake:   { name: 'Grass Snake', icon: '🐍',
             hp: 16,  dmg: 8,  speed: 6.8, range: 1.5, attackCd: 1.3, xp: 10, meat: 1, hitR: 0.6,  aggro: 20 },
  // -- Dark Forest --
  wolf:    { name: 'Black Wolf', icon: '🐺',
             hp: 45,  dmg: 10, speed: 8.0, range: 1.6, attackCd: 1.0, xp: 15, meat: 2, hitR: 0.8,  aggro: 26 },
  venomspider: { name: 'Venom Spider', icon: '☣️',
             hp: 55,  dmg: 11, meleeDmg: 7, speed: 6.0, range: 1.4, attackCd: 1.1, xp: 20, meat: 2, hitR: 0.8, aggro: 30,
             ranged: true, shootRange: 8.5, spellCd: 2.5, projectileSpeed: 15, shotColor: 0x8aff3a },
  bat:     { name: 'Cave Bat', icon: '🦇',
             hp: 18,  dmg: 6,  speed: 9.5, range: 1.4, attackCd: 1.1, xp: 12, meat: 1, hitR: 0.6,  aggro: 30, flying: true },
  // -- Haunted Forest --
  zombie:  { name: 'Zombie', icon: '🧟',
             hp: 90,  dmg: 14, speed: 4.6, range: 1.7, attackCd: 1.3, xp: 28, meat: 2, hitR: 0.85, aggro: 32 },
  // -- Highlands --
  boar:    { name: 'Wild Boar', icon: '🐗',
             hp: 80,  dmg: 16, speed: 7.5, range: 1.7, attackCd: 1.1, xp: 25, meat: 3, hitR: 0.9,  aggro: 24 },
  elk:     { name: 'Mad Elk', icon: '🦌',
             hp: 110, dmg: 20, speed: 7.2, range: 1.9, attackCd: 1.4, xp: 32, meat: 4, hitR: 1.0,  aggro: 24 },
  stormsnake: { name: 'Storm Serpent', icon: '⚡',
             hp: 70,  dmg: 8,  meleeDmg: 9, speed: 7.0, range: 1.5, attackCd: 1.2, xp: 28, meat: 3, hitR: 0.6, aggro: 30,
             ranged: true, shootRange: 10, spellCd: 3.0, projectileSpeed: 30, shotColor: 0xffe94a, stun: 1.2 },
  // -- Snowfall Woods --
  icewolf: { name: 'Ice Wolf', icon: '❄️',
             hp: 120, dmg: 18, speed: 8.6, range: 1.6, attackCd: 0.9, xp: 35, meat: 4, hitR: 0.8,  aggro: 28 },
  icespider: { name: 'Frost Spider', icon: '🕸️',
             hp: 100, dmg: 16, meleeDmg: 10, speed: 6.2, range: 1.4, attackCd: 1.1, xp: 30, meat: 3, hitR: 0.8, aggro: 30,
             ranged: true, shootRange: 9, spellCd: 2.2, projectileSpeed: 17, shotColor: 0x8ae0ff },
  bear:    { name: 'Grizzly Bear', icon: '🐻',
             hp: 180, dmg: 26, speed: 5.5, range: 2.1, attackCd: 1.5, xp: 45, meat: 5, hitR: 1.2,  aggro: 26 },
  // -- Frozen Peak --
  wendigo: { name: 'Wendigo', icon: '👹',
             hp: 220, dmg: 30, speed: 8.4, range: 2.0, attackCd: 1.2, xp: 55, meat: 6, hitR: 0.9,  aggro: 34 },
  yeti:    { name: 'Yeti', icon: '🏔️',
             hp: 350, dmg: 40, speed: 5.0, range: 2.5, attackCd: 1.7, xp: 70, meat: 8, hitR: 1.5,  aggro: 30 },
  icegolem: { name: 'Ice Golem', icon: '🗿',
             hp: 400, dmg: 45, meleeDmg: 30, speed: 3.6, range: 2.2, attackCd: 1.8, xp: 80, meat: 9, hitR: 1.4, aggro: 30,
             ranged: true, shootRange: 10, spellCd: 4.0, projectileSpeed: 13, shotColor: 0xbfe8ff, stun: 0.8 },
};

// Pack bosses ("the mother") by skull rank (index 0 = 1 skull).
// packSize = minions spawned with her; while she lives, reinforceCount minions
// keep arriving from all directions every reinforceInterval seconds.
export const BOSS_RANKS = [
  { skulls: 1, hpMult: 4,  dmgMult: 1.5, sizeMult: 1.5, xpMult: 3,  meatMult: 3, dropChance: 0.10,
    packSize: 8,  reinforceInterval: 6.0, reinforceCount: 1 },
  { skulls: 2, hpMult: 8,  dmgMult: 2.0, sizeMult: 1.8, xpMult: 6,  meatMult: 5, dropChance: 0.25,
    packSize: 11, reinforceInterval: 4.0, reinforceCount: 2 },
  { skulls: 3, hpMult: 15, dmgMult: 3.0, sizeMult: 2.2, xpMult: 10, meatMult: 8, dropChance: 0.50,
    packSize: 14, reinforceInterval: 2.5, reinforceCount: 3 },
];

// Meat dropped by a killed unit, scaled by its (max) HP: 1 meat up to 30 HP,
// then +1 per additional 30 HP. Tougher enemies (and bosses) pay out more.
export const meatForHp = (hp) => Math.max(1, Math.ceil(hp / 30));

// Cumulative XP required to reach each level (index = level).
export const XP_LEVELS = [0, 0, 40, 110, 220, 380, 600, 880, 1230, 1660, 2200];
export const MAX_LEVEL = 10;

// ---- Equippable items (WoW-style slots). Bought in the shop or dropped by
// pack bosses. Only ONE weapon is wielded at a time — Q cycles owned weapons. ----
export const SLOTS = ['weapon', 'head', 'chest', 'boots', 'pet', 'orb'];
export const SLOT_LABELS = { weapon: 'Weapon', head: 'Head', chest: 'Chest', boots: 'Boots', pet: 'Pet', orb: 'Orb' };

// Gear progresses through the ages. `needs` gates an item behind a camp
// building (survival): 'tent' → Hide Tent, 'cabin' → Wooden Cabin,
// 'furnace' → Stone Furnace (iron age).
export const ITEMS = [
  // -- weapons: melee (chop = tree felling & rock mining power) --
  { id: 'fists',      slot: 'weapon', level: 1, icon: '🖐️', name: 'Bare Hands',   cost: null, free: true,
    weapon: { kind: 'melee', dmg: 12, cd: 0.45, range: 1.5, chop: 0.5, tier: 0 },
    desc: 'Punch things. Can slowly break small trees for wood (rocks need a real tool).' },
  { id: 'club',       slot: 'weapon', level: 2, icon: '🏏', name: 'Wooden Club',   cost: { wood: 8 },
    weapon: { kind: 'melee', dmg: 22, cd: 0.5, range: 1.7, chop: 1, tier: 1 },
    desc: 'A crude stone-age club. Damage 22, chops trees and mines rocks.' },
  { id: 'stoneAxe',   slot: 'weapon', level: 3, icon: '🪓', name: 'Stone Axe',     cost: { wood: 12, stone: 10 },
    weapon: { kind: 'melee', dmg: 38, cd: 0.5, range: 1.8, chop: 2, tier: 1 },
    desc: 'Knapped stone on a haft. Damage 38, fast chopping & mining.' },
  { id: 'steelAxe',   slot: 'weapon', level: 6, icon: '⚒️', name: 'Iron Axe',      cost: { wood: 18, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', dmg: 68, cd: 0.48, range: 1.9, chop: 3, tier: 2 },
    desc: 'Smelted iron head. Damage 68, tears through wood and rock.' },
  { id: 'warAxe',     slot: 'weapon', level: 8, icon: '🔥', name: 'War Axe',       cost: { wood: 25, iron: 16, hide: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', dmg: 120, cd: 0.48, range: 2.0, chop: 4, tier: 3 },
    desc: 'Iron-age battle axe. Damage 120.' },
  // -- weapons: ranged (invented with the Wooden Cabin era; train Range to extend) --
  { id: 'huntingBow', slot: 'weapon', level: 4, icon: '🏹', name: 'Hunting Bow',   cost: { wood: 25, hide: 4 }, needs: 'cabin',
    weapon: { kind: 'bow', dmg: 16, cd: 0.75, range: 3.5, pierce: false, tier: 1 },
    desc: 'Wood + hide string. Arrows for 16 dmg, barely 3.5 m of reach.' },
  { id: 'longbow',    slot: 'weapon', level: 6, icon: '🎯', name: 'Longbow',       cost: { wood: 40, hide: 8, iron: 4 }, needs: 'furnace',
    weapon: { kind: 'bow', dmg: 32, cd: 0.62, range: 7, pierce: false, tier: 2 },
    desc: 'Iron-tipped arrows, damage 32, reach 7 m.' },
  { id: 'rapidBow',   slot: 'weapon', level: 8, icon: '🌀', name: 'Windstorm Bow', cost: { wood: 45, iron: 14, hide: 10 }, needs: 'furnace',
    weapon: { kind: 'bow', dmg: 30, cd: 0.35, range: 10, pierce: true, tier: 3 },
    desc: 'Very fast piercing arrows, reach 10 m.' },
  // -- medieval (Age 5, needs the Keep) --
  { id: 'steelSword', slot: 'weapon', level: 9, icon: '⚔️', name: 'Knight\'s Sword', cost: { iron: 25, wood: 10, hide: 8 }, needs: 'keep',
    weapon: { kind: 'melee', dmg: 150, cd: 0.42, range: 2.1, chop: 4, tier: 3 },
    desc: 'Medieval steel. Damage 150, lightning-fast swings.' },
  { id: 'crossbow',   slot: 'weapon', level: 9, icon: '🎯', name: 'Crossbow',       cost: { wood: 50, iron: 20 }, needs: 'keep',
    weapon: { kind: 'bow', dmg: 60, cd: 0.9, range: 12, pierce: true, tier: 3 },
    desc: 'Medieval war machine. Piercing bolts for 60 damage.' },
  // -- head (crafted from hides at the tent) --
  { id: 'leatherCap', slot: 'head', level: 3, icon: '🧢', name: 'Hide Cap',      cost: { hide: 4, meat: 10 }, needs: 'tent', stats: { hp: 25 },
    desc: '+25 max health.' },
  { id: 'furHood',    slot: 'head', level: 6, icon: '🎩', name: 'Fur Hood',      cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { hp: 60 },
    desc: '+60 max health.' },
  { id: 'bearHelm',   slot: 'head', level: 9, icon: '⛑️', name: 'Bearskull Helm', cost: { hide: 18, iron: 8, meat: 40 }, needs: 'furnace', stats: { hp: 110 },
    desc: '+110 max health.' },
  // -- chest (you start NAKED with a leaf — clothing is crafted from hides) --
  { id: 'leatherArmor', slot: 'chest', level: 3, icon: '🦺', name: 'Hide Tunic',     cost: { hide: 7, meat: 15 }, needs: 'tent', stats: { hp: 50 },
    desc: '+50 max health. Finally, actual clothes.' },
  { id: 'furCoat',      slot: 'chest', level: 6, icon: '🧥', name: 'Fur Coat',       cost: { hide: 14, meat: 30 }, needs: 'tent', stats: { hp: 100 },
    desc: '+100 max health.' },
  { id: 'bearHide',     slot: 'chest', level: 9, icon: '🛡️', name: 'Bearhide Plate', cost: { hide: 24, iron: 12, meat: 45 }, needs: 'furnace', stats: { hp: 170 },
    desc: '+170 max health.' },
  // -- boots --
  { id: 'swiftBoots',   slot: 'boots', level: 3, icon: '👢', name: 'Hide Wraps',     cost: { hide: 5, meat: 10 }, needs: 'tent', stats: { speed: 0.20 },
    desc: '+20% movement speed.' },
  { id: 'huntersBoots', slot: 'boots', level: 6, icon: '🥾', name: "Hunter's Boots", cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { speed: 0.35 },
    desc: '+35% movement speed.' },
  { id: 'windBoots',    slot: 'boots', level: 9, icon: '💨', name: 'Windwalkers',    cost: { hide: 14, iron: 8, meat: 40 }, needs: 'furnace', stats: { speed: 0.50 },
    desc: '+50% movement speed.' },
  // -- pet (companion) --
  { id: 'tamedWolf', slot: 'pet', level: 4, icon: '🐺', name: 'Tamed Wolf', cost: { meat: 55 }, pet: { dmg: 14 },
    desc: 'A loyal, invincible wolf fights by your side.' },
  { id: 'alphaWolf', slot: 'pet', level: 8, icon: '👑', name: 'Alpha Wolf', cost: { meat: 120 }, pet: { dmg: 32 },
    desc: 'A huge alpha. Bites for 32.' },
  // -- orb (guardian sphere — iron-age wonder) --
  { id: 'guardianSphere', slot: 'orb', level: 5,  icon: '🔮', name: 'Guardian Sphere', cost: { meat: 50, stone: 30, iron: 6 }, needs: 'furnace',
    orb: { count: 1, targets: 1, dmg: 12 },
    desc: 'Orbits you and fires bolts at enemies.' },
  { id: 'twinSphere',     slot: 'orb', level: 8,  icon: '✨', name: 'Twin-bolt Sphere', cost: { meat: 90, iron: 14, stone: 40 }, needs: 'furnace',
    orb: { count: 1, targets: 2, dmg: 14 },
    desc: 'Fires two bolts at once (14 dmg each).' },
  { id: 'duoSphere',      slot: 'orb', level: 10, icon: '🌐', name: 'Gemini Spheres',  cost: { meat: 130, iron: 24, stone: 60 }, needs: 'furnace',
    orb: { count: 2, targets: 2, dmg: 14 },
    desc: 'TWO spheres, each firing twin bolts.' },
];

export const itemById = (id) => ITEMS.find(i => i.id === id);

// MOBA has no mining/hides/smelting — special resources are paid in meat
// there (3 meat per unit) so every item stays purchasable.
export function costFor(cost, mobaMode) {
  if (!mobaMode || !cost) return cost;
  const out = { meat: cost.meat || 0 };
  if (cost.wood) out.wood = cost.wood;
  for (const k of ['stone', 'hide', 'iron']) if (cost[k]) out.meat += cost[k] * 3;
  if (!out.meat) delete out.meat;
  return out;
}

// ---- Spells / skills. Bought in the shop, equipped into max 6 spell slots,
// cast with keys 1-6. cd in seconds. ----
export const MAX_SPELL_SLOTS = 6;
export const SPELLS = [
  { id: 'haste',     level: 4,  icon: '⚡', name: 'Haste',       cost: { meat: 40 }, cd: 90,
    desc: 'Double attack speed for 10 s.' },
  { id: 'powerDash', level: 5,  icon: '💨', name: 'Power Dash',  cost: { meat: 45 }, cd: 25,
    desc: 'Dash forward, dealing 40 damage to everything in your path.' },
  { id: 'heal',      level: 6,  icon: '💚', name: 'Mend Wounds', cost: { meat: 50 }, cd: 60,
    desc: 'Instantly restore 50 health.' },
  { id: 'stunDash',  level: 7,  icon: '🌪️', name: 'Stun Dash',   cost: { meat: 70 }, cd: 35,
    desc: 'Dash that damages (30) and stuns enemies for 3 s.' },
  { id: 'shockwave', level: 8,  icon: '💥', name: 'Shockwave',   cost: { meat: 85 }, cd: 45,
    desc: 'Blast all nearby enemies: 25 damage + knockback.' },
  { id: 'frostNova', level: 9,  icon: '❄️', name: 'Frost Nova',  cost: { meat: 100 }, cd: 50,
    desc: 'Freeze all nearby enemies for 4 s.' },
  { id: 'rage',      level: 10, icon: '😡', name: 'Rage',        cost: { meat: 120 }, cd: 90,
    desc: '+50% damage for 12 s.' },
];

export const spellById = (id) => SPELLS.find(s => s.id === id);

// ---- Trainable stat tracks: 10 tiers each, tier N needs player level N.
// Costs scale quadratically and are steep on purpose — training is a heavy
// long-term meat investment, not something you can rush early. ----
export const STAT_TRACKS = [
  { id: 'range', icon: '📏', name: 'Range Training', max: 10,
    desc: '+2 m bow range, +0.1 m melee reach per level. Level 10 reaches across the whole screen.',
    cost: (t) => ({ meat: 25 * t * t, ...(t >= 3 ? { wood: 10 * (t - 2) } : {}) }) },
  { id: 'power', icon: '💪', name: 'Power Training', max: 10,
    desc: '+5% weapon damage per level.',
    cost: (t) => ({ meat: 28 * t * t, ...(t >= 3 ? { wood: 12 * (t - 2) } : {}) }) },
  { id: 'swift', icon: '🤺', name: 'Swift Hands', max: 10,
    desc: '+4% attack speed per level.',
    cost: (t) => ({ meat: 26 * t * t, ...(t >= 3 ? { wood: 11 * (t - 2) } : {}) }) },
];

// ==========================================================================
// Survival camp — buildings around the cave mouth. Your "home" upgrades
// through the ages (Hide Tent → Wooden Cabin → Stone House) and gates gear;
// the other buildings add utility. Stored chest resources survive death.
// ==========================================================================
export const CAMP_BUILDINGS = [
  // your HOME is the cave itself — upgrading it advances the whole era.
  // (10 ages planned; the first 5 are in, age 5 = the medieval keep)
  { id: 'home', icon: '⛺', max: 4,
    names: ['Hide Tent', 'Wooden Cabin', 'Stone House', 'Medieval Keep'],
    levels: [
      { level: 2, cost: { hide: 6, wood: 10 },
        desc: 'Age 2 — a hide tent by the cave mouth. Unlocks hide clothing.' },
      { level: 4, cost: { wood: 60, stone: 10 },
        desc: 'Age 3 — a timber cabin. Unlocks bows. +15 max health.' },
      { level: 7, cost: { stone: 80, wood: 30, iron: 6 },
        desc: 'Age 4 — an iron-age stone house. +40 max health.' },
      { level: 9, cost: { stone: 200, wood: 150, iron: 30, hide: 20, meat: 100 },
        desc: 'Age 5 — a MEDIEVAL KEEP. Unlocks knightly gear. +80 max health.' },
    ] },
  { id: 'chest', icon: '📦', max: 1,
    names: ['Storage Chest'],
    levels: [
      { level: 3, cost: { wood: 25 },
        desc: 'Store resources safely — whatever is in the chest survives your death.' },
    ] },
  { id: 'furnace', icon: '🔥', max: 1,
    names: ['Stone Furnace'],
    levels: [
      { level: 5, cost: { stone: 40, wood: 15 },
        desc: 'Smelts iron: automatically turns 4 🪨 into 1 🔩 every 20 s. Unlocks the iron age.' },
    ] },
  { id: 'boat', icon: '🛶', max: 1,
    names: ['Log Boat'],
    levels: [
      { level: 4, cost: { wood: 30, hide: 4 },
        desc: 'Lets you paddle across lakes — treasure islands await.' },
    ] },
  { id: 'tower', icon: '🗼', max: 1,
    names: ['Guard Tower'],
    levels: [
      { level: 8, cost: { wood: 60, stone: 40, iron: 10 },
        desc: 'Watches over your camp: automatically shoots enemies that come near home.' },
    ] },
  { id: 'grave', icon: '🪦', max: 1,
    names: ['Graveyard'],
    levels: [
      { level: 5, cost: { stone: 30, wood: 20, meat: 20 },
        desc: 'A remote respawn shrine, built WHERE YOU STAND. When you die you choose: wake at the cave or at the graveyard.' },
    ] },
];

// era = how far your home has advanced (10 ages planned, 5 coded so far)
export const ERAS = ['Stone Age', 'Hide Camp', 'Timber Age', 'Iron Age', 'Medieval'];

// ---- Multiplayer ----
// PvP duels happen in an arena parked outside the world circle.
export const ARENA = { x: 0, z: 700, r: 17 };
export const PVP_INTERVALS = [1, 2, 3, 4, 5, 10]; // minutes between duels
export const ARENA_RETURN_DELAY = 5;              // seconds after the kill
export const arenaReward = (loserLevel) => ({
  meat: 50 + 15 * loserLevel,
  xp: 120 + 50 * loserLevel,
});

// ==========================================================================
// MOBA mode — three-lane map, two bases, buildable creep dens & towers.
// Same assets/items/spells as survival; the map is a square jungle.
// ==========================================================================
export const MOBA = {
  half: 150,                    // square map: x,z ∈ [-150, 150]
  baseHp: 1500,
  basePos: { player: { x: -118, z: 118 }, enemy: { x: 118, z: -118 } },
  baseR: 16,                    // clear radius around each base
  // lane waypoints from the PLAYER base to the ENEMY base
  lanes: {
    mid: [[-104, 104], [-52, 52], [0, 0], [52, -52], [104, -104]],
    top: [[-110, 96], [-118, 40], [-114, -40], [-96, -110], [-40, -118], [40, -114], [96, -110]],
    bot: [[-96, 110], [-40, 114], [40, 118], [96, 110], [114, 40], [118, -40], [110, -96]],
  },
  waveInterval: 60,             // seconds between creep waves
  towerSlotsT: [0.14, 0.27, 0.40], // tower positions as fractions of a lane (own half)
  tower: { hp: 400, dmg: 22, range: 13, cd: 1.1 },
  // neutral jungle camps (type lists reuse ENEMY_TYPES); respawn in seconds
  camps: [
    // starter camps right outside each base so the first prey is visible
    { x: -80, z: 62,  types: ['rat', 'rat', 'spider'], respawn: 50 },
    { x: -62, z: 80,  types: ['rat', 'spider'], respawn: 50 },
    { x: 80,  z: -62, types: ['rat', 'rat', 'spider'], respawn: 50 },
    { x: 62,  z: -80, types: ['rat', 'spider'], respawn: 50 },
    { x: -52, z: 22,  types: ['spider', 'spider', 'rat'], respawn: 60 },
    { x: -22, z: 52,  types: ['spider', 'spider', 'rat'], respawn: 60 },
    { x: 52,  z: -22, types: ['spider', 'spider', 'rat'], respawn: 60 },
    { x: 22,  z: -52, types: ['spider', 'spider', 'rat'], respawn: 60 },
    { x: -68, z: -28, types: ['wolf', 'wolf'], respawn: 80 },
    { x: 68,  z: 28,  types: ['wolf', 'wolf'], respawn: 80 },
    { x: -30, z: -68, types: ['boar', 'boar'], respawn: 95 },
    { x: 30,  z: 68,  types: ['boar', 'boar'], respawn: 95 },
    { x: -62, z: -62, types: ['bear'], respawn: 130 },
    { x: 62,  z: 62,  types: ['bear'], respawn: 130 },
    { x: 0,   z: 74,  types: ['elk', 'snake'], respawn: 90 },
    { x: 0,   z: -74, types: ['elk', 'snake'], respawn: 90 },
    { x: -74, z: 0,   types: ['venomspider', 'snake'], respawn: 90 },
    { x: 74,  z: 0,   types: ['venomspider', 'snake'], respawn: 90 },
  ],
};

// creep stats per tier (den levels unlock stronger mixes); forge multiplies
export const CREEP_TYPES = {
  wolf: { hp: 60,  dmg: 9,  speed: 6.5, range: 1.6, cd: 1.0, xp: 8,  meat: 1, hitR: 0.8 },
  boar: { hp: 110, dmg: 15, speed: 6.0, range: 1.7, cd: 1.2, xp: 14, meat: 2, hitR: 0.9 },
  bear: { hp: 220, dmg: 24, speed: 5.0, range: 2.0, cd: 1.5, xp: 22, meat: 3, hitR: 1.2 },
};
// wave composition by den level (1..5)
export const DEN_WAVES = [
  ['wolf', 'wolf'],
  ['wolf', 'wolf', 'wolf'],
  ['wolf', 'wolf', 'wolf', 'boar'],
  ['wolf', 'wolf', 'boar', 'boar'],
  ['wolf', 'wolf', 'boar', 'boar', 'bear'],
];

export const MOBA_BUILDINGS = [
  { id: 'den',   icon: '🏚️', name: 'Creep Den',     perLane: true, max: 5,
    cost: (lvl) => ({ meat: 30 + lvl * 30, wood: 15 + lvl * 20 }),
    desc: 'Lane building. Sends a creep wave down its lane every 60 s. Each level adds bigger, stronger waves.' },
  { id: 'tower', icon: '🗼', name: 'Watchtower',    perLane: true, max: 3,
    cost: (n) => ({ meat: 45 + n * 30, wood: 50 + n * 35 }),
    desc: 'Defensive turret on your half of the lane. Fires bolts at enemy creeps and heroes.' },
  { id: 'forge', icon: '⚒️', name: 'War Forge',     perLane: false, max: 5,
    cost: (lvl) => ({ meat: 50 + lvl * 45, wood: 40 + lvl * 35 }),
    desc: '+15% damage and health for ALL your creeps per level.' },
  { id: 'lodge', icon: '🏕️', name: 'Hunting Lodge', perLane: false, max: 5,
    cost: (lvl) => ({ meat: 40 + lvl * 40 }),
    desc: 'Passive income: +2 meat every 10 s per level.' },
  { id: 'walls', icon: '🧱', name: 'Base Walls',    perLane: false, max: 3,
    cost: (lvl) => ({ meat: 60 + lvl * 40, wood: 80 + lvl * 50 }),
    desc: '+500 base health per level (also repairs 250 on build).' },
];

// singleplayer AI opponent build timeline: [time s, action, lane?]
export const MOBA_AI_TIMELINE = [
  [50,  'den', 'mid'], [140, 'den', 'bot'], [230, 'den', 'top'],
  [170, 'tower', 'mid'], [290, 'tower', 'bot'], [410, 'tower', 'top'],
  [320, 'den', 'mid'], [440, 'den', 'bot'], [500, 'forge'], [560, 'den', 'mid'],
  [620, 'tower', 'mid'], [680, 'den', 'top'], [740, 'forge'], [800, 'den', 'bot'],
  [860, 'walls'], [920, 'den', 'mid'], [980, 'forge'], [1040, 'den', 'top'],
];

// Shop groups (tabs).
export const SHOP_GROUPS = [
  { key: 'weapons',  label: '⚔️ Weapons',   items: () => ITEMS.filter(i => i.slot === 'weapon' && !i.free) },
  { key: 'armor',    label: '🛡️ Clothing',  items: () => ITEMS.filter(i => ['head', 'chest', 'boots'].includes(i.slot)) },
  { key: 'friends',  label: '🐾 Companions', items: () => ITEMS.filter(i => ['pet', 'orb'].includes(i.slot)) },
  { key: 'spells',   label: '📖 Spells',    items: () => SPELLS },
  { key: 'training', label: '📈 Training',  items: () => STAT_TRACKS },
];
