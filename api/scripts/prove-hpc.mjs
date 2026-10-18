// Competencies and the Holistic Progress Card over HTTP: the school's skills, ratings by the class teacher and
// subject teachers, how many are at grade level in each skill, what is carried to next year's teacher, and a
// card that takes the teacher's, the child's, a classmate's and a parent's words.
//   API=http://127.0.0.1:8791/api/v1 ORIGIN=http://127.0.0.1:8130 CRED=/path/credentials.json node scripts/prove-hpc.mjs
import { person, step, steps, assert, refused, cred, RUN, PW } from "./lib-prove.mjs";

const admin = person("admin"), ct = person("class teacher"), st = person("subject teacher"), outsider = person("outsider"), parent = person("parent"), other = person("another parent"), kid = person("child");
const X = {};
const SEC = RUN.slice(-2).toUpperCase() + "H";
const NAME = (s) => `${s} ${RUN}`;

try {
  await step("a section of four, its class teacher, a subject teacher with a paper in it, an outsider, and two families", async () => {
    await admin.login(cred().email, cred().password);
    X.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, tag) => (await admin.post("/accounts", { email: `${tag}.hp${RUN}@s.test`, name, password: PW, role, orgId: X.org })).account;
    X.ct = await mk("Class Tchr", "teacher", "ct"); X.st = await mk("Subject Tchr", "teacher", "st"); X.out = await mk("Outside Tchr", "teacher", "out");
    X.par = await mk("Parent One", "guardian", "p1"); X.par2 = await mk("Parent Two", "guardian", "p2");
    X.kids = []; for (const n of ["Hari", "Ishita Roy", "Jaspreet", "Kiran Dev"]) X.kids.push(await mk(n, "student", n.split(" ")[0].toLowerCase()));
    for (const [p, a] of [[ct, X.ct], [st, X.st], [outsider, X.out], [parent, X.par], [other, X.par2], [kid, X.kids[0]]]) await p.login(a.email, PW);
    await admin.post(`/students/${X.kids[0].id}/guardians`, { guardianId: X.par.id, relationship: "parent" });
    X.cls = (await admin.put("/india/classes", { grade: "VII", section: SEC, classTeacherId: X.ct.id })).class;
    await admin.post(`/india/classes/${X.cls.id}/students`, { studentIds: X.kids.map((k) => k.id) });
    await admin.post(`/india/classes/${X.cls.id}/rolls`, { order: "name" });
    const sc = (await admin.post("/grading/scales", { template: "percent", name: NAME("Percent") })).scale;
    const ex = (await admin.post("/exams", { name: NAME("Term 1"), kind: "term", scaleId: sc.id })).exam;
    await admin.post(`/exams/${ex.id}/papers`, { classId: X.cls.id, papers: [{ subject: "Maths", teacherId: X.st.id }] });
  });

  await step("the school writes its own competencies; staff read them, a teacher does not add them, one for another stage stays out of this section", async () => {
    const r = await admin.post("/competencies", { competencies: [
      { subject: NAME("Maths"), name: "Adds and subtracts fractions", stage: "middle", code: "M-6.2" }, { subject: NAME("Maths"), name: "Reads a bar graph", stage: "middle" },
      { subject: NAME("Language"), name: "Writes a paragraph with a clear point", stage: "middle" }, { subject: NAME("Language"), name: "Reads aloud with expression" },
      { subject: NAME("Foundation"), name: "Counts to 20", stage: "foundational" }] });
    assert.ok(r.competencies.length >= 5);
    refused(await ct.try("POST", "/competencies", { competencies: [{ subject: "Maths", name: "x" }] }), 403);
    refused(await admin.try("POST", "/competencies", { competencies: [{ subject: "Maths", name: "x", stage: "kindergarten" }] }), 400);
    const l = await ct.get("/competencies");
    assert.deepEqual(l.levels.map((x) => x.name), ["Beginning", "Developing", "Proficient", "Advanced"]); assert.equal(l.atLevel, 3);
    X.c = Object.fromEntries(l.competencies.filter((c) => c.subject.endsWith(RUN)).map((c) => [c.name, c]));
    assert.equal((await admin.post("/competencies", { competencies: [{ subject: NAME("Maths"), name: "Reads a bar graph", stage: "middle", code: "M-7.1" }] })).competencies.filter((c) => c.name === "Reads a bar graph" && c.subject.endsWith(RUN)).length, 1, "the same skill is updated, not repeated");
    const grid = await ct.get(`/competency/class?classId=${X.cls.id}&term=1`);
    assert.equal(grid.class.stage, "middle");
    assert.equal(grid.competencies.some((c) => c.name === "Counts to 20"), false, "a foundational skill is not asked of Class VII");
    assert.equal(grid.competencies.some((c) => c.name === "Reads aloud with expression"), true, "a skill for any stage is");
  });

  const put = (who, body, q = "") => who.try("PUT", `/competency/levels${q}`, { classId: X.cls.id, term: "1", ...body });
  await step("the class teacher and the section's subject teacher rate children; an outsider and a mistake are refused", async () => {
    const f = X.c["Adds and subtracts fractions"], g = X.c["Reads a bar graph"], w = X.c["Writes a paragraph with a clear point"];
    const kids = X.kids;
    assert.equal((await put(ct, { levels: [
      { accountId: kids[0].id, competencyId: f.id, level: 3 }, { accountId: kids[1].id, competencyId: f.id, level: 4 }, { accountId: kids[2].id, competencyId: f.id, level: 2 }, { accountId: kids[3].id, competencyId: f.id, level: 3 },
      { accountId: kids[0].id, competencyId: w.id, level: 2 }, { accountId: kids[1].id, competencyId: w.id, level: 3 }] })).status, 200);
    assert.equal((await put(st, { levels: [{ accountId: kids[0].id, competencyId: g.id, level: 1 }, { accountId: kids[1].id, competencyId: g.id, level: 3 }] })).status, 200, "a subject teacher of the section may rate");
    refused(await put(outsider, { levels: [{ accountId: kids[0].id, competencyId: f.id, level: 4 }] }), 403);
    refused(await put(ct, { levels: [{ accountId: kids[0].id, competencyId: f.id, level: 5 }] }), 400);
    refused(await put(ct, { levels: [{ accountId: "acc_nobody", competencyId: f.id, level: 3 }] }), 400);
    refused(await put(ct, { levels: [{ accountId: kids[0].id, competencyId: "comp_other", level: 3 }] }), 400);
    refused(await parent.try("PUT", "/competency/levels", { classId: X.cls.id, term: "1", levels: [{ accountId: kids[0].id, competencyId: f.id, level: 4 }] }), 403);
  });

  await step("the grid shows each child's level, and how many of the section are at grade level in each skill", async () => {
    const grid = await st.get(`/competency/class?classId=${X.cls.id}&term=1`);
    const f = X.c["Adds and subtracts fractions"], sumOf = (c) => grid.summary.find((s) => s.id === c.id);
    assert.deepEqual([sumOf(f).rated, sumOf(f).atLevel, sumOf(f).percent], [4, 3, 75]);
    assert.deepEqual([sumOf(X.c["Reads a bar graph"]).rated, sumOf(X.c["Reads a bar graph"]).percent], [2, 50]);
    assert.equal(sumOf(X.c["Reads aloud with expression"]).percent, null, "nothing rated is nothing said");
    assert.equal(grid.students.find((s) => s.name === "Ishita Roy").levels[f.id], 4);
    // a rating can be taken back
    await put(ct, { levels: [{ accountId: X.kids[3].id, competencyId: f.id, level: null }] });
    assert.equal((await ct.get(`/competency/class?classId=${X.cls.id}&term=1`)).summary.find((s) => s.id === f.id).rated, 3);
    await put(ct, { levels: [{ accountId: X.kids[3].id, competencyId: f.id, level: 3 }] });
    refused(await outsider.try("GET", `/competency/class?classId=${X.cls.id}`), 403);
  });

  await step("the school sees the share at grade level per skill, lowest first, by section; a class teacher cannot read the whole school", async () => {
    const a = await admin.get("/competency/analytics?term=1");
    const mine = a.skills.filter((s) => s.subject.endsWith(RUN));
    assert.deepEqual(mine.map((s) => s.name), ["Reads a bar graph", "Writes a paragraph with a clear point", "Adds and subtracts fractions"], "least secure first");
    const frac = mine.find((s) => s.name === "Adds and subtracts fractions");
    assert.deepEqual(frac.sections.find((x) => x.label === `VII-${SEC}`).percent, 75);
    assert.equal((await admin.get(`/competency/analytics?term=1&subject=${encodeURIComponent(NAME("Maths"))}`)).skills.every((s) => s.subject === NAME("Maths")), true);
    refused(await ct.try("GET", "/competency/analytics"), 403);
  });

  await step("what is still below grade level at the latest term is what the next teacher is handed", async () => {
    const f = X.c["Adds and subtracts fractions"], w = X.c["Writes a paragraph with a clear point"];
    await put(ct, { term: "2", levels: [{ accountId: X.kids[0].id, competencyId: w.id, level: 3 }, { accountId: X.kids[2].id, competencyId: f.id, level: 2 }] });
    const c = await ct.get(`/competency/carry?classId=${X.cls.id}`);
    const by = Object.fromEntries(c.children.map((k) => [k.name, k.behind.map((b) => b.name).sort()]));
    assert.deepEqual(by.Hari, ["Reads a bar graph"], "Hari caught up on writing in term 2 but not on graphs");
    assert.deepEqual(by.Jaspreet, ["Adds and subtracts fractions"]); assert.equal(by["Ishita Roy"], undefined);
  });

  await step("the card: a family and the child read their own, with the levels by subject and term; another family cannot", async () => {
    const card = await parent.get(`/students/${X.kids[0].id}/hpc`);
    assert.equal(card.child.stage, "middle"); assert.equal(card.child.class, `VII-${SEC}`);
    const maths = card.competencies[NAME("Maths")], lang = card.competencies[NAME("Language")];
    assert.deepEqual(maths.find((c) => c.name === "Adds and subtracts fractions").terms, { 1: { level: 3, name: "Proficient" } });
    assert.deepEqual(lang.find((c) => c.name.startsWith("Writes")).terms, { 1: { level: 2, name: "Developing" }, 2: { level: 3, name: "Proficient" } });
    assert.ok(card.attendance && "percent" in card.attendance); assert.ok(Array.isArray(card.exams));
    assert.equal((await kid.get(`/students/${X.kids[0].id}/hpc?term=1`)).competencies[NAME("Language")][0].terms[2], undefined, "a term asked for is the term shown");
    refused(await other.try("GET", `/students/${X.kids[0].id}/hpc`), 403);
    refused(await parent.try("GET", `/students/${X.kids[1].id}/hpc`), 403);
    assert.equal((await ct.try("GET", `/students/${X.kids[0].id}/hpc`)).status, 200);
  });

  await step("the card takes the teacher's, the child's, a classmate's and a parent's words, each only from the right person", async () => {
    const note = (who, id, body) => who.try("POST", `/students/${id}/hpc/notes`, { term: "1", ...body });
    const k0 = X.kids[0].id;
    assert.equal((await note(ct, k0, { source: "teacher", area: "Strengths", body: "Explains a method clearly to others." })).status, 201);
    assert.equal((await note(ct, k0, { source: "peer", area: "Working together", body: "Shares his pencils and listens." })).status, 201);
    assert.equal((await note(kid, k0, { source: "self", area: "Things I enjoy", body: "Maths puzzles and cricket." })).status, 201);
    const mine = await note(parent, k0, { source: "parent", area: "At home", body: "Reads to his little sister every night." });
    assert.equal(mine.status, 201);
    refused(await note(kid, k0, { source: "teacher", body: "I am the best" }), 403);
    refused(await note(parent, k0, { source: "self", body: "x" }), 403);
    refused(await note(other, k0, { source: "parent", body: "x" }), 403);
    refused(await note(outsider, k0, { source: "teacher", body: "x" }), 403);
    refused(await note(parent, X.kids[1].id, { source: "parent", body: "x" }), 403);
    refused(await note(ct, k0, { source: "gossip", body: "x" }), 400);
    refused(await note(ct, k0, { source: "teacher", body: "" }), 400);
    const card = await kid.get(`/students/${k0}/hpc?term=1`);
    assert.deepEqual(card.notes.map((n) => n.source).sort(), ["parent", "peer", "self", "teacher"]);
    assert.equal(card.notes.find((n) => n.source === "parent").by, "Parent One");
    refused(await other.try("DELETE", `/hpc/notes/${mine.body.id}`), 403);
    assert.equal((await parent.del(`/hpc/notes/${mine.body.id}`)).removed, true);
    assert.equal((await kid.get(`/students/${k0}/hpc?term=1`)).notes.some((n) => n.source === "parent"), false);
  });

  await step("a competency that children have been rated on stays; one nobody used can go", async () => {
    refused(await admin.try("DELETE", `/competencies/${X.c["Adds and subtracts fractions"].id}`), 409);
    refused(await ct.try("DELETE", `/competencies/${X.c["Reads aloud with expression"].id}`), 403);
    assert.equal((await admin.del(`/competencies/${X.c["Reads aloud with expression"].id}`)).deleted, true);
  });
} catch { process.exitCode = 1; }
console.log(`\n${steps()} steps passed.`);
