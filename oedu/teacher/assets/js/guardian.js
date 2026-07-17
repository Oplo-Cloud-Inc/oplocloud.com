// ============================================================
// OEdu · Family — the parent surface. Everything a parent needs, and beyond.
// Grades (a real report card), attendance, missing & upcoming work,
// plain-language insights, this week's schedule, notes from school,
// and one-tap ways to reach a teacher. Warm, glanceable, reassuring.
// Read-mostly: guardians never edit school data.
// ============================================================
import { icon } from "./icons.js";
import { esc, avatar, tintStyle, subjIcon, sparkline, toast } from "./ui.js";
import { formModal } from "./modal.js";
import * as S from "./store.js";
import * as D from "./data.js";

const pageEl = ()=>{ const n=document.createElement("div"); n.className="page fam"; return n; };

// ---- deterministic synth (stable per student) ----
const seedOf = (str)=>{ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; };
function rng(seed){ let t=seed>>>0; return ()=>{ t=(t+0x6D2B79F5)>>>0; let x=Math.imul(t^(t>>>15), t|1); x^=x+Math.imul(x^(x>>>7), x|61); return ((x^(x>>>14))>>>0)/4294967296; }; }
const clamp = (n,lo=0,hi=100)=> Math.max(lo,Math.min(hi,Math.round(n)));

// A parent sees a full report card, not just one teacher's subject.
const SUBJECTS = [
  { key:"math",     name:"Mathematics" },
  { key:"english",  name:"English" },
  { key:"chemistry",name:"Science" },
  { key:"history",  name:"History" },
  { key:"art",      name:"Art" },
  { key:"cs",       name:"Computing" },
];
const gradeTint = (p)=> p==null?"line":p>=90?"mint":p>=80?"sky":p>=70?"butter":p>=60?"peach":"blush";
const fmtWhen = (iso)=>{ try{ return new Date(iso).toLocaleDateString([], {month:"short", day:"numeric"}); }catch{ return ""; } };

// per-subject grade: real where this teacher grades the child's class, else synthesized around GPA
function reportCard(s){
  const r = rng(seedOf(s.id+"rc"));
  const base = (+s.gpa/4)*100;
  const realSubj = (S.sessions.find(x=>x.cls===s.grade)?.subject);
  return SUBJECTS.map((su,i)=>{
    let pct;
    if (su.key===realSubj){ const g=S.studentGrade(s.grade, s.id).pct; pct = g!=null?g:clamp(base + (r()*16-8)); }
    else pct = clamp(base + (r()*20-10));
    const trend = +(r()*10-4).toFixed(1);
    return { ...su, pct, letter:S.gradeLetter(pct), trend };
  });
}
const overallOf = (rc)=> Math.round(rc.reduce((a,x)=>a+x.pct,0)/rc.length);

function gradeTrend(s){
  const r = rng(seedOf(s.id+"tr")); const end=(+s.gpa/4)*100; const out=[];
  let v = end - (r()*10);
  for(let i=0;i<9;i++){ v += (r()*6-2.4); out.push(clamp(v,45,99)); }
  out[out.length-1]=clamp(end); return out;
}

function work(s){
  const r = rng(seedOf(s.id+"wk")); const out=[];
  const titles = {
    math:["Problem Set 7","Quadratics quiz","Chapter 5 review"], english:["Macbeth essay","Reading response","Vocab quiz"],
    chemistry:["Titration lab report","Periodic table quiz","Reactions worksheet"], history:["WWII source analysis","Timeline project"],
    art:["Still-life study","Color theory sheet"], cs:["Loops exercise","Debugging task"],
  };
  SUBJECTS.forEach(su=>{ (titles[su.key]||[]).forEach((t)=>{
    const dice = r();
    let status, score=null, due, feedback=null;
    if (dice<0.16){ status="missing"; due="Overdue · "+["Feb 5","Feb 6","Feb 7"][Math.floor(r()*3)]; }
    else if (dice<0.42){ status="upcoming"; due="Due "+["Fri Feb 13","Mon Feb 16","Wed Feb 18"][Math.floor(r()*3)]; }
    else if (dice<0.58){ status="submitted"; due="Turned in · awaiting grade"; }
    else { status="graded"; score=clamp((+s.gpa/4)*100 + (r()*22-10)); due="Returned "+["Feb 3","Feb 6","Feb 9"][Math.floor(r()*3)];
      if (r()>0.55) feedback = score>=85?"Excellent work — clear reasoning throughout.":score>=70?"Solid. Watch the last step next time.":"Let's review this together — come to office hours."; }
    out.push({ subject:su.key, subjectName:su.name, title:t, status, score, due, feedback });
  }); });
  return out;
}

