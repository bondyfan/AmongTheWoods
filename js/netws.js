// ==========================================================================
// WoodsNetWS — the dedicated-server transport for co-op (Version C).
//
// It exposes the SAME surface as WoodsNet (js/net.js) — createGame / joinGame /
// onMeta / sendState / onPartnerState / sendEvent / onEvent / sendSnap / onSnap /
// leave — but over a WebSocket to the neutral server instead of Firebase. That
// way js/multiplayer.js can be pointed at this transport for "Server" games with
// a swap rather than a rewrite (Milestone 2 wires it in).
//
// Uses the global WebSocket (present in browsers). The protocol matches
// server/protocol.js.
// ==========================================================================

import { SERVER_URL } from '../server-config.js';

const MSG = {
  HELLO: 'hello', STATE: 'state', EVENT: 'event', SNAP: 'snap', META: 'meta',
  PING: 'ping', BYE: 'bye',
  WELCOME: 'welcome', PEER: 'peer', ERROR: 'error', PONG: 'pong',
};

function wsUrl() {
  if (!SERVER_URL) return null;
  return SERVER_URL.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws';
}

export const WoodsNetWS = {
  role: null,          // 'host' (server authority) | 'guest'
  code: null,
  partnerUid: null,
  _ws: null,
  _uid: null,
  _lastStateSend: 0,
  _ping: null,
  _handlers: { meta: null, partnerState: null, event: null, snap: null, peer: null },

  uid() {
    if (this._uid) return this._uid;
    let u = null;
    try { u = localStorage.getItem('atw-uid'); } catch {}
    if (!u) { u = 'u' + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('atw-uid', u); } catch {} }
    this._uid = u; return u;
  },

  // open the socket and send HELLO; resolves with { code, meta } once WELCOME
  // arrives. want = 'create' | 'join'.
  _connect(want, { code = null, mode = 'coop', seed = 1 } = {}) {
    const url = wsUrl();
    if (!url) return Promise.reject(new Error('No server configured.'));
    return new Promise((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(url);
      this._ws = ws;
      const failTimer = setTimeout(() => { if (!settled) { settled = true; try { ws.close(); } catch {} reject(new Error('Server did not respond.')); } }, 8000);

      ws.onopen = () => ws.send(JSON.stringify({ t: MSG.HELLO, uid: this.uid(), want, code, mode, seed }));

      ws.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (!settled && m.t === MSG.WELCOME) {
          settled = true; clearTimeout(failTimer);
          this.code = m.code;
          this.role = m.role === 'authority' ? 'host' : 'guest';
          if (Array.isArray(m.peers) && m.peers.length) this.partnerUid = m.peers[0];
          this._startPing();
          resolve({ code: m.code, meta: m.meta });
          return;
        }
        if (!settled && m.t === MSG.ERROR) {
          settled = true; clearTimeout(failTimer);
          try { ws.close(); } catch {}
          reject(new Error(m.msg || 'Server refused the connection.'));
          return;
        }
        this._dispatch(m);
      };

      ws.onerror = () => { if (!settled) { settled = true; clearTimeout(failTimer); reject(new Error("Can't reach the server.")); } };
      ws.onclose = () => { this._stopPing(); if (!settled) { settled = true; clearTimeout(failTimer); reject(new Error('Server connection closed.')); } };
    });
  },

  _dispatch(m) {
    switch (m.t) {
      case MSG.META:  this._handlers.meta?.(m.meta); break;
      case MSG.STATE: if (m.from === this.partnerUid || this.partnerUid == null) this._handlers.partnerState?.(m.state); break;
      case MSG.EVENT: this._handlers.event?.(m.ev); break;
      case MSG.SNAP:  this._handlers.snap?.(m.snap); break;
      case MSG.PEER:
        if (m.event === 'join') this.partnerUid = m.uid;
        else if (m.event === 'leave' && m.uid === this.partnerUid) this.partnerUid = null;
        else if (m.event === 'authority') this.role = (m.uid === this.uid()) ? 'host' : 'guest';
        this._handlers.peer?.(m);
        break;
      default: break;
    }
  },

  _startPing() { this._stopPing(); this._ping = setInterval(() => this._send({ t: MSG.PING }), 25000); },
  _stopPing() { if (this._ping) { clearInterval(this._ping); this._ping = null; } },
  _send(obj) { const ws = this._ws; if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch {} } },

  // ---- WoodsNet-shaped API ----
  async createGame(mode = 'coop') { const r = await this._connect('create', { mode }); return { code: r.code, meta: r.meta }; },
  async joinGame(code) {
    code = String(code || '').trim().toUpperCase();
    const r = await this._connect('join', { code });
    this.partnerUid = this.partnerUid || 'server';
    return r.meta;
  },

  onMeta(fn) { this._handlers.meta = fn; },
  updateMeta(patch) { this._send({ t: MSG.META, patch }); return Promise.resolve(); },

  sendState(state, minMs = 100) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - this._lastStateSend < minMs) return;
    this._lastStateSend = now;
    this._send({ t: MSG.STATE, state });
  },
  onPartnerState(fn) { this._handlers.partnerState = fn; },
  setPartner(uid) { this.partnerUid = uid; },

  sendEvent(obj) {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) if (v !== undefined) clean[k] = v;
    this._send({ t: MSG.EVENT, ev: clean });
  },
  onEvent(fn) { this._handlers.event = fn; },

  sendSnap(snap) { this._send({ t: MSG.SNAP, snap }); },
  onSnap(fn) { this._handlers.snap = fn; },

  // server handles authority promotion itself and announces it via PEER; expose
  // it so multiplayer.js can react (Milestone 2).
  onPeer(fn) { this._handlers.peer = fn; },
  becomeHost() { /* server-driven; role flips on the PEER 'authority' message */ return Promise.resolve(); },

  leave() {
    this._stopPing();
    this._send({ t: MSG.BYE });
    try { this._ws?.close(); } catch {}
    this._ws = null; this.role = null; this.code = null; this.partnerUid = null;
    this._handlers = { meta: null, partnerState: null, event: null, snap: null, peer: null };
  },
};
