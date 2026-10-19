// Walks the formal admissions procedure through the public HTTP API, as an administrator, a registrar, an
// admissions officer, a teacher and a family: enquiry → application → assessment → letters → decision →
// class allocation → register and reports — and ends with what each of them is refused.
//
//   API=http://localhost:8797/api/v1 ORIGIN=http://localhost:8133 CRED=/path/ritika.json node scripts/prove-admissions.mjs
//
// Local only. It makes its own people and applications, named so a second run does not collide with the first.
import { person, step, assert, cred, RUN, PW, refused, steps } from "./lib-prove.mjs";

const admin = person("admin"), registrar = person("registrar"), officer = person("admissions"), teacher = person("teacher"), family = person("family");
const ctx = {};
const today = new Date().toISOString().slice(0, 10);
const plus = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const tag = RUN.slice(-4).toUpperCase();
// Birthdays that differ from run to run, so what an earlier run left behind is not taken for the same child.
const dob = (y, k) => `${y}-${String((parseInt(RUN.slice(-3), 36) % 11) + 1).padStart(2, "0")}-${String(((parseInt(RUN.slice(-2), 36) + k * 3) % 27) + 1).padStart(2, "0")}`;
const SECTION = ("Z" + RUN.slice(-2)).toUpperCase().slice(0, 3);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64").toString("base64");
void png;

/* A complete application, as far as the family can take it, and every document verified and every review
   check ticked by the people whose job that is. `to` says how far to take it. */
async function make(label, { grade = "Class VI", year, priority = "", enquiryId = "", email, category = "", by = admin, bornIn = 2014, k = 0, to = "ready" } = {}) {
  const first = `${label}${tag}`, last = "Prover";
  const r = await by.post("/applications", {
    clientKey: `${label}-${RUN}`, grade, schoolYear: year || ctx.year, type: "new", intendedStart: plus(60), assignTo: "me",
    student: { legalFirst: first, legalLast: last, dob: dob(bornIn, k) },
    form: {
      student: { gender: k % 2 ? "Female" : "Male", nationality: "Indian", motherTongue: "Punjabi", bloodGroup: "B+", category },
      admission: { priority, enquiryId, transport: "School bus" },
      guardians: [{ name: "Raj Prover", relationship: "Father", phone: "98765 4" + String(1000 + k * 7).slice(-4) + "0", email: email || `raj.${label.toLowerCase()}.${RUN}@family.test`,
                    primary: true, occupation: "Engineer", qualification: "B.Tech", organisation: "PEC" },
                  { name: "Rita Prover", relationship: "Mother", phone: "98765 5" + String(2000 + k * 7).slice(-4) + "0" }],
      contact: { address: "12 Park Road, Sector 22", pin: "160022", district: "Chandigarh", state: "Chandigarh", whatsapp: "yes", language: "Punjabi" },
      emergency: { name: "Om Prover", relationship: "Uncle", phone: "98765 60000" }
    }
  });
  let a = r.application;
  a = (await by.patch(`/applications/${a.id}`, { ifUpdatedAt: a.updatedAt, consent: true })).application;
  if (to === "draft") return a;
  a = (await by.post(`/applications/${a.id}/actions/submit`)).application;
  if (to === "submitted") return a;
  for (const d of a.documents.filter((x) => x.required)) {
    await by.put(`/applications/${a.id}/documents/${d.key}`, { status: "received" });
    await registrar.put(`/applications/${a.id}/documents/${d.key}`, { status: "verified", sighted: true });
  }
  for (const c of ["identity", "eligibility"]) await registrar.post(`/applications/${a.id}/actions/check`, { key: c, done: true });
  a = (await registrar.post(`/applications/${a.id}/actions/start_review`)).application;
  return a;
}
const get = async (id, who = admin) => (await who.get(`/applications/${id}`)).application;
const kinds = (a, gate) => a.evaluation.gates[gate].map((b) => b.code);

