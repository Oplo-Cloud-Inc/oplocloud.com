/* ==========================================================================
   /api/v1/conduct — behavior and discipline

   An entry about a student's conduct: an incident, a merit, a counseling
   note. The school decides, entry by entry, whether the family sees it; the
   default is that it does not. A teacher records what they saw and reads what
   they recorded. The people who run discipline read everything, settle
   entries and choose what a family is shown. Every change is a line in the
   entry's history that nothing can alter.

   Nothing here sends a message: OEdu sends none today. A family reads the
   entries the school chose to show, in the family view.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, guardsStudent } from "../core/guard.js";

const KINDS = ["incident", "merit", "counseling"];
const SEVERITIES = ["minor", "moderate", "serious"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

function day(v, field, req) {
  if (v == null || v === "") { if (req) throw ApiError.badRequest(`${field} is required.`, field); return null; }
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

/* What the school sees of an entry, and what a family sees of it. */
function shape(c, { family = false } = {}) {
  const base = {
    id: c.id, studentId: c.student_id, studentName: c.student_name || null, kind: c.kind, category: c.category || null,
    title: c.title, details: c.details || null, occurredOn: c.occurred_on, location: c.location || null,
    actionTaken: c.action_taken || null, status: c.status, courseTitle: c.course_title || null
  };
  if (family) return base;
  return {
    ...base, severity: c.severity || null, courseId: c.course_id || null, people: c.people || null,
    followUpOn: c.follow_up_on || null, familySees: !!c.family_sees, reportedBy: c.reported_by || null,
    reporterName: c.reporter_name || null, resolvedAt: c.resolved_at || null, createdAt: c.created_at, updatedAt: c.updated_at
  };
}

async function manager(ctx, orgId) { return can(ctx, "conduct.manage", { orgId }); }

const eventShape = (e) => ({ id: e.id, at: e.at, by: e.actor_id, byName: e.actor_name, kind: e.kind, note: e.note });

/* GET /api/v1/conduct — one student's entries, or the school's. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const q = ctx.url.searchParams;
  const studentId = q.get("studentId") || null;
  const kind = KINDS.includes(q.get("kind")) ? q.get("kind") : null;
  const status = ["open", "resolved"].includes(q.get("status")) ? q.get("status") : null;
  const from = DAY.test(q.get("from") || "") ? q.get("from") : null;
  const to = DAY.test(q.get("to") || "") ? q.get("to") : null;
  const mgr = await manager(ctx, orgId);
  const wide = await can(ctx, "conduct.read", { orgId });
  let rows;
  if (studentId) {
    await must(ctx, "conduct.read", { accountId: studentId, orgId });
    const family = !wide && (await guardsStudent(ctx, actor, studentId));
    rows = await ctx.repo.listConduct({ orgId, studentId, kind, status, from, to, familyOnly: family,
                                         reportedBy: wide || family ? null : actor.id });
    return json({ entries: rows.map((r) => shape(r, { family })), family });
  }
  // Without a student: the whole school for people who run discipline, and a
  // teacher's own entries for everybody else who may write one.
  rows = await ctx.repo.listConduct({ orgId, kind, status, from, to, reportedBy: wide ? null : actor.id });
  const term = String(q.get("q") || "").trim().toLowerCase();
  if (term) rows = rows.filter((r) => [r.student_name, r.title, r.category, r.details].join(" ").toLowerCase().includes(term));
  if (q.get("followUp") === "due") {
    const today = new Date().toISOString().slice(0, 10);
    rows = rows.filter((r) => r.status === "open" && r.follow_up_on && r.follow_up_on <= (DAY.test(q.get("today") || "") ? q.get("today") : today));
  }
  return json({ entries: rows.map((r) => shape(r)), manager: mgr });
}

/* GET /api/v1/conduct/summary */
export async function summary(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "conduct.manage", { orgId });
  const today = DAY.test(ctx.url.searchParams.get("today") || "") ? ctx.url.searchParams.get("today") : new Date().toISOString().slice(0, 10);
  const since = new Date(Date.parse(today) - 30 * 86400000).toISOString().slice(0, 10);
  const rows = await ctx.repo.listConduct({ orgId, limit: 5000 });
  const recent = rows.filter((r) => r.occurred_on >= since);
  const per = {};
  for (const r of recent) if (r.kind === "incident") per[r.student_id] = { n: (per[r.student_id] ? per[r.student_id].n : 0) + 1, name: r.student_name };
  return json({
    today, open: rows.filter((r) => r.kind === "incident" && r.status === "open").length,
    followUpsDue: rows.filter((r) => r.status === "open" && r.follow_up_on && r.follow_up_on <= today).length,
    incidents30: recent.filter((r) => r.kind === "incident").length,
    merits30: recent.filter((r) => r.kind === "merit").length,
    counseling30: recent.filter((r) => r.kind === "counseling").length,
    repeat: Object.keys(per).filter((k) => per[k].n >= 3).map((k) => ({ studentId: k, name: per[k].name, n: per[k].n })).sort((a, b) => b.n - a.n),
    categories: Object.entries(recent.reduce((m, r) => { const k = r.category || "Other"; m[k] = (m[k] || 0) + 1; return m; }, {}))
      .map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
  });
}

