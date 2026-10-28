/* ==========================================================================
   The student directory — what the list shows, and how it is cut.

   Pure: no database, no clock. routes/directory.js loads the school's students
   once, with each one's attendance standing and early-warning reading, and this
   turns them into rows, applies the filters a person chose, counts what each
   quick chip would show, sorts, and takes one page. Counting has to be on the
   whole list, so the list is whole in memory (a school's few thousand rows),
   and only the page leaves the server.

   The filters are the address's words (?class=X-C&attendance=under-75&q=jindal):

     q            name, admission no., roll, class, APAAR last four, guardian's name or phone
     class        section labels, comma separated        X-C,XI-A
     house, category, gender, stream, transport, blood, language
     status       enrolled (default) · left · all
     attendance   under-75        warning  high,medium      consent  pending
     filter       record-gaps     cwsn     yes              new      1
     apaar        generated,pending,refused,not_generated   pen  on_file | missing
     from, to     admitted between (YYYY-MM-DD)
     sort, dir    column and asc|desc      page, size
   ========================================================================== */

import { classCode } from "./search.js";

export const PAGE = 50;
export const MAX_PAGE = 100;
export const CHIPS = ["all", "under75", "warning", "consent", "gaps", "new"];

const csv = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const digits = (s) => String(s || "").replace(/\D/g, "");
const GRADE_ORDER = ["PRE", "NURSERY", "LKG", "UKG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function apaarStatus(v) {
  const s = String(v || "").toUpperCase();
  return !s ? "pending" : s === "REFUSED" ? "refused" : s === "NOGEN" ? "not_generated" : "generated";
}

/* The main contact: who the family said to ring first. */
export function guardianOf(s) {
  const kin = { Father: [s.fatherName, "Father"], Mother: [s.motherName, "Mother"], Guardian: [s.guardianName, s.guardianRelation || "Guardian"] };
  const first = kin[s.primaryContact];
  const pick = first && first[0] ? first : [kin.Father, kin.Mother, kin.Guardian].find((k) => k[0]);
  return pick ? { name: pick[0], relation: pick[1] } : null;
}

/* One student as the list draws them.
     s        shaped by services/india.js shapeStudent
     problems problemsOf(s)
     w        standing from register.watchOf (or undefined)     e   reading from register.earlyOf (or undefined)
     year     { from, to } of the school year, for "new this year" */
export function rowOf(s, problems, w, e, year) {
  // the register's own reading, from the first marked day: the directory and the register never disagree about who is under 75%
  const att = w && w.total ? { percent: w.percent, status: w.status, total: w.total } : null;
  const g = guardianOf(s);
  const blocks = problems.filter((p) => p.level === "blocks");
  const phones = [s.fatherPhone, s.motherPhone, s.guardianPhone].map(digits).filter(Boolean);
  const row = {
    id: s.id, name: s.name, admissionNo: s.admissionNo || null, classId: s.classId, classLabel: s.classLabel, grade: s.grade, section: s.section,
    stream: s.stream || null, rollNo: s.rollNo || null, gender: s.gender || null, category: s.category || null, house: s.house || null,
    attendance: att, guardian: g, gaps: problems.map((p) => ({ field: p.field, level: p.level })), gapCount: problems.length, blocked: blocks.length > 0,
    consent: s.consentStatus || "pending", warning: e ? e.level : "none", cwsn: s.cwsn === 1, admittedOn: s.admittedOn || null, dob: s.dob || null,
    transport: s.transport || null, motherTongue: s.motherTongue || null, secondLanguage: s.secondLanguage || null, bloodGroup: s.bloodGroup || null,
    apaar: apaarStatus(s.apaar), pen: s.pen ? "on_file" : "missing", status: s.leftOn ? "left" : "enrolled", leftOn: s.leftOn || null,
    isNew: !!(s.admittedOn && year && s.admittedOn >= year.from && s.admittedOn <= year.to)
  };
  // what a search is matched against, never sent
  Object.defineProperty(row, "_find", { enumerable: false, value: {
    words: norm([s.name, s.fatherName, s.motherName, s.guardianName].filter(Boolean).join(" ")).split(/[^a-z0-9ऀ-ॿ]+/).filter(Boolean),
    adm: norm(s.admissionNo), roll: s.rollNo ? String(s.rollNo) : "", cls: norm((s.grade || "") + (s.section || "")), apaar: digits(s.apaar), phones
  } });
  return row;
}

