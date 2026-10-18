/* ==========================================================================
   /api/v1/applications, /api/v1/enrollments and /api/v1/enrollment/*

   Admitting a student, as a workflow with an owner at every step — not a form
   with a Save button. What this file does is the HTTP half: who may take
   which step (guard.js), what the request must say, what is written, and
   what is told back. What an application needs, and what is stopping it, is
   decided by services/enrollment.js.

   Three things hold everywhere below:

     · Every change leaves a line in the application's history — who, when,
       from what, to what, and why — and nothing here can change or remove a
       line once it is there.
     · Approving and enrolling are two acts. A decision does not create a
       student's year; activation does, and it is separate on purpose.
     · What happens after enrolling (the student joins courses, the family is
       linked, the record is written) is retryable and visible. A step that
       fails leaves a note for staff and an enrollment that is still valid.

   A family reaches only the applications it made, and sees what it needs:
   where things stand, what was asked of it. Review notes, how a duplicate
   was settled and the reviewer's reasoning are the school's.
   ========================================================================== */

import { profileOf } from "../services/profile.js";
import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must, guardsStudent } from "../core/guard.js";
import { hashPassword } from "../lib/crypto.js";
import { RELATIONSHIPS } from "../services/family.js";
import * as E from "../services/enrollment.js";

const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);

const parse = (s, dflt) => {
  try { const v = s ? JSON.parse(s) : dflt; return v == null ? dflt : v; } catch { return dflt; }
};

/* The day the caller is on. A client may say which day it is for them (a
   school in India is a day ahead of UTC for hours at a time); anything that
   is not a real date is ignored. */
function dayOf(ctx) {
  const t = ctx.url.searchParams.get("today");
  return E.isDate(t) ? t : E.todayOf();
}

async function settingsFor(ctx, orgId, day) {
  const row = orgId ? await ctx.repo.getEnrollmentSettings(orgId) : null;
  const settings = E.normaliseSettings(row ? parse(row.body_json, {}) : {}, day);
  // Many Indian children have one name. A US application still asks for a last name; an Indian school's does not.
  settings.singleName = !!orgId && profileOf(await ctx.repo.getOrganization(orgId)).region !== "US";
  return settings;
}

async function powers(ctx, orgId) {
  const names = ["write", "verify", "decide", "activate", "sensitive", "settings"];
  const got = await Promise.all(names.map((n) => can(ctx, "enrollment." + n, { orgId })));
  const out = {};
  names.forEach((n, i) => { out[n] = got[i]; });
  return out;
}

/* Who is asking, in the terms this file cares about: staff of some kind, or a
   family that made this application. Anyone else is refused as if there were
   nothing there. */
async function standing(ctx, row) {
  const actor = ctx.actor;
  const orgId = row.org_id || orgOf(actor);
  const p = await powers(ctx, orgId);
  const staff = p.write;
  let owner = false;
  if (!staff) {
    owner = row.created_by === actor.id ||
            (!!row.student_id && (await guardsStudent(ctx, actor, row.student_id)));
  }
  if (!staff && !owner) throw ApiError.notFound("No such application.");
  return { staff, owner, p, orgId };
}

/* ------------------------------------------------------------------ Domain */

function domain(row, over) {
  return {
    id: row.id, status: row.status, type: row.enrollment_type, grade: row.entry_grade, year: row.school_year,
    studentId: row.student_id, legalFirst: row.legal_first, legalLast: row.legal_last,
    preferredName: row.preferred_name, dob: row.dob, intendedStart: row.intended_start,
    form: parse(row.body_json, {}), review: parse(row.review_json, {}), acceptance: row.acceptance,
    enrollmentId: row.enrollment_id, decision: row.decision, offerUntil: row.offer_until,
    ...(over || {})
  };
}

/* The checklist as it should be, without writing anything: what the school
   requires for this grade and type, carrying whatever has already happened. */
function virtualDocs(defs, rows) {
  const have = new Map(rows.map((r) => [r.key, r]));
  const out = defs.map((d) => {
    const r = have.get(d.key);
    return {
      ...(r || { status: "missing", note: null, file_id: null, file_name: null, file_type: null, file_size: null,
                 received_at: null, reviewed_by: null, reviewed_at: null }),
      key: d.key, label: d.label, required: !!d.required, sensitive: !!d.sensitive, hint: d.hint || null
    };
  });
  for (const r of rows) {
    if (!defs.some((d) => d.key === r.key) && (r.status !== "missing" || r.file_id)) {
      out.push({ ...r, required: false, sensitive: !!r.sensitive });
    }
  }
  return out;
}

/* Writes the checklist into line with the school's requirements. Only for an
   application somebody is looking at: a list never writes. */
async function settleDocuments(ctx, row, settings) {
  const defs = E.documentsFor(settings, row.entry_grade, row.enrollment_type);
  const rows = await ctx.repo.listDocuments(row.id);
  if (row.enrollment_id || !E.OPEN_STATUSES.includes(row.status)) return virtualDocs(defs, rows);
  const have = new Map(rows.map((r) => [r.key, r]));
  const drift = defs.some((d) => {
    const h = have.get(d.key);
    return !h || h.label !== d.label || !!h.required !== !!d.required || !!h.sensitive !== !!d.sensitive;
  }) || rows.some((r) => r.status === "missing" && !r.file_id && !defs.some((d) => d.key === r.key));
  return virtualDocs(defs, drift ? await ctx.repo.syncDocuments(row.id, defs) : rows);
}

function personOf(c) {
  const t = String(c.name || "").trim().split(/\s+/);
  const first = c.first_name || t[0] || "";
  const rest = t.slice(c.first_name ? String(c.first_name).trim().split(/\s+/).length : 1);
  return { id: c.id, name: c.name || c.email, first, last: rest.join(" "), dob: c.dob || null, guardians: [] };
}

function applicantOf(row) {
  const form = parse(row.body_json, {});
  return {
    id: row.id, name: [row.legal_first, row.legal_last].filter(Boolean).join(" "),
    first: row.legal_first || "", last: row.legal_last || "", dob: row.dob || null,
    status: row.status, number: E.applicationNumber(row.seq), grade: row.entry_grade, year: row.school_year,
    studentId: row.student_id, guardians: form.guardians || []
  };
}

/* Everything the duplicate check compares against, with the index to find a
   record's few possible matches quickly. */
async function lookupIndex(ctx, orgId, rows) {
  const [people, apps] = await Promise.all([
    ctx.repo.listStudentIdentities(orgId),
    rows || ctx.repo.listApplications({ orgId })
  ]);
  const persons = people.map(personOf);
  return { persons, index: E.duplicateIndex(persons, apps.map(applicantOf)), apps };
}

function subjectOf(row) {
  const a = applicantOf(row);
  return { ...a, first: row.legal_first, last: row.legal_last, guardians: parse(row.body_json, {}).guardians || [] };
}

async function seatsFor(ctx, orgId, year, settings) {
  const usage = await ctx.repo.seatUsage(orgId, year);
  return (grade) => {
    const g = E.gradeRow(settings, grade);
    return g && g.seats != null ? { limit: g.seats, used: usage[grade] || 0 } : null;
  };
}

/* ------------------------------------------------------------------ Shapes */

const personName = (a) => [a.legalFirst, a.legalLast].filter(Boolean).join(" ");

function shapeDoc(d, seeFiles) {
  return {
    key: d.key, label: d.label, required: !!d.required, sensitive: !!d.sensitive, hint: d.hint || null,
    status: d.status, note: d.note || null,
    file: d.file_id && seeFiles ? { id: d.file_id, name: d.file_name, type: d.file_type, size: d.file_size } : null,
    hasFile: !!d.file_id, restricted: !!d.sensitive && !seeFiles,
    receivedAt: d.received_at || null, reviewedBy: d.reviewed_by || null, reviewedAt: d.reviewed_at || null
  };
}

const eventShape = (e) => ({
  id: e.id, at: e.at, by: e.actor_id, byName: e.actor_name, kind: e.kind, from: e.from_value, to: e.to_value,
  field: e.field, note: e.note, internal: !!e.internal, meta: parse(e.meta_json, null)
});

/* The light row a queue draws. */
function shapeRow(row, ev, names, day, settings) {
  const dueOn = row.due_on || null;
  const open = E.OPEN_STATUSES.includes(row.status) && !row.enrollment_id;
  const last = Math.floor((Date.parse(day + "T00:00:00Z") - row.updated_at) / 86400000);
  return {
    id: row.id, number: E.applicationNumber(row.seq), status: row.status, year: row.school_year,
    grade: row.entry_grade, type: row.enrollment_type, source: row.source,
    name: personName({ legalFirst: row.legal_first, legalLast: row.legal_last }) || "Unnamed applicant",
    preferred: row.preferred_name || null, dob: row.dob || null, studentId: row.student_id || null,
    percent: ev.percent, docs: { required: ev.docs.required, received: ev.docs.received, verified: ev.docs.verified },
    next: ev.next, blockers: ev.gates.approve.length || ev.gates.decision.length,
    assignedTo: row.assigned_to ? { id: row.assigned_to, name: names[row.assigned_to] || null } : null,
    dueOn, overdue: !!(open && dueOn && dueOn < day),
    stalled: !!(open && row.status !== "draft" && last >= settings.stalledDays),
    acceptance: row.acceptance, enrollmentId: row.enrollment_id || null,
    updatedAt: row.updated_at, submittedAt: row.submitted_at || null, intendedStart: row.intended_start || null
  };
}

/* The whole record. `view` is what the caller is allowed to see of it. */
function shapeFull(row, bits) {
  const { docs, ev, dup, names, events, view, enrollment, settings } = bits;
  const app = domain(row);
  const staff = view.staff;
  const form = { ...app.form };
  if (!(view.p.sensitive || view.owner)) delete form.support;
  const review = app.review;
  const out = {
    id: row.id, number: E.applicationNumber(row.seq), seq: row.seq, status: row.status,
    schoolYear: row.school_year, grade: row.entry_grade, type: row.enrollment_type, source: row.source,
    student: {
      id: row.student_id || null, legalFirst: row.legal_first, legalLast: row.legal_last,
      preferredName: row.preferred_name || null, dob: row.dob || null, name: personName(app),
      admissionNo: row.admission_no || null
    },
    intendedStart: row.intended_start || null, dueOn: row.due_on || null,
    form,
    acceptance: row.acceptance, offerUntil: row.offer_until || null,
    decision: row.decision ? {
      value: row.decision, reason: row.decision_reason || null,
      ...(staff ? { note: row.decision_note || null, by: row.decided_by ? { id: row.decided_by, name: names[row.decided_by] || null } : null } : {}),
      at: row.decided_at || null
    } : null,
    waitlistedAt: row.waitlisted_at || null,
    enrollmentId: row.enrollment_id || null,
    documents: docs.map((d) => ({
      ...shapeDoc(d, view.p.sensitive || !d.sensitive || view.owner),
      reviewedByName: d.reviewed_by ? names[d.reviewed_by] || null : null
    })),
    corrections: (review.corrections || []).map((c) => ({
      id: c.id, kind: c.kind, ref: c.ref, message: c.message, at: c.at, resolved: !!c.resolved, resolvedAt: c.resolvedAt || null
    })),
    consent: { current: E.hasConsent(app.form, settings), version: settings.consent.version, statement: settings.consent.statement },
    evaluation: staff ? ev : {
      percent: ev.percent, stages: ev.stages, current: ev.current,
      docs: ev.docs, fields: { total: ev.fields.total, done: ev.fields.done, missing: ev.fields.missing },
      next: ev.next, gates: { submit: ev.gates.submit, review: [], decision: [], approve: [], activate: [] }
    },
    can: {
      edit: staff ? view.p.write : false, verify: view.p.verify, decide: view.p.decide, activate: view.p.activate,
      sensitive: view.p.sensitive, settings: view.p.settings, family: view.owner && !staff
    },
    createdAt: row.created_at, updatedAt: row.updated_at, submittedAt: row.submitted_at || null,
    closedAt: row.closed_at || null, createdBy: row.created_by || null
  };
  if (staff) {
    out.assignedTo = row.assigned_to ? { id: row.assigned_to, name: names[row.assigned_to] || null } : null;
    out.review = {
      checks: review.checks || {}, duplicates: review.duplicates || {}, overrides: review.overrides || {}
    };
    out.duplicates = dup.duplicates;
    out.siblings = dup.siblings;
  }
  if (enrollment) out.enrollment = shapeEnrollment(enrollment, bits.day);
  out.events = (events || []).filter((e) => staff || !e.internal).map(eventShape);
  return out;
}