// last 20 school days (weekdays) ending "today", statuses reflecting attendance %
function attendanceDays(s){
  const r = rng(seedOf(s.id+"att")); const days=[];
  const absTarget = Math.round((100 - s.attendance)/100 * 20);
  let placedAbs=0, placedLate=0;
  for(let i=19;i>=0;i--){
    let status="present"; const d=r();
    if (placedAbs<absTarget && d<0.28){ status="absent"; placedAbs++; }
    else if (placedLate<2 && d>0.9){ status="late"; placedLate++; }
    days.push({ status });
  }
  return days;
}

function insights(s, rc, wk){
  const attention=[], celebrate=[];
  const missing = wk.filter(w=>w.status==="missing");
  const worst = [...rc].sort((a,b)=>a.pct-b.pct)[0];
  const best  = [...rc].sort((a,b)=>b.pct-a.pct)[0];
  if (missing.length) attention.push({ ic:"clipboard", text:`${missing.length} assignment${missing.length>1?"s":""} missing`, sub:`${[...new Set(missing.map(m=>m.subjectName))].join(", ")} — turning these in would lift the grade.` });
  if (s.attendance<86) attention.push({ ic:"clock", text:`Attendance is ${s.attendance}%`, sub:`A few too many absences — they add up across the term.` });
  if (worst.pct<72) attention.push({ ic:"trendUp", text:`${worst.name} needs attention`, sub:`Currently ${worst.pct}% (${worst.letter}). A short check-in with the teacher could help.` });
  if (s.attendance>=95) celebrate.push({ ic:"star", text:`On a strong attendance streak`, sub:`${s.attendance}% this term — here almost every day.` });
  if (best.pct>=90) celebrate.push({ ic:"trophy", text:`Top marks in ${best.name}`, sub:`${best.pct}% (${best.letter}) — genuinely excelling here.` });
  if (best.trend>3) celebrate.push({ ic:"trendUp", text:`${best.name} is climbing`, sub:`Up ${best.trend} points recently — the effort is showing.` });
  return { attention: attention.slice(0,3), celebrate: celebrate.slice(0,2) };
}

function weekSchedule(s){
  return S.sessions.filter(x=>x.cls===s.grade).slice(0,6)
    .map(x=>({ subject:x.subject, name:D.subjects[x.subject]?.name||x.subject, day:x.weekday, time:x.time, room:x.room }));
}

function parentSummary(s, rc, overall){
  const first = s.name.split(" ")[0];
  const feel = overall>=88?"doing really well":overall>=78?"doing solidly":overall>=68?"holding steady":"finding this term a challenge";
  const att = s.attendance>=95?`Attendance is excellent at ${s.attendance}%.`:s.attendance>=88?`Attendance is good (${s.attendance}%).`:`The one thing to watch is attendance, at ${s.attendance}%.`;
  const best = [...rc].sort((a,b)=>b.pct-a.pct)[0];
  return `${first} is ${feel} this term — currently ${S.gradeLetter(overall)} (${overall}%) overall, and strongest in ${best.name}. ${att} You're seeing everything here the moment it happens — no waiting for a report card.`;
}

