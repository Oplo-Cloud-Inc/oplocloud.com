/* ==========================================================================
   /api/v1/assessments/*

   An exam's questions leave the database through one door: GET :id, to a
   signed-in student it was set for, once it has opened (guard.js,
   "assessment.read"). The list says what has been set and what the rules are,
   and carries no question at all, so an Exams tab can be drawn without the
   exam being in the browser until the student opens it.

   Publishing is an administrator's act, and the spec is checked on the way in
   (services/assessments.js): a spec carrying an answer is refused, so none
   can be stored and none can be served.

   The sitting — answers, timing, submission — is not here. It is the student's
   own progress scope exam:<id>.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, can } from "../core/guard.js";
import { normaliseSpec, card } from "../services/assessments.js";

/* Exam content is never kept by anything between here and the student: not a
   browser's HTTP cache, not a shared proxy. */
const PRIVATE = { "cache-control": "no-store, private" };

/* GET /api/v1/assessments
   What has been set for the caller, as cards. `?all=true` lists every one, for
   an administrator. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const all = ctx.url.searchParams.get("all") === "true";
  let rows;
  if (all) {
    await must(ctx, "assessment.write", {});
    rows = await ctx.repo.listAssessments();
  } else {
    rows = await ctx.repo.listAssessmentsFor(actor.id);
  }
  return json({ assessments: rows.map(card) }, { headers: PRIVATE });
}

/* GET /api/v1/assessments/:id — the questions. */
export async function get(ctx, { assessmentId }) {
  requireActor(ctx);
  const row = await ctx.repo.findAssessment(assessmentId);
  // A missing assessment and one that is not yours answer the same way, so
  // this cannot be used to find out which exams exist.
  if (!row || !(await can(ctx, "assessment.read", row))) {
    throw ApiError.forbidden("That assessment has not been set for you, or has not opened yet.");
  }
  let spec;
  try { spec = JSON.parse(row.spec_json); }
  catch { throw new ApiError(500, "bad_spec", "This assessment is stored in a form that cannot be read."); }
  return json({ assessment: { ...card(row), spec } }, { headers: PRIVATE });
}

/* PUT /api/v1/assessments/:id — publish or replace one.

     { spec, status?, opensAt?, closesAt?, assignees?: [email or account id] }

   `assignees`, when given, replaces the whole list. An address with no
   account is an error naming every such address, rather than a list that is
   quietly shorter than the one that was sent. */
export async function put(ctx, { assessmentId }) {
  const actor = requireActor(ctx);
  const id = check.slug(assessmentId, "id");
  const body = await readJson(ctx.request, { limit: 1024 * 1024 });
  const existing = await ctx.repo.findAssessment(id);
  const orgId = body.orgId || (existing && existing.org_id) ||
    (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "assessment.write", { orgId });

  const spec = normaliseSpec(body.spec, id);
  const status = check.oneOf(body.status || (existing ? existing.status : "draft"), "status",
    ["draft", "published", "archived"]);
  // Everybody named is found before anything is written, so a typo in one
  // address never leaves an assessment published to the wrong list.
  let assignees = null;
  if (Array.isArray(body.assignees)) {
    const found = [], missing = [];
    for (const who of body.assignees) {
      const w = String(who || "").trim();
      if (!w) continue;
      const acc = w.includes("@") ? await ctx.repo.findAccountByEmail(w) : await ctx.repo.findAccountById(w);
      if (acc) found.push(acc.id); else missing.push(w);
    }
    if (missing.length) {
      throw ApiError.badRequest("No account for: " + missing.join(", ") + ".", "assignees");
    }
    assignees = [...new Set(found)];
  }
  const time = (v, field) => (v == null || v === "" ? null
    : check.number(typeof v === "string" ? Date.parse(v) : v, field, { min: 0 }));

  const row = await ctx.repo.upsertAssessment({
    id, orgId,
    courseCode: spec.course && spec.course.code ? String(spec.course.code) : null,
    title: spec.title.trim(),
    version: String(spec.version || "1"),
    status,
    opensAt: body.opensAt !== undefined ? time(body.opensAt, "opensAt") : (existing ? existing.opens_at : null),
    closesAt: body.closesAt !== undefined ? time(body.closesAt, "closesAt") : (existing ? existing.closes_at : null),
    specJson: JSON.stringify(spec),
    createdBy: actor.id
  });

  if (assignees) await ctx.repo.replaceAssessmentAssignees(id, assignees, actor.id);

  const who = await ctx.repo.listAssessmentAssignees(id);
  return json({
    assessment: { ...card(row), assignees: who.map((a) => a.account_id) }
  }, { status: existing ? 200 : 201, headers: PRIVATE });
}

