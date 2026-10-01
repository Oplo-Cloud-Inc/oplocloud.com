/* ==========================================================================
   /api/v1/periods, /grade-changes, /attendance

   The school's official record. A marking period moves one way —
   open, grading, posted, locked — and posting a course freezes what every
   student in it earned, so a report card printed in June says in September
   what it said in June. A posted grade moves only when somebody with the
   authority approves a request that says why, and never the person who
   asked.

   Who may do each of these is guard.js. This file says what happens.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { computeGrade, courseWeights, coursePolicy, letterFor } from "../services/grades.js";

const KINDS = ["quarter", "semester", "year"];
const STATES = ["open", "grading", "posted", "locked"];
const ATTENDANCE = ["present", "absent", "late", "excused", "cut"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const day = (v, field) => {
  const s = check.string(v, field, { max: 10 });
  if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return s;
};

const shapePeriod = (p) => ({
  id: p.id, orgId: p.org_id, name: p.name, kind: p.kind, startsOn: p.starts_on,
  endsOn: p.ends_on, passMark: p.pass_mark, state: p.state,
  postedAt: p.posted_at, postedBy: p.posted_by, lockedAt: p.locked_at, lockedBy: p.locked_by
});

const shapePosted = (g) => ({
  id: g.id, periodId: g.period_id, periodName: g.period_name, courseId: g.course_id,
  courseTitle: g.course_title, accountId: g.account_id, studentName: g.student_name,
  percent: g.percent, letter: g.letter, passing: g.passing == null ? null : !!g.passing,
  passMark: g.pass_mark, postedAt: g.posted_at, postedBy: g.posted_by
});

const shapeChange = (c) => ({
  id: c.id, postedId: c.posted_id, courseId: c.course_id, courseTitle: c.course_title,
  accountId: c.account_id, studentName: c.student_name, periodId: c.period_id,
  periodState: c.period_state, fromPercent: c.from_percent, toPercent: c.to_percent,
  reason: c.reason, status: c.status, requestedBy: c.requested_by,
  requestedByName: c.requested_by_name, requestedAt: c.requested_at,
  decidedBy: c.decided_by, decidedByName: c.decided_by_name, decidedAt: c.decided_at,
  decisionNote: c.decision_note
});

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

/* ------------------------------------------------------------------ Periods */

export async function listPeriods(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "period.read", {});
  const rows = await ctx.repo.listPeriods(orgOf(actor));
  return json({ periods: rows.map(shapePeriod) });
}

export async function createPeriod(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const orgId = body.orgId || orgOf(actor);
  await must(ctx, "period.write", { orgId });
  const startsOn = day(body.startsOn, "startsOn");
  const endsOn = day(body.endsOn, "endsOn");
  if (endsOn < startsOn) throw ApiError.badRequest("A period cannot end before it starts.", "endsOn");
  const period = await ctx.repo.createPeriod({
    orgId,
    name: check.string(body.name, "name", { max: 60 }),
    kind: check.oneOf(body.kind || "quarter", "kind", KINDS),
    startsOn, endsOn,
    passMark: check.number(body.passMark ?? 65, "passMark", { min: 0, max: 100 })
  });
  return json({ period: shapePeriod(period) }, { status: 201 });
}

/* PATCH /periods/:periodId  { state }
   One step forward, or posted back to grading while nothing is locked. A
   locked period is final: the way to change it is a grade change. */
export async function moveState(ctx) {
  const actor = requireActor(ctx);
  const period = await ctx.repo.findPeriod(ctx.params.periodId);
  if (!period) throw ApiError.notFound("No such marking period.");
  await must(ctx, "period.write", { orgId: period.org_id });
  const body = await readJson(ctx.request);
  const to = check.oneOf(body.state, "state", STATES);
  const from = STATES.indexOf(period.state), next = STATES.indexOf(to);
  if (period.state === "locked") throw ApiError.conflict("A locked period cannot change. Request a grade change instead.", "state");
  const forward = next === from + 1;
  const reopen = period.state === "posted" && to === "grading";
  if (!forward && !reopen) {
    throw ApiError.conflict(`A period goes ${STATES.join(" → ")}. It cannot go from ${period.state} to ${to}.`, "state");
  }
  return json({ period: shapePeriod(await ctx.repo.setPeriodState(period.id, to, actor.id)) });
}

