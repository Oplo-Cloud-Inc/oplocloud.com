// How the lints of learn/ speak (X3). Each problem is three lines,
//   <CODE> <file>:<line> <what>
//   fix: <the exact edit or command>
//   docs: learn/README.md#<CODE>
// and the run ends with one line, RESULT: ok  or  RESULT: fail <n> problems, and exits 1 when there is a problem.
// --json prints the same as one object, {"result": "ok" | "fail", "problems": [{code, file, line, what, fix, docs}]}.
// tools/stamp.py --check speaks the same way.
import fs from "node:fs";
import path from "node:path";

/* The learn/ folder to lint. OL_LEARN_ROOT points at another copy of it (the fixtures of test-lint.mjs). */
export const LEARN = process.env.OL_LEARN_ROOT ? path.resolve(process.env.OL_LEARN_ROOT) : path.resolve(new URL("../../learn", import.meta.url).pathname);
/* The folders of rebuilt modules: each holds scripts, and a stylesheet <folder>/<folder>.css if it needs one, that obey the same rules as the library. */
export const MODULES = ["students", "settings"];
export const sheetsOf = (m) => (fs.existsSync(path.join(LEARN, m, m + ".css")) ? [`${m}/${m}.css`] : []);

export const rd = (f) => fs.readFileSync(path.join(LEARN, f), "utf8");
export const lineOf = (s, i) => s.slice(0, i).split("\n").length;
export const jsIn = (dir) => fs.readdirSync(path.join(LEARN, dir)).filter((f) => f.endsWith(".js")).map((f) => `${dir}/${f}`);

export function lint(base = "learn/") {
  const json = process.argv.includes("--json");
  const found = [];
  return {
    /* file is relative to `base` (learn/ unless the lint reads another folder); line is optional */
    bad(code, file, line, what, fix) { found.push({ code, file: base + file, line: line || null, what, fix, docs: "learn/README.md#" + code }); },
    /* summary is the human line a clean run prints before RESULT */
    finish(summary) {
      if (json) console.log(JSON.stringify({ result: found.length ? "fail" : "ok", problems: found }, null, 2));
      else {
        for (const p of found) console.log(`${p.code} ${p.file}${p.line ? ":" + p.line : ""} ${p.what}\nfix: ${p.fix}\ndocs: ${p.docs}`);
        if (!found.length && summary) console.log(summary);
        console.log(found.length ? `RESULT: fail ${found.length} problems` : "RESULT: ok");
      }
      process.exitCode = found.length ? 1 : 0;
    }
  };
}
