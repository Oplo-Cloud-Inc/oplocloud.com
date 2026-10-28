#!/usr/bin/env node
/* ==========================================================================
   The Directory at the size of a real school (E7):  how long GET /directory/students takes with 1,801 children and a
   term of whole-day marks behind them, and how long an export of every row takes.

     API=http://localhost:8787/api/v1 ORIGIN=http://localhost:8123 CRED=/path/credentials.json node api/scripts/bench-directory.mjs

   Needs the school of seed-scale.mjs (bash api/scripts/dev.sh scale). Signs in as the school's administrator, asks for
   each page the console asks for a few times, and prints the minimum, median, 95th percentile and slowest, against the budget:

     a page of the list   p95 <= 600 ms   (PAGE_BUDGET_MS)
     the export, all rows p95 <= 5 s      (EXPORT_BUDGET_MS)

   The time is the one the caller sees, from request to the last byte of the answer; on this computer that is the server's
   time and the local database's, so run it again with API= pointing at the deployed API before calling a number final.
   It writes one audit row for every export it asks for, so point it at a database nobody reads the log of.

     RUNS       requests per page (20)        EXPORT_RUNS   exports (5)        WARMUP   requests dropped first (3)
   Exits 1 and says what to do when a budget is missed.  Numbers and the reading of them: docs/perf/directory-bench.md
   ========================================================================== */
import { person, cred, API } from "./lib-prove.mjs";

const RUNS = Number(process.env.RUNS || 20), EXPORT_RUNS = Number(process.env.EXPORT_RUNS || 5), WARMUP = Number(process.env.WARMUP || 3);
const PAGE_BUDGET_MS = Number(process.env.PAGE_BUDGET_MS || 600), EXPORT_BUDGET_MS = Number(process.env.EXPORT_BUDGET_MS || 5000);
const SCHOOL = 1801;   // the size the budget is for

const admin = person("admin");
await admin.login(cred().email, cred().password);

const fail = (what, fix) => { console.log(`RESULT: fail ${what}\nfix: ${fix}`); process.exit(1); };

// The school must be the size the budget is for, or the numbers say nothing.
const first = await admin.get("/directory/students?size=1");
const pulse = await admin.get("/register/pulse?days=120");
const marks = pulse.days.reduce((a, d) => a + d.marked, 0);
if (first.total < SCHOOL || pulse.days.length < 60)
  fail(`the school is too small to measure: ${first.total} children and ${pulse.days.length} days of marks in the last 120 days (the budget is for ${SCHOOL} and a term)`,
    "load the real-size school: bash api/scripts/dev.sh scale, then run this against it (see docs/perf/directory-bench.md)");

// The pages the console asks for: the list as it opens, a section, the search box, the attendance chip, and the list sorted by attendance.
const section = (await admin.get("/india/classes")).classes[0].label;
const PAGES = [
  ["the list as it opens", ""],
  ["one section", `class=${encodeURIComponent(section)}`],
  ["a name searched", "q=singh"],
  ["attendance under 75%", "attendance=under-75"],
  ["sorted by attendance, page 3", "sort=attendance&dir=desc&page=3"]
];

const ms = (n) => (n < 10 ? n.toFixed(1) : String(Math.round(n))).padStart(6) + " ms";
const p95 = (xs) => [...xs].sort((a, b) => a - b)[Math.ceil(0.95 * xs.length) - 1];
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function time(path, runs) {
  const t = [];
  for (let i = 0; i < WARMUP + runs; i++) {
    const t0 = performance.now(), r = await admin.try("GET", path);
    const took = performance.now() - t0;
    if (r.status !== 200) fail(`GET ${path} answered ${r.status}`, JSON.stringify(r.body).slice(0, 200));
    if (i >= WARMUP) t.push(took);
  }
  return t;
}

console.log(`Directory bench: ${first.total} children, ${pulse.days.length} school days of marks in the last 120 (${marks} whole-day marks), ${API}`);
console.log(`  ${"request".padEnd(32)}${"runs".padStart(5)}${"min".padStart(10)}${"median".padStart(10)}${"p95".padStart(10)}${"slowest".padStart(10)}`);
let worst = 0;
const row = (name, t) => console.log(`  ${name.padEnd(32)}${String(t.length).padStart(5)}${ms(Math.min(...t))}${ms(med(t))}${ms(p95(t))}${ms(Math.max(...t))}`);
for (const [name, q] of PAGES) {
  const t = await time("/directory/students" + (q ? "?" + q : ""), RUNS);
  row(name, t); worst = Math.max(worst, p95(t));
}
const out = await time("/directory/students/export", EXPORT_RUNS);
row(`export of all ${first.total} rows`, out);
const exportP95 = p95(out);

const slow = [];
if (worst > PAGE_BUDGET_MS) slow.push(`a page of the list took ${Math.round(worst)} ms at the 95th percentile (budget ${PAGE_BUDGET_MS} ms)`);
if (exportP95 > EXPORT_BUDGET_MS) slow.push(`the export took ${(exportP95 / 1000).toFixed(1)} s (budget ${EXPORT_BUDGET_MS / 1000} s)`);
if (slow.length) fail(slow.join("; "), "keep a per-student attendance summary updated when a register is submitted, in place of counting the term's marks on every request (api/src/repo/d1.js watchCounts), and cache the list per school, scope and data version for 30 seconds; see docs/perf/directory-bench.md");
console.log(`RESULT: ok the slowest page's 95th percentile is ${Math.round(worst)} ms (budget ${PAGE_BUDGET_MS} ms) and the export's ${(exportP95 / 1000).toFixed(2)} s (budget ${EXPORT_BUDGET_MS / 1000} s)`);

