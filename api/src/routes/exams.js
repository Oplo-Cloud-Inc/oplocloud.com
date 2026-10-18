/* ==========================================================================
   /api/v1/grading/*, /exams/*, /papers/*, /ptm/*, /students/:id/report-cards

   The exam cycle of an Indian school. A scale is the school's; an exam has a
   paper per subject per section; a paper's marks are entered by its teacher,
   checked, approved and published, each by the people whose job it is; a report
   card is built from what has been published; and the parent meeting follows.

   Who may do each step is guard.js; the arithmetic is services/grading.js.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, isStaff, guardsStudent } from "../core/guard.js";
import { notify } from "../services/notify.js";
import * as I from "../services/india.js";
import * as G from "../services/grading.js";
import * as R from "../services/register.js";
import { profileOf, dayIn } from "../services/profile.js";
import { attendanceSettings } from "./attendance.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
const throwing = (message, field) => { throw ApiError.badRequest(message, field); };
const day = (v, field) => { const s = check.string(v, field, { max: 10 }); if (!DAY.test(s) || Number.isNaN(Date.parse(s))) throw ApiError.badRequest(`${field} must be a date like 2026-09-29.`, field); return s; };

async function school(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!orgId) throw ApiError.badRequest("This account is not part of a school.");
  const profile = profileOf(await ctx.repo.getOrganization(orgId));
  return { actor, orgId, profile, today: dayIn(profile.timezone) };
}
const isTeacher = (actor) => (actor.roles || []).some((r) => r.product === "learn" && (r.role === "teacher" || r.role === "author"));

/* ------------------------------------------------------------------ Scales */

const shapeScale = (r) => ({ id: r.id, name: r.name, board: r.board || null, kind: r.kind, bands: G.bandsOf(r.bands_json), passPercent: r.pass_percent ?? null, note: r.note || null, used: r.used ?? 0 });
const scaleOf = async (ctx, orgId, scaleId) => {
  if (!scaleId) return { bands: [], passPercent: null, kind: "scholastic" };
  const r = await ctx.repo.getScale(orgId, scaleId);
  return r ? { bands: G.bandsOf(r.bands_json), passPercent: r.pass_percent ?? null, kind: r.kind } : { bands: [], passPercent: null, kind: "scholastic" };
};

export async function scales(ctx) {
  const S = await school(ctx);
  if (!isStaff(S.actor, S.orgId) && !isTeacher(S.actor)) throw ApiError.forbidden("Grading scales are read by the school's staff.");
  return json({ templates: G.TEMPLATES.map((t) => ({ key: t.key, ...G.fromTemplate(t) })), scales: (await ctx.repo.listScales(S.orgId)).map(shapeScale), areas: G.AREAS });
}

/* POST /grading/scales { template: "cbse-9" } or a scale { name, board, kind, bands, passPercent, note } */
export async function createScale(ctx) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  let src = b;
  if (b.template) {
    const t = G.TEMPLATES.find((x) => x.key === b.template);
    if (!t) throw ApiError.badRequest("There is no such template.", "template");
    src = { ...G.fromTemplate(t), ...(b.name ? { name: b.name } : {}) };
  }
  const clean = G.cleanScale(src, throwing);
  if ((await ctx.repo.listScales(S.orgId)).some((x) => x.name.toLowerCase() === clean.name.toLowerCase())) throw ApiError.conflict("A scale with that name already exists.", "name");
  return json({ scale: shapeScale(await ctx.repo.putScale(S.orgId, null, clean, S.actor.id)) }, { status: 201 });
}

