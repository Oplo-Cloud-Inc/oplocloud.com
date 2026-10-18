/* ==========================================================================
   /api/v1/school/profile

   Where a school is and what it follows, said once. Anyone in the school reads
   it (every screen needs it to speak the right language); only an
   administrator changes it. The rules are in services/profile.js.
   ========================================================================== */

import { json, readJson, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import * as P from "../services/profile.js";

function orgOf(ctx) {
  const actor = requireActor(ctx);
  const orgId = ctx.url.searchParams.get("orgId") || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  if (!(actor.orgs || []).some((o) => o.org_id === orgId) && !(actor.roles || []).some((r) => r.product === "platform" && r.role === "admin")) {
    throw ApiError.forbidden("That is not your school.");
  }
  return orgId;
}

const OPTIONS = {
  regions: Object.entries(P.REGIONS).map(([code, r]) => ({ code, name: r.name })),
  boards: P.BOARDS, languages: P.LANGUAGES,
  states: Object.entries(P.STATES_IN).map(([code, name]) => ({ code, name }))
};

export async function getProfile(ctx) {
  const orgId = orgOf(ctx);
  const org = await ctx.repo.getOrganization(orgId);
  return json({ profile: P.profileOf(org), options: OPTIONS });
}

/* PUT /school/profile { region?, boards?, stateCode?, languages?, timezone?, locale?, yearStartMonth? }
   What is named is changed; what is left out stays. Null clears a column back
   to what the country says. */
export async function putProfile(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "org.manage", { orgId });
  const body = await readJson(ctx.request);
  const clean = P.cleanProfile(body, (m, f) => { throw ApiError.badRequest(m, f); });
  const org = await ctx.repo.setOrgProfile(orgId, clean, ctx.actor.id);
  return json({ profile: P.profileOf(org), options: OPTIONS });
}
