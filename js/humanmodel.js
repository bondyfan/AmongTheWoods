// Real rigged human (Quaternius "Universal Base Characters") standing in for the
// hand-built box `makeMan()`. The trick: makeHumanMan() returns a Group shaped
// EXACTLY like makeMan()'s output — same userData keys (leftLeg, rightLeg,
// leftArm, rightArm, rightSocket, leftSocket, torso, armL, armR, leaf, capSlot,
// hair) — so nothing in player.js has to change. Those "handles" are wired onto
// the glTF's real skeleton: leg/arm proxies drive the thigh/upperarm bones each
// frame, weapon sockets live on the hand bones, capSlot on the head bone.
import * as THREE from 'three';
import { GLTFLoader } from '../libs/GLTFLoader.js';
import { clone as skeletonClone } from '../libs/SkeletonUtils.js';

const MODEL_URL = 'assets/models/human/human.gltf';

// ── Tunables ─────────────────────────────────────────────────────────────────
const TARGET_H = 2.58;        // 1.5× the box man's ~1.72 height (experimental)
const FACE_Y   = 0;           // yaw so the model's front lines up with +Z
const SOCKET_OFFSET_R = new THREE.Vector3(0, 0, 0); // seat the weapon in the palm
const SOCKET_OFFSET_L = new THREE.Vector3(0, 0, 0);
const ARM_TUCK = 1.40;        // rad: pull the T-pose arms down to the sides (~80°)

// The model rests in a T-pose (arms straight out ±X, legs straight down). The
// box rig, by contrast, drives limbs as if they hang down at rotation 0. So we
// re-express every drive in the CHARACTER's own frame (X = pitch fwd/back, Z =
// roll to the side) and conjugate it into each bone's parent space — see drive()
// below. `tuck` is the static Z rotation that brings that T-pose arm down.
const DRIVE = {
  thigh_l:    { tuck: 0,          legs: true  },
  thigh_r:    { tuck: 0,          legs: true  },
  upperarm_l: { tuck: -ARM_TUCK,  legs: false },
  upperarm_r: { tuck:  ARM_TUCK,  legs: false },
};

let _template = null; // loaded, un-scaled glTF scene used as the clone source

export async function preloadHumanModel() {
  if (_template) return _template;
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  _template = gltf.scene;
  _template.updateMatrixWorld(true);
  return _template;
}

export function humanReady() { return !!_template; }

// Experimental "real rigged human" avatar — off by default, gated behind a
// Graphics checkbox. Read straight from localStorage so it's available before
// the settings object is constructed (the player is built during early boot).
export function humanModelEnabled() {
  try { return !!JSON.parse(localStorage.getItem('atw-settings') || '{}').humanModel; }
  catch { return false; }
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

// Drive a bone from a rotation authored in CHARACTER space (pitch about X =
// swing forward/back, roll about Z = tuck/tilt sideways). We conjugate that
// character-space rotation into the bone's parent frame so it lands correctly
// no matter how the parent (e.g. an angled clavicle) is oriented:
//   local = (parentWorld⁻¹ · Aworld · parentWorld) · restLocal
function drive(d, pitch, roll) {
  if (!d.bone) return;
  _e.set(pitch, 0, d.tuck + roll, 'XYZ');   // Aworld = Rx(pitch)·Rz(tuck+roll)
  _q.setFromEuler(_e);
  d.bone.quaternion.copy(d.parentInv).multiply(_q).multiply(d.parentQ).multiply(d.rest);
}

export function makeHumanMan() {
  const g = new THREE.Group();
  const model = skeletonClone(_template);

  // Fit to height and drop the feet onto y = 0.
  let bb = new THREE.Box3().setFromObject(model);
  const h = bb.max.y - bb.min.y || 1;
  model.scale.setScalar(TARGET_H / h);
  model.rotation.y = FACE_Y;
  model.updateMatrixWorld(true);
  bb = new THREE.Box3().setFromObject(model);
  model.position.y -= bb.min.y;
  g.add(model);

  // Index bones + skinned meshes.
  const bone = {};
  const skinned = [];
  model.traverse(o => {
    if (o.name) bone[o.name] = o;
    if (o.isSkinnedMesh) { skinned.push(o); o.frustumCulled = false; }
  });
  g.updateMatrixWorld(true);

  // Weapon/cap sockets ride the real bones but are re-aligned to the character's
  // axes and un-scaled, so weapons authored in box-man units drop in unchanged.
  const mkSocket = (host, offset) => {
    const s = new THREE.Group();
    if (host) {
      host.add(s);
      host.updateMatrixWorld(true);
      const p = new THREE.Vector3(), rq = new THREE.Quaternion(), sc = new THREE.Vector3();
      host.matrixWorld.decompose(p, rq, sc);
      s.quaternion.copy(rq).invert();      // cancel the bone's world spin
      s.scale.setScalar(1 / (sc.x || 1));  // cancel the model scale
      s.position.copy(offset);
    }
    return s;
  };
  const rightSocket = mkSocket(bone.hand_r, SOCKET_OFFSET_R);
  const leftSocket  = mkSocket(bone.hand_l, SOCKET_OFFSET_L);
  const capSlot     = mkSocket(bone.Head, new THREE.Vector3(0, 0, 0));

  // Proxy handles: player.js animates these; we mirror them onto the bones.
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  const torso = new THREE.Group(), leaf = new THREE.Group(), hair = new THREE.Group();
  const armL = new THREE.Group(), armR = new THREE.Group();
  g.add(leftLeg, rightLeg, leftArm, rightArm); // kept in-graph, invisible

  g.userData = {
    leftLeg, rightLeg, leftArm, rightArm, rightSocket, leftSocket,
    torso, armL, armR, leaf, capSlot, hair, human: true,
  };

  // Precompute each driven bone's rest local pose + its parent's world spin, so
  // the per-frame drive() is cheap and correct in character space.
  const drivers = {};
  for (const n of Object.keys(DRIVE)) {
    const b = bone[n];
    if (!b) continue;
    const parentQ = new THREE.Quaternion();
    (b.parent || model).getWorldQuaternion(parentQ);
    drivers[n] = {
      bone: b,
      rest: b.quaternion.clone(),
      parentQ,
      parentInv: parentQ.clone().invert(),
      tuck: DRIVE[n].tuck,
    };
  }

  // Every frame, just before this mesh draws (after player._animate set the
  // proxies), push the proxy rotations onto the skeleton. scene.updateMatrixWorld
  // already ran this frame, so we re-solve the bone subtree here (no 1-frame lag).
  const skeletons = new Set(skinned.map(m => m.skeleton));
  const armature = bone.Armature || skinned[0]?.skeleton.bones[0]?.parent || model;
  if (skinned[0]) {
    skinned[0].onBeforeRender = () => {
      if (drivers.thigh_l)    drive(drivers.thigh_l,    leftLeg.rotation.x,  leftLeg.rotation.z);
      if (drivers.thigh_r)    drive(drivers.thigh_r,    rightLeg.rotation.x, rightLeg.rotation.z);
      if (drivers.upperarm_l) drive(drivers.upperarm_l, leftArm.rotation.x,  leftArm.rotation.z);
      if (drivers.upperarm_r) drive(drivers.upperarm_r, rightArm.rotation.x, rightArm.rotation.z);
      armature.updateMatrixWorld(true);
      for (const sk of skeletons) sk.update();
    };
  }

  return g;
}
