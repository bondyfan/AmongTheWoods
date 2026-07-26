// ==========================================================================
// "UPDATE AVAILABLE" watchdog.
//
// A player who keeps a tab open for hours is running whatever code (and
// whatever world map) they happened to load. When a new build is deployed, or
// the admin saves a new map version, that tab is stale: its JS no longer
// matches the live data, which shows up as subtle desyncs rather than a clean
// error. So every few minutes we ask the server what it's serving now and, if
// it moved, put up a BLOCKING modal — the run can be saved, but not continued
// on stale code.
//
// Two independent signals, either one triggers:
//   1. BUILD — the entry <script src> in index.html (Vite content-hashes it,
//      so the filename itself is the build id). Compared against the script
//      this very document loaded, so it needs no build-time constant.
//   2. MAP — the cloud world-patch version id (worldsync `current.id`) vs the
//      one this session booted with.
//
// Disabled in dev (no hashed bundles, and the admin is the one saving).
// ==========================================================================

import { fetchCurrent, getLoadedVersion } from './worldsync.js';

const CHECK_MS = 5 * 60 * 1000;

// what this document actually loaded — the live build's fingerprint. Prefer the
// hashed /assets/ bundle: a page can carry other module scripts (dev injects
// /@vite/client first), and only the hashed one changes per deploy.
function entryScript(doc = document) {
  const all = [...doc.querySelectorAll('script[type="module"][src]')]
    .map(s => s.getAttribute('src'));
  return all.find(s => /\/assets\/.+\.js/.test(s)) || all[0] || null;
}

let bootEntry = null;
let shown = false;
let opts = {};

async function serverEntry() {
  // no-store forces a real network trip through the service worker's
  // network-first handler; a cached index.html would report the build we
  // already have and the check could never fire. (No cache-busting QUERY here
  // on purpose — a unique URL every 5 min would pile up entries in the SW
  // cache instead of overwriting the one app-shell entry.)
  const res = await fetch('./', { cache: 'no-store' });
  if (!res.ok) return null;
  const html = await res.text();
  return entryScript(new DOMParser().parseFromString(html, 'text/html'));
}

async function isStale() {
  // 1) new deploy?
  try {
    const now = await serverEntry();
    if (now && bootEntry && now !== bootEntry) return 'build';
  } catch { /* offline / hiccup — try again next tick */ }
  // 2) new map version?
  try {
    const boot = getLoadedVersion();
    if (boot) {
      const cur = await fetchCurrent(6000);
      if (cur?.id && cur.id !== boot) return 'map';
    }
  } catch { /* ignore */ }
  return null;
}

async function tick() {
  if (shown || opts.isBusy?.()) return;
  const why = await isStale();
  if (why && !shown) showModal(why);
}

function showModal(why) {
  shown = true;
  opts.onBlock?.(); // freeze the sim behind the modal

  const el = document.createElement('div');
  el.id = 'update-gate';
  el.innerHTML = `<style>
    #update-gate { position:fixed; inset:0; z-index:2147483000; display:flex;
      align-items:center; justify-content:center; background:rgba(6,9,5,0.88);
      backdrop-filter:blur(3px); font:14px 'Segoe UI',sans-serif; }
    #update-gate .ug-card { width:min(460px,92vw); text-align:center; padding:26px 28px;
      background:linear-gradient(180deg,#1b2415,#121a0d); color:#e9e6da;
      border:1px solid #4a5c36; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.75); }
    #update-gate h2 { margin:0 0 6px; font-size:20px; color:#ffd884; letter-spacing:0.04em; }
    #update-gate p { margin:0 0 18px; color:#b9c2a6; line-height:1.5; font-size:13px; }
    #update-gate button { width:100%; padding:12px 16px; font:inherit; font-weight:600;
      font-size:15px; color:#12200c; background:linear-gradient(180deg,#a8d472,#7fae4f);
      border:1px solid #ffd884; border-radius:10px; cursor:pointer; }
    #update-gate button:hover { filter:brightness(1.08); }
    #update-gate button[disabled] { opacity:0.6; cursor:default; }
    #update-gate .ug-note { margin-top:10px; font-size:11px; color:#8d9878; }
  </style>
  <div class="ug-card">
    <div style="font-size:34px; line-height:1">⬆️</div>
    <h2>UPDATE AVAILABLE!</h2>
    <p>${why === 'map'
      ? 'The world map was updated. Your session is running the old one.'
      : 'A new version of the game has been released. Your tab is running the old build.'}
      <br>Refresh to update — you can’t keep playing on the old version.</p>
    <button data-ug-go>💾 Save &amp; Refresh</button>
    <div class="ug-note">Your character autosaves; this saves once more to be safe.</div>
  </div>`;
  document.body.appendChild(el);

  // nothing behind the gate may react: swallow every input at capture phase
  const eat = (ev) => {
    if (el.contains(ev.target)) return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
  };
  for (const t of ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click',
    'dblclick', 'wheel', 'contextmenu', 'touchstart', 'touchend']) {
    window.addEventListener(t, eat, { capture: true, passive: false });
  }

  const btn = el.querySelector('[data-ug-go]');
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try { await opts.onSave?.(); } catch { /* never block the refresh on a failed save */ }
    location.reload();
  };
}

// opts: { onBlock(), onSave(), isBusy() }
export function startUpdateWatch(o = {}) {
  opts = o;
  // always available for a live check of the gate itself: __testUpdateGate()
  window.__testUpdateGate = (why = 'build') => showModal(why);
  if (import.meta.env.DEV) return; // dev has no hashed bundles; admin owns the map
  bootEntry = entryScript();
  setInterval(tick, CHECK_MS);
  // coming back to a tab left open all night should check straight away
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
