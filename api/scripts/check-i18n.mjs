// The words lint for learn/ui and learn/i18n: node scripts/check-i18n.mjs
//  - every key a component asks for exists in the en-IN base pack
//  - en-US and hi-IN only hold keys the base has, and take the same {values}
//  - a Hindi message is in Devanagari, not a copy of the English
//  - a component holds no sentence of its own: a word a person reads comes from a pack
import fs from "node:fs";
import path from "node:path";

const LEARN = path.resolve(new URL("../../learn", import.meta.url).pathname);
const read = (f) => fs.readFileSync(path.join(LEARN, f), "utf8");
const win = {};
for (const f of ["i18n/i18n.js", "i18n/en-IN.js", "i18n/en-US.js", "i18n/hi-IN.js"]) new Function("window", "OL", read(f))(win, win.OL);
const packs = win.OL.i18n.packs();
const base = packs["en-IN"];
const problems = [];
const bad = (m) => problems.push(m);

/* The {names} a message takes, including the ones inside plural and select cases. */
const params = (msg) => [...new Set([...msg.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)].map((m) => m[1]))].sort().join(",");

for (const loc of ["en-US", "hi-IN"]) {
  for (const [k, v] of Object.entries(packs[loc] || {})) {
    if (base[k] == null) { bad(`${loc} has "${k}", which en-IN does not`); continue; }
    if (loc === "hi-IN") {
      if (params(v) !== params(base[k])) bad(`hi-IN "${k}" takes {${params(v)}}, en-IN takes {${params(base[k])}}`);
      const words = v.replace(/\{[^}]*\}|[#\d\s.,;:·/()+\-–—…'"?!%₹&]/g, "");
      if (words && !/[ऀ-ॿ]/.test(words) && !/^[A-Z0-9]+$/.test(words)) bad(`hi-IN "${k}" is not in Devanagari: ${v}`);
      if (v === base[k]) bad(`hi-IN "${k}" is a copy of the English`);
    }
  }
}

/* Keys the components ask for. A key built with "+" is checked by its prefix. */
const files = fs.readdirSync(path.join(LEARN, "ui")).filter((f) => f.endsWith(".js") && f !== "gallery.js").map((f) => "ui/" + f).concat(["i18n/format.js"]);
const asked = new Set();
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(/(\bt|OL\.t|\bterm|OL\.i18n\.t|OL\.i18n\.term)\(\s*"([a-z_.0-9]+)"(\s*\+)?/g)) {
    const full = /term$/.test(m[1]) ? "term." + m[2] : m[2];
    asked.add(full);
    if (m[3]) { if (!Object.keys(base).some((k) => k.startsWith(full))) bad(`${f}: no key starts with "${full}"`); }
    else if (base[full] == null) bad(`${f}: key "${full}" is not in the en-IN pack`);
  }
}

/* A sentence of its own: text a person reads, written straight into a component. */
const SENTENCE = /(?:\btext:|\.textContent\s*=|createTextNode\(|\bplaceholder:|"aria-label":|\btitle:|\blabel:)\s*"([^"]*[A-Za-z]{3,}[^"]*)"/g;
const ALLOW = new Set(["ol-", "svg", "button", "text", "tree", "grid", "dialog", "listbox", "menu"]);
for (const f of files.filter((x) => x.startsWith("ui/") && !["ui/icons.js", "ui/index.js"].includes(x))) {
  const lines = read(f).replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n");   // block comments blanked, lines kept
  lines.forEach((ln, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return;
    for (const m of ln.matchAll(SENTENCE)) {
      if (ALLOW.has(m[1]) || /^[a-z-]+$/.test(m[1])) continue;     // a role or a class name, not words
      bad(`${f}:${i + 1} writes its own words: "${m[1]}"`);
    }
  });
}

const unused = Object.keys(base).filter((k) => ![...asked].some((a) => k === a || k.startsWith(a + ".") || (a.endsWith(".") && k.startsWith(a)))).length;
if (problems.length) { console.log(problems.map((p) => "  FAIL " + p).join("\n")); console.log(`${problems.length} problem(s)`); process.exit(1); }
console.log(`  ok  ${Object.keys(base).length} base keys, ${Object.keys(packs["hi-IN"] || {}).length} in Hindi, ${Object.keys(packs["en-US"] || {}).length} US overrides; ${asked.size} keys asked for by components (${unused} base keys not yet used)`);
