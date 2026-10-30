/* Shared reads and writes: the rooms, small settings, and the activity log.

   A room is anywhere a conversation can happen: the main one, or a "session".
   A project is not a conversation itself; it holds sessions and the notes Roxan
   reads in all of them. */
import * as db from "./db.js";
import { emit } from "./dom.js";

export const MAIN = "main";
export const NEW_TITLE = "New conversation";

export async function ensureMain() {
  return (await db.get("rooms", MAIN)) || db.put("rooms", { id: MAIN, kind: "main", name: "Roxan", instructions: "", createdAt: Date.now(), updatedAt: Date.now() });
}
export const getRoom = id => db.get("rooms", id);

// Writing in a session counts as activity for its project too, so projects sort by what you used last.
export async function touch(room) {
  room.updatedAt = Date.now();
  await db.put("rooms", room);
  if (room.kind === "session") {
    const project = await getRoom(room.projectId);
    if (project) await db.put("rooms", Object.assign(project, { updatedAt: room.updatedAt }));
  }
  emit("rooms");
}

export async function getMeta(key, fallback = null) { return (await db.get("meta", key))?.value ?? fallback; }
export const setMeta = (key, value) => db.put("meta", { key, value });
export const delMeta = key => db.del("meta", key);

// The log keeps what happened, not what was said.
export async function log(kind, text, roomId = null) {
  await db.put("activity", { id: db.uid("a"), at: db.tick(), kind, text, roomId });
  emit("activity");
}

/* ------------------------------------------------------------ Sessions */
export const sessionsOf = async projectId =>
  (await db.all("rooms")).filter(r => r.kind === "session" && r.projectId === projectId).sort((a, b) => b.updatedAt - a.updatedAt);

export async function newSession(projectId) {
  // Still untitled means nothing was ever sent in it (the first message names it), so reuse it rather than pile up blank ones.
  const unused = (await sessionsOf(projectId)).find(s => s.auto && s.name === NEW_TITLE);
  if (unused) return unused;
  const now = Date.now();
  const room = await db.put("rooms", { id: db.uid("s"), kind: "session", projectId, name: NEW_TITLE, auto: true, createdAt: now, updatedAt: now });
  const project = await getRoom(projectId);
  if (project) await db.put("rooms", Object.assign(project, { updatedAt: now }));
  emit("rooms");
  return room;
}

export async function deleteSession(room) {
  await db.deleteRoom(room.id);
  await delMeta("draft:" + room.id);
  await log("project", `Deleted the conversation “${room.name}”.`);
  emit("rooms");
}

export async function deleteProject(project) {
  for (const s of await sessionsOf(project.id)) { await db.deleteRoom(s.id); await delMeta("draft:" + s.id); }
  await db.deleteRoom(project.id);
  await log("project", `Deleted the project “${project.name}”.`);
  emit("rooms");
}

export const roomHref = room => (room.kind === "main" ? "#/chat" : room.kind === "session" ? "#/c/" + room.id : "#/p/" + room.id);
// "Project › Conversation" for a session, so a list of conversations says where each one lives.
export const roomLabel = (room, rooms) => (room.kind === "main" ? "Conversation" : room.kind === "session" ? `${rooms.find(r => r.id === room.projectId)?.name ?? "Project"} › ${room.name}` : room.name);

// Projects used to hold one conversation of their own. Move any such thread into a session, once.
export async function migrateLegacy() {
  for (const project of (await db.all("rooms")).filter(r => r.kind === "project")) {
    if (!(await db.eventsIn(project.id, { limit: 1 })).length) continue;
    const session = (await db.all("rooms")).find(r => r.legacyOf === project.id)
      || await db.put("rooms", { id: db.uid("s"), kind: "session", projectId: project.id, name: "Earlier conversation", auto: false, legacyOf: project.id, createdAt: project.createdAt, updatedAt: project.updatedAt });
    for (const kind of ["events", "files"]) for (const r of await db.inRoom(kind, project.id)) await db.put(kind, { ...r, roomId: session.id });
    const draft = await getMeta("draft:" + project.id);
    if (draft) { await setMeta("draft:" + session.id, draft); await delMeta("draft:" + project.id); }
  }
}
