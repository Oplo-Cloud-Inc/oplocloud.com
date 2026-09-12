/* ==========================================================================
   /api/v1/grades/*

   The endpoint the whole architecture is being proved against: a teacher
   writes here on one device, and a student reads it on another.

   The asymmetry is enforced in guard.js, not here — a student may read their
   own grades and there is no path by which they may write one. It is worth
   saying twice because it is the single rule that would matter most if it
   were wrong.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { computeGrade, courseWeights, classSignal } from "../services/grades.js";

const STATUSES = ["marked", "missing", "excused"];

function shape(g) {
  return {
    id: g.id, assignmentId: g.assignment_id, accountId: g.account_id,
    courseId: g.course_id, title: g.title, category: g.category,
    score: g.score, outOf: g.out_of, status: g.status || "marked",
    feedback: g.feedback, gradedBy: g.graded_by, gradedAt: g.graded_at
  };
}

function shapeEvent(e) {
  return {
    id: e.id, assignmentId: e.assignment_id, accountId: e.account_id,
    title: e.title, fromScore: e.from_score, fromStatus: e.from_status,
    toScore: e.to_score, toStatus: e.to_status, outOf: e.assignment_out_of,
    note: e.note, actorId: e.actor_id, actorName: e.actor_name, at: e.at
  };
}

/* GET /api/v1/grades?courseId=&accountId=
   Defaults to the caller's own grades, which is the common case and the one
   that must never require a client to name itself. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const courseId = ctx.url.searchParams.get("courseId") || null;
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;

  await must(ctx, "grade.read", { accountId, courseId });

  const rows = await ctx.repo.listGrades({ courseId, accountId });
  const out = { grades: rows.map(shape) };

  // The computed mark, per course, so a client never has to re-implement the
  // weighting — and so two clients can never disagree about a student's grade.
  const byCourse = new Map();
  for (const g of rows) {
    if (!byCourse.has(g.course_id)) byCourse.set(g.course_id, []);
    byCourse.get(g.course_id).push(g);
  }
  out.summaries = [];
  for (const [cid, list] of byCourse) {
    const course = await ctx.repo.findCourse(cid);
    const computed = computeGrade(list, courseWeights(course));
    if (computed) out.summaries.push({ courseId: cid, courseTitle: course && course.title, ...computed });
  }
  return json(out);
}

/* GET /api/v1/courses/:courseId/gradebook

   A whole class, in one request.

   It replaces the shape the console used to assemble by hand: the members,
   then the assignments, then a grade call per student, then a standing call
   per student — sixty-odd requests to draw one register, each of them able to
   fail on its own and leave the screen half true. A gradebook is one object
   and it should arrive as one.

   It is also the only sensible place to compute the class's averages and what
   is still owed, because those are questions about the whole matrix and a
   client holding one row at a time cannot answer them. */
