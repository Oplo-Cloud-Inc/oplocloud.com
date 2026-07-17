// ============================================================
// Views — functional. Each returns { crumbs:[{label,icon?}], node }
// Reads/writes the persistent store; real forms, grading, exports.
// ============================================================
import { icon } from "./icons.js";
import {
  h, esc, tintStyle, tintInk, subjIcon, subjTag, avatar,
  sparkline, donut, bars, toast, download, toCSV
} from "./ui.js";
import * as D from "./data.js";
import * as S from "./store.js";
import { modal, formModal, confirmModal, aiModal } from "./modal.js";

const pageEl = (cls="") => h(`<div class="page ${cls}"></div>`);

function pageHead({ eyebrow, title, sub, actions }){
  return `<header class="page-head">
    <div class="row" style="align-items:flex-start">
      <div class="grow">
        ${eyebrow?`<div class="page-eyebrow">${eyebrow}</div>`:""}
        <h1 class="page-title">${esc(title)}</h1>
        ${sub?`<p class="page-sub">${esc(sub)}</p>`:""}
      </div>
      ${actions?`<div class="row" style="gap:10px">${actions}</div>`:""}
    </div>
  </header>`;
}

// small action sheet built on the modal system
function sheet(title, items){
  const body = `<div class="stack" style="gap:8px;padding-bottom:6px">${items.map((it,i)=>
    `<button class="sheet-item ${it.danger?'danger':''}" data-i="${i}">${icon(it.icon||'chevR')}<span>${esc(it.label)}</span></button>`).join("")}</div>`;
  modal({ title, bodyHTML:body, onMount:(layer,close)=>{
    layer.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ close(); items[+b.dataset.i].onClick(); });
  }});
}

const fmtTime = (t)=>{ if(!t) return ""; const [H,M]=String(t).split(":").map(Number);
  const ap=H<12?"am":"pm"; const h=((H+11)%12)+1; return `${h}:${String(M).padStart(2,"0")} ${ap}`; };
const bandOf = (v)=>{ v=+v; return v>=80?'A':v>=70?'B':v>=60?'C':v>=50?'D':'E'; };
const bandTint = { A:"mint", B:"sky", C:"butter", D:"peach", E:"blush" };

// ============================================================
// OVERVIEW
// ============================================================
export function overview(ctx){
  const db = S.db;
  const hour = new Date().getHours();
  const greet = hour<12 ? "Good morning" : hour<18 ? "Good afternoon" : "Good evening";
  const node = pageEl();

  const queue = db.assignments.map(S.assignmentView).filter(a=>a.status!=="done");
  const toGrade = queue.reduce((n,a)=>n+(a.submitted-a.graded),0);
  const att = S.attendanceToday();
  const examCount = (db.exams["Feb"]||[]).reduce((n,r)=>n+r.cards.length,0);

  const stats = [
    { ic:"users", tint:"violet", val:String(db.students.length), label:"Active students", trend:"+3.2%", up:true, note:"vs last term" },
    { ic:"clock", tint:"mint", val: att.rate!=null?att.rate+"%":"—", label:"Attendance today", trend: att.total?`${att.total} marked`:"Not taken", up:true, plain:true },
    { ic:"clipboard", tint:"peach", val:String(toGrade), label:"To grade", trend:queue.length+" open", plain:true },
    { ic:"exam", tint:"sky", val:String(examCount), label:"Exams this month", trend:"February", plain:true },
  ];

  node.innerHTML = `
    ${pageHead({ eyebrow:`${icon("sparkle")} ${esc(D.school.term)}`, title:"Overview",
      sub:"Your teaching day at a glance — classes, grading, and what needs you next." ,
      actions:`<button class="btn btn-ghost" data-act="prep">${icon("book")}Prep a lesson</button>
               <button class="btn btn-primary" data-act="new-exam">${icon("plus")}New exam</button>`})}

    <section class="hero mb-24">
      <div class="hero-greet">${greet}, ${esc(db.teacher.name.split(" ")[0])}.</div>
      <p class="hero-sub">You have <b>3 classes</b> left today and <b>English Lit · 12-B</b> is in session in Room 305. ${toGrade} submissions are waiting to be graded.</p>
      <div class="hero-meta">
        <span class="chip"><i>${icon("clock")}</i>11:00 · English Lit</span>
        <span class="chip"><i>${icon("mapPin")}</i>Room 305</span>
        <span class="chip"><i>${icon("users")}</i>17 students</span>
      </div>
    </section>

    <section class="stat-grid mb-24">
      ${stats.map(s=>`
        <div class="stat" style="${tintStyle(s.tint)}">
          <div class="s-top"><div class="s-ic">${icon(s.ic)}</div></div>
          <div class="s-val tnum">${s.val}</div>
          <div class="s-label">${s.label}</div>
          <div class="s-trend ${s.plain?'':(s.up?'up':'down')}">
            ${s.plain?"":icon("trendUp")}<span class="${s.plain?'muted':''}">${s.trend}</span>
            ${s.note?`<span class="muted">${s.note}</span>`:""}
          </div>
        </div>`).join("")}
    </section>

    <div class="with-rail">
      <div class="stack">
        <section class="card card-pad">
          <div class="card-head">
            <div class="grow"><div class="card-title">Today's schedule</div>
              <div class="card-sub">Wednesday, 11 February</div></div>
            <span class="status ok">${icon("play")}In session</span>
          </div>
          <div class="timeline">
            ${D.todayTimeline.map(t=>{
              const st = t.subject ? tintStyle(D.subjects[t.subject]?.tint) : "";
              return `<div class="tl-item ${t.state==='now'?'now':''}" style="${st}">
                <div class="tl-dot"></div>
                <div class="tl-time">${t.time}${t.state==='now'?' · now':t.state==='next'?' · up next':''}</div>
                <div class="tl-card" data-tl="${esc(t.title)}">
                  ${t.subject?subjIcon(t.subject):`<span class="subj-ic">${icon("clock")}</span>`}
                  <div class="grow"><b style="font-weight:600">${esc(t.title)}</b>
                    <div class="muted" style="font-size:12.5px">${esc(t.room)}</div></div>
                  ${t.state==='done'?`<span class="chip"><i>${icon("check")}</i>Done</span>`:
                    t.state==='now'?`<button class="btn btn-sm btn-primary" data-act="attendance">Take attendance</button>`:
                    `<span class="chip">Upcoming</span>`}
                </div>
              </div>`;
            }).join("")}
          </div>
        </section>

        <section class="card card-pad">
          <div class="card-head">
            <div class="grow"><div class="card-title">Grading queue</div>
              <div class="card-sub">${toGrade} submissions to grade</div></div>
            <button class="btn btn-sm btn-soft" data-act="assignments">Open all${icon("arrowRight")}</button>
          </div>
          <div>
            ${queue.slice(0,4).map(a=>`
              <div class="list-row" data-grade="${a.id}">
                ${subjIcon(a.subject)}
                <div class="lr-grow">
                  <b style="font-weight:600">${esc(a.title)}</b>
                  <div class="row" style="gap:8px;margin-top:3px">${subjTag(a.subject)}
                    <span class="muted" style="font-size:12.5px">Class ${a.cls} · due ${a.due}</span></div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:600;font-size:14px">${Math.max(a.submitted-a.graded,0)} left</div>
                  <div class="muted" style="font-size:12px">${a.graded}/${a.submitted} graded</div>
                </div>
              </div>`).join("") || `<div class="muted" style="padding:20px 0">All caught up — nothing to grade. 🎉</div>`}
          </div>
        </section>
      </div>

      <aside class="rail">
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Class readiness</div></div>
          ${db.classPrep.slice(0,4).map(p=>`
            <div style="margin-bottom:16px">
              <div class="row" style="gap:9px;margin-bottom:8px">
                ${subjIcon(p.subject)}
                <div class="grow" style="min-width:0">
                  <b style="font-weight:600;font-size:13.5px">${esc(p.topic)}</b>
                  <div class="muted" style="font-size:12px">${esc(p.cls)} · ${p.resources} resources</div>
                </div>
                <b class="mono" style="font-size:13px;color:${tintInk(D.subjects[p.subject].tint)}">${p.ready}%</b>
              </div>
              <div class="progress" style="${tintStyle(D.subjects[p.subject].tint)}"><i style="width:${p.ready}%"></i></div>
            </div>`).join("")}
          <button class="btn btn-sm btn-soft" style="width:100%" data-act="prep">Open Class Preparation</button>
        </section>

        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Upcoming</div></div>
          ${D.upcoming.slice(0,3).map(u=>`
            <div class="up-item" style="${tintStyle(u.tint)}">
              <div class="u-ic">${icon(u.icon)}</div>
              <div class="u-body"><div class="u-title">${esc(u.title)}</div>
                <div class="u-meta">${esc(u.when)}</div></div>
              <span class="u-left">${esc(u.left)}</span>
            </div>`).join("")}
        </section>
      </aside>
    </div>`;

  node.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",()=>{
    const a=b.dataset.act;
    if (a==="prep") ctx.go("prep");
    else if (a==="assignments") ctx.go("assignments");
    else if (a==="attendance") ctx.go("attendance");
    else if (a==="new-exam") newExamForm(ctx);
  }));
  node.querySelectorAll("[data-grade]").forEach(r=>r.addEventListener("click",()=>{
    const a=S.db.assignments.find(x=>x.id===r.dataset.grade); if(a) openGrader(a, ctx);
  }));
  node.querySelectorAll("[data-tl]").forEach(c=>c.addEventListener("click",()=>{
    if(!c.querySelector("[data-act]")) return;
  }));
  return { crumbs:[{label:"Overview", icon:"grid"}], node };
}

// ============================================================
// EXAMS
// ============================================================
let examMonth = "Feb";
function newExamForm(ctx, month=examMonth){
  const roster = S.classRoster("10-A").length || 20;
  formModal({
    title:"New exam", subtitle:"Schedule an exam on the calendar.",
    fields:[
      { name:"title", label:"Exam name", value:"Math Exam", required:true, half:true },
      { name:"subject", label:"Subject", type:"subject", value:"math", half:true },
      { name:"cls", label:"Class", type:"class", half:true },
      { name:"room", label:"Room", value:"302", half:true, required:true },
      { name:"month", label:"Month", type:"select", options:D.examMonths.map(m=>({value:m,label:m})), value:month, half:true },
      { name:"period", label:"Period", type:"select", options:[1,2,3,4,5,6].map(n=>({value:n,label:"Period "+n})), value:1, half:true },
      { name:"time", label:"Start time", type:"time", value:"08:00", half:true },
      { name:"grade", label:"Grade level", value:"Grade 12", half:true },
      { name:"count", label:"Students", type:"number", value:roster, min:1, max:60, half:true },
      { name:"status", label:"Status", type:"select", value:"draft", half:true,
        options:[{value:"confirmed",label:"Confirmed"},{value:"draft",label:"Draft"},{value:"review",label:"In review"}] },
    ],
    submitLabel:"Add exam",
    onSubmit:(v, close)=>{
      S.addExam(v.month, { period:+v.period, room:v.room, cls:"Class "+v.cls, time:v.time,
        subject:v.subject, title:v.title, grade:v.grade, status:v.status, count:+v.count });
      close(); toast("Exam scheduled"); examMonth=v.month; ctx.go("exams");
    }
  });
}

