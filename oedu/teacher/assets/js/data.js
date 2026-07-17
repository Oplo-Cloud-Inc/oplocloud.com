// ============================================================
// OEdu · Teacher — mock data (interconnected via subjects)
// ============================================================

export const school = { name: "Westbrook Academy", term: "Spring Term · 2026" };

export const teacher = {
  name: "Amir Baqian",
  role: "Senior Teacher",
  email: "a.baqian@westbrook.edu",
  initials: "AB",
  color: "violet",
};

// subject palette — the through-line of the whole product
export const subjects = {
  math:      { name: "Mathematics", short: "Math",      tint: "violet", icon: "pi" },
  physics:   { name: "Physics",     short: "Physics",   tint: "sky",    icon: "atom" },
  english:   { name: "English Lit", short: "English",   tint: "blush",  icon: "bookOpen" },
  art:       { name: "Fine Art",    short: "Art",       tint: "peach",  icon: "palette" },
  chemistry: { name: "Chemistry",   short: "Chemistry", tint: "mint",   icon: "flask" },
  biology:   { name: "Biology",     short: "Biology",   tint: "teal",   icon: "activity" },
  history:   { name: "History",     short: "History",   tint: "butter", icon: "landmark" },
  cs:        { name: "Computer Sci",short: "CS",        tint: "lilac",  icon: "code" },
};

export const tintHex = {
  violet:{bg:"#efecfc",ink:"#6a5ad6"}, sky:{bg:"#e6eefc",ink:"#4a72d8"},
  blush:{bg:"#fbe6e2",ink:"#cc6455"},  peach:{bg:"#fceadc",ink:"#c67c3c"},
  mint:{bg:"#e2f4ea",ink:"#369266"},   butter:{bg:"#fbf1d6",ink:"#b0842f"},
  teal:{bg:"#dcf1f1",ink:"#2f8f8f"},   lilac:{bg:"#f2e8fb",ink:"#9257c9"},
};

// ---- students ----
const firstNames = ["Maya","Leo","Amira","Noah","Sofia","Idris","Hana","Ethan","Zara","Omar","Lily","Kai","Nadia","Theo","Yuki","Sami","Ava","Jonas","Mira","Reza","Elif","Diego","Anya","Milo","Freya","Ravi","Lena","Tariq","Iris","Bo"];
const lastNames = ["Karim","Okafor","Silva","Bennett","Rossi","Haddad","Tanaka","Novak","Farah","Mensah","Cohen","Park","Ibrahim","Larsen","Costa","Reyes","Adler","Malik","Sato","Vargas","Osei","Khan","Dias","Weber","Ali","Roy","Nolan","Aziz","Berg","Fox"];
const avatarSeeds = ["a1","b2","c3","d4","e5","f6","g7","h8","i9","j0"];

function makeStudents(){
  const rng = seedRand(42);
  const list = [];
  const classes = ["10-A","10-B","11-A","11-B","12-A","12-B"];
  for (let i=0;i<72;i++){
    const block = Math.floor(i/30);
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i*13 + block*7) % lastNames.length];
    const grade = classes[i % classes.length];
    const attend = Math.round(78 + rng()*21);
    const gpa = +(2.6 + rng()*1.4).toFixed(2);
    list.push({
      id: "s"+(100+i),
      name: fn+" "+ln,
      initials: (fn[0]+ln[0]).toUpperCase(),
      grade,
      room: 300 + (i%6),
      attendance: attend,
      gpa,
      trend: rng()>.5 ? +(rng()*4).toFixed(1) : -+(rng()*3).toFixed(1),
      hue: Object.keys(subjects)[i % Object.keys(subjects).length],
      email: (fn+"."+ln).toLowerCase()+"@westbrook.edu",
      risk: attend < 85 ? (attend<82?"high":"watch") : "ok",
    });
  }
  return list;
}
export const students = makeStudents();

