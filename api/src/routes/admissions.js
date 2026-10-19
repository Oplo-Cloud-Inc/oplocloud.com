/* ==========================================================================
   The admissions office, around the application:

     /api/v1/enquiries                   a family that has asked, before it applies
     /api/v1/applications/:id/sessions   an assessment, interaction or interview
     /api/v1/applications/:id/letters    the paper the school sends, numbered and kept
     /api/v1/enrollment/sessions         a window of days across every application
     /api/v1/enrollment/reports          the cycle in numbers: funnel, sources, timeliness
     /api/v1/enrollment/register         the admission register
     /api/v1/enrollment/classes          the classes a student can be seated in

   routes/enrollment.js is the application itself; this file is what a school that
   runs admissions as a procedure adds around it. Who may do what is guard.js and
   is the same set of powers (enrollment.read/write/verify/decide/activate):
   scheduling and recording an assessment is the admissions team's, a letter is
   issued by whoever holds the power over what it says, and an offer or a regret is
   the decision-makers' alone. Nothing here sends anything; a letter is written,
   numbered and kept, and how it reached the family is recorded when it is issued.

   What the rules are is services/enrollment.js, letters.js and admissions.js; this
   file is the HTTP half.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { notify } from "../services/notify.js";
import { profileOf } from "../services/profile.js";
import * as E from "../services/enrollment.js";
import * as L from "../services/letters.js";
import { reportOf, registerRows } from "../services/admissions.js";
import { classLabel, gradeOf, byClass } from "../services/india.js";
import { orgOf, dayOf, settingsFor, powers, standing, build, note, str, domain, lookupIndex } from "./enrollment.js";

const parse = (s, dflt) => { try { const v = s ? JSON.parse(s) : dflt; return v == null ? dflt : v; } catch { return dflt; } };
const pad = (n) => String(n).padStart(4, "0");
const digits = (s) => String(s || "").replace(/\D/g, "").slice(-10);

function needDate(v, field) {
  if (!E.isDate(v)) throw ApiError.badRequest(`${field} is written YYYY-MM-DD.`, field);
  return v;
}
function optDate(v, field) { return v == null || v === "" ? null : needDate(v, field); }
function optTime(v, field) {
  if (v == null || v === "") return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) throw ApiError.badRequest(`${field} is written HH:MM, as on a 24-hour clock.`, field);
  return String(v);
}

/* ============================================================== Enquiries */

const OPEN_ENQ = E.OPEN_ENQUIRY;
const ENQ_VIEWS = ["follow_up", "new", "visits", "open", "converted", "closed", "all"];
const SOURCE_KEYS = E.ENQUIRY_SOURCES.map((x) => x[0]);

function inEnquiryView(view, e, day) {
  const open = OPEN_ENQ.includes(e.status);
  switch (view) {
    case "follow_up": return open && !!e.follow_up_on && e.follow_up_on <= day;
    case "new": return e.status === "new";
    case "visits": return open && !!e.visit_on && e.visit_on >= day;
    case "open": return open;
    case "converted": return e.status === "applied";
    case "closed": return e.status === "not_proceeding";
    default: return true;
  }
}

function enquiryShape(e, names, day) {
  const open = OPEN_ENQ.includes(e.status);
  return {
    id: e.id, number: "ENQ-" + pad(e.seq), year: e.school_year, grade: e.grade || null,
    childFirst: e.child_first, childLast: e.child_last || null,
    name: [e.child_first, e.child_last].filter(Boolean).join(" "), dob: e.dob || null,
    guardianName: e.guardian_name || null, phone: e.phone || null, email: e.email || null,
    source: e.source, referredBy: e.referred_by || null, status: e.status, open,
    followUpOn: e.follow_up_on || null, visitOn: e.visit_on || null, note: e.note || null, lostReason: e.lost_reason || null,
    assignedTo: e.assigned_to ? { id: e.assigned_to, name: names[e.assigned_to] || null } : null,
    applicationId: e.application_id || null, overdue: !!(open && e.follow_up_on && e.follow_up_on < day),
    createdAt: e.created_at, updatedAt: e.updated_at, closedAt: e.closed_at || null
  };
}

const logShape = (r) => ({ id: r.id, at: r.at, by: r.actor_name, kind: r.kind, from: r.from_value, to: r.to_value, note: r.note });

async function staffOnly(ctx, power = "enrollment.write") {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, power, { orgId });
  return { actor, orgId };
}

