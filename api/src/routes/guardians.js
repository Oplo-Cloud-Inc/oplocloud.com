/* ==========================================================================
   /api/v1/directory/guardians — the school's families as a list, the quick look
   at one guardian, a guardian's number shown only when asked, and adding one.

   GET  /directory/guardians?view=&q=&app=&class=&relation=&sort=&page=   the page, the total, the numbers, what the filters could narrow to
   GET  /directory/guardians/:id            one guardian: who they are linked to, how to reach them (masked)
   POST /directory/guardians/:id/phone { which }   show one number, and write down that it was shown
   POST /directory/guardians { studentIds, name?, email, relation, label?, cellPhone? }
                                            link a guardian to students, making their account if the email has none

   Who may: the office reads every family; a class teacher reads the families of
   the students of their own sections, whatever the address says, and nobody else's.
   Adding is the registrar's and the administrators'. A new guardian's account is
   invited (no password): the family sets one from the invitation. A number shown
   is written to the audit log first and given out second.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { can, must } from "../core/guard.js";
import { id as newId } from "../lib/crypto.js";
import { RELATIONSHIPS } from "../services/family.js";
import * as I from "../services/india.js";
import * as G from "../services/guardians.js";
import * as A from "../services/audit.js";
import { school } from "./register.js";
import { scopeOf } from "./directory.js";

/* The families this person may see, grouped, and the students nobody is linked to. */
async function load(ctx) {
  const S = await school(ctx);
  const sc = await scopeOf(ctx, S);
  const [links, lonely] = await Promise.all([ctx.repo.listGuardianLinks(S.orgId), ctx.repo.listStudentsWithoutGuardian(S.orgId)]);
  return { S, sc, all: G.group(links, sc.sees), lonely: lonely.map(G.lonelyRow).filter((r) => sc.sees(r.classId)) };
}

async function one(ctx, guardianId) {
  const S = await school(ctx);
  const sc = await scopeOf(ctx, S);
  const [g] = G.group(await ctx.repo.listGuardianLinks(S.orgId, guardianId), sc.sees);
  if (!g) throw ApiError.notFound("That guardian is not in this school.");
  return { S, g };
}

/* GET /directory/guardians */
export async function list(ctx) {
  const { S, all, lonely } = await load(ctx);
  return json({ ...G.cut(all, lonely, G.parse(ctx.url.searchParams)), can: { write: await can(ctx, "directory.write", { orgId: S.orgId }) } });
}

/* GET /directory/guardians/:guardianId */
export async function record(ctx, { guardianId }) {
  const { S, g } = await one(ctx, guardianId);
  const row = G.rowOf(g);
  return json({
    guardian: { ...row, students: g.students.map((s) => ({ id: s.id, name: s.name, classLabel: s.classLabel, relation: s.relation, primary: s.primary, admissionNo: s.admissionNo })),
      phones: [["cell", g.cell], ["alt", g.alt]].filter(([, v]) => v).map(([which, v]) => ({ which, phone: I.maskValue(v, 6) })) },
    can: { write: await can(ctx, "directory.write", { orgId: S.orgId }) }
  });
}

/* POST /directory/guardians/:guardianId/phone { which: cell|alt } */
export async function phone(ctx, { guardianId }) {
  const { S, g } = await one(ctx, guardianId);
  const b = await readJson(ctx.request);
  const which = check.oneOf(b.which, "which", ["cell", "alt"]);
  const number = which === "cell" ? g.cell : g.alt;
  if (!number) throw ApiError.notFound("No number is on file for them.");
  // fail closed: if the row cannot be written the number is not given out
  await A.record(ctx, S.orgId, S.actor, { module: "students", action: "students.guardian.phone_revealed", verb: "revealed", recordKind: "guardian", recordId: g.id,
    recordLabel: g.name, field: which === "cell" ? "cellPhone" : "altPhone", detail: { which } });
  return json({ phone: number });
}

/* POST /directory/guardians */
export async function create(ctx) {
  const S = await school(ctx);
  await must(ctx, "directory.write", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  const fail = (message, field) => { throw ApiError.badRequest(message, field); };
  const ids = Array.isArray(b.studentIds) ? [...new Set(b.studentIds.map((x) => String(x)))] : [];
  if (!ids.length) fail("Choose the students first.", "studentIds");
  if (ids.length > 20) fail("At most 20 students at a time.", "studentIds");
  const email = check.email(b.email, "email"), lower = email.toLowerCase();
  const rel = check.oneOf(b.relation || "parent", "relation", RELATIONSHIPS);
  const label = b.label ? check.string(b.label, "label", { max: 40 }) : null;
  const cell = b.cellPhone ? I.phoneOf(b.cellPhone, (m) => fail(m, "cellPhone")) : null;

  const rows = (await ctx.repo.getIndiaStudents(S.orgId, ids)).map(I.shapeStudent);
  if (rows.length !== ids.length) throw ApiError.notFound("A student you chose is not in this school.");
  const existing = await ctx.repo.findAccountByEmail(email);
  if (existing && rows.some((s) => s.id === existing.id)) fail("A student cannot be their own guardian.", "email");
  let fresh = null, name = existing ? existing.name || existing.email : null;
  if (!existing) {
    name = check.string(b.name, "name", { min: 2, max: 120 });
    if (/[<>\n\r]/.test(name)) fail("A name has letters, spaces and dots.", "name");
    fresh = { id: newId("acc"), email, lower, name, first: name.split(/\s+/)[0], initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(), hue: "#0f766e", title: label || "Family" };
  }
  const guardianId = existing ? existing.id : fresh.id, relation = label || rel.replace(/_/g, " ");
  const events = rows.map((s) => ({ module: "students", action: "students.guardian.linked", verb: "created", recordKind: "student", recordId: s.id,
    recordLabel: `${s.name}${s.classLabel ? " · " + s.classLabel : ""}`, field: "guardian", after: `${name} (${relation})` }));
  if (fresh) events.push({ module: "students", action: "students.guardian.created", verb: "created", recordKind: "guardian", recordId: guardianId, recordLabel: name, detail: { students: rows.length } });
  await ctx.repo.linkGuardianToStudents(S.orgId, { fresh, guardianId, lower, students: rows.map((s) => ({ lower: String(s.email).toLowerCase() })), rel, label, cell, audit: A.rows(S.orgId, S.actor, events) }, S.actor.id);
  const [g] = G.group(await ctx.repo.listGuardianLinks(S.orgId, guardianId));
  return json({ guardian: G.rowOf(g), created: !!fresh, note: fresh ? "Nobody has a password yet. The family sets one from the invitation." : null }, { status: 201 });
}
