// The boundaries of the component library: node api/scripts/check-ui.mjs [--json]
//  - tokens.css is the only file with a raw colour; the rest read var(--c-…)                       UI001
//  - type size, weight and family, stacking and radius come from tokens too                        UI002 to UI006
//  - !important is for [hidden] and reduced motion, in base.css only                               UI007
//  - nothing in learn/ui, learn/i18n, learn/shell or a rebuilt module (learn/students) touches the
//    network (api.js is the one place that may)                                                    UI008
//  - nothing builds markup from a string (names are text, never HTML), except the icon sprite      UI009
//  - nothing runs a string as code, leaves a console.log, or uses import / require                 UI010 to UI012
//  - a registered page names its template (T1 to T9)                                               UI013
//  - the dev-only gallery and the README are never published                                       UI014
//  - a rebuilt module's class names start with ol- (ol-students-…); is- and has- name a state      UI015
// Each code is explained in learn/README.md. OL_LEARN_ROOT points the lint at another copy of learn/ (the fixtures of test-lint.mjs).
import { MODULES, rd, lineOf, jsIn, lint } from "./lib-lint.mjs";

const L = lint();
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

/* CSS ------------------------------------------------------------------- */
const SHEETS = ["base.css", "ui/ui.css", "ui/gallery.css", "shell/shell.css"].concat(MODULES.map((m) => `${m}/${m}.css`));
for (const f of SHEETS) {
  const css = strip(rd(f));
  const at = (m) => lineOf(css, m.index);
  const colour = (m) => L.bad("UI001", f, at(m), `raw colour ${m[0].trim()}`, `replace ${m[0].trim()} with a colour token from learn/tokens.css, for example var(--c-text) or var(--c-bg-subtle)`);
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b(?![^{]*\{)/g)) colour(m);                               // a hex outside a selector (url(#id) is allowed)
  for (const m of css.matchAll(/(?<![\w-])(?:rgba?|hsla?|oklch|oklab)\([^)]*\)/g)) colour(m);
  for (const m of css.matchAll(/color-mix\([^;{}]*\)/g)) if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(|\b(?:white|black|red|green|blue)\b/.test(m[0])) L.bad("UI001", f, at(m), `raw colour in color-mix: ${m[0]}`, "mix colour tokens only, for example color-mix(in srgb, var(--c-text) 8%, transparent)");
  const tok = (v) => /^var\(--[\w-]+\)$/.test(v) || /^(inherit|initial|unset|normal|auto|none)$/.test(v);
  const prop = (name, ok, code, why, fix) => { for (const m of css.matchAll(new RegExp("(?<![\\w-])" + name + ":\\s*([^;}]+)", "g"))) if (!ok(m[1].trim())) L.bad(code, f, at(m), `${why} (${m[0].trim()})`, fix); };
  prop("font-size", (v) => tok(v) || /^(100%|1em|1rem)$/.test(v), "UI002", "type size not from a token", "set the size with a type token, for example font: var(--t-body) (also --t-small, --t-caption, --t-h3), from learn/tokens.css");
  prop("font-weight", tok, "UI003", "weight not from a token", "drop the weight and use a type token that carries it, for example font: var(--t-body-strong), from learn/tokens.css");
  prop("font-family", (v) => tok(v) || /^var\(--font-(ui|mono)\)/.test(v), "UI004", "family not from a token", "use font-family: var(--font-ui) or var(--font-mono), or a type token with font: var(--t-body)");
  prop("z-index", (v) => tok(v) || /^calc\(var\(--z-[\w-]+\) [+-] \d\)$/.test(v) || /^-?[0-4]$/.test(v), "UI005", "stacking not from a token", "use a layer token such as var(--z-sticky) or var(--z-drawer) from learn/tokens.css; 0 to 4 only orders things inside one component");   // 0-4: order inside one component
  prop("border-radius", (v) => v.split(/\s+/).every((x) => tok(x) || /^(0|50%)$/.test(x)), "UI006", "radius not from a token", "use var(--r-sm), var(--r-md), var(--r-lg) or var(--r-full) from learn/tokens.css");
  if (f !== "base.css") for (const m of css.matchAll(/!important/g)) L.bad("UI007", f, at(m), "!important outside base.css", "remove !important and win with a more specific selector; only base.css may use it, for [hidden] and reduced motion");
  const imp = (css.match(/!important/g) || []).length;
  if (f === "base.css" && imp > 6) L.bad("UI007", f, null, `${imp} uses of !important; it is for [hidden] and reduced motion only`, "remove the !important that is not for [hidden] or reduced motion; base.css may hold at most 6");
}

