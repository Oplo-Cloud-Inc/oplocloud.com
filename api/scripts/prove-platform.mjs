// The platform services over HTTP, as the people who use them, ending with the refusals:
// the inbox and what is sent to it, reminders, the school's smaller records and who may
// read them, files, data in and out, and districts. Local only; needs an administrator.
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-platform.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8791/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Plt-" + RUN + "-A1!";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const admin = person("admin"), teacher = person("teacher"), sam = person("sam"), olive = person("olive"), dana = person("dana");
const ctx = {};
const DAY = "2031-05-06";                                // a Tuesday, far from anything real

// The inbox is written after the response, so wait for it.
async function until(fn, what) { for (let i = 0; i < 40; i++) { const v = await fn(); if (v) return v; await sleep(150); } throw new Error("never arrived: " + what); }

try {
  await step("people: a teacher, two students, a parent, and a course with a register", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk("Tia Platform", "teacher", `tia.pl${RUN}@s.test`);
    ctx.sam = await mk("Sam Platform", "student", `sam.pl${RUN}@s.test`);
    ctx.olive = await mk("Olive Platform", "student", `olive.pl${RUN}@s.test`);
    await teacher.login(ctx.teacher.email, PW); await sam.login(ctx.sam.email, PW); await olive.login(ctx.olive.email, PW);
    ctx.dana = (await admin.post(`/students/${ctx.sam.id}/guardians`, { name: "Dana Platform", email: `dana.pl${RUN}@f.test`, password: PW, relationship: "parent" })).guardians[0];
    await dana.login(`dana.pl${RUN}@f.test`, PW);
    ctx.course = (await admin.post("/courses", { code: "plat-" + RUN, title: "Platform " + RUN, orgId: ctx.org, status: "published" })).course;
    await admin.post(`/courses/${ctx.course.id}/members`, { accountId: ctx.teacher.id, role: "teacher" });
    for (const a of [ctx.sam, ctx.olive]) await admin.post(`/courses/${ctx.course.id}/members`, { accountId: a.id, role: "student" });
  });

  await step("a student writes to a teacher, the teacher replies in the thread, and unread counts follow", async () => {
    const sent = await sam.post("/messages", { to: [ctx.teacher.id], title: "Question about Friday", body: "Is the quiz open book?" });
    assert.equal(sent.reached, 1);
    assert.equal((await teacher.get("/inbox/unread")).unread, 1);
    const thr = await teacher.get(`/inbox/thread/${sent.threadId}`);
    assert.equal(thr.notices.length, 1);
    assert.equal((await teacher.get("/inbox/unread")).unread, 0, "opening it reads it");
    await teacher.post("/messages", { threadId: sent.threadId, title: "Re: Question about Friday", body: "Yes, open book." });
    const back = await sam.get("/inbox");
    assert.equal(back.notices.filter((x) => x.threadId === sent.threadId).length, 1);
    assert.equal(back.unread, 1);
    assert.equal((await sam.get("/inbox?box=sent")).notices.length, 1);
    await sam.post("/inbox/read", { all: true });
    assert.equal((await sam.get("/inbox/unread")).unread, 0);
  });

  await step("a student cannot write to another student, to a group, or into a conversation they are not in", async () => {
    refused(await sam.try("POST", "/messages", { to: [ctx.olive.id], title: "Hi", body: "Hi" }), 403);
    refused(await sam.try("POST", "/messages", { audience: { kind: "course", courseId: ctx.course.id }, title: "All", body: "All" }), 403);
    const t = (await sam.get("/inbox?box=sent")).notices[0].threadId;
    refused(await olive.try("POST", "/messages", { threadId: t, title: "Re", body: "butting in" }), 403);
    refused(await olive.try("GET", `/inbox/thread/${t}`), 404);
  });

  await step("a teacher writes to a course; only the office writes to everyone", async () => {
    const r = await teacher.post("/messages", { audience: { kind: "course", courseId: ctx.course.id }, title: "Quiz moved", body: "The quiz is Monday." });
    assert.ok(r.reached >= 2, "both students, and whoever made the course");
    assert.ok((await olive.get("/inbox")).notices.some((x) => x.title === "Quiz moved" && x.kind === "announcement"));
    refused(await teacher.try("POST", "/messages", { audience: { kind: "students" }, title: "x", body: "x" }), 403);
    assert.equal((await admin.try("POST", "/messages", { audience: { kind: "families" }, title: "Picture day", body: "Friday." })).status, 201);
    assert.ok(await until(async () => (await dana.get("/inbox")).notices.some((x) => x.title === "Picture day"), "family broadcast"));
  });

  await step("marking a student absent tells them and their family, once, unless they turned alerts off", async () => {
    const codes = (await admin.get("/attendance/codes")).codes;
    const absent = codes.find((c) => c.kind === "absent" && !c.retired && !c.adminOnly).key;
    await teacher.put("/attendance", { day: DAY, courseId: ctx.course.id, marks: [{ accountId: ctx.sam.id, status: absent }, { accountId: ctx.olive.id, status: absent }] });
    await until(async () => (await sam.get("/inbox")).notices.some((x) => x.kind === "alert"), "student alert");
    await until(async () => (await dana.get("/inbox")).notices.some((x) => x.kind === "alert"), "family alert");
    // Saving the same register again says nothing twice.
    await teacher.put("/attendance", { day: DAY, courseId: ctx.course.id, marks: [{ accountId: ctx.sam.id, status: absent }] });
    await sleep(500);
    assert.equal((await sam.get("/inbox")).notices.filter((x) => x.kind === "alert").length, 1);
    // Olive turns alerts off; a later absence does not reach her inbox.
    await olive.put("/inbox/prefs", { prefs: [{ kind: "alert", inApp: false, email: false }] });
    await teacher.put("/attendance", { day: "2031-05-07", courseId: ctx.course.id, marks: [{ accountId: ctx.olive.id, status: absent }] });
    await sleep(700);
    assert.equal((await olive.get("/inbox")).notices.filter((x) => x.kind === "alert").length, 1, "only the one from before");
  });

  await step("reminders are made once per person per key", async () => {
    const day = "2031-05-08";
    const first = await admin.post("/reminders/run", { day, minutes: 600 });
    assert.ok(first.made.roll >= 1, "the teacher has no register for that day");
    const again = await admin.post("/reminders/run", { day, minutes: 600 });
    assert.equal(again.made.roll, 0);
    assert.ok((await teacher.get("/inbox")).notices.some((x) => x.kind === "reminder" && /No register yet/.test(x.title)));
    refused(await sam.try("POST", "/reminders/run", {}), 403);
  });

  await step("records of the school: who reads a referral, a detention and a leave request", async () => {
    const kinds = (await sam.get("/item-kinds")).kinds;
    assert.ok(kinds.referral && kinds.detention && kinds.invoice && kinds.event);
    const ref = (await teacher.post("/items", { kind: "referral", title: "Talking in class", subjectId: ctx.sam.id, dueOn: DAY, data: { reason: "Classroom behaviour", details: "Third time." } })).item;
    const det = (await teacher.post("/items", { kind: "detention", title: "Detention", subjectId: ctx.sam.id, dueOn: DAY, data: { minutes: 30 } })).item;
    assert.equal(det.status, "assigned");
    assert.equal((await sam.get("/items?kind=detention")).items.length, 1, "their own");
    assert.equal((await olive.get("/items?kind=detention")).items.length, 0, "not their neighbour's");
    assert.equal((await dana.get("/items?kind=detention")).items.length, 1, "their child's");
    refused(await olive.try("GET", `/items/${det.id}`), 403);
    refused(await sam.try("POST", "/items", { kind: "referral", title: "x", subjectId: ctx.olive.id, data: { reason: "Other" } }), 403);
    refused(await teacher.try("POST", "/items", { kind: "detention", title: "x", subjectId: ctx.sam.id, data: {} }), 400);
    assert.equal((await teacher.patch(`/items/${det.id}`, { status: "served", data: { minutes: 30, servedMinutes: 30 } })).item.status, "served");
    assert.ok(await until(async () => (await sam.get("/inbox")).notices.some((x) => /Detention/.test(x.title)), "detention alert"));
    ctx.det = det; ctx.ref = ref;

    const leave = (await teacher.post("/items", { kind: "leave", title: "Conference", dueOn: "2031-06-02", data: { type: "Professional" } })).item;
    assert.deepEqual([leave.status, leave.subjectId], ["pending", ctx.teacher.id]);
    refused(await teacher.try("PATCH", `/items/${leave.id}`, { status: "approved" }), 403);
    assert.equal((await admin.patch(`/items/${leave.id}`, { status: "approved" })).item.status, "approved");
    assert.ok(await until(async () => (await teacher.get("/inbox")).notices.some((x) => /Leave request approved/.test(x.title)), "leave decision"));
    assert.equal((await sam.get("/items?kind=leave")).items.length, 0);
  });

  await step("events reach their audience; an invoice is the office's and its family's", async () => {
    const ev = (await admin.post("/items", { kind: "event", title: "Open evening", dueOn: "2031-06-10", data: { place: "Hall", audience: "families" } })).item;
    assert.ok(await until(async () => (await dana.get("/inbox")).notices.some((x) => /Open evening/.test(x.title)), "event notice"));
    assert.equal((await sam.get("/items?kind=event")).items.some((x) => x.id === ev.id), true, "everyone reads the calendar");
    refused(await sam.try("POST", "/items", { kind: "event", title: "Mine", data: {} }), 403);
    const inv = (await admin.post("/items", { kind: "invoice", title: "Spring trip", subjectId: ctx.sam.id, dueOn: "2031-06-01", data: { lines: "Trip, 40", total: 40 } })).item;
    assert.equal((await dana.get("/items?kind=invoice")).items.length, 0, "a draft is the office's");
    await admin.patch(`/items/${inv.id}`, { status: "issued" });
    assert.equal((await dana.get("/items?kind=invoice")).items.length, 1);
    assert.equal((await olive.get("/items?kind=invoice")).items.length, 0);
    refused(await dana.try("POST", "/items", { kind: "payment", title: "Paid", subjectId: ctx.sam.id, data: { invoiceId: inv.id, amount: 40, method: "cash" } }), 403);
    assert.equal((await admin.post("/items", { kind: "payment", title: "Paid", subjectId: ctx.sam.id, data: { invoiceId: inv.id, amount: 40, method: "cash" } })).item.status, "received");
    refused(await sam.try("GET", "/items?kind=eligibility"), 403);
  });

  await step("a file belongs to its record: those who may read the record may read it", async () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const f = (await teacher.post("/files", { ownerKind: "item", ownerId: ctx.det.id, name: "slip.png", type: "image/png", data: png })).file;
    assert.equal((await sam.get(`/files/${f.id}`)).file.name, "slip.png");
    refused(await olive.try("GET", `/files/${f.id}`), 403);
    refused(await sam.try("POST", "/files", { ownerKind: "item", ownerId: ctx.det.id, name: "x.png", type: "image/png", data: png }), 403);
    refused(await teacher.try("POST", "/files", { ownerKind: "item", ownerId: ctx.det.id, name: "x.exe", type: "application/x-msdownload", data: png }), 400);
    assert.equal((await teacher.get(`/items/${ctx.det.id}`)).item.files.length, 1);
  });

  await step("data in and out: export, a checked import, an extract with its problems", async () => {
    const ex = await admin.get("/exchange/export?set=users");
    assert.ok(ex.rows.some((r) => r[2] === ctx.sam.email));
    refused(await teacher.try("GET", "/exchange/export?set=users"), 403);
    const email = `new.pl${RUN}@s.test`;
    const bad = await admin.try("POST", "/exchange/import", { set: "users", rows: [{ name: "A", email: "nope", role: "wizard" }, { name: "Sam Platform", email: ctx.sam.email, role: "student" }] });
    assert.equal(bad.status, 200);
    assert.equal(bad.body.applied, false);
    assert.ok(bad.body.problemCount >= 3);
    const dry = await admin.post("/exchange/import", { set: "users", dry: true, rows: [{ name: "New Person", email, role: "student" }] });
    assert.equal(dry.applied, false);
    assert.equal((await admin.try("GET", `/exchange/export?set=users`)).body.rows.some((r) => r[2] === email), false, "a dry run writes nothing");
    const done = await admin.post("/exchange/import", { set: "users", rows: [{ name: "New Person", email, role: "student" }] });
    assert.equal(done.applied, true);
    assert.equal(done.credentials.length, 1);
    await person("new").login(email, done.credentials[0].password);
    const en = await admin.post("/exchange/import", { set: "enrollments", rows: [{ section: ctx.course.code, email, role: "student" }] });
    assert.equal(en.applied, true);
    const x = await admin.get("/exchange/extract?kind=enrollment");
    assert.ok(x.problems.some((p) => p.student === "New Person" && p.field === "dateOfBirth"));
    assert.equal(x.ready, false);
  });

  await step("the calendar can be subscribed to, by an address that carries its own proof", async () => {
    const soon = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    await admin.post("/items", { kind: "event", title: "Open evening", dueOn: soon, data: { place: "Hall", audience: "students" } });
    const { url } = await sam.get("/feeds/link");
    const r = await fetch(url);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/calendar/);
    const text = await r.text();
    assert.match(text, /BEGIN:VCALENDAR/);
    assert.match(text, /Open evening/, "an event of the school");
    assert.equal((await fetch(url.replace(/[0-9a-f]{6}\/calendar/, "000000/calendar"))).status, 404, "a wrong proof finds nothing");
    const fam = await admin.get("/exchange/export?set=families");
    assert.ok(fam.rows.some((x) => x[0] === "Sam Platform" && x[2] === "Dana Platform"));
  });

  await step("a district reads its schools; a teacher does not", async () => {
    const d = await admin.get("/district/summary");
    assert.ok(d.schools.length >= 1);
    assert.ok(d.schools[0].students >= 1);
    refused(await teacher.try("GET", "/district/summary"), 403);
    refused(await teacher.try("PATCH", `/district/schools/${ctx.org}`, { parentId: null }), 403);
  });

  console.log(`\n${n} steps passed.`);
} catch {
  console.log(`\n${n} steps passed before the first failure.`);
}
