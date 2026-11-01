/* Everything one person's Roxan keeps, in the SQLite database of their Durable
   Object. Five tables:

     kv        settings and counters
     items     goals, routines, notes, panels, ideas, Handoffs, specialties, rules,
               projects, conversations, and what waits for a yes (approvals,
               questions): one shape, told apart by `kind`
     messages  what was said, per conversation
     runs      each piece of work Roxan did or is doing
     events    the activity log: what happened, and why something was held back

   `sql` is the Durable Object's `ctx.storage.sql`; the tests give it a small
   stand-in over node:sqlite with the same exec().toArray() shape. */
import { newId, parse } from "./util.js";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, kind TEXT NOT NULL, state TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', data TEXT NOT NULL DEFAULT '{}', parent TEXT, due INTEGER, created INTEGER NOT NULL, updated INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS items_kind ON items (kind, state, updated)`,
  `CREATE INDEX IF NOT EXISTS items_due ON items (due) WHERE due IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, thread TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL DEFAULT '', data TEXT NOT NULL DEFAULT '{}', run TEXT, at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS messages_thread ON messages (thread, id)`,
  `CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, state TEXT NOT NULL, thread TEXT, ref TEXT, input TEXT NOT NULL DEFAULT '{}', partial TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '', steps TEXT NOT NULL DEFAULT '[]', usage TEXT NOT NULL DEFAULT '{}', error TEXT, created INTEGER NOT NULL, started INTEGER, ended INTEGER, beat INTEGER)`,
  `CREATE INDEX IF NOT EXISTS runs_state ON runs (state, created)`,
  `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, ref TEXT, run TEXT, data TEXT NOT NULL DEFAULT '{}')`,
];

export const PREFIX = { thread: "t", project: "p", goal: "g", routine: "r", memory: "m", panel: "pa", idea: "i", handoff: "h", specialty: "sp", rule: "ru", approval: "ap", question: "q" };

const nul = v => (v === undefined ? null : v);

const item = r => r && ({
  ...(parse(r.data) || {}),
  id: r.id, kind: r.kind, state: r.state, title: r.title, body: r.body, parent: r.parent, due: r.due, created: r.created, updated: r.updated,
});
const message = r => r && ({ id: r.id, thread: r.thread, role: r.role, text: r.text, run: r.run, at: r.at, ...(parse(r.data) || {}) });
const run = r => r && ({ ...r, input: parse(r.input) || {}, steps: parse(r.steps) || [], usage: parse(r.usage) || {} });
const event = r => r && ({ id: r.id, at: r.at, kind: r.kind, text: r.text, ref: r.ref, run: r.run, ...(parse(r.data) || {}) });

export class Store {
  constructor(sql, clock = Date.now) {
    this.sql = sql;
    this.clock = clock;
    for (const s of SCHEMA) sql.exec(s);
  }
  q(query, ...b) { return this.sql.exec(query, ...b.map(nul)).toArray(); }
  one(query, ...b) { return this.q(query, ...b)[0] ?? null; }
  run(query, ...b) { this.sql.exec(query, ...b.map(nul)); }

