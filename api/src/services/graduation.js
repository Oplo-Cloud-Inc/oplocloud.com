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
const r1 = (x) => Math.round(x * 10) / 10;

/* Time, said the way a person says it. "11.5 months" is arithmetic; nobody
   plans a year of their life in it. */
function spellMonths(months) {
  if (months == null) return "an unknown length of time";
  if (months < 12) return "about " + months + (months === 1 ? " month" : " months");
  if (months < 15) return "about a year";
  if (months < 21) return "about a year and a half";
  const years = Math.round(months / 6) / 2;
  return "about " + years + " years";
}
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

/* ============================================================== The analysis
   Four questions a record can answer and a list of credits cannot: when does
   this end, which single move is worth the most, where is the one real risk,
   and which way has the work been going. Pure functions over rows that already
   exist, so every sentence on the dashboard traces back to something a student
   can point at.

   The rule from the top of this file holds here too — a school's rule is
   quoted, a judgement is labelled. The exam thresholds below are the ones
   printed on a New York transcript: the credit line at 65, the 55–64 low-pass
   band, four core areas plus a fifth assessment. EHS publishes no exam
   requirement, so none of this gates an EHS diploma. It is kept because the
   record carries it and because it decides which diploma New York would
   issue — which is a thing worth knowing before a retake window closes. */

export const EXAM_PASS = 65;
export const EXAM_LOW_PASS = 55;

const CORE_EXAMS = [
  ["english", "English", /english|\bela\b|literature/i],
  ["math", "Math", /algebra|geometry|trigonometr|\bmath/i],
  ["science", "Science", /biolog|life science|living environment|chemistr|physics|earth/i],
  ["social_studies", "Social Studies", /global|history|government|economics|civics/i]
];

/* The best sitting of each exam, the four core areas, and what stands between
   this record and each diploma. A retake replaces a sitting rather than adding
   one, which is why only the highest score of a name counts here. */
export function examBoard(exams) {
  const best = new Map();
  for (const e of exams || []) {
    const score = e.score == null ? null : Number(e.score);
    const prev = best.get(e.name);
    if (!prev || (score != null && (prev.score == null || score > prev.score))) {
      best.set(e.name, { name: e.name, score, sitting: e.sitting || null, status: e.status });
    }
  }
  const sittings = [...best.values()];
  const taken = new Set();

  const areas = CORE_EXAMS.map(([key, name, re]) => {
    const mine = sittings.filter((s) => re.test(s.name));
    const top = mine.reduce((b, s) => (!b || (s.score ?? -1) > (b.score ?? -1) ? s : b), null);
    if (top) taken.add(top.name);
    const score = top && top.score != null ? top.score : null;
    const state = score == null ? "none"
      : score >= EXAM_PASS ? "met"
      : score >= EXAM_LOW_PASS ? "low_pass" : "short";
    return { key, name, exam: top ? top.name : null, sitting: top ? top.sitting : null, score, state,
             toPass: score != null && score < EXAM_PASS ? r3(EXAM_PASS - score) : 0 };
  });

  const met = areas.filter((a) => a.state === "met").length;
  const lowPass = areas.filter((a) => a.state === "low_pass").length;
  const plusOne = sittings.find((s) => !taken.has(s.name) && s.score != null && s.score >= EXAM_PASS) || null;

  // The cheapest change of outcome on the record: the unmet core area nearest
  // to 65. Points, not effort — but points are what a retake has to move.
  const closest = areas.filter((a) => a.state === "low_pass" || a.state === "short")
                       .sort((a, b) => a.toPass - b.toPass)[0] || null;

  // Results that cannot block anything, because their area is already met.
  const surplus = sittings.filter((s) => {
    if (taken.has(s.name)) return false;
    if (s.score != null && s.score >= EXAM_PASS) return false;
    const owner = CORE_EXAMS.find(([, , re]) => re.test(s.name));
    return !owner || areas.find((a) => a.key === owner[0]).state === "met";
  }).map((s) => ({ name: s.name, score: s.score, sitting: s.sitting }));

  const pathways = [
    { key: "regents", name: "Regents diploma",
      met: met === 4 && !!plusOne,
      blockers: [
        ...areas.filter((a) => a.state !== "met")
                .map((a) => a.state === "none" ? a.name + " — no exam on the record"
                                               : a.name + " — " + a.score + ", " + a.toPass +
                                                 (a.toPass === 1 ? " point" : " points") + " short of 65"),
        ...(plusOne ? [] : ["a fifth assessment — any further Regents, a CTE or arts assessment, or CDOS"])
      ],
      says: "Four core areas at 65 or above, plus a fifth assessment." },
    { key: "local", name: "Local diploma · low-pass safety net",
      met: met + lowPass === 4 && !!plusOne,
      blockers: [
        ...areas.filter((a) => a.state === "none" || a.state === "short")
                .map((a) => a.state === "none" ? a.name + " — no exam on the record"
                                               : a.name + " — " + a.score + ", below the 55 band"),
        ...(plusOne ? [] : ["a fifth assessment"])
      ],
      says: "The 55–64 band counts as a pass for this diploma." }
  ];

  return { areas, met, lowPass, covered: met + lowPass, plusOne, needsPlusOne: !plusOne,
           closest, surplus, pathways,
           says: "Thresholds as printed on the transcript — 65 to pass, 55–64 accepted by the low-pass " +
                 "safety net, four core areas plus a fifth assessment. EHS does not require state exams; " +
                 "this is your New York record, and a counsellor confirms what it means for you." };
}