function shapeEnrollment(e, day) {
  return {
    id: e.id, studentId: e.student_id, applicationId: e.application_id || null, year: e.school_year,
    grade: e.grade, type: e.enrollment_type, state: e.state, status: E.enrollmentStatus(e, day),
    startsOn: e.starts_on, endsOn: e.ends_on || null, exitReason: e.exit_reason || null, exitNote: e.exit_note || null,
    previousSchool: e.previous_school || null, admissionNo: e.admission_no || null,
    placements: parse(e.placements_json, []), sync: parse(e.sync_json, []), syncState: e.sync_state,
    name: e.student_name || null, email: e.student_email || null, initials: e.initials || null, hue: e.avatar_hue || null,
    createdAt: e.created_at, updatedAt: e.updated_at
  };
}

/* ----------------------------------------------------------- Building one */

async function build(ctx, row, view, { events = true, siblings = true } = {}) {
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, view.orgId, day);
  const docs = await settleDocuments(ctx, row, settings);
  const [seatFn, lookup, enrollment] = await Promise.all([
    seatsFor(ctx, view.orgId, row.school_year, settings),
    view.staff ? lookupIndex(ctx, view.orgId) : Promise.resolve(null),
    row.enrollment_id ? ctx.repo.findEnrollment(row.enrollment_id) : Promise.resolve(null)
  ]);
  let dup = { duplicates: [], siblings: [] };
  if (lookup) {
    const subject = subjectOf(row);
    const c = lookup.index(subject);
    dup = E.findDuplicates(subject, c.people, c.apps);
    if (siblings) {
      const emails = E.familyKeys(subject.guardians).emails;
      const wards = await ctx.repo.wardsOfGuardianEmails(emails);
      const seen = new Set(dup.siblings.map((s) => s.id));
      for (const w of wards) {
        if (w.student_id === row.student_id || seen.has(w.student_id)) continue;
        if (dup.duplicates.some((d) => d.id === w.student_id)) continue;
        seen.add(w.student_id);
        dup.siblings.push({ kind: "student", id: w.student_id, name: w.student_name, grade: null, year: null, number: null, status: null });
      }
    }
  }
  const ev = E.evaluate({
    app: domain(row, { syncState: enrollment ? enrollment.sync_state : null }),
    docs, settings, seats: seatFn(row.entry_grade), duplicates: dup.duplicates, today: day
  });
  const eventRows = events ? await ctx.repo.listApplicationEvents(row.id) : [];
  const ids = [row.assigned_to, row.decided_by, ...docs.map((d) => d.reviewed_by)];
  const names = await ctx.repo.namesFor(ids);
  return { shape: shapeFull(row, { docs, ev, dup, names, events: eventRows, view, enrollment, settings, day }), settings, docs, ev, dup };
}

/* ---------------------------------------------------------------- Writing */

function str(v, field, max) {
  if (v == null) return "";
  if (typeof v !== "string" && typeof v !== "number") throw ApiError.badRequest(`${field} must be text.`, field);
  const s = String(v).trim();
  if (s.length > max) throw ApiError.badRequest(`${field} is longer than ${max} characters.`, field);
  return s;
}

function guardiansOf(list) {
  if (!Array.isArray(list)) throw ApiError.badRequest("guardians must be a list.", "form.guardians");
  if (list.length > 6) throw ApiError.badRequest("At most six parents or guardians.", "form.guardians");
  const out = list.map((g, i) => {
    if (!g || typeof g !== "object") throw ApiError.badRequest(`guardians[${i}] must be an object.`, "form.guardians");
    const email = str(g.email, "email", 320);
    if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      throw ApiError.badRequest(`${email} does not look like an email address.`, "form.guardians");
    }
    return {
      name: str(g.name, "name", 120), relationship: str(g.relationship, "relationship", 40),
      phone: str(g.phone, "phone", 40), email, address: str(g.address, "address", 400),
      occupation: str(g.occupation, "occupation", 80),
      primary: g.primary === true, emergency: g.emergency === true, pickup: g.pickup === true
    };
  }).filter((g) => g.name || g.phone || g.email);
  if (out.length && !out.some((g) => g.primary)) out[0].primary = true;
  return out;
}

const FORM_KEYS = {
  student: (v) => ({ gender: str(v.gender, "gender", 40), language: str(v.language, "language", 60),
                     birthPlace: str(v.birthPlace, "birthPlace", 80), notes: str(v.notes, "notes", 400) }),
  contact: (v) => ({ address: str(v.address, "address", 400), correspondence: str(v.correspondence, "correspondence", 400),
                     phone: str(v.phone, "phone", 40), language: str(v.language, "language", 60),
                     channel: str(v.channel, "channel", 20) }),
  emergency: (v) => ({ name: str(v.name, "name", 120), relationship: str(v.relationship, "relationship", 40),
                       phone: str(v.phone, "phone", 40) }),
  previous: (v) => ({ school: str(v.school, "school", 160), location: str(v.location, "location", 120),
                      board: str(v.board, "board", 80), lastGrade: str(v.lastGrade, "lastGrade", 40),
                      lastYear: str(v.lastYear, "lastYear", 20), tcNumber: str(v.tcNumber, "tcNumber", 60),
                      reason: str(v.reason, "reason", 240) }),
  pickup: (v) => {
    if (!Array.isArray(v)) throw ApiError.badRequest("pickup must be a list.", "form.pickup");
    return v.slice(0, 6).map((p) => ({ name: str(p && p.name, "name", 120), relationship: str(p && p.relationship, "relationship", 40),
                                         phone: str(p && p.phone, "phone", 40) })).filter((p) => p.name);
  },
  support: (v) => ({ notes: str(v.notes, "notes", 2000) })
};

/* Merges what a form sent into what is stored. Only the keys that were sent
   change; consent is never taken from a form — it is recorded by its own
   action, with the policy version and the moment. */
function mergeForm(prev, sent, { canSupport }) {
  const out = { ...prev };
  if (!sent || typeof sent !== "object") return out;
  if (sent.guardians !== undefined) out.guardians = guardiansOf(sent.guardians);
  for (const [k, fn] of Object.entries(FORM_KEYS)) {
    if (sent[k] === undefined) continue;
    if (k === "support" && !canSupport) continue;
    if (k !== "pickup" && (sent[k] == null || typeof sent[k] !== "object")) continue;
    out[k] = fn(sent[k] || {});
  }
  return out;
}

const brief = (v) => {
  if (v == null || v === "") return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 160 ? s.slice(0, 157) + "…" : s;
};

function validDob(v) {
  if (v === "" || v == null) return null;
  if (!E.isDate(v) || v > E.todayOf()) {
    throw ApiError.badRequest("A date of birth is a past date, written YYYY-MM-DD.", "student.dob");
  }
  return v;
}

/* Who the log says did it: the person, as they were named at the time. */
function note(ctx, row) {
  return (kind, o) => ctx.repo.addApplicationEvent(row.id, { actorId: ctx.actor.id, actorName: ctx.actor.name, kind, ...(o || {}) });
}

/* --------------------------------------------------------------- Endpoints */

/* GET /api/v1/enrollment/team — who an application can be given to. */
export async function team(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.read", { orgId });
  const rows = await ctx.repo.listEnrollmentTeam(orgId);
  return json({ team: rows.map((r) => ({ id: r.id, name: r.name || r.email, title: r.title || null, email: r.email,
                                         roles: String(r.roles || "").split(",").filter(Boolean) })) });
}

/* Whoever is assigned must work on enrollment: an application owned by a
   student's account is an application nobody will answer for. */
async function mustBeTeam(ctx, orgId, accountId) {
  if (!accountId) return;
  const t = await ctx.repo.listEnrollmentTeam(orgId);
  if (!t.some((m) => m.id === accountId)) {
    throw ApiError.badRequest("That person does not work on enrollment, so they cannot be given an application.", "to");
  }
}

/* GET /api/v1/enrollment/settings */
export async function getSettings(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.read", { orgId });
  const row = orgId ? await ctx.repo.getEnrollmentSettings(orgId) : null;
  const settings = await settingsFor(ctx, orgId, dayOf(ctx));
  return json({ settings, custom: !!row && !!parse(row.body_json, null) && Object.keys(parse(row.body_json, {})).length > 0,
                updatedAt: row ? row.updated_at : null });
}

/* PUT /api/v1/enrollment/settings — replaces what the school asks for. */
export async function putSettings(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.settings", { orgId });
  if (!orgId) throw ApiError.badRequest("Enrollment settings belong to a school.");
  const body = await readJson(ctx.request, { limit: 128 * 1024 });
  const settings = E.normaliseSettings(body.settings || body, dayOf(ctx), { strict: true });
  await ctx.repo.putEnrollmentSettings(orgId, settings, actor.id);
  return json({ settings, custom: true });
}

/* The queue's saved views, as plain tests on a row. */
function inView(view, row, ev, ctx, day, docsByApp) {
  const open = E.OPEN_STATUSES.includes(row.status) && !row.enrollment_id;
  const received = (docsByApp.get(row.id) || []).some((d) => d.status === "received");
  switch (view) {
    case "mine": return open && row.assigned_to === ctx.actor.id;
    case "open": return open;
    case "incomplete": return open && ["incomplete", "changes_requested"].includes(row.status);
    case "verify": return open && received;
    case "decision": return row.status === "awaiting_decision" && !row.enrollment_id;
    case "ready": return row.status === "admitted" && !row.enrollment_id && ["not_required", "accepted"].includes(row.acceptance);
    case "offers": return row.status === "admitted" && !row.enrollment_id && row.acceptance === "pending";
    case "waitlist": return row.status === "waitlisted";
    case "overdue": return open && !!row.due_on && row.due_on < day;
    case "closed": return !open;
    default: return true;
  }
}
const VIEWS = ["mine", "open", "incomplete", "verify", "decision", "ready", "offers", "waitlist", "overdue", "closed", "all"];

