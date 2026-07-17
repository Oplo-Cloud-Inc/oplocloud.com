// ============================================================
// OEdu · Admin — a separate MODE, not a fourth teaching tab.
// Student & guardian accounts, Close-the-Loop thresholds, school settings.
// ============================================================
import { icon } from "./icons.js";
import { esc, avatar, tintStyle, toast } from "./ui.js";
import { formModal, confirmModal } from "./modal.js";
import { auth, ROLE_LABEL } from "./auth.js";
import * as S from "./store.js";
import * as D from "./data.js";

const pageEl = ()=>{ const n=document.createElement("div"); n.className="page"; return n; };
let adminSeg = "overview";

function head(node){
  return `<header class="page-head"><div class="row" style="align-items:flex-start">
    <div class="grow"><div class="page-eyebrow">${icon("lock")} Admin console</div>
      <h1 class="page-title">School administration</h1>
      <p class="page-sub">Accounts, alert thresholds, and school-wide settings. Separate from teaching.</p></div>
    </div></header>
    <div class="seg mb-24" id="adm-seg">${[["overview","Overview"],["accounts","Accounts"],["thresholds","Alert thresholds"],["school","School"]]
      .map(([k,l])=>`<button class="${k===adminSeg?'on':''}" data-s="${k}">${l}</button>`).join("")}</div>`;
}

export function admin(ctx){
  const node = pageEl();
  node.innerHTML = head(node) + `<div id="adm-body"></div>`;
  node.querySelector("#adm-seg").addEventListener("click", e=>{ const b=e.target.closest("[data-s]"); if(!b)return; adminSeg=b.dataset.s; ctx.rerender(); });
  const body = node.querySelector("#adm-body");
  ({ overview, accounts, thresholds, school })[adminSeg](body, ctx);
  return { crumbs:[{label:"Admin", icon:"lock"}], node };
}

function overview(body){
  const users = auth.listUsers();
  const tiles = [
    { ic:"users", tint:"violet", val:S.db.students.length, label:"Students" },
    { ic:"heart", tint:"blush", val:users.filter(u=>u.role==="guardian").length, label:"Guardian accounts" },
    { ic:"book", tint:"sky", val:users.filter(u=>u.role==="teacher").length, label:"Teacher accounts" },
    { ic:"mail", tint:"mint", val:S.db.parentNotes.length, label:"Notes sent home" },
  ];
  const atRisk = S.db.students.filter(s=>s.risk!=="ok").length;
  body.innerHTML = `
    <section class="stat-grid mb-24" style="grid-template-columns:repeat(4,1fr)">
      ${tiles.map(t=>`<div class="stat" style="${tintStyle(t.tint)}"><div class="s-top"><div class="s-ic">${icon(t.ic)}</div></div>
        <div class="s-val tnum">${t.val}</div><div class="s-label">${t.label}</div></div>`).join("")}
    </section>
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">This week, across the school</div>
        <div class="card-sub">The loop, at the admin altitude — every note a teacher sends surfaces here.</div></div></div>
      <div class="adm-line"><span class="status ${atRisk?'warn':'ok'}">${atRisk} at risk</span>
        <span class="muted">students flagged for follow-up by the attendance & grade thresholds</span></div>
      <div class="adm-line"><span class="status ok">${S.db.parentNotes.length} sent</span>
        <span class="muted">parent notes generated from real context and approved by teachers</span></div>
      <div class="adm-line"><span class="chip">${S.db.imports.length} imports</span>
        <span class="muted">migrations from Google Classroom / Docs</span></div>
    </section>`;
}

function accounts(body, ctx){
  const users = auth.listUsers();
  const roleTint = { teacher:"sky", admin:"violet", guardian:"blush" };
  body.innerHTML = `
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">Accounts</div>
        <div class="card-sub">OEdu Identity — your own auth. Guardians here can see their child's grades.</div></div>
        <button class="btn btn-primary" id="adm-add">${icon("plus")}Add account</button></div>
      <div style="overflow-x:auto"><table class="tbl" style="min-width:640px">
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Linked to</th><th></th></tr></thead>
        <tbody>${users.map(u=>{
          const kids = u.role==="guardian" ? S.studentsForGuardian(u.id).map(s=>s.name).join(", ") : "—";
          return `<tr><td><div class="u-cell">${avatar(u.name,u.initials,roleTint[u.role]||"violet",36)}<div><b>${esc(u.name)}</b><span>${esc(u.title||ROLE_LABEL[u.role])}</span></div></div></td>
            <td><span class="tag" style="${tintStyle(roleTint[u.role]||'violet')}">${ROLE_LABEL[u.role]}</span></td>
            <td class="muted" style="font-size:13px">${esc(u.email)}</td>
            <td class="muted" style="font-size:13px">${esc(kids||"—")}</td>
            <td style="text-align:right">${u.id==="u-teacher"?"":`<button class="btn btn-sm btn-ghost" data-del="${u.id}">${icon("x")}</button>`}</td></tr>`;
        }).join("")}</tbody></table></div>
    </section>`;
  body.querySelector("#adm-add").onclick=()=>addAccount(ctx);
  body.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    confirmModal({ title:"Remove account?", message:"They will lose access to OEdu.", confirmLabel:"Remove", danger:true,
      onConfirm:()=>{ auth.removeUser(b.dataset.del); toast("Account removed"); ctx.rerender(); }});
  }));
}

