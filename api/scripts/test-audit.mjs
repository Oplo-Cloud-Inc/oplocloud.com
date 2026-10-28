// What the audit log must never hold, and who decides (E8): node scripts/test-audit.mjs
//
// One list of sensitive fields lives in services/india.js. The audit writer and the Directory ask it, and a field
// is sensitive by its name, so a module added next year is masked without anyone remembering to add it to a list.
import assert from "node:assert/strict";
import fs from "node:fs";
import * as A from "../src/services/audit.js";
import * as I from "../src/services/india.js";
import { audited } from "./lib-prove.mjs";

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("  ok  " + name); };

ok("a field named like a phone, an Aadhaar, a UDID, a bank or a UPI field is sensitive, in any module and either spelling", () => {
  for (const f of ["fatherPhone", "guardianPhone", "emergencyPhone", "phone_number", "aadhaar", "udid", "bankAccount", "bank_ifsc", "upiId", "payer_upi", "cardLast4", "cardNumber"]) assert.ok(I.isSensitive(f), f + " should be sensitive");
  for (const f of ["name", "house", "admissionNo", "category", "address", "pin", "apaar", "pen", "occupiedBy", "reportCardId", "discardReason", "groupName"]) assert.ok(!I.isSensitive(f), f + " should not be");
});

ok("every field of the student form that holds a phone, an Aadhaar number or a disability ID is on the list", () => {
  for (const [key] of I.FIELDS) assert.equal(I.isSensitive(key), /phone|aadhaar|udid/i.test(key), key);
});

ok("the audit writer masks them before and after, and never writes the value as typed", () => {
  const before = { emergencyPhone: "+91 98765 43210", bankAccountNo: "123456789012", upiId: "ravi@okbank", aadhaar: "XXXX-XXXX-1234", udid: "MH12345678", house: "Agni" };
  const after = { emergencyPhone: "+91 91234 56789", bankAccountNo: "999988887777", upiId: "ravi@oksbi", aadhaar: "XXXX-XXXX-9876", udid: "MH87654321", house: "Jal" };
  const out = Object.fromEntries(A.changes(before, after, Object.keys(after)).map((c) => [c.field, c]));
  assert.deepEqual(out.emergencyPhone, { field: "emergencyPhone", before: "••••3210", after: "••••6789" });
  assert.deepEqual(out.bankAccountNo, { field: "bankAccountNo", before: "••••9012", after: "••••7777" });
  assert.deepEqual(out.upiId, { field: "upiId", before: "••••", after: "••••" }, "an id with no digits shows only that something was there");
  assert.deepEqual(out.aadhaar, { field: "aadhaar", before: "••••1234", after: "••••9876" });
  assert.deepEqual(out.udid, { field: "udid", before: "••••5678", after: "••••4321" });
  assert.deepEqual(out.house, { field: "house", before: "Agni", after: "Jal" }, "what is not sensitive is written as it was");
  const text = JSON.stringify(out);
  for (const raw of ["98765", "91234", "12345678", "99998888", "ravi@", "87654321"]) assert.ok(!text.includes(raw), "the log would hold " + raw);
});

ok("a value that is not there is written as nothing, and a field that did not change is not written", () => {
  assert.deepEqual(A.changes({ fatherPhone: null, house: "Agni" }, { fatherPhone: "", house: "Agni" }, ["fatherPhone", "house"]), []);
  assert.deepEqual(A.changes({}, { fatherPhone: "+91 98765 43210" }, ["fatherPhone"]), [{ field: "fatherPhone", before: null, after: "••••3210" }]);
});

ok("the rows of one request share a request id, and a single event has none", () => {
  const actor = { id: "acc_1", name: "Ritika Sood" };
  const many = A.rows("org_1", actor, [{ module: "m", action: "a", verb: "changed" }, { module: "m", action: "a", verb: "changed" }]);
  assert.equal(many.length, 2); assert.ok(many[0].request && many[0].request === many[1].request);
  assert.equal(many[0].orgId, "org_1"); assert.equal(many[0].actorName, "Ritika Sood");
  assert.equal(A.rows("org_1", actor, [{ module: "m", action: "a", verb: "changed" }])[0].request, null);
  assert.deepEqual(A.rows("org_1", actor, []), []);
});

ok("no other file keeps a list of its own: the audit writer and the Directory take the list from services/india.js", () => {
  const read = (f) => fs.readFileSync(new URL("../src/" + f, import.meta.url), "utf8");
  assert.ok(!/new Set\(\[[^\]]*fatherPhone/.test(read("services/audit.js")), "audit.js keeps its own list");
  assert.ok(/from "\.\/india\.js"/.test(read("services/audit.js")));
  assert.ok(/I\.maskValue/.test(read("routes/directory.js")), "the Directory masks through the shared function");
  assert.ok(!/replace\(\/\\D\/g, ""\);\s*return d \? "••••/.test(read("routes/directory.js")), "the Directory keeps its own masking");
});

/* O17: a proof fails when a route skips the audit. `who` here answers the audit count from a list, as the API would before and after. */
const log = (...totals) => ({ get: async () => ({ total: totals.shift() }) });
await assert.rejects(audited(log(5, 5), "POST /x", { action: "a.b.c" }, async () => "wrote nothing"), /POST \/x wrote no a\.b\.c row to the audit log/);
assert.equal(await audited(log(5, 6), "POST /x", { action: "a.b.c" }, async () => "done"), "done", "a write that logged a row passes and returns what it returned");
await assert.rejects(audited(log(5, 7), "POST /x", { action: "a.b.c", rows: 1 }, async () => 1), /wrote 2 a\.b\.c rows to the audit log, expected 1/);
await assert.rejects(audited(log(5), "POST /x", { action: "a.b.c" }, async () => { throw new Error("refused"); }), /refused/);
n++; console.log("  ok  a proof fails when a route writes no audit row, too few rows or too many (audited)");

console.log(`\n${n} checks passed`);
