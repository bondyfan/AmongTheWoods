// ---- HUD, spellbar, floating popups, boss labels, toasts, menus ----

import * as THREE from 'three';
import { XP_LEVELS, MAX_LEVEL, MAX_SPELL_SLOTS, SLOT_KEYS, ENEMY_TYPES, RES_ICONS,
         WEAPON_RING_SLOT, WEAPON_RING_MAX, ringPlace, consumableById,
         fmtResource, itemById, spellById, classSkillById, classActiveInfo } from './config.js';
import { itemIcon, skillArt } from './icons.js';
import { attachTip } from './tooltip.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);
export const MOB_INFO_RADIUS = 60;

export function mobLevelBadge(level) {
  const value = Math.max(1, Math.round(Number(level) || 1));
  return `<span class="mob-level" data-level="${value}" title="Level ${value}" aria-label="Level ${value}">`
    + `<span class="mob-level-icon" aria-hidden="true">◆</span>${value}</span>`;
}

function updateMobLevelBadge(el, playerLevel) {
  const level = Number(el.dataset.level) || 1;
  const delta = level - playerLevel;
  // WoW-style con colors over the 1-50 span: grey / even / orange / red
  const tier = delta <= -3 ? 'low' : delta <= 2 ? 'tough' : delta <= 5 ? 'dangerous' : 'deadly';
  el.classList.remove('low', 'tough', 'dangerous', 'deadly');
  el.classList.add(tier);
  el.title = `Level ${level} · ${delta > 0 ? '+' + delta : delta} vs you`;
}

