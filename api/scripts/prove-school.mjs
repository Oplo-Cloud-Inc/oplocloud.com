// The India playbook's school profile over HTTP, as the people who use it. Local only; needs the demo school's administrator.
//   API=http://127.0.0.1:8791/api/v1 ORIGIN=http://127.0.0.1:8130 CRED=/path/credentials.json node scripts/prove-school.mjs
import { person, step, steps, assert, refused, cred, RUN, PW } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), anon = person("anon"), stranger = person("stranger");
const ctx = {};

try {
  await step("an administrator and a teacher of the school", async () => {
    const c = cred();
    await admin.login(c.email, c.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const t = (await admin.post("/accounts", { email: `tia.sp${RUN}@s.test`, name: "Tia Teacher", password: PW, role: "teacher", orgId: ctx.org })).account;
    ctx.teacher = t;
    await teacher.login(t.email, PW);
  });

  await step("/me carries the school's profile, in the country's own terms", async () => {
    const o = (await admin.get("/me")).account.organizations[0];
    assert.equal(o.region, "IN"); assert.equal(o.profile.timezone, "Asia/Kolkata"); assert.equal(o.profile.currency, "INR");
    assert.equal(o.profile.yearStartMonth, 4); assert.equal(o.profile.levelWord, "Class");
  });

  await step("anyone in the school reads the profile and the choices; nobody outside does", async () => {
    const r = await teacher.get("/school/profile");
    assert.equal(r.profile.region, "IN"); assert.ok(r.options.boards.some((b) => b.code === "CBSE")); assert.equal(r.options.states.length, 36);
    refused(await anon.try("GET", "/school/profile"), 401);
  });

  await step("only an administrator changes it", async () => {
    refused(await teacher.try("PUT", "/school/profile", { boards: ["CBSE"] }), 403);
    refused(await anon.try("PUT", "/school/profile", { boards: ["CBSE"] }), 401);
  });

  await step("a campus may follow more than one board, and what is not named stays", async () => {
    const before = (await admin.get("/school/profile")).profile;
    const r = (await admin.put("/school/profile", { boards: ["CBSE", "CISCE", "CBSE"] })).profile;
    assert.deepEqual(r.boards, ["CBSE", "CISCE"]); assert.equal(r.region, "IN"); assert.equal(r.stateCode, before.stateCode); assert.equal(r.set, true);
    ctx.before = before;
  });

  await step("a mistake is named, and changes nothing", async () => {
    for (const [bad, field] of [[{ region: "XX" }, "region"], [{ boards: ["NOPE"] }, "boards"], [{ stateCode: "ZZ" }, "stateCode"], [{ languages: [] }, "languages"],
      [{ timezone: "Mars/Base" }, "timezone"], [{ yearStartMonth: 0 }, "yearStartMonth"]]) {
      const r = await admin.try("PUT", "/school/profile", bad);
      refused(r, 400); assert.equal(r.body.error.field, field);
    }
    assert.deepEqual((await admin.get("/school/profile")).profile.boards, ["CBSE", "CISCE"]);
  });

  await step("the country is changeable, and a clearing falls back to the country's own", async () => {
    const us = (await admin.put("/school/profile", { region: "US" })).profile;
    assert.equal(us.timezone, "America/New_York"); assert.equal(us.levelWord, "Grade");
    const back = (await admin.put("/school/profile", { region: "IN", timezone: "Asia/Dubai" })).profile;
    assert.equal(back.timezone, "Asia/Dubai");
    const cleared = (await admin.put("/school/profile", { timezone: null })).profile;
    assert.equal(cleared.timezone, "Asia/Kolkata");
  });

  await step("restored: the demo school is left as it was found", async () => {
    const b = ctx.before;
    const r = (await admin.put("/school/profile", { boards: b.boards, stateCode: b.stateCode, languages: b.languages })).profile;
    assert.deepEqual(r.boards, b.boards); assert.equal(r.region, "IN");
  });

  /* ------------------------------------------------------------ The section is the roster */
  const kids = {}, SQ = RUN.slice(-2).toUpperCase() + "Q", SR = RUN.slice(-2).toUpperCase() + "R";   // sections of their own, so a re-run starts from nothing
  await step("a section is made, and children are seated in it, a single name among them", async () => {
    const mk = async (name) => (await admin.post("/accounts", { email: `${name.replace(/\W+/g, "").toLowerCase()}.${RUN}@s.test`, name, password: PW, role: "student", orgId: ctx.org })).account;
    for (const n of ["zoya Khan", "Aarav Sharma", "bhavya", "Chandni Kaur"]) kids[n] = await mk(n);   // "bhavya" has one name, as many Indian children do
    assert.equal(kids.bhavya.name, "bhavya"); assert.equal(kids.bhavya.initials.length, 1);
    const c = (await admin.put("/india/classes", { grade: "IX", section: SQ, programme: "CBSE", room: "R-1", capacity: 40 })).class;
    ctx.sec = c;
    const un = (await admin.get("/india/unplaced")).students.map((x) => x.id);
    for (const k of Object.values(kids)) assert.ok(un.includes(k.id), k.name + " is unplaced before being seated");
    const r = await admin.post(`/india/classes/${c.id}/students`, { studentIds: Object.values(kids).map((k) => k.id) });
    assert.equal(r.seated, 4); assert.equal(r.students, 4);
    assert.equal((await admin.post(`/india/classes/${c.id}/students`, { studentIds: [kids.bhavya.id] })).seated, 0, "seating again is a no-op");
  });

  await step("roll numbers are numbered alphabetically, whatever the case, and again on demand", async () => {
    await admin.post(`/india/classes/${ctx.sec.id}/rolls`, { order: "name" });
    const list = (await admin.get(`/india/students?classId=${ctx.sec.id}`)).students;
    assert.deepEqual(list.map((s) => [s.rollNo, s.name]), [[1, "Aarav Sharma"], [2, "bhavya"], [3, "Chandni Kaur"], [4, "zoya Khan"]]);
    await admin.post(`/india/classes/${ctx.sec.id}/rolls`, { order: "name" });
    assert.deepEqual((await admin.get(`/india/students?classId=${ctx.sec.id}`)).students.map((s) => s.rollNo), [1, 2, 3, 4]);
  });

  await step("two children cannot share a roll number; a late arrival takes the next one", async () => {
    const r = await admin.try("PUT", `/students/${kids.bhavya.id}/india`, { rollNo: 1 });
    refused(r, 409); assert.equal(r.body.error.field, "rollNo");
    ctx.late = (await admin.post("/accounts", { email: `late.${RUN}@s.test`, name: "Esha Late", password: PW, role: "student", orgId: ctx.org })).account;
    await admin.post(`/india/classes/${ctx.sec.id}/students`, { studentIds: [ctx.late.id] });
    assert.equal((await admin.get(`/india/students?classId=${ctx.sec.id}`)).students.find((s) => s.id === ctx.late.id).rollNo, 5);
  });

  await step("the family, special needs and migrant status are kept, and gaps are named", async () => {
    const r = await admin.put(`/students/${kids["Aarav Sharma"].id}/india`, { cwsn: "yes", migrant: "no", motherTongue: "Punjabi", guardianName: "Meera Sharma", guardianPhone: "98765 43210",
      guardianRelation: "Aunt", primaryContact: "Guardian", boardRollNo: "B1234567", previousSchool: "Little Flower School" });
    const s = r.student;
    assert.equal(s.cwsn, 1); assert.equal(s.migrant, 0); assert.equal(s.guardianName, "Meera Sharma"); assert.equal(s.guardianPhone, "+91 9876543210");
    assert.ok(r.problems.some((p) => p.field === "disability"), "special needs without a kind is a gap");
    const r2 = await admin.put(`/students/${kids["Aarav Sharma"].id}/india`, { disability: "Low vision", udid: "UDID-0001" });
    assert.ok(!r2.problems.some((p) => p.field === "disability")); assert.equal(r2.student.disability, "Low vision");
    assert.equal(r2.student.guardianName, "Meera Sharma", "what was not named stays");
  });

  await step("moving a child to another section does not carry the old roll number", async () => {
    const other = (await admin.put("/india/classes", { grade: "IX", section: SR })).class;
    ctx.secR = other;
    const r = await admin.put(`/students/${kids.bhavya.id}/india`, { classId: other.id });
    assert.equal(r.student.classId, other.id); assert.equal(r.student.rollNo, null);
    const hist = (await admin.get(`/students/${kids.bhavya.id}/classes`)).classes;
    assert.deepEqual(hist.map((h) => [h.label, h.leftOn ? "left" : "open"]).sort(), [["IX-" + SQ, "left"], ["IX-" + SR, "open"]].sort());
    await admin.put(`/students/${kids.bhavya.id}/india`, { classId: ctx.sec.id, rollNo: 2 });
  });

  await step("the year turns: a section is promoted, old seats are kept as history", async () => {
    const next = (await admin.put("/india/classes", { year: "2027-2028", grade: "X", section: SQ, programme: "CBSE" })).class;
    ctx.next = next;
    const r = await admin.post(`/india/classes/${ctx.sec.id}/promote`, { toClassId: next.id, rolls: "name" });
    assert.equal(r.moved, 5);
    const there = (await admin.get(`/india/students?classId=${next.id}`)).students;
    assert.deepEqual(there.map((s) => [s.rollNo, s.name]), [[1, "Aarav Sharma"], [2, "bhavya"], [3, "Chandni Kaur"], [4, "Esha Late"], [5, "zoya Khan"]]);
    const hist = (await admin.get(`/students/${kids.bhavya.id}/classes`)).classes;
    assert.ok(hist.some((h) => h.label === "IX-" + SQ && h.year === "2026-2027" && h.leftOn), "last year's section is still known");
    assert.ok(hist.some((h) => h.label === "X-" + SQ && h.year === "2027-2028" && !h.leftOn));
    assert.equal((await admin.get(`/india/students?classId=${ctx.sec.id}`)).students.length, 0);
    refused(await admin.try("POST", `/india/classes/${next.id}/promote`, { toClassId: next.id }), 400);
    refused(await admin.try("POST", `/india/classes/${ctx.sec.id}/promote`, { toClassId: ctx.secR.id }), 400);
  });

  await step("a child who leaves is out of the section and out of the unplaced list, and stays on record", async () => {
    const r = await admin.post(`/students/${kids.bhavya.id}/leave`, { on: "15/10/2026", reason: "Moved to another city" });
    assert.equal(r.on, "2026-10-15");
    assert.equal((await admin.get(`/india/students?classId=${ctx.next.id}`)).students.some((s) => s.id === kids.bhavya.id), false);
    assert.equal((await admin.get("/india/unplaced")).students.some((s) => s.id === kids.bhavya.id), false);
    const st = (await admin.get(`/students/${kids.bhavya.id}/india`)).student;
    assert.equal(st.leftOn, "2026-10-15"); assert.equal(st.leftReason, "Moved to another city"); assert.equal(st.classId, null);
    assert.ok((await admin.get(`/students/${kids.bhavya.id}/classes`)).classes.every((h) => h.leftOn), "every seat is closed");
  });

  await step("only the office seats, numbers, promotes or releases children", async () => {
    refused(await teacher.try("POST", `/india/classes/${ctx.next.id}/students`, { studentIds: [kids.bhavya.id] }), 403);
    refused(await teacher.try("POST", `/india/classes/${ctx.next.id}/rolls`, {}), 403);
    refused(await teacher.try("POST", `/india/classes/${ctx.next.id}/promote`, { toClassId: ctx.sec.id }), 403);
    refused(await teacher.try("POST", `/students/${kids.bhavya.id}/leave`, {}), 403);
    refused(await anon.try("GET", "/india/unplaced"), 401);
    refused(await admin.try("POST", `/india/classes/${ctx.next.id}/rolls`, { order: "random" }), 400);
    refused(await admin.try("POST", "/india/classes/cls_nope/rolls", {}), 404);
  });

  /* ------------------------------------------------------------ The class register and the 75% rule */
  const REG = {};
  const isoDay = (n) => new Date(Date.parse(REG.today + "T00:00:00Z") - n * 86400000).toISOString().slice(0, 10);
  const schoolDays = async (n) => {   // the last n school days up to today, newest first
    const out = [];
    for (let i = 0; out.length < n && i < 40; i++) {
      const d = isoDay(i), r = await admin.get(`/register?classId=${REG.cls.id}&day=${d}`);
      if (r.schoolDay.kind === "school") out.push(d);
    }
    return out;
  };

  await step("a class teacher with a section of children, and the codes an Indian school starts with", async () => {
    REG.teacher = ctx.teacher;                                   // Tia, a teacher of the school
    const sec = RUN.slice(-2).toUpperCase() + "T";
    REG.cls = (await admin.put("/india/classes", { grade: "VIII", section: sec, classTeacherId: REG.teacher.id })).class;
    REG.kids = [];
    for (const n of ["Gurleen Kaur", "Harpreet", "Inder Pal", "Jasleen Bedi"]) {
      const a = (await admin.post("/accounts", { email: `${n.replace(/\W+/g, "").toLowerCase()}.rg${RUN}@s.test`, name: n, password: PW, role: "student", orgId: ctx.org })).account;
      REG.kids.push(a);
    }
    await admin.post(`/india/classes/${REG.cls.id}/students`, { studentIds: REG.kids.map((k) => k.id) });
    await admin.post(`/india/classes/${REG.cls.id}/rolls`, { order: "name" });
    const r = await teacher.get(`/register?classId=${REG.cls.id}`);
    REG.today = r.today;
    // A school that never set its own starts from present / absent / late / leave; the demo school has stored the five a US school has. Either way:
    assert.deepEqual(r.codes.slice(0, 3).map((c) => c.key), ["present", "absent", "late"]);
    REG.leave = r.codes.find((c) => c.kind === "excused").key;
    assert.equal(r.students.length, 4); assert.equal(r.taken, false); assert.deepEqual(r.students.map((s) => s.rollNo), [1, 2, 3, 4]);
    assert.ok(r.reasons.some((x) => x.key === "sick"));
  });

  await step("the class teacher takes the register; the family of an absent child is told once", async () => {
    const days = REG.days = await schoolDays(4);
    assert.equal(days.length, 4, "four school days to work with");
    // The oldest of the four days is mostly present; the next three each have the same child away, so the count builds.
    const mark = (d, away) => teacher.put("/register", { classId: REG.cls.id, day: d, marks: REG.kids.map((k, i) => ({ accountId: k.id, status: away[i] === "leave" ? REG.leave : away[i] || "present",
      reason: away[i] === "absent" || away[i] === "leave" ? "sick" : undefined })) });
    const r1 = await mark(days[3], [null, null, null, null]);
    assert.equal(r1.taken, true); assert.equal(r1.marked, 4);
    await mark(days[2], ["absent", null, null, "leave"]);
    await mark(days[1], ["absent", null, "late", "leave"]);
    const r = await mark(days[0], ["absent", null, null, null]);
    assert.equal(r.students[0].status, "absent"); assert.equal(r.students[0].reason, "sick");
    // The absent child's own inbox has one notice for the day, however often the register is saved again.
    const gurleen = person("gurleen"); await gurleen.login(REG.kids[0].email, PW);
    await new Promise((r) => setTimeout(r, 1500));      // the notice is written after the response
    await mark(days[0], ["absent", null, null, null]);
    await new Promise((r) => setTimeout(r, 1500));
    const mine = (await gurleen.get("/inbox")).notices.filter((x) => /Marked absent/.test(x.title));
    assert.equal(mine.length, 3, "one for each of the three days she was away, none repeated: " + mine.map((x) => x.title).join(" | "));
  });

  await step("a teacher cannot take another section's register, a future day, or a day that is not school", async () => {
    refused(await teacher.try("GET", `/register?classId=${ctx.sec.id}`), 403);
    refused(await teacher.try("PUT", "/register", { classId: REG.cls.id, day: "2099-01-01", marks: [{ accountId: REG.kids[0].id, status: "present" }] }), 403);
    // a Sunday
    let sun = REG.today; while (new Date(sun + "T00:00:00Z").getUTCDay() !== 0) sun = new Date(Date.parse(sun + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
    const r = await teacher.try("PUT", "/register", { classId: REG.cls.id, day: sun, marks: [{ accountId: REG.kids[0].id, status: "present" }] });
    refused(r, 400); assert.equal(r.body.error.field, "day");
    refused(await teacher.try("PUT", "/register", { classId: REG.cls.id, day: REG.days[0], marks: [{ accountId: ctx.late.id, status: "present" }] }), 400);
    refused(await teacher.try("PUT", "/register", { classId: REG.cls.id, day: REG.days[0], marks: [{ accountId: REG.kids[0].id, status: "present", reason: "sick" }] }), 400);
    refused(await teacher.try("PUT", "/register", { classId: REG.cls.id, day: REG.days[0], marks: [{ accountId: REG.kids[0].id, status: "teleported" }] }), 400);
  });

  await step("the office sees which registers are in, and a teacher sees only their own section", async () => {
    const all = await admin.get(`/register/classes?day=${REG.days[0]}`);
    const mine = all.classes.find((c) => c.id === REG.cls.id);
    assert.equal(mine.taken, true); assert.equal(mine.marked, 4);
    assert.ok(all.classes.length > 1);
    const t = await teacher.get(`/register/classes?day=${REG.days[0]}`);
    assert.deepEqual(t.classes.map((c) => c.id), [REG.cls.id]);
  });

  await step("the 75% watch counts the days, projects what is left, and names who needs condoning", async () => {
    const w = await admin.get(`/register/watch?classId=${REG.cls.id}&threshold=75`);
    const by = Object.fromEntries(w.students.map((s) => [s.name, s]));
    // Gurleen: present 1 of 4 marked days (25%), absent 3 -> below. Jasleen: present 2, leave 2 -> 50% now, 100% with leave -> condonable. Inder: present 3 late 1 (all counted attended) -> 100%.
    assert.equal(by["Gurleen Kaur"].status, "below"); assert.equal(by["Gurleen Kaur"].attended, 1); assert.equal(by["Gurleen Kaur"].absent, 3);
    assert.equal(by["Jasleen Bedi"].percent, 50); assert.equal(by["Jasleen Bedi"].excused, 2); assert.equal(by["Jasleen Bedi"].condonable, true);
    assert.equal(by["Inder Pal"].percent, 100); assert.equal(by["Harpreet"].percent, 100);
    assert.equal(w.students[0].status, "below", "those below come first");
    assert.ok(w.remaining >= 0); assert.equal(w.threshold, 75);
    assert.equal(w.summary.below + w.summary.watch + w.summary.ok + w.summary.none, 4);
    const strict = await admin.get(`/register/watch?classId=${REG.cls.id}&threshold=100`);
    assert.ok(strict.summary.below >= w.summary.below);
    refused(await teacher.try("GET", `/register/watch?classId=${ctx.sec.id}`), 403);
    const school = await admin.get("/register/watch");
    assert.ok(school.students.length >= 4);
  });

  /* A lock cannot be taken back, so the proof locks a span in the past that only it uses, and any run after the first finds it already locked. */
  const LOCKED = "2026-04-02", LOCK_LABEL = "Board eligibility list (proof)";
  await step("a span reported to a board is locked: the teacher is stopped, the office must say why, and the change is marked", async () => {
    const put = (who, body) => who.try("PUT", "/register", { classId: REG.cls.id, day: LOCKED, ...body });
    // The office takes the day first (a locked day needs a reason; one that is not yet locked ignores it).
    refused(await teacher.try("POST", "/register/locks", { from: LOCKED, to: LOCKED, label: "x" }), 403);
    refused(await admin.try("POST", "/register/locks", { from: "2026-04-03", to: LOCKED, label: "backwards" }), 400);
    refused(await admin.try("POST", "/register/locks", { from: LOCKED, to: "2099-01-01", label: "future" }), 400);
    const first = await put(admin, { why: "Entered by the office for the proof", marks: [{ accountId: REG.kids[0].id, status: "absent" }, { accountId: REG.kids[1].id, status: "present" }] });
    assert.equal(first.status, 200, JSON.stringify(first.body));
    const lk = await admin.try("POST", "/register/locks", { from: "2026-04-01", to: "2026-04-03", label: LOCK_LABEL });
    assert.ok(lk.status === 201 || lk.status === 409, "locked now, or already locked by an earlier run: " + lk.status);
    refused(await put(teacher, { marks: [{ accountId: REG.kids[0].id, status: "present" }] }), 403);
    const noWhy = await put(admin, { marks: [{ accountId: REG.kids[0].id, status: "present" }] });
    refused(noWhy, 400); assert.equal(noWhy.body.error.field, "why");
    const WHY = "Mother's medical certificate reached us late " + RUN;
    const ok = await put(admin, { why: WHY, marks: [{ accountId: REG.kids[0].id, status: "present" }] });
    assert.equal(ok.status, 200); assert.match(ok.body.locked.label, /Board eligibility list/); assert.equal(ok.body.students.find((x) => x.id === REG.kids[0].id).status, "present");
    const edits = (await admin.get("/register/after-lock")).edits.filter((e) => e.accountId === REG.kids[0].id && e.day === LOCKED && e.why === WHY);
    assert.equal(edits.length, 1); assert.equal(edits[0].from, "absent"); assert.equal(edits[0].to, "present"); assert.ok(edits[0].by.length > 0);
    refused(await teacher.try("GET", "/register/after-lock"), 403);
  });

  await step("the school's own history screen shows the edit, and a removal in a locked span needs a reason too", async () => {
    const log = (await admin.get(`/attendance/log?day=${LOCKED}`)).log.filter((l) => l.accountId === REG.kids[0].id);
    assert.ok(log.some((l) => l.afterLock && /certificate reached us late/.test(l.why)));
    const marks = await admin.get(`/attendance?accountId=${REG.kids[1].id}&from=${LOCKED}&to=${LOCKED}`);
    const ids = marks.attendance.filter((m) => !m.courseId).map((m) => m.id);
    assert.equal(ids.length, 1);
    const r = await admin.try("POST", "/attendance/remove", { ids });
    refused(r, 400); assert.equal(r.body.error.field, "why");
    const RWHY = "Entered on the wrong child's row " + RUN;
    assert.equal((await admin.post("/attendance/remove", { ids, why: RWHY })).removed, 1);
    const again = (await admin.get("/register/after-lock")).edits.find((e) => e.accountId === REG.kids[1].id && e.day === LOCKED && e.why === RWHY);
    assert.ok(again && again.to === null, "the removal is in the after-lock history");
  });

  await step("a condonation case is a record the office keeps, tied to the child", async () => {
    const it = await admin.post("/items", { kind: "condonation", title: "Gurleen Kaur: attendance condonation", subjectId: REG.kids[0].id, status: "requested",
      data: { percent: 62, days: 6, reason: "Illness (medical certificate)", documents: "Medical certificate, 6 days" } });
    const w = await admin.get(`/register/watch?classId=${REG.cls.id}`);
    assert.equal(w.students.find((s) => s.id === REG.kids[0].id).case.status, "requested");
    await admin.try("PATCH", `/items/${it.item.id}`, { status: "recommended" }).then((r) => assert.equal(r.status, 200, JSON.stringify(r.body)));
    assert.equal((await admin.get(`/register/watch?classId=${REG.cls.id}`)).students.find((s) => s.id === REG.kids[0].id).case.status, "recommended");
    refused(await teacher.try("POST", "/items", { kind: "condonation", title: "no", subjectId: REG.kids[0].id, data: { reason: "Other" } }), 403);
  });

  /* ------------------------------------------------------------ The class teacher's day */
  await step("the diary: homework goes to the section's families once, however often a phone sends it", async () => {
    const oth = (await admin.post("/accounts", { email: `oth.dy${RUN}@s.test`, name: "Another Teacher", password: PW, role: "teacher", orgId: ctx.org })).account;
    await stranger.login(oth.email, PW);
    REG.par = (await admin.post("/accounts", { email: `par.dy${RUN}@s.test`, name: "Gurleen's Parent", password: PW, role: "guardian", orgId: ctx.org })).account;
    await admin.post(`/students/${REG.kids[0].id}/guardians`, { guardianId: REG.par.id, relationship: "parent" });
    const parent = person("parent"); await parent.login(REG.par.email, PW); REG.parent = parent;
    const key = "k" + RUN, entry = { classId: REG.cls.id, kind: "homework", subject: "Science", body: "Read chapter 5 and answer the questions at the end.", clientKey: key };
    const one = await teacher.try("POST", "/diary", entry); assert.equal(one.status, 201); assert.equal(one.body.again, false);
    const two = await teacher.try("POST", "/diary", entry); assert.equal(two.status, 200); assert.equal(two.body.again, true); assert.equal(two.body.entry.id, one.body.entry.id);
    refused(await stranger.try("POST", "/diary", { classId: REG.cls.id, body: "x" }), 403);
    refused(await teacher.try("POST", "/diary", { classId: REG.cls.id, body: "x", kind: "gossip" }), 400);
    refused(await teacher.try("POST", "/diary", { classId: REG.cls.id, body: "" }), 400);
    const mine = (await parent.get(`/students/${REG.kids[0].id}/diary`)).entries;
    assert.equal(mine.filter((e) => e.body.startsWith("Read chapter 5")).length, 1); assert.equal(mine[0].subject, "Science");
    refused(await parent.try("GET", `/students/${REG.kids[1].id}/diary`), 403);
    assert.equal((await teacher.get(`/diary?classId=${REG.cls.id}`)).entries.length >= 1, true);
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal((await parent.get("/inbox")).notices.filter((n) => /^Homework: Science/.test(n.title)).length, 1, "one notice, not two");
  });

  await step("one word to the families of the section, or of the children named; sent twice it is not repeated", async () => {
    const body = { classId: REG.cls.id, body: "Please send a signed copy of the circular tomorrow.", clientKey: "m" + RUN };
    const a = await teacher.post("/register/message", body);
    assert.equal(a.children, 4); assert.ok(a.reached >= 4 + 1, "the four children and the parent: " + a.reached);
    const b = await teacher.post("/register/message", body); assert.equal(b.reached, 0); assert.equal(b.again, true);
    const one = await teacher.post("/register/message", { classId: REG.cls.id, body: "Your child was unwell at school.", to: [REG.kids[0].id] });
    assert.equal(one.children, 1);
    await new Promise((r) => setTimeout(r, 300));
    const got = (await REG.parent.get("/inbox")).notices.filter((n) => /From the class teacher/.test(n.title));
    assert.equal(got.length, 2, "the parent has the section's word and their own child's");
    refused(await teacher.try("POST", "/register/message", { classId: REG.cls.id, body: "hi", to: [ctx.late.id] }), 400);
    refused(await stranger.try("POST", "/register/message", { classId: REG.cls.id, body: "hi" }), 403);
  });

  await step("how long the day took is kept, replaced if said again, and the school reads the middle and the slow end", async () => {
    refused(await teacher.try("POST", "/register/day", { classId: REG.cls.id, seconds: 99999 }), 400);
    refused(await stranger.try("POST", "/register/day", { classId: REG.cls.id, seconds: 100 }), 403);
    assert.equal((await teacher.post("/register/day", { classId: REG.cls.id, seconds: 700, steps: ["register", "diary", "x"], offline: true })).saved, true);
    await teacher.post("/register/day", { classId: REG.cls.id, seconds: 410, steps: ["register", "diary", "message"] });
    const st = await admin.get("/register/day-stats");
    assert.ok(st.count >= 1 && st.median != null && st.p90 >= st.median && st.under10 >= 0);
    refused(await teacher.try("GET", "/register/day-stats"), 403);
  });
} catch { process.exitCode = 1; }
console.log(`\n${steps()} steps passed.`);
