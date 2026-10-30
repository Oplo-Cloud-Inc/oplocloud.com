/* The card for each proposal. It is drawn from the proposal's state, so a card
   is always an honest picture of what has happened: waiting, done, declined. */
import { h, when, toLocalInput } from "./dom.js";
import * as proposals from "./proposals.js";
import * as remind from "./remind.js";

const STATE = { awaiting: "Waiting for you", done: "Done", declined: "Declined", superseded: "Not approved", expired: "Expired", failed: "Did not work" };
const KIND = { forget_memory: "Forget a note", set_reminder: "Reminder" };
const WHY = {
  superseded: "You wrote again before answering, so this was not approved.",
  expired: "It was not answered in time, so it was not approved.",
  awaiting: "Roxan proposed this. Nothing happens until you approve it.",
};

// Applies the person's answer; shows why if it could not be applied.
async function answer(ev, action, read, err) {
  err.textContent = "";
  const res = await proposals.resolve(ev.id, ev.nonce, action, action === "approve" ? read() : {});
  if (!res.ok) err.textContent = res.message || "That did not work.";
}

function buttons(ev, read, err, yes, no) {
  const approve = h("button", { class: "btn sm", type: "button", "data-approve": "", text: yes });
  const decline = h("button", { class: "btn sm ghost", type: "button", "data-decline": "", text: no });
  approve.addEventListener("click", () => {
    if (ev.tool === "set_reminder") remind.askPermission();            // must start from this click
    approve.disabled = decline.disabled = true;
    answer(ev, "approve", read, err).finally(() => { approve.disabled = decline.disabled = false; });
  });
  decline.addEventListener("click", () => {
    approve.disabled = decline.disabled = true;
    answer(ev, "decline", read, err).finally(() => { approve.disabled = decline.disabled = false; });
  });
  return h("div", { class: "btns" }, approve, decline);
}

function memory(ev) {
  const state = ev.state === "awaiting" ? "proposed" : ev.state === "done" ? "kept" : "dismissed";
  const el = h("div", { class: "mem", role: "group", "aria-label": "Memory suggestion", data: { state, id: ev.id } });
  if (ev.state !== "awaiting") {
    el.append(h("span", { class: "label", text: ev.state === "done" ? "Remembered" : STATE[ev.state] }), h("span", { class: "what", text: ev.input.text }));
    if (WHY[ev.state]) el.append(h("span", { class: "fine", text: WHY[ev.state] }));
    return el;
  }
  const what = h("input", { class: "what", value: ev.input.text, maxlength: 300, "aria-label": "What to remember" });
  const err = h("p", { class: "err", role: "alert" });
  el.append(h("span", { class: "label", text: "Remember this?" }), what, buttons(ev, () => ({ text: what.value }), err, "Remember", "Dismiss"), err);
  return el;
}

function row(dt, dd) { return [h("dt", { text: dt }), h("dd", null, dd)]; }

function action(ev, notes) {
  const kind = KIND[ev.tool];
  const el = h("article", { class: "act", "aria-label": kind, data: { state: ev.state, id: ev.id } });
  el.append(h("header", null, h("span", { class: "label", text: kind }), h("span", { class: "state", text: STATE[ev.state] })));
  const awaiting = ev.state === "awaiting";
  const err = h("p", { class: "err", role: "alert" });

  if (ev.tool === "forget_memory") {
    const text = notes.find(m => m.id === ev.input.id)?.text ?? "A note that is no longer there";
    el.append(h("p", { class: "title", text: awaiting ? "Forget this note?" : ev.state === "done" ? "Forgotten" : "Not forgotten" }), h("dl", null, row("Note", text)));
    if (awaiting) el.append(h("p", { class: "why", text: WHY.awaiting }), buttons(ev, () => ({}), err, "Forget it", "Keep it"), err);
  } else {
    const title = awaiting ? h("input", { value: ev.input.title, maxlength: 140, "aria-label": "What to be reminded of" }) : ev.input.title;
    const at = awaiting ? h("input", { type: "datetime-local", value: ev.input.when, min: toLocalInput(Date.now()), "aria-label": "When" }) : when(Date.parse(ev.input.when));
    el.append(h("p", { class: "title", text: awaiting ? "Set this reminder?" : ev.state === "done" ? "Reminder set" : "Reminder not set" }), h("dl", null, row("What", title), row("When", at)));
    if (awaiting) el.append(h("p", { class: "why", text: WHY.awaiting + " Reminders appear only while Roxan is open." }), buttons(ev, () => ({ title: title.value, when: at.value }), err, "Approve", "Decline"), err);
  }
  if (!awaiting) el.append(h("p", { class: "why", text: (ev.state === "done" && ev.result?.message) || WHY[ev.state] || ev.result?.message || "" }));
  return el;
}

export const card = (ev, notes = []) => (ev.tool === "save_memory" ? memory(ev) : action(ev, notes));
