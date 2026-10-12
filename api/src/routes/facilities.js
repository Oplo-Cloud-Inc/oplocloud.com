/* ==========================================================================
   /api/v1/facilities — rooms, the things in them, and the numbers

   A room is where a request, a booking, a schedule and an asset all point, so
   it is the first thing a school adds and the one the rest hangs on. Rooms are
   added by range (101 to 118), because forty one-at-a-time forms is how a
   system stays empty. An asset has a code printed on it; counting a room is
   reading those codes against what the register says is there.

   Nothing here holds a cost. OEdu does not do finance.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must } from "../core/guard.js";
import * as F from "../services/facilities.js";
import { orgOf, text, day, whole, todayOf, mustBeTeam, refuse, parseJson, note } from "./facility-common.js";
import { syncSchedules } from "./upkeep.js";

const unique = (e) => /UNIQUE/i.test(String((e && e.message) || ""));

/* ----------------------------------------------------------------- Shapes */

function spaceShape(s, { counts = false } = {}) {
  const out = {
    id: s.id, parentId: s.parent_id || null, kind: s.kind, name: s.name, code: s.code || null, capacity: s.capacity ?? null,
    bookable: !!s.bookable, rules: F.normaliseRules(parseJson(s.rules_json, {})), approverId: s.approver_id || null,
    approverName: s.approver_name || null, notes: s.notes || null
  };
  if (counts) { out.assets = s.asset_count || 0; out.open = s.open_count || 0; }
  return out;
}

function assetShape(a, today) {
  return {
    id: a.id, number: a.seq, name: a.name, kind: a.kind || null, code: a.code, serial: a.serial || null,
    spaceId: a.space_id || null, spaceName: a.space_name || null, custodianId: a.custodian_id || null,
    custodianName: a.custodian_name || null, custodianLabel: a.custodian_label || null, status: a.status,
    condition: a.condition || null, installedOn: a.installed_on || null, warrantyEnd: a.warranty_end || null,
    warranty: F.expiryState(a.warranty_end, today), lifeYears: a.life_years ?? null, lastSeenOn: a.last_seen_on || null,
    notes: a.notes || null, createdAt: a.created_at, updatedAt: a.updated_at
  };
}

const eventShape = (e) => ({ id: e.id, at: e.at, by: e.actor_id, byName: e.actor_name, kind: e.kind, note: e.note });

async function canWhat(ctx, orgId) {
  const [request, read, work, manage, decide] = await Promise.all(
    ["facility.request", "facility.read", "facility.work", "facility.manage", "facility.decide"].map((a) => can(ctx, a, { orgId })));
  return { request, read, work, manage, decide };
}

/* ------------------------------------------------------------------ Team */

/* GET /api/v1/facilities/team — who can be given work, and who can approve. */
export async function team(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.read", { orgId });
  const rows = await ctx.repo.listFacilityTeam(orgId);
  return json({ team: rows.map((r) => ({ id: r.id, name: r.name || r.email, title: r.title || null,
                                         roles: String(r.roles || "").split(",").filter(Boolean) })) });
}

/* --------------------------------------------------------------- Summary */

/* GET /api/v1/facilities/summary — the numbers the console shows first, and
   what this person may do. Reading it writes any order a schedule owes. */
export async function summary(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const today = todayOf(ctx);
  const allowed = await canWhat(ctx, orgId);
  if (!allowed.read) {
    const mine = await ctx.repo.listOrders({ orgId, requestedBy: actor.id, limit: 200 });
    return json({ today, can: allowed, mine: {
      open: mine.filter((o) => F.UNFINISHED.includes(o.status)).length, pending: mine.filter((o) => o.status === "pending").length,
      done: mine.filter((o) => o.status === "done").length } });
  }
  const made = await syncSchedules(ctx, orgId, today);
  const [c, d, pending, schedules] = await Promise.all([
    ctx.repo.orderCounts(orgId, today, actor.id),
    ctx.repo.facilityDocumentCounts(orgId, today, F.addDays(today, 30)),
    ctx.repo.listBookings({ orgId, statuses: ["pending"], from: today, limit: 500 }),
    ctx.repo.listSchedules(orgId)
  ]);
  return json({
    today, can: allowed, generated: made,
    orders: { pending: c.pending || 0, open: c.open || 0, inProgress: c.in_progress || 0, onHold: c.on_hold || 0,
              overdue: c.overdue || 0, mine: c.mine || 0, unassigned: c.unassigned || 0 },
    documents: { expired: d.expired || 0, soon: d.soon || 0 },
    bookings: { pending: pending.length },
    schedules: { active: schedules.filter((s) => s.active).length,
                 dueSoon: schedules.filter((s) => s.active && s.next_due_on && s.next_due_on <= F.addDays(today, 14)).length }
  });
}

