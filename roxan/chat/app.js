/* Roxan's app: the rail, the router, signing in, and what every page shares.
   Each page is a module with mount(root, { app, params }) that returns a
   cleanup function. What Roxan knows lives in state.js; pages read it there. */
import * as db from "./db.js";
import { h, fill, $, on, emit, ago, brief } from "./dom.js";
import * as api from "./api.js";
import * as oplo from "./oplo.js";
import * as local from "./local.js";
import { S, MAIN, start, stop, watch, chats, waiting, name as who } from "./state.js";
import { icon } from "./icons.js";
import { mark } from "./mark.js";
import { soon, saveSettings } from "./ui.js";
import { Button, LinkButton, IconButton, Input, Avatar, Kbd, Menu, Modal, TreeView, Announcement, Notice, NotificationCenter, StatusDot, openPalette, initTips, leave, mod } from "./kit/index.js";

export const app = {
  persistent: false,
  rail: false,                                         // whether the rail is folded to icons; kept on this device
  prefill: null,                                       // text a page leaves for the composer to open with
  notify: false,                                       // whether this device may pop up a notice while the tab is in the background
  go(path) { location.hash = "#" + path; },
};

// The rail, in the order it is drawn. Chats are drawn under Chat, from what Roxan has.
// Memory, Specialties, Handoff, the Vault, Access and Activity are not here: Settings lists them (views/settings.js).
const NAV = [
  [null, [["home", "Today", "/"], ["chat", "Chat", "/chat"], ["projects", "Projects", "/projects"]]],
  ["Work", [["goals", "Goals", "/goals"], ["schedule", "Routines", "/routines"], ["panels", "Panels", "/panels"], ["needs", "Needs you", "/needs"]]],
  [null, [["settings", "Settings", "/settings"]]],
];
const ROUTES = [
  { re: /^\/?$/, nav: "home", title: "Today", load: () => import("./views/today.js") },
  { re: /^\/chat$/, nav: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/c\/([\w-]+)$/, nav: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/goals(?:\/([\w-]+))?$/, nav: "goals", title: "Goals", load: () => import("./views/goals.js") },
  { re: /^\/routines$/, nav: "schedule", title: "Routines", load: () => import("./views/routines.js") },
  { re: /^\/panels(?:\/([\w-]+))?$/, nav: "panels", title: "Panels", load: () => import("./views/panels.js") },
  { re: /^\/needs$/, nav: "needs", title: "Needs you", load: () => import("./views/needs.js") },
  { re: /^\/memory$/, nav: "settings", title: "Memory", load: () => import("./views/memory.js") },
  { re: /^\/specialties$/, nav: "settings", title: "Specialties", load: () => import("./views/specialties.js") },
  { re: /^\/projects$/, nav: "projects", title: "Projects", load: () => import("./views/projects.js") },
  { re: /^\/p\/([\w-]+)$/, nav: "projects", title: "Project", load: () => import("./views/projects.js") },
  { re: /^\/handoff$/, nav: "settings", title: "Handoff", load: () => import("./views/handoff.js") },
  { re: /^\/vault$/, nav: "settings", title: "Vault", load: () => import("./views/vault.js") },
  { re: /^\/access$/, nav: "settings", title: "Access", load: () => import("./views/access.js") },
  { re: /^\/activity$/, nav: "settings", title: "Activity", load: () => import("./views/activity.js") },
  { re: /^\/settings$/, nav: "settings", title: "Settings", load: () => import("./views/settings.js") },
];
const MISSING = { nav: "", title: "Not found", re: /(?:)/, load: async () => ({ mount: root => { root.append(h("section", { class: "page" }, h("h1", { class: "page-title", text: "That page is not here." }), h("a", { class: "go", href: "#/" }, "Go to Today ", h("i", { "aria-hidden": "true" })))); } }) };
const SHOWN = 6;                                       // chats listed under Chat in the rail; Projects has the rest

