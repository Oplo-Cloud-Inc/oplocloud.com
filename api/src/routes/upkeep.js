/* ==========================================================================
   /api/v1/facilities/schedules — what recurs

   A preventive job, an inspection, or a check the school has to be able to
   show it did. A schedule does not run by itself: there is no timer. It is
   read when somebody looks — the summary, the order list — and any whose
   window has opened write their work order then. The (schedule, due date)
   pair is unique in the database, so two people looking at once make one
   order, not two.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import * as F from "../services/facilities.js";
import { orgOf, text, day, whole, todayOf, mustBeTeam, parseJson, note } from "./facility-common.js";

const KIND_TO_ORDER = { preventive: "preventive", inspection: "inspection", compliance: "compliance" };

/* Write the order a schedule owes, if it owes one. Returns the id made. */
async function writeOrder(ctx, orgId, s, today, periods) {
  const open = await ctx.repo.openOrdersFor(s.id);
  const p = F.plan(s, today, { hasOpen: open > 0, periods });
  if (p.finished) { await ctx.repo.updateSchedule(s.id, { nextDueOn: null }); return { finished: true }; }
  if (!p.create) return { waiting: !!p.waiting };
  const list = F.normaliseChecklist(parseJson(s.checklist_json, []).map((x) => ({ text: x.text, type: x.type, onFail: x.onFail })));
  const r = await ctx.repo.generateOrder({
    orgId, kind: KIND_TO_ORDER[s.kind] || "task", title: s.title, details: s.details, category: s.category, priority: s.priority,
    status: "open", spaceId: s.space_id, assetId: s.asset_id, vendorId: s.vendor_id, scheduleId: s.id,
    assigneeId: s.assignee_id, dueOn: p.dueOn, dueKey: p.dueOn, checklist: list
  }, { nextDueOn: p.next, lastGeneratedOn: today });
  if (r.made) {
    await ctx.repo.addFacilityEvent(orgId, "work_order", r.id, { actorName: "Schedule", kind: "created", note: `Due ${p.dueOn}` });
  }
  return { made: r.made, id: r.id };
}

/* Called by the summary and the order list. Quiet, bounded, idempotent. */
export async function syncSchedules(ctx, orgId, today) {
  const due = await ctx.repo.listDueSchedules(orgId, today, 50);
  if (!due.length) return 0;
  const periods = await ctx.repo.listPeriods(orgId);
  let made = 0;
  for (const s of due) {
    const r = await writeOrder(ctx, orgId, s, today, periods);
    if (r.made) made++;
  }
  return made;
}

export function shape(s, today) {
  const checklist = parseJson(s.checklist_json, []);
  let state = "active";
  if (!s.active) state = "paused";
  else if (!s.next_due_on && s.from_completion) state = "waiting";
  else if (!s.next_due_on) state = "finished";
  return {
    id: s.id, kind: s.kind, title: s.title, details: s.details || null, category: s.category, priority: s.priority,
    spaceId: s.space_id || null, spaceName: s.space_name || null, assetId: s.asset_id || null, assetName: s.asset_name || null,
    vendorId: s.vendor_id || null, vendorName: s.vendor_name || null, assigneeId: s.assignee_id || null, assigneeName: s.assignee_name || null,
    every: s.every, unit: s.unit, startsOn: s.starts_on, endsOn: s.ends_on || null, leadDays: s.lead_days,
    fromCompletion: !!s.from_completion, skipIfOpen: !!s.skip_if_open, skipBreaks: !!s.skip_breaks,
    checklist, authority: s.authority || null, source: s.source || null, active: !!s.active, state,
    nextDueOn: s.next_due_on || null, lastDoneOn: s.last_done_on || null,
    overdue: !!(s.active && s.next_due_on && s.next_due_on < today), createdAt: s.created_at
  };
}

async function refs(ctx, orgId, body) {
  const out = {};
  if (body.spaceId) {
    const sp = await ctx.repo.findSpace(check.string(body.spaceId, "spaceId", { max: 64 }));
    if (!sp || sp.org_id !== orgId) throw ApiError.notFound("No such room.");
    out.spaceId = sp.id;
  } else if (body.spaceId === null) out.spaceId = null;
  if (body.assetId) {
    const a = await ctx.repo.findAsset(check.string(body.assetId, "assetId", { max: 64 }));
    if (!a || a.org_id !== orgId) throw ApiError.notFound("No such asset.");
    out.assetId = a.id;
  } else if (body.assetId === null) out.assetId = null;
  if (body.vendorId) {
    const v = await ctx.repo.findVendor(check.string(body.vendorId, "vendorId", { max: 64 }));
    if (!v || v.org_id !== orgId) throw ApiError.notFound("No such vendor.");
    out.vendorId = v.id;
  } else if (body.vendorId === null) out.vendorId = null;
  if (body.assigneeId) {
    out.assigneeId = check.string(body.assigneeId, "assigneeId", { max: 64 });
    await mustBeTeam(ctx, orgId, out.assigneeId);
  } else if (body.assigneeId === null) out.assigneeId = null;
  return out;
}

