/* ==========================================================================
   /api/v1/grades/*

   The endpoint the whole architecture is being proved against: a teacher
   writes here on one device, and a student reads it on another.

   The asymmetry is enforced in guard.js, not here — a student may read their
   own grades and there is no path by which they may write one. It is worth
   saying twice because it is the single rule that would matter most if it
   were wrong.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { computeGrade, courseWeights } from "../services/grades.js";

function shape(g) {
  return {
    id: g.id, assignmentId: g.assignment_id, accountId: g.account_id,
    courseId: g.course_id, title: g.title, category: g.category,
    score: g.score, outOf: g.out_of, feedback: g.feedback,
    gradedBy: g.graded_by, gradedAt: g.graded_at
  };
}

/* GET /api/v1/grades?courseId=&accountId=
   Defaults to the caller's own grades, which is the common case and the one
   that must never require a client to name itself. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const courseId = ctx.url.searchParams.get("courseId") || null;
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;

  await must(ctx, "grade.read", { accountId, courseId });

  const rows = await ctx.repo.listGrades({ courseId, accountId });
  const out = { grades: rows.map(shape) };

  // The computed mark, per course, so a client never has to re-implement the
  // weighting — and so two clients can never disagree about a student's grade.
  const byCourse = new Map();
  for (const g of rows) {
    if (!byCourse.has(g.course_id)) byCourse.set(g.course_id, []);
    byCourse.get(g.course_id).push(g);
  }
  out.summaries = [];
  for (const [cid, list] of byCourse) {
    const course = await ctx.repo.findCourse(cid);
    const computed = computeGrade(list, courseWeights(course));
    if (computed) out.summaries.push({ courseId: cid, courseTitle: course && course.title, ...computed });
  }
  return json(out);
}

/* PUT /api/v1/grades — enter or change one mark. */
export async function put(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const assignmentId = check.string(body.assignmentId, "assignmentId", { max: 64 });
  const accountId = check.string(body.accountId, "accountId", { max: 64 });

  const assignment = await ctx.repo.findAssignment(assignmentId);
  if (!assignment) throw ApiError.notFound("No such assignment.");

  await must(ctx, "grade.write", { courseId: assignment.course_id, accountId });

  // A mark for somebody not in the course is a mistake, and silently storing
  // it produces a grade nobody can find later.
  const membership = await ctx.repo.courseMembership(assignment.course_id, accountId);
  if (!membership || membership.role !== "student") {
    throw ApiError.badRequest("That student is not enrolled in this course.", "accountId");
  }

  const outOf = check.number(body.outOf ?? assignment.out_of, "outOf",
    { min: 0.01, max: 100000 });
  const score = check.number(body.score, "score", { min: 0, max: 100000, allowNull: true });
  if (score != null && score > outOf * 1.5) {
    throw ApiError.badRequest("That score is far above what the work is out of.", "score");
  }

  const grade = await ctx.repo.upsertGrade({
    assignmentId, accountId, score, outOf,
    feedback: body.feedback ? check.string(body.feedback, "feedback", { min: 0, max: 4000 }) : null,
    gradedBy: actor.id
  });
  return json({ grade: shape(grade) });
}
