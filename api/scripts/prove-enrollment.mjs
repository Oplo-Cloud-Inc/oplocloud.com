// Walks the whole enrollment workflow through the public HTTP API, as several
// different people, and ends with the refusals — which are the part that
// matters. Local only: it needs an administrator that already exists.
//
//   API=http://localhost:8791/api/v1 ORIGIN=http://localhost:8199 \
//   CRED=/path/to/credentials.json node scripts/prove-enrollment.mjs
//
// It makes its own courses, accounts and applications, named so a second run
// does not collide with the first.
import fs from "node:fs";
import assert from "node:assert/strict";

const API = process.env.API || "http://localhost:8791/api/v1";
const ORIGIN = process.env.ORIGIN || "http://localhost:8199";
const cred = JSON.parse(fs.readFileSync(process.env.CRED));
const RUN = Date.now().toString(36);

function person(label) {
  const jar = { cookie: "" };
  async function call(method, path, body, raw) {
    const r = await fetch(API + path, {
      method, headers: { "content-type": "application/json", origin: ORIGIN, cookie: jar.cookie },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const sc = r.headers.get("set-cookie");
    if (sc) jar.cookie = sc.split(";")[0];
    const t = await r.text();
    let j = null;
    try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    if (raw) return { status: r.status, body: j };
    if (!r.ok) throw new Error(`${label}: ${method} ${path} -> ${r.status} ${t.slice(0, 300)}`);
    return j;
  }
  return {
    label,
    get: (p) => call("GET", p),
    post: (p, b) => call("POST", p, b ?? {}),
    put: (p, b) => call("PUT", p, b ?? {}),
    patch: (p, b) => call("PATCH", p, b ?? {}),
    try: (m, p, b) => call(m, p, b, true),
    login: (email, password) => call("POST", "/auth/login", { email, password })
  };
}

let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log("  ok  " + name); }
  catch (e) { console.log("  FAIL " + name + "\n       " + String(e.message).split("\n").join("\n       ")); process.exitCode = 1; throw e; }
};
const refused = (r, status, re) => {
  assert.equal(r.status, status, `expected ${status}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
  if (re) assert.match(JSON.stringify(r.body), re);
};
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64").toString("base64");

const admin = person("admin");
const registrar = person("registrar");
const admissions = person("admissions");
const teacher = person("teacher");
const family = person("family");
const student = person("student");

const ctx = {};
// The classes a school admits to are its own: an Indian school's are Nursery to Class XII, an American one's Pre-K to Grade 12.
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const G = (n) => (ctx.IN ? "Class " + ROMAN[n - 1] : "Grade " + n);
const first = "Aarav" + RUN.slice(-3).toUpperCase(), last = "Sharma";
// A birthday that differs from run to run, so what an earlier run left behind
// is not mistaken for the same child.
const bday = (y, k = 0) => `${y}-${String((parseInt(RUN.slice(-3 - k, -k || undefined), 36) % 12) + 1).padStart(2, "0")}-${String((parseInt(RUN.slice(-2), 36) % 28) + 1).padStart(2, "0")}`;
const guardianEmail = `raj.${RUN}@family.test`;
const PW = "Prove-" + RUN + "-A1!";

try {
  await step("an administrator signs in", async () => {
    await admin.login(cred.email, cred.password);
    const me = await admin.get("/me");
    ctx.org = me.account.organizations[0].id;
    ctx.IN = me.account.organizations[0].region === "IN";
  });

  await step("staff accounts: a registrar, an admissions reviewer, a teacher, a family", async () => {
    const make = async (label, role, email) =>
      (await admin.post("/accounts", { email, name: label, password: PW, role, orgId: ctx.org })).account;
    ctx.registrar = await make("Rita Registrar", "registrar", `rita.${RUN}@school.test`);
    ctx.admissions = await make("Adam Admissions", "admissions", `adam.${RUN}@school.test`);
    ctx.teacher = await make("Tess Teacher", "teacher", `tess.${RUN}@school.test`);
    ctx.familyAcct = await make("Raj Sharma", "guardian", guardianEmail);
    await registrar.login(ctx.registrar.email, PW);
    await admissions.login(ctx.admissions.email, PW);
    await teacher.login(ctx.teacher.email, PW);
    await family.login(guardianEmail, PW);
  });

  await step("two courses for placement", async () => {
    ctx.c1 = (await admin.post("/courses", { code: "alg-" + RUN, title: "Algebra I " + RUN, subject: "Mathematics", level: "Grade 6", status: "published", orgId: ctx.org })).course;
    ctx.c2 = (await admin.post("/courses", { code: "sci-" + RUN, title: "Science " + RUN, subject: "Science", level: "Grade 6", status: "published", orgId: ctx.org })).course;
  });

  await step("settings come with sensible defaults, no identity number required", async () => {
    const s = (await admin.get("/enrollment/settings")).settings;
    assert.equal(s.grades.length, ctx.IN ? 15 : 14);
    assert.ok(s.documents.length >= 5);
    assert.ok(!s.documents.some((d) => d.sensitive), "nothing restricted is asked for until the school adds it");
    // A re-run starts from open seats, whatever the last run left behind.
    ctx.settings = (await admin.put("/enrollment/settings", {
      settings: { ...s, requireAcceptance: false, grades: s.grades.map((g) => ({ ...g, seats: null })) } })).settings;
    ctx.year = s.currentYear;
    ctx.aDob = bday(2014, 0);
  });

  await step("a teacher is refused enrollment altogether", async () => {
    refused(await teacher.try("GET", "/applications"), 403);
    refused(await teacher.try("GET", "/enrollment/summary"), 403);
  });

  await step("before making anybody, ask whether they are already here", async () => {
    const r = await admin.get(`/enrollment/lookup?first=${first}&last=${last}&dob=${ctx.aDob}`);
    assert.equal(r.matches.length, 0);
  });

  await step("start an application: a draft that says exactly what is missing", async () => {
    const r = await admin.post("/applications", {
      clientKey: "k1-" + RUN, grade: G(6), type: "transfer", student: { legalFirst: first, legalLast: last }
    });
    ctx.app = r.application;
    assert.equal(ctx.app.status, "draft");
    assert.match(ctx.app.number, /^ENR-\d{4}$/);
    const missing = ctx.app.evaluation.fields.missing.map((m) => m.key);
    for (const k of ["student.dob", "guardians", "contact.address", "previous.school", "consent", "intendedStart"]) assert.ok(missing.includes(k), k);
    assert.equal(ctx.app.documents.filter((d) => d.required).length, 5, "a transfer carries five required documents");
  });

  await step("the same create, sent again, is the same application", async () => {
    const r = await admin.post("/applications", {
      clientKey: "k1-" + RUN, grade: G(6), type: "transfer", student: { legalFirst: first, legalLast: last }
    });
    assert.equal(r.application.id, ctx.app.id);
    assert.equal(r.existing, true);
  });

  await step("submitting an incomplete draft is refused, with the reasons", async () => {
    const r = await admin.try("POST", `/applications/${ctx.app.id}/actions/submit`, {});
    refused(r, 409);
    assert.ok(r.body.error.blockers.length >= 5);
  });

  await step("fill it in: guardian, address, previous school, joining date, consent", async () => {
    const r = await admin.patch(`/applications/${ctx.app.id}`, {
      ifUpdatedAt: ctx.app.updatedAt,
      student: { dob: ctx.aDob, preferredName: "Aru" },
      intendedStart: "2026-11-02",
      consent: true,
      form: {
        student: { gender: "Male" },
        guardians: [{ name: "Raj Sharma", relationship: "Father", phone: "+91 98765 43210", email: guardianEmail, primary: true }],
        contact: { address: "12 Park Road, Pune", pin: "411001", phone: "+91 98765 43210" },
        previous: { school: "St Mary's School", location: "Pune", lastGrade: "Grade 5", tcNumber: "TC/2026/118" },
        emergency: { name: "Asha Sharma", relationship: "Mother", phone: "+91 98765 11111" },
        support: { notes: "Mild dyslexia; extra reading time." }
      }
    });
    ctx.app = r.application;
    assert.equal(ctx.app.evaluation.gates.submit.length, 0);
    assert.ok(ctx.app.evaluation.percent > 50);
    assert.equal(ctx.app.form.support.notes.startsWith("Mild"), true, "an administrator reads the restricted note");
  });

  await step("editing a stale copy is refused instead of overwriting somebody", async () => {
    const r = await admin.try("PATCH", `/applications/${ctx.app.id}`, { ifUpdatedAt: 1, student: { preferredName: "Nope" } });
    refused(r, 409, /changed this application/);
  });

  await step("submit: waits as incomplete until the paperwork is in", async () => {
    ctx.app = (await admin.post(`/applications/${ctx.app.id}/actions/submit`)).application;
    assert.equal(ctx.app.status, "incomplete");
    assert.equal(ctx.app.evaluation.next.kind, "fix");
  });

  await step("a file is not a verification: attaching only marks it received", async () => {
    for (const key of ["birth_proof", "photo", "address_proof", "previous_report", "transfer_cert"]) {
      const r = await admin.post(`/applications/${ctx.app.id}/documents/${key}/file`, { name: key + ".png", type: "image/png", data: png });
      ctx.app = r.application;
      const d = ctx.app.documents.find((x) => x.key === key);
      assert.equal(d.status, "received");
    }
    assert.equal(ctx.app.status, "submitted", "the last document moved it on by itself");
  });

  await step("an oversize or non-document file is refused", async () => {
    const big = Buffer.alloc(800 * 1024, 1).toString("base64");
    refused(await admin.try("POST", `/applications/${ctx.app.id}/documents/photo/file`, { name: "big.png", type: "image/png", data: big }), 400, /KB/);
    refused(await admin.try("POST", `/applications/${ctx.app.id}/documents/photo/file`, { name: "x.exe", type: "application/x-msdownload", data: png }), 400);
  });

  await step("an admissions reviewer cannot verify papers or enroll — only decide", async () => {
    refused(await admissions.try("POST", `/applications/${ctx.app.id}/actions/start_review`), 403);
    refused(await admissions.try("PUT", `/applications/${ctx.app.id}/documents/photo`, { status: "verified" }), 403);
  });

  await step("the registrar starts the review (and is the assignee)", async () => {
    ctx.app = (await registrar.post(`/applications/${ctx.app.id}/actions/start_review`)).application;
    assert.equal(ctx.app.status, "under_review");
    assert.equal(ctx.app.assignedTo.id, ctx.registrar.id);
  });

  await step("a decision is blocked until documents are verified and checks are done", async () => {
    const r = await registrar.try("POST", `/applications/${ctx.app.id}/actions/mark_ready`);
    refused(r, 409);
    assert.ok(r.body.error.blockers.some((b) => b.code === "doc_unverified"));
  });

  await step("a document with something wrong is returned with a reason, and the family sees it", async () => {
    refused(await registrar.try("PUT", `/applications/${ctx.app.id}/documents/photo`, { status: "returned" }), 400, /what is wrong/);
    ctx.app = (await registrar.put(`/applications/${ctx.app.id}/documents/photo`, { status: "returned", note: "Photo is too dark" })).application;
    assert.equal(ctx.app.documents.find((d) => d.key === "photo").status, "returned");
    // A returned document sends the application back to waiting on paperwork
    const r = await registrar.post(`/applications/${ctx.app.id}/documents/photo/file`, { name: "photo2.png", type: "image/png", data: png });
    ctx.app = r.application;
    assert.equal(ctx.app.documents.find((d) => d.key === "photo").status, "received");
  });

  await step("verify every document; sensitive support notes stay out of the registrar's view", async () => {
    for (const d of ctx.app.documents.filter((x) => x.required)) {
      ctx.app = (await registrar.put(`/applications/${ctx.app.id}/documents/${d.key}`, { status: "verified" })).application;
    }
    assert.ok(ctx.app.documents.filter((d) => d.required).every((d) => d.status === "verified"));
    assert.equal(ctx.app.form.support, undefined, "a registrar never sees the restricted note");
  });

  await step("complete the checklist and mark it ready for a decision", async () => {
    for (const key of ["identity", "eligibility"]) {
      ctx.app = (await registrar.post(`/applications/${ctx.app.id}/actions/check`, { key, done: true, note: "Seen" })).application;
    }
    ctx.app = (await registrar.post(`/applications/${ctx.app.id}/actions/mark_ready`)).application;
    assert.equal(ctx.app.status, "awaiting_decision");
  });

  await step("a registrar cannot decide; admissions can", async () => {
    refused(await registrar.try("POST", `/applications/${ctx.app.id}/actions/approve`), 403);
    ctx.app = (await admissions.post(`/applications/${ctx.app.id}/actions/approve`, { note: "Welcome" })).application;
    assert.equal(ctx.app.status, "admitted");
    assert.match(ctx.app.student.admissionNo, /^ADM-\d{4}$/);
    assert.equal(ctx.app.enrollmentId, null, "admitted is not enrolled");
  });

  await step("approving twice does not decide twice", async () => {
    const r = await admissions.post(`/applications/${ctx.app.id}/actions/approve`);
    assert.equal(r.application.status, "admitted");
    const events = r.application.events.filter((e) => e.kind === "decision");
    assert.equal(events.length, 1);
  });

  await step("admissions cannot enroll; enrolling needs a sign-in for a new student", async () => {
    refused(await admissions.try("POST", `/applications/${ctx.app.id}/actions/activate`, { startsOn: "2026-11-02" }), 403);
    const r = await registrar.try("POST", `/applications/${ctx.app.id}/actions/activate`, { startsOn: "2026-11-02" });
    refused(r, 409);
    assert.equal(r.body.error.blockers[0].code, "no_identity");
  });

  await step("enroll: the student, the family and the courses follow", async () => {
    const r = await registrar.try("POST", `/applications/${ctx.app.id}/actions/activate`, {
      startsOn: "2026-10-01",
      account: { email: `aarav.${RUN}@school.test`, password: PW },
      courseIds: [ctx.c1.id, ctx.c2.id],
      guardians: [{ index: 0 }]
    });
    refused(r, 201);
    ctx.enrollment = r.body.enrollment;
    ctx.app = r.body.application;
    assert.equal(ctx.enrollment.state, "enrolled");
    assert.equal(ctx.enrollment.status, "active");
    assert.equal(ctx.app.enrollmentId, ctx.enrollment.id);
    assert.equal(ctx.enrollment.placements.filter((p) => p.status === "done").length, 2);
    assert.ok(ctx.enrollment.sync.some((s) => s.key === "family:0"));
  });

  await step("the guardian was already an account, so they are linked, and see their child", async () => {
    const f = await family.get("/family");
    assert.ok(f.students.some((s) => s.name.startsWith(first)));
  });

  await step("the student is on both rosters and the family record says where they are", async () => {
    const members = (await admin.get(`/courses/${ctx.c1.id}/members`)).members;
    assert.ok(members.some((m) => m.name.startsWith(first) && m.role === "student"));
    const sid = ctx.enrollment.studentId;
    const recs = (await admin.get(`/students/${sid}/records`)).sections;
    assert.equal(recs.enrollment.facts.find((f) => f.label === "Grade").value, G(6));
    const card = (await admin.get(`/accounts/${sid}/contact`)).contact;
    assert.equal(card.dateOfBirth, ctx.aDob);
  });

  await step("activating again returns the same enrollment instead of making another", async () => {
    const r = await registrar.post(`/applications/${ctx.app.id}/actions/activate`, { startsOn: "2026-10-01" });
    assert.equal(r.enrollment.id, ctx.enrollment.id);
    assert.equal(r.existing, true);
  });

  await step("an enrolled application is closed to workflow", async () => {
    refused(await admin.try("POST", `/applications/${ctx.app.id}/actions/withdraw`, { reason: "x" }), 409, /enrollment/);
  });

  await step("the history is complete, in order, and says who did what", async () => {
    const ev = (await admin.get(`/applications/${ctx.app.id}`)).application.events;
    const kinds = new Set(ev.map((e) => e.kind));
    for (const k of ["status", "field", "document", "decision", "enrollment", "check"]) assert.ok(kinds.has(k), k);
    assert.ok(ev.every((e) => e.byName), "every line names who did it");
    assert.ok(ev[0].at >= ev[ev.length - 1].at);
  });

  await step("a second application for the same person is flagged, and settling it links them", async () => {
    const r = await admin.post("/applications", { grade: G(7), type: "new", student: { legalFirst: first, legalLast: last, dob: ctx.aDob } });
    ctx.dup = r.application;
    const exact = ctx.dup.duplicates.filter((d) => d.strength === "exact");
    assert.ok(exact.length >= 1, "an exact match is shown");
    assert.ok(ctx.dup.evaluation.gates.decision.some((b) => b.code === "duplicate_open"));
  });

  await step("the same-person answer on an enrolled student refuses a second year at once", async () => {
    const d = ctx.dup.duplicates.find((x) => x.kind === "student");
    assert.ok(d, "the enrolled student is a candidate");
    const r = await admin.try("POST", `/applications/${ctx.dup.id}/actions/resolve_duplicate`, { key: d.key, resolution: "same" });
    refused(r, 409, /already enrolled/);
  });

  await step("a rejection needs a reason and leaves no student behind", async () => {
    const r2 = await admin.post("/applications", { grade: G(4), type: "new", student: { legalFirst: "Nia" + RUN.slice(-2), legalLast: "Rao", dob: bday(2017, 1) } });
    const id = r2.application.id;
    refused(await admin.try("POST", `/applications/${id}/actions/reject`, { reason: "ineligible" }), 409, /draft/);
    await admin.patch(`/applications/${id}`, { intendedStart: "2026-11-02", consent: true, form: {
      student: { gender: "Female" }, guardians: [{ name: "Priya Rao", phone: "9000000001", email: `priya.${RUN}@family.test` }], contact: { address: "4 Lake Rd", pin: "411001" } } });
    await admin.post(`/applications/${id}/actions/submit`);
    for (const key of ["birth_proof", "photo", "address_proof"]) await admin.post(`/applications/${id}/documents/${key}/file`, { name: key + ".png", type: "image/png", data: png });
    await admin.post(`/applications/${id}/actions/start_review`);
    refused(await admissions.try("POST", `/applications/${id}/actions/reject`, { reason: "nonsense" }), 400);
    const out = await admissions.post(`/applications/${id}/actions/reject`, { reason: "ineligible", note: "Below the minimum age" });
    assert.equal(out.application.status, "rejected");
    assert.equal(out.application.enrollmentId, null);
    ctx.rejected = out.application;
  });

  await step("a rejected application can be reopened, with a reason", async () => {
    refused(await admin.try("POST", `/applications/${ctx.rejected.id}/actions/reopen`, {}), 400, /note/);
    const r = await admin.post(`/applications/${ctx.rejected.id}/actions/reopen`, { note: "Appeal granted" });
    assert.ok(["submitted", "incomplete"].includes(r.application.status));
  });

  await step("seats: a full grade is a soft stop that needs a reason", async () => {
    const s = ctx.settings;
    const used = (await admin.get(`/enrollment/summary?year=${ctx.year}`)).grades.find((g) => g.name === G(6)).used;
    ctx.limit = used;                       // every seat is taken
    const grades = s.grades.map((g) => (g.name === G(6) ? { ...g, seats: used } : g));
    await admin.put("/enrollment/settings", { settings: { ...s, grades } });
    // another Grade 6 applicant, taken to awaiting_decision
    const a = (await admin.post("/applications", { grade: G(6), type: "new", student: { legalFirst: "Sana" + RUN.slice(-2), legalLast: "Khan", dob: bday(2014, 2) } })).application;
    await admin.patch(`/applications/${a.id}`, { intendedStart: "2026-11-02", consent: true, form: {
      student: { gender: "Male" }, guardians: [{ name: "Omar Khan", phone: "9000000002" }], contact: { address: "9 Hill St", pin: "411001" } } });
    await admin.post(`/applications/${a.id}/actions/submit`);
    for (const key of ["birth_proof", "photo", "address_proof"]) {
      await admin.post(`/applications/${a.id}/documents/${key}/file`, { name: key + ".png", type: "image/png", data: png });
      await admin.put(`/applications/${a.id}/documents/${key}`, { status: "verified" });
    }
    await admin.post(`/applications/${a.id}/actions/start_review`);
    for (const key of ["identity", "eligibility"]) await admin.post(`/applications/${a.id}/actions/check`, { key, done: true });
    await admin.post(`/applications/${a.id}/actions/mark_ready`);
    const blocked = await admissions.try("POST", `/applications/${a.id}/actions/approve`);
    refused(blocked, 409, /seat/);
    refused(await admissions.try("POST", `/applications/${a.id}/actions/approve`, { override: { seats: "no" } }), 409);
    const ok = await admissions.post(`/applications/${a.id}/actions/approve`, { override: { seats: "Sibling of a current student" } });
    assert.equal(ok.application.status, "admitted");
    assert.equal(ok.application.review.overrides.seats.reason, "Sibling of a current student");
    ctx.second = ok.application;
  });

  await step("a future start: course placement waits, then happens on the day", async () => {
    const a = ctx.second;
    const r = await registrar.post(`/applications/${a.id}/actions/activate`, {
      startsOn: "2027-01-15", account: { email: `sana.${RUN}@school.test`, password: PW }, courseIds: [ctx.c1.id] });
    assert.equal(r.enrollment.status, "scheduled");
    assert.equal(r.enrollment.placements[0].status, "scheduled");
    const before = (await admin.get(`/courses/${ctx.c1.id}/members`)).members;
    assert.ok(!before.some((m) => m.id === r.enrollment.studentId), "not on the roster before the day");
    await admin.get("/enrollment/summary?today=2027-01-16");
    const after = (await admin.get(`/courses/${ctx.c1.id}/members`)).members;
    assert.ok(after.some((m) => m.id === r.enrollment.studentId), "on the roster once the day has come");
    ctx.futureEnrollment = r.enrollment;
  });

  await step("withdrawing a student ends the year on a date and can take them off the rosters", async () => {
    const r = await registrar.post(`/enrollments/${ctx.futureEnrollment.id}/actions/withdraw`, {
      reason: "relocated", endsOn: "2027-02-01", removeFromCourses: true });
    assert.equal(r.enrollment.state, "withdrawn");
    const m = (await admin.get(`/courses/${ctx.c1.id}/members`)).members;
    assert.ok(!m.some((x) => x.id === ctx.futureEnrollment.studentId));
    refused(await registrar.try("POST", `/enrollments/${ctx.futureEnrollment.id}/actions/suspend`), 409);
  });

  await step("a withdrawn student can come back: the unique rule only covers live enrollments", async () => {
    const r = await admin.post("/applications", { studentId: ctx.futureEnrollment.studentId, grade: G(6) });
    assert.equal(r.application.type, "returning");
    assert.equal(r.application.student.legalFirst.startsWith("Sana"), true);
  });

  await step("re-enrolment: next year's applications, for the right grade, once", async () => {
    const next = ctx.settings.years.find((y) => y > ctx.year);
    const r = await admin.post("/enrollment/reenrol", { toYear: next });
    assert.ok(r.created.some((c) => c.grade === G(7)), JSON.stringify(r));
    const again = await admin.post("/enrollment/reenrol", { toYear: next });
    assert.equal(again.created.length, 0, "run twice, made once");
    assert.ok(again.skipped.every((s) => s.why));
  });

  await step("a family applies for its own child, sees status and corrections, never review notes", async () => {
    const r = await family.post("/applications", { clientKey: "fam-" + RUN, grade: G(2), type: "new",
      student: { legalFirst: "Rohan" + RUN.slice(-2), legalLast: "Sharma", dob: bday(ctx.IN ? 2018 : 2019, 4) } });
    ctx.fam = r.application;
    assert.equal(ctx.fam.source, "family");
    assert.equal(ctx.fam.review, undefined);
    assert.equal(ctx.fam.duplicates, undefined);
    assert.equal(ctx.fam.can.family, true);
  });

  await step("a family cannot do staff things, or see anyone else's application", async () => {
    refused(await family.try("POST", `/applications/${ctx.fam.id}/actions/start_review`), 403);
    refused(await family.try("POST", `/applications/${ctx.fam.id}/actions/approve`), 403);
    refused(await family.try("GET", `/applications/${ctx.rejected.id}`), 404);   // somebody else's child
    refused(await family.try("GET", "/applications"), 403);
    // Their own child's application, they may read — as a family, not as staff.
    const own = (await family.get(`/applications/${ctx.app.id}`)).application;
    assert.equal(own.review, undefined); assert.equal(own.duplicates, undefined);
    assert.equal(own.form.support.notes.startsWith("Mild"), true, "what the family wrote is theirs to read");
    refused(await family.try("PUT", "/enrollment/settings", { settings: {} }), 403);
    const mine = await family.get("/family/applications");
    assert.ok(mine.applications.some((a) => a.id === ctx.fam.id));
    assert.ok(!mine.applications.some((a) => a.id === ctx.rejected.id));
  });

  await step("a family can fill in and submit its draft, and then it is the school's", async () => {
    await family.patch(`/applications/${ctx.fam.id}`, { intendedStart: "2026-11-02", consent: true,
      form: { student: { gender: "Male" }, guardians: [{ name: "Raj Sharma", phone: "9876543210", email: guardianEmail }], contact: { address: "12 Park Road", pin: "411001" } } });
    // The family's brother is already enrolled: a sibling for staff, not a duplicate.
    const staff = (await admin.get(`/applications/${ctx.fam.id}`)).application;
    assert.ok(staff.siblings.length >= 1, "staff are shown the brother already enrolled");
    assert.equal(staff.duplicates.filter((d) => d.strength === "exact").length, 0);
    const s = await family.post(`/applications/${ctx.fam.id}/actions/submit`);
    assert.ok(["submitted", "incomplete"].includes(s.application.status));
    refused(await family.try("PATCH", `/applications/${ctx.fam.id}`, { student: { preferredName: "Ro" } }), 409, /submitted/);
  });

  await step("a request for corrections reaches the family as itemised asks", async () => {
    await registrar.post(`/applications/${ctx.fam.id}/actions/note`, { text: "Parents were difficult on the phone", internal: true });
    const r = await registrar.post(`/applications/${ctx.fam.id}/actions/request_changes`, {
      items: [{ kind: "field", ref: "contact.address", message: "Please give the full postal address with the pin code" }] });
    assert.equal(r.application.status, "changes_requested");
    const mine = (await family.get("/family/applications")).applications.find((a) => a.id === ctx.fam.id);
    assert.equal(mine.corrections.length, 1);
    assert.ok(!JSON.stringify(mine.events).includes("difficult"), "internal notes never reach the family");
    await family.patch(`/applications/${ctx.fam.id}`, { form: { contact: { address: "12 Park Road, Pune 411001", pin: "411001" } } });
    const back = await family.post(`/applications/${ctx.fam.id}/actions/resubmit`);
    assert.ok(["submitted", "incomplete"].includes(back.application.status));
  });

  await step("the queue: views, search, paging and counts agree with each other", async () => {
    const all = await admin.get(`/applications?year=${ctx.year}&view=all&size=100`);
    assert.ok(all.total >= 5);
    assert.equal(all.counts.all, all.total);
    const byName = await admin.get(`/applications?year=${ctx.year}&view=all&q=${first}`);
    assert.equal(byName.items.length >= 1, true);
    const byNumber = await admin.get(`/applications?year=all&view=all&q=${encodeURIComponent(ctx.app.number)}`);
    assert.equal(byNumber.items[0].id, ctx.app.id);
    const byGuardian = await admin.get(`/applications?year=all&view=all&q=${encodeURIComponent(guardianEmail)}`);
    assert.ok(byGuardian.items.some((i) => i.id === ctx.app.id));
    const page = await admin.get(`/applications?year=${ctx.year}&view=all&size=5&page=2`);
    assert.ok(page.items.length <= 5 && page.page === 2);
    const mineView = await registrar.get(`/applications?year=${ctx.year}&view=mine`);
    assert.ok(mineView.items.every((i) => i.assignedTo && i.assignedTo.id === ctx.registrar.id));
  });

  await step("bulk assign changes only what it can, and says which", async () => {
    const q = await admin.get(`/applications?year=${ctx.year}&view=open&size=100`);
    const ids = [q.items[0].id, ctx.app.id];
    const r = await admin.post("/applications/bulk", { ids, action: "assign", to: ctx.registrar.id, dueOn: "2026-12-01" });
    assert.equal(r.results.find((x) => x.id === ctx.app.id).ok, false);
    assert.equal(r.results.find((x) => x.id === q.items[0].id).ok, true);
  });

  await step("the summary adds up", async () => {
    const s = await admin.get(`/enrollment/summary?year=${ctx.year}`);
    assert.equal(s.applications.total, Object.values(s.applications.byStatus).reduce((a, b) => a + b, 0));
    assert.ok(s.enrollments.total >= 2);
    const g6 = s.grades.find((g) => g.name === G(6));
    assert.equal(g6.seats, ctx.limit);
    // The student admitted past the limit was withdrawn above, so the seat is back.
    assert.equal(g6.used, ctx.limit);
  });

  await step("an offer the school wants accepted waits for the family, then can be enrolled", async () => {
    const st = (await admin.get("/enrollment/settings")).settings;
    await admin.put("/enrollment/settings", { settings: { ...st, requireAcceptance: true, offerDays: 10 } });
    const id = ctx.fam.id;
    const cur = (await admin.get(`/applications/${id}`)).application;
    for (const d of cur.documents.filter((x) => x.required)) {
      await admin.post(`/applications/${id}/documents/${d.key}/file`, { name: d.key + ".png", type: "image/png", data: png });
      await admin.put(`/applications/${id}/documents/${d.key}`, { status: "verified" });
    }
    await admin.post(`/applications/${id}/actions/start_review`);
    for (const key of ["identity", "eligibility"]) await admin.post(`/applications/${id}/actions/check`, { key, done: true });
    await admin.post(`/applications/${id}/actions/mark_ready`);
    const out = (await admissions.post(`/applications/${id}/actions/approve`)).application;
    assert.equal(out.status, "admitted");
    assert.equal(out.acceptance, "pending");
    assert.ok(out.offerUntil, "an offer says how long it is valid");
    const blocked = await registrar.try("POST", `/applications/${id}/actions/activate`, {
      startsOn: "2026-10-01", account: { email: `rohan.${RUN}@school.test`, password: PW } });
    refused(blocked, 409);
    assert.equal(blocked.body.error.blockers[0].code, "not_accepted");
    // The family answers; an unrelated family cannot.
    refused(await teacher.try("POST", `/applications/${id}/actions/accept`), 404);
    const ok = (await family.post(`/applications/${id}/actions/accept`)).application;
    assert.equal(ok.acceptance, "accepted");
    const en = await registrar.try("POST", `/applications/${id}/actions/activate`, {
      startsOn: "2026-10-01", account: { email: `rohan.${RUN}@school.test`, password: PW }, courseIds: [ctx.c1.id] });
    refused(en, 201);
    await admin.put("/enrollment/settings", { settings: { ...st, requireAcceptance: false } });
  });

  await step("declining an offer withdraws the application and leaves no student behind", async () => {
    const st = (await admin.get("/enrollment/settings")).settings;
    await admin.put("/enrollment/settings", { settings: { ...st, requireAcceptance: true } });
    const r = await family.post("/applications", { clientKey: "dec-" + RUN, grade: G(3), type: "new",
      student: { legalFirst: "Isha" + RUN.slice(-2), legalLast: "Sharma", dob: bday(2016, 3) } });
    const id = r.application.id;
    await family.patch(`/applications/${id}`, { intendedStart: "2026-11-02", consent: true, form: {
      student: { gender: "Male" }, guardians: [{ name: "Raj Sharma", phone: "9876543210", email: guardianEmail }], contact: { address: "12 Park Road", pin: "411001" } } });
    await family.post(`/applications/${id}/actions/submit`);
    for (const key of ["birth_proof", "photo", "address_proof"]) {
      await admin.post(`/applications/${id}/documents/${key}/file`, { name: key + ".png", type: "image/png", data: png });
      await admin.put(`/applications/${id}/documents/${key}`, { status: "verified" });
    }
    await admin.post(`/applications/${id}/actions/start_review`);
    for (const key of ["identity", "eligibility"]) await admin.post(`/applications/${id}/actions/check`, { key, done: true });
    await admin.post(`/applications/${id}/actions/mark_ready`);
    await admissions.post(`/applications/${id}/actions/approve`);
    const out = (await family.post(`/applications/${id}/actions/decline`)).application;
    assert.equal(out.status, "withdrawn");
    assert.equal(out.acceptance, "declined");
    assert.equal(out.enrollmentId, null);
    await admin.put("/enrollment/settings", { settings: { ...st, requireAcceptance: false } });
  });

  await step("the settings write is the administrator's alone, and a bad one is refused", async () => {
    refused(await registrar.try("PUT", "/enrollment/settings", { settings: ctx.settings }), 403);
    refused(await admin.try("PUT", "/enrollment/settings", { settings: { years: ["nope"] } }), 400);
  });

  console.log(`\n${passed} steps passed`);
} catch (e) {
  console.log(`\nstopped after ${passed} passed steps`);
  process.exitCode = 1;
}
