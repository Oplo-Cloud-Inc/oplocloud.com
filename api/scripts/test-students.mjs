// Students, driven like a person drives them: node scripts/test-students.mjs
// Signs a school administrator in on the local stack and uses the real app in Chromium: the Directory (search,
// chips, sort, pages, the address as the state), the quick look, the record page and its tabs, a guardian's
// number shown only when asked, the add and edit form with its refusals, and axe on each, in light and dark.
// Local only. Needs the static server and the API running, and an existing administrator:
//   ORIGIN=http://localhost:8153 API=http://localhost:8817/api/v1 CRED=/path/cred.json node scripts/test-students.mjs
// (CRED is {"email": …, "password": …}.) SHOTS=/some/folder also saves a screenshot of each screen.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ORIGIN = process.env.ORIGIN || "http://localhost:8153";
const API = process.env.API || "http://localhost:8817/api/v1";
const SHOTS = process.env.SHOTS || "";
if (!process.env.CRED) { console.error("CRED=/path/to/cred.json (an administrator's email and password) is needed"); process.exit(2); }
const cred = JSON.parse(fs.readFileSync(process.env.CRED, "utf8"));
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const require = createRequire(import.meta.url);
function findPlaywright() {
  try { return require("playwright-core"); } catch { /* not installed here: try PW_DIR, then the npx cache */ }
  const found = [process.env.PW_DIR];
  const npx = path.join(os.homedir(), ".npm", "_npx");
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) found.push(path.join(npx, d, "node_modules", "playwright-core"));
  for (const p of found) if (p && fs.existsSync(path.join(p, "package.json"))) return require(p);
  console.error("playwright-core not found. Run npm install in api/, or set PW_DIR=/path/to/playwright-core");
  process.exit(2);
}
let AXE = "";
try { AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); } catch { console.error("axe-core not installed: run npm install in api/"); process.exit(2); }
const { chromium } = findPlaywright();
function findChrome() {
  const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  if (!fs.existsSync(cache)) return undefined;
  for (const d of fs.readdirSync(cache).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = path.join(cache, d, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing");
    if (fs.existsSync(p)) return p;
  }
}
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || findChrome() });

