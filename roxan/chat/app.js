/* Roxan's app: the rail, the router, signing in, and what every page shares.
   Each page is a module with mount(root, { app, params }) that returns a
   cleanup function. What Roxan knows lives in state.js; pages read it there. */
import * as db from "./db.js";
import { h, fill, $, on, emit } from "./dom.js";
import * as api from "./api.js";
import * as local from "./local.js";
import { S, MAIN, start, stop, watch, chats, waiting, name as who } from "./state.js";
import { icon } from "./icons.js";
import { mark } from "./mark.js";
import { soon, sure } from "./ui.js";

export const app = {
  persistent: false,
  prefill: null,                                       // text a page leaves for the composer to open with
  notify: false,                                       // whether this device may pop up a notice while the tab is in the background
  go(path) { location.hash = "#" + path; },
};

// The rail, in the order it is drawn. Chats are drawn under Chat, from what Roxan has.
const NAV = [
  [null, [["home", "Today", "/"], ["chat", "Chat", "/chat"]]],
  ["Work", [["goals", "Goals", "/goals"], ["schedule", "Routines", "/routines"], ["panels", "Panels", "/panels"], ["needs", "Needs you", "/needs"]]],
  ["Know", [["memory", "Memory", "/memory"], ["specialties", "Specialties", "/specialties"], ["projects", "Projects", "/projects"], ["handoff", "Handoff", "/handoff"], ["vault", "Vault", "/vault"]]],
  ["Control", [["access", "Access", "/access"], ["activity", "Activity", "/activity"], ["settings", "Settings", "/settings"]]],
];
const ROUTES = [
  { re: /^\/?$/, nav: "home", title: "Today", load: () => import("./views/today.js") },
  { re: /^\/chat$/, nav: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/c\/([\w-]+)$/, nav: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/goals(?:\/([\w-]+))?$/, nav: "goals", title: "Goals", load: () => import("./views/goals.js") },
  { re: /^\/routines$/, nav: "schedule", title: "Routines", load: () => import("./views/routines.js") },
  { re: /^\/panels(?:\/([\w-]+))?$/, nav: "panels", title: "Panels", load: () => import("./views/panels.js") },
  { re: /^\/needs$/, nav: "needs", title: "Needs you", load: () => import("./views/needs.js") },
  { re: /^\/memory$/, nav: "memory", title: "Memory", load: () => import("./views/memory.js") },
  { re: /^\/specialties$/, nav: "specialties", title: "Specialties", load: () => import("./views/specialties.js") },
  { re: /^\/projects$/, nav: "projects", title: "Projects", load: () => import("./views/projects.js") },
  { re: /^\/p\/([\w-]+)$/, nav: "projects", title: "Project", load: () => import("./views/projects.js") },
  { re: /^\/handoff$/, nav: "handoff", title: "Handoff", load: () => import("./views/handoff.js") },
  { re: /^\/vault$/, nav: "vault", title: "Vault", load: () => import("./views/vault.js") },
  { re: /^\/access$/, nav: "access", title: "Access", load: () => import("./views/access.js") },
  { re: /^\/activity$/, nav: "activity", title: "Activity", load: () => import("./views/activity.js") },
  { re: /^\/settings$/, nav: "settings", title: "Settings", load: () => import("./views/settings.js") },
];
const MISSING = { nav: "", title: "Not found", re: /(?:)/, load: async () => ({ mount: root => { root.append(h("section", { class: "page" }, h("h1", { class: "page-title", text: "That page is not here." }), h("a", { class: "go", href: "#/" }, "Go to Today ", h("i", { "aria-hidden": "true" })))); } }) };
const SHOWN = 6;                                       // chats listed under Chat in the rail; Projects has the rest

let main, banner, brandMark, brandName, status, counts, chatList;
let wired = false;

/* ------------------------------------------------------------ the rail */