export function exams(ctx){
  const db = S.db;
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"Exams",
      sub:"Plan, confirm, and track every exam across your classes on one calendar.",
      actions:`<button class="btn btn-ghost" id="ex-filter">${icon("sliders")}Filter</button>
               <button class="btn btn-primary" id="ex-new">${icon("plus")}New exam</button>`})}
    <section class="card card-pad">
      <div class="toolbar">
        <div class="section-title grow">Exam calendar</div>
        <span class="chip"><i>${icon("checkCircle")}</i><span id="ex-count"></span> confirmed</span>
      </div>
      <div class="month-row mb-24">
        <button class="month-nav" id="mprev">${icon("chevL")}</button>
        <div class="month-track" id="mtrack">
          ${D.examMonths.map(m=>`<button class="month-pill ${m===examMonth?'on':''}" data-m="${m}">${({Jan:"January",Feb:"February",Mar:"March",Apr:"April",May:"May",Jun:"June",Jul:"July"})[m]}</button>`).join("")}
        </div>
        <button class="month-nav" id="mnext">${icon("chevR")}</button>
      </div>
      <div id="ex-rows"></div>
    </section>`;

  const rows = node.querySelector("#ex-rows");
  function renderRows(){
    const data = S.db.exams[examMonth] || [];
    const filled = data.filter(r=>r.cards.length);
    const total = data.reduce((a,r)=>a+r.cards.filter(c=>c.status==="confirmed").length,0);
    node.querySelector("#ex-count").textContent = total;
    if (!data.length){
      rows.innerHTML = `<div class="empty"><div class="e-ic">${icon("exam")}</div>
        <h4>No exams this month</h4><p>Schedule one to see it on the calendar.</p>
        <button class="btn btn-primary mt-16" id="ex-empty-new">${icon("plus")}New exam</button></div>`;
      rows.querySelector("#ex-empty-new").onclick=()=>newExamForm(ctx);
      return;
    }
    rows.innerHTML = `<div class="cal-rows">${data.map(r=>`
      <div class="cal-row">
        <div class="cal-idx">${r.period}</div>
        ${r.cards.length ? `<div class="cal-cards">${r.cards.map(examCard).join("")}</div>`
          : `<div class="cal-empty">No exam scheduled.</div>`}
      </div>`).join("")}</div>`;
    rows.querySelectorAll(".xcard").forEach(c=>{
      const id=c.dataset.id;
      c.querySelector(".mini-menu").addEventListener("click",e=>{ e.stopPropagation(); examSheet(id); });
      c.addEventListener("click",()=>editExam(id));
    });
  }
  function examCard(c){
    const st = D.subjects[c.subject] || D.subjects.math;
    const statusMap = {
      confirmed:`<span class="status ok">${icon("checkCircle")}Confirmed</span>`,
      draft:`<span class="status neutral">${icon("edit")}Draft</span>`,
      review:`<span class="status warn">${icon("clock")}In review</span>`,
    };
    return `<div class="xcard" style="${tintStyle(st.tint)}" data-id="${c.id}">
      <div class="x-top">
        <div class="room-badge">${esc(c.room)}</div>
        <div class="x-cls"><b>${esc(c.cls)}</b><span>${fmtTime(c.time)}</span></div>
      </div>
      <div class="x-inner">
        <div class="x-i-ic">${icon(st.icon)}</div>
        <div class="x-i-txt"><b>${esc(c.title)}</b><span>${esc(c.grade)}</span></div>
      </div>
      <div class="x-foot">
        ${statusMap[c.status]||statusMap.draft}
        <span class="grow"></span>
        <span class="count-pill">${icon("users")}${c.count}</span>
        <button class="mini-menu" aria-label="Options">${icon("more")}</button>
      </div>
    </div>`;
  }
  function findExam(id){ for(const r of (S.db.exams[examMonth]||[])){ const c=r.cards.find(x=>x.id===id); if(c) return c; } }
  function examSheet(id){
    const c=findExam(id); if(!c) return;
    sheet(c.title, [
      { label:"Edit exam", icon:"edit", onClick:()=>editExam(id) },
      { label: c.status==="confirmed"?"Mark as draft":"Mark confirmed", icon:"checkCircle",
        onClick:()=>{ S.updateExam(examMonth,id,{status:c.status==="confirmed"?"draft":"confirmed"}); toast("Exam updated"); renderRows(); } },
      { label:"Delete exam", icon:"x", danger:true,
        onClick:()=>confirmModal({title:"Delete exam?", message:`“${c.title}” for ${c.cls} will be removed from the calendar.`,
          confirmLabel:"Delete", danger:true, onConfirm:()=>{ S.deleteExam(examMonth,id); toast("Exam deleted"); renderRows(); }}) },
    ]);
  }
  function editExam(id){
    const c=findExam(id); if(!c) return;
    formModal({ title:"Edit exam", fields:[
      { name:"title", label:"Exam name", value:c.title, required:true, half:true },
      { name:"subject", label:"Subject", type:"subject", value:c.subject, half:true },
      { name:"room", label:"Room", value:c.room, half:true, required:true },
      { name:"time", label:"Start time", type:"time", value:c.time, half:true },
      { name:"grade", label:"Grade level", value:c.grade, half:true },
      { name:"count", label:"Students", type:"number", value:c.count, min:1, max:60, half:true },
      { name:"status", label:"Status", type:"select", value:c.status, half:true,
        options:[{value:"confirmed",label:"Confirmed"},{value:"draft",label:"Draft"},{value:"review",label:"In review"}] },
    ], submitLabel:"Save", onSubmit:(v,close)=>{ S.updateExam(examMonth,id,{...v,count:+v.count}); close(); toast("Exam updated"); renderRows(); }});
  }
  renderRows();

  node.querySelector("#mtrack").addEventListener("click",e=>{
    const b=e.target.closest("[data-m]"); if(!b) return;
    examMonth=b.dataset.m;
    node.querySelectorAll(".month-pill").forEach(p=>p.classList.toggle("on",p===b));
    renderRows();
  });
  const months = D.examMonths;
  const step = d=>{ const i=Math.max(0,Math.min(months.length-1,months.indexOf(examMonth)+d));
    examMonth=months[i];
    node.querySelectorAll(".month-pill").forEach(p=>p.classList.toggle("on",p.dataset.m===examMonth));
    node.querySelector(`[data-m="${examMonth}"]`)?.scrollIntoView({inline:"center",block:"nearest"});
    renderRows(); };
  node.querySelector("#mprev").onclick=()=>step(-1);
  node.querySelector("#mnext").onclick=()=>step(1);
  node.querySelector("#ex-filter").onclick=()=>toast("Showing all exams", "filter");
  node.querySelector("#ex-new").onclick=()=>newExamForm(ctx);

  return { crumbs:[{label:"Exams", icon:"exam"}], node };
}

// ============================================================
// SCHEDULE
// ============================================================
export function schedule(ctx){
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"Calendar",
      sub:"Your teaching week at a glance. Today is highlighted; colours match each subject.",
      actions:`<div class="seg" id="sc-seg"><button class="on">Week</button><button>Day</button><button>Month</button></div>` })}
    <section class="card card-pad">
      <div class="toolbar">
        <div class="month-row grow">
          <button class="month-nav" id="sc-prev">${icon("chevL")}</button>
          <div class="section-title" id="sc-range">Feb 9 — 13</div>
          <button class="month-nav" id="sc-next">${icon("chevR")}</button>
        </div>
        <button class="btn btn-sm btn-soft" id="sc-today">${icon("target")}Today</button>
      </div>
      <div style="overflow-x:auto">
        <div class="sched" style="min-width:640px">
          <div class="sc-head"></div>
          ${D.scheduleDays.map(d=>`<div class="sc-head ${d.d==='Wed'?'today':''}">${d.d==='Wed'?'<span class="sc-today-dot"></span>':''}${d.d}<span>Feb ${d.n}</span></div>`).join("")}
          ${D.scheduleTimes.map((tm,ti)=>`
            <div class="sc-time">${tm}</div>
            ${D.scheduleDays.map((_,di)=>{
              const today = di===2 ? 'today' : '';
              const b = D.schedule[ti][di];
              if(!b) return `<div class="sc-cell ${today}"></div>`;
              const s = D.subjects[b.subject];
              return `<div class="sc-cell ${today}"><div class="sc-block" style="${tintStyle(s.tint)}" data-ti="${ti}" data-di="${di}">
                <b>${esc(s.short)}</b><span>${esc(b.cls)}</span>
                <div class="sc-room">${esc(b.room)}</div></div></div>`;
            }).join("")}`).join("")}
        </div>
      </div>
    </section>`;
  node.querySelectorAll(".sc-block").forEach(b=>b.addEventListener("click",()=>{
    const blk=D.schedule[+b.dataset.ti][+b.dataset.di]; const s=D.subjects[blk.subject];
    modal({ title:s.name, subtitle:`Class ${blk.cls} · ${blk.room}`, bodyHTML:`
      <div class="row" style="gap:14px;padding:6px 0 14px">${subjIcon(blk.subject,"lg")}
        <div><b style="font-weight:600;font-size:15px">${esc(s.name)} lesson</b>
        <div class="muted" style="font-size:13px">${D.scheduleTimes[+b.dataset.ti]} · ${D.scheduleDays[+b.dataset.di].d} · ${esc(blk.room)}</div></div></div>`,
      footerHTML:`<button class="btn btn-ghost" data-x>Close</button><button class="btn btn-primary" data-prep>${icon("book")}Prep this lesson</button>`,
      onMount:(layer,close)=>{ layer.querySelector("[data-x]").onclick=close;
        layer.querySelector("[data-prep]").onclick=()=>{ close(); ctx.go("prep"); }; }});
  }));
  node.querySelector("#sc-today").onclick=()=>toast("Showing this week","target");
  node.querySelector("#sc-prev").onclick=()=>{ node.querySelector("#sc-range").textContent="Feb 2 — 6"; toast("Previous week"); };
  node.querySelector("#sc-next").onclick=()=>{ node.querySelector("#sc-range").textContent="Feb 16 — 20"; toast("Next week"); };
  const seg=node.querySelector("#sc-seg");
  seg.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    seg.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");
    toast(b.textContent+" view","calendar");});
  return { crumbs:[{label:"Calendar", icon:"calendar"}], node };
}

// ============================================================
// ATTENDANCE  (saves & persists)
// ============================================================
let attClass = "10-A";
export function attendance(ctx){
  const db = S.db;
  const node = pageEl();
  const roster = S.classRoster(attClass);
  const saved = S.getRegister(attClass);
  const state = {};
  roster.forEach(s=>{ state[s.id] = saved?.[s.id] || (s.attendance<82?"absent":"present"); });
  const wasSaved = !!saved;

  node.innerHTML = `
    ${pageHead({ title:"Attendance",
      sub:"Mark today's register. Saved registers persist and feed your analytics.",
      actions:`<button class="btn btn-ghost" id="at-export">${icon("download")}Export</button>
               <button class="btn btn-primary" id="at-save">${icon("check")}Save register</button>` })}
    <div class="with-rail">
      <section class="card card-pad">
        <div class="toolbar">
          <div class="row grow wrap" style="gap:8px">
            ${S.classes.map(c=>`<button class="month-pill ${c===attClass?'on':''}" data-c="${c}" style="height:34px;padding:0 15px;font-size:13px">${c}</button>`).join("")}
          </div>
          <div class="row" style="gap:8px" id="at-summary"></div>
        </div>
        ${wasSaved?`<div class="chip" style="margin-bottom:12px"><i>${icon("check")}</i>Saved register for today loaded</div>`:""}
        <div class="row" style="gap:8px;margin-bottom:14px">
          <button class="btn btn-sm btn-soft" id="at-all-present">${icon("checkCircle")}Mark all present</button>
          <span class="muted" style="font-size:13px;align-self:center">${roster.length} students in ${attClass}</span>
        </div>
        <div class="att-roster" id="at-roster"></div>
      </section>
      <aside class="rail">
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Today</div></div>
          <div id="at-donut" style="display:grid;place-items:center;margin-bottom:8px"></div>
          <div class="chart-legend" style="justify-content:center">
            <span><i style="background:var(--ok)"></i>Present</span>
            <span><i style="background:var(--warn)"></i>Late</span>
            <span><i style="background:var(--danger)"></i>Absent</span>
          </div>
        </section>
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Attention needed</div></div>
          ${db.students.filter(s=>s.risk!=="ok").slice(0,4).map(s=>`
            <div class="list-row" style="padding:10px 4px" data-open="${s.id}">
              ${avatar(s.name,s.initials,s.hue,34)}
              <div class="lr-grow"><b style="font-weight:600;font-size:13.5px">${esc(s.name)}</b>
                <div class="muted" style="font-size:12px">${s.attendance}% attendance</div></div>
              <span class="status ${s.risk==="high"?"danger":"warn"}">${s.risk==="high"?"At risk":"Watch"}</span>
            </div>`).join("") || `<div class="muted" style="font-size:13px">No students flagged. 🎉</div>`}
        </section>
      </aside>
    </div>`;

  const rosterEl = node.querySelector("#at-roster");
  function render(){
    rosterEl.innerHTML = roster.map(s=>`
      <div class="att-row">
        <div class="row" style="gap:12px">
          ${avatar(s.name,s.initials,s.hue,38)}
          <div><b style="font-weight:600">${esc(s.name)}</b>
            <div class="muted" style="font-size:12.5px">Room ${s.room} · ${s.attendance}% term</div></div>
        </div>
        <div class="att-toggle" data-id="${s.id}">
          <button class="present ${state[s.id]==='present'?'on':''}" data-v="present" title="Present">${icon("check")}</button>
          <button class="late ${state[s.id]==='late'?'on':''}" data-v="late" title="Late">${icon("clock")}</button>
          <button class="absent ${state[s.id]==='absent'?'on':''}" data-v="absent" title="Absent">${icon("x")}</button>
        </div>
      </div>`).join("");
    updateSummary();
  }
  function updateSummary(){
    const c = {present:0,late:0,absent:0};
    Object.values(state).forEach(v=>c[v]++);
    node.querySelector("#at-summary").innerHTML =
      `<span class="status ok">${c.present} present</span>
       <span class="status warn">${c.late} late</span>
       <span class="status danger">${c.absent} absent</span>`;
    node.querySelector("#at-donut").innerHTML = donut(
      [{value:c.present,tint:"mint"},{value:c.late||0.0001,tint:"butter"},{value:c.absent||0.0001,tint:"blush"}],
      `${Math.round(c.present/(roster.length||1)*100)}%`, "present", 150);
  }
  rosterEl.addEventListener("click",e=>{
    const b=e.target.closest("button[data-v]"); if(!b) return;
    const id=b.closest(".att-toggle").dataset.id;
    state[id]=b.dataset.v;
    b.closest(".att-toggle").querySelectorAll("button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    updateSummary();
  });
  render();

  node.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>{ attClass=b.dataset.c; ctx.rerender(); }));
  node.querySelectorAll("[data-open]").forEach(r=>r.addEventListener("click",()=>ctx.go("student",{id:r.dataset.open})));
  node.querySelector("#at-all-present").onclick=()=>{ roster.forEach(s=>state[s.id]="present"); render(); };
  node.querySelector("#at-save").onclick=()=>{ S.saveRegister(attClass, state); toast("Register saved & synced"); ctx.rerender(); };
  node.querySelector("#at-export").onclick=()=>{
    const rows=[["Student","Class","Status","Date"],...roster.map(s=>[s.name,attClass,state[s.id],S.todayISO()])];
    download(`attendance-${attClass}-${S.todayISO()}.csv`, toCSV(rows), "text/csv"); toast("Register exported (CSV)","download");
  };
  return { crumbs:[{label:"Attendance", icon:"clock"}], node };
}

