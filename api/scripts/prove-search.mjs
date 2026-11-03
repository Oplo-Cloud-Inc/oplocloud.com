// The top bar's search over HTTP, as the people who use it, ending with the refusals:
// students found by name, admission number, the end of an APAAR or a phone; a class code
// opening the class; the index following a rename without anyone re-indexing; a teacher
// finding only the children of their own section; a student and a signed-out visitor refused;
// and input that tries to be a query operator treated as plain words.
// Local only; needs an existing school administrator.
//   API=http://localhost:8817/api/v1 CRED=/path/credentials.json node scripts/prove-search.mjs
import { API, cred, RUN, PW, person, step, steps, refused, assert } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), kid = person("student"), nobody = person("nobody");
const ctx = {};
const STEM = "Qz" + RUN.slice(-5);          // a first-name stem no one else has, so a re-run finds only its own people
const rnd = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");
const TAIL = rnd(4), APAAR = rnd(8) + TAIL;               // an APAAR is 12 digits; the school keeps them unique
const PHONE = "+91 9" + rnd(4) + " " + rnd(5);          // spaced the way people write one
const STEMC = "Rho" + STEM, ZENO = "Zeno" + STEM;
const find = async (who, q, kinds) => (await who.get("/search?q=" + encodeURIComponent(q) + (kinds ? "&kinds=" + kinds : "")));
const items = (r, kind) => ((r.groups.find((g) => g.kind === kind) || {}).items) || [];

