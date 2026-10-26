// The route table, as the menu relies on it: node scripts/test-routes.mjs
//  - every old console page is claimed by exactly one tab, so nothing is reachable twice or not at all
//  - what a role cannot open is not in the menu; a module behind a flag is not in the menu
//  - an address parses to the screen it names and a screen's address parses back to it
//  - every module, tab and sub-tab has its words in the English pack, and the menu is the eleven modules and Admin
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const LEARN = path.resolve(new URL("../../learn", import.meta.url).pathname);
const win = {};
new Function("window", fs.readFileSync(path.join(LEARN, "shell/routes.js"), "utf8"))(win);
const R = win.OL.routes;
const packs = {};
const loader = { OL: { i18n: { add: (loc, pack) => { packs[loc] = pack; } } } };
for (const f of ["i18n/en-IN.js"]) new Function("window", "OL", fs.readFileSync(path.join(LEARN, f), "utf8"))(loader, loader.OL);

let n = 0, failed = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ok  " + name); } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").slice(0, 4).join("\n       ")); } };
const everything = () => true;
const keys = (m) => m.tabs.flatMap((x) => (x.subs ? x.subs.flatMap((s) => s.legacy) : x.legacy));

t("the menu is the eleven modules and Admin, in the brief's order, with Admin last", () => {
  const live = R.visible(everything).map((m) => m.key);
  assert.deepEqual(live, ["today", "students", "attendance", "academics", "exams", "wellbeing", "communicate", "staff", "campus", "insights", "admin"]);
  assert.equal(R.visible(everything).filter((m) => m.foot).map((m) => m.key).join(), "admin");
});

t("a module behind a flag (Fees, Documents, Messages…) is not drawn, and not reachable by its address", () => {
  assert.ok(!R.visible(everything).some((m) => m.key === "fees"));
  assert.ok(!R.visible(everything).find((m) => m.key === "students").tabs.some((x) => x.key === "documents"));
  assert.equal(R.front("fees", everything), null);
  assert.equal(R.legacyOf("students", "documents", null, everything), null);
  R.FLAGS.documents = true;
  assert.ok(R.visible(everything).find((m) => m.key === "students").tabs.some((x) => x.key === "documents"));
  R.FLAGS.documents = false;
});

t("no old page is claimed by two tabs", () => {
  const seen = new Map();
  for (const m of R.MODULES) for (const k of keys(m)) { assert.ok(!seen.has(k), `${k} is in ${seen.get(k)} and ${m.key}`); seen.set(k, m.key); }
  assert.ok(seen.size > 70, "the table covers the old console: " + seen.size + " pages");
});

t("an old page maps to the tab that now holds it, and the tab maps back to that page", () => {
  for (const m of R.MODULES) for (const x of m.tabs) {
    for (const s of x.subs || [x]) for (const k of s.legacy) {
      const at = R.locate(k);
      assert.equal(at.module, m.key, k); assert.equal(at.tab, x.key, k);
      if (x.subs) assert.equal(at.sub, s.key, k);
    }
  }
});

t("a role that may open only some pages sees only those modules and tabs, never a greyed row", () => {
  const registrar = (k) => ["enrollment", "students", "in-certs", "inbox"].includes(k);
  const v = R.visible(registrar);
  assert.deepEqual(v.map((m) => m.key), ["students", "communicate"]);
  assert.deepEqual(v[0].tabs.map((x) => x.key), ["directory", "admissions", "certificates"]);
  assert.equal(R.front("academics", registrar), null, "a module nobody here may open has no front door");
  assert.equal(R.front("students", registrar).tab, "directory");
});

