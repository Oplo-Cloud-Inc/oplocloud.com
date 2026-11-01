/* The parts the pages are built from: a button that asks twice, the card for
   something waiting on a yes, a question with answers, a progress line. Pages
   compose these; none of them reaches for the network except to answer a card. */
import { h, emit, clock, when, ago } from "./dom.js";
import * as api from "./api.js";
import { apply, S } from "./state.js";

// Redraw once however many changes arrive in a row.
export function soon(fn) {
  let queued = false;
  return (...a) => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; fn(...a); }); };
}

export const toast = (text, extra = {}) => emit("toast", { text, ...extra });
export const fail = e => { if (e?.name !== "AbortError") toast(e?.message || "Something went wrong. Try again.", { tone: "error" }); };

/* Changes to what Roxan keeps. Each one is applied to the page at once from the answer, so a page without
   its live connection is still right; the connection, when there is one, says the same thing again. */
export async function make(kind, input) { const { item } = await api.post("/items", { kind, ...input }); apply({ t: "item", item }); return item; }
export async function edit(id, patch) { const { item } = await api.patch(`/items/${id}`, patch); apply({ t: "item", item }); return item; }
export async function drop(id) { await api.del(`/items/${id}`); apply({ t: "gone", id }); }
export async function take(id) { const r = await api.post(`/items/${id}/take`); apply({ t: "item", item: r.idea }); apply({ t: "item", item: r.goal }); return r.goal; }
export async function markSeen() { await api.post("/seen"); apply({ t: "seen", seen: Date.now() }); }
export async function saveSettings(patch) { const { settings } = await api.put("/settings", patch); apply({ t: "settings", settings }); return settings; }

// Runs an action with its button off, and says so if it fails.
export async function busy(btn, fn) {
  if (btn?.disabled) return;
  if (btn) btn.disabled = true;
  try { return await fn(); } catch (e) { fail(e); } finally { if (btn) btn.disabled = false; }
}

// A button that does nothing the first time: it asks, for a few seconds, and the second press goes ahead.
export function sure(label, onconfirm, { confirm = "Press again to confirm", cls = "act-btn" } = {}) {
  let t = 0;
  const b = h("button", { class: cls, type: "button", text: label });
  const reset = () => { clearTimeout(t); t = 0; b.textContent = label; delete b.dataset.armed; };
  b.addEventListener("click", () => {
    if (!t) { b.textContent = confirm; b.dataset.armed = "1"; t = setTimeout(reset, 4500); return; }
    reset();
    onconfirm(b);
  });
  return b;
}

export const tag = (text, cls = "") => h("span", { class: `tag ${cls}`.trim(), text });
export const soonTag = () => h("span", { class: "tag next", text: "Next", title: "Not built yet" });
export const progress = (done, total, label) => h("progress", { value: done, max: Math.max(1, total), "aria-label": label });
export const stamp = ms => (new Date(ms).toDateString() === new Date().toDateString() ? clock(ms) : when(ms));
export const empty = (title, text, ...kids) => h("div", { class: "none-box" }, h("p", { class: "none-title", text: title }), text ? h("p", { class: "fine", text }) : null, ...kids);

export const check = (label, checked, onchange) => {
  const box = h("input", { type: "checkbox", checked });
  box.addEventListener("change", () => onchange(box.checked, box));
  return h("label", { class: "check" }, box, h("span", { text: label }));
};

export const pick = (options, value, props = {}) => {
  const el = h("select", props, options.map(([v, label]) => h("option", { value: v, text: label })));
  el.value = value;
  return el;
};

export async function copy(btn, text) {
  const was = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; } catch { btn.textContent = "Not copied"; }
  setTimeout(() => { btn.textContent = was; }, 1600);
}

/* ------------------------------------------------------------ what waits for a yes */

const WORDS = { awaiting: "Waiting for you", approved: "Done", declined: "Declined", expired: "Expired", answered: "Answered" };
const WHY = { "Roxan's default.": "It asks before this by default.", "Your rule.": "A rule of yours says to ask." };

