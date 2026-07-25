// ==========================================================================
// Among The Woods — Google sign-in + cloud save/load (Firebase)
//
// Uses the SAME Firebase project as multiplayer. Sign-in is OPTIONAL: the
// game runs fine signed-out; you just can't save/load to the cloud.
//
// Saves live at  saves/<uid>/<pushId> = { name, at, biome, level, data }
// so each player keeps a short history of named, timestamped saves. Saving
// is only offered inside a co-op survival game; loading restores YOUR
// character (level / inventory / camp) into the current co-op session.
//
// The co-op AUTOSAVE uses one fixed key  saves/<uid>/autosave  (auto:true), so
// it always overwrites itself — a single rolling slot the game writes whenever
// you level up, buy something, or pick up a new item/resource.
//
// NOTE for the Firebase console: enable the Google provider under
// Authentication, add this site to Authentication → Settings → Authorized
// domains, and allow  saves/$uid  in the Realtime Database rules. Without the
// rule below, every save fails with  permission_denied. See database.rules.json
// in the repo root — MERGE its `saves` block into the existing era-battle rules:
//   "saves": {
//     "$uid": {
//       ".read":  "auth != null && auth.uid === $uid",
//       ".write": "auth != null && auth.uid === $uid",
//       ".indexOn": "at"
//     }
//   }
// ==========================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, push, set, get, remove, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "../firebase-config.js";

let app = null, auth = null, db = null;
function ensure() {
  if (auth) return;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
}

export const Auth = {
  user: null,          // { uid, name, photo } once signed in
  _cbs: [],

  // start listening for the sign-in state; fires the callback with the user
  // (or null) now and on every change
  watch(cb) {
    ensure();
    this._cbs.push(cb);
    onAuthStateChanged(auth, (u) => {
      this.user = u ? { uid: u.uid, name: u.displayName || 'Adventurer', photo: u.photoURL || '', email: u.email || '' } : null;
      for (const c of this._cbs) { try { c(this.user); } catch {} }
    });
  },

  async signIn() {
    ensure();
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const u = res.user;
    this.user = { uid: u.uid, name: u.displayName || 'Adventurer', photo: u.photoURL || '', email: u.email || '' };
    return this.user;
  },

  async signOutUser() {
    ensure();
    try { await signOut(auth); } catch {}
    this.user = null;
  },

  // ---- cloud CHARACTERS (WoW-style: one rolling autosave slot each) ----
  // saves/<uid>/chars/<charId> = { at, name, cls, level, biome, data }
  async saveChar(charId, meta, data) {
    ensure();
    if (!this.user) throw new Error('Not signed in');
    await set(ref(db, `saves/${this.user.uid}/chars/${charId}`),
      { id: charId, at: Date.now(), ...meta, data });
  },

  // newest-first list of { id, at, name, cls, level, biome }
  async listChars() {
    ensure();
    if (!this.user) return [];
    const snap = await get(ref(db, `saves/${this.user.uid}/chars`));
    const out = [];
    snap.forEach((c) => {
      const v = c.val() || {};
      out.push({ id: c.key, at: v.at, name: v.name, cls: v.cls, level: v.level, biome: v.biome });
    });
    out.sort((a, b) => (b.at || 0) - (a.at || 0));
    // legacy: a pre-character rolling autosave still sitting at saves/<uid>/autosave
    if (!out.length) {
      const old = await get(ref(db, `saves/${this.user.uid}/autosave`));
      if (old.exists()) {
        const v = old.val();
        out.push({ id: 'autosave', at: v.at, name: v.data?.name || v.name,
          cls: v.data?.selectedClass || null, level: v.level, biome: v.biome, legacy: true });
      }
    }
    return out;
  },

  async loadChar(charId) {
    ensure();
    if (!this.user) throw new Error('Not signed in');
    const path = charId === 'autosave' ? 'autosave' : `chars/${charId}`;
    const snap = await get(ref(db, `saves/${this.user.uid}/${path}`));
    return snap.exists() ? snap.val().data : null;
  },

  async deleteChar(charId) {
    ensure();
    if (!this.user) return;
    const path = charId === 'autosave' ? 'autosave' : `chars/${charId}`;
    await remove(ref(db, `saves/${this.user.uid}/${path}`));
  },
};
