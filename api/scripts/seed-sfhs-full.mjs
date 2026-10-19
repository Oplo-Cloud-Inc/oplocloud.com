#!/usr/bin/env node
/* ==========================================================================
   Strawberry Fields High School, filled: the demo school as a school looks
   after a term of use, not as a school looks on its first morning.

     API=http://127.0.0.1:8787/api/v1 ORIGIN=http://127.0.0.1:8123 \
       CRED=/path/admin.json node scripts/seed-sfhs-full.mjs

   Run seed-demo-school.mjs first (it makes the school and its four people),
   then this, signed in as that school's administrator. CRED is a JSON file
   { "email", "password" }. Everything goes through the API the way a school's
   own loading does: the people import (invited, no password), the India
   details file, registers, an exam, certificate requests. Nothing here is
   real: the names are made up, the numbers are random (a fixed seed, so two
   runs make the same school), and every email is on a domain that cannot
   receive mail.

   Safe to run twice: people are matched by email, the exam by name, and a
   register that is already taken is left alone.
   ========================================================================== */
import { person, step, assert, cred } from "./lib-prove.mjs";

// A fixed seed: the same school every time.
let s = 20261018;
const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const digits = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? between(1, 9) : between(0, 9))).join("");
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7; };

const BOYS = "Aarav Vivaan Arjun Reyansh Ishaan Kabir Aditya Dhruv Harsh Kunal Manav Nikhil Pranav Rohan Sahil Tanish Uday Yash Gurpreet Harjot Jaspreet Karanveer Manjot Navdeep Simranjeet Taranjit Arshdeep Gurkirat Ranveer Samarth Vedant Yuvraj".split(" ");
const GIRLS = "Aadhya Anaya Diya Ira Kiara Myra Navya Pari Riya Saanvi Anika Avni Ishita Jiya Khushi Mahi Nisha Prisha Sara Simran Gurleen Harleen Jasleen Kirat Manpreet Navneet Sukhmani Tanya Zoya Aisha Tavleen Mehar".split(" ");
const SURNAMES = "Sharma Verma Gill Sidhu Sandhu Bajwa Grewal Dhillon Brar Chauhan Thakur Mehta Kapoor Malhotra Khanna Bhatia Arora Walia Chopra Sethi Bedi Dhaliwal Randhawa Soni Jain Garg Goyal Mittal Bansal Saini Rana Kohli Tandon Ahluwalia".split(" ");
const FATHERS = "Rajesh Sunil Amit Vikram Harpreet Gurmeet Manoj Sandeep Ashok Deepak Rakesh Naveen Balwinder Jasbir Kuldeep Parminder Ravinder Surinder Yogesh Ajay".split(" ");
const MOTHERS = "Sunita Anita Meena Neha Pooja Kavita Rajni Seema Poonam Ritu Harpreet Jasleen Manjit Parminder Navneet Gurpreet Sapna Renu Anju Deepa".split(" ");
const SECTORS = ["Sector 8", "Sector 15", "Sector 19", "Sector 22", "Sector 27", "Sector 32", "Sector 35", "Sector 38", "Sector 44", "Sector 47", "Manimajra", "Mohali Phase 7"];
const PINS = ["160008", "160015", "160019", "160022", "160027", "160030", "160035", "160036", "160044", "160047", "160101", "160062"];
const HOUSES = ["Shivalik", "Aravali", "Nilgiri", "Himalaya"];

// Thirteen sections, the grades an Indian school runs. Age on 1 April of the school year, so a Class X child is fifteen.
const SECTIONS = [["VI", "A", 11], ["VI", "B", 11], ["VII", "A", 12], ["VII", "B", 12], ["VIII", "A", 13], ["VIII", "B", 13], ["IX", "A", 14], ["IX", "B", 14],
  ["X", "A", 15], ["X", "B", 15], ["X", "C", 15], ["XI", "A", 16], ["XII", "A", 17]];
