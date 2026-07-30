// ==========================================================================
// The rigged human avatar — a drop-in replacement for the hand-built box
// `makeMan()`. makeHumanMan() returns a Group satisfying makeMan()'s full
// userData contract, so nothing downstream has to know which body it got.
//
// WHY THE FIRST ATTEMPT LOOKED WRONG (all four causes, all addressed here):
//
//  1. It was never animated. human.gltf ships ZERO clips and this file used to
//     hand-rotate 4 bones out of 65 from the box rig's proxy Groups, leaving 61
//     frozen. A detailed body with no spine, shoulders or weight reads WORSE
//     than a box, because the eye expects detail to move. Hence the mixer.
//  2. It was the only PBR object in the game. GLTFLoader yields
//     MeshStandardMaterial; everything else here is Lambert/Basic, and there is
//     no environment map anywhere, so the hero was the only thing in the world
//     whose brightness changed with CAMERA angle. Converted to Lambert on load.
//  3. Self-shadowing. Fixed in the asset (scripts/prep-human.mjs forces
//     single-sided) and belt-and-braces here via shadowSide.
//  4. The seam was a stub. Five of its twelve keys were bare Groups never added
//     to the scene, so five consumers failed SILENTLY — the rigged hero could
//     not display the starter leaf — and `legs` was missing entirely, so
//     villager/remote leg animation drove nothing. See CONTRACT below.
//
// BONE OWNERSHIP is exclusive: a bone is driven by the mixer or by code, never
// both. three's PropertyMixer blends an unkeyed bone back toward its bind-time
// value at weight < 1, so shared ownership is nondeterministic.
// ==========================================================================
import * as THREE from 'three';
import { GLTFLoader } from '../libs/GLTFLoader.js';
import { clone as skeletonClone } from '../libs/SkeletonUtils.js';

const MODEL_URL = 'assets/models/human/human.gltf';
const CLIPS_URL = 'assets/models/human/anims.glb';   // optional; absent = fallback

// Every key makeMan() publishes, with who consumes it. makeHumanMan() must
// satisfy all of them with REAL objects that are in the scene graph.
//   leftLeg/rightLeg/leftArm/rightArm  player.js:3782, multiplayer.js:278
//   legs (array)                       enemies.js, multiplayer.js, main.js, moba.js
//   rightSocket/leftSocket             player.js:2633, multiplayer.js:214
//   torso/armL/armR (need .material)   player.js:2493  (skin under the armour)
//   hair (needs .visible)              player.js:2497
//   leaf (needs .visible)              models.js:546   (starter item)
//   capSlot (worn head parents here)   models.js:531,544
//   frontZ                             enemies.js faceYaw()
const CONTRACT = ['leftLeg', 'rightLeg', 'leftArm', 'rightArm', 'legs',
  'rightSocket', 'leftSocket', 'torso', 'armL', 'armR', 'hair', 'leaf',
  'capSlot', 'frontZ'];

// ── Tunables ─────────────────────────────────────────────────────────────────
// 1.85 m, not the 2.58 this used to be. That was 1.5x the box man's 1.72, so the
// hero towered over every villager, doorway and saddle in the game — damage that
// had nothing to do with shading and was being blamed on it.
const TARGET_H = 1.85;
const FACE_Y = 0;             // the model already fronts +Z, same as makeMan
const ARM_TUCK = 1.40;        // rad: pull the T-pose arms down to the sides

// Which bones the FALLBACK (no clips) path drives, and the static Z rotation
// that brings each T-pose arm down. Legs hang at rotation 0 already.
// The clip names the retargeter emits (scripts/retarget-ual.mjs WANT list).
const CLIP = {
  idle: 'Idle_Loop', idleTorch: 'Idle_Torch_Loop', idleSword: 'Sword_Idle',
  walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', sprint: 'Sprint_Loop',
  swim: 'Swim_Fwd_Loop', swimIdle: 'Swim_Idle_Loop',
  attack: 'Sword_Attack', punch: 'Punch_Jab', punchAlt: 'Punch_Cross',
  cast: 'Spell_Simple_Shoot', castIdle: 'Spell_Simple_Idle_Loop',
  block: 'Sword_Idle', hit: 'Hit_Chest', death: 'Death01', roll: 'Roll',
  sit: 'Sitting_Idle_Loop', interact: 'Interact',
};
export { CLIP };