// ---- exams (per month, per period row) ----
export const examMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
export const exams = {
  Feb: [
    { period:1, cards:[
      { room:302, cls:"Class 10-A", time:"08:00", subject:"math", title:"Math Exam", grade:"Grade 12", status:"confirmed", count:19 },
      { room:303, cls:"Class 10-B", time:"09:00", subject:"physics", title:"Physics Exam", grade:"Grade 10", status:"confirmed", count:18 },
    ]},
    { period:2, cards:[] },
    { period:3, cards:[
      { room:304, cls:"Class 11-A", time:"08:00", subject:"art", title:"Art Exam", grade:"Grade 9", status:"draft", count:16 },
      { room:302, cls:"Class 10-A", time:"09:00", subject:"math", title:"Math Exam", grade:"Grade 12", status:"confirmed", count:21 },
      { room:305, cls:"Class 12-B", time:"10:00", subject:"english", title:"English Exam", grade:"Grade 11", status:"confirmed", count:17 },
    ]},
    { period:4, cards:[
      { room:301, cls:"Class 11-B", time:"09:30", subject:"chemistry", title:"Chemistry Exam", grade:"Grade 11", status:"review", count:20 },
    ]},
    { period:5, cards:[] },
    { period:6, cards:[
      { room:306, cls:"Class 12-A", time:"08:30", subject:"biology", title:"Biology Exam", grade:"Grade 12", status:"confirmed", count:22 },
      { room:302, cls:"Class 10-A", time:"11:00", subject:"history", title:"History Exam", grade:"Grade 10", status:"draft", count:19 },
    ]},
  ],
  Mar: [
    { period:1, cards:[
      { room:302, cls:"Class 10-A", time:"08:00", subject:"cs", title:"CS Practical", grade:"Grade 12", status:"confirmed", count:18 },
    ]},
    { period:2, cards:[
      { room:305, cls:"Class 12-B", time:"09:00", subject:"english", title:"English Mid-term", grade:"Grade 11", status:"review", count:17 },
      { room:303, cls:"Class 10-B", time:"10:30", subject:"physics", title:"Physics Mid-term", grade:"Grade 10", status:"confirmed", count:20 },
    ]},
    { period:3, cards:[] },
    { period:4, cards:[
      { room:301, cls:"Class 11-B", time:"08:00", subject:"chemistry", title:"Chemistry Lab", grade:"Grade 11", status:"draft", count:19 },
    ]},
  ],
  Jan: [
    { period:1, cards:[
      { room:302, cls:"Class 10-A", time:"09:00", subject:"math", title:"Diagnostic", grade:"Grade 12", status:"confirmed", count:19 },
    ]},
    { period:2, cards:[] },
    { period:3, cards:[
      { room:306, cls:"Class 12-A", time:"10:00", subject:"biology", title:"Biology Quiz", grade:"Grade 12", status:"confirmed", count:22 },
    ]},
  ],
  Apr:[{period:1,cards:[]},{period:2,cards:[]}],
  May:[{period:1,cards:[]}],
  Jun:[{period:1,cards:[]}],
  Jul:[{period:1,cards:[]}],
};

// ---- assignments ----
export const assignments = [
  { id:"as1", title:"Quadratic Functions — Problem Set 4", subject:"math", cls:"10-A", due:"Feb 14", assigned:36, submitted:31, graded:24, status:"grading" },
  { id:"as2", title:"Newton's Laws Lab Report", subject:"physics", cls:"10-B", due:"Feb 12", assigned:34, submitted:34, graded:34, status:"done" },
  { id:"as3", title:"Macbeth — Act III Essay", subject:"english", cls:"12-B", due:"Feb 18", assigned:29, submitted:12, graded:0, status:"open" },
  { id:"as4", title:"Still Life Composition", subject:"art", cls:"11-A", due:"Feb 20", assigned:26, submitted:8, graded:0, status:"open" },
  { id:"as5", title:"Titration Practical Writeup", subject:"chemistry", cls:"11-B", due:"Feb 15", assigned:30, submitted:27, graded:19, status:"grading" },
  { id:"as6", title:"Cell Division Diagram Set", subject:"biology", cls:"12-A", due:"Feb 11", assigned:32, submitted:32, graded:30, status:"grading" },
  { id:"as7", title:"WWII Causes — Source Analysis", subject:"history", cls:"10-A", due:"Feb 22", assigned:36, submitted:5, graded:0, status:"open" },
  { id:"as8", title:"Sorting Algorithms Notebook", subject:"cs", cls:"12-A", due:"Feb 09", assigned:24, submitted:24, graded:24, status:"done" },
];