let n = 0, failed = 0;
const RUN = Date.now().toString(36);
async function t(name, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 } });
  const login = await ctx.request.post(API + "/auth/login", { data: { email: opts.email || cred.email, password: opts.password || cred.password }, headers: { origin: ORIGIN } });
  assert.ok(login.ok(), "signs in: " + login.status());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text() + (m.location().url || ""))) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (opts.noPhone) await page.addInitScript(() => { Object.defineProperty(window, "OPLO_PHONE", { configurable: true, get() { return undefined; }, set() { /* the phone interface is not wanted here */ } }); });
  try {
    await page.goto(ORIGIN + "/learn/admin/" + (opts.at || "students/directory"));
    await page.waitForSelector(opts.ready || ".ol-students-dir tr.ol-tr", { timeout: 20000 });
    await fn(page, ctx);
    assert.deepEqual(errors, [], "no page errors");
    n++; console.log("  ok  " + name);
  } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").slice(0, 8).join("\n       ")); }
  await ctx.close();
}
const settle = (page) => page.waitForTimeout(300);
const at = async (label, promise) => { try { return await promise; } catch (e) { e.message = label + ": " + e.message; throw e; } };
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + ".png") }); };
const axe = async (page, include) => {
  await page.evaluate(AXE);
  return page.evaluate(async (inc) => (await window.axe.run({ include: inc }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations
    .map((v) => v.id + ": " + v.nodes.map((x) => x.target.join(" ") + " [" + (x.any[0] && x.any[0].message || "").slice(0, 90) + "]").slice(0, 3).join(" | ")), include);
};
const theme = async (page, name) => { await page.getByRole("button", { name: /Account menu for/ }).click(); await page.getByRole("menuitemradio", { name }).click(); await settle(page); };
const rows = (page) => page.locator(".ol-students-dir tr.ol-tr");
/* The list has drawn the server's latest answer: no skeleton and rows in place. Used after an action that asked for one. */
const loaded = (page) => page.waitForFunction(() => !document.querySelector(".ol-students-dir .ol-skel") && document.querySelector(".ol-students-dir tr.ol-tr"));
const ask = (page, has) => page.waitForResponse((r) => r.request().method() === "GET" && /\/directory\/students(\?|$)/.test(r.url()) && has.every((x) => r.url().includes(x)));
const nameOn = (page, name) => page.waitForFunction((n) => [...document.querySelectorAll(".ol-students-dir .ol-students-name__n")].some((e) => e.textContent === n), name);

/* What the school holds, read the way the app reads it (as the administrator). */
const admin = await browser.newContext();
const call = async (method, p, data) => {
  const r = await admin.request.fetch(API + p, { method, data, headers: { origin: ORIGIN } });
  return { status: r.status(), body: await r.json().catch(() => null) };
};
{ const l = await admin.request.post(API + "/auth/login", { data: { email: cred.email, password: cred.password }, headers: { origin: ORIGIN } }); assert.ok(l.ok(), "the administrator signs in"); }
const everyone = (await call("GET", "/directory/students?size=100&sort=name")).body;
assert.ok(everyone.total >= 5, "the school has students to look at: " + everyone.total);
const known = everyone.rows.find((r) => r.admissionNo) || everyone.rows[0];

await t("the Directory is one page in the frame: its own heading, one primary button, the numbers, a search, filters and a page of rows", async (page) => {
  assert.match(page.url(), /\/learn\/admin\/students\/directory$/);
  assert.equal(await page.locator(".ol-students-dir h1").innerText(), "Directory");
  assert.equal(await page.locator(".ol-students-dir .ol-ph__actions .ol-btn--primary").count(), 1, "exactly one primary action");
  assert.equal(await page.locator(".ol-students-dir .ol-ph__actions .ol-btn--primary").innerText(), "Add student");
  assert.equal(await page.locator(".ol-students-dir .ol-kpis > *").count(), 5, "five numbers, each a filter");
  assert.ok((await rows(page).count()) > 0 && (await rows(page).count()) <= 50, "at most fifty rows: " + await rows(page).count());
  assert.match(await page.locator(".ol-students-dir .ol-ph__sub").innerText(), /^[\d,]+ students in [\d,]+ sections$/);
  assert.match(await page.locator(".ol-students-dir .ol-pager").innerText(), /1–\d+ of [\d,]+/);
  assert.equal(await page.title(), "Directory · OEdu");
  assert.equal(await page.locator(".ol-students-dir.ol-t2").count(), 1, "the page is drawn on the T2 shell");
  await shot(page, "directory-1440-light");
});

await t("selecting rows raises the bulk bar, and for someone who may write it offers both actions (the bar is built once the first answer says so)", async (page) => {
  await page.locator(".ol-students-dir tbody input[type=checkbox]").first().check();
  const bar = page.locator(".ol-students-dir .ol-bulk");
  await bar.waitFor({ state: "visible" });
  assert.deepEqual(await bar.getByRole("button").allInnerTexts(), ["Message families", "Set house"]);
  assert.match(await bar.innerText(), /1 selected/);
});

await t("search and a chip write the address, a reload restores them, and Clear filters empties both", async (page) => {
  const stem = known.name.split(" ")[0].slice(0, 5);
  const all = (await call("GET", "/directory/students?size=100")).body.total;
  await Promise.all([ask(page, ["q=" + stem]), page.getByRole("searchbox", { name: "Search students" }).fill(stem)]);
  await page.waitForURL((u) => u.searchParams.get("q") === stem);
  await nameOn(page, known.name);
  const found = (await call("GET", "/directory/students?q=" + stem)).body.total;
  assert.match(await page.locator(".ol-students-dir .ol-pager").innerText(), new RegExp("of " + found + "$|of " + found + "\\b"), "the page says how many the search found");
  await page.reload(); await page.waitForSelector(".ol-students-dir tr.ol-tr");
  assert.equal(await page.getByRole("searchbox", { name: "Search students" }).inputValue(), stem, "the search survives a reload");
  await nameOn(page, known.name);
  await Promise.all([ask(page, []), page.getByRole("button", { name: "Clear filters" }).click()]);
  await page.waitForURL((u) => !u.searchParams.has("q"));
  assert.equal(await page.getByRole("searchbox", { name: "Search students" }).inputValue(), "");
  assert.ok(all >= found);
});

await t("sorting by a heading and paging write the address; the first page of a sorted list is the first page", async (page) => {
  const order = async (q) => (await call("GET", "/directory/students?" + q)).body.rows.map((r) => r.name);
  await Promise.all([ask(page, ["sort=name"]), page.locator(".ol-students-dir th", { hasText: "Name" }).getByRole("button").click()]);
  await page.waitForURL((u) => u.searchParams.get("sort") === "name");
  const asc = await order("sort=name");
  await nameOn(page, asc[0]);
  assert.deepEqual(await page.locator(".ol-students-dir .ol-students-name__n").allInnerTexts(), asc, "the page shows the server's order");
  assert.deepEqual(asc, [...asc].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base", numeric: true })), "which is ascending by name");
  await Promise.all([ask(page, ["sort=name", "dir=desc"]), page.locator(".ol-students-dir th", { hasText: "Name" }).getByRole("button").click()]);
  await page.waitForURL((u) => u.searchParams.get("dir") === "desc");
  const desc = await order("sort=name&dir=desc");
  await nameOn(page, desc[0]);
  assert.deepEqual(await page.locator(".ol-students-dir .ol-students-name__n").allInnerTexts(), desc, "and descending the other way");
  if (everyone.total > 50) {
    await Promise.all([ask(page, ["page=2"]), page.getByRole("button", { name: "Page 2" }).click()]);
    await page.waitForURL((u) => u.searchParams.get("page") === "2");
    const second = await order("sort=name&dir=desc&page=2");
    await nameOn(page, second[0]);
    assert.match(await page.locator(".ol-students-dir .ol-pager").innerText(), /51–/);
  }
});

await t("a row opens the quick look beside the list; the arrows step through the page; Esc closes it and takes it out of the address", async (page) => {
  await rows(page).first().click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.waitFor();
  await page.waitForURL((u) => !!u.searchParams.get("peek"));
  await page.waitForFunction(() => document.querySelector(".ol-drawer.is-open .ol-students-peek"));
  const first = await drawer.locator(".ol-drawer__title").innerText();
  assert.ok(await drawer.locator(".ol-kpis").count(), "the three numbers are in it");
  await settle(page); await shot(page, "quicklook-1440-light");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction((was) => document.querySelector(".ol-drawer__title").textContent !== was, first);
  await page.keyboard.press("Escape");
  await drawer.waitFor({ state: "hidden" });
  assert.ok(!new URL(page.url()).searchParams.has("peek"), "the address is clean again");
});

await t("a peek in the address opens the quick look on arrival", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/directory?peek=" + known.id);
  await page.locator(".ol-drawer.is-open .ol-students-peek").waitFor();
  assert.equal(await page.locator(".ol-drawer__title").innerText(), known.name);
});

await t("the name is a link to the whole record: a page with an address, its tabs, a header and a Back to the list as it was", async (page) => {
  const stem = known.name.split(" ")[0].slice(0, 5);
  await Promise.all([ask(page, ["q=" + stem]), page.getByRole("searchbox", { name: "Search students" }).fill(stem)]);
  await at("the search is in the address", page.waitForURL((u) => u.searchParams.get("q") === stem));
  await nameOn(page, known.name);
  await page.locator(`tr[data-k="${known.id}"] a.ol-students-name`).click();
  await at("the record opens", page.waitForURL(new RegExp("/students/directory/" + known.id + "$")));
  await page.waitForFunction((n) => { const h = document.querySelector(".ol-students-rec h1"); return h && h.textContent === n; }, known.name);
  assert.deepEqual(await page.locator(".ol-students-rec [role=tab]").allInnerTexts(), ["Overview", "Attendance", "Marks", "Family", "Government records", "Activity"]);
  assert.equal(await page.title(), known.name + " · OEdu");
  await page.getByRole("tab", { name: "Attendance" }).click();
  await at("the tab is in the address", page.waitForURL(/\/attendance$/));
  assert.equal(await page.locator(".ol-students-rec [role=tab][aria-selected=true]").innerText(), "Attendance");
  await page.reload(); await page.locator(".ol-students-rec h1").waitFor();
  assert.equal(await page.locator(".ol-students-rec [role=tab][aria-selected=true]").innerText(), "Attendance", "a refresh lands on the same tab");
  await page.locator(".ol-students-rec .ol-ph__back").click();
  await at("Back returns to the filtered list: " + page.url(), page.waitForURL((u) => u.pathname.endsWith("/students/directory") && u.searchParams.get("q") === stem));
  assert.equal(await page.getByRole("searchbox", { name: "Search students" }).inputValue(), stem, "Back to the list keeps the filter");
  await shot(page, "record-1440-light");
});

/* A student with a number on file, found the way the app finds one. */
let withPhone = null;
for (const r of everyone.rows.slice(0, 40)) {
  const rec = (await call("GET", "/directory/students/" + r.id)).body;
  if (rec && rec.contacts.some((c) => c.hasPhone)) { withPhone = { id: r.id, name: r.name, which: rec.contacts.find((c) => c.hasPhone).which }; break; }
}
assert.ok(withPhone, "a student with a guardian's number is in the first forty");

await t("a guardian's number is hidden until asked for; asking shows it, offers Call, and the audit log says who asked", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/directory/" + withPhone.id + "/family");
  await page.locator(".ol-students-contact").first().waitFor();
  const num = page.locator(".ol-students-contact__num").first();
  assert.match(await num.innerText(), /^•+\d{4}$/, "masked on arrival");
  const before = (await call("GET", `/audit?record=${withPhone.id}&action=students.guardian.phone_revealed`)).body.total;
  await page.getByRole("button", { name: "Show number" }).first().click();
  await page.waitForFunction(() => !/•/.test(document.querySelector(".ol-students-contact__num").textContent));
  assert.match(await num.innerText(), /\d/);
  assert.ok(await page.getByRole("link", { name: "Call" }).first().getAttribute("href").then((h) => /^tel:\d{10,12}$/.test(h)), "a Call link");
  const after = (await call("GET", `/audit?record=${withPhone.id}&action=students.guardian.phone_revealed`)).body;
  assert.equal(after.total, before + 1, "one more row in the log");
  assert.equal(after.events[0].actor.name.length > 0, true);
  assert.ok(!JSON.stringify(after).includes((await num.innerText()).replace(/\D/g, "").slice(-10)), "the log does not hold the number");
});

const made = { name: `Zq${RUN} Newcomer`, email: `zq.${RUN}@students.test`, adm: `ZQ-${RUN.toUpperCase()}` };
await t("Add student: the form asks for a name and an email, refuses a taken admission number beside its field, and a good one lands on the record", async (page) => {
  await page.getByRole("button", { name: "Add student" }).first().click();
  await page.waitForURL(/\/students\/directory\/new$/);
  await page.locator(".ol-students-formpage").waitFor();
  assert.equal(await page.locator(".ol-students-formpage h1").innerText(), "Add student");
  await page.getByRole("button", { name: "Add student" }).last().click();
  await page.getByText("Enter the student's full name.").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.name), "name", "focus goes to the field that is wrong");
  await page.getByLabel("Full name").fill(made.name);
  await page.getByLabel("Email", { exact: true }).fill(made.email);
  await page.getByLabel("Admission number").fill(known.admissionNo || "NOPE");
  await page.getByRole("button", { name: "Add student" }).last().click();
  await page.getByText(/Another student already has that admission number/).waitFor();
  assert.match(page.url(), /\/directory\/new$/, "still on the form");
  const mid = (await call("GET", "/accounts")).body.accounts.filter((a) => a.email === made.email).length;
  assert.equal(mid, 0, "the refusal left no account behind");
  await page.getByLabel("Admission number").fill(made.adm);
  await page.getByRole("button", { name: "Add student" }).last().click();
  await page.waitForURL(/\/students\/directory\/acc_[0-9a-f]+$/);
  await page.waitForFunction((n) => { const h = document.querySelector(".ol-students-rec h1"); return h && h.textContent === n; }, made.name);
  const log = (await call("GET", "/audit?action=students.record.created&size=1")).body;
  assert.equal(log.events[0].record.label.startsWith(made.name), true, "the creation is in the log");
  made.id = page.url().split("/").pop();
});