/* The class names of a rebuilt module -------------------------------------- */
const OK_CLASS = /^(?:ol-|is-|has-)/;
const suggest = (m, name) => `ol-${m}-${name.replace(/^[a-z]{1,2}-/, "")}`;
/* every class in a selector (not in a declaration, a string or an attribute test) */
function selectorClasses(css) {
  const out = [];
  for (const rule of css.matchAll(/([^{}]+)\{/g)) {
    if (/^\s*@/.test(rule[1])) continue;
    const bare = rule[1].replace(/\[[^\]]*\]|"[^"]*"|'[^']*'/g, (a) => " ".repeat(a.length));
    for (const c of bare.matchAll(/\.([A-Za-z_][\w-]*)/g)) out.push({ name: c[1], index: rule.index + c.index });
  }
  return out;
}
/* every class a script names: class: "…", className = "…", classList.add("…"), and the .class of a selector it asks for */
function scriptClasses(src) {
  const out = [];
  const take = (s, index) => { for (const name of s.split(/\s+/).filter(Boolean)) out.push({ name, index }); };
  for (const m of src.matchAll(/(?<=[{,]\s*)class\s*:\s*|\.className\s*=(?!=)\s*/g)) {      // a key of an options object, or an assignment; not the word class inside a string
    // the string literals of the expression, up to the , or } that ends it
    let depth = 0, q = null, lit = "", start = 0;
    for (let i = m.index + m[0].length; i < src.length; i++) {
      const ch = src[i];
      if (q) { if (ch === "\\") { lit += src[++i]; } else if (ch === q) { if (!/=\s*$/.test(src.slice(start - 6, start))) take(lit, start); q = null; lit = ""; } else lit += ch; continue; }   // a word compared with (=== "blocks") is not a class
      if (ch === '"' || ch === "'") { q = ch; start = i; }
      else if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") { if (!depth) break; depth--; }
      else if (!depth && (ch === "," || ch === "}" || ch === ";")) break;
    }
  }
  for (const m of src.matchAll(/classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g)) for (const s of m[1].matchAll(/"([^"]*)"|'([^']*)'/g)) take(s[1] ?? s[2], m.index);
  for (const m of src.matchAll(/\b(?:querySelector(?:All)?|closest|matches)\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) for (const c of m[1].replace(/\[[^\]]*\]/g, "").matchAll(/\.([A-Za-z_][\w-]*)/g)) out.push({ name: c[1], index: m.index });
  return out;
}
for (const m of MODULES) {
  const f = `${m}/${m}.css`, css = strip(rd(f));
  for (const c of selectorClasses(css)) if (!OK_CLASS.test(c.name)) L.bad("UI015", f, lineOf(css, c.index), `class .${c.name} does not start with ol-`, `rename .${c.name} to .${suggest(m, c.name)} here and wherever a script uses it; a state may be is-… or has-…`);
}

/* Scripts --------------------------------------------------------------- */
const scripts = jsIn("ui").concat(jsIn("i18n"), jsIn("shell"), MODULES.flatMap(jsIn));
for (const f of scripts) {
  const src = strip(rd(f)).split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "")).join("\n");
  const at = (m) => lineOf(src, m.index);
  for (const m of src.matchAll(/\b(fetch|XMLHttpRequest|EventSource|WebSocket|sendBeacon|importScripts)\b\s*[(.]/g)) L.bad("UI008", f, at(m), `uses the network (${m[1]}); only api.js may`, "move the request into learn/api.js and call it from here through the API object, as the other pages do");
  if (f !== "ui/icons.js") for (const m of src.matchAll(/\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/g)) L.bad("UI009", f, at(m), `builds markup from a string (${m[1]})`, "build the nodes with OL.h(…) and set words with text: or textContent; a name is text, never HTML");
  for (const m of src.matchAll(/\b(eval|new Function)\s*\(/g)) L.bad("UI010", f, at(m), "runs a string as code", `remove ${m[1]}( and call a function that is written out instead`);
  for (const m of src.matchAll(/(?<![\w.])console\.(log|debug)\(/g)) L.bad("UI011", f, at(m), `leaves a console.${m[1]}`, `delete the console.${m[1]} call`);
  // the words inside quotes are what a person reads ("import your list"), not code
  const code = src.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (s) => " ".repeat(s.length));
  for (const m of code.matchAll(/\bimport\s|\brequire\(/g)) L.bad("UI012", f, at(m), "modules are not used; scripts share window.OL", "remove the import or require and read what you need from window.OL");
  // a page that is registered says which template it is built on, so the frame and the reviewer know what to expect
  for (const m of src.matchAll(/OL\.pages\.register\(\s*"([^"]+)"\s*,\s*\{([\s\S]*?)\n  \}\);/g)) {
    if (!/\btemplate:\s*(?:"T[1-9]"|\[\s*"T[1-9]"(?:\s*,\s*"T[1-9]")*\s*\])/.test(m[2])) L.bad("UI013", f, at(m), `page "${m[1]}" is registered without a template: "T1" to "T9", or a list of them`, `add template: "T2" (the template the page is built on, T1 to T9) inside OL.pages.register("${m[1]}", { … })`);
  }
  if (MODULES.some((m) => f.startsWith(m + "/"))) {
    const m = f.split("/")[0];
    for (const c of scriptClasses(src)) if (!OK_CLASS.test(c.name)) L.bad("UI015", f, lineOf(src, c.index), `class ${c.name} does not start with ol-`, `rename ${c.name} to ${suggest(m, c.name)} here and in learn/${m}/${m}.css; a state may be is-… or has-…`);
  }
}

/* The gallery is a developer's page, and so is this folder's README ---------- */
const ignore = rd(".assetsignore").split("\n").map((l) => l.trim());
for (const f of ["_ui.html", "ui/gallery.js", "ui/gallery.css", "README.md"]) if (!ignore.includes(f)) L.bad("UI014", ".assetsignore", null, `does not list ${f}: it would be published`, `add the line ${f} to learn/.assetsignore`);

L.finish(`  ok  ${scripts.length} scripts and ${SHEETS.length} stylesheets keep to the tokens, the network rule, the no-markup-strings rule, the template declaration and the ol- class names`);
