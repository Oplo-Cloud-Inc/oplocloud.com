// The facilities rules, tested without a server: node scripts/test-facilities.mjs
import assert from "node:assert/strict";
import * as F from "../src/services/facilities.js";

let n = 0;
const test = (name, fn) => { const r = fn(); if (r && r.then) { pending.push(r.then(() => { n++; console.log("  ok  " + name); })); return; } n++; console.log("  ok  " + name); };
const pending = [];

/* ---- how an order moves */
test("a request waits, is accepted, worked and finished; nothing is deleted", () => {
  assert.equal(F.moveTo("pending", "approve"), "open");
  assert.equal(F.moveTo("open", "start"), "in_progress");
  assert.equal(F.moveTo("in_progress", "hold"), "on_hold");
  assert.equal(F.moveTo("on_hold", "start"), "in_progress");
  assert.equal(F.moveTo("in_progress", "complete"), "done");
  assert.equal(F.moveTo("done", "reopen"), "open");
  assert.equal(F.moveTo("pending", "decline"), "declined");
  assert.equal(F.moveTo("declined", "reconsider"), "pending");
});
test("a step that makes no sense from where the order is is refused", () => {
  assert.equal(F.moveTo("done", "start"), null);
  assert.equal(F.moveTo("pending", "start"), null);        // accept it first
  assert.equal(F.moveTo("open", "approve"), null);
  assert.equal(F.moveTo("cancelled", "complete"), null);
  assert.equal(F.moveTo("open", "nonsense"), null);
});

/* ---- checklists */
test("a checklist keeps its questions and takes answers", () => {
  const list = F.normaliseChecklist([{ text: "Lamps on", type: "check" }, { text: "Exit clear", type: "pass_fail" }, { text: "Anything odd?", type: "note" }]);
  assert.deepEqual(list.map((x) => x.id), ["1", "2", "3"]);
  assert.equal(F.unfinished(list).length, 2);                // the note never blocks
  const a = F.answerChecklist(list, [{ id: "1", done: true }, { id: "2", result: "fail", note: "Bin in the way" }, { id: "9", done: true }]);
  assert.equal(F.unfinished(a).length, 0);
  assert.equal(F.failed(a).length, 1);
  assert.equal(a[1].onFail, true);                           // a failed line raises an order unless told not to
  assert.equal(a.length, 3);                                 // an answer cannot add a question
});
test("a bad checklist is refused", () => {
  assert.throws(() => F.normaliseChecklist([{ text: " " }]));
  assert.throws(() => F.normaliseChecklist("nope"));
  assert.throws(() => F.normaliseChecklist(Array.from({ length: 61 }, () => ({ text: "x" }))));
});

