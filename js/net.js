// ==========================================================================
// Among The Woods — multiplayer transport (Firebase Realtime Database)
//
// Same Firebase project as era-battle; rooms live at  games/woods-<CODE>  so
// they coexist with era-battle rooms under the existing `games` rules.
//
// Room layout:
//   meta                  { host, guest, mode:'coop'|'pvp', interval, seed,
//                           state:'waiting'|'playing', nextArenaAt, created }
//   state/<uid>           small player-state blobs, written throttled
//   ev/<uid>              per-player event INBOX — the partner pushes events
//                         here; the owner consumes and deletes them
//   snap                  co-op only: host's world snapshot (enemies/pickups/shots)
//
// This module is dynamically imported from the multiplayer menu, so
// single-player never waits on Firebase.
// ==========================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase, ref, get, set, update, remove, push,
    onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "../firebase-config.js";

export const COOP_WORLD_SEED = 1;
// co-op rooms hold up to 20 players (pvp/moba stay strictly 1v1)
export const MAX_COOP_PLAYERS = 20;

let app = null;
let db = null;

function ensureInit() {
    if (db) return;
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
}

const DB_TIMEOUT_MS = 9000;
const DB_UNREACHABLE = "Can't reach the database. Check databaseURL in firebase-config.js.";
function withTimeout(promise, msg) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(msg)), DB_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode() {
    let s = "";
    for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    return s;
}
const roomPath = (code) => "games/woods-" + code;

