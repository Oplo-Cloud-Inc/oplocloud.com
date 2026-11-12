#!/usr/bin/env node
/* ==========================================================================
   Strawberry Fields High School at the size a real school is (O17): 1,801 children in 68 sections, 59 class teachers,
   and a term of whole-day marks for every one of them. seed-sfhs-full.mjs seats about 330 children, which is too few
   to show what a school's own lists cost; this is the school the Directory's budget (E7) is measured on.

     API=http://localhost:8787/api/v1 ORIGIN=http://localhost:8123 CRED=/path/credentials.json node api/scripts/seed-scale.mjs
     bash api/scripts/dev.sh scale        # the same, on a new local database

   Run seed-demo-school.mjs first (dev.sh does; it seats Tanvi Jindal, one of the 1,801), then this, signed in as that school's administrator. Everything goes
   through the API the way a school's own loading does: the people import, the India details file, the registers.
   Nothing here is real: names are made up, numbers come from a fixed seed (two runs make the same school), and every
   email is on a domain that cannot receive mail. Use a local database: a term of marks is about 200,000 rows.

     TERM_DAYS   school days of marks to load (110: about one term of a six-day week)
     CONCURRENCY registers sent at once (4)

   Safe to run twice: people are matched by email and a register already taken is left alone. It does not mix with
   seed-sfhs-full.mjs: run one or the other on a database.
   ========================================================================== */
import { person, step, assert, cred } from "./lib-prove.mjs";

// seed-demo-school.mjs seats one child already, Tanvi Jindal in X-C. She is one of the 1,801, so one fewer is imported and X-C is not given a 27th.
const STUDENTS = 1801, DEMO_KIDS = 1, DEMO_SECTION = "X-C", TEACHERS = 59, TERM_DAYS = Number(process.env.TERM_DAYS || 110), CONCURRENCY = Number(process.env.CONCURRENCY || 4);

// A fixed seed per purpose, so the same school comes out whatever order things run in.
const prng = (seed) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const R = prng(20261027);
const pick = (a, r = R) => a[Math.floor(r() * a.length)];
const between = (a, b, r = R) => a + Math.floor(r() * (b - a + 1));
const digits = (n, r = R) => Array.from({ length: n }, (_, i) => (i === 0 ? between(1, 9, r) : between(0, 9, r))).join("");
const flat = (n) => n.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");

const BOYS = "Aarav Vivaan Arjun Reyansh Ishaan Kabir Aditya Dhruv Harsh Kunal Manav Nikhil Pranav Rohan Sahil Tanish Uday Yash Gurpreet Harjot Jaspreet Karanveer Manjot Navdeep Simranjeet Taranjit Arshdeep Gurkirat Ranveer Samarth Vedant Yuvraj".split(" ");
const GIRLS = "Aadhya Anaya Diya Ira Kiara Myra Navya Pari Riya Saanvi Anika Avni Ishita Jiya Khushi Mahi Nisha Prisha Sara Simran Gurleen Harleen Jasleen Kirat Manpreet Navneet Sukhmani Tanya Zoya Aisha Tavleen Mehar".split(" ");
const SURNAMES = "Sharma Verma Gill Sidhu Sandhu Bajwa Grewal Dhillon Brar Chauhan Thakur Mehta Kapoor Malhotra Khanna Bhatia Arora Walia Chopra Sethi Bedi Dhaliwal Randhawa Soni Jain Garg Goyal Mittal Bansal Saini Rana Kohli Tandon Ahluwalia".split(" ");
const FATHERS = "Rajesh Sunil Amit Vikram Harpreet Gurmeet Manoj Sandeep Ashok Deepak Rakesh Naveen Balwinder Jasbir Kuldeep Parminder Ravinder Surinder Yogesh Ajay".split(" ");
const MOTHERS = "Sunita Anita Meena Neha Pooja Kavita Rajni Seema Poonam Ritu Harpreet Jasleen Manjit Parminder Navneet Gurpreet Sapna Renu Anju Deepa".split(" ");
const SECTORS = ["Sector 8", "Sector 15", "Sector 19", "Sector 22", "Sector 27", "Sector 32", "Sector 35", "Sector 38", "Sector 44", "Sector 47", "Manimajra", "Mohali Phase 7"];
const PINS = ["160008", "160015", "160019", "160022", "160027", "160030", "160035", "160036", "160044", "160047", "160101", "160062"];
const HOUSES = ["Shivalik", "Aravali", "Nilgiri", "Himalaya"];

// Classes I to XII; five sections a class in the primary years, six in the middle years, seven in XI where the streams split.
const GRADES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const PER_GRADE = [5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 6];
const SECTIONS = GRADES.flatMap((g, gi) => Array.from({ length: PER_GRADE[gi] }, (_, k) => ({ grade: g, age: 6 + gi, label: `${g}-${"ABCDEFG"[k]}` })));
// 68 sections of 26, and 33 of them hold a 27th child: 1,801 in all.
const bigger = new Set(SECTIONS.map((_, i) => [R(), i]).filter(([, i]) => SECTIONS[i].label !== DEMO_SECTION).sort((a, b) => a[0] - b[0]).slice(0, STUDENTS - 26 * SECTIONS.length).map((x) => x[1]));
assert.equal(SECTIONS.length, 68);

