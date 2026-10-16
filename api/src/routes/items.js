/* ==========================================================================
   /api/v1/items — the school's smaller records (see services/items.js).

   One set of routes for every kind. What a person may read or write is the
   kind's policy, decided here and not in a screen: a student sees their own
   detention and not their neighbour's; a family sees their child's invoice;
   a member of staff sees a leave request only if it is theirs or they are
   the office.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { KINDS, KIND_KEYS, publicKinds, cleanData } from "../services/items.js";
import { notify } from "../services/notify.js";
import { orgOf, isOffice, isSchoolStaff, STAFF_ROLES_ALL, guardsStudent } from "../services/who.js";
import { deliver } from "./exchange.js";

const failer = (m, f) => { throw ApiError.badRequest(m, f); };

async function wardIds(ctx, actor) {
  return (await ctx.repo.listWards(actor.id)).map((w) => w.id);
}

/* Whether the actor may read this row (or, with row null, rows of this kind at all). */
async function mayRead(ctx, actor, kind, row) {
  const org = orgOf(actor), spec = KINDS[kind], staff = isSchoolStaff(actor, org);
  const theirs = async () => !!row && (row.subject_id === actor.id || (!!row.subject_id && await guardsStudent(ctx, actor, row.subject_id)));
  switch (spec.policy) {
    case "org": return true;
    case "staff": return staff;
    case "office": return isOffice(actor, org);
    case "subject": return staff || !row || await theirs();
    case "money": return isOffice(actor, org) || !row || await theirs();
    case "self": return isOffice(actor, org) || (staff && kind !== "leave") || !row || await theirs();
    default: return false;
  }
}
async function mayWrite(ctx, actor, kind, row) {
  const org = orgOf(actor), spec = KINDS[kind];
  switch (spec.policy) {
    case "org": case "staff": case "subject": return isSchoolStaff(actor, org);
    case "office": case "money": return isOffice(actor, org);
    case "self":
      if (isOffice(actor, org)) return true;
      if (!row) return true;                                       // anyone may make their own
      return row.subject_id === actor.id || (!!row.subject_id && await guardsStudent(ctx, actor, row.subject_id));
    default: return false;
  }
}

function shape(r, files) {
  let data = {};
  try { data = JSON.parse(r.data_json) || {}; } catch { data = {}; }
  return { id: r.id, kind: r.kind, title: r.title, status: r.status, subjectId: r.subject_id, subjectName: r.subject_name || null,
    courseId: r.course_id, courseTitle: r.course_title || null, startsAt: r.starts_at, endsAt: r.ends_at, dueOn: r.due_on, data,
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at, files: files || undefined };
}

/* GET /item-kinds */
export async function kinds(ctx) {
  requireActor(ctx);
  return json({ kinds: publicKinds() });
}

/* GET /items?kind=&subjectId=&courseId=&status=&from=&to= */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const kind = check.oneOf(q.get("kind"), "kind", KIND_KEYS);
  const orgId = orgOf(actor);
  if (!(await mayRead(ctx, actor, kind, null))) throw ApiError.forbidden("These records are not yours to read.");
  const spec = KINDS[kind];
  let subjectIds = q.get("subjectId") ? [q.get("subjectId")] : null;
  const wide = spec.policy === "subject" ? isSchoolStaff(actor, orgId)
    : spec.policy === "money" || spec.policy === "self" ? isOffice(actor, orgId) || (spec.policy === "self" && kind !== "leave" && isSchoolStaff(actor, orgId))
    : true;
  if (!wide) {
    // Their own, and their children's: never a list of everybody's.
    const mine = [actor.id].concat(await wardIds(ctx, actor));
    subjectIds = subjectIds ? subjectIds.filter((x) => mine.includes(x)) : mine;
  }
  let rows = await ctx.repo.listItems({ orgId, kind, subjectIds, courseId: q.get("courseId"), status: q.get("status"), from: q.get("from"), to: q.get("to") });
  // A draft invoice is the office's until it is issued.
  if (kind === "invoice" && !isOffice(actor, orgId)) rows = rows.filter((r) => r.status !== "draft");
  return json({ items: rows.map((r) => shape(r)) });
}

/* GET /items/:itemId */
export async function get(ctx, { itemId }) {
  const actor = requireActor(ctx);
  const r = await ctx.repo.findItem(itemId);
  if (!r || r.org_id !== orgOf(actor) || r.archived_at) throw ApiError.notFound("No such record.");
  if (!(await mayRead(ctx, actor, r.kind, r)) || (r.kind === "invoice" && r.status === "draft" && !isOffice(actor, orgOf(actor)))) throw ApiError.forbidden("This record is not yours to read.");
  return json({ item: shape(r, await ctx.repo.listFiles("item", r.id)) });
}

async function recipients(ctx, spec, orgId, item) {
  if (spec.notify === "subject" && item.subjectId) return [item.subjectId].concat(await ctx.repo.guardianIdsOf([item.subjectId]));
  if (spec.notify === "audience") {
    const a = item.data.audience || "everyone";
    const staff = await ctx.repo.accountsWithRole(orgId, STAFF_ROLES_ALL);
    if (a === "staff") return staff;
    const studs = Array.from(new Set((await ctx.repo.listStudentMemberships(orgId)).map((m) => m.account_id)));
    const fam = await ctx.repo.guardianIdsOf(studs);
    return a === "students" ? studs : a === "families" ? fam : staff.concat(studs, fam);
  }
  return [];
}

