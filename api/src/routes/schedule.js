/* ==========================================================================
   /api/v1/subjects, /sections, /bell-schedules, /calendar, /schedule

   The schedule, the way a school office keeps it:

     subjects       the school's courses: World History, with a number,
                    credits, a GPA scale and how it appears on a transcript
     sections       one instance of a course: its teachers, the periods it
                    meets in, a room, a capacity, a roster. A section is the
                    row OEdu has always called a course; the roster, the
                    gradebook and the registers hang from it
     bell schedules named days made of periods, with optional times
     calendar       which bell schedule each weekday runs, and the dates that
                    differ: a holiday, a staff day, a snow day

   Anyone signed in may read the bell schedules and the calendar: students see
   them. The school's people read every section. Setting any of it is for a
   principal, registrar or administrator.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, isStaff, guardsStudent } from "../core/guard.js";
import { analyze as analyzePlan, build as buildPlan } from "../services/scheduler.js";
import {
  DAY_KINDS, WEEKDAYS, patternOf, effectiveDay, eachDate, labelsOf, meets, weekdayCopy
} from "../services/schedule.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

const day = (v, field) => {
  const s = check.string(v, field, { max: 10 });
  if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return s;
};

/* Setting the schedule is the school's, not a teacher's. */
async function mustSchedule(ctx, actor) {
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account belongs to no school.");
  if (!(await can(ctx, "period.write", { orgId }))) {
    throw ApiError.forbidden("Only a principal, registrar or administrator can set the schedule.");
  }
  return orgId;
}
function mustStaff(ctx, actor) {
  if (!isStaff(actor, orgOf(actor))) throw ApiError.forbidden("The schedule of the whole school is for the school's own people.");
}

const bool = (v, f) => { if (v !== undefined && typeof v !== "boolean") throw ApiError.badRequest(`${f} must be true or false.`, f); return v; };
const intOr = (v, f, min, max) => (v == null || v === "" ? null : Math.floor(check.number(v, f, { min, max })));
const txt = (v, f, max) => (v == null || v === "" ? null : check.string(v, f, { max }));

/* ------------------------------------------------------------------ Courses */

const shapeSubject = (s) => ({
  id: s.id, number: s.number, title: s.title, catalogCode: s.catalog_code,
  extracurricular: !!s.extracurricular, showOnline: !!s.show_online, countAttendance: !!s.count_attendance,
  onReportCards: !!s.on_report_cards, onTranscripts: !!s.on_transcripts, collegeCredit: !!s.college_credit,
  requestable: !!s.requestable, standards: s.standards, duration: s.duration, credits: s.credits,
  maxCredits: s.max_credits, gpa: s.gpa, position: s.position, gradReq: s.grad_req,
  grades: (() => { try { return s.grades_json ? JSON.parse(s.grades_json) : null; } catch { return null; } })(),
  gender: s.gender, capacity: s.capacity, approval: !!s.approval, description: s.description,
  retired: !!s.retired, sections: s.sections == null ? undefined : s.sections
});

function readSubject(body, partial) {
  const out = {};
  const has = (k) => body[k] !== undefined;
  if (!partial || has("number")) out.number = check.string(body.number, "number", { max: 20 });
  if (!partial || has("title")) out.title = check.string(body.title, "title", { max: 50 });
  if (has("catalogCode")) out.catalogCode = txt(body.catalogCode, "catalogCode", 64);
  for (const k of ["extracurricular", "showOnline", "countAttendance", "onReportCards", "onTranscripts", "collegeCredit", "requestable", "approval", "retired"]) {
    if (has(k)) out[k] = bool(body[k], k);
  }
  if (has("standards")) out.standards = txt(body.standards, "standards", 80);
  if (has("duration")) out.duration = check.oneOf(body.duration, "duration", ["quarter", "trimester", "semester", "year"]);
  if (has("credits")) out.credits = check.number(body.credits, "credits", { min: 0, max: 100 });
  if (has("maxCredits")) out.maxCredits = body.maxCredits == null ? null : check.number(body.maxCredits, "maxCredits", { min: 0, max: 1000 });
  if (has("gpa")) out.gpa = check.oneOf(body.gpa, "gpa", ["regular", "honors", "ap"]);
  if (has("position")) out.position = intOr(body.position, "position", 1, 100);
  if (has("gradReq")) out.gradReq = txt(body.gradReq, "gradReq", 60);
  if (has("grades")) {
    if (body.grades !== null && (!Array.isArray(body.grades) || body.grades.length > 20)) throw ApiError.badRequest("grades must be a list of grade levels.", "grades");
    out.grades = body.grades === null ? null : body.grades.map((g) => check.string(String(g), "grades", { max: 12 }));
  }
  if (has("gender")) out.gender = txt(body.gender, "gender", 20);
  if (has("capacity")) out.capacity = intOr(body.capacity, "capacity", 1, 1000);
  if (has("description")) out.description = txt(body.description, "description", 1000);
  return out;
}

export async function listSubjects(ctx) {
  const actor = requireActor(ctx);
  const rows = await ctx.repo.listSubjects(orgOf(actor));
  return json({ subjects: rows.map(shapeSubject) });
}

export async function createSubject(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  const d = readSubject(body, false);
  if (await ctx.repo.findSubjectByNumber(orgId, d.number)) {
    throw ApiError.conflict("A course already has that number. A number is never used for two courses.", "number");
  }
  const s = await ctx.repo.createSubject({ ...d, orgId, createdBy: actor.id });
  return json({ subject: shapeSubject(s) }, { status: 201 });
}

