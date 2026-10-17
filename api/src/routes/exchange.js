/* ==========================================================================
   /api/v1/exchange — data in and out of the school.

     export    the school's records as rows, for a spreadsheet, a district or
               a vendor (users, sections, enrollments, attendance, grades)
     import    people and rosters from rows: a whole school's people in chunks,
               bad rows skipped and named, dry: true says what would happen
     extract   the report a school owes its district or state, with every
               problem named before it is sent
     webhooks  an address that is told when a record is made or changed,
               signed so the receiver can tell it is us

   The office's, all of it. What leaves is read with the office's authority,
   and nothing arrives that was not checked.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can } from "../core/guard.js";
import { id as newId } from "../lib/crypto.js";
import { RELATIONSHIPS } from "../services/family.js";
import { orgOf, isOffice } from "../services/who.js";

function office(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!isOffice(actor, orgId)) throw ApiError.forbidden("Data moves in and out through the office.");
  return { actor, orgId };
}

/* GET /exchange/export?set=users|sections|enrollments|attendance|grades&from=&to= */
export async function exportRows(ctx) {
  const { orgId } = office(ctx);
  const q = ctx.url.searchParams;
  const set = check.oneOf(q.get("set"), "set", ["users", "families", "sections", "enrollments", "attendance", "grades"]);
  let columns, rows;
  if (set === "users") {
    columns = ["id", "name", "email"];
    rows = (await ctx.repo.listAccounts({ orgId })).map((a) => [a.id, a.name || "", a.email]);
  } else if (set === "families") {
    columns = ["student", "studentEmail", "guardian", "relationship", "primary", "phone", "email"];
    rows = (await ctx.repo.listFamilies(orgId)).map((r) => [r.student || "", r.student_email || "", r.guardian || "", r.relationship || "", r.is_primary ? "yes" : "", r.guardian_phone || "", r.guardian_email]);
  } else if (set === "sections") {
    columns = ["id", "code", "title", "subject", "status"];
    rows = (await ctx.repo.listOrgCourses(orgId)).map((c) => [c.id, c.code, c.title, c.subject || "", c.status]);
  } else if (set === "enrollments") {
    columns = ["section", "accountId", "name", "email", "role"];
    rows = (await ctx.repo.listMemberships(orgId)).map((m) => [m.code, m.account_id, m.name || "", m.email, m.role]);
  } else if (set === "attendance") {
    const from = q.get("from"), to = q.get("to");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) throw ApiError.badRequest("from and to are dates.", "from");
    if (Date.parse(to) - Date.parse(from) > 93 * 86400000) throw ApiError.badRequest("Three months at a time.", "to");
    columns = ["day", "section", "student", "status", "note"];
    const secs = await ctx.repo.listOrgCourses(orgId);
    rows = [];
    for (const c of secs) {
      for (const r of await ctx.repo.listAttendance({ courseId: c.id, from, to })) rows.push([r.day, c.code, r.student_name || r.account_id, r.status, r.note || ""]);
      if (rows.length > 20000) break;
    }
  } else {
    columns = ["section", "student", "assignment", "score", "outOf", "status"];
    rows = [];
    for (const c of await ctx.repo.listOrgCourses(orgId)) {
      const as = new Map((await ctx.repo.listAssignments(c.id)).map((a) => [a.id, a]));
      for (const g of await ctx.repo.listGrades({ courseId: c.id, accountId: null })) {
        const a = as.get(g.assignment_id);
        rows.push([c.code, g.account_id, a ? a.title : g.assignment_id, g.score, a ? a.out_of : "", g.status || "marked"]);
      }
      if (rows.length > 20000) break;
    }
  }
  return json({ set, columns, rows });
}

const NAME = /^[^\n\r<>]{2,120}$/;
const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/* POST /exchange/import { set: "users"|"enrollments", rows: [...], dry?, offset? }

   users:       { name, email, role?, guardianEmail?, guardianName?, relationship?, primary? }
                role is student (the default), teacher, or an office role; the office
                roles are given only by someone who may grant roles at all (role.grant).
                A guardian column links a guardian account to the child.
   enrollments: { section (code), email, role?: student|teacher }

   users is a whole school's, sent in chunks of up to USERS_CHUNK rows (offset says
   where this chunk starts, so a problem is named by its row in the file). Every row
   is read; a row with a problem is skipped and reported, the rest are written, and
   dry: true writes nothing. Nobody gets a password: a new account is `invited`, like
   scripts/provision-account.sh makes it, and its owner sets one with
   scripts/set-password.sh. Someone who already has an account is matched, never
   made twice, so a file can be run again.
   enrollments is still all-or-nothing, up to 1000 rows. */
