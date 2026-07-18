// ---- Procedural low-poly models (no external assets) ----

import * as THREE from 'three';

const matCache = new Map();
export function mat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
}

function box(w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = true;
  return m;
}

function cyl(rTop, rBot, h, color, seg = 7) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat(color));
  m.castShadow = true;
  return m;
}

function cone(r, h, color, seg = 7) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color));
  m.castShadow = true;
  return m;
}

function sphere(r, color, seg = 8) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(5, seg - 2)), mat(color));
  m.castShadow = true;
  return m;
}

// ---------- Player ----------
// Starts NAKED except for a leaf; clothing recolors the torso/arms and hides
// the leaf (player._refreshOutfit drives this via userData refs).
export function makeMan() {
  const g = new THREE.Group();
  const skin = 0xd9a066;

  const leftLeg = box(0.2, 0.5, 0.2, skin); leftLeg.position.set(-0.13, 0.25, 0);
  const rightLeg = box(0.2, 0.5, 0.2, skin); rightLeg.position.set(0.13, 0.25, 0);
  const torso = box(0.5, 0.62, 0.3, skin); torso.position.y = 0.81;
  const head = box(0.32, 0.32, 0.32, skin); head.position.y = 1.32;
  const hair = box(0.34, 0.1, 0.34, 0x3a2a1a); hair.position.y = 1.5;

  // +Z is the character's front. Bright eyes and dark pupils make facing
  // readable from both the top-down camera and the co-op partner's view.
  const leftEye = box(0.085, 0.075, 0.025, 0xf6f1df); leftEye.position.set(-0.075, 1.35, 0.17);
  const rightEye = box(0.085, 0.075, 0.025, 0xf6f1df); rightEye.position.set(0.075, 1.35, 0.17);
  const leftPupil = box(0.034, 0.044, 0.018, 0x201b16); leftPupil.position.set(-0.075, 1.345, 0.19);
  const rightPupil = box(0.034, 0.044, 0.018, 0x201b16); rightPupil.position.set(0.075, 1.345, 0.19);

  // the famous leaf (front and back, at the hips)
  const leaf = new THREE.Group();
  const leafF = box(0.26, 0.22, 0.04, 0x3c7f37); leafF.position.set(0, 0.52, -0.18);
  const leafB = box(0.26, 0.22, 0.04, 0x2d6a2d); leafB.position.set(0, 0.52, 0.18);
  leaf.add(leafF, leafB);
  g.add(leaf);

  // Arms pivot at the shoulder so they can swing/punch.
  const leftArm = new THREE.Group(); leftArm.position.set(-0.33, 1.06, 0);
  const la = box(0.15, 0.52, 0.15, skin); la.position.y = -0.26; leftArm.add(la);
  const rightArm = new THREE.Group(); rightArm.position.set(0.33, 1.06, 0);
  const ra = box(0.15, 0.52, 0.15, skin); ra.position.y = -0.26; rightArm.add(ra);
  const fist = box(0.16, 0.14, 0.16, skin); fist.position.y = -0.56; rightArm.add(fist);

  // Weapon sockets (axe in right hand, bow in left hand)
  const rightSocket = new THREE.Group(); rightSocket.position.set(0, -0.56, 0); rightArm.add(rightSocket);
  const leftSocket = new THREE.Group(); leftSocket.position.set(0, -0.5, 0); leftArm.add(leftSocket);

  // cap slot (filled when head gear is equipped)
  const capSlot = new THREE.Group(); capSlot.position.y = 1.52; g.add(capSlot);

  g.add(leftLeg, rightLeg, torso, head, hair, leftEye, rightEye, leftPupil, rightPupil, leftArm, rightArm);
  g.userData = { leftLeg, rightLeg, leftArm, rightArm, rightSocket, leftSocket,
                 torso, armL: la, armR: ra, leaf, capSlot, hair };
  return g;
}

// Axe: handle along the arm, blade at the top pointing FORWARD (+z is the
// player's facing/swing direction), with a bright cutting edge.
export function makeAxe(tier) {
  const g = new THREE.Group();
  const s = tier >= 3 ? 1.3 : tier >= 2 ? 1.15 : 1;
  const headColor = tier >= 3 ? 0xff8844 : tier >= 2 ? 0xcfd6dd : 0x8a8a8a;
  const handle = box(0.06, 0.6, 0.06, 0x6b4a2d);
  handle.position.y = -0.08;
  const head = box(0.07, 0.16 * s, 0.24 * s, headColor);
  head.position.set(0, 0.2, 0.12 * s);
  const edge = box(0.05, 0.2 * s, 0.05, 0xe8eef2);
  edge.position.set(0, 0.2, 0.26 * s);
  g.add(handle, head, edge);
  if (tier >= 3) { // war axe: double-bladed
    const head2 = head.clone(); head2.position.z = -0.12 * s;
    const edge2 = edge.clone(); edge2.position.z = -0.26 * s;
    g.add(head2, edge2);
  }
  return g;
}

// pickaxe: curved spike head on a haft (bone tier 1, iron tier 2)
export function makePickaxe(tier) {
  const g = new THREE.Group();
  const headColor = tier >= 2 ? 0xcfd6dd : 0xe8e0cc; // iron / bone
  const handle = box(0.06, 0.62, 0.06, 0x6b4a2d);
  handle.position.y = -0.08;
  const spike1 = box(0.06, 0.07, 0.3, headColor);
  spike1.position.set(0, 0.22, 0.14);
  spike1.rotation.x = -0.35;
  const spike2 = box(0.06, 0.07, 0.3, headColor);
  spike2.position.set(0, 0.22, -0.14);
  spike2.rotation.x = 0.35;
  g.add(handle, spike1, spike2);
  return g;
}

export function makeBow(tier) {
  const g = new THREE.Group();
  const color = tier >= 2 ? 0x8a5a1a : 0x5c4326;
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 5, 10, Math.PI), mat(color));
  arc.castShadow = true;
  arc.rotation.z = Math.PI / 2;
  g.add(arc);
  return g;
}

// ---------- Animals ----------
function quadruped({ bodyW, bodyH, bodyL, color, headSize, snout, snoutColor, earColor, legH, tail, eyeColor }) {
  const g = new THREE.Group();
  const body = box(bodyW, bodyH, bodyL, color);
  body.position.y = legH + bodyH / 2;
  g.add(body);

  const head = box(headSize, headSize, headSize, color);
  head.position.set(0, legH + bodyH + headSize * 0.1, -bodyL / 2 - headSize * 0.25);
  g.add(head);

  if (snout) {
    const sn = box(headSize * 0.5, headSize * 0.42, headSize * 0.6, snoutColor || color);
    sn.position.set(0, -headSize * 0.15, -headSize * 0.6);
    head.add(sn);
  }
  // ears
  const e1 = box(headSize * 0.22, headSize * 0.3, headSize * 0.12, earColor || color);
  e1.position.set(-headSize * 0.3, headSize * 0.6, 0); head.add(e1);
  const e2 = e1.clone(); e2.position.x = headSize * 0.3; head.add(e2);
  // eyes
  if (eyeColor) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const ey1 = new THREE.Mesh(new THREE.BoxGeometry(headSize * 0.12, headSize * 0.12, headSize * 0.06), eyeMat);
    ey1.position.set(-headSize * 0.22, headSize * 0.1, -headSize * 0.51); head.add(ey1);
    const ey2 = ey1.clone(); ey2.position.x = headSize * 0.22; head.add(ey2);
  }

  const legs = [];
  const lx = bodyW / 2 - 0.08, lz = bodyL / 2 - 0.12;
  for (const [x, z] of [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]]) {
    const leg = box(0.13, legH, 0.13, color);
    leg.position.set(x, legH / 2, z);
    g.add(leg); legs.push(leg);
  }

  if (tail) {
    const t = box(0.1, 0.1, 0.42, color);
    t.position.set(0, legH + bodyH, bodyL / 2 + 0.16);
    t.rotation.x = -0.5;
    g.add(t);
  }

  g.userData = { legs, head };
  return g;
}

export function makeWolf(kind = 'black') {
  const colors = { black: 0x1b1b1f, ice: 0xbcd8e8, tame: 0xb08a5a };
  const eyes = { black: 0xff3322, ice: 0x2299ff, tame: 0x2a1a0a };
  const g = quadruped({
    bodyW: 0.48, bodyH: 0.45, bodyL: 1.05, color: colors[kind],
    headSize: 0.36, snout: true, legH: 0.38, tail: true, eyeColor: eyes[kind],
  });
  return g;
}

export function makeBoar() {
  const g = quadruped({
    bodyW: 0.66, bodyH: 0.58, bodyL: 1.1, color: 0x5a3a26,
    headSize: 0.42, snout: true, snoutColor: 0xc98f7a, legH: 0.3, eyeColor: 0xffffff,
  });
  // tusks
  const head = g.userData.head;
  const t1 = box(0.05, 0.16, 0.05, 0xf0e6d0);
  t1.position.set(-0.14, -0.2, -0.32); t1.rotation.x = 0.4; head.add(t1);
  const t2 = t1.clone(); t2.position.x = 0.14; head.add(t2);
  return g;
}

export function makeBear() {
  const g = quadruped({
    bodyW: 0.95, bodyH: 0.85, bodyL: 1.5, color: 0x4a3222,
    headSize: 0.55, snout: true, snoutColor: 0x6b4a33, legH: 0.42, eyeColor: 0x110a05,
  });
  return g;
}

export function makeYeti() {
  const g = new THREE.Group();
  const fur = 0xe8eef2, face = 0x8fa4b0;
  const leftLeg = box(0.3, 0.7, 0.32, fur); leftLeg.position.set(-0.24, 0.35, 0);
  const rightLeg = box(0.3, 0.7, 0.32, fur); rightLeg.position.set(0.24, 0.35, 0);
  const torso = box(0.95, 1.05, 0.6, fur); torso.position.y = 1.22;
  const head = box(0.52, 0.5, 0.5, fur); head.position.y = 2.0;
  const facePlate = box(0.34, 0.3, 0.06, face); facePlate.position.set(0, -0.02, -0.25); head.add(facePlate);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x66d9ff });
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
  e1.position.set(-0.09, 0.05, -0.29); head.add(e1);
  const e2 = e1.clone(); e2.position.x = 0.09; head.add(e2);

  const leftArm = new THREE.Group(); leftArm.position.set(-0.62, 1.62, 0);
  const la = box(0.26, 0.95, 0.28, fur); la.position.y = -0.42; leftArm.add(la);
  const rightArm = new THREE.Group(); rightArm.position.set(0.62, 1.62, 0);
  const ra = box(0.26, 0.95, 0.28, fur); ra.position.y = -0.42; rightArm.add(ra);

  g.add(leftLeg, rightLeg, torso, head, leftArm, rightArm);
  g.userData = { legs: [leftLeg, rightLeg], arms: [leftArm, rightArm], head };
  return g;
}

export function makeSpider(kind = 'forest') {
  const palettes = {
    forest: { body: 0x2a1f18, abdomen: 0x1c140e, legs: 0x241a12, eyes: 0xff3322, scale: 1 },
    venom:  { body: 0x3a5a28, abdomen: 0x2c4a1e, legs: 0x2e4520, eyes: 0x7dff3a, scale: 1.15 },
    frost:  { body: 0xd8e6ee, abdomen: 0xbcd4e2, legs: 0x9db4c2, eyes: 0x2299ff, scale: 1.2 },
  };
  const pal = palettes[kind];
  const g = new THREE.Group();
  const body = sphere(0.28, pal.body, 8);
  body.position.set(0, 0.42, 0.05);
  const abdomen = sphere(0.36, pal.abdomen, 8);
  abdomen.position.set(0, 0.5, 0.42);
  const head = sphere(0.17, pal.body, 7);
  head.position.set(0, 0.4, -0.28);
  const eyeMat = new THREE.MeshBasicMaterial({ color: pal.eyes });
  for (const ex of [-0.07, 0.07]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), eyeMat);
    eye.position.set(ex, 0.44, -0.43);
    g.add(eye);
  }
  const legs = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.22, 0.45, -0.25 + i * 0.18);
      const upper = box(0.04, 0.04, 0.34, pal.legs);
      upper.position.set(side * 0.16, 0.04, 0);
      upper.rotation.y = side * -0.9;
      const lower = box(0.035, 0.4, 0.035, pal.legs);
      lower.position.set(side * 0.32, -0.2, upper.position.z + side * -0.12 * 0);
      lower.rotation.z = side * 0.35;
      leg.add(upper, lower);
      g.add(leg);
      legs.push(leg);
    }
  }
  g.add(body, abdomen, head);
  g.userData = { legs, head, spider: true };
  g.scale.multiplyScalar(pal.scale);
  return g;
}

