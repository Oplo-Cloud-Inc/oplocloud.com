// The schedule over HTTP, as the people who use it, ending with the refusals:
// courses, sections, bell schedules, the calendar, and what they do to attendance.
// Local only; needs an existing administrator.
//   API=http://localhost:8794/api/v1 CRED=/path/credentials.json node scripts/prove-schedule.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8791/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Sch-" + RUN + "-A1!";
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
const admin = person("admin"), teacher = person("teacher"), kid = person("student"), family = person("family"), dean = person("dean");
const ctx = {};

// Dates well away from anything else: the first Monday of March 2031, and the days after it.
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, k) => iso(new Date(Date.parse(s + "T00:00:00Z") + k * 86400000));
let MON = "2031-03-03";
while (new Date(MON + "T00:00:00Z").getUTCDay() !== 1) MON = addDays(MON, 1);
const TUE = addDays(MON, 1), WED = addDays(MON, 2), THU = addDays(MON, 3), FRI = addDays(MON, 4), SAT = addDays(MON, 5);

// Puts the school back as the proof found it. It also runs after a failed step, so a failure leaves nothing behind.
async function tidy() {
  if (ctx.wasCal) await admin.put("/calendar/pattern", { pattern: ctx.wasCal.pattern, yearStart: ctx.wasCal.yearStart, yearEnd: ctx.wasCal.yearEnd }).catch(() => {});
  if (ctx.wasAda) await admin.put("/attendance/settings", { online: ctx.wasAda.online, closed: ctx.wasAda.closed, fullDayMinutes: ctx.wasAda.fullDayMinutes ?? null, halfDayMinutes: ctx.wasAda.halfDayMinutes ?? null }).catch(() => {});
  for (const k of [ctx.kai, ctx.lee]) if (k) await admin.put(`/course-requests/${k.id}`, { requests: [] }).catch(() => {});
  const schedules = (await admin.get("/bell-schedules").catch(() => ({ schedules: [] }))).schedules;
  for (const x of schedules.filter((s) => s.name.includes(RUN))) await admin.del(`/bell-schedules/${x.id}`).catch(() => {});
  for (const d of ((await admin.get("/schedule/drafts").catch(() => ({ drafts: [] }))).drafts).filter((x) => x.name.includes(RUN))) await admin.del(`/schedule/drafts/${d.id}`).catch(() => {});
  const subs = [ctx.subject, ctx.open, ctx.shut, ctx.fresh].filter(Boolean);
  const mine = ((await admin.get("/sections").catch(() => ({ sections: [] }))).sections).filter((x) => x.status !== "archived" && (x.title.includes(RUN) || subs.some((u) => u.id === x.subjectId)));
  if (mine.length) await admin.post("/sections/archive", { courseIds: mine.map((x) => x.courseId) }).catch(() => {});
  for (const sub of subs) await admin.patch(`/subjects/${sub.id}`, { retired: true }).catch(() => {});
}