// ============================================================
// FAMILY HOME — all your children, and this week at a glance
// ============================================================
export function home(ctx){
  const kids = S.studentsForGuardian(ctx.user.id);
  const first = ctx.user.name.split(" ")[0];
  const node = pageEl();

  const kidCard = (s)=>{
    const rc = reportCard(s); const overall = overallOf(rc); const wk = work(s);
    const missing = wk.filter(w=>w.status==="missing").length;
    const notes = S.parentNotesFor(s.id).length;
    return `<button class="fam-kid card" data-id="${s.id}" style="${tintStyle(gradeTint(overall))}">
      <div class="fam-kid-top">${avatar(s.name,s.initials,s.hue,52)}
        <div class="grow"><div class="fam-kid-name">${esc(s.name)}</div><div class="muted">Class ${esc(s.grade)} · Westbrook Academy</div></div>
        <div class="fam-grade"><b>${S.gradeLetter(overall)}</b><span>${overall}%</span></div></div>
      <div class="fam-kid-stats">
        <div><span class="muted">Attendance</span><b class="${s.attendance<86?'is-warn':''}">${s.attendance}%</b></div>
        <div><span class="muted">Missing work</span><b class="${missing?'is-warn':''}">${missing}</b></div>
        <div><span class="muted">Notes</span><b>${notes}</b></div>
      </div>
      <div class="fam-kid-cta">Open full report ${icon("chevR")}</div>
    </button>`;
  };

  // family digest across all children
  const allMissing = kids.reduce((a,s)=>a+work(s).filter(w=>w.status==="missing").length,0);
  const anyLowAtt = kids.filter(s=>s.attendance<86).length;

  node.innerHTML = `
    <header class="page-head">
      <div class="page-eyebrow">${icon("heart")} OEdu Family</div>
      <h1 class="page-title">Hi ${esc(first)}.</h1>
      <p class="page-sub">Everything your ${kids.length>1?`${kids.length} children are`:"child is"} doing at Westbrook — grades, attendance, and what's coming up.</p>
    </header>
    ${kids.length ? `
      <div class="fam-digest card card-pad" style="${tintStyle(allMissing||anyLowAtt?'butter':'mint')}">
        <span class="fam-digest-ic">${icon(allMissing||anyLowAtt?"bell":"check")}</span>
        <div class="grow"><b>This week</b>
          <div class="muted">${allMissing||anyLowAtt
            ? `${allMissing?`${allMissing} assignment${allMissing>1?"s":""} missing`:""}${allMissing&&anyLowAtt?" · ":""}${anyLowAtt?`${anyLowAtt} with low attendance`:""} — worth a look below.`
            : `Everyone's on track. Grades are up to date and attendance looks good.`}</div></div>
      </div>
      <div class="fam-kids">${kids.map(kidCard).join("")}</div>`
    : `<div class="empty"><div class="e-ic">${icon("heart")}</div><h4>No student linked yet</h4><p>Ask your school to connect your account to your child.</p></div>`}`;
  node.querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>ctx.go("gchild",{id:b.dataset.id})));
  return { crumbs:[{label:"Family", icon:"heart"}], node };
}

