/* ==========================================================================
   /api/v1/audit — the log of what was changed, by whom, and when.

   GET /audit?record=&module=&action=&actor=&verb=&from=&to=&q=&page=&size=

   Newest first, fifty to a page. `from` and `to` are days (YYYY-MM-DD, school
   time) and the span is [from, to + 1 day). Read by the school's administrators
   and principal; the rows are written by services/audit.js, never by this file.
   ========================================================================== */

import { json, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
// a school day in India begins five and a half hours before midnight UTC
const IST = 330 * 60000;
const startOf = (ymd) => Date.parse(ymd + "T00:00:00Z") - IST;

export async function list(ctx) {
  const actor = requireActor(ctx), orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  await must(ctx, "audit.read", { orgId });
  const q = ctx.url.searchParams;
  const day = (k) => { const v = q.get(k); if (!v) return null; if (!DAY.test(v) || Number.isNaN(Date.parse(v))) throw ApiError.badRequest(`${k} is a day like 2026-10-26.`, k); return v; };
  const from = day("from"), to = day("to");
  const size = Math.min(Math.max(parseInt(q.get("size"), 10) || 50, 1), 100), page = Math.max(parseInt(q.get("page"), 10) || 1, 1);
  const r = await ctx.repo.listAudit(orgId, {
    record: q.get("record"), module: q.get("module"), action: q.get("action"), actor: q.get("actor"), verb: q.get("verb"), q: (q.get("q") || "").slice(0, 80),
    from: from ? startOf(from) : null, to: to ? startOf(to) + 86400000 : null, limit: size, offset: (page - 1) * size
  });
  return json({
    total: r.total, page, size,
    events: r.rows.map((e) => ({ id: e.id, at: e.at, actor: { id: e.actor_id, name: e.actor_name }, module: e.module, action: e.action, verb: e.verb,
      record: e.record_id || e.record_label ? { kind: e.record_kind, id: e.record_id, label: e.record_label } : null,
      field: e.field, before: e.before, after: e.after, detail: JSON.parse(e.detail_json || "{}"), request: e.request }))
  });
}
