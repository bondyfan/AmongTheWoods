// ---- World & progression configuration ----

// The survival world is a round CONTINENT of WoW-style zones stacked like
// the Eastern Kingdoms. The Verdant valley (cave + camp) sits walled-in at
// the center; the seven wild zones are stacked bands and lobes around it,
// and ONLY consecutive tiers share a gated border — every other border is
// an impassable wall, so the journey is forced along the whole chain
// Desert → Dark Forest → Swamp → Highlands → Haunted → Jungle → Frozen Peak.
export const WORLD = {
  radius: 3000,     // hard world bound — the island plus a ring of open ocean
  goalR: 2400,      // "crossed the wilds" — this deep into the Frozen Peak
  caveR: 9,         // the starting cave at the center of the valley
  hubR: 800,        // Verdant valley radius (its mountain rim wobbles ±60)
};

export const radiusOf = (x, z) => Math.hypot(x, z);

// ---- zone geometry: an ISLAND continent (Eastern-Kingdoms style) ----
// Ocean all around; the coastline is irregular, with a pointy southern tip
// (the Jungle cape and its harbor) and a pointy northern spire (the Frozen
// Peak summit). Bands from south (+z) to north (-z), split by column lines:
//   wz > 1480              Jungle (2) — the southern lobe with the cape
//   1480 ≥ wz > 630        Desert (1) west | Murky Swamp (3) east
//   630 ≥ wz > -520        Desert wraps the west flank | Dark Forest (4) east
//                          (the Verdant valley blob sits in the middle and
//                           seals the band, so Desert and Dark never touch)
//   -520 ≥ wz > -1480      Highlands (6) west | Haunted Forest (5) east
//   wz ≤ -1480             Frozen Peak (7) — the northern cap
export const ZONE_COUNT = 7;
const LZ = { s2: 1480, s1: 630, n1: -520, n2: -1480 };
const LX = { ds: 0, jx: -160 };
// border lines the world builder walks to raise barriers along them
export const ZONE_LINES = [
  { axis: 'z', c: LZ.s2 },
  { axis: 'z', c: LZ.s1 },
  { axis: 'z', c: LZ.n1 },
  { axis: 'z', c: LZ.n2 },
  { axis: 'x', c: LX.ds, lo: LZ.s1, hi: LZ.s2 },
  { axis: 'x', c: LX.jx, lo: LZ.n2, hi: LZ.n1 },
];

// Deterministic value noise on a FIXED seed: the zone map is identical for
// every world seed (like the old rings were), so any client can classify any
// point without a world instance.
function zHash(ix, iz, s) {
  let h = ix * 374761393 + iz * 668265263 + s * 1442695;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function zNoise(x, z, scale, s) {
  const fx = x / scale, fz = z / scale;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const ux = fx - ix, uz = fz - iz;
  const tx = ux * ux * (3 - 2 * ux), tz = uz * uz * (3 - 2 * uz);
  const a = zHash(ix, iz, s), b = zHash(ix + 1, iz, s);
  const c = zHash(ix, iz + 1, s), d = zHash(ix + 1, iz + 1, s);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}
// Border wobble fields — the classifier, barriers, water and collision all
// read these SAME fields, so they always agree on where a border runs.
// Amplitudes stay below the noise slope limit so every border is a single
// smooth curve (no folded phantom strips).
export const wobX = (x, z) => (zNoise(x, z, 300, 11) - 0.5) * 140;
export const wobZ = (x, z) => (zNoise(x, z, 300, 37) - 0.5) * 140;
export const hubEdgeR = (x, z) => WORLD.hubR + (zNoise(x, z, 260, 23) - 0.5) * 120;

// ---- the coastline ----
// Distance from the island center to the waterline in the direction of
// (x,z): a slightly waisted oval with a pointy southern cape (Jungle) and a
// pointy northern spire (Frozen Peak), roughened by fixed-seed noise so the
// coast is ragged like a real continent. >0 from coastDistAt = on land.
const angDiffAbs = (a, b) => {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
};
export function coastRAt(x, z) {
  const a = Math.atan2(x, z); // 0 = due south (+z), ±π = due north
  let r = 2180 + 140 * Math.cos(2 * a);            // waisted east-west
  const dS = angDiffAbs(a, 0), dN = angDiffAbs(a, Math.PI);
  r += 420 * Math.exp(-((dS / 0.30) ** 2));        // the Jungle cape
  r += 470 * Math.exp(-((dN / 0.26) ** 2));        // the Frozen spire
  r += (zNoise(Math.sin(a) * 1600 + 4000, Math.cos(a) * 1600 + 4000, 420, 51) - 0.5) * 260;
  return r;
}
export const coastDistAt = (x, z) => coastRAt(x, z) - radiusOf(x, z);

// ---- harbors + the pirate ship line ----
// A big ship calls at the Jungle cape and at the western landing of the
// Frozen Peak: docked DOCK_T seconds (time to board), then sails out for
// SAIL_T, teleports across the ocean, and sails the last SAIL_T into the
// other harbor. Positions are resolved against the real coast in world.js.
export const HARBOR_SPECS = [
  { id: 'jungle', name: 'Cape Harbor',    a: 0.10, zone: 2 },
  { id: 'frozen', name: 'Frost Landing',  a: -2.52, zone: 7 },
];
// SPEED × SAIL_T = how far out the she sails before the mid-ocean teleport —
// kept short enough that she stays a visible part of the harbor scenery
export const SHIP = { DOCK_T: 120, SAIL_T: 60, SPEED: 5 };

// Everything about the zone under (x,z): its index, how far the nearest
// zone border is, and (near borders) which zone lies across it.
export function zoneInfoAt(x, z, shallow = false) {
  const r = radiusOf(x, z);
  const blobR = hubEdgeR(x, z);
  const wx = x + wobX(x, z), wz = z + wobZ(x, z);
  let idx;
  if (r <= blobR) idx = 0;
  else if (wz > LZ.s2) idx = 2;
  else if (wz > LZ.s1) idx = wx < LX.ds ? 1 : 3;
  else if (wz > LZ.n1) idx = wx < 0 ? 1 : 4;
  else if (wz > LZ.n2) idx = wx < LX.jx ? 6 : 5;
  else idx = 7;

  // nearest border: the valley rim plus the real border lines. The z=630
  // line west of the valley separates Desert from Desert (the wrap), so it
  // doesn't count as a border there.
  let d = Math.abs(r - blobR), wAxis = 'r', wC = 0;
  const consider = (dist, axis, c) => { if (dist < d) { d = dist; wAxis = axis; wC = c; } };
  consider(Math.abs(wz - LZ.s2), 'z', LZ.s2);
  consider(Math.abs(wz - LZ.n1), 'z', LZ.n1);
  consider(Math.abs(wz - LZ.n2), 'z', LZ.n2);
  if (wx > -50) consider(Math.abs(wz - LZ.s1), 'z', LZ.s1);
  if (wz > LZ.s1 - 120 && wz < LZ.s2 + 120) consider(Math.abs(wx - LX.ds), 'x', LX.ds);
  if (wz > LZ.n2 - 120 && wz < LZ.n1 + 120) consider(Math.abs(wx - LX.jx), 'x', LX.jx);

  let nearIdx = idx;
  if (!shallow && d < 30) {
    // probe just across the winning border for the neighbour's index
    const step = d * 1.6 + 18;
    let px = x, pz = z;
    if (wAxis === 'r') { const k = (r + (r < blobR ? step : -step)) / (r || 1); px = x * k; pz = z * k; }
    else if (wAxis === 'z') pz = z + (wz < wC ? step : -step);
    else px = x + (wx < wC ? step : -step);
    nearIdx = zoneInfoAt(px, pz, true).idx;
  }
  return { idx, borderDist: d, nearIdx };
}

// Zone palettes & rosters, index = difficulty tier (0 = homeland).
// ground/ground2 = two grass tones blended by noise, dirt = patch color.
// trees = weights for tree variants, snowy adds snow caps to pines.
// packs: null = no packs in this zone, otherwise spawn config.
export const BIOMES = [
  { name: 'Verdant Forest', ground: 0x5a8a3e, ground2: 0x6f9d4a, dirt: 0x8a6b42,
    fog: 0xd8ecc2, sky: 0x8ecdf2,
    foliage: [0x2f7a2f, 0x429340, 0x55a648], trunk: 0x6b4a2d,
    trees: { pine: 0.4, leafy: 0.4, birch: 0.2, dead: 0 }, snowy: false,
    grass: 0x6fa04c, flowers: true, mushrooms: false,
    enemies: ['rat', 'spider', 'snake'], humanoids: ['bandit'], packs: null, treeDensity: 1.0, denseForests: true,
    critters: ['rabbit', 'rabbit', 'rabbit', 'sheep'], night: { remove: ['rabbit', 'sheep'], add: 'spider' } },
  { name: 'Scorched Desert', ground: 0xd8b878, ground2: 0xc9a860, dirt: 0xb89050,
    fog: 0xe8d8b0, sky: 0xbcd8e8, desert: true,
    foliage: [0x8a9a5a, 0x7a8a4a, 0x9aaa6a], trunk: 0x8a6b42,
    trees: { pine: 0, leafy: 0.1, birch: 0, dead: 0.9 }, snowy: false,
    grass: 0xc9b878, flowers: false, mushrooms: false,
    enemies: ['scorpion', 'cobra', 'vulture', 'snake', 'cactusman'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.85, 0.15, 0] }, treeDensity: 0.3,
    critters: ['rabbit', 'rabbit'], night: { remove: ['rabbit', 'vulture'], add: 'scorpion' } },
  { name: 'Jungle',         ground: 0x2f8a28, ground2: 0x3a9c32, dirt: 0x7a6030,
    fog: 0x8ac878, sky: 0x8cc8e0,
    foliage: [0x1f6b2a, 0x2d8a34, 0x39a03e], trunk: 0x5a4426,
    trees: { pine: 0.1, leafy: 0.7, birch: 0.2, dead: 0 }, snowy: false,
    grass: 0x4f8f3a, flowers: true, mushrooms: true, jungleFlora: true,
    enemies: ['stormsnake', 'cheetah', 'crocodile', 'harpy', 'bogCrawler', 'snapper', 'panther'], humanoids: ['tribesman'], packs: { skulls: [0.7, 0.3, 0] }, treeDensity: 1.6, denseForests: true,
    critters: ['rabbit', 'horse'], night: { remove: ['rabbit'], add: 'panther' } },
  { name: 'Murky Swamp',    ground: 0x565c30, ground2: 0x4a5230, dirt: 0x3a3c28,
    fog: 0x3c4a44, sky: 0x3a4650, darkness: 0.4, light: 0.62,
    foliage: [0x3a5a30, 0x2e4a2a, 0x4a6438], trunk: 0x453a28,
    trees: { pine: 0.2, leafy: 0.5, birch: 0, dead: 0.3 }, snowy: false,
    grass: 0x60704a, flowers: false, mushrooms: true,
    enemies: ['snake', 'venomspider', 'stormsnake', 'boar', 'bogCrawler', 'crocodile'], humanoids: ['tribesman', 'shaman'], packs: { skulls: [0.5, 0.4, 0.1] }, treeDensity: 0.9, denseForests: true,
    critters: [], night: { remove: ['boar'], add: 'venomspider' } },
  { name: 'Dark Forest',    ground: 0x2c4a24, ground2: 0x24401f, dirt: 0x4a3a24,
    // fogCap = the fog wall never opens past this (meters) — darkness ahead
    fog: 0x10160f, sky: 0x141b1e, darkness: 0.68, light: 0.5, fogCap: 90,
    foliage: [0x1e4a22, 0x27552a, 0x1a3f2e], trunk: 0x4c3520,
    trees: { pine: 0.55, leafy: 0.25, birch: 0, dead: 0.2 }, snowy: false,
    grass: 0x44663a, flowers: false, mushrooms: true,
    enemies: ['spider', 'snake', 'wolf', 'venomspider', 'bat'], humanoids: ['bandit', 'banditBrute'], packs: { skulls: [0.4, 0.4, 0.2] }, treeDensity: 1.3, denseForests: true,
    spiderHaunt: true, webField: true, critters: ['rabbit'], night: { remove: ['rabbit', 'snake'], add: 'venomspider' } },
  { name: 'Haunted Forest', ground: 0x3a3a44, ground2: 0x32323c, dirt: 0x4c4258,
    // pitch-black past a dozen meters — the haunted wood is a tunnel of dark
    fog: 0x080711, sky: 0x0c0a12, darkness: 0.84, light: 0.4, fogCap: 42,
    foliage: [0x2a3a28, 0x1e2e20, 0x3a3448], trunk: 0x3a3230,
    trees: { pine: 0.3, leafy: 0.1, birch: 0, dead: 0.6 }, snowy: false,
    grass: 0x5c6650, flowers: false, mushrooms: true,
    enemies: ['zombie', 'bat', 'venomspider', 'wolf', 'treant', 'elk', 'ghost'], humanoids: ['shaman', 'poacher'], packs: { skulls: [0.3, 0.45, 0.25] }, treeDensity: 1.1, denseForests: true,
    spiderHaunt: true, critters: ['horse'], night: { remove: ['horse', 'elk'], add: 'ghost' } },
  { name: 'Highlands',      ground: 0x9a8a50, ground2: 0xa89658, dirt: 0xa8874f,
    fog: 0xc9c0a0, sky: 0x9db4c4,
    foliage: [0x5c6e33, 0x6d7d3a, 0x4e5e2c], trunk: 0x5c4a33,
    trees: { pine: 0.5, leafy: 0.1, birch: 0.1, dead: 0.3 }, snowy: false,
    grass: 0x8f9060, flowers: false, mushrooms: false,
    enemies: ['wolf', 'boar', 'elk', 'venomspider', 'stormsnake', 'harpy', 'bear'], humanoids: ['poacher'], packs: { skulls: [0.2, 0.5, 0.3] }, treeDensity: 0.7,
    critters: ['rabbit', 'rabbit', 'sheep', 'horse'], night: { remove: ['rabbit', 'sheep'], add: 'wolf' } },
  { name: 'Frozen Peak',    ground: 0xf2f6fa, ground2: 0xe4ecf3, dirt: 0xc9d6e1,
    fog: 0xf4f8fc, sky: 0xdfe9f2,
    foliage: [0x8fb0c0, 0x3d6155, 0xcfdfe8], trunk: 0x3d3229,
    trees: { pine: 0.7, leafy: 0, birch: 0, dead: 0.3 }, snowy: true,
    grass: 0xdde7ee, flowers: false, mushrooms: false,
    enemies: ['icewolf', 'icespider', 'wendigo', 'yeti', 'icegolem', 'frostWisp'], packs: { skulls: [0, 0.5, 0.5] }, treeDensity: 0.5,
    critters: ['horse'], night: { remove: ['horse', 'icespider'], add: 'wendigo' } },
];

