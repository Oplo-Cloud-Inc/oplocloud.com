/* The shape of everything Roxan keeps, and the one place its input is checked.

   The person's forms and the model's tools both come through NORM: it takes
   what was sent plus what is already there (or nothing, for a new item) and
   returns the columns to store, or throws Invalid with a sentence a person can
   read. Nothing reaches the database without passing through it. */
import { Invalid, line, text, cardish } from "./util.js";
import { CAP } from "./policy.js";
import { check as checkUrl } from "./web.js";
import { validate as validSchedule, nextRun, zoneOk } from "./schedule.js";
import * as memory from "../../roxan/chat/memory.js";

// How many of each Roxan will keep. A limit is a sentence to the person, not a silent drop.
export const MAX = { thread: 200, project: 40, goal: 100, routine: 25, memory: 400, panel: 100, idea: 100, handoff: 100, specialty: 50, rule: 60, approval: 50, question: 20 };
export const EDITABLE = ["thread", "project", "goal", "routine", "memory", "panel", "idea", "handoff", "specialty", "rule"];
export const NOTE_KINDS = ["person", "place", "organization", "project", "preference", "date", "other"];

const oneOf = (v, ok, dflt, what) => {
  if (v === undefined || v === null) return dflt;
  if (!ok.includes(v)) throw new Invalid(`${what} must be ${ok.join(", ").replace(/, ([^,]*)$/, " or $1")}.`);
  return v;
};
const need = (v, what) => { if (!v) throw new Invalid(`${what} is needed.`); return v; };
const noCard = (...s) => { if (s.some(x => cardish(x))) throw new Invalid("That looks like a card number. Roxan does not keep those."); };
const project = (store, id) => { if (store.item(id)?.kind !== "project") throw new Invalid("That project does not exist."); return id; };

// A plan is a short list of steps. Steps that are kept word for word stay done.
function steps(list, was = []) {
  if (!Array.isArray(list)) throw new Invalid("Steps must be a list.");
  const done = new Set(was.filter(s => s.done).map(s => s.text));
  return list.slice(0, 12).map(s => {
    const t = line(typeof s === "string" ? s : s?.text, 200);
    return { text: t, done: typeof s === "object" && s && "done" in s ? Boolean(s.done) : done.has(t) };
  }).filter(s => s.text);
}