let main, banner, brandMark, brandName, status, counts, chatList, projList, bell;
const treeOpen = new Set();                            // the projects open in the rail, kept across redraws
let wired = false;

/* ------------------------------------------------------------ the rail */

function shell() {
  const root = $("#shell");
  counts = {};
  const entry = ([key, label, path]) => {
    const n = h("span", { class: "count", "aria-hidden": "true" });
    counts[key] = n;
    const link = h("a", { href: "#" + path, data: { nav: key } }, icon(key), h("span", { class: "t", text: label }), n);
    // Settings opens over the page you are on; the page at /settings is still there for a new tab or a link
    if (key === "settings") link.addEventListener("click", e => { if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); openSettings(); });
    if (key === "chat") return h("li", null, link, chatList = h("div", { class: "chat-list" }));
    if (key === "projects") return h("li", null, link, projList = h("div", { class: "chat-list" }));
    return h("li", null, link);
  };
  const sections = NAV.map(([title, items], i) => h("section", { class: "rail-sec", "aria-labelledby": "rail-h" + i },
    h("h2", { class: title ? "rail-label" : "sr", id: "rail-h" + i, text: title || (i ? "Settings" : "Roxan") }), h("ul", null, items.map(entry))));

  brandMark = h("span", { class: "rail-glyph" });
  brandName = h("span", { class: "rail-name" });
  status = h("p", { class: "rail-status", role: "status" });
  bell = NotificationCenter({ title: "Notifications", empty: "Nothing needs you.", side: "right", align: "start", footer: Button({ variant: "ghost", size: "sm", trailing: "right", onclick: () => app.go("/activity") }, "All activity") });
  const search = h("button", { class: "rail-search", type: "button", "aria-label": "Search and commands", onclick: openCommands }, icon("search"), h("span", { class: "t", text: "Search" }), Kbd(mod(), "K"));
  const account = h("button", { class: "rail-acct", type: "button" }, Avatar({ size: "sm", glyph: icon("user") }), h("span", { class: "t", text: "Your account" }), icon("updown", "sm"));
  const fold = IconButton({ class: "rail-fold", "aria-controls": "rail" }, "panel");
  fold.addEventListener("click", () => setRail(!app.rail));
  Menu(account, () => [
    { label: "Settings", icon: "settings", onselect: () => openSettings() },
    { label: "Activity", icon: "activity", onselect: () => app.go("/activity") },
    { label: "Help", icon: "info", href: "/help/" },
    { label: "roxan.oplocloud.com", icon: "globe", href: "/" },
    { divider: true },
    { label: "Sign out", icon: "logout", onselect: signOut },
  ], { side: "top", align: "start", width: 232, label: "Account" });
  const rail = h("aside", { class: "rail", id: "rail" },
    h("div", { class: "rail-top" }, h("a", { class: "rail-brand", href: "#/", "aria-label": "Today" }, brandMark, brandName), bell, fold),
    search,
    status,
    h("nav", { "aria-label": "Roxan" }, sections),
    h("div", { class: "rail-foot" }, account));
  banner = h("div", { class: "banner-slot", role: "status" });
  main = h("main", { id: "main", tabindex: "-1" }, banner);
  fill(root, rail, main);
  paintRail();
}

// Folded, the rail is a column of icons: the words go, so each link says its own through a tooltip. The choice is kept on this device.
function paintRail(slide) {
  const min = app.rail, fold = $(".rail-fold"), word = min ? "Expand the sidebar" : "Collapse the sidebar";
  $("#shell").toggleAttribute("data-slide", Boolean(slide));
  $("#shell").toggleAttribute("data-min", min);
  fold.setAttribute("aria-expanded", String(!min));
  fold.setAttribute("aria-label", word);
  fold.setAttribute("data-tip", word);
  document.querySelectorAll(".rail nav a[data-nav]").forEach(a => {
    if (min) { a.setAttribute("data-tip", a.querySelector(".t").textContent); a.setAttribute("data-tip-side", "right"); }
    else { a.removeAttribute("data-tip"); a.removeAttribute("data-tip-side"); }
  });
}
function setRail(min) {
  app.rail = min;
  paintRail(true);
  local.setMeta("rail", min);
}

