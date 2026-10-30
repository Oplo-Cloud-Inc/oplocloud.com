/* What Roxan proposes, and what happens to it.

   A proposal is a card with a state: awaiting, done, declined, superseded,
   expired or failed. Nothing runs until a person presses Approve on the card as
   it is shown. What they approve is what is on the card at that moment, edits
   included. Each card carries a nonce, so an approval for a card that has since
   changed (another tab, an expiry) is turned away instead of applied. */
import * as db from "./db.js";
import { emit, when } from "./dom.js";
import { log } from "./store.js";
import * as memory from "./memory.js";

const TTL = 24 * 3600 * 1000;
const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export class Invalid extends Error {}      // the card stays open so it can be fixed

const localMs = s => { const t = Date.parse(s); return Number.isNaN(t) ? NaN : t; };       // "2026-10-31T09:00" is local time

export function describe(ev, memories = []) {
  const { tool, input } = ev;
  if (tool === "save_memory") return `remember “${input.text}”`;
  if (tool === "forget_memory") return `forget “${memories.find(m => m.id === input.id)?.text ?? "a note"}”`;
  return `a reminder “${input.title}” for ${when(localMs(input.when))}`;
}

const save = async ev => { await db.put("events", ev); emit("proposal", ev); return ev; };

export async function create(roomId, tool, input) {
  const memories = await db.all("memories");
  if (tool === "save_memory") {
    const known = memory.status(input.text, memories);
    if (known) {
      await log("memory", known === "known" ? `Roxan suggested something you already have: “${input.text}”. Not shown again.` : `Roxan suggested something you removed before: “${input.text}”. Not shown again.`, roomId);
      return null;
    }
  }
  if (tool === "forget_memory" && !memories.some(m => m.id === input.id && !m.deleted)) return null;
  const ev = { id: db.uid("e"), roomId, at: db.tick(), kind: "proposal", tool, input, state: "awaiting", nonce: db.uid("n"), expiresAt: Date.now() + TTL };
  await save(ev);
  await log("proposal", `Roxan proposed ${describe(ev, memories)}.`, roomId);
  return ev;
}

const RUN = {
  async save_memory(ev, input) {
    const text = clean(input.text, 300);
    if (!text) throw new Invalid("Write what to remember.");
    const memories = await db.all("memories");
    if (memory.status(text, memories) === "known") return { message: "Already remembered." };
    const m = { id: db.uid("m"), text, pinned: false, createdAt: Date.now(), updatedAt: Date.now(), expiresAt: null, source: { roomId: ev.roomId, eventId: ev.id } };
    await db.put("memories", m);
    emit("memories");
    await log("memory", `Remembered “${text}”.`, ev.roomId);
    return { message: "Remembered.", memoryId: m.id };
  },
  async forget_memory(ev, input) {
    const m = await db.get("memories", input.id);
    if (!m || m.deleted) return { message: "That note was already gone." };
    await db.put("memories", { ...m, deleted: true, deletedAt: Date.now(), reason: "forgotten" });
    emit("memories");
    await log("memory", `Forgot “${m.text}”.`, ev.roomId);
    return { message: "Forgotten." };
  },
  async set_reminder(ev, input) {
    const title = clean(input.title, 140);
    if (!title) throw new Invalid("Say what the reminder is for.");
    const at = localMs(input.when);
    if (Number.isNaN(at)) throw new Invalid("Choose a date and time.");
    if (at < Date.now() + 30_000) throw new Invalid("Choose a time in the future.");
    const r = { id: db.uid("r"), title, at, createdAt: Date.now(), state: "scheduled", roomId: ev.roomId, eventId: ev.id };
    await db.put("reminders", r);
    emit("reminders");
    await log("reminder", `Set a reminder “${title}” for ${when(at)}.`, ev.roomId);
    return { message: `Reminder set for ${when(at)}.`, reminderId: r.id, at };
  },
};

// Approve or decline, with the values the person saw. Resolves to { ok, message?, ev }.
export async function resolve(id, nonce, action, edits = {}) {
  const ev = await db.get("events", id);
  if (!ev || ev.kind !== "proposal") return { ok: false, message: "That proposal is gone." };
  if (ev.state !== "awaiting" || ev.nonce !== nonce) return { ok: false, message: "This card changed, so nothing was applied. It is up to date now.", ev };
  if (Date.now() > ev.expiresAt) { ev.state = "expired"; await save(ev); return { ok: false, message: "This expired, so nothing was applied.", ev }; }

  if (action === "decline") {
    if (ev.tool === "save_memory") {                      // a refused suggestion is not suggested again
      await db.put("memories", { id: db.uid("m"), text: clean(ev.input.text, 300), deleted: true, deletedAt: Date.now(), reason: "dismissed", createdAt: Date.now(), updatedAt: Date.now() });
    }
    ev.state = "declined";
    ev.resolvedAt = Date.now();
    await save(ev);
    await log("decision", `Declined: ${describe(ev, await db.all("memories"))}.`, ev.roomId);
    return { ok: true, ev };
  }

  const input = { ...ev.input, ...edits };
  let result;
  try {
    result = await RUN[ev.tool](ev, input);
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, message: e.message, ev };
    ev.state = "failed";
    ev.result = { message: "That did not work, and nothing was changed." };
    await save(ev);
    return { ok: false, message: ev.result.message, ev };
  }
  ev.input = input;
  ev.state = "done";
  ev.result = result;
  ev.resolvedAt = Date.now();
  await save(ev);
  await log("decision", `Approved: ${describe(ev, await db.all("memories"))}.`, ev.roomId);
  return { ok: true, ev };
}

// Sending another message is not approving what is still waiting.
export async function supersede(roomId) {
  const open = (await db.all("events")).filter(e => e.roomId === roomId && e.kind === "proposal" && e.state === "awaiting");
  for (const ev of open) { ev.state = "superseded"; ev.resolvedAt = Date.now(); await save(ev); }
  if (open.length) await log("decision", `${open.length} proposal${open.length > 1 ? "s were" : " was"} not approved because you wrote again.`, roomId);
}

export async function expireStale() {
  const stale = (await db.all("events")).filter(e => e.kind === "proposal" && e.state === "awaiting" && e.expiresAt < Date.now());
  for (const ev of stale) { ev.state = "expired"; await save(ev); }
}

export const pending = async () => (await db.all("events")).filter(e => e.kind === "proposal" && e.state === "awaiting").sort((a, b) => b.at - a.at);

// The one line each proposal leaves for the model next time (the app speaks in square brackets).
export function note(ev, memories) {
  const what = describe(ev, memories);
  const end = { done: "the user approved it", declined: "the user declined it", superseded: "the user wrote again without approving it", expired: "it expired unanswered", failed: "it did not work", awaiting: "the user has not answered yet" }[ev.state];
  return `[Proposed ${what}: ${end}.]`;
}
