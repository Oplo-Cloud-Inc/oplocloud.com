/* ==========================================================================
   /api/v1/register/*

   An Indian school's morning register: one mark per child per day, taken by the
   class teacher of the section, with the reason a child was away; the school's
   view of which registers are in; the 75% watch; and the lock a school puts on
   the days a board's list was built from.

   The marks are rows of learn_attendance with no course (a "whole day"), so the
   history, the parents' notice and every report that already reads attendance
   read these too. The rules of the 75% rule are services/register.js.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, isStaff, guardsStudent } from "../core/guard.js";
import { attendanceSettings, activeKeys, kindOf } from "./attendance.js";
import { daysOf } from "./schedule.js";
import { notify } from "../services/notify.js";
import * as I from "../services/india.js";
import * as R from "../services/register.js";
import * as E from "../services/early.js";
import { profileOf, dayIn } from "../services/profile.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
const day = (v, field) => {
  const s = check.string(v, field, { max: 10 });
  if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return s;
};
const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const dmy = (ymd) => ymd.slice(8, 10) + "/" + ymd.slice(5, 7) + "/" + ymd.slice(0, 4);

async function school(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  const profile = profileOf(await ctx.repo.getOrganization(orgId));
  return { actor, orgId, profile, today: dayIn(profile.timezone) };
}
async function klass(ctx, orgId, classId) {
  const c = await ctx.repo.getIndiaClass(orgId, check.string(classId, "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  return c;
}
const rollSort = (a, b) => (a.rollNo || 1e9) - (b.rollNo || 1e9) || String(a.name).localeCompare(String(b.name), "en", { sensitivity: "base" });

const shapeLock = (l) => ({ id: l.id, from: l.from_day, to: l.to_day, label: l.label, by: l.locked_by_name || null, at: l.locked_at });

/* One section's register for a day, as the screen draws it. */
async function view(ctx, S, c, d) {
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, c.id)).map(I.shapeStudent).sort(rollSort);
  const marks = new Map((await ctx.repo.wholeDayMarks(d, kids.map((k) => k.id))).map((m) => [m.account_id, m]));
  const [settings, cal, locks] = await Promise.all([attendanceSettings(ctx, S.orgId), daysOf(ctx, S.orgId, d, d), ctx.repo.listAttendanceLocks(S.orgId)]);
  const sd = cal.days[0] || { kind: "none", label: null };
  const lock = R.lockedBy(locks, d);
  const students = kids.map((k) => {
    const m = marks.get(k.id);
    return { id: k.id, name: k.name, rollNo: k.rollNo || null, status: m ? m.status : null, reason: m ? m.reason || null : null, note: m ? m.note || null : null,
             markedBy: m ? m.marked_by_name || null : null, markedAt: m ? m.marked_at : null };
  });
  const marked = students.filter((s) => s.status).length;
  const staff = isStaff(S.actor, S.orgId);
  return {
    class: { id: c.id, label: I.classLabel(c.grade, c.section), year: c.school_year, room: c.room || null }, day: d, today: S.today,
    schoolDay: { kind: sd.kind, label: sd.label || null }, locked: lock ? shapeLock(lock) : null,
    codes: settings.codes.filter((x) => !x.retired), reasons: R.REASONS.map(([key, label]) => ({ key, label })),
    students, strength: students.length, marked, taken: students.length > 0 && marked === students.length,
    lockDays: settings.lockDays, canEdit: !lock ? true : staff
  };
}

/* GET /register?classId=&day= */
export async function getRegister(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const c = await klass(ctx, S.orgId, q.get("classId"));
  await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  return json(await view(ctx, S, c, q.get("day") ? day(q.get("day"), "day") : S.today));
}

/* PUT /register { classId, day, marks: [{ accountId, status, reason?, note? }], why?, force? }
   The whole section's register in one request. */
