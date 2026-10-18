/* ==========================================================================
   /api/v1/attendance/review, /log, /settings, /remove

   What the people who run the school day need beyond taking a register
   (periods.js): which registers were taken on which days, what a mark used
   to say and who changed it, whether families see attendance online, and
   which marks look wrong.

   Reading and correcting are the school's: a dean, principal, registrar or
   administrator. Whether families see attendance is a setup decision, so
   only a principal, registrar or administrator makes it.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must } from "../core/guard.js";
import { daysOf } from "./schedule.js";
import { IN_CODES, lockedBy } from "../services/register.js";
import { adaFor } from "../services/ada.js";

/* A code is what a mark says. Its *kind* is how it counts: a school may have
   any number of codes (Illness, Field trip, Religious holiday…), each of one
   of five kinds, and every total in the console is by kind.

     present   in the room                       counts as present everywhere
     tardy     in the room, late                 tardy on a report card, present for attendance rates
     absent    not in the room                   absent everywhere
     excused   not in the room, excused          absent on a report card, present for attendance
                                                 rates; a state decides for its own reports
     norecord  not enrolled that day             counts as nothing

   The first active code is the default and must be of kind present. */
export const KINDS = ["present", "tardy", "absent", "excused", "norecord"];
export const DEFAULT_CODES = [
  { key: "present", label: "Present", mark: "P", kind: "present", adminOnly: false, retired: false },
  { key: "absent", label: "Absent", mark: "A", kind: "absent", adminOnly: false, retired: false },
  { key: "late", label: "Late", mark: "L", kind: "tardy", adminOnly: false, retired: false },
  { key: "excused", label: "Excused", mark: "E", kind: "excused", adminOnly: false, retired: false },
  { key: "cut", label: "Cut", mark: "C", kind: "absent", adminOnly: false, retired: false }
];
const KEY = /^[a-z][a-z0-9_-]{0,23}$/;

/* The codes as stored, or the five every school starts with. Never throws:
   a settings row somebody wrote badly must not take attendance down. */
function codesIn(list) {
  if (!Array.isArray(list) || !list.length || list.length > 30) return DEFAULT_CODES;
  const seen = new Set(), out = [];
  for (const c of list) {
    if (!c || !KEY.test(c.key) || seen.has(c.key) || !KINDS.includes(c.kind) || typeof c.label !== "string" || !c.label.trim()) return DEFAULT_CODES;
    seen.add(c.key);
    out.push({ key: c.key, label: c.label.trim().slice(0, 40), mark: String(c.mark || c.label).trim().slice(0, 3),
               kind: c.kind, adminOnly: c.adminOnly === true, retired: c.retired === true });
  }
  const first = out.find((c) => !c.retired);
  return first && first.kind === "present" ? out : DEFAULT_CODES;
}
export const activeKeys = (codes) => codes.filter((c) => !c.retired).map((c) => c.key);
export const keysOfKind = (codes, ...kinds) => codes.filter((c) => kinds.includes(c.kind)).map((c) => c.key);
export const kindOf = (codes, key) => { const c = codes.find((x) => x.key === key); return c ? c.kind : "absent"; };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SCHOOLWIDE = { accountId: null, courseId: null, orgId: null, schoolWide: true };
const MAX_SPAN = 92;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

const day = (v, field) => {
  const s = check.string(v, field, { max: 10 });
  if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return s;
};

const utc = (ymd) => new Date(ymd + "T00:00:00Z");
const ymd = (d) => d.toISOString().slice(0, 10);

function eachDay(from, to) {
  const out = [];
  for (let d = utc(from); ymd(d) <= to && out.length < 400; d = new Date(d.getTime() + 86400000)) out.push(ymd(d));
  return out;
}