// ============================================================
// CHILD — the super-max report: everything, in one warm scroll
// ============================================================
export function child(ctx){
  const s = S.db.students.find(x=>x.id===ctx.params.id);
  const node = pageEl();
  if (!s || !(S.guardiansForStudent(s.id)||[]).includes(ctx.user.id)){
    node.innerHTML = `<div class="empty"><div class="e-ic">${icon("lock")}</div><h4>Not available</h4><p>You don't have access to this student.</p></div>`;
    return { crumbs:[{label:"Family", icon:"heart", go:"ghome"}], node };
  }
  const first = s.name.split(" ")[0];
  const rc = reportCard(s); const overall = overallOf(rc);
  const wk = work(s);
  const missing = wk.filter(w=>w.status==="missing");
  const upcoming = wk.filter(w=>w.status==="upcoming");
  const graded = wk.filter(w=>w.status==="graded");
  const days = attendanceDays(s);
  const absent = days.filter(d=>d.status==="absent").length;
  const late = days.filter(d=>d.status==="late").length;
  const ins = insights(s, rc, wk);
  const notes = S.parentNotesFor(s.id);
  const week = weekSchedule(s);
  const subjKey = (S.sessions.find(x=>x.cls===s.grade)?.subject) || "math";
  const mastery = S.studentMastery(s.id, subjKey);

  const workRow = (w)=>`<div class="work-item">
      ${subjIcon(w.subject)}
      <div class="grow"><b>${esc(w.title)}</b><span class="muted">${esc(w.subjectName)} · ${esc(w.due)}</span>
        ${w.feedback?`<div class="work-fb">${icon("chat")}${esc(w.feedback)}</div>`:""}</div>
      ${w.status==="graded"?`<span class="tag" style="${tintStyle(gradeTint(w.score))}">${w.score}% · ${S.gradeLetter(w.score)}</span>`
        :`<span class="work-badge ${w.status}">${w.status==="missing"?"Missing":w.status==="upcoming"?"Upcoming":"Submitted"}</span>`}
    </div>`;

  node.innerHTML = `
    <button class="back-link" id="back">${icon("chevL")}All children</button>

    <section class="fam-hero" id="sec-overview" style="${tintStyle(gradeTint(overall))}">
      <div class="fam-hero-top">
        ${avatar(s.name,s.initials,s.hue,60)}
        <div class="grow"><h1 class="fam-hero-name">${esc(s.name)}</h1>
          <div class="muted">Class ${esc(s.grade)} · Westbrook Academy</div></div>
        <div class="fam-hero-grade"><b>${S.gradeLetter(overall)}</b><span>${overall}% overall</span></div>
      </div>
      <div class="fam-summary">${icon("sparkle")}<p>${esc(parentSummary(s, rc, overall))}</p></div>
    </section>

    <nav class="fam-subnav" id="subnav">
      ${[["sec-insights","What to know"],["sec-grades","Grades"],["sec-attend","Attendance"],["sec-work","Work"],["sec-week","Schedule"],["sec-notes","From school"]]
        .map(([id,l],i)=>`<button data-jump="${id}" class="${i===0?'on':''}">${l}</button>`).join("")}
    </nav>

    <section id="sec-insights" class="fam-section">
      ${ins.attention.map(a=>`<div class="insight attention"><span class="insight-ic">${icon(a.ic)}</span>
        <div class="grow"><b>${esc(a.text)}</b><span class="muted">${esc(a.sub)}</span></div>
        <button class="btn btn-sm btn-soft" data-msg>${icon("mail")}Ask</button></div>`).join("")}
      ${ins.celebrate.map(c=>`<div class="insight celebrate"><span class="insight-ic">${icon(c.ic)}</span>
        <div class="grow"><b>${esc(c.text)}</b><span class="muted">${esc(c.sub)}</span></div></div>`).join("")}
      ${!ins.attention.length&&!ins.celebrate.length?`<div class="insight celebrate"><span class="insight-ic">${icon("check")}</span>
        <div class="grow"><b>All good right now</b><span class="muted">Nothing needs your attention this week.</span></div></div>`:""}
    </section>

    <div class="fam-quad">
      ${[["award",gradeTint(overall),`${S.gradeLetter(overall)}`,"Overall grade"],
         ["clock",s.attendance<86?'blush':'mint',`${s.attendance}%`,"Attendance"],
         ["clipboard",missing.length?'peach':'mint',`${missing.length}`,"Missing"],
         ["calendar","sky",`${upcoming.length}`,"Due soon"]].map(([ic,t,v,l])=>
        `<div class="fam-quad-tile" style="${tintStyle(t)}"><div class="fq-ic">${icon(ic)}</div><div class="fq-val">${v}</div><div class="fq-label">${l}</div></div>`).join("")}
    </div>

    <section id="sec-grades" class="fam-section">
      <h3 class="fam-h">Report card</h3>
      <div class="card card-pad">
        <div class="card-head"><div class="grow"><div class="card-title">Grade trend</div>
          <div class="card-sub">Overall grade over recent weeks.</div></div>
          <b class="mono" style="font-size:20px;color:${gradeTint(overall)==='line'?'var(--ink)':`var(--${gradeTint(overall)}-ink)`}">${overall}%</b></div>
        ${sparkline(gradeTrend(s), { w:640, h:90, tint:gradeTint(overall) })}
      </div>
      <div class="subj-grades">${rc.map(su=>`<div class="subj-grade card" style="${tintStyle(gradeTint(su.pct))}">
        <div class="row" style="gap:10px;align-items:center">${subjIcon(su.key,"lg")}
          <div class="grow"><b>${esc(su.name)}</b>
            <div class="muted" style="font-size:12px">${su.trend>=0?'▲':'▼'} ${Math.abs(su.trend)} pts</div></div>
          <div class="subj-letter"><b>${su.letter}</b><span>${su.pct}%</span></div></div>
        <div class="progress" style="height:7px;margin-top:12px"><i style="width:${su.pct}%"></i></div>
      </div>`).join("")}</div>
      <div class="card card-pad mt-16">
        <div class="card-head"><div class="grow"><div class="card-title">Standards mastery · ${esc(D.subjects[subjKey].name)}</div>
          <div class="card-sub">How ${esc(first)} is progressing on key skills. 1 beginning · 4 advanced.</div></div></div>
        ${mastery.map(m=>`<div class="std-row"><div class="grow"><b>${esc(m.label)}</b> <span class="muted mono" style="font-size:11px">${esc(m.code)}</span></div>
          <span class="mastery m${m.level}">${m.level||"·"}</span></div>`).join("")}
      </div>
    </section>

    <section id="sec-attend" class="fam-section">
      <h3 class="fam-h">Attendance</h3>
      <div class="card card-pad">
        <div class="row" style="gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
          <div class="att-big"><b style="color:var(--${s.attendance<86?'blush':'mint'}-ink)">${s.attendance}%</b><span>this term</span></div>
          <div class="att-counts">
            <div><span class="dot present"></span>${20-absent-late} present</div>
            <div><span class="dot late"></span>${late} late</div>
            <div><span class="dot absent"></span>${absent} absent</div>
          </div>
        </div>
        <div class="att-heat">${days.map(d=>`<span class="att-cell ${d.status}" title="${d.status}"></span>`).join("")}</div>
        <div class="muted" style="font-size:12.5px;margin-top:10px">Last 20 school days · ${s.attendance>=90?`${first} is here consistently.`:s.attendance>=86?`A few absences to keep an eye on.`:`Enough missed class to affect progress — the school may reach out.`}</div>
      </div>
    </section>

    <section id="sec-work" class="fam-section">
      <h3 class="fam-h">Homework & assignments</h3>
      ${missing.length?`<div class="card card-pad work-group missing-group">
        <div class="card-head"><div class="grow"><div class="card-title">${icon("flag")} Missing — needs turning in</div></div></div>
        ${missing.map(workRow).join("")}</div>`:""}
      ${upcoming.length?`<div class="card card-pad work-group mt-16">
        <div class="card-head"><div class="grow"><div class="card-title">Due soon</div></div></div>
        ${upcoming.map(workRow).join("")}</div>`:""}
      <div class="card card-pad work-group mt-16">
        <div class="card-head"><div class="grow"><div class="card-title">Recently graded</div>
          <div class="card-sub">Grades the moment they're returned — with the teacher's feedback.</div></div></div>
        ${graded.length?graded.map(workRow).join(""):`<p class="muted" style="font-size:14px">No graded work yet this term.</p>`}
      </div>
    </section>

    <section id="sec-week" class="fam-section">
      <h3 class="fam-h">This week's classes</h3>
      <div class="fam-week">${week.map(w=>`<div class="fam-week-item" style="${tintStyle(D.subjects[w.subject].tint)}">
        ${subjIcon(w.subject)}<div class="grow"><b>${esc(w.name)}</b><span class="muted">${esc(w.day)} · ${esc(w.time)} · Room ${esc(w.room)}</span></div></div>`).join("")}</div>
    </section>

    <section id="sec-notes" class="fam-section">
      <h3 class="fam-h">From school</h3>
      <div class="card card-pad">
        <div class="card-head"><div class="grow"><div class="card-title">Notes about ${esc(first)}</div>
          <div class="card-sub">Specific messages, sent when something happens — not a weekly digest.</div></div></div>
        ${notes.length?notes.map(n=>`<div class="g-note"><span class="g-note-ic">${icon("mail")}</span>
          <div class="grow"><div class="g-note-body">${esc(n.body||`A note about ${first} was sent home.`)}</div>
            <div class="muted" style="font-size:12px;margin-top:6px">Sent ${fmtWhen(n.sentAt)} · from ${esc(S.db.teacher.name)}</div></div></div>`).join("")
          :`<p class="muted" style="font-size:14px">No notes right now. You'll see anything the school sends here.</p>`}
      </div>
      <div class="fam-actions">
        <button class="btn btn-primary" id="fam-msg">${icon("mail")}Message a teacher</button>
        <button class="btn btn-soft" id="fam-conf">${icon("calendar")}Request a conference</button>
      </div>
    </section>`;

  node.querySelector("#back").onclick=()=>ctx.go("ghome");
  // sticky sub-nav scroll + active state
  const scroller = ()=> node.closest(".scroll") || document.getElementById("scroll");
  node.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>{
    node.querySelector("#"+b.dataset.jump)?.scrollIntoView({behavior:"smooth", block:"start"});
    node.querySelectorAll("#subnav button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
  }));
  const msg = (subject)=>formModal({ title:"Message a teacher", subtitle:`About ${s.name} · Westbrook Academy`,
    fields:[
      { name:"to", label:"Teacher", type:"select", options:rc.map(su=>({value:su.name,label:su.name+" teacher"})), value:subject||rc[0].name },
      { name:"body", label:"Message", type:"textarea", required:true, placeholder:`Hi, I wanted to check in about ${first}…` },
    ], submitLabel:"Send message", onSubmit:(v,close)=>{ close(); toast("Message sent to the school"); }});
  node.querySelector("#fam-msg").onclick=()=>msg();
  node.querySelectorAll("[data-msg]").forEach(b=>b.addEventListener("click",()=>msg()));
  node.querySelector("#fam-conf").onclick=()=>formModal({ title:"Request a conference", subtitle:`A short meeting about ${s.name}`,
    fields:[
      { name:"when", label:"Preferred time", type:"select", options:["This week","Next week","Any afternoon","Any morning"], value:"This week" },
      { name:"note", label:"Anything to add?", type:"textarea", placeholder:"Optional" },
    ], submitLabel:"Send request", onSubmit:(v,close)=>{ close(); toast("Conference request sent"); }});
  return { crumbs:[{label:"Family", icon:"heart", go:"ghome"},{label:first}], node };
}
