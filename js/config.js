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
    enemies: ['rat', 'spider', 'snake', 'thornling'], humanoids: ['bandit'], packs: null, treeDensity: 1.0, denseForests: true,
    critters: ['rabbit', 'rabbit', 'rabbit', 'sheep'] },
  { name: 'Scorched Desert', rMax: 1200, ground: 0xd8b878, ground2: 0xc9a860, dirt: 0xb89050,
    fog: 0xe8d8b0, sky: 0xbcd8e8, desert: true,
    foliage: [0x8a9a5a, 0x7a8a4a, 0x9aaa6a], trunk: 0x8a6b42,
    trees: { pine: 0, leafy: 0.1, birch: 0, dead: 0.9 }, snowy: false,
    grass: 0xc9b878, flowers: false, mushrooms: false,
    enemies: ['scorpion', 'cobra', 'vulture', 'snake'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.85, 0.15, 0] }, treeDensity: 0.3,
    critters: ['rabbit', 'rabbit'] },
  { name: 'Dark Forest',    rMax: 2000, ground: 0x2c4a24, ground2: 0x24401f, dirt: 0x4a3a24,
    fog: 0x2e3c2c, sky: 0x2c3a44, darkness: 0.62, light: 0.5,
    foliage: [0x1e4a22, 0x27552a, 0x1a3f2e], trunk: 0x4c3520,
    trees: { pine: 0.55, leafy: 0.25, birch: 0, dead: 0.2 }, snowy: false,
    grass: 0x44663a, flowers: false, mushrooms: true,
    enemies: ['spider', 'snake', 'wolf', 'venomspider', 'bat'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.7, 0.3, 0] }, treeDensity: 1.3, denseForests: true,
    spiderHaunt: true, webField: true, critters: ['rabbit', 'horse'] },
  { name: 'Murky Swamp',    rMax: 2900, ground: 0x565c30, ground2: 0x4a5230, dirt: 0x3a3c28,
    fog: 0x3c4a44, sky: 0x3a4650, darkness: 0.4, light: 0.62,
    foliage: [0x3a5a30, 0x2e4a2a, 0x4a6438], trunk: 0x453a28,
    trees: { pine: 0.2, leafy: 0.5, birch: 0, dead: 0.3 }, snowy: false,
    grass: 0x60704a, flowers: false, mushrooms: true,
    enemies: ['snake', 'venomspider', 'stormsnake', 'boar', 'bogCrawler'], humanoids: ['tribesman', 'shaman'], packs: { skulls: [0.5, 0.4, 0.1] }, treeDensity: 0.9, denseForests: true,
    critters: ['horse'] },
  { name: 'Highlands',      rMax: 3800, ground: 0x9a8a50, ground2: 0xa89658, dirt: 0xa8874f,
    fog: 0xc9c0a0, sky: 0x9db4c4,
    foliage: [0x5c6e33, 0x6d7d3a, 0x4e5e2c], trunk: 0x5c4a33,
    trees: { pine: 0.5, leafy: 0.1, birch: 0.1, dead: 0.3 }, snowy: false,
    grass: 0x8f9060, flowers: false, mushrooms: false,
    enemies: ['wolf', 'boar', 'elk', 'venomspider', 'stormsnake', 'harpy'], humanoids: ['poacher'], packs: { skulls: [0.4, 0.4, 0.2] }, treeDensity: 0.7,
    critters: ['rabbit', 'rabbit', 'sheep', 'horse'] },
  { name: 'Haunted Forest', rMax: 4700, ground: 0x3a3a44, ground2: 0x32323c, dirt: 0x4c4258,
    fog: 0x3c3850, sky: 0x363044, darkness: 0.75, light: 0.48,
    foliage: [0x2a3a28, 0x1e2e20, 0x3a3448], trunk: 0x3a3230,
    trees: { pine: 0.3, leafy: 0.1, birch: 0, dead: 0.6 }, snowy: false,
    grass: 0x5c6650, flowers: false, mushrooms: true,
    enemies: ['zombie', 'bat', 'venomspider', 'wolf', 'treant', 'elk', 'ghost'], humanoids: ['shaman', 'poacher'], packs: { skulls: [0.3, 0.45, 0.25] }, treeDensity: 1.1, denseForests: true,
    spiderHaunt: true, critters: ['horse'] },
  { name: 'Jungle',         rMax: 5100, ground: 0x2f8a28, ground2: 0x3a9c32, dirt: 0x7a6030,
    fog: 0x8ac878, sky: 0x8cc8e0,
    foliage: [0x1f6b2a, 0x2d8a34, 0x39a03e], trunk: 0x5a4426,
    trees: { pine: 0.1, leafy: 0.7, birch: 0.2, dead: 0 }, snowy: false,
    grass: 0x4f8f3a, flowers: true, mushrooms: true,
    enemies: ['stormsnake', 'boar', 'bear', 'harpy', 'bogCrawler', 'snapper', 'panther'], humanoids: ['tribesman'], packs: { skulls: [0.2, 0.5, 0.3] }, treeDensity: 1.6, denseForests: true,
    critters: ['rabbit', 'sheep', 'horse'] },
  { name: 'Frozen Peak',    rMax: 99999, ground: 0xf2f6fa, ground2: 0xe4ecf3, dirt: 0xc9d6e1,
    fog: 0xf4f8fc, sky: 0xdfe9f2,
    foliage: [0x8fb0c0, 0x3d6155, 0xcfdfe8], trunk: 0x3d3229,
    trees: { pine: 0.7, leafy: 0, birch: 0, dead: 0.3 }, snowy: true,
    grass: 0xdde7ee, flowers: false, mushrooms: false,
    enemies: ['icewolf', 'icespider', 'wendigo', 'yeti', 'icegolem', 'frostWisp'], packs: { skulls: [0, 0.5, 0.5] }, treeDensity: 0.5,
    critters: ['horse'] },
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
export const RESOURCES = ['meat', 'wood', 'stone', 'hide', 'iron', 'berry', 'wool', 'essence'];
export const RES_ICONS = { meat: '🍖', wood: '🪵', stone: '🪨', hide: '🟫', iron: '🔩', berry: '🫐', wool: '🧶', essence: '🧪' };
// Ethereal Essence drops from creatures of the Dark Forest and beyond —
// deeper rings drop it more often and in bigger gulps.
export const essenceDropFor = (biomeIndex) => {
  if (biomeIndex < 1) return 0;
  if (Math.random() >= 0.12 + (biomeIndex - 1) * 0.09) return 0;
  return 1 + Math.floor((biomeIndex - 1) / 2);
};
// resources come in tenths (hide scraps); ×10/÷10 keeps whole numbers exact
export const roundResource = (value) => Math.round((Number(value) || 0) * 10) / 10;
export const fmtResource = (value) => {
  const r = roundResource(value);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// hide drops only from animals that realistically have one
export const HIDE_BEARING = new Set(['wolf', 'boar', 'elk', 'bear', 'icewolf', 'wendigo', 'yeti']);
export const hideForHp = (hp) => Math.max(1, Math.round(hp / 430)); // hp x5.4 total, hides didn't
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
             hp: 1,   dmg: 0,  speed: 7.5, range: 0,   attackCd: 1.0, xp: 1,  meat: 1, hitR: 0.35, aggro: 0,
             passive: true, herd: [3, 10] },
  sheep:  { name: 'Sheep', icon: '🐑',
             hp: 40,  dmg: 0,  speed: 3.5, range: 0,   attackCd: 1.0, xp: 4,  hitR: 0.6, aggro: 0,
             passive: true, herd: [10, 20], guardian: 'wolf' },
  horse:   { name: 'Wild Horse', icon: '🐴',
             hp: 120, dmg: 0,  speed: 10.5, range: 0,  attackCd: 1.0, xp: 6,  meat: 2, hitR: 0.8, aggro: 0,
             passive: true, herd: [4, 9] }, // saddle one (E) and RIDE it
  rat:     { name: 'Giant Rat', icon: '🐀',
             hp: 65,  dmg: 4,  speed: 5, range: 1.2, attackCd: 0.9, xp: 5,  meat: 1, hitR: 0.5,  aggro: 13 },
  spider:  { name: 'Forest Spider', icon: '🕷️',
             hp: 110,  dmg: 6,  speed: 6, range: 1.3, attackCd: 1.0, xp: 8,  meat: 1, hitR: 0.7,  aggro: 13 },
  snake:   { name: 'Grass Snake', icon: '🐍',
             hp: 85,  dmg: 8,  speed: 4.5, range: 1.5, attackCd: 1.3, xp: 10, meat: 1, hitR: 0.6,  aggro: 12 },
  // -- Desert (2nd ring) --
  scorpion: { name: 'Sand Scorpion', icon: '🦂',
             hp: 150, dmg: 9,  speed: 6,   range: 1.4, attackCd: 1.1, xp: 8,  meat: 1, hitR: 0.55, aggro: 14,
             poison: { dps: 2, dur: 3 } }, // a venomous sting
  cobra:   { name: 'Spitting Cobra', icon: '🐍',
             hp: 130, dmg: 7,  meleeDmg: 6, speed: 5,  range: 1.4, attackCd: 1.2, xp: 9, meat: 1, hitR: 0.55, aggro: 15,
             ranged: true, shootRange: 8, spellCd: 2.4, projectileSpeed: 18, shotColor: 0xc9e05a },
  vulture: { name: 'Desert Vulture', icon: '🦅',
             hp: 105, dmg: 6,  speed: 11,  range: 1.4, attackCd: 1.1, xp: 7,  meat: 1, hitR: 0.55, aggro: 16, flying: true },
  // -- Dark Forest --
  wolf:    { name: 'Black Wolf', icon: '🐺',
             hp: 245,  dmg: 10, speed: 9.5, range: 1.6, attackCd: 1.0, xp: 15, meat: 2, hitR: 0.8,  aggro: 16, behavior: 'pack' },
  venomspider: { name: 'Venom Spider', icon: '☣️',
             hp: 300,  dmg: 11, meleeDmg: 7, speed: 6.5, range: 1.4, attackCd: 1.1, xp: 20, meat: 2, hitR: 0.8, aggro: 18,
             ranged: true, shootRange: 8.5, spellCd: 2.5, projectileSpeed: 15, shotColor: 0x8aff3a, behavior: 'kite' },
  bat:     { name: 'Cave Bat', icon: '🦇',
             hp: 95,  dmg: 6,  speed: 11, range: 1.4, attackCd: 1.1, xp: 12, meat: 1, hitR: 0.6,  aggro: 18, flying: true },
  // -- Haunted Forest --
  zombie:  { name: 'Zombie', icon: '🧟',
             hp: 485,  dmg: 14, speed: 4, range: 1.7, attackCd: 1.3, xp: 28, meat: 2, hitR: 0.85, aggro: 19,
             poison: { dps: 2, dur: 4 } }, // rotting claws fester — Haunted Forest hazard
  // -- Highlands --
  boar:    { name: 'Wild Boar', icon: '🐗',
             hp: 430,  dmg: 16, speed: 8, range: 1.7, attackCd: 1.1, xp: 25, meat: 3, hitR: 0.9,  aggro: 14 },
  elk:     { name: 'Mad Elk', icon: '🦌',
             hp: 595, dmg: 20, speed: 10.5, range: 1.9, attackCd: 1.4, xp: 32, meat: 4, hitR: 1.0,  aggro: 14 },
  stormsnake: { name: 'Storm Serpent', icon: '⚡',
             hp: 380,  dmg: 8,  meleeDmg: 9, speed: 5.5, range: 1.5, attackCd: 1.2, xp: 28, meat: 3, hitR: 0.6, aggro: 18,
             ranged: true, shootRange: 10, spellCd: 3.0, projectileSpeed: 30, shotColor: 0xffe94a, stun: 1.2 },
  // -- Ice creatures (Frozen Peak) --
  icewolf: { name: 'Ice Wolf', icon: '❄️',
             hp: 650, dmg: 18, speed: 10, range: 1.6, attackCd: 0.9, xp: 35, meat: 4, hitR: 0.8,  aggro: 17, behavior: 'pack' },
  icespider: { name: 'Frost Spider', icon: '🕸️',
             hp: 540, dmg: 16, meleeDmg: 10, speed: 7, range: 1.4, attackCd: 1.1, xp: 30, meat: 3, hitR: 0.8, aggro: 18,
             ranged: true, shootRange: 9, spellCd: 2.2, projectileSpeed: 17, shotColor: 0x8ae0ff, behavior: 'kite' },
  bear:    { name: 'Grizzly Bear', icon: '🐻',
             hp: 970, dmg: 26, speed: 8.5, range: 2.1, attackCd: 1.5, xp: 45, meat: 5, hitR: 1.2,  aggro: 16, behavior: 'heavy' },
  // -- Frozen Peak --
  wendigo: { name: 'Wendigo', icon: '👹',
             hp: 1190, dmg: 30, speed: 11, range: 2.0, attackCd: 1.2, xp: 55, meat: 6, hitR: 0.9,  aggro: 20 },
  yeti:    { name: 'Yeti', icon: '🏔️',
             hp: 1890, dmg: 40, speed: 9, range: 2.5, attackCd: 1.7, xp: 70, meat: 8, hitR: 1.5,  aggro: 18, behavior: 'heavy' },
  // -- humanoids: bandits, tribes & other two-legged trouble. Rarer than
  // beasts, and they travel in small camps (2-5 together). --
  bandit:  { name: 'Bandit', icon: '🏹',
             hp: 90,  dmg: 7,  meleeDmg: 5, speed: 6, range: 1.4, attackCd: 1.2, xp: 10, meat: 1, hitR: 0.55, aggro: 15,
             humanoid: true, ranged: true, shootRange: 9, spellCd: 2.2, projectileSpeed: 22, shotColor: 0xd8b878 },
  banditBrute: { name: 'Bandit Brute', icon: '🪓',
             hp: 280, dmg: 13, speed: 6.5, range: 1.7, attackCd: 1.2, xp: 22, meat: 2, hitR: 0.8, aggro: 15,
             humanoid: true },
  tribesman: { name: 'Wild Tribesman', icon: '🪃',
             hp: 400, dmg: 14, meleeDmg: 10, speed: 7, range: 1.5, attackCd: 1.1, xp: 28, meat: 2, hitR: 0.6, aggro: 16,
             humanoid: true, ranged: true, shootRange: 9.5, spellCd: 2.4, projectileSpeed: 24, shotColor: 0xc96f3a },
  shaman:  { name: 'Bog Shaman', icon: '🔮',
             hp: 320, dmg: 12, meleeDmg: 8, speed: 5, range: 1.4, attackCd: 1.3, xp: 30, meat: 2, hitR: 0.6, aggro: 17,
             humanoid: true, ranged: true, shootRange: 10, spellCd: 2.8, projectileSpeed: 16, shotColor: 0xb26fff },
  poacher: { name: 'Poacher', icon: '🎯',
             hp: 450, dmg: 16, meleeDmg: 11, speed: 6.5, range: 1.5, attackCd: 1.2, xp: 30, meat: 2, hitR: 0.6, aggro: 18,
             humanoid: true, ranged: true, shootRange: 11, spellCd: 2.6, projectileSpeed: 26, shotColor: 0xd8d0b0 },
  // -- new beasts --
  thornling: { name: 'Thornling', icon: '🌿',
             hp: 70,  dmg: 6,  meleeDmg: 4, speed: 4, range: 1.2, attackCd: 1.2, xp: 8,  meat: 1, hitR: 0.5, aggro: 12,
             ranged: true, shootRange: 8, spellCd: 2.6, projectileSpeed: 14, shotColor: 0x7fce4f },
  treant:  { name: 'Treant', icon: '🌳',
             hp: 520, dmg: 18, speed: 4.5, range: 1.9, attackCd: 1.5, xp: 32, meat: 2, hitR: 1.1, aggro: 13, behavior: 'heavy' },
  bogCrawler: { name: 'Bog Crawler', icon: '🦀',
             hp: 380, dmg: 15, speed: 7, range: 1.5, attackCd: 1.1, xp: 26, meat: 3, hitR: 0.8, aggro: 15 },
  harpy:   { name: 'Harpy', icon: '🦅',
             hp: 380, dmg: 14, meleeDmg: 9, speed: 10, range: 1.5, attackCd: 1.1, xp: 30, meat: 2, hitR: 0.7, aggro: 18,
             flying: true, ranged: true, shootRange: 8, spellCd: 2.5, projectileSpeed: 20, shotColor: 0xe8e0c0 },
  frostWisp: { name: 'Frost Wisp', icon: '💠',
             hp: 500, dmg: 20, meleeDmg: 8, speed: 6, range: 1.2, attackCd: 1.4, xp: 40, meat: 1, hitR: 0.6, aggro: 16,
             flying: true, ranged: true, shootRange: 10, spellCd: 2.2, projectileSpeed: 18, shotColor: 0x9fe8ff },
  snapper: { name: 'Snapjaw Bloom', icon: '🪷',
             hp: 640, dmg: 22, speed: 0, range: 2.3, attackCd: 1.0, xp: 30, meat: 1, hitR: 0.8, aggro: 6 },
  icegolem: { name: 'Ice Golem', icon: '🗿',
             hp: 2160, dmg: 45, meleeDmg: 30, speed: 4, range: 2.2, attackCd: 1.8, xp: 80, meat: 9, hitR: 1.4, aggro: 18,
             ranged: true, shootRange: 10, spellCd: 4.0, projectileSpeed: 13, shotColor: 0xbfe8ff, stun: 0.8 },
  // -- Haunted Forest: restless spirits drift between the dead trees --
  ghost:   { name: 'Restless Ghost', icon: '👻',
             hp: 520, dmg: 18, meleeDmg: 10, speed: 7, range: 1.4, attackCd: 1.3, xp: 42, meat: 0, hitR: 0.7, aggro: 19,
             flying: true, ranged: true, shootRange: 9, spellCd: 3.0, projectileSpeed: 16, shotColor: 0xbfc8ff, stun: 0.7 },
  // -- Jungle: the canopy hides ambush predators --
  panther: { name: 'Shadow Panther', icon: '🐆',
             hp: 900, dmg: 30, speed: 11.5, range: 1.6, attackCd: 0.9, xp: 55, meat: 4, hitR: 0.8, aggro: 24 },
  // -- Griffins: flight-master bosses of the open rings. They never truly
  // die — beaten, they drop their nest and fly beyond the horizon --
  griffin: { name: 'Griffin', icon: '🦅',
             hp: 700, dmg: 26, speed: 3.6, range: 2.0, attackCd: 1.1, xp: 110, meat: 6, hitR: 1.1, aggro: 24,
             flying: true, griffin: true },
  griffinChick: { name: 'Griffin Fledgling', icon: '🐤',
             hp: 260, dmg: 11, speed: 3.8, range: 1.4, attackCd: 1.0, xp: 22, meat: 2, hitR: 0.55, aggro: 22,
             flying: true },
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
export const meatForHp = (hp) => Math.max(1, Math.ceil(hp / 160)); // hp x5.4 total, meat didn't

