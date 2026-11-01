/* Tests for the parts of the chat app that need no page: how the page keeps
   what the server says true, the notes and their web, the vault's cryptography,
   and three things that must stay true of the code itself: every import
   resolves (a browser only finds out when a person opens the page), pages are
   built from elements and not HTML strings, and nothing that can talk to
   Roxan can read the vault. */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as memory from "../../roxan/chat/memory.js";
import * as vc from "../../roxan/chat/vaultcrypto.js";
import { S, MAIN, apply, clear, watch, waiting, chats, find } from "../../roxan/chat/state.js";
import { cardish, SENSITIVE } from "../../roxan/chat/sensitive.js";

const CHAT = resolve(dirname(fileURLToPath(import.meta.url)), "../../roxan/chat");
const WORKER = resolve(CHAT, "../../worker");
const walk = (dir, out = []) => { for (const f of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, f.name); f.isDirectory() ? walk(p, out) : p.endsWith(".js") && out.push(p); } return out; };
const read = f => readFileSync(f, "utf8");

beforeEach(() => clear());

const note = (id, text, about, extra = {}) => ({ id, text, about, updatedAt: 1, createdAt: 1, ...extra });

/* ------------------------------------------------------------------ keeping true */

test("state: an item that arrives is kept newest first, replaced by id, and removed when it is gone", () => {
  const heard = [];
  const off = watch("goals", d => heard.push(d.id));
  apply({ t: "item", item: { id: "g1", kind: "goal", title: "A", updated: 1 } });
  apply({ t: "item", item: { id: "g2", kind: "goal", title: "B", updated: 2 } });
  assert.deepEqual(S.goals.map(g => g.id), ["g2", "g1"]);
  apply({ t: "item", item: { id: "g1", kind: "goal", title: "A again", updated: 3 } });
  assert.deepEqual(S.goals.map(g => [g.id, g.title]), [["g1", "A again"], ["g2", "B"]]);
  apply({ t: "gone", id: "g2" });
  assert.deepEqual(S.goals.map(g => g.id), ["g1"]);
  assert.deepEqual(heard, ["g1", "g2", "g1", "g2"], "every change was announced to whoever watches goals");
  off();
  assert.equal(find("g1").title, "A again");
  assert.equal(find("nope"), null);
});

test("state: a conversation remembers its last line, and a rename does not forget it", () => {
  apply({ t: "item", item: { id: "t1", kind: "thread", title: "Trip", updated: 1 } });
  apply({ t: "msg", message: { id: 1, thread: "t1", role: "user", text: "hello   there", at: 5 } });
  assert.deepEqual(S.threads[0].last, { role: "user", text: "hello there", at: 5 });
  apply({ t: "item", item: { id: "t1", kind: "thread", title: "Renamed", updated: 2 } });
  assert.deepEqual([S.threads[0].title, S.threads[0].last.text], ["Renamed", "hello there"]);
  assert.deepEqual(chats().map(t => t.id), ["t1"]);
  apply({ t: "item", item: { id: MAIN, kind: "thread", title: "Main", updated: 3 } });
  apply({ t: "item", item: { id: "t2", kind: "thread", title: "Old", state: "archived", updated: 4 } });
  assert.deepEqual(chats().map(t => t.id), ["t1"], "Main and archived chats are not side chats");
});

test("state: Roxan speaking first in Main is unread once, until it is seen", () => {
  apply({ t: "item", item: { id: MAIN, kind: "thread", title: "Main", updated: 1 } });
  const first = { id: 7, thread: MAIN, role: "assistant", text: "Your page changed.", from: "roxan", at: 100 };
  apply({ t: "msg", message: first });
  apply({ t: "msg", message: { ...first } });
  assert.equal(S.unread, 1, "the same message again (a refetch) is not a second one");
  apply({ t: "msg", message: { id: 8, thread: MAIN, role: "assistant", text: "A reply", at: 101 } });
  assert.equal(S.unread, 1, "an answer to a message is not Roxan speaking first");
  apply({ t: "seen", seen: 200 });
  assert.equal(S.unread, 0);
  apply({ t: "msg", message: { id: 9, thread: MAIN, role: "assistant", text: "old", from: "roxan", at: 150 } });
  assert.equal(S.unread, 0, "older than the last time it was seen");
});

test("state: a reply grows by the pieces that arrive, however they repeat or overlap, and never across a gap", () => {
  S.msgs.set("t", { list: [{ id: 1, thread: "t", role: "assistant", text: "Hel", streaming: true, at: 1 }], more: false, loaded: true });
  const text = () => S.msgs.get("t").list[0].text;
  apply({ t: "delta", id: 1, thread: "t", text: "lo ", at: 3 });
  assert.equal(text(), "Hello ");
  apply({ t: "delta", id: 1, thread: "t", text: "lo ", at: 3 });
  assert.equal(text(), "Hello ", "the same piece twice");
  apply({ t: "delta", id: 1, thread: "t", text: "lo world", at: 3 });
  assert.equal(text(), "Hello world", "a piece that overlaps what is there adds only its new end");
  apply({ t: "delta", id: 1, thread: "t", text: "!!", at: 99 });
  assert.equal(text(), "Hello world", "a piece after a gap is not guessed at; the page asks for the whole reply again");
});

