/* Tests for the parts of the chat app that need no page: the notes and their web,
   what learning may keep, specialties and Handoffs, the body sent to the gateway,
   and the vault's cryptography. db.js falls back to plain memory when there is no
   IndexedDB, so the real code runs here as it does in a private window. */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as db from "../../roxan/chat/db.js";
import * as memory from "../../roxan/chat/memory.js";
import * as proposals from "../../roxan/chat/proposals.js";
import * as store from "../../roxan/chat/store.js";
import * as turn from "../../roxan/chat/turn.js";
import * as vc from "../../roxan/chat/vaultcrypto.js";
import { cardish, SENSITIVE } from "../../roxan/chat/sensitive.js";

beforeEach(async () => { await db.clearAll(); });

const note = (id, text, about, extra = {}) => ({ id, text, about, updatedAt: 1, createdAt: 1, ...extra });

/* ------------------------------------------------------------------ the web */

test("memory: names join the way the web already spells them", () => {
  const known = [note("m1", "Priya manages the user", ["You", "Priya"])];
  assert.deepEqual(memory.aboutNames(["me", "priya", "PRIYA", " Acme ", ""], known), ["You", "Priya", "Acme"]);
  assert.deepEqual(memory.aboutNames("not a list", known), []);
  assert.equal(memory.aboutNames(["a", "b", "c", "d", "e", "f", "g"]).length, 6);
});

test("memory: the web has a dot for each name, a line where two share a note, and leaves out removed notes", () => {
  const w = memory.web([
    note("1", "Priya is my manager", ["You", "Priya"], { updatedAt: 3 }),
    note("2", "Priya works at Acme", ["Priya", "Acme"], { updatedAt: 2 }),
    note("3", "I like green tea", ["You"]),
    note("4", "Dentist on Tuesdays"),
    note("5", "gone", ["Zed"], { deleted: true }),
  ]);
  assert.deepEqual(w.nodes.map(n => n.name).sort(), ["Acme", "Priya", "You"]);
  assert.deepEqual(w.edges.map(e => [e.a, e.b].sort().join("+")).sort(), ["acme+priya", "priya+you"]);
  assert.deepEqual(w.loose.map(m => m.id), ["4"]);
  assert.equal(w.nodes.find(n => n.name === "You").notes.length, 2);
});

test("memory: the layout puts You in the middle, keeps every dot on the page, and draws the same picture twice", () => {
  const notes = [note("1", "a", ["You", "Priya"]), note("2", "b", ["Priya", "Acme"]), note("3", "c", ["You", "Sam"]), note("4", "d", ["Zed", "Yan"])];
  const w = memory.web(notes), at = memory.layout(w, 720, 520);
  assert.deepEqual(at.get("you"), { x: 360, y: 260 });
  assert.equal(at.size, w.nodes.length);
  for (const p of at.values()) assert.ok(p.x >= 0 && p.x <= 720 && p.y >= 0 && p.y <= 520, JSON.stringify(p));
  assert.equal(new Set([...at.values()].map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)).size, w.nodes.length, "no two dots on the same spot");
  assert.deepEqual([...memory.layout(memory.web(notes), 720, 520)], [...at]);
  assert.equal(memory.layout({ nodes: [], edges: [], loose: [] }).size, 0);
});

test("memory: with too many notes, pinned come first, then notes about names the message mentions, then what those are linked to", () => {
  const many = Array.from({ length: 30 }, (_, i) => note("n" + i, `Filler fact number ${i} about nothing`, ["Zed"], { updatedAt: 100 - i }));
  many.push(note("p1", "Priya is my manager", ["You", "Priya"]), note("p2", "Priya works at Acme", ["Priya", "Acme"], { updatedAt: 0 }),
    note("a1", "Acme ships on Fridays", ["Acme"], { updatedAt: -5 }), note("pin", "Pinned thing", [], { pinned: true, updatedAt: -10 }));
  const got = memory.pick(many, "what did Priya say?", 5).map(m => m.id);
  assert.equal(got.length, 5);
  assert.equal(got[0], "pin");
  assert.deepEqual(got.slice(1, 4).sort(), ["a1", "p1", "p2"]);
  assert.equal(memory.pick(many.slice(0, 3), "anything", 20).length, 3, "few notes: all of them");
});