export function makeRat() {
  const g = quadruped({
    bodyW: 0.32, bodyH: 0.26, bodyL: 0.62, color: 0x8a8580,
    headSize: 0.24, snout: true, snoutColor: 0xc9a0a0, legH: 0.16, eyeColor: 0x1a0a0a,
  });
  const tail = box(0.05, 0.05, 0.55, 0xc9a0a0);
  tail.position.set(0, 0.28, 0.55);
  tail.rotation.x = 0.25;
  g.add(tail);
  return g;
}

export function makeRabbit() {
  const g = quadruped({
    bodyW: 0.28, bodyH: 0.26, bodyL: 0.48, color: 0xd8c6a4,
    headSize: 0.2, snout: true, snoutColor: 0xf0d6c8, legH: 0.18, eyeColor: 0x1a0a0a,
  });
  const head = g.userData.head;
  for (const ex of [-0.07, 0.07]) {
    const ear = box(0.05, 0.34, 0.06, 0xd8c6a4);
    ear.position.set(ex, 0.28, 0.02);
    ear.rotation.z = ex < 0 ? 0.14 : -0.14;
    head.add(ear);
  }
  const tail = sphere(0.09, 0xf0e4d0, 6);
  tail.position.set(0, 0.28, 0.32);
  g.add(tail);
  return g;
}

export function makeSheep() {
  const g = quadruped({
    bodyW: 0.55, bodyH: 0.5, bodyL: 0.85, color: 0xe9e4d6,
    headSize: 0.3, snout: true, snoutColor: 0x4a423a, earColor: 0x4a423a,
    legH: 0.28, eyeColor: 0x1a0a0a,
  });
  // woolly lumps over the body
  for (const [x, y, z] of [[-0.2, 0.85, -0.25], [0.22, 0.9, 0.05], [-0.15, 0.88, 0.3], [0.1, 0.92, -0.15]]) {
    const puff = sphere(0.2, 0xf4f0e4, 6);
    puff.position.set(x, y, z);
    g.add(puff);
  }
  const head = g.userData.head;
  head.material = head.material.clone();
  head.material.color.setHex(0x4a423a); // dark face under the wool
  return g;
}

// ---------- Landmarks (POIs) ----------
// An ancient shrine: stone dais with a floating glowing crystal.
export function makeShrine() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.5, 8), mat(0x8f8a7c));
  base.position.y = 0.25;
  g.add(base);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const pillar = box(0.35, 1.7, 0.35, 0x7c786c);
    pillar.position.set(Math.cos(a) * 1.3, 1.3, Math.sin(a) * 1.3);
    g.add(pillar);
  }
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45),
    new THREE.MeshLambertMaterial({ color: 0x7fd1ff, emissive: 0x2a6a9e, transparent: true, opacity: 0.9 }));
  crystal.position.y = 1.7;
  g.add(crystal);
  g.userData.crystal = crystal;
  return g;
}

// A looming rune monolith.
export function makeMonolith() {
  const g = new THREE.Group();
  const slab = box(1.1, 4.2, 0.7, 0x4c5157);
  slab.position.y = 2.1;
  slab.rotation.y = 0.3;
  g.add(slab);
  for (const [y, w] of [[1.2, 0.5], [2.2, 0.4], [3.1, 0.55]]) {
    const rune = box(w, 0.12, 0.06, 0x9adcff);
    rune.position.set(0, y, 0.38);
    rune.rotation.y = 0.3;
    g.add(rune);
  }
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 0.4, 7), mat(0x666c75));
  foot.position.y = 0.2;
  g.add(foot);
  return g;
}

// A half-buried crypt: stone walls, a dark doorway, guarded treasure.
export function makeCrypt() {
  const g = new THREE.Group();
  const body = box(3.6, 2, 2.8, 0x8f8a7c);
  body.position.y = 1;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.6, 1.4, 4), mat(0x6e7280));
  roof.position.y = 2.7;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = box(1, 1.4, 0.15, 0x1c1a18);
  door.position.set(0, 0.7, 1.42);
  g.add(door);
  for (const dx of [-1.4, 1.4]) {
    const skull = sphere(0.22, 0xf0ead8, 6);
    skull.position.set(dx, 2.1, 1.3);
    g.add(skull);
  }
  return g;
}

// A wandering blacksmith: anvil, glowing forge brazier and the smith himself.
// Weapons & gear can ONLY be forged here.
export function makeBlacksmith() {
  const g = new THREE.Group();
  // anvil on a stump
  const stump = cyl(0.42, 0.5, 0.5, 0x6b4a2d, 7);
  stump.position.set(0.7, 0.25, 0);
  const anvil = box(0.7, 0.24, 0.3, 0x4c5157);
  anvil.position.set(0.7, 0.62, 0);
  const horn = box(0.24, 0.14, 0.2, 0x4c5157);
  horn.position.set(1.15, 0.6, 0);
  // forge brazier with embers
  const brazier = cyl(0.5, 0.36, 0.5, 0x5c6670, 7);
  brazier.position.set(-0.9, 0.25, -0.4);
  const embers = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 5),
    new THREE.MeshLambertMaterial({ color: 0xff8030, emissive: 0xa83010 }));
  embers.position.set(-0.9, 0.55, -0.4);
  // the smith: burly figure with a dark apron and a hammer
  const smith = new THREE.Group();
  const legs = box(0.42, 0.5, 0.26, 0x3a3230); legs.position.y = 0.25;
  const torso = box(0.56, 0.62, 0.34, 0x6e4d2a); torso.position.y = 0.85;
  const apron = box(0.5, 0.55, 0.06, 0x2c2622); apron.position.set(0, 0.8, -0.2);
  const head = box(0.3, 0.3, 0.3, 0xd9a066); head.position.y = 1.35;
  const beard = box(0.26, 0.16, 0.08, 0x5c4326); beard.position.set(0, 1.24, -0.17);
  const armR = box(0.14, 0.5, 0.14, 0xd9a066); armR.position.set(0.35, 0.95, 0);
  armR.rotation.z = -0.5;
  const hammerHandle = box(0.05, 0.4, 0.05, 0x6b4a2d);
  hammerHandle.position.set(0.55, 1.25, 0);
  const hammerHead = box(0.16, 0.12, 0.24, 0x8f99a3);
  hammerHead.position.set(0.55, 1.45, 0);
  smith.add(legs, torso, apron, head, beard, armR, hammerHandle, hammerHead);
  smith.position.set(0, 0, 0.5);
  smith.rotation.y = Math.PI; // facing the anvil
  g.add(stump, anvil, horn, brazier, embers, smith);
  g.userData.embers = embers;
  return g;
}

export function makeEssenceDrop() {
  const g = new THREE.Group();
  const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.18),
    new THREE.MeshLambertMaterial({ color: 0x5fe07f, emissive: 0x1a7a35, transparent: true, opacity: 0.92 }));
  drop.position.y = 0.3;
  g.add(drop);
  return g;
}

// flat ground cobweb: concentric rings + spokes, laid around spider packs
export function makeCobweb(rng = Math.random) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xe8e8e0, transparent: true, opacity: 0.55 });
  const pts = [];
  const spokes = 7;
  const R = 2.2 + rng() * 1.8;
  for (let s = 0; s < spokes; s++) {
    const a = (s / spokes) * Math.PI * 2;
    pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R));
  }
  for (const k of [0.4, 0.7, 1]) {
    for (let s = 0; s < spokes; s++) {
      const a1 = (s / spokes) * Math.PI * 2, a2 = ((s + 1) / spokes) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a1) * R * k, 0, Math.sin(a1) * R * k),
               new THREE.Vector3(Math.cos(a2) * R * k, 0, Math.sin(a2) * R * k));
    }
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  g.add(new THREE.LineSegments(geo, mat));
  g.userData.radius = R;
  return g;
}

// berry bush: leafy mound with BLUEBERRIES that hide while regrowing
export function makeBerryBush(rng = Math.random) {
  const g = new THREE.Group();
  for (const [x, y, z, s] of [[0, 0.35, 0, 0.55], [-0.4, 0.28, 0.15, 0.4], [0.38, 0.3, -0.1, 0.42], [0.05, 0.3, 0.4, 0.38]]) {
    const puff = sphere(s, 0x3d6b2e, 6);
    puff.position.set(x, y, z);
    g.add(puff);
  }
  const berries = [];
  for (let i = 0; i < 7; i++) {
    const a = rng() * Math.PI * 2, r = 0.25 + rng() * 0.45;
    const b = sphere(0.09, 0x4a6de0, 5);
    b.position.set(Math.cos(a) * r, 0.45 + rng() * 0.35, Math.sin(a) * r);
    g.add(b);
    berries.push(b);
  }
  g.userData.berries = berries;
  return g;
}

export function makeSalveDrop() {
  const g = new THREE.Group();
  const flask = cyl(0.1, 0.14, 0.26, 0x6fd86f, 6);
  flask.position.y = 0.13;
  const cork = cyl(0.05, 0.05, 0.08, 0x8a5a2b, 5);
  cork.position.y = 0.3;
  g.add(flask, cork);
  return g;
}

export function makeRoastDrop() {
  const g = new THREE.Group();
  const meat = sphere(0.16, 0xb5682a, 6);
  meat.position.y = 0.14;
  meat.scale.set(1.3, 0.8, 1);
  const bone = cyl(0.03, 0.03, 0.3, 0xf0ead8, 5);
  bone.rotation.z = Math.PI / 2.4;
  bone.position.set(0.18, 0.16, 0);
  g.add(meat, bone);
  return g;
}

export function makeBerryDrop() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.09, 0], [0.09, 0.04], [0, -0.09]]) {
    const b = sphere(0.11, 0x4a6de0, 6);
    b.position.set(x, 0.1, z);
    g.add(b);
  }
  const leaf = box(0.14, 0.03, 0.08, 0x3d6b2e);
  leaf.position.set(0, 0.22, 0);
  g.add(leaf);
  return g;
}

export function makeSnake(kind = 'grass') {
  const palettes = {
    grass: { colors: [0x4a7a30, 0x3d6828], eyes: 0xffd23a, scale: 1 },
    storm: { colors: [0x3a4a6e, 0x5a6e9e], eyes: 0x7de8ff, scale: 1.25 },
  };
  const pal = palettes[kind];
  const g = new THREE.Group();
  const segments = [];
  for (let i = 0; i < 5; i++) {
    const s = i / 4;
    const seg = box(0.24 - s * 0.1, 0.18 - s * 0.05, 0.3, pal.colors[i % 2]);
    seg.position.set(0, 0.1, -0.5 + i * 0.28);
    g.add(seg);
    segments.push(seg);
  }
  // head with eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: pal.eyes });
  for (const ex of [-0.07, 0.07]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), eyeMat);
    eye.position.set(ex, 0.18, -0.63);
    g.add(eye);
  }
  if (kind === 'storm') { // little lightning crest
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4),
      new THREE.MeshBasicMaterial({ color: 0xffe94a }));
    crest.position.set(0, 0.3, -0.5);
    g.add(crest);
  }
  g.userData = { segments };
  g.scale.multiplyScalar(pal.scale);
  return g;
}

export function makeBat() {
  const g = new THREE.Group();
  const body = sphere(0.2, 0x3a2a30, 7);
  body.position.y = 0;
  const e1 = box(0.06, 0.12, 0.05, 0x3a2a30); e1.position.set(-0.08, 0.2, -0.05);
  const e2 = e1.clone(); e2.position.x = 0.08;
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
  for (const ex of [-0.07, 0.07]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), eyeMat);
    eye.position.set(ex, 0.02, -0.17);
    g.add(eye);
  }
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * 0.12, 0.05, 0);
    const membrane = box(0.55, 0.04, 0.3, 0x2a1c22);
    membrane.position.x = side * 0.3;
    wing.add(membrane);
    g.add(wing);
    wings.push(wing);
  }
  g.add(body, e1, e2);
  g.userData = { wings };
  return g;
}

