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

   ---------------------------------------------------- How EHS's record counts

   What EHS's own academic record shows, and this file therefore does too:

     · A credit sits in the requirement it was earned in. Credit beyond a
       requirement is surplus and is shown as surplus — it is not moved into
       Electives. "Surplus in one requirement cannot substitute for another."
       A student with 1.5 extra in Social Studies and PE and a 4.0 shortfall
       in English and Electives has 4.0 to earn, not 2.5.
     · A world language on the 21.5-credit track is filed under Electives.
     · GPA is computed over every lettered course, transferred and EHS alike,
       and P-coded courses are left out: they carry credit but no points.

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
       the dashboard reports a range rather than pretending to one number —
       until EHS has evaluated the transfer, after which its decision stands.
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
    says: "Credits are counted the way EHS counts them: one credit per full-year course."
  }
};

/* EHS's published course list, by the requirement each course fills — from
   "Excel High School Graduation Credit Requirements", which names courses for
   English, Math, Science, Social Studies and Electives and no others. A gap is
   worth more as a list of courses somebody can actually take than as a number. */
export const EHS_CATALOG = {
  english: ["Public Speaking", "English 10", "English 11", "English 12"],
  math: ["Algebra I", "Integrated Algebra", "Geometry", "Math Models & Applications"],
  science: ["Biology", "Environmental Science", "Geology", "Physical Science"],
  social_studies: ["U.S. Government", "U.S. History", "World History", "Economics"],
  elective: ["Introduction to Business", "Psychology", "Sociology", "Accounting", "Business Management",
             "Introduction to Computer Applications", "Art History", "Music Appreciation",
             "History of Jazz", "Life Skills", "Astronomy", "Sports Science",
             "Introduction to Tech Science", "Biotechnology", "Health & Fitness", "Spanish I", "Spanish II"]
};

/* An area as a word inside a sentence: "1.0 elective credit", not "1.0 electives credit". */
const AREA_WORD = { english: "English", math: "math", science: "science", social_studies: "social studies",
                    health: "health", pe: "PE", fine_art: "fine art", world_language: "world language",
                    elective: "elective" };

const r3 = (x) => Math.round(x * 1000) / 1000;
const r1 = (x) => Math.round(x * 10) / 10;
const sum = (list, f) => list.reduce((a, x) => a + (f ? f(x) : x), 0);

/* A credit said the way a record prints it: 4.0, 0.5, 19.0 — and 0.125 where
   a converted fragment really is that small, rather than rounding it away. */
function cr(x) {
  const v = r3(Number(x) || 0);
  return Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 ? v.toFixed(1) : String(v);
}
const creditWord = (x) => (r3(x) === 1 ? " credit" : " credits");
function listOf(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}
/* "2025-2026" → "2025–26". */
export function yearLabel(y) {
  const m = String(y || "").match(/^(\d{4})\D+(\d{2,4})$/);
  return m ? m[1] + "–" + m[2].slice(-2) : String(y || "");
}
function yearStart(y) {
  const m = String(y || "").match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}
/* An exam sitting "2025-01" belongs to the school year "2024-2025". */
export function schoolYearOf(sitting) {
  const m = String(sitting || "").match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]);
  return mo >= 7 ? y + "-" + (y + 1) : (y - 1) + "-" + y;
}
const normTitle = (s) => String(s || "").toLowerCase().replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ").trim();

/* Time, said the way a person says it. "11.5 months" is arithmetic; nobody
   plans a year of their life in it. */
function spellMonths(months) {
  if (months == null) return "an unknown length of time";
  if (months <= 1) return "about a month";
  if (months < 12) return "about " + months + " months";
  if (months < 15) return "about a year";
  if (months < 21) return "about a year and a half";
  const years = Math.round(months / 6) / 2;
  return "about " + years + " years";
}

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
   Credits land in the area they were earned in, and stay there. A requirement
   is met up to its size; what is beyond it is surplus, reported as surplus,
   because that is how EHS's record counts it. An area this track does not
   have — a world language on the 21.5-credit track — is filed under
   Electives. Transfer is then held to the cap, trimming electives first. */
function allocate(track, transferByArea, ehsByArea) {
  const keys = track.areas.map((a) => a[0]);
  const rows = track.areas.map(([key, name, required]) => ({
    key, name, required,
    transfer: r3(transferByArea[key] || 0),
    ehs: r3(ehsByArea[key] || 0),
    fromOtherAreas: 0, cappedOut: 0
  }));
  const el = rows.find((r) => r.key === "elective");
  for (const [k, v] of Object.entries(transferByArea)) {
    if (keys.includes(k)) continue;
    el.transfer = r3(el.transfer + v);
    el.fromOtherAreas = r3(el.fromOtherAreas + v);
  }
  for (const [k, v] of Object.entries(ehsByArea)) {
    if (keys.includes(k)) continue;
    el.ehs = r3(el.ehs + v);
    el.fromOtherAreas = r3(el.fromOtherAreas + v);
  }
  for (const r of rows) {
    r.earned = r3(r.transfer + r.ehs);
    r.applied = Math.min(r.earned, r.required);
  }

  // Applied credit that came from transfer is everything applied that EHS
  // itself did not award. An elective is the least specific thing a student
  // can lose, so the cap trims there first.
  const fromTransfer = (r) => Math.max(0, r.applied - r.ehs);
  let excess = sum(rows, fromTransfer) - track.transferCap;
  if (excess > 1e-9) {
    for (const r of [el, ...rows.filter((x) => x !== el)]) {
      if (excess <= 1e-9) break;
      const cut = Math.min(excess, fromTransfer(r));
      r.applied -= cut;
      r.cappedOut = r3(r.cappedOut + cut);
      excess -= cut;
    }
  }
  for (const r of rows) {
    r.applied = r3(r.applied);
    r.surplus = r3(Math.max(0, r.earned - r.applied - r.cappedOut));
  }
  return {
    rows,
    applied: r3(sum(rows, (r) => r.applied)),
    transferApplied: r3(sum(rows, fromTransfer)),
    surplus: r3(sum(rows, (r) => r.surplus)),
    cappedOut: r3(sum(rows, (r) => r.cappedOut))
  };
}