const admin = person("admin");
const X = { kids: [], teachers: [] };

await step("sign in as the school's administrator", async () => {
  await admin.login(cred().email, cred().password);
  const me = (await admin.get("/me")).account;
  assert.equal(me.organizations[0].region, "IN", "the school is an Indian one (run seed-demo-school.mjs after migration 0024)");
});

await step("the school's profile: CBSE, Chandigarh, three languages", async () => {
  const r = await admin.put("/school/profile", { boards: ["CBSE"], stateCode: "CH", languages: ["en", "hi", "pa"] });
  assert.deepEqual(r.profile.boards, ["CBSE"]);
});

await step(`${TEACHERS} teachers, invited (no password)`, async () => {
  const used = new Set();
  while (X.teachers.length < TEACHERS) {
    const name = `${pick(R() < 0.5 ? BOYS : GIRLS)} ${pick(SURNAMES)}`, email = flat(name) + ".t@sfhs.in";
    if (used.has(email)) continue;
    used.add(email); X.teachers.push({ name, email });
  }
  const r = await admin.post("/exchange/import", { set: "users", rows: X.teachers.map((t) => ({ name: t.name, email: t.email, role: "teacher" })) });
  assert.equal(r.problemCount, 0, JSON.stringify(r.problems).slice(0, 300));
});

await step(`${STUDENTS - DEMO_KIDS} children (and the demo school's one) in ${SECTIONS.length} sections, each with a family, invited`, async () => {
  const used = new Set(), rows = [];
  for (const [si, sec] of SECTIONS.entries()) {
    for (let i = 0; i < 26 + (bigger.has(si) ? 1 : 0) - (sec.label === DEMO_SECTION ? DEMO_KIDS : 0); i++) {
      const n = X.kids.length, r = prng(1000 + n), girl = r() < 0.48, first = pick(girl ? GIRLS : BOYS, r), last = pick(SURNAMES, r);
      let email, k = 0;
      do { email = `${first}.${last}${k || ""}@sfhs.in`.toLowerCase(); k++; } while (used.has(email));
      used.add(email);
      const c = { n, r, si, label: sec.label, age: sec.age, name: `${first} ${last}`, email, girl, last, famEmail: `${flat(last)}.family${n}@family.example` };
      X.kids.push(c);
      rows.push({ name: c.name, email, role: "student", guardianEmail: c.famEmail, guardianName: `${pick(FATHERS, r)} ${last}`, relationship: "parent", primary: "yes" });
    }
  }
  assert.equal(X.kids.length, STUDENTS - DEMO_KIDS);
  for (let i = 0; i < rows.length; i += 200) {
    const r = await admin.post("/exchange/import", { set: "users", rows: rows.slice(i, i + 200), offset: i });
    assert.equal(r.problemCount, 0, JSON.stringify(r.problems).slice(0, 300));
  }
});

await step("sections, class teachers, and every child's India record loaded as one file", async () => {
  const rows = X.kids.map((c) => {
    const r = c.r, father = pick(FATHERS, r), mother = pick(MOTHERS, r), sector = between(0, SECTORS.length - 1, r);
    const apaar = r() < 0.72 ? String(100000000000 + c.n * 7919) : r() < 0.5 ? "REFUSED" : undefined;
    return {
      email: c.email, class: c.label, programme: "CBSE", room: "R-" + (101 + c.si), capacity: 40,
      classTeacherEmail: X.teachers[c.si % TEACHERS].email,   // 68 sections, 59 teachers: nine teachers have two
      admissionNo: `SF-${2026 - c.age + 5}-${String(c.n + 1).padStart(4, "0")}`, admittedOn: `${2026 - c.age + 5}-04-0${between(1, 9, r)}`,
      gender: c.girl ? "F" : "M", house: pick(HOUSES, r), category: r() < 0.52 ? "General" : pick(["OBC", "SC", "EWS/DG", "ST"], r), secondLanguage: pick(["Hindi", "Punjabi"], r),
      bloodGroup: pick(["A+", "B+", "O+", "AB+", "O-", "B-", "A-"], r), apaar, pen: r() < 0.86 ? String(20000000000 + c.n * 104729) : undefined,
      consent: r() < 0.74 ? "Verified (DigiLocker)" : "Pending", transport: r() < 0.5 ? "Own / pickup" : `Route ${between(1, 9, r)} - ${SECTORS[sector]}`,
      pin: PINS[sector], district: "Chandigarh", state: "Chandigarh", fatherName: `${father} ${c.last}`, fatherPhone: "9" + digits(9, r),
      motherName: `${mother} ${c.last}`, motherPhone: r() < 0.8 ? "9" + digits(9, r) : undefined, primaryContact: pick(["Father", "Mother"], r), whatsapp: r() < 0.8 ? "yes" : "no",
      language: pick(["Hindi", "Punjabi", "English"], r), guardianEmail: c.famEmail, motherTongue: pick(["Punjabi", "Hindi"], r),
      dob: new Date(Date.UTC(2026 - c.age, between(0, 11, r), between(1, 28, r))).toISOString().slice(0, 10), address: `House ${between(1, 999, r)}, ${SECTORS[sector]}, Chandigarh`,
      cwsn: r() < 0.03 ? "yes" : "no", disability: undefined, migrant: r() < 0.04 ? "yes" : "no"
    };
  });
  rows.forEach((x) => { if (x.cwsn === "yes") x.disability = "Dyslexia"; });
  let errs = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const r = await admin.post("/india/import", { rows: rows.slice(i, i + 200) });
    errs += r.errorCount;
    if (r.errorCount) console.log("      ", JSON.stringify(r.errors.slice(0, 3)));
  }
  assert.equal(errs, 0);
  X.classes = (await admin.get("/india/classes")).classes;
  for (const c of X.classes) await admin.post(`/india/classes/${c.id}/rolls`, { order: "name" });
});

