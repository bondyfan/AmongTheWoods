// ==========================================================================
// Among The Woods — dedicated co-op server (Version C, Milestone 1).
//
//   • GET /health           → JSON liveness the client polls to enable the
//                             "Server" button ONLY when the server is truly up.
//   • WebSocket  /ws         → the game transport (see protocol.js).
//
// Run:   npm install && npm start           (listens on PORT, default 8080)
// Deploy: see README.md (Hetzner CX + Caddy for wss:// TLS).
// ==========================================================================

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { MSG, PROTOCOL_VERSION, decode, encode, genCode } from './protocol.js';
import { Room } from './room.js';

const PORT = Number(process.env.PORT || 8080);
const TICK_HZ = Number(process.env.TICK_HZ || 15);
const EMPTY_ROOM_TTL_MS = Number(process.env.EMPTY_ROOM_TTL_MS || 120000); // keep briefly for reconnects
const HEARTBEAT_MS = 30000;
const STARTED_AT = Date.now();

// ---------------------------------------------------------------- room hub ---
const rooms = new Map();               // code -> Room
const emptySince = new Map();          // code -> timestamp it went empty

function createRoom(mode, seed) {
  let code = null;
  for (let i = 0; i < 8 && !code; i++) {
    const c = genCode();
    if (!rooms.has(c)) code = c;
  }
  if (!code) return null;
  const room = new Room(code, mode, seed ?? 1);
  rooms.set(code, room);
  return room;
}

function dropIfEmpty(room) {
  if (room.empty) emptySince.set(room.code, Date.now());
  else emptySince.delete(room.code);
}

// ------------------------------------------------------------- http server ---
const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0];
  if (req.method === 'GET' && (url === '/health' || url === '/')) {
    const body = JSON.stringify({
      status: 'ok',
      ready: true,                          // the client button gates on this
      service: 'among-the-woods',
      protocol: PROTOCOL_VERSION,
      uptimeSec: Math.round((Date.now() - STARTED_AT) / 1000),
      rooms: rooms.size,
      players: [...rooms.values()].reduce((n, r) => n + r.size, 0),
    });
    res.writeHead(200, {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',   // the static client is on another origin
      'cache-control': 'no-store',
    });
    res.end(body);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

// -------------------------------------------------------- websocket server ---
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.uid = null;
  ws.room = null;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (buf) => {
    const m = decode(buf);
    if (!m || typeof m.t !== 'string') return;

    // The very first message must be HELLO (create or join a room).
    if (!ws.room) {
      if (m.t !== MSG.HELLO) { fail(ws, 'Say hello first.'); return; }
      handleHello(ws, m);
      return;
    }

    const room = ws.room;
    switch (m.t) {
      case MSG.STATE: room.onState(ws.uid, m.state); break;
      case MSG.EVENT: room.onEvent(ws.uid, m.ev); break;
      case MSG.SNAP:  room.onSnap(ws.uid, m.snap); break;
      case MSG.META:  room.onMeta(ws.uid, m.patch); break;
      case MSG.PING:  safeSend(ws, { t: MSG.PONG }); break;
      case MSG.BYE:   ws.close(1000, 'bye'); break;
      default: break;
    }
  });

  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});

function handleHello(ws, m) {
  const uid = String(m.uid || '').slice(0, 40);
  if (!uid) { fail(ws, 'Missing uid.', true); return; }
  const mode = m.mode === 'coop' ? 'coop' : 'coop'; // only co-op is server-hosted for now

  let room;
  if (m.want === 'join') {
    const code = String(m.code || '').trim().toUpperCase();
    room = rooms.get(code);
    if (!room) { fail(ws, `Game ${code} not found.`, true); return; }
  } else {
    room = createRoom(mode, m.seed);
    if (!room) { fail(ws, 'Could not allocate a room, try again.', true); return; }
  }

  // one uid can't be in two seats — kick the stale socket
  if (room.players.has(uid)) {
    const prev = room.players.get(uid);
    try { prev.ws.close(4001, 'replaced'); } catch {}
    room.players.delete(uid);
  }

  ws.uid = uid;
  ws.room = room;
  room.add(uid, ws);
  emptySince.delete(room.code);
}

function leave(ws) {
  if (!ws.room || !ws.uid) return;
  const room = ws.room;
  room.remove(ws.uid);
  ws.room = null;
  dropIfEmpty(room);
}

function fail(ws, msg, fatal = false) {
  safeSend(ws, { t: MSG.ERROR, msg, fatal });
  if (fatal) { try { ws.close(4000, msg); } catch {} }
}
function safeSend(ws, obj) { if (ws.readyState === 1) { try { ws.send(encode(obj)); } catch {} } }

// ------------------------------------------------------ periodic machinery ---
// authoritative tick (drives Room.tick — a no-op until the sim is ported)
let _lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = now - _lastTick; _lastTick = now;
  for (const room of rooms.values()) room.tick(dt);
}, Math.max(1, Math.round(1000 / TICK_HZ)));

// reap dead sockets (heartbeat) and long-empty rooms
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) { try { ws.terminate(); } catch {} return; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  });
  const now = Date.now();
  for (const [code, since] of emptySince) {
    if (now - since > EMPTY_ROOM_TTL_MS) { rooms.delete(code); emptySince.delete(code); }
  }
}, HEARTBEAT_MS);

server.listen(PORT, () => {
  console.log(`[woods-server] listening on :${PORT}  (health /health, ws /ws, tick ${TICK_HZ}Hz)`);
});

// graceful shutdown so systemd restarts are clean
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`[woods-server] ${sig} — closing`);
    for (const ws of wss.clients) { try { ws.close(1012, 'server restarting'); } catch {} }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}

export { server, rooms }; // for tests
