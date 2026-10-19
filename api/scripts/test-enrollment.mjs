// The enrollment rules, tested without a server: node scripts/test-enrollment.mjs
import assert from "node:assert/strict";
import * as E from "../src/services/enrollment.js";
import * as L from "../src/services/letters.js";
import { reportOf, registerRows } from "../src/services/admissions.js";
import { rosterFromApplication } from "../src/services/india.js";

let n = 0;
const test = (name, fn) => { fn(); n++; console.log("  ok  " + name); };

const TODAY = "2026-10-11";
const S = E.defaultSettings(TODAY);

/* ---- dates and years */
test("a school year runs June to May", () => {
  assert.equal(E.schoolYearOf("2026-10-11"), "2026-2027");
  assert.equal(E.schoolYearOf("2027-05-31"), "2026-2027");
  assert.equal(E.schoolYearOf("2027-06-01"), "2027-2028");
  assert.equal(E.nextYear("2026-2027"), "2027-2028");
  assert.equal(E.previousYear("2026-2027"), "2025-2026");
  assert.ok(E.isYear("2026-2027")); assert.ok(!E.isYear("2026-2028")); assert.ok(!E.isYear("2026-27"));
});
test("age is whole years on a day, never rounded up", () => {
  assert.equal(E.ageOn("2020-04-01", "2026-04-01"), 6);
  assert.equal(E.ageOn("2020-04-02", "2026-04-01"), 5);
  assert.equal(E.ageOn("nonsense", "2026-04-01"), null);
});
test("calendar days are real days", () => {
  assert.ok(E.isDate("2024-02-29")); assert.ok(!E.isDate("2025-02-29")); assert.ok(!E.isDate("2025-13-01"));
  assert.equal(E.addDays("2026-10-30", 3), "2026-11-02");
});

/* ---- names */
test("a US application needs a last name; a school where one name is usual does not", () => {
  const app = { legalFirst: "Aarav", legalLast: "", dob: "2012-01-01" };
  assert.ok(E.fieldGaps(app, S, TODAY).some((g) => g.key === "student.legalLast"));
  assert.ok(!E.fieldGaps(app, { ...S, singleName: true }, TODAY).some((g) => g.key === "student.legalLast"));
  assert.ok(E.fieldGaps({ ...app, legalFirst: "" }, { ...S, singleName: true }, TODAY).some((g) => g.key === "student.legalFirst"), "a first name is still needed");
});

/* ---- settings */
test("settings fall back to defaults and keep what a school set", () => {
  const s = E.normaliseSettings({ requireAcceptance: true, offerDays: 30 }, TODAY);
  assert.equal(s.requireAcceptance, true); assert.equal(s.offerDays, 30);
  assert.equal(s.grades.length, 14); assert.equal(s.currentYear, "2026-2027");
});
test("a bad write is refused, a bad read is repaired", () => {
  assert.throws(() => E.normaliseSettings({ years: ["26-27"] }, TODAY, { strict: true }));
  assert.throws(() => E.normaliseSettings({ documents: [{ key: "A B", label: "x" }] }, TODAY, { strict: true }));
  assert.throws(() => E.normaliseSettings({ grades: [{ name: "G1" }, { name: "g1" }] }, TODAY, { strict: true }));
  const s = E.normaliseSettings({ years: ["26-27"], grades: "nope", documents: 4 }, TODAY);
  assert.ok(s.documents.length > 0 && s.years.length > 0);
});
test("documents depend on grade and type; a returning student is not asked for a birth certificate again", () => {
  const nw = E.documentsFor(S, "Grade 3", "new").map((d) => d.key);
  const ret = E.documentsFor(S, "Grade 3", "returning").map((d) => d.key);
  const tr = E.documentsFor(S, "Grade 3", "transfer").map((d) => d.key);
  assert.ok(nw.includes("birth_proof") && !nw.includes("transfer_cert"));
  assert.deepEqual(ret, []);
  assert.ok(tr.includes("transfer_cert") && tr.includes("previous_report"));
});
test("nothing restricted is asked for unless the school adds it", () => {
  assert.ok(!S.documents.some((d) => d.sensitive));
  assert.ok(!S.documents.some((d) => /identity number|category|income/i.test(d.label)));
});
test("admission numbers and application numbers", () => {
  assert.equal(E.admissionNumber(S, 42), "ADM-0042");
  assert.equal(E.applicationNumber(7), "ENR-0007");
  assert.equal(E.nextGrade(S, "Grade 6"), "Grade 7"); assert.equal(E.nextGrade(S, "Grade 12"), null);
});