// ---- schedule (weekly) ----
export const scheduleDays = [
  { d:"Mon", n:"09" }, { d:"Tue", n:"10" }, { d:"Wed", n:"11" }, { d:"Thu", n:"12" }, { d:"Fri", n:"13" },
];
export const scheduleTimes = ["08:00","09:00","10:00","11:00","13:00","14:00"];
// grid[timeIndex][dayIndex]
export const schedule = [
  [ s("math","10-A","302"), null, s("physics","10-B","303"), s("history","10-A","302"), s("cs","12-A","Lab 2") ],
  [ s("physics","10-B","303"), s("math","10-A","302"), null, s("chemistry","11-B","301"), s("math","10-A","302") ],
  [ null, s("english","12-B","305"), s("art","11-A","Studio"), s("biology","12-A","306"), s("physics","10-B","303") ],
  [ s("chemistry","11-B","301"), s("biology","12-A","306"), s("math","10-A","302"), null, s("english","12-B","305") ],
  [ s("english","12-B","305"), null, s("cs","12-A","Lab 2"), s("art","11-A","Studio"), null ],
  [ s("history","10-A","302"), s("physics","10-B","303"), null, s("math","10-A","302"), s("biology","12-A","306") ],
];
function s(subject, cls, room){ return { subject, cls, room }; }

// ---- messages ----
export const threads = [
  { id:"t1", name:"Sofia Rossi", role:"Student · 11-A", initials:"SR", hue:"blush", unread:true, time:"09:24",
    preview:"Thank you! I'll resubmit the essay tonight.",
    msgs:[
      {me:false, t:"Hi Mr. Baqian, I had a question about the Macbeth essay rubric.", time:"09:02"},
      {me:true, t:"Of course — which part is unclear?", time:"09:05"},
      {me:false, t:"The word count for the analysis section.", time:"09:07"},
      {me:true, t:"Aim for 600–800 words. Quality over length though.", time:"09:20"},
      {me:false, t:"Thank you! I'll resubmit the essay tonight.", time:"09:24"},
    ]},
  { id:"t2", name:"Parent — N. Bennett", role:"Guardian of Noah", initials:"NB", hue:"sky", unread:true, time:"08:41",
    preview:"Will Noah's absence affect the Physics exam date?",
    msgs:[
      {me:false, t:"Good morning, Noah is unwell today.", time:"08:38"},
      {me:false, t:"Will Noah's absence affect the Physics exam date?", time:"08:41"},
    ]},
  { id:"t3", name:"Dept — Science Faculty", role:"Group · 6 members", initials:"SF", hue:"mint", unread:false, time:"Yesterday",
    preview:"Lab 2 is booked for the CS practical Monday.",
    msgs:[
      {me:false, t:"Reminder: lab safety refresher due this week.", time:"Mon"},
      {me:true, t:"Booked Lab 2 for the CS practical Monday.", time:"Mon"},
    ]},
  { id:"t4", name:"Ms. Okafor", role:"Head of Year 12", initials:"MO", hue:"peach", unread:false, time:"Mon",
    preview:"Can you send the Grade 12 predicted grades?",
    msgs:[
      {me:false, t:"Can you send the Grade 12 predicted grades?", time:"Mon"},
      {me:true, t:"Sending them over by Wednesday.", time:"Mon"},
    ]},
  { id:"t5", name:"Kai Park", role:"Student · 12-A", initials:"KP", hue:"lilac", unread:false, time:"Mon",
    preview:"Got it, thanks for the extension!",
    msgs:[
      {me:false, t:"Could I get one more day on the CS notebook?", time:"Mon"},
      {me:true, t:"Sure, Tuesday is fine.", time:"Mon"},
      {me:false, t:"Got it, thanks for the extension!", time:"Mon"},
    ]},
];