try {
  await step("people: a teacher who is class teacher of a new section, two children in it, one child elsewhere", async () => {
    await admin.login(cred().email, cred().password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk(`Zubin ${STEM}teacher`, "teacher", `zubin.${RUN}@s.test`);
    ctx.a = await mk(`${STEM}on Findable`, "student", `quillon.${RUN}@s.test`);
    ctx.b = await mk(`${STEM}ona Findable`, "student", `quillona.${RUN}@s.test`);
    ctx.c = await mk(`${STEMC} Elsewhere`, "student", `quincy.${RUN}@s.test`);
    await teacher.login(ctx.teacher.email, PW);
    await kid.login(ctx.a.email, PW);
    // a section no demo school has: grade "XI", section "Q"
    ctx.cls = (await admin.put("/india/classes", { grade: "XI", section: "Q", programme: "ISC", room: "Q-1", capacity: 30, classTeacherId: ctx.teacher.id })).class;
    ctx.other = (await admin.put("/india/classes", { grade: "XI", section: "R", programme: "ISC", room: "R-1", capacity: 30 })).class;
    const adm = "ZZ-" + RUN.toUpperCase();
    await admin.put(`/students/${ctx.a.id}/india`, { classId: ctx.cls.id, gender: "M", category: "General", admissionNo: adm + "-A", apaar: APAAR, fatherPhone: PHONE, fatherName: ZENO + " Findable" });
    await admin.put(`/students/${ctx.b.id}/india`, { classId: ctx.cls.id, gender: "F", category: "General", admissionNo: adm + "-B" });
    await admin.put(`/students/${ctx.c.id}/india`, { classId: ctx.other.id, gender: "M", category: "General", admissionNo: adm + "-C" });
    ctx.adm = adm;
  });

  await step("a name is found by its first letters, best match first, with the class on the row", async () => {
    const r = await find(admin, STEM);
    const s = items(r, "student");
    assert.deepEqual(s.map((x) => x.title).sort(), [`${STEM}on Findable`, `${STEM}ona Findable`]);
    assert.equal(s[0].meta.class, "XI-Q");
    assert.equal(r.groups[0].kind, "student", "students come first");
    assert.ok(s.every((x) => x.kind === "student" && x.id));
  });

  await step("an admission number, the end of an APAAR, the end of a phone, a parent's name find the child", async () => {
    assert.equal(items(await find(admin, ctx.adm + "-A"), "student")[0].title, `${STEM}on Findable`);
    assert.equal(items(await find(admin, TAIL), "student")[0].title, `${STEM}on Findable`);
    assert.equal(items(await find(admin, PHONE.replace(/\D/g, "").slice(-4)), "student")[0].title, `${STEM}on Findable`);
    assert.equal(items(await find(admin, PHONE), "student")[0].title, `${STEM}on Findable`);
    assert.equal(items(await find(admin, ZENO), "student")[0].title, `${STEM}on Findable`);
    const row = items(await find(admin, TAIL), "student")[0];
    assert.equal(row.meta.apaar4, TAIL);
    assert.ok(!JSON.stringify(row).includes(APAAR), "only the last four of an APAAR are ever returned");
  });

  await step("staff, subjects and circulars are found too, and a result is capped at five a kind", async () => {
    assert.equal(items(await find(admin, STEM + "teacher"), "staff")[0].title, `Zubin ${STEM}teacher`);
    assert.equal(items(await find(admin, STEM + "teacher"), "staff")[0].meta.roles, "teacher");
    const everyone = await find(admin, "a");
    assert.ok(everyone.groups.every((g) => g.items.length <= 5));
    const only = await find(admin, STEM, "student");
    assert.deepEqual(only.groups.map((g) => g.kind), ["student"]);
  });

  await step("a class code opens the class: the class first, with its size, then the children seated in it", async () => {
    for (const q of ["XI-Q", "xi q", "XIQ"]) {
      const r = await find(admin, q);
      assert.equal(r.class && r.class.title, "XI-Q", q);
      const c = items(r, "class")[0];
      assert.equal(c.title, "XI-Q");
      assert.equal(c.meta.students, 2);
      assert.equal(c.meta.teacher, `Zubin ${STEM}teacher`);
      assert.deepEqual(items(r, "student").map((x) => x.title).sort(), [`${STEM}on Findable`, `${STEM}ona Findable`]);
    }
    assert.equal((await find(admin, "ZZ")).class, null);
  });

  await step("the index follows a rename and a move without anyone re-indexing it", async () => {
    await admin.patch(`/accounts/${ctx.c.id}`, { name: `${STEMC} Renamed` });
    assert.equal(items(await find(admin, STEMC + " renamed"), "student")[0].title, `${STEMC} Renamed`);
    assert.equal(items(await find(admin, STEMC + " elsewhere"), "student").length, 0, "the old name is gone");
    await admin.put(`/students/${ctx.c.id}/india`, { classId: ctx.cls.id });
    assert.equal(items(await find(admin, STEMC + " renamed"), "student")[0].meta.class, "XI-Q");
    assert.equal((await find(admin, "XI-Q")).groups.find((g) => g.kind === "class").items[0].meta.students, 3);
  });

  await step("a teacher finds the children of their own section, classes and subjects, and no other child", async () => {
    const mine = await find(teacher, STEM);
    assert.equal(items(mine, "student").length, 2, "both children of the teacher's own section");
    assert.ok(items(await find(admin, "riya"), "student").length > 0, "the demo school has a Riya");
    assert.equal(items(await find(teacher, "riya"), "student").length, 0, "a child in someone else's section is not theirs to find");
    assert.ok(items(await find(teacher, "XI-Q"), "class").length === 1);
  });

  await step("a student and a signed-out visitor are refused; so are an over-long query and a made-up kind", async () => {
    refused(await kid.try("GET", `/search?q=${STEM}`), 403);
    refused(await nobody.try("GET", `/search?q=${STEM}`), 401);
    refused(await admin.try("GET", "/search?q=" + "x".repeat(81)), 400);
    refused(await admin.try("GET", `/search?q=${STEM}&kinds=passwords`), 400);
  });

  await step("an empty query answers with nothing, and query operators typed into the field are plain words", async () => {
    assert.deepEqual((await find(admin, "")).groups, []);
    assert.deepEqual((await find(admin, "   ")).groups, []);
    for (const q of ['"', '* OR title:*', 'NEAR(a b)', 'a" OR "b', "'; DROP TABLE learn_search_docs; --", "-" + STEM, STEM + "*", "(" + STEM]) {
      const r = await admin.try("GET", "/search?q=" + encodeURIComponent(q));
      assert.equal(r.status, 200, q + " -> " + r.status);
    }
    assert.equal(items(await find(admin, "-" + STEM), "student").length, 2);
  });

  await step("what the search is built on is the school's own: another school's children are never in a result", async () => {
    const r = await find(admin, "a");
    const mine = new Set((await admin.get("/india/students")).students.map((s) => s.accountId || s.id));
    items(r, "student").forEach((x) => assert.ok(mine.has(x.id), x.title + " is not in this school"));
  });
} catch { /* the failing step has already said so */ }
finally {
  // tidy: leave the demo school as it was found
  if (ctx.cls) {
    for (const a of [ctx.a, ctx.b, ctx.c]) if (a) await admin.try("POST", `/students/${a.id}/leave`, { reason: "test" });
  }
  console.log(`\n${steps()} steps passed${process.exitCode ? ", with failures" : ""}`);
}
