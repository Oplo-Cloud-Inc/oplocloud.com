/* ==========================================================================
   /api/v1/facilities/orders — what has to be done

   One table for everything somebody has to do. A teacher asks for something
   to be fixed and it waits, `pending`, until a person on the team accepts or
   declines it, with a reason; the teacher sees that status the whole way,
   because a request that goes quiet after it is sent is the reason people
   stop sending them. A request from somebody who works the building is
   accepted already.

   The requester reads their own orders and what the team wrote in public.
   Internal notes are the team's. Nothing here sends a message: OEdu sends
   none today, so "I can see where it is" has to be true on the page.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must } from "../core/guard.js";
import * as F from "../services/facilities.js";
import { orgOf, text, day, whole, todayOf, mustBeTeam, refuse, parseJson, note, readUpload } from "./facility-common.js";
import { syncSchedules } from "./upkeep.js";

const FILE_CAP = 8;
const VERB = { approve: "accepted", decline: "declined", reconsider: "reconsidered", start: "started", hold: "put on hold",
               complete: "completed", cancel: "cancelled", reopen: "reopened" };

function shape(o, today) {
  return {
    id: o.id, number: o.seq, kind: o.kind, title: o.title, details: o.details || null, category: o.category, priority: o.priority,
    status: o.status, spaceId: o.space_id || null, spaceName: o.space_name || null, assetId: o.asset_id || null,
    assetName: o.asset_name || null, assetCode: o.asset_code || null, vendorId: o.vendor_id || null, vendorName: o.vendor_name || null,
    scheduleId: o.schedule_id || null, requestedBy: o.requested_by || null, requesterName: o.requester_name || null,
    assigneeId: o.assignee_id || null, assigneeName: o.assignee_name || null, dueOn: o.due_on || null,
    overdue: F.isOverdue(o, today), startedAt: o.started_at || null, completedAt: o.completed_at || null,
    minutes: o.minutes ?? null, checklist: parseJson(o.checklist_json, []), outcome: o.outcome || null,
    declineReason: o.decline_reason || null, createdAt: o.created_at, updatedAt: o.updated_at
  };
}

/* What this person may do with this order. */
async function standing(ctx, o) {
  const actor = ctx.actor;
  const [work, read] = await Promise.all([can(ctx, "facility.work", { orgId: o.org_id }), can(ctx, "facility.read", { orgId: o.org_id })]);
  const own = o.requested_by === actor.id;
  if (!work && !read && !own) throw ApiError.notFound("No such work order.");
  return { work, read, own };
}

async function checked(ctx, id) {
  const o = await ctx.repo.findOrder(id);
  if (!o) throw ApiError.notFound("No such work order.");
  return o;
}

/* Things an order can point at must be this school's. */
async function placeRefs(ctx, orgId, body) {
  const out = {};
  if (body.spaceId) {
    const sp = await ctx.repo.findSpace(check.string(body.spaceId, "spaceId", { max: 64 }));
    if (!sp || sp.org_id !== orgId || sp.archived) throw ApiError.notFound("No such room.");
    out.spaceId = sp.id;
  } else if (body.spaceId === null) out.spaceId = null;
  if (body.assetId) {
    const a = await ctx.repo.findAsset(check.string(body.assetId, "assetId", { max: 64 }));
    if (!a || a.org_id !== orgId) throw ApiError.notFound("No such asset.");
    out.assetId = a.id;
    if (out.spaceId === undefined && a.space_id) out.spaceId = a.space_id;     // the thing says where it is
  } else if (body.assetId === null) out.assetId = null;
  return out;
}

/* GET /api/v1/facilities/orders
   status = unfinished | done | a status | a comma list; mine, requested,
   overdue, spaceId, assetId, vendorId, kind, q. Someone who does not work the
   building gets their own requests whatever they ask for. */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const q = ctx.url.searchParams;
  const today = todayOf(ctx);
  const wide = await can(ctx, "facility.read", { orgId });
  if (wide) await syncSchedules(ctx, orgId, today);

  // What is open in a room, in a line each: so a teacher sees it was reported.
  if (q.get("brief") === "1" && q.get("spaceId")) {
    const rows = await ctx.repo.listOpenBrief(orgId, q.get("spaceId"));
    return json({ open: rows.map((r) => ({ id: r.id, number: r.seq, title: r.title, status: r.status, category: r.category, createdAt: r.created_at })) });
  }

  const s = String(q.get("status") || "");
  const statuses = s === "unfinished" ? F.UNFINISHED : s === "done" ? ["done", "declined", "cancelled"]
                 : s ? s.split(",").filter((x) => F.STATUSES.includes(x)) : null;
  const opts = { orgId, statuses };
  if (!wide) opts.requestedBy = actor.id;
  else {
    if (q.get("mine") === "1") opts.assigneeId = actor.id;
    if (q.get("requested") === "1") opts.requestedBy = actor.id;
    for (const k of ["spaceId", "assetId", "vendorId", "kind"]) if (q.get(k)) opts[k] = q.get(k);
    if (q.get("overdue") === "1") opts.overdueBefore = today;
  }
  let rows = await ctx.repo.listOrders(opts);
  const term = String(q.get("q") || "").trim().toLowerCase();
  if (term) rows = rows.filter((r) => [r.title, r.details, r.space_name, r.asset_name, r.requester_name, "wo-" + r.seq].join(" ").toLowerCase().includes(term));
  return json({ orders: rows.map((r) => shape(r, today)), wide, today });
}