// Boss "pack mothers" carry NAMES — picked per creature family at spawn.
export const BOSS_NAMES = {
  spider: ['Broodmother Silkfang', 'The Hollow Widow', 'Venomweaver'],
  wolf: ['Greyjaw', 'The Pale Howler', 'Rotfang'],
  snake: ['Old Coilback', 'The Whispering Fang', 'Mirescale'],
  zombie: ['The Shambler King', 'Gravejaw', 'Rotbelly'],
  bear: ['Ironpelt', 'Old Thunderhide'],
  boar: ['Tuskrend', 'The Mud Tyrant'],
  elk: ['Antlered Death', 'The Grey Stag'],
  bat: ['Nightscreech', 'The Rafter Queen'],
  rat: ['The Gutter Matron', 'Plaguewhisker'],
  wendigo: ['The Pale Wendigo', 'Hollowhunger'],
  yeti: ['Frostmaw', 'The White Silence'],
  griffin: ['Skyrend', 'The Dune Talon', 'Stormfeather'],
  ghost: ['The Weeping Shade', 'Hollow Whisper'],
  panther: ['Nightpelt', 'The Silent Death'],
  golem: ['The Frozen Warden', 'Shatterheart'],
};
export function bossNameFor(type, id) {
  const key = Object.keys(BOSS_NAMES).find(k => type.toLowerCase().includes(k)) ?? 'wolf';
  const pool = BOSS_NAMES[key];
  return pool[id % pool.length];
}

