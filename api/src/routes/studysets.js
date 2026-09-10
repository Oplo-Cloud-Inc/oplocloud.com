/* ==========================================================================
   /api/v1/study-sets/*

   Authoring and consumption, both server-backed. The frontend keeps a cache
   of what it is allowed to see so that studying works on a train, but the
   set itself is a database row and a teacher writing one is giving it to a
   class rather than to their own browser.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, can } from "../core/guard.js";
import { normaliseTerms, levelsFor, describe } from "../services/studysets.js";

function shape(row, terms) {
  const out = {
    id: row.id, code: row.code, title: row.title, summary: row.summary,
    courseId: row.course_id, orgId: row.org_id,
    visibility: row.visibility, status: row.status,
    createdBy: row.created_by, updatedAt: row.updated_at,
    termCount: terms ? terms.length : (row.term_count ?? null)
  };
  if (terms) {
    out.terms = terms.map((t) => ({
      term: t.term, definition: t.definition,
      why: t.why, example: t.example, hint: t.hint,
      levels: levelsFor(t)
    }));
    out.describes = describe(terms);
  }
  return out;
}

/* GET /api/v1/study-sets
   Defaults to everything this account may study: their courses' sets, sets
   published to their organization, and their own drafts. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null;
  const mine = ctx.url.searchParams.get("mine") === "true";
  const courseId = ctx.url.searchParams.get("courseId");

  let rows;
  if (mine) {
    rows = await ctx.repo.listStudySets({ accountId: actor.id });
  } else if (courseId) {
    rows = await ctx.repo.listStudySets({ courseId });
  } else {
    rows = await ctx.repo.listStudySetsFor(actor.id, orgId);
  }

  // Filtered per row rather than trusted from the query. A list endpoint that
  // authorizes the query but not the results is how content leaks.
  const visible = [];
  for (const row of rows) {
    if (await can(ctx, "set.read", row)) visible.push(shape(row));
  }
  return json({ studySets: visible });
}

export async function get(ctx, { setId }) {
  requireActor(ctx);
  const row = await ctx.repo.findStudySet(setId);
  if (!row) throw ApiError.notFound("No such study set.");
  await must(ctx, "set.read", row);
  const terms = await ctx.repo.listTerms(setId);
  return json({ studySet: shape(row, terms) });
}

export async function create(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request, { limit: 512 * 1024 });
  const orgId = body.orgId || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  await must(ctx, "set.create", { orgId });

  const code = check.slug(body.code, "code");
  const title = check.string(body.title, "title", { max: 200 });
  const visibility = check.oneOf(body.visibility || "course", "visibility",
    ["course", "org", "private"]);

  if (await ctx.repo.findStudySetByCode(orgId, code)) {
    throw ApiError.conflict("A study set already uses that code.", "code");
  }

  // A set attached to a course is a set that course's students will see, so
  // the caller has to be entitled to put it there.
  if (body.courseId) {
    const course = await ctx.repo.findCourse(body.courseId);
    if (!course) throw ApiError.badRequest("No such course.", "courseId");
    await must(ctx, "assignment.write", { courseId: body.courseId });
  }

  const terms = normaliseTerms(body.terms || []);
  const set = await ctx.repo.createStudySet({
    orgId, code, title,
    summary: body.summary || null,
    courseId: body.courseId || null,
    visibility,
    status: body.status === "published" ? "published" : "draft",
    createdBy: actor.id
  });
  const stored = await ctx.repo.replaceTerms(set.id, terms);
  return json({ studySet: shape(set, stored) }, { status: 201 });
}

export async function update(ctx, { setId }) {
  requireActor(ctx);
  const row = await ctx.repo.findStudySet(setId);
  if (!row) throw ApiError.notFound("No such study set.");
  await must(ctx, "set.write", row);

  const body = await readJson(ctx.request, { limit: 512 * 1024 });
  const patch = {};
  if (body.title !== undefined) patch.title = check.string(body.title, "title", { max: 200 });
  if (body.summary !== undefined) patch.summary = body.summary;
  if (body.visibility !== undefined) {
    patch.visibility = check.oneOf(body.visibility, "visibility", ["course", "org", "private"]);
  }
  if (body.status !== undefined) {
    patch.status = check.oneOf(body.status, "status", ["draft", "published", "archived"]);
  }
  if (body.courseId !== undefined) {
    if (body.courseId) await must(ctx, "assignment.write", { courseId: body.courseId });
    patch.courseId = body.courseId || null;
  }

  const set = await ctx.repo.updateStudySet(setId, patch);
  const terms = body.terms !== undefined
    ? await ctx.repo.replaceTerms(setId, normaliseTerms(body.terms))
    : await ctx.repo.listTerms(setId);
  return json({ studySet: shape(set, terms) });
}

export async function remove(ctx, { setId }) {
  requireActor(ctx);
  const row = await ctx.repo.findStudySet(setId);
  if (!row) throw ApiError.notFound("No such study set.");
  await must(ctx, "set.write", row);
  await ctx.repo.archiveStudySet(setId);
  return json({ ok: true, archived: setId });
}