// ============================================================
// ASSIGNMENTS  (create + real grading)
// ============================================================
let asFilter="all";
function openGrader(a, ctx){
  const roster = S.classRoster(a.cls);
  const existing = {...S.getGrades(a.id)};
  const rowsHTML = roster.map(s=>{
    const v = existing[s.id];
    return `<div class="grade-row">
      <div class="u-cell">${avatar(s.name,s.initials,s.hue,36)}<div><b>${esc(s.name)}</b><span>${a.cls}</span></div></div>
      <input class="g-in" data-id="${s.id}" type="number" min="0" max="100" value="${v??""}" placeholder="—" aria-label="Score for ${esc(s.name)}">
      <div class="g-band" data-band="${s.id}" style="${v!=null?`color:${tintInk(bandTint[bandOf(v)])}`:''}">${v!=null?bandOf(v):"·"}</div>
    </div>`;
  }).join("");
  const body = `<div class="grade-summary"><span class="muted" style="font-size:13px">${subjTag(a.subject)} Class ${a.cls} · ${roster.length} students · scores 0–100</span></div>
    <div class="grade-list">${rowsHTML}</div>`;
  modal({ title:"Grade — "+a.title, subtitle:"Scores save to each student and update the queue.", wide:true, bodyHTML:body,
    footerHTML:`<button class="btn btn-ghost" data-cancel>Cancel</button>
      <button class="btn btn-soft" data-fill>${icon("zap")}Autofill remaining</button>
      <button class="btn btn-primary" data-save>${icon("check")}Save grades</button>`,
    onMount:(layer,close)=>{
      const upd=(inp)=>{ const b=layer.querySelector(`[data-band="${inp.dataset.id}"]`);
        if(inp.value===""){ b.textContent="·"; b.style.color=""; }
        else{ const bd=bandOf(inp.value); b.textContent=bd; b.style.color=tintInk(bandTint[bd]); } };
      layer.querySelectorAll(".g-in").forEach(inp=>inp.addEventListener("input",()=>upd(inp)));
      layer.querySelector("[data-fill]").onclick=()=>layer.querySelectorAll(".g-in").forEach(inp=>{
        if(inp.value==="") { inp.value = 55 + Math.floor(Math.random()*44); upd(inp); } });
      layer.querySelector("[data-cancel]").onclick=close;
      layer.querySelector("[data-save]").onclick=()=>{
        layer.querySelectorAll(".g-in").forEach(inp=>S.setGrade(a.id, inp.dataset.id, inp.value));
        S.persist(); close(); toast("Grades saved"); ctx.rerender();
      };
    }});
}
function newAssignmentForm(ctx){
  formModal({ title:"New assignment", subtitle:"Set work for a class.",
    fields:[
      { name:"title", label:"Title", value:"", placeholder:"e.g. Chapter 5 problem set", required:true },
      { name:"subject", label:"Subject", type:"subject", value:"math", half:true },
      { name:"cls", label:"Class", type:"class", half:true },
      { name:"due", label:"Due date", type:"date", value:S.todayISO(), half:true },
      { name:"assigned", label:"Assigned to (count)", type:"number", value:S.classRoster("10-A").length||30, min:1, max:60, half:true },
    ], submitLabel:"Create", onSubmit:(v,close)=>{
      S.addAssignment({ title:v.title, subject:v.subject, cls:v.cls, due:S.fmtDate(v.due), assigned:+v.assigned, submitted:0 });
      close(); toast("Assignment created"); ctx.rerender();
    }});
}
export function assignments(ctx){
  const db = S.db;
  const node = pageEl();
  const filters=[["all","All"],["open","Open"],["grading","Grading"],["done","Returned"]];
  const all = db.assignments.map(S.assignmentView);
  const list = all.filter(a=>asFilter==="all"?true:a.status===asFilter);
  const statusMap = {
    open:`<span class="status neutral">${icon("clock")}Collecting</span>`,
    grading:`<span class="status warn">${icon("edit")}Grading</span>`,
    done:`<span class="status ok">${icon("check")}Returned</span>`,
  };
  node.innerHTML = `
    ${pageHead({ title:"Assignment management",
      sub:"Create work, track submissions, and grade — with progress across every class.",
      actions:`<button class="btn btn-primary" id="as-new">${icon("plus")}New assignment</button>` })}
    <section class="stat-grid mb-24">
      ${[
        {ic:"clipboard",tint:"violet",val:all.length,label:"Active assignments"},
        {ic:"download",tint:"sky",val:all.reduce((a,x)=>a+x.submitted,0),label:"Submissions in"},
        {ic:"edit",tint:"peach",val:all.reduce((a,x)=>a+Math.max(x.submitted-x.graded,0),0),label:"Awaiting grade"},
        {ic:"check",tint:"mint",val:all.filter(a=>a.status==="done").length,label:"Returned"},
      ].map(s=>`<div class="stat" style="${tintStyle(s.tint)}">
        <div class="s-top"><div class="s-ic">${icon(s.ic)}</div></div>
        <div class="s-val tnum">${s.val}</div><div class="s-label">${s.label}</div></div>`).join("")}
    </section>
    <section class="card card-pad">
      <div class="toolbar">
        <div class="seg" id="as-seg">${filters.map(([k,l])=>`<button class="${k===asFilter?'on':''}" data-f="${k}">${l}</button>`).join("")}</div>
        <span class="grow"></span>
      </div>
      <div style="overflow-x:auto"><table class="tbl" style="min-width:720px">
        <thead><tr><th>Assignment</th><th>Class</th><th>Due</th><th>Progress</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map(a=>{
            const pct = a.assigned? Math.round(a.graded/a.assigned*100):0;
            return `<tr>
              <td><div class="u-cell">${subjIcon(a.subject)}<div><b>${esc(a.title)}</b><span>${a.submitted}/${a.assigned} submitted</span></div></div></td>
              <td>${subjTag(a.subject)} <span class="muted mono" style="font-size:12.5px">${a.cls}</span></td>
              <td class="mono muted" style="font-size:13px">${esc(a.due)}</td>
              <td><div class="row" style="gap:10px"><div class="progress" style="${tintStyle(D.subjects[a.subject].tint)};min-width:90px"><i style="width:${pct}%"></i></div><b class="mono" style="font-size:12.5px">${pct}%</b></div></td>
              <td>${statusMap[a.status]}</td>
              <td style="text-align:right"><button class="btn btn-sm btn-soft" data-grade="${a.id}">${a.status==="done"?"Review":"Grade"}</button></td>
            </tr>`;
          }).join("") || `<tr><td colspan="6"><div class="muted" style="padding:24px;text-align:center">No assignments in this view.</div></td></tr>`}
        </tbody>
      </table></div>
    </section>`;
  const seg=node.querySelector("#as-seg");
  seg.addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(!b)return;asFilter=b.dataset.f;ctx.rerender();});
  node.querySelectorAll("[data-grade]").forEach(b=>b.addEventListener("click",()=>{
    const a=S.db.assignments.map(S.assignmentView).find(x=>x.id===b.dataset.grade); if(a) openGrader(a, ctx);
  }));
  node.querySelector("#as-new").onclick=()=>newAssignmentForm(ctx);
  return { crumbs:[{label:"Assignment management", icon:"clipboard"}], node };
}

// ============================================================
// STUDENTS
// ============================================================
let stQuery="", stGrade="all";
function newStudentForm(ctx){
  formModal({ title:"Add student", subtitle:"Add a student to a class roster.",
    fields:[
      { name:"name", label:"Full name", value:"", placeholder:"First Last", required:true },
      { name:"grade", label:"Class", type:"class", half:true },
      { name:"room", label:"Room", type:"number", value:300, min:100, max:999, half:true },
      { name:"email", label:"Email", type:"email", value:"", placeholder:"name@westbrook.edu", half:true },
      { name:"attendance", label:"Attendance %", type:"number", value:95, min:0, max:100, half:true },
    ], submitLabel:"Add student", onSubmit:(v,close)=>{
      S.addStudent({ name:v.name, grade:v.grade, room:+v.room, email:v.email||(v.name.toLowerCase().replace(/\s+/g,".")+"@westbrook.edu"), attendance:+v.attendance });
      close(); toast(v.name+" added"); ctx.rerender();
    }});
}
export function students(ctx){
  const db = S.db;
  const node = pageEl();
  const grades=["all",...S.classes];
  const list = db.students.filter(s=>
    (stGrade==="all"||s.grade===stGrade) &&
    (!stQuery || s.name.toLowerCase().includes(stQuery.toLowerCase()) || s.email.toLowerCase().includes(stQuery.toLowerCase())));
  node.innerHTML = `
    ${pageHead({ title:"Students",
      sub:"Your cohort across six classes. Open a student for their activity timeline.",
      actions:`<button class="btn btn-ghost" id="st-export">${icon("download")}Export</button>
               <button class="btn btn-primary" id="st-add">${icon("plus")}Add student</button>` })}
    <section class="card card-pad">
      <div class="toolbar">
        <div class="top-search" style="min-width:260px">${icon("search")}<input id="st-search" placeholder="Search name or email" value="${esc(stQuery)}"></div>
        <div class="row wrap grow" style="gap:8px">
          ${grades.map(g=>`<button class="month-pill ${g===stGrade?'on':''}" data-g="${g}" style="height:34px;padding:0 15px;font-size:13px">${g==="all"?"All classes":g}</button>`).join("")}
        </div>
        <span class="chip">${list.length} students</span>
      </div>
      <div style="overflow-x:auto"><table class="tbl" style="min-width:760px">
        <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>GPA</th><th>Trend</th><th>Flag</th><th></th></tr></thead>
        <tbody>
          ${list.map(s=>`<tr data-id="${s.id}" style="cursor:pointer">
            <td><div class="u-cell">${avatar(s.name,s.initials,s.hue,38)}<div><b>${esc(s.name)}</b><span>${esc(s.email)}</span></div></div></td>
            <td class="mono muted" style="font-size:13px">${s.grade}</td>
            <td><div class="row" style="gap:10px"><div class="progress" style="${tintStyle(s.attendance>90?'mint':s.attendance>85?'butter':'blush')};min-width:80px"><i style="width:${s.attendance}%"></i></div><b class="mono" style="font-size:12.5px">${s.attendance}%</b></div></td>
            <td class="mono" style="font-weight:600">${(+s.gpa).toFixed(2)}</td>
            <td><span class="s-trend ${s.trend>=0?'up':'down'}" style="font-size:12.5px">${icon(s.trend>=0?'arrowUp':'arrowDown')}${Math.abs(s.trend)}%</span></td>
            <td>${s.risk==="ok"?`<span class="status ok">${icon("check")}On track</span>`:s.risk==="watch"?`<span class="status warn">Watch</span>`:`<span class="status danger">At risk</span>`}</td>
            <td style="text-align:right">${icon("chevR","muted")}</td>
          </tr>`).join("") || `<tr><td colspan="7"><div class="muted" style="padding:24px;text-align:center">No students match your search.</div></td></tr>`}
        </tbody>
      </table></div>
    </section>`;
  node.querySelectorAll("tr[data-id]").forEach(r=>r.addEventListener("click",()=>ctx.go("student",{id:r.dataset.id})));
  const search=node.querySelector("#st-search");
  search.addEventListener("input",()=>{stQuery=search.value;ctx.rerender(true);});
  node.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click",()=>{stGrade=b.dataset.g;ctx.rerender();}));
  node.querySelector("#st-add").onclick=()=>newStudentForm(ctx);
  node.querySelector("#st-export").onclick=()=>{
    const rows=[["Name","Class","Email","Attendance","GPA","Flag"],...list.map(s=>[s.name,s.grade,s.email,s.attendance+"%",(+s.gpa).toFixed(2),s.risk])];
    download("students.csv", toCSV(rows), "text/csv"); toast("Roster exported (CSV)","download");
  };
  return { crumbs:[{label:"Students", icon:"users"}], node, focus:"#st-search" };
}

