/* ==========================================================================
   /api/v1/efm/*

   OploCloud's books. The app is public code; the books are not — they are the
   list of commands in the database, and they leave only here, to a signed-in
   account that has been assigned OC EFM, and are added to only here, one
   command at a time, each checked by the accounting engine (services/efm.js).

     GET  /efm/books/:bookId                the book and every command in it
     GET  /efm/books/:bookId/commands       the commands after ?after=N
     POST /efm/books/:bookId/commands       add one
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must, isPlatformAdmin } from "../core/guard.js";
import { commandOf, bookOf, headOf, accept, readRequest, accessList, nextYear, ENGINE_VERSION } from "../services/efm.js";

// Private and never stored: the same address answers differently to different
// people, and to the same person after their access changes.
const PRIVATE = { headers: { "cache-control": "private, no-store" } };

function wire(c) {
  return { seq: c.seq, type: c.type, payload: c.payload, actor: c.actor, at: c.at, prev: c.prev, hash: c.hash };
}

async function load(ctx, bookId) {
  const row = await ctx.repo.efmBook(bookId);
  if (!row) throw ApiError.notFound("There are no such books.");
  return bookOf(row);
}

/* GET /api/v1/efm/books — the sets of books there are (one per fiscal year). */
export async function books(ctx) {
  requireActor(ctx);
  await must(ctx, "efm.read");
  const rows = await ctx.repo.efmBooks();
  return json({ books: rows.map((r) => { const b = bookOf(r); return { id: b.id, name: b.name, fy: b.fy, entities: b.entities.map((e) => ({ id: e.id, name: e.name })) }; }) }, PRIVATE);
}

/* POST /api/v1/efm/books  { from: "oplo" } — opens the fiscal year after a closed one. */
export async function openYear(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "efm.admin");
  const body = await readJson(ctx.request);
  const from = String(body.from || "");
  const old = await load(ctx, from);
  const rows = await ctx.repo.efmCommands(from, 0);
  const made = nextYear(old, rows, actor);
  const won = await ctx.repo.efmCreateBook(made.book, made.config, made.first);
  if (!won) {
    const e = ApiError.conflict(`Fiscal ${made.book.fy} has already been started.`);
    e.code = "exists";
    throw e;
  }
  return json({ book: { id: made.book.id, name: made.book.name, fy: made.book.fy } }, { status: 201, ...PRIVATE });
}

/* GET /api/v1/efm/access — who has OC EFM, and how. */
export async function access(ctx) {
  requireActor(ctx);
  await must(ctx, "efm.admin");
  return json({ access: accessList(await ctx.repo.efmAccess()) }, PRIVATE);
}

/* PUT /api/v1/efm/access  { email, role: "admin" | "user" | "viewer" | null }
   Gives somebody who already has an Oplo Account OC EFM, changes how much of it
   they have, or takes it away. Never creates an account, and never leaves OC EFM
   without an administrator. */
export async function setAccess(ctx) {
  const actor = requireActor(ctx);
  await must(ctx, "efm.admin");
  const body = await readJson(ctx.request);
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.length > 254 || !email.includes("@")) throw ApiError.badRequest("Enter their email address.", "email");
  const role = body.role === null ? null : check.oneOf(body.role, "role", ["admin", "user", "viewer"]);
  const target = await ctx.repo.findAccountByEmail(email);
  if (!target) throw ApiError.notFound("Nobody has an Oplo Account with that address yet. They need to create one first.");
  const list = accessList(await ctx.repo.efmAccess());
  const others = list.filter((a) => a.role === "admin" && a.id !== target.id);
  const wasAdmin = list.some((a) => a.id === target.id && a.role === "admin");
  if (wasAdmin && role !== "admin" && !others.length && !isPlatformAdmin(actor)) {
    throw ApiError.badRequest("OC EFM has to keep at least one administrator. Make somebody else one first.", "role");
  }
  for (const r of ["admin", "user", "viewer"]) await ctx.repo.revokeRole(target.id, "efm", r, null);
  if (role) await ctx.repo.grantRole(target.id, "efm", role, null);
  return json({ access: accessList(await ctx.repo.efmAccess()) }, PRIVATE);
}

/* GET /api/v1/efm/books/:bookId */
export async function book(ctx, { bookId }) {
  requireActor(ctx);
  await must(ctx, "efm.read");
  const b = await load(ctx, bookId);
  const commands = (await ctx.repo.efmCommands(bookId, 0)).map(commandOf);
  return json({
    book: b, commands: commands.map(wire), head: headOf(b, commands), count: commands.length,
    engineVersion: ENGINE_VERSION, serverTime: new Date().toISOString()
  }, PRIVATE);
}

/* GET /api/v1/efm/books/:bookId/commands?after=N */
export async function commandsAfter(ctx, { bookId }) {
  requireActor(ctx);
  await must(ctx, "efm.read");
  const b = await load(ctx, bookId);
  const after = Math.max(0, parseInt(ctx.url.searchParams.get("after") || "0", 10) || 0);
  const commands = (await ctx.repo.efmCommands(bookId, after)).map(commandOf);
  return json({ commands: commands.map(wire), engineVersion: ENGINE_VERSION, serverTime: new Date().toISOString(), book: b.id }, PRIVATE);
}

/* POST /api/v1/efm/books/:bookId/commands */
export async function execute(ctx, { bookId }) {
  const actor = requireActor(ctx);
  await must(ctx, "efm.write");
  const request = readRequest(await readJson(ctx.request));
  const b = await load(ctx, bookId);
  if (request.key) {
    const seen = await ctx.repo.efmCommandByKey(bookId, request.key);
    if (seen) {
      if (seen.actor_id !== actor.id) throw ApiError.conflict("That request key belongs to somebody else's change.");
      return json({ command: { seq: seen.seq, at: seen.at, hash: seen.hash }, repeated: true }, { status: 200, ...PRIVATE });
    }
  }
  const rows = await ctx.repo.efmCommands(bookId, 0);

  const { seq, hash, row } = accept(b, rows, request, actor);

  // If somebody else got in between the read above and this write, their
  // command holds this place, and the books have moved.
  const won = await ctx.repo.efmAppendCommand(bookId, row);
  if (!won) {
    const e = ApiError.conflict("The books have changed since you loaded them. They have been reloaded — check, then try again.");
    e.code = "stale";
    throw e;
  }
  return json({ command: { seq, at: row.at, hash } }, { status: 201, ...PRIVATE });
}
