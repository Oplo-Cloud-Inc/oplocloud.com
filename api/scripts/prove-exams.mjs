// The exam cycle over HTTP, as the people who run it: a scale, an exam, papers, marks entered by the
// subject teacher, checked by a dean, approved by the principal, published; the report card a family reads;
// the changes after approval; and the parent meeting. Local only; needs the demo school's administrator.
//   API=http://127.0.0.1:8791/api/v1 ORIGIN=http://127.0.0.1:8130 CRED=/path/credentials.json node scripts/prove-exams.mjs
import { person, step, steps, assert, refused, cred, RUN, PW } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("subject teacher"), classTeacher = person("class teacher"), dean = person("dean"), principal = person("principal"),
  parent = person("parent"), stranger = person("stranger"), anon = person("anon");
const X = {};
const SEC = RUN.slice(-2).toUpperCase() + "E";

try {
  await step("the school's people: a subject teacher, a class teacher, a dean, a principal, a parent, and another family", async () => {
    await admin.login(cred().email, cred().password);
    X.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, tag) => (await admin.post("/accounts", { email: `${tag}.ex${RUN}@s.test`, name, password: PW, role, orgId: X.org })).account;
    X.t = await mk("Sub Teacher", "teacher", "sub"); X.ct = await mk("Class Teacher", "teacher", "cls");
    X.dean = await mk("Dean Of Studies", "teacher", "dean"); await admin.post(`/accounts/${X.dean.id}/roles`, { product: "learn", role: "dean", orgId: X.org });
    X.pr = await mk("The Principal", "teacher", "prin"); await admin.post(`/accounts/${X.pr.id}/roles`, { product: "learn", role: "principal", orgId: X.org });
    X.par = await mk("A Parent", "guardian", "par"); X.other = await mk("Another Family", "guardian", "oth");
    X.kids = [];
    for (const n of ["Anaya Gill", "Bhavna", "Chirag Sethi"]) X.kids.push(await mk(n, "student", n.split(" ")[0].toLowerCase()));
    await teacher.login(X.t.email, PW); await classTeacher.login(X.ct.email, PW); await dean.login(X.dean.email, PW); await principal.login(X.pr.email, PW);
    await parent.login(X.par.email, PW); await stranger.login(X.other.email, PW);
    await admin.post(`/students/${X.kids[0].id}/guardians`, { guardianId: X.par.id, relationship: "parent" });
    X.cls = (await admin.put("/india/classes", { grade: "IX", section: SEC, classTeacherId: X.ct.id })).class;
    await admin.post(`/india/classes/${X.cls.id}/students`, { studentIds: X.kids.map((k) => k.id) });
    await admin.post(`/india/classes/${X.cls.id}/rolls`, { order: "name" });
  });

  await step("a school starts a scale from a board's template and keeps it as its own; a bad one is refused", async () => {
    const list = await teacher.get("/grading/scales");
    assert.ok(list.templates.some((t) => t.key === "cbse-9") && list.templates.some((t) => t.kind === "coscholastic"));
    assert.match(list.templates.find((t) => t.key === "cbse-9").note, /check this against/i, "the template says it must be checked");
    X.scale = (await admin.post("/grading/scales", { template: "cbse-9", name: "CBSE nine-point " + RUN })).scale;
    assert.equal(X.scale.bands.length, 9); assert.equal(X.scale.passPercent, 33);
    X.co = (await admin.post("/grading/scales", { template: "co-5", name: "Co-scholastic " + RUN })).scale;
    refused(await admin.try("POST", "/grading/scales", { template: "cbse-9", name: X.scale.name }), 409);
    refused(await admin.try("POST", "/grading/scales", { name: "bad", bands: [{ min: 40, grade: "A" }] }), 400);
    refused(await teacher.try("POST", "/grading/scales", { template: "percent", name: "mine" }), 403);
    const upd = (await admin.put(`/grading/scales/${X.scale.id}`, { passPercent: 35, note: "Checked against the circular of " + RUN })).scale;
    assert.equal(upd.passPercent, 35); assert.equal(upd.bands.length, 9, "what was not named stays");
    await admin.put(`/grading/scales/${X.scale.id}`, { passPercent: 33 });
  });

  await step("an exam with papers per subject, each with its teacher and what it is out of", async () => {
    X.exam = (await admin.post("/exams", { name: "Half-yearly " + RUN, kind: "term", scaleId: X.scale.id, coscaleId: X.co.id, startsOn: "2026-04-01", endsOn: "2026-10-31" })).exam;
    refused(await admin.try("POST", "/exams", { name: X.exam.name, kind: "term" }), 409);
    refused(await admin.try("POST", "/exams", { name: "x", kind: "weekly" }), 400);
    refused(await admin.try("POST", "/exams", { name: "y", scaleId: X.co.id }), 400);                        // a co-scholastic scale is not a grading scale
    refused(await teacher.try("POST", "/exams", { name: "nope" }), 403);
    const r = await admin.post(`/exams/${X.exam.id}/papers`, { classId: X.cls.id, papers: [
      { subject: "Science", teacherId: X.t.id }, { subject: "Mathematics", teacherId: X.t.id, maxTheory: 80, maxInternal: 20 }, { subject: "Art", maxTheory: 0, maxInternal: 50 }] });
    assert.equal(r.papers.length, 3); X.sci = r.papers.find((p) => p.subject === "Science"); X.mat = r.papers.find((p) => p.subject === "Mathematics"); X.art = r.papers.find((p) => p.subject === "Art");
    assert.equal(X.sci.maxTheory, 80); assert.equal(X.art.maxTheory, 0); assert.equal(X.art.state, "entry");
    refused(await admin.try("POST", `/exams/${X.exam.id}/papers`, { classId: X.cls.id, papers: [{ subject: "Science" }, { subject: "science" }] }), 400);
  });

  await step("the subject teacher sees only their papers; the class teacher sees the section's; others see nothing", async () => {
    assert.deepEqual((await teacher.get(`/papers?examId=${X.exam.id}`)).papers.map((p) => p.subject).sort(), ["Mathematics", "Science"]);
    assert.deepEqual((await classTeacher.get(`/papers?examId=${X.exam.id}`)).papers.map((p) => p.subject).sort(), ["Art", "Mathematics", "Science"]);
    assert.equal((await admin.get(`/papers?examId=${X.exam.id}`)).papers.length, 3);
    refused(await stranger.try("GET", `/papers/${X.sci.id}`), 403);
    refused(await teacher.try("GET", `/papers/${X.art.id}`), 403);
    refused(await anon.try("GET", "/papers"), 401);
    const v = await teacher.get(`/papers/${X.sci.id}`);
    assert.deepEqual(v.students.map((s) => s.name), ["Anaya Gill", "Bhavna", "Chirag Sethi"]); assert.equal(v.paper.entered, 0);
  });

  await step("marks are entered within what the paper is out of, and a bad one names the child", async () => {
    const put = (who, id, marks, extra = {}) => who.try("PUT", `/papers/${id}/marks`, { marks, ...extra });
    const bad = await put(teacher, X.sci.id, [{ accountId: X.kids[1].id, theory: 81, internal: 10 }]);
    refused(bad, 400); assert.match(bad.body.error.message, /Bhavna/); assert.equal(bad.body.error.field, "theory");
    refused(await put(teacher, X.sci.id, [{ accountId: X.kids[1].id, theory: -1 }]), 400);
    refused(await put(teacher, X.sci.id, [{ accountId: "acc_nobody", theory: 1 }]), 400);
    const ok = await put(teacher, X.sci.id, [{ accountId: X.kids[0].id, theory: 70, internal: 18 }, { accountId: X.kids[1].id, theory: 20, internal: 5 }]);
    assert.equal(ok.status, 200);
    const s = ok.body.students;
    assert.deepEqual([s[0].total, s[0].grade, s[0].pass], [88, "A2", true]); assert.deepEqual([s[1].total, s[1].grade, s[1].pass], [25, "E1", false]); assert.equal(ok.body.paper.entered, 2);
    assert.equal((await put(teacher, X.mat.id, [{ accountId: X.kids[0].id, theory: 60, internal: 15 }, { accountId: X.kids[1].id, absent: true }, { accountId: X.kids[2].id, theory: 79.5, internal: 20 }])).status, 200);
    refused(await put(stranger, X.sci.id, [{ accountId: X.kids[0].id, theory: 1, internal: 1 }]), 403);
  });

  await step("a paper cannot be handed in with children still to mark, or half marked", async () => {
    const r = await teacher.try("POST", `/papers/${X.sci.id}/advance`, { to: "submitted" });
    refused(r, 409); assert.match(r.body.error.message, /1 child has no marks/);
    await teacher.put(`/papers/${X.sci.id}/marks`, { marks: [{ accountId: X.kids[2].id, theory: 55 }] });
    const half = await teacher.try("POST", `/papers/${X.sci.id}/advance`, { to: "submitted" });
    refused(half, 409); assert.match(half.body.error.message, /Chirag Sethi has only part/);
    await teacher.put(`/papers/${X.sci.id}/marks`, { marks: [{ accountId: X.kids[2].id, theory: 55, internal: 15 }] });
    refused(await teacher.try("POST", `/papers/${X.sci.id}/advance`, { to: "checked" }), 409);     // not one step
  });

  await step("handed in, the teacher can no longer change it; the dean checks, the principal approves, the office publishes", async () => {
    for (const id of [X.sci.id, X.mat.id]) assert.equal((await teacher.post(`/papers/${id}/advance`, { to: "submitted" })).paper.state, "submitted");
    refused(await teacher.try("PUT", `/papers/${X.sci.id}/marks`, { marks: [{ accountId: X.kids[0].id, theory: 80, internal: 20 }] }), 403);
    refused(await teacher.try("POST", `/papers/${X.sci.id}/advance`, { to: "checked" }), 403);
    refused(await principal.try("POST", `/papers/${X.sci.id}/advance`, { to: "approved" }), 409);    // the check comes first
    assert.equal((await dean.post(`/papers/${X.sci.id}/advance`, { to: "checked" })).paper.state, "checked");
    refused(await dean.try("POST", `/papers/${X.sci.id}/advance`, { to: "approved" }), 403);          // a dean checks; the principal approves
    assert.equal((await principal.post(`/papers/${X.sci.id}/advance`, { to: "approved" })).paper.state, "approved");
    refused(await dean.try("POST", `/papers/${X.sci.id}/advance`, { to: "published" }), 403);
    assert.equal((await principal.post(`/papers/${X.sci.id}/advance`, { to: "published" })).paper.state, "published");
    refused(await principal.try("POST", `/papers/${X.sci.id}/advance`, { to: "entry" }), 409);       // published is not sent back
  });

  await step("sent back, it returns to its teacher with the reason", async () => {
    await dean.post(`/papers/${X.mat.id}/advance`, { to: "checked" });
    refused(await dean.try("POST", `/papers/${X.mat.id}/advance`, { to: "entry" }), 400);             // a reason is needed
    const back = await dean.post(`/papers/${X.mat.id}/advance`, { to: "entry", note: "Bhavna was absent for the practical: check the AB" });
    assert.equal(back.paper.state, "entry"); assert.match(back.paper.returnedNote, /Bhavna/);
    assert.equal((await teacher.get(`/papers?examId=${X.exam.id}`)).papers.find((p) => p.id === X.mat.id).returnedNote.length > 0, true);
    await teacher.post(`/papers/${X.mat.id}/advance`, { to: "submitted" });
    await dean.post(`/papers/${X.mat.id}/advance`, { to: "checked" }); await principal.post(`/papers/${X.mat.id}/advance`, { to: "approved" });
  });

  await step("after approval only the principal changes a mark, must say why, and it is marked and listed", async () => {
    const edit = (who, body) => who.try("PUT", `/papers/${X.sci.id}/marks`, body);
    const m = [{ accountId: X.kids[1].id, theory: 24, internal: 5 }];
    refused(await edit(teacher, { marks: m }), 403); refused(await edit(dean, { marks: m, why: "a long reason here" }), 403);
    const noWhy = await edit(principal, { marks: m }); refused(noWhy, 400); assert.equal(noWhy.body.error.field, "why");
    const WHY = "Re-evaluation of the answer sheet " + RUN;
    const ok = await edit(principal, { marks: m, why: WHY }); assert.equal(ok.status, 200); assert.equal(ok.body.students[1].total, 29);
    const e = (await principal.get("/exams/mark-edits")).edits.filter((x) => x.why === WHY);
    assert.equal(e.length, 1, "only theory changed, from 20 to 24; the internal mark stayed"); assert.deepEqual([e[0].field, e[0].from, e[0].to], ["theory", "20", "24"]);
    assert.equal(e[0].state, "published"); assert.ok(e[0].by.length > 0);
    refused(await dean.try("GET", "/exams/mark-edits"), 403);
  });

  await step("the class teacher adds a remark and co-scholastic grades; the card is built from the published papers only", async () => {
    refused(await stranger.try("PUT", `/exams/${X.exam.id}/cards`, { classId: X.cls.id, cards: [{ accountId: X.kids[0].id, remark: "x" }] }), 403);
    refused(await classTeacher.try("PUT", `/exams/${X.exam.id}/cards`, { classId: X.cls.id, cards: [{ accountId: X.kids[0].id, cos: { Art: "Z" } }] }), 400);
    await classTeacher.put(`/exams/${X.exam.id}/cards`, { classId: X.cls.id, cards: [
      { accountId: X.kids[0].id, remark: "A thoughtful student; reads widely.", result: "promoted", cos: { "Art education": "A", Discipline: "B" } },
      { accountId: X.kids[1].id, remark: "Needs support in Science.", result: "detained" }] });
    const c = (await classTeacher.get(`/exams/${X.exam.id}/cards?classId=${X.cls.id}`));
    const anaya = c.cards.find((x) => x.accountId === X.kids[0].id);
    assert.equal(anaya.subjects.length, 3); assert.equal(anaya.subjects.find((s) => s.subject === "Science").grade, "A2");
    assert.equal(anaya.cos["Art education"], "A"); assert.equal(anaya.decision, "promoted");
    const pub = (await classTeacher.get(`/exams/${X.exam.id}/cards?classId=${X.cls.id}&published=1`)).cards.find((x) => x.accountId === X.kids[0].id);
    assert.deepEqual(pub.subjects.map((s) => s.subject), ["Science"], "only what is published");
    assert.equal(pub.remark, null, "the remark waits until every paper is out");
  });

  await step("a family reads the published card of their own child and no other", async () => {
    const mine = (await parent.get(`/students/${X.kids[0].id}/report-cards`)).reportCards;
    assert.equal(mine.length, 1); assert.equal(mine[0].exam.name, X.exam.name); assert.deepEqual(mine[0].cards[0].subjects.map((s) => s.subject), ["Science"]);
    assert.equal(mine[0].cards[0].subjects[0].total, 88); assert.equal(mine[0].complete, false);
    refused(await parent.try("GET", `/students/${X.kids[1].id}/report-cards`), 403);
    refused(await stranger.try("GET", `/students/${X.kids[0].id}/report-cards`), 403);
    await principal.post(`/papers/${X.mat.id}/advance`, { to: "published" });
    const art = X.art.id;
    await classTeacher.put(`/papers/${art}/marks`, { marks: X.kids.map((k) => ({ accountId: k.id, internal: 42 })) });
    await classTeacher.post(`/papers/${art}/advance`, { to: "submitted" }); await dean.post(`/papers/${art}/advance`, { to: "checked" });
    await principal.post(`/papers/${art}/advance`, { to: "approved" }); await principal.post(`/papers/${art}/advance`, { to: "published" });
    const full = (await parent.get(`/students/${X.kids[0].id}/report-cards`)).reportCards[0];
    assert.equal(full.complete, true); assert.equal(full.cards[0].subjects.length, 3); assert.equal(full.cards[0].remark, "A thoughtful student; reads widely."); assert.equal(full.cards[0].decision, "promoted");
    assert.equal(full.cards[0].result, "pass"); assert.ok(full.cards[0].percent > 80);
    const kid = person("kid"); await kid.login(X.kids[0].email, PW);
    await new Promise((r) => setTimeout(r, 1500));                       // notices are written after the response
    const out = (await kid.get("/inbox")).notices.filter((n) => /marks are out/.test(n.title));
    assert.deepEqual(out.map((n) => n.title).sort(), [`${X.exam.name}: Art marks are out`, `${X.exam.name}: Mathematics marks are out`, `${X.exam.name}: Science marks are out`], "one notice per paper");
  });

  await step("a parent meeting: a slot per child in roll order, or slots the families choose", async () => {
    const roll = (await classTeacher.post("/ptm", { classId: X.cls.id, examId: X.exam.id, title: "Half-yearly results " + RUN, day: "2099-01-10", start: "10:00", slotMinutes: 10, mode: "roll" })).ptm;
    const v = await classTeacher.get(`/ptm/${roll.id}`);
    assert.deepEqual(v.slots.map((s) => [s.starts, s.child]), [["10:00", "Anaya Gill"], ["10:10", "Bhavna"], ["10:20", "Chirag Sethi"]]);
    const mine = (await parent.get(`/students/${X.kids[0].id}/ptm`)).meetings.find((m) => m.id === roll.id);
    assert.deepEqual(mine.slot, { no: 1, starts: "10:00" });
    refused(await parent.try("POST", `/ptm/${roll.id}/book`, { accountId: X.kids[0].id, slotNo: 2 }), 409);       // Bhavna's slot
    refused(await stranger.try("POST", `/ptm/${roll.id}/book`, { accountId: X.kids[0].id, slotNo: 1 }), 403);
    await parent.post(`/ptm/${roll.id}/release`, { accountId: X.kids[0].id });
    assert.equal((await parent.get(`/students/${X.kids[0].id}/ptm`)).meetings.find((m) => m.id === roll.id).slot, null);
    const open = (await classTeacher.post("/ptm", { classId: X.cls.id, title: "Open evening " + RUN, day: "2099-01-11", start: "09:00", slotMinutes: 15, mode: "open" })).ptm;
    const free = (await parent.get(`/students/${X.kids[0].id}/ptm`)).meetings.find((m) => m.id === open.id).free;
    assert.ok(free.length >= 3, "a few more slots than children");
    assert.deepEqual((await parent.post(`/ptm/${open.id}/book`, { accountId: X.kids[0].id, slotNo: free[1].no })).booked, { no: free[1].no, starts: free[1].starts });
    await parent.post(`/ptm/${open.id}/book`, { accountId: X.kids[0].id, slotNo: free[2].no });                          // a move frees the first
    const after = (await classTeacher.get(`/ptm/${open.id}`)).slots;
    assert.equal(after.filter((s) => s.accountId === X.kids[0].id).length, 1); assert.equal(after.find((s) => s.no === free[1].no).accountId, null);
    refused(await classTeacher.try("POST", "/ptm", { classId: X.cls.id, title: "x", day: "2099-01-12", start: "9am", slotMinutes: 10 }), 400);
    refused(await classTeacher.try("POST", "/ptm", { classId: X.cls.id, title: "x", day: "2099-01-12", start: "23:30", slotMinutes: 30 }), 400);
    refused(await stranger.try("POST", "/ptm", { classId: X.cls.id, title: "x", day: "2099-01-12", start: "09:00", slotMinutes: 10 }), 403);
    assert.equal((await classTeacher.get(`/ptm?classId=${X.cls.id}`)).meetings.length >= 2, true);
  });

  await step("a scale in use cannot be deleted; an unused one can", async () => {
    refused(await admin.try("DELETE", `/grading/scales/${X.scale.id}`), 409);
    const spare = (await admin.post("/grading/scales", { template: "percent", name: "Spare " + RUN })).scale;
    assert.equal((await admin.del(`/grading/scales/${spare.id}`)).deleted, true);
  });
} catch { process.exitCode = 1; }
console.log(`\n${steps()} steps passed.`);
