/* ==========================================================================
   /api/v1/family, a student's guardians, and the school record beyond marks.

   A family reads. That is the whole of their permission, and it is decided in
   guard.js like every other one: a guardian may read what the school holds
   about their own child — marks, the diploma record, the sections below — and
   there is no route here, or anywhere, by which they may write any of it.
   The one thing a family writes is their own contact details.

   Linking a family to a student is an administrator's act, the same as
   creating an account, because it is the act that decides who is shown a
   child's record.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, isLearnAdmin, guardsStudent } from "../core/guard.js";
import { hashPassword } from "../lib/crypto.js";
import { RELATIONSHIPS, RECORD_SECTIONS, RECORD_LIMITS as L } from "../services/family.js";

function orgOf(actor) {
  return actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null;
}

/* "N/A" is what a school's form says when there is nothing to say, and a
   contact field stores it as nothing — a phone number that holds the letters
   N/A is a phone number somebody will one day try to dial. */
function blank(v) {
  return v == null || /^\s*(n\/?a|none|-+)?\s*$/i.test(String(v));
}

function plain(v, field, max) {
  if (v == null) return null;
  if (typeof v !== "string" && typeof v !== "number") {
    throw ApiError.badRequest(`${field} must be text.`, field);
  }
  const s = String(v).trim();
  if (s.length > max) throw ApiError.badRequest(`${field} is longer than ${max} characters.`, field);
  return s || null;
}

function contactOf(c, field = "contact") {
  c = c && typeof c === "object" ? c : {};
  let dob = null;
  if (!blank(c.dateOfBirth)) {
    const m = String(c.dateOfBirth).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    if (!d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || d.getTime() > Date.now()) {
      throw ApiError.badRequest("A date of birth is a past date, written YYYY-MM-DD.", `${field}.dateOfBirth`);
    }
    dob = m[0];
  }
  const text = (v, f, max) => (blank(v) ? null : plain(v, `${field}.${f}`, max));
  return {
    mailingAddress: text(c.mailingAddress, "mailingAddress", 400),
    cellPhone: text(c.cellPhone, "cellPhone", 40),
    altPhone: text(c.altPhone, "altPhone", 40),
    dateOfBirth: dob
  };
}

/* Phone numbers are shown to everybody who may see the family — a teacher
   who teaches the child needs to be able to call home. A mailing address and
   a date of birth are shown to the person they belong to and to
   administrators, and to nobody else. */
function shapeContact(row, full) {
  const out = {
    cellPhone: (row && row.cell_phone) || null,
    altPhone: (row && row.alt_phone) || null,
    updatedAt: row ? (row.contact_updated_at ?? row.updated_at ?? null) : null
  };
  if (full) {
    out.mailingAddress = (row && row.mailing_address) || null;
    out.dateOfBirth = (row && row.date_of_birth) || null;
  }
  return out;
}

function shapeGuardian(r, full) {
  return {
    id: r.id, name: r.name, firstName: r.first_name, initials: r.initials, hue: r.avatar_hue,
    email: r.email, relationship: r.relationship, label: r.label || null,
    primary: !!r.is_primary, linkedAt: r.linked_at, contact: shapeContact(r, full)
  };
}

function shapeWard(r) {
  return {
    id: r.id, name: r.name, firstName: r.first_name, initials: r.initials, hue: r.avatar_hue,
    email: r.email, relationship: r.relationship, label: r.label || null, primary: !!r.is_primary,
    gradeLevel: r.grade_level ?? null, program: r.program || null
  };
}

/* GET /api/v1/family — the children the signed-in person is family to.

   Asks nothing and names nobody: the answer is whoever the session resolves
   to, so there is no way to ask for somebody else's children. */
export async function mine(ctx) {
  const actor = requireActor(ctx);
  const [wards, contact] = await Promise.all([
    ctx.repo.listWards(actor.id),
    ctx.repo.getContact(actor.id)
  ]);
  return json({
    guardian: {
      id: actor.id, name: actor.name, firstName: actor.firstName, initials: actor.initials,
      hue: actor.hue, email: actor.email, contact: shapeContact(contact, true)
    },
    students: wards.map(shapeWard),
    // An administrator may open any student's family view, to see what the
    // family sees before the family does. It is a reading of the same rules,
    // not an exception to them: an administrator can already read all of it.
    canPreview: isLearnAdmin(actor)
  });
}

