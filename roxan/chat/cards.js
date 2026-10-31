/* The card for each proposal. It is drawn from the proposal's state, so a card
   is always an honest picture of what has happened: waiting, done, declined,
   or kept straight away (with an Undo) because learning is on. */
import { h, when, toLocalInput } from "./dom.js";
import * as proposals from "./proposals.js";
import * as remind from "./remind.js";

const STATE = { awaiting: "Waiting for you", done: "Done", declined: "Declined", superseded: "Not approved", expired: "Expired", failed: "Did not work", undone: "Undone" };
const KIND = { forget_memory: "Forget a note", set_reminder: "Reminder", save_specialty: "Specialty", start_handoff: "Handoff" };
// A saved Handoff is not a finished one, so its card never says "Done".
const stateWord = ev => (ev.state !== "done" ? STATE[ev.state] : ev.tool === "start_handoff" ? "Saved" : ev.tool === "save_specialty" ? (ev.auto ? "Learned" : "Saved") : STATE.done);
const WHY = {
  superseded: "You wrote again before answering, so this was not approved.",
  expired: "It was not answered in time, so it was not approved.",
  awaiting: "Roxan proposed this. Nothing happens until you approve it.",
  undone: "You undid this, so it was taken back.",
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

// Takes back what learning kept straight away.
function undoButton(ev) {
  const b = h("button", { class: "act-btn", type: "button", "data-undo": "", text: "Undo" });
  b.addEventListener("click", async () => {
    b.disabled = true;
    const r = await proposals.undo(ev.id);
    if (!r.ok) { b.disabled = false; b.title = r.message; }
  });
  return b;
}

const aboutLine = ev => (ev.input.about?.length ? h("span", { class: "fine about", text: "About " + ev.input.about.join(", ") }) : null);

function memory(ev) {
  const state = ev.state === "awaiting" ? "proposed" : ev.state === "done" ? "kept" : "dismissed";
  const el = h("div", { class: "mem", role: "group", "aria-label": ev.auto ? "Learned note" : "Memory suggestion", data: { state, id: ev.id } });
  if (ev.auto) el.dataset.auto = "";
  if (ev.state !== "awaiting") {
    el.append(...[h("span", { class: "label", text: ev.state === "done" ? (ev.auto ? "Learned" : "Remembered") : STATE[ev.state] }), h("span", { class: "what", text: ev.input.text }), aboutLine(ev)].filter(Boolean));   // no names: aboutLine is null, and append would write the word "null"
    if (WHY[ev.state]) el.append(h("span", { class: "fine", text: WHY[ev.state] }));
    if (ev.state === "done" && ev.auto) el.append(undoButton(ev));
    return el;
  }
  const what = h("input", { class: "what", value: ev.input.text, maxlength: 300, "aria-label": "What to remember" });
  const err = h("p", { class: "err", role: "alert" });
  el.append(...[h("span", { class: "label", text: "Remember this?" }), what, aboutLine(ev), buttons(ev, () => ({ text: what.value }), err, "Remember", "Dismiss"), err].filter(Boolean));
  return el;
}

function row(dt, dd) { return [h("dt", { text: dt }), h("dd", null, dd)]; }
const steps = list => h("ol", { class: "steps" }, list.map(s => h("li", { text: s })));

/* One builder per tool: each adds its title, rows, explanation and buttons to the card. */
const BODY = {
  forget_memory(el, ev, notes, err) {
    const awaiting = ev.state === "awaiting";
    const text = notes.find(m => m.id === ev.input.id)?.text ?? "A note that is no longer there";
    el.append(h("p", { class: "title", text: awaiting ? "Forget this note?" : ev.state === "done" ? "Forgotten" : "Not forgotten" }), h("dl", null, row("Note", text)));
    if (awaiting) el.append(h("p", { class: "why", text: WHY.awaiting }), buttons(ev, () => ({}), err, "Forget it", "Keep it"), err);
  },
  set_reminder(el, ev, notes, err) {
    const awaiting = ev.state === "awaiting";
    const title = awaiting ? h("input", { value: ev.input.title, maxlength: 140, "aria-label": "What to be reminded of" }) : ev.input.title;
    const at = awaiting ? h("input", { type: "datetime-local", value: ev.input.when, min: toLocalInput(Date.now()), "aria-label": "When" }) : when(Date.parse(ev.input.when));
    el.append(h("p", { class: "title", text: awaiting ? "Set this reminder?" : ev.state === "done" ? "Reminder set" : "Reminder not set" }), h("dl", null, row("What", title), row("When", at)));
    if (awaiting) el.append(h("p", { class: "why", text: WHY.awaiting + " Reminders appear only while Roxan is open." }), buttons(ev, () => ({ title: title.value, when: at.value }), err, "Approve", "Decline"), err);
  },
  save_specialty(el, ev, notes, err) {
    const awaiting = ev.state === "awaiting", i = ev.input;
    if (awaiting) {
      const name = h("input", { value: i.name, maxlength: 60, "aria-label": "Name" });
      const use = h("input", { value: i.when, maxlength: 200, "aria-label": "Use when" });
      const lines = h("textarea", { class: "field", rows: "4", maxlength: "2400", "aria-label": "Steps, one to a line" });
      lines.value = i.steps.join("\n");
      el.append(h("p", { class: "title", text: "Save this specialty?" }), h("dl", null, row("Name", name), row("Use when", use), row("Steps", lines)),
        h("p", { class: "why", text: WHY.awaiting + " A specialty is a procedure Roxan follows each time a request fits it. It only writes; it does not act." }),
        buttons(ev, () => ({ name: name.value, when: use.value, steps: lines.value }), err, "Save specialty", "Dismiss"), err);
      return;
    }
    el.append(h("p", { class: "title", text: ev.state === "done" ? (ev.auto ? "Learned a specialty" : "Specialty saved") : ev.state === "undone" ? "Specialty taken back" : "Specialty not saved" }),
      h("dl", null, row("Name", i.name), row("Use when", i.when), row("Steps", steps(i.steps))));
    if (ev.state === "done") el.append(h("div", { class: "btns" }, h("a", { class: "go sm", href: "#/specialties" }, "Review in Specialties ", h("i", { "aria-hidden": "true" })), ev.auto ? undoButton(ev) : null));
  },
  start_handoff(el, ev, notes, err) {
    const awaiting = ev.state === "awaiting", i = ev.input;
    if (awaiting) {
      const title = h("input", { value: i.title, maxlength: 140, "aria-label": "What it is" });
      const task = h("textarea", { class: "field", rows: "3", maxlength: "600", "aria-label": "What needs doing" });
      task.value = i.task;
      const site = h("input", { value: i.site || "", maxlength: 120, placeholder: "Optional", "aria-label": "Website" });
      el.append(h("p", { class: "title", text: "Save this Handoff?" }), h("dl", null, row("What", title), row("Task", task), row("Website", site)),
        h("p", { class: "why", text: "Roxan cannot use a web browser, so this is a written task. Saving it does not run it: no computer is connected yet, so it waits in Handoff. Leave passwords and card numbers out; they belong in the Vault." }),
        buttons(ev, () => ({ title: title.value, task: task.value, site: site.value }), err, "Save Handoff", "Dismiss"), err);
      return;
    }
    el.append(h("p", { class: "title", text: ev.state === "done" ? "Saved to Handoff" : "Handoff not saved" }), h("dl", null, row("What", i.title), row("Task", i.task), i.site ? row("Website", i.site) : null));
    if (ev.state === "done") el.append(h("div", { class: "btns" }, h("a", { class: "go sm", href: "#/handoff/" + ev.result?.handoffId }, "Open it in Handoff ", h("i", { "aria-hidden": "true" }))));
  },
};

function action(ev, notes) {
  const kind = KIND[ev.tool];
  const el = h("article", { class: "act", "aria-label": kind, data: { state: ev.state, id: ev.id } });
  el.append(h("header", null, h("span", { class: "label", text: kind }), h("span", { class: "state", text: stateWord(ev) })));
  const err = h("p", { class: "err", role: "alert" });
  BODY[ev.tool](el, ev, notes, err);
  if (ev.state !== "awaiting") el.append(h("p", { class: "why", text: (ev.state === "done" && ev.result?.message) || WHY[ev.state] || ev.result?.message || "" }));
  return el;
}

export const card = (ev, notes = []) => (ev.tool === "save_memory" ? memory(ev) : action(ev, notes));