/* GET /api/v1/applications */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.read", { orgId });
  const q = ctx.url.searchParams;
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const yearParam = q.get("year");
  const year = yearParam === "all" ? null : (E.isYear(yearParam) ? yearParam : settings.currentYear);

  const rows = await ctx.repo.listApplications({ orgId, year });
  const [docRows, lookup, usage, enrollRows] = await Promise.all([
    ctx.repo.listDocumentsFor(rows.map((r) => r.id)),
    lookupIndex(ctx, orgId, ctx.repo.listApplications({ orgId })),
    ctx.repo.seatUsage(orgId, year || settings.currentYear),
    ctx.repo.listEnrollments({ orgId, year })
  ]);
  const docsByApp = new Map();
  for (const d of docRows) {
    if (!docsByApp.has(d.application_id)) docsByApp.set(d.application_id, []);
    docsByApp.get(d.application_id).push(d);
  }
  const syncOf = new Map(enrollRows.map((e) => [e.id, e.sync_state]));

  const items = rows.map((row) => {
    const defs = E.documentsFor(settings, row.entry_grade, row.enrollment_type);
    const docs = virtualDocs(defs, docsByApp.get(row.id) || []);
    const subject = subjectOf(row);
    const c = lookup.index(subject);
    const dup = E.findDuplicates(subject, c.people, c.apps);
    const g = E.gradeRow(settings, row.entry_grade);
    const ev = E.evaluate({
      app: domain(row, { syncState: syncOf.get(row.enrollment_id) || null }), docs, settings,
      seats: g && g.seats != null ? { limit: g.seats, used: usage[row.entry_grade] || 0 } : null,
      duplicates: dup.duplicates, today: day
    });
    return { row, ev, dup: dup.duplicates.filter((d) => d.strength === "exact").length };
  });

  // How many are in each view, over the whole year, before anything narrows it.
  const counts = {};
  for (const v of VIEWS) counts[v] = items.filter((x) => inView(v, x.row, x.ev, ctx, day, docsByApp)).length;
  const byStatus = {};
  for (const x of items) byStatus[x.row.status] = (byStatus[x.row.status] || 0) + 1;

  const view = VIEWS.includes(q.get("view")) ? q.get("view") : "open";
  let out = items.filter((x) => inView(view, x.row, x.ev, ctx, day, docsByApp));
  const status = q.get("status"); if (status && E.APP_STATUSES.includes(status)) out = out.filter((x) => x.row.status === status);
  const grade = q.get("grade"); if (grade) out = out.filter((x) => x.row.entry_grade === grade);
  const sid = q.get("studentId"); if (sid) out = out.filter((x) => x.row.student_id === sid);
  const type = q.get("type"); if (type && E.TYPES.includes(type)) out = out.filter((x) => x.row.enrollment_type === type);
  const who = q.get("assignee");
  if (who === "me") out = out.filter((x) => x.row.assigned_to === actor.id);
  else if (who === "none") out = out.filter((x) => !x.row.assigned_to);
  else if (who) out = out.filter((x) => x.row.assigned_to === who);
  const from = q.get("from"), to = q.get("to");
  if (E.isDate(from)) out = out.filter((x) => x.row.submitted_at && E.todayOf(x.row.submitted_at) >= from);
  if (E.isDate(to)) out = out.filter((x) => x.row.submitted_at && E.todayOf(x.row.submitted_at) <= to);

  const term = String(q.get("q") || "").trim().toLowerCase();
  if (term) {
    const num = /^enr-?0*(\d+)$/i.exec(term);
    out = out.filter((x) => {
      const r = x.row;
      if (num && r.seq === +num[1]) return true;
      const hay = [r.legal_first, r.legal_last, r.preferred_name, r.legal_first + " " + r.legal_last, r.admission_no,
        E.applicationNumber(r.seq)].join(" | ").toLowerCase();
      if (hay.includes(term)) return true;
      const f = parse(r.body_json, {});
      return (f.guardians || []).some((g) => [g.name, g.email, g.phone].join(" ").toLowerCase().includes(term)) ||
             String((f.previous && f.previous.school) || "").toLowerCase().includes(term);
    });
  }

  const shaped = out.map((x) => ({ ...shapeRow(x.row, x.ev, {}, day, settings), duplicates: x.dup }));
  const sort = q.get("sort") || "updated", dir = q.get("dir") === "asc" ? 1 : -1;
  const keyOf = {
    name: (r) => r.name.toLowerCase(), grade: (r) => settings.grades.findIndex((g) => g.name === r.grade),
    status: (r) => E.APP_STATUSES.indexOf(r.status), progress: (r) => r.percent, due: (r) => r.dueOn || "9999",
    updated: (r) => r.updatedAt, number: (r) => r.number
  }[sort] || ((r) => r.updatedAt);
  shaped.sort((a, b) => {
    const x = keyOf(a), y = keyOf(b);
    return (x < y ? -1 : x > y ? 1 : 0) * dir || a.name.localeCompare(b.name);
  });

  const size = Math.max(5, Math.min(100, Number(q.get("size")) || 25));
  const page = Math.max(1, Number(q.get("page")) || 1);
  const slice = shaped.slice((page - 1) * size, page * size);
  const names = await ctx.repo.namesFor(slice.map((r) => r.assignedTo && r.assignedTo.id));
  for (const r of slice) if (r.assignedTo) r.assignedTo.name = names[r.assignedTo.id] || null;

  return json({ items: slice, total: shaped.length, page, size, view, counts, byStatus, year: year || "all",
                today: day, years: settings.years, currentYear: settings.currentYear });
}

/* GET /api/v1/enrollment/summary — the operations picture for one year. */
export async function summary(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.read", { orgId });
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const q = ctx.url.searchParams.get("year");
  const year = E.isYear(q) ? q : settings.currentYear;

  // Placement that was waiting for a start date happens the first time
  // somebody looks after the day arrives; there is no clock to do it sooner.
  const synced = await syncDue(ctx, orgId, day);

  const [apps, enrollments, usage] = await Promise.all([
    ctx.repo.listApplications({ orgId, year }), ctx.repo.listEnrollments({ orgId, year }), ctx.repo.seatUsage(orgId, year)
  ]);
  const by = {};
  for (const a of apps) by[a.status] = (by[a.status] || 0) + 1;
  const open = apps.filter((a) => E.OPEN_STATUSES.includes(a.status) && !a.enrollment_id);
  const state = {};
  for (const e of enrollments) {
    const s = E.enrollmentStatus(e, day);
    state[s] = (state[s] || 0) + 1;
  }
  const grades = settings.grades.map((g) => ({
    name: g.name, seats: g.seats, used: usage[g.name] || 0,
    waitlisted: apps.filter((a) => a.entry_grade === g.name && a.status === "waitlisted").length,
    applying: open.filter((a) => a.entry_grade === g.name && a.status !== "waitlisted").length
  })).filter((g) => g.used || g.waitlisted || g.applying || g.seats != null);
  return json({
    can: await powers(ctx, orgId),
    year, years: settings.years, currentYear: settings.currentYear, today: day, synced,
    applications: { total: apps.length, byStatus: by, open: open.length,
                    awaitingReview: (by.submitted || 0) + (by.incomplete || 0) + (by.under_review || 0),
                    awaitingDecision: by.awaiting_decision || 0,
                    readyToEnroll: apps.filter((a) => a.status === "admitted" && !a.enrollment_id &&
                      ["not_required", "accepted"].includes(a.acceptance)).length,
                    offers: apps.filter((a) => a.status === "admitted" && !a.enrollment_id && a.acceptance === "pending").length,
                    waitlisted: by.waitlisted || 0,
                    overdue: open.filter((a) => a.due_on && a.due_on < day).length },
    enrollments: { total: enrollments.length, byStatus: state,
                   exceptions: enrollments.filter((e) => e.sync_state === "exception").length },
    grades
  });
}

/* GET /api/v1/applications/:id */
export async function get(ctx, { applicationId }) {
  requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const built = await build(ctx, row, view);
  return json({ application: built.shape });
}

/* GET /api/v1/family/applications — the applications the signed-in person
   made, or is family to a student of. */
