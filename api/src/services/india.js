/* ==========================================================================
   India — what an Indian school's office writes down about a class and a
   child, and what is stopping a list from being sent to a board.

   Pure functions. Nothing here reads the database or the clock (the day is
   passed in), so every statement the console makes — "111 families refused an
   APAAR ID", "this class cannot be sent yet" — can be reproduced from its
   inputs and tested without a server.

   Three rules this file holds:

     AADHAAR is never kept. A number typed in is checked, reduced to its last
     four digits, and the rest is dropped; "REFUSED" is a valid answer,
     because a school may not make it a condition of admission (Supreme Court,
     2018).
     APAAR may be REFUSED or NOGEN. Both are what a board's list accepts when
     a family declined or no ID could be made, so neither is a gap.
     An unfilled field is NULL, never a guess. "Pending" is the absence of an
     answer, and the console says so rather than counting it as one.

   Nothing here is a permission (guard.js) and nothing here is a board's file
   layout: the exports are OEdu's own column order until a board's
   specification is in hand.
   ========================================================================== */

/* ------------------------------------------------------------------ Words */

// Classes in the order a school writes them. Anything else is kept as typed.
export const GRADES = ["Play", "Nursery", "LKG", "UKG", "KG", "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII"];
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII" };

export const CATEGORIES = ["General", "EWS/DG", "SC", "ST", "OBC"];
export const GENDERS = ["M", "F", "O"];
export const CONSENT_STATUSES = ["verified", "pending", "withdrawn"];
export const CONSENT_METHODS = ["signed_form", "digilocker", "other"];
export const CONTACTS = ["Father", "Mother", "Guardian"];

/* A class named the way people say it: "Class X", "10", "x" and "X" are one. */
export function gradeOf(v) {
  const s = String(v == null ? "" : v).trim().replace(/^class\s+/i, "").replace(/^grade\s+/i, "");
  if (/^\d{1,2}$/.test(s) && ROMAN[+s]) return ROMAN[+s];
  const hit = GRADES.find((g) => g.toLowerCase() === s.toLowerCase());
  return hit || s.slice(0, 20);
}
export const gradeRank = (g) => GRADES.indexOf(gradeOf(g));
export const isBoardClass = (g) => gradeRank(g) >= GRADES.indexOf("IX");   // IX to XII: the classes a board lists

export const sectionOf = (v) => String(v == null ? "" : v).trim().toUpperCase().slice(0, 3);
export const classLabel = (grade, section) => `${grade}-${section}`;

/* "X-C" or "Class X C" → { grade: "X", section: "C" }; null if it is not one. */
export function parseClass(text) {
  const m = /^\s*(?:class\s+)?([A-Za-z0-9]+)\s*[-\s]\s*([A-Za-z0-9]{1,3})\s*$/i.exec(String(text || ""));
  return m ? { grade: gradeOf(m[1]), section: sectionOf(m[2]) } : null;
}

/* ------------------------------------------------------------------ Dates */