await t("Edit: only what was changed is saved, the record shows it, and the Activity tab says what it was and what it is", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id + "/edit");
  await page.locator(".ol-students-formpage").waitFor();
  await page.waitForFunction((n) => document.querySelector(".ol-students-formpage h1").textContent === "Edit " + n, made.name);
  await page.getByLabel("House").fill("Jal");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(new RegExp("/students/directory/" + made.id + "$"));
  await page.getByRole("tab", { name: "Activity" }).click();
  await page.locator(".ol-students-timeline__i").first().waitFor();
  const text = await page.locator(".ol-students-timeline").innerText();
  assert.match(text, /changed House/);
  assert.match(text, /Not set\s*→\s*Jal/);
  assert.match(text, /added this student/);
});

await t("leaving the form with unsaved changes asks first, and Keep editing stays on the form", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id + "/edit");
  await page.locator(".ol-students-formpage").waitFor();
  await page.getByLabel("House").fill("Vayu");
  await page.getByRole("button", { name: "Cancel" }).click();
  const ask = page.getByRole("alertdialog");
  await ask.waitFor();
  assert.match(await ask.innerText(), /Discard changes\?/);
  await page.keyboard.press("Escape");
  await ask.waitFor({ state: "hidden" });
  assert.match(page.url(), /\/edit$/, "the form is still open");
  assert.equal(await page.getByLabel("House").inputValue(), "Vayu", "and nothing was lost");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Discard changes" }).click();
  await page.waitForURL(new RegExp("/students/directory/" + made.id + "$"));
});

/* ---------------------------------------------------------------------------------------------- Classes */
const sections = async () => (await call("GET", "/india/classes")).body.classes;
const cls = { grade: "XI", a: "K" + RUN.slice(-2).toUpperCase(), b: "L" + RUN.slice(-2).toUpperCase() };
const rowsOf = (page) => page.locator(".ol-students-cls tr.ol-tr");
const inClasses = { at: "students/classes/sections", ready: ".ol-students-cls tr.ol-tr" };

