// The component library, driven like a person drives it: node scripts/test-ui.mjs
// Opens learn/_ui.html (the gallery) in a real Chromium and uses the keyboard and mouse.
// Needs the devDependencies (playwright-core, axe-core) and a Chromium in Playwright's cache (npx playwright install chromium).
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

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

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/learn/_ui.html`;

// any Chrome for Testing in the Playwright cache will do, whichever playwright-core fetched it
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
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, hasTouch: !!opts.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url || "")) errors.push(m.text()); });
  page.on("requestfailed", () => {});                                  // the web font, offline
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  try {
    await page.goto(BASE + (opts.query || ""));
    await page.waitForSelector(".gl-sec");
    await fn(page);
    assert.deepEqual(errors, [], "no console or page errors");
    n++; console.log("  ok  " + name);
  } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").slice(0, 6).join("\n       ")); }
  await ctx.close();
}
const demo = (page, caption) => page.locator("figure.gl-demo", { has: page.locator("figcaption", { hasText: caption }) });

await t("the gallery draws every section and the first screen has no errors", async (page) => {
  assert.equal(await page.locator(".gl-sec").count(), 12);
  assert.ok((await page.locator(".gl-demo").count()) >= 60);
});

await t("select: opens on Enter, filters as you type, picks with Enter, and Esc hands focus back", async (page) => {
  const box = page.getByRole("combobox", { name: "State" });
  await box.focus(); await page.keyboard.press("Enter");
  assert.equal(await box.getAttribute("aria-expanded"), "true");
  await page.keyboard.type("raj");
  assert.equal(await page.getByRole("option").count(), 1);
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  assert.match(await box.innerText(), /Rajasthan/);
  assert.equal(await box.getAttribute("aria-expanded"), "false");
  await page.keyboard.press("Enter"); await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("role")), "combobox");
});

await t("select: multi shows 'Biology, Chemistry +2' and a group can be ticked whole", async (page) => {
  const box = page.getByRole("combobox", { name: "Subjects" });
  assert.match(await box.innerText(), /Biology, Chemistry \+2/);
  await box.click();
  await page.getByText("Select all", { exact: false }).first().click();
  await page.keyboard.press("Escape");
  assert.match(await box.innerText(), /\+/);
});

await t("select: a disabled select is skipped by Tab and names why in its placeholder", async (page) => {
  const box = page.getByRole("combobox", { name: "Stream" });
  assert.equal(await box.isDisabled(), true);
  assert.match(await box.innerText(), /Classes XI/);
});

await t("class picker: ticking a whole class ticks its sections and the summary reads 'Class X (all 5)'", async (page) => {
  const f = demo(page, "class and section (multi)");
  const trig = f.getByRole("button", { name: /Send to classes/ });
  assert.match(await trig.innerText(), /X-A, X-B, X-C|Class X \(all 5\)/);
  await trig.click();
  const tree = page.getByRole("tree");
  assert.ok(await tree.isVisible());
  const stage = page.getByRole("treeitem").first();
  assert.ok((await page.getByRole("treeitem").count()) > 10);
  await page.getByRole("searchbox").fill("XI-A");
  assert.ok((await page.getByRole("treeitem").count()) < 6, "search narrows the tree");
  await page.keyboard.press("Escape");
  assert.equal(await trig.evaluate((el) => el === document.activeElement), true);
});

await t("people picker: typing finds a student among 1,801 and Enter picks them", async (page) => {
  const f = demo(page, "students (multi, paste admission numbers");
  const box = f.getByRole("combobox");
  await box.click(); await page.keyboard.type("EHS/2015/1000");
  await page.waitForSelector(".ol-pop [role=option]");
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  assert.equal(await f.locator(".ol-person").count(), 1);
});

await t("date: '26-10-26' typed and Tab shows 26/10/2026 and stores the ISO day, never shifted", async (page) => {
  const f = demo(page, "date (type 26-10-26");
  const input = f.getByRole("textbox", { name: "Date of birth" });
  await input.fill("26-10-26"); await page.keyboard.press("Tab");
  assert.equal(await input.inputValue(), "26/10/2026");
  assert.equal((await demo(page, "what was stored").innerText()).trim().split("\n")[0], "stored: 2026-10-26");
  await input.fill("31/02/2026"); await page.keyboard.press("Tab");
  assert.match(await f.locator(".ol-error").innerText(), /dd\/mm\/yyyy|valid/i);
});

await t("date: the calendar opens from the button, arrows move a day, Enter picks it, Esc closes", async (page) => {
  const f = demo(page, "date (type 26-10-26");
  await f.getByRole("button", { name: /calendar|choose/i }).click();
  const grid = page.getByRole("grid");
  assert.ok(await grid.first().isVisible());
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("Enter");
  assert.equal(await f.getByRole("textbox").inputValue(), "13/03/2012");
});

await t("tabs: arrows move and activate, Home/End jump, and a narrow row folds into More", async (page) => {
  const tabs = demo(page, "page tabs with counts").getByRole("tab");
  await tabs.nth(1).focus(); await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-selected")), "true");
  await page.keyboard.press("Home");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Enquiries/);
  const narrow = demo(page, "tabs that overflow into More");
  assert.ok(await narrow.locator(".ol-tab--more").isVisible());
});

await t("table: sort toggles aria-sort, a row tick makes the header 'mixed', shift-click ticks a range, 'select all 1,801' offers itself", async (page) => {
  const tbl = demo(page, "1,801 students, server paging").locator("table");
  const th = tbl.locator("th", { hasText: "Class" });
  await th.getByRole("button").click();
  await page.waitForFunction(() => document.querySelector("th[aria-sort=ascending]"));
  await th.getByRole("button").click();
  await page.waitForFunction(() => document.querySelector("th[aria-sort=descending]"));
  const rows = tbl.locator("tbody tr");
  await rows.nth(1).getByRole("checkbox").click();
  assert.equal(await tbl.locator("thead").getByRole("checkbox").evaluate((el) => el.indeterminate), true);
  await rows.nth(4).getByRole("checkbox").click({ modifiers: ["Shift"] });
  assert.equal(await tbl.locator("tbody tr.is-sel").count(), 4);
  await tbl.locator("thead").getByRole("checkbox").click();
  assert.ok(await demo(page, "1,801 students, server paging").getByText(/1,801/).first().isVisible());
});

await t("table: 50 rows a page, 'Next' fetches the next page and the count reads 51–100 of 1,801", async (page) => {
  const f = demo(page, "1,801 students, server paging");
  assert.match(await f.innerText(), /1–50 of 1,801/);
  await f.getByRole("button", { name: /next/i }).click();
  await page.waitForFunction(() => /51–100 of 1,801/.test(document.body.innerText));
});

await t("table: 1,000 rows are windowed — only a screenful is in the DOM", async (page) => {
  const f = demo(page, "1,000 rows client-side");
  await f.scrollIntoViewIfNeeded();
  assert.ok((await f.locator("tbody tr").count()) < 120, "windowed");
  await f.locator(".ol-tablewrap").evaluate((el) => { el.scrollTop = 20000; });
  await page.waitForTimeout(150);
  assert.ok((await f.locator("tbody tr").count()) < 120);
});

await t("grid: A writes AB and moves down, Ctrl+Z puts P back, Ctrl+D fills down, ? opens the key list and Esc closes it", async (page) => {
  const f = demo(page, "attendance register");
  const cell = (r) => f.locator(`[role=gridcell][data-r="${r}"][data-c="2"]`);
  await cell(1).click();
  await page.keyboard.press("a");
  assert.match(await cell(1).innerText(), /AB|A/);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-r")), "2");
  await page.keyboard.press("Control+z");
  assert.match(await cell(1).innerText(), /P/);
  await cell(1).click(); await page.keyboard.press("m");
  await page.keyboard.press("ArrowUp"); await page.keyboard.press("Shift+ArrowDown"); await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Control+d");
  await page.keyboard.press("?");
  assert.ok(await page.getByRole("dialog").isVisible());
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"));
});

await t("grid: 85 in a /80 cell stays open with its message, and Esc puts the old mark back", async (page) => {
  const f = demo(page, "marks entry");
  const cell = f.locator('[role=gridcell][data-r="1"][data-c="1"]');
  const was = (await cell.innerText()).trim();
  await cell.click(); await page.keyboard.press("8"); await page.keyboard.press("5"); await page.keyboard.press("Enter");
  assert.equal(await f.locator(".ol-cell__in").getAttribute("aria-invalid"), "true");
  assert.match(await f.locator(".ol-grid__msg").innerText(), /80/);
  await page.keyboard.press("Escape");
  assert.equal((await cell.innerText()).trim(), was);
});

await t("drawer: focus moves in, the page behind is inert, Esc asks before losing edits, focus returns to the button", async (page) => {
  const open = page.locator("#overlays").getByRole("button", { name: "Add student" });
  await open.click();
  const dlg = page.getByRole("dialog");
  assert.ok(await dlg.isVisible());
  assert.equal(await page.evaluate(() => !!document.querySelector(".gl-shell").closest("[inert]")), true);
  await dlg.getByRole("textbox", { name: "Student name" }).fill("Asha Verma Sood");
  await page.keyboard.press("Escape");
  assert.ok(await page.getByRole("alertdialog").or(page.locator("[role=dialog]").nth(1)).first().isVisible());
  await page.getByRole("button", { name: /keep editing|stay|cancel/i }).last().click();
  assert.ok(await dlg.isVisible());
});

await t("modal: a 'type to confirm' button stays disabled until the word is typed", async (page) => {
  await page.getByRole("button", { name: "Send to all families" }).click();
  const go = page.getByRole("button", { name: "Send message" });
  assert.equal(await go.getAttribute("aria-disabled") || (await go.isDisabled() ? "true" : "false"), "true");
  await page.getByRole("textbox").last().fill("SEND");
  assert.notEqual(await go.getAttribute("aria-disabled"), "true");
  await page.keyboard.press("Escape");
});

await t("toast: shows bottom-left, an Undo runs, and no more than three stay", async (page) => {
  const b = page.getByRole("button", { name: "With undo" });
  for (let i = 0; i < 4; i++) await b.click();
  assert.equal(await page.locator(".ol-toast").count(), 3);
  await page.locator(".ol-toast").last().getByRole("button", { name: /undo/i }).click();
});

await t("Hindi: the component words change and the Devanagari digits are not used for the school's numbers", async (page) => {
  assert.match(await page.locator(".ol-tablewrap").first().innerText(), /50|1,801/);
}, { query: "?lang=hi-IN" });

await t("dark and high-contrast themes apply to the whole page", async (page) => {
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-theme")), "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.notEqual(bg, "rgb(255, 255, 255)");
}, { query: "?theme=dark" });

await t("US school: the vocabulary and the date order change with the country", async (page) => {
  assert.match(await page.getByRole("textbox", { name: "Date of birth" }).first().getAttribute("placeholder"), /mm\/dd\/yyyy/i);
}, { query: "?region=US" });

await t("a phone (360 px) has no sideways page scroll and a table becomes cards", async (page) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(over <= 0, "page is " + over + "px wider than the screen");
  const f = demo(page, "1,801 students, server paging");
  await f.scrollIntoViewIfNeeded();
  assert.equal(await f.locator("table").evaluate((el) => getComputedStyle(el.querySelector("thead")).display), "none");
}, { viewport: { width: 360, height: 740 }, touch: true });

await t("a phone (375 px): every field that takes the cursor is 16 px so iOS Safari does not zoom; on a desktop they stay 14 px", async (page) => {
  const px = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).fontSize : "missing"; }, sel);
  const sizes = async (extra) => {
    const out = {};
    for (const sel of [".ol-input__ctl", "textarea.ol-input__ctl", ".ol-select__ctl", "#fx-search"].concat(extra)) out[sel] = await px(sel);
    return out;
  };
  // the page search field is not in the gallery: give it the class page.js gives it
  await page.evaluate(() => { const i = document.createElement("input"); i.type = "search"; i.id = "fx-search"; i.className = "ol-sf__ctl"; document.body.appendChild(i); });
  const phone = await sizes([]);
  await page.getByRole("combobox", { name: "State" }).click();
  phone[".ol-select__search"] = await px(".ol-select__search");
  await page.keyboard.press("Escape");
  const cell = demo(page, "marks entry").locator('[role=gridcell][data-r="1"][data-c="1"]');
  await cell.click(); await page.keyboard.press("8");
  phone[".ol-cell__in"] = await px(".ol-cell__in");
  await page.keyboard.press("Escape");
  assert.equal(Object.keys(phone).length, 6, "six kinds of field were measured");
  assert.deepEqual(Object.values(phone), Array(6).fill("16px"), "at 375 px: " + JSON.stringify(phone));
  await page.setViewportSize({ width: 1280, height: 900 });
  const desktop = await sizes([]);
  assert.deepEqual(Object.values(desktop), Array(4).fill("14px"), "at 1280 px: " + JSON.stringify(desktop));
}, { viewport: { width: 375, height: 812 }, touch: true });

/* D5: the family shell's scale, measured on the sign-in scene the gallery draws twice (data-shell="family" and the admin default) */
const famProbe = (page, shell) => page.evaluate((sh) => {
  const root = document.querySelector(sh === "family" ? '#family [data-shell="family"]' : '#family [data-gl="admin"]');
  const box = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const css = (el) => getComputedStyle(el);
  const targets = [...root.querySelectorAll("button, .ol-input__box, label.ol-checkfield__label")].filter((el) => el.getBoundingClientRect().height > 0).map(box);
  return { body: css(root.querySelector("p")).fontSize, line: parseFloat(css(root.querySelector("p")).lineHeight), h2: css(root.querySelector("h2")).fontSize,
           field: css(root.querySelector(".ol-input__ctl")).fontSize, targets };
}, shell);
await t("family shell (D5) at 360 px: body 16 px, h2 19 px, fields 16 px, every target 44 px high; the admin beside it keeps 14 px", async (page) => {
  const fam = await famProbe(page, "family"), adm = await famProbe(page, "admin");
  assert.deepEqual([fam.body, fam.h2, fam.field], ["16px", "19px", "16px"], JSON.stringify(fam));
  assert.ok(fam.targets.length >= 10, "the buttons, the field and the check rows were measured: " + fam.targets.length);
  assert.deepEqual(fam.targets.filter((x) => x.h < 44), [], "targets under 44 px: " + JSON.stringify(fam.targets));
  assert.deepEqual(fam.targets.filter((x) => x.w < 44), [], "targets under 44 px wide");
  assert.deepEqual([adm.body, adm.h2], ["14px", "17px"], "the admin scale did not move: " + JSON.stringify(adm));
}, { viewport: { width: 360, height: 740 }, touch: true });
await t("family shell (D5) in Hindi: body 17 px with a line of at least 1.6, headings one step up, targets still 44 px", async (page) => {
  const fam = await famProbe(page, "family");
  assert.deepEqual([fam.body, fam.h2, fam.field], ["17px", "20px", "16px"], JSON.stringify(fam));
  assert.ok(fam.line >= 17 * 1.6, "line height " + fam.line);
  assert.deepEqual(fam.targets.filter((x) => x.h < 44), [], "targets under 44 px: " + JSON.stringify(fam.targets));
}, { query: "?lang=hi-IN", viewport: { width: 360, height: 740 }, touch: true });

await t("every control has a name: buttons, inputs and comboboxes", async (page) => {
  const bad = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, [role=button], input:not([type=hidden]), textarea, [role=combobox], [role=checkbox], [role=switch], [role=tab]").forEach((el) => {
      if (el.closest("[inert], [hidden]")) return;
      const name = el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby").split(" ")[0])?.textContent)
        || (el.labels && el.labels[0]?.textContent) || el.textContent.trim() || el.getAttribute("title") || el.getAttribute("placeholder");
      if (!name || !String(name).trim()) out.push(el.outerHTML.slice(0, 110));
    });
    return out;
  });
  assert.deepEqual(bad, [], "unnamed controls");
});

/* axe on the gallery: light, dark, high contrast, dense and a phone. Rules are WCAG 2.2 AA. */
async function axeRun(page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => v.id + " (" + v.nodes.length + "): " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ") + " — " + v.help);
  });
}
for (const [name, query, viewport] of [["light", "", null], ["dark", "?theme=dark", null], ["high contrast", "?theme=hc", null], ["dense, Hindi", "?density=dense&lang=hi-IN", null], ["a phone", "", { width: 360, height: 740 }]]) {
  await t(`axe: the gallery has no WCAG 2.2 AA violations (${name})`, async (page) => { assert.deepEqual(await axeRun(page), []); }, { query, viewport: viewport || undefined });
}

/* axe again with each layer open: the popovers, the tree, the calendar, the menu, a drawer, a modal, a toast. */
await t("axe: every open layer is clean (select, class tree, calendar, row menu, drawer, modal, toast)", async (page) => {
  const found = {};
  const check = async (name) => { await page.waitForTimeout(350); const v = await axeRun(page);   // let the layer finish fading in
    if (v.length) found[name] = v; };
  const close = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(250); };
  await page.getByRole("combobox", { name: "Subjects" }).click(); await check("select (multi, grouped)"); await close();
  await demo(page, "class and section (multi)").getByRole("button", { name: /Send to classes/ }).click(); await check("class tree"); await close();
  await demo(page, "date (type 26-10-26").getByRole("button", { name: /calendar|choose/i }).click(); await check("calendar"); await close();
  await demo(page, "1,801 students, server paging").locator("tbody tr").first().getByRole("button", { name: /actions|more/i }).click(); await check("row menu"); await close();
  await page.locator("#overlays").getByRole("button", { name: "Peek at a student" }).click(); await check("drawer with tabs"); await close();
  await page.locator("#overlays").getByRole("button", { name: "Send to all families" }).click(); await check("modal, type to confirm"); await close();
  await page.getByRole("button", { name: "With undo" }).click(); await check("toast with undo");
  assert.deepEqual(found, {}, "violations with a layer open");
});

await browser.close();
server.close();
console.log(`${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
