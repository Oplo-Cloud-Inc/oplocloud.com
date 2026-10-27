// The new frame, driven like a person drives it: node scripts/test-shell.mjs
// Signs a school administrator in on the local stack and uses the real app in Chromium: the rail, the
// breadcrumb, the module tabs, the address, the search palette, the account menu, the language, the theme.
// Local only. Needs the static server and the API running, and an existing administrator:
//   ORIGIN=http://localhost:8153 API=http://localhost:8817/api/v1 CRED=/path/cred.json node scripts/test-shell.mjs
// (CRED is {"email": …, "password": …}.) axe-core and playwright-core come from devDependencies.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ORIGIN = process.env.ORIGIN || "http://localhost:8153";
const API = process.env.API || "http://localhost:8817/api/v1";
if (!process.env.CRED) { console.error("CRED=/path/to/cred.json (an administrator's email and password) is needed"); process.exit(2); }
const cred = JSON.parse(fs.readFileSync(process.env.CRED, "utf8"));

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
async function t(name, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 860 } });
  const login = await ctx.request.post(API + "/auth/login", { data: { email: cred.email, password: cred.password }, headers: { origin: ORIGIN } });
  assert.ok(login.ok(), "the administrator signs in: " + login.status());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // A 404 for a stylesheet the page asks for before its <base> is corrected is the old page's own, and the web font is offline.
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text() + (m.location().url || ""))) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  try {
    await page.goto(ORIGIN + "/learn/admin/" + (opts.at || ""));
    await page.waitForSelector(".ol-top", { timeout: 15000 });
    await fn(page, ctx);
    assert.deepEqual(errors, [], "no page errors");
    n++; console.log("  ok  " + name);
  } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").slice(0, 6).join("\n       ")); }
  await ctx.close();
}
const settle = (page) => page.waitForTimeout(250);
// Ctrl+K, then wait until the field has the cursor, as a person waits for the card to appear
const openSearch = async (page) => {
  await page.keyboard.press("Control+k");
  await page.waitForFunction(() => document.activeElement && document.activeElement.classList.contains("ol-palette__input"));
};
// the server's answer is in when the list is no longer busy
const answered = (page) => page.waitForFunction(() => document.querySelector(".ol-palette__list") && !document.querySelector(".ol-palette__list[aria-busy]") && !document.querySelector(".ol-palette__note:not([hidden])"));
const axe = async (page, include) => {
  await page.evaluate(AXE);
  return page.evaluate(async (inc) => (await window.axe.run({ include: inc }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations
    .map((v) => v.id + ": " + v.nodes.map((x) => x.target.join(" ")).slice(0, 3).join(" | ")), include);
};

await t("a bare /admin opens Today inside the frame, and the address says so", async (page) => {
  assert.match(page.url(), /\/learn\/admin\/today$/);
  assert.equal(await page.evaluate(() => document.body.classList.contains("ol-shell")), true);
  const labels = await page.locator(".ol-rail__label").allInnerTexts();
  assert.deepEqual(labels, ["Today", "Students", "Attendance", "Academics", "Exams", "Wellbeing", "Communicate", "Staff", "Campus", "Insights", "Admin"]);
  assert.equal(await page.title(), "Today · OEdu");
  assert.equal(await page.locator(".ol-rail__item[aria-current=page]").innerText(), "Today");
});

await t("the rail opens a module on its front tab; the breadcrumb, the tabs, the title and Back follow", async (page) => {
  await page.getByRole("link", { name: "Students" }).first().click();
  await page.waitForURL(/\/admin\/students\/directory$/);
  assert.equal(await page.title(), "Directory · OEdu");
  assert.equal((await page.locator(".ol-top__crumbs").innerText()).replace(/\s+/g, " ").trim(), "Students Directory");
  assert.equal(await page.locator(".ol-pagehead [role=tab][aria-selected=true]").innerText(), "Directory");
  await page.locator(".ol-pagehead").getByRole("tab", { name: "Admissions" }).click();
  await page.waitForURL(/\/admin\/students\/admissions$/);
  assert.equal(await page.title(), "Admissions · OEdu");
  await page.goBack();
  await page.waitForURL(/\/admin\/students\/directory$/);
  assert.equal(await page.locator(".ol-pagehead [role=tab][aria-selected=true]").innerText(), "Directory");
  assert.equal(await page.locator(".ol-rail__tab.is-on").innerText(), "Directory");
});

await t("a deep link opens the sub-tab it names; an old address opens, and is rewritten to the new one", async (page) => {
  await page.goto(ORIGIN + "/learn/admin/academics/timetable/draft");
  await page.waitForSelector(".ol-pagehead [role=tab]");
  assert.equal(await page.locator(".ol-pagehead .ol-tabs--sub [aria-selected=true]").innerText(), "Draft");
  assert.equal((await page.locator(".ol-top__crumbs").innerText()).replace(/\s+/g, " ").trim(), "Academics Timetable Draft");
  await page.goto(ORIGIN + "/learn/admin/Schedule/Bell-Schedules");
  await page.waitForURL(/\/admin\/academics\/timings$/, { timeout: 10000 });
  assert.equal(await page.title(), "Bell timings · OEdu");
});

await t("the rail folds to icons and remembers it; a folded row still has its name for a screen reader and a tip", async (page) => {
  await page.getByRole("button", { name: "Collapse the menu" }).click();
  await settle(page);
  assert.equal(await page.evaluate(() => document.body.classList.contains("ol-rail-min")), true);
  const w = await page.evaluate(() => document.getElementById("rail").getBoundingClientRect().width);
  assert.ok(w <= 70, "64px wide: " + w);
  assert.equal(await page.locator(".ol-rail__item[data-module=students]").getAttribute("data-tip"), "Students");
  assert.ok(await page.getByRole("link", { name: "Students" }).first().isVisible());
  await page.reload(); await page.waitForSelector(".ol-top");
  assert.equal(await page.evaluate(() => document.body.classList.contains("ol-rail-min")), true, "kept across a reload");
  await page.getByRole("button", { name: "Expand the menu" }).click();
});

await t("Ctrl+K opens search from anywhere; it finds a student, staff and a class; Enter opens; Esc hands focus back", async (page) => {
  const who = await page.evaluate(async (api) => (await (await fetch(api + "/search?q=a", { credentials: "include" })).json()).groups, API);
  const student = who.find((g) => g.kind === "student").items[0];
  const stem = student.title.split(" ")[0].slice(0, 4);
  await page.getByRole("button", { name: "Search" }).first().focus();
  await openSearch(page);
  await page.keyboard.type(stem);
  await answered(page);
  const opts = await page.locator(".ol-palette [role=option] .ol-palette__title").allInnerTexts();
  assert.ok(opts.some((x) => x === student.title), `"${student.title}" is in ${JSON.stringify(opts)}`);
  assert.equal(await page.locator(".ol-palette__group").first().getAttribute("role"), "group");
  await page.keyboard.press("Escape");
  await page.locator(".ol-palette").waitFor({ state: "detached" });
  assert.match(await page.evaluate(() => document.activeElement.className), /ol-search/, "focus goes back to where it was");
});

await t("search: a class code puts the class first; arrow keys and Tab move through rows and groups; Enter on a page goes there", async (page) => {
  await openSearch(page);
  await page.keyboard.type("X-C");
  await answered(page);
  const groups = (await page.locator(".ol-palette__gh").allTextContents()).map((x) => x.trim());
  assert.ok(groups.includes("Classes"), JSON.stringify(groups));
  assert.ok(groups.indexOf("Students") < groups.indexOf("Classes"), "groups keep their order: " + JSON.stringify(groups));
  const classRow = await page.locator(".ol-palette__group", { has: page.getByText("Classes", { exact: true }) }).locator("[role=option] .ol-palette__title").first().innerText();
  assert.equal(classRow, "X-C", "the class that was typed comes first in its group");
  assert.equal(await page.locator(".ol-palette [role=option]").first().getAttribute("aria-selected"), "true");
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator(".ol-palette [role=option][aria-selected=true]").getAttribute("data-i"), "1");
  await page.keyboard.press("Tab");
  const next = await page.locator(".ol-palette [role=option][aria-selected=true]").evaluate((el) => el.closest(".ol-palette__group").querySelector(".ol-palette__gh").textContent.trim());
  assert.notEqual(next, groups[0], "Tab jumps to the next group: " + next);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.locator(".ol-palette [role=option][aria-selected=true]").getAttribute("data-i"), "0", "Shift+Tab goes back to the group before");
  await page.locator(".ol-palette__input").fill("bell timings");
  await page.waitForFunction(() => [...document.querySelectorAll(".ol-palette__gh")].some((g) => g.textContent.trim() === "Pages"));
  // no waiting for the server: the rows left from "X-C" must not be offered for this text, or Enter would open one of them
  const first = await page.locator(".ol-palette [role=option][aria-selected=true] .ol-palette__title").innerText();
  assert.equal(first, "Bell timings", "the page that was typed is the first row");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/admin\/academics\/timings$/);
});