async function teamMember(ctx, orgId, accountId) {
  if (!accountId) return null;
  const t = await ctx.repo.listEnrollmentTeam(orgId);
  if (!t.some((m) => m.id === accountId)) {
    throw ApiError.badRequest("That person does not work on admissions, so they cannot be given an enquiry.", "to");
  }
  return accountId;
}

/* GET /api/v1/enquiries?year=&view=&q=&source=&assignee=&page=&size= */
export async function enquiries(ctx) {
  const { actor, orgId } = await staffOnly(ctx, "enrollment.read");
  const q = ctx.url.searchParams;
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const year = q.get("year") === "all" ? null : (E.isYear(q.get("year")) ? q.get("year") : settings.currentYear);
  const rows = await ctx.repo.listEnquiries({ orgId, year });

  const counts = {};
  for (const v of ENQ_VIEWS) counts[v] = rows.filter((e) => inEnquiryView(v, e, day)).length;
  const view = ENQ_VIEWS.includes(q.get("view")) ? q.get("view") : "open";
  let out = rows.filter((e) => inEnquiryView(view, e, day));
  const source = q.get("source"); if (source) out = out.filter((e) => e.source === source);
  const grade = q.get("grade"); if (grade) out = out.filter((e) => e.grade === grade);
  const who = q.get("assignee");
  if (who === "me") out = out.filter((e) => e.assigned_to === actor.id);
  else if (who === "none") out = out.filter((e) => !e.assigned_to);
  const term = String(q.get("q") || "").trim().toLowerCase();
  if (term) {
    const num = /^enq-?0*(\d+)$/i.exec(term);
    out = out.filter((e) => (num && e.seq === +num[1]) ||
      [e.child_first, e.child_last, e.guardian_name, e.phone, e.email, e.referred_by].join(" | ").toLowerCase().includes(term));
  }
  // The ones to ring come first, oldest promise first; the rest by when they last moved.
  out.sort((a, b) => view === "follow_up" || view === "open"
    ? String(a.follow_up_on || "9999").localeCompare(String(b.follow_up_on || "9999")) || b.updated_at - a.updated_at
    : b.updated_at - a.updated_at);

  const size = Math.max(5, Math.min(100, Number(q.get("size")) || 25));
  const page = Math.max(1, Number(q.get("page")) || 1);
  const slice = out.slice((page - 1) * size, page * size);
  const names = await ctx.repo.namesFor(slice.map((e) => e.assigned_to));
  return json({ items: slice.map((e) => enquiryShape(e, names, day)), total: out.length, page, size, view, counts,
                year: year || "all", today: day, sources: E.ENQUIRY_SOURCES });
}

/* GET /api/v1/enquiries/:id — with everything said and done about it. */
export async function enquiry(ctx, { enquiryId }) {
  const { orgId } = await staffOnly(ctx, "enrollment.read");
  const e = await ctx.repo.findEnquiry(enquiryId);
  if (!e || (e.org_id || null) !== (orgId || null)) throw ApiError.notFound("No such enquiry.");
  const [log, application] = await Promise.all([ctx.repo.listEnquiryLog(e.id), e.application_id ? ctx.repo.findApplication(e.application_id) : null]);
  const names = await ctx.repo.namesFor([e.assigned_to]);
  return json({ enquiry: { ...enquiryShape(e, names, dayOf(ctx)), log: log.map(logShape),
                           application: application ? { id: application.id, number: E.applicationNumber(application.seq), status: application.status } : null } });
}

/* What an enquiry says, checked. Every field is optional on an edit; on a new one the child and a way to reach the family are not. */
async function enquiryFields(ctx, orgId, body, settings, { creating }) {
  const out = {};
  const put = (k, v) => { out[k] = v === "" ? null : v; };
  if (creating || body.childFirst !== undefined) {
    const v = str(body.childFirst, "childFirst", 80);
    if (!v) throw ApiError.badRequest("The child's first name is required.", "childFirst");
    out.childFirst = v;
  }
  if (body.childLast !== undefined) put("childLast", str(body.childLast, "childLast", 80));
  if (body.dob !== undefined) {
    const d = optDate(body.dob, "dob");
    if (d && d > E.todayOf()) throw ApiError.badRequest("A date of birth is a past date.", "dob");
    out.dob = d;
  }
  if (body.guardianName !== undefined) put("guardianName", str(body.guardianName, "guardianName", 120));
  if (body.phone !== undefined) put("phone", str(body.phone, "phone", 40));
  if (body.email !== undefined) {
    const v = str(body.email, "email", 320);
    if (v && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v)) throw ApiError.badRequest("That does not look like an email address.", "email");
    put("email", v);
  }
  if (body.grade !== undefined) {
    if (body.grade) check.oneOf(body.grade, "grade", settings.grades.map((g) => g.name));
    put("grade", body.grade || "");
  }
  if (body.schoolYear !== undefined) out.schoolYear = check.oneOf(body.schoolYear, "schoolYear", settings.years);
  if (body.source !== undefined) out.source = check.oneOf(body.source, "source", SOURCE_KEYS);
  if (body.referredBy !== undefined) put("referredBy", str(body.referredBy, "referredBy", 120));
  if (body.followUpOn !== undefined) out.followUpOn = optDate(body.followUpOn, "followUpOn");
  if (body.visitOn !== undefined) out.visitOn = optDate(body.visitOn, "visitOn");
  if (body.note !== undefined) put("note", str(body.note, "note", 1000));
  return out;
}

