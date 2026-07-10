// ---- Modal panels: upgrade shop (grouped tabs), character sheet with
// equipment slots, bestiary of discovered creatures ----

import { SHOP_GROUPS, SLOTS, SLOT_LABELS, ENEMY_TYPES, ITEMS, SPELLS,
         STAT_TRACKS, MOBA_BUILDINGS, CAMP_BUILDINGS, RES_ICONS, CONSUMABLES,
         MAX_SPELL_SLOTS, fmtResource, itemById, spellById, costFor } from './config.js';

const NEED_NAMES = { tent: 'Hide Tent', cabin: 'Wooden Cabin', furnace: 'Stone Furnace' };
import { itemIcon } from './icons.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);

export class Panels {
  constructor(hooks) {
    // hooks: { onPauseChange(paused), onBuyItem(id), onBuySpell(id),
    //          onEquip(id), onUnequip(slot), onToggleSpell(id) }
    this.hooks = hooks;
    this.open = null; // 'shop' | 'character' | 'bestiary'
    this.shopTab = SHOP_GROUPS[0].key;
    this.player = null;
    this.moba = null; // set in MOBA mode → adds the Base tab
    this.camp = null; // set in survival → adds the Camp tab + era gating
    this.discovered = new Set();

    $('shop-btn').addEventListener('click', () => this.toggle('shop'));
    $('char-btn').addEventListener('click', () => this.toggle('character'));
    $('bestiary-btn').addEventListener('click', () => this.toggle('bestiary'));
    $('settings-btn').addEventListener('click', () => this.toggle('settings'));
    $('help-btn').addEventListener('click', () => this.toggle('help'));
    document.querySelectorAll('.panel-close').forEach(btn =>
      btn.addEventListener('click', () => this.toggle(null)));
  }

  toggle(name) {
    if (this.open === name) name = null;
    this.open = name;
    audio.sfx('click', 0.4);
    $('shop').classList.toggle('hidden', name !== 'shop');
    $('character').classList.toggle('hidden', name !== 'character');
    $('bestiary').classList.toggle('hidden', name !== 'bestiary');
    $('settings').classList.toggle('hidden', name !== 'settings');
    $('basepanel').classList.toggle('hidden', name !== 'base');
    $('chestpanel').classList.toggle('hidden', name !== 'chest');
    $('helppanel').classList.toggle('hidden', name !== 'help');
    if (name === 'shop') this.renderShop();
    if (name === 'character') this.renderCharacter();
    if (name === 'bestiary') this.renderBestiary();
    if (name === 'base') this.renderBase();
    if (name === 'chest') this.renderChest();
    if (name === 'shop') $('shop-btn').classList.remove('pulse');
    this.hooks.onPauseChange(name !== null);
  }

  refresh() {
    if (this.open === 'shop') this.renderShop();
    if (this.open === 'character') this.renderCharacter();
    if (this.open === 'bestiary') this.renderBestiary();
    if (this.open === 'base') this.renderBase();
    if (this.open === 'chest') this.renderChest();
  }

  _resLine() {
    const p = this.player;
    return `🍖 ${fmtResource(p.meat)}  🪵 ${fmtResource(p.wood)}  🪨 ${fmtResource(p.stone)}  🟫 ${fmtResource(p.hide)}  🔩 ${fmtResource(p.iron)}`;
  }

  _costStr(cost) {
    if (!cost) return 'free';
    return Object.entries(cost).map(([k, v]) => `${fmtResource(v)} ${RES_ICONS[k] ?? k}`).join(' + ');
  }

  _affordable(cost) {
    return Object.entries(cost).every(([k, v]) => this.player[k] >= v);
  }