await t("search: nothing found says so, and names what to try", async (page) => {
  await openSearch(page);
  await page.keyboard.type("qqzzxx");
  await page.getByText("No results for").waitFor();
  assert.match(await page.locator(".ol-palette__none").innerText(), /admission number/);
});

await t("search: a student opens from the palette with the frame behind it, and the breadcrumb names them", async (page) => {
  await openSearch(page);
  await page.keyboard.type("riya ar");
  await answered(page);
  assert.equal(await page.locator(".ol-palette [role=option][aria-selected=true] .ol-palette__title").innerText(), "Riya Arora");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.title === "Riya Arora · OEdu", null, { timeout: 10000 });
  assert.equal((await page.locator(".ol-top__crumbs").innerText()).replace(/\s+/g, " ").trim(), "Students Directory Riya Arora");
  assert.match(page.url(), /\/admin\/students\/directory/);
  assert.equal(await page.locator(".ol-pagehead [role=tab][aria-selected=true]").innerText(), "Directory", "the tabs stay behind the profile");
});

await t("the account menu: appearance, language and sign out are one click, and the choice is kept", async (page) => {
  await page.getByRole("button", { name: /Account menu for/ }).click();
  assert.equal(await page.getByRole("menuitemradio", { name: "Light" }).getAttribute("aria-checked"), "true");
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-theme")), "dark");
  assert.equal(await page.evaluate(() => document.body.dataset.appearance), "dark", "the old pages follow");
  await page.reload(); await page.waitForSelector(".ol-top");
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-theme")), "dark", "kept across a reload");
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await page.getByRole("menuitemradio", { name: "हिन्दी" }).click();
  await page.waitForFunction(() => document.documentElement.lang === "hi-IN");
  assert.equal((await page.locator(".ol-rail__label").first().innerText()), "आज");
  assert.equal(await page.title(), "आज · OEdu");
  await page.getByRole("button", { name: /का खाता मेनू/ }).click();
  await page.getByRole("menuitemradio", { name: "English (India)" }).click();
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
});

