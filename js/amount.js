// ---- "how many?" ---------------------------------------------------------
// Two places in the game used to move a stack all-or-nothing: dragging a
// resource out of the inventory always threw exactly 5 on the ground, and the
// chest only had Deposit all / Withdraw all. Both are the same question asked
// twice, so they ask it through one popup.
//
// It opens where the pointer already is, and the keyboard works the way muscle
// memory expects: type a number, Enter to confirm, Escape to back out. The
// quick chips are there because 1 and All are what you actually want nine
// times out of ten and neither should cost a keystroke.

let openPop = null;

// close whatever is open, reporting `n` (null = cancelled)
function settle(n) {
  const p = openPop;
  if (!p) return;
  openPop = null;
  window.removeEventListener('pointerdown', p.onOutside, true);
  window.removeEventListener('keydown', p.onKey, true);
  p.el.remove();
  p.done(n);
}

export function closeAmountPicker() { settle(null); }
export function amountPickerOpen() { return !!openPop; }

/**
 * Ask for a whole number in 1..max.
 *
 * @param {object} o
 * @param {number} o.max    the most that can be moved — the input is clamped
 * @param {number} [o.x]    where to open (defaults to the middle of the screen)
 * @param {number} [o.y]
 * @param {string} [o.title]  what is being moved, e.g. "Drop wood"
 * @param {string} [o.icon]   an emoji or <img> to show beside the count
 * @param {string} [o.verb]   the confirm button's label
 * @param {function(number|null)} done  called with the amount, or null
 */
export function askAmount(o, done) {
  settle(null);                       // never stack two of these
  const max = Math.max(1, Math.floor(o.max || 1));
  // one is not a choice
  if (max <= 1) { done(1); return; }

  const el = document.createElement('div');
  el.className = 'amount-pop';
  el.innerHTML = `
    <div class="amount-title">${o.icon ? `<span class="amount-icon">${o.icon}</span>` : ''}
      <span>${o.title || 'How many?'}</span>
      <span class="amount-max">of ${max}</span></div>
    <div class="amount-row">
      <button class="amount-step" data-step="-1" aria-label="one less">−</button>
      <input class="amount-input" type="number" min="1" max="${max}" value="1" inputmode="numeric">
      <button class="amount-step" data-step="1" aria-label="one more">+</button>
    </div>
    <input class="amount-slider" type="range" min="1" max="${max}" value="1">
    <div class="amount-chips">
      <button data-set="1">1</button>
      <button data-set="5">5</button>
      <button data-set="half">Half</button>
      <button data-set="all">All</button>
    </div>
    <div class="amount-foot">
      <button class="amount-cancel">Cancel</button>
      <button class="amount-ok">${o.verb || 'Drop'} <b class="amount-n">1</b></button>
    </div>`;
  document.body.appendChild(el);

  // Placed after it is in the DOM so the measured size is the real one, then
  // pulled back inside the viewport — opening at the cursor near the right or
  // bottom edge otherwise puts half the popup off-screen.
  const w = el.offsetWidth, h = el.offsetHeight;
  const x = o.x == null ? (innerWidth - w) / 2 : o.x - w / 2;
  const y = o.y == null ? (innerHeight - h) / 2 : o.y - h - 14;
  el.style.left = Math.round(Math.min(Math.max(8, x), innerWidth - w - 8)) + 'px';
  el.style.top = Math.round(Math.min(Math.max(8, y), innerHeight - h - 8)) + 'px';

  const input = el.querySelector('.amount-input');
  const slider = el.querySelector('.amount-slider');
  const nLabel = el.querySelector('.amount-n');
  let n = 1;

  const set = (v) => {
    n = Math.min(max, Math.max(1, Math.floor(Number(v) || 1)));
    input.value = String(n);
    slider.value = String(n);
    nLabel.textContent = String(n);
  };

  input.addEventListener('input', () => {
    // do NOT clamp mid-typing: "12" passes through "1", and snapping the field
    // back would make anything above a single digit impossible to type
    const v = Number(input.value);
    if (input.value === '' || !Number.isFinite(v)) return;
    n = Math.min(max, Math.max(1, Math.floor(v)));
    slider.value = String(n);
    nLabel.textContent = String(n);
  });
  input.addEventListener('blur', () => set(input.value));
  slider.addEventListener('input', () => set(slider.value));
  el.querySelectorAll('.amount-step').forEach(b =>
    b.addEventListener('click', () => set(n + Number(b.dataset.step))));
  el.querySelectorAll('.amount-chips button').forEach(b =>
    b.addEventListener('click', () => {
      const k = b.dataset.set;
      set(k === 'all' ? max : k === 'half' ? Math.max(1, Math.floor(max / 2)) : Number(k));
    }));

  el.querySelector('.amount-cancel').addEventListener('click', () => settle(null));
  el.querySelector('.amount-ok').addEventListener('click', () => settle(n));

  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); settle(null); }
    else if (e.key === 'Enter') { e.stopPropagation(); settle(n); }
    // the game listens for plain letters, and typing into this field must not
    // also swing the axe or open the map
    else e.stopPropagation();
  };
  const onOutside = (e) => { if (!el.contains(e.target)) settle(null); };
  // capture, and registered on the NEXT frame — the pointerup that opened this
  // popup is still in flight and would close it instantly
  window.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() =>
    openPop && window.addEventListener('pointerdown', onOutside, true));

  openPop = { el, done, onKey, onOutside };
  input.focus();
  input.select();
}
