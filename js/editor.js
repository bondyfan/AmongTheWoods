// ---- World Editor (admin) ----
// A Warcraft-3-style editor in its OWN top-down god view (F2 / menu button,
// DEVMODE only): the sim freezes, the game HUD hides, and the island is
// edited through the worldPatch overlay (worldpatch.js), then saved to
// assets/world-patch.json (commit + push = live for every player).
//
// UI: header bar with named tabs — 🏔 Terrain (brushes) · 🌿 Objects (every
// health-bar-less thing: vegetation, rocks, buildings, landmarks — picked
// from an icon GRID) · 👥 NPCs (creature grid incl. beehives, single or
// camps) · 🌍 Biomes (global per-biome colors & densities) · 🧬 Stats
// (enemy/item overrides). A live 3D preview card shows the selection, a
// translucent ghost rides the cursor, SCATTER paints while the mouse is
// held, and ▶ Test drops you into the running game as a mob-invisible ghost.

import * as THREE from 'three';
import { worldPatch, TERRAIN_PAINTS, applyTweaks, tweakOriginal,
         ENEMY_TWEAK_FIELDS, ITEM_TWEAK_FIELDS, BIOME_TWEAK_FIELDS,
         BIOME_COLOR_FIELDS } from './worldpatch.js';
import { ENEMY_TYPES, ITEMS, BIOMES } from './config.js';
import { makeTree, makeBoulder, makeEnemyMesh, makeTownHouse, makeChurch,
         makeFountain, makeShrine, makeMonolith, makeCrypt, makeFarm,
         makeTrader, makeVillage, makeTemple, makeRaceFlag, makeNest,
         makeGraveyardRuin, makeCursedStatue, makeBonfire, makeLairEntrance,
         makeCage, makeBlacksmith, makeFlower, makeWheatTuft, makeGrassTuft,
         makeCactus, makeFern, makeBush, makeMushroom, makeLog,
         makeBeehiveBig, makeBerryBush, isSharedMaterial } from './models.js';

const HUMANOIDS = new Set(['bandit', 'banditBrute', 'tribesman', 'shaman', 'poacher', 'villager']);
const POI_MAKERS = {
  shrine: makeShrine, monolith: makeMonolith, crypt: makeCrypt, farm: makeFarm,
  trader: makeTrader, village: makeVillage, temple: makeTemple, race: makeRaceFlag,
  nest: makeNest, graveyard: makeGraveyardRuin, statue: makeCursedStatue,
  bonfire: makeBonfire, lair: () => makeLairEntrance(0), captive: makeCage,
};

const TERRAIN_TOOLS = [
  { id: 'raise',   icon: '⛰️', name: 'Raise' },
  { id: 'lower',   icon: '🕳️', name: 'Lower' },
  { id: 'smooth',  icon: '🫓', name: 'Smooth' },
  { id: 'hclear',  icon: '🧽', name: 'Restore' },
  { id: 'terrain', icon: '🎨', name: 'Paint' },
  { id: 'water',   icon: '💧', name: 'Shallow' },
  { id: 'deep',    icon: '🌊', name: 'Deep' },
  { id: 'dry',     icon: '🏜️', name: 'Dry' },
  { id: 'road',    icon: '🛤️', name: 'Road' },
  { id: 'erase',   icon: '🧹', name: 'Erase' },
];
const TABS = [
  { id: 'terrain', icon: '🏔', name: 'Terrain' },
  { id: 'objects', icon: '🌿', name: 'Objects' },
  { id: 'npc',     icon: '👥', name: 'NPCs' },
  { id: 'biome',   icon: '🌍', name: 'Biomes' },
  { id: 'stats',   icon: '🧬', name: 'Stats' },
];
const PLACE_TABS = new Set(['objects', 'npc']);

// the Objects grid: everything placeable that has no health bar
const OBJECT_ITEMS = [
  { sec: 'Vegetation' },
  { id: 'tree-auto',   icon: '🌳', label: 'Tree (biome)',  spec: { kind: 'tree', variant: 'auto' } },
  { id: 'tree-jungle', icon: '🌴', label: 'Jungle tree',   spec: { kind: 'tree', variant: 'jungle' } },
  { id: 'tree-winter', icon: '🌲', label: 'Winter tree',   spec: { kind: 'tree', variant: 'winter' } },
  { id: 'tree-dead',   icon: '🥀', label: 'Dead tree',     spec: { kind: 'tree', variant: 'dead' } },
  { id: 'cactus',      icon: '🌵', label: 'Cactus',        spec: { kind: 'deco', type: 'cactus' } },
  { id: 'fern',        icon: '🌿', label: 'Fern',          spec: { kind: 'deco', type: 'fern' } },
  { id: 'bush',        icon: '🫧', label: 'Bush',          spec: { kind: 'deco', type: 'bush' } },
  { id: 'mushroom',    icon: '🍄', label: 'Mushroom',      spec: { kind: 'deco', type: 'mushroom' } },
  { id: 'flower',      icon: '🌸', label: 'Flower',        spec: { kind: 'deco', type: 'flower' } },
  { id: 'grasstuft',   icon: '☘️', label: 'Grass tuft',    spec: { kind: 'deco', type: 'grasstuft' } },
  { id: 'log',         icon: '🪵', label: 'Fallen log',    spec: { kind: 'deco', type: 'log' } },
  { id: 'berry-blue',  icon: '🫐', label: 'Berry bush',    spec: { kind: 'berry', type: 'blue' } },
  { id: 'berry-rasp',  icon: '🍓', label: 'Raspberry (2×)', spec: { kind: 'berry', type: 'rasp' } },
  { sec: 'Areas (radius = brush)' },
  { id: 'meadow', icon: '🌼', label: 'Flower meadow', spec: { kind: 'meadow' } },
  { id: 'wheat',  icon: '🌾', label: 'Wheat field',   spec: { kind: 'field', type: 'wheat' } },
  { id: 'grass',  icon: '🌱', label: 'Tall grass',    spec: { kind: 'field', type: 'grass' } },
  { sec: 'Rocks' },
  { id: 'rock-s', icon: '🪨', label: 'Rock (small)', spec: { kind: 'rock', size: 0 } },
  { id: 'rock-l', icon: '⛰️', label: 'Rock (large)', spec: { kind: 'rock', size: 1 } },
  { sec: 'Buildings (10+ = town)' },
  { id: 'house',    icon: '🏠', label: 'House',    spec: { kind: 'building', type: 'house' } },
  { id: 'church',   icon: '⛪', label: 'Church',   spec: { kind: 'building', type: 'church' } },
  { id: 'fountain', icon: '⛲', label: 'Fountain', spec: { kind: 'building', type: 'fountain' } },
  { id: 'smith',    icon: '⚒️', label: 'Blacksmith', spec: { kind: 'smith', type: 'smith' } },
  { sec: 'Landmarks' },
  ...Object.keys(POI_MAKERS).map(t => (
    { id: 'poi-' + t, icon: '📍', label: t, spec: { kind: 'poi', type: t } })),
];

