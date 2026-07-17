// ============================================================
// OEdu · Teacher — app shell + router, now auth-gated & role-aware
// Boots through OEdu Identity → teacher/admin shell or guardian shell.
// ============================================================
import { icon } from "./icons.js";
import { h, esc, avatar, toast } from "./ui.js";
import { nav, school } from "./data.js";
import * as S from "./store.js";
import * as V from "./views.js";
import * as G from "./guardian.js";
import * as A from "./admin.js";
import { auth, ROLE_LABEL } from "./auth.js";

const teacherRoutes = {
  today: V.today, roster: V.roster, library: V.library,
  session: V.session, student: V.student, gradebook: V.gradebook,
  settings: V.settings, admin: A.admin,
  // legacy views (not in the sidebar, still reachable programmatically)
  overview: V.overview, prep: V.prep, attendance: V.attendance, exams: V.exams,
  assignments: V.assignments, schedule: V.schedule, students: V.students,
  messages: V.messages, analytics: V.analytics, reports: V.reports,
  news: V.news, activities: V.activities, whatsnew: V.whatsnew,
};
const guardianRoutes = { ghome: G.home, gchild: G.child };
const navOf = { student:"roster", session:"today", gradebook:"roster", settings:null, admin:"admin" };

const state = { mode:"login", route:"today", params:{}, collapsed:false, mobileOpen:false };
const appRoot = document.getElementById("app");

function applyTheme(){ document.documentElement.dataset.theme = S.db.settings?.theme || "light"; }
function activeRoutes(){ return state.mode==="guardian" ? guardianRoutes : teacherRoutes; }

// ---------------------------------------------------------------
// BOOT — decide what to render based on the signed-in user
// ---------------------------------------------------------------
function boot(){
  applyTheme();
  const u = auth.currentUser();
  if (!u) { state.mode="login"; return renderLogin(); }
  if (u.role==="guardian"){ state.mode="guardian"; state.route="ghome"; return guardianShell(u); }
  state.mode="teacher"; state.route = u.role==="admin" ? "admin" : "today";
  teacherShell(u);
}