await step(`a term of registers: ${TERM_DAYS} school days, most children most days, a few often away`, async () => {
  const today = (await admin.get(`/register?classId=${X.classes[0].id}`)).today;
  const iso = (n) => new Date(Date.parse(today + "T00:00:00Z") - n * 86400000).toISOString().slice(0, 10);
  const cal = await admin.get(`/calendar?from=${iso(Math.ceil(TERM_DAYS * 1.8))}&to=${today}`);
  const days = cal.days.filter((d) => d.kind === "school").map((d) => d.day).sort().reverse().slice(0, TERM_DAYS);
  assert.ok(days.length >= TERM_DAYS * 0.9, `only ${days.length} school days in the last ${Math.ceil(TERM_DAYS * 1.8)} (the school calendar says the rest are not)`);
  // Each class's children and the codes the school uses, once.
  const roster = new Map();
  for (const c of X.classes) {
    const reg = await admin.get(`/register?classId=${c.id}&day=${today}`);
    const leave = (reg.codes.find((k) => k.kind === "excused") || {}).key, late = (reg.codes.find((k) => k.key === "late") || {}).key;
    const habit = reg.students.map((_, i) => { const h = prng(1e6 + i * 31 + roster.size * 1009); return h() < 0.07 ? 0.4 : h() < 0.2 ? 0.1 : 0.03; });   // each child has a habit
    roster.set(c.id, { kids: reg.students.map((s) => s.id), habit, leave, late, reasons: reg.reasons.map((x) => x.key) });
  }
  let sent = 0, skipped = 0;
  const tasks = [];
  for (const [di, d] of days.entries()) {
    const taken = new Set((await admin.get(`/register/classes?day=${d}`)).classes.filter((c) => c.taken).map((c) => c.id));
    for (const [ci, c] of X.classes.entries()) if (taken.has(c.id)) skipped++; else tasks.push({ c, ci, d, di });
  }
  const total = tasks.length;
  const work = async () => {
    for (let t; (t = tasks.pop()); ) {
      const { kids, habit, leave, late, reasons } = roster.get(t.c.id), r = prng(7 * t.ci + 100003 * t.di + 13);
      const marks = kids.map((id, i) => {
        if (r() >= habit[i]) return { accountId: id, status: r() < 0.015 && late ? late : "present" };
        return { accountId: id, status: r() < 0.3 && leave ? leave : "absent", reason: pick(reasons, r) };
      });
      await admin.put("/register", { classId: t.c.id, day: t.d, marks });
      if (++sent % 500 === 0) console.log(`       ${sent} of ${total} registers`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, work));
  console.log(`       registers taken ${sent}, already taken ${skipped}`);
  X.days = days;
});

await step("the school as it now reads: the row counts", async () => {
  const classes = (await admin.get("/india/classes")).classes;
  const seated = classes.reduce((a, c) => a + (c.strength || 0), 0);
  const teachers = new Set(classes.map((c) => c.classTeacher && c.classTeacher.id).filter(Boolean));
  const pulse = await admin.get(`/register/pulse?days=120`);
  const marks = pulse.days.reduce((a, d) => a + d.marked, 0);
  const total = (await admin.get("/directory/students?size=1")).total;
  console.log(`       ${classes.length} sections, ${seated} children seated, ${teachers.size} class teachers, ${marks} whole-day marks over ${pulse.days.length} days; the Directory lists ${total}`);
  assert.equal(classes.length, SECTIONS.length, "sections");
  assert.equal(seated, STUDENTS, "children seated");
  assert.equal(teachers.size, TEACHERS, "class teachers");
  assert.equal(total, STUDENTS, "children in the Directory (run seed-demo-school.mjs first: it seats the one child counted in the 1,801)");
  assert.ok(pulse.days.length >= Math.min(TERM_DAYS, 60), "school days with marks in the last 120 calendar days");
  assert.equal(marks, seated * pulse.days.length, "whole-day marks: a mark for every child on every one of those days");
});
