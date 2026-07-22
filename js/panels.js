// ---- Modal panels: upgrade shop (grouped tabs), character sheet with
// equipment slots, bestiary of discovered creatures ----

import { SHOP_GROUPS, SMITH_GROUPS, questFor, repeatableQuestFor, questXpFor,
         QUEST_CATEGORY_LABELS, QUESTS_PER_BIOME, BIOMES, SLOTS, SLOT_LABELS, ENEMY_TYPES, ITEMS,
         MOBA_BUILDINGS, CAMP_BUILDINGS, RES_ICONS, RESOURCES, CONSUMABLES,
         MAX_SPELL_SLOTS, fmtResource, itemById, spellById, costFor, weaponDurabilityFor,
         CLASS_TREES, classTreeById, classSkillById, classSkillRequiredLevel,
         classSkillMeatCost, classSkillEssenceCost, classPathSkills, firstClassSkillId, CLASS_CHOOSE_COST,
         classActiveInfo, classPassiveInfo, requiredClassForItem,
         PLAYER_HP, ENEMY_HP, ENEMY_DMG, xpKillFor, meatForLevel,
         enemyTypicalLevel } from './config.js';

const NEED_NAMES = { tent: 'Hide Tent', cabin: 'Wooden Cabin', furnace: 'Stone Furnace',
  keep: 'Medieval Keep', runic: 'Runic Hall', mountain: 'Mountain Fortress',
  spirit: 'Spirit Bastion', primal: 'Primal Citadel', frosthold: 'Frosthold' };
