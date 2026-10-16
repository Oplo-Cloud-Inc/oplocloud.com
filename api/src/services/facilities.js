/* ==========================================================================
   Facilities — the rules, with nothing else in the way.

   Everything here is a pure function of its arguments, so every rule can be
   tested without a server and read without a database: how a work order moves,
   when a recurring job falls due, whether a room may be held, whether a paper
   has run out. The routes ask; they do not decide.

   Dates are the school's own calendar days (YYYY-MM-DD) and times are the
   school's own clock (HH:MM). Nothing here converts a time zone, because a
   school's Tuesday is its own Tuesday wherever the server happens to be.
   ========================================================================== */

import { isDate, addDays } from "./enrollment.js";

export { isDate, addDays };

export const CATEGORIES = ["maintenance", "custodial", "it", "safety", "grounds", "other"];
export const PRIORITIES = ["low", "normal", "high", "urgent"];
export const ORDER_KINDS = ["request", "repair", "preventive", "inspection", "compliance", "task"];
export const STATUSES = ["pending", "open", "in_progress", "on_hold", "done", "declined", "cancelled"];
export const UNFINISHED = ["pending", "open", "in_progress", "on_hold"];
export const SPACE_KINDS = ["building", "floor", "room", "area"];
export const ASSET_STATUSES = ["in_service", "repair", "storage", "retired", "lost"];
export const SCHEDULE_KINDS = ["preventive", "inspection", "compliance"];
export const UNITS = ["day", "week", "month", "year"];
export const DOC_OWNERS = ["school", "space", "asset", "vendor", "work_order"];

/* ----------------------------------------------------------------- Orders */

/* The steps a work order takes, and from where. Nothing deletes an order;
   a mistake is cancelled, and a cancelled or finished one can be reopened. */
export const MOVES = {
  approve:    { from: ["pending"], to: "open" },
  decline:    { from: ["pending"], to: "declined" },
  reconsider: { from: ["declined"], to: "pending" },
  start:      { from: ["open", "on_hold"], to: "in_progress" },
  hold:       { from: ["open", "in_progress"], to: "on_hold" },
  complete:   { from: ["open", "in_progress", "on_hold"], to: "done" },
  cancel:     { from: ["pending", "open", "in_progress", "on_hold"], to: "cancelled" },
  reopen:     { from: ["done", "cancelled"], to: "open" }
};

export function moveTo(status, action) {
  const m = MOVES[action];
  return m && m.from.includes(status) ? m.to : null;
}

/* A checklist is what a person has to look at or do before an order is done.
   Three kinds of line: tick it, say pass or fail, or write a finding. Only a
   pass/fail line can fail — and a failed line can raise an order of its own. */
export function normaliseChecklist(raw, { max = 60 } = {}) {
  if (raw == null || raw === "") return [];
  if (!Array.isArray(raw)) throw new Error("The checklist must be a list.");
  if (raw.length > max) throw new Error(`A checklist can have ${max} lines at most.`);
  return raw.map((x, i) => {
    const text = String((x && x.text) || "").trim();
    if (!text) throw new Error(`Line ${i + 1} of the checklist is empty.`);
    if (text.length > 200) throw new Error(`Line ${i + 1} of the checklist is longer than 200 characters.`);
    const type = ["check", "pass_fail", "note"].includes(x.type) ? x.type : "check";
    const out = { id: String(i + 1), text, type };
    if (type === "pass_fail") out.onFail = x.onFail !== false;
    if (x.done === true) out.done = true;
    if (["pass", "fail", "na"].includes(x.result)) out.result = x.result;
    if (x.note) out.note = String(x.note).trim().slice(0, 300);
    return out;
  });
}

/* What is still unanswered. `note` lines never block. */
export function unfinished(list) {
  return (list || []).filter((x) =>
    (x.type === "check" && !x.done && x.result !== "na") ||
    (x.type === "pass_fail" && !x.result));
}

export const failed = (list) => (list || []).filter((x) => x.type === "pass_fail" && x.result === "fail");