/* POST /api/v1/facilities/orders { title, details, category, priority, spaceId, assetId, clientKey, … } */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const body = await readJson(ctx.request);
  const key = body.clientKey ? check.string(body.clientKey, "clientKey", { max: 64 }) : null;
  if (key) {
    const have = await ctx.repo.findOrderByKey(orgId, key);
    if (have) return json({ order: shape(have, todayOf(ctx, body.today)), repeated: true });
  }
  const team = await can(ctx, "facility.work", { orgId });
  const row = {
    orgId, kind: "request", title: text(body.title, "title", 160, true), details: text(body.details, "details", 4000),
    category: check.oneOf(body.category || "maintenance", "category", F.CATEGORIES),
    priority: check.oneOf(body.priority || "normal", "priority", F.PRIORITIES),
    status: team ? "open" : "pending", requestedBy: actor.id, clientKey: key, ...(await placeRefs(ctx, orgId, body))
  };
  if (team) {
    // The people who work the building may set the rest at once.
    if (body.kind !== undefined) row.kind = check.oneOf(body.kind, "kind", F.ORDER_KINDS);
    if (body.assigneeId) { row.assigneeId = check.string(body.assigneeId, "assigneeId", { max: 64 }); await mustBeTeam(ctx, orgId, row.assigneeId); }
    row.dueOn = day(body.dueOn, "dueOn");
    if (body.vendorId) {
      const v = await ctx.repo.findVendor(String(body.vendorId));
      if (!v || v.org_id !== orgId) throw ApiError.notFound("No such vendor.");
      row.vendorId = v.id;
    }
    if (body.checklist !== undefined) {
      try { row.checklist = F.normaliseChecklist(body.checklist); } catch (e) { throw ApiError.badRequest(e.message, "checklist"); }
    }
  }
  let o;
  try { o = await ctx.repo.createOrder(row); }
  catch (e) {
    // Two taps of the same button, a second apart: the first one won.
    if (key && /UNIQUE/i.test(String(e && e.message))) {
      const have = await ctx.repo.findOrderByKey(orgId, key);
      if (have) return json({ order: shape(have, todayOf(ctx, body.today)), repeated: true });
    }
    throw e;
  }
  await note(ctx, orgId, "work_order", o.id)("created", team ? "Raised by the team" : "Requested");
  return json({ order: shape(o, todayOf(ctx, body.today)) }, { status: 201 });
}

/* GET /api/v1/facilities/orders/:orderId */
export async function get(ctx, { orderId }) {
  requireActor(ctx);
  const o = await checked(ctx, orderId);
  const st = await standing(ctx, o);
  const today = todayOf(ctx);
  const [events, files, docs] = await Promise.all([
    ctx.repo.listFacilityEvents("work_order", orderId),
    ctx.repo.listFacilityFiles("work_order", orderId),
    st.read || st.work ? ctx.repo.listFacilityDocuments({ orgId: o.org_id, ownerKind: "work_order", ownerId: orderId }) : Promise.resolve([])
  ]);
  const seen = st.read || st.work ? events : events.filter((e) => e.kind !== "note");
  return json({
    order: shape(o, today),
    events: seen.map((e) => ({ id: e.id, at: e.at, by: e.actor_id, byName: e.actor_name, kind: e.kind, note: e.note })),
    files: files.map((f) => ({ id: f.id, name: f.name, type: f.type, size: f.size, uploadedAt: f.uploaded_at })),
    documents: docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, expiresOn: d.expires_on, url: d.url || null })),
    can: { work: st.work, own: st.own }
  });
}

