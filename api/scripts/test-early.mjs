// The early-warning list, with no database: node scripts/test-early.mjs
import assert from "node:assert/strict";
import * as E from "../src/services/early.js";
import * as R from "../src/services/register.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };

t("a class is a number, and below Class I is none", () => {
  assert.equal(E.classNumber("VIII"), 8); assert.equal(E.classNumber("I"), 1); assert.equal(E.classNumber("XII"), 12); assert.equal(E.classNumber("KG"), 0); assert.equal(E.classNumber("Nursery"), 0); assert.equal(E.classNumber("Banana"), null);
});
t("age is whole years on the day", () => { assert.equal(E.ageOn("2013-03-31", "2026-03-31"), 13); assert.equal(E.ageOn("2013-04-01", "2026-03-31"), 12); assert.equal(E.ageOn("x", "2026-03-31"), null); });
t("over-age is measured against the class, on 31 March of the session's year", () => {
  assert.equal(E.overAgeBy("2013-01-10", "VIII", 2026), 0);   // 13 in Class VIII: as usual
  assert.equal(E.overAgeBy("2011-01-10", "VIII", 2026), 2);   // 15 in Class VIII
  assert.equal(E.overAgeBy("2015-05-01", "VIII", 2026), 0);   // young for it is not a risk
  assert.equal(E.overAgeBy("2010-01-01", "KG", 2026), 0); assert.equal(E.overAgeBy(null, "X", 2026), 0);
});
t("the edges of the stages are where children are lost", () => { assert.equal(E.transitionOf("VIII"), "8→9"); assert.equal(E.transitionOf("X"), "10→11"); assert.equal(E.transitionOf("V"), "5→6"); assert.equal(E.transitionOf("IX"), null); });
const standing = (a, e, ab, rem) => R.standing({ attended: a, excused: e, absent: ab }, 75, rem);

t("a child who is fine has no signals and no level", () => {
  const r = E.assess({ standing: standing(38, 0, 2, 60), exams: [{ name: "T1", percent: 71, passLine: 33 }], facts: { dob: "2013-02-02", grade: "VIII" }, year: 2026 });
  assert.deepEqual([r.signals.length, r.score, r.level], [0, 0, "none"]);
});
t("falling under 75% is a high signal with its reason said", () => {
  const r = E.assess({ standing: standing(20, 0, 20, 30), exams: [], facts: { dob: "2013-02-02", grade: "IX" }, year: 2026 });
  assert.equal(r.signals[0].key, "attendance"); assert.match(r.signals[0].text, /50%, under 75%/); assert.ok(r.score >= 3); assert.ok(["medium", "high"].includes(r.level));
});
t("marks under the pass mark, or a fall of fifteen points, are told apart", () => {
  const fail = E.assess({ standing: null, exams: [{ name: "T1", percent: 60 }, { name: "T2", percent: 28 }], facts: {}, year: 2026 });
  assert.equal(fail.signals[0].key, "marks"); assert.equal(fail.score, 3);
  const fall = E.assess({ standing: null, exams: [{ name: "T1", percent: 80 }, { name: "T2", percent: 62 }], facts: {}, year: 2026 });
  assert.equal(fall.signals[0].key, "marks-fall"); assert.match(fall.signals[0].text, /18 points/);
  assert.equal(E.assess({ standing: null, exams: [{ name: "T1", percent: 80 }, { name: "T2", percent: 70 }], facts: {}, year: 2026 }).signals.length, 0);
  assert.equal(E.assess({ standing: null, exams: [{ name: "T1", percent: 40, passLine: 35 }], facts: {}, year: 2026 }).signals.length, 0, "a school's own pass line is honoured");
});
t("signals add up, and the edge of a stage adds a little only when there is already something", () => {
  const r = E.assess({ standing: standing(20, 0, 20, 30), exams: [{ name: "T1", percent: 25 }], facts: { dob: "2010-01-01", grade: "VIII", migrant: 1, cwsn: 0 }, year: 2026 });
  assert.equal(r.level, "high"); assert.ok(r.signals.some((s) => s.key === "over-age")); assert.ok(r.signals.some((s) => s.key === "migrant")); assert.equal(r.transition, "8→9"); assert.ok(r.signals.some((s) => s.key === "transition"));
  const quiet = E.assess({ standing: standing(40, 0, 0, 60), exams: [], facts: { dob: "2013-01-01", grade: "VIII" }, year: 2026 });
  assert.equal(quiet.score, 0); assert.equal(quiet.transition, "8→9"); assert.equal(quiet.signals.length, 0);
});
t("a few marked days say nothing yet: one absence on the first day is not 0%", () => {
  const early = E.assess({ standing: standing(0, 0, 2, 100), exams: [], facts: {}, year: 2026 });
  assert.equal(early.signals.length, 0); assert.equal(early.level, "none");
  assert.equal(E.assess({ standing: standing(0, 0, 2, 100), exams: [], facts: {}, year: 2026, minDays: 1 }).signals[0].key, "attendance", "a school may count sooner");
});
t("a child with nothing marked is not flagged for it", () => { assert.equal(E.assess({ standing: standing(0, 0, 0, 60), exams: [], facts: {}, year: 2026 }).level, "none"); });
console.log(n + " checks");