const SUBJECTS = {
  junior: ["English", "Hindi", "Punjabi", "Mathematics", "Science", "Social Science", "Computer Science"],
  middle: ["English", "Hindi", "Mathematics", "Science", "Social Science", "Information Technology"],
  senior: ["English", "Physics", "Chemistry", "Mathematics", "Computer Science"]
};
const bandOf = (g) => (["VI", "VII", "VIII"].includes(g) ? "junior" : ["IX", "X"].includes(g) ? "middle" : "senior");
// Each teacher teaches one subject; the pool is sized so every subject has a few.
const TEACHERS = [
  ["Anjali Bhardwaj", "English"], ["Rohit Sharma", "English"], ["Kamaljeet Kaur", "English"], ["Sunita Rana", "Hindi"], ["Deepak Joshi", "Hindi"], ["Harmeet Singh", "Punjabi"],
  ["Gurinder Kaur", "Punjabi"], ["Vikas Malik", "Mathematics"], ["Preeti Arora", "Mathematics"], ["Sanjay Gupta", "Mathematics"], ["Neelam Thakur", "Mathematics"],
  ["Rekha Sethi", "Science"], ["Amit Khanna", "Science"], ["Pooja Bansal", "Science"], ["Navjot Gill", "Science"], ["Ritu Chopra", "Social Science"], ["Manish Dogra", "Social Science"],
  ["Shalini Verma", "Social Science"], ["Tarun Mehra", "Computer Science"], ["Isha Kapoor", "Computer Science"], ["Rajiv Saini", "Information Technology"],
  ["Sukhwinder Brar", "Physics"], ["Meenu Walia", "Chemistry"], ["Parveen Dhillon", "Physics"], ["Alka Tandon", "Chemistry"], ["Jatin Soni", "Physical Education"]
];
const OFFICE = [["Harleen Ahluwalia", "dean"], ["Gaurav Mittal", "registrar"], ["Meera Goyal", "admissions"], ["Dr. Rashmi Jain", "nurse"], ["Ajit Randhawa", "facilities"], ["Sonia Bedi", "counselor"]];

const flat = (n) => n.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
const admin = person("admin");
const X = { classes: {}, kids: [] };
const dmyIso = (d) => d.toISOString().slice(0, 10);

await step("sign in as the school's administrator", async () => {
  const c = cred();
  await admin.login(c.email, c.password);
  const me = (await admin.get("/me")).account;
  X.org = me.organizations[0].id;
  assert.equal(me.organizations[0].region, "IN", "the school is an Indian one (run seed-demo-school.mjs after migration 0024)");
});

await step("the school's profile: CBSE, Chandigarh, three languages", async () => {
  const r = await admin.put("/school/profile", { boards: ["CBSE"], stateCode: "CH", languages: ["en", "hi", "pa"] });
  assert.deepEqual(r.profile.boards, ["CBSE"]);
});

await step("staff: teachers and the office, invited (no password)", async () => {
  const rows = [];
  TEACHERS.forEach(([name, subject]) => rows.push({ name, email: flat(name) + "@sfhs.in", role: "teacher", _subject: subject }));
  OFFICE.forEach(([name, role]) => rows.push({ name, email: flat(name) + "@sfhs.in", role }));
  const r = await admin.post("/exchange/import", { set: "users", rows: rows.map(({ _subject, ...x }) => x) });
  assert.equal(r.problemCount, 0, JSON.stringify(r.problems).slice(0, 300));
  X.teachers = TEACHERS.map(([name, subject]) => ({ name, subject, email: flat(name) + "@sfhs.in" }));
});

// ------------------------------------------------------------------ children
const used = new Set(["tanvi.jindal@sfhs.in"]);
function child(grade, age) {
  const girl = chance(0.48), first = pick(girl ? GIRLS : BOYS);
  let last = pick(SURNAMES), n = 0, email;
  do { email = `${first}.${last}${n ? n : ""}@sfhs.in`.toLowerCase(); n++; } while (used.has(email) && n < 60);
  used.add(email);
  if (used.size > 0 && n > 1) last += " ";
  const sikh = ["Gill", "Sidhu", "Sandhu", "Bajwa", "Grewal", "Dhillon", "Brar", "Dhaliwal", "Randhawa", "Bedi"].includes(last.trim());
  const name = `${first} ${last.trim()}`;
  const born = new Date(Date.UTC(2026 - age, between(0, 11), between(1, 28)));
  const k = between(0, SECTORS.length - 1), fam = pick(SURNAMES);
  return { name, email, girl, grade, born: dmyIso(born), sikh, sector: k, famName: last.trim(), famEmail: `${flat(last)}.family${between(100, 999)}${used.size}@family.example` };
}

