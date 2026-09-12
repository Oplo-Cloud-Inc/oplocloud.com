/* ==========================================================================
   Reporting.

   The premise this file is built on: **a report card is a view, not a file.**

   Schools treat reporting as a build step — finalise the grades, pick a
   template, generate, check, publish — and the reason is historical. In a
   system where the gradebook and the report are different databases, the
   report has to be constructed, and constructing it is when the two can
   disagree. Everything then follows from that: a generation run, a queue, a
   sync, a window in which the printed number and the live number differ.

   None of that is true here. There is one record. A student's grade is
   `computeGrade` over their marks, and it is the same function whether the
   caller is the student's own screen, their teacher's sheet, or a report
   card. So the report does not need generating. It is already true, and this
   file only has to answer two questions about it:

     · Is it finished?   — readiness
     · What does it say?  — the report

   "Finished" is deliberately a question about the teacher's work, not about
   the software's. A report is not ready because a field is empty; it is not
   ready because somebody still owes a class their marking. Saying which, and
   whose, is the whole job — an administrator chasing a deadline needs a name
   and a number, not a percentage complete.
   ========================================================================== */

import { computeGrade, contribution } from "./grades.js";

/* Where a student's work in one course is going.

   Marked work in the order it was set, split down the middle, each half
   scored as a fraction. It is a crude measure and it is labelled as one: with
   fewer than four marks it returns nothing at all rather than calling two
   quizzes a direction. A trend line drawn through three points is a decoration
   that people read as a prediction. */
export function trendFor(grades) {
  const counted = grades
    .filter((g) => contribution(g))
    // The order the work was set, not the order it happened to be marked. A
    // teacher who marks last month's essays on Friday has not made them
    // recent, and sorting by when the marking happened would say they had.
    .sort((a, b) => (a.work_created_at || 0) - (b.work_created_at || 0));
  if (counted.length < 4) return null;

  const half = Math.floor(counted.length / 2);
  const fraction = (rows) => {
    let got = 0, of = 0;
    for (const r of rows) {
      const c = contribution(r);
      got += c.got; of += c.of;
    }
    return of > 0 ? got / of : null;
  };
  const before = fraction(counted.slice(0, half));
  const after = fraction(counted.slice(half));
  if (before == null || after == null) return null;

  const change = Math.round((after - before) * 100);
  return {
    change,
    // Three points of percentage either way is noise in a class of thirty
    // marks. Naming it as a direction would make every student "improving" or
    // "declining" every single term.
    direction: change >= 4 ? "up" : change <= -4 ? "down" : "steady",
    over: counted.length
  };
}

/* The strongest and weakest thing a student did, by category, so that a
   teacher writing a sentence about them is looking at the evidence for it
   rather than remembering. Only ever returned as the marks themselves — this
   file does not write the sentence. */
export function evidenceFor(grades, weights) {
  const scheme = (weights && weights.length) ? weights : [["Work", 100]];
  const known = new Set(scheme.map(([c]) => c));
  const first = scheme[0][0];
  const buckets = new Map();

  for (const g of grades) {
    const c = contribution(g);
    if (!c) continue;
    const cat = known.has(g.category) ? g.category : first;
    const b = buckets.get(cat) || { got: 0, of: 0, n: 0 };
    b.got += c.got; b.of += c.of; b.n++;
    buckets.set(cat, b);
  }

  const parts = [...buckets.entries()]
    .map(([category, b]) => ({ category, percent: Math.round((b.got / b.of) * 100), items: b.n }))
    .sort((a, b) => b.percent - a.percent);

  return {
    strongest: parts[0] || null,
    weakest: parts.length > 1 ? parts[parts.length - 1] : null,
    byCategory: parts
  };
}

/* Whether one student's report is finished, and if not, what is missing.

   Three states, and the difference between them is who has to act:

     ready         nothing is owed
     review        a person should look — the grade rests on very little, or
                   the marks and the comment appear to disagree
     blocked       a teacher still owes marks, and no amount of reviewing
                   fixes that

   `reasons` is prose because it goes straight onto an administrator's screen.
   "3 pieces of work unmarked in Geometry" is actionable; "incomplete" is a
   colour. */
