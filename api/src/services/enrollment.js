/* ==========================================================================
   Enrollment — what an application needs, what is stopping it, and what it
   becomes.

   Pure functions. Nothing here reads the database or the clock (the day is
   passed in), so every statement the console makes — "62% complete", "waiting
   on two documents", "Grade 6 is full" — can be reproduced from its inputs and
   tested without a server.

   The line this file draws, and holds, is the one the school draws:

     an APPLICATION is a request that moves through review to a decision;
     an ENROLLMENT is a student's year at the school, with dates.

   Admitted is not enrolled. A decision can be made today for a student who
   starts next term, and an enrollment can be suspended without the admission
   ever being undone. So the statuses of the two are different words, and
   nothing below lets one stand in for the other.

   Nothing here is a permission. Who may press a button is guard.js; this file
   says whether pressing it would be true.
   ========================================================================== */

import { ApiError } from "../lib/http.js";

/* ------------------------------------------------------------------ Words */

export const APP_STATUSES = ["draft", "submitted", "incomplete", "under_review", "changes_requested",
  "awaiting_decision", "waitlisted", "admitted", "rejected", "withdrawn"];

// An application is still open until it ends in a refusal or a withdrawal;
// "admitted" stays open until an enrollment has been made from it.
export const OPEN_STATUSES = ["draft", "submitted", "incomplete", "under_review", "changes_requested",
  "awaiting_decision", "waitlisted", "admitted"];

export const TYPES = ["new", "returning", "transfer"];
export const ENROLLMENT_STATES = ["enrolled", "suspended", "transferred", "withdrawn", "completed"];
export const DOC_STATUSES = ["missing", "received", "verified", "returned", "waived"];
export const ACCEPTANCE = ["not_required", "pending", "accepted", "declined"];

export const REJECT_REASONS = ["ineligible", "incomplete_file", "no_seat", "failed_assessment",
  "duplicate", "withdrawn_by_family", "other"];
export const EXIT_REASONS = ["relocated", "transferred_out", "withdrawn_by_family", "disciplinary",
  "completed_programme", "other"];

/* ------------------------------------------------------------------ Dates
   Calendar days are 'YYYY-MM-DD' text and are compared as text. They are
   never turned into a local Date, so no time zone can move one by a day. */

