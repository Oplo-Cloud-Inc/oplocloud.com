/* ==========================================================================
   /api/v1/india/*  and  /api/v1/students/:accountId/india

   Classes, and what the office keeps on a child that a board, the state and
   the law ask for. All of it is read by the office (administrator, principal,
   registrar) and written by the administrator and registrar; the rules are in
   guard.js and the arithmetic in services/india.js.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import * as I from "../services/india.js";

function orgOf(ctx) {
  const actor = requireActor(ctx);
  const orgId = ctx.url.searchParams.get("orgId") || (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  return orgId;
}
const yearOf = (ctx) => {
  const y = ctx.url.searchParams.get("year");
  if (y && !I.isYear(y)) throw ApiError.badRequest("A school year is written 2026-2027.", "year");
  return y || I.yearOf(I.todayIST());
};
const throwing = (message, field) => { throw ApiError.badRequest(message, field); };

function shapeClass(c) {
  return { id: c.id, year: c.school_year, grade: c.grade, section: c.section, label: I.classLabel(c.grade, c.section),
    programme: c.programme || null, stream: c.stream || null, room: c.room || null, capacity: c.capacity ?? null,
    classTeacher: c.class_teacher_id ? { id: c.class_teacher_id, name: c.teacher_name || "" } : null, strength: c.strength ?? 0 };
}

/* A duplicate number is the office's most likely mistake, so say which one. */
function conflict(e) {
  const m = String((e && e.message) || "");
  if (!/UNIQUE constraint failed/i.test(m)) return null;
  const which = /admission_no/.test(m) ? ["admissionNo", "Another student already has that admission number."]
    : /apaar/.test(m) ? ["apaar", "Another student already has that APAAR ID."]
    : /\.pen/.test(m) ? ["pen", "Another student already has that PEN."] : [null, "That clashes with another student's record."];
  return ApiError.conflict(which[1], which[0]);
}

/* ------------------------------------------------------------------ Classes */

export async function classes(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  const year = yearOf(ctx);
  const rows = (await ctx.repo.listIndiaClasses(orgId, year)).sort(I.byClass);
  return json({ year, classes: rows.map(shapeClass) });
}

/* PUT /india/classes { year?, grade, section, programme?, stream?, room?, capacity?, classTeacherId? }
   What is named replaces what is there; what is left out stays. */
export async function putClass(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.write", { orgId });
  const b = await readJson(ctx.request);
  const year = b.year ? (I.isYear(b.year) ? b.year : throwing("A school year is written 2026-2027.", "year")) : yearOf(ctx);
  const grade = I.gradeOf(check.string(b.grade, "grade", { max: 20 }));
  const section = I.sectionOf(check.string(b.section, "section", { max: 3 }));
  const was = (await ctx.repo.findIndiaClass(orgId, year, grade, section)) || {};
  const pick = (k, col, f) => (b[k] === undefined ? was[col] ?? null : (b[k] === null || b[k] === "" ? null : f(b[k])));
  let teacher = was.class_teacher_id ?? null;
  if (b.classTeacherId !== undefined) {
    teacher = b.classTeacherId || null;
    if (teacher && !(await ctx.repo.isOrgMember(orgId, teacher))) throw ApiError.badRequest("That teacher is not part of this school.", "classTeacherId");
  }
  const row = await ctx.repo.upsertIndiaClass(orgId, year, {
    grade, section,
    programme: pick("programme", "programme", (v) => check.string(v, "programme", { max: 80 })),
    stream: pick("stream", "stream", (v) => check.string(v, "stream", { max: 80 })),
    room: pick("room", "room", (v) => check.string(v, "room", { max: 40 })),
    capacity: pick("capacity", "capacity", (v) => check.number(v, "capacity", { min: 1, max: 200 })),
    classTeacherId: teacher
  });
  const all = await ctx.repo.listIndiaClasses(orgId, year);
  return json({ class: shapeClass(all.find((c) => c.id === row.id) || row) }, { status: 201 });
}

/* ----------------------------------------------------------------- Students */

export async function students(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  const rows = await ctx.repo.listIndiaStudents(orgId, ctx.url.searchParams.get("classId"));
  const list = rows.map(I.shapeStudent).sort((a, b) => I.gradeRank(a.grade) - I.gradeRank(b.grade) || String(a.section).localeCompare(String(b.section)) || (a.rollNo || 999) - (b.rollNo || 999) || a.name.localeCompare(b.name));
  return json({ students: list.map((s) => ({ ...s, problems: I.problemsOf(s) })) });
}

async function inSchool(ctx, orgId, accountId) {
  if (!(await ctx.repo.isOrgMember(orgId, accountId))) throw ApiError.notFound("That person is not part of this school.");
  return ctx.repo.findAccountById(accountId);
}