/* Merge the answers somebody sent into the list the order already has. The
   questions are the order's; only the answers can come from outside. */
export function answerChecklist(current, answers) {
  const by = new Map((Array.isArray(answers) ? answers : []).map((a) => [String(a && a.id), a]));
  return (current || []).map((x) => {
    const a = by.get(x.id);
    if (!a) return x;
    const out = { ...x };
    if (x.type === "check") { if (a.done === true) out.done = true; else if (a.done === false) delete out.done; }
    if (x.type !== "note" && ["pass", "fail", "na"].includes(a.result)) out.result = a.result;
    if (a.note !== undefined) { if (a.note) out.note = String(a.note).trim().slice(0, 300); else delete out.note; }
    return out;
  });
}

export const isOverdue = (o, today) => UNFINISHED.includes(o.status) && !!o.due_on && o.due_on < today;

/* ---------------------------------------------------------- Recurrence */

const lastOfMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/* One interval after a day. A month is a month: the 31st plus a month is the
   last day of the next one, not the 3rd of the one after. */
export function addInterval(ymd, every, unit) {
  const n = Math.max(1, Math.floor(every) || 1);
  if (unit === "day") return addDays(ymd, n);
  if (unit === "week") return addDays(ymd, 7 * n);
  const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7), d = +ymd.slice(8, 10);
  const months = unit === "year" ? 12 * n : n;
  const t = (m - 1) + months;
  const ny = y + Math.floor(t / 12), nm = (t % 12) + 1;
  const nd = Math.min(d, lastOfMonth(ny, nm));
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

/* A day that falls outside every marking period is a break. When the school
   has periods, a job that would fall in a break moves to the day the next
   term starts, so the summer does not pile up overdue work. No periods, no
   breaks: the day stands. */
export function outOfBreak(ymd, periods) {
  const ps = (periods || []).filter((p) => isDate(p.starts_on || p.startsOn) && isDate(p.ends_on || p.endsOn));
  if (!ps.length) return ymd;
  const rows = ps.map((p) => [p.starts_on || p.startsOn, p.ends_on || p.endsOn]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (rows.some(([s, e]) => ymd >= s && ymd <= e)) return ymd;
  const next = rows.find(([s]) => s > ymd);
  return next ? next[0] : ymd;
}

/* The first due date of a new schedule. */
export function firstDue(s, periods) {
  if (!isDate(s.starts_on)) return null;
  return s.skip_breaks ? outOfBreak(s.starts_on, periods) : s.starts_on;
}

/* Whether a schedule should write an order today, and what follows.

   The order appears `lead_days` before the date it answers. If the last order
   is still unfinished and the schedule is set to wait, nothing is written and
   the date stays where it is — one catch-up order when it is closed, not a
   pile. Writing an order moves the schedule to the first date after today, so
   a school that did not open the page for a month gets one overdue order,
   not four. A schedule that counts from completion has no next date until
   somebody completes the order. */
export function plan(s, today, { hasOpen = false, periods = [] } = {}) {
  if (!s.active || !s.next_due_on) return { create: false };
  if (s.ends_on && s.next_due_on > s.ends_on) return { create: false, finished: true };
  if (addDays(s.next_due_on, -(s.lead_days || 0)) > today) return { create: false };
  if (hasOpen && s.skip_if_open) return { create: false, waiting: true };
  const dueOn = s.next_due_on;
  let next = null;
  if (!s.from_completion) {
    next = addInterval(dueOn, s.every, s.unit);
    while (next <= today) next = addInterval(next, s.every, s.unit);
    if (s.skip_breaks) next = outOfBreak(next, periods);
    if (s.ends_on && next > s.ends_on) next = null;
  }
  return { create: true, dueOn, next };
}

/* A job finished. Only a schedule that counts from completion moves. */
export function afterCompletion(s, doneOn, periods = []) {
  if (!s.from_completion) return { lastDoneOn: doneOn };
  let next = addInterval(doneOn, s.every, s.unit);
  if (s.skip_breaks) next = outOfBreak(next, periods);
  if (s.ends_on && next > s.ends_on) next = null;
  return { lastDoneOn: doneOn, next };
}

/* ------------------------------------------------------------ Bookings */

export const DEFAULT_RULES = { opens: "07:00", closes: "21:00", days: [1, 2, 3, 4, 5], daysAhead: 180,
  noticeHours: 0, maxMinutes: 0, bufferMinutes: 0, blocked: [] };

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (s) => typeof s === "string" && HHMM.test(s);
export const minutes = (s) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
export const weekday = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay();   // 0 Sunday … 6 Saturday
export const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

export function normaliseRules(raw, { strict = false } = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const bad = (m) => { if (strict) throw new Error(m); };
  const out = { ...DEFAULT_RULES, days: [...DEFAULT_RULES.days], blocked: [] };
  if (r.opens !== undefined) { if (isTime(r.opens)) out.opens = r.opens; else bad("Opening time is written HH:MM."); }
  if (r.closes !== undefined) { if (isTime(r.closes)) out.closes = r.closes; else bad("Closing time is written HH:MM."); }
  if (minutes(out.closes) <= minutes(out.opens)) { bad("It has to close after it opens."); out.opens = DEFAULT_RULES.opens; out.closes = DEFAULT_RULES.closes; }
  if (r.days !== undefined) {
    const d = Array.isArray(r.days) ? [...new Set(r.days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))] : null;
    if (d && d.length) out.days = d.sort(); else bad("Choose at least one day of the week.");
  }
  const int = (k, min, max) => {
    if (r[k] === undefined || r[k] === null || r[k] === "") return;
    const n = Number(r[k]);
    if (Number.isInteger(n) && n >= min && n <= max) out[k] = n; else bad(`${k} must be a whole number from ${min} to ${max}.`);
  };
  int("daysAhead", 1, 730); int("noticeHours", 0, 720); int("maxMinutes", 0, 1440); int("bufferMinutes", 0, 240);
  if (r.blocked !== undefined) {
    const b = Array.isArray(r.blocked) ? r.blocked.filter(isDate) : null;
    if (b) out.blocked = [...new Set(b)].sort().slice(0, 400); else bad("Blocked dates must be a list of dates.");
  }
  return out;
}

