// The route table, as the menu relies on it: node scripts/test-routes.mjs
//  - every old console page is claimed by exactly one tab, so nothing is reachable twice or not at all
//  - what a role cannot open is not in the menu; a module behind a flag is not in the menu
//  - an address parses to the screen it names and a screen's address parses back to it
//  - every section, page and view has its words in the English pack, and the menu is the seven sections and Admin tools, two levels deep,
//    with no word twice; every page of the old console is reachable, and a page that is promised and not built says "Coming soon"
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

/* The old console's own tree (ADMIN_TREE in app.js): what it lists, and which of it a school in each country has. */
const TREE = (() => {
  const src = fs.readFileSync(path.join(LEARN, "app.js"), "utf8"), from = src.indexOf("var ADMIN_TREE = [") + "var ADMIN_TREE = ".length;
  return new Function("return " + src.slice(from, src.indexOf("\n  ];", from) + 4))();
})();
const regionHas = (t, r) => (!t.only || t.only === r) && !(t.not && t.not.indexOf(r) > -1);
const keysOf = (r) => new Set(TREE.filter((g) => regionHas(g, r)).flatMap((g) => (g.kids ? g.kids.filter((c) => regionHas(c, r)) : [g]).map((c) => c.k)));
const keys = (m) => m.tabs.flatMap((x) => (x.subs ? x.subs.flatMap((s) => s.legacy) : x.legacy));

t("the menu is seven sections and one Admin tools entry, in that order, with Admin tools last at the foot", () => {
  const live = R.visible(everything).map((m) => m.key);
  assert.deepEqual(live, ["today", "students", "attendance", "exams", "timetable", "people", "office", "admin"]);
  assert.equal(R.visible(everything).filter((m) => m.foot).map((m) => m.key).join(), "admin");
  const en = packs["en-IN"].nav;
  assert.deepEqual(live.map((k) => en[k]), ["Today", "Students", "Attendance", "Exams and marks", "Timetable", "People and messages", "School office", "Admin tools"]);
});

t("each section holds the pages the proposal names, under the words it uses", () => {
  const en = packs["en-IN"], words = (k) => R.module(k).tabs.map((x) => en.tab[k][x.key]);
  const has = (k, list) => { const w = words(k); for (const x of list) assert.ok(w.includes(x), `${k} has no "${x}": ${w.join(", ")}`); };
  has("students", ["Directory", "Classes", "Admissions", "Families", "Health", "Documents", "Certificates"]);
  has("attendance", ["Registers", "Low attendance", "Condonation", "Change log"]);
  has("exams", ["Exams", "Assessments", "Marks", "Grading scales", "Competencies", "Report cards"]);
  has("timetable", ["School days", "Bell schedule", "Subjects", "Timetable", "Future plans"]);
  has("people", ["Teachers", "Leave", "Cover", "Departments", "Circulars", "Events", "Messages"]);
  has("office", ["Fees", "Transport", "Library", "Facilities", "Equipment"]);
  has("admin", ["Analytics", "Reports", "Data center", "Security", "Audit log", "Settings"]);
});

t("the menu is two levels deep, a row of views holds at most seven, and no word is used twice", () => {
  const en = packs["en-IN"], seen = new Map();
  const use = (word, where) => {
    // a section and its own page may share a name (Timetable, Today): they are one step in the path back up
    const key = word.toLowerCase();
    if (seen.has(key) && !(seen.get(key).endsWith("/") && where.startsWith(seen.get(key)))) assert.fail(`"${word}" is ${seen.get(key)} and ${where}`);
    seen.set(key, where);
  };
  for (const m of R.MODULES) {
    use(en.nav[m.key], m.key + "/");
    for (const x of m.tabs) {
      if (!m.solo) use(en.tab[m.key][x.key], `${m.key}/${x.key}`);
      assert.ok(!(x.subs || []).some((s) => s.subs), `${m.key}/${x.key} has a third level`);
      assert.ok((x.subs || []).length <= 8, `${m.key}/${x.key} has ${(x.subs || []).length} views`);
      // a view a flag hides is not in the row, so the row that is drawn counts
      for (const s of x.subs || []) use(en.sub[m.key][x.key][s.key], `${m.key}/${x.key}/${s.key}`);
    }
  }
  // what a school draws: an Indian school's pages, a US school's pages (everything at once is neither)
  for (const region of ["IN", "US"]) {
    const has = keysOf(region);
    for (const m of R.visible((k) => has.has(k))) for (const x of m.tabs) assert.ok(x.subs.length <= 7, `${region}: ${m.key}/${x.key} draws ${x.subs.length} views`);
  }
});