/* ---------------------------------------------------------------- Spaces */

/* GET /api/v1/facilities/spaces — the whole tree, flat. Anyone on the staff
   may read it: it is how a request names a room. */
export async function listSpaces(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const wide = await can(ctx, "facility.read", { orgId });
  const rows = await ctx.repo.listSpaces(orgId);
  return json({ spaces: rows.map((s) => spaceShape(s, { counts: wide })) });
}

async function parentOf(ctx, orgId, parentId) {
  if (!parentId) return null;
  const p = await ctx.repo.findSpace(check.string(parentId, "parentId", { max: 64 }));
  if (!p || p.org_id !== orgId || p.archived) throw ApiError.notFound("No such place to put it in.");
  return p;
}

async function approverOf(ctx, orgId, id) {
  if (!id) return null;
  const who = check.string(id, "approverId", { max: 64 });
  await mustBeTeam(ctx, orgId, who, "approverId");
  return who;
}

function rulesOf(raw) {
  try { return F.normaliseRules(raw, { strict: true }); } catch (e) { throw ApiError.badRequest(e.message, "rules"); }
}

/* POST /api/v1/facilities/spaces — one room, or a run of them:
   { range: { prefix: "Room ", from: 101, to: 118 }, parentId, kind, … } */
export async function createSpace(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.manage", { orgId });
  const body = await readJson(ctx.request);
  const kind = check.oneOf(body.kind || "room", "kind", F.SPACE_KINDS);
  const parent = await parentOf(ctx, orgId, body.parentId);
  const common = {
    orgId, kind, parentId: parent ? parent.id : null, capacity: whole(body.capacity, "capacity", { min: 0, max: 100000 }),
    bookable: body.bookable === true, rules: body.rules !== undefined ? rulesOf(body.rules) : null,
    approverId: await approverOf(ctx, orgId, body.approverId), notes: text(body.notes, "notes", 1000)
  };
  let rows;
  if (body.range) {
    let names;
    try { names = F.expandRange({ prefix: String(body.range.prefix || ""), from: body.range.from, to: body.range.to, suffix: String(body.range.suffix || "") }); }
    catch (e) { throw ApiError.badRequest(e.message, "range"); }
    rows = names.map((name) => ({ ...common, name, code: body.range.codes === false ? null : name.replace(/^\D+/, "") || null }));
  } else {
    rows = [{ ...common, name: text(body.name, "name", 120, true), code: text(body.code, "code", 40) }];
  }
  let ids;
  try { ids = await ctx.repo.createSpaces(rows); }
  catch (e) {
    if (unique(e)) throw refuse("A room with one of those numbers already exists. Change the number or leave it blank.");
    throw e;
  }
  const made = await Promise.all(ids.map((i) => ctx.repo.findSpace(i)));
  await note(ctx, orgId, "space", ids[0])("created", rows.length > 1 ? `${rows.length} rooms added, ${rows[0].name} to ${rows[rows.length - 1].name}` : rows[0].name);
  return json({ spaces: made.map((s) => spaceShape(s)) }, { status: 201 });
}

/* PATCH /api/v1/facilities/spaces/:spaceId */
export async function updateSpace(ctx, { spaceId }) {
  const actor = requireActor(ctx);
  const s0 = await ctx.repo.findSpace(spaceId);
  if (!s0) throw ApiError.notFound("No such room.");
  await must(ctx, "facility.manage", { orgId: s0.org_id });
  const body = await readJson(ctx.request);
  const patch = {};
  const changed = [];
  const set = (k, v) => { if (v !== undefined) { patch[k] = v; changed.push(k); } };
  if (body.name !== undefined) set("name", text(body.name, "name", 120, true));
  if (body.code !== undefined) set("code", text(body.code, "code", 40));
  if (body.kind !== undefined) set("kind", check.oneOf(body.kind, "kind", F.SPACE_KINDS));
  if (body.capacity !== undefined) set("capacity", whole(body.capacity, "capacity", { min: 0, max: 100000 }));
  if (body.bookable !== undefined) set("bookable", body.bookable === true);
  if (body.rules !== undefined) set("rules", rulesOf(body.rules));
  if (body.notes !== undefined) set("notes", text(body.notes, "notes", 1000));
  if (body.approverId !== undefined) set("approverId", await approverOf(ctx, s0.org_id, body.approverId));
  if (body.parentId !== undefined) {
    const p = await parentOf(ctx, s0.org_id, body.parentId);
    if (p && p.id === spaceId) throw ApiError.badRequest("A place cannot be inside itself.", "parentId");
    set("parentId", p ? p.id : null);
  }
  if (body.archived === true) {
    const kids = (await ctx.repo.listSpaces(s0.org_id)).filter((x) => x.parent_id === spaceId);
    if (kids.length) throw refuse("Move or archive what is inside it first.");
    set("archived", true);
  }
  if (!changed.length) return json({ space: spaceShape(s0) });
  let u;
  try { u = await ctx.repo.updateSpace(spaceId, patch); }
  catch (e) { if (unique(e)) throw refuse("Another room already has that number."); throw e; }
  await note(ctx, s0.org_id, "space", spaceId)("updated", changed.join(", "));
  return json({ space: spaceShape(u) });
}