export function isDate(s) {
  if (typeof s !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export const todayOf = (ms) => new Date(ms == null ? Date.now() : ms).toISOString().slice(0, 10);

export function addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* Whole years between a date of birth and a day. */
export function ageOn(dob, ymd) {
  if (!isDate(dob) || !isDate(ymd)) return null;
  let age = +ymd.slice(0, 4) - +dob.slice(0, 4);
  if (ymd.slice(5) < dob.slice(5)) age--;
  return age;
}

/* A school year runs from June to May unless the school says otherwise: an
   Indian school's runs from April (its profile's yearStartMonth). This only
   names today's; a school that wants other years sets them in settings. */
export function schoolYearOf(ymd, startMonth = 6) {
  const y = +ymd.slice(0, 4), m = +ymd.slice(5, 7);
  const start = m >= startMonth ? y : y - 1;
  return `${start}-${start + 1}`;
}

export function isYear(s) {
  const m = /^(\d{4})-(\d{4})$/.exec(String(s || ""));
  return !!m && +m[2] === +m[1] + 1;
}

// "2026-2027" as a person writes it: 2026–27.
export const yearLabel = (y) => (isYear(y) ? y.slice(0, 4) + "–" + y.slice(7) : String(y || ""));
export const nextYear = (y) => `${+y.slice(0, 4) + 1}-${+y.slice(5) + 1}`;
export const previousYear = (y) => `${+y.slice(0, 4) - 1}-${+y.slice(5) - 1}`;

/* ---------------------------------------------------------------- Settings
   What a school asks for. Everything here is a default the school can change
   without a developer: the grades it admits to, the documents each needs, the
   review checklist, the policy a family consents to. Configuration can add
   requirements and remove them; it cannot switch off the rules in this file —
   a duplicate is still a duplicate and a verified document is still verified
   by a person. */

export const DEFAULT_GRADES = ["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
  "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

/* No identity number is required by default. Where a school or a law asks for
   one it is added here deliberately, marked sensitive, and read by
   administrators only. */
export const DEFAULT_DOCUMENTS = [
  { key: "birth_proof", label: "Proof of age (birth certificate)", required: true, types: ["new", "transfer"] },
  { key: "photo", label: "Passport-size photograph", required: true, types: ["new", "transfer"] },
  { key: "address_proof", label: "Proof of residence", required: true, types: ["new", "transfer"] },
  { key: "previous_report", label: "Previous school report card", required: true, types: ["transfer"] },
  { key: "transfer_cert", label: "Transfer certificate", required: true, types: ["transfer"] },
  { key: "health_record", label: "Immunization or health record", required: false, types: ["new", "transfer"] }
];

export const DEFAULT_REVIEW = [
  { key: "identity", label: "Identity and age checked against the documents", required: true },
  { key: "eligibility", label: "Eligible for the grade applied to", required: true },
  { key: "previous", label: "Previous school record reviewed", required: false },
  { key: "assessment", label: "Entrance assessment or interview", required: false }
];

/* An Indian school admits to Nursery, LKG, UKG and Class I to XII, by the age a child is on 1 April, and asks
   for the papers a school here asks for. No identity number is asked for by default, Aadhaar least of all: a school that
   needs one adds it, marked sensitive (the same rule as everywhere), and only its last four digits are ever kept. */
export const IN_GRADES = ["Nursery", "LKG", "UKG", "Class I", "Class II", "Class III", "Class IV", "Class V", "Class VI", "Class VII", "Class VIII",
  "Class IX", "Class X", "Class XI", "Class XII"];
export const IN_DOCUMENTS = [
  { key: "birth_proof", label: "Proof of date of birth (birth certificate)", required: true, types: ["new", "transfer"] },
  { key: "photo", label: "Passport-size photograph", required: true, types: ["new", "transfer"] },
  { key: "address_proof", label: "Proof of address", required: true, types: ["new", "transfer"] },
  { key: "previous_report", label: "Report card of the last class", required: true, types: ["transfer"] },
  { key: "transfer_cert", label: "Transfer certificate (TC) from the last school", required: true, types: ["transfer"], hint: "Not needed for Nursery to Class I." },
  { key: "category_cert", label: "Caste or category certificate (SC, ST, OBC)", required: false, types: ["new", "transfer"], hint: "Only if the family claims a category." },
  { key: "ews_cert", label: "EWS / disadvantaged-group certificate", required: false, types: ["new"], hint: "Needed for the free-quota seats." },
  { key: "health_record", label: "Immunisation record", required: false, types: ["new", "transfer"] }
];

export function defaultSettings(today, { region, yearStartMonth } = {}) {
  const india = !!region && region !== "US";
  const year = schoolYearOf(today || todayOf(), india ? yearStartMonth || 4 : 6);
  return {
    currentYear: year,
    years: [year, nextYear(year)],
    // The youngest a child may be on 1 April for each class: three for Nursery, six for Class I, and a year more for each after.
    grades: india ? IN_GRADES.map((name, i) => ({ name, seats: null, minAge: i < 3 ? 3 + i : i + 3 })) : DEFAULT_GRADES.map((name) => ({ name, seats: null, minAge: null })),
    // Age is counted on this day of the school year's first calendar year.
    ageCutoff: "04-01",
    documents: (india ? IN_DOCUMENTS : DEFAULT_DOCUMENTS).map((d) => ({ ...d })),
    review: DEFAULT_REVIEW.map((r) => ({ ...r })),
    consent: {
      version: "1",
      statement: "I confirm that what I have written is true, and I agree to the school's admission and " +
                 "data-protection policy."
    },
    requireAcceptance: false,
    offerDays: 14,
    dueDays: 7,
    stalledDays: 5,
    admissionPrefix: "ADM-",
    admissionPad: 4
  };
}

const LIM = { grades: 40, documents: 40, review: 20, years: 12, label: 120, key: 40, statement: 800 };

function text(v, field, max, { min = 0 } = {}) {
  if (v == null) v = "";
  if (typeof v !== "string") throw ApiError.badRequest(`${field} must be text.`, field);
  const s = v.trim();
  if (s.length < min) throw ApiError.badRequest(`${field} is required.`, field);
  if (s.length > max) throw ApiError.badRequest(`${field} is longer than ${max} characters.`, field);
  return s;
}

function keyOf(v, field, seen) {
  const k = text(v, field, LIM.key, { min: 1 }).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]*$/.test(k)) {
    throw ApiError.badRequest(`${field} may use lowercase letters, numbers and underscores.`, field);
  }
  if (seen.has(k)) throw ApiError.badRequest(`${field} "${k}" is used twice.`, field);
  seen.add(k);
  return k;
}

/* Settings as stored are whatever a past version of the console wrote, so
   every read goes through here and gets a complete, valid object back. A bad
   value on a write is refused; a bad value on a read falls back to the
   default rather than taking the queue down with it. */
export function normaliseSettings(raw, today, { strict = false, region, yearStartMonth } = {}) {
  const base = defaultSettings(today, { region, yearStartMonth });
  const s = raw && typeof raw === "object" ? raw : {};
  const bad = (msg, field) => { if (strict) throw ApiError.badRequest(msg, field); };
  const out = { ...base };

  if (Array.isArray(s.years)) {
    const years = s.years.filter(isYear);
    if (years.length !== s.years.length) bad("A school year is written 2026-2027.", "years");
    if (years.length) out.years = [...new Set(years)].sort().slice(0, LIM.years);
  }
  out.currentYear = isYear(s.currentYear) ? s.currentYear : (out.years.includes(base.currentYear) ? base.currentYear : out.years[0]);
  if (!out.years.includes(out.currentYear)) out.years = [...out.years, out.currentYear].sort();

  if (Array.isArray(s.grades)) {
    if (s.grades.length > LIM.grades) bad(`At most ${LIM.grades} grades.`, "grades");
    const seen = new Set();
    const grades = [];
    for (const g of s.grades.slice(0, LIM.grades)) {
      const name = typeof g === "string" ? g : g && g.name;
      const n = typeof name === "string" ? name.trim().slice(0, 40) : "";
      if (!n || seen.has(n.toLowerCase())) { bad("Each grade needs its own name.", "grades"); continue; }
      seen.add(n.toLowerCase());
      const seats = g && g.seats != null && g.seats !== "" ? Math.floor(Number(g.seats)) : null;
      const minAge = g && g.minAge != null && g.minAge !== "" ? Math.floor(Number(g.minAge)) : null;
      if (seats != null && !(seats >= 0 && seats <= 5000)) bad(`Seats for ${n} must be 0 to 5000.`, "grades");
      if (minAge != null && !(minAge >= 0 && minAge <= 25)) bad(`Minimum age for ${n} must be 0 to 25.`, "grades");
      grades.push({ name: n, seats: seats != null && seats >= 0 ? seats : null, minAge: minAge != null && minAge >= 0 ? minAge : null });
    }
    if (grades.length) out.grades = grades;
  }

  if (typeof s.ageCutoff === "string" && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s.ageCutoff)) out.ageCutoff = s.ageCutoff;
  else if (s.ageCutoff != null) bad("The age cut-off is a month and day, MM-DD.", "ageCutoff");

  if (Array.isArray(s.documents)) {
    if (s.documents.length > LIM.documents) bad(`At most ${LIM.documents} documents.`, "documents");
    const seen = new Set();
    const docs = [];
    for (const d of s.documents.slice(0, LIM.documents)) {
      if (!d || typeof d !== "object") continue;
      try {
        const grades = Array.isArray(d.grades) ? d.grades.map(String).slice(0, LIM.grades) : [];
        const types = Array.isArray(d.types) ? d.types.filter((t) => TYPES.includes(t)) : [];
        docs.push({
          key: keyOf(d.key, "documents.key", seen),
          label: text(d.label, "documents.label", LIM.label, { min: 1 }),
          required: d.required !== false,
          sensitive: d.sensitive === true,
          ...(grades.length ? { grades } : {}),
          ...(types.length ? { types } : {}),
          ...(d.hint ? { hint: text(d.hint, "documents.hint", 240) } : {})
        });
      } catch (e) { if (strict) throw e; }
    }
    out.documents = docs;
  }

  if (Array.isArray(s.review)) {
    const seen = new Set();
    const review = [];
    for (const r of s.review.slice(0, LIM.review)) {
      if (!r || typeof r !== "object") continue;
      try {
        review.push({ key: keyOf(r.key, "review.key", seen), label: text(r.label, "review.label", LIM.label, { min: 1 }),
                      required: r.required === true });
      } catch (e) { if (strict) throw e; }
    }
    out.review = review;
  }

  if (s.consent && typeof s.consent === "object") {
    const version = text(s.consent.version, "consent.version", 24);
    const statement = text(s.consent.statement, "consent.statement", LIM.statement);
    if (version && statement) out.consent = { version, statement };
    else bad("Consent needs a version and a statement.", "consent");
  }

  const whole = (v, f, lo, hi, dflt) => {
    if (v == null || v === "") return dflt;
    const n = Math.floor(Number(v));
    if (!(n >= lo && n <= hi)) { bad(`${f} must be ${lo} to ${hi}.`, f); return dflt; }
    return n;
  };
  out.requireAcceptance = s.requireAcceptance === true;
  out.offerDays = whole(s.offerDays, "offerDays", 1, 120, base.offerDays);
  out.dueDays = whole(s.dueDays, "dueDays", 1, 120, base.dueDays);
  out.stalledDays = whole(s.stalledDays, "stalledDays", 1, 120, base.stalledDays);
  out.admissionPad = whole(s.admissionPad, "admissionPad", 0, 8, base.admissionPad);
  if (typeof s.admissionPrefix === "string") out.admissionPrefix = s.admissionPrefix.trim().slice(0, 12);
  return out;
}