const DRIVE = {
  thigh_l:    { tuck: 0 },
  thigh_r:    { tuck: 0 },
  upperarm_l: { tuck: -ARM_TUCK },
  upperarm_r: { tuck:  ARM_TUCK },
};

let _template = null;   // loaded, un-scaled glTF scene used as the clone source
let _clips = [];        // AnimationClips shared by every avatar

// Lambert, single-sided, texture preserved. The albedo IS the character; the
// normal/roughness maps were removed from the asset because under one
// directional light with no envMap they read as noise, not form.
function deStandardize(mesh) {
  const src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const out = src.map(m => {
    if (!m || m.isMeshLambertMaterial) return m;
    const lam = new THREE.MeshLambertMaterial({
      color: m.color ?? 0xffffff, map: m.map ?? null,
      transparent: m.transparent, opacity: m.opacity,
      alphaTest: m.alphaTest, vertexColors: m.vertexColors,
    });
    lam.name = m.name;
    lam.side = THREE.FrontSide;
    lam.shadowSide = THREE.BackSide;   // never let it shadow its own front faces
    m.dispose?.();
    return lam;
  });
  mesh.material = Array.isArray(mesh.material) ? out : out[0];
}

export async function preloadHumanModel() {
  if (_template) return _template;
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  _template = gltf.scene;
  _template.traverse(o => { if (o.isMesh || o.isSkinnedMesh) deStandardize(o); });
  _template.updateMatrixWorld(true);
  // Clips live in their own file so the mesh isn't re-downloaded to get them.
  // Missing is fine — makeHumanMan falls back to driving four bones by hand.
  try {
    const anim = await loader.loadAsync(CLIPS_URL);
    _clips = (anim.animations ?? []).filter(c => c.tracks.length);
  } catch { _clips = []; }
  return _template;
}

export function humanReady() { return !!_template; }
export function humanClipCount() { return _clips.length; }

// Gate for the avatar, and it gates on the CLIPS rather than on a setting.
// Shipping this body un-animated is exactly what got it retired the first time —
// a detailed mannequin with four moving bones reads worse than a box. So if
// anims.glb is missing or fails to load, we fall back to makeMan on purpose,
// and the frozen-hero failure mode simply cannot ship again.
export function humanModelEnabled() { return _clips.length > 0; }

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

// Drive a bone from a rotation authored in CHARACTER space (pitch about X =
// swing forward/back, roll about Z = tuck sideways), conjugated into the bone's
// parent frame so it lands correctly however the parent is oriented:
//   local = (parentWorld⁻¹ · Aworld · parentWorld) · restLocal
function drive(d, pitch, roll) {
  if (!d?.bone) return;
  _e.set(pitch, 0, d.tuck + roll, 'XYZ');
  _q.setFromEuler(_e);
  d.bone.quaternion.copy(d.parentInv).multiply(_q).multiply(d.parentQ).multiply(d.rest);
}