export class UI {
  constructor(hooks) {
    this.hooks = hooks; // { onStart, onCastSpell(i) }
    this.popups = [];
    this.trackers = new Map(); // key -> { el, getPos }
    this.resourceKeys = [];
    this.playerLevel = 1;

    $('start-btn').addEventListener('click', () => {
      audio.sfx('click', 0.5);
      // the menu stays up until the run actually begins: onStart may first ask
      // WHICH character to play (and the player can still back out).
      // startPlaying() → hideMenu() does the swap for every mode.
      hooks.onStart();
    });
    $('restart-btn').addEventListener('click', () => location.reload());

    // spellbar: click casts, dragging a filled slot reorders (or drags it off)
    $('spellbar').addEventListener('click', (e) => {
      if (performance.now() < (this._slotClickSuppressUntil || 0)) return; // was a drag
      const slot = e.target.closest('.spell-slot');
      if (slot) hooks.onCastSpell(Number(slot.dataset.slot));
    });
    $('spellbar').addEventListener('pointerdown', (e) => {
      const slot = e.target.closest('.spell-slot');
      if (!slot) return;
      // A ring cell is its own little drag source: pulling one off the bar
      // removes THAT weapon rather than clearing the whole ring.
      const ringCell = e.target.closest('.ring-cell');
      if (ringCell) { this._dragRingCell(e, slot, Number(ringCell.dataset.ringIndex)); return; }
      // A phone has no hover, so the ring could be filled but never emptied.
      // Tapping Q pins its fan open; tapping again (or using it) closes it.
      if (Number(slot.dataset.slot) === WEAPON_RING_SLOT
          && window.matchMedia?.('(pointer: coarse)').matches) {
        slot.toggleAttribute('data-fan');
        this._slotClickSuppressUntil = performance.now() + 250;
        audio.sfx('click', 0.3);
        return;
      }
      const i = Number(slot.dataset.slot);
      let ghost = null, dragging = false;
      const sx = e.clientX, sy = e.clientY;
      const onMove = (ev) => {
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
          if (!this._player?.spellSlots?.[i]) return; // empty slots don't drag
          dragging = true;
          ghost = slot.cloneNode(true);
          ghost.classList.add('drag-ghost');
          document.body.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.left = (ev.clientX - 26) + 'px';
          ghost.style.top = (ev.clientY - 26) + 'px';
        }
      };
      const onUp = (ev) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        ghost?.remove();
        if (!dragging) return;
        this._slotClickSuppressUntil = performance.now() + 200;
        const slots = this._player.spellSlots;
        const other = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.spell-slot');
        if (other) { // swap the two slots
          const j = Number(other.dataset.slot);
          // Q owns the weapon RING (an array); letting a reorder move that array
          // into a numbered slot — or bury a spell inside Q — would break every
          // reader that assumes only Q holds a list.
          if (i === WEAPON_RING_SLOT || j === WEAPON_RING_SLOT) {
            audio.sfx('error', 0.35);
            return;
          }
          while (slots.length <= Math.max(i, j)) slots.push(undefined);
          [slots[i], slots[j]] = [slots[j], slots[i]];
        } else slots[i] = undefined; // dragged off the bar → unslot (Q: clears the ring)
        localStorage.setItem('woods_slot_hint_done', '1');
        audio.sfx('click', 0.4);
        // Repaint NOW. While a panel is open the game is paused in solo, so the
        // per-frame updateSpellbar never runs — without this the slot kept its
        // icon after being emptied and its key silently did nothing.
        this.updateSpellbar(this._player);
        this.onSlotsChanged?.();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    this._menuMusicHook();
  }

  _dragRingCell(e, slot, k) {
    const ring = this._player?.spellSlots?.[WEAPON_RING_SLOT];
    if (!Array.isArray(ring) || !ring[k]) return;
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, dragging = false;
    const onMove = (ev) => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
        dragging = true;
        ghost = document.createElement('div');
        ghost.className = 'spell-slot drag-ghost';
        ghost.innerHTML = `<span class="spell-icon">${slot.querySelector('.ring-cell[data-ring-index="' + k + '"]')?.innerHTML ?? ''}</span>`;
        document.body.appendChild(ghost);
      }
      if (ghost) { ghost.style.left = (ev.clientX - 26) + 'px'; ghost.style.top = (ev.clientY - 26) + 'px'; }
    };
    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ghost?.remove();
      if (!dragging) return;
      this._slotClickSuppressUntil = performance.now() + 200;
      const onBar = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('#actionbar');
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.ring-cell');
      if (target) {                       // reorder inside the ring
        this._player.spellSlots[WEAPON_RING_SLOT] =
          ringPlace(ring, ring[k], Number(target.dataset.ringIndex));
      } else if (!onBar) {                // dragged clean off — remove it
        this._player.spellSlots[WEAPON_RING_SLOT] = ring.filter((_, n) => n !== k);
      } else return;                      // released on the bar but nowhere useful
      audio.sfx('click', 0.4);
      this.updateSpellbar(this._player);
      this.onSlotsChanged?.();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _menuMusicHook() {
    // The FIRST touch anywhere unlocks the audio context. iOS keeps it suspended
    // until a gesture, and every sound effect goes through it — so without this
    // the game is silent no matter how well the buffers decoded.
    const unlockOnce = () => { audio.unlock(); };
    window.addEventListener('pointerdown', unlockOnce, { once: false });
    window.addEventListener('touchstart', unlockOnce, { once: false, passive: true });
    window.addEventListener('keydown', unlockOnce, { once: false });

    // menu music needs a user gesture
    const tryMenuMusic = () => {
      if ($('menu').classList.contains('hidden')) return;
      audio.playMusic('mainmenu');
      window.removeEventListener('pointerdown', tryMenuMusic);
    };
    window.addEventListener('pointerdown', tryMenuMusic);
  }

  hideMenu() {
    $('menu').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('actionbar').classList.remove('hidden');
  }

  setTrackedResources(keys) {
    this.resourceKeys = Array.isArray(keys) ? [...keys] : [];
    this._resourceMarkup = '';
  }

  // when true, a tracked resource sitting at 0 is hidden from the HUD
  setHideZeroResources(v) {
    this.hideZeroRes = !!v;
    this._resourceMarkup = '';
  }