/* The documents an application must carry, given where it is applying and
   what kind of application it is. A returning student is not asked for a
   birth certificate again unless the school says so. */
export function documentsFor(settings, grade, type) {
  return settings.documents.filter((d) =>
    (!d.grades || !d.grades.length || d.grades.includes(grade)) &&
    (!d.types || !d.types.length || d.types.includes(type)));
}

export function gradeRow(settings, grade) {
  return settings.grades.find((g) => g.name === grade) || null;
}

export function nextGrade(settings, grade) {
  const i = settings.grades.findIndex((g) => g.name === grade);
  return i >= 0 && i < settings.grades.length - 1 ? settings.grades[i + 1].name : null;
}

export function admissionNumber(settings, n) {
  return settings.admissionPrefix + String(n).padStart(settings.admissionPad, "0");
}

export const applicationNumber = (seq) => "ENR-" + String(seq).padStart(4, "0");

/* ------------------------------------------------------------------ Names */

const fold = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-10);

/* The people a guardian list names, as the keys that tie one family together. */
export function familyKeys(guardians) {
  const emails = new Set(), phones = new Set();
  for (const g of guardians || []) {
    if (g && g.email) emails.add(String(g.email).trim().toLowerCase());
    const p = phoneKey(g && g.phone);
    if (p.length >= 7) phones.add(p);
  }
  return { emails: [...emails], phones: [...phones] };
}

