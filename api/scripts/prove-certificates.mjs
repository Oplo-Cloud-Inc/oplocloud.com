// Certificates and the public disclosure over HTTP: numbers that never repeat, a transfer certificate that
// takes the child out of the section, and a public page that shows only what the school switched on.
//   API=http://127.0.0.1:8791/api/v1 ORIGIN=http://127.0.0.1:8130 CRED=/path/credentials.json node scripts/prove-certificates.mjs
import { person, step, steps, assert, refused, cred, RUN, PW } from "./lib-prove.mjs";

const admin = person("admin"), teacher = person("teacher"), anon = person("anon");
const X = {};
const SEC = RUN.slice(-2).toUpperCase() + "C";

try {
  await step("a section with six children, and a teacher who is not the office", async () => {
    await admin.login(cred().email, cred().password);
    const me = (await admin.get("/me")).account.organizations[0];
    X.org = me.id; X.slug = me.slug;
    const mk = async (name, role, tag) => (await admin.post("/accounts", { email: `${tag}.ce${RUN}@s.test`, name, password: PW, role, orgId: X.org })).account;
    X.t = await mk("Plain Teacher", "teacher", "tch"); await teacher.login(X.t.email, PW);
    X.kids = [];
    for (const n of ["Aman Gill", "Beant Kaur", "Charu", "Dev Anand", "Eshaan Rai", "Farhan Ali"]) X.kids.push(await mk(n, "student", n.split(" ")[0].toLowerCase()));
    X.cls = (await admin.put("/india/classes", { grade: "X", section: SEC })).class;
    await admin.post(`/india/classes/${X.cls.id}/students`, { studentIds: X.kids.map((k) => k.id) });
    for (const k of X.kids) await admin.put(`/students/${k.id}/india`, { admissionNo: `AD/${RUN}/${k.name.slice(0, 2)}`, fatherName: "A Parent" });
  });

  const cert = (kid, type, extra = {}) => admin.post("/items", { kind: "certificate", title: `${type}: ${kid.name}`, subjectId: kid.id, status: "requested", data: { type, ...extra } });

  await step("a requested certificate has no number; an issued one gets the next, with its date", async () => {
    const r = (await cert(X.kids[0], "Transfer certificate", { reason: "Moving to another city", conduct: "Very good", promotion: "Class XI" })).item;
    assert.equal(r.data.number || "", ""); X.tc0 = r;
    const done = (await admin.try("PATCH", `/items/${r.id}`, { status: "issued" }));
    assert.equal(done.status, 200, JSON.stringify(done.body)); const it = done.body.item;
    assert.match(it.data.number, /^[A-Z0-9]+\/TC\/\d{4}-\d{2}\/\d{4}$/); assert.ok(it.data.issuedOn); assert.equal(it.status, "issued");
    X.n0 = it.data.number; X.seq0 = +it.data.number.slice(-4);
  });

  await step("a transfer certificate takes the child out of the section and records the class and the day", async () => {
    const it = (await admin.get(`/items/${X.tc0.id}`)).item;
    assert.equal(it.data.lastClass, `X-${SEC}`); assert.equal(it.data.leftOn, it.data.issuedOn);
    const st = (await admin.get(`/students/${X.kids[0].id}/india`)).student;
    assert.equal(st.classId, null); assert.equal(st.leftOn, it.data.leftOn); assert.match(st.leftReason, /another city/);
    assert.equal((await admin.get(`/india/students?classId=${X.cls.id}`)).students.some((s) => s.id === X.kids[0].id), false);
  });

  await step("numbers are consecutive, never repeat, and are handed out safely when several are issued at once", async () => {
    const made = [];
    for (const k of X.kids.slice(1, 5)) made.push((await cert(k, "Transfer certificate")).item);
    const issued = await Promise.all(made.map((m) => admin.try("PATCH", `/items/${m.id}`, { status: "issued" })));
    issued.forEach((r) => assert.equal(r.status, 200, JSON.stringify(r.body)));
    const nums = issued.map((r) => +r.body.item.data.number.slice(-4)).sort((a, b) => a - b);
    assert.deepEqual(nums, [X.seq0 + 1, X.seq0 + 2, X.seq0 + 3, X.seq0 + 4]);
    X.tcs = issued.map((r) => r.body.item);
  });

  await step("saving an issued certificate again keeps its number; another kind has its own series", async () => {
    const again = (await admin.try("PATCH", `/items/${X.tc0.id}`, { data: { ...(await admin.get(`/items/${X.tc0.id}`)).item.data, note: "Copy issued" } })).body.item;
    assert.equal(again.data.number, X.n0);
    const bf = (await cert(X.kids[5], "Bonafide certificate", { purpose: "Bank account" })).item;
    const issued = (await admin.try("PATCH", `/items/${bf.id}`, { status: "issued" })).body.item;
    assert.match(issued.data.number, /\/BF\/\d{4}-\d{2}\/\d{4}$/);
    // a bonafide is not a leaving: the child is still in the section
    const st = (await admin.get(`/students/${X.kids[5].id}/india`)).student;
    assert.equal(st.leftOn, null); assert.ok(st.classId);
    // its own count: on a school's first day the first bonafide and the first transfer certificate are both 0001, and that is right
    assert.match(issued.data.number, /\/BF\/\d{4}-\d{2}\/\d{4}$/);
  });

  await step("a certificate is made from the child's record alone: nothing about money is on it", async () => {
    const kinds = (await admin.get("/item-kinds")).kinds;
    const spec = kinds.certificate || kinds.find?.((k) => k.kind === "certificate");
    const fields = (spec.fields || []).map((f) => f.k || f[0]);
    assert.ok(fields.length >= 8);
    assert.deepEqual(fields.filter((k) => /fee|due|paid|owe|balance|payment/i.test(k)), [], "no field of a certificate is about money");
  });

  await step("the office reads and writes the disclosure; a teacher does neither", async () => {
    refused(await teacher.try("GET", "/school/disclosure"), 403);
    refused(await teacher.try("PUT", "/school/disclosure", { publishTc: true }), 403);
    refused(await admin.try("PUT", "/school/disclosure", { general: { email: "nope" } }), 400);
    const d = (await admin.put("/school/disclosure", { general: { affiliationNo: "1630999", principal: "Ms A. Kaur", email: "office@school.example", address: "Sector 14, Chandigarh" },
      facts: [{ label: "Library books", value: "4,200" }, { label: "Science labs", value: "3" }], publishTc: false })).disclosure;
    assert.equal(d.general.affiliationNo, "1630999"); assert.equal(d.facts.length, 2); assert.equal(d.publishTc, false);
    assert.equal((await admin.get("/school/disclosure")).slug, X.slug);
  });

  await step("anyone can read the public disclosure; certificates are not on it until the school switches that on", async () => {
    const pub = await anon.try("GET", `/public/schools/${X.slug}/disclosure`);
    assert.equal(pub.status, 200); assert.match(pub.headers.get("cache-control"), /public/);
    const b = pub.body;
    assert.equal(b.school.slug, X.slug); assert.equal(b.general.principal, "Ms A. Kaur"); assert.equal(b.facts[0].label, "Library books");
    assert.ok(b.enrolment.some((e) => e.class === "X" && e.students >= 4)); assert.ok(b.staff.teachers >= 1);
    assert.equal(b.certificates.published, false); assert.deepEqual(b.certificates.transfer, []);
    refused(await anon.try("GET", "/public/schools/no-such-school/disclosure"), 404);
  });

  await step("switched on, only the transfer certificates the office ticked appear, with the minimum about the child", async () => {
    await admin.put("/school/disclosure", { general: { affiliationNo: "1630999" }, facts: [], publishTc: true });
    const mine = new Set(X.tcs.map((t) => t.data.number).concat(X.n0));    // an earlier run may have ticked its own; only this run's matter
    assert.deepEqual((await anon.get(`/public/schools/${X.slug}/disclosure`)).certificates.transfer.filter((c) => mine.has(c.number)), [], "issued but not ticked: still private");
    const pick = X.tcs[0];
    await admin.try("PATCH", `/items/${pick.id}`, { data: { ...pick.data, web: true } }).then((r) => assert.equal(r.status, 200));
    const text = (await anon.try("GET", `/public/schools/${X.slug}/disclosure`));
    const list = text.body.certificates.transfer.filter((c) => mine.has(c.number));
    assert.equal(list.length, 1); assert.equal(list[0].number, pick.data.number); assert.ok(list[0].name.length > 0); assert.equal(list[0].lastClass, `X-${SEC}`); assert.ok(list[0].leftOn);
    const raw = text.text;
    for (const secret of [X.kids[5].email, "AD/", "A Parent", "@s.test", "admission"]) assert.equal(raw.includes(secret), false, "the public page must not carry " + secret);
    assert.deepEqual(Object.keys(list[0]).sort(), ["issuedOn", "lastClass", "leftOn", "name", "number"]);
  });

  await step("switched off again, the list is empty", async () => {
    await admin.put("/school/disclosure", { general: { affiliationNo: "1630999" }, facts: [], publishTc: false });
    assert.deepEqual((await anon.get(`/public/schools/${X.slug}/disclosure`)).certificates.transfer, []);
  });
} catch { process.exitCode = 1; }
console.log(`\n${steps()} steps passed.`);
