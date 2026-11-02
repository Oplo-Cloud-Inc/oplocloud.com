/* Routines: work Roxan does without being asked, at a time you choose. A
   reminder just tells you. A routine carries out an instruction on a schedule.
   A watch checks a web page and acts when it changes.

   They run on Roxan's side, so they run with this page closed. What a run does
   is limited by Access, and everything it does is in Activity. */
import { h, fill, section, toLocalInput } from "../dom.js";
import * as api from "../api.js";
import { S, watch } from "../state.js";
import { describe, WD } from "../when.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, empty, make, edit, drop, pick, ago, when } from "../ui.js";
import { Button, Drawer, Field, RadioGroup, NumberField, DatePicker, Checkbox } from "../kit/index.js";

const MODE = { remind: "Reminder", run: "Routine", watch: "Watching" };
const KINDS = [["once", "Once"], ["daily", "Every day"], ["every", "Every few hours"]];
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

// The form for a new routine, in a drawer. It starts from nothing each time it opens.
function newRoutine() {
  const mode = RadioGroup({ label: "What kind", value: "remind", card: true, options: [
    { value: "remind", label: "Reminder", hint: "Tells you, at the time you choose." },
    { value: "run", label: "Routine", hint: "Does what you wrote, on a schedule." },
    { value: "watch", label: "Watch", hint: "Checks a web page and acts when it changes." }] });
  const title = h("input", { type: "text", maxlength: "100", "aria-label": "Name", placeholder: "Call the dentist" });
  const what = h("textarea", { class: "field", rows: "4", maxlength: "2000", "aria-label": "What to do each time", placeholder: "Write it so a stranger could carry it out, including what is worth telling you." });
  const url = h("input", { type: "url", maxlength: "500", "aria-label": "Page to watch", placeholder: "https://example.com/pricing" });
  const kind = pick(KINDS, "once", { "aria-label": "How often" });
  const [d0, t0] = toLocalInput(Date.now() + 3600_000).split("T");
  const atDate = DatePicker({ value: d0, min: toLocalInput(Date.now()).slice(0, 10), label: "Day" });
  const atTime = h("input", { type: "time", "aria-label": "Time", value: t0 });
  const time = h("input", { type: "time", "aria-label": "Time of day", value: "08:00" });
  const days = WD.map((d, n) => ({ n, box: Checkbox({ label: d }) }));
  const hours = NumberField({ min: 1, max: 168, value: 6, "aria-label": "Hours between runs" });
  const err = h("p", { class: "err", role: "alert" });
  const add = Button({ type: "submit" }, "Save");
  let drawer;

  const f = {
    what: Field({ label: "What to do", hint: "Each run reads this, does it, and tells you only if it matters." }, what),
    url: Field({ label: "Page", hint: "A public page. Roxan checks it and acts when it changes." }, url),
    at: Field({ label: "When" }, h("div", { class: "k-pair" }, atDate, atTime)),
    time: Field({ label: "Time of day" }, time),
    days: h("div", { class: "fld" }, h("span", { class: "label", text: "On these days (none means every day)" }), h("div", { class: "weekdays" }, days.map(d => d.box))),
    hours: Field({ label: "Hours between runs" }, hours),
  };
  const shape = () => {
    const watching = mode.value === "watch";
    kind.setOptions(KINDS.filter(([v]) => !(watching && v === "once")).map(([value, label]) => ({ value, label })));
    if (watching && kind.value === "once") kind.value = "daily";
    f.what.hidden = mode.value === "remind";
    f.url.hidden = !watching;
    f.at.hidden = kind.value !== "once"; f.time.hidden = f.days.hidden = kind.value !== "daily"; f.hours.hidden = kind.value !== "every";
    title.placeholder = mode.value === "remind" ? "Call the dentist" : watching ? "Price of the standing desk" : "Morning summary";
  };
  const form = h("form", { class: "pform" }, mode, Field({ label: "Name" }, title), f.what, f.url, Field({ label: "How often" }, kind), f.at, f.time, f.days, f.hours,
    h("p", { class: "fine", text: `Times are in ${S.settings.tz}. Change that in Settings.` }), err,
    h("div", { class: "btns" }, add, Button({ variant: "secondary", type: "button", onclick: () => drawer.close() }, "Cancel")));
  mode.addEventListener("change", shape); kind.addEventListener("change", shape);
  shape();

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cardish(title.value + what.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    if (kind.value === "once" && !atDate.value) { err.textContent = "Pick a day."; return; }
    const w = kind.value === "once" ? { kind: "once", at: `${atDate.value}T${atTime.value}` } : kind.value === "daily" ? { kind: "daily", time: time.value, days: days.filter(d => d.box.value).map(d => d.n) } : { kind: "every", hours: hours.value };
    busy(add, async () => {
      err.textContent = "";
      try { await make("routine", { mode: mode.value, title: title.value.trim(), instruction: what.value.trim(), url: mode.value === "watch" ? url.value.trim() : undefined, when: w }); drawer.close(); }
      catch (x) { err.textContent = x.message; }
    });
  });
  drawer = Drawer({ title: "New routine", description: "Roxan does this without being asked.", body: form, focus: () => title });
}

export async function mount(root) {
  const row = r => {
    const live = r.state === "active";
    const sub = [
      r.mode === "watch" ? `Watching ${host(r.url)}` : null, describe(r.schedule, S.settings.tz),
      live && r.due ? `Next: ${when(r.due)}` : null,
      r.pausedBy === "failures" ? "Paused after three failed runs" : null,
    ].filter(Boolean).join(". ");
    const act = (label, ic, fn) => { const b = Button({ variant: "secondary", size: "sm", icon: ic, onclick: () => busy(b, fn) }, label); return b; };
    return h("div", { class: "row routine", data: { id: r.id } },
      h("div", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub about", text: sub }),
        r.last ? h("span", { class: "row-sub about", text: `${r.last.ok ? "Last run" : "Last run did not finish"} ${ago(r.last.at)}${r.last.summary ? `: ${r.last.summary}` : ""}` }) : null),
      tag(MODE[r.mode] || r.mode),
      h("div", { class: "row-acts" },
        live || r.state === "paused" ? act(live ? "Pause" : "Resume", live ? "pause" : "play", () => edit(r.id, { state: live ? "paused" : "active" })) : null,
        live && r.mode !== "remind" ? act("Run now", "refresh", () => api.post(`/items/${r.id}/run`)) : null,
        sure("Remove", b => busy(b, () => drop(r.id)))));
  };

  const list = h("div");
  const draw = () => {
    const by = s => S.routines.filter(r => r.state === s).sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity));
    const parts = [["Running", by("active")], ["Paused", by("paused")], ["Finished", by("done")]].filter(([, l]) => l.length);
    fill(list, parts.length ? parts.map(([label, l]) => section(`${label} (${l.length})`, null, l.map(row)))
      : empty("Nothing is scheduled.", "Ask Roxan in a chat (“Remind me on Friday to send the invoice”) or add one here."));
  };
  draw();
  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Routines." }),
    h("p", { class: "page-lead", text: "Work Roxan does without being asked, when you said. A reminder tells you. A routine does what you wrote on a schedule. A watch checks a page and acts when it changes." }),
    h("p", { class: "fine", text: "Routines run on Roxan's servers, so they run while this page is closed. One at a time, and at most 30 a day. If one fails three times in a row it pauses and tells you." }),
    h("div", { class: "page-act" }, Button({ icon: "plus", onclick: newRoutine }, "New routine")), list));
  return watch("routines", soon(draw));
}
