// ==========================================================================
// Wire protocol shared by the Among The Woods client (js/netws.js) and this
// dedicated server. Every frame on the socket is a single JSON object with a
// `t` (type) field. The shapes deliberately MIRROR the Firebase transport in
// js/net.js (meta / state / event / snap) so the client's multiplayer layer
// needs only a transport swap, not a rewrite.
// ==========================================================================

export const PROTOCOL_VERSION = 1;

export const MSG = {
  // ---- client -> server ----
  HELLO: 'hello',   // { uid, want:'create'|'join', code?, mode:'coop', interval? }
  STATE: 'state',   // { state }   throttled own player-state blob
  EVENT: 'event',   // { ev }      one-shot gameplay event (hit / collect / …)
  SNAP:  'snap',    // { snap }     world snapshot (only the room authority sends)
  META:  'meta',    // { patch }    room-meta patch
  PING:  'ping',    // { }          heartbeat (server replies PONG)
  BYE:   'bye',     // { }          clean leave

  // ---- server -> client ----
  WELCOME: 'welcome', // { code, role:'authority'|'guest', uid, meta, peers:[uid] }
  META_UP: 'meta',    // { meta }              full meta after a change
  STATE_UP:'state',   // { from, state }       a peer's state blob
  EVENT_UP:'event',   // { ev }                an event addressed to this client
  SNAP_UP: 'snap',    // { snap }              latest world snapshot
  PEER:    'peer',    // { event:'join'|'leave'|'authority', uid }
  ERROR:   'error',   // { msg, fatal? }
  PONG:    'pong',    // { }
};

// A room's shared meta — the same fields js/net.js writes to Firebase `meta`.
export function freshMeta(mode, seed) {
  return {
    host: 'server',           // the neutral server owns the room (not a player)
    mode,                     // 'coop' (pvp/moba stay on Firebase for now)
    seed,                     // shared world seed so every client generates the same map
    state: 'waiting',
    created: Date.now(),
  };
}

// 4-char room codes, same alphabet/shape as js/net.js so they feel identical.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function genCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

export function encode(obj) { return JSON.stringify(obj); }
export function decode(buf) {
  try { return JSON.parse(typeof buf === 'string' ? buf : buf.toString('utf8')); }
  catch { return null; }
}
