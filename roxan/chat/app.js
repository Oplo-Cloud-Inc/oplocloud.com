/* Roxan's app: the rail, the router, and what every view shares. Each view is a
   module with mount(root, { app, params }) that returns a cleanup function. */
import * as db from "./db.js";
import { h, $, on, emit } from "./dom.js";
import * as store from "./store.js";
import * as api from "./api.js";
import * as proposals from "./proposals.js";
import * as remind from "./remind.js";
import * as memory from "./memory.js";
import { icon } from "./icons.js";

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

// The rail, in the order it is drawn. A null path is something not built yet: it is named, marked Soon, and goes nowhere.
const SECTIONS = [
  ["Personal", [["home", "Home", "/"], ["chat", "Chat", "/chat"], ["projects", "Projects", "/projects"]]],
  ["Workspace", [["handoff", "Handoff", "/handoff"], ["actions", "Action Center", "/actions"], ["specialties", "Specialties", "/specialties"], ["schedule", "Scheduled Tasks", "/schedule"], ["panels", "Panels", null]]],
  ["Manage", [["memory", "Memory", "/memory"], ["vault", "Vault", "/vault"], ["integrations", "Integrations", null], ["activity", "Activity", "/activity"]]],
];
const ROUTES = [
  { re: /^\/?$/, name: "home", title: "Home", load: () => import("./views/home.js") },
  { re: /^\/chat$/, name: "chat", title: "Chat", load: () => import("./views/chat.js") },
  { re: /^\/c\/([\w-]+)$/, name: "conversation", title: "Conversation", load: () => import("./views/chat.js") },
  { re: /^\/p\/([\w-]+)$/, name: "project", title: "Project", load: () => import("./views/project.js") },
  { re: /^\/projects(?:\/(new))?$/, name: "projects", title: "Projects", load: () => import("./views/projects.js") },
  { re: /^\/actions$/, name: "actions", title: "Action Center", load: () => import("./views/actions.js") },
  { re: /^\/handoff$/, name: "handoff", title: "Handoff", load: () => import("./views/handoff.js") },
  { re: /^\/handoff\/([\w-]+)$/, name: "handoff-item", title: "Handoff", load: () => import("./views/handoff.js") },       // /handoff/new opens the list with the form
  { re: /^\/specialties$/, name: "specialties", title: "Specialties", load: () => import("./views/specialties.js") },
  { re: /^\/vault$/, name: "vault", title: "Vault", load: () => import("./views/vault.js") },
  { re: /^\/memory$/, name: "memory", title: "Memory", load: () => import("./views/memory.js") },
  { re: /^\/schedule$/, name: "schedule", title: "Scheduled Tasks", load: () => import("./views/schedule.js") },
  { re: /^\/activity$/, name: "activity", title: "Activity", load: () => import("./views/activity.js") },
  { re: /^\/settings$/, name: "settings", title: "Settings", load: () => import("./views/settings.js") },
];
const MISSING = { name: "", title: "Not found", re: /(?:)/, load: async () => ({ mount: root => { root.append(h("section", { class: "page" }, h("h1", { class: "page-title", text: "That page is not here." }), h("a", { class: "go", href: "#/" }, "Go home ", h("i", { "aria-hidden": "true" })))); } }) };

const GATEWAY_WORDS = { checking: "Checking", offline: "Offline", busy: "Busy", closed: "Not open yet" };
const SHOWN = 8;                                   // conversations listed under a project in the rail; the project page has the rest
const SHOWN_HANDOFFS = 6;                          // recent Handoffs listed in the rail; the Handoff page has the rest
const FOLDS = new Set(["projects", "handoff"]);    // the rail entries that unfold into a list
let main, banner, status, who, signBtn, counts = {};
const trees = {}, heads = {};                      // for each unfoldable entry: the <li> it lives in, and its link
const open = new Set(["projects", "handoff"]);     // what is unfolded in the rail: "projects", "handoff", and project ids

