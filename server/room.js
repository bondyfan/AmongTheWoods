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
    this.authorityUid = null;     // the player currently running the sim (M1)
    this.lastSnap = null;         // most recent world snapshot (for late joiners)
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  get size() { return this.players.size; }
  get empty() { return this.players.size === 0; }

  add(uid, ws) {
    this.lastActivity = Date.now();
    this.players.set(uid, { uid, ws, lastState: null, joinedAt: Date.now() });
    if (!this.authorityUid) this.authorityUid = uid; // first in runs the sim (M1)
    if (this.players.size >= 1) this.meta.state = 'playing';
    // tell the newcomer who they are + who's already here
    this.sendTo(uid, {
      t: MSG.WELCOME, code: this.code, uid,
      role: uid === this.authorityUid ? 'authority' : 'guest',
      meta: this.meta,
      peers: [...this.players.keys()].filter((u) => u !== uid),
    });
    if (this.lastSnap && uid !== this.authorityUid) {
      this.sendTo(uid, { t: MSG.SNAP_UP, snap: this.lastSnap });
    }
    // announce the newcomer + current authority to everyone else
    this.broadcast({ t: MSG.PEER, event: 'join', uid }, uid);
    this.broadcast({ t: MSG.PEER, event: 'authority', uid: this.authorityUid });
  }

  remove(uid) {
    this.players.delete(uid);
    this.lastActivity = Date.now();
    this.broadcast({ t: MSG.PEER, event: 'leave', uid });
    if (uid === this.authorityUid) {
      // promote the longest-present survivor to authority (M1). M2 removes this
      // entirely — the server is always the authority.
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
    this.broadcast({ t: MSG.STATE_UP, from: uid, state }, uid);
  }

  onEvent(uid, ev) {
    this.lastActivity = Date.now();
    // events carry the sender; co-op fans them to everyone else in the room
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

  // ---- MILESTONE 2 SEAM ----
  // The authoritative simulation goes here. Today it is a no-op (a real player
  // is the authority and streams `snap` via onSnap). When the sim is ported to
  // the server, this method advances enemies/pickups and calls
  // `this.broadcast({ t: MSG.SNAP_UP, snap })` itself, and authorityUid retires.
  tick(_dtMs) { /* no-op until the sim is ported (see README, Milestone 2) */ }

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