export async function mine(ctx) {
  const actor = requireActor(ctx);
  const day = dayOf(ctx);
  const wards = await ctx.repo.listWards(actor.id);
  // What this person made, and what the school made for their children.
  const seen = new Set();
  const rows = [];
  for (const who of [actor.id, ...wards.map((w) => w.id)]) {
    for (const r of await ctx.repo.listApplicationsOf(who)) {
      if (!seen.has(r.id)) { seen.add(r.id); rows.push(r); }
    }
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  const orgId = orgOf(actor);
  const settings = await settingsFor(ctx, orgId, day);
  const out = [];
  for (const row of rows) {
    const view = { staff: false, owner: true, p: { write: false, verify: false, decide: false, activate: false, sensitive: false, settings: false }, orgId: row.org_id || orgId };
    out.push((await build(ctx, row, view, { siblings: false })).shape);
  }
  return json({ applications: out, students: wards.map((w) => ({ id: w.id, name: w.name })),
                years: settings.years, grades: settings.grades.map((g) => g.name), currentYear: settings.currentYear,
                consent: settings.consent });
}

/* GET /api/v1/enrollment/lookup — who a prospective applicant might already
   be, asked before anything is made. */
export async function lookup(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.write", { orgId });
  const q = ctx.url.searchParams;
  const first = String(q.get("first") || "").trim(), last = String(q.get("last") || "").trim();
  const dob = E.isDate(q.get("dob")) ? q.get("dob") : null;
  const email = String(q.get("email") || "").trim().toLowerCase();
  const phone = String(q.get("phone") || "").trim();
  const guardians = email || phone ? [{ email, phone, name: "" }] : [];
  const lk = await lookupIndex(ctx, orgId);
  const subject = { id: null, studentId: null, first, last, dob, guardians };
  const c = lk.index(subject);
  const found = E.findDuplicates(subject, c.people, c.apps);

  // A search box also finds a student by a part of their name.
  const term = `${first} ${last}`.trim().toLowerCase();
  const seen = new Set(found.duplicates.map((d) => d.id));
  const partial = [];
  if (term.length >= 2) {
    for (const p of lk.persons) {
      if (seen.has(p.id)) continue;
      if (p.name.toLowerCase().includes(term) || term.split(/\s+/).every((t) => p.name.toLowerCase().includes(t))) {
        partial.push({ key: "acc:" + p.id, kind: "student", id: p.id, name: p.name, dob: p.dob, strength: "weak", reason: "Name matches" });
      }
    }
  }
  const history = await ctx.repo.listEnrollments({ orgId });
  const latest = new Map();
  for (const e of history) if (!latest.has(e.student_id)) latest.set(e.student_id, e);
  const decorate = (d) => {
    const e = d.kind === "student" ? latest.get(d.id) : null;
    return e ? { ...d, last: { year: e.school_year, grade: e.grade, state: e.state } } : d;
  };
  return json({ matches: [...found.duplicates, ...partial.slice(0, 8)].map(decorate), siblings: found.siblings });
}

/* POST /api/v1/applications — starts an application.

   Made by staff for a family, or by a family for its own child. The same
   `clientKey` always returns the application it made the first time. */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const day = dayOf(ctx);
  const body = await readJson(ctx.request, { limit: 96 * 1024 });
  const settings = await settingsFor(ctx, orgId, day);
  const p = await powers(ctx, orgId);
  const staff = p.write;
  let family = false;
  if (!staff) {
    family = (actor.roles || []).some((r) => r.product === "learn" && r.role === "guardian");
    if (!family) await must(ctx, "enrollment.write", { orgId });
  }

  const key = body.clientKey ? check.string(body.clientKey, "clientKey", { max: 64 }) : null;
  if (key) {
    const again = await ctx.repo.findApplicationByKey(actor.id, key);
    if (again) {
      const view = await standing(ctx, again);
      return json({ application: (await build(ctx, again, view)).shape, existing: true });
    }
  }

  let grade = body.grade ? check.oneOf(body.grade, "grade", settings.grades.map((g) => g.name)) : null;
  const schoolYear = body.schoolYear ? check.oneOf(body.schoolYear, "schoolYear", settings.years) : settings.currentYear;
  let type = check.oneOf(body.type || "new", "type", E.TYPES);
  let studentId = null;
  let first = str(body.student && body.student.legalFirst, "legalFirst", 80);
  let last = str(body.student && body.student.legalLast, "legalLast", 80);
  let dob = validDob(body.student && body.student.dob);
  let preferred = str(body.student && body.student.preferredName, "preferredName", 80) || null;
  let form = {};

  if (body.studentId) {
    // An existing student: their identity stays as it is, and a new year is
    // a new application for the same person.
    studentId = check.string(body.studentId, "studentId", { max: 64 });
    const acct = await ctx.repo.findAccountById(studentId);
    if (!acct) throw ApiError.notFound("No such student.");
    if (!staff && !(await guardsStudent(ctx, actor, studentId))) {
      throw ApiError.forbidden("You can apply only for your own children.");
    }
    const lastApp = (await ctx.repo.listApplicationsOf(studentId)).find((a) => a.student_id === studentId && a.legal_first);
    const person = personOf({ ...acct, name: acct.name, dob: null });
    first = first || (lastApp && lastApp.legal_first) || person.first;
    last = last || (lastApp && lastApp.legal_last) || person.last;
    const card = await ctx.repo.getContact(studentId);
    dob = dob || (lastApp && lastApp.dob) || (card && card.date_of_birth) || null;
    preferred = preferred || (lastApp && lastApp.preferred_name) || null;
    if (lastApp) form = { ...parse(lastApp.body_json, {}), consents: [] };
    if (type === "new") type = "returning";
    const live = await ctx.repo.findLiveEnrollment(studentId, schoolYear);
    if (live) throw ApiError.conflict(`${personName({ legalFirst: first, legalLast: last })} is already enrolled for ${E.yearLabel(schoolYear)}.`, "studentId");
    if (!grade) {
      // A returning student goes up one grade from where they last were,
      // unless that was this very year.
      const last = (await ctx.repo.listEnrollments({ orgId, studentId }))[0];
      if (last) grade = last.school_year === schoolYear ? last.grade : (E.nextGrade(settings, last.grade) || last.grade);
    }
  }
  if (!grade) throw ApiError.badRequest("Say which grade the application is for.", "grade");
  if (body.form) form = mergeForm(form, body.form, { canSupport: p.sensitive || family });
  if (!first || (!last && !settings.singleName)) {
    if (staff || !studentId) {
      if (!first) throw ApiError.badRequest("The student's legal first name is required.", "student.legalFirst");
      if (!last && !settings.singleName) throw ApiError.badRequest("The student's legal last name is required.", "student.legalLast");
    }
  }
  const intendedStart = body.intendedStart ? (E.isDate(body.intendedStart) ? body.intendedStart
    : (() => { throw ApiError.badRequest("The joining date is written YYYY-MM-DD.", "intendedStart"); })()) : null;

  let row;
  try {
    row = await ctx.repo.createApplication({
      orgId, studentId, schoolYear, grade, type, legalFirst: first, legalLast: last, preferredName: preferred,
      dob, form, intendedStart, source: staff ? "staff" : "family",
      assignedTo: staff && body.assignTo === "me" ? actor.id : null,
      dueOn: staff ? E.addDays(day, settings.dueDays) : null, clientKey: key, createdBy: actor.id
    });
  } catch (e) {
    // A retry that raced the first request: hand back the one that won.
    const again = key && (await ctx.repo.findApplicationByKey(actor.id, key));
    if (!again) throw e;
    row = again;
  }
  await ctx.repo.syncDocuments(row.id, E.documentsFor(settings, grade, type));
  await note(ctx, row)("status", { from: null, to: "draft",
    note: studentId ? `Started for a returning student, ${E.yearLabel(schoolYear)}` : `Started for ${E.yearLabel(schoolYear)}`, internal: false });
  const view = await standing(ctx, row);
  return json({ application: (await build(ctx, row, view)).shape }, { status: 201 });
}

/* PATCH /api/v1/applications/:id — saves what was filled in. Saving a draft
   needs nothing to be complete; submitting is where completeness is asked. */
export async function update(ctx, { applicationId }) {
  const actor = requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, view.orgId, day);
  const body = await readJson(ctx.request, { limit: 96 * 1024 });

  const editable = view.staff
    ? !["rejected", "withdrawn"].includes(row.status) && !row.enrollment_id
    : ["draft", "changes_requested"].includes(row.status);
  if (!editable) {
    throw ApiError.conflict(view.staff
      ? "This application is closed, so its details are fixed. Reopen it to change them."
      : "This application has been submitted. Ask the school if something needs correcting.");
  }

  const patch = {};
  const changes = [];
  const set = (k, col, v, label) => {
    const prev = k === "dob" ? row.dob : row[col];
    if ((prev || "") === (v || "")) return;
    patch[k] = v === "" ? null : v;
    changes.push({ field: label, from: prev, to: v });
  };
  const s = body.student || {};
  if (s.legalFirst !== undefined) set("legalFirst", "legal_first", str(s.legalFirst, "legalFirst", 80), "student.legalFirst");
  if (s.legalLast !== undefined) set("legalLast", "legal_last", str(s.legalLast, "legalLast", 80), "student.legalLast");
  if (s.preferredName !== undefined) set("preferredName", "preferred_name", str(s.preferredName, "preferredName", 80), "student.preferredName");
  if (s.dob !== undefined) set("dob", "dob", validDob(s.dob) || "", "student.dob");
  if (body.grade !== undefined) {
    check.oneOf(body.grade, "grade", settings.grades.map((g) => g.name));
    set("grade", "entry_grade", body.grade, "grade");
  }
  if (body.schoolYear !== undefined) {
    check.oneOf(body.schoolYear, "schoolYear", settings.years);
    set("schoolYear", "school_year", body.schoolYear, "schoolYear");
  }
  if (body.type !== undefined) {
    check.oneOf(body.type, "type", E.TYPES);
    set("type", "enrollment_type", body.type, "type");
  }
  if (body.intendedStart !== undefined) {
    if (body.intendedStart && !E.isDate(body.intendedStart)) throw ApiError.badRequest("The joining date is written YYYY-MM-DD.", "intendedStart");
    set("intendedStart", "intended_start", body.intendedStart || "", "intendedStart");
  }
  if (body.form !== undefined) {
    const prev = parse(row.body_json, {});
    const next = mergeForm(prev, body.form, { canSupport: view.p.sensitive || view.owner });
    for (const k of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      if (JSON.stringify(prev[k]) !== JSON.stringify(next[k]) && k !== "consents") {
        changes.push({ field: "form." + k, from: k === "support" ? "(restricted)" : brief(prev[k]),
                       to: k === "support" ? "(restricted)" : brief(next[k]) });
      }
    }
    patch.form = next;
  }
  if (body.consent === true) {
    const form = patch.form || parse(row.body_json, {});
    const consents = (form.consents || []).filter((c) => c.version !== settings.consent.version);
    consents.push({ key: "admission", version: settings.consent.version, accepted: true, at: Date.now(), by: actor.id });
    patch.form = { ...form, consents };
    changes.push({ field: "consent", from: "", to: `Accepted policy ${settings.consent.version}` });
  }
  if (body.studentId !== undefined && view.staff) {
    if (body.studentId) {
      if (!(await ctx.repo.findAccountById(body.studentId))) throw ApiError.notFound("No such student.");
      const live = await ctx.repo.findLiveEnrollment(body.studentId, patch.schoolYear || row.school_year);
      if (live) throw ApiError.conflict("That student is already enrolled for this year.", "studentId");
    }
    patch.studentId = body.studentId || null;
    changes.push({ field: "studentId", from: row.student_id, to: body.studentId || null });
  }

  if (!changes.length) {
    return json({ application: (await build(ctx, row, view)).shape, unchanged: true });
  }
  const ifUpdatedAt = body.ifUpdatedAt != null ? Number(body.ifUpdatedAt) : null;
  const updated = await ctx.repo.updateApplication(applicationId, patch, ifUpdatedAt ? { ifUpdatedAt } : {});
  if (!updated) {
    const now = await ctx.repo.findApplication(applicationId);
    const e = ApiError.conflict("Somebody changed this application while you were editing it. Reload it, then make your change again.");
    e.extra = { updatedAt: now ? now.updated_at : null };
    throw e;
  }
  const log = note(ctx, updated);
  for (const c of changes) await log("field", { field: c.field, from: c.from, to: c.to, internal: true });

  if (patch.grade !== undefined || patch.type !== undefined) {
    await ctx.repo.syncDocuments(applicationId, E.documentsFor(settings, updated.entry_grade, updated.enrollment_type));
  }
  const built = await build(ctx, updated, view);
  // A document that is now missing (or no longer asked for) can move a
  // waiting application on, or back.
  const moved = E.statusAfterDocuments(updated.status, built.ev);
  if (moved !== updated.status && view.staff) {
    const again = await ctx.repo.updateApplication(applicationId, { status: moved });
    await log("status", { from: updated.status, to: moved, note: "Documents changed", internal: false });
    return json({ application: (await build(ctx, again, view)).shape });
  }
  return json({ application: built.shape });
}

/* ---------------------------------------------------------------- Actions
   POST /api/v1/applications/:id/actions/:action

   One endpoint for every step of the workflow, because they are all the same
   kind of thing: "this application is X; do Y to it". The rule for each is in
   the table below and in services/enrollment.js; the rest is who may. */

const ACTORS = {
  submit: "owner", resubmit: "owner", withdraw: "owner", accept: "decide-or-owner", decline: "decide-or-owner",
  start_review: "verify", request_changes: "verify", mark_ready: "verify", check: "verify", resolve_duplicate: "verify",
  approve: "decide", waitlist: "decide", reject: "decide", reconsider: "decide", reopen: "decide", override: "decide",
  assign: "write", note: "write", activate: "activate"
};