export function makeElk() {
  const g = quadruped({
    bodyW: 0.7, bodyH: 0.72, bodyL: 1.35, color: 0x7a5636,
    headSize: 0.42, snout: true, snoutColor: 0x5c4028, legH: 0.62, eyeColor: 0x1a0d05,
  });
  // antlers
  const head = g.userData.head;
  for (const side of [-1, 1]) {
    const beam = box(0.06, 0.5, 0.06, 0xd9c9a8);
    beam.position.set(side * 0.16, 0.5, 0.05);
    beam.rotation.z = side * -0.35;
    head.add(beam);
    const tine = box(0.05, 0.28, 0.05, 0xd9c9a8);
    tine.position.set(side * 0.28, 0.62, 0.05);
    tine.rotation.z = side * 0.6;
    head.add(tine);
  }
  return g;
}

// Humanoid frame shared by wendigo & ice golem (yeti-like build).
function humanoid({ fur, face, eyes, width = 1, height = 1 }) {
  const g = new THREE.Group();
  const leftLeg = box(0.3 * width, 0.7 * height, 0.32, fur); leftLeg.position.set(-0.24 * width, 0.35 * height, 0);
  const rightLeg = box(0.3 * width, 0.7 * height, 0.32, fur); rightLeg.position.set(0.24 * width, 0.35 * height, 0);
  const torso = box(0.95 * width, 1.05 * height, 0.6, fur); torso.position.y = 1.22 * height;
  const head = box(0.52, 0.5, 0.5, fur); head.position.y = 2.0 * height;
  const facePlate = box(0.34, 0.3, 0.06, face); facePlate.position.set(0, -0.02, -0.25); head.add(facePlate);
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyes });
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
  e1.position.set(-0.09, 0.05, -0.29); head.add(e1);
  const e2 = e1.clone(); e2.position.x = 0.09; head.add(e2);
  const leftArm = new THREE.Group(); leftArm.position.set(-0.62 * width, 1.62 * height, 0);
  const la = box(0.26 * width, 0.95 * height, 0.28, fur); la.position.y = -0.42 * height; leftArm.add(la);
  const rightArm = new THREE.Group(); rightArm.position.set(0.62 * width, 1.62 * height, 0);
  const ra = box(0.26 * width, 0.95 * height, 0.28, fur); ra.position.y = -0.42 * height; rightArm.add(ra);
  g.add(leftLeg, rightLeg, torso, head, leftArm, rightArm);
  g.userData = { legs: [leftLeg, rightLeg], arms: [leftArm, rightArm], head };
  return g;
}

export function makeZombie() {
  const g = humanoid({ fur: 0x6a7a52, face: 0x8a9a6a, eyes: 0xff3322, width: 0.72, height: 0.92 });
  // tattered rags + a lolling head tilt
  const rags = box(0.7, 0.4, 0.5, 0x4a4238);
  rags.position.y = 0.95;
  g.add(rags);
  g.userData.head.rotation.z = 0.25;
  g.userData.arms.forEach(a => { a.rotation.x = -1.1; }); // classic zombie reach
  return g;
}

export function makeWendigo() {
  const g = humanoid({ fur: 0x4a4a52, face: 0xb8b0a4, eyes: 0xff2222, width: 0.8, height: 1.05 });
  // crooked antlers
  const head = g.userData.head;
  for (const side of [-1, 1]) {
    const horn = box(0.06, 0.4, 0.06, 0xd0c4b0);
    horn.position.set(side * 0.18, 0.42, 0);
    horn.rotation.z = side * -0.5;
    head.add(horn);
  }
  return g;
}

export function makeIceGolem() {
  return humanoid({ fur: 0xaabfcc, face: 0x6d8494, eyes: 0x66eaff, width: 1.25, height: 0.95 });
}

// wild horse: long-legged quadruped — saddle it and RIDE
export function makeHorse(rng = Math.random) {
  const g = new THREE.Group();
  const coat = [0x6b4a2d, 0x4a3520, 0x8a7a66, 0x2e2a26][Math.floor(rng() * 4)];
  const body = box(0.62, 0.62, 1.5, coat);
  body.position.y = 1.05;
  body.castShadow = true;
  g.add(body);
  const neck = box(0.32, 0.7, 0.34, coat);
  neck.position.set(0, 1.55, -0.72);
  neck.rotation.x = 0.5;
  g.add(neck);
  const head = box(0.3, 0.32, 0.62, coat);
  head.position.set(0, 1.95, -1.02);
  g.add(head);
  const muzzle = box(0.22, 0.22, 0.24, 0x3a2c1c);
  muzzle.position.set(0, -0.03, -0.4);
  head.add(muzzle);
  for (const side of [-1, 1]) {
    const ear = box(0.08, 0.18, 0.06, coat);
    ear.position.set(side * 0.1, 0.24, 0.1);
    head.add(ear);
  }
  const mane = box(0.12, 0.5, 0.5, 0x2a2018);
  mane.position.set(0, 1.75, -0.62);
  mane.rotation.x = 0.5;
  g.add(mane);
  const tail = box(0.12, 0.55, 0.12, 0x2a2018);
  tail.position.set(0, 1.15, 0.82);
  tail.rotation.x = -0.5;
  g.add(tail);
  const legs = [];
  for (const [lx, lz] of [[-0.24, -0.55], [0.24, -0.55], [-0.24, 0.55], [0.24, 0.55]]) {
    const leg = box(0.16, 0.78, 0.18, coat);
    leg.position.set(lx, 0.39, lz);
    g.add(leg);
    legs.push(leg);
  }
  g.userData = { legs, head };
  return g;
}

// dropped tuft of wool: soft white puffs
export function makeHoneyDrop() {
  const g = new THREE.Group();
  // a golden honeycomb slab: a hex grid of little cells
  const comb = box(0.34, 0.08, 0.30, 0xe0a828);
  comb.position.y = 0.1;
  g.add(comb);
  const cellMat = mat(0xc98a1e);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 6), cellMat);
    cell.position.set(Math.cos(a) * 0.09, 0.15, Math.sin(a) * 0.09);
    g.add(cell);
  }
  const centre = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 6), cellMat);
  centre.position.y = 0.15;
  g.add(centre);
  // a glossy honey drip
  const drip = sphere(0.06, 0xffca3a, 6);
  drip.position.set(0.12, 0.06, -0.1);
  g.add(drip);
  return g;
}

// a big woven straw skep — the destructible wild beehive (has HP)
export function makeBeehiveBig(rng = Math.random) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const r = 0.85 - i * 0.14;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.06, 0.34, 10),
      mat(i % 2 ? 0xd8b46a : 0xc9a352));
    ring.position.y = 0.3 + i * 0.32;
    ring.castShadow = true;
    g.add(ring);
  }
  const cap = sphere(0.5, 0xd8b46a, 8);
  cap.position.y = 1.95;
  cap.scale.y = 0.6;
  g.add(cap);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8),
    new THREE.MeshBasicMaterial({ color: 0x2a1c08 }));
  hole.position.set(0, 0.55, -0.86);
  g.add(hole);
  return g;
}

export function makeBee() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), mat(0xf2c033));
  body.scale.set(1, 0.8, 1.3);
  g.add(body);
  for (const z of [-0.06, 0.06]) {
    const stripe = box(0.22, 0.16, 0.05, 0x2a2018);
    stripe.position.z = z;
    g.add(stripe);
  }
  const wings = [];
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    w.scale.set(1.4, 0.3, 0.7);
    w.position.set(side * 0.12, 0.12, 0);
    g.add(w);
    wings.push(w);
  }
  g.userData = { wings };
  return g;
}

export function makeWoolDrop() {
  const g = new THREE.Group();
  for (const [x, y, z, r] of [[0, 0.14, 0, 0.16], [-0.12, 0.1, 0.06, 0.11], [0.12, 0.12, -0.05, 0.12], [0.02, 0.24, 0.04, 0.1]]) {
    const puff = sphere(r, 0xf2efe6, 6);
    puff.position.set(x, y, z);
    g.add(puff);
  }
  return g;
}

export function makeScorpion() {
  const g = new THREE.Group();
  const body = box(0.5, 0.28, 0.8, 0x8a5a30);
  body.position.y = 0.3;
  g.add(body);
  // curled tail with a stinger
  const tail = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = box(0.16 - i * 0.02, 0.16, 0.16, 0x7a4a28);
    seg.position.set(0, 0.35 + i * 0.16, 0.45 - i * 0.05);
    tail.add(seg);
  }
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), mat(0x2a1c10));
  sting.position.set(0, 0.9, 0.28);
  tail.add(sting);
  g.add(tail);
  // pincers
  for (const side of [-1, 1]) {
    const claw = box(0.2, 0.14, 0.3, 0x7a4a28);
    claw.position.set(side * 0.3, 0.3, -0.5);
    g.add(claw);
  }
  const legs = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const leg = box(0.08, 0.28, 0.08, 0x6a3a20);
    leg.position.set(side * 0.34, 0.2, -0.2 + Math.floor(i / 2) * 0.28);
    leg.rotation.z = side * 0.5;
    g.add(leg);
    legs.push(leg);
  }
  g.userData = { legs, spider: true };
  return g;
}

export function makeCobra() {
  const g = new THREE.Group();
  // coiled body
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.16, 6, 10), mat(0x9a8a3a));
  coil.rotation.x = -Math.PI / 2;
  coil.position.y = 0.2;
  g.add(coil);
  const neck = box(0.24, 0.7, 0.2, 0x9a8a3a);
  neck.position.set(0, 0.6, -0.2);
  neck.rotation.x = 0.4;
  g.add(neck);
  const hood = box(0.5, 0.4, 0.1, 0xb0a04a);
  hood.position.set(0, 0.95, -0.32);
  g.add(hood);
  const head = box(0.22, 0.2, 0.3, 0x8a7a30);
  head.position.set(0, 1.05, -0.45);
  g.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe0c040 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), eyeMat);
    eye.position.set(side * 0.07, 1.08, -0.58);
    g.add(eye);
  }
  const segs = [neck];
  g.userData = { segments: segs };
  return g;
}

export function makeVulture() {
  const g = new THREE.Group();
  const body = box(0.42, 0.4, 0.7, 0x3a3028);
  body.position.y = 1.4;
  g.add(body);
  const neck = box(0.14, 0.3, 0.14, 0xc9a980);
  neck.position.set(0, 1.7, -0.35);
  g.add(neck);
  const head = box(0.18, 0.18, 0.22, 0xd8b8a0);
  head.position.set(0, 1.9, -0.42);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), mat(0x2a1c10));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 1.88, -0.58);
  g.add(beak);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const membrane = box(0.9, 0.06, 0.5, 0x2a2018);
    membrane.position.x = side * 0.5;
    wing.add(membrane);
    wing.position.set(side * 0.2, 1.45, 0);
    g.add(wing);
    wings.push(wing);
  }
  g.userData = { wings };
  return g;
}

// ---------- Highlands western flavour: tumbleweeds, cacti, cactus-men ----------

// a dry rolling tumbleweed: a tangled ball of pale twigs
export function makeTumbleweed(rng = Math.random) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xbfa96a, transparent: true, opacity: 0.9 });
  const pts = [];
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2, b = rng() * Math.PI - Math.PI / 2;
    const a2 = a + (rng() - 0.5) * 1.2, b2 = b + (rng() - 0.5) * 1.2;
    const R = 0.75;
    pts.push(new THREE.Vector3(Math.cos(a) * Math.cos(b) * R, Math.sin(b) * R + 0.75, Math.sin(a) * Math.cos(b) * R));
    pts.push(new THREE.Vector3(Math.cos(a2) * Math.cos(b2) * R, Math.sin(b2) * R + 0.75, Math.sin(a2) * Math.cos(b2) * R));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  g.add(new THREE.LineSegments(geo, mat));
  return g;
}

