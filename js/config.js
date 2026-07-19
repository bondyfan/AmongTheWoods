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
    enemies: ['rat', 'spider', 'snake'], humanoids: ['bandit'], packs: null, treeDensity: 1.0, denseForests: true,
    critters: ['rabbit', 'rabbit', 'rabbit', 'sheep'], night: { remove: ['rabbit', 'sheep'], add: 'spider' } },
  { name: 'Scorched Desert', rMax: 1200, ground: 0xd8b878, ground2: 0xc9a860, dirt: 0xb89050,
    fog: 0xe8d8b0, sky: 0xbcd8e8, desert: true,
    foliage: [0x8a9a5a, 0x7a8a4a, 0x9aaa6a], trunk: 0x8a6b42,
    trees: { pine: 0, leafy: 0.1, birch: 0, dead: 0.9 }, snowy: false,
    grass: 0xc9b878, flowers: false, mushrooms: false,
    enemies: ['scorpion', 'cobra', 'vulture', 'snake'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.85, 0.15, 0] }, treeDensity: 0.3,
    critters: ['rabbit', 'rabbit'], night: { remove: ['rabbit', 'vulture'], add: 'scorpion' } },
  { name: 'Dark Forest',    rMax: 2000, ground: 0x2c4a24, ground2: 0x24401f, dirt: 0x4a3a24,
    fog: 0x2e3c2c, sky: 0x2c3a44, darkness: 0.62, light: 0.5,
    foliage: [0x1e4a22, 0x27552a, 0x1a3f2e], trunk: 0x4c3520,
    trees: { pine: 0.55, leafy: 0.25, birch: 0, dead: 0.2 }, snowy: false,
    grass: 0x44663a, flowers: false, mushrooms: true,
    enemies: ['spider', 'snake', 'wolf', 'venomspider', 'bat'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.7, 0.3, 0] }, treeDensity: 1.3, denseForests: true,
    spiderHaunt: true, webField: true, critters: ['rabbit'], night: { remove: ['rabbit', 'snake'], add: 'venomspider' } },
  { name: 'Murky Swamp',    rMax: 2900, ground: 0x565c30, ground2: 0x4a5230, dirt: 0x3a3c28,
    fog: 0x3c4a44, sky: 0x3a4650, darkness: 0.4, light: 0.62,
    foliage: [0x3a5a30, 0x2e4a2a, 0x4a6438], trunk: 0x453a28,
    trees: { pine: 0.2, leafy: 0.5, birch: 0, dead: 0.3 }, snowy: false,
    grass: 0x60704a, flowers: false, mushrooms: true,
    enemies: ['snake', 'venomspider', 'stormsnake', 'boar', 'bogCrawler'], humanoids: ['tribesman', 'shaman'], packs: { skulls: [0.5, 0.4, 0.1] }, treeDensity: 0.9, denseForests: true,
    critters: ['horse'], night: { remove: ['horse', 'boar'], add: 'venomspider' } },
  { name: 'Highlands',      rMax: 3800, ground: 0x9a8a50, ground2: 0xa89658, dirt: 0xa8874f,
    fog: 0xc9c0a0, sky: 0x9db4c4,
    foliage: [0x5c6e33, 0x6d7d3a, 0x4e5e2c], trunk: 0x5c4a33,
    trees: { pine: 0.5, leafy: 0.1, birch: 0.1, dead: 0.3 }, snowy: false,
    grass: 0x8f9060, flowers: false, mushrooms: false,
    enemies: ['wolf', 'boar', 'elk', 'venomspider', 'stormsnake', 'harpy', 'cactusman'], humanoids: ['poacher'], packs: { skulls: [0.4, 0.4, 0.2] }, treeDensity: 0.7,
    critters: ['rabbit', 'rabbit', 'sheep', 'horse'], night: { remove: ['rabbit', 'sheep'], add: 'wolf' } },
  { name: 'Haunted Forest', rMax: 4700, ground: 0x3a3a44, ground2: 0x32323c, dirt: 0x4c4258,
    fog: 0x3c3850, sky: 0x363044, darkness: 0.75, light: 0.48,
    foliage: [0x2a3a28, 0x1e2e20, 0x3a3448], trunk: 0x3a3230,
    trees: { pine: 0.3, leafy: 0.1, birch: 0, dead: 0.6 }, snowy: false,
    grass: 0x5c6650, flowers: false, mushrooms: true,
    enemies: ['zombie', 'bat', 'venomspider', 'wolf', 'treant', 'elk', 'ghost'], humanoids: ['shaman', 'poacher'], packs: { skulls: [0.3, 0.45, 0.25] }, treeDensity: 1.1, denseForests: true,
    spiderHaunt: true, critters: ['horse'], night: { remove: ['horse', 'elk'], add: 'ghost' } },
  { name: 'Jungle',         rMax: 5100, ground: 0x2f8a28, ground2: 0x3a9c32, dirt: 0x7a6030,
    fog: 0x8ac878, sky: 0x8cc8e0,
    foliage: [0x1f6b2a, 0x2d8a34, 0x39a03e], trunk: 0x5a4426,
    trees: { pine: 0.1, leafy: 0.7, birch: 0.2, dead: 0 }, snowy: false,
    grass: 0x4f8f3a, flowers: true, mushrooms: true,
    enemies: ['stormsnake', 'boar', 'bear', 'harpy', 'bogCrawler', 'snapper', 'panther'], humanoids: ['tribesman'], packs: { skulls: [0.2, 0.5, 0.3] }, treeDensity: 1.6, denseForests: true,
    critters: ['rabbit', 'sheep', 'horse'], night: { remove: ['rabbit', 'sheep'], add: 'panther' } },
  { name: 'Frozen Peak',    rMax: 99999, ground: 0xf2f6fa, ground2: 0xe4ecf3, dirt: 0xc9d6e1,
    fog: 0xf4f8fc, sky: 0xdfe9f2,
    foliage: [0x8fb0c0, 0x3d6155, 0xcfdfe8], trunk: 0x3d3229,
    trees: { pine: 0.7, leafy: 0, birch: 0, dead: 0.3 }, snowy: true,
    grass: 0xdde7ee, flowers: false, mushrooms: false,
    enemies: ['icewolf', 'icespider', 'wendigo', 'yeti', 'icegolem', 'frostWisp'], packs: { skulls: [0, 0.5, 0.5] }, treeDensity: 0.5,
    critters: ['horse'], night: { remove: ['horse', 'icespider'], add: 'wendigo' } },
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
  bee: { name: 'Angry Bee', icon: '🐝',
             hp: 8, dmg: 3, speed: 9, range: 1.0, attackCd: 0.8, xp: 1, meat: 0, hitR: 0.3, aggro: 40, flying: true },
  cactusman: { name: 'Saguaro Sentinel', icon: '🌵',
             hp: 520, dmg: 9, speed: 0, range: 1.6, attackCd: 1.2, xp: 24, meat: 0, hitR: 0.7, aggro: 9,
             ranged: true, shootRange: 10, spellCd: 2.6, projectileSpeed: 16, shotColor: 0xbfe07a, radial: 12 },
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
  bandit:  { name: 'Bandit', icon: '🗡️',
             hp: 90,  dmg: 9,  meleeDmg: 5, speed: 6, range: 1.4, attackCd: 1.2, xp: 10, meat: 1, hitR: 0.55, aggro: 15,
             humanoid: true, ranged: true, spear: true, shootRange: 10, spellCd: 2.4, projectileSpeed: 20, shotColor: 0xb08a5a },
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

// A readable threat level for comparing a creature with the player's level.
// Base XP already follows the hand-balanced creature roster, while the extra
// terms reflect the real stat multipliers applied by Enemy at spawn time.
export function biomeIndexForDifficulty(difficulty = 0) {
  const distance = Math.max(0, difficulty) * WORLD.goalR;
  let biomeIndex = BIOMES.findIndex(b => distance <= b.rMax);
  if (biomeIndex < 0) biomeIndex = BIOMES.length - 1;
  return biomeIndex;
}

export function enemyLevelFor(type, difficulty = 0, bossRank = 0, elite = false) {
  const cfg = ENEMY_TYPES[type] ?? {};
  const biomeIndex = biomeIndexForDifficulty(difficulty);
  if (cfg.passive) return 1 + Math.round((biomeIndex / (BIOMES.length - 1)) * 4);

  const biome = BIOMES[biomeIndex];
  const roster = [...new Set([...(biome.enemies ?? []), ...(biome.humanoids ?? []),
    ...(biome.night?.add ? [biome.night.add] : [])])]
    .filter(t => !ENEMY_TYPES[t]?.passive)
    .sort((a, b) => (ENEMY_TYPES[a]?.xp ?? 0) - (ENEMY_TYPES[b]?.xp ?? 0));
  const xp = cfg.xp ?? 1;
  const position = Math.max(0, roster.filter(t => (ENEMY_TYPES[t]?.xp ?? 0) <= xp).length - 1);
  const strengthOffset = roster.length <= 1 ? 1
    : Math.min(2, Math.floor((position / (roster.length - 1)) * 3));
  const baseLevel = 1 + biomeIndex * 3 + strengthOffset;
  const eliteLevels = elite ? 2 : 0;
  const bossLevels = bossRank * 3;
  return Math.min(36, baseLevel + eliteLevels + bossLevels);
}

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
  2850, 3620, 4520, 5560, 6760, 8140, 9720, 11520, 13560, 15860, 18440,
  21320, 24520, 28070];