/* POST /api/v1/enquiries */
export async function enquiryCreate(ctx) {
  const { actor, orgId } = await staffOnly(ctx);
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const body = await readJson(ctx.request, { limit: 32 * 1024 });
  const key = body.clientKey ? check.string(body.clientKey, "clientKey", { max: 64 }) : null;
  if (key) {
    const again = await ctx.repo.findEnquiryByKey(actor.id, key);
    if (again) return json({ enquiry: enquiryShape(again, {}, day), existing: true, matches: [] });
  }
  const f = await enquiryFields(ctx, orgId, body, settings, { creating: true });
  if (!f.phone && !f.email) throw ApiError.badRequest("Give a phone number or an email, so the school can reach the family.", "phone");
  let assignedTo = null;
  if (body.assignTo === "me") assignedTo = actor.id;
  else if (body.assignTo) assignedTo = await teamMember(ctx, orgId, check.string(body.assignTo, "assignTo", { max: 64 }));

  // Has this family already asked, or already applied? Said back, never a reason to refuse.
  const all = await ctx.repo.listEnquiries({ orgId });
  const phone = digits(f.phone), email = String(f.email || "").toLowerCase();
  const name = [f.childFirst, f.childLast].filter(Boolean).join(" ").toLowerCase();
  const matches = all.filter((e) => (phone.length >= 7 && digits(e.phone) === phone) || (email && String(e.email || "").toLowerCase() === email) ||
    (name && [e.child_first, e.child_last].filter(Boolean).join(" ").toLowerCase() === name))
    .slice(0, 5).map((e) => ({ kind: "enquiry", id: e.id, number: "ENQ-" + pad(e.seq), name: [e.child_first, e.child_last].filter(Boolean).join(" "), status: e.status }));
  const subject = { id: null, studentId: null, first: f.childFirst, last: f.childLast || "", dob: f.dob || null,
                    guardians: [{ phone: f.phone || "", email: f.email || "", name: "" }] };
  const lk = await lookupIndex(ctx, orgId);
  const near = lk.index(subject);
  const found = E.findDuplicates(subject, near.people, near.apps);
  for (const d of found.duplicates.filter((x) => x.strength !== "weak").slice(0, 5)) {
    matches.push({ kind: d.kind, id: d.id, number: d.number || null, name: d.name, status: d.status || "student" });
  }

  const row = await ctx.repo.createEnquiry({
    orgId, schoolYear: f.schoolYear || settings.currentYear, grade: f.grade, childFirst: f.childFirst, childLast: f.childLast, dob: f.dob,
    guardianName: f.guardianName, phone: f.phone, email: f.email, source: f.source || "walk_in", referredBy: f.referredBy,
    // A promise to ring back is part of recording an enquiry: two days on unless the desk says otherwise.
    followUpOn: f.followUpOn !== undefined ? f.followUpOn : E.addDays(day, 2), visitOn: f.visitOn, note: f.note, assignedTo,
    clientKey: key, createdBy: actor.id
  });
  await ctx.repo.addEnquiryLog(row.id, { actorId: actor.id, actorName: actor.name, kind: "created", note: f.note || null });
  const names = await ctx.repo.namesFor([row.assigned_to]);
  return json({ enquiry: enquiryShape(row, names, day), matches }, { status: 201 });
}

