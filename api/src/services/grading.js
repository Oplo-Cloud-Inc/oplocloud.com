/* ==========================================================================
   Grading and the exam cycle.

   A scale is the school's, not this file's: the templates below are where a
   school STARTS, from what its board published, and each says what it was
   taken from so the school can check it against the board's current circular
   before using it. (Boards change them; sources disagree on some pass marks.)
   A scale with no bands is "marks and percentage only", which is what a board
   that grades by paper rather than by percentage needs.

   Pure: no database, no clock. api/scripts/test-grading.mjs checks it.
   ========================================================================== */

export const EPS = 1e-9;

/* Where a school starts. `note` is shown with the scale. */
export const TEMPLATES = [
  { key: "cbse-9", name: "CBSE nine-point scale", board: "CBSE", kind: "scholastic", passPercent: 33,
    bands: [[91, "A1", 10], [81, "A2", 9], [71, "B1", 8], [61, "B2", 7], [51, "C1", 6], [41, "C2", 5], [33, "D", 4], [21, "E1", null], [0, "E2", null]],
    note: "A1 to E2 by marks, 33% to pass a subject, as CBSE has published them for Classes IX and X. CBSE has announced changes to the scale from 2027: check this against its current circular before using it." },
  { key: "percent", name: "Percentage only", board: null, kind: "scholastic", passPercent: 33, bands: [],
    note: "Marks and percentage with a pass line, and no letter. Add bands if the school gives grades." },
  { key: "cisce-marks", name: "CISCE marks", board: "CISCE", kind: "scholastic", passPercent: 35, bands: [],
    note: "Marks and percentage. The pass mark is the school's to confirm: published sources give 33% and 35%, and 35% and 40% for ISC. Check the Council's current regulations and set it." },
  { key: "co-5", name: "Co-scholastic grades", board: null, kind: "coscholastic",
    bands: [["A", "Outstanding"], ["B", "Very good"], ["C", "Good"], ["D", "Fair"], ["E", "Needs improvement"]],
    note: "A to E, given directly by the teacher for art, health and sport, discipline and the like." }
];

export const AREAS = ["Art education", "Health and physical education", "Work education", "Discipline"];

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

/* The bands of a scholastic scale as stored: [{ min, grade, point }], highest first. */
export function bandsOf(json) {
  let list;
  try { list = JSON.parse(json || "[]"); } catch { list = []; }
  return Array.isArray(list) ? list : [];
}

export function fromTemplate(t) {
  const bands = t.kind === "coscholastic"
    ? t.bands.map(([grade, label]) => ({ grade, label }))
    : t.bands.map(([min, grade, point]) => ({ min, grade, ...(point != null ? { point } : {}) }));
  return { name: t.name, board: t.board, kind: t.kind, bands, passPercent: t.passPercent ?? null, note: t.note };
}

/* A scale a person typed, checked. `fail(message, field)` throws. */
export function cleanScale(src, fail) {
  const out = {};
  const name = String(src.name || "").trim();
  if (!name) fail("A scale needs a name.", "name");
  if (name.length > 80) fail("That name is too long.", "name");
  out.name = name;
  out.kind = src.kind === "coscholastic" ? "coscholastic" : "scholastic";
  out.board = src.board ? String(src.board).trim().slice(0, 20) : null;
  out.note = src.note ? String(src.note).trim().slice(0, 600) : null;
  const pp = src.passPercent === undefined || src.passPercent === null || src.passPercent === "" ? null : Number(src.passPercent);
  if (pp !== null && !(pp >= 0 && pp <= 100)) fail("A pass mark is a percentage from 0 to 100.", "passPercent");
  out.passPercent = pp;
  const raw = Array.isArray(src.bands) ? src.bands : [];
  if (raw.length > 30) fail("A scale has at most 30 bands.", "bands");
  if (out.kind === "coscholastic") {
    const seen = new Set();
    out.bands = raw.map((b) => {
      const grade = String((b && b.grade) || "").trim().slice(0, 8);
      if (!grade) fail("Every grade needs a letter.", "bands");
      if (seen.has(grade)) fail("A grade is listed twice: " + grade + ".", "bands");
      seen.add(grade);
      return { grade, label: String((b && b.label) || "").trim().slice(0, 60) };
    });
    if (!out.bands.length) fail("List the grades a teacher may give.", "bands");
    out.passPercent = null;
  } else {
    const bands = raw.map((b) => {
      const min = Number(b && b.min), grade = String((b && b.grade) || "").trim().slice(0, 8);
      if (!(min >= 0 && min <= 100)) fail("A band starts at a percentage from 0 to 100.", "bands");
      if (!grade) fail("Every band needs a grade.", "bands");
      const point = b && b.point !== undefined && b.point !== null && b.point !== "" ? Number(b.point) : null;
      if (point !== null && !(point >= 0 && point <= 100)) fail("A grade point is a number.", "bands");
      return { min, grade, ...(point !== null ? { point } : {}) };
    }).sort((a, b) => b.min - a.min);
    for (let i = 1; i < bands.length; i++) if (bands[i].min === bands[i - 1].min) fail("Two bands start at " + bands[i].min + "%.", "bands");
    if (bands.length && bands[bands.length - 1].min > 0) fail("The lowest band must start at 0%, so every mark has a grade.", "bands");
    out.bands = bands;
  }
  return out;
}