export const WoodsNet = {
    role: null,        // 'host' | 'guest'
    code: null,
    uid: (() => {
        // persisted so a dropped guest can rejoin the same room with the code
        let u = null;
        try { u = localStorage.getItem("atw-uid"); } catch {}
        if (!u) {
            u = "u" + Math.random().toString(36).slice(2, 10);
            try { localStorage.setItem("atw-uid", u); } catch {}
        }
        return u;
    })(),
    partnerUid: null,
    _unsubs: [],
    _lastStateSend: 0,

    _meta: null, // latest room meta (kept fresh for the co-op event fan-out)

    async createGame(mode, interval = null) {
        ensureInit();
        let code = null, meta = null;
        for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = genCode();
            const snap = await withTimeout(get(ref(db, roomPath(candidate))), DB_UNREACHABLE);
            if (!snap.exists()) {
                meta = {
                    host: this.uid, guest: null, mode, interval,
                    seed: mode === "coop" ? COOP_WORLD_SEED : Math.floor(Math.random() * 1e9),
                    state: "waiting", created: Date.now(),
                    // co-op: uid → joinedAt roster (up to MAX_COOP_PLAYERS).
                    // pvp/moba keep the single `guest` seat instead.
                    ...(mode === "coop" ? { players: { [this.uid]: Date.now() } } : {}),
                };
                await withTimeout(set(ref(db, roomPath(candidate)), { meta }), DB_UNREACHABLE);
                code = candidate;
                break;
            }
        }
        if (!code) throw new Error("Could not allocate a game code, try again.");
        this.role = "host";
        this.code = code;
        this._meta = meta;
        // host gone → only the HOST SEAT empties; the room survives so the
        // remaining players can take over and keep the code joinable
        onDisconnect(ref(db, roomPath(code) + "/meta/host")).remove();
        onDisconnect(ref(db, roomPath(code) + "/meta/players/" + this.uid)).remove();
        onDisconnect(ref(db, roomPath(code) + "/state/" + this.uid)).remove();
        return { code, meta };
    },

    async joinGame(code) {
        ensureInit();
        code = String(code || "").trim().toUpperCase();
        const snap = await withTimeout(get(ref(db, roomPath(code) + "/meta")), DB_UNREACHABLE);
        if (!snap.exists()) throw new Error("Game " + code + " not found.");
        const meta = snap.val();
        this.role = "guest";
        this.code = code;
        this.partnerUid = meta.host;
        if (meta.mode === "coop") {
            const roster = meta.players || (meta.host ? { [meta.host]: meta.created } : {});
            const seats = Object.keys(roster).filter((u) => u !== this.uid).length + 1;
            if (seats > MAX_COOP_PLAYERS) throw new Error(`Game ${code} is full (${MAX_COOP_PLAYERS} players).`);
            await withTimeout(update(ref(db, roomPath(code) + "/meta"), {
                ["players/" + this.uid]: Date.now(), state: "playing",
            }), DB_UNREACHABLE);
            this._meta = { ...meta, players: { ...roster, [this.uid]: Date.now() }, state: "playing" };
            onDisconnect(ref(db, roomPath(code) + "/meta/players/" + this.uid)).remove();
            onDisconnect(ref(db, roomPath(code) + "/state/" + this.uid)).remove();
            return this._meta;
        }
        // pvp / moba: strictly two seats
        if (meta.guest && meta.guest !== this.uid) throw new Error("Game " + code + " is already full.");
        await withTimeout(update(ref(db, roomPath(code) + "/meta"), {
            guest: this.uid, state: "playing",
        }), DB_UNREACHABLE);
        this._meta = { ...meta, guest: this.uid, state: "playing" };
        onDisconnect(ref(db, roomPath(code) + "/state/" + this.uid)).remove();
        return this._meta;
    },

    onMeta(fn) {
        const unsub = onValue(ref(db, roomPath(this.code) + "/meta"), (s) => {
            const m = s.exists() ? s.val() : null;
            if (m) this._meta = m; // keep the roster fresh for sendEvent's fan-out
            fn(m);
        });
        this._unsubs.push(unsub);
    },

    // co-op roster helper: every OTHER player currently seated in the room
    _others() {
        if (this._meta?.mode === "coop") {
            return Object.keys(this._meta.players || {}).filter((u) => u !== this.uid);
        }
        return this.partnerUid ? [this.partnerUid] : [];
    },

    updateMeta(patch) {
        return update(ref(db, roomPath(this.code) + "/meta"), patch);
    },

    // Throttled own-state broadcast. minMs controls the rate per call site.
    sendState(state, minMs = 100) {
        const now = performance.now();
        if (now - this._lastStateSend < minMs) return;
        this._lastStateSend = now;
        set(ref(db, roomPath(this.code) + "/state/" + this.uid), state);
    },

    // Per-peer state streams: fn(uid, state|null) — null when that peer's state
    // node vanishes (disconnect). Child listeners on the state/ parent scale to
    // N players without re-reading the whole node on every write.
    _peerStateFn: null,
    onPeerState(fn) {
        this._peerStateFn = fn;
        const parent = ref(db, roomPath(this.code) + "/state");
        const emit = (child) => {
            if (child.key === this.uid) return;
            this._peerStateFn?.(child.key, child.val());
        };
        const u1 = onChildAdded(parent, emit);
        const u2 = onChildChanged(parent, emit);
        const u3 = onChildRemoved(parent, (child) => {
            if (child.key === this.uid) return;
            this._peerStateFn?.(child.key, null);
        });
        this._unsubs.push(u1, u2, u3);
    },

    setPartner(uid) { this.partnerUid = uid; },

    // the old host vanished — a survivor claims the host seat and keeps
    // the room code alive for the next joiner
    async becomeHost() {
        this.role = "host";
        const patch = { host: this.uid };
        if (this._meta?.mode !== "coop") { patch.guest = null; this.partnerUid = null; }
        await update(ref(db, roomPath(this.code) + "/meta"), patch);
        onDisconnect(ref(db, roomPath(this.code) + "/meta/host")).remove();
        onDisconnect(ref(db, roomPath(this.code) + "/state/" + this.uid)).remove();
    },

    // Events go into each recipient's inbox; everyone consumes (and deletes) its
    // own. toUid targets ONE player (revive/heal/grant…); without it the event
    // fans out to every other seated player. undefined fields are stripped —
    // Firebase THROWS on undefined values, which silently killed every event
    // carrying an optional field (e.g. pdmg.sh).
    sendEvent(obj, toUid = null) {
        const clean = { from: this.uid };
        for (const [k, v] of Object.entries(obj)) if (v !== undefined) clean[k] = v;
        const targets = toUid ? [toUid] : this._others();
        for (const u of targets) push(ref(db, roomPath(this.code) + "/ev/" + u), clean);
    },

    onEvent(fn) {
        const inbox = ref(db, roomPath(this.code) + "/ev/" + this.uid);
        const unsub = onChildAdded(inbox, (child) => {
            fn(child.val());
            remove(child.ref);
        });
        this._unsubs.push(unsub);
    },

    // Co-op world snapshot (host writes, guest reads).
    sendSnap(snap) {
        set(ref(db, roomPath(this.code) + "/snap"), snap);
    },

    onSnap(fn) {
        const unsub = onValue(ref(db, roomPath(this.code) + "/snap"), (s) => { if (s.exists()) fn(s.val()); });
        this._unsubs.push(unsub);
    },

    leave() {
        this._unsubs.forEach((u) => u());
        this._unsubs = [];
        this._peerStateFn = null;
        const code = this.code, wasCoop = this._meta?.mode === "coop";
        if (code) {
            remove(ref(db, roomPath(code) + "/state/" + this.uid));
            if (wasCoop) remove(ref(db, roomPath(code) + "/meta/players/" + this.uid));
            if (this.role === "host") {
                // hand the room over if anyone is still in it, else tear it down
                get(ref(db, roomPath(code) + "/meta")).then((s) => {
                    const m = s.exists() ? s.val() : null;
                    const othersLeft = m && (wasCoop
                        ? Object.keys(m.players || {}).some((u) => u !== this.uid)
                        : (m.guest && m.guest !== this.uid));
                    if (othersLeft) remove(ref(db, roomPath(code) + "/meta/host"));
                    else remove(ref(db, roomPath(code)));
                }).catch(() => {});
            }
        }
        this.role = null; this.code = null; this.partnerUid = null; this._meta = null;
    },
};
