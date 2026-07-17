// ============================================================
// Store — localStorage-backed state + actions + pub/sub
// Turns the mock UI into persistent, usable software.
// ============================================================
import * as seed from "./data.js";

const KEY = "oedu.teacher.v5";
const clone = (x)=> (typeof structuredClone==="function" ? structuredClone(x) : JSON.parse(JSON.stringify(x)));

export const classes = ["10-A","10-B","11-A","11-B","12-A","12-B"];

function freshDB(){
  const students = clone(seed.students);
  const exams = clone(seed.exams);
  // give exam cards ids
  for (const m in exams) exams[m].forEach(r=>r.cards.forEach((c,i)=>{ c.id = c.id || `ex-${m}-${r.period}-${i}`; }));
  // normalize assignments to their real class roster + seed grading progress
  const assignments = clone(seed.assignments);
  const grades = {};
  assignments.forEach(a=>{
    const roster = students.filter(s=>s.grade===a.cls);
    a.assigned = roster.length;
    a.submitted = Math.min(a.submitted, roster.length);
    const gcount = Math.min(a.graded||0, a.submitted);
    if (gcount>0){
      const g = {};
      roster.slice(0, gcount).forEach((s,i)=>{ g[s.id] = 55 + ((i*7 + (a.title?a.title.length:0)*11) % 43); });
      grades[a.id] = g;
    }
  });
  // Close-the-Loop: how many of the last 5 sessions each student has missed (seeded from risk)
  const recentAbs = {};
  students.forEach(s=>{ recentAbs[s.id] = s.risk==="high" ? 2 : s.risk==="watch" ? 1 : 0; });
  // Real gradebook: weighted categories per class (beats Classroom's flat grade)
  const defaultCats = ()=>[
    { id:"c-hw",   name:"Homework",      weight:20 },
    { id:"c-quiz", name:"Quizzes",       weight:25 },
    { id:"c-exam", name:"Exams",         weight:40 },
    { id:"c-part", name:"Participation", weight:15 },
  ];
  const gradeCats = {}; classes.forEach(c=>{ gradeCats[c] = defaultCats(); });
  // Standards-based grading — a few standards per subject
  const standards = {
    math:    [{ code:"CCSS.8.EE.A", label:"Expressions & equations" }, { code:"CCSS.8.F.B", label:"Functions & modeling" }],
    english: [{ code:"RL.9-10.2",   label:"Theme & central idea" },    { code:"W.9-10.1", label:"Argumentative writing" }],
    science: [{ code:"HS-PS1",      label:"Matter & interactions" }],
  };
  // Join codes per class (Classroom parity)
  const joinCodes = {}; classes.forEach((c,i)=>{ joinCodes[c] = ("oe"+c.replace("-","").toLowerCase()+(i+3)*7).slice(0,6); });
  return {
    v: 5,
    teacher: clone(seed.teacher),
    settings: {
      theme: "light",
      notifications: { newSubmissions:true, attendanceAlerts:true, parentMessages:true, weeklyDigest:false },
    },
    students, exams, assignments, grades,
    sessionAtt: {},                    // sessionId -> { studentId: 'present'|'late'|'absent' }
    recentAbs,                         // studentId -> count of recent absences
    parentNotes: [],                   // { studentId, name, sentAt, body } — Close-the-Loop log
    gradeCats, standards, joinCodes,
    assignCat: {},                     // assignmentId -> categoryId (which weighted bucket it counts in)
    savedComments: {},                 // studentId -> report-card comment
    catchups: [],                      // generated catch-up packs (audit trail)
    imports: [],                       // migration import log
    thresholds: { absences:3, missingWork:3, gradeDrop:12 },  // admin-tunable Close-the-Loop triggers
    guardianLinks: { s100:["u-guardian"], s141:["u-guardian"] }, // studentId -> [guardian userIds]
    threads: clone(seed.threads),
    classPrep: clone(seed.classPrep),
    counters: { s: 500, ex: 1, as: 100, th: 100, lp: 1 },
  };
}

