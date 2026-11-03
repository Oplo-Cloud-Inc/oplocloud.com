/* Settings: who Roxan is to you, how often it speaks first, and your data.

   Every choice here applies the moment you make it and is kept with Roxan, not
   in this browser, so it is the same on every device. The exception is alerts:
   whether this device may pop one up is this device's choice. */
import { h, fill, section } from "../dom.js";
import * as api from "../api.js";
import * as local from "../local.js";
import { S, load, watch } from "../state.js";
import { mark, MARKS } from "../mark.js";
import { soon, busy, soonTag, toast, saveSettings, TONES } from "../ui.js";
import { Button, Tabs, RadioGroup, Switch, SwitchCard, Combobox, Accordion } from "../kit/index.js";

const count = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const zones = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return []; } })();
// The pages that are not in the rail, one link row each with what it holds. Their routes are in app.js.
const hub = (label, rows) => section(label, null, rows.map(([path, name, hint]) => h("a", { class: "row", href: "#" + path },
  h("div", { class: "row-main" }, h("span", { class: "row-title", text: name }), h("span", { class: "row-sub", text: hint })),
  h("span", { class: "go sm" }, h("i", { "aria-hidden": "true" })))));

// As a page, or in a dialog over any page (dialog: true; page: the section to start on). The dialog has its sections down the left, with an icon each.
export async function mount(root, { app, dialog, page }) {
  // Every choice applies at once. If Roxan's side turns one down, the control goes back to what is kept.
  const save = patch => busy(null, async () => { try { await saveSettings(patch); } catch (e) { paint(); throw e; } });

  /* ------------------------------------------------ who Roxan is to you */
  const nameIn = h("input", { type: "text", maxlength: "24", autocomplete: "off", "aria-label": "Name" });
  const nameErr = h("p", { class: "err", role: "alert" });
  const nameGo = Button({ size: "sm", type: "submit" }, "Save name");
  const nameForm = h("form", { class: "inline" }, nameIn, nameGo);
  nameForm.addEventListener("submit", e => {
    e.preventDefault();
    const v = nameIn.value.trim();
    if (!v) { nameErr.textContent = "Give it a name."; return; }
    busy(nameGo, async () => { nameErr.textContent = ""; try { await saveSettings({ name: v }); } catch (x) { nameErr.textContent = x.message; } });
  });
  const marks = h("div", { class: "marks", role: "group", "aria-label": "Mark" }, MARKS.map(([id, label]) => {
    const b = h("button", { class: "mark-opt", type: "button", "aria-label": label, "data-tip": label, data: { mark: id } }, mark(id, "glyph"));
    b.addEventListener("click", () => save({ mark: id }));
    return b;
  }));
  const tones = RadioGroup({ label: "Tone", card: true, value: S.settings.tone, options: TONES.map(([value, label, hint]) => ({ value, label, hint })), onchange: tone => save({ tone }) });

  /* ------------------------------------------------ how often it speaks first */
  const levels = RadioGroup({ label: "How often Roxan speaks first", card: true, value: S.settings.level, options: Object.entries(S.levels).map(([value, l]) => ({ value, label: l.label, hint: `${l.hint} Up to ${l.perDay} a day.` })), onchange: level => save({ level }) });
  const quietBox = Switch({ label: "On", onchange: () => saveQuiet() });
  const from = h("input", { type: "time", "aria-label": "Quiet from" }), to = h("input", { type: "time", "aria-label": "Quiet until" });
  const saveQuiet = () => save({ quiet: quietBox.value ? { from: from.value, to: to.value } : null });
  for (const el of [from, to]) el.addEventListener("change", saveQuiet);
  const zone = Combobox({ options: [...new Set(["UTC", ...zones, S.settings.tz])].map(z => ({ value: z, label: z })), value: S.settings.tz, label: "Time zone", placeholder: "Search time zones",
    onchange: tz => busy(null, async () => { try { await saveSettings({ tz }); } catch (e) { zone.value = S.settings.tz; throw e; } }) });

  /* ------------------------------------------------ learning and pause */
  const learn = SwitchCard({ label: "Learn from what I tell it", checked: S.settings.learning, onchange: (on, box) => busy(null, async () => { try { await saveSettings({ learning: on }); } catch (e) { box.checked = !on; throw e; } }) });
  const learnNote = h("p", { class: "fine" });
  const pause = SwitchCard({ label: "Pause everything Roxan does on its own", checked: S.settings.paused, onchange: (on, box) => busy(null, async () => { try { await saveSettings({ paused: on }); } catch (e) { box.checked = !on; throw e; } }) });
  const pauseNote = h("p");

  /* ------------------------------------------------ alerts on this device */
  const perm = () => (globalThis.Notification ? Notification.permission : "unsupported");
  const alerts = h("p");
  const alertSw = SwitchCard({ label: "Show alerts on this device", onchange: (want, box) => busy(null, async () => {
    const p = want && perm() === "default" ? await Notification.requestPermission() : perm();
    app.notify = want && p === "granted";
    await local.setMeta("notify", app.notify);
    paintAlerts();
  }) });
  function paintAlerts() {
    const p = perm(), on = p === "granted" && app.notify, blocked = p === "unsupported" || p === "denied";
    alerts.textContent = { unsupported: "This browser cannot show alerts. Roxan's messages appear inside Roxan only.", denied: "Blocked for this site in your browser settings. Roxan's messages appear inside Roxan only.", default: "Off. Turning them on makes the browser ask once.", granted: on ? "On. When Roxan messages you while this tab is in the background, the browser also shows a notification." : "Off on this device." }[p];
    alertSw.value = on;
    alertSw.input.disabled = blocked;
    alertSw.setAttribute("aria-disabled", String(blocked));
  }

  /* ------------------------------------------------ your data */
  const counts = h("p", { class: "fine" }), device = h("p", { class: "fine" });
  async function paintData() {
    const kept = S.memories.filter(m => m.state === "active").length;
    counts.textContent = `Roxan keeps ${count(S.threads.length, "chat")}, ${count(S.projects.length, "project")}, ${count(S.goals.length, "goal")}, ${count(S.routines.length, "routine")}, ${count(kept, "note")}, ${count(S.specialties.length, "specialty", "specialties")}, ${count(S.panels.length, "panel")} and ${count(S.handoffs.length, "Handoff")}, with the log of what it did.`;
    const sealed = await local.vaultCount();
    device.textContent = `This device holds ${count(sealed, "sealed vault item")} and a log of what was done to the vault. They never leave this device, and deleting your data on Roxan does not touch them.`;
  }
  const exp = Button({ variant: "secondary", size: "sm", icon: "download", onclick: () => busy(exp, async () => {
    const data = await api.get("/export");
    const blob = new Blob([JSON.stringify({ app: "roxan", note: "Everything Roxan keeps for you. The vault is not included: it stays sealed on your device.", ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: `roxan-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }) }, "Download a copy");
  const word = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Type DELETE to confirm" });
  const wipe = Button({ variant: "danger", size: "sm", disabled: true, onclick: () => busy(wipe, async () => {
    await api.post("/wipe", { confirm: "delete everything" });
    word.value = "";
    await load();
    app.go("/");
    toast("Everything Roxan kept for you is deleted.");
  }) }, "Delete everything");
  word.addEventListener("input", () => { wipe.disabled = word.value.trim().toUpperCase() !== "DELETE"; });

  /* ------------------------------------------------ the page: one tab for each kind of thing */
  const ic = name => (dialog ? name : undefined);
  const tabs = Tabs({ label: "Settings", value: page, vertical: dialog, tabs: [
    { id: "pages", label: "Know and control", icon: ic("access"), panel: h("div", null,
      hub("Know", [["/memory", "Memory", "What Roxan has learned about you, as a web or a list."], ["/specialties", "Specialties", "Steps for a task you want done the same way every time."], ["/handoff", "Handoff", "Tasks that need a web browser, written up for you."], ["/vault", "Vault", "Logins, cards and notes, sealed on this device."]]),
      hub("Control", [["/access", "Access", "What Roxan may do on its own, and what it asks first."], ["/activity", "Activity", "What Roxan did and why, and what it held back."]])) },
    { id: "you", label: "You", icon: ic("user"), panel: h("div", null,
      section("Name", null, nameForm, nameErr),
      section("Mark", null, marks),
      section("Tone", null, tones)) },
    { id: "speaking", label: "Speaking first", icon: ic("chat"), panel: h("div", null,
      section("How often", null,
        h("p", { text: "Roxan may message you on its own when work finishes or a page changes. It holds back what is not new or not worth your attention, and the Activity page says why." }), levels),
      section("Quiet hours", null, h("div", { class: "inline" }, quietBox, from, h("span", { class: "fine", text: "to" }), to),
        h("p", { class: "fine", text: "Messages still arrive in the chat, but with no pop-up, unless they need you." })),
      section("Time zone", null, zone, h("p", { class: "fine", text: "Routines and quiet hours follow it. A new account takes this device's the first time." })),
      section("Learning", null, learn, learnNote),
      section("Pause", null, pause, pauseNote)) },
    { id: "device", label: "This device", icon: ic("bell"), panel: h("div", null,
      section("Alerts on this device", null, alertSw, alerts, h("p", { class: "fine" }, soonTag(), " Alerts that reach you when the tab is closed are not built yet."))) },
    { id: "data", label: "Your data", icon: ic("download"), panel: h("div", null,
      section("What Roxan keeps", null,
        h("p", { text: "Roxan keeps your chats, notes, goals and routines in your account on its servers, so it can work while this tab is closed. Each message you send, with the notes it is shown, goes to the AI model that answers it. The Security page says exactly what is sent, and to whom." }),
        counts, device,
        h("div", { class: "btns" }, exp, h("a", { class: "go", href: "/security/" }, "Security ", h("i", { "aria-hidden": "true" }))),
        h("div", { class: "danger" }, Accordion({ items: [{ id: "wipe", title: "Delete everything Roxan keeps for you", body: h("div", null,
          h("p", { class: "fine", text: "This removes every chat, project, goal, routine, note, specialty, panel, Handoff, rule and the log, and starts Roxan over. It cannot be undone. Download a copy first if you want one." }),
          h("div", { class: "inline" }, word, wipe)) }] })))) },
  ] });

  fill(root, dialog ? tabs : h("section", { class: "page" }, h("h1", { class: "page-title", text: "Yours to shape and to take away." }), tabs));

  function paint() {
    const s = S.settings;
    if (document.activeElement !== nameIn) nameIn.value = s.name;
    marks.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mark === s.mark)));
    tones.value = s.tone;
    levels.value = s.level;
    quietBox.value = Boolean(s.quiet);
    from.value = s.quiet?.from || "22:00";
    to.value = s.quiet?.to || "07:00";
    if (document.activeElement !== zone.input) zone.value = s.tz;
    learn.value = s.learning;
    pause.value = s.paused;
    learnNote.textContent = s.learning
      ? "On. When you tell Roxan something lasting it keeps a short note and tells you what it kept, with an Undo, and a specialty you ask for is saved at once. A note that comes from a web page or a file, or that looks like a password, an ID or a medical or money detail, waits for your yes. A card number is never kept."
      : "Off. Roxan asks before it keeps a note or a specialty, and keeps one only when you approve it.";
    pauseNote.textContent = s.paused
      ? "Paused. Routines and watches do not run and Roxan starts nothing on its own. Chat still works. A routine that came due while paused runs once when you resume."
      : "Roxan is running. Pausing stops routines and watches and anything Roxan would start on its own; chat keeps working.";
  }
  paint(); paintAlerts();
  await paintData();
  return watch(["settings", "memories", "projects", "goals", "routines", "specialties", "panels", "handoffs", "threads"], soon(() => { paint(); paintData(); }));
}