/* One word of a search against one row. */
function hits(f, t) {
  if (!t) return true;
  const n = norm(t);
  if (f.words.some((w) => w.startsWith(n) || (n.length >= 3 && w.includes(n)))) return true;
  if (f.adm && f.adm.includes(n)) return true;
  if (f.roll && n === f.roll) return true;
  const code = classCode(t);
  if (code && f.cls === norm(code.grade + code.section)) return true;
  if (/^\d{4,}$/.test(n)) {
    if (f.apaar && f.apaar.endsWith(n)) return true;
    if (f.phones.some((p) => p.endsWith(n) || p.includes(n))) return true;
  }
  return false;
}

export function parse(q) {
  const get = (k) => (typeof q.get === "function" ? q.get(k) : q[k]);
  const num = (k, d) => { const n = parseInt(get(k), 10); return Number.isFinite(n) && n > 0 ? n : d; };
  const status = get("status");
  return {
    q: String(get("q") || "").trim().slice(0, 80),
    classes: csv(get("class")).map((x) => x.toUpperCase()), houses: csv(get("house")), categories: csv(get("category")), genders: csv(get("gender")),
    streams: csv(get("stream")), transports: csv(get("transport")), bloods: csv(get("blood")), languages: csv(get("language")),
    status: status === "left" || status === "all" ? status : "enrolled",
    under75: get("attendance") === "under-75", warning: csv(get("warning")), consentPending: get("consent") === "pending",
    gaps: get("filter") === "record-gaps", cwsn: get("cwsn") === "yes", isNew: get("new") === "1",
    apaar: csv(get("apaar")), pen: get("pen") === "on_file" || get("pen") === "missing" ? get("pen") : null,
    from: /^\d{4}-\d{2}-\d{2}$/.test(get("from") || "") ? get("from") : null, to: /^\d{4}-\d{2}-\d{2}$/.test(get("to") || "") ? get("to") : null,
    sort: get("sort") || "class", dir: get("dir") === "desc" ? "desc" : "asc", page: num("page", 1), size: Math.min(num("size", PAGE), MAX_PAGE)
  };
}

const CHIP_TEST = {
  all: () => true,
  under75: (r) => !!r.attendance && r.attendance.status === "below",
  warning: (r) => r.warning === "high" || r.warning === "medium",
  consent: (r) => r.consent !== "verified" && r.consent !== "withdrawn",
  gaps: (r) => r.blocked,
  new: (r) => r.isNew
};

/* Whether a row passes the filters. `skipChips` leaves out the quick chips, to count what each would show. */
export function passes(r, f, skipChips) {
  if (f.status !== "all" && r.status !== f.status) return false;
  if (f.classes.length && !f.classes.includes(String(r.classLabel || "").toUpperCase()) && !f.classes.includes(String(r.classId || "").toUpperCase())) return false;
  if (f.houses.length && !f.houses.includes(r.house || "")) return false;
  if (f.categories.length && !f.categories.includes(r.category || "")) return false;
  if (f.genders.length && !f.genders.includes(r.gender || "")) return false;
  if (f.streams.length && !f.streams.includes(r.stream || "")) return false;
  if (f.transports.length && !f.transports.includes(r.transport || "")) return false;
  if (f.bloods.length && !f.bloods.includes(r.bloodGroup || "")) return false;
  if (f.languages.length && !f.languages.includes(r.motherTongue || "")) return false;
  if (f.apaar.length && !f.apaar.includes(r.apaar)) return false;
  if (f.pen && r.pen !== f.pen) return false;
  if (f.from && (!r.admittedOn || r.admittedOn < f.from)) return false;
  if (f.to && (!r.admittedOn || r.admittedOn > f.to)) return false;
  if (f.cwsn && !r.cwsn) return false;
  if (f.q) { const toks = f.q.split(/\s+/).filter(Boolean); if (!toks.every((t) => hits(r._find, t))) return false; }
  if (!skipChips) {
    if (f.under75 && !CHIP_TEST.under75(r)) return false;
    if (f.warning.length && !f.warning.includes(r.warning)) return false;
    if (f.consentPending && !CHIP_TEST.consent(r)) return false;
    if (f.gaps && !CHIP_TEST.gaps(r)) return false;
    if (f.isNew && !CHIP_TEST.new(r)) return false;
  }
  return true;
}

