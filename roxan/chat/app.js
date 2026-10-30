/* Roxan's app: the rail, the router, and what every view shares. Each view is a
   module with mount(root, { app, params }) that returns a cleanup function. */
import * as db from "./db.js";
import { h, $, on, emit } from "./dom.js";
import * as store from "./store.js";
import * as api from "./api.js";
import * as proposals from "./proposals.js";
import * as remind from "./remind.js";
import * as memory from "./memory.js";

export const app = {
  invite: null,
  gateway: { state: "checking" },
  persistent: false,
  canChat() { return this.gateway.state === "open" && this.gateway.access === true && Boolean(this.invite); },
  go(path) { location.hash = "#" + path; },
  async refresh() {
    const r = await api.health(this.invite);
    this.gateway = r.state === "open" ? { state: "open", access: Boolean(this.invite) && r.access === true } : { state: r.state };
    emit("gateway");
  },
};

const NAV = [
  ["home", "Home", "/"], ["chat", "Chat", "/chat"], ["projects", "Projects", "/projects"], ["memory", "Memory", "/memory"],
  ["schedule", "Schedule", "/schedule"], ["activity", "Activity", "/activity"], ["settings", "Settings", "/settings"],
];
const ROUTES = [
  { re: /^\/?$/, name: "home", title: "Home", load: () => import("./views/home.js") },
  { re: /^\/chat$/, name: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/p\/([\w-]+)$/, name: "projects", title: "Project", load: () => import("./views/chat.js") },
  { re: /^\/projects$/, name: "projects", title: "Projects", load: () => import("./views/projects.js") },
  { re: /^\/memory$/, name: "memory", title: "Memory", load: () => import("./views/memory.js") },
  { re: /^\/schedule$/, name: "schedule", title: "Schedule", load: () => import("./views/schedule.js") },
  { re: /^\/activity$/, name: "activity", title: "Activity", load: () => import("./views/activity.js") },
  { re: /^\/settings$/, name: "settings", title: "Settings", load: () => import("./views/settings.js") },
];
const MISSING = { name: "", title: "Not found", re: /(?:)/, load: async () => ({ mount: root => { root.append(h("section", { class: "page" }, h("p", { class: "label", text: "Not found" }), h("h1", { class: "page-title", text: "That page is not here." }), h("a", { class: "go", href: "#/" }, "Go home ", h("i", { text: "→" })))); } }) };

const GATEWAY_WORDS = { checking: "Checking", offline: "Offline", busy: "Busy", closed: "Not open yet" };
let main, banner, status, counts = {};

function shell() {
  const root = $("#shell");
  const links = NAV.map(([name, label, path]) => {
    const count = h("span", { class: "count", "aria-hidden": "true" });
    counts[name] = count;
    return h("li", null, h("a", { href: "#" + path, data: { nav: name } }, h("span", { text: label }), count));
  });
  status = h("p", { class: "rail-status" });
  const rail = h("aside", { class: "rail" },
    h("a", { class: "rail-brand", href: "/", "aria-label": "Roxan, back to the site" }, h("span", { class: "mark" }), h("span", { text: "Roxan" })),
    h("nav", { "aria-label": "Roxan" }, h("ul", null, links)),
    h("div", { class: "rail-foot" }, status, h("a", { class: "rail-link", href: "/help/", text: "Help" }), h("a", { class: "rail-link", href: "/security/", text: "Security" })));
  banner = h("p", { class: "banner", role: "status", hidden: true });
  main = h("main", { id: "main", tabindex: "-1" }, banner);
  root.replaceChildren(rail, main);
}

async function updateCounts() {
  const [pending, notes, reminders] = await Promise.all([proposals.pending(), db.all("memories"), db.all("reminders")]);
  const n = { home: pending.length, memory: memory.live(notes).length, schedule: reminders.filter(r => r.state === "scheduled").length };
  for (const [k, el] of Object.entries(counts)) el.textContent = n[k] ? String(n[k]) : "";
}

function paintStatus() {
  const g = app.gateway;
  status.textContent = g.state === "open" ? (g.access ? "Connected" : "Invite needed") : GATEWAY_WORDS[g.state] || "";
  status.dataset.state = g.state === "open" && g.access ? "ok" : "off";
}

function toast({ text, sub, tone = "info" }) {
  const box = $("#toasts");
  const el = h("div", { class: "toast", data: { tone } },
    h("div", null, sub ? h("p", { class: "label", text: sub }) : null, h("p", { class: "toast-text", text })),
    h("button", { class: "x", type: "button", "aria-label": "Dismiss", text: "×", onclick: () => el.remove() }));
  box.append(el);
  if (tone === "info") setTimeout(() => el.remove(), 7000);
}

let token = 0, current = null;
async function route() {
  const path = location.hash.replace(/^#/, "") || "/";
  const r = ROUTES.find(x => x.re.test(path)) || MISSING;
  const params = (r.re.exec(path) || []).slice(1);
  const mine = ++token;
  if (typeof current === "function") current();
  current = null;
  $$nav(r.name);
  document.title = `${r.title} — Roxan`;
  main.replaceChildren(banner);
  let mod;
  try { mod = await r.load(); } catch { mod = await MISSING.load(); }
  if (mine !== token) return;
  const view = h("div", { class: `view view-${r.name || "none"}` });
  main.append(view);
  current = await mod.mount(view, { app, params });
  if (mine !== token && typeof current === "function") { current(); current = null; }
  if (!document.activeElement || document.activeElement === document.body) main.focus({ preventScroll: true });
}
function $$nav(name) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.dataset.nav === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

async function boot() {
  app.persistent = await db.open();
  await store.ensureMain();
  app.invite = await store.getMeta("invite");
  await proposals.expireStale();
  shell();
  if (!app.persistent) {
    banner.hidden = false;
    banner.textContent = "This browser is not letting Roxan keep anything on this device, so what you write here is lost when you close the tab. A private window can cause this.";
  }
  $(".skip").addEventListener("click", e => { e.preventDefault(); main.focus(); });          // a #hash here would be taken for a route
  on("gateway", paintStatus);
  on("toast", e => toast(e.detail));
  for (const ev of ["proposal", "memories", "reminders"]) on(ev, updateCounts);
  paintStatus();
  updateCounts();
  remind.start();
  addEventListener("hashchange", route);
  addEventListener("online", () => app.refresh());
  addEventListener("focus", () => app.refresh());
  setInterval(() => app.refresh(), 60_000);
  app.refresh();
  await route();
}

boot();