/* ---- recurrence */
test("a month is a month", () => {
  assert.equal(F.addInterval("2026-01-31", 1, "month"), "2026-02-28");
  assert.equal(F.addInterval("2024-01-31", 1, "month"), "2024-02-29");
  assert.equal(F.addInterval("2026-11-30", 3, "month"), "2027-02-28");
  assert.equal(F.addInterval("2026-10-12", 1, "year"), "2027-10-12");
  assert.equal(F.addInterval("2026-10-12", 2, "week"), "2026-10-26");
  assert.equal(F.addInterval("2026-10-30", 3, "day"), "2026-11-02");
});
const PERIODS = [{ starts_on: "2026-09-08", ends_on: "2026-12-18" }, { starts_on: "2027-01-05", ends_on: "2027-06-25" }];
test("a break moves the job to the day term starts; no periods, no breaks", () => {
  assert.equal(F.outOfBreak("2026-12-25", PERIODS), "2027-01-05");
  assert.equal(F.outOfBreak("2026-10-01", PERIODS), "2026-10-01");
  assert.equal(F.outOfBreak("2027-07-10", PERIODS), "2027-07-10");   // after the last term there is nothing to move to
  assert.equal(F.outOfBreak("2026-12-25", []), "2026-12-25");
});
const S = (o = {}) => ({ active: 1, every: 1, unit: "month", next_due_on: "2026-10-15", lead_days: 0, from_completion: 0, skip_if_open: 1, skip_breaks: 0, ends_on: null, ...o });
test("a job is written when it falls due, and the next date follows from the due date", () => {
  assert.equal(F.plan(S(), "2026-10-14").create, false);
  const p = F.plan(S(), "2026-10-15");
  assert.equal(p.create, true); assert.equal(p.dueOn, "2026-10-15"); assert.equal(p.next, "2026-11-15");
});
test("lead days open the window early", () => {
  assert.equal(F.plan(S({ lead_days: 7 }), "2026-10-08").create, true);
  assert.equal(F.plan(S({ lead_days: 7 }), "2026-10-07").create, false);
});
test("a job left unfinished is not duplicated; stacking is a choice", () => {
  const w = F.plan(S(), "2026-10-20", { hasOpen: true });
  assert.equal(w.create, false); assert.equal(w.waiting, true);
  assert.equal(F.plan(S({ skip_if_open: 0 }), "2026-10-20", { hasOpen: true }).create, true);
});
test("a school that did not look for a quarter gets one overdue order, not three", () => {
  const p = F.plan(S({ every: 1, unit: "month", next_due_on: "2026-07-15" }), "2026-10-20");
  assert.equal(p.create, true); assert.equal(p.dueOn, "2026-07-15"); assert.equal(p.next, "2026-11-15");
});
test("from completion has no next date until somebody finishes the job", () => {
  const p = F.plan(S({ from_completion: 1 }), "2026-10-15");
  assert.equal(p.create, true); assert.equal(p.next, null);
  assert.equal(F.afterCompletion(S({ from_completion: 1 }), "2026-10-20").next, "2026-11-20");
  assert.equal(F.afterCompletion(S(), "2026-10-20").next, undefined);   // a fixed schedule does not move
});
test("a schedule that skips breaks lands on term start; one that has ended stops", () => {
  const p = F.plan(S({ next_due_on: "2026-12-15", skip_breaks: 1 }), "2026-12-15", { periods: PERIODS });
  assert.equal(p.next, "2027-01-15");
  const q = F.plan(S({ next_due_on: "2026-11-20", skip_breaks: 1, every: 1, unit: "month" }), "2026-11-20", { periods: PERIODS });
  assert.equal(q.next, "2027-01-05");                                  // 20 Dec is in the break
  assert.equal(F.plan(S({ next_due_on: "2026-11-01", ends_on: "2026-10-31" }), "2026-11-01").finished, true);
  assert.equal(F.plan(S({ active: 0 }), "2026-10-15").create, false);
  assert.equal(F.plan(S({ next_due_on: null }), "2026-10-15").create, false);
});