function loadDB(){
  try{
    const raw = localStorage.getItem(KEY);
    if (raw){ const parsed = JSON.parse(raw); if (parsed && parsed.v===5) return Object.assign(freshDB(), parsed); }
  }catch(e){ /* ignore corrupt state */ }
  return freshDB();
}

export let db = loadDB();

// ---- pub/sub ----
const subs = new Set();
export function subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); }
export function persist(){
  try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){}
  subs.forEach(fn=>{ try{ fn(); }catch(e){} });
}
export function resetAll(){ localStorage.removeItem(KEY); db = freshDB(); persist(); }

// ---- ids / dates ----
export const genId = (p)=>{ db.counters[p]=(db.counters[p]||0)+1; return p+db.counters[p]; };
export const todayISO = ()=> new Date().toISOString().slice(0,10);
export function fmtDate(iso){
  try{ return new Date(iso+"T00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
  catch{ return iso; }
}

// ---- attendance ----
export const attKey = (cls, dateISO=todayISO())=> `${cls}|${dateISO}`;
export function getRegister(cls, dateISO=todayISO()){ return db.attendance[attKey(cls,dateISO)] || null; }
export function saveRegister(cls, marks, dateISO=todayISO()){
  db.attendance[attKey(cls,dateISO)] = clone(marks); persist();
}
export function attendanceToday(){
  // aggregate every register saved for today
  const iso = todayISO(); let p=0,l=0,a=0;
  for (const k in db.attendance){ if (!k.endsWith("|"+iso)) continue;
    for (const id in db.attendance[k]){ const v=db.attendance[k][id]; if(v==="present")p++;else if(v==="late")l++;else if(v==="absent")a++; } }
  const total=p+l+a;
  return { present:p, late:l, absent:a, total, rate: total? Math.round((p+l)/total*100):null };
}

// ---- grading ----
export function getGrades(assignmentId){ return db.grades[assignmentId] || {}; }
export function setGrade(assignmentId, studentId, score){
  db.grades[assignmentId] = db.grades[assignmentId] || {};
  if (score===null || score==="" || isNaN(score)) delete db.grades[assignmentId][studentId];
  else db.grades[assignmentId][studentId] = Math.max(0, Math.min(100, Math.round(+score)));
}
export function gradedCount(a){
  const g = db.grades[a.id]; const stored = g ? Object.keys(g).length : 0;
  return Math.max(stored, 0);
}
export function assignmentView(a){
  const graded = Math.max(gradedCount(a), 0);
  const submitted = Math.max(a.submitted, graded);
  let status = a.status;
  if (graded>=submitted && submitted>0 && graded>0) status="done";
  else if (graded>0) status="grading";
  return { ...a, submitted, graded, status };
}
export function classRoster(cls){ return db.students.filter(s=>s.grade===cls); }

// ---- entity actions ----
export function addExam(month, card){
  db.exams[month] = db.exams[month] || [];
  let row = db.exams[month].find(r=>r.period===card.period);
  if (!row){ row={period:card.period, cards:[]}; db.exams[month].push(row); db.exams[month].sort((a,b)=>a.period-b.period); }
  card.id = card.id || genId("ex");
  row.cards.push(card); persist();
}
export function updateExam(month, id, patch){
  (db.exams[month]||[]).forEach(r=>{ const c=r.cards.find(x=>x.id===id); if(c) Object.assign(c,patch); }); persist();
}
export function deleteExam(month, id){
  (db.exams[month]||[]).forEach(r=>{ r.cards = r.cards.filter(x=>x.id!==id); }); persist();
}
export function addAssignment(a){ a.id=genId("as"); a.submitted=a.submitted||0; a.graded=0; a.status="open"; db.assignments.unshift(a); persist(); }
export function addStudent(s){
  s.id=genId("s"); s.initials=s.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  s.attendance=s.attendance??95; s.gpa=s.gpa??3.0; s.trend=0; s.risk = s.attendance<82?"high":s.attendance<86?"watch":"ok";
  s.hue = s.hue || ["violet","sky","blush","peach","mint","teal","lilac"][db.students.length%7];
  db.students.push(s); persist();
}
export function removeStudent(id){ db.students = db.students.filter(s=>s.id!==id); persist(); }
export function addLessonPlan(p){ p.ready=p.ready||10; p.resources=p.resources||0; db.classPrep.push(p); persist(); }
export function addThread(name, role, first){
  const t={ id:genId("th"), name, role:role||"Contact", initials:name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(),
    hue:["violet","sky","blush","peach","mint","teal","lilac"][db.threads.length%7], unread:false, time:"now",
    preview:first||"", msgs: first?[{me:true,t:first,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]:[] };
  db.threads.unshift(t); persist(); return t;
}
export function unreadCount(){ return db.threads.filter(t=>t.unread).length; }
export function markThreadRead(id){ const t=db.threads.find(x=>x.id===id); if(t&&t.unread){ t.unread=false; persist(); } }

// ---- derived analytics ----
export function liveGradeDistribution(){
  const bands = { A:0,B:0,C:0,D:0,E:0 };
  let any=false;
  for (const aid in db.grades){ for (const sid in db.grades[aid]){ any=true;
    const v=db.grades[aid][sid];
    bands[v>=80?"A":v>=70?"B":v>=60?"C":v>=50?"D":"E"]++; } }
  if (!any) return null;
  const tints={A:"mint",B:"sky",C:"butter",D:"peach",E:"blush"};
  return Object.keys(bands).map(b=>({band:b,value:bands[b],tint:tints[b]}));
}

// ============================================================
// THE SESSION — the product's single primitive
// A session = one class, at one time, on one day.
// ============================================================
const toMin = (t)=>{ const [h,m]=t.split(":").map(Number); return h*60+(m||0); };

function buildSessions(){
  const out = [];
  seed.APP.week.forEach((day, di)=>{
    seed.scheduleTimes.forEach((time, ti)=>{
      const b = seed.schedule[ti][di];
      if (!b) return;
      out.push({
        id: `sess-${day.date}-${time.replace(":","")}-${b.cls}`,
        date: day.date, weekday: day.d, time, period: ti+1,
        subject: b.subject, cls: b.cls, room: b.room, kind: "class",
        title: seed.subjects[b.subject]?.name + " lesson",
      });
    });
  });
  // a past exam that now needs grading (time-based disclosure), and one coming up
  out.push({ id:"sess-2026-02-10-1000-10-A", date:"2026-02-10", weekday:"Tue", time:"10:00", period:3,
    subject:"math", cls:"10-A", room:"302", kind:"exam", title:"Algebra Mid-term" });
  out.push({ id:"sess-2026-02-13-0900-12-B", date:"2026-02-13", weekday:"Fri", time:"09:00", period:2,
    subject:"english", cls:"12-B", room:"305", kind:"exam", title:"Macbeth Essay Exam" });
  out.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));
  return out;
}
export const sessions = buildSessions();
export const sessionById = (id)=> sessions.find(s=>s.id===id);
export const sessionsOn = (date)=> sessions.filter(s=>s.date===date).sort((a,b)=>toMin(a.time)-toMin(b.time));
export const todaySessions = ()=> sessionsOn(seed.APP.today);

export function sessionState(s){
  const today = seed.APP.today, now = seed.APP.nowMin;
  const start = toMin(s.time), end = start + (s.kind==="exam"?90:55);
  if (s.date < today || (s.date===today && end<=now)) return "done";
  if (s.date===today && start<=now && now<end) return "now";
  if (s.date===today && start>now) return "upcoming";
  return "future";
}
export function nextTodayId(){
  const up = todaySessions().filter(s=>sessionState(s)==="upcoming");
  return up.length ? up[0].id : null;
}

// session attendance (keyed by session — attendance is a property of a session)
export const getSessionAtt = (id)=> db.sessionAtt[id] || null;
export function saveSessionAtt(id, marks){ db.sessionAtt[id] = clone(marks); persist(); }
export function sessionAttSummary(id){
  const a = db.sessionAtt[id]; const c={present:0,late:0,absent:0,taken:!!a};
  if (a) for (const k in a){ c[a[k]]++; }
  return c;
}

// Close-the-Loop: projected recent-absence count if this student is marked absent now
export const absenceProjection = (studentId)=> (db.recentAbs[studentId]||0) + 1;
export function studentAbsenceTotal(studentId){
  let n = db.recentAbs[studentId]||0;
  for (const sid in db.sessionAtt){ if (db.sessionAtt[sid][studentId]==="absent") n++; }
  return n;
}
export function hasParentNote(studentId){ return db.parentNotes.some(p=>p.studentId===studentId); }
export function logParentNote(student){
  db.parentNotes.push({ studentId:student.id, name:student.name, sentAt:new Date().toISOString() });
  persist();
}

// Follow-ups: post-session admin surfaced only when relevant (time-based disclosure)
export function needsYou(){
  const items=[];
  sessions.forEach(s=>{
    if (sessionState(s)!=="done") return;
    if (s.kind==="exam"){
      const g = db.grades[s.id]; const roster = classRoster(s.cls).length;
      const graded = g?Object.keys(g).length:0;
      if (graded < roster) items.push({ session:s, kind:"grade", label:"Grade "+s.title, meta:`${graded}/${roster} graded` });
    } else if (s.date===seed.APP.today && !getSessionAtt(s.id)){
      items.push({ session:s, kind:"attend", label:"Take attendance", meta:`${seed.subjects[s.subject].short} · ${s.cls}` });
    }
  });
  return items;
}

// AI-drafted parent note (Close-the-Loop) — feels "already written"
export function draftParentNote(student, total){
  const first = student.name.split(" ")[0];
  return `Dear ${student.name.split(" ").slice(-1)[0]} family,\n\n`+
    `I wanted to reach out because ${first} has now missed ${total} of the last 5 sessions of ${student.grade}. `+
    `${first} is a valued member of the class and I don't want the absences to affect their progress.\n\n`+
    `Could we find a time this week to talk about how to get ${first} caught up and back on track? `+
    `Please let me know what works for you.\n\nWarm regards,\n${db.teacher.name}\n${db.teacher.role}, Westbrook Academy`;
}
// AI-drafted report-card comment from session data
export function draftComment(student){
  const first = student.name.split(" ")[0];
  const tone = student.gpa>=3.4 ? "consistently strong" : student.gpa>=2.9 ? "steady, capable" : "developing";
  return `${first} has shown ${tone} work this term, with a ${student.attendance}% attendance record. `+
    `${student.gpa>=3.2?`${first} engages well and contributes thoughtfully in class.`:`With more consistent attendance, ${first} has clear room to grow.`} `+
    `Next term we'll focus on building confidence and independence in ${student.grade.startsWith("12")?"exam technique":"core skills"}.`;
}

// ============================================================
// v2 — the real gradebook, guardians, thresholds, migration
// ============================================================

// ---- Real gradebook: weighted categories + automatic calculation ----
export const gradeCats = (cls)=> db.gradeCats[cls] || [];
export function setAssignmentCategory(assignmentId, catId){ db.assignCat[assignmentId]=catId; persist(); }
export const assignmentCategory = (a)=> db.assignCat[a.id] || (
  /exam|test|mid-term|final/i.test(a.title) ? "c-exam" : /quiz/i.test(a.title) ? "c-quiz" : /part|discuss/i.test(a.title) ? "c-part" : "c-hw"
);
// class assignments (from both assignments + graded exam sessions), with their category
export function classAssignments(cls){
  const out = db.assignments.filter(a=>a.cls===cls).map(a=>({ id:a.id, title:a.title, subject:a.subject, cat:assignmentCategory(a) }));
  sessions.filter(s=>s.cls===cls && s.kind==="exam").forEach(s=>{
    if (!out.some(o=>o.id===s.id)) out.push({ id:s.id, title:s.title, subject:s.subject, cat:"c-exam" });
  });
  return out;
}
// weighted percentage for one student in a class
export function studentGrade(cls, studentId){
  const cats = gradeCats(cls); const asgs = classAssignments(cls);
  let totW=0, acc=0; const perCat={};
  cats.forEach(cat=>{
    const items = asgs.filter(a=>a.cat===cat.id);
    const scores = items.map(a=>db.grades[a.id]?.[studentId]).filter(v=>v!=null);
    if (!scores.length) return;
    const avg = scores.reduce((x,y)=>x+y,0)/scores.length;
    perCat[cat.id]=Math.round(avg); acc += avg*cat.weight; totW += cat.weight;
  });
  return { pct: totW ? Math.round(acc/totW) : null, perCat };
}
export function classGradeAverage(cls){
  const roster=classRoster(cls); const vals=roster.map(s=>studentGrade(cls,s.id).pct).filter(v=>v!=null);
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
}
export function updateCategoryWeights(cls, weights){ // weights: {catId: number}
  (db.gradeCats[cls]||[]).forEach(c=>{ if (weights[c.id]!=null) c.weight=+weights[c.id]; }); persist();
}
export const gradeLetter = (p)=> p==null?"—":p>=93?"A":p>=90?"A-":p>=87?"B+":p>=83?"B":p>=80?"B-":p>=77?"C+":p>=70?"C":p>=60?"D":"F";
// standards-based mastery (derived from graded work in the subject, 1–4 scale)
export function studentMastery(studentId, subject){
  const stds = db.standards[subject] || [];
  const g = studentGradeBySubject(studentId, subject);
  return stds.map((s,i)=>({ ...s, level: g==null ? 0 : Math.max(1, Math.min(4, Math.round(g/25) - (i%2))) }));
}
function studentGradeBySubject(studentId, subject){
  const ids = db.assignments.filter(a=>a.subject===subject).map(a=>a.id);
  const scores = ids.map(id=>db.grades[id]?.[studentId]).filter(v=>v!=null);
  return scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
}

// ---- Guardians: parents can see grades (the loudest Classroom gap) ----
export const studentsForGuardian = (userId)=> db.students.filter(s=>(db.guardianLinks[s.id]||[]).includes(userId));
export const guardiansForStudent = (studentId)=> db.guardianLinks[studentId] || [];
export function linkGuardian(studentId, userId){
  (db.guardianLinks[studentId] ||= []); if(!db.guardianLinks[studentId].includes(userId)) db.guardianLinks[studentId].push(userId);
  persist();
}
export function parentNotesFor(studentId){ return db.parentNotes.filter(n=>n.studentId===studentId); }

// ---- Close-the-Loop, admin-tunable ----
export const thresholds = ()=> db.thresholds;
export function setThresholds(patch){ Object.assign(db.thresholds, patch); persist(); }
// projected absence count crosses the (configurable) line?
export function crossesAbsenceThreshold(studentId){ return absenceProjection(studentId) >= db.thresholds.absences; }

// ---- persistence of AI outputs (audit trail / the loop "did something") ----
export function saveComment(studentId, body){ db.savedComments[studentId]=body; persist(); }
export function logCatchup(pack){ db.catchups.unshift({ ...pack, at:new Date().toISOString() }); persist(); }
export function sendParentNote(student, body){
  db.parentNotes.push({ studentId:student.id, name:student.name, sentAt:new Date().toISOString(), body });
  persist();
}

// ---- Migration (simulated) — the #1 reason people don't switch ----
export function importClassroom(){
  const added = [
    { name:"Priya Nair", grade:"10-A" }, { name:"Tom Becker", grade:"10-A" }, { name:"Yuki Mori", grade:"11-B" },
  ];
  added.forEach(a=> addStudent({ name:a.name, grade:a.grade, email:a.name.toLowerCase().replace(/\s+/g,".")+"@westbrook.edu", attendance:95, gpa:"3.10", risk:"ok" }));
  const asg = { title:"Imported: Chapter 4 Questions", cls:"10-A", subject:"math", due:"Imported", submitted:12 };
  addAssignment(asg);
  db.imports.unshift({ source:"Google Classroom", at:new Date().toISOString(), students:added.length, assignments:1, classes:2 });
  persist();
  return { students:added.length, assignments:1, classes:2 };
}
export function importDoc(name){
  const rec = { source:"Google Docs", name:name||"Untitled document", at:new Date().toISOString() };
  db.imports.unshift(rec);
  addLessonPlan({ subject:"english", cls:"12-B", topic:name||"Imported document", note:"Imported from Google Docs — ready to attach to a session", ready:80, resources:1 });
  persist();
  return rec;
}
export const joinCode = (cls)=> db.joinCodes[cls];