// ---- student activity (for Students > Activity) ----
export const activityFeed = [
  { day:1, events:[
    { type:"assignment", label:"Assignment Sent", time:"06:45", tint:"violet", icon:"filePlus" },
    { type:"absence", label:"Absent from class", time:"08:00", tint:"butter", icon:"xCircle" },
  ]},
  { day:2, events:[] },
  { day:3, events:[
    { type:"edit", label:"Assignment edited", time:"06:45", tint:"blush", icon:"edit" },
    { type:"lesson", label:"Lesson viewed", time:"07:12", tint:"mint", icon:"eye" },
    { type:"absence", label:"Absent from class", time:"08:00", tint:"butter", icon:"xCircle" },
  ]},
  { day:4, weekend:true },
  { day:5, weekend:true },
  { day:6, events:[
    { type:"file", label:"PDF / file downloaded", time:"06:45", tint:"lilac", icon:"download" },
    { type:"security", label:"Changed account password", time:"09:10", tint:"sky", icon:"key" },
  ]},
  { day:7, events:[] },
  { day:8, events:[] },
  { day:9, events:[
    { type:"exam", label:"Exam viewed", time:"06:45", tint:"violet", icon:"exam" },
    { type:"present", label:"Present in class", time:"08:00", tint:"mint", icon:"checkCircle" },
    { type:"live", label:"Joined live session", time:"10:30", tint:"lilac", icon:"monitor" },
    { type:"study", label:"Study plan viewed", time:"14:00", tint:"peach", icon:"target" },
  ]},
];

export const upcoming = [
  { title:"Math Exam", when:"10 Feb · 07:30 → 09:00", left:"2 days", tint:"violet", icon:"exam" },
  { title:"English Exam", when:"10 Feb · 07:30 → 09:00", left:"2 days", tint:"butter", icon:"bookOpen" },
  { title:"Math Assignment", when:"12 Feb · 07:30 → 09:00", left:"4 days", tint:"sky", icon:"clipboard" },
  { title:"Parent Evening", when:"14 Feb · 16:00 → 18:30", left:"6 days", tint:"blush", icon:"users" },
];

// mini-calendar day states for February
export const febDays = (()=>{
  const rng = seedRand(7);
  const out = [];
  // Feb 2026 starts on a Sunday; grid Mon-first
  const startBlank = 6; // Mon..Sun offset for Feb 1 (Sun)
  for (let i=0;i<startBlank;i++) out.push({blank:true});
  for (let d=1; d<=28; d++){
    const marks = [];
    if (rng()>.55) marks.push("present");
    if (rng()>.86) marks.push("absent");
    if (rng()>.5) marks.push("event");
    out.push({ d, today: d===9, marks });
  }
  return out;
})();

// ---- news / activities ----
export const schoolNews = [
  { title:"Spring Science Fair — Registration Open", cat:"Announcement", tint:"mint", icon:"flask", date:"Feb 8", excerpt:"Students across all years can now register projects for the March showcase in the main hall." },
  { title:"New Digital Library Access", cat:"Resource", tint:"sky", icon:"book", date:"Feb 6", excerpt:"Every class now has access to 12,000 e-titles and journal archives through the student portal." },
  { title:"Staff Development Day — Feb 21", cat:"Schedule", tint:"violet", icon:"calendar", date:"Feb 5", excerpt:"No classes Friday. Workshops on assessment design and inclusive teaching run 09:00–15:00." },
  { title:"Athletics Team Reaches Regionals", cat:"Highlight", tint:"peach", icon:"trophy", date:"Feb 3", excerpt:"Congratulations to the Year 11 track squad, advancing to the regional finals next month." },
];
export const schoolActivities = [
  { title:"Debate Club", when:"Tue · 16:00", place:"Room 214", tint:"blush", icon:"chat", members:22 },
  { title:"Robotics Lab", when:"Wed · 15:30", place:"Lab 2", tint:"lilac", icon:"code", members:18 },
  { title:"Art Studio Open", when:"Thu · 16:00", place:"Studio", tint:"peach", icon:"palette", members:15 },
  { title:"Chess Society", when:"Fri · 12:30", place:"Library", tint:"teal", icon:"target", members:12 },
  { title:"Choir", when:"Mon · 16:30", place:"Music Hall", tint:"violet", icon:"music", members:31 },
  { title:"Coding Club", when:"Wed · 16:00", place:"Lab 1", tint:"sky", icon:"monitor", members:20 },
];
export const whatsNew = [
  { title:"Rubric-based grading", tag:"New", tint:"violet", icon:"award", body:"Build reusable rubrics and grade assignments criterion by criterion, with auto-tallied scores." },
  { title:"Live attendance sync", tag:"Improved", tint:"mint", icon:"refresh", body:"Attendance now syncs to the parent portal in real time — no more end-of-day exports." },
  { title:"Exam conflict detector", tag:"New", tint:"blush", icon:"zap", body:"OEdu flags room and cohort clashes as you schedule, before they reach the calendar." },
  { title:"Analytics: cohort compare", tag:"Beta", tint:"sky", icon:"chart", body:"Compare performance across classes and terms with side-by-side distribution views." },
];