t("Admin tools keys are not the key of a section, so its flat addresses cannot be read as a section", () => {
  const sections = new Set(R.MODULES.filter((m) => !m.flat).map((m) => m.key));
  for (const x of R.module("admin").tabs) assert.ok(!sections.has(x.key), `/admin/${x.key} would be a section`);
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

t("a page behind a flag (Documents…) is not a link in the menu, and not reachable by its address", () => {
  assert.ok(!R.visible(everything).find((m) => m.key === "students").tabs.some((x) => x.key === "documents"));
  assert.equal(R.legacyOf("students", "documents", null, everything), null);
  assert.equal(R.parse("students/documents", everything).legacy, null);
  R.FLAGS.documents = true;
  assert.ok(R.visible(everything).find((m) => m.key === "students").tabs.some((x) => x.key === "documents"));
  R.FLAGS.documents = false;
});

t("a page that is promised and not built is a row that says Coming soon, for an administrator, at the end of its section, and never a link", () => {
  const rows = (v) => v.filter((m) => m.soon.length).map((m) => [m.key, m.soon.map((x) => x.key)]);
  assert.deepEqual(rows(R.visible(everything)), [["exams", ["standards"]], ["people", ["messages"]], ["office", ["fees"]], ["admin", ["sftp"]]]);
  assert.deepEqual(rows(R.visible((k) => k !== "@soon")), [], "someone who is not asked as an administrator is shown no promises");
  assert.ok(R.visible(everything).every((m) => !m.tabs.some((x) => m.soon.some((y) => y.key === x.key))), "a promised page is not also a page");
  for (const [k, x] of [["office", "fees"], ["people", "messages"], ["exams", "standards"], ["admin", "sftp"]]) {
    assert.equal(R.legacyOf(k, x, null, everything), null, `${k}/${x} opens nothing`);
    assert.equal(R.parse(k === "admin" ? x : `${k}/${x}`, everything).legacy, null, `${k}/${x} has no address`);
  }
  // the day the page ships its flag goes true and it takes the row's place
  R.FLAGS.sftp = true;
  const admin = R.visible(everything).find((m) => m.key === "admin");
  assert.ok(admin.tabs.some((x) => x.key === "sftp") && !admin.soon.length);
  assert.equal(R.parse("sftp", everything).legacy, "sftp");
  R.FLAGS.sftp = false;
});

t("every page of the old console is reachable from the new menu, and the menu names no page the old console lacks", () => {
  const old = new Set([...keysOf("IN"), ...keysOf("US")]);
  assert.ok(old.size > 70, "read the old tree: " + old.size);
  const here = new Set(R.MODULES.flatMap(keys));
  for (const k of old) assert.ok(here.has(k) || R.ALIASES[k], `${k} is in the old console and nowhere in the menu`);
  // Modules (O8) and the invitation sheets exist only in the frame
  for (const k of here) assert.ok(old.has(k) || ["modules", "invite-sheets"].includes(k), `${k} is in the menu and not in the old console`);
});

/* Students › Families › Invite sheets belongs to the Family module. Homework has no page yet, so the day its page ships is played
   by giving its tab one, for as long as a test needs it. */
const invites = (v) => { const g = v.find((m) => m.key === "students").tabs.find((x) => x.key === "families"); return g.subs.some((s) => s.key === "invites"); };
const homework = () => R.visible(everything).find((m) => m.key === "timetable").tabs.some((x) => x.key === "homework");
const hwTab = R.module("timetable").tabs.find((x) => x.key === "homework");
const reset = () => { R.FLAGS.family = false; R.FLAGS.homework = false; hwTab.legacy = []; R.setSchool(null); };

t("a school with Family and a school without it (O8): the flag is the hard off-switch and the school's switch is its own say", () => {
  reset(); hwTab.legacy = ["homework-diary"];
  assert.ok(!invites(R.visible(everything)) && !homework(), "nothing is on before the school has said anything");
  R.setSchool({ modules: { family: true, homework: true }, frame: true });
  assert.ok(!invites(R.visible(everything)) && !homework(), "a module that is not built cannot be turned on from a school's settings");
  R.FLAGS.family = true; R.FLAGS.homework = true;
  assert.ok(invites(R.visible(everything)) && homework(), "built and switched on: the school has it");
  assert.equal(R.legacyOf("students", "families", "invites", everything), "invite-sheets");
  assert.equal(R.pathOf({ module: "students", tab: "families", sub: "invites" }, everything), "students/families/invites");
  R.setSchool({ modules: { family: false, homework: false }, frame: true });
  assert.ok(!invites(R.visible(everything)) && !homework(), "built and not switched on: the school does not have it");
  assert.equal(R.legacyOf("students", "families", "invites", everything), "guardians", "its address falls back to the tab's first page");
  assert.equal(R.pathOf({ module: "students", tab: "families", sub: "list" }, everything), "students/families", "one page left, so no sub-tab segment");
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
  assert.deepEqual(v.map((m) => m.key), ["students", "people"]);
  assert.deepEqual(v[0].tabs.map((x) => x.key), ["directory", "admissions", "certificates"]);
  assert.ok(v.every((m) => !m.soon.length), "a clerk is shown no promises");
  assert.equal(R.front("timetable", registrar), null, "a section nobody here may open has no front door");
  assert.equal(R.front("students", registrar).tab, "directory");
});

t("a tab with sub-tabs shows only the ones this person may open; one left means no row of them and no segment in the address", () => {
  const one = (k) => k === "in-classes";
  const classes = R.visible(one).find((m) => m.key === "students").tabs.find((x) => x.key === "classes");
  assert.deepEqual(classes.subs.map((s) => s.key), ["sections"]);
  assert.equal(R.pathOf({ module: "students", tab: "classes", sub: "sections" }, one), "students/classes");
  assert.equal(R.pathOf({ module: "students", tab: "classes", sub: "lists" }, everything), "students/classes/lists");
});

t("addresses: module/tab/sub/record/record-tab, with the filters after the ?", () => {
  const p = R.parse("students/directory/stu_123/attendance?class=X-C&status=absent", everything);
  assert.deepEqual([p.module, p.tab, p.sub, p.record, p.recordTab, p.query, p.legacy], ["students", "directory", null, "stu_123", "attendance", "class=X-C&status=absent", "students"]);
  const q = R.parse("students/classes/lists", everything);
  assert.deepEqual([q.module, q.tab, q.sub, q.record, q.legacy], ["students", "classes", "lists", null, "rosters"]);
  const w = R.parse("office/facilities/orders/wo_7", everything);
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
  assert.equal(R.parse("analytics/growth", everything).legacy, "growth", "Analytics and Reports are Admin tools, so their addresses are flat too");
  assert.equal(R.parse("reports/builder", everything).legacy, "builder");
  assert.equal(R.pathOf({ module: "admin", tab: "audit-log" }, everything), "audit-log");
  assert.equal(R.pathOf({ module: "admin", tab: "settings", sub: "general" }, (k) => k === "system"), "settings", "a person who may open only General has no sub-tab segment");
});

t("Today is one page: its address is just today", () => {
  assert.equal(R.pathOf({ module: "today", tab: "overview" }, everything), "today");
  assert.equal(R.parse("today", everything).legacy, "today");
});

t("a page reached from another page (aliases) lands on its owner, so the rail and breadcrumb are right", () => {
  assert.deepEqual(R.locate("roster"), { module: "exams", tab: "marks", sub: null, alias: true });
  assert.deepEqual(R.locate("people"), { module: "people", tab: "teachers", sub: null, alias: true });
  assert.deepEqual(R.locate("missing"), { module: "students", tab: "support", sub: "needs-attention", alias: true });
  assert.deepEqual(R.locate("gradebook"), { module: "exams", tab: "marks", sub: null }, "a page of its own is not an alias");
  assert.equal(R.locate("no-such-page"), null);
  assert.equal(R.pathForLegacy("in-register", everything), "attendance/registers");
});

t("the first page the person may open is the one a tab draws (a US school has gradebook where India has course marks)", () => {
  const us = (k) => k === "gradebook" || k === "support";
  assert.equal(R.legacyOf("exams", "marks", null, us), "gradebook");
  assert.equal(R.legacyOf("students", "support", "early-warning", us), "support", "a view nobody here may open falls back to the first one they may");
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
