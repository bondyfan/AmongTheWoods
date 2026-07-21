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
// = render both sides (leaf cards, grass blades). `fill` = emissive self-lift
// (0..1) that raises the darkest shaded/AO'd areas toward the texture colour so
// the kit reads bright & soft like the stylized promo art, not near-black.
const MAT_CFG = {
  Bark_NormalTree:    { tex: 'Bark_NormalTree.png',      alpha: true,  wind: null,        double: false, shadow: true,  fill: 0.14 },
  Leaves_NormalTree:  { tex: 'Leaves_NormalTree_C.png',  alpha: true,  wind: [2.2, 8.5],  double: true,  shadow: true,  fill: 0.34 },
  Leaves_TwistedTree: { tex: 'Leaves_TwistedTree_C.png', alpha: true,  wind: [0.0, 1.4],  double: true,  shadow: true,  fill: 0.34 },
  Leaves:             { tex: 'Leaves.png',               alpha: true,  wind: [0.05, 1.3], double: true,  shadow: false, fill: 0.34 },
  Flowers:            { tex: 'Flowers.png',              alpha: true,  wind: [0.05, 1.6], double: true,  shadow: false, fill: 0.38 },
  Grass:              { tex: 'Grass.png',                alpha: false, wind: [0.0, 1.4],  double: true,  shadow: false, fill: 0.30 },
  Mushrooms:          { tex: 'Mushrooms.png',            alpha: false, wind: null,        double: false, shadow: false, fill: 0.30 },
  Rocks:              { tex: 'Rocks_Diffuse.png',        alpha: false, wind: null,        double: false, shadow: true,  fill: 0.12 },
  PathRocks:          { tex: 'PathRocks_Diffuse.png',    alpha: false, wind: null,        double: false, shadow: false, fill: 0.12 },
};

// The kit bakes strong ambient occlusion into COLOR_0 (dark at leaf-clump cores
// and blade bases). At full strength under our low-ambient forest lighting that
// crushes the whole kit to a contrasty near-black. AO_KEEP dials that baked AO
// back to a soft, stylized amount so foliage stays bright and even-toned.
const AO_KEEP = 0.58;

// lift the baked-AO vertex colours toward white (mix by AO_KEEP), so the darkest
// occluded areas never sink to black. Chains onto whatever onBeforeCompile is
// already set (the wind patch runs after this via its own prev? call).
function _softenAO(m) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader) => {
    prev?.(shader);
    // vColor may be vec3 (USE_COLOR) or vec4 (USE_COLOR_ALPHA) — `.rgb` is valid
    // for both. Lift it toward white so the baked AO reads soft, not near-black.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#if defined( USE_COLOR_ALPHA ) || defined( USE_COLOR )\n'
      + '  diffuseColor.rgb *= mix( vec3(1.0), vColor.rgb, ' + AO_KEEP.toFixed(3) + ' );\n'
      + '#endif'
    );
  };
}

const _UP = new THREE.Vector3(0, 1, 0);
const _texCache = new Map();   // filename → THREE.Texture (deduped)
const _matCache = new Map();   // atlas name → THREE.Material (shared, wind-patched)
const _templates = new Map();  // model stem → flattened Group template
let _grassGeo = null, _grassMat = null;   // tall wispy accent tufts
let _shortGeo = null, _shortMat = null;   // dense short-blade lawn carpet
let _ready = false, _loading = null;

// the shared instanced-grass material: soft self-lit blades, per-instance colour
// on instanceColor, softened baked AO, instance-aware wind. One per grass layer.
function _grassInstMat() {
  const tex = _texture('Grass.png');
  const m = new THREE.MeshLambertMaterial({
    map: tex, vertexColors: true,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: MAT_CFG.Grass.fill,
    side: THREE.DoubleSide,
  });
  m.userData.shared = true;
  _softenAO(m);
  applyWindShader(m, 0.0, 1.4, true); // instance-aware wind
  return m;
}

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
  const tex = _texture(cfg.tex);
  const m = new THREE.MeshLambertMaterial({
    map: tex,
    vertexColors: true,                     // kit COLOR_0 = softened baked AO
    // self-lit floor: the texture colour added back at `fill` strength so the
    // darkest lambert-shaded / occluded pixels read soft & bright, not black
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: cfg.fill ?? 0.3,
    alphaTest: cfg.alpha ? 0.5 : 0,
    side: cfg.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  m.userData.shared = true;                 // survive chunk disposal
  _softenAO(m);                             // tame the harsh baked-AO contrast
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
    // the grass is INSTANCED in two layers — pull each grass mesh's geometry and
    // give both the same soft, self-lit blade material as the rest of the kit:
    //  • tall wispy tufts (accent height, sparser)
    //  • a DENSE short-blade carpet — the lush "lawn" that fills the ground so
    //    the eye reads continuous turf, not bald terrain between tufts.
    const gTall = _templates.get('Grass_Common_Tall')?.children[0];
    if (gTall) { _grassGeo = gTall.geometry; _grassMat = _grassInstMat(); }
    const gShort = _templates.get('Grass_Common_Short')?.children[0];
    if (gShort) { _shortGeo = gShort.geometry; _shortMat = _grassInstMat(); }
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
// lean toward the flowering bush — it's the lush, readable shape from the ref art
export const bush     = _deco(['Bush_Common', 'Bush_Common_Flowers', 'Bush_Common_Flowers'], 0.95, 1.4);
export const fern     = _deco(['Fern_1', 'Plant_1_Big'],               0.8, 1.2);
export const plant    = _deco(['Plant_1', 'Plant_7', 'Clover_1', 'Clover_2'], 0.85, 1.25);
export const flower   = _deco(['Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single'], 0.8, 1.2);
export const mushroom = _deco(['Mushroom_Common', 'Mushroom_Laetiporus'], 0.8, 1.3);
export const rock     = _deco(['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'], 0.55, 1.0);
export const pebble   = _deco(['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3'], 0.8, 1.4);

// INSTANCED grass from a list of {x,y,z,rot,s,c} tufts — one draw call each.
const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion();
const _gp = new THREE.Vector3(), _gs = new THREE.Vector3(), _gc = new THREE.Color();
function _instGrass(list, geo, mat) {
  if (!list.length || !geo) return null;
  const im = new THREE.InstancedMesh(geo, mat, list.length);
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
// tall wispy accent tufts (height + movement on top of the lawn)
export function grassField(list) { return _instGrass(list, _grassGeo, _grassMat); }
// the dense short-blade lawn that fills the ground into continuous turf
export function grassCarpet(list) { return _instGrass(list, _shortGeo, _shortMat); }
