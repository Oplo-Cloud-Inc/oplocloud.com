// ============================================================
// OEdu · Identity — provider-agnostic auth. This is OEdu's OWN auth,
// not Google/OAuth. Roles: teacher, admin, guardian.
//
// ── INTEGRATION SEAM ─────────────────────────────────────────
// LocalAuthProvider implements the whole app-facing interface against
// localStorage + a seeded user table. To go live, implement the SAME
// interface against your backend (ApiAuthProvider sketch at the bottom)
// and export that instead. Nothing else in the app changes.
//
// Interface:  currentUser() · signIn(email,pw) · signInAs(role) ·
//             signOut() · onChange(fn) · listUsers() · addUser(u)
// ============================================================

const SESSION_KEY = "oedu.auth.session.v1";
const USERS_KEY   = "oedu.auth.users.v1";

// Seed accounts (demo). In production these live in your user store.
const SEED_USERS = [
  { id:"u-teacher",  role:"teacher",  name:"Amir Baqian", email:"amir@westbrook.edu",   password:"demo", initials:"AB", title:"Senior Teacher" },
  { id:"u-admin",    role:"admin",    name:"Dana Osei",   email:"admin@westbrook.edu",  password:"demo", initials:"DO", title:"School Administrator" },
  { id:"u-guardian", role:"guardian", name:"Sara Karim",  email:"parent@westbrook.edu", password:"demo", initials:"SK", title:"Guardian", students:["s100"] },
];

const strip = ({ password, ...u })=> u;   // never expose password hashes to the app

class LocalAuthProvider {
  constructor(){
    this.subs = new Set();
    this.users = this._loadUsers();
    this._user = this._loadSession();
  }
  _loadUsers(){
    try { const r = localStorage.getItem(USERS_KEY); if (r) return JSON.parse(r); } catch {}
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS.map(u=>({ ...u }));
  }
  _saveUsers(){ localStorage.setItem(USERS_KEY, JSON.stringify(this.users)); }
  _loadSession(){ try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }

  currentUser(){ return this._user; }

  async signIn(email, password){
    const u = this.users.find(x=>x.email.toLowerCase()===String(email||"").trim().toLowerCase());
    await new Promise(r=>setTimeout(r,240)); // simulate network
    if (!u || u.password!==password) { const e=new Error("Incorrect email or password."); e.code="bad_credentials"; throw e; }
    this._set(strip(u)); return this._user;
  }
  async signInAs(role){                                   // demo convenience — one-tap role entry
    const u = this.users.find(x=>x.role===role); if (!u) throw new Error("No "+role+" account.");
    this._set(strip(u)); return this._user;
  }
  async signOut(){ this._set(null); }

  listUsers(){ return this.users.map(strip); }
  addUser(u){
    const rec = { id:"u"+Date.now().toString(36), password:"demo", initials:(u.name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(), ...u };
    this.users.push(rec); this._saveUsers(); this._emit(); return strip(rec);
  }
  removeUser(id){ this.users = this.users.filter(u=>u.id!==id); this._saveUsers(); this._emit(); }

  _set(u){
    this._user = u;
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    this._emit();
  }
  _emit(){ this.subs.forEach(f=>f(this._user)); }
  onChange(fn){ this.subs.add(fn); return ()=>this.subs.delete(fn); }
}

// ── SWAP POINT ───────────────────────────────────────────────
// class ApiAuthProvider {
//   async signIn(email, password){
//     const r = await fetch("/auth/login", { method:"POST", headers:{ "Content-Type":"application/json" },
//       body: JSON.stringify({ email, password }) });
//     if (!r.ok) throw new Error("bad_credentials");
//     const { user, token } = await r.json();
//     sessionStorage.setItem("oedu.token", token);
//     this._set(user); return user;
//   }
//   // ...currentUser / signOut / onChange identical shape...
// }
// export const auth = new ApiAuthProvider();

export const auth = new LocalAuthProvider();

export const ROLE_LABEL = { teacher:"Teacher", admin:"Administrator", guardian:"Guardian" };
export const isRole = (r)=> auth.currentUser()?.role === r;
export function requireRole(...roles){ return roles.includes(auth.currentUser()?.role); }
