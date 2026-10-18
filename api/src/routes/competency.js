/* ==========================================================================
   /api/v1/competencies, /competency/*, /students/:id/hpc

   The school's list of competencies, where each child stands on them term by
   term, how many children in a section are at grade level in each, and the
   Holistic Progress Card made from them: the teacher's observations with the
   child's own words, a classmate's and a parent's.

   Rating is the class teacher's, the office's, and the teachers of the section's
   subjects. A family and a child read their own card and add their own words.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, isStaff, guardsStudent } from "../core/guard.js";
import * as I from "../services/india.js";
import * as C from "../services/competency.js";
import * as R from "../services/register.js";
import { profileOf, dayIn } from "../services/profile.js";
import { attendanceSettings } from "./attendance.js";

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
const fail = (m, f) => { throw ApiError.badRequest(m, f); };

async function school(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  const profile = profileOf(await ctx.repo.getOrganization(orgId));
  const sy = R.yearSpan(dayIn(profile.timezone), profile.yearStartMonth).from.slice(0, 4);
  return { actor, orgId, profile, year: `${sy}-${+sy + 1}` };
}
const yearIn = (S, q) => { const y = q.get("year"); if (y && !I.isYear(y)) fail("A school year is written 2026-2027.", "year"); return y || S.year; };
const termIn = (q, body) => { const t = String((body && body.term) || q.get("term") || "1").trim(); if (!t || t.length > 20) fail("A term is a short name such as 1 or 2.", "term"); return t; };

/* Whoever may rate a section: its class teacher, the office, and any teacher who has a paper in it. */
async function mayRate(ctx, S, c) {
  if (await can(ctx, "register.write", { orgId: S.orgId, classTeacherId: c.class_teacher_id })) return true;
  return (await ctx.repo.listPapers({ orgId: S.orgId, classId: c.id, teacherId: S.actor.id })).length > 0;
}
async function classOf(ctx, S, classId) {
  const c = await ctx.repo.getIndiaClass(S.orgId, check.string(classId, "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  return c;
}
const shapeComp = (c) => ({ id: c.id, stage: c.stage || null, subject: c.subject, name: c.name, code: c.code || null, rated: c.rated ?? undefined });

export async function list(ctx) {
  const S = await school(ctx);
  const staff = isStaff(S.actor, S.orgId) || (S.actor.roles || []).some((r) => r.product === "learn" && r.role === "teacher");
  if (!staff) throw ApiError.forbidden("Competencies are read by the school's staff.");
  const stage = ctx.url.searchParams.get("stage") || null;
  return json({ levels: C.LEVELS.map(([n, name]) => ({ n, name })), atLevel: C.AT_LEVEL, competencies: (await ctx.repo.listCompetencies(S.orgId, stage)).map(shapeComp) });
}

/* POST /competencies { competencies: [{ subject, name, code?, stage? }] } */
export async function add(ctx) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  if (!Array.isArray(b.competencies) || !b.competencies.length || b.competencies.length > 200) throw ApiError.badRequest("Send 1 to 200 competencies.", "competencies");
  const list = b.competencies.map((c) => {
    const stage = c.stage ? check.oneOf(c.stage, "stage", C.STAGES) : null;
    return { stage, subject: check.string(c && c.subject, "subject", { max: 60 }), name: check.string(c && c.name, "name", { max: 200 }), code: c && c.code ? check.string(c.code, "code", { max: 40 }) : null };
  });
  await ctx.repo.addCompetencies(S.orgId, list, S.actor.id);
  return json({ competencies: (await ctx.repo.listCompetencies(S.orgId, null)).map(shapeComp) }, { status: 201 });
}

export async function remove(ctx, { compId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const c = (await ctx.repo.listCompetencies(S.orgId, null)).find((x) => x.id === compId);
  if (!c) throw ApiError.notFound("No such competency.");
  if (c.rated) throw ApiError.conflict("Children have been rated on this. It stays, so their cards stay whole.");
  await ctx.repo.deleteCompetency(S.orgId, compId);
  return json({ deleted: true });
}

/* GET /competency/class?classId=&year=&term=&subject= — the section's grid, and how many are at grade level in each skill. */
export async function classGrid(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const c = await classOf(ctx, S, q.get("classId"));
  if (!(await mayRate(ctx, S, c))) throw ApiError.forbidden("A section is rated by its class teacher, its subject teachers and the office.");
  const year = yearIn(S, q), term = termIn(q), stage = C.stageOf(c.grade), subject = q.get("subject") || null;
  const comps = (await ctx.repo.listCompetencies(S.orgId, stage)).filter((x) => !subject || x.subject === subject);
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, c.id)).map(I.shapeStudent).sort((a, b) => (a.rollNo || 1e9) - (b.rollNo || 1e9) || String(a.name).localeCompare(String(b.name)));
  const levels = await ctx.repo.levelsFor(kids.map((k) => k.id), year, term);
  const by = new Map();
  for (const l of levels) (by.get(l.account_id) || by.set(l.account_id, {}).get(l.account_id))[l.competency_id] = l.level;
  return json({
    class: { id: c.id, label: I.classLabel(c.grade, c.section), stage }, year, term, levels: C.LEVELS.map(([n, name]) => ({ n, name })), atLevel: C.AT_LEVEL,
    competencies: comps.map(shapeComp),
    summary: comps.map((x) => ({ id: x.id, ...C.summarise(kids.map((k) => (by.get(k.id) || {})[x.id]).filter((v) => v != null)) })),
    students: kids.map((k) => ({ id: k.id, name: k.name, rollNo: k.rollNo || null, levels: by.get(k.id) || {} }))
  });
}