// ============================================================
// STUDENT DETAIL — Activity
// ============================================================
export function student(ctx){
  const db = S.db;
  const s = db.students.find(x=>x.id===ctx.params.id) || db.students[0];
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"Activity Calendar",
      sub:`Every action ${s.name.split(" ")[0]} took this month — assignments, attendance, and sessions.`,
      actions:`<button class="btn btn-ghost" id="ac-menu">${icon("more")}</button>
               <button class="btn btn-primary" id="ac-report">${icon("report")}Report card</button>` })}
    <div class="card card-pad mb-24">
      <div class="row wrap" style="gap:16px">
        ${avatar(s.name,s.initials,s.hue,52)}
        <div class="grow" style="min-width:180px">
          <div class="card-title">${esc(s.name)}</div>
          <div class="muted" style="font-size:13px;margin-top:2px">${esc(s.email)} · Class ${s.grade} · Room ${s.room}</div>
        </div>
        <div class="row wrap" style="gap:8px">
          <span class="chip"><i>${icon("clock")}</i>${s.attendance}% attendance</span>
          <span class="chip"><i>${icon("award")}</i>GPA ${(+s.gpa).toFixed(2)}</span>
          <span class="status ${s.risk==="ok"?"ok":s.risk==="watch"?"warn":"danger"}">${s.risk==="ok"?"On track":s.risk==="watch"?"Watch":"At risk"}</span>
        </div>
      </div>
    </div>
    <div class="with-rail">
      <section class="card card-pad">
        <div class="toolbar">
          <div class="section-title grow">February</div>
          <div class="chart-legend">
            <span><i style="background:var(--mint-ink)"></i>Present 6</span>
            <span><i style="background:var(--danger)"></i>Absent 2</span>
            <span><i style="background:var(--violet-ink)"></i>Events 9</span>
          </div>
        </div>
        <div class="activity-wrap">
          ${D.activityFeed.map(row=>`
            <div class="act-row">
              <div class="act-day ${row.day===9?'on':''}">${row.day}</div>
              ${row.weekend
                ? `<div class="act-weekend">Weekend</div>`
                : row.events.length
                  ? `<div class="act-chips">${row.events.map(ev=>`
                      <div class="event-chip" style="${tintStyle(ev.tint)}">
                        <div class="ec-ic">${icon(ev.icon)}</div>
                        <div class="ec-txt"><b>${esc(ev.label)}</b><span>${ev.time} am</span></div>
                      </div>`).join("")}</div>`
                  : `<div class="act-weekend">No events.</div>`}
            </div>`).join("")}
        </div>
      </section>
      <aside class="rail">
        <section class="card card-pad minical">
          <div class="mc-head"><div class="mc-title">February</div>
            <div class="row" style="gap:6px"><button class="month-nav" style="width:30px;height:30px">${icon("chevL")}</button>
              <button class="month-nav" style="width:30px;height:30px">${icon("chevR")}</button></div></div>
          <div class="mc-grid">
            ${["Mo","Tu","We","Th","Fr","Sa","Su"].map(w=>`<div class="mc-w">${w}</div>`).join("")}
            ${D.febDays.map(d=>d.blank?`<div></div>`:`
              <div class="mc-cell ${d.today?'today':''}">${d.d}
                ${d.marks?.length?`<div class="mc-mark">${d.marks.map(m=>`<i style="background:${m==='present'?'var(--mint-ink)':m==='absent'?'var(--danger)':'var(--violet-ink)'}"></i>`).join("")}</div>`:""}
              </div>`).join("")}
          </div>
          <div class="mc-legend">
            <span><i style="background:var(--mint-ink)"></i>Present 6</span>
            <span><i style="background:var(--danger)"></i>Absent 2</span>
            <span><i style="background:var(--violet-ink)"></i>Events 9</span>
          </div>
        </section>
        <section class="card card-pad">
          <div class="card-head"><div class="grow"><div class="card-title">Upcoming events</div></div></div>
          ${D.upcoming.map(u=>`
            <div class="up-item" style="${tintStyle(u.tint)}">
              <div class="u-ic">${icon(u.icon)}</div>
              <div class="u-body"><div class="u-title">${esc(u.title)}</div>
                <div class="u-meta">${esc(u.when)}</div></div>
              <span class="u-left">${esc(u.left)} left</span>
            </div>`).join("")}
        </section>
      </aside>
    </div>`;
  const aiCtx = { studentName:s.name, className:s.grade, gpa:s.gpa, attendance:s.attendance, risk:s.risk };
  node.querySelector("#ac-report").onclick=()=>{
    aiModal({ action:"reportComment", context:aiCtx,
      title:"Report-card comment — "+s.name.split(" ")[0],
      subtitle:"Grounded in this term's attendance and grades — adjust tone and save.",
      onAccept:(text,close)=>{ S.saveComment(s.id, text); close(); toast("Saved to "+s.name.split(" ")[0]+"'s report card"); }});
  };
  node.querySelector("#ac-menu").onclick=()=>sheet(s.name,[
    { label:"Draft a note home", icon:"mail", onClick:()=>{
      const total = S.studentAbsenceTotal(s.id) || 2;
      aiModal({ action:"parentNote", context:{ ...aiCtx, count:total, teacher:S.db.teacher.name },
        subtitle:"Drafted from attendance. Adjust tone or translate, then send.",
        onAccept:(text,close)=>{ S.sendParentNote(s, text); close(); toast("Note sent home"); }}); }},
    { label:"Summarize the term (for conferences)", icon:"users", onClick:()=>{
      aiModal({ action:"summarizeStudent", context:aiCtx,
        onAccept:(text,close)=>{ close(); toast("Summary ready to copy"); }}); }},
    { label:"Accommodation ideas", icon:"heart", onClick:()=>{
      formModal({ title:"Accommodation ideas — "+s.name.split(" ")[0], subtitle:"Describe the need; OEdu suggests classroom accommodations.",
        fields:[{ name:"need", label:"Need or context", placeholder:"e.g. difficulty focusing in long tasks", required:true }],
        submitLabel:"Draft ideas", onSubmit:(v,close)=>{ close();
          aiModal({ action:"iep", context:{ ...aiCtx, need:v.need }, onAccept:(t,c)=>{ c(); toast("Accommodation ideas ready"); } }); }}); }},
    { label:"Export activity (CSV)", icon:"download", onClick:()=>{
      const rows=[["Day","Event","Time"]]; D.activityFeed.forEach(r=>(r.events||[]).forEach(e=>rows.push([r.day,e.label,e.time])));
      download(`${s.name.replace(/\s+/g,"-")}-activity.csv`, toCSV(rows), "text/csv"); toast("Activity exported"); }},
    { label:"Remove student", icon:"x", danger:true, onClick:()=>confirmModal({
      title:"Remove student?", message:`${s.name} will be removed from all rosters.`, confirmLabel:"Remove", danger:true,
      onConfirm:()=>{ S.removeStudent(s.id); toast("Student removed"); ctx.go("roster"); }})},
  ]);
  return {
    crumbs:[{label:"Roster", icon:"users", go:"roster"},{label:s.name.split(" ")[0], icon:"users"}],
    node
  };
}

// ============================================================
// MESSAGES
// ============================================================
let activeThread=null;
export function messages(ctx){
  const db = S.db;
  const node = pageEl();
  if (!activeThread || !db.threads.find(t=>t.id===activeThread)) activeThread = db.threads[0]?.id;
  const t = db.threads.find(x=>x.id===activeThread) || db.threads[0];
  S.markThreadRead(activeThread);
  node.innerHTML = `
    ${pageHead({ title:"Messages",
      sub:"Conversations with students, parents, and faculty — all in one inbox.",
      actions:`<button class="btn btn-primary" id="msg-new">${icon("plus")}New message</button>` })}
    <div class="msg-layout">
      <div class="msg-list">
        <div class="msg-list-head">
          <div class="top-search">${icon("search")}<input id="msg-search" placeholder="Search messages"></div>
        </div>
        <div class="msg-scroll" id="msg-threads">
          ${db.threads.map(th=>`
            <div class="msg-item ${th.id===activeThread?'on':''}" data-t="${th.id}">
              ${avatar(th.name,th.initials,th.hue,42)}
              <div class="mi-body">
                <div class="mi-top"><span class="mi-name">${esc(th.name)}</span><span class="mi-time">${esc(th.time)}</span></div>
                <div class="mi-prev">${esc(th.preview||"No messages yet")}</div>
              </div>
              ${th.unread?`<span class="mi-unread"></span>`:""}
            </div>`).join("")}
        </div>
      </div>
      <div class="msg-thread">
        <div class="msg-thread-head">
          ${avatar(t.name,t.initials,t.hue,40)}
          <div class="grow"><b style="font-weight:600">${esc(t.name)}</b>
            <div class="muted" style="font-size:12.5px">${esc(t.role)}</div></div>
          <button class="top-btn" id="msg-call">${icon("phone")}</button>
        </div>
        <div class="msg-body" id="msg-body">
          ${t.msgs.length?t.msgs.map(m=>`<div class="bubble ${m.me?'me':'them'}">${esc(m.t)}<div class="b-time">${m.time}</div></div>`).join("")
            :`<div class="empty" style="margin:auto"><div class="e-ic">${icon("chat")}</div><h4>No messages yet</h4><p>Say hello to start the conversation.</p></div>`}
        </div>
        <form class="msg-compose" id="msg-form">
          <input id="msg-input" placeholder="Write a message…" autocomplete="off">
          <button class="btn btn-primary btn-icon" type="submit" aria-label="Send">${icon("send")}</button>
        </form>
      </div>
    </div>`;
  node.querySelectorAll("[data-t]").forEach(el=>el.addEventListener("click",()=>{activeThread=el.dataset.t;ctx.rerender();}));
  const body=node.querySelector("#msg-body"); body.scrollTop=body.scrollHeight;
  const form=node.querySelector("#msg-form"), input=node.querySelector("#msg-input");
  form.addEventListener("submit",e=>{
    e.preventDefault(); const v=input.value.trim(); if(!v) return;
    const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    t.msgs.push({me:true,t:v,time:now}); t.preview=v; t.time="now"; S.persist();
    body.querySelector(".empty")?.remove();
    body.appendChild(h(`<div class="bubble me">${esc(v)}<div class="b-time">${now}</div></div>`));
    input.value=""; body.scrollTop=body.scrollHeight;
  });
  node.querySelector("#msg-call").onclick=()=>toast("Calling "+t.name.split(" ")[0]+"…","phone");
  node.querySelector("#msg-new").onclick=()=>formModal({ title:"New message",
    fields:[
      { name:"name", label:"To", value:"", placeholder:"Recipient name", required:true, half:true },
      { name:"role", label:"Role", value:"Parent", half:true,
        options:[{value:"Parent",label:"Parent / Guardian"},{value:"Student",label:"Student"},{value:"Faculty",label:"Faculty"}], type:"select" },
      { name:"message", label:"Message", type:"textarea", value:"", placeholder:"Write your message…", required:true },
    ], submitLabel:"Send", onSubmit:(v,close)=>{
      const th=S.addThread(v.name, v.role, v.message); activeThread=th.id; close(); toast("Message sent"); ctx.rerender();
    }});
  const search=node.querySelector("#msg-search");
  search.addEventListener("input",()=>{
    const q=search.value.toLowerCase();
    node.querySelectorAll("#msg-threads .msg-item").forEach(it=>{
      it.style.display = it.textContent.toLowerCase().includes(q)?"":"none"; });
  });
  return { crumbs:[{label:"Messages", icon:"chat"}], node, focus:"#msg-input" };
}

// ============================================================
// ANALYTICS  (partly live)
// ============================================================
export function analytics(ctx){
  const node = pageEl();
  const liveDist = S.liveGradeDistribution();
  const dist = liveDist || D.gradeDistribution;
  const totalGrades = dist.reduce((a,g)=>a+g.value,0);
  const att = S.attendanceToday();
  const gpa = (S.db.students.reduce((a,s)=>a+ +s.gpa,0)/(S.db.students.length||1)).toFixed(2);
  const atRisk = S.db.students.filter(s=>s.risk!=="ok").length;
  node.innerHTML = `
    ${pageHead({ eyebrow:`${icon("chart")} Insights`, title:"Analytics",
      sub:"Attendance, achievement, and cohort performance across your classes.",
      actions:`<div class="seg" id="an-seg"><button class="on">Term</button><button>Month</button><button>Week</button></div>` })}
    <section class="stat-grid mb-24">
      ${[
        {ic:"clock",tint:"mint",val: att.rate!=null?att.rate+"%":"94.6%",label:"Attendance today",t:"+2.4%",up:true},
        {ic:"award",tint:"violet",val:gpa,label:"Cohort GPA",t:"+0.12",up:true},
        {ic:"target",tint:"sky",val:"78%",label:"Assignments on time",t:"-3%",up:false},
        {ic:"users",tint:"peach",val:String(atRisk),label:"Students at risk",t:atRisk<=6?"-2":"+1",up:atRisk<=6},
      ].map(s=>`<div class="stat" style="${tintStyle(s.tint)}">
        <div class="s-top"><div class="s-ic">${icon(s.ic)}</div></div>
        <div class="s-val tnum">${s.val}</div><div class="s-label">${s.label}</div>
        <div class="s-trend ${s.up?'up':'down'}">${icon(s.up?'trendUp':'arrowDown')}<span>${s.t}</span></div></div>`).join("")}
    </section>
    <div class="grid-2 mb-24">
      <section class="card card-pad">
        <div class="card-head"><div class="grow"><div class="card-title">Attendance trend</div>
          <div class="card-sub">Weekly average · this term</div></div>
          <span class="status ok">${icon("trendUp")}Improving</span></div>
        ${sparkline(D.attendanceTrend,{w:560,h:170,tint:"mint"})}
        <div class="chart-legend"><span><i style="background:var(--mint-ink)"></i>Attendance %</span></div>
      </section>
      <section class="card card-pad">
        <div class="card-head"><div class="grow"><div class="card-title">Grade distribution</div>
          <div class="card-sub">${totalGrades} graded ${liveDist?"(live)":"assessments"}</div></div></div>
        <div class="donut-wrap">
          ${donut(dist,String(totalGrades),"graded",160)}
          <div class="stack" style="gap:10px;flex:1;min-width:140px">
            ${dist.map(g=>`<div class="row" style="gap:10px">
              <i style="width:12px;height:12px;border-radius:4px;background:${tintInk(g.tint)}"></i>
              <span style="flex:1;font-weight:600">Grade ${g.band}</span>
              <span class="mono muted">${g.value}</span></div>`).join("")}
          </div>
        </div>
      </section>
    </div>
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">Class performance</div>
        <div class="card-sub">Average score by class, coloured by subject</div></div>
        <button class="btn btn-sm btn-soft" id="an-export">${icon("download")}Export</button></div>
      ${bars(D.classPerformance.map(c=>({label:c.cls,value:c.avg,tint:D.subjects[c.subject].tint})))}
      <div style="overflow-x:auto"><table class="tbl mt-24" style="min-width:520px">
        <thead><tr><th>Class</th><th>Subject</th><th>Avg score</th><th>Attendance</th></tr></thead>
        <tbody>${D.classPerformance.map(c=>`<tr>
          <td class="mono" style="font-weight:600">${c.cls}</td>
          <td>${subjTag(c.subject)}</td>
          <td><div class="row" style="gap:10px"><div class="progress" style="${tintStyle(D.subjects[c.subject].tint)};min-width:110px"><i style="width:${c.avg}%"></i></div><b class="mono" style="font-size:12.5px">${c.avg}%</b></div></td>
          <td class="mono muted">${c.attendance}%</td></tr>`).join("")}</tbody>
      </table></div>
    </section>`;
  const seg=node.querySelector("#an-seg");
  seg.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    seg.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");toast(b.textContent+" range","chart");});
  node.querySelector("#an-export").onclick=()=>{
    const rows=[["Class","Subject","Avg","Attendance"],...D.classPerformance.map(c=>[c.cls,D.subjects[c.subject].name,c.avg,c.attendance])];
    download("class-performance.csv", toCSV(rows), "text/csv"); toast("Analytics exported","download");
  };
  return { crumbs:[{label:"Analytics", icon:"chart"}], node };
}

// ============================================================
// REPORTS  (real file exports)
// ============================================================
function buildReport(kind){
  const db = S.db;
  const stamp = new Date().toLocaleString();
  if (kind==="Attendance summary")
    return { name:"attendance-summary.csv", mime:"text/csv",
      content: toCSV([["Student","Class","Attendance","Flag"],...db.students.map(s=>[s.name,s.grade,s.attendance+"%",s.risk])]) };
  if (kind==="Assessment analysis")
    return { name:"assessment-analysis.csv", mime:"text/csv",
      content: toCSV([["Class","Subject","Avg score","Attendance"],...D.classPerformance.map(c=>[c.cls,D.subjects[c.subject].name,c.avg,c.attendance])]) };
  if (kind==="Predicted grades")
    return { name:"predicted-grades.csv", mime:"text/csv",
      content: toCSV([["Student","Class","GPA","Predicted"],...db.students.map(s=>[s.name,s.grade,(+s.gpa).toFixed(2), s.gpa>=3.5?"A":s.gpa>=3?"B":s.gpa>=2.5?"C":"D"])]) };
  if (kind==="Intervention log")
    return { name:"intervention-log.csv", mime:"text/csv",
      content: toCSV([["Student","Class","Attendance","Flag","Action"],...db.students.filter(s=>s.risk!=="ok").map(s=>[s.name,s.grade,s.attendance+"%",s.risk,"Follow-up scheduled"])]) };
  // HTML report cards / parent pack
  const rows = db.students.slice(0,12).map(s=>`<tr><td>${esc(s.name)}</td><td>${s.grade}</td><td>${s.attendance}%</td><td>${(+s.gpa).toFixed(2)}</td><td>Consistent effort; keep it up.</td></tr>`).join("");
  return { name:(kind==="Parent evening pack"?"parent-evening-pack":"report-cards")+".html", mime:"text/html",
    content:`<!doctype html><meta charset="utf-8"><title>${esc(kind)}</title>
    <style>body{font-family:Inter,system-ui,sans-serif;color:#1a1a20;margin:40px}h1{font-size:24px}
    table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border-bottom:1px solid #e8e8ee;padding:10px 12px;text-align:left;font-size:14px}
    th{color:#8a8a97;font-size:12px;text-transform:uppercase;letter-spacing:.05em}small{color:#8a8a97}</style>
    <h1>${esc(kind)}</h1><small>${esc(D.school.name)} · ${esc(D.school.term)} · generated ${esc(stamp)}</small>
    <table><thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>GPA</th><th>Comment</th></tr></thead><tbody>${rows}</tbody></table>` };
}
export function reports(ctx){
  const node = pageEl();
  const items=[
    {title:"End-of-term report cards",desc:"Generate individual reports for all classes with grades and comments.",tint:"violet",icon:"report",meta:S.db.students.length+" students"},
    {title:"Attendance summary",desc:"Per-student attendance breakdown with flagged absences.",tint:"mint",icon:"clock",meta:"Feb 2026"},
    {title:"Assessment analysis",desc:"Grade distributions and item analysis by exam.",tint:"sky",icon:"chart",meta:"4 exams"},
    {title:"Parent evening pack",desc:"One-page student summaries ready to print or email.",tint:"blush",icon:"users",meta:"14 Feb"},
    {title:"Predicted grades",desc:"Projected outcomes based on term performance.",tint:"peach",icon:"target",meta:"Grade 12"},
    {title:"Intervention log",desc:"Record and export support actions for at-risk students.",tint:"butter",icon:"flag",meta:S.db.students.filter(s=>s.risk!=="ok").length+" flagged"},
  ];
  node.innerHTML = `
    ${pageHead({ title:"Reports",
      sub:"Generate and download the documents your school and families need.",
      actions:`<button class="btn btn-primary" id="rp-new">${icon("plus")}New report</button>` })}
    <div class="feature-grid mb-32">
      ${items.map(r=>`<div class="feature" style="${tintStyle(r.tint)}" data-r="${esc(r.title)}">
        <div class="f-ic">${icon(r.icon)}</div>
        <h4>${esc(r.title)}</h4><p>${esc(r.desc)}</p>
        <div class="row" style="margin-top:14px;gap:8px"><span class="chip" style="height:26px">${esc(r.meta)}</span>
        <span class="grow"></span><span class="btn btn-sm btn-soft">${icon("download")}</span></div>
      </div>`).join("")}
    </div>
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">How exports work</div></div></div>
      <p class="muted" style="font-size:14px;line-height:1.6;max-width:60ch">Every report generates a real file from your live data — CSV for spreadsheets, HTML for printable packs. Click a card above to download.</p>
    </section>`;
  node.querySelectorAll("[data-r]").forEach(c=>c.addEventListener("click",()=>{
    const rep=buildReport(c.dataset.r); download(rep.name, rep.content, rep.mime); toast("Downloaded: "+rep.name,"download");
  }));
  node.querySelector("#rp-new").onclick=()=>toast("Pick a report card above to generate","report");
  return { crumbs:[{label:"Reports", icon:"report"}], node };
}

// ============================================================
// CLASS PREPARATION
// ============================================================
export function prep(ctx){
  const db = S.db;
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"Class Preparation",
      sub:"Build lesson plans and gather resources. Readiness updates as you add materials.",
      actions:`<button class="btn btn-primary" id="pr-new">${icon("plus")}New lesson plan</button>` })}
    <div class="grid-2" id="pr-grid">
      ${db.classPrep.map((p,i)=>{
        const s=D.subjects[p.subject];
        return `<section class="card card-pad" style="${tintStyle(s.tint)}" data-i="${i}">
          <div class="card-head">
            ${subjIcon(p.subject,"lg")}
            <div class="grow"><div class="card-title">${esc(p.topic)}</div>
              <div class="card-sub">${esc(s.name)} · Class ${p.cls}</div></div>
            <b class="mono" style="font-size:15px;color:${tintInk(s.tint)}">${p.ready}%</b>
          </div>
          <div class="progress" style="height:9px"><i style="width:${p.ready}%"></i></div>
          <div class="row" style="margin-top:16px;gap:10px">
            <span class="chip" style="background:rgba(255,255,255,.6)"><i>${icon("layers")}</i>${p.resources} resources</span>
            <span class="grow muted" style="font-size:13px">${esc(p.note)}</span>
          </div>
          <div class="row" style="margin-top:16px;gap:10px">
            <button class="btn btn-sm btn-ghost grow" data-open="${i}">${icon("edit")}Open plan</button>
            <button class="btn btn-sm btn-soft" data-add="${i}">${icon("plus")}Add resource</button>
          </div>
        </section>`;
      }).join("")}
    </div>`;
  node.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{
    const p=S.db.classPrep[+b.dataset.add]; p.resources++; p.ready=Math.min(100,p.ready+10); S.persist();
    toast("Resource added"); ctx.rerender();
  }));
  node.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
    const i=+b.dataset.open, p=S.db.classPrep[i];
    formModal({ title:"Edit lesson plan", subtitle:`${D.subjects[p.subject].name} · Class ${p.cls}`,
      fields:[
        { name:"topic", label:"Topic", value:p.topic, required:true },
        { name:"note", label:"Notes", type:"textarea", value:p.note },
        { name:"ready", label:"Readiness %", type:"number", value:p.ready, min:0, max:100, half:true },
        { name:"resources", label:"Resources", type:"number", value:p.resources, min:0, max:50, half:true },
      ], submitLabel:"Save plan", onSubmit:(v,close)=>{ Object.assign(p,{topic:v.topic,note:v.note,ready:+v.ready,resources:+v.resources}); S.persist(); close(); toast("Plan updated"); ctx.rerender(); }});
  }));
  node.querySelector("#pr-new").onclick=()=>formModal({ title:"New lesson plan",
    fields:[
      { name:"subject", label:"Subject", type:"subject", value:"math", half:true },
      { name:"cls", label:"Class", type:"class", half:true },
      { name:"topic", label:"Topic", value:"", placeholder:"e.g. Trigonometric identities", required:true },
      { name:"note", label:"Notes", type:"textarea", value:"", placeholder:"What still needs preparing?" },
    ], submitLabel:"Create", onSubmit:(v,close)=>{ S.addLessonPlan({subject:v.subject,cls:v.cls,topic:v.topic,note:v.note||"Getting started"}); close(); toast("Lesson plan created"); ctx.rerender(); }});
  return { crumbs:[{label:"Class Preparation", icon:"book"}], node };
}