export function biomeIndexAt(x, z) { return zoneInfoAt(x, z).idx; }
export function biomeAt(x, z) { return BIOMES[biomeIndexAt(x, z)]; }

// 0..1 journey progress used for difficulty scaling: the zone's tier plus
// how deep into that zone you've pushed. Crossing into a higher-tier zone is
// a difficulty CLIFF — the borders are real frontiers, WoW style.
export function progressAt(x, z) {
  const r = radiusOf(x, z);
  const idx = biomeIndexAt(x, z);
  const depth = idx === 0
    ? Math.min(1, r / WORLD.hubR)
    : Math.max(0, Math.min(1, (r - WORLD.hubR) / (2400 - WORLD.hubR)));
  return Math.min(1, (idx + depth) / BIOMES.length);
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
export const HIDE_BEARING = new Set(['wolf', 'boar', 'elk', 'bear', 'icewolf', 'wendigo', 'yeti',
  'cheetah', 'crocodile']);
// hides scale with the creature's LEVEL (mob HP is level-driven now)
export const hideForLevel = (level) => Math.max(1, Math.round(level / 8));
export const VERDANT_HIDE_DROP = 0.1;

// ---- Enemies, WoW style: a creature's real hit points and damage come from
// its LEVEL (ENEMY_HP/ENEMY_DMG curves above) times the ARCHETYPE multipliers
// here. hpMult ≈ bulk (0.05 rabbit … 2.6 ice golem), dmgMult ≈ hitting power,
// meleeDmgMult (ranged types) = bite vs shot, xpMult ≈ kill-reward quality.
// Ranged enemies chase and melee like everyone else, but ALSO have a shot
// "spell": every spellCd seconds they stop for half a second, fire, then run
// again (a charge bar above them shows the spell loading).
// Flying enemies hover above the ground.
export const ENEMY_TYPES = {
  // -- Verdant Forest --
  rabbit: { name: 'Rabbit', icon: '🐇',
             hpMult: 0.05,   dmgMult: 0,  speed: 7.5, range: 0,   attackCd: 1.0, xpMult: 0.15,  hitR: 0.35, aggro: 0,
             passive: true, herd: [3, 10] },
  sheep:  { name: 'Sheep', icon: '🐑',
             hpMult: 0.3,  dmgMult: 0,  speed: 3.5, range: 0,   attackCd: 1.0, xpMult: 0.3,  hitR: 0.6, aggro: 0,
             passive: true, herd: [10, 20], guardian: 'wolf' },
  horse:   { name: 'Wild Horse', icon: '🐴',
             hpMult: 0.8, dmgMult: 0,  speed: 10.5, range: 0,  attackCd: 1.0, xpMult: 0.4,  hitR: 0.8, aggro: 0,
             passive: true, herd: [4, 9] }, // saddle one (E) and RIDE it
  rat:     { name: 'Giant Rat', icon: '🐀',
             hpMult: 0.75,  dmgMult: 0.75,  speed: 5, range: 1.2, attackCd: 0.9, xpMult: 0.8,  hitR: 0.5,  aggro: 13 },
  spider:  { name: 'Forest Spider', icon: '🕷️',
             hpMult: 1,  dmgMult: 0.9,  speed: 6, range: 1.3, attackCd: 1.0, xpMult: 1,  hitR: 0.7,  aggro: 13 },
  snake:   { name: 'Grass Snake', icon: '🐍',
             hpMult: 0.85,  dmgMult: 1.1,  speed: 4.5, range: 1.5, attackCd: 1.3, xpMult: 1, hitR: 0.6,  aggro: 12 },
  // -- Desert (2nd ring) --
  scorpion: { name: 'Sand Scorpion', icon: '🦂',
             hpMult: 0.9, dmgMult: 0.95,  speed: 6,   range: 1.4, attackCd: 1.1, xpMult: 1,  hitR: 0.55, aggro: 14,
             poison: { dps: 2, dur: 3 } }, // a venomous sting
  cobra:   { name: 'Spitting Cobra', icon: '🐍',
             hpMult: 0.8, dmgMult: 1,  meleeDmgMult: 0.8, speed: 5,  range: 1.4, attackCd: 1.2, xpMult: 1, hitR: 0.55, aggro: 15,
             ranged: true, shootRange: 8, spellCd: 2.4, projectileSpeed: 18, shotColor: 0xc9e05a },
  vulture: { name: 'Desert Vulture', icon: '🦅',
             hpMult: 0.7, dmgMult: 0.85,  speed: 11,  range: 1.4, attackCd: 1.1, xpMult: 0.9,  hitR: 0.55, aggro: 16, flying: true },
  bee: { name: 'Angry Bee', icon: '🐝',
             hpMult: 0.04, dmgMult: 0.35, speed: 9, range: 1.0, attackCd: 0.8, xpMult: 0.1, hitR: 0.3, aggro: 40, flying: true },
  cactusman: { name: 'Saguaro Sentinel', icon: '🌵',
             hpMult: 2.4, dmgMult: 0.9, speed: 0, range: 1.6, attackCd: 1.2, xpMult: 1.3, hitR: 0.7, aggro: 9,
             ranged: true, shootRange: 10, spellCd: 2.6, projectileSpeed: 16, shotColor: 0xbfe07a, radial: 12 },
  // -- Dark Forest --
  wolf:    { name: 'Black Wolf', icon: '🐺',
             hpMult: 0.95,  dmgMult: 1, speed: 9.5, range: 1.6, attackCd: 1.0, xpMult: 1, hitR: 0.8,  aggro: 16, behavior: 'pack' },
  venomspider: { name: 'Venom Spider', icon: '☣️',
             hpMult: 1.1,  dmgMult: 1.05, meleeDmgMult: 0.8, speed: 6.5, range: 1.4, attackCd: 1.1, xpMult: 1.1, hitR: 0.8, aggro: 18,
             ranged: true, shootRange: 8.5, spellCd: 2.5, projectileSpeed: 15, shotColor: 0x8aff3a, behavior: 'kite' },
  bat:     { name: 'Cave Bat', icon: '🦇',
             hpMult: 0.55,  dmgMult: 0.8,  speed: 11, range: 1.4, attackCd: 1.1, xpMult: 0.7, hitR: 0.6,  aggro: 18, flying: true },
  // -- Haunted Forest --
  zombie:  { name: 'Zombie', icon: '🧟',
             hpMult: 1.6,  dmgMult: 1.15, speed: 4, range: 1.7, attackCd: 1.3, xpMult: 1.2, hitR: 0.85, aggro: 19,
             poison: { dps: 2, dur: 4 } }, // rotting claws fester — Haunted Forest hazard
  // -- Highlands --
  boar:    { name: 'Wild Boar', icon: '🐗',
             hpMult: 1.35,  dmgMult: 1.2, speed: 8, range: 1.7, attackCd: 1.1, xpMult: 1.1, hitR: 0.9,  aggro: 14 },
  elk:     { name: 'Mad Elk', icon: '🦌',
             hpMult: 1.5, dmgMult: 1.3, speed: 10.5, range: 1.9, attackCd: 1.4, xpMult: 1.2, hitR: 1.0,  aggro: 14 },
  stormsnake: { name: 'Storm Serpent', icon: '⚡',
             hpMult: 0.95,  dmgMult: 0.9,  meleeDmgMult: 1, speed: 5.5, range: 1.5, attackCd: 1.2, xpMult: 1.1, hitR: 0.6, aggro: 18,
             ranged: true, shootRange: 10, spellCd: 3.0, projectileSpeed: 30, shotColor: 0xffe94a, stun: 1.2 },
  // -- Ice creatures (Frozen Peak) --
  icewolf: { name: 'Ice Wolf', icon: '❄️',
             hpMult: 1, dmgMult: 1.1, speed: 10, range: 1.6, attackCd: 0.9, xpMult: 1, hitR: 0.8,  aggro: 17, behavior: 'pack' },
  icespider: { name: 'Frost Spider', icon: '🕸️',
             hpMult: 1.1, dmgMult: 1, meleeDmgMult: 0.85, speed: 7, range: 1.4, attackCd: 1.1, xpMult: 1, hitR: 0.8, aggro: 18,
             ranged: true, shootRange: 9, spellCd: 2.2, projectileSpeed: 17, shotColor: 0x8ae0ff, behavior: 'kite' },
  bear:    { name: 'Grizzly Bear', icon: '🐻',
             hpMult: 1.9, dmgMult: 1.45, speed: 8.5, range: 2.1, attackCd: 1.5, xpMult: 1.4, hitR: 1.2,  aggro: 16, behavior: 'heavy' },
  // -- Frozen Peak --
  wendigo: { name: 'Wendigo', icon: '👹',
             hpMult: 1.5, dmgMult: 1.35, speed: 11, range: 2.0, attackCd: 1.2, xpMult: 1.2, hitR: 0.9,  aggro: 20 },
  yeti:    { name: 'Yeti', icon: '🏔️',
             hpMult: 2.3, dmgMult: 1.6, speed: 9, range: 2.5, attackCd: 1.7, xpMult: 1.5, hitR: 1.5,  aggro: 18, behavior: 'heavy' },
  // -- humanoids: bandits, tribes & other two-legged trouble. Rarer than
  // beasts, and they travel in small camps (2-5 together). --
  bandit:  { name: 'Bandit', icon: '🗡️',
             hpMult: 0.7,  dmgMult: 0.9,  meleeDmgMult: 0.6, speed: 6, range: 1.4, attackCd: 1.2, xpMult: 0.9, hitR: 0.55, aggro: 15,
             humanoid: true, ranged: true, spear: true, shootRange: 10, spellCd: 2.4, projectileSpeed: 20, shotColor: 0xb08a5a },
  banditBrute: { name: 'Bandit Brute', icon: '🪓',
             hpMult: 1.3, dmgMult: 1.1, speed: 6.5, range: 1.7, attackCd: 1.2, xpMult: 1.1, hitR: 0.8, aggro: 15,
             humanoid: true },
  tribesman: { name: 'Wild Tribesman', icon: '🪃',
             hpMult: 1, dmgMult: 1, meleeDmgMult: 0.85, speed: 7, range: 1.5, attackCd: 1.1, xpMult: 1, hitR: 0.6, aggro: 16,
             humanoid: true, ranged: true, shootRange: 9.5, spellCd: 2.4, projectileSpeed: 24, shotColor: 0xc96f3a },
  shaman:  { name: 'Bog Shaman', icon: '🔮',
             hpMult: 0.85, dmgMult: 1.05, meleeDmgMult: 0.7, speed: 5, range: 1.4, attackCd: 1.3, xpMult: 1.1, hitR: 0.6, aggro: 17,
             humanoid: true, ranged: true, shootRange: 10, spellCd: 2.8, projectileSpeed: 16, shotColor: 0xb26fff },
  poacher: { name: 'Poacher', icon: '🎯',
             hpMult: 1.1, dmgMult: 1.1, meleeDmgMult: 0.85, speed: 6.5, range: 1.5, attackCd: 1.2, xpMult: 1.1, hitR: 0.6, aggro: 18,
             humanoid: true, ranged: true, shootRange: 11, spellCd: 2.6, projectileSpeed: 26, shotColor: 0xd8d0b0 },
  // -- new beasts --
  thornling: { name: 'Thornling', icon: '🌿',
             hpMult: 0.5,  dmgMult: 0.7,  meleeDmgMult: 0.6, speed: 4, range: 1.2, attackCd: 1.2, xpMult: 0.5,  hitR: 0.5, aggro: 12,
             ranged: true, shootRange: 8, spellCd: 2.6, projectileSpeed: 14, shotColor: 0x7fce4f },
  treant:  { name: 'Treant', icon: '🌳',
             hpMult: 1.6, dmgMult: 1.1, speed: 4.5, range: 1.9, attackCd: 1.5, xpMult: 1.1, hitR: 1.1, aggro: 13, behavior: 'heavy' },
  bogCrawler: { name: 'Bog Crawler', icon: '🦀',
             hpMult: 1.15, dmgMult: 1.05, speed: 7, range: 1.5, attackCd: 1.1, xpMult: 1, hitR: 0.8, aggro: 15 },
  harpy:   { name: 'Harpy', icon: '🦅',
             hpMult: 0.9, dmgMult: 0.95, meleeDmgMult: 0.9, speed: 10, range: 1.5, attackCd: 1.1, xpMult: 1, hitR: 0.7, aggro: 18,
             flying: true, ranged: true, shootRange: 8, spellCd: 2.5, projectileSpeed: 20, shotColor: 0xe8e0c0 },
  frostWisp: { name: 'Frost Wisp', icon: '💠',
             hpMult: 1.05, dmgMult: 1.15, meleeDmgMult: 0.7, speed: 6, range: 1.2, attackCd: 1.4, xpMult: 1.1, hitR: 0.6, aggro: 16,
             flying: true, ranged: true, shootRange: 10, spellCd: 2.2, projectileSpeed: 18, shotColor: 0x9fe8ff },
  snapper: { name: 'Snapjaw Bloom', icon: '🪷',
             hpMult: 1.9, dmgMult: 1.4, speed: 0, range: 2.3, attackCd: 1.0, xpMult: 1.2, hitR: 0.8, aggro: 6 },
  icegolem: { name: 'Ice Golem', icon: '🗿',
             hpMult: 2.6, dmgMult: 1.7, meleeDmgMult: 1.2, speed: 4, range: 2.2, attackCd: 1.8, xpMult: 1.6, hitR: 1.4, aggro: 18,
             ranged: true, shootRange: 10, spellCd: 4.0, projectileSpeed: 13, shotColor: 0xbfe8ff, stun: 0.8 },
  // -- Haunted Forest: restless spirits drift between the dead trees --
  ghost:   { name: 'Restless Ghost', icon: '👻',
             hpMult: 0.95, dmgMult: 1.05, meleeDmgMult: 0.85, speed: 7, range: 1.4, attackCd: 1.3, xpMult: 1.1, hitR: 0.7, aggro: 19,
             flying: true, ranged: true, shootRange: 9, spellCd: 3.0, projectileSpeed: 16, shotColor: 0xbfc8ff, stun: 0.7 },
  // -- Jungle: the canopy hides ambush predators --
  panther: { name: 'Shadow Panther', icon: '🐆',
             hpMult: 1.25, dmgMult: 1.5, speed: 11.5, range: 1.6, attackCd: 0.9, xpMult: 1.3, hitR: 0.8, aggro: 24 },
  cheetah: { name: 'Cheetah', icon: '🐆',
             hpMult: 0.85, dmgMult: 1.25, speed: 12.5, range: 1.5, attackCd: 0.8, xpMult: 1.1, hitR: 0.7, aggro: 20,
             behavior: 'pack' },
  crocodile: { name: 'River Crocodile', icon: '🐊',
             hpMult: 1.7, dmgMult: 1.4, speed: 5.5, range: 1.8, attackCd: 1.4, xpMult: 1.2, hitR: 1.0, aggro: 13,
             behavior: 'heavy' },
  // -- Griffins: flight-master bosses of the open rings. They never truly
  // die — beaten, they drop their nest and fly beyond the horizon --
  griffin: { name: 'Griffin', icon: '🦅',
             hpMult: 1.6, dmgMult: 1.3, speed: 3.6, range: 2.0, attackCd: 1.1, xpMult: 2, hitR: 1.1, aggro: 24,
             flying: true, griffin: true },
  villager: { name: 'Villager', icon: '🧑‍🌾',
             hpMult: 0.3,  dmgMult: 0,  speed: 2.3, range: 0,   attackCd: 1.0, xpMult: 0.2,  hitR: 0.4, aggro: 0,
             passive: true, herd: [3, 6] },
  griffinChick: { name: 'Griffin Fledgling', icon: '🐤',
             hpMult: 0.8, dmgMult: 0.75, speed: 3.8, range: 1.4, attackCd: 1.0, xpMult: 0.6, hitR: 0.55, aggro: 22,
             flying: true },
};

// ---- WoW-style level curves. EVERYTHING combat-related keys off level now:
// creature hit points and damage come from these curves times the creature's
// archetype multipliers (hpMult/dmgMult in ENEMY_TYPES), the player's base
// pool comes from PLAYER_HP. Tuned so an equal-level standard mob takes
// ~7-11 s to kill with era-appropriate gear and ~14-17 hits to kill YOU. ----
export const PLAYER_HP = (level) => Math.round(82 + 18 * level + 0.9 * level * level);
export const ENEMY_HP = (level) => Math.round(120 + 60 * level + 5.2 * level * level);
export const ENEMY_DMG = (level) => Math.round((5 + 2.6 * level + 0.06 * level * level) * 10) / 10;
// XP paid by a standard mob of a level (elites ×2, bosses × their rank mult)
export const xpKillFor = (level) => Math.round(14 + 5.2 * level);
// Out-of-combat recovery, WoW style: after OOC_DELAY seconds with no damage
// dealt or taken, you knit back a FLAT amount of health per second. It grows
// with level, but LINEARLY — far slower than the quadratic health pool — so a
// fresh level-1 (small pool) heals to full in ~12 s while a level-50 with a
// huge pool needs ~40 s. The bigger you get, the longer a breather takes.
// Gear regen adds on top and rest gear (bedroll etc.) multiplies it.
export const OOC_DELAY = 5;
export const oocRegenFor = (level) => 7 + 1.5 * level; // flat hp/s, not a %

// Each zone covers a WoW-style level band (index = difficulty tier). The gap
// between Verdant and the Desert is intentional — the first border bites.
export const ZONE_LEVEL_BANDS = [[1, 5], [7, 12], [13, 18], [19, 24],
  [25, 30], [31, 36], [37, 43], [44, 50]];

export function biomeIndexForDifficulty(difficulty = 0) {
  // progressAt packs (tier + depth) / zoneCount into 0..1 — invert the tier
  return Math.max(0, Math.min(BIOMES.length - 1,
    Math.floor(Math.max(0, difficulty) * BIOMES.length)));
}

// creature "threat" used to spread a zone's roster across its level band
const enemyThreat = (t) => {
  const c = ENEMY_TYPES[t] ?? {};
  return (c.hpMult ?? 1) * 0.6 + (c.dmgMult ?? 1) * 0.4;
};

export function enemyLevelFor(type, difficulty = 0, bossRank = 0, elite = false) {
  const cfg = ENEMY_TYPES[type] ?? {};
  const biomeIndex = biomeIndexForDifficulty(difficulty);
  const [lo, hi] = ZONE_LEVEL_BANDS[biomeIndex];
  if (cfg.passive) return lo;

  const biome = BIOMES[biomeIndex];
  const roster = [...new Set([...(biome.enemies ?? []), ...(biome.humanoids ?? []),
    ...(biome.night?.add ? [biome.night.add] : [])])]
    .filter(t => !ENEMY_TYPES[t]?.passive)
    .sort((a, b) => enemyThreat(a) - enemyThreat(b));
  const position = Math.max(0, roster.indexOf(type));
  const strengthOffset = roster.length <= 1 ? 1
    : Math.min(2, Math.floor((position / (roster.length - 1)) * 3));
  // how deep into the zone the spawn sits pushes it up its band
  const depth = Math.max(0, Math.min(1, difficulty * BIOMES.length - biomeIndex));
  const baseLevel = lo + Math.round(depth * Math.max(0, hi - lo - 2)) + strengthOffset;
  const eliteLevels = elite ? 2 : 0;
  const bossLevels = bossRank * 2;
  let level = Math.min(hi, baseLevel) + eliteLevels + bossLevels;
  level = Math.min(MAX_LEVEL + 5, level);
  // Verdant Forest (the starter ring) must stay gentle: its snakes and
  // spiders never climb above level 3, even as elites.
  if (biomeIndex === 0 && (type === 'snake' || type === 'spider')) level = Math.min(3, level);
  return level;
}

// The level a creature typically spawns at (mid-depth of its home zone) —
// used by the bestiary and other displays that need stats without a spawn.
export function enemyTypicalLevel(type) {
  const bi = BIOMES.findIndex(b => b.enemies?.includes(type)
    || b.humanoids?.includes(type) || b.night?.add === type || b.critters?.includes(type));
  const biomeIndex = Math.max(0, bi);
  return enemyLevelFor(type, (biomeIndex + 0.5) / BIOMES.length);
}

// Pack bosses ("the mother") by skull rank (index 0 = 1 skull).
// packSize = minions spawned with her; while she lives, reinforceCount minions
// keep arriving from all directions every reinforceInterval seconds.
// NOTE: bosses ALSO sit +2 levels per skull on the level curves now, so these
// multipliers stack on top of already-bigger level stats. Tuned for WoW-style
// fight lengths: 1-skull ≈ 20-30 s, 3-skull ≈ 60-90 s of sustained damage.
export const BOSS_RANKS = [
  { skulls: 1, hpMult: 2,   dmgMult: 1.4, sizeMult: 1.5, xpMult: 3,  meatMult: 3, dropChance: 0.10,
    packSize: 8,  reinforceInterval: 6.0, reinforceCount: 1 },
  { skulls: 2, hpMult: 3,   dmgMult: 1.8, sizeMult: 1.8, xpMult: 6,  meatMult: 5, dropChance: 0.25,
    packSize: 11, reinforceInterval: 4.0, reinforceCount: 2 },
  { skulls: 3, hpMult: 4.5, dmgMult: 2.4, sizeMult: 2.2, xpMult: 10, meatMult: 8, dropChance: 0.50,
    packSize: 14, reinforceInterval: 2.5, reinforceCount: 3 },
];

// Meat dropped by a killed unit. Survival mobs pay by LEVEL and bulk
// (archetype hpMult); meatForHp stays for MOBA creeps whose HP is still flat.
export const meatForLevel = (level, hpMult = 1) =>
  Math.max(1, Math.round((0.8 + level * 0.16) * Math.min(2.2, Math.max(0.5, hpMult))));
export const meatForHp = (hp) => Math.max(1, Math.ceil(hp / 160));

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
  cheetah: ['Swiftclaw', 'The Golden Blur'],
  crocodile: ['Old Deathroll', 'The Mire King'],
  golem: ['The Frozen Warden', 'Shatterheart'],
};
export function bossNameFor(type, id) {
  const key = Object.keys(BOSS_NAMES).find(k => type.toLowerCase().includes(k)) ?? 'wolf';
  const pool = BOSS_NAMES[key];
  return pool[id % pool.length];
}

