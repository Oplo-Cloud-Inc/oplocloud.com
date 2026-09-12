/* ==========================================================================
   /api/v1/teaching, /api/v1/reporting/*

   Two screens' worth of questions, and both are aggregates: "what do I owe
   across every class I teach" and "is this term's reporting finished". Neither
   can be answered by a client holding one course at a time, and a client that
   tries answers it in six requests that can disagree with each other.

   The cost is honest and worth stating: both endpoints read every course the
   caller teaches, and every mark in them. For a teacher with five classes that
   is fifteen queries against rows that are already indexed by course. For a
   school-wide reporting sweep it would not be, which is why `reporting` is
   scoped to the courses the caller teaches and takes a `courseId` to narrow
   further — there is deliberately no "every student in the school" call here
   until there is a marking-period model to bound it.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, teachesStudent, isLearnAdmin } from "../core/guard.js";
import { computeGrade, courseWeights, coursePolicy, classSignal } from "../services/grades.js";
import { readinessFor, reportFor } from "../services/reporting.js";

/* The courses this person teaches. An administrator is not automatically a
   teacher of everything — an admin who teaches two classes sees two classes
   here, and reaches the rest through the school's own screens. */
async function myCourses(ctx, actor) {
  const all = await ctx.repo.listCourses({ accountId: actor.id });
  return all.filter((c) => c.my_role === "teacher" || c.my_role === "assistant");
}