await step("children: 26 to a section, with a family each, invited", async () => {
  const rows = [], byClass = {};
  for (const [g, sec, age] of SECTIONS) {
    const label = `${g}-${sec}`, list = (byClass[label] = []);
    const count = label === "X-C" ? 25 : between(24, 28);
    for (let i = 0; i < count; i++) {
      const c = child(g, age); c.label = label; list.push(c); X.kids.push(c);
      rows.push({ name: c.name, email: c.email, role: "student", guardianEmail: c.famEmail, guardianName: `${pick(c.girl ? FATHERS : FATHERS)} ${c.famName}`, relationship: "parent", primary: "yes" });
    }
  }
  let made = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const r = await admin.post("/exchange/import", { set: "users", rows: rows.slice(i, i + 200), offset: i });
    assert.equal(r.problemCount, 0, JSON.stringify(r.problems).slice(0, 300));
    made += r.invited;
  }
  X.byClass = byClass;
  assert.ok(made + 0 >= 0);
});

await step("sections, class teachers, and every child's India record loaded as one file", async () => {
  // Class teachers: the first thirteen English, Hindi, Maths and Science teachers, one each.
  const homeroom = ["Anjali Bhardwaj", "Rohit Sharma", "Kamaljeet Kaur", "Sunita Rana", "Deepak Joshi", "Vikas Malik", "Preeti Arora", "Sanjay Gupta", "Neelam Thakur", "Rekha Sethi", "Myra Malhotra", "Amit Khanna", "Pooja Bansal"];
  const rows = [];
  SECTIONS.forEach(([g, sec], si) => {
    const label = `${g}-${sec}`, kids = X.byClass[label];
    const ct = label === "X-C" ? "myra.malhotra@sfhs.in" : flat(homeroom[si]) + "@sfhs.in";
    kids.forEach((c, i) => {
      const father = pick(FATHERS), mother = pick(MOTHERS), board = ["IX", "X", "XI", "XII"].includes(g);
      const apaar = chance(0.72) ? digits(12) : chance(0.2) ? "REFUSED" : chance(0.25) ? "NOGEN" : undefined;
      const cat = chance(0.52) ? "General" : chance(0.45) ? "OBC" : chance(0.6) ? "SC" : chance(0.5) ? "EWS/DG" : "ST";
      const consent = chance(0.74) ? (chance(0.8) ? "Verified (DigiLocker)" : "Verified (signed form)") : chance(0.8) ? "Pending" : "Withdrawn - analytics only";
      Object.assign(c, { father, mother });
      rows.push({
        email: c.email, class: label, programme: "CBSE", room: "R-" + (101 + si), capacity: 40, classTeacherEmail: ct,
        admissionNo: `SF-${between(2014, 2025)}-${String(1000 + rows.length).slice(1)}${c.name.length}`, admittedOn: `${between(2014, 2025)}-04-0${between(1, 9)}`,
        gender: c.girl ? "F" : "M", house: pick(HOUSES), category: cat, secondLanguage: pick(["Hindi", "Punjabi"]), bloodGroup: pick(["A+", "B+", "O+", "AB+", "O-", "B-", "A-"]),
        apaar, pen: chance(0.86) ? digits(11) : undefined, consent, transport: chance(0.5) ? "Own / pickup" : `Route ${between(1, 9)} - ${SECTORS[c.sector]}`,
        pin: PINS[c.sector], district: "Chandigarh", state: "Chandigarh", fatherName: `${father} ${c.famName}`, fatherPhone: "9" + digits(9), motherName: `${mother} ${c.famName}`,
        motherPhone: chance(0.8) ? "9" + digits(9) : undefined, primaryContact: pick(["Father", "Mother"]), whatsapp: chance(0.8) ? "yes" : "no", language: pick(["Hindi", "Punjabi", "English"]),
        guardianEmail: c.famEmail, motherTongue: pick(["Punjabi", "Hindi", "Punjabi"]), dob: c.born, address: `House ${between(1, 999)}, ${SECTORS[c.sector]}, Chandigarh`,
        previousSchool: chance(0.3) ? pick(["Little Flower Convent", "Bhavan Vidyalaya", "St. Xavier's", "DAV Public School", "Government Model School"]) : undefined,
        cwsn: chance(0.03) ? "yes" : "no", disability: undefined, migrant: chance(0.04) ? "yes" : "no"
      });
      if (rows[rows.length - 1].cwsn === "yes") rows[rows.length - 1].disability = pick(["Low vision", "Hearing impairment", "Dyslexia", "Locomotor disability"]);
    });
  });
  let errs = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const r = await admin.post("/india/import", { rows: rows.slice(i, i + 200) });
    errs += r.errorCount;
    if (r.errorCount) console.log("      ", JSON.stringify(r.errors.slice(0, 3)));
  }
  assert.equal(errs, 0);
  const classes = (await admin.get("/india/classes")).classes;
  classes.forEach((c) => { X.classes[c.label || `${c.grade}-${c.section}`] = c; });
  for (const c of classes) await admin.post(`/india/classes/${c.id}/rolls`, { order: "name" });
  assert.ok(classes.length >= SECTIONS.length);
});