export function makeHumanMan() {
  const g = new THREE.Group();
  const model = skeletonClone(_template);

  // Fit to height and stand the feet on y = 0.
  let bb = new THREE.Box3().setFromObject(model);
  const h = bb.max.y - bb.min.y || 1;
  const fit = TARGET_H / h;
  model.scale.setScalar(fit);
  model.rotation.y = FACE_Y;
  model.updateMatrixWorld(true);
  bb = new THREE.Box3().setFromObject(model);
  model.position.y -= bb.min.y;
  g.add(model);

  // Index bones and skinned meshes, and identify the body parts by material name
  // so the contract can hand out REAL meshes instead of orphan Groups.
  const bone = {};
  const skinned = [];
  let body = null, hairMesh = null;
  model.traverse(o => {
    if (o.name) bone[o.name] = o;
    if (!o.isSkinnedMesh) return;
    skinned.push(o);
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    const n = mat?.name ?? '';
    if (/hair/i.test(n)) hairMesh = o;
    else if (/male|female|body|superhero/i.test(n)) body = o;
  });
  body ??= skinned[0];
  g.updateMatrixWorld(true);

  // Sockets ride the real hand/head bones, re-aligned to character axes and
  // un-scaled so weapons authored in box-man units drop in untouched. The scale
  // cancel stays deliberately: removing it means re-authoring every weapon
  // offset in player.js and multiplayer.js, which is not a blind change.
  const mkSocket = (host, offset = new THREE.Vector3()) => {
    const s = new THREE.Group();
    if (host) {
      host.add(s);
      host.updateMatrixWorld(true);
      const p = new THREE.Vector3(), rq = new THREE.Quaternion(), sc = new THREE.Vector3();
      host.matrixWorld.decompose(p, rq, sc);
      s.quaternion.copy(rq).invert();
      s.scale.setScalar(1 / (sc.x || 1));
      s.position.copy(offset);
    } else {
      g.add(s);            // never leave a socket out of the graph
    }
    return s;
  };
  const rightSocket = mkSocket(bone.hand_r);
  const leftSocket  = mkSocket(bone.hand_l);
  const capSlot     = mkSocket(bone.Head);

  // The starter leaf: a real plate on the pelvis, because models.js only toggles
  // .visible and an orphan Group meant the item silently never showed.
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.3, 0.06),
    new THREE.MeshLambertMaterial({ color: 0x4e7d32 }));
  leaf.castShadow = true;
  if (bone.pelvis) {
    bone.pelvis.add(leaf);
    leaf.scale.setScalar(1 / fit);       // undo the model fit for authored units
    leaf.position.set(0, 0, 0.16 / fit);
  } else {
    g.add(leaf);
    leaf.position.set(0, 0.7, 0.16);
  }

  // Proxy handles the fallback path animates; mirrored onto bones in update().
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  g.add(leftLeg, rightLeg, leftArm, rightArm);   // in-graph, no geometry

  g.userData = {
    leftLeg, rightLeg, leftArm, rightArm,
    legs: [leftLeg, rightLeg],
    rightSocket, leftSocket, capSlot, leaf,
    // Real meshes: player.js assigns .material to these and toggles hair's
    // .visible. torso/armL/armR are all the one body mesh — "the skin under the
    // armour" is a single skinned surface here, not three separate boxes.
    torso: body, armL: body, armR: body,
    hair: hairMesh ?? body,
    frontZ: 1,          // fronts +Z like makeMan (enemies.js faceYaw)
    human: true,
  };

  // Precompute each fallback-driven bone's rest pose and its parent's world spin.
  const drivers = {};
  for (const n of Object.keys(DRIVE)) {
    const b = bone[n];
    if (!b) continue;
    const parentQ = new THREE.Quaternion();
    (b.parent || model).getWorldQuaternion(parentQ);
    drivers[n] = { bone: b, rest: b.quaternion.clone(), parentQ,
                   parentInv: parentQ.clone().invert(), tuck: DRIVE[n].tuck };
  }

  // SkeletonUtils.clone() gives the meshes separate Skeleton objects that share
  // the same Bone instances, so ONE mixer on the body drives all of them.
  const mixer = _clips.length ? new THREE.AnimationMixer(body) : null;
  const actions = new Map();
  if (mixer) for (const c of _clips) actions.set(c.name, mixer.clipAction(c));
  const skeletons = new Set(skinned.map(m => m.skeleton));
  const armature = bone.Armature || skinned[0]?.skeleton.bones[0]?.parent || model;

  // ONE solve per frame, called from the game loop. This used to hang off
  // skinned[0].onBeforeRender, which runs once per RENDER PASS — shadow map plus
  // postfx plus preview meant 65 bones re-solved three times every frame.
  let cur = null;            // the looping base action
  let oneShot = null;        // { action, until } — outranks the base while live
  let clock = 0;

  const fadeTo = (name, fade = 0.18, once = false, timeScale = 1) => {
    const a = actions.get(name);
    if (!a) return null;
    if (a === cur && !once) return a;
    a.reset();
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = once;
    a.timeScale = timeScale;
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.fadeIn(fade).play();
    if (cur && cur !== a) cur.fadeOut(fade);
    if (!once) cur = a;
    return a;
  };

  g.userData.rig = {
    mixer, actions,
    clipNames: () => [...actions.keys()],
    has: (name) => actions.has(name),

    // Fire a non-looping clip (a swing, a cast, a hit) that outranks the base
    // until it finishes. `dur` retimes it onto the gameplay clock that owns the
    // hit frame: swingTime is a getter mutated by Quick Draw and Haste, so
    // playing at authored length would drift the impact out of the animation.
    trigger(name, dur = 0) {
      const a = actions.get(name);
      if (!a || !mixer) return false;
      const len = a.getClip().duration || 1;
      oneShot = { action: a, until: clock + (dur > 0.01 ? dur : len) };
      fadeTo(name, 0.06, true, dur > 0.01 ? len / dur : 1);
      return true;
    },

    // Pose from gameplay state. Never both: the mixer owns the skeleton whenever
    // it exists, so player.js's hand-authored limb rotations are skipped.
    setState(s = {}) {
      if (!mixer) return;
      if (oneShot && clock < oneShot.until) return;
      oneShot = null;
      let want;
      if (s.dead) want = CLIP.death;
      else if (s.sitting) want = CLIP.sit;
      else if (s.swimming) want = s.moving ? CLIP.swim : CLIP.swimIdle;
      else if (s.blocking) want = CLIP.block;
      else if (s.casting) want = CLIP.castIdle;
      else if (s.moving) want = s.speed > 6.4 ? CLIP.sprint : s.speed > 3.2 ? CLIP.jog : CLIP.walk;
      else if (s.torch) want = CLIP.idleTorch;
      else if (s.armed) want = CLIP.idleSword;
      else want = CLIP.idle;
      // Retime locomotion to real ground speed or the feet skate. The clips were
      // authored at roughly walk 1.4, jog 4, sprint 7 m/s.
      if (want === CLIP.walk || want === CLIP.jog || want === CLIP.sprint) {
        const authored = want === CLIP.sprint ? 7 : want === CLIP.jog ? 4 : 1.4;
        const a = actions.get(want);
        if (a) a.timeScale = Math.max(0.45, Math.min(2.2, (s.speed || authored) / authored));
      }
      // death plays once and stays down — don't restart it every frame
      if (s.dead && cur === actions.get(CLIP.death)) return;
      fadeTo(want, s.dead ? 0.12 : 0.18, !!s.dead);
      if (s.dead) cur = actions.get(CLIP.death);
    },

    update(dt) {
      clock += dt;
      if (mixer) { mixer.update(dt); return; }
      // fallback: mirror the proxy Groups onto the four bones we own
      drive(drivers.thigh_l,    leftLeg.rotation.x,  leftLeg.rotation.z);
      drive(drivers.thigh_r,    rightLeg.rotation.x, rightLeg.rotation.z);
      drive(drivers.upperarm_l, leftArm.rotation.x,  leftArm.rotation.z);
      drive(drivers.upperarm_r, rightArm.rotation.x, rightArm.rotation.z);
      armature.updateMatrixWorld(true);
      for (const sk of skeletons) sk.update();
    },
  };
  if (mixer) g.userData.rig.setState({});   // stand in the idle, not the T-pose

  return g;
}

// Fail loudly in dev rather than silently in five consumers.
export function assertContract(mesh, label = 'avatar') {
  const ud = mesh?.userData ?? {};
  const missing = CONTRACT.filter(k => ud[k] == null);
  const orphan = ['torso', 'armL', 'armR', 'hair', 'leaf', 'capSlot',
    'rightSocket', 'leftSocket'].filter(k => ud[k] && !ud[k].parent);
  const problems = [
    ...missing.map(k => `missing '${k}'`),
    ...orphan.map(k => `'${k}' is not in the scene graph`),
    ...(ud.torso && !ud.torso.material ? [`'torso' has no .material`] : []),
  ];
  if (problems.length) throw new Error(`${label} body contract: ${problems.join('; ')}`);
  return true;
}