const USERS_CHUNK = 200;
const OFFICE_ROLES = ["admin", "principal", "registrar", "admissions", "counselor", "dean", "nurse", "facilities", "office", "it"];
const KIN = { father: "Father", mother: "Mother" };   // said as a family says it
// A row's columns by plain name (guardian_email, guardianEmail and "Guardian Email" are one), every one present as text.
const flat = (r) => ({ name: "", email: "", role: "", guardianemail: "", guardianname: "", relationship: "", primary: "",
  ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/[^a-z0-9]/g, ""), v == null ? "" : String(v).trim()])) });
const initialsOf = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export async function importRows(ctx) {
  const { actor, orgId } = office(ctx);
  const body = await readJson(ctx.request, { limit: 512 * 1024 });
  const set = check.oneOf(body.set, "set", ["users", "enrollments"]);
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (set === "users") return importPeople(ctx, { actor, orgId, rows, dry: body.dry === true, offset: Math.max(0, Math.floor(Number(body.offset)) || 0) });
  if (!rows.length || rows.length > 1000) throw ApiError.badRequest("rows is a list of 1 to 1000.", "rows");
  const problems = [], plan = [];
  const secs = new Map((await ctx.repo.listOrgCourses(orgId)).map((c) => [c.code, c]));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const sec = secs.get(String(r.section || "").trim()), email = String(r.email || "").trim(), role = String(r.role || "student").toLowerCase();
    if (!sec) problems.push({ row: i + 1, field: "section", message: `No section has the code “${r.section}”.` });
    const acct = EMAIL.test(email) ? await ctx.repo.findAccountByEmail(email) : null;
    if (!acct) problems.push({ row: i + 1, field: "email", message: "No account has this address. Import people first." });
    if (!["student", "teacher"].includes(role)) problems.push({ row: i + 1, field: "role", message: "Role is student or teacher." });
    plan.push({ courseId: sec && sec.id, accountId: acct && acct.id, role });
  }
  if (problems.length || body.dry === true) {
    // 200 either way: a file with problems is an answer, not a failure, and the answer is the list.
    return json({ applied: false, rows: rows.length, problems: problems.slice(0, 100), problemCount: problems.length });
  }
  for (const p of plan) await ctx.repo.enrol(p.courseId, p.accountId, p.role);
  ctx.waitUntil(deliver(ctx, orgId, "import.applied", { set, rows: rows.length, by: actor.id }));
  return json({ applied: true, rows: rows.length }, { status: 201 });
}

