/* ==========================================================================
   /api/v1/marks

   The student's reading, kept where more than one device can reach it.

   The client generates the id. That is not laziness about identifiers — it is
   what makes a mark idempotent: annotate.js writes to localStorage first and
   posts afterwards, so a mark made on a train and posted twice when the
   signal returns has to land as one row, and the only id both attempts agree
   on is the one the client already wrote locally.

   Marks are private by default. `visibility` exists so phase five has
   something to read, and nothing in this file ever returns another student's
   mark — that endpoint is deliberately not written yet, because the rule it
   needs (you see theirs only after you have written yours) belongs with the
   screen that shows them rather than three weeks before it.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";

/* The shape the reader works in. The database column is `char_offset`
   because `offset` is a reserved word in SQL; the client has always called it
   `offset`, and translating here keeps that from leaking either way. */
function toClient(r) {
  return {
    id: r.id,
    scope: r.scope,
    sec: r.section,
    pass: r.pass,
    text: r.text,
    anchor: {
      exact: r.exact,
      prefix: r.prefix || "",
      suffix: r.suffix || "",
      offset: r.char_offset == null ? undefined : r.char_offset
    },
    note: r.note || "",
    replyTo: r.reply_to || null,
    visibility: r.visibility,
    at: r.created_at,
    edited: r.updated_at
  };
}

/* GET /api/v1/marks?scope=media:6&accountId=
   Your own marks, or a student's if you teach them. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;
  const scope = ctx.url.searchParams.get("scope") || null;
  await must(ctx, "mark.read", { accountId });

  const rows = await ctx.repo.listMarks(accountId, scope);
  return json({ marks: rows.map(toClient) });
}

/* POST /api/v1/marks — write one mark, or overwrite it with the same id.

   Validation is deliberately strict about the anchor. A mark whose `exact` is
   empty cannot be found in the text again, and a mark that cannot be found is
   worse than no mark: it is a row that will render as a highlight over the
   wrong sentence, or over nothing. */
export async function put(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request, { limit: 64 * 1024 });
  await must(ctx, "mark.write", { accountId: actor.id });

  const id = check.string(body.id, "id", { max: 64 });
  const scope = check.string(body.scope, "scope", { max: 200 });
  const section = check.string(body.sec, "sec", { max: 40 });
  const anchor = body.anchor || {};
  const exact = check.string(anchor.exact, "anchor.exact", { max: 4000 });

  const pass = Number(body.pass);
  if (!Number.isInteger(pass) || pass < 1 || pass > 6) {
    throw ApiError.badRequest("pass must be one of the six passes.", "pass");
  }
  const visibility = body.visibility === "cohort" ? "cohort" : "private";

  // An existing row may only be rewritten by the person who wrote it. Without
  // this a known id would be enough to edit somebody else's note.
  const existing = await ctx.repo.getMark(id);
  if (existing && existing.account_id !== actor.id) {
    throw ApiError.forbidden("That mark belongs to someone else.");
  }

  await ctx.repo.putMark({
    id,
    accountId: actor.id,
    courseId: body.courseId || null,
    scope,
    section,
    pass,
    text: String(body.text == null ? exact : body.text).slice(0, 4000),
    exact,
    prefix: anchor.prefix ? String(anchor.prefix).slice(0, 400) : null,
    suffix: anchor.suffix ? String(anchor.suffix).slice(0, 400) : null,
    charOffset: Number.isFinite(Number(anchor.offset)) ? Number(anchor.offset) : null,
    note: body.note ? String(body.note).slice(0, 8000) : null,
    replyTo: body.replyTo || null,
    visibility,
    createdAt: existing ? existing.created_at : (Number(body.at) || Date.now())
  });

  return json({ ok: true, id });
}

/* DELETE /api/v1/marks/:markId — unmarking is as ordinary an act as marking,
   so this really deletes rather than tombstoning. A mark nobody can see is
   not evidence of anything worth keeping. */
export async function remove(ctx, { markId }) {
  const actor = requireActor(ctx);
  const existing = await ctx.repo.getMark(markId);
  // Deleting something that is already gone is the outcome the caller wanted.
  if (!existing) return json({ ok: true, id: markId });
  if (existing.account_id !== actor.id) {
    throw ApiError.forbidden("That mark belongs to someone else.");
  }
  await must(ctx, "mark.write", { accountId: actor.id });

  await ctx.repo.deleteMark(markId);
  return json({ ok: true, id: markId });
}
