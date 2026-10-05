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

const DEFAULT_SCALE = [[93, "A"], [90, "A-"], [87, "B+"], [83, "B"], [80, "B-"], [77, "C+"],
                       [73, "C"], [70, "C-"], [67, "D+"], [63, "D"], [60, "D-"], [0, "F"]];

/* The mark a percent earns. A course may bring its own scale — A/B/C/D/F
   without the plusses, E/S/N, 4/3/2/1, pass and fail — as [[least percent,
   mark], ...]; without one it is the scale every course had before. The
   lowest mark on a scale catches everything beneath it. */
export function letterFor(pct, scale) {
  const steps = (scale && scale.length) ? scale : DEFAULT_SCALE;
  for (const [min, mark] of steps) if (pct >= min) return mark;
  return steps[steps.length - 1][1];
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

  const of = Number(g.out_of);
  /* A floor, where the course sets one: nothing counts for less than this
     share of what it was out of, so one missed piece or one bombed test can
     be recovered from. It is the course's rule and the summary says how many
     marks it lifted. */
  const least = policy && policy.minScore > 0 ? of * (policy.minScore / 100) : 0;

  if (g.status === "missing") return least ? { got: least, of, floored: true } : { got: 0, of };
  if (g.score == null) return null;

  let got = Number(g.score);

  /* A flat percentage of what the work was out of, floored at nothing. The
     deduction is reported rather than folded in silently: a student looking
     at 16/20 is owed the fact that they earned 18. */
  let penalty = 0;
  if (g.late && policy && policy.latePenalty > 0) {
    penalty = Math.min(got, of * (policy.latePenalty / 100));
    got = got - penalty;
  }
  const floored = got < least;
  if (floored) got = least;
  const out = penalty > 0 ? { got, of, penalty, earned: Number(g.score) } : { got, of };
  if (floored) out.floored = true;
  return out;
}

/* The course's rules, read off the same body the weights come from.

   `overrides` are the grades a teacher set by hand, one document per student
   (learn_course_docs, kind `override`). They are kept out of the course's
   body because the body is readable by everyone in the course, and one
   student's override is nobody else's to read. */
export function coursePolicy(course, overrides) {
  const policy = { latePenalty: 0, drop: {}, minScore: 0, scale: null, terms: [], marks: [], overrides: {} };
  for (const d of overrides || []) {
    try { policy.overrides[d.doc_id] = JSON.parse(d.body_json) || {}; } catch { /* not an override */ }
  }
  if (!course || !course.body_json) return policy;
  let body;
  try { body = JSON.parse(course.body_json) || {}; } catch { return policy; }

  const late = Number(body.latePenalty);
  if (isFinite(late) && late > 0) policy.latePenalty = Math.min(late, 100);
  if (body.drop && typeof body.drop === "object") policy.drop = body.drop;
  const least = Number(body.minScore);
  if (isFinite(least) && least > 0) policy.minScore = Math.min(least, 100);

  if (Array.isArray(body.scale)) {
    const steps = body.scale
      .filter((x) => Array.isArray(x) && isFinite(Number(x[0])) && typeof x[1] === "string" && x[1])
      .map((x) => [Number(x[0]), String(x[1]).slice(0, 8)])
      .sort((a, b) => b[0] - a[0]);
    if (steps.length) policy.scale = steps.slice(0, 24);
  }

  /* The course's own special marks: a code, what it means, and what it
     counts as — "zero", "excused", or a percent. The arithmetic is not here:
     a mark is written as the status and score it stands for, and this list
     is how a screen knows what the codes are. */
  if (Array.isArray(body.marks)) {
    policy.marks = body.marks
      .filter((m) => m && typeof m.code === "string" && m.code)
      .map((m) => ({ code: m.code.slice(0, 8), name: String(m.name || "").slice(0, 60),
                     as: m.as === "excused" ? "excused" : isFinite(Number(m.as)) && m.as !== null && m.as !== "" ? Number(m.as) : "zero" }))
      .slice(0, 24);
  }

  /* Grading periods, in order of when each starts: [{ name, from, weight }].
     One period is no periods — the course is graded whole. */
  if (Array.isArray(body.terms)) {
    const terms = body.terms
      .filter((t) => t && t.name && isFinite(Number(t.from)) && Number(t.weight) > 0)
      .map((t) => ({ name: String(t.name).slice(0, 40), from: Number(t.from), weight: Number(t.weight) }))
      .sort((a, b) => a.from - b.from);
    if (terms.length > 1) policy.terms = terms.slice(0, 12);
  }
  return policy;
}

/* `weights` is the course's own grading scheme: [["Quizzes", 35], ...]. When
   a course has none, everything counts equally, which is the honest default
   rather than an invented one. */
