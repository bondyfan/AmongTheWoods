// ---- Modal panels: upgrade shop (grouped tabs), character sheet with
// equipment slots, bestiary of discovered creatures ----

import { SHOP_GROUPS, SMITH_GROUPS, questFor, repeatableQuestFor, questXpFor,
         QUEST_CATEGORY_LABELS, QUESTS_PER_BIOME, BIOMES, SLOTS, SLOT_LABELS, ENEMY_TYPES, ITEMS, SPELLS,
         STAT_TRACKS, MOBA_BUILDINGS, CAMP_BUILDINGS, RES_ICONS, RESOURCES, CONSUMABLES,
         MAX_SPELL_SLOTS, fmtResource, itemById, spellById, costFor, trainingLevelFor,
         TALENT_TREES, talentPointsForLevel } from './config.js';

const NEED_NAMES = { tent: 'Hide Tent', cabin: 'Wooden Cabin', furnace: 'Stone Furnace',
  keep: 'Medieval Keep', runic: 'Runic Hall', mountain: 'Mountain Fortress',
  spirit: 'Spirit Bastion', primal: 'Primal Citadel', frosthold: 'Frosthold' };
import { itemIcon, resIcon } from './icons.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);

export class Panels {
  constructor(hooks) {
    // hooks: { onPauseChange(paused), onBuyItem(id), onBuySpell(id),
    //          onEquip(id), onUnequip(slot), onToggleSpell(id) }
    this.hooks = hooks;
    this.openSet = new Set();
    this.shopTab = SHOP_GROUPS[0].key;
    this.smithTab = 'quests';
    this.player = null;
    this.moba = null; // set in MOBA mode → adds the Base tab
    this.camp = null; // set in survival → adds the Camp tab + era gating
    this.discovered = new Set();

    $('shop-btn').addEventListener('click', () => this.toggle('shop'));
    $('char-btn').addEventListener('click', () => this.toggle('character'));
    $('bestiary-btn').addEventListener('click', () => this.toggle('bestiary'));
    $('settings-btn').addEventListener('click', () => this.toggle('settings'));
    $('help-btn').addEventListener('click', () => this.toggle('help'));
    // ✕ closes just ITS panel (Escape still closes everything)
    document.querySelectorAll('.panel-close').forEach(btn =>
      btn.addEventListener('click', () => {
        const panelId = btn.closest('.panel').id;
        const name = Object.entries(Panels.PANEL_IDS).find(([, id]) => id === panelId)?.[0];
        if (name) this.toggle(name);
      }));
    this._makeDraggable();
    // armory sections can collapse — hide one half and the modal slims down
    for (const [btn, sec] of [['toggle-doll', 'armory-left'], ['toggle-inv', 'armory-right']]) {
      $(btn).addEventListener('click', () => {
        const other = btn === 'toggle-doll' ? 'toggle-inv' : 'toggle-doll';
        if ($(btn).classList.contains('on') && !$(other).classList.contains('on')) return; // keep one
        $(btn).classList.toggle('on');
        $(sec).style.display = $(btn).classList.contains('on') ? '' : 'none';
        $('character').classList.toggle('slim',
          !$('toggle-doll').classList.contains('on') || !$('toggle-inv').classList.contains('on'));
      });
    }
  }