/* PATCH /api/v1/facilities/orders/:orderId — the team edits; a requester may fix their own words while it waits. */
export async function update(ctx, { orderId }) {
  const actor = requireActor(ctx);
  const o = await checked(ctx, orderId);
  const st = await standing(ctx, o);
  const mayEditWords = st.own && o.status === "pending";
  if (!st.work && !mayEditWords) throw ApiError.forbidden("Only the facilities team can change a work order once it is accepted.");
  const body = await readJson(ctx.request);
  const patch = {};
  const changed = [];
  const set = (k, v) => { if (v !== undefined) { patch[k] = v; changed.push(k); } };
  if (body.title !== undefined) set("title", text(body.title, "title", 160, true));
  if (body.details !== undefined) set("details", text(body.details, "details", 4000));
  if (st.work) {
    if (body.category !== undefined) set("category", check.oneOf(body.category, "category", F.CATEGORIES));
    if (body.priority !== undefined) set("priority", check.oneOf(body.priority, "priority", F.PRIORITIES));
    if (body.dueOn !== undefined) set("dueOn", day(body.dueOn, "dueOn"));
    if (body.kind !== undefined) set("kind", check.oneOf(body.kind, "kind", F.ORDER_KINDS));
    if (body.vendorId !== undefined) {
      if (body.vendorId) {
        const v = await ctx.repo.findVendor(String(body.vendorId));
        if (!v || v.org_id !== o.org_id) throw ApiError.notFound("No such vendor.");
      }
      set("vendorId", body.vendorId || null);
    }
    const r = await placeRefs(ctx, o.org_id, body);
    for (const [k, v] of Object.entries(r)) set(k, v);
    if (body.checklist !== undefined) {
      try { set("checklist", F.normaliseChecklist(body.checklist)); } catch (e) { throw ApiError.badRequest(e.message, "checklist"); }
    }
  }
  if (!changed.length) return json({ order: shape(o, todayOf(ctx)) });
  const u = await ctx.repo.updateOrder(orderId, patch);
  await note(ctx, o.org_id, "work_order", orderId)("updated", changed.join(", "));
  return json({ order: shape(u, todayOf(ctx, body.today)) });
}

/* POST /api/v1/facilities/orders/:orderId/actions/:action
   approve · decline{reason} · reconsider · start · hold · complete · cancel · reopen
   assign{assigneeId} · comment{note, internal} · checklist{answers} */
export async function act(ctx, { orderId, action }) {
  const actor = requireActor(ctx);
  const o = await checked(ctx, orderId);
  const st = await standing(ctx, o);
  const body = await readJson(ctx.request);
  const today = todayOf(ctx, body.today);
  const log = note(ctx, o.org_id, "work_order", orderId);
  const out = (u) => json({ order: shape(u, today) });

  if (action === "comment") {
    const words = text(body.note, "note", 2000, true);
    if (!st.work && !st.own) throw ApiError.forbidden("You can comment on your own requests.");
    await log(body.internal === true && st.work ? "note" : "comment", words);
    return out(o);
  }
  if (action === "assign") {
    if (!st.work) await must(ctx, "facility.work", { orgId: o.org_id });
    const to = body.assigneeId ? check.string(body.assigneeId, "assigneeId", { max: 64 }) : null;
    await mustBeTeam(ctx, o.org_id, to);
    const u = await ctx.repo.updateOrder(orderId, { assigneeId: to });
    const names = await ctx.repo.namesFor([to]);
    await log("assigned", to ? `Assigned to ${names[to] || "someone"}` : "Unassigned");
    return out(u);
  }
  if (action === "checklist") {
    if (!st.work) await must(ctx, "facility.work", { orgId: o.org_id });
    const merged = F.answerChecklist(parseJson(o.checklist_json, []), body.answers);
    return out(await ctx.repo.updateOrder(orderId, { checklist: merged }));
  }

  const to = F.moveTo(o.status, action);
  if (!F.MOVES[action]) throw ApiError.notFound(`There is no "${action}" step.`);
  // A requester may withdraw their own request while it is still theirs to withdraw.
  const ownCancel = action === "cancel" && st.own && ["pending", "open"].includes(o.status);
  if (!st.work && !ownCancel) await must(ctx, "facility.work", { orgId: o.org_id });
  if (!to) throw refuse(`That order is ${o.status.replace("_", " ")}, so it cannot be ${VERB[action]}.`);

  const patch = { status: to };
  let said = null;
  switch (action) {
    case "approve":
      if (body.assigneeId) { await mustBeTeam(ctx, o.org_id, String(body.assigneeId)); patch.assigneeId = String(body.assigneeId); }
      if (body.priority) patch.priority = check.oneOf(body.priority, "priority", F.PRIORITIES);
      if (body.dueOn) patch.dueOn = day(body.dueOn, "dueOn");
      break;
    case "decline":
      patch.declineReason = text(body.reason, "reason", 400, true);
      said = patch.declineReason;
      break;
    case "reconsider":
      patch.declineReason = null;
      break;
    case "start":
      patch.startedAt = o.started_at || Date.now();
      if (!o.assignee_id) patch.assigneeId = actor.id;                    // whoever starts it, has it
      break;
    case "hold":
      said = text(body.note, "note", 400);
      break;
    case "cancel":
      said = text(body.note, "note", 400);
      break;
    case "reopen":
      patch.completedAt = null; patch.completedBy = null;
      break;
    case "complete": {
      const list = F.answerChecklist(parseJson(o.checklist_json, []), body.answers);
      const left = F.unfinished(list);
      if (left.length && body.incomplete !== true) {
        throw refuse(`${left.length} line${left.length === 1 ? "" : "s"} of the checklist ${left.length === 1 ? "is" : "are"} not answered.`,
          { unfinished: left.map((x) => ({ id: x.id, text: x.text })) });
      }
      patch.checklist = list;
      patch.completedAt = Date.now(); patch.completedBy = actor.id;
      patch.minutes = whole(body.minutes, "minutes", { min: 0, max: 100000 });
      patch.outcome = text(body.outcome, "outcome", 400);
      if (!o.started_at) patch.startedAt = Date.now();
      said = patch.outcome || (left.length ? `Closed with ${left.length} unanswered` : null);
      break;
    }
    default: break;
  }
  const u = await ctx.repo.updateOrder(orderId, patch);
  await log("status", `${o.status} → ${to}${said ? ": " + said : ""}`);

  if (action === "complete") await afterComplete(ctx, o, u, patch.checklist, today, actor);
  return out(await ctx.repo.findOrder(orderId));
}