try {
  await step("an administrator signs in and the school is set up for a formal procedure", async () => {
    const c = cred();
    await admin.login(c.email, c.password);
    const me = await admin.get("/me");
    ctx.org = me.account.organizations[0].id;
    const s = (await admin.get("/enrollment/settings")).settings;
    ctx.before = s;                       // put back at the end: a proof leaves the school as it found it
    ctx.year = s.currentYear;
    ctx.settings = (await admin.put("/enrollment/settings", { settings: {
      ...s, requireAcceptance: false, requiredFields: ["student.gender", "contact.pin"],
      grades: s.grades.map((g) => ({ ...g, seats: null, minAge: null })),
      assessments: [{ key: "interaction", label: "Interaction with the child and parents", required: true, types: ["new", "transfer"] },
                    { key: "test", label: "Entrance assessment", required: false, types: ["new", "transfer"] }],
      priorities: [{ key: "sibling", label: "Brother or sister already at the school" }, { key: "staff", label: "Child of a staff member" }],
      calendar: { [s.currentYear]: { opens: plus(-30), closes: plus(30), assessFrom: plus(1), assessTo: plus(20), resultsOn: plus(25), offersBy: plus(35), classesBegin: plus(90) } },
      letters: { code: "SFHS", address: "Sector 26, Chandigarh", contact: "0172-0000000 · admissions@sfhs.example", place: "Chandigarh", signatory: "Ritika Sood", designation: "Vice Principal" },
      decisionDays: 10
    } })).settings;
    assert.equal(ctx.settings.letters.code, "SFHS");
    assert.equal(ctx.settings.assessments.length, 2);
    assert.equal(ctx.settings.decisionDays, 10);
  });

  await step("staff accounts: a registrar, an admissions officer, a teacher, and a family with an account", async () => {
    const mk = async (name, role, email) => (await admin.post("/accounts", { email, name, password: PW, role, orgId: ctx.org })).account;
    ctx.registrar = await mk("Rita Registrar", "registrar", `rita.${RUN}@school.test`);
    ctx.officer = await mk("Adam Admissions", "admissions", `adam.${RUN}@school.test`);
    ctx.teacher = await mk("Tess Teacher", "teacher", `tess.${RUN}@school.test`);
    ctx.famEmail = `raj.fam.${RUN}@family.test`;
    ctx.fam = await mk("Raj Prover", "guardian", ctx.famEmail);
    await registrar.login(ctx.registrar.email, PW); await officer.login(ctx.officer.email, PW);
    await teacher.login(ctx.teacher.email, PW); await family.login(ctx.famEmail, PW);
  });

  await step("what the school publishes is the administrator's to change, and a bad calendar is refused", async () => {
    refused(await registrar.try("PUT", "/enrollment/settings", { settings: ctx.settings }), 403);
    refused(await admin.try("PUT", "/enrollment/settings", { settings: { ...ctx.settings, calendar: { [ctx.year]: { opens: plus(5), closes: plus(1) } } } }), 400);
    refused(await admin.try("PUT", "/enrollment/settings", { settings: { ...ctx.settings, letters: { ...ctx.settings.letters, code: "no spaces" } } }), 400);
    refused(await admin.try("PUT", "/enrollment/settings", { settings: { ...ctx.settings, requiredFields: ["student.eyeColour"] } }), 400);
  });

  /* ---------------------------------------------------------------- Enquiries */
  await step("an enquiry is recorded with a promise to ring back, and the same family asking twice is noticed", async () => {
    const r = await officer.post("/enquiries", { childFirst: "Enq" + tag, childLast: "Prover", guardianName: "Raj Prover", phone: `98765 7${RUN.replace(/\D/g, "0").slice(-4).padStart(4, "0")}0`,
      source: "referral", referredBy: "Mrs Gill", grade: "Class VI", assignTo: "me", note: "Asked about the science labs" });
    ctx.enq = r.enquiry;
    assert.match(ctx.enq.number, /^ENQ-\d{4}$/); assert.equal(ctx.enq.status, "new");
    assert.equal(ctx.enq.followUpOn, plus(2), "a callback two days on, unless the desk says otherwise");
    assert.equal(ctx.enq.assignedTo.id, ctx.officer.id);
    const again = await officer.post("/enquiries", { childFirst: "Enq" + tag, childLast: "Prover", phone: ctx.enq.phone, source: "walk_in" });
    assert.ok(again.matches.some((m) => m.id === ctx.enq.id), "the earlier enquiry is named, not refused");
    refused(await officer.try("POST", "/enquiries", { childFirst: "No contact" }), 400);
    refused(await officer.try("POST", "/enquiries", { childFirst: "Bad", phone: "1", source: "telepathy" }), 400);
  });

  await step("a call, a visit and a closing are lines in the log; closing needs a reason and can be undone", async () => {
    let e = (await officer.post(`/enquiries/${ctx.enq.id}/actions/contacted`, { note: "Spoke to the father", followUpOn: today })).enquiry;
    assert.equal(e.status, "contacted"); assert.equal(e.followUpOn, today);
    assert.ok((await officer.get(`/enquiries?view=follow_up`)).items.some((x) => x.id === ctx.enq.id), "due today shows in the follow-up view");
    e = (await officer.post(`/enquiries/${ctx.enq.id}/actions/visit_booked`, { visitOn: plus(3) })).enquiry;
    assert.equal(e.status, "visit_booked"); assert.ok((await officer.get(`/enquiries?view=visits`)).items.some((x) => x.id === ctx.enq.id));
    refused(await officer.try("POST", `/enquiries/${ctx.enq.id}/actions/close`, {}), 400);
    e = (await officer.post(`/enquiries/${ctx.enq.id}/actions/close`, { reason: "Family moved away" })).enquiry;
    assert.equal(e.status, "not_proceeding"); assert.ok(!e.open);
    refused(await officer.try("POST", `/enquiries/${ctx.enq.id}/actions/visited`, {}), 409);
    e = (await officer.post(`/enquiries/${ctx.enq.id}/actions/reopen`, { note: "They are back" })).enquiry;
    assert.equal(e.status, "contacted");
    const full = (await officer.get(`/enquiries/${ctx.enq.id}`)).enquiry;
    assert.ok(full.log.length >= 5 && full.log.some((l) => l.note === "Family moved away"));
  });

  await step("the enquiry list: views, counts and search agree, and a teacher cannot see it", async () => {
    const r = await officer.get("/enquiries?view=all&q=" + encodeURIComponent("Enq" + tag));
    assert.equal(r.total, 2, "the repeat was recorded as well: it warned, it did not refuse"); assert.equal(r.counts.all >= 2, true);
    assert.ok(r.counts.open >= 1 && r.counts.open <= r.counts.all);
    const bySource = await officer.get("/enquiries?view=all&source=referral");
    assert.ok(bySource.items.every((x) => x.source === "referral"));
    refused(await teacher.try("GET", "/enquiries"), 403); refused(await family.try("GET", "/enquiries"), 403);
    refused(await teacher.try("POST", "/enquiries", { childFirst: "X", phone: "1" }), 403);
  });

  await step("an enquiry becomes an application: it keeps how the family heard of the school, and cannot be converted twice", async () => {
    ctx.A = await make("Alpha", { enquiryId: ctx.enq.id, priority: "sibling", email: ctx.famEmail, category: "OBC", by: officer, to: "draft", k: 1 });
    assert.equal(ctx.A.form.admission.source, "referral"); assert.equal(ctx.A.form.admission.enquiryId, ctx.enq.id);
    const e = (await officer.get(`/enquiries/${ctx.enq.id}`)).enquiry;
    assert.equal(e.status, "applied"); assert.equal(e.applicationId, ctx.A.id); assert.equal(e.application.number, ctx.A.number);
    refused(await officer.try("PATCH", `/enquiries/${ctx.enq.id}`, { note: "late edit" }), 409);
    const other = await make("Beta", { enquiryId: ctx.enq.id, to: "draft", k: 2, by: officer });
    assert.equal(other.form.admission.enquiryId, "", "an enquiry that already became an application is not claimed again");
    ctx.B = other;
  });

  /* ---------------------------------------------------------------- The form */
  await step("the formal form keeps what an Indian school asks, and refuses what no form could have offered", async () => {
    const f = ctx.A.form;
    assert.deepEqual([f.student.nationality, f.student.motherTongue, f.student.bloodGroup, f.student.category], ["Indian", "Punjabi", "B+", "OBC"]);
    assert.deepEqual([f.contact.pin, f.contact.district, f.contact.whatsapp], ["160022", "Chandigarh", "yes"]);
    assert.deepEqual([f.guardians[0].qualification, f.guardians[0].organisation, f.admission.priority], ["B.Tech", "PEC", "sibling"]);
    const bad = (form) => officer.try("PATCH", `/applications/${ctx.A.id}`, { form });
    refused(await bad({ student: { category: "Martian" } }), 400);
    refused(await bad({ student: { bloodGroup: "Z+" } }), 400);
    refused(await bad({ contact: { address: "x", pin: "0123" } }), 400);
    refused(await bad({ contact: { address: "x", pin: "060022" } }), 400);
    refused(await bad({ contact: { address: "x", whatsapp: "maybe" } }), 400);
  });

  await step("saving a few particulars changes only those: what a smaller form never showed is not blanked", async () => {
    // A family's editor knows fewer fields than the office's form; saving its few must leave the rest as they were.
    const a = await officer.patch(`/applications/${ctx.A.id}`, { form: { student: { gender: "Female" }, contact: { address: "12 Park Road, Sector 22, Chandigarh" } } });
    const f = a.application.form;
    assert.deepEqual([f.student.nationality, f.student.motherTongue, f.student.bloodGroup, f.student.category], ["Indian", "Punjabi", "B+", "OBC"]);
    assert.deepEqual([f.contact.pin, f.contact.district, f.contact.whatsapp], ["160022", "Chandigarh", "yes"]);
    assert.equal(f.contact.address, "12 Park Road, Sector 22, Chandigarh", "what was named did change");
    const cleared = await officer.patch(`/applications/${ctx.A.id}`, { form: { student: { category: "" } } });
    assert.equal(cleared.application.form.student.category, "", "a particular can still be cleared on purpose");
    await officer.patch(`/applications/${ctx.A.id}`, { form: { student: { category: "OBC" } } });
  });

  await step("health and support needs are restricted: the administrator reads them, the registrar and admissions officer do not", async () => {
    const a = await admin.patch(`/applications/${ctx.A.id}`, { form: { support: { allergies: "Peanuts", conditions: "Asthma", cwsn: true, disability: "Dyslexia", notes: "Needs extra time" } } });
    assert.equal(a.application.form.support.allergies, "Peanuts");
    for (const who of [registrar, officer]) assert.equal((await get(ctx.A.id, who)).form.support, undefined);
    assert.equal((await get(ctx.A.id)).form.support.disability, "Dyslexia");
  });

  /* ------------------------------------------------- Submission and letters */
  await step("a complete application is submitted; the acknowledgement is available, previewed without being kept, then issued and numbered", async () => {
    let a = (await officer.post(`/applications/${ctx.A.id}/actions/submit`)).application;
    ctx.A = a;
    assert.equal(a.status, "incomplete", "documents are outstanding");
    assert.ok(a.lettersAvailable.some((l) => l.kind === "acknowledgement" && l.permitted));
    assert.ok(a.lettersAvailable.some((l) => l.kind === "deficiency"), "documents are missing, so a deficiency notice applies");
    const pre = (await officer.get(`/applications/${a.id}/letters/preview?kind=acknowledgement`)).letter;
    assert.equal(pre.preview, true); assert.match(pre.refNo, /^SFHS\/ADM\/\d{4}-\d{2}\/\d{4}\/ACK$/);
    assert.equal((await get(a.id)).letters.length, 0, "a preview keeps nothing");
    const issued = (await officer.post(`/applications/${a.id}/letters`, { kind: "acknowledgement", channel: "handed" })).letter;
    assert.equal(issued.refNo, pre.refNo); assert.match(issued.text, /ENR-\d{4}/); assert.match(issued.text, /Birth|birth/);
    assert.equal(issued.body.school.name.length > 0, true);
    assert.equal(issued.body.closing[1], "Ritika Sood");
    const second = (await officer.post(`/applications/${a.id}/letters`, { kind: "acknowledgement" })).letter;
    assert.equal(second.refNo, issued.refNo + "-2", "a second copy has its own number");
    const list = (await get(a.id)).letters;
    assert.equal(list.length, 2); assert.equal(list[0].refNo, second.refNo, "newest first");
    const hist = (await get(a.id)).events.filter((e) => e.kind === "letter");
    assert.equal(hist.length, 2); assert.equal(hist[0].internal, false);
  });

  await step("who may write which letter: papers by the registrar, decisions by the deciders, nobody else", async () => {
    const id = ctx.A.id;
    const need = async (who, kind, status) => refused(await who.try("POST", `/applications/${id}/letters`, { kind }), status);
    await need(officer, "deficiency", 403);                  // checking papers is the registrar's
    const d = (await registrar.post(`/applications/${id}/letters`, { kind: "deficiency", channel: "printed" })).letter;
    assert.match(d.refNo, /\/DEF$/); assert.match(d.text, /Photograph|photograph/); assert.match(d.text, /Proof of/);
    await need(registrar, "offer", 403);                     // an offer says what was decided: the deciders' letter
    await need(officer, "offer", 409);                       // and not admitted yet, so there is nothing to offer
    await need(teacher, "acknowledgement", 404); await need(family, "acknowledgement", 404);
    await need(officer, "no-such-letter", 400);
    refused(await officer.try("PATCH", `/applications/${id}/letters/${d.id}`, { subject: "changed" }), 404);
    refused(await officer.try("DELETE", `/applications/${id}/letters/${d.id}`), 404);
    const read = (await officer.get(`/applications/${id}/letters/${d.id}`)).letter;
    assert.equal(read.subject, d.subject, "a letter reads as it was issued");
  });

  /* ------------------------------------------------------------- Assessment */
  await step("a required assessment stands between the documents and a decision", async () => {
    const id = ctx.A.id;
    for (const d of (await get(id)).documents.filter((x) => x.required)) {
      await officer.put(`/applications/${id}/documents/${d.key}`, { status: "received" });
      await registrar.put(`/applications/${id}/documents/${d.key}`, { status: "verified", sighted: true });
    }
    for (const c of ["identity", "eligibility"]) await registrar.post(`/applications/${id}/actions/check`, { key: c, done: true });
    let a = (await registrar.post(`/applications/${id}/actions/start_review`)).application;
    assert.equal(a.status, "under_review");
    assert.ok(a.evaluation.stages.some((s) => s.key === "assessment"), "the school asks for one, so the stage is drawn");
    assert.deepEqual(kinds(a, "decision"), ["assess_pending"]);
    assert.match(a.evaluation.next.label, /has not been taken/);
    const r = await registrar.try("POST", `/applications/${id}/actions/mark_ready`, {});
    refused(r, 409); assert.equal(r.body.error.blockers[0].code, "assess_pending");
  });

  await step("scheduling: a date, time, venue and panel; the family sees when and where, never the result", async () => {
    const id = ctx.A.id;
    refused(await officer.try("POST", `/applications/${id}/sessions`, { kind: "nonsense", onDate: plus(2) }), 400);
    refused(await officer.try("POST", `/applications/${id}/sessions`, { kind: "interaction", onDate: "soon" }), 400);
    refused(await officer.try("POST", `/applications/${id}/sessions`, { kind: "interaction", onDate: plus(2), atTime: "25:99" }), 400);
    refused(await teacher.try("POST", `/applications/${id}/sessions`, { kind: "interaction", onDate: plus(2) }), 404);
    const r = await officer.post(`/applications/${id}/sessions`, { kind: "interaction", onDate: plus(2), atTime: "09:30", venue: "Principal's office", panel: "Ms Gill, Mr Sandhu" });
    ctx.s1 = r.session;
    assert.deepEqual([ctx.s1.status, ctx.s1.atTime, ctx.s1.venue, ctx.s1.panel], ["scheduled", "09:30", "Principal's office", "Ms Gill, Mr Sandhu"]);
    assert.match(r.application.evaluation.gates.decision[0].label, new RegExp("is set for " + plus(2)));
    assert.ok(r.application.lettersAvailable.some((l) => l.kind === "call"), "a call letter now applies");
    const call = (await officer.post(`/applications/${id}/letters`, { kind: "call" })).letter;
    assert.match(call.text, /Principal's office/); assert.match(call.text, /9:30 am/);
    const day = await officer.get(`/enrollment/sessions?from=${today}&to=${plus(7)}`);
    assert.ok(day.items.some((x) => x.id === ctx.s1.id && x.number === ctx.A.number && x.applicant.startsWith("Alpha")), "the day's list names the child");
    refused(await teacher.try("GET", `/enrollment/sessions`), 403);
  });

  await step("a family reads the date and place of an assessment for its own child, and nothing about how it went", async () => {
    const fa = await make("Fam", { by: family, to: "draft", email: ctx.famEmail, k: 3 });
    ctx.F = fa;
    const submitted = (await family.post(`/applications/${fa.id}/actions/submit`)).application;
    assert.equal(submitted.status, "incomplete");
    const s = (await officer.post(`/applications/${fa.id}/sessions`, { kind: "interaction", onDate: plus(4), atTime: "11:00", venue: "Room 4", panel: "Ms Gill" })).session;
    const seen = (await get(fa.id, family)).sessions[0];
    assert.deepEqual([seen.venue, seen.atTime, seen.onDate], ["Room 4", "11:00", plus(4)]);
    for (const k of ["panel", "score", "result", "remarks", "recordedBy"]) assert.equal(k in seen, false, k + " is the school's");
    await officer.patch(`/applications/${fa.id}/sessions/${s.id}`, { status: "completed", result: "qualified", score: 9, maxScore: 10, remarks: "Confident and curious" });
    const after = (await get(fa.id, family)).sessions[0];
    assert.equal("result" in after, false); assert.equal("remarks" in after, false);
    const staff = (await get(fa.id)).sessions[0];
    assert.deepEqual([staff.result, staff.score, staff.remarks], ["qualified", 9, "Confident and curious"]);
    assert.equal((await get(fa.id, family)).lettersAvailable, undefined, "what the school may send is the school's business");
    // The school wrote to this family: they can read it, in the app, because it was addressed to them.
    const ack = (await officer.post(`/applications/${fa.id}/letters`, { kind: "acknowledgement", channel: "inbox" }));
    assert.ok(ack.letter.delivered >= 1, "delivered to the family's inbox");
    const inbox = await family.get("/inbox");
    assert.ok(inbox.notices.some((n) => n.title === ack.letter.subject), "the family has it in the app");
    const readByFamily = (await family.get(`/applications/${fa.id}/letters/${ack.letter.id}`)).letter;
    assert.equal(readByFamily.refNo, ack.letter.refNo);
    refused(await family.try("GET", `/applications/${ctx.A.id}/letters/${(await get(ctx.A.id)).letters[0].id}`), 404);
  });

  await step("a letter for the app is refused when the family has no account to receive it", async () => {
    const lonely = await make("Lone", { to: "submitted", k: 4, by: officer });
    const r = await officer.try("POST", `/applications/${lonely.id}/letters`, { kind: "acknowledgement", channel: "inbox" });
    refused(r, 409); assert.match(JSON.stringify(r.body), /no account/i);
    assert.equal((await get(lonely.id)).letters.length, 0, "nothing was kept for a letter that could not be delivered");
    ctx.lonely = lonely;
  });

  await step("a session that was missed or called off is not a result; recording one needs a result; moving needs a session still to come", async () => {
    const id = ctx.A.id;
    let r = await officer.patch(`/applications/${id}/sessions/${ctx.s1.id}`, { status: "absent" });
    assert.equal(r.session.status, "absent"); assert.deepEqual(kinds(r.application, "decision"), ["assess_pending"]);
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${ctx.s1.id}`, { onDate: plus(5) }), 409);
    r = await officer.post(`/applications/${id}/sessions`, { kind: "interaction", onDate: plus(3), venue: "Room 2" });
    const s2 = r.session;
    r = await officer.patch(`/applications/${id}/sessions/${s2.id}`, { onDate: plus(4), atTime: "10:15" });
    assert.deepEqual([r.session.onDate, r.session.atTime], [plus(4), "10:15"]);
    r = await officer.patch(`/applications/${id}/sessions/${s2.id}`, { status: "cancelled", reason: "Parent unwell" });
    assert.equal(r.session.status, "cancelled"); assert.equal(kinds(r.application, "decision").length, 1);
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${s2.id}`, { status: "completed", result: "qualified" }), 409);
    r = await officer.post(`/applications/${id}/sessions`, { kind: "interaction", onDate: plus(1), atTime: "09:00", venue: "Room 2" });
    ctx.s3 = r.session;
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${ctx.s3.id}`, { status: "completed" }), 400);
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${ctx.s3.id}`, { status: "completed", result: "brilliant" }), 400);
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${ctx.s3.id}`, { status: "completed", result: "qualified", score: 12, maxScore: 10 }), 400);
    refused(await officer.try("PATCH", `/applications/${id}/sessions/${ctx.s3.id}`, {}), 400);
  });

  await step("recording a result clears the gate: deferred still waits, qualified moves it on", async () => {
    const id = ctx.A.id;
    let r = await officer.patch(`/applications/${id}/sessions/${ctx.s3.id}`, { status: "completed", result: "deferred", remarks: "Let us see her again" });
    assert.deepEqual(kinds(r.application, "decision"), ["assess_deferred"]);
    refused(await registrar.try("POST", `/applications/${id}/actions/mark_ready`, {}), 409);
    r = await officer.patch(`/applications/${id}/sessions/${ctx.s3.id}`, { status: "completed", result: "qualified", score: 8, maxScore: 10, remarks: "Fine" });
    assert.equal(r.application.evaluation.gates.decision.length, 0);
    const a = (await registrar.post(`/applications/${id}/actions/mark_ready`)).application;
    assert.equal(a.status, "awaiting_decision");
    assert.ok((await get(id)).events.filter((e) => e.kind === "session").length >= 6, "every move of a session is on the record");
  });

  await step("not qualifying is for the decision-makers to weigh: it takes a reason to admit, and the reason is kept", async () => {
    const b = ctx.B;
    let a = (await officer.post(`/applications/${b.id}/actions/submit`)).application;
    for (const d of a.documents.filter((x) => x.required)) {
      await officer.put(`/applications/${b.id}/documents/${d.key}`, { status: "received" });
      await registrar.put(`/applications/${b.id}/documents/${d.key}`, { status: "verified", sighted: true });
    }
    for (const c of ["identity", "eligibility"]) await registrar.post(`/applications/${b.id}/actions/check`, { key: c, done: true });
    await registrar.post(`/applications/${b.id}/actions/start_review`);
    const s = (await officer.post(`/applications/${b.id}/sessions`, { kind: "interaction", onDate: plus(1) })).session;
    await officer.patch(`/applications/${b.id}/sessions/${s.id}`, { status: "completed", result: "not_qualified", score: 2, maxScore: 10 });
    a = (await registrar.post(`/applications/${b.id}/actions/mark_ready`)).application;
    assert.equal(a.status, "awaiting_decision", "the result is in, so it can be decided");
    const refusal = await officer.try("POST", `/applications/${b.id}/actions/approve`, {});
    refused(refusal, 409); assert.ok(refusal.body.error.blockers.some((x) => x.code === "assessment_not_met" && x.soft));
    refused(await officer.try("POST", `/applications/${b.id}/actions/approve`, { override: { assessment: "no" } }), 409);
    refused(await registrar.try("POST", `/applications/${b.id}/actions/approve`, { override: { assessment: "The principal asked for it" } }), 403);
    a = (await officer.post(`/applications/${b.id}/actions/approve`, { note: "On the principal's word", override: { assessment: "The principal asked for it" } })).application;
    assert.equal(a.status, "admitted"); assert.equal(a.review.overrides.assessment.reason, "The principal asked for it");
    assert.ok(a.events.some((e) => e.field === "override.assessment"));
    ctx.B = a;
  });

  /* ---------------------------------------------------------- Waiting list */
  await step("the waiting list goes by priority, then by who joined first, and says so to the family", async () => {
    // Class VII has one seat and it is taken by the time these two are waitlisted.
    const plain = await make("Wait", { grade: "Class VII", k: 5, bornIn: 2013, by: officer });
    const sib = await make("Sibl", { grade: "Class VII", k: 6, bornIn: 2013, priority: "sibling", by: officer });
    for (const x of [plain, sib]) {
      const s = (await officer.post(`/applications/${x.id}/sessions`, { kind: "interaction", onDate: plus(1) })).session;
      await officer.patch(`/applications/${x.id}/sessions/${s.id}`, { status: "completed", result: "qualified" });
    }
    await officer.post(`/applications/${plain.id}/actions/waitlist`, { reason: "No seat yet" });
    await officer.post(`/applications/${sib.id}/actions/waitlist`, { reason: "No seat yet" });
    const p = await get(plain.id), s = await get(sib.id);
    assert.ok(s.waitlist.position < p.waitlist.position, "the sibling is ahead though they joined later");
    assert.ok(p.waitlist.of >= 2 && s.waitlist.of === p.waitlist.of);
    const letter = (await officer.post(`/applications/${p.id}/letters`, { kind: "waitlist" })).letter;
    assert.match(letter.text, new RegExp(`position ${p.waitlist.position} of ${p.waitlist.of}`)); assert.match(letter.text, /not an offer of admission/);
    ctx.W = p;
  });

  /* ------------------------------------------------------- Decision and offer */
  await step("the decision is the admissions reviewer's; the offer letter goes out under their hand only", async () => {
    const id = ctx.A.id;
    refused(await registrar.try("POST", `/applications/${id}/actions/approve`, {}), 403);
    const a = (await officer.post(`/applications/${id}/actions/approve`, { note: "Recommended by the panel" })).application;
    assert.equal(a.status, "admitted"); assert.match(a.student.admissionNo, /^ADM-\d{4}$/);
    refused(await registrar.try("POST", `/applications/${id}/letters`, { kind: "offer" }), 403);
    refused(await teacher.try("POST", `/applications/${id}/letters`, { kind: "offer" }), 404);
    refused(await officer.try("POST", `/applications/${id}/letters`, { kind: "regret" }), 409);
    const offer = (await officer.post(`/applications/${id}/letters`, { kind: "offer", channel: "inbox" })).letter;
    assert.match(offer.refNo, /\/OFR$/); assert.match(offer.text, new RegExp(a.student.admissionNo));
    assert.ok(offer.delivered >= 1, "the family had an account and was written to in the app");
    assert.ok((await family.get("/inbox")).notices.some((n) => n.title === offer.subject));
    ctx.A = a;
  });

  await step("a declined application gets a regret letter that names a ground, never a judgment of the child", async () => {
    const x = ctx.lonely;
    let a = (await officer.post(`/applications/${x.id}/actions/reject`, { reason: "no_seat", note: "Class is full" })).application;
    assert.equal(a.status, "rejected");
    const l = (await officer.post(`/applications/${x.id}/letters`, { kind: "regret" })).letter;
    assert.match(l.text, /all the seats in the class are filled/); assert.match(l.text, /reconsidered/);
    assert.doesNotMatch(l.text, /fee|payment|₹/i);
  });

  /* ------------------------------------------------------ Class allocation */
  await step("classes for the year: one with room for one child, one with room", async () => {
    const roman = "VI";
    ctx.cFull = (await admin.put("/india/classes", { year: ctx.year, grade: roman, section: SECTION, capacity: 1, room: "Room 11" })).class;
    ctx.cOpen = (await admin.put("/india/classes", { year: ctx.year, grade: roman, section: SECTION.slice(0, 2) + "z".toUpperCase(), capacity: 40 })).class;
    ctx.cOther = (await admin.put("/india/classes", { year: ctx.year, grade: "VIII", section: SECTION, capacity: 40 })).class;
    const r = await registrar.get(`/enrollment/classes?year=${ctx.year}&grade=${encodeURIComponent("Class VI")}`);
    const ids = r.classes.map((c) => c.id);
    assert.ok(ids.includes(ctx.cFull.id) && ids.includes(ctx.cOpen.id) && !ids.includes(ctx.cOther.id), "only the classes of that grade are offered");
    refused(await officer.try("GET", `/enrollment/classes`), 403);          // choosing a seat is the registrar's, as enrolling is
    refused(await teacher.try("GET", `/enrollment/classes`), 403);
  });

  await step("enrolling seats the child: the class, and what the application already said, land on the roster", async () => {
    const a = ctx.A;
    const r = await registrar.post(`/applications/${a.id}/actions/activate`, {
      startsOn: plus(2), classId: ctx.cFull.id, account: { email: `alpha.${RUN}@school.test`, password: PW },
      guardians: [{ index: 0, password: PW }] });
    const enr = r.enrollment;
    ctx.enrA = enr;
    const roster = enr.sync.find((s) => s.key === "roster");
    assert.equal(roster.status, "done"); assert.match(roster.note, /Seated in VI-/);
    assert.equal(roster.classId, ctx.cFull.id);
    const classes = (await admin.get(`/india/classes?year=${ctx.year}`)).classes;
    assert.equal(classes.find((c) => c.id === ctx.cFull.id).strength, 1, "the class now has her");
    const students = (await admin.get(`/india/students?classId=${ctx.cFull.id}`)).students;
    const mine = students.find((x) => x.id === enr.studentId);
    assert.ok(mine, "the child is in the class's register");
    assert.deepEqual([mine.gender, mine.category, mine.bloodGroup, mine.motherTongue, mine.pin, mine.transport, mine.whatsapp],
      ["F", "OBC", "B+", "Punjabi", "160022", "School bus", 1]);
    assert.deepEqual([mine.fatherName, mine.motherName, mine.primaryContact, mine.admissionNo], ["Raj Prover", "Rita Prover", "Father", a.student.admissionNo]);
    assert.equal(mine.cwsn, 1); assert.equal(mine.disability, "Dyslexia");
    assert.equal(mine.admittedOn, plus(2));
  });

  await step("a full class refuses another child unless somebody says why, and a class of another grade is refused outright", async () => {
    const b = ctx.B;
    const full = await registrar.try("POST", `/applications/${b.id}/actions/activate`, { startsOn: plus(2), classId: ctx.cFull.id, account: { email: `beta.${RUN}@school.test`, password: PW } });
    refused(full, 409); assert.match(JSON.stringify(full.body), /is full/);
    refused(await registrar.try("POST", `/applications/${b.id}/actions/activate`, { startsOn: plus(2), classId: ctx.cOther.id, account: { email: `beta.${RUN}@school.test`, password: PW } }), 400);
    refused(await registrar.try("POST", `/applications/${b.id}/actions/activate`, { startsOn: plus(2), classId: "cls_nope", account: { email: `beta.${RUN}@school.test`, password: PW } }), 400);
    assert.equal((await get(b.id)).enrollmentId, null, "a refusal leaves no enrollment and no half-made student");
    const r = await registrar.post(`/applications/${b.id}/actions/activate`, { startsOn: plus(2), classId: ctx.cFull.id, classReason: "Twin of a child already in the class",
      account: { email: `beta.${RUN}@school.test`, password: PW } });
    assert.equal(r.enrollment.sync.find((s) => s.key === "roster").status, "done");
    const ev = (await get(b.id)).events.find((e) => e.kind === "enrollment" && e.field === "class");
    assert.match(ev.note, /Twin of a child/);
    assert.equal((await admin.get(`/india/classes?year=${ctx.year}`)).classes.find((c) => c.id === ctx.cFull.id).strength, 2);
    ctx.enrB = r.enrollment;
  });

  await step("an enrolment with no class is visible as unfinished, and the registrar can seat the child later", async () => {
    // F is the family's own application: take it through and enrol it with no class.
    let f = await get(ctx.F.id);
    for (const d of f.documents.filter((x) => x.required)) {
      await officer.put(`/applications/${f.id}/documents/${d.key}`, { status: "received" });
      await registrar.put(`/applications/${f.id}/documents/${d.key}`, { status: "verified", sighted: true });
    }
    for (const c of ["identity", "eligibility"]) await registrar.post(`/applications/${f.id}/actions/check`, { key: c, done: true });
    await registrar.post(`/applications/${f.id}/actions/start_review`);
    await registrar.post(`/applications/${f.id}/actions/mark_ready`);
    await officer.post(`/applications/${f.id}/actions/approve`, {});
    const r = await registrar.post(`/applications/${f.id}/actions/activate`, { startsOn: plus(2), account: { email: `fam.${RUN}@school.test`, password: PW } });
    const step1 = r.enrollment.sync.find((s) => s.key === "roster");
    assert.equal(step1.status, "attention"); assert.equal(r.enrollment.syncState, "exception");
    const seated = await registrar.post(`/enrollments/${r.enrollment.id}/actions/seat`, { classId: ctx.cOpen.id });
    assert.equal(seated.enrollment.sync.find((s) => s.key === "roster").status, "done");
    refused(await officer.try("POST", `/enrollments/${r.enrollment.id}/actions/seat`, { classId: ctx.cOpen.id }), 403);
    refused(await registrar.try("POST", `/enrollments/${r.enrollment.id}/actions/seat`, { classId: ctx.cOther.id }), 400);
    ctx.enrF = seated.enrollment;
  });

  await step("the confirmation letter is the registrar's, and names the class the child was seated in", async () => {
    const a = await get(ctx.A.id);
    assert.ok(a.lettersAvailable.some((l) => l.kind === "confirmation" && l.permitted === true), "the registrar who enrolled may write it");
    refused(await officer.try("POST", `/applications/${a.id}/letters`, { kind: "confirmation" }), 403);
    refused(await officer.try("POST", `/applications/${a.id}/letters`, { kind: "offer" }), 409);   // enrolled: the offer was taken up
    const l = (await registrar.post(`/applications/${a.id}/letters`, { kind: "confirmation" })).letter;
    assert.match(l.refNo, /\/CNF$/); assert.match(l.text, /admitted to Class VI-/); assert.match(l.text, new RegExp(a.student.admissionNo));
  });

  /* ------------------------------------------------------------- Reports */
  await step("the admission register has a line for each child, in admission-number order, and hides category from the registrar", async () => {
    const a = (await admin.get(`/enrollment/register?year=${ctx.year}`));
    const mine = a.rows.find((r) => r.enrollmentId === ctx.enrA.id);
    assert.ok(mine, "she is in the register");
    assert.deepEqual([mine.admissionNo, mine.father, mine.mother, mine.gender, mine.nationality, mine.category, mine.class.startsWith("VI-")],
      [ctx.A.student.admissionNo, "Raj Prover", "Rita Prover", "Female", "Indian", "OBC", true]);
    assert.ok(mine.address.includes("Park Road"));
    const nos = a.rows.map((r) => r.admissionNo).filter(Boolean);
    assert.deepEqual(nos, nos.slice().sort(), "in the order of the admission numbers");
    assert.deepEqual(a.rows.map((r) => r.serial), a.rows.map((_, i) => i + 1));
    const r = (await registrar.get(`/enrollment/register?year=${ctx.year}`)).rows.find((x) => x.enrollmentId === ctx.enrA.id);
    assert.equal(r.category, "", "a category is read by an administrator, not by the registrar");
    refused(await teacher.try("GET", `/enrollment/register`), 403); refused(await family.try("GET", `/enrollment/register`), 403);
  });

  await step("the funnel counts what happened, its sources include the enquiry we converted, and a teacher cannot read it", async () => {
    const { report: r } = await admin.get(`/enrollment/reports?year=${ctx.year}`);
    const n = Object.fromEntries(r.funnel.map((f) => [f.key, f.n]));
    assert.ok(n.enquiries >= 1 && n.applications >= 5 && n.assessed >= 3 && n.offered >= 3 && n.enrolled >= 3, JSON.stringify(n));
    assert.ok(n.applications >= n.assessed && n.offered >= n.enrolled, "each stage is within the one before");
    const ref = r.sources.find((x) => x.source === "referral");
    assert.ok(ref && ref.enquiries >= 1 && ref.applications >= 1 && ref.enrolled >= 1);
    assert.ok(r.timeliness.decided >= 3 && r.timeliness.target === 10 && typeof r.timeliness.medianDays === "number");
    assert.ok(r.outcomes.waitlisted >= 2 && r.outcomes.declined >= 1);
    assert.ok(r.priority.some((p) => p.key === "sibling") && r.category.some((c) => c.key === "OBC"));
    const g = r.grades.find((x) => x.name === "Class VI");
    assert.ok(g && g.applications >= 4 && g.enrolled >= 3);
    refused(await teacher.try("GET", `/enrollment/reports`), 403); refused(await family.try("GET", `/enrollment/reports`), 403);
  });

  await step("the settings come back with what was set, so the procedure page can print the school's own rules", async () => {
    const s = (await registrar.get("/enrollment/settings")).settings;
    assert.equal(s.letters.signatory, "Ritika Sood");
    assert.equal(s.calendar[ctx.year].closes, plus(30));
    assert.equal(s.assessments.find((x) => x.key === "interaction").required, true);
    assert.deepEqual(s.priorities.map((p) => p.key), ["sibling", "staff"]);
  });

  console.log(`\n${steps()} steps passed`);
} catch (e) {
  console.log("\nstopped after " + steps() + " passed steps");
  process.exitCode = 1;
} finally {
  if (ctx.before) await admin.put("/enrollment/settings", { settings: ctx.before }).catch(() => console.log("  (could not put the school's settings back)"));
}