/* PATCH /api/v1/enquiries/:id — the particulars. Status moves by action, so every move is a line in the log. */
export async function enquiryUpdate(ctx, { enquiryId }) {
  const { actor, orgId } = await staffOnly(ctx);
  const e = await ctx.repo.findEnquiry(enquiryId);
  if (!e || (e.org_id || null) !== (orgId || null)) throw ApiError.notFound("No such enquiry.");
  if (e.status === "applied") throw ApiError.conflict("This enquiry became an application; change the application instead.");
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const body = await readJson(ctx.request, { limit: 32 * 1024 });
  const f = await enquiryFields(ctx, orgId, body, settings, { creating: false });
  if (!Object.keys(f).length) return json({ enquiry: enquiryShape(e, {}, day), unchanged: true });
  const row = await ctx.repo.updateEnquiry(e.id, f);
  await ctx.repo.addEnquiryLog(e.id, { actorId: actor.id, actorName: actor.name, kind: "note", note: "Details changed: " + Object.keys(f).join(", ") });
  const names = await ctx.repo.namesFor([row.assigned_to]);
  return json({ enquiry: enquiryShape(row, names, day) });
}

/* POST /api/v1/enquiries/:id/actions/:action */
export async function enquiryAct(ctx, { enquiryId, action }) {
  const { actor, orgId } = await staffOnly(ctx);
  const e = await ctx.repo.findEnquiry(enquiryId);
  if (!e || (e.org_id || null) !== (orgId || null)) throw ApiError.notFound("No such enquiry.");
  const day = dayOf(ctx);
  const body = await readJson(ctx.request, { limit: 16 * 1024 });
  const log = (kind, o) => ctx.repo.addEnquiryLog(e.id, { actorId: actor.id, actorName: actor.name, kind, ...o });
  const open = OPEN_ENQ.includes(e.status);
  const need = (ok, why) => { if (!ok) throw ApiError.conflict(why); };
  let row;

  switch (action) {
    case "note": {
      const text = str(body.text, "text", 1000);
      if (!text) throw ApiError.badRequest("Write something first.", "text");
      await log("note", { note: text });
      row = e;
      break;
    }
    // A call made: what was said, and when to try again.
    case "contacted": {
      need(open, "That enquiry is closed.");
      const next = optDate(body.followUpOn, "followUpOn");
      row = await ctx.repo.updateEnquiry(e.id, { status: e.status === "new" ? "contacted" : e.status, followUpOn: next });
      await log("call", { from: e.status, to: row.status, note: [str(body.note, "note", 600), next ? "Next call " + next : ""].filter(Boolean).join(" — ") || null });
      break;
    }
    case "visit_booked": {
      need(open, "That enquiry is closed.");
      const on = needDate(body.visitOn, "visitOn");
      row = await ctx.repo.updateEnquiry(e.id, { status: "visit_booked", visitOn: on, followUpOn: on });
      await log("visit", { from: e.status, to: "visit_booked", note: "Campus visit on " + on });
      break;
    }
    case "visited": {
      need(open, "That enquiry is closed.");
      const next = optDate(body.followUpOn, "followUpOn");
      row = await ctx.repo.updateEnquiry(e.id, { status: "visited", followUpOn: next || E.addDays(day, 3) });
      await log("visit", { from: e.status, to: "visited", note: str(body.note, "note", 600) || "Visited the campus" });
      break;
    }
    case "close": {
      need(open, "That enquiry is already closed.");
      const reason = str(body.reason, "reason", 200);
      if (reason.length < 3) throw ApiError.badRequest("Say why the family is not going ahead.", "reason");
      row = await ctx.repo.updateEnquiry(e.id, { status: "not_proceeding", lostReason: reason, closedAt: Date.now(), followUpOn: null });
      await log("status", { from: e.status, to: "not_proceeding", note: reason });
      break;
    }
    case "reopen": {
      need(e.status === "not_proceeding", "Only a closed enquiry can be reopened.");
      row = await ctx.repo.updateEnquiry(e.id, { status: "contacted", lostReason: null, closedAt: null, followUpOn: E.addDays(day, 2) });
      await log("status", { from: "not_proceeding", to: "contacted", note: str(body.note, "note", 300) || "Reopened" });
      break;
    }
    case "assign": {
      const to = body.to ? await teamMember(ctx, orgId, check.string(body.to, "to", { max: 64 })) : null;
      const names = await ctx.repo.namesFor([to, e.assigned_to]);
      row = await ctx.repo.updateEnquiry(e.id, { assignedTo: to });
      await log("assign", { from: e.assigned_to ? names[e.assigned_to] || e.assigned_to : null, to: to ? names[to] || to : null });
      break;
    }
    default:
      throw ApiError.notFound(`There is no "${action}" step for an enquiry.`);
  }
  const names = await ctx.repo.namesFor([row.assigned_to]);
  return json({ enquiry: enquiryShape(row, names, day) });
}

/* ============================================================== Sessions */

async function theApplication(ctx, applicationId) {
  const actor = requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  if (!view.staff) throw ApiError.forbidden("Only the school's admissions staff can do that.");
  return { actor, row, view };
}