await t("Classes: one list of every section: its own heading, one primary button, four numbers, a search, a year switch, stage chips and a row for each section", async (page) => {
  const all = await sections();
  assert.match(page.url(), /\/learn\/admin\/students\/classes\/sections$/);
  assert.equal(await page.locator(".ol-students-cls h1").innerText(), "Classes");
  assert.equal(await page.locator(".ol-students-cls .ol-ph__actions .ol-btn--primary").innerText(), "Add class");
  assert.equal(await page.locator(".ol-students-cls .ol-kpis > *").count(), 4);
  assert.equal(await rowsOf(page).count(), Math.min(all.length, 50), "a row for each section");
  assert.equal(await page.getByRole("radiogroup", { name: "School year" }).getByRole("radio").count(), 3);
  assert.ok((await page.locator(".ol-students-cls .ol-t2__chips button").count()) >= 2, "All and at least one stage");
  assert.equal(await page.title(), "Classes · OEdu");
  await settle(page); await shot(page, "classes-1440-light");
}, inClasses);

await t("Classes: search and a number write the address, a reload restores them, Clear filters resets, and the year switch changes the year", async (page) => {
  const all = await sections(), withTeacher = all.find((c) => c.classTeacher);
  const stem = withTeacher.classTeacher.name.split(" ")[0];
  await page.getByRole("searchbox", { name: "Search sections" }).fill(stem);
  await page.waitForURL((u) => u.searchParams.get("q") === stem);
  const found = all.filter((c) => [c.label, c.programme, c.stream, c.room, c.classTeacher && c.classTeacher.name].filter(Boolean).join(" ").toLowerCase().includes(stem.toLowerCase()));
  await page.waitForFunction((n) => document.querySelectorAll(".ol-students-cls tr.ol-tr").length === n, found.length);
  await page.reload(); await page.waitForSelector(".ol-students-cls tr.ol-tr");
  assert.equal(await page.getByRole("searchbox", { name: "Search sections" }).inputValue(), stem, "survives a reload");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForURL((u) => !u.searchParams.has("q"));
  await page.waitForFunction((n) => document.querySelectorAll(".ol-students-cls tr.ol-tr").length === n, Math.min(all.length, 50));
  const none = all.filter((c) => !c.classTeacher).length;
  if (none) {
    await page.locator(".ol-students-cls .ol-kpi", { hasText: "No class teacher" }).click();
    await page.waitForURL((u) => u.searchParams.get("filter") === "no-teacher");
    await page.waitForFunction((n) => document.querySelectorAll(".ol-students-cls tr.ol-tr").length === n, none);
  }
  await page.getByRole("radio", { name: /2027/ }).click();
  await page.waitForURL((u) => /^2027-2028$/.test(u.searchParams.get("year") || ""));
  await page.waitForFunction(() => document.querySelector(".ol-students-cls .ol-subtitle, .ol-students-cls .ol-ph__sub").textContent.includes("2027"));
}, inClasses);

await t("Classes: Add class takes several sections at once, refuses a bad capacity beside its field, and each new section is written down", async (page) => {
  await page.getByRole("button", { name: "Add class" }).first().click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.waitFor();
  await drawer.getByRole("combobox", { name: "Class", exact: true }).click();
  await page.getByRole("option", { name: cls.grade, exact: true }).click();
  await drawer.getByLabel("Section").fill(`${cls.a}, ${cls.b}`);
  await drawer.getByLabel("Capacity").fill("abc");
  await drawer.getByRole("button", { name: "Add class" }).click();
  await drawer.getByText("Capacity is a number from 1 to 200.").waitFor();
  await drawer.getByLabel("Capacity").fill("30");
  await drawer.getByLabel("Programme").fill("CBSE");
  await drawer.getByRole("button", { name: "Add class" }).click();
  await drawer.waitFor({ state: "hidden" });
  await page.getByText(`Added 2 sections: ${cls.grade}-${cls.a}, ${cls.grade}-${cls.b}`).waitFor();
  await page.waitForFunction((l) => [...document.querySelectorAll(".ol-students-cls .ol-students-name__n")].some((e) => e.textContent === l), `${cls.grade}-${cls.a}`);
  const made = (await sections()).find((c) => c.label === `${cls.grade}-${cls.a}`);
  assert.equal(made.capacity, 30); assert.equal(made.programme, "CBSE");
  cls.id = made.id; cls.idB = (await sections()).find((c) => c.label === `${cls.grade}-${cls.b}`).id;
  const log = (await call("GET", `/audit?record=${cls.id}&action=students.class.created`)).body;
  assert.equal(log.total, 1);
}, inClasses);

await t("Classes: a section opens as a page; Edit changes the room in a drawer, and the Activity tab says what it was and what it is", async (page) => {
  await page.locator(`tr[data-k="${cls.id}"] a.ol-students-name`).click();
  await at("the section opens", page.waitForURL(new RegExp("/students/classes/sections/" + cls.id + "$")));
  await page.waitForFunction((l) => document.querySelector(".ol-students-rec h1") && document.querySelector(".ol-students-rec h1").textContent === l, `${cls.grade}-${cls.a}`);
  assert.deepEqual(await page.locator(".ol-students-rec [role=tab]").allInnerTexts(), ["Overview", "Roster", "Activity"]);
  await page.getByRole("button", { name: "Edit section" }).click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.waitFor();
  assert.equal(await drawer.getByLabel("Section").isDisabled(), true, "the class and section cannot be changed, only what is kept about them");
  await drawer.getByLabel("Room").fill("R-NEW-" + RUN.slice(-3));
  await drawer.getByRole("button", { name: "Save" }).click();
  await drawer.waitFor({ state: "hidden" });
  await page.getByText("Section saved").waitFor();
  await page.getByRole("tab", { name: "Activity" }).click();
  await page.locator(".ol-students-timeline__i").first().waitFor();
  const text = await page.locator(".ol-students-timeline").innerText();
  assert.match(text, /changed Room/); assert.match(text, /Not set\s*→\s*R-NEW-/); assert.match(text, /added this section/);
  await page.locator(".ol-students-rec .ol-ph__back").click();
  await at("Back returns to the list: " + page.url(), page.waitForURL((u) => u.pathname.endsWith("/students/classes/sections")));
}, { at: "students/classes/sections", ready: ".ol-students-cls tr.ol-tr" });

