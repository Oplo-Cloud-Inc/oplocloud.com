/* ==========================================================================
   /api/v1/exchange — data in and out of the school.

     export    the school's records as rows, for a spreadsheet, a district or
               a vendor (users, sections, enrollments, attendance, grades)
     import    people and rosters from rows, checked in full before a single
               one is written (dry: true says what would happen)
     extract   the report a school owes its district or state, with every
               problem named before it is sent
     webhooks  an address that is told when a record is made or changed,
               signed so the receiver can tell it is us

   The office's, all of it. What leaves is read with the office's authority,
   and nothing arrives that was not checked.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { hashPassword, randomToken } from "../lib/crypto.js";
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

/* POST /exchange/import { set: "users"|"enrollments", rows: [...], dry? }
   users:       { name, email, role: student|teacher }
   enrollments: { section (code), email, role?: student|teacher }
   Everything is checked first; any problem and nothing is written. A new
   account gets a random password that is returned once, to be handed out
   — ponytail: replace with invitations when email has a provider. */
export async function importRows(ctx) {
  const { actor, orgId } = office(ctx);
  const body = await readJson(ctx.request, { limit: 512 * 1024 });
  const set = check.oneOf(body.set, "set", ["users", "enrollments"]);
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length || rows.length > 1000) throw ApiError.badRequest("rows is a list of 1 to 1000.", "rows");
  const problems = [], plan = [];
  const seen = new Set();
  if (set === "users") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const name = String(r.name || "").trim(), email = String(r.email || "").trim(), role = String(r.role || "student").toLowerCase();
      if (!NAME.test(name)) problems.push({ row: i + 1, field: "name", message: "A name is 2 to 120 characters." });
      if (!EMAIL.test(email)) problems.push({ row: i + 1, field: "email", message: "That does not look like an email address." });
      if (!["student", "teacher"].includes(role)) problems.push({ row: i + 1, field: "role", message: "Role is student or teacher." });
      if (seen.has(email.toLowerCase())) problems.push({ row: i + 1, field: "email", message: "This address is in the file twice." });
      seen.add(email.toLowerCase());
      if (EMAIL.test(email) && await ctx.repo.findAccountByEmail(email)) problems.push({ row: i + 1, field: "email", message: "An account already uses this address." });
      plan.push({ name, email, role });
    }
  } else {
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
  }
  if (problems.length || body.dry === true) {
    // 200 either way: a file with problems is an answer, not a failure, and the answer is the list.
    return json({ applied: false, rows: rows.length, problems: problems.slice(0, 100), problemCount: problems.length });
  }
  const credentials = [];
  for (const p of plan) {
    if (set === "users") {
      const password = randomToken().slice(0, 14) + "-9Q";
      const pw = await hashPassword(password);
      const words = p.name.split(/\s+/);
      const a = await ctx.repo.createAccount({ email: p.email, hash: pw.hash, salt: pw.salt, iterations: pw.iterations, name: p.name, firstName: words[0],
        initials: words.map((w) => w[0]).join("").slice(0, 2).toUpperCase(), hue: "#0071e3", title: null });
      await ctx.repo.grantRole(a.id, "learn", p.role, orgId);
      await ctx.repo.addMember(orgId, a.id, "member");
      credentials.push({ name: p.name, email: p.email, password });
    } else {
      await ctx.repo.enrol(p.courseId, p.accountId, p.role);
    }
  }
  ctx.waitUntil(deliver(ctx, orgId, "import.applied", { set, rows: rows.length, by: actor.id }));
  return json({ applied: true, rows: rows.length, credentials: set === "users" ? credentials : undefined }, { status: 201 });
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
