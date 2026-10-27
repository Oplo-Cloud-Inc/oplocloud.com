/* ==========================================================================
   Guardians — the school's families as one list.

   A guardian is an Oplo Account linked to one or more students (learn_guardians).
   This file turns the flat links the repository returns into what the Guardians
   screen draws: one row per guardian with the children they are linked to,
   a number and an email that are masked until asked for, and whether the family
   has signed in yet; plus the other view, the students nobody is linked to.

   Pure: no database, no clock. The route filters by who may see which students
   before it calls anything here, so a class teacher's list is built only from
   their own sections.

   GET /directory/guardians?
     view=guardians|no-guardian   q=   app=active|invited   class=X-C,XI-A   relation=Father,Mother
     sort=name|students|app       dir=asc|desc              page=   size=
   ========================================================================== */

import { maskValue } from "./india.js";

export const PAGE = 50, MAX_PAGE = 100;
const csv = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const digits = (s) => String(s || "").replace(/\D/g, "");
const title = (s) => String(s || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/* "r•••@gmail.com": enough to tell two apart, not enough to write to. */
export const maskEmail = (e) => { const s = String(e || ""), at = s.lastIndexOf("@"); return at < 1 ? null : s[0] + "•••" + s.slice(at); };

/* How a student's class reads: X-C. */
const label = (r) => (r.grade ? `${r.grade}-${r.section}` : null);

/* The flat links of one school (guardian × student) as one row per guardian. `sees(classId)` says which students this person may see. */
export function group(links, sees = () => true) {
  const by = new Map();
  for (const l of links) {
    if (!sees(l.class_id)) continue;
    let g = by.get(l.guardian_id);
    if (!g) {
      g = { id: l.guardian_id, name: l.g_name || l.g_email, email: l.g_email, status: l.g_status, cell: l.cell_phone || null, alt: l.alt_phone || null,
            relations: [], students: [], language: null, whatsapp: null };
      by.set(l.guardian_id, g);
    }
    const relation = l.label || title(l.relationship);
    if (!g.relations.includes(relation)) g.relations.push(relation);
    g.students.push({ id: l.student_id, name: l.s_name || "", classLabel: label(l), classId: l.class_id || null, relation, primary: l.is_primary === 1, admissionNo: l.admission_no || null });
    if (!g.language && l.language) g.language = l.language;
    if (g.whatsapp == null && l.whatsapp != null) g.whatsapp = l.whatsapp;
  }
  return [...by.values()];
}

/* One guardian as the list draws them: numbers masked, never the number itself. */
export function rowOf(g) {
  const phone = g.cell || g.alt;
  return {
    id: g.id, name: g.name, relations: g.relations, studentCount: g.students.length,
    students: g.students.map((s) => ({ id: s.id, name: s.name, classLabel: s.classLabel, relation: s.relation, primary: s.primary })),
    phone: phone ? maskValue(phone, 6) : null, hasPhone: !!phone, email: maskEmail(g.email), hasEmail: !!g.email,
    app: g.status === "active" ? "active" : "invited", language: g.language, whatsapp: g.whatsapp
  };
}

/* The students nobody is linked to, as the second view draws them. */
export const lonelyRow = (r) => ({ id: r.account_id, name: r.name || r.email || "", classLabel: label(r), classId: r.class_id || null, admissionNo: r.admission_no || null, admittedOn: r.admitted_on || null });

export function parse(sp) {
  const get = (k) => sp.get(k) || "";
  const num = (k, d) => { const n = parseInt(get(k), 10); return Number.isFinite(n) && n > 0 ? n : d; };
  const view = get("view") === "no-guardian" ? "no-guardian" : "guardians";
  const app = get("app");
  return { view, q: norm(get("q")).trim(), app: app === "active" || app === "invited" ? app : "", classes: csv(get("class")), relations: csv(get("relation")).map(norm),
    sort: get("sort") || "name", dir: get("dir") === "desc" ? "desc" : "asc", page: num("page", 1), size: Math.min(num("size", PAGE), MAX_PAGE) };
}

/* Whether a row passes the filters; what a search is matched against stays here, never sent. */
function matches(g, f, extra) {
  if (f.q) {
    const hay = norm([g.name, g.email, ...g.students.map((s) => s.name)].join(" ")) + " " + digits(g.cell) + " " + digits(g.alt);
    // only a word that is a number (spaces, dashes and a plus allowed) is also read as digits; "gq9z1a" is a name, not "91"
    if (!f.q.split(/\s+/).every((w) => hay.includes(w) || (/^[+\d().-]+$/.test(w) && digits(w) && hay.includes(digits(w))))) return false;
  }
  if (extra.app && (g.status === "active" ? "active" : "invited") !== extra.app) return false;
  if (f.classes.length && !g.students.some((s) => f.classes.includes(s.classLabel))) return false;
  if (f.relations.length && !g.relations.some((r) => f.relations.includes(norm(r)))) return false;
  return true;
}

const byText = (f) => (a, b) => String(f(a)).localeCompare(String(f(b)), "en", { sensitivity: "base", numeric: true });
const SORT = { name: byText((g) => g.name), students: (a, b) => a.students.length - b.students.length || byText((g) => g.name)(a, b), app: byText((g) => (g.status === "active" ? "a" : "b") + g.name) };

/* The page the guardians view shows: the rows, the total, the numbers and what the filters could narrow to. `all` is the grouped list, `lonely` the students nobody is linked to. */
export function cut(all, lonely, f) {
  const kpis = {
    guardians: all.length, withoutGuardian: lonely.length, noMobile: all.filter((g) => !g.cell && !g.alt).length,
    invited: all.filter((g) => g.status !== "active").length, active: all.filter((g) => g.status === "active").length
  };
  const counts = { all: all.filter((g) => matches(g, f, { app: "" })).length, invited: all.filter((g) => matches(g, f, { app: "invited" })).length, active: all.filter((g) => matches(g, f, { app: "active" })).length };
  const facets = {
    classes: [...new Set(all.flatMap((g) => g.students.map((s) => s.classLabel)).filter(Boolean))].sort(),
    relations: [...new Set(all.flatMap((g) => g.relations))].sort()
  };
  let list, total;
  if (f.view === "no-guardian") {
    const text = f.q.split(/\s+/).filter(Boolean);
    list = lonely.filter((r) => (!text.length || text.every((w) => norm(r.name + " " + (r.admissionNo || "")).includes(w))) && (!f.classes.length || f.classes.includes(r.classLabel)));
    list.sort(byText((r) => r.name)); if (f.dir === "desc") list.reverse();
  } else {
    list = all.filter((g) => matches(g, f, { app: f.app })).sort(SORT[f.sort] || SORT.name);
    if (f.dir === "desc") list.reverse();
  }
  total = list.length;
  const pages = Math.max(1, Math.ceil(total / f.size)), page = Math.min(f.page, pages);
  const slice = list.slice((page - 1) * f.size, page * f.size);
  return { view: f.view, rows: f.view === "no-guardian" ? slice : slice.map(rowOf), total, page, pages, size: f.size, kpis, counts, facets };
}
