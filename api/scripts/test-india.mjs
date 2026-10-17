// The India rules, tested without a server: node scripts/test-india.mjs
import assert from "node:assert/strict";
import * as I from "../src/services/india.js";

let n = 0;
const test = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
// A reader that records what it was told is wrong instead of throwing.
const errs = () => { const e = []; const fail = (m, k) => { e.push([k || null, m]); }; fail.list = e; return fail; };
const clean = (src) => { const f = errs(); const out = I.cleanStudent(src, f); return { out, errors: f.list }; };

/* ---- classes */
test("a class is written the way people say it", () => {
  assert.equal(I.gradeOf("Class X"), "X"); assert.equal(I.gradeOf("10"), "X"); assert.equal(I.gradeOf("x"), "X");
  assert.equal(I.gradeOf("kg"), "KG"); assert.equal(I.gradeOf("Grade 7"), "VII"); assert.equal(I.gradeOf("Reception"), "Reception");
  assert.deepEqual(I.parseClass("X-C"), { grade: "X", section: "C" });
  assert.deepEqual(I.parseClass("Class 9 b"), { grade: "IX", section: "B" });
  assert.equal(I.parseClass("nonsense here"), null);
  assert.equal(I.classLabel("X", "C"), "X-C");
});
test("IX to XII are the board classes", () => {
  assert.ok(I.isBoardClass("IX")); assert.ok(I.isBoardClass("XII")); assert.ok(!I.isBoardClass("VIII")); assert.ok(!I.isBoardClass("KG"));
  assert.ok(I.gradeRank("KG") < I.gradeRank("I")); assert.ok(I.gradeRank("XII") > I.gradeRank("X"));
});

/* ---- dates */
test("dates are real days, read from DD/MM/YYYY too", () => {
  assert.equal(I.dayOf("10/09/2010"), "2010-09-10"); assert.equal(I.dayOf("2010-09-10"), "2010-09-10"); assert.equal(I.dayOf("1.2.2011"), "2011-02-01");
  assert.equal(I.dayOf("31/02/2010"), null); assert.equal(I.dayOf("soon"), null);
});

/* ---- identifiers */
test("APAAR is 12 digits, REFUSED or NOGEN, and pending is nothing", () => {
  const f = errs();
  assert.equal(I.apaarOf("5346 5248 7008", f), "534652487008");
  assert.equal(I.apaarOf("refused", f), "REFUSED"); assert.equal(I.apaarOf("NOGEN", f), "NOGEN");
  assert.equal(I.apaarOf("Pending", f), null); assert.equal(I.apaarOf("", f), null);
  assert.equal(f.list.length, 0);
  I.apaarOf("12345", f); assert.equal(f.list.length, 1);
});
test("PEN is 11 digits", () => {
  const f = errs();
  assert.equal(I.penOf("96636761410", f), "96636761410"); assert.equal(I.penOf("", f), null); assert.equal(f.list.length, 0);
  I.penOf("966367614", f); assert.equal(f.list.length, 1);
});
test("an Aadhaar number is checked, then reduced to its last four digits", () => {
  const f = errs();
  const prefix = "23456789012";                       // 11 digits, first 2-9
  const full = prefix + I.verhoeffDigit(prefix);
  assert.ok(I.verhoeffOk(full));
  const masked = I.aadhaarOf(full, f);
  assert.equal(masked, "XXXX-XXXX-" + full.slice(8));
  assert.ok(!masked.includes(full.slice(0, 8)), "nothing but the last four survives");
  assert.equal(I.aadhaarOf("XXXX-XXXX-6116", f), "XXXX-XXXX-6116");   // already masked: kept as is
  assert.equal(I.aadhaarOf("REFUSED", f), "REFUSED");
  assert.equal(I.aadhaarOf("Not provided", f), null); assert.equal(I.aadhaarOf("", f), null);
  assert.equal(f.list.length, 0);
  const bad = full.slice(0, 11) + ((+full[11] + 1) % 10);
  I.aadhaarOf(bad, f); assert.equal(f.list.length, 1, "a mistyped digit fails its check");
  I.aadhaarOf("123456789012", f); assert.equal(f.list.length, 2, "cannot start with 1");
});
test("a PIN code is 6 digits and not 0xxxxx", () => {
  const f = errs();
  assert.equal(I.pinOf("160 019", f), "160019"); assert.equal(I.pinOf("", f), null); assert.equal(f.list.length, 0);
  I.pinOf("016001", f); I.pinOf("1600", f); assert.equal(f.list.length, 2);
});
test("an Indian mobile is ten digits starting 6 to 9", () => {
  const f = errs();
  assert.equal(I.phoneOf("98453 98272", f), "+91 9845398272"); assert.equal(I.phoneOf("+91 9845398272", f), "+91 9845398272");
  assert.equal(I.phoneOf("09845398272", f), "+91 9845398272"); assert.equal(I.phoneOf("919845398272", f), "+91 9845398272");
  assert.equal(I.phoneOf("", f), null); assert.equal(f.list.length, 0);
  I.phoneOf("5845398272", f); I.phoneOf("98453", f); assert.equal(f.list.length, 2);
});
test("the consent phrases a school's sheet uses become three facts", () => {
  assert.deepEqual(I.consentOf("Verified (DigiLocker)"), { consentStatus: "verified", consentMethod: "digilocker", consentNote: null });
  assert.deepEqual(I.consentOf("Verified (signed form)"), { consentStatus: "verified", consentMethod: "signed_form", consentNote: null });
  assert.deepEqual(I.consentOf("Pending"), { consentStatus: "pending", consentMethod: null, consentNote: null });
  assert.deepEqual(I.consentOf("Withdrawn - analytics only"), { consentStatus: "withdrawn", consentMethod: null, consentNote: "analytics only" });
  assert.equal(I.consentOf(""), null);
});