// Cumulative XP required to reach each level (index = level). WoW-style
// cadence: ~6 equal-level kills for the first ding, ~40+ near the cap
// (quests shoulder a big share of the climb).
export const XP_LEVELS = [0, 0, 109, 265, 483, 763, 1113, 1541, 2054, 2670, 3387,
  4212, 5153, 6217, 7427, 8776, 10271, 11920, 13731, 15729, 17904, 20264,
  22816, 25568, 28550, 31747, 35167, 38818, 42707, 46867, 51281, 55956,
  60900, 66120, 71654, 77480, 83605, 90037, 96784, 103886, 111318, 119088,
  127203, 135671, 144537, 153771, 163381, 173375, 183760, 194584, 205815];
export const MAX_LEVEL = 50;

// quest XP scale: fraction of the CURRENT level's xp-to-next a quest pays,
// front-loaded (early quests are near a whole level, endgame quests a solid
// nudge). Index by player level; past the table it stays at the last value.
export const QUEST_XP_PCT = [0, 1.0, 0.85, 0.7, 0.6, 0.5, 0.45, 0.4, 0.36, 0.33,
  0.30, 0.28, 0.26, 0.25, 0.24, 0.23, 0.22, 0.21, 0.20, 0.19, 0.18, 0.18,
  0.17, 0.17, 0.16, 0.16, 0.15, 0.15, 0.14, 0.14, 0.13, 0.13, 0.12, 0.12,
  0.12, 0.11, 0.11, 0.11, 0.10, 0.10, 0.10, 0.10, 0.09, 0.09, 0.09, 0.09,
  0.08, 0.08, 0.08, 0.08, 0.08];
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
  charm: 'Charm', companion: 'Companion', placeable: 'Placeable', skill: 'Skill' };