/* GET /api/v1/students/:accountId/guardians */
export async function guardians(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "guardian.read", { accountId });
  const rows = await ctx.repo.listGuardians(accountId);
  const admin = isLearnAdmin(actor);
  return json({ guardians: rows.map((r) => shapeGuardian(r, admin || r.id === actor.id)) });
}

/* POST /api/v1/students/:accountId/guardians

   Links a guardian to a student, creating their Oplo Account if the email
   does not hold one yet. An email that already holds an account is linked as
   it is: that person is already somebody in Oplo — perhaps a teacher here, or
   the parent of another student — and is one person with one password, so a
   password sent for them is refused rather than silently replacing theirs. */
export async function addGuardian(ctx, { accountId }) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const orgId = body.orgId || orgOf(actor);
  await must(ctx, "guardian.write", { accountId, orgId });

  const student = await ctx.repo.findAccountById(accountId);
  if (!student) throw ApiError.notFound("No such student.");

  const relationship = check.oneOf(body.relationship || "parent", "relationship", RELATIONSHIPS);
  const label = blank(body.label) ? null : plain(body.label, "label", 40);
  const contact = body.contact ? contactOf(body.contact) : null;

  let guardian;
  if (body.guardianId) {
    guardian = await ctx.repo.findAccountById(check.string(body.guardianId, "guardianId", { max: 64 }));
    if (!guardian) throw ApiError.notFound("No such account.");
  } else {
    const email = check.email(body.email);
    guardian = await ctx.repo.findAccountByEmail(email);
    if (guardian && body.password) {
      throw ApiError.conflict("An account already uses that email address. Link it without a password — " +
                              "its owner keeps the one they have.", "email");
    }
    if (!guardian) {
      const name = check.string(body.name, "name", { max: 120 });
      const pw = await hashPassword(check.password(body.password));
      const words = name.split(/\s+/);
      guardian = await ctx.repo.createAccount({
        email, hash: pw.hash, salt: pw.salt, iterations: pw.iterations,
        name, firstName: words[0], initials: words.map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        hue: body.hue || "#0f766e", title: label || "Family"
      });
    }
  }
  if (guardian.id === accountId) {
    throw ApiError.badRequest("A student cannot be their own guardian.", "guardianId");
  }

  await ctx.repo.grantRole(guardian.id, "learn", "guardian", orgId);
  if (orgId) {
    const orgs = await ctx.repo.membershipsFor(guardian.id);
    if (!orgs.some((o) => o.org_id === orgId)) await ctx.repo.addMember(orgId, guardian.id, "member");
  }
  await ctx.repo.linkGuardian({
    guardianId: guardian.id, studentId: accountId, orgId, relationship, label,
    primary: body.primary === true, createdBy: actor.id
  });
  if (contact) await ctx.repo.putContact(guardian.id, contact, actor.id);

  const rows = await ctx.repo.listGuardians(accountId);
  return json({ guardians: rows.map((r) => shapeGuardian(r, true)) }, { status: 201 });
}

/* DELETE /api/v1/students/:accountId/guardians/:guardianId

   Removes the link, not the person. Their account, and anything else they
   are in Oplo, is untouched — and from the next request they can no longer
   read this child's record. */
export async function removeGuardian(ctx, { accountId, guardianId }) {
  const actor = requireActor(ctx);
  await must(ctx, "guardian.write", { accountId, orgId: orgOf(actor) });
  if (!(await ctx.repo.guardianship(guardianId, accountId))) {
    throw ApiError.notFound("That person is not linked to this student.");
  }
  await ctx.repo.unlinkGuardian(guardianId, accountId);
  const rows = await ctx.repo.listGuardians(accountId);
  return json({ guardians: rows.map((r) => shapeGuardian(r, true)) });
}

/* PUT /api/v1/accounts/:accountId/contact — replaces the whole card, the
   way a form is submitted. The person themself, or an administrator. */
export async function putContact(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "account.write", { accountId });
  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such account.");
  const body = await readJson(ctx.request);
  const row = await ctx.repo.putContact(accountId, contactOf(body), actor.id);
  return json({ contact: shapeContact(row, true) });
}