function checklistOf(raw) {
  try { return F.normaliseChecklist(raw); } catch (e) { throw ApiError.badRequest(e.message, "checklist"); }
}

/* GET /api/v1/facilities/schedules */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.read", { orgId });
  const today = todayOf(ctx);
  await syncSchedules(ctx, orgId, today);
  const rows = await ctx.repo.listSchedules(orgId);
  return json({ schedules: rows.map((s) => shape(s, today)), today });
}

/* GET /api/v1/facilities/templates — starter checks, offered and never applied. */
export async function templates(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "facility.read", { orgId: orgOf(actor) });
  return json({ templates: F.STARTER_CHECKS });
}

/* POST /api/v1/facilities/schedules */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.manage", { orgId });
  const body = await readJson(ctx.request);
  const today = todayOf(ctx, body.today);
  const kind = check.oneOf(body.kind || "preventive", "kind", F.SCHEDULE_KINDS);
  const row = {
    orgId, kind, title: text(body.title, "title", 160, true), details: text(body.details, "details", 2000),
    category: check.oneOf(body.category || "maintenance", "category", F.CATEGORIES),
    priority: check.oneOf(body.priority || "normal", "priority", F.PRIORITIES),
    every: whole(body.every ?? 1, "every", { min: 1, max: 60 }),
    unit: check.oneOf(body.unit || "month", "unit", F.UNITS),
    startsOn: day(body.startsOn || today, "startsOn", true), endsOn: day(body.endsOn, "endsOn"),
    leadDays: whole(body.leadDays ?? 0, "leadDays", { min: 0, max: 120 }),
    fromCompletion: body.fromCompletion === true, skipIfOpen: body.skipIfOpen !== false, skipBreaks: body.skipBreaks === true,
    checklist: checklistOf(body.checklist), authority: text(body.authority, "authority", 160), source: text(body.source, "source", 240),
    createdBy: actor.id, ...(await refs(ctx, orgId, body))
  };
  if (row.endsOn && row.endsOn < row.startsOn) throw ApiError.badRequest("It cannot end before it starts.", "endsOn");
  const periods = await ctx.repo.listPeriods(orgId);
  row.nextDueOn = F.firstDue({ starts_on: row.startsOn, skip_breaks: row.skipBreaks }, periods);
  const s = await ctx.repo.createSchedule(row);
  await note(ctx, orgId, "schedule", s.id)("created", `${kind}: ${s.title}`);
  return json({ schedule: shape(s, today) }, { status: 201 });
}

/* PATCH /api/v1/facilities/schedules/:scheduleId */
export async function update(ctx, { scheduleId }) {
  const actor = requireActor(ctx);
  const s0 = await ctx.repo.findSchedule(scheduleId);
  if (!s0) throw ApiError.notFound("No such schedule.");
  await must(ctx, "facility.manage", { orgId: s0.org_id });
  const body = await readJson(ctx.request);
  const today = todayOf(ctx, body.today);
  const patch = {};
  const changed = [];
  const set = (k, v) => { if (v !== undefined) { patch[k] = v; changed.push(k); } };
  if (body.title !== undefined) set("title", text(body.title, "title", 160, true));
  if (body.details !== undefined) set("details", text(body.details, "details", 2000));
  if (body.category !== undefined) set("category", check.oneOf(body.category, "category", F.CATEGORIES));
  if (body.priority !== undefined) set("priority", check.oneOf(body.priority, "priority", F.PRIORITIES));
  if (body.every !== undefined) set("every", whole(body.every, "every", { min: 1, max: 60, req: true }));
  if (body.unit !== undefined) set("unit", check.oneOf(body.unit, "unit", F.UNITS));
  if (body.startsOn !== undefined) set("startsOn", day(body.startsOn, "startsOn", true));
  if (body.endsOn !== undefined) set("endsOn", day(body.endsOn, "endsOn"));
  if (body.leadDays !== undefined) set("leadDays", whole(body.leadDays, "leadDays", { min: 0, max: 120, req: true }));
  if (body.fromCompletion !== undefined) set("fromCompletion", body.fromCompletion === true);
  if (body.skipIfOpen !== undefined) set("skipIfOpen", body.skipIfOpen !== false);
  if (body.skipBreaks !== undefined) set("skipBreaks", body.skipBreaks === true);
  if (body.checklist !== undefined) set("checklist", checklistOf(body.checklist));
  if (body.authority !== undefined) set("authority", text(body.authority, "authority", 160));
  if (body.source !== undefined) set("source", text(body.source, "source", 240));
  const r = await refs(ctx, s0.org_id, body);
  for (const [k, v] of Object.entries(r)) set(k, v);
  if (!changed.length) return json({ schedule: shape(s0, today) });
  const startsOn = patch.startsOn || s0.starts_on, endsOn = patch.endsOn !== undefined ? patch.endsOn : s0.ends_on;
  if (endsOn && endsOn < startsOn) throw ApiError.badRequest("It cannot end before it starts.", "endsOn");
  // Moving the start moves the next date, unless the job is waiting on a completion.
  if (patch.startsOn && !(patch.fromCompletion ?? !!s0.from_completion)) {
    patch.nextDueOn = F.firstDue({ starts_on: patch.startsOn, skip_breaks: patch.skipBreaks ?? !!s0.skip_breaks }, await ctx.repo.listPeriods(s0.org_id));
  }
  const s = await ctx.repo.updateSchedule(scheduleId, patch);
  await note(ctx, s0.org_id, "schedule", scheduleId)("updated", changed.join(", "));
  return json({ schedule: shape(s, today) });
}