const openApplication = (row) => E.OPEN_STATUSES.includes(row.status) && !row.enrollment_id;

async function afterSession(ctx, row, view, session) {
  const fresh = await ctx.repo.findApplication(row.id);
  const built = await build(ctx, fresh, view);
  return json({ session: built.shape.sessions.find((x) => x.id === session.id) || null, application: built.shape });
}

/* POST /api/v1/applications/:id/sessions — put an assessment, interaction or interview in the diary. */
export async function sessionCreate(ctx, { applicationId }) {
  const { actor, row, view } = await theApplication(ctx, applicationId);
  if (!openApplication(row)) throw ApiError.conflict("This application is closed, so nothing more can be scheduled for it.");
  const settings = await settingsFor(ctx, view.orgId, dayOf(ctx));
  const body = await readJson(ctx.request, { limit: 16 * 1024 });
  const def = settings.assessments.find((a) => a.key === body.kind);
  if (!def) throw ApiError.badRequest("That is not something this school assesses.", "kind");
  const x = await ctx.repo.createAssessmentSession({
    applicationId: row.id, orgId: row.org_id, kind: def.key, label: def.label, onDate: needDate(body.onDate, "onDate"),
    atTime: optTime(body.atTime, "atTime"), venue: str(body.venue, "venue", 120) || null, panel: str(body.panel, "panel", 160) || null,
    createdBy: actor.id
  });
  await note(ctx, row)("session", { field: x.id, from: null, to: "scheduled", note: `${def.label}, ${x.on_date}${x.at_time ? " " + x.at_time : ""}${x.venue ? " · " + x.venue : ""}`, internal: false });
  return afterSession(ctx, row, view, x);
}

/* PATCH /api/v1/applications/:id/sessions/:sessionId — move it, call it off, mark who did not come, or record how it went. */
export async function sessionUpdate(ctx, { applicationId, sessionId }) {
  const { actor, row, view } = await theApplication(ctx, applicationId);
  const x = await ctx.repo.findAssessmentSession(sessionId);
  if (!x || x.application_id !== row.id) throw ApiError.notFound("No such session.");
  if (!openApplication(row)) throw ApiError.conflict("This application is closed, so its sessions are fixed.");
  const body = await readJson(ctx.request, { limit: 16 * 1024 });
  const log = note(ctx, row);
  const patch = {};
  const where = `${x.label}, ${x.on_date}`;

  if (body.status === "cancelled") {
    if (x.status !== "scheduled") throw ApiError.conflict("Only a session that is still to come can be called off.");
    patch.status = "cancelled";
    await log("session", { field: x.id, from: x.status, to: "cancelled", note: `${where}${body.reason ? " — " + str(body.reason, "reason", 240) : ""}`, internal: false });
  } else if (body.status === "absent") {
    if (x.status !== "scheduled") throw ApiError.conflict("Only a session that was due can be marked as missed.");
    patch.status = "absent"; patch.recordedBy = actor.id; patch.recordedAt = Date.now();
    await log("session", { field: x.id, from: x.status, to: "absent", note: `${where} — did not attend`, internal: false });
  } else if (body.status === "completed") {
    if (!["scheduled", "absent", "completed"].includes(x.status)) throw ApiError.conflict("A session that was called off cannot be recorded.");
    const result = check.oneOf(body.result, "result", E.SESSION_RESULTS);
    const score = body.score == null || body.score === "" ? null : check.number(body.score, "score", { min: 0, max: 100000 });
    const max = body.maxScore == null || body.maxScore === "" ? null : check.number(body.maxScore, "maxScore", { min: 0, max: 100000 });
    if (score != null && max != null && score > max) throw ApiError.badRequest("The score is more than the marks it is out of.", "score");
    Object.assign(patch, { status: "completed", result, score, maxScore: max, remarks: str(body.remarks, "remarks", 1000) || null,
                           recordedBy: actor.id, recordedAt: Date.now() });
    await log("session", { field: x.id, from: x.status, to: "completed", note: `${where} — ${result.replace("_", " ")}${score != null ? `, ${score}${max != null ? "/" + max : ""}` : ""}`, internal: true });
  } else if (body.onDate !== undefined || body.atTime !== undefined || body.venue !== undefined || body.panel !== undefined) {
    if (x.status !== "scheduled") throw ApiError.conflict("Only a session that is still to come can be moved.");
    if (body.onDate !== undefined) patch.onDate = needDate(body.onDate, "onDate");
    if (body.atTime !== undefined) patch.atTime = optTime(body.atTime, "atTime");
    if (body.venue !== undefined) patch.venue = str(body.venue, "venue", 120) || null;
    if (body.panel !== undefined) patch.panel = str(body.panel, "panel", 160) || null;
    await log("session", { field: x.id, from: `${x.on_date}${x.at_time ? " " + x.at_time : ""}`, to: `${patch.onDate || x.on_date}${(patch.atTime !== undefined ? patch.atTime : x.at_time) ? " " + (patch.atTime !== undefined ? patch.atTime : x.at_time) : ""}`,
                                    note: `${x.label} moved`, internal: false });
  } else throw ApiError.badRequest("Say what changed: a new date or time, that it was called off, missed, or how it went.");

  const s = await ctx.repo.updateAssessmentSession(x.id, patch);
  return afterSession(ctx, row, view, s);
}

