// The route table, as the menu relies on it: node scripts/test-routes.mjs
//  - every old console page is claimed by exactly one tab, so nothing is reachable twice or not at all
//  - what a role cannot open is not in the menu; a module behind a flag is not in the menu
//  - an address parses to the screen it names and a screen's address parses back to it
//  - every module, tab and sub-tab has its words in the English pack, and the menu is the eleven modules and Admin
//  - a school's own switches (Family, Fees, Homework, Lesson plans, Messages) and the global flags both have to be on (O8)
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as P from "../src/services/profile.js";

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

t("every module states its phone answer (D11): phone pages for the jobs done away from a desk, or cards", () => {
  for (const m of R.MODULES) {
    assert.ok(m.phone === "page" || m.phone === "cards", `${m.key} has no phone answer`);
    if (m.phone === "cards") assert.ok(!m.phonePages, `${m.key} is cards, so it names no phone pages`);
    else {
      assert.ok(m.phonePages && m.phonePages.length, `${m.key} is "page" and names no tab with one`);
      for (const k of m.phonePages) assert.ok(m.tabs.some((x) => x.key === k), `${m.key}.phonePages names ${k}, which is no tab of ${m.key}`);
    }
  }
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

/* Students › Guardians › Invite sheets belongs to the Family module. Homework has no page yet, so the day its page ships is played
   by giving its tab one, for as long as a test needs it. */
const invites = (v) => { const g = v.find((m) => m.key === "students").tabs.find((x) => x.key === "guardians"); return g.subs.some((s) => s.key === "invites"); };
const homework = () => R.visible(everything).find((m) => m.key === "academics").tabs.some((x) => x.key === "homework");
const hwTab = R.module("academics").tabs.find((x) => x.key === "homework");
const reset = () => { R.FLAGS.family = false; R.FLAGS.homework = false; hwTab.legacy = []; R.setSchool(null); };

t("a school with Family and a school without it (O8): the flag is the hard off-switch and the school's switch is its own say", () => {
  reset(); hwTab.legacy = ["homework-diary"];
  assert.ok(!invites(R.visible(everything)) && !homework(), "nothing is on before the school has said anything");
  R.setSchool({ modules: { family: true, homework: true }, frame: true });
  assert.ok(!invites(R.visible(everything)) && !homework(), "a module that is not built cannot be turned on from a school's settings");
  R.FLAGS.family = true; R.FLAGS.homework = true;
  assert.ok(invites(R.visible(everything)) && homework(), "built and switched on: the school has it");
  assert.equal(R.legacyOf("students", "guardians", "invites", everything), "invite-sheets");
  assert.equal(R.pathOf({ module: "students", tab: "guardians", sub: "invites" }, everything), "students/guardians/invites");
  R.setSchool({ modules: { family: false, homework: false }, frame: true });
  assert.ok(!invites(R.visible(everything)) && !homework(), "built and not switched on: the school does not have it");
  assert.equal(R.legacyOf("students", "guardians", "invites", everything), "guardians", "its address falls back to the tab's first page");
  assert.equal(R.pathOf({ module: "students", tab: "guardians", sub: "list" }, everything), "students/guardians", "one page left, so no sub-tab segment");
  R.setSchool({ modules: { family: true }, frame: true });
  assert.ok(invites(R.visible(everything)) && !homework(), "one module on does not turn on another");
  reset();
});

t("a flag that is not a school switch (Documents) is the flag alone, whatever the school says", () => {
  R.setSchool({ modules: {}, frame: true });
  R.FLAGS.documents = true;
  assert.ok(R.visible(everything).find((m) => m.key === "students").tabs.some((x) => x.key === "documents"));
  R.FLAGS.documents = false; reset();
});

t("the school's switches are the server's, and each one gates something in the table", () => {
  assert.deepEqual(R.SWITCHES, P.MODULES, "routes.js SWITCHES and services/profile.js MODULES are the same five names in the same order");
  const flagged = new Set(), walk = (o) => { if (o.flag) flagged.add(o.flag); (o.tabs || o.subs || []).forEach(walk); };
  R.MODULES.forEach(walk);
  for (const k of R.SWITCHES) assert.ok(k in R.FLAGS && flagged.has(k), `${k} is a school switch and nothing in the table is behind it`);
});

t("the new frame is on until a school turns it off, and the school's answer is the profile's", () => {
  assert.equal(R.frame(), true);
  R.setSchool({ modules: {}, frame: false }); assert.equal(R.frame(), false);
  R.setSchool(P.profileOf({ region: "IN", modules: '{"frame":false,"family":true}' })); assert.deepEqual([R.frame(), R.visible(everything).length > 0], [false, true]);
  R.setSchool(P.profileOf({ region: "IN" })); assert.equal(R.frame(), true);
  reset();
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
  assert.equal(R.pathOf({ module: "admin", tab: "settings", sub: "modules" }, everything), "settings/modules");
  assert.equal(R.parse("settings/modules", everything).legacy, "modules");
  assert.equal(R.pathOf({ module: "admin", tab: "settings", sub: "general" }, (k) => k === "system"), "settings", "a person who may open only General has no sub-tab segment");
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
