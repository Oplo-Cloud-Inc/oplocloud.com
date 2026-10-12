/* ==========================================================================
   /api/v1/facilities/bookings — holding a room

   A room carries its own rules: hours, days, how far ahead, how much notice,
   how long, what has to be left between one hold and the next. A request is
   checked against them before it is made, and every reason it fails is said,
   so the answer to "why can't I" is on the screen and not in an email.

   A room can name one person who approves. Somebody who may decide is
   approved at once — the office booking its own hall does not wait for itself.
   A weekly series is decided as one; a clash on one date does not sink the
   rest unless the person asked it to.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { can, must } from "../core/guard.js";
import * as F from "../services/facilities.js";
import { orgOf, text, day, time, whole, nowOf, todayOf, refuse, parseJson, note } from "./facility-common.js";

function shape(b, viewerId) {
  return {
    id: b.id, spaceId: b.space_id, spaceName: b.space_name, title: b.title, notes: b.notes || null, attendees: b.attendees ?? null,
    day: b.day, starts: b.starts, ends: b.ends, status: b.status, seriesId: b.series_id || null,
    bookedBy: b.booked_by || null, bookerName: b.booker_name || null, mine: b.booked_by === viewerId,
    decidedBy: b.decided_by || null, deciderName: b.decider_name || null, decidedAt: b.decided_at || null,
    decisionNote: b.decision_note || null, approverId: b.space_approver || null
  };
}

/* GET /api/v1/facilities/bookings?from&to&spaceId&mine=1&status= */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const q = ctx.url.searchParams;
  const today = todayOf(ctx);
  const mine = q.get("mine") === "1";
  const wanted = String(q.get("status") || "").split(",").filter((x) => ["pending", "approved", "declined", "cancelled"].includes(x));
  const rows = await ctx.repo.listBookings({
    orgId, spaceId: q.get("spaceId") || null, bookedBy: mine ? actor.id : null,
    from: F.isDate(q.get("from") || "") ? q.get("from") : (mine ? null : today),
    to: F.isDate(q.get("to") || "") ? q.get("to") : null,
    // The calendar shows what is held; a person's own list shows everything of theirs.
    statuses: wanted.length ? wanted : (mine ? null : ["pending", "approved"])
  });
  const decider = await can(ctx, "facility.decide", { orgId });
  return json({ bookings: rows.map((b) => shape(b, actor.id)), today, canDecide: decider });
}

/* POST /api/v1/facilities/bookings
   { spaceId, title, day, starts, ends, attendees?, notes?, repeat?, count?, until?, skipConflicts?, nowAt? } */
export async function create(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  await must(ctx, "facility.request", { orgId });
  const body = await readJson(ctx.request);
  const space = await ctx.repo.findSpace(check.string(body.spaceId, "spaceId", { max: 64 }));
  if (!space || space.org_id !== orgId || space.archived) throw ApiError.notFound("No such room.");
  if (!space.bookable) throw refuse(`${space.name} is not set up to be held. Ask the office to make it bookable.`);
  const rules = F.normaliseRules(parseJson(space.rules_json, {}));
  const base = {
    title: text(body.title, "title", 160, true), notes: text(body.notes, "notes", 1000),
    attendees: whole(body.attendees, "attendees", { min: 1, max: 100000 }),
    starts: time(body.starts, "starts", true), ends: time(body.ends, "ends", true)
  };
  const first = day(body.day, "day", true);
  const repeat = check.oneOf(body.repeat || "none", "repeat", ["none", "daily", "weekly", "biweekly"]);
  const days = F.expandSeries({ day: first, repeat, count: body.count ?? 1, until: body.until }, rules);
  if (!days.length) throw ApiError.badRequest("There are no days to hold.", "day");
  const now = nowOf(ctx, body.nowAt);

  const held = await ctx.repo.bookingsOnDays(space.id, days);
  const unavailable = [];
  const free = [];
  for (const d of days) {
    const b = { day: d, starts: base.starts, ends: base.ends, attendees: base.attendees };
    const problems = F.bookingProblems(rules, b, now, { capacity: space.capacity });
    const clashes = held.filter((h) => F.clash(h, b, rules.bufferMinutes));
    if (clashes.length) problems.push(`${space.name} is already held ${clashes[0].starts}–${clashes[0].ends}${clashes[0].status === "pending" ? " (waiting for approval)" : ""}.`);
    (problems.length ? unavailable : free).push(problems.length ? { day: d, problems } : d);
  }
  if (unavailable.length && (!free.length || body.skipConflicts !== true)) {
    throw refuse(unavailable.length === 1 && days.length === 1 ? unavailable[0].problems[0] : "Some of those days cannot be held.", { unavailable, free });
  }

  const decider = await can(ctx, "facility.decide", { orgId, approverId: space.approver_id });
  const approved = !space.approver_id || decider;
  const seriesId = free.length > 1 ? "ser_" + crypto.randomUUID().slice(0, 12) : null;
  const ids = await ctx.repo.createBookings(free.map((d) => ({
    orgId, spaceId: space.id, ...base, day: d, status: approved ? "approved" : "pending", seriesId, bookedBy: actor.id,
    decidedBy: approved ? actor.id : null, decidedAt: approved ? Date.now() : null,
    decisionNote: approved ? (space.approver_id ? "Approved as it was made" : "No approval needed") : null
  })));
  await note(ctx, orgId, "booking", ids[0])("created", `${space.name}: ${base.title}${free.length > 1 ? ` (${free.length} dates)` : ""}`);
  const made = await Promise.all(ids.map((i) => ctx.repo.findBooking(i)));
  return json({ bookings: made.map((b) => shape(b, actor.id)), skipped: unavailable, approved }, { status: 201 });
}

