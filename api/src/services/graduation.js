/* ==========================================================================
   Graduation.

   Excel High School's diploma rules, and the arithmetic of how far a student
   is from meeting them. Pure functions: nothing here reads the database, so
   every number on the dashboard can be reproduced from its inputs and tested
   without a server.

   ------------------------------------------------------------------ Sources

   EHS publishes these rules, and this file follows them rather than
   inventing any:

     · Two tracks: 21.5 credits (English 4, Math 3, Science 3, Social Studies
       3.5, Health 0.5, PE 0.5, Fine Art 1, Electives 6) and 24 credits (Math
       4, World Language 2, and 5.5 elective credits otherwise the same).
     · Up to 75% of required credits may transfer — "up to 16 or 18 credits,
       depending on your graduation path".
     · At least 6 credits must be earned at EHS: 1 English, 1 Math, 1 Science,
       1 Social Studies and 2 electives.
     · Official transcripts only, sent by the sending school. Evaluation
       happens after enrollment.
     · A = 90–100, B = 80–89.9, C = 70–79.9, D = 60–69.9, F below 60. Standard
       courses pass at 60%.

   ------------------------------------------------------- What is a judgement

   Two things EHS does not publish, and which are therefore labelled as
   assumptions wherever they surface:

     · How another school's credits convert. A school that awards 0.5 credit
       per term course across four terms gives 2.0 of its credits for a
       full-year course; EHS counts that course as 1.0. The conversion factor
       is per credit system and stated on the dashboard.
     · Whether a fragment smaller than a semester transfers. EHS works in
       semesters (0.5). Where a subject in a year adds up to something that is
       not a whole number of semesters, the odd piece is shown as at risk, and
       the dashboard reports a range rather than pretending to one number.
   ========================================================================== */

export const TRACKS = {
  "21.5": {
    key: "21.5", name: "Standard diploma", total: 21.5, transferCap: 16, minAtEhs: 6,
    areas: [
      ["english", "English", 4],
      ["math", "Math", 3],
      ["science", "Science", 3],
      ["social_studies", "Social Studies", 3.5],
      ["health", "Health", 0.5],
      ["pe", "Physical Education", 0.5],
      ["fine_art", "Fine Art", 1],
      ["elective", "Electives", 6]
    ]
  },
  "24": {
    key: "24", name: "College-bound diploma", total: 24, transferCap: 18, minAtEhs: 6,
    areas: [
      ["english", "English", 4],
      ["math", "Math", 4],
      ["science", "Science", 3],
      ["social_studies", "Social Studies", 3.5],
      ["health", "Health", 0.5],
      ["pe", "Physical Education", 0.5],
      ["fine_art", "Fine Art", 1],
      ["world_language", "World Language", 2],
      ["elective", "Electives", 5.5]
    ]
  }
};

/* What has to be earned at EHS itself, whatever transfers in. */
export const RESIDENCY = { english: 1, math: 1, science: 1, social_studies: 1, elective: 2 };

export const AREAS = ["english", "math", "science", "social_studies", "health", "pe",
                      "fine_art", "world_language", "elective"];

export const CREDIT_SYSTEMS = {
  "nyc-4-term": {
    factor: 0.5,
    says: "Your previous school awarded 0.5 credit per course each term, four terms a year, so a " +
          "full-year course earned 2.0 of its credits. EHS counts a full-year course as 1.0, so each " +
          "of those credits is counted as half an EHS credit."
  },
  "semester": {
    factor: 0.5,
    says: "Your previous school awarded 1 credit per semester course. EHS counts a semester as 0.5."
  },
  "carnegie": {
    factor: 1,
    says: "Your previous school used the same unit as EHS: one credit per full-year course."
  }
};

const r3 = (x) => Math.round(x * 1000) / 1000;
const sum = (list, f) => list.reduce((a, x) => a + (f ? f(x) : x), 0);

export function toEhsCredits(earned, system) {
  const cs = CREDIT_SYSTEMS[system];
  return r3(Number(earned || 0) * (cs ? cs.factor : 1));
}