// Cumulative XP required to reach each level (index = level).
export const XP_LEVELS = [0, 0, 40, 110, 220, 380, 600, 880, 1230, 1660, 2200,
  2850, 3620, 4520, 5560]; // levels 11-14 continue the curve
export const MAX_LEVEL = 14;

// quest XP scale: fraction of the CURRENT level's xp-to-next a quest pays,
// front-loaded hard (a lvl-1 quest levels you outright, endgame quests are
// a nudge). Index by player level; past the table it stays at 1%.
export const QUEST_XP_PCT = [0, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];
export function questXpFor(level) {
  const pct = QUEST_XP_PCT[Math.min(level, QUEST_XP_PCT.length - 1)] ?? 0.01;
  const span = (XP_LEVELS[Math.min(level + 1, XP_LEVELS.length - 1)] ?? 0) - (XP_LEVELS[level] ?? 0);
  return Math.max(1, Math.round(span * pct));
}

// ---- Equippable items (WoW-style slots). Bought in the shop or dropped by
// pack bosses. Only ONE weapon is wielded at a time — Q cycles owned weapons. ----
export const SLOTS = ['weapon', 'head', 'chest', 'boots', 'charm', 'companion'];
export const SLOT_LABELS = { weapon: 'Weapon', head: 'Head', chest: 'Chest', boots: 'Boots', charm: 'Charm', companion: 'Companion' };

