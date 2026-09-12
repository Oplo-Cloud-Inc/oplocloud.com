/* Prints a file with its comments blanked out, keeping line numbers intact so
   a reported line still matches the source. The boundary check greps the
   result: an architecture check that fires on the prose explaining the
   architecture is a check nobody keeps running. */
import { readFileSync } from "node:fs";

/* Whether a `/` here opens a regular expression rather than dividing. It does
   when the last thing that mattered was not a value: an operator, an opening
   bracket, a comma, or one of the keywords a regex may follow. */
function regexCanStartHere(before) {
  const t = before.replace(/\s+$/, "");
  if (!t) return true;
  if ("(,=:[!&|?{};+-*%~^<>".indexOf(t[t.length - 1]) > -1) return true;
  return /\b(return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await)$/.test(t);
}

const src = readFileSync(process.argv[2], "utf8");
let out = "", i = 0;
let inLine = false, inBlock = false, inStr = null;

while (i < src.length) {
  const c = src[i], d = src[i + 1];
  if (inLine) {
    if (c === "\n") { inLine = false; out += c; } else out += " ";
    i++; continue;
  }
  if (inBlock) {
    if (c === "*" && d === "/") { inBlock = false; out += "  "; i += 2; continue; }
    out += (c === "\n") ? c : " ";
    i++; continue;
  }
  if (inStr) {
    out += c;
    if (c === "\\") { out += src[i + 1] || ""; i += 2; continue; }
    if (c === inStr) inStr = null;
    i++; continue;
  }
  if (c === "/" && d === "/") { inLine = true; out += "  "; i += 2; continue; }
  if (c === "/" && d === "*") { inBlock = true; out += "  "; i += 2; continue; }

    /* A regular expression literal, which is what this used to walk straight
       into. `/[&<>"]/g` contains a quote, and without this the quote opened a
       string that ran on until it met another one — from which point every
       comment downstream was inside "a string" and survived untouched.

       It failed silently and it failed by parity: the boundary check passed or
       not depending on how many quotes happened to appear in unrelated code
       thousands of lines away. It had been wrong for a long time and only
       surfaced when an edit elsewhere changed the count.

       Telling a regex from a division is the one genuinely ambiguous thing in
       JavaScript's grammar, and the usual answer is to look at what came
       before: a slash after a value divides, a slash where a value is expected
       opens a regex. */
    if (c === "/" && regexCanStartHere(out)) {
      out += c;
      i++;
      let inClass = false;
      while (i < src.length) {
        const r = src[i];
        if (r === "\n") break;                 // a regex cannot span a line
        out += r;
        i++;
        if (r === "\\") { out += src[i] || ""; i++; continue; }
        if (r === "[") inClass = true;
        else if (r === "]") inClass = false;
        else if (r === "/" && !inClass) break;
      }
      continue;
    }

  if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; i++; continue; }
  out += c; i++;
}
process.stdout.write(out);