/* Why a booking cannot be made, in the words a person can act on. An empty
   list means the room's own rules are satisfied; the room being free is a
   separate question (`clash`). `now` is the school's clock: { day, time }. */
export function bookingProblems(rules, b, now, { capacity = null } = {}) {
  const r = normaliseRules(rules);
  const out = [];
  if (!isDate(b.day)) return ["The day is written YYYY-MM-DD."];
  if (!isTime(b.starts) || !isTime(b.ends)) return ["Times are written HH:MM."];
  const s = minutes(b.starts), e = minutes(b.ends);
  if (e <= s) out.push("It has to end after it starts.");
  if (s < minutes(r.opens) || e > minutes(r.closes)) out.push(`This room can be held between ${r.opens} and ${r.closes}.`);
  if (r.maxMinutes && e - s > r.maxMinutes) out.push(`A booking here is at most ${r.maxMinutes} minutes.`);
  if (!r.days.includes(weekday(b.day))) out.push("This room cannot be held on that day of the week.");
  if (r.blocked.includes(b.day)) out.push("That day is blocked for this room.");
  const ahead = daysBetween(now.day, b.day);
  if (ahead < 0 || (ahead === 0 && minutes(b.starts) < minutes(now.time))) out.push("That time has already passed.");
  else if (ahead > r.daysAhead) out.push(`This room can be held up to ${r.daysAhead} days ahead.`);
  else if (r.noticeHours) {
    const hours = (ahead * 1440 + s - minutes(now.time)) / 60;
    if (hours < r.noticeHours) out.push(`This room needs ${r.noticeHours} hours' notice.`);
  }
  if (capacity && b.attendees && b.attendees > capacity) out.push(`The room holds ${capacity}; you listed ${b.attendees}.`);
  return out;
}

/* Whether two holds on the same day collide, with the room's buffer on both
   sides (the time to set up and to clear). */
