// A section, made and changed, as the people who keep the school's classes: the list says whether the person may
// write; a new section and every change to one is written down with what it was; saving the same twice writes nothing;
// and a teacher, who may not read the classes, is refused.
// Local only; needs an existing school administrator.
//   API=http://localhost:8817/api/v1 CRED=/path/credentials.json node scripts/prove-classes.mjs
import { cred, RUN, PW, person, step, steps, refused, assert } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher");
const ctx = {};
const GRADE = "XI", SECTION = RUN.slice(-2).toUpperCase().replace(/[^A-Z]/g, "Z").padEnd(2, "Q");
const log = async (id) => (await admin.get(`/audit?record=${id}&size=100`)).events;

try {
  await step("people: a teacher, who can be a class teacher but may not read the classes", async () => {
    await admin.login(cred().email, cred().password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    ctx.t = (await admin.post("/accounts", { email: `ct.${RUN}@s.test`, name: `Cora ${RUN}teacher`, password: PW, role: "teacher", orgId: ctx.org })).account;
    ctx.t2 = (await admin.post("/accounts", { email: `ct2.${RUN}@s.test`, name: `Dev ${RUN}teacher`, password: PW, role: "teacher", orgId: ctx.org })).account;
    await teacher.login(ctx.t.email, PW);
    refused(await teacher.try("GET", "/india/classes"), 403);
  });

  await step("the list says the administrator may write", async () => {
    const r = await admin.get("/india/classes");
    assert.equal(r.can.write, true);
    assert.ok(Array.isArray(r.classes) && r.year);
  });

  await step("a new section is made, and written down with who made it and which section", async () => {
    const r = await admin.put("/india/classes", { grade: GRADE, section: SECTION, programme: "CBSE", room: "R-" + SECTION, capacity: 40, classTeacherId: ctx.t.id });
    ctx.cls = r.class;
    assert.equal(ctx.cls.label, `${GRADE}-${SECTION}`); assert.equal(ctx.cls.classTeacher.id, ctx.t.id);
    const events = await log(ctx.cls.id);
    assert.equal(events.length, 1);
    assert.equal(events[0].action, "students.class.created"); assert.equal(events[0].verb, "created");
    assert.equal(events[0].record.label, ctx.cls.label); assert.equal(events[0].record.kind, "class");
    assert.equal(events[0].actor.id, (await admin.get("/me")).account.id);
  });

  await step("changing a section writes one row for each field that differs, the teacher by name, and the rows of one change share a request", async () => {
    await admin.put("/india/classes", { grade: GRADE, section: SECTION, room: "R-NEW", capacity: 36, classTeacherId: ctx.t2.id });
    const events = (await log(ctx.cls.id)).filter((e) => e.action === "students.class.changed");
    assert.deepEqual(events.map((e) => e.field).sort(), ["capacity", "classTeacher", "room"]);
    const by = Object.fromEntries(events.map((e) => [e.field, e]));
    assert.deepEqual([by.room.before, by.room.after], ["R-" + SECTION, "R-NEW"]);
    assert.deepEqual([by.capacity.before, by.capacity.after], ["40", "36"]);
    assert.deepEqual([by.classTeacher.before, by.classTeacher.after], [ctx.t.name, ctx.t2.name], "people by name, not by id");
    assert.ok(events.every((e) => e.request && e.request === events[0].request));
    assert.equal(events.find((e) => e.field === "programme"), undefined, "a field that did not change is not written");
  });

  await step("saving the same thing again writes nothing, and the section is what was asked for", async () => {
    const before = (await log(ctx.cls.id)).length;
    const r = await admin.put("/india/classes", { grade: GRADE, section: SECTION, room: "R-NEW", capacity: 36, classTeacherId: ctx.t2.id });
    assert.equal((await log(ctx.cls.id)).length, before);
    assert.equal(r.class.room, "R-NEW"); assert.equal(r.class.capacity, 36); assert.equal(r.class.programme, "CBSE", "what was left out stayed");
  });

  await step("the section is in the list for the year, a bad value is refused, and a teacher cannot write", async () => {
    const list = (await admin.get("/india/classes")).classes;
    assert.ok(list.some((c) => c.id === ctx.cls.id && c.room === "R-NEW"));
    refused(await admin.try("PUT", "/india/classes", { grade: GRADE, section: SECTION, capacity: 9999 }), 400);
    refused(await admin.try("PUT", "/india/classes", { grade: GRADE, section: SECTION, classTeacherId: "acc_nobody" }), 400);
    refused(await teacher.try("PUT", "/india/classes", { grade: GRADE, section: SECTION, room: "X" }), 403);
  });

  console.log(`\n${steps()} steps passed`);
} catch (e) {
  console.log("\nstopped: " + (e && e.message));
  process.exit(1);
}