// Gear progresses through the ages. `needs` gates an item behind a camp
// building (survival): 'tent' → Hide Tent, 'cabin' → Wooden Cabin,
// 'furnace' → Stone Furnace (iron age).
export const ITEMS = [
  // -- weapons: melee (chop = tree felling & rock mining power) --
  { id: 'fists',      slot: 'weapon', level: 1, icon: '🖐️', name: 'Bare Hands',   cost: null, free: true,
    weapon: { kind: 'melee', dmg: 12, cd: 0.64, range: 1.5, chop: 0, mine: 0, tier: 0 },
    desc: 'Punch things. Bare hands can\'t fell trees or mine — craft tools!' },
  { id: 'club',       slot: 'weapon', level: 2, icon: '🦴', name: 'Bone Club',   cost: { meat: 10 },
    weapon: { kind: 'melee', dmg: 22, cd: 0.71, range: 1.7, chop: 0.5, mine: 0, tier: 1 },
    desc: 'A heavy beast bone. Damage 22; fells trees, but SLOWLY.' },
  { id: 'stoneAxe',   slot: 'weapon', level: 3, icon: '🪓', name: 'Stone Axe',     cost: { wood: 12, stone: 10 },
    weapon: { kind: 'melee', dmg: 38, cd: 0.71, range: 1.8, chop: 2, mine: 0, tier: 1 },
    desc: 'Knapped stone on a haft. Damage 38, chops trees FAST.' },
  { id: 'steelAxe',   slot: 'weapon', level: 6, icon: '⚒️', name: 'Iron Axe',      cost: { wood: 18, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', dmg: 68, cd: 0.69, range: 1.9, chop: 3, mine: 0, tier: 2 },
    desc: 'Smelted iron head. Damage 68, tears through any tree.' },
  { id: 'warAxe',     slot: 'weapon', level: 8, icon: '🔥', name: 'War Axe',       cost: { wood: 25, iron: 16, hide: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', dmg: 120, cd: 0.69, range: 2.0, chop: 4, mine: 0, tier: 3 },
    desc: 'Iron-age battle axe. Damage 120.' },
  // -- tools: pickaxes are the ONLY way to mine rock --
  { id: 'bonePick',   slot: 'weapon', level: 3, icon: '⛏️', name: 'Bone Pickaxe',  cost: { wood: 10, hide: 2, meat: 8 },
    weapon: { kind: 'melee', dmg: 20, cd: 0.79, range: 1.7, chop: 0, mine: 1, tier: 1, pick: true },
    desc: 'Carved from a beast\'s bones. Mines rock (slowly); a clumsy weapon (20 dmg).' },
  { id: 'ironPick',   slot: 'weapon', level: 6, icon: '⚒️', name: 'Iron Pickaxe',  cost: { wood: 15, iron: 8 }, needs: 'furnace',
    weapon: { kind: 'melee', dmg: 55, cd: 0.71, range: 1.8, chop: 0.5, mine: 2.5, tier: 2, pick: true },
    desc: 'Bites deep into stone — rocks crack in two swings. Damage 55.' },
  { id: 'obsidianPick', slot: 'weapon', level: 9, icon: '⛏️', name: 'Obsidian Pickaxe', cost: { iron: 18, stone: 30, essence: 6 }, needs: 'keep',
    weapon: { kind: 'melee', dmg: 100, cd: 0.69, range: 1.9, chop: 1, mine: 4, tier: 3, pick: true },
    desc: 'Volcanic glass edge — rocks SHATTER in one swing. Damage 100.' },
  { id: 'huntSpear',  slot: 'weapon', level: 5, icon: '🔱', name: 'Hunting Spear', cost: { wood: 20, stone: 8, hide: 3 },
    weapon: { kind: 'melee', dmg: 52, cd: 0.79, range: 2.6, chop: 0, mine: 0, tier: 1 },
    desc: 'Long reach keeps claws away: damage 52 at 2.6 m.' },
  // -- weapons: ranged (invented with the Wooden Cabin era; train Range to extend) --
  { id: 'huntingBow', slot: 'weapon', level: 4, icon: '🏹', name: 'Hunting Bow',   cost: { wood: 25, hide: 4 }, needs: 'cabin',
    weapon: { kind: 'bow', dmg: 16, cd: 1.07, range: 3.5, pierce: false, tier: 1 },
    desc: 'Wood + hide string. Arrows for 16 dmg, barely 3.5 m of reach.' },
  { id: 'longbow',    slot: 'weapon', level: 6, icon: '🎯', name: 'Longbow',       cost: { wood: 40, hide: 8, iron: 4 }, needs: 'furnace',
    weapon: { kind: 'bow', dmg: 32, cd: 0.89, range: 7, pierce: false, tier: 2 },
    desc: 'Iron-tipped arrows, damage 32, reach 7 m.' },
  { id: 'recurveBow', slot: 'weapon', level: 7, icon: '🏹', name: 'Recurve Bow',   cost: { wood: 45, hide: 10, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'bow', dmg: 26, cd: 0.69, range: 8.5, pierce: false, tier: 2 },
    desc: 'Snappy recurve limbs: fast 26-damage arrows, reach 8.5 m.' },
  { id: 'rapidBow',   slot: 'weapon', level: 8, icon: '🌀', name: 'Windstorm Bow', cost: { wood: 45, iron: 14, hide: 10 }, needs: 'furnace',
    weapon: { kind: 'bow', dmg: 30, cd: 0.5, range: 10, pierce: true, tier: 3 },
    desc: 'Very fast piercing arrows, reach 10 m.' },
  // -- medieval (Age 5, needs the Keep) --
  { id: 'steelSword', slot: 'weapon', level: 9, icon: '⚔️', name: 'Knight\'s Sword', cost: { iron: 25, wood: 10, hide: 8 }, needs: 'keep',
    weapon: { kind: 'melee', dmg: 150, cd: 0.6, range: 2.1, chop: 1.5, mine: 0, tier: 3 },
    desc: 'Medieval steel. Damage 150, lightning-fast swings (a poor lumber tool).' },
  { id: 'crossbow',   slot: 'weapon', level: 9, icon: '🎯', name: 'Crossbow',       cost: { wood: 50, iron: 20 }, needs: 'keep',
    weapon: { kind: 'bow', dmg: 60, cd: 1.29, range: 12, pierce: true, tier: 3 },
    desc: 'Medieval war machine. Piercing bolts for 60 damage.' },
  // -- head (crafted from hides at the tent) --
  { id: 'leatherCap', slot: 'head', level: 3, icon: '🧢', name: 'Hide Cap',      cost: { hide: 4, meat: 10 }, needs: 'tent', stats: { hp: 25 },
    desc: '+25 max health.' },
  { id: 'boneHelm',   slot: 'head', level: 5, icon: '🦴', name: 'Bone Helm',     cost: { hide: 6, meat: 20 }, needs: 'tent', stats: { hp: 45, regen: 0.2 },
    desc: '+45 max health, +0.2 ❤️/s regeneration.' },
  { id: 'furHood',    slot: 'head', level: 6, icon: '🎩', name: 'Fur Hood',      cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { hp: 60, regen: 0.3 },
    desc: '+60 max health, +0.3 ❤️/s regeneration.' },
  { id: 'ironHelm',   slot: 'head', level: 7, icon: '🪖', name: 'Iron Helm',     cost: { iron: 10, hide: 6 }, needs: 'furnace', stats: { hp: 85 },
    desc: '+85 max health.' },
  { id: 'bearHelm',   slot: 'head', level: 9, icon: '⛑️', name: 'Bearskull Helm', cost: { hide: 18, iron: 8, meat: 40 }, needs: 'furnace', stats: { hp: 110, regen: 0.6 },
    desc: '+110 max health, +0.6 ❤️/s regeneration.' },
  // -- chest (you start NAKED with a leaf — clothing is crafted from hides) --
  { id: 'leatherArmor', slot: 'chest', level: 3, icon: '🦺', name: 'Hide Tunic',     cost: { hide: 7, meat: 15 }, needs: 'tent', stats: { hp: 50 },
    desc: '+50 max health. Finally, actual clothes.' },
  { id: 'furCoat',      slot: 'chest', level: 6, icon: '🧥', name: 'Fur Coat',       cost: { hide: 14, meat: 30 }, needs: 'tent', stats: { hp: 100, regen: 0.4 },
    desc: '+100 max health, +0.4 ❤️/s regeneration.' },
  { id: 'ironChest',    slot: 'chest', level: 7, icon: '🥋', name: 'Iron Cuirass',   cost: { iron: 14, hide: 8 }, needs: 'furnace', stats: { hp: 135 },
    desc: '+135 max health.' },
  { id: 'bearHide',     slot: 'chest', level: 9, icon: '🛡️', name: 'Bearhide Plate', cost: { hide: 24, iron: 12, meat: 45 }, needs: 'furnace', stats: { hp: 170, regen: 0.8 },
    desc: '+170 max health, +0.8 ❤️/s regeneration.' },
  // -- boots --
  { id: 'swiftBoots',   slot: 'boots', level: 3, icon: '👢', name: 'Hide Wraps',     cost: { hide: 5, meat: 10 }, needs: 'tent', stats: { speed: 1.5 },
    desc: '+1.5 movement speed.' },
  { id: 'huntersBoots', slot: 'boots', level: 6, icon: '🥾', name: "Hunter's Boots", cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { speed: 2.5 },
    desc: '+2.5 movement speed.' },
  { id: 'ironBoots',    slot: 'boots', level: 7, icon: '🥾', name: 'Iron-Shod Boots', cost: { iron: 8, hide: 6 }, needs: 'furnace', stats: { speed: 3, hp: 35 },
    desc: '+3 movement speed, +35 max health.' },
  { id: 'windBoots',    slot: 'boots', level: 9, icon: '💨', name: 'Windwalkers',    cost: { hide: 14, iron: 8, meat: 40 }, needs: 'furnace', stats: { speed: 4.5, regen: 0.5 },
    desc: '+4.5 movement speed, +0.5 ❤️/s regeneration.' },
  // -- charms (mid-game trinkets — ONE charm slot, pick your bonus) --
  { id: 'wolfPendant', slot: 'charm', level: 5, icon: '🦷', name: 'Wolf-Fang Pendant',
    cost: { hide: 8, meat: 30 }, needs: 'tent', stats: { dmgPct: 0.10 },
    desc: '+10% weapon damage.' },
  { id: 'hawkAmulet', slot: 'charm', level: 7, icon: '🪶', name: 'Hawk-Feather Amulet',
    cost: { hide: 12, iron: 4, meat: 40 }, needs: 'cabin', stats: { aspd: 0.10, regen: 0.3 },
    desc: '+10% attack speed, +0.3 ❤️/s regeneration.' },
  { id: 'copperRing', slot: 'charm', level: 3, icon: '💍', name: 'Copper Ring',
    cost: { stone: 8, meat: 15 }, stats: { regen: 0.3 },
    desc: '+0.3 ❤️/s regeneration — wounds close on their own.' },
  { id: 'bloodAmulet', slot: 'charm', level: 9, icon: '🩸', name: 'Bloodstone Amulet',
    cost: { hide: 15, iron: 10, essence: 10 }, needs: 'furnace', stats: { regen: 1.2, hp: 40 },
    desc: '+1.2 ❤️/s regeneration, +40 max health.' },
  // -- pet (companion) --
  { id: 'tamedWolf', slot: 'companion', level: 4, icon: '🐺', name: 'Tamed Wolf', cost: { meat: 165, essence: 3 }, pet: { dmg: 14 },
    desc: 'A loyal wolf fights by your side (100 HP — train it up in Training).' },
  { id: 'alphaWolf', slot: 'companion', level: 8, icon: '👑', name: 'Alpha Wolf', cost: { meat: 360, essence: 8 }, pet: { dmg: 32 },
    desc: 'A huge alpha. Bites for 32.' },
  // -- orb (guardian sphere — iron-age wonder) --
  { id: 'guardianSphere', slot: 'companion', level: 5,  icon: '🔮', name: 'Guardian Sphere', cost: { meat: 50, stone: 30, iron: 6, essence: 4 }, needs: 'furnace',
    orb: { count: 1, targets: 1, dmg: 12 },
    desc: 'Orbits you and fires bolts at enemies.' },
  { id: 'twinSphere',     slot: 'companion', level: 8,  icon: '✨', name: 'Twin-bolt Sphere', cost: { meat: 90, iron: 14, stone: 40, essence: 8 }, needs: 'furnace',
    orb: { count: 1, targets: 2, dmg: 14 },
    desc: 'Fires two bolts at once (14 dmg each).' },
  { id: 'frostSphere',    slot: 'companion', level: 7,  icon: '❄️', name: 'Frost Sphere',   cost: { meat: 80, stone: 35, essence: 6 }, needs: 'furnace',
    orb: { count: 1, targets: 1, dmg: 22 },
    desc: 'A cold-burning orb: single heavy bolts for 22 damage.' },
  { id: 'duoSphere',      slot: 'companion', level: 10, icon: '🌐', name: 'Gemini Spheres',  cost: { meat: 130, iron: 24, stone: 60, essence: 12 }, needs: 'furnace',
    orb: { count: 2, targets: 2, dmg: 14 },
    desc: 'TWO spheres, each firing twin bolts.' },
  // -- griffin nests: dropped by beaten griffins, never sold or looted
  // (free: true keeps them out of every random loot pool). Click one in the
  // inventory to PLACE it on the ground — a flight-master roost you can fly
  // between (stand next to a placed nest to open the flight map).
  { id: 'desertNest',   slot: 'nest', level: 1, icon: '🪺', name: 'Desert Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 1 },
    desc: 'The Desert griffin\'s nest. Click to place it where you stand (Desert or any earlier ring). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'highlandNest', slot: 'nest', level: 5, icon: '🪺', name: 'Highland Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 4 },
    desc: 'The Highland griffin\'s nest. Click to place it where you stand (Highlands or any earlier ring). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'frozenNest',   slot: 'nest', level: 9, icon: '🪺', name: 'Frozen Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 7 },
    desc: 'The Frozen Peak griffin\'s nest. Click to place it anywhere on solid ground. Stand by a placed nest to call a griffin and fly between your roosts.' },
];