// a saguaro cactus (decorative prop); armed=true adds a face for the enemy
function saguaro(rng = Math.random, armed = false) {
  const g = new THREE.Group();
  const green = 0x3f7a3a, darker = 0x356a30;
  const trunk = cyl(0.34, 0.42, 2.6, green, 8);
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  g.add(trunk);
  // ribs
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const rib = box(0.06, 2.4, 0.06, darker);
    rib.position.set(Math.cos(a) * 0.38, 1.3, Math.sin(a) * 0.38);
    g.add(rib);
  }
  // two upcurving arms
  for (const side of [-1, 1]) {
    if (!armed && rng() < 0.35) continue;
    const arm = cyl(0.2, 0.26, 1.0, green, 7);
    arm.position.set(side * 0.5, 1.5, 0);
    arm.rotation.z = side * 1.1;
    g.add(arm);
    const up = cyl(0.2, 0.22, 0.9, green, 7);
    up.position.set(side * 0.82, 2.05, 0);
    g.add(up);
  }
  // spines
  const spineMat = new THREE.MeshBasicMaterial({ color: 0xe8e0c0 });
  for (let i = 0; i < 20; i++) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 4), spineMat);
    const a = rng() * Math.PI * 2, y = 0.4 + rng() * 2.0;
    sp.position.set(Math.cos(a) * 0.42, y, Math.sin(a) * 0.42);
    sp.rotation.z = -Math.cos(a) * 1.57; sp.rotation.x = Math.sin(a) * 1.57;
    g.add(sp);
  }
  if (armed) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe24a });
    for (const sx of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), eyeMat);
      eye.position.set(sx, 1.75, -0.34);
      g.add(eye);
    }
    const mouth = box(0.22, 0.06, 0.05, 0x1e3a1c);
    mouth.position.set(0, 1.5, -0.36);
    g.add(mouth);
  }
  return g;
}
export function makeCactus(rng = Math.random) { return saguaro(rng, false); }
export function makeCactusMan() { return saguaro(Math.random, true); }

// ---------- biome landmark props (farm, trader, cocoon, graveyard...) ----------
// ---------- biome landmark props (farm, trader, cocoon, graveyard...) ----------

export function makeBanner(level = 1) {
  const g = new THREE.Group();
  const h = 3.2 + level * 0.6;
  const pole = cyl(0.08, 0.1, h, 0x6b4a2d, 6);
  pole.position.y = h / 2;
  pole.castShadow = true;
  g.add(pole);
  const cols = [0xb83a3a, 0xd8b84a, 0x4a8ad8];
  const flag = box(1.3, 0.9, 0.05, cols[Math.min(level - 1, 2)]);
  flag.position.set(0.72, h - 0.7, 0);
  g.add(flag);
  const trim = box(1.34, 0.12, 0.06, 0xf2ead8);
  trim.position.set(0.72, h - 1.15, 0);
  g.add(trim);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 6), mat(0xe8d84a));
  finial.position.y = h + 0.14;
  g.add(finial);
  // extra pennants at higher tiers
  for (let i = 1; i < level; i++) {
    const p = box(0.5, 0.3, 0.04, cols[i % 3]);
    p.position.set(0.5, h - 1.6 - i * 0.5, 0);
    g.add(p);
  }
  return g;
}

export function makeFarm(rng = Math.random) {
  const g = new THREE.Group();
  const barn = box(3.4, 2.0, 2.6, 0x8a4a30);
  barn.position.y = 1.0;
  barn.castShadow = true;
  g.add(barn);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.4, 4), mat(0x5c3a24));
  roof.position.y = 2.7;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = box(0.9, 1.3, 0.08, 0x3a2c18);
  door.position.set(0, 0.65, -1.32);
  g.add(door);
  // little wheat patch beside the barn
  for (let i = 0; i < 14; i++) {
    const stalk = box(0.06, 0.6 + rng() * 0.3, 0.06, 0xd8b84a);
    stalk.position.set(2.6 + rng() * 1.8, 0.35, -1 + rng() * 2.4);
    g.add(stalk);
  }
  return g;
}

export function makeTrader(rng = Math.random) {
  const g = new THREE.Group();
  const man = humanoid({ fur: 0x6a4a8a, face: 0xc9a980, eyes: 0xffe07f, width: 0.72, height: 0.9 });
  g.add(man);
  // hand cart with goods
  const cart = new THREE.Group();
  const bed = box(1.6, 0.16, 1.0, 0x6b4a2d);
  bed.position.y = 0.55;
  cart.add(bed);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 8), mat(0x4a3820));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 0.85, 0.34, 0);
    cart.add(wheel);
  }
  for (let i = 0; i < 3; i++) {
    const sack = sphere(0.22, [0xc9b48a, 0x8a9a6a, 0xb08c5a][i], 6);
    sack.position.set(-0.4 + i * 0.4, 0.8, (rng() - 0.5) * 0.4);
    sack.scale.y = 0.8;
    cart.add(sack);
  }
  cart.position.set(1.5, 0, 0.3);
  g.add(cart);
  return g;
}

export function makeBeehive() {
  const g = new THREE.Group();
  const body = cyl(0.26, 0.34, 0.5, 0xd8b84a, 7);
  body.position.y = 0.25;
  g.add(body);
  const band = cyl(0.35, 0.35, 0.08, 0xb08c3a, 7);
  band.position.y = 0.22;
  g.add(band);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), new THREE.MeshBasicMaterial({ color: 0x2a1c08 }));
  hole.position.set(0, 0.2, -0.33);
  g.add(hole);
  return g;
}

export function makeCocoon(rng = Math.random) {
  const g = new THREE.Group();
  const body = sphere(0.55, 0xe8e8e0, 7);
  body.scale.y = 1.55;
  body.position.y = 0.85;
  g.add(body);
  // silk strands wrapping it
  for (let i = 0; i < 4; i++) {
    const strand = box(1.15, 0.05, 0.05, 0xd8d8cc);
    strand.position.y = 0.5 + i * 0.28;
    strand.rotation.y = rng() * Math.PI;
    g.add(strand);
  }
  return g;
}

export function makeGlade(rng = Math.random) {
  const g = new THREE.Group();
  // the prize: one big glowing mushroom
  const stem = cyl(0.09, 0.13, 0.5, 0xcfe8d8, 6);
  stem.position.y = 0.25;
  g.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x7fffd4 }));
  cap.position.y = 0.5;
  g.add(cap);
  // fireflies: tiny glowing dots hovering on thin stalks
  for (let i = 0; i < 7; i++) {
    const fly = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xc9ff7f }));
    fly.position.set((rng() - 0.5) * 4, 0.8 + rng() * 1.4, (rng() - 0.5) * 4);
    g.add(fly);
  }
  return g;
}

export function makeCage() {
  const g = new THREE.Group();
  const base = box(1.3, 0.1, 1.3, 0x4a3820);
  base.position.y = 0.05;
  g.add(base);
  for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    const bar = box(0.09, 1.5, 0.09, 0x5a4a38);
    bar.position.set(x, 0.8, z);
    g.add(bar);
  }
  for (let i = 0; i < 4; i++) {
    const bar = box(0.07, 1.4, 0.07, 0x6b5a48);
    bar.position.set(-0.55 + (i % 2) * 1.1 === 0 ? 0 : -0.18 + i * 0.12, 0.75, i < 2 ? -0.55 : 0.55);
    bar.position.x = -0.18 + (i % 2) * 0.36;
    g.add(bar);
  }
  const top = box(1.3, 0.1, 1.3, 0x4a3820);
  top.position.y = 1.55;
  g.add(top);
  const man = humanoid({ fur: 0x7a6a58, face: 0xc9a980, eyes: 0x8a9a6a, width: 0.55, height: 0.62 });
  man.position.y = 0.1;
  g.add(man);
  g.userData.prisoner = man;
  return g;
}

export function makeGraveyardRuin(rng = Math.random) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const stone = box(0.5, 0.8 + rng() * 0.4, 0.14, 0x8a8a84);
    stone.position.set((rng() - 0.5) * 7, 0.45, (rng() - 0.5) * 7);
    stone.rotation.y = (rng() - 0.5) * 0.7;
    stone.rotation.z = (rng() - 0.5) * 0.25;
    g.add(stone);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 8, 1, false, 0, Math.PI),
      mat(0x8a8a84));
    cap.rotation.z = Math.PI / 2;
    cap.rotation.y = stone.rotation.y;
    cap.position.set(stone.position.x, stone.position.y + 0.42, stone.position.z);
    g.add(cap);
  }
  const arch = box(0.2, 2.4, 0.2, 0x5a5a52);
  arch.position.set(-1.1, 1.2, -3.4);
  g.add(arch);
  const arch2 = arch.clone(); arch2.position.x = 1.1; g.add(arch2);
  const lintel = box(2.6, 0.25, 0.25, 0x5a5a52);
  lintel.position.set(0, 2.4, -3.4);
  g.add(lintel);
  return g;
}

export function makeWisp() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xaef2ff, transparent: true, opacity: 0.9 }));
  core.position.y = 1.4;
  g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.25 }));
  halo.position.y = 1.4;
  g.add(halo);
  g.userData.core = core;
  return g;
}

export function makeCursedStatue() {
  const g = new THREE.Group();
  const plinth = box(1.2, 0.5, 1.2, 0x4c4258);
  plinth.position.y = 0.25;
  g.add(plinth);
  const figure = humanoid({ fur: 0x5a5468, face: 0x6a6478, eyes: 0xb26fff, width: 0.8, height: 0.95 });
  figure.position.y = 0.5;
  figure.userData.arms.forEach(a => { a.rotation.x = -0.9; }); // pleading reach
  g.add(figure);
  return g;
}

export function makeVillage(rng = Math.random) {
  const g = new THREE.Group();
  for (const [dx, dz, sc] of [[-3, 0, 1], [2.6, -1.5, 0.85], [1.8, 2.4, 0.9]]) {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.7 * sc, 3.0 * sc, 7), mat(0xa8865a));
    tent.position.set(dx, 1.5 * sc, dz);
    tent.castShadow = true;
    g.add(tent);
    const stripe = new THREE.Mesh(new THREE.ConeGeometry(1.72 * sc, 0.5 * sc, 7), mat(0x8a3c2e));
    stripe.position.set(dx, 1.1 * sc, dz);
    g.add(stripe);
  }
  // totem pole at the center
  const totem = box(0.5, 2.6, 0.5, 0x6b4a2d);
  totem.position.y = 1.3;
  g.add(totem);
  for (let i = 0; i < 3; i++) {
    const face = box(0.56, 0.3, 0.56, [0xd83c2e, 0xe8d84a, 0x4a8ad8][i]);
    face.position.y = 0.6 + i * 0.75;
    g.add(face);
  }
  const wings = box(1.6, 0.18, 0.3, 0x8a6b42);
  wings.position.y = 2.5;
  g.add(wings);
  return g;
}

export function makeRaceFlag(color = 0xd83c2e) {
  const g = new THREE.Group();
  const pole = cyl(0.07, 0.09, 3.2, 0x6b4a2d, 6);
  pole.position.y = 1.6;
  g.add(pole);
  const flag = box(1.0, 0.6, 0.05, color);
  flag.position.set(0.55, 2.8, 0);
  g.add(flag);
  g.userData.flag = flag;
  return g;
}

export function makeNest(rng = Math.random) {
  const g = new THREE.Group();
  // rock pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 3.4, 7), mat(0x8a8578));
  pillar.position.y = 1.7;
  pillar.castShadow = true;
  g.add(pillar);
  // twig ring
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const twig = box(0.7, 0.1, 0.12, 0x6b4a2d);
    twig.position.set(Math.cos(a) * 0.85, 3.5, Math.sin(a) * 0.85);
    twig.rotation.y = a + Math.PI / 2 + (rng() - 0.5) * 0.4;
    g.add(twig);
  }
  for (const [x, z] of [[-0.25, 0.1], [0.25, -0.1], [0, 0.3]]) {
    const egg = sphere(0.2, 0xf2ead8, 6);
    egg.scale.y = 1.25;
    egg.position.set(x, 3.55, z);
    g.add(egg);
  }
  return g;
}

export function makeLilypad(rng = Math.random) {
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1, 9, 0.5, Math.PI * 1.8), mat(0x4a8a3a));
  pad.rotation.x = -Math.PI / 2;
  pad.rotation.z = rng() * Math.PI * 2;
  return pad;
}

