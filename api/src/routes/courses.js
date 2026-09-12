/* ==========================================================================
   /api/v1/courses/*  — courses, enrolment, assignments.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, can } from "../core/guard.js";

function shape(row) {
  let body = null;
  try { body = row.body_json ? JSON.parse(row.body_json) : null; } catch { body = null; }
  return {
    id: row.id, code: row.code, title: row.title, subject: row.subject,
    level: row.level, summary: row.summary, status: row.status,
    orgId: row.org_id, createdBy: row.created_by,
    myRole: row.my_role || null,
    body
  };
}

export async function list(ctx) {
  const actor = requireActor(ctx);
  const mine = ctx.url.searchParams.get("mine") !== "false";
  if (mine) {
    const rows = await ctx.repo.listCourses({ accountId: actor.id });
    return json({ courses: rows.map(shape) });
  }
  const orgId = ctx.url.searchParams.get("orgId") ||
    (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  const rows = await ctx.repo.listCourses({ orgId });
  const visible = [];
  for (const row of rows) {
    if (await can(ctx, "course.read", row)) visible.push(shape(row));
  }
  return json({ courses: visible });
}

export async function get(ctx, { courseId }) {
  requireActor(ctx);
  const row = await ctx.repo.findCourse(courseId);
  if (!row) throw ApiError.notFound("No such course.");
  await must(ctx, "course.read", row);
  const membership = await ctx.repo.courseMembership(courseId, ctx.actor.id);
  return json({ course: { ...shape(row), myRole: membership ? membership.role : null } });
}

export async function create(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const orgId = body.orgId || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "course.create", { orgId });

  const code = check.slug(body.code, "code");
  const title = check.string(body.title, "title", { max: 160 });
  if (await ctx.repo.findCourseByCode(orgId, code)) {
    throw ApiError.conflict("A course already uses that code.", "code");
  }

  const course = await ctx.repo.createCourse({
    orgId, code, title,
    subject: body.subject || null,
    level: body.level || null,
    summary: body.summary || null,
    body: body.body || null,
    status: body.status === "published" ? "published" : "draft",
    createdBy: actor.id
  });
  // Whoever writes a course teaches it until somebody says otherwise. Without
  // this the author cannot edit what they just made.
  await ctx.repo.enrol(course.id, actor.id, "teacher");
  return json({ course: shape(course) }, { status: 201 });
}

export async function update(ctx, { courseId }) {
  requireActor(ctx);
  const row = await ctx.repo.findCourse(courseId);
  if (!row) throw ApiError.notFound("No such course.");
  await must(ctx, "course.write", row);

  const body = await readJson(ctx.request);
  const patch = {};
  if (body.title !== undefined) patch.title = check.string(body.title, "title", { max: 160 });
  if (body.subject !== undefined) patch.subject = body.subject;
  if (body.level !== undefined) patch.level = body.level;
  if (body.summary !== undefined) patch.summary = body.summary;
  if (body.status !== undefined) {
    patch.status = check.oneOf(body.status, "status", ["draft", "published", "archived"]);
  }
  if (body.body !== undefined) patch.body = body.body;

  return json({ course: shape(await ctx.repo.updateCourse(courseId, patch)) });
}

export async function members(ctx, { courseId }) {
  requireActor(ctx);
  const row = await ctx.repo.findCourse(courseId);
  if (!row) throw ApiError.notFound("No such course.");
  await must(ctx, "course.read", row);
  const rows = await ctx.repo.listCourseMembers(courseId);
  return json({ members: rows.map((m) => ({
    id: m.id, name: m.name, firstName: m.first_name, initials: m.initials,
    hue: m.avatar_hue, email: m.email, role: m.role
  })) });
}

export async function enrol(ctx, { courseId }) {
  requireActor(ctx);
  await must(ctx, "course.enrol", { courseId });
  const body = await readJson(ctx.request);
  const accountId = check.string(body.accountId, "accountId", { max: 64 });
  const role = check.oneOf(body.role || "student", "role", ["student", "teacher", "assistant"]);

  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such account.");
  if (body.remove) await ctx.repo.unenrol(courseId, accountId, role);
  else await ctx.repo.enrol(courseId, accountId, role);

  const rows = await ctx.repo.listCourseMembers(courseId);
  return json({ members: rows.map((m) => ({ id: m.id, name: m.name, role: m.role })) });
}

/* ------------------------------------------------------------ Assignments */

function assignmentShape(a) {
  return { id: a.id, courseId: a.course_id, title: a.title, category: a.category,
           outOf: a.out_of, dueAt: a.due_at, extraCredit: !!a.extra_credit,
           status: a.status };
}

export async function listAssignments(ctx, { courseId }) {
  requireActor(ctx);
  const row = await ctx.repo.findCourse(courseId);
  if (!row) throw ApiError.notFound("No such course.");
  await must(ctx, "course.read", row);
  const rows = await ctx.repo.listAssignments(courseId);
  return json({ assignments: rows.map(assignmentShape) });
}

export async function createAssignment(ctx, { courseId }) {
  const actor = requireActor(ctx);
  await must(ctx, "assignment.write", { courseId });
  const body = await readJson(ctx.request);
  const a = await ctx.repo.createAssignment({
    courseId,
    title: check.string(body.title, "title", { max: 160 }),
    category: body.category || null,
    outOf: check.number(body.outOf ?? 100, "outOf", { min: 0.01, max: 100000 }),
    dueAt: body.dueAt || null,
    // Work that can raise a grade and never lower one.
    extraCredit: !!body.extraCredit,
    createdBy: actor.id
  });
  return json({ assignment: assignmentShape(a) }, { status: 201 });
}

export async function updateAssignment(ctx, { assignmentId }) {
  requireActor(ctx);
  const a = await ctx.repo.findAssignment(assignmentId);
  if (!a) throw ApiError.notFound("No such assignment.");
  await must(ctx, "assignment.write", { courseId: a.course_id });

  const body = await readJson(ctx.request);
  const patch = {};
  if (body.title !== undefined) patch.title = check.string(body.title, "title", { max: 160 });
  if (body.category !== undefined) patch.category = body.category;
  if (body.outOf !== undefined) {
    patch.outOf = check.number(body.outOf, "outOf", { min: 0.01, max: 100000 });
  }
  if (body.dueAt !== undefined) patch.dueAt = body.dueAt;
  if (body.extraCredit !== undefined) patch.extraCredit = body.extraCredit ? 1 : 0;
  return json({ assignment: assignmentShape(await ctx.repo.updateAssignment(assignmentId, patch)) });
}

export async function deleteAssignment(ctx, { assignmentId }) {
  requireActor(ctx);
  const a = await ctx.repo.findAssignment(assignmentId);
  if (!a) throw ApiError.notFound("No such assignment.");
  await must(ctx, "assignment.write", { courseId: a.course_id });
  await ctx.repo.deleteAssignment(assignmentId);
  return json({ ok: true });
}