await t("Classes: Add children seats a child the school has no section for, and the roster shows them; Number the rolls asks first", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/classes/sections/" + cls.id + "/roster");
  await page.waitForFunction(() => document.querySelector(".ol-students-rec h1"));
  await page.getByRole("button", { name: "Add children" }).first().click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.getByLabel("Search by name").fill("Zq");
  const box = drawer.locator(".ol-students-seat input[type=checkbox]").first();
  await box.waitFor();
  await box.check();
  await drawer.getByRole("button", { name: "Add 1 child" }).click();
  await drawer.waitFor({ state: "hidden" });
  await page.getByText(new RegExp("1 child added to " + cls.grade + "-" + cls.a)).waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".ol-students-rec tr.ol-tr").length === 1);
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: "Number the rolls A–Z" }).click();
  const ask = page.getByRole("dialog");
  await ask.waitFor();
  assert.match(await ask.innerText(), /Number the rolls of XI-/);
  await ask.getByRole("button", { name: "Number the rolls" }).click();
  await page.getByText(/1 child numbered, alphabetically/).waitFor();
  const seated = (await call("GET", "/directory/students?class=" + cls.grade + "-" + cls.a)).body;
  assert.equal(seated.total, 1); assert.equal(seated.rows[0].rollNo, 1);
}, { at: "students/classes/sections", ready: ".ol-students-cls tr.ol-tr" });

await t("a section's tabs point at their panel from the moment they are drawn, even while the roster is still on its way (T3)", async (page) => {
  await page.route(/\/directory\/students\?/, async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
  await page.goto(ORIGIN + "/learn/admin/students/classes/sections/" + cls.id);
  const tab = page.getByRole("tab", { name: "Overview" });
  await tab.waitFor();
  assert.ok(await page.locator(".ol-students-rec .ol-skel").count() > 0, "the roster has not come: the panel is still a skeleton");
  const panel = page.locator("#" + await tab.getAttribute("aria-controls"));
  assert.equal(await panel.count(), 1, "the open tab's panel is in the page");
  assert.equal(await panel.getAttribute("role"), "tabpanel");
  assert.equal(await panel.getAttribute("aria-labelledby"), await tab.getAttribute("id"));
}, { at: "students/classes/sections", ready: ".ol-students-cls tr.ol-tr" });

/* ------------------------------------------------------------------------------------------ Guardians */
const gd = { email: `gd.${RUN}@students.test`, phone: "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0"), name: `Gd${RUN} Parent` };
const inGuardians = { at: "students/guardians", ready: ".ol-students-gd tr.ol-tr" };
const askG = (page, has) => page.waitForResponse((r) => r.request().method() === "GET" && /\/directory\/guardians(\?|$)/.test(r.url()) && has.every((x) => r.url().includes(x)));

await t("Guardians: one list: its own heading, one primary button, five numbers, a view switch, filters and a page of families with every email masked", async (page) => {
  const api = (await call("GET", "/directory/guardians?size=1")).body;
  assert.equal(await page.locator(".ol-students-gd h1").innerText(), "Guardians");
  assert.equal(await page.locator(".ol-students-gd .ol-ph__actions .ol-btn--primary").innerText(), "Add guardian");
  assert.equal(await page.locator(".ol-students-gd .ol-kpis > *").count(), 5);
  assert.ok((await page.locator(".ol-students-gd .ol-kpi").first().innerText()).replace(/,/g, "").includes(String(api.kpis.guardians)), "the first number is the school's");
  assert.equal(await page.getByRole("radiogroup", { name: "View" }).getByRole("radio").count(), 2);
  const emails = await page.locator('.ol-students-gd tr.ol-tr td[data-label="Email"]').allInnerTexts();
  assert.ok(emails.length > 0 && emails.every((e) => /^.•••@\S+$/.test(e.trim()) || e.trim() === "—"), "emails are masked: " + JSON.stringify(emails.slice(0, 3)));
  assert.equal(await page.title(), "Guardians · OEdu");
  await settle(page); await shot(page, "guardians-1440-light");
}, inGuardians);

await t("Guardians: search, a chip and the view switch write the address, and the other view lists the students nobody is linked to", async (page) => {
  const sample = (await call("GET", "/directory/guardians?size=1&sort=name")).body.rows[0], stem = sample.name.split(" ")[0];
  await Promise.all([askG(page, ["q=" + stem]), page.getByRole("searchbox", { name: "Search guardians" }).fill(stem)]);
  await page.waitForURL((u) => u.searchParams.get("q") === stem);
  const found = (await call("GET", "/directory/guardians?q=" + stem)).body.total;
  assert.match(await page.locator(".ol-students-gd .ol-pager").innerText(), new RegExp("of " + found + "\\b"));
  await Promise.all([askG(page, ["app=invited"]), page.locator(".ol-students-gd .ol-t2__chips").getByRole("button", { name: /^Invited/ }).click()]);
  await page.waitForURL((u) => u.searchParams.get("app") === "invited");
  await page.reload(); await page.waitForSelector(".ol-students-gd tr.ol-tr");
  assert.equal(await page.getByRole("searchbox", { name: "Search guardians" }).inputValue(), stem, "a reload keeps the search");
  assert.equal(await page.locator(".ol-students-gd .ol-t2__chips").getByRole("button", { name: /^Invited/ }).getAttribute("aria-pressed"), "true", "and the chip");
  await Promise.all([askG(page, ["view=no-guardian"]), page.getByRole("radio", { name: "Students without a guardian" }).click()]);
  await page.waitForURL((u) => u.searchParams.get("view") === "no-guardian" && !u.searchParams.has("app"));
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  const lonely = (await call("GET", "/directory/guardians?view=no-guardian")).body;
  await page.waitForFunction((n) => document.querySelectorAll(".ol-students-gd tr.ol-tr").length === n, Math.min(lonely.total, 50));
  assert.ok(lonely.total >= 1, "the Zq students are alone");
  assert.equal(await page.locator(".ol-students-gd th", { hasText: "Admitted on" }).count(), 1, "this is the other table");
}, inGuardians);