// Gear progresses through the ages. `needs` gates an item behind a camp
// building (survival): 'tent' → Hide Tent, 'cabin' → Wooden Cabin,
// 'furnace' → Stone Furnace (iron age).
export const ITEMS = [
  // -- weapons: melee (chop = tree felling & rock mining power) --
  { id: 'fists',      slot: 'weapon', level: 1, icon: '🖐️', name: 'Bare Hands',   cost: null, free: true,
    weapon: { kind: 'melee', style: 'fists', dmg: 24, cd: 1.28, range: 1.5, chop: 0.1, mine: 0, tier: 0,
      combo: [1, 1.08, 1.2] },
    desc: 'Fast three-hit combo. Can batter a tree down with your bare fists — ten times slower than any axe. Rocks need a pickaxe.' },
  { id: 'club',       slot: 'weapon', level: 3, icon: '🦴', name: 'Bone Club',   cost: { meat: 10 },
    weapon: { kind: 'melee', style: 'club', dmg: 44, cd: 1.64, range: 1.7, chop: 0, mine: 0, tier: 1,
      combo: [1, 1.25], stun: 0.35, armorBreak: 0.16 },
    desc: 'Slow crushing blows stagger enemies and break armour. Blunt — cannot fell trees.' },
  // ONLY axes fell trees. chop = cutting power: how much of a tree's (hidden)
  // trunk health one swing removes — bigger trees soak far more of it.
  { id: 'boneAxe',    slot: 'weapon', level: 2, icon: '🪓', name: 'Bone Axe',    cost: { meat: 8 },
    weapon: { kind: 'melee', style: 'axe', dmg: 32, cd: 1.76, range: 1.7, chop: 1, mine: 0, tier: 1,
      combo: [1, 1.12], bleed: 3 },
    desc: 'A jagged bone hatchet — your first tree-felling tool. Chops slowly; light bleeding strikes.' },
  { id: 'stoneAxe',   slot: 'weapon', level: 5, icon: '🪓', name: 'Stone Axe',     cost: { wood: 12, stone: 10 },
    weapon: { kind: 'melee', style: 'axe', dmg: 76, cd: 1.72, range: 1.8, chop: 1.5, mine: 0, tier: 1,
      combo: [1, 1.15], bleed: 4 },
    desc: 'Wide, deliberate swings cause bleeding and chop trees fast.' },
  { id: 'steelAxe',   slot: 'weapon', level: 12, icon: '⚒️', name: 'Iron Axe',      cost: { wood: 18, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'axe', dmg: 136, cd: 1.8, range: 1.9, chop: 2, mine: 0, tier: 2,
      combo: [1, 1.18], bleed: 7 },
    desc: 'Heavy sweeping strikes bleed groups and tear through any tree.' },
  { id: 'warAxe',     slot: 'weapon', level: 16, icon: '🔥', name: 'War Axe',       cost: { wood: 25, iron: 16, hide: 6 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'axe', dmg: 240, cd: 1.92, range: 2.0, chop: 2.5, mine: 0, tier: 3,
      combo: [1, 1.2], bleed: 12 },
    desc: 'A brutal war axe: very wide swings and severe bleeding.' },
  // -- tools: pickaxes are the ONLY way to mine rock --
  { id: 'bonePick',   slot: 'weapon', level: 5, icon: '⛏️', name: 'Bone Pickaxe',  cost: { wood: 10, hide: 2, meat: 8 },
    weapon: { kind: 'melee', style: 'pick', dmg: 40, cd: 1.58, range: 1.7, chop: 0, mine: 1, tier: 1,
      pick: true, armoredBonus: 1.65, armorBreak: 0.2 },
    desc: 'Mines rock slowly, but punches through golems and armoured creatures.' },
  { id: 'ironPick',   slot: 'weapon', level: 12, icon: '⚒️', name: 'Iron Pickaxe',  cost: { wood: 15, iron: 8 }, needs: 'furnace',
    weapon: { kind: 'melee', style: 'pick', dmg: 110, cd: 1.64, range: 1.8, chop: 0, mine: 2.5, tier: 2,
      pick: true, armoredBonus: 1.8, armorBreak: 0.28 },
    desc: 'Cracks rocks and armoured hides alike; strong armour-breaking strikes.' },
  { id: 'obsidianPick', slot: 'weapon', level: 18, icon: '⛏️', name: 'Obsidian Pickaxe', cost: { iron: 18, stone: 30, essence: 6 }, needs: 'keep',
    weapon: { kind: 'melee', style: 'pick', dmg: 200, cd: 1.76, range: 1.9, chop: 0, mine: 4, tier: 3,
      pick: true, armoredBonus: 2, armorBreak: 0.35 },
    desc: 'Volcanic point shatters rock, golems and armour with charged hits.' },
  { id: 'huntSpear',  slot: 'weapon', level: 10, icon: '🔱', name: 'Hunting Spear', cost: { wood: 20, stone: 8, hide: 3 },
    weapon: { kind: 'melee', style: 'spear', dmg: 104, cd: 1.64, range: 2.8, chop: 0, mine: 0, tier: 1,
      combo: [1, 1.2], chargeLunge: 1.25 },
    desc: 'Safe, narrow reach. Charged attacks lunge forward into exposed weak points.' },
  // -- weapons: ranged (invented with the Wooden Cabin era; train Range to extend) --
  { id: 'huntingBow', slot: 'weapon', level: 7, icon: '🏹', name: 'Hunting Bow',   cost: { wood: 25, hide: 4 }, needs: 'cabin',
    weapon: { kind: 'bow', style: 'bow', dmg: 32, cd: 2.14, range: 3.5, pierce: false, tier: 1 },
    desc: 'Hold and release for an accurate weak-point shot. Supports special arrows.' },
  { id: 'longbow',    slot: 'weapon', level: 12, icon: '🎯', name: 'Longbow',       cost: { wood: 40, hide: 8, iron: 4 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 64, cd: 1.78, range: 7, pierce: false, tier: 2 },
    desc: 'Long-ranged precision bow; fully drawn shots find weak points.' },
  { id: 'recurveBow', slot: 'weapon', level: 14, icon: '🏹', name: 'Recurve Bow',   cost: { wood: 45, hide: 10, iron: 6 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 52, cd: 1.38, range: 8.5, pierce: false, tier: 2 },
    desc: 'Snappy recurve limbs support fast follow-up shots and special arrows.' },
  { id: 'rapidBow',   slot: 'weapon', level: 16, icon: '🌀', name: 'Windstorm Bow', cost: { wood: 45, iron: 14, hide: 10 }, needs: 'furnace',
    weapon: { kind: 'bow', style: 'bow', dmg: 60, cd: 1.0, range: 10, pierce: true, tier: 3 },
    desc: 'Very fast piercing arrows; charged shots tear through a whole line.' },
  // -- medieval (Age 5, needs the Keep) --
  { id: 'steelSword', slot: 'weapon', level: 18, icon: '⚔️', name: 'Knight\'s Sword', cost: { iron: 25, wood: 10, hide: 8 }, needs: 'keep',
    weapon: { kind: 'melee', style: 'sword', dmg: 300, cd: 1.2, range: 2.1, chop: 0, mine: 0, tier: 3,
      combo: [1, 1.18, 1.55], parry: true },
    desc: 'A fast three-hit combo. Guard at the right moment to parry and stun attackers.' },
  { id: 'crossbow',   slot: 'weapon', level: 18, icon: '🎯', name: 'Crossbow',       cost: { wood: 50, iron: 20 }, needs: 'keep',
    weapon: { kind: 'bow', style: 'crossbow', dmg: 180, cd: 3.3, range: 12, pierce: true, tier: 3,
      armorPierce: 0.75, armorBreak: 0.25 },
    desc: 'Slow to reload, but launches an extremely powerful armour-piercing bolt.' },
  // -- late-game signature weapons: one memorable choice per deep biome --
  { id: 'highlandSpear', slot: 'weapon', level: 27, icon: '⚡', name: 'Highland Greatspear',
    cost: { wood: 55, iron: 38, hide: 18, essence: 14 }, needs: 'runic',
    weapon: { kind: 'melee', style: 'spear', dmg: 420, cd: 1.84, range: 3.3, chop: 0, mine: 0, tier: 4,
      combo: [1, 1.25], chargeLunge: 1.5 },
    desc: 'A storm-tempered reach weapon. Charged attacks lunge deep into exposed weak points.' },
  { id: 'serpentBow', slot: 'weapon', level: 41, icon: '🐍', name: 'Serpent Bow',
    cost: { wood: 85, hide: 35, iron: 45, essence: 35 }, needs: 'spirit',
    weapon: { kind: 'bow', style: 'bow', dmg: 190, cd: 1.24, range: 14, pierce: true, tier: 4 },
    desc: 'A recurved jungle bow: fast 95-damage arrows pierce through packed enemies.' },
  { id: 'frostAxe', slot: 'weapon', level: 46, icon: '🧚', name: 'Frostforged Axe',
    cost: { wood: 90, iron: 70, hide: 30, essence: 55 }, needs: 'primal',
    weapon: { kind: 'melee', style: 'axe', dmg: 520, cd: 1.64, range: 2.35, chop: 3, mine: 1, tier: 4,
      combo: [1, 1.25], bleed: 20 },
    desc: 'Frozen iron with a brutal edge. Wide swings leave severe bleeding wounds.' },
  { id: 'woodShield', slot: 'offhand', level: 5, icon: '🛡️', name: 'Wooden Shield', cost: { wood: 18, hide: 3 },
    shield: { block: 0.55 }, desc: 'Hold Ctrl to block 55% incoming damage. Replaces your torch.' },
  { id: 'ironShield', slot: 'offhand', level: 14, icon: '🛡️', name: 'Iron Shield', cost: { iron: 14, wood: 12, hide: 5 }, needs: 'furnace',
    shield: { block: 0.72 }, desc: 'Hold Ctrl to block 72% incoming damage. Replaces your torch.' },
  // -- head (crafted from hides at the tent) --
  { id: 'leatherCap', slot: 'head', level: 5, icon: '🧢', name: 'Hide Cap',      cost: { hide: 4, meat: 10 }, needs: 'tent', stats: { hp: 25 },
    desc: '+25 max health.' },
  { id: 'boneHelm',   slot: 'head', level: 10, icon: '🦴', name: 'Bone Helm',     cost: { hide: 6, meat: 20 }, needs: 'tent', stats: { hp: 45, regen: 0.2 },
    desc: '+45 max health, +0.2 ❤️/s regeneration.' },
  { id: 'furHood',    slot: 'head', level: 12, icon: '🎩', name: 'Fur Hood',      cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { hp: 60, regen: 0.3 },
    desc: '+60 max health, +0.3 ❤️/s regeneration.' },
  { id: 'ironHelm',   slot: 'head', level: 14, icon: '🪖', name: 'Iron Helm',     cost: { iron: 10, hide: 6 }, needs: 'furnace', stats: { hp: 85 },
    desc: '+85 max health.' },
  { id: 'bearHelm',   slot: 'head', level: 18, icon: '⛑️', name: 'Bearskull Helm', cost: { hide: 18, iron: 8, meat: 40 }, needs: 'furnace', stats: { hp: 110, regen: 0.6 },
    desc: '+110 max health, +0.6 ❤️/s regeneration.' },
  // -- chest (you start NAKED with a leaf — clothing is crafted from hides) --
  { id: 'leatherArmor', slot: 'chest', level: 5, icon: '🦺', name: 'Hide Tunic',     cost: { hide: 7, meat: 15 }, needs: 'tent', stats: { hp: 50 },
    desc: '+50 max health. Finally, actual clothes.' },
  { id: 'furCoat',      slot: 'chest', level: 12, icon: '🧥', name: 'Fur Coat',       cost: { hide: 14, meat: 30 }, needs: 'tent', stats: { hp: 100, regen: 0.4 },
    desc: '+100 max health, +0.4 ❤️/s regeneration.' },
  { id: 'ironChest',    slot: 'chest', level: 14, icon: '🥋', name: 'Iron Cuirass',   cost: { iron: 14, hide: 8 }, needs: 'furnace', stats: { hp: 135 },
    desc: '+135 max health.' },
  { id: 'bearHide',     slot: 'chest', level: 18, icon: '🛡️', name: 'Bearhide Plate', cost: { hide: 24, iron: 12, meat: 45 }, needs: 'furnace', stats: { hp: 170, regen: 0.8 },
    desc: '+170 max health, +0.8 ❤️/s regeneration.' },
  { id: 'graveplate', slot: 'chest', level: 35, icon: '⚰️', name: 'Graveplate',
    cost: { iron: 55, hide: 30, essence: 32 }, needs: 'mountain', stats: { hp: 275, regen: 1.1 },
    desc: 'Spirit-bound plate from the haunted woods. +275 max health, +1.1 ❤️/s.' },
  { id: 'iceplate', slot: 'chest', level: 48, icon: '🧊', name: 'Iceplate',
    cost: { iron: 90, hide: 45, essence: 70 }, needs: 'primal', stats: { hp: 390, regen: 1.5 },
    desc: 'Armor built for the summit. +390 max health, +1.5 ❤️/s.' },
  // -- boots --
  { id: 'swiftBoots',   slot: 'boots', level: 5, icon: '👢', name: 'Hide Wraps',     cost: { hide: 5, meat: 10 }, needs: 'tent', stats: { speed: 1.5 },
    desc: '+1.5 movement speed.' },
  { id: 'huntersBoots', slot: 'boots', level: 12, icon: '🥾', name: "Hunter's Boots", cost: { hide: 10, meat: 25 }, needs: 'tent', stats: { speed: 2.5 },
    desc: '+2.5 movement speed.' },
  { id: 'ironBoots',    slot: 'boots', level: 14, icon: '🥾', name: 'Iron-Shod Boots', cost: { iron: 8, hide: 6 }, needs: 'furnace', stats: { speed: 3, hp: 35 },
    desc: '+3 movement speed, +35 max health.' },
  { id: 'windBoots',    slot: 'boots', level: 18, icon: '💨', name: 'Windwalkers',    cost: { hide: 14, iron: 8, meat: 40 }, needs: 'furnace', stats: { speed: 4.5, regen: 0.5 },
    desc: '+4.5 movement speed, +0.5 ❤️/s regeneration.' },
  { id: 'pantherBoots', slot: 'boots', level: 39, icon: '🐆', name: 'Pantherstep Boots',
    cost: { hide: 45, iron: 25, essence: 30 }, needs: 'spirit', stats: { speed: 6, hp: 90, regen: 0.8 },
    desc: 'Silent jungle boots. +6 movement speed, +90 health, +0.8 ❤️/s.' },
  // -- charms (mid-game trinkets — ONE charm slot, pick your bonus) --
  { id: 'wolfPendant', slot: 'charm', level: 10, icon: '🦷', name: 'Wolf-Fang Pendant',
    cost: { hide: 8, meat: 30 }, needs: 'tent', stats: { dmgPct: 0.10 },
    desc: '+10% weapon damage.' },
  { id: 'hawkAmulet', slot: 'charm', level: 14, icon: '🪶', name: 'Hawk-Feather Amulet',
    cost: { hide: 12, iron: 4, meat: 40 }, needs: 'cabin', stats: { aspd: 0.10, regen: 0.3 },
    desc: '+10% attack speed, +0.3 ❤️/s regeneration.' },
  { id: 'copperRing', slot: 'charm', level: 5, icon: '💍', name: 'Copper Ring',
    cost: { stone: 8, meat: 15 }, stats: { regen: 0.3 },
    desc: '+0.3 ❤️/s regeneration — wounds close on their own.' },
  { id: 'bloodAmulet', slot: 'charm', level: 18, icon: '🩸', name: 'Bloodstone Amulet',
    cost: { hide: 15, iron: 10, essence: 10 }, needs: 'furnace', stats: { regen: 1.2, hp: 40 },
    desc: '+1.2 ❤️/s regeneration, +40 max health.' },
  // -- companions --
  // Wolves are no longer bought here: the Beastmaster TAMES beasts (Tame Beast),
  // and the arcane spheres (Guardian / Frost / Gemini) are now learnable MAGE
  // abilities in the class tree — see CLASS_TREES → mage actives below.
  // -- expedition gear (Supplies tab): wearable comfort items, each with its
  // own WoW-style slot. supply: true keeps them out of the weapon/gear shops.
  // torches BURN: one stick lasts ~5 real minutes (5 in-game hours), then it
  // crumbles to ash and vanishes from your hand — carry spares!
  { id: 'torch',   slot: 'offhand', level: 3, supply: true, icon: '🔦', name: 'Torch',
    cost: { wood: 6, hide: 1 }, torch: { radius: 5 },
    desc: 'A burning stick held in your off-hand — you SEE it blaze as you walk. Lights ~5 m around you in the dark (night, dark biomes, lairs) and its warmth slows the Frozen Peak\'s chill. Burns out after 5 minutes.' },
  { id: 'torchoil', slot: 'offhand', level: 10, supply: true, icon: '🛢️', name: 'Oiled Torch',
    cost: { wood: 12, hide: 3, essence: 1 }, torch: { radius: 10 },
    desc: 'Soaked in alchemist\'s oil — burns brighter: lights ~10 m around you. Burns out after 5 minutes.' },
  { id: 'torchember', slot: 'offhand', level: 16, supply: true, icon: '🔥', name: 'Emberheart Torch',
    cost: { wood: 20, iron: 4, essence: 5 }, torch: { radius: 15 },
    desc: 'A molten ember lashed into a torch head — a blazing ~15 m circle of light. Burns out after 5 minutes.' },
  { id: 'spiritLantern', slot: 'offhand', level: 33, supply: true, icon: '🏮', name: 'Spirit Lantern',
    cost: { iron: 25, essence: 28 }, needs: 'mountain', torch: { radius: 20, permanent: true }, stats: { regen: 0.5 },
    desc: 'A permanent pale flame: lights ~20 m, never burns out, and grants +0.5 ❤️/s.' },
  { id: 'socks',   slot: 'legs', level: 5, supply: true, icon: '🧦', name: 'Thick Wool Socks',
    cost: { wool: 10, meat: 20 }, mudguard: 0.5,
    desc: 'Worn on your legs: swamp mud and spider webs slow you only HALF as much.' },
  { id: 'lining',  slot: 'underlayer', level: 7, supply: true, icon: '🧥', name: 'Quilted Wool Lining',
    cost: { wool: 14, hide: 8 }, dmgCut: 0.08,
    desc: 'Wool padding worn under everything else: all damage taken −8%.' },
  { id: 'bogscaleLining', slot: 'underlayer', level: 22, supply: true, icon: '🐊', name: 'Bogscale Lining',
    cost: { hide: 25, wool: 20, essence: 12 }, needs: 'keep', dmgCut: 0.12, poisonCut: 0.5,
    desc: 'Layered swamp scales: all damage −12% and poison damage −50%.' },
  { id: 'bedroll', slot: 'back', level: 5, supply: true, icon: '🛏️', name: 'Wool Bedroll',
    cost: { wool: 8, hide: 4 }, rest: 6,
    desc: 'Strapped across your back. Standing still out of combat, your fast recovery is 60% quicker.' },
  { id: 'stormcloak', slot: 'back', level: 29, supply: true, icon: '🌩️', name: 'Stormcloak',
    cost: { hide: 30, wool: 28, iron: 15, essence: 20 }, needs: 'runic', stats: { hp: 120, regen: 0.8 }, rest: 5,
    desc: 'Highland storm wool: +120 health, +0.8 ❤️/s and 50% faster resting recovery.' },
  { id: 'saddle',  slot: 'mount', level: 7, supply: true, icon: '🐴', name: 'Riding Saddle',
    cost: { hide: 12, iron: 4, meat: 30 },  saddle: true,
    desc: 'Saddle a wild horse (E nearby). Riding grants +9 speed; mounted attacks hit harder but recover slower. X dismounts.' },

  // -- placeable camp items: bought into the backpack, then positioned in
  // the world by clicking them. They are items, never camp upgrades.
  { id: 'storageChest', slot: 'placeable', level: 5, supply: true, icon: '📦', name: 'Storage Chest',
    cost: { wood: 25 }, placeable: { kind: 'chest' },
    desc: 'Place it on solid ground. Press E beside it to store resources safely through death.' },
  { id: 'logBoat', slot: 'mount', level: 7, supply: true, icon: '🛶', name: 'Log Boat',
    cost: { wood: 30, hide: 4 }, placeable: { kind: 'boat' }, boatMount: true,
    desc: 'Place it on solid ground near the water, then press E beside it to mount. X dismounts and parks it at your position.' },
  { id: 'guardTower', slot: 'placeable', level: 16, supply: true, icon: '🗼', name: 'Guard Tower',
    cost: { wood: 60, stone: 40, iron: 10 }, placeable: { kind: 'tower' },
    desc: 'Place it on solid ground. It automatically shoots enemies within 20 metres.' },
  { id: 'graveyardItem', slot: 'placeable', level: 10, supply: true, icon: '🪦', name: 'Graveyard',
    cost: { stone: 30, wood: 20, meat: 20 }, placeable: { kind: 'grave' },
    desc: 'Place a remote respawn shrine on solid ground. Death lets you choose the cave or this graveyard.' },
  { id: 'swimming', slot: 'skill', level: 14, supply: true, icon: '🏊', name: 'Swimming Lessons',
    cost: { meat: 50 }, training: 'swim',
    desc: 'Learn to swim (permanent). Deep water — the ocean, border rapids, the black bog — stops drowning you, and you can paddle across it. Shallow water is always wadeable.' },

  // -- griffin nests: dropped by beaten griffins, never sold or looted
  // (free: true keeps them out of every random loot pool). Click one in the
  // inventory to PLACE it on the ground — a flight-master roost you can fly
  // between (stand next to a placed nest to open the flight map).
  { id: 'desertNest',   slot: 'nest', level: 1, icon: '🪺', name: 'Desert Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 1 },
    desc: 'The Desert griffin\'s nest. Click to place it where you stand (Desert or any earlier zone). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'highlandNest', slot: 'nest', level: 1, icon: '🪺', name: 'Highland Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 6 },
    desc: 'The Highland griffin\'s nest. Click to place it where you stand (Highlands or any earlier zone). Stand by a placed nest to call a griffin and fly between your roosts.' },
  { id: 'frozenNest',   slot: 'nest', level: 1, icon: '🪺', name: 'Frozen Griffin Nest', cost: null, free: true,
    nest: { biomeMax: 7 },
    desc: 'The Frozen Peak griffin\'s nest. Click to place it anywhere on solid ground. Stand by a placed nest to call a griffin and fly between your roosts.' },

  // ---- UNIQUE boss drops: guaranteed from each biome's lair boss, never sold ----
  { id: 'verdantHeart', slot: 'charm', level: 5, unique: true, icon: '🌿', name: 'Verdant Heart',
    stats: { regen: 1.0, dmgPct: 0.10 }, desc: 'UNIQUE — dropped by Sythe the Broodmother. +1.0 ❤️/s and +10% damage.' },
  { id: 'sunfangBlade', slot: 'weapon', level: 12, unique: true, icon: '🗡️', name: 'Sunfang Blade',
    weapon: { kind: 'melee', style: 'sword', dmg: 190, cd: 1.2, range: 2.0, chop: 0, mine: 0, tier: 2,
      combo: [1, 1.2, 1.5], parry: true, burn: 8 },
    desc: 'UNIQUE — a blistering three-hit blade that parries and ignites enemies.' },
  { id: 'widowShroud', slot: 'chest', level: 31, unique: true, icon: '🕸️', name: "Widow's Shroud",
    stats: { hp: 235, regen: 1.2 }, desc: 'UNIQUE — dropped by Vess the Widow. +235 max health, +1.2 ❤️/s.' },
  { id: 'mireBoots', slot: 'boots', level: 24, unique: true, icon: '🥾', name: 'Mirewalker Boots',
    stats: { speed: 5, hp: 110, regen: 0.5 }, mudguard: 0.25,
    desc: 'UNIQUE — dropped by the Mire Hydra. +5 speed, +110 health, +0.5 ❤️/s; mud barely slows you.' },
  { id: 'ironhornCrown', slot: 'head', level: 44, unique: true, icon: '👑', name: 'Ironhorn Crown',
    stats: { hp: 290, regen: 1.5 }, desc: 'UNIQUE — dropped by Old Ironhorn. +290 max health, +1.5 ❤️/s.' },
  { id: 'shadeAmulet', slot: 'charm', level: 37, unique: true, icon: '👻', name: 'Amulet of the Shade',
    stats: { dmgPct: 0.30, regen: 1.2 }, desc: 'UNIQUE — dropped by the Weeping Shade. +30% damage, +1.2 ❤️/s.' },
  { id: 'snapjawMaul', slot: 'weapon', level: 18, unique: true, icon: '🔨', name: 'Snapjaw Maul',
    weapon: { kind: 'melee', style: 'club', dmg: 270, cd: 2.1, range: 2.35, chop: 0, mine: 1, tier: 2,
      combo: [1, 1.35], stun: 0.8, armorBreak: 0.35 },
    desc: 'UNIQUE — a crushing jungle maul that stuns and ruins armour.' },
  { id: 'frostMantle', slot: 'back', level: 50, unique: true, icon: '🧊', name: 'Mantle of the Colossus',
    stats: { hp: 300, regen: 2.0 }, rest: 8, coldproof: true,
    desc: 'UNIQUE — skinned from Grimfrost. +300 ❤️, +2.0 ❤️/s, 80% faster resting recovery and complete cold protection.' },
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
  { name: 'Old Snapjaw',           type: 'snapper',     drop: 'snapjawMaul',
    den: 'The Overgrown Gullet', mobs: ['snapper', 'panther'],
    theme: { floor: 0x2c5c24, wall: 0x3a6a2e, fog: 0x061006, prop: 'vine' } },
  { name: 'The Mire Hydra',        type: 'bogCrawler',  drop: 'mireBoots',
    den: 'The Drowned Den', mobs: ['bogCrawler', 'snake'],
    theme: { floor: 0x424a28, wall: 0x39402a, fog: 0x0b0f08, prop: 'mud' } },
  { name: 'Vess the Widow',        type: 'venomspider', drop: 'widowShroud',
    den: "The Widow's Hollow", mobs: ['venomspider', 'bat'],
    theme: { floor: 0x1f2a1c, wall: 0x243020, fog: 0x050805, prop: 'web' } },
  { name: 'The Weeping Shade',     type: 'ghost',       drop: 'shadeAmulet',
    den: 'The Weeping Crypt', mobs: ['ghost', 'zombie'],
    theme: { floor: 0x2e2e38, wall: 0x3a3a48, fog: 0x08080e, prop: 'ghost' } },
  { name: 'Old Ironhorn',          type: 'elk',         drop: 'ironhornCrown',
    den: 'The Bonefield Barrow', mobs: ['elk', 'harpy'],
    theme: { floor: 0x8a7c4c, wall: 0x6f6340, fog: 0x14120a, prop: 'bone' } },
  // ring 7 — Frozen Peak: a COLOSSAL yeti, bigger and tougher than any lair boss
  { name: 'Grimfrost the Colossus', type: 'yeti',        drop: 'frostMantle', extraScale: 1.5, hpMult: 1.5,
    den: 'The Frostfather Cavern', mobs: ['icewolf', 'wendigo'],
    theme: { floor: 0xdfe9f0, wall: 0xbfd4e2, fog: 0x101820, prop: 'ice' } },
];

