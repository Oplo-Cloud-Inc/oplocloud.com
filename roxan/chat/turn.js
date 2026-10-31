/* One turn of the conversation: what the person wrote, what is sent for it, and
   what comes back.

   Each message is one request. Earlier turns go back as plain text, with a
   bracketed note after each reply saying what became of its proposals, so the
   model never has to guess whether something was approved. Pictures and PDFs go
   with the newest message only, and text attachments with the last two; older
   ones are named and left out. */
import * as db from "./db.js";
import * as api from "./api.js";
import * as memory from "./memory.js";
import * as proposals from "./proposals.js";
import { blobToBase64 } from "./files.js";
import { touch, log, learning, NEW_TITLE } from "./store.js";
import { emit } from "./dom.js";

const WINDOW = 60;               // events looked at
const CHARS = 60_000;            // of history text sent
const RECENT = 2;                // user messages whose text attachments still go along
const SPECIALTIES = 30;          // named to Roxan with each message; the few that fit it also carry their steps
const WITH_STEPS = 3;
const clean = s => String(s).replace(/["\r\n]+/g, "'");
const where = r => (r.kind === "main" ? "the conversation" : `the conversation “${r.name}”`);
const clip = (s, n = 48) => { const t = s.replace(/\s+/g, " ").trim(); return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "") + "…"; };

const nowText = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

async function userContent(e, recent, newest) {
  const parts = [];
  const notes = [];
  let text = e.text || "";
  for (const f of e.files || []) {
    const rec = await db.get("files", f.id);
    if (!rec) notes.push(`[Attached ${clean(f.name)}, which is no longer stored.]`);
    else if (rec.kind === "text" && recent) text += `\n\n<attachment name="${clean(f.name)}"${rec.truncated ? ' note="only the start of the file is shown"' : ""}>\n${rec.text}\n</attachment>`;
    else if (rec.kind !== "text" && newest) parts.push(rec.kind === "image" ? { type: "image", media_type: rec.type, data: await blobToBase64(rec.blob) } : { type: "pdf", name: clean(f.name), data: await blobToBase64(rec.blob) });
    else notes.push(`[Attached earlier: ${clean(f.name)}. It is not shown again.]`);
  }
  if (notes.length) text += (text ? "\n\n" : "") + notes.join("\n");
  parts.push({ type: "text", text: text.trim() || "[Sent with no message.]" });
  return parts;
}

// The specialties that are on, best fit to what was said first. Steps go only with the few that fit.
async function specialtiesFor(query) {
  const q = new Set(memory.words(query));
  const fit = s => memory.words(`${s.name} ${s.when}`).filter(w => q.has(w)).length;
  return (await db.all("specialties")).filter(s => !s.deleted && s.on !== false)
    .map(s => ({ s, n: fit(s) })).sort((a, b) => b.n - a.n || b.s.updatedAt - a.s.updatedAt).slice(0, SPECIALTIES)
    .map(({ s, n }, i) => ({ id: s.id, name: s.name, when: s.when, steps: n > 0 && i < WITH_STEPS ? s.steps : [] }));
}

// { messages, context } is the body that is sent. `local` stays here: which notes went, and what learning may rest on.
export async function buildBody(room) {
  const events = await db.eventsIn(room.id, { limit: WINDOW });
  const memories = await db.all("memories");
  const users = events.flatMap((e, i) => (e.kind === "user" ? [i] : []));
  const recent = new Set(users.slice(-RECENT)), newest = users.at(-1);
  const messages = [];
  for (const [i, e] of events.entries()) {
    if (e.kind === "user") messages.push({ role: "user", content: await userContent(e, recent.has(i), i === newest) });
    else if (e.kind === "assistant") { if (e.text.trim()) messages.push({ role: "assistant", content: e.text }); }
    else if (e.kind === "proposal") {
      const line = proposals.note(e, memories), prev = messages.at(-1);
      if (prev?.role === "assistant") prev.content += "\n\n" + line; else messages.push({ role: "assistant", content: line });
    }
  }
  const size = m => (typeof m.content === "string" ? m.content.length : m.content.reduce((n, p) => n + (p.text?.length || 0), 0));
  let total = messages.reduce((n, m) => n + size(m), 0);
  while (messages.length > 1 && (total > CHARS || messages[0].role !== "user")) total -= size(messages.shift());

  const lastUser = events.filter(e => e.kind === "user").at(-1);
  const last = lastUser?.text || "";
  const near = events.slice(-6).map(e => e.text || "").join(" ");
  const notes = memory.pick(memories, last + " " + near);
  const project = room.kind === "session" ? await db.get("rooms", room.projectId) : null;
  const on = await learning();
  return {
    messages,
    context: {
      now: nowText(),
      tz: zone(),
      memories: notes.map(m => ({ id: m.id, text: m.text, about: m.about })),
      specialties: await specialtiesFor(last + " " + near),
      learning: on,
      project: project ? { name: project.name, instructions: project.instructions } : undefined,
    },
    local: {
      used: notes.map(m => m.id),
      ctx: { learning: on, said: last, recent: events.filter(e => e.kind === "user").slice(-6).map(e => e.text || "").join(" "), files: Boolean(lastUser?.files?.length), kept: 0 },
    },
  };
}

// Streams a reply to the newest user message. Hooks: onAssistant(ev), onDelta(ev), onProposal(ev), onNote(ev).
export async function run(room, invite, signal, hooks) {
  const { local, ...body } = await buildBody(room);
  const a = { id: db.uid("e"), roomId: room.id, at: db.tick(), kind: "assistant", text: "", status: "streaming", used: local.used };
  hooks.onAssistant(a);
  const tools = [], notices = [];
  let failure = null;
  try {
    await api.stream(body, invite, signal, ev => {
      if (ev.type === "delta") { a.text += ev.text; hooks.onDelta(a); }
      else if (ev.type === "tool") tools.push(ev);
      else if (ev.type === "notice") notices.push(ev.text);
      else if (ev.type === "done") { a.usage = ev.usage; a.stop = ev.stop; }
      else if (ev.type === "error") failure = { code: ev.code, message: ev.message };
    });
  } catch (e) {
    if (e.name === "AbortError") a.status = "stopped";
    else failure = { code: e.code || "error", message: e.message || "Something went wrong." };
  }
  if (!failure && a.status === "streaming") a.status = a.stop === "max_tokens" ? "cutoff" : "done";
  if (failure) a.status = "error";
  hooks.onDelta(a);
  if (a.text.trim()) await db.put("events", a);
  hooks.onSettled(a);

  if (a.status === "done" || a.status === "cutoff") {
    for (const t of tools) {
      const ev = await proposals.create(room.id, t.name, t.input, local.ctx);
      if (ev) hooks.onProposal(ev);
    }
    for (const text of notices) await note(room, hooks, { text, tone: "notice" });
  }
  if (a.status === "cutoff") await note(room, hooks, { text: "That reply was cut off because it ran long. Ask it to continue.", tone: "notice" });
  if (failure) await note(room, hooks, { text: failure.message, tone: "error", retry: !["invite", "declined"].includes(failure.code), code: failure.code });
  await touch(room);
  const tokens = a.usage ? ` (${a.usage.in.toLocaleString()} tokens in, ${a.usage.out.toLocaleString()} out)` : "";
  await log("reply", failure ? `The reply in ${where(room)} failed: ${failure.message}` : a.status === "stopped" ? `You stopped a reply in ${where(room)}.` : `Roxan replied in ${where(room)}${tokens}.`, room.id);
  return { assistant: a, failure };
}

async function note(room, hooks, n) {
  const ev = { id: db.uid("e"), roomId: room.id, at: db.tick(), kind: "note", ...n };
  await db.put("events", ev);
  hooks.onNote(ev);
}

export async function send(room, invite, text, prepared, signal, hooks) {
  await proposals.supersede(room.id);
  const ev = { id: db.uid("e"), roomId: room.id, at: db.tick(), kind: "user", text, files: [] };
  for (const f of prepared) {
    const rec = { id: db.uid("f"), roomId: room.id, eventId: ev.id, ...f };
    await db.put("files", rec);
    ev.files.push({ id: rec.id, name: f.name, kind: f.kind, size: f.size });
  }
  await db.put("events", ev);
  if (room.kind === "session" && room.auto && room.name === NEW_TITLE) room.name = clip(text) || ev.files[0]?.name || NEW_TITLE;       // the first message names the conversation until you rename it
  await touch(room);
  await log("message", `You wrote in ${where(room)}${ev.files.length ? `, with ${ev.files.length} attachment${ev.files.length > 1 ? "s" : ""}` : ""}.`, room.id);
  hooks.onUser(ev);
  return run(room, invite, signal, hooks);
}

// Run the last turn again: drop what came after the last user message, then ask again.
export async function retry(room, invite, signal, hooks) {
  const events = await db.eventsIn(room.id, { limit: 12 });
  const at = events.map(e => e.kind).lastIndexOf("user");
  for (const e of events.slice(at + 1)) await db.del("events", e.id);
  emit("retrying");
  return run(room, invite, signal, hooks);
}