await t("Guardians: Add guardian beside a student nobody is linked to: the student is already chosen, a bad email is refused beside its field, a good one links and says so", async (page) => {
  await Promise.all([askG(page, ["view=no-guardian"]), page.getByRole("radio", { name: "Students without a guardian" }).click()]);
  await page.getByRole("searchbox", { name: "Search guardians" }).fill(made.name);
  const row = page.locator(`tr[data-k="${made.id}"]`);
  await row.waitFor();
  await row.getByRole("button", { name: "Add guardian" }).click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.waitFor();
  assert.ok((await drawer.innerText()).includes(made.name), "the student is chosen already");
  await drawer.getByLabel("Email", { exact: true }).fill("not-an-email");
  await drawer.getByRole("button", { name: "Add guardian" }).click();
  await drawer.getByText("Enter a valid email address.").waitFor();
  await drawer.getByLabel("Email", { exact: true }).fill(gd.email);
  await drawer.getByRole("button", { name: "Add guardian" }).click();
  await drawer.getByText("Choose the relation.").waitFor();
  await drawer.getByRole("combobox", { name: "Relation", exact: true }).click();
  await page.getByRole("option", { name: "Father", exact: true }).click();
  await drawer.getByLabel("Full name").fill(gd.name);
  await drawer.getByLabel("Mobile number").fill(gd.phone);
  await drawer.getByRole("button", { name: "Add guardian" }).click();
  await drawer.waitFor({ state: "hidden" });
  await page.getByText(new RegExp(gd.name + " was added and linked to 1 student")).waitFor();
  const g = (await call("GET", "/directory/guardians?q=" + encodeURIComponent(made.name))).body;
  assert.equal(g.total, 1); assert.equal(g.rows[0].app, "invited"); assert.match(g.rows[0].phone, /^•+\d{4}$/);
  gd.id = g.rows[0].id;
  assert.equal((await call("GET", `/audit?record=${made.id}&action=students.guardian.linked`)).body.total, 1, "the link is on the student's Activity tab");
  await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id + "/activity");
  const said = await page.locator(".ol-students-timeline").innerText();
  assert.match(said, /added Guardian/);
  assert.ok(!said.includes("students.field"), "the Activity names the field in words, not by its key");
}, inGuardians);

await t("Guardians: the quick look lists the students they are linked to and shows the number only when asked; asking is written down", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/students/guardians?peek=" + gd.id);
  await page.locator(".ol-drawer.is-open .ol-students-peek").waitFor();
  assert.equal(await page.locator(".ol-drawer__title").innerText(), gd.name);
  assert.ok((await page.locator(".ol-drawer .ol-students-gd__list").innerText()).includes(made.name), "the child is listed");
  const num = page.locator(".ol-drawer .ol-students-contact__num").first();
  assert.match(await num.innerText(), /^•+\d{4}$/, "masked on arrival");
  const before = (await call("GET", `/audit?record=${gd.id}&action=students.guardian.phone_revealed`)).body.total;
  await page.locator(".ol-drawer").getByRole("button", { name: "Show number" }).first().click();
  await page.waitForFunction(() => !/•/.test(document.querySelector(".ol-drawer .ol-students-contact__num").textContent));
  assert.ok((await num.innerText()).replace(/\D/g, "").endsWith(gd.phone.slice(-10)));
  assert.equal((await call("GET", `/audit?record=${gd.id}&action=students.guardian.phone_revealed`)).body.total, before + 1);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("peek"));
}, { at: "students/guardians", ready: ".ol-students-gd tr.ol-tr" });

/* ----------------------------------------------------------------------------------------- Admissions */
const apps = async (q) => (await call("GET", "/applications?" + q)).body;
const inAdmissions = { at: "students/admissions", ready: ".ol-students-adm tr.ol-tr" };
const askA = (page, has) => page.waitForResponse((r) => r.request().method() === "GET" && /\/applications(\?|$)/.test(r.url()) && has.every((x) => r.url().includes(x)));

await t("Admissions: the applications as one list: its own heading, one primary button, five numbers that are views, a view menu, filters, the year, and a row for each application of the view", async (page) => {
  const open = await apps("view=open&size=25");
  assert.equal(await page.locator(".ol-students-adm h1").innerText(), "Admissions");
  assert.equal(await page.locator(".ol-students-adm .ol-ph__actions .ol-btn--primary").innerText(), "New application");
  assert.equal(await page.locator(".ol-students-adm .ol-kpis > *").count(), 5);
  assert.ok((await page.locator(".ol-students-adm .ol-kpi").first().innerText()).includes(String(open.counts.open)), "the first number is the view's");
  assert.equal(await page.locator(".ol-students-adm tr.ol-tr").count(), Math.min(open.total, 25));
  assert.equal(await page.title(), "Admissions · OEdu");
  await settle(page); await shot(page, "admissions-1440-light");
}, inAdmissions);

await t("Admissions: a number that is a view, a search and a sort write the address; a reload keeps them, and the table is the server's order", async (page) => {
  const verify = await apps("view=verify&size=25");
  await Promise.all([askA(page, ["view=verify"]), page.locator(".ol-students-adm .ol-kpi", { hasText: "To verify" }).click()]);
  await page.waitForURL((u) => u.searchParams.get("view") === "verify");
  await page.waitForFunction((n) => document.querySelectorAll(".ol-students-adm tr.ol-tr").length === n, Math.min(verify.total, 25));
  await page.reload(); await page.waitForSelector(".ol-students-adm tr.ol-tr");
  assert.equal(new URL(page.url()).searchParams.get("view"), "verify", "a reload keeps the view");
  assert.equal(await page.locator(".ol-students-adm .ol-kpi", { hasText: "To verify" }).getAttribute("aria-pressed"), "true");
  const stem = verify.items[0].name.split(" ")[0].slice(0, 4);
  await Promise.all([askA(page, ["q=" + stem]), page.getByRole("searchbox", { name: "Search applications" }).fill(stem)]);
  await page.waitForURL((u) => u.searchParams.get("q") === stem);
  const found = await apps("view=verify&q=" + stem);
  await page.waitForFunction((n) => document.querySelectorAll(".ol-students-adm tr.ol-tr").length === n, Math.min(found.total, 25));
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await Promise.all([askA(page, ["sort=number"]), page.locator(".ol-students-adm th", { hasText: "Number" }).getByRole("button").click()]);
  await page.waitForURL((u) => u.searchParams.get("sort") === "number");
  const order = (await apps("view=verify&sort=number&dir=asc&size=25")).items.map((x) => x.number);
  await page.waitForFunction((n) => [...document.querySelectorAll('.ol-students-adm tr.ol-tr td[data-label="Number"]')].map((e) => e.textContent.trim())[0] === n, order[0]);
  assert.deepEqual(await page.locator('.ol-students-adm tr.ol-tr td[data-label="Number"]').allInnerTexts(), order, "the server's order");
}, inAdmissions);