/* PUT /competency/levels { classId, year?, term, levels: [{ accountId, competencyId, level | null, note? }] } */
export async function putLevels(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await classOf(ctx, S, b.classId);
  if (!(await mayRate(ctx, S, c))) throw ApiError.forbidden("A section is rated by its class teacher, its subject teachers and the office.");
  const year = b.year ? (I.isYear(b.year) ? b.year : fail("A school year is written 2026-2027.", "year")) : S.year, term = termIn(ctx.url.searchParams, b);
  if (!Array.isArray(b.levels) || !b.levels.length || b.levels.length > 2000) throw ApiError.badRequest("Send 1 to 2000 ratings.", "levels");
  const roster = new Set((await ctx.repo.listIndiaStudents(S.orgId, c.id)).map((r) => r.account_id));
  const known = new Set((await ctx.repo.listCompetencies(S.orgId, null)).map((x) => x.id));
  const rows = b.levels.map((x) => {
    const accountId = check.string(x && x.accountId, "accountId", { max: 100 }), competencyId = check.string(x && x.competencyId, "competencyId", { max: 100 });
    if (!roster.has(accountId)) throw ApiError.badRequest("That child is not in this section.", "accountId");
    if (!known.has(competencyId)) throw ApiError.badRequest("That competency is not the school's.", "competencyId");
    return { accountId, competencyId, level: x.level === null ? null : C.cleanLevel(x.level, fail), note: x.note ? check.string(x.note, "note", { max: 300 }) : null };
  });
  await ctx.repo.setLevels(rows, year, term, S.actor.id);
  return json({ saved: rows.length });
}

/* GET /competency/analytics?year=&term=&subject= — the share at grade level in each skill, by section and for the school. */
export async function analytics(ctx) {
  const S = await school(ctx);
  await must(ctx, "register.read", { orgId: S.orgId, classTeacherId: null });
  const q = ctx.url.searchParams;
  const year = yearIn(S, q), term = termIn(q), subject = q.get("subject") || null;
  const rows = await ctx.repo.levelsOfTerm(S.orgId, year, term, subject);
  const bySkill = new Map();
  for (const r of rows) {
    const k = bySkill.get(r.competency_id) || bySkill.set(r.competency_id, { id: r.competency_id, subject: r.subject, name: r.name, all: [], sections: new Map() }).get(r.competency_id);
    k.all.push(r.level);
    const sec = r.grade ? I.classLabel(r.grade, r.section) : "No section";
    (k.sections.get(sec) || k.sections.set(sec, []).get(sec)).push(r.level);
  }
  const skills = [...bySkill.values()].map((k) => ({ id: k.id, subject: k.subject, name: k.name, ...C.summarise(k.all),
    sections: [...k.sections.entries()].map(([label, ls]) => ({ label, ...C.summarise(ls) })).sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true })) }))
    .sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101) || a.name.localeCompare(b.name));
  return json({ year, term, atLevel: C.AT_LEVEL, skills });
}

/* GET /competency/carry?classId=&year= — the children and the skills still below grade level at their latest term: what the next teacher is handed. */
export async function carry(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const c = await classOf(ctx, S, q.get("classId"));
  if (!(await mayRate(ctx, S, c))) throw ApiError.forbidden("A section is read by its class teacher, its subject teachers and the office.");
  const year = yearIn(S, q);
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, c.id)).map(I.shapeStudent).sort((a, b) => (a.rollNo || 1e9) - (b.rollNo || 1e9));
  const comps = new Map((await ctx.repo.listCompetencies(S.orgId, null)).map((x) => [x.id, x]));
  const levels = await ctx.repo.levelsFor(kids.map((k) => k.id), year, null);
  const out = kids.map((k) => ({ id: k.id, name: k.name, rollNo: k.rollNo || null,
    behind: C.carryOver(levels.filter((l) => l.account_id === k.id)).map((r) => ({ competencyId: r.competency_id, subject: (comps.get(r.competency_id) || {}).subject, name: (comps.get(r.competency_id) || {}).name, level: r.level })) }))
    .filter((k) => k.behind.length);
  return json({ year, children: out });
}

/* ----------------------------------------------------------------- The card */

