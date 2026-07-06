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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase, ref, get, set, update, remove, push,
    onValue, onChildAdded, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "../firebase-config.js";

let app = null;
let db = null;

function ensureInit() {
    if (db) return;
    app = initializeApp(firebaseConfig);
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
    uid: "u" + Math.random().toString(36).slice(2, 10),
    partnerUid: null,
    _unsubs: [],
    _lastStateSend: 0,

    async createGame(mode, interval = null) {
        ensureInit();
        let code = null;
        for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = genCode();
            const snap = await withTimeout(get(ref(db, roomPath(candidate))), DB_UNREACHABLE);
            if (!snap.exists()) {
                await withTimeout(set(ref(db, roomPath(candidate)), {
                    meta: {
                        host: this.uid, guest: null, mode, interval,
                        seed: Math.floor(Math.random() * 1e9),
                        state: "waiting", created: Date.now(),
                    },
                }), DB_UNREACHABLE);
                code = candidate;
                break;
            }
        }
        if (!code) throw new Error("Could not allocate a game code, try again.");
        this.role = "host";
        this.code = code;
        onDisconnect(ref(db, roomPath(code))).remove(); // host gone → room gone
        return code;
    },

    async joinGame(code) {
        ensureInit();
        code = String(code || "").trim().toUpperCase();
        const snap = await withTimeout(get(ref(db, roomPath(code) + "/meta")), DB_UNREACHABLE);
        if (!snap.exists()) throw new Error("Game " + code + " not found.");
        const meta = snap.val();
        if (meta.guest) throw new Error("Game " + code + " is already full.");
        this.role = "guest";
        this.code = code;
        this.partnerUid = meta.host;
        await withTimeout(update(ref(db, roomPath(code) + "/meta"), {
            guest: this.uid, state: "playing",
        }), DB_UNREACHABLE);
        onDisconnect(ref(db, roomPath(code) + "/state/" + this.uid)).remove();
        return { ...meta, guest: this.uid, state: "playing" };
    },

    onMeta(fn) {
        const unsub = onValue(ref(db, roomPath(this.code) + "/meta"), (s) => fn(s.exists() ? s.val() : null));
        this._unsubs.push(unsub);
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

    onPartnerState(fn) {
        const sub = () => {
            const unsub = onValue(ref(db, roomPath(this.code) + "/state/" + this.partnerUid),
                (s) => fn(s.exists() ? s.val() : null));
            this._unsubs.push(unsub);
        };
        if (this.partnerUid) sub();
        else this._pendingPartnerSub = sub; // host: partner unknown until join
    },

    setPartner(uid) {
        this.partnerUid = uid;
        if (this._pendingPartnerSub) { this._pendingPartnerSub(); this._pendingPartnerSub = null; }
    },

    // Events go into the PARTNER's inbox; each side consumes (and deletes) its own.
    // undefined fields are stripped — Firebase THROWS on undefined values, which
    // silently killed every event carrying an optional field (e.g. pdmg.sh).
    sendEvent(obj) {
        if (!this.partnerUid) return;
        const clean = { from: this.uid };
        for (const [k, v] of Object.entries(obj)) if (v !== undefined) clean[k] = v;
        push(ref(db, roomPath(this.code) + "/ev/" + this.partnerUid), clean);
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
        if (this.code) {
            if (this.role === "host") remove(ref(db, roomPath(this.code)));
            else remove(ref(db, roomPath(this.code) + "/state/" + this.uid));
        }
        this.role = null; this.code = null; this.partnerUid = null;
    },
};
