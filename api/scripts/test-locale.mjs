// The browser-side locale layer, without a browser: node scripts/test-locale.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../../learn/locale.js", import.meta.url), "utf8");
const win = {};
new Function("window", src)(win);
const L = win.OPLO_LOCALE;
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const plainDate = new Date(Date.UTC(2026, 9, 17, 10, 0)).toLocaleDateString("en-US");
const plainNum = (1234567).toLocaleString("en-US");

t("nothing changes until a school that is not a US one is in force", () => {
  assert.equal(L.active(), null); assert.equal(L.word("Grade"), "Grade");
  assert.equal(L.money(1234567), "$1,234,567"); assert.equal(L.dmy("2026-10-17"), "10/17/2026");
  L.use({ region: "US", locale: "en-US", timezone: "America/New_York", currency: "USD" });
  assert.equal(L.active(), null, "a US school is left alone");
});
t("an Indian school: lakh grouping, rupees, day first, Class for Grade", () => {
  L.use({ region: "IN", locale: "en-IN", timezone: "Asia/Kolkata", currency: "INR" });
  assert.equal((1234567).toLocaleString(), "12,34,567"); assert.equal((1234567).toLocaleString("en-US"), plainNum, "a named locale is respected");
  assert.equal(L.money(1234567), "₹12,34,567"); assert.equal(L.money(499.5), "₹499.50"); assert.equal(L.money(1000000), "₹10,00,000");
  assert.equal(L.dmy("2026-10-07"), "07/10/2026"); assert.equal(L.word("Grade"), "Class"); assert.equal(L.word("Courses"), "Subjects"); assert.equal(L.word("Attendance"), "Attendance");
  assert.equal(new Date(Date.UTC(2026, 9, 17, 10, 0)).toLocaleDateString(), "17/10/2026");
  assert.equal(new Date(Date.UTC(2026, 9, 17, 10, 0)).toLocaleDateString("en-US"), plainDate);
});
t("a time is the school's, whatever the device says", () => {
  const at = new Date(Date.UTC(2026, 9, 17, 10, 0));   // 15:30 in Kolkata
  const tm = at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  assert.match(tm, /^3:30\s?(pm|PM)$/);
  assert.match(at.toLocaleString(), /17\/10\/2026, 3:30:00\s?(pm|PM)/);
  assert.match(at.toLocaleDateString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }), /Sat/);
});
t("a date alone is not moved to another calendar", () => {
  const midnightLocal = new Date(2026, 9, 17);
  assert.equal(midnightLocal.toLocaleDateString(undefined, { day: "numeric", month: "short" }).replace(/\D+/g, " ").trim().startsWith("17"), true);
});
t("going back to a US school restores the browser's own", () => {
  L.use({ region: "US" });
  assert.equal((1234567).toLocaleString(), plainNum); assert.equal(L.word("Grade"), "Grade");
});
console.log(n + " checks");