/* ---- duplicates */
const person = (id, name, first, last, dob, guardians = []) => ({ id, name, first, last, dob, guardians });
test("the same name and date of birth is an exact match", () => {
  const r = E.findDuplicates({ id: "a", first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: [] },
    [person("s1", "Aarav Sharma", "Aarav", "Sharma", "2015-03-02")], []);
  assert.equal(r.duplicates[0].strength, "exact");
});
test("a typo with the same birthday is possible, the same name with another birthday is only weak", () => {
  const subject = { id: "a", first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: [] };
  const r = E.findDuplicates(subject, [
    person("s1", "Arav Sharma", "Arav", "Sharma", "2015-03-02"),
    person("s2", "Aarav Sharma", "Aarav", "Sharma", "2012-01-01")], []);
  assert.deepEqual(r.duplicates.map((d) => d.strength), ["possible", "weak"]);
  assert.equal(E.openDuplicates(r.duplicates, {}).length, 1, "weak matches never block");
});
test("a brother or sister is a sibling, not a duplicate", () => {
  const g = [{ name: "Raj", email: "raj@x.in", phone: "98765 43210" }];
  const r = E.findDuplicates({ id: "a", first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: g },
    [person("s9", "Diya Sharma", "Diya", "Sharma", "2017-08-09", [{ email: "RAJ@x.in" }])], []);
  assert.equal(r.duplicates.length, 0); assert.equal(r.siblings.length, 1);
});
test("a student's own earlier applications are history, not duplicates", () => {
  const r = E.findDuplicates({ id: "a2", studentId: "s1", first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: [] },
    [], [{ id: "a1", studentId: "s1", name: "Aarav Sharma", first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: [] }]);
  assert.equal(r.duplicates.length, 0);
});
test("a settled duplicate stops blocking", () => {
  const d = [{ key: "acc:s1", strength: "exact" }];
  assert.equal(E.openDuplicates(d, {}).length, 1);
  assert.equal(E.openDuplicates(d, { duplicates: { "acc:s1": { resolution: "different" } } }).length, 0);
});
test("the index finds the same candidates as comparing everything", () => {
  const people = [person("s1", "Aarav Sharma", "Aarav", "Sharma", "2015-03-02"), person("s2", "Zed Quinn", "Zed", "Quinn", "2001-01-01")];
  const idx = E.duplicateIndex(people, []);
  const c = idx({ first: "Aarav", last: "Sharma", dob: "2015-03-02", guardians: [] });
  assert.deepEqual(c.people.map((p) => p.id), ["s1"]);
});

/* ---- evaluation and the workflow */
const guardian = { name: "Raj Sharma", relationship: "Father", phone: "9876543210", email: "raj@x.in", primary: true };
function app(over = {}) {
  return {
    id: "a", status: "draft", type: "new", grade: "Grade 6", year: "2026-2027", studentId: null,
    legalFirst: "Aarav", legalLast: "Sharma", dob: "2014-06-01", intendedStart: "2026-11-01",
    form: { guardians: [guardian], contact: { address: "12 Park Road" },
            consents: [{ accepted: true, version: S.consent.version }] },
    review: {}, acceptance: "not_required", enrollmentId: null, ...over
  };
}
const doc = (key, status, required = true) => ({ key, label: key, required, status });
const allDocs = (status) => ["birth_proof", "photo", "address_proof"].map((k) => doc(k, status));

