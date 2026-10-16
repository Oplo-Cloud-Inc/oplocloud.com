/* ==========================================================================
   /api/v1/health-records — health records

   Allergies, conditions, vaccinations, medications, screenings, visits and
   insurance, kept by the nurse and the office. Restricted: a teacher is
   never given the record. What a teacher is given is a flag — a sentence the
   school chose to raise, "Peanut allergy — auto-injector in the office" —
   which says what to know and do and not why. A family reads their own
   child's record and changes none of it.

   A vaccination carries the day the next dose is due, and the school's
   immunization status is read from those days, never typed.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, guardsStudent } from "../core/guard.js";

const KINDS = ["allergy", "condition", "immunization", "medication", "screening", "visit", "insurance"];
const SEVERITIES = ["mild", "moderate", "severe"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

function day(v, field) {
  if (v == null || v === "") return null;
  const s = String(v);
  if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field);
  return s;
}
function text(v, field, max, req) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (typeof v !== "string") throw ApiError.badRequest(`${field} must be text.`, field);
  const s = v.trim();
  if (!s) { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
  if (s.length > max) throw ApiError.badRequest(`${field} is longer than ${max} characters.`, field);
  return s;
}

const shape = (h) => ({
  id: h.id, studentId: h.student_id, studentName: h.student_name || null, kind: h.kind, title: h.title, detail: h.detail || null,
  severity: h.severity || null, onDate: h.on_date || null, dueOn: h.due_on || null, status: h.status, flag: h.flag || null,
  createdAt: h.created_at, updatedAt: h.updated_at
});
const eventShape = (e) => ({ id: e.id, at: e.at, by: e.actor_id, byName: e.actor_name, kind: e.kind, note: e.note });
const todayOf = (ctx) => (DAY.test(ctx.url.searchParams.get("today") || "") ? ctx.url.searchParams.get("today") : new Date().toISOString().slice(0, 10));

/* GET /api/v1/health-records?studentId= — one student's record; or the school's. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const q = ctx.url.searchParams;
  const studentId = q.get("studentId") || null;
  const kind = KINDS.includes(q.get("kind")) ? q.get("kind") : null;
  const status = ["active", "resolved"].includes(q.get("status")) ? q.get("status") : null;
  if (studentId) {
    await must(ctx, "health.read", { accountId: studentId, orgId });
    const rows = await ctx.repo.listHealth({ orgId, studentId, kind, status });
    const family = !(await can(ctx, "health.write", { orgId })) && (await guardsStudent(ctx, actor, studentId));
    return json({ entries: rows.map(shape), family });
  }
  await must(ctx, "health.read", { orgId });
  const rows = await ctx.repo.listHealth({ orgId, kind, status });
  return json({ entries: rows.map(shape) });
}

/* GET /api/v1/health-records/summary — what the nurse looks at first. */
export async function summary(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "health.write", { orgId });
  const today = todayOf(ctx);
  const soon = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
  const rows = (await ctx.repo.listHealth({ orgId, status: "active" }));
  const imm = rows.filter((r) => r.kind === "immunization" && r.due_on);
  const people = (pred) => new Set(rows.filter(pred).map((r) => r.student_id)).size;
  return json({
    today,
    immunizationsOverdue: imm.filter((r) => r.due_on < today).length,
    immunizationsSoon: imm.filter((r) => r.due_on >= today && r.due_on <= soon).length,
    studentsOverdue: new Set(imm.filter((r) => r.due_on < today).map((r) => r.student_id)).size,
    severeAllergies: rows.filter((r) => r.kind === "allergy" && r.severity === "severe").length,
    medications: rows.filter((r) => r.kind === "medication").length,
    flagged: people((r) => !!r.flag),
    studentsWithRecords: people(() => true)
  });
}

/* GET /api/v1/health-records/flags?studentId= | ?courseId=

   What a teacher is told. Only the flag sentence, and only for the students
   they teach. */
