// ---- Quality vegetation: the Quaternius "Stylized Nature MegaKit" (CC0) ----
// An OPT-IN graphics upgrade (Graphics ▸ "Quality vegetation assets"): the
// Verdant Forest's hand-built low-poly greenery is swapped for real stylized
// glTF models — leafy trees, bushes, ferns, grass, flowers, mushrooms, rocks.
//
// How it stays fast & consistent with the rest of the world:
//  • TEXTURES are deduped to ONE shared THREE.Texture per atlas (bark, leaves,
//    grass, flowers, mushrooms, rock) and MATERIALS to one shared Lambert per
//    atlas — every oak in the forest draws from the same GPU state.
//  • GEOMETRY is flattened once per model into a minimal template; placing a
//    plant CLONES that template (geometry + material shared by reference), so
//    hundreds of trees cost hundreds of draw calls but almost no memory.
//  • FOLIAGE SWAY reuses the game's shared wind shader (models.applyWindShader),
//    so kit leaves/grass ripple in perfect sync with the procedural greenery,
//    part around the walking player, and lie flat in the player's trail — all
//    driven by the same per-frame uniforms main.js already updates.
//  • Shared geometries/materials are flagged userData.shared, so a chunk
//    unloading never disposes the pool (world._disposeGroup skips them).
import * as THREE from 'three';
import { GLTFLoader } from '../libs/GLTFLoader.js';
import { applyWindShader } from './models.js';

const DIR = 'assets/vegetation/';

// every curated model, by file stem
const MODELS = [
  'CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5',
  'Bush_Common', 'Bush_Common_Flowers',
  'Fern_1', 'Plant_1', 'Plant_7', 'Plant_1_Big', 'Plant_7_Big',
  'Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall',
  'Clover_1', 'Clover_2',
  'Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single',
  'Mushroom_Common', 'Mushroom_Laetiporus',
  'Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3',
  'Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3',
];

// material atlas → shader recipe. `wind:[y0,y1]` (LOCAL model-space heights)
// gives the sway ramp; `null` = rigid. `alpha` = leaf/petal cutout; `double`
// = render both sides (leaf cards, grass blades).
const MAT_CFG = {
  Bark_NormalTree:    { tex: 'Bark_NormalTree.png',      alpha: true,  wind: null,        double: false, shadow: true  },
  Leaves_NormalTree:  { tex: 'Leaves_NormalTree_C.png',  alpha: true,  wind: [2.2, 8.5],  double: true,  shadow: true  },
  Leaves_TwistedTree: { tex: 'Leaves_TwistedTree_C.png', alpha: true,  wind: [0.0, 1.4],  double: true,  shadow: true  },
  Leaves:             { tex: 'Leaves.png',               alpha: true,  wind: [0.05, 1.3], double: true,  shadow: false },
  Flowers:            { tex: 'Flowers.png',              alpha: true,  wind: [0.05, 1.6], double: true,  shadow: false },
  Grass:              { tex: 'Grass.png',                alpha: false, wind: [0.0, 1.4],  double: true,  shadow: false },
  Mushrooms:          { tex: 'Mushrooms.png',            alpha: false, wind: null,        double: false, shadow: false },
  Rocks:              { tex: 'Rocks_Diffuse.png',        alpha: false, wind: null,        double: false, shadow: true  },
  PathRocks:          { tex: 'PathRocks_Diffuse.png',    alpha: false, wind: null,        double: false, shadow: false },
};

const _UP = new THREE.Vector3(0, 1, 0);
const _texCache = new Map();   // filename → THREE.Texture (deduped)
const _matCache = new Map();   // atlas name → THREE.Material (shared, wind-patched)
const _templates = new Map();  // model stem → flattened Group template
let _grassGeo = null, _grassMat = null;
let _ready = false, _loading = null;

// read the Graphics toggle straight from localStorage (needed at early boot,
// before the settings object exists) — mirrors humanmodel.humanModelEnabled().
export function enabled() {
  try { return !!JSON.parse(localStorage.getItem('atw-settings') || '{}').vegQuality; }
  catch { return false; }
}
export function ready() { return _ready; }

function _texture(file) {
  if (_texCache.has(file)) return _texCache.get(file);
  const t = new THREE.TextureLoader().load(DIR + file);
  t.colorSpace = THREE.SRGBColorSpace; // base-colour atlases are sRGB
  t.flipY = false;                     // glTF UV convention
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  _texCache.set(file, t);
  return t;
}