export function clash(a, b, buffer = 0) {
  if (a.day !== b.day) return false;
  return minutes(a.starts) < minutes(b.ends) + buffer && minutes(b.starts) < minutes(a.ends) + buffer;
}

/* The days a series covers. A series is the same time on a rhythm: every day
   the room can be held, every week, or every second week, to a count or an
   end date. At most a year of it, so a typo cannot book a decade. */
export function expandSeries({ day, repeat = "none", count = 1, until = null }, rules) {
  if (!isDate(day)) return [];
  if (repeat === "none") return [day];
  const days = normaliseRules(rules).days;
  const out = [];
  const step = repeat === "weekly" ? 7 : repeat === "biweekly" ? 14 : 1;
  const cap = Math.min(52, Math.max(1, Math.floor(count) || 1));
  const stop = isDate(until) ? until : null;
  let d = day;
  for (let guard = 0; out.length < cap && guard < 400; guard++) {
    if (stop && d > stop) break;
    if (repeat !== "daily" || days.includes(weekday(d))) out.push(d);
    d = addDays(d, step);
  }
  return out;
}

/* A range of room names: ("Room ", 101, 118) -> Room 101 … Room 118. */
export function expandRange({ prefix = "", from, to, suffix = "" }) {
  const a = Math.floor(Number(from)), b = Math.floor(Number(to));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) throw new Error("The range has to run upward, like 101 to 118.");
  if (b - a >= 200) throw new Error("Add at most 200 at a time.");
  const out = [];
  for (let n = a; n <= b; n++) out.push(`${prefix}${n}${suffix}`.trim());
  return out;
}

/* ----------------------------------------------------------- Documents */

/* none: no expiry date · ok · soon: within `soon` days · expired */
export function expiryState(expiresOn, today, soon = 30) {
  if (!expiresOn) return "none";
  if (expiresOn < today) return "expired";
  return expiresOn <= addDays(today, soon) ? "soon" : "ok";
}

/* What a vendor is still missing: each required paper, and whether the one on
   file is current. `docs` are the vendor's documents. A paper matches a
   requirement when its kind says so, ignoring case. */
export function vendorStanding(requires, docs, today) {
  const live = (docs || []).filter((d) => !d.archived_at);
  const list = (requires || []).map((need) => {
    const have = live.filter((d) => String(d.kind).toLowerCase() === String(need).toLowerCase())
      .sort((a, b) => String(b.expires_on || "9999").localeCompare(String(a.expires_on || "9999")))[0];
    const state = !have ? "missing" : expiryState(have.expires_on, today);
    return { need, state: state === "none" ? "ok" : state, documentId: have ? have.id : null, expiresOn: have ? have.expires_on : null };
  });
  const worst = list.some((x) => x.state === "expired" || x.state === "missing") ? "attention"
              : list.some((x) => x.state === "soon") ? "soon" : "ok";
  return { list, state: worst };
}

/* -------------------------------------------------------------- Counts */

/* A room count: what was scanned or ticked against what the register says is
   there. `found` are in the room and seen; `missing` are in the room and not
   seen; `elsewhere` were seen here but belong to another room (the register
   may be wrong, or the thing has moved); `unknown` are codes nobody knows. */
export function reconcile(inRoom, seen, known) {
  const seenSet = new Set(seen);
  const found = [], missing = [], elsewhere = [];
  for (const a of inRoom) (seenSet.has(a.code) ? found : missing).push(a);
  const here = new Set(inRoom.map((a) => a.code));
  for (const c of seenSet) { if (!here.has(c) && known.has(c)) elsewhere.push(known.get(c)); }
  const unknown = [...seenSet].filter((c) => !here.has(c) && !known.has(c));
  return { found, missing, elsewhere, unknown };
}

/* --------------------------------------------------------------- Report */

