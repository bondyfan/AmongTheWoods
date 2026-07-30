// ---- Keyboard + mouse input ----

class Input {
  constructor() {
    this.keys = new Set();
    this.jumpPressed = false;
    this.follow = null;   // {x,z} steering fed by follow-a-player
    this.rpgMode = false;   // right button steers instead of attacking
    this.dragX = 0;         // accumulated right-drag, consumed per frame
    this.dragY = 0;
    this.wheelSteps = 0;    // accumulated wheel, consumed per frame
    this.mouse = { x: 0, y: 0, left: false, right: false }; // x,y = NDC; the
    this.leftPressed = false;
    this.leftReleased = false;
    // touch controls (js/touch.js drives these): an analog move stick + a
    // held-attack flag. touchAim is the last stick direction, so the player
    // faces / strikes the way they're moving on a phone.
    this.touch = { active: false, mx: 0, mz: 0 };
    this.touchAttack = false;
    this.touchBlock = false;
    this.touchAim = { x: 0, z: -1 };
    // OS cursor is a normal free cursor — the player just faces wherever it is.

    this.keyHandlers = new Map();

    window.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
      // Space is JUMP — stop it scrolling the page.
      if (e.code === 'Space' && !typing) e.preventDefault();
      // Alt/Option is hold-to-attack on both platforms; left alone it pops the
      // browser's menu bar on Windows and steals keyboard focus mid-fight.
      if ((e.code === 'AltLeft' || e.code === 'AltRight') && !typing) e.preventDefault();
      if (e.repeat) return;
      // edge-triggered: a jump is one press, not a hold
      if (e.code === 'Space' && !typing) this.jumpPressed = true;
      this.keys.add(e.code);
      const h = this.keyHandlers.get(e.code);
      if (h) h();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      // macOS suppresses keyup for every other key while Cmd is held, so WASD
      // sticks down if the player ever taps Cmd mid-run. Releasing it clears them.
      if (e.code === 'MetaLeft' || e.code === 'MetaRight') this.keys.clear();
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.jumpPressed = false;
      this.mouse.left = false;
      this.mouse.right = false;
      this.leftPressed = false;
      this.leftReleased = false;
    });

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
      if (e.button === 0) { this.mouse.left = true; this.leftPressed = true; }
      if (e.button === 2) this.mouse.right = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if (this.mouse.left) this.leftReleased = true;
        this.mouse.left = false;
      }
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onKey(code, fn) { this.keyHandlers.set(code, fn); }

  // Any real steering input from the player. Follow reads this to know when to
  // let go — in WoW, touching a movement key is what breaks follow.
  get steering() {
    return this.touch.active
      || this.keys.has('KeyW') || this.keys.has('KeyA') || this.keys.has('KeyS') || this.keys.has('KeyD')
      || this.keys.has('ArrowUp') || this.keys.has('ArrowDown')
      || this.keys.has('ArrowLeft') || this.keys.has('ArrowRight');
  }
  get moveX() {
    if (this.touch.active) return this.touch.mx;
    const k = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
              (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    return k || (this.follow?.x ?? 0);   // follow steers only when you don't
  }
  get moveZ() {
    if (this.touch.active) return this.touch.mz;
    const k = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) -
              (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    return k || (this.follow?.z ?? 0);
  }
  // Right-click remains a quick repeating attack in top-down mode. Left-click
  // is edge-tracked separately so holding and releasing can charge a strike.
  get quickAttack() { return !this.rpgMode && this.mouse.right; }
  // Hold the attack button: left mouse, the on-screen button, or Alt/Option.
  // NOT Cmd — the browser owns it. Holding Cmd fires Cmd+S ("save page as"),
  // Cmd+W (close tab) and friends the moment another key is touched, and
  // preventDefault'ing it to stop that would also break Cmd+R and Cmd+T. There
  // is no version of Cmd-to-attack that behaves. Option is free on macOS and Alt
  // is free on Windows, and they are the same physical key.
  get attackHeld() {
    return this.mouse.left || this.touchAttack
      || this.keys.has('AltLeft') || this.keys.has('AltRight');
  }
  // One press = one jump. Consumed by the reader so a held Space doesn't pogo.
  takeJump() { const j = this.jumpPressed; this.jumpPressed = false; return j; }
  get block() {
    return this.touchBlock || this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.keys.has('KeyV');
  }
  // Hold Shift to raise the target-lock reticle: the nearest unit to the
  // screen centre gets selected and single-target abilities snap onto it.
  get selecting() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  takeLeftPressed() {
    const pressed = this.leftPressed;
    this.leftPressed = false;
    return pressed;
  }

  takeLeftReleased() {
    const released = this.leftReleased;
    this.leftReleased = false;
    return released;
  }

  cancelCombat() {
    this.mouse.left = false;
    this.mouse.right = false;
    this.leftPressed = false;
    this.leftReleased = false;
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