/* A school that has set nothing keeps attendance to itself. */
export function settingsOf(row) {
  let b = {};
  try { b = row && row.body_json ? JSON.parse(row.body_json) : {}; } catch { b = {}; }
  return {
    online: b.online === true,
    closed: Array.isArray(b.closed) ? b.closed.filter((c) => c && DAY.test(c.from) && DAY.test(c.to)) : [],
    codes: codesIn(b.codes),
    lockDays: Number.isInteger(b.lockDays) && b.lockDays >= 0 && b.lockDays <= 365 ? b.lockDays : null,
    // Minutes present for a whole day and for a half day; blank is "not counted this way".
    fullDayMinutes: Number.isInteger(b.fullDayMinutes) && b.fullDayMinutes > 0 && b.fullDayMinutes <= 1440 ? b.fullDayMinutes : null,
    halfDayMinutes: Number.isInteger(b.halfDayMinutes) && b.halfDayMinutes > 0 && b.halfDayMinutes <= 1440 ? b.halfDayMinutes : null
  };
}

export async function attendanceSettings(ctx, orgId) {
  const row = await ctx.repo.getAttendanceSettings(orgId);
  const s = settingsOf(row);
  // A school outside the US that has set none of its own starts from an Indian class register's four marks,
  // and gives a class teacher three days to correct a register before only the office may.
  let b = {};
  try { b = row && row.body_json ? JSON.parse(row.body_json) : {}; } catch { b = {}; }
  const ownCodes = Array.isArray(b.codes) && b.codes.length, ownLock = "lockDays" in b;
  if (orgId && (!ownCodes || !ownLock)) {
    const org = await ctx.repo.getOrganization(orgId);
    if (org && org.region === "IN") {
      if (!ownCodes) s.codes = IN_CODES;
      if (!ownLock) s.lockDays = 3;
    }
  }
  return s;
}

const shapeSettings = (s, row) => ({
  online: s.online, closed: s.closed, codes: s.codes, lockDays: s.lockDays,
  fullDayMinutes: s.fullDayMinutes, halfDayMinutes: s.halfDayMinutes,
  updatedAt: row ? row.updated_at : null, updatedBy: row ? row.updated_by : null
});

/* GET /attendance/codes
   What a mark can say, for everyone who draws or takes one: the school's own
   people, a teacher at a register, a family reading a record. Nothing here is
   private. */
export async function getCodes(ctx) {
  const actor = requireActor(ctx);
  const s = await attendanceSettings(ctx, orgOf(actor));
  return json({ codes: s.codes, lockDays: s.lockDays, closed: s.closed });
}

/* GET /attendance/settings */
export async function getSettings(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "attendance.read", SCHOOLWIDE);
  const row = await ctx.repo.getAttendanceSettings(orgOf(actor));
  return json({ settings: shapeSettings(settingsOf(row), row) });
}

/* PUT /attendance/settings  { online, closed: [{ from, to, label }], codes?, lockDays? }
   codes and lockDays are left as they are when not sent. */
