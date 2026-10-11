// Behavior and health over HTTP, as the people who use them, ending with the
// refusals. Local only; needs an existing administrator.
//   API=http://localhost:8792/api/v1 CRED=/path/credentials.json node scripts/prove-care.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const API = process.env.API || "http://localhost:8791/api/v1";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);
const PW = "Care-" + RUN + "-A1!";
function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, { method, headers: { "content-type": "application/json", origin: "http://localhost:8199", cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get("set-cookie"); if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 250)}`);
    return j;
  }
  return { get: (p) => call("GET", p), post: (p, b) => call("POST", p, b ?? {}), patch: (p, b) => call("PATCH", p, b ?? {}),
           try: (m, p, b) => call(m, p, b, true), login: (e, p) => call("POST", "/auth/login", { email: e, password: p }) };
}
let n = 0;
const step = async (name, fn) => { try { await fn(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; throw e; } };
const refused = (r, s) => assert.equal(r.status, s, `expected ${s}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 160)}`);
const admin = person("admin"), teacher = person("teacher"), other = person("other"), nurse = person("nurse"), dean = person("dean"), family = person("family"), reg = person("registrar");
const ctx = {};
try {
  await step("people: a teacher, another teacher, a nurse, a dean, a registrar, a family, a student", async () => {
    await admin.login(cred.email, cred.password);
    ctx.org = (await admin.get("/me")).account.organizations[0].id;
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.teacher = await mk("Tia Teacher", "teacher", `tia.${RUN}@s.test`);
    ctx.other = await mk("Omar Other", "teacher", `omar.${RUN}@s.test`);
    ctx.nurse = await mk("Nora Nurse", "nurse", `nora.${RUN}@s.test`);
    ctx.dean = await mk("Dan Dean", "dean", `dan.${RUN}@s.test`);
    ctx.reg = await mk("Reg Registrar", "registrar", `reg.${RUN}@s.test`);
    ctx.parent = await mk("Pat Parent", "guardian", `pat.${RUN}@s.test`);
    ctx.kid = await mk("Kai Student", "student", `kai.${RUN}@s.test`);
    for (const [p, a] of [[teacher, ctx.teacher], [other, ctx.other], [nurse, ctx.nurse], [dean, ctx.dean], [reg, ctx.reg], [family, ctx.parent]]) await p.login(a.email, PW);
    await admin.post(`/students/${ctx.kid.id}/guardians`, { guardianId: ctx.parent.id, relationship: "parent" });
    ctx.course = (await admin.post("/courses", { code: "care-" + RUN, title: "Care " + RUN, subject: "Science", status: "published", orgId: ctx.org })).course;
    await admin.post(`/courses/${ctx.course.id}/members`, { accountId: ctx.teacher.id, role: "teacher" });
    await admin.post(`/courses/${ctx.course.id}/members`, { accountId: ctx.kid.id, role: "student" });
  });

  await step("a teacher records an incident for a student they teach; it starts hidden from the family", async () => {
    const r = await teacher.post("/conduct", { studentId: ctx.kid.id, kind: "incident", category: "Tardiness", severity: "minor",
      title: "Late to third period", details: "Ten minutes late, third time this week.", occurredOn: "2026-10-09", followUpOn: "2026-10-12", familySees: true });
    ctx.c = r.entry;
    assert.equal(ctx.c.familySees, false, "a teacher cannot choose what a family sees");
    assert.equal(ctx.c.status, "open");
  });

  await step("a teacher who does not teach the student cannot record one", async () => {
    refused(await other.try("POST", "/conduct", { studentId: ctx.kid.id, kind: "incident", title: "x", occurredOn: "2026-10-09" }), 403);
  });

  await step("the family sees nothing until the school shows it", async () => {
    const r = await family.get(`/conduct?studentId=${ctx.kid.id}`);
    assert.equal(r.entries.length, 0);
    refused(await family.try("GET", `/conduct/${ctx.c.id}`), 404);
    refused(await family.try("GET", "/conduct"), 200);          // no student: only their own entries, which are none
  });

  await step("a teacher reads only what they wrote; the dean reads everything", async () => {
    assert.equal((await teacher.get("/conduct")).entries.length >= 1, true);
    assert.equal((await other.get("/conduct")).entries.length, 0);
    assert.ok((await dean.get("/conduct")).entries.some((e) => e.id === ctx.c.id));
  });

  await step("a teacher cannot settle, show or hide; a dean can", async () => {
    refused(await teacher.try("POST", `/conduct/${ctx.c.id}/actions/show`), 403);
    refused(await teacher.try("POST", `/conduct/${ctx.c.id}/actions/resolve`), 403);
    const shown = (await dean.post(`/conduct/${ctx.c.id}/actions/show`)).entry;
    assert.equal(shown.familySees, true);
  });

  await step("then the family sees it — what happened and what was done, not who wrote it", async () => {
    const r = await family.get(`/conduct?studentId=${ctx.kid.id}`);
    assert.equal(r.entries.length, 1);
    assert.equal(r.entries[0].reporterName, undefined);
    assert.equal(r.entries[0].people, undefined);
    assert.equal(r.family, true);
  });

  await step("follow-ups come due and an entry resolves with the history kept", async () => {
    const s = await dean.get("/conduct/summary?today=2026-10-13");
    assert.ok(s.followUpsDue >= 1 && s.open >= 1);
    await dean.post(`/conduct/${ctx.c.id}/actions/resolve`, { note: "Spoke with the family" });
    const g = await dean.get(`/conduct/${ctx.c.id}`);
    assert.equal(g.entry.status, "resolved");
    assert.deepEqual(g.events.map((e) => e.kind).sort(), ["created", "resolved", "shown"]);
  });

  await step("a student reads none of it", async () => {
    const kid = person("kid"); await kid.login(ctx.kid.email, PW);
    refused(await kid.try("GET", `/conduct?studentId=${ctx.kid.id}`), 403);
  });

  // ---------------------------------------------------------------- health
  await step("the nurse adds a severe allergy with a flag, and an overdue vaccination", async () => {
    ctx.h1 = (await nurse.post("/health-records", { studentId: ctx.kid.id, kind: "allergy", title: "Peanuts", severity: "severe",
      detail: "Anaphylaxis; auto-injector in the office", flag: "Peanut allergy — auto-injector in the office" })).entry;
    ctx.h2 = (await nurse.post("/health-records", { studentId: ctx.kid.id, kind: "immunization", title: "MMR dose 2", onDate: "2025-01-10", dueOn: "2026-09-01" })).entry;
    await nurse.post("/health-records", { studentId: ctx.kid.id, kind: "insurance", title: "Policy 88-1204", detail: "Group plan" });
  });

  await step("the summary reads immunization status from the dates", async () => {
    const s = await nurse.get("/health-records/summary?today=2026-10-11");
    assert.ok(s.immunizationsOverdue >= 1 && s.studentsOverdue >= 1 && s.severeAllergies >= 1 && s.flagged >= 1);
  });

  await step("a teacher is never given the record — only the flag", async () => {
    refused(await teacher.try("GET", `/health-records?studentId=${ctx.kid.id}`), 403);
    refused(await teacher.try("GET", "/health-records"), 403);
    const f = await teacher.get(`/health-records/flags?courseId=${ctx.course.id}`);
    assert.deepEqual(f.flags.map((x) => x.flag), ["Peanut allergy — auto-injector in the office"]);
    assert.equal(JSON.stringify(f).includes("Anaphylaxis"), false, "the reason behind a flag never reaches a teacher");
  });

  await step("a teacher of another course gets no flags; a registrar cannot read the record", async () => {
    refused(await other.try("GET", `/health-records/flags?courseId=${ctx.course.id}`), 403);
    refused(await reg.try("GET", `/health-records?studentId=${ctx.kid.id}`), 403);
    refused(await dean.try("POST", "/health-records", { studentId: ctx.kid.id, kind: "visit", title: "x" }), 403);
  });

  await step("a family reads their own child's record and changes none of it", async () => {
    const r = await family.get(`/health-records?studentId=${ctx.kid.id}`);
    assert.equal(r.family, true);
    assert.ok(r.entries.length >= 3);
    refused(await family.try("PATCH", `/health-records/${ctx.h1.id}`, { title: "x" }), 403);
  });

  await step("resolving keeps the history, and a bad date is refused", async () => {
    await nurse.patch(`/health-records/${ctx.h2.id}`, { status: "resolved" });
    const ev = (await nurse.get(`/health-records/${ctx.h2.id}/history`)).events;
    assert.deepEqual(ev.map((e) => e.kind).sort(), ["created", "resolved"]);
    refused(await nurse.try("POST", "/health-records", { studentId: ctx.kid.id, kind: "visit", title: "x", onDate: "yesterday" }), 400);
  });

  console.log(`\n${n} steps passed`);
} catch { console.log(`\nstopped after ${n} passed steps`); process.exitCode = 1; }