export function isDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/* A date as an Indian office writes it, DD/MM/YYYY, read back to a day. */
export function dayOf(v) {
  const s = String(v == null ? "" : v).trim();
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  const out = dmy ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}` : s;
  return isDate(out) ? out : null;
}

/* -------------------------------------------------------------- Identifiers */

// Verhoeff's checksum, the one an Aadhaar number carries in its last digit.
const VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const VINV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
export function verhoeffOk(digits) {
  let c = 0;
  [...String(digits)].reverse().forEach((d, i) => { c = VD[c][VP[i % 8][+d]]; });
  return c === 0;
}
export function verhoeffDigit(digits) {
  let c = 0;
  [...String(digits)].reverse().forEach((d, i) => { c = VD[c][VP[(i + 1) % 8][+d]]; });
  return VINV[c];
}

const digitsOnly = (v) => String(v).replace(/[\s-]/g, "");

/* Each reader returns the value to store, null for "nothing yet", or calls
   fail(message) and returns. */

export function apaarOf(v, fail) {
  const s = digitsOnly(v == null ? "" : v).toUpperCase();
  if (!s || s === "PENDING") return null;
  if (s === "REFUSED" || s === "NOGEN") return s;
  if (/^\d{12}$/.test(s)) return s;
  fail("An APAAR ID is 12 digits, or REFUSED, or NOGEN.");
}

export function penOf(v, fail) {
  const s = digitsOnly(v == null ? "" : v);
  if (!s) return null;
  if (/^\d{11}$/.test(s)) return s;
  fail("A PEN is 11 digits.");
}

export function aadhaarOf(v, fail) {
  const raw = String(v == null ? "" : v).trim();
  if (!raw || /^(not provided|pending|n\/?a|none)$/i.test(raw)) return null;
  if (/^refused$/i.test(raw)) return "REFUSED";
  if (/^x{4}-?x{4}-?\d{4}$/i.test(raw)) { const d = raw.replace(/\D/g, ""); return `XXXX-XXXX-${d}`; }
  const s = digitsOnly(raw);
  if (!/^[2-9]\d{11}$/.test(s)) return fail("An Aadhaar number is 12 digits and does not start with 0 or 1. Leave it blank, or write REFUSED.");
  if (!verhoeffOk(s)) return fail("That Aadhaar number does not pass its own check digit. Check it, or leave it blank.");
  return `XXXX-XXXX-${s.slice(8)}`;   // the rest is dropped here, before anything is stored
}

export function pinOf(v, fail) {
  const s = digitsOnly(v == null ? "" : v);
  if (!s) return null;
  if (/^[1-9]\d{5}$/.test(s)) return s;
  fail("A PIN code is 6 digits.");
}

/* An Indian mobile: ten digits starting 6 to 9, with or without +91 / 0. Kept
   as "+91 98765 43210"-style text without the spaces the family typed. */
export function phoneOf(v, fail) {
  const raw = String(v == null ? "" : v).trim();
  if (!raw) return null;
  let s = raw.replace(/[\s().-]/g, "");
  s = s.replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(s)) return "+91 " + s;
  fail("An Indian mobile number is 10 digits starting 6 to 9, with or without +91.");
}

/* "Verified (DigiLocker)", "Verified (signed form)", "Pending", "Withdrawn -
   analytics only": the phrases a school's own sheet uses, as the three
   facts they carry. */
export function consentOf(text) {
  const t = String(text == null ? "" : text).trim();
  if (!t) return null;
  const low = t.toLowerCase();
  const status = low.startsWith("verified") ? "verified" : low.startsWith("withdrawn") ? "withdrawn" : "pending";
  const method = /digilocker/.test(low) ? "digilocker" : /signed|form|paper/.test(low) ? "signed_form" : status === "verified" ? "other" : null;
  const note = status === "withdrawn" ? (t.replace(/^withdrawn\s*[-–:]?\s*/i, "") || null) : null;
  return { consentStatus: status, consentMethod: method, consentNote: note };
}

/* ------------------------------------------------------------------ Fields
   [key, label, type, options]. One table drives cleaning, the import's column
   names and the console's form, so they cannot disagree about a field. A key
   absent from the input is left alone; a blank value clears it. */

const TEXT = 120;
export const FIELDS = [
  ["admissionNo", "Admission number", "text"], ["admittedOn", "Admitted on", "date"], ["rollNo", "Roll number", "int"],
  ["gender", "Gender", "enum", GENDERS], ["house", "House", "text"], ["category", "Category", "category"],
  ["secondLanguage", "Second language", "text"], ["bloodGroup", "Blood group", "blood"],
  ["apaar", "APAAR ID", "apaar"], ["pen", "PEN", "pen"], ["aadhaar", "Aadhaar", "aadhaar"],
  ["consentStatus", "Parental consent", "enum", CONSENT_STATUSES], ["consentMethod", "Consent given by", "enum", CONSENT_METHODS],
  ["consentOn", "Consent date", "date"], ["consentNote", "Consent note", "text"],
  ["transport", "Transport", "text"], ["pin", "PIN code", "pin"], ["district", "District", "text"], ["state", "State", "text"],
  ["fatherName", "Father's name", "text"], ["fatherPhone", "Father's mobile", "phone"],
  ["motherName", "Mother's name", "text"], ["motherPhone", "Mother's mobile", "phone"],
  ["primaryContact", "Primary contact", "enum", CONTACTS], ["whatsapp", "WhatsApp", "bool"],
  ["language", "Family's language", "text"], ["guardianEmail", "Family email", "email"],
  ["guardianName", "Guardian's name", "text"], ["guardianPhone", "Guardian's mobile", "phone"], ["guardianRelation", "Guardian's relation", "text"],
  ["cwsn", "Child with special needs", "bool"], ["disability", "Kind of disability", "text"], ["udid", "Disability ID (UDID)", "text"],
  ["migrant", "Migrant family", "bool"], ["motherTongue", "Mother tongue", "text"],
  ["boardRollNo", "Board roll number", "text"], ["previousSchool", "Previous school", "text"]
];

const blank = (v) => v === undefined || v === null || /^\s*(n\/?a|-+)?\s*$/i.test(String(v));

/* A student's fields checked against FIELDS. Returns only what the input
   named; what is wrong is reported through fail(message, key). */
export function cleanStudent(src, fail) {
  const out = {};
  src = src && typeof src === "object" ? src : {};
  for (const [k, label, type, options] of FIELDS) {
    if (!(k in src)) continue;
    const v = src[k];
    const bad = (m) => fail(m ? `${label}: ${m}` : label, k);
    if (type === "apaar") { out[k] = apaarOf(v, bad); continue; }
    if (type === "pen") { out[k] = penOf(v, bad); continue; }
    if (type === "aadhaar") { out[k] = aadhaarOf(v, bad); continue; }
    if (type === "pin") { out[k] = pinOf(v, bad); continue; }
    if (type === "phone") { out[k] = phoneOf(v, bad); continue; }
    if (blank(v)) { out[k] = null; continue; }
    const s = String(v).trim();
    if (type === "int") { const n = Number(s); if (!Number.isInteger(n) || n < 1 || n > 999) bad("a whole number from 1 to 999."); out[k] = n; }
    else if (type === "date") { const d = dayOf(s); if (!d) bad("a date, written DD/MM/YYYY or YYYY-MM-DD."); out[k] = d; }
    else if (type === "bool") { out[k] = /^(1|y|yes|true)$/i.test(s) ? 1 : /^(0|n|no|false)$/i.test(s) ? 0 : (bad("yes or no."), null); }
    else if (type === "blood") { const b = s.toUpperCase(); if (!/^(A|B|AB|O)[+-]$/.test(b)) bad("A+, A-, B+, B-, AB+, AB-, O+ or O-."); out[k] = b; }
    else if (type === "category") {
      const c = /^general/i.test(s) ? "General" : /^(ews|dg)/i.test(s) ? "EWS/DG" : /^(sc|scheduled caste)$/i.test(s) ? "SC"
        : /^(st|scheduled tribe)$/i.test(s) ? "ST" : /^obc/i.test(s) ? "OBC" : null;
      if (!c) bad(`one of ${CATEGORIES.join(", ")}.`);
      out[k] = c;
    } else if (type === "enum") {
      const lc = s.toLowerCase();
      const hit = options.find((o) => o.toLowerCase() === lc) || (k === "gender" ? { male: "M", female: "F", other: "O" }[lc] : null);
      if (!hit) bad(`one of ${options.join(", ")}.`);
      out[k] = hit;
    } else if (type === "email") {
      if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s)) bad("an email address.");
      out[k] = s.toLowerCase();
    } else {
      if (s.length > TEXT) bad(`longer than ${TEXT} characters.`);
      out[k] = s;
    }
  }
  return out;
}

/* ---------------------------------------------------------------- Problems
   What stands between this child and a list that can be sent. Two levels:
   "blocks" is a field a board's or the state's list will refuse without;
   "fix" is something the school is expected to hold and does not yet. */

export function problemsOf(s) {
  const out = [];
  const add = (level, field, message) => out.push({ level, field, message });
  if (!s.pen) add("blocks", "pen", "No PEN — the state's student list needs it.");
  if (!s.dob) add("blocks", "dob", "No date of birth.");
  if (!s.gender) add("blocks", "gender", "No gender.");
  if (!s.category) add("blocks", "category", "No category.");
  if (isBoardClass(s.grade) && !s.apaar) add("blocks", "apaar", "No APAAR ID — a board's candidate list for this class needs an ID, REFUSED or NOGEN.");
  if (!s.fatherName && !s.motherName) add("fix", "fatherName", "Neither parent's name is on file.");
  if (s.consentStatus === "pending" || !s.consentStatus) add("fix", "consentStatus", "Parental consent is not yet recorded.");
  if (s.cwsn === 1 && !s.disability) add("fix", "disability", "Marked as a child with special needs, but not which kind.");
  if (s.primaryContact === "Guardian" && !s.guardianName) add("fix", "guardianName", "The guardian is the main contact, but no guardian is named.");
  return out;
}

/* ----------------------------------------------------------------- Summary */

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

/* Counts for the compliance page, from students already shaped with their
   class. `board` is the students in IX to XII, where the APAAR rule bites. */
export function summaryOf(students) {
  const total = students.length;
  const apaar = { have: 0, refused: 0, nogen: 0, pending: 0 };
  const consent = { verified: 0, pending: 0, withdrawn: 0 };
  const category = {};
  const pen = { have: 0, missing: 0 };
  const board = { students: 0, answered: 0 };
  const classes = new Map();
  let blocked = 0, fixes = 0;
  for (const s of students) {
    const a = s.apaar === "REFUSED" ? "refused" : s.apaar === "NOGEN" ? "nogen" : s.apaar ? "have" : "pending";
    apaar[a]++;
    consent[s.consentStatus || "pending"]++;
    if (s.category) category[s.category] = (category[s.category] || 0) + 1;
    s.pen ? pen.have++ : pen.missing++;
    if (isBoardClass(s.grade)) { board.students++; if (s.apaar) board.answered++; }
    const p = problemsOf(s);
    if (p.some((x) => x.level === "blocks")) blocked++;
    if (p.some((x) => x.level === "fix")) fixes++;
    const key = s.classId || "none";
    if (!classes.has(key)) classes.set(key, { classId: s.classId || null, label: s.classLabel || "No class", students: 0, apaarAnswered: 0, consentVerified: 0, blocked: 0 });
    const c = classes.get(key);
    c.students++;
    if (s.apaar) c.apaarAnswered++;
    if (s.consentStatus === "verified") c.consentVerified++;
    if (p.some((x) => x.level === "blocks")) c.blocked++;
  }
  return {
    students: total, apaar, pen, consent, category, blocked, fixes,
    apaarAnswered: pct(apaar.have + apaar.refused + apaar.nogen, total),
    consentVerified: pct(consent.verified, total),
    board: { students: board.students, answered: board.answered, percent: pct(board.answered, board.students) },
    classes: [...classes.values()]
  };
}

/* ----------------------------------------------------------------- Exports
   OEdu's own column order, one row per child. Aadhaar is never in them. */

const yn = (v) => (v === 1 ? "Yes" : v === 0 ? "No" : "");
export const EXPORTS = {
  register: { title: "Student register", file: "student-register.csv", columns: [
    ["Admission no", (s) => s.admissionNo], ["Name", (s) => s.name], ["Class", (s) => s.classLabel], ["Roll", (s) => s.rollNo],
    ["Gender", (s) => s.gender], ["Date of birth", (s) => s.dob], ["House", (s) => s.house], ["Category", (s) => s.category],
    ["Father", (s) => s.fatherName], ["Father mobile", (s) => s.fatherPhone], ["Mother", (s) => s.motherName], ["Mother mobile", (s) => s.motherPhone],
    ["Primary contact", (s) => s.primaryContact], ["WhatsApp", (s) => yn(s.whatsapp)], ["Address", (s) => s.address], ["PIN", (s) => s.pin],
    ["Transport", (s) => s.transport]] },
  apaar: { title: "APAAR status", file: "apaar-status.csv", columns: [
    ["Admission no", (s) => s.admissionNo], ["Name", (s) => s.name], ["Class", (s) => s.classLabel], ["Date of birth", (s) => s.dob],
    ["Gender", (s) => s.gender], ["APAAR ID", (s) => s.apaar || ""],
    ["Status", (s) => (s.apaar === "REFUSED" ? "Refused by parent" : s.apaar === "NOGEN" ? "Not generated" : s.apaar ? "Have ID" : "Pending")]] },
  udise: { title: "State student list", file: "state-student-list.csv", columns: [
    ["PEN", (s) => s.pen], ["Admission no", (s) => s.admissionNo], ["Name", (s) => s.name], ["Date of birth", (s) => s.dob], ["Gender", (s) => s.gender],
    ["Class", (s) => s.grade], ["Section", (s) => s.section], ["Category", (s) => s.category], ["Father", (s) => s.fatherName], ["Mother", (s) => s.motherName],
    ["Address", (s) => s.address], ["PIN", (s) => s.pin], ["District", (s) => s.district], ["State", (s) => s.state]] },
  consent: { title: "Parental consent register", file: "consent-register.csv", columns: [
    ["Admission no", (s) => s.admissionNo], ["Name", (s) => s.name], ["Class", (s) => s.classLabel], ["Consent", (s) => s.consentStatus],
    ["Given by", (s) => s.consentMethod || ""], ["Date", (s) => s.consentOn || ""], ["Note", (s) => s.consentNote || ""], ["Family email", (s) => s.guardianEmail]] }
};

/* One export as data the console can turn into a file. */
export function exportRows(kind, students) {
  const e = EXPORTS[kind];
  if (!e) return null;
  return { title: e.title, file: e.file, columns: e.columns.map((c) => c[0]),
           rows: students.map((s) => e.columns.map((c) => { const v = c[1](s); return v == null ? "" : v; })) };
}

/* ----------------------------------------------------------- Rows and years */

const snake = (k) => k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

/* An Indian school year runs April to March: 2026-2027 from 1 April 2026. The
   day is the school's own, India Standard Time, whatever the server's clock. */
export const todayIST = (ms) => new Date((ms == null ? Date.now() : ms) + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
export function yearOf(ymd) {
  const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7);
  const start = m >= 4 ? y : y - 1;
  return `${start}-${start + 1}`;
}
export const isYear = (s) => { const m = /^(\d{4})-(\d{4})$/.exec(String(s || "")); return !!m && +m[2] === +m[1] + 1; };

/* The columns of learn_student_india for a merged student (camelCase in). */
export function toRow(s) {
  const row = { class_id: s.classId ?? null };
  for (const [k] of FIELDS) row[snake(k)] = s[k] ?? null;
  if (!row.consent_status) row.consent_status = "pending";
  return row;
}

/* A database row as the console and the exports read a student. */
export function shapeStudent(r) {
  const s = { id: r.account_id, name: r.name || r.email || "", email: r.email || "", classId: r.class_id || null,
    grade: r.grade || null, section: r.section || null, programme: r.programme || null, stream: r.stream || null,
    classLabel: r.grade ? classLabel(r.grade, r.section) : null, dob: r.date_of_birth || null, address: r.mailing_address || null };
  for (const [k] of FIELDS) s[k] = r[snake(k)] ?? null;
  if (!s.consentStatus) s.consentStatus = "pending";
  s.leftOn = r.left_on || null; s.leftReason = r.left_reason || null;
  return s;
}

/* ------------------------------------------------------------------- Rolls
   A roll number is a child's place in the section's list, 1 to n. Indian
   schools number alphabetically, and again every year. `name` and the order of
   an admission number are the two orders schools ask for; the third keeps
   whoever already has a number in their order and closes the gaps. */
const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "en", { sensitivity: "base" }) || String(a.id).localeCompare(String(b.id));
export function rollOrder(students, order) {
  const list = students.slice();
  if (order === "admission") {
    list.sort((a, b) => String(a.admissionNo || "\uffff").localeCompare(String(b.admissionNo || "\uffff"), "en", { numeric: true }) || byName(a, b));
  } else if (order === "keep") {
    list.sort((a, b) => (a.rollNo || 1e9) - (b.rollNo || 1e9) || byName(a, b));
  } else list.sort(byName);
  return list.map((s, i) => ({ id: s.id, rollNo: i + 1 }));
}

/* Classes in the order a school lists them: by grade, then section. */
export const byClass = (a, b) => gradeRank(a.grade) - gradeRank(b.grade) || String(a.grade).localeCompare(String(b.grade)) || String(a.section).localeCompare(String(b.section));

/* ----------------------------------------------------- From an application
   An application already says a good deal about a child: the parents, the PIN
   code, the blood group, the category, whether the family wants WhatsApp. When
   the child is enrolled that belongs on the office's roster row — otherwise the
   office types it all a second time, and the record stays blank until somebody does.

   `have` is the row the office already has (or null). What the office wrote is
   never overwritten: an application only fills what is empty. The one thing it
   does set is the class, because choosing a class is the point of admitting. */
export function rosterFromApplication(have, { form, admissionNo, startsOn, previousSchool, classId }) {
  const f = form || {}, st = f.student || {}, ct = f.contact || {}, ad = f.admission || {}, sup = f.support || {};
  const gs = (f.guardians || []).filter((g) => g && (g.name || g.phone || g.email));
  const kin = (re) => gs.find((g) => re.test(String(g.relationship || "").toLowerCase()));
  const father = kin(/father|dad/), mother = kin(/mother|mom/);
  const primary = gs.find((g) => g.primary) || gs[0] || null;
  const other = gs.find((g) => g !== father && g !== mother) || null;
  const none = () => null;
  const row = { ...(have || {}) };
  const fill = (k, v) => { if ((row[k] == null || row[k] === "") && v != null && v !== "") row[k] = v; };
  const gender = ({ Female: "F", Male: "M", "Non-binary": "O" })[st.gender] || null;
  const pin = ct.pin ? pinOf(ct.pin, none) : null;

  row.class_id = classId || row.class_id || null;
  fill("admission_no", admissionNo);
  fill("admitted_on", startsOn);
  fill("gender", gender);
  fill("category", st.category);
  fill("second_language", st.secondLanguage || ad.secondLanguage);
  fill("blood_group", st.bloodGroup);
  fill("mother_tongue", st.motherTongue);
  fill("transport", ad.transport);
  fill("pin", pin);
  fill("district", ct.district);
  fill("state", ct.state);
  fill("father_name", father && father.name);
  fill("father_phone", father && phoneOf(father.phone, none));
  fill("mother_name", mother && mother.name);
  fill("mother_phone", mother && phoneOf(mother.phone, none));
  const g2 = !father && !mother ? primary : other;
  fill("guardian_name", g2 && g2.name);
  fill("guardian_phone", g2 && phoneOf(g2.phone, none));
  fill("guardian_relation", g2 && g2.relationship);
  fill("primary_contact", primary ? (father && primary === father ? "Father" : mother && primary === mother ? "Mother" : "Guardian") : null);
  fill("guardian_email", primary && primary.email);
  fill("language", ct.language);
  fill("previous_school", previousSchool);
  if (row.whatsapp == null && (ct.whatsapp === "yes" || ct.whatsapp === "no")) row.whatsapp = ct.whatsapp === "yes" ? 1 : 0;
  if (row.cwsn == null && (sup.cwsn === true || sup.disability)) row.cwsn = 1;
  fill("disability", sup.disability);
  if (!row.consent_status) row.consent_status = "pending";
  return row;
}