export async function putRegister(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await klass(ctx, S.orgId, b.classId);
  await must(ctx, "register.write", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const d = day(b.day, "day");
  const staff = isStaff(S.actor, S.orgId);
  if (d > S.today) throw ApiError.forbidden("A register cannot be taken for a day that has not come.");
  const [settings, cal, locks] = await Promise.all([attendanceSettings(ctx, S.orgId), daysOf(ctx, S.orgId, d, d), ctx.repo.listAttendanceLocks(S.orgId)]);
  const sd = cal.days[0];
  if (sd && sd.kind !== "school" && !(b.force === true && staff)) {
    throw ApiError.badRequest(`${dmy(d)} is not a school day${sd.label ? " (" + sd.label + ")" : ""}.`, "day");
  }
  // After a span has been reported, only the office edits it, and says why; the change is marked as made after the lock.
  const lock = R.lockedBy(locks, d);
  let why = null;
  if (lock) {
    if (!staff) throw ApiError.forbidden(`${dmy(d)} is locked (${lock.label}). Ask the office to correct it.`);
    why = typeof b.why === "string" ? b.why.trim() : "";
    if (why.length < 5) throw ApiError.badRequest(`This day is locked for ${lock.label}. Say why you are changing it; the reason is kept with the change.`, "why");
  } else if (!staff && settings.lockDays != null && d < addDays(S.today, -settings.lockDays)) {
    throw ApiError.forbidden(`A class teacher can change a register for ${settings.lockDays === 1 ? "one day" : settings.lockDays + " days"} after it. Ask the office to correct it.`);
  }
  if (!Array.isArray(b.marks) || !b.marks.length || b.marks.length > 200) throw ApiError.badRequest("marks must be a list of 1 to 200 children.", "marks");

  const kids = (await ctx.repo.listIndiaStudents(S.orgId, c.id)).map((r) => r.account_id);
  const roster = new Set(kids);
  const held = new Map((await ctx.repo.wholeDayMarks(d, kids)).map((m) => [m.account_id, m]));
  const byKey = new Map(settings.codes.map((x) => [x.key, x]));
  const allowed = activeKeys(settings.codes);
  const told = [];
  for (const m of b.marks) {
    const accountId = check.string(m.accountId, "accountId", { max: 100 });
    if (!roster.has(accountId)) throw ApiError.badRequest("That child is not in this section.", "accountId");
    const was = held.get(accountId);
    const status = check.oneOf(m.status, "status", allowed.concat(was ? [was.status] : []));
    const code = byKey.get(status), kind = code ? code.kind : "absent";
    if (!staff) {
      if (code && code.adminOnly && (!was || was.status !== status)) throw ApiError.forbidden(`“${code.label}” is for the office to set.`);
      if (was && was.status !== status && byKey.get(was.status) && byKey.get(was.status).adminOnly) throw ApiError.forbidden(`This mark is “${byKey.get(was.status).label}”, which the office set.`);
    }
    let reason = null;
    if (m.reason !== undefined && m.reason !== null && m.reason !== "") {
      if (kind !== "absent" && kind !== "excused") throw ApiError.badRequest("A reason is for a child who was away.", "reason");
      reason = check.oneOf(m.reason, "reason", R.REASON_KEYS);
    }
    await ctx.repo.upsertAttendance({ accountId, courseId: null, day: d, status, note: m.note ? check.string(m.note, "note", { max: 300 }) : null, reason,
      actorId: S.actor.id, via: "class", afterLock: !!lock, why });
    if (kind === "absent" && (!was || kindOf(settings.codes, was.status) !== "absent")) told.push(accountId);
  }
  // A child marked absent is told to their family once for the day, the way a course's register does.
  if (told.length) {
    ctx.waitUntil((async () => {
      for (const accountId of told) {
        const to = [accountId].concat(await ctx.repo.guardianIdsOf([accountId]));
        await notify(ctx.repo, { orgId: S.orgId, to, kind: "alert", from: S.actor.id, title: `Marked absent: ${dmy(d)}`,
          body: `The class register for ${dmy(d)} says absent. If this is a mistake, tell the class teacher.`, link: "attendance", dedupe: `reg:${accountId}:${d}:absent` });
      }
    })());
  }
  return json(await view(ctx, S, c, d));
}

/* GET /register/classes?day=&mine=1 — every section and whether its register is in. */
export async function classes(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const d = q.get("day") ? day(q.get("day"), "day") : S.today;
  const staff = isStaff(S.actor, S.orgId);
  const mine = q.get("mine") === "1" || !staff;
  const year = R.yearSpan(d, S.profile.yearStartMonth);
  const yearLabel = `${year.from.slice(0, 4)}-${+year.from.slice(0, 4) + 1}`;
  let list = (await ctx.repo.listIndiaClasses(S.orgId, yearLabel)).sort(I.byClass);
  if (mine) list = list.filter((c) => c.class_teacher_id === S.actor.id);
  const [taken, cal] = await Promise.all([ctx.repo.registerTaken(S.orgId, d), daysOf(ctx, S.orgId, d, d)]);
  const by = new Map(taken.map((t) => [t.class_id, t]));
  const sd = cal.days[0] || { kind: "none", label: null };
  return json({
    day: d, today: S.today, schoolDay: { kind: sd.kind, label: sd.label || null },
    classes: list.map((c) => {
      const t = by.get(c.id);
      return { id: c.id, label: I.classLabel(c.grade, c.section), year: c.school_year, room: c.room || null, strength: c.strength,
               classTeacher: c.class_teacher_id ? { id: c.class_teacher_id, name: c.teacher_name || "" } : null,
               marked: t ? t.marked : 0, taken: c.strength > 0 && !!t && t.marked >= c.strength, at: t ? t.at : null };
    })
  });
}

/* GET /register/pulse?days=30 — the school's attendance, a day at a time, and today's count for each section.
   Present is every mark whose code counts as attending (present or tardy); away is the rest. */
export async function pulse(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: null });
  const n = ctx.url.searchParams.get("days") ? check.number(ctx.url.searchParams.get("days"), "days", { min: 1, max: 120 }) : 30;
  const settings = await attendanceSettings(ctx, S.orgId);
  const kind = new Map(settings.codes.map((c) => [c.key, c.kind]));
  const rows = await ctx.repo.registerPulse(S.orgId, addDays(S.today, -n), S.today);
  const days = new Map(), classes = new Map();
  for (const r of rows) {
    const k = kind.get(r.status) || "absent", here = k === "present" || k === "tardy";
    const d = days.get(r.day) || { day: r.day, present: 0, away: 0, marked: 0 };
    d[here ? "present" : "away"] += r.n; d.marked += r.n; days.set(r.day, d);
    const c = classes.get(r.day) || new Map(), x = c.get(r.class_id) || { id: r.class_id, present: 0, away: 0, marked: 0 };
    x[here ? "present" : "away"] += r.n; x.marked += r.n; c.set(r.class_id, x); classes.set(r.day, c);
  }
  const list = [...days.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
  // The section counts are for today, or the latest day any register was taken.
  const latest = days.has(S.today) ? S.today : list.length ? list[list.length - 1].day : null;
  return json({ today: S.today, days: list, latest: latest && { day: latest, classes: [...(classes.get(latest) || new Map()).values()] } });
}