test("an empty draft says exactly what is missing", () => {
  const ev = E.evaluate({ app: app({ legalLast: "", dob: null, form: {} }), docs: allDocs("missing"), settings: S, duplicates: [], today: TODAY });
  const keys = ev.fields.missing.map((m) => m.key);
  for (const k of ["student.legalLast", "student.dob", "guardians", "contact.address", "consent"]) assert.ok(keys.includes(k), k);
  assert.ok(ev.percent < 50);
  assert.ok(ev.gates.submit.length >= 5);
});
test("a complete draft can be submitted, and waits on paperwork as incomplete", () => {
  const ev = E.evaluate({ app: app(), docs: allDocs("missing"), settings: S, duplicates: [], today: TODAY });
  assert.equal(ev.gates.submit.length, 0);
  assert.ok(E.canAct("submit", "draft", ev).ok);
  assert.equal(ev.next.action, "submit");
  assert.ok(ev.gates.review.length === 3, "three documents to receive");
});
test("a received document is not a verified one", () => {
  const ev = E.evaluate({ app: app({ status: "under_review" }), docs: allDocs("received"), settings: S, duplicates: [], today: TODAY });
  assert.equal(ev.gates.review.length, 0);
  assert.equal(ev.gates.decision.filter((b) => b.kind === "verified").length, 3);
  assert.ok(!E.canAct("mark_ready", "under_review", ev).ok);
});
test("review checks and open duplicates block a decision until settled", () => {
  const dups = [{ key: "acc:s1", name: "Aarav S.", strength: "possible" }];
  let ev = E.evaluate({ app: app({ status: "under_review" }), docs: allDocs("verified"), settings: S, duplicates: dups, today: TODAY });
  assert.deepEqual([...new Set(ev.gates.decision.map((b) => b.kind))].sort(), ["checks", "dups"]);
  const review = { checks: { identity: { done: true }, eligibility: { done: true } }, duplicates: { "acc:s1": { resolution: "different" } } };
  ev = E.evaluate({ app: app({ status: "under_review", review }), docs: allDocs("verified"), settings: S, duplicates: dups, today: TODAY });
  assert.equal(ev.gates.decision.length, 0);
  assert.ok(E.canAct("mark_ready", "under_review", ev).ok);
});
test("a full grade and a young child are soft blockers a person can set aside", () => {
  const settings = E.normaliseSettings({ grades: [{ name: "Grade 6", seats: 30, minAge: 12 }] }, TODAY);
  const review = { checks: { identity: { done: true }, eligibility: { done: true } } };
  const base = { app: app({ status: "awaiting_decision", review, dob: "2016-01-01" }), docs: allDocs("verified"), settings,
                 seats: { limit: 30, used: 30 }, duplicates: [], today: TODAY };
  let ev = E.evaluate(base);
  const kinds = ev.gates.approve.map((b) => b.kind);
  assert.deepEqual(kinds.sort(), ["age", "seats"]);
  assert.ok(ev.gates.approve.every((b) => b.soft));
  ev = E.evaluate({ ...base, app: app({ status: "awaiting_decision", dob: "2016-01-01",
    review: { ...review, overrides: { age: { reason: "x" }, seats: { reason: "y" } } } }) });
  assert.equal(ev.gates.approve.length, 0);
});
test("the age rule counts on the cut-off of the school year's first year", () => {
  const settings = E.normaliseSettings({ grades: [{ name: "Grade 1", minAge: 6 }], ageCutoff: "04-01" }, TODAY);
  const c = E.ageCheck({ grade: "Grade 1", dob: "2020-04-02", year: "2026-2027" }, settings);
  assert.deepEqual([c.ok, c.age, c.cutoff], [false, 5, "2026-04-01"]);
  assert.equal(E.ageCheck({ grade: "Grade 1", dob: "2020-04-01", year: "2026-2027" }, settings).ok, true);
});
test("the offer must be accepted when the school says so, then the student can be enrolled", () => {
  const settings = E.normaliseSettings({ requireAcceptance: true }, TODAY);
  const mk = (acceptance) => E.evaluate({ app: app({ status: "admitted", acceptance, activating: true, studentId: "s1" }),
    docs: allDocs("verified"), settings, duplicates: [], today: TODAY });
  assert.ok(!E.canAct("activate", "admitted", mk("pending")).ok);
  assert.equal(E.canAct("activate", "admitted", mk("pending")).blockers[0].code, "not_accepted");
  assert.ok(E.canAct("activate", "admitted", mk("accepted")).ok);
});
test("enrolling a new applicant needs a sign-in or a linked student", () => {
  const ev = E.evaluate({ app: app({ status: "admitted", activating: true }), docs: allDocs("verified"), settings: S, duplicates: [], today: TODAY });
  assert.equal(E.canAct("activate", "admitted", ev).blockers[0].code, "no_identity");
});
test("transitions only start where they should", () => {
  const ev = E.evaluate({ app: app(), docs: allDocs("verified"), settings: S, duplicates: [], today: TODAY });
  assert.ok(!E.canAct("approve", "draft", ev).ok);
  assert.ok(!E.canAct("start_review", "draft", ev).ok);
  assert.ok(E.canAct("withdraw", "under_review", ev).ok);
  assert.ok(!E.canAct("withdraw", "rejected", ev).ok);
  assert.ok(E.canAct("reopen", "rejected", ev).ok);
  assert.ok(!E.canAct("approve", "awaiting_decision", ev, { enrolled: true }).ok, "an enrolled application is closed to workflow");
});
test("paperwork arriving moves an incomplete application on, by itself", () => {
  const ev = (st) => E.evaluate({ app: app({ status: "incomplete" }), docs: allDocs(st), settings: S, duplicates: [], today: TODAY });
  assert.equal(E.statusAfterDocuments("incomplete", ev("received")), "submitted");
  assert.equal(E.statusAfterDocuments("incomplete", ev("missing")), "incomplete");
  assert.equal(E.statusAfterDocuments("under_review", ev("missing")), "under_review");
});
test("eight stages, and the first one not done is the current one", () => {
  const ev = E.evaluate({ app: app({ status: "under_review" }), docs: allDocs("received"), settings: S, duplicates: [], today: TODAY });
  assert.equal(ev.stages.length, 8);
  assert.equal(ev.current, "documents");
  assert.equal(ev.stages.find((s) => s.key === "application").state, "done");
});
test("an enrollment's status is read from its dates, not only its label", () => {
  const e = { state: "enrolled", starts_on: "2026-11-01", ends_on: null };
  assert.equal(E.enrollmentStatus(e, "2026-10-11"), "scheduled");
  assert.equal(E.enrollmentStatus(e, "2026-11-01"), "active");
  assert.equal(E.enrollmentStatus({ ...e, ends_on: "2026-12-01" }, "2026-12-02"), "completed");
  assert.equal(E.enrollmentStatus({ ...e, state: "suspended" }, "2026-11-05"), "suspended");
});