/* PUT /api/v1/facilities/spaces/rules { ids, rules?, bookable?, approverId? } — the same rules on many rooms. */
export async function bulkRules(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.manage", { orgId });
  const body = await readJson(ctx.request);
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((x) => typeof x === "string"))].slice(0, 200) : [];
  if (!ids.length) throw ApiError.badRequest("Choose at least one room.", "ids");
  const patch = {};
  if (body.rules !== undefined) patch.rules = rulesOf(body.rules);
  if (body.bookable !== undefined) patch.bookable = body.bookable === true;
  if (body.approverId !== undefined) patch.approverId = await approverOf(ctx, orgId, body.approverId);
  if (!Object.keys(patch).length) throw ApiError.badRequest("Nothing to change.");
  const done = [];
  for (const sid of ids) {
    const s = await ctx.repo.findSpace(sid);
    if (!s || s.org_id !== orgId) continue;
    await ctx.repo.updateSpace(sid, patch);
    done.push(sid);
  }
  if (done.length) await note(ctx, orgId, "space", done[0])("updated", `${Object.keys(patch).join(", ")} on ${done.length} rooms`);
  return json({ changed: done.length });
}

/* GET /api/v1/facilities/spaces/:spaceId — a room with what is in it and what is open there. */
export async function getSpace(ctx, { spaceId }) {
  const actor = requireActor(ctx);
  const s = await ctx.repo.findSpace(spaceId);
  if (!s) throw ApiError.notFound("No such room.");
  await must(ctx, "facility.read", { orgId: s.org_id });
  const today = todayOf(ctx);
  const [assets, open, docs, bookings, events] = await Promise.all([
    ctx.repo.listAssets({ orgId: s.org_id, spaceId }),
    ctx.repo.listOpenBrief(s.org_id, spaceId),
    ctx.repo.listFacilityDocuments({ orgId: s.org_id, ownerKind: "space", ownerId: spaceId }),
    ctx.repo.listBookings({ orgId: s.org_id, spaceId, from: today, to: F.addDays(today, 30), statuses: ["pending", "approved"], limit: 50 }),
    ctx.repo.listFacilityEvents("space", spaceId)
  ]);
  return json({
    space: spaceShape(s),
    assets: assets.map((a) => assetShape(a, today)),
    open: open.map((r) => ({ id: r.id, number: r.seq, title: r.title, status: r.status, category: r.category })),
    documents: docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, expiresOn: d.expires_on, state: F.expiryState(d.expires_on, today), url: d.url || null })),
    bookings: bookings.map((b) => ({ id: b.id, day: b.day, starts: b.starts, ends: b.ends, title: b.title, status: b.status, bookerName: b.booker_name })),
    events: events.slice(0, 30).map(eventShape)
  });
}

/* POST /api/v1/facilities/spaces/:spaceId/count { codes, apply, today }
   Reading a room's codes against the register. `apply` records the count and
   moves what was found in the wrong room to this one. */