test("memory: a new note must rest on what the user wrote", () => {
  assert.ok(memory.grounded(note("x", "Prefers green tea", ["You"]), "I like green tea in the morning"));
  assert.ok(memory.grounded(note("x", "Is a manager", ["You", "Priya"]), "Priya called me"));
  assert.ok(!memory.grounded(note("x", "Likes jazz", ["You"]), "What time is it?"));
});

test("sensitive: card numbers are found by their check digit, and sensitive words are flagged", () => {
  assert.ok(cardish("pay with 4242 4242 4242 4242 please"));
  assert.ok(cardish("4242-4242-4242-4242"));
  assert.ok(!cardish("4242 4242 4242 4241"));
  assert.ok(!cardish("call me on 212-555-0147 or 2025550143"));
  assert.ok(SENSITIVE.test("my password is hunter2"));
  assert.ok(!SENSITIVE.test("I like green tea"));
});

/* ------------------------------------------------------------------ learning */

const said = "Alpha Bravo Charlie Delta live nearby";
const ctx = (over = {}) => ({ learning: true, said, recent: said, files: false, kept: 0, ...over });

test("learning: a note that rests on what was said is kept at once, shown as learned, and can be undone for good", async () => {
  const ev = await proposals.create("main", "save_memory", { text: "Priya is my manager", about: ["me", "Priya"], kind: "person" }, ctx({ said: "Priya is my manager at Acme" }));
  assert.equal(ev.state, "done");
  assert.equal(ev.auto, true);
  const [m] = await db.all("memories");
  assert.deepEqual([m.text, m.about, m.kind, m.auto], ["Priya is my manager", ["You", "Priya"], "person", true]);
  assert.match(proposals.note(ev, []), /kept straight away because learning is on/);

  const undone = await proposals.undo(ev.id);
  assert.ok(undone.ok);
  const [gone] = await db.all("memories");
  assert.deepEqual([gone.deleted, gone.reason], [true, "undone"]);
  assert.equal((await db.get("events", ev.id)).state, "undone");
  assert.match(proposals.note(await db.get("events", ev.id), []), /the user undid it/);
  assert.equal(await proposals.create("main", "save_memory", { text: "Priya is my manager", about: ["You"] }, ctx({ said: "Priya is my manager" })), null, "an undone note is not suggested again");
  assert.equal((await proposals.undo(ev.id)).ok, false, "and undoing twice does nothing");
});

test("learning: it waits for a yes when learning is off, a file came along, the note is not grounded, or it is sensitive", async () => {
  const wait = async (input, c) => (await proposals.create("main", "save_memory", input, c)).state;
  assert.equal(await wait({ text: "Alpha is tall", about: ["Alpha"] }, ctx({ learning: false })), "awaiting");
  assert.equal(await wait({ text: "Bravo is short", about: ["Bravo"] }, ctx({ files: true })), "awaiting");
  assert.equal(await wait({ text: "Likes jazz music", about: ["You"] }, ctx({ said: "What time is it?" })), "awaiting");
  assert.equal(await wait({ text: "Charlie has the password hunter2", about: ["Charlie"] }, ctx()), "awaiting");
  assert.equal(await wait({ text: "Delta is slow", about: ["Delta"] }, ctx()), "done");
});

test("learning: at most three are kept straight away from one reply", async () => {
  const c = ctx();
  const states = [];
  for (const [text, who] of [["Alpha is tall", "Alpha"], ["Bravo is short", "Bravo"], ["Charlie is quick", "Charlie"], ["Delta is slow", "Delta"]]) states.push((await proposals.create("main", "save_memory", { text, about: [who] }, c)).state);
  assert.deepEqual(states, ["done", "done", "done", "awaiting"]);
});

test("learning: a note Roxan already has, or one that was dismissed, is not shown again", async () => {
  await db.put("memories", note("m_1", "Alpha is tall", ["Alpha"]));
  assert.equal(await proposals.create("main", "save_memory", { text: "Alpha is tall" }, ctx()), null);
  const card = await proposals.create("main", "save_memory", { text: "Bravo is short", about: ["Bravo"] }, ctx({ learning: false }));
  await proposals.resolve(card.id, card.nonce, "decline");
  assert.equal(await proposals.create("main", "save_memory", { text: "Bravo is short" }, ctx()), null);
});

/* ------------------------------------------------------------------ specialties and Handoffs */

const report = { name: "Weekly report", when: "When asked for the weekly report", steps: ["Collect the numbers", "Draft the summary", "Send it to the team lead"] };