/* GET /register/watch?classId=&until=&threshold= — the 75% watch. */
export async function watch(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const classId = q.get("classId") || null;
  let c = null;
  if (classId) { c = await klass(ctx, S.orgId, classId); await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id }); }
  else await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: null });
  const threshold = q.get("threshold") ? check.number(q.get("threshold"), "threshold", { min: 1, max: 100 }) : R.THRESHOLD;
  const year = R.yearSpan(S.today, S.profile.yearStartMonth);
  const until = q.get("until") ? day(q.get("until"), "until") : year.to;
  const settings = await attendanceSettings(ctx, S.orgId);
  const tomorrow = addDays(S.today, 1);
  let remaining = 0;
  if (until >= tomorrow) remaining = (await daysOf(ctx, S.orgId, tomorrow, until)).days.filter((x) => x.kind === "school").length;
  const [rows, kids, cases] = await Promise.all([
    ctx.repo.watchCounts(S.orgId, year.from, S.today, classId),
    ctx.repo.listIndiaStudents(S.orgId, classId),
    ctx.repo.listItems({ orgId: S.orgId, kind: "condonation", limit: 500 })
  ]);
  const counts = R.tally(rows, settings.codes);
  const caseOf = new Map();
  for (const it of cases) if (it.subject_id && !caseOf.has(it.subject_id)) caseOf.set(it.subject_id, { id: it.id, status: it.status });
  const students = kids.map(I.shapeStudent).map((s) => ({
    id: s.id, name: s.name, classId: s.classId, classLabel: s.classLabel, rollNo: s.rollNo || null,
    ...R.standing(counts.get(s.id) || {}, threshold, remaining), case: caseOf.get(s.id) || null
  }));
  const rank = { below: 0, watch: 1, ok: 2, none: 3 };
  students.sort((a, b) => rank[a.status] - rank[b.status] || (a.status === "watch" ? a.canMiss - b.canMiss : (a.percent ?? 0) - (b.percent ?? 0)) || String(a.name).localeCompare(String(b.name)));
  const summary = { below: 0, watch: 0, ok: 0, none: 0 };
  for (const s of students) summary[s.status]++;
  return json({ year: { from: year.from, to: year.to }, today: S.today, until, threshold, remaining, summary, students });
}