export const itemById = (id) => ITEMS.find(i => i.id === id);

// ---- Consumables: cheap repeatable meat sinks, used with F / G in the field.
export const CONSUMABLES = [
  { id: 'salve', icon: '🧪', name: 'Healing Salve', key: 'F', cost: { berry: 5 },
    heal: 100, desc: 'Brewed from 5 blueberries. Drink with F: restores 100 health.' },
  { id: 'roast', icon: '🍗', name: 'Roasted Meat', key: 'G', cost: { meat: 10 },
    heal: 15, speedDur: 30, desc: 'Eat with G: +15 health and +10% speed for 30 s.' },
  { id: 'honey', icon: '🍯', name: 'Wild Honey', found: true,
    heal: 45, desc: 'Raided from a beehive. Click it in the inventory: +45 health.' },
  { id: 'venom', icon: '☠️', name: 'Snapjaw Venom', found: true, venomDur: 60,
    desc: 'Milked from a carnivorous bloom. Click to coat your weapon: attacks poison for 60 s.' },
];
export const consumableById = (id) => CONSUMABLES.find(c => c.id === id);

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
  { id: 'haste',     level: 4,  icon: '⚡', name: 'Haste',       cost: { meat: 40, essence: 2 }, cd: 90,
    desc: 'Double attack speed for 10 s.' },
  { id: 'powerDash', level: 5,  icon: '💨', name: 'Power Dash',  cost: { meat: 45, essence: 3 }, cd: 25,
    desc: 'Dash forward, dealing 40 damage to everything in your path.' },
  { id: 'heal',      level: 6,  icon: '💚', name: 'Mend Wounds', cost: { meat: 50, essence: 4 }, cd: 60,
    desc: 'Instantly restore 50 health.' },
  { id: 'stunDash',  level: 7,  icon: '🌪️', name: 'Stun Dash',   cost: { meat: 70, essence: 5 }, cd: 35,
    desc: 'Dash that damages (30) and stuns enemies for 3 s.' },
  { id: 'shockwave', level: 8,  icon: '💥', name: 'Shockwave',   cost: { meat: 85, essence: 6 }, cd: 45,
    desc: 'Blast all nearby enemies: 25 damage + knockback.' },
  { id: 'frostNova', level: 9,  icon: '❄️', name: 'Frost Nova',  cost: { meat: 100, essence: 8 }, cd: 50,
    desc: 'Freeze all nearby enemies for 4 s.' },
  { id: 'rage',      level: 10, icon: '😡', name: 'Rage',        cost: { meat: 120, essence: 10 }, cd: 90,
    desc: '+50% damage for 12 s.' },
];

