// The school's families as the people who use them: a guardian added to several students at once, their account
// made invited (no password) or an existing one linked as it is; the list searched and filtered with the number and
// the email masked; the students nobody is linked to; a number shown only when asked, and written down; a class
// teacher seeing the families of their own section and nobody else's; and the refusals.
// Local only; needs an existing school administrator.
//   API=http://localhost:8817/api/v1 CRED=/path/credentials.json node scripts/prove-guardians.mjs
import { cred, RUN, PW, person, step, steps, refused, assert } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), kid = person("student"), nobody = person("nobody");
const ctx = {};
const STEM = "Gq" + RUN.slice(-5);
const rnd = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");
const PHONE = "9" + rnd(9);
const [S1, S2] = ["W", "X", "Y", "Z"].sort(() => Math.random() - 0.5);
const list = (who, q) => who.get("/directory/guardians?" + (q || ""));
const accounts = async () => (await admin.get("/accounts")).accounts.length;

try {
  await step("people: a class teacher of a new section with two students in it, one student elsewhere, and one nobody is linked to", async () => {
    await admin.login(cred().email, cred().password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    ctx.teacher = (await admin.post("/accounts", { email: `gt.${RUN}@s.test`, name: `Gita ${STEM}teacher`, password: PW, role: "teacher", orgId: ctx.org })).account;
    await teacher.login(ctx.teacher.email, PW);
    ctx.cls = (await admin.put("/india/classes", { grade: "XII", section: S1, programme: "ISC", capacity: 30, classTeacherId: ctx.teacher.id })).class;
    ctx.other = (await admin.put("/india/classes", { grade: "XII", section: S2, programme: "ISC", capacity: 30 })).class;
    const mk = async (tag, cls) => (await admin.post("/directory/students", { name: `${STEM}${tag} Child`, email: `${tag}.${RUN}@s.test`, classId: cls.id })).student;
    ctx.a = await mk("a", ctx.cls); ctx.b = await mk("b", ctx.cls); ctx.c = await mk("c", ctx.other); ctx.d = await mk("d", ctx.other);
    ctx.kid = (await admin.post("/accounts", { email: `gk.${RUN}@s.test`, name: `${STEM}k Kid`, password: PW, role: "student", orgId: ctx.org })).account;
    await kid.login(ctx.kid.email, PW);
  });

  await step("students nobody is linked to are a view of their own, searchable", async () => {
    const r = await list(admin, `view=no-guardian&q=${STEM}&sort=name`);
    assert.equal(r.view, "no-guardian"); assert.equal(r.total, 4);
    assert.deepEqual(r.rows.map((x) => x.name), [`${STEM}a Child`, `${STEM}b Child`, `${STEM}c Child`, `${STEM}d Child`]);
    assert.ok(r.kpis.withoutGuardian >= 4);
    assert.equal((await list(admin, `view=no-guardian&q=${STEM}&class=XII-${S1}`)).total, 2, "by class");
  });

  await step("a guardian is added to two students at once: an invited account, a link to each, the mobile kept, and each link written down", async () => {
    const before = await accounts();
    ctx.email = `parent.${RUN}@s.test`;
    const r = await admin.post("/directory/guardians", { studentIds: [ctx.a.id, ctx.b.id], name: `${STEM} Parent`, email: ctx.email, relation: "parent", label: "Father", cellPhone: PHONE });
    ctx.g = r.guardian;
    assert.equal(r.created, true); assert.equal(ctx.g.studentCount, 2); assert.equal(ctx.g.app, "invited"); assert.deepEqual(ctx.g.relations, ["Father"]);
    assert.equal(ctx.g.hasPhone, true); assert.match(ctx.g.phone, /^•+\d{4}$/); assert.ok(!JSON.stringify(r).includes(PHONE), "the number is not in the answer");
    assert.ok(!JSON.stringify(r).includes(ctx.email), "nor the email");
    assert.equal(await accounts(), before + 1, "one account");
    const forA = (await admin.get(`/audit?record=${ctx.a.id}&action=students.guardian.linked`)).events[0];
    assert.equal(forA.field, "guardian"); assert.equal(forA.after, `${STEM} Parent (Father)`);
    assert.equal((await admin.get(`/audit?record=${ctx.g.id}&action=students.guardian.created`)).total, 1);
    assert.equal((await list(admin, `view=no-guardian&q=${STEM}`)).total, 2, "a and b are no longer alone");
  });

  await step("an email that already holds an account is linked as it is: no second account, one more student", async () => {
    const before = await accounts();
    const r = await admin.post("/directory/guardians", { studentIds: [ctx.c.id], email: ctx.email, relation: "parent", label: "Father" });
    assert.equal(r.created, false); assert.equal(r.guardian.id, ctx.g.id); assert.equal(r.guardian.studentCount, 3);
    assert.equal(await accounts(), before, "no second account");
    assert.equal((await list(admin, `q=${STEM}`)).total, 1, "still one guardian");
  });

  await step("the list: found by the guardian's name, a child's name and the end of the number; the number and the email are masked", async () => {
    const byName = await list(admin, `q=${encodeURIComponent(STEM + " Parent")}`);
    assert.equal(byName.total, 1);
    const row = byName.rows[0];
    assert.equal(row.studentCount, 3); assert.deepEqual(row.students.map((s) => s.name).sort(), [`${STEM}a Child`, `${STEM}b Child`, `${STEM}c Child`]);
    assert.match(row.email, /^p•••@s\.test$/); assert.match(row.phone, /^•+\d{4}$/);
    assert.ok(!JSON.stringify(byName).includes(PHONE) && !JSON.stringify(byName).includes(ctx.email), "the page carries neither");
    assert.equal((await list(admin, `q=${STEM}b`)).total, 1, "by a child");
    assert.equal((await list(admin, "q=" + PHONE.slice(-4))).rows.some((x) => x.id === ctx.g.id), true, "by the end of the number");
    assert.equal((await list(admin, `q=${STEM}&app=active`)).total, 0, "nobody here has signed in");
    const inv = await list(admin, `q=${STEM}&app=invited`);
    assert.equal(inv.total, 1); assert.equal(inv.counts.invited, 1); assert.equal(inv.counts.active, 0);
    assert.equal((await list(admin, `q=${STEM}&relation=Mother`)).total, 0);
    assert.equal((await list(admin, `q=${STEM}&relation=Father&class=XII-${S2}`)).total, 1, "by the class of a child");
    assert.ok(row.kpis === undefined && byName.kpis.guardians >= 1);
  });

  await step("the quick look: the children they are linked to, and the number hidden until asked for; asking is written down with who asked", async () => {
    const r = await admin.get(`/directory/guardians/${ctx.g.id}`);
    assert.equal(r.guardian.students.length, 3); assert.equal(r.can.write, true);
    assert.equal(r.guardian.phones[0].which, "cell"); assert.match(r.guardian.phones[0].phone, /^•+\d{4}$/);
    assert.ok(!JSON.stringify(r).includes(PHONE));
    const shown = await admin.post(`/directory/guardians/${ctx.g.id}/phone`, { which: "cell" });
    assert.ok(String(shown.phone).replace(/\D/g, "").endsWith(PHONE.slice(-10)));
    const log = await admin.get(`/audit?record=${ctx.g.id}&action=students.guardian.phone_revealed`);
    assert.equal(log.total, 1); assert.equal(log.events[0].verb, "revealed"); assert.equal(log.events[0].actor.id, (await admin.get("/me")).account.id);
    assert.ok(!JSON.stringify(log).includes(PHONE), "the log does not hold the number");
    refused(await admin.try("POST", `/directory/guardians/${ctx.g.id}/phone`, { which: "alt" }), 404);
    refused(await admin.try("POST", `/directory/guardians/${ctx.g.id}/phone`, { which: "home" }), 400);
    refused(await admin.try("GET", "/directory/guardians/acc_nobody"), 404);
  });

  await step("a class teacher sees the families of their own section's children, and only those children", async () => {
    const t = await list(teacher, `q=${STEM}`);
    assert.equal(t.total, 1);
    assert.deepEqual(t.rows[0].students.map((s) => s.name).sort(), [`${STEM}a Child`, `${STEM}b Child`], "Child c sits in another section and is not shown");
    assert.equal(t.rows[0].studentCount, 2); assert.equal(t.can.write, false);
    assert.equal((await list(teacher, `view=no-guardian&q=${STEM}`)).total, 0, "d is in the other section");
    const lonely = await admin.post("/directory/guardians", { studentIds: [ctx.d.id], name: `${STEM} Other`, email: `other.${RUN}@s.test`, relation: "guardian" });
    refused(await teacher.try("GET", `/directory/guardians/${lonely.guardian.id}`), 404);
    assert.equal((await list(teacher, `q=${STEM}%20Other`)).total, 0, "a family of the other section is not in their list");
    await teacher.post(`/directory/guardians/${ctx.g.id}/phone`, { which: "cell" });
    refused(await teacher.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], name: "X Y", email: `t.${RUN}@s.test` }), 403);
  });

  await step("a student and a signed-out visitor do not read the families; a mistake is refused, not half done", async () => {
    refused(await kid.try("GET", "/directory/guardians"), 403);
    refused(await nobody.try("GET", "/directory/guardians"), 401);
    const before = await accounts();
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [], name: "No One", email: `n.${RUN}@s.test` }), 400);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], name: "Bad Mail", email: "not-an-email" }), 400);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: ["acc_nobody"], name: "No Child", email: `nc.${RUN}@s.test` }), 404);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], name: "X", email: `x.${RUN}@s.test` }), 400);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], name: "Fine Name", email: `f.${RUN}@s.test`, relation: "cousin" }), 400);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], name: "Fine Name", email: `f.${RUN}@s.test`, cellPhone: "12345" }), 400);
    refused(await admin.try("POST", "/directory/guardians", { studentIds: [ctx.a.id], email: ctx.a.email }), 400);
    assert.equal(await accounts(), before, "no refusal left an account behind");
  });

  console.log(`\n${steps()} steps passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exit(1);
}
