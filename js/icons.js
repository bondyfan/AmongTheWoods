// ---- Custom SVG item icons (replacing the emoji) ----
// Flat 32×32 vectors in a shared palette so gear reads consistently in the
// shop, character sheet and HUD. itemIcon(entry) returns inline HTML and
// falls back to the entry's emoji for anything without a custom icon
// (spells, stat tracks, camp buildings…).

// palette
const WOOD = '#9c6b38', WOOD_D = '#5f3d1c';
const STONE = '#a8adb5', STONE_D = '#666c75';
const IRON = '#d3dae1', IRON_D = '#7c8894';
const LEATHER = '#b5824a', LEATHER_D = '#7c5426';
const FUR = '#8a6a4a', FUR_L = '#d9c4a5';
const SKIN = '#eab98d', SKIN_D = '#a06a3c';
const GOLD = '#f2c14e', GOLD_D = '#a97d1e';

const S = (body) => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// a diagonal wooden haft from bottom-left to top-right
const HAFT = `<line x1="7" y1="29" x2="22" y2="8" stroke="${WOOD}" stroke-width="3.4" stroke-linecap="round"/>
  <line x1="7" y1="29" x2="22" y2="8" stroke="${WOOD_D}" stroke-width="1" stroke-linecap="round" opacity="0.35"/>`;

