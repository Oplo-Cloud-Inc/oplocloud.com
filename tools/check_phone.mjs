// Self-check for the pure parts of the phone shell (learn/phone.js): the hue a
// subject always gets, readable initials on any avatar colour, the greeting.
//   node tools/check_phone.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const stubQuery = () => ({ matches: false, addEventListener() {} });
const win = { matchMedia: stubQuery, addEventListener() {}, visualViewport: null };
win.window = win;
const ctx = { window: win, document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } }, setTimeout, clearTimeout, requestAnimationFrame: (f) => f() };
vm.createContext(Object.assign(ctx, win));
vm.runInContext(fs.readFileSync(new URL("../learn/phone.js", import.meta.url), "utf8"), ctx);

const K = { el() {}, esc: String, icon: () => "", API: {}, S: {} };
const P = ctx.window.OPLO_PHONE(K);

// A subject keeps its hue, whatever it is called today.
assert.equal(P.toneOf("Mathematics"), "blue");
assert.equal(P.toneOf("Algebra I"), "blue");
assert.equal(P.toneOf("Biology"), "green");
assert.equal(P.toneOf("Global History I"), "orange");
assert.equal(P.toneOf("Something we have never met"), P.toneOf("Something we have never met"));
assert.ok(["blue", "indigo", "purple", "pink", "orange", "green", "teal"].includes(P.toneOf("zzz")));

// Initials can be read on the hue they sit on.
const swatch = (hue) => { const n = { style: {} }; P.hue(n, hue); return n.style; };
assert.equal(swatch("#fff3a8").color, "#1d1d1f");   // a light yellow gets dark ink
assert.equal(swatch("#ffd60a").color, "#1d1d1f");
assert.equal(swatch("#0071e3").color, "#fff");      // a deep blue gets white
assert.equal(swatch("#222").color, "#fff");
assert.equal(swatch("not a colour").color, "#fff"); // anything else falls back to the accent
assert.equal(swatch(undefined).background, "var(--ph-accent)");

// The greeting follows the hour and says a name only when it has one.
assert.match(P.greet("Sam"), /^Good (morning|afternoon|evening), Sam$/);
assert.match(P.greet(""), /^Good (morning|afternoon|evening)$/);

console.log("phone shell: ok");
