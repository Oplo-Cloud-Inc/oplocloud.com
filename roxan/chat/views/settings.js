/* Settings: who Roxan is to you, how often it speaks first, and your data.

   Every choice here applies the moment you make it and is kept with Roxan, not
   in this browser, so it is the same on every device. The exception is alerts:
   whether this device may pop one up is this device's choice. */
import { h, fill, section, field } from "../dom.js";
import * as api from "../api.js";
import * as local from "../local.js";
import { S, load, watch } from "../state.js";
import { mark, MARKS } from "../mark.js";
import { soon, busy, check, pick, soonTag, toast, saveSettings, TONES } from "../ui.js";

const count = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const zones = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return []; } })();
const radios = (label, attr, rows, choose) => {
  const el = h("div", { class: "tones", role: "radiogroup", "aria-label": label }, rows.map(([id, name, hint]) => {
    const b = h("button", { class: "tone-opt", type: "button", role: "radio", data: { [attr]: id } }, h("span", { class: "tone-name", text: name }), h("span", { class: "fine", text: hint }));
    b.addEventListener("click", () => busy(null, () => choose(id)));
    return b;
  }));
  return el;
};
const sync = (el, attr, value) => el.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b.dataset[attr] === value)));

export async function mount(root, { app }) {
  /* ------------------------------------------------ who Roxan is to you */
  const nameIn = h("input", { type: "text", maxlength: "24", autocomplete: "off", "aria-label": "Name" });
  const nameErr = h("p", { class: "err", role: "alert" });
  const nameGo = h("button", { class: "btn sm", type: "submit", text: "Save name" });
  const nameForm = h("form", { class: "inline" }, nameIn, nameGo);
  nameForm.addEventListener("submit", e => {
    e.preventDefault();
    const v = nameIn.value.trim();
    if (!v) { nameErr.textContent = "Give it a name."; return; }
    busy(nameGo, async () => { nameErr.textContent = ""; try { await saveSettings({ name: v }); } catch (x) { nameErr.textContent = x.message; } });
  });
  const marks = h("div", { class: "marks", role: "group", "aria-label": "Mark" }, MARKS.map(([id, label]) => {
    const b = h("button", { class: "mark-opt", type: "button", "aria-label": label, title: label, data: { mark: id } }, mark(id, "glyph"));
    b.addEventListener("click", () => busy(null, () => saveSettings({ mark: id })));
    return b;
  }));
  const tones = radios("Tone", "tone", TONES, tone => saveSettings({ tone }));

  /* ------------------------------------------------ how often it speaks first */
  const levels = radios("How often Roxan speaks first", "level", Object.entries(S.levels).map(([id, l]) => [id, l.label, `${l.hint} Up to ${l.perDay} a day.`]), level => saveSettings({ level }));
  const quietBox = h("input", { type: "checkbox" });
  const from = h("input", { type: "time", "aria-label": "Quiet from" }), to = h("input", { type: "time", "aria-label": "Quiet until" });
  const saveQuiet = () => busy(null, async () => {
    try { await saveSettings({ quiet: quietBox.checked ? { from: from.value, to: to.value } : null }); }
    catch (e) { paint(); throw e; }
  });
  for (const el of [quietBox, from, to]) el.addEventListener("change", saveQuiet);
  const zone = pick([...new Set(["UTC", ...zones, S.settings.tz])].map(z => [z, z]), S.settings.tz, { "aria-label": "Time zone" });
  zone.addEventListener("change", () => busy(zone, async () => { try { await saveSettings({ tz: zone.value }); } catch (e) { zone.value = S.settings.tz; throw e; } }));

  /* ------------------------------------------------ learning and pause */
  const learn = check("Learn from what I tell it", S.settings.learning, (on, box) => busy(null, async () => { try { await saveSettings({ learning: on }); } catch (e) { box.checked = !on; throw e; } }));
  const learnNote = h("p", { class: "fine" });
  const pause = h("button", { class: "btn sm ghost", type: "button" });
  pause.addEventListener("click", () => busy(pause, () => saveSettings({ paused: !S.settings.paused })));
  const pauseNote = h("p");

  /* ------------------------------------------------ alerts on this device */
  const alerts = h("p"), alertBtn = h("button", { class: "btn sm ghost", type: "button" });
  const perm = () => (globalThis.Notification ? Notification.permission : "unsupported");
  function paintAlerts() {
    const p = perm(), on = p === "granted" && app.notify;
    alerts.textContent = { unsupported: "This browser cannot show alerts. Roxan's messages appear inside Roxan only.", denied: "Blocked for this site in your browser settings. Roxan's messages appear inside Roxan only.", default: "Off. Turning them on makes the browser ask once.", granted: on ? "On. When Roxan messages you while this tab is in the background, the browser also shows a notification." : "Off on this device." }[p];
    alertBtn.hidden = p === "unsupported" || p === "denied";
    alertBtn.textContent = on ? "Turn off alerts" : "Turn on alerts";
  }
  alertBtn.addEventListener("click", () => busy(alertBtn, async () => {
    const want = !(perm() === "granted" && app.notify);
    const p = want && perm() === "default" ? await Notification.requestPermission() : perm();
    app.notify = want && p === "granted";
    await local.setMeta("notify", app.notify);
    paintAlerts();
  }));

  /* ------------------------------------------------ your data */
  const counts = h("p", { class: "fine" }), device = h("p", { class: "fine" });
  async function paintData() {
    const kept = S.memories.filter(m => m.state === "active").length;
    counts.textContent = `Roxan keeps ${count(S.threads.length, "chat")}, ${count(S.projects.length, "project")}, ${count(S.goals.length, "goal")}, ${count(S.routines.length, "routine")}, ${count(kept, "note")}, ${count(S.specialties.length, "specialty", "specialties")}, ${count(S.panels.length, "panel")} and ${count(S.handoffs.length, "Handoff")}, with the log of what it did.`;
    const sealed = await local.vaultCount();
    device.textContent = `This device holds ${count(sealed, "sealed vault item")} and a log of what was done to the vault. They never leave this device, and deleting your data on Roxan does not touch them.`;
  }
  const exp = h("button", { class: "btn sm", type: "button", text: "Download a copy" });
  exp.addEventListener("click", () => busy(exp, async () => {
    const data = await api.get("/export");
    const blob = new Blob([JSON.stringify({ app: "roxan", note: "Everything Roxan keeps for you. The vault is not included: it stays sealed on your device.", ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: `roxan-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }));
  const word = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Type DELETE to confirm" });
  const wipe = h("button", { class: "btn sm", type: "button", text: "Delete everything", disabled: true });
  word.addEventListener("input", () => { wipe.disabled = word.value.trim().toUpperCase() !== "DELETE"; });
  wipe.addEventListener("click", () => busy(wipe, async () => {
    await api.post("/wipe", { confirm: "delete everything" });
    word.value = "";
    await load();
    app.go("/");
    toast("Everything Roxan kept for you is deleted.");
  }));

  fill(root, h("section", { class: "page" },
    h("h1", { class: "page-title", text: "Yours to shape and to take away." }),
    section("Name, mark and tone", null, h("div", { class: "fld" }, h("span", { class: "label", text: "Name" }), nameForm), nameErr, h("div", { class: "fld" }, h("span", { class: "label", text: "Mark" }), marks), h("div", { class: "fld" }, h("span", { class: "label", text: "Tone" }), tones)),
    section("Speaking first", null,
      h("p", { text: "Roxan may message you on its own when work finishes or a page changes. It holds back what is not new or not worth your attention, and the Activity page says why." }), levels,
      h("div", { class: "fld" }, h("span", { class: "label", text: "Quiet hours" }), h("div", { class: "inline" }, h("label", { class: "check" }, quietBox, h("span", { text: "On" })), from, h("span", { class: "fine", text: "to" }), to),
        h("span", { class: "fine", text: "Messages still arrive in the chat, but with no pop-up, unless they need you." })),
      field("Time zone", zone, "Routines and quiet hours follow it. A new account takes this device's the first time.")),
    section("Learning", null, learn, learnNote),
    section("Pause", null, pauseNote, h("div", { class: "btns" }, pause)),
    section("Alerts on this device", null, alerts, h("div", { class: "btns" }, alertBtn), h("p", { class: "fine" }, soonTag(), " Alerts that reach you when the tab is closed are not built yet.")),
    section("Your data", null,
      h("p", { text: "Roxan keeps your chats, notes, goals and routines in your account on its servers, so it can work while this tab is closed. Each message you send, with the notes it is shown, goes to the AI model that answers it. The Security page says exactly what is sent, and to whom." }),
      counts, device,
      h("div", { class: "btns" }, exp, h("a", { class: "go", href: "/security/" }, "Security ", h("i", { "aria-hidden": "true" }))),
      h("details", { class: "danger" }, h("summary", { class: "go", text: "Delete everything Roxan keeps for you" }),
        h("p", { class: "fine", text: "This removes every chat, project, goal, routine, note, specialty, panel, Handoff, rule and the log, and starts Roxan over. It cannot be undone. Download a copy first if you want one." }),
        h("div", { class: "inline" }, word, wipe)))));

  function paint() {
    const s = S.settings;
    if (document.activeElement !== nameIn) nameIn.value = s.name;
    marks.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mark === s.mark)));
    sync(tones, "tone", s.tone);
    sync(levels, "level", s.level);
    quietBox.checked = Boolean(s.quiet);
    from.value = s.quiet?.from || "22:00";
    to.value = s.quiet?.to || "07:00";
    zone.value = s.tz;
    learn.querySelector("input").checked = s.learning;
    learnNote.textContent = s.learning
      ? "On. When you tell Roxan something lasting it keeps a short note and tells you what it kept, with an Undo, and a specialty you ask for is saved at once. A note that comes from a web page or a file, or that looks like a password, an ID or a medical or money detail, waits for your yes. A card number is never kept."
      : "Off. Roxan asks before it keeps a note or a specialty, and keeps one only when you approve it.";
    pauseNote.textContent = s.paused
      ? "Paused. Routines and watches do not run and Roxan starts nothing on its own. Chat still works. A routine that came due while paused runs once when you resume."
      : "Roxan is running. Pausing stops routines and watches and anything Roxan would start on its own; chat keeps working.";
    pause.textContent = s.paused ? "Resume" : "Pause everything it does on its own";
  }
  paint(); paintAlerts();
  await paintData();
  return watch(["settings", "memories", "projects", "goals", "routines", "specialties", "panels", "handoffs", "threads"], soon(() => { paint(); paintData(); }));
}