async function importPeople(ctx, { actor, orgId, rows, dry, offset }) {
  if (!rows.length || rows.length > USERS_CHUNK) throw ApiError.badRequest(`Send 1 to ${USERS_CHUNK} rows at a time; the console does this for a whole file.`, "rows");
  const canGrant = await can(ctx, "role.grant", { orgId });
  const problems = [], good = [];

  rows.forEach((raw, i) => {
    const r = flat(raw && typeof raw === "object" ? raw : {});
    const row = offset + i + 1, role = (r.role || "student").toLowerCase(), lower = r.email.toLowerCase();
    const before = problems.length;
    const fail = (field, message) => problems.push({ row, email: r.email, field, message });
    if (!NAME.test(r.name)) fail("name", "A name is 2 to 120 characters.");
    if (!EMAIL.test(r.email) || r.email.length > 320) fail("email", "That does not look like an email address.");
    const unknown = role !== "student" && role !== "teacher" && !OFFICE_ROLES.includes(role);
    if (unknown) fail("role", `Role is student, teacher or an office role (${OFFICE_ROLES.join(", ")}).`);
    else if (OFFICE_ROLES.includes(role) && !canGrant) fail("role", "Only an administrator can give an office role.");
    let g = null;
    if (r.guardianemail || r.guardianname || r.relationship || r.primary) {
      const gl = r.guardianemail.toLowerCase(), word = r.relationship.toLowerCase().replace(/[\s-]+/g, "_");
      g = { email: r.guardianemail, lower: gl, name: r.guardianname, rel: null, label: null, primary: null };
      if (role !== "student" && !unknown) fail("guardianEmail", "A guardian is linked to a student.");
      if (!EMAIL.test(g.email) || g.email.length > 320) fail("guardianEmail", "The guardian needs an email address.");
      else if (gl === lower) fail("guardianEmail", "A student cannot be their own guardian.");
      if (g.name && !NAME.test(g.name)) fail("guardianName", "A name is 2 to 120 characters.");
      if (word) {
        if (RELATIONSHIPS.includes(word)) g.rel = word;
        else if (KIN[word]) { g.rel = "parent"; g.label = KIN[word]; }
        else fail("relationship", `Relationship is ${RELATIONSHIPS.join(", ")}, father or mother.`);
      }
      if (/^(y|yes|true|1|primary)$/i.test(r.primary)) g.primary = 1;
      else if (/^(n|no|false|0)$/i.test(r.primary)) g.primary = 0;
      else if (r.primary) fail("primary", "Primary is yes or no.");
    }
    if (problems.length === before) good.push({ row, r, lower, role, g });
  });

  // Who already has an account, in this school or elsewhere.
  const found = new Map((await ctx.repo.peopleByEmails(orgId, good.flatMap((x) => [x.r.email, x.g && x.g.email]))).map((p) => [p.email_lower, p]));
  const plan = new Map();   // lower → the person as this file leaves them
  const person = (email, lower, name, hue, title) => {
    if (!plan.has(lower)) {
      const f = found.get(lower);
      plan.set(lower, { email, lower, name, hue, title, id: f ? f.id : newId("acc"), fresh: !f, member: !!(f && f.member),
        has: new Set(f && f.roles ? f.roles.split(",") : []), add: new Set() });
    }
    return plan.get(lower);
  };
  const links = [];
  for (const x of good) {
    // A guardian nobody has an account for needs a name to be made with.
    if (x.g && !plan.has(x.g.lower) && !found.has(x.g.lower) && !x.g.name) {
      problems.push({ row: x.row, email: x.r.email, field: "guardianName", message: "This guardian has no account yet, so a name is needed." });
      continue;
    }
    const p = person(x.r.email, x.lower, x.r.name, "#0071e3", null);
    if (!p.has.has(x.role)) p.add.add(x.role);
    if (x.g) {
      const gp = person(x.g.email, x.g.lower, x.g.name, "#0f766e", "Family");
      if (!gp.has.has("guardian")) gp.add.add("guardian");
      links.push({ student: x.lower, guardian: x.g.lower, rel: x.g.rel, label: x.g.label, primary: x.g.primary });
    }
  }

  // A link states what the row says and keeps what it leaves out; the first guardian of a child is the primary one.
  const had = new Map(), holder = new Map();
  for (const l of await ctx.repo.guardianLinksByStudentEmails(links.map((l) => l.student))) {
    had.set(l.student + "|" + l.guardian, l);
    if (l.is_primary) holder.set(l.student, l.guardian);
  }
  const was = new Map(holder);
  for (const l of links) if (l.primary === 1) holder.set(l.student, l.guardian);
  for (const l of links) if (l.primary === 0 && holder.get(l.student) === l.guardian) holder.delete(l.student);
  for (const l of links) if (l.primary == null && !had.has(l.student + "|" + l.guardian) && !holder.has(l.student)) holder.set(l.student, l.guardian);
  const done = new Map();   // one link per pair, the last row for it wins
  for (const l of links) {
    const h = had.get(l.student + "|" + l.guardian);
    done.set(l.student + "|" + l.guardian, { student: l.student, guardian: l.guardian, rel: l.rel || (h && h.relationship) || "parent",
      label: l.label || (h && h.label) || null, primary: holder.get(l.student) === l.guardian ? 1 : 0 });
  }
  const clear = [...new Set(links.map((l) => l.student))].filter((s) => holder.get(s) !== was.get(s));

  const people = [...plan.values()];
  const fresh = people.filter((p) => p.fresh);
  const given = people.filter((p) => !p.fresh).reduce((n, p) => n + p.add.size, 0);
  if (!dry) {
    await ctx.repo.importPeople(orgId, {
      fresh: fresh.map((p) => ({ id: p.id, email: p.email, lower: p.lower, name: p.name, first: p.name.split(/\s+/)[0], initials: initialsOf(p.name), hue: p.hue, title: p.title })),
      roles: people.flatMap((p) => [...p.add].map((role) => ({ lower: p.lower, role }))),
      members: people.filter((p) => !p.member).map((p) => ({ lower: p.lower, mrole: p.add.has("admin") ? "admin" : "member" })),
      links: [...done.values()], clear
    }, actor.id);
    ctx.waitUntil(deliver(ctx, orgId, "import.applied", { set: "users", rows: rows.length, invited: fresh.length, by: actor.id }));
  }
  problems.sort((a, b) => a.row - b.row);
  return json({
    set: "users", applied: !dry, rows: rows.length, offset,
    invited: fresh.length, matched: people.length - fresh.length, rolesGiven: given, guardiansLinked: done.size,
    skipped: new Set(problems.map((p) => p.row)).size, problems: problems.slice(0, 100), problemCount: problems.length,
    // Addresses, so a file sent in chunks can count each person once: a guardian met in two chunks is one person,
    // and in a check, which writes nothing, is new in both.
    invitedEmails: fresh.map((p) => p.email), matchedEmails: people.filter((p) => !p.fresh).map((p) => p.email),
    note: "Nobody has a password. Each invited person sets their own with api/scripts/set-password.sh until sign-in mail is set up."
  }, { status: dry || !(fresh.length || given || done.size) ? 200 : 201 });
}