export async function getStudent(ctx, { accountId }) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  const acc = await inSchool(ctx, orgId, accountId);
  const row = await ctx.repo.getIndiaStudent(orgId, accountId);
  const s = I.shapeStudent(row || { account_id: accountId, name: acc.name, email: acc.email });
  return json({ student: s, saved: !!row, problems: I.problemsOf(s) });
}

/* PUT /students/:id/india { classId?, dob?, address?, ...fields }
   Fields named are changed; fields left out are kept; a blank clears. */
export async function putStudent(ctx, { accountId }) {
  const orgId = orgOf(ctx);
  const actor = requireActor(ctx);
  await must(ctx, "india.write", { orgId });
  const acc = await inSchool(ctx, orgId, accountId);
  const b = await readJson(ctx.request);
  const fields = I.cleanStudent(b, throwing);
  let classId = undefined;
  if (b.classId !== undefined) {
    classId = b.classId || null;
    if (classId) {
      const all = await ctx.repo.listIndiaClasses(orgId, yearOf(ctx));
      if (!all.some((c) => c.id === classId)) throw ApiError.badRequest("That class is not in this school year. Make it under Classes first.", "classId");
    }
  }
  let dob, address;
  if (b.dob !== undefined) { dob = b.dob ? I.dayOf(b.dob) : null; if (b.dob && !dob) throw ApiError.badRequest("A date of birth is written DD/MM/YYYY or YYYY-MM-DD.", "dob"); if (dob && dob > I.todayIST()) throw ApiError.badRequest("A date of birth is a past date.", "dob"); }
  if (b.address !== undefined) address = b.address ? check.string(b.address, "address", { max: 400 }) : null;

  const was = await ctx.repo.getIndiaStudent(orgId, accountId);
  const merged = { ...(was ? I.shapeStudent(was) : {}), ...fields, ...(classId !== undefined ? { classId } : {}) };
  try {
    await ctx.repo.putIndiaStudents(orgId, [{ accountId, row: I.toRow(merged), contact: { dateOfBirth: dob || null, mailingAddress: address || null } }], actor.id);
  } catch (e) { throw conflict(e) || e; }
  const row = await ctx.repo.getIndiaStudent(orgId, accountId);
  const s = I.shapeStudent(row || { account_id: accountId, name: acc.name, email: acc.email });
  return json({ student: s, saved: true, problems: I.problemsOf(s) });
}

/* --------------------------------------------------------------- Compliance */

async function everyone(ctx, orgId) {
  return (await ctx.repo.listIndiaStudents(orgId, null)).map(I.shapeStudent);
}

export async function compliance(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  const list = await everyone(ctx, orgId);
  const summary = I.summaryOf(list);
  summary.classes.sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
  const withProblems = list.map((s) => ({ s, p: I.problemsOf(s) })).filter((x) => x.p.length);
  withProblems.sort((a, b) => Number(b.p.some((x) => x.level === "blocks")) - Number(a.p.some((x) => x.level === "blocks")) || String(a.s.classLabel).localeCompare(String(b.s.classLabel)));
  const total = await ctx.repo.countOrgStudents(orgId);
  return json({
    year: yearOf(ctx), summary, unloaded: Math.max(0, total - list.length), problemStudents: withProblems.length,
    problems: withProblems.slice(0, 500).map(({ s, p }) => ({ id: s.id, name: s.name, classLabel: s.classLabel, items: p }))
  });
}

/* GET /india/export/:kind → { title, file, columns, rows }; the console makes the file. */
export async function exportKind(ctx, { kind }) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  if (!I.EXPORTS[kind]) throw ApiError.notFound("There is no export called that.");
  const list = (await everyone(ctx, orgId)).sort((a, b) => I.gradeRank(a.grade) - I.gradeRank(b.grade) || String(a.section).localeCompare(String(b.section)) || (a.rollNo || 999) - (b.rollNo || 999));
  return json(I.exportRows(kind, list));
}

/* ------------------------------------------------------------------- Import
   POST /india/import { check?: true, rows: [{ email, class: "X-C", programme, stream, room, capacity,
                         classTeacherEmail, dob, address, consent, ...fields }] }
   Rows are matched to people the school already has, by email; nobody is
   created here. With `check`, every row is read and answered for and nothing
   is written. A class a row names is made if it is not there. */

const IMPORT_MAX = 200;