export async function putSettings(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account belongs to no school.");
  if (!(await can(ctx, "period.write", { orgId }))) {
    throw ApiError.forbidden("Only a principal, registrar or administrator can change attendance settings.");
  }
  const body = await readJson(ctx.request);
  if (typeof body.online !== "boolean") throw ApiError.badRequest("online must be true or false.", "online");
  if (!Array.isArray(body.closed) || body.closed.length > 80) throw ApiError.badRequest("closed must be a list of up to 80 spans.", "closed");
  const closed = body.closed.map((c) => {
    const from = day(c && c.from, "closed.from"), to = day(c && c.to, "closed.to");
    if (to < from) throw ApiError.badRequest("A closure cannot end before it starts.", "closed");
    if (utc(to) - utc(from) > 120 * 86400000) throw ApiError.badRequest("A closure is at most 120 days.", "closed");
    return { from, to, label: c.label == null || c.label === "" ? "" : check.string(c.label, "closed.label", { max: 80 }) };
  });
  const was = await attendanceSettings(ctx, orgId);
  let codes = was.codes;
  if (body.codes !== undefined) {
    codes = codesIn(body.codes);
    // codesIn falls back to the defaults on anything wrong; say so instead of saving something else.
    if (codes === DEFAULT_CODES && JSON.stringify(body.codes) !== JSON.stringify(DEFAULT_CODES)) {
      throw ApiError.badRequest("Codes need a key (letters, digits, - and _), a label, a kind, and the first one in use must be of kind present.", "codes");
    }
    // A code that has been used is retired, never deleted: its marks keep their meaning.
    const keep = new Set(codes.map((c) => c.key));
    const lost = was.codes.filter((c) => !keep.has(c.key));
    if (lost.length) throw ApiError.badRequest(`A code cannot be removed, only retired: ${lost.map((c) => c.label).join(", ")}.`, "codes");
  }
  let lockDays = was.lockDays;
  if (body.lockDays !== undefined) {
    if (body.lockDays !== null && !(Number.isInteger(body.lockDays) && body.lockDays >= 0 && body.lockDays <= 365)) {
      throw ApiError.badRequest("lockDays must be a whole number of days, or null for no limit.", "lockDays");
    }
    lockDays = body.lockDays;
  }
  const minutes = (v, was, f) => {
    if (v === undefined) return was;
    if (v === null) return null;
    if (!Number.isInteger(v) || v < 1 || v > 1440) throw ApiError.badRequest(`${f} is a number of minutes, or empty.`, f);
    return v;
  };
  const fullDayMinutes = minutes(body.fullDayMinutes, was.fullDayMinutes, "fullDayMinutes");
  const halfDayMinutes = minutes(body.halfDayMinutes, was.halfDayMinutes, "halfDayMinutes");
  if (fullDayMinutes != null && halfDayMinutes != null && halfDayMinutes > fullDayMinutes) {
    throw ApiError.badRequest("A half day cannot need more minutes than a whole day.", "halfDayMinutes");
  }
  const row = await ctx.repo.putAttendanceSettings(orgId, { online: body.online, closed, codes, lockDays, fullDayMinutes, halfDayMinutes }, actor.id);
  return json({ settings: shapeSettings(settingsOf(row), row) });
}

/* GET /attendance/review?from=&to=&today=
   One read for the main view, the registers-not-taken list and the
   error scan: which course-days have a register (and how it came out), and
   the marks that look wrong. */