import { itemIcon, resIcon, skillArt } from './icons.js';
import { attachTip } from './tooltip.js';
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
    this.charTab = 'gear';   // Character modal: 'gear' (doll+inventory) or 'class'
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
    // Character modal Gear / Class tabs
    document.querySelectorAll('#char-tabs .char-tab').forEach(btn =>
      btn.addEventListener('click', () => {
        this.charTab = btn.dataset.ctab;
        audio.sfx('click', 0.4);
        this.renderCharacter();
      }));
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

  // ---- rich hover-tooltip HTML builders (custom, not the native title) ----
  _itemTip(item, { requiredClass, action } = {}) {
    const stats = [];
    const w = item.weapon;
    if (w) {
      if (w.dmg) stats.push(['Damage', Math.round(w.dmg)]);
      if (w.cd) stats.push(['Attack speed', (1 / w.cd).toFixed(2) + '/s']);
      if (w.dmg && w.cd) stats.push(['DPS', (w.dmg / w.cd).toFixed(1)]);
      if (w.range) stats.push(['Range', w.range + ' m']);
      if (w.chop > 0) stats.push(['🪓 Cutting power', w.chop]);
      if (w.mine > 0) stats.push(['⛏️ Mining power', w.mine]);
      stats.push(['Type', w.kind === 'bow' ? 'Ranged weapon' : 'Melee weapon']);
      const maxDur = weaponDurabilityFor(item);
      if (maxDur && this.player) {
        const left = Math.max(0, maxDur - (this.player.weaponWearById?.[item.id] || 0));
        stats.push(['Durability', left <= 0 ? '💔 broken — see a smith' : `${left} / ${maxDur}`]);
      }
    }
    const st = item.stats || {};
    if (st.hp) stats.push(['Max health', '+' + st.hp]);
    if (st.speed) stats.push(['Move speed', '+' + st.speed]);
    if (st.regen) stats.push(['Regen', '+' + st.regen + '/s']);
    if (st.dmgPct) stats.push(['Damage', '+' + Math.round(st.dmgPct * 100) + '%']);
    if (st.aspd) stats.push(['Attack speed', '+' + Math.round(st.aspd * 100) + '%']);
    if (item.shield?.block) stats.push(['Block', Math.round(item.shield.block * 100) + '%']);
    const slot = SLOT_LABELS[item.slot] || item.slot;
    return `<div class="tt-head"><span class="tt-ico">${itemIcon(item)}</span>
        <span class="tt-title"><b>${item.name}</b><span class="tt-sub">${slot}${item.level > 1 ? ` · Lv ${item.level}` : ''}</span></span></div>
      <div class="tt-desc">${item.desc}</div>
      ${stats.length ? `<ul class="tt-stats">${stats.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('')}</ul>` : ''}
      ${requiredClass ? '<div class="tt-req">🔒 Requires the Beastmaster class to equip</div>' : ''}
      ${action ? `<div class="tt-hint">${action}</div>` : ''}`;
  }

  _abilityTip(skill, rank = 0, { hint } = {}) {
    const rows = Array.from({ length: skill.maxRank || 1 }, (_, i) => {
      const n = i + 1;
      const info = skill.type === 'active' ? classActiveInfo(skill, n) : classPassiveInfo(skill, n);
      return `<div class="rr${n === rank ? ' cur' : ''}"><b>R${n}</b><span>Lv ${classSkillRequiredLevel(skill, n)} · ${info.join(' · ')}</span></div>`;
    }).join('');
    const kind = skill.type === 'active' ? `⚡ Active · ${skill.cd}s cooldown` : '🛡️ Passive';
    return `<div class="tt-head"><span class="tt-ico">${skillArt(skill.id, skill.icon)}</span>
        <span class="tt-title"><b>${skill.name}</b><span class="tt-sub">${kind} · Lv ${skill.level}</span></span></div>
      <div class="tt-desc">${skill.desc}</div>
      <div class="tt-ranks">${rows}</div>
      ${hint ? `<div class="tt-hint">${hint}</div>` : ''}`;
  }

  _plainTip(title) {
    return `<div class="tt-desc" style="margin:0">${title}</div>`;
  }

  // ---------- shop ----------
  renderShop() {
    const p = this.player;
    $('shop-res').innerHTML = this._resLine();

    // tabs (+ Base tab in MOBA, + Camp/Supplies in survival). The exclusive
    // class trees now live in the Character modal, not here.
    const groups = this.moba
      ? [...SHOP_GROUPS, { key: 'base', label: '🏰 Base' }]
      : this.camp
        ? [{ key: 'camp', label: '🏕️ Camp' },
           ...SHOP_GROUPS, { key: 'supplies', label: '🧪 Supplies' }]
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
      const requiredClass = this.camp ? requiredClassForItem(entry) : null;
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
        `<button class="buy-btn${owned ? ' owned' : ''}" data-id="${entry.id}">Buy${owned ? ' another' : ''} — ${this._costStr(cost)}</button>`;

      const slotTag = isSpells ? '📖 spell' : SLOT_LABELS[entry.slot].toLowerCase();
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(entry)}</span>
          <span class="name">${entry.name}</span><span class="lv">${slotTag}</span></div>
        <div class="desc">${entry.desc}${requiredClass
          ? `<span class="class-requirement">🔒 Requires Beastmaster class to equip</span>` : ''}</div>
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
    if (this.smithTab === 'repair') {
      this._renderSmithRepair(wrap);
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
      const requiredClass = this.camp ? requiredClassForItem(entry) : null;
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
        `<button class="buy-btn${owned ? ' owned' : ''}" data-id="${entry.id}">Forge${owned ? ' another' : ''} — ${this._costStr(cost)}</button>`;
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(entry)}</span>
          <span class="name">${entry.name}</span><span class="lv">${SLOT_LABELS[entry.slot].toLowerCase()}</span></div>
        <div class="desc">${entry.desc}${requiredClass
          ? `<span class="class-requirement">🔒 Requires Beastmaster class to equip</span>` : ''}</div>
        <div class="card-foot">${status}</div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onBuyItem(btn.dataset.id)));
  }

  // ---------- blacksmith repair: every weapon wears out; fixing is free ----------
  _renderSmithRepair(wrap) {
    const p = this.player;
    const ids = [...new Set([p.equipment.weapon, ...p.invItems])]
      .filter(id => id && weaponDurabilityFor(itemById(id)) > 0);
    const worn = ids.filter(id => (p.weaponWearById?.[id] || 0) > 0);
    const note = document.createElement('div');
    note.className = 'empty-note';
    note.textContent = worn.length
      ? 'Every weapon dulls with use — the smith fixes them for free.'
      : 'All your weapons are in perfect shape.';
    wrap.appendChild(note);
    if (worn.length > 1) {
      const all = document.createElement('div');
      all.className = 'card buyable';
      all.innerHTML = `<div class="card-head"><span class="icon">🔧</span>
          <span class="name">Repair everything</span></div>
        <div class="card-foot"><button class="buy-btn" data-id="">Repair all — free</button></div>`;
      wrap.appendChild(all);
    }
    for (const id of ids) {
      const item = itemById(id);
      const max = weaponDurabilityFor(item);
      const left = Math.max(0, max - (p.weaponWearById?.[id] || 0));
      const broken = left <= 0;
      const pct = Math.round((left / max) * 100);
      const card = document.createElement('div');
      card.className = 'card' + (left < max ? ' buyable' : ' owned');
      const barColor = broken ? '#e04f4f' : pct < 25 ? '#e0a34f' : '#7fc26a';
      card.innerHTML = `
        <div class="card-head"><span class="icon">${itemIcon(item)}</span>
          <span class="name">${item.name}</span>
          <span class="lv">${broken ? '💔 BROKEN' : `${left} / ${max}`}</span></div>
        <div class="desc"><div style="height:7px;border-radius:4px;background:#0006;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor}"></div></div></div>
        <div class="card-foot">${left < max
          ? `<button class="buy-btn" data-id="${id}">Repair — free</button>`
          : '<span class="tag ok">✔ Like new</span>'}</div>`;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('.buy-btn').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onRepairItem(btn.dataset.id || null)));
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
      const owned = this.player.hasItem(it.id) || placed
        || (!!it.training && !!this.player.upgrades?.[it.training]); // learned skills
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
          + `<button class="buy-btn${owned ? ' owned' : ''}" data-supply="${it.id}">Buy${owned ? ' another' : ''} — ${this._costStr(it.cost)}</button>`;
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

  _classRank(id) {
    return Math.max(0, Number(this.player.classRank?.(id) ?? this.player.classTraining?.[id] ?? 0) || 0);
  }

  // The exclusive class tree, rendered as a single "path" inside the Character
  // modal. Before a class is picked every class is a collapsed card with a
  // Choose button; once committed, only the chosen class's path is shown and it
  // reveals skills up to the player's current level (the rest hide behind a "?").
  _renderClassPath(container) {
    const p = this.player;
    const selected = classTreeById(p.selectedClass);
    const meatIcon = resIcon('meat', RES_ICONS.meat ?? '🍖');
    const essenceIcon = resIcon('essence', RES_ICONS.essence ?? '🧪');
    container.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'classp-head';
    head.innerHTML = `<div class="classp-title"><b>🧬 Class path</b>
        <span>${selected
          ? `${selected.icon} ${selected.name} — follow the path: 🍖 trains passives, 🧪 essence powers active abilities.`
          : `Commit to ONE class. Choosing costs ${CLASS_CHOOSE_COST} 🍖 and is permanent until you reset at home.`}</span></div>
      <span class="classp-meat">${fmtResource(p.meat)} ${meatIcon}</span>`;
    container.appendChild(head);

    // ---------- no class yet: five collapsed pick cards ----------
    if (!selected) {
      const grid = document.createElement('div');
      grid.className = 'class-pick-grid';
      for (const tree of CLASS_TREES) {
        const affordable = p.meat >= CLASS_CHOOSE_COST;
        const card = document.createElement('article');
        card.className = 'class-pick';
        card.style.setProperty('--class-color', tree.color);
        card.innerHTML = `<div class="pick-emblem">${tree.icon}</div>
          <h3>${tree.name}</h3>
          <p>${tree.summary}</p>
          <button class="buy-btn choose" data-choose="${tree.id}" ${affordable ? '' : 'disabled'}>
            Choose — ${CLASS_CHOOSE_COST} ${meatIcon}</button>`;
        grid.appendChild(card);
      }
      container.appendChild(grid);
      container.querySelectorAll('[data-choose]').forEach(btn =>
        btn.addEventListener('click', () => this.hooks.onChooseClass?.(btn.dataset.choose)));
      return;
    }

    // ---------- committed: the class path ----------
    const path = classPathSkills(selected);
    const firstId = firstClassSkillId(selected.id);
    const firstLevel = path[0]?.level ?? 1;
    const revealMax = Math.max(p.level, firstLevel);
    const trained = path.reduce((n, s) => n + this._classRank(s.id), 0);

    const chosen = document.createElement('div');
    chosen.className = 'classp-chosen';
    chosen.style.setProperty('--class-color', selected.color);
    chosen.innerHTML = `<span class="cc-emblem">${selected.icon}</span>
      <div class="cc-name"><b>${selected.name}</b><span>${selected.summary}</span></div>
      <span class="cc-progress">${trained}/${path.length * 3} ranks</span>`;
    container.appendChild(chosen);

    const pathEl = document.createElement('div');
    pathEl.className = 'class-path';
    pathEl.style.setProperty('--class-color', selected.color);

    let hiddenAny = false;
    // skills sharing a level share a row (two half-width nodes side by side)
    let curRow = null, curLevel = null;
    path.forEach((skill, i) => {
      if (skill.level > revealMax) { hiddenAny = true; return; }
      const rank = this._classRank(skill.id);
      const maxed = rank >= skill.maxRank;
      const nextRank = Math.min(skill.maxRank, rank + 1);
      const requiredLevel = classSkillRequiredLevel(skill, nextRank);
      const isFirst = skill.id === firstId;
      const meatCost = classSkillMeatCost(skill, nextRank, isFirst);
      const essenceCost = classSkillEssenceCost(skill, nextRank, isFirst);
      const costLabel = essenceCost > 0
        ? `${fmtResource(essenceCost)} ${essenceIcon}` : `${fmtResource(meatCost)} ${meatIcon}`;
      const levelLocked = !maxed && p.level < requiredLevel;
      const affordable = p.meat >= meatCost && p.essence >= essenceCost;
      const canTrain = !maxed && !levelLocked && affordable;

      const pips = Array.from({ length: skill.maxRank }, (_, r) =>
        `<i class="pip${r < rank ? ' on' : ''}"></i>`).join('');

      let action;
      if (maxed) action = '<span class="node-done">✓ Mastered</span>';
      else if (levelLocked) action = `<span class="node-lock">🔒 Reach Lv ${requiredLevel}</span>`;
      else action = `<button class="buy-btn node-train" data-class-skill="${skill.id}" ${canTrain ? '' : 'disabled'}>
          ${rank ? `Upgrade → R${nextRank}` : 'Train'} · ${costLabel}</button>`;

      // exact numbers for every rank; the trained rank is highlighted
      const rankRows = Array.from({ length: skill.maxRank }, (_, ri) => {
        const n = ri + 1;
        const info = skill.type === 'active' ? classActiveInfo(skill, n) : classPassiveInfo(skill, n);
        const cls = n === rank ? ' cur' : n === rank + 1 && !maxed ? ' next' : '';
        return `<div class="rank-row${cls}"><b>R${n}</b><span class="rr-lv">Lv ${classSkillRequiredLevel(skill, n)}</span>
          <span class="rr-info">${info.join(' · ')}</span></div>`;
      }).join('');

      // trained active abilities can be dragged straight from the path onto the
      // 1–6 bar (or clicked to auto-slot) — no need to switch to the Gear tab
      const slotIdx = p.spellSlots.indexOf(skill.id);
      const draggable = skill.type === 'active' && rank > 0;
      const slotTag = draggable
        ? `<span class="node-slot${slotIdx >= 0 ? ' on' : ''}">${slotIdx >= 0 ? `⌨ key ${slotIdx + 1}` : '✋ drag to 1–6 bar'}</span>`
        : '';

      const node = document.createElement('div');
      node.className = `class-node ${skill.type}${rank ? ' trained' : ''}${maxed ? ' maxed' : ''}${levelLocked ? ' lvl-locked' : ''}${draggable ? ' draggable' : ''}`;
      node.style.setProperty('--i', i);
      node.innerHTML = `<div class="node-art">${skillArt(skill.id, skill.icon)}${draggable ? '<span class="drag-grip">⠿</span>' : ''}</div>
        <div class="node-info">
          <div class="node-top"><b>${skill.name}</b>
            <span class="node-kind">${skill.type === 'active' ? `⚡ ${skill.cd}s cooldown` : '🛡️ passive'} · Lv ${skill.level}</span></div>
          <div class="node-pips">${pips}<span class="node-rank">${rank}/${skill.maxRank}</span>${slotTag}</div>
          <p class="node-desc">${skill.desc}</p>
          <div class="node-ranks">${rankRows}</div>
          <div class="node-action">${action}</div>
        </div>`;
      if (draggable) this._wireSpellDrag(node.querySelector('.node-art'), skill.id);
      // open a fresh row whenever the unlock level changes
      if (skill.level !== curLevel) {
        curLevel = skill.level;
        curRow = document.createElement('div');
        curRow.className = 'path-row';
        pathEl.appendChild(curRow);
      }
      curRow.appendChild(node);
    });

    if (hiddenAny) {
      const row = document.createElement('div');
      row.className = 'path-row';
      const mystery = document.createElement('div');
      mystery.className = 'class-node mystery';
      mystery.innerHTML = `<div class="node-art"><span class="skill-art noart"><span class="art-glyph">❓</span></span></div>
        <div class="node-info">
          <div class="node-top"><b>? ? ?</b></div>
          <p class="node-desc">Keep leveling up to reveal what lies further along your path.</p>
        </div>`;
      row.appendChild(mystery);
      pathEl.appendChild(row);
    }
    container.appendChild(pathEl);

    const reset = document.createElement('div');
    reset.className = 'classp-reset';
    reset.innerHTML = `<div><b>🔄 Reset class</b>
        <span>Clears your class and every trained rank — no meat is refunded.</span></div>
      <button class="buy-btn danger" data-class-reset="1">Reset — no refund</button>`;
    container.appendChild(reset);

    container.querySelectorAll('[data-class-skill]').forEach(btn =>
      btn.addEventListener('click', () => this.hooks.onTrainClassSkill?.(btn.dataset.classSkill)));
    // two-click confirm: the first click arms the button, the second resets
    const resetBtn = container.querySelector('[data-class-reset]');
    resetBtn?.addEventListener('click', () => {
      if (resetBtn.dataset.armed) { this.hooks.onResetClass?.(); return; }
      resetBtn.dataset.armed = '1';
      resetBtn.textContent = '⚠ Click again to confirm reset';
      resetBtn.classList.add('armed');
      clearTimeout(this._resetTimer);
      this._resetTimer = setTimeout(() => {
        if (!resetBtn.isConnected) return;
        delete resetBtn.dataset.armed;
        resetBtn.textContent = 'Reset — no refund';
        resetBtn.classList.remove('armed');
      }, 3500);
    });
  }

  // ---------- character / equipment ----------
  // WoW-style paper doll: your live character in the middle, equipment slots
  // flanking it, a stat breakdown below, and a stackable inventory grid.
  renderCharacter() {
    const p = this.player;

    // Gear / Class tabs: switch the whole body between the paper-doll+inventory
    // view and the exclusive class path.
    const classMode = this.charTab === 'class';
    document.querySelectorAll('#char-tabs .char-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.ctab === this.charTab));
    $('character').classList.toggle('class-mode', classMode);
    $('character-body').classList.toggle('hidden', classMode);
    $('class-body').classList.toggle('hidden', !classMode);
    $('toggle-doll').classList.toggle('hidden', classMode);
    $('toggle-inv').classList.toggle('hidden', classMode);
    if (classMode) { this._renderClassPath($('class-body')); return; }

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
        const requiredClass = this.camp ? requiredClassForItem(item) : null;
        const div = document.createElement('div');
        div.className = 'doll-slot' + (item ? ' filled' : '');
        div.dataset.slot = slot;
        attachTip(div, item
          ? this._itemTip(item, { requiredClass, action: id === 'fists' ? '' : 'Click to unequip' })
          : this._plainTip(SLOT_LABELS[slot]));
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
    const classTree = classTreeById(p.selectedClass);
    const passiveRanks = classTree?.passives.reduce((sum, skill) => sum + this._classRank(skill.id), 0) ?? 0;
    const activeRanks = classTree?.actives.reduce((sum, skill) => sum + this._classRank(skill.id), 0) ?? 0;
    rows.push(['🧬 Class', classTree ? `${classTree.icon} ${classTree.name}` : 'Unchosen', classTree
      ? `${passiveRanks}/${classTree.passives.length * 3} passive ranks · ${activeRanks}/${classTree.actives.length * 3} active ranks · see the Class tab`
      : 'Open the Class tab to choose one class']);
    const base = itemById(p.equipment.weapon)?.weapon ?? itemById('fists').weapon;
    const charm = itemById(p.equipment.charm);
    const dmgParts = [`${Math.round(base.dmg)} ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (p.levelDamage) dmgParts.push(`+${p.levelDamage} level`);
    if (s.power) dmgParts.push(`+${s.power * 5}% training`);
    const classEffects = p.classEffects || {};
    const classDamage = base.kind === 'bow' ? classEffects.rangedDmg : classEffects.meleeDmg;
    if (classDamage) dmgParts.push(`+${Math.round(classDamage * 100)}% ${classTree?.name ?? 'class'}`);
    if (p.forgeTier) dmgParts.push(`+${p.forgeTier * 10}% forge`);
    if (charm?.stats?.dmgPct) dmgParts.push(`+${Math.round(charm.stats.dmgPct * 100)}% ${charm.name}`);
    rows.push(['⚔️ Attack', Math.round(p.weapon.dmg), dmgParts.join(' · ')]);

    const asParts = [`${base.cd.toFixed(2)}s ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (p.level > 1) asParts.push(`+${p.levelAttackSpeedBonus.toFixed(2)}/s level`);
    if (s.swift) asParts.push(`+${s.swift * 4}% training`);
    if (charm?.stats?.aspd) asParts.push(`+${Math.round(charm.stats.aspd * 100)}% ${charm.name}`);
    rows.push(['⚡ Attacks/s', (1 / p.weapon.cd).toFixed(2), asParts.join(' · ')]);

    const hpParts = [`${PLAYER_HP(1)} base`];
    if (p.level > 1) hpParts.push(`+${PLAYER_HP(p.level) - PLAYER_HP(1)} level`);
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = itemById(p.equipment[slot]);
      if (it?.stats?.hp) hpParts.push(`+${Math.round(it.stats.hp * p.gearMult)} ${it.name}`);
    }
    if (p.campBonus) hpParts.push(`+${p.campBonus} home`);
    if (p.shrineBonus) hpParts.push(`+${p.shrineBonus} shrines`);
    if (classEffects.hpPct) hpParts.push(`+${Math.round(classEffects.hpPct * 100)}% ${classTree?.name ?? 'class'}`);
    rows.push(['❤️ Max health', p.maxHp, hpParts.join(' · ')]);

    const spParts = ['5.5 base'];
    if (p.level > 1) spParts.push(`+${((p.level - 1) * 0.04).toFixed(1)} level`);
    const boots = itemById(p.equipment.boots);
    if (boots?.stats?.speed) spParts.push(`+${boots.stats.speed} ${boots.name}`);
    if (classEffects.speed) spParts.push(`+${classEffects.speed.toFixed(1)} ${classTree?.name ?? 'class'}`);
    if (p.mounted) spParts.push('+9 🐴 horse');
    // the +9 mount bonus is added at move time, not baked into p.speed — show the total
    const shownSpeed = p.speed + (p.mounted ? 9 : 0);
    rows.push(['🏃 Speed', (Math.round(shownSpeed * 10) / 10), spParts.join(' · ')]);

    const rgParts = [`${base.range} m ${itemById(p.equipment.weapon)?.name ?? 'fists'}`];
    if (s.range) rgParts.push(`+${((base.kind === 'bow' ? 2 : 0.1) * s.range).toFixed(1)} m training`);
    rows.push(['🎯 Range', (Math.round(p.weapon.range * 10) / 10) + ' m', rgParts.join(' · ')]);

    if (p.pet) rows.push(['🐺 Pet', `${Math.round(p.pet.dmg)} dmg · ${p.pet.maxHp} hp`,
      `training T${s.pet} · your level ${p.level}`]);
    if (p.orb) rows.push(['🔮 Orb', `${Math.round(p.orb.dmg)} dmg ×${p.orb.targets}`,
      s.power ? `+${s.power * 5}% Power training` : 'scales with Power training']);
    if (classEffects.classCdReduction) rows.push(['✨ Class recovery', `-${Math.round(classEffects.classCdReduction * 100)}%`,
      `${classTree?.name ?? 'Class'} passive training`]);

    // regen row: the small in-combat trickle, plus the fast out-of-combat rate
    const regenParts = ['0.3 base'];
    if (p.level > 1) regenParts.push(`+${((p.level - 1) * 0.06).toFixed(1)} level`);
    for (const slot of ['head', 'chest', 'boots', 'charm', 'offhand', 'underlayer', 'legs', 'back', 'mount']) {
      const it = itemById(p.equipment[slot]);
      if (it?.stats?.regen) regenParts.push(`+${(it.stats.regen * p.gearMult).toFixed(1)} ${it.name}`);
    }
    regenParts.push(`out of combat: ${Math.round(p.oocRegen + p.hpRegen)}/s (~${Math.round(p.maxHp / (p.oocRegen + p.hpRegen))}s to full)`);
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



    // spellbook: purchased world spells and trained active class abilities share 1–6.
    const book = $('spellbook');
    book.innerHTML = '';
    const classActives = classTree?.actives
      .filter(skill => this._classRank(skill.id) > 0)
      .map(skill => classSkillById(skill.id))
      .filter(Boolean) ?? [];
    const abilities = [
      ...[...(p.spellsOwned || [])].map(id => spellById(id)).filter(Boolean),
      ...classActives,
    ];
    if (!abilities.length) book.innerHTML = '<div class="empty-note">No class abilities learned yet — train some in the Class tab.</div>';
    for (const spell of abilities) {
      const id = spell.id;
      const slotIdx = p.spellSlots.indexOf(id);
      const div = document.createElement('button');
      div.className = 'inv-item' + (slotIdx >= 0 ? ' slotted' : '') + (spell.type === 'active' ? ' class-ability' : '');
      const icon = spell.type === 'active' ? `<span class="inv-art">${skillArt(id, spell.icon)}</span>` : itemIcon(spell);
      div.innerHTML = `${icon} <b>${spell.name}</b> ${spell.type === 'active' ? `<span class="ability-rank">R${this._classRank(id)}</span>` : ''}<span class="lv">${slotIdx >= 0 ? `key ${slotIdx + 1}` : 'drag to 1–6'}</span>`;
      const tip = spell.type === 'active'
        ? this._abilityTip(spell, this._classRank(id), { hint: slotIdx >= 0 ? 'Click to unslot' : 'Drag onto the 1–6 bar (or click to auto-slot)' })
        : `<div class="tt-head"><span class="tt-ico">${itemIcon(spell)}</span><span class="tt-title"><b>${spell.name}</b></span></div><div class="tt-desc">${spell.desc}</div>`;
      attachTip(div, tip);
      this._wireSpellDrag(div, id);
      book.appendChild(div);
    }
    const usedSlots = p.spellSlots.slice(0, MAX_SPELL_SLOTS).filter(Boolean).length;
    $('spellbook-note').textContent = `${usedSlots}/${MAX_SPELL_SLOTS} action slots used — drag an ability onto the 1–6 bar (or click to slot/unslot).`;
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
        title: key === 'berry' ? 'Blueberries — click to eat one (+5% ❤️), drag out to drop' : `${key} — drag out to drop 5` });
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
      const requiredClass = this.camp ? requiredClassForItem(item) : null;
      cells.push({ kind: 'item', id, itemRef: item, count: n > 1 ? n : 0,
        title: item.nest || item.placeable
          ? `${item.name} — ${item.desc} (click to PLACE it)`
          : `${item.name} — ${item.desc}${requiredClass ? ' · Requires Beastmaster class to equip' : ''} (click to equip · drag to hotkey or drop)` });
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
      div.innerHTML = `<span class="ic">${cell.itemRef ? itemIcon(cell.itemRef) : cell.icon}</span>` +
        (cell.count > 0 ? `<span class="cnt">${fmtResource(cell.count)}</span>` : '');
      if (cell.kind === 'item') {
        const requiredClass = this.camp ? requiredClassForItem(cell.itemRef) : null;
        const action = cell.itemRef.nest || cell.itemRef.placeable
          ? 'Click to place it' : 'Click to equip · drag to a 1–6 slot or out to drop';
        attachTip(div, this._itemTip(cell.itemRef, { requiredClass, action }));
      } else {
        attachTip(div, this._plainTip(cell.title));
      }
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
        if (cell.kind === 'item') document.body.classList.add('slotting');
        ghost = div.cloneNode(true);
        ghost.className = 'inv-cell drag-ghost';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = (e.clientX - 24) + 'px';
        ghost.style.top = (e.clientY - 24) + 'px';
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.spell-slot');
        document.querySelectorAll('.spell-slot.drop-hot').forEach(s => s.classList.remove('drop-hot'));
        over?.classList.add('drop-hot');
      }
    };
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ghost?.remove();
      document.body.classList.remove('slotting');
      document.querySelectorAll('.spell-slot.drop-hot').forEach(s => s.classList.remove('drop-hot'));
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

  // Spellbook abilities: click toggles in/out of the bar, DRAG drops the
  // ability onto a specific 1–6 slot (this is what the first-time hint teaches).
  _wireSpellDrag(div, id) {
    let ghost = null, dragging = false, sx = 0, sy = 0;
    const onMove = (e) => {
      if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        dragging = true;
        // lift the 1–6 bar above the modal and enlarge its slots as drop targets
        document.body.classList.add('slotting');
        ghost = div.cloneNode(true);
        ghost.className = 'inv-item drag-ghost spell-drag-ghost';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = (e.clientX - 30) + 'px';
        ghost.style.top = (e.clientY - 20) + 'px';
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.spell-slot');
        document.querySelectorAll('.spell-slot.drop-hot').forEach(s => s.classList.remove('drop-hot'));
        over?.classList.add('drop-hot');
      }
    };
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ghost?.remove();
      document.body.classList.remove('slotting');
      document.querySelectorAll('.spell-slot.drop-hot').forEach(s => s.classList.remove('drop-hot'));
      if (!dragging) { this.hooks.onToggleSpell(id); return; }
      const barSlot = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.spell-slot');
      if (barSlot) {
        this.hooks.onAssignSlot?.(Number(barSlot.dataset.slot), id);
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
    const classReset = document.createElement('div');
    classReset.className = 'card owned';
    classReset.style.gridColumn = '1 / -1';
    const spent = Object.values(this.player.classTraining || {}).reduce((sum, rank) => sum + (Number(rank) || 0), 0);
    const selected = classTreeById(this.player.selectedClass);
    classReset.innerHTML = `<div class="card-head"><span class="icon">🧬</span>
      <span class="name">Reset class tree</span><span class="lv">${selected ? `${selected.icon} ${selected.name} · ` : ''}${spent} ranks</span></div>
      <div class="desc">Clears the selected class and all trained skills. Spent meat is not refunded; every rank must be trained again.</div>
      <div class="card-foot"><button class="buy-btn danger" data-home-class-reset="1" ${selected ? '' : 'disabled'}>
        🔄 Reset class — no refund
      </button></div>`;
    wrap.appendChild(classReset);
    classReset.querySelector('[data-home-class-reset]')?.addEventListener('click', () =>
      this.hooks.onResetClass?.());
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
      const lvl = enemyTypicalLevel(type);
      const hp = Math.round(ENEMY_HP(lvl) * (cfg.hpMult ?? 1));
      const dmg = Math.round(ENEMY_DMG(lvl) * (cfg.dmgMult ?? 1));
      const xp = Math.round(xpKillFor(lvl) * (cfg.xpMult ?? 1));
      card.innerHTML = known
        ? `<div class="card-head"><span class="icon">${cfg.icon}</span><span class="name">${cfg.name}</span><span class="mob-level">Lv ${lvl}</span></div>
           <div class="desc">❤️ ${hp} · ⚔️ ${dmg} · ⭐ ${xp} XP · 🍖 ${meatForLevel(lvl, cfg.hpMult ?? 1)}</div>`
        : `<div class="card-head"><span class="icon">❓</span><span class="name">???</span></div>
           <div class="desc">Not discovered yet. Travel further north…</div>`;
      wrap.appendChild(card);
    }
  }
}