const gradeRank = (g) => { const i = GRADE_ORDER.indexOf(String(g || "").toUpperCase()); return i < 0 ? 99 : i; };
const text = (a, b) => String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base", numeric: true });
const empty = (v) => v == null || v === "";
// an empty value sorts last whichever way the column runs
const by = (get, cmp) => (a, b, dir) => { const x = get(a), y = get(b); if (empty(x) && empty(y)) return 0; if (empty(x)) return 1; if (empty(y)) return -1; return cmp(x, y) * dir; };
const SORTS = {
  name: by((r) => r.name, text),
  class: (a, b, dir) => (gradeRank(a.grade) - gradeRank(b.grade) || text(a.section, b.section) || (a.rollNo || 1e9) - (b.rollNo || 1e9)) * dir,
  roll: by((r) => r.rollNo, (x, y) => x - y),
  gender: by((r) => r.gender, text), category: by((r) => r.category, text), house: by((r) => r.house, text),
  attendance: by((r) => (r.attendance ? r.attendance.percent : null), (x, y) => x - y),
  record: by((r) => r.gapCount, (x, y) => x - y),
  admitted: by((r) => r.admittedOn, text),
  guardian: by((r) => (r.guardian ? r.guardian.name : null), text)
};
export const SORT_KEYS = Object.keys(SORTS);

/* The list for a filter: one page, the total, what each chip would show, and the school's own numbers. */
export function cut(rows, f) {
  const scoped = rows.filter((r) => f.status === "all" || r.status === f.status);
  const others = rows.filter((r) => passes(r, f, true));
  const counts = {};
  for (const c of CHIPS) counts[c] = others.filter(CHIP_TEST[c]).length;

  const hits = rows.filter((r) => passes(r, f, false));
  const sort = SORTS[f.sort] || SORTS.class, dir = f.dir === "desc" ? -1 : 1;
  hits.sort((a, b) => sort(a, b, dir) || text(a.name, b.name));
  const total = hits.length, pages = Math.max(1, Math.ceil(total / f.size));
  const page = Math.min(f.page, pages);
  const school = rows.filter((r) => r.status === "enrolled");
  const sections = new Set(school.map((r) => r.classId).filter(Boolean));
  return {
    rows: hits.slice((page - 1) * f.size, page * f.size), total, page, size: f.size, pages, counts,
    kpis: {
      students: school.length, sections: sections.size,
      under75: school.filter(CHIP_TEST.under75).length,
      warning: school.filter(CHIP_TEST.warning).length, warningHigh: school.filter((r) => r.warning === "high").length,
      consent: school.filter(CHIP_TEST.consent).length, gaps: school.filter(CHIP_TEST.gaps).length, cwsn: school.filter((r) => r.cwsn).length, new: school.filter(CHIP_TEST.new).length
    },
    facets: facets(scoped)
  };
}

const tally = (list) => { const m = new Map(); for (const v of list) if (v) m.set(v, (m.get(v) || 0) + 1); return [...m].sort((a, b) => text(a[0], b[0])).map(([value, count]) => ({ value, count })); };
function facets(rows) {
  return { houses: tally(rows.map((r) => r.house)), categories: tally(rows.map((r) => r.category)), genders: tally(rows.map((r) => r.gender)),
    streams: tally(rows.map((r) => r.stream)), transports: tally(rows.map((r) => r.transport)), bloods: tally(rows.map((r) => r.bloodGroup)), languages: tally(rows.map((r) => r.motherTongue)) };
}

/* Every row a filter matches, in the list's order: what an export, a bulk change and "select all 1,801" act on. */
export function matching(rows, f) {
  const sort = SORTS[f.sort] || SORTS.class, dir = f.dir === "desc" ? -1 : 1;
  return rows.filter((r) => passes(r, f, false)).sort((a, b) => sort(a, b, dir) || text(a.name, b.name));
}