const nameParts = (first, last) => ({ first: fold(first), last: fold(last) });
const sameSet = (a, b) => a.some((x) => b.includes(x));

/* Who else this might be.

   `subject` is the application being looked at. `people` are the students the
   school already knows (an account, a date of birth if the contact card has
   one). `others` are the school's other applications. A candidate comes back
   with how sure the match is:

     exact     the same name and the same date of birth
     possible  the same date of birth and a name a typo away, or the same
               first name in the same family — somebody has to say which
     weak      the same name and a different date of birth: shown, not blocking

   Brothers and sisters are not duplicates: a shared guardian with a different
   first name is returned as a sibling, which a school wants to know. */
export function findDuplicates(subject, people, others) {
  const me = nameParts(subject.first, subject.last);
  const mine = familyKeys(subject.guardians);
  const duplicates = [], siblings = [];

  function judge(c, kind) {
    const them = nameParts(c.first, c.last);
    if (!them.first && !them.last) return;
    const sameName = me.first === them.first && me.last === them.last;
    const dobEq = !!subject.dob && !!c.dob && subject.dob === c.dob;
    const firstClose = me.first && them.first && editDistance(me.first, them.first) <= 2;
    const lastClose = me.last && them.last && editDistance(me.last, them.last) <= 2;
    const theirs = familyKeys(c.guardians);
    const sameFamily = sameSet(mine.emails, theirs.emails) || sameSet(mine.phones, theirs.phones);
    let strength = null, reason = "";
    if (sameName && dobEq) { strength = "exact"; reason = "Same name and date of birth"; }
    else if (dobEq && (firstClose && lastClose)) { strength = "possible"; reason = "Same date of birth, a very similar name"; }
    else if (sameFamily && me.first && me.first === them.first) { strength = "possible"; reason = "Same first name in the same family"; }
    else if (sameName) { strength = "weak"; reason = c.dob && subject.dob ? "Same name, a different date of birth" : "Same name, date of birth not on file"; }
    if (strength) {
      duplicates.push({ key: `${kind === "student" ? "acc" : "app"}:${c.id}`, kind, id: c.id, name: c.name,
        dob: c.dob || null, strength, reason, status: c.status || null, number: c.number || null,
        grade: c.grade || null, year: c.year || null, studentId: c.studentId || null });
    } else if (sameFamily && me.first && them.first && me.first !== them.first) {
      siblings.push({ kind, id: c.id, name: c.name, grade: c.grade || null, year: c.year || null,
        number: c.number || null, status: c.status || null });
    }
  }
  for (const p of people) {
    if (p.id === subject.studentId) continue;                    // already this person
    judge(p, "student");
  }
  for (const a of others) {
    if (a.id === subject.id) continue;
    if (subject.studentId && a.studentId === subject.studentId) continue; // their own history
    judge(a, "application");
  }
  const rank = { exact: 0, possible: 1, weak: 2 };
  duplicates.sort((x, y) => rank[x.strength] - rank[y.strength]);
  return { duplicates, siblings };
}

