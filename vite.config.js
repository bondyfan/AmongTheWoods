import { resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';

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
  plugins: [copyStaticAssets()],
  resolve: {
    alias: {
      three: resolve(__dirname, 'libs/three.module.js'),
    },
  },
});