/* ---- an Indian school's admissions */
test("an Indian school's year runs from April, its classes are Nursery to Class XII, and a US school's are unchanged", () => {
  assert.equal(E.schoolYearOf("2026-10-11", 4), "2026-2027");
  assert.equal(E.schoolYearOf("2027-03-31", 4), "2026-2027");
  assert.equal(E.schoolYearOf("2027-04-01", 4), "2027-2028");
  const IN = E.defaultSettings("2027-04-02", { region: "IN", yearStartMonth: 4 });
  assert.equal(IN.currentYear, "2027-2028");
  assert.deepEqual(IN.grades.slice(0, 4).map((g) => [g.name, g.minAge]), [["Nursery", 3], ["LKG", 4], ["UKG", 5], ["Class I", 6]]);
  assert.equal(IN.grades[IN.grades.length - 1].name, "Class XII"); assert.equal(IN.grades[IN.grades.length - 1].minAge, 17);
  assert.ok(!IN.documents.some((d) => d.sensitive || /aadhaar/i.test(d.key + d.label)), "no identity number is asked for until the school adds one");
  const US = E.defaultSettings("2026-10-11");
  assert.equal(US.grades[0].name, "Pre-K"); assert.equal(US.currentYear, "2026-2027");
});
test("what a school saved still wins over the Indian defaults", () => {
  const kept = E.normaliseSettings({ grades: [{ name: "Class 9", seats: 40 }] }, "2026-10-11", { region: "IN", yearStartMonth: 4 });
  assert.deepEqual(kept.grades.map((g) => g.name), ["Class 9"]);
});