/* POST /api/v1/facilities/schedules/:scheduleId/actions/:action — run_now, pause, resume. */
export async function act(ctx, { scheduleId, action }) {
  const actor = requireActor(ctx);
  const s = await ctx.repo.findSchedule(scheduleId);
  if (!s) throw ApiError.notFound("No such schedule.");
  const body = await readJson(ctx.request);
  const today = todayOf(ctx, body.today);
  const log = note(ctx, s.org_id, "schedule", scheduleId);
  switch (action) {
    case "run_now": {
      await must(ctx, "facility.work", { orgId: s.org_id });
      if (!s.active) throw ApiError.conflict("This schedule is paused. Resume it first.");
      const open = await ctx.repo.openOrdersFor(scheduleId);
      if (open > 0 && s.skip_if_open) throw ApiError.conflict("The last one is still unfinished. Finish it, or turn off “wait for the last one”.");
      const prev = s.next_due_on;
      await ctx.repo.updateSchedule(scheduleId, { nextDueOn: today });
      const fresh = await ctx.repo.findSchedule(scheduleId);
      const r = await writeOrder(ctx, s.org_id, { ...fresh, lead_days: 0 }, today, await ctx.repo.listPeriods(s.org_id));
      if (!r.made) await ctx.repo.updateSchedule(scheduleId, { nextDueOn: prev });
      await log("run", r.made ? "Run now" : "Run now: nothing was written");
      return json({ schedule: shape(await ctx.repo.findSchedule(scheduleId), today), made: !!r.made, orderId: r.id || null });
    }
    case "pause":
    case "resume": {
      await must(ctx, "facility.manage", { orgId: s.org_id });
      const patch = { active: action === "resume" };
      if (action === "resume" && !s.next_due_on && !s.from_completion) {
        patch.nextDueOn = F.firstDue({ starts_on: today, skip_breaks: !!s.skip_breaks }, await ctx.repo.listPeriods(s.org_id));
      }
      const u = await ctx.repo.updateSchedule(scheduleId, patch);
      await log(action === "pause" ? "paused" : "resumed");
      return json({ schedule: shape(u, today) });
    }
    default:
      throw ApiError.notFound(`There is no "${action}" step.`);
  }
}

/* GET /api/v1/facilities/schedules/:scheduleId — with its history and the orders it has made. */
export async function get(ctx, { scheduleId }) {
  const actor = requireActor(ctx);
  const s = await ctx.repo.findSchedule(scheduleId);
  if (!s) throw ApiError.notFound("No such schedule.");
  await must(ctx, "facility.read", { orgId: s.org_id });
  const today = todayOf(ctx);
  const [events, orders] = await Promise.all([
    ctx.repo.listFacilityEvents("schedule", scheduleId),
    ctx.repo.listOrders({ orgId: s.org_id, scheduleId, limit: 30 })
  ]);
  return json({
    schedule: shape(s, today),
    events: events.map((e) => ({ id: e.id, at: e.at, byName: e.actor_name, kind: e.kind, note: e.note })),
    orders: orders.map((o) => ({ id: o.id, number: o.seq, title: o.title, status: o.status, dueOn: o.due_on, completedAt: o.completed_at }))
  });
}