// ---- analytics ----
export const attendanceTrend = [92, 94, 91, 95, 93, 96, 94, 97, 95, 96, 94, 98];
export const gradeDistribution = [
  { band:"A", value:14, tint:"mint" },
  { band:"B", value:19, tint:"sky" },
  { band:"C", value:9, tint:"butter" },
  { band:"D", value:4, tint:"peach" },
  { band:"E", value:2, tint:"blush" },
];
export const classPerformance = [
  { cls:"10-A", subject:"math", avg:78, attendance:96 },
  { cls:"10-B", subject:"physics", avg:74, attendance:93 },
  { cls:"11-A", subject:"art", avg:83, attendance:95 },
  { cls:"11-B", subject:"chemistry", avg:71, attendance:91 },
  { cls:"12-A", subject:"biology", avg:80, attendance:97 },
  { cls:"12-B", subject:"english", avg:76, attendance:94 },
];

// ---- overview: today's timeline ----
export const todayTimeline = [
  { time:"08:00", title:"Mathematics · 10-A", room:"Room 302", subject:"math", state:"done" },
  { time:"09:00", title:"Physics · 10-B", room:"Room 303", subject:"physics", state:"done" },
  { time:"10:00", title:"Free · Grading window", room:"Staff room", subject:null, state:"done" },
  { time:"11:00", title:"English Lit · 12-B", room:"Room 305", subject:"english", state:"now" },
  { time:"13:00", title:"Chemistry · 11-B", room:"Room 301", subject:"chemistry", state:"next" },
  { time:"14:00", title:"History · 10-A", room:"Room 302", subject:"history", state:"next" },
];

export const classPrep = [
  { subject:"math", cls:"10-A", topic:"Completing the Square", ready:100, resources:5, note:"Slides + worked examples ready" },
  { subject:"english", cls:"12-B", topic:"Macbeth — Ambition & Guilt", ready:70, resources:3, note:"Add close-reading handout" },
  { subject:"chemistry", cls:"11-B", topic:"Acid–Base Titration", ready:45, resources:2, note:"Lab safety sheet pending" },
  { subject:"history", cls:"10-A", topic:"Causes of WWII", ready:30, resources:1, note:"Source pack to compile" },
  { subject:"physics", cls:"10-B", topic:"Momentum & Impulse", ready:85, resources:4, note:"Demo equipment booked" },
  { subject:"biology", cls:"12-A", topic:"Meiosis", ready:60, resources:3, note:"Diagram set drafting" },
];

// ---- deterministic pseudo-random ----
function seedRand(seed){
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Three surfaces. One primitive: the session.
export const nav = [
  { id:"today", label:"Today", icon:"home", kbd:["⌘","D"] },
  { id:"roster", label:"Roster", icon:"users" },
  { id:"library", label:"Library", icon:"bookOpen" },
];

// The app's canonical "now": Wednesday, 11 Feb 2026, 11:20am
export const APP = {
  today: "2026-02-11",
  todayLabel: "Wednesday, 11 February",
  nowMin: 11*60 + 20,
  week: [ // Mon–Fri of the current week
    { d:"Mon", date:"2026-02-09" }, { d:"Tue", date:"2026-02-10" },
    { d:"Wed", date:"2026-02-11" }, { d:"Thu", date:"2026-02-12" }, { d:"Fri", date:"2026-02-13" },
  ],
};