await t("Help lists the keyboard shortcuts in a dialog that Esc closes", async (page) => {
  await page.getByRole("button", { name: "Help and shortcuts" }).click();
  const dlg = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await dlg.waitFor();
  assert.match(await dlg.innerText(), /Open search/);
  await page.keyboard.press("Escape");
  await dlg.waitFor({ state: "detached" });
});

await t("sign out goes to the welcome page at once, with no confirm box and nothing left of the frame", async (page) => {
  page.on("dialog", () => assert.fail("a browser dialog opened"));
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForFunction(() => !document.body.classList.contains("ol-shell"), null, { timeout: 5000 });
  assert.equal(await page.locator(".ol-top").count(), 0);
  assert.equal(await page.locator("#gate").isVisible(), true);
});

for (const theme of ["light", "dark"]) {
  await t(`axe: the frame has no WCAG 2.2 AA violations (${theme}), with the search and the account menu open`, async (page) => {
    if (theme === "dark") { await page.getByRole("button", { name: /Account menu for/ }).click(); await page.getByRole("menuitemradio", { name: "Dark" }).click(); await settle(page); }
    const frame = [".ol-rail", ".ol-top", ".ol-pagehead"];
    assert.deepEqual(await axe(page, frame), [], "rail, top bar, tabs");
    await openSearch(page);
    await page.keyboard.type("ar");
    await answered(page);
    await settle(page);
    assert.deepEqual(await axe(page, [".ol-palette"]), [], "palette");
    await page.keyboard.press("Escape");
    await page.locator(".ol-palette").waitFor({ state: "detached" });
    await page.getByRole("button", { name: /Account menu for/ }).click();
    assert.deepEqual(await axe(page, [".ol-menu"]), [], "account menu");
    await page.keyboard.press("Escape");
    if (theme === "dark") { await page.getByRole("button", { name: /Account menu for/ }).click(); await page.getByRole("menuitemradio", { name: "Light" }).click(); }
  }, { at: "students/directory" });
}

await t("a narrow window folds the rail by itself and the search becomes an icon", async (page) => {
  assert.equal(await page.evaluate(() => document.body.classList.contains("ol-rail-min")), true);
  assert.ok((await page.locator(".ol-search").boundingBox()).width <= 48);
  await page.getByRole("button", { name: "Search" }).first().click();
  await page.getByRole("combobox", { name: "Search" }).waitFor();
}, { viewport: { width: 900, height: 700 } });