/* A way to find the few records that could possibly match one, without
   comparing every record to every other. A candidate must share a date of
   birth, a full name, or a family key (a guardian's email or phone) to be a
   match at all, so those three are the index. */
export function duplicateIndex(people, apps) {
  const by = new Map();
  const keysOf = (c) => {
    const k = [];
    if (c.dob) k.push("d:" + c.dob);
    const n = nameParts(c.first, c.last);
    if (n.first || n.last) k.push("n:" + n.first + "|" + n.last);
    const f = familyKeys(c.guardians);
    f.emails.forEach((e) => k.push("e:" + e));
    f.phones.forEach((p) => k.push("p:" + p));
    return k;
  };
  const put = (kind, c) => keysOf(c).forEach((k) => {
    if (!by.has(k)) by.set(k, []);
    by.get(k).push({ kind, c });
  });
  people.forEach((c) => put("student", c));
  apps.forEach((c) => put("application", c));
  return (subject) => {
    const seen = new Set(), outPeople = [], outApps = [];
    for (const k of keysOf(subject)) {
      for (const hit of by.get(k) || []) {
        if (seen.has(hit.c)) continue;
        seen.add(hit.c);
        (hit.kind === "student" ? outPeople : outApps).push(hit.c);
      }
    }
    return { people: outPeople, apps: outApps };
  };
}

/* ------------------------------------------------------------- Evaluation
   One application, as the person working it needs to see it: how far along
   it is, what is missing, what is stopping each next step, and where it sits
   in the eight stages of the process. */

const blocker = (kind, code, label, ref, extra) => ({ kind, code, label, ref: ref || null, ...(extra || {}) });

export function hasConsent(form, settings) {
  return (form.consents || []).some((c) => c && c.accepted === true && c.version === settings.consent.version);
}

function guardianOk(g) {
  return !!(g && String(g.name || "").trim() && (String(g.phone || "").trim() || String(g.email || "").trim()));
}

/* The fields an application cannot be submitted without. Each is a rule a
   school can read, not a hunch: nothing here is "probably needed". */
