#!/usr/bin/env node
// ===========================================================================
// Puts charges on OploCloud's company card into the books.
//
//   node scripts/efm-import-card-charges.mjs <export.json> [--remote]
//
// <export.json> is { vendor: { id, name }, source, invoices: [[date, due|null,
// cents, "paid"|"refunded"], …] } — a vendor's billing history, newest first,
// as it is pasted. It is never kept in the repository (the repository is
// public); the charges live in the books, as commands, from the moment they
// are imported.
//
// It is safe to run again with a fresh export. It replays what the books
// already hold, and adds only what is new — the vendor if it is missing, and
// each charge the books don't yet have, told apart by date and amount. Every
// new command is run through the accounting engine BEFORE anything is
// written, so an export the engine would refuse writes nothing; and what was
// written is read back and its hash chain verified.
//
// Local by default (a local database is a safe place to try it); --remote is
// production. A charge that is already in the books but whose status differs
// (paid now refunded) is reported, not changed: changing history is done with
// a reversal, by a person, not by an import.
// ===========================================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
globalThis.EFM = {};
require("../../efm/js/engine.js");
require("../../efm/js/books.js");
const EFM = globalThis.EFM;

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: efm-import-card-charges.mjs <export.json> [--remote]"); process.exit(2); }

const BOOK = { id: "oplo", name: "OploCloud", fy: "2026",
  entities: [{ id: "US", name: "OploCloud, Inc.", short: "US", country: "United States", currency: "USD" }] };
const DB = "oplo-platform-db";
const where = remote ? "--remote" : "--local";
const api = join(here, "..");

function d1(sql, { file: f } = {}) {
  const a = ["wrangler", "d1", "execute", DB, where, "--json", ...(f ? ["--file", f] : ["--command", sql])];
  const out = execFileSync("npx", a, { cwd: api, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  const i = out.indexOf("[");
  return i >= 0 ? JSON.parse(out.slice(i)) : [];
}
const rows = (r) => (r && r[0] && r[0].results) || [];
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

// ---- the export
const data = JSON.parse(readFileSync(file, "utf8"));
if (!data.vendor || !data.vendor.id || !Array.isArray(data.invoices)) { console.error("That doesn't look like an export: it needs vendor and invoices."); process.exit(2); }
for (const r of data.invoices) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r[0]) || !Number.isInteger(r[2]) || r[2] < 0 || !["paid", "refunded"].includes(r[3])) { console.error("A row is not [date, due, cents, status]:", JSON.stringify(r)); process.exit(2); }
}

// ---- the book, and what it already holds
const bookRow = rows(d1(`SELECT id FROM efm_books WHERE id = ${q(BOOK.id)}`))[0];
if (!bookRow) {
  d1(`INSERT INTO efm_books (id, name, config, created_at) VALUES (${q(BOOK.id)}, ${q(BOOK.name)}, ${q(JSON.stringify({ fy: BOOK.fy, entities: BOOK.entities }))}, ${Date.now()})`);
  console.log(`Created the book "${BOOK.name}" (fiscal ${BOOK.fy}, ${BOOK.entities[0].name}).`);
}
const stored = rows(d1(`SELECT seq, type, payload, actor_id, actor_name, actor_role, at, prev_hash, hash FROM efm_commands WHERE book_id = ${q(BOOK.id)} ORDER BY seq`))
  .map((r) => ({ seq: r.seq, type: r.type, payload: JSON.parse(r.payload), actor: { id: r.actor_id, name: r.actor_name, role: r.actor_role }, at: r.at, prev: r.prev_hash, hash: r.hash }));
const chain = EFM.verifyCommands(BOOK.id, stored);
if (!chain.ok) { console.error(`The stored history fails its hash chain at command ${chain.at} (${chain.why}). Nothing was written.`); process.exit(1); }

const today = EFM.Engine.prototype.nyDate(new Date().toISOString());
const E = EFM.createBooks({ ...BOOK, today });
const failed = EFM.replayCommands(E, stored, today);
if (failed.length) { console.error("The stored history no longer replays:", JSON.stringify(failed[0])); process.exit(1); }
console.log(`The book holds ${stored.length} command${stored.length === 1 ? "" : "s"} and ${E.cardOrder.length} card charge${E.cardOrder.length === 1 ? "" : "s"}.`);

