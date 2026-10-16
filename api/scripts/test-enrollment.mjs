// The enrollment rules, tested without a server: node scripts/test-enrollment.mjs
import assert from "node:assert/strict";
import * as E from "../src/services/enrollment.js";

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

console.log(`\n${n} passed`);