export async function updateScale(ctx, { scaleId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const was = await ctx.repo.getScale(S.orgId, scaleId);
  if (!was) throw ApiError.notFound("No such scale.");
  const clean = G.cleanScale({ name: was.name, board: was.board, kind: was.kind, bands: G.bandsOf(was.bands_json), passPercent: was.pass_percent, note: was.note, ...(await readJson(ctx.request)), kind: was.kind }, throwing);
  return json({ scale: shapeScale(await ctx.repo.putScale(S.orgId, scaleId, clean, S.actor.id)) });
}

export async function deleteScale(ctx, { scaleId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const sc = (await ctx.repo.listScales(S.orgId)).find((x) => x.id === scaleId);
  if (!sc) throw ApiError.notFound("No such scale.");
  if (sc.used) throw ApiError.conflict("An exam uses this scale. Change the exam first.");
  await ctx.repo.deleteScale(S.orgId, scaleId);
  return json({ deleted: true });
}

/* ------------------------------------------------------------------- Exams */

const shapeExam = (e) => ({ id: e.id, year: e.school_year, name: e.name, kind: e.kind, scaleId: e.scale_id || null, coscaleId: e.coscale_id || null, startsOn: e.starts_on || null, endsOn: e.ends_on || null,
  papers: e.papers ?? undefined, published: e.published ?? undefined });
const KINDS = ["term", "periodic", "annual", "improvement"];

async function checkScale(ctx, orgId, id, kind, field) {
  if (!id) return null;
  const sc = await ctx.repo.getScale(orgId, id);
  if (!sc || sc.kind !== kind) throw ApiError.badRequest("Choose one of the school's " + (kind === "coscholastic" ? "co-scholastic" : "grading") + " scales.", field);
  return id;
}

export async function listExams(ctx) {
  const S = await school(ctx);
  if (!isStaff(S.actor, S.orgId) && !isTeacher(S.actor)) throw ApiError.forbidden("Exams are read by the school's staff.");
  const year = ctx.url.searchParams.get("year") || null;
  return json({ today: S.today, exams: (await ctx.repo.listExams(S.orgId, year)).map(shapeExam) });
}

export async function createExam(ctx) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  const year = b.year ? (I.isYear(b.year) ? b.year : throwing("A school year is written 2026-2027.", "year")) : R.yearSpan(S.today, S.profile.yearStartMonth).from.slice(0, 4) + "-" + (+R.yearSpan(S.today, S.profile.yearStartMonth).from.slice(0, 4) + 1);
  const e = { year, name: check.string(b.name, "name", { max: 80 }), kind: check.oneOf(b.kind || "term", "kind", KINDS),
    scaleId: await checkScale(ctx, S.orgId, b.scaleId, "scholastic", "scaleId"), coscaleId: await checkScale(ctx, S.orgId, b.coscaleId, "coscholastic", "coscaleId"),
    startsOn: b.startsOn ? day(b.startsOn, "startsOn") : null, endsOn: b.endsOn ? day(b.endsOn, "endsOn") : null };
  if (e.startsOn && e.endsOn && e.endsOn < e.startsOn) throw ApiError.badRequest("The exam ends before it starts.", "endsOn");
  try { return json({ exam: shapeExam(await ctx.repo.insertExam(S.orgId, e, S.actor.id)) }, { status: 201 }); }
  catch (err) { if (/UNIQUE/i.test(String(err && err.message))) throw ApiError.conflict("This school year already has an exam with that name.", "name"); throw err; }
}

export async function updateExam(ctx, { examId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const was = await ctx.repo.getExam(S.orgId, examId);
  if (!was) throw ApiError.notFound("No such exam.");
  const b = await readJson(ctx.request);
  const e = { scaleId: b.scaleId === undefined ? was.scale_id : await checkScale(ctx, S.orgId, b.scaleId, "scholastic", "scaleId"),
    coscaleId: b.coscaleId === undefined ? was.coscale_id : await checkScale(ctx, S.orgId, b.coscaleId, "coscholastic", "coscaleId"),
    startsOn: b.startsOn === undefined ? was.starts_on : (b.startsOn ? day(b.startsOn, "startsOn") : null), endsOn: b.endsOn === undefined ? was.ends_on : (b.endsOn ? day(b.endsOn, "endsOn") : null) };
  return json({ exam: shapeExam(await ctx.repo.updateExam(S.orgId, examId, e)) });
}

/* ------------------------------------------------------------------ Papers */

const shapePaper = (p) => ({ id: p.id, examId: p.exam_id, exam: p.exam_name, year: p.school_year, classId: p.class_id, classLabel: I.classLabel(p.grade, p.section), subject: p.subject,
  teacher: p.teacher_id ? { id: p.teacher_id, name: p.teacher_name || "" } : null, maxTheory: p.max_theory, maxInternal: p.max_internal, maxPractical: p.max_practical,
  state: p.state, strength: p.strength ?? undefined, entered: p.entered ?? undefined, returnedNote: p.returned_note || null,
  submittedAt: p.submitted_at || null, checkedAt: p.checked_at || null, approvedAt: p.approved_at || null, publishedAt: p.published_at || null });

/* GET /papers?examId=&classId=&mine=1 — the office sees them all; a teacher the papers they teach and those of their own section. */
export async function listPapers(ctx) {
  const S = await school(ctx);
  const q = ctx.url.searchParams;
  const office = await can(ctx, "exam.check", { orgId: S.orgId });
  if (!office && !isTeacher(S.actor)) throw ApiError.forbidden("Papers are read by the school's staff.");
  const rows = await ctx.repo.listPapers({ orgId: S.orgId, examId: q.get("examId"), classId: q.get("classId") });
  const mine = rows.filter((p) => p.teacher_id === S.actor.id || p.class_teacher_id === S.actor.id);
  return json({ papers: (office && q.get("mine") !== "1" ? rows : mine).map(shapePaper) });
}

/* POST /exams/:examId/papers { classId, papers: [{ subject, teacherId?, maxTheory?, maxInternal?, maxPractical? }] } */
export async function addPapers(ctx, { examId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const exam = await ctx.repo.getExam(S.orgId, examId);
  if (!exam) throw ApiError.notFound("No such exam.");
  const b = await readJson(ctx.request);
  const c = await ctx.repo.getIndiaClass(S.orgId, check.string(b.classId, "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  if (!Array.isArray(b.papers) || !b.papers.length || b.papers.length > 30) throw ApiError.badRequest("Name 1 to 30 subjects.", "papers");
  const seen = new Set(), list = [];
  for (const p of b.papers) {
    const subject = check.string(p && p.subject, "subject", { max: 60 });
    if (seen.has(subject.toLowerCase())) throw ApiError.badRequest(`${subject} is listed twice.`, "papers");
    seen.add(subject.toLowerCase());
    const teacherId = p.teacherId ? String(p.teacherId) : null;
    if (teacherId && !(await ctx.repo.isOrgMember(S.orgId, teacherId))) throw ApiError.badRequest(`${subject}: that teacher is not part of this school.`, "teacherId");
    const mt = p.maxTheory === undefined ? 80 : check.number(p.maxTheory, "maxTheory", { min: 0, max: 1000 });
    const mi = p.maxInternal === undefined ? 20 : check.number(p.maxInternal, "maxInternal", { min: 0, max: 1000 });
    const mp = p.maxPractical === undefined ? 0 : check.number(p.maxPractical, "maxPractical", { min: 0, max: 1000 });
    if (mt + mi + mp <= 0) throw ApiError.badRequest(`${subject}: a paper is out of something.`, "maxTheory");
    list.push({ subject, teacherId, maxTheory: mt, maxInternal: mi, maxPractical: mp });
  }
  await ctx.repo.insertPapers(examId, c.id, list);
  return json({ papers: (await ctx.repo.listPapers({ orgId: S.orgId, examId, classId: c.id })).map(shapePaper) }, { status: 201 });
}

export async function reassignPaper(ctx, { paperId }) {
  const S = await school(ctx);
  await must(ctx, "exam.setup", { orgId: S.orgId });
  const p = await ctx.repo.getPaper(S.orgId, paperId);
  if (!p) throw ApiError.notFound("No such paper.");
  const b = await readJson(ctx.request);
  const t = b.teacherId || null;
  if (t && !(await ctx.repo.isOrgMember(S.orgId, t))) throw ApiError.badRequest("That teacher is not part of this school.", "teacherId");
  await ctx.repo.setPaperTeacher(paperId, t);
  return json({ paper: shapePaper(await ctx.repo.getPaper(S.orgId, paperId)) });
}

const rollSort = (a, b) => (a.rollNo || 1e9) - (b.rollNo || 1e9) || String(a.name).localeCompare(String(b.name), "en", { sensitivity: "base" });

/* One paper with every child of the section and their marks. */
async function paperView(ctx, S, p) {
  const scale = await scaleOf(ctx, S.orgId, p.scale_id);
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, p.class_id)).map(I.shapeStudent).sort(rollSort);
  const marks = new Map((await ctx.repo.listMarks(p.id)).map((m) => [m.account_id, m]));
  return {
    paper: shapePaper({ ...p, strength: kids.length, entered: kids.filter((k) => { const m = marks.get(k.id); return m && (m.absent || m.theory != null || m.internal != null || m.practical != null); }).length }),
    scale: { bands: scale.bands, passPercent: scale.passPercent },
    students: kids.map((k) => {
      const m = marks.get(k.id);
      const line = G.lineOf(p, m || null, scale);
      return { id: k.id, name: k.name, rollNo: k.rollNo || null, theory: m ? m.theory : null, internal: m ? m.internal : null, practical: m ? m.practical : null, absent: !!(m && m.absent),
               total: line.total, percent: line.percent, grade: line.grade, pass: line.pass };
    })
  };
}
async function paperOf(ctx, S, paperId) {
  const p = await ctx.repo.getPaper(S.orgId, paperId);
  if (!p) throw ApiError.notFound("No such paper.");
  return p;
}
const enterRes = (S, p) => ({ orgId: S.orgId, teacherId: p.teacher_id, classTeacherId: p.class_teacher_id });

/* What the person asking may do with this paper, so a screen draws only the steps that are theirs. */
async function powers(ctx, S, p) {
  const [check, approve, publish] = await Promise.all(["exam.check", "exam.approve", "exam.publish"].map((a) => can(ctx, a, { orgId: S.orgId })));
  return { office: check, mayCheck: check, mayApprove: approve, mayPublish: publish, canEnter: await can(ctx, "exam.enter", enterRes(S, p)) };
}

export async function getPaper(ctx, { paperId }) {
  const S = await school(ctx);
  const p = await paperOf(ctx, S, paperId);
  await must(ctx, "exam.enter", enterRes(S, p));
  return json({ ...(await paperView(ctx, S, p)), ...(await powers(ctx, S, p)) });
}

/* PUT /papers/:id/marks { marks: [{ accountId, theory?, internal?, practical?, absent? }], why? }
   While the paper is with its teacher the teacher enters; once handed in only the office
   changes it; once approved only the principal does, saying why, and it is marked as a
   change after approval. */
export async function putMarks(ctx, { paperId }) {
  const S = await school(ctx);
  const p = await paperOf(ctx, S, paperId);
  await must(ctx, "exam.enter", enterRes(S, p));
  const b = await readJson(ctx.request);
  const afterLock = G.LOCKED_STATES.includes(p.state);
  let why = null;
  if (afterLock) {
    if (!(await can(ctx, "exam.approve", { orgId: S.orgId }))) throw ApiError.forbidden(`This paper is ${p.state}. Only the principal changes it now, and says why.`);
    why = typeof b.why === "string" ? b.why.trim() : "";
    if (why.length < 5) throw ApiError.badRequest(`This paper is ${p.state}. Say why you are changing a mark; the reason is kept with the change.`, "why");
  } else if (p.state !== "entry" && !(await can(ctx, "exam.check", { orgId: S.orgId }))) {
    throw ApiError.forbidden("This paper has been handed in. Ask the office to send it back to you.");
  }
  if (!Array.isArray(b.marks) || !b.marks.length || b.marks.length > 200) throw ApiError.badRequest("marks must be a list of 1 to 200 children.", "marks");
  const roster = new Set((await ctx.repo.listIndiaStudents(S.orgId, p.class_id)).map((r) => r.account_id));
  const rows = [];
  for (const m of b.marks) {
    const accountId = check.string(m && m.accountId, "accountId", { max: 100 });
    if (!roster.has(accountId)) throw ApiError.badRequest("That child is not in this section.", "accountId");
    const who = (await ctx.repo.namesOf([accountId])).get(accountId) || "that child";
    rows.push({ accountId, ...G.cleanMark(p, m, (msg, f) => { throw ApiError.badRequest(`${who}: ${msg}`, f); }) });
  }
  await ctx.repo.saveMarks(paperId, rows, S.actor.id, p.state, afterLock, why);
  const fresh = await paperOf(ctx, S, paperId);
  return json({ ...(await paperView(ctx, S, fresh)), ...(await powers(ctx, S, fresh)) });
}

/* POST /papers/:id/advance { to, note? } */
export async function advance(ctx, { paperId }) {
  const S = await school(ctx);
  const p = await paperOf(ctx, S, paperId);
  const b = await readJson(ctx.request);
  const to = check.oneOf(b.to, "to", G.STATES);
  if (!G.canMove(p.state, to)) throw ApiError.conflict(`A paper in “${p.state}” cannot go to “${to}”.`, "to");
  const note = b.note ? check.string(b.note, "note", { max: 300 }) : null;
  if (to === "entry") {
    // Sending it back: whoever could have taken the step it is waiting at, and a reason.
    const waiting = { submitted: "exam.check", checked: "exam.check", approved: "exam.approve" }[p.state];
    await must(ctx, waiting, { orgId: S.orgId });
    if (!note || note.length < 5) throw ApiError.badRequest("Say what needs another look; the teacher is shown it.", "note");
  } else if (to === "submitted") {
    await must(ctx, "exam.enter", enterRes(S, p));
    const v = await paperView(ctx, S, p);
    if (!v.students.length) throw ApiError.conflict("Nobody is in this section yet.");
    const open = v.paper.strength - v.paper.entered;
    if (open > 0) throw ApiError.conflict(`${open} ${open === 1 ? "child has" : "children have"} no marks yet. Enter them, or mark absent (AB).`);
    // A paper with a part left blank for a child is not finished either.
    const half = v.students.filter((s) => !s.absent && s.total == null);
    if (half.length) throw ApiError.conflict(`${half[0].name} has only part of the paper filled in.`);
  } else await must(ctx, { checked: "exam.check", approved: "exam.approve", published: "exam.publish" }[to], { orgId: S.orgId });
  await ctx.repo.setPaperState(paperId, to, S.actor.id, to === "entry" ? note : null);
  if (to === "published") {
    // The child and their family are told once per paper.
    const kids = (await ctx.repo.listIndiaStudents(S.orgId, p.class_id)).map((r) => r.account_id);
    ctx.waitUntil((async () => {
      for (const id of kids) {
        const recipients = [id].concat(await ctx.repo.guardianIdsOf([id]));
        await notify(ctx.repo, { orgId: S.orgId, to: recipients, kind: "report", from: S.actor.id, title: `${p.exam_name}: ${p.subject} marks are out`,
          body: `The ${p.subject} marks for ${p.exam_name} have been published.`, link: "grades", dedupe: `paper:${paperId}:${id}` });
      }
    })());
  }
  return json({ paper: shapePaper(await paperOf(ctx, S, paperId)) });
}

/* GET /exams/mark-edits — every mark changed after approval, and why. */
export async function markEdits(ctx) {
  const S = await school(ctx);
  await must(ctx, "exam.approve", { orgId: S.orgId });
  const rows = await ctx.repo.markEditsAfterLock(S.orgId, 200);
  return json({ edits: rows.map((r) => ({ id: r.id, exam: r.exam_name, subject: r.subject, classLabel: I.classLabel(r.grade, r.section), student: r.student_name || "", field: r.field,
    from: r.from_value, to: r.to_value, by: r.by_name || "", at: r.at, state: r.state, why: r.why || "" })) });
}

/* ------------------------------------------------------------------- Cards */

/* The report cards of a section for an exam, from the papers in the states asked for. */
async function buildCards(ctx, S, exam, classId, { publishedOnly, onlyIds }) {
  const [scale, coscale] = [await scaleOf(ctx, S.orgId, exam.scale_id), exam.coscale_id ? await ctx.repo.getScale(S.orgId, exam.coscale_id) : null];
  const papers = (await ctx.repo.cardPapers(exam.id, classId)).filter((p) => !publishedOnly || p.state === "published");
  const allPapers = await ctx.repo.cardPapers(exam.id, classId);
  const marks = await ctx.repo.marksOfPapers(papers.map((p) => p.id));
  const byPaper = new Map();
  for (const m of marks) (byPaper.get(m.paper_id) || byPaper.set(m.paper_id, new Map()).get(m.paper_id)).set(m.account_id, m);
  const roster = (await ctx.repo.listIndiaStudents(S.orgId, classId)).map(I.shapeStudent);
  const ids = new Set(roster.map((r) => r.id));
  for (const m of marks) ids.add(m.account_id);
  const names = await ctx.repo.namesOf([...ids]);
  const rollOf = new Map(roster.map((r) => [r.id, r.rollNo || null]));
  const list = [...ids].filter((id) => !onlyIds || onlyIds.includes(id));
  const { cards, cos } = await ctx.repo.cardExtras(exam.id, list);
  const cardOfId = new Map(cards.map((c) => [c.account_id, c])), cosOf = new Map();
  for (const c of cos) (cosOf.get(c.account_id) || cosOf.set(c.account_id, {}).get(c.account_id))[c.area] = c.grade;
  // Attendance over the exam's span (or the school year to today), from the whole-day register.
  const year = R.yearSpan(S.today, S.profile.yearStartMonth);
  const settings = await attendanceSettings(ctx, S.orgId);
  const counts = R.tally(await ctx.repo.watchCounts(S.orgId, exam.starts_on || year.from, exam.ends_on && exam.ends_on < S.today ? exam.ends_on : S.today, classId), settings.codes);
  const complete = allPapers.length > 0 && allPapers.every((p) => p.state === "published");
  const out = list.map((id) => {
    const lines = papers.map((p) => ({ ...G.lineOf(p, (byPaper.get(p.id) || new Map()).get(id) || null, scale), state: p.state }));
    const c = G.cardOf(lines, scale);
    const a = counts.get(id) || { attended: 0, excused: 0, absent: 0 };
    const days = a.attended + a.excused + a.absent;
    const x = cardOfId.get(id) || {};
    return { ...c, accountId: id, name: names.get(id) || "", rollNo: rollOf.get(id) || null,
      attendance: { present: a.attended, total: days, percent: days ? Math.round((a.attended / days) * 1000) / 10 : null },
      cos: cosOf.get(id) || {}, remark: complete || !publishedOnly ? x.remark || null : null, decision: complete || !publishedOnly ? x.result || null : null };
  }).sort(rollSort);
  return { exam: shapeExam(exam), classLabel: null, complete, scale: { bands: scale.bands, passPercent: scale.passPercent }, coscale: coscale ? shapeScale(coscale) : null, cards: out };
}

/* GET /exams/:examId/cards?classId= */
export async function cards(ctx, { examId }) {
  const S = await school(ctx);
  const exam = await ctx.repo.getExam(S.orgId, examId);
  if (!exam) throw ApiError.notFound("No such exam.");
  const c = await ctx.repo.getIndiaClass(S.orgId, check.string(ctx.url.searchParams.get("classId"), "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const out = await buildCards(ctx, S, exam, c.id, { publishedOnly: ctx.url.searchParams.get("published") === "1" });
  out.classLabel = I.classLabel(c.grade, c.section);
  return json(out);
}

/* PUT /exams/:examId/cards { classId, cards: [{ accountId, remark?, result?, cos? }] } — the class teacher's words. */
export async function putCards(ctx, { examId }) {
  const S = await school(ctx);
  const exam = await ctx.repo.getExam(S.orgId, examId);
  if (!exam) throw ApiError.notFound("No such exam.");
  const b = await readJson(ctx.request);
  const c = await ctx.repo.getIndiaClass(S.orgId, check.string(b.classId, "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  if (!Array.isArray(b.cards) || !b.cards.length || b.cards.length > 200) throw ApiError.badRequest("cards must be a list of 1 to 200 children.", "cards");
  const roster = new Set((await ctx.repo.listIndiaStudents(S.orgId, c.id)).map((r) => r.account_id));
  const coscale = exam.coscale_id ? await ctx.repo.getScale(S.orgId, exam.coscale_id) : null;
  const grades = coscale ? G.bandsOf(coscale.bands_json).map((x) => x.grade) : null;
  const items = b.cards.map((x) => {
    const accountId = check.string(x && x.accountId, "accountId", { max: 100 });
    if (!roster.has(accountId)) throw ApiError.badRequest("That child is not in this section.", "accountId");
    const it = { accountId, remark: x.remark ? check.string(x.remark, "remark", { max: 400 }) : null, result: x.result ? check.oneOf(x.result, "result", ["promoted", "detained", "passed out"]) : null };
    if (x.cos && typeof x.cos === "object") {
      it.cos = {};
      for (const [area, grade] of Object.entries(x.cos)) {
        if (!grade) continue;
        check.string(area, "area", { max: 60 });
        if (!grades) throw ApiError.badRequest("Choose a co-scholastic scale for this exam first.", "cos");
        it.cos[area] = check.oneOf(grade, "grade", grades);
      }
    }
    return it;
  });
  await ctx.repo.saveCards(examId, items, S.actor.id);
  return json({ saved: items.length });
}

/* GET /students/:accountId/report-cards — what has been published for the child; the office sees all of it. */
export async function reportCards(ctx, { accountId }) {
  const S = await school(ctx);
  const own = S.actor.id === accountId;
  const office = isStaff(S.actor, S.orgId);
  if (!own && !office && !(await guardsStudent(ctx, S.actor, accountId))) throw ApiError.forbidden("Report cards are read by the child, their family and the school's office.");
  const exams = await ctx.repo.examsWithPublished(accountId);
  const out = [];
  for (const e of exams) {
    const classId = (await ctx.repo.cardPapers(e.id, e.class_id)).length ? e.class_id : null;
    if (!classId) continue;
    const r = await buildCards(ctx, S, e, classId, { publishedOnly: !office, onlyIds: [accountId] });
    if (r.cards[0]) out.push({ ...r, classLabel: I.classLabel(e.grade, e.section) });
  }
  return json({ reportCards: out });
}

/* ---------------------------------------------------------- Parent meetings */

const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const minutes = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };

/* POST /ptm { classId, examId?, title, day, start, slotMinutes, mode: "roll" | "open", extra? }
   "roll": a slot for every child in roll order (the usual: 1 to 8 at ten o'clock …). "open": slots for the families to choose. */
export async function createPtm(ctx) {
  const S = await school(ctx);
  const b = await readJson(ctx.request);
  const c = await ctx.repo.getIndiaClass(S.orgId, check.string(b.classId, "classId", { max: 80 }));
  if (!c) throw ApiError.notFound("That class is not in this school.");
  await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id });
  const start = minutes(b.start);
  if (start == null || start >= 24 * 60) throw ApiError.badRequest("The meeting starts at a time like 09:30.", "start");
  const slotMinutes = check.number(b.slotMinutes, "slotMinutes", { min: 3, max: 60 });
  const mode = check.oneOf(b.mode || "roll", "mode", ["roll", "open"]);
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, c.id)).map(I.shapeStudent).sort(rollSort);
  if (!kids.length) throw ApiError.conflict("Nobody is in this section yet.");
  const extra = b.extra === undefined ? 0 : check.number(b.extra, "extra", { min: 0, max: 20 });
  const count = kids.length + (mode === "open" ? Math.ceil(kids.length * 0.15) : 0) + extra;
  const slots = [];
  for (let i = 0; i < count; i++) slots.push({ no: i + 1, starts: hhmm(start + i * slotMinutes), accountId: mode === "roll" && kids[i] ? kids[i].id : null });
  if (start + count * slotMinutes > 24 * 60) throw ApiError.badRequest("That many slots runs past midnight. Use shorter slots or an earlier start.", "slotMinutes");
  const examId = b.examId ? (await ctx.repo.getExam(S.orgId, b.examId))?.id || throwing("No such exam.", "examId") : null;
  const pid = await ctx.repo.insertPtm(S.orgId, { classId: c.id, examId, title: check.string(b.title, "title", { max: 120 }), day: day(b.day, "day"), start: hhmm(start), slotMinutes, mode }, slots, S.actor.id);
  // Families are told the day and, in roll order, their own time.
  const day0 = b.day;
  ctx.waitUntil((async () => {
    for (const k of kids) {
      const sl = slots.find((x) => x.accountId === k.id);
      await notify(ctx.repo, { orgId: S.orgId, to: [k.id].concat(await ctx.repo.guardianIdsOf([k.id])), kind: "announcement", from: S.actor.id, title: `Parent meeting: ${b.title}`,
        body: sl ? `${day0}, your time is ${sl.starts}.` : `${day0}, from ${hhmm(start)}. Choose a time in the family view.`, link: "meetings", dedupe: `ptm:${pid}:${k.id}` });
    }
  })());
  return json({ ptm: { id: pid } }, { status: 201 });
}

const shapePtm = (m) => ({ id: m.id, classId: m.class_id, classLabel: I.classLabel(m.grade, m.section), examId: m.exam_id || null, title: m.title, day: m.day, start: m.start_time, slotMinutes: m.slot_minutes, mode: m.mode,
  slots: m.slots ?? undefined, booked: m.booked ?? undefined });

export async function listPtm(ctx) {
  const S = await school(ctx);
  const classId = ctx.url.searchParams.get("classId") || null;
  if (classId) { const c = await ctx.repo.getIndiaClass(S.orgId, classId); if (!c) throw ApiError.notFound("That class is not in this school."); await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: c.class_teacher_id }); }
  else await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: null });
  return json({ meetings: (await ctx.repo.listPtm(S.orgId, classId)).map(shapePtm) });
}