/* -------------------------------------------------------------------- Pace
   A credit count says how far. It never says when — and "when" is the half a
   student actually schedules their life around. The rate comes from their own
   record rather than a school average, because the only pace anybody believes
   is the one they have already kept. */
export function pace({ courses, planAtEhs, program, now = Date.now() }) {
  const byYear = new Map();
  for (const c of courses || []) {
    if (c.decision === "declined") continue;
    const year = c.school_year || "unknown";
    byYear.set(year, r3((byYear.get(year) || 0) + Number(c.ehs_credits || 0)));
  }
  const years = [...byYear.entries()]
    .filter(([year, credits]) => year !== "unknown" && credits > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([year, credits]) => ({ year, credits }));

  const perYear = years.length ? r3(sum(years, (y) => y.credits) / years.length) : 0;
  const left = r3(Math.max(0, Number(planAtEhs) || 0));
  const monthsToGo = perYear > 0 ? Math.ceil((left / perYear) * 12) : null;

  let finishBy = null;
  if (monthsToGo != null) {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() + monthsToGo);
    finishBy = d.toISOString().slice(0, 7);
  }
  const expected = program && program.expected_grad ? String(program.expected_grad) : null;
  const aheadOfPlan = expected && finishBy ? (finishBy <= expected) : null;

  return {
    years, creditsPerYear: r1(perYear), creditsLeft: left, monthsToGo, finishBy, expected,
    aheadOfPlan, duration: spellMonths(monthsToGo),
    says: perYear > 0
      ? "Your own record runs at " + r1(perYear) + " EHS credits a year. At that rate the " + left +
        (left === 1 ? " credit" : " credits") + " left at EHS take " + spellMonths(monthsToGo) + "."
      : "There is no finished year on the record yet, so there is no pace to project from.",
    assumption: "Projected from the pace of your own previous record, not from an EHS schedule. " +
                "EHS does not publish how many credits a term carries, so this is an estimate of time, " +
                "not a commitment from the school."
  };
}

/* -------------------------------------------------------------------- Risk
   One area, not a list. The one where the largest remaining requirement, the
   weakest marks and an actual failure meet — which is both the likeliest place
   to lose a year and the place an hour of work buys the most. Named once,
   with its evidence, and never as a verdict about the student. */