/* POST /periods/:periodId/post  { courseId }
   Freezes every student's grade in one course. Refused once the period is
   posted or locked — an official grade is not posted twice. */
export async function postCourse(ctx) {
  const actor = requireActor(ctx);
  const period = await ctx.repo.findPeriod(ctx.params.periodId);
  if (!period) throw ApiError.notFound("No such marking period.");
  const body = await readJson(ctx.request);
  const courseId = check.string(body.courseId, "courseId", { max: 100 });
  await must(ctx, "grade.post", { courseId, orgId: period.org_id });
  if (period.state === "open") throw ApiError.conflict("Grades can be posted once the period is in grading.", "state");
  if (period.state !== "grading") throw ApiError.conflict("This period is already posted. Request a grade change instead.", "state");
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");

  const students = await ctx.repo.listCourseMembers(courseId, "student");
  const weights = courseWeights(course), policy = coursePolicy(course);
  let posted = 0, ungraded = 0;
  for (const s of students) {
    const rows = await ctx.repo.listGrades({ courseId, accountId: s.id });
    const g = computeGrade(rows, weights, policy);
    if (!g) ungraded++; else posted++;
    await ctx.repo.upsertPosted({
      periodId: period.id, courseId, accountId: s.id,
      percent: g ? g.percent : null, letter: g ? g.letter : null,
      passing: g ? (g.percent >= period.pass_mark ? 1 : 0) : null,
      parts: g ? g.parts : null, actorId: actor.id
    });
  }
  return json({ posted, ungraded, students: students.length });
}

/* GET /periods/:periodId/posted?courseId=&accountId= */
export async function listPosted(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const courseId = q.get("courseId") || null;
  const accountId = q.get("accountId") || (courseId ? null : actor.id);
  await must(ctx, "grade.read", { accountId, courseId });
  const rows = await ctx.repo.listPosted({ periodId: ctx.params.periodId, courseId, accountId });
  return json({ posted: rows.map(shapePosted) });
}

/* ------------------------------------------------------------ Grade changes */

export async function requestChange(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const posted = await ctx.repo.findPosted(check.string(body.postedId, "postedId", { max: 100 }));
  if (!posted) throw ApiError.notFound("No such posted grade.");
  await must(ctx, "grade.post", { courseId: posted.course_id });
  if (posted.period_state !== "posted" && posted.period_state !== "locked") {
    throw ApiError.conflict("This grade is not posted yet. Change the marks instead.", "postedId");
  }
  const toPercent = Math.round(check.number(body.toPercent, "toPercent", { min: 0, max: 200 }));
  if (toPercent === posted.percent) throw ApiError.badRequest("That is already the posted grade.", "toPercent");
  const reason = check.string(body.reason, "reason", { min: 5, max: 1000 });
  const c = await ctx.repo.createGradeChange({
    postedId: posted.id, fromPercent: posted.percent, toPercent, reason, actorId: actor.id
  });
  return json({ change: shapeChange(c) }, { status: 201 });
}

export async function listChanges(ctx) {
  const actor = requireActor(ctx);
  const status = ctx.url.searchParams.get("status") || null;
  if (status) check.oneOf(status, "status", ["pending", "approved", "denied"]);
  // Approvers see the whole queue. Everyone else sees the requests they made.
  let all = false;
  try { await must(ctx, "grade.approve", {}); all = true; } catch (e) { if (!(e instanceof ApiError)) throw e; }
  const rows = await ctx.repo.listGradeChanges({ status, requestedBy: all ? null : actor.id });
  return json({ changes: rows.map(shapeChange), canApprove: all });
}