/* ---- the formal process: assessments, priorities, calendar, what a school insists on */
test("assessments, priorities, the calendar and the letterhead are settings, and a bad write is refused", () => {
  const s = E.normaliseSettings({
    assessments: [{ key: "test", label: "Entrance test", required: true, grades: ["Grade 3"], types: ["new"] }],
    priorities: [{ key: "sibling", label: "Sibling" }],
    calendar: { "2026-2027": { opens: "2026-12-01", closes: "2027-01-31", resultsOn: "2027-02-15" } },
    letters: { code: "SFHS", signatory: "Ritika Sood", designation: "Vice Principal" }, decisionDays: 10
  }, TODAY, { strict: true });
  assert.equal(s.assessments[0].required, true); assert.equal(s.calendar["2026-2027"].closes, "2027-01-31");
  assert.equal(s.letters.code, "SFHS"); assert.equal(s.decisionDays, 10);
  assert.throws(() => E.normaliseSettings({ calendar: { "2026-2027": { opens: "2027-02-01", closes: "2027-01-01" } } }, TODAY, { strict: true }), /cannot close before/);
  assert.throws(() => E.normaliseSettings({ calendar: { "2026-2027": { opens: "tomorrow" } } }, TODAY, { strict: true }));
  assert.throws(() => E.normaliseSettings({ letters: { code: "no spaces" } }, TODAY, { strict: true }));
  assert.throws(() => E.normaliseSettings({ requiredFields: ["student.eyeColour"] }, TODAY, { strict: true }));
  const bad = E.normaliseSettings({ calendar: { x: 1 }, requiredFields: ["nope"] }, TODAY);
  assert.deepEqual(bad.calendar, {}); assert.ok(Array.isArray(bad.requiredFields));
});
test("an Indian school insists on gender and a PIN code; a US one on neither, until it says so", () => {
  const IN = E.defaultSettings(TODAY, { region: "IN", yearStartMonth: 4 });
  assert.deepEqual(IN.requiredFields, ["student.gender", "contact.pin"]); assert.deepEqual(S.requiredFields, []);
  const keys = (st) => E.fieldGaps(app(), st, TODAY).map((g) => g.key);
  assert.ok(keys(IN).includes("student.gender") && keys(IN).includes("contact.pin"));
  assert.ok(!keys(S).includes("student.gender"));
  const filled = app({ grade: "Class VI", form: { ...app().form, student: { gender: "Female" }, contact: { address: "12 Park Road", pin: "160022" } } });
  assert.equal(E.fieldGaps(filled, IN, TODAY).length, 0);
  assert.equal(E.evaluate({ app: filled, docs: allDocs("verified"), settings: IN, duplicates: [], today: TODAY }).fields.total, 10);
});
const ASK = E.normaliseSettings({ assessments: [
  { key: "interaction", label: "Interaction", required: true }, { key: "test", label: "Entrance test", required: false }] }, TODAY);
const taken = (kind, result, over = {}) => ({ id: kind + result, kind, status: "completed", result, onDate: "2026-11-02", recordedAt: 2, ...over });
const ready = (sessions, over = {}, settings = ASK) => E.evaluate({
  app: app({ status: "awaiting_decision", review: { checks: { identity: { done: true }, eligibility: { done: true } } }, ...over }),
  docs: allDocs("verified"), settings, duplicates: [], today: TODAY, sessions });