export async function importRows(ctx) {
  const orgId = orgOf(ctx);
  const actor = requireActor(ctx);
  await must(ctx, "india.write", { orgId });
  const b = await readJson(ctx.request, { limit: 1024 * 1024 });
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) throw ApiError.badRequest("There are no rows to load.", "rows");
  if (rows.length > IMPORT_MAX) throw ApiError.badRequest(`Send at most ${IMPORT_MAX} rows at a time.`, "rows");
  const dry = b.check === true;
  const year = yearOf(ctx);

  const people = new Map((await ctx.repo.accountsByEmails(orgId, rows.flatMap((r) => [r && r.email, r && r.classTeacherEmail]))).map((p) => [p.email_lower, p.id]));
  const errors = [], unmatched = [], items = [];
  const existing = new Map((await ctx.repo.getIndiaStudents(orgId, [...new Set(rows.map((r) => people.get(String((r && r.email) || "").trim().toLowerCase())).filter(Boolean))])).map((x) => [x.account_id, x]));
  const classCache = new Map();   // "X-C" → class row (or null)
  const teachersMissing = new Set();

  async function classFor(r, i, email) {
    if (r.class == null || String(r.class).trim() === "") return undefined;
    const pc = I.parseClass(r.class);
    if (!pc) { errors.push({ row: i + 1, email, field: "class", message: `"${r.class}" is not a class like X-C.` }); return undefined; }
    const key = I.classLabel(pc.grade, pc.section);
    if (!classCache.has(key)) {
      const was = (await ctx.repo.findIndiaClass(orgId, year, pc.grade, pc.section)) || null;
      classCache.set(key, { was, pc, row: was, made: false });
    }
    const c = classCache.get(key);
    const want = {
      programme: r.programme ? String(r.programme).trim().slice(0, 80) : null, stream: r.stream ? String(r.stream).trim().slice(0, 80) : null,
      room: r.room ? String(r.room).trim().slice(0, 40) : null, capacity: Number(r.capacity) > 0 ? Math.min(200, Math.floor(Number(r.capacity))) : null,
      classTeacherId: null
    };
    if (r.classTeacherEmail) {
      const tid = people.get(String(r.classTeacherEmail).trim().toLowerCase());
      if (tid) want.classTeacherId = tid; else teachersMissing.add(String(r.classTeacherEmail).trim().toLowerCase());
    }
    // What the row names fills what the class lacks; it never blanks what is there.
    const have = c.row || {};
    const next = { grade: c.pc.grade, section: c.pc.section, programme: have.programme ?? want.programme, stream: have.stream ?? want.stream,
      room: have.room ?? want.room, capacity: have.capacity ?? want.capacity, classTeacherId: have.class_teacher_id ?? want.classTeacherId };
    const changed = !c.row || next.programme !== have.programme || next.stream !== have.stream || next.room !== have.room ||
      next.capacity !== have.capacity || next.classTeacherId !== have.class_teacher_id;
    if (changed && !dry) { c.row = await ctx.repo.upsertIndiaClass(orgId, year, next); c.made = !c.was; }
    else if (!c.row) { c.row = { id: "(new)", grade: c.pc.grade, section: c.pc.section }; c.made = true; }
    return c.row.id;
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] && typeof rows[i] === "object" ? rows[i] : {};
    const email = String(r.email || "").trim().toLowerCase();
    if (!email) { errors.push({ row: i + 1, email: "", field: "email", message: "No email to match this row to a person." }); continue; }
    const accountId = people.get(email);
    if (!accountId) { unmatched.push(email); continue; }
    const before = errors.length;
    const fail = (message, field) => { errors.push({ row: i + 1, email, field: field || null, message }); };
    const src = { ...r };
    if (r.consent != null && String(r.consent).trim() !== "") Object.assign(src, I.consentOf(r.consent));
    const fields = I.cleanStudent(src, fail);
    let dob = null, address = null;
    if (r.dob != null && String(r.dob).trim() !== "") { dob = I.dayOf(r.dob); if (!dob) fail("Date of birth: a date, written DD/MM/YYYY or YYYY-MM-DD.", "dob"); else if (dob > I.todayIST()) { fail("Date of birth: a past date.", "dob"); dob = null; } }
    if (r.address != null && String(r.address).trim() !== "") address = String(r.address).trim().slice(0, 400);
    const classId = await classFor(r, i, email);
    if (errors.length > before) continue;
    const was = existing.get(accountId);
    const merged = { ...(was ? I.shapeStudent(was) : {}), ...fields, ...(classId ? { classId } : {}) };
    items.push({ i, email, accountId, row: I.toRow(merged), contact: { dateOfBirth: dob, mailingAddress: address } });
  }

  let written = 0;
  if (!dry && items.length) {
    try { await ctx.repo.putIndiaStudents(orgId, items, actor.id); written = items.length; }
    catch (e) {
      // One duplicate number stops a whole batch; find which row it was.
      for (const it of items) {
        try { await ctx.repo.putIndiaStudents(orgId, [it], actor.id); written++; }
        catch (e2) { const c = conflict(e2); errors.push({ row: it.i + 1, email: it.email, field: c ? c.field || null : null, message: c ? c.message : "Could not be saved." }); }
      }
    }
  }
  const made = [...classCache.values()].filter((c) => c.made).length;
  return json({
    checked: dry, rows: rows.length, matched: rows.length - unmatched.length, ready: items.length, written, classesMade: made,
    unmatched: [...new Set(unmatched)].slice(0, 50), unmatchedCount: unmatched.length, errors: errors.slice(0, 100), errorCount: errors.length,
    teachersNotFound: [...teachersMissing].slice(0, 20)
  });
}