async function mayReadChild(ctx, S, accountId) {
  if (S.actor.id === accountId || isStaff(S.actor, S.orgId) || await guardsStudent(ctx, S.actor, accountId)) return true;
  const row = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  if (row && row.class_id) { const c = await ctx.repo.getIndiaClass(S.orgId, row.class_id); if (c && await mayRate(ctx, S, c)) return true; }
  return false;
}

/* GET /students/:id/hpc?year=&term= */
export async function hpc(ctx, { accountId }) {
  const S = await school(ctx);
  if (!(await mayReadChild(ctx, S, accountId))) throw ApiError.forbidden("A card is read by the child, their family and the teachers who rate them.");
  const q = ctx.url.searchParams, year = yearIn(S, q), term = q.get("term") || null;
  const row = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  const c = row && row.class_id ? await ctx.repo.getIndiaClass(S.orgId, row.class_id) : null;
  const stage = c ? C.stageOf(c.grade) : null;
  const comps = (await ctx.repo.listCompetencies(S.orgId, stage));
  const levels = await ctx.repo.levelsFor([accountId], year, term);
  const names = await ctx.repo.namesOf([accountId]);
  const bySubject = {};
  for (const k of comps) {
    const mine = levels.filter((l) => l.competency_id === k.id).sort((a, b) => String(a.term).localeCompare(String(b.term)));
    if (!mine.length) continue;
    (bySubject[k.subject] = bySubject[k.subject] || []).push({ id: k.id, name: k.name, code: k.code || null, terms: Object.fromEntries(mine.map((l) => [l.term, { level: l.level, name: C.levelName(l.level) }])) });
  }
  const notes = (await ctx.repo.hpcNotes(accountId, year, term)).map((n) => ({ id: n.id, term: n.term, source: n.source, area: n.area || null, body: n.body, by: n.by_name || null, at: n.at }));
  const settings = await attendanceSettings(ctx, S.orgId);
  const span = R.yearSpan(dayIn(S.profile.timezone), S.profile.yearStartMonth);
  const counts = R.tally((await ctx.repo.watchCounts(S.orgId, span.from, dayIn(S.profile.timezone), c ? c.id : null)).filter((r) => r.account_id === accountId), settings.codes).get(accountId) || { attended: 0, excused: 0, absent: 0 };
  const days = counts.attended + counts.excused + counts.absent;
  const exams = (await ctx.repo.examPercents(S.orgId, [accountId])).filter((m) => m.max).sort((a, b) => a.exam_at - b.exam_at)
    .map((m) => ({ exam: m.exam_name, percent: Math.round((m.total / m.max) * 1000) / 10 }));
  return json({ child: { id: accountId, name: names.get(accountId) || "", class: c ? I.classLabel(c.grade, c.section) : null, stage }, year, term, levels: C.LEVELS.map(([n, name]) => ({ n, name })), competencies: bySubject,
    notes, attendance: { present: counts.attended, total: days, percent: days ? Math.round((counts.attended / days) * 1000) / 10 : null }, exams });
}

const SOURCES = ["teacher", "self", "peer", "parent"];
/* POST /students/:id/hpc/notes { year?, term, source, area?, body } — the teacher, the child, a classmate (told to the teacher) or a parent. */
export async function addNote(ctx, { accountId }) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const source = check.oneOf(b.source, "source", SOURCES);
  const row = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  const c = row && row.class_id ? await ctx.repo.getIndiaClass(S.orgId, row.class_id) : null;
  if (source === "self") { if (S.actor.id !== accountId) throw ApiError.forbidden("A child writes their own words."); }
  else if (source === "parent") { if (!(await guardsStudent(ctx, S.actor, accountId))) throw ApiError.forbidden("A parent writes about their own child."); }
  else if (!c || !(await mayRate(ctx, S, c))) throw ApiError.forbidden("A teacher's and a classmate's words are written by the child's class teacher, subject teachers or the office.");
  const year = b.year ? (I.isYear(b.year) ? b.year : fail("A school year is written 2026-2027.", "year")) : S.year;
  const nid = await ctx.repo.addHpcNote(S.orgId, { accountId, year, term: termIn(ctx.url.searchParams, b), source, area: b.area ? check.string(b.area, "area", { max: 80 }) : null, body: check.string(b.body, "body", { max: 1000 }), byId: S.actor.id });
  return json({ id: nid }, { status: 201 });
}

export async function removeNote(ctx, { noteId }) {
  const S = await school(ctx);
  const n = await ctx.repo.getHpcNote(noteId, S.orgId);
  if (!n) throw ApiError.notFound("No such note.");
  if (n.by_id !== S.actor.id && !(await can(ctx, "exam.setup", { orgId: S.orgId }))) throw ApiError.forbidden("A note is taken back by whoever wrote it, or the office.");
  await ctx.repo.removeHpcNote(noteId, S.orgId);
  return json({ removed: true });
}