test("a required assessment must be taken, with a result, before a decision; an optional one never blocks", () => {
  let ev = ready([]);
  assert.deepEqual(ev.gates.decision.map((b) => b.code), ["assess_pending"]);
  assert.ok(!E.canAct("approve", "awaiting_decision", ev).ok);
  ev = ready([{ id: "s", kind: "interaction", status: "scheduled", onDate: "2026-11-05" }]);
  assert.match(ev.gates.decision[0].label, /is set for 2026-11-05/);
  ev = ready([{ id: "s", kind: "interaction", status: "absent", onDate: "2026-11-05" }, { id: "c", kind: "interaction", status: "cancelled", onDate: "2026-11-06" }]);
  assert.equal(ev.gates.decision.length, 1, "a missed or called-off session is not a result");
  ev = ready([taken("interaction", "deferred")]);
  assert.equal(ev.gates.decision[0].code, "assess_deferred");
  ev = ready([taken("interaction", "qualified")]);
  assert.equal(ev.gates.approve.length, 0); assert.ok(E.canAct("approve", "awaiting_decision", ev).ok);
  assert.equal(ev.assessments.required, 1);
});
test("not qualifying is a soft stop with a reason, like a full grade — never a silent refusal", () => {
  let ev = ready([taken("interaction", "not_qualified")]);
  assert.equal(ev.gates.decision.length, 0, "the result is in, so the application can go to a decision");
  assert.deepEqual(ev.gates.approve.map((b) => [b.kind, !!b.soft]), [["assessment", true]]);
  ev = ready([taken("interaction", "not_qualified")], { review: { checks: { identity: { done: true }, eligibility: { done: true } }, overrides: { assessment: { reason: "Recommended by the principal" } } } });
  assert.equal(ev.gates.approve.length, 0);
  ev = ready([taken("interaction", "not_qualified", { recordedAt: 1 }), taken("interaction", "qualified", { id: "later", recordedAt: 9 })]);
  assert.equal(ev.gates.approve.length, 0, "the latest sitting counts");
});
test("the assessment stage appears only when the school asks for one or one was set", () => {
  const stages = (settings, sessions) => E.evaluate({ app: app({ status: "under_review" }), docs: allDocs("verified"), settings, duplicates: [], today: TODAY, sessions }).stages.map((x) => x.key);
  assert.ok(!stages(S, []).includes("assessment"));
  assert.deepEqual(stages(ASK, []).slice(3, 5), ["documents", "assessment"]);
  assert.ok(stages(S, [{ id: "x", kind: "test", status: "scheduled", onDate: "2026-11-05" }]).includes("assessment"));
  const only = E.normaliseSettings({ assessments: [{ key: "test", label: "Test", required: true, grades: ["Grade 3"] }] }, TODAY);
  assert.equal(E.assessmentsFor(only, "Grade 6", "new").length, 0); assert.equal(E.assessmentsFor(only, "Grade 3", "new").length, 1);
});
test("the waiting list goes by priority category, then by who joined first", () => {
  const st = E.normaliseSettings({ priorities: [{ key: "sibling", label: "Sibling" }, { key: "staff", label: "Staff" }] }, TODAY);
  const o = E.waitlistOrder([{ id: "late-sib", waitlistedAt: 30, priority: "sibling" }, { id: "plain-1", waitlistedAt: 10 },
    { id: "staff", waitlistedAt: 20, priority: "staff" }, { id: "early-sib", waitlistedAt: 5, priority: "sibling" }], st);
  assert.deepEqual(["early-sib", "late-sib", "staff", "plain-1"].map((k) => o.get(k).position), [1, 2, 3, 4]);
  assert.equal(o.get("plain-1").of, 4);
});

/* ---- letters */
const LD = { refNo: "SFHS/ADM/2026-27/0012/OFR", date: "2026-10-18", school: { name: "Strawberry Fields High School" }, addressee: "Raj Sharma",
  student: "Aarav Sharma", grade: "Class VI", year: "2026-2027", appNo: "ENR-0012", admissionNo: "ADM-0007", startsOn: "2027-04-01",
  offerUntil: "2026-11-01", acceptanceRequired: true, replyBy: "2026-10-25", outstanding: [{ label: "Birth certificate" }, { label: "Photograph", note: "too dark" }],
  corrections: ["The address needs a PIN code"], sessions: [{ label: "Entrance test", onDate: "2026-11-05", atTime: "09:30", venue: "Block A" }],
  bring: ["Birth certificate"], waitlist: { position: 3, of: 9 }, rejectReason: "no_seat", signatory: "Ritika Sood", designation: "Vice Principal" };