function readBody(kind, body, existing) {
  const spec = KINDS[kind];
  const title = body.title != null ? check.string(body.title, "title", { max: 160 }) : existing ? existing.title : failer("title is required.", "title");
  const status = body.status != null ? check.oneOf(body.status, "status", spec.statuses) : existing ? existing.status : spec.statuses[0];
  const data = cleanData(kind, body.data != null ? body.data : (existing ? JSON.parse(existing.data_json || "{}") : {}), failer);
  const day = (v, f) => { if (v == null || v === "") return null; if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) failer(`${f} is a date, written YYYY-MM-DD.`, f); return String(v); };
  const dueOn = body.dueOn !== undefined ? day(body.dueOn, "dueOn") : existing ? existing.due_on : null;
  const subjectId = body.subjectId !== undefined ? (body.subjectId || null) : existing ? existing.subject_id : null;
  const courseId = body.courseId !== undefined ? (body.courseId || null) : existing ? existing.course_id : null;
  if (spec.about === "student" && !subjectId && !existing) failer("Say which student it is about.", "subjectId");
  if (spec.about === "staff" && !subjectId && !existing) failer("Say which member of staff it is about.", "subjectId");
  return { title, status, data, dueOn, subjectId, courseId,
    startsAt: body.startsAt != null ? Number(body.startsAt) : existing ? existing.starts_at : null,
    endsAt: body.endsAt != null ? Number(body.endsAt) : existing ? existing.ends_at : null };
}

/* POST /items { kind, title, status?, subjectId?, courseId?, dueOn?, data } */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const body = await readJson(ctx.request, { limit: 64 * 1024 });
  const kind = check.oneOf(body.kind, "kind", KIND_KEYS);
  const spec = KINDS[kind];
  if (spec.policy === "self" && !body.subjectId) body.subjectId = actor.id;   // "mine" unless said otherwise
  const draft = readBody(kind, body, null);
  // A thing that is "mine" is about me, whoever else it could be about.
  if (spec.policy === "self" && !isOffice(actor, orgId) && draft.subjectId !== actor.id && !(draft.subjectId && await guardsStudent(ctx, actor, draft.subjectId))) {
    draft.subjectId = actor.id;
  }
  if (!(await mayWrite(ctx, actor, kind, { subject_id: draft.subjectId }))) throw ApiError.forbidden("You cannot add this kind of record.");
  if (draft.courseId) {
    const c = await ctx.repo.findCourse(draft.courseId);
    if (!c || c.org_id !== orgId) throw ApiError.notFound("No such course.");
  }
  if (draft.subjectId && !(await ctx.repo.findAccountById(draft.subjectId))) throw ApiError.notFound("No such person.");
  if (kind === "leave" && !isOffice(actor, orgId)) draft.status = "pending";
  const iid = await ctx.repo.insertItem({ orgId, kind, ...draft, createdBy: actor.id });
  const out = shape(await ctx.repo.findItem(iid));
  if (spec.notify) {
    const to = (await recipients(ctx, spec, orgId, out)).filter((x) => x !== actor.id);
    if (to.length) ctx.waitUntil(notify(ctx.repo, { orgId, to, kind: kind === "event" || kind === "form" ? "announcement" : "alert", from: actor.id,
      title: `${spec.label}: ${out.title}`, body: out.data.about || out.data.body || null, link: kind, dedupe: `item:${iid}` }));
  }
  ctx.waitUntil(deliver(ctx, orgId, "item.created", out));
  return json({ item: out }, { status: 201 });
}

/* PATCH /items/:itemId */
export async function update(ctx, { itemId }) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const r = await ctx.repo.findItem(itemId);
  if (!r || r.org_id !== orgId || r.archived_at) throw ApiError.notFound("No such record.");
  if (!(await mayWrite(ctx, actor, r.kind, r))) throw ApiError.forbidden("You cannot change this record.");
  const body = await readJson(ctx.request, { limit: 64 * 1024 });
  const upd = readBody(r.kind, body, r);
  // The person who asked may withdraw; only the office decides.
  if (r.kind === "leave" && !isOffice(actor, orgId) && upd.status !== r.status && upd.status !== "withdrawn") throw ApiError.forbidden("Only the office approves or declines.");
  await ctx.repo.updateItem(itemId, upd);
  const out = shape(await ctx.repo.findItem(itemId));
  if (upd.status !== r.status && ["leave", "referral", "senplan"].includes(r.kind) && r.subject_id && r.subject_id !== actor.id) {
    ctx.waitUntil(notify(ctx.repo, { orgId, to: [r.subject_id], kind: "alert", from: actor.id, title: `${KINDS[r.kind].label} ${upd.status}: ${out.title}`, link: r.kind,
      dedupe: `item:${itemId}:${upd.status}` }));
  }
  ctx.waitUntil(deliver(ctx, orgId, "item.updated", out));
  return json({ item: out });
}

/* DELETE /items/:itemId — put away, never erased. */
export async function remove(ctx, { itemId }) {
  const actor = requireActor(ctx);
  const r = await ctx.repo.findItem(itemId);
  if (!r || r.org_id !== orgOf(actor) || r.archived_at) throw ApiError.notFound("No such record.");
  if (!(await mayWrite(ctx, actor, r.kind, r))) throw ApiError.forbidden("You cannot remove this record.");
  await ctx.repo.archiveItem(itemId);
  return json({ ok: true });
}
