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

const bolt = (fill, dark) => `<path d="M18 2L7 18h6l-3 12 12-17h-6l4-11z" fill="${fill}" stroke="${dark}" stroke-width="1.3" stroke-linejoin="round"/>`;

// hand torch: wooden handle, tar wrap, layered flame — tiers differ by flame
// heat and halo (no emoji on items, ever)
const torchIcon = (outer, inner, halo = '') => S(`${halo}
  <line x1="16" y1="29" x2="16" y2="15" stroke="${WOOD}" stroke-width="3.8" stroke-linecap="round"/>
  <line x1="16" y1="29" x2="16" y2="15" stroke="${WOOD_D}" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
  <rect x="12.4" y="12.6" width="7.2" height="4.6" rx="1.8" fill="#3a2a16" stroke="#241809" stroke-width="1"/>
  <path d="M16 2.5c3.2 3.4 5 6 5 8.6 0 3.1-2.2 5.1-5 5.1s-5-2-5-5.1c0-2.6 1.8-5.2 5-8.6z"
    fill="${outer}" stroke="#a84a10" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M16 6.8c1.7 2 2.5 3.4 2.5 4.8 0 1.8-1.1 2.9-2.5 2.9s-2.5-1.1-2.5-2.9c0-1.4.8-2.8 2.5-4.8z"
    fill="${inner}"/>`);

