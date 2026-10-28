// The student directory over HTTP, as the people who use it: one page of a long list with the total and what
// each chip would show; the numbers agreeing with the register's own; a search by name, admission number,
// class code and the end of a phone; a class teacher seeing their section and nothing else; a phone
// number shown only when asked, and written down; an export and a bulk change that leave audit rows; a
// student added; and the refusals.
// Local only; needs an existing school administrator.
//   API=http://localhost:8817/api/v1 CRED=/path/credentials.json node scripts/prove-directory.mjs
import { API, cred, RUN, PW, person, step, steps, refused, assert, audited } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), kid = person("student"), nobody = person("nobody");
const ctx = {};
const STEM = "Dq" + RUN.slice(-5);
const rnd = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");
const PHONE = "9" + rnd(9);
const ROLL = 100 + Math.floor(Math.random() * 800);                           // a section keeps the students of earlier runs, and a roll is one per section: take this run's own
const [S1, S2] = ["W", "X", "Y", "Z"].sort(() => Math.random() - 0.5);       // sections no demo school uses; students of earlier runs stay, so counts are taken on this run's own stem
const L1 = "XII-" + S1, L2 = "XII-" + S2;
const list = (who, q) => who.get("/directory/students?" + (q || ""));
const names = (r) => r.rows.map((x) => x.name);

