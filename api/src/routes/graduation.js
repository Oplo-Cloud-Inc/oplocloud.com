/* ==========================================================================
   /api/v1/graduation, transcripts and diploma programs.

   Read by the student it belongs to and by the teachers of their courses.
   Written only by administrators, because evaluating transfer credit is a
   registrar's decision, and a student's own record is the last thing that
   student should be able to edit.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { computeGrade, courseWeights } from "../services/grades.js";
import { TRACKS, AREAS, CREDIT_SYSTEMS, toEhsCredits, parseMark, buildDashboard }
  from "../services/graduation.js";

const FLAGS = ["weighted", "not_averaged", "recovered"];

function orgOf(actor) {
  return actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null;
}

/* GET /api/v1/graduation?accountId= — the whole dashboard, computed here so
   that two screens can never disagree about how close somebody is. */
export async function get(ctx) {
  const actor = requireActor(ctx);
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;
  await must(ctx, "transcript.read", { accountId });

  const account = await ctx.repo.findAccountById(accountId);
  if (!account) throw ApiError.notFound("No such account.");

  const [program, records, courses, exams, grades] = await Promise.all([
    ctx.repo.getProgram(accountId),
    ctx.repo.listTransferRecords(accountId),
    ctx.repo.listTransferCourses(accountId),
    ctx.repo.listTransferExams(accountId),
    ctx.repo.listGrades({ accountId })
  ]);

  // This year's EHS courses, with the mark computed the same way the
  // gradebook computes it.
  const byCourse = new Map();
  for (const g of grades) {
    if (!byCourse.has(g.course_id)) byCourse.set(g.course_id, []);
    byCourse.get(g.course_id).push(g);
  }
  const current = [];
  for (const [cid, list] of byCourse) {
    const course = await ctx.repo.findCourse(cid);
    const mark = computeGrade(list, courseWeights(course));
    if (mark) current.push({ courseId: cid, title: course ? course.title : "Course", ...mark });
  }

  return json({ graduation: buildDashboard({ account, program, records, courses, exams, current }) });
}

/* PUT /api/v1/accounts/:accountId/program */
export async function setProgram(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "program.write", { accountId });
  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such account.");
  const body = await readJson(ctx.request);
  const track = check.oneOf(String(body.track || "21.5"), "track", Object.keys(TRACKS));
  const program = await ctx.repo.upsertProgram(accountId, body.orgId || orgOf(actor), {
    program: body.program ? check.string(body.program, "program", { max: 160 }) : null,
    track,
    gradeLevel: body.gradeLevel != null ? check.number(body.gradeLevel, "gradeLevel", { min: 1, max: 13 }) : null,
    enrolledAt: body.enrolledAt || null,
    expectedGrad: body.expectedGrad ? check.string(body.expectedGrad, "expectedGrad", { max: 7 }) : null
  });
  return json({ program });
}

/* POST /api/v1/accounts/:accountId/transcripts

   Imports a previous school's record. A second import from the same school
   replaces the first, so correcting a typo does not leave two records adding
   up to double the credit. */
