// ==========================================================================
// Among The Woods — SINGLEPLAYER save/load (localStorage)
//
// Completely separate from the Firebase cloud saves used by co-op multiplayer
// (see auth.js). These live on THIS device only, need no sign-in, and work
// offline — exactly what a solo run wants. The API mirrors auth.js's save
// methods (saveGame / autoSave / listSaves / loadSave / deleteSave) so main.js
// can route to either backend through one seam.
//
// Layout in localStorage under one key:
//   { list: [ {id, at, biome, level, data}, … ],   // manual saves (newest kept)
//     autosave: {id:'autosave', at, biome, level, auto:true, data} }  // single slot
// ==========================================================================

const KEY = 'atw-sp-saves';
const MAX = 20; // keep a short manual-save history; the autosave slot is extra

function _read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function _write(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { throw new Error('local storage full'); }
}
function _newId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const LocalSaves = {
  // manual save → a fresh timestamped record; history is capped at MAX (newest)
  saveGame(meta, data) {
    const db = _read();
    db.list = Array.isArray(db.list) ? db.list : [];
    db.list.push({ id: _newId(), at: Date.now(), ...meta, data });
    db.list.sort((a, b) => b.at - a.at);
    if (db.list.length > MAX) db.list = db.list.slice(0, MAX);
    _write(db);
  },

  // autosave → ONE rolling slot at a fixed id, overwriting itself each time
  autoSave(meta, data) {
    const db = _read();
    db.autosave = { id: 'autosave', at: Date.now(), auto: true, ...meta, data };
    _write(db);
  },

  // newest-first list of { id, at, biome, level, auto } (autosave included)
  listSaves() {
    const db = _read();
    const out = [];
    if (db.autosave) {
      const v = db.autosave;
      out.push({ id: 'autosave', at: v.at, biome: v.biome, level: v.level, auto: true });
    }
    for (const v of (Array.isArray(db.list) ? db.list : [])) {
      out.push({ id: v.id, at: v.at, biome: v.biome, level: v.level, auto: false });
    }
    out.sort((a, b) => b.at - a.at);
    return out;
  },

  loadSave(id) {
    const db = _read();
    if (id === 'autosave') return db.autosave?.data ?? null;
    const rec = (Array.isArray(db.list) ? db.list : []).find(s => s.id === id);
    return rec ? rec.data : null;
  },

  deleteSave(id) {
    const db = _read();
    if (id === 'autosave') delete db.autosave;
    else db.list = (Array.isArray(db.list) ? db.list : []).filter(s => s.id !== id);
    _write(db);
  },
};
