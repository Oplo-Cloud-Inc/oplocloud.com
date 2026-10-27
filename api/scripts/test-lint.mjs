// The two lints catch what they say they catch: node scripts/test-lint.mjs
//
// check-ui.mjs and check-i18n.mjs are run on a copy of learn/ with one thing wrong at a time. Each fixture must fail
// the lint and say why; the untouched copy must pass. A lint that nobody has seen fail is a lint nobody can trust.
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LEARN = path.resolve(new URL("../../learn", import.meta.url).pathname);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-lint-"));
for (const d of ["ui", "i18n", "shell", "students"]) fs.cpSync(path.join(LEARN, d), path.join(tmp, d), { recursive: true });
for (const f of ["base.css", ".assetsignore", "_ui.html"]) fs.copyFileSync(path.join(LEARN, f), path.join(tmp, f));

const run = (script) => {
  try { return { code: 0, out: execFileSync("node", [path.join(HERE, script)], { env: { ...process.env, OL_LEARN_ROOT: tmp }, encoding: "utf8", stdio: "pipe" }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout || "") + String(e.stderr || "") }; }
};
const at = (f) => path.join(tmp, f);
let n = 0;
async function fixture(name, { script, file, add, edit, expect }) {
  const was = fs.existsSync(at(file)) ? fs.readFileSync(at(file), "utf8") : null;
  fs.writeFileSync(at(file), edit ? edit(was) : (was || "") + add);
  try {
    const r = run(script);
    assert.equal(r.code, 1, name + ": the lint should fail\n" + r.out);
    assert.match(r.out, expect, name + ": the lint should say why\n" + r.out);
  } finally { if (was === null) fs.rmSync(at(file)); else fs.writeFileSync(at(file), was); }
  n++; console.log("  ok  " + name);
}

try {
  for (const script of ["check-ui.mjs", "check-i18n.mjs"]) {
    const r = run(script);
    assert.equal(r.code, 0, script + " passes on an untouched copy\n" + r.out);
  }
  n++; console.log("  ok  both lints pass on an untouched copy of learn/");

  await fixture("a registered page without a template fails", { script: "check-ui.mjs", file: "students/fixture.js", add: '(function () {\n  OL.pages.register("fx", {\n    draw: function () {}\n  });\n})();\n', expect: /page "fx" is registered without a template/ });
  await fixture("a registered page with a made-up template fails", { script: "check-ui.mjs", file: "students/fixture.js", add: '(function () {\n  OL.pages.register("fx", {\n    template: "T10",\n    draw: function () {}\n  });\n})();\n', expect: /page "fx" is registered without a template/ });
  await fixture("a raw colour and a pixel type size in a module's stylesheet fail", { script: "check-ui.mjs", file: "students/students.css", add: "\n.fx { color: #ff0000; font-size: 13px; }\n", expect: /students\/students\.css:\d+ raw colour[\s\S]*type size not from a token/ });
  await fixture("a module script that reaches for the network fails", { script: "check-ui.mjs", file: "students/fixture.js", add: 'fetch("/api/x");\n', expect: /students\/fixture\.js:1 uses the network \(fetch\)/ });
  await fixture("a module script that builds markup from a string fails", { script: "check-ui.mjs", file: "students/fixture.js", add: 'document.body.innerHTML = "<b>x</b>";\n', expect: /builds markup from a string \(innerHTML\)/ });
  await fixture("a module script that leaves a console.log fails", { script: "check-ui.mjs", file: "students/fixture.js", add: 'console.log("x");\n', expect: /leaves a console\.log/ });
  await fixture("a key a module asks for that no pack has fails", { script: "check-i18n.mjs", file: "students/fixture.js", add: 'var t = function (k) { return OL.i18n.t(k); };\nt("students.no_such_key");\n', expect: /students\/fixture\.js: key "students\.no_such_key" is not in the en-IN pack/ });
  await fixture("a sentence written into a module instead of the pack fails", { script: "check-i18n.mjs", file: "students/fixture.js", add: 'var x = { label: "Save the student" };\n', expect: /students\/fixture\.js:1 writes its own words: "Save the student"/ });
  await fixture("a list of choices looked up by prefix, with no keys under the prefix, fails", { script: "check-i18n.mjs", file: "students/fixture.js", add: 'opt("students.nothing_here.", ["a"]);\n', expect: /no key starts with "students\.nothing_here\."/ });
  await fixture("a Students word with no Hindi fails", { script: "check-i18n.mjs", file: "i18n/hi-IN.js", edit: (s) => s.replace(/ add: "विद्यार्थी जोड़ें",/, ""), expect: /hi-IN has no "students\.add"/ });
  await fixture("a Hindi word that is a copy of the English fails", { script: "check-i18n.mjs", file: "i18n/hi-IN.js", edit: (s) => s.replace('edit: "संपादित करें", quick_look', 'edit: "Edit", quick_look'), expect: /hi-IN "students\.edit" is a copy of the English/ });
  await fixture("a Hindi word that takes different values from the English fails", { script: "check-i18n.mjs", file: "i18n/hi-IN.js", edit: (s) => s.replace("{name} को संपादित करें", "{naam} को संपादित करें"), expect: /hi-IN "students\.edit_title" takes \{naam\}, en-IN takes \{name\}/ });

  console.log(`\n${n} checks passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exitCode = 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
