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
import * as A from "../services/audit.js";

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
const CLASH = { admissionNo: "Another student already has that admission number.", rollNo: "Another child in that section already has that roll number.",
  apaar: "Another student already has that APAAR ID.", pen: "Another student already has that PEN." };
export const clash = (field) => ApiError.conflict(CLASH[field] || "That clashes with another student's record.", field || undefined);
export function conflict(e) {
  const m = String((e && e.message) || "");
  if (!/UNIQUE constraint failed/i.test(m)) return null;
  return clash(/admission_no/.test(m) ? "admissionNo" : /roll_no/.test(m) ? "rollNo" : /apaar/.test(m) ? "apaar" : /\.pen/.test(m) ? "pen" : null);
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
  let classId = undefined, cls = null;
  if (b.classId !== undefined) {
    classId = b.classId || null;
    if (classId) {
      cls = (await ctx.repo.listIndiaClasses(orgId, yearOf(ctx))).find((c) => c.id === classId);
      if (!cls) throw ApiError.badRequest("That class is not in this school year. Make it under Classes first.", "classId");
    }
  }
  let dob, address;
  if (b.dob !== undefined) { dob = b.dob ? I.dayOf(b.dob) : null; if (b.dob && !dob) throw ApiError.badRequest("A date of birth is written DD/MM/YYYY or YYYY-MM-DD.", "dob"); if (dob && dob > I.todayIST()) throw ApiError.badRequest("A date of birth is a past date.", "dob"); }
  if (b.address !== undefined) address = b.address ? check.string(b.address, "address", { max: 400 }) : null;

  const was = await ctx.repo.getIndiaStudent(orgId, accountId);
  const merged = { ...(was ? I.shapeStudent(was) : {}), ...fields, ...(classId !== undefined ? { classId } : {}) };
  // A new section is a new list: the old section's number is not carried into it unless the office typed one.
  if (classId !== undefined && classId !== (was ? was.class_id || null : null) && b.rollNo === undefined) merged.rollNo = null;
  const next = I.toRow(merged);
  // What the row will say once written (the old row with the new columns over it): the audit rows are made from it now and
  // travel in the same batch as the change, so the record never changes without its row (E2). A blank date or address keeps what is there.
  const after = I.shapeStudent({ ...(was || { account_id: accountId, name: acc.name, email: acc.email }), ...next,
    date_of_birth: dob || (was && was.date_of_birth) || null, mailing_address: address || (was && was.mailing_address) || null,
    ...(classId === undefined ? {} : { grade: cls ? cls.grade : null, section: cls ? cls.section : null, programme: cls ? cls.programme : null, stream: cls ? cls.stream : null }) });
  const audit = A.rows(orgId, actor, A.changes(was ? I.shapeStudent(was) : {}, after, I.FIELDS.map((f) => f[0]).concat(["classId", "dob", "address"]))
    .map((c) => ({ module: "students", action: "students.record.changed", verb: "changed", recordKind: "student", recordId: accountId, recordLabel: `${after.name}${after.classLabel ? " · " + after.classLabel : ""}`, ...c })));
  try {
    await ctx.repo.putIndiaStudents(orgId, [{ accountId, row: next, contact: { dateOfBirth: dob || null, mailingAddress: address || null }, audit }], actor.id, I.todayIST());
  } catch (e) { throw conflict(e) || e; }
  const row = await ctx.repo.getIndiaStudent(orgId, accountId);
  const s = I.shapeStudent(row || { account_id: accountId, name: acc.name, email: acc.email });
  return json({ student: s, saved: true, problems: I.problemsOf(s) });
}

/* --------------------------------------------------------------- The section
   The section is the roster: who sits in it, their roll numbers, where they go
   next year, and who has left. */

async function classOf(ctx, orgId, classId) {
  const c = await ctx.repo.getIndiaClass(orgId, classId);
  if (!c) throw ApiError.notFound("That class is not in this school.");
  return c;
}
const rosterOf = async (ctx, orgId, classId) => (await ctx.repo.listIndiaStudents(orgId, classId)).map(I.shapeStudent);

/* GET /india/unplaced — students the school has who sit in no section. */
export async function unplaced(ctx) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  return json({ students: (await ctx.repo.unplacedStudents(orgId)).map((r) => ({ id: r.id, name: r.name || r.email, email: r.email })) });
}

/* POST /india/classes/:id/students { studentIds: [...] } — seat children in a section.
   They take the next free roll numbers only if the section is already numbered. */