/* GET /api/v1/enrollment/sessions?from=&to= — the assessment desk: every session in a window of days. */
export async function sessionsOn(ctx) {
  const { orgId } = await staffOnly(ctx, "enrollment.read");
  const q = ctx.url.searchParams;
  const day = dayOf(ctx);
  const from = E.isDate(q.get("from")) ? q.get("from") : day;
  let to = E.isDate(q.get("to")) ? q.get("to") : E.addDays(from, 14);
  if (to < from) to = from;
  if (to > E.addDays(from, 92)) to = E.addDays(from, 92);
  const rows = await ctx.repo.listAssessmentSessionsOn({ orgId, from, to });
  const names = await ctx.repo.namesFor(rows.map((r) => r.recorded_by));
  return json({ from, to, today: day, items: rows.map((r) => ({
    id: r.id, applicationId: r.application_id, kind: r.kind, label: r.label, onDate: r.on_date, atTime: r.at_time || null,
    venue: r.venue || null, status: r.status, panel: r.panel || null, score: r.score, maxScore: r.max_score,
    result: r.result || null, remarks: r.remarks || null,
    recordedBy: r.recorded_by ? { id: r.recorded_by, name: names[r.recorded_by] || null } : null, recordedAt: r.recorded_at || null,
    number: E.applicationNumber(r.seq), applicant: [r.legal_first, r.legal_last].filter(Boolean).join(" ") || "Unnamed applicant",
    grade: r.entry_grade, type: r.enrollment_type, applicationStatus: r.app_status
  })) });
}

/* ============================================================== Letters */

const initials = (name) => String(name || "").replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 6);

/* Everything a letter says, gathered from the application as it stands. */
async function letterInputs(ctx, row, view, built, kind, day, n) {
  const orgRow = await ctx.repo.getOrganization(view.orgId);
  const settings = built.settings;
  const cfg = settings.letters || {};
  const profile = profileOf(orgRow);
  const app = domain(row);
  const gs = (app.form.guardians || []).filter((g) => g && g.name);
  const g = gs.find((x) => x.primary) || gs[0] || null;
  const review = app.review || {};
  const sessions = (built.sessions || []).filter((s) => s.status === "scheduled");

  let className = null, classTeacher = null, startsOn = row.intended_start || null;
  if (row.enrollment_id) {
    const enr = await ctx.repo.findEnrollment(row.enrollment_id);
    if (enr) {
      startsOn = enr.starts_on;
      const roster = await ctx.repo.getIndiaStudent(view.orgId, enr.student_id);
      if (roster && roster.grade) {
        className = `${profile.levelWord} ${classLabel(roster.grade, roster.section)}`;
        if (roster.class_teacher_id) classTeacher = (await ctx.repo.namesFor([roster.class_teacher_id]))[roster.class_teacher_id] || null;
        else {
          const k = await ctx.repo.getIndiaClass(view.orgId, roster.class_id);
          if (k && k.class_teacher_id) classTeacher = (await ctx.repo.namesFor([k.class_teacher_id]))[k.class_teacher_id] || null;
        }
      }
    }
  }
  const required = built.docs.filter((d) => d.required);
  return {
    refNo: L.referenceNo({ code: cfg.code || initials(orgRow && orgRow.name), year: row.school_year, seq: row.seq, kind, n }),
    date: day,
    school: { name: (orgRow && orgRow.name) || "", address: cfg.address || "", contact: cfg.contact || "", place: cfg.place || "" },
    addressee: g ? g.name : "", relation: g && g.relationship ? `${g.relationship} of ${[row.legal_first, row.legal_last].filter(Boolean).join(" ")}` : "",
    address: (app.form.contact || {}).address || "",
    student: [row.legal_first, row.legal_last].filter(Boolean).join(" "), grade: row.entry_grade, className, classTeacher,
    year: row.school_year, appNo: E.applicationNumber(row.seq), admissionNo: row.admission_no || "", startsOn,
    offerUntil: row.offer_until, acceptanceRequired: row.acceptance === "pending" || row.acceptance === "accepted",
    replyBy: E.addDays(day, settings.dueDays),
    outstanding: required.filter((d) => ["missing", "returned"].includes(d.status)).map((d) => ({ label: d.label, note: d.status === "returned" ? (d.note || "to be sent again") : "" })),
    corrections: (review.corrections || []).filter((c) => !c.resolved && c.kind !== "document").map((c) => c.message),
    sessions: sessions.map((s) => ({ label: s.label, onDate: s.on_date, atTime: s.at_time, venue: s.venue })),
    assessmentsAsked: E.assessmentsFor(settings, row.entry_grade, row.enrollment_type).some((a) => a.required),
    bring: required.map((d) => d.label),
    waitlist: built.shape.waitlist, rejectReason: row.decision_reason || "",
    signatory: cfg.signatory || "", designation: cfg.designation || ""
  };
}

