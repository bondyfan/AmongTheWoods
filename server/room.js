// ==========================================================================
// Room — one shared co-op world living on the neutral server.
//
// MILESTONE 1 (this file today): the server OWNS the room (registry, lifecycle,
// 24/7 persistence, peer join/leave) and RELAYS the WoodsNet protocol between
// connected clients. To stay playable before the simulation is ported, the
// first client in the room is flagged the "authority" and runs the enemy/world
// sim exactly like today's host — but the room itself now lives on the VPS, so
// it survives player churn and the authority migrates automatically.
//
// MILESTONE 2 (the `tick()` seam below): move the authoritative simulation ONTO
// the server so NO player runs it. When that lands, the server produces `snap`
// itself in tick(), authority stops being a player role, and this becomes a
// true dedicated server. Everything else here (protocol, rooms, lifecycle)
// stays exactly the same.
// ==========================================================================

import { MSG, freshMeta, encode } from './protocol.js';

const AUTHORITY_GRACE_MS = 1500; // brief wait before promoting a new authority

export class Room {
  constructor(code, mode, seed) {
    this.code = code;
    this.meta = freshMeta(mode, seed);
    this.players = new Map();     // uid -> { uid, ws, lastState, joinedAt }
    this.authorityUid = null;     // M1 relay only: the player running the sim
    this.lastSnap = null;         // most recent world snapshot (for late joiners)
    this.sim = null;              // M2: the server-side GameRoom (server IS authority)
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  // M2: attach the authoritative server simulation. Once attached, NO player is
  // the authority — the server runs the sim in tick() and broadcasts snapshots.
  attachSim(sim) { this.sim = sim; this.authorityUid = null; }

  get size() { return this.players.size; }
  get empty() { return this.players.size === 0; }

  add(uid, ws) {
    this.lastActivity = Date.now();
    this.players.set(uid, { uid, ws, lastState: null, joinedAt: Date.now() });
    if (this.sim) this.sim.addPlayer(uid);                 // M2: server authority
    else if (!this.authorityUid) this.authorityUid = uid;  // M1: first in runs the sim
    this.meta.state = 'playing';
    // with a sim EVERYONE is a guest (server is authority); M1 promotes the first
    const role = (!this.sim && uid === this.authorityUid) ? 'authority' : 'guest';
    this.sendTo(uid, {
      t: MSG.WELCOME, code: this.code, uid, role, meta: this.meta,
      peers: [...this.players.keys()].filter((u) => u !== uid),
    });
    if (!this.sim && this.lastSnap && uid !== this.authorityUid) {
      this.sendTo(uid, { t: MSG.SNAP_UP, snap: this.lastSnap });
    }
    this.broadcast({ t: MSG.PEER, event: 'join', uid }, uid);
    if (!this.sim) this.broadcast({ t: MSG.PEER, event: 'authority', uid: this.authorityUid });
  }

  remove(uid) {
    this.players.delete(uid);
    this.lastActivity = Date.now();
    this.sim?.removePlayer(uid);
    this.broadcast({ t: MSG.PEER, event: 'leave', uid });
    // M1 relay only: promote a survivor to authority. With a sim, the server
    // stays the authority — nothing to hand over.
    if (!this.sim && uid === this.authorityUid) {
      this.authorityUid = null;
      const next = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (next) {
        this.authorityUid = next.uid;
        this.broadcast({ t: MSG.PEER, event: 'authority', uid: this.authorityUid });
      }
    }
  }

  // ---- message relay (mirrors the Firebase state/event/snap fan-out) ----
  onState(uid, state) {
    const p = this.players.get(uid);
    if (p) p.lastState = state;
    this.lastActivity = Date.now();
    this.sim?.onState(uid, state);   // M2: feed the guest's proxy (enemy targeting)
    // still relay so guests render each other's avatars
    this.broadcast({ t: MSG.STATE_UP, from: uid, state }, uid);
  }

  onEvent(uid, ev) {
    this.lastActivity = Date.now();
    // M2: world-mutating events (ehit/collect/drop/chop/berry) are consumed by
    // the sim, not relayed; peer-relay events (revive/ping/…) fall through.
    if (this.sim && this.sim.onEvent(uid, ev)) return;
    this.broadcast({ t: MSG.EVENT_UP, ev: { from: uid, ...ev } }, uid);
  }

  onSnap(uid, snap) {
    if (uid !== this.authorityUid) return; // only the authority's snapshot counts
    this.lastSnap = snap;
    this.lastActivity = Date.now();
    this.broadcast({ t: MSG.SNAP_UP, snap }, uid);
  }

  onMeta(uid, patch) {
    Object.assign(this.meta, patch || {});
    this.broadcast({ t: MSG.META_UP, meta: this.meta });
  }

  // ---- MILESTONE 2 ----
  // With a sim attached, advance the authoritative simulation; it broadcasts its
  // own snapshots. Without one (M1 relay rooms) this stays a no-op.
  tick(dtMs) { this.sim?.tick(dtMs); }

  // ---- transport helpers ----
  sendTo(uid, obj) {
    const p = this.players.get(uid);
    if (p && p.ws.readyState === 1) { try { p.ws.send(encode(obj)); } catch {} }
  }

  broadcast(obj, exceptUid = null) {
    const data = encode(obj);
    for (const p of this.players.values()) {
      if (p.uid === exceptUid) continue;
      if (p.ws.readyState === 1) { try { p.ws.send(data); } catch {} }
    }
  }
}

export { AUTHORITY_GRACE_MS };