/* ---------------------------------------------------------------- The plan
   What is left to earn: whatever each requirement still lacks. EHS's minimum
   at EHS is reported beside it rather than folded in, so the headline number
   is the one EHS's record prints and the minimum is a check a student can see
   and ask about — not a figure that silently disagrees with their school. */
function plan(rows) {
  for (const r of rows) {
    const gap = Math.max(0, r.required - r.applied);
    r.remaining = r3(gap);
    r.planAtEhs = r3(gap);
    r.residencyMin = RESIDENCY[r.key] || 0;
    // What the minimum would ask beyond the gap, which is earned at EHS anyway.
    r.residencyExtra = r3(Math.max(0, r.residencyMin - r.ehs - gap));
    r.complete = gap <= 1e-9;
    r.percent = Math.round(Math.min(1, r.applied / r.required) * 100);
  }
  return r3(sum(rows, (r) => r.planAtEhs));
}

function residencyOf(track, rows, planTotal, evaluated) {
  const byArea = rows.filter((r) => r.residencyMin > 0).map((r) => ({
    key: r.key, name: r.name, min: r.residencyMin, atEhs: r.ehs, planned: r.planAtEhs, extra: r.residencyExtra
  }));
  const areaExtra = r3(sum(byArea, (a) => a.extra));
  const earnedAtEhs = r3(sum(rows, (r) => r.ehs));
  const overallExtra = r3(Math.max(0, track.minAtEhs - earnedAtEhs - planTotal - areaExtra));
  const extra = r3(areaExtra + overallExtra);
  return {
    minAtEhs: track.minAtEhs, earnedAtEhs, planned: planTotal, byArea, extra, overallExtra,
    met: extra <= 1e-9,
    says: extra <= 1e-9
      ? cr(earnedAtEhs) + " earned with EHS, and the " + cr(planTotal) + " still to go are earned there too — " +
        "past EHS's " + track.minAtEhs + "-credit minimum."
      : evaluated
        ? "EHS publishes a minimum to be earned with it: 1 each in English, Math, Science and Social Studies, " +
          "and 2 in electives. Your transfer has already been evaluated, so ask your advisor whether it " +
          "still applies to you."
        : "EHS publishes a minimum to be earned with it: 1 each in English, Math, Science and Social Studies, " +
          "and 2 in electives. It applies when EHS evaluates your transfer, so plan for it."
  };
}

/* ------------------------------------------------------------------ Ledger
   Which course fills which part of each requirement. EHS coursework first,
   because transfer is what the cap trims; then the previous school's, oldest
   first, so the credit beyond a requirement is the most recent one. */
function ledger(track, rows, items) {
  const keys = track.areas.map((a) => a[0]);
  const byArea = new Map(rows.map((r) => [r.key, []]));
  for (const it of items) {
    if (!(it.credits > 0)) continue;
    byArea.get(keys.includes(it.area) ? it.area : "elective").push(it);
  }
  const order = (a, b) =>
    (a.source === b.source ? 0 : a.source === "ehs" ? -1 : 1) ||
    String(a.year || "").localeCompare(String(b.year || "")) ||
    a.pos - b.pos;
  for (const r of rows) {
    let room = r.required;
    const out = byArea.get(r.key).sort(order).map((it) => {
      const applied = Math.min(it.credits, Math.max(0, room));
      room -= applied;
      return { ...it, applied: r3(applied), surplus: r3(it.credits - applied), capped: 0 };
    });
    let cut = r.cappedOut || 0;
    for (let i = out.length - 1; i >= 0 && cut > 1e-9; i--) {
      if (out[i].source !== "transfer") continue;
      const take = Math.min(cut, out[i].applied);
      out[i].applied = r3(out[i].applied - take);
      out[i].capped = r3(take);
      cut -= take;
    }
    r.items = out.map(({ pos, ...rest }) => rest);
  }
}

/* The five subject groups EHS's record prints on its first page: the four
   core subjects, and Electives holding Health, PE and Fine Art with them. */
function groupsOf(track, rows) {
  const has = (k) => track.areas.some((a) => a[0] === k);
  const spec = [["english", "English"], ["math", "Mathematics"], ["science", "Science"],
                ["social_studies", "Social Studies"]];
  if (has("world_language")) spec.push(["world_language", "World Language"]);
  spec.push(["elective", "Electives"]);
  const groupOf = (k) => (spec.some((s) => s[0] === k) ? k : "elective");
  for (const r of rows) r.group = groupOf(r.key);
  return spec.map(([key, name]) => {
    const mine = rows.filter((r) => r.group === key);
    const required = r3(sum(mine, (r) => r.required));
    const earned = r3(sum(mine, (r) => r.earned - r.cappedOut));
    return { key, name, required, earned, left: r3(Math.max(0, required - earned)),
             areas: mine.map((r) => r.key), includes: mine.length > 1 ? mine.map((r) => r.name) : null };
  });
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
           closest, surplus, pathways, passed: sittings.filter((s) => s.score != null && s.score >= EXAM_PASS).length,
           taken: sittings.length,
           says: "Thresholds as printed on the transcript — 65 to pass, 55–64 accepted by the low-pass " +
                 "safety net, four core areas plus a fifth assessment. EHS does not require state exams; " +
                 "this is your New York record, and a counsellor confirms what it means for you." };
}

/* -------------------------------------------------------------------- Pace
   A credit count says how far. It never says when — and "when" is the half a
   student actually schedules their life around. The rate comes from their own
   record rather than a school average, because the only pace anybody believes
   is the one they have already kept. An enrolled student has kept one at EHS,
   and that is the better evidence; an applicant has only their old school's. */