/* The accounts a letter can be delivered to in the app: whoever made the application, the people whose email the
   application carries who have signed in before, and the guardians of the student it became. */
async function familyAccounts(ctx, row) {
  const ids = new Set();
  if (row.source === "family" && row.created_by) ids.add(row.created_by);
  for (const g of parse(row.body_json, {}).guardians || []) {
    const a = g && g.email ? await ctx.repo.findAccountByEmail(String(g.email).trim()) : null;
    if (a) ids.add(a.id);
  }
  if (row.student_id) for (const gid of await ctx.repo.guardianIdsOf([row.student_id])) ids.add(gid);
  ids.delete(ctx.actor.id);
  return [...ids];
}

/* Which letters this application may be given, and by whom: checked here and answered as the server answers anything. */
async function mayLetter(ctx, row, view, built, kind) {
  if (!E.LETTER_KINDS.includes(kind)) throw ApiError.badRequest("That is not a letter the school writes.", "kind");
  const power = L.LETTER_NEED[kind];
  if (!view.p[power]) await must(ctx, "enrollment." + power, { orgId: view.orgId });
  const shape = built.shape;
  const ok = (shape.lettersAvailable || []).some((x) => x.kind === kind);
  if (!ok) throw ApiError.conflict("That letter does not apply to an application at this stage.");
}

/* GET /api/v1/applications/:id/letters/preview?kind= — what it would say, numbered, not yet kept. */
export async function letterPreview(ctx, { applicationId }) {
  const { row, view } = await theApplication(ctx, applicationId);
  const kind = ctx.url.searchParams.get("kind");
  const built = await build(ctx, row, view, { events: false, siblings: false });
  await mayLetter(ctx, row, view, built, kind);
  const n = (await ctx.repo.countLetters(row.id, kind)) + 1;
  const doc = L.renderLetter(kind, await letterInputs(ctx, row, view, built, kind, dayOf(ctx), n));
  return json({ letter: { kind, name: L.KIND_NAME[kind], refNo: doc.refNo, subject: doc.subject, body: doc, text: L.letterText(doc), preview: true,
                          reach: (await familyAccounts(ctx, row)).length } });
}

/* POST /api/v1/applications/:id/letters { kind, channel } — issue it: numbered, kept, never changed. */
export async function letterIssue(ctx, { applicationId }) {
  const { actor, row, view } = await theApplication(ctx, applicationId);
  const body = await readJson(ctx.request, { limit: 8 * 1024 });
  const kind = body.kind;
  const channel = body.channel ? check.oneOf(body.channel, "channel", E.LETTER_CHANNELS) : "printed";
  const built = await build(ctx, row, view, { events: false, siblings: false });
  await mayLetter(ctx, row, view, built, kind);
  const recipients = channel === "inbox" ? await familyAccounts(ctx, row) : [];
  if (channel === "inbox" && !recipients.length) {
    throw ApiError.conflict("The family has no account to send this to. Print it, or hand it over, and say so.");
  }
  let saved = null;
  // Two people issuing at once would be given the same number; the loser's insert fails and counts again.
  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    const n = (await ctx.repo.countLetters(row.id, kind)) + 1 + attempt;
    const doc = L.renderLetter(kind, await letterInputs(ctx, row, view, built, kind, dayOf(ctx), n));
    try {
      saved = await ctx.repo.addLetter({ applicationId: row.id, orgId: row.org_id, kind, refNo: doc.refNo, subject: doc.subject, body: doc,
                                         channel, issuedBy: actor.id, issuedName: actor.name });
    } catch (e) {
      if (!/UNIQUE|constraint/i.test(String(e && e.message))) throw e;
    }
  }
  if (!saved) throw ApiError.conflict("The letter could not be numbered; try again.");
  let delivered = 0;
  if (recipients.length) {
    delivered = await notify(ctx.repo, { orgId: row.org_id, to: recipients, kind: "message", from: actor.id, title: saved.subject,
                                         body: L.letterText(parse(saved.body_json, {})), dedupe: "letter:" + saved.ref_no });
  }
  await note(ctx, row)("letter", { from: kind, to: saved.ref_no, note: `${L.KIND_NAME[kind]} issued (${channel === "inbox" ? `sent to ${delivered} in the app` : channel})`, internal: false });
  const fresh = await ctx.repo.findApplication(row.id);
  const doc = parse(saved.body_json, {});
  return json({ letter: { id: saved.id, kind, name: L.KIND_NAME[kind], refNo: saved.ref_no, subject: saved.subject, channel, issuedAt: saved.issued_at,
                          issuedBy: saved.issued_name, body: doc, text: L.letterText(doc), delivered },
                application: (await build(ctx, fresh, view)).shape }, { status: 201 });
}

