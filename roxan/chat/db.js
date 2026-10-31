/* Everything Roxan keeps lives in this browser: IndexedDB when the browser will
   give it, and plain memory (lost on close) when it will not. `persistent` says
   which, so the app can tell the person instead of pretending. */
const NAME = "roxan", VERSION = 2;
const STORES = {
  meta: { keyPath: "key" },
  rooms: { keyPath: "id" },
  events: { keyPath: "id", indexes: { room: ["roomId", "at"] } },
  memories: { keyPath: "id" },
  reminders: { keyPath: "id" },
  files: { keyPath: "id", indexes: { room: "roomId" } },
  activity: { keyPath: "id" },
  specialties: { keyPath: "id" },      // added in version 2
  handoffs: { keyPath: "id" },         // added in version 2
  vault: { keyPath: "id" },            // added in version 2: only ever ciphertext, see vaultcrypto.js
};
const NOT_EXPORTED = new Set(["vault"]);       // a copy of everything leaves the vault out, even sealed

let idb = null;
const mem = Object.fromEntries(Object.keys(STORES).map(k => [k, new Map()]));
export let persistent = false;

export const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
let last = 0;
export const tick = () => (last = Math.max(Date.now(), last + 1));      // unique, ordered timestamps

export function open() {
  return new Promise(resolve => {
    let req;
    try { req = indexedDB.open(NAME, VERSION); } catch { return resolve(false); }
    req.onupgradeneeded = () => {
      for (const [name, s] of Object.entries(STORES)) {
        if (req.result.objectStoreNames.contains(name)) continue;          // an upgrade from version 1 only adds what is new
        const store = req.result.createObjectStore(name, { keyPath: s.keyPath });
        for (const [ix, kp] of Object.entries(s.indexes || {})) store.createIndex(ix, kp);
      }
    };
    req.onsuccess = () => { idb = req.result; persistent = true; idb.onversionchange = () => idb.close(); resolve(true); };
    req.onerror = req.onblocked = () => resolve(false);
  });
}

const run = (stores, mode, fn) => new Promise((resolve, reject) => {
  const tx = idb.transaction(stores, mode);
  let out;
  tx.oncomplete = () => resolve(out);
  tx.onerror = tx.onabort = () => reject(tx.error);
  out = fn(tx);
});
const wrap = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });

export async function get(store, key) {
  if (!idb) return mem[store].get(key);
  return run(store, "readonly", tx => wrap(tx.objectStore(store).get(key))).then(r => r);
}
export async function all(store) {
  if (!idb) return [...mem[store].values()];
  return run(store, "readonly", tx => wrap(tx.objectStore(store).getAll()));
}
export async function put(store, value) {
  if (!idb) { mem[store].set(value[STORES[store].keyPath], value); return value; }
  await run(store, "readwrite", tx => { tx.objectStore(store).put(value); });
  return value;
}
export async function del(store, key) {
  if (!idb) { mem[store].delete(key); return; }
  await run(store, "readwrite", tx => { tx.objectStore(store).delete(key); });
}

// A room's events, oldest first: the newest `limit` that are older than `before`.
export async function eventsIn(roomId, { before = Infinity, limit = 40 } = {}) {
  if (!idb) return [...mem.events.values()].filter(e => e.roomId === roomId && e.at < before).sort((a, b) => a.at - b.at).slice(-limit);
  const range = IDBKeyRange.bound([roomId, 0], [roomId, before], false, true);
  const rows = [];
  await new Promise((resolve, reject) => {
    const tx = idb.transaction("events", "readonly");
    const req = tx.objectStore("events").index("room").openCursor(range, "prev");
    req.onsuccess = () => {
      const c = req.result;
      if (c && rows.length < limit) { rows.push(c.value); c.continue(); } else resolve();
    };
    req.onerror = () => reject(req.error);
  });
  return rows.reverse();
}

export async function inRoom(store, roomId) {
  return (await all(store)).filter(r => r.roomId === roomId);
}

export async function deleteRoom(roomId) {
  const ids = { events: [], files: [] };
  for (const s of Object.keys(ids)) ids[s] = (await inRoom(s, roomId)).map(r => r.id);
  if (!idb) { for (const s of Object.keys(ids)) ids[s].forEach(id => mem[s].delete(id)); mem.rooms.delete(roomId); return; }
  await run(["events", "files", "rooms"], "readwrite", tx => {
    for (const s of Object.keys(ids)) ids[s].forEach(id => tx.objectStore(s).delete(id));
    tx.objectStore("rooms").delete(roomId);
  });
}

export async function clearAll() {
  for (const m of Object.values(mem)) m.clear();
  if (idb) { idb.close(); idb = null; }
  await new Promise(resolve => { try { const r = indexedDB.deleteDatabase(NAME); r.onsuccess = r.onerror = r.onblocked = () => resolve(); } catch { resolve(); } });
}

export async function dump() {
  const out = {};
  for (const s of Object.keys(STORES)) {
    if (NOT_EXPORTED.has(s)) continue;
    out[s] = (await all(s)).map(r => (s === "files" ? { ...r, blob: undefined, data: undefined, hasContent: Boolean(r.blob || r.text) } : r));
  }
  return out;
}