export const MAX_LEVEL = 24;

// quest XP scale: fraction of the CURRENT level's xp-to-next a quest pays,
// front-loaded hard (a lvl-1 quest levels you outright, endgame quests are
// a nudge). Index by player level; past the table it stays at 1%.
export const QUEST_XP_PCT = [0, 1.2, 1.0, 0.8, 0.6, 0.4, 0.25, 0.18, 0.14, 0.12,
  0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06,
  0.06, 0.06, 0.06];
export function questXpFor(level) {
  const pct = QUEST_XP_PCT[Math.min(level, QUEST_XP_PCT.length - 1)] ?? 0.01;
  const span = (XP_LEVELS[Math.min(level + 1, XP_LEVELS.length - 1)] ?? 0) - (XP_LEVELS[level] ?? 0);
  return Math.max(1, Math.round(span * pct));
}

// ---- Equippable items (WoW-style slots). Bought in the shop or dropped by
// pack bosses. Only ONE weapon is wielded at a time — Q cycles owned weapons. ----
export const SLOTS = ['weapon', 'offhand', 'head', 'chest', 'underlayer', 'legs', 'boots', 'back', 'mount', 'charm', 'companion'];
export const SLOT_LABELS = { weapon: 'Weapon', offhand: 'Off-hand', head: 'Head', chest: 'Chest',
  underlayer: 'Underlayer', legs: 'Legs', boots: 'Boots', back: 'Back', mount: 'Mount',
  charm: 'Charm', companion: 'Companion', placeable: 'Placeable' };

