/* ==========================================================================
   Grades.

   The service layer is where domain rules live: the repository knows how to
   store a score, and this knows what a score means.

   The rule that matters most is the one about incomplete work. A course
   graded 35% quizzes, 35% assignments, 30% exams, where the exams have not
   been sat, is not a course the student has scored zero on. Counting an
   unmarked category as zero is the single most common way a gradebook lies to
   a student, so categories with nothing in them are left out of the divisor
   and the response says what fraction of the grade the mark is computed over.

   The same rule runs one level down, over each piece of work:

     marked, with a score   counts
     marked, with no score  waiting on the teacher — left out
     missing                counts as zero, because it is a zero
     excused                left out of the divisor entirely

   The difference between the second and the third is the whole reason the
   status column exists. They look identical in a grid and they are opposites
   in a grade.
   ========================================================================== */

export function letterFor(pct) {
  return pct >= 93 ? "A"  : pct >= 90 ? "A-" : pct >= 87 ? "B+" : pct >= 83 ? "B"
       : pct >= 80 ? "B-" : pct >= 77 ? "C+" : pct >= 73 ? "C"  : pct >= 70 ? "C-"
       : pct >= 67 ? "D+" : pct >= 63 ? "D"  : pct >= 60 ? "D-" : "F";
}

/* What one row contributes: a fraction of the work, or nothing at all.
   `null` means "this does not enter the grade", which is a different answer
   from zero and is the one the rest of this file depends on.

   `policy` carries the course's own rules. Called without it, this behaves
   exactly as it did before any of them existed, which is what keeps every
   other caller honest. */
export function contribution(g, policy) {
  if (!g || !(g.out_of > 0)) return null;
  if (g.status === "excused") return null;

  const extra = !!(g.extra_credit);

  /* Optional work nobody did is not a failure at it. Extra credit that is
     missing or unmarked contributes nothing at all — counting it as a zero
     would make offering extra credit a way to lower grades. */
  if (extra) {
    if (g.status === "missing" || g.score == null) return null;
    return { got: Number(g.score), of: 0, extra: true };
  }

  if (g.status === "missing") return { got: 0, of: Number(g.out_of) };
  if (g.score == null) return null;

  const of = Number(g.out_of);
  let got = Number(g.score);

  /* A flat percentage of what the work was out of, floored at nothing. The
     deduction is reported rather than folded in silently: a student looking
     at 16/20 is owed the fact that they earned 18. */
  let penalty = 0;
  if (g.late && policy && policy.latePenalty > 0) {
    penalty = Math.min(got, of * (policy.latePenalty / 100));
    got = got - penalty;
  }
  return penalty > 0 ? { got, of, penalty, earned: Number(g.score) } : { got, of };
}

/* The course's rules, read off the same body the weights come from. */
export function coursePolicy(course) {
  if (!course || !course.body_json) return { latePenalty: 0, drop: {} };
  try {
    const body = JSON.parse(course.body_json);
    const late = Number(body.latePenalty);
    return {
      latePenalty: isFinite(late) && late > 0 ? Math.min(late, 100) : 0,
      drop: (body.drop && typeof body.drop === "object") ? body.drop : {}
    };
  } catch { return { latePenalty: 0, drop: {} }; }
}

/* `weights` is the course's own grading scheme: [["Quizzes", 35], ...]. When
   a course has none, everything counts equally, which is the honest default
   rather than an invented one. */