export async function act(ctx, { applicationId, action }) {
  const actor = requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const rule = ACTORS[action];
  if (!rule) throw ApiError.notFound(`There is no "${action}" step.`);

  const allowed = rule === "owner" ? (view.staff ? view.p.write : view.owner)
    : rule === "decide-or-owner" ? (view.p.decide || view.owner)
    : rule === "write" ? view.p.write
    : rule === "verify" ? view.p.verify
    : rule === "decide" ? view.p.decide
    : view.p.activate;
  if (!allowed) {
    const need = { owner: "enrollment.write", "decide-or-owner": "enrollment.decide", write: "enrollment.write",
                   verify: "enrollment.verify", decide: "enrollment.decide", activate: "enrollment.activate" }[rule];
    await must(ctx, need, { orgId: view.orgId });
  }

  const day = dayOf(ctx);
  const body = await readJson(ctx.request, { limit: 96 * 1024 });
  const log = note(ctx, row);
  const built = await build(ctx, row, view, { events: false });
  const { settings, ev } = built;
  const review = parse(row.review_json, {});
  const t = Date.now();
  const text = (v, f, max, req) => { const s = str(v, f, max); if (req && !s) throw ApiError.badRequest(`${f} is required.`, f); return s; };

  async function refuse(why, blockers) {
    const e = ApiError.conflict(why);
    e.extra = { blockers: blockers || [] };
    throw e;
  }
  const can2 = (a) => E.canAct(a, row.status, ev, { enrolled: !!row.enrollment_id });
  const finish = async (patch, extra) => {
    const upd = await ctx.repo.updateApplication(applicationId, patch);
    const b = await build(ctx, upd, view);
    return json({ application: b.shape, ...(extra || {}) });
  };

  switch (action) {
    case "submit":
    case "resubmit": {
      if (row.status === "submitted" || row.status === "incomplete") return finish({});   // a retried press
      const c = can2(action === "resubmit" ? "resubmit" : "submit");
      if (!c.ok) return refuse(c.why, c.blockers);
      const settled = ev.gates.review.length === 0 ? "submitted" : "incomplete";
      const corrections = (review.corrections || []).map((x) => (x.resolved ? x : { ...x, resolved: true, resolvedAt: t }));
      await log("status", { from: row.status, to: settled, note: action === "resubmit" ? "Corrections sent back" : "Submitted", internal: false });
      return finish({ status: settled, submittedAt: row.submitted_at || t,
                      dueOn: row.due_on || E.addDays(day, settings.dueDays), review: { ...review, corrections } });
    }
    case "start_review": {
      if (row.status === "under_review") return finish({});
      const c = can2("start_review");
      if (!c.ok) return refuse(c.why, c.blockers);
      await log("status", { from: row.status, to: "under_review", note: "Review started", internal: false });
      return finish({ status: "under_review", assignedTo: row.assigned_to || actor.id });
    }
    case "request_changes": {
      const c = can2("request_changes");
      if (!c.ok) return refuse(c.why, c.blockers);
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length && body.message) items.push({ kind: "other", message: body.message });
      if (!items.length) throw ApiError.badRequest("Say what needs correcting.", "items");
      const list = [...(review.corrections || [])];
      for (const it of items.slice(0, 20)) {
        const kind = ["field", "document", "other"].includes(it.kind) ? it.kind : "other";
        const msg = text(it.message, "message", 400, true);
        const entry = { id: "c" + t.toString(36) + list.length, kind, ref: str(it.ref, "ref", 60) || null, message: msg, at: t, by: actor.id, resolved: false };
        list.push(entry);
        if (kind === "document" && entry.ref) {
          const d = (await ctx.repo.listDocuments(applicationId)).find((x) => x.key === entry.ref);
          if (d) await ctx.repo.updateDocument(applicationId, entry.ref, { status: "returned", note: msg, reviewedBy: actor.id, reviewedAt: t });
        }
      }
      await log("status", { from: row.status, to: "changes_requested", note: items.map((i) => i.message).join(" · ").slice(0, 400), internal: false });
      return finish({ status: "changes_requested", review: { ...review, corrections: list } });
    }
    case "mark_ready": {
      if (row.status === "awaiting_decision") return finish({});
      const c = can2("mark_ready");
      if (!c.ok) return refuse(c.why, c.blockers);
      await log("status", { from: row.status, to: "awaiting_decision", note: text(body.note, "note", 400) || "Review complete", internal: true });
      return finish({ status: "awaiting_decision" });
    }
    case "check": {
      const key = check.oneOf(body.key, "key", settings.review.map((r) => r.key));
      const checks = { ...(review.checks || {}) };
      const done = body.done !== false;
      checks[key] = { done, by: actor.id, byName: actor.name, at: t, note: str(body.note, "note", 240) || null };
      const label = (settings.review.find((r) => r.key === key) || {}).label;
      await log("check", { field: key, from: null, to: done ? "done" : "not done", note: `${label}${body.note ? " — " + str(body.note, "note", 240) : ""}`, internal: true });
      return finish({ review: { ...review, checks } });
    }
    case "resolve_duplicate": {
      const key = text(body.key, "key", 80, true);
      const resolution = check.oneOf(body.resolution, "resolution", ["same", "different"]);
      const candidate = built.dup.duplicates.find((d) => d.key === key);
      if (!candidate) throw ApiError.notFound("That is not one of the possible matches.");
      const duplicates = { ...(review.duplicates || {}),
        [key]: { resolution, by: actor.id, byName: actor.name, at: t, note: str(body.note, "note", 240) || null } };
      await log("duplicate", { field: key, from: candidate.name, to: resolution === "same" ? "Same person" : "Not the same person",
                               note: str(body.note, "note", 240) || null, internal: true });
      if (resolution === "same" && candidate.kind === "student") {
        // Linking is how a returning student keeps one identity: this year's
        // application belongs to the person who is already here.
        const live = await ctx.repo.findLiveEnrollment(candidate.id, row.school_year);
        if (live) throw ApiError.conflict(`${candidate.name} is already enrolled for ${E.yearLabel(row.school_year)}.`);
        return finish({ studentId: candidate.id, review: { ...review, duplicates },
                        ...(row.enrollment_type === "new" ? { type: "returning" } : {}) });
      }
      if (resolution === "same" && candidate.kind === "application") {
        if (!E.OPEN_STATUSES.includes(row.status)) return finish({ review: { ...review, duplicates } });
        await log("status", { from: row.status, to: "withdrawn", note: `Duplicate of ${candidate.number}`, internal: false });
        return finish({ status: "withdrawn", closedAt: t, review: { ...review, duplicates } });
      }
      return finish({ review: { ...review, duplicates } });
    }
    case "override": {
      const kind = check.oneOf(body.kind, "kind", ["age", "seats"]);
      const reason = text(body.reason, "reason", 240, true);
      if (reason.length < 4) throw ApiError.badRequest("Say why, in a few words.", "reason");
      const overrides = { ...(review.overrides || {}), [kind]: { reason, by: actor.id, byName: actor.name, at: t } };
      await log("decision", { field: "override." + kind, to: reason, note: kind === "age" ? "Age rule set aside" : "Seat limit set aside", internal: true });
      return finish({ review: { ...review, overrides } });
    }
    case "approve": {
      if (row.status === "admitted") return finish({});
      const c = can2("approve");
      if (!c.ok) {
        // A rule that can be set aside, set aside with a reason, by someone
        // who may; anything else is a refusal.
        const hard = c.blockers.filter((b) => !b.soft);
        const soft = c.blockers.filter((b) => b.soft);
        if (hard.length) return refuse(hard[0].label, c.blockers);
        const given = body.override && typeof body.override === "object" ? body.override : {};
        const overrides = { ...(review.overrides || {}) };
        for (const b of soft) {
          const kind = b.kind;
          const reason = str(given[kind], kind, 240);
          if (reason.length < 4) return refuse(b.label, c.blockers);
          overrides[kind] = { reason, by: actor.id, byName: actor.name, at: t };
          await log("decision", { field: "override." + kind, to: reason, note: kind === "age" ? "Age rule set aside" : "Seat limit set aside", internal: true });
        }
        review.overrides = overrides;
      }
      let admissionNo = row.admission_no;
      if (!admissionNo) {
        const prior = row.student_id ? await ctx.repo.admissionNoOf(row.student_id) : null;
        admissionNo = prior || E.admissionNumber(settings, await ctx.repo.takeAdmissionNumber(view.orgId));
      }
      const needsAcceptance = settings.requireAcceptance;
      await log("decision", { from: row.status, to: "admitted", note: text(body.note, "note", 400) || null, internal: false,
                              meta: { admissionNo, acceptance: needsAcceptance ? "pending" : "not_required" } });
      await log("status", { from: row.status, to: "admitted", note: needsAcceptance ? "Offer made; waiting for acceptance" : "Admission confirmed", internal: false });
      return finish({
        status: "admitted", decision: "admitted", decisionReason: null, decisionNote: text(body.note, "note", 400) || null,
        decidedBy: actor.id, decidedAt: t, admissionNo,
        acceptance: needsAcceptance ? "pending" : "not_required",
        offerUntil: needsAcceptance ? E.addDays(day, settings.offerDays) : null, waitlistedAt: null,
        review
      });
    }
    case "waitlist": {
      if (row.status === "waitlisted") return finish({});
      const c = can2("waitlist");
      if (!c.ok) return refuse(c.why, c.blockers);
      const reason = str(body.reason, "reason", 240);
      await log("decision", { from: row.status, to: "waitlisted", note: reason || null, internal: false });
      await log("status", { from: row.status, to: "waitlisted", note: reason || "Placed on the waitlist", internal: false });
      return finish({ status: "waitlisted", decision: "waitlisted", decisionReason: reason || null, decidedBy: actor.id,
                      decidedAt: t, waitlistedAt: row.waitlisted_at || t });
    }
    case "reject": {
      if (row.status === "rejected") return finish({});
      const c = can2("reject");
      if (!c.ok) return refuse(c.why, c.blockers);
      const reason = check.oneOf(body.reason, "reason", E.REJECT_REASONS);
      const noteText = text(body.note, "note", 400);
      await log("decision", { from: row.status, to: "rejected", note: [reason, noteText].filter(Boolean).join(" — "), internal: false });
      await log("status", { from: row.status, to: "rejected", note: "Declined", internal: false });
      return finish({ status: "rejected", decision: "rejected", decisionReason: reason, decisionNote: noteText || null,
                      decidedBy: actor.id, decidedAt: t, closedAt: t });
    }
    case "reconsider": {
      const c = can2("reconsider");
      if (!c.ok) return refuse(c.why, c.blockers);
      const why = text(body.note, "note", 400, true);
      await log("status", { from: row.status, to: "awaiting_decision", note: why, internal: true });
      return finish({ status: "awaiting_decision", decision: null, decisionReason: null, decisionNote: null,
                      decidedBy: null, decidedAt: null, closedAt: null, waitlistedAt: null });
    }
    case "withdraw": {
      if (row.status === "withdrawn") return finish({});
      const c = can2("withdraw");
      if (!c.ok) return refuse(c.why, c.blockers);
      const why = text(body.reason, "reason", 240, true);
      await log("status", { from: row.status, to: "withdrawn", note: why, internal: false });
      return finish({ status: "withdrawn", closedAt: t });
    }
    case "reopen": {
      const c = can2("reopen");
      if (!c.ok) return refuse(c.why, c.blockers);
      const why = text(body.note, "note", 400, true);
      await log("status", { from: row.status, to: "submitted", note: "Reopened — " + why, internal: false });
      return finish({ status: "submitted", decision: null, decisionReason: null, decisionNote: null,
                      decidedBy: null, decidedAt: null, closedAt: null });
    }
    case "accept":
    case "decline": {
      if (row.status !== "admitted" || row.enrollment_id) {
        return refuse("There is no open offer on this application.");
      }
      if (row.acceptance === "accepted" && action === "accept") return finish({});
      if (row.acceptance !== "pending") return refuse("This application is not waiting on an acceptance.");
      if (action === "accept") {
        await log("decision", { from: "pending", to: "accepted", note: "Offer accepted", internal: false });
        return finish({ acceptance: "accepted", acceptedAt: t });
      }
      await log("decision", { from: "pending", to: "declined", note: "Offer declined", internal: false });
      await log("status", { from: "admitted", to: "withdrawn", note: "Offer declined", internal: false });
      return finish({ acceptance: "declined", status: "withdrawn", closedAt: t });
    }
    case "assign": {
      const to = body.to ? check.string(body.to, "to", { max: 64 }) : null;
      if (to && !(await ctx.repo.findAccountById(to))) throw ApiError.notFound("No such account.");
      await mustBeTeam(ctx, view.orgId, to);
      const dueOn = body.dueOn === undefined ? undefined : (body.dueOn === "" || body.dueOn === null ? null :
        E.isDate(body.dueOn) ? body.dueOn : (() => { throw ApiError.badRequest("The due date is written YYYY-MM-DD.", "dueOn"); })());
      const names = await ctx.repo.namesFor([to, row.assigned_to]);
      await log("assign", { from: row.assigned_to ? names[row.assigned_to] || row.assigned_to : null,
                            to: to ? names[to] || to : null, note: dueOn ? "Due " + dueOn : null, internal: true });
      return finish({ assignedTo: to, ...(dueOn !== undefined ? { dueOn } : {}) });
    }
    case "note": {
      const noteText = text(body.text, "text", 1000, true);
      await log("note", { note: noteText, internal: body.internal !== false });
      return finish({});
    }
    case "activate":
      return activate(ctx, { row, view, built, body, day, log });
    default:
      throw ApiError.notFound(`There is no "${action}" step.`);
  }
}