// Gear progresses through the ages. `needs` gates an item behind a camp
// building (survival): 'tent' → Hide Tent, 'cabin' → Wooden Cabin,
// 'furnace' → Stone Furnace (iron age).
export const ITEMS = [
  // -- weapons: melee (chop = tree felling & rock mining power) --
  { id: 'fists',      slot: 'weapon', level: 1, icon: '🖐️', name: 'Bare Hands',   cost: null, free: true,
    weapon: { kind: 'melee', style: 'fists', dmg: 12, cd: 0.64, range: 1.5, chop: 0, mine: 0, tier: 0,
      combo: [1, 1.08, 1.2] },
    desc: 'Fast three-hit combo. Bare hands can\'t fell trees or mine — craft tools!' },
  { id: 'club',       slot: 'weapon', level: 2, icon: '🦴', name: 'Bone Club',   cost: { meat: 10 },
    weapon: { kind: 'melee', style: 'club', dmg: 22, cd: 0.82, range: 1.7, chop: 0.5, mine: 0, tier: 1,
      combo: [1, 1.25], stun: 0.35, armorBreak: 0.16 },
    desc: 'Slow crushing blows stagger enemies and break armour; fells trees slowly.' },
  { id: 'stoneAxe',   slot: 'weapon', level: 3, icon: '🪓', name: 'Stone Axe',     cost: { wood: 12, stone: 10 },
    weapon: { kind: 'melee', style: 'axe', dmg: 38, cd: 0.86, range: 1.8, chop: 2, mine: 0, tier: 1,
      combo: [1, 1.15], bleed: 4 },
    desc: 'Wide, deliberate swings cause bleeding and chop trees fast.' },
  { id: 'steelAxe',   slot: 'weapon', level: 6, icon: '⚒️', name: 'Iron Axe',      cost: { wood: 18, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'axe', dmg: 68, cd: 0.9, range: 1.9, chop: 3, mine: 0, tier: 2,
      combo: [1, 1.18], bleed: 7 },
    desc: 'Heavy sweeping strikes bleed groups and tear through any tree.' },
  { id: 'warAxe',     slot: 'weapon', level: 8, icon: '🔥', name: 'War Axe',       cost: { wood: 25, iron: 16, hide: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'axe', dmg: 120, cd: 0.96, range: 2.0, chop: 4, mine: 0, tier: 3,
      combo: [1, 1.2], bleed: 12 },
    desc: 'A brutal war axe: very wide swings and severe bleeding.' },
  // -- tools: pickaxes are the ONLY way to mine rock --
  { id: 'bonePick',   slot: 'weapon', level: 3, icon: '⛏️', name: 'Bone Pickaxe',  cost: { wood: 10, hide: 2, meat: 8 },
    weapon: { kind: 'melee', style: 'pick', dmg: 20, cd: 0.79, range: 1.7, chop: 0, mine: 1, tier: 1,
      pick: true, armoredBonus: 1.65, armorBreak: 0.2 },
    desc: 'Mines rock slowly, but punches through golems and armoured creatures.' },
  { id: 'ironPick',   slot: 'weapon', level: 6, icon: '⚒️', name: 'Iron Pickaxe',  cost: { wood: 15, iron: 8 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'pick', dmg: 55, cd: 0.82, range: 1.8, chop: 0.5, mine: 2.5, tier: 2,
      pick: true, armoredBonus: 1.8, armorBreak: 0.28 },
    desc: 'Cracks rocks and armoured hides alike; strong armour-breaking strikes.' },
  { id: 'obsidianPick', slot: 'weapon', level: 9, icon: '⛏️', name: 'Obsidian Pickaxe', cost: { iron: 18, stone: 30, essence: 6 }, needs: 'keep',
    weapon: { kind: 'melee', style: 'pick', dmg: 100, cd: 0.88, range: 1.9, chop: 1, mine: 4, tier: 3,
      pick: true, armoredBonus: 2, armorBreak: 0.35 },
    desc: 'Volcanic point shatters rock, golems and armour with charged hits.' },
  { id: 'huntSpear',  slot: 'weapon', level: 5, icon: '🔱', name: 'Hunting Spear', cost: { wood: 20, stone: 8, hide: 3 },
    weapon: { kind: 'melee', style: 'spear', dmg: 52, cd: 0.82, range: 2.8, chop: 0, mine: 0, tier: 1,
      combo: [1, 1.2], chargeLunge: 1.25 },
    desc: 'Safe, narrow reach. Charged attacks lunge forward into exposed weak points.' },
  // -- weapons: ranged (invented with the Wooden Cabin era; train Range to extend) --
  { id: 'huntingBow', slot: 'weapon', level: 4, icon: '🏹', name: 'Hunting Bow',   cost: { wood: 25, hide: 4 }, needs: 'cabin',
    weapon: { kind: 'bow', style: 'bow', dmg: 16, cd: 1.07, range: 3.5, pierce: false, tier: 1 },
    desc: 'Hold and release for an accurate weak-point shot. Supports special arrows.' },
  { id: 'longbow',    slot: 'weapon', level: 6, icon: '🎯', name: 'Longbow',       cost: { wood: 40, hide: 8, iron: 4 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 32, cd: 0.89, range: 7, pierce: false, tier: 2 },
    desc: 'Long-ranged precision bow; fully drawn shots find weak points.' },
  { id: 'recurveBow', slot: 'weapon', level: 7, icon: '🏹', name: 'Recurve Bow',   cost: { wood: 45, hide: 10, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 26, cd: 0.69, range: 8.5, pierce: false, tier: 2 },
    desc: 'Snappy recurve limbs support fast follow-up shots and special arrows.' },
  { id: 'rapidBow',   slot: 'weapon', level: 8, icon: '🌀', name: 'Windstorm Bow', cost: { wood: 45, iron: 14, hide: 10 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 30, cd: 0.5, range: 10, pierce: true, tier: 3 },
    desc: 'Very fast piercing arrows; charged shots tear through a whole line.' },
  // -- medieval (Age 5, needs the Keep) --
  { id: 'steelSword', slot: 'weapon', level: 9, icon: '⚔️', name: 'Knight\'s Sword', cost: { iron: 25, wood: 10, hide: 8 }, needs: 'keep',
    weapon: { kind: 'melee', style: 'sword', dmg: 150, cd: 0.6, range: 2.1, chop: 1.5, mine: 0, tier: 3,
      combo: [1, 1.18, 1.55], parry: true },
    desc: 'A fast three-hit combo. Guard at the right moment to parry and stun attackers.' },
  { id: 'crossbow',   slot: 'weapon', level: 9, icon: '🎯', name: 'Crossbow',       cost: { wood: 50, iron: 20 }, needs: 'keep',
    weapon: { kind: 'bow', style: 'crossbow', dmg: 90, cd: 1.65, range: 12, pierce: true, tier: 3,
      armorPierce: 0.75, armorBreak: 0.25 },
    desc: 'Slow to reload, but launches an extremely powerful armour-piercing bolt.' },
  // -- late-game signature weapons: one memorable choice per deep biome --
  { id: 'highlandSpear', slot: 'weapon', level: 13, icon: '⚡', name: 'Highland Greatspear',
    cost: { wood: 55, iron: 38, hide: 18, essence: 14 }, needs: 'runic',
    weapon: { kind: 'melee', style: 'spear', dmg: 210, cd: 0.92, range: 3.3, chop: 0, mine: 0, tier: 4,
      combo: [1, 1.25], chargeLunge: 1.5 },
    desc: 'A storm-tempered reach weapon. Charged attacks lunge deep into exposed weak points.' },
  { id: 'serpentBow', slot: 'weapon', level: 20, icon: '🐍', name: 'Serpent Bow',
    cost: { wood: 85, hide: 35, iron: 45, essence: 35 }, needs: 'spirit',
    weapon: { kind: 'bow', style: 'bow', dmg: 95, cd: 0.62, range: 14, pierce: true, tier: 4 },
    desc: 'A recurved jungle bow: fast 95-damage arrows pierce through packed enemies.' },
  { id: 'frostAxe', slot: 'weapon', level: 22, icon: '🧚', name: 'Frostforged Axe',
    cost: { wood: 90, iron: 70, hide: 30, essence: 55 }, needs: 'primal',
    weapon: { kind: 'melee', style: 'axe', dmg: 260, cd: 0.82, range: 2.35, chop: 6, mine: 1, tier: 4,
      combo: [1, 1.25], bleed: 20 },
    desc: 'Frozen iron with a brutal edge. Wide swings leave severe bleeding wounds.' },
  { id: 'woodShield', slot: 'offhand', level: 3, icon: '🛡️', name: 'Wooden Shield', cost: { wood: 18, hide: 3 },
    shield: { block: 0.55 }, desc: 'Hold Ctrl to block 55% incoming damage. Replaces your torch.' },
  { id: 'ironShield', slot: 'offhand', level: 7, icon: '🛡️', name: 'Iron Shield', cost: { iron: 14, wood: 12, hide: 5 }, needs: 'furnace',
    shield: { block: 0.72 }, desc: 'Hold Ctrl to block 72% incoming damage. Replaces your torch.' },
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
  { id: 'graveplate', slot: 'chest', level: 17, icon: '⚰️', name: 'Graveplate',
    cost: { iron: 55, hide: 30, essence: 32 }, needs: 'mountain', stats: { hp: 275, regen: 1.1 },
    desc: 'Spirit-bound plate from the haunted woods. +275 max health, +1.1 ❤️/s.' },
  { id: 'iceplate', slot: 'chest', level: 23, icon: '🧊', name: 'Iceplate',
    cost: { iron: 90, hide: 45, essence: 70 }, needs: 'primal', stats: { hp: 390, regen: 1.5 },
    desc: 'Armor built for the summit. +390 max health, +1.5 ❤️/s.' },
  // -- boots --
  { id: 'swiftBoots',   slot: 'boots', level: 3, icon: '👢', name: 'Hide Wraps',     cost: { hide: 5, meat: 10 }, needs: 'tent', stats: { speed: 1.5 },
    desc: '+1.5 movement speed.' },
  { id: 'huntersBoots', slot: 'boots', level: 6, icon: '🥾', name: "Hunter's Boots", cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { speed: 2.5 },
    desc: '+2.5 movement speed.' },
  { id: 'ironBoots',    slot: 'boots', level: 7, icon: '🥾', name: 'Iron-Shod Boots', cost: { iron: 8, hide: 6 }, needs: 'furnace', stats: { speed: 3, hp: 35 },
    desc: '+3 movement speed, +35 max health.' },
  { id: 'windBoots',    slot: 'boots', level: 9, icon: '💨', name: 'Windwalkers',    cost: { hide: 14, iron: 8, meat: 40 }, needs: 'furnace', stats: { speed: 4.5, regen: 0.5 },
    desc: '+4.5 movement speed, +0.5 ❤️/s regeneration.' },
  { id: 'pantherBoots', slot: 'boots', level: 19, icon: '🐆', name: 'Pantherstep Boots',
    cost: { hide: 45, iron: 25, essence: 30 }, needs: 'spirit', stats: { speed: 6, hp: 90, regen: 0.8 },
    desc: 'Silent jungle boots. +6 movement speed, +90 health, +0.8 ❤️/s.' },
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
  // -- expedition gear (Supplies tab): wearable comfort items, each with its
  // own WoW-style slot. supply: true keeps them out of the weapon/gear shops.
  // torches BURN: one stick lasts ~5 real minutes (5 in-game hours), then it
  // crumbles to ash and vanishes from your hand — carry spares!
  { id: 'torch',   slot: 'offhand', level: 2, supply: true, icon: '🔦', name: 'Torch',
    cost: { wood: 6, hide: 1 }, torch: { radius: 5 },
    desc: 'A burning stick held in your off-hand — you SEE it blaze as you walk. Lights ~5 m around you in the dark (night, dark biomes, lairs) and its warmth slows the Frozen Peak\'s chill. Burns out after 5 minutes.' },
  { id: 'torchoil', slot: 'offhand', level: 5, supply: true, icon: '🛢️', name: 'Oiled Torch',
    cost: { wood: 12, hide: 3, essence: 1 }, torch: { radius: 10 },
    desc: 'Soaked in alchemist\'s oil — burns brighter: lights ~10 m around you. Burns out after 5 minutes.' },
  { id: 'torchember', slot: 'offhand', level: 8, supply: true, icon: '🔥', name: 'Emberheart Torch',
    cost: { wood: 20, iron: 4, essence: 5 }, torch: { radius: 15 },
    desc: 'A molten ember lashed into a torch head — a blazing ~15 m circle of light. Burns out after 5 minutes.' },
  { id: 'spiritLantern', slot: 'offhand', level: 16, supply: true, icon: '🏮', name: 'Spirit Lantern',
    cost: { iron: 25, essence: 28 }, needs: 'mountain', torch: { radius: 20, permanent: true }, stats: { regen: 0.5 },
    desc: 'A permanent pale flame: lights ~20 m, never burns out, and grants +0.5 ❤️/s.' },
  { id: 'socks',   slot: 'legs', level: 3, supply: true, icon: '🧦', name: 'Thick Wool Socks',
    cost: { wool: 10, meat: 20 }, mudguard: 0.5,
    desc: 'Worn on your legs: swamp mud and spider webs slow you only HALF as much.' },
  { id: 'lining',  slot: 'underlayer', level: 4, supply: true, icon: '🧥', name: 'Quilted Wool Lining',
    cost: { wool: 14, hide: 8 }, dmgCut: 0.08,
    desc: 'Wool padding worn under everything else: all damage taken −8%.' },
  { id: 'bogscaleLining', slot: 'underlayer', level: 11, supply: true, icon: '🐊', name: 'Bogscale Lining',
    cost: { hide: 25, wool: 20, essence: 12 }, needs: 'keep', dmgCut: 0.12, poisonCut: 0.5,
    desc: 'Layered swamp scales: all damage −12% and poison damage −50%.' },
  { id: 'bedroll', slot: 'back', level: 3, supply: true, icon: '🛏️', name: 'Wool Bedroll',
    cost: { wool: 8, hide: 4 }, rest: 6,
    desc: 'Strapped across your back. Stand still for a moment out of combat and you regenerate 6× faster.' },
  { id: 'stormcloak', slot: 'back', level: 14, supply: true, icon: '🌩️', name: 'Stormcloak',
    cost: { hide: 30, wool: 28, iron: 15, essence: 20 }, needs: 'runic', stats: { hp: 120, regen: 0.8 }, rest: 5,
    desc: 'Highland storm wool: +120 health, +0.8 ❤️/s and 5× resting regeneration.' },
  { id: 'saddle',  slot: 'mount', level: 4, supply: true, icon: '🐴', name: 'Riding Saddle',
    cost: { hide: 12, iron: 4, meat: 30 },  saddle: true,
    desc: 'Saddle a wild horse (E nearby). Riding grants +9 speed; mounted attacks hit harder but recover slower. X dismounts.' },

  // -- placeable camp items: bought into the backpack, then positioned in
  // the world by clicking them. They are items, never camp upgrades.
  { id: 'storageChest', slot: 'placeable', level: 3, supply: true, icon: '📦', name: 'Storage Chest',
    cost: { wood: 25 }, placeable: { kind: 'chest' },
    desc: 'Place it on solid ground. Press E beside it to store resources safely through death.' },
  { id: 'logBoat', slot: 'mount', level: 4, supply: true, icon: '🛶', name: 'Log Boat',
    cost: { wood: 30, hide: 4 }, placeable: { kind: 'boat' }, boatMount: true,
    desc: 'Place it on solid ground near the water, then press E beside it to mount. X dismounts and parks it at your position.' },
  { id: 'guardTower', slot: 'placeable', level: 8, supply: true, icon: '🗼', name: 'Guard Tower',
    cost: { wood: 60, stone: 40, iron: 10 }, placeable: { kind: 'tower' },
    desc: 'Place it on solid ground. It automatically shoots enemies within 20 metres.' },
  { id: 'graveyardItem', slot: 'placeable', level: 5, supply: true, icon: '🪦', name: 'Graveyard',
    cost: { stone: 30, wood: 20, meat: 20 }, placeable: { kind: 'grave' },
    desc: 'Place a remote respawn shrine on solid ground. Death lets you choose the cave or this graveyard.' },

  // -- griffin nests: dropped by beaten griffins, never sold or looted
  // (free: true keeps them out of every random loot pool). Click one in the
  // inventory to PLACE it on the ground — a flight-master roost you can fly
  // between (stand next to a placed nest to open the flight map).
  { id: 'desertNest',   slot: 'nest', level: 1, icon: '🪺', name: 'Desert Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 1 },
    desc: 'The Desert griffin\'s nest. Click to place it where you stand (Desert or any earlier ring). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'highlandNest', slot: 'nest', level: 1, icon: '🪺', name: 'Highland Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 4 },
    desc: 'The Highland griffin\'s nest. Click to place it where you stand (Highlands or any earlier ring). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'frozenNest',   slot: 'nest', level: 1, icon: '🪺', name: 'Frozen Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 7 },
    desc: 'The Frozen Peak griffin\'s nest. Click to place it anywhere on solid ground. Stand by a placed nest to call a griffin and fly between your roosts.' },

  // ---- UNIQUE boss drops: guaranteed from each biome's lair boss, never sold ----
  { id: 'verdantHeart', slot: 'charm', level: 3, unique: true, icon: '🌿', name: 'Verdant Heart',
    stats: { regen: 1.0, dmgPct: 0.10 }, desc: 'UNIQUE — dropped by Sythe the Broodmother. +1.0 ❤️/s and +10% damage.' },
  { id: 'sunfangBlade', slot: 'weapon', level: 6, unique: true, icon: '🗡️', name: 'Sunfang Blade',
    weapon: { kind: 'melee', style: 'sword', dmg: 95, cd: 0.6, range: 2.0, chop: 1, mine: 0, tier: 2,
      combo: [1, 1.2, 1.5], parry: true, burn: 8 },
    desc: 'UNIQUE — a blistering three-hit blade that parries and ignites enemies.' },
  { id: 'widowShroud', slot: 'chest', level: 9, unique: true, icon: '🕸️', name: "Widow's Shroud",
    stats: { hp: 210, regen: 1.0 }, desc: 'UNIQUE — dropped by Vess the Widow. +210 max health, +1.0 ❤️/s.' },
  { id: 'mireBoots', slot: 'boots', level: 12, unique: true, icon: '🥾', name: 'Mirewalker Boots',
    stats: { speed: 5, hp: 110, regen: 0.5 }, mudguard: 0.25,
    desc: 'UNIQUE — dropped by the Mire Hydra. +5 speed, +110 health, +0.5 ❤️/s; mud barely slows you.' },
  { id: 'ironhornCrown', slot: 'head', level: 15, unique: true, icon: '👑', name: 'Ironhorn Crown',
    stats: { hp: 230, regen: 1.0 }, desc: 'UNIQUE — dropped by Old Ironhorn. +230 max health, +1.0 ❤️/s.' },
  { id: 'shadeAmulet', slot: 'charm', level: 18, unique: true, icon: '👻', name: 'Amulet of the Shade',
    stats: { dmgPct: 0.30, regen: 1.2 }, desc: 'UNIQUE — dropped by the Weeping Shade. +30% damage, +1.2 ❤️/s.' },
  { id: 'snapjawMaul', slot: 'weapon', level: 21, unique: true, icon: '🔨', name: 'Snapjaw Maul',
    weapon: { kind: 'melee', style: 'club', dmg: 320, cd: 1.05, range: 2.35, chop: 3, mine: 2, tier: 4,
      combo: [1, 1.35], stun: 1.0, armorBreak: 0.55 },
    desc: 'UNIQUE — a crushing jungle maul that stuns and ruins armour.' },
  { id: 'frostMantle', slot: 'back', level: 24, unique: true, icon: '🧊', name: 'Mantle of the Colossus',
    stats: { hp: 300, regen: 2.0 }, rest: 8, coldproof: true,
    desc: 'UNIQUE — skinned from Grimfrost. +300 ❤️, +2.0 ❤️/s, 8× resting regeneration and complete cold protection.' },
];