try {
  await step("people: a class teacher of a new section with two students in it, and one student elsewhere", async () => {
    await admin.login(cred().email, cred().password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk(`Dina ${STEM}teacher`, "teacher", `dina.${RUN}@s.test`);
    ctx.a = await mk(`${STEM}a Alpha`, "student", `a.${RUN}@s.test`);
    ctx.b = await mk(`${STEM}b Beta`, "student", `b.${RUN}@s.test`);
    ctx.c = await mk(`${STEM}c Gamma`, "student", `c.${RUN}@s.test`);
    await teacher.login(ctx.teacher.email, PW);
    await kid.login(ctx.a.email, PW);
    ctx.cls = (await admin.put("/india/classes", { grade: "XII", section: S1, programme: "ISC", room: S1 + "-1", capacity: 30, classTeacherId: ctx.teacher.id })).class;
    ctx.other = (await admin.put("/india/classes", { grade: "XII", section: S2, programme: "ISC", room: S2 + "-1", capacity: 30 })).class;
    ctx.adm = "DD-" + RUN.toUpperCase();
    await admin.put(`/students/${ctx.a.id}/india`, { classId: ctx.cls.id, gender: "F", category: "General", house: "Agni", admissionNo: ctx.adm + "-A", fatherName: "Ravi Alpha", fatherPhone: PHONE, primaryContact: "Father", consentStatus: "verified" });
    await admin.put(`/students/${ctx.b.id}/india`, { classId: ctx.cls.id, gender: "M", admissionNo: ctx.adm + "-B" });
    await admin.put(`/students/${ctx.c.id}/india`, { classId: ctx.other.id, gender: "M", category: "OBC", admissionNo: ctx.adm + "-C" });
  });

  await step("a page is a page: fifty at most, the total is the whole list, and the pages add up", async () => {
    const all = await list(admin, "size=1");
    assert.equal(all.rows.length, 1);
    assert.ok(all.total >= 3, "the school has its students: " + all.total);
    assert.equal(all.pages, Math.ceil(all.total / 1));
    const p = await list(admin);
    assert.ok(p.rows.length <= 50 && p.size === 50 && p.page === 1);
    const last = await list(admin, "page=9999");
    assert.equal(last.page, last.pages, "a page past the end is the last page");
    const sorted = await list(admin, "sort=name&size=100");
    const ns = names(sorted); assert.deepEqual(ns, [...ns].sort((x, y) => x.localeCompare(y, "en", { sensitivity: "base", numeric: true })));
    const mine = await list(admin, "q=" + STEM + "&sort=name&dir=desc");
    assert.deepEqual(names(mine), [`${STEM}c Gamma`, `${STEM}b Beta`, `${STEM}a Alpha`], "descending");
    const byClass = await list(admin, "q=" + STEM + "&sort=class");
    assert.deepEqual(names(byClass), S1 < S2 ? [`${STEM}a Alpha`, `${STEM}b Beta`, `${STEM}c Gamma`] : [`${STEM}c Gamma`, `${STEM}a Alpha`, `${STEM}b Beta`], "by class, then roll, then name");
  });

  await step("a row carries what the list draws, and not what it must not: no phone number, no Aadhaar", async () => {
    const r = await list(admin, "q=" + STEM + "a");
    assert.equal(r.total, 1);
    const row = r.rows[0];
    assert.equal(row.classLabel, L1);
    assert.equal(row.house, "Agni"); assert.equal(row.gender, "F"); assert.equal(row.category, "General");
    assert.deepEqual(row.guardian, { name: "Ravi Alpha", relation: "Father" });
    assert.ok(Array.isArray(row.gaps) && row.gapCount === row.gaps.length && row.gaps.every((g) => g.field && g.level));
    assert.ok(!JSON.stringify(row).includes(PHONE), "a number is not in a list row");
    assert.ok(!("aadhaar" in row) && !("fatherPhone" in row));
  });

  await step("search: by name, by admission number, by class code with a roll, by the end of a phone, by a guardian's name", async () => {
    assert.deepEqual(names(await list(admin, "q=" + STEM + "b")), [`${STEM}b Beta`]);
    assert.deepEqual(names(await list(admin, "q=" + encodeURIComponent(ctx.adm + "-C"))), [`${STEM}c Gamma`]);
    assert.deepEqual(names(await list(admin, "q=" + encodeURIComponent(L1 + " " + STEM + "a"))), [`${STEM}a Alpha`]);
    assert.ok(names(await list(admin, "q=" + PHONE.slice(-4))).includes(`${STEM}a Alpha`), "the last four of a phone");
    assert.ok(names(await list(admin, "q=" + encodeURIComponent("Ravi Alp"))).includes(`${STEM}a Alpha`), "the guardian's name");
    assert.equal((await list(admin, "q=zzzzqqqq")).total, 0);
  });

  await step("filters: class, gender, category, house; and the chips count what each would show", async () => {
    assert.deepEqual(names(await list(admin, `class=${L1}&q=${STEM}&sort=name`)), [`${STEM}a Alpha`, `${STEM}b Beta`]);
    assert.deepEqual(names(await list(admin, `class=${L1},${L2}&q=${STEM}&gender=M&sort=name`)), [`${STEM}b Beta`, `${STEM}c Gamma`]);
    assert.deepEqual(names(await list(admin, `class=${L1},${L2}&q=${STEM}&category=OBC`)), [`${STEM}c Gamma`]);
    assert.deepEqual(names(await list(admin, "house=Agni&q=" + STEM)), [`${STEM}a Alpha`]);
    const r = await list(admin, `class=${L1},${L2}&q=${STEM}`);
    assert.equal(r.counts.all, 3);
    assert.equal(r.counts.consent, 2, "two of the three have no verified consent");
    const chip = await list(admin, `class=${L1},${L2}&q=${STEM}&consent=pending`);
    assert.equal(chip.total, r.counts.consent, "the chip's count is what the list shows when it is chosen");
    assert.equal(chip.counts.consent, 2, "choosing a chip does not change its own count");
    const gaps = await list(admin, `class=${L1},${L2}&q=${STEM}&filter=record-gaps`);
    assert.equal(gaps.total, r.counts.gaps);
    assert.ok(gaps.rows.every((x) => x.gaps.some((g) => g.level === "blocks")));
    assert.ok((await list(admin, `class=${L1},${L2}&q=${STEM}&status=left`)).total === 0, "nobody here has left");
  });

  await step("the numbers are the register's own: under 75% and the early-warning list match what the register says", async () => {
    const d = await list(admin);
    const watch = await admin.get("/register/watch");
    const early = await admin.get("/register/early-warning");
    assert.equal(d.kpis.under75, watch.summary.below, "under 75%");
    assert.equal(d.kpis.warning, early.summary.high + early.summary.medium, "early warning");
    assert.equal(d.kpis.warningHigh, early.summary.high);
    const below = await list(admin, "attendance=under-75&size=100");
    assert.equal(below.total, watch.summary.below);
    assert.ok(below.rows.every((x) => x.attendance && x.attendance.status === "below" && x.attendance.percent < 75));
    const w = await list(admin, "warning=high,medium&size=100");
    assert.equal(w.total, d.kpis.warning);
  });

  await step("the record: whole, with the numbers a board asks for masked, who to call, and the alerts", async () => {
    const r = await admin.get(`/directory/students/${ctx.a.id}`);
    const s = r.student;
    assert.equal(s.name, `${STEM}a Alpha`); assert.equal(s.classLabel, L1);
    assert.equal(r.classTeacher.name, ctx.teacher.name);
    assert.equal(r.contacts[0].name, "Ravi Alpha"); assert.equal(r.contacts[0].hasPhone, true);
    assert.match(r.contacts[0].phone, /^•+\d{4}$/, "a number is masked until asked for");
    assert.ok(!JSON.stringify(r).includes(PHONE), "the record does not carry the number");
    assert.equal(s.aadhaar.onFile, false);
    assert.ok(r.can.write === true);
    refused(await admin.try("GET", "/directory/students/acc_nobody"), 404);
  });

  await step("showing a number is a request: it comes back once asked for, and is written down with who asked", async () => {
    const shown = await audited(admin, "POST /directory/students/:accountId/phone", { action: "students.guardian.phone_revealed", record: ctx.a.id, rows: 1 }, () => admin.post(`/directory/students/${ctx.a.id}/phone`, { which: "father" }));
    assert.ok(String(shown.phone).replace(/\D/g, "").endsWith(PHONE.slice(-10)));
    refused(await admin.try("POST", `/directory/students/${ctx.a.id}/phone`, { which: "mother" }), 404);
    refused(await admin.try("POST", `/directory/students/${ctx.a.id}/phone`, { which: "uncle" }), 400);
    const log = await admin.get(`/audit?record=${ctx.a.id}&action=students.guardian.phone_revealed`);
    assert.equal(log.total, 1);
    assert.equal(log.events[0].actor.id, (await admin.get("/me")).account.id);
    assert.equal(log.events[0].verb, "revealed");
  });

  await step("a class teacher sees their own section and no other student, whatever the address says", async () => {
    const t = await list(teacher, "q=" + STEM);
    assert.equal(t.total, 2); assert.ok(t.scope.sections.includes(L1) && t.scope.sections.length >= 1);
    assert.ok(names(t).every((n) => n.startsWith(STEM) && !n.includes("Gamma")));
    assert.equal((await list(teacher, `class=${L2}&q=${STEM}`)).total, 0, "asking for another section gets nothing");
    assert.equal((await list(teacher, "q=" + STEM + "c")).total, 0);
    await teacher.get(`/directory/students/${ctx.a.id}`);
    refused(await teacher.try("GET", `/directory/students/${ctx.c.id}`), 403);
    refused(await teacher.try("POST", `/directory/students/${ctx.c.id}/phone`, { which: "father" }), 403);
    refused(await teacher.try("GET", "/directory/students/export"), 403);
    refused(await teacher.try("POST", "/directory/students/bulk/house", { ids: [ctx.a.id], house: "Jal" }), 403);
    assert.equal(t.can.write, false); assert.equal(t.can.export, false);
  });

  await step("a student, a family and a signed-out visitor do not read the directory", async () => {
    refused(await kid.try("GET", "/directory/students"), 403);
    refused(await kid.try("GET", `/directory/students/${ctx.a.id}`), 403);
    refused(await nobody.try("GET", "/directory/students"), 401);
    refused(await kid.try("GET", "/audit"), 403);
  });

  await step("export: every row the filter matches, in the list's order, and the export is written down with the filter and the count", async () => {
    const x = await audited(admin, "GET /directory/students/export", { action: "students.directory.exported", rows: 1 }, () => admin.get(`/directory/students/export?class=${L1},${L2}&q=${STEM}&sort=name`));
    assert.equal(x.count, 3); assert.equal(x.rows.length, 3);
    assert.equal(x.columns[2], "Name");
    assert.deepEqual(x.rows.map((r) => r[2]), [`${STEM}a Alpha`, `${STEM}b Beta`, `${STEM}c Gamma`]);
    const log = await admin.get("/audit?action=students.directory.exported&size=5");
    const mine = log.events[0];
    assert.equal(mine.detail.rows, 3); assert.ok(mine.detail.filter.includes(`class=${L1},${L2}`));
    assert.ok(!mine.detail.filter.includes("sort="), "the filter is what was asked for, not how it was ordered");
  });

  await step("a bulk house change: the students named, by id or by filter, each with an audit row of what it was", async () => {
    const r = await audited(admin, "POST /directory/students/bulk/house", { action: "students.record.changed" }, () => admin.post("/directory/students/bulk/house", { ids: [ctx.b.id, ctx.c.id], house: "Jal" }));
    assert.equal(r.changed, 2);
    assert.equal((await list(admin, "house=Jal&q=" + STEM)).total, 2);
    const viaFilter = await admin.post("/directory/students/bulk/house", { filter: `class=${L1}&q=${STEM}`, house: "Vayu" });
    assert.equal(viaFilter.changed, 2);
    assert.deepEqual(names(await list(admin, "house=Vayu&q=" + STEM + "&sort=name")), [`${STEM}a Alpha`, `${STEM}b Beta`]);
    const log = await admin.get(`/audit?record=${ctx.a.id}&action=students.record.changed&size=10`);
    const row = log.events.find((e) => e.field === "house" && e.after === "Vayu");
    assert.ok(row && row.before === "Agni", "it says what the house was: " + JSON.stringify(log.events.map((e) => [e.field, e.before, e.after])));
    refused(await admin.try("POST", "/directory/students/bulk/house", { ids: [] }), 400);
    refused(await admin.try("POST", "/directory/students/bulk/house", { house: "Jal" }), 400);
  });

  await step("a bulk house change is safe to send again: students who already have the house are neither written nor logged", async () => {
    const logged = async () => (await admin.get(`/audit?record=${ctx.a.id}&action=students.record.changed&size=100`)).total;
    const before = await logged();
    const again = await admin.post("/directory/students/bulk/house", { ids: [ctx.a.id, ctx.b.id], house: "Vayu" });     // both have Vayu from the step above
    assert.equal(again.changed, 0); assert.equal(again.matched, 2);
    assert.equal(await logged(), before, "nothing was written down for a change that did not happen");
    const some = await admin.post("/directory/students/bulk/house", { ids: [ctx.a.id, ctx.b.id, ctx.c.id], house: "Vayu" });  // Gamma is in Jal
    assert.equal(some.changed, 1); assert.equal(some.matched, 3);
    assert.equal(await logged(), before, "Alpha's log did not move either");
    const c = await admin.get(`/audit?record=${ctx.c.id}&action=students.record.changed&size=100`);
    assert.ok(c.events.some((e) => e.field === "house" && e.before === "Jal" && e.after === "Vayu"), "Gamma's change says what it was");
  });

  await step("editing a student through the existing save writes one audit row per field that changed, and none for what did not", async () => {
    const was = (await admin.get(`/audit?record=${ctx.b.id}&action=students.record.changed&size=100`)).total;
    await audited(admin, "PUT /students/:accountId/india", { action: "students.record.changed", record: ctx.b.id }, () => admin.put(`/students/${ctx.b.id}/india`, { category: "SC", bloodGroup: "O+", gender: "M" }));
    const log = await admin.get(`/audit?record=${ctx.b.id}&action=students.record.changed&size=100`);
    assert.equal(log.total, was + 2, "two fields changed (category, blood group); gender was saved as it was");
    const fresh = log.events.slice(0, 2);
    assert.deepEqual(fresh.map((e) => e.field).sort(), ["bloodGroup", "category"]);
    const cat = fresh.find((e) => e.field === "category");
    assert.equal(cat.after, "SC"); assert.equal(cat.before, null);
    assert.equal(fresh[0].request, fresh[1].request, "the fields of one save share a request");
    assert.ok(fresh[0].request);
  });

  await step("a phone number typed into a record is written to the log masked, not as typed", async () => {
    const other = "8" + rnd(9);
    await admin.put(`/students/${ctx.b.id}/india`, { fatherPhone: other });
    const log = await admin.get(`/audit?record=${ctx.b.id}&q=fatherPhone`);
    const e = log.events.find((x) => x.field === "fatherPhone");
    assert.ok(e && e.after === "••••" + other.slice(-4), JSON.stringify(e));
    assert.ok(!JSON.stringify(log).includes(other));
  });

  await step("a message to the families of a filter reaches the students and their guardians, and is written down", async () => {
    const r = await audited(admin, "POST /directory/students/bulk/message", { action: "communicate.message.sent", rows: 1 }, () => admin.post("/directory/students/bulk/message", { filter: `class=${L1}&q=${STEM}`, title: "Hello " + STEM, body: "A word to the family." }));
    assert.equal(r.students, 2); assert.ok(r.reached >= 2);
    const log = await admin.get("/audit?action=communicate.message.sent&size=3");
    assert.equal(log.events[0].detail.students, 2);
    refused(await admin.try("POST", "/directory/students/bulk/message", { ids: [ctx.a.id], title: "x" }), 400);
  });

  await step("add a student: an invited account, the student's row, found in the list, and written down; a taken email or a bad date is refused", async () => {
    const email = `new.${RUN}@s.test`;
    const made = await audited(admin, "POST /directory/students", { action: "students.record.created", rows: 1 }, () => admin.post("/directory/students", { name: `${STEM}n Newcomer`, email, classId: ctx.cls.id, dob: "14/03/2011", gender: "F", category: "General", admissionNo: ctx.adm + "-N", fatherName: "Naresh Newcomer", fatherPhone: "9" + rnd(9) }));
    assert.equal(made.student.name, `${STEM}n Newcomer`); assert.equal(made.student.dob, "2011-03-14"); assert.equal(made.student.classLabel, L1);
    const found = await list(admin, "q=" + STEM + "n");
    assert.equal(found.total, 1); assert.equal(found.rows[0].classLabel, L1);
    const log = await admin.get(`/audit?record=${made.student.id}&action=students.record.created`);
    assert.equal(log.total, 1);
    refused(await admin.try("POST", "/directory/students", { name: "Same Email", email }), 409);
    refused(await admin.try("POST", "/directory/students", { name: "Bad Date", email: `bd.${RUN}@s.test`, dob: "31/02/2011" }), 400);
    refused(await admin.try("POST", "/directory/students", { name: "Future", email: `fu.${RUN}@s.test`, dob: "2999-01-01" }), 400);
    refused(await admin.try("POST", "/directory/students", { name: "X", email: `x.${RUN}@s.test` }), 400);
    refused(await admin.try("POST", "/directory/students", { name: "No Such Class", email: `nc.${RUN}@s.test`, classId: "cls_nope" }), 400);
    refused(await teacher.try("POST", "/directory/students", { name: "Nope", email: `no.${RUN}@s.test` }), 403);
  });

  const accounts = async () => (await admin.get("/accounts")).accounts.length;

  await step("a number already taken is refused before anything is written, with the field named; the same email works once it is corrected", async () => {
    const apaar = rnd(12), pen = rnd(11), email = `clash.${RUN}@s.test`;
    await admin.put(`/students/${ctx.a.id}/india`, { apaar, pen });                // Alpha holds these
    await admin.put(`/students/${ctx.b.id}/india`, { rollNo: ROLL });              // Beta holds this roll in the section
    const before = await accounts();
    for (const [field, extra] of [["admissionNo", { admissionNo: ctx.adm + "-A" }], ["rollNo", { classId: ctx.cls.id, rollNo: ROLL }], ["apaar", { apaar }], ["pen", { pen }]]) {
      const r = await admin.try("POST", "/directory/students", { name: `${STEM}k Kept`, email, ...extra });
      refused(r, 409);
      assert.equal(r.body.error.field, field, "the refusal names " + field);
      assert.equal(await accounts(), before, "nothing was left behind after the " + field + " clash");
    }
    const ok = await admin.post("/directory/students", { name: `${STEM}k Kept`, email, admissionNo: ctx.adm + "-K", classId: ctx.cls.id, rollNo: ROLL + 1 });
    assert.equal(ok.student.admissionNo, ctx.adm + "-K");
    assert.equal(await accounts(), before + 1, "the corrected try made exactly one account");
  });

  await step("six offices add the same admission number at once: one student is made, five are refused, and no account is left half-made", async () => {
    const before = await accounts(), adm = ctx.adm + "-R";
    const tries = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => admin.try("POST", "/directory/students", { name: `${STEM}r${i} Racer`, email: `race${i}.${RUN}@s.test`, admissionNo: adm })));
    assert.equal(tries.filter((r) => r.status === 201).length, 1, JSON.stringify(tries.map((r) => r.status)));
    assert.equal(tries.filter((r) => r.status === 409).length, 5, JSON.stringify(tries.map((r) => r.status)));
    assert.equal(await accounts(), before + 1, "only the winner has an account");
    // every loser can try again at once with a number of their own: the email was not used up
    const lost = tries.map((r, i) => [r, i + 1]).filter(([r]) => r.status === 409).map(([, i]) => i);
    for (const i of lost) await admin.post("/directory/students", { name: `${STEM}r${i} Racer`, email: `race${i}.${RUN}@s.test`, admissionNo: `${adm}-${i}` });
    assert.equal(await accounts(), before + 6);
  });

  await step("the audit log pages, filters by day, and is for the principal and administrators only", async () => {
    const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);      // the school's day is India's
    const all = await admin.get("/audit?size=2");
    assert.equal(all.events.length, 2); assert.ok(all.total > 2);
    assert.ok(all.events[0].at >= all.events[1].at, "newest first");
    const day = await admin.get(`/audit?from=${today}&to=${today}`);
    assert.ok(day.total >= 1);
    assert.equal((await admin.get("/audit?from=2000-01-01&to=2000-01-02")).total, 0);
    refused(await admin.try("GET", "/audit?from=yesterday"), 400);
    refused(await teacher.try("GET", "/audit"), 403);
  });

  console.log(`\n${steps()} steps passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exit(1);
}