export async function updateSubject(ctx, { subjectId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const s = await ctx.repo.findSubject(subjectId);
  if (!s || s.org_id !== orgId) throw ApiError.notFound("No such course.");
  const patch = readSubject(await readJson(ctx.request), true);
  if (patch.number && patch.number !== s.number && await ctx.repo.findSubjectByNumber(orgId, patch.number)) {
    throw ApiError.conflict("A course already has that number.", "number");
  }
  return json({ subject: shapeSubject(await ctx.repo.updateSubject(subjectId, patch)) });
}

/* ----------------------------------------------------------------- Sections */

const periodsOf = (row) => { try { return JSON.parse(row.periods_json || "[]"); } catch { return []; } };

function shapeSection(c, people, counts) {
  const periods = periodsOf(c);
  let from = null;
  try { from = c.body_json ? (JSON.parse(c.body_json) || {}).from || null : null; } catch { from = null; }
  return {
    courseId: c.id, code: c.code, title: c.title, area: c.area, status: c.status, catalogCode: from,
    subjectId: c.subject_id || null, subjectNumber: c.subject_number || null, subjectTitle: c.subject_title || null,
    duration: c.duration || null, credits: c.credits == null ? null : c.credits,
    sectionNo: c.section_no || null, tab: c.tab || null, room: c.room || null,
    capacity: c.capacity != null ? c.capacity : c.subject_capacity != null ? c.subject_capacity : null,
    periods, placed: periods.length > 0,
    teachers: (people.get(c.id) || []).map((p) => ({ id: p.account_id, name: p.name, role: p.role })),
    students: counts.get(c.id) || 0
  };
}

async function readSchool(ctx, orgId) {
  const r = await ctx.repo.listSections(orgId);
  const people = new Map(), counts = new Map();
  for (const p of r.people) (people.get(p.course_id) || people.set(p.course_id, []).get(p.course_id)).push(p);
  for (const c of r.counts) counts.set(c.course_id, c.n);
  return { rows: r.courses, people, counts };
}

/* The periods a school has: every label on every bell schedule. */
async function knownPeriods(ctx, orgId) {
  const { periods } = await ctx.repo.listBellSchedules(orgId);
  return new Set(periods.map((p) => p.label));
}

async function readPeriods(ctx, orgId, v) {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.length > 12) throw ApiError.badRequest("periods must be a list of up to 12 periods.", "periods");
  const labels = v.map((x) => check.string(String(x), "periods", { max: 24 }));
  const known = await knownPeriods(ctx, orgId);
  if (known.size) {
    const bad = labels.filter((l) => !known.has(l));
    if (bad.length) throw ApiError.badRequest(`No bell schedule has a period called ${bad.map((b) => `“${b}”`).join(", ")}.`, "periods");
  }
  return Array.from(new Set(labels));
}

/* GET /sections */
export async function listSections(ctx) {
  const actor = requireActor(ctx);
  mustStaff(ctx, actor);
  const { rows, people, counts } = await readSchool(ctx, orgOf(actor));
  return json({ sections: rows.map((c) => shapeSection(c, people, counts)) });
}

/* GET /students/:accountId/sections — the sections one student is in. */
export async function studentSections(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "account.read", { accountId });
  const mine = await ctx.repo.listCourses({ accountId });
  const inIt = new Set(mine.filter((c) => c.my_role === "student" && c.status !== "archived").map((c) => c.id));
  const { rows, people, counts } = await readSchool(ctx, orgOf(actor));
  return json({ sections: rows.filter((c) => inIt.has(c.id)).map((c) => shapeSection(c, people, counts)) });
}

/* POST /sections  { subjectId, teacherIds, periods, room, capacity, sectionNo, tab, title?, published? }
   Makes the course row, the schedule facts beside it, and the teachers. */
export async function createSection(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  const subject = await ctx.repo.findSubject(check.string(body.subjectId, "subjectId", { max: 100 }));
  if (!subject || subject.org_id !== orgId) throw ApiError.notFound("No such course.");
  const periods = (await readPeriods(ctx, orgId, body.periods)) || [];
  const teacherIds = Array.isArray(body.teacherIds) ? body.teacherIds.slice(0, 8).map((t) => check.string(t, "teacherIds", { max: 100 })) : [];
  for (const t of teacherIds) if (!(await ctx.repo.findAccountById(t))) throw ApiError.notFound("No such teacher.");

  // The first section of a course that teaches from written curriculum takes
  // its code, so the lessons are found; later ones are numbered, and say what
  // they teach from.
  const base = (subject.catalog_code || subject.number).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "course";
  let code = base, n = 1;
  while (await ctx.repo.findCourseByCode(orgId, code)) { n++; code = `${base}-${n}`; if (n > 200) throw ApiError.conflict("Too many sections of one course."); }
  const title = body.title == null ? subject.title : check.string(body.title, "title", { max: 160 });
  const course = await ctx.repo.createCourse({
    orgId, code, title, subject: body.area || null, level: null, summary: null,
    body: subject.catalog_code ? { from: subject.catalog_code } : null,
    status: body.published === false ? "draft" : "published", createdBy: actor.id
  });
  for (const t of teacherIds) await ctx.repo.enrol(course.id, t, "teacher");
  await ctx.repo.upsertSection(course.id, {
    subjectId: subject.id, sectionNo: txt(body.sectionNo, "sectionNo", 20) || String(n).padStart(2, "0"),
    tab: txt(body.tab, "tab", 20), room: txt(body.room, "room", 40), capacity: intOr(body.capacity, "capacity", 1, 1000), periods
  }, actor.id);
  const { rows, people, counts } = await readSchool(ctx, orgId);
  return json({ section: shapeSection(rows.find((c) => c.id === course.id), people, counts) }, { status: 201 });
}

