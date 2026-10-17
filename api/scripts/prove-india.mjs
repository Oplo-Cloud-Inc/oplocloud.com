// The India admin core over HTTP, as the people who use it, ending with the refusals:
// a class, a checked import, identity numbers and consent, the compliance picture, the
// exports, and who may not read any of it. Local only; needs an administrator.
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-india.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import * as I from "../src/services/india.js";
const API = process.env.API || "http://localhost:8787/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Ind-" + RUN + "-A1!";
function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, { method, headers: { "content-type": "application/json", origin: "http://localhost:8123", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), put: (p, b) => call("PUT", p, b ?? {}), post: (p, b) => call("POST", p, b ?? {}),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
const admin = person("admin"), registrar = person("registrar"), teacher = person("teacher"), tanvi = person("tanvi"), anon = person("anon");
const ctx = {};
// A real-looking Aadhaar (valid check digit) so the proof exercises the masking.
const AAD_PREFIX = "23456789012", AADHAAR = AAD_PREFIX + I.verhoeffDigit(AAD_PREFIX);

try {
  await step("people: a registrar, a class teacher, three students and an outsider", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.registrar = await mk("Rita Registrar", "teacher", `rita.in${RUN}@s.test`);
    await admin.post(`/accounts/${ctx.registrar.id}/roles`, { product: "learn", role: "registrar", orgId: ctx.org });
    ctx.teacher = await mk("Tia Teacher", "teacher", `tia.in${RUN}@s.test`);
    ctx.tanvi = await mk("Tanvi Jindal", "student", `tanvi.in${RUN}@s.test`);
    ctx.dhruv = await mk("Dhruv Randhawa", "student", `dhruv.in${RUN}@s.test`);
    ctx.daksh = await mk("Daksh Jindal", "student", `daksh.in${RUN}@s.test`);
    await registrar.login(ctx.registrar.email, PW); await teacher.login(ctx.teacher.email, PW); await tanvi.login(ctx.tanvi.email, PW);
  });

  await step("/me tells the console which region the school is in", async () => {
    const me = (await admin.get("/me")).account.organizations[0];
    assert.equal(me.region, "US", "every school is US until it is made IN");
  });

  await step("a class is made with its teacher, and made again without losing what it has", async () => {
    const c = (await admin.put("/india/classes", { grade: "Class X", section: "c", programme: "ICSE", room: "S-322", capacity: 30, classTeacherId: ctx.teacher.id })).class;
    assert.equal(c.label, "X-C"); assert.equal(c.classTeacher.name, "Tia Teacher"); assert.equal(c.strength, 0);
    ctx.classX = c.id;
    const again = (await admin.put("/india/classes", { grade: "X", section: "C", room: "S-400" })).class;
    assert.equal(again.id, c.id, "the same class, not a second one");
    assert.equal(again.room, "S-400"); assert.equal(again.programme, "ICSE"); assert.equal(again.classTeacher.id, ctx.teacher.id);
    const list = (await admin.get("/india/classes")).classes;
    assert.deepEqual(list.map((x) => x.label), ["X-C"]);
  });

  await step("a class teacher must belong to the school", async () => {
    refused(await admin.try("PUT", "/india/classes", { grade: "X", section: "C", classTeacherId: "acc_nobody" }), 400);
  });

  await step("a check reads every row and writes none", async () => {
    const rows = [
      { email: ctx.tanvi.email, class: "X-C", apaar: "534652487008", pen: "96636761410", gender: "F", category: "General", house: "Agni", rollNo: 21,
        dob: "10/09/2010", address: "#588, Sector 16", consent: "Verified (DigiLocker)", fatherName: "Tarun Jindal", fatherPhone: "98453 98272", whatsapp: "Yes" },
      { email: ctx.dhruv.email, class: "X-C", apaar: "12345", gender: "M" },                 // a bad APAAR
      { email: "nobody@nowhere.test", class: "X-C" }                                          // not a person the school has
    ];
    const r = await admin.post("/india/import", { check: true, rows });
    assert.equal(r.checked, true); assert.equal(r.rows, 3); assert.equal(r.matched, 2); assert.equal(r.ready, 1); assert.equal(r.written, 0);
    assert.deepEqual(r.unmatched, ["nobody@nowhere.test"]);
    assert.equal(r.errorCount, 1); assert.equal(r.errors[0].field, "apaar"); assert.equal(r.errors[0].row, 2);
    assert.equal((await admin.get("/india/students")).students.length, 0, "a check wrote nothing");
  });

  await step("the import loads what is right, names what is wrong, and finds duplicates", async () => {
    const good = { email: ctx.tanvi.email, class: "X-C", programme: "ICSE", apaar: "534652487008", pen: "96636761410", gender: "F", category: "EWS/DG (UT allotment)", house: "Agni", rollNo: 21,
      dob: "10/09/2010", address: "#588, Sector 16", consent: "Verified (DigiLocker)", fatherName: "Tarun Jindal", fatherPhone: "98453 98272", motherName: "Ritu Jindal",
      primaryContact: "Father", whatsapp: "Yes", guardianEmail: "tarun@family.example", aadhaar: AADHAAR };
    const bad = { email: ctx.dhruv.email, class: "X-C", apaar: "12345", gender: "M" };
    const clash = { email: ctx.daksh.email, class: "X-C", apaar: "534652487008", pen: "96636761499", gender: "M" };   // Tanvi's APAAR
    const r = await admin.post("/india/import", { rows: [good, bad, clash] });
    assert.equal(r.written, 1, "Tanvi only");
    const fields = r.errors.map((e) => `${e.row}:${e.field}`).sort();
    assert.deepEqual(fields, ["2:apaar", "3:apaar"], "the bad format, and the duplicate");
    assert.ok(/already has that APAAR/.test(r.errors.find((e) => e.row === 3).message));
    const c = (await admin.get("/india/classes")).classes[0];
    assert.equal(c.strength, 1); assert.equal(c.room, "S-400", "an import never blanks or overwrites what a class has");
  });

  await step("a student's details come back typed, with Aadhaar kept to its last four digits", async () => {
    const r = await admin.get(`/students/${ctx.tanvi.id}/india`);
    const s = r.student;
    assert.equal(r.saved, true);
    assert.equal(s.classLabel, "X-C"); assert.equal(s.category, "EWS/DG"); assert.equal(s.dob, "2010-09-10"); assert.equal(s.address, "#588, Sector 16");
    assert.equal(s.fatherPhone, "+91 9845398272"); assert.equal(s.whatsapp, 1); assert.equal(s.consentStatus, "verified"); assert.equal(s.consentMethod, "digilocker");
    assert.equal(s.aadhaar, "XXXX-XXXX-" + AADHAAR.slice(8));
    assert.ok(!JSON.stringify(r).includes(AADHAAR.slice(0, 8)), "the number itself is nowhere in the answer");
  });

  await step("saving one student changes only what was named, and refuses what is wrong, field by field", async () => {
    const r = await admin.put(`/students/${ctx.tanvi.id}/india`, { house: "Terra", transport: "Bus R18" });
    assert.equal(r.student.house, "Terra"); assert.equal(r.student.pen, "96636761410", "left alone"); assert.equal(r.student.apaar, "534652487008");
    const bad = await admin.try("PUT", `/students/${ctx.tanvi.id}/india`, { pin: "12", gender: "x" });
    refused(bad, 400); assert.ok(["pin", "gender"].includes(bad.body.error.field || bad.body.field), JSON.stringify(bad.body));
    const dup = await admin.try("PUT", `/students/${ctx.dhruv.id}/india`, { apaar: "534652487008" });
    refused(dup, 409);
    const ok = await admin.put(`/students/${ctx.dhruv.id}/india`, { classId: ctx.classX, gender: "M", category: "General", dob: "15/01/2011", apaar: "REFUSED", pen: "96636761411", consentStatus: "pending", fatherName: "Gaurav Randhawa" });
    assert.equal(ok.student.apaar, "REFUSED"); assert.equal(ok.student.dob, "2011-01-15");
    await admin.put(`/students/${ctx.daksh.id}/india`, { classId: ctx.classX, gender: "M", category: "General", dob: "2010-10-18" });
  });

  await step("the compliance page counts what is there and lists what blocks a list", async () => {
    const c = await admin.get("/india/compliance");
    assert.equal(c.summary.students, 3);
    assert.deepEqual(c.summary.apaar, { have: 1, refused: 1, nogen: 0, pending: 1 });
    assert.deepEqual(c.summary.pen, { have: 2, missing: 1 });
    assert.deepEqual(c.summary.consent, { verified: 1, pending: 2, withdrawn: 0 });
    assert.equal(c.summary.board.students, 3, "Class X is a board class");
    assert.equal(c.summary.classes.length, 1); assert.equal(c.summary.classes[0].label, "X-C"); assert.equal(c.summary.classes[0].students, 3);
    const daksh = c.problems.find((p) => p.id === ctx.daksh.id);
    assert.ok(daksh.items.some((i) => i.field === "pen" && i.level === "blocks")); assert.ok(daksh.items.some((i) => i.field === "apaar" && i.level === "blocks"));
    assert.ok(!c.problems.some((p) => p.id === ctx.tanvi.id && p.items.some((i) => i.level === "blocks")), "Tanvi has everything");
    assert.equal(c.unloaded, 0);
  });

  await step("an export is one row per child in the school's own order, and never has Aadhaar in it", async () => {
    const e = await admin.get("/india/export/apaar");
    assert.equal(e.rows.length, 3); assert.deepEqual(e.columns.slice(0, 3), ["Admission no", "Name", "Class"]);
    assert.deepEqual(e.rows.map((r) => r[6]).sort(), ["Have ID", "Pending", "Refused by parent"]);
    for (const k of ["register", "udise", "consent"]) {
      const x = await admin.get(`/india/export/${k}`);
      assert.equal(x.rows.length, 3); assert.ok(!JSON.stringify(x).includes(AADHAAR.slice(8)), k + " has no Aadhaar");
    }
    refused(await admin.try("GET", "/india/export/nope"), 404);
  });

  await step("a certificate is a record only the office reads", async () => {
    const kinds = (await admin.get("/item-kinds")).kinds;
    assert.ok(kinds.certificate, "the kind is in the registry");
    assert.deepEqual(kinds.certificate.statuses, ["requested", "awaiting signature", "issued", "declined"]);
    const made = (await admin.post("/items", { kind: "certificate", title: "Bonafide certificate for Tanvi Jindal", status: "requested", subjectId: ctx.tanvi.id,
      data: { type: "Bonafide certificate", purpose: "Passport application" } })).item;
    assert.equal(made.status, "requested"); assert.equal(made.data.type, "Bonafide certificate");
    assert.equal((await admin.get("/items?kind=certificate")).items.length, 1);
    refused(await tanvi.try("GET", "/items?kind=certificate"), 403);
    refused(await teacher.try("GET", "/items?kind=certificate"), 403);
  });

  await step("the registrar can keep the records; nobody else at the school can even read them", async () => {
    assert.equal((await registrar.put(`/students/${ctx.daksh.id}/india`, { house: "Aether" })).student.house, "Aether");
    assert.equal((await registrar.get("/india/compliance")).summary.students, 3);
    for (const who of [teacher, tanvi]) {
      refused(await who.try("GET", "/india/students"), 403);
      refused(await who.try("GET", "/india/compliance"), 403);
      refused(await who.try("GET", `/students/${ctx.tanvi.id}/india`), 403);
      refused(await who.try("PUT", `/students/${ctx.tanvi.id}/india`, { house: "Agni" }), 403);
      refused(await who.try("PUT", "/india/classes", { grade: "X", section: "D" }), 403);
      refused(await who.try("POST", "/india/import", { rows: [{ email: ctx.tanvi.email }] }), 403);
      refused(await who.try("GET", "/india/export/register"), 403);
    }
    refused(await anon.try("GET", "/india/compliance"), 401);
  });

  console.log(`\n${n} steps passed.`);
} catch (e) { console.log("\nstopped: " + e.message); process.exitCode = 1; }