export function makeTemple() {
  const g = new THREE.Group();
  // mossy step pyramid
  for (let i = 0; i < 4; i++) {
    const size = 7 - i * 1.6;
    const step = box(size, 0.9, size, i % 2 ? 0x7a8578 : 0x6a7568);
    step.position.y = 0.45 + i * 0.9;
    step.castShadow = true;
    g.add(step);
  }
  const shrine = box(1.4, 1.2, 1.4, 0x5a6558);
  shrine.position.y = 4.2;
  g.add(shrine);
  const idol = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd24a }));
  idol.position.y = 5.1;
  g.add(idol);
  // vines
  for (let i = 0; i < 5; i++) {
    const vine = box(0.12, 2.5, 0.12, 0x2d6a2d);
    const a = (i / 5) * Math.PI * 2;
    vine.position.set(Math.cos(a) * 3.2, 1.6, Math.sin(a) * 3.2);
    g.add(vine);
  }
  return g;
}

export function makeLianaPole() {
  const g = new THREE.Group();
  const pole = cyl(0.14, 0.2, 4.6, 0x5a4426, 6);
  pole.position.y = 2.3;
  g.add(pole);
  const arm = box(1.3, 0.14, 0.14, 0x5a4426);
  arm.position.y = 4.4;
  g.add(arm);
  const vine = box(0.07, 1.1, 0.07, 0x2d8a34);
  vine.position.set(0.6, 3.85, 0);
  g.add(vine);
  return g;
}

export function makeSnapper() {
  const g = new THREE.Group();
  const bulb = sphere(0.55, 0x3f7a2e, 7);
  bulb.position.y = 0.5;
  bulb.scale.y = 1.2;
  g.add(bulb);
  // gaping jaw
  const jawTop = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 7), mat(0xd83c5e));
  jawTop.position.set(0, 1.35, -0.15);
  jawTop.rotation.x = 0.7;
  g.add(jawTop);
  for (let i = 0; i < 5; i++) { // teeth
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), mat(0xf2efe6));
    tooth.position.set(-0.3 + i * 0.15, 1.05, -0.42);
    tooth.rotation.x = Math.PI;
    g.add(tooth);
  }
  for (let i = 0; i < 4; i++) { // groping tendrils = 'legs' so they wave
    const t = box(0.09, 0.8, 0.09, 0x2d6a2d);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    t.position.set(Math.cos(a) * 0.6, 0.45, Math.sin(a) * 0.6);
    t.rotation.z = Math.cos(a) * 0.5;
    g.add(t);
  }
  g.userData = { legs: [] };
  return g;
}

export function makeBonfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const stone = box(0.3, 0.22, 0.26, 0x8a8578);
    stone.position.set(Math.cos(a) * 0.75, 0.11, Math.sin(a) * 0.75);
    g.add(stone);
  }
  for (const r of [0.3, 1.4, 2.5]) {
    const log = box(0.9, 0.16, 0.16, 0x4a3820);
    log.rotation.y = r;
    log.position.y = 0.18;
    g.add(log);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6),
    new THREE.MeshBasicMaterial({ color: 0xff9a30 }));
  flame.position.y = 0.75;
  g.add(flame);
  g.userData.flame = flame;
  return g;
}

export function makeSummitCairn() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 - i * 0.18, 0), mat(0xb8c4cc));
    rock.position.y = 0.6 + i * 0.85;
    rock.rotation.set(i * 0.7, i * 1.3, 0);
    g.add(rock);
  }
  const banner = box(0.08, 2.2, 0.08, 0x5a4426);
  banner.position.set(0.5, 5.2, 0);
  g.add(banner);
  const cloth = box(0.9, 0.5, 0.04, 0xd83c2e);
  cloth.position.set(0.95, 6.0, 0);
  g.add(cloth);
  return g;
}

// ---------- humanoid camp sites: a dwelling + campfire ----------
// kind 'tribal' (tribesman/shaman) gets a teepee; everyone else a log hut.
export function makeHumanCamp(kind = 'bandit', rng = Math.random) {
  const g = new THREE.Group();
  if (kind === 'tribal') {
    // hide teepee: cone with a smoke hole and painted stripe
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.0, 7), mat(0xa8865a));
    tent.position.y = 1.5;
    tent.castShadow = true;
    g.add(tent);
    const stripe = new THREE.Mesh(new THREE.ConeGeometry(1.72, 0.5, 7), mat(0x8a3c2e));
    stripe.position.y = 1.1;
    g.add(stripe);
    for (const side of [-1, 1]) { // crossed lodge poles peeking out the top
      const pole = box(0.07, 1.1, 0.07, 0x5a4426);
      pole.position.set(side * 0.22, 3.15, 0);
      pole.rotation.z = side * 0.35;
      g.add(pole);
    }
  } else {
    // squat log hut with a pitched plank roof
    const walls = box(2.6, 1.5, 2.2, 0x6b4a2d);
    walls.position.y = 0.75;
    walls.castShadow = true;
    g.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.3, 4), mat(0x4a3820));
    roof.position.y = 2.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    const door = box(0.7, 1.0, 0.08, 0x3a2c18);
    door.position.set(0, 0.5, -1.12);
    g.add(door);
  }
  // campfire: stone ring, charred logs, ember glow
  const fire = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const stone = box(0.22, 0.16, 0.2, 0x7a766b);
    stone.position.set(Math.cos(a) * 0.5, 0.08, Math.sin(a) * 0.5);
    stone.rotation.y = rng() * 2;
    fire.add(stone);
  }
  for (const r of [0, 1.1, 2.2]) {
    const log = box(0.6, 0.12, 0.12, 0x2e2018);
    log.rotation.y = r;
    log.position.y = 0.12;
    fire.add(log);
  }
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xff7a30 }));
  ember.position.y = 0.16;
  fire.add(ember);
  fire.position.set(2.4, 0, 0.6);
  g.add(fire);
  g.userData.embers = ember;
  return g;
}

// ---------- humanoids: bandits, tribes & other two-legged trouble ----------

function bowProp(color = 0x6b4a2d) {
  const g = new THREE.Group();
  const stave = box(0.06, 0.9, 0.06, color);
  stave.rotation.z = 0.15;
  g.add(stave);
  const string = box(0.015, 0.84, 0.015, 0xd8d0c0);
  string.position.x = 0.1;
  g.add(string);
  return g;
}

export function makeBandit() {
  const g = humanoid({ fur: 0x4a4038, face: 0xc9a980, eyes: 0xffd24a, width: 0.72, height: 0.88 });
  const hood = box(0.6, 0.26, 0.56, 0x2e2a24);
  hood.position.y = 0.3;
  g.userData.head.add(hood);
  const bow = bowProp();
  bow.position.set(0, -0.6, -0.15);
  g.userData.arms[0].add(bow);
  return g;
}

export function makeBanditBrute() {
  const g = humanoid({ fur: 0x5a4a38, face: 0xc9a980, eyes: 0xff8844, width: 1.05, height: 1.0 });
  const pauldron = box(0.5, 0.22, 0.5, 0x3a332c);
  pauldron.position.set(0.5, 1.85, 0);
  g.add(pauldron);
  const club = box(0.16, 0.85, 0.16, 0x6b4a2d);
  club.position.set(0, -0.75, 0);
  club.rotation.z = 0.35;
  g.userData.arms[1].add(club);
  return g;
}

export function makeTribesman() {
  const g = humanoid({ fur: 0x8a5a38, face: 0xa06a3c, eyes: 0xffe07f, width: 0.72, height: 0.92 });
  // war paint + feather
  const paint = box(0.36, 0.06, 0.07, 0xd83c2e);
  paint.position.set(0, 0.12, -0.26);
  g.userData.head.add(paint);
  const feather = box(0.05, 0.3, 0.05, 0xe8d84a);
  feather.position.set(0.15, 0.35, 0.1);
  feather.rotation.z = -0.3;
  g.userData.head.add(feather);
  const spear = box(0.06, 1.5, 0.06, 0x8a6b42);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5), mat(0xb8b4a8));
  tip.position.y = 0.85;
  spear.add(tip);
  spear.position.set(0, -0.55, 0);
  g.userData.arms[1].add(spear);
  return g;
}

export function makeShaman() {
  const g = humanoid({ fur: 0x3c3a4c, face: 0x8a9a6a, eyes: 0xb26fff, width: 0.75, height: 0.9 });
  const robe = box(0.85, 0.7, 0.55, 0x4a3c5c);
  robe.position.y = 0.62;
  g.add(robe);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xb26fff }));
  orb.position.set(0, -0.85, 0);
  g.userData.arms[0].add(orb);
  return g;
}

export function makePoacher() {
  const g = humanoid({ fur: 0x4c5a3a, face: 0xc9a980, eyes: 0xcfe8a4, width: 0.75, height: 0.92 });
  const hat = box(0.62, 0.12, 0.6, 0x3a4230);
  hat.position.y = 0.3;
  g.userData.head.add(hat);
  const bow = bowProp(0x4c4234);
  bow.position.set(0, -0.6, -0.15);
  g.userData.arms[0].add(bow);
  return g;
}

// ---------- new beasts ----------

export function makeThornling() {
  const g = humanoid({ fur: 0x3d6b2e, face: 0x2a4a20, eyes: 0xc9ff5f, width: 0.55, height: 0.6 });
  for (const [x, y, r] of [[-0.2, 1.5, 0.5], [0.22, 1.55, -0.4], [0, 1.7, 0]]) {
    const leaf = box(0.08, 0.34, 0.08, 0x5f9f3f);
    leaf.position.set(x, y * 0.6, 0);
    leaf.rotation.z = r;
    g.add(leaf);
  }
  return g;
}

export function makeTreant() {
  const g = humanoid({ fur: 0x5a4426, face: 0x3a2c18, eyes: 0xc9ff5f, width: 1.15, height: 1.1 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 6), mat(0x2d6a2d));
  crown.position.y = 0.45;
  g.userData.head.add(crown);
  for (const side of [-1, 1]) { // barky twig fingers
    const twig = box(0.07, 0.35, 0.07, 0x4a3820);
    twig.position.set(0, -0.95, 0);
    twig.rotation.z = side * 0.4;
    g.userData.arms[side === -1 ? 0 : 1].add(twig);
  }
  return g;
}

export function makeBogCrawler() {
  const g = new THREE.Group();
  const body = box(0.95, 0.4, 0.75, 0x5a6440);
  body.position.y = 0.45;
  g.add(body);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 5), mat(0x46503a));
  shell.scale.y = 0.55;
  shell.position.y = 0.7;
  g.add(shell);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd8ff7f });
  const legs = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const leg = box(0.1, 0.45, 0.1, 0x4a5434);
    leg.position.set(side * 0.55, 0.35, -0.25 + Math.floor(i / 2) * 0.28);
    leg.rotation.z = side * 0.5;
    g.add(leg);
    legs.push(leg);
  }
  for (const side of [-1, 1]) {
    const claw = box(0.22, 0.18, 0.3, 0x5a6440);
    claw.position.set(side * 0.45, 0.4, -0.55);
    g.add(claw);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), eyeMat);
    eye.position.set(side * 0.16, 0.62, -0.38);
    g.add(eye);
  }
  g.userData = { legs, spider: true };
  return g;
}

export function makeHarpy() {
  const g = humanoid({ fur: 0x7a6448, face: 0xc9a980, eyes: 0xffcc44, width: 0.6, height: 0.7 });
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const membrane = box(0.85, 0.05, 0.4, 0x8a7458);
    membrane.position.x = side * 0.45;
    wing.add(membrane);
    wing.position.set(side * 0.4, 1.35 * 0.7 + 0.35, 0.1);
    g.add(wing);
    wings.push(wing);
  }
  g.userData.wings = wings;
  return g;
}

export function makeFrostWisp() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff }));
  core.position.y = 0.9;
  g.add(core);
  const shardMat = mat(0xcfeaff);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), shardMat);
    shard.position.set(Math.cos(a) * 0.55, 0.9 + Math.sin(i * 2.1) * 0.15, Math.sin(a) * 0.55);
    shard.rotation.z = a;
    g.add(shard);
  }
  return g;
}