export function computeGrade(grades, weights, policy) {
  const rules = policy || { latePenalty: 0, drop: {} };
  const counting = [];
  for (const g of grades) {
    const c = contribution(g, rules);
    if (c) counting.push({ ...g, got: c.got, of: c.of, extra: !!c.extra,
                           penalty: c.penalty || 0, earned: c.earned });
  }
  if (!counting.length) return null;

  const scheme = (weights && weights.length) ? weights : [["Work", 100]];
  const weightOf = new Map(scheme.map(([cat, w]) => [cat, w]));
  const firstCat = scheme[0][0];

  const catOf = (g) => (weightOf.has(g.category) ? g.category : firstCat);

  /* Drop the lowest, where the course says to.

     By fraction of the work rather than by raw points, because 8/10 and 80/100
     are the same performance and dropping the second one because the number
     is bigger would be arithmetic pretending to be a policy.

     Extra credit is never dropped — it is not part of what was asked for. And
     the last mark in a category is never dropped either: a teacher who writes
     "drop 2" for a category holding two quizzes means "be generous", not
     "remove this category from their grade", and silently deleting a whole
     weight is not a reading anybody intends. */
  const dropped = [];
  for (const [cat] of scheme) {
    const n = Math.floor(Number(rules.drop && rules.drop[cat]) || 0);
    if (n < 1) continue;
    const inCat = counting.filter((g) => !g.extra && catOf(g) === cat && g.of > 0);
    if (inCat.length <= 1) continue;
    const worst = inCat
      .slice()
      .sort((a, b) => (a.got / a.of) - (b.got / b.of))
      .slice(0, Math.min(n, inCat.length - 1));
    for (const g of worst) {
      g.dropped = true;
      dropped.push({ assignmentId: g.assignment_id, title: g.title, category: cat,
                     score: g.score, outOf: g.out_of, status: g.status || "marked" });
    }
  }

  const buckets = new Map();
  for (const g of counting) {
    if (g.dropped) continue;
    const cat = catOf(g);
    const b = buckets.get(cat) || { got: 0, of: 0, n: 0 };
    b.got += g.got;
    b.of += g.of;
    b.n++;
    buckets.set(cat, b);
  }

  let total = 0, counted = 0;
  const parts = [];
  for (const [cat, weight] of scheme) {
    const b = buckets.get(cat);
    // A bucket holding nothing but extra credit has no denominator. It cannot
    // be scored as a fraction and must not be divided by zero either.
    if (!b || !b.of) continue;
    const pct = b.got / b.of;
    total += pct * weight;
    counted += weight;
    parts.push({ category: cat, percent: Math.round(pct * 100), items: b.n, weight });
  }
  if (!counted) return null;

  /* Deliberately uncapped. Extra credit can take a category past 100%, and
     with it the course, and that is the arithmetic of the rules the school
     wrote rather than a fault in them. A ceiling is itself a policy; applying
     one nobody asked for would be the engine overruling the teacher, and it
     would do it silently, which is worse. `extraCredit` below says how much
     of the number came from where, so a screen can explain a 105%. */
  const percent = Math.round((total / counted) * 100);
  return {
    percent,
    letter: letterFor(percent),
    parts,
    // What fraction of the final grade this is actually computed over. A
    // client that shows 94% without showing "over 70% of the course" is
    // showing a number that will move.
    countedWeight: counted,
    totalWeight: scheme.reduce((a, [, w]) => a + w, 0),
    itemCount: counting.filter((g) => !g.dropped).length,
    missingCount: grades.filter((g) => g.status === "missing").length,
    /* What the rules did, named. A policy that changes a grade without saying
       so is indistinguishable from a bug, and the person least able to
       investigate it is the student it was applied to. */
    dropped,
    lateCount: counting.filter((g) => g.penalty > 0).length,
    latePenalty: counting.reduce((a, g) => a + (g.penalty || 0), 0) || 0,
    extraCredit: counting.filter((g) => g.extra && !g.dropped)
                         .reduce((a, g) => a + g.got, 0) || 0
  };
}

/* ------------------------------------------------------------- The class

   What a teacher needs to know before they need any individual number: what
   is still owed to them, and who is in trouble. Computed here rather than in
   the browser so that the strip at the top of the gradebook and the grade in
   the cell can never disagree — they are the same arithmetic, run once.

   `overdue` is deliberately narrow. Work with no due date, or a due date still
   to come, is not late; a teacher who has not marked yesterday's quiz is not
   behind on next month's essay, and a screen that says otherwise is a screen
   people learn to ignore. */
export function classSignal({ students, assignments, byPair, now = Date.now() }) {
  const columns = assignments.map((a) => {
    let marked = 0, missing = 0, excused = 0, blank = 0, got = 0, of = 0;
    for (const s of students) {
      const g = byPair.get(a.id + ":" + s.id);
      if (!g) { blank++; continue; }
      if (g.status === "excused") { excused++; continue; }
      if (g.status === "missing") { missing++; of += Number(a.out_of) || 0; continue; }
      if (g.score == null) { blank++; continue; }
      marked++; got += Number(g.score); of += Number(g.out_of ?? a.out_of) || 0;
    }
    const due = a.due_at || null;
    return {
      assignmentId: a.id,
      marked, missing, excused,
      unmarked: blank,
      // What the class scored on this, over everything that counts towards a
      // grade — which includes a zero for work nobody handed in. An average
      // that quietly drops those flatters the class and the teacher both.
      average: of > 0 ? Math.round((got / of) * 100) : null,
      overdue: !!(due && due < now && blank > 0)
    };
  });

  const needs = [];
  for (const c of columns) {
    if (!c.unmarked) continue;
    const a = assignments.find((x) => x.id === c.assignmentId);
    needs.push({
      kind: c.overdue ? "overdue" : "unmarked",
      assignmentId: a.id, title: a.title, count: c.unmarked, dueAt: a.due_at || null
    });
  }
  // Most owed first: a teacher opens this to find the biggest pile.
  needs.sort((x, y) => (x.kind === y.kind ? y.count - x.count : x.kind === "overdue" ? -1 : 1));

  return { columns, needs };
}

export function courseWeights(course) {
  if (!course || !course.body_json) return null;
  try {
    const body = JSON.parse(course.body_json);
    return Array.isArray(body.grading) ? body.grading : null;
  } catch { return null; }
}
