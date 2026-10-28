// The gates fail when they should: node api/scripts/test-gates.mjs
//
// tools/verify.sh is what the Deploy workflow's verify job and the CI workflow run before anything is published
// (O7, X6). Here it is run on a small copy of learn/ with one thing wrong at a time: a syntax error in learn/ui/,
// a ?v=0 placeholder, a broken lint. Each must fail the run and say which gate; the clean copy must pass. The
// workflow files are read too: the verify job must run verify.sh, and nothing may publish unless it passed.
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MODULES } from "./lib-lint.mjs";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const LEARN = path.join(ROOT, "learn");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-gates-"));
for (const d of ["ui", "i18n", "shell", ...MODULES]) fs.cpSync(path.join(LEARN, d), path.join(tmp, d), { recursive: true });
for (const f of ["base.css", ".assetsignore", "_ui.html"]) fs.copyFileSync(path.join(LEARN, f), path.join(tmp, f));
fs.writeFileSync(path.join(tmp, "a.js"), "var a = 1;\n");
const PAGE = path.join(tmp, "index.html");
fs.writeFileSync(PAGE, '<script src="a.js"></script>\n');

const verify = (...gates) => {
  try { const out = execFileSync("bash", [path.join(ROOT, "tools", "verify.sh"), ...gates], { env: { ...process.env, OL_LEARN_ROOT: tmp }, encoding: "utf8", stdio: "pipe" }); return { code: 0, out, stdout: out }; }
  catch (e) { return { code: e.status, out: String(e.stdout || "") + String(e.stderr || ""), stdout: String(e.stdout || "") }; }
};
const last = (r) => r.stdout.trim().split("\n").pop();
const at = (f) => path.join(tmp, f);
let n = 0;
const ok = (what) => { n++; console.log("  ok  " + what); };

/* Break one file, run the gates, put it back. */
function broken(file, edit, gates, expect, name, gateName) {
  const was = fs.readFileSync(at(file), "utf8");
  fs.writeFileSync(at(file), edit(was));
  try {
    const r = verify(...gates);
    assert.equal(r.code, 1, name + ": the run should fail\n" + r.out);
    assert.match(r.out, expect, name + ": the run should say why\n" + r.out);
    assert.match(r.out, new RegExp("FAILED: " + gateName.replace(/[()]/g, "\\$&")), name + ": the run should name the gate\n" + r.out);
    assert.match(last(r), /^RESULT: fail [1-9]\d* gates$/, name + ": the last line\n" + r.out);
  } finally { fs.writeFileSync(at(file), was); }
  ok(name);
}