  // ---------- HUD ----------
  updateHUD(player, progressPct, biomeName, survival = true) {
    if (this.playerLevel !== player.level) {
      this.playerLevel = player.level;
      document.querySelectorAll('.mob-level').forEach(el => updateMobLevelBadge(el, this.playerLevel));
    }
    $('hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
    $('hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    // energy: every class spends it per swing. mana: casters only.
    const maxEn = Math.max(1, player.maxEnergy || 100);
    $('energy-bar').style.width = ((player.energy ?? maxEn) / maxEn * 100) + '%';
    $('energy-text').textContent = `⚡ ${Math.floor(player.energy ?? maxEn)} / ${maxEn}`;
    const manaWrap = this._manaWrap ||= document.querySelector('.bar-wrap.mana');
    const hasMana = (player.maxMana || 0) > 0;
    manaWrap.classList.toggle('hidden', !hasMana);
    if (hasMana) {
      const maxMp = Math.max(1, player.maxMana);
      $('mana-bar').style.width = ((player.mana ?? maxMp) / maxMp * 100) + '%';
      $('mana-text').textContent = `💧 ${Math.floor(player.mana ?? maxMp)} / ${maxMp}`;
    }
    // minimalist windup bar: fills while the weapon rises, gone on impact
    const sw = $('swing-bar-wrap');
    if (sw) {
      const wu = player.swingWindup;
      sw.classList.toggle('hidden', !wu);
      if (wu) $('swing-bar').style.width = ((1 - Math.max(0, wu.t) / wu.dur) * 100) + '%';
    }
    $('xp-bar').style.width = (player.xpProgress() * 100) + '%';
    $('level-text').textContent = player.level >= MAX_LEVEL
      ? `Lv ${player.level} (MAX)`
      : `Lv ${player.level} — ${player.xp}/${XP_LEVELS[player.level + 1]} XP`;
    $('biome-name').textContent = biomeName;

    const questEl = $('active-quest');
    const q = survival ? player.quest : null;
    if (q) {
      let target = q.name || 'Quest';
      if (q.type === 'kill' && ENEMY_TYPES[q.target]) {
        const enemy = ENEMY_TYPES[q.target];
        target = `${enemy.icon} ${enemy.name}`;
      } else if (q.type === 'gather' && q.res) {
        target = `${RES_ICONS[q.res] ?? '🎒'} ${q.res[0].toUpperCase()}${q.res.slice(1)}`;
      } else if (q.type === 'killAny') target = '⚔️ Creatures';
      else if (q.type === 'boss') target = '💀 Pack mother';
      questEl.textContent = `${target}  ${fmtResource(q.count ?? 0)}/${fmtResource(q.need ?? 0)}`;
      questEl.classList.remove('hidden');
    } else questEl.classList.add('hidden');

    const resourceEl = $('resource-hud');
    const shownKeys = this.hideZeroRes
      ? this.resourceKeys.filter(key => (player[key] || 0) > 0)
      : this.resourceKeys;
    if (survival && shownKeys.length) {
      const markup = shownKeys.map(key =>
        `<span class="hud-resource" title="${key}">${RES_ICONS[key] ?? ''} ${fmtResource(player[key])}</span>`).join('');
      if (markup !== this._resourceMarkup) {
        resourceEl.innerHTML = markup;
        this._resourceMarkup = markup;
      }
      resourceEl.classList.remove('hidden');
    } else resourceEl.classList.add('hidden');

    const weapon = itemById(player.equipment.weapon);
    const combat = [];
    if (player.blocking) combat.push(player.weapon.parry ? 'PARRY' : 'BLOCK');
    if (player.weapon.style === 'bow') combat.push(`${player.arrowMode.toUpperCase()} · Z`);
    // durability: silent while healthy, an amber count when low, red when broken
    const wearLeft = player.weaponWearLeft?.(player.equipment.weapon);
    let dur = '';
    if (player.weaponBrokenNow) dur = ' <span style="color:#ff6b5e">💔 BROKEN — smith repairs free</span>';
    else if (Number.isFinite(wearLeft) && wearLeft <= 40) dur = ` <span style="color:#ffcc66">⚠ ${wearLeft}</span>`;
    $('weapon-display').innerHTML = `${itemIcon(weapon)} ${weapon.name}${dur}`
      + `<span class="combat-state">${combat.join(' · ')}</span>`;

    this.updateBuffBar(player);

    // critical health: pulsing bar + red screen edges
    const critHp = !player.dead && player.hp > 0 && player.hp < player.maxHp * 0.2;
    document.querySelector('.bar-wrap.hp').classList.toggle('crit', critHp);
    $('lowhp').classList.toggle('hidden', !critHp);

    // pet status line — the P/R controls are invisible without it
    const petEl = $('pet-display');
    const MODES = { aggressive: '🗡️ Aggressive', defensive: '🛡️ Defensive', passive: '💤 Passive' };
    if (player.impActive) {
      // the Mage's Fire Imp: a stance-obeying combat pet (no resurrect — recast)
      petEl.classList.remove('hidden');
      petEl.innerHTML = `👺 Fire Imp · ${MODES[player.petMode] ?? player.petMode} <kbd>P</kbd>`;
    } else if (player.tamedPet) {
      petEl.classList.remove('hidden');
      const nm = player.tamedPet.name || 'Pet';
      petEl.innerHTML = player.petDead
        ? `🐾 ${nm} 💀 <i>down</i> — revive at home/graveyard <kbd>R</kbd>`
        : `🐾 ${nm} · ${MODES[player.petMode] ?? player.petMode} <kbd>P</kbd>`;
    } else petEl.classList.add('hidden');

    // carried supplies (F/G consumables)
    const supEl = $('supply-display');
    const { salve = 0, roast = 0 } = player.consumables ?? {};
    if (salve > 0 || roast > 0) {
      supEl.classList.remove('hidden');
      supEl.innerHTML = `${salve > 0 ? `🧪×${salve} <kbd>F</kbd>` : ''} ${roast > 0 ? `🍗×${roast} <kbd>G</kbd>` : ''}`;
    } else supEl.classList.add('hidden');

    this.updateSpellbar(player);
  }

  // quick visual confirmation that a spell actually fired
  flashSpell(slotIndex) {
    const el = $('spellbar').children[slotIndex];
    if (!el) return;
    el.classList.remove('cast');
    void el.offsetWidth;
    el.classList.add('cast');
  }

  // level-up: golden screen-edge flash (the 3D ring gets lost in combat)
  goldFlash() {
    const el = $('gold-flash');
    el.classList.remove('anim');
    void el.offsetWidth;
    el.classList.add('anim');
  }

  // active timed self-buffs, shown just above the weapon indicator. Each cell
  // is an icon with a fill that DRAINS as the buff counts down + a seconds
  // readout (or the shield amount for the absorb pool).
  updateBuffBar(player) {
    const bar = $('buff-bar');
    if (!bar) return;
    const buffs = player.activeBuffs?.() || [];
    // reconcile cells by id (keeps the pop-in animation stable frame to frame)
    const seen = new Set();
    for (const b of buffs) {
      seen.add(b.id);
      let el = this._buffCells?.get(b.id);
      if (!el) {
        this._buffCells ??= new Map();
        el = document.createElement('div');
        el.innerHTML = '<div class="buff-fill"></div><div class="buff-icon"></div><span class="buff-timer"></span>';
        this._buffCells.set(b.id, el);
        bar.appendChild(el);
        el._iconKey = null;
      }
      el.className = 'buff-cell kind-' + b.kind + (b.t != null && b.t <= 3 ? ' expiring' : '');
      const iconKey = b.id + (classSkillById(b.id.replace('orb:', ''))?.type === 'active' ? ':art' : ':emoji');
      if (el._iconKey !== iconKey) {
        el._iconKey = iconKey;
        const art = b.id.startsWith('orb:') ? skillArt(b.id.slice(4), b.icon) : b.icon;
        el.querySelector('.buff-icon').innerHTML = art;
      }
      const fill = el.querySelector('.buff-fill');
      if (b.dur) fill.style.height = Math.max(0, Math.min(100, b.t / b.dur * 100)) + '%';
      else fill.style.height = '100%';
      el.querySelector('.buff-timer').textContent =
        b.t == null ? (b.value ?? '') : Math.ceil(b.t);
    }
    // drop cells whose buff ended
    if (this._buffCells) {
      for (const [id, el] of this._buffCells) {
        if (!seen.has(id)) { el.remove(); this._buffCells.delete(id); }
      }
    }
  }

  // The Q ring holds five weapons behind ONE key, which made it the only slot
  // you could add to but never edit: no way to see position 3, swap it, or drop
  // a specific one. So Q fans out into its five places — always on hover, and
  // automatically while a weapon is being dragged, so there is somewhere to aim.
  _paintRingFan(el, ring, player) {
    let fan = el.querySelector('.ring-fan');
    if (!fan) {
      fan = document.createElement('div');
      fan.className = 'ring-fan';
      // Open on hover by TOGGLING THE ATTRIBUTE rather than relying on the CSS
      // :hover rule. The bar sits over a canvas the game is constantly
      // re-rendering and the pointer spends its life being read by mouse-look;
      // pointerenter/leave fire reliably where :hover was not being delivered at
      // all. Same attribute the touch tap uses, so there is one open/closed state.
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'touch') el.setAttribute('data-fan', '');
      });
      el.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'touch') el.removeAttribute('data-fan');
      });
      // the caption carries what the old (fan-covering) tooltip used to say
      const cap = document.createElement('div');
      cap.className = 'ring-cap';
      cap.textContent = 'Q swaps · drag to rearrange';
      fan.appendChild(cap);
      el.appendChild(fan);
    }
    for (let k = 0; k < WEAPON_RING_MAX; k++) {
      let cell = fan.children[k + 1];   // children[0] is the caption
      if (!cell) {
        cell = document.createElement('div');
        cell.className = 'ring-cell';
        cell.dataset.ringIndex = k;
        fan.appendChild(cell);
      }
      const id = ring[k];
      const it = id ? itemById(id) : null;
      cell.classList.toggle('empty', !it);
      cell.classList.toggle('equipped-slot', !!it && player.equipment.weapon === id);
      cell.innerHTML = it ? itemIcon(it) : `<span class="ring-num">${k + 1}</span>`;
      cell.title = it ? `${it.name} — drag off to remove` : `Ring slot ${k + 1} — drop a weapon here`;
    }
  }

  updateSpellbar(player) {
    this._player = player; // slot drag-reorder needs it
    const bar = $('spellbar');
    // one-time lesson: an ability is trained but nothing is slotted yet
    const hintEl = $('slot-hint');
    if (hintEl) {
      const need = !localStorage.getItem('woods_slot_hint_done')
        && (player.trainedClassActives?.().length || 0) > 0
        && !player.spellSlots?.some(Boolean);
      hintEl.classList.toggle('hidden', !need);
    }
    for (let i = 0; i < MAX_SPELL_SLOTS; i++) {
      let el = bar.children[i];
      if (!el) {
        el = document.createElement('div');
        el.className = 'spell-slot';
        el.dataset.slot = i;
        el.innerHTML = `<span class="spell-icon"></span><span class="spell-key">${SLOT_KEYS[i] ?? i + 1}</span><div class="spell-cd"></div>`;
        attachTip(el, ' '); // reads el._tipHtml live, refreshed below each frame
        bar.appendChild(el);
      }
      const raw = player.spellSlots[i];
      // The bar folds down to 1-5 and Q while it is empty: twelve blank boxes
      // across the bottom of a phone is a wall of nothing. Anything past 5 that
      // is not Q is OPTIONAL, and optional+empty is hidden until you start
      // dragging something (body.slotting), when they all come back as targets.
      const optional = i > 4 && i !== WEAPON_RING_SLOT;
      el.toggleAttribute('data-optional', optional);
      // Q/R/F take ITEMS as well as abilities — 1-9 are the ability keys. They
      // are marked so the bar can say that visually instead of expecting the
      // player to discover it by dragging something and seeing what sticks.
      el.toggleAttribute('data-gear', i >= WEAPON_RING_SLOT);
      const filled = Array.isArray(raw) ? raw.length > 0 : raw != null;
      el.toggleAttribute('data-empty', !filled);
      const iconEl = el.querySelector('.spell-icon');
      const cdEl = el.querySelector('.spell-cd');
      // ---- Q, the weapon ring ----
      // It holds an ARRAY, and it should show the weapon you are HOLDING so a
      // glance tells you what the next press swaps away from.
      if (i === WEAPON_RING_SLOT && Array.isArray(raw) && raw.length) {
        const shown = raw.includes(player.equipment.weapon) ? player.equipment.weapon : raw[0];
        const it = itemById(shown);
        el.classList.remove('empty', 'class-ability-slot');
        el.classList.toggle('equipped-slot', player.equipment.weapon === shown);
        iconEl.innerHTML = itemIcon(it);
        cdEl.style.height = '0%';
        // NO tooltip on Q. The tooltip follows the cursor, and at the bottom
        // edge of the screen place() flips it ABOVE the cursor — z-index 500,
        // directly on top of the fan (z-index 40). The fan opened every time
        // and was never once seen. The fan IS the ring's information; the only
        // thing the tooltip added was the key hint, which now lives in the fan.
        el._tipHtml = '';
        el.dataset.ring = raw.length;
        this._paintRingFan(el, raw, player);
        continue;
      }
      if (i === WEAPON_RING_SLOT) this._paintRingFan(el, Array.isArray(raw) ? raw : [], player);
      el.removeAttribute('data-ring');
      const id = Array.isArray(raw) ? raw[0] : raw;
      // consumables and the berry stack are slottable, and are neither spells
      // nor equippable items — they get their own card
      const con = id ? consumableById(id) : null;
      if (id === 'berry' || con) {
        const icon = con ? con.icon : '🫐';
        const name = con ? con.name : 'Berries';
        const have = con ? (player.consumables?.[id] ?? 0) : Math.floor(player.berry ?? 0);
        el.classList.remove('empty', 'class-ability-slot', 'equipped-slot');
        iconEl.innerHTML = `<span class="slot-emoji">${icon}</span>`;
        cdEl.style.height = '0%';
        el.classList.toggle('slot-out', have <= 0);
        el._tipHtml = `<div class="tt-head"><span class="tt-ico">${icon}</span>
            <span class="tt-title"><b>${name}</b><span class="tt-sub">${have} held · key ${SLOT_KEYS[i] ?? i + 1}</span></span></div>
          <div class="tt-desc">${con ? con.desc : 'Eat a berry: a small heal and a slug of energy.'}</div>`;
        continue;
      }
      const spell = id ? spellById(id) : null;
      const classAbility = id && !spell ? classSkillById(id) : null;
      const activeClassAbility = classAbility?.type === 'active' ? classAbility : null;
      const ability = spell ?? activeClassAbility;
      const item = id && !ability ? itemById(id) : null;
      if (!ability && !item) {
        el.classList.add('empty');
        iconEl.innerHTML = '';
        cdEl.style.height = '0%';
        el._tipHtml = '<div class="tt-desc" style="margin:0">Empty slot — drag an ability here from the Class tab.</div>';
        el.classList.remove('equipped-slot', 'class-ability-slot');
        continue;
      }
      el.classList.remove('empty');
      iconEl.innerHTML = activeClassAbility
        ? skillArt(id, activeClassAbility.icon)
        : itemIcon(ability ?? item);
      const rank = activeClassAbility ? (player.classRank?.(id) ?? player.classTraining?.[id] ?? 1) : 0;
      el._tipHtml = activeClassAbility
        ? `<div class="tt-head"><span class="tt-ico">${skillArt(id, activeClassAbility.icon)}</span>
            <span class="tt-title"><b>${activeClassAbility.name}</b><span class="tt-sub">⚡ Active · Rank ${rank} · key ${i + 1}</span></span></div>
          <div class="tt-desc">${activeClassAbility.desc}</div>
          <div class="tt-info">${classActiveInfo(activeClassAbility, rank || 1).join(' · ')}</div>
          <div class="tt-hint">Click or press ${i + 1} to cast · drag to reorder</div>`
        : ability
          ? `<div class="tt-head"><span class="tt-ico">${itemIcon(ability)}</span><span class="tt-title"><b>${ability.name}</b></span></div><div class="tt-desc">${ability.desc}</div>`
          : `<div class="tt-head"><span class="tt-ico">${itemIcon(item)}</span><span class="tt-title"><b>${item.name}</b></span></div><div class="tt-desc">Press ${i + 1} to equip.</div>`;
      const cd = ability ? (player.spellCds?.[id] || player.classCds?.[id] || 0) : 0;
      const maxCd = activeClassAbility
        ? (player.classAbilityCooldown?.(id) ?? activeClassAbility.cd)
        : spell?.cd;
      cdEl.style.height = ability && maxCd ? Math.min(100, cd / maxCd * 100) + '%' : '0%';
      el.classList.toggle('ready', ability ? cd <= 0 : true);
      el.classList.toggle('class-ability-slot', !!activeClassAbility);
      // hotkeyed gear glows while it's the equipped piece
      el.classList.toggle('equipped-slot', !!item && player.equipment[item.slot] === id);
    }
  }

  pulseShopButton(on) { $('shop-btn').classList.toggle('pulse', on); }

  // ---------- toasts, banner ----------
  toast(text, cls = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    $('toasts').appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
  }

  banner(text) {
    const el = $('banner');
    el.textContent = text;
    el.classList.remove('hidden', 'anim');
    void el.offsetWidth; // restart the animation
    el.classList.add('anim');
  }

  // ---------- floating combat text ----------
  popup(worldPos, text, color, cls = '') {
    const el = document.createElement('div');
    el.className = 'popup' + (cls ? ' ' + cls : '');
    el.textContent = text;
    el.style.color = color;
    $('popups').appendChild(el);
    // big popups (crits, ENRAGED!) linger a beat longer
    this.popups.push({ el, pos: worldPos.clone(), t: 0,
      life: cls.includes('big') ? 1.5 : cls.includes('pow') ? 0.62 : 1.1 });
  }

  // ---------- persistent world-tracking labels (boss skulls, HP bars) ----------
  addTracker(key, getPos, html, cls = '', onUpdate = null, options = null) {
    const el = document.createElement('div');
    el.className = 'tracker ' + cls;
    el.innerHTML = html;
    el.querySelectorAll('.mob-level').forEach(badge => updateMobLevelBadge(badge, this.playerLevel));
    $('popups').appendChild(el);
    this.trackers.set(key, { el, getPos, onUpdate, worldRadius: options?.worldRadius ?? null });
  }

  removeTracker(key) {
    const t = this.trackers.get(key);
    if (t) { t.el.remove(); this.trackers.delete(key); }
  }

  updateOverlays(dt, camera, viewerPos = null) {
    const v = new THREE.Vector3();
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      const life = p.life ?? 1.1;
      p.t += dt;
      p.pos.y += dt * 1.2;
      v.copy(p.pos).project(camera);
      p.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * window.innerWidth}px, ${(-v.y * 0.5 + 0.5) * window.innerHeight}px)`;
      p.el.style.opacity = Math.max(0, 1 - p.t / life);
      if (p.t > life) { p.el.remove(); this.popups.splice(i, 1); }
    }
    for (const t of this.trackers.values()) {
      const pos = t.getPos();
      if (!pos) { t.el.style.opacity = 0; continue; }
      // unit frames only show close up (matters in RPG view, where the far
      // plane would otherwise plaster the horizon with names and HP bars)
      const usesWorldRadius = t.worldRadius != null && viewerPos;
      const dist = usesWorldRadius
        ? Math.hypot(pos.x - viewerPos.x, pos.z - viewerPos.z)
        : pos.distanceTo(camera.position);
      const maxDist = usesWorldRadius ? t.worldRadius : 100;
      const fadeStart = usesWorldRadius ? Math.max(0, maxDist - 10) : 80;
      if (dist > maxDist) { t.el.style.opacity = 0; continue; }
      v.copy(pos).project(camera);
      if (v.z > 1) { t.el.style.opacity = 0; continue; } // behind the camera
      t.el.style.opacity = dist > fadeStart ? 1 - (dist - fadeStart) / (maxDist - fadeStart) : 1;
      t.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * window.innerWidth}px, ${(-v.y * 0.5 + 0.5) * window.innerHeight}px)`;
      t.onUpdate?.(t.el);
    }
  }

  hurtFlash() {
    const el = $('vignette');
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  showEnd(victory, stats) {
    $('hud').classList.add('hidden');
    $('actionbar').classList.add('hidden');
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    const end = $('endscreen');
    end.classList.remove('hidden');
    $('end-title').textContent = victory ? 'You reached the Frozen Peak!' : 'The woods claimed you…';
    $('end-title').className = victory ? 'win' : 'lose';
    $('end-stats').innerHTML =
      `Level <b>${stats.level}</b> &nbsp;·&nbsp; Kills <b>${stats.kills}</b> &nbsp;·&nbsp; ` +
      `Distance <b>${stats.distance} m</b> &nbsp;·&nbsp; Wood <b>${stats.wood}</b> &nbsp;·&nbsp; Time <b>${stats.time}</b>`;
  }

  setPaused(on) { $('paused').classList.toggle('hidden', !on); }
}