/* ---- bookings */
const NOW = { day: "2026-10-12", time: "09:00" };
test("a room's own rules say why a booking cannot be made", () => {
  const rules = { opens: "08:00", closes: "18:00", days: [1, 2, 3, 4, 5], noticeHours: 24, maxMinutes: 120, daysAhead: 60, blocked: ["2026-10-20"] };
  const ok = { day: "2026-10-15", starts: "10:00", ends: "11:00" };
  assert.deepEqual(F.bookingProblems(rules, ok, NOW), []);
  assert.ok(F.bookingProblems(rules, { ...ok, starts: "07:00" }, NOW)[0].includes("08:00"));
  assert.ok(F.bookingProblems(rules, { ...ok, starts: "10:00", ends: "13:00" }, NOW).some((m) => m.includes("120")));
  assert.ok(F.bookingProblems(rules, { ...ok, day: "2026-10-17" }, NOW).some((m) => m.includes("day of the week")));   // a Saturday
  assert.ok(F.bookingProblems(rules, { ...ok, day: "2026-10-20" }, NOW).some((m) => m.includes("blocked")));
  assert.ok(F.bookingProblems(rules, { ...ok, day: "2026-10-12", starts: "09:30", ends: "10:00" }, NOW).some((m) => m.includes("notice")));
  assert.ok(F.bookingProblems(rules, { ...ok, day: "2026-12-30" }, NOW).some((m) => m.includes("60 days")));
  assert.ok(F.bookingProblems(rules, { ...ok, day: "2026-10-01" }, NOW).some((m) => m.includes("passed")));
  assert.ok(F.bookingProblems(rules, { ...ok, attendees: 40 }, NOW, { capacity: 30 }).some((m) => m.includes("holds 30")));
  assert.ok(F.bookingProblems(rules, { ...ok, ends: "09:00" }, NOW).some((m) => m.includes("end after")));
});
test("two holds collide, and the buffer widens the gap that is needed", () => {
  const a = { day: "2026-10-15", starts: "10:00", ends: "11:00" };
  assert.equal(F.clash(a, { day: "2026-10-15", starts: "10:30", ends: "11:30" }), true);
  assert.equal(F.clash(a, { day: "2026-10-15", starts: "11:00", ends: "12:00" }), false);       // back to back is allowed
  assert.equal(F.clash(a, { day: "2026-10-15", starts: "11:00", ends: "12:00" }, 15), true);     // not with a buffer
  assert.equal(F.clash(a, { day: "2026-10-16", starts: "10:00", ends: "11:00" }), false);
});
test("a series is the same time on a rhythm, bounded", () => {
  const rules = { days: [1, 2, 3, 4, 5] };
  assert.deepEqual(F.expandSeries({ day: "2026-10-12", repeat: "weekly", count: 3 }, rules), ["2026-10-12", "2026-10-19", "2026-10-26"]);
  assert.deepEqual(F.expandSeries({ day: "2026-10-12", repeat: "biweekly", count: 2 }, rules), ["2026-10-12", "2026-10-26"]);
  assert.deepEqual(F.expandSeries({ day: "2026-10-15", repeat: "daily", count: 4 }, rules), ["2026-10-15", "2026-10-16", "2026-10-19", "2026-10-20"]);  // not a weekend
  assert.deepEqual(F.expandSeries({ day: "2026-10-12", repeat: "weekly", count: 10, until: "2026-10-20" }, rules), ["2026-10-12", "2026-10-19"]);
  assert.equal(F.expandSeries({ day: "2026-10-12", repeat: "weekly", count: 9999 }, rules).length, 52);
  assert.deepEqual(F.expandSeries({ day: "2026-10-12" }, rules), ["2026-10-12"]);
});
test("rules are repaired on read and refused on write", () => {
  assert.equal(F.normaliseRules({ opens: "nope", daysAhead: -4 }).opens, "07:00");
  assert.throws(() => F.normaliseRules({ opens: "9am" }, { strict: true }));
  assert.throws(() => F.normaliseRules({ opens: "18:00", closes: "08:00" }, { strict: true }));
  assert.throws(() => F.normaliseRules({ days: [] }, { strict: true }));
  assert.deepEqual(F.normaliseRules({ blocked: ["2026-12-25", "junk", "2026-12-25"] }).blocked, ["2026-12-25"]);
});
test("a run of rooms is named in order and cannot run away", () => {
  assert.deepEqual(F.expandRange({ prefix: "Room ", from: 101, to: 103 }), ["Room 101", "Room 102", "Room 103"]);
  assert.throws(() => F.expandRange({ prefix: "R", from: 5, to: 2 }));
  assert.throws(() => F.expandRange({ prefix: "R", from: 1, to: 500 }));
});

/* ---- documents and vendors */
test("a paper is ok, soon, expired or has no date", () => {
  assert.equal(F.expiryState(null, "2026-10-12"), "none");
  assert.equal(F.expiryState("2026-10-11", "2026-10-12"), "expired");
  assert.equal(F.expiryState("2026-10-12", "2026-10-12"), "soon");
  assert.equal(F.expiryState("2026-11-11", "2026-10-12"), "soon");
  assert.equal(F.expiryState("2026-11-12", "2026-10-12"), "ok");
});
test("a vendor is only as current as the papers it was asked for", () => {
  const docs = [{ id: "d1", kind: "Insurance certificate", expires_on: "2026-12-01" }, { id: "d2", kind: "insurance certificate", expires_on: "2026-10-01" },
                { id: "d3", kind: "Licence", expires_on: "2026-10-30" }, { id: "d4", kind: "Licence", expires_on: "2020-01-01", archived_at: 1 }];
  const s = F.vendorStanding(["Insurance certificate", "Licence", "Safeguarding letter"], docs, "2026-10-12");
  assert.equal(s.list[0].state, "ok");                       // the newest paper counts, not the stale one
  assert.equal(s.list[0].documentId, "d1");
  assert.equal(s.list[1].state, "soon");
  assert.equal(s.list[2].state, "missing");
  assert.equal(s.state, "attention");
  assert.equal(F.vendorStanding([], [], "2026-10-12").state, "ok");
});

/* ---- counts */
test("a count says what was found, what is missing, and what is somewhere else", () => {
  const inRoom = [{ code: "A1" }, { code: "A2" }, { code: "A3" }];
  const known = new Map([["B9", { code: "B9", space: "Room 7" }]]);
  const r = F.reconcile(inRoom, ["A1", "A3", "B9", "ZZ"], known);
  assert.deepEqual(r.found.map((a) => a.code), ["A1", "A3"]);
  assert.deepEqual(r.missing.map((a) => a.code), ["A2"]);
  assert.deepEqual(r.elsewhere.map((a) => a.code), ["B9"]);
  assert.deepEqual(r.unknown, ["ZZ"]);
});