// One named boss per biome ring (7 = Frozen Peak already has the summit Ymir),
// each roosting in a LAIR landmark and dropping its UNIQUE item, guaranteed.
// Each entry also describes the boss's DUNGEON: den (instance name), mobs
// (its themed trash roster) and theme (floor/wall/fog colors + prop dressing).
export const BIOME_LAIRS = [
  { name: 'Sythe the Broodmother', type: 'spider',      drop: 'verdantHeart',
    den: 'The Brood Warren', mobs: ['spider', 'spider', 'venomspider'],
    theme: { floor: 0x2a3320, wall: 0x3d4a2c, fog: 0x0a0f08, prop: 'web' } },
  { name: 'Kthara Sunfang',        type: 'scorpion',    drop: 'sunfangBlade',
    den: 'The Sunfang Burrow', mobs: ['scorpion', 'cobra'],
    theme: { floor: 0xb99a63, wall: 0x9a7c48, fog: 0x1a1408, prop: 'sand' } },
  { name: 'Vess the Widow',        type: 'venomspider', drop: 'widowShroud',
    den: "The Widow's Hollow", mobs: ['venomspider', 'bat'],
    theme: { floor: 0x1f2a1c, wall: 0x243020, fog: 0x050805, prop: 'web' } },
  { name: 'The Mire Hydra',        type: 'bogCrawler',  drop: 'mireBoots',
    den: 'The Drowned Den', mobs: ['bogCrawler', 'snake'],
    theme: { floor: 0x424a28, wall: 0x39402a, fog: 0x0b0f08, prop: 'mud' } },
  { name: 'Old Ironhorn',          type: 'elk',         drop: 'ironhornCrown',
    den: 'The Bonefield Barrow', mobs: ['elk', 'harpy'],
    theme: { floor: 0x8a7c4c, wall: 0x6f6340, fog: 0x14120a, prop: 'bone' } },
  { name: 'The Weeping Shade',     type: 'ghost',       drop: 'shadeAmulet',
    den: 'The Weeping Crypt', mobs: ['ghost', 'zombie'],
    theme: { floor: 0x2e2e38, wall: 0x3a3a48, fog: 0x08080e, prop: 'ghost' } },
  { name: 'Old Snapjaw',           type: 'snapper',     drop: 'snapjawMaul',
    den: 'The Overgrown Gullet', mobs: ['snapper', 'panther'],
    theme: { floor: 0x2c5c24, wall: 0x3a6a2e, fog: 0x061006, prop: 'vine' } },
  // ring 7 — Frozen Peak: a COLOSSAL yeti, bigger and tougher than any lair boss
  { name: 'Grimfrost the Colossus', type: 'yeti',        drop: 'frostMantle', extraScale: 1.5, hpMult: 1.5,
    den: 'The Frostfather Cavern', mobs: ['icewolf', 'wendigo'],
    theme: { floor: 0xdfe9f0, wall: 0xbfd4e2, fog: 0x101820, prop: 'ice' } },
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
  { id: 'scroll', icon: '📜', name: 'Scroll of Discovery', found: true, reveal: 300,
    desc: 'Looted from a raided bandit dwelling. Click it to open the map, then click anywhere to reveal the land within 300 m.' },
];
export const consumableById = (id) => CONSUMABLES.find(c => c.id === id);

// MOBA has no mining/hides/smelting — special resources are paid in meat
// there (3 meat per unit) so every item stays purchasable.
export function costFor(cost, mobaMode) {
  if (!mobaMode || !cost) return cost;
  const out = { meat: cost.meat || 0 };
  if (cost.wood) out.wood = cost.wood;
  for (const k of ['stone', 'hide', 'iron', 'berry', 'wool', 'essence']) {
    if (cost[k]) out.meat += cost[k] * 3;
  }
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
  { id: 'stoneSkin', level: 12, icon: '🪨', name: 'Stone Skin', cost: { meat: 160, stone: 80, essence: 14 }, cd: 80,
    desc: 'Harden your skin for 12 s, reducing incoming damage by 40%.' },
  { id: 'whirlwind', level: 15, icon: '🌪️', name: 'Whirlwind', cost: { meat: 210, iron: 25, essence: 20 }, cd: 38,
    desc: 'Strike every nearby enemy for 75% weapon damage and knock them back.' },
  { id: 'spiritWard', level: 18, icon: '👻', name: 'Spirit Ward', cost: { meat: 260, essence: 32 }, cd: 75,
    desc: 'A spectral ward reduces damage by 30% and prevents poison for 15 s.' },
  { id: 'venomRain', level: 21, icon: '☣️', name: 'Venom Rain', cost: { meat: 330, hide: 30, essence: 45 }, cd: 55,
    desc: 'Poison every enemy within 9 m: immediate damage plus a vicious 6 s venom.' },
  { id: 'blizzard', level: 24, icon: '🌨️', name: 'Blizzard', cost: { meat: 450, iron: 50, essence: 70 }, cd: 90,
    desc: 'A summit storm damages and freezes every enemy within 11 m.' },
];