/* GET /api/v1/accounts/:accountId/contact

   A person's card, whole, to themselves, to an administrator, and to their
   family — a parent is not a stranger to their own child's address. A teacher
   who may read the account is given the phone numbers and nothing else. */
export async function getContact(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "account.read", { accountId });
  const row = await ctx.repo.getContact(accountId);
  const full = accountId === actor.id || isLearnAdmin(actor) || (await guardsStudent(ctx, actor, accountId));
  return json({ contact: shapeContact(row, full) });
}

/* ------------------------------------------------------- The school record */

function recordOf(body) {
  const facts = body.facts == null ? [] : body.facts;
  if (!Array.isArray(facts) || facts.length > L.facts) {
    throw ApiError.badRequest(`facts must be a list of at most ${L.facts}.`, "facts");
  }
  const cleanFacts = facts.map((f, i) => {
    if (!f || typeof f !== "object") throw ApiError.badRequest(`facts[${i}] must be { label, value }.`, "facts");
    const label = plain(f.label, `facts[${i}].label`, L.label);
    if (!label) throw ApiError.badRequest(`facts[${i}] needs a label.`, "facts");
    return { label, value: plain(f.value, `facts[${i}].value`, L.value) || "" };
  });

  let rows = null;
  if (body.rows != null) {
    const cols = body.rows.columns;
    const items = body.rows.items == null ? [] : body.rows.items;
    if (!Array.isArray(cols) || !cols.length || cols.length > L.columns) {
      throw ApiError.badRequest(`rows.columns must be a list of 1 to ${L.columns} headings.`, "rows");
    }
    if (!Array.isArray(items) || items.length > L.rows) {
      throw ApiError.badRequest(`rows.items must be a list of at most ${L.rows} rows.`, "rows");
    }
    const columns = cols.map((c, i) => plain(c, `rows.columns[${i}]`, L.column) || "");
    rows = {
      columns,
      items: items.map((row, r) => {
        if (!Array.isArray(row) || row.length > columns.length) {
          throw ApiError.badRequest(`rows.items[${r}] must be a list of at most ${columns.length} cells.`, "rows");
        }
        return columns.map((_, c) => plain(row[c], `rows.items[${r}][${c}]`, L.cell) || "");
      })
    };
  }

  const out = {
    summary: plain(body.summary, "summary", L.summary),
    facts: cleanFacts,
    rows,
    notes: plain(body.notes, "notes", L.notes)
  };
  if (!out.summary && !out.facts.length && !(rows && rows.items.length) && !out.notes) {
    throw ApiError.badRequest("A record needs something in it. To take a section back to empty, clear it.",
                              "summary");
  }
  return out;
}

/* GET /api/v1/students/:accountId/records — every section the school has
   written, and nothing for the ones it has not. */
export async function records(ctx, { accountId }) {
  requireActor(ctx);
  await must(ctx, "record.read", { accountId });
  const rows = await ctx.repo.listStudentRecords(accountId);
  const sections = {};
  for (const r of rows) {
    try {
      sections[r.section] = { ...JSON.parse(r.body_json), updatedAt: r.updated_at,
                              updatedBy: r.updated_by_name || null };
    } catch { /* a torn row is left out rather than failing the whole record */ }
  }
  return json({ sections });
}

/* PUT /api/v1/students/:accountId/records/:section */
export async function putRecord(ctx, { accountId, section }) {
  const actor = requireActor(ctx);
  const key = check.oneOf(section, "section", RECORD_SECTIONS);
  await must(ctx, "record.write", { accountId, orgId: orgOf(actor) });
  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such student.");
  const body = await readJson(ctx.request, { limit: 96 * 1024 });
  const record = recordOf(body);
  await ctx.repo.putStudentRecord({ accountId, orgId: orgOf(actor), section: key, body: record, actorId: actor.id });
  return json({ section: key, record });
}

/* DELETE /api/v1/students/:accountId/records/:section */
export async function clearRecord(ctx, { accountId, section }) {
  const actor = requireActor(ctx);
  const key = check.oneOf(section, "section", RECORD_SECTIONS);
  await must(ctx, "record.write", { accountId, orgId: orgOf(actor) });
  await ctx.repo.deleteStudentRecord(accountId, key);
  return json({ ok: true, section: key });
}
