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
   ========================================================================== */

export function letterFor(pct) {
  return pct >= 93 ? "A"  : pct >= 90 ? "A-" : pct >= 87 ? "B+" : pct >= 83 ? "B"
       : pct >= 80 ? "B-" : pct >= 77 ? "C+" : pct >= 73 ? "C"  : pct >= 70 ? "C-"
       : pct >= 67 ? "D+" : pct >= 63 ? "D"  : pct >= 60 ? "D-" : "F";
}

/* `weights` is the course's own grading scheme: [["Quizzes", 35], ...]. When
   a course has none, everything counts equally, which is the honest default
   rather than an invented one. */
export function computeGrade(grades, weights) {
  const marked = grades.filter((g) => g.score != null && g.out_of > 0);
  if (!marked.length) return null;

  const scheme = (weights && weights.length) ? weights : [["Work", 100]];
  const weightOf = new Map(scheme.map(([cat, w]) => [cat, w]));
  const firstCat = scheme[0][0];

  const buckets = new Map();
  for (const g of marked) {
    const cat = weightOf.has(g.category) ? g.category : firstCat;
    const b = buckets.get(cat) || { got: 0, of: 0, n: 0 };
    b.got += Number(g.score);
    b.of += Number(g.out_of);
    b.n++;
    buckets.set(cat, b);
  }

  let total = 0, counted = 0;
  const parts = [];
  for (const [cat, weight] of scheme) {
    const b = buckets.get(cat);
    if (!b || !b.of) continue;
    const pct = b.got / b.of;
    total += pct * weight;
    counted += weight;
    parts.push({ category: cat, percent: Math.round(pct * 100), items: b.n, weight });
  }
  if (!counted) return null;

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
    itemCount: marked.length
  };
}

export function courseWeights(course) {
  if (!course || !course.body_json) return null;
  try {
    const body = JSON.parse(course.body_json);
    return Array.isArray(body.grading) ? body.grading : null;
  } catch { return null; }
}