/* ------------------------------------------------------------- Activation
   Creates the enrollment, then sets up what surrounds it. The first part is
   one transaction; the second is a list of steps, each retryable, each
   recorded — so a course that cannot be joined today is an item for staff, not
   a reason to take back an admission. */

async function activate(ctx, { row, view, built, body, day, log }) {
  const actor = ctx.actor;
  const { settings } = built;
  if (row.enrollment_id) {
    const e = await ctx.repo.findEnrollment(row.enrollment_id);
    return json({ application: (await build(ctx, row, view)).shape, enrollment: shapeEnrollment(e, day), existing: true });
  }
  const startsOn = body.startsOn || row.intended_start;
  if (!E.isDate(startsOn)) throw ApiError.badRequest("Say the day the student starts, YYYY-MM-DD.", "startsOn");
  const grade = body.grade ? check.oneOf(body.grade, "grade", settings.grades.map((g) => g.name)) : row.entry_grade;

  let studentId = row.student_id || (body.studentId ? check.string(body.studentId, "studentId", { max: 64 }) : null);
  const account = body.account && typeof body.account === "object" ? body.account : null;
  const app = domain(row, { activating: true, studentId, intendedStart: startsOn,
                            account: account && account.email ? { email: account.email } : null });
  const ev = E.evaluate({ app, docs: built.docs, settings, seats: null, duplicates: built.dup.duplicates, today: day });
  const c = E.canAct("activate", row.status, ev, {});
  if (!c.ok) {
    const e = ApiError.conflict(c.why);
    e.extra = { blockers: c.blockers };
    throw e;
  }

  // The permanent identity.
  let created = false;
  if (!studentId) {
    const email = check.email(account.email);
    const password = check.password(account.password);
    if (await ctx.repo.findAccountByEmail(email)) {
      throw ApiError.conflict("An account already uses that email address. Link that student instead, or give this one another address.", "account.email");
    }
    const name = personName(app);
    const pw = await hashPassword(password);
    const made = await ctx.repo.createAccount({
      email, hash: pw.hash, salt: pw.salt, iterations: pw.iterations, name, firstName: row.legal_first,
      initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(), hue: "#0071e3",
      title: grade
    });
    studentId = made.id;
    created = true;
    await ctx.repo.grantRole(studentId, "learn", "student", view.orgId);
    if (view.orgId) await ctx.repo.addMember(view.orgId, studentId, "member");
    await log("enrollment", { field: "account", to: "Student sign-in created", internal: true });
  } else {
    const acct = await ctx.repo.findAccountById(studentId);
    if (!acct) throw ApiError.notFound("No such student.");
  }
  const live = await ctx.repo.findLiveEnrollment(studentId, row.school_year);
  if (live) throw ApiError.conflict("That student is already enrolled for this school year.");

  let enrollment;
  try {
    enrollment = await ctx.repo.createEnrollmentFrom(row, {
      studentId, grade, startsOn, previousSchool: (app.form.previous || {}).school || null,
      admissionNo: row.admission_no, createdBy: actor.id
    }, { actorId: actor.id, actorName: actor.name, note: `Enrolled in ${grade} from ${startsOn}` });
  } catch (e) {
    if (/UNIQUE|constraint/i.test(String(e && e.message))) {
      throw ApiError.conflict("That student is already enrolled for this school year.");
    }
    throw e;
  }
  if (grade !== row.entry_grade) {
    await ctx.repo.updateApplication(row.id, { grade });
    await log("field", { field: "grade", from: row.entry_grade, to: grade, internal: true });
  }
  if (created || !row.student_id) {
    // The identity carries what the application knew: date of birth, address.
    await mergeContact(ctx, studentId, app, actor.id);
  }

  const result = await syncEnrollment(ctx, enrollment, row, app, {
    courseIds: Array.isArray(body.courseIds) ? body.courseIds.filter((x) => typeof x === "string").slice(0, 30) : [],
    guardians: Array.isArray(body.guardians) ? body.guardians : [],
    day, orgId: view.orgId, log
  });
  const fresh = await ctx.repo.findApplication(row.id);
  const b = await build(ctx, fresh, view);
  const full = await ctx.repo.findEnrollment(enrollment.id);
  return json({ application: b.shape, enrollment: shapeEnrollment(full, day), sync: result }, { status: 201 });
}

/* A contact card is replaced whole by the repository, so what is already
   there is read and kept: the application only fills what is empty. */
async function mergeContact(ctx, studentId, app, actorId) {
  const have = (await ctx.repo.getContact(studentId)) || {};
  const f = app.form || {};
  const next = {
    mailingAddress: have.mailing_address || (f.contact && f.contact.address) || null,
    cellPhone: have.cell_phone || (f.contact && f.contact.phone) || null,
    altPhone: have.alt_phone || null,
    dateOfBirth: have.date_of_birth || (E.isDate(app.dob) ? app.dob : null)
  };
  await ctx.repo.putContact(studentId, next, actorId);
}

const relationshipOf = (text) => {
  const t = String(text || "").toLowerCase();
  if (/(mother|father|mom|dad|parent)/.test(t)) return "parent";
  if (/grand/.test(t)) return "grandparent";
  if (/foster/.test(t)) return "foster_parent";
  if (/guardian/.test(t)) return "guardian";
  if (/(uncle|aunt|brother|sister|sibling|cousin|relative)/.test(t)) return "relative";
  return RELATIONSHIPS.includes(t) ? t : "other";
};

const facts = (pairs) => pairs.filter((p) => p[1]).map((p) => ({ label: p[0], value: String(p[1]).slice(0, 240) }));

/* Everything that follows from a student being enrolled. Each step records
   what it did, and a step that cannot be done says why — it never throws the
   enrollment away. Safe to run again: it only does what is not yet done. */
async function syncEnrollment(ctx, enrollment, appRow, app, { courseIds, guardians, day, orgId, log }) {
  const actor = ctx.actor;
  const steps = [];
  const step = (key, status, note, extra) => steps.push({ key, status, note: note || "", ...(extra || {}) });
  const studentId = enrollment.student_id;

  step("identity", "done", "Student account linked");

  // The family: one link per guardian who has an email, an account made for
  // those who need one and were given a sign-in, and the rest named.
  const list = (app.form && app.form.guardians) || [];
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    const label = g.name || `Guardian ${i + 1}`;
    try {
      const email = String(g.email || "").trim().toLowerCase();
      if (!email) { step(`family:${i}`, "note", `${label} has no email on file, so there is no family sign-in yet`); continue; }
      let acct = await ctx.repo.findAccountByEmail(email);
      if (!acct) {
        const given = (guardians.find((x) => x && x.index === i) || {}).password;
        if (!given) {
          step(`family:${i}`, "note", `${label} has no sign-in yet — give ${email} a password to let them in`,
               { needs: "signin", index: i, email, name: label });
          continue;
        }
        const pw = await hashPassword(check.password(given));
        const words = label.split(/\s+/);
        acct = await ctx.repo.createAccount({
          email: g.email.trim(), hash: pw.hash, salt: pw.salt, iterations: pw.iterations, name: label,
          firstName: words[0], initials: words.map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
          hue: "#0f766e", title: g.relationship || "Family"
        });
      }
      await ctx.repo.grantRole(acct.id, "learn", "guardian", orgId);
      if (orgId) {
        const orgs = await ctx.repo.membershipsFor(acct.id);
        if (!orgs.some((o) => o.org_id === orgId)) await ctx.repo.addMember(orgId, acct.id, "member");
      }
      if (acct.id !== studentId) {
        await ctx.repo.linkGuardian({ guardianId: acct.id, studentId, orgId, relationship: relationshipOf(g.relationship),
          label: g.relationship || null, primary: !!g.primary, createdBy: actor.id });
        const card = (await ctx.repo.getContact(acct.id)) || {};
        if (!card.cell_phone && g.phone) {
          await ctx.repo.putContact(acct.id, { mailingAddress: card.mailing_address || g.address || null, cellPhone: g.phone,
            altPhone: card.alt_phone || null, dateOfBirth: card.date_of_birth || null }, actor.id);
        }
      }
      step(`family:${i}`, "done", `${label} linked`);
    } catch (e) {
      step(`family:${i}`, "exception", `${label}: ${e && e.message ? e.message : "could not be linked"}`);
    }
  }

  // What the school keeps about a student beyond marks, written where the
  // family's own page reads it. A section the school already wrote stays as
  // it was written — the application never overwrites a person's work.
  try {
    const existing = new Set((await ctx.repo.listStudentRecords(studentId)).map((r) => r.section));
    const put = (section, body) => ctx.repo.putStudentRecord({ accountId: studentId, orgId, section, body, actorId: actor.id });
    await put("enrollment", {
      summary: `Enrolled for ${E.yearLabel(enrollment.school_year)}, ${enrollment.grade}.`,
      facts: facts([["School year", enrollment.school_year], ["Grade", enrollment.grade], ["Starts", enrollment.starts_on],
        ["Enrollment type", enrollment.enrollment_type], ["Admission number", enrollment.admission_no],
        ["Previous school", enrollment.previous_school]]),
      rows: null, notes: null
    });
    if (!existing.has("student") && (app.preferredName || app.form.student)) {
      await put("student", { summary: null, rows: null, notes: null, facts: facts([
        ["Preferred name", app.preferredName], ["Gender", (app.form.student || {}).gender],
        ["Home language", (app.form.student || {}).language || (app.form.contact || {}).language]]) });
    }
    const em = app.form.emergency || {};
    if (!existing.has("emergency") && em.name) {
      await put("emergency", { summary: null, rows: null, notes: null,
        facts: facts([["Name", em.name], ["Relationship", em.relationship], ["Phone", em.phone]]) });
    }
    step("records", "done", "Student record written");
  } catch (e) {
    step("records", "exception", e && e.message ? e.message : "The student record could not be written");
  }

  // Courses. A student who starts later is not on a roster today.
  const placements = parse(enrollment.placements_json, []);
  const want = [...new Set([...placements.map((p) => p.courseId), ...courseIds])];
  const outPlacements = [];
  for (const courseId of want) {
    try {
      const course = await ctx.repo.findCourse(courseId);
      if (!course || (orgId && course.org_id && course.org_id !== orgId)) {
        outPlacements.push({ courseId, title: null, status: "exception", note: "That course no longer exists" });
        continue;
      }
      if (enrollment.starts_on > day) {
        outPlacements.push({ courseId, title: course.title, status: "scheduled", note: `Joins on ${enrollment.starts_on}` });
        continue;
      }
      await ctx.repo.enrol(courseId, studentId, "student");
      outPlacements.push({ courseId, title: course.title, status: "done", note: "" });
    } catch (e) {
      outPlacements.push({ courseId, title: null, status: "exception", note: e && e.message ? e.message : "Could not join" });
    }
  }
  if (!want.length) step("placement", "attention", "Not placed in a course yet");
  else if (outPlacements.some((p) => p.status === "exception")) step("placement", "exception", `${outPlacements.filter((p) => p.status === "exception").length} course(s) could not be joined`);
  else if (outPlacements.some((p) => p.status === "scheduled")) step("placement", "scheduled", `Courses start on ${enrollment.starts_on}`);
  else step("placement", "done", `${outPlacements.length} course${outPlacements.length === 1 ? "" : "s"}`);

  const bad = steps.some((s) => s.status === "exception" || s.status === "attention");
  const state = bad ? "exception" : steps.some((s) => s.status === "scheduled") ? "pending" : "done";
  await ctx.repo.updateEnrollment(enrollment.id, { placements: outPlacements, sync: steps, syncState: state });
  await log("sync", { to: state, note: steps.filter((s) => s.status !== "done").map((s) => s.note).join(" · ") || "All set up",
                      internal: true, meta: { steps: steps.length } });
  return { state, steps, placements: outPlacements };
}