const axe = (fill, dark, doubleBit = false) => S(`${HAFT}
  <path d="M14 4c4-2 9-2 13 1-1 4-3 7-6 9l-7-7z" fill="${fill}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
  ${doubleBit ? `<path d="M28 15c2 4 2 9-1 13-4-1-7-3-9-6l7-7z" transform="rotate(180 22 14) translate(0 -6)" fill="${fill}" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
  <line x1="19" y1="11" x2="23" y2="7" stroke="${dark}" stroke-width="1.2" opacity="0.6"/>`);

const bow = (limb, limbD, arrow = '', extra = '') => S(`${extra}
  <path d="M9 3c9 4 9 22 0 26" fill="none" stroke="${limb}" stroke-width="3" stroke-linecap="round"/>
  <path d="M9 3c9 4 9 22 0 26" fill="none" stroke="${limbD}" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <line x1="9" y1="3" x2="9" y2="29" stroke="#e8e2d4" stroke-width="1.2"/>
  ${arrow}`);

const ARROW = `<line x1="9" y1="16" x2="27" y2="16" stroke="${WOOD}" stroke-width="2"/>
  <path d="M27 16l-5-3v6z" fill="${IRON}" stroke="${IRON_D}" stroke-width="1"/>
  <path d="M11 13l-3 3 3 3" fill="none" stroke="#c9b299" stroke-width="1.6"/>`;

const boot = (fill, dark, extra = '') => S(`
  <path d="M11 4h9v13c4 1 7 3 8 7 0 2-1 3-3 3H11c-1.5 0-2-1-2-2.5V6.5C9 5 9.8 4 11 4z"
    fill="${fill}" stroke="${dark}" stroke-width="1.6" stroke-linejoin="round"/>
  <line x1="11" y1="10" x2="20" y2="10" stroke="${dark}" stroke-width="1.4" opacity="0.6"/>
  <line x1="11" y1="14" x2="20" y2="14" stroke="${dark}" stroke-width="1.4" opacity="0.6"/>
  ${extra}`);

const orb = (glow, extra = '') => S(`
  <circle cx="16" cy="16" r="8.5" fill="${glow}" stroke="#3d7ba6" stroke-width="1.6"/>
  <circle cx="13" cy="13" r="2.6" fill="#ffffff" opacity="0.7"/>
  <ellipse cx="16" cy="18.5" rx="13" ry="4" fill="none" stroke="#7fd1ff" stroke-width="1.8" opacity="0.85"/>
  ${extra}`);

const wolfHead = (extra = '') => S(`
  <path d="M7 6l4 5-4 9c0 6 4 9 9 9s9-3 9-9l-4-9 4-5-7 3h-4z"
    fill="#8b8f96" stroke="#4c5157" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M13 24c1 2 5 2 6 0l-3 4z" fill="#4c5157"/>
  <circle cx="12.5" cy="17" r="1.5" fill="#ffd23a"/>
  <circle cx="19.5" cy="17" r="1.5" fill="#ffd23a"/>
  <path d="M16 20l-1.6 2.4h3.2z" fill="#33373c"/>
  ${extra}`);

export const ITEM_ICONS = {
  // -- weapons: melee --
  fists: S(`
    <path d="M8 15c0-5 3-8 7-8h6c4 0 6 3 6 6v5c0 6-4 10-9 10s-10-4-10-9z"
      fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.6"/>
    <path d="M13 8v7M17.5 7v8M22 8v7" stroke="${SKIN_D}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M8 17c-2.5 0-4 1.5-4 3.5S5.5 24 8 24" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.6"/>`),
  club: S(`
    <path d="M21 2c5 0 9 4 9 9 0 4-2.5 7-6 8l-2.5.7L10 31c-1 1-2.8 1-3.8 0l-3.2-3.2c-1-1-1-2.8 0-3.8L14.3 12l.7-2.5C16 5.5 18 2 21 2z"
      fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="22.5" cy="9.5" r="1.4" fill="${WOOD_D}"/>
    <circle cx="18" cy="14" r="1.1" fill="${WOOD_D}"/>`),
  stoneAxe: axe(STONE, STONE_D),
  steelAxe: axe(IRON, IRON_D),
  warAxe: S(`
    <line x1="16" y1="6" x2="16" y2="30" stroke="${WOOD}" stroke-width="3.4" stroke-linecap="round"/>
    <line x1="16" y1="6" x2="16" y2="30" stroke="${WOOD_D}" stroke-width="1" stroke-linecap="round" opacity="0.35"/>
    <path d="M14.5 3c-5 0-9.5 2.5-11.5 7 2 4.5 6.5 7 11.5 7z" fill="#b8452e" stroke="#6e2317" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M17.5 3c5 0 9.5 2.5 11.5 7-2 4.5-6.5 7-11.5 7z" fill="#b8452e" stroke="#6e2317" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M5 10c1.5-3 4.5-5 8-5.4M27 10c-1.5-3-4.5-5-8-5.4" fill="none" stroke="#ffd9a0" stroke-width="1.3" opacity="0.85"/>`),
  steelSword: S(`
    <path d="M16 2l3 3v15l-3 3-3-3V5z" fill="${IRON}" stroke="${IRON_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="16" y1="4.5" x2="16" y2="20" stroke="${IRON_D}" stroke-width="1" opacity="0.6"/>
    <rect x="8.5" y="22" width="15" height="3" rx="1.5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.3"/>
    <rect x="14.4" y="25" width="3.2" height="5" rx="1.4" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.2"/>`),
  // -- weapons: ranged --
  huntingBow: bow(WOOD, WOOD_D),
  longbow: bow(LEATHER, LEATHER_D, ARROW),
  rapidBow: bow(WOOD, WOOD_D, ARROW,
    `<path d="M18 7c3-1.5 6-1.5 9 0M18 25c3 1.5 6 1.5 9 0" fill="none" stroke="#6fd8d0" stroke-width="1.8" stroke-linecap="round"/>`),
  crossbow: S(`
    <path d="M4 9c8-4 16-4 24 0" fill="none" stroke="${IRON}" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="4" y1="9" x2="28" y2="9" stroke="#e8e2d4" stroke-width="1.1"/>
    <rect x="14.2" y="5" width="3.6" height="21" rx="1.6" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.4"/>
    <path d="M16 3l-2.4 4h4.8z" fill="${IRON}" stroke="${IRON_D}" stroke-width="1"/>
    <rect x="13" y="20" width="6" height="3" rx="1" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1"/>`),
  // -- head --
  leatherCap: S(`
    <path d="M6 18c0-7 4.5-11 10-11s10 4 10 11z" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6"/>
    <path d="M4 18h24c1.5 0 1.5 3-1 3H5c-2.5 0-2.5-3-1-3z" fill="${LEATHER_D}"/>
    <path d="M12 9c-2 2-3 5-3 9M20 9c2 2 3 5 3 9" fill="none" stroke="${LEATHER_D}" stroke-width="1.2" opacity="0.6"/>`),
  furHood: S(`
    <path d="M6 24c-1-10 3-17 10-17s11 7 10 17l-5-2c1-7-1-11-5-11s-6 4-5 11z"
      fill="${FUR}" stroke="#5c452e" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M11 22c0-6 1.5-9 5-9s5 3 5 9c0 2-1.5 3.5-5 3.5S11 24 11 22z" fill="#2e2a26"/>
    <path d="M6 24l5-2M26 24l-5-2" stroke="${FUR_L}" stroke-width="2.4" stroke-linecap="round"/>`),
  bearHelm: S(`
    <path d="M7 20c0-8 4-13 9-13s9 5 9 13l-2 5H9z" fill="#f0ead8" stroke="#a89f88" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M9 6l3 4M23 6l-3 4" stroke="#6b5b45" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="12.5" cy="16" r="1.8" fill="#33373c"/>
    <circle cx="19.5" cy="16" r="1.8" fill="#33373c"/>
    <path d="M10 25l1.6-3 1.6 3 1.6-3 1.6 3 1.6-3 1.6 3 1.6-3 1.6 3" fill="none" stroke="#f0ead8" stroke-width="1.6"/>`),
  // -- chest --
  leatherArmor: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 7v20" stroke="${LEATHER_D}" stroke-width="1.3" opacity="0.6"/>
    <path d="M11 13h4M17 17h4" stroke="${LEATHER_D}" stroke-width="1.3" opacity="0.6"/>`),
  furCoat: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="${FUR}" stroke="#5c452e" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M10 5l6 6 6-6" fill="none" stroke="${FUR_L}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M8 26h16" stroke="${FUR_L}" stroke-width="2.2"/>
    <path d="M16 11v15" stroke="#5c452e" stroke-width="1.3" opacity="0.7"/>`),
  bearHide: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="#6b4a2e" stroke="#3f2a17" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="12" cy="15" r="1.2" fill="${IRON}"/><circle cx="20" cy="15" r="1.2" fill="${IRON}"/>
    <circle cx="12" cy="21" r="1.2" fill="${IRON}"/><circle cx="20" cy="21" r="1.2" fill="${IRON}"/>
    <path d="M8 18h16" stroke="#3f2a17" stroke-width="1.4" opacity="0.7"/>`),
  // -- boots --
  swiftBoots: S(`
    <path d="M10 12h9v5c4 1 7 3 8 7 0 2-1 3-3 3H10c-1.5 0-2-1-2-2.5V14c0-1.5.8-2 2-2z"
      fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 15l11 3M8 19l12 2" stroke="#e3cfa9" stroke-width="1.8"/>`),
  huntersBoots: boot(LEATHER, LEATHER_D),
  windBoots: boot('#8f9ba8', '#525f6e',
    `<path d="M20 6c3-2.5 7-3 10-2-1.5 2.5-4 4.5-7 5M19 11c2.6-2 6-2.6 8.6-1.8-1.3 2-3.4 3.6-5.8 4.2"
      fill="#e9f2fa" stroke="#8fb6d6" stroke-width="1.2" stroke-linejoin="round"/>`),
  // -- pets --
  tamedWolf: wolfHead(),
  alphaWolf: wolfHead(`
    <path d="M10 6.5l2.5 3 3.5-4 3.5 4 2.5-3 .8 5.5H9.2z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2" stroke-linejoin="round"/>`),
  // -- orbs --
  guardianSphere: orb('#59b7f0'),
  twinSphere: orb('#59b7f0',
    `<path d="M8 4l-3 6h3l-2 5 6-7h-3l2-4zM27 17l-3 6h3l-2 5 6-7h-3l2-4z" fill="#ffe94a" stroke="#b8960a" stroke-width="0.8"/>`),
  duoSphere: S(`
    <circle cx="11" cy="13" r="7" fill="#59b7f0" stroke="#3d7ba6" stroke-width="1.5"/>
    <circle cx="8.8" cy="10.8" r="2" fill="#ffffff" opacity="0.7"/>
    <circle cx="21" cy="20" r="7" fill="#b48cff" stroke="#6e4fa8" stroke-width="1.5"/>
    <circle cx="18.8" cy="17.8" r="2" fill="#ffffff" opacity="0.7"/>
    <ellipse cx="16" cy="16.5" rx="14" ry="4.5" fill="none" stroke="#7fd1ff" stroke-width="1.6" opacity="0.8" transform="rotate(-18 16 16.5)"/>`),
};

// Inline-HTML icon for an item; falls back to the emoji for anything
// without a custom vector (spells, stat tracks, camp buildings…).
export function itemIcon(entry) {
  const svg = ITEM_ICONS[entry?.id];
  return svg ? `<span class="item-icon">${svg}</span>` : (entry?.icon ?? '');
}
