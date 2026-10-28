// The words lint for learn/ui, learn/i18n, learn/shell and the rebuilt modules (learn/students): node api/scripts/check-i18n.mjs [--json]
//  - every key a component asks for exists in the en-IN base pack                      I18N001, I18N002
//  - a rebuilt module's words are all in Hindi too (HINDI_COMPLETE): a screen is not half translated   I18N003
//  - en-US and hi-IN only hold keys the base has, and take the same {values}           I18N004, I18N007
//  - a Hindi message is in Devanagari, not a copy of the English                       I18N005, I18N006
//  - a component holds no sentence of its own: a word a person reads comes from a pack I18N008
// Each code is explained in learn/README.md. OL_LEARN_ROOT points the lint at another copy of learn/ (the fixtures of test-lint.mjs).
import { MODULES, rd, lineOf, jsIn, lint } from "./lib-lint.mjs";

/* The key families whose Hindi must be complete. */
const HINDI_COMPLETE = ["students.", "pages."];
const L = lint();
const win = {};
for (const f of ["i18n/i18n.js", "i18n/en-IN.js", "i18n/en-US.js", "i18n/hi-IN.js"]) new Function("window", "OL", rd(f))(win, win.OL);
const packs = win.OL.i18n.packs();
const base = packs["en-IN"];
const shortOf = (s) => (s.length > 60 ? s.slice(0, 57) + "…" : s);

/* The {names} a message takes, including the ones inside plural and select cases. */
const params = (msg) => [...new Set([...msg.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)].map((m) => m[1]))].sort().join(",");

for (const k of Object.keys(base)) if (HINDI_COMPLETE.some((p) => k.startsWith(p)) && packs["hi-IN"][k] == null) L.bad("I18N003", "i18n/hi-IN.js", null, `hi-IN has no "${k}": a rebuilt module's words are translated whole`, `add "${k}" with a Devanagari value to learn/i18n/hi-IN.js (the English is "${shortOf(base[k])}")`);
for (const loc of ["en-US", "hi-IN"]) {
  const file = `i18n/${loc}.js`;
  for (const [k, v] of Object.entries(packs[loc] || {})) {
    if (base[k] == null) { L.bad("I18N004", file, null, `${loc} has "${k}", which en-IN does not`, `add "${k}" to learn/i18n/en-IN.js, or delete it from learn/${file}`); continue; }
    if (loc === "hi-IN") {
      if (params(v) !== params(base[k])) L.bad("I18N007", file, null, `hi-IN "${k}" takes {${params(v)}}, en-IN takes {${params(base[k])}}`, `make the value of "${k}" in learn/${file} take {${params(base[k])}} like en-IN does`);
      const words = v.replace(/\{\s*\w+\s*\}/g, "").replace(/\{\s*\w+\s*,\s*(?:plural|select)\s*,/g, "").replace(/\b(?:zero|one|two|few|many|other)\b|=\d+/g, "").replace(/[{}#\d\s.,;:·/()+\-–—…'"?!%₹&]/g, "");
      if (words && !/[ऀ-ॿ]/.test(words) && !/^[A-Z0-9]+$/.test(words)) L.bad("I18N005", file, null, `hi-IN "${k}" is not in Devanagari: ${shortOf(v)}`, `write the value of "${k}" in Devanagari in learn/${file}`);
      if (v === base[k]) L.bad("I18N006", file, null, `hi-IN "${k}" is a copy of the English`, `translate the value of "${k}" in learn/${file} into Devanagari`);
    }
  }
}

/* Keys the components ask for. A key built with "+" is checked by its prefix. */
const files = jsIn("ui").filter((f) => f !== "ui/gallery.js").concat(["i18n/format.js"], jsIn("shell"), MODULES.flatMap(jsIn));
const asked = new Set();
for (const f of files) {
  const src = rd(f);
  for (const m of src.matchAll(/(\bt|OL\.t|\bterm|OL\.i18n\.t|OL\.i18n\.term)\(\s*"([a-z_.0-9]+)"(\s*\+)?/g)) {
    const full = /term$/.test(m[1]) ? "term." + m[2] : m[2];
    asked.add(full);
    if (m[3]) { if (!Object.keys(base).some((k) => k.startsWith(full))) L.bad("I18N002", f, lineOf(src, m.index), `no key starts with "${full}"`, `add the keys that start with "${full}" to learn/i18n/en-IN.js, or correct the prefix`); }
    else if (base[full] == null) L.bad("I18N001", f, lineOf(src, m.index), `key "${full}" is not in the en-IN pack`, `add "${full}" to learn/i18n/en-IN.js and a Devanagari value to learn/i18n/hi-IN.js`);
  }
  // a list of choices whose words are looked up as prefix + value (opt("students.gender.", […])): the prefix must lead somewhere
  for (const m of src.matchAll(/\bopt\(\s*"([a-z_.0-9]+\.)"/g)) { asked.add(m[1]); if (!Object.keys(base).some((k) => k.startsWith(m[1]))) L.bad("I18N002", f, lineOf(src, m.index), `no key starts with "${m[1]}"`, `add the keys that start with "${m[1]}" to learn/i18n/en-IN.js, or correct the prefix`); }
}

/* A sentence of its own: text a person reads, written straight into a component. */
const SENTENCE = /(?:\btext:|\.textContent\s*=|createTextNode\(|\bplaceholder:|"aria-label":|\btitle:|\blabel:)\s*"([^"]*[A-Za-z]{3,}[^"]*)"/g;
const ALLOW = new Set(["ol-", "Esc", "Enter", "Tab", "svg", "button", "text", "tree", "grid", "dialog", "listbox", "menu"]);
for (const f of files.filter((x) => (x.startsWith("ui/") || x.startsWith("shell/") || MODULES.some((m) => x.startsWith(m + "/"))) && !["ui/icons.js", "ui/index.js"].includes(x))) {
  const lines = rd(f).replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n");   // block comments blanked, lines kept
  lines.forEach((ln, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return;
    for (const m of ln.matchAll(SENTENCE)) {
      if (ALLOW.has(m[1]) || /^[a-z-]+$/.test(m[1])) continue;     // a role or a class name, not words
      L.bad("I18N008", f, i + 1, `writes its own words: "${m[1]}"`, `move "${m[1]}" into learn/i18n/en-IN.js with a Devanagari value in learn/i18n/hi-IN.js, and read it here with t("…")`);
    }
  });
}

const unused = Object.keys(base).filter((k) => ![...asked].some((a) => k === a || k.startsWith(a + ".") || (a.endsWith(".") && k.startsWith(a)))).length;
L.finish(`  ok  ${Object.keys(base).length} base keys, ${Object.keys(packs["hi-IN"] || {}).length} in Hindi, ${Object.keys(packs["en-US"] || {}).length} US overrides; ${asked.size} keys asked for by components (${unused} base keys not yet used)`);
