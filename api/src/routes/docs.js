/* ==========================================================================
   /api/v1/courses/:courseId/docs — what a course's teachers keep about it.

   A seating chart, lesson plans, the comments a teacher writes most often,
   the course's own objectives, a grade set by hand, an announcement. Each is
   one small document, read whole and written whole (migration 0016).

   Written by the course's teachers and assistants, and by the school's
   administrators — the same people who may set its work. Read by them too.
   A student of the course reads one kind only, the announcements that were
   written for them; everything else here is the teacher's working record,
   and an override in particular is about one student and is nobody else's
   to see. The grade it produces reaches that student the way every grade
   does: computed by the server, on their own Grades page.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, can } from "../core/guard.js";

const KINDS = ["seating", "plan", "bank", "standards", "override", "announce", "note"];
const FOR_STUDENTS = ["announce"];

function shape(d) {
  let body = null;
  try { body = JSON.parse(d.body_json); } catch { body = null; }
  return { kind: d.kind, id: d.doc_id, body, updatedBy: d.updated_by, updatedAt: d.updated_at };
}

/* GET ?kind= — every document of a kind, newest first; every kind without it. */
export async function list(ctx, { courseId }) {
  const actor = requireActor(ctx);
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");
  const kind = ctx.url.searchParams.get("kind") || null;
  if (kind && !KINDS.includes(kind)) throw ApiError.badRequest("No such kind of document.", "kind");

  const teaches = await can(ctx, "assignment.write", { courseId, orgId: course.org_id });
  if (!teaches && !(await ctx.repo.isEnrolled(courseId, actor.id, "student"))) {
    throw ApiError.forbidden("You are not in this course.");
  }
  const rows = await ctx.repo.listCourseDocs(courseId, kind);
  return json({ docs: rows.filter((d) => teaches || FOR_STUDENTS.includes(d.kind)).map(shape) });
}

/* PUT /:kind/:docId — write one, whole. */
export async function put(ctx, { courseId, kind, docId }) {
  const actor = requireActor(ctx);
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");
  await must(ctx, "assignment.write", { courseId, orgId: course.org_id });
  check.oneOf(kind, "kind", KINDS);
  check.string(docId, "docId", { max: 64 });

  const sent = await readJson(ctx.request, { limit: 64 * 1024 });
  let body = sent.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw ApiError.badRequest("body must be an object.", "body");
  }

  /* An override changes a grade, so it is the one kind checked field by
     field: it must be about a student of this course, and it says only a
     percent, a fixed raise or lowering, a mark, and why. */
  if (kind === "override") {
    const m = await ctx.repo.courseMembership(courseId, docId);
    if (!m || m.role !== "student") {
      throw ApiError.badRequest("That student is not enrolled in this course.", "docId");
    }
    const out = {};
    if (body.percent != null && body.percent !== "") out.percent = check.number(body.percent, "percent", { min: 0, max: 200 });
    if (body.adjust) out.adjust = check.number(body.adjust, "adjust", { min: -100, max: 100 });
    if (body.mark) out.mark = check.string(body.mark, "mark", { max: 8 });
    if (body.reason) out.reason = check.string(body.reason, "reason", { max: 300 });
    if (out.percent == null && !out.adjust && !out.mark) {
      throw ApiError.badRequest("An override sets a percent, a mark, or a raise or lowering.", "body");
    }
    body = out;
  }

  const row = await ctx.repo.putCourseDoc({ courseId, kind, docId, body, actorId: actor.id });
  return json({ doc: shape(row) });
}

export async function remove(ctx, { courseId, kind, docId }) {
  requireActor(ctx);
  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");
  await must(ctx, "assignment.write", { courseId, orgId: course.org_id });
  await ctx.repo.deleteCourseDoc(courseId, kind, docId);
  return json({ ok: true });
}