export function fieldGaps(app, settings, today) {
  const f = app.form || {};
  const gaps = [];
  const need = (ok, key, label) => { if (!ok) gaps.push({ key, label }); };
  need(String(app.legalFirst || "").trim(), "student.legalFirst", "Legal first name");
  need(String(app.legalLast || "").trim() || (settings && settings.singleName), "student.legalLast", "Legal last name");
  need(isDate(app.dob) && app.dob <= (today || todayOf()), "student.dob", "Date of birth");
  need(app.grade && gradeRow(settings, app.grade), "grade", "Grade applied to");
  need(isDate(app.intendedStart), "intendedStart", "Intended joining date");
  need((f.guardians || []).some(guardianOk), "guardians", "A parent or guardian with a phone number or email");
  need(String((f.contact && f.contact.address) || "").trim(), "contact.address", "Residential address");
  if (app.type === "transfer") need(String((f.previous && f.previous.school) || "").trim(), "previous.school", "Previous school");
  need(hasConsent(f, settings), "consent", "Consent to the admission and data policy");
  return gaps;
}

export function ageCheck(app, settings) {
  const g = gradeRow(settings, app.grade);
  if (!g || g.minAge == null || !isDate(app.dob) || !isYear(app.year)) return null;
  const cutoff = `${app.year.slice(0, 4)}-${settings.ageCutoff}`;
  const age = ageOn(app.dob, cutoff);
  return { ok: age >= g.minAge, age, minAge: g.minAge, cutoff };
}

/* An unresolved candidate is one that blocks a decision: a person has to say
   the two are the same, or are not. Weak matches are information only. */
export function openDuplicates(duplicates, review) {
  const done = (review && review.duplicates) || {};
  return duplicates.filter((d) => d.strength !== "weak" && !done[d.key]);
}

