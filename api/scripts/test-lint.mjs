// The lints catch what they say they catch: node api/scripts/test-lint.mjs
//
// check-ui.mjs, check-i18n.mjs, check-migrations.mjs, check-design.mjs, check-audit.mjs and tools/stamp.py --check are run on a copy of
// learn/ (or of api/migrations, DESIGN.md, or api/src with its proofs) with one thing wrong at a time.
// Every code has a fixture: the run must exit 1, print the problem line, a fix: line and a docs: line, and end with
// RESULT: fail. The untouched copy must pass. A code with no fixture, or none in learn/README.md, fails this test:
// a lint that nobody has seen fail is a lint nobody can trust.
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MODULES } from "./lib-lint.mjs";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const LEARN = path.join(ROOT, "learn");
const HERE = path.dirname(new URL(import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-lint-"));
const stampDir = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-stamp-"));
const migDir = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-mig-"));
const designDir = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-design-"));
fs.copyFileSync(path.join(ROOT, "DESIGN.md"), path.join(designDir, "DESIGN.md"));
const auditDir = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-audit-"));
fs.cpSync(path.join(ROOT, "api", "src"), path.join(auditDir, "src"), { recursive: true });
fs.mkdirSync(path.join(auditDir, "proofs"));
for (const f of fs.readdirSync(path.dirname(new URL(import.meta.url).pathname)).filter((x) => /^prove-.*\.mjs$/.test(x))) fs.copyFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), f), path.join(auditDir, "proofs", f));
fs.copyFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "audit-routes.mjs"), path.join(auditDir, "audit-routes.mjs"));
fs.cpSync(path.join(ROOT, "api", "migrations"), migDir, { recursive: true });
for (const d of ["ui", "i18n", "shell", ...MODULES]) fs.cpSync(path.join(LEARN, d), path.join(tmp, d), { recursive: true });
for (const f of ["base.css", "tokens.css", ".assetsignore", "_ui.html", "README.md"]) fs.copyFileSync(path.join(LEARN, f), path.join(tmp, f));

const run = (cmd, args, root, env = {}) => {
  try { return { code: 0, out: execFileSync(cmd, args, { env: { ...process.env, OL_LEARN_ROOT: root, ...env }, encoding: "utf8", stdio: "pipe" }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout || "") + String(e.stderr || "") }; }
};
const lint = (script, ...flags) => run("node", [path.join(HERE, script), ...flags], tmp);
const stamp = (...flags) => run("python3", [path.join(ROOT, "tools", "stamp.py"), ...flags], stampDir);
const mig = () => run("node", [path.join(HERE, "check-migrations.mjs")], tmp, { OL_MIGRATIONS_DIR: migDir });
const design = () => run("node", [path.join(HERE, "check-design.mjs")], tmp, { OL_DESIGN_MD: path.join(designDir, "DESIGN.md") });
const audit = () => run("node", [path.join(HERE, "check-audit.mjs")], tmp, { OL_AUDIT_ROUTES: path.join(auditDir, "audit-routes.mjs"), OL_AUDIT_INDEX: path.join(auditDir, "src", "index.js"), OL_AUDIT_SRC: path.join(auditDir, "src"), OL_AUDIT_PROOFS: path.join(auditDir, "proofs") });
const at = (f) => path.join(tmp, f);
const seen = new Set();
let n = 0;
const ok = (what) => { n++; console.log("  ok  " + what); };