/* POST /api/v1/conduct */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const body = await readJson(ctx.request);
  const studentId = check.string(body.studentId, "studentId", { max: 64 });
  await must(ctx, "conduct.write", { accountId: studentId, orgId });
  if (!(await ctx.repo.findAccountById(studentId))) throw ApiError.notFound("No such student.");
  const kind = check.oneOf(body.kind, "kind", KINDS);
  const mgr = await manager(ctx, orgId);
  const c = await ctx.repo.createConduct({
    orgId, studentId, kind,
    category: text(body.category, "category", 60),
    severity: kind === "incident" && body.severity ? check.oneOf(body.severity, "severity", SEVERITIES) : null,
    title: text(body.title, "title", 160, true), details: text(body.details, "details", 4000),
    occurredOn: day(body.occurredOn, "occurredOn", true), location: text(body.location, "location", 120),
    courseId: body.courseId ? check.string(body.courseId, "courseId", { max: 64 }) : null,
    people: text(body.people, "people", 400), actionTaken: text(body.actionTaken, "actionTaken", 1000),
    followUpOn: day(body.followUpOn, "followUpOn"),
    // A teacher cannot decide what a family sees.
    familySees: mgr && body.familySees === true, reportedBy: actor.id
  });
  await ctx.repo.addConductEvent(c.id, { actorId: actor.id, actorName: actor.name, kind: "created", note: `${kind}: ${c.title}` });
  return json({ entry: shape(c) }, { status: 201 });
}

/* GET /api/v1/conduct/:id */
export async function get(ctx, { conductId }) {
  const actor = requireActor(ctx);
  const c = await ctx.repo.findConduct(conductId);
  if (!c) throw ApiError.notFound("No such entry.");
  await must(ctx, "conduct.read", { accountId: c.student_id, orgId: c.org_id, reportedBy: c.reported_by });
  const wide = await can(ctx, "conduct.read", { orgId: c.org_id });
  const family = !wide && c.reported_by !== actor.id;
  if (family && !c.family_sees) throw ApiError.notFound("No such entry.");
  const events = family ? [] : (await ctx.repo.listConductEvents(conductId)).map(eventShape);
  return json({ entry: shape(c, { family }), events });
}

/* PATCH /api/v1/conduct/:id — managers, or whoever wrote it while it is open. */
export async function update(ctx, { conductId }) {
  const actor = requireActor(ctx);
  const c = await ctx.repo.findConduct(conductId);
  if (!c) throw ApiError.notFound("No such entry.");
  const mgr = await manager(ctx, c.org_id);
  if (!mgr && !(c.reported_by === actor.id && c.status === "open")) {
    await must(ctx, "conduct.manage", { orgId: c.org_id });
  }
  const body = await readJson(ctx.request);
  const patch = {};
  const changed = [];
  const set = (k, v) => { if (v !== undefined) { patch[k] = v; changed.push(k); } };
  if (body.category !== undefined) set("category", text(body.category, "category", 60));
  if (body.severity !== undefined) set("severity", body.severity ? check.oneOf(body.severity, "severity", SEVERITIES) : null);
  if (body.title !== undefined) set("title", text(body.title, "title", 160, true));
  if (body.details !== undefined) set("details", text(body.details, "details", 4000));
  if (body.occurredOn !== undefined) set("occurredOn", day(body.occurredOn, "occurredOn", true));
  if (body.location !== undefined) set("location", text(body.location, "location", 120));
  if (body.people !== undefined) set("people", text(body.people, "people", 400));
  if (body.actionTaken !== undefined) set("actionTaken", text(body.actionTaken, "actionTaken", 1000));
  if (body.followUpOn !== undefined) set("followUpOn", day(body.followUpOn, "followUpOn"));
  if (!changed.length) return json({ entry: shape(c) });
  const u = await ctx.repo.updateConduct(conductId, patch);
  await ctx.repo.addConductEvent(conductId, { actorId: actor.id, actorName: actor.name, kind: "updated", note: changed.join(", ") });
  return json({ entry: shape(u) });
}

/* POST /api/v1/conduct/:id/actions/:action — resolve, reopen, show, hide. */
export async function act(ctx, { conductId, action }) {
  const actor = requireActor(ctx);
  const c = await ctx.repo.findConduct(conductId);
  if (!c) throw ApiError.notFound("No such entry.");
  await must(ctx, "conduct.manage", { orgId: c.org_id });
  const body = await readJson(ctx.request);
  const note = text(body.note, "note", 400);
  let u;
  switch (action) {
    case "resolve":
      if (c.status === "resolved") return json({ entry: shape(c) });
      u = await ctx.repo.updateConduct(conductId, { status: "resolved", resolvedBy: actor.id, resolvedAt: Date.now() });
      await ctx.repo.addConductEvent(conductId, { actorId: actor.id, actorName: actor.name, kind: "resolved", note });
      break;
    case "reopen":
      u = await ctx.repo.updateConduct(conductId, { status: "open", resolvedBy: null, resolvedAt: null });
      await ctx.repo.addConductEvent(conductId, { actorId: actor.id, actorName: actor.name, kind: "reopened", note });
      break;
    case "show":
    case "hide":
      u = await ctx.repo.updateConduct(conductId, { familySees: action === "show" });
      await ctx.repo.addConductEvent(conductId, { actorId: actor.id, actorName: actor.name, kind: action === "show" ? "shown" : "hidden",
                                                  note: action === "show" ? "Shown to the family" : "Hidden from the family" });
      break;
    default:
      throw ApiError.notFound(`There is no "${action}" step.`);
  }
  return json({ entry: shape(u) });
}
