/* ==========================================================================
   /api/v1/assignments/:assignmentId/submission — handing work in.

   Work a teacher sets on OEdu (a lesson, a unit test, a study set) is done on
   OEdu, and when it is done the student's app hands it in: what OEdu measured
   — the lesson finished, the test's score, how much of the set is mastered —
   goes to the teacher with it.

   A hand-in is not a mark. The teacher marks it, as they mark everything, and
   only the mark counts towards the grade. A score a browser reports is a score
   the browser controls, so it is shown to the teacher as what OEdu saw, never
   written into the gradebook on its own.

   Only a student enrolled in the course can hand work in, and only to work
   that has been set (not a draft). Learning a student does on their own, in
   courses no school put them in, has no assignment and so can never arrive
   here: it is not graded, anywhere.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";

export function submissionShape(s) {
  let result = null;
  try { result = s.content ? JSON.parse(s.content) : null; } catch { result = null; }
  return { assignmentId: s.assignment_id, accountId: s.account_id, submittedAt: s.submitted_at, result };
}

function readResult(v) {
  if (v == null) return { done: true };
  if (typeof v !== "object" || Array.isArray(v)) {
    throw ApiError.badRequest("result must be an object.", "result");
  }
  const out = { done: v.done !== false };
  if (v.score != null) out.score = check.number(v.score, "result.score", { min: 0, max: 100000 });
  if (v.outOf != null) out.outOf = check.number(v.outOf, "result.outOf", { min: 0.01, max: 100000 });
  if (v.pct != null) out.pct = Math.round(check.number(v.pct, "result.pct", { min: 0, max: 100 }));
  if (v.detail != null) out.detail = check.string(v.detail, "result.detail", { max: 300 });
  if (v.kind != null) out.kind = check.oneOf(v.kind, "result.kind", ["lesson", "test", "unit", "set"]);
  return out;
}

/* POST — the student hands this in. Handing in again replaces it. */
export async function submit(ctx, { assignmentId }) {
  const actor = requireActor(ctx);
  const a = await ctx.repo.findAssignment(assignmentId);
  if (!a) throw ApiError.notFound("No such assignment.");
  if (a.status === "draft") throw ApiError.notFound("No such assignment.");
  if (!(await ctx.repo.isEnrolled(a.course_id, actor.id, "student"))) {
    throw ApiError.forbidden("Only a student in this course can hand this work in.");
  }
  const body = await readJson(ctx.request, { limit: 8 * 1024 });
  const result = readResult(body.result);
  const row = await ctx.repo.putSubmission(assignmentId, actor.id, JSON.stringify(result));
  return json({ submission: submissionShape(row) }, { status: 201 });
}