// ---------- griffin: lion body, eagle head, big animated wings ----------
export function makeGriffin(scale = 1) {
  const g = quadruped({
    bodyW: 0.72, bodyH: 0.62, bodyL: 1.35, color: 0xb08a4a,
    headSize: 0.5, legH: 0.5, tail: true, eyeColor: 0xffd24a,
  });
  const head = g.userData.head;
  // white eagle head with a hooked beak
  head.material = mat(0xe8e4d8);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 5), mat(0xd8a020));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, -0.05, -0.42);
  head.add(beak);
  // feathered chest
  const chest = box(0.74, 0.5, 0.4, 0xd8d0bc);
  chest.position.set(0, 0.82, -0.55);
  g.add(chest);
  // wings — large layered membranes on pivots so they can beat
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    const w1 = box(1.5, 0.08, 0.75, 0xa07c3e); w1.position.x = side * 0.8; wing.add(w1);
    const w2 = box(0.9, 0.06, 0.55, 0xd8d0bc); w2.position.set(side * 1.55, 0.02, 0.05); wing.add(w2);
    wing.position.set(side * 0.3, 1.25, 0.1);
    wing.rotation.z = side * -0.22;
    g.add(wing);
    wings.push(wing);
  }
  g.userData.wings = wings;
  g.scale.setScalar(scale);
  return g;
}

export function makeGhost() {
  const g = new THREE.Group();
  const shroudMat = new THREE.MeshLambertMaterial({ color: 0xcfd4ee, transparent: true, opacity: 0.55 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.7, 8), shroudMat);
  body.position.y = 1.0;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), shroudMat);
  head.position.y = 1.85;
  g.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8fb4ff });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), eyeMat);
    eye.position.set(side * 0.12, 1.9, -0.26);
    g.add(eye);
  }
  return g;
}

export function makePanther() {
  const g = quadruped({
    bodyW: 0.5, bodyH: 0.46, bodyL: 1.2, color: 0x14141a,
    headSize: 0.36, snout: true, snoutColor: 0x1e1e26, legH: 0.44, tail: true, eyeColor: 0x7fff4a,
  });
  return g;
}

// a PLACED griffin nest: twig ring on the ground with glowing eggs — the
// flight-master roost the player can travel between
export function makeGriffinRoost(rng = Math.random) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 9), mat(0x6b4a2d));
  base.position.y = 0.25;
  g.add(base);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const twig = box(0.9, 0.14, 0.16, 0x8a6238);
    twig.position.set(Math.cos(a) * 1.35, 0.62, Math.sin(a) * 1.35);
    twig.rotation.y = a + Math.PI / 2 + (rng() - 0.5) * 0.5;
    twig.rotation.z = (rng() - 0.5) * 0.3;
    g.add(twig);
  }
  for (const [x, z] of [[-0.35, 0.15], [0.35, -0.1], [0.05, 0.4]]) {
    const egg = sphere(0.24, 0xf2e8c8, 7);
    egg.scale.y = 1.3;
    egg.position.set(x, 0.62, z);
    g.add(egg);
  }
  // a golden feather marks it as a flight roost
  const feather = box(0.1, 1.1, 0.02, 0xe8c04a);
  feather.position.set(0, 1.3, -0.2);
  feather.rotation.z = 0.2;
  g.add(feather);
  return g;
}

export function makeEnemyMesh(type) {
  switch (type) {
    case 'rabbit': return makeRabbit();
    case 'sheep': return makeSheep();
    case 'rat': return makeRat();
    case 'spider': return makeSpider('forest');
    case 'venomspider': return makeSpider('venom');
    case 'icespider': return makeSpider('frost');
    case 'snake': return makeSnake('grass');
    case 'stormsnake': return makeSnake('storm');
    case 'bat': return makeBat();
    case 'wolf': return makeWolf('black');
    case 'icewolf': return makeWolf('ice');
    case 'boar': return makeBoar();
    case 'elk': return makeElk();
    case 'bear': return makeBear();
    case 'zombie': return makeZombie();
    case 'wendigo': return makeWendigo();
    case 'yeti': return makeYeti();
    case 'icegolem': return makeIceGolem();
    case 'bandit': return makeBandit();
    case 'banditBrute': return makeBanditBrute();
    case 'tribesman': return makeTribesman();
    case 'shaman': return makeShaman();
    case 'poacher': return makePoacher();
    case 'thornling': return makeThornling();
    case 'treant': return makeTreant();
    case 'bogCrawler': return makeBogCrawler();
    case 'harpy': return makeHarpy();
    case 'frostWisp': return makeFrostWisp();
    case 'horse': return makeHorse();
    case 'snapper': return makeSnapper();
    case 'scorpion': return makeScorpion();
    case 'cobra': return makeCobra();
    case 'vulture': return makeVulture();
    case 'cactusman': return makeCactusMan();
    case 'bee': return makeBee();
    case 'ghost': return makeGhost();
    case 'panther': return makePanther();
    case 'griffin': return makeGriffin(1);
    case 'griffinChick': return makeGriffin(0.45);
  }
}

export function makeBoulder(scale, color, rng) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), mat(color));
  m.castShadow = true;
  m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  m.scale.y = 0.8 + rng() * 0.5;
  return m;
}

export function makeEnemyShot(color) {
  return new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6),
    new THREE.MeshBasicMaterial({ color }));
}

// ---------- lair entrance: a burrow/cave mouth, dressed per biome ----------
// A low earthen mound with a gaping black hole — reads as "something lives
// down there", not as a building. Ring picks the biome dressing.
export function makeLairEntrance(ring = 0) {
  const THEMES = [
    { rock: 0x5d7a42, accent: 'leaves' },   // 0 Verdant — mossy burrow
    { rock: 0xc9a860, accent: 'bones' },    // 1 Desert — sun-bleached hollow
    { rock: 0x3a4a30, accent: 'roots' },    // 2 Dark Forest — root-torn maw
    { rock: 0x5a5c38, accent: 'reeds' },    // 3 Swamp — mud sinkhole
    { rock: 0x8a8578, accent: 'slabs' },    // 4 Highlands — cracked crag
    { rock: 0x55505e, accent: 'graves' },   // 5 Haunted — pale barrow
    { rock: 0x4a7a3a, accent: 'vines' },    // 6 Jungle — overgrown stone maw
    { rock: 0xc4d6e4, accent: 'icicles' },  // 7 Frozen — ice cave mouth
  ];
  const T = THEMES[ring] ?? THEMES[0];
  const g = new THREE.Group();

  // the mound: a squashed rocky dome
  const mound = sphere(2.5, T.rock, 7);
  mound.scale.set(1.3, 0.72, 1.05);
  mound.position.y = 0.35;
  g.add(mound);

  // the MOUTH: a pitch-black opening punched into the front face
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.0, 12),
    new THREE.MeshBasicMaterial({ color: 0x030303 }));
  mouth.position.set(0, 0.8, 2.42);
  mouth.rotation.x = -0.12;
  g.add(mouth);

  // rough boulders ringing the mouth like broken teeth
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.15 + (i / 4) * 0.7); // arc over the top of the hole
    const b = sphere(0.34 + Math.random() * 0.18, T.rock, 5);
    b.position.set(Math.cos(a) * 1.35, 0.8 + Math.sin(a) * 1.15, 2.3);
    b.scale.y = 0.8;
    g.add(b);
  }
  // trampled dirt apron in front of the hole
  const apron = new THREE.Mesh(new THREE.CircleGeometry(1.6, 9), mat(0x2c2418));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, 0.02, 3.0);
  g.add(apron);

  // ---- biome dressing ----
  const acc = T.accent;
  if (acc === 'leaves' || acc === 'vines') {
    // moss tufts / hanging vines over the mouth
    const green = acc === 'vines' ? 0x2f8a28 : 0x4a7a30;
    for (let i = 0; i < 4; i++) {
      const v = cyl(0.06, 0.06, 0.7 + Math.random() * 0.5, green, 5);
      v.position.set(-0.9 + i * 0.6, 1.6 - (acc === 'vines' ? 0.35 : 0.1), 2.45);
      g.add(v);
    }
  } else if (acc === 'bones') {
    // a great ribcage arching over the hole
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.3 + i * 0.12, 0.07, 5, 10, Math.PI),
        mat(0xe8e0d0));
      rib.position.set(0, 0.5, 1.6 - i * 0.7);
      g.add(rib);
    }
  } else if (acc === 'roots') {
    // gnarled roots clawing around the entrance
    for (let i = 0; i < 4; i++) {
      const r = cyl(0.1, 0.16, 1.7, 0x4a3520, 5);
      r.position.set(i < 2 ? -1.5 : 1.5, 0.8, 1.9 + (i % 2) * 0.4);
      r.rotation.z = (i < 2 ? -1 : 1) * (0.5 + (i % 2) * 0.3);
      g.add(r);
    }
  } else if (acc === 'reeds') {
    for (let i = 0; i < 6; i++) {
      const reed = cyl(0.045, 0.045, 1.0 + Math.random() * 0.6, 0x6a7a30, 4);
      const a = Math.random() * Math.PI * 2, rr = 2.2 + Math.random() * 0.8;
      reed.position.set(Math.cos(a) * rr, 0.5, Math.sin(a) * rr * 0.6 + 1.4);
      reed.rotation.z = (Math.random() - 0.5) * 0.3;
      g.add(reed);
    }
  } else if (acc === 'slabs') {
    // sheared rock slabs leaning against the crag
    for (let i = 0; i < 3; i++) {
      const s = box(0.5, 1.6, 0.25, 0x76705f);
      s.position.set(-1.8 + i * 1.8, 0.8, 1.6);
      s.rotation.z = (i - 1) * 0.35;
      g.add(s);
    }
  } else if (acc === 'graves') {
    // two leaning gravestones flanking the barrow mouth
    for (const side of [-1, 1]) {
      const gs = box(0.5, 0.9, 0.16, 0x9a97a4);
      gs.position.set(side * 1.7, 0.45, 2.6);
      gs.rotation.z = side * 0.22;
      g.add(gs);
    }
  } else if (acc === 'icicles') {
    // icicles fanging down over the mouth
    for (let i = 0; i < 5; i++) {
      const ice = cone(0.09, 0.5 + Math.random() * 0.4, 0xdfefFa, 5);
      ice.rotation.x = Math.PI;
      ice.position.set(-0.8 + i * 0.4, 1.7, 2.4);
      g.add(ice);
    }
  }
  return g;
}

// A hand-held burning torch: wooden handle, tarred head, animated flame and
// an additive glow sprite so the blaze reads even in full daylight.
// userData exposes { flame, flameCore, glow } for per-frame flicker.
let _torchGlowTex = null;
export function makeTorchMesh() {
  const g = new THREE.Group();
  const handle = cyl(0.045, 0.055, 0.55, 0x6b4a26, 6); handle.position.y = 0.12;
  const wrap = cyl(0.078, 0.078, 0.15, 0x3a2a16, 6); wrap.position.y = 0.36;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6),
    new THREE.MeshBasicMaterial({ color: 0xff9a2e }));
  flame.position.y = 0.58;
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe28a }));
  flameCore.position.y = 0.54;
  if (!_torchGlowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const cx = c.getContext('2d');
    const grd = cx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255, 200, 110, 0.95)');
    grd.addColorStop(0.45, 'rgba(255, 150, 50, 0.35)');
    grd.addColorStop(1, 'rgba(255, 120, 30, 0)');
    cx.fillStyle = grd; cx.fillRect(0, 0, 64, 64);
    _torchGlowTex = new THREE.CanvasTexture(c);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: _torchGlowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  glow.scale.setScalar(1.4);
  glow.position.y = 0.6;
  g.add(handle, wrap, flame, flameCore, glow);
  g.userData = { flame, flameCore, glow };
  return g;
}

// A thrown spear/javelin — a long wooden shaft with an iron head, pointing +Z
// (the caller yaws it to face its flight direction).
export function makeSpear() {
  const g = new THREE.Group();
  const shaft = cyl(0.035, 0.035, 1.15, 0x7a5a34, 6);
  shaft.rotation.x = Math.PI / 2; // lay it along Z
  const head = cone(0.09, 0.32, 0x9aa0a8, 6);
  head.rotation.x = Math.PI / 2;  // point +Z
  head.position.z = 0.72;
  const bind = cyl(0.05, 0.05, 0.09, 0x4a3620, 6);
  bind.rotation.x = Math.PI / 2;
  bind.position.z = 0.52;
  g.add(shaft, head, bind);
  return g;
}