/* PUT /sections/:courseId  { subjectId?, sectionNo?, tab?, room?, capacity?, periods? } */
export async function putSection(ctx, { courseId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const course = await ctx.repo.findCourse(courseId);
  if (!course || course.org_id !== orgId) throw ApiError.notFound("No such section.");
  const body = await readJson(ctx.request);
  const was = (await ctx.repo.findSection(courseId)) || {};
  let subjectId = was.subject_id || null;
  if (body.subjectId !== undefined) {
    if (body.subjectId === null) subjectId = null;
    else {
      const s = await ctx.repo.findSubject(check.string(body.subjectId, "subjectId", { max: 100 }));
      if (!s || s.org_id !== orgId) throw ApiError.notFound("No such course.");
      subjectId = s.id;
    }
  }
  const periods = await readPeriods(ctx, orgId, body.periods);
  await ctx.repo.upsertSection(courseId, {
    subjectId,
    sectionNo: body.sectionNo !== undefined ? txt(body.sectionNo, "sectionNo", 20) : was.section_no,
    tab: body.tab !== undefined ? txt(body.tab, "tab", 20) : was.tab,
    room: body.room !== undefined ? txt(body.room, "room", 40) : was.room,
    capacity: body.capacity !== undefined ? intOr(body.capacity, "capacity", 1, 1000) : was.capacity,
    periods: periods !== undefined ? periods : periodsOf(was)
  }, actor.id);
  const { rows, people, counts } = await readSchool(ctx, orgId);
  return json({ section: shapeSection(rows.find((c) => c.id === courseId), people, counts) });
}

/* POST /sections/:courseId/students  { accountIds?, copyFrom? }
   Puts students in a section: a list of them, or everyone from another
   section. Nobody is refused for a full section: capacity limits automatic
   scheduling, and a person may still be placed by hand. It is reported. */
export async function addStudents(ctx, { courseId }) {
  requireActor(ctx);
  await must(ctx, "course.enrol", { courseId });
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such section.");
  const body = await readJson(ctx.request);
  let ids = [];
  if (body.copyFrom) {
    const from = await ctx.repo.findCourse(check.string(body.copyFrom, "copyFrom", { max: 100 }));
    if (!from || from.org_id !== course.org_id) throw ApiError.notFound("No such section to copy from.");
    ids = (await ctx.repo.listCourseMembers(from.id, "student")).map((m) => m.id);
  } else {
    if (!Array.isArray(body.accountIds) || !body.accountIds.length || body.accountIds.length > 500) {
      throw ApiError.badRequest("accountIds must be a list of 1 to 500 students.", "accountIds");
    }
    ids = body.accountIds.map((x) => check.string(x, "accountIds", { max: 100 }));
  }
  const have = new Set((await ctx.repo.listCourseMembers(courseId, "student")).map((m) => m.id));
  let added = 0, already = 0, missing = 0;
  for (const a of ids) {
    if (have.has(a)) { already++; continue; }
    if (!(await ctx.repo.findAccountById(a))) { missing++; continue; }
    await ctx.repo.enrol(courseId, a, "student");
    have.add(a); added++;
  }
  const sec = await ctx.repo.findSection(courseId);
  const cap = sec && sec.capacity != null ? sec.capacity : null;
  return json({ added, already, missing, students: have.size, capacity: cap, over: cap != null && have.size > cap });
}

/* POST /sections/:courseId/drop  { accountIds? , all? } */
export async function dropStudents(ctx, { courseId }) {
  requireActor(ctx);
  await must(ctx, "course.enrol", { courseId });
  const body = await readJson(ctx.request);
  const members = await ctx.repo.listCourseMembers(courseId, "student");
  let ids;
  if (body.all === true) ids = members.map((m) => m.id);
  else {
    if (!Array.isArray(body.accountIds) || !body.accountIds.length || body.accountIds.length > 500) {
      throw ApiError.badRequest("Choose the students to drop, or all.", "accountIds");
    }
    const here = new Set(members.map((m) => m.id));
    ids = body.accountIds.filter((a) => here.has(a));
  }
  for (const a of ids) await ctx.repo.unenrol(courseId, a, "student");
  return json({ dropped: ids.length, students: members.length - ids.length });
}

/* -------------------------------------------------------- Bell schedules */

const shapePeriod = (p) => ({ id: p.id, label: p.label, startsAt: p.starts_at, endsAt: p.ends_at, kind: p.kind });

function readPeriodsList(v) {
  if (!Array.isArray(v) || v.length < 1 || v.length > 20) throw ApiError.badRequest("A bell schedule has 1 to 20 periods.", "periods");
  const seen = new Set();
  return v.map((p) => {
    const label = check.string(p && p.label, "label", { max: 24 });
    if (seen.has(label)) throw ApiError.badRequest(`Two periods are called “${label}”.`, "label");
    seen.add(label);
    const startsAt = p.startsAt ? check.string(p.startsAt, "startsAt", { max: 5 }) : null;
    const endsAt = p.endsAt ? check.string(p.endsAt, "endsAt", { max: 5 }) : null;
    if ((startsAt && !TIME.test(startsAt)) || (endsAt && !TIME.test(endsAt))) throw ApiError.badRequest("Times are like 08:30.", "startsAt");
    if (startsAt && endsAt && endsAt <= startsAt) throw ApiError.badRequest(`“${label}” ends before it starts.`, "endsAt");
    return { label, startsAt, endsAt, kind: p.kind === "other" ? "other" : "class" };
  });
}

async function readBell(ctx, orgId) {
  const r = await ctx.repo.listBellSchedules(orgId);
  const by = new Map();
  r.periods.forEach((p) => (by.get(p.schedule_id) || by.set(p.schedule_id, []).get(p.schedule_id)).push(p));
  return r.schedules.map((s) => ({
    id: s.id, name: s.name, minimumDay: !!s.minimum_day, position: s.position,
    periods: (by.get(s.id) || []).map(shapePeriod)
  }));
}

export async function listBell(ctx) {
  const actor = requireActor(ctx);
  return json({ schedules: await readBell(ctx, orgOf(actor)) });
}

export async function createBell(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  const name = check.string(body.name, "name", { max: 60 });
  const periods = body.periods === undefined
    ? [1, 2, 3, 4, 5, 6, 7].map((n) => ({ label: String(n), startsAt: null, endsAt: null, kind: "class" }))
    : readPeriodsList(body.periods);
  const existing = await readBell(ctx, orgId);
  if (existing.some((s) => s.name === name)) throw ApiError.conflict("A bell schedule already has that name.", "name");
  const id = await ctx.repo.createBellSchedule(orgId, name, bool(body.minimumDay, "minimumDay") === true, periods);
  return json({ schedule: (await readBell(ctx, orgId)).find((s) => s.id === id) }, { status: 201 });
}

export async function updateBell(ctx, { scheduleId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const s = await ctx.repo.findBellSchedule(scheduleId);
  if (!s || s.org_id !== orgId) throw ApiError.notFound("No such bell schedule.");
  const body = await readJson(ctx.request);
  const patch = {};
  if (body.name !== undefined) patch.name = check.string(body.name, "name", { max: 60 });
  if (body.minimumDay !== undefined) patch.minimumDay = bool(body.minimumDay, "minimumDay");
  if (body.periods !== undefined) patch.periods = readPeriodsList(body.periods);
  await ctx.repo.updateBellSchedule(scheduleId, patch);
  return json({ schedule: (await readBell(ctx, orgId)).find((x) => x.id === scheduleId) });
}

export async function deleteBell(ctx, { scheduleId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const s = await ctx.repo.findBellSchedule(scheduleId);
  if (!s || s.org_id !== orgId) throw ApiError.notFound("No such bell schedule.");
  const cal = await ctx.repo.getCalendar(orgId);
  const patternUses = cal && cal.pattern_json && Object.values(JSON.parse(cal.pattern_json) || {}).includes(scheduleId);
  if (patternUses || await ctx.repo.bellScheduleInUse(orgId, scheduleId)) {
    throw ApiError.conflict("Days still run this bell schedule. Give them another first.");
  }
  await ctx.repo.deleteBellSchedule(scheduleId);
  return json({ deleted: true });
}

/* POST /bell-schedules/:id/weekdays
   Five more schedules from this one, one per weekday, and the calendar set
   to run each on its day. */
export async function weekdays(ctx, { scheduleId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const all = await readBell(ctx, orgId);
  const src = all.find((s) => s.id === scheduleId);
  if (!src) throw ApiError.notFound("No such bell schedule.");
  const taken = new Set(all.map((s) => s.name));
  const pattern = patternOf(await ctx.repo.getCalendar(orgId), all.map((s) => ({ id: s.id })));
  const made = [];
  for (const [name, letter, wd] of WEEKDAYS) {
    let nm = name;
    if (taken.has(nm)) nm = `${src.name} ${name}`;
    if (taken.has(nm)) continue;                       // already made on an earlier run
    const bid = await ctx.repo.createBellSchedule(orgId, nm, src.minimumDay, weekdayCopy(src.periods, letter));
    taken.add(nm); made.push({ id: bid, name: nm }); pattern[String(wd)] = bid;
  }
  const cal = await ctx.repo.getCalendar(orgId);
  await ctx.repo.putCalendar(orgId, pattern, cal ? cal.year_start : null, cal ? cal.year_end : null, actor.id);
  return json({ made, schedules: await readBell(ctx, orgId) });
}

/* --------------------------------------------------------------- Calendar */

async function calendarOf(ctx, orgId) {
  const [schedules, cal] = await Promise.all([readBell(ctx, orgId), ctx.repo.getCalendar(orgId)]);
  return { schedules, cal, pattern: patternOf(cal, schedules), year: { start: cal ? cal.year_start : null, end: cal ? cal.year_end : null } };
}

/* The days of a span, decided. Used by the calendar screen, and by anything
   else that needs to know whether a date was a school day. */
export async function daysOf(ctx, orgId, from, to) {
  const c = await calendarOf(ctx, orgId);
  const overrides = new Map((await ctx.repo.listSchoolDays(orgId, from, to)).map((r) => [r.day, r]));
  const labels = new Map(c.schedules.map((s) => [s.id, labelsOf(s.periods)]));
  const days = eachDate(from, to).map((d) => {
    const e = effectiveDay(d, c.pattern, overrides, c.year);
    return { ...e, periods: e.scheduleId ? labels.get(e.scheduleId) || [] : [] };
  });
  return { ...c, days };
}

/* GET /calendar?from=&to= */
export async function getCalendar(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const from = day(q.get("from"), "from"), to = day(q.get("to"), "to");
  if (to < from) throw ApiError.badRequest("to is before from.", "to");
  if (Date.parse(to) - Date.parse(from) > 400 * 86400000) throw ApiError.badRequest("Ask for at most 400 days.", "to");
  const r = await daysOf(ctx, orgOf(actor), from, to);
  return json({
    pattern: r.pattern, yearStart: r.year.start, yearEnd: r.year.end,
    schedules: r.schedules.map((s) => ({ id: s.id, name: s.name, minimumDay: s.minimumDay })),
    days: r.days
  });
}

/* PUT /calendar/pattern  { pattern: { "1": scheduleId, "6": null }, yearStart?, yearEnd? } */
export async function putPattern(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  const schedules = await readBell(ctx, orgId);
  const ids = new Set(schedules.map((s) => s.id));
  const p = body.pattern;
  if (!p || typeof p !== "object") throw ApiError.badRequest("pattern is required.", "pattern");
  const out = {};
  for (const k of ["0", "1", "2", "3", "4", "5", "6"]) {
    const v = p[k];
    if (v === undefined) throw ApiError.badRequest("Every weekday needs an answer: a bell schedule, or null for a day off.", "pattern");
    if (v !== null && v !== "" && !ids.has(v)) throw ApiError.badRequest("That bell schedule is not this school's.", "pattern");
    out[k] = v;
  }
  const was = await ctx.repo.getCalendar(orgId);
  const yearStart = body.yearStart === undefined ? (was ? was.year_start : null) : body.yearStart === null ? null : day(body.yearStart, "yearStart");
  const yearEnd = body.yearEnd === undefined ? (was ? was.year_end : null) : body.yearEnd === null ? null : day(body.yearEnd, "yearEnd");
  if (yearStart && yearEnd && yearEnd < yearStart) throw ApiError.badRequest("The school year ends before it starts.", "yearEnd");
  await ctx.repo.putCalendar(orgId, out, yearStart, yearEnd, actor.id);
  return json({ pattern: out, yearStart, yearEnd });
}

/* PUT /calendar/days
   { days: [{ day } | { from, to, skipWeekends? }, kind: school|holiday|staff|canceled|clear, scheduleId?, label? }] } */
export async function putDays(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  if (!Array.isArray(body.days) || !body.days.length || body.days.length > 60) throw ApiError.badRequest("days must be a list of 1 to 60 entries.", "days");
  const ids = new Set((await readBell(ctx, orgId)).map((s) => s.id));
  const rows = [];
  for (const e of body.days) {
    const kind = check.oneOf(e.kind, "kind", [...DAY_KINDS, "clear"]);
    const from = day(e.day || e.from, "day"), to = e.day ? from : day(e.to, "to");
    if (to < from) throw ApiError.badRequest("A span cannot end before it starts.", "to");
    if (Date.parse(to) - Date.parse(from) > 366 * 86400000) throw ApiError.badRequest("A span is at most a year.", "to");
    let scheduleId = null;
    if (kind === "school" && e.scheduleId) {
      if (!ids.has(e.scheduleId)) throw ApiError.badRequest("That bell schedule is not this school's.", "scheduleId");
      scheduleId = e.scheduleId;
    }
    const label = e.label == null || e.label === "" ? null : check.string(e.label, "label", { max: 80 });
    for (const d of eachDate(from, to, 400)) {
      if (e.skipWeekends && [0, 6].includes(new Date(d + "T00:00:00Z").getUTCDay())) continue;
      rows.push({ day: d, kind, scheduleId, label });
    }
  }
  if (rows.length > 800) throw ApiError.badRequest("That is more than 800 days at once.", "days");
  await ctx.repo.setSchoolDays(orgId, rows);
  return json({ set: rows.length });
}

/* ---------------------------------------------------------------- Timetable */

/* GET /schedule/day?date=
   One day for the school's people: what kind of day it is, its periods with
   their times, and the sections that meet in each. */
export async function scheduleDay(ctx) {
  const actor = requireActor(ctx);
  mustStaff(ctx, actor);
  const orgId = orgOf(actor);
  const date = day(ctx.url.searchParams.get("date"), "date");
  const r = await daysOf(ctx, orgId, date, date);
  const entry = r.days[0];
  const sched = entry.scheduleId ? r.schedules.find((s) => s.id === entry.scheduleId) : null;
  const { rows, people, counts } = await readSchool(ctx, orgId);
  const sections = rows.map((c) => shapeSection(c, people, counts));
  const labels = new Map(r.schedules.map((s) => [s.id, labelsOf(s.periods)]));
  return json({
    day: entry, schedule: sched ? { id: sched.id, name: sched.name, minimumDay: sched.minimumDay } : null,
    periods: (sched ? sched.periods : []).map((p) => ({
      ...p, sections: p.kind === "other" ? [] : sections.filter((s) => s.periods.includes(p.label))
    })),
    unplaced: sections.filter((s) => !s.placed && s.status === "published").length,
    meeting: entry.kind === "school" ? sections.filter((s) => meets(s.periods, entry, labels)).map((s) => s.courseId) : []
  });
}

/* GET /schedule/mine?date=
   The day as one person has it: the sections they teach or take, with the
   period, its times and the room. */
export async function scheduleMine(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const date = day(ctx.url.searchParams.get("date"), "date");
  // A family reads their child's day; the school's people and a student's teachers read anyone's they may.
  const whose = ctx.url.searchParams.get("accountId") || actor.id;
  if (whose !== actor.id) await must(ctx, "account.read", { accountId: whose });
  const r = await daysOf(ctx, orgId, date, date);
  const entry = r.days[0];
  const sched = entry.scheduleId ? r.schedules.find((s) => s.id === entry.scheduleId) : null;
  const mine = (await ctx.repo.listCourses({ accountId: whose })).filter((c) => c.status !== "archived");
  const { rows, people, counts } = await readSchool(ctx, orgId);
  const by = new Map(rows.map((c) => [c.id, c]));
  const labels = new Map(r.schedules.map((s) => [s.id, labelsOf(s.periods)]));
  const items = mine.map((m) => by.get(m.id) && { role: m.my_role, ...shapeSection(by.get(m.id), people, counts) }).filter(Boolean);
  return json({
    day: entry, schedule: sched ? { id: sched.id, name: sched.name } : null,
    items: items.map((s) => {
      const times = (sched ? sched.periods : []).filter((p) => s.periods.includes(p.label));
      return {
        courseId: s.courseId, title: s.title, role: s.role, room: s.room, tab: s.tab, periods: s.periods,
        meets: meets(s.periods, entry, labels),
        startsAt: times.map((t) => t.startsAt).filter(Boolean).sort()[0] || null,
        endsAt: times.map((t) => t.endsAt).filter(Boolean).sort().slice(-1)[0] || null
      };
    })
  });
}


/* ===================================================================== Plans
   A plan is a named draft of the schedule: this term changed, or next year.
   It is kept apart from the live schedule, so nothing in it can be seen in a
   gradebook or a student's day until it is published. */

const jsonOr = (v, d) => { try { const x = JSON.parse(v); return Array.isArray(x) ? x : d; } catch { return d; } };

async function peopleNames(ctx, orgId) {
  const rows = await ctx.repo.listAccounts({ orgId });
  return new Map(rows.map((r) => [r.id, r.name || r.email]));
}

function shapeDraftSection(d, names, withRoster) {
  const teachers = jsonOr(d.teachers_json, []), students = jsonOr(d.students_json, []);
  return {
    id: d.id, sourceCourseId: d.source_course_id, subjectId: d.subject_id, subjectNumber: d.subject_number || null, subjectTitle: d.subject_title || null,
    title: d.title, code: d.code, area: d.area, sectionNo: d.section_no, tab: d.tab, room: d.room,
    capacity: d.capacity != null ? d.capacity : d.subject_capacity != null ? d.subject_capacity : null,
    periods: jsonOr(d.periods_json, []), placed: jsonOr(d.periods_json, []).length > 0,
    teachers: teachers.map((t) => ({ id: t.id, role: t.role, name: names.get(t.id) || "A teacher" })),
    students: students.length, studentIds: withRoster ? students : undefined
  };
}

async function draftOf(ctx, orgId, draftId) {
  const d = await ctx.repo.findDraft(draftId);
  if (!d || d.org_id !== orgId) throw ApiError.notFound("No such plan.");
  return d;
}
const shapeDraft = (d, sections) => ({
  id: d.id, name: d.name, kind: d.kind, withRosters: !!d.with_rosters, publishedAt: d.published_at, createdAt: d.created_at,
  sections: sections != null ? sections : d.sections
});

/* GET /schedule/drafts */
export async function listDrafts(ctx) {
  const actor = requireActor(ctx);
  mustStaff(ctx, actor);
  return json({ drafts: (await ctx.repo.listDrafts(orgOf(actor))).map((d) => shapeDraft(d)) });
}

/* POST /schedule/drafts  { name, kind: term|year, rosters?: bool, copyRosters?: bool, teachers?: bool }
   A copy of the live schedule to plan on. A year plan is the sections that
   will replace this year's; a term plan changes the live ones in place. */
export async function createDraft(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  const name = check.string(body.name, "name", { max: 60 });
  const kind = check.oneOf(body.kind || "term", "kind", ["term", "year"]);
  const rosters = body.rosters === undefined ? kind === "term" : bool(body.rosters, "rosters") === true;
  // A plan that carries rosters starts as a copy of them, unless it is a year plan that is to be filled from what students asked for.
  const copy = body.copyRosters === undefined ? rosters : bool(body.copyRosters, "copyRosters") === true;
  if (rosters && !copy && kind !== "year") throw ApiError.badRequest("A term plan starts from the rosters as they are; only a year plan can start empty.", "copyRosters");
  const teachers = body.teachers === undefined ? true : bool(body.teachers, "teachers") === true;
  if ((await ctx.repo.listDrafts(orgId)).some((d) => d.name === name)) throw ApiError.conflict("A plan already has that name.", "name");
  const draftId = await ctx.repo.createDraft(orgId, name, kind, rosters, actor.id);

  const school = await readSchool(ctx, orgId);
  const seats = new Map();
  if (rosters && copy) for (const m of await ctx.repo.listStudentMemberships(orgId)) (seats.get(m.course_id) || seats.set(m.course_id, []).get(m.course_id)).push(m.account_id);
  let made = 0;
  for (const c of school.rows) {
    if (c.status !== "published") continue;
    const base = (school.people.get(c.id) || []).map((p) => ({ id: p.account_id, role: p.role }));
    await ctx.repo.insertDraftSection(draftId, {
      sourceCourseId: c.id, subjectId: c.subject_id, title: c.title, code: c.code, area: c.area, sectionNo: c.section_no, tab: c.tab, room: c.room,
      capacity: c.capacity, periods: periodsOf(c), teachers: teachers ? base : [], students: rosters && copy ? seats.get(c.id) || [] : [], position: made++
    });
  }
  return json({ draft: shapeDraft(await ctx.repo.findDraft(draftId), made) }, { status: 201 });
}

export async function deleteDraft(ctx, { draftId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  await draftOf(ctx, orgId, draftId);
  await ctx.repo.deleteDraft(draftId);
  return json({ deleted: true });
}

/* GET /schedule/drafts/:draftId?roster=1 */
export async function getDraft(ctx, { draftId }) {
  const actor = requireActor(ctx);
  mustStaff(ctx, actor);
  const orgId = orgOf(actor);
  const d = await draftOf(ctx, orgId, draftId);
  const names = await peopleNames(ctx, orgId);
  const withRoster = ctx.url.searchParams.get("roster") === "1";
  const secs = (await ctx.repo.listDraftSections(draftId)).map((x) => shapeDraftSection(x, names, withRoster));
  return json({ draft: shapeDraft(d, secs.length), sections: secs });
}

function readDraftFacts(body, was, periodsKnown) {
  const out = {
    subjectId: was.subject_id || null, title: was.title, sectionNo: was.section_no, tab: was.tab, room: was.room, capacity: was.capacity,
    periods: jsonOr(was.periods_json, []), teachers: jsonOr(was.teachers_json, []), students: jsonOr(was.students_json, [])
  };
  if (body.title !== undefined) out.title = check.string(body.title, "title", { max: 160 });
  if (body.sectionNo !== undefined) out.sectionNo = txt(body.sectionNo, "sectionNo", 20);
  if (body.tab !== undefined) out.tab = txt(body.tab, "tab", 20);
  if (body.room !== undefined) out.room = txt(body.room, "room", 40);
  if (body.capacity !== undefined) out.capacity = intOr(body.capacity, "capacity", 1, 1000);
  if (body.periods !== undefined) {
    if (!Array.isArray(body.periods) || body.periods.length > 12) throw ApiError.badRequest("periods must be a list of up to 12 periods.", "periods");
    const labels = body.periods.map((x) => check.string(String(x), "periods", { max: 24 }));
    if (periodsKnown.size) {
      const bad = labels.filter((l) => !periodsKnown.has(l));
      if (bad.length) throw ApiError.badRequest(`No bell schedule has a period called ${bad.map((b) => `“${b}”`).join(", ")}.`, "periods");
    }
    out.periods = Array.from(new Set(labels));
  }
  if (body.teachers !== undefined) {
    if (!Array.isArray(body.teachers) || body.teachers.length > 8) throw ApiError.badRequest("teachers must be a list of up to 8 people.", "teachers");
    out.teachers = body.teachers.map((t, i) => ({ id: check.string(t && t.id, "teachers", { max: 100 }), role: i === 0 ? "teacher" : (t.role === "assistant" ? "assistant" : "teacher") }));
  }
  return out;
}

/* POST /schedule/drafts/:draftId/sections  { subjectId, title?, periods, teachers, room, capacity, sectionNo, tab } */
export async function addDraftSection(ctx, { draftId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  await draftOf(ctx, orgId, draftId);
  const body = await readJson(ctx.request);
  const subject = await ctx.repo.findSubject(check.string(body.subjectId, "subjectId", { max: 100 }));
  if (!subject || subject.org_id !== orgId) throw ApiError.notFound("No such course.");
  const facts = readDraftFacts(body, { subject_id: subject.id, title: subject.title, periods_json: "[]", teachers_json: "[]", students_json: "[]" }, await knownPeriods(ctx, orgId));
  const existing = await ctx.repo.listDraftSections(draftId);
  const n = existing.filter((x) => x.subject_id === subject.id).length + 1;
  const sid = await ctx.repo.insertDraftSection(draftId, {
    subjectId: subject.id, title: facts.title, area: body.area || null, code: null, sectionNo: facts.sectionNo || String(n).padStart(2, "0"),
    tab: facts.tab, room: facts.room, capacity: facts.capacity, periods: facts.periods, teachers: facts.teachers, students: [], position: existing.length
  });
  const names = await peopleNames(ctx, orgId);
  const row = (await ctx.repo.listDraftSections(draftId)).find((x) => x.id === sid);
  return json({ section: shapeDraftSection(row, names) }, { status: 201 });
}

async function sectionOf(ctx, orgId, draftId, sid) {
  await draftOf(ctx, orgId, draftId);
  const x = await ctx.repo.findDraftSection(sid);
  if (!x || x.draft_id !== draftId) throw ApiError.notFound("No such section in this plan.");
  return x;
}

/* PUT /schedule/drafts/:draftId/sections/:sectionId */
export async function putDraftSection(ctx, { draftId, sectionId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const was = await sectionOf(ctx, orgId, draftId, sectionId);
  const body = await readJson(ctx.request);
  const facts = readDraftFacts(body, was, await knownPeriods(ctx, orgId));
  if (body.subjectId !== undefined) {
    if (body.subjectId === null) facts.subjectId = null;
    else {
      const sub = await ctx.repo.findSubject(check.string(body.subjectId, "subjectId", { max: 100 }));
      if (!sub || sub.org_id !== orgId) throw ApiError.notFound("No such course.");
      facts.subjectId = sub.id;
    }
  }
  await ctx.repo.updateDraftSection(sectionId, facts);
  const names = await peopleNames(ctx, orgId);
  const row = (await ctx.repo.listDraftSections(draftId)).find((x) => x.id === sectionId);
  return json({ section: shapeDraftSection(row, names) });
}

export async function deleteDraftSection(ctx, { draftId, sectionId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  await sectionOf(ctx, orgId, draftId, sectionId);
  await ctx.repo.deleteDraftSection(sectionId);
  return json({ deleted: true });
}

/* POST /schedule/drafts/:draftId/sections/:sectionId/students
   { accountIds? , copyFrom? (a section of this plan), drop?: [ids], all?: true } */
export async function draftStudents(ctx, { draftId, sectionId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const sec = await sectionOf(ctx, orgId, draftId, sectionId);
  const body = await readJson(ctx.request);
  let list = jsonOr(sec.students_json, []);
  const had = list.length;
  if (body.all === true) list = [];
  if (Array.isArray(body.drop)) { const gone = new Set(body.drop); list = list.filter((a) => !gone.has(a)); }
  let adding = [];
  if (body.copyFrom) {
    const from = await sectionOf(ctx, orgId, draftId, check.string(body.copyFrom, "copyFrom", { max: 100 }));
    adding = jsonOr(from.students_json, []);
  } else if (Array.isArray(body.accountIds)) {
    if (body.accountIds.length > 500) throw ApiError.badRequest("At most 500 at a time.", "accountIds");
    adding = body.accountIds.map((x) => check.string(x, "accountIds", { max: 100 }));
  }
  const set = new Set(list);
  let added = 0;
  for (const a of adding) if (!set.has(a)) { set.add(a); added++; }
  list = Array.from(set);
  await ctx.repo.updateDraftSection(sectionId, {
    subjectId: sec.subject_id, title: sec.title, sectionNo: sec.section_no, tab: sec.tab, room: sec.room, capacity: sec.capacity,
    periods: jsonOr(sec.periods_json, []), teachers: jsonOr(sec.teachers_json, []), students: list
  });
  const cap = sec.capacity;
  return json({ added, dropped: Math.max(0, had + added - list.length), students: list.length, capacity: cap, over: cap != null && list.length > cap });
}

/* Everything publishing would do, and (unless dry) does. One routine, so the
   preview cannot promise something the publish does differently. */
async function publishPlan(ctx, orgId, draft, actor, dry) {
  const secs = await ctx.repo.listDraftSections(draft.id);
  const school = await readSchool(ctx, orgId);
  const liveBy = new Map(school.rows.map((c) => [c.id, c]));
  const seats = new Map();
  for (const m of await ctx.repo.listStudentMemberships(orgId)) (seats.get(m.course_id) || seats.set(m.course_id, new Set()).get(m.course_id)).add(m.account_id);
  const names = await peopleNames(ctx, orgId);
  const nameOf = (a) => names.get(a) || "Someone";
  const year = draft.kind === "year", withRosters = !!draft.with_rosters;
  const out = [];
  const totals = { created: 0, updated: 0, archived: 0, added: 0, dropped: 0 };
  const freeCode = async (base) => {
    let code = base || "section", n = 1;
    while (await ctx.repo.findCourseByCode(orgId, code)) { n++; code = `${base}-${n}`; if (n > 300) throw ApiError.conflict("Too many sections of one course."); }
    return code;
  };

  for (const ds of secs) {
    const teachers = jsonOr(ds.teachers_json, []), students = jsonOr(ds.students_json, []), periods = jsonOr(ds.periods_json, []);
    const src = ds.source_course_id ? liveBy.get(ds.source_course_id) : null;
    const live = src && src.status !== "archived" ? src : null;

    if (live && !year) {
      const haveStudents = seats.get(live.id) || new Set();
      const liveTeachers = (school.people.get(live.id) || []);
      const addS = withRosters ? students.filter((a) => !haveStudents.has(a)) : [];
      const dropS = withRosters ? [...haveStudents].filter((a) => !students.includes(a)) : [];
      const addT = teachers.filter((t) => !liveTeachers.some((p) => p.account_id === t.id));
      const dropT = liveTeachers.filter((p) => !teachers.some((t) => t.id === p.account_id));
      const changes = [];
      const lp = periodsOf(live);
      if (JSON.stringify(lp) !== JSON.stringify(periods)) changes.push(`period ${lp.join(", ") || "none"} → ${periods.join(", ") || "none"}`);
      if ((live.room || null) !== (ds.room || null)) changes.push(`room ${live.room || "none"} → ${ds.room || "none"}`);
      if ((live.capacity ?? null) !== (ds.capacity ?? null)) changes.push(`capacity ${live.capacity ?? "none"} → ${ds.capacity ?? "none"}`);
      if ((live.subject_id || null) !== (ds.subject_id || null)) changes.push("course changed");
      if (live.title !== ds.title) changes.push(`title “${live.title}” → “${ds.title}”`);
      if ((live.section_no || null) !== (ds.section_no || null)) changes.push(`section number ${live.section_no || "none"} → ${ds.section_no || "none"}`);
      if ((live.tab || null) !== (ds.tab || null)) changes.push("tab changed");
      out.push({ action: "update", title: ds.title, courseId: live.id, changes, addStudents: addS.length, dropStudents: dropS.length,
                 addTeachers: addT.map((t) => nameOf(t.id)), dropTeachers: dropT.map((p) => p.name || nameOf(p.account_id)) });
      totals.updated++; totals.added += addS.length; totals.dropped += dropS.length;
      if (!dry) {
        await ctx.repo.upsertSection(live.id, { subjectId: ds.subject_id, sectionNo: ds.section_no, tab: ds.tab, room: ds.room, capacity: ds.capacity, periods }, actor.id);
        if (live.title !== ds.title) await ctx.repo.updateCourse(live.id, { title: ds.title });
        for (const t of addT) await ctx.repo.enrol(live.id, t.id, t.role || "teacher");
        for (const p of dropT) await ctx.repo.unenrol(live.id, p.account_id, p.role);
        for (const a of addS) await ctx.repo.enrol(live.id, a, "student");
        for (const a of dropS) await ctx.repo.unenrol(live.id, a, "student");
      }
      continue;
    }

    // A section that is new, or one a year plan replaces.
    out.push({ action: live ? "replace" : "new", title: ds.title, courseId: live ? live.id : null, changes: [], addStudents: withRosters ? students.length : 0, dropStudents: 0,
               addTeachers: teachers.map((t) => nameOf(t.id)), dropTeachers: [] });
    totals.created++; totals.added += withRosters ? students.length : 0;
    if (live) totals.archived++;
    if (!dry) {
      const sub = ds.subject_id ? await ctx.repo.findSubject(ds.subject_id) : null;
      const base = (ds.code || (sub && (sub.catalog_code || sub.number)) || ds.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      let body = null;
      try { body = live && live.body_json ? JSON.parse(live.body_json) : (sub && sub.catalog_code ? { from: sub.catalog_code } : null); } catch { body = null; }
      const course = await ctx.repo.createCourse({ orgId, code: await freeCode(base), title: ds.title, subject: ds.area || null, body, status: "published", createdBy: actor.id });
      await ctx.repo.upsertSection(course.id, { subjectId: ds.subject_id, sectionNo: ds.section_no, tab: ds.tab, room: ds.room, capacity: ds.capacity, periods }, actor.id);
      for (const t of teachers) await ctx.repo.enrol(course.id, t.id, t.role || "teacher");
      if (withRosters) for (const a of students) await ctx.repo.enrol(course.id, a, "student");
      if (live) await ctx.repo.updateCourse(live.id, { status: "archived" });
    }
  }
  if (!dry) await ctx.repo.markDraftPublished(draft.id);
  return { sections: out, totals };
}

/* GET /schedule/drafts/:draftId/publish — what publishing would do. */
export async function previewPublish(ctx, { draftId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const d = await draftOf(ctx, orgId, draftId);
  if (d.published_at) throw ApiError.conflict("This plan was already published.");
  return json({ draft: shapeDraft(d), ...(await publishPlan(ctx, orgId, d, actor, true)) });
}

/* POST /schedule/drafts/:draftId/publish */
export async function publishDraft(ctx, { draftId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const d = await draftOf(ctx, orgId, draftId);
  if (d.published_at) throw ApiError.conflict("This plan was already published.");
  return json({ draft: shapeDraft(d), ...(await publishPlan(ctx, orgId, d, actor, false)) });
}

/* POST /sections/archive  { courseIds } — sections that are over, kept and out of the way. */
export async function archiveSections(ctx) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  const body = await readJson(ctx.request);
  if (!Array.isArray(body.courseIds) || !body.courseIds.length || body.courseIds.length > 300) throw ApiError.badRequest("courseIds must be a list of 1 to 300 sections.", "courseIds");
  const restore = body.restore === true;
  let n = 0;
  for (const id of body.courseIds) {
    const c = await ctx.repo.findCourse(check.string(id, "courseIds", { max: 100 }));
    // Archiving takes live sections out; restoring brings archived ones back. Anything else is left alone.
    if (c && c.org_id === orgId && (c.status === "archived") === restore) { await ctx.repo.updateCourse(c.id, { status: restore ? "published" : "archived" }); n++; }
  }
  return json({ changed: n });
}

/* ============================================================ Course requests */

const RANKS = [0, 1, 2, 3];

async function mayAsk(ctx, actor, accountId) {
  if (isStaff(actor, orgOf(actor))) return true;
  return actor.id === accountId || (await guardsStudent(ctx, actor, accountId));
}

/* GET /course-requests?accountId=  or  ?subjectId= (the school's people) */
export async function getRequests(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const q = ctx.url.searchParams;
  const accountId = q.get("accountId") || null, subjectId = q.get("subjectId") || null;
  if (!accountId && !subjectId) throw ApiError.badRequest("Choose a student or a course.", "accountId");
  if (accountId) { if (!(await mayAsk(ctx, actor, accountId))) throw ApiError.forbidden("You can see the requests of yourself or your own children."); }
  else mustStaff(ctx, actor);
  const rows = await ctx.repo.listRequests({ orgId, accountId, subjectId });
  return json({ requests: rows.map((r) => ({ accountId: r.account_id, studentName: r.student_name, subjectId: r.subject_id, number: r.number, title: r.title, rank: r.rank })) });
}

/* PUT /course-requests/:accountId  { requests: [{ subjectId, rank }] }
   Replaces what a student has asked for. A family may ask only for courses the
   school lets students request; the school's people may set anything,
   including the courses a student must take (rank 0). */
export async function putRequests(ctx, { accountId }) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!(await mayAsk(ctx, actor, accountId))) throw ApiError.forbidden("You can ask for courses for yourself or your own children.");
  const staff = isStaff(actor, orgId);
  const body = await readJson(ctx.request);
  if (!Array.isArray(body.requests) || body.requests.length > 16) throw ApiError.badRequest("requests must be a list of up to 16 courses.", "requests");
  const subjects = new Map((await ctx.repo.listSubjects(orgId)).map((s) => [s.id, s]));
  const seen = new Set(), out = [];
  for (const r of body.requests) {
    const sub = subjects.get(r && r.subjectId);
    if (!sub || sub.retired) throw ApiError.badRequest("That course is not offered.", "subjectId");
    if (seen.has(sub.id)) throw ApiError.badRequest(`“${sub.title}” is asked for twice.`, "subjectId");
    seen.add(sub.id);
    const rank = Number(r.rank == null ? 1 : r.rank);
    if (!RANKS.includes(rank)) throw ApiError.badRequest("rank is 0 (required), 1 (first choice), 2 or 3 (alternates).", "rank");
    if (!staff && (rank === 0 || !sub.requestable)) throw ApiError.forbidden(`“${sub.title}” is not one a student may ask for.`);
    out.push({ subjectId: sub.id, rank });
  }
  // A course the office requires is the office's to change: saving a student's own choices keeps it, and
  // a choice for the same course does not turn it into something optional.
  if (!staff) {
    const required = (await ctx.repo.listRequests({ orgId, accountId })).filter((r) => r.rank === 0);
    const held = new Set(required.map((r) => r.subject_id));
    for (let i = out.length - 1; i >= 0; i--) if (held.has(out[i].subjectId)) out.splice(i, 1);
    for (const r of required) out.push({ subjectId: r.subject_id, rank: 0 });
  }
  await ctx.repo.setRequests(orgId, accountId, out, actor.id);
  return json({ saved: out.length });
}

/* ====================================================== Analyze and build */

async function planOf(ctx, orgId, draftId) {
  const subjects = (await ctx.repo.listSubjects(orgId)).filter((s) => !s.retired).map((s) => ({ id: s.id, number: s.number, title: s.title, capacity: s.capacity }));
  let sections;
  if (draftId && draftId !== "live") {
    const rows = await ctx.repo.listDraftSections(draftId);
    sections = rows.map((d) => ({ id: d.id, subjectId: d.subject_id, title: d.title, sectionNo: d.section_no, periods: jsonOr(d.periods_json, []),
                                  capacity: d.capacity, students: jsonOr(d.students_json, []) }));
  } else {
    const school = await readSchool(ctx, orgId);
    const seats = new Map();
    for (const m of await ctx.repo.listStudentMemberships(orgId)) (seats.get(m.course_id) || seats.set(m.course_id, []).get(m.course_id)).push(m.account_id);
    sections = school.rows.filter((c) => c.status === "published").map((c) => ({ id: c.id, subjectId: c.subject_id, title: c.title, sectionNo: c.section_no,
      periods: periodsOf(c), capacity: c.capacity, students: seats.get(c.id) || [] }));
  }
  const requests = (await ctx.repo.listRequests({ orgId })).map((r) => ({ accountId: r.account_id, subjectId: r.subject_id, rank: r.rank }));
  return { subjects, sections, requests };
}

/* GET /schedule/analyze?draft=<id>|live */
export async function analyze(ctx) {
  const actor = requireActor(ctx);
  mustStaff(ctx, actor);
  const orgId = orgOf(actor);
  const draftId = ctx.url.searchParams.get("draft") || "live";
  if (draftId !== "live") await draftOf(ctx, orgId, draftId);
  const plan = await planOf(ctx, orgId, draftId);
  return json({ draft: draftId, students: new Set(plan.requests.map((r) => r.accountId)).size, ...analyzePlan(plan) });
}

/* POST /schedule/drafts/:draftId/build  { dry? }
   Seats students into the plan's sections from what they asked for. It only
   adds; nobody already placed is moved. */
export async function buildDraft(ctx, { draftId }) {
  const actor = requireActor(ctx);
  const orgId = await mustSchedule(ctx, actor);
  await draftOf(ctx, orgId, draftId);
  const body = await readJson(ctx.request);
  const plan = await planOf(ctx, orgId, draftId);
  const out = buildPlan(plan);
  const names = await peopleNames(ctx, orgId);
  const title = new Map(plan.subjects.map((s) => [s.id, s.title]));
  if (body.dry !== true) {
    for (const [sid, ids] of Object.entries(out.adds)) {
      const sec = await ctx.repo.findDraftSection(sid);
      const list = Array.from(new Set(jsonOr(sec.students_json, []).concat(ids)));
      await ctx.repo.updateDraftSection(sid, { subjectId: sec.subject_id, title: sec.title, sectionNo: sec.section_no, tab: sec.tab, room: sec.room,
        capacity: sec.capacity, periods: jsonOr(sec.periods_json, []), teachers: jsonOr(sec.teachers_json, []), students: list });
    }
  }
  return json({
    applied: body.dry !== true,
    placed: out.placed.filter((p) => !p.already).length,
    already: out.placed.filter((p) => p.already).length,
    unplaced: out.unplaced.map((u) => ({ accountId: u.accountId, studentName: names.get(u.accountId) || "A student", subjectId: u.subjectId,
      course: title.get(u.subjectId) || "", rank: u.rank, reason: u.reason }))
  });
}
