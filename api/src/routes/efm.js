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

import { json, readJson, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { must } from "../core/guard.js";
import { commandOf, bookOf, headOf, accept, readRequest, ENGINE_VERSION } from "../services/efm.js";

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