// Rolled scroll dropped by a raided bandit dwelling.
export function makeScrollDrop() {
  const g = new THREE.Group();
  const paper = cyl(0.14, 0.14, 0.42, 0xe8dcb0, 9);
  paper.rotation.z = Math.PI / 2;
  const capA = cyl(0.155, 0.155, 0.06, 0xb89a5a, 9);
  capA.rotation.z = Math.PI / 2; capA.position.x = 0.2;
  const capB = capA.clone(); capB.position.x = -0.2;
  const ribbon = box(0.05, 0.3, 0.3, 0xc0442f);
  g.add(paper, capA, capB, ribbon);
  g.scale.setScalar(0.9);
  return g;
}

// ---------- aim indicator: a short arc of the weapon-range circle, shown in
// the direction the player is currently facing (scaled by range each frame) ----
export function makeAimArc() {
  // An empty ribbon whose vertices are rewritten each frame to hug the terrain
  // surface (see updateAimArc in main.js). depthTest off + high renderOrder so
  // the marker is never swallowed by a rising hill between player and cursor.
  const geo = new THREE.BufferGeometry();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe9a8, transparent: true, opacity: 0.6,
    side: THREE.DoubleSide, depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10;
  // The vertices are rewritten every frame but the geometry's boundingSphere is
  // only computed once (near spawn), so leaving frustum culling on makes the arc
  // vanish as soon as the hero walks away from that spot. Never cull it.
  mesh.frustumCulled = false;
  return mesh;
}

// Rewrite the aim arc as a thin ground-hugging band: a slice of the weapon's
// range circle, centered on the facing direction. `heightFn(x,z)` lifts each
// vertex onto the terrain so raised ground never hides it.
const AIM_SEG = 24;
export function updateAimArc(mesh, cx, cz, faceAngle, radius, halfAngle, thickness, heightFn) {
  const rIn = Math.max(0.05, radius - thickness);
  const verts = new Float32Array((AIM_SEG + 1) * 2 * 3);
  for (let i = 0; i <= AIM_SEG; i++) {
    const a = faceAngle - halfAngle + (i / AIM_SEG) * halfAngle * 2;
    const dx = Math.sin(a), dz = Math.cos(a);
    const ox = cx + dx * radius, oz = cz + dz * radius;
    const ix = cx + dx * rIn, iz = cz + dz * rIn;
    const o = i * 6;
    verts[o]     = ix; verts[o + 1] = heightFn(ix, iz) + 0.12; verts[o + 2] = iz;
    verts[o + 3] = ox; verts[o + 4] = heightFn(ox, oz) + 0.12; verts[o + 5] = oz;
  }
  const idx = [];
  for (let i = 0; i < AIM_SEG; i++) {
    const b = i * 2;
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const g = mesh.geometry;
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.setIndex(idx);
}

// ---------- cave & camp props ----------
export function makeStalagmite(rng) {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const h = 0.8 + rng() * 1.4;
    const c = cone(0.2 + rng() * 0.2, h, 0x4c4840, 6);
    c.position.set((rng() - 0.5) * 0.6, h / 2, (rng() - 0.5) * 0.6);
    g.add(c);
  }
  return g;
}

export function makeCampfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const log = cyl(0.08, 0.08, 0.7, 0x5c4326, 5);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 4) * Math.PI;
    log.position.y = 0.1;
    g.add(log);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 6),
    new THREE.MeshLambertMaterial({ color: 0xff8c2a, emissive: 0xff5a00, emissiveIntensity: 0.9 }));
  flame.position.y = 0.42;
  g.add(flame);
  g.userData = { flame };
  return g;
}

export function makeTent() {
  const g = new THREE.Group();
  const canvas = cone(1.9, 2.0, 0x8a6b4e, 6); // hide-colored teepee
  canvas.position.y = 1.0;
  const door = box(0.6, 0.9, 0.1, 0x3a2c1e);
  door.position.set(0, 0.45, -1.35);
  for (let i = 0; i < 3; i++) {
    const pole = cyl(0.04, 0.04, 2.6, 0x5c4326, 4);
    pole.rotation.z = (i - 1) * 0.35;
    pole.position.y = 1.3;
    g.add(pole);
  }
  g.add(canvas, door);
  return g;
}

export function makeFurnace() {
  const g = new THREE.Group();
  const body = box(1.4, 1.5, 1.4, 0x6e6a60);
  body.position.y = 0.75;
  const chimney = box(0.4, 1.0, 0.4, 0x5c584e);
  chimney.position.set(0.3, 1.9, 0.3);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xff7722, emissive: 0xff4400, emissiveIntensity: 0.8 }));
  mouth.position.set(0, 0.5, -0.71);
  g.add(body, chimney, mouth);
  return g;
}

export function makeChest() {
  const g = new THREE.Group();
  const body = box(1.1, 0.6, 0.7, 0x8a6238);
  body.position.y = 0.3;
  const lid = box(1.14, 0.22, 0.74, 0x6e4d2a);
  lid.position.y = 0.7;
  const clasp = box(0.14, 0.2, 0.06, 0xd4af37);
  clasp.position.set(0, 0.56, -0.37);
  g.add(body, lid, clasp);
  return g;
}

export function makeBoatRack() {
  const g = new THREE.Group();
  const hull = box(0.7, 0.25, 2.0, 0x8a6238);
  hull.position.y = 0.5;
  hull.rotation.z = 0.5;
  for (const z of [-0.7, 0.7]) {
    const leg = box(0.1, 0.6, 0.1, 0x5c4326);
    leg.position.set(0, 0.3, z);
    g.add(leg);
  }
  g.add(hull);
  return g;
}

export function makeGraveyard() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const slab = box(0.5, 0.8 + (i % 2) * 0.25, 0.14, 0x8a8578);
    slab.position.set(-1.2 + i * 0.85, 0.42, (i % 2) * 0.8 - 0.4);
    slab.rotation.z = (i - 1.5) * 0.06;
    const top = cyl(0.25, 0.25, 0.14, 0x8a8578, 8);
    top.rotation.x = Math.PI / 2;
    top.position.set(slab.position.x, 0.84 + (i % 2) * 0.25, slab.position.z);
    g.add(slab, top);
  }
  const soil = box(3.6, 0.1, 2.2, 0x4a3a2e);
  soil.position.y = 0.05;
  g.add(soil);
  return g;
}

export function makeRaft() {
  const g = new THREE.Group();
  for (let i = -2; i <= 2; i++) {
    const log = cyl(0.14, 0.14, 1.7, 0x8a6238, 6);
    log.rotation.x = Math.PI / 2;
    log.position.set(i * 0.29, 0, 0);
    g.add(log);
  }
  return g;
}

// ---------- survival spawn cottage ----------
export function makeCottage() {
  const g = new THREE.Group();
  const walls = box(3.4, 2.1, 2.8, 0x6e4d2a);
  walls.position.y = 1.05;
  const roof = cone(3.0, 1.9, 0x4c3520, 4);
  roof.position.y = 3.05;
  roof.rotation.y = Math.PI / 4;
  const door = box(0.9, 1.4, 0.15, 0x2c1f12);
  door.position.set(0.6, 0.7, 1.42);
  const window1 = box(0.7, 0.6, 0.12, 0xf3d98a);
  window1.position.set(-0.9, 1.3, 1.42);
  const chimney = box(0.5, 1.2, 0.5, 0x8a8578);
  chimney.position.set(-1.1, 3.2, -0.6);
  // little log pile by the wall
  for (let i = 0; i < 3; i++) {
    const log = cyl(0.16, 0.16, 1.1, 0x8a6238, 6);
    log.rotation.z = Math.PI / 2;
    log.position.set(2.2, 0.16 + (i === 2 ? 0.28 : 0), -0.5 + (i % 2) * 0.36);
    g.add(log);
  }
  g.add(walls, roof, door, window1, chimney);
  return g;
}

// Age 4 home: a proper stone house — thick masonry, slate roof, iron-braced
// door. Visibly a different building from the timber cabin.
export function makeStoneHouse() {
  const g = new THREE.Group();
  const walls = box(3.8, 2.4, 3.1, 0x8f8a7c);
  walls.position.y = 1.2;
  // corner quoins (darker stone blocks)
  for (const [x, z] of [[-1.9, 1.55], [1.9, 1.55], [-1.9, -1.55], [1.9, -1.55]]) {
    const q = box(0.35, 2.4, 0.35, 0x6e6a60);
    q.position.set(x, 1.2, z);
    g.add(q);
  }
  const roof = cone(3.3, 1.7, 0x4c5157, 4); // slate
  roof.position.y = 3.45;
  roof.rotation.y = Math.PI / 4;
  const door = box(1, 1.5, 0.15, 0x2c1f12);
  door.position.set(0.6, 0.75, 1.58);
  const brace = box(1.06, 0.12, 0.17, 0x5c6670);
  brace.position.set(0.6, 1.1, 1.58);
  const window1 = box(0.7, 0.65, 0.12, 0xf3d98a);
  window1.position.set(-1, 1.5, 1.58);
  const window2 = window1.clone();
  window2.position.set(1.2, 1.5, -1.58);
  const chimney = box(0.55, 1.6, 0.55, 0x6e6a60);
  chimney.position.set(-1.2, 3.4, -0.7);
  g.add(walls, roof, door, brace, window1, window2, chimney);
  return g;
}

// Age 5 home: a MEDIEVAL KEEP — squat stone tower with battlements, arrow
// slits and a banner. The endgame base at a glance.
export function makeKeep() {
  const g = new THREE.Group();
  const tower = box(3.4, 4.2, 3.4, 0x6e7280);
  tower.position.y = 2.1;
  g.add(tower);
  // battlements (merlons around the top)
  for (let i = 0; i < 4; i++) {
    for (let j = -1; j <= 1; j++) {
      const m1 = box(0.6, 0.55, 0.4, 0x5c6670);
      const off = j * 1.25;
      if (i === 0) m1.position.set(off, 4.55, 1.6);
      else if (i === 1) m1.position.set(off, 4.55, -1.6);
      else if (i === 2) m1.position.set(1.6, 4.55, off);
      else m1.position.set(-1.6, 4.55, off);
      g.add(m1);
    }
  }
  const door = box(1.1, 1.7, 0.15, 0x2c1f12);
  door.position.set(0, 0.85, 1.72);
  const arch = box(1.4, 0.25, 0.16, 0x565e6a);
  arch.position.set(0, 1.8, 1.72);
  g.add(door, arch);
  // arrow slits
  for (const [x, y] of [[-0.9, 2.6], [0.9, 2.6], [0, 3.4]]) {
    const slit = box(0.14, 0.6, 0.12, 0x1c1a18);
    slit.position.set(x, y, 1.72);
    g.add(slit);
  }
  // banner on a pole
  const pole = cyl(0.05, 0.05, 1.6, 0x4c3520, 5);
  pole.position.set(1.2, 5.3, 1.2);
  const flag = box(0.75, 0.5, 0.05, 0xb53a3a);
  flag.position.set(1.62, 5.7, 1.2);
  g.add(pole, flag);
  return g;
}

// ---------- MOBA buildings ----------
export const TEAM_COLORS = { player: 0x3a6fb5, enemy: 0xb53a3a };

export function makeTeamFlag(teamColor) {
  const g = new THREE.Group();
  const pole = box(0.05, 0.7, 0.05, 0x5c4326);
  pole.position.y = 0.35;
  const flag = box(0.34, 0.2, 0.03, teamColor);
  flag.position.set(0.17, 0.58, 0);
  g.add(pole, flag);
  return g;
}

export function makeMobaTower(teamColor) {
  const g = new THREE.Group();
  const base = cyl(1.1, 1.4, 1.2, 0x8a8578, 8);
  base.position.y = 0.6;
  const shaft = cyl(0.55, 0.75, 2.6, 0x9a958a, 8);
  shaft.position.y = 2.4;
  const top = cyl(0.95, 0.8, 0.7, 0x6e6a60, 8);
  top.position.y = 3.9;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8),
    new THREE.MeshLambertMaterial({ color: teamColor, emissive: teamColor, emissiveIntensity: 0.6 }));
  orb.position.y = 4.7;
  const flag = makeTeamFlag(teamColor);
  flag.position.set(0.9, 0.9, 0);
  g.add(base, shaft, top, orb, flag);
  g.userData = { orb };
  return g;
}