/* GET /register/locks · POST /register/locks { from, to, label } */
export async function locks(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: S.actor.id });   // anyone who takes or checks a register may see what is locked
  return json({ locks: (await ctx.repo.listAttendanceLocks(S.orgId)).map(shapeLock) });
}
export async function addLock(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.lock", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  const from = day(b.from, "from"), to = day(b.to, "to");
  if (to < from) throw ApiError.badRequest("The last day is before the first.", "to");
  if (to > S.today) throw ApiError.badRequest("Only days that have passed can be locked.", "to");
  const label = check.string(b.label, "label", { max: 120 });
  const have = await ctx.repo.listAttendanceLocks(S.orgId);
  if (have.some((l) => l.from_day === from && l.to_day === to)) throw ApiError.conflict("That span is already locked.", "from");
  const id = await ctx.repo.addAttendanceLock(S.orgId, { from, to, label }, S.actor.id);
  return json({ lock: { id, from, to, label }, locks: (await ctx.repo.listAttendanceLocks(S.orgId)).map(shapeLock) }, { status: 201 });
}

/* GET /register/after-lock — every change made inside a locked span, and what was said. */
export async function afterLock(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.lock", { orgId: S.orgId });
  const rows = await ctx.repo.editsAfterLock(S.orgId, 200);
  return json({ edits: rows.map((r) => ({ id: r.id, student: r.student_name || "", accountId: r.account_id, day: r.day, from: r.from_status, to: r.to_status,
    fromReason: r.from_reason || null, toReason: r.to_reason || null, by: r.by_name || "", at: r.at, why: r.why || "" })) });
}

/* ------------------------------------------------------------- The class day
   The diary, a word to the families, and how long the day took. A phone with no
   signal sends these later, so each can carry a clientKey and be sent twice. */

const DIARY_KINDS = ["homework", "note", "circular"];
const shapeDiary = (d) => ({ id: d.id, classId: d.class_id, day: d.day, kind: d.kind, subject: d.subject || null, body: d.body, by: d.by_name || null, at: d.created_at });

/* The children of a section and their families, for a notice. */
async function familiesOf(ctx, S, classId, only) {
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, classId)).map((r) => r.account_id).filter((id) => !only || only.includes(id));
  return { kids, to: kids.concat(await ctx.repo.guardianIdsOf(kids)) };
}