export function readinessFor({ courseTitle, grades, assignments, summary, comment }) {
  const reasons = [];
  let state = "ready";

  const marked = new Set(
    grades.filter((g) => contribution(g)).map((g) => g.assignment_id)
  );
  const outstanding = assignments.filter((a) => !marked.has(a.id));
  if (outstanding.length) {
    state = "blocked";
    reasons.push({
      kind: "unmarked",
      text: outstanding.length + (outstanding.length === 1 ? " piece" : " pieces") +
            " of work unmarked in " + courseTitle,
      count: outstanding.length
    });
  }

  if (!summary) {
    state = "blocked";
    reasons.push({ kind: "no-grade", text: "No marks at all in " + courseTitle, count: 1 });
  } else if (summary.countedWeight < 50) {
    if (state !== "blocked") state = "review";
    reasons.push({
      kind: "thin",
      text: courseTitle + " rests on " + summary.countedWeight + "% of the grade",
      count: 1
    });
  }

  if (!comment || !String(comment.body || "").trim()) {
    if (state === "ready") state = "review";
    reasons.push({ kind: "no-comment", text: "No comment written for " + courseTitle, count: 1 });
  }

  /* The one check worth making against the words. A teacher writing under
     time pressure across thirty students can leave last term's sentence in
     place, and a comment that praises a student who is failing is the single
     most damaging thing a report card can carry — it is read by a family as
     "nothing is wrong". This looks only for that shape, names it as
     *possible*, and changes nothing. */
  if (summary && comment && comment.body) {
    const words = String(comment.body).toLowerCase();
    const warm = /\b(excellent|outstanding|superb|exceptional|a pleasure|delight|consistently strong)\b/.test(words);
    const cold = /\b(concern|worrying|struggl|must improve|significant improvement|failing|at risk)\b/.test(words);
    if (warm && summary.percent < 65) {
      if (state !== "blocked") state = "review";
      reasons.push({
        kind: "mismatch",
        text: "The comment for " + courseTitle + " reads warmly against a grade of " +
              summary.percent + "%",
        count: 1
      });
    } else if (cold && summary.percent >= 85) {
      if (state !== "blocked") state = "review";
      reasons.push({
        kind: "mismatch",
        text: "The comment for " + courseTitle + " raises concerns against a grade of " +
              summary.percent + "%",
        count: 1
      });
    }
  }

  return { state, reasons };
}

/* One student's report across every course they are enrolled in. Assembled
   from rows the caller has already read, so this stays a pure function and
   the route keeps the database. */
export function reportFor({ student, courses }) {
  const entries = [];
  let weighted = 0, weight = 0;

  for (const c of courses) {
    const summary = computeGrade(c.grades, c.weights);
    const entry = {
      courseId: c.course.id,
      title: c.course.title,
      subject: c.course.subject,
      grade: summary,
      trend: trendFor(c.grades),
      evidence: evidenceFor(c.grades, c.weights),
      comment: c.comment
        ? { body: c.comment.body, author: c.comment.author_name, updatedAt: c.comment.updated_at }
        : null,
      marks: c.grades.map((g) => ({
        assignmentId: g.assignment_id, title: g.title, category: g.category,
        score: g.score, outOf: g.out_of, status: g.status || "marked", feedback: g.feedback
      })),
      readiness: readinessFor({
        courseTitle: c.course.title, grades: c.grades, assignments: c.assignments,
        summary, comment: c.comment
      })
    };
    entries.push(entry);
    if (summary) { weighted += summary.percent; weight++; }
  }

  return {
    student,
    courses: entries,
    // The average of course grades, which is what a school means by "standing"
    // and is not a GPA — a GPA needs credits, and credits live in the
    // graduation service where the transcript is.
    standing: weight ? Math.round(weighted / weight) : null,
    courseCount: entries.length,
    state: entries.some((e) => e.readiness.state === "blocked") ? "blocked"
         : entries.some((e) => e.readiness.state === "review") ? "review" : "ready"
  };
}
