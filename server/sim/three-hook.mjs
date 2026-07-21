// ESM resolve hook: map the bare specifier 'three' → the vendored
// libs/three.module.js, so the game modules (js/*.js, which live OUTSIDE
// server/ and import bare 'three') resolve it under Node — no client edits, no
// runtime flags. Registered via node:module register() before any game import.
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

const THREE_URL = pathToFileURL(
  resolvePath(import.meta.dirname, '../../libs/three.module.js')).href;

export async function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: THREE_URL, shortCircuit: true };
  return next(specifier, context);
}
