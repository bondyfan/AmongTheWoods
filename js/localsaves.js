// ==========================================================================
// Among The Woods — SINGLEPLAYER character storage (localStorage)
//
// Completely separate from the Firebase cloud characters used by co-op/server
// play (see auth.js). These live on THIS device only, need no sign-in, and work
// offline. The API mirrors auth.js's character methods (saveChar / listChars /
// loadChar / deleteChar) so main.js can route to either backend through one seam.
//
// WoW-style: each CHARACTER owns one rolling autosave slot, keyed by its charId.
// There are no manual saves — the game autosaves the character you're playing,
// and the character-select screen lists them.
//
// Layout in localStorage under one key:
//   { chars: { <charId>: {id, at, name, cls, level, biome, data} } }
// ==========================================================================

const KEY = 'atw-sp-saves';

function _read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function _write(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { throw new Error('local storage full'); }
}

// One-time import of the pre-character format ({list:[…], autosave:{…}}) so a
// player who already had a rolling autosave keeps that character.
function _migrate(db) {
  if (db.chars || (!db.autosave && !db.list?.length)) return db;
  db.chars = {};
  const old = db.autosave || db.list?.[0];
  if (old?.data) {
    const id = old.data.charId || 'c-legacy';
    db.chars[id] = { id, at: old.at || Date.now(), name: old.data.name || 'Adventurer',
      cls: old.data.selectedClass || null, level: old.level ?? old.data.level ?? 1,
      biome: old.biome ?? null, data: { ...old.data, charId: id } };
  }
  delete db.autosave; delete db.list;
  _write(db);
  return db;
}

export const LocalSaves = {
  // one rolling slot per character — every save overwrites that character
  saveChar(charId, meta, data) {
    const db = _migrate(_read());
    db.chars = db.chars || {};
    db.chars[charId] = { id: charId, at: Date.now(), ...meta, data };
    _write(db);
  },

  // newest-first list of { id, at, name, cls, level, biome }
  listChars() {
    const db = _migrate(_read());
    return Object.values(db.chars || {})
      .map(({ data, ...meta }) => meta)
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  },

  loadChar(charId) {
    const db = _migrate(_read());
    return db.chars?.[charId]?.data ?? null;
  },

  deleteChar(charId) {
    const db = _migrate(_read());
    if (db.chars) delete db.chars[charId];
    _write(db);
  },
};
