// ==========================================================================
// Dedicated co-op server (Version C) — client configuration.
//
// Point this at your server's public HTTPS origin (no trailing path). The web
// client polls  <SERVER_URL>/health  and only enables the "🖥️ Server" button on
// the Survival screen while that answers { ready: true }; the game transport
// then connects to  wss://<host>/ws .
//
// Leave it EMPTY to hide/disable server play (the default until you deploy):
//   export const SERVER_URL = '';
// Once your Hetzner box + domain are up (see server/README.md):
//   export const SERVER_URL = 'https://woods.example.com';
//
// Must be https:// in production — the site is served over HTTPS and browsers
// block plaintext ws:// / http:// from a secure page. http://localhost is fine
// for local testing.
// ==========================================================================

export const SERVER_URL = '';