/* Course placement that was waiting for its start date. */
async function syncDue(ctx, orgId, day) {
  const due = await ctx.repo.listEnrollmentsDue(orgId, day);
  let n = 0;
  for (const e of due) {
    try {
      const appRow = e.application_id ? await ctx.repo.findApplication(e.application_id) : null;
      const app = appRow ? domain(appRow) : { form: {}, preferredName: null };
      const noop = async () => {};
      await syncEnrollment(ctx, e, appRow, app, { courseIds: [], guardians: [], day, orgId, log: appRow ? note(ctx, appRow) : noop });
      n++;
    } catch { /* it stays pending and is tried again */ }
  }
  return n;
}

/* ------------------------------------------------------------ Documents */

const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const FILE_LIMIT = 700 * 1024;

/* PUT /api/v1/applications/:id/documents/:key — the checklist is the
   registrar's word. A family can say a paper is on its way; only the people
   who verify can call it verified. */
export async function putDocument(ctx, { applicationId, key }) {
  const actor = requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const body = await readJson(ctx.request);
  const status = check.oneOf(body.status, "status", E.DOC_STATUSES);
  const settings = await settingsFor(ctx, view.orgId, dayOf(ctx));
  const docs = await settleDocuments(ctx, row, settings);
  const doc = docs.find((d) => d.key === key);
  if (!doc) throw ApiError.notFound("That document is not on this application's checklist.");
  if (row.enrollment_id || !E.OPEN_STATUSES.includes(row.status)) {
    throw ApiError.conflict("This application is closed, so its documents are fixed.");
  }

  // Marking something received by hand (a paper handed over the desk) is
  // enrolment-staff work; verifying, returning and waiving is verification.
  const needsVerify = ["verified", "returned", "waived", "missing"].includes(status);
  if (needsVerify && !view.p.verify) await must(ctx, "enrollment.verify", { orgId: view.orgId });
  if (!needsVerify && !view.p.write) await must(ctx, "enrollment.write", { orgId: view.orgId });
  if (doc.sensitive && !view.p.sensitive) await must(ctx, "enrollment.sensitive", { orgId: view.orgId });
  if (status === "verified" && !doc.file_id && !body.sighted) {
    throw ApiError.badRequest("Verify a document after seeing it: attach a scan, or confirm it was seen in person.", "status");
  }
  const noteText = str(body.note, "note", 240) || null;
  if (status === "returned" && !noteText) throw ApiError.badRequest("Say what is wrong with it, so the family knows what to send.", "note");

  const t = Date.now();
  // Documents exist as rows once an application is open; make sure this one does.
  if (!(await ctx.repo.listDocuments(applicationId)).some((d) => d.key === key)) {
    await ctx.repo.syncDocuments(applicationId, E.documentsFor(settings, row.entry_grade, row.enrollment_type));
  }
  const updated = await ctx.repo.updateDocument(applicationId, key, {
    status, note: noteText, reviewedBy: needsVerify ? actor.id : null, reviewedAt: needsVerify ? t : null,
    ...(status === "received" && !doc.received_at ? { receivedAt: t } : {})
  });
  await note(ctx, row)("document", { field: key, from: doc.status, to: status, note: noteText, internal: status !== "returned" });

  let cur = row;
  const built = await build(ctx, row, view, { events: false });
  const moved = E.statusAfterDocuments(row.status, built.ev);
  if (moved !== row.status) {
    cur = await ctx.repo.updateApplication(applicationId, { status: moved });
    await note(ctx, row)("status", { from: row.status, to: moved, note: moved === "submitted" ? "All required documents received" : "A document is outstanding", internal: false });
  }
  const full = await build(ctx, cur, view);
  void updated;
  return json({ application: full.shape });
}

/* POST /api/v1/applications/:id/documents/:key/file { name, type, data }

   `data` is the file, base64. A cap keeps it inside what a database row can
   hold; a bigger scan needs object storage, which this platform does not
   have yet, and the message says so rather than failing quietly. */
export async function putFile(ctx, { applicationId, key }) {
  const actor = requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const settings = await settingsFor(ctx, view.orgId, dayOf(ctx));
  const docs = await settleDocuments(ctx, row, settings);
  const doc = docs.find((d) => d.key === key);
  if (!doc) throw ApiError.notFound("That document is not on this application's checklist.");
  if (row.enrollment_id || !E.OPEN_STATUSES.includes(row.status)) {
    throw ApiError.conflict("This application is closed, so its documents are fixed.");
  }
  if (!view.staff && !["draft", "incomplete", "submitted", "changes_requested"].includes(row.status)) {
    throw ApiError.conflict("This application is being reviewed. Ask the school to add a document.");
  }
  if (doc.sensitive && !view.p.sensitive && !view.owner) await must(ctx, "enrollment.sensitive", { orgId: view.orgId });

  const body = await readJson(ctx.request, { limit: 1200 * 1024 });
  const name = check.string(body.name, "name", { max: 160 });
  const type = check.oneOf(String(body.type || "").toLowerCase(), "type", FILE_TYPES);
  const data = check.string(body.data, "data", { max: 1100 * 1024, trim: false });
  if (!/^[A-Za-z0-9+/]+=*$/.test(data)) throw ApiError.badRequest("The file was not sent as base64.", "data");
  const size = Math.floor(data.length * 3 / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (size > FILE_LIMIT) {
    throw ApiError.badRequest(`That file is ${Math.round(size / 1024)} KB. The limit is ${FILE_LIMIT / 1024} KB — scan at a lower resolution, or send a PDF.`, "data");
  }
  const fileId = await ctx.repo.putApplicationFile({ applicationId, key, name, type, size, data, actorId: actor.id });
  await ctx.repo.deleteApplicationFiles(applicationId, key, fileId);
  if (!(await ctx.repo.listDocuments(applicationId)).some((d) => d.key === key)) {
    await ctx.repo.syncDocuments(applicationId, E.documentsFor(settings, row.entry_grade, row.enrollment_type));
  }
  await ctx.repo.updateDocument(applicationId, key, {
    fileId, fileName: name, fileType: type, fileSize: size, status: "received", receivedAt: Date.now(),
    reviewedBy: null, reviewedAt: null, note: null
  });
  await note(ctx, row)("document", { field: key, from: doc.status, to: "received", note: `File: ${name}`, internal: false });

  let cur = row;
  const built = await build(ctx, row, view, { events: false });
  const moved = E.statusAfterDocuments(row.status, built.ev);
  if (moved !== row.status) {
    cur = await ctx.repo.updateApplication(applicationId, { status: moved });
    await note(ctx, row)("status", { from: row.status, to: moved, note: "All required documents received", internal: false });
  }
  return json({ application: (await build(ctx, cur, view)).shape }, { status: 201 });
}

/* GET /api/v1/applications/:id/documents/:key/file */
export async function getFile(ctx, { applicationId, key }) {
  requireActor(ctx);
  const row = await ctx.repo.findApplication(applicationId);
  if (!row) throw ApiError.notFound("No such application.");
  const view = await standing(ctx, row);
  const doc = (await ctx.repo.listDocuments(applicationId)).find((d) => d.key === key);
  if (!doc || !doc.file_id) throw ApiError.notFound("There is no file for that document.");
  if (doc.sensitive && !view.p.sensitive && !view.owner) {
    await must(ctx, "enrollment.sensitive", { orgId: view.orgId });
  }
  const f = await ctx.repo.getApplicationFile(doc.file_id);
  if (!f) throw ApiError.notFound("There is no file for that document.");
  return json({ file: { id: f.id, name: f.name, type: f.type, size: f.size, data: f.data, uploadedAt: f.uploaded_at } });
}

/* ----------------------------------------------------------------- Bulk */

/* POST /api/v1/applications/bulk { ids, action, to, dueOn }

   Only the steps that are safe to do to many at once: assigning an owner and
   a due date. Each application is checked and reported on its own, so one
   that cannot be changed does not stop the rest. */
export async function bulk(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.write", { orgId });
  const body = await readJson(ctx.request);
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((x) => typeof x === "string"))].slice(0, 100) : [];
  if (!ids.length) throw ApiError.badRequest("Choose at least one application.", "ids");
  const action = check.oneOf(body.action, "action", ["assign"]);
  const to = body.to ? check.string(body.to, "to", { max: 64 }) : null;
  if (to && !(await ctx.repo.findAccountById(to))) throw ApiError.notFound("No such account.");
  await mustBeTeam(ctx, orgId, to);
  const dueOn = body.dueOn ? (E.isDate(body.dueOn) ? body.dueOn : (() => { throw ApiError.badRequest("The due date is written YYYY-MM-DD.", "dueOn"); })()) : undefined;
  const names = await ctx.repo.namesFor([to]);
  const results = [];
  for (const id of ids) {
    const row = await ctx.repo.findApplication(id);
    if (!row || (row.org_id && orgId && row.org_id !== orgId)) { results.push({ id, ok: false, why: "Not found" }); continue; }
    if (!E.OPEN_STATUSES.includes(row.status) || row.enrollment_id) { results.push({ id, ok: false, why: "Already closed" }); continue; }
    await ctx.repo.updateApplication(id, { assignedTo: to, ...(dueOn !== undefined ? { dueOn } : {}) });
    await note(ctx, row)("assign", { from: null, to: to ? names[to] || to : null, note: "Assigned in bulk", internal: true });
    results.push({ id, ok: true });
  }
  void action;
  return json({ results, changed: results.filter((r) => r.ok).length });
}