  // drag any panel by its header so several can sit side by side
  _makeDraggable() {
    document.querySelectorAll('.panel').forEach(panel => {
      const head = panel.querySelector('.panel-head');
      if (!head) return;
      head.style.cursor = 'move';
      head.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        const rect = panel.getBoundingClientRect();
        const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
        panel.style.transform = 'none';
        const move = (ev) => {
          panel.style.left = Math.max(0, ev.clientX - ox) + 'px';
          panel.style.top = Math.max(0, ev.clientY - oy) + 'px';
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        move(e);
      });
    });
  }

  // panels open INDEPENDENTLY — inventory + upgrades + armory can all be
  // up at once (that's how you drag loot around like in WoW)
  static PANEL_IDS = {
    shop: 'shop', character: 'character', bestiary: 'bestiary', smith: 'smith',
    settings: 'settings', base: 'basepanel', chest: 'chestpanel',
    help: 'helppanel',
  };

  get open() { return this.openSet.size ? [...this.openSet][this.openSet.size - 1] : null; }

  toggle(name) {
    audio.sfx('click', 0.4);
    if (name === null) { // close everything (Escape)
      this.openSet.clear();
    } else if (this.openSet.has(name)) {
      this.openSet.delete(name);
    } else {
      this.openSet.add(name);
    }
    for (const [key, id] of Object.entries(Panels.PANEL_IDS)) {
      $(id).classList.toggle('hidden', !this.openSet.has(key));
    }
    this._arrange();
    this.refresh();
    if (this.openSet.has('shop')) $('shop-btn').classList.remove('pulse');
    this.hooks.onPauseChange(this.openSet.size > 0);
  }

  // open panels fan out from the center of the screen so heads stay visible
  _arrange() {
    const open = [...this.openSet];
    open.forEach((key, i) => {
      const el = $(Panels.PANEL_IDS[key]);
      const off = i - (open.length - 1) / 2;
      el.style.transform = 'translate(-50%, -50%)';
      el.style.left = `calc(50% + ${Math.round(off * 90)}px)`;
      el.style.top = `calc(50% + ${Math.round(off * 44)}px)`;
    });
  }

  refresh() {
    if (this.openSet.has('shop')) this.renderShop();
    if (this.openSet.has('smith')) this.renderSmith();
    if (this.openSet.has('character')) this.renderCharacter();
    if (this.openSet.has('bestiary')) this.renderBestiary();
    if (this.openSet.has('base')) this.renderBase();
    if (this.openSet.has('chest')) this.renderChest();
  }

  _resLine() {
    const p = this.player;
    return RESOURCES.map(k => `${resIcon(k, RES_ICONS[k])} ${fmtResource(p[k])}`).join('  ');
  }

  _costStr(cost) {
    if (!cost) return 'free';
    return Object.entries(cost).map(([k, v]) =>
      `${fmtResource(v)} ${resIcon(k, RES_ICONS[k] ?? k)}`).join(' + ');
  }

  _affordable(cost) {
    return Object.entries(cost).every(([k, v]) => this.player[k] >= v);
  }

  // ---------- shop ----------
  renderShop() {
    const p = this.player;
    $('shop-res').innerHTML = this._resLine();

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
      // one level ahead you can already see the price and start saving;
      // deeper unlocks keep their cost a mystery
      if (levelLocked) status = entry.level === p.level + 1
        ? `<span class="tag">🔒 Lv ${entry.level} — ${this._costStr(cost)}</span>`
        : `<span class="tag">🔒 Lv ${entry.level}</span>`;
      else if (needMissing) status = `<span class="tag">🏕️ Needs ${NEED_NAMES[entry.needs] ?? entry.needs}</span>`;
      else if (owned && isSpells) status = '<span class="tag ok">✔ Owned</span>';
      else status = (owned ? '<span class="tag ok">✔ Owned</span> ' : '') +
        `<button class="buy-btn" data-id="${entry.id}">Buy${owned ? ' another' : ''} — ${this._costStr(cost)}</button>`;

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

  // ---------- blacksmith modal: quests + the forge's weapon/gear stock ----------
  renderSmith() {
    const p = this.player;
    $('smith-res').innerHTML = this._resLine();
    const tabs = $('smith-tabs');
    tabs.innerHTML = '';
    for (const group of SMITH_GROUPS) {
      const b = document.createElement('button');
      b.className = 'tab' + (group.key === this.smithTab ? ' active' : '');
      b.textContent = group.label;
      b.addEventListener('click', () => { this.smithTab = group.key; this.renderSmith(); });
      tabs.appendChild(b);
    }
    const wrap = $('smith-items');
    wrap.innerHTML = '';

    if (this.smithTab === 'quests') {
      this._renderSmithQuests(wrap);
      return;
    }

    const group = SMITH_GROUPS.find(g => g.key === this.smithTab);
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
      const owned = p.hasItem(entry.id);
      const levelLocked = p.level < entry.level;
      const needMissing = entry.needs && this.camp && !this.camp.has(entry.needs);
      const cost = costFor(entry.cost, false);
      const affordable = cost && this._affordable(cost);
      const card = document.createElement('div');
      card.className = 'card' + (owned ? ' owned' : (levelLocked || needMissing) ? ' locked' : affordable ? ' buyable' : ' expensive');
      let status;
      if (levelLocked) status = entry.level === p.level + 1
        ? `<span class="tag">🔒 Lv ${entry.level} — ${this._costStr(cost)}</span>`
        : `<span class="tag">🔒 Lv ${entry.level}</span>`;
      else if (needMissing) status = `<span class="tag">🏕️ Needs ${NEED_NAMES[entry.needs] ?? entry.needs}</span>`;
      else status = (owned ? '<span class="tag ok">✔ Owned</span> ' : '') +
        `<button class="buy-btn" data-id="${entry.id}">Forge${owned ? ' another' : ''} — ${this._costStr(cost)}</button>`;
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(entry)}</span>
          <span class="name">${entry.name}</span><span class="lv">${SLOT_LABELS[entry.slot].toLowerCase()}</span></div>
        <div class="desc">${entry.desc}</div>
        <div class="card-foot">${status}</div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onBuyItem(btn.dataset.id)));
  }

  _questCard(q, state, extra = '') {
    const div = document.createElement('div');
    div.className = 'quest-card ' + state;
    const mark = state === 'done' ? '✅ ' : state === 'active' ? '⏳ ' : state === 'locked' ? '🔒 ' : '';
    const reward = q.reward || {};
    const rewards = [`${Math.round(questXpFor(this.player.level) * (q.xpMult || 1))} XP`];
    if (reward.resources) rewards.push(Object.entries(reward.resources)
      .map(([k, v]) => `${fmtResource(v)} ${RES_ICONS[k] ?? k}`).join(' + '));
    if (reward.unlock) rewards.push(reward.unlock === 'broadheadArrows'
      ? 'Broadhead arrow recipe' : reward.unlock === 'fireArrows' ? 'Fire arrow recipe' : 'new recipe');
    if (reward.resident) rewards.push('new camp resident');
    if (reward.reveal) rewards.push('new routes on the map');
    if (reward.safeRoute) rewards.push('permanent travel bonus');
    if (reward.maxHp) rewards.push(`+${reward.maxHp} permanent health`);
    if (reward.questPower) rewards.push('+3% permanent weapon damage');
    if (reward.bagSlots) rewards.push(`+${reward.bagSlots} backpack slot`);
    div.innerHTML = `<div class="quest-category">${QUEST_CATEGORY_LABELS[q.category] ?? '📜 Quest'}</div>
      <h4>${mark}${q.name}</h4>
      <div class="q-desc">${q.desc}</div>
      <div class="q-meta">Reward: ${rewards.join(' · ')}</div>${extra}`;
    return div;
  }

  _renderSmithQuests(wrap) {
    const p = this.player;
    const bi = this.hooks.currentBiome?.() ?? 0;
    const done = p.questDone[bi] ?? 0;
    const head = document.createElement('div');
    head.className = 'level-band';
    head.innerHTML = `<span class="lb-tier">📜 ${done}/${QUESTS_PER_BIOME}</span>
      <span class="lb-note">story, people, expeditions and hunts — one active quest at a time</span>`;
    wrap.appendChild(head);
    for (let i = 0; i < QUESTS_PER_BIOME; i++) {
      const q = questFor(bi, i);
      if (i < done) { wrap.appendChild(this._questCard(q, 'done')); continue; }
      const isActive = p.quest && p.quest.biome === bi && p.quest.idx === i;
      if (isActive) {
        const pct = Math.min(100, Math.round((p.quest.count / p.quest.need) * 100));
        wrap.appendChild(this._questCard(q, 'active',
          `<div class="quest-bar"><div style="width:${pct}%"></div></div>
           <div class="q-meta">${p.quest.count}/${p.quest.need}</div>`));
      } else if (i === done) {
        const busy = !!p.quest;
        const card = this._questCard(q, '',
          busy ? '<div class="q-meta">Finish (or abandon) your current quest first.</div>'
               : '<div class="card-foot"><button class="buy-btn" data-quest="1">Accept</button></div>');
        card.querySelector('[data-quest]')?.addEventListener('click', () =>
          this.hooks.onAcceptQuest?.(bi, i));
        wrap.appendChild(card);
      } else {
        wrap.appendChild(this._questCard(q, 'locked'));
      }
    }

    const repeatHead = document.createElement('div');
    repeatHead.className = 'level-band';
    repeatHead.innerHTML = `<span class="lb-tier">♻️ Open contract</span>
      <span class="lb-note">repeatable work for resources and reduced XP</span>`;
    wrap.appendChild(repeatHead);
    const rq = p.quest?.repeatable && p.quest.biome === bi
      ? p.quest : repeatableQuestFor(bi, p.repeatableDone?.[bi] ?? 0);
    if (p.quest === rq) {
      const pct = Math.min(100, Math.round((rq.count / rq.need) * 100));
      wrap.appendChild(this._questCard(rq, 'active',
        `<div class="quest-bar"><div style="width:${pct}%"></div></div>
         <div class="q-meta">${fmtResource(rq.count)}/${fmtResource(rq.need)}</div>`));
    } else {
      const card = this._questCard(rq, '', p.quest
        ? '<div class="q-meta">Finish (or abandon) your current quest first.</div>'
        : '<div class="card-foot"><button class="buy-btn" data-repeatable="1">Accept contract</button></div>');
      card.querySelector('[data-repeatable]')?.addEventListener('click', () =>
        this.hooks.onAcceptQuest?.(bi, 'repeatable'));
      wrap.appendChild(card);
    }
  }

  // Consumables: repeatable purchases, used in the field with F / G.
  _renderSupplies(wrap) {
    // expedition gear first: real items now, each worn in its own slot
    for (const it of ITEMS.filter(i => i.supply)) {
      const placed = !!it.placeable && !!this.camp?.has(it.placeable.kind);
      const owned = this.player.hasItem(it.id) || placed;
      const rebuyable = !!it.torch && !it.torch.permanent; // ordinary torches burn out
      const locked = it.level > this.player.level;
      const eraLocked = !!it.needs && !!this.camp && !this.camp.has(it.needs);
      const affordable = this._affordable(it.cost);
      const card = document.createElement('div');
      card.className = 'card' + (owned && !rebuyable ? ' owned'
        : affordable && !locked && !eraLocked ? ' buyable' : locked || eraLocked ? ' locked' : ' expensive');
      const foot = locked ? `<span class="tag">🔒 Lv ${it.level}</span>`
        : eraLocked ? `<span class="tag">🔒 Needs ${NEED_NAMES[it.needs] ?? it.needs}</span>`
        : (owned && !rebuyable) ? `<span class="tag ok">✔ ${placed ? 'Placed' : it.placeable ? 'In backpack — click to place' : 'Owned — equip in Character (C)'}</span>`
        : (owned ? '<span class="tag ok">✔ Owned</span> ' : '')
          + `<button class="buy-btn" data-supply="${it.id}">Buy${owned ? ' another' : ''} — ${this._costStr(it.cost)}</button>`;
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(it)}</span>
          <span class="name">${it.name}</span><span class="lv">${SLOT_LABELS[it.slot].toLowerCase()}</span></div>
        <div class="desc">${it.desc}</div>
        <div class="card-foot">${foot}</div>`;
      card.querySelector('[data-supply]')?.addEventListener('click', () =>
        this.hooks.onBuyItem?.(it.id));
      wrap.appendChild(card);
    }

    for (const c of CONSUMABLES) {
      if (c.found) continue; // found in the world, never sold
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
    // bag upgrade: +4 backpack slots a pop (up to 26)
    const p2 = this.player;
    const bags = Math.round((p2.invSlots - 10) / 4);
    const bagCost = { hide: 8 + bags * 8, meat: 40 + bags * 40 };
    const maxed = p2.invSlots >= 26;
    const bag = document.createElement('div');
    bag.className = 'card' + (maxed ? ' owned' : this._affordable(bagCost) ? ' buyable' : ' expensive');
    bag.innerHTML = `
      <div class="card-head"><span class="icon">🎒</span>
        <span class="name">Bag Upgrade</span><span class="lv">${p2.invSlots} slots</span></div>
      <div class="desc">Sew 4 extra slots onto your backpack (max 26).</div>
      <div class="card-foot">${maxed ? '<span class="tag ok">✔ Maxed</span>'
        : `<button class="buy-btn" data-bag="1">Buy — ${this._costStr(bagCost)}</button>`}</div>`;
    wrap.appendChild(bag);
    bag.querySelector('[data-bag]')?.addEventListener('click', () => this.hooks.onBuyBag?.(bagCost));

    wrap.querySelectorAll('.buy-btn:not([data-bag]):not([data-supply])').forEach(btn =>
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

  // Training unlocks early tiers level-by-level, then advanced tiers at biome milestones.
  _renderTraining(wrap) {
    const p = this.player;
    if (this.camp) this._renderTalents(wrap);

    if (this.camp) {
      const legacy = document.createElement('div');
      legacy.className = 'talent-section-title';
      legacy.innerHTML = '<b>📈 Repeatable training</b><span>Resource-funded incremental improvements</span>';
      wrap.appendChild(legacy);
    }
    for (const track of STAT_TRACKS) {
      const tier = p.stats[track.id];
      const maxed = tier >= track.max;
      const nextTier = tier + 1;
      const cost = maxed ? null : costFor(track.cost(nextTier), !!this.moba);
      const requiredLevel = maxed ? null : trainingLevelFor(track, nextTier);
      const levelLocked = !maxed && p.level < requiredLevel;
      const affordable = cost && this._affordable(cost);

      const card = document.createElement('div');
      card.className = 'card' + (maxed ? ' owned' : levelLocked ? ' locked' : affordable ? ' buyable' : ' expensive');

      let status;
      if (maxed) status = '<span class="tag ok">Fully trained</span>';
      else if (levelLocked) status = `<span class="tag">Tier ${nextTier} needs player Lv ${requiredLevel}</span>`;
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

  _renderTalents(wrap) {
    const p = this.player;
    const total = talentPointsForLevel(p.level);
    const spent = p.spentTalentPoints();
    const available = Math.max(0, total - spent);
    const atCamp = !!this.hooks.canRespecTalents?.();
    const board = document.createElement('section');
    board.className = 'talent-board';
    board.innerHTML = `<div class="talent-board-head">
      <div><b>🌿 Character paths</b><span>First point at Lv2, then every three levels · ${available} available / ${total} earned</span></div>
      <button class="buy-btn talent-respec" data-talent-respec="1" ${!atCamp || spent === 0 ? 'disabled' : ''}>
        🔄 Reset at camp
      </button>
    </div>
    <div class="talent-paths"></div>`;
    const paths = board.querySelector('.talent-paths');
    for (const tree of TALENT_TREES) {
      const branch = document.createElement('div');
      branch.className = 'talent-path';
      branch.style.setProperty('--talent-color', tree.color);
      branch.innerHTML = `<h3>${tree.icon} ${tree.name}</h3>`;
      for (const node of tree.nodes) {
        const owned = p.hasTalent(node.id);
        const prereq = !node.requires || p.hasTalent(node.requires);
        const canBuy = !owned && prereq && available > 0;
        const card = document.createElement('div');
        card.className = `talent-node${owned ? ' owned' : canBuy ? ' buyable' : ' locked'}`;
        card.innerHTML = `<div class="talent-node-name">${node.icon} ${node.name}</div>
          <div class="talent-node-desc">${node.desc}</div>
          ${owned ? '<span>✓ Learned</span>'
            : canBuy ? `<button class="buy-btn" data-talent="${node.id}">Spend 1 point</button>`
              : `<span>${!prereq ? 'Requires previous talent' : 'No point available'}</span>`}`;
        branch.appendChild(card);
      }
      paths.appendChild(branch);
    }
    if (!atCamp) {
      const note = document.createElement('div');
      note.className = 'talent-camp-note';
      note.textContent = '🏠 Stand beside your home at camp to reset all spent talent points.';
      board.appendChild(note);
    }
    wrap.appendChild(board);
    board.querySelectorAll('[data-talent]').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onBuyTalent?.(btn.dataset.talent)));
    board.querySelector('[data-talent-respec]')?.addEventListener('click', () =>
      this.hooks.onRespecTalents?.());
  }

  // ---------- character / equipment ----------
  // WoW-style paper doll: your live character in the middle, equipment slots
  // flanking it, a stat breakdown below, and a stackable inventory grid.
  renderCharacter() {
    const p = this.player;

    // armor hugs the doll on the sides; hands/mount/companion sit in a row below
    const DOLL = { left: ['head', 'chest', 'underlayer'],
                   right: ['legs', 'boots', 'back'],
                   bottom: ['weapon', 'offhand', 'mount', 'companion', 'charm'] };
    for (const side of ['left', 'right', 'bottom']) {
      const col = $('doll-' + side);
      col.innerHTML = '';
      for (const slot of DOLL[side]) {
        const id = p.equipment[slot];
        const item = id ? itemById(id) : null;
        const div = document.createElement('div');
        div.className = 'doll-slot' + (item ? ' filled' : '');
        div.dataset.slot = slot;
        div.title = item ? `${item.name} — ${item.desc} (click to unequip)` : SLOT_LABELS[slot];
        div.innerHTML = `<span class="ds-icon">${item ? itemIcon(item) : ''}</span>
          <span class="ds-label">${SLOT_LABELS[slot]}</span>`;
        if (item && !(slot === 'weapon' && id === 'fists')) {
          div.addEventListener('click', () => this.hooks.onUnequip(slot));
        }
        col.appendChild(div);
      }
    }

    // ---- stat breakdown: value first, then base + every named modifier ----
    const s = p.stats;
    const rows = [];
    const talentSummary = TALENT_TREES
      .map(tree => ({ tree, count: tree.nodes.filter(n => p.hasTalent(n.id)).length }))
      .filter(x => x.count > 0)
      .map(x => `${x.tree.icon} ${x.tree.name} ${x.count}/3`);
    rows.push(['🌿 Talents', `${p.spentTalentPoints()}/${talentPointsForLevel(p.level)}`,
      talentSummary.length ? talentSummary.join(' · ') : 'No path chosen yet — Upgrades → Training']);
    const base = itemById(p.equipment.weapon)?.weapon ?? itemById('fists').weapon;
    const charm = itemById(p.equipment.charm);
    const dmgParts = [`${Math.round(base.dmg)} ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (p.levelDamagePct) dmgParts.push(`+${Math.round(p.levelDamagePct * 100)}% level`);
    if (s.power) dmgParts.push(`+${s.power * 5}% training`);
    if (base.kind === 'bow' && base.style !== 'crossbow' && p.hasTalent('hunterBow')) dmgParts.push('+18% Bowcraft');
    if (p.forgeTier) dmgParts.push(`+${p.forgeTier * 10}% forge`);
    if (charm?.stats?.dmgPct) dmgParts.push(`+${Math.round(charm.stats.dmgPct * 100)}% ${charm.name}`);
    rows.push(['⚔️ Attack', Math.round(p.weapon.dmg), dmgParts.join(' · ')]);

    const asParts = [`${base.cd.toFixed(2)}s ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (p.level > 1) asParts.push(`+${p.levelAttackSpeedBonus.toFixed(2)}/s level`);
    if (s.swift) asParts.push(`+${s.swift * 4}% training`);
    if (charm?.stats?.aspd) asParts.push(`+${Math.round(charm.stats.aspd * 100)}% ${charm.name}`);
    rows.push(['⚡ Attacks/s', (1 / p.weapon.cd).toFixed(2), asParts.join(' · ')]);

    const hpParts = ['100 base'];
    if (p.level > 1) hpParts.push(`+${(p.level - 1) * 10} level`);
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = itemById(p.equipment[slot]);
      if (it?.stats?.hp) hpParts.push(`+${Math.round(it.stats.hp * p.gearMult)} ${it.name}`);
    }
    if (p.campBonus) hpParts.push(`+${p.campBonus} home`);
    if (p.shrineBonus) hpParts.push(`+${p.shrineBonus} shrines`);
    if (p.hasTalent('warriorVitality')) hpParts.push('+15% Iron Constitution');
    rows.push(['❤️ Max health', p.maxHp, hpParts.join(' · ')]);

    const spParts = ['5.5 base'];
    if (p.level > 1) spParts.push(`+${((p.level - 1) * 0.1).toFixed(1)} level`);
    const boots = itemById(p.equipment.boots);
    if (boots?.stats?.speed) spParts.push(`+${boots.stats.speed} ${boots.name}`);
    if (p.hasTalent('wandererStride')) spParts.push('+0.7 Long Stride');
    if (p.mounted) spParts.push('+9 🐴 horse');
    // the +9 mount bonus is added at move time, not baked into p.speed — show the total
    const shownSpeed = p.speed + (p.mounted ? 9 : 0);
    rows.push(['🏃 Speed', (Math.round(shownSpeed * 10) / 10), spParts.join(' · ')]);

    const rgParts = [`${base.range} m ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (s.range) rgParts.push(`+${((base.kind === 'bow' ? 2 : 0.1) * s.range).toFixed(1)} m training`);
    if (base.kind === 'bow' && base.style !== 'crossbow' && p.hasTalent('hunterBow')) rgParts.push('+3 m Bowcraft');
    rows.push(['🎯 Range', (Math.round(p.weapon.range * 10) / 10) + ' m', rgParts.join(' · ')]);

    if (p.pet) rows.push(['🐺 Pet', `${Math.round(p.pet.dmg)} dmg · ${p.pet.maxHp} hp`,
      `training T${s.pet} · your level ${p.level}`]);
    if (p.orb) rows.push(['🔮 Orb', `${Math.round(p.orb.dmg)} dmg ×${p.orb.targets}`,
      s.power ? `+${s.power * 5}% Power training` : 'scales with Power training']);
    if (p.hasTalent('mysticAttunement')) rows.push(['✨ Spell recovery', '-20%',
      p.hasTalent('mysticOverchannel') ? 'Attunement · +25% power · +20% duration' : 'Mystic Attunement']);

    // regen row
    const regenParts = ['0.1 base'];
    if (p.level > 1) regenParts.push(`+${((p.level - 1) * 0.1).toFixed(1)} level`);
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = itemById(p.equipment[slot]);
      if (it?.stats?.regen) regenParts.push(`+${(it.stats.regen * p.gearMult).toFixed(1)} ${it.name}`);
    }
    rows.push(['💚 Regen', `${(Math.round(p.hpRegen * 10) / 10)}/s`, regenParts.join(' · ')]);

    $('char-stats').innerHTML = rows.map(([label, val, parts]) =>
      `<div class="stat-row"><span class="sr-label">${label}</span>
        <b>${val}</b><small>${parts}</small></div>`).join('');

    // admin mode: type a value to override any stat (blank = back to normal)
    if (this.hooks.isAdmin?.()) {
      const ov = this.hooks.adminValues?.() ?? {};
      const fields = [['level', 'Level'], ['attack', 'Attack'], ['aspd', 'Attacks/s'],
        ['maxHp', 'Max HP'], ['speed', 'Speed'], ['range', 'Range m'], ['regen', 'Regen/s']];
      const box = document.createElement('div');
      box.className = 'admin-box';
      // one-click power presets, then the per-stat override fields
      const PRESETS = [
        ['Strong',    { speed: 40, maxHp: 500,  regen: 20,  attack: 40,   aspd: 7 }],
        ['Stronger',  { speed: 40, maxHp: 1500, regen: 70,  attack: 150,  aspd: 8 }],
        ['Strongest', { speed: 40, maxHp: 5000, regen: 500, attack: 1000, aspd: 10 }],
      ];
      box.innerHTML = '<h4>🛠 Admin overrides <small>blank = default</small></h4>' +
        `<div class="admin-presets">${PRESETS.map(([name], i) =>
          `<button class="buy-btn" data-preset="${i}">${name}</button>`).join('')}</div>` +
        fields.map(([k, l]) => `<label class="admin-field">${l}
          <input type="number" step="any" data-adm="${k}" value="${ov[k] ?? ''}" placeholder="—"></label>`).join('');
      $('char-stats').appendChild(box);
      box.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
        this.hooks.onAdminStat?.(inp.dataset.adm, inp.value === '' ? null : +inp.value);
      }));
      box.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
        for (const [k, v] of Object.entries(PRESETS[+btn.dataset.preset][1]))
          this.hooks.onAdminStat?.(k, v);
        this.renderCharacter(); // show the freshly applied numbers
      }));
    }

    this.renderInventory();

    // quests: the active one (with abandon) + completed history
    const qWrap = $('char-quests');
    qWrap.innerHTML = '';
    if (p.quest) {
      const q = p.quest;
      const pct = Math.min(100, Math.round((q.count / q.need) * 100));
      const card = this._questCard(q, 'active',
        `<div class="quest-bar"><div style="width:${pct}%"></div></div>
         <div class="q-meta">${q.count}/${q.need} · ${BIOMES[q.biome].name}</div>
         <div class="card-foot"><button class="buy-btn" data-abandon="1">✖ Abandon quest</button></div>`);
      card.querySelector('[data-abandon]').addEventListener('click', () => this.hooks.onAbandonQuest?.());
      qWrap.appendChild(card);
    } else {
      qWrap.innerHTML = '<div class="empty-note">No active quest — visit a blacksmith (⚒ on the map).</div>';
    }
    if (p.questHistory.length) {
      const hist = document.createElement('div');
      hist.className = 'q-desc';
      hist.style.marginTop = '6px';
      hist.innerHTML = '<b>Completed:</b> ' +
        p.questHistory.map(h => `✅ ${h.name}`).join(' · ');
      qWrap.appendChild(hist);
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

  // ---------- inventory: WoW-style slot grid inside the Armory ----------
  // Equipped pieces live on the paper doll and do NOT take a slot here.
  renderInventory() {
    const p = this.player;
    const grid = $('inv-grid');
    grid.innerHTML = '';
    const cells = [];
    for (const key of RESOURCES) {
      if (p[key] > 0) cells.push({ kind: 'res', id: key, icon: resIcon(key, RES_ICONS[key]), count: p[key],
        title: key === 'berry' ? 'Blueberries — click to eat one (+7 ❤️), drag out to drop' : `${key} — drag out to drop 5` });
    }
    for (const c of CONSUMABLES) {
      const n = p.consumables?.[c.id] ?? 0;
      if (n > 0) cells.push({ kind: 'consumable', id: c.id, itemRef: c, count: n,
        title: `${c.name} — click to use (${c.desc}), drag out to drop one` });
    }
    // unequipped gear stacks by id (duplicates show a count)
    const counts = {};
    for (const id of p.invItems) counts[id] = (counts[id] || 0) + 1;
    for (const [id, n] of Object.entries(counts)) {
      const item = itemById(id);
      if (!item) continue;
      cells.push({ kind: 'item', id, itemRef: item, count: n > 1 ? n : 0,
        title: item.nest || item.placeable
          ? `${item.name} — ${item.desc} (click to PLACE it)`
          : `${item.name} — ${item.desc} (click to equip · drag to hotkey or drop)` });
    }
    $('inv-slots-label').textContent = `${cells.length}/${p.invSlots}`;
    const total = Math.max(p.invSlots, cells.length);
    for (let i = 0; i < total; i++) {
      const cell = cells[i];
      const div = document.createElement('div');
      if (!cell) {
        div.className = 'inv-cell empty-slot';
        grid.appendChild(div);
        continue;
      }
      div.className = 'inv-cell' + (cell.kind === 'item' ? ' gear' : '') +
        (i >= p.invSlots ? ' overflow' : '');
      div.title = cell.title;
      div.innerHTML = `<span class="ic">${cell.itemRef ? itemIcon(cell.itemRef) : cell.icon}</span>` +
        (cell.count > 0 ? `<span class="cnt">${fmtResource(cell.count)}</span>` : '');
      this._wireInvCell(div, cell);
      grid.appendChild(div);
    }

    // admin mode: inventory-like 10-column catalog. Every item remains
    // directly addable in devmode, including placeables and consumables.
    const oldBox = $('inv-admin'); if (oldBox) oldBox.remove();
    if (this.hooks.isAdmin?.()) {
      const box = document.createElement('div');
      box.id = 'inv-admin';
      box.className = 'admin-box';
      const entries = [
        ...ITEMS.map(item => ({ id: item.id, item, meta: `Lv ${item.level}${item.unique ? ' ★' : ''}` })),
        ...CONSUMABLES.map(item => ({ id: `c:${item.id}`, item, meta: 'Use' })),
      ];
      box.innerHTML = `<h4>🛠 Add item <small>click a slot to add one</small></h4>
        <div class="admin-item-grid">${entries.map(({ id, item, meta }) =>
          `<button class="admin-item-cell" data-admin-item="${id}" title="${item.name} — ${item.desc}">
            <span class="admin-item-icon">${itemIcon(item)}</span>
            <span class="admin-item-name">${item.name}</span>
            <span class="admin-item-meta">${meta}</span>
          </button>`).join('')}</div>
        <button class="buy-btn" id="adm-res">+100 all resources</button>`;
      grid.parentElement.insertBefore(box, grid.nextSibling);
      box.querySelectorAll('[data-admin-item]').forEach(cell => cell.addEventListener('click', () =>
        this.hooks.onAdminAddItem?.(cell.dataset.adminItem)));
      box.querySelector('#adm-res').addEventListener('click', () =>
        this.hooks.onAdminAddRes?.());
    }
  }

  // Inventory cell interactions: click to use/equip, DRAG to hotkey or drop.
  // Dragging out of every panel drops the stack/item on the ground; dragging
  // onto an action-bar slot (1–6) hotkeys the item there.
  _wireInvCell(div, cell) {
    let ghost = null, dragging = false, sx = 0, sy = 0;

    const onMove = (e) => {
      if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        dragging = true;
        ghost = div.cloneNode(true);
        ghost.className = 'inv-cell drag-ghost';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = (e.clientX - 24) + 'px';
        ghost.style.top = (e.clientY - 24) + 'px';
      }
    };
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ghost?.remove();
      if (!dragging) { this._invClick(cell); return; }
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const barSlot = under?.closest?.('.spell-slot');
      if (barSlot && cell.kind === 'item') {
        this.hooks.onAssignSlot?.(Number(barSlot.dataset.slot), cell.id);
        this.refresh();
        return;
      }
      // dropped on a paper-doll slot → equip (must be the matching slot)
      const dollSlot = under?.closest?.('.doll-slot');
      if (dollSlot && cell.kind === 'item') {
        const item = itemById(cell.id);
        if (item?.placeable) {
          this.hooks.onToast?.(`${item.name} is placed from the inventory, not equipped.`);
        } else if (item && dollSlot.dataset.slot && item.slot !== dollSlot.dataset.slot) {
          this.hooks.onToast?.(`${item.name} goes into the ${SLOT_LABELS[item.slot] ?? item.slot} slot`);
        } else {
          this.hooks.onEquip(cell.id);
        }
        this.refresh();
        return;
      }
      // released outside every panel → drop it on the ground
      if (!under?.closest?.('.panel')) {
        if (cell.kind === 'res') this.hooks.onDropRes?.(cell.id);
        else if (cell.kind === 'item') this.hooks.onDropItem?.(cell.id);
        else if (cell.kind === 'consumable') this.hooks.onDropConsumable?.(cell.id);
        this.refresh();
      }
    };
    div.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = false; ghost = null;
      sx = e.clientX; sy = e.clientY;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  _invClick(cell) {
    if (cell.kind === 'item') {
      const item = itemById(cell.id);
      if (item?.nest) this.hooks.onPlaceNest?.(cell.id); // griffin roost, not gear
      else if (item?.placeable) this.hooks.onPlaceItem?.(cell.id);
      else this.hooks.onEquip(cell.id);
    }
    else if (cell.kind === 'consumable') this.hooks.onUseConsumable?.(cell.id);
    else if (cell.id === 'berry') this.hooks.onEatBerry?.();
    this.refresh();
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
    $('base-res').innerHTML = this._resLine();
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
    const talents = document.createElement('div');
    talents.className = 'card owned';
    talents.style.gridColumn = '1 / -1';
    const spent = this.player.spentTalentPoints();
    talents.innerHTML = `<div class="card-head"><span class="icon">🌿</span>
      <span class="name">Retrain character paths</span><span class="lv">${spent} points spent</span></div>
      <div class="desc">Your camp is the only place where all talent points can be returned. Nothing else is lost.</div>
      <div class="card-foot"><button class="buy-btn" data-home-respec="1" ${spent ? '' : 'disabled'}>
        🔄 Reset all talents
      </button></div>`;
    wrap.appendChild(talents);
    talents.querySelector('[data-home-respec]')?.addEventListener('click', () =>
      this.hooks.onRespecTalents?.());
    this._wireCampButtons(wrap);
  }

  // ---------- E at the chest: storage modal ----------
  renderChest() {
    const camp = this.camp;
    if (!camp) return;
    $('chest-res').innerHTML = this._resLine();
    const wrap = $('chest-items');
    wrap.innerHTML = '';
    const chest = document.createElement('div');
    chest.className = 'card owned';
    chest.style.gridColumn = '1 / -1';
    chest.innerHTML = `<div class="card-head"><span class="icon">${itemIcon({ id: 'chest' })}</span>
      <span class="name">Stored</span>
      <span class="lv">${RESOURCES.map(k => `${resIcon(k, RES_ICONS[k])} ${fmtResource(camp.storage[k] ?? 0)}`).join(' · ')}</span></div>
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