// ============================================================
// SCHOOL NEWS / ACTIVITIES / WHAT'S NEW
// ============================================================
export function news(ctx){
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"School News",
      sub:"Announcements and highlights from across Westbrook Academy." })}
    <div class="feature-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${D.schoolNews.map((n,i)=>`<article class="news-card" style="${tintStyle(n.tint)}" data-i="${i}">
        <div class="news-cover">${icon(n.icon)}</div>
        <div class="news-body">
          <div class="row" style="gap:8px;margin-bottom:8px"><span class="tag" style="${tintStyle(n.tint)}">${esc(n.cat)}</span>
            <span class="muted mono" style="font-size:12px">${esc(n.date)}</span></div>
          <h4>${esc(n.title)}</h4><p>${esc(n.excerpt)}</p>
        </div>
      </article>`).join("")}
    </div>`;
  node.querySelectorAll(".news-card").forEach(c=>c.addEventListener("click",()=>{
    const n=D.schoolNews[+c.dataset.i];
    modal({ title:n.title, subtitle:`${n.cat} · ${n.date}`, bodyHTML:`<p class="modal-msg">${esc(n.excerpt)} This item is shared with all faculty and appears on the staff dashboard.</p>`,
      footerHTML:`<button class="btn btn-primary" data-x>Got it</button>`, onMount:(l,close)=>l.querySelector("[data-x]").onclick=close });
  }));
  return { crumbs:[{label:"School News", icon:"sparkle"}], node };
}
export function activities(ctx){
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ title:"School Activities",
      sub:"Clubs and extracurriculars running this term. Tap to view details." })}
    <div class="feature-grid">
      ${D.schoolActivities.map((a,i)=>`<div class="feature" style="${tintStyle(a.tint)}" data-i="${i}">
        <div class="f-ic">${icon(a.icon)}</div>
        <h4>${esc(a.title)}</h4>
        <div class="row" style="gap:8px;margin-top:8px"><span class="chip" style="height:26px;background:rgba(255,255,255,.6)"><i>${icon("clock")}</i>${esc(a.when)}</span></div>
        <div class="row" style="gap:8px;margin-top:10px"><span class="muted" style="font-size:13px">${icon("mapPin")}${esc(a.place)}</span>
          <span class="grow"></span><span class="chip" style="height:26px">${icon("users")}${a.members}</span></div>
      </div>`).join("")}
    </div>`;
  node.querySelectorAll("[data-i]").forEach(c=>c.addEventListener("click",()=>{
    const a=D.schoolActivities[+c.dataset.i];
    modal({ title:a.title, subtitle:`${a.when} · ${a.place}`, bodyHTML:`<p class="modal-msg">${a.members} students are enrolled. Meetings run weekly. Contact the front office to add a student.</p>`,
      footerHTML:`<button class="btn btn-ghost" data-x>Close</button><button class="btn btn-primary" data-j>${icon("plus")}Enrol a student</button>`,
      onMount:(l,close)=>{ l.querySelector("[data-x]").onclick=close; l.querySelector("[data-j]").onclick=()=>{close();toast("Enrolment request sent");}; }});
  }));
  return { crumbs:[{label:"School Activities", icon:"flag"}], node };
}
export function whatsnew(ctx){
  const node = pageEl();
  node.innerHTML = `
    ${pageHead({ eyebrow:`${icon("megaphone")} Product updates`, title:"What's New",
      sub:"The latest improvements to OEdu for teachers." })}
    <div class="stack">
      ${D.whatsNew.map(w=>`<section class="card card-pad" style="${tintStyle(w.tint)}">
        <div class="row" style="gap:16px;align-items:flex-start">
          <span class="subj-ic lg" style="${tintStyle(w.tint)}">${icon(w.icon)}</span>
          <div class="grow">
            <div class="row" style="gap:10px"><div class="card-title">${esc(w.title)}</div>
              <span class="tag" style="${tintStyle(w.tint)}">${esc(w.tag)}</span></div>
            <p class="muted" style="font-size:14px;margin-top:6px;line-height:1.5;max-width:60ch">${esc(w.body)}</p>
          </div>
          <button class="btn btn-sm btn-ghost" data-try="${esc(w.title)}">Try it${icon("arrowRight")}</button>
        </div>
      </section>`).join("")}
    </div>`;
  node.querySelectorAll("[data-try]").forEach(b=>b.addEventListener("click",()=>toast(b.dataset.try+" enabled","zap")));
  return { crumbs:[{label:"What's New", icon:"megaphone"}], node };
}

// ============================================================
// SETTINGS  (persists; theme toggle; reset)
// ============================================================
export function settings(ctx){
  const db = S.db;
  const node = pageEl();
  const n = db.settings.notifications;
  const notif = [["newSubmissions","New submissions"],["attendanceAlerts","Attendance alerts"],["parentMessages","Parent messages"],["weeklyDigest","Weekly digest"]];
  node.innerHTML = `
    ${pageHead({ title:"Settings",
      sub:"Manage your profile, preferences, and how OEdu notifies you." })}
    <div class="grid-2">
      <section class="card card-pad">
        <div class="card-head"><div class="card-title">Profile</div></div>
        <div class="row" style="gap:16px;margin-bottom:20px">
          ${avatar(db.teacher.name,db.teacher.initials,"violet",64)}
          <div><b style="font-weight:600;font-size:16px">${esc(db.teacher.name)}</b>
            <div class="muted" style="font-size:13px">${esc(db.teacher.role)} · ${esc(db.teacher.email)}</div></div>
        </div>
        <div class="fld-grid" style="grid-template-columns:1fr">
          <div class="fld"><label class="fld-label">Full name</label><input class="fld-input" id="set-name" value="${esc(db.teacher.name)}"></div>
          <div class="fld"><label class="fld-label">Email</label><input class="fld-input" id="set-email" value="${esc(db.teacher.email)}"></div>
          <div class="fld"><label class="fld-label">Role</label><input class="fld-input" id="set-role" value="${esc(db.teacher.role)}"></div>
        </div>
        <button class="btn btn-primary mt-16" id="set-save">${icon("check")}Save changes</button>
      </section>
      <div class="stack">
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Notifications</div></div>
          ${notif.map(([k,l])=>`
            <div class="att-row" style="border-radius:12px"><div><b style="font-weight:600;font-size:14px">${l}</b></div>
              <button class="switch ${n[k]?'on':''}" data-n="${k}" role="switch" aria-checked="${n[k]}" aria-label="${l}"></button></div>`).join("")}
        </section>
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Appearance</div></div>
          <div class="row" style="gap:10px">
            <button class="btn ${db.settings.theme==='light'?'btn-primary':'btn-ghost'} grow" data-theme="light">${icon("sun")}Light</button>
            <button class="btn ${db.settings.theme==='dark'?'btn-primary':'btn-ghost'} grow" data-theme="dark">${icon("moon")}Dark</button>
          </div>
          <p class="muted" style="font-size:13px;margin-top:12px">Your theme is saved and applied everywhere.</p>
        </section>
        <section class="card card-pad">
          <div class="card-head"><div class="card-title">Data</div></div>
          <p class="muted" style="font-size:13px;margin-bottom:14px">Everything you change is saved in this browser. Reset to start from sample data.</p>
          <button class="btn btn-ghost" id="set-reset" style="color:var(--danger);border-color:var(--danger-bg)">${icon("refresh")}Reset all data</button>
        </section>
      </div>
    </div>`;
  node.querySelector("#set-save").onclick=()=>{
    db.teacher.name=node.querySelector("#set-name").value.trim()||db.teacher.name;
    db.teacher.email=node.querySelector("#set-email").value.trim()||db.teacher.email;
    db.teacher.role=node.querySelector("#set-role").value.trim()||db.teacher.role;
    db.teacher.initials=db.teacher.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
    S.persist(); toast("Profile saved"); ctx.rerender();
  };
  node.querySelectorAll("[data-n]").forEach(b=>b.addEventListener("click",()=>{
    const k=b.dataset.n; n[k]=!n[k]; b.classList.toggle("on",n[k]); b.setAttribute("aria-checked",n[k]); S.persist();
  }));
  node.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{
    db.settings.theme=b.dataset.theme; S.persist(); ctx.applyTheme(); ctx.rerender();
  }));
  node.querySelector("#set-reset").onclick=()=>confirmModal({ title:"Reset all data?",
    message:"This clears everything you've changed and restores the sample school. This can't be undone.",
    confirmLabel:"Reset everything", danger:true, onConfirm:()=>{ S.resetAll(); ctx.applyTheme(); toast("Data reset"); ctx.go("today"); }});
  return { crumbs:[{label:"Settings", icon:"settings"}], node };
}

// ============================================================
// TODAY — the session timeline. 90% of all usage.
// ============================================================
export function today(ctx){
  const db = S.db;
  const node = pageEl();
  const now = D.APP.nowMin;
  const daypart = now<720?"morning":now<1020?"afternoon":"evening";
  const first = db.teacher.name.split(" ")[0];
  const sess = S.todaySessions();
  const nextId = S.nextTodayId();
  const remaining = sess.filter(s=>{ const st=S.sessionState(s); return st==="now"||st==="upcoming"; }).length;
  const follow = S.needsYou();

  const stateChip = (s)=>{
    const st = S.sessionState(s);
    if (st==="now") return `<span class="status ok">${icon("play")}In session</span>`;
    if (s.id===nextId) return `<span class="chip dot" style="color:var(--violet-ink)">Up next</span>`;
    if (st==="done") return `<span class="chip"><i>${icon("check")}</i>Done</span>`;
    return `<span class="chip">Upcoming</span>`;
  };
  const sessCard = (s)=>{
    const sub = D.subjects[s.subject]; const st = S.sessionState(s);
    const summ = S.sessionAttSummary(s.id);
    const meta = [`${fmtTime(s.time)}`, `Room ${s.room}`];
    if (summ.taken) meta.push(`${summ.present} present${summ.absent?` · ${summ.absent} absent`:""}`);
    return `<button class="sess-card ${st==="now"?"now":""} ${st==="done"?"is-done":""}" data-id="${s.id}" style="${tintStyle(sub.tint)}">
      <div class="sc-time-col"><b>${fmtTime(s.time).replace(" ","")}</b></div>
      <div class="sess-main">
        ${subjIcon(s.subject,"lg")}
        <div class="grow" style="min-width:0">
          <div class="row" style="gap:8px"><b class="sess-title">${esc(sub.name)} · ${esc(s.cls)}</b>
            ${s.kind==="exam"?`<span class="tag" style="${tintStyle(sub.tint)}">Exam</span>`:""}</div>
          <div class="sess-meta muted">${meta.join(" · ")}</div>
        </div>
        ${stateChip(s)}
        <span class="sess-go">${icon("chevR")}</span>
      </div>
    </button>`;
  };
  const freeSlot = (time)=>`<div class="free-slot"><div class="sc-time-col"><b>${fmtTime(time).replace(" ","")}</b></div>
    <div class="free-body">Free · ${time<"12:00"?"prep & grading":"office hours"}</div></div>`;

  node.innerHTML = `
    ${pageHead({ eyebrow:`${icon("sparkle")} ${esc(D.APP.todayLabel)}`,
      title:`Good ${daypart}, ${esc(first)}.`,
      sub: remaining ? `${remaining} ${remaining===1?"session":"sessions"} left today. Everything you need is inside each one.`
                     : "You're done teaching for today. Nice work." })}

    ${follow.length ? `<section class="needs mb-24">
      <div class="needs-head"><span class="needs-dot"></span>Needs you</div>
      <div class="needs-list">
        ${follow.map(f=>`<button class="needs-item" data-open="${f.session.id}" style="${tintStyle(D.subjects[f.session.subject].tint)}">
          <span class="ni-ic">${icon(f.kind==="grade"?"edit":"clock")}</span>
          <div class="grow"><b>${esc(f.label)}</b><span class="muted">${esc(f.meta)}</span></div>
          <span class="btn btn-sm btn-primary">${f.kind==="grade"?"Grade":"Take"}</span>
        </button>`).join("")}
      </div>
    </section>` : ""}

    <section class="sess-list">
      ${D.scheduleTimes.map(time=>{ const s=sess.find(x=>x.time===time); return s?sessCard(s):freeSlot(time); }).join("")}
    </section>`;

  node.querySelectorAll("[data-id]").forEach(c=>c.addEventListener("click",()=>ctx.go("session",{id:c.dataset.id})));
  node.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>ctx.go("session",{id:b.dataset.open})));
  return { crumbs:[{label:"Today", icon:"home"}], node };
}

// ============================================================
// SESSION — the full-screen workspace. The whole product lives here.
// ============================================================
export function session(ctx){
  const db = S.db;
  const s = S.sessionById(ctx.params.id);
  if (!s) return today(ctx);
  const sub = D.subjects[s.subject];
  const st = S.sessionState(s);
  const isExam = s.kind==="exam";
  const roster = S.classRoster(s.cls);
  const saved = S.getSessionAtt(s.id) || {};
  const state = {}; roster.forEach(x=>state[x.id] = saved[x.id] || "present");
  const plan = db.classPrep.find(p=>p.subject===s.subject && p.cls===s.cls) || db.classPrep.find(p=>p.subject===s.subject);
  const asg = db.assignments.map(S.assignmentView).find(a=>a.cls===s.cls && a.subject===s.subject);
  const examA = { id:s.id, title:s.title, cls:s.cls, subject:s.subject };
  const stChip = st==="now"?`<span class="status ok">${icon("play")}In session now</span>`
    : st==="done"?`<span class="chip"><i>${icon("check")}</i>Finished</span>`
    : `<span class="chip">${icon("clock")}${fmtTime(s.time)}</span>`;

  const node = pageEl();
  node.innerHTML = `
    <button class="back-link" id="back">${icon("chevL")}Today</button>
    <section class="session-hero" style="${tintStyle(sub.tint)}">
      <div class="row" style="gap:16px;align-items:flex-start">
        ${subjIcon(s.subject,"lg")}
        <div class="grow">
          <div class="row" style="gap:10px">${stChip}${isExam?`<span class="tag" style="${tintStyle(sub.tint)}">Exam</span>`:""}</div>
          <h1 class="session-title">${esc(sub.name)}</h1>
          <div class="session-sub">${esc(s.cls)} · Room ${esc(s.room)} · ${esc(s.weekday)} ${fmtTime(s.time)} · ${roster.length} students</div>
        </div>
      </div>
      <div class="row" style="margin-top:20px;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary primary-action" id="prim"></button>
        ${!isExam?`<div class="hero-att-summary muted" id="att-note"></div>`:""}
      </div>
    </section>

    <div id="conseq" class="conseq-wrap"></div>

    ${isExam ? `
      <section class="card card-pad">
        <div class="card-head"><div class="grow"><div class="card-title">Results</div>
          <div class="card-sub" id="ex-progress"></div></div>
          <button class="btn btn-soft" id="grade-ex">${icon("edit")}Open grading</button></div>
        <div id="ex-grid"></div>
        <div class="ai-actions" id="ex-actions" style="margin-top:18px"></div>
      </section>`
    : `
      <section class="card card-pad mb-24">
        <div class="card-head"><div class="grow"><div class="card-title">Attendance</div>
          <div class="card-sub">Tap to mark. Saves instantly — one entry updates the roster, class rate, and reports.</div></div>
          <div class="row" style="gap:8px" id="att-summary"></div></div>
        <div class="row" style="gap:8px;margin-bottom:14px">
          <button class="btn btn-sm btn-soft" id="all-present">${icon("checkCircle")}All present</button>
        </div>
        <div class="att-roster" id="roster"></div>
      </section>
      <section class="card card-pad mb-24 ai-actions-card" id="ai-actions-card" hidden>
        <div class="card-head"><span class="subj-ic" style="${tintStyle(sub.tint)}">${icon("sparkle")}</span>
          <div class="grow"><div class="card-title">What now?</div>
            <div class="card-sub">Actions for this session. No forms — OEdu already knows the context.</div></div></div>
        <div class="ai-actions" id="ai-actions"></div>
      </section>
      <div class="grid-2">
        <section class="card card-pad attach-card">
          <div class="card-head"><span class="subj-ic" style="${tintStyle(sub.tint)}">${icon("book")}</span>
            <div class="grow"><div class="card-title">Lesson plan</div>
              <div class="card-sub">${plan?esc(plan.topic):"No plan attached"}</div></div></div>
          ${plan?`<div class="progress" style="${tintStyle(sub.tint)};height:8px"><i style="width:${plan.ready}%"></i></div>
            <div class="muted" style="font-size:13px;margin-top:10px">${esc(plan.note)} · ${plan.resources} resources</div>`:""}
          <button class="btn btn-sm btn-ghost mt-16" id="open-plan">${icon("bookOpen")}${plan?"Open plan":"Attach from Library"}</button>
        </section>
        <section class="card card-pad attach-card">
          <div class="card-head"><span class="subj-ic" style="${tintStyle(sub.tint)}">${icon("clipboard")}</span>
            <div class="grow"><div class="card-title">Assignment</div>
              <div class="card-sub">${asg?esc(asg.title):"Nothing set for this class"}</div></div></div>
          ${asg?`<div class="row" style="gap:10px"><div class="progress" style="${tintStyle(sub.tint)};height:8px"><i style="width:${asg.assigned?Math.round(asg.graded/asg.assigned*100):0}%"></i></div>
            <b class="mono" style="font-size:12.5px">${asg.graded}/${asg.assigned}</b></div>`:""}
          <button class="btn btn-sm btn-ghost mt-16" id="open-asg">${icon("clipboard")}${asg?"Grade / review":"Set an assignment"}</button>
        </section>
      </div>`}`;

  node.querySelector("#back").onclick=()=>ctx.go("today");

  if (isExam){
    const renderExam = ()=>{
      const g = S.getGrades(s.id); const graded = Object.keys(g).length;
      node.querySelector("#ex-progress").textContent = `${graded}/${roster.length} graded`;
      node.querySelector("#ex-grid").innerHTML = `<table class="tbl"><tbody>${roster.slice(0,8).map(x=>{
        const v=g[x.id];
        return `<tr><td><div class="u-cell">${avatar(x.name,x.initials,x.hue,34)}<div><b>${esc(x.name)}</b><span>${x.grade}</span></div></div></td>
          <td style="text-align:right">${v!=null?`<b class="mono">${v}</b> <span class="tag" style="${tintStyle(bandTint[bandOf(v)])}">${bandOf(v)}</span>`:`<span class="muted">—</span>`}</td></tr>`;
      }).join("")}</tbody></table>${roster.length>8?`<div class="muted" style="font-size:13px;padding-top:10px">+${roster.length-8} more</div>`:""}`;
      const ea = node.querySelector("#ex-actions");
      if (graded>0){
        ea.innerHTML = `<button class="ai-chip" id="ex-comments"><span class="ai-chip-ic">${icon("report")}</span>
          <div class="grow"><b>Draft report-card comments</b><span class="muted">from these ${graded} scores — no retyping</span></div>${icon("chevR")}</button>`;
        ea.querySelector("#ex-comments").onclick=()=>{
          const graded0 = roster.find(x=>g[x.id]!=null) || roster[0];
          aiModal({ action:"reportComment",
            context:{ studentName:graded0.name, className:`${sub.name} ${s.cls}`, gpa:graded0.gpa, attendance:graded0.attendance, recentScore:g[graded0.id] },
            title:`Report comment — ${graded0.name.split(" ")[0]}`,
            subtitle:`Grounded in ${graded0.name.split(" ")[0]}'s actual ${sub.name} score. Regenerate for each student.`,
            onAccept:(text,close)=>{ S.saveComment(graded0.id, text); close(); toast("Comment saved to "+graded0.name.split(" ")[0]+"'s report"); } });
        };
      } else ea.innerHTML="";
    };
    const prim = node.querySelector("#prim"); prim.innerHTML = `${icon("edit")}Grade exam`;
    prim.onclick = ()=>openGrader(examA, { ...ctx, rerender:()=>{ renderExam(); } });
    node.querySelector("#grade-ex").onclick = prim.onclick;
    renderExam();
    return { crumbs:[{label:"Today", icon:"home", go:"today"},{label:esc(s.cls)},{label:"Exam"}], node };
  }

  // ---- class session: attendance inside the session ----
  const rosterEl = node.querySelector("#roster");
  const renderRoster = ()=>{
    rosterEl.innerHTML = roster.map(x=>`
      <div class="att-row">
        <div class="row" style="gap:12px">${avatar(x.name,x.initials,x.hue,38)}
          <div><b style="font-weight:600">${esc(x.name)}</b>
            <div class="muted" style="font-size:12.5px">Room ${x.room} · ${x.attendance}% term</div></div></div>
        <div class="att-toggle" data-id="${x.id}">
          <button class="present ${state[x.id]==="present"?"on":""}" data-v="present" title="Present">${icon("check")}</button>
          <button class="late ${state[x.id]==="late"?"on":""}" data-v="late" title="Late">${icon("clock")}</button>
          <button class="absent ${state[x.id]==="absent"?"on":""}" data-v="absent" title="Absent">${icon("x")}</button>
        </div>
      </div>`).join("");
    updateSummary();
  };
  const updateSummary = ()=>{
    const c={present:0,late:0,absent:0}; Object.values(state).forEach(v=>c[v]++);
    node.querySelector("#att-summary").innerHTML =
      `<span class="status ok">${c.present}</span><span class="status warn">${c.late}</span><span class="status danger">${c.absent}</span>`;
    updateHero();
    renderAiActions();
  };
  // "Zero tools, infinite actions" — contextual AI attached to this session
  const renderAiActions = ()=>{
    const wrap = node.querySelector("#ai-actions"); const card = node.querySelector("#ai-actions-card");
    if (!wrap) return;
    const taken = !!S.getSessionAtt(s.id);
    const absent = roster.filter(x=>state[x.id]==="absent");
    const className = s.cls;
    const topic = plan?.topic || `${sub.name} lesson`;
    const chips = [];
    if (taken && absent.length){
      chips.push({ ic:"sparkle", title:`Build a catch-up pack for the ${absent.length} who missed this`,
        sub:absent.map(a=>a.name.split(" ")[0]).join(", "),
        run:()=>aiModal({ action:"catchUpPack",
          context:{ names:absent.map(a=>a.name), topic, subject:sub.name, className, date:`${s.weekday} ${fmtTime(s.time)}` },
          onAccept:(text,close)=>{ S.logCatchup({ session:s.id, students:absent.map(a=>a.id), text }); close(); toast(`Catch-up pack sent to ${absent.length} student${absent.length>1?"s":""}`); } }) });
    }
    chips.push({ ic:"calendar", title:"Plan next session", sub:`from what we did in ${topic}`,
      run:()=>aiModal({ action:"planNext",
        context:{ subject:sub.name, className, lastTopic:topic, unfinished:"" },
        onAccept:(text,close)=>{ S.addLessonPlan({ subject:s.subject, cls:s.cls, topic:`Next: ${topic}`, note:text.split("\n")[0].slice(0,90), ready:55, resources:1 }); close(); toast("Saved to Library"); } }) });
    if (plan){
      chips.push({ ic:"layers", title:"Level the reading for students below grade", sub:"OEdu knows which students",
        run:()=>{ const below=roster.filter(x=>x.attendance<86).slice(0,5);
          aiModal({ action:"levelText", context:{ title:topic, subject:sub.name, targetLevel:"2 grades below", names:below.map(b=>b.name) },
            onAccept:(text,close)=>{ S.addLessonPlan({ subject:s.subject, cls:s.cls, topic:`Leveled: ${topic}`, note:"Differentiated reading", ready:70, resources:1 }); close(); toast("Leveled version saved to Library"); } }); } });
    }
    card.hidden = !taken && !plan;
    wrap.innerHTML = chips.map((c,i)=>`<button class="ai-chip" data-i="${i}">
      <span class="ai-chip-ic">${icon(c.ic)}</span>
      <div class="grow"><b>${esc(c.title)}</b><span class="muted">${esc(c.sub)}</span></div>${icon("chevR")}</button>`).join("");
    wrap.querySelectorAll("[data-i]").forEach(b=>b.addEventListener("click",()=>chips[+b.dataset.i].run()));
  };
  const updateHero = ()=>{
    const taken = !!S.getSessionAtt(s.id);
    const prim = node.querySelector("#prim");
    const note = node.querySelector("#att-note");
    if (taken){ prim.className="btn btn-soft primary-action"; prim.innerHTML=`${icon("check")}Attendance saved`;
      const c=S.sessionAttSummary(s.id); if(note) note.textContent=`${c.present} present · ${c.late} late · ${c.absent} absent — synced to records`; }
    else { prim.className="btn btn-primary primary-action"; prim.innerHTML=`${icon("checkCircle")}Take attendance`;
      if(note) note.textContent=""; }
  };
  const showConsequence = (id)=>{
    if (node.querySelector(`.consequence[data-sid="${id}"]`)) return;
    const stu = roster.find(x=>x.id===id); if(!stu) return;
    const total = S.absenceProjection(id);
    const card = h(`<div class="consequence" data-sid="${id}" style="${tintStyle("blush")}">
      <span class="cq-spark">${icon("sparkle")}</span>
      ${avatar(stu.name,stu.initials,stu.hue,40)}
      <div class="grow"><b>${esc(stu.name.split(" ")[0])} has now missed ${total} of the last 5 sessions.</b>
        <div class="muted" style="font-size:13px">Absences are starting to affect their progress. OEdu drafted a note home.</div></div>
      <button class="btn btn-primary" data-draft>${icon("mail")}Review & send</button>
      <button class="icon-btn" data-dismiss aria-label="Dismiss">${icon("x")}</button>
    </div>`);
    card.querySelector("[data-dismiss]").onclick=()=>card.remove();
    card.querySelector("[data-draft]").onclick=()=>{
      aiModal({ action:"parentNote",
        context:{ studentName:stu.name, className:`${sub.name} ${s.cls}`, count:total, teacher:db.teacher.name },
        subtitle:"Drafted from this term's attendance. Adjust tone or translate, then send.",
        onAccept:(text,close)=>{ S.sendParentNote(stu, text); close();
          toast("Note sent to "+stu.name.split(" ").slice(-1)[0]+" family"); card.remove(); renderAiActions(); }});
    };
    node.querySelector("#conseq").appendChild(card);
  };

  rosterEl.addEventListener("click", e=>{
    const b=e.target.closest("button[data-v]"); if(!b) return;
    const id=b.closest(".att-toggle").dataset.id; const v=b.dataset.v;
    state[id]=v;
    b.closest(".att-toggle").querySelectorAll("button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
    S.saveSessionAtt(s.id, state);           // Law 1 — single entry, instant propagation
    updateSummary();
    if (v==="absent" && S.crossesAbsenceThreshold(id) && !S.hasParentNote(id)) showConsequence(id);  // Law 2
  });
  renderRoster();

  node.querySelector("#prim").onclick=()=>{
    if (!S.getSessionAtt(s.id)){ S.saveSessionAtt(s.id, state); toast("Attendance saved — records updated"); updateSummary(); }
    Object.keys(state).forEach(id=>{ if(state[id]==="absent" && S.crossesAbsenceThreshold(id) && !S.hasParentNote(id)) showConsequence(id); });
    rosterEl.scrollIntoView({behavior:"smooth", block:"center"});
  };
  node.querySelector("#all-present").onclick=()=>{ roster.forEach(x=>state[x.id]="present"); S.saveSessionAtt(s.id,state); renderRoster(); };
  node.querySelector("#open-plan").onclick=()=>ctx.go("library");
  node.querySelector("#open-asg").onclick=()=>{ if(asg) openGrader(asg, ctx); else ctx.go("library"); };

  return { crumbs:[{label:"Today", icon:"home", go:"today"},{label:esc(s.cls)},{label:esc(sub.short)}], node };
}