/* ---------------------------------------------------------- Enrollments */

/* GET /api/v1/enrollments */
export async function listEnrollments(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.read", { orgId });
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  await syncDue(ctx, orgId, day);
  const q = ctx.url.searchParams;
  const yearParam = q.get("year");
  const year = yearParam === "all" ? null : (E.isYear(yearParam) ? yearParam : settings.currentYear);
  const sid = q.get("studentId");
  let rows = (await ctx.repo.listEnrollments({ orgId, year, studentId: sid || null })).map((e) => shapeEnrollment(e, day));
  const counts = { all: rows.length };
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  counts.exceptions = rows.filter((r) => r.syncState === "exception").length;
  const status = q.get("status");
  if (status === "exceptions") rows = rows.filter((r) => r.syncState === "exception");
  else if (status === "left") rows = rows.filter((r) => r.status === "withdrawn" || r.status === "transferred");
  else if (status && status !== "all") rows = rows.filter((r) => r.status === status);
  const grade = q.get("grade"); if (grade) rows = rows.filter((r) => r.grade === grade);
  const term = String(q.get("q") || "").trim().toLowerCase();
  if (term) rows = rows.filter((r) => [r.name, r.email, r.admissionNo, r.grade].join(" ").toLowerCase().includes(term));
  const size = Math.max(5, Math.min(100, Number(q.get("size")) || 25));
  const page = Math.max(1, Number(q.get("page")) || 1);
  return json({ items: rows.slice((page - 1) * size, page * size), total: rows.length, page, size, counts,
                year: year || "all", today: day, years: settings.years, currentYear: settings.currentYear });
}

/* POST /api/v1/enrollments/:id/actions/:action

   What can happen to a year of schooling once it exists. Withdrawing,
   transferring out and completing end it on a date; none of them deletes the
   record or its application. Coming off a roster is a separate, stated choice. */
export async function enrollmentAct(ctx, { enrollmentId, action }) {
  const actor = requireActor(ctx);
  const e = await ctx.repo.findEnrollment(enrollmentId);
  if (!e) throw ApiError.notFound("No such enrollment.");
  const orgId = e.org_id || orgOf(actor);
  await must(ctx, "enrollment.activate", { orgId });
  const day = dayOf(ctx);
  const body = await readJson(ctx.request, { limit: 32 * 1024 });
  const appRow = e.application_id ? await ctx.repo.findApplication(e.application_id) : null;
  const log = async (kind, o) => {
    if (appRow) await ctx.repo.addApplicationEvent(appRow.id, { actorId: actor.id, actorName: actor.name, kind, internal: false, ...o });
  };
  const live = ["enrolled", "suspended"].includes(e.state);
  const t = (v, f, max) => str(v, f, max);
  const leave = async () => {
    if (body.removeFromCourses !== true) return 0;
    let n = 0;
    for (const p of parse(e.placements_json, [])) {
      if (p.status === "done") { await ctx.repo.unenrol(p.courseId, e.student_id, "student"); n++; }
    }
    const kept = parse(e.placements_json, []).map((p) => (p.status === "done" ? { ...p, status: "left" } : p));
    await ctx.repo.updateEnrollment(e.id, { placements: kept });
    return n;
  };
  const endDate = () => {
    const d = body.endsOn || day;
    if (!E.isDate(d)) throw ApiError.badRequest("The end date is written YYYY-MM-DD.", "endsOn");
    return d;
  };
  const needLive = () => { if (!live) throw ApiError.conflict(`That enrollment is already ${e.state}.`); };

  let updated;
  switch (action) {
    case "suspend": {
      needLive();
      if (e.state === "suspended") { updated = e; break; }
      updated = await ctx.repo.updateEnrollment(e.id, { state: "suspended", exitNote: t(body.note, "note", 240) || null });
      await log("enrollment", { from: "enrolled", to: "suspended", note: t(body.note, "note", 240) || null });
      break;
    }
    case "resume": {
      if (e.state !== "suspended") throw ApiError.conflict("Only a suspended enrollment can be resumed.");
      updated = await ctx.repo.updateEnrollment(e.id, { state: "enrolled", exitNote: null });
      await log("enrollment", { from: "suspended", to: "enrolled", note: "Resumed" });
      break;
    }
    case "withdraw":
    case "transfer": {
      needLive();
      const reason = action === "transfer" ? "transferred_out" : check.oneOf(body.reason, "reason", E.EXIT_REASONS);
      const where = action === "transfer" ? t(body.school, "school", 160) : "";
      if (action === "transfer" && !where) throw ApiError.badRequest("Say which school the student is going to.", "school");
      const removed = await leave();
      updated = await ctx.repo.updateEnrollment(e.id, {
        state: action === "transfer" ? "transferred" : "withdrawn", endsOn: endDate(), exitReason: reason,
        exitNote: [where, t(body.note, "note", 240)].filter(Boolean).join(" — ") || null
      });
      await log("enrollment", { from: e.state, to: updated.state, note: [reason, where, t(body.note, "note", 240), removed ? `Left ${removed} course(s)` : ""].filter(Boolean).join(" — ") });
      break;
    }
    case "complete": {
      needLive();
      const removed = await leave();
      updated = await ctx.repo.updateEnrollment(e.id, { state: "completed", endsOn: endDate(), exitReason: "completed_programme" });
      await log("enrollment", { from: e.state, to: "completed", note: removed ? `Left ${removed} course(s)` : "Year completed" });
      break;
    }
    case "reschedule": {
      needLive();
      if (!E.isDate(body.startsOn)) throw ApiError.badRequest("Say the new start day, YYYY-MM-DD.", "startsOn");
      updated = await ctx.repo.updateEnrollment(e.id, { startsOn: body.startsOn, syncState: "pending" });
      await log("enrollment", { field: "startsOn", from: e.starts_on, to: body.startsOn });
      break;
    }
    case "place": {
      needLive();
      const app = appRow ? domain(appRow) : { form: {}, preferredName: null };
      const r = await syncEnrollment(ctx, e, appRow, app, {
        courseIds: Array.isArray(body.courseIds) ? body.courseIds.filter((x) => typeof x === "string").slice(0, 30) : [],
        guardians: Array.isArray(body.guardians) ? body.guardians : [], day, orgId, log: async () => {}
      });
      void r;
      updated = await ctx.repo.findEnrollment(e.id);
      await log("sync", { to: updated.sync_state, note: "Set up again", internal: true });
      break;
    }
    case "resync": {
      needLive();
      const app = appRow ? domain(appRow) : { form: {}, preferredName: null };
      await syncEnrollment(ctx, e, appRow, app, {
        courseIds: [], guardians: Array.isArray(body.guardians) ? body.guardians : [], day, orgId, log: async () => {}
      });
      updated = await ctx.repo.findEnrollment(e.id);
      await log("sync", { to: updated.sync_state, note: "Tried again", internal: true });
      break;
    }
    default:
      throw ApiError.notFound(`There is no "${action}" step for an enrollment.`);
  }
  const full = (await ctx.repo.listEnrollments({ orgId, studentId: e.student_id })).find((x) => x.id === e.id);
  return json({ enrollment: shapeEnrollment(full || updated, day) });
}

/* POST /api/v1/enrollment/reenrol { toYear, enrollmentIds?, intendedStart? }

   Next year, for the students who were here this year: one new application
   each, for the same person, in the next grade, carrying what the family
   already told us. A student already enrolled or already applying is skipped,
   and so is one with nowhere further to go. Nothing is submitted for them. */
export async function reenrol(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "enrollment.write", { orgId });
  const day = dayOf(ctx);
  const settings = await settingsFor(ctx, orgId, day);
  const body = await readJson(ctx.request);
  const toYear = check.oneOf(body.toYear, "toYear", settings.years);
  const fromYear = E.previousYear(toYear);
  const intendedStart = E.isDate(body.intendedStart) ? body.intendedStart : `${toYear.slice(0, 4)}-06-01`;
  const only = Array.isArray(body.enrollmentIds) ? new Set(body.enrollmentIds) : null;

  const from = (await ctx.repo.listEnrollments({ orgId, year: fromYear }))
    .filter((e) => ["enrolled", "completed"].includes(e.state) && (!only || only.has(e.id)));
  const here = await ctx.repo.listApplications({ orgId, year: toYear });
  const created = [], skipped = [];
  for (const e of from) {
    const name = e.student_name || e.student_email;
    const grade = E.nextGrade(settings, e.grade);
    if (!grade) { skipped.push({ id: e.id, name, why: "No grade after " + e.grade }); continue; }
    if (await ctx.repo.findLiveEnrollment(e.student_id, toYear)) { skipped.push({ id: e.id, name, why: "Already enrolled" }); continue; }
    if (here.some((a) => a.student_id === e.student_id && E.OPEN_STATUSES.includes(a.status))) {
      skipped.push({ id: e.id, name, why: "Already applying" }); continue;
    }
    const prior = e.application_id ? await ctx.repo.findApplication(e.application_id) : null;
    const t = String(e.student_name || "").trim().split(/\s+/);
    const form = prior ? { ...parse(prior.body_json, {}), consents: [] } : {};
    form.previous = { ...(form.previous || {}), school: settings.currentYear === fromYear ? "" : (form.previous || {}).school || "" };
    const row = await ctx.repo.createApplication({
      orgId, studentId: e.student_id, schoolYear: toYear, grade, type: "returning",
      legalFirst: (prior && prior.legal_first) || t[0] || "", legalLast: (prior && prior.legal_last) || t.slice(1).join(" "),
      preferredName: (prior && prior.preferred_name) || null, dob: (prior && prior.dob) || null,
      form, intendedStart, source: "staff", dueOn: E.addDays(day, settings.dueDays), createdBy: actor.id
    });
    await ctx.repo.syncDocuments(row.id, E.documentsFor(settings, grade, "returning"));
    await note(ctx, row)("status", { from: null, to: "draft", note: `Re-enrolment from ${E.yearLabel(fromYear)}`, internal: false });
    created.push({ id: row.id, number: E.applicationNumber(row.seq), name, grade });
  }
  return json({ created, skipped, toYear, fromYear }, { status: created.length ? 201 : 200 });
}
