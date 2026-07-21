// ==========================================================================
// ServerStatus — polls the dedicated server's /health so the UI can enable the
// "🖥️ Server" button ONLY while the server is genuinely online and ready.
//
// It is deliberately tiny and dependency-free: the multiplayer transport
// (js/netws.js) is only imported once the player actually clicks Server.
// ==========================================================================

import { SERVER_URL } from '../server-config.js';

function healthUrl() {
  if (!SERVER_URL) return null;
  return SERVER_URL.replace(/\/+$/, '') + '/health';
}

export const ServerStatus = {
  configured: !!SERVER_URL,
  online: false,
  detail: SERVER_URL ? 'checking…' : 'not configured',
  _cbs: [],
  _timer: null,

  // subscribe; the callback fires immediately with the current state and again
  // on every change. cb(online:boolean, detail:string)
  onChange(cb) {
    this._cbs.push(cb);
    try { cb(this.online, this.detail); } catch {}
    return () => { this._cbs = this._cbs.filter((c) => c !== cb); };
  },

  _emit(online, detail) {
    const changed = online !== this.online || detail !== this.detail;
    this.online = online; this.detail = detail;
    if (changed) for (const c of this._cbs) { try { c(online, detail); } catch {} }
  },

  async check() {
    const url = healthUrl();
    if (!url) { this._emit(false, 'not configured'); return false; }
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(to);
      const j = res.ok ? await res.json().catch(() => null) : null;
      if (res.ok && j && j.ready) {
        const load = (j.players ?? 0) + ' online · ' + (j.rooms ?? 0) + ' games';
        this._emit(true, load);
      } else {
        this._emit(false, 'server not ready');
      }
    } catch {
      this._emit(false, 'offline');
    }
    return this.online;
  },

  // begin polling; safe to call repeatedly (single timer). No-op if unconfigured.
  start(intervalMs = 8000) {
    if (!this.configured) { this._emit(false, 'not configured'); return; }
    this.check();
    this._timer ??= setInterval(() => this.check(), intervalMs);
  },

  stop() { if (this._timer) { clearInterval(this._timer); this._timer = null; } },

  // base for the WebSocket transport: https→wss, http→ws
  wsUrl() {
    if (!SERVER_URL) return null;
    return SERVER_URL.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws';
  },
};