/* The band a percentage falls in, or null on a scale with no bands. */
export function bandFor(percent, bands) {
  if (percent == null || !bands || !bands.length) return null;
  for (const b of bands) if (percent + EPS >= b.min) return b;
  return bands[bands.length - 1];
}

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/* Marks a teacher typed for one child on one paper, checked against what the paper is out of. */
export function cleanMark(paper, src, fail) {
  const out = { absent: src.absent === true || src.absent === 1 || src.absent === "AB" ? 1 : 0 };
  for (const [k, max] of [["theory", paper.max_theory], ["internal", paper.max_internal], ["practical", paper.max_practical]]) {
    const v = num(src[k]);
    if (v === null || out.absent) { out[k] = null; continue; }
    if (!Number.isFinite(v)) fail(`${k}: a number.`, k);
    if (v < 0) fail(`${k}: marks cannot be below 0.`, k);
    if (v > max + EPS) fail(`${k}: out of ${max}, and ${v} is more.`, k);
    out[k] = round2(v);
  }
  return out;
}

/* One child's line on one paper. `mark` is the row or null. */
export function lineOf(paper, mark, scale) {
  const max = (paper.max_theory || 0) + (paper.max_internal || 0) + (paper.max_practical || 0);
  const bands = scale ? scale.bands : [];
  const passLine = scale ? scale.passPercent : null;
  if (!mark) return { subject: paper.subject, max, absent: false, missing: true, total: null, percent: null, grade: null, point: null, pass: null };
  if (mark.absent) return { subject: paper.subject, max, absent: true, missing: false, total: null, percent: null, grade: "AB", point: null, pass: false };
  const parts = [mark.theory, mark.internal, mark.practical];
  const entered = [[mark.theory, paper.max_theory], [mark.internal, paper.max_internal], [mark.practical, paper.max_practical]].filter(([, m]) => m > 0);
  // Every part the paper has must have a mark before there is a total: half a paper is not a score.
  const missing = entered.some(([v]) => v == null);
  if (missing) return { subject: paper.subject, max, absent: false, missing: true, total: null, percent: null, grade: null, point: null, pass: null, theory: mark.theory, internal: mark.internal, practical: mark.practical };
  const total = round2(parts.reduce((a, v) => a + (v || 0), 0));
  const percent = max ? round1((total / max) * 100) : null;
  const b = bandFor(max ? (total / max) * 100 : null, bands);
  return { subject: paper.subject, max, absent: false, missing: false, theory: mark.theory, internal: mark.internal, practical: mark.practical,
           total, percent, grade: b ? b.grade : null, point: b && b.point !== undefined ? b.point : null,
           pass: passLine == null ? null : (max ? (total / max) * 100 + EPS >= passLine : null) };
}

/* A report card from the published lines of every paper of a child. */
export function cardOf(lines, scale, extra = {}) {
  const counted = lines.filter((l) => !l.missing && !l.absent);
  const total = round2(counted.reduce((a, l) => a + l.total, 0));
  const max = counted.reduce((a, l) => a + l.max, 0);
  const percent = max ? round1((total / max) * 100) : null;
  const failed = lines.filter((l) => l.pass === false).map((l) => l.subject);
  const incomplete = lines.filter((l) => l.missing).map((l) => l.subject);
  const b = percent == null ? null : bandFor((total / max) * 100, scale ? scale.bands : []);
  const result = incomplete.length ? "incomplete" : scale && scale.passPercent == null ? "none" : failed.length ? "fail" : lines.length ? "pass" : "none";
  return { subjects: lines, total, max, percent, grade: b ? b.grade : null, failed, incomplete, result, ...extra };
}

/* The states a paper moves through, and who may move it. */
export const STATES = ["entry", "submitted", "checked", "approved", "published"];
export const LOCKED_STATES = ["approved", "published"];
export function canMove(from, to) {
  const i = STATES.indexOf(from), j = STATES.indexOf(to);
  if (i < 0 || j < 0) return false;
  if (j === i + 1) return true;                           // forward, one step at a time
  return j === 0 && i > 0 && i < STATES.indexOf("published");   // back to the teacher, from anywhere before it is published
}
export const stepRole = { submitted: "enter", checked: "check", approved: "approve", published: "publish" };