/* POST /diary { classId, day?, kind?, subject?, body, clientKey? } */
export async function addDiary(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await klass(ctx, S.orgId, b.classId);
  await must(ctx, "register.write", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const d = { classId: c.id, day: b.day ? day(b.day, "day") : S.today, kind: check.oneOf(b.kind || "homework", "kind", DIARY_KINDS),
    subject: b.subject ? check.string(b.subject, "subject", { max: 60 }) : null, body: check.string(b.body, "body", { max: 1500 }),
    clientKey: b.clientKey ? check.string(b.clientKey, "clientKey", { max: 64 }) : null };
  const r = await ctx.repo.addDiary(S.orgId, d, S.actor.id);
  if (!r.again) {
    ctx.waitUntil((async () => {
      const f = await familiesOf(ctx, S, c.id);
      await notify(ctx.repo, { orgId: S.orgId, to: f.to, kind: "announcement", from: S.actor.id, title: `${d.kind === "homework" ? "Homework" : d.kind === "circular" ? "Circular" : "Note"}${d.subject ? ": " + d.subject : ""}`,
        body: d.body.slice(0, 300), link: "diary", dedupe: `diary:${r.row.id}` });
    })());
  }
  return json({ entry: shapeDiary(r.row), again: r.again }, { status: r.again ? 200 : 201 });
}

/* GET /diary?classId=&from=&to= — the class teacher and the office read what was written. */
export async function listDiary(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const c = await klass(ctx, S.orgId, q.get("classId"));
  await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  return json({ entries: (await ctx.repo.listDiary({ classId: c.id, from: q.get("from") ? day(q.get("from"), "from") : null, to: q.get("to") ? day(q.get("to"), "to") : null })).map(shapeDiary) });
}

/* GET /students/:id/diary?days=14 — the family's view: the diary of the child's section. */
export async function familyDiary(ctx, { accountId }) {
  const S = await school(ctx);
  if (S.actor.id !== accountId && !isStaff(S.actor, S.orgId) && !(await guardsStudent(ctx, S.actor, accountId))) throw ApiError.forbidden("The diary is read by the child, their family and the office.");
  const row = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  if (!row || !row.class_id) return json({ entries: [] });
  const days = ctx.url.searchParams.get("days") ? check.number(ctx.url.searchParams.get("days"), "days", { min: 1, max: 120 }) : 14;
  const from = new Date(Date.parse(S.today + "T00:00:00Z") - days * 86400000).toISOString().slice(0, 10);
  return json({ entries: (await ctx.repo.listDiary({ classId: row.class_id, from, limit: 200 })).map(shapeDiary) });
}

/* POST /register/message { classId, body, title?, to?: [childIds], clientKey? } — one word to the families, in one tap. */
export async function classMessage(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await klass(ctx, S.orgId, b.classId);
  await must(ctx, "register.write", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const body = check.string(b.body, "body", { max: 800 });
  const only = Array.isArray(b.to) && b.to.length ? b.to.map((x) => check.string(x, "to", { max: 100 })) : null;
  const f = await familiesOf(ctx, S, c.id, only);
  if (only && only.some((id) => !f.kids.includes(id))) throw ApiError.badRequest("Someone chosen is not in this section.", "to");
  if (!f.kids.length) throw ApiError.conflict("Nobody is in this section yet.");
  const title = b.title ? check.string(b.title, "title", { max: 120 }) : `From the class teacher of ${I.classLabel(c.grade, c.section)}`;
  const key = b.clientKey ? check.string(b.clientKey, "clientKey", { max: 64 }) : null;
  let reached = 0;
  for (const kid of f.kids) {
    const to = [kid].concat(await ctx.repo.guardianIdsOf([kid]));
    reached += await notify(ctx.repo, { orgId: S.orgId, to, kind: "message", from: S.actor.id, title, body, link: "inbox", dedupe: key ? `rmsg:${key}:${kid}` : null });
  }
  return json({ children: f.kids.length, reached, again: !!key && reached === 0 });
}

/* POST /register/day { classId, day?, seconds, steps?, offline? } — the class teacher says the day is done. */
export async function dayDone(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await klass(ctx, S.orgId, b.classId);
  await must(ctx, "register.write", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const seconds = Math.round(check.number(b.seconds, "seconds", { min: 0, max: 4 * 3600 }));
  const steps = Array.isArray(b.steps) ? b.steps.filter((x) => ["register", "diary", "message", "remarks"].includes(x)) : [];
  await ctx.repo.saveTeacherDay(S.orgId, c.id, b.day ? day(b.day, "day") : S.today, S.actor.id, seconds, steps, b.offline === true);
  return json({ saved: true, seconds });
}

/* GET /register/day-stats?from=&to= — how long a class teacher's day takes across the school. */
export async function dayStats(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.lock", { orgId: S.orgId });
  const q = ctx.url.searchParams;
  const to = q.get("to") ? day(q.get("to"), "to") : S.today;
  const from = q.get("from") ? day(q.get("from"), "from") : addDays(to, -29);
  const rows = await ctx.repo.teacherDays(S.orgId, from, to);
  return json({ from, to, ...R.spread(rows.map((r) => r.seconds)), offline: rows.filter((r) => r.offline).length });
}

/* --------------------------------------------------------------- Early warning */

/* GET /register/early-warning?classId= — who is drifting, and the reasons. The class teacher reads their own section; the office, all. */
export async function earlyWarning(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams, classId = q.get("classId") || null;
  if (classId) { const c = await klass(ctx, S.orgId, classId); await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id }); }
  else await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: null });
  const year = R.yearSpan(S.today, S.profile.yearStartMonth);
  const tomorrow = addDays(S.today, 1);
  const settings = await attendanceSettings(ctx, S.orgId);
  const remaining = year.to >= tomorrow ? (await daysOf(ctx, S.orgId, tomorrow, year.to)).days.filter((x) => x.kind === "school").length : 0;
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, classId)).map(I.shapeStudent);
  const ids = kids.map((k) => k.id);
  const minDays = q.get("minDays") ? check.number(q.get("minDays"), "minDays", { min: 1, max: 100 }) : E.MIN_DAYS;
  const [rows, marks, scales, cases] = await Promise.all([
    ctx.repo.watchCounts(S.orgId, year.from, S.today, classId), ctx.repo.examPercents(S.orgId, ids), ctx.repo.listScales(S.orgId),
    ctx.repo.listItems({ orgId: S.orgId, kind: "ewscase", limit: 1000 })
  ]);
  const counts = R.tally(rows, settings.codes);
  const pass = new Map(scales.map((x) => [x.id, x.pass_percent]));
  const byKid = new Map();
  for (const m of marks.sort((a, b) => a.exam_at - b.exam_at)) {
    if (!m.max) continue;
    (byKid.get(m.account_id) || byKid.set(m.account_id, []).get(m.account_id)).push({ name: m.exam_name, percent: Math.round((m.total / m.max) * 1000) / 10, passLine: pass.get(m.scale_id) ?? null });
  }
  const caseOf = new Map();
  for (const it of cases) if (it.subject_id && it.status !== "closed" && !caseOf.has(it.subject_id)) caseOf.set(it.subject_id, { id: it.id, status: it.status });
  const startYear = +year.from.slice(0, 4);
  const list = kids.map((k) => {
    const a = E.assess({ standing: R.standing(counts.get(k.id) || {}, R.THRESHOLD, remaining), exams: byKid.get(k.id) || [], year: startYear, minDays,
      facts: { dob: k.dob, grade: k.grade, migrant: k.migrant, cwsn: k.cwsn } });
    return { id: k.id, name: k.name, classId: k.classId, classLabel: k.classLabel, rollNo: k.rollNo || null, level: a.level, score: a.score, transition: a.transition,
             signals: a.signals.map((x) => ({ key: x.key, text: x.text })), case: caseOf.get(k.id) || null };
  }).sort((x, y) => y.score - x.score || String(x.name).localeCompare(String(y.name)));
  const summary = { high: 0, medium: 0, low: 0, none: 0 };
  const transitions = {};
  for (const x of list) { summary[x.level]++; if (x.transition) transitions[x.transition] = (transitions[x.transition] || 0) + 1; }
  return json({ year, today: S.today, summary, transitions, students: list });
}

