// ==========================================================================
// Forced landscape on portrait phones.
//
// Instead of asking the player to turn the phone, the whole page is rotated 90°
// so the game simply IS sideways — which reads as an instruction without a word
// of copy. (The manifest asks for landscape when installed and fullscreen locks
// it where a lock is allowed; this covers iOS Safari, where neither works.)
//
// The catch, and the reason this is a module rather than one CSS rule: a CSS
// transform moves PIXELS, not POINTER EVENTS. clientX/clientY keep arriving in
// the untransformed viewport frame, so with the page rotated the renderer would
// be sized to the wrong aspect, mouse aim would be transposed, and a drag "up"
// the physical screen would come through as sideways. Everything that reads
// screen geometry has to go through here.
//
// The rotation is 90° clockwise about the top-left corner, then pushed back up
// by one viewport height — so the game's top edge ends up along the phone's
// RIGHT edge, and turning the phone anticlockwise (the natural direction, the
// way a volume rocker ends up on top) brings it upright.
// ==========================================================================

const MQ = '(orientation: portrait) and (pointer: coarse)';
let _mq = null;

// Is the page currently drawn sideways? Coarse pointer only: a narrow desktop
// window is not a phone, and rotating it would be absurd.
export function rotated() {
  if (typeof matchMedia !== 'function') return false;
  _mq ??= matchMedia(MQ);
  return _mq.matches;
}

// The size of the RENDER SURFACE, which is the viewport with its axes swapped
// while rotated.
export function viewW() { return rotated() ? window.innerHeight : window.innerWidth; }
export function viewH() { return rotated() ? window.innerWidth : window.innerHeight; }

// Map a pointer event's client coords into that surface.
//
// Forward transform of the CSS is: screen = rotate90cw(view) + (innerWidth, 0),
// i.e. screenX = innerWidth - viewY, screenY = viewX. Inverting it:
//   viewX = screenY
//   viewY = innerWidth - screenX
export function toViewX(clientX, clientY) {
  return rotated() ? clientY : clientX;
}
export function toViewY(clientX, clientY) {
  return rotated() ? (window.innerWidth - clientX) : clientY;
}

// Same rotation for a DELTA (a drag), which carries no origin — so the
// translation drops out and only the rotation remains.
export function toViewDX(dx, dy) { return rotated() ? dy : dx; }
export function toViewDY(dx, dy) { return rotated() ? -dx : dy; }

// Run `fn` whenever the page flips between upright and sideways, so the renderer
// can resize. Also fires on a plain resize, which is what an orientation change
// actually looks like on most phones.
export function onOrientationChange(fn) {
  if (typeof matchMedia !== 'function') return;
  _mq ??= matchMedia(MQ);
  _mq.addEventListener?.('change', fn);
  window.addEventListener('orientationchange', fn);
}
