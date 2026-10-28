// The lints catch what they say they catch: node api/scripts/test-lint.mjs
//
// check-ui.mjs, check-i18n.mjs and tools/stamp.py --check are run on a copy of learn/ with one thing wrong at a time.
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
for (const d of ["ui", "i18n", "shell", ...MODULES]) fs.cpSync(path.join(LEARN, d), path.join(tmp, d), { recursive: true });
for (const f of ["base.css", ".assetsignore", "_ui.html"]) fs.copyFileSync(path.join(LEARN, f), path.join(tmp, f));

const run = (cmd, args, root) => {
  try { return { code: 0, out: execFileSync(cmd, args, { env: { ...process.env, OL_LEARN_ROOT: root }, encoding: "utf8", stdio: "pipe" }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout || "") + String(e.stderr || "") }; }
};
const lint = (script, ...flags) => run("node", [path.join(HERE, script), ...flags], tmp);
const stamp = (...flags) => run("python3", [path.join(ROOT, "tools", "stamp.py"), ...flags], stampDir);
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
  for (const f of [path.join(HERE, "check-ui.mjs"), path.join(HERE, "check-i18n.mjs"), path.join(ROOT, "tools", "stamp.py")]) for (const m of fs.readFileSync(f, "utf8").matchAll(/"((?:UI|I18N|STAMP)\d{3})"/g)) codes.add(m[1]);
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
}