/* ---- cleaning a student */
test("only the fields named are returned, so an update cannot blank the rest", () => {
  const { out, errors } = clean({ house: "Agni", gender: "female", category: "EWS/DG (UT allotment)", rollNo: "21", whatsapp: "Yes", bloodGroup: "b+" });
  assert.deepEqual(errors, []);
  assert.deepEqual(out, { house: "Agni", gender: "F", category: "EWS/DG", rollNo: 21, whatsapp: 1, bloodGroup: "B+" });
  assert.ok(!("pen" in out) && !("apaar" in out));
});
test("a blank clears a field and N/A is blank", () => {
  const { out, errors } = clean({ house: "", transport: "N/A", fatherName: null });
  assert.deepEqual(errors, []); assert.deepEqual(out, { house: null, transport: null, fatherName: null });
});
test("every wrong field is reported, with its key", () => {
  const { errors } = clean({ gender: "x", category: "royal", rollNo: "0", pin: "12", apaar: "abc", consentStatus: "maybe", guardianEmail: "nope", admittedOn: "31/02/2020" });
  assert.deepEqual(errors.map((e) => e[0]).sort(), ["admittedOn", "apaar", "category", "consentStatus", "gender", "guardianEmail", "pin", "rollNo"]);
});

/* ---- what stands between a child and a list */
const kid = (o) => ({ grade: "X", pen: "96636761410", dob: "2010-09-10", gender: "F", category: "General", apaar: "534652487008", fatherName: "Tarun", consentStatus: "verified", ...o });
test("a complete child has no problems", () => assert.deepEqual(I.problemsOf(kid({})), []));
test("a missing PEN, date of birth, gender or category blocks the state's list", () => {
  for (const f of ["pen", "dob", "gender", "category"]) {
    const p = I.problemsOf(kid({ [f]: null }));
    assert.equal(p.length, 1); assert.equal(p[0].level, "blocks"); assert.equal(p[0].field, f);
  }
});
test("APAAR blocks only in the board classes, and REFUSED or NOGEN answer it", () => {
  assert.equal(I.problemsOf(kid({ apaar: null })).length, 1);
  assert.equal(I.problemsOf(kid({ grade: "VIII", apaar: null })).length, 0);
  assert.equal(I.problemsOf(kid({ apaar: "REFUSED" })).length, 0); assert.equal(I.problemsOf(kid({ apaar: "NOGEN" })).length, 0);
});
test("pending consent and no parent are things to fix, not blocks", () => {
  const p = I.problemsOf(kid({ consentStatus: "pending", fatherName: null }));
  assert.deepEqual(p.map((x) => x.level), ["fix", "fix"]);
  assert.deepEqual(I.problemsOf(kid({ consentStatus: "withdrawn" })), []);
});

/* ---- the summary */
test("the summary counts what is there and does not call pending an answer", () => {
  const kids = [kid({ classId: "a", classLabel: "X-A" }), kid({ classId: "a", classLabel: "X-A", apaar: null, consentStatus: "pending" }),
    kid({ classId: "b", classLabel: "VIII-A", grade: "VIII", apaar: "REFUSED", pen: null }), kid({ classId: "b", classLabel: "VIII-A", grade: "VIII", apaar: "NOGEN" })];
  const s = I.summaryOf(kids);
  assert.equal(s.students, 4);
  assert.deepEqual(s.apaar, { have: 1, refused: 1, nogen: 1, pending: 1 });
  assert.deepEqual(s.pen, { have: 3, missing: 1 });
  assert.deepEqual(s.consent, { verified: 3, pending: 1, withdrawn: 0 });
  assert.equal(s.apaarAnswered, 75);
  assert.deepEqual(s.board, { students: 2, answered: 1, percent: 50 });
  assert.equal(s.blocked, 2);                         // the board child with no APAAR, the child with no PEN
  assert.equal(s.fixes, 1);
  assert.deepEqual(s.classes.map((c) => [c.label, c.students, c.apaarAnswered, c.blocked]), [["X-A", 2, 1, 1], ["VIII-A", 2, 2, 1]]);
});

/* ---- exports */
test("an export is one row per child, in its own order, and never holds Aadhaar", () => {
  const s = kid({ admissionNo: "SFHS/2016/1517", name: "Tanvi Jindal", classLabel: "X-C", aadhaar: "XXXX-XXXX-6116", whatsapp: 1, address: "#588, Sector 16" });
  for (const k of Object.keys(I.EXPORTS)) {
    const e = I.exportRows(k, [s]);
    assert.equal(e.rows.length, 1); assert.equal(e.rows[0].length, e.columns.length);
    assert.ok(!e.columns.some((c) => /aadhaar/i.test(c)));
    assert.ok(!JSON.stringify(e.rows).includes("6116"));
  }
  const a = I.exportRows("apaar", [s, kid({ apaar: "REFUSED" }), kid({ apaar: null })]);
  assert.deepEqual(a.rows.map((r) => r[6]), ["Have ID", "Refused by parent", "Pending"]);
  assert.equal(I.exportRows("nope", [s]), null);
});

console.log(`\n${n} checks passed.`);
