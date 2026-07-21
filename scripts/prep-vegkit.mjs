#!/usr/bin/env node
// One-shot: copy a CURATED subset of the Quaternius "Stylized Nature MegaKit"
// (CC0) into assets/vegetation/, strip normal/occlusion maps (we render with a
// cheap Lambert — base colour only), and downscale oversized textures. Run once
// with `node scripts/prep-vegkit.mjs`; the output is committed to the repo.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, basename } from 'node:path';

const SRC = process.argv[2]
  || '/Users/frantisekdivoky/Downloads/Stylized Nature MegaKit[Standard]/glTF';
const DEST = resolve(process.cwd(), 'assets/vegetation');
mkdirSync(DEST, { recursive: true });

// curated model list — the greenery that suits the Verdant Forest
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

const MAX_DIM = 512; // downscale any texture whose larger side exceeds this
const keptTextures = new Set();

function pngDims(file) {
  const d = readFileSync(file);
  return [d.readUInt32BE(16), d.readUInt32BE(20)];
}

for (const name of MODELS) {
  const gltfPath = resolve(SRC, name + '.gltf');
  if (!existsSync(gltfPath)) { console.warn('MISSING', name); continue; }
  const gltf = JSON.parse(readFileSync(gltfPath, 'utf8'));

  // which images does a KEPT (base-colour) texture point at?
  const baseImages = new Set();
  for (const m of gltf.materials || []) {
    const bc = m.pbrMetallicRoughness?.baseColorTexture;
    if (bc != null) {
      const src = gltf.textures[bc.index].source;
      baseImages.add(gltf.images[src].uri);
    }
    // we shade with base colour only → drop the maps we won't use
    delete m.normalTexture;
    delete m.occlusionTexture;
    delete m.emissiveTexture;
  }

  // copy the base-colour images (dedup across models), downscaled
  for (const uri of baseImages) {
    keptTextures.add(uri);
    const out = resolve(DEST, uri);
    if (!existsSync(out)) {
      copyFileSync(resolve(SRC, uri), out);
      const [w, h] = pngDims(out);
      if (Math.max(w, h) > MAX_DIM) {
        execFileSync('sips', ['-Z', String(MAX_DIM), out], { stdio: 'ignore' });
      }
    }
  }

  // rewrite the gltf (maps stripped) + copy its buffer verbatim
  writeFileSync(resolve(DEST, name + '.gltf'), JSON.stringify(gltf));
  const bin = gltf.buffers?.[0]?.uri;
  if (bin) copyFileSync(resolve(SRC, bin), resolve(DEST, bin));
}

console.log('Wrote', MODELS.length, 'models +', keptTextures.size, 'textures to', DEST);
console.log('Textures:', [...keptTextures].join(', '));