export async function flags(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const orgId = orgOf(actor);
  let ids = [];
  if (q.get("courseId")) {
    const courseId = q.get("courseId");
    const course = await ctx.repo.findCourse(courseId);
    if (!course) throw ApiError.notFound("No such course.");
    const mine = await ctx.repo.courseMembership(courseId, actor.id);
    const staff = await can(ctx, "health.flags", { accountId: null, orgId });
    if (!staff && !(mine && (mine.role === "teacher" || mine.role === "assistant"))) {
      await must(ctx, "health.flags", { accountId: null, orgId });
    }
    ids = (await ctx.repo.listCourseMembers(courseId, "student")).map((m) => m.id);
  } else if (q.get("studentId")) {
    await must(ctx, "health.flags", { accountId: q.get("studentId"), orgId });
    ids = [q.get("studentId")];
  } else throw ApiError.badRequest("Say which student or course.", "studentId");
  if (!ids.length) return json({ flags: [] });
  const rows = await ctx.repo.listHealth({ orgId, status: "active", studentIds: ids });
  return json({ flags: rows.filter((r) => r.flag).map((r) => ({
    studentId: r.student_id, studentName: r.student_name, kind: r.kind, flag: r.flag })) });
}

/* POST /api/v1/health */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "health.write", { orgId });
  const body = await readJson(ctx.request);
  const studentId = check.string(body.studentId, "studentId", { max: 64 });
  if (!(await ctx.repo.findAccountById(studentId))) throw ApiError.notFound("No such student.");
  const kind = check.oneOf(body.kind, "kind", KINDS);
  const h = await ctx.repo.createHealth({
    orgId, studentId, kind, title: text(body.title, "title", 160, true), detail: text(body.detail, "detail", 2000),
    severity: body.severity ? check.oneOf(body.severity, "severity", SEVERITIES) : null,
    onDate: day(body.onDate, "onDate"), dueOn: day(body.dueOn, "dueOn"), flag: text(body.flag, "flag", 240), createdBy: actor.id
  });
  await ctx.repo.addHealthEvent(h.id, { actorId: actor.id, actorName: actor.name, kind: "created", note: `${kind}: ${h.title}` });
  return json({ entry: shape(h) }, { status: 201 });
}

/* PATCH /api/v1/health-records/:id */
export async function update(ctx, { healthId }) {
  const actor = requireActor(ctx);
  const h = await ctx.repo.findHealth(healthId);
  if (!h) throw ApiError.notFound("No such entry.");
  await must(ctx, "health.write", { orgId: h.org_id });
  const body = await readJson(ctx.request);
  const patch = {}, changed = [];
  const set = (k, v) => { patch[k] = v; changed.push(k); };
  if (body.title !== undefined) set("title", text(body.title, "title", 160, true));
  if (body.detail !== undefined) set("detail", text(body.detail, "detail", 2000));
  if (body.severity !== undefined) set("severity", body.severity ? check.oneOf(body.severity, "severity", SEVERITIES) : null);
  if (body.onDate !== undefined) set("onDate", day(body.onDate, "onDate"));
  if (body.dueOn !== undefined) set("dueOn", day(body.dueOn, "dueOn"));
  if (body.flag !== undefined) set("flag", text(body.flag, "flag", 240));
  if (body.status !== undefined) set("status", check.oneOf(body.status, "status", ["active", "resolved"]));
  if (!changed.length) return json({ entry: shape(h) });
  const u = await ctx.repo.updateHealth(healthId, patch);
  await ctx.repo.addHealthEvent(healthId, { actorId: actor.id, actorName: actor.name,
    kind: patch.status === "resolved" ? "resolved" : patch.status === "active" ? "reopened" : "updated", note: changed.join(", ") });
  return json({ entry: shape(u) });
}

/* GET /api/v1/health-records/:id/history */
export async function history(ctx, { healthId }) {
  requireActor(ctx);
  const h = await ctx.repo.findHealth(healthId);
  if (!h) throw ApiError.notFound("No such entry.");
  await must(ctx, "health.write", { orgId: h.org_id });
  return json({ events: (await ctx.repo.listHealthEvents(healthId)).map(eventShape) });
}