/* The run failed with exit 1, and the first problem with this code has its three lines and the closing RESULT line. */
function expectProblem(name, code, r, { line, fix }) {
  assert.equal(r.code, 1, name + ": the exit code should be 1\n" + r.out);
  const lines = r.out.split("\n");
  const i = lines.findIndex((l) => l.startsWith(code + " "));
  assert.ok(i >= 0, `${name}: the output should hold a ${code} problem\n${r.out}`);
  assert.match(lines[i], line, `${name}: the problem line\n${lines[i]}`);
  assert.match(lines[i + 1], fix, `${name}: the fix line\n${lines[i + 1]}`);
  assert.equal(lines[i + 2], "docs: learn/README.md#" + code, name + ": the docs line");
  assert.match(lines.filter(Boolean).pop(), /^RESULT: fail [1-9]\d* problems$/, name + ": the last line");
  seen.add(code);
}
async function fixture(code, name, { script, file, add, edit, line, fix }) {
  const was = fs.existsSync(at(file)) ? fs.readFileSync(at(file), "utf8") : null;
  const next = edit ? edit(was) : (was || "") + add;
  assert.notEqual(next, was, name + ": the fixture changes nothing");
  fs.writeFileSync(at(file), next);
  try { expectProblem(name, code, lint(script), { line, fix }); }
  finally { if (was === null) fs.rmSync(at(file)); else fs.writeFileSync(at(file), was); }
  ok(code + " " + name);
}
/* check-migrations.mjs on a folder of migrations with these files added */
async function migration(code, name, files, line, fix) {
  for (const [f, body] of Object.entries(files)) fs.writeFileSync(path.join(migDir, f), body);
  try { expectProblem(name, code, mig(), { line, fix }); }
  finally { for (const f of Object.keys(files)) fs.rmSync(path.join(migDir, f)); }
  ok(code + " " + name);
}
/* check-design.mjs with DESIGN.md (or a file of the learn/ copy) changed: `edit` takes the text and returns the new text */
async function designed(code, name, { file, edit, line, fix }) {
  const target = file ? at(file) : path.join(designDir, "DESIGN.md");
  const was = fs.readFileSync(target, "utf8"), next = edit(was);
  assert.notEqual(next, was, name + ": the fixture changes nothing");
  fs.writeFileSync(target, next);
  try { expectProblem(name, code, design(), { line, fix }); }
  finally { fs.writeFileSync(target, was); }
  ok(code + " " + name);
}
/* check-audit.mjs with a file of the api copy changed (a path inside it): `edit` takes the text and returns the new text */
async function auditing(code, name, { file, edit, line, fix }) {
  const target = path.join(auditDir, file), was = fs.readFileSync(target, "utf8"), next = edit(was);
  assert.notEqual(next, was, name + ": the fixture changes nothing");
  fs.writeFileSync(target, next);
  try { expectProblem(name, code, audit(), { line, fix }); }
  finally { fs.writeFileSync(target, was); }
  ok(code + " " + name);
}
const CSS = "students/students.css", JS = "students/fixture.js";
const css = (decl) => `\n.ol-students-fx { ${decl} }\n`;
const sheet = (code, name, decl, line, fix) => fixture(code, name, { script: "check-ui.mjs", file: CSS, add: css(decl), line: new RegExp("^" + code + " learn/students/students\\.css:\\d+ " + line), fix: new RegExp("^fix: " + fix) });
const script = (code, name, add, line, fix, check = "check-ui.mjs", file = JS) => fixture(code, name, { script: check, file, add, line: new RegExp("^" + code + " learn/" + file.replace(/\./g, "\\.") + ":" + line), fix: new RegExp("^fix: " + fix) });
const pack = (code, name, file, edit, line, fix) => fixture(code, name, { script: "check-i18n.mjs", file, edit, line: new RegExp("^" + code + " learn/" + file.replace(/\./g, "\\.") + " " + line), fix: new RegExp("^fix: " + fix) });

