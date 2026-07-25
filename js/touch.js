// ---- On-screen touch controls (phones / tablets) ----
// A left analog move-stick + right ATTACK / BLOCK buttons, and a burger that
// tucks the HUD's menu buttons away. Everything feeds js/input.js exactly the
// way the keyboard/mouse does, so the rest of the game needs no mobile branch.
// The UI stays hidden until the first real touch, so desktop is untouched.

import { input } from './input.js';

const $ = (id) => document.getElementById(id);

export function initTouch(game) {
  const ui = $('touch-ui');
  const stick = $('tc-stick'), knob = $('tc-knob');
  const attackBtn = $('tc-attack'), blockBtn = $('tc-block');
  const burger = $('burger-btn');
  if (!ui || !stick) return;

  const coarse = matchMedia('(pointer: coarse)').matches
    || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  // reveal the controls (and flip the game into touch mode) on first contact
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    game.touch = true;
    document.body.classList.add('touch');
    ui.classList.remove('hidden');
  };
  if (coarse) {
    // arm on the very first touch anywhere, so the sticks appear immediately
    window.addEventListener('touchstart', reveal, { once: true, passive: true });
  }

  // ---- move stick: drag within a radius, normalized direction into input ----
  const R = 52;                 // knob travel radius (px)
  const DEAD = 0.18;            // ignore tiny wobbles
  let stickId = null, cx = 0, cy = 0;

  const setStick = (nx, nz) => {
    const mag = Math.hypot(nx, nz);
    if (mag < DEAD) { input.touch.active = false; input.touch.mx = 0; input.touch.mz = 0; return; }
    // top of the screen is -z (forward), matching WASD/ArrowUp
    input.touch.active = true;
    input.touch.mx = nx;
    input.touch.mz = nz;
    input.touchAim.x = nx; input.touchAim.z = nz;
  };

  const stickStart = (e) => {
    reveal();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    stickId = e.changedTouches ? t.identifier : 'mouse';
    const r = stick.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    stickMove(e);
  };
  const stickMove = (e) => {
    if (stickId === null) return;
    let t;
    if (e.changedTouches) {
      t = [...e.changedTouches].find(c => c.identifier === stickId);
      if (!t) return;
    } else t = e;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const d = Math.hypot(dx, dy);
    const cl = Math.min(d, R);
    const ux = d ? dx / d : 0, uy = d ? dy / d : 0;
    knob.style.transform = `translate(${ux * cl}px, ${uy * cl}px)`;
    setStick((cl / R) * ux, (cl / R) * uy);
    e.preventDefault?.();
  };
  const stickEnd = (e) => {
    if (e.changedTouches && ![...e.changedTouches].some(c => c.identifier === stickId)) return;
    stickId = null;
    knob.style.transform = 'translate(0,0)';
    input.touch.active = false; input.touch.mx = 0; input.touch.mz = 0;
  };
  stick.addEventListener('touchstart', stickStart, { passive: false });
  stick.addEventListener('touchmove', stickMove, { passive: false });
  stick.addEventListener('touchend', stickEnd);
  stick.addEventListener('touchcancel', stickEnd);
  // mouse fallback so the stick is testable on a desktop browser too
  stick.addEventListener('mousedown', (e) => { stickStart(e); const mm = (ev) => stickMove(ev);
    const mu = () => { stickEnd({}); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); });

  // ---- hold-to-attack / hold-to-block buttons ----
  const holdBtn = (btn, set) => {
    const down = (e) => { reveal(); set(true); btn.classList.add('held'); e.preventDefault?.(); };
    const up = (e) => { set(false); btn.classList.remove('held'); e.preventDefault?.(); };
    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up);
    btn.addEventListener('touchcancel', up);
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  };
  holdBtn(attackBtn, (v) => { input.touchAttack = v; });
  holdBtn(blockBtn, (v) => { input.touchBlock = v; });

  // ---- look-drag: a finger anywhere on the world turns the camera ----
  // Feeds the SAME input.dragX/dragY the desktop mouse-look writes, so the
  // chase camera needs no mobile branch. It tracks its own touch id, so the
  // left thumb can keep steering the stick while the right thumb looks around.
  const UI_SEL = 'button, .panel, .spell-slot, #minimap, #minimap-zoom, #tc-stick,'
    + ' #tc-actions, #touch-ui, #hud-buttons, input, select, textarea, a';
  let lookId = null, lx = 0, ly = 0, lookMoved = 0;

  const lookStart = (e) => {
    if (lookId !== null) return;
    for (const t of e.changedTouches) {
      if (t.target?.closest?.(UI_SEL)) continue;   // never steal a UI tap
      reveal();
      lookId = t.identifier; lx = t.clientX; ly = t.clientY; lookMoved = 0;
      break;
    }
  };
  const lookMove = (e) => {
    if (lookId === null) return;
    const t = [...e.changedTouches].find(c => c.identifier === lookId);
    if (!t) return;
    const dx = t.clientX - lx, dy = t.clientY - ly;
    lx = t.clientX; ly = t.clientY;
    lookMoved += Math.abs(dx) + Math.abs(dy);
    // same units as mouse movementX/Y, so the existing sensitivity applies
    input.dragX += dx;
    input.dragY += dy;
    // once it is a genuine drag, swallow it so the browser neither scrolls nor
    // synthesises a mousedown (which would land as an attack)
    if (lookMoved > 6) e.preventDefault();
  };
  const lookEnd = (e) => {
    if (![...e.changedTouches].some(c => c.identifier === lookId)) return;
    lookId = null;
  };
  window.addEventListener('touchstart', lookStart, { passive: true });
  window.addEventListener('touchmove', lookMove, { passive: false });
  window.addEventListener('touchend', lookEnd, { passive: true });
  window.addEventListener('touchcancel', lookEnd, { passive: true });

  // ---- burger: toggle the HUD button column ----
  if (burger) {
    burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
    // opening any panel closes the burger tray so it isn't in the way
    for (const id of ['shop-btn', 'char-btn', 'bestiary-btn', 'settings-btn', 'help-btn', 'base-btn']) {
      $(id)?.addEventListener('click', () => document.body.classList.remove('menu-open'));
    }
  }
}
