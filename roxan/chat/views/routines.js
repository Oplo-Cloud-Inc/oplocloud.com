/* Routines: work Roxan does without being asked, at a time you choose. A
   reminder just tells you. A routine carries out an instruction on a schedule.
   A watch checks a web page and acts when it changes.

   They run on Roxan's side, so they run with this page closed. What a run does
   is limited by Access, and everything it does is in Activity. */
import { h, fill, section, field, toLocalInput } from "../dom.js";
import * as api from "../api.js";
import { S, watch } from "../state.js";
import { describe, WD } from "../when.js";
import { cardish } from "../sensitive.js";
import { soon, busy, sure, tag, empty, make, edit, drop, pick, ago, when } from "../ui.js";

const MODE = { remind: "Reminder", run: "Routine", watch: "Watching" };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export async function mount(root) {
  const mode = pick([["remind", "Remind me of something"], ["run", "Do something for me"], ["watch", "Watch a web page"]], "remind", { "aria-label": "What kind" });
  const title = h("input", { type: "text", maxlength: "100", "aria-label": "Name", placeholder: "Call the dentist" });
  const what = h("textarea", { class: "field", rows: "4", maxlength: "2000", "aria-label": "What to do each time", placeholder: "Write it so a stranger could carry it out, including what is worth telling you." });
  const url = h("input", { type: "url", maxlength: "500", "aria-label": "Page to watch", placeholder: "https://example.com/pricing" });
  const kind = pick([["once", "Once"], ["daily", "Every day"], ["every", "Every few hours"]], "once", { "aria-label": "How often" });
  const at = h("input", { type: "datetime-local", "aria-label": "Date and time", value: toLocalInput(Date.now() + 3600_000) });
  const time = h("input", { type: "time", "aria-label": "Time of day", value: "08:00" });
  const days = WD.map((d, n) => ({ n, box: h("input", { type: "checkbox", "aria-label": d }) }));
  const hours = h("input", { type: "number", min: "1", max: "168", value: "6", "aria-label": "Hours between runs" });
  const err = h("p", { class: "err", role: "alert" });
  const add = h("button", { class: "btn sm", type: "submit", text: "Save" });

  const f = {
    what: field("What to do", what, "Each run reads this, does it, and tells you only if it matters."),
    url: field("Page", url, "A public page. Roxan checks it and acts when it changes."),
    at: field("When", at), time: field("Time of day", time),
    days: h("div", { class: "fld" }, h("span", { class: "label", text: "On these days (none means every day)" }), h("div", { class: "weekdays" }, days.map(d => h("label", { class: "check" }, d.box, h("span", { text: WD[d.n] }))))),
    hours: field("Hours between runs", hours),
  };
  const form = h("form", { class: "pform" }, field("What kind", mode), field("Name", title), f.what, f.url, field("How often", kind), f.at, f.time, f.days, f.hours,
    h("p", { class: "fine", text: `Times are in ${S.settings.tz}. Change that in Settings.` }), err, h("div", { class: "btns" }, add));
  const create = h("details", { class: "create" }, h("summary", { class: "btn sm", text: "New routine" }), form);
  const shape = () => {
    f.what.hidden = mode.value === "remind";
    f.url.hidden = mode.value !== "watch";
    f.at.hidden = kind.value !== "once"; f.time.hidden = f.days.hidden = kind.value !== "daily"; f.hours.hidden = kind.value !== "every";
    title.placeholder = mode.value === "remind" ? "Call the dentist" : mode.value === "watch" ? "Price of the standing desk" : "Morning summary";
    for (const o of kind.options) o.hidden = mode.value === "watch" && o.value === "once";
    if (mode.value === "watch" && kind.value === "once") { kind.value = "daily"; shape(); }
  };
  mode.addEventListener("change", shape); kind.addEventListener("change", shape);
  shape();
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cardish(title.value + what.value)) { err.textContent = "That looks like a card number. Keep those in the vault."; return; }
    const w = kind.value === "once" ? { kind: "once", at: at.value } : kind.value === "daily" ? { kind: "daily", time: time.value, days: days.filter(d => d.box.checked).map(d => d.n) } : { kind: "every", hours: Number(hours.value) };
    busy(add, async () => {
      err.textContent = "";
      try { await make("routine", { mode: mode.value, title: title.value.trim(), instruction: what.value.trim(), url: mode.value === "watch" ? url.value.trim() : undefined, when: w }); form.reset(); shape(); create.open = false; }
      catch (x) { err.textContent = x.message; }
    });
  });

  const row = r => {
    const live = r.state === "active";
    const sub = [
      r.mode === "watch" ? `Watching ${host(r.url)}` : null, describe(r.schedule, S.settings.tz),
      live && r.due ? `Next: ${when(r.due)}` : null,
      r.pausedBy === "failures" ? "Paused after three failed runs" : null,
    ].filter(Boolean).join(". ");
    return h("div", { class: "row routine", data: { id: r.id } },
      h("div", { class: "row-main" }, h("span", { class: "row-title", text: r.title }), h("span", { class: "row-sub about", text: sub }),
        r.last ? h("span", { class: "row-sub about", text: `${r.last.ok ? "Last run" : "Last run did not finish"} ${ago(r.last.at)}${r.last.summary ? `: ${r.last.summary}` : ""}` }) : null),
      tag(MODE[r.mode] || r.mode),
      h("div", { class: "row-acts" },
        live || r.state === "paused" ? h("button", { class: "act-btn", type: "button", text: live ? "Pause" : "Resume", onclick: e => busy(e.currentTarget, () => edit(r.id, { state: live ? "paused" : "active" })) }) : null,
        live && r.mode !== "remind" ? h("button", { class: "act-btn", type: "button", text: "Run now", onclick: e => busy(e.currentTarget, () => api.post(`/items/${r.id}/run`)) }) : null,
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
    h("div", { class: "page-act" }, create), list));
  return watch("routines", soon(draw));
}
