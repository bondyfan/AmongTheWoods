// ---- Keyboard + mouse input ----

class Input {
  constructor() {
    this.keys = new Set();
    this.rpgMode = false;   // right button steers instead of attacking
    this.dragX = 0;         // accumulated right-drag, consumed per frame
    this.dragY = 0;
    this.wheelSteps = 0;    // accumulated wheel, consumed per frame
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
      // RPG mode: hold right button and drag to steer/look (WoW style).
      // With mouse-look ON and the pointer locked, EVERY mouse move steers.
      if (this.rpgMode && (this.mouse.right || (this.mouseLook && this.locked))) {
        this.dragX += e.movementX || 0;
        this.dragY += e.movementY || 0;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = !!document.pointerLockElement;
    });
    window.addEventListener('wheel', (e) => {
      if (e.target.closest?.('.panel')) return; // panels scroll normally
      this.wheelSteps += Math.sign(e.deltaY);
    }, { passive: true });
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
  // One attack input — the equipped weapon decides what it does. In RPG view
  // the right button is the camera hand, not a weapon.
  get attack() {
    return this.mouse.left || (!this.rpgMode && this.mouse.right)
      || this.keys.has('Space') || this.keys.has('KeyF');
  }

  takeDrag() {
    const d = { x: this.dragX, y: this.dragY };
    this.dragX = 0; this.dragY = 0;
    return d;
  }

  takeWheel() {
    const w = this.wheelSteps;
    this.wheelSteps = 0;
    return w;
  }
}

export const input = new Input();