export const spellById = (id) => SPELLS.find(s => s.id === id);

// ---- Trainable stat tracks: 10 tiers each, tier N needs player level N.
// Costs scale quadratically up to tier 6, then LINEARLY — the late tiers
// should feel expensive, not like a second full-time job. ----
const trainCost = (base) => (t) =>
  t <= 6 ? base * t * t : base * 36 + base * 10 * (t - 6);
export const STAT_TRACKS = [
  { id: 'range', icon: '📏', name: 'Range Training', max: 10,
    desc: '+2 m bow range, +0.1 m melee reach per level. Level 10 reaches across the whole screen.',
    cost: (t) => ({ meat: trainCost(25)(t), ...(t >= 3 ? { wood: 10 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'power', icon: '💪', name: 'Power Training', max: 10,
    desc: '+5% weapon damage per level.',
    cost: (t) => ({ meat: trainCost(28)(t), ...(t >= 3 ? { wood: 12 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'swift', icon: '🤺', name: 'Swift Hands', max: 10,
    desc: '+4% attack speed per level.',
    cost: (t) => ({ meat: trainCost(26)(t), ...(t >= 3 ? { wood: 11 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'pet', icon: '🐾', name: 'Pet Training', max: 5,
    desc: '+100 pet health and +25% pet damage per level (100 HP base, up to 600 + level bonus).',
    cost: (t) => ({ meat: 40 * t * t, hide: 4 * t, ...(t >= 3 ? { essence: 3 * (t - 2) } : {}) }) },
  { id: 'gather', icon: '🧺', name: 'Gathering', max: 5,
    desc: '+15% wood and stone from every felled tree and cracked rock per level.',
    cost: (t) => ({ meat: 22 * t * t, wood: 8 * t, ...(t >= 3 ? { essence: 2 * (t - 2) } : {}) }) },
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
        desc: 'Age 2 — your cave becomes a hide tent. Unlocks hide clothing. +20 max health.' },
      { level: 4, cost: { wood: 60, stone: 10 },
        desc: 'Age 3 — a timber cabin. Unlocks bows. +60 max health, loot magnet reaches further.' },
      { level: 7, cost: { stone: 80, wood: 30, iron: 6 },
        desc: 'Age 4 — an iron-age stone house. +120 max health, +25% chopping & mining power.' },
      { level: 9, cost: { stone: 200, wood: 150, iron: 30, hide: 20, meat: 100 },
        desc: 'Age 5 — a MEDIEVAL KEEP. Unlocks knightly gear. +180 max health, +15% XP.' },
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
  wolf: { hp: 60,  dmg: 9,  speed: 3.9, range: 1.6, cd: 1.0, xp: 8,  meat: 1, hitR: 0.8 },
  boar: { hp: 110, dmg: 15, speed: 3.6, range: 1.7, cd: 1.2, xp: 14, meat: 2, hitR: 0.9 },
  bear: { hp: 220, dmg: 24, speed: 3.0, range: 2.0, cd: 1.5, xp: 22, meat: 3, hitR: 1.2 },
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
// forgeable gear lives at the BLACKSMITH; only the primitive Bone Club can
// be lashed together at home
export const isForgeItem = (i) =>
  ['weapon', 'head', 'chest', 'boots', 'charm'].includes(i.slot) && !i.free && i.id !== 'club';

// one-time survival comforts sold in the Supplies tab (like the Bag Upgrade)
export const SUPPLY_UPGRADES = [
  { id: 'saddle',  icon: '🐴', name: 'Riding Saddle', cost: { hide: 12, iron: 4, meat: 30 },
    desc: 'Saddle a wild horse (E next to one, 3rd biome onward). Riding: +9 speed, but you cannot attack. X to dismount.' },
  { id: 'bedroll', icon: '🛏️', name: 'Wool Bedroll', cost: { wool: 8, hide: 4 },
    desc: 'Stand still for a moment out of combat and you regenerate 6× faster.' },
  { id: 'lining',  icon: '🧥', name: 'Quilted Wool Lining', cost: { wool: 14, hide: 8 },
    desc: 'Wool padding under everything you wear: all damage taken −8%.' },
  { id: 'socks',   icon: '🧦', name: 'Thick Wool Socks', cost: { wool: 10, meat: 20 },
    desc: 'Swamp mud and spider webs slow you only HALF as much.' },
  { id: 'torch',   icon: '🔦', name: 'Everburning Torch', cost: { wood: 10, hide: 3, essence: 1 },
    desc: 'A resin-soaked torch that never goes out. Lights the ground around you in the dark biomes (Dark Forest, Haunted Forest, swamp and the cave) — and its warmth slows the Frozen Peak\'s chill.' },
];

export const SHOP_GROUPS = [
  { key: 'weapons',  label: '⚔️ Weapons',   items: () => ITEMS.filter(i => i.slot === 'weapon' && !i.free && !isForgeItem(i)) },
  { key: 'friends',  label: '🐾 Companions', items: () => ITEMS.filter(i => i.slot === 'companion') },
  { key: 'spells',   label: '📖 Spells',    items: () => SPELLS },
  { key: 'training', label: '📈 Training',  items: () => STAT_TRACKS },
];

export const SMITH_GROUPS = [
  { key: 'quests',  label: '📜 Quests' },
  { key: 'weapons', label: '⚔️ Weapons', items: () => ITEMS.filter(i => i.slot === 'weapon' && !i.free) },
  { key: 'gear',    label: '🛡️ Gear',    items: () => ITEMS.filter(i => ['head', 'chest', 'boots', 'charm'].includes(i.slot)) },
];

// ---- blacksmith quest lines: 8 sequential quests per biome, generated from
// the biome's own enemy roster. One active quest at a time, strictly in order.
export function questFor(bi, idx) {
  const biome = BIOMES[bi];
  const en = (k) => biome.enemies[k % biome.enemies.length];
  const k = 1 + bi; // depth scales needs and rewards
  const defs = [
    { type: 'kill', target: en(0), need: 5 },
    { type: 'gather', res: 'wood', need: 15 + bi * 5 },
    { type: 'kill', target: en(1), need: 8 },
    { type: 'gather', res: bi >= 1 ? 'essence' : 'berry', need: bi >= 1 ? 2 + bi : 8 },
    { type: 'kill', target: en(2), need: 10 },
    { type: 'gather', res: 'hide', need: 6 + bi * 3 },
    { type: 'killAny', need: 15 },
    { type: 'boss', need: 1 },
  ];
  const d = defs[idx];
  if (!d) return null;
  const q = { ...d, biome: bi, idx };
  q.reward = {}; // quests pay XP ONLY — scaled to your level when you finish
  if (d.type === 'kill') {
    const c = ENEMY_TYPES[d.target];
    q.name = `${c.icon} Cull: ${c.name}`;
    q.desc = `Slay ${d.need} ${c.name}s for the smith's stew pot.`;
  } else if (d.type === 'gather') {
    q.name = `${RES_ICONS[d.res]} Fetch: ${d.res}`;
    q.desc = `Bring in ${d.need} ${d.res} — the forge devours materials.`;
  } else if (d.type === 'killAny') {
    q.name = '⚔️ Clear the woods';
    q.desc = `Slay ${d.need} creatures of the ${biome.name}.`;
  } else {
    q.name = '💀 Slay a pack mother';
    q.desc = `Bring down any skull-ranked boss in the ${biome.name}.`;
  }
  return q;
}
export const QUESTS_PER_BIOME = 8;
