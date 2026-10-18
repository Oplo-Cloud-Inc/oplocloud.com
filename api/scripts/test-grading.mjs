// Grading and the exam cycle, with no database: node scripts/test-grading.mjs
import assert from "node:assert/strict";
import * as G from "../src/services/grading.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const fail = (m, f) => { const e = new Error(m); e.field = f; throw e; };
const cbse = G.cleanScale(G.fromTemplate(G.TEMPLATES[0]), fail);
const paper = { subject: "Science", max_theory: 80, max_internal: 20, max_practical: 0 };

t("the CBSE template is a valid scale and reads the way the board's table does", () => {
  assert.equal(cbse.bands.length, 9); assert.equal(cbse.passPercent, 33);
  const g = (p) => G.bandFor(p, cbse.bands).grade;
  assert.equal(g(100), "A1"); assert.equal(g(91), "A1"); assert.equal(g(90.9), "A2"); assert.equal(g(81), "A2"); assert.equal(g(71), "B1"); assert.equal(g(33), "D");
  assert.equal(g(32.9), "E1"); assert.equal(g(21), "E1"); assert.equal(g(20), "E2"); assert.equal(g(0), "E2");
  assert.equal(G.bandFor(88, cbse.bands).point, 9);
});
t("a scale without bands is marks only", () => { assert.equal(G.bandFor(80, []), null); });
t("a scale is checked: bands must start at zero and not repeat", () => {
  assert.throws(() => G.cleanScale({ name: "x", bands: [{ min: 40, grade: "A" }] }, fail), (e) => e.field === "bands");
  assert.throws(() => G.cleanScale({ name: "x", bands: [{ min: 0, grade: "A" }, { min: 0, grade: "B" }] }, fail), (e) => e.field === "bands");
  assert.throws(() => G.cleanScale({ name: "", bands: [] }, fail), (e) => e.field === "name");
  assert.throws(() => G.cleanScale({ name: "x", passPercent: 120 }, fail), (e) => e.field === "passPercent");
  assert.throws(() => G.cleanScale({ name: "x", kind: "coscholastic", bands: [] }, fail), (e) => e.field === "bands");
  const s = G.cleanScale({ name: "ok", bands: [{ min: 0, grade: "F" }, { min: 50, grade: "P" }] }, fail);
  assert.deepEqual(s.bands.map((b) => b.grade), ["P", "F"], "highest first");
});
t("every template survives its own checks", () => { for (const tp of G.TEMPLATES) assert.ok(G.cleanScale(G.fromTemplate(tp), fail).name); });
t("marks are held to what the paper is out of", () => {
  assert.deepEqual(G.cleanMark(paper, { theory: "72.5", internal: 18 }, fail), { absent: 0, theory: 72.5, internal: 18, practical: null });
  assert.throws(() => G.cleanMark(paper, { theory: 81 }, fail), (e) => e.field === "theory");
  assert.throws(() => G.cleanMark(paper, { internal: -1 }, fail), (e) => e.field === "internal");
  assert.throws(() => G.cleanMark(paper, { theory: "abc" }, fail), (e) => e.field === "theory");
  assert.deepEqual(G.cleanMark(paper, { theory: 50, absent: true }, fail), { absent: 1, theory: null, internal: null, practical: null }, "absent clears the marks");
});
t("a line is theory plus internal out of the paper, graded and judged against the pass line", () => {
  const l = G.lineOf(paper, { theory: 70, internal: 18 }, cbse);
  assert.equal(l.total, 88); assert.equal(l.percent, 88); assert.equal(l.grade, "A2"); assert.equal(l.point, 9); assert.equal(l.pass, true);
  const f = G.lineOf(paper, { theory: 20, internal: 5 }, cbse); assert.equal(f.grade, "E1"); assert.equal(f.pass, false);
  const edge = G.lineOf(paper, { theory: 26.4, internal: 6.6 }, cbse); assert.equal(edge.total, 33); assert.equal(edge.pass, true); assert.equal(edge.grade, "D");
});
t("half a paper is not a score, an absentee is AB, and no row is missing", () => {
  const half = G.lineOf(paper, { theory: 70, internal: null }, cbse); assert.equal(half.missing, true); assert.equal(half.total, null);
  const ab = G.lineOf(paper, { absent: 1 }, cbse); assert.equal(ab.grade, "AB"); assert.equal(ab.pass, false);
  assert.equal(G.lineOf(paper, null, cbse).missing, true);
});
t("a scale with no pass line draws none", () => {
  const s = G.cleanScale(G.fromTemplate(G.TEMPLATES[1]), fail); s.passPercent = null;
  assert.equal(G.lineOf(paper, { theory: 5, internal: 1 }, s).pass, null);
});
t("a card adds the subjects up, names what failed, and waits for what is missing", () => {
  const maths = { subject: "Maths", max_theory: 80, max_internal: 20, max_practical: 0 };
  const lines = [G.lineOf(paper, { theory: 70, internal: 18 }, cbse), G.lineOf(maths, { theory: 20, internal: 5 }, cbse)];
  const c = G.cardOf(lines, cbse);
  assert.equal(c.total, 113); assert.equal(c.max, 200); assert.equal(c.percent, 56.5); assert.equal(c.grade, "C1"); assert.deepEqual(c.failed, ["Maths"]); assert.equal(c.result, "fail");
  const ok = G.cardOf([lines[0]], cbse); assert.equal(ok.result, "pass");
  const inc = G.cardOf([lines[0], G.lineOf(maths, null, cbse)], cbse); assert.equal(inc.result, "incomplete"); assert.deepEqual(inc.incomplete, ["Maths"]);
  assert.equal(G.cardOf([], cbse).result, "none");
});
t("a paper moves forward one step at a time and can be sent back until it is published", () => {
  assert.ok(G.canMove("entry", "submitted")); assert.ok(G.canMove("submitted", "checked")); assert.ok(G.canMove("checked", "approved")); assert.ok(G.canMove("approved", "published"));
  assert.ok(!G.canMove("entry", "checked")); assert.ok(!G.canMove("entry", "published")); assert.ok(!G.canMove("checked", "submitted"));
  assert.ok(G.canMove("submitted", "entry")); assert.ok(G.canMove("approved", "entry")); assert.ok(!G.canMove("published", "entry")); assert.ok(!G.canMove("entry", "entry"));
});
console.log(n + " checks");
