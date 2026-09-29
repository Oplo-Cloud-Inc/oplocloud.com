/* ==========================================================================
   OploCloud's books, on the server.

   The books are a list of commands (see migrations/0012_efm_books.sql). This
   file is what turns that list into books and decides whether one more
   command may be added to it. It does that by running the accounting engine —
   the same files the browser runs, imported here rather than copied — so the
   server refuses exactly what the engine refuses, and a browser can never
   talk the server into a posting the rules forbid.

   A command is accepted only if all of these hold, checked in this order:
     1. the browser was looking at the current books (`expectSeq` is the
        number of commands there are), or it is told they have moved;
     2. the stored list still passes its own hash chain — nothing is added on
        top of a history that has been tampered with;
     3. the browser's clock is close to ours, so the time written into the
        audit trail means something;
     4. the list replays without a hitch, and the new command runs on the
        result under the engine's rules, as the signed-in account.
   Only then is it appended, chained to the one before it.
   ========================================================================== */

import "../../../efm/js/engine.js";
import "../../../efm/js/books.js";
import { ApiError } from "../lib/http.js";

const EFM = globalThis.EFM;
export const ENGINE_VERSION = EFM.ENGINE_VERSION;

/* What a browser may ask for. Importing charges and adding vendors are
   administrators' acts done out of band (scripts/efm-import-card-charges.mjs),
   so they are not on this list. */
export const CLIENT_COMMANDS = [
  "journal.create", "journal.submit", "journal.discard", "journal.approve", "journal.reject", "journal.reverse",
  "ap.approve", "ap.hold", "ap.release", "ap.reject", "ap.clearFlag", "ap.schedule", "ap.payRun", "vendor.verifyBank",
  "ar.apply", "ar.remind",
  "bank.match", "bank.autoMatch", "bank.create", "bank.unmatch",
  "asset.depreciate", "close.run", "close.reopen", "period.set", "budget.decide", "anomaly.resolve", "ic.book"
];

const CLOCK_TOLERANCE_MS = 10 * 60 * 1000;
const MAX_PAYLOAD_CHARS = 32 * 1024;

/* A stored row, as the engine and the browser know a command. */
export function commandOf(row) {
  return {
    seq: row.seq, type: row.type, payload: JSON.parse(row.payload),
    actor: { id: row.actor_id, name: row.actor_name, role: row.actor_role },
    at: row.at, prev: row.prev_hash, hash: row.hash
  };
}

export function bookOf(row) {
  const cfg = JSON.parse(row.config);
  return { id: row.id, name: row.name, fy: cfg.fy, entities: cfg.entities };
}

export function todayNY(now = new Date()) {
  return EFM.Engine.prototype.nyDate(now.toISOString());
}

/* The books, from the commands. */
export function build(book, commands) {
  const today = todayNY();
  const E = EFM.createBooks({ id: book.id, name: book.name, fy: book.fy, entities: book.entities, today });
  const failed = EFM.replayCommands(E, commands, today);
  return { E, failed };
}

export function headOf(book, commands) {
  return commands.length ? commands[commands.length - 1].hash : EFM.genesis(book.id);
}

function refusal(e) {
  const err = new ApiError(422, "refused", e.message);
  err.extra = { rule: e.rule || "", why: e.code || "" };
  return err;
}

/* Decides whether `request` may be added to the books, and if so returns the
   row to append. Throws an ApiError saying why not; changes nothing either way. */
export function accept(book, rows, request, account, now = Date.now()) {
  const commands = rows.map(commandOf);

  if (request.expectSeq !== commands.length) {
    const e = ApiError.conflict("The books have changed since you loaded them. They have been reloaded — check, then try again.");
    e.code = "stale";
    e.extra = { head: commands.length };
    throw e;
  }

  const chain = EFM.verifyCommands(book.id, commands);
  if (!chain.ok) {
    console.error(`efm: chain broken in ${book.id} at command ${chain.at}: ${chain.why}`);
    throw new ApiError(500, "integrity", `The stored history fails its integrity check at command ${chain.at}, so nothing was added. This needs an administrator.`);
  }

  const at = new Date(request.at);
  if (isNaN(at) || Math.abs(at.getTime() - now) > CLOCK_TOLERANCE_MS) {
    const e = ApiError.conflict("Your device's clock is more than ten minutes away from ours, so the time on this entry would be wrong. Fix the clock and try again.");
    e.code = "clock";
    e.extra = { serverTime: new Date(now).toISOString() };
    throw e;
  }
  const atIso = at.toISOString();

  const { E, failed } = build(book, commands);
  if (failed.length) {
    console.error(`efm: ${book.id} no longer replays: ${JSON.stringify(failed[0])}`);
    throw new ApiError(500, "replay", `The stored history no longer replays (command ${failed[0].seq}), so nothing was added. This needs an administrator.`);
  }

  // The engine gets its own copy; what is stored is what was asked for.
  const payload = JSON.parse(JSON.stringify(request.payload));
  delete payload.simulated;          // a real approval is a real person's
  const actor = { id: account.id, name: account.name || account.email || account.id, role: "member" };
  try {
    E.exec(request.type, JSON.parse(JSON.stringify(payload)), actor, { at: atIso });
  } catch (e) {
    if (e instanceof EFM.Refusal) throw refusal(e);
    console.error(`efm: ${request.type} threw ${e && e.stack || e}`);
    throw ApiError.badRequest("That command could not be understood.", "payload");
  }

  const seq = commands.length + 1;
  const prev = headOf(book, commands);
  const row = { seq, type: request.type, payload, actor, at: atIso };
  const hash = EFM.commandHash(prev, row);
  return {
    seq, hash,
    row: { seq, type: request.type, payload: JSON.stringify(payload), actorId: actor.id, actorName: actor.name, actorRole: actor.role, at: atIso, prev, hash }
  };
}

/* Checks the shape of a request before it is looked at any further. */
export function readRequest(body) {
  const b = body || {};
  if (typeof b.type !== "string" || !CLIENT_COMMANDS.includes(b.type)) {
    throw ApiError.badRequest("That is not something the books accept.", "type");
  }
  if (!b.payload || typeof b.payload !== "object" || Array.isArray(b.payload)) {
    throw ApiError.badRequest("A command carries its details as an object.", "payload");
  }
  if (JSON.stringify(b.payload).length > MAX_PAYLOAD_CHARS) throw ApiError.badRequest("That command is too large.", "payload");
  if (!Number.isInteger(b.expectSeq) || b.expectSeq < 0) throw ApiError.badRequest("Say how many commands you have seen.", "expectSeq");
  if (typeof b.at !== "string") throw ApiError.badRequest("Say when it was done.", "at");
  return { type: b.type, payload: b.payload, expectSeq: b.expectSeq, at: b.at };
}