export async function importTranscript(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "transcript.write", { accountId });
  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such account.");

  const body = await readJson(ctx.request, { limit: 256 * 1024 });
  const src = body.source || {};
  const school = check.string(src.school, "source.school", { max: 160 });
  const system = check.oneOf(src.creditSystem, "source.creditSystem", Object.keys(CREDIT_SYSTEMS));
  const kind = check.oneOf(src.kind || "unofficial", "source.kind", ["unofficial", "official"]);
  const terms = Array.isArray(body.terms) ? body.terms : [];
  if (!terms.length || terms.length > 40) {
    throw ApiError.badRequest("terms must be a list of 1 to 40 terms.", "terms");
  }

  const courses = [];
  terms.forEach((t, ti) => {
    const rows = Array.isArray(t.courses) ? t.courses : [];
    if (rows.length > 30) throw ApiError.badRequest(`Term ${ti + 1} has too many courses.`, "terms");
    rows.forEach((row, ci) => {
      if (!Array.isArray(row) || row.length < 6) {
        throw ApiError.badRequest(`Term ${ti + 1}, course ${ci + 1}: expected [code, title, mark, ` +
                                  `attempted, earned, area, ...flags].`, "terms");
      }
      const [code, title, mark, attempted, earned, area, ...flags] = row;
      const a = check.oneOf(area, `terms[${ti}].courses[${ci}].area`, AREAS);
      const fl = flags.filter((f) => FLAGS.includes(f));
      courses.push({
        schoolYear: t.year ? String(t.year).slice(0, 16) : null,
        gradeLevel: t.gradeLevel != null ? Number(t.gradeLevel) : null,
        term: t.term ? String(t.term).slice(0, 40) : null,
        code: code ? String(code).slice(0, 24) : null,
        title: check.string(title, `terms[${ti}].courses[${ci}].title`, { max: 120 }),
        mark: mark == null ? null : String(mark).slice(0, 12),
        markNumeric: parseMark(mark),
        attempted: check.number(attempted, "attempted", { min: 0, max: 10 }),
        earned: check.number(earned, "earned", { min: 0, max: 10 }),
        area: a,
        flags: fl.join(","),
        ehsCredits: toEhsCredits(earned, system)
      });
    });
  });

  const exams = (Array.isArray(body.exams) ? body.exams : []).slice(0, 40).map((e, i) => {
    if (!Array.isArray(e) || e.length < 4) {
      throw ApiError.badRequest(`Exam ${i + 1}: expected [name, sitting, score, status].`, "exams");
    }
    return {
      name: check.string(e[0], `exams[${i}].name`, { max: 120 }),
      sitting: e[1] ? String(e[1]).slice(0, 7) : null,
      score: e[2] == null ? null : check.number(e[2], `exams[${i}].score`, { min: 0, max: 100 }),
      status: check.oneOf(e[3], `exams[${i}].status`, ["passed", "not_passed", "below_65", "superseded"])
    };
  });

  const summary = {
    creditsAttempted: src.creditsAttempted ?? null,
    creditsEarned: src.creditsEarned ?? null,
    cumulativeAverage: src.cumulativeAverage ?? null,
    terms: terms.filter((t) => t.average != null)
                .map((t) => ({ term: String(t.term || ""), average: Number(t.average) }))
  };

  const record = await ctx.repo.replaceTransferRecord({
    accountId, orgId: orgOf(actor), createdBy: actor.id,
    record: {
      school, authority: src.authority || null, schoolCode: src.schoolCode || null,
      kind, status: kind === "official" ? "received" : "estimate",
      creditSystem: system, printedOn: src.printedOn || null, summary
    },
    courses, exams
  });
  return json({ record: { id: record.id, school: record.school, kind: record.kind,
                          status: record.status, courses: courses.length, exams: exams.length } },
              { status: 201 });
}

/* PATCH /api/v1/transcripts/:recordId — official copy arrived, evaluated. */
export async function updateRecord(ctx, { recordId }) {
  const actor = requireActor(ctx);
  const record = await ctx.repo.findTransferRecord(recordId);
  if (!record) throw ApiError.notFound("No such transcript.");
  await must(ctx, "transcript.write", { accountId: record.account_id });
  const body = await readJson(ctx.request);
  const patch = {};
  if (body.kind !== undefined) patch.kind = check.oneOf(body.kind, "kind", ["unofficial", "official"]);
  if (body.status !== undefined) {
    patch.status = check.oneOf(body.status, "status", ["estimate", "requested", "received", "evaluated"]);
    if (patch.status === "evaluated") { patch.evaluatedBy = actor.id; patch.evaluatedAt = Date.now(); }
  }
  const updated = await ctx.repo.updateTransferRecord(recordId, patch);
  return json({ record: { id: updated.id, kind: updated.kind, status: updated.status } });
}

/* PATCH /api/v1/transcript-courses/:courseId — the registrar's decision. */
export async function updateCourse(ctx, { courseId }) {
  requireActor(ctx);
  const course = await ctx.repo.findTransferCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");
  await must(ctx, "transcript.write", { accountId: course.account_id });
  const body = await readJson(ctx.request);
  const patch = {};
  if (body.decision !== undefined) {
    patch.decision = check.oneOf(body.decision, "decision", ["proposed", "accepted", "declined", "review"]);
  }
  if (body.area !== undefined) patch.area = check.oneOf(body.area, "area", AREAS);
  if (body.ehsCredits !== undefined) {
    patch.ehsCredits = check.number(body.ehsCredits, "ehsCredits", { min: 0, max: 4 });
  }
  if (body.note !== undefined) patch.note = body.note ? check.string(body.note, "note", { max: 500 }) : null;
  const updated = await ctx.repo.updateTransferCourse(courseId, patch);
  return json({ course: { id: updated.id, decision: updated.decision, area: updated.area,
                          ehsCredits: updated.ehs_credits, note: updated.note } });
}
