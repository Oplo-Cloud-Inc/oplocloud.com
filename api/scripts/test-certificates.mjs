// Certificate numbers and the public disclosure, with no database: node scripts/test-certificates.mjs
import assert from "node:assert/strict";
import * as C from "../src/services/certificates.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const fail = (m, f) => { const e = new Error(m); e.field = f; throw e; };

t("a number names the school, the kind, the year and a four-digit count", () => {
  assert.equal(C.numberText("SFHS", "TC", "2026-2027", 7), "SFHS/TC/2026-27/0007");
  assert.equal(C.numberText("SFHS", "BF", "2026-2027", 12345), "SFHS/BF/2026-27/12345");
  assert.equal(C.prefixOf("st-mary's"), "STMARYS"); assert.equal(C.prefixOf(""), "SCHOOL"); assert.equal(C.prefixOf("a very long school name indeed"), "AVERYLONGSCH");
});
t("each kind of certificate has its own series", () => {
  assert.equal(C.SERIES["Transfer certificate"], "TC"); assert.equal(C.SERIES["Character certificate"], "CH"); assert.equal(C.SERIES.Other, undefined);
});
t("what a school says about itself is checked and trimmed", () => {
  const d = C.cleanDisclosure({ general: { affiliationNo: " 1630123 ", email: "office@school.example", website: "https://school.example", principal: "  A. Kaur " }, facts: [{ label: " Campus ", value: "2 acres" }, { label: "", value: "dropped" }, { label: "Library books", value: 4200 }], publishTc: true }, fail);
  assert.equal(d.general.affiliationNo, "1630123"); assert.equal(d.general.principal, "A. Kaur"); assert.equal(d.facts.length, 2); assert.equal(d.facts[1].value, "4200"); assert.equal(d.publishTc, true);
  assert.throws(() => C.cleanDisclosure({ general: { email: "nope" } }, fail), (e) => e.field === "email");
  assert.throws(() => C.cleanDisclosure({ general: { website: "ftp://x" } }, fail), (e) => e.field === "website");
});
t("publishing certificates is off until it is turned on", () => {
  assert.equal(C.cleanDisclosure({}, fail).publishTc, false); assert.equal(C.cleanDisclosure({ publishTc: "yes" }, fail).publishTc, false); assert.equal(C.disclosureOf(null).publishTc, false); assert.equal(C.disclosureOf("{bad").publishTc, false);
});
console.log(n + " checks");
