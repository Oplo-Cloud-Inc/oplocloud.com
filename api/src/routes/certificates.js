/* ==========================================================================
   Certificates, and the school's public disclosure.

   A certificate that is ISSUED gets its number, its date and, for a transfer
   certificate, the child's leaving: that happens here, once, from whatever
   screen set the status. The disclosure is what a school says about itself and
   what it publishes; the public read needs no sign-in and shows only what the
   school switched on.

   Nothing here reads anything about money. A certificate is never held back for
   an amount owed.
   ========================================================================== */

import { json, readJson, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, isStaff } from "../core/guard.js";
import * as C from "../services/certificates.js";
import * as I from "../services/india.js";
import * as R from "../services/register.js";
import { profileOf, dayIn, STATES_IN } from "../services/profile.js";

/* Called by the items routes after a certificate is written. Does nothing to one that is not issued. */
export async function settleCertificate(ctx, orgId, actor, row) {
  if (!row || row.status !== "issued") return;
  const data = JSON.parse(row.data_json || "{}");
  const org = await ctx.repo.getOrganization(orgId);
  const profile = profileOf(org), today = dayIn(profile.timezone);
  let changed = false;
  const series = C.SERIES[data.type];
  if (!data.number && series) {
    const year = R.yearSpan(today, profile.yearStartMonth).from.slice(0, 4);
    const label = `${year}-${+year + 1}`;
    data.number = C.numberText(C.prefixOf(org && org.slug), series, label, await ctx.repo.nextNumber(orgId, series, label));
    changed = true;
  }
  if (!data.issuedOn) { data.issuedOn = today; changed = true; }
  if (data.type === C.TC && row.subject_id) {
    const st = await ctx.repo.getIndiaStudent(orgId, row.subject_id);
    if (st && !st.left_on) {
      if (!data.lastClass && st.grade) data.lastClass = I.classLabel(st.grade, st.section);
      data.leftOn = data.leftOn || today;
      await ctx.repo.leaveSchool(orgId, row.subject_id, data.leftOn, data.reason || "Transfer certificate issued", actor.id);
      changed = true;
    } else if (st && st.left_on && !data.leftOn) { data.leftOn = st.left_on; changed = true; }
  }
  if (changed) await ctx.repo.updateItem(row.id, { title: row.title, status: row.status, subjectId: row.subject_id, courseId: row.course_id, startsAt: row.starts_at, endsAt: row.ends_at, dueOn: row.due_on, data });
}

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

/* GET /school/disclosure — what the school has said; PUT replaces it. The office reads it, an administrator writes it. */
export async function getDisclosure(ctx) {
  const actor = requireActor(ctx), orgId = orgOf(actor);
  if (!orgId || !isStaff(actor, orgId)) throw ApiError.forbidden("The disclosure is read by the school's office.");
  const org = await ctx.repo.getOrganization(orgId);
  return json({ disclosure: C.disclosureOf(org.disclosure_json), slug: org.slug });
}
export async function putDisclosure(ctx) {
  const actor = requireActor(ctx), orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  await must(ctx, "org.manage", { orgId });
  const clean = C.cleanDisclosure(await readJson(ctx.request), (m, f) => { throw ApiError.badRequest(m, f); });
  await ctx.repo.setDisclosure(orgId, clean);
  const org = await ctx.repo.getOrganization(orgId);
  return json({ disclosure: clean, slug: org.slug });
}

/* GET /public/schools/:slug/disclosure — no sign-in. The school's own words, the counts from its records, and, if it turned that on, the
   transfer certificates it issued that the office ticked for the website. */
export async function publicDisclosure(ctx, { slug }) {
  const org = await ctx.repo.findOrganizationBySlug(String(slug || "").toLowerCase());
  if (!org || org.kind !== "school") throw ApiError.notFound("There is no such school.");
  const profile = profileOf(org), d = C.disclosureOf(org.disclosure_json), today = dayIn(profile.timezone);
  const year = R.yearSpan(today, profile.yearStartMonth).from.slice(0, 4);
  const label = `${year}-${+year + 1}`;
  const [enrol, teachers] = await Promise.all([ctx.repo.enrolmentByGrade(org.id, label), ctx.repo.countRole(org.id, "teacher")]);
  let tcs = [];
  if (d.publishTc) {
    tcs = (await ctx.repo.issuedCertificates(org.id)).map((r) => ({ data: JSON.parse(r.data_json || "{}"), name: r.name || "" }))
      .filter((x) => x.data.type === C.TC && x.data.web === true && x.data.number)
      .map((x) => ({ number: x.data.number, name: x.name, lastClass: x.data.lastClass || null, leftOn: x.data.leftOn || null, issuedOn: x.data.issuedOn || null }));
  }
  const body = {
    school: { name: org.name, slug: org.slug, country: profile.country, state: profile.stateCode ? STATES_IN[profile.stateCode] || profile.stateCode : null, boards: profile.boards },
    general: d.general, facts: d.facts, year: label,
    enrolment: enrol.sort((a, b) => I.gradeRank(a.grade) - I.gradeRank(b.grade)).map((r) => ({ class: r.grade, sections: r.sections, students: r.students || 0 })),
    staff: { teachers }, certificates: { published: d.publishTc, transfer: tcs }, asOf: today
  };
  return json(body, { headers: { "cache-control": "public, max-age=60" } });
}
