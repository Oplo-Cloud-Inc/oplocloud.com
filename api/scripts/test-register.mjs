// The class register and the 75% rule, with no database: node scripts/test-register.mjs
import assert from "node:assert/strict";
import * as R from "../src/services/register.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };

t("a child's standing is the share of marked days they were there", () => {
  const s = R.standing({ attended: 30, excused: 4, absent: 6 }, 75, 0);
  assert.equal(s.total, 40); assert.equal(s.percent, 75); assert.equal(s.status, "watch");   // exactly 75 and nothing left to spare
  assert.equal(R.standing({ attended: 29, excused: 4, absent: 7 }, 75, 0).status, "below");
});
t("a child with no marked days has no standing, not a zero", () => {
  const s = R.standing({}, 75, 20); assert.equal(s.status, "none"); assert.equal(s.percent, null);
});
t("the days a child can still miss depend on the days left", () => {
  // 40 days so far, 36 attended (90%); 60 days to go: the year is 100 days, 75 needed, 36 + 60 - 75 = 21 can be missed
  const s = R.standing({ attended: 36, excused: 0, absent: 4 }, 75, 60);
  assert.equal(s.canMiss, 21); assert.equal(s.status, "ok"); assert.equal(s.mustAttend, 39);
  // the same 90% with 10 days left in a 50-day year: need 38 (ceil of 37.5); 36 + 10 - 38 = 8
  assert.equal(R.standing({ attended: 36, excused: 0, absent: 4 }, 75, 10).canMiss, 8);
});
t("above the line today can still be a child who will not make it", () => {
  // 20 of 24 days (83.3%) with 4 days left: need ceil(.75*28)=21; 20+4-21 = 3 -> on watch, recoverable
  const w = R.standing({ attended: 20, excused: 0, absent: 4 }, 75, 4); assert.equal(w.status, "watch"); assert.equal(w.canMiss, 3); assert.ok(w.recoverable);
  // 15 of 24 (62.5%), 4 days left: need 21; 15+4-21 = -2 -> below and cannot recover
  const b = R.standing({ attended: 15, excused: 0, absent: 9 }, 75, 4); assert.equal(b.status, "below"); assert.equal(b.canMiss, -2); assert.equal(b.recoverable, false);
});
t("leave days that a board might condone are told apart", () => {
  const s = R.standing({ attended: 28, excused: 5, absent: 7 }, 75, 0);   // 70% now, 82.5% with leave
  assert.equal(s.percent, 70); assert.equal(s.percentWithLeave, 82.5); assert.equal(s.condonable, true);
  assert.equal(R.standing({ attended: 28, excused: 1, absent: 11 }, 75, 0).condonable, false);
});
t("a different threshold is honoured", () => { assert.equal(R.standing({ attended: 70, absent: 30 }, 75, 0).status, "below"); assert.equal(R.standing({ attended: 70, absent: 30 }, 60, 0).status, "ok"); });
t("the school year spans from its first month to the day before the next", () => {
  assert.deepEqual(R.yearSpan("2026-10-18", 4), { from: "2026-04-01", to: "2027-03-31" });
  assert.deepEqual(R.yearSpan("2027-02-01", 4), { from: "2026-04-01", to: "2027-03-31" });
  assert.deepEqual(R.yearSpan("2026-10-18", 8), { from: "2026-08-01", to: "2027-07-31" });
  assert.deepEqual(R.yearSpan("2026-10-18", 1), { from: "2026-01-01", to: "2026-12-31" });
});
t("marks are tallied by what the school's codes count them as", () => {
  const rows = [{ account_id: "a", status: "present", n: 10 }, { account_id: "a", status: "late", n: 2 }, { account_id: "a", status: "excused", n: 3 }, { account_id: "a", status: "absent", n: 1 }, { account_id: "a", status: "mystery", n: 1 }];
  assert.deepEqual(R.tally(rows, R.IN_CODES).get("a"), { attended: 12, excused: 3, absent: 2 });
});
t("a locked span is found by day", () => {
  const locks = [{ from_day: "2026-04-01", to_day: "2026-12-31", label: "x" }];
  assert.equal(R.lockedBy(locks, "2026-12-31").label, "x"); assert.equal(R.lockedBy(locks, "2027-01-01"), null);
});
console.log(n + " checks");
