// ---- Keyboard + mouse input ----

class Input {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, left: false, right: false }; // x,y = NDC; the
    // OS cursor is a normal free cursor — the player just faces wherever it is.

    this.keyHandlers = new Map();

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      const h = this.keyHandlers.get(e.code);
      if (h) h();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.left = false; this.mouse.right = false; });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, .panel, .spell-slot, #minimap')) return; // don't attack through UI
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onKey(code, fn) { this.keyHandlers.set(code, fn); }

  get moveX() {
    return (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
           (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
  }
  get moveZ() {
    return (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) -
           (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
  }
  // One attack input — the equipped weapon decides what it does.
  get attack() {
    return this.mouse.left || this.mouse.right || this.keys.has('Space') || this.keys.has('KeyF');
  }
}

export const input = new Input();