/* "86" → 86, "MP 65" → 65, "P" and "NC" → null. */
export function parseMark(mark) {
  const m = String(mark == null ? "" : mark).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function ehsLetter(pct) {
  return pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
}
const POINTS = { A: 4, B: 3, C: 2, D: 1, F: 0 };

function flagsOf(c) { return String(c.flags || "").split(",").map((s) => s.trim()).filter(Boolean); }

/* ---------------------------------------------------------------- Allocation
   Credits land in the area they were proposed against. A finished area's
   surplus flows into electives, which is how a diploma actually counts it —
   a fourth year of PE is not wasted, it is an elective. On the 21.5 track a
   world language is itself an elective. Transfer is then held to the cap. */
function allocate(track, transferByArea, ehsByArea) {
  const keys = track.areas.map((a) => a[0]);
  const rows = track.areas.map(([key, name, required]) => ({
    key, name, required,
    transfer: r3(transferByArea[key] || 0),
    ehs: r3(ehsByArea[key] || 0)
  }));
  // Anything proposed against an area this track does not have is an elective.
  let stray = 0;
  for (const k of Object.keys(transferByArea)) if (!keys.includes(k)) stray += transferByArea[k];

  let overflow = 0;
  for (const r of rows) {
    if (r.key === "elective") continue;
    const have = r.transfer + r.ehs;
    r.applied = Math.min(have, r.required);
    r.overflow = r3(have - r.applied);
    overflow += r.overflow;
  }
  const el = rows.find((r) => r.key === "elective");
  el.fromOtherAreas = r3(overflow + stray);
  el.transfer = r3(el.transfer + stray);
  el.applied = Math.min(el.transfer + el.ehs + overflow, el.required);

  // The transfer cap. Applied credit that came from transfer is everything
  // applied that EHS itself did not award; trim electives first, because an
  // elective is the least specific thing a student can lose.
  const fromTransfer = (r) => Math.max(0, r.applied - r.ehs);
  let excess = sum(rows, fromTransfer) - track.transferCap;
  if (excess > 0) {
    for (const r of [el, ...rows.filter((x) => x !== el)]) {
      if (excess <= 0) break;
      const cut = Math.min(excess, fromTransfer(r));
      r.applied -= cut;
      r.cappedOut = r3(cut);
      excess -= cut;
    }
  }
  for (const r of rows) r.applied = r3(r.applied);
  return { rows, applied: r3(sum(rows, (r) => r.applied)),
           transferApplied: r3(sum(rows, fromTransfer)) };
}

/* ---------------------------------------------------------------- The plan
   What is left to earn at EHS: whatever each area still lacks, but never less
   than the residency minimum for that area, and never less than 6 overall. */
function plan(track, rows) {
  for (const r of rows) {
    const gap = Math.max(0, r.required - r.applied);
    const residency = Math.max(0, (RESIDENCY[r.key] || 0) - r.ehs);
    r.remaining = r3(gap);
    r.planAtEhs = r3(Math.max(gap, residency));
    r.residencyMin = RESIDENCY[r.key] || 0;
    r.complete = gap <= 0;
    r.percent = Math.round(Math.min(1, r.applied / r.required) * 100);
  }
  const ehsSoFar = sum(rows, (r) => r.ehs);
  let total = sum(rows, (r) => r.planAtEhs);
  if (total + ehsSoFar < track.minAtEhs) {
    const el = rows.find((r) => r.key === "elective");
    el.planAtEhs = r3(el.planAtEhs + (track.minAtEhs - ehsSoFar - total));
    total = sum(rows, (r) => r.planAtEhs);
  }
  return r3(total);
}

/* ---------------------------------------------------------------- Dashboard */
export function buildDashboard({ account, program, records, courses, exams, current }) {
  const trackKey = program && TRACKS[program.track] ? program.track : "21.5";
  const track = TRACKS[trackKey];
  const counted = courses.filter((c) => c.decision !== "declined");

  const byArea = {}, byAreaYear = {};
  for (const c of counted) {
    const area = c.area || "elective";
    const credits = Number(c.ehs_credits || 0);
    byArea[area] = (byArea[area] || 0) + credits;
    const k = (c.school_year || "") + "|" + area;
    if (!byAreaYear[k]) byAreaYear[k] = { year: c.school_year, area, credits: 0, titles: [] };
    byAreaYear[k].credits += credits;
    if (credits > 0) byAreaYear[k].titles.push(c.title);
  }

  // The conservative case: every subject in every year rounded down to whole
  // semesters, which is the most EHS could reasonably decline.
  const floored = {}, review = [];
  for (const g of Object.values(byAreaYear)) {
    const whole = Math.floor(g.credits * 2 + 1e-9) / 2;
    floored[g.area] = (floored[g.area] || 0) + whole;
    if (g.credits - whole > 1e-9) {
      review.push({ year: g.year, area: g.area, credits: r3(g.credits), atRisk: r3(g.credits - whole),
                    titles: g.titles,
                    reason: "EHS works in semesters of 0.5 credit. This subject adds up to part of a " +
                            "semester in this year, so the odd piece may not transfer." });
    }
  }

  const ehsByArea = {};
  const best = allocate(track, byArea, ehsByArea);
  const low = allocate(track, floored, ehsByArea);
  const planTotal = plan(track, best.rows);

  const percent = Math.round(best.applied / track.total * 1000) / 10;
  const record = records[records.length - 1] || null;
  let summary = {};
  try { summary = record && record.summary_json ? JSON.parse(record.summary_json) : {}; }
  catch { summary = {}; }

  /* ------------------------------------------------------------- Grades */
  const graded = courses.filter((c) => c.mark_numeric != null && c.attempted > 0 &&
                                        !flagsOf(c).includes("not_averaged"));
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let pts = 0, wt = 0;
  for (const c of graded) {
    const l = ehsLetter(c.mark_numeric);
    dist[l]++;
    pts += POINTS[l] * c.attempted;
    wt += c.attempted;
  }
  const gpa = wt ? Math.round(pts / wt * 100) / 100 : null;

  /* -------------------------------------------------------- Subject stars
     The strongest areas, by average mark. Shown because a student should see
     what they are good at, not only what they still owe. */
  const bySubject = {};
  for (const c of graded) {
    const a = c.area || "elective";
    if (!bySubject[a]) bySubject[a] = { n: 0, total: 0 };
    bySubject[a].n++; bySubject[a].total += c.mark_numeric;
  }
  const areaName = (k) => (TRACKS["24"].areas.find((a) => a[0] === k) || [k, k])[1];
  const strengths = Object.entries(bySubject)
    .map(([k, v]) => ({ area: k, name: areaName(k), average: Math.round(v.total / v.n * 10) / 10, marks: v.n }))
    .sort((a, b) => b.average - a.average);

  /* ---------------------------------------------------------- Achievements
     Every one is computed from the record. Nothing here is awarded for
     showing up, and each carries the evidence that earned it. */
  const marks = graded.map((c) => c.mark_numeric);
  const exPassed = exams.filter((e) => e.status === "passed");
  const exNames = new Set(exPassed.map((e) => e.name));
  const retakeWin = exams.some((e) => e.status === "passed" && exams.some((o) =>
    o.name === e.name && o.status !== "passed" && String(o.sitting) < String(e.sitting)));
  const art = graded.filter((c) => /art|draw/i.test(c.title));
  const honorsA = graded.filter((c) => flagsOf(c).includes("weighted") && c.mark_numeric >= 90);
  const recovered = courses.filter((c) => flagsOf(c).includes("recovered"));
  // Every numeric mark, not only the averaged ones: a school leaving PE out
  // of its average does not make a 100 in PE any less of a 100.
  const hundreds = courses.filter((c) => c.mark_numeric != null && c.mark_numeric >= 100);
  const terms = Array.isArray(summary.terms) ? summary.terms : [];
  const bestTerm = terms.reduce((b, t) => (t.average != null && (!b || t.average > b.average)) ? t : b, null);
  const completeAreas = best.rows.filter((r) => r.complete && r.key !== "elective");

  const achievements = [
    { key: "halfway", name: "Halfway there", earned: percent >= 50,
      detail: "Half of a diploma's credits on the board." },
    { key: "two_thirds", name: "Two-thirds done", earned: percent >= 66.7,
      detail: "Two of every three credits you need, already earned." },
    { key: "home_stretch", name: "Home stretch", earned: percent >= 75,
      detail: "Three-quarters of the way to graduation." },
    { key: "areas", name: "Requirements cleared", earned: completeAreas.length >= 3,
      detail: completeAreas.length
        ? completeAreas.map((r) => r.name).join(", ") + " — finished."
        : "Finish a whole requirement area." },
    { key: "perfect", name: "Perfect score", earned: hundreds.length > 0,
      detail: hundreds.length ? hundreds.length + (hundreds.length === 1 ? " mark" : " marks") +
                                " of 100: " + hundreds.map((c) => c.title).join(", ") + "."
                              : "Score 100 in a course." },
    { key: "honors", name: "Honors A", earned: honorsA.length > 0,
      detail: honorsA.length ? honorsA.map((c) => c.title + " " + c.mark_numeric).join(", ") + "."
                             : "Earn 90 or above in an honors course." },
    { key: "artist", name: "Artist", earned: art.length >= 4 && art.every((c) => c.mark_numeric >= 80),
      detail: art.length ? art.length + " art terms, every one at 80 or above." : "Take an art course." },
    { key: "comeback", name: "Comeback", earned: recovered.length > 0,
      detail: recovered.length ? recovered.map((c) => c.title).join(", ") +
                                 " — failed once, then earned the credit back."
                               : "Recover a credit you missed." },
    { key: "retake", name: "Retake win", earned: retakeWin,
      detail: "Passed a state exam on a second attempt after missing it the first time." },
    { key: "exams", name: "State exams passed", earned: exNames.size >= 3,
      detail: exNames.size + (exNames.size === 1 ? " exam" : " exams") + " passed: " +
              [...exNames].join(", ") + "." },
    { key: "language", name: "Bilingual track", earned: (byArea.world_language || 0) >= 2,
      detail: "Two full years of a world language — the 24-credit track's language " +
              "requirement is already covered." },
    { key: "best_term", name: "Term above 80", earned: !!(bestTerm && bestTerm.average >= 80),
      detail: bestTerm ? "Best term: " + bestTerm.average + "% in " + bestTerm.term + "." : "Average 80 in a term." },
    { key: "honor_roll", name: "Honor roll", earned: !!(bestTerm && bestTerm.average >= 85),
      detail: "Average 85 or above for a whole term." },
    { key: "graduate", name: "Graduate", earned: percent >= 100,
      detail: "Every credit, every area. The diploma." }
  ];

  const milestones = [
    { at: 25, label: "Quarter way" }, { at: 50, label: "Halfway" },
    { at: 75, label: "Home stretch" }, { at: 100, label: "Diploma" }
  ].map((m) => ({ ...m, reached: percent >= m.at }));

  /* ---------------------------------------------------------- Next steps */
  const steps = [];
  if (record && record.kind !== "official") {
    steps.push({ kind: "transcript", title: "Ask " + record.school + " to send your official transcript",
      detail: "EHS only accepts transcripts sent straight from the school — by email to " +
              "records@excelhighschool.com, by mail, or through Parchment. Until it arrives, every " +
              "transferred credit on this page is an estimate, and without it EHS would require all " +
              track.total + " credits to be earned at EHS." });
  }
  for (const r of best.rows) {
    if (r.planAtEhs > 0) {
      steps.push({ kind: "area", area: r.key,
        title: r.name + " — " + r.planAtEhs + (r.planAtEhs === 1 ? " credit" : " credits") + " at EHS",
        detail: r.remaining > 0
          ? r.remaining + " still needed" + (r.planAtEhs > r.remaining
              ? ", and EHS asks for at least " + r.residencyMin + " in this area to be earned with them."
              : ".")
          : "Already covered by transfer, but EHS asks for " + r.residencyMin +
            " in this area to be earned with them." });
    }
  }
  for (const v of review) {
    steps.push({ kind: "review", title: "Confirm " + areaName(v.area) + " from " + v.year,
      detail: v.atRisk + " credit may not transfer: " + v.titles.join(", ") + ". " + v.reason });
  }

  const statusSteps = ["Unofficial copy on file", "Official transcript requested",
                       "Received by EHS", "Evaluated by EHS"];
  const statusAt = !record ? -1
    : record.status === "evaluated" ? 3 : record.status === "received" ? 2
    : record.status === "requested" ? 1 : 0;

  return {
    account: account ? { id: account.id, name: account.name, firstName: account.first_name } : null,
    program: program ? { name: program.program, track: program.track, gradeLevel: program.grade_level,
                         expectedGrad: program.expected_grad } : null,
    track: { key: track.key, name: track.name, total: track.total,
             transferCap: track.transferCap, minAtEhs: track.minAtEhs },
    totals: {
      earnedTowardDiploma: best.applied,
      transferEstimate: best.transferApplied,
      transferConservative: low.transferApplied,
      ehsEarned: 0,
      remaining: r3(track.total - best.applied),
      planAtEhs: planTotal,
      percent
    },
    areas: best.rows.map((r) => ({
      key: r.key, name: r.name, required: r.required, transfer: r.transfer, ehs: r.ehs,
      applied: r.applied, remaining: r.remaining, planAtEhs: r.planAtEhs,
      residencyMin: r.residencyMin, complete: r.complete, percent: r.percent,
      fromOtherAreas: r.fromOtherAreas || 0, overflow: r.overflow || 0
    })),
    transfer: record ? {
      id: record.id, school: record.school, authority: record.authority, kind: record.kind,
      status: record.status, statusSteps, statusAt, printedOn: record.printed_on,
      creditSystem: record.credit_system,
      conversion: (CREDIT_SYSTEMS[record.credit_system] || {}).says || null,
      creditsEarned: summary.creditsEarned ?? null, creditsAttempted: summary.creditsAttempted ?? null,
      cumulativeAverage: summary.cumulativeAverage ?? null,
      review
    } : null,
    trend: terms,
    gpa: { estimate: gpa, scale: "EHS 4.0 (A 90+, B 80+, C 70+, D 60+)", courses: graded.length,
           distribution: dist },
    strengths,
    courses: courses.map((c) => ({
      id: c.id, year: c.school_year, gradeLevel: c.grade_level, term: c.term, code: c.code,
      title: c.title, mark: c.mark, markNumeric: c.mark_numeric,
      letter: c.mark_numeric != null ? ehsLetter(c.mark_numeric) : null,
      attempted: c.attempted, earned: c.earned, area: c.area, flags: flagsOf(c),
      ehsCredits: c.ehs_credits, decision: c.decision, note: c.note
    })),
    exams: exams.map((e) => ({ name: e.name, sitting: e.sitting, score: e.score, status: e.status,
                               passed: e.status === "passed" })),
    current: current || [],
    milestones, achievements, nextSteps: steps,
    assumptions: [
      record && record.kind !== "official"
        ? "Transfer credit is estimated from an unofficial copy. EHS makes the official evaluation " +
          "after enrollment, from a transcript sent by the previous school."
        : null,
      record ? (CREDIT_SYSTEMS[record.credit_system] || {}).says : null,
      "The grade-point estimate puts previous marks on EHS's 4.0 scale. EHS does not publish " +
      "whether transferred grades enter its own GPA."
    ].filter(Boolean)
  };
}
