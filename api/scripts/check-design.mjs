// DESIGN.md says what the code does (D1): node api/scripts/check-design.mjs
//   DES001 a token family of learn/tokens.css that DESIGN.md does not name
//   DES002 a template, T1 to T9, that has no row in DESIGN.md
//   DES003 a file of learn/ui, or a C-number of its catalogue, that DESIGN.md does not name
//   DES004 a browser-surface rule missing from learn/base.css
//   DES005 a module's phone answer (learn/shell/routes.js) that DESIGN.md does not state the same way
//   DES006 a component of the catalogue with no example in learn/README.md (Components, option by option)
// OL_DESIGN_MD points at another copy of DESIGN.md, OL_LEARN_ROOT at another copy of learn/ (the fixtures of test-lint.mjs).
import fs from "node:fs";
import path from "node:path";
import { lint, rd, lineOf, jsIn, LEARN } from "./lib-lint.mjs";

const L = lint("");
const doc = fs.readFileSync(process.env.OL_DESIGN_MD || path.join(LEARN, "..", "DESIGN.md"), "utf8");

// DES001: the first word of every custom property in tokens.css is a family (--c-text → --c-, --ctl-h → --ctl-)
const tokens = rd("tokens.css");
const families = new Map();
for (const m of tokens.matchAll(/^\s*--([a-z0-9]+)-[a-z0-9-]*\s*:/gm)) if (!families.has(m[1])) families.set(m[1], lineOf(tokens, m.index));
for (const [f, line] of families) {
  if (!doc.includes(`--${f}-`)) L.bad("DES001", "learn/tokens.css", line, `token family --${f}-* is not in DESIGN.md`, `add a row to the token table in DESIGN.md that names --${f}-* and says what it holds`);
}

// DES002
for (let n = 1; n <= 9; n++) {
  if (!new RegExp(`\\|\\s*T${n}\\s*\\|`).test(doc)) L.bad("DES002", "DESIGN.md", 1, `template T${n} has no row in DESIGN.md`, `add "| T${n} | name | use it for | built |" to the template table in DESIGN.md`);
}

// DES003
const files = jsIn("ui").map((f) => path.basename(f));
for (const f of files) {
  if (!doc.includes(f)) L.bad("DES003", "DESIGN.md", 1, `learn/ui/${f} is not named in DESIGN.md`, `add learn/ui/${f} to the component table (or to the plumbing paragraph under it) in DESIGN.md`);
}
const catalogue = rd("ui/index.js");
const ids = new Set([...catalogue.matchAll(/id:\s*"(C-\d+)"/g)].map((m) => m[1]));
for (const id of ids) {
  if (!doc.includes(id)) L.bad("DES003", "learn/ui/index.js", lineOf(catalogue, catalogue.indexOf(`"${id}"`)), `${id} is in the catalogue and not in DESIGN.md`, `add a row for ${id} to the component table in DESIGN.md`);
}

// DES004
const base = rd("base.css");
const surfaces = ["::selection", "caret-color", "accent-color", "scrollbar-color"];
for (const s of surfaces) {
  if (!base.includes(s)) L.bad("DES004", "learn/base.css", 1, `no ${s} rule: the browser paints that itself, in its own colours`, `add a ${s} rule to base.css from the tokens (see "Browser surfaces" in base.css)`);
}

// DES005: the route table is a browser script; read it the way test-routes.mjs does
const routes = rd("shell/routes.js");
const win = {};
new Function("window", routes)(win);
const modules = win.OL.routes.MODULES;
for (const m of modules) {
  const at = lineOf(routes, routes.indexOf(`key: "${m.key}"`));
  const row = doc.match(new RegExp("\\|\\s*`" + m.key + "`\\s*\\|\\s*(page|cards)\\s*\\|"));
  if (!row) L.bad("DES005", "learn/shell/routes.js", at, `module ${m.key} has no row in the phone table of DESIGN.md`, `add "| \`${m.key}\` | ${m.phone} | … |" to the phone table in DESIGN.md`);
  else if (row[1] !== m.phone) L.bad("DES005", "learn/shell/routes.js", at, `module ${m.key} is "${m.phone}" in routes.js and "${row[1]}" in DESIGN.md`, `make the two agree: change the phone table row in DESIGN.md or phone: "${row[1]}" in routes.js`);
}

// DES006: the README shows each component's options and one call, OL.ui.<key>.…
const readme = rd("README.md");
const keys = [...catalogue.matchAll(/key:\s*"(\w+)"/g)];
for (const m of keys) {
  if (!readme.includes(`OL.ui.${m[1]}.`)) L.bad("DES006", "learn/ui/index.js", lineOf(catalogue, m.index), `component ${m[1]} has no example in learn/README.md`, `add its options and one example, OL.ui.${m[1]}.render({ … }), to "Components, option by option" in learn/README.md`);
}

L.finish(`ok  ${families.size} token families, 9 templates, ${files.length} component files and ${ids.size} C-numbers, ${surfaces.length} browser surfaces, ${modules.length} phone answers: all in DESIGN.md; ${keys.length} components with an example in the README`);