// ----------------------------------------------------------------- registers
await step("a month of registers: most days most children, a few who are often away", async () => {
  const today = (await admin.get(`/register?classId=${Object.values(X.classes)[0].id}`)).today;
  const iso = (n) => new Date(Date.parse(today + "T00:00:00Z") - n * 86400000).toISOString().slice(0, 10);
  let taken = 0, skipped = 0;
  for (const [ci, c] of Object.values(X.classes).entries()) {
    const first = await admin.get(`/register?classId=${c.id}&day=${today}`);
    const codes = first.codes, leave = (codes.find((k) => k.kind === "excused") || {}).key || "excused", lateKey = (codes.find((k) => k.key === "late") || {}).key;
    // Each child has a habit: most are rarely away, a few are away a lot.
    const habit = new Map(first.students.map((st) => [st.id || st.accountId, chance(0.07) ? 0.4 : chance(0.2) ? 0.1 : 0.03]));
    let days = 0;
    // Today too, for most sections: the morning is part way through, so the office sees registers still to come.
    for (let n = 0; days < 34 && n < 60; n++) {
      const d = iso(n);
      if (n === 0 && ci >= 9) continue;
      const reg = await admin.get(`/register?classId=${c.id}&day=${d}`);
      if (reg.schoolDay.kind !== "school") continue;
      days++;
      if (reg.taken) { skipped++; continue; }
      const marks = reg.students.map((st) => {
        const away = rnd() < (habit.get(st.id || st.accountId) || 0.03);
        if (!away) return { accountId: st.id || st.accountId, status: chance(0.015) && lateKey ? lateKey : "present" };
        const onLeave = chance(0.3);
        return { accountId: st.id || st.accountId, status: onLeave ? leave : "absent", reason: pick(["sick", "family", "travel", "other"].filter((k) => reg.reasons.some((x) => x.key === k)).concat(reg.reasons[0].key)) };
      });
      await admin.put("/register", { classId: c.id, day: d, marks });
      taken++;
    }
  }
  console.log(`       registers taken ${taken}, already taken ${skipped}`);
});

