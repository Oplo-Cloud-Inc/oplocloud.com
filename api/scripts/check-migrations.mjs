// Migration numbers (O13): node api/scripts/check-migrations.mjs
//
//   MIG001  two migrations share a number: parallel branches each took the next one, and the second to merge renumbers
//   MIG002  a migration numbered 0071 or later drops or renames something. The API is deployed after the migration
//           (migrate first, deploy second), so for a while the previous API runs on the new schema: a migration only adds
//   MIG003  a file in the folder is not named NNNN_name.sql, so the order it is applied in is not the order it was meant for
//
// Reads api/migrations (OL_MIGRATIONS_DIR points at another copy), changes nothing, and speaks like the other lints (X3).
import fs from "node:fs";
import path from "node:path";
import { lint, lineOf } from "./lib-lint.mjs";

const DIR = process.env.OL_MIGRATIONS_DIR ? path.resolve(process.env.OL_MIGRATIONS_DIR) : path.resolve(new URL("../migrations", import.meta.url).pathname);
const ADDITIVE_FROM = 71; // 0070 and everything before it were written before the rule
const L = lint("api/migrations/");

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
const numbered = files.filter((f) => /^\d{4}_.+\.sql$/.test(f));
let free = Math.max(0, ...numbered.map((f) => Number(f.slice(0, 4)))) + 1;
const nextNumber = () => String(free++).padStart(4, "0");

for (const f of files) if (!numbered.includes(f)) L.bad("MIG003", f, 1, "is not named NNNN_name.sql", `rename it to ${nextNumber()}_${f.replace(/^\d*_?/, "")}`);

const first = new Map();
for (const f of numbered) {
  const n = f.slice(0, 4);
  if (!first.has(n)) { first.set(n, f); continue; }
  L.bad("MIG001", f, 1, `shares the number ${n} with ${first.get(n)}`, `rename it to ${nextNumber()}_${f.slice(5)} (the next free number), or merge the two files`);
}

/* Comments are blanked, not removed, so a line number still points at the line. */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/--[^\n]*/g, (m) => " ".repeat(m.length));
const DESTRUCTIVE = /\b(?:DROP\s+(?:TABLE|COLUMN)|RENAME\s+(?:TO|COLUMN))\b/gi;
for (const f of numbered.filter((x) => Number(x.slice(0, 4)) >= ADDITIVE_FROM)) {
  const raw = fs.readFileSync(path.join(DIR, f), "utf8");
  if (/--\s*allow-destructive:\s*\S/.test(raw)) continue;
  for (const m of code(raw).matchAll(DESTRUCTIVE))
    L.bad("MIG002", f, lineOf(raw, m.index), `${m[0].replace(/\s+/g, " ")} is not additive; the previous API still runs on this schema until it is deployed`,
      "add the new column or table here and remove the old one in a later migration, once no deployed API uses it; if that is really what is meant, put '-- allow-destructive: <why>' in the file");
}

L.finish(`  ok  ${files.length} migrations, ${files[0].slice(0, 4)} to ${files[files.length - 1].slice(0, 4)}: none shares a number, none from ${String(ADDITIVE_FROM).padStart(4, "0")} on drops or renames`);
