// The journeys the product is judged by, walked in a real browser at 360 px, in light and dark (D3):
//   node api/scripts/test-journeys.mjs
//
// Storyboard 1 of docs/OEDU_INDIA_SCHOOL_OS_PLAN.md §12, the class teacher's 7:45 register on a phone: the page is open, the signal
// goes, two children are marked absent, the register is saved with no signal ("Saved on this phone, will send when the signal returns."
// and "1 waiting to send"), the signal comes back and the phone says "Sent". The register's answers are stubbed (the page's GET is made
// a school day with nothing taken, the PUT is accepted), so the journey does not depend on today's date or on what an earlier run left
// in the database; the real PUT is proved by prove-attendance.mjs. Storyboards 2 (a parent's first sign-in) and 3 (paying a fee) are
// listed below as pending: their screens belong to the family bundle (O9) and the fees slice, and this file walks them the day they exist.
//
// Local only. Needs the static server and the API running and the demo school (api/scripts/seed-demo-school.mjs):
//   ORIGIN=http://localhost:8153 API=http://localhost:8817/api/v1 CRED=/path/cred.json node api/scripts/test-journeys.mjs
// CRED is the demo school's file ({"password", "teacher", …}) or {"email", "password"} with TEACHER=<the class teacher's email> beside it
// (every demo account has the same throwaway password).
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ORIGIN = process.env.ORIGIN || "http://localhost:8153";
const API = process.env.API || "http://localhost:8817/api/v1";
if (!process.env.CRED) { console.error("CRED=/path/to/cred.json (the demo school's passwords) is needed"); process.exit(2); }
const cred = JSON.parse(fs.readFileSync(process.env.CRED, "utf8"));
const TEACHER = { email: process.env.TEACHER || cred.teacher || "myra.malhotra@sfhs.in", password: cred.password };

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
async function journey(name, scheme, fn) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, colorScheme: scheme });
  const login = await ctx.request.post(API + "/auth/login", { data: TEACHER, headers: { origin: ORIGIN } });
  assert.ok(login.ok(), "the class teacher signs in: " + login.status());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text() + (m.location().url || ""))) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  try {
    await fn(page, ctx);
    assert.deepEqual(errors, [], "no page errors");
    n++; console.log("  ok  " + name);
  } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").slice(0, 8).join("\n       ")); }
  await ctx.close();
}

/* the register: a school day with nothing taken, and a PUT the school accepts */
async function stubRegister(page) {
  await page.route(/\/api\/v1\/register(\?|$)/, async (route) => {
    const req = route.request();
    if (req.method() === "PUT") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    if (req.method() !== "GET") return route.continue();
    const res = await route.fetch();
    const j = await res.json();
    j.taken = false; j.canEdit = true; j.locked = false; j.schoolDay = { kind: "school", label: null };
    (j.students || []).forEach((s) => { s.status = null; s.reason = null; });
    return route.fulfill({ response: res, json: j });
  });
}
const text = (page, sel) => page.locator(sel).first().innerText();
const noSidewaysScroll = async (page) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(over <= 0, "the page is " + over + "px wider than the screen");
};

const SAVED = "Saved on this phone, will send when the signal returns.";
for (const scheme of ["light", "dark"]) {
  await journey(`storyboard 1: the class teacher's register on a phone, the signal gone and back (360 px, ${scheme})`, scheme, async (page, ctx) => {
    await stubRegister(page);
    await page.goto(ORIGIN + "/learn/");
    // the home screen has one tile for the class; she taps it
    await page.getByText("Register not taken yet").first().click();
    await page.waitForSelector(".pc-row", { timeout: 15000 });
    const children = await page.locator(".pc-row").count();
    assert.ok(children >= 10, "the roll is on the screen: " + children);
    assert.match(await text(page, ".ph-tally"), new RegExp(`${children} present`), "everyone starts present");
    await noSidewaysScroll(page);

    // the corridor: no signal. Two children are away.
    await ctx.setOffline(true);
    for (const i of [0, 1]) await page.locator(".pc-row").nth(i).getByRole("button", { name: /^Absent/ }).click();
    assert.match(await text(page, ".ph-tally"), /2 absent/, "the tally follows each tap");

    // save with no signal: where it is, and that it will go by itself
    await page.getByRole("button", { name: "Save the register" }).click();
    await page.getByText(SAVED).waitFor({ timeout: 5000 });
    await page.waitForFunction(() => /1\s*waiting to send/.test((document.querySelector(".pc-wait") || {}).innerText || ""));
    assert.equal(await page.locator(".pc-wait").isVisible(), true, "the waiting count is shown");
    assert.equal((await page.getByRole("button", { name: "Waiting to send" }).count()), 1, "the button says it is waiting");
    await noSidewaysScroll(page);

    // the signal comes back and the phone sends it, without being asked
    await ctx.setOffline(false);
    await page.getByText("Sent", { exact: true }).waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: /Register in/ }).waitFor({ timeout: 5000 });
    await page.waitForFunction(() => { const w = document.querySelector(".pc-wait"); return !w || w.hidden; });
    await noSidewaysScroll(page);
  });
}

// Waiting for their screens: they are walked here the day the family bundle (O9) and the fees slice exist.
for (const pending of ["storyboard 2: a parent's first sign-in", "storyboard 3: a parent paying a fee"]) console.log("  ..  pending: " + pending);

await browser.close();
console.log(`\n${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