export async function getPtm(ctx, { ptmId }) {
  const S = await school(ctx);
  const m = await ctx.repo.getPtm(S.orgId, ptmId);
  if (!m) throw ApiError.notFound("No such meeting.");
  await must(ctx, "exam.read", { orgId: S.orgId, classTeacherId: m.class_teacher_id });
  const slots = await ctx.repo.ptmSlots(ptmId);
  return json({ ptm: shapePtm(m), slots: slots.map((s) => ({ no: s.slot_no, starts: s.starts, accountId: s.account_id || null, child: s.child_name || null, bookedBy: s.booked_by || null })) });
}

/* GET /students/:id/ptm — the meetings of the child's section, and the child's slot in each. */
export async function ptmFor(ctx, { accountId }) {
  const S = await school(ctx);
  if (S.actor.id !== accountId && !isStaff(S.actor, S.orgId) && !(await guardsStudent(ctx, S.actor, accountId))) throw ApiError.forbidden("Meetings are read by the child, their family and the office.");
  const rows = await ctx.repo.ptmFor(accountId);
  const out = [];
  for (const m of rows) {
    const free = m.mode === "open" ? (await ctx.repo.ptmSlots(m.id)).filter((s) => !s.account_id).map((s) => ({ no: s.slot_no, starts: s.starts })) : [];
    out.push({ ...shapePtm(m), slot: m.slot_no ? { no: m.slot_no, starts: m.starts } : null, free });
  }
  return json({ meetings: out });
}