export async function review(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "attendance.read", SCHOOLWIDE);
  const q = ctx.url.searchParams;
  const from = day(q.get("from"), "from"), to = day(q.get("to"), "to");
  if (to < from) throw ApiError.badRequest("to is before from.", "to");
  if (utc(to) - utc(from) > MAX_SPAN * 86400000) throw ApiError.badRequest(`Look at no more than ${MAX_SPAN} days at a time.`, "to");
  const today = q.get("today") ? day(q.get("today"), "today") : null;
  const orgId = orgOf(actor);

  const settings = await attendanceSettings(ctx, orgId);
  const codes = settings.codes;
  const dates = eachDay(from, to);
  // The school's calendar decides what was a school day: a holiday, a staff
  // day, a snow day, a weekend. The closures this page used to keep are still
  // honoured, so nothing already entered changes meaning.
  const cal = await daysOf(ctx, orgId, from, to);
  const closed = {};
  const KIND_LABEL = { holiday: "Holiday", staff: "Staff day", canceled: "Canceled", none: null };
  cal.days.forEach((e) => {
    if (e.kind === "school") return;
    const off = [0, 6].includes(e.weekday) && e.source === "pattern";
    closed[e.day] = e.label || (off ? null : KIND_LABEL[e.kind] || "No school");
  });
  settings.closed.forEach((c) => dates.forEach((d) => { if (d >= c.from && d <= c.to) closed[d] = c.label || "No school"; }));
  const noSchool = Object.keys(closed);

  const [cov, prob] = await Promise.all([
    ctx.repo.attendanceCoverage({ orgId, from, to }),
    ctx.repo.attendanceProblems({ orgId, from, to, today, noSchool,
      awayKeys: keysOfKind(codes, "absent"), hereKeys: keysOfKind(codes, "present", "tardy") })
  ]);
  // One line per course and day, counted by what each code is, not by what it is called.
  const lines = new Map();
  for (const r of cov) {
    const k = r.course_id + "|" + r.day;
    const l = lines.get(k) || { courseId: r.course_id, day: r.day, n: 0, here: 0, away: 0, late: 0, counts: {}, at: 0, byId: null, byName: null };
    const kind = kindOf(codes, r.status);
    l.n += r.n; l.counts[r.status] = (l.counts[r.status] || 0) + r.n;
    if (kind === "present" || kind === "tardy") l.here += r.n;
    if (kind === "absent" || kind === "excused") l.away += r.n;
    if (kind === "tardy") l.late += r.n;
    if (r.at > l.at) { l.at = r.at; l.byId = r.by_id; l.byName = r.by_name; }
    lines.set(k, l);
  }

  const problems = [];
  prob.notEnrolled.forEach((r) => problems.push({
    kind: "not-enrolled", id: r.id, accountId: r.account_id, studentName: r.student_name, courseId: r.course_id,
    courseTitle: r.course_title, day: r.day, status: r.status, note: r.note
  }));
  prob.dayMarks.forEach((r) => problems.push({
    kind: "no-school", id: r.id, accountId: r.account_id, studentName: r.student_name, courseId: r.course_id,
    courseTitle: r.course_title, day: r.day, status: r.status, note: r.note,
    reason: closed[r.day] ? closed[r.day] : today && r.day > today ? "A day that has not come yet" : "A weekend"
  }));
  prob.disagree.forEach((r) => problems.push({
    kind: "disagree", accountId: r.account_id, studentName: r.student_name, day: r.day,
    absentCourseId: r.absent_course_id, absentCourseTitle: r.absent_course_title,
    hereCourseId: r.here_course_id, hereCourseTitle: r.here_course_title, hereStatus: r.here_status
  }));

  return json({
    from, to, today, closed: Object.keys(closed).sort().map((d) => ({ day: d, label: closed[d] })),
    // The days as the calendar decided them, and which periods each section meets in: enough for the
    // screen to say which registers a day owes (a section that meets on A days owes none on B days).
    calendar: cal.days.map((e) => ({ day: e.day, kind: e.kind, scheduleId: e.scheduleId, periods: e.periods, label: e.label })),
    sections: Object.fromEntries((await ctx.repo.listSectionPeriods(orgId)).map((r) => { let p = []; try { p = JSON.parse(r.periods_json || "[]"); } catch { p = []; } return [r.course_id, p]; })),
    coverage: [...lines.values()],
    problems,
    capped: [prob.notEnrolled, prob.dayMarks, prob.disagree].some((l) => l.length >= 200)
  });
}

/* GET /attendance/log?day=&accountId=&courseId=
   One date for everybody, or one student for every date — never everybody
   for every date, which is a book nobody can read. */
export async function log(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "attendance.read", SCHOOLWIDE);
  const q = ctx.url.searchParams;
  const d = q.get("day") ? day(q.get("day"), "day") : null;
  const accountId = q.get("accountId") || null;
  if (!d && !accountId) {
    throw ApiError.badRequest("Choose a date, or one student. Every student on every date is more than anyone can read.", "day");
  }
  const rows = await ctx.repo.attendanceLog({
    orgId: orgOf(actor), day: d, accountId, courseId: q.get("courseId") || null, limit: 500
  });
  return json({
    log: rows.map((r) => ({
      id: r.id, accountId: r.account_id, studentName: r.student_name, courseId: r.course_id, courseTitle: r.course_title,
      day: r.day, from: r.from_status, to: r.to_status, fromNote: r.from_note, toNote: r.to_note,
      via: r.via, byId: r.by_id, byName: r.by_name, at: r.at,
      fromReason: r.from_reason || null, toReason: r.to_reason || null, afterLock: !!r.after_lock, why: r.why || null
    })),
    capped: rows.length >= 500
  });
}

/* POST /attendance/remove  { ids: [...] }
   Takes marks away — a mark for a student who is not in the course, or for a
   day with no school. Each is kept as a line in the history. */