/* ---- the report */
test("the report counts what was made and what was finished, by week", () => {
  const D = (s) => Date.parse(s + "T12:00:00Z");
  const rows = [
    { created_at: D("2026-10-05"), status: "done", completed_at: D("2026-10-07"), kind: "request", category: "it", priority: "normal", space_name: "Room 1", minutes: 30, due_on: null },
    { created_at: D("2026-10-06"), status: "open", due_on: "2026-10-08", kind: "request", category: "maintenance", priority: "high", space_name: "Room 1" },
    { created_at: D("2026-10-13"), status: "declined", kind: "request", category: "maintenance", priority: "low", space_name: "Room 2" },
    { created_at: D("2026-09-01"), status: "done", completed_at: D("2026-10-08"), kind: "preventive", category: "maintenance", priority: "normal", due_on: "2026-10-08", minutes: 45 },
    { created_at: D("2026-09-01"), status: "done", completed_at: D("2026-10-09"), kind: "preventive", category: "maintenance", priority: "normal", due_on: "2026-10-08", minutes: 15 }
  ];
  const r = F.buildReport(rows, { from: "2026-10-01", to: "2026-10-31", today: "2026-10-12" });
  assert.equal(r.created, 3); assert.equal(r.done, 3);
  assert.equal(r.declined, 1); assert.equal(r.overdue, 1); assert.equal(r.open, 1);
  assert.equal(r.minutesSpent, 90);
  assert.deepEqual(r.preventive, { done: 2, onTime: 1, pct: 50 });
  assert.equal(r.byRoom[0].name, "Room 1");
  assert.deepEqual(r.weeks, [{ week: "2026-10-05", created: 2, done: 3 }, { week: "2026-10-12", created: 1, done: 0 }]);
});

/* ---- the starter checks */
test("every starter check says where it came from and how firm that was", () => {
  const ids = new Set();
  for (const c of F.STARTER_CHECKS) {
    assert.ok(!ids.has(c.id), "duplicate " + c.id); ids.add(c.id);
    assert.ok(["US", "UK", "IN", "ANY"].includes(c.country), c.id);
    assert.ok(["primary", "snippet", "practice"].includes(c.quality), c.id);
    assert.ok(F.UNITS.includes(c.unit) && c.every >= 1, c.id);
    assert.ok(c.authority && c.source && c.title, c.id);
    assert.ok(F.CATEGORIES.includes(c.category), c.id);
  }
  assert.ok(F.STARTER_CHECKS.length >= 20);
});

/* ---- the repository */
test("no method in the repository is defined twice (the later one silently replaces the earlier)", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../src/repo/d1.js", import.meta.url), "utf8");
  const names = [...src.matchAll(/^  (?:async )?([A-Za-z_]+)\(/gm)].map((m) => m[1]);
  const dup = names.filter((x, i) => names.indexOf(x) !== i);
  assert.deepEqual(dup, []);
});

/* ---- the QR code (every version was also decoded by a real reader when this was written) */
test("a QR code lands on the version the standard's capacity table says, at both levels", async () => {
  await import("../../learn/qr.js");
  const Q = globalThis.OPLO_QR;
  const size = (n, lv) => Q.matrix("x".repeat(n), lv).length;
  const v = (n) => n * 4 + 17;
  // [bytes that exactly fit, version]  — one more byte must move up a version
  for (const [n, ver] of [[14, 1], [26, 2], [213, 10], [331, 13], [666, 20], [2331, 40]]) {
    assert.equal(size(n, "M"), v(ver), `M ${n}`);
    if (ver < 40) assert.equal(size(n + 1, "M"), v(ver + 1), `M ${n + 1}`);
  }
  for (const [n, ver] of [[17, 1], [321, 11], [1273, 25], [2953, 40]]) {
    assert.equal(size(n, "L"), v(ver), `L ${n}`);
    if (ver < 40) assert.equal(size(n + 1, "L"), v(ver + 1), `L ${n + 1}`);
  }
  assert.throws(() => Q.matrix("x".repeat(3000), "L"));
  assert.ok(Q.svg("https://example.org/?r=1").startsWith("<svg"));
});

await Promise.all(pending);
console.log(`\n${n} passed`);