function gradeOver(grades, weights, rules) {
  const counting = [];
  for (const g of grades) {
    const c = contribution(g, rules);
    if (c) counting.push({ ...g, got: c.got, of: c.of, extra: !!c.extra, floored: !!c.floored,
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
  const exact = (total / counted) * 100;
  const percent = Math.round(exact);
  return {
    percent,
    // To one decimal, for the questions a whole number is too coarse to
    // answer: what one piece of work did to this grade.
    exact: Math.round(exact * 10) / 10,
    letter: letterFor(percent, rules.scale),
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
    flooredCount: counting.filter((g) => g.floored && !g.dropped).length,
    extraCredit: counting.filter((g) => g.extra && !g.dropped)
                         .reduce((a, g) => a + g.got, 0) || 0
  };
}

/* Which grading period a piece of work belongs to: the last one that had
   started by its due date (or by the day it was set, when it has none). Work
   from before the first period counts in the first — a mark is never left
   out of a grade for falling between two dates somebody typed. */
function termOf(g, terms) {
  const when = Number(g.due_at || g.work_created_at || 0);
  let hit = terms[0];
  for (const t of terms) if (t.from <= when) hit = t;
  return hit;
}

/* A student's grade in a course.

   `gradeOver` is the arithmetic of one stretch of work. This lays the
   course's two outer rules over it:

     Grading periods  each period is graded on its own — its own drops, its
                      own categories — and the course grade is the periods
                      weighted (Qtr 1 40%, Qtr 2 40%, Final 20%). A period
                      with nothing marked is left out of the divisor, the same
                      rule categories follow.
     An override      a teacher may set the grade by hand: a percent, a mark
                      shown in place of the letter (INC, W), or a fixed raise
                      or lowering. What was computed is kept beside it, so the
                      screen can always say both.

   `accountId` names whose grade this is, for the override; without it the
   rows say (every row is one student's). */
export function computeGrade(grades, weights, policy, accountId) {
  const rules = policy || { latePenalty: 0, drop: {} };
  const terms = rules.terms || [];
  let out = null;

  if (terms.length > 1) {
    const byTerm = new Map(terms.map((t) => [t, []]));
    for (const g of grades) byTerm.get(termOf(g, terms)).push(g);
    let total = 0, counted = 0, share = 0, last = null;
    const periods = [];
    for (const t of terms) {
      const r = gradeOver(byTerm.get(t), weights, rules);
      periods.push({ name: t.name, weight: t.weight, percent: r ? r.percent : null,
                     letter: r ? r.letter : null, parts: r ? r.parts : [] });
      if (!r) continue;
      total += r.exact * t.weight;
      counted += t.weight;
      share += t.weight * (r.countedWeight / (r.totalWeight || 1));
      last = last ? {
        ...r,
        itemCount: last.itemCount + r.itemCount,
        dropped: last.dropped.concat(r.dropped),
        lateCount: last.lateCount + r.lateCount,
        latePenalty: last.latePenalty + r.latePenalty,
        flooredCount: last.flooredCount + r.flooredCount,
        extraCredit: last.extraCredit + r.extraCredit
      } : r;
    }
    if (counted) {
      const all = terms.reduce((a, t) => a + t.weight, 0);
      const exact = total / counted;
      out = {
        ...last,                      // `parts` are the latest period's
        percent: Math.round(exact),
        exact: Math.round(exact * 10) / 10,
        letter: letterFor(Math.round(exact), rules.scale),
        countedWeight: Math.round((share / all) * 100),
        totalWeight: 100,
        missingCount: grades.filter((g) => g.status === "missing").length,
        terms: periods
      };
    }
  } else {
    out = gradeOver(grades, weights, rules);
  }

  const who = accountId || (grades[0] && grades[0].account_id);
  const ov = who && rules.overrides ? rules.overrides[who] : null;
  if (!ov) return out;

  const computed = out ? out.percent : null;
  const set = isFinite(Number(ov.percent)) && ov.percent !== null && ov.percent !== "" ? Number(ov.percent) : null;
  const adjust = isFinite(Number(ov.adjust)) ? Number(ov.adjust) : 0;
  const mark = ov.mark ? String(ov.mark).slice(0, 8) : null;
  const percent = set != null ? set : (computed != null && adjust ? computed + adjust : computed);
  if (set == null && !adjust && !mark) return out;
  /* A grade is always a percent, whatever it is called. A mark with nothing
     under it — INC for a student with no marks and no percent set — is not
     a grade yet, and every screen that shows one would have to learn to show
     a grade without a number. The teacher sets a percent with the mark. */
  if (percent == null) return out;

  const base = out || { parts: [], countedWeight: 0, totalWeight: 100, itemCount: 0, missingCount: 0,
                        dropped: [], lateCount: 0, latePenalty: 0, flooredCount: 0, extraCredit: 0 };
  return {
    ...base,
    percent,
    exact: percent,
    letter: mark || letterFor(percent, rules.scale),
    override: { computed, percent: set, adjust: adjust || null, mark,
                reason: ov.reason ? String(ov.reason).slice(0, 300) : null }
  };
}

/* Who a piece of work is for. Most work is for the whole course; a teacher
   may set some for a few students — independent study, a differentiated
   task — and then it is nobody else's: not a blank in their row, not owed,
   not shown to them. `null` means everyone. */
export function assigneesOf(a) {
  if (!a || !a.details_json) return null;
  try {
    const list = JSON.parse(a.details_json).assignees;
    return Array.isArray(list) && list.length ? new Set(list) : null;
  } catch { return null; }
}
export function assignedTo(a, accountId) {
  const who = assigneesOf(a);
  return !who || who.has(accountId);
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
    const who = assigneesOf(a);
    for (const s of students) {
      if (who && !who.has(s.id)) continue;       // not set for them
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
