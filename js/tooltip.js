// ---- Custom hover tooltip ----
// One styled panel that follows the cursor and renders rich HTML, replacing the
// browser's ugly native `title` bubble for items and abilities. Attach with
// attachTip(node, htmlString); pass a builder-made HTML string.

const el = document.createElement('div');
el.id = 'game-tooltip';
el.className = 'game-tooltip hidden';
// created before <body> exists when modules load in <head>? modules are
// deferred, so body is ready — but guard anyway.
const mount = () => (document.body || document.documentElement).appendChild(el);
if (document.body) mount(); else window.addEventListener('DOMContentLoaded', mount);

let activeNode = null;

function place(clientX, clientY) {
  const pad = 12;
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = clientX + 18, y = clientY + 18;
  if (x + w + pad > window.innerWidth) x = clientX - w - 18;
  if (y + h + pad > window.innerHeight) y = clientY - h - 18;
  el.style.left = Math.max(pad, x) + 'px';
  el.style.top = Math.max(pad, y) + 'px';
}

export function hideTip() {
  activeNode = null;
  el.classList.add('hidden');
}

export function attachTip(node, html) {
  if (!node || !html) return;
  node._tipHtml = html;
  node.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    activeNode = node;
    el.innerHTML = node._tipHtml;
    el.classList.remove('hidden');
    place(e.clientX, e.clientY);
  });
  node.addEventListener('pointermove', (e) => { if (activeNode === node) place(e.clientX, e.clientY); });
  node.addEventListener('pointerleave', () => { if (activeNode === node) hideTip(); });
  // starting a drag or clicking should get the tooltip out of the way
  node.addEventListener('pointerdown', hideTip);
}