function shell() {
  const root = $("#shell");
  counts = {};
  const entry = ([key, label, path]) => {
    const n = h("span", { class: "count", "aria-hidden": "true" });
    counts[key] = n;
    const link = h("a", { href: "#" + path, data: { nav: key } }, icon(key), h("span", { class: "t", text: label }), n);
    return key === "chat" ? h("li", null, link, chatList = h("ul", { class: "chat-list" })) : h("li", null, link);
  };
  const sections = NAV.map(([title, items], i) => h("section", { class: "rail-sec", "aria-labelledby": "rail-h" + i },
    h("h2", { class: title ? "rail-label" : "sr", id: "rail-h" + i, text: title || "Roxan" }), h("ul", null, items.map(entry))));

  brandMark = h("span", { class: "rail-glyph" });
  brandName = h("span", { class: "rail-name" });
  status = h("p", { class: "rail-status", role: "status" });
  const out = sure("Sign out", signOut, { confirm: "Confirm sign out", cls: "rail-link" });
  const rail = h("aside", { class: "rail" },
    h("a", { class: "rail-brand", href: "#/", "aria-label": "Today" }, brandMark, brandName),
    status,
    h("nav", { "aria-label": "Roxan" }, sections),
    h("div", { class: "rail-foot" }, h("p", { class: "rail-links" }, h("a", { class: "rail-link", href: "/help/", text: "Help" }), h("a", { class: "rail-link", href: "/", text: "roxan.oplocloud.com" }), out)));
  banner = h("p", { class: "banner", role: "status", hidden: true });
  main = h("main", { id: "main", tabindex: "-1" }, banner);
  fill(root, rail, main);
}

function paintBrand() {
  fill(brandMark, mark(S.settings.mark));
  brandName.textContent = who();
}

function paintStatus() {
  const s = S.status;
  status.dataset.state = s.state;
  status.textContent = status.title = s.text || "Ready";
}

function paintCounts() {
  const n = {
    chat: S.unread,
    goals: S.goals.filter(g => g.state === "active").length,
    schedule: S.routines.filter(r => r.state === "active").length,
    panels: S.panels.length,
    needs: waiting().length,
    memory: S.memories.filter(m => m.state === "active").length,
    specialties: S.specialties.length,
    projects: S.projects.filter(p => p.state === "open").length,
    handoff: S.handoffs.filter(x => x.state === "queued").length,
  };
  for (const [k, el] of Object.entries(counts)) el.textContent = n[k] ? String(n[k]) : "";
  document.querySelector('[data-nav="needs"]')?.toggleAttribute("data-alert", n.needs > 0);
}

function paintChats() {
  const list = chats();
  fill(chatList, list.slice(0, SHOWN).map(t => h("li", null, h("a", { href: "#/c/" + t.id, data: { chat: t.id }, title: t.title || "New chat" }, h("span", { class: "t", text: t.title || "New chat" })))),
    h("li", null, h("button", { class: "tree-new", type: "button", text: "New chat", onclick: newChat })),
    list.length > SHOWN ? h("li", null, h("a", { class: "tree-more", href: "#/projects", text: `All ${list.length} chats` })) : null);
  markCurrent();
}

async function newChat() {
  try {
    const { item } = await api.post("/items", { kind: "thread" });
    app.go("/c/" + item.id);
  } catch (e) { toast({ text: e.message, tone: "error" }); }
}