export const ITEM_ICONS = {
  // ===== expedition torches =====
  torch: torchIcon('#ff9a2e', '#ffd873'),
  torchoil: torchIcon('#ffb036', '#fff2b0',
    `<circle cx="16" cy="10" r="9.5" fill="#ffb036" opacity="0.18"/>`),
  torchember: torchIcon('#ff6b1a', '#ffe08a',
    `<circle cx="16" cy="10" r="12" fill="#ff5a1a" opacity="0.2"/>
     <circle cx="16" cy="10" r="8" fill="#ff8a2a" opacity="0.25"/>`),
  // ===== spells =====
  haste: S(bolt('#ffe94a', '#b8960a')),
  powerDash: S(`
    <path d="M4 20c4 0 4-8 8-8M8 24c5 0 5-8 10-8" fill="none" stroke="#9adcff" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M14 22l9-6c2-1.4 4.5-1 6 .8l-4 8c-1 2-3.4 2.6-5.2 1.4z" fill="#5fa8e0" stroke="#2d6a9e" stroke-width="1.5" stroke-linejoin="round"/>`),
  heal: S(`
    <path d="M16 28C8 22 4 17 4 12c0-4 3-7 7-7 2.4 0 4 1.2 5 3 1-1.8 2.6-3 5-3 4 0 7 3 7 7 0 5-4 10-12 16z"
      fill="#6fd86f" stroke="#2e7d32" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 12v8M12 16h8" stroke="#eafff0" stroke-width="2.4" stroke-linecap="round"/>`),
  stunDash: S(`
    <path d="M16 4c6 0 11 5 11 11 0 8-9 13-11 13S5 23 5 15C5 9 10 4 16 4z" fill="none" stroke="#bfa8ff" stroke-width="0" />
    <path d="M25 7c-4 8-14 4-18 12 4 3 12 4 17-1 3-3 3-8 1-11z" fill="#a98fe8" stroke="#5f4a9e" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 22c6-6 14-3 18-9" fill="none" stroke="#e4dcff" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="7" cy="9" r="1.5" fill="#ffe94a"/><circle cx="12" cy="5" r="1.2" fill="#ffe94a"/>`),
  shockwave: S(`
    <circle cx="16" cy="16" r="4.5" fill="#ffb84a" stroke="#a86a10" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#ff9d3a" stroke-width="2" opacity="0.75"/>
    <circle cx="16" cy="16" r="13.5" fill="none" stroke="#ff8030" stroke-width="1.8" opacity="0.45"/>`),
  frostNova: S(`
    <path d="M16 3v26M5 9.5l22 13M27 9.5l-22 13" stroke="#9adcff" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M16 7l-3-3M16 7l3-3M16 25l-3 3M16 25l3 3M8 11l-4-1M8 21l-4 1M24 11l4-1M24 21l4 1"
      stroke="#9adcff" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="3" fill="#e6f7ff" stroke="#5fb8e8" stroke-width="1.2"/>`),
  rage: S(`
    <path d="M9 5c0 4-5 6-5 12 0 6 5 11 12 11s12-5 12-11c0-6-5-8-5-12-2 2-3 4-3 6-1-4-4-6-7-9 0 4-4 6-4 9-1-2-1-4 0-6z"
      fill="#ff7038" stroke="#a83010" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M13 24c0-3 1.4-5 3-7 1.6 2 3 4 3 7 0 2-1.3 3.4-3 3.4S13 26 13 24z" fill="#ffd23a"/>`),
  // ===== training tracks =====
  range: S(`
    <circle cx="16" cy="16" r="12" fill="none" stroke="#e05050" stroke-width="2"/>
    <circle cx="16" cy="16" r="7.5" fill="none" stroke="#e05050" stroke-width="1.6"/>
    <circle cx="16" cy="16" r="3" fill="#e05050"/>
    <line x1="16" y1="16" x2="28" y2="4" stroke="${WOOD}" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 4l-6 1M28 4l-1 6" stroke="${WOOD_D}" stroke-width="1.6" stroke-linecap="round"/>`),
  power: S(`
    <path d="M6 21c0-6 4-12 10-12s10 6 10 12" fill="none" stroke="${SKIN_D}" stroke-width="0"/>
    <path d="M5 22c1-7 4-12 8-12 3 0 4 2 3 5-2 5-6 8-9 9-1.4.4-2-.6-2-2z" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M27 22c-1-7-4-12-8-12-3 0-4 2-3 5 2 5 6 8 9 9 1.4.4 2-.6 2-2z" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="16" cy="24" r="4.5" fill="#e05050" stroke="#8e2020" stroke-width="1.4"/>`),
  swift: S(`
    <path d="M4 10h16M4 16h13M4 22h10" stroke="#9adcff" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M20 6l8 10-8 10c-2-4-2-16 0-20z" fill="#5fa8e0" stroke="#2d6a9e" stroke-width="1.5" stroke-linejoin="round"/>`),
  gather: S(`
    <path d="M6 14h20l-2.5 13c-.2 1.2-1.2 2-2.4 2H10.9c-1.2 0-2.2-.8-2.4-2z"
      fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M9 14c0-4.5 3-8 7-8s7 3.5 7 8" fill="none" stroke="${WOOD_D}" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 19h16M9.5 24h13" stroke="${WOOD_D}" stroke-width="1.1" opacity="0.55"/>
    <circle cx="12.5" cy="13" r="1.6" fill="#d8302e"/><circle cx="19" cy="12.5" r="1.6" fill="#e8a33a"/>`),
  pet: S(`
    <ellipse cx="16" cy="21" rx="6" ry="5" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.4"/>
    <ellipse cx="8" cy="12" rx="2.8" ry="3.6" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.3"/>
    <ellipse cx="24" cy="12" rx="2.8" ry="3.6" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.3"/>
    <ellipse cx="14" cy="6.5" rx="2.5" ry="3.2" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.3" transform="rotate(-12 14 6.5)"/>
    <ellipse cx="19" cy="6.5" rx="2.5" ry="3.2" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.3" transform="rotate(12 19 6.5)"/>`),
  // ===== charms =====
  copperRing: S(`
    <circle cx="16" cy="18" r="8.5" fill="none" stroke="#c47a3a" stroke-width="4"/>
    <circle cx="16" cy="18" r="8.5" fill="none" stroke="#8a4f1e" stroke-width="1" opacity="0.6"/>
    <path d="M12.5 7h7l-1.6 3.4h-3.8z" fill="#6fd86f" stroke="#2a8a45" stroke-width="1.2" stroke-linejoin="round"/>`),
  bloodAmulet: S(`
    <path d="M7 5c3 5 7 8 9 8s6-3 9-8" fill="none" stroke="${LEATHER_D}" stroke-width="1.8"/>
    <path d="M16 12c-3 4-4.6 6.6-4.6 9.2 0 3 2 5.2 4.6 5.2s4.6-2.2 4.6-5.2c0-2.6-1.6-5.2-4.6-9.2z"
      fill="#c42828" stroke="#701212" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="14.4" cy="20" r="1.1" fill="#ff9a9a" opacity="0.85"/>`),
  wolfPendant: S(`
    <path d="M6 6c3 5 8 8 10 8s7-3 10-8" fill="none" stroke="${LEATHER_D}" stroke-width="1.8"/>
    <path d="M16 13c-2.4 0-4 1.6-4 3.6 0 3.6 2.4 8 4 10.4 1.6-2.4 4-6.8 4-10.4 0-2-1.6-3.6-4-3.6z"
      fill="#f0ead8" stroke="#a89f88" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="16" cy="13.4" r="1.5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/>`),
  hawkAmulet: S(`
    <path d="M7 5c3 5 7 8 9 8s6-3 9-8" fill="none" stroke="${LEATHER_D}" stroke-width="1.8"/>
    <path d="M16 12c-4 3-5 9-3 15 1.2-1 2-2.4 2.4-4 .4 1.2 1 2.2 1.8 3 .4-1.6 1-3.2 1-5 1 .8 1.6 2 1.8 3.4 2-5 .6-10-4-12.4z"
      fill="#c9b8ff" stroke="#6e4fa8" stroke-width="1.4" stroke-linejoin="round"/>`),
  frostSphere: orb('#bfe6ff',
    `<path d="M16 10v12M11 13l10 6M21 13l-10 6" stroke="#e6f7ff" stroke-width="1.3" opacity="0.9"/>`),
  // ===== unique boss drops =====
  // Verdant Heart: a living green heart with a leaf-vein motif and a soft glow
  verdantHeart: S(`
    <circle cx="16" cy="16" r="11" fill="#3aa85f" opacity="0.22"/>
    <path d="M16 27C8.5 21.5 5 17.5 5 12.6 5 8.9 7.8 6 11.3 6c2 0 3.8 1 4.7 2.6C16.9 7 18.7 6 20.7 6 24.2 6 27 8.9 27 12.6c0 4.9-3.5 8.9-11 14.4z"
      fill="#4fc46a" stroke="#1f7a3c" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 9.5v13.5" stroke="#1f7a3c" stroke-width="1.4" opacity="0.7"/>
    <path d="M16 13c-1.8-1.4-3.6-1.8-5.4-1.6M16 17c-2-1.6-4-2-6-1.8M16 15c1.8-1.4 3.6-1.8 5.4-1.6M16 19c2-1.6 4-2 6-1.8"
      fill="none" stroke="#1f7a3c" stroke-width="1.2" opacity="0.6"/>
    <path d="M12.5 11.5c1.4.6 2.4 1.8 2.6 3.4" fill="none" stroke="#d8ffe4" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>`),
  // ===== consumables =====
  salve: S(`
    <path d="M12 4h8v3l-2 2v3c3 1.5 5 4.5 5 8 0 4.5-3.5 8-7 8s-7-3.5-7-8c0-3.5 2-6.5 5-8V9l-2-2z"
      fill="#d8f2e0" stroke="#4a8a6a" stroke-width="1.5" stroke-linejoin="round" opacity="0.9"/>
    <path d="M10 19c0 4 2.6 6.8 6 6.8s6-2.8 6-6.8c0-2.6-1.4-4.8-4-6v-2h-4v2c-2.6 1.2-4 3.4-4 6z" fill="#6fd86f" opacity="0.85"/>
    <rect x="11.4" y="2.6" width="9.2" height="2.6" rx="1.2" fill="#8a5a2b" stroke="#5f3d1c" stroke-width="1"/>`),
  roast: S(`
    <path d="M8 20c-2 0-3.6 1.6-3.6 3.4 0 1.4 1 2.6 2.4 2.8.2 1.4 1.4 2.4 2.8 2.4 1.8 0 3.4-1.6 3.4-3.6z"
      fill="#f0ead8" stroke="#a89f88" stroke-width="1.3"/>
    <path d="M11 21C14 24 21 26 25 22c4.5-4.5 3-12-2-15-3.5-2-8-1.5-10.5 1C9 11.5 8.5 18.5 11 21z"
      fill="#b5682a" stroke="#7c3f16" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 10c2-1.4 5-1.4 7 .4" fill="none" stroke="#ffd9a0" stroke-width="1.6" stroke-linecap="round"/>`),
  // ===== camp buildings =====
  home: S(`
    <path d="M16 4L3 26h26z" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 4L9 26h14z" fill="#c99a63" stroke="${LEATHER_D}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M16 12l-4 14h8z" fill="#4a3520"/>`),
  chest: S(`
    <path d="M5 12c0-3 2-5 5-5h12c3 0 5 2 5 5v4H5z" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6"/>
    <rect x="5" y="16" width="22" height="10" rx="1.5" fill="#8a5a2b" stroke="${WOOD_D}" stroke-width="1.6"/>
    <rect x="13.6" y="13" width="4.8" height="7" rx="1" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.3"/>
    <circle cx="16" cy="17" r="0.9" fill="${GOLD_D}"/>`),
  furnace: S(`
    <path d="M7 28V12l4-6h10l4 6v16z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 28v-8c0-2.5 1.6-4 4-4s4 1.5 4 4v8z" fill="#2a2320"/>
    <path d="M16 19c1.6 2 2.4 3.4 2.4 5 0 1.5-1 2.6-2.4 2.6s-2.4-1.1-2.4-2.6c0-1.6.8-3 2.4-5z" fill="#ff8030"/>
    <path d="M13 3h2.6v4H13zM17.4 2H20v5h-2.6z" fill="${STONE_D}"/>`),
  boat: S(`
    <path d="M3 18h26c-1 5-6 9-13 9S4 23 3 18z" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <line x1="16" y1="4" x2="16" y2="18" stroke="${WOOD_D}" stroke-width="2"/>
    <path d="M16 4c5 1 8 5 8 10h-8z" fill="#e8e2d4" stroke="#b0a890" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M5 21h22" stroke="${WOOD_D}" stroke-width="1" opacity="0.5"/>`),
  tower: S(`
    <path d="M9 28V10h14v18z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.6"/>
    <path d="M7 10V5h3v3h3V5h6v3h3V5h3v5z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="13.6" y="19" width="4.8" height="9" fill="#3a3230"/>
    <rect x="13.8" y="12" width="4.4" height="3.4" rx="0.8" fill="#3a3230"/>`),
  grave: S(`
    <path d="M9 28V12c0-4 3-7 7-7s7 3 7 7v16z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.6"/>
    <path d="M16 12v10M12.5 15.5h7" stroke="${STONE_D}" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 28h22" stroke="#4a5a3a" stroke-width="2.4" stroke-linecap="round"/>`),
  // ===== MOBA base buildings (tower shared with the camp tower) =====
  den: S(`
    <path d="M4 27L16 6l12 21z" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M11 27l5-9 5 9z" fill="#3a2c1a"/>
    <circle cx="14.4" cy="23" r="0.9" fill="#ffd23a"/><circle cx="17.6" cy="23" r="0.9" fill="#ffd23a"/>`),
  forge: S(`
    <path d="M5 24h22v4H5z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.5"/>
    <path d="M8 24V15h16v9" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.5"/>
    <path d="M12 24v-5c0-2 1.6-3.4 4-3.4s4 1.4 4 3.4v5z" fill="#ff8030"/>
    <path d="M20 4l6 2-1.6 4.4L26 13l-5 2-4-8z" fill="${IRON}" stroke="${IRON_D}" stroke-width="1.4" stroke-linejoin="round"/>`),
  lodge: S(`
    <path d="M4 16L16 5l12 11v11H4z" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M2 17L16 4l14 13" fill="none" stroke="${WOOD_D}" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="12.5" y="18" width="7" height="9" fill="#3a2c1a"/>
    <rect x="21" y="7" width="3" height="6" fill="${WOOD_D}"/>`),
  walls: S(`
    <path d="M4 28V12h24v16z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.6"/>
    <path d="M4 12V7h4v3h4V7h4v3h4V7h4v3h4V7h4v5z" fill="${STONE}" stroke="${STONE_D}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M4 20h24M10 12v8M22 12v8M16 20v8" stroke="${STONE_D}" stroke-width="1.2" opacity="0.7"/>`),

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
  // -- tools: pickaxes --
  bonePick: S(`${HAFT}
    <path d="M8 12C10 5 18 1 26 4c-1 2-2.5 3.6-4.5 4.8 2.2.6 4 1.8 5.5 3.7-7 3.5-15 1.5-19-.5z"
      fill="#e8e0cc" stroke="#a89f88" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 10.5l4-4" stroke="#a89f88" stroke-width="1.1" opacity="0.6"/>`),
  ironPick: S(`${HAFT}
    <path d="M8 12C10 5 18 1 26 4c-1 2-2.5 3.6-4.5 4.8 2.2.6 4 1.8 5.5 3.7-7 3.5-15 1.5-19-.5z"
      fill="${IRON}" stroke="${IRON_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 10.5l4-4" stroke="#ffffff" stroke-width="1.2" opacity="0.7"/>`),
  huntSpear: S(`
    <line x1="6" y1="28" x2="24" y2="6" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M22 3c2.5-.8 5-.8 7 .3-.2 2.3-1.3 4.5-3.3 6.2L21.5 9z"
      fill="${STONE}" stroke="${STONE_D}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M20 12l-2 2" stroke="${LEATHER_D}" stroke-width="2" stroke-linecap="round"/>`),
  obsidianPick: S(`${HAFT}
    <path d="M8 12C10 5 18 1 26 4c-1 2-2.5 3.6-4.5 4.8 2.2.6 4 1.8 5.5 3.7-7 3.5-15 1.5-19-.5z"
      fill="#3a3440" stroke="#191521" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 10.5l4-4" stroke="#b48cff" stroke-width="1.3" opacity="0.9"/>`),
  // -- weapons: ranged --
  huntingBow: bow(WOOD, WOOD_D),
  recurveBow: bow('#8a5a1a', '#5c3a10', ARROW,
    `<path d="M9 3c-2 0-3 1.5-2.6 3M9 29c-2 0-3-1.5-2.6-3" fill="none" stroke="#5c3a10" stroke-width="2" stroke-linecap="round"/>`),
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
  boneHelm: S(`
    <path d="M7 20c0-8 4-13 9-13s9 5 9 13l-2 4H9z" fill="#e8e0cc" stroke="#a89f88" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M10 12l4 3M22 12l-4 3" stroke="#a89f88" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M9 24h14" stroke="#8a5f33" stroke-width="2" stroke-linecap="round"/>`),
  ironHelm: S(`
    <path d="M7 19c0-8 4-12 9-12s9 4 9 12l-1.5 5h-15z" fill="${IRON}" stroke="${IRON_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="14.6" y="14" width="2.8" height="9" fill="${IRON_D}"/>
    <path d="M9 17h5M18 17h5" stroke="${IRON_D}" stroke-width="1.6" stroke-linecap="round"/>`),
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
  ironChest: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="${IRON}" stroke="${IRON_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 7v20" stroke="${IRON_D}" stroke-width="1.3" opacity="0.6"/>
    <circle cx="12" cy="14" r="1" fill="${IRON_D}"/><circle cx="20" cy="14" r="1" fill="${IRON_D}"/>
    <circle cx="12" cy="21" r="1" fill="${IRON_D}"/><circle cx="20" cy="21" r="1" fill="${IRON_D}"/>`),
  // -- boots --
  swiftBoots: S(`
    <path d="M10 12h9v5c4 1 7 3 8 7 0 2-1 3-3 3H10c-1.5 0-2-1-2-2.5V14c0-1.5.8-2 2-2z"
      fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 15l11 3M8 19l12 2" stroke="#e3cfa9" stroke-width="1.8"/>`),
  huntersBoots: boot(LEATHER, LEATHER_D),
  ironBoots: boot(IRON, IRON_D,
    `<path d="M24 22c2 .6 3.6 1.8 4.4 3.6" fill="none" stroke="${IRON_D}" stroke-width="2.2" stroke-linecap="round"/>`),
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
  // ===== late additions: every shop item gets a hand-drawn vector =====
  boneAxe: S(`${HAFT}
    <path d="M14 4c3.5-2 8-2.2 12 .4-.8 3.8-2.6 6.8-5.5 8.8l-7-7z"
      fill="#e8e0cc" stroke="#a89f88" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M18 10.5l4-4M15.5 6.5l1.5 1.5" stroke="#a89f88" stroke-width="1.2" opacity="0.7"/>
    <path d="M20 12.5l2.5 1" stroke="#8a5f33" stroke-width="1.8" stroke-linecap="round"/>`),
  highlandSpear: S(`
    <line x1="6" y1="28" x2="24" y2="6" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M22 3c2.8-1 5.6-1 7.8.4-.3 2.6-1.6 5-3.8 6.8L21.5 9z"
      fill="${IRON}" stroke="${IRON_D}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M27 2l-2 4h2.6l-3.2 5" fill="none" stroke="#ffe94a" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M19 12.5l-2.4 2.4M17 11l-1 1" stroke="${LEATHER_D}" stroke-width="2" stroke-linecap="round"/>`),
  serpentBow: bow('#4a8a3a', '#2d5c22', ARROW,
    `<path d="M9 3c1.8-.4 3.4.4 4 2M9 29c1.8.4 3.4-.4 4-2" fill="none" stroke="#2d5c22" stroke-width="2" stroke-linecap="round"/>
     <circle cx="10.5" cy="5" r="1" fill="#c9e05a"/>`),
  frostAxe: S(`
    <circle cx="19" cy="10" r="10" fill="#7fd1ff" opacity="0.16"/>${HAFT}
    <path d="M14 4c4-2 9-2 13 1-1 4-3 7-6 9l-7-7z" fill="#bfe6f5" stroke="#5a8ea6" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M19 11l4-4" stroke="#eaf8ff" stroke-width="1.4" opacity="0.9"/>
    <path d="M24 3l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" fill="#ffffff" opacity="0.9"/>`),
  sunfangBlade: S(`
    <circle cx="16" cy="12" r="10" fill="#ffb036" opacity="0.15"/>
    <path d="M16 2l3 3v15l-3 3-3-3V5z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="16" y1="4.5" x2="16" y2="20" stroke="#fff2b0" stroke-width="1.1" opacity="0.9"/>
    <path d="M11 6c-1.5 2-1.5 4 0 6M21 6c1.5 2 1.5 4 0 6" fill="none" stroke="#ff8a2a" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="8.5" y="22" width="15" height="3" rx="1.5" fill="#b8452e" stroke="#6e2317" stroke-width="1.3"/>
    <rect x="14.4" y="25" width="3.2" height="5" rx="1.4" fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.2"/>`),
  snapjawMaul: S(`${HAFT}
    <rect x="13" y="2.5" width="14" height="10" rx="3.5" transform="rotate(10 20 7.5)"
      fill="#4a7a3a" stroke="#2d5222" stroke-width="1.6"/>
    <path d="M15 11l2-2.6 2 2.2 2-2.6 2 2.2 2-2.6" fill="none" stroke="#f0ead0" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="24" cy="5.5" r="1.2" fill="#c9e05a"/>`),
  woodShield: S(`
    <path d="M16 3l10 3v9c0 7-4 11-10 14C10 26 6 22 6 15V6z"
      fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M11 4.5v21M16 3v26M21 4.5v21" stroke="${WOOD_D}" stroke-width="1.1" opacity="0.55"/>
    <circle cx="16" cy="14" r="3.2" fill="${IRON}" stroke="${IRON_D}" stroke-width="1.3"/>`),
  ironShield: S(`
    <path d="M16 3l10 3v9c0 7-4 11-10 14C10 26 6 22 6 15V6z"
      fill="${IRON}" stroke="${IRON_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 3v26M7.5 13h17" stroke="${IRON_D}" stroke-width="1.2" opacity="0.7"/>
    <circle cx="16" cy="13" r="2.6" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/>`),
  graveplate: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="#4c4258" stroke="#2a2434" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 7v20" stroke="#2a2434" stroke-width="1.3" opacity="0.7"/>
    <path d="M12 13h3v3h-3zM17 13h3v3h-3z" fill="none" stroke="#8a7fa8" stroke-width="1.1" opacity="0.8"/>
    <circle cx="16" cy="20" r="2" fill="#bfc8ff" opacity="0.8"/>`),
  iceplate: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="#bfe6f5" stroke="#5a8ea6" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 7v20M10 15l6 3 6-3" fill="none" stroke="#5a8ea6" stroke-width="1.2" opacity="0.7"/>
    <path d="M16 12l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#ffffff" opacity="0.9"/>`),
  widowShroud: S(`
    <path d="M10 5l6 2 6-2 5 5-3 4v13H8V14L5 10z"
      fill="#2e3428" stroke="#161a12" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 12h16M9 18h14M10 24h12M16 7v20M11 8c2 6 2 12 0 18M21 8c-2 6-2 12 0 18"
      fill="none" stroke="#aab4a0" stroke-width="0.9" opacity="0.65"/>
    <circle cx="16" cy="15" r="1.6" fill="#8aff3a" opacity="0.9"/>`),
  pantherBoots: boot('#22222c', '#0e0e14',
    `<circle cx="13" cy="9" r="1.1" fill="#7fff4a"/><circle cx="17" cy="9" r="1.1" fill="#7fff4a"/>`),
  mireBoots: boot('#5a6b3a', '#37421f',
    `<path d="M12 27c0 1.6-2.4 1.6-2.4 0 0-1 1.2-2.4 1.2-2.4s1.2 1.4 1.2 2.4z" fill="#8aa04f"/>`),
  ironhornCrown: S(`
    <path d="M6 22l2-11 5 5 3-8 3 8 5-5 2 11z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M7 22h18v4H7z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.4"/>
    <path d="M5 10C3 7 3 4.5 4.5 2.5c2 .8 3.4 2.6 4 5M27 10c2-3 2-5.5.5-7.5-2 .8-3.4 2.6-4 5"
      fill="#e8e0cc" stroke="#a89f88" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="16" cy="24" r="1.3" fill="#b8452e"/>`),
  shadeAmulet: S(`
    <path d="M9 4c2 3 4 4.5 7 4.5S21 7 23 4" fill="none" stroke="${LEATHER_D}" stroke-width="1.8"/>
    <circle cx="16" cy="17" r="8" fill="#3a3448" stroke="#1e1a28" stroke-width="1.6"/>
    <path d="M12.5 15c1-2.6 2.2-4 3.5-4s2.5 1.4 3.5 4c0 3-1 5.5-3.5 7-2.5-1.5-3.5-4-3.5-7z" fill="#bfc8ff" opacity="0.85"/>
    <circle cx="14.6" cy="15.5" r="0.9" fill="#1e1a28"/><circle cx="17.4" cy="15.5" r="0.9" fill="#1e1a28"/>`),
  stormcloak: S(`
    <path d="M16 3C9 6 6 12 6 20c0 4 1.5 7 3 9 2-4 4.5-6 7-6s5 2 7 6c1.5-2 3-5 3-9 0-8-3-14-10-17z"
      fill="#5c6a8a" stroke="#333d54" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 3v20" stroke="#333d54" stroke-width="1.2" opacity="0.6"/>
    <path d="M19 10l-3 5h3l-4 7 1-5h-3l3-7z" fill="#ffe94a" stroke="#b8960a" stroke-width="0.8"/>`),
  frostMantle: S(`
    <path d="M16 3C9 6 6 12 6 20c0 4 1.5 7 3 9 2-4 4.5-6 7-6s5 2 7 6c1.5-2 3-5 3-9 0-8-3-14-10-17z"
      fill="#dfeef7" stroke="#8fb0c4" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 10c2.5 1.6 5.3 2.4 8 2.4s5.5-.8 8-2.4" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M16 16l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#8fd8ff"/>`),
  bedroll: S(`
    <rect x="4" y="12" width="24" height="10" rx="5" fill="#8a9a5a" stroke="#5c6a38" stroke-width="1.6"/>
    <path d="M24 12c2.8 0 4 2.2 4 5s-1.2 5-4 5z" fill="#a8b872" stroke="#5c6a38" stroke-width="1.4"/>
    <path d="M24 13.5c1.6 1 1.6 6 0 7M21 12v10" stroke="#5c6a38" stroke-width="1.2" opacity="0.7"/>
    <path d="M9 12v10M9 24v2M9 8v4" stroke="${LEATHER_D}" stroke-width="1.8" stroke-linecap="round"/>`),
  lining: S(`
    <path d="M10 6l6 2 6-2 4 4-2 3v13H8V13l-2-3z"
      fill="#d9cba8" stroke="#a8955f" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 12l16 8M8 20l16-8M8 16h16M16 8v18" stroke="#a8955f" stroke-width="1" opacity="0.6"/>`),
  bogscaleLining: S(`
    <path d="M10 6l6 2 6-2 4 4-2 3v13H8V13l-2-3z"
      fill="#5a6b3a" stroke="#37421f" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M9 13c2 2.4 4.6 2.4 7 0 2.4 2.4 5 2.4 7 0M9 18c2 2.4 4.6 2.4 7 0 2.4 2.4 5 2.4 7 0M9 23c2 2.4 4.6 2.4 7 0 2.4 2.4 5 2.4 7 0"
      fill="none" stroke="#8aa04f" stroke-width="1.2" opacity="0.85"/>`),
  socks: S(`
    <path d="M7 4h7v10c3 .8 5.2 2.4 6 5.2.6 2-.6 3.3-2.6 3.3H9.6C8 22.5 7 21.5 7 20z"
      fill="#d9cba8" stroke="#a8955f" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M7 8h7" stroke="#a8955f" stroke-width="1.6"/>
    <path d="M15 11h7v10c3 .8 5.2 2.4 6 5.2.6 2-.6 3.3-2.6 3.3H17.6c-1.6 0-2.6-1-2.6-2.5z"
      fill="#c9b88a" stroke="#8f7c46" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M15 15h7" stroke="#8f7c46" stroke-width="1.6"/>`),
  spiritLantern: S(`
    <circle cx="16" cy="17" r="11" fill="#bfc8ff" opacity="0.15"/>
    <path d="M13 5h6M16 2.5V5" stroke="${IRON_D}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 8h12l-1.6 14c-.2 1.4-1 2-2.4 2h-4c-1.4 0-2.2-.6-2.4-2z"
      fill="#2e3440" stroke="#171b22" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 9.5h8l-1.2 12h-5.6z" fill="#bfc8ff" opacity="0.9"/>
    <circle cx="16" cy="15.5" r="2.2" fill="#ffffff"/>`),
  saddle: S(`
    <path d="M5 14c3-5 8-7.5 11-7.5S24 9 27 14c1 1.8.4 3-1.4 3.4-2.6.6-4.6 2.2-5.6 4.6h-8c-1-2.4-3-4-5.6-4.6C4.6 17 4 15.8 5 14z"
      fill="${LEATHER}" stroke="${LEATHER_D}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 6.5V22" stroke="${LEATHER_D}" stroke-width="1.2" opacity="0.6"/>
    <path d="M12 22v4.5M20 22v4.5" stroke="${LEATHER_D}" stroke-width="2" stroke-linecap="round"/>
    <rect x="10.6" y="26" width="3" height="2.4" rx="0.8" fill="${IRON}" stroke="${IRON_D}" stroke-width="1"/>
    <rect x="18.6" y="26" width="3" height="2.4" rx="0.8" fill="${IRON}" stroke="${IRON_D}" stroke-width="1"/>`),
  swimming: S(`
    <circle cx="21" cy="8" r="3" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.3"/>
    <path d="M8 13c4-3.5 9-3.5 12-1" fill="none" stroke="${SKIN}" stroke-width="3" stroke-linecap="round"/>
    <path d="M4 20c3 2.4 6 2.4 9 0s6-2.4 9 0 5 2.2 6 1.6M4 26c3 2.4 6 2.4 9 0s6-2.4 9 0 5 2.2 6 1.6"
      fill="none" stroke="#5fa8e0" stroke-width="2.2" stroke-linecap="round"/>`),
};