test("state: steps, status, settings, the log and a cleared conversation follow what the server says", () => {
  S.msgs.set("t", { list: [{ id: 1, thread: "t", role: "assistant", text: "Working", at: 1 }], more: false, loaded: true });
  apply({ t: "steps", id: 1, thread: "t", steps: [{ label: "Read a page", ok: true }] });
  assert.equal(S.msgs.get("t").list[0].steps[0].label, "Read a page");
  apply({ t: "status", status: { state: "working", text: "Reading a page" } });
  assert.deepEqual([S.status.state, S.status.text], ["working", "Reading a page"]);
  apply({ t: "settings", settings: { ...S.settings, name: "Juno" } });
  assert.equal(S.settings.name, "Juno");
  apply({ t: "event", event: { id: 2, at: 2, kind: "run", text: "second" } });
  apply({ t: "event", event: { id: 3, at: 3, kind: "run", text: "third" } });
  apply({ t: "event", event: { id: 2, at: 2, kind: "run", text: "second, again" } });
  assert.deepEqual(S.events.map(e => e.id), [2, 3], "a repeat replaces the earlier line and the newest delivery comes first");
  apply({ t: "cleared", thread: "t" });
  assert.deepEqual(S.msgs.get("t").list, []);
});

test("state: what waits for a yes is what is still awaiting, newest first", () => {
  apply({ t: "item", item: { id: "a1", kind: "approval", state: "awaiting", created: 1, updated: 1 } });
  apply({ t: "item", item: { id: "a2", kind: "approval", state: "approved", created: 2, updated: 2 } });
  apply({ t: "item", item: { id: "q1", kind: "question", state: "awaiting", created: 3, updated: 3 } });
  assert.deepEqual(waiting().map(x => x.id), ["q1", "a1"]);
});

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

test("memory: a note Roxan has is known, and one the person removed is refused", () => {
  const notes = [note("1", "Priya is my manager", ["You", "Priya"]), note("2", "Likes jazz", [], { deleted: true })];
  assert.equal(memory.status("priya is my manager", notes), "known");
  assert.equal(memory.status("Likes jazz", notes), "refused");
  assert.equal(memory.status("Allergic to nuts", notes), null);
});

test("sensitive: card numbers are found by their check digit, and sensitive words are flagged", () => {
  assert.ok(cardish("pay with 4242 4242 4242 4242 please"));
  assert.ok(cardish("4242-4242-4242-4242"));
  assert.ok(!cardish("4242 4242 4242 4241"));
  assert.ok(!cardish("call me on 212-555-0147 or 2025550143"));
  assert.ok(SENSITIVE.test("my password is hunter2"));
  assert.ok(!SENSITIVE.test("I like green tea"));
});

/* ------------------------------------------------------------------ the code itself */

test("client: every import points at a file that exists and exports the name", () => {
  const exportsOf = src => {
    const out = new Set();
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([\w$]+)/g)) out.add(m[1]);
    for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const n of m[1].split(",")) { const x = n.trim().split(/\s+as\s+/).pop(); if (x) out.add(x); }
    if (/export\s+\*/.test(src)) out.add("*");
    return out;
  };
  const bad = [];
  for (const f of walk(CHAT)) {
    const src = read(f), at = relative(CHAT, f);
    for (const m of src.matchAll(/import\s+(?:\*\s+as\s+\w+|\{([^}]*)\}|\w+)\s+from\s+["'](\.[^"']+)["']/g)) {
      const target = resolve(dirname(f), m[2]);
      if (!existsSync(target)) { bad.push(`${at}: ${m[2]} is not there`); continue; }
      const have = exportsOf(read(target));
      for (const n of (m[1] || "").split(",")) { const name = n.trim().split(/\s+as\s+/)[0]; if (name && !have.has(name) && !have.has("*")) bad.push(`${at}: ${m[2]} does not export ${name}`); }
    }
    for (const m of src.matchAll(/import\(\s*["'](\.[^"']+)["']\s*\)/g)) if (!existsSync(resolve(dirname(f), m[1]))) bad.push(`${at}: ${m[1]} is not there`);
  }
  assert.deepEqual(bad, []);
});

test("client: pages are built from elements, never from HTML strings or inline styles", () => {
  const bad = [];
  for (const f of walk(CHAT)) {
    const found = read(f).match(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|\bstyle:\s|setAttribute\(["']style["']|\.cssText/);
    if (found) bad.push(`${relative(CHAT, f)}: ${found[0]}`);
  }
  assert.deepEqual(bad, [], "the page's policy allows no inline script or style, and a string of HTML is how those get in");
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

test("vault: nothing that can talk to Roxan can read it, and nothing on the server knows it exists", () => {
  const opens = /from\s+["'][^"']*vaultcrypto\.js["']|\w+\.\w+\(\s*["'`]vault["'`]/;       // imports the cipher, or reads or writes the vault's store
  const readers = walk(CHAT).filter(f => opens.test(read(f))).map(f => relative(CHAT, f)).sort();
  assert.deepEqual(readers, ["local.js", "views/vault.js"], "the only code that can open the vault: a count, and the vault's own page");
  for (const f of readers) assert.doesNotMatch(read(join(CHAT, f)), /from\s+["'][^"']*\b(?:api|state|ui|files)\.js["']/, `${f} imports nothing that reaches the network`);
  for (const f of [...walk(join(WORKER, "agent")), join(WORKER, "roxan.js")]) assert.doesNotMatch(read(f), /vaultcrypto|["'`]vault["'`]/, relative(WORKER, f));
  assert.doesNotMatch(read(join(CHAT, "vaultcrypto.js")), /fetch\(|XMLHttpRequest|localStorage|indexedDB|import /, "the crypto file touches no network and no storage");
});