export async function countSpace(ctx, { spaceId }) {
  const actor = requireActor(ctx);
  const s = await ctx.repo.findSpace(spaceId);
  if (!s) throw ApiError.notFound("No such room.");
  await must(ctx, "facility.work", { orgId: s.org_id });
  const body = await readJson(ctx.request);
  const today = todayOf(ctx, body.today);
  const seen = [...new Set((Array.isArray(body.codes) ? body.codes : []).map((c) => String(c).trim()).filter((c) => c && c.length <= 64))].slice(0, 500);
  const inRoom = (await ctx.repo.listAssets({ orgId: s.org_id, spaceId })).filter((a) => !["retired", "lost"].includes(a.status));
  const known = new Map((await ctx.repo.assetsByCodes(s.org_id, seen)).filter((a) => a.space_id !== spaceId).map((a) => [a.code, a]));
  const r = F.reconcile(inRoom, seen, known);
  const brief = (a) => ({ id: a.id, name: a.name, code: a.code, spaceName: a.space_name || null });
  if (body.apply === true) {
    for (const a of r.found) await ctx.repo.updateAsset(a.id, { lastSeenOn: today });
    for (const a of r.elsewhere) {
      await ctx.repo.updateAsset(a.id, { spaceId, lastSeenOn: today });
      await note(ctx, s.org_id, "asset", a.id)("moved", `Found in ${s.name}; the register said ${a.space_name || "nowhere"}`);
    }
    await note(ctx, s.org_id, "space", spaceId)("counted", `${r.found.length} found, ${r.missing.length} missing, ${r.elsewhere.length} moved in, ${r.unknown.length} unknown`);
  }
  return json({ applied: body.apply === true, found: r.found.map(brief), missing: r.missing.map(brief),
                elsewhere: r.elsewhere.map(brief), unknown: r.unknown });
}

/* ---------------------------------------------------------------- Assets */

/* GET /api/v1/facilities/assets?spaceId&status&q&mine */
export async function listAssets(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const q = ctx.url.searchParams;
  const today = todayOf(ctx);
  const wide = await can(ctx, "facility.read", { orgId });
  // Somebody who is not on the team may see what is in their own keeping.
  const rows = await ctx.repo.listAssets({
    orgId, spaceId: wide ? q.get("spaceId") : null, status: wide ? q.get("status") : null,
    custodianId: wide && q.get("mine") !== "1" ? null : actor.id
  });
  const term = String(q.get("q") || "").trim().toLowerCase();
  const out = term ? rows.filter((a) => [a.name, a.kind, a.code, a.serial, a.space_name, a.custodian_name, a.custodian_label].join(" ").toLowerCase().includes(term)) : rows;
  return json({ assets: out.map((a) => assetShape(a, today)), wide });
}

async function assetRefs(ctx, orgId, body, patch, set) {
  if (body.spaceId !== undefined) {
    if (body.spaceId) {
      const sp = await ctx.repo.findSpace(check.string(body.spaceId, "spaceId", { max: 64 }));
      if (!sp || sp.org_id !== orgId || sp.archived) throw ApiError.notFound("No such room.");
      set("spaceId", sp.id);
    } else set("spaceId", null);
  }
  if (body.custodianId !== undefined) {
    if (body.custodianId) {
      const who = await ctx.repo.findAccountById(check.string(body.custodianId, "custodianId", { max: 64 }));
      if (!who) throw ApiError.notFound("No such person.");
      set("custodianId", who.id);
    } else set("custodianId", null);
  }
}

/* POST /api/v1/facilities/assets */
export async function createAsset(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.work", { orgId });
  const body = await readJson(ctx.request);
  const patch = {};
  await assetRefs(ctx, orgId, body, patch, (k, v) => { patch[k] = v; });
  const row = {
    orgId, name: text(body.name, "name", 160, true), kind: text(body.kind, "kind", 80), code: text(body.code, "code", 64),
    serial: text(body.serial, "serial", 80), custodianLabel: text(body.custodianLabel, "custodianLabel", 120),
    status: check.oneOf(body.status || "in_service", "status", F.ASSET_STATUSES),
    condition: body.condition ? check.oneOf(body.condition, "condition", ["good", "fair", "poor"]) : null,
    installedOn: day(body.installedOn, "installedOn"), warrantyEnd: day(body.warrantyEnd, "warrantyEnd"),
    lifeYears: whole(body.lifeYears, "lifeYears", { min: 0, max: 200 }), notes: text(body.notes, "notes", 1000), ...patch
  };
  let a;
  try { a = await ctx.repo.createAsset(row); }
  catch (e) { if (unique(e)) throw refuse("Another asset already has that code."); throw e; }
  await note(ctx, orgId, "asset", a.id)("created", a.name);
  return json({ asset: assetShape(a, todayOf(ctx, body.today)) }, { status: 201 });
}