export async function seat(ctx, { classId }) {
  const orgId = orgOf(ctx), actor = requireActor(ctx);
  await must(ctx, "india.write", { orgId });
  const c = await classOf(ctx, orgId, classId);
  const b = await readJson(ctx.request);
  const ids = [...new Set(Array.isArray(b.studentIds) ? b.studentIds : [])];
  if (!ids.length) throw ApiError.badRequest("Choose the children to seat.", "studentIds");
  if (ids.length > 200) throw ApiError.badRequest("Seat at most 200 children at a time.", "studentIds");
  for (const id of ids) if (!(await ctx.repo.isOrgMember(orgId, id))) throw ApiError.badRequest("Someone chosen is not part of this school.", "studentIds");
  const now = await rosterOf(ctx, orgId, classId);
  const numbered = now.some((s) => s.rollNo);
  let next = now.reduce((m, s) => Math.max(m, s.rollNo || 0), 0);
  const moves = ids.filter((id) => !now.some((s) => s.id === id)).map((id) => ({ accountId: id, classId: c.id, rollNo: numbered ? ++next : null }));
  await ctx.repo.seatStudents(orgId, moves, actor.id, I.todayIST());
  return json({ seated: moves.length, students: (await rosterOf(ctx, orgId, classId)).length });
}

/* POST /india/classes/:id/rolls { order: "name" | "admission" | "keep" } — number the section 1..n. */
export async function numberRolls(ctx, { classId }) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.write", { orgId });
  await classOf(ctx, orgId, classId);
  const b = await readJson(ctx.request);
  const order = b.order === undefined ? "name" : check.oneOf(b.order, "order", ["name", "admission", "keep"]);
  const rolls = I.rollOrder(await rosterOf(ctx, orgId, classId), order);
  await ctx.repo.numberRolls(classId, rolls);
  return json({ numbered: rolls.length, order });
}

/* POST /india/classes/:id/promote { toClassId, rolls?: "name" | "none", studentIds? }
   The year turns: the section's children (or those named) move to another
   section. Their old seat is closed, so last year's X-C is still known. */
export async function promote(ctx, { classId }) {
  const orgId = orgOf(ctx), actor = requireActor(ctx);
  await must(ctx, "india.write", { orgId });
  const from = await classOf(ctx, orgId, classId);
  const b = await readJson(ctx.request);
  const to = await classOf(ctx, orgId, check.string(b.toClassId, "toClassId", { max: 80 }));
  if (to.id === from.id) throw ApiError.badRequest("Choose a different section to move them to.", "toClassId");
  if (to.school_year === from.school_year) throw ApiError.badRequest("Promotion moves a section into another school year's. Make that year's section first.", "toClassId");
  const rolls = b.rolls === undefined ? "name" : check.oneOf(b.rolls, "rolls", ["name", "none"]);
  const here = await rosterOf(ctx, orgId, classId);
  const only = Array.isArray(b.studentIds) ? new Set(b.studentIds) : null;
  const movers = here.filter((s) => !only || only.has(s.id));
  if (!movers.length) throw ApiError.badRequest("There is nobody to move.", "studentIds");
  const already = await rosterOf(ctx, orgId, to.id);
  const order = rolls === "name" ? I.rollOrder(movers.concat(already), "name") : null;
  const rollOf = new Map((order || []).map((r) => [r.id, r.rollNo]));
  await ctx.repo.seatStudents(orgId, movers.map((s) => ({ accountId: s.id, classId: to.id, rollNo: rollOf.get(s.id) ?? null })), actor.id, I.todayIST());
  if (order) await ctx.repo.numberRolls(to.id, order);
  return json({ moved: movers.length, to: I.classLabel(to.grade, to.section) });
}

/* POST /students/:id/leave { on?, reason? } — the child leaves the school; their record stays. */
export async function leave(ctx, { accountId }) {
  const orgId = orgOf(ctx), actor = requireActor(ctx);
  await must(ctx, "india.write", { orgId });
  await inSchool(ctx, orgId, accountId);
  const b = await readJson(ctx.request);
  const day = b.on ? (I.dayOf(b.on) || throwing("The day they left is written DD/MM/YYYY or YYYY-MM-DD.", "on")) : I.todayIST();
  await ctx.repo.leaveSchool(orgId, accountId, day, b.reason ? check.string(b.reason, "reason", { max: 200 }) : null, actor.id);
  return json({ left: true, on: day });
}

/* GET /students/:id/classes — every section the child has sat in. */
export async function classHistory(ctx, { accountId }) {
  const orgId = orgOf(ctx);
  await must(ctx, "india.read", { orgId });
  await inSchool(ctx, orgId, accountId);
  const rows = await ctx.repo.classHistory(accountId);
  return json({ classes: rows.map((r) => ({ id: r.class_id, year: r.school_year, label: I.classLabel(r.grade, r.section), rollNo: r.roll_no ?? null, joinedOn: r.joined_on, leftOn: r.left_on || null })) });
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
    try { await ctx.repo.putIndiaStudents(orgId, items, actor.id, I.todayIST()); written = items.length; }
    catch (e) {
      // One duplicate number stops a whole batch; find which row it was.
      for (const it of items) {
        try { await ctx.repo.putIndiaStudents(orgId, [it], actor.id, I.todayIST()); written++; }
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