export function riskArea({ rows, strengths, courses }) {
  const avg = new Map((strengths || []).map((s) => [s.area, s.average]));
  const failures = (courses || []).filter((c) =>
    c.attempted > 0 && !Number(c.earned) && c.mark_numeric != null && c.decision !== "declined");

  const scored = (rows || []).filter((r) => r.planAtEhs > 0).map((r) => {
    const average = avg.has(r.key) ? avg.get(r.key) : null;
    const failed = failures.filter((c) => (c.area || "elective") === r.key);
    const score = r.planAtEhs +
      (average != null ? Math.max(0, (75 - average) / 10) : 0) +
      failed.length * 1.5;
    return { key: r.key, name: r.name, planAtEhs: r.planAtEhs, average, failed, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return null;
  const evidence = [
    top.planAtEhs + (top.planAtEhs === 1 ? " credit" : " credits") + " still to earn here — " +
      (scored.length > 1 && top.planAtEhs >= scored[1].planAtEhs ? "the most of any area" : "more than most"),
    top.average != null ? "Average mark " + top.average + " in this subject" : null,
    top.failed.length ? top.failed.map((c) => c.title + " " + c.mark + " — no credit").join("; ") : null
  ].filter(Boolean);

  return {
    area: top.key, name: top.name, evidence,
    says: "This is where the next hour is worth the most. Not because it is your weakness — because " +
          "it is the only place where the biggest requirement, the lowest marks and a lost credit " +
          "all sit together, and the credit is still there to be taken."
  };
}

/* ---------------------------------------------------------------- Momentum
   A direction, stated as what it is: a fact about terms that have finished.
   A trend line is not a prediction, and a student reading one should not be
   handed a prophecy about a mark nobody has given yet. */
export function momentum(terms) {
  const list = (terms || []).filter((t) => t && t.average != null);
  if (list.length < 2) return null;
  const first = list[0], last = list[list.length - 1];
  const best = list.reduce((b, t) => (t.average > b.average ? t : b), list[0]);
  const recent = list.slice(-4);
  const slope = r3((recent[recent.length - 1].average - recent[0].average) / Math.max(1, recent.length - 1));
  const direction = slope > 0.5 ? "rising" : slope < -0.5 ? "falling" : "steady";
  const delta = r3(last.average - first.average);
  return {
    first, last, best, delta, slope, direction, terms: list.length,
    says: direction === "rising"
      ? "Your last four terms move upward, " + r1(Math.abs(slope)) + " points a term."
      : direction === "falling"
        ? "Across " + list.length + " terms the average fell " + r1(Math.abs(delta)) + " points, about " +
          r1(Math.abs(slope)) + " a term lately. That is a fact about terms already finished — the next " +
          "mark is not on that line yet."
        : "Your average has held steady across " + list.length + " terms.",
    high: "Your best term was " + best.average + "% in " + best.term + ". You have already done it once."
  };
}

/* ---------------------------------------------------------------- Leverage
   Steps ranked by what they unlock against what they cost, so the screen can
   name one move instead of listing eight. Effort is described in the unit the
   student actually spends — an email, a retake, a credit — because "2.25
   credits" and "one email" are not comparable and should not look it. */
export function leverage(steps, { totals, track, board }) {
  const scored = (steps || []).map((s) => {
    if (s.kind === "transcript") {
      return { ...s, impact: 100, effort: "one email",
        why: "Until it arrives every transferred credit is an estimate, and without it EHS would " +
             "require all " + track.total + " credits to be earned with them. Nothing else on this " +
             "list moves " + totals.transferEstimate + " credits for one message." };
    }
    if (s.kind === "exam" && board && board.closest) {
      return { ...s, impact: 90, effort: "one retake",
        why: board.closest.toPass + (board.closest.toPass === 1 ? " point" : " points") +
             " changes which diploma New York would issue." };
    }
    if (s.kind === "review") {
      const hit = String(s.detail).match(/([\d.]+) credit/);
      const at = Number(hit ? hit[1] : 0);
      return { ...s, impact: Math.min(80, 40 + at * 20), effort: "one question to the registrar",
        why: "Asking settles it now rather than in the final audit." };
    }
    const hit = String(s.title).match(/([\d.]+) credit/);
    const credits = Number(hit ? hit[1] : 0);
    return { ...s, impact: Math.min(70, credits * 12), effort: credits ? credits + (credits === 1 ? " credit" : " credits") + " of coursework" : "coursework",
      why: "Required before the diploma, and the work is yours to schedule." };
  }).sort((a, b) => b.impact - a.impact);

  return { steps: scored, focus: scored[0] || null };
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

  /* ------------------------------------------------------------- Analysis
     Computed after the steps exist, because the ranking reads them. An exam
     near the line is a step like any other: it costs one sitting and it can
     change which diploma the state would issue. */
  const board = examBoard(exams);
  if (board.closest) {
    const c = board.closest;
    steps.push({ kind: "exam", area: c.key,
      title: "Retake " + c.exam + " — " + c.toPass + (c.toPass === 1 ? " point" : " points") + " from 65",
      detail: "Your best sitting is " + c.score + ". Sixty-five is the line New York draws" +
              (c.state === "low_pass"
                ? ", and 55–64 already satisfies the low-pass safety net, so this decides whether the " +
                  "diploma is a Regents one rather than whether there is one."
                : ", and this sitting is below the 55–64 band the safety net accepts.") +
              " Ask your counsellor which sitting you can take, and when it closes." });
  }

  const totals = {
    earnedTowardDiploma: best.applied,
    transferEstimate: best.transferApplied,
    transferConservative: low.transferApplied,
    ehsEarned: 0,
    remaining: r3(track.total - best.applied),
    planAtEhs: planTotal,
    percent
  };
  const ranked = leverage(steps, { totals, track, board });
  const paceOut = pace({ courses, planAtEhs: planTotal, program, now: Date.now() });
  const riskOut = riskArea({ rows: best.rows, strengths, courses });
  const momentumOut = momentum(terms);

  return {
    account: account ? { id: account.id, name: account.name, firstName: account.first_name } : null,
    program: program ? { name: program.program, track: program.track, gradeLevel: program.grade_level,
                         expectedGrad: program.expected_grad } : null,
    track: { key: track.key, name: track.name, total: track.total,
             transferCap: track.transferCap, minAtEhs: track.minAtEhs },
    totals,
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
    milestones, achievements, nextSteps: ranked.steps, focus: ranked.focus,
    board, pace: paceOut, risk: riskOut, momentum: momentumOut,
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
