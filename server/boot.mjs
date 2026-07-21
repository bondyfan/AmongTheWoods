// Server entry point. Registers the 'three' ESM resolve hook FIRST (so the game
// modules the M2 simulation imports can resolve bare 'three' → libs/three.module.js),
// THEN loads the actual server. Always start the server via THIS file
// (`node boot.mjs`), never index.js directly — otherwise the hook isn't active
// when the sim's imports resolve.
import { register } from 'node:module';

register('./sim/three-hook.mjs', import.meta.url);

await import('./index.js');