// ---------------------------------------------------------------
// LOGIN — OEdu Identity (your own auth, not Google)
// ---------------------------------------------------------------
function renderLogin(){
  appRoot.classList.remove("boot"); appRoot.removeAttribute("aria-busy");
  appRoot.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-brand"><div class="brand-mark">${icon("chart")}</div><div><b>OEdu</b><span>Teacher</span></div></div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-lede">Sign in to your school workspace.</p>
        <form id="login-form" class="auth-form">
          <label class="fld"><span class="fld-label">Email</span>
            <input class="fld-input" id="li-email" type="email" placeholder="you@school.edu" autocomplete="username" required></label>
          <label class="fld"><span class="fld-label">Password</span>
            <input class="fld-input" id="li-pass" type="password" placeholder="••••••••" autocomplete="current-password" required></label>
          <div class="auth-error" id="li-error" hidden></div>
          <button class="btn btn-primary auth-submit" type="submit">${icon("lock")}Sign in</button>
        </form>
        <div class="auth-sep"><span>or open a demo account</span></div>
        <div class="auth-demos">
          <button class="auth-demo" data-role="teacher">${icon("book")}<b>Teacher</b><span>The full workspace</span></button>
          <button class="auth-demo" data-role="admin">${icon("settings")}<b>Admin</b><span>School console</span></button>
          <button class="auth-demo" data-role="guardian">${icon("heart")}<b>Guardian</b><span>See my child</span></button>
        </div>
        <div class="auth-foot">${icon("lock")} Your school's own sign-in — not Google · <b>OEdu Identity</b></div>
      </div>
    </div>`;

  const form = document.getElementById("login-form");
  const err = document.getElementById("li-error");
  form.addEventListener("submit", async e=>{
    e.preventDefault(); err.hidden=true;
    try { await auth.signIn(document.getElementById("li-email").value, document.getElementById("li-pass").value); boot(); }
    catch(ex){ err.textContent = ex.message || "Sign-in failed."; err.hidden=false; }
  });
  appRoot.querySelectorAll(".auth-demo").forEach(b=>b.addEventListener("click", async ()=>{
    await auth.signInAs(b.dataset.role); boot();
  }));
}

// ---------------------------------------------------------------
// TEACHER / ADMIN shell (the teaching workspace)
// ---------------------------------------------------------------
function teacherShell(u){
  appRoot.classList.remove("boot"); appRoot.removeAttribute("aria-busy");
  appRoot.innerHTML = `
    <div class="frame"><div class="device" id="device">
      <div class="scrim" id="scrim"></div>
      <aside class="side">
        <div class="side-head">
          <div class="brand"><div class="brand-mark">${icon("chart")}</div>
            <div class="brand-text"><div class="brand-name">OEdu</div><div class="brand-sub">Teacher</div></div></div>
          <button class="icon-btn" id="collapse" title="Collapse menu">${icon("panelLeft")}</button>
        </div>
        <nav class="side-scroll" id="nav"></nav>
        <div class="side-foot">
          <button class="who" id="who">
            <span id="who-av">${avatar(u.name, u.initials, "violet", 40)}</span>
            <div class="who-txt"><div class="who-name" id="who-name">${esc(u.name)}</div>
              <div class="who-role">${esc(u.title || ROLE_LABEL[u.role])}</div></div>
            <span class="nav-extra icon-btn" style="width:28px;height:28px">${icon("chevUp")}</span>
          </button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <button class="top-btn nav-toggle" id="mnav" aria-label="Menu">${icon("grid")}</button>
          <div class="crumbs" id="crumbs"></div>
          <div class="top-spacer"></div>
          <div class="top-actions">
            <label class="top-search">${icon("search")}
              <input id="global-search" placeholder="Search OEdu" aria-label="Search">
              <span class="kbd"><b>⌘</b><b>K</b></span></label>
            <button class="top-btn" id="tb-bell" title="Notifications" aria-label="Notifications">${icon("bell")}<span class="dot"></span></button>
            <button class="top-btn" id="tb-search" title="Search" aria-label="Search">${icon("search")}</button>
            <div id="oplo-actions"></div>
          </div>
        </header>
        <div class="scroll" id="scroll"></div>
      </main>
    </div></div>`;
  buildNav(u);
  wireShell(u);
  mount();
}

function buildNav(u){
  const el = document.getElementById("nav");
  const adminItem = (u.role==="teacher"||u.role==="admin") ? `
    <button class="nav-item" data-route="admin">
      <span class="nav-ic">${icon("lock")}</span><span class="nav-txt">Admin</span></button>` : "";
  el.innerHTML = nav.map(it=>`
    <button class="nav-item" data-route="${it.id}">
      <span class="nav-ic">${icon(it.icon)}</span><span class="nav-txt">${esc(it.label)}</span>
      ${it.kbd?`<span class="nav-extra kbd">${it.kbd.map(k=>`<b>${k}</b>`).join("")}</span>`:""}
    </button>`).join("") + `
    <div class="side-label"><span>Account</span></div>
    ${adminItem}
    <button class="nav-item" data-route="settings">
      <span class="nav-ic">${icon("settings")}</span><span class="nav-txt">Settings</span></button>
    <button class="nav-item" id="signout">
      <span class="nav-ic">${icon("logout")}</span><span class="nav-txt">Sign out</span></button>`;
  el.addEventListener("click", e=>{
    const b = e.target.closest("[data-route]");
    if (b){ go(b.dataset.route); return; }
    if (e.target.closest("#signout")) signOut();
  });
}

function highlightNav(){
  const active = navOf[state.route] !== undefined ? navOf[state.route] : state.route;
  document.querySelectorAll("#nav .nav-item").forEach(b=> b.classList.toggle("active", b.dataset.route===active));
}

async function signOut(){ await auth.signOut(); toast("Signed out","logout"); boot(); }

function wireShell(u){
  const device = document.getElementById("device");
  document.getElementById("collapse").onclick = ()=>{ state.collapsed=!state.collapsed; device.classList.toggle("nav-collapsed", state.collapsed); };
  const openMobile = v=>{ state.mobileOpen=v; device.classList.toggle("nav-open", v); };
  document.getElementById("mnav").onclick = ()=>openMobile(!state.mobileOpen);
  document.getElementById("scrim").onclick = ()=>openMobile(false);
  document.getElementById("who").onclick = ()=>go("settings");
  document.getElementById("tb-bell").onclick = ()=>{
    const n=S.db.parentNotes.length;
    toast(n?`${n} note${n>1?"s":""} sent home this week`:"You're all caught up","bell");
  };
  document.getElementById("tb-search").onclick = ()=>document.getElementById("global-search")?.focus();
  window.addEventListener("keydown", e=>{
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); document.getElementById("global-search")?.focus(); }
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="d"){ e.preventDefault(); go("today"); }
    if (e.key==="Escape" && state.mobileOpen) openMobile(false);
  });
  const gs = document.getElementById("global-search");
  gs.addEventListener("keydown", e=>{ if(e.key==="Enter"&&gs.value.trim()){ go("roster"); toast(`Searching “${gs.value.trim()}”`,"search"); gs.value=""; }});
  S.subscribe(()=>{
    const nm=document.getElementById("who-name"); if(nm) nm.textContent=auth.currentUser()?.name||nm.textContent;
  });
}

// ---------------------------------------------------------------
// GUARDIAN shell (parents can see grades — read-mostly)
// ---------------------------------------------------------------
function guardianShell(u){
  appRoot.classList.remove("boot"); appRoot.removeAttribute("aria-busy");
  appRoot.innerHTML = `
    <div class="frame"><div class="device guardian-device">
      <header class="g-topbar">
        <div class="brand"><div class="brand-mark">${icon("chart")}</div>
          <div class="brand-text"><div class="brand-name">OEdu</div><div class="brand-sub">Family</div></div></div>
        <div class="crumbs" id="crumbs"></div>
        <div class="top-spacer"></div>
        <div class="g-user">${avatar(u.name,u.initials,"blush",34)}<span>${esc(u.name)}</span>
          <button class="btn btn-sm btn-ghost" id="g-signout">${icon("logout")}Sign out</button>
          <div id="oplo-actions"></div></div>
      </header>
      <div class="scroll g-scroll" id="scroll"></div>
    </div></div>`;
  document.getElementById("g-signout").onclick = signOut;
  mount();
}

// ---------------------------------------------------------------
// routing / mount (shared)
// ---------------------------------------------------------------
function go(route, params={}){
  const routes = activeRoutes();
  if (!routes[route]) return;
  state.route = route; state.params = params;
  if (state.mobileOpen){ state.mobileOpen=false; document.getElementById("device")?.classList.remove("nav-open"); }
  mount();
}
function ctx(){ return { params: state.params, go, toast, applyTheme, user: auth.currentUser(),
  rerender:(keepFocus=false)=>mount(keepFocus) }; }

function mount(keepFocus=false){
  const scroll = document.getElementById("scroll");
  const routes = activeRoutes();
  let focusSel=null, caret=0;
  if (keepFocus && document.activeElement && document.activeElement.id){
    focusSel = "#"+document.activeElement.id; caret = document.activeElement.selectionStart ?? 0;
  }
  const prevScroll = scroll.scrollTop;
  const view = routes[state.route](ctx());
  scroll.innerHTML = ""; scroll.appendChild(view.node);
  renderCrumbs(view.crumbs);
  if (state.mode==="teacher") highlightNav();
  if (keepFocus && focusSel){
    const elF = view.node.querySelector(focusSel);
    if (elF){ elF.focus(); try{ elF.setSelectionRange(caret,caret);}catch{} }
    scroll.scrollTop = prevScroll;
  } else scroll.scrollTop = 0;
  document.title = `OEdu · ${view.crumbs.map(c=>c.label).slice(-1)[0]}`;
}

function renderCrumbs(crumbs){
  const el = document.getElementById("crumbs"); if(!el) return;
  const parts = [{label:school.name}].concat(crumbs);
  el.innerHTML = parts.map((c,i)=>{
    const last = i===parts.length-1;
    const inner = `${c.icon?icon(c.icon):""}<span>${esc(c.label)}</span>`;
    const cls = last?"c-item c-now":"c-item";
    const node = c.go ? `<a class="${cls}" data-go="${c.go}" style="cursor:pointer">${inner}</a>` : `<span class="${cls}">${inner}</span>`;
    return (i>0?`<span class="c-sep">${icon("chevR")}</span>`:"") + node;
  }).join("");
  el.querySelectorAll("[data-go]").forEach(a=>a.addEventListener("click",()=>go(a.dataset.go)));
}

// ---------- start ----------
applyTheme();
setTimeout(boot, 360);