// ============================================================
// ROSTER — the people. Analytics live here, per person and per class.
// ============================================================
export function roster(ctx){
  const db = S.db;
  const node = pageEl();
  const grades=["all",...S.classes];
  const scope = db.students.filter(x=>stGrade==="all"||x.grade===stGrade);
  const list = scope.filter(x=>!stQuery || x.name.toLowerCase().includes(stQuery.toLowerCase()) || x.email.toLowerCase().includes(stQuery.toLowerCase()));
  const avgAtt = Math.round(scope.reduce((a,s)=>a+s.attendance,0)/(scope.length||1));
  const avgGpa = (scope.reduce((a,s)=>a+ +s.gpa,0)/(scope.length||1)).toFixed(2);
  const atRisk = scope.filter(s=>s.risk!=="ok").length;

  node.innerHTML = `
    ${pageHead({ title:"Roster",
      sub:"Your students. Open anyone for their whole story — every session, absence, and grade.",
      actions:`<button class="btn btn-ghost" id="ro-gradebook">${icon("report")}Gradebook</button>
               <button class="btn btn-ghost" id="ro-export">${icon("download")}Export</button>
               <button class="btn btn-primary" id="ro-add">${icon("plus")}Add student</button>` })}
    <div class="row wrap mb-24" style="gap:8px">
      ${grades.map(g=>`<button class="month-pill ${g===stGrade?'on':''}" data-g="${g}" style="height:36px;padding:0 16px;font-size:13.5px">${g==="all"?"All classes":g}</button>`).join("")}
    </div>
    <section class="stat-grid mb-24" style="grid-template-columns:repeat(4,1fr)">
      ${[
        {ic:"users",tint:"violet",val:scope.length,label:stGrade==="all"?"Students":"In "+stGrade},
        {ic:"clock",tint:"mint",val:avgAtt+"%",label:"Avg attendance"},
        {ic:"award",tint:"sky",val:avgGpa,label:"Avg GPA"},
        {ic:"flag",tint:"peach",val:atRisk,label:"Need attention"},
      ].map(s=>`<div class="stat" style="${tintStyle(s.tint)}"><div class="s-top"><div class="s-ic">${icon(s.ic)}</div></div>
        <div class="s-val tnum">${s.val}</div><div class="s-label">${s.label}</div></div>`).join("")}
    </section>
    <section class="card card-pad">
      <div class="toolbar">
        <div class="top-search" style="min-width:260px">${icon("search")}<input id="ro-search" placeholder="Search name or email" value="${esc(stQuery)}"></div>
        <span class="grow"></span><span class="chip">${list.length} shown</span>
      </div>
      <div style="overflow-x:auto"><table class="tbl" style="min-width:720px">
        <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>GPA</th><th>Flag</th><th></th></tr></thead>
        <tbody>${list.map(s=>`<tr data-id="${s.id}" style="cursor:pointer">
          <td><div class="u-cell">${avatar(s.name,s.initials,s.hue,38)}<div><b>${esc(s.name)}</b><span>${esc(s.email)}</span></div></div></td>
          <td class="mono muted" style="font-size:13px">${s.grade}</td>
          <td><div class="row" style="gap:10px"><div class="progress" style="${tintStyle(s.attendance>90?'mint':s.attendance>85?'butter':'blush')};min-width:80px"><i style="width:${s.attendance}%"></i></div><b class="mono" style="font-size:12.5px">${s.attendance}%</b></div></td>
          <td class="mono" style="font-weight:600">${(+s.gpa).toFixed(2)}</td>
          <td>${s.risk==="ok"?`<span class="status ok">${icon("check")}On track</span>`:s.risk==="watch"?`<span class="status warn">Watch</span>`:`<span class="status danger">At risk</span>`}</td>
          <td style="text-align:right">${icon("chevR","muted")}</td>
        </tr>`).join("") || `<tr><td colspan="6"><div class="muted" style="padding:24px;text-align:center">No students match.</div></td></tr>`}</tbody>
      </table></div>
    </section>`;
  node.querySelectorAll("tr[data-id]").forEach(r=>r.addEventListener("click",()=>ctx.go("student",{id:r.dataset.id})));
  const search=node.querySelector("#ro-search");
  search.addEventListener("input",()=>{stQuery=search.value;ctx.rerender(true);});
  node.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click",()=>{stGrade=b.dataset.g;ctx.rerender();}));
  node.querySelector("#ro-gradebook").onclick=()=>ctx.go("gradebook",{cls: stGrade==="all"?"10-A":stGrade});
  node.querySelector("#ro-add").onclick=()=>newStudentForm(ctx);
  node.querySelector("#ro-export").onclick=()=>{
    const rows=[["Name","Class","Email","Attendance","GPA","Flag"],...list.map(s=>[s.name,s.grade,s.email,s.attendance+"%",(+s.gpa).toFixed(2),s.risk])];
    download("roster.csv", toCSV(rows), "text/csv"); toast("Roster exported");
  };
  return { crumbs:[{label:"Roster", icon:"users"}], node, focus:"#ro-search" };
}

