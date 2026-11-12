// A change and the record of it stand or fall together (E1, E2): node scripts/test-batch.mjs
//
// The repository's own writes, run against a throwaway local D1 (the real migrations, in a temp folder). A statement
// is made to fail in the middle of a batch and the test shows what the batch did: nothing of it is kept. That is
// what confirms D1's batch is one transaction here, instead of assuming it. Nothing touches the dev database.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { Miniflare } from "miniflare";
import { D1Repository } from "../src/repo/d1.js";
import * as I from "../src/services/india.js";
import * as A from "../src/services/audit.js";

const API = path.resolve(new URL("..", import.meta.url).pathname);
const DB_ID = /database_id\s*=\s*"([^"]+)"/.exec(fs.readFileSync(path.join(API, "wrangler.toml"), "utf8"))[1];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "oplo-batch-"));
let n = 0, mf;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + (e && e.message)); throw e; } };

try {
  execFileSync("npx", ["wrangler", "d1", "migrations", "apply", "oplo-platform-db", "--local", "--persist-to", tmp], { cwd: API, env: { ...process.env, CI: "true" }, stdio: "pipe" });
  mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('') } }", d1Databases: { DB: DB_ID }, d1Persist: path.join(tmp, "v3", "d1") });
  const db = await mf.getD1Database("DB");
  const repo = new D1Repository(db);
  const val = async (sql, ...args) => { const r = await db.prepare(sql).bind(...args).first(); return r ? Object.values(r)[0] : null; };

  const ORG = "org_batch", ACTOR = { id: "acc_actor", name: "Test Actor" };
  const person = (i) => ({ id: "acc_s" + String(i).padStart(3, "0"), email: `s${i}@batch.test`, lower: `s${i}@batch.test`, name: `Student ${i}`, first: "Student", initials: "S", hue: "#0071e3", title: null });
  const people = (list) => ({ fresh: list, roles: list.map((p) => ({ lower: p.lower, role: "student" })), members: list.map((p) => ({ lower: p.lower, mrole: "member" })), links: [], clear: [] });
  const N = 60, kids = Array.from({ length: N }, (_, i) => person(i));
  const houseOf = (id) => val(`SELECT house FROM learn_student_india WHERE account_id = ?`, id);
  const housesBy = async (house) => val(`SELECT COUNT(*) FROM learn_student_india WHERE org_id = ? AND house IS ?`, ORG, house);
  const auditN = (where = "1=1", ...a) => val(`SELECT COUNT(*) FROM learn_audit WHERE ${where}`, ...a);
  const events = (list, house) => list.map((k) => ({ module: "students", action: "students.record.changed", verb: "changed", recordKind: "student", recordId: k.id, recordLabel: k.name, field: "house", before: "Agni", after: house }));

  await step("setup: a school of sixty students, every one in Agni", async () => {
    await db.prepare(`INSERT INTO organizations (id, slug, name, kind, created_at, updated_at) VALUES (?, 'batch', 'Batch School', 'school', 1, 1)`).bind(ORG).run();
    await repo.importPeople(ORG, people([{ ...person(999), id: ACTOR.id, email: "actor@batch.test", lower: "actor@batch.test", name: ACTOR.name }]), null);
    await repo.importPeople(ORG, people(kids), ACTOR.id);
    await repo.putIndiaStudents(ORG, kids.map((k, i) => ({ accountId: k.id, row: I.toRow({ house: "Agni", admissionNo: "ADM-" + i }) })), ACTOR.id, "2026-10-27");
    assert.equal(await housesBy("Agni"), N);
    assert.equal(await auditN(), 0);
  });

  await step("a batch that fails keeps nothing of itself: not the changes before the bad statement, and not their audit rows", async () => {
    const items = kids.map((k, i) => ({ accountId: k.id, audit: null }));
    const rows = A.rows(ORG, ACTOR, events(kids, "Jal"));
    rows.forEach((r, i) => { items[i].audit = r; });
    items[30].audit = { ...rows[30], orgId: null };                // the audit row of student 30 cannot be written: org_id is NOT NULL
    let err;
    try { await repo.setHouses(ORG, items, "Jal", ACTOR.id); } catch (e) { err = e; }
    assert.ok(err, "the bad row stops the call");
    assert.equal(err.applied, 25, "the first batch of 25 was complete and is kept; the error says how many");
    assert.equal(await housesBy("Jal"), 25, "students 0 to 24 changed");
    assert.equal(await houseOf(kids[27].id), "Agni", "student 27 was in the failed batch before the bad row, and was rolled back with it");
    assert.equal(await houseOf(kids[55].id), "Agni", "later batches were never tried");
    assert.equal(await auditN(`action = 'students.record.changed'`), 25, "only the kept changes have their rows");
    assert.equal(await auditN(`record_id IN (?, ?)`, kids[27].id, kids[55].id), 0);
  });

  await step("the same call, sent again with good rows, finishes the job and writes each row once", async () => {
    const todo = [];
    for (const k of kids) if ((await houseOf(k.id)) !== "Jal") todo.push(k);
    assert.equal(todo.length, 35);
    const rows = A.rows(ORG, ACTOR, events(todo, "Jal"));
    const applied = await repo.setHouses(ORG, todo.map((k, i) => ({ accountId: k.id, audit: rows[i] })), "Jal", ACTOR.id);
    assert.equal(applied, 35);
    assert.equal(await housesBy("Jal"), N);
    assert.equal(await auditN(`action = 'students.record.changed'`), N, "one row per change, none twice");
  });

  await step("a new student is all or nothing: a failing audit row leaves no account, profile, role, membership or row behind", async () => {
    const p = person(1000), accounts = () => val(`SELECT COUNT(*) FROM accounts`);
    const before = await accounts();
    const good = A.rows(ORG, ACTOR, [{ module: "students", action: "students.record.created", verb: "created", recordKind: "student", recordId: p.id, recordLabel: p.name }]);
    const item = { accountId: p.id, row: I.toRow({ admissionNo: "ADM-NEW" }), contact: { dateOfBirth: "2012-01-02", mailingAddress: null }, audit: [{ ...good[0], orgId: null }] };
    await assert.rejects(repo.createIndiaStudent(ORG, { people: people([p]), item }, ACTOR.id, "2026-10-27"), /NOT NULL/i);
    assert.equal(await accounts(), before, "no account");
    assert.equal(await val(`SELECT COUNT(*) FROM profiles WHERE account_id = ?`, p.id), 0, "no profile");
    assert.equal(await val(`SELECT COUNT(*) FROM account_roles WHERE account_id = ?`, p.id), 0, "no role");
    assert.equal(await val(`SELECT COUNT(*) FROM organization_memberships WHERE account_id = ?`, p.id), 0, "no membership");
    assert.equal(await val(`SELECT COUNT(*) FROM learn_student_india WHERE account_id = ?`, p.id), 0, "no student row");
    assert.equal(await val(`SELECT COUNT(*) FROM account_contacts WHERE account_id = ?`, p.id), 0, "no contact card");
    // and the email is not used up: the same student, with a good audit row, is made at once
    await repo.createIndiaStudent(ORG, { people: people([p]), item: { ...item, audit: good } }, ACTOR.id, "2026-10-27");
    assert.equal(await accounts(), before + 1);
    assert.equal(await auditN(`action = 'students.record.created' AND record_id = ?`, p.id), 1);
  });

  await step("a number that clashes at the last moment (two offices at once) rolls back the account that was about to be made", async () => {
    const p = person(1001), accounts = () => val(`SELECT COUNT(*) FROM accounts`);
    const before = await accounts();
    const item = { accountId: p.id, row: I.toRow({ admissionNo: "ADM-7" }) };           // student 7 already holds ADM-7
    await assert.rejects(repo.createIndiaStudent(ORG, { people: people([p]), item }, ACTOR.id, "2026-10-27"), /UNIQUE/i);
    assert.equal(await accounts(), before, "the invited account was not kept");
    assert.equal(await val(`SELECT COUNT(*) FROM organization_memberships WHERE account_id = ?`, p.id), 0);
  });

  await step("a saved student is whole or not at all: statements of one student are never split, and a bad audit row stops the lot", async () => {
    const three = kids.slice(0, 3), rows = A.rows(ORG, ACTOR, three.map((k) => ({ module: "students", action: "students.record.changed", verb: "changed", recordKind: "student", recordId: k.id, recordLabel: k.name, field: "house", before: "Jal", after: "Vayu" })));
    const items = three.map((k, i) => ({ accountId: k.id, row: I.toRow({ house: "Vayu", admissionNo: "ADM-" + i }), audit: [i === 2 ? { ...rows[i], orgId: null } : rows[i]] }));
    await assert.rejects(repo.putIndiaStudents(ORG, items, ACTOR.id, "2026-10-27"), /NOT NULL/i);
    for (const k of three) assert.equal(await houseOf(k.id), "Jal", k.name + " is as it was");
    items[2].audit = [rows[2]];
    await repo.putIndiaStudents(ORG, items, ACTOR.id, "2026-10-27");
    for (const k of three) assert.equal(await houseOf(k.id), "Vayu");
    assert.equal(await auditN(`record_id IN (?, ?, ?) AND after = 'Vayu'`, ...three.map((k) => k.id)), 3);
  });

  console.log(`\n${n} steps passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exitCode = 1;
} finally {
  if (mf) await mf.dispose();
  fs.rmSync(tmp, { recursive: true, force: true });
}