/* GET /api/v1/facilities/assets/:assetId */
export async function getAsset(ctx, { assetId }) {
  const actor = requireActor(ctx);
  const a = await ctx.repo.findAsset(assetId);
  if (!a) throw ApiError.notFound("No such asset.");
  const wide = await can(ctx, "facility.read", { orgId: a.org_id });
  if (!wide && a.custodian_id !== actor.id) throw ApiError.notFound("No such asset.");
  const today = todayOf(ctx);
  const [events, orders, docs] = await Promise.all([
    ctx.repo.listFacilityEvents("asset", assetId),
    wide ? ctx.repo.listOrders({ orgId: a.org_id, assetId, limit: 30 }) : Promise.resolve([]),
    wide ? ctx.repo.listFacilityDocuments({ orgId: a.org_id, ownerKind: "asset", ownerId: assetId }) : Promise.resolve([])
  ]);
  return json({
    asset: assetShape(a, today), events: events.map(eventShape),
    orders: orders.map((o) => ({ id: o.id, number: o.seq, title: o.title, status: o.status, dueOn: o.due_on, completedAt: o.completed_at })),
    documents: docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, expiresOn: d.expires_on, state: F.expiryState(d.expires_on, today), url: d.url || null }))
  });
}

/* PATCH /api/v1/facilities/assets/:assetId */
export async function updateAsset(ctx, { assetId }) {
  const actor = requireActor(ctx);
  const a0 = await ctx.repo.findAsset(assetId);
  if (!a0) throw ApiError.notFound("No such asset.");
  await must(ctx, "facility.work", { orgId: a0.org_id });
  const body = await readJson(ctx.request);
  const patch = {};
  const changed = [];
  const set = (k, v) => { if (v !== undefined) { patch[k] = v; changed.push(k); } };
  if (body.name !== undefined) set("name", text(body.name, "name", 160, true));
  if (body.kind !== undefined) set("kind", text(body.kind, "kind", 80));
  if (body.code !== undefined) set("code", text(body.code, "code", 64, true));
  if (body.serial !== undefined) set("serial", text(body.serial, "serial", 80));
  if (body.custodianLabel !== undefined) set("custodianLabel", text(body.custodianLabel, "custodianLabel", 120));
  if (body.status !== undefined) set("status", check.oneOf(body.status, "status", F.ASSET_STATUSES));
  if (body.condition !== undefined) set("condition", body.condition ? check.oneOf(body.condition, "condition", ["good", "fair", "poor"]) : null);
  if (body.installedOn !== undefined) set("installedOn", day(body.installedOn, "installedOn"));
  if (body.warrantyEnd !== undefined) set("warrantyEnd", day(body.warrantyEnd, "warrantyEnd"));
  if (body.lifeYears !== undefined) set("lifeYears", whole(body.lifeYears, "lifeYears", { min: 0, max: 200 }));
  if (body.notes !== undefined) set("notes", text(body.notes, "notes", 1000));
  await assetRefs(ctx, a0.org_id, body, patch, set);
  if (!changed.length) return json({ asset: assetShape(a0, todayOf(ctx)) });
  let u;
  try { u = await ctx.repo.updateAsset(assetId, patch); }
  catch (e) { if (unique(e)) throw refuse("Another asset already has that code."); throw e; }
  const log = note(ctx, a0.org_id, "asset", assetId);
  if (patch.spaceId !== undefined && patch.spaceId !== a0.space_id) await log("moved", `${a0.space_name || "nowhere"} → ${u.space_name || "nowhere"}`);
  if ((patch.custodianId !== undefined && patch.custodianId !== a0.custodian_id) || (patch.custodianLabel !== undefined && patch.custodianLabel !== a0.custodian_label)) {
    await log("custody", `${a0.custodian_name || a0.custodian_label || "nobody"} → ${u.custodian_name || u.custodian_label || "nobody"}`);
  }
  if (patch.status && patch.status !== a0.status) await log("status", `${a0.status} → ${patch.status}`);
  if (changed.some((k) => !["spaceId", "custodianId", "custodianLabel", "status"].includes(k))) {
    await log("updated", changed.filter((k) => !["spaceId", "custodianId", "custodianLabel", "status"].includes(k)).join(", "));
  }
  return json({ asset: assetShape(u, todayOf(ctx, body.today)) });
}

/* --------------------------------------------------------------- Reports */

/* GET /api/v1/facilities/reports?from&to&today */
export async function reports(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.read", { orgId });
  const q = ctx.url.searchParams;
  const today = todayOf(ctx);
  const to = F.isDate(q.get("to") || "") ? q.get("to") : today;
  const from = F.isDate(q.get("from") || "") ? q.get("from") : F.addDays(to, -29);
  if (from > to) throw ApiError.badRequest("The report starts after it ends.", "from");
  if (F.daysBetween(from, to) > 800) throw ApiError.badRequest("A report covers at most two years.", "from");
  const rows = await ctx.repo.ordersForReport(orgId, Date.parse(from + "T00:00:00Z"));
  return json({ report: F.buildReport(rows, { from, to, today }) });
}