export function evaluate({ app, docs, settings, seats, duplicates, today }) {
  const review = app.review || {};
  const gaps = fieldGaps(app, settings, today);
  const fieldsTotal = 9 - (app.type === "transfer" ? 0 : 1);

  const required = docs.filter((d) => d.required);
  const received = required.filter((d) => ["received", "verified", "waived"].includes(d.status));
  const verified = required.filter((d) => ["verified", "waived"].includes(d.status));
  const missing = required.filter((d) => d.status === "missing" || d.status === "returned");
  const unverified = required.filter((d) => d.status === "received");

  const done = (fieldsTotal - gaps.length) + received.length;
  const total = fieldsTotal + required.length;
  const percent = total ? Math.round((done / total) * 100) : 100;

  const checks = (review.checks || {});
  const openChecks = settings.review.filter((c) => c.required && !(checks[c.key] && checks[c.key].done));
  const corrections = (review.corrections || []).filter((c) => !c.resolved);
  const dupOpen = openDuplicates(duplicates || [], review);
  const age = ageCheck(app, settings);
  const overrides = review.overrides || {};

  const G = {
    fields: gaps.map((g) => blocker("fields", "field_missing", g.label, g.key)),
    received: missing.map((d) => blocker("received", d.status === "returned" ? "doc_returned" : "doc_missing",
      d.status === "returned" ? `${d.label} was returned — send it again` : `${d.label} has not been received`, d.key)),
    verified: unverified.map((d) => blocker("verified", "doc_unverified", `${d.label} is waiting to be verified`, d.key)),
    checks: openChecks.map((c) => blocker("checks", "check_open", c.label, c.key)),
    dups: dupOpen.map((d) => blocker("dups", "duplicate_open", `Is this the same person as ${d.name}?`, d.key)),
    corrections: corrections.map((c) => blocker("corrections", "correction_open", c.message, c.id)),
    seats: [],
    age: [],
    acceptance: [],
    start: [],
    identity: []
  };
  if (seats && seats.limit != null && seats.used >= seats.limit && !overrides.seats) {
    G.seats.push(blocker("seats", "grade_full",
      `${app.grade} has no seat left (${seats.used} of ${seats.limit}) — waitlist, or admit with a reason`, null, { soft: true }));
  }
  if (age && !age.ok && !overrides.age) {
    G.age.push(blocker("age", "under_age",
      `Will be ${age.age} on ${age.cutoff}; ${app.grade} asks for ${age.minAge} — admit with a reason, or choose another grade`, null, { soft: true }));
  }
  if (settings.requireAcceptance && app.acceptance !== "accepted") {
    G.acceptance.push(blocker("acceptance", "not_accepted", "The offer has not been accepted yet"));
  }
  if (!isDate(app.intendedStart)) G.start.push(blocker("start", "no_start", "Set the day the student starts"));
  if (app.activating && !app.studentId && !(app.account && app.account.email)) {
    G.identity.push(blocker("identity", "no_identity", "Give the student a sign-in, or link an existing student"));
  }

  const flat = (...ks) => ks.flatMap((k) => G[k]);
  const gates = {
    submit: flat("fields"),
    review: flat("fields", "received"),
    decision: flat("fields", "received", "verified", "checks", "dups", "corrections"),
    approve: flat("fields", "received", "verified", "checks", "dups", "corrections", "seats", "age"),
    activate: flat("acceptance", "start", "identity", "dups")
  };

  const status = app.status;
  const ended = status === "rejected" || status === "withdrawn";
  const enrolled = !!app.enrollmentId;
  const afterReview = ["awaiting_decision", "admitted", "waitlisted", "rejected"].includes(status);
  const submitted = !["draft", "changes_requested"].includes(status);

  const stage = (key, label, ok, blocked, note) => ({ key, label, state: ok ? "done" : blocked ? "blocked" : "todo", note: note || "" });
  const stages = [
    stage("registration", "Registration", true, false, `${yearLabel(app.year)} · ${app.grade}`),
    stage("identity", "Identity check", isDate(app.dob) && (String(app.legalLast || "").trim() || settings.singleName) && dupOpen.length === 0,
      dupOpen.length > 0, dupOpen.length ? `${dupOpen.length} possible match${dupOpen.length > 1 ? "es" : ""} to settle` : ""),
    stage("application", "Application", gaps.length === 0 && submitted, false,
      gaps.length ? `${gaps.length} to complete` : ""),
    stage("documents", "Documents", required.length === verified.length,
      missing.some((d) => d.status === "returned"), missing.length ? `${missing.length} outstanding` : unverified.length ? `${unverified.length} to verify` : ""),
    stage("review", "Review", afterReview || enrolled, false, ""),
    stage("admission", "Admission", status === "admitted" && (!settings.requireAcceptance || app.acceptance === "accepted") || enrolled,
      status === "rejected" || status === "waitlisted", status === "waitlisted" ? "On the waitlist" : status === "rejected" ? "Declined" : ""),
    stage("enrollment", "Enrollment", enrolled, false, ""),
    stage("sync", "School systems", enrolled && app.syncState === "done", enrolled && app.syncState === "exception",
      enrolled && app.syncState === "exception" ? "Needs attention" : enrolled && app.syncState === "pending" ? "Waiting for the start date" : "")
  ];
  // Withdrawn work is not "current" anywhere: mark the first undone stage only
  // while the application is alive.
  let current = null;
  if (!ended) {
    const first = stages.find((s) => s.state !== "done");
    if (first) current = first.key;
  }

  /* What to do next, in words, from where it stands. One line the queue can
     show and the record can lead with. */
  let next;
  const first = (list) => list[0];
  if (ended) next = { label: status === "withdrawn" ? "Withdrawn" : "Declined", kind: "closed" };
  else if (enrolled) next = app.syncState === "exception"
    ? { label: "Resolve what could not be set up", kind: "sync", action: "resync" }
    : { label: "Enrolled", kind: "closed" };
  else if (status === "draft") next = gates.submit.length ? { label: first(gates.submit).label, kind: "fix", blocker: first(gates.submit) }
    : { label: "Submit the application", kind: "action", action: "submit" };
  else if (status === "changes_requested") next = { label: "Waiting for the corrections asked for", kind: "wait", action: "resubmit" };
  else if (status === "submitted" || status === "incomplete") next = gates.review.length
    ? { label: first(gates.review).label, kind: "fix", blocker: first(gates.review) }
    : { label: "Start the review", kind: "action", action: "start_review" };
  else if (status === "under_review") next = gates.decision.length
    ? { label: first(gates.decision).label, kind: "fix", blocker: first(gates.decision) }
    : { label: "Ready for a decision", kind: "action", action: "mark_ready" };
  else if (status === "awaiting_decision") next = gates.approve.length
    ? { label: first(gates.approve).label, kind: "fix", blocker: first(gates.approve) }
    : { label: "Decide: admit, waitlist or decline", kind: "action", action: "approve" };
  else if (status === "waitlisted") next = { label: "Waitlisted — reconsider when a seat opens", kind: "wait", action: "reconsider" };
  else if (status === "admitted") next = gates.activate.length
    ? { label: first(gates.activate).label, kind: app.acceptance === "pending" ? "wait" : "fix", blocker: first(gates.activate) }
    : { label: "Enroll the student", kind: "action", action: "activate" };
  else next = { label: "", kind: "none" };

  return {
    percent,
    fields: { total: fieldsTotal, done: fieldsTotal - gaps.length, missing: gaps },
    docs: { required: required.length, received: received.length, verified: verified.length,
            missing: missing.map((d) => d.key), unverified: unverified.map((d) => d.key) },
    checks: { required: settings.review.filter((c) => c.required).length, open: openChecks.length },
    age,
    seats: seats || null,
    gates, stages, current, next
  };
}