/* GET /exchange/extract?kind=enrollment — the rows, and what is wrong with them. */
export async function extract(ctx) {
  const { orgId } = office(ctx);
  check.oneOf(ctx.url.searchParams.get("kind") || "enrollment", "kind", ["enrollment"]);
  const rows = await ctx.repo.studentExtractRows(orgId);
  const problems = [];
  const out = rows.map((r, i) => {
    const dob = r.date_of_birth || "";
    const enrolled = r.enrolled_at ? new Date(Number(r.enrolled_at)).toISOString().slice(0, 10) : "";
    if (!dob) problems.push({ row: i + 1, student: r.name, field: "dateOfBirth", message: "No date of birth on file." });
    if (r.grade_level == null) problems.push({ row: i + 1, student: r.name, field: "gradeLevel", message: "No grade level." });
    if (!enrolled) problems.push({ row: i + 1, student: r.name, field: "enrolledOn", message: "No enrollment date." });
    if (!r.mailing_address) problems.push({ row: i + 1, student: r.name, field: "address", message: "No address." });
    return [r.id, r.name || "", dob, r.grade_level ?? "", enrolled, r.program || "", r.mailing_address || ""];
  });
  return json({ kind: "enrollment", columns: ["id", "name", "dateOfBirth", "gradeLevel", "enrolledOn", "program", "address"], rows: out,
    problems, ready: problems.length === 0,
    note: "This is OEdu’s own extract. A state’s own file layout is added when its specification is."});
}

/* ------------------------------------------------------------- Webhooks */
async function sign(secret, text) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Tell every active webhook of this school. Never throws, never waits on the request. */
export async function deliver(ctx, orgId, event, payload) {
  try {
    const hooks = (await ctx.repo.listItems({ orgId, kind: "webhook", status: "active", limit: 20 }));
    for (const h of hooks) {
      let d = {};
      try { d = JSON.parse(h.data_json); } catch { d = {}; }
      const events = String(d.events || "").split(/[,\s]+/).filter(Boolean);
      if (events.length && !events.includes(event)) continue;
      if (!/^https:\/\//.test(d.url || "")) continue;
      const text = JSON.stringify({ event, at: Date.now(), data: payload });
      const headers = { "content-type": "application/json", "x-oedu-event": event };
      if (d.secret) headers["x-oedu-signature"] = await sign(d.secret, text);
      await fetch(d.url, { method: "POST", headers, body: text }).catch(() => {});
    }
  } catch { /* a webhook never fails the request that caused it */ }
}

/* POST /exchange/webhooks/test — one signed ping to every active webhook. */
export async function testHooks(ctx) {
  const { orgId } = office(ctx);
  await deliver(ctx, orgId, "ping", { hello: "from OEdu" });
  return json({ sent: true });
}