test("specialty: learning sets one up when the user's own words lead to it, and Undo deletes it for good", async () => {
  const ev = await proposals.create("main", "save_specialty", report, ctx({ recent: "please do the weekly report like last time" }));
  assert.deepEqual([ev.state, ev.auto], ["done", true]);
  const [s] = await db.all("specialties");
  assert.deepEqual([s.name, s.steps.length, s.on, s.auto], ["Weekly report", 3, true, true]);
  assert.ok((await proposals.undo(ev.id)).ok);
  assert.equal((await db.all("specialties"))[0].deleted, true);
  assert.equal(await proposals.create("main", "save_specialty", report, ctx({ recent: "weekly report" })), null, "a removed specialty is not suggested again");
});

test("specialty: a card is the default, edits are what gets saved, and steps need two lines", async () => {
  const ev = await proposals.create("main", "save_specialty", report, ctx({ learning: false }));
  assert.equal(ev.state, "awaiting");
  const bad = await proposals.resolve(ev.id, ev.nonce, "approve", { steps: "1. Only one step" });
  assert.equal(bad.ok, false);
  assert.match(bad.message, /at least two steps/);
  const ok = await proposals.resolve(ev.id, ev.nonce, "approve", { name: "Friday report", steps: "1. Collect\n- Draft\n\nSend" });
  assert.ok(ok.ok);
  const [s] = await db.all("specialties");
  assert.deepEqual([s.name, s.steps, s.auto], ["Friday report", ["Collect", "Draft", "Send"], undefined]);
  const dup = await proposals.create("main", "save_specialty", { ...report, name: "Friday report" }, ctx({ learning: false }));
  assert.equal(dup, null, "a specialty with the same name is not proposed twice");
});

test("specialty: dismissing one is remembered", async () => {
  const ev = await proposals.create("main", "save_specialty", report, ctx({ learning: false }));
  await proposals.resolve(ev.id, ev.nonce, "decline");
  assert.equal(await proposals.create("main", "save_specialty", report, ctx({ learning: false })), null);
});

test("handoff: never saved without a yes, saved as waiting, and nothing is claimed to have run", async () => {
  const ev = await proposals.create("main", "start_handoff", { title: "Book a table", task: "Book a table for two on Friday at 7", site: "blueplate.com" }, ctx());
  assert.equal(ev.state, "awaiting", "even with learning on");
  assert.equal((await db.all("handoffs")).length, 0);
  const res = await proposals.resolve(ev.id, ev.nonce, "approve", { task: "Book a table for two on Saturday at 7" });
  assert.ok(res.ok);
  assert.match(res.ev.result.message, /Nothing has run/);
  const [x] = await db.all("handoffs");
  assert.deepEqual([x.title, x.task, x.site, x.state, x.roomId], ["Book a table", "Book a table for two on Saturday at 7", "blueplate.com", "waiting", "main"]);
  assert.equal(res.ev.result.handoffId, x.id);
});

test("handoff: a card number is turned away, and the card stays open to fix", async () => {
  const ev = await proposals.create("main", "start_handoff", { title: "Pay it", task: "Pay the bill" }, ctx());
  const res = await proposals.resolve(ev.id, ev.nonce, "approve", { task: "Pay the bill with 4242 4242 4242 4242" });
  assert.equal(res.ok, false);
  assert.match(res.message, /Vault/);
  assert.equal((await db.get("events", ev.id)).state, "awaiting");
  assert.equal((await db.all("handoffs")).length, 0);
});

test("handoff: written by hand, then marked done by the user", async () => {
  const x = await store.addHandoff({ title: "Renew passport", task: "Fill in the renewal form" });
  assert.equal(x.state, "waiting");
  const done = await store.setHandoff(x, { state: "done" }, "Marked done.");
  assert.deepEqual([done.state, done.updatedAt >= x.updatedAt], ["done", true]);
});

/* ------------------------------------------------------------------ what is sent */