/* ------------------------------------------------------------- Transitions
   Which action may be taken from which status, and what each one needs to be
   true first. The gate names are the ones evaluate() builds. */

export const FLOW = {
  submit:          { from: ["draft", "changes_requested"], gate: "submit" },
  resubmit:        { from: ["changes_requested"], gate: "submit" },
  start_review:    { from: ["submitted", "incomplete"], gate: "review" },
  request_changes: { from: ["submitted", "incomplete", "under_review", "awaiting_decision"] },
  mark_ready:      { from: ["under_review"], gate: "decision" },
  approve:         { from: ["awaiting_decision"], gate: "approve" },
  waitlist:        { from: ["under_review", "awaiting_decision"] },
  reject:          { from: ["submitted", "incomplete", "under_review", "awaiting_decision", "waitlisted"] },
  reconsider:      { from: ["waitlisted", "rejected"] },
  withdraw:        { from: OPEN_STATUSES },
  reopen:          { from: ["rejected", "withdrawn"] },
  accept:          { from: ["admitted"] },
  decline:         { from: ["admitted"] },
  activate:        { from: ["admitted"], gate: "activate" }
};

/* Whether `action` can be taken now. Returns { ok, why, blockers }: `why` is
   a sentence for a person; `blockers` the structured list behind it. Soft
   blockers (a full grade, a younger child) can be passed with a reason, and
   the caller says so by `overrides`. */
export function canAct(action, status, evaluation, { enrolled = false } = {}) {
  const rule = FLOW[action];
  if (!rule) return { ok: false, why: "That is not something an application does.", blockers: [] };
  if (enrolled) {
    return { ok: false, why: "This application has already become an enrollment — change the enrollment instead.", blockers: [] };
  }
  if (!rule.from.includes(status)) {
    return { ok: false, why: `That cannot be done to an application that is ${label(status)}.`, blockers: [] };
  }
  const blockers = rule.gate ? evaluation.gates[rule.gate] : [];
  if (blockers.length) return { ok: false, why: blockers[0].label, blockers };
  return { ok: true, why: "", blockers: [] };
}

export function label(status) {
  return ({ draft: "a draft", submitted: "submitted", incomplete: "incomplete", under_review: "under review",
    changes_requested: "waiting on corrections", awaiting_decision: "awaiting a decision", waitlisted: "waitlisted",
    admitted: "admitted", rejected: "declined", withdrawn: "withdrawn" })[status] || status;
}

/* After documents change: an application waiting on paperwork moves on by
   itself once the last required document has arrived, and nothing else does. */
export function statusAfterDocuments(status, evaluation) {
  if (status === "incomplete" && evaluation.gates.review.length === 0) return "submitted";
  if (status === "submitted" && evaluation.gates.review.some((b) => b.kind === "received")) return "incomplete";
  return status;
}

/* --------------------------------------------------------- Enrollment state
   What an enrollment is *now*: stored intent, read against its dates. A
   student whose year begins next month is "scheduled", not attending. */
export function enrollmentStatus(e, today) {
  if (e.state !== "enrolled") return e.state;
  if (e.starts_on > today) return "scheduled";
  if (e.ends_on && e.ends_on < today) return "completed";
  return "active";
}

/* Open-application states a seat is held by. Admitted counts, so two
   administrators cannot both promise the last one. */
export const SEAT_HOLDERS = ["admitted"];