export const NORM = {
  thread: (i, c, x) => ({
    title: i.title === undefined ? c?.title ?? "" : line(i.title, 80),
    state: oneOf(i.state, ["open", "archived"], c?.state ?? "open", "State"),
    parent: i.parent === undefined ? c?.parent ?? null : i.parent === null ? null : project(x.store, i.parent),
  }),

  project: (i, c) => ({
    title: need(line(i.title ?? c?.title, 80), "A name"),
    body: i.notes === undefined && i.body === undefined ? c?.body ?? "" : text(i.notes ?? i.body, 4000),
    state: oneOf(i.state, ["open", "archived"], c?.state ?? "open", "State"),
  }),

  goal: (i, c) => {
    const title = need(line(i.title ?? c?.title, 140), "A title"), body = text(i.why ?? i.body ?? c?.body ?? "", 1000);
    const plan = i.steps === undefined ? c?.steps ?? [] : steps(i.steps, c?.steps);
    for (const n of Array.isArray(i.done) ? i.done : []) if (plan[n - 1]) plan[n - 1].done = true;
    noCard(title, body, ...plan.map(s => s.text));
    return { title, body, state: oneOf(i.status ?? i.state, ["active", "paused", "done", "dropped"], c?.state ?? "active", "Status"), data: { steps: plan } };
  },

  routine: (i, c, x) => {
    const mode = i.mode ?? c?.mode;
    if (!["remind", "run", "watch"].includes(mode)) throw new Invalid("Choose remind, run or watch.");
    const title = need(line(i.title ?? c?.title, 100), "A name"), body = text(i.instruction ?? i.body ?? c?.body ?? "", 2000);
    if (mode !== "remind") need(body, "The instruction");
    noCard(title, body);
    const changed = i.schedule !== undefined || i.when !== undefined || !c;
    const schedule = changed ? validSchedule(i.schedule ?? i.when, x.tz, x.now) : c.schedule;
    if (mode === "watch" && schedule.kind === "once") throw new Invalid("Watching a page repeats: choose daily or every few hours.");
    const url = mode === "watch" ? checkUrl(i.url ?? c?.url).href : null;
    const state = oneOf(i.state, ["active", "paused"], c?.state ?? "active", "State");
    const resumed = state === "active" && c?.state !== "active";
    const due = state !== "active" ? null : changed || resumed || c.due == null ? nextRun(schedule, x.now, x.tz) : c.due;
    return {
      title, body, due, state: state === "active" && due === null ? "done" : state,
      data: { mode, schedule, url, goal: i.goal ?? c?.goal ?? null, ...(resumed || !c ? { fails: 0, pausedBy: null } : {}), ...(url !== c?.url ? { hash: null, prev: null } : {}) },
    };
  },

  memory: (i, c, x) => {
    const body = need(line(i.text ?? i.body ?? c?.body, 300), "The note");
    noCard(body);
    return {
      body, state: oneOf(i.state, ["active", "removed"], c?.state ?? "active", "State"),
      data: { about: memory.aboutNames(i.about ?? c?.about ?? [], notes(x.store)), kind: oneOf(i.kind, NOTE_KINDS, c?.kind ?? "other", "Kind"), pinned: Boolean(i.pinned ?? c?.pinned ?? false) },
    };
  },

  panel: (i, c) => {
    const type = c?.type ?? oneOf(i.type, ["document", "checklist", "table"], "document", "Type");
    const title = need(line(i.title ?? c?.title, 100), "A title");
    const out = { title, state: "open", data: { type } };
    if (type === "document") out.body = text(i.text ?? i.body ?? c?.body ?? "", 20000);
    else if (type === "checklist") {
      if (i.items !== undefined && !Array.isArray(i.items)) throw new Invalid("Items must be a list.");
      out.data.items = (i.items ?? c?.items ?? []).slice(0, 100).map(s => ({ text: line(typeof s === "string" ? s : s?.text, 200), done: typeof s === "object" && s ? Boolean(s.done) : false })).filter(s => s.text);
    } else {
      const columns = (i.columns ?? c?.columns ?? []).slice(0, 8).map(s => line(s, 40)).filter(Boolean);
      need(columns.length, "Columns");
      const rows = i.rows ?? c?.rows ?? [];
      if (!Array.isArray(rows)) throw new Invalid("Rows must be a list.");
      out.data.columns = columns;
      out.data.rows = rows.slice(0, 200).map(r => columns.map((_, k) => line(Array.isArray(r) ? r[k] : "", 200)));
    }
    noCard(title, out.body ?? "", JSON.stringify(out.data));
    return out;
  },

  idea: (i, c) => {
    const title = need(line(i.title ?? c?.title, 140), "A title"), body = text(i.why ?? i.body ?? c?.body ?? "", 600);
    noCard(title, body);
    return { title, body, state: oneOf(i.state, ["open", "taken", "dismissed"], c?.state ?? "open", "State") };
  },

  handoff: (i, c) => {
    const title = need(line(i.title ?? c?.title, 140), "A title"), body = need(text(i.task ?? i.body ?? c?.body, 600), "The task");
    const site = line(i.site ?? c?.site ?? "", 120);
    noCard(title, body, site);
    return { title, body, state: oneOf(i.state, ["queued", "cancelled", "done"], c?.state ?? "queued", "State"), data: { site } };
  },

  specialty: (i, c) => {
    const title = need(line(i.name ?? i.title ?? c?.title, 60), "A name"), when = need(line(i.when ?? c?.when, 200), "When to use it");
    const list = (i.steps ?? c?.steps ?? []);
    if (!Array.isArray(list)) throw new Invalid("Steps must be a list.");
    const plan = list.map(s => line(s, 200)).filter(Boolean).slice(0, 12);
    if (plan.length < 2) throw new Invalid("A specialty needs at least two steps.");
    noCard(title, when, ...plan);
    return { title, state: "open", data: { when, steps: plan } };
  },

  rule: (i, c) => {
    const cap = CAP[i.capability ?? c?.capability];
    if (!cap) throw new Invalid("That is not something Roxan can be given a rule about.");
    const effect = oneOf(i.effect ?? c?.effect, ["allow", "ask", "block"], undefined, "A rule");
    need(effect, "A rule");
    let domain = String(i.domain ?? c?.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^\*?\.?/, "");
    if (domain && !cap.site) throw new Invalid("Only reading web pages can be limited to a website.");
    if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) throw new Invalid("Give a website like example.com.");
    return { title: `${cap.label}: ${effect}${domain ? ` for ${domain}` : ""}`, state: "open", data: { capability: cap.id, effect, domain } };
  },
};

/* ---------------------------------------------------------------- notes */

export const asNote = m => ({ id: m.id, text: m.body, about: m.about || [], kind: m.kind, pinned: Boolean(m.pinned), deleted: m.state === "removed", updatedAt: m.updated, createdAt: m.created });
export const notes = store => store.list("memory", { limit: 1000 }).map(asNote);

/* ------------------------------------------------------------- settings */

export const DEFAULTS = { name: "Roxan", mark: "roxan", tone: "direct", learning: true, level: "balanced", quiet: null, tz: "UTC", paused: false, onboarded: false };
const hhmm = v => (/^([01]\d|2[0-3]):([0-5]\d)$/.test(String(v)) ? String(v) : null);

export function settings(patch, cur) {
  if (!patch || typeof patch !== "object") throw new Invalid("Send the settings to change.");
  const out = { ...cur };
  if (patch.name !== undefined) out.name = need(line(patch.name, 24), "A name");
  if (patch.mark !== undefined) out.mark = need(line(patch.mark, 24), "A mark");
  if (patch.tone !== undefined) out.tone = oneOf(patch.tone, ["direct", "warm", "formal"], null, "Tone");
  if (patch.level !== undefined) out.level = oneOf(patch.level, ["quiet", "balanced", "active"], null, "How often it speaks first");
  for (const k of ["learning", "paused", "onboarded"]) if (patch[k] !== undefined) out[k] = Boolean(patch[k]);
  if (patch.tz !== undefined) { if (!zoneOk(patch.tz)) throw new Invalid("That time zone is not known."); out.tz = patch.tz; }
  if (patch.quiet !== undefined) {
    if (patch.quiet === null) out.quiet = null;
    else {
      const from = hhmm(patch.quiet?.from), to = hhmm(patch.quiet?.to);
      if (!from || !to) throw new Invalid("Give quiet hours as HH:MM to HH:MM.");
      out.quiet = { from, to };
    }
  }
  return out;
}

/* ---------------------------------------------------------- over the wire */

// A list shows a panel's title, not its contents; opening it fetches the rest.
export const slim = it => {
  if (it.kind !== "panel") return it;
  const { body, items, rows, ...rest } = it;
  return { ...rest, size: it.type === "document" ? body.length : it.type === "checklist" ? items.length : rows.length };
};