export async function remove(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "attendance.write", { courseId: null, orgId });
  const body = await readJson(ctx.request);
  if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 200) {
    throw ApiError.badRequest("ids must be a list of 1 to 200 marks.", "ids");
  }
  const ids = body.ids.map((x) => check.string(x, "ids", { max: 100 }));
  const locks = await ctx.repo.listAttendanceLocks(orgId);
  const why = typeof body.why === "string" ? body.why.trim() : "";
  const r = await ctx.repo.removeAttendance(ids, actor.id, orgId, { locked: (d) => !!lockedBy(locks, d), why });
  if (r.needWhy) throw ApiError.badRequest("Some of these marks are in a locked span. Say why you are removing them; the reason is kept.", "why");
  return json({ removed: r.removed });
}

/* POST /courses/:courseId/attendance-grade
   Turns a stretch of attendance into a mark in the gradebook: one piece of
   work, named "Attendance", with a score for every student in the course.

     start     the work is worth `start` points; each absence and tardy takes
               `perAbsence` / `perTardy` from it, after the first few are waived
     subtract  nobody starts with anything; the work is extra credit that can
               only take points off the total (the opposite of extra credit)
     add       nobody starts with anything; every day present earns `perPresent`

   It is a snapshot. Attendance changed afterwards does not move it; running
   this again on the same name rewrites the same piece of work, and a mark a
   teacher typed over by hand is rewritten with it. Rename the work and the
   next run makes a new one. */
export async function gradeAttendance(ctx, { courseId }) {
  const actor = requireActor(ctx);
  await must(ctx, "assignment.write", { courseId });
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");
  const body = await readJson(ctx.request);

  const from = day(body.from, "from"), to = day(body.to, "to");
  if (to < from) throw ApiError.badRequest("to is before from.", "to");
  if (utc(to) - utc(from) > 200 * 86400000) throw ApiError.badRequest("Grade one grading period at a time (up to 200 days).", "to");
  const mode = check.oneOf(body.mode || "start", "mode", ["start", "subtract", "add"]);
  const num = (v, f, max) => check.number(v == null ? 0 : v, f, { min: 0, max });
  const start = mode === "start" ? check.number(body.start, "start", { min: 1, max: 1000 }) : 0;
  const perAbsence = num(body.perAbsence, "perAbsence", 1000), perTardy = num(body.perTardy, "perTardy", 1000);
  const perPresent = mode === "add" ? num(body.perPresent, "perPresent", 1000) : 0;
  const waiveAbsences = Math.floor(num(body.waiveAbsences, "waiveAbsences", 365)), waiveTardies = Math.floor(num(body.waiveTardies, "waiveTardies", 365));
  const title = body.title == null ? "Attendance" : check.string(body.title, "title", { max: 160 });

  const { codes } = await attendanceSettings(ctx, orgOf(actor));
  const known = new Set(codes.map((c) => c.key));
  const keys = (v, fallback) => {
    if (v == null) return new Set(fallback);
    if (!Array.isArray(v) || v.some((k) => !known.has(k))) throw ApiError.badRequest("Choose codes the school uses.", "codes");
    return new Set(v);
  };
  const absent = keys(body.absenceCodes, keysOfKind(codes, "absent", "excused"));
  const tardy = keys(body.tardyCodes, keysOfKind(codes, "tardy"));
  const present = new Set(keysOfKind(codes, "present"));

  const rows = await ctx.repo.listAttendance({ courseId, from, to });
  if (rows.length >= 5000) throw ApiError.badRequest("That is more attendance than one read can hold. Choose a shorter span.", "to");
  const students = await ctx.repo.listCourseMembers(courseId, "student");
  const tally = new Map(students.map((s) => [s.id, { absences: 0, tardies: 0, presents: 0 }]));
  for (const r of rows) {
    const t = tally.get(r.account_id);
    if (!t) continue;                          // a mark for someone no longer in the course
    if (absent.has(r.status)) t.absences++;
    else if (tardy.has(r.status)) t.tardies++;
    else if (present.has(r.status)) t.presents++;
  }

  const outOf = mode === "start" ? start : 0.01;   // extra credit has no denominator; the field must still be positive
  const extra = mode !== "start";
  const existing = (await ctx.repo.listAssignments(courseId, { drafts: true })).find((a) => a.title === title);
  let work = existing;
  if (!work) {
    work = await ctx.repo.createAssignment({ courseId, title, outOf, extraCredit: extra, dueAt: Date.parse(to + "T23:59:00Z"), status: "open", createdBy: actor.id });
  } else {
    await ctx.repo.updateAssignment(work.id, { outOf, extraCredit: extra ? 1 : 0 });
  }

  const round = (n) => Math.round(n * 100) / 100;
  let penalised = 0;
  for (const s of students) {
    const t = tally.get(s.id);
    const lost = Math.max(0, t.absences - waiveAbsences) * perAbsence + Math.max(0, t.tardies - waiveTardies) * perTardy;
    const score = mode === "start" ? Math.max(0, start - lost) : mode === "subtract" ? -lost : t.presents * perPresent;
    if (lost > 0) penalised++;
    await ctx.repo.upsertGrade({
      assignmentId: work.id, accountId: s.id, score: round(score), outOf,
      status: "marked", gradedBy: actor.id,
      note: `Attendance ${from} to ${to}: ${t.absences} absent, ${t.tardies} tardy, ${t.presents} present`
    });
  }
  return json({
    assignment: { id: work.id, title, outOf, extraCredit: extra, created: !existing },
    students: students.length, penalised, from, to, mode
  });
}