  // ---------- shop ----------
  renderShop() {
    const p = this.player;
    $('shop-res').textContent =
      `🍖 ${fmtResource(p.meat)}  🪵 ${fmtResource(p.wood)}  🪨 ${fmtResource(p.stone)}  🟫 ${fmtResource(p.hide)}  🔩 ${fmtResource(p.iron)}`;

    // tabs (+ Base tab in MOBA, + Camp tab in survival)
    const groups = this.moba
      ? [...SHOP_GROUPS, { key: 'base', label: '🏰 Base' }]
      : this.camp
        ? [{ key: 'camp', label: '🏕️ Camp' }, ...SHOP_GROUPS, { key: 'supplies', label: '🧪 Supplies' }]
        : SHOP_GROUPS;
    const tabs = $('shop-tabs');
    tabs.innerHTML = '';
    for (const group of groups) {
      const b = document.createElement('button');
      b.className = 'tab' + (group.key === this.shopTab ? ' active' : '');
      b.textContent = group.label;
      b.addEventListener('click', () => { this.shopTab = group.key; this.renderShop(); });
      tabs.appendChild(b);
    }

    const group = SHOP_GROUPS.find(g => g.key === this.shopTab);
    const isSpells = this.shopTab === 'spells';
    const wrap = $('shop-items');
    wrap.innerHTML = '';

    if (this.shopTab === 'training') {
      this._renderTraining(wrap);
      return;
    }
    if (this.shopTab === 'base') {
      this._renderBase(wrap);
      return;
    }
    if (this.shopTab === 'camp') {
      this._renderCamp(wrap);
      return;
    }
    if (this.shopTab === 'supplies') {
      this._renderSupplies(wrap);
      return;
    }

    // sort by unlock level, then group under a level divider so the whole
    // progression reads top-to-bottom at a glance
    const entries = [...group.items()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    let curLevel = null;
    for (const entry of entries) {
      if (entry.level !== curLevel) {
        curLevel = entry.level;
        const reached = p.level >= curLevel;
        const div = document.createElement('div');
        div.className = 'level-band' + (reached ? '' : ' locked');
        div.innerHTML = `<span class="lb-tier">Lv ${curLevel}</span>` +
          (reached ? '<span class="lb-note">unlocked</span>'
                   : `<span class="lb-note">reach level ${curLevel}</span>`);
        wrap.appendChild(div);
      }

      const owned = isSpells ? p.spellsOwned.has(entry.id) : p.hasItem(entry.id);
      const levelLocked = p.level < entry.level;
      // era gating: some gear needs a camp building (survival only)
      const needMissing = entry.needs && this.camp && !this.camp.has(entry.needs);
      const cost = costFor(entry.cost, !!this.moba);
      const affordable = cost && this._affordable(cost);

      const card = document.createElement('div');
      card.className = 'card' + (owned ? ' owned' : (levelLocked || needMissing) ? ' locked' : affordable ? ' buyable' : ' expensive');

      let status;
      if (owned) status = '<span class="tag ok">✔ Owned</span>';
      else if (levelLocked) status = `<span class="tag">🔒 Lv ${entry.level}</span>`;
      else if (needMissing) status = `<span class="tag">🏕️ Needs ${NEED_NAMES[entry.needs] ?? entry.needs}</span>`;
      else status = `<button class="buy-btn" data-id="${entry.id}">Buy — ${this._costStr(cost)}</button>`;

      const slotTag = isSpells ? '📖 spell' : SLOT_LABELS[entry.slot].toLowerCase();
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(entry)}</span>
          <span class="name">${entry.name}</span><span class="lv">${slotTag}</span></div>
        <div class="desc">${entry.desc}</div>
        <div class="card-foot">${status}</div>`;
      wrap.appendChild(card);
    }

    wrap.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () =>
        isSpells ? this.hooks.onBuySpell(btn.dataset.id) : this.hooks.onBuyItem(btn.dataset.id));
    });
  }

  // Consumables: repeatable purchases, used in the field with F / G.
  _renderSupplies(wrap) {
    for (const c of CONSUMABLES) {
      const owned = this.player.consumables?.[c.id] ?? 0;
      const affordable = this._affordable(c.cost);
      const card = document.createElement('div');
      card.className = 'card' + (affordable ? ' buyable' : ' expensive');
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(c)}</span>
          <span class="name">${c.name}</span><span class="lv">carried ×${owned} · key ${c.key}</span></div>
        <div class="desc">${c.desc}</div>
        <div class="card-foot"><button class="buy-btn" data-id="${c.id}">Buy — ${this._costStr(c.cost)}</button></div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onBuyConsumable?.(btn.dataset.id)));
  }

  // brief green pulse on the card that was just purchased
  flashCard(name) {
    for (const el of document.querySelectorAll('.card .name')) {
      if (el.textContent === name) {
        const card = el.closest('.card');
        card.classList.remove('just-bought');
        void card.offsetWidth;
        card.classList.add('just-bought');
        return;
      }
    }
  }

  // Trainable stat tracks: 10 tiers, tier N needs player level N.
  _renderTraining(wrap) {
    const p = this.player;
    for (const track of STAT_TRACKS) {
      const tier = p.stats[track.id];
      const maxed = tier >= track.max;
      const nextTier = tier + 1;
      const cost = maxed ? null : track.cost(nextTier);
      const levelLocked = !maxed && p.level < nextTier;
      const affordable = cost && this._affordable(cost);

      const card = document.createElement('div');
      card.className = 'card' + (maxed ? ' owned' : levelLocked ? ' locked' : affordable ? ' buyable' : ' expensive');

      let status;
      if (maxed) status = '<span class="tag ok">Fully trained</span>';
      else if (levelLocked) status = `<span class="tag">Level ${nextTier} needs player Lv ${nextTier}</span>`;
      else status = `<button class="buy-btn" data-id="${track.id}">Train to ${nextTier} — ${this._costStr(cost)}</button>`;

      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(track)}</span>
          <span class="name">${track.name}</span><span class="lv">${tier}/${track.max}</span></div>
        <div class="desc">${track.desc}</div>
        <div class="card-foot">${status}</div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hooks.onBuyStat(btn.dataset.id));
    });
  }

  // ---------- character / equipment ----------
  renderCharacter() {
    const p = this.player;

    // equipment slots
    const slotsEl = $('equip-slots');
    slotsEl.innerHTML = '';
    for (const slot of SLOTS) {
      const id = p.equipment[slot];
      const item = id ? itemById(id) : null;
      const div = document.createElement('div');
      div.className = 'equip-slot' + (item ? ' filled' : '');
      div.innerHTML = `
        <span class="slot-label">${SLOT_LABELS[slot]}</span>
        <span class="slot-item">${item ? `${itemIcon(item)} ${item.name}` : '<i>empty</i>'}</span>
        ${item && !(slot === 'weapon' && id === 'fists')
          ? `<button class="unequip-btn" data-slot="${slot}">✕</button>` : ''}`;
      slotsEl.appendChild(div);
    }
    slotsEl.querySelectorAll('.unequip-btn').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onUnequip(btn.dataset.slot)));

    // stats summary
    $('char-stats').innerHTML =
      `❤️ ${Math.ceil(p.hp)}/${p.maxHp} &nbsp; 🏃 ${Math.round(p.speed * 10) / 10} &nbsp; ` +
      (p.weapon.kind === 'bow' ? `🏹 ${p.weapon.dmg} dmg` : `⚔️ ${p.weapon.dmg} dmg`);

    // inventory (owned, unequipped items)
    const inv = $('inventory');
    inv.innerHTML = '';
    const unequipped = [...p.itemsOwned].filter(id => !Object.values(p.equipment).includes(id));
    if (!unequipped.length) inv.innerHTML = '<div class="empty-note">Nothing in your pack — everything is equipped.</div>';
    for (const id of unequipped) {
      const item = itemById(id);
      const div = document.createElement('button');
      div.className = 'inv-item';
      div.innerHTML = `${itemIcon(item)} <b>${item.name}</b> <span class="lv">${SLOT_LABELS[item.slot]}</span>`;
      div.title = item.desc;
      div.addEventListener('click', () => this.hooks.onEquip(id));
      inv.appendChild(div);
    }

    // spellbook
    const book = $('spellbook');
    book.innerHTML = '';
    if (!p.spellsOwned.size) book.innerHTML = '<div class="empty-note">No spells learned yet — see the Spells tab in the shop.</div>';
    for (const id of p.spellsOwned) {
      const spell = spellById(id);
      const slotIdx = p.spellSlots.indexOf(id);
      const div = document.createElement('button');
      div.className = 'inv-item' + (slotIdx >= 0 ? ' slotted' : '');
      div.innerHTML = `${itemIcon(spell)} <b>${spell.name}</b> <span class="lv">${slotIdx >= 0 ? `key ${slotIdx + 1}` : 'not slotted'}</span>`;
      div.title = spell.desc + ` (cooldown ${spell.cd}s)`;
      div.addEventListener('click', () => this.hooks.onToggleSpell(id));
      book.appendChild(div);
    }
    $('spellbook-note').textContent = `${p.spellSlots.length}/${MAX_SPELL_SLOTS} spell slots used — click a spell to slot/unslot it.`;
  }

  // MOBA base building: per-lane dens & towers, plus global upgrades.
  _renderBase(wrap) {
    const team = this.hooks.mobaTeam?.() ?? 'player';
    const entries = [];
    for (const def of MOBA_BUILDINGS) {
      if (def.perLane) for (const lane of ['mid', 'top', 'bot']) entries.push({ def, lane });
      else entries.push({ def, lane: null });
    }
    for (const { def, lane } of entries) {
      const info = this.moba.buildingInfo(team, def.id, lane);
      const affordable = info.cost && this._affordable(info.cost);
      const card = document.createElement('div');
      card.className = 'card' + (info.maxed ? ' owned' : affordable ? ' buyable' : ' expensive');
      const label = lane ? `${def.name} — ${lane.toUpperCase()}` : def.name;
      const status = info.maxed
        ? '<span class="tag ok">Fully built</span>'
        : `<button class="buy-btn" data-id="${def.id}" data-lane="${lane || ''}">` +
          `${info.level === 0 ? 'Build' : 'Upgrade to ' + (info.level + 1)} — ${this._costStr(info.cost)}</button>`;
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(def)}</span>
          <span class="name">${label}</span><span class="lv">${info.level}/${def.max}</span></div>
        <div class="desc">${def.desc}</div>
        <div class="card-foot">${status}</div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () =>
        this.hooks.onBuild(btn.dataset.id, btn.dataset.lane || null));
    });
  }

  // Survival camp: home upgrades through the ages + utility buildings + chest.
  _campCard(def) {
    const p = this.player, camp = this.camp;
    const info = camp.buildingInfo(def.id);
    const levelLocked = !info.maxed && p.level < info.reqLevel;
    const affordable = info.cost && this._affordable(info.cost);
    const card = document.createElement('div');
    card.className = 'card' + (info.maxed ? ' owned' : levelLocked ? ' locked' : affordable ? ' buyable' : ' expensive');
    let status;
    if (info.maxed) status = '<span class="tag ok">Built</span>';
    else if (levelLocked) status = `<span class="tag">Unlocks at Lv ${info.reqLevel}</span>`;
    else status = `<button class="camp-btn" data-id="${def.id}">` +
      `${info.level === 0 ? 'Build' : 'Upgrade to'} ${info.nextName} — ${this._costStr(info.cost)}</button>`;
    card.innerHTML = `
      <div class="card-head"><span class="icon">${itemIcon(def)}</span>
        <span class="name">${info.level > 0 ? info.name : (info.nextName ?? info.name)}</span>
        <span class="lv">${info.level}/${def.max}</span></div>
      <div class="desc">${info.desc}</div>
      <div class="card-foot">${status}</div>`;
    return card;
  }

  _wireCampButtons(wrap) {
    wrap.querySelectorAll('.camp-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hooks.onCampBuild(btn.dataset.id));
    });
  }

  // Upgrades → Camp tab: the utility buildings. The home itself (and the
  // chest) are upgraded/used in person via their own E modals.
  _renderCamp(wrap) {
    for (const def of CAMP_BUILDINGS) {
      if (def.id === 'home') continue;
      wrap.appendChild(this._campCard(def));
    }
    this._wireCampButtons(wrap);
  }

  // ---------- E at your home: the base modal (era + home upgrade) ----------
  renderBase() {
    const camp = this.camp;
    if (!camp) return;
    $('base-res').textContent = this._resLine();
    const wrap = $('base-items');
    wrap.innerHTML = '';
    const era = document.createElement('div');
    era.className = 'card owned';
    era.style.gridColumn = '1 / -1';
    era.innerHTML = `<div class="card-head"><span class="icon">${itemIcon({ id: 'home' })}</span>
      <span class="name">Current era: ${camp.era()}</span></div>
      <div class="desc">Upgrade your home to advance through the ages and unlock new gear.</div>`;
    wrap.appendChild(era);
    wrap.appendChild(this._campCard(CAMP_BUILDINGS.find(d => d.id === 'home')));
    this._wireCampButtons(wrap);
  }

  // ---------- E at the chest: storage modal ----------
  renderChest() {
    const camp = this.camp;
    if (!camp) return;
    $('chest-res').textContent = this._resLine();
    const wrap = $('chest-items');
    wrap.innerHTML = '';
    const chest = document.createElement('div');
    chest.className = 'card owned';
    chest.style.gridColumn = '1 / -1';
    chest.innerHTML = `<div class="card-head"><span class="icon">${itemIcon({ id: 'chest' })}</span>
      <span class="name">Stored</span>
      <span class="lv">🍖 ${fmtResource(camp.storage.meat)} · 🪵 ${fmtResource(camp.storage.wood)} · 🪨 ${fmtResource(camp.storage.stone)} · 🟫 ${fmtResource(camp.storage.hide)} · 🔩 ${fmtResource(camp.storage.iron)}</span></div>
      <div class="desc">Whatever is stored here survives your death.</div>
      <div class="card-foot">
        <button class="buy-btn" data-chest="deposit">Deposit all</button>
        <button class="buy-btn" data-chest="withdraw" style="margin-top:6px">Withdraw all</button>
      </div>`;
    wrap.appendChild(chest);
    wrap.querySelectorAll('[data-chest]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.chest === 'deposit') camp.depositAll();
        else camp.withdrawAll();
        this.hooks.onChestChange?.(); // co-op: keep the partner's chest in sync
        this.renderChest();
      });
    });
  }

  // ---------- bestiary ----------
  discover(type) { this.discovered.add(type); }

  renderBestiary() {
    const wrap = $('bestiary-items');
    wrap.innerHTML = '';
    for (const [type, cfg] of Object.entries(ENEMY_TYPES)) {
      const known = this.discovered.has(type);
      const card = document.createElement('div');
      card.className = 'card' + (known ? '' : ' locked');
      card.innerHTML = known
        ? `<div class="card-head"><span class="icon">${cfg.icon}</span><span class="name">${cfg.name}</span></div>
           <div class="desc">❤️ ${cfg.hp} · ⚔️ ${cfg.dmg} · ⭐ ${cfg.xp} XP · 🍖 ${cfg.meat}</div>`
        : `<div class="card-head"><span class="icon">❓</span><span class="name">???</span></div>
           <div class="desc">Not discovered yet. Travel further north…</div>`;
      wrap.appendChild(card);
    }
  }
}