export const spellById = (id) => SPELLS.find(s => s.id === id);

// ---- Trainable stat tracks. Core combat tracks continue to tier 15 at biome
// milestones; pet/gathering continue to tier 8, while Range keeps its original
// 10 tiers. Costs turn linear after tier 6 so late training stays attainable. ----
const trainCost = (base) => (t) =>
  t <= 6 ? base * t * t : base * 36 + base * 10 * (t - 6);
const ADVANCED_TRAINING_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 21, 24];
const DEEP_TRAINING_LEVELS = [1, 2, 3, 4, 5, 12, 18, 24];
export const STAT_TRACKS = [
  { id: 'range', icon: '📏', name: 'Range Training', max: 10,
    desc: '+2 m bow range, +0.1 m melee reach per level. Level 10 reaches across the whole screen.',
    cost: (t) => ({ meat: trainCost(25)(t), ...(t >= 3 ? { wood: 10 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'power', icon: '💪', name: 'Power Training', max: 15, unlockLevels: ADVANCED_TRAINING_LEVELS,
    desc: '+5% weapon damage per tier (advanced tiers unlock at biome milestones).',
    cost: (t) => ({ meat: trainCost(28)(t), ...(t >= 3 ? { wood: 12 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'swift', icon: '🤺', name: 'Swift Hands', max: 15, unlockLevels: ADVANCED_TRAINING_LEVELS,
    desc: '+4% attack speed per tier (advanced tiers unlock at biome milestones).',
    cost: (t) => ({ meat: trainCost(26)(t), ...(t >= 3 ? { wood: 11 * (t - 2), essence: 2 * (t - 2) } : {}) }) },
  { id: 'pet', icon: '🐾', name: 'Pet Training', max: 8, unlockLevels: DEEP_TRAINING_LEVELS,
    desc: '+100 pet health and +25% pet damage per tier.',
    cost: (t) => ({ meat: 40 * t * t, hide: 4 * t, ...(t >= 3 ? { essence: 3 * (t - 2) } : {}) }) },
  { id: 'gather', icon: '🧺', name: 'Gathering', max: 8, unlockLevels: DEEP_TRAINING_LEVELS,
    desc: '+15% wood and stone from every felled tree and cracked rock per tier.',
    cost: (t) => ({ meat: 22 * t * t, wood: 8 * t, ...(t >= 3 ? { essence: 2 * (t - 2) } : {}) }) },
];

export const trainingLevelFor = (track, tier) => track.unlockLevels?.[tier - 1] ?? tier;

// ---- Exclusive class training. Every class has ten upgradeable passives and
// ten upgradeable active abilities. The first paid rank chooses the class and
// locks all other trees until a full, non-refundable reset at camp. ----
const P = (id, icon, name, level, desc, effects) =>
  ({ id, icon, name, level, desc, effects, type: 'passive', maxRank: 3 });
const A = (id, icon, name, level, desc, action, spec = {}) =>
  ({ id, icon, name, level, desc, action, ...spec, type: 'active', maxRank: 3 });

export const CLASS_TREES = [
  { id: 'warrior', icon: '🛡️', name: 'Warrior', color: '#d99b62',
    summary: 'Heavy melee fighter with health, brutal weapon skills and lasting bleeds.',
    passives: [
      P('war_vitality', '❤️', 'Vitality', 2, '+5% maximum health per rank.', { hpPct: 0.05 }),
      P('war_arms', '⚔️', 'Arms Mastery', 3, '+5% melee damage per rank.', { meleeDmg: 0.05 }),
      P('war_thick_skin', '🪨', 'Thick Skin', 5, '-2% incoming damage per rank.', { damageCut: 0.02 }),
      P('war_cleave', '🪓', 'Cleave Training', 7, 'Melee attack arcs widen per rank.', { arcBonus: 0.05 }),
      P('war_executioner', '☠️', 'Executioner', 9, '+8% damage to wounded enemies per rank.', { executeDmg: 0.08 }),
      P('war_blood_drinker', '🩸', 'Blood Drinker', 11, 'Kills restore 1.5% max health per rank.', { lifeOnKillPct: 0.015 }),
      P('war_heavy_hands', '🔨', 'Heavy Hands', 13, '+4% chance to stagger per rank.', { staggerChance: 0.04 }),
      P('war_unshaken', '⛰️', 'Unshaken', 15, 'Enemy stuns are 12% shorter per rank.', { stunResist: 0.12 }),
      P('war_iron_guard', '🛡️', 'Iron Guard', 18, '+4% blocked damage per rank.', { blockBonus: 0.04 }),
      P('war_tactician', '📯', 'Battle Tactician', 21, 'Warrior ability cooldowns -4% per rank.', { classCdReduction: 0.04 }),
    ],
    actives: [
      A('war_rend', '🩸', 'Rend', 2, 'Stab one target; it loses a percentage of max HP over 30 s.', 'target',
        { cd: 24, range: 3.2, weaponMult: [0.7, 0.9, 1.1], bleedPct: [0.12, 0.18, 0.24], bleedDur: 30 }),
      A('war_heroic_strike', '⚔️', 'Heroic Strike', 4, 'A crushing single-target weapon strike.', 'target',
        { cd: 10, range: 3.2, weaponMult: [1.5, 1.9, 2.3] }),
      A('war_cry', '📯', 'War Cry', 6, 'Temporarily increases damage and damage reduction.', 'buff',
        { cd: 40, buff: 'warCry', duration: [8, 10, 12], power: [0.15, 0.25, 0.35] }),
      A('war_ground_slam', '💥', 'Ground Slam', 8, 'Damage and stun all nearby enemies.', 'aoe',
        { cd: 24, radius: [4.5, 5.2, 6], weaponMult: [0.8, 1.05, 1.3], stun: [1.2, 1.8, 2.4] }),
      A('war_charge', '🐂', 'Bull Charge', 10, 'Rush forward, striking and stunning enemies in your path.', 'dash',
        { cd: 22, weaponMult: [1, 1.3, 1.6], stun: [1, 1.5, 2], distance: [7, 9, 11] }),
      A('war_whirlwind', '🌪️', 'Whirlwind', 12, 'A powerful circular melee attack.', 'aoe',
        { cd: 18, radius: [5, 5.5, 6], weaponMult: [1.1, 1.4, 1.8] }),
      A('war_cleaving_wave', '🌊', 'Cleaving Wave', 14, 'Send a broad damaging wave in front of you.', 'cone',
        { cd: 16, range: [7, 8.5, 10], weaponMult: [1, 1.3, 1.6] }),
      A('war_blood_fury', '🔥', 'Blood Fury', 16, 'Gain attack speed and life steal for a short time.', 'buff',
        { cd: 48, buff: 'bloodFury', duration: [8, 10, 12], power: [0.12, 0.18, 0.25] }),
      A('war_execute', '🪓', 'Execute', 20, 'Massive damage to a target below 35% health.', 'execute',
        { cd: 20, range: 3.2, weaponMult: [2.5, 3.3, 4.2], threshold: 0.35 }),
      A('war_avatar', '🗿', 'Avatar', 24, 'Become a juggernaut with damage, protection and a health shield.', 'buff',
        { cd: 90, buff: 'avatar', duration: [10, 13, 16], power: [0.25, 0.35, 0.45] }),
    ] },

  { id: 'beastmaster', icon: '🏹', name: 'Beastmaster', color: '#9bc56b',
    summary: 'The only class able to equip bows, crossbows and companions; controls traps and arrow storms.',
    passives: [
      P('beast_ranged_license', '🏹', 'Ranged Discipline', 2, 'Beastmaster training permits ranged weapons; +2% ranged damage per rank.', { rangedDmg: 0.02 }),
      P('beast_marksman', '🎯', 'Marksman', 3, '+5% ranged damage per rank.', { rangedDmg: 0.05 }),
      P('beast_quickdraw', '⚡', 'Quick Draw', 5, '+5% ranged attack speed per rank.', { rangedSpeed: 0.05 }),
      P('beast_trapper', '🪤', 'Trapper', 7, 'Traps gain +20% damage per rank.', { trapPower: 0.2 }),
      P('beast_bond', '🐾', 'Wild Bond', 9, 'Companion health and damage +10% per rank.', { petPower: 0.1 }),
      P('beast_pack_tactics', '🐺', 'Pack Tactics', 11, 'Companions move and attack 8% faster per rank.', { petSpeed: 0.08 }),
      P('beast_keen_eye', '👁️', 'Keen Eye', 13, '+3.5% ranged critical chance per rank.', { rangedCrit: 0.035 }),
      P('beast_broadheads', '🩸', 'Broadheads', 15, 'Ranged hits cause stronger bleeding per rank.', { arrowBleed: 0.03 }),
      P('beast_scavenger', '🍖', 'Scavenger', 18, '+8% meat collected per rank.', { meatMult: 0.08 }),
      P('beast_handler', '🫶', 'Animal Handler', 21, 'Companion regeneration +25% per rank.', { petRegen: 0.25 }),
    ],
    actives: [
      A('beast_snare', '🪤', 'Snare Trap', 2, 'Place a damaging trap that stuns its first victim.', 'world',
        { cd: 12, worldAction: 'trap', count: [1, 1, 2], power: [1, 1.35, 1.7] }),
      A('beast_arrow_haste', '⚡', 'Arrow Haste', 4, 'Greatly increases ranged attack speed.', 'buff',
        { cd: 38, buff: 'arrowHaste', duration: [8, 11, 14], power: [0.35, 0.48, 0.6] }),
      A('beast_ten_arrows', '🏹', 'Ten-Arrow Volley', 6, 'Fire ten arrows in a wide fan.', 'multishot',
        { cd: 16, count: 10, spread: 1.05, weaponMult: [0.3, 0.42, 0.55] }),
      A('beast_arrow_rain', '🌧️', 'Rain of Arrows', 8, 'Mark the ground; arrows rain over the area for 10 s.', 'zone',
        { cd: 34, zone: 'arrows', castRange: 18, radius: [5, 6, 7], duration: 10, weaponMult: [0.22, 0.31, 0.4], interval: 1 }),
      A('beast_piercing_shot', '➶', 'Piercing Shot', 10, 'A high-damage arrow that pierces every enemy in line.', 'multishot',
        { cd: 14, count: 1, pierce: true, spread: 0, weaponMult: [1.5, 2, 2.6] }),
      A('beast_explosive_arrow', '💣', 'Explosive Arrow', 12, 'Detonate a burning blast at the aimed location.', 'zoneBurst',
        { cd: 22, castRange: 18, radius: [3.5, 4.2, 5], weaponMult: [1, 1.35, 1.7], burn: [6, 10, 14] }),
      A('beast_mend_pet', '🫶', 'Mend Companion', 14, 'Restore companion health and empower its next attacks.', 'world',
        { cd: 28, worldAction: 'mendPet', power: [0.35, 0.55, 0.8] }),
      A('beast_hunt_command', '📣', 'Hunt Command', 16, 'Order your companion to focus the aimed enemy.', 'world',
        { cd: 8, worldAction: 'petCommand', power: [0.15, 0.3, 0.5] }),
      A('beast_trap_field', '⛓️', 'Trap Field', 20, 'Place several powerful snares around you.', 'world',
        { cd: 42, worldAction: 'trapField', count: [3, 4, 5], power: [1.2, 1.55, 1.9] }),
      A('beast_stampede', '🐗', 'Stampede', 24, 'Your living companion calls a stampede through every nearby enemy.', 'petAoe',
        { cd: 75, radius: [7, 8.5, 10], petMult: [3, 5, 7], stun: [1, 1.5, 2] }),
    ] },

  { id: 'rogue', icon: '🗡️', name: 'Rogue', color: '#8ec6c9',
    summary: 'Fast assassin using stealth, poison, evasion and devastating attacks from behind.',
    passives: [
      P('rogue_fleet', '🥾', 'Fleet Foot', 2, '+0.3 movement speed per rank.', { speed: 0.3 }),
      P('rogue_precision', '🎯', 'Precision', 3, '+4% melee critical chance per rank.', { meleeCrit: 0.04 }),
      P('rogue_light_foot', '🪶', 'Light Foot', 5, '-1.5% incoming damage per rank.', { damageCut: 0.015 }),
      P('rogue_shadow_training', '🌑', 'Shadow Training', 7, 'Stealth lasts 0.75 s longer per rank.', { stealthDuration: 0.75 }),
      P('rogue_evasion', '💨', 'Evasion Mastery', 9, 'Evade windows last 0.15 s longer per rank.', { evadeDuration: 0.15 }),
      P('rogue_backstab', '🔪', 'Backstabber', 11, '+15% damage from behind per rank.', { backstab: 0.15 }),
      P('rogue_poisoner', '☠️', 'Poisoner', 13, 'Weapon poison damage +20% per rank.', { poisonPower: 0.2 }),
      P('rogue_combo', '⚔️', 'Combo Mastery', 15, '+5% melee attack speed per rank.', { meleeSpeed: 0.05 }),
      P('rogue_escape', '🌫️', 'Escape Artist', 18, 'Gain a speed burst after taking damage.', { hurtSpeed: 0.2 }),
      P('rogue_assassin', '💀', 'Assassin', 21, '+10% damage to wounded targets per rank.', { executeDmg: 0.1 }),
    ],
    actives: [
      A('rogue_stealth', '🌑', 'Stealth', 2, 'Become nearly invisible; attacking breaks stealth.', 'stealth',
        { cd: 28, duration: [8, 11, 14] }),
      A('rogue_evade', '💨', 'Evade', 4, 'Avoid every incoming attack during a short glowing window.', 'evade',
        { cd: 24, duration: [1, 1.3, 1.6] }),
      A('rogue_backstab_active', '🔪', 'Backstab', 6, 'A brutal strike that is stronger from behind.', 'target',
        { cd: 11, range: 3.2, weaponMult: [1.7, 2.2, 2.8], backstab: true }),
      A('rogue_shadowstep', '🌘', 'Shadowstep', 8, 'Teleport behind the aimed enemy and strike.', 'shadowstep',
        { cd: 20, range: [10, 13, 16], weaponMult: [1.2, 1.6, 2] }),
      A('rogue_poison_blades', '☠️', 'Poison Blades', 10, 'Coat weapons with powerful poison.', 'buff',
        { cd: 36, buff: 'poisonBlades', duration: [10, 14, 18], power: [1, 1.5, 2] }),
      A('rogue_fan_knives', '🗡️', 'Fan of Knives', 12, 'Hit every nearby enemy with poisoned knives.', 'aoe',
        { cd: 18, radius: [5, 6, 7], weaponMult: [0.8, 1.1, 1.45], poison: [4, 7, 10] }),
      A('rogue_smoke_bomb', '🌫️', 'Smoke Bomb', 14, 'Create a smoke zone that hides you from enemies.', 'zone',
        { cd: 42, zone: 'smoke', castRange: 12, radius: [4.5, 5.5, 6.5], duration: [7, 9, 11], interval: 0.5 }),
      A('rogue_sprint', '🏃', 'Sprint', 16, 'Gain a tremendous burst of movement speed.', 'buff',
        { cd: 35, buff: 'sprint', duration: [6, 8, 10], power: [2, 3, 4] }),
      A('rogue_kidney_shot', '⚡', 'Kidney Shot', 20, 'Stun one target and deal weapon damage.', 'target',
        { cd: 25, range: 3.2, weaponMult: [0.8, 1.1, 1.4], stun: [3, 4, 5] }),
      A('rogue_assassinate', '💀', 'Assassinate', 24, 'Execute a wounded target with immense damage.', 'execute',
        { cd: 45, range: 3.2, weaponMult: [3.2, 4.3, 5.5], threshold: 0.4 }),
    ] },

  { id: 'mage', icon: '🧙', name: 'Mage', color: '#9c9cff',
    summary: 'Elemental damage dealer wielding fire, frost, barriers and destructive ground spells.',
    passives: [
      P('mage_power', '✨', 'Spell Power', 2, '+6% class spell damage per rank.', { spellPower: 0.06 }),
      P('mage_fire', '🔥', 'Fire Mastery', 3, '+8% fire damage per rank.', { firePower: 0.08 }),
      P('mage_frost', '❄️', 'Frost Mastery', 5, '+8% frost damage per rank.', { frostPower: 0.08 }),
      P('mage_focus', '⏳', 'Arcane Focus', 7, 'Mage cooldowns -4% per rank.', { classCdReduction: 0.04 }),
      P('mage_essence', '🧪', 'Essence Affinity', 9, '+10% essence collected per rank.', { essenceMult: 0.1 }),
      P('mage_barrier', '🔷', 'Barrier Mastery', 11, 'Magical shields +12% per rank.', { shieldPower: 0.12 }),
      P('mage_pyromaniac', '🌋', 'Pyromaniac', 13, 'Fire area size +8% per rank.', { fireRadius: 0.08 }),
      P('mage_winter_reach', '🌨️', 'Winter Reach', 15, 'Frost area size +8% per rank.', { frostRadius: 0.08 }),
      P('mage_surge', '💫', 'Elemental Surge', 18, '+4% class spell critical chance per rank.', { spellCrit: 0.04 }),
      P('mage_archmage', '🔮', 'Archmage', 21, 'Ground spells last 10% longer per rank.', { zoneDuration: 0.1 }),
    ],
    actives: [
      A('mage_fireball', '🔥', 'Fireball', 2, 'Blast one target and ignite it.', 'magicTarget',
        { cd: 7, element: 'fire', range: 15, damage: [45, 75, 110], burn: [5, 9, 14] }),
      A('mage_frostbolt', '❄️', 'Frostbolt', 4, 'Damage and briefly freeze one target.', 'magicTarget',
        { cd: 8, element: 'frost', range: 15, damage: [38, 65, 95], stun: [1.2, 1.8, 2.5] }),
      A('mage_flamestrike', '🌋', 'Flamestrike', 6, 'Burn the aimed ground for several seconds.', 'zone',
        { cd: 22, zone: 'fire', castRange: 18, radius: [4, 5, 6], duration: [6, 8, 10], damage: [20, 32, 46], interval: 1 }),
      A('mage_blizzard', '🌨️', 'Blizzard', 8, 'A frost storm damages and slows an aimed area.', 'zone',
        { cd: 28, zone: 'frost', castRange: 18, radius: [5, 6, 7], duration: [7, 9, 11], damage: [16, 26, 38], interval: 1, stun: 0.35 }),
      A('mage_frost_nova', '🧊', 'Frost Nova', 10, 'Freeze all enemies around you.', 'magicAoe',
        { cd: 24, element: 'frost', radius: [5, 6, 7], damage: [25, 42, 62], stun: [2.5, 3.5, 4.5] }),
      A('mage_meteor', '☄️', 'Meteor', 12, 'Call a devastating burning impact at the aimed point.', 'zoneBurst',
        { cd: 38, element: 'fire', castRange: 20, radius: [4, 5, 6], damage: [120, 185, 260], burn: [10, 16, 24] }),
      A('mage_fire_breath', '🐉', 'Dragon Breath', 14, 'Scorch every enemy in a cone.', 'magicCone',
        { cd: 18, element: 'fire', range: [7, 9, 11], damage: [65, 100, 145], burn: [6, 10, 15] }),
      A('mage_ice_barrier', '🔷', 'Ice Barrier', 16, 'Gain a large frost shield.', 'shield',
        { cd: 45, amount: [100, 170, 250] }),
      A('mage_combustion', '🔥', 'Combustion', 20, 'Greatly empower fire spells for a short time.', 'buff',
        { cd: 65, buff: 'combustion', duration: [10, 13, 16], power: [0.35, 0.5, 0.7] }),
      A('mage_elemental_storm', '🌩️', 'Elemental Storm', 24, 'Fire and ice ravage a huge aimed area.', 'zone',
        { cd: 90, zone: 'elemental', castRange: 20, radius: [7, 8.5, 10], duration: [9, 12, 15], damage: [35, 52, 72], interval: 1, stun: 0.5 }),
    ] },

  { id: 'priest', icon: '⛪', name: 'Priest', color: '#f0df91',
    summary: 'Dedicated healer with renewal, holy shields, cleansing and survival miracles.',
    passives: [
      P('priest_healing', '💚', 'Greater Healing', 2, '+8% class healing per rank.', { healPower: 0.08 }),
      P('priest_benediction', '🙏', 'Benediction', 3, 'Priest cooldowns -4% per rank.', { classCdReduction: 0.04 }),
      P('priest_fortitude', '❤️', 'Fortitude', 5, '+3.5% maximum health per rank.', { hpPct: 0.035 }),
      P('priest_renewal', '🌿', 'Renewal Mastery', 7, 'Healing-over-time +12% per rank.', { hotPower: 0.12 }),
      P('priest_shields', '🛡️', 'Divine Aegis', 9, 'Holy shields +12% per rank.', { shieldPower: 0.12 }),
      P('priest_purity', '✨', 'Purity', 11, 'Poison damage -12% per rank.', { poisonCut: 0.12 }),
      P('priest_mercy', '🕊️', 'Mercy', 13, 'Healing on targets below half health +10% per rank.', { lowHpHeal: 0.1 }),
      P('priest_radiance', '☀️', 'Radiance', 15, 'Healing and holy areas +10% per rank.', { healRadius: 0.1 }),
      P('priest_guardian', '👼', 'Guardian Faith', 18, 'Guardian miracles +15% per rank.', { guardianPower: 0.15 }),
      P('priest_high_priest', '✝️', 'High Priest', 21, 'Holy damage +7% per rank.', { holyPower: 0.07 }),
    ],
    actives: [
      A('priest_heal', '💚', 'Heal', 2, 'Restore a large amount of health.', 'heal',
        { cd: 9, amount: [55, 90, 135] }),
      A('priest_renew', '🌿', 'Renew', 4, 'Regenerate health over time.', 'hot',
        { cd: 14, duration: [8, 11, 14], amount: [7, 11, 16] }),
      A('priest_flash_heal', '✨', 'Flash Heal', 6, 'A fast emergency heal with a longer cooldown.', 'heal',
        { cd: 16, amount: [90, 145, 215] }),
      A('priest_prayer', '🙏', 'Prayer of Healing', 8, 'Heal yourself and a nearby ally.', 'world',
        { cd: 25, worldAction: 'groupHeal', amount: [65, 105, 155], radius: [8, 10, 12] }),
      A('priest_shield', '🛡️', 'Power Word: Shield', 10, 'Absorb incoming damage.', 'shield',
        { cd: 28, amount: [90, 150, 225] }),
      A('priest_purify', '🕊️', 'Purify', 12, 'Remove poison and harmful effects; restore some health.', 'cleanse',
        { cd: 22, amount: [25, 45, 70] }),
      A('priest_holy_nova', '☀️', 'Holy Nova', 14, 'Heal yourself while damaging nearby enemies.', 'holyNova',
        { cd: 20, radius: [5, 6.5, 8], amount: [45, 75, 110], damage: [35, 60, 90] }),
      A('priest_guardian_spirit', '👼', 'Guardian Spirit', 16, 'Prevent one lethal hit and restore health.', 'guardian',
        { cd: 75, duration: [10, 14, 18], amount: [0.25, 0.4, 0.55] }),
      A('priest_sanctuary', '⛪', 'Sanctuary', 20, 'Consecrate the aimed ground with sustained healing.', 'zone',
        { cd: 42, zone: 'healing', castRange: 16, radius: [5, 6.5, 8], duration: [8, 11, 14], amount: [8, 13, 19], interval: 1 }),
      A('priest_resurrection', '✝️', 'Resurrection', 24, 'Revive a fallen ally or grant yourself a massive heal.', 'world',
        { cd: 100, worldAction: 'resurrection', amount: [0.45, 0.7, 1] }),
    ] },
];

export const classTreeById = (id) => CLASS_TREES.find(c => c.id === id);
export const classSkillById = (id) => {
  for (const tree of CLASS_TREES) {
    const skill = [...tree.passives, ...tree.actives].find(s => s.id === id);
    if (skill) return { ...skill, classId: tree.id, className: tree.name };
  }
  return null;
};
export const classSkillRequiredLevel = (skill, rank) =>
  Math.min(MAX_LEVEL, skill.level + Math.max(0, rank - 1) * 3);
export const classSkillMeatCost = (skill, rank) => {
  const base = (skill.type === 'active' ? 40 : 25) + skill.level * 4;
  return Math.ceil(base * rank * (1 + 0.3 * Math.max(0, rank - 1)) / 5) * 5;
};
export function classEffectsFor(classId, training = {}) {
  const effects = {};
  const tree = classTreeById(classId);
  if (!tree) return effects;
  for (const skill of tree.passives) {
    const rank = Math.max(0, Math.min(skill.maxRank, training[skill.id] || 0));
    if (!rank) continue;
    for (const [key, value] of Object.entries(skill.effects || {})) {
      effects[key] = (effects[key] || 0) + value * rank;
    }
  }
  return effects;
}
export function requiredClassForItem(item) {
  if (!item) return null;
  if (item.slot === 'companion' || item.weapon?.kind === 'bow') return 'beastmaster';
  return null;
}

// ==========================================================================
// Survival camp — buildings around the cave mouth. Your "home" upgrades
// through the ages (Hide Tent → Wooden Cabin → Stone House) and gates gear;
// the other buildings add utility. Stored chest resources survive death.
// ==========================================================================
export const CAMP_BUILDINGS = [
  // your HOME is the cave itself — upgrading it advances the whole era.
  // Ten ages: each deep-biome age also adds +10% to forged gear stats.
  { id: 'home', icon: '⛺', max: 9,
    names: ['Hide Tent', 'Wooden Cabin', 'Stone House', 'Medieval Keep', 'Runic Hall',
      'Mountain Fortress', 'Spirit Bastion', 'Primal Citadel', 'Frosthold'],
    levels: [
      { level: 2, cost: { hide: 6, wood: 10 },
        desc: 'Age 2 — your cave becomes a hide tent. Unlocks hide clothing. +20 max health.' },
      { level: 4, cost: { wood: 60, stone: 10 },
        desc: 'Age 3 — a timber cabin. Unlocks bows. +60 max health, loot magnet reaches further.' },
      { level: 7, cost: { stone: 80, wood: 30, iron: 6 },
        desc: 'Age 4 — an iron-age stone house. +120 max health, +25% chopping & mining power.' },
      { level: 9, cost: { stone: 200, wood: 150, iron: 30, hide: 20, meat: 100 },
        desc: 'Age 5 — a MEDIEVAL KEEP. Unlocks knightly gear. +180 max health, +15% XP.' },
      { level: 12, cost: { stone: 320, wood: 240, iron: 55, hide: 30, essence: 18 },
        desc: 'Age 6 — a RUNIC HALL. Unlocks runic gear and Forge Tier I (+10% gear power).' },
      { level: 15, cost: { stone: 460, wood: 330, iron: 85, hide: 45, essence: 30 },
        desc: 'Age 7 — a MOUNTAIN FORTRESS. Unlocks storm gear and Forge Tier II (+20%).' },
      { level: 18, cost: { stone: 620, wood: 430, iron: 120, hide: 60, essence: 48 },
        desc: 'Age 8 — a SPIRIT BASTION. Unlocks spirit gear and Forge Tier III (+30%).' },
      { level: 21, cost: { stone: 800, wood: 560, iron: 165, hide: 80, essence: 70 },
        desc: 'Age 9 — a PRIMAL CITADEL. Unlocks primal gear and Forge Tier IV (+40%).' },
      { level: 24, cost: { stone: 1050, wood: 720, iron: 230, hide: 110, essence: 105 },
        desc: 'Age 10 — FROSTHOLD. Unlocks summit gear and Forge Tier V (+50%).' },
    ] },
  { id: 'furnace', icon: '🔥', max: 1,
    names: ['Stone Furnace'],
    levels: [
      { level: 5, cost: { stone: 40, wood: 15 },
        desc: 'Smelts iron: automatically turns 4 🪨 into 1 🔩 every 20 s. Unlocks the iron age.' },
    ] },
  { id: 'banner', icon: '🚩', max: 3,
    names: ['War Banner', 'Rallying Standard', 'Grand Ensign'],
    levels: [
      { level: 5,  cost: { meat: 120, wood: 120, hide: 20 },
        desc: 'Raise a war banner over camp. +8% XP and the loot magnet reaches further. (A late-game meat/wood sink.)' },
      { level: 8,  cost: { meat: 320, wood: 260, iron: 20, hide: 40 },
        desc: 'A rallying standard. +16% XP, wider loot magnet, +40 max health.' },
      { level: 11, cost: { meat: 700, wood: 550, iron: 60, essence: 15 },
        desc: 'A grand ensign flying over your keep. +25% XP, widest magnet, +90 max health.' },
    ] },
];

// era = how far your home has advanced (base camp + nine upgrades)
export const ERAS = ['Stone Age', 'Hide Camp', 'Timber Age', 'Iron Age', 'Medieval',
  'Runic Age', 'Mountain Age', 'Spirit Age', 'Primal Age', 'Frost Age'];

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
  (['weapon', 'head', 'chest', 'boots', 'charm'].includes(i.slot) || !!i.shield)
  && !i.free && i.id !== 'club';

// one-time survival comforts sold in the Supplies tab (like the Bag Upgrade)
// (supply upgrades became real equippable ITEMS — see the `supply: true`
// entries in ITEMS: torch/torchoil → off-hand, socks → legs, lining →
// underlayer, bedroll → back, saddle → mount)

export const SHOP_GROUPS = [
  { key: 'weapons',  label: '⚔️ Weapons',   items: () => ITEMS.filter(i => i.slot === 'weapon' && !i.free && !i.unique && !isForgeItem(i)) },
  { key: 'friends',  label: '🐾 Companions', items: () => ITEMS.filter(i => i.slot === 'companion') },
  { key: 'spells',   label: '📖 Spells',    items: () => SPELLS },
  { key: 'training', label: '📈 Training',  items: () => STAT_TRACKS },
];

export const SMITH_GROUPS = [
  { key: 'quests',  label: '📜 Quests' },
  { key: 'weapons', label: '⚔️ Weapons', items: () => ITEMS.filter(i => i.slot === 'weapon' && !i.free && !i.unique) },
  { key: 'gear',    label: '🛡️ Gear',    items: () => ITEMS.filter(i =>
      (['head', 'chest', 'boots', 'charm'].includes(i.slot) || i.shield) && !i.unique) },
];

// ---- Quest board: each biome keeps an eight-part line, but the objectives
// now alternate between story, character, exploration, hunting and contracts.
// The world-event objectives hook into real landmarks and encounters.
export const QUEST_CATEGORY_LABELS = {
  story: '📕 Main story', character: '🧑 Personal quest', exploration: '🧭 Expedition',
  hunting: '🏹 Hunting contract', contract: '⚒️ Smith contract', repeatable: '♻️ Repeatable job',
};

const SIGNATURE_QUESTS = [
  { event: 'farm', name: '🏚️ A roof for the lost', desc: 'Find and restore the abandoned farmstead.' },
  { event: 'crypt', name: '🗝️ Sand-buried oath', desc: 'Clear and open a crypt in the Scorched Desert.' },
  { event: 'crypt', name: '🕯️ Light below the roots', desc: 'Clear and open a crypt in the Dark Forest.' },
  { event: 'tribeAlliance', name: '🪶 Terms with the marsh', desc: 'Earn safe passage from the swamp tribe at their village.' },
  { event: 'raceWin', name: '🏁 The high road', desc: 'Win a mounted race through the Highlands.' },
  { event: 'graveyardRest', name: '👻 Let the dead sleep', desc: 'Defend a haunted graveyard until its spirits rest.' },
  { event: 'temple', name: '🏛️ The broken map', desc: 'Clear a jungle temple and recover its hidden route.' },
  { event: 'summit', name: '⛰️ Nothing above us', desc: 'Reach and claim the summit of the Frozen Peak.' },
];

export function questFor(bi, idx) {
  const biome = BIOMES[bi];
  const en = (k) => biome.enemies[k % biome.enemies.length];
  const signature = SIGNATURE_QUESTS[bi] || SIGNATURE_QUESTS[0];
  const personal = bi === 7
    ? { event: 'bonfire', name: '🔥 The last pilgrim', desc: 'Relight a Frozen Peak bonfire and make it a safe refuge.' }
    : { event: 'rescue', name: '🔓 No one left in a cage', desc: 'Find a captive in this region and set them free.' };
  const defs = [
    { category: 'hunting', type: 'kill', target: en(0), need: 4 + bi,
      reward: bi === 0 ? { unlock: 'broadheadArrows' } : { resources: { hide: 2 + bi } } },
    { category: 'exploration', type: 'event', event: 'landmark', need: 1,
      reward: { reveal: 3 } },
    { category: 'contract', type: 'gather', res: bi >= 2 ? 'essence' : bi ? 'stone' : 'wood', need: 10 + bi * 3,
      reward: { resources: bi >= 2 ? { iron: 2 + bi } : { meat: 8 + bi * 2 } } },
    { category: 'character', type: 'event', event: personal.event, need: 1,
      name: personal.name, desc: personal.desc,
      reward: bi === 0 ? { resident: 'hunter', unlock: 'fireArrows' } : { maxHp: 8 + bi * 2 } },
    { category: 'story', type: 'event', event: signature.event, need: 1,
      name: signature.name, desc: signature.desc, reward: { reveal: 4, safeRoute: true } },
    { category: 'hunting', type: 'kill', target: en(2), need: 7 + bi,
      reward: { questPower: 1 } },
    { category: 'contract', type: 'killAny', need: 12 + bi * 2,
      reward: { bagSlots: 1, resources: { iron: 1 + Math.floor(bi / 2) } } },
    { category: 'story', type: 'boss', need: 1,
      reward: { questPower: 1, maxHp: 10 + bi * 2 } },
  ];
  const d = defs[idx];
  if (!d) return null;
  const q = { ...d, biome: bi, idx, xpMult: d.category === 'story' ? 1.35 : 1 };
  if (!q.name && d.type === 'kill') {
    const c = ENEMY_TYPES[d.target];
    q.name = `${c.icon} Hunt: ${c.name}`;
    q.desc = `Track and slay ${d.need} ${c.name}s in the ${biome.name}.`;
  } else if (!q.name && d.type === 'gather') {
    q.name = `${RES_ICONS[d.res]} Fetch: ${d.res}`;
    q.desc = `Recover ${d.need} ${d.res} for the forge.`;
  } else if (!q.name && d.type === 'killAny') {
    q.name = '⚔️ Break the threat';
    q.desc = `Slay ${d.need} hostile creatures of the ${biome.name}.`;
  } else if (!q.name && d.type === 'boss') {
    q.name = '💀 The heart of the wilds';
    q.desc = `Bring down a skull-ranked boss in the ${biome.name}.`;
  } else if (!q.name && d.event === 'landmark') {
    q.name = '🧭 Leave the beaten path';
    q.desc = `Find and resolve a landmark encounter in the ${biome.name}.`;
  }
  return q;
}

export function repeatableQuestFor(bi, completed = 0) {
  const biome = BIOMES[bi];
  const target = biome.enemies[(completed + bi) % biome.enemies.length];
  const cfg = ENEMY_TYPES[target];
  return {
    biome: bi, idx: 'repeatable', repeatable: true, category: 'repeatable',
    type: 'kill', target, need: 5 + Math.floor(bi / 2), count: 0, xpMult: 0.55,
    name: `${cfg.icon} Open bounty: ${cfg.name}`,
    desc: `A repeatable smith bounty for ${5 + Math.floor(bi / 2)} ${cfg.name}s.`,
    reward: { resources: { iron: 1 + Math.floor(bi / 2), meat: 4 + bi } },
  };
}
export const QUESTS_PER_BIOME = 8;
