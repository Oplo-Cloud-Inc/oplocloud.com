// The scheduler's and the attendance rate's rules, without a database.
//   node api/scripts/check-scheduler.mjs
import assert from "node:assert/strict";
import { analyze, build } from "../src/services/scheduler.js";
import { adaFor } from "../src/services/ada.js";

const subjects = [{ id: "alg", number: "ALG", title: "Algebra", capacity: 2 }, { id: "art", number: "ART", title: "Art", capacity: null },
                  { id: "his", number: "HIS", title: "History", capacity: 30 }];
const sec = (id, subjectId, periods, o = {}) => ({ id, subjectId, periods, students: [], capacity: null, ...o });
const R = (accountId, subjectId, rank = 1) => ({ accountId, subjectId, rank });

// ---- analyze
{
  const a = analyze({ subjects, sections: [sec("a1", "alg", ["1"]), sec("a2", "alg", ["2"])],
    requests: [R("s1", "alg"), R("s2", "alg"), R("s3", "alg"), R("s4", "alg"), R("s5", "alg"), R("s1", "his"), R("s2", "alg", 2)] });
  const alg = a.courses.find((c) => c.subjectId === "alg"), his = a.courses.find((c) => c.subjectId === "his");
  assert.deepEqual([alg.sections, alg.capacity, alg.planned, alg.asked, alg.flag], [2, 4, 5, 6, "short"]);   // two seats each, five wanting it; an alternate is asked, not planned
  assert.equal(his.flag, "none");                                                                          // asked for, offered nowhere
  assert.deepEqual(a.periods.map((p) => [p.period, p.sections, p.capacity]), [["1", 1, 2], ["2", 1, 2]]);
}

// ---- build: capacity, clashes, passes, alternates
{
  const sections = [sec("a1", "alg", ["1"]), sec("a2", "alg", ["2"]), sec("r1", "art", ["1"]), sec("r2", "art", ["3"])];
  const reqs = [R("s1", "alg"), R("s1", "art"), R("s2", "alg"), R("s3", "alg"), R("s4", "alg"), R("s4", "art", 2)];
  const out = build({ subjects, sections, requests: reqs });
  const seatOf = (a, subj) => (out.placed.find((p) => p.accountId === a && p.subjectId === subj) || {}).sectionId;
  // Algebra holds 2 per section: four students fill both sections, a fifth would not fit.
  assert.equal(Object.values(out.adds).flat().filter((x) => ["s1", "s2", "s3", "s4"].includes(x)).length >= 4, true);
  // s1 in algebra period 1 or 2 cannot also take the art section in the same period.
  const alg1 = seatOf("s1", "alg"), art1 = seatOf("s1", "art");
  const per = (id) => sections.find((s) => s.id === id).periods[0];
  assert.notEqual(per(alg1), per(art1), "no clash");
  // s4 had no art as a first choice: the alternate is used only if an algebra place failed, and there is one.
  assert.equal(out.unplaced.filter((u) => u.subjectId === "alg").length, 0);
  assert.equal(seatOf("s4", "art"), undefined, "an alternate is not seated when the first choice was");
}
{
  // a first choice that cannot be placed falls back to the alternate
  const sections = [sec("a1", "alg", ["1"], { capacity: 1, students: ["x"] }), sec("r1", "art", ["2"])];
  const out = build({ subjects, sections, requests: [R("s1", "alg"), R("s1", "art", 2)] });
  assert.equal(out.unplaced.length, 1);
  assert.match(out.unplaced[0].reason, /full/);
  assert.equal(out.placed.find((p) => p.subjectId === "art").sectionId, "r1");
}
{
  // already in a section of the course: not placed twice
  const sections = [sec("a1", "alg", ["1"], { students: ["s1"] }), sec("a2", "alg", ["2"])];
  const out = build({ subjects, sections, requests: [R("s1", "alg")] });
  assert.deepEqual(out.adds, {});
  assert.equal(out.placed[0].already, true);
}

// ---- average daily attendance
{
  const day = (d, minutes, minimum = false) => ({ day: d, minutes: new Map(Object.entries(minutes)), minimum });
  const kind = (s) => ({ here: "present", late: "tardy", exc: "excused", out: "absent" })[s];
  const sectionOf = new Map([["c1", ["1"]], ["c2", ["2"]], ["c3", ["3"]]]);
  const enrolled = new Map([["a", [{ courseId: "c1" }, { courseId: "c2" }, { courseId: "c3" }]], ["b", [{ courseId: "c1" }, { courseId: "c2" }, { courseId: "c3" }]]]);
  const marks = new Map([["a|c1|2031-03-03", "here"], ["a|c2|2031-03-03", "late"], ["a|c3|2031-03-03", "exc"],      // all day
                         ["b|c1|2031-03-03", "here"], ["b|c2|2031-03-03", "out"], ["b|c3|2031-03-03", "out"]]);     // one period of three
  const r = adaFor({ days: [day("2031-03-03", { 1: 60, 2: 60, 3: 60 })], sectionOf, enrolled, marks, kindOf: kind, full: 150, half: 60 });
  assert.deepEqual([r.days[0].enrolled, r.days[0].present], [2, 1.5]);        // a is a whole day (180 min, excused counts); b is a half (60 >= 60)
  assert.equal(r.total.ada, 75);
  // a minimum day: only 120 minutes exist, so a whole day is out of reach; being there for all of it is a half
  const m = adaFor({ days: [day("2031-03-03", { 1: 60, 2: 60 }, true)], sectionOf: new Map([["c1", ["1"]], ["c2", ["2"]]]),
    enrolled: new Map([["a", [{ courseId: "c1" }, { courseId: "c2" }]]]), marks: new Map([["a|c1|2031-03-03", "here"], ["a|c2|2031-03-03", "here"]]),
    kindOf: kind, full: 150, half: 200 });
  assert.equal(m.days[0].present, 0.5);
  // no minutes set: marked in anywhere is a whole day, and an unmarked day is not
  const f = adaFor({ days: [day("2031-03-03", {})], sectionOf: new Map(), enrolled: new Map([["a", [{ courseId: "c1" }]], ["b", [{ courseId: "c1" }]]]),
    marks: new Map([["a|c1|2031-03-03", "late"]]), kindOf: kind, full: null, half: null });
  assert.deepEqual([f.days[0].enrolled, f.days[0].present], [2, 1]);
  // a student who joined after the day is not in its count
  const j = adaFor({ days: [day("2031-03-03", { 1: 60 })], sectionOf: new Map([["c1", ["1"]]]),
    enrolled: new Map([["a", [{ courseId: "c1", joined: Date.parse("2031-03-10T00:00:00Z") }]], ["b", [{ courseId: "c1", joined: 0 }]]]),
    marks: new Map([["b|c1|2031-03-03", "here"]]), kindOf: kind, full: 50, half: null });
  assert.deepEqual([j.days[0].enrolled, j.days[0].present], [1, 1]);
}
console.log("scheduler: ok");
