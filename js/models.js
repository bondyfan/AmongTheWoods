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

  g.add(leftLeg, rightLeg, torso, head, hair, leftArm, rightArm);
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

export function makeEnemyMesh(type) {
  switch (type) {
    case 'rabbit': return makeRabbit();
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
