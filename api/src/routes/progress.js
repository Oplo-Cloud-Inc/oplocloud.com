/* ==========================================================================
   /api/v1/progress/*  and  /api/v1/gamification/*

   Progress is the student's own record, synchronised across their devices.
   Experience is reported by the client as events and priced by the server.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { priceAnswer, priceRun, localDay, streakFrom, rankFor } from "../services/progress.js";

export async function list(ctx) {
  const actor = requireActor(ctx);
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;
  await must(ctx, "progress.read", { accountId });

  // One scope by name is what a device asks for after its write was refused:
  // it needs that scope's current copy to merge with, not the whole record.
  const scope = ctx.url.searchParams.get("scope") || null;
  const rows = await ctx.repo.listProgress(accountId, scope);
  const out = {};
  for (const r of rows) {
    try { out[r.scope] = { state: JSON.parse(r.state_json), updatedAt: r.updated_at }; }
    catch { /* a torn row is skipped rather than failing the whole read */ }
  }
  return json({ progress: out });
}

/* PUT /api/v1/progress — the student's own record for one scope.

   `base` is the updatedAt this device last saw for the scope, from this
   server — never from its own clock — or 0 for "nothing stored yet". Given
   one, a write that would overwrite a change the device has not seen is
   refused with 409, and the device is expected to fetch the scope, merge, and
   write again. Merging is the client's job because only the client knows what
   each field means; refusing to lose data silently is the server's.

   Without a base the write is unconditional, as it always was. */
export async function put(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request, { limit: 256 * 1024 });
  const scope = check.string(body.scope, "scope", { max: 200 });
  if (body.state == null || typeof body.state !== "object") {
    throw ApiError.badRequest("state must be an object.", "state");
  }
  let base;
  if (body.base !== undefined && body.base !== null) {
    base = Number(body.base);
    if (!Number.isFinite(base) || base < 0) {
      throw ApiError.badRequest("base must be the updatedAt last seen, or 0.", "base");
    }
  }
  await must(ctx, "progress.write", { accountId: actor.id });

  const out = await ctx.repo.putProgress(actor.id, scope, body.state, body.courseId || null, base);
  if (out.conflict) {
    throw ApiError.conflict(
      "This progress changed on another device since this one last saw it. Fetch it, merge, and try again.",
      "base");
  }
  return json({ ok: true, scope, updatedAt: out.updatedAt });
}

/* --------------------------------------------------------------- Standing
   XP total, rank, streak and badges, all computed from the ledger. */
export async function standing(ctx) {
  const actor = requireActor(ctx);
  const accountId = ctx.url.searchParams.get("accountId") || actor.id;
  await must(ctx, "progress.read", { accountId });

  const offset = Number(ctx.url.searchParams.get("tzOffset") || 0);
  const today = localDay(Date.now(), offset);
  const since = localDay(Date.now() - 30 * 864e5, offset);

  const [total, days, byDay, badges] = await Promise.all([
    ctx.repo.xpTotal(accountId),
    ctx.repo.xpDays(accountId),
    ctx.repo.xpByDay(accountId, since),
    ctx.repo.listAchievements(accountId)
  ]);

  const streak = streakFrom(days, today);
  const todayRow = byDay.find((d) => d.day === today);

  return json({
    standing: {
      xp: total,
      today: todayRow ? Number(todayRow.total) : 0,
      rank: rankFor(total),
      streak: streak.current,
      longestStreak: streak.longest,
      days: byDay.map((d) => ({ day: d.day, xp: Number(d.total) })),
      badges: badges.map((b) => ({ key: b.key, earnedAt: b.earned_at }))
    }
  });
}

/* POST /api/v1/gamification/events

   The client reports what happened; the server decides what it was worth.
   A body saying `{ xp: 5000 }` is ignored — there is no field for it. */
export async function events(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  const list = Array.isArray(body.events) ? body.events : [body];
  if (list.length > 50) throw ApiError.badRequest("Too many events in one request.", "events");

  const offset = Number(body.tzOffset || 0);
  const day = localDay(Date.now(), offset);

  let awarded = 0;
  for (const e of list) {
    const kind = check.oneOf(e.kind, "kind", ["answer", "run"]);
    const xp = kind === "answer" ? priceAnswer(e) : priceRun(e.activity, e.stats || {});
    if (!xp) continue;
    awarded += xp;
    await ctx.repo.addXp({
      accountId: actor.id,
      source: kind === "answer" ? `learn.answer.${e.level}` : `game.${e.activity}`,
      amount: xp, day,
      meta: kind === "answer"
        ? { level: e.level, right: !!e.right, hints: e.hints || 0 }
        : { activity: e.activity }
    });
  }

  // Badges are granted server-side too, from what the ledger now says. A
  // client that awards its own badges is a client that can award all of them.
  const earned = [];
  const [total, days] = await Promise.all([
    ctx.repo.xpTotal(actor.id),
    ctx.repo.xpDays(actor.id)
  ]);
  const streak = streakFrom(days, day);
  if (streak.current >= 7 && await ctx.repo.grantAchievement(actor.id, "week")) earned.push("week");
  if (streak.current >= 30 && await ctx.repo.grantAchievement(actor.id, "month")) earned.push("month");
  for (const e of list) {
    if (e.kind === "answer" && e.right && e.level === "transfer" &&
        await ctx.repo.grantAchievement(actor.id, "transfer")) earned.push("transfer");
    if (e.kind === "answer" && e.right && Number(e.gapDays) >= 7 &&
        await ctx.repo.grantAchievement(actor.id, "held")) earned.push("held");
  }

  return json({
    awarded,
    xp: total,
    rank: rankFor(total),
    streak: streak.current,
    badges: earned
  });
}