try {
  let r = execFileSync("python3", [path.join(ROOT, "tools", "stamp.py")], { env: { ...process.env, OL_LEARN_ROOT: tmp }, encoding: "utf8" });
  r = verify("syntax", "stamp", "lints");
  assert.equal(r.code, 0, "a clean copy passes\n" + r.out);
  assert.equal(last(r), "RESULT: ok");
  ok("a clean copy passes syntax, stamp and lints");

  broken("ui/core.js", (s) => s + "\nvar = ;\n", ["syntax"], /syntax: .*ui\/core\.js does not parse/, "a syntax error in learn/ui fails the syntax gate", "syntax of learn/ui");
  broken("shell/shell.js", (s) => s + "\nfunction (\n", ["syntax"], /syntax: .*shell\/shell\.js does not parse/, "a syntax error in learn/shell fails the syntax gate", "syntax of learn/ui");
  broken("students/index.js", (s) => s + "\n)(\n", ["syntax"], /syntax: .*students\/index\.js does not parse/, "a syntax error in learn/students fails the syntax gate", "syntax of learn/ui");
  fs.writeFileSync(at("i18n/zz-new.js"), "let = = 1;\n");
  try { const x = verify("syntax"); assert.equal(x.code, 1, "a file nobody listed is still checked\n" + x.out); assert.match(x.out, /zz-new\.js does not parse/); } finally { fs.rmSync(at("i18n/zz-new.js")); }
  ok("a new script in learn/i18n is checked without being listed anywhere (a glob, not a list)");

  broken("index.html", (s) => s.replace(/a\.js\?v=[0-9a-f]+/, "a.js?v=0"), ["stamp"], /STAMP001 learn\/index\.html:1 a\.js\?v=0 is a placeholder or stale/, "a ?v=0 placeholder fails the stamp gate", "asset stamps");
  broken("a.js", (s) => s + "var b = 2;\n", ["stamp"], /STAMP001 learn\/index\.html:1 a\.js\?v=[0-9a-f]{8} is a placeholder or stale/, "an asset edited after stamping fails the stamp gate", "asset stamps");
  broken("students/students.css", (s) => s + "\n.ol-students-fx { color: #ff0000; }\n", ["lints"], /UI001 learn\/students\/students\.css:\d+ raw colour #ff0000/, "a lint broken in the code fails the lints gate", "check-ui");
  broken("i18n/hi-IN.js", (s) => s.replace(/ add: "विद्यार्थी जोड़ें",/, ""), ["lints"], /I18N003 learn\/i18n\/hi-IN\.js hi-IN has no "students\.add"/, "a missing Hindi word fails the lints gate", "check-i18n");

  /* every gate runs, so one run shows everything that is wrong */
  const css = fs.readFileSync(at("students/students.css"), "utf8"), ui = fs.readFileSync(at("ui/core.js"), "utf8");
  fs.writeFileSync(at("students/students.css"), css + "\n.ol-students-fx { color: #ff0000; }\n");
  fs.writeFileSync(at("ui/core.js"), ui + "\nvar = ;\n");
  try {
    r = verify("syntax", "lints");
    assert.equal(r.code, 1);
    assert.match(r.out, /FAILED: syntax of learn\/ui/);
    assert.match(r.out, /FAILED: check-ui/);
    assert.equal(last(r), "RESULT: fail 2 gates");
  } finally { fs.writeFileSync(at("students/students.css"), css); fs.writeFileSync(at("ui/core.js"), ui); }
  ok("a failing gate does not hide the next one: both are named, and the count is right");

  r = verify("no-such-gate");
  assert.equal(r.code, 2, "an unknown gate is refused\n" + r.out);
  ok("an unknown gate name is refused");

  /* the workflows: verify.sh runs in the verify job, and nothing publishes unless that job passed */
  const deploy = fs.readFileSync(path.join(ROOT, ".github", "workflows", "deploy.yml"), "utf8");
  const verifyJob = deploy.slice(deploy.indexOf("\n  verify:"), deploy.indexOf("\n  api:"));
  assert.match(verifyJob, /^\s+run: bash tools\/verify\.sh$/m, "the verify job runs tools/verify.sh");
  assert.match(deploy, /\n  api:[\s\S]*?\n    needs: verify\n/, "the api job waits for verify");
  assert.match(deploy, /\n  app:[\s\S]*?\n    needs: \[verify, api\]\n/, "the app job waits for verify");
  assert.match(deploy, /needs\.verify\.result == 'success'/, "the app job publishes only when verify passed");
  const ci = fs.readFileSync(path.join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
  assert.match(ci, /^\s+pull_request:/m, "CI runs on pull requests, before anything reaches main");
  assert.match(ci, /^\s+run: bash tools\/verify\.sh$/m, "CI runs tools/verify.sh");
  assert.match(ci, /^\s+run: bash tools\/ci-browser\.sh$/m, "CI runs the browser suites");
  const runner = fs.readFileSync(path.join(ROOT, "tools", "ci-browser.sh"), "utf8");
  for (const suite of ["test-ui", "test-shell", "test-students"]) assert.match(runner, new RegExp("^for s in .*\\b" + suite + "\\b", "m"), "ci-browser.sh runs " + suite);
  ok("the Deploy workflow runs verify.sh before it publishes; CI runs verify.sh and the three browser suites on every pull request");

  console.log(`\n${n} checks passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exitCode = 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
