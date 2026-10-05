// The grade engine's rules, checked by hand-worked examples.
//   node api/scripts/check-grades.mjs
import assert from "node:assert/strict";
import { computeGrade, coursePolicy, letterFor, classSignal, assignedTo } from "../src/services/grades.js";

const W = [["Homework", 40], ["Test", 60]];
const row = (id, category, score, outOf, extra = {}) => ({
  assignment_id: id, account_id: "s1", category, score, out_of: outOf, status: "marked",
  title: id, due_at: 0, work_created_at: 0, ...extra });
const course = (body) => ({ id: "c1", body_json: JSON.stringify(body) });

// As it always was: 8/10 homework, 70/100 test → .8×40 + .7×60 = 74.
const plain = [row("h1", "Homework", 8, 10), row("t1", "Test", 70, 100)];
let g = computeGrade(plain, W, coursePolicy(course({})));
assert.equal(g.percent, 74); assert.equal(g.letter, "C");

// A course's own scale.
g = computeGrade(plain, W, coursePolicy(course({ scale: [[90, "4"], [75, "3"], [60, "2"], [0, "1"]] })));
assert.equal(g.letter, "2");
assert.equal(letterFor(59.9, [[60, "P"], [0, "F"]]), "F");

// A minimum score: a missing test counts as 50, not 0 → .8×40 + .5×60 = 62.
const missed = [row("h1", "Homework", 8, 10), row("t1", "Test", null, 100, { status: "missing" })];
assert.equal(computeGrade(missed, W, coursePolicy(course({}))).percent, 32);
g = computeGrade(missed, W, coursePolicy(course({ minScore: 50 })));
assert.equal(g.percent, 62); assert.equal(g.flooredCount, 1);

// Grading periods: Q1 = 80 (weight 40), Q2 = 60 (weight 60) → 68. Work dated
// before the first period counts in the first.
const terms = [{ name: "Q1", from: 1000, weight: 40 }, { name: "Q2", from: 2000, weight: 60 }];
const dated = [row("a", "Test", 80, 100, { due_at: 500 }), row("b", "Test", 60, 100, { due_at: 2500 })];
g = computeGrade(dated, W, coursePolicy(course({ terms })));
assert.equal(g.percent, 68);
assert.deepEqual(g.terms.map((t) => t.percent), [80, 60]);
// A period with nothing marked is left out, not counted as zero.
assert.equal(computeGrade([dated[0]], W, coursePolicy(course({ terms }))).percent, 80);

// Overrides: a set percent, a raise, a mark with nothing marked.
const ov = (body) => coursePolicy(course({}), [{ doc_id: "s1", body_json: JSON.stringify(body) }]);
g = computeGrade(plain, W, ov({ percent: 90 }));
assert.equal(g.percent, 90); assert.equal(g.letter, "A-"); assert.equal(g.override.computed, 74);
assert.equal(computeGrade(plain, W, ov({ adjust: 5 })).percent, 79);
g = computeGrade(plain, W, ov({ mark: "INC" }));
assert.equal(g.letter, "INC"); assert.equal(g.percent, 74);
assert.equal(computeGrade([], W, ov({ mark: "INC" }), "s1"), null);        // a mark needs a percent under it
assert.equal(computeGrade([], W, ov({ mark: "W", percent: 0 }), "s1").letter, "W");
assert.equal(computeGrade(plain, W, ov({ percent: 90 }), "someone-else").percent, 74);
assert.equal(computeGrade([], W, ov({}), "s1"), null);

// Work set for some students is not owed by the others.
const a = { id: "x", out_of: 10, due_at: 1, details_json: JSON.stringify({ assignees: ["s1"] }) };
assert.equal(assignedTo(a, "s2"), false);
const sig = classSignal({ students: [{ id: "s1" }, { id: "s2" }], assignments: [a], byPair: new Map() });
assert.equal(sig.columns[0].unmarked, 1);

console.log("grades: ok");