/* A finished order moves its schedule on, and a failed line raises an order of
   its own — once: the line remembers it did. */
async function afterComplete(ctx, before, done, list, today, actor) {
  if (before.schedule_id) {
    const s = await ctx.repo.findSchedule(before.schedule_id);
    if (s) {
      const r = F.afterCompletion(s, today, await ctx.repo.listPeriods(before.org_id));
      const patch = { lastDoneOn: r.lastDoneOn };
      if (r.next !== undefined) patch.nextDueOn = r.next;
      await ctx.repo.updateSchedule(s.id, patch);
    }
  }
  const raised = F.failed(list).filter((x) => x.onFail !== false && !x.raised);
  if (!raised.length) return;
  const where = done.space_name ? ` — ${done.space_name}` : "";
  const next = list.map((x) => ({ ...x }));
  for (const item of raised) {
    const r = await ctx.repo.createOrder({
      orgId: before.org_id, kind: "repair", title: `Failed: ${item.text}${where}`.slice(0, 160),
      details: [item.note, `Found on ${before.title} (WO-${before.seq}).`].filter(Boolean).join(" "),
      category: before.category, priority: "high", status: "open", spaceId: before.space_id, assetId: before.asset_id,
      requestedBy: actor.id, vendorId: null
    });
    await note(ctx, before.org_id, "work_order", r.id)("created", `Raised by a failed line on WO-${before.seq}`);
    const i = next.findIndex((x) => x.id === item.id);
    if (i > -1) next[i].raised = r.id;
  }
  await ctx.repo.updateOrder(before.id, { checklist: next });
}

/* POST /api/v1/facilities/orders/:orderId/files { name, type, data } — a photo. */
export async function putFile(ctx, { orderId }) {
  const actor = requireActor(ctx);
  const o = await checked(ctx, orderId);
  const st = await standing(ctx, o);
  if (!st.work && !st.own) throw ApiError.forbidden("You can add a photo to your own requests.");
  if ((await ctx.repo.listFacilityFiles("work_order", orderId)).length >= FILE_CAP) {
    throw refuse(`An order can hold ${FILE_CAP} photos.`);
  }
  const body = await readJson(ctx.request, { limit: 1200 * 1024 });
  const f = readUpload(body);
  const fid = await ctx.repo.putFacilityFile({ orgId: o.org_id, ownerKind: "work_order", ownerId: orderId, ...f, actorId: actor.id });
  await note(ctx, o.org_id, "work_order", orderId)("photo", f.name);
  return json({ file: { id: fid, name: f.name, type: f.type, size: f.size } }, { status: 201 });
}

/* GET /api/v1/facilities/orders/:orderId/files/:fileId */
export async function getFile(ctx, { orderId, fileId }) {
  requireActor(ctx);
  const o = await checked(ctx, orderId);
  await standing(ctx, o);
  const f = await ctx.repo.getFacilityFile(fileId);
  if (!f || f.owner_kind !== "work_order" || f.owner_id !== orderId) throw ApiError.notFound("There is no such file.");
  return json({ file: { id: f.id, name: f.name, type: f.type, size: f.size, data: f.data, uploadedAt: f.uploaded_at } });
}