/* GET /api/v1/applications/:id/letters/:letterId — a letter as it was issued. The family it was written to may read it. */
export async function letterGet(ctx, { applicationId, letterId }) {
  requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  await standing(ctx, row);
  const l = await ctx.repo.findLetter(letterId);
  if (!l || l.application_id !== row.id) throw ApiError.notFound("No such letter.");
  const doc = parse(l.body_json, {});
  return json({ letter: { id: l.id, kind: l.kind, name: L.KIND_NAME[l.kind], refNo: l.ref_no, subject: l.subject, channel: l.channel,
                          issuedAt: l.issued_at, issuedBy: l.issued_name, body: doc, text: L.letterText(doc) } });
}

/* ============================================================== Reports */

/* GET /api/v1/enrollment/reports?year= — the cycle in numbers. */
export async function reports(ctx) {
  const { orgId } = await staffOnly(ctx, "enrollment.read");
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const q = ctx.url.searchParams.get("year");
  const year = E.isYear(q) ? q : settings.currentYear;
  const [apps, enq, enrollments] = await Promise.all([
    ctx.repo.listApplications({ orgId, year }), ctx.repo.listEnquiries({ orgId, year }), ctx.repo.listEnrollments({ orgId, year })
  ]);
  const sessions = await ctx.repo.listAssessmentSessionsForApplications(apps.map((a) => a.id));
  return json({ year, years: settings.years, today: day, calendar: settings.calendar[year] || null,
                report: reportOf({ apps, enquiries: enq, sessions, enrollments, settings, day }) });
}

/* GET /api/v1/enrollment/register?year= — the admission register, in the order of admission numbers. */
export async function register(ctx) {
  const { orgId } = await staffOnly(ctx, "enrollment.read");
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const q = ctx.url.searchParams.get("year");
  const year = E.isYear(q) ? q : settings.currentYear;
  const p = await powers(ctx, orgId);
  const org = await ctx.repo.getOrganization(orgId);
  const rows = await ctx.repo.admissionRegister(orgId, year);
  return json({ year, years: settings.years, school: (org && org.name) || "", today: day, sensitive: !!p.sensitive,
                rows: registerRows(rows, { sensitive: !!p.sensitive }) });
}

/* GET /api/v1/enrollment/classes?year=&grade= — where a student can be seated. */
export async function classes(ctx) {
  const { orgId } = await staffOnly(ctx, "enrollment.activate");
  const q = ctx.url.searchParams;
  const settings = await settingsFor(ctx, orgId, dayOf(ctx));
  const year = E.isYear(q.get("year")) ? q.get("year") : settings.currentYear;
  const rows = (await ctx.repo.listIndiaClasses(orgId, year)).sort(byClass);
  const want = q.get("grade") ? gradeOf(q.get("grade")) : null;
  const names = await ctx.repo.namesFor(rows.map((r) => r.class_teacher_id));
  return json({ year, classes: rows.filter((c) => !want || gradeOf(c.grade) === want).map((c) => ({
    id: c.id, grade: c.grade, section: c.section, label: classLabel(c.grade, c.section), programme: c.programme || null, stream: c.stream || null,
    room: c.room || null, capacity: c.capacity == null ? null : c.capacity, strength: c.strength || 0,
    teacher: c.class_teacher_id ? { id: c.class_teacher_id, name: names[c.class_teacher_id] || c.teacher_name || null } : null
  })) });
}
