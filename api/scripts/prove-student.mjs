// What the student portal reads and writes, over HTTP, as the student, ending with the refusals:
// their own record and nobody else's, attendance only when the school has put it online, a contact
// card they may change, course requests that keep what the office requires, and a section put
// away that is no longer in their day. Local only; needs an existing administrator.
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-student.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8791/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Stu-" + RUN + "-A1!";
function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, { method, headers: { "content-type": "application/json", origin: "http://localhost:8198", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), put: (p, b) => call("PUT", p, b ?? {}), post: (p, b) => call("POST", p, b ?? {}), patch: (p, b) => call("PATCH", p, b ?? {}),
           del: (p) => call("DELETE", p), try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 180)}`);
const admin = person("admin"), sam = person("sam"), other = person("other");
const ctx = {};
const local = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const TODAY = local(new Date());

async function tidy() {
  if (ctx.online != null) await admin.put("/attendance/settings", { online: ctx.online, closed: ctx.closed }).catch(() => {});
  if (ctx.course) await admin.post("/sections/archive", { courseIds: [ctx.course.id] }).catch(() => {});
  if (ctx.course) await admin.patch(`/courses/${ctx.course.id}`, { status: "archived" }).catch(() => {});
}

try {
  await step("people: two students, a course with work and a register", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, email) => (await admin.post("/accounts", { email, name, password: PW, role: "student", orgId: ctx.org })).account;
    ctx.sam = await mk("Sam Portal", `sam.p${RUN}@s.test`);
    ctx.other = await mk("Olive Portal", `olive.p${RUN}@s.test`);
    await sam.login(ctx.sam.email, PW);
    await other.login(ctx.other.email, PW);
    ctx.course = (await admin.post("/courses", { code: "portal-" + RUN, title: "Portal " + RUN, orgId: ctx.org, status: "published" })).course;
    for (const a of [ctx.sam, ctx.other]) await admin.post(`/courses/${ctx.course.id}/members`, { accountId: a.id, role: "student" });
    ctx.work = (await admin.post(`/courses/${ctx.course.id}/assignments`, { title: "Set one", category: "Homework", outOf: 10, dueAt: Date.now() + 3 * 86400000 })).assignment;
    await admin.put("/grades", { assignmentId: ctx.work.id, accountId: ctx.sam.id, score: 8, feedback: "Check step 3" });
    const set = (await admin.get("/attendance/settings")).settings;
    ctx.online = set.online; ctx.closed = set.closed;
    await admin.put("/attendance/settings", { online: false, closed: set.closed });
    await admin.put("/attendance", { day: TODAY, courseId: ctx.course.id, marks: [{ accountId: ctx.sam.id, status: "late", note: "Bus" }] });
  });

  await step("a student reads their own work, grades and course list, and the comment on a mark", async () => {
    const w = await sam.get("/coursework");
    const mine = w.work.filter((x) => x.courseId === ctx.course.id);
    assert.equal(mine.length, 1);
    assert.deepEqual([mine[0].score, mine[0].outOf, mine[0].feedback], [8, 10, "Check step 3"]);
    const rep = (await sam.get(`/students/${ctx.sam.id}/report`)).report;
    assert.equal(rep.courses.find((c) => c.courseId === ctx.course.id).grade.percent, 80);
    assert.ok((await sam.get(`/students/${ctx.sam.id}/sections`)).sections.some((s) => s.courseId === ctx.course.id));
  });

  await step("they cannot read another student's record", async () => {
    refused(await sam.try("GET", `/students/${ctx.other.id}/report`), 403);
    refused(await sam.try("GET", `/coursework?accountId=${ctx.other.id}`), 403);
    refused(await sam.try("GET", `/accounts/${ctx.other.id}/contact`), 403);
    refused(await sam.try("GET", `/graduation?accountId=${ctx.other.id}`), 403);
    refused(await sam.try("GET", `/students/${ctx.other.id}/guardians`), 403);
  });

  await step("attendance is theirs to read only once the school has put it online", async () => {
    const off = await sam.get(`/attendance?accountId=${ctx.sam.id}`);
    assert.equal(off.online, false);
    assert.equal(off.attendance.length, 0);
    await admin.put("/attendance/settings", { online: true, closed: ctx.closed });
    const on = await sam.get(`/attendance?accountId=${ctx.sam.id}`);
    const row = on.attendance.find((x) => x.courseId === ctx.course.id && x.day === TODAY);
    assert.deepEqual([row.status, row.note], ["late", "Bus"]);
    refused(await sam.try("GET", `/attendance?accountId=${ctx.other.id}`), 403);
  });

  await step("a student keeps their own contact card; the date of birth is not lost by saving it", async () => {
    await admin.put(`/accounts/${ctx.sam.id}/contact`, { mailingAddress: "1 Old Road", cellPhone: "555-0100", dateOfBirth: "2010-04-17" });
    const was = (await sam.get(`/accounts/${ctx.sam.id}/contact`)).contact;
    assert.equal(was.dateOfBirth, "2010-04-17");
    await sam.put(`/accounts/${ctx.sam.id}/contact`, { mailingAddress: "2 New Road", cellPhone: "555-0199", altPhone: null, dateOfBirth: was.dateOfBirth });
    const now = (await sam.get(`/accounts/${ctx.sam.id}/contact`)).contact;
    assert.deepEqual([now.mailingAddress, now.cellPhone, now.dateOfBirth], ["2 New Road", "555-0199", "2010-04-17"]);
    refused(await sam.try("PUT", `/accounts/${ctx.other.id}/contact`, { cellPhone: "555-0000" }), 403);
  });

  await step("a program's enrollment date is a date, and a bad one is refused rather than breaking the record", async () => {
    refused(await admin.try("PUT", `/accounts/${ctx.sam.id}/program`, { track: "21.5", gradeLevel: 10, enrolledAt: "not a date" }), 400);
    assert.equal((await admin.try("PUT", `/accounts/${ctx.sam.id}/program`, { track: "21.5", gradeLevel: 10, enrolledAt: "2025-09-02", program: "Regular diploma" })).status, 200);
    const g = (await sam.get(`/graduation?accountId=${ctx.sam.id}`)).graduation;
    assert.equal(g.enrollment.enrolledOn, "2025-09-02");
    assert.equal(g.program.gradeLevel, 10);
    assert.ok(g.current.some((c) => c.courseId === ctx.course.id), "this year's course is on the record");
  });

  await step("what a student asks for is kept apart from what the office requires", async () => {
    const mkSub = async (number, requestable) => (await admin.post("/subjects", { number: number + RUN, title: number + " " + RUN, requestable })).subject;
    ctx.a = await mkSub("PA", true); ctx.b = await mkSub("PB", true); ctx.req = await mkSub("PR", true);
    await admin.put(`/course-requests/${ctx.sam.id}`, { requests: [{ subjectId: ctx.req.id, rank: 0 }] });
    assert.equal((await sam.try("PUT", `/course-requests/${ctx.sam.id}`, { requests: [{ subjectId: ctx.a.id, rank: 1 }, { subjectId: ctx.b.id, rank: 2 }] })).status, 200);
    let list = (await sam.get(`/course-requests?accountId=${ctx.sam.id}`)).requests;
    assert.deepEqual(list.map((r) => r.rank).sort(), [0, 1, 2]);
    // Saving only their own choices again, and even naming the required course, leaves it required.
    assert.equal((await sam.try("PUT", `/course-requests/${ctx.sam.id}`, { requests: [{ subjectId: ctx.a.id, rank: 3 }] })).status, 200);
    list = (await sam.get(`/course-requests?accountId=${ctx.sam.id}`)).requests;
    assert.deepEqual(list.map((r) => r.rank).sort(), [0, 3]);
    assert.equal(list.find((r) => r.subjectId === ctx.req.id).rank, 0);
    refused(await sam.try("PUT", `/course-requests/${ctx.sam.id}`, { requests: [{ subjectId: ctx.req.id, rank: 0 }] }), 403);
    refused(await sam.try("PUT", `/course-requests/${ctx.other.id}`, { requests: [] }), 403);
    await admin.put(`/course-requests/${ctx.sam.id}`, { requests: [] });
  });

  await step("a section put away leaves their day, their work and their report, and stays on the record", async () => {
    await admin.post("/sections/archive", { courseIds: [ctx.course.id] });
    assert.equal((await sam.get(`/students/${ctx.sam.id}/sections`)).sections.some((s) => s.courseId === ctx.course.id), false);
    assert.equal((await sam.get("/coursework")).work.some((x) => x.courseId === ctx.course.id), false);
    assert.equal((await sam.get(`/students/${ctx.sam.id}/report`)).report.courses.some((c) => c.courseId === ctx.course.id), false);
    assert.equal((await sam.get("/courses")).courses.some((c) => c.id === ctx.course.id), false);
    // Still theirs to read when asked for: the record does not forget.
    assert.equal((await sam.get(`/students/${ctx.sam.id}/report?archived=1`)).report.courses.some((c) => c.courseId === ctx.course.id), true);
    const g = (await sam.get(`/graduation?accountId=${ctx.sam.id}`)).graduation;
    assert.ok(g.current.some((c) => c.courseId === ctx.course.id), "credit for it is not taken away");
  });

  await step("the school is put back as it was found", async () => {
    await tidy();
    for (const s of [ctx.a, ctx.b, ctx.req]) if (s) await admin.patch(`/subjects/${s.id}`, { retired: true });
    const set = (await admin.get("/attendance/settings")).settings;
    assert.equal(set.online, ctx.online);
  });

  console.log(`\n${n} steps passed.`);
} catch {
  await tidy().catch(() => {});
  console.log(`\n${n} steps passed before the first failure.`);
}
