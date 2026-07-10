// ---- HUD, spellbar, floating popups, boss labels, toasts, menus ----

import * as THREE from 'three';
import { WORLD, XP_LEVELS, MAX_LEVEL, MAX_SPELL_SLOTS, fmtResource, itemById, spellById } from './config.js';
import { itemIcon } from './icons.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(hooks) {
    this.hooks = hooks; // { onStart, onCastSpell(i) }
    this.popups = [];
    this.trackers = new Map(); // key -> { el, getPos }

    $('start-btn').addEventListener('click', () => {
      audio.sfx('click', 0.5);
      this.hideMenu();
      hooks.onStart();
    });
    $('restart-btn').addEventListener('click', () => location.reload());

    // spellbar clicks
    $('spellbar').addEventListener('click', (e) => {
      const slot = e.target.closest('.spell-slot');
      if (slot) hooks.onCastSpell(Number(slot.dataset.slot));
    });

    // menu music needs a user gesture
    const tryMenuMusic = () => {
      if ($('menu').classList.contains('hidden')) return;
      audio.playMusic('mainmenu');
      window.removeEventListener('pointerdown', tryMenuMusic);
    };
    window.addEventListener('pointerdown', tryMenuMusic);
  }

  hideMenu() { $('menu').classList.add('hidden'); $('hud').classList.remove('hidden'); }

  // ---------- HUD ----------
  updateHUD(player, progressPct, biomeName) {
    $('hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
    $('hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    $('xp-bar').style.width = (player.xpProgress() * 100) + '%';
    $('level-text').textContent = player.level >= MAX_LEVEL
      ? `Lv ${player.level} (MAX)`
      : `Lv ${player.level} — ${player.xp}/${XP_LEVELS[player.level + 1]} XP`;
    $('progress-bar').style.width = (progressPct * 100) + '%';
    $('progress-text').textContent = `${Math.round(progressPct * WORLD.goalR)} m / ${WORLD.goalR} m from home`;
    $('biome-name').textContent = biomeName;

    const weapon = itemById(player.equipment.weapon);
    $('weapon-display').innerHTML = `${itemIcon(weapon)} ${weapon.name} <kbd>Q</kbd>`;

    // critical health: pulsing bar + red screen edges
    const critHp = !player.dead && player.hp > 0 && player.hp < player.maxHp * 0.2;
    document.querySelector('.bar-wrap.hp').classList.toggle('crit', critHp);
    $('lowhp').classList.toggle('hidden', !critHp);

    // pet status line — the P/R controls are invisible without it
    const petEl = $('pet-display');
    if (itemById(player.equipment.companion)?.pet) {
      petEl.classList.remove('hidden');
      const MODES = { aggressive: '🗡️ Aggressive', defensive: '🛡️ Defensive', passive: '💤 Passive' };
      petEl.innerHTML = player.petDead
        ? '🐺 💀 <i>down</i> — revive at home/graveyard <kbd>R</kbd>'
        : `🐺 ${MODES[player.petMode] ?? player.petMode} <kbd>P</kbd>`;
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

  updateSpellbar(player) {
    const bar = $('spellbar');
    for (let i = 0; i < MAX_SPELL_SLOTS; i++) {
      let el = bar.children[i];
      if (!el) {
        el = document.createElement('div');
        el.className = 'spell-slot';
        el.dataset.slot = i;
        el.innerHTML = `<span class="spell-icon"></span><span class="spell-key">${i + 1}</span><div class="spell-cd"></div>`;
        bar.appendChild(el);
      }
      const id = player.spellSlots[i];
      const iconEl = el.querySelector('.spell-icon');
      const cdEl = el.querySelector('.spell-cd');
      const spell = id ? spellById(id) : null;
      const item = id && !spell ? itemById(id) : null;
      if (!spell && !item) {
        el.classList.add('empty');
        iconEl.innerHTML = '';
        cdEl.style.height = '0%';
        el.title = '';
        el.classList.remove('equipped-slot');
        continue;
      }
      el.classList.remove('empty');
      iconEl.innerHTML = itemIcon(spell ?? item);
      el.title = spell
        ? `${spell.name} — ${spell.desc}`
        : `${item.name} — press ${i + 1} to equip`;
      const cd = spell ? (player.spellCds[id] || 0) : 0;
      cdEl.style.height = spell ? (cd / spell.cd * 100) + '%' : '0%';
      el.classList.toggle('ready', spell ? cd <= 0 : true);
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
    this.popups.push({ el, pos: worldPos.clone(), t: 0, life: cls.includes('big') ? 1.5 : 1.1 });
  }

  // ---------- persistent world-tracking labels (boss skulls, HP bars) ----------
  addTracker(key, getPos, html, cls = '', onUpdate = null) {
    const el = document.createElement('div');
    el.className = 'tracker ' + cls;
    el.innerHTML = html;
    $('popups').appendChild(el);
    this.trackers.set(key, { el, getPos, onUpdate });
  }

  removeTracker(key) {
    const t = this.trackers.get(key);
    if (t) { t.el.remove(); this.trackers.delete(key); }
  }

  updateOverlays(dt, camera) {
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
      v.copy(pos).project(camera);
      t.el.style.opacity = 1;
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