function addAccount(ctx){
  const studentOpts = S.db.students.map(s=>({ value:s.id, label:`${s.name} · ${s.grade}` }));
  formModal({ title:"Add account", subtitle:"Create a teacher, admin, or guardian login.",
    fields:[
      { name:"name", label:"Full name", required:true, placeholder:"e.g. Sara Karim" },
      { name:"email", label:"Email", type:"email", required:true, placeholder:"name@westbrook.edu", half:true },
      { name:"role", label:"Role", type:"select", options:[{value:"teacher",label:"Teacher"},{value:"admin",label:"Administrator"},{value:"guardian",label:"Guardian"}], value:"guardian", half:true },
      { name:"student", label:"Guardian of (student)", type:"select", options:studentOpts, placeholder:"Select a student", hint:"Only used for guardian accounts." },
    ], submitLabel:"Create account", onSubmit:(v,close)=>{
      const u = auth.addUser({ name:v.name, email:v.email, role:v.role, title:ROLE_LABEL[v.role] });
      if (v.role==="guardian" && v.student) S.linkGuardian(v.student, u.id);
      close(); toast(`${v.name} added`); ctx.rerender();
    }});
}

function thresholds(body, ctx){
  const t = S.thresholds();
  body.innerHTML = `
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">Close-the-Loop thresholds</div>
        <div class="card-sub">When a student crosses one of these, OEdu drafts the note home — automatically.</div></div></div>
      <form id="thr-form" class="fld-grid">
        <div class="fld"><label class="fld-label">Absence alert — missed sessions (of last 5)</label>
          <input class="fld-input" name="absences" type="number" min="1" max="5" value="${t.absences}"></div>
        <div class="fld"><label class="fld-label">Missing-work alert — count</label>
          <input class="fld-input" name="missingWork" type="number" min="1" max="10" value="${t.missingWork}"></div>
        <div class="fld"><label class="fld-label">Grade-drop alert — percentage points</label>
          <input class="fld-input" name="gradeDrop" type="number" min="5" max="30" value="${t.gradeDrop}"></div>
      </form>
      <div class="row mt-16"><span class="grow"></span><button class="btn btn-primary" id="thr-save">${icon("check")}Save thresholds</button></div>
    </section>
    <p class="muted" style="font-size:13px;margin-top:14px">${icon("sparkle")} Lowering the absence threshold makes the loop fire sooner. Right now, a student who misses <b>${t.absences}</b> of their last 5 sessions triggers a drafted note during attendance.</p>`;
  body.querySelector("#thr-save").onclick=()=>{
    const f=body.querySelector("#thr-form");
    S.setThresholds({ absences:+f.absences.value, missingWork:+f.missingWork.value, gradeDrop:+f.gradeDrop.value });
    toast("Thresholds updated"); ctx.rerender();
  };
}

function school(body, ctx){
  body.innerHTML = `
    <section class="card card-pad">
      <div class="card-head"><div class="grow"><div class="card-title">School</div>
        <div class="card-sub">${esc(D.school.name)} · ${esc(D.school.term)}</div></div></div>
      <div class="adm-line"><b>Compliance posture</b><span class="muted">Student PII stays in your tenant. No student-facing accounts in v1 — keeps you clear of NY Ed Law §2-d exposure.</span></div>
      <div class="adm-line"><b>Data residency</b><span class="muted">Single-school tenant. Guardians see only their own child.</span></div>
    </section>
    <section class="card card-pad mt-24">
      <div class="card-head"><div class="grow"><div class="card-title">Danger zone</div>
        <div class="card-sub">Restore the sample school. Clears everything you've changed.</div></div>
        <button class="btn btn-danger" id="adm-reset">${icon("refresh")}Reset all data</button></div>
    </section>`;
  body.querySelector("#adm-reset").onclick=()=>confirmModal({ title:"Reset all data?",
    message:"This clears every change and restores the sample school. This can't be undone.",
    confirmLabel:"Reset everything", danger:true, onConfirm:()=>{ S.resetAll(); toast("Data reset"); ctx.go("admin"); }});
}