function shell() {
  const root = $("#shell");
  counts = {};
  const entry = ([name, label, path]) => {
    if (!path) return h("li", null, h("span", { class: "soon", title: "Not built yet" }, icon(name), h("span", { class: "t", text: label }), h("small", { text: "Soon" })));
    const count = h("span", { class: "count", "aria-hidden": "true" });
    counts[name] = count;
    const link = h("a", { href: "#" + path, data: { nav: name } }, icon(name), h("span", { class: "t", text: label }), count);
    if (!FOLDS.has(name)) return h("li", null, link);
    heads[name] = link;
    return (trees[name] = h("li", { class: "tree-item" }));
  };
  const sections = SECTIONS.map(([title, items], i) => h("section", { class: "rail-sec", "aria-labelledby": "rail-h" + i },
    h("h2", { class: "rail-label", id: "rail-h" + i, text: title }), h("ul", null, items.map(entry))));

  status = h("p", { class: "rail-status" });
  who = h("p", { class: "fine" });
  signBtn = h("button", { class: "rail-link", type: "button" });
  const rail = h("aside", { class: "rail" },
    h("a", { class: "rail-brand", href: "/", "aria-label": "Roxan, back to the site" }, h("span", { class: "mark" }), h("span", { text: "Roxan" })),
    h("nav", { "aria-label": "Roxan" }, sections),
    h("div", { class: "rail-foot" }, status,
      h("div", { class: "rail-who" }, h("p", { class: "who-name", text: "Personal workspace" }), who),
      h("p", { class: "rail-links" }, h("a", { class: "rail-link", href: "#/settings", data: { nav: "settings" }, text: "Settings" }), h("a", { class: "rail-link", href: "/help/", text: "Help" }), signBtn)));
  banner = h("p", { class: "banner", role: "status", hidden: true });
  main = h("main", { id: "main", tabindex: "-1" }, banner);
  root.replaceChildren(rail, main);
  signBtn.addEventListener("click", signOut);
}

/* ------------------------------------------------------------ Projects and Handoffs in the rail */
let treeToken = 0;
async function drawTree() {
  const mine = ++treeToken;
  const [rooms, handoffs] = await Promise.all([db.all("rooms"), db.all("handoffs")]);
  if (mine !== treeToken) return;                  // a newer draw is already on its way
  const projects = rooms.filter(r => r.kind === "project").sort((a, b) => b.updatedAt - a.updatedAt);
  const by = new Map();
  for (const s of rooms.filter(r => r.kind === "session").sort((a, b) => b.updatedAt - a.updatedAt)) by.set(s.projectId, [...(by.get(s.projectId) || []), s]);

  const fold = async id => {
    if (!open.delete(id)) open.add(id);
    store.setMeta("rail:open", [...open]);
    await drawTree();
    document.querySelector(`.twisty[data-fold="${id}"]`)?.focus();          // the button was rebuilt; keep a keyboard user where they were
  };
  const row = (link, id, what) => h("div", { class: "tree-row" }, link, h("button", { class: "twisty", type: "button", data: { fold: id }, "aria-expanded": String(open.has(id)), "aria-label": what, onclick: () => fold(id) }));       // the name stays put; aria-expanded says which way it is
  const fresh = async id => { const s = await store.newSession(id); open.add(id); app.go("/c/" + s.id); };
  const leaf = (s, href, key) => h("li", null, h("a", { href, data: { [key]: s.id }, title: s.name }, h("span", { class: "t", text: s.name })));

  const list = !open.has("projects") ? null : h("ul", { id: "tree-projects" },
    projects.map(p => {
      const kids = by.get(p.id) || [];
      return h("li", null, row(h("a", { href: "#/p/" + p.id, data: { proj: p.id }, title: p.name }, h("span", { class: "t", text: p.name })), p.id, `Conversations in ${p.name}`),
        !open.has(p.id) ? null : h("ul", null,
          kids.slice(0, SHOWN).map(s => leaf(s, "#/c/" + s.id, "room")),
          kids.length > SHOWN ? h("li", null, h("a", { class: "tree-more", href: "#/p/" + p.id, text: `All ${kids.length} conversations` })) : null,
          h("li", null, h("button", { class: "tree-new", type: "button", text: "New conversation", onclick: () => fresh(p.id) }))));
    }),
    h("li", null, h("a", { class: "tree-new", href: "#/projects/new", text: "New project" })));
  trees.projects.replaceChildren(...[row(heads.projects, "projects", "Project list"), list].filter(Boolean));       // a folded list is null, and replaceChildren would write it out as the word "null"

  const recent = handoffs.filter(x => x.state !== "dropped").sort((a, b) => b.updatedAt - a.updatedAt);
  const saved = !open.has("handoff") ? null : h("ul", { id: "tree-handoff" },
    recent.slice(0, SHOWN_HANDOFFS).map(x => h("li", null, h("a", { href: "#/handoff/" + x.id, data: { handoff: x.id }, title: x.title }, h("span", { class: "t", text: x.title })))),
    recent.length > SHOWN_HANDOFFS ? h("li", null, h("a", { class: "tree-more", href: "#/handoff", text: `All ${recent.length} Handoffs` })) : null,
    h("li", null, h("a", { class: "tree-new", href: "#/handoff/new", text: "New Handoff" })));
  trees.handoff.replaceChildren(...[row(heads.handoff, "handoff", "Recent Handoffs"), saved].filter(Boolean));
  markCurrent();
}