export async function decideChange(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "grade.approve", {});
  const change = await ctx.repo.findGradeChange(ctx.params.changeId);
  if (!change) throw ApiError.notFound("No such request.");
  if (change.status !== "pending") throw ApiError.conflict(`That request was already ${change.status}.`);
  if (change.requested_by === actor.id) {
    throw ApiError.forbidden("You cannot approve your own request. Ask another approver.");
  }
  const body = await readJson(ctx.request);
  const approve = body.approve === true;
  if (!approve && body.approve !== false) throw ApiError.badRequest("approve must be true or false.", "approve");
  const note = body.note == null ? null : check.string(body.note, "note", { max: 1000 });
  const done = await ctx.repo.decideGradeChange({
    changeId: change.id, approve, note, actorId: actor.id,
    letter: letterFor(change.to_percent),
    passing: change.to_percent >= change.pass_mark ? 1 : 0
  });
  return json({ change: shapeChange(done) });
}

/* --------------------------------------------------------------- Attendance */

/* PUT /attendance  { day, courseId?, marks: [{ accountId, status, note? }] }
   A whole register in one request, so a class is either taken or not. */
export async function putAttendance(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const d = day(body.day, "day");
  const courseId = body.courseId ? check.string(body.courseId, "courseId", { max: 100 }) : null;
  await must(ctx, "attendance.write", { courseId });
  if (!Array.isArray(body.marks) || !body.marks.length || body.marks.length > 500) {
    throw ApiError.badRequest("marks must be a list of 1 to 500 students.", "marks");
  }
  const enrolled = courseId
    ? new Set((await ctx.repo.listCourseMembers(courseId, "student")).map((m) => m.id))
    : null;
  let saved = 0;
  for (const m of body.marks) {
    const accountId = check.string(m.accountId, "accountId", { max: 100 });
    if (enrolled && !enrolled.has(accountId)) {
      throw ApiError.badRequest("That student is not in this course.", "accountId");
    }
    await ctx.repo.upsertAttendance({
      accountId, courseId, day: d, actorId: actor.id,
      status: check.oneOf(m.status, "status", ATTENDANCE),
      note: m.note == null ? null : check.string(m.note, "note", { max: 300 })
    });
    saved++;
  }
  return json({ saved, day: d });
}

/* GET /attendance?courseId=&accountId=&day=&from=&to= */
export async function listAttendance(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const courseId = q.get("courseId") || null;
  const accountId = q.get("accountId") || (courseId ? null : actor.id);
  await must(ctx, "attendance.read", { accountId, courseId });
  const rows = await ctx.repo.listAttendance({
    courseId, accountId,
    day: q.get("day") ? day(q.get("day"), "day") : null,
    from: q.get("from") ? day(q.get("from"), "from") : null,
    to: q.get("to") ? day(q.get("to"), "to") : null
  });
  return json({ attendance: rows.map((r) => ({
    id: r.id, accountId: r.account_id, studentName: r.student_name, courseId: r.course_id,
    day: r.day, status: r.status, note: r.note, markedBy: r.marked_by, markedAt: r.marked_at
  })) });
}

/* GET /attendance/summary?from=&to=   school-wide, for people who work across it */
export async function attendanceSummary(ctx) {
  requireActor(ctx);
  await must(ctx, "attendance.read", { accountId: null, courseId: null, orgId: null, schoolWide: true });
  const q = ctx.url.searchParams;
  const to = q.get("to") ? day(q.get("to"), "to") : new Date().toISOString().slice(0, 10);
  const from = q.get("from") ? day(q.get("from"), "from") : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const s = await ctx.repo.attendanceSummary({ from, to });
  return json({ from, to, byStatus: s.byStatus, students: s.top.map((r) => ({
    accountId: r.account_id, studentName: r.student_name, absences: r.absences, lates: r.lates, days: r.days
  })) });
}