// nests: the same twig-ring roost with an egg tinted per home biome
const nestIcon = (egg, eggD) => S(`
  <ellipse cx="16" cy="21" rx="12" ry="7" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="1.6"/>
  <ellipse cx="16" cy="19" rx="8.5" ry="4.5" fill="#5f3d1c"/>
  <path d="M5 17c3-2 5-2 8-1M27 17c-3-2-5-2-8-1M8 25c2 1.4 4 2 8 2s6-.6 8-2"
    fill="none" stroke="#7c5426" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse cx="16" cy="16" rx="4" ry="5" fill="${egg}" stroke="${eggD}" stroke-width="1.3"/>
  <circle cx="14.6" cy="14" r="1.1" fill="#ffffff" opacity="0.7"/>`);
ITEM_ICONS.desertNest = nestIcon('#f2dfa8', '#c0a860');
ITEM_ICONS.highlandNest = nestIcon('#cfe0c0', '#8fa878');
ITEM_ICONS.frozenNest = nestIcon('#d8ecf7', '#8fb0c4');
// placeable camp items reuse their building icons
ITEM_ICONS.storageChest = ITEM_ICONS.chest;
ITEM_ICONS.logBoat = ITEM_ICONS.boat;
ITEM_ICONS.guardTower = ITEM_ICONS.tower;
ITEM_ICONS.graveyardItem = ITEM_ICONS.grave;