const nav = name => document.querySelectorAll("[data-nav]").forEach(a => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
function markCurrent() {
  const m = /^#\/c\/([\w-]+)$/.exec(location.hash);
  document.querySelectorAll("[data-chat]").forEach(a => (m && a.dataset.chat === m[1] ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}

function paintBanner() {
  const words = S.live === "live" ? "" : S.live === "polling" ? "Live updates are not reaching this page, so it checks every few seconds instead." : "Reconnecting…";
  banner.hidden = !words;
  banner.textContent = words;
}

/* ------------------------------------------------------------ toasts */

function toast({ text, sub, tone = "info", href }) {
  const box = $("#toasts");
  const el = h("div", { class: "toast", data: { tone } },
    h("div", null, sub ? h("p", { class: "label", text: sub }) : null, h("p", { class: "toast-text", text }), href ? h("a", { class: "go sm", href }, "Open ", h("i", { "aria-hidden": "true" })) : null),
    h("button", { class: "x", type: "button", "aria-label": "Dismiss", text: "×", onclick: () => el.remove() }));
  box.append(el);
  if (tone !== "error") setTimeout(() => el.remove(), 8000);
  else setTimeout(() => el.remove(), 14000);
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

/* ------------------------------------------------------------ signing in and out */

function gate(why, note = "") {
  stop();
  const body = {
    offline: [h("h1", { class: "page-title", text: "Roxan cannot be reached." }), h("p", { class: "page-lead", text: note || "Check your connection. Nothing is lost: what Roxan keeps is kept on its side." }), h("div", { class: "btns" }, h("button", { class: "btn", type: "button", text: "Try again", onclick: boot }))],
    closed: [h("h1", { class: "page-title", text: "Roxan is not open yet." }), h("p", { class: "page-lead", text: "Roxan is in a closed beta and the doors have not been opened. The status page says when they are." }), h("div", { class: "btns" }, h("a", { class: "btn ghost", href: "/status/", text: "Status" }))],
  }[why];
  if (body) return fill($("#shell"), h("main", { id: "main", class: "boot signin" }, h("section", { class: "gatebox" }, h("span", { class: "label", text: "Roxan" }), body)));

  const input = h("input", { id: "code", name: "code", type: "password", autocomplete: "current-password", autocapitalize: "off", spellcheck: "false", "aria-label": "Invite code", placeholder: "Invite code", required: true });
  const err = h("p", { class: "err", role: "alert" });
  const go = h("button", { class: "btn", type: "submit", text: "Sign in" });
  const form = h("form", { class: "gate-form" }, input, go);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!input.value.trim()) return;
    go.disabled = true;
    err.textContent = "";
    try { await api.signIn(input.value.trim()); input.value = ""; await boot(); }
    catch (x) { err.textContent = x.message; go.disabled = false; input.select(); }
  });
  fill($("#shell"), h("main", { id: "main", class: "boot signin" }, h("section", { class: "gatebox" },
    h("span", { class: "label", text: "Roxan" }), h("h1", { class: "page-title", text: "Sign in." }),
    h("p", { class: "page-lead", text: "Roxan is in a closed beta. Type the invite code you were given. It is traded for a sign-in that lasts four weeks on this browser, and the code itself is not kept." }),
    form, err, h("p", { class: "fine" }, "No code? ", h("a", { class: "link", href: "/pricing/", text: "See how to ask for one" }), "."))));
  input.focus();
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
  paintBrand(); paintStatus(); paintCounts(); paintChats(); paintBanner();
  document.documentElement.dataset.signedin = "";
  if (!wired) {
    wired = true;
    on("toast", e => toast(e.detail));
    on("said", e => said(e.detail));
    on("signedout", () => { stop(); gate("signin"); });
    addEventListener("hashchange", route);
    $(".skip").addEventListener("click", e => { e.preventDefault(); main.focus(); });          // a #hash here would be taken for a route
    // a change called "all" (the first load, or a fresh one after a lost connection) reaches every watcher
    watch("settings", () => { paintBrand(); document.title = `${document.title.split(" — ")[0]} — ${who()}`; });
    watch("status", soon(paintStatus));
    watch("threads", soon(paintChats));
    watch("live", paintBanner);
    watch(["seen", "goals", "routines", "panels", "approvals", "questions", "memories", "specialties", "projects", "handoffs"], soon(paintCounts));
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
  const hl = await api.health();
  if (!hl.ok) return gate("offline", hl.offline ? "" : "Roxan is busy. Try again in a minute.");
  if (hl.gateway !== "open") return gate("closed");
  if (hl.access !== true) return gate("signin");
  try { await start(); }
  catch (e) { return e.status === 401 ? gate("signin") : gate("offline", e.message); }
  await enter();
}

boot();