// ---------------------------------------------------------------------- exam
await step("a half-yearly exam: papers for every section, marks entered, papers at every stage of the cycle", async () => {
  const sc = (await admin.get("/grading/scales")).scales || [];
  let cbse = sc.find((x) => /cbse/i.test(x.name)), co = sc.find((x) => x.kind === "coscholastic");
  if (!cbse) cbse = (await admin.post("/grading/scales", { template: "cbse-9", name: "CBSE nine-point" })).scale;
  if (!co) co = (await admin.post("/grading/scales", { template: "co-5", name: "Co-scholastic" })).scale;
  const exams = (await admin.get("/exams")).exams || [];
  let exam = exams.find((e) => /half-yearly 2026/i.test(e.name));
  if (!exam) exam = (await admin.post("/exams", { name: "Half-yearly 2026", kind: "term", scaleId: cbse.id, coscaleId: co.id, startsOn: "2026-09-14", endsOn: "2026-09-26" })).exam;
  const bySubject = {};
  X.teachers.forEach((t) => (bySubject[t.subject] = bySubject[t.subject] || []).push(t));
  const lookup = new Map(((await admin.get("/accounts?limit=500")).accounts || []).map((a) => [a.email, a.id]));
  let n = 0;
  for (const [si, [g, sec]] of SECTIONS.entries()) {
    const cls = X.classes[`${g}-${sec}`];
    const subs = SUBJECTS[bandOf(g)];
    const papers = subs.map((subject, i) => {
      const pool = bySubject[subject] || X.teachers;
      const t = pool[(si + i) % pool.length];
      return { subject, teacherId: lookup.get(t.email), maxTheory: 80, maxInternal: 20 };
    });
    let made;
    try { made = (await admin.post(`/exams/${exam.id}/papers`, { classId: cls.id, papers })).papers; }
    catch (e) { made = ((await admin.get(`/papers?examId=${exam.id}&classId=${cls.id}`)).papers) || []; }
    const kids = (await admin.get(`/india/students?classId=${cls.id}`)).students;
    const ability = new Map(kids.map((k) => [k.id, 66 + gauss() * 14]));
    for (const p of made) {
      if (p.state && p.state !== "entry") continue;   // a second run leaves a paper that has moved on
      const marks = kids.map((k) => {
        const base = ability.get(k.id) + gauss() * 8 - (p.subject === "Mathematics" ? 3 : 0);
        const total = Math.max(8, Math.min(99, base));
        if (chance(0.012)) return { accountId: k.id, absent: true };
        return { accountId: k.id, theory: Math.min(80, Math.round(total * 0.8)), internal: Math.min(20, Math.round(total * 0.2)) };
      });
      await admin.put(`/papers/${p.id}/marks`, { marks });
      // The cycle, at every stage: older sections are published; the rest wait somewhere along it.
      const stop = si < 5 ? "published" : si < 8 ? "approved" : si < 10 ? "checked" : si < 12 ? "submitted" : "entry";
      const path = ["submitted", "checked", "approved", "published"];
      for (const to of path.slice(0, path.indexOf(stop) + 1)) { await admin.post(`/papers/${p.id}/advance`, { to }); }
      n++;
    }
  }
  console.log(`       ${n} papers`);
});

