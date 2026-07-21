// Headless authoritative World — mirrors the client's boot order EXACTLY
// (main.js: loadWorldPatch → applyTweaks → new World(scene, seed)) so the
// server's terrain / biomes / lakes / harbors / borders are byte-identical to
// every client. The real World class runs pure-CPU with a 2-method scene stub;
// its chunk meshes are lazy (built on render) and never touched here.
//
// NOTE: this module must be imported AFTER the 'three' resolve hook is
// registered (see three-hook.mjs), because World → models.js → import 'three'.
import { readFileSync } from 'node:fs';
import { worldPatch, applyTweaks } from '../../js/worldpatch.js';
import { World } from '../../js/world.js';

// = js/net.js COOP_WORLD_SEED. Hardcoded (not imported) because net.js pulls the
// Firebase SDK over an https:// import, which Node won't resolve and the server
// doesn't need.
export const COOP_WORLD_SEED = 1;

export function bootWorld(seed = COOP_WORLD_SEED) {
  // the same shipped patch the client fetches from assets/world-patch.json
  const patchUrl = new URL('../../assets/world-patch.json', import.meta.url);
  worldPatch.load(JSON.parse(readFileSync(patchUrl, 'utf8')));
  applyTweaks();                       // stat/tuning overrides the sim reads
  const scene = { add() {}, remove() {} };
  const world = new World(scene, seed);
  world.time ??= 0;                    // day/night clock the snapshot reads
  return { world, scene };
}
