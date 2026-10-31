/* What Roxan proposes, and what happens to it.

   A proposal is a card with a state: awaiting, done, declined, superseded,
   expired, failed or undone. By default nothing runs until a person presses
   Approve on the card as it is shown, edits included. Each card carries a nonce,
   so an approval for a card that has since changed (another tab, an expiry) is
   turned away instead of applied.

   The one exception is learning, which is on unless the person turned it off.
   Then a new note, or a specialty, is kept straight away, but only when it rests
   on what the person wrote themself in this conversation: no attachment came
   with the message, it shares a real word with what they wrote (or is about
   someone they named), it holds nothing sensitive, and no more than three are
   kept from one reply. Whatever is kept this way is shown under the reply with
   an Undo, and is logged. A Handoff is never kept without a yes. */
import * as db from "./db.js";
import { emit, when } from "./dom.js";
import { log, getMeta, setMeta, addHandoff } from "./store.js";
import * as memory from "./memory.js";
import { SENSITIVE, cardish } from "./sensitive.js";

const TTL = 24 * 3600 * 1000;
const AT_ONCE = 3;                                      // notes and specialties kept straight away from one reply
const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
// Steps come as a list, or as lines of text from a card; a pasted "1." or "-" in front is dropped.
export const stepsOf = x => (Array.isArray(x) ? x : String(x ?? "").split("\n")).map(s => clean(s, 200).replace(/^(?:\d+[.)]|[-•*])\s*/, "")).filter(Boolean).slice(0, 12);

export class Invalid extends Error {}      // the card stays open so it can be fixed

const localMs = s => { const t = Date.parse(s); return Number.isNaN(t) ? NaN : t; };       // "2026-10-31T09:00" is local time

export function describe(ev, memories = []) {
  const { tool, input } = ev;
  if (tool === "save_memory") return `remember “${input.text}”`;
  if (tool === "forget_memory") return `forget “${memories.find(m => m.id === input.id)?.text ?? "a note"}”`;
  if (tool === "save_specialty") return `a specialty “${input.name}”`;
  if (tool === "start_handoff") return `a Handoff “${input.title}”`;
  return `a reminder “${input.title}” for ${when(localMs(input.when))}`;
}

const save = async ev => { await db.put("events", ev); emit("proposal", ev); return ev; };

// A specialty with a similar name that is kept ("known") or was removed or dismissed before ("refused").
async function specialtyStatus(name) {
  const all = await db.all("specialties");
  if (all.some(s => !s.deleted && memory.similar(s.name, name))) return "known";
  if (all.some(s => s.deleted && memory.similar(s.name, name))) return "refused";
  return null;
}

// Learning keeps this straight away only if every condition in the file's first paragraph holds.
function keepsAtOnce(ev, ctx) {
  if (!ctx.learning || ctx.files || (ctx.kept || 0) >= AT_ONCE) return false;
  if (ev.tool === "save_memory") return memory.grounded(ev.input, ctx.said || "") && !SENSITIVE.test(ev.input.text);
  if (ev.tool === "save_specialty") {
    const text = [ev.input.name, ev.input.when, ...(ev.input.steps || [])].join(" ");
    return memory.grounded({ text }, ctx.recent || "") && !SENSITIVE.test(text);
  }
  return false;
}

async function firstLearned() {
  if (await getMeta("learning:told")) return;
  await setMeta("learning:told", Date.now());
  emit("toast", { sub: "Learning is on", text: "Roxan keeps short notes of what you tell it, on this device. Undo any of them in the chat, or see them all in Memory. You can turn learning off in Settings." });
}

// ctx: { learning, said, recent, files, kept } — what learning needs to decide; `kept` is counted up here.
export async function create(roomId, tool, input, ctx = {}) {
  const memories = await db.all("memories");
  if (tool === "save_memory") {
    const known = memory.status(input.text, memories);
    if (known) {
      await log("memory", known === "known" ? `Roxan suggested something you already have: “${input.text}”. Not shown again.` : `Roxan suggested something you removed before: “${input.text}”. Not shown again.`, roomId);
      return null;
    }
    input = { ...input, about: memory.aboutNames(input.about, memories) };       // spelled the way the web already spells them
  }
  if (tool === "save_specialty") {
    const known = await specialtyStatus(input.name);
    if (known) {
      await log("specialty", known === "known" ? `Roxan suggested a specialty you already have: “${input.name}”. Not shown again.` : `Roxan suggested a specialty you removed before: “${input.name}”. Not shown again.`, roomId);
      return null;
    }
  }
  if (tool === "forget_memory" && !memories.some(m => m.id === input.id && !m.deleted)) return null;
  const ev = { id: db.uid("e"), roomId, at: db.tick(), kind: "proposal", tool, input, state: "awaiting", nonce: db.uid("n"), expiresAt: Date.now() + TTL };
  await save(ev);
  await log("proposal", `Roxan proposed ${describe(ev, memories)}.`, roomId);
  if (keepsAtOnce(ev, ctx)) {
    const res = await resolve(ev.id, ev.nonce, "approve", {}, { auto: true });
    if (res.ok) {
      ctx.kept = (ctx.kept || 0) + 1;
      firstLearned();
      return res.ev;
    }
  }
  return ev;
}