function _material(name) {
  if (_matCache.has(name)) return _matCache.get(name);
  const cfg = MAT_CFG[name] || MAT_CFG.Leaves;
  const m = new THREE.MeshLambertMaterial({
    map: _texture(cfg.tex),
    vertexColors: true,                     // kit COLOR_0 = free baked AO
    alphaTest: cfg.alpha ? 0.5 : 0,
    side: cfg.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  m.userData.shared = true;                 // survive chunk disposal
  if (cfg.wind) applyWindShader(m, cfg.wind[0], cfg.wind[1]);
  _matCache.set(name, m);
  return m;
}

// flatten a loaded glTF scene into a Group of meshes whose geometry is already
// in model space (node transforms baked in) with our shared materials attached.
function _flatten(scene) {
  const tpl = new THREE.Group();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const geo = o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    geo.userData.shared = true;
    const name = o.material?.name || 'Leaves';
    const cfg = MAT_CFG[name] || MAT_CFG.Leaves;
    const mesh = new THREE.Mesh(geo, _material(name));
    mesh.castShadow = cfg.shadow;
    mesh.receiveShadow = false;
    // dispose the loader's throwaway standard material (never its textures —
    // we load our own), keeping GPU memory to the shared pool only
    o.material?.dispose?.();
    tpl.add(mesh);
  });
  return tpl;
}

export async function preload() {
  if (_ready) return;
  if (_loading) return _loading;
  _loading = (async () => {
    const loader = new GLTFLoader();
    await Promise.all(MODELS.map(async (name) => {
      try {
        const gltf = await loader.loadAsync(DIR + name + '.gltf');
        _templates.set(name, _flatten(gltf.scene));
      } catch (e) { console.warn('[vegekit] failed', name, e); }
    }));
    // the grass carpet is INSTANCED — pull one grass mesh's geometry + material
    const gg = _templates.get('Grass_Common_Tall');
    const gm = gg?.children[0];
    if (gm) {
      _grassGeo = gm.geometry;
      _grassMat = new THREE.MeshLambertMaterial({
        map: _texture('Grass.png'), vertexColors: true,
        side: THREE.DoubleSide,
      });
      _grassMat.userData.shared = true;
      applyWindShader(_grassMat, 0.0, 1.4, true); // instance-aware wind
    }
    _ready = true;
  })();
  return _loading;
}

function _clone(stem) {
  const tpl = _templates.get(stem);
  return tpl ? tpl.clone() : null;
}
function _pick(rng, stems) { return stems[Math.floor(rng() * stems.length)]; }

const TREE_SCALE = [0.9, 1.3, 1.8, 2.4, 3.1];
const TREES = ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5'];

// a kit tree sized to sit alongside the procedural forest. Radius reuses the
// procedural formula so collision & chopping range are unchanged.
export function tree(size, variant, rng) {
  const s = TREE_SCALE[Math.min(4, size)] * (0.8 + rng() * 0.45);
  const mesh = _clone(TREES[variant % TREES.length]) || new THREE.Group();
  mesh.scale.setScalar(s);
  return { mesh, radius: 0.3 * s + 0.14 };
}

// ground deco builders — each returns a fresh clone (shared geometry/material)
const _deco = (stems, sMin, sMax) => (rng) => {
  const g = _clone(_pick(rng, stems));
  if (g) g.scale.setScalar(sMin + rng() * (sMax - sMin));
  return g || new THREE.Group();
};
export const bush     = _deco(['Bush_Common', 'Bush_Common_Flowers'], 0.9, 1.35);
export const fern     = _deco(['Fern_1', 'Plant_1_Big'],               0.8, 1.2);
export const plant    = _deco(['Plant_1', 'Plant_7', 'Clover_1', 'Clover_2'], 0.85, 1.25);
export const flower   = _deco(['Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single'], 0.8, 1.2);
export const mushroom = _deco(['Mushroom_Common', 'Mushroom_Laetiporus'], 0.8, 1.3);
export const rock     = _deco(['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'], 0.55, 1.0);
export const pebble   = _deco(['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3'], 0.8, 1.4);

// INSTANCED grass carpet from a list of {x,y,z,rot,s,c} tufts — one draw call.
const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion();
const _gp = new THREE.Vector3(), _gs = new THREE.Vector3(), _gc = new THREE.Color();
export function grassField(list) {
  if (!list.length || !_grassGeo) return null;
  const im = new THREE.InstancedMesh(_grassGeo, _grassMat, list.length);
  im.castShadow = false; im.receiveShadow = false;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    _gq.setFromAxisAngle(_UP, it.rot);
    _gp.set(it.x, it.y, it.z); _gs.setScalar(it.s);
    im.setMatrixAt(i, _gm.compose(_gp, _gq, _gs));
    im.setColorAt(i, _gc.setHex(it.c));
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}