// Settings as a dialog over the page you are on: the Settings page's own view with its sections down the left. page: which one to start on.
let settingsDlg = null;
async function openSettings(page) {
  if (settingsDlg) return;
  settingsDlg = true;                                                           // the view is fetched first; a second click meanwhile must not open a second dialog
  try {
    const view = await import("./views/settings.js");
    const body = h("div", { class: "set-pane" }), stopWatching = await view.mount(body, { app, dialog: true, page });
    settingsDlg = Modal({ title: "Settings", body, size: "lg", class: "k-settings", onclose: () => { stopWatching?.(); settingsDlg = null; },
      footer: h("a", { class: "go", href: "#/settings" }, "Open as a page ", h("i", { "aria-hidden": "true" })) });
    settingsDlg.el.addEventListener("click", e => { if (e.target.closest('a[href^="#/"]')) settingsDlg.close(); });      // a link to a page leaves the dialog
  } catch (e) { settingsDlg = null; toast({ text: e.message, tone: "error" }); }
}

function paintBrand() {
  fill(brandMark, mark(S.settings.mark));
  brandName.textContent = who();
}

function paintStatus() {
  const s = S.status;
  status.dataset.state = s.state;
  fill(status, StatusDot({ state: s.state }), s.text || "Ready");
  status.title = s.text || "Ready";
}

function paintCounts() {
  const n = {
    chat: S.unread,
    goals: S.goals.filter(g => g.state === "active").length,
    schedule: S.routines.filter(r => r.state === "active").length,
    panels: S.panels.length,
    needs: waiting().length,
    projects: S.projects.filter(p => p.state === "open").length,
  };
  for (const [k, el] of Object.entries(counts)) el.textContent = n[k] ? String(n[k]) : "";
  document.querySelector('[data-nav="needs"]')?.toggleAttribute("data-alert", n.needs > 0);
}

function paintChats() {
  const list = chats();
  // a title that is cut off says the rest on hover; one that fits has nothing to add
  const row = n => {
    const t = h("span", { class: "t", text: n.label, "data-tip": n.label.length > 21 ? n.label : null, "data-tip-side": "right" });
    if (!n.at) return t;
    const both = document.createDocumentFragment();                              // a chat's age sits after its name
    both.append(t, h("span", { class: "k-age", data: { at: n.at }, text: brief(n.at) }));
    return both;
  };
  fill(chatList,
    list.length ? TreeView({ label: "Recent chats", class: "k-bare", nodes: list.slice(0, SHOWN).map(t => ({ id: "c:" + t.id, label: t.title || "New chat", href: "#/c/" + t.id, at: t.updated })), render: row }) : null,
    h("button", { class: "tree-new", type: "button", onclick: newChat }, icon("plus", "sm"), h("span", { class: "t", text: "New chat" })),
    list.length > SHOWN ? h("a", { class: "tree-more", href: "#/projects", text: `All ${list.length} chats` }) : null);
  const projects = S.projects.filter(p => p.state === "open").slice(0, SHOWN);
  fill(projList, projects.length ? TreeView({ label: "Projects", open: treeOpen, render: row, nodes: projects.map(p => ({ id: "p:" + p.id, label: p.title, href: "#/p/" + p.id, children: list.filter(t => t.parent === p.id).map(t => ({ id: "c:" + t.id, label: t.title || "New chat", href: "#/c/" + t.id, at: t.updated })) })) }) : null);
  markCurrent();
}

// What waits for you, in the bell: questions and approvals, and that Roxan wrote while you were away.
function paintBell() {
  const needs = waiting();
  const items = needs.slice(0, 5).map(it => ({ title: it.title, text: it.kind === "question" ? "A question for you" : "Needs your OK", time: ago(it.created), href: "#/needs", tone: "warn" }));
  if (S.unread) items.unshift({ title: `${who()} wrote to you`, text: S.unread === 1 ? "1 new message" : `${S.unread} new messages`, href: "#/chat", tone: "info" });
  bell.set(items, needs.length + (S.unread ? 1 : 0));
}