export const itemById = (id) => ITEMS.find(i => i.id === id);

// ---- Consumables: cheap repeatable meat sinks, used with F / G in the field.
export const CONSUMABLES = [
  // heals are a FRACTION of max health so potions stay relevant at level 50
  { id: 'salve', icon: '🧪', name: 'Healing Salve', key: 'F', cost: { berry: 5 },
    healPct: 0.4, desc: 'Brewed from 5 blueberries. Drink with F: restores 40% of your health.' },
  { id: 'roast', icon: '🍗', name: 'Roasted Meat', key: 'G', cost: { meat: 10 },
    healPct: 0.12, speedDur: 30, desc: 'Eat with G: +12% health and +10% speed for 30 s.' },
  { id: 'honey', icon: '🍯', name: 'Wild Honey', found: true,
    healPct: 0.25, desc: 'Raided from a beehive. Click it in the inventory: +25% health.' },
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
  { id: 'haste',     level: 7,  icon: '⚡', name: 'Haste',       cost: { meat: 40, essence: 2 }, cd: 90,
    desc: 'Double attack speed for 10 s.' },
  { id: 'powerDash', level: 10,  icon: '💨', name: 'Power Dash',  cost: { meat: 45, essence: 3 }, cd: 25,
    desc: 'Dash forward, dealing 40 damage to everything in your path.' },
  { id: 'heal',      level: 12,  icon: '💚', name: 'Mend Wounds', cost: { meat: 50, essence: 4 }, cd: 60,
    desc: 'Instantly restore 50 health.' },
  { id: 'stunDash',  level: 14,  icon: '🌪️', name: 'Stun Dash',   cost: { meat: 70, essence: 5 }, cd: 35,
    desc: 'Dash that damages (30) and stuns enemies for 3 s.' },
  { id: 'shockwave', level: 16,  icon: '💥', name: 'Shockwave',   cost: { meat: 85, essence: 6 }, cd: 45,
    desc: 'Blast all nearby enemies: 25 damage + knockback.' },
  { id: 'frostNova', level: 18,  icon: '❄️', name: 'Frost Nova',  cost: { meat: 100, essence: 8 }, cd: 50,
    desc: 'Freeze all nearby enemies for 4 s.' },
  { id: 'rage',      level: 20, icon: '😡', name: 'Rage',        cost: { meat: 120, essence: 10 }, cd: 90,
    desc: '+50% damage for 12 s.' },
  { id: 'stoneSkin', level: 24, icon: '🪨', name: 'Stone Skin', cost: { meat: 160, stone: 80, essence: 14 }, cd: 80,
    desc: 'Harden your skin for 12 s, reducing incoming damage by 40%.' },
  { id: 'whirlwind', level: 31, icon: '🌪️', name: 'Whirlwind', cost: { meat: 210, iron: 25, essence: 20 }, cd: 38,
    desc: 'Strike every nearby enemy for 75% weapon damage and knock them back.' },
  { id: 'spiritWard', level: 37, icon: '👻', name: 'Spirit Ward', cost: { meat: 260, essence: 32 }, cd: 75,
    desc: 'A spectral ward reduces damage by 30% and prevents poison for 15 s.' },
  { id: 'venomRain', level: 44, icon: '☣️', name: 'Venom Rain', cost: { meat: 330, hide: 30, essence: 45 }, cd: 55,
    desc: 'Poison every enemy within 9 m: immediate damage plus a vicious 6 s venom.' },
  { id: 'blizzard', level: 50, icon: '🌨️', name: 'Blizzard', cost: { meat: 450, iron: 50, essence: 70 }, cd: 90,
    desc: 'A summit storm damages and freezes every enemy within 11 m.' },
];