// ===== resource icons (drawn, not emoji) =====
export const RES_SVG = {
  // Ethereal Essence: a glowing green orb wreathed in floating motes of light —
  // raw arcane power of the deep woods, not a bottled potion
  essence: S(`
    <circle cx="16" cy="16" r="10" fill="#3aa85f" opacity="0.28"/>
    <circle cx="16" cy="16" r="7.2" fill="#5fe07f" stroke="#2a8a45" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="4" fill="#c8ffd8" opacity="0.9"/>
    <circle cx="13.6" cy="13.6" r="1.6" fill="#ffffff" opacity="0.85"/>
    <path d="M16 4.5l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#d8ffe4"/>
    <circle cx="25" cy="12" r="1.5" fill="#8ff0a8"/>
    <circle cx="7"  cy="20" r="1.3" fill="#8ff0a8"/>
    <circle cx="24" cy="23" r="1.1" fill="#b8ffcc" opacity="0.9"/>
    <circle cx="9"  cy="9"  r="1"   fill="#b8ffcc" opacity="0.8"/>`),
  // a proper tanned hide instead of the brown square emoji
  hide: S(`
    <path d="M16 4c2.8 0 4.2 1.8 6.6 2s4.8 1.6 4.4 4.4c-.3 2.2 1.2 3.4 1 5.6-.2 2.4-2 3-2.2 5.2-.2 2.4 .6 4.8-1.8 6-2.2 1.1-3.6-.4-6-.2-1.4.1-2.6.1-4 0-2.4-.2-3.8 1.3-6 .2-2.4-1.2-1.6-3.6-1.8-6-.2-2.2-2-2.8-2.2-5.2-.2-2.2 1.3-3.4 1-5.6-.4-2.8 2-4.2 4.4-4.4S13.2 4 16 4z"
      fill="#b5824a" stroke="#7c5426" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M11 11c3 2 7 2 10 0M10 17c4 2.5 8 2.5 12 0M11.5 23c3 1.8 6 1.8 9 0"
      fill="none" stroke="#8a5f33" stroke-width="1.1" opacity="0.6"/>`),
};

export function resIcon(key, fallback = '') {
  const svg = RES_SVG[key];
  return svg ? `<span class="item-icon">${svg}</span>` : fallback;
}

// Inline-HTML icon for an item; falls back to the emoji for anything
// without a custom vector (spells, stat tracks, camp buildings…).
export function itemIcon(entry) {
  const svg = ITEM_ICONS[entry?.id];
  return svg ? `<span class="item-icon">${svg}</span>` : (entry?.icon ?? '');
}

// Painted class-skill/ability art lives in assets/skills/<id>.webp. If the file
// is missing the <img> errors out and we fall back to the skill's emoji glyph.
export function skillArt(id, emoji = '') {
  return `<span class="skill-art"><img src="assets/skills/${id}.webp" alt="" loading="lazy"
    onerror="this.remove();this.parentNode.classList.add('noart')"><span class="art-glyph">${emoji}</span></span>`;
}