/* One course, read whole. The three reads every aggregate below needs. */
async function loadCourse(ctx, course) {
  const [members, assignments, grades] = await Promise.all([
    ctx.repo.listCourseMembers(course.id),
    ctx.repo.listAssignments(course.id),
    ctx.repo.listGrades({ courseId: course.id, accountId: null })
  ]);
  const students = members
    .filter((m) => m.role === "student")
    .map((m) => ({ id: m.id, name: m.name, firstName: m.first_name, email: m.email,
                   initials: m.initials, hue: m.avatar_hue }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const byPair = new Map();
  const byStudent = new Map();
  for (const g of grades) {
    byPair.set(g.assignment_id + ":" + g.account_id, g);
    if (!byStudent.has(g.account_id)) byStudent.set(g.account_id, []);
    byStudent.get(g.account_id).push(g);
  }
  return { course, students, assignments, grades, byPair, byStudent,
           weights: courseWeights(course), policy: coursePolicy(course) };
}

/* GET /api/v1/teaching

   Everything the console's first screen shows, for every class at once: how
   many students, what is owed, how the class is doing, and who is not doing
   well. A teacher opens this before they open anything else, so it must be
   one request and it must be the truth rather than a cache. */
export async function teaching(ctx) {
  const actor = requireActor(ctx);
  const courses = await myCourses(ctx, actor);

  const out = [];
  let owed = 0, overdue = 0, atRisk = 0, students = 0;

  for (const course of courses) {
    const c = await loadCourse(ctx, course);
    const signal = classSignal({ students: c.students, assignments: c.assignments,
                                 byPair: c.byPair });

    let sum = 0, graded = 0, low = 0;
    for (const s of c.students) {
      const computed = computeGrade(c.byStudent.get(s.id) || [], c.weights, c.policy);
      if (!computed) continue;
      sum += computed.percent;
      graded++;
      // Below a pass, on what has actually been marked. Not a prediction and
      // not a label on the student — a list of who to look at first.
      if (computed.percent < 70) low++;
    }

    const unmarked = signal.columns.reduce((a, col) => a + col.unmarked, 0);
    const late = signal.needs.filter((n) => n.kind === "overdue")
                             .reduce((a, n) => a + n.count, 0);
    owed += unmarked;
    overdue += late;
    atRisk += low;
    students += c.students.length;

    out.push({
      id: course.id, code: course.code, title: course.title, subject: course.subject,
      students: c.students.length,
      work: c.assignments.length,
      unmarked, overdue: late, atRisk: low,
      average: graded ? Math.round(sum / graded) : null,
      needs: signal.needs.slice(0, 2)
    });
  }

  // Most owed first. A teacher opening this wants the pile, not the alphabet.
  out.sort((a, b) => (b.overdue - a.overdue) || (b.unmarked - a.unmarked));

  return json({
    courses: out,
    totals: { courses: out.length, students, unmarked: owed, overdue, atRisk }
  });
}

/* GET /api/v1/students

   Every student the caller teaches, once, with their standing in each class
   they share with them. A teacher thinks in people as often as they think in
   classes — "how is Jason doing" is not a question about a course — and a
   roster that can only be reached by opening a class first makes that the
   long way round.

   A student in three of the caller's classes is one row with three entries,
   not three rows. That is the whole reason this is not just the gradebook
   asked twice. */
export async function students(ctx) {
  const actor = requireActor(ctx);
  const courses = await myCourses(ctx, actor);

  const people = new Map();
  for (const course of courses) {
    const c = await loadCourse(ctx, course);
    for (const s of c.students) {
      const grades = c.byStudent.get(s.id) || [];
      const summary = computeGrade(grades, c.weights, c.policy);
      const marked = new Set(grades.filter((g) => g.score != null ||
                                                  g.status === "missing" ||
                                                  g.status === "excused")
                                   .map((g) => g.assignment_id));
      const entry = people.get(s.id) || { ...s, courses: [] };
      entry.courses.push({
        courseId: course.id,
        title: course.title,
        subject: course.subject,
        grade: summary ? { percent: summary.percent, letter: summary.letter,
                           countedWeight: summary.countedWeight } : null,
        missing: grades.filter((g) => g.status === "missing").length,
        unmarked: c.assignments.filter((a) => !marked.has(a.id)).length
      });
      people.set(s.id, entry);
    }
  }

  const rows = [...people.values()].map((p) => {
    const graded = p.courses.filter((c) => c.grade);
    return {
      ...p,
      // The mean of their course grades. Not a GPA — a GPA needs credits, and
      // credits live with the transcript.
      standing: graded.length
        ? Math.round(graded.reduce((a, c) => a + c.grade.percent, 0) / graded.length)
        : null,
      missing: p.courses.reduce((a, c) => a + c.missing, 0),
      unmarked: p.courses.reduce((a, c) => a + c.unmarked, 0)
    };
  }).sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  return json({
    students: rows,
    totals: {
      students: rows.length,
      belowPass: rows.filter((r) => r.standing != null && r.standing < 70).length,
      missing: rows.reduce((a, r) => a + r.missing, 0)
    }
  });
}

/* GET /api/v1/activity?limit=

   What has happened to the marks in the caller's classes, newest first. It is
   the grade history read across courses rather than down one, and it exists
   for the same reason the history does: a record of academic work that cannot
   be reviewed is not a record.

   Deliberately only the things that change a student's grade. A log of every
   page somebody opened would be surveillance of teachers, which is a thing
   this product is not going to build. */
export async function activity(ctx) {
  const actor = requireActor(ctx);
  const courses = await myCourses(ctx, actor);
  const events = await ctx.repo.listGradeEventsForCourses(
    courses.map((c) => c.id),
    Number(ctx.url.searchParams.get("limit")) || 60
  );

  return json({
    events: events.map((e) => ({
      id: e.id, assignmentId: e.assignment_id, accountId: e.account_id,
      courseId: e.course_id, courseTitle: e.course_title, title: e.title,
      student: { id: e.account_id, name: e.student_name,
                 initials: e.student_initials, hue: e.student_hue },
      fromScore: e.from_score, fromStatus: e.from_status,
      toScore: e.to_score, toStatus: e.to_status, outOf: e.assignment_out_of,
      note: e.note, actorId: e.actor_id, actorName: e.actor_name, at: e.at
    }))
  });
}

/* GET /api/v1/reporting?courseId=&term=

   Is this term's reporting finished, and if not, whose fault is that. One row
   per student per course, with prose reasons rather than a percentage. */
export async function readiness(ctx) {
  const actor = requireActor(ctx);
  const term = ctx.url.searchParams.get("term") || "current";
  const only = ctx.url.searchParams.get("courseId");

  let courses = await myCourses(ctx, actor);
  if (only) {
    courses = courses.filter((c) => c.id === only);
    if (!courses.length) {
      // Either it does not exist or they do not teach it. `must` decides which
      // and says so in the sentence it throws.
      await must(ctx, "grade.read", { courseId: only });
      const row = await ctx.repo.findCourse(only);
      if (!row) throw ApiError.notFound("No such course.");
      courses = [{ ...row, my_role: "teacher" }];
    }
  }

  const rows = [];
  const perCourse = [];

  for (const course of courses) {
    const c = await loadCourse(ctx, course);
    const comments = await ctx.repo.listReportComments({ courseId: course.id, term });
    const commentFor = new Map(comments.map((x) => [x.account_id, x]));

    let ready = 0, review = 0, blocked = 0;
    for (const s of c.students) {
      const grades = c.byStudent.get(s.id) || [];
      const summary = computeGrade(grades, c.weights, c.policy);
      const state = readinessFor({
        courseTitle: course.title, grades, assignments: c.assignments,
        summary, comment: commentFor.get(s.id)
      });
      if (state.state === "ready") ready++;
      else if (state.state === "review") review++;
      else blocked++;

      rows.push({
        courseId: course.id, courseTitle: course.title,
        student: s,
        grade: summary ? { percent: summary.percent, letter: summary.letter,
                           countedWeight: summary.countedWeight } : null,
        comment: (commentFor.get(s.id) || {}).body || null,
        state: state.state, reasons: state.reasons
      });
    }
    perCourse.push({ id: course.id, title: course.title, subject: course.subject,
                     students: c.students.length, ready, review, blocked });
  }

  const counts = rows.reduce((a, r) => { a[r.state]++; return a; },
                             { ready: 0, review: 0, blocked: 0 });

  return json({
    term,
    courses: perCourse,
    rows,
    counts,
    // What a school actually asks: can we send these out. Deliberately not a
    // percentage — 97% ready is a sentence that hides four children.
    publishable: counts.blocked === 0 && rows.length > 0
  });
}

/* PUT /api/v1/reporting/comment — the sentence about the term.

   Written by a teacher of the course, about a student in it. The same rule as
   a grade, for the same reason: it is a statement a school publishes about a
   child, and the list of people who may make one is short. */
export async function putComment(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const courseId = check.string(body.courseId, "courseId", { max: 64 });
  const accountId = check.string(body.accountId, "accountId", { max: 64 });
  const term = body.term ? check.string(body.term, "term", { max: 32 }) : "current";

  await must(ctx, "grade.write", { courseId, accountId });

  const membership = await ctx.repo.courseMembership(courseId, accountId);
  if (!membership || membership.role !== "student") {
    throw ApiError.badRequest("That student is not enrolled in this course.", "accountId");
  }

  const text = body.body == null ? null
    : check.string(body.body, "body", { min: 0, max: 4000 });
  const comment = await ctx.repo.upsertReportComment({
    courseId, accountId, term, body: text, actorId: actor.id
  });
  return json({ comment: shapeComment(comment) });
}

function shapeComment(c) {
  return c ? {
    id: c.id, courseId: c.course_id, courseTitle: c.course_title,
    accountId: c.account_id, term: c.term, body: c.body,
    author: c.author_name, updatedAt: c.updated_at
  } : null;
}

/* GET /api/v1/students/:accountId/report?term=

   One student's report, across every course they are enrolled in — which is
   the thing schools print, assembled on request because it was never anywhere
   else. Nothing is generated and nothing is stored: ask again after a mark
   changes and the answer has changed.

   Readable by the student, by their teachers, and by an administrator. The
   student sees their own report exactly as their school does, because a
   document about somebody that they are not allowed to read is a strange
   thing for a school to produce. */
export async function report(ctx, { accountId }) {
  const actor = requireActor(ctx);
  const term = ctx.url.searchParams.get("term") || "current";

  const mine = accountId === actor.id;
  if (!mine) {
    const allowed = isLearnAdmin(actor) || (await teachesStudent(ctx, actor, accountId));
    if (!allowed) {
      throw ApiError.forbidden(
        "You do not teach this student, so their report is not yours to read.");
    }
  }

  const account = await ctx.repo.findAccountById(accountId);
  if (!account) throw ApiError.notFound("No such account.");

  const enrolled = (await ctx.repo.listCourses({ accountId }))
    .filter((c) => c.my_role === "student");

  const comments = await ctx.repo.listReportComments({ accountId, term });
  const commentFor = new Map(comments.map((x) => [x.course_id, x]));

  const courses = [];
  for (const course of enrolled) {
    const [assignments, grades] = await Promise.all([
      ctx.repo.listAssignments(course.id),
      ctx.repo.listGrades({ courseId: course.id, accountId })
    ]);
    courses.push({ course, assignments, grades, weights: courseWeights(course),
                   policy: coursePolicy(course),
                   comment: commentFor.get(course.id) || null });
  }

  return json({
    term,
    report: reportFor({
      student: { id: account.id, name: account.name, firstName: account.first_name,
                 initials: account.initials, hue: account.avatar_hue, email: account.email },
      courses
    })
  });
}