await t("Admissions: the toolbar is drawn again with every answer, and someone still typing in the search keeps the keyboard", async (page) => {
  const box = page.getByRole("searchbox", { name: "Search applications" });
  await box.click();
  await Promise.all([askA(page, ["q=a"]), page.keyboard.type("a")]);
  await settle(page);                             // the answer has been drawn, toolbar included
  await Promise.all([askA(page, ["q=an"]), page.keyboard.type("n")]);
  await settle(page);
  assert.equal(await box.inputValue(), "an", "both letters went into the search");
  assert.ok(await box.evaluate((el) => el === document.activeElement), "and the search still has the keyboard");
}, inAdmissions);

await t("Admissions: a row opens the application beside the list; Open application goes to the workspace's own page for it", async (page) => {
  const first = (await apps("view=open&size=25")).items[0];
  await page.locator(`tr[data-k="${first.id}"]`).click();
  const drawer = page.locator(".ol-drawer.is-open");
  await drawer.waitFor();
  await page.waitForURL((u) => u.searchParams.get("peek") === first.id);
  assert.equal(await drawer.locator(".ol-drawer__title").innerText(), first.name);
  assert.ok((await drawer.innerText()).includes(first.number));
  assert.ok((await drawer.innerText()).includes(first.next.label), "the next step is in it");
  await settle(page); await shot(page, "admissions-quicklook-1440-light");
  await drawer.getByRole("button", { name: "Open application" }).click();
  await page.waitForFunction(() => !document.querySelector(".ol-students-adm"));
  await page.getByText(first.name).first().waitFor();
}, inAdmissions);

await t("Admissions: the workspace button opens the old workspace at an address of its own, a reload keeps it, and the Admissions tab brings the list back", async (page) => {
  await page.getByRole("button", { name: "Admissions workspace" }).click();
  await page.waitForURL(/\/students\/admissions\/workspace$/);
  await page.waitForFunction(() => !document.querySelector(".ol-students-adm") && document.querySelector("#v-admin") && document.querySelector("#v-admin").innerText.includes("Enquiries"));
  await page.reload(); await page.waitForFunction(() => document.querySelector("#v-admin") && document.querySelector("#v-admin").innerText.includes("Enquiries"));
  assert.equal(await page.locator(".ol-students-adm").count(), 0, "a reload keeps the workspace");
  await page.locator(".ol-pagehead").getByRole("tab", { name: "Admissions" }).click();
  await page.waitForSelector(".ol-students-adm tr.ol-tr");
  assert.match(page.url(), /\/students\/admissions$/);
}, inAdmissions);

await t("Classes: when the server says the person may not read the classes, the page says so and draws nothing else", async (page) => {
  await page.route(/\/india\/classes/, (r) => r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: { code: "forbidden", message: "no" } }) }));
  await page.goto(ORIGIN + "/learn/admin/students/classes/sections");
  await page.locator(".ol-students-cls .ol-empty--denied").waitFor();
  assert.equal(await page.locator(".ol-students-cls .ol-empty h3").innerText(), "You can't open Classes");
  assert.equal(await page.locator(".ol-students-cls .ol-ph__actions .ol-btn--primary").count(), 0, "no Add class for someone who cannot write");
  assert.equal(await page.locator(".ol-students-cls .ol-kpis").count(), 0);
}, { at: "students/classes/sections", ready: ".ol-students-cls" });

/* The four lists are one template (T2): the same failure, the same way out. */
for (const [name, at, root, ask] of [
  ["Directory", "students/directory", ".ol-students-dir", /\/directory\/students(\?|$)/],
  ["Admissions", "students/admissions", ".ol-students-adm", /\/applications(\?|$)/],
  ["Classes", "students/classes/sections", ".ol-students-cls", /\/india\/classes/],
  ["Guardians", "students/guardians", ".ol-students-gd", /\/directory\/guardians(\?|$)/]
]) {
  await t(`${name}: when the server fails the page says so above the numbers with Try again, and it asks again and draws the rows (the T2 shell's alert)`, async (page) => {
    let failing = true;
    await page.route(ask, (r) => failing
      ? r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "server_error", message: "The school's records are not answering." } }) })
      : r.continue());
    await page.goto(ORIGIN + "/learn/admin/" + at);
    const alert = page.locator(`${root} .ol-t2__alert .ol-banner`);
    await alert.waitFor();
    assert.match(await alert.innerText(), /not answering/);
    assert.equal(await page.locator(`${root} tr.ol-tr`).count(), 0, "no rows to draw yet");
    failing = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await page.waitForSelector(`${root} tr.ol-tr`);
    assert.equal(await page.locator(`${root} .ol-t2__alert .ol-banner`).count(), 0, "the banner goes when the answer comes");
    assert.ok(await page.locator(`${root} .ol-kpis > *`).count() > 0, "the numbers come with the rows");
  }, { at, ready: root });
}

await t("a failure the server did not expect says so with its request id to quote (X4)", async (page) => {
  await page.route(/\/directory\/students(\?|$)/, (r) => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "internal", message: "Something went wrong at our end.", requestId: "req_3f9a1c20b7d4" } }) }));
  await page.goto(ORIGIN + "/learn/admin/students/directory");
  const alert = page.locator(".ol-students-dir .ol-t2__alert .ol-banner");
  await alert.waitFor();
  assert.match(await alert.innerText(), /Something went wrong at our end\. Quote request id req_3f9a1c20b7d4\./);
}, { at: "students/directory", ready: ".ol-students-dir" });