test("every letter has a subject, a reference, a salutation and a closing, and says nothing about money", () => {
  for (const kind of E.LETTER_KINDS) {
    const doc = L.renderLetter(kind, { ...LD, refNo: L.referenceNo({ code: "SFHS", year: LD.year, seq: 12, kind, n: 1 }) });
    assert.ok(doc.subject && doc.blocks.length >= 2, kind);
    assert.match(doc.refNo, /^SFHS\/ADM\/2026-27\/0012\/[A-Z]+$/);
    assert.equal(doc.salutation, "Dear Raj Sharma,"); assert.ok(doc.closing.includes("Ritika Sood"));
    assert.doesNotMatch(L.letterText(doc), /\bfees?\b|tuition|payment|₹|\$|rupee/i, kind + " mentions money");
  }
});
test("each letter says what the school decided and no more", () => {
  const t = (kind, over) => L.letterText(L.renderLetter(kind, { ...LD, ...(over || {}) }));
  assert.match(t("offer"), /offered admission to Class VI.*ADM-0007/s); assert.match(t("offer"), /on or before 1 November 2026/);
  assert.match(t("offer", { acceptanceRequired: false }), /seat is confirmed/);
  assert.match(t("waitlist"), /position 3 of 9/); assert.match(t("waitlist"), /not an offer of admission/);
  assert.match(t("regret"), /all the seats in the class are filled/); assert.doesNotMatch(t("regret"), /failed|incompetent/i);
  assert.match(t("call"), /Entrance test/); assert.match(t("call"), /5 November 2026/); assert.match(t("call"), /9:30 am/); assert.match(t("call"), /Block A/);
  assert.match(t("deficiency"), /Photograph — too dark/); assert.match(t("deficiency"), /PIN code/); assert.match(t("deficiency"), /25 October 2026/);
  assert.match(t("confirmation", { className: "Class X-C" }), /admitted to Class X-C/);
  assert.match(t("acknowledgement"), /ENR-0012/);
});
test("a letter is available only at the stage it speaks to, and a second copy gets its own number", () => {
  const at = (o) => L.lettersAvailable({ status: "draft", enrolled: false, submitted: false, outstanding: false, scheduled: false, ...o });
  assert.deepEqual(at({}), []);
  assert.deepEqual(at({ submitted: true, outstanding: true, scheduled: true, status: "under_review" }), ["acknowledgement", "deficiency", "call"]);
  assert.ok(at({ submitted: true, status: "admitted" }).includes("offer") && !at({ submitted: true, status: "admitted" }).includes("regret"));
  assert.ok(at({ submitted: true, status: "rejected" }).includes("regret")); assert.ok(at({ submitted: true, status: "waitlisted" }).includes("waitlist"));
  assert.ok(at({ submitted: true, status: "admitted", enrolled: true }).includes("confirmation") && !at({ submitted: true, status: "admitted", enrolled: true }).includes("offer"));
  assert.equal(L.referenceNo({ code: "SFHS", year: "2026-2027", seq: 12, kind: "offer", n: 2 }), "SFHS/ADM/2026-27/0012/OFR-2");
  assert.equal(L.referenceNo({ code: "", year: "2026-2027", seq: 3, kind: "ack", n: 1 }).startsWith("ADM/2026-27/0003/"), true);
  assert.equal(L.LETTER_NEED.offer, "decide"); assert.equal(L.LETTER_NEED.deficiency, "verify"); assert.equal(L.LETTER_NEED.confirmation, "activate");
});

/* ---- reports and the register */
const A = (o) => ({ id: o.id, status: "under_review", entry_grade: "Class VI", submitted_at: 1e9, acceptance: "not_required", body_json: "{}", ...o });
test("the funnel counts what happened, stage by stage, and what each stage kept", () => {
  const day = DAYSTR(1e9 + 40 * 86400000);
  const apps = [A({ id: "a1", status: "admitted", admission_no: "ADM-1", decided_at: 1e9 + 5 * 86400000, enrollment_id: "e1", body_json: JSON.stringify({ admission: { source: "referral" } }) }),
    A({ id: "a2", status: "admitted", admission_no: "ADM-2", acceptance: "pending", decided_at: 1e9 + 30 * 86400000 }),
    A({ id: "a3", status: "rejected" }), A({ id: "a4", status: "waitlisted" }), A({ id: "a5", status: "draft", submitted_at: null }),
    A({ id: "a6", status: "withdrawn", admission_no: "ADM-6", acceptance: "declined" })];
  const sessions = [{ application_id: "a1", status: "completed" }, { application_id: "a3", status: "absent" }, { application_id: "a2", status: "completed" }];
  const enquiries = [{ source: "referral", status: "applied" }, { source: "walk_in", status: "not_proceeding", lost_reason: "Chose another school" }, { source: "walk_in", status: "new", follow_up_on: "1970-01-05" }];
  const r = reportOf({ apps, enquiries, sessions, enrollments: [{ state: "enrolled" }], settings: S, day });
  assert.deepEqual(r.funnel.map((f) => f.n), [3, 5, 2, 3, 1, 1]);
  assert.equal(r.funnel[1].ofPrevious, null, "applications are not a conversion of enquiries"); assert.equal(r.funnel[1].fromEnquiry, 0); assert.equal(r.funnel[3].ofPrevious, 60);
  assert.deepEqual(r.outcomes, { waitlisted: 1, declined: 1, withdrawn: 1, drafts: 1 });
  assert.equal(r.followUps, 1); assert.equal(r.notProceeding[0].reason, "Chose another school");
  assert.equal(r.timeliness.decided, 2); assert.equal(r.timeliness.medianDays, 18); assert.equal(r.timeliness.withinTarget, 50);
  const ref = r.sources.find((x) => x.source === "referral"); assert.deepEqual([ref.enquiries, ref.applications, ref.enrolled], [1, 1, 1]);
  assert.equal(r.sources.find((x) => x.source === "direct").applications, 4);
  assert.equal(r.grades.find((g) => g.name === "Class VI") === undefined, true, "a grade this school does not run is not invented");
});
function DAYSTR(ms) { return new Date(ms).toISOString().slice(0, 10); }
test("the register reads one line per student and shows a category only to someone who may see it", () => {
  const row = { enrollment_id: "e1", student_id: "s1", admission_no: "ADM-0001", starts_on: "2026-04-01", admitted_to: "Class VI", student_name: "Aarav Sharma", dob: "2014-06-01",
    gender: "M", category: "OBC", father_name: "Raj Sharma", mother_name: "Rita Sharma", state: "enrolled", class_grade: "VI", class_section: "A",
    body_json: JSON.stringify({ contact: { address: "12 Park Road" }, previous: { school: "Little Oaks", tcNumber: "TC/77" }, student: { nationality: "Indian" } }) };
  const [a] = registerRows([row], { sensitive: true }), [b] = registerRows([row], { sensitive: false });
  assert.equal(a.category, "OBC"); assert.equal(b.category, "");
  assert.deepEqual([a.serial, a.admissionNo, a.name, a.father, a.mother, a.gender, a.class, a.previousSchool, a.tcNumber, a.nationality],
    [1, "ADM-0001", "Aarav Sharma", "Raj Sharma", "Rita Sharma", "Male", "VI-A", "Little Oaks", "TC/77", "Indian"]);
});