try {
  await step("people: a teacher, a dean, a family, two students", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk("Tess Timetable", "teacher", `tess.s${RUN}@s.test`);
    ctx.dean = await mk("Dee Dean", "dean", `dee.s${RUN}@s.test`);
    ctx.parent = await mk("Pia Parent", "guardian", `pia.s${RUN}@s.test`);
    ctx.kai = await mk("Kai Student", "student", `kai.s${RUN}@s.test`);
    ctx.lee = await mk("Lee Student", "student", `lee.s${RUN}@s.test`);
    for (const [p, a] of [[teacher, ctx.teacher], [dean, ctx.dean], [family, ctx.parent], [kid, ctx.kai]]) await p.login(a.email, PW);
    ctx.wasCal = await admin.get(`/calendar?from=${MON}&to=${SAT}`);
    ctx.wasSchedules = (await admin.get("/bell-schedules")).schedules;
  });

  await step("a bell schedule: periods with times, named; a duplicate name, a bad time and a backwards period are refused", async () => {
    const r = await admin.post("/bell-schedules", { name: "Regular " + RUN, periods: [
      { label: "1", startsAt: "08:00", endsAt: "08:50" }, { label: "2", startsAt: "09:00", endsAt: "09:50" },
      { label: "Lunch", startsAt: "09:50", endsAt: "10:20", kind: "other" }, { label: "3", startsAt: "10:20", endsAt: "11:10" }] });
    ctx.regular = r.schedule;
    assert.deepEqual(r.schedule.periods.map((p) => p.label), ["1", "2", "Lunch", "3"]);
    assert.equal(r.schedule.periods[2].kind, "other");
    refused(await admin.try("POST", "/bell-schedules", { name: "Regular " + RUN }), 409);
    refused(await admin.try("POST", "/bell-schedules", { name: "Bad " + RUN, periods: [{ label: "1", startsAt: "8am" }] }), 400);
    refused(await admin.try("POST", "/bell-schedules", { name: "Back " + RUN, periods: [{ label: "1", startsAt: "09:00", endsAt: "08:00" }] }), 400);
    refused(await admin.try("POST", "/bell-schedules", { name: "Dup " + RUN, periods: [{ label: "1" }, { label: "1" }] }), 400);
  });

  await step("the weekday shortcut makes five schedules: 1 becomes M1, T1, W1, R1, F1 and Lunch stays Lunch", async () => {
    const r = await admin.post(`/bell-schedules/${ctx.regular.id}/weekdays`);
    assert.equal(r.made.length, 5);
    const monday = r.schedules.find((x) => x.id === r.made[0].id);     // the first one made is Monday's
    assert.ok(/Monday$/.test(monday.name), "a Monday schedule was made");
    assert.deepEqual(monday.periods.map((p) => p.label), ["M1", "M2", "Lunch", "M3"]);
    ctx.days = Object.fromEntries(r.made.map((m) => [m.name.replace(/^.* /, ""), m.id]));
    ctx.mondayId = monday.id;
  });

  await step("the calendar runs each weekday's schedule; the weekend is off; a holiday, a staff day and a snow day are not school", async () => {
    let c = await admin.get(`/calendar?from=${MON}&to=${SAT}`);
    const d = Object.fromEntries(c.days.map((x) => [x.day, x]));
    assert.equal(d[MON].kind, "school");
    assert.equal(d[MON].scheduleId, ctx.mondayId);
    assert.deepEqual(d[MON].periods, ["M1", "M2", "M3"]);          // Lunch is not a class period
    assert.notEqual(d[TUE].scheduleId, d[MON].scheduleId);
    assert.equal(d[SAT].kind, "none");
    await admin.put("/calendar/days", { days: [
      { day: TUE, kind: "holiday", label: "Founders Day" }, { day: WED, kind: "staff", label: "Staff development" }, { day: THU, kind: "canceled", label: "Snow" }] });
    c = await admin.get(`/calendar?from=${MON}&to=${SAT}`);
    const e = Object.fromEntries(c.days.map((x) => [x.day, x]));
    assert.deepEqual([e[TUE].kind, e[WED].kind, e[THU].kind], ["holiday", "staff", "canceled"]);
    assert.equal(e[TUE].label, "Founders Day");
  });

  await step("a span of days off, weekends skipped; a Saturday made a school day on a given schedule; clearing puts the pattern back", async () => {
    await admin.put("/calendar/days", { days: [
      { from: WED, to: addDays(MON, 7), kind: "holiday", label: "Break", skipWeekends: true },
      { day: SAT, kind: "school", scheduleId: ctx.regular.id }] });
    let c = await admin.get(`/calendar?from=${MON}&to=${addDays(MON, 8)}`);
    const d = Object.fromEntries(c.days.map((x) => [x.day, x]));
    assert.equal(d[addDays(MON, 6)].kind, "none", "the Sunday inside the span was left alone");
    assert.equal(d[SAT].kind, "school");
    assert.equal(d[SAT].scheduleId, ctx.regular.id);
    await admin.put("/calendar/days", { days: [{ from: TUE, to: addDays(MON, 7), kind: "clear" }, { day: SAT, kind: "clear" }] });
    c = await admin.get(`/calendar?from=${MON}&to=${SAT}`);
    assert.equal(c.days.find((x) => x.day === TUE).kind, "school");
    assert.equal(c.days.find((x) => x.day === SAT).kind, "none");
  });

  await step("a course has a number nobody else uses; titles are short; it can be retired", async () => {
    const r = await admin.post("/subjects", { number: "HIS" + RUN, title: "World History " + RUN, credits: 1, gpa: "honors", duration: "semester", gradReq: "Social Studies" });
    ctx.subject = r.subject;
    assert.equal(r.subject.gpa, "honors");
    refused(await admin.try("POST", "/subjects", { number: "HIS" + RUN, title: "Another" }), 409);
    refused(await admin.try("POST", "/subjects", { number: "X" + RUN, title: "x".repeat(51) }), 400);
    refused(await admin.try("POST", "/subjects", { number: "Y" + RUN, title: "Bad", gpa: "platinum" }), 400);
    const u = await admin.patch(`/subjects/${ctx.subject.id}`, { credits: 0.5, countAttendance: false });
    assert.deepEqual([u.subject.credits, u.subject.countAttendance], [0.5, false]);
    await admin.patch(`/subjects/${ctx.subject.id}`, { countAttendance: true });
  });

  await step("a section: a course, its teacher, its periods and room, a roster; a period no bell schedule has is refused", async () => {
    refused(await admin.try("POST", "/sections", { subjectId: ctx.subject.id, periods: ["99"] }), 400);
    const r = await admin.post("/sections", { subjectId: ctx.subject.id, teacherIds: [ctx.teacher.id], periods: ["M1"], room: "17", capacity: 1 });
    ctx.section = r.section;
    assert.equal(r.section.subjectNumber, "HIS" + RUN);
    assert.deepEqual(r.section.periods, ["M1"]);
    assert.equal(r.section.teachers[0].id, ctx.teacher.id);
    assert.equal(r.section.room, "17");
    assert.equal(r.section.placed, true);
    const second = await admin.post("/sections", { subjectId: ctx.subject.id, teacherIds: [ctx.teacher.id], periods: ["T1"] });
    assert.notEqual(second.section.code, r.section.code, "the second section gets its own code");
    ctx.section2 = second.section;
    const all = await admin.get("/sections");
    assert.ok(all.sections.some((s) => s.courseId === ctx.section.courseId && s.students === 0));
  });

  await step("students are placed by list, or copied from another section; a full section is reported, not refused; dropping", async () => {
    const a = await admin.post(`/sections/${ctx.section.courseId}/students`, { accountIds: [ctx.kai.id, ctx.lee.id] });
    assert.deepEqual([a.added, a.already, a.students, a.over], [2, 0, 2, true]);   // capacity was 1
    const again = await admin.post(`/sections/${ctx.section.courseId}/students`, { accountIds: [ctx.kai.id] });
    assert.deepEqual([again.added, again.already], [0, 1]);
    const copy = await admin.post(`/sections/${ctx.section2.courseId}/students`, { copyFrom: ctx.section.courseId });
    assert.equal(copy.added, 2);
    const mine = await admin.get(`/students/${ctx.kai.id}/sections`);
    assert.equal(mine.sections.length >= 2, true);
    const d = await admin.post(`/sections/${ctx.section2.courseId}/drop`, { accountIds: [ctx.lee.id] });
    assert.deepEqual([d.dropped, d.students], [1, 1]);
    const all = await admin.post(`/sections/${ctx.section2.courseId}/drop`, { all: true });
    assert.equal(all.students, 0);
  });

  await step("a day as a person has it: the section meets on its day's periods and not on another's", async () => {
    const monday = await teacher.get(`/schedule/mine?date=${MON}`);
    const here = monday.items.find((i) => i.courseId === ctx.section.courseId);
    assert.equal(here.meets, true);
    assert.equal(here.room, "17");
    assert.equal(here.startsAt, "08:00");                         // period M1, from the Monday schedule
    const tuesday = await teacher.get(`/schedule/mine?date=${TUE}`);
    assert.equal(tuesday.items.find((i) => i.courseId === ctx.section.courseId).meets, false);   // Tuesday has T1, not M1
    assert.equal(tuesday.items.find((i) => i.courseId === ctx.section2.courseId).meets, true);
    const student = await kid.get(`/schedule/mine?date=${MON}`);
    assert.ok(student.items.some((i) => i.courseId === ctx.section.courseId && i.role === "student"));
    const office = await admin.get(`/schedule/day?date=${MON}`);
    assert.deepEqual(office.periods.map((p) => p.label), ["M1", "M2", "Lunch", "M3"]);
    assert.ok(office.periods[0].sections.some((s) => s.courseId === ctx.section.courseId));
    assert.deepEqual(office.periods[2].sections, []);
  });

  await step("attendance follows the calendar: a register on a holiday is flagged, and the sections' periods come with the review", async () => {
    await admin.put("/calendar/days", { days: [{ day: TUE, kind: "holiday", label: "Founders Day" }] });
    await dean.put("/attendance", { day: TUE, courseId: ctx.section.courseId, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    const r = await admin.get(`/attendance/review?from=${MON}&to=${FRI}`);
    assert.ok(r.closed.some((c) => c.day === TUE && c.label === "Founders Day"));
    const flag = r.problems.find((p) => p.kind === "no-school" && p.accountId === ctx.kai.id && p.day === TUE);
    assert.equal(flag.reason, "Founders Day");
    assert.deepEqual(r.sections[ctx.section.courseId], ["M1"]);
    assert.deepEqual(r.calendar.find((d) => d.day === MON).periods, ["M1", "M2", "M3"]);
    await admin.put("/calendar/days", { days: [{ day: TUE, kind: "clear" }] });
  });

  await step("anyone signed in reads the bell schedules and the calendar; only the school sets them", async () => {
    for (const who of [teacher, kid, family]) {
      assert.ok((await who.get("/bell-schedules")).schedules.length >= 1);
      assert.ok((await who.get(`/calendar?from=${MON}&to=${FRI}`)).days.length === 5);
    }
    for (const who of [teacher, kid, family]) {
      refused(await who.try("POST", "/bell-schedules", { name: "Mine " + RUN }), 403);
      refused(await who.try("PUT", "/calendar/days", { days: [{ day: MON, kind: "holiday" }] }), 403);
      refused(await who.try("PUT", "/calendar/pattern", { pattern: {} }), 403);
      refused(await who.try("POST", "/subjects", { number: "Z" + RUN, title: "Z" }), 403);
      refused(await who.try("POST", "/sections", { subjectId: ctx.subject.id }), 403);
      refused(await who.try("PUT", `/sections/${ctx.section.courseId}`, { room: "1" }), 403);
    }
    refused(await dean.try("POST", "/subjects", { number: "D" + RUN, title: "D" }), 403);       // a dean runs discipline, not the schedule
  });

  await step("the whole school's sections are the school's to read; a teacher places their own students; a stranger cannot", async () => {
    refused(await teacher.try("GET", "/sections"), 403);
    refused(await kid.try("GET", "/sections"), 403);
    const ok = await teacher.try("POST", `/sections/${ctx.section.courseId}/students`, { accountIds: [ctx.kai.id] });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    refused(await kid.try("POST", `/sections/${ctx.section.courseId}/students`, { accountIds: [ctx.kai.id] }), 403);
    refused(await kid.try("GET", `/students/${ctx.lee.id}/sections`), 403);
  });

  // ---- a family reads their child's day
  await step("a family reads their child's day, a stranger cannot, and an archived course is not in it", async () => {
    await admin.post("/students/" + ctx.kai.id + "/guardians", { guardianId: ctx.parent.id, relationship: "parent" }).catch(() => {});
    const r = await family.get(`/schedule/mine?date=${MON}&accountId=${ctx.kai.id}`);
    assert.ok(r.items.some((i) => i.courseId === ctx.section.courseId && i.role === "student"));
    refused(await family.try("GET", `/schedule/mine?date=${MON}&accountId=${ctx.lee.id}`), 403);
  });

  // ---- plans: a draft is a copy to plan on, and is not live until it is published
  await step("a plan is a copy of the live schedule, kept apart from it", async () => {
    const before = (await admin.get("/sections")).sections.length;
    const r = await admin.post("/schedule/drafts", { name: "Term " + RUN, kind: "term" });
    ctx.plan = r.draft;
    assert.ok(r.draft.sections >= 2);
    assert.equal((await admin.get("/sections")).sections.length, before, "no live section was added");
    const d = await admin.get(`/schedule/drafts/${ctx.plan.id}?roster=1`);
    ctx.ds = d.sections.find((x) => x.sourceCourseId === ctx.section.courseId);
    assert.ok(ctx.ds, "the plan holds a copy of the live section");
    assert.equal(ctx.ds.students, 2);
    refused(await admin.try("POST", "/schedule/drafts", { name: "Term " + RUN }), 409);
  });

  await step("changing a plan leaves the live schedule alone until it is published", async () => {
    const u = await admin.put(`/schedule/drafts/${ctx.plan.id}/sections/${ctx.ds.id}`, { room: "20", periods: ["M2"], capacity: 30 });
    assert.deepEqual([u.section.room, u.section.periods], ["20", ["M2"]]);
    refused(await admin.try("PUT", `/schedule/drafts/${ctx.plan.id}/sections/${ctx.ds.id}`, { periods: ["nope"] }), 400);
    const live = (await admin.get("/sections")).sections.find((x) => x.courseId === ctx.section.courseId);
    assert.deepEqual([live.room, live.periods], ["17", ["M1"]]);
    const day = await teacher.get(`/schedule/mine?date=${MON}`);
    assert.equal(day.items.find((i) => i.courseId === ctx.section.courseId).room, "17");
  });

  await step("publishing says what it will do, then does exactly that, once", async () => {
    await admin.post(`/schedule/drafts/${ctx.plan.id}/sections/${ctx.ds.id}/students`, { drop: [ctx.lee.id] });
    const fresh = await admin.post("/subjects", { number: "NEW" + RUN, title: "Studio " + RUN, credits: 1 });
    const add = await admin.post(`/schedule/drafts/${ctx.plan.id}/sections`, { subjectId: fresh.subject.id, periods: ["M3"], teachers: [{ id: ctx.teacher.id }], room: "S1" });
    ctx.fresh = fresh.subject;
    const pre = await admin.get(`/schedule/drafts/${ctx.plan.id}/publish`);
    const upd = pre.sections.find((x) => x.courseId === ctx.section.courseId);
    assert.equal(upd.action, "update");
    assert.deepEqual([upd.dropStudents, upd.addStudents], [1, 0]);
    assert.ok(upd.changes.some((c) => /room 17 → 20/.test(c)));
    assert.ok(pre.sections.some((x) => x.action === "new" && x.title === "Studio " + RUN));
    // the preview changed nothing
    assert.equal((await admin.get("/sections")).sections.find((x) => x.courseId === ctx.section.courseId).room, "17");
    const done = await admin.post(`/schedule/drafts/${ctx.plan.id}/publish`);
    assert.equal(done.totals.updated >= 1, true);
    const live = (await admin.get("/sections")).sections;
    const sec = live.find((x) => x.courseId === ctx.section.courseId);
    assert.deepEqual([sec.room, sec.periods, sec.capacity, sec.students], ["20", ["M2"], 30, 1]);
    const made = live.find((x) => x.title === "Studio " + RUN);
    assert.deepEqual([made.periods, made.room, made.teachers.length], [["M3"], "S1", 1]);
    refused(await admin.try("POST", `/schedule/drafts/${ctx.plan.id}/publish`), 409);
    ctx.studio = made;
  });

  await step("a year plan makes next year's sections and puts this year's away, without the rosters", async () => {
    const r = await admin.post("/schedule/drafts", { name: "Year " + RUN, kind: "year", rosters: false });
    ctx.year = r.draft;
    const d = await admin.get(`/schedule/drafts/${ctx.year.id}`);
    const mine = d.sections.find((x) => x.sourceCourseId === ctx.section.courseId);
    assert.equal(mine.students, 0);
    // A year plan starts as a copy of everything live; this one rolls only the proof's own section, so the school's real ones stay.
    for (const x of d.sections) if (x.id !== mine.id) await admin.del(`/schedule/drafts/${ctx.year.id}/sections/${x.id}`);
    await admin.put(`/schedule/drafts/${ctx.year.id}/sections/${mine.id}`, { room: "31" });
    const done = await admin.post(`/schedule/drafts/${ctx.year.id}/publish`);
    assert.ok(done.totals.archived >= 1);
    const live = (await admin.get("/sections")).sections;
    assert.equal(live.find((x) => x.courseId === ctx.section.courseId).status, "archived");
    const next = live.find((x) => x.status === "published" && x.room === "31" && x.subjectId === ctx.subject.id);
    assert.ok(next, "next year's section is live");
    assert.deepEqual([next.students, next.periods], [0, ["M2"]]);
    ctx.next = next;
    // Put away means out of everyone's daily lists, with the record kept.
    const has = (r) => r.courses.some((c) => c.id === ctx.section.courseId);
    assert.equal(has(await teacher.get("/courses")), false, "not in the teacher's list");
    assert.equal(has(await admin.get("/courses?mine=false")), false, "not in the school's list");
    assert.equal(has(await admin.get("/courses?mine=false&archived=1")), true, "still there when asked for");
    assert.equal((await admin.get(`/students/${ctx.kai.id}/sections`)).sections.some((x) => x.courseId === ctx.section.courseId), false, "not among the student's sections");
    const seen = (r) => r.courses.some((c) => c.courseId === ctx.section.courseId);
    assert.equal(seen((await kid.get(`/students/${ctx.kai.id}/report`)).report), false, "not in this year's report");
    assert.equal(seen((await admin.get(`/students/${ctx.kai.id}/report?archived=1`)).report), true, "still in it when asked for");
    assert.equal((await kid.get("/coursework")).work.some((w) => w.courseId === ctx.section.courseId), false, "no work to act on in it");
  });

  // ---- what students ask for, and what the school can seat
  await step("a family may ask only for courses students may request; the office may require one", async () => {
    const open = await admin.post("/subjects", { number: "OPN" + RUN, title: "Open " + RUN, requestable: true, capacity: 1 });
    const shut = await admin.post("/subjects", { number: "SHT" + RUN, title: "Shut " + RUN });
    ctx.open = open.subject; ctx.shut = shut.subject;
    const ok = await family.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }] });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    refused(await family.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.shut.id, rank: 1 }] }), 403);
    refused(await family.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 0 }] }), 403);
    refused(await family.try("PUT", `/course-requests/${ctx.lee.id}`, { requests: [] }), 403);
    refused(await kid.try("PUT", `/course-requests/${ctx.lee.id}`, { requests: [] }), 403);
    assert.equal((await dean.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }, { subjectId: ctx.shut.id, rank: 0 }] })).status, 200);
    await admin.put(`/course-requests/${ctx.lee.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }] });
    const mine = await kid.get(`/course-requests?accountId=${ctx.kai.id}`);
    assert.deepEqual(mine.requests.map((r) => r.rank).sort(), [0, 1]);
    // The student saves their own choices again: what the office requires is kept, not wiped.
    assert.equal((await kid.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 2 }] })).status, 200);
    const again = await kid.get(`/course-requests?accountId=${ctx.kai.id}`);
    assert.deepEqual(again.requests.map((r) => r.rank).sort(), [0, 2]);
    // And a choice for a required course does not make it optional.
    assert.equal((await kid.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }, { subjectId: ctx.shut.id, rank: 1 }] })).status, 403, "shut is not requestable by a student");
    await dean.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }, { subjectId: ctx.shut.id, rank: 0 }] });
    refused(await kid.try("GET", `/course-requests?accountId=${ctx.lee.id}`), 403);
    refused(await teacher.try("GET", `/course-requests?subjectId=${ctx.open.id}`), 403);
    refused(await admin.try("PUT", `/course-requests/${ctx.kai.id}`, { requests: [{ subjectId: ctx.open.id, rank: 1 }, { subjectId: ctx.open.id, rank: 2 }] }), 400);
  });

  await step("the analysis names a course with more asking than seats; the build seats what fits and says why the rest did not", async () => {
    const plan = (await admin.post("/schedule/drafts", { name: "Build " + RUN, kind: "term", rosters: false })).draft;
    ctx.build = plan;
    // Only the proof's own section is offered, so requests the school already holds cannot change what is counted.
    for (const x of (await admin.get(`/schedule/drafts/${plan.id}`)).sections) await admin.del(`/schedule/drafts/${plan.id}/sections/${x.id}`);
    const sec = (await admin.post(`/schedule/drafts/${plan.id}/sections`, { subjectId: ctx.open.id, periods: ["M1"], capacity: 1 })).section;
    const a = await admin.get(`/schedule/analyze?draft=${plan.id}`);
    const row = a.courses.find((c) => c.subjectId === ctx.open.id);
    assert.deepEqual([row.sections, row.capacity, row.planned, row.flag], [1, 1, 2, "short"]);
    const none = a.courses.find((c) => c.subjectId === ctx.shut.id);
    assert.equal(none.flag, "none", "required by one student and offered nowhere");
    const dry = await admin.post(`/schedule/drafts/${plan.id}/build`, { dry: true });
    assert.equal(dry.applied, false);
    assert.equal((await admin.get(`/schedule/drafts/${plan.id}`)).sections.find((x) => x.id === sec.id).students, 0, "a dry run seats nobody");
    const r = await admin.post(`/schedule/drafts/${plan.id}/build`, {});
    assert.equal(r.applied, true);
    assert.equal(r.placed, 1);
    assert.equal(r.unplaced.filter((u) => u.subjectId === ctx.open.id).length, 1);
    assert.match(r.unplaced.find((u) => u.subjectId === ctx.open.id).reason, /full/);
    assert.match(r.unplaced.find((u) => u.subjectId === ctx.shut.id).reason, /No section/);
    assert.equal((await admin.get(`/schedule/drafts/${plan.id}`)).sections.find((x) => x.id === sec.id).students, 1);
    refused(await teacher.try("POST", `/schedule/drafts/${plan.id}/build`, {}), 403);
    refused(await teacher.try("GET", "/schedule/drafts"), 403);
  });

  await step("a year plan can start with empty rosters and be filled from what students asked for", async () => {
    refused(await admin.try("POST", "/schedule/drafts", { name: "Bad " + RUN, kind: "term", rosters: true, copyRosters: false }), 400);
    const plan = (await admin.post("/schedule/drafts", { name: "Fill " + RUN, kind: "year", rosters: true, copyRosters: false })).draft;
    const d = await admin.get(`/schedule/drafts/${plan.id}`);
    assert.ok(d.sections.every((x) => x.students === 0), "nobody is carried over");
    for (const x of d.sections) await admin.del(`/schedule/drafts/${plan.id}/sections/${x.id}`);
    await admin.post(`/schedule/drafts/${plan.id}/sections`, { subjectId: ctx.open.id, periods: ["M1"], capacity: 5 });
    const r = await admin.post(`/schedule/drafts/${plan.id}/build`, {});
    assert.equal(r.placed, 2, "kai and lee both asked for it");
    const pre = await admin.get(`/schedule/drafts/${plan.id}/publish`);
    assert.deepEqual([pre.totals.created, pre.totals.added], [1, 2]);
    await admin.post(`/schedule/drafts/${plan.id}/publish`);
    const live = (await admin.get("/sections")).sections.find((x) => x.status === "published" && x.subjectId === ctx.open.id);
    assert.equal(live.students, 2);
  });

  // ---- average daily attendance, from the minutes in the periods
  await step("a day is worth what the minutes say: a half for forty, a whole once the school says fifty is a whole", async () => {
    const was = (await admin.get("/attendance/settings")).settings;
    ctx.wasAda = was;
    const set = (full, half) => admin.put("/attendance/settings", { online: was.online, closed: was.closed, fullDayMinutes: full, halfDayMinutes: half });
    refused(await admin.try("PUT", "/attendance/settings", { online: was.online, closed: was.closed, fullDayMinutes: 30, halfDayMinutes: 60 }), 400);
    await set(100, 40);
    const rate = async () => (await admin.get(`/attendance/ada?from=${MON}&to=${MON}`));
    const base = await rate();
    assert.equal(base.byMinutes, true);
    // Kai in section "World History" (M1, 50 minutes on Monday) is present; Lee is not in it (dropped by the plan).
    await dean.put("/attendance", { day: MON, courseId: ctx.section.courseId, marks: [{ accountId: ctx.kai.id, status: "present" }] });
    // That section is archived now, so the proof uses the one that replaced it, and the one the plan made.
    const live = (await admin.get("/sections")).sections;
    const nowSec = live.find((x) => x.courseId === ctx.studio.courseId);
    await admin.post(`/sections/${nowSec.courseId}/students`, { accountIds: [ctx.kai.id] });
    await dean.put("/attendance", { day: MON, courseId: nowSec.courseId, marks: [{ accountId: ctx.kai.id, status: "late" }] });
    const half = await rate();
    // The studio is period M3, 50 minutes, and Kai was late: in the room. Fifty is under a whole day of 100 and over the half of 40.
    assert.equal(+(half.total.present - base.total.present).toFixed(1), 0.5);
    await set(50, 40);
    const whole = await rate();
    assert.equal(+(whole.total.present - base.total.present).toFixed(1), 1);
    const day = whole.days.find((d) => d.day === MON);
    assert.ok(day.enrolled >= 1 && day.ada != null);
    refused(await teacher.try("GET", `/attendance/ada?from=${MON}&to=${MON}`), 403);
    refused(await admin.try("GET", `/attendance/ada?from=2031-01-01&to=2031-12-31`), 400);
    await admin.put("/attendance/settings", { online: was.online, closed: was.closed, fullDayMinutes: was.fullDayMinutes, halfDayMinutes: was.halfDayMinutes });
  });

  await step("a bell schedule in use cannot be deleted; one that is not, can", async () => {
    refused(await admin.try("DELETE", `/bell-schedules/${ctx.mondayId}`), 409);
    const spare = (await admin.post("/bell-schedules", { name: "Spare " + RUN })).schedule;
    assert.equal((await admin.try("DELETE", `/bell-schedules/${spare.id}`)).status, 200);
  });

  await step("the calendar is put back as it was, and the proof's own schedules go", async () => {
    await tidy();
    const left = (await admin.get("/bell-schedules")).schedules.filter((s) => s.name.includes(RUN));
    assert.equal(left.length, 0, "the proof's bell schedules are gone");
  });

  console.log(`\n${n} steps passed.`);
} catch {
  await tidy().catch(() => {});
  console.log(`\n${n} steps passed before the first failure.`);
}
