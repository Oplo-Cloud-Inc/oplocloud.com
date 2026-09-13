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
import { computeGrade, courseWeights, coursePolicy } from "../services/grades.js";
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

  const [program, records, courses, exams, grades, ehsCourses, mine] = await Promise.all([
    ctx.repo.getProgram(accountId),
    ctx.repo.listTransferRecords(accountId),
    ctx.repo.listTransferCourses(accountId),
    ctx.repo.listTransferExams(accountId),
    ctx.repo.listGrades({ accountId }),
    ctx.repo.listEhsCourses(accountId),
    ctx.repo.listCourses({ accountId })
  ]);

  // The credit and requirement area a course says it carries, where it says.
  // Courses without them still show; they just cannot be counted toward a gap.
  const carries = (course) => {
    let body = {};
    try { body = course && course.body_json ? JSON.parse(course.body_json) || {} : {}; } catch { body = {}; }
    return {
      credits: typeof body.credits === "number" && body.credits > 0 ? body.credits : null,
      area: AREAS.includes(body.area) ? body.area : null
    };
  };

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
    const mark = computeGrade(list, courseWeights(course), coursePolicy(course));
    if (mark) current.push({ courseId: cid, title: course ? course.title : "Course", ...mark, ...carries(course) });
  }
  // A course the student is enrolled in and has no marks for yet is still
  // this year's work. Leaving it off made a student with one open course look
  // as if they were taking nothing.
  for (const c of mine) {
    if (c.my_role !== "student" || byCourse.has(c.id)) continue;
    current.push({ courseId: c.id, title: c.title, percent: null, letter: null, itemCount: 0,
                   countedWeight: 0, ...carries(c) });
  }

  return json({ graduation: buildDashboard({ account, program, records, courses, exams, current, ehsCourses }) });
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
  // A record can arrive already evaluated: the transfer section of EHS's own
  // academic record is EHS's decision, not an estimate waiting for one. Its
  // courses are then accepted rather than proposed.
  const status = src.status == null ? (kind === "official" ? "received" : "estimate")
    : check.oneOf(src.status, "source.status", ["estimate", "requested", "received", "evaluated"]);
  const decision = status === "evaluated" ? "accepted" : "proposed";
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
        ehsCredits: toEhsCredits(earned, system),
        decision
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
                .map((t) => ({ term: String(t.term || ""), average: Number(t.average) })),
    stateTests: stateTestsOf(body.stateTests)
  };

  const record = await ctx.repo.replaceTransferRecord({
    accountId, orgId: orgOf(actor), createdBy: actor.id,
    record: {
      school, authority: src.authority || null, schoolCode: src.schoolCode || null,
      kind, status,
      creditSystem: system, printedOn: src.printedOn || null, summary
    },
    courses, exams
  });
  return json({ record: { id: record.id, school: record.school, kind: record.kind,
                          status: record.status, courses: courses.length, exams: exams.length } },
              { status: 201 });
}

/* State tests from the grades before high school, verbatim, as the previous
   school's record prints them: [year, grade, exam, score, level, rating,
   percentile, note]. Kept with that record because they are part of it, and
   bounded because they are the least load-bearing thing on it. */
function stateTestsOf(list) {
  if (!Array.isArray(list)) return [];
  const num = (v, min, max) => (v == null || v === "" || !isFinite(Number(v)) ? null
    : Math.min(max, Math.max(min, Number(v))));
  return list.slice(0, 30).filter(Array.isArray).map((t) => ({
    year: t[0] ? String(t[0]).slice(0, 9) : null,
    grade: num(t[1], 1, 12),
    exam: t[2] ? String(t[2]).slice(0, 60) : null,
    score: t[3] == null || t[3] === "" ? null : String(t[3]).slice(0, 8),
    level: num(t[4], 1, 4),
    rating: num(t[5], 0, 5),
    percentile: t[6] ? String(t[6]).slice(0, 12) : null,
    note: t[7] ? String(t[7]).slice(0, 120) : null
  }));
}

/* PUT /api/v1/accounts/:accountId/ehs-record

   EHS's own record of a student who is already enrolled: when they started,
   their standing, what EHS issued, and the courses they finished with EHS.
   Rows are [code, title, mark, credits, area, schoolYear, term, status].
   Replaces whatever was there, the same as a transcript import does. */
export async function putEhsRecord(ctx, { accountId }) {
  const actor = requireActor(ctx);
  await must(ctx, "transcript.write", { accountId });
  if (!(await ctx.repo.findAccountById(accountId))) throw ApiError.notFound("No such account.");

  const body = await readJson(ctx.request, { limit: 128 * 1024 });
  const rows = Array.isArray(body.courses) ? body.courses : [];
  if (rows.length > 80) throw ApiError.badRequest("That is more EHS courses than a record holds.", "courses");

  const courses = rows.map((row, i) => {
    if (!Array.isArray(row) || row.length < 6) {
      throw ApiError.badRequest(`Course ${i + 1}: expected [code, title, mark, credits, area, ` +
                                `schoolYear, term, status].`, "courses");
    }
    const [code, title, mark, credits, area, year, term, status] = row;
    return {
      code: code ? String(code).slice(0, 24) : null,
      title: check.string(title, `courses[${i}].title`, { max: 120 }),
      mark: mark == null ? null : String(mark).slice(0, 12),
      markNumeric: parseMark(mark),
      credits: check.number(credits, `courses[${i}].credits`, { min: 0, max: 4 }),
      area: check.oneOf(area, `courses[${i}].area`, AREAS),
      schoolYear: year ? String(year).slice(0, 16) : null,
      term: term ? String(term).slice(0, 40) : null,
      status: check.oneOf(status || "completed", `courses[${i}].status`, ["completed", "in_progress", "withdrawn"])
    };
  });

  let enrolledAt = null;
  if (body.enrolledOn) {
    const m = String(body.enrolledOn).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw ApiError.badRequest("enrolledOn must be a date: YYYY-MM-DD.", "enrolledOn");
    enrolledAt = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const standing = body.status == null ? null
    : check.oneOf(body.status, "status", ["active", "withdrawn", "graduated"]);
  const i = body.issued || {};
  const n = (v, f, max) => (v == null ? undefined : check.number(v, "issued." + f, { min: 0, max }));
  const issued = {
    gpa: n(i.gpa, "gpa", 5), gpaCredits: n(i.gpaCredits, "gpaCredits", 60),
    qualityPoints: n(i.qualityPoints, "qualityPoints", 300), creditsEarned: n(i.creditsEarned, "creditsEarned", 60),
    printedOn: i.printedOn ? check.string(i.printedOn, "issued.printedOn", { max: 10 }) : undefined
  };
  for (const k of Object.keys(issued)) if (issued[k] === undefined) delete issued[k];

  const saved = await ctx.repo.replaceEhsRecord({
    accountId, orgId: orgOf(actor), createdBy: actor.id,
    enrollment: { enrolledAt, status: standing, issued: Object.keys(issued).length ? issued : null },
    courses
  });
  const credits = Math.round(courses.filter((c) => c.status === "completed")
                                    .reduce((a, c) => a + c.credits, 0) * 1000) / 1000;
  return json({ record: { courses: saved.courses, credits, enrolledOn: body.enrolledOn || null,
                          status: standing } });
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