async function newChat() {
  try {
    const { item } = await api.post("/items", { kind: "thread" });
    app.go("/c/" + item.id);
  } catch (e) { toast({ text: e.message, tone: "error" }); }
}

const nav = name => document.querySelectorAll("[data-nav]").forEach(a => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
function markCurrent() {
  const chat = (/^#\/c\/([\w-]+)$/.exec(location.hash) || [])[1], proj = (/^#\/p\/([\w-]+)$/.exec(location.hash) || [])[1];
  document.querySelectorAll(".rail .k-tr-row[data-id]").forEach(a => {
    const on = (chat && a.dataset.id === "c:" + chat) || (proj && a.dataset.id === "p:" + proj);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

function paintBanner() {
  const words = S.live === "live" ? "" : S.live === "polling" ? "Live updates are not reaching this page, so it checks every few seconds instead." : "Reconnecting…";
  fill(banner, words ? Announcement({ text: words }) : null);
}

/* ------------------------------------------------------------ toasts */

// A toast is a notice that drains: it goes after 8 seconds (14 for a problem), but not while you are reading it.
function toast({ text, sub, tone = "info", href }) {
  const box = $("#toasts"), ms = tone === "error" ? 14000 : 8000;
  let left = ms, t0 = 0, timer = 0;
  const gone = () => { clearTimeout(timer); leave(el, 220); };
  const run = () => { t0 = Date.now(); timer = setTimeout(gone, left); };
  const hold = () => { clearTimeout(timer); left -= Date.now() - t0; };
  const el = Notice({ title: sub, text, tone: tone === "error" ? "error" : tone === "said" ? "ok" : "info", href, onclose: gone, class: "toast-in" });
  const bar = h("span", { class: "k-bar-t" });
  bar.style.animationDuration = `${ms}ms`;
  el.append(bar);
  el.addEventListener("pointerenter", hold);
  el.addEventListener("pointerleave", run);
  el.addEventListener("focusin", hold);
  el.addEventListener("focusout", run);
  box.append(el);
  while (box.children.length > 4) box.firstChild.remove();
  run();
}

// Roxan spoke first. The notice is skipped when that conversation is already in front of the person.
function said(m) {
  const here = location.hash === (m.thread === MAIN ? "#/chat" : "#/c/" + m.thread);
  if (document.hidden && app.notify && globalThis.Notification?.permission === "granted") {
    const n = new Notification(who(), { body: m.text, tag: "roxan" });
    n.onclick = () => { window.focus(); app.go(m.thread === MAIN ? "/chat" : "/c/" + m.thread); n.close(); };
  }
  if (!here || document.hidden) toast({ sub: who(), text: m.text, tone: "said", href: m.thread === MAIN ? "#/chat" : "#/c/" + m.thread });
}

/* ------------------------------------------------------------ the command palette */

const GOTO = [["Today", "/", "home"], ["Chat", "/chat", "chat", "main conversation"], ["Chats and projects", "/projects", "projects"], ["Goals", "/goals", "goals"], ["Routines", "/routines", "schedule", "schedule"], ["Panels", "/panels", "panels"], ["Needs you", "/needs", "needs", "approvals questions"],
  ["Memory", "/memory", "memory", "remember"], ["Specialties", "/specialties", "specialties"], ["Handoff", "/handoff", "handoff"], ["Vault", "/vault", "vault", "secrets passwords"], ["Access", "/access", "access", "websites rules"], ["Activity", "/activity", "activity", "log history"], ["Settings", "/settings", "settings"]];

function commands() {
  const paused = S.settings.paused;
  const find = (title, items) => (items.length ? [{ title, items }] : []);
  return [
    { title: "Do", items: [
      { label: "New chat", icon: "plus", onselect: newChat },
      { label: paused ? `Resume ${who()}` : `Pause ${who()}`, icon: paused ? "play" : "pause", keywords: "stop start", onselect: () => saveSettings({ paused: !paused }).catch(e => toast({ text: e.message, tone: "error" })) },
      { label: "Sign out", icon: "logout", onselect: signOut }] },
    ...find("Chats", chats().slice(0, 8).map(t => ({ label: t.title || "New chat", icon: "chat", href: "#/c/" + t.id, sub: t.last?.text }))),
    ...find("Projects", S.projects.filter(p => p.state === "open").slice(0, 8).map(p => ({ label: p.title, icon: "projects", href: "#/p/" + p.id }))),
    ...find("Goals", S.goals.filter(g => g.state === "active").slice(0, 8).map(g => ({ label: g.title, icon: "goals", href: "#/goals/" + g.id }))),
    { title: "Go to", items: GOTO.map(([label, path, ic, keywords]) => ({ label, icon: ic, href: "#" + path, keywords })) },
  ];
}
const openCommands = () => openPalette(commands);

/* ------------------------------------------------------------ signing in and out */

// The owner's way in, for the codes still in ROXAN_INVITE: /chat/?invite. It is not offered to anyone else.
function invite() {
  const field_ = Input({ id: "code", name: "code", type: "password", autocomplete: "current-password", autocapitalize: "off", spellcheck: "false", "aria-label": "Invite code", placeholder: "Invite code", required: true });
  const input = field_.input;
  const err = h("p", { class: "err", role: "alert" });
  const go = Button({ type: "submit" }, "Sign in");
  const form = h("form", { class: "gate-form" }, field_, go);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!input.value.trim()) return;
    go.disabled = true;
    err.textContent = "";
    try { await api.signIn(input.value.trim()); input.value = ""; await boot(); }
    catch (x) { err.textContent = x.message; go.disabled = false; input.select(); }
  });
  return h("div", { class: "invite" }, form, err);
}

function gate(why, note = "") {
  stop();
  const body = {
    offline: [h("h1", { class: "page-title", text: "Roxan cannot be reached." }), h("p", { class: "page-lead", text: note || "Check your connection. Nothing is lost: what Roxan keeps is kept on its side." }), h("div", { class: "btns" }, Button({ onclick: boot }, "Try again"))],
    closed: [h("h1", { class: "page-title", text: "Roxan is not open right now." }), h("p", { class: "page-lead", text: "The status page says when it is." }), h("div", { class: "btns" }, LinkButton({ variant: "secondary", href: "/status/" }, "Status"))],
  }[why];
  if (body) return fill($("#shell"), h("main", { id: "main", class: "boot signin" }, h("section", { class: "gatebox" }, h("span", { class: "label", text: "Roxan" }), body)));

  const LEAD = "Roxan opens with your Oplo Account. You sign in on the Oplo Account page, in a tab of its own, so Roxan never sees your password.";
  const lead = h("p", { class: "page-lead", text: LEAD });
  const err = h("p", { class: "err", role: "alert" });
  const go = Button({ disabled: true }, "Sign in with your Oplo Account");
  // The tab is opened from the click itself, because a browser only opens one for a click; if the shared script has not arrived yet, it is fetched first.
  go.addEventListener("click", () => {
    err.textContent = "";
    const open = connect => connect.open({ verify: oplo.signedIn });
    if (window.OploSignIn) open(window.OploSignIn);
    else oplo.load().then(open, x => { err.textContent = x.message; });
  });
  fill($("#shell"), h("main", { id: "main", class: "boot signin" }, h("section", { class: "gatebox" },
    h("span", { class: "label", text: "Roxan" }), h("h1", { class: "page-title", text: "Sign in." }), lead,
    h("div", { class: "btns" }, go), err,
    h("p", { class: "fine", text: "No Oplo Account? Schools and organizations that use Oplo make them for their people." }),
    new URLSearchParams(location.search).has("invite") ? invite() : null)));
  $("#code")?.focus();

  oplo.load().then(async connect => {
    go.disabled = false;
    if (!connect.pending) return;
    // The Oplo tab has finished and connect.js has refreshed this page: what is left is to trade that sign-in for Roxan's own.
    go.disabled = true;
    lead.textContent = "Finishing your sign-in…";
    try { await oplo.signIn(); connect.done(); await boot(); }
    catch (x) { connect.done(); lead.textContent = LEAD; err.textContent = x.message; go.disabled = false; }
  }, x => { err.textContent = x.message; go.disabled = false; });
}

async function signOut() {
  try { await api.signOut(); } catch { /* the cookie is cleared by the server; a failure here leaves nothing worse than staying signed in */ }
  gate("signin");
}

/* ------------------------------------------------------------ routing */

let token = 0, current = null;
async function route() {
  const path = location.hash.replace(/^#/, "") || "/";
  const r = ROUTES.find(x => x.re.test(path)) || MISSING;
  const params = (r.re.exec(path) || []).slice(1);
  const mine = ++token;
  if (typeof current === "function") current();
  current = null;
  nav(r.nav);
  markCurrent();
  document.title = `${r.title} — ${who()}`;
  fill(main, banner);
  let mod;
  try { mod = await r.load(); } catch { mod = await MISSING.load(); }
  if (mine !== token) return;
  const view = h("div", { class: `view view-${r.nav || "none"}` });
  main.append(view);
  current = await mod.mount(view, { app, params });
  if (mine !== token && typeof current === "function") { current(); current = null; }
  if (!document.activeElement || document.activeElement === document.body) main.focus({ preventScroll: true });
}

/* ------------------------------------------------------------ start */

async function enter() {
  shell();
  paintBrand(); paintStatus(); paintCounts(); paintChats(); paintBanner(); paintBell();
  document.documentElement.dataset.signedin = "";
  if (!wired) {
    wired = true;
    initTips();
    addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k" && document.documentElement.dataset.signedin != null) { e.preventDefault(); openCommands(); } });
    on("toast", e => toast(e.detail));
    on("said", e => said(e.detail));
    on("signedout", () => { stop(); gate("signin"); });
    addEventListener("hashchange", route);
    $(".skip").addEventListener("click", e => { e.preventDefault(); main.focus(); });          // a #hash here would be taken for a route
    // a change called "all" (the first load, or a fresh one after a lost connection) reaches every watcher
    watch("settings", () => { paintBrand(); document.title = `${document.title.split(" — ")[0]} — ${who()}`; });
    watch("status", soon(paintStatus));
    watch(["threads", "projects"], soon(paintChats));
    watch(["seen", "approvals", "questions"], soon(paintBell));
    watch("live", paintBanner);
    setInterval(() => document.querySelectorAll(".rail .k-age").forEach(el => { el.textContent = brief(+el.dataset.at); }), 60_000);   // "now" must not stay "now"
    watch(["seen", "goals", "routines", "panels", "approvals", "questions", "projects"], soon(paintCounts));
  }
  // Routines run in the person's time zone, and a new account starts in UTC: take this device's, once.
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (S.settings.tz === "UTC" && zone && zone !== "UTC" && !(await local.getMeta("tz:auto"))) {
    await local.setMeta("tz:auto", true);
    api.put("/settings", { tz: zone }).catch(() => {});
  }
  await route();
}

async function boot() {
  app.persistent = await db.open();
  app.notify = Boolean(await local.getMeta("notify"));
  app.rail = Boolean(await local.getMeta("rail"));
  const hl = await api.health();
  if (!hl.ok) return gate("offline", hl.offline ? "" : "Roxan is busy. Try again in a minute.");
  if (hl.gateway !== "open") return gate("closed");
  if (hl.access !== true) return gate("signin");
  try { await start(); }
  catch (e) { return e.status === 401 ? gate("signin") : gate("offline", e.message); }
  await enter();
}

boot();
