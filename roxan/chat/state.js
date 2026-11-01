/* What the page knows about Roxan, and how it stays true.

   The server is the source of truth. The page takes a snapshot when it opens
   (load), then listens on a WebSocket for everything after it: items changing,
   a reply growing word by word, the status line. If a socket cannot be had it
   asks again every few seconds instead, so the page gets slower, never wrong.
   Views do not fetch lists themselves: they read S and watch() for change. */
import { emit, on } from "./dom.js";
import * as api from "./api.js";

export const MAIN = "main";
const KEYS = { thread: "threads", project: "projects", goal: "goals", routine: "routines", memory: "memories", panel: "panels", idea: "ideas", handoff: "handoffs", specialty: "specialties", rule: "rules", approval: "approvals", question: "questions" };
const PAGE = 40;

const fresh = () => ({
  ready: false, live: "off",                     // live: "live" when the socket is open, "polling" when asking instead, "off" while it reconnects
  now: 0, open: false, seen: 0, unread: 0,
  settings: { name: "Roxan", mark: "roxan", tone: "direct", learning: true, level: "balanced", quiet: null, tz: "UTC", paused: false, onboarded: false },
  status: { state: "idle", text: "" },
  usage: {}, limits: { chat: 300, runs: 30 }, caps: [], levels: {},
  threads: [], projects: [], goals: [], routines: [], memories: [], panels: [], ideas: [], handoffs: [], specialties: [], rules: [], approvals: [], questions: [], events: [],
  msgs: new Map(),                               // conversation id → { list, more, loaded }
});
export const S = fresh();
export const clear = () => { Object.assign(S, fresh()); counted.clear(); };

const counted = new Set();
const changed = (what, detail = {}) => emit("change", { what, ...detail });

// watch("goals", fn) or watch(["goals", "routines"], fn): fn runs when those change; returns the way to stop.
export function watch(what, fn) {
  const list = [].concat(what);
  return on("change", e => { if (e.detail.what === "all" || list.includes(e.detail.what)) fn(e.detail); });
}

/* ------------------------------------------------------------ reading */

export const find = id => Object.values(KEYS).map(k => S[k]).flat().find(x => x.id === id) || null;
export const name = () => S.settings.name || "Roxan";
export const chats = () => S.threads.filter(t => t.id !== MAIN && t.state !== "archived");
export const waiting = () => [...S.approvals.filter(a => a.state === "awaiting"), ...S.questions.filter(q => q.state === "awaiting")].sort((a, b) => b.created - a.created);
export const live = list => list.filter(x => x.state !== "removed");

/* ------------------------------------------------------------ keeping true */

function upsert(it) {
  const key = KEYS[it.kind];
  if (!key) return;
  const list = S[key], i = list.findIndex(x => x.id === it.id);
  if (i < 0) list.push(it);
  else { if (it.kind === "thread") it.last = list[i].last; list[i] = it; }
  list.sort((a, b) => b.updated - a.updated);
  changed(key, { id: it.id });
}

function gone(id) {
  for (const key of Object.values(KEYS)) {
    const i = S[key].findIndex(x => x.id === id);
    if (i < 0) continue;
    S[key].splice(i, 1);
    if (key === "threads") S.msgs.delete(id);
    changed(key, { id, removed: true });
  }
}

const at = (list, id) => { for (let i = list.length - 1; i >= 0; i--) if (list[i].id === id) return i; return -1; };

function message(m) {
  const box = S.msgs.get(m.thread);
  if (box) {
    const i = at(box.list, m.id);
    if (i < 0) { box.list.push(m); box.list.sort((a, b) => a.id - b.id); } else box.list[i] = m;
  }
  const th = S.threads.find(t => t.id === m.thread);
  if (th && m.role !== "note") th.last = { role: m.role, text: m.text.replace(/\s+/g, " ").slice(0, 90), at: m.at };
  if (m.thread === MAIN && m.role === "assistant" && m.from && m.at > S.seen && !counted.has(m.id)) { counted.add(m.id); S.unread++; changed("seen"); }
  changed("messages", { thread: m.thread, id: m.id });
}

function unsay(thread, id) {
  const box = S.msgs.get(thread);
  if (!box) return;
  const i = at(box.list, id);
  if (i >= 0) box.list.splice(i, 1);
  changed("messages", { thread, id, removed: true });
}

// Ask for a conversation again, once at a time, when a live piece does not fit what the page has.
const mending = new Set();
function mend(thread) {
  if (!S.msgs.has(thread) || mending.has(thread)) return;
  mending.add(thread);
  ensure(thread, true).catch(() => {}).finally(() => mending.delete(thread));
}

