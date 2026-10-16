/* /api/v1/district — schools that belong to one district, read together.
   A district's administrators read the counts of the schools under their
   organisation; no record of a student crosses a school's boundary. Joining a
   school to a district is a platform administrator's act. */
import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { isPlatformAdmin } from "../core/guard.js";
import { orgOf, isOffice } from "../services/who.js";
import { attendanceSettings } from "./attendance.js";

const day = (d) => d.toISOString().slice(0, 10);

/* GET /district/summary */
export async function summary(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!isOffice(actor, orgId)) throw ApiError.forbidden("A district is read by the office.");
  const schools = await ctx.repo.childOrgs(orgId);
  const to = new Date(), from = new Date(Date.now() - 29 * 86400000);
  const out = [];
  for (const s of [{ id: orgId, name: "This school", slug: "" }].concat(schools)) {
    const counts = await ctx.repo.orgCounts(s.id);
    const codes = (await attendanceSettings(ctx, s.id)).codes;
    const away = codes.filter((c) => c.kind === "absent").map((c) => c.key);
    const a = await ctx.repo.attendanceRate(s.id, day(from), day(to), away);
    out.push({ id: s.id, name: s.name, students: counts.roles.student || 0, teachers: counts.roles.teacher || 0, sections: counts.sections,
      attendanceRate: a.marks ? Math.round((1 - a.away / a.marks) * 1000) / 10 : null, registers: a.marks });
  }
  return json({ from: day(from), to: day(to), schools: out, isDistrict: schools.length > 0 });
}

/* PATCH /district/schools/:orgId { parentId } — platform administrators. */
export async function join(ctx, { orgId }) {
  const actor = requireActor(ctx);
  if (!isPlatformAdmin(actor)) throw ApiError.forbidden("Joining schools to a district is a platform administrator’s.");
  const body = await readJson(ctx.request);
  const parentId = body.parentId == null ? null : check.string(body.parentId, "parentId", { max: 100 });
  if (parentId === orgId) throw ApiError.badRequest("A school cannot be its own district.", "parentId");
  await ctx.repo.setOrgParent(orgId, parentId);
  return json({ ok: true });
}
