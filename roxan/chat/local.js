/* What only this device keeps: small settings (a half-written message, the
   vault's header) and the vault's own log. Nothing here is ever sent to Roxan.
   Everything else Roxan knows lives with Roxan, and the page asks for it. */
import * as db from "./db.js";
import { emit } from "./dom.js";

export const getMeta = async (key, fallback = null) => (await db.get("meta", key))?.value ?? fallback;
export const setMeta = (key, value) => db.put("meta", { key, value });
export const delMeta = key => db.del("meta", key);
export const vaultCount = async () => (await db.all("vault")).length;          // only how many: what is in them is for the vault page alone

// The vault's own entries only: the first version of this app kept its chat log in the same store, and that log is not Roxan's any more.
export const vaultLog = async () => (await db.all("activity")).filter(r => r.kind === "vault");

// A record of what was done to the vault stays beside the vault: it must not leave the device it protects.
export async function log(kind, text) {
  await db.put("activity", { id: db.uid("a"), at: db.tick(), kind, text, roomId: null });
  emit("activity");
}
