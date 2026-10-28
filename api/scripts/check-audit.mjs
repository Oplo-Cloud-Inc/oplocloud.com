// Audit coverage (O17): node api/scripts/check-audit.mjs
//
//   AUD001  a write route of a migrated module is in neither AUDITED nor NOT_YET (api/scripts/audit-routes.mjs)
//   AUD002  the registry names a route that is not in src/index.js, or an audit action no code writes
//   AUD003  an AUDITED route has no proof that asserts its audit row: audited(who, "METHOD /path", { action }, write)
//
// The registry says which write routes must leave an audit row; lib-prove.mjs audited() is what makes a proof fail when one does
// not; this makes sure no route is left without either. It reads the repository, changes nothing, and speaks like the other lints (X3).
// OL_AUDIT_ROUTES, OL_AUDIT_INDEX, OL_AUDIT_SRC and OL_AUDIT_PROOFS point it at other copies (test-lint.mjs).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { lint, lineOf } from "./lib-lint.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REGISTRY = process.env.OL_AUDIT_ROUTES || path.join(HERE, "audit-routes.mjs");
const INDEX = process.env.OL_AUDIT_INDEX || path.join(HERE, "../src/index.js");
const SRC = process.env.OL_AUDIT_SRC || path.join(HERE, "../src");
const PROOFS = process.env.OL_AUDIT_PROOFS || HERE;
const { COVERED, AUDITED, NOT_YET } = await import(pathToFileURL(REGISTRY).href);
const L = lint("api/");

const indexText = fs.readFileSync(INDEX, "utf8");
const routes = [...indexText.matchAll(/^\s*\["(GET|POST|PUT|PATCH|DELETE)",\s*"\/api\/v1(\/[^"]*)"/gm)].map((m) => ({ key: `${m[1]} ${m[2]}`, method: m[1], path: m[2], line: lineOf(indexText, m.index) }));
const known = new Set(routes.map((r) => r.key));
const under = (p) => COVERED.some((c) => p === c || p.startsWith(c + "/"));

for (const r of routes)
  if (r.method !== "GET" && under(r.path) && !(r.key in AUDITED) && !(r.key in NOT_YET))
    L.bad("AUD001", "src/index.js", r.line, `${r.key} writes data for a migrated module and is in neither AUDITED nor NOT_YET`,
      "add it to AUDITED in api/scripts/audit-routes.mjs with the audit action it writes, and wrap the proof's call in audited(); or to NOT_YET with the reason no migrated page calls it");

const registryText = fs.readFileSync(REGISTRY, "utf8");
const at = (key) => lineOf(registryText, Math.max(0, registryText.indexOf(`"${key}"`)));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
const code = walk(SRC).map((f) => fs.readFileSync(f, "utf8")).join("\n");
for (const [list, name] of [[AUDITED, "AUDITED"], [NOT_YET, "NOT_YET"]])
  for (const key of Object.keys(list)) if (!known.has(key)) L.bad("AUD002", "scripts/audit-routes.mjs", at(key), `${name} names ${key}, which is not a route in src/index.js`, "correct the route, or remove the entry if the route is gone");
for (const [key, want] of Object.entries(AUDITED))
  for (const action of [].concat(want)) if (!code.includes(`"${action}"`)) L.bad("AUD002", "scripts/audit-routes.mjs", at(key), `${key} should write ${action}, and no code in src/ does`, "correct the action, or make the route write it");

const proofs = fs.readdirSync(PROOFS).filter((f) => /^prove-.*\.mjs$/.test(f)).map((f) => fs.readFileSync(path.join(PROOFS, f), "utf8")).join("\n");
const asserted = new Map();
for (const m of proofs.matchAll(/audited\(\s*[\w.]+\s*,\s*"([A-Z]+ [^"]+)"\s*,\s*\{\s*action:\s*"([^"]+)"/g)) (asserted.get(m[1]) || asserted.set(m[1], new Set()).get(m[1])).add(m[2]);
for (const [key, want] of Object.entries(AUDITED)) {
  const seen = asserted.get(key);
  if (!seen) L.bad("AUD003", "scripts/audit-routes.mjs", at(key), `no proof asserts the audit row of ${key}`, `wrap the call in audited(admin, "${key}", { action: "${[].concat(want)[0]}" }, () => …) in a prove-*.mjs`);
  else if (![...seen].some((a) => [].concat(want).includes(a))) L.bad("AUD003", "scripts/audit-routes.mjs", at(key), `the proofs assert ${[...seen].join(", ")} for ${key}, and the registry says ${[].concat(want).join(" or ")}`, "make the two agree");
}

const n = Object.keys(AUDITED).length;
L.finish(`  ok  ${n} audited write routes, ${Object.keys(NOT_YET).length} not yet: each is a route in src/index.js, writes its action, and has a proof that asserts the row`);