// The conversation or project you are looking at is marked in the rail, and unfolded if it was folded.
function markCurrent() {
  const m = /^#\/([pc])\/([\w-]+)$/.exec(location.hash), x = /^#\/handoff\/([\w-]+)$/.exec(location.hash);
  document.querySelectorAll("[data-room], [data-proj]").forEach(a => {
    const here = m && (m[1] === "c" ? a.dataset.room === m[2] : a.dataset.proj === m[2]);
    if (here) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-handoff]").forEach(a => {
    if (x && a.dataset.handoff === x[1]) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
async function reveal() {
  const x = /^#\/handoff\/([\w-]+)$/.exec(location.hash);
  if (x && x[1] !== "new" && !open.has("handoff")) { open.add("handoff"); await drawTree(); return; }
  const m = /^#\/([pc])\/([\w-]+)$/.exec(location.hash);
  if (!m) return;
  const room = await store.getRoom(m[2]);
  const id = room?.kind === "session" ? room.projectId : room?.id;
  if (id && !(open.has(id) && open.has("projects"))) { open.add(id); open.add("projects"); await drawTree(); }
}

/* ------------------------------------------------------------ Account */
let armed = 0;
function paintAccount() {
  who.textContent = app.invite ? "Invite code kept on this device" : "No invite code on this device";
  signBtn.textContent = app.invite ? "Sign out" : "Sign in";
  delete signBtn.dataset.armed;
}
async function signOut() {
  if (!app.invite) { app.go("/settings"); return; }
  if (!armed) { signBtn.textContent = "Confirm sign out"; signBtn.dataset.armed = "1"; armed = setTimeout(() => { armed = 0; paintAccount(); }, 5000); return; }       // a second press within five seconds
  clearTimeout(armed);
  armed = 0;
  await store.delMeta("invite");
  app.invite = null;
  await app.refresh();
  paintAccount();
  toast({ text: "Signed out. Your conversations stay on this device.", sub: "Sign out" });
}

async function updateCounts() {
  const [pending, notes, reminders, handoffs, specialties] = await Promise.all([proposals.pending(), db.all("memories"), db.all("reminders"), db.all("handoffs"), db.all("specialties")]);
  const n = {
    actions: pending.length, memory: memory.live(notes).length, schedule: reminders.filter(r => r.state === "scheduled").length,
    handoff: handoffs.filter(x => x.state === "waiting").length, specialties: specialties.filter(s => !s.deleted && s.on !== false).length,
  };
  for (const [k, el] of Object.entries(counts)) el.textContent = n[k] ? String(n[k]) : "";
}

function paintStatus() {
  const g = app.gateway;
  status.textContent = g.state === "open" ? (g.access ? "Connected" : "Invite needed") : GATEWAY_WORDS[g.state] || "";
  status.dataset.state = g.state === "open" && g.access ? "ok" : "off";
  paintAccount();
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
  markCurrent();
  reveal();
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
  try { await store.migrateLegacy(); } catch { /* it only copies, so a failed move is simply tried again next time */ }
  app.invite = await store.getMeta("invite");
  const saved = await store.getMeta("rail:open");
  if (Array.isArray(saved)) { open.clear(); saved.forEach(id => open.add(id)); }
  await proposals.expireStale();
  shell();
  if (!app.persistent) {
    banner.hidden = false;
    banner.textContent = "This browser is not letting Roxan keep anything on this device, so what you write here is lost when you close the tab. A private window can cause this.";
  }
  $(".skip").addEventListener("click", e => { e.preventDefault(); main.focus(); });          // a #hash here would be taken for a route
  on("gateway", paintStatus);
  on("toast", e => toast(e.detail));
  on("rooms", drawTree);
  on("handoffs", drawTree);
  for (const ev of ["proposal", "memories", "reminders", "handoffs", "specialties"]) on(ev, updateCounts);
  paintStatus();
  updateCounts();
  await drawTree();
  remind.start();
  addEventListener("hashchange", route);
  addEventListener("online", () => app.refresh());
  addEventListener("focus", () => app.refresh());
  setInterval(() => app.refresh(), 60_000);
  app.refresh();
  await route();
}

boot();