/* POST /ptm/:id/book { accountId, slotNo } · POST /ptm/:id/release { accountId } — the family, or the class teacher on their behalf. */
async function slotAuth(ctx, S, m, accountId) {
  const mine = S.actor.id === accountId || (await guardsStudent(ctx, S.actor, accountId));
  if (!mine && !(await can(ctx, "exam.read", { orgId: S.orgId, classTeacherId: m.class_teacher_id }))) throw ApiError.forbidden("A slot is booked by the child's family or the class teacher.");
}
export async function bookPtm(ctx, { ptmId }) {
  const S = await school(ctx);
  const m = await ctx.repo.getPtm(S.orgId, ptmId);
  if (!m) throw ApiError.notFound("No such meeting.");
  const b = await readJson(ctx.request);
  const accountId = check.string(b.accountId, "accountId", { max: 100 });
  await slotAuth(ctx, S, m, accountId);
  if (!(await ctx.repo.listIndiaStudents(S.orgId, m.class_id)).some((r) => r.account_id === accountId)) throw ApiError.badRequest("That child is not in this section.", "accountId");
  if (m.day < S.today) throw ApiError.conflict("That meeting has been held.");
  const slotNo = check.number(b.slotNo, "slotNo", { min: 1, max: 500 });
  const slot = (await ctx.repo.ptmSlots(ptmId)).find((s) => s.slot_no === slotNo);
  if (!slot) throw ApiError.notFound("There is no such slot.");
  if (slot.account_id && slot.account_id !== accountId) throw ApiError.conflict("That slot is taken. Choose another.", "slotNo");
  await ctx.repo.bookSlot(ptmId, slotNo, accountId, S.actor.id);
  return json({ booked: { no: slotNo, starts: slot.starts } });
}
export async function releasePtm(ctx, { ptmId }) {
  const S = await school(ctx);
  const m = await ctx.repo.getPtm(S.orgId, ptmId);
  if (!m) throw ApiError.notFound("No such meeting.");
  const b = await readJson(ctx.request);
  const accountId = check.string(b.accountId, "accountId", { max: 100 });
  await slotAuth(ctx, S, m, accountId);
  await ctx.repo.releaseSlot(ptmId, accountId);
  return json({ released: true });
}