// small local RNG so ghosts/previews build deterministically
const ghostRng = (seed) => {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

export class WorldEditor {
  // opts: { scene, world, getAim, getMobs, onTest(x,z), toast, onDirty, onToggle }
  constructor(opts) {
    this.o = opts;
    this.active = false;
    this.tab = 'terrain';
    this.tool = 'raise';
    this.radius = 10;
    this.strength = 1.0;
    this.terrainIdx = 0;
    this.selObj = OBJECT_ITEMS.find(i => i.id === 'tree-auto');
    this.selNpc = { id: 'wolf', enemy: 'wolf' };
    this.treeSize = 'medium';
    this.areaCount = 24;
    this.npcMode = 'group';
    this.packCount = 4;
    this.packBoss = 0;
    this.scatter = false;
    this.scatterDensity = 5;
    this._scatterAcc = 0;
    this._strokePlaced = 0;
    this._strokePacks = false;
    this._strokeBox = null;
    this._groundT = 0;
    this._groundStroked = false;
    this._testPick = false;
    this.optMarkers = true;
    this.optNames = true;
    this.optElev = false;
    this._nameSprites = new Map();
    this._nameT = 0;
    this.grabbed = null;
    this.painting = false;
    this._accum = 0;
    this._ui = null;
    this.view = { x: 0, z: 0, dist: 140 };
    this._wheel = 0;
    this._mouse = { x: 0, y: 0 };
    this._viewAim = new THREE.Vector3();
    this._ray = new THREE.Raycaster();
    this._ghost = null;
    this._markers = new THREE.Group();
    this._markers.visible = false;
    opts.scene.add(this._markers);
    this._liveGroup = new THREE.Group();
    opts.scene.add(this._liveGroup);
    this._mobLabels = new THREE.Group();
    this._mobLabels.visible = false;
    opts.scene.add(this._mobLabels);
    this._buildBrushRing(opts.scene);
    this._installPointerHooks();
  }

  centerView(x, z) { this.view.x = x; this.view.z = z; }

  _setTestPick(v) {
    this._testPick = v;
    this._ui?.querySelector('[data-we="test"]')?.classList.toggle('arm', v);
    this._refreshGhost();
  }

  // dispose a throwaway subtree (ghosts, markers, labels, live previews) —
  // shared color-cache materials are left alone
  _disposeDeep(root) {
    root.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const mt of mats) {
        if (isSharedMaterial(mt)) continue;
        mt.map?.dispose?.();
        mt.dispose?.();
      }
    });
  }

  _clearGroup(group) {
    for (const c of [...group.children]) {
      group.remove(c);
      this._disposeDeep(c);
    }
  }
  viewTarget() { return { x: this.view.x, z: this.view.z }; }

  _areaGrow(x, z, pad) {
    const b = this._strokeBox ??= { x0: x - pad, x1: x + pad, z0: z - pad, z1: z + pad };
    b.x0 = Math.min(b.x0, x - pad); b.x1 = Math.max(b.x1, x + pad);
    b.z0 = Math.min(b.z0, z - pad); b.z1 = Math.max(b.z1, z + pad);
  }

  _areaTake() {
    const b = this._strokeBox;
    this._strokeBox = null;
    if (!b) return null;
    return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2,
      r: Math.hypot(b.x1 - b.x0, b.z1 - b.z0) / 2 + 45 };
  }

  // ---------- god-view camera ----------
  updateView(dt, camera, input) {
    const v = this.view;
    const ae = document.activeElement;
    const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
    const k = typing ? new Set() : (input.keys ?? new Set());
    const spd = (k.has('ShiftLeft') || k.has('ShiftRight') ? 2.4 : 1) * v.dist * 1.15 * dt;
    if (k.has('KeyW') || k.has('ArrowUp')) v.z -= spd;
    if (k.has('KeyS') || k.has('ArrowDown')) v.z += spd;
    if (k.has('KeyA') || k.has('ArrowLeft')) v.x -= spd;
    if (k.has('KeyD') || k.has('ArrowRight')) v.x += spd;
    if (this._wheel) {
      v.dist = Math.max(35, Math.min(1500, v.dist * (1 + this._wheel * 0.001)));
      this._wheel = 0;
    }
    camera.position.set(v.x, v.dist, v.z + v.dist * 0.55);
    camera.lookAt(v.x, 0, v.z);
    this._ray.setFromCamera(this._mouse, camera);
    const o = this._ray.ray.origin, d = this._ray.ray.direction;
    let t = d.y < -1e-4 ? -o.y / d.y : 0;
    for (let i = 0; i < 4; i++) {
      const px = o.x + d.x * t, pz = o.z + d.z * t;
      const h = this.o.world.heightAt(px, pz);
      if (d.y < -1e-4) t = (h - o.y) / d.y;
    }
    this._viewAim.set(o.x + d.x * t, 0, o.z + d.z * t);
  }

  // ---------- brush cursor ----------
  _buildBrushRing(scene) {
    const seg = 48;
    this._ringPos = new Float32Array(seg * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._ringPos, 3));
    this.ring = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({
      color: 0x58e8ff, transparent: true, opacity: 0.9,
      depthTest: false, fog: false, toneMapped: false }));
    this.ring.renderOrder = 999;
    this.ring.frustumCulled = false;
    this.ring.visible = false;
    scene.add(this.ring);
  }

  _updateRing(aim) {
    const seg = 48;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = aim.x + Math.cos(a) * this.radius;
      const z = aim.z + Math.sin(a) * this.radius;
      this._ringPos[i * 3] = x;
      this._ringPos[i * 3 + 1] = this.o.world.heightAt(x, z) + 0.4;
      this._ringPos[i * 3 + 2] = z;
    }
    this.ring.geometry.attributes.position.needsUpdate = true;
  }

  _brushRingWanted() {
    if (this._testPick) return false;
    if (this.tab === 'terrain') return true;
    if (!PLACE_TABS.has(this.tab)) return false;
    const areaKind = this.tab === 'objects'
      && (this.selObj?.spec.kind === 'meadow' || this.selObj?.spec.kind === 'field');
    return this.scatter || areaKind;
  }

  // ---------- selection → spec / model / label ----------
  _placeSpec() {
    if (this.tab === 'objects' && this.selObj?.spec) {
      const sp = { ...this.selObj.spec };
      if (sp.kind === 'tree') sp.size = Math.max(0, ['small', 'medium', 'large'].indexOf(this.treeSize));
      return sp;
    }
    if (this.tab === 'npc') {
      if (this.selNpc.hive) return { kind: 'hive' };
      return { kind: 'pack', enemy: this.selNpc.enemy,
        count: this.npcMode === 'single' ? 1 : this.packCount,
        boss: this.npcMode === 'single' ? 0 : this.packBoss };
    }
    if (this.tab === 'stats' && this._objKind === 'enemy' && this._objId) {
      return { kind: 'inspect', enemy: this._objId };
    }
    return null;
  }

  _modelFor(spec) {
    const rng = ghostRng(1234);
    if (!spec) return null;
    if (spec.kind === 'tree') {
      const tb = spec.variant === 'jungle' ? BIOMES[2]
        : spec.variant === 'winter' ? BIOMES[7]
        : spec.variant === 'dead' ? { ...BIOMES[5], trees: { pine: 0, leafy: 0, birch: 0, dead: 1 } }
        : BIOMES[0];
      return makeTree(spec.size ?? 1, tb, rng).mesh;
    }
    if (spec.kind === 'deco') {
      return spec.type === 'cactus' ? makeCactus(rng)
        : spec.type === 'fern' ? makeFern(rng)
        : spec.type === 'bush' ? makeBush(0x2d6a2d, rng)
        : spec.type === 'mushroom' ? makeMushroom(rng)
        : spec.type === 'flower' ? makeFlower(rng)
        : spec.type === 'log' ? makeLog(0x6b4a2d, rng)
        : makeGrassTuft(0x6fa04c, rng);
    }
    if (spec.kind === 'rock') return makeBoulder(spec.size ? 1.5 : 1.0, 0x8a8a84, rng);
    if (spec.kind === 'meadow' || spec.kind === 'field') {
      const g = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const t = spec.kind === 'meadow' ? makeFlower(rng)
          : spec.type === 'wheat' ? makeWheatTuft(rng) : makeGrassTuft(0x7fa04e, rng);
        if (spec.type === 'grass') t.scale.y = 1.9;
        t.position.set((rng() - 0.5) * 1.8, 0, (rng() - 0.5) * 1.8);
        g.add(t);
      }
      return g;
    }
    if (spec.kind === 'berry') return makeBerryBush(rng, spec.type === 'rasp' ? 0xd8486a : undefined);
    if (spec.kind === 'hive') return makeBeehiveBig(rng);
    if (spec.kind === 'pack' || spec.kind === 'inspect') return makeEnemyMesh(spec.enemy);
    if (spec.kind === 'smith') return makeBlacksmith();
    if (spec.kind === 'poi') return (POI_MAKERS[spec.type] ?? makeShrine)();
    if (spec.kind === 'building') {
      return spec.type === 'church' ? makeChurch(rng)
        : spec.type === 'fountain' ? makeFountain(rng) : makeTownHouse(rng);
    }
    return null;
  }

  _labelFor(spec) {
    if (!spec) return ['', ''];
    if (spec.kind === 'tree') {
      const v = spec.variant === 'auto' ? 'biome' : spec.variant;
      return [`🌳 Tree — ${v}, ${this.treeSize}`, 'Choppable in game'];
    }
    if (spec.kind === 'deco') return [`${this.selObj?.icon ?? '🌿'} ${this.selObj?.label ?? spec.type}`, 'Decoration'];
    if (spec.kind === 'rock') return [`🪨 Rock — ${spec.size ? 'large' : 'small'}`, 'Mineable in game'];
    if (spec.kind === 'meadow') return ['🌼 Flower meadow', `${this.areaCount} flowers · r ${this.radius} m`];
    if (spec.kind === 'field') {
      return [spec.type === 'wheat' ? '🌾 Wheat field' : '🌱 Tall grass',
        `${this.areaCount} plants · r ${this.radius} m`];
    }
    if (spec.kind === 'berry') {
      return [spec.type === 'rasp' ? '🍓 Raspberry bush' : '🫐 Berry bush',
        spec.type === 'rasp' ? 'DOUBLE berries per harvest' : 'Harvestable berries'];
    }
    if (spec.kind === 'hive') return ['🐝 Beehive', 'Destructible — bees & honey'];
    if (spec.kind === 'pack' || spec.kind === 'inspect') {
      const c = ENEMY_TYPES[spec.enemy] ?? {};
      const stats = `❤️×${c.hpMult ?? 1} ⚔️×${c.dmgMult ?? 1} 🏃${c.speed ?? '?'}`;
      return [`${c.icon ?? '👹'} ${c.name ?? spec.enemy}`,
        spec.kind === 'pack' ? `${spec.count}×${spec.boss ? ' + ' + '💀'.repeat(spec.boss) : ''} · ${stats}` : stats];
    }
    if (spec.kind === 'smith') return ['⚒️ Blacksmith', 'Forge & quests'];
    if (spec.kind === 'poi') return [`📍 ${spec.type}`, 'Landmark encounter'];
    if (spec.kind === 'building') return [`🏠 ${spec.type}`, '10+ together = a town'];
    return ['', ''];
  }

  _refreshGhost() {
    if (this._ghost) {
      this.o.scene.remove(this._ghost);
      this._disposeDeep(this._ghost);
      this._ghost = null;
    }
    const spec = this._placeSpec();
    if (this.active && spec && spec.kind !== 'inspect' && !this._testPick) {
      const mesh = this._modelFor(spec);
      if (mesh) {
        mesh.traverse((obj) => {
          if (obj.material) {
            const fix = (m) => { const c = m.clone(); c.transparent = true; c.opacity = 0.55; c.depthWrite = false; return c; };
            obj.material = Array.isArray(obj.material) ? obj.material.map(fix) : fix(obj.material);
          }
          obj.castShadow = false;
        });
        this._ghost = mesh;
        this.o.scene.add(mesh);
      }
    }
    this._refreshPreview();
  }

  // ---------- 3D preview card ----------
  _initPreview(canvas) {
    this._pvRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this._pvRenderer.setSize(224, 224, false);
    this._pvScene = new THREE.Scene();
    this._pvScene.add(new THREE.HemisphereLight(0xfff4e0, 0x39442e, 1.15));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(3, 5, 4);
    this._pvScene.add(dl);
    this._pvCam = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    this._pvGroup = new THREE.Group();
    this._pvScene.add(this._pvGroup);
  }

  _refreshPreview() {
    if (!this._ui) return;
    const spec = this._placeSpec();
    const card = this._ui.querySelector('[data-we="preview"]');
    const show = this.active && !!spec;
    card.style.display = show ? '' : 'none';
    const [title, meta] = this._labelFor(spec);
    this._ui.querySelector('[data-we="pv-name"]').textContent = title;
    this._ui.querySelector('[data-we="pv-meta"]').textContent = meta;
    if (!show || !this._pvGroup) return;
    this._clearGroup(this._pvGroup);
    const mesh = this._modelFor(spec);
    if (!mesh) return;
    const bb = new THREE.Box3().setFromObject(mesh);
    const size = bb.getSize(new THREE.Vector3());
    const mid = bb.getCenter(new THREE.Vector3());
    const s = 2.4 / Math.max(size.x, size.y, size.z, 0.001);
    mesh.position.sub(mid).multiplyScalar(s);
    mesh.position.y += 0.1;
    mesh.scale.setScalar(s);
    this._pvGroup.add(mesh);
    this._pvCam.position.set(0, 1.3, 4.2);
    this._pvCam.lookAt(0, 0.1, 0);
  }

  // ---------- floating labels ----------
  _labelSprite(text, w = 128) {
    const cv = document.createElement('canvas');
    cv.width = w * 4; cv.height = 96;
    const g = cv.getContext('2d');
    g.font = '600 44px sans-serif';
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.strokeStyle = 'rgba(0,0,0,0.85)';
    g.lineWidth = 7;
    g.strokeText(text, w * 2, 62);
    g.fillText(text, w * 2, 62);
    const tex = new THREE.CanvasTexture(cv);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, depthTest: false, transparent: true }));
    sp.scale.set(w / 16, 3, 1);
    sp.renderOrder = 998;
    return sp;
  }

  _updateMobLabels(dt) {
    this._nameT -= dt;
    if (this._nameT > 0) return;
    this._nameT = 0.4;
    const show = this.active && this.optNames && this.o.getMobs;
    this._mobLabels.visible = !!show;
    if (!show) return;
    const seen = new Set();
    for (const e of this.o.getMobs()) {
      if (e.dying) continue;
      seen.add(e.id);
      let sp = this._nameSprites.get(e.id);
      if (!sp) {
        const c = e.cfg ?? {};
        sp = this._labelSprite(`${c.icon ?? '👹'} ${e.bossName ?? c.name ?? e.type} · L${e.level ?? '?'}`, 200);
        this._nameSprites.set(e.id, sp);
        this._mobLabels.add(sp);
      }
      sp.position.set(e.pos.x, (e.mesh?.position.y ?? 0) + 3.1, e.pos.z);
    }
    for (const [id, sp] of [...this._nameSprites]) {
      if (!seen.has(id)) {
        this._mobLabels.remove(sp);
        this._disposeDeep(sp);
        this._nameSprites.delete(id);
      }
    }
  }

  _rebuildMarkers() {
    this._clearGroup(this._markers);
    this._markers.visible = this.active && this.optMarkers;
    if (!this.active || !this.optMarkers) return;
    for (const e of worldPatch.entities) {
      if (e.kind !== 'pack' && e.kind !== 'meadow' && e.kind !== 'field') continue;
      const y = this.o.world.heightAt(e.x, e.z);
      const color = e.kind === 'pack' ? 0xff5040 : 0x69d84f;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 5),
        new THREE.MeshBasicMaterial({ color }));
      pole.position.set(e.x, y + 2.5, e.z);
      this._markers.add(pole);
      const label = e.kind === 'pack'
        ? `${ENEMY_TYPES[e.enemy]?.icon ?? '👹'}×${e.count ?? 1}${e.boss ? '💀' : ''}`
        : `${e.kind === 'meadow' ? '🌼' : e.type === 'wheat' ? '🌾' : '🌱'}${e.count ?? 24}`;
      const sp = this._labelSprite(label);
      sp.position.set(e.x, y + 6.2, e.z);
      this._markers.add(sp);
    }
  }

  // cheap incremental marker for a just-placed pack (full rebuild waits for
  // the debounced entities refresh)
  _addPackMarker(e) {
    if (!this.optMarkers) return;
    const y = this.o.world.heightAt(e.x, e.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xff5040 }));
    pole.position.set(e.x, y + 2.5, e.z);
    this._markers.add(pole);
    const sp = this._labelSprite(
      `${ENEMY_TYPES[e.enemy]?.icon ?? '👹'}×${e.count ?? 1}${e.boss ? '💀' : ''}`);
    sp.position.set(e.x, y + 6.2, e.z);
    this._markers.add(sp);
  }

  // ---------- lifecycle ----------
  toggle(on = !this.active) {
    this.active = on;
    this._markers.visible = on;
    this._setTestPick(false);
    if (on) document.exitPointerLock?.();
    this.o.onToggle?.(on);
    if (on && this.optElev) { this.o.world.debugElevation = true; this.o.onDirty('ground', {}); }
    if (on && !this._ui) this._buildUI();
    if (this._ui) this._ui.style.display = on ? '' : 'none';
    if (!on) {
      this.painting = false;
      if (this.grabbed) this._dropGrab(); // an aborted drag still commits cleanly
      this._clearGroup(this._liveGroup);
      this._mobLabels.visible = false;
      if (this.o.world.debugElevation) {
        this.o.world.debugElevation = false;
        this.o.onDirty('ground', {});
      }
    }
    this.ring.visible = on && this._brushRingWanted();
    this._refreshGhost();
    this._rebuildMarkers();
    this._refreshStats();
    this.o.toast(on ? '🛠️ World Editor — WASD pan · wheel zoom · F2 exits.'
                    : '🛠️ World Editor off.');
  }

  _installPointerHooks() {
    const overUI = (ev) => this._ui && this._ui.contains(ev.target);
    window.addEventListener('mousedown', (ev) => {
      if (!this.active || overUI(ev)) return;
      ev.stopImmediatePropagation(); ev.preventDefault();
      if (ev.button === 0) { this.painting = true; this._strokePlaced = 0; this._clickStroke(); }
      if (ev.button === 2) this._rightClick();
    }, true);
    window.addEventListener('mouseup', (ev) => {
      if (!this.active) return;
      if (ev.button === 0) this._endStroke();
    }, true);
    window.addEventListener('contextmenu', (ev) => {
      if (this.active && !overUI(ev)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
    }, true);
    for (const evName of ['click', 'dblclick']) {
      window.addEventListener(evName, (ev) => {
        if (!this.active || overUI(ev)) return;
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }, true);
    }
    window.addEventListener('mousemove', (ev) => {
      this._mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('wheel', (ev) => {
      if (!this.active || overUI(ev)) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      this._wheel += ev.deltaY;
    }, { capture: true, passive: false });
    const inField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    window.addEventListener('keydown', (ev) => {
      if (!this.active || inField(ev.target)) return;
      if (ev.code === 'BracketLeft') this._setRadius(this.radius - 2);
      if (ev.code === 'BracketRight') this._setRadius(this.radius + 2);
      if (ev.code === 'Minus') this._setStrength(this.strength - 0.25);
      if (ev.code === 'Equal') this._setStrength(this.strength + 0.25);
      if (ev.code === 'Escape' && this._testPick) this._setTestPick(false);
    }, true);
  }

  // ---------- per-frame ----------
  update(dt) {
    if (!this.active) return;
    const aim = this._viewAim;
    this.ring.visible = this._brushRingWanted();
    if (this.ring.visible) this._updateRing(aim);
    this._updateMobLabels(dt);
    if (this._ghost) {
      this._ghost.visible = !this.grabbed && !(this.scatter && this.painting);
      this._ghost.position.set(aim.x, this.o.world.heightAt(aim.x, aim.z), aim.z);
    }
    if (this._pvGroup && this._pvRenderer && this._ui?.style.display !== 'none') {
      this._pvGroup.rotation.y += dt * 0.9;
      this._pvRenderer.render(this._pvScene, this._pvCam);
    }
    if (this.grabbed) { this._dragTo(aim); return; }
    if (!this.painting) return;
    if (this.tab === 'terrain') {
      this._accum += dt;
      if (this._accum >= 0.033) {
        const step = this._accum; this._accum = 0;
        this._applyBrush(aim, step);
      }
      // REALTIME repaint of the tiles under the brush — no timers involved
      this._groundT -= dt;
      if (this._groundT <= 0 && this._groundStroked) {
        this._groundT = 0.12;
        this.o.onDirty('ground', { area: { x: aim.x, z: aim.z, r: this.radius + 26 } });
      }
    } else if (PLACE_TABS.has(this.tab) && this.scatter) {
      this._scatterAcc += dt * this.scatterDensity;
      while (this._scatterAcc >= 1) {
        this._scatterAcc -= 1;
        this._scatterOne(aim);
      }
    }
  }

  _applyBrush(aim, dt) {
    const { radius, strength } = this;
    const amt = strength * dt * 8;
    switch (this.tool) {
      case 'raise':  worldPatch.brushHeight(aim.x, aim.z, radius, amt); break;
      case 'lower':  worldPatch.brushHeight(aim.x, aim.z, radius, -amt); break;
      case 'smooth': worldPatch.brushSmooth(aim.x, aim.z, radius, strength * dt * 4); break;
      case 'hclear': worldPatch.brushHeightErase(aim.x, aim.z, radius); break;
      case 'terrain': worldPatch.brushCells('terrain', aim.x, aim.z, radius, this.terrainIdx); break;
      case 'water': worldPatch.brushCells('water', aim.x, aim.z, radius, 1); break;
      case 'deep':  worldPatch.brushCells('water', aim.x, aim.z, radius, 3); break;
      case 'dry':   worldPatch.brushCells('water', aim.x, aim.z, radius, 2); break;
      case 'road':  worldPatch.brushCells('path', aim.x, aim.z, radius, 1); break;
      case 'erase':
        worldPatch.brushCells('terrain', aim.x, aim.z, radius, null);
        worldPatch.brushCells('water', aim.x, aim.z, radius, null);
        worldPatch.brushCells('path', aim.x, aim.z, radius, null);
        break;
    }
    this._areaGrow(aim.x, aim.z, radius + 12);
    this._groundStroked = true;
  }

  // ---------- placement ----------
  _liveMesh(spec, x, z) {
    if (spec.kind === 'pack') return;
    const mesh = this._modelFor(spec);
    if (!mesh) return;
    mesh.position.set(x, this.o.world.heightAt(x, z), z);
    this._liveGroup.add(mesh);
  }

  _placeAt(spec, x, z) {
    let ent = null;
    if (spec.kind === 'pack') {
      ent = worldPatch.addEntity('pack', 'pack', x, z, {
        enemy: spec.enemy, count: spec.count, boss: spec.boss,
        camp: HUMANOIDS.has(spec.enemy) && spec.count > 1 });
    } else if (spec.kind === 'meadow') {
      worldPatch.addEntity('meadow', 'meadow', x, z, { r: this.radius, count: this.areaCount });
    } else if (spec.kind === 'field') {
      worldPatch.addEntity('field', spec.type, x, z, { r: this.radius, count: this.areaCount });
    } else if (spec.kind === 'tree') {
      worldPatch.addEntity('tree', 'tree', x, z, { size: spec.size,
        ...(spec.variant && spec.variant !== 'auto' ? { variant: spec.variant } : {}) });
    } else if (spec.kind === 'rock') {
      worldPatch.addEntity('rock', 'rock', x, z, { size: spec.size });
    } else if (spec.kind === 'deco') {
      worldPatch.addEntity('deco', spec.type, x, z);
    } else if (spec.kind === 'hive') {
      worldPatch.addEntity('hive', 'hive', x, z);
    } else if (spec.kind === 'berry') {
      worldPatch.addEntity('berry', spec.type, x, z);
    } else {
      worldPatch.addEntity(spec.kind, spec.type, x, z);
    }
    this._strokePlaced++;
    this._strokePacks ||= spec.kind === 'pack' || spec.kind === 'poi' || spec.kind === 'smith';
    this._areaGrow(x, z, (spec.kind === 'meadow' || spec.kind === 'field') ? this.radius + 20 : 24);
    this._liveMesh(spec, x, z);
    return ent;
  }

  _scatterOne(aim) {
    const spec = this._placeSpec();
    if (!spec || spec.kind === 'meadow' || spec.kind === 'field' || spec.kind === 'inspect') return;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * this.radius;
    const x = aim.x + Math.cos(a) * r, z = aim.z + Math.sin(a) * r;
    const minGap = spec.kind === 'building' ? 8 : spec.kind === 'pack' ? 5
      : spec.kind === 'rock' ? 1.2 : spec.kind === 'hive' ? 6 : 1.6;
    for (const e of worldPatch.entities) {
      if (e.kind !== spec.kind) continue;
      if (Math.abs(e.x - x) < minGap && Math.abs(e.z - z) < minGap
          && Math.hypot(e.x - x, e.z - z) < minGap) return;
    }
    if (this.o.world.isWater(x, z) && spec.kind !== 'pack') return;
    const ent = this._placeAt(spec, x, z);
    if (ent) this._addPackMarker(ent);
  }

  _clickStroke() {
    if (this._testPick) { // ▶ Test: this click chooses the spawn point
      this._setTestPick(false);
      this.o.onTest?.(this._viewAim.x, this._viewAim.z);
      return;
    }
    if (!PLACE_TABS.has(this.tab)) return;
    const aim = this._viewAim;
    if (!this.scatter) {
      const hit = this._entityAt(aim, 2.4);
      if (hit) {
        this.grabbed = hit;
        this._grabFrom = { x: aim.x, z: aim.z }; // the origin needs a repaint too
        return;
      }
    }
    const spec = this._placeSpec();
    if (!spec || spec.kind === 'inspect') return;
    const ent = this._placeAt(spec, aim.x, aim.z);
    if (ent) this._addPackMarker(ent);
  }

  _endStroke() {
    const wasTerrain = this.painting && this.tab === 'terrain' && this._groundStroked;
    this.painting = false;
    this._scatterAcc = 0;
    this._groundStroked = false;
    this._dropGrab();
    if (wasTerrain) this._markDirty('chunks');
    if (this._strokePlaced > 0) {
      const n = this._strokePlaced;
      const packs = this._strokePacks;
      this._strokePlaced = 0;
      this._strokePacks = false;
      this._markDirty('entities', { packs });
      if (n > 1) this.o.toast(`✨ Scattered ${n}× ${this._labelFor(this._placeSpec())[0]}`);
    }
  }

  _rightClick() {
    if (!PLACE_TABS.has(this.tab)) return;
    const hit = this._entityAt(this._viewAim, Math.max(4, this.radius * 0.4));
    if (!hit) return;
    if (hit.patchId) worldPatch.removeEntity(hit.patchId);
    else worldPatch.removeGenerated(hit.genKey);
    this._areaGrow(this._viewAim.x, this._viewAim.z, 40);
    this.o.toast('🗑️ Removed ' + hit.label);
    this._markDirty('entities', { packs: true });
  }

  _entityAt(aim, r) {
    const w = this.o.world;
    let best = null, bd = r;
    const consider = (x, z, info) => {
      const d = Math.hypot(x - aim.x, z - aim.z);
      if (d < bd) { bd = d; best = info; }
    };
    for (const p of w.pois) {
      consider(p.x, p.z, p.patchId
        ? { patchId: p.patchId, label: p.type }
        : { genKey: 'poi:' + p.id, label: p.type });
    }
    for (const sm of w.smiths) {
      consider(sm.x, sm.z, sm.patchId
        ? { patchId: sm.patchId, label: 'blacksmith' }
        : { genKey: 'smith:' + sm.id, label: 'blacksmith' });
    }
    for (const e of worldPatch.entities) {
      const label = e.kind === 'pack' ? 'camp:' + e.enemy
        : e.kind === 'building' || e.kind === 'deco' ? e.type : e.kind;
      consider(e.x, e.z, { patchId: e.id, label });
    }
    return best;
  }

  _dragTo(aim) {
    const g = this.grabbed;
    if (g.patchId) {
      const e = worldPatch.entities.find(en => en.id === g.patchId);
      if (e) { e.x = aim.x; e.z = aim.z; worldPatch.dirty = true; }
    } else if (g.genKey) {
      worldPatch.moveGenerated(g.genKey, aim.x, aim.z);
    }
  }

  _dropGrab() {
    if (!this.grabbed) return;
    this.grabbed = null;
    if (this._grabFrom) { // erase the stale mesh left at the pickup spot
      this._areaGrow(this._grabFrom.x, this._grabFrom.z, 60);
      this._grabFrom = null;
    }
    this._areaGrow(this._viewAim.x, this._viewAim.z, 60);
    worldPatch.rebuildTowns(); // drags mutate coords directly — keep towns fresh
    this.o.toast('📍 Moved.');
    this._markDirty('entities', { packs: true });
  }

  _markDirty(kind, info = {}) {
    const RANK = { ground: 0, chunks: 1, entities: 2 };
    if ((RANK[kind] ?? 0) > (RANK[this._dirtyKind] ?? -1)) this._dirtyKind = kind;
    this._dirtyInfo = { ...(this._dirtyInfo ?? {}), ...info };
    const fire = () => {
      const k = this._dirtyKind, inf = this._dirtyInfo ?? {};
      this._dirtyT = null;
      this._dirtyKind = null;
      this._dirtyInfo = null;
      inf.area = this._areaTake();
      this.o.onDirty(k, inf);
      if (k !== 'ground') this._clearGroup(this._liveGroup);
      this._rebuildMarkers();
      this._refreshStats();
    };
    if (kind === 'entities') {
      clearTimeout(this._dirtyT);
      this._dirtyT = setTimeout(fire, 40);
    } else if (!this._dirtyT) {
      this._dirtyT = setTimeout(fire, 120);
    }
  }

  // ---------- persistence ----------
  async save() {
    const body = JSON.stringify(worldPatch.serialize());
    try {
      const res = await fetch('/__worldpatch', { method: 'POST', body,
        headers: { 'content-type': 'application/json' } });
      if (!res.ok) throw new Error(await res.text());
      worldPatch.dirty = false;
      this._refreshStats();
      this.o.toast('💾 Saved to assets/world-patch.json — commit & push to ship it.');
    } catch (e) {
      this.o.toast('💾 Dev server not reachable — use Export instead. (' + (e?.message ?? e) + ')');
    }
  }

  export() {
    const blob = new Blob([JSON.stringify(worldPatch.serialize(), null, 1)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'world-patch.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  import() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        if (!worldPatch.load(JSON.parse(await f.text()))) {
          this.o.toast('⚠ Not a v1 world-patch.json — nothing imported.');
          return;
        }
      } catch (err) {
        this.o.toast('⚠ Import failed: ' + (err?.message ?? err));
        return;
      }
      applyTweaks();
      worldPatch.dirty = true;
      this._markDirty('entities', { packs: true });
      this.o.toast('⬆ Patch imported (not saved yet).');
    };
    inp.click();
  }

  // ---------- the UI ----------
  _buildUI() {
    const el = this._ui = document.createElement('div');
    el.id = 'we-ui';
    el.innerHTML = `<style>
      body.we-on #hud, body.we-on #popups, body.we-on #waypoint-arrow,
      body.we-on #vignette, body.we-on #biome-gloom, body.we-on #night-tint,
      body.we-on #lowhp, body.we-on #blizzard { display: none !important; }
      #we-ui { --gold:#ffd884; --ink:#e9e6da; --dim:#9aa287; --line:#3f4a33;
        --bg:rgba(13,17,11,0.93); font:13px 'Segoe UI',sans-serif; color:var(--ink);
        user-select:none; }
      #we-ui * { box-sizing:border-box; }
      #we-header { position:fixed; inset:0 0 auto 0; height:56px; z-index:90;
        display:flex; align-items:stretch; gap:2px; padding:0 14px;
        background:linear-gradient(180deg, rgba(22,28,17,0.98), rgba(13,17,11,0.94));
        border-bottom:1px solid var(--line); box-shadow:0 3px 18px rgba(0,0,0,0.55);
        backdrop-filter:blur(6px); }
      #we-header .we-brand { display:flex; align-items:center; gap:9px; padding-right:18px;
        border-right:1px solid var(--line); margin-right:10px; }
      #we-header .we-brand b { color:var(--gold); font-size:15px; letter-spacing:0.06em; }
      #we-header .we-brand span { font-size:10px; color:var(--dim); }
      .we-tab { display:flex; flex-direction:column; align-items:center; justify-content:center;
        min-width:86px; gap:1px; background:none; border:none; border-bottom:3px solid transparent;
        color:var(--dim); cursor:pointer; font:inherit; padding:6px 12px 3px; }
      .we-tab .ic { font-size:19px; }
      .we-tab .nm { font-size:11px; letter-spacing:0.04em; }
      .we-tab:hover { color:var(--ink); background:rgba(255,255,255,0.03); }
      .we-tab.on { color:var(--gold); border-bottom-color:var(--gold);
        background:linear-gradient(180deg, rgba(255,216,132,0.06), transparent); }
      #we-header .we-actions { margin-left:auto; display:flex; align-items:center; gap:6px; }
      .we-act { padding:7px 13px; background:#232c1b; color:var(--ink); font:inherit;
        border:1px solid var(--line); border-radius:8px; cursor:pointer; }
      .we-act:hover { background:#33402662; border-color:#5a6a44; }
      .we-act.gold { background:#4c6a34; border-color:var(--gold); color:#fff; font-weight:600; }
      .we-act.gold:hover { background:#5a7c3e; }
      .we-act.test { background:#34506a; border-color:#6fb6e8; }
      .we-act.test.arm { background:#4a7ca6; box-shadow:0 0 12px rgba(111,182,232,0.5); }
      #we-toolbar { position:fixed; inset:56px 0 auto 0; min-height:64px; z-index:89;
        display:flex; align-items:flex-end; gap:16px; padding:8px 16px 9px;
        background:var(--bg); border-bottom:1px solid var(--line);
        box-shadow:0 4px 14px rgba(0,0,0,0.4); flex-wrap:wrap; }
      .we-group { display:flex; flex-direction:column; gap:4px; }
      .we-cap { font-size:10px; text-transform:uppercase; letter-spacing:0.09em; color:var(--dim); }
      .we-ctl { display:flex; align-items:center; gap:5px; }
      .we-seg { display:flex; gap:3px; }
      .we-seg button { display:flex; flex-direction:column; align-items:center;
        min-width:52px; padding:4px 7px 3px; background:#20281a; color:var(--ink);
        border:1px solid var(--line); border-radius:7px; cursor:pointer; font:inherit; }
      .we-seg button .ic { font-size:16px; }
      .we-seg button .nm { font-size:9px; color:var(--dim); }
      .we-seg button:hover { background:#2c3722; }
      .we-seg button.on { background:#4c6a34; border-color:var(--gold); }
      .we-seg button.on .nm { color:#ffe9bd; }
      #we-ui select, #we-ui input[type=number], #we-ui input[type=text] { background:#20281a;
        color:var(--ink); border:1px solid var(--line); border-radius:7px; padding:6px 8px; font:inherit; }
      #we-ui input[type=number] { width:64px; }
      #we-ui input[type=range] { width:130px; accent-color:var(--gold); }
      .we-val { min-width:46px; text-align:right; color:var(--gold); font-weight:600; }
      .we-toggle { display:flex; align-items:center; gap:6px; padding:6px 11px;
        background:#20281a; border:1px solid var(--line); border-radius:7px; cursor:pointer; }
      .we-toggle.on { background:#4c6a34; border-color:var(--gold); }
      #we-left { position:fixed; left:14px; top:134px; bottom:34px; width:262px; z-index:88;
        display:flex; flex-direction:column; gap:10px; pointer-events:none; }
      #we-left > div { pointer-events:auto; }
      #we-grid { flex:1; min-height:120px; overflow-y:auto; background:var(--bg);
        border:1px solid var(--line); border-radius:14px; padding:10px;
        box-shadow:0 8px 28px rgba(0,0,0,0.5); }
      #we-grid .sec { margin:8px 0 4px; font-size:10px; color:var(--dim);
        text-transform:uppercase; letter-spacing:0.08em; }
      #we-grid .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
      .we-card { display:flex; flex-direction:column; align-items:center; gap:2px;
        padding:8px 2px 6px; background:#20281a; border:1px solid var(--line);
        border-radius:9px; cursor:pointer; }
      .we-card .ic { font-size:22px; }
      .we-card .nm { font-size:9px; color:var(--dim); text-align:center; line-height:1.15; }
      .we-card:hover { background:#2c3722; }
      .we-card.on { background:#4c6a34; border-color:var(--gold); }
      .we-card.on .nm { color:#ffe9bd; }
      #we-preview { background:var(--bg); border:1px solid var(--line); border-radius:14px;
        padding:10px; box-shadow:0 8px 28px rgba(0,0,0,0.5); }
      #we-preview canvas { width:100%; border-radius:10px;
        background:radial-gradient(circle at 50% 35%, #2d3a24, #151b10); display:block; }
      #we-preview .pv-name { margin-top:8px; font-size:14px; font-weight:600; color:var(--gold); }
      #we-preview .pv-meta { margin-top:2px; font-size:11px; color:var(--dim); }
      #we-fields { overflow-y:auto; background:var(--bg); border:1px solid var(--line);
        border-radius:14px; padding:12px; box-shadow:0 8px 28px rgba(0,0,0,0.5); flex:1; }
      #we-fields label { display:flex; justify-content:space-between; align-items:center;
        margin-top:6px; color:var(--dim); font-size:12px; gap:8px; }
      #we-fields input { width:88px; }
      #we-fields .pv-name { font-size:14px; font-weight:600; color:var(--gold); }
      #we-status { position:fixed; left:0; right:0; bottom:0; z-index:88;
        display:flex; justify-content:space-between; gap:14px; padding:6px 16px;
        background:rgba(13,17,11,0.88); border-top:1px solid var(--line);
        font-size:11px; color:var(--dim); }
      #we-status b { color:var(--gold); font-weight:600; }
      .we-opt { display:flex; gap:8px; align-items:center; padding:5px 0;
        color:var(--ink); font-size:12px; cursor:pointer; }
      .we-opt input { accent-color:var(--gold); }
    </style>

    <div id="we-header">
      <div class="we-brand"><span style="font-size:22px">🛠️</span>
        <div><b>WORLD EDITOR</b><br><span>Among The Woods · seed 1</span></div></div>
      <div data-we="tabs" style="display:flex"></div>
      <div class="we-actions">
        <button class="we-act test" data-we="test" title="Then click the map — spawns you there as a mob-invisible ghost">▶ Test</button>
        <div style="position:relative">
          <button class="we-act" data-we="optbtn">⚙ Options</button>
          <div data-we="optmenu" style="display:none; position:absolute; right:0; top:44px;
            background:var(--bg); border:1px solid var(--line); border-radius:10px;
            padding:10px 12px; width:230px; box-shadow:0 10px 30px rgba(0,0,0,0.6); z-index:95">
            <label class="we-opt"><input type="checkbox" data-we="opt-markers" checked>
              Helper markers (pins, counts)</label>
            <label class="we-opt"><input type="checkbox" data-we="opt-names" checked>
              Mob names above creatures</label>
            <label class="we-opt"><input type="checkbox" data-we="opt-elev">
              Elevation colors (height map)</label>
          </div>
        </div>
        <button class="we-act gold" data-we="save">💾 Save</button>
        <button class="we-act" data-we="rebuild" title="Re-apply the whole patch">↺</button>
        <button class="we-act" data-we="export" title="Download world-patch.json">⬇</button>
        <button class="we-act" data-we="import" title="Load a world-patch.json">⬆</button>
        <button class="we-act" data-we="clear" title="Wipe every edit">🗑</button>
        <button class="we-act" data-we="exit" title="Back to the game (F2)">✖</button>
      </div>
    </div>

    <div id="we-toolbar">
      <div data-we="tb-terrain" style="display:contents">
        <div class="we-group"><span class="we-cap">Brush</span>
          <div class="we-seg" data-we="tools"></div></div>
        <div class="we-group" data-we="terrbox" style="display:none">
          <span class="we-cap">Surface</span>
          <div class="we-ctl"><select data-we="terr"></select></div></div>
      </div>
      <div data-we="tb-objects" style="display:none">
        <div style="display:flex; gap:16px; align-items:flex-end">
          <div class="we-group" data-we="sizebox"><span class="we-cap">Size</span>
            <div class="we-ctl"><select data-we="tsize">
              <option>small</option><option selected>medium</option><option>large</option>
            </select></div></div>
          <div class="we-group" data-we="countbox" style="display:none"><span class="we-cap">Plants</span>
            <div class="we-ctl"><input data-we="acount" type="number" min="4" max="160" value="24"></div></div>
        </div>
      </div>
      <div data-we="tb-npc" style="display:none">
        <div style="display:flex; gap:16px; align-items:flex-end">
          <div class="we-group"><span class="we-cap">Mode</span>
            <div class="we-seg" data-we="npcmodes"></div></div>
          <div class="we-group" data-we="packbox"><span class="we-cap">Camp</span>
            <div class="we-ctl">×<input data-we="ecount" type="number" min="1" max="12" value="4">
            💀<input data-we="eboss" type="number" min="0" max="3" value="0"></div></div>
        </div>
      </div>
      <div data-we="tb-biome" style="display:none">
        <div class="we-group"><span class="we-cap">Biome</span>
          <div class="we-ctl"><select data-we="bsel"></select></div></div>
      </div>
      <div data-we="tb-stats" style="display:none">
        <div style="display:flex; gap:16px; align-items:flex-end">
          <div class="we-group"><span class="we-cap">Category</span>
            <div class="we-ctl"><select data-we="okind">
              <option value="enemy">Enemy types</option><option value="item">Items</option>
            </select></div></div>
          <div class="we-group"><span class="we-cap">Object</span>
            <div class="we-ctl"><select data-we="oid"></select></div></div>
        </div>
      </div>
      <div class="we-group" data-we="scatterbox" style="display:none"><span class="we-cap">Scatter brush</span>
        <div class="we-ctl">
          <div class="we-toggle" data-we="scatter"><span>✨</span><span>Scatter</span></div>
          <input data-we="sdens" type="range" min="1" max="14" step="1">
          <span class="we-val" data-we="sdensv"></span>
        </div>
      </div>
      <div class="we-group" data-we="radbox"><span class="we-cap">Radius</span>
        <div class="we-ctl"><input data-we="rad" type="range" min="2" max="60" step="1">
          <span class="we-val" data-we="radv"></span></div></div>
      <div class="we-group" data-we="strbox"><span class="we-cap">Strength</span>
        <div class="we-ctl"><input data-we="str" type="range" min="0.25" max="5" step="0.25">
          <span class="we-val" data-we="strv"></span></div></div>
    </div>

    <div id="we-left">
      <div id="we-grid" data-we="grid" style="display:none"><div class="cards" data-we="gridcards"></div></div>
      <div id="we-fields" data-we="fields" style="display:none">
        <div class="pv-name" data-we="f-title"></div>
        <div data-we="f-body"></div>
        <div style="margin-top:8px;font-size:10px;color:var(--dim)">Blank = default. Saved with the patch.</div>
      </div>
      <div id="we-preview" data-we="preview" style="display:none">
        <canvas data-we="pvcanvas" width="224" height="224"></canvas>
        <div class="pv-name" data-we="pv-name"></div>
        <div class="pv-meta" data-we="pv-meta"></div>
      </div>
    </div>

    <div id="we-status">
      <span data-we="stats"></span>
      <span><b>LMB</b> paint/place · <b>drag</b> move · <b>RMB</b> delete · <b>WASD</b> pan ·
        <b>Shift</b> fast · <b>wheel</b> zoom · <b>[ ]</b> radius · <b>F2</b> exit</span>
    </div>`;
    document.body.appendChild(el);
    const $ = (k) => el.querySelector(`[data-we="${k}"]`);
    this._$ = $;
    this._initPreview($('pvcanvas'));

    const segBtn = (icon, name) => {
      const b = document.createElement('button');
      b.innerHTML = `<span class="ic">${icon}</span><span class="nm">${name}</span>`;
      return b;
    };
    const selectSeg = (box, btn) => {
      box.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      btn.classList.add('on');
    };

    // ---- icon grid (Objects + NPCs) ----
    const fillGrid = (items, selId, onPick) => {
      const box = $('gridcards');
      box.innerHTML = '';
      for (const it of items) {
        if (it.sec) {
          const s = document.createElement('div');
          s.className = 'sec';
          s.style.gridColumn = '1/-1';
          s.textContent = it.sec;
          box.appendChild(s);
          continue;
        }
        const c = document.createElement('div');
        c.className = 'we-card' + (it.id === selId ? ' on' : '');
        c.innerHTML = `<span class="ic">${it.icon}</span><span class="nm">${it.label}</span>`;
        c.onclick = () => {
          box.querySelectorAll('.we-card').forEach(x => x.classList.remove('on'));
          c.classList.add('on');
          onPick(it);
        };
        box.appendChild(c);
      }
    };
    const npcItems = [
      { sec: 'Creatures' },
      ...Object.entries(ENEMY_TYPES).map(([t, c]) => (
        { id: t, icon: c.icon ?? '👹', label: c.name ?? t, enemy: t })),
      { sec: 'Nests & props with HP' },
      { id: 'hive', icon: '🐝', label: 'Beehive', hive: true },
    ];

    // ---- header tabs ----
    const tabBox = $('tabs');
    const showTab = (id) => {
      this.tab = id;
      for (const tt of TABS) {
        $('tb-' + tt.id).style.display = tt.id === id
          ? (tt.id === 'terrain' ? 'contents' : '') : 'none';
      }
      $('scatterbox').style.display = PLACE_TABS.has(id) ? '' : 'none';
      $('strbox').style.display = id === 'terrain' ? '' : 'none';
      $('radbox').style.display = (id === 'terrain' || PLACE_TABS.has(id)) ? '' : 'none';
      $('grid').style.display = PLACE_TABS.has(id) ? '' : 'none';
      $('fields').style.display = (id === 'biome' || id === 'stats') ? '' : 'none';
      if (id === 'objects') {
        fillGrid(OBJECT_ITEMS, this.selObj?.id, (item) => {
          this.selObj = item;
          $('sizebox').style.display = item.spec.kind === 'tree' ? '' : 'none';
          $('countbox').style.display =
            (item.spec.kind === 'meadow' || item.spec.kind === 'field') ? '' : 'none';
          this._refreshGhost();
        });
        $('sizebox').style.display = this.selObj?.spec.kind === 'tree' ? '' : 'none';
        $('countbox').style.display =
          (this.selObj?.spec.kind === 'meadow' || this.selObj?.spec.kind === 'field') ? '' : 'none';
      }
      if (id === 'npc') {
        fillGrid(npcItems, this.selNpc?.id, (item) => {
          this.selNpc = item;
          $('packbox').style.display = (this.npcMode === 'group' && !item.hive) ? '' : 'none';
          this._refreshGhost();
        });
      }
      if (id === 'biome') fillBiomeFields();
      if (id === 'stats') fillObjIds();
      this._refreshGhost();
    };
    for (const t of TABS) {
      const b = document.createElement('button');
      b.className = 'we-tab' + (t.id === this.tab ? ' on' : '');
      b.innerHTML = `<span class="ic">${t.icon}</span><span class="nm">${t.name}</span>`;
      b.onclick = () => {
        tabBox.querySelectorAll('.we-tab').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        showTab(t.id);
      };
      tabBox.appendChild(b);
    }

    // ---- terrain tools ----
    const toolBox = $('tools');
    for (const t of TERRAIN_TOOLS) {
      const b = segBtn(t.icon, t.name);
      b.title = t.name;
      b.onclick = () => {
        this.tool = t.id;
        selectSeg(toolBox, b);
        $('terrbox').style.display = t.id === 'terrain' ? '' : 'none';
      };
      if (t.id === this.tool) b.classList.add('on');
      toolBox.appendChild(b);
    }
    for (const [i, tp] of TERRAIN_PAINTS.entries()) $('terr').add(new Option(tp.name, i));
    $('terr').onchange = (e) => { this.terrainIdx = +e.target.value; };

    // ---- objects toolbar ----
    $('tsize').onchange = (e) => { this.treeSize = e.target.value; this._refreshGhost(); };
    $('acount').onchange = (e) => {
      this.areaCount = Math.max(4, Math.min(160, +e.target.value || 24));
      this._refreshGhost();
    };

    // ---- npc toolbar ----
    const nmBox = $('npcmodes');
    for (const [id, icon, nm] of [['group', '👥', 'Camp'], ['single', '🧍', 'Single']]) {
      const b = segBtn(icon, nm);
      b.onclick = () => {
        this.npcMode = id;
        selectSeg(nmBox, b);
        $('packbox').style.display = (id === 'group' && !this.selNpc?.hive) ? '' : 'none';
        this._refreshGhost();
      };
      if (id === this.npcMode) b.classList.add('on');
      nmBox.appendChild(b);
    }
    $('ecount').onchange = (e) => {
      this.packCount = Math.max(1, Math.min(12, +e.target.value || 4));
      this._refreshGhost();
    };
    $('eboss').onchange = (e) => {
      this.packBoss = Math.max(0, Math.min(3, +e.target.value || 0));
      this._refreshGhost();
    };

    // ---- biomes tab ----
    const bSel = $('bsel');
    BIOMES.forEach((b, i) => bSel.add(new Option(`${i} · ${b.name}`, i)));
    bSel.onchange = () => fillBiomeFields();
    const fillBiomeFields = () => {
      const bi = +bSel.value || 0;
      $('f-title').textContent = `🌍 ${BIOMES[bi].name}`;
      const box = $('f-body');
      box.innerHTML = '';
      const store = worldPatch.tweaks.biomes;
      const addField = (f, isColor) => {
        const orig = tweakOriginal('biome', bi, f);
        if (orig === undefined) return;
        const cur = store[bi]?.[f];
        const show = (v) => isColor ? v.toString(16).padStart(6, '0') : v;
        const row = document.createElement('label');
        row.innerHTML = isColor
          ? `${f} <span style="display:flex;gap:4px;align-items:center">
               <span data-sw style="width:16px;height:16px;border-radius:4px;border:1px solid #555;
                 background:#${show(cur ?? orig)}"></span>
               <input type="text" maxlength="7" placeholder="${show(orig)}"
                 value="${cur !== undefined ? show(cur) : ''}" style="width:72px"></span>`
          : `${f} <input type="number" step="any" placeholder="${orig}" value="${cur ?? ''}">`;
        row.querySelector('input').onchange = (ev) => {
          let v = null;
          if (ev.target.value !== '') {
            v = isColor ? parseInt(ev.target.value.replace(/^#|^0x/i, ''), 16) : +ev.target.value;
            if (!Number.isFinite(v)) v = null;
          }
          store[bi] ??= {};
          if (v === null || v === orig) delete store[bi][f];
          else store[bi][f] = v;
          if (!Object.keys(store[bi]).length) delete store[bi];
          worldPatch.dirty = true;
          applyTweaks();
          const sw = row.querySelector('[data-sw]');
          if (sw) sw.style.background = '#' + show(v ?? orig);
          this.o.onDirty('ground', {});
          this._refreshStats();
          this.o.toast(`🌍 ${BIOMES[bi].name}.${f} = ${v === null ? 'default' : isColor ? '#' + show(v) : v}`);
        };
        box.appendChild(row);
      };
      for (const f of BIOME_TWEAK_FIELDS) addField(f, false);
      for (const f of BIOME_COLOR_FIELDS) addField(f, true);
    };

    // ---- stats tab ----
    const objIds = () => this._objKind === 'item'
      ? ITEMS.filter(i => i.weapon || i.stats || i.unique).map(i => i.id)
      : Object.keys(ENEMY_TYPES);
    this._objKind = 'enemy';
    const fillObjIds = () => {
      const sel = $('oid');
      sel.innerHTML = '';
      for (const id of objIds()) sel.add(new Option(id, id));
      this._objId = sel.value;
      fillObjFields();
      this._refreshGhost();
    };
    const fillObjFields = () => {
      const id = $('oid').value || objIds()[0];
      if (!id) return;
      this._objId = id;
      const kind = this._objKind;
      $('f-title').textContent = `🧬 ${id}`;
      const fields = kind === 'enemy' ? ENEMY_TWEAK_FIELDS : ITEM_TWEAK_FIELDS;
      const box = $('f-body');
      box.innerHTML = '';
      for (const f of fields) {
        const orig = tweakOriginal(kind, id, f);
        if (orig === undefined) continue;
        const store = kind === 'enemy' ? worldPatch.tweaks.enemies : worldPatch.tweaks.items;
        const cur = store[id]?.[f];
        const row = document.createElement('label');
        row.innerHTML = `${f} <input type="number" step="any" placeholder="${orig}" value="${cur ?? ''}">`;
        row.querySelector('input').onchange = (ev) => {
          const v = ev.target.value === '' ? null : +ev.target.value;
          store[id] ??= {};
          if (v === null || !Number.isFinite(v) || v === orig) delete store[id][f];
          else store[id][f] = v;
          if (!Object.keys(store[id]).length) delete store[id];
          worldPatch.dirty = true;
          applyTweaks();
          this._refreshStats();
          this.o.toast(`🧬 ${id}.${f} = ${v ?? orig + ' (default)'}`);
        };
        box.appendChild(row);
      }
    };
    $('okind').onchange = (e) => { this._objKind = e.target.value; fillObjIds(); };
    $('oid').onchange = () => { fillObjFields(); this._refreshGhost(); };

    // ---- scatter + sliders ----
    const scB = $('scatter');
    scB.onclick = () => {
      this.scatter = !this.scatter;
      scB.classList.toggle('on', this.scatter);
    };
    $('sdens').value = this.scatterDensity;
    $('sdensv').textContent = `${this.scatterDensity}/s`;
    $('sdens').oninput = (e) => {
      this.scatterDensity = +e.target.value;
      $('sdensv').textContent = `${this.scatterDensity}/s`;
    };
    this._radEl = $('rad'); this._radV = $('radv');
    this._strEl = $('str'); this._strV = $('strv');
    this._radEl.oninput = (e) => this._setRadius(+e.target.value);
    this._strEl.oninput = (e) => this._setStrength(+e.target.value);
    this._setRadius(this.radius);
    this._setStrength(this.strength);

    // ---- options + actions ----
    const optBtn = $('optbtn'), optMenu = $('optmenu');
    optBtn.onclick = () => {
      optMenu.style.display = optMenu.style.display === 'none' ? '' : 'none';
    };
    $('opt-markers').onchange = (e) => { this.optMarkers = e.target.checked; this._rebuildMarkers(); };
    $('opt-names').onchange = (e) => {
      this.optNames = e.target.checked;
      if (!this.optNames) {
        for (const [, sp] of this._nameSprites) {
          this._mobLabels.remove(sp);
          this._disposeDeep(sp);
        }
        this._nameSprites.clear();
        this._mobLabels.visible = false;
      }
      this._nameT = 0;
    };
    $('opt-elev').onchange = (e) => {
      this.optElev = e.target.checked;
      this.o.world.debugElevation = this.optElev;
      this.o.onDirty('ground', {});
      this.o.toast(this.optElev ? '🗺️ Elevation colors ON' : '🗺️ Elevation colors off');
    };
    $('test').onclick = () => {
      this._setTestPick(!this._testPick);
      this.o.toast(this._testPick
        ? '▶ Click anywhere on the map to spawn there as a TEST ghost (Esc cancels).'
        : 'Test cancelled.');
    };
    $('save').onclick = () => this.save();
    $('export').onclick = () => this.export();
    $('import').onclick = () => this.import();
    $('rebuild').onclick = () => { this._markDirty('entities', { packs: true }); this.o.toast('↺ World rebuilt from patch.'); };
    $('exit').onclick = () => this.toggle(false);
    $('clear').onclick = () => {
      if (!confirm('Wipe ALL World-Editor edits?')) return;
      worldPatch.clear();
      applyTweaks();
      this._markDirty('entities', { packs: true });
    };
    this._statsEl = $('stats');
    showTab(this.tab);
  }

  _setRadius(v) {
    this.radius = Math.max(2, Math.min(60, v));
    if (this._radEl) { this._radEl.value = this.radius; this._radV.textContent = `${this.radius} m`; }
  }

  _setStrength(v) {
    this.strength = Math.max(0.25, Math.min(5, v));
    if (this._strEl) { this._strEl.value = this.strength; this._strV.textContent = `${this.strength.toFixed(2)}×`; }
  }

  _refreshStats() {
    if (!this._statsEl) return;
    const b = worldPatch.entities.filter(e => e.kind === 'building').length;
    const towns = worldPatch._townCenters?.length ?? 0;
    this._statsEl.innerHTML = `sculpt <b>${worldPatch.height.size}</b> · paint <b>${worldPatch.terrain.size}</b>`
      + ` · water <b>${worldPatch.water.size}</b> · roads <b>${worldPatch.path.size}</b>`
      + ` · entities <b>${worldPatch.entities.length}</b> (${b} 🏠, ${towns} towns)`
      + `${worldPatch.dirty ? ' · <b style="color:#ff9c6a">UNSAVED</b>' : ' · saved'}`;
  }
}