// ------------------------------------------------------------- timetable
await step("the timetable: eight periods, Monday to Saturday, every subject of every section placed with its teacher", async () => {
  const sch = (await admin.get("/bell-schedules")).schedules;
  let mon = sch.find((x) => x.periods.some((p) => p.label === "M1"));
  if (!mon) {
    const reg = (await admin.post("/bell-schedules", { name: "Regular day", periods: [
      { label: "1", startsAt: "08:30", endsAt: "09:10" }, { label: "2", startsAt: "09:10", endsAt: "09:50" }, { label: "3", startsAt: "09:50", endsAt: "10:30" }, { label: "4", startsAt: "10:30", endsAt: "11:10" },
      { label: "Lunch", startsAt: "11:10", endsAt: "11:40", kind: "other" },
      { label: "5", startsAt: "11:40", endsAt: "12:20" }, { label: "6", startsAt: "12:20", endsAt: "13:00" }, { label: "7", startsAt: "13:00", endsAt: "13:40" }, { label: "8", startsAt: "13:40", endsAt: "14:20" }] })).schedule;
    await admin.post(`/bell-schedules/${reg.id}/weekdays`);
    await admin.post("/bell-schedules", { name: "Saturday", periods: [
      { label: "S1", startsAt: "08:30", endsAt: "09:15" }, { label: "S2", startsAt: "09:15", endsAt: "10:00" }, { label: "S3", startsAt: "10:00", endsAt: "10:45" }, { label: "S4", startsAt: "10:45", endsAt: "11:30" }] });
  }
  // Saturday is a school day with its own short schedule; the year runs April to March.
  const sat = (await admin.get("/bell-schedules")).schedules.find((x) => x.name === "Saturday");
  const cal = await admin.get("/calendar?from=2026-10-05&to=2026-10-05");
  if (sat && !cal.pattern["6"]) await admin.put("/calendar/pattern", { pattern: { ...cal.pattern, 6: sat.id }, yearStart: "2026-04-01", yearEnd: "2027-03-31" });
  const labelsByDay = { M: [], T: [], W: [], R: [], F: [], S: [] };
  (await admin.get("/bell-schedules")).schedules.forEach((b) => b.periods.forEach((p) => { if (/^[MTWRFS]\d$/.test(p.label) && p.kind !== "other") labelsByDay[p.label[0]].push(p.label); }));
  const slots = ["M", "T", "W", "R", "F", "S"].flatMap((d) => labelsByDay[d]);
  const done = (await admin.get("/sections")).sections;
  if (done.filter((x) => x.placed).length >= 60) { console.log("       already placed"); return; }

  const subs = (await admin.get("/subjects")).subjects;
  const subjectId = async (name) => {
    let sub = subs.find((x) => x.title === name);
    if (!sub) { sub = (await admin.post("/subjects", { number: name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() + "-" + subs.length, title: name, credits: 0 })).subject; subs.push(sub); }
    return sub.id;
  };
  const NEED = {
    junior: [["English", 6], ["Hindi", 5], ["Punjabi", 4], ["Mathematics", 6], ["Science", 6], ["Social Science", 5], ["Computer Science", 3], ["Physical Education", 2]],
    middle: [["English", 6], ["Hindi", 5], ["Mathematics", 7], ["Science", 7], ["Social Science", 6], ["Information Technology", 3], ["Physical Education", 2]],
    senior: [["English", 5], ["Physics", 6], ["Chemistry", 6], ["Mathematics", 7], ["Computer Science", 6], ["Physical Education", 2]]
  };
  const accounts = new Map(((await admin.get("/accounts?limit=500")).accounts || []).map((a) => [a.email, a.id]));
  const pool = {}; X.teachers.forEach((t) => (pool[t.subject] = pool[t.subject] || []).push({ ...t, id: accounts.get(t.email) }));
  const busy = new Map(), taken = new Map(), load = new Map();    // teacher id → Set of labels; class → Set of labels
  const free = (m, k, l) => !(m.get(k) || new Set()).has(l);
  const mark = (m, k, l) => (m.get(k) || m.set(k, new Set()).get(k)).add(l);
  const myra = accounts.get("myra.malhotra@sfhs.in");
  let made = 0;
  for (const [si, [g, sec]] of SECTIONS.entries()) {
    const label = `${g}-${sec}`, cls = X.classes[label], kids = (await admin.get(`/india/students?classId=${cls.id}`)).students.map((k) => k.id);
    let first = null;
    for (const [ji, [subject, count]] of NEED[bandOf(g)].entries()) {
      const isBio = label === "X-C" && subject === "Science";
      const teachers = pool[subject] || pool["Mathematics"];
      // The teacher with the lightest load who is free the most.
      const tchr = isBio ? { id: myra } : [...teachers].sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0))[0];
      const chosen = [];
      const dayCount = {};
      for (let k = 0; k < count; k++) {
        let pick = null;
        for (let pass = 0; pass < 2 && !pick; pass++) {
          for (let off = 0; off < slots.length && !pick; off++) {
            const l = slots[(ji * 7 + si * 3 + k * 5 + off) % slots.length], d = l[0];
            if (!free(taken, label, l) || !free(busy, tchr.id, l)) continue;
            if (pass === 0 && (dayCount[d] || 0) >= (count > 6 ? 2 : 1)) continue;
            pick = l;
          }
        }
        if (!pick) continue;
        chosen.push(pick); mark(taken, label, pick); mark(busy, tchr.id, pick); dayCount[pick[0]] = (dayCount[pick[0]] || 0) + 1; load.set(tchr.id, (load.get(tchr.id) || 0) + 1);
      }
      let section;
      if (isBio) section = (await admin.put("/sections/crs_sfhs_bio_xc", { periods: chosen, room: "R-111", capacity: 40 })).section;
      else section = (await admin.post("/sections", { subjectId: await subjectId(subject), teacherIds: [tchr.id], periods: chosen, room: cls.room || "R-" + (101 + si), capacity: 40, sectionNo: sec, tab: label, title: subject })).section;
      if (!first) { first = section.courseId; await admin.post(`/sections/${first}/students`, { accountIds: kids }); }
      else await admin.post(`/sections/${section.courseId}/students`, { copyFrom: first });
      made++;
    }
  }
  console.log(`       ${made} sections placed`);
});