/* GET /attendance/ada?from=&to=
   Average daily attendance over a span, from the periods each student was
   present for (see services/ada.js). For the school's own people. */
export async function ada(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "attendance.read", SCHOOLWIDE);
  const q = ctx.url.searchParams;
  const from = day(q.get("from"), "from"), to = day(q.get("to"), "to");
  if (to < from) throw ApiError.badRequest("to is before from.", "to");
  if (utc(to) - utc(from) > 62 * 86400000) throw ApiError.badRequest("Look at no more than two months at a time.", "to");
  const orgId = orgOf(actor);
  const settings = await attendanceSettings(ctx, orgId);
  const cal = await daysOf(ctx, orgId, from, to);
  const sched = new Map(cal.schedules.map((s) => [s.id, s]));
  const closed = (d) => settings.closed.some((c) => d >= c.from && d <= c.to);
  const mins = (p) => {
    if (!p.startsAt || !p.endsAt) return 0;
    const a = p.startsAt.split(":"), b = p.endsAt.split(":");
    return Math.max(0, (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]));
  };
  const days = cal.days.filter((e) => e.kind === "school" && !closed(e.day)).map((e) => {
    const s = e.scheduleId ? sched.get(e.scheduleId) : null;
    const minutes = new Map();
    if (s) for (const p of s.periods) if (p.kind !== "other") minutes.set(p.label, mins(p));
    return { day: e.day, minutes, minimum: !!(s && s.minimumDay) };
  });

  const sectionOf = new Map();
  for (const r of await ctx.repo.listSectionPeriods(orgId)) { try { sectionOf.set(r.course_id, JSON.parse(r.periods_json || "[]")); } catch { /* none */ } }
  const enrolled = new Map();
  for (const m of await ctx.repo.listStudentMemberships(orgId)) {
    (enrolled.get(m.account_id) || enrolled.set(m.account_id, []).get(m.account_id)).push({ courseId: m.course_id, joined: m.joined });
  }
  const rows = await ctx.repo.listAdaMarks({ orgId, from, to, limit: 80001 });
  if (rows.length > 80000) throw ApiError.badRequest("That is more attendance than one calculation can hold. Choose a shorter span.", "to");
  const marks = new Map(rows.map((r) => [r.account_id + "|" + r.course_id + "|" + r.day, r.status]));
  const codes = settings.codes;
  const result = adaFor({ days, sectionOf, enrolled, marks, kindOf: (st) => kindOf(codes, st), full: settings.fullDayMinutes, half: settings.halfDayMinutes });
  return json({
    from, to, fullDayMinutes: settings.fullDayMinutes, halfDayMinutes: settings.halfDayMinutes,
    byMinutes: settings.fullDayMinutes != null, ...result
  });
}
