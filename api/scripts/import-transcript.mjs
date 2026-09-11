#!/usr/bin/env node
/* ==========================================================================
   Import a previous school's transcript into a student's record.

     OPLO_ADMIN_PASSWORD=... node api/scripts/import-transcript.mjs <file.json> \
       --student student@example.com --admin you@example.com \
       [--track 21.5] [--program "High School Silver Program"] [--grade 11] \
       [--api https://api.oplocloud.com/api/v1]

   Everything goes through the public API as a signed-in administrator, so the
   same permission rules apply as on the console — this script has no side
   door into the database.

   The transcript file itself should live outside the repository. It is a
   student's academic record, and the place for it is the database, behind
   sign-in; a copy committed to git would be public forever.
   ========================================================================== */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i > -1 && args[i + 1] ? args[i + 1] : dflt;
};
const API = opt("api", process.env.OPLO_API || "http://127.0.0.1:8787/api/v1");
const student = opt("student");
const admin = opt("admin");
const password = process.env.OPLO_ADMIN_PASSWORD;

if (!file || !student || !admin || !password) {
  console.error("usage: OPLO_ADMIN_PASSWORD=... node import-transcript.mjs <file.json> " +
                "--student <email> --admin <email> [--track 21.5] [--program name] [--grade 11]");
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf8"));
let cookie = "";

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const e = (json && json.error) || {};
    throw new Error(`${method} ${path} → ${res.status} ${e.code || ""}: ${e.message || text}`);
  }
  return json;
}

const me = await call("POST", "/auth/login", { email: admin, password });
console.log("signed in as", me.account.name);

const { accounts } = await call("GET", "/accounts");
const who = accounts.find((a) => (a.email || "").toLowerCase() === student.toLowerCase());
if (!who) { console.error("No account for", student, "— create it on the People tab first."); process.exit(1); }

await call("PUT", `/accounts/${who.id}/program`, {
  track: opt("track", "21.5"),
  program: opt("program", null),
  gradeLevel: Number(opt("grade", data.source && data.source.gradeLevel) || 0) || null
});
const { record } = await call("POST", `/accounts/${who.id}/transcripts`, data);
console.log(`imported ${record.courses} courses and ${record.exams} exams from ${record.school}` +
            ` (${record.kind}, ${record.status}) for ${who.name}`);

const { graduation: g } = await call("GET", `/graduation?accountId=${who.id}`);
console.log(`\n${g.totals.percent}% of the ${g.track.total}-credit ${g.track.name.toLowerCase()}`);
console.log(`transfer: ${g.totals.transferConservative}–${g.totals.transferEstimate} credits` +
            ` · still to earn at EHS: ${g.totals.planAtEhs}`);
for (const a of g.areas) {
  console.log(`  ${a.name.padEnd(20)} ${String(a.applied).padStart(6)} / ${a.required}` +
              `  ${a.complete ? "done" : "at EHS: " + a.planAtEhs}`);
}
await call("POST", "/auth/logout");