// ------------------------------------------------------------ the registry
await step("certificates, leave, cover, events and a circular, in every status", async () => {
  const kids = X.kids, id = new Map((((await admin.get("/accounts?limit=500")).accounts) || []).map((a) => [a.email, a.id]));
  // A record already there under the same title is left alone, so a second run adds nothing.
  const had = new Set();
  for (const kind of ["event", "certificate", "leave", "substitute", "form", "route", "loan"]) ((await admin.get(`/items?kind=${kind}`)).items || []).forEach((i) => had.add(kind + "|" + i.title));
  const add = (b) => (had.has(b.kind + "|" + b.title) ? null : admin.post("/items", b).catch((e) => console.log("       skipped:", String(e.message).slice(0, 140))));
  const today = new Date().toISOString().slice(0, 10);
  const from = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const certs = [["requested", "Bonafide certificate", "Passport application"], ["requested", "Character certificate", "Scholarship form"], ["awaiting signature", "Transfer certificate", "Family is moving to Pune"],
    ["awaiting signature", "Bonafide certificate", "Bank account"], ["issued", "Bonafide certificate", "Visa application"], ["issued", "Transfer certificate", "Moved to another school"], ["requested", "Migration certificate", "Admission abroad"]];
  for (const [i, [status, type, purpose]] of certs.entries()) {
    const k = kids[20 + i * 37], sid = id.get(k.email);
    if (sid) await add({ kind: "certificate", title: `${type} - ${k.name}`, status, subjectId: sid, dueOn: from(i - 2), data: { type, purpose, ...(type === "Transfer certificate" ? { lastClass: k.label, reason: purpose } : {}) } });
  }
  const t = (n) => id.get(flat(X.teachers[n].name) + "@sfhs.in");
  const leaves = [[0, "pending", "Sick", 1], [4, "pending", "Professional", 2], [9, "approved", "Personal", 0], [13, "approved", "Family", 3], [18, "declined", "Personal", 5]];
  for (const [n, status, type, d] of leaves) await add({ kind: "leave", title: `${X.teachers[n].name} - ${type.toLowerCase()} leave`, status, subjectId: t(n), dueOn: from(d), data: { type, until: from(d + 1), note: "" } });
  const cover = [[9, "needed", "Periods 2, 4", "Sick leave"], [13, "covered", "Periods 1, 3, 5", "Family function"]];
  for (const [n, status, periods, reason] of cover) await add({ kind: "substitute", title: `Cover for ${X.teachers[n].name}`, status, subjectId: t(n), dueOn: from(0), data: { periods, reason, plan: "Revision worksheet, chapter 6", ...(status === "covered" ? { coveredBy: t(20) } : {}) } });
  const events = [["Annual Sports Day", 9, "Playground", "everyone"], ["Parent-teacher meeting, Classes IX to XII", 4, "Classrooms", "families"], ["Diwali break begins", 18, "", "everyone"], ["Class X pre-board practicals", 12, "Labs", "students"],
    ["Science exhibition", 25, "Auditorium", "everyone"], ["Staff meeting", 1, "Staff room", "staff"]];
  for (const [title, d, place, audience] of events) await add({ kind: "event", title, status: "scheduled", dueOn: from(d), data: { place, audience, start: "09:00" } });
  const circulars = [
    ["Winter timings from 1 November", "Holiday", "everyone", "", "School runs 8:30 am to 2:30 pm from 1 November. Buses follow the new timings; the route sheet is on the notice board."],
    ["Half-yearly results and parent meeting", "Exam", "families", "IX-A, IX-B, X-A, X-B, X-C", "Report cards are published. Please meet the class teacher on the day named for your child's class to talk through the results."],
    ["Sports Day: bring your house colour", "Event", "everyone", "", "Annual Sports Day is on the ground from 9 am. Students wear their house t-shirt; families are welcome from 11 am."],
    ["Class X: pre-board practicals", "Academic", "families", "X-A, X-B, X-C", "Practicals begin the week of 2 November. Students must bring their record files and a calculator."],
    ["Bus route 4 is changed from Monday", "Transport", "families", "VI-A, VI-B, VII-A", "Route 4 will now stop at Sector 22 market instead of Sector 19. Pick-up times move five minutes earlier."],
    ["Staff: marks to the office by Friday", "General", "staff", "", "Unit test marks for Classes VI to VIII are due to the dean by Friday noon."]];
  const drivers = ["Baldev Singh", "Mohan Lal", "Gurdeep Singh", "Ramesh Kumar", "Satnam Singh", "Dalip Kumar", "Harbans Lal", "Jagtar Singh", "Kuldeep Rana"];
  for (let r = 1; r <= 9; r++) await add({ kind: "route", title: `Route ${r}`, status: r === 7 ? "paused" : "running", data: { bus: `CH-01-TA-${1100 + r * 7}`, driver: drivers[r - 1], driverPhone: "9" + digits(9), attendant: pick(["Savita", "Rekha", "Meena", "Pushpa"]), seats: pick([36, 40, 48]),
    stops: [SECTORS[(r * 2) % SECTORS.length], SECTORS[(r * 2 + 1) % SECTORS.length], SECTORS[(r * 2 + 3) % SECTORS.length], "School gate"].join("\n"), morning: `0${6 + (r % 2)}:${pick(["05", "15", "25", "40"])}`, evening: "14:35" } });
  const books = ["Wings of Fire", "Panchatantra Tales", "Discovery of India", "A Brief History of Time", "Malgudi Days", "Gitanjali", "The Jungle Book", "Our Universe"];
  for (const [i, b] of books.entries()) { const k = kids[40 + i * 29], sid = id.get(k.email); if (sid) await add({ kind: "loan", title: `${b} - ${k.name}`, status: i % 3 === 2 ? "returned" : "issued", subjectId: sid, dueOn: from(i - 3), data: { book: b, accession: `LIB-${1000 + i * 17}`, issuedOn: from(i - 17), ...(i % 3 === 2 ? { returnedOn: from(i - 5) } : {}) } }); }
  for (const [title, category, audience, classes, body] of circulars) await add({ kind: "form", title, status: "open", dueOn: today, data: { body, audience, category, classes } });
});