// ============================================================
// LIBRARY — reusable stuff. Build once, pull into sessions forever.
// ============================================================
let libSeg="plans";
export function library(ctx){
  const db = S.db;
  const node = pageEl();
  const segs=[["plans","Lesson plans"],["exams","Exams"],["work","Assignments"]];
  const newBtn = { plans:"New lesson plan", exams:"New exam", work:"New assignment" }[libSeg];
  let body="";
  if (libSeg==="plans"){
    body = `<div class="grid-2">${db.classPrep.map((p,i)=>{ const sb=D.subjects[p.subject];
      return `<section class="card card-pad" style="${tintStyle(sb.tint)}" data-plan="${i}">
        <div class="card-head">${subjIcon(p.subject,"lg")}
          <div class="grow"><div class="card-title">${esc(p.topic)}</div>
            <div class="card-sub">${esc(sb.name)} · ${esc(p.cls)}</div></div>
          <b class="mono" style="color:${tintInk(sb.tint)}">${p.ready}%</b></div>
        <div class="progress" style="height:8px"><i style="width:${p.ready}%"></i></div>
        <div class="row" style="margin-top:14px;gap:8px"><span class="chip" style="background:rgba(255,255,255,.6)"><i>${icon("layers")}</i>${p.resources} resources</span>
          <span class="grow muted" style="font-size:12.5px">${esc(p.note)}</span></div>
      </section>`; }).join("")}</div>`;
  } else if (libSeg==="exams"){
    const rows=[]; for(const m in db.exams){ (db.exams[m]||[]).forEach(r=>r.cards.forEach(c=>rows.push({...c,month:m}))); }
    body = `<div class="lib-grid">${rows.map(c=>{ const sb=D.subjects[c.subject]||D.subjects.math;
      return `<div class="card card-pad" style="${tintStyle(sb.tint)}"><div class="card-head">${subjIcon(c.subject,"lg")}
        <div class="grow"><div class="card-title">${esc(c.title)}</div><div class="card-sub">${esc(c.cls)} · ${esc(c.grade)}</div></div></div>
        <div class="row" style="gap:8px"><span class="chip" style="background:rgba(255,255,255,.6)">${esc(c.month)} · ${fmtTime(c.time)}</span>
          <span class="grow"></span><span class="count-pill">${icon("users")}${c.count}</span></div></div>`; }).join("")
      || `<div class="empty"><div class="e-ic">${icon("exam")}</div><h4>No exams yet</h4><p>Build one to reuse across classes.</p></div>`}</div>`;
  } else {
    const all=db.assignments.map(S.assignmentView);
    body = `<div style="overflow-x:auto"><table class="tbl" style="min-width:640px">
      <thead><tr><th>Assignment</th><th>Class</th><th>Progress</th><th></th></tr></thead>
      <tbody>${all.map(a=>{ const pct=a.assigned?Math.round(a.graded/a.assigned*100):0;
        return `<tr><td><div class="u-cell">${subjIcon(a.subject)}<div><b>${esc(a.title)}</b><span>${a.submitted}/${a.assigned} in</span></div></div></td>
          <td>${subjTag(a.subject)}</td>
          <td><div class="row" style="gap:10px"><div class="progress" style="${tintStyle(D.subjects[a.subject].tint)};min-width:90px"><i style="width:${pct}%"></i></div><b class="mono" style="font-size:12.5px">${pct}%</b></div></td>
          <td style="text-align:right"><button class="btn btn-sm btn-soft" data-grade="${a.id}">Grade</button></td></tr>`; }).join("")}</tbody></table></div>`;
  }

  node.innerHTML = `
    ${pageHead({ title:"Library",
      sub:"Lesson plans, exams, and assignments you build once and pull into any session.",
      actions:`<button class="btn btn-ghost" id="lib-import">${icon("download")}Import</button>
               <button class="btn btn-primary" id="lib-new">${icon("plus")}${newBtn}</button>` })}
    <div class="seg mb-24" id="lib-seg">${segs.map(([k,l])=>`<button class="${k===libSeg?'on':''}" data-s="${k}">${l}</button>`).join("")}</div>
    ${body}`;

  node.querySelector("#lib-seg").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;libSeg=b.dataset.s;ctx.rerender();});
  node.querySelector("#lib-import").onclick=()=>importSheet(ctx);
  node.querySelector("#lib-new").onclick=()=>{ if(libSeg==="plans") newLessonForm(ctx); else if(libSeg==="exams") newExamForm(ctx); else newAssignmentForm(ctx); };
  node.querySelectorAll("[data-plan]").forEach(c=>c.addEventListener("click",()=>editPlan(ctx,+c.dataset.plan)));
  node.querySelectorAll("[data-grade]").forEach(b=>b.addEventListener("click",()=>{const a=S.db.assignments.map(S.assignmentView).find(x=>x.id===b.dataset.grade); if(a) openGrader(a,ctx);}));
  return { crumbs:[{label:"Library", icon:"bookOpen"}], node };
}
function newLessonForm(ctx){
  formModal({ title:"New lesson plan",
    fields:[
      { name:"subject", label:"Subject", type:"subject", value:"math", half:true },
      { name:"cls", label:"Class", type:"class", half:true },
      { name:"topic", label:"Topic", value:"", placeholder:"e.g. Trigonometric identities", required:true },
      { name:"note", label:"Notes", type:"textarea", value:"", placeholder:"What still needs preparing?" },
    ], submitLabel:"Create", onSubmit:(v,close)=>{ S.addLessonPlan({subject:v.subject,cls:v.cls,topic:v.topic,note:v.note||"Getting started"}); close(); toast("Lesson plan created"); ctx.rerender(); }});
}
function editPlan(ctx,i){
  const p=S.db.classPrep[i]; if(!p) return;
  formModal({ title:"Edit lesson plan", subtitle:`${D.subjects[p.subject].name} · ${p.cls}`,
    fields:[
      { name:"topic", label:"Topic", value:p.topic, required:true },
      { name:"note", label:"Notes", type:"textarea", value:p.note },
      { name:"ready", label:"Readiness %", type:"number", value:p.ready, min:0, max:100, half:true },
      { name:"resources", label:"Resources", type:"number", value:p.resources, min:0, max:50, half:true },
    ], submitLabel:"Save", onSubmit:(v,close)=>{ Object.assign(p,{topic:v.topic,note:v.note,ready:+v.ready,resources:+v.resources}); S.persist(); close(); toast("Plan updated"); ctx.rerender(); }});
}