/* ---- from the application to the school's own roster */
test("an enrolled child's roster row is filled from the application, and what the office wrote is kept", () => {
  const form = { student: { gender: "Female", category: "OBC", bloodGroup: "B+", motherTongue: "Punjabi", nationality: "Indian" },
    contact: { pin: "160022", district: "Chandigarh", state: "Chandigarh", whatsapp: "yes", language: "Punjabi" },
    admission: { transport: "School bus" }, support: { cwsn: true, disability: "Dyslexia" },
    guardians: [{ name: "Rita", relationship: "Mother", phone: "98765 43210", email: "rita@x.in", primary: true }, { name: "Raj", relationship: "Father", phone: "+91 9876500000" }] };
  const row = rosterFromApplication({ account_id: "s1", house: "Nilgiri", category: "General", roll_no: 4 },
    { form, admissionNo: "ADM-0007", startsOn: "2027-04-01", previousSchool: "Little Oaks", classId: "cls_9" });
  assert.equal(row.class_id, "cls_9"); assert.equal(row.house, "Nilgiri"); assert.equal(row.category, "General", "the office's word stands");
  assert.deepEqual([row.gender, row.blood_group, row.mother_tongue, row.pin, row.transport, row.whatsapp, row.cwsn, row.disability],
    ["F", "B+", "Punjabi", "160022", "School bus", 1, 1, "Dyslexia"]);
  assert.deepEqual([row.mother_name, row.mother_phone, row.father_name, row.father_phone, row.primary_contact, row.guardian_email, row.admission_no, row.admitted_on, row.previous_school],
    ["Rita", "+91 9876543210", "Raj", "+91 9876500000", "Mother", "rita@x.in", "ADM-0007", "2027-04-01", "Little Oaks"]);
  assert.equal(row.consent_status, "pending", "a new row still satisfies the table");
  const again = rosterFromApplication(row, { form, admissionNo: "ADM-9999", startsOn: "2030-01-01", classId: null });
  assert.equal(again.admission_no, "ADM-0007"); assert.equal(again.class_id, "cls_9");
  const guardianOnly = rosterFromApplication(null, { form: { guardians: [{ name: "Uncle Om", relationship: "Uncle", primary: true }] }, classId: null });
  assert.deepEqual([guardianOnly.guardian_name, guardianOnly.primary_contact, guardianOnly.father_name], ["Uncle Om", "Guardian", undefined]);
});

console.log(`\n${n} passed`);
