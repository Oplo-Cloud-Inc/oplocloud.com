/* Prints a file with its comments blanked out, keeping line numbers intact so
   a reported line still matches the source. The boundary check greps the
   result: an architecture check that fires on the prose explaining the
   architecture is a check nobody keeps running. */
import { readFileSync } from "node:fs";

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
  if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; i++; continue; }
  out += c; i++;
}
process.stdout.write(out);
