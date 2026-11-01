/* What only this device keeps: small settings, a log of what was done to the
   vault, and the vault itself (only ever ciphertext, see vaultcrypto.js).
   Everything else Roxan knows lives with Roxan. IndexedDB when the browser will
   give it, and plain memory (lost on close) when it will not; `persistent` says
   which, so the app can tell the person instead of pretending.

   A browser that ran the first, on-device Roxan still holds that version's
   stores. Nothing reads them now, and nothing here deletes them. */
const NAME = "roxan", VERSION = 2;
const KEYS = { meta: "key", activity: "id", vault: "id" };          // store → key path

let idb = null;
const mem = Object.fromEntries(Object.keys(KEYS).map(k => [k, new Map()]));
export let persistent = false;

export const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
let last = 0;
export const tick = () => (last = Math.max(Date.now(), last + 1));      // unique, ordered timestamps

export function open() {
  return new Promise(resolve => {
    let req;
    try { req = indexedDB.open(NAME, VERSION); } catch { return resolve(false); }
    req.onupgradeneeded = () => {
      for (const [name, keyPath] of Object.entries(KEYS)) if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath });
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
  return run(store, "readonly", tx => wrap(tx.objectStore(store).get(key)));
}
export async function all(store) {
  if (!idb) return [...mem[store].values()];
  return run(store, "readonly", tx => wrap(tx.objectStore(store).getAll()));
}
export async function put(store, value) {
  if (!idb) { mem[store].set(value[KEYS[store]], value); return value; }
  await run(store, "readwrite", tx => { tx.objectStore(store).put(value); });
  return value;
}
export async function del(store, key) {
  if (!idb) { mem[store].delete(key); return; }
  await run(store, "readwrite", tx => { tx.objectStore(store).delete(key); });
}
