// ==========================================================================
// prep-human — make the rigged hero fit a stylized, one-directional-light,
// zero-PBR world (and fit down a phone's pipe).
//
// The Quaternius base character ships as a photoreal-ish PBR asset: 2048²
// normal + roughness maps and doubleSided materials. Three problems with that
// in THIS game:
//
//   * Under exactly one DirectionalLight and one HemisphereLight, with no
//     environment map anywhere, a normal map doesn't read as form — it reads as
//     high-frequency noise standing next to boxes that have literally zero
//     surface detail. Flat albedo is what makes it hand-painted rather than
//     shiny-realistic.
//   * doubleSided means shadowSide = DoubleSide in three r160, so the hero
//     self-shadows: shadow acne striped across the body. Nothing else in the
//     game hits it because every box is FrontSide.
//   * 14 MB of PNG for one character, against 0.7 MB of geometry and a 1.27 MB
//     engine. On the GPU that's ~112 MB of VRAM per GL context, and main.js
//     builds more than one context.
//
// So: drop the normal/roughness/occlusion/emissive slots, force single-sided,
// downsize what's left and re-encode to WebP — which the vendored GLTFLoader
// decodes natively via EXT_texture_webp (libs/GLTFLoader.js:507), so no KTX2
// transcoder has to be vendored.
//
// Uses only macOS `sips` and homebrew `cwebp`; no npm dependencies.
//
// Rewrites the asset in place and is one-shot — it refuses to run twice. To
// redo it: git checkout assets/models/human/ && node scripts/prep-human.mjs
//
//   node scripts/prep-human.mjs
//   node scripts/prep-human.mjs --dry-run
// ==========================================================================
import { readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const GLTF = 'assets/models/human/human.gltf';
const DRY = process.argv.includes('--dry-run');

// target edge length per texture role — the body carries the read, hair is
// mostly silhouette, eyes are two dots
// order matters — first match wins, so the specific names come before the
// generic "BaseColor" catch (the hair map is also a BaseColor)
const SIZES = [
  [/Hair/i, 512],
  [/Eye/i, 256],
  [/Superhero_Male_Dark|BaseColor/i, 1024],
];
const KB = (b) => (b / 1024).toFixed(0) + ' KB';

const dir = dirname(GLTF);
const doc = JSON.parse(readFileSync(GLTF, 'utf8'));
if ((doc.extensionsRequired ?? []).includes('EXT_texture_webp')) {
  console.log('already prepped (EXT_texture_webp present) — `git checkout assets/models/human/` to redo');
  process.exit(0);
}
const before = (doc.images ?? []).reduce((n, im) =>
  n + (existsSync(join(dir, im.uri)) ? statSync(join(dir, im.uri)).size : 0), 0);

// ---- 1. strip every PBR slot but base colour, and go single-sided ----------
const keepTex = new Set();
for (const m of doc.materials ?? []) {
  for (const slot of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete m[slot];
  delete m.emissiveFactor;
  const pbr = m.pbrMetallicRoughness ?? (m.pbrMetallicRoughness = {});
  delete pbr.metallicRoughnessTexture;
  pbr.metallicFactor = 0;      // nothing in this world is metal
  pbr.roughnessFactor = 1;     // …or glossy
  m.doubleSided = false;       // kills the self-shadowing
  if (pbr.baseColorTexture) keepTex.add(pbr.baseColorTexture.index);
}

// ---- 2. resize + re-encode the surviving images ---------------------------
const keepImg = new Set([...keepTex].map(ti => doc.textures[ti].source));
const plan = [];
for (const [i, im] of (doc.images ?? []).entries()) {
  if (!keepImg.has(i)) { plan.push({ i, uri: im.uri, drop: true }); continue; }
  const edge = SIZES.find(([re]) => re.test(im.uri))?.[1] ?? 512;
  plan.push({ i, uri: im.uri, edge, out: im.uri.replace(/\.png$/i, '.webp') });
}

for (const p of plan) {
  const src = join(dir, p.uri);
  if (p.drop) {
    console.log(`  drop   ${p.uri}  (${existsSync(src) ? KB(statSync(src).size) : '—'})`);
    if (!DRY && existsSync(src)) unlinkSync(src);
    continue;
  }
  const tmp = join(dir, '_tmp_' + p.uri);
  const out = join(dir, p.out);
  console.log(`  ${p.edge}px  ${p.uri} -> ${p.out}`);
  if (DRY) continue;
  copyFileSync(src, tmp);
  execFileSync('sips', ['-Z', String(p.edge), tmp], { stdio: 'pipe' });
  execFileSync('cwebp', ['-q', '80', '-quiet', tmp, '-o', out], { stdio: 'pipe' });
  unlinkSync(tmp);
  unlinkSync(src);
}

// ---- 3. rewrite the glTF: new URIs, webp mime, prune orphans -------------
// EXT_texture_webp puts the image behind an extension block on the TEXTURE, and
// the spec requires the fallback `source` to be dropped when it isn't a
// supported core format — otherwise a loader without the extension picks up a
// .webp as if it were PNG.
if (!DRY) {
  for (const p of plan) {
    if (p.drop) continue;
    doc.images[p.i].uri = p.out;
    doc.images[p.i].mimeType = 'image/webp';
  }
  for (const ti of keepTex) {
    const t = doc.textures[ti];
    t.extensions = { ...(t.extensions ?? {}), EXT_texture_webp: { source: t.source } };
    delete t.source;
  }
  doc.extensionsUsed = [...new Set([...(doc.extensionsUsed ?? []), 'EXT_texture_webp'])];
  doc.extensionsRequired = [...new Set([...(doc.extensionsRequired ?? []), 'EXT_texture_webp'])];

  // Prune the now-orphaned textures and images and REINDEX. Leaving them in
  // place would leave entries pointing at PNGs this script just deleted — a
  // loader that walks images eagerly, or any inspector, hits a 404.
  const texKeep = [...keepTex].sort((a, b) => a - b);
  const texMap = new Map(texKeep.map((old, i) => [old, i]));
  const imgKeep = texKeep.map(ti => doc.textures[ti].extensions.EXT_texture_webp.source);
  const imgMap = new Map(imgKeep.map((old, i) => [old, i]));
  doc.textures = texKeep.map(ti => {
    const t = doc.textures[ti];
    t.extensions.EXT_texture_webp.source = imgMap.get(t.extensions.EXT_texture_webp.source);
    return t;
  });
  doc.images = imgKeep.map(ii => doc.images[ii]);
  for (const m of doc.materials ?? []) {
    const bct = m.pbrMetallicRoughness?.baseColorTexture;
    if (bct) bct.index = texMap.get(bct.index);
  }
  writeFileSync(GLTF, JSON.stringify(doc, null, 2));
}

const after = (doc.images ?? []).reduce((n, im) => {
  const f = join(dir, im.uri);
  return n + (existsSync(f) ? statSync(f).size : 0);
}, 0);
console.log(`\ntextures: ${KB(before)} -> ${KB(after)}` +
  (before ? `  (${(100 - after / before * 100).toFixed(0)}% off)` : ''));
if (DRY) console.log('(dry run — nothing written)');
