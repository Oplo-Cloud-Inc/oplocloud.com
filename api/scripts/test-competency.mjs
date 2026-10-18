// Competencies, with no database: node scripts/test-competency.mjs
import assert from "node:assert/strict";
import * as C from "../src/services/competency.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const fail = (m, f) => { const e = new Error(m); e.field = f; throw e; };

t("a class belongs to a stage the way NEP 2020 draws them", () => {
  assert.equal(C.stageOf("KG"), "foundational"); assert.equal(C.stageOf("Nursery"), "foundational"); assert.equal(C.stageOf("II"), "foundational");
  assert.equal(C.stageOf("III"), "preparatory"); assert.equal(C.stageOf("V"), "preparatory"); assert.equal(C.stageOf("VI"), "middle"); assert.equal(C.stageOf("VIII"), "middle");
  assert.equal(C.stageOf("IX"), "secondary"); assert.equal(C.stageOf("XII"), "secondary"); assert.equal(C.stageOf("Banana"), null);
});
t("the share at grade level counts proficient and advanced, of those rated", () => {
  const s = C.summarise([1, 2, 3, 3, 4, 4, 4, 2]);
  assert.deepEqual([s.rated, s.atLevel, s.percent], [8, 5, 62.5]); assert.deepEqual(s.by, { 1: 1, 2: 2, 3: 2, 4: 3 });
  assert.equal(C.summarise([]).percent, null); assert.equal(C.summarise([1, 2]).percent, 0);
  assert.equal(C.summarise([2, 3, 4], 2).percent, 100, "a school may draw the line lower");
});
t("what the next teacher is handed is each skill still below grade level at its latest term", () => {
  const rows = [{ competency_id: "c1", term: "1", level: 2 }, { competency_id: "c1", term: "2", level: 3 }, { competency_id: "c2", term: "1", level: 3 }, { competency_id: "c2", term: "2", level: 2 }, { competency_id: "c3", term: "1", level: 1 }];
  assert.deepEqual(C.carryOver(rows).map((r) => r.competency_id).sort(), ["c2", "c3"]);
});
t("a level is 1 to 4 and nothing else", () => {
  assert.equal(C.cleanLevel("3", fail), 3);
  for (const bad of [0, 5, 2.5, "x", null]) assert.throws(() => C.cleanLevel(bad, fail), (e) => e.field === "level");
  assert.equal(C.levelName(3), "Proficient"); assert.equal(C.levelName(9), "");
});
console.log(n + " checks");
