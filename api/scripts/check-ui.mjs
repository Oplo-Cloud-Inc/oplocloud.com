// The boundaries of the component library: node scripts/check-ui.mjs
//  - tokens.css is the only file with a raw colour; the rest read var(--c-…)
//  - type size, weight, stacking and radius come from tokens too
//  - nothing in learn/ui, learn/i18n or learn/shell touches the network (api.js is the one place that may)
//  - nothing builds markup from a string (names are text, never HTML), except the icon sprite
//  - the dev-only gallery is never published
import fs from "node:fs";
import path from "node:path";

const LEARN = path.resolve(new URL("../../learn", import.meta.url).pathname);
const rd = (f) => fs.readFileSync(path.join(LEARN, f), "utf8");
const problems = [];
const bad = (m) => problems.push(m);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
const lineOf = (s, i) => s.slice(0, i).split("\n").length;

/* CSS ------------------------------------------------------------------- */
for (const f of ["base.css", "ui/ui.css", "ui/gallery.css", "shell/shell.css"]) {
  const css = strip(rd(f));
  const hit = (re, why) => { for (const m of css.matchAll(re)) bad(`${f}:${lineOf(css, m.index)} ${why}: ${m[0].trim()}`); };
  const prop = (name, ok, why) => { for (const m of css.matchAll(new RegExp("(?<![\\w-])" + name + ":\\s*([^;}]+)", "g"))) if (!ok(m[1].trim())) bad(`${f}:${lineOf(css, m.index)} ${why}: ${m[0].trim()}`); };
  const tok = (v) => /^var\(--[\w-]+\)$/.test(v) || /^(inherit|initial|unset|normal|auto|none)$/.test(v);
  hit(/#[0-9a-fA-F]{3,8}\b(?![^{]*\{)/g, "raw colour");                                // a hex outside a selector (url(#id) is allowed)
  hit(/(?<![\w-])(?:rgba?|hsla?|oklch|oklab)\([^)]*\)/g, "raw colour");
  for (const m of css.matchAll(/color-mix\([^;{}]*\)/g)) if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(|\b(?:white|black|red|green|blue)\b/.test(m[0])) bad(`${f}:${lineOf(css, m.index)} raw colour in color-mix: ${m[0]}`);
  prop("font-size", (v) => tok(v) || /^(100%|1em|1rem)$/.test(v), "type size not from a token");
  prop("font-weight", tok, "weight not from a token");
  prop("font-family", (v) => tok(v) || /^var\(--font-(ui|mono)\)/.test(v), "family not from a token");
  prop("z-index", (v) => tok(v) || /^calc\(var\(--z-[\w-]+\) [+-] \d\)$/.test(v) || /^-?[0-4]$/.test(v), "stacking not from a token");   // 0-4: order inside one component
  prop("border-radius", (v) => v.split(/\s+/).every((x) => tok(x) || /^(0|50%)$/.test(x)), "radius not from a token");
  if (f !== "base.css") hit(/!important/g, "!important");
  const imp = (css.match(/!important/g) || []).length;
  if (f === "base.css" && imp > 6) bad(`${f}: ${imp} uses of !important; it is for [hidden] and reduced motion only`);
}

/* Scripts --------------------------------------------------------------- */
const scripts = fs.readdirSync(path.join(LEARN, "ui")).filter((f) => f.endsWith(".js")).map((f) => "ui/" + f)
  .concat(fs.readdirSync(path.join(LEARN, "i18n")).filter((f) => f.endsWith(".js")).map((f) => "i18n/" + f))
  .concat(fs.readdirSync(path.join(LEARN, "shell")).filter((f) => f.endsWith(".js")).map((f) => "shell/" + f));
for (const f of scripts) {
  const src = strip(rd(f)).split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "")).join("\n");
  for (const m of src.matchAll(/\b(fetch|XMLHttpRequest|EventSource|WebSocket|sendBeacon|importScripts)\b\s*[(.]/g)) bad(`${f}:${lineOf(src, m.index)} uses the network (${m[1]}); only api.js may`);
  if (f !== "ui/icons.js") for (const m of src.matchAll(/\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/g)) bad(`${f}:${lineOf(src, m.index)} builds markup from a string (${m[1]})`);
  for (const m of src.matchAll(/\b(eval|new Function)\s*\(/g)) bad(`${f}:${lineOf(src, m.index)} runs a string as code`);
  for (const m of src.matchAll(/(?<![\w.])console\.(log|debug)\(/g)) bad(`${f}:${lineOf(src, m.index)} leaves a console.${m[1]}`);
  if (/\bimport\s|\brequire\(/.test(src)) bad(`${f}: modules are not used; scripts share window.OL`);
}

/* The gallery is a developer's page ------------------------------------- */
const ignore = rd(".assetsignore").split("\n").map((l) => l.trim());
for (const f of ["_ui.html", "ui/gallery.js", "ui/gallery.css"]) if (!ignore.includes(f)) bad(`.assetsignore does not list ${f}: the gallery would be published`);

if (problems.length) { console.log(problems.map((p) => "  FAIL " + p).join("\n")); console.log(`${problems.length} problem(s)`); process.exit(1); }
console.log(`  ok  ${scripts.length} scripts and 4 stylesheets keep to the tokens, the network rule and the no-markup-strings rule`);
