/* Settings: access, storage, alerts and your data. You can take a copy of
   everything Roxan keeps on this device, or delete it. */
import { h, on, section, field, bytes } from "../dom.js";
import * as db from "../db.js";
import * as store from "../store.js";
import * as remind from "../remind.js";
import { saveCode } from "../gate.js";

export async function mount(root, { app }) {
  /* ------------------------------------------------------------- access */
  const code = h("input", { type: "text", autocomplete: "off", spellcheck: "false", placeholder: "Invite code" });
  const codeErr = h("p", { class: "err", role: "alert" });
  const access = h("p");
  const accessForm = h("form", { class: "inline" }, field("Invite code", code), h("button", { class: "btn sm", type: "submit", text: "Save code" }));
  const forget = h("button", { class: "btn sm ghost", type: "button", text: "Remove code" });
  accessForm.addEventListener("submit", async e => {
    e.preventDefault();
    const v = code.value.trim();
    if (!v) { codeErr.textContent = "Enter your invite code."; return; }
    codeErr.textContent = (await saveCode(app, v)) || "";
    if (!codeErr.textContent) code.value = "";
  });
  forget.addEventListener("click", async () => { await store.delMeta("invite"); app.invite = null; await app.refresh(); });
  const paintAccess = () => {
    const g = app.gateway;
    access.textContent = g.state === "closed" ? "Roxan is not taking messages yet."
      : g.state !== "open" ? "Roxan could not be reached just now."
      : !app.invite ? "No invite code is saved on this device. Roxan is in invited beta."
      : g.access ? "An invite code is saved on this device and Roxan accepts it." : "A code is saved on this device, but Roxan does not accept it.";
    forget.hidden = !app.invite;
  };

  /* ------------------------------------------------------------ storage */
  const where = h("p");
  const quota = h("p", { class: "fine" });
  const keep = h("button", { class: "btn sm ghost", type: "button", text: "Ask the browser to keep it" });
  keep.addEventListener("click", async () => { try { await navigator.storage.persist(); } catch { /* the answer below says what is true */ } paintStorage(); });
  async function paintStorage() {
    const est = await navigator.storage?.estimate?.().catch(() => null);
    const persisted = await navigator.storage?.persisted?.().catch(() => false);
    where.textContent = app.persistent ? "Roxan keeps your conversations, notes, reminders and attachments in this browser, on this device." : "This browser is not letting Roxan keep anything. What you write is lost when you close the tab.";
    quota.textContent = [est?.quota ? `${bytes(est.usage || 0)} used of about ${bytes(est.quota)} available.` : "", app.persistent ? (persisted ? "The browser has agreed not to clear it on its own." : "The browser may clear it on its own if the device runs short on space.") : ""].filter(Boolean).join(" ");
    keep.hidden = !app.persistent || persisted || !navigator.storage?.persist;
  }

  /* ----------------------------------------------------------- learning */
  const learnNote = h("p");
  const learnFine = h("p", { class: "fine" });
  const learnBtn = h("button", { class: "btn sm ghost", type: "button" });
  learnBtn.addEventListener("click", async () => { await store.setLearning(!(await store.learning())); paintLearning(); });
  async function paintLearning() {
    const [on, notes, specialties] = await Promise.all([store.learning(), db.all("memories"), db.all("specialties")]);
    const learnt = notes.filter(m => m.auto && !m.deleted).length + specialties.filter(s => s.auto && !s.deleted).length;
    learnNote.textContent = on
      ? "On. When you tell Roxan something lasting, it keeps a short note on this device and shows you what it kept, with an Undo. It also sets up a specialty when it sees you do the same task the same way."
      : "Off. Roxan only suggests notes and specialties, and keeps one when you approve it.";
    const count = `${learnt} kept this way so far.`;
    learnFine.textContent = on ? `Nothing is kept straight away from a file or image you attach, or from anything that looks like a password, a card or a medical detail: those wait for your yes. ${count}` : count;
    learnBtn.textContent = on ? "Turn off learning" : "Turn on learning";
  }

  /* ------------------------------------------------------------- alerts */
  const alerts = h("p");
  const allow = h("button", { class: "btn sm ghost", type: "button", text: "Allow alerts", onclick: async () => { await remind.askPermission(); paintAlerts(); } });
  function paintAlerts() {
    const p = remind.permission();
    alerts.textContent = { granted: "On. A reminder also appears as a browser notification.", denied: "Blocked for this site in your browser settings. Reminders appear only inside Roxan.", unsupported: "This browser cannot show alerts. Reminders appear only inside Roxan.", default: "Not asked yet. Reminders appear inside Roxan." }[p];
    allow.hidden = p !== "default";
  }

  /* --------------------------------------------------------------- data */
  const counts = h("p", { class: "fine" });
  const exp = h("button", { class: "btn sm", type: "button", text: "Download a copy" });
  exp.addEventListener("click", async () => {
    const dump = await db.dump();
    dump.meta = dump.meta.filter(m => m.key !== "invite" && !m.key.startsWith("vault:"));                  // a key, not content; and the vault's lock
    const blob = new Blob([JSON.stringify({ app: "roxan", exportedAt: new Date().toISOString(), note: "Images and PDFs are listed but their contents are not included. The vault is not included either: it stays sealed on this device.", ...dump }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: `roxan-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    await store.log("settings", "Downloaded a copy of everything on this device.");
  });
  const sure = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Type DELETE to confirm" });
  const wipe = h("button", { class: "btn sm", type: "button", text: "Delete everything", disabled: true });
  sure.addEventListener("input", () => { wipe.disabled = sure.value.trim().toUpperCase() !== "DELETE"; });
  wipe.addEventListener("click", async () => {
    wipe.disabled = true;
    await db.clearAll();
    location.replace("/chat/");
  });
  async function paintCounts() {
    const [events, notes, reminders, rooms, specialties, handoffs, sealed] = await Promise.all([db.all("events"), db.all("memories"), db.all("reminders"), db.all("rooms"), db.all("specialties"), db.all("handoffs"), db.all("vault")]);
    const n = events.filter(e => e.kind === "user" || e.kind === "assistant").length;
    const kept = notes.filter(m => !m.deleted).length, set = reminders.filter(r => r.state === "scheduled").length;
    const projects = rooms.filter(r => r.kind === "project").length, chats = rooms.filter(r => r.kind === "session").length;
    const sp = specialties.filter(x => !x.deleted).length, ho = handoffs.filter(x => x.state !== "dropped").length;
    const s = k => (k === 1 ? "" : "s");
    counts.textContent = `${n} message${s(n)}, ${kept} note${s(kept)}, ${sp} specialt${sp === 1 ? "y" : "ies"}, ${ho} Handoff${s(ho)}, ${set} reminder${s(set)} set, ${projects} project${s(projects)} holding ${chats} conversation${s(chats)}, and ${sealed.length} sealed vault item${s(sealed.length)}.`;
  }

  root.append(h("section", { class: "page" },
    h("p", { class: "label", text: "Settings" }),
    h("h1", { class: "page-title", text: "Yours to see and to take away." }),
    section("Access", null, access, accessForm, codeErr, h("div", { class: "btns" }, forget)),
    section("Storage", null, where, quota, h("div", { class: "btns" }, keep)),
    section("Learning", null, learnNote, learnFine, h("div", { class: "btns" }, learnBtn)),
    section("Alerts", null, alerts, h("div", { class: "btns" }, allow)),
    section("Your data", null,
      h("p", { text: "Your conversation is kept on this device. Each message you send travels to Roxan's service to be answered; Roxan's service does not store it or write it to logs. The Security page says exactly what is sent, and to whom." }),
      counts, h("div", { class: "btns" }, exp, h("a", { class: "go", href: "/security/" }, "Security ", h("i", { text: "→" }))),
      h("details", { class: "danger" }, h("summary", { class: "go", text: "Delete everything on this device" }),
        h("p", { class: "fine", text: "This removes every conversation, project, note, specialty, Handoff, reminder, attachment, the vault and your saved invite code from this browser. It cannot be undone. Download a copy first if you want one; it does not include the vault." }),
        h("div", { class: "inline" }, sure, wipe)))));

  paintAccess(); paintAlerts();
  await Promise.all([paintStorage(), paintCounts(), paintLearning()]);
  const off = [on("gateway", paintAccess), on("memories", () => { paintCounts(); paintLearning(); }), on("specialties", () => { paintCounts(); paintLearning(); }), on("handoffs", paintCounts), on("reminders", paintCounts), on("activity", paintCounts)];
  return () => off.forEach(f => f());
}