try {
  for (const s of ["check-ui.mjs", "check-i18n.mjs"]) {
    const r = lint(s);
    assert.equal(r.code, 0, s + " passes on an untouched copy\n" + r.out);
    assert.equal(r.out.trim().split("\n").pop(), "RESULT: ok", s + " ends with RESULT: ok");
  }
  ok("both lints pass on an untouched copy of learn/ and end with RESULT: ok");

  /* check-ui.mjs */
  await sheet("UI001", "a raw colour in a module's stylesheet fails", "color: #ff0000;", "raw colour #ff0000$", "replace #ff0000 with a colour token");
  await sheet("UI002", "a pixel type size fails", "font-size: 13px;", "type size not from a token \\(font-size: 13px\\)$", "set the size with a type token");
  await sheet("UI003", "a number for the weight fails", "font-weight: 700;", "weight not from a token \\(font-weight: 700\\)$", "drop the weight");
  await sheet("UI004", "a named font fails", "font-family: Arial;", "family not from a token \\(font-family: Arial\\)$", "use font-family: var\\(--font-ui\\)");
  await sheet("UI005", "a stacking number above 4 fails", "z-index: 999;", "stacking not from a token \\(z-index: 999\\)$", "use a layer token");
  await sheet("UI006", "a pixel radius fails", "border-radius: 5px;", "radius not from a token \\(border-radius: 5px\\)$", "use var\\(--r-sm\\)");
  await sheet("UI007", "!important outside base.css fails", "margin: 0 !important;", "!important outside base\\.css$", "remove !important");
  await script("UI008", "a module script that reaches for the network fails", 'fetch("/api/x");\n', "1 uses the network \\(fetch\\); only api\\.js may$", "move the request into learn/api\\.js");
  await script("UI009", "a module script that builds markup from a string fails", 'document.body.innerHTML = "<b>x</b>";\n', "1 builds markup from a string \\(innerHTML\\)$", "build the nodes with OL\\.h");
  await script("UI010", "a module script that runs a string as code fails", 'eval("1");\n', "1 runs a string as code$", "remove eval\\( ");
  await script("UI011", "a module script that leaves a console.log fails", 'console.log("x");\n', "1 leaves a console\\.log$", "delete the console\\.log call$");
  await script("UI012", "a module script that imports fails", 'import x from "./y.js";\n', "1 modules are not used; scripts share window\\.OL$", "remove the import or require");
  await script("UI013", "a registered page without a template fails", '(function () {\n  OL.pages.register("fx", {\n    draw: function () {}\n  });\n})();\n', '\\d+ page "fx" is registered without a template', 'add template: "T2"');
  await script("UI013", "a registered page with a made-up template fails", '(function () {\n  OL.pages.register("fx", {\n    template: "T10",\n    draw: function () {}\n  });\n})();\n', '\\d+ page "fx" is registered without a template', 'add template: "T2"');
  await fixture("UI014", "a README that is not in .assetsignore fails", { script: "check-ui.mjs", file: ".assetsignore", edit: (s) => s.replace(/^README\.md$/m, ""), line: /^UI014 learn\/\.assetsignore does not list README\.md: it would be published$/, fix: /^fix: add the line README\.md to learn\/\.assetsignore$/ });
  await sheet("UI015", "a class without the ol- prefix in a module's stylesheet fails", "margin: 0; }\n.fx-chip { margin: 0;", "class \\.fx-chip does not start with ol-$", "rename \\.fx-chip to \\.ol-students-chip");
  await script("UI015", "a class without the ol- prefix in a module script fails", 'var el = h("div", { class: "ol-tb st-chip" });\n', "1 class st-chip does not start with ol-$", "rename st-chip to ol-students-chip here and in learn/students/students\\.css");
  await script("UI015", "a class the script asks for in a selector fails", 'host.querySelector(".st-chips");\n', "1 class st-chips does not start with ol-$", "rename st-chips to ol-students-chips");

  /* check-i18n.mjs */
  await script("I18N001", "a key a module asks for that no pack has fails", 'var t = function (k) { return OL.i18n.t(k); };\nt("students.no_such_key");\n', '2 key "students\\.no_such_key" is not in the en-IN pack$', 'add "students\\.no_such_key" to learn/i18n/en-IN\\.js and a Devanagari value to learn/i18n/hi-IN\\.js$', "check-i18n.mjs");
  await script("I18N002", "a list of choices looked up by prefix, with no keys under the prefix, fails", 'opt("students.nothing_here.", ["a"]);\n', '1 no key starts with "students\\.nothing_here\\."$', 'add the keys that start with "students\\.nothing_here\\." to learn/i18n/en-IN\\.js', "check-i18n.mjs");
  await pack("I18N003", "a Students word with no Hindi fails", "i18n/hi-IN.js", (s) => s.replace(/ add: "विद्यार्थी जोड़ें",/, ""), 'hi-IN has no "students\\.add"', 'add "students\\.add" with a Devanagari value to learn/i18n/hi-IN\\.js');
  await pack("I18N004", "a US word the base does not have fails", "i18n/en-US.js", (s) => s.replace("people: { paste:", "people: { zz_extra: \"x\", paste:"), 'en-US has "people\\.zz_extra", which en-IN does not', 'add "people\\.zz_extra" to learn/i18n/en-IN\\.js, or delete it from learn/i18n/en-US\\.js');
  await pack("I18N005", "a Hindi word written in Latin letters fails", "i18n/hi-IN.js", (s) => s.replace('edit: "संपादित करें", quick_look', 'edit: "Sampadit karen", quick_look'), 'hi-IN "students\\.edit" is not in Devanagari: Sampadit karen', 'write the value of "students\\.edit" in Devanagari in learn/i18n/hi-IN\\.js');
  await pack("I18N006", "a Hindi word that is a copy of the English fails", "i18n/hi-IN.js", (s) => s.replace('edit: "संपादित करें", quick_look', 'edit: "Edit", quick_look'), 'hi-IN "students\\.edit" is a copy of the English', 'translate the value of "students\\.edit" in learn/i18n/hi-IN\\.js into Devanagari');
  await pack("I18N007", "a Hindi word that takes different values from the English fails", "i18n/hi-IN.js", (s) => s.replace("{name} को संपादित करें", "{naam} को संपादित करें"), 'hi-IN "students\\.edit_title" takes \\{naam\\}, en-IN takes \\{name\\}', 'make the value of "students\\.edit_title" in learn/i18n/hi-IN\\.js take \\{name\\}');
  await script("I18N008", "a sentence written into a module instead of the pack fails", 'var x = { label: "Save the student" };\n', '1 writes its own words: "Save the student"', 'move "Save the student" into learn/i18n/en-IN\\.js', "check-i18n.mjs");

  /* check-migrations.mjs. The fixtures are numbered from the highest migration in the copy, so a real migration that arrives never collides with them. */
  assert.equal(mig().code, 0, "check-migrations.mjs passes on an untouched copy of api/migrations\n" + mig().out);
  const top = Math.max(...fs.readdirSync(migDir).map((f) => Number(f.slice(0, 4))).filter(Number.isFinite)), nn = (k) => String(top + k).padStart(4, "0");
  await migration("MIG001", "two migrations with one number fail", { [nn(1) + "_a.sql"]: "ALTER TABLE x ADD COLUMN a TEXT;\n", [nn(1) + "_b.sql"]: "ALTER TABLE x ADD COLUMN b TEXT;\n" },
    new RegExp(`^MIG001 api/migrations/${nn(1)}_b\\.sql:1 shares the number ${nn(1)} with ${nn(1)}_a\\.sql$`), new RegExp(`^fix: rename it to ${nn(2)}_b\\.sql \\(the next free number\\)`));
  await migration("MIG002", "a dropped column after 0070 fails", { [nn(1) + "_drop.sql"]: "-- takes a column away\nALTER TABLE x DROP COLUMN a;\n" },
    new RegExp(`^MIG002 api/migrations/${nn(1)}_drop\\.sql:2 DROP COLUMN is not additive`), /^fix: add the new column or table here/);
  await migration("MIG002", "a renamed table after 0070 fails", { [nn(1) + "_rename.sql"]: "ALTER TABLE x\n  RENAME TO y;\n" },
    new RegExp(`^MIG002 api/migrations/${nn(1)}_rename\\.sql:2 RENAME TO is not additive`), /^fix: add the new column or table here/);
  await migration("MIG003", "a file without a number fails", { "add_nickname.sql": "ALTER TABLE x ADD COLUMN a TEXT;\n" },
    /^MIG003 api\/migrations\/add_nickname\.sql:1 is not named NNNN_name\.sql$/, new RegExp(`^fix: rename it to ${nn(1)}_add_nickname\\.sql$`));
  fs.writeFileSync(path.join(migDir, nn(1) + "_allowed.sql"), "-- allow-destructive: the column was never read\nALTER TABLE x DROP COLUMN a;\n");
  fs.writeFileSync(path.join(migDir, nn(2) + "_words.sql"), "-- nothing here may DROP TABLE anything\n/* RENAME TO is only a word in this comment */\nALTER TABLE x ADD COLUMN a TEXT;\n");
  try { const r = mig(); assert.equal(r.code, 0, "a drop that was allowed on purpose, and the words in a comment, pass\n" + r.out); }
  finally { fs.rmSync(path.join(migDir, nn(1) + "_allowed.sql")); fs.rmSync(path.join(migDir, nn(2) + "_words.sql")); }
  ok("a drop marked '-- allow-destructive:' and the words DROP TABLE in a comment pass");

  /* check-audit.mjs. Each fixture changes one file of the copy of api/src, its proofs or the registry. */
  assert.equal(audit().code, 0, "check-audit.mjs passes on an untouched copy of api/src\n" + audit().out);
  await auditing("AUD001", "a write route of a migrated module that nobody decided about fails", { file: "src/index.js",
    edit: (s) => s.replace(/^(\s*)(\["POST",\s*"\/api\/v1\/india\/classes\/:classId\/promote".*)$/m, '$1$2\n$1["POST", "/api/v1/india/classes/:classId/archive", india.promote],'),
    line: /^AUD001 api\/src\/index\.js:\d+ POST \/india\/classes\/:classId\/archive writes data for a migrated module and is in neither AUDITED nor NOT_YET$/, fix: /^fix: add it to AUDITED in api\/scripts\/audit-routes\.mjs/ });
  await auditing("AUD002", "a registry entry for a route that is gone fails", { file: "audit-routes.mjs", edit: (s) => s.replace('"POST /india/classes/:classId/rolls"', '"POST /india/classes/:classId/renumber"'),
    line: /^AUD002 api\/scripts\/audit-routes\.mjs:\d+ AUDITED names POST \/india\/classes\/:classId\/renumber, which is not a route in src\/index\.js$/, fix: /^fix: correct the route, or remove the entry/ });
  await auditing("AUD002", "an audit action no code writes fails", { file: "src/routes/india.js", edit: (s) => s.replaceAll('"students.class.promoted"', '"students.class.moved"'),
    line: /^AUD002 api\/scripts\/audit-routes\.mjs:\d+ POST \/india\/classes\/:classId\/promote should write students\.class\.promoted, and no code in src\/ does$/, fix: /^fix: correct the action, or make the route write it/ });
  await auditing("AUD003", "an audited route that no proof asserts fails", { file: "proofs/prove-school.mjs", edit: (s) => s.replace('audited(admin, "POST /india/classes/:classId/promote"', 'wrote(admin, "POST /india/classes/:classId/promote"'),
    line: /^AUD003 api\/scripts\/audit-routes\.mjs:\d+ no proof asserts the audit row of POST \/india\/classes\/:classId\/promote$/, fix: /^fix: wrap the call in audited\(admin, "POST \/india\/classes\/:classId\/promote"/ });
  await auditing("AUD003", "a proof that asserts another action than the registry fails", { file: "proofs/prove-school.mjs", edit: (s) => s.replace('{ action: "students.class.promoted", rows: 5 }', '{ action: "students.class.moved", rows: 5 }'),
    line: /^AUD003 api\/scripts\/audit-routes\.mjs:\d+ the proofs assert students\.class\.moved for POST \/india\/classes\/:classId\/promote, and the registry says students\.class\.promoted$/, fix: /^fix: make the two agree/ });

  /* check-design.mjs */
  assert.equal(design().code, 0, "check-design.mjs passes on an untouched DESIGN.md\n" + design().out);
  await designed("DES001", "a token family DESIGN.md does not name fails", { edit: (d) => d.replaceAll("--z-", "--zz-"),
    line: /^DES001 learn\/tokens\.css:\d+ token family --z-\* is not in DESIGN\.md$/, fix: /^fix: add a row to the token table in DESIGN\.md that names --z-\*/ });
  await designed("DES002", "a template with no row fails", { edit: (d) => d.replace(/^\| T7 \|.*$/m, ""),
    line: /^DES002 DESIGN\.md:1 template T7 has no row in DESIGN\.md$/, fix: /^fix: add "\| T7 \| name \| use it for \| built \|"/ });
  await designed("DES003", "a component file DESIGN.md does not name fails", { edit: (d) => d.replaceAll("menu.js", "mnu.js"),
    line: /^DES003 DESIGN\.md:1 learn\/ui\/menu\.js is not named in DESIGN\.md$/, fix: /^fix: add learn\/ui\/menu\.js to the component table/ });
  await designed("DES003", "a catalogue C-number DESIGN.md does not have fails", { file: "ui/index.js", edit: (c) => c.replace('{ id: "C-01"', '{ id: "C-99", name: "Fixture", key: "fixture" },\n    { id: "C-01"'),
    line: /^DES003 learn\/ui\/index\.js:\d+ C-99 is in the catalogue and not in DESIGN\.md$/, fix: /^fix: add a row for C-99 to the component table/ });
  await designed("DES004", "a browser surface base.css leaves to the browser fails", { file: "base.css", edit: (c) => c.replaceAll("scrollbar-color", "scrollbar-colour"),
    line: /^DES004 learn\/base\.css:1 no scrollbar-color rule/, fix: /^fix: add a scrollbar-color rule to base\.css from the tokens/ });
  await designed("DES006", "a component with no example in the README fails", { file: "README.md", edit: (c) => c.replaceAll("OL.ui.menu.", "OL.ui.mnu."),
    line: /^DES006 learn\/ui\/index\.js:\d+ component menu has no example in learn\/README\.md$/, fix: /^fix: add its options and one example, OL\.ui\.menu\.render\(/ });
  await designed("DES005", "a phone answer that differs from the route table fails", { file: "shell/routes.js", edit: (c) => c.replace('foot: true, phone: "cards"', 'foot: true, phone: "page"'),
    line: /^DES005 learn\/shell\/routes\.js:\d+ module admin is "page" in routes\.js and "cards" in DESIGN\.md$/, fix: /^fix: make the two agree/ });

  /* --json: the same problem as one object */
  fs.writeFileSync(at(JS), 'console.log("x");\n');
  try {
    const r = lint("check-ui.mjs", "--json");
    assert.equal(r.code, 1, "--json still exits 1\n" + r.out);
    const j = JSON.parse(r.out);
    assert.equal(j.result, "fail");
    assert.deepEqual(j.problems.find((p) => p.code === "UI011"), { code: "UI011", file: "learn/students/fixture.js", line: 1, what: "leaves a console.log", fix: "delete the console.log call", docs: "learn/README.md#UI011" });
  } finally { fs.rmSync(at(JS)); }
  ok("--json prints the problems as one object and still exits 1");

  /* tools/stamp.py --check, on a small learn/ of its own */
  fs.mkdirSync(path.join(stampDir, "parent"));
  fs.writeFileSync(path.join(stampDir, "a.js"), "var a = 1;\n");
  fs.writeFileSync(path.join(stampDir, "index.html"), '<script src="a.js?v=0"></script>\n');
  fs.writeFileSync(path.join(stampDir, "parent", "index.html"), '<link href="../a.js">\n<script src="../a.js?v=deadbeef"></script>\n');
  let r = stamp("--check");
  expectProblem("a ?v=0 placeholder", "STAMP001", r, { line: /^STAMP001 learn\/index\.html:1 a\.js\?v=0 is a placeholder or stale \(the file hashes to [0-9a-f]{8}\)$/, fix: /^fix: run python3 tools\/stamp\.py$/ });
  assert.match(r.out, /^STAMP001 learn\/parent\/index\.html:1 \.\.\/a\.js has no \?v= hash/m, "an asset with no hash is reported");
  assert.match(r.out, /^STAMP001 learn\/parent\/index\.html:2 \.\.\/a\.js\?v=deadbeef is a placeholder or stale/m, "a hash that is not the file's is reported");
  ok("STAMP001 fails on a ?v=0 placeholder, a missing hash and a stale hash, with its fix line");
  assert.equal(JSON.parse(stamp("--check", "--json").out).problems.length, 3, "--json lists the three problems");
  r = stamp();
  assert.equal(r.code, 0, "stamping works\n" + r.out);
  r = stamp("--check");
  assert.equal(r.code, 0, "the check passes after stamping\n" + r.out);
  assert.equal(r.out.trim(), "RESULT: ok");
  fs.writeFileSync(path.join(stampDir, "a.js"), "var a = 2;\n");
  assert.equal(stamp("--check").code, 1, "an edited asset is stale again");
  ok("STAMP001 passes after stamping and fails again when the file changes");

  /* a code that no fixture has seen, or that learn/README.md does not explain, fails here */
  const codes = new Set();
  for (const f of [path.join(HERE, "check-ui.mjs"), path.join(HERE, "check-i18n.mjs"), path.join(HERE, "check-migrations.mjs"), path.join(HERE, "check-design.mjs"), path.join(HERE, "check-audit.mjs"), path.join(ROOT, "tools", "stamp.py")]) for (const m of fs.readFileSync(f, "utf8").matchAll(/"((?:UI|I18N|STAMP|MIG|DES|AUD)\d{3})"/g)) codes.add(m[1]);
  const anchors = new Set([...fs.readFileSync(path.join(LEARN, "README.md"), "utf8").matchAll(/<a id="([A-Z0-9]+)"><\/a>/g)].map((m) => m[1]));
  assert.deepEqual([...codes].filter((c) => !seen.has(c)), [], "every code has a fixture");
  assert.deepEqual([...codes].filter((c) => !anchors.has(c)), [], "every code has an anchor in learn/README.md");
  assert.deepEqual([...anchors].filter((c) => !codes.has(c)), [], "every anchor in learn/README.md is a code a lint prints");
  ok(`${codes.size} codes: each has a fixture and an anchor in learn/README.md`);

  console.log(`\n${n} checks passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exitCode = 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(stampDir, { recursive: true, force: true });
  fs.rmSync(auditDir, { recursive: true, force: true });
  fs.rmSync(migDir, { recursive: true, force: true });
  fs.rmSync(designDir, { recursive: true, force: true });
}
