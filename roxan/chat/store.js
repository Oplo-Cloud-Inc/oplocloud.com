/* Shared reads and writes: the rooms, small settings, and the activity log. */
import * as db from "./db.js";
import { emit } from "./dom.js";

export const MAIN = "main";

export async function ensureMain() {
  return (await db.get("rooms", MAIN)) || db.put("rooms", { id: MAIN, kind: "main", name: "Roxan", instructions: "", createdAt: Date.now(), updatedAt: Date.now() });
}
export const getRoom = id => db.get("rooms", id);
export const touch = async room => { room.updatedAt = Date.now(); await db.put("rooms", room); };

export async function getMeta(key, fallback = null) { return (await db.get("meta", key))?.value ?? fallback; }
export const setMeta = (key, value) => db.put("meta", { key, value });
export const delMeta = key => db.del("meta", key);

// The log keeps what happened, not what was said.
export async function log(kind, text, roomId = null) {
  await db.put("activity", { id: db.uid("a"), at: db.tick(), kind, text, roomId });
  emit("activity");
}