// The thing Roxan wants to do, and the two ways to answer. Once answered, the same card says what happened.
export function approvalCard(ap) {
  const open = ap.state === "awaiting";
  const decide = (decision, btn) => busy(btn, async () => {
    const { approval } = await api.post(`/approvals/${ap.id}`, { decision });
    apply({ t: "item", item: approval });
    if (decision === "approve") toast(approval.result || "Done.");
  });
  const yes = h("button", { class: "btn sm", type: "button", text: "Approve" }), no = h("button", { class: "btn sm ghost", type: "button", text: "Decline" });
  yes.addEventListener("click", () => decide("approve", yes));
  no.addEventListener("click", () => decide("decline", no));
  return h("article", { class: "act", data: { state: open ? "awaiting" : ap.state === "approved" ? "done" : ap.state, id: ap.id } },
    h("header", null, h("span", { class: "label", text: open ? "Needs your OK" : "Asked you" }), h("span", { class: "state", text: WORDS[ap.state] || ap.state })),
    h("p", { class: "title", text: ap.title }),
    open && ap.why ? h("p", { class: "why", text: WHY[ap.why] || ap.why }) : null,
    open ? h("p", { class: "why", text: `Nothing has happened yet. It expires ${when(ap.due)}.` }) : ap.result ? h("p", { class: "why", text: ap.result }) : null,
    open ? h("div", { class: "btns" }, yes, no) : null);
}

// A question Roxan cannot go on without. A tap or a sentence answers it, and the answer is the next message.
export function questionCard(q) {
  const open = q.state === "awaiting";
  const answer = async (text, btn) => busy(btn, async () => {
    const r = await api.post(`/questions/${q.id}`, { answer: text });
    apply({ t: "item", item: { ...q, state: "answered", answer: text } });
    apply({ t: "msg", message: r.message });
    apply({ t: "msg", message: r.reply });
  });
  const input = h("input", { type: "text", maxlength: "2000", "aria-label": "Your answer", placeholder: "Or write your own answer" });
  const send = h("button", { class: "btn sm", type: "submit", text: "Answer" });
  const form = h("form", { class: "inline ask-row" }, input, send);
  form.addEventListener("submit", e => { e.preventDefault(); if (input.value.trim()) answer(input.value.trim(), send); });
  return h("article", { class: "act", data: { state: open ? "awaiting" : "done", id: q.id } },
    h("header", null, h("span", { class: "label", text: "A question" }), h("span", { class: "state", text: WORDS[q.state] || q.state })),
    h("p", { class: "title", text: q.title }),
    open && q.options?.length ? h("div", { class: "btns" }, q.options.map(o => { const b = h("button", { class: "btn sm ghost", type: "button", text: o }); b.addEventListener("click", () => answer(o, b)); return b; })) : null,
    open ? form : h("p", { class: "why", text: `You said: ${q.answer || "…"}` }));
}

export const needCard = it => (it.kind === "approval" ? approvalCard(it) : questionCard(it));

/* ------------------------------------------------------------ small reads */

// What each line of the activity log is about, in one or two words.
export const KIND = { run: "Ran", step: "Did", held: "Held back", approval: "Asked", question: "Asked", notify: "Told you", error: "Problem", settings: "Setting", goal: "Goal", routine: "Routine", memory: "Memory", panel: "Panel", idea: "Idea", handoff: "Handoff", specialty: "Specialty", rule: "Rule", project: "Project", vault: "Vault" };

// How Roxan sounds; chosen when you meet it and in Settings.
export const TONES = [["direct", "Direct", "Short and plain. Says what it did and what it needs."], ["warm", "Warm", "Friendly and encouraging, still brief."], ["formal", "Formal", "Measured and professional."]];

// One line of the log: when, what about, what happened.
export const logRow = e => h("div", { class: "row log" }, h("span", { class: "row-when", text: stamp(e.at) }), tag(KIND[e.kind] || e.kind), h("div", { class: "row-main", text: e.text }));

// "2 of 5 steps" for a goal.
export const stepsLine = g => { const n = g.steps?.length || 0, d = g.steps?.filter(s => s.done).length || 0; return n ? `${d} of ${n} step${n === 1 ? "" : "s"}` : "No plan yet"; };

export const usageLine = () => `${S.usage.chat || 0} of ${S.limits.chat} messages and ${S.usage.runs || 0} of ${S.limits.runs} background runs today`;

export { ago, when };