export function apply(m) {
  switch (m.t) {
    case "item": return upsert(m.item);
    case "gone": return gone(m.id);
    case "msg": return message(m.message);
    case "msgGone": return unsay(m.thread, m.id);
    case "delta": {
      const box = S.msgs.get(m.thread), i = box ? at(box.list, m.id) : -1;
      if (i < 0) return mend(m.thread);
      const cur = box.list[i], have = cur.text.length;
      if (m.at > have) return mend(m.thread);                       // a piece went missing: take the whole reply again
      if (m.at + m.text.length <= have) return;                     // already part of what was fetched
      cur.text += m.text.slice(have - m.at);
      return changed("delta", { thread: m.thread, id: m.id });
    }
    case "steps": {
      const box = S.msgs.get(m.thread), i = box ? at(box.list, m.id) : -1;
      if (i < 0) return;
      box.list[i].steps = m.steps;
      return changed("messages", { thread: m.thread, id: m.id });
    }
    case "status": S.status = m.status; return changed("status");
    case "event": S.events = [m.event, ...S.events.filter(e => e.id !== m.event.id)].slice(0, 400); return changed("events");
    case "settings": S.settings = m.settings; return changed("settings");
    case "seen": S.seen = m.seen; S.unread = 0; return changed("seen");
    case "cleared": {
      S.msgs.set(m.thread, { list: [], more: false, loaded: true });
      const th = S.threads.find(t => t.id === m.thread);
      if (th) th.last = null;
      return changed("messages", { thread: m.thread, id: null });
    }
    case "toast": return emit("said", m);
    case "reset": return load();
  }
}

/* ------------------------------------------------------------ asking */

export async function load() {
  const { msgs } = S;
  Object.assign(S, await api.get("/state"), { ready: true, msgs });
  changed("all");
}

// A conversation's newest messages. Asked again after a lost connection: what is cached is kept, what the server no longer has is dropped.
export async function ensure(thread, force = false) {
  const cur = S.msgs.get(thread);
  if (cur?.loaded && !force) return cur;
  const { messages } = await api.get(`/threads/${thread}/messages`);
  const box = cur || { list: [], more: messages.length >= PAGE, loaded: true };
  const have = new Map(box.list.map(m => [m.id, m]));
  const first = messages[0]?.id ?? Infinity, ids = new Set(messages.map(m => m.id));
  for (const id of [...have.keys()]) if (id >= first && !ids.has(id)) have.delete(id);
  for (const m of messages) { const old = have.get(m.id); if (!old || !(old.streaming && old.text.length > m.text.length)) have.set(m.id, m); }
  box.list = [...have.values()].sort((a, b) => a.id - b.id);
  box.loaded = true;
  S.msgs.set(thread, box);
  changed("messages", { thread, id: null });
  return box;
}

export async function older(thread) {
  const box = S.msgs.get(thread);
  if (!box?.list.length || !box.more) return;
  const { messages } = await api.get(`/threads/${thread}/messages?before=${box.list[0].id}`);
  box.more = messages.length >= PAGE;
  box.list = [...messages, ...box.list];
  changed("messages", { thread, id: null, older: messages.length });
}

export const events = async before => {
  const { events: rows } = await api.get(`/events?limit=60${before ? `&before=${before}` : ""}`);
  return rows;
};

/* ------------------------------------------------------------ staying connected */

let sock = null, tries = 0, retry = 0, beat = 0, poll = 0, stopped = true;

async function resync() {
  try { await Promise.all([load(), ...[...S.msgs].filter(([, b]) => b.loaded).map(([id]) => ensure(id, true))]); } catch { /* the next try will do */ }
}

function polling() {
  if (poll) return;
  S.live = "polling";
  changed("live");
  poll = setInterval(() => { if (!document.hidden) resync(); }, 5000);
}

function connect() {
  if (sock || stopped) return;
  let ws;
  try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/api/live"); } catch { return polling(); }
  sock = ws;
  ws.onopen = () => {
    tries = 0;
    clearInterval(poll); poll = 0;
    S.live = "live";
    changed("live");
    resync();
    beat = setInterval(() => { try { ws.send("ping"); } catch { /* it is closing */ } }, 25_000);
  };
  ws.onmessage = e => { try { apply(JSON.parse(e.data)); } catch { /* "pong" and anything else that is not an update */ } };
  ws.onclose = () => {
    clearInterval(beat);
    sock = null;
    if (stopped) return;
    if (S.live === "live") { S.live = "off"; changed("live"); }
    if (++tries >= 3) polling();
    retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** tries));
  };
}

let wired = false;
export async function start() {
  stopped = false;
  if (!wired) {
    wired = true;
    addEventListener("online", () => { if (!stopped) { tries = 0; connect(); resync(); } });
    addEventListener("visibilitychange", () => { if (!stopped && !document.hidden) { tries = 0; connect(); resync(); } });
  }
  await load();
  connect();
}

export function stop() {
  stopped = true;
  clearTimeout(retry); clearInterval(beat); clearInterval(poll);
  poll = 0;
  try { sock?.close(); } catch { /* already closed */ }
  sock = null;
  S.live = "off";
}