t("a tab with sub-tabs shows only the ones this person may open; one left means no row of them and no segment in the address", () => {
  const one = (k) => k === "sc-sections";
  const timetable = R.visible(one).find((m) => m.key === "academics").tabs.find((x) => x.key === "timetable");
  assert.deepEqual(timetable.subs.map((s) => s.key), ["published"]);
  assert.equal(R.pathOf({ module: "academics", tab: "timetable", sub: "published" }, one), "academics/timetable");
  assert.equal(R.pathOf({ module: "academics", tab: "timetable", sub: "draft" }, everything), "academics/timetable/draft");
});

t("addresses: module/tab/sub/record/record-tab, with the filters after the ?", () => {
  const p = R.parse("students/directory/stu_123/attendance?class=X-C&status=absent", everything);
  assert.deepEqual([p.module, p.tab, p.sub, p.record, p.recordTab, p.query, p.legacy], ["students", "directory", null, "stu_123", "attendance", "class=X-C&status=absent", "students"]);
  const q = R.parse("academics/timetable/draft", everything);
  assert.deepEqual([q.module, q.tab, q.sub, q.record, q.legacy], ["academics", "timetable", "draft", null, "sc-plans"]);
  const w = R.parse("campus/facilities/orders/wo_7", everything);
  assert.deepEqual([w.sub, w.record, w.legacy], ["orders", "wo_7", "fx-orders"]);
  assert.equal(R.parse("", everything).module, null);
  assert.equal(R.parse("nonsense/x", everything).module, null);
  assert.equal(R.parse("STUDENTS/Directory", everything).tab, "directory", "case does not matter");
  assert.equal(R.parse("students/%E0%A4%85", everything).tab, null, "a decoded word that is no tab names no tab");
});

t("Admin is flat: /admin/security, not /admin/admin/security", () => {
  const p = R.parse("security", everything);
  assert.deepEqual([p.module, p.tab, p.legacy], ["admin", "security", "security"]);
  assert.equal(R.pathOf({ module: "admin", tab: "security" }, everything), "security");
  assert.equal(R.pathOf({ module: "admin", tab: "data", sub: "imports" }, everything), "data/imports");
  assert.equal(R.parse("data/imports", everything).legacy, "imports");
});

t("Today is one page: its address is just today", () => {
  assert.equal(R.pathOf({ module: "today", tab: "overview" }, everything), "today");
  assert.equal(R.parse("today", everything).legacy, "today");
});

t("a page reached from another page (aliases) lands on its owner, so the rail and breadcrumb are right", () => {
  assert.deepEqual(R.locate("roster"), { module: "exams", tab: "mark", sub: "course-marks" });
  assert.deepEqual(R.locate("people"), { module: "staff", tab: "directory", sub: null });
  assert.equal(R.locate("no-such-page"), null);
  assert.equal(R.pathForLegacy("in-register", everything), "attendance/registers");
});

t("the first page the person may open is the one a tab draws (a US school has gradebook where India has course marks)", () => {
  const us = (k) => k === "gradebook";
  assert.equal(R.legacyOf("exams", "mark", "course-marks", us), "gradebook");
  assert.equal(R.legacyOf("exams", "mark", "assessments", us), "gradebook", "a sub-tab nobody here may open falls back to the first one they may");
});

t("every module, tab and sub-tab has its English words, and nothing else is in the pack's menu keys", () => {
  const en = packs["en-IN"], want = new Set();
  for (const m of R.MODULES) {
    assert.ok(en.nav[m.key], "nav." + m.key); want.add("nav." + m.key);
    for (const x of m.tabs) {
      assert.ok(en.tab[m.key] && en.tab[m.key][x.key], `tab.${m.key}.${x.key}`);
      for (const s of x.subs || []) assert.ok(en.sub[m.key] && en.sub[m.key][x.key] && en.sub[m.key][x.key][s.key], `sub.${m.key}.${x.key}.${s.key}`);
    }
  }
  for (const m of Object.keys(en.tab)) for (const x of Object.keys(en.tab[m])) assert.ok(R.module(m).tabs.some((y) => y.key === x), `tab.${m}.${x} names no tab`);
});

console.log(`\n${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
