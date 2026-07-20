import { resolve } from 'node:path';
import { cpSync, existsSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// World-Editor save endpoint (dev server only): the in-game editor POSTs the
// patch JSON here and it lands in the repo at assets/world-patch.json —
// commit + push + deploy and every player gets the hand-edited world.
function worldPatchEndpoint() {
  return {
    name: 'world-patch-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__worldpatch', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            JSON.parse(body); // refuse to write garbage into the repo
            writeFileSync(resolve(__dirname, 'assets/world-patch.json'), body);
            res.end('ok');
          } catch {
            res.statusCode = 400;
            res.end('invalid json');
          }
        });
      });
    },
  };
}

// The audio manager loads sounds/music via literal runtime string paths
// (js/audio.js: `new Audio('assets/sounds/…')`). Vite only bundles imported
// assets, so without this the `assets/` folder is missing from the build
// output and the deployed site has no sound (404s). Copy it into dist/.
function copyStaticAssets() {
  let outDir = 'dist';
  return {
    name: 'copy-static-assets',
    apply: 'build',
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      const src = resolve(__dirname, 'assets');
      const dest = resolve(__dirname, outDir, 'assets');
      if (existsSync(src)) cpSync(src, dest, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [copyStaticAssets(), worldPatchEndpoint()],
  // main.js boots with a top-level `await loadWorldPatch()`; the default
  // esbuild target ('modules' → es2020/safari14) rejects top-level await,
  // so target the first level that allows it. Every browser that can run
  // WebGL2 for this game supports es2022.
  build: { target: 'es2022' },
  resolve: {
    alias: {
      three: resolve(__dirname, 'libs/three.module.js'),
    },
  },
});
