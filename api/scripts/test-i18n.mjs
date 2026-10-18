// The family page's Hindi and Punjabi words: node scripts/test-i18n.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../../learn/i18n.js", import.meta.url), "utf8");
const win = { document: undefined };
new Function("window", "document", src)(win, { documentElement: {} });
const I = win.OPLO_I18N;
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const DEV = /[\u0900-\u0963\u0966-\u097F]/, GUR = /[\u0A00-\u0A7F]/;   // the danda (U+0964) is shared by both scripts

t("English is returned as it is, and a word with no translation is never blank", () => {
  I.use("en"); assert.equal(I.t("Attendance"), "Attendance"); assert.equal(I.t("Something new"), "Something new");
  I.use("hi"); assert.equal(I.t("Something new"), "Something new"); assert.equal(I.t("Attendance"), "उपस्थिति");
  I.use("pa"); assert.equal(I.t("Attendance"), "ਹਾਜ਼ਰੀ");
});
t("an unknown language is English", () => { assert.equal(I.use("fr"), "en"); assert.equal(I.lang(), "en"); });
t("every entry has a Hindi in Devanagari and a Punjabi in Gurmukhi, and neither is just the English", () => {
  for (const [en, row] of Object.entries(I.DICT)) {
    assert.equal(row.length, 2, en); assert.ok(DEV.test(row[0]), "Hindi for " + en); assert.ok(GUR.test(row[1]), "Punjabi for " + en);
    assert.notEqual(row[0], en); assert.notEqual(row[1], en);
    assert.equal(GUR.test(row[0]) || DEV.test(row[1]), false, "scripts not mixed: " + en);
  }
  assert.ok(Object.keys(I.DICT).length >= 60);
});
t("the three languages are offered by name, in their own script", () => { assert.deepEqual(I.names().map((l) => l[0]), ["en", "hi", "pa"]); assert.ok(DEV.test(I.names()[1][1])); assert.ok(GUR.test(I.names()[2][1])); });
console.log(n + " checks");