for (const mode of ["Light", "Dark"]) {
  await t(`axe: the Directory, the quick look, the record and the form have no WCAG 2.2 AA violations (${mode.toLowerCase()})`, async (page) => {
    if (mode === "Dark") await theme(page, "Dark");
    await settle(page);
    assert.deepEqual(await axe(page, [".ol-students-dir"]), [], "the Directory");
    await shot(page, "directory-1440-" + mode.toLowerCase());
    await rows(page).first().click();
    await page.locator(".ol-drawer.is-open .ol-students-peek").waitFor();
    await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-drawer"]), [], "the quick look");
    await shot(page, "quicklook-1440-" + mode.toLowerCase());
    await page.keyboard.press("Escape");
    await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id);
    await page.locator(".ol-students-rec h1").waitFor(); await settle(page);
    assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "the record, overview");
    for (const tab of ["Family", "Government records", "Activity"]) {
      await page.getByRole("tab", { name: tab }).click(); await settle(page);
      assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "the record, " + tab);
    }
    await shot(page, "record-1440-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id + "/edit");
    await page.locator(".ol-students-formpage form").waitFor(); await settle(page);
    assert.deepEqual(await axe(page, [".ol-students-formpage"]), [], "the form");
    await shot(page, "form-1440-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/classes/sections");
    await page.waitForSelector(".ol-students-cls tr.ol-tr"); await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-cls"]), [], "the sections");
    await shot(page, "classes-1440-" + mode.toLowerCase());
    await page.getByRole("button", { name: "Add class" }).first().click();
    await page.locator(".ol-drawer.is-open form").waitFor(); await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-drawer"]), [], "the Add class drawer");
    await page.keyboard.press("Escape");
    await page.goto(ORIGIN + "/learn/admin/students/classes/sections/" + cls.id);
    await page.locator(".ol-students-rec h1").waitFor(); await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "a section, overview");
    for (const tab of ["Roster", "Activity"]) {
      await page.getByRole("tab", { name: tab }).click(); await page.waitForTimeout(500);
      assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "a section, " + tab);
    }
    await shot(page, "class-record-1440-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/guardians");
    await page.waitForSelector(".ol-students-gd tr.ol-tr"); await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-gd"]), [], "the guardians");
    await shot(page, "guardians-1440-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/admissions"); await page.waitForSelector(".ol-students-adm tr.ol-tr"); await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-adm"]), [], "the applications");
    await shot(page, "admissions-1440-" + mode.toLowerCase());
    await page.locator(".ol-students-adm tr.ol-tr").first().click();
    await page.locator(".ol-drawer.is-open .ol-students-peek").waitFor(); await page.waitForTimeout(900);
    assert.deepEqual(await axe(page, [".ol-drawer"]), [], "an application's quick look");
    await page.keyboard.press("Escape");
    await page.goto(ORIGIN + "/learn/admin/students/guardians"); await page.waitForSelector(".ol-students-gd tr.ol-tr");
    await page.getByRole("radio", { name: "Students without a guardian" }).click(); await page.waitForTimeout(900);
    assert.deepEqual(await axe(page, [".ol-students-gd"]), [], "the students without a guardian");
    await page.goto(ORIGIN + "/learn/admin/students/guardians?peek=" + gd.id);
    await page.locator(".ol-drawer.is-open .ol-students-peek").waitFor(); await page.waitForTimeout(900);
    assert.deepEqual(await axe(page, [".ol-drawer"]), [], "a guardian's quick look");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Add guardian" }).first().click();
    await page.locator(".ol-drawer.is-open form").waitFor(); await page.waitForTimeout(900);
    assert.deepEqual(await axe(page, [".ol-drawer"]), [], "the Add guardian drawer");
    await page.keyboard.press("Escape");
  });
}

for (const mode of ["Light", "Dark"]) {
  await t(`at 360 px the pages themselves hold (${mode.toLowerCase()}): no sideways scroll, rows are cards, nothing is cut off, axe is clean`, async (page) => {
    if (mode === "Dark") await theme(page, "Dark");
    const wide = () => page.evaluate(() => { const m = document.querySelector("#v-admin main, .ol-main, .ol-students-dir"); return { page: document.documentElement.scrollWidth - innerWidth, st: m ? m.scrollWidth - m.clientWidth : 0 }; });
    assert.ok((await wide()).page <= 1, "the Directory does not scroll sideways: " + JSON.stringify(await wide()));
    assert.equal(await page.locator(".ol-students-dir tr.ol-tr").first().evaluate((tr) => getComputedStyle(tr).display), "grid", "a row is a card");
    await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-dir"]), [], "the Directory at 360");
    await shot(page, "directory-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/directory/" + made.id); await page.locator(".ol-students-rec h1").waitFor(); await settle(page);
    assert.ok((await wide()).page <= 1, "the record does not scroll sideways");
    await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "the record at 360");
    await shot(page, "record-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/directory/new"); await page.locator(".ol-students-formpage form").waitFor(); await settle(page);
    assert.ok((await wide()).page <= 1, "the form does not scroll sideways");
    await page.waitForTimeout(700);
    assert.deepEqual(await axe(page, [".ol-students-formpage"]), [], "the form at 360");
    await shot(page, "form-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/classes/sections"); await page.waitForSelector(".ol-students-cls tr.ol-tr"); await page.waitForTimeout(700);
    assert.ok((await wide()).page <= 1, "the sections do not scroll sideways: " + JSON.stringify(await wide()));
    assert.equal(await page.locator(".ol-students-cls tr.ol-tr").first().evaluate((tr) => getComputedStyle(tr).display), "grid", "a section is a card");
    assert.deepEqual(await axe(page, [".ol-students-cls"]), [], "the sections at 360");
    await shot(page, "classes-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/guardians"); await page.waitForSelector(".ol-students-gd tr.ol-tr"); await page.waitForTimeout(700);
    assert.ok((await wide()).page <= 1, "the guardians do not scroll sideways: " + JSON.stringify(await wide()));
    assert.equal(await page.locator(".ol-students-gd tr.ol-tr").first().evaluate((tr) => getComputedStyle(tr).display), "grid", "a family is a card");
    assert.deepEqual(await axe(page, [".ol-students-gd"]), [], "the guardians at 360");
    await shot(page, "guardians-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/admissions"); await page.waitForSelector(".ol-students-adm tr.ol-tr"); await page.waitForTimeout(700);
    assert.ok((await wide()).page <= 1, "the applications do not scroll sideways: " + JSON.stringify(await wide()));
    assert.equal(await page.locator(".ol-students-adm tr.ol-tr").first().evaluate((tr) => getComputedStyle(tr).display), "grid", "an application is a card");
    assert.deepEqual(await axe(page, [".ol-students-adm"]), [], "the applications at 360");
    await shot(page, "admissions-360-" + mode.toLowerCase());
    await page.goto(ORIGIN + "/learn/admin/students/classes/sections/" + cls.id + "/roster"); await page.waitForSelector(".ol-students-rec h1"); await page.waitForTimeout(700);
    assert.ok((await wide()).page <= 1, "a section does not scroll sideways: " + JSON.stringify(await wide()));
    assert.deepEqual(await axe(page, [".ol-students-rec"]), [], "a section at 360");
  }, { viewport: { width: 360, height: 800 }, noPhone: true });
}

await admin.close();
await browser.close();
console.log(`\n${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