export const spellById = (id) => SPELLS.find(s => s.id === id);

// ---- Trainable stat tracks. Core combat tracks continue to tier 15 at biome
// milestones; pet/gathering continue to tier 8, while Range keeps its original
// 10 tiers. Costs turn linear after tier 6 so late training stays attainable. ----
const trainCost = (base) => (t) =>
  t <= 6 ? base * t * t : base * 36 + base * 10 * (t - 6);
const ADVANCED_TRAINING_LEVELS = [1, 3, 5, 7, 10, 12, 14, 16, 18, 20, 24, 31, 37, 44, 50];
const DEEP_TRAINING_LEVELS = [1, 3, 5, 7, 10, 24, 37, 50];
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
      P('war_vitality', '❤️', 'Vitality', 3, 'Greatly boosts your maximum health (gear & camp included).', { hpPct: [0.15, 0.30, 0.50] }),
      P('war_arms', '⚔️', 'Arms Mastery', 5, 'Sharpens every melee blow.', { meleeDmg: [0.10, 0.22, 0.35] }),
      P('war_thick_skin', '🪨', 'Thick Skin', 7, 'Toughens your hide against all damage.', { damageCut: [0.04, 0.09, 0.15] }),
      P('war_cleave', '🪓', 'Cleave Training', 14, 'Widens your melee swing arc so you hit more foes at once.', { arcBonus: [0.12, 0.24, 0.38] }),
      P('war_executioner', '☠️', 'Executioner', 18, 'Deals extra damage to wounded enemies (below 50% health).', { executeDmg: [0.15, 0.30, 0.50] }),
      P('war_blood_drinker', '🩸', 'Blood Drinker', 22, 'Every kill restores a chunk of your health.', { lifeOnKillPct: [0.02, 0.045, 0.08] }),
      P('war_heavy_hands', '🔨', 'Heavy Hands', 27, 'Your hits can stagger enemies mid-attack.', { staggerChance: [0.08, 0.16, 0.26] }),
      P('war_unshaken', '⛰️', 'Unshaken', 31, 'Shortens every stun and disable used against you.', { stunResist: [0.18, 0.34, 0.55] }),
      P('war_iron_guard', '🛡️', 'Iron Guard', 37, 'Blocks far more damage when guarding.', { blockBonus: [0.08, 0.16, 0.26] }),
      P('war_tactician', '📯', 'Battle Tactician', 44, 'Cuts the cooldown of every Warrior ability.', { classCdReduction: [0.08, 0.15, 0.24] }),
    ],
    actives: [
      A('war_heroic_strike', '⚔️', 'Heroic Strike', 3, 'Wind up, then land a crushing single-target strike.', 'target',
        { cd: 10, range: 3.2, weaponMult: [2.0, 2.5, 3.0], windup: 0.55 }),
      A('war_rend', '🩸', 'Rend', 7, 'Stab one target; it loses a percentage of max HP over 30 s.', 'target',
        { cd: 22, range: 3.2, weaponMult: [1.0, 1.4, 1.8], bleedPct: [0.18, 0.30, 0.45], bleedDur: 30 }),
      A('war_cry', '📯', 'War Cry', 12, 'Temporarily increases damage and damage reduction.', 'buff',
        { cd: 40, buff: 'warCry', duration: [8, 10, 12], power: [0.20, 0.32, 0.45] }),
      A('war_ground_slam', '💥', 'Ground Slam', 16, 'Slam the earth: damage and stun all nearby enemies.', 'aoe',
        { cd: 22, radius: [4.5, 5.2, 6], weaponMult: [1.2, 1.6, 2.1], stun: [1.5, 2.2, 3.0], windup: 0.45 }),
      A('war_charge', '🐂', 'Bull Charge', 20, 'Rush forward, striking and stunning enemies in your path.', 'dash',
        { cd: 20, weaponMult: [1.4, 1.9, 2.5], stun: [1.2, 1.8, 2.5], distance: [7, 9, 11] }),
      A('war_whirlwind', '🌪️', 'Whirlwind', 24, 'A powerful spinning melee attack that hits everything around you.', 'aoe',
        { cd: 16, radius: [5, 5.5, 6.5], weaponMult: [1.5, 2.0, 2.6] }),
      A('war_cleaving_wave', '🌊', 'Cleaving Wave', 29, 'Send a broad damaging wave in front of you.', 'cone',
        { cd: 15, range: [7, 8.5, 10], weaponMult: [1.4, 1.9, 2.4] }),
      A('war_blood_fury', '🔥', 'Blood Fury', 33, 'Gain attack speed and life steal for a short time.', 'buff',
        { cd: 46, buff: 'bloodFury', duration: [8, 10, 12], power: [0.18, 0.26, 0.35] }),
      A('war_execute', '🪓', 'Execute', 41, 'Wind up a massive killing blow on a target below 35% health.', 'execute',
        { cd: 18, range: 3.2, weaponMult: [3.2, 4.4, 5.8], threshold: 0.35, windup: 0.6 }),
      A('war_avatar', '🗿', 'Avatar', 50, 'Become a juggernaut with damage, protection and a health shield.', 'buff',
        { cd: 85, buff: 'avatar', duration: [10, 13, 16], power: [0.30, 0.42, 0.55] }),
    ] },

  { id: 'beastmaster', icon: '🏹', name: 'Beastmaster', color: '#9bc56b',
    summary: 'The only class able to equip bows, crossbows and companions; controls traps and arrow storms.',
    passives: [
      P('beast_ranged_license', '🏹', 'Ranged Discipline', 3, 'Beastmaster training permits ranged weapons and sharpens them.', { rangedDmg: [0.03, 0.06, 0.10] }),
      P('beast_marksman', '🎯', 'Marksman', 5, 'Extends the reach of your bows and crossbows.', { rangedRange: [3, 7, 15] }),
      P('beast_quickdraw', '⚡', 'Quick Draw', 10, 'Loose arrows far faster.', { rangedSpeed: [0.08, 0.16, 0.26] }),
      P('beast_trapper', '🪤', 'Trapper', 14, 'Your traps hit much harder.', { trapPower: [0.30, 0.60, 1.00] }),
      P('beast_pack_tactics', '🐺', 'Pack Tactics', 22, 'Companions move and strike faster.', { petSpeed: [0.10, 0.20, 0.32] }),
      P('beast_keen_eye', '👁️', 'Keen Eye', 27, 'A strong boost to ranged critical chance.', { rangedCrit: [0.05, 0.11, 0.18] }),
      P('beast_broadheads', '🩸', 'Broadheads', 31, 'Every arrow leaves a vicious bleeding wound.', { arrowBleed: [0.04, 0.08, 0.14] }),
      P('beast_scavenger', '🍖', 'Scavenger', 37, 'Collect far more meat from every kill.', { meatMult: [0.10, 0.22, 0.36] }),
      P('beast_handler', '🫶', 'Animal Handler', 44, 'Your companion regenerates rapidly.', { petRegen: [0.30, 0.65, 1.10] }),
    ],
    actives: [
      A('beast_bond', '🐾', 'Tame Beast', 18, 'Channel for 20 s on a wild beast ahead of you — one with four or more legs, or with wings. It is charmed to fight at your side for 20 s. The channel will not start with no beast in front of you.', 'tame',
        { cd: 60, channel: 20, tameDur: 20, range: 7 }),
      A('beast_snare', '🪤', 'Snare Trap', 3, 'Place a trap that damages, bleeds and stuns its first victim.', 'world',
        { cd: 60, worldAction: 'trap', count: [1, 1, 2], power: [1.5, 2.2, 3.0], trapDmgPct: 0.55, trapStun: 3.5 }),
      A('beast_arrow_haste', '⚡', 'Arrow Haste', 7, 'Greatly increases ranged attack speed.', 'buff',
        { cd: 36, buff: 'arrowHaste', duration: [8, 11, 14], power: [0.40, 0.55, 0.70] }),
      A('beast_ten_arrows', '🏹', 'Ten-Arrow Volley', 12, 'Fire ten arrows in a wide fan.', 'multishot',
        { cd: 15, count: 10, spread: 1.05, weaponMult: [0.40, 0.55, 0.72] }),
      A('beast_arrow_rain', '🌧️', 'Rain of Arrows', 16, 'Mark the ground; arrows rain over the area for 10 s.', 'zone',
        { cd: 32, zone: 'arrows', castRange: 20, radius: [5, 6, 7], duration: 10, weaponMult: [0.30, 0.42, 0.55], interval: 1 }),
      A('beast_piercing_shot', '➶', 'Piercing Shot', 20, 'A high-damage arrow that pierces every enemy in line.', 'multishot',
        { cd: 13, count: 1, pierce: true, spread: 0, weaponMult: [1.8, 2.4, 3.2] }),
      A('beast_explosive_arrow', '💣', 'Explosive Arrow', 24, 'Detonate a burning blast at the aimed location.', 'zoneBurst',
        { cd: 20, castRange: 20, radius: [3.5, 4.2, 5], weaponMult: [1.3, 1.8, 2.3], burn: [8, 13, 18] }),
      A('beast_mend_pet', '🫶', 'Mend Companion', 29, 'Restore companion health and empower its next attacks.', 'world',
        { cd: 26, worldAction: 'mendPet', power: [0.40, 0.65, 0.95] }),
      A('beast_hunt_command', '📣', 'Hunt Command', 33, 'Order your companion to savage the aimed enemy.', 'world',
        { cd: 8, worldAction: 'petCommand', power: [0.20, 0.40, 0.65] }),
      A('beast_trap_field', '⛓️', 'Trap Field', 41, 'Place several powerful snares around you.', 'world',
        { cd: 40, worldAction: 'trapField', count: [3, 4, 5], power: [1.6, 2.2, 2.8], trapDmgPct: 0.55, trapStun: 3.5 }),
      A('beast_stampede', '🐗', 'Stampede', 50, 'Your living companion calls a stampede through every nearby enemy.', 'petAoe',
        { cd: 70, radius: [7, 8.5, 10], petMult: [4, 6, 9], stun: [1.2, 1.8, 2.5] }),
    ] },

  { id: 'rogue', icon: '🗡️', name: 'Rogue', color: '#8ec6c9',
    summary: 'Fast assassin using stealth, poison, evasion and devastating attacks from behind.',
    passives: [
      P('rogue_precision', '🎯', 'Precision', 5, 'Big boost to your melee critical-hit chance.', { meleeCrit: [0.06, 0.12, 0.20] }),
      P('rogue_light_foot', '🪶', 'Light Foot', 10, 'Nimble footwork softens the blows that land.', { damageCut: [0.03, 0.06, 0.10] }),
      P('rogue_shadow_training', '🌑', 'Shadow Training', 14, 'Your stealth lasts considerably longer.', { stealthDuration: [1.5, 3, 5] }),
      P('rogue_evasion', '💨', 'Evasion Mastery', 18, 'Widens the window of your evade.', { evadeDuration: [0.2, 0.45, 0.75] }),
      P('rogue_backstab', '🔪', 'Backstabber', 22, 'Devastating extra damage when you strike from behind.', { backstab: [0.20, 0.42, 0.70] }),
      P('rogue_poisoner', '☠️', 'Poisoner', 27, 'Empowers all of your weapon poisons.', { poisonPower: [0.25, 0.55, 0.90] }),
      P('rogue_combo', '⚔️', 'Combo Mastery', 31, 'Your blades fly faster.', { meleeSpeed: [0.08, 0.16, 0.26] }),
      P('rogue_escape', '🌫️', 'Escape Artist', 37, 'Taking damage grants a burst of speed to escape.', { hurtSpeed: [0.25, 0.5, 0.85] }),
      P('rogue_assassin', '💀', 'Assassin', 44, 'Extra damage to wounded targets (below 50% health).', { executeDmg: [0.15, 0.30, 0.50] }),
    ],
    actives: [
      A('rogue_fleet', '🥾', 'Fleet Foot', 3, 'Dash off with a surge of movement speed for a short time.', 'buff',
        { cd: 60, buff: 'sprint', duration: [5, 8, 15], power: [4, 6, 8] }),
      A('rogue_stealth', '🌑', 'Stealth', 3, 'Become nearly invisible; attacking breaks stealth.', 'stealth',
        { cd: 26, duration: [8, 11, 15] }),
      A('rogue_evade', '💨', 'Evade', 7, 'Avoid every incoming attack during a short glowing window.', 'evade',
        { cd: 22, duration: [1, 1.4, 2] }),
      A('rogue_backstab_active', '🔪', 'Backstab', 12, 'A brutal strike that is far stronger from behind.', 'target',
        { cd: 10, range: 3.2, weaponMult: [2.0, 2.7, 3.5], backstab: true }),
      A('rogue_shadowstep', '🌘', 'Shadowstep', 16, 'Teleport behind the aimed (or Shift-locked) enemy and strike. Reaches 15/22/30 m by rank.', 'shadowstep',
        { cd: 18, range: [10, 13, 16], maxStep: [15, 22, 30], weaponMult: [1.5, 2.1, 2.8] }),
      A('rogue_poison_blades', '☠️', 'Poison Blades', 20, 'Coat weapons with powerful poison.', 'buff',
        { cd: 34, buff: 'poisonBlades', duration: [10, 14, 18], power: [1.2, 1.8, 2.6] }),
      A('rogue_fan_knives', '🗡️', 'Fan of Knives', 24, 'Hit every nearby enemy with poisoned knives.', 'aoe',
        { cd: 16, radius: [5, 6, 7], weaponMult: [1.0, 1.4, 1.9], poison: [6, 11, 16] }),
      A('rogue_smoke_bomb', '🌫️', 'Smoke Bomb', 29, 'Create a smoke zone that hides you from enemies.', 'zone',
        { cd: 40, zone: 'smoke', castRange: 20, radius: [4.5, 5.5, 6.5], duration: [7, 9, 11], interval: 0.5 }),
      A('rogue_sprint', '🏃', 'Sprint', 33, 'Gain a tremendous burst of movement speed.', 'buff',
        { cd: 35, buff: 'sprint', duration: [6, 8, 10], power: [5, 8, 11] }),
      A('rogue_kidney_shot', '⚡', 'Kidney Shot', 41, 'Stun one target and deal weapon damage.', 'target',
        { cd: 24, range: 3.2, weaponMult: [1.0, 1.4, 1.9], stun: [3, 4, 5] }),
      A('rogue_assassinate', '💀', 'Assassinate', 50, 'Execute a wounded target with immense damage.', 'execute',
        { cd: 42, range: 3.2, weaponMult: [3.5, 4.8, 6.2], threshold: 0.4 }),
    ] },

  { id: 'mage', icon: '🧙', name: 'Mage', color: '#9c9cff',
    summary: 'Elemental damage dealer wielding fire, frost, barriers and destructive ground spells.',
    passives: [
      P('mage_power', '✨', 'Spell Power', 3, '+6% class spell damage per rank.', { spellPower: 0.06 }),
      P('mage_fire', '🔥', 'Fire Mastery', 5, '+8% fire damage per rank.', { firePower: 0.08 }),
      P('mage_frost', '❄️', 'Frost Mastery', 10, '+8% frost damage per rank.', { frostPower: 0.08 }),
      P('mage_focus', '⏳', 'Arcane Focus', 14, 'Mage cooldowns -4% per rank.', { classCdReduction: 0.04 }),
      P('mage_essence', '🧪', 'Essence Affinity', 18, '+10% essence collected per rank.', { essenceMult: 0.1 }),
      P('mage_barrier', '🔷', 'Barrier Mastery', 22, 'Magical shields +12% per rank.', { shieldPower: 0.12 }),
      P('mage_pyromaniac', '🌋', 'Pyromaniac', 27, 'Fire area size +8% per rank.', { fireRadius: 0.08 }),
      P('mage_winter_reach', '🌨️', 'Winter Reach', 31, 'Frost area size +8% per rank.', { frostRadius: 0.08 }),
      P('mage_surge', '💫', 'Elemental Surge', 37, '+4% class spell critical chance per rank.', { spellCrit: 0.04 }),
      P('mage_archmage', '🔮', 'Archmage', 44, 'Ground spells last 10% longer per rank.', { zoneDuration: 0.1 }),
    ],
    actives: [
      A('mage_fireball', '🔥', 'Fireball', 3, 'Blast one target and ignite it.', 'magicTarget',
        { cd: 7, element: 'fire', range: 15, damage: [45, 75, 110], burn: [5, 9, 14] }),
      A('mage_frostbolt', '❄️', 'Frostbolt', 7, 'Damage and briefly freeze one target.', 'magicTarget',
        { cd: 8, element: 'frost', range: 15, damage: [38, 65, 95], stun: [1.2, 1.8, 2.5] }),
      A('mage_flamestrike', '🌋', 'Flamestrike', 12, 'Burn the aimed ground for several seconds.', 'zone',
        { cd: 22, zone: 'fire', castRange: 20, radius: [4, 5, 6], duration: [6, 8, 10], damage: [20, 32, 46], interval: 1 }),
      A('mage_blizzard', '🌨️', 'Blizzard', 16, 'A frost storm damages and slows an aimed area.', 'zone',
        { cd: 28, zone: 'frost', castRange: 20, radius: [5, 6, 7], duration: [7, 9, 11], damage: [16, 26, 38], interval: 1, stun: 0.35 }),
      A('mage_frost_nova', '🧊', 'Frost Nova', 20, 'Freeze all enemies around you.', 'magicAoe',
        { cd: 24, element: 'frost', radius: [5, 6, 7], damage: [25, 42, 62], stun: [2.5, 3.5, 4.5] }),
      A('mage_meteor', '☄️', 'Meteor', 24, 'Call a devastating burning impact at the aimed point.', 'zoneBurst',
        { cd: 38, element: 'fire', castRange: 20, radius: [4, 5, 6], damage: [120, 185, 260], burn: [10, 16, 24] }),
      A('mage_fire_breath', '🐉', 'Dragon Breath', 29, 'Scorch every enemy in a cone.', 'magicCone',
        { cd: 18, element: 'fire', range: [7, 9, 11], damage: [65, 100, 145], burn: [6, 10, 15] }),
      A('mage_ice_barrier', '🔷', 'Ice Barrier', 33, 'Gain a large frost shield.', 'shield',
        { cd: 45, amount: [100, 170, 250] }),
      A('mage_combustion', '🔥', 'Combustion', 41, 'Greatly empower fire spells for a short time.', 'buff',
        { cd: 65, buff: 'combustion', duration: [10, 13, 16], power: [0.35, 0.5, 0.7] }),
      A('mage_elemental_storm', '🌩️', 'Elemental Storm', 50, 'Fire and ice ravage a huge aimed area.', 'zone',
        { cd: 90, zone: 'elemental', castRange: 20, radius: [7, 8.5, 10], duration: [9, 12, 15], damage: [35, 52, 72], interval: 1, stun: 0.5 }),
      // Summoned arcane spheres (formerly buyable companions): they orbit the
      // Mage and auto-fire bolts for a while. Re-casting the SAME sphere
      // refreshes it; the three kinds can orbit together.
      A('mage_guardian_sphere', '🔮', 'Guardian Sphere', 10, 'Summon an arcane sphere that orbits you and fires bolts at nearby enemies.', 'summon',
        { cd: 26, duration: [16, 20, 26], orbCount: 1, targets: 1, dmg: [16, 26, 38] }),
      A('mage_frost_sphere', '❄️', 'Frost Sphere', 20, 'Summon a cold sphere: heavy single bolts that briefly freeze what they strike.', 'summon',
        { cd: 34, element: 'frost', duration: [16, 20, 26], orbCount: 1, targets: 1, dmg: [30, 48, 70], freeze: [0.5, 0.7, 1.0] }),
      A('mage_gemini_spheres', '🌐', 'Gemini Spheres', 35, 'Summon TWO spheres, each striking two enemies at once.', 'summon',
        { cd: 48, duration: [16, 20, 26], orbCount: 2, targets: 2, dmg: [20, 32, 46] }),
    ] },

  { id: 'priest', icon: '⛪', name: 'Priest', color: '#f0df91',
    summary: 'Dedicated healer with renewal, holy shields, cleansing and survival miracles.',
    passives: [
      P('priest_healing', '💚', 'Greater Healing', 3, '+8% class healing per rank.', { healPower: 0.08 }),
      P('priest_benediction', '🙏', 'Benediction', 5, 'Priest cooldowns -4% per rank.', { classCdReduction: 0.04 }),
      P('priest_fortitude', '❤️', 'Fortitude', 10, '+3.5% maximum health per rank.', { hpPct: 0.035 }),
      P('priest_renewal', '🌿', 'Renewal Mastery', 14, 'Healing-over-time +12% per rank.', { hotPower: 0.12 }),
      P('priest_shields', '🛡️', 'Divine Aegis', 18, 'Holy shields +12% per rank.', { shieldPower: 0.12 }),
      P('priest_purity', '✨', 'Purity', 22, 'Poison damage -12% per rank.', { poisonCut: 0.12 }),
      P('priest_mercy', '🕊️', 'Mercy', 27, 'Healing on targets below half health +10% per rank.', { lowHpHeal: 0.1 }),
      P('priest_radiance', '☀️', 'Radiance', 31, 'Healing and holy areas +10% per rank.', { healRadius: 0.1 }),
      P('priest_guardian', '👼', 'Guardian Faith', 37, 'Guardian miracles +15% per rank.', { guardianPower: 0.15 }),
      P('priest_high_priest', '✝️', 'High Priest', 44, 'Holy damage +7% per rank.', { holyPower: 0.07 }),
    ],
    actives: [
      A('priest_heal', '💚', 'Heal', 3, 'Restore a large amount of health.', 'heal',
        { cd: 9, amount: [55, 90, 135] }),
      A('priest_renew', '🌿', 'Renew', 7, 'Regenerate health over time.', 'hot',
        { cd: 14, duration: [8, 11, 14], amount: [7, 11, 16] }),
      A('priest_flash_heal', '✨', 'Flash Heal', 12, 'A fast emergency heal with a longer cooldown.', 'heal',
        { cd: 16, amount: [90, 145, 215] }),
      A('priest_prayer', '🙏', 'Prayer of Healing', 16, 'Heal yourself and a nearby ally.', 'world',
        { cd: 25, worldAction: 'groupHeal', amount: [65, 105, 155], radius: [8, 10, 12] }),
      A('priest_shield', '🛡️', 'Power Word: Shield', 20, 'Absorb incoming damage.', 'shield',
        { cd: 28, amount: [90, 150, 225] }),
      A('priest_purify', '🕊️', 'Purify', 24, 'Remove poison and harmful effects; restore some health.', 'cleanse',
        { cd: 22, amount: [25, 45, 70] }),
      A('priest_holy_nova', '☀️', 'Holy Nova', 29, 'Heal yourself while damaging nearby enemies.', 'holyNova',
        { cd: 20, radius: [5, 6.5, 8], amount: [45, 75, 110], damage: [35, 60, 90] }),
      A('priest_guardian_spirit', '👼', 'Guardian Spirit', 33, 'Prevent one lethal hit and restore health.', 'guardian',
        { cd: 75, duration: [10, 14, 18], amount: [0.25, 0.4, 0.55] }),
      A('priest_sanctuary', '⛪', 'Sanctuary', 41, 'Consecrate the aimed ground with sustained healing.', 'zone',
        { cd: 42, zone: 'healing', castRange: 20, radius: [5, 6.5, 8], duration: [8, 11, 14], amount: [8, 13, 19], interval: 1 }),
      A('priest_resurrection', '✝️', 'Resurrection', 50, 'Revive a fallen ally or grant yourself a massive heal.', 'world',
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
  Math.min(MAX_LEVEL, skill.level + Math.max(0, rank - 1) * 6);
// Committing to a class costs a token of meat; the first skill along the path
// is just as cheap so a brand-new class can be started for 10 + 10 meat.
export const CLASS_CHOOSE_COST = 10;
export const CLASS_FIRST_SKILL_COST = 10;
export const classSkillMeatCost = (skill, rank, firstOfClass = false) => {
  if (firstOfClass && rank <= 1) return CLASS_FIRST_SKILL_COST;
  const base = (skill.type === 'active' ? 40 : 25) + skill.level * 2;
  return Math.ceil(base * rank * (1 + 0.3 * Math.max(0, rank - 1)) / 5) * 5;
};
// The skills of a class laid out as a single progression "path": passives and
// active abilities interleaved by the level they unlock at (passive first on
// ties). The very first node is the class's cheap starter skill.
export const classPathSkills = (tree) =>
  [...tree.passives, ...tree.actives].sort((a, b) =>
    a.level - b.level || (a.type === 'active' ? 1 : 0) - (b.type === 'active' ? 1 : 0));
export const firstClassSkillId = (classId) => {
  const tree = classTreeById(classId);
  return tree ? classPathSkills(tree)[0].id : null;
};
// A passive effect value can be a flat per-rank number (value × rank) OR an
// explicit [R1, R2, R3] array of cumulative totals for finer, non-linear tuning.
export const passiveEffectValue = (value, rank) => Array.isArray(value)
  ? (value[Math.max(0, Math.min(value.length - 1, rank - 1))] ?? 0)
  : value * rank;
export function classEffectsFor(classId, training = {}) {
  const effects = {};
  const tree = classTreeById(classId);
  if (!tree) return effects;
  for (const skill of tree.passives) {
    const rank = Math.max(0, Math.min(skill.maxRank, training[skill.id] || 0));
    if (!rank) continue;
    for (const [key, value] of Object.entries(skill.effects || {})) {
      effects[key] = (effects[key] || 0) + passiveEffectValue(value, rank);
    }
  }
  return effects;
}
export function requiredClassForItem(item) {
  if (!item) return null;
  if (item.slot === 'companion' || item.weapon?.kind === 'bow') return 'beastmaster';
  return null;
}

// A "beast" the Beastmaster can tame: it walks on four or more legs, or it has
// wings. Two-legged humanoids, legless snakes, and constructs/undead are not
// beasts. (Bosses are excluded separately, at the tame site.)
const TAMEABLE_BEASTS = new Set(['rabbit', 'sheep', 'horse', 'rat', 'spider', 'scorpion',
  'wolf', 'venomspider', 'boar', 'elk', 'icewolf', 'icespider', 'bear', 'vulture', 'bee', 'bat',
  'cheetah', 'crocodile']);
export const isTameableBeast = (type) => TAMEABLE_BEASTS.has(type);

// ---- Concrete per-rank numbers for the class UI. Every skill can spell out
// exactly what a given rank does, so nothing stays a vague "increases X". ----
const pctStr = (v) => `${Math.round(v * 1000) / 10}%`;
const num1 = (v) => Math.round(v * 10) / 10;
const CLASS_EFFECT_INFO = {
  hpPct: v => `+${pctStr(v)} max health (gear & camp included)`,
  meleeDmg: v => `+${pctStr(v)} melee damage`,
  meleeSpeed: v => `+${pctStr(v)} melee attack speed`,
  meleeCrit: v => `+${pctStr(v)} melee crit chance`,
  damageCut: v => `-${pctStr(v)} damage taken`,
  // approximate: the exact widening depends on the weapon's own base arc
  arcBonus: v => `≈+${Math.round(Math.acos(Math.max(-1, 0.5 - v)) * 180 / Math.PI - 60)}° swing arc`,
  executeDmg: v => `+${pctStr(v)} damage vs wounded (below 50% HP)`,
  lifeOnKillPct: v => `heal ${pctStr(v)} max HP on every kill`,
  staggerChance: v => `${pctStr(v)} chance to stagger on every hit`,
  stunResist: v => `enemy stuns ${pctStr(v)} shorter`,
  blockBonus: v => `+${pctStr(v)} damage blocked`,
  classCdReduction: v => `-${pctStr(v)} class ability cooldowns`,
  speed: v => `+${num1(v)} move speed`,
  rangedDmg: v => `+${pctStr(v)} ranged damage`,
  rangedRange: v => `+${num1(v)} m bow/crossbow range`,
  rangedSpeed: v => `+${pctStr(v)} ranged attack speed`,
  rangedCrit: v => `+${pctStr(v)} ranged crit chance`,
  arrowBleed: v => `arrows bleed ${pctStr(v)} weapon damage/s for 5 s`,
  trapPower: v => `+${pctStr(v)} trap damage`,
  petPower: v => `+${pctStr(v)} companion health & damage`,
  petSpeed: v => `+${pctStr(v)} companion speed`,
  petRegen: v => `+${pctStr(v)} companion regeneration`,
  meatMult: v => `+${pctStr(v)} meat collected`,
  stealthDuration: v => `+${num1(v)} s stealth duration`,
  evadeDuration: v => `+${num1(v)} s evade window`,
  backstab: v => `+${pctStr(v)} damage from behind`,
  poisonPower: v => `+${pctStr(v)} poison damage`,
  hurtSpeed: v => `+${num1(v * 5)} speed burst after taking damage`,
  spellPower: v => `+${pctStr(v)} spell damage`,
  firePower: v => `+${pctStr(v)} fire damage`,
  frostPower: v => `+${pctStr(v)} frost damage`,
  fireRadius: v => `+${pctStr(v)} fire area size`,
  frostRadius: v => `+${pctStr(v)} frost area size`,
  spellCrit: v => `+${pctStr(v)} spell crit chance`,
  zoneDuration: v => `+${pctStr(v)} ground spell duration`,
  essenceMult: v => `+${pctStr(v)} essence collected`,
  shieldPower: v => `+${pctStr(v)} shield strength`,
  healPower: v => `+${pctStr(v)} healing`,
  hotPower: v => `+${pctStr(v)} healing over time`,
  poisonCut: v => `-${pctStr(v)} poison damage taken`,
  lowHpHeal: v => `+${pctStr(v)} healing below half health`,
  healRadius: v => `+${pctStr(v)} healing area size`,
  guardianPower: v => `+${pctStr(v)} guardian miracles`,
  holyPower: v => `+${pctStr(v)} holy damage`,
};
// how each timed buff's "power" number actually lands in combat (from player.js)
const CLASS_BUFF_INFO = {
  warCry: p => [`+${pctStr(p)} damage`, `-${pctStr(p * 0.5)} damage taken`],
  bloodFury: p => [`+${pctStr(p)} attack speed`, `${pctStr(p)} lifesteal`],
  avatar: p => [`+${pctStr(p)} damage`, `-${pctStr(p * 0.45)} damage taken`, `${pctStr(p)} max-HP shield`],
  arrowHaste: p => [`+${pctStr(p)} ranged attack speed`],
  poisonBlades: p => [`hits poison ${num1(4 * p)} dps for 5 s`],
  sprint: p => [`+${num1(p)} move speed`],
  combustion: p => [`+${pctStr(p)} fire damage`],
};
export function classPassiveInfo(skill, rank) {
  return Object.entries(skill.effects || {}).map(([key, v]) =>
    (CLASS_EFFECT_INFO[key] || ((x) => `${key} ${x}`))(passiveEffectValue(v, rank)));
}
export function classActiveInfo(skill, rank) {
  const rv = (key, fallback = 0) => {
    const v = skill[key];
    return Array.isArray(v) ? v[Math.max(0, Math.min(v.length - 1, rank - 1))] : (v ?? fallback);
  };
  const out = [];
  // traps: damage scales off weapon damage × the trap's power, plus a stun
  if (skill.trapDmgPct) {
    out.push(`${Math.round(skill.trapDmgPct * rv('power', 1) * 100)}% weapon damage per trap`);
    if (skill.trapStun) out.push(`stuns ${num1(skill.trapStun)} s`);
    out.push('bleeds the victim');
  }
  if (skill.weaponMult) out.push(`${Math.round(rv('weaponMult') * 100)}% weapon damage`);
  if (skill.damage) out.push(`${Math.round(rv('damage'))} damage`);
  if (skill.bleedPct) out.push(`bleeds ${pctStr(rv('bleedPct'))} of max HP over ${skill.bleedDur} s`);
  if (skill.burn) out.push(`burns ${Math.round(rv('burn'))} dps for 6 s`);
  if (skill.poison) out.push(`poisons ${Math.round(rv('poison'))} dps for 6 s`);
  if (skill.stun) out.push(`stuns ${num1(rv('stun'))} s`);
  if (skill.radius) out.push(`${num1(rv('radius'))} m radius`);
  if (skill.action === 'cone' || skill.action === 'magicCone') out.push(`${num1(rv('range'))} m cone`);
  else if (skill.range && ['target', 'execute', 'magicTarget', 'shadowstep'].includes(skill.action))
    out.push(`${num1(rv('range'))} m range`);
  if (skill.action === 'tame') out.push(`channel ${skill.channel} s`, `tamed for ${skill.tameDur} s`, `${skill.range} m reach`);
  if (skill.distance) out.push(`charges ${num1(rv('distance'))} m`);
  if (skill.castRange) out.push(`cast up to ${Math.min(20, rv('castRange'))} m away`);
  if (skill.count && (Array.isArray(skill.count) || skill.count > 1)) out.push(`×${rv('count')}`);
  if (skill.petMult) out.push(`${rv('petMult')}× companion damage`);
  if (skill.duration) out.push(`lasts ${num1(rv('duration'))} s`);
  if (skill.buff && CLASS_BUFF_INFO[skill.buff]) out.push(...CLASS_BUFF_INFO[skill.buff](rv('power')));
  if (skill.threshold) out.push(`target below ${pctStr(skill.threshold)} HP only`);
  if (skill.amount) {
    const a = rv('amount');
    out.push(a <= 1 ? `${pctStr(a)} of max HP`
      : skill.action === 'shield' ? `${Math.round(a)} damage absorbed`
        : skill.interval ? `${Math.round(a)} healing per tick` : `heals ${Math.round(a)}`);
  }
  if (skill.interval) out.push(`ticks every ${num1(rv('interval'))} s`);
  if (skill.windup) out.push(`${num1(skill.windup)} s windup`);
  return out;
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
      { level: 3, cost: { hide: 6, wood: 10 },
        desc: 'Age 2 — your cave becomes a hide tent. Unlocks hide clothing. +20 max health.' },
      { level: 7, cost: { wood: 60, stone: 10 },
        desc: 'Age 3 — a timber cabin. Unlocks bows. +60 max health, loot magnet reaches further.' },
      { level: 14, cost: { stone: 80, wood: 30, iron: 6 },
        desc: 'Age 4 — an iron-age stone house. +120 max health, +25% chopping & mining power.' },
      { level: 18, cost: { stone: 200, wood: 150, iron: 30, hide: 20, meat: 100 },
        desc: 'Age 5 — a MEDIEVAL KEEP. Unlocks knightly gear. +180 max health, +15% XP.' },
      { level: 24, cost: { stone: 320, wood: 240, iron: 55, hide: 30, essence: 18 },
        desc: 'Age 6 — a RUNIC HALL. Unlocks runic gear and Forge Tier I (+10% gear power).' },
      { level: 31, cost: { stone: 460, wood: 330, iron: 85, hide: 45, essence: 30 },
        desc: 'Age 7 — a MOUNTAIN FORTRESS. Unlocks storm gear and Forge Tier II (+20%).' },
      { level: 37, cost: { stone: 620, wood: 430, iron: 120, hide: 60, essence: 48 },
        desc: 'Age 8 — a SPIRIT BASTION. Unlocks spirit gear and Forge Tier III (+30%).' },
      { level: 44, cost: { stone: 800, wood: 560, iron: 165, hide: 80, essence: 70 },
        desc: 'Age 9 — a PRIMAL CITADEL. Unlocks primal gear and Forge Tier IV (+40%).' },
      { level: 50, cost: { stone: 1050, wood: 720, iron: 230, hide: 110, essence: 105 },
        desc: 'Age 10 — FROSTHOLD. Unlocks summit gear and Forge Tier V (+50%).' },
    ] },
  { id: 'furnace', icon: '🔥', max: 1,
    names: ['Stone Furnace'],
    levels: [
      { level: 10, cost: { stone: 40, wood: 15 },
        desc: 'Smelts iron: automatically turns 4 🪨 into 1 🔩 every 20 s. Unlocks the iron age.' },
    ] },
  { id: 'banner', icon: '🚩', max: 3,
    names: ['War Banner', 'Rallying Standard', 'Grand Ensign'],
    levels: [
      { level: 10,  cost: { meat: 120, wood: 120, hide: 20 },
        desc: 'Raise a war banner over camp. +8% XP and the loot magnet reaches further. (A late-game meat/wood sink.)' },
      { level: 16,  cost: { meat: 320, wood: 260, iron: 20, hide: 40 },
        desc: 'A rallying standard. +16% XP, wider loot magnet, +40 max health.' },
      { level: 22, cost: { meat: 700, wood: 550, iron: 60, essence: 15 },
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

// Weapons + companions share one "Arsenal" tab. Spells and stat training are
// gone — the exclusive class trees (Character → Class) now own every ability
// and combat bonus, so there is no parallel progression to buy here.
export const SHOP_GROUPS = [
  { key: 'weapons',  label: '⚔️ Arsenal', items: () => ITEMS.filter(i =>
      (i.slot === 'companion' || (i.slot === 'weapon' && !isForgeItem(i)))
      && !i.free && !i.unique) },
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
  { event: 'temple', name: '🏛️ The broken map', desc: 'Clear a jungle temple and recover its hidden route.' },
  { event: 'tribeAlliance', name: '🪶 Terms with the marsh', desc: 'Earn safe passage from the swamp tribe at their village.' },
  { event: 'crypt', name: '🕯️ Light below the roots', desc: 'Clear and open a crypt in the Dark Forest.' },
  { event: 'graveyardRest', name: '👻 Let the dead sleep', desc: 'Defend a haunted graveyard until its spirits rest.' },
  { event: 'raceWin', name: '🏁 The high road', desc: 'Win a mounted race through the Highlands.' },
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