test("turn: the body carries notes with their names, the specialties that fit, and the learning switch", async () => {
  await store.ensureMain();
  await db.put("memories", note("m_1", "Priya is my manager", ["You", "Priya"]));
  await db.put("specialties", { id: "sp_1", ...report, on: true, createdAt: 1, updatedAt: 2 });
  await db.put("specialties", { id: "sp_2", name: "Returns", when: "When something must go back", steps: ["Find the receipt", "Ask for a refund"], on: true, createdAt: 1, updatedAt: 1 });
  await db.put("specialties", { id: "sp_3", name: "Switched off", when: "never", steps: ["a", "b"], on: false, createdAt: 1, updatedAt: 1 });
  await db.put("specialties", { id: "sp_4", name: "Removed", deleted: true, createdAt: 1, updatedAt: 1 });
  await db.put("vault", { id: "v_1", iv: "x", data: "SEALED-SECRET-DATA", createdAt: 1, updatedAt: 1 });
  await db.put("events", { id: "e1", roomId: "main", at: 1, kind: "user", text: "do the weekly report", files: [] });
  const { local, ...body } = await turn.buildBody(await store.getRoom("main"));
  assert.deepEqual(body.context.memories, [{ id: "m_1", text: "Priya is my manager", about: ["You", "Priya"] }]);
  assert.deepEqual(body.context.specialties.map(s => [s.id, s.steps.length]), [["sp_1", 3], ["sp_2", 0]], "only the one that fits carries its steps; off and removed ones are not sent");
  assert.equal(body.context.learning, true);
  assert.deepEqual(local.used, ["m_1"]);
  assert.deepEqual([local.ctx.said, local.ctx.files, local.ctx.learning], ["do the weekly report", false, true]);
  assert.doesNotMatch(JSON.stringify(body), /SEALED-SECRET-DATA|vault/i);

  await store.setLearning(false);
  assert.equal((await turn.buildBody(await store.getRoom("main"))).context.learning, false);
});

test("export: a copy of everything leaves the vault out", async () => {
  await db.put("vault", { id: "v_1", iv: "x", data: "SEALED", createdAt: 1, updatedAt: 1 });
  await db.put("memories", note("m_1", "x", []));
  const copy = await db.dump();
  assert.equal("vault" in copy, false);
  assert.equal(copy.memories.length, 1);
});

/* ------------------------------------------------------------------ the vault */

test("vault: a passphrase opens it, a wrong one does not, and a sealed item is bound to its id", async () => {
  const pass = "correct horse battery staple";
  const { key, header } = await vc.create(pass, 1000);
  assert.deepEqual(Object.keys(header).sort(), ["check", "iterations", "kdf", "salt", "v"]);
  assert.doesNotMatch(JSON.stringify(header), /correct|horse|roxan-vault/);

  const again = await vc.unlock(pass, header);
  const secret = { kind: "login", label: "Bank", fields: { password: "hunter2-secret" } };
  const box = await vc.seal(key, "v_1", secret);
  assert.doesNotMatch(JSON.stringify(box), /hunter2|Bank/);
  assert.deepEqual(await vc.unseal(again, "v_1", box), secret);

  await assert.rejects(vc.unlock("not the passphrase", header), vc.WrongPassphrase);
  await assert.rejects(vc.unseal(key, "v_2", box), undefined, "moved under another id");
  const bytes = vc.fromB64(box.data);
  bytes[3] ^= 1;
  await assert.rejects(vc.unseal(key, "v_1", { ...box, data: vc.toB64(bytes) }), undefined, "one bit changed");
  const other = (await vc.create(pass, 1000)).key;
  await assert.rejects(vc.unseal(other, "v_1", box), undefined, "another vault's key, made from the same passphrase");
  assert.notEqual((await vc.seal(key, "v_1", { a: 1 })).iv, (await vc.seal(key, "v_1", { a: 1 })).iv, "a fresh nonce every time");
  await assert.rejects(crypto.subtle.exportKey("raw", key), undefined, "the key cannot be taken out of the browser");
  await assert.rejects(vc.create("too short", 1000), RangeError);
});

test("vault: nothing on the way to Roxan's model can reach it", () => {
  const read = rel => readFileSync(new URL(rel, import.meta.url), "utf8");
  for (const f of ["api.js", "turn.js", "proposals.js", "memory.js", "md.js", "cards.js", "sensitive.js", "gate.js"]) {
    assert.doesNotMatch(read(`../../roxan/chat/${f}`), /vaultcrypto|views\/vault|["'`]vault["'`]/, f);
  }
  assert.doesNotMatch(read("../gateway.js"), /vaultcrypto|["'`]vault["'`]/);
  assert.doesNotMatch(read("../../roxan/chat/vaultcrypto.js"), /fetch\(|XMLHttpRequest|localStorage|indexedDB|import /, "the crypto file touches no network and no storage");
});
