// The repository is one class; a second method with the same name silently replaces the first,
// and every caller of the first breaks somewhere else. This says so before that happens.
import fs from "node:fs";
const src = fs.readFileSync(new URL("../src/repo/d1.js", import.meta.url), "utf8");
const seen = new Map();
for (const m of src.matchAll(/^  async (\w+)\(/gm)) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
const dup = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
if (dup.length) { console.error("repository: duplicate methods: " + dup.join(", ")); process.exit(1); }
console.log("repository: ok (" + seen.size + " methods)");