/* POST /api/v1/facilities/bookings/:bookingId/actions/:action — approve, decline, cancel.
   A decision applies to the whole series unless `series: false`. */
export async function act(ctx, { bookingId, action }) {
  const actor = requireActor(ctx);
  const b = await ctx.repo.findBooking(bookingId);
  if (!b) throw ApiError.notFound("No such booking.");
  const orgId = b.org_id;
  const body = await readJson(ctx.request);
  const whole2 = body.series !== false && !!b.series_id;
  const group = whole2 ? await ctx.repo.listBookings({ orgId, seriesId: b.series_id }) : [b];
  const today = todayOf(ctx, body.today);
  const log = note(ctx, orgId, "booking", bookingId);

  if (action === "cancel") {
    const own = b.booked_by === actor.id;
    if (!own) await must(ctx, "facility.decide", { orgId, approverId: b.space_approver });
    const ids = group.filter((x) => ["pending", "approved"].includes(x.status) && x.day >= today).map((x) => x.id);
    if (!ids.length) throw refuse("There is nothing left in that booking to cancel.");
    await ctx.repo.decideBookings(ids, { status: "cancelled", decidedBy: actor.id, note: text(body.note, "note", 400) });
    await log("decided", `Cancelled${ids.length > 1 ? ` (${ids.length} dates)` : ""}`);
  } else if (action === "approve" || action === "decline") {
    await must(ctx, "facility.decide", { orgId, approverId: b.space_approver });
    const ids = group.filter((x) => x.status === "pending").map((x) => x.id);
    if (!ids.length) throw refuse("That booking is not waiting for a decision.");
    const words = action === "decline" ? text(body.note, "note", 400, true) : text(body.note, "note", 400);
    if (action === "approve") {
      // Somebody else may have been approved for the same time while this waited.
      const rules = F.normaliseRules(parseJson((await ctx.repo.findSpace(b.space_id)).rules_json, {}));
      const held = (await ctx.repo.bookingsOnDays(b.space_id, [...new Set(group.map((x) => x.day))])).filter((h) => h.status === "approved");
      const bad = group.filter((x) => ids.includes(x.id)).find((x) => held.some((h) => h.id !== x.id && F.clash(h, x, rules.bufferMinutes)));
      if (bad) throw refuse(`${bad.space_name} was approved for someone else on ${bad.day} at that time. Decline this one or ask them to move.`);
    }
    await ctx.repo.decideBookings(ids, { status: action === "approve" ? "approved" : "declined", decidedBy: actor.id, note: words });
    await log("decided", `${action === "approve" ? "Approved" : "Declined"}${ids.length > 1 ? ` (${ids.length} dates)` : ""}${words ? ": " + words : ""}`);
  } else {
    throw ApiError.notFound(`There is no "${action}" step.`);
  }
  const done = await Promise.all(group.map((g) => ctx.repo.findBooking(g.id)));
  return json({ bookings: done.map((x) => shape(x, actor.id)) });
}