// ---- what is new
const key = (date, amount) => date + "|" + amount;
const have = new Map();
for (const c of E.cardChargeList({ vendor: data.vendor.id })) have.set(key(c.date, c.amount), [...(have.get(key(c.date, c.amount)) || []), c]);
const chronological = data.invoices.slice().reverse();
const seen = new Map(), fresh = [], mismatched = [];
for (const r of chronological) {
  const k = key(r[0], r[2]); const n = (seen.get(k) || 0) + 1; seen.set(k, n);
  const existing = have.get(k) || [];
  if (n <= existing.length) { if (existing[n - 1].status !== r[3]) mismatched.push(`${existing[n - 1].id} (${r[0]}, ${r[2] / 100}): the books say ${existing[n - 1].status}, the export says ${r[3]}`); continue; }
  fresh.push(r);
}
let next = E.cardOrder.reduce((m, id) => Math.max(m, +id.slice(4)), 0);
const commands = [];
if (!E.vendors[data.vendor.id]) {
  const first = chronological[0][0];
  commands.push({ type: "vendor.create", payload: { id: data.vendor.id, name: data.vendor.name, entity: "US", account: "6100", dept: "ENG", category: "Software", card: true, created: first } });
}
for (const r of fresh) commands.push({ type: "card.record", payload: { id: "CHG-" + String(++next).padStart(4, "0"), vendor: data.vendor.id, date: r[0], due: r[1], amount: r[2], status: r[3], source: data.source || "" } });
mismatched.forEach((m) => console.log("  Not changed — " + m));
if (!commands.length) { console.log("Nothing new: every charge in the export is already in the books."); process.exit(0); }

// ---- run them through the engine first; then chain them
const sys = { id: "system", name: "OC EFM import", role: "system" };
const at = new Date().toISOString();
let prev = stored.length ? stored[stored.length - 1].hash : EFM.genesis(BOOK.id);
const out = [];
for (const c of commands) {
  E.exec(c.type, c.payload, sys, { at });             // throws if the engine refuses; nothing has been written
  const row = { seq: stored.length + out.length + 1, type: c.type, payload: c.payload, actor: sys, at };
  row.prev = prev; row.hash = EFM.commandHash(prev, row); prev = row.hash; out.push(row);
}
const spend = E.cardSpend(data.vendor.id, BOOK.fy + "-01", BOOK.fy + "-12");
console.log(`Adding ${out.length} command${out.length === 1 ? "" : "s"} (${fresh.length} charge${fresh.length === 1 ? "" : "s"}). Fiscal ${BOOK.fy} spend on ${data.vendor.name} will be $${(spend / 100).toFixed(2)}; trial balance ${E.trialBalance("US", BOOK.fy + "-12").balanced ? "balances" : "DOES NOT BALANCE"}.`);
if (!E.trialBalance("US", BOOK.fy + "-12").balanced) process.exit(1);

// ---- write, then read back and verify
const dir = mkdtempSync(join(tmpdir(), "efmimport-"));
const sql = join(dir, "import.sql");
writeFileSync(sql, out.map((r) => `INSERT INTO efm_commands (book_id, seq, type, payload, actor_id, actor_name, actor_role, at, prev_hash, hash) VALUES (${[q(BOOK.id), r.seq, q(r.type), q(JSON.stringify(r.payload)), q(r.actor.id), q(r.actor.name), q(r.actor.role), q(r.at), q(r.prev), q(r.hash)].join(", ")});`).join("\n") + "\n");
try { d1("", { file: sql }); } finally { rmSync(dir, { recursive: true, force: true }); }
const after = rows(d1(`SELECT seq, type, payload, actor_id, actor_name, actor_role, at, prev_hash, hash FROM efm_commands WHERE book_id = ${q(BOOK.id)} ORDER BY seq`))
  .map((r) => ({ seq: r.seq, type: r.type, payload: JSON.parse(r.payload), actor: { id: r.actor_id, name: r.actor_name, role: r.actor_role }, at: r.at, prev: r.prev_hash, hash: r.hash }));
const check = EFM.verifyCommands(BOOK.id, after);
if (!check.ok || after.length !== stored.length + out.length) { console.error(`Read back ${after.length} commands and the chain check says: ${JSON.stringify(check)}. Something is wrong — look before doing anything else.`); process.exit(1); }
console.log(`Written and verified: ${after.length} commands, hash chain intact, head ${check.head.slice(0, 16)}… ${remote ? "(production)" : "(local)"}`);
