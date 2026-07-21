// Minimal service worker — its main job is to make the game installable as a
// PWA (a fetch handler is required) and to survive brief network drops. The
// build assets are content-hashed by Vite, so we use a network-FIRST strategy
// (always prefer fresh files; fall back to cache only when offline) and never
// pin a stale bundle. Big media (music/sounds) are cached opportunistically.
const CACHE = 'atw-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // don't touch Google / Firebase
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && (fresh.type === 'basic')) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;
      // last resort for navigations: the cached app shell
      if (req.mode === 'navigate') {
        const shell = await caches.match('./');
        if (shell) return shell;
      }
      throw new Error('offline and uncached: ' + url.pathname);
    }
  })());
});