export async function gradebook(ctx, { courseId }) {
  requireActor(ctx);

  const course = await ctx.repo.findCourse(courseId);
  if (!course) throw ApiError.notFound("No such course.");

  // Reading a whole class is the teacher's permission, not a student's. A
  // student reading their own grade names themselves and takes the branch in
  // guard.js that lets them; there is no accountId here to name.
  await must(ctx, "grade.read", { courseId, orgId: course.org_id });

  const [members, assignments, grades] = await Promise.all([
    ctx.repo.listCourseMembers(courseId),
    ctx.repo.listAssignments(courseId),
    ctx.repo.listGrades({ courseId, accountId: null })
  ]);

  const students = members
    .filter((m) => m.role === "student")
    .map((m) => ({
      id: m.id, name: m.name, firstName: m.first_name, email: m.email,
      initials: m.initials, hue: m.avatar_hue
    }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const byPair = new Map();
  const byStudent = new Map();
  for (const g of grades) {
    byPair.set(g.assignment_id + ":" + g.account_id, g);
    if (!byStudent.has(g.account_id)) byStudent.set(g.account_id, []);
    byStudent.get(g.account_id).push(g);
  }

  const weights = courseWeights(course);
  const summaries = {};
  for (const s of students) {
    const computed = computeGrade(byStudent.get(s.id) || [], weights);
    if (computed) summaries[s.id] = computed;
  }

  const signal = classSignal({ students, assignments, byPair });

  return json({
    course: {
      id: course.id, code: course.code, title: course.title,
      subject: course.subject, grading: weights || [["Work", 100]]
    },
    students,
    assignments: assignments.map((a) => ({
      id: a.id, title: a.title, category: a.category, outOf: a.out_of,
      dueAt: a.due_at, status: a.status
    })),
    grades: grades.map(shape),
    summaries,
    columns: signal.columns,
    needs: signal.needs
  });
}

/* One mark, validated. Shared by the single write and the batch, so a mark
   entered by tabbing across a row and a mark entered by filling a column are
   subject to the same rules — there is no cheap path into this table. */
async function writeOne(ctx, actor, entry, cache) {
  const assignmentId = check.string(entry.assignmentId, "assignmentId", { max: 64 });
  const accountId = check.string(entry.accountId, "accountId", { max: 64 });

  let assignment = cache ? cache.assignments.get(assignmentId) : null;
  if (!assignment) {
    assignment = await ctx.repo.findAssignment(assignmentId);
    if (!assignment) throw ApiError.notFound("No such assignment.");
    if (cache) cache.assignments.set(assignmentId, assignment);
  }

  const courseKey = assignment.course_id;
  if (!cache || !cache.allowed.has(courseKey)) {
    await must(ctx, "grade.write", { courseId: courseKey, accountId });
    if (cache) cache.allowed.add(courseKey);
  }

  // A mark for somebody not in the course is a mistake, and silently storing
  // it produces a grade nobody can find later.
  const memberKey = courseKey + ":" + accountId;
  let membership = cache ? cache.members.get(memberKey) : undefined;
  if (membership === undefined) {
    membership = await ctx.repo.courseMembership(courseKey, accountId);
    if (cache) cache.members.set(memberKey, membership);
  }
  if (!membership || membership.role !== "student") {
    throw ApiError.badRequest("That student is not enrolled in this course.", "accountId");
  }

  const status = entry.status === undefined ? undefined
    : check.string(entry.status, "status", { max: 16 });
  if (status !== undefined && STATUSES.indexOf(status) < 0) {
    throw ApiError.badRequest(
      "A grade is marked, missing or excused — nothing else.", "status");
  }

  const outOf = check.number(entry.outOf ?? assignment.out_of, "outOf",
    { min: 0.01, max: 100000 });
  const score = entry.score === undefined ? undefined
    : check.number(entry.score, "score", { min: 0, max: 100000, allowNull: true });
  if (score != null && score !== undefined && score > outOf * 1.5) {
    throw ApiError.badRequest("That score is far above what the work is out of.", "score");
  }
  // Missing and excused are statements about work that has no score. Letting
  // a number ride along with one produces a row that means two things.
  if (status && status !== "marked" && score != null) {
    throw ApiError.badRequest(
      "Work marked " + status + " cannot also carry a score.", "score");
  }

  return ctx.repo.upsertGrade({
    assignmentId, accountId, outOf,
    score: status && status !== "marked" ? null : score,
    status,
    feedback: entry.feedback === undefined ? undefined
      : (entry.feedback === null ? null
         : check.string(entry.feedback, "feedback", { min: 0, max: 4000 })),
    note: entry.note ? check.string(entry.note, "note", { min: 0, max: 500 }) : null,
    gradedBy: actor.id
  });
}

/* The student's whole grade in that course, recomputed after a write.

   It travels back with the mark so that the screen that entered it can show
   the new grade without asking, and — the part that matters — without doing
   the arithmetic. There is one implementation of the weighting and it is this
   one. A client that adds up its own columns is a second implementation, and
   two implementations of a grade disagree eventually. */
async function summaryFor(ctx, courseId, accountId) {
  const course = await ctx.repo.findCourse(courseId);
  const rows = await ctx.repo.listGrades({ courseId, accountId });
  const computed = computeGrade(rows, courseWeights(course));
  return computed ? { courseId, accountId, ...computed } : null;
}

/* PUT /api/v1/grades — enter or change one mark. */
export async function put(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const grade = await writeOne(ctx, actor, body, null);
  return json({
    grade: shape(grade),
    summary: await summaryFor(ctx, grade.course_id, grade.account_id)
  });
}

/* POST /api/v1/grades/batch — many marks, one request.

   What this is for: filling a column. "Everyone I have not marked did not
   hand it in" is one decision a teacher makes once, and making them make it
   thirty times is the kind of thing that turns a two-minute job into an
   evening.

   The writes are sequential rather than a single transaction, which is worth
   being honest about: a failure halfway through leaves the earlier marks
   written. That is the right trade here — each mark is independently
   meaningful, and the alternative is a batch that rejects thirty good marks
   because the thirty-first names a student who has left the course. The
   response says exactly which entries were written and which were refused. */
export async function batch(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const entries = Array.isArray(body.grades) ? body.grades : null;
  if (!entries || !entries.length) {
    throw ApiError.badRequest("Send a non-empty `grades` array.", "grades");
  }
  if (entries.length > 200) {
    throw ApiError.badRequest("That is more than 200 marks in one request.", "grades");
  }

  // Permission, the assignment and the enrolment are the same three questions
  // for every entry in a column. Asking them once per entry would make a
  // class of thirty into a hundred and twenty queries.
  const cache = { assignments: new Map(), members: new Map(), allowed: new Set() };
  const written = [], refused = [], touched = new Map();
  for (const entry of entries) {
    try {
      const grade = await writeOne(ctx, actor, entry, cache);
      written.push(shape(grade));
      touched.set(grade.course_id + ":" + grade.account_id,
                  [grade.course_id, grade.account_id]);
    } catch (e) {
      refused.push({
        assignmentId: entry && entry.assignmentId, accountId: entry && entry.accountId,
        message: e && e.message ? e.message : "Refused."
      });
    }
  }

  const summaries = {};
  for (const [courseId, accountId] of touched.values()) {
    const s = await summaryFor(ctx, courseId, accountId);
    if (s) summaries[accountId] = s;
  }
  return json({ grades: written, refused, summaries });
}

/* POST /api/v1/grades/undo — put a mark back to what it was.

   The history already holds both sides of every change, so undo is not a new
   mechanism: it is a normal write of the value the event says was there
   before. Which means it is checked by the same rule, recorded as its own
   event, and itself undoable.

   Nothing is erased. An undo that removed the mistake from the record would
   be a worse record than one that keeps it — "this was 92, then 72 for eleven
   minutes, then 92 again" is the true story, and the eleven minutes are
   exactly what somebody asking about it wants to know. */
export async function undo(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const eventId = check.string(body.eventId, "eventId", { max: 64 });

  const event = await ctx.repo.findGradeEvent(eventId);
  if (!event) throw ApiError.notFound("No such change.");

  await must(ctx, "grade.write",
    { courseId: event.course_id, accountId: event.account_id });

  // The first event on a mark has no "before" — undoing it means returning
  // the cell to unmarked, which is a real state and not a deletion.
  const grade = await ctx.repo.upsertGrade({
    assignmentId: event.assignment_id,
    accountId: event.account_id,
    score: event.from_score,
    status: event.from_status || "marked",
    note: "Undo of a change made " + new Date(event.at).toISOString(),
    gradedBy: actor.id
  });

  return json({
    grade: shape(grade),
    summary: await summaryFor(ctx, grade.course_id, grade.account_id)
  });
}

/* GET /api/v1/grades/history?assignmentId=&accountId=&courseId=

   Who changed this mark, from what, to what, and when. Readable by whoever
   may read the grade it describes — a student may see the history of their
   own mark, which is the point: a grade that can be changed without the
   person it is about being able to see that it was is not a record. */
export async function history(ctx) {
  const actor = requireActor(ctx);
  const assignmentId = ctx.url.searchParams.get("assignmentId") || null;
  const accountId = ctx.url.searchParams.get("accountId") || null;
  let courseId = ctx.url.searchParams.get("courseId") || null;

  if (assignmentId && !courseId) {
    const a = await ctx.repo.findAssignment(assignmentId);
    if (!a) throw ApiError.notFound("No such assignment.");
    courseId = a.course_id;
  }
  if (!courseId && !accountId) {
    throw ApiError.badRequest("Name an assignment, a course or an account.", "courseId");
  }

  // Naming a student asks whether you may read that student's grade; naming
  // no student asks for the whole course, which is a teacher's question. The
  // two must not collapse into one check, or a student asking for a course
  // would pass it by being themselves and be handed the class.
  if (accountId) await must(ctx, "grade.read", { courseId, accountId });
  else await must(ctx, "grade.read", { courseId });

  const events = await ctx.repo.listGradeEvents({
    assignmentId, accountId, courseId,
    limit: Number(ctx.url.searchParams.get("limit")) || 50
  });
  return json({ events: events.map(shapeEvent) });
}