  /* ---------------------------------------------------------------- kv */
  get(k, fallback = null) { const r = this.one("SELECT v FROM kv WHERE k = ?", k); return r ? parse(r.v) ?? fallback : fallback; }
  set(k, v) { this.run("INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, JSON.stringify(v)); }
  del(k) { this.run("DELETE FROM kv WHERE k = ?", k); }

  /* ------------------------------------------------------------- items */
  add(kind, f = {}) {
    const t = this.clock(), id = f.id || newId(PREFIX[kind] || "x");
    this.run("INSERT INTO items (id, kind, state, title, body, data, parent, due, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      id, kind, f.state || "open", f.title || "", f.body || "", JSON.stringify(f.data || {}), f.parent, f.due, t, t);
    return this.item(id);
  }
  item(id) { return item(this.one("SELECT * FROM items WHERE id = ?", id)); }
  list(kind, { state, parent, limit = 500, order = "updated DESC" } = {}) {
    const where = ["kind = ?"], b = [kind];
    if (state) { const s = [].concat(state); where.push(`state IN (${s.map(() => "?").join(",")})`); b.push(...s); }
    if (parent !== undefined) { where.push("parent IS ?"); b.push(parent); }
    return this.q(`SELECT * FROM items WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ${limit | 0}`, ...b).map(item);
  }
  count(kind, state) { return this.one("SELECT COUNT(*) AS n FROM items WHERE kind = ? AND state = ?", kind, state).n; }
  // `data` is merged into what is there; any other key replaces its column. `due: null` clears the time.
  patch(id, p) {
    const cur = this.item(id);
    if (!cur) return null;
    const t = this.clock();
    const data = p.data ? { ...(parse(this.one("SELECT data FROM items WHERE id = ?", id).data) || {}), ...p.data } : null;
    this.run("UPDATE items SET state = ?, title = ?, body = ?, data = COALESCE(?, data), parent = ?, due = ?, updated = ? WHERE id = ?",
      p.state ?? cur.state, p.title ?? cur.title, p.body ?? cur.body, data && JSON.stringify(data), "parent" in p ? p.parent : cur.parent, "due" in p ? p.due : cur.due, t, id);
    return this.item(id);
  }
  remove(id) { this.run("DELETE FROM items WHERE id = ?", id); }
  // The soonest time something needs doing: a routine to run (unless everything is paused) or a request to expire.
  nextDue(routines = true) { return this.one(`SELECT MIN(due) AS t FROM items WHERE due IS NOT NULL AND ((kind = 'approval' AND state = 'awaiting')${routines ? " OR (kind = 'routine' AND state = 'active')" : ""})`)?.t ?? null; }
  dueItems(kind, t) { return this.q("SELECT * FROM items WHERE kind = ? AND state = ? AND due IS NOT NULL AND due <= ? ORDER BY due", kind, kind === "approval" ? "awaiting" : "active", t).map(item); }

  /* ---------------------------------------------------------- messages */
  say({ thread, role, text = "", data = {}, run: r = null }) {
    const at = this.clock();
    this.run("INSERT INTO messages (thread, role, text, data, run, at) VALUES (?, ?, ?, ?, ?, ?)", thread, role, text, JSON.stringify(data), r, at);
    return message(this.one("SELECT * FROM messages WHERE rowid = last_insert_rowid()"));
  }
  edit(id, { text, data }) {
    const cur = this.one("SELECT * FROM messages WHERE id = ?", id);
    if (!cur) return null;
    this.run("UPDATE messages SET text = ?, data = ? WHERE id = ?", text ?? cur.text, JSON.stringify(data ? { ...(parse(cur.data) || {}), ...data } : parse(cur.data) || {}), id);
    return message(this.one("SELECT * FROM messages WHERE id = ?", id));
  }
  message(id) { return message(this.one("SELECT * FROM messages WHERE id = ?", id)); }
  // The newest `limit` messages older than `before`, oldest first.
  messages(thread, { before = Number.MAX_SAFE_INTEGER, limit = 40 } = {}) {
    return this.q("SELECT * FROM messages WHERE thread = ? AND id < ? ORDER BY id DESC LIMIT ?", thread, before, limit).map(message).reverse();
  }
  dropMessages(thread) { this.run("DELETE FROM messages WHERE thread = ?", thread); }

  /* -------------------------------------------------------------- runs */
  start(kind, f = {}) {
    const id = newId("run");
    this.run("INSERT INTO runs (id, kind, state, thread, ref, input, created) VALUES (?, ?, 'queued', ?, ?, ?, ?)", id, kind, f.thread, f.ref, JSON.stringify(f.input || {}), this.clock());
    return this.getRun(id);
  }
  getRun(id) { return run(this.one("SELECT * FROM runs WHERE id = ?", id)); }
  setRun(id, p) {
    const cur = this.one("SELECT * FROM runs WHERE id = ?", id);
    if (!cur) return null;
    const j = v => (typeof v === "string" ? v : JSON.stringify(v));
    this.run("UPDATE runs SET state = ?, partial = ?, summary = ?, steps = ?, usage = ?, error = ?, started = ?, ended = ?, beat = ? WHERE id = ?",
      p.state ?? cur.state, p.partial ?? cur.partial, p.summary ?? cur.summary, p.steps ? j(p.steps) : cur.steps, p.usage ? j(p.usage) : cur.usage,
      "error" in p ? p.error : cur.error, p.started ?? cur.started, p.ended ?? cur.ended, p.beat ?? cur.beat, id);
    return this.getRun(id);
  }
  runs(where = "1 = 1", ...b) { return this.q(`SELECT * FROM runs WHERE ${where} ORDER BY created DESC LIMIT 100`, ...b).map(run); }

  /* ------------------------------------------------------------ events */
  // The activity log keeps what happened and why, never what was said.
  log(kind, text, { ref = null, run: r = null, data = {} } = {}) {
    this.run("INSERT INTO events (at, kind, text, ref, run, data) VALUES (?, ?, ?, ?, ?, ?)", this.clock(), kind, text, ref, r, JSON.stringify(data));
  }
  events({ before = Number.MAX_SAFE_INTEGER, limit = 60, kinds } = {}) {
    const where = ["id < ?"], b = [before];
    if (kinds?.length) { where.push(`kind IN (${kinds.map(() => "?").join(",")})`); b.push(...kinds); }
    return this.q(`SELECT * FROM events WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ?`, ...b, limit).map(event);
  }
  eventsSince(t) { return this.q("SELECT * FROM events WHERE at >= ? ORDER BY id", t).map(event); }

  /* ------------------------------------------------------------- whole */
  wipe() { for (const t of ["kv", "items", "messages", "runs", "events"]) this.run(`DELETE FROM ${t}`); }
  dump() {
    return {
      settings: this.q("SELECT k, v FROM kv").map(r => ({ k: r.k, v: parse(r.v) })),
      items: this.q("SELECT * FROM items ORDER BY created").map(item),
      messages: this.q("SELECT * FROM messages ORDER BY id").map(message),
      events: this.q("SELECT * FROM events ORDER BY id").map(event),
    };
  }
}