const RUN = {
  async save_memory(ev, input) {
    const text = clean(input.text, 300);
    if (!text) throw new Invalid("Write what to remember.");
    const memories = await db.all("memories");
    if (memory.status(text, memories) === "known") return { message: "Already remembered." };
    const m = { id: db.uid("m"), text, about: memory.aboutNames(input.about, memories), pinned: false, createdAt: Date.now(), updatedAt: Date.now(), expiresAt: null, source: { roomId: ev.roomId, eventId: ev.id } };
    if (input.kind) m.kind = input.kind;
    if (ev.auto) m.auto = true;
    await db.put("memories", m);
    emit("memories");
    await log("memory", `${ev.auto ? "Learned" : "Remembered"} “${text}”.`, ev.roomId);
    return { message: ev.auto ? "Learned." : "Remembered.", memoryId: m.id };
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
  async save_specialty(ev, input) {
    const name = clean(input.name, 60), use = clean(input.when, 200), steps = stepsOf(input.steps);
    if (!name) throw new Invalid("Name the specialty.");
    if (!use) throw new Invalid("Say when to use it.");
    if (steps.length < 2) throw new Invalid("Write at least two steps, one to a line.");
    if (cardish([name, use, ...steps].join(" "))) throw new Invalid("That looks like a card number. Keep cards in the Vault and out of a specialty.");
    const all = await db.all("specialties");
    if (all.some(s => !s.deleted && memory.similar(s.name, name))) return { message: "You already have a specialty like that." };
    const s = { id: db.uid("sp"), name, when: use, steps, on: true, createdAt: Date.now(), updatedAt: Date.now(), source: { roomId: ev.roomId, eventId: ev.id } };
    if (ev.auto) s.auto = true;
    await db.put("specialties", s);
    emit("specialties");
    await log("specialty", `${ev.auto ? "Learned" : "Saved"} the specialty “${name}”.`, ev.roomId);
    return { message: ev.auto ? "Learned." : "Saved.", specialtyId: s.id };
  },
  async start_handoff(ev, input) {
    const title = clean(input.title, 140), task = clean(input.task, 600), site = clean(input.site, 120);
    if (!title) throw new Invalid("Say what the Handoff is.");
    if (!task) throw new Invalid("Write what needs doing.");
    if (cardish(`${title} ${task} ${site}`)) throw new Invalid("That looks like a card number. Keep cards in the Vault and leave them out of a Handoff.");
    const x = await addHandoff({ title, task, site, roomId: ev.roomId, eventId: ev.id });
    return { message: "Saved to Handoff. Nothing has run.", handoffId: x.id };
  },
};

// Approve or decline, with the values the person saw. Resolves to { ok, message?, ev }. how.auto: learning kept it, nobody pressed Approve.
export async function resolve(id, nonce, action, edits = {}, how = {}) {
  const ev = await db.get("events", id);
  if (!ev || ev.kind !== "proposal") return { ok: false, message: "That proposal is gone." };
  if (ev.state !== "awaiting" || ev.nonce !== nonce) return { ok: false, message: "This card changed, so nothing was applied. It is up to date now.", ev };
  if (Date.now() > ev.expiresAt) { ev.state = "expired"; await save(ev); return { ok: false, message: "This expired, so nothing was applied.", ev }; }

  if (action === "decline") {
    if (ev.tool === "save_memory") {                      // a refused suggestion is not suggested again
      await db.put("memories", { id: db.uid("m"), text: clean(ev.input.text, 300), deleted: true, deletedAt: Date.now(), reason: "dismissed", createdAt: Date.now(), updatedAt: Date.now() });
    }
    if (ev.tool === "save_specialty") {
      await db.put("specialties", { id: db.uid("sp"), name: clean(ev.input.name, 60), deleted: true, deletedAt: Date.now(), reason: "dismissed", createdAt: Date.now(), updatedAt: Date.now() });
    }
    ev.state = "declined";
    ev.resolvedAt = Date.now();
    await save(ev);
    await log("decision", `Declined: ${describe(ev, await db.all("memories"))}.`, ev.roomId);
    return { ok: true, ev };
  }

  const input = { ...ev.input, ...edits };
  if (how.auto) ev.auto = true;
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
  await log("decision", `${ev.auto ? "Kept straight away (learning is on)" : "Approved"}: ${describe(ev, await db.all("memories"))}.`, ev.roomId);
  return { ok: true, ev };
}

// Takes back something learning kept straight away. A note goes to Removed in Memory (and is not suggested again); a specialty is deleted.
export async function undo(id) {
  const ev = await db.get("events", id);
  if (!ev || ev.kind !== "proposal" || ev.state !== "done" || !ev.auto) return { ok: false, message: "That cannot be undone from here." };
  const now = Date.now();
  if (ev.tool === "save_memory") {
    const m = await db.get("memories", ev.result?.memoryId);
    if (m && !m.deleted) await db.put("memories", { ...m, deleted: true, deletedAt: now, updatedAt: now, reason: "undone" });
    emit("memories");
  } else if (ev.tool === "save_specialty") {
    const s = await db.get("specialties", ev.result?.specialtyId);
    if (s && !s.deleted) await db.put("specialties", { ...s, deleted: true, deletedAt: now, updatedAt: now, reason: "undone" });
    emit("specialties");
  }
  ev.state = "undone";
  ev.resolvedAt = now;
  await save(ev);
  await log("decision", `Undid: ${describe(ev, await db.all("memories"))}.`, ev.roomId);
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
  const kept = ev.auto ? "it was kept straight away because learning is on" : "the user approved it";
  const end = { done: kept, declined: "the user declined it", superseded: "the user wrote again without approving it", expired: "it expired unanswered", failed: "it did not work", awaiting: "the user has not answered yet", undone: "the user undid it" }[ev.state];
  return `[Proposed ${what}: ${end}.]`;
}
