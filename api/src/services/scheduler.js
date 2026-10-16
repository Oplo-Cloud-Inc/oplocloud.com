/* ==========================================================================
   Planning a term: what is asked for against what is offered, and a first
   placement of students into sections.

   Pure functions, so the rules can be checked without a database
   (api/scripts/check-scheduler.mjs) and so the same answer comes back whether
   it is asked for as an analysis or as a build.

   What counts as demand: a course a student must take (rank 0) or put first
   (rank 1). Second and third choices are alternates, used only when a first
   choice cannot be placed; they are not counted as people the school must
   seat, which is what keeps one popular elective from looking like three.
   ========================================================================== */

const capOf = (sec, subjectCap) => (sec.capacity != null ? sec.capacity : subjectCap != null ? subjectCap : null);

/* Sections against demand, per course, and capacity per period. */
export function analyze({ subjects, sections, requests }) {
  const by = new Map(subjects.map((s) => [s.id, s]));
  const planned = new Map(), asked = new Map();
  for (const r of requests) {
    asked.set(r.subjectId, (asked.get(r.subjectId) || 0) + 1);
    if (r.rank <= 1) planned.set(r.subjectId, (planned.get(r.subjectId) || 0) + 1);
  }
  const courses = [];
  for (const s of subjects) {
    const mine = sections.filter((x) => x.subjectId === s.id);
    const caps = mine.map((x) => capOf(x, s.capacity));
    const unlimited = caps.some((c) => c == null);
    const capacity = unlimited ? null : caps.reduce((a, b) => a + b, 0);
    const want = planned.get(s.id) || 0;
    let flag = null;
    if (want && !mine.length) flag = "none";                                   // asked for, offered nowhere
    else if (capacity != null && want > capacity) flag = "short";              // more people than seats
    else if (capacity != null && mine.length > 1 && capacity > want * 1.5 + 4) flag = "many";   // a section too many
    if (!want && !mine.length && !(asked.get(s.id))) continue;
    courses.push({ subjectId: s.id, number: s.number, title: s.title, sections: mine.length, capacity, planned: want, asked: asked.get(s.id) || 0,
                   placed: mine.reduce((n, x) => n + (x.students ? x.students.length : 0), 0), flag });
  }
  const periods = new Map();
  for (const x of sections) {
    const cap = capOf(x, (by.get(x.subjectId) || {}).capacity);
    for (const p of x.periods) {
      const e = periods.get(p) || { period: p, sections: 0, capacity: 0, unlimited: false, placed: 0 };
      e.sections++; e.placed += x.students ? x.students.length : 0;
      if (cap == null) e.unlimited = true; else e.capacity += cap;
      periods.set(p, e);
    }
  }
  return { courses, periods: [...periods.values()].sort((a, b) => String(a.period).localeCompare(String(b.period), undefined, { numeric: true })) };
}

/* Place students into sections.

   Pass by pass: everyone's required courses and first choices are seated
   before anyone's alternates, so a second choice never takes a seat a first
   choice wanted. A student goes to the section of the course with the most
   room that does not share a period with a section they already have. A
   section with no period never clashes. Nobody already in a section of a
   course is placed in another of it.

   `sections` carry `students` (the account ids already there); the result
   lists additions only, so it can be previewed and then applied. */
export function build({ subjects, sections, requests }) {
  const subjectBy = new Map(subjects.map((s) => [s.id, s]));
  const seat = new Map(sections.map((s) => [s.id, new Set(s.students || [])]));
  const have = new Map();          // account -> Set(period labels already taken)
  const inSubject = new Map();     // account -> Set(subject ids already seated)
  for (const s of sections) {
    for (const a of seat.get(s.id)) {
      const ps = have.get(a) || have.set(a, new Set()).get(a);
      s.periods.forEach((p) => ps.add(p));
      (inSubject.get(a) || inSubject.set(a, new Set()).get(a)).add(s.subjectId);
    }
  }
  const adds = new Map();
  const placed = [], unplaced = [];
  const ranks = [...new Set(requests.map((r) => r.rank))].sort((a, b) => a - b);
  // Required and first choices share a pass; each alternate rank has its own.
  const passes = [];
  const first = requests.filter((r) => r.rank <= 1);
  if (first.length) passes.push(first);
  for (const k of ranks.filter((r) => r > 1)) passes.push(requests.filter((r) => r.rank === k));

  const failedFirst = new Map();   // account -> how many of their first choices could not be placed

  passes.forEach((pass, pi) => {
    const ordered = pass.slice().sort((a, b) => a.rank - b.rank || String(a.accountId).localeCompare(String(b.accountId)));
    for (const r of ordered) {
      if (pi > 0 && !(failedFirst.get(r.accountId) || 0)) continue;      // an alternate is only for a student whose first choice failed
      const subj = subjectBy.get(r.subjectId);
      if (!subj) continue;
      if ((inSubject.get(r.accountId) || new Set()).has(r.subjectId)) { placed.push({ accountId: r.accountId, subjectId: r.subjectId, sectionId: null, already: true }); continue; }
      const mine = have.get(r.accountId) || new Set();
      const options = sections.filter((s) => s.subjectId === r.subjectId);
      if (!options.length) { unplaced.push({ accountId: r.accountId, subjectId: r.subjectId, rank: r.rank, reason: "No section of this course is offered." }); if (pi === 0) failedFirst.set(r.accountId, (failedFirst.get(r.accountId) || 0) + 1); continue; }
      let best = null, clash = 0, full = 0;
      for (const s of options) {
        const cap = capOf(s, subj.capacity);
        if (cap != null && seat.get(s.id).size >= cap) { full++; continue; }
        if (s.periods.some((p) => mine.has(p))) { clash++; continue; }
        const room = cap == null ? 1e9 : cap - seat.get(s.id).size;
        if (!best || room > best.room || (room === best.room && String(s.sectionNo || s.id) < String(best.s.sectionNo || best.s.id))) best = { s, room };
      }
      if (!best) {
        unplaced.push({ accountId: r.accountId, subjectId: r.subjectId, rank: r.rank,
          reason: clash && !full ? "Every section clashes with a period they already have." : full && !clash ? "Every section is full." : "Every section is full or clashes with a period they already have." });
        if (pi === 0) failedFirst.set(r.accountId, (failedFirst.get(r.accountId) || 0) + 1);
        continue;
      }
      seat.get(best.s.id).add(r.accountId);
      best.s.periods.forEach((p) => (have.get(r.accountId) || have.set(r.accountId, new Set()).get(r.accountId)).add(p));
      (inSubject.get(r.accountId) || inSubject.set(r.accountId, new Set()).get(r.accountId)).add(r.subjectId);
      (adds.get(best.s.id) || adds.set(best.s.id, []).get(best.s.id)).push(r.accountId);
      placed.push({ accountId: r.accountId, subjectId: r.subjectId, sectionId: best.s.id, rank: r.rank });
      if (pi > 0 && (failedFirst.get(r.accountId) || 0) > 0) failedFirst.set(r.accountId, failedFirst.get(r.accountId) - 1);   // the alternate covers one failed first choice
    }
  });
  return { adds: Object.fromEntries(adds), placed, unplaced };
}