export function pace({ courses, ehsCourses = [], planAtEhs, program, now = Date.now() }) {
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

  const ehsCredits = r3(sum((ehsCourses || []).filter((c) => c.status === "completed"),
                            (c) => Number(c.credits || 0)));
  const enrolledAt = program && program.enrolled_at ? Number(program.enrolled_at) : null;
  const monthsEnrolled = enrolledAt && now > enrolledAt
    ? r1((now - enrolledAt) / (1000 * 60 * 60 * 24 * 30.4375)) : null;

  let perYear = 0, basis = null;
  if (ehsCredits > 0 && monthsEnrolled != null && monthsEnrolled >= 2) {
    perYear = r3(ehsCredits / monthsEnrolled * 12);
    basis = "ehs";
  } else if (years.length) {
    perYear = r3(sum(years, (y) => y.credits) / years.length);
    basis = "record";
  }
  const left = r3(Math.max(0, Number(planAtEhs) || 0));
  const monthsToGo = left <= 0 ? 0 : perYear > 0 ? Math.ceil((left / perYear) * 12) : null;

  let finishBy = null;
  if (monthsToGo != null) {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() + monthsToGo);
    finishBy = d.toISOString().slice(0, 7);
  }
  const expected = program && program.expected_grad ? String(program.expected_grad) : null;
  const aheadOfPlan = expected && finishBy ? (finishBy <= expected) : null;

  let says;
  if (left <= 0) says = "Every requirement is met.";
  else if (basis === "ehs") {
    says = "You have earned " + cr(ehsCredits) + creditWord(ehsCredits) + " in " + Math.round(monthsEnrolled) +
           " months at EHS — about " + r1(perYear) + " a year. At that pace the " + cr(left) +
           creditWord(left) + " left take " + spellMonths(monthsToGo) + ".";
  } else if (basis === "record") {
    says = "Your own record runs at " + r1(perYear) + " EHS credits a year. At that rate the " + cr(left) +
           creditWord(left) + " left at EHS take " + spellMonths(monthsToGo) + ".";
  } else {
    says = "There is no finished year on the record yet, so there is no pace to project from.";
  }

  return {
    basis, years, ehsCredits, monthsEnrolled, creditsPerYear: r1(perYear), creditsLeft: left, monthsToGo,
    finishBy, expected, aheadOfPlan, duration: spellMonths(monthsToGo), says,
    assumption: basis === "ehs"
      ? "Projected from the pace you have kept at EHS since you enrolled, assuming you keep it. It is an " +
        "estimate of time, not a commitment from the school."
      : "Projected from the pace of your own previous record, not from an EHS schedule. EHS does not " +
        "publish how many credits a term carries, so this is an estimate of time, not a commitment from " +
        "the school."
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
  // Worth naming only where something is actually wrong. A gap with good
  // marks and no lost credit is a plan, not a risk, and calling it one is the
  // kind of alarm that teaches a student to stop reading the page.
  if (!top.failed.length && (top.average == null || top.average >= 75)) return null;
  const evidence = [
    cr(top.planAtEhs) + creditWord(top.planAtEhs) + " still to earn here — " +
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
   handed a prophecy about a mark nobody has given yet. Terms when the record
   has them; whole school years otherwise, and then the one comparison that
   matters to a student who changed schools — before EHS, and at it. */
export function momentum(terms, years) {
  const list = (terms || []).filter((t) => t && t.average != null);
  if (list.length >= 2) {
    const first = list[0], last = list[list.length - 1];
    const best = list.reduce((b, t) => (t.average > b.average ? t : b), list[0]);
    const recent = list.slice(-4);
    const slope = r3((recent[recent.length - 1].average - recent[0].average) / Math.max(1, recent.length - 1));
    const direction = slope > 0.5 ? "rising" : slope < -0.5 ? "falling" : "steady";
    const delta = r3(last.average - first.average);
    return {
      basis: "terms", first, last, best, delta, slope, direction, terms: list.length,
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

  const ys = (years || []).filter((y) => y.average != null);
  if (ys.length < 2) return null;
  const first = ys[0], last = ys[ys.length - 1];
  const best = ys.reduce((b, y) => (y.average > b.average ? y : b), ys[0]);
  const atEhs = ys.filter((y) => y.school === "ehs");
  const before = ys.filter((y) => y.school === "transfer");
  const high = "Your best year was " + best.average + " in " + yearLabel(best.year) + ".";
  if (atEhs.length && before.length) {
    const prev = before[before.length - 1], now = atEhs[atEhs.length - 1];
    const lift = r1(now.average - prev.average);
    return {
      basis: "years", first, last, best, delta: r1(last.average - first.average), lift,
      direction: lift > 0.5 ? "rising" : lift < -0.5 ? "falling" : "steady",
      says: lift > 0.5
        ? "At EHS your marks average " + now.average + " — " + lift + " points above your last year before it " +
          "(" + prev.average + " in " + yearLabel(prev.year) + ")."
        : lift < -0.5
          ? "At EHS your marks average " + now.average + ", " + Math.abs(lift) + " points below " +
            yearLabel(prev.year) + ". That is a fact about a year already finished, not a forecast."
          : "At EHS your marks average " + now.average + ", in line with " + yearLabel(prev.year) + ".",
      high
    };
  }
  const delta = r1(last.average - first.average);
  return {
    basis: "years", first, last, best, delta,
    direction: delta > 0.5 ? "rising" : delta < -0.5 ? "falling" : "steady",
    says: "From " + yearLabel(first.year) + " to " + yearLabel(last.year) + " your yearly average moved " +
          (delta >= 0 ? "up " : "down ") + Math.abs(delta) + " points.",
    high
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
    if (s.kind === "course") {
      return { ...s, impact: 85, effort: "a course you’re already in",
        why: "It is the only credit on this list that needs no new enrolment — the course is open, and " +
             "every unit you finish is work toward it." };
    }
    if (s.kind === "review") {
      const hit = String(s.detail).match(/([\d.]+) credit/);
      const at = Number(hit ? hit[1] : 0);
      return { ...s, impact: Math.min(80, 40 + at * 20), effort: "one question to the registrar",
        why: "Asking settles it now rather than in the final audit." };
    }
    const hit = String(s.title).match(/([\d.]+) credit/);
    const credits = Number(hit ? hit[1] : 0);
    return { ...s, impact: Math.min(70, credits * 12), effort: credits ? cr(credits) + creditWord(credits) + " of coursework" : "coursework",
      why: "Required before the diploma, and the work is yours to schedule." };
  }).sort((a, b) => b.impact - a.impact);

  return { steps: scored, focus: scored[0] || null };
}

/* ---------------------------------------------------------------- Dashboard */
export function buildDashboard({ account, program, records, courses, exams, current,
                                 ehsCourses = [], now = Date.now() }) {
  const trackKey = program && TRACKS[program.track] ? program.track : "21.5";
  const track = TRACKS[trackKey];
  const counted = courses.filter((c) => c.decision !== "declined");
  const record = records[records.length - 1] || null;
  const evaluated = !!(record && record.status === "evaluated");
  const recordById = new Map(records.map((r) => [r.id, r]));
  const factorOf = (c) => {
    const rec = recordById.get(c.record_id);
    const cs = rec && CREDIT_SYSTEMS[rec.credit_system];
    return cs ? cs.factor : 1;
  };
  const ehsDone = (ehsCourses || []).filter((c) => c.status === "completed");
  let issued = {};
  try { issued = program && program.issued_json ? JSON.parse(program.issued_json) || {} : {}; }
  catch { issued = {}; }
  let summary = {};
  try { summary = record && record.summary_json ? JSON.parse(record.summary_json) : {}; }
  catch { summary = {}; }

  /* --------------------------------------------------------- Allocation */
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
  const ehsByArea = {};
  for (const c of ehsDone) {
    const area = c.area || "elective";
    ehsByArea[area] = (ehsByArea[area] || 0) + Number(c.credits || 0);
  }

  // The conservative case: every subject in every year rounded down to whole
  // semesters, which is the most EHS could reasonably decline. Once EHS has
  // evaluated the transfer there is no case to make: its decision stands.
  const floored = {}, review = [];
  for (const g of Object.values(byAreaYear)) {
    const whole = Math.floor(g.credits * 2 + 1e-9) / 2;
    floored[g.area] = (floored[g.area] || 0) + whole;
    if (!evaluated && g.credits - whole > 1e-9) {
      review.push({ year: g.year, area: g.area, credits: r3(g.credits), atRisk: r3(g.credits - whole),
                    titles: g.titles,
                    reason: "EHS works in semesters of 0.5 credit. This subject adds up to part of a " +
                            "semester in this year, so the odd piece may not transfer." });
    }
  }

  const best = allocate(track, byArea, ehsByArea);
  const low = allocate(track, evaluated ? byArea : floored, ehsByArea);
  const planTotal = plan(best.rows);
  const groups = groupsOf(track, best.rows);
  const residency = residencyOf(track, best.rows, planTotal, evaluated);

  const items = [
    ...ehsDone.map((c) => ({
      id: c.id, source: "ehs", title: c.title, code: c.code, year: c.school_year, term: c.term,
      mark: c.mark, markNumeric: c.mark_numeric, letter: c.mark_numeric != null ? ehsLetter(c.mark_numeric) : null,
      credits: r3(Number(c.credits || 0)), area: c.area || "elective", pos: c.position || 0
    })),
    ...counted.map((c) => ({
      id: c.id, source: "transfer", title: c.title, code: c.code, year: c.school_year, term: c.term,
      mark: c.mark, markNumeric: c.mark_numeric, letter: c.mark_numeric != null ? ehsLetter(c.mark_numeric) : null,
      credits: r3(Number(c.ehs_credits || 0)), area: c.area || "elective", pos: 1000 + (c.position || 0)
    }))
  ];
  ledger(track, best.rows, items);

  const earned = r3(sum(best.rows, (r) => r.earned - r.cappedOut));
  const percent = Math.min(100, Math.round(earned / track.total * 1000) / 10);
  const requirementsPercent = Math.min(100, Math.round(best.applied / track.total * 1000) / 10);
  const netRemaining = r3(Math.max(0, track.total - earned));
  const transferEarned = r3(sum(counted, (c) => Number(c.ehs_credits || 0)));
  const ehsEarned = r3(sum(ehsDone, (c) => Number(c.credits || 0)));

  /* ------------------------------------------------------------- Grades
     Every lettered course on the record, weighted by the EHS credit it
     carries, on EHS's 4.0 scale. A course with a P carries credit and no
     points, so it is not in the average — as EHS computes it. */
  const lettered = [];
  for (const c of counted) {
    if (c.mark_numeric == null || !(c.attempted > 0) || flagsOf(c).includes("not_averaged")) continue;
    lettered.push({ source: "transfer", title: c.title, year: c.school_year, area: c.area || "elective",
                    mark: c.mark_numeric, credits: r3(Number(c.attempted) * factorOf(c)) });
  }
  for (const c of ehsDone) {
    if (c.mark_numeric == null || !(Number(c.credits) > 0)) continue;
    lettered.push({ source: "ehs", title: c.title, year: c.school_year, area: c.area || "elective",
                    mark: c.mark_numeric, credits: r3(Number(c.credits)) });
  }
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 }, distCredits = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let pts = 0, wt = 0;
  for (const c of lettered) {
    const l = ehsLetter(c.mark);
    c.letter = l;
    dist[l]++;
    distCredits[l] = r3(distCredits[l] + c.credits);
    pts += POINTS[l] * c.credits;
    wt += c.credits;
  }
  const gpaValue = wt ? Math.round(pts / wt * 100) / 100 : null;
  const issuedGpa = issued.gpa != null && isFinite(Number(issued.gpa)) ? Number(issued.gpa) : null;

  /* -------------------------------------------------------- Subject stars
     The strongest areas, by average mark. Shown because a student should see
     what they are good at, not only what they still owe. */
  const areaName = (k) => (TRACKS["24"].areas.find((a) => a[0] === k) || [k, k])[1];
  const bySubject = {};
  for (const c of lettered) {
    if (!bySubject[c.area]) bySubject[c.area] = { credits: 0, total: 0, n: 0 };
    bySubject[c.area].credits += c.credits;
    bySubject[c.area].total += c.mark * c.credits;
    bySubject[c.area].n++;
  }
  const strengths = Object.entries(bySubject)
    .map(([k, v]) => ({ area: k, name: areaName(k), average: r1(v.total / v.credits), marks: v.n }))
    .sort((a, b) => b.average - a.average);

  /* --------------------------------------------------------------- Years
     Credits and the credit-weighted average, one school year at a time,
     including the years in between with nothing on the record — a year with
     exams and no coursework is a thing a registrar should see, not a gap the
     chart quietly closes. A year with under one lettered credit gets no
     average: half a credit of Health is not a year's marks. */
  const yearMap = new Map();
  const touch = (y) => {
    if (!yearMap.has(y)) yearMap.set(y, { year: y, transfer: 0, ehs: 0, courses: 0, letteredCredits: 0, markSum: 0 });
    return yearMap.get(y);
  };
  for (const c of counted) {
    if (!c.school_year) continue;
    const y = touch(c.school_year);
    y.transfer += Number(c.ehs_credits || 0);
    y.courses++;
  }
  for (const c of ehsDone) {
    if (!c.school_year) continue;
    const y = touch(c.school_year);
    y.ehs += Number(c.credits || 0);
    y.courses++;
  }
  for (const c of lettered) {
    if (!c.year) continue;
    const y = touch(c.year);
    y.letteredCredits += c.credits;
    y.markSum += c.mark * c.credits;
  }
  const starts = [...yearMap.keys()].map(yearStart).filter((n) => n != null);
  if (starts.length) {
    for (let s = Math.min(...starts); s <= Math.max(...starts); s++) {
      if (![...yearMap.keys()].some((y) => yearStart(y) === s)) touch(s + "-" + (s + 1));
    }
  }
  const years = [...yearMap.values()]
    .sort((a, b) => (yearStart(a.year) ?? 0) - (yearStart(b.year) ?? 0))
    .map((y) => {
      const avg = y.letteredCredits > 0 ? r1(y.markSum / y.letteredCredits) : null;
      return {
        year: y.year, label: yearLabel(y.year),
        transfer: r3(y.transfer), ehs: r3(y.ehs), credits: r3(y.transfer + y.ehs), courses: y.courses,
        letteredCredits: r3(y.letteredCredits),
        average: y.letteredCredits >= 1 ? avg : null,
        thinAverage: y.letteredCredits > 0 && y.letteredCredits < 1 ? avg : null,
        school: y.ehs > 0 && y.transfer > 0 ? "both" : y.ehs > 0 ? "ehs" : y.transfer > 0 ? "transfer" : null,
        gap: y.courses === 0
      };
    });
  const ehsLettered = lettered.filter((c) => c.source === "ehs");
  const ehsCreditsLettered = sum(ehsLettered, (c) => c.credits);
  const ehsAverage = ehsCreditsLettered ? r1(sum(ehsLettered, (c) => c.mark * c.credits) / ehsCreditsLettered) : null;

  /* ---------------------------------------------------------- Achievements
     Every one is computed from the record. Nothing here is awarded for
     showing up, and each carries the evidence that earned it. */
  const exPassed = exams.filter((e) => e.status === "passed");
  const exNames = new Set(exPassed.map((e) => e.name));
  const retakeWin = exams.some((e) => e.status === "passed" && exams.some((o) =>
    o.name === e.name && o.status !== "passed" && String(o.sitting) < String(e.sitting)));
  // Whole words: "Participation in Government" is not an art course.
  const art = lettered.filter((c) => /\barts?\b|\bdraw|\bpaint|\bdesign\b/i.test(c.title));
  const honorsA = counted.filter((c) => flagsOf(c).includes("weighted") && c.mark_numeric >= 90);
  const recovered = courses.filter((c) => flagsOf(c).includes("recovered"));
  // Every numeric mark, not only the averaged ones: a school leaving PE out
  // of its average does not make a 100 in PE any less of a 100.
  const hundreds = [...courses, ...ehsDone].filter((c) => c.mark_numeric != null && c.mark_numeric >= 100);
  const terms = Array.isArray(summary.terms) ? summary.terms : [];
  const bestTerm = terms.reduce((b, t) => (t.average != null && (!b || t.average > b.average)) ? t : b, null);
  const bestYear = years.reduce((b, y) => (y.average != null && (!b || y.average > b.average)) ? y : b, null);
  const completeAreas = best.rows.filter((r) => r.complete && r.key !== "elective");
  const worldLanguage = r3((byArea.world_language || 0) + (ehsByArea.world_language || 0));

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
    { key: "ehs_ninety", name: "90+ at EHS", earned: ehsAverage != null && ehsAverage >= 90,
      detail: ehsAverage != null
        ? "Your EHS marks average " + ehsAverage + " across " + ehsLettered.length +
          (ehsLettered.length === 1 ? " course." : " courses.")
        : "Average 90 or above in your EHS courses." },
    { key: "perfect", name: "Perfect score", earned: hundreds.length > 0,
      detail: hundreds.length ? hundreds.length + (hundreds.length === 1 ? " mark" : " marks") +
                                " of 100: " + hundreds.map((c) => c.title).join(", ") + "."
                              : "Score 100 in a course." },
    { key: "honors", name: "Honors A", earned: honorsA.length > 0,
      detail: honorsA.length ? honorsA.map((c) => c.title + " " + c.mark_numeric).join(", ") + "."
                             : "Earn 90 or above in an honors course." },
    { key: "artist", name: "Artist", earned: art.length >= 4 && art.every((c) => c.mark >= 80),
      detail: art.length >= 4 && art.every((c) => c.mark >= 80)
        ? art.length + " art courses, every one at 80 or above."
        : art.length
          ? art.filter((c) => c.mark >= 80).length + " of the 4 art courses at 80 or above this asks for."
          : "Four art courses, every one at 80 or above." },
    { key: "comeback", name: "Comeback", earned: recovered.length > 0,
      detail: recovered.length ? recovered.map((c) => c.title).join(", ") +
                                 " — failed once, then earned the credit back."
                               : "Recover a credit you missed." },
    { key: "retake", name: "Retake win", earned: retakeWin,
      detail: "Passed a state exam on a second attempt after missing it the first time." },
    { key: "exams", name: "State exams passed", earned: exNames.size >= 3,
      detail: exNames.size + (exNames.size === 1 ? " exam" : " exams") + " passed" +
              (exNames.size ? ": " + [...exNames].join(", ") : "") + "." },
    { key: "language", name: "Bilingual track", earned: worldLanguage >= 2,
      detail: worldLanguage > 0
        ? cr(worldLanguage) + " of the 2.0 world-language credits the 24-credit track asks for."
        : "Two full years of a world language — the 24-credit track's language requirement." },
    { key: "best_term", name: terms.length ? "Term above 80" : "Year above 80",
      earned: terms.length ? !!(bestTerm && bestTerm.average >= 80) : !!(bestYear && bestYear.average >= 80),
      detail: terms.length
        ? (bestTerm ? "Best term: " + bestTerm.average + "% in " + bestTerm.term + "." : "Average 80 in a term.")
        : (bestYear ? "Best year: " + bestYear.average + " in " + yearLabel(bestYear.year) + "." : "Average 80 across a year.") },
    { key: "honor_roll", name: "Honor roll",
      earned: terms.length ? !!(bestTerm && bestTerm.average >= 85) : !!(bestYear && bestYear.average >= 85),
      detail: "Average 85 or above for a whole " + (terms.length ? "term." : "year.") },
    { key: "graduate", name: "Graduate", earned: planTotal <= 0,
      detail: "Every credit, every area. The diploma." }
  ];

  const milestones = [
    { at: 25, label: "Quarter way" }, { at: 50, label: "Halfway" },
    { at: 75, label: "Home stretch" }, { at: 100, label: "Diploma" }
  ].map((m) => ({ ...m, reached: m.at === 100 ? planTotal <= 0 : percent >= m.at }));

  /* ------------------------------------------------------ This year's courses
     What the student is enrolled in now, with the credit and area the course
     carries where it says. A course that fills a real gap is a step. */
  const inProgress = (current || []).filter((c) => c.credits > 0 && c.area);

  /* ---------------------------------------------------------- The gaps
     Each requirement still short, what is already on the way to it, and the
     EHS courses that would close it — less the ones already on the record. */
  const taken = [...courses, ...ehsCourses].map((c) => normTitle(c.title));
  const gaps = best.rows.filter((r) => r.planAtEhs > 0).map((r) => {
    const enrolled = inProgress.filter((c) => (TRACKS[trackKey].areas.some((a) => a[0] === c.area) ? c.area : "elective") === r.key)
      .map((c) => ({ title: c.title, credits: c.credits, percent: c.percent ?? null }));
    const enrolledTitles = enrolled.map((c) => normTitle(c.title));
    const options = (EHS_CATALOG[r.key] || []).filter((o) => {
      const n = normTitle(o);
      return !taken.some((t) => t === n || t.startsWith(n + " ")) && !enrolledTitles.includes(n);
    });
    const coming = r3(sum(enrolled, (c) => c.credits));
    return { key: r.key, name: r.name, left: r.planAtEhs, required: r.required, earned: r.earned,
             enrolled, enrolledCredits: coming, afterEnrolled: r3(Math.max(0, r.planAtEhs - coming)), options };
  });

  /* ---------------------------------------------------------- Next steps */
  const steps = [];
  if (record && record.kind !== "official" && !evaluated) {
    steps.push({ kind: "transcript", title: "Ask " + record.school + " to send your official transcript",
      detail: "EHS only accepts transcripts sent straight from the school — by email to " +
              "records@excelhighschool.com, by mail, or through Parchment. Until it arrives, every " +
              "transferred credit on this page is an estimate, and without it EHS would require all " +
              track.total + " credits to be earned at EHS." });
  }
  for (const gap of gaps) {
    for (const c of gap.enrolled) {
      steps.push({ kind: "course", area: gap.key,
        title: "Finish " + c.title,
        detail: "You are enrolled. It counts " + cr(c.credits) + " " + (AREA_WORD[gap.key] || gap.name) +
                creditWord(c.credits) + " — " + (c.credits >= gap.left
                  ? "enough to close " + gap.name + " on its own."
                  : cr(c.credits) + " of the " + cr(gap.left) + " still to go there.") });
    }
    const r = best.rows.find((x) => x.key === gap.key);
    steps.push({ kind: "area", area: gap.key,
      title: gap.name + " — " + cr(gap.left) + creditWord(gap.left) + " at EHS",
      detail: cr(r.earned) + " of " + cr(r.required) + " earned" +
              (gap.enrolledCredits ? ", with " + cr(gap.enrolledCredits) + " already in progress" : "") + "." +
              (gap.options.length ? " EHS offers " + listOf(gap.options.slice(0, 4)) + "." : "") });
  }
  for (const a of residency.byArea) {
    if (a.extra <= 0) continue;
    steps.push({ kind: "review", area: a.key,
      title: "Ask whether EHS's " + a.name + " minimum applies to you",
      detail: cr(a.extra) + " credit: EHS asks for " + cr(a.min) + " in " + a.name + " to be earned with it, " +
              "and " + cr(a.atEhs) + " is. " + (evaluated ? "Your transfer is already evaluated, so your advisor can say." : "") });
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
    earned, percent, requirementsPercent, netRemaining,
    applied: best.applied, surplus: best.surplus,
    earnedTowardDiploma: best.applied,
    transferEarned, transferEstimate: best.transferApplied,
    transferConservative: evaluated ? best.transferApplied : low.transferApplied,
    transferCourses: counted.length,
    ehsEarned, ehsCourses: ehsDone.length,
    remaining: planTotal, planAtEhs: planTotal
  };

  /* -------------------------------------------------------------- Checks
     The record read against itself, the way a registrar would: every line is
     a comparison between two things already on it, and says which way it came
     out. "Checks out" is as much a finding as "look at this". */
  const checks = [];
  const gapRows = best.rows.filter((r) => r.planAtEhs > 0);
  if (best.surplus > 0 && planTotal > netRemaining + 1e-9) {
    const extras = best.rows.filter((r) => r.surplus > 0);
    checks.push({ key: "surplus", level: "info",
      title: cr(planTotal) + " to plan against, not " + cr(netRemaining),
      detail: track.total + " − " + cr(earned) + " leaves " + cr(netRemaining) + " on paper. But " +
              listOf(extras.map((r) => cr(r.surplus) + " in " + r.name)) +
              " is credit beyond " + (extras.length === 1 ? "its requirement" : "those requirements") +
              ", and extra in one requirement cannot fill another — so " +
              listOf(gapRows.map((r) => r.name + " (" + cr(r.planAtEhs) + ")")) + " still need " + cr(planTotal) + "." });
  }
  if (issuedGpa != null && gpaValue != null) {
    const same = Math.abs(issuedGpa - gpaValue) < 0.005;
    checks.push({ key: "gpa", level: same ? "ok" : "check",
      title: same ? "GPA " + issuedGpa.toFixed(2) + " checks out"
                  : "GPA: EHS issued " + issuedGpa.toFixed(2) + ", the record adds up to " + gpaValue.toFixed(2),
      detail: "Recomputed from " + lettered.length + " lettered courses: " + r3(pts) + " quality points over " +
              cr(wt) + " credits" + (same ? ", the same as EHS issued." : ". Worth asking which course is counted differently.") });
  }
  if (issued.creditsEarned != null && isFinite(Number(issued.creditsEarned))) {
    const same = Math.abs(Number(issued.creditsEarned) - earned) < 0.01;
    checks.push({ key: "credits", level: same ? "ok" : "check",
      title: same ? cr(earned) + " credits checks out" : "Credits: EHS printed " + cr(issued.creditsEarned) + ", the courses add up to " + cr(earned),
      detail: cr(transferEarned) + " transferred + " + cr(ehsEarned) + " earned at EHS" +
              (same ? ", course by course — the same total EHS printed." : ".") });
  }
  if (record && evaluated) {
    const under = transferEarned <= track.transferCap;
    checks.push({ key: "transfer", level: under ? "ok" : "check",
      title: under ? cr(transferEarned) + " transferred, within the " + track.transferCap + "-credit limit"
                   : cr(transferEarned) + " transferred — " + track.transferCap + " can count",
      detail: counted.length + " courses from " + record.school + ", as EHS evaluated them." });
  }
  for (const a of residency.byArea) {
    if (a.extra <= 0) continue;
    checks.push({ key: "residency_" + a.key, level: "check",
      title: a.name + ": " + cr(a.atEhs) + " of " + cr(a.min) + " earned with EHS",
      detail: "EHS publishes a minimum of " + cr(a.min) + " " + a.name + creditWord(a.min) + " earned with it. " +
              (evaluated ? "Your transfer is already evaluated, so ask your advisor whether it still applies — "
                         : "It applies when EHS evaluates your transfer — ") +
              "if it does, it adds " + cr(a.extra) + " to the plan." });
  }
  if (residency.met && ehsEarned > 0) {
    checks.push({ key: "residency", level: "ok", title: "EHS's " + track.minAtEhs + "-credit minimum is covered",
                  detail: residency.says });
  }
  if (exams.length) {
    for (const a of board.areas.filter((x) => x.state === "none")) {
      checks.push({ key: "exam_" + a.key, level: "info",
        title: "No " + (a.key === "english" ? "English Language Arts" : a.name) + " exam on the record",
        detail: "Every other core area has an exam. EHS does not require state exams; New York's Regents " +
                "diploma would. Ask your advisor whether that matters for you." });
    }
    if (board.surplus.length) {
      checks.push({ key: "exam_surplus", level: "ok",
        title: listOf(board.surplus.map((s) => s.name + " " + s.score)) + " blocks nothing",
        detail: "That area is already covered by another exam at 65 or above." });
    }
    const courseYears = new Set([...courses.map((c) => c.school_year), ...ehsCourses.map((c) => c.school_year)].filter(Boolean));
    const orphan = new Map();
    for (const e of exams) {
      const y = schoolYearOf(e.sitting);
      if (!y || courseYears.has(y) || yearStart(y) < Math.min(...[...courseYears].map(yearStart))) continue;
      if (!orphan.has(y)) orphan.set(y, []);
      orphan.get(y).push(e.name);
    }
    for (const [y, names] of orphan) {
      checks.push({ key: "orphan_" + y, level: "check",
        title: yearLabel(y) + " has exams but no coursework",
        detail: listOf(names) + " " + (names.length === 1 ? "was" : "were") + " sat that year, and no course " +
                "from it is on the record. Worth confirming nothing is missing." });
    }
  }
  if (program && !program.grade_level && (ehsDone.length || record)) {
    checks.push({ key: "grade", level: "info", title: "Grade level isn't on file",
      detail: "It does not change a credit, but it is worth confirming with the registrar so reports place " +
              "you correctly." });
  }

  const ranked = leverage(steps, { totals, track, board });
  const paceOut = pace({ courses, ehsCourses, planAtEhs: planTotal, program, now });
  const riskOut = riskArea({ rows: best.rows, strengths, courses });
  const momentumOut = momentum(terms, years);

  const out = (c) => ({
    id: c.id, source: "transfer", year: c.school_year, gradeLevel: c.grade_level, term: c.term, code: c.code,
    title: c.title, mark: c.mark, markNumeric: c.mark_numeric,
    letter: c.mark_numeric != null ? ehsLetter(c.mark_numeric) : null,
    attempted: c.attempted, earned: c.earned, area: c.area, flags: flagsOf(c),
    ehsCredits: c.ehs_credits, decision: c.decision, note: c.note
  });

  return {
    account: account ? { id: account.id, name: account.name, firstName: account.first_name } : null,
    program: program ? { name: program.program, track: program.track, gradeLevel: program.grade_level,
                         expectedGrad: program.expected_grad } : null,
    enrollment: program && (program.enrolled_at || program.status) ? {
      enrolledOn: program.enrolled_at ? new Date(Number(program.enrolled_at)).toISOString().slice(0, 10) : null,
      status: program.status || null,
      monthsEnrolled: paceOut.monthsEnrolled
    } : null,
    issued: Object.keys(issued).length ? issued : null,
    track: { key: track.key, name: track.name, total: track.total,
             transferCap: track.transferCap, minAtEhs: track.minAtEhs },
    totals,
    groups,
    areas: best.rows.map((r) => ({
      key: r.key, name: r.name, group: r.group, required: r.required, transfer: r.transfer, ehs: r.ehs,
      earned: r.earned, applied: r.applied, surplus: r.surplus, cappedOut: r.cappedOut,
      remaining: r.remaining, planAtEhs: r.planAtEhs, residencyMin: r.residencyMin, residencyExtra: r.residencyExtra,
      complete: r.complete, percent: r.percent, fromOtherAreas: r.fromOtherAreas || 0, items: r.items
    })),
    residency,
    gaps,
    transfer: record ? {
      id: record.id, school: record.school, authority: record.authority, kind: record.kind,
      status: record.status, statusSteps, statusAt, printedOn: record.printed_on,
      creditSystem: record.credit_system,
      conversion: (CREDIT_SYSTEMS[record.credit_system] || {}).says || null,
      creditsEarned: summary.creditsEarned ?? null, creditsAttempted: summary.creditsAttempted ?? null,
      cumulativeAverage: summary.cumulativeAverage ?? null,
      courses: counted.length, credits: transferEarned,
      firstYear: counted.map((c) => c.school_year).filter(Boolean).sort()[0] || null,
      lastYear: counted.map((c) => c.school_year).filter(Boolean).sort().slice(-1)[0] || null,
      review
    } : null,
    ehs: {
      count: ehsDone.length, credits: ehsEarned, average: ehsAverage,
      inProgress: (ehsCourses || []).filter((c) => c.status === "in_progress").length
    },
    trend: terms,
    years,
    gpa: { value: gpaValue, estimate: gpaValue, issued: issuedGpa, matchesIssued:
             issuedGpa != null && gpaValue != null ? Math.abs(issuedGpa - gpaValue) < 0.005 : null,
           credits: r3(wt), points: r3(pts),
           scale: "EHS 4.0 (A 90+, B 80+, C 70+, D 60+)", courses: lettered.length,
           distribution: dist, distributionCredits: distCredits },
    marks: lettered.map((c) => ({ source: c.source, title: c.title, year: c.year, area: c.area,
                                  mark: c.mark, letter: c.letter, credits: c.credits })),
    strengths,
    courses: counted.concat(courses.filter((c) => c.decision === "declined")).map(out),
    ehsCourses: (ehsCourses || []).map((c) => ({
      id: c.id, source: "ehs", year: c.school_year, term: c.term, code: c.code, title: c.title,
      mark: c.mark, markNumeric: c.mark_numeric, letter: c.mark_numeric != null ? ehsLetter(c.mark_numeric) : null,
      credits: c.credits, area: c.area, status: c.status, courseId: c.course_id || null
    })),
    exams: exams.map((e) => ({ name: e.name, sitting: e.sitting, score: e.score, status: e.status,
                               passed: e.status === "passed" })),
    stateTests: Array.isArray(summary.stateTests) ? summary.stateTests : [],
    current: current || [],
    milestones, achievements, nextSteps: ranked.steps, focus: ranked.focus,
    board, pace: paceOut, risk: riskOut, momentum: momentumOut, checks,
    assumptions: [
      record && record.kind !== "official" && !evaluated
        ? "Transfer credit is estimated from an unofficial copy. EHS makes the official evaluation " +
          "after enrollment, from a transcript sent by the previous school."
        : null,
      evaluated ? "Transferred credit is shown as EHS evaluated it." : null,
      record ? (CREDIT_SYSTEMS[record.credit_system] || {}).says : null,
      "A credit counts in the requirement it was earned in. Credit beyond a requirement is shown as extra " +
      "and not moved into Electives — that is how EHS's own record counts it.",
      issuedGpa != null
        ? "GPA is recomputed over every lettered course, transferred and EHS, on EHS's 4.0 scale, and checked " +
          "against the GPA EHS issued. Courses marked P carry credit and no points."
        : "The grade-point figure puts every lettered mark on EHS's 4.0 scale, weighted by credit. EHS does " +
          "not publish whether transferred grades enter its own GPA."
    ].filter(Boolean)
  };
}