export function makeMobaBase(teamColor) {
  const g = new THREE.Group();
  const platform = cyl(7.5, 8.5, 0.8, 0x8a8578, 10);
  platform.position.y = 0.4;
  platform.receiveShadow = true;
  const hall = box(6, 3.4, 5, 0x6e4d2a);
  hall.position.y = 2.5;
  const roof = cone(4.8, 2.6, 0x4c3520, 4);
  roof.position.y = 5.5;
  roof.rotation.y = Math.PI / 4;
  const door = box(1.4, 1.9, 0.2, 0x2c1f12);
  door.position.set(0, 1.7, -2.5);
  const banner = box(1.2, 2.4, 0.1, teamColor);
  banner.position.set(0, 3.4, -2.56);
  g.add(platform, hall, roof, door, banner);
  for (const [sx, sz] of [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]) {
    const post = cyl(0.22, 0.28, 3.4, 0x5c4326, 6);
    post.position.set(sx, 1.7, sz);
    const f = makeTeamFlag(teamColor);
    f.scale.setScalar(1.6);
    f.position.set(sx, 3.2, sz);
    g.add(post, f);
  }
  return g;
}

export function makeDenHut(teamColor) {
  const g = new THREE.Group();
  const walls = box(2.2, 1.5, 2.2, 0x6e4d2a);
  walls.position.y = 0.75;
  const roof = cone(1.9, 1.3, 0x3d5c2f, 4);
  roof.position.y = 2.1;
  roof.rotation.y = Math.PI / 4;
  const door = box(0.7, 1.0, 0.15, 0x2c1f12);
  door.position.set(0, 0.6, -1.12);
  const flag = makeTeamFlag(teamColor);
  flag.position.set(0.9, 1.4, 0.9);
  g.add(walls, roof, door, flag);
  return g;
}

export function makeSmallHut(color) {
  const g = new THREE.Group();
  const walls = box(1.6, 1.1, 1.6, color);
  walls.position.y = 0.55;
  const roof = cone(1.4, 1.0, 0x4c3520, 4);
  roof.position.y = 1.55;
  roof.rotation.y = Math.PI / 4;
  g.add(walls, roof);
  return g;
}

// ---------- rivers & bridges ----------
export function makeBridge(width, length) {
  const g = new THREE.Group();
  const deck = box(width, 0.14, length, 0x8a6238);
  deck.position.y = 0.45;
  deck.receiveShadow = true;
  g.add(deck);
  // plank lines
  for (let z = -length / 2 + 0.5; z < length / 2; z += 0.7) {
    const plank = box(width + 0.06, 0.04, 0.08, 0x6e4d2a);
    plank.position.set(0, 0.53, z);
    g.add(plank);
  }
  // side rails
  for (const side of [-1, 1]) {
    const rail = box(0.09, 0.09, length, 0x5c4326);
    rail.position.set(side * (width / 2 - 0.05), 0.95, 0);
    g.add(rail);
    for (let z = -length / 2 + 0.4; z < length / 2; z += 1.4) {
      const post = box(0.09, 0.55, 0.09, 0x5c4326);
      post.position.set(side * (width / 2 - 0.05), 0.66, z);
      g.add(post);
    }
  }
  return g;
}

// ---------- ground pickups ----------
export function makeMeatDrop() {
  const g = new THREE.Group();
  const chunk = box(0.3, 0.22, 0.22, 0xb5482f);
  const bone = cyl(0.045, 0.045, 0.4, 0xf0e6d0, 5);
  bone.rotation.z = Math.PI / 2;
  bone.position.y = -0.06;
  g.add(chunk, bone);
  return g;
}

export function makeWoodDrop() {
  const g = new THREE.Group();
  const log = cyl(0.09, 0.09, 0.5, 0x8a6238, 6);
  log.rotation.z = Math.PI / 2;
  const log2 = cyl(0.08, 0.08, 0.42, 0x75522e, 6);
  log2.rotation.z = Math.PI / 2;
  log2.rotation.y = 0.5;
  log2.position.y = 0.13;
  g.add(log, log2);
  return g;
}

export function makeStoneDrop() {
  const g = new THREE.Group();
  const rockA = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat(0x8a8a84));
  rockA.castShadow = true;
  const rockB = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), mat(0x9a9a94));
  rockB.position.set(0.2, -0.05, 0.1);
  g.add(rockA, rockB);
  return g;
}

export function makeHideDrop() {
  const g = new THREE.Group();
  const pelt = box(0.5, 0.06, 0.42, 0x8a6b4e);
  pelt.rotation.y = 0.4;
  const patch = box(0.24, 0.07, 0.2, 0x6e5238);
  patch.position.set(0.08, 0.02, 0.05);
  g.add(pelt, patch);
  return g;
}

export function makeIronDrop() {
  const bar = box(0.4, 0.14, 0.18, 0xb8bec6);
  bar.rotation.y = 0.5;
  const g = new THREE.Group();
  const bar2 = box(0.4, 0.14, 0.18, 0xa8aeb6);
  bar2.position.set(0.05, 0.14, 0.02);
  bar2.rotation.y = 0.3;
  g.add(bar, bar2);
  return g;
}

export function makeItemDrop() {
  const g = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.42),
    new THREE.MeshLambertMaterial({ color: 0xd4af37, emissive: 0x8a6a10, emissiveIntensity: 0.55 }));
  chest.castShadow = true;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.46),
    new THREE.MeshLambertMaterial({ color: 0x7a5a1a, emissive: 0x3a2a08, emissiveIntensity: 0.4 }));
  g.add(chest, band);
  return g;
}

// ---------- Trees & scenery ----------

function pickTreeType(weights, rng) {
  let r = rng() * (weights.pine + weights.leafy + weights.birch + weights.dead);
  for (const key of ['pine', 'leafy', 'birch', 'dead']) {
    r -= weights[key];
    if (r <= 0) return key;
  }
  return 'pine';
}

// size: 0 small, 1 medium, 2 big. Returns { mesh, radius } — radius for collision.
export function makeTree(size, biome, rng) {
  const g = new THREE.Group();
  g.scale.y = 2; // trees tower — double height, same footprint
  const scale = [0.65, 1.0, 1.5][size] * (0.8 + rng() * 0.45);
  const foliageColor = biome.foliage[Math.floor(rng() * biome.foliage.length)];
  const type = pickTreeType(biome.trees, rng);

  if (type === 'dead') {
    const trunkH = 2.1 * scale;
    const trunk = cyl(0.09 * scale, 0.17 * scale, trunkH, 0x3f3226, 5);
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = (rng() - 0.5) * 0.15;
    g.add(trunk);
    const branches = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < branches; i++) {
      const b = box(0.07 * scale, 0.7 * scale, 0.07 * scale, 0x3f3226);
      b.position.set((rng() - 0.5) * 0.3, trunkH * (0.55 + rng() * 0.35), (rng() - 0.5) * 0.3);
      b.rotation.z = (rng() < 0.5 ? 1 : -1) * (0.6 + rng() * 0.6);
      b.rotation.y = rng() * Math.PI;
      g.add(b);
    }
    return { mesh: g, radius: 0.28 * scale + 0.12 };
  }

  if (type === 'birch') {
    const trunkH = 2.2 * scale;
    const trunk = cyl(0.09 * scale, 0.13 * scale, trunkH, 0xdcd8cc, 6);
    trunk.position.y = trunkH / 2;
    g.add(trunk);
    // dark flecks on the white bark
    for (let i = 0; i < 3; i++) {
      const f = box(0.11 * scale, 0.06 * scale, 0.11 * scale, 0x3a3a34);
      f.position.set(0, trunkH * (0.25 + rng() * 0.55), 0);
      f.rotation.y = rng() * Math.PI;
      g.add(f);
    }
    const blobs = 1 + size;
    for (let i = 0; i < blobs; i++) {
      const s = sphere((0.62 - i * 0.1) * scale, 0x8fb75e, 7);
      s.position.set((rng() - 0.5) * 0.5 * scale, trunkH + i * 0.45 * scale, (rng() - 0.5) * 0.5 * scale);
      s.scale.y = 0.8;
      g.add(s);
    }
    return { mesh: g, radius: 0.28 * scale + 0.13 };
  }

  const trunkH = 1.6 * scale;
  const trunk = cyl(0.13 * scale, 0.2 * scale, trunkH, biome.trunk, 6);
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  if (type === 'pine') {
    const layers = 2 + size;
    for (let i = 0; i < layers; i++) {
      const r = (1.1 - i * 0.22) * scale;
      const c = cone(r, 1.1 * scale, foliageColor, 7);
      c.position.y = trunkH + i * 0.72 * scale;
      g.add(c);
    }
    if (biome.snowy) {
      const cap = cone((1.1 - (layers - 1) * 0.22) * scale * 0.9, 0.5 * scale, 0xf0f5f9, 7);
      cap.position.y = trunkH + (layers - 1) * 0.72 * scale + 0.45 * scale;
      g.add(cap);
    }
  } else {
    // leafy: blobs
    const blobs = 1 + size;
    for (let i = 0; i < blobs; i++) {
      const s = sphere((0.8 - i * 0.12) * scale, foliageColor, 7);
      s.position.set((rng() - 0.5) * 0.5 * scale, trunkH + 0.5 * scale + i * 0.55 * scale, (rng() - 0.5) * 0.5 * scale);
      s.scale.y = 0.85;
      g.add(s);
    }
  }
  return { mesh: g, radius: 0.35 * scale + 0.15 };
}

// ---------- small ground decorations (no collision) ----------
export function makeGrassTuft(color, rng) {
  const g = new THREE.Group();
  const blades = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < blades; i++) {
    const h = 0.42 + rng() * 0.3;
    const b = cone(0.055, h, color, 4);
    b.castShadow = false;
    b.position.set((rng() - 0.5) * 0.4, h / 2, (rng() - 0.5) * 0.4);
    b.rotation.set((rng() - 0.5) * 0.5, 0, (rng() - 0.5) * 0.5);
    g.add(b);
  }
  return g;
}

export function makeFlower(rng) {
  const g = new THREE.Group();
  const stem = box(0.03, 0.26, 0.03, 0x4c7a3a);
  stem.castShadow = false;
  stem.position.y = 0.13;
  const colors = [0xffffff, 0xf3d34a, 0xe07a9a, 0xd95f4c];
  const head = box(0.11, 0.09, 0.11, colors[Math.floor(rng() * colors.length)]);
  head.castShadow = false;
  head.position.y = 0.3;
  g.add(stem, head);
  return g;
}

export function makeMushroom(rng) {
  const g = new THREE.Group();
  const stem = cyl(0.045, 0.06, 0.16, 0xe6ddc8, 5);
  stem.castShadow = false;
  stem.position.y = 0.08;
  const cap = cone(0.13, 0.12, rng() < 0.5 ? 0xc0392b : 0xb08a5a, 6);
  cap.castShadow = false;
  cap.position.y = 0.2;
  g.add(stem, cap);
  return g;
}

export function makeBush(color, rng) {
  const g = new THREE.Group();
  for (let i = 0; i < 2 + Math.floor(rng() * 2); i++) {
    const s = sphere(0.2 + rng() * 0.14, color, 6);
    s.position.set((rng() - 0.5) * 0.4, 0.18, (rng() - 0.5) * 0.4);
    s.scale.y = 0.75;
    g.add(s);
  }
  return g;
}

export function makeLog(color, rng) {
  const m = cyl(0.13, 0.13, 0.8 + rng() * 0.5, color, 6);
  m.rotation.z = Math.PI / 2;
  m.rotation.y = rng() * Math.PI;
  m.position.y = 0.13;
  return m;
}

export function makeRock(rng) {
  const s = 0.25 + rng() * 0.6;
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat(0x8a8a84));
  m.castShadow = true;
  m.position.y = s * 0.4;
  m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  return m;
}

// ---------- Companions & projectiles ----------
export function makeGuardianSphere() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshLambertMaterial({ color: 0x2b3a4a, emissive: 0x38c0ff, emissiveIntensity: 0.8 }));
  core.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 18),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x225577, emissiveIntensity: 0.6 }));
  ring.rotation.x = Math.PI / 2;
  g.add(core, ring);
  g.userData = { ring };
  return g;
}

export function makeArrow() {
  const g = new THREE.Group();
  const shaft = box(0.05, 0.05, 0.55, 0x8a6a3a);
  const tip = cone(0.06, 0.14, 0x777777, 5);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = -0.33;
  g.add(shaft, tip);
  return g;
}

export function makeBolt() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x7fe0ff }));
  return m;
}