await step("an admissions season: applications for Nursery to Class XI, at every stage", async () => {
  const have = new Set(((await admin.get("/applications")).applications || []).map((a) => (a.student && a.student.name) || a.studentName || ""));
  const grades = ["Nursery", "LKG", "Class I", "Class V", "Class VI", "Class IX", "Class XI"];
  const age = { Nursery: 3, LKG: 4, "Class I": 6, "Class V": 10, "Class VI": 11, "Class IX": 14, "Class XI": 16 };
  const names = [["Aarush", "Mehra"], ["Kiara", "Bansal"], ["Vihaan", "Sood"], ["Inaaya", "Gill"], ["Rudra", "Sethi"], ["Myra", "Kohli"], ["Zayn", "Saini"], ["Navya", "Dhillon"], ["Advik", "Chopra"], ["Anvi", "Garg"], ["Kabir", "Walia"], ["Tia", "Soni"]];
  const made = [];
  for (const [i, [f, l]] of names.entries()) {
    if ([...have].some((h) => String(h).includes(f))) continue;
    const g = grades[i % grades.length];
    try { made.push((await admin.post("/applications", { grade: g, type: i % 4 === 3 ? "transfer" : "new", student: { legalFirst: f, legalLast: l, dob: `${2025 - age[g]}-0${between(1, 9)}-1${between(0, 9)}` } })).application); }
    catch (e) { console.log("       skipped:", String(e.message).slice(0, 160)); }
  }
  // Some are submitted by the family, some are being reviewed, two are still drafts.
  for (const [i, a] of made.entries()) {
    if (!a || i > 9) continue;
    await admin.post(`/applications/${a.id}/actions/submit`, {}).catch(() => {});
    if (i < 5) await admin.post(`/applications/${a.id}/actions/start_review`, {}).catch(() => {});
  }
  console.log(`       ${made.length} applications`);
});

await step("the school as it now reads", async () => {
  const w = await admin.get("/register/watch");
  const cls = (await admin.get("/india/classes")).classes;
  const kids = cls.reduce((a, c) => a + (c.strength || 0), 0);
  console.log(`       ${cls.length} sections, ${kids} children seated, ${w.summary.below} under 75%`);
  assert.ok(kids > 300);
});