// Migration — the #1 reason people don't switch. (Simulated in this prototype.)
function importSheet(ctx){
  sheet("Import your existing work", [
    { label:"Import from Google Classroom", icon:"download", onClick:()=>confirmModal({
        title:"Import from Google Classroom?",
        message:"OEdu will pull your classes, roster, and assignments over so you don't start from scratch. (Prototype: simulated — live interop runs through your backend + OAuth.)",
        confirmLabel:"Import", onConfirm:()=>{ const r=S.importClassroom(); toast(`Imported ${r.students} students · ${r.assignments} assignment · ${r.classes} classes`); ctx.rerender(); } }) },
    { label:"Import a Google Doc", icon:"file", onClick:()=>formModal({
        title:"Import from Google Docs", subtitle:"Bring in a doc you already wrote — teachers live in Docs. (Prototype: simulated.)",
        fields:[{ name:"name", label:"Document name", placeholder:"e.g. Macbeth — close reading", required:true }],
        submitLabel:"Import to Library", onSubmit:(v,close)=>{ S.importDoc(v.name); close(); toast("Imported to Library"); ctx.rerender(); } }) },
  ]);
}

// ============================================================
// GRADEBOOK — a REAL gradebook: weighted categories, auto-calculated,
// standards-based. The thing Google Classroom doesn't have.
// ============================================================
let gbMode = "grades";
export function gradebook(ctx){
  const cls = ctx.params.cls || "10-A";
  const node = pageEl();
  const roster = S.classRoster(cls);
  const cats = S.gradeCats(cls);
  const avg = S.classGradeAverage(cls);
  const totW = cats.reduce((a,c)=>a+c.weight,0);

  const gradesTable = ()=>`
    <div style="overflow-x:auto"><table class="tbl gb-table" style="min-width:${360+cats.length*90}px">
      <thead><tr><th>Student</th>
        ${cats.map(c=>`<th style="text-align:center">${esc(c.name)}<span class="gb-w">${c.weight}%</span></th>`).join("")}
        <th style="text-align:center">Overall</th><th style="text-align:center">Grade</th></tr></thead>
      <tbody>${roster.map(s=>{ const g=S.studentGrade(cls,s.id);
        return `<tr data-id="${s.id}"><td><div class="u-cell">${avatar(s.name,s.initials,s.hue,34)}<div><b>${esc(s.name)}</b><span>${esc(cls)}</span></div></div></td>
          ${cats.map(c=>{ const v=g.perCat[c.id]; return `<td style="text-align:center" class="mono ${v!=null?'':'muted'}">${v!=null?v:"·"}</td>`;}).join("")}
          <td style="text-align:center"><b class="mono">${g.pct!=null?g.pct+"%":"—"}</b></td>
          <td style="text-align:center"><span class="tag gb-letter" style="${tintStyle(g.pct==null?'line':g.pct>=90?'mint':g.pct>=80?'sky':g.pct>=70?'butter':g.pct>=60?'peach':'blush')}">${S.gradeLetter(g.pct)}</span></td></tr>`;
      }).join("")}</tbody></table></div>`;

  const standardsTable = ()=>{
    const subj = D.subjects[roster[0] ? Object.keys(D.subjects).find(k=>D.subjects[k].name) : "math"];
    // pick the class's dominant subject from its sessions
    const subjKey = (S.sessions.find(x=>x.cls===cls)?.subject) || "math";
    const stds = S.db.standards[subjKey] || S.db.standards.math || [];
    if (!stds.length) return `<div class="empty"><div class="e-ic">${icon("target")}</div><h4>No standards mapped</h4><p>Add standards for this subject to track mastery.</p></div>`;
    return `<div style="overflow-x:auto"><table class="tbl" style="min-width:${360+stds.length*120}px">
      <thead><tr><th>Student</th>${stds.map(st=>`<th style="text-align:center" title="${esc(st.label)}">${esc(st.code)}</th>`).join("")}</tr></thead>
      <tbody>${roster.map(s=>{ const m=S.studentMastery(s.id, subjKey);
        return `<tr><td><div class="u-cell">${avatar(s.name,s.initials,s.hue,34)}<div><b>${esc(s.name)}</b></div></div></td>
          ${m.map(x=>`<td style="text-align:center"><span class="mastery m${x.level}" title="${esc(x.label)}">${x.level||"·"}</span></td>`).join("")}</tr>`;
      }).join("")}</tbody></table></div>
      <div class="muted" style="font-size:12.5px;margin-top:12px">Mastery scale: 1 beginning · 2 developing · 3 proficient · 4 advanced</div>`;
  };

  node.innerHTML = `
    <button class="back-link" id="back">${icon("chevL")}Roster</button>
    ${pageHead({ title:"Gradebook", eyebrow:`${icon("report")} Class ${esc(cls)}`,
      sub:"Weighted categories, calculated automatically. Not a flat average — a real gradebook.",
      actions:`<button class="btn btn-ghost" id="gb-weights">${icon("sliders")}Weights</button>
               <button class="btn btn-ghost" id="gb-export">${icon("download")}Export</button>` })}
    <div class="row wrap mb-24" style="gap:8px">
      ${S.classes.map(c=>`<button class="month-pill ${c===cls?'on':''}" data-cls="${c}" style="height:34px;padding:0 15px;font-size:13px">${c}</button>`).join("")}
      <span class="grow"></span>
      <div class="seg" id="gb-seg"><button class="${gbMode==='grades'?'on':''}" data-m="grades">Grades</button><button class="${gbMode==='standards'?'on':''}" data-m="standards">Standards</button></div>
    </div>
    <section class="stat-grid mb-24" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat" style="${tintStyle('violet')}"><div class="s-top"><div class="s-ic">${icon("users")}</div></div><div class="s-val tnum">${roster.length}</div><div class="s-label">Students</div></div>
      <div class="stat" style="${tintStyle('sky')}"><div class="s-top"><div class="s-ic">${icon("chart")}</div></div><div class="s-val tnum">${avg!=null?avg+"%":"—"}</div><div class="s-label">Class average</div></div>
      <div class="stat" style="${tintStyle(totW===100?'mint':'peach')}"><div class="s-top"><div class="s-ic">${icon("sliders")}</div></div><div class="s-val tnum">${totW}%</div><div class="s-label">Weights ${totW===100?"balanced":"— should total 100"}</div></div>
    </section>
    <section class="card card-pad">${gbMode==="grades"?gradesTable():standardsTable()}</section>`;

  node.querySelector("#back").onclick=()=>ctx.go("roster");
  node.querySelectorAll("[data-cls]").forEach(b=>b.addEventListener("click",()=>ctx.go("gradebook",{cls:b.dataset.cls})));
  node.querySelector("#gb-seg").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;gbMode=b.dataset.m;ctx.rerender();});
  node.querySelectorAll("tr[data-id]").forEach(r=>r.addEventListener("click",()=>ctx.go("student",{id:r.dataset.id})));
  node.querySelector("#gb-weights").onclick=()=>{
    formModal({ title:"Category weights — "+cls, subtitle:"Weights should total 100%.",
      fields:cats.map(c=>({ name:c.id, label:c.name, type:"number", value:c.weight, min:0, max:100, half:true })),
      submitLabel:"Save weights", onSubmit:(v,close)=>{ S.updateCategoryWeights(cls, v); close(); toast("Weights updated"); ctx.rerender(); }});
  };
  node.querySelector("#gb-export").onclick=()=>{
    const rows=[["Student",...cats.map(c=>c.name),"Overall","Grade"],
      ...roster.map(s=>{ const g=S.studentGrade(cls,s.id); return [s.name,...cats.map(c=>g.perCat[c.id]??""),g.pct??"",S.gradeLetter(g.pct)]; })];
    download(`gradebook-${cls}.csv`, toCSV(rows), "text/csv"); toast("Gradebook exported");
  };
  return { crumbs:[{label:"Roster", icon:"users", go:"roster"},{label:"Gradebook "+cls}], node };
}