/* The numbers a facilities manager reports upward, from the orders alone. */
export function buildReport(rows, { from, to, today }) {
  const inRange = (ms) => ms != null && ms >= Date.parse(from + "T00:00:00Z") && ms < Date.parse(addDays(to, 1) + "T00:00:00Z");
  const created = rows.filter((r) => inRange(r.created_at));
  const done = rows.filter((r) => r.status === "done" && inRange(r.completed_at));
  const week = (ms) => {
    const d = new Date(ms);
    const day = (d.getUTCDay() + 6) % 7;                      // Monday first
    return addDays(d.toISOString().slice(0, 10), -day);
  };
  const tally = (list, key) => {
    const m = {};
    for (const r of list) { const k = key(r) || "—"; m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  };
  const weeks = {};
  for (const r of created) { const w = week(r.created_at); (weeks[w] ||= { week: w, created: 0, done: 0 }).created++; }
  for (const r of done) { const w = week(r.completed_at); (weeks[w] ||= { week: w, created: 0, done: 0 }).done++; }
  const days = done.filter((r) => r.created_at).map((r) => (r.completed_at - r.created_at) / 86400000);
  const minutesSpent = done.reduce((t, r) => t + (r.minutes || 0), 0);
  const prev = rows.filter((r) => r.kind === "preventive" && r.status === "done" && inRange(r.completed_at) && r.due_on);
  const onTime = prev.filter((r) => new Date(r.completed_at).toISOString().slice(0, 10) <= r.due_on).length;
  const open = rows.filter((r) => UNFINISHED.includes(r.status));
  return {
    from, to,
    created: created.length, done: done.length,
    declined: created.filter((r) => r.status === "declined").length,
    open: open.length, overdue: open.filter((r) => isOverdue(r, today)).length,
    avgDaysToFinish: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null,
    minutesSpent,
    preventive: { done: prev.length, onTime, pct: prev.length ? Math.round((onTime / prev.length) * 100) : null },
    openByPriority: tally(open, (r) => r.priority),
    openByStatus: tally(open, (r) => r.status),
    byCategory: tally(created, (r) => r.category),
    byKind: tally(created, (r) => r.kind),
    byRoom: tally(created, (r) => r.space_name).slice(0, 10),
    weeks: Object.values(weeks).sort((a, b) => (a.week < b.week ? -1 : 1))
  };
}

/* ----------------------------------------------------- Starter checks
   A school has to be able to show it did the checks its authority asks for.
   These are offered, never applied: the school picks the ones that are its
   own, and the interval is theirs to confirm — many are set by a risk
   assessment or by the local authority, and the guidance changes. Each says
   where the figure came from and how firm that source was.

   quality: "primary"  the rule or official guidance was read
            "snippet"  seen in a summary only; confirm before relying on it
            "practice" good practice, not a rule

   Not legal advice. */
const C = (id, country, title, every, unit, authority, source, quality, category, note, extra = {}) =>
  ({ id, country, title, every, unit, authority, source, quality, category: category || "safety", note: note || "", ...extra });

export const STARTER_CHECKS = [
  C("us-asbestos-surveillance", "US", "Asbestos: surveillance of known materials", 6, "month", "US federal asbestos-in-schools rule (AHERA)", "40 CFR 763.92: at least every six months", "primary", "safety",
    "Applies to public and non-profit private schools. Keep the log with the management plan."),
  C("us-asbestos-reinspection", "US", "Asbestos: reinspection by an accredited inspector", 3, "year", "US federal asbestos-in-schools rule (AHERA)", "40 CFR 763.85: every three years", "primary", "safety"),
  C("us-asbestos-notice", "US", "Asbestos: annual notice that the management plan is available", 1, "year", "US federal asbestos-in-schools rule (AHERA)", "40 CFR 763.93", "primary", "safety"),
  C("us-food-inspection", "US", "Food service: health inspection (at least two a school year)", 6, "month", "US school meal program rule", "7 CFR 210.13: at least two a year; post the latest report", "primary", "safety",
    "Only schools in the federal meal programs."),
  C("us-fire-drill", "US", "Fire drill", 1, "month", "State fire code (many follow a national model code)", "Monthly in the model code; states differ in count and kind", "snippet", "safety",
    "Check your state: some set a count per year and require lockdown drills as well."),
  C("us-extinguisher-visual", "US", "Fire extinguishers: monthly visual check", 1, "month", "Workplace safety rule and a national extinguisher standard", "Monthly visual check, annual maintenance", "snippet", "safety"),
  C("us-extinguisher-annual", "US", "Fire extinguishers: annual maintenance", 1, "year", "Workplace safety rule and a national extinguisher standard", "Annual maintenance by a competent person", "snippet", "safety"),
  C("us-alarm-sprinkler", "US", "Fire alarm and sprinklers: contractor test and report", 1, "year", "National fire alarm and sprinkler standards, adopted by state", "Annual test; some parts weekly to five-yearly", "snippet", "safety",
    "Your fire marshal sets what is required."),
  C("us-playground", "US", "Playground: signed and dated inspection", 1, "month", "National consumer-product safety handbook (guidance)", "No fixed interval: the maker's schedule, otherwise by use", "primary", "grounds",
    "Set the interval from the equipment maker or your risk assessment."),
  C("us-key-audit", "US", "Key register audit", 1, "year", "School security practice checklist (guidance)", "Annual key audit", "practice", "safety"),

  C("uk-alarm-test", "UK", "Fire alarm: weekly test of a call point", 1, "week", "Department for Education estate guidance (England)", "Weekly test, rotating call points", "primary", "safety",
    "Competent-person inspection is quarterly or annual: add it as its own check."),
  C("uk-emergency-lighting", "UK", "Emergency lighting: monthly function test", 1, "month", "Department for Education estate guidance (England)", "Monthly function test; annual full-duration test", "primary", "safety"),
  C("uk-fire-drill", "UK", "Fire drill", 4, "month", "Fire safety guidance for educational premises (England and Wales)", "At least annually, preferably each term", "primary", "safety"),
  C("uk-extinguishers", "UK", "Extinguishers, blankets and fixed systems: annual service", 1, "year", "Department for Education estate guidance (England)", "At least annually", "primary", "safety"),
  C("uk-lift", "UK", "Passenger lift: thorough examination", 6, "month", "Department for Education estate guidance (England)", "Every six months for lifts that carry people", "primary", "safety"),
  C("uk-gas", "UK", "Gas appliances: safety check", 1, "year", "Department for Education estate guidance (England)", "At least annually (good practice)", "primary", "maintenance"),
  C("uk-fire-risk", "UK", "Fire risk assessment: review", 1, "year", "Department for Education estate guidance (England)", "Review annually; a written assessment is required", "primary", "safety"),
  C("uk-legionella-flush", "UK", "Water: flush little-used outlets", 1, "week", "Water safety guidance (England)", "Flush little-used outlets weekly; the interval comes from the risk assessment", "snippet", "maintenance",
    "No fixed legal interval: your written risk assessment sets it."),

  C("in-structural", "IN", "Building: look for cracks, especially in the rains", 3, "month", "National school safety and security manual", "Quarterly structural check", "primary", "safety"),
  C("in-mock-drill", "IN", "Mock drill: fire and evacuation", 6, "month", "National school safety and security manual", "\"Periodically\": the interval is yours to set", "primary", "safety",
    "Some boards and states ask for more; confirm yours."),
  C("in-fire-noc", "IN", "Fire safety certificate: renew before it expires", 1, "year", "State fire services (validity differs by state)", "Validity of one to three years seen in sources: set it from your certificate", "snippet", "safety",
    "Better kept as a document with its own expiry date, under Documents."),
  C("in-first-aid", "IN", "First-aid boxes: stocked and in date", 1, "month", "National school safety and security manual", "Box in each lab, building and bus; no interval stated", "practice", "safety"),

  C("any-first-aid", "ANY", "First-aid kits: stocked and in date", 1, "month", "Good practice", "No fixed interval", "practice", "safety"),
  C("any-visitor-log", "ANY", "Visitor and contractor log: review", 1, "month", "Good practice", "Sign-in and supervision are the usual expectation", "practice", "safety")
];