/* The page registry (E6): a mistake in a registration is loud, and a page that fails to draw is never a blank page. */
await t("the registry refuses a key that is taken, a page without draw, and a page that does not name its template", async (page) => {
  const said = await page.evaluate(() => {
    const tryIt = (key, def) => { try { OL.pages.register(key, def); return "registered"; } catch (e) { return e.message; } };
    const ok = { template: "T2", draw() {} };
    return {
      first: tryIt("fx-one", ok),
      again: tryIt("fx-one", ok),
      noDraw: tryIt("fx-two", { template: "T2" }),
      noTemplate: tryIt("fx-three", { draw() {} }),
      badTemplate: tryIt("fx-four", { template: "T10", draw() {} }),
      oneBad: tryIt("fx-five", { template: ["T2", "T3x"], draw() {} }),
      several: tryIt("fx-six", { template: ["T2", "T3", "T5"], draw() {} }),
      noKey: tryIt("", ok),
      students: tryIt("students", ok)
    };
  });
  assert.equal(said.first, "registered");
  assert.match(said.again, /already registered/);
  assert.match(said.noDraw, /draw\(host, env\)/);
  assert.match(said.noTemplate, /template, T1 to T9/);
  assert.match(said.badTemplate, /template, T1 to T9/);
  assert.match(said.oneBad, /template, T1 to T9/);
  assert.equal(said.several, "registered", "a page that draws a list, a record and a form names all three");
  assert.match(said.noKey, /key of the old page/);
  assert.match(said.students, /already registered/, "the real Students page holds its key, so a second one cannot take it");
});

await t("a page that fails to draw shows an error with a reference and Retry, logs once, and draws when Retry is pressed after it recovers", async (page) => {
  const logged = [];
  await page.exposeFunction("__logged", (s) => logged.push(s));
  await page.evaluate(() => {
    window.__tries = 0; window.__broken = true;
    console.error = (...a) => window.__logged(a.map(String).join(" "));
    OL.pages.register("fx-broken", { template: "T2", draw(host) { window.__tries++; if (window.__broken) throw new Error("boom"); host.textContent = "drawn"; } });
    window.__host = document.createElement("div"); document.body.appendChild(window.__host);
    OL.pages.find("fx-broken", {})(window.__host);
  });
  const box = page.locator(".ol-empty--error");
  await box.waitFor();
  assert.match(await box.innerText(), /did not load/i);
  assert.match(await box.innerText(), /Reference [A-Z0-9]{6}/, "the person has a number to quote");
  assert.equal(logged.length, 1, "logged once");
  assert.match(logged[0], /\[([A-Z0-9]{6})\].*fx-broken/, "the log carries the same reference");
  const ref = (await box.innerText()).match(/Reference ([A-Z0-9]{6})/)[1];
  assert.ok(logged[0].includes("[" + ref + "]"), "the reference on screen is the one in the log");
  await page.evaluate(() => { window.__broken = false; });
  await box.getByRole("button", { name: "Try again" }).click();
  await page.waitForFunction(() => window.__host.textContent === "drawn");
  assert.equal(await page.evaluate(() => window.__tries), 2, "Retry drew the page again");
  assert.equal(logged.length, 1, "a draw that works logs nothing");
  assert.equal(await page.locator(".ol-empty--error").count(), 0);
});

await t("a page whose `when` throws is passed over and logged, and a page that does not apply is passed over quietly", async (page) => {
  const logged = [];
  await page.exposeFunction("__logged", (s) => logged.push(s));
  const r = await page.evaluate(() => {
    console.error = (...a) => window.__logged(a.map(String).join(" "));
    OL.pages.register("fx-when-throws", { template: "T3", when() { throw new Error("no env"); }, draw() {} });
    OL.pages.register("fx-other-country", { template: "T3", when: (env) => env.region === "US", draw() {} });
    return [OL.pages.find("fx-when-throws", {}), OL.pages.find("fx-other-country", { region: "IN" }), OL.pages.find("fx-nobody", {}), typeof OL.pages.find("fx-other-country", { region: "US" })];
  });
  assert.deepEqual(r, [null, null, null, "function"]);
  assert.equal(logged.length, 1, "only the page whose when() broke is logged");
});

await browser.close();
console.log(`\n${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