/* GET /register/eligibility?classId=&all=1 — the board list: who is at 75% or above, who is under, and where a condonation stands. The classes a board lists by default. */
export async function eligibility(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams, classId = q.get("classId") || null;
  if (classId) { const c = await klass(ctx, S.orgId, classId); await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id }); }
  else await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: null });
  const year = R.yearSpan(S.today, S.profile.yearStartMonth);
  const settings = await attendanceSettings(ctx, S.orgId);
  const threshold = q.get("threshold") ? check.number(q.get("threshold"), "threshold", { min: 1, max: 100 }) : R.THRESHOLD;
  const to = q.get("until") ? day(q.get("until"), "until") : S.today;
  const [rows, kids, cases] = await Promise.all([ctx.repo.watchCounts(S.orgId, year.from, to, classId), ctx.repo.listIndiaStudents(S.orgId, classId), ctx.repo.listItems({ orgId: S.orgId, kind: "condonation", limit: 1000 })]);
  const counts = R.tally(rows, settings.codes);
  const caseOf = new Map();
  for (const it of cases) if (it.subject_id && !caseOf.has(it.subject_id)) caseOf.set(it.subject_id, it.status);
  const wanted = (s) => q.get("all") === "1" || !!classId || I.isBoardClass(s.grade);
  const out = kids.map(I.shapeStudent).filter(wanted).sort((a, b) => I.gradeRank(a.grade) - I.gradeRank(b.grade) || String(a.section).localeCompare(String(b.section)) || (a.rollNo || 999) - (b.rollNo || 999)).map((s) => {
    const st = R.standing(counts.get(s.id) || {}, threshold, 0);
    const status = st.status === "none" ? "No attendance marked" : st.percent >= threshold ? "Eligible" : caseOf.has(s.id) ? "Under " + threshold + "%: condonation " + caseOf.get(s.id) : st.condonable ? "Under " + threshold + "%: leave may be condoned" : "Under " + threshold + "%";
    return [s.classLabel || "", s.rollNo || "", s.name, s.admissionNo || "", s.boardRollNo || "", s.apaar || "", st.attended, st.total, st.percent == null ? "" : st.percent, st.percentWithLeave == null ? "" : st.percentWithLeave, status];
  });
  return json({ title: "Board eligibility list", file: `board-eligibility-${to}.csv`,
    columns: ["Class", "Roll", "Name", "Admission no", "Board roll no", "APAAR", "Days present", "Days marked", "Attendance %", "With leave %", "Status"], rows: out, threshold, counted: { from: year.from, to } });
}
