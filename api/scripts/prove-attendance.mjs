// Attendance for the school office, over HTTP, as the people who use it,
// ending with the refusals. Local only; needs an existing administrator.
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-attendance.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8791/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Att-" + RUN + "-A1!";
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
  return { get: (p) => call("GET", p), put: (p, b) => call("PUT", p, b ?? {}), post: (p, b) => call("POST", p, b ?? {}),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 160)}`);
const admin = person("admin"), teacher = person("teacher"), other = person("other"), dean = person("dean"), family = person("family"), kid = person("student");
const ctx = {};
// The proof can be run again on the same database: it reads back only its own students.
const mine = (log) => log.filter((x) => x.accountId === ctx.kai.id || x.accountId === ctx.lee.id);
const iso = (d) => d.toISOString().slice(0, 10);
// Fixed days well in the past, so the proof does not depend on today: a Monday, a Tuesday, a Wednesday and a Saturday.
const MON = "2026-03-02", TUE = "2026-03-03", WED = "2026-03-04", SAT = "2026-03-07";

try {
  await step("people: a teacher, another teacher, a dean, a family, two students", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    ctx.was = (await admin.get("/attendance/settings")).settings;   // put back at the end
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk("Tess Teacher", "teacher", `tess.${RUN}@s.test`);
    ctx.other = await mk("Otto Other", "teacher", `otto.${RUN}@s.test`);
    ctx.dean = await mk("Dee Dean", "dean", `dee.${RUN}@s.test`);
    ctx.parent = await mk("Pia Parent", "guardian", `pia.${RUN}@s.test`);
    ctx.kai = await mk("Kai Student", "student", `kai.${RUN}@s.test`);
    ctx.lee = await mk("Lee Student", "student", `lee.${RUN}@s.test`);
    for (const [p, a] of [[teacher, ctx.teacher], [other, ctx.other], [dean, ctx.dean], [family, ctx.parent], [kid, ctx.kai]]) await p.login(a.email, PW);
    await admin.post(`/students/${ctx.kai.id}/guardians`, { guardianId: ctx.parent.id, relationship: "parent" });
    const course = async (title, code) => (await admin.post("/courses", { code: code + RUN, title, subject: "Science", status: "published", orgId: ctx.org })).course;
    ctx.bio = await course("Biology " + RUN, "bio");
    ctx.eng = await course("English " + RUN, "eng");
    for (const c of [ctx.bio, ctx.eng]) {
      await admin.post(`/courses/${c.id}/members`, { accountId: ctx.teacher.id, role: "teacher" });
      await admin.post(`/courses/${c.id}/members`, { accountId: ctx.kai.id, role: "student" });
      await admin.post(`/courses/${c.id}/members`, { accountId: ctx.lee.id, role: "student" });
    }
  });

  await step("a teacher takes a register; every mark is a line of history", async () => {
    const r = await teacher.put("/attendance", { day: MON, courseId: ctx.bio.id, via: "register", marks: [
      { accountId: ctx.kai.id, status: "present" }, { accountId: ctx.lee.id, status: "absent", note: "Sick" }] });
    assert.equal(r.saved, 2);
    const lg = await admin.get(`/attendance/log?day=${MON}&accountId=${ctx.lee.id}`);
    assert.equal(lg.log.length, 1);
    assert.deepEqual([lg.log[0].from, lg.log[0].to, lg.log[0].toNote, lg.log[0].via, lg.log[0].byId], [null, "absent", "Sick", "register", ctx.teacher.id]);
  });

  await step("saving the same register again changes nothing and writes no history", async () => {
    await teacher.put("/attendance", { day: MON, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "present" }, { accountId: ctx.lee.id, status: "absent", note: "Sick" }] });
    assert.equal(mine((await admin.get(`/attendance/log?day=${MON}`)).log).length, 2);
  });

  await step("a correction is a second line that remembers the first", async () => {
    await dean.put("/attendance", { day: MON, courseId: ctx.bio.id, via: "student", marks: [{ accountId: ctx.lee.id, status: "excused", note: "Sick, doctor's note" }] });
    const lg = (await admin.get(`/attendance/log?accountId=${ctx.lee.id}`)).log;
    assert.equal(lg.length, 2);
    assert.deepEqual([lg[0].from, lg[0].to, lg[0].fromNote, lg[0].toNote, lg[0].via, lg[0].byId], ["absent", "excused", "Sick", "Sick, doctor's note", "student", ctx.dean.id]);
  });

  await step("review: a register with everyone marked, and one nobody took", async () => {
    await teacher.put("/attendance", { day: TUE, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "late" }] });   // one of two students
    const r = await admin.get(`/attendance/review?from=${MON}&to=${WED}`);
    const cov = (c, d) => r.coverage.find((x) => x.courseId === c.id && x.day === d);
    assert.equal(cov(ctx.bio, MON).n, 2);
    assert.equal(cov(ctx.bio, MON).counts.excused, 1);
    assert.deepEqual([cov(ctx.bio, MON).here, cov(ctx.bio, MON).away, cov(ctx.bio, MON).late], [1, 1, 0]);   // counted by kind
    assert.equal(cov(ctx.bio, TUE).n, 1);
    assert.equal(cov(ctx.bio, TUE).late, 1);
    assert.equal(cov(ctx.eng, MON), undefined);
  });

  await step("review finds a mark for a student who is not in the course", async () => {
    await admin.post(`/courses/${ctx.eng.id}/members`, { accountId: ctx.lee.id, role: "student", remove: true });
    await admin.put("/attendance", { day: WED, courseId: ctx.eng.id, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    // Lee was marked before leaving the course.
    const mark = await admin.get(`/attendance?courseId=${ctx.bio.id}&day=${MON}`);
    assert.equal(mark.attendance.length, 2);
    await admin.post(`/courses/${ctx.bio.id}/members`, { accountId: ctx.lee.id, role: "student", remove: true });
    const r = await admin.get(`/attendance/review?from=${MON}&to=${WED}`);
    const p = r.problems.filter((x) => x.kind === "not-enrolled" && x.accountId === ctx.lee.id);
    assert.equal(p.length, 1);
    assert.equal(p[0].courseId, ctx.bio.id);
  });

  await step("review finds a register on a weekend, and on a day the school closed", async () => {
    await admin.put("/attendance", { day: SAT, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    await admin.put("/attendance/settings", { online: false, closed: [{ from: WED, to: WED, label: "Snow day" }] });
    const r = await admin.get(`/attendance/review?from=${MON}&to=${SAT}`);
    const ns = r.problems.filter((x) => x.kind === "no-school");
    assert.ok(ns.some((x) => x.day === SAT && x.reason === "A weekend"));
    assert.ok(ns.some((x) => x.day === WED && x.reason === "Snow day"));
    // The calendar decides what a school day was, so weekends are listed too, without a label.
    assert.deepEqual(r.closed.find((c) => c.day === WED), { day: WED, label: "Snow day" });
    assert.ok(r.closed.some((c) => c.day === SAT));
  });

  await step("review finds a student absent in one course and in the room for another", async () => {
    await admin.put("/attendance", { day: TUE, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "absent" }] });
    await admin.put("/attendance", { day: TUE, courseId: ctx.eng.id, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    const r = await admin.get(`/attendance/review?from=${TUE}&to=${TUE}`);
    const d = r.problems.filter((x) => x.kind === "disagree" && x.accountId === ctx.kai.id);
    assert.equal(d.length, 1);
    assert.deepEqual([d[0].absentCourseId, d[0].hereCourseId], [ctx.bio.id, ctx.eng.id]);
  });

  await step("removing marks is the school's, and is kept in the history", async () => {
    const r = await admin.get(`/attendance/review?from=${MON}&to=${SAT}`);
    const ids = r.problems.filter((x) => x.kind === "no-school" && x.day === SAT).map((x) => x.id);
    refused(await teacher.try("POST", "/attendance/remove", { ids }), 403);
    const out = await dean.post("/attendance/remove", { ids });
    assert.equal(out.removed, ids.length);
    const lg = mine((await admin.get(`/attendance/log?day=${SAT}`)).log);
    assert.deepEqual([lg[0].from, lg[0].to, lg[0].via], ["present", null, "remove"]);
  });

  await step("a family sees nothing until the school puts attendance online", async () => {
    const off = await family.get(`/attendance?accountId=${ctx.kai.id}`);
    assert.equal(off.online, false);
    assert.equal(off.attendance.length, 0);
    refused(await kid.try("GET", `/attendance?accountId=${ctx.kai.id}`), 200);
    assert.equal((await kid.get(`/attendance?accountId=${ctx.kai.id}`)).attendance.length, 0);
  });

  await step("only a principal, registrar or administrator can put it online", async () => {
    refused(await dean.try("PUT", "/attendance/settings", { online: true, closed: [] }), 403);
    refused(await teacher.try("PUT", "/attendance/settings", { online: true, closed: [] }), 403);
    const s = (await admin.put("/attendance/settings", { online: true, closed: [{ from: WED, to: WED, label: "Snow day" }] })).settings;
    assert.equal(s.online, true);
  });

  await step("online, the family and the student read their own marks and comments, and no one else's", async () => {
    const mine = await family.get(`/attendance?accountId=${ctx.kai.id}`);
    assert.ok(mine.attendance.length >= 2);
    assert.ok(mine.attendance.every((x) => x.accountId === ctx.kai.id));
    assert.ok(mine.attendance.some((x) => x.courseTitle && x.courseTitle.startsWith("Biology")));
    assert.equal((await kid.get(`/attendance?accountId=${ctx.kai.id}`)).attendance.length, mine.attendance.length);
    refused(await family.try("GET", `/attendance?accountId=${ctx.lee.id}`), 403);
  });

  await step("the school's reading is the school's: review, log, settings, removal", async () => {
    for (const who of [teacher, family, kid, other]) {
      refused(await who.try("GET", `/attendance/review?from=${MON}&to=${TUE}`), 403);
      refused(await who.try("GET", `/attendance/log?day=${MON}`), 403);
      refused(await who.try("GET", "/attendance/settings"), 403);
    }
    assert.equal((await dean.get(`/attendance/review?from=${MON}&to=${TUE}`)).from, MON);
  });

  await step("the log is never everybody for every date; a span is capped", async () => {
    refused(await admin.try("GET", "/attendance/log"), 400);
    refused(await admin.try("GET", "/attendance/review?from=2026-01-01&to=2026-12-31"), 400);
    refused(await admin.try("GET", "/attendance/review?from=2026-03-09&to=2026-03-02"), 400);
  });

  await step("a teacher cannot take a register for a course they do not teach, and a bad via is refused", async () => {
    refused(await other.try("PUT", "/attendance", { day: MON, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "present" }] }), 403);
    refused(await admin.try("PUT", "/attendance", { day: MON, courseId: ctx.bio.id, via: "elsewhere", marks: [{ accountId: ctx.kai.id, status: "present" }] }), 400);
  });

  // ---- the school's own codes, and what a teacher may do with them
  const KEY = "proof-illness";
  const put = (codes, extra) => admin.try("PUT", "/attendance/settings", { online: true, closed: ctx.was.closed, codes, lockDays: null, ...extra });
  const codesNow = async () => (await admin.get("/attendance/settings")).settings.codes;

  await step("a school starts with its codes (five in the US, four in an Indian school), and anybody drawing a mark can read them", async () => {
    const r = await family.get("/attendance/codes");
    assert.ok(r.codes.length >= 4);
    assert.ok(["present", "absent", "late", "excused"].every((k) => r.codes.some((c) => c.key === k)), "the four every school has");
    assert.equal(r.codes.find((c) => c.key === "present").kind, "present");
    assert.deepEqual(r.codes.find((c) => c.key === "late").kind, "tardy");
  });

  await step("a code needs a kind, the first in use must be Present, and a code can only be retired", async () => {
    const cur = await codesNow();
    refused(await put([{ ...cur[0], kind: "absent" }, ...cur.slice(1)]), 400);                 // the default is not "present"
    refused(await put(cur.map((c, i) => (i === 1 ? { ...c, kind: "sometimes" } : c))), 400);    // no such kind
    refused(await put(cur.slice(0, -1)), 400);                                                  // dropping one is refused
  });

  await step("a school adds an Office-only code of kind Excused; every total counts it as away", async () => {
    const cur = await codesNow();
    const have = cur.find((c) => c.key === KEY);
    const next = have ? cur.map((c) => (c.key === KEY ? { ...c, kind: "excused", adminOnly: true, retired: false } : c))
                      : [...cur, { key: KEY, label: "Illness", mark: "I", kind: "excused", adminOnly: true, retired: false }];
    const r = await put(next);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    await dean.put("/attendance", { day: WED, courseId: ctx.bio.id, via: "student", marks: [{ accountId: ctx.kai.id, status: KEY, note: "Flu" }] });
    const rev = await admin.get(`/attendance/review?from=${WED}&to=${WED}`);
    const line = rev.coverage.find((x) => x.courseId === ctx.bio.id && x.day === WED);
    assert.equal(line.counts[KEY], 1);
    assert.ok(line.away >= 1, "an Excused-kind code is away");
  });

  await step("a teacher cannot set an Office-only code, nor change a mark the office set", async () => {
    refused(await teacher.try("PUT", "/attendance", { day: TUE, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: KEY }] }), 403);
    refused(await teacher.try("PUT", "/attendance", { day: WED, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "present" }] }), 403);
    // Saving the register again with the office's mark left alone is fine.
    const ok = await teacher.try("PUT", "/attendance", { day: WED, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: KEY, note: "Flu" }] });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
  });

  await step("a code that does not exist is refused; a retired one stays on the marks that have it", async () => {
    refused(await dean.try("PUT", "/attendance", { day: MON, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "nonsense" }] }), 400);
    const cur = await codesNow();
    const r = await put(cur.map((c) => (c.key === KEY ? { ...c, retired: true } : c)));
    assert.equal(r.status, 200);
    refused(await dean.try("PUT", "/attendance", { day: MON, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: KEY }] }), 400);   // no new marks with it
    const was = await admin.get(`/attendance?courseId=${ctx.bio.id}&day=${WED}`);
    assert.equal(was.attendance.find((x) => x.accountId === ctx.kai.id).status, KEY);                                                        // the old mark keeps it
  });

  await step("the school's window: a teacher cannot take a register for a day that has not come, or one too old; the office can", async () => {
    const r = await admin.try("PUT", "/attendance/settings", { online: true, closed: ctx.was.closed, lockDays: 2 });
    assert.equal(r.status, 200);
    const future = iso(new Date(Date.now() + 5 * 86400000)), old = iso(new Date(Date.now() - 10 * 86400000));
    refused(await teacher.try("PUT", "/attendance", { day: future, courseId: ctx.bio.id, today: iso(new Date()), marks: [{ accountId: ctx.kai.id, status: "present" }] }), 403);
    refused(await teacher.try("PUT", "/attendance", { day: old, courseId: ctx.bio.id, today: iso(new Date()), marks: [{ accountId: ctx.kai.id, status: "present" }] }), 403);
    const fine = await teacher.try("PUT", "/attendance", { day: iso(new Date()), courseId: ctx.bio.id, today: iso(new Date()), marks: [{ accountId: ctx.kai.id, status: "present" }] });
    assert.equal(fine.status, 200, JSON.stringify(fine.body));
    const office = await dean.try("PUT", "/attendance", { day: old, courseId: ctx.bio.id, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    assert.equal(office.status, 200, JSON.stringify(office.body));
    refused(await admin.try("PUT", "/attendance/settings", { online: true, closed: ctx.was.closed, lockDays: -1 }), 400);
  });

  // ---- attendance grades: a snapshot of attendance as a mark in the gradebook
  const gradeOf = async (title, who) => {
    const g = (await admin.get(`/grades?courseId=${ctx.bio.id}&accountId=${who.id}`)).grades.find((x) => x.title === title);
    return g ? g.score : undefined;
  };

  await step("attendance becomes a mark: start with 20, take 2 per absence (excused counts), 1 per tardy after the first", async () => {
    // Kai in Biology over the three days: TUE absent, WED the office's excused Illness; MON present.
    const r = await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`,
      { from: MON, to: WED, mode: "start", start: 20, perAbsence: 2, perTardy: 1, waiveTardies: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.assignment.created, true);
    assert.equal(r.body.assignment.title, "Attendance");
    assert.equal(await gradeOf("Attendance", ctx.kai), 16);
  });

  await step("running it again rewrites the same piece of work, and only that name", async () => {
    const r = await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`,
      { from: MON, to: WED, mode: "start", start: 20, perAbsence: 5, perTardy: 1 });
    assert.equal(r.body.assignment.created, false);
    assert.equal(await gradeOf("Attendance", ctx.kai), 10);
    const named = await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, start: 10, title: "Attendance Q1" });
    assert.equal(named.body.assignment.created, true);
  });

  await step("only some codes count: waive the first absence; count only the unexcused", async () => {
    const r = await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`,
      { from: MON, to: WED, mode: "start", start: 20, perAbsence: 2, absenceCodes: ["absent"] });
    assert.equal(r.status, 200);
    assert.equal(await gradeOf("Attendance", ctx.kai), 18);      // TUE only: the excused Illness is not penalised
    const w = await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`,
      { from: MON, to: WED, mode: "start", start: 20, perAbsence: 2, waiveAbsences: 1 });
    assert.equal(await gradeOf("Attendance", ctx.kai), 18);      // two absences, one waived
  });

  await step("subtract, and add: extra credit that can only lower, or only raise, a grade", async () => {
    await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, mode: "subtract", perAbsence: 3, title: "Attendance (penalty)" });
    assert.equal(await gradeOf("Attendance (penalty)", ctx.kai), -6);
    await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, mode: "add", perPresent: 2, title: "Attendance (credit)" });
    assert.equal(await gradeOf("Attendance (credit)", ctx.kai), 2);   // one day present (MON)
  });

  await step("a teacher of another course, or a student, cannot grade this course's attendance; bad rules are refused", async () => {
    refused(await other.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, start: 10 }), 403);
    refused(await kid.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, start: 10 }), 403);
    refused(await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: WED, to: MON, start: 10 }), 400);
    refused(await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, start: 10, perAbsence: -2 }), 400);
    refused(await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, start: 10, absenceCodes: ["nonsense"] }), 400);
    refused(await teacher.try("POST", `/courses/${ctx.bio.id}/attendance-grade`, { from: MON, to: WED, mode: "percent" }), 400);
  });

  await step("the school's own settings are put back", async () => {
    const s = (await admin.put("/attendance/settings", { online: ctx.was.online, closed: ctx.was.closed, lockDays: ctx.was.lockDays })).settings;
    assert.deepEqual([s.online, s.closed, s.lockDays], [ctx.was.online, ctx.was.closed, ctx.was.lockDays]);
    // Codes can be retired, never removed: the proof's own is left retired for the next run to reuse.
    assert.equal(s.codes.find((c) => c.key === KEY).retired, true);
  });
  console.log(`\n${n} steps passed.`);
} catch {
  console.log(`\n${n} steps passed before the first failure.`);
}
