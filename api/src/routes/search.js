/* ==========================================================================
   /api/v1/search

   GET /search?q=riya&kinds=student,class  →  { q, class, groups: [{ kind, items: [{ id, kind, title, meta }] }] }

   The top bar's field. Students, staff, classes, subjects and circulars of the
   caller's own school, best matches first, at most five of each kind. Who may
   ask is decided in services/search.js's caller below: school staff search the
   whole school; a teacher finds the children of their own sections. A student
   or a family does not search the school's records.
   ========================================================================== */

import { json, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { isStaff } from "../core/guard.js";
import * as S from "../services/search.js";

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

export async function query(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  const staff = isStaff(actor, orgId);
  const teaches = actor.roles.some((r) => r.product === "learn" && r.role === "teacher");
  if (!staff && !teaches) throw ApiError.forbidden("Searching the school's records is for its staff.");

  const q = ctx.url.searchParams.get("q") || "";
  if (q.length > 80) throw ApiError.badRequest("q is at most 80 characters.", "q");
  const kinds = (ctx.url.searchParams.get("kinds") || "").split(",").map((k) => k.trim()).filter(Boolean);
  const bad = kinds.find((k) => !S.KINDS.includes(k));
  if (bad) throw ApiError.badRequest(`kinds are ${S.KINDS.join(", ")}.`, "kinds");
  return json(await S.search(ctx, { orgId, actorId: actor.id, staff }, q, kinds));
}
