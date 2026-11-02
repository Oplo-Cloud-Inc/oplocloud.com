/* The routes: what is refused at the edge, and that each one reaches the engine. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { make, scripted, text } from "./helpers.js";
import { route, files } from "../agent/api.js";
import { MAIN } from "../agent/core.js";

const call = (h, method, path, body, query = "") => route(h.core, method, path.split("/").filter(Boolean), new URLSearchParams(query), body);
const fails = (promise, status, re) => assert.rejects(promise, e => e.status === status && re.test(e.message));

test("api: a message needs words, is not a card number, and attachments are checked", async () => {
  const h = make({ model: scripted([text("Hi.")]) });
  await fails(call(h, "POST", "threads/main/messages", { text: "  " }), 400, /Write a message/);
  await fails(call(h, "POST", "threads/main/messages", { text: "pay with 4242 4242 4242 4242" }), 400, /card number/);
  await fails(call(h, "POST", "threads/main/messages", { text: "", files: [{ type: "text", name: "a", text: "x" }] }), 400, /something about what you attached/);
  await fails(call(h, "POST", "threads/main/messages", { text: "hi", files: [{ type: "image", name: "a.png", media_type: "image/png", data: "AAAA" }] }), 400, /not text/);
  await fails(call(h, "POST", "threads/main/messages", { text: "hi", files: [{ type: "text", name: "n", text: "card 4242424242424242" }] }), 400, /card number/);
  await fails(call(h, "POST", "threads/nope/messages", { text: "hi" }), 404, /not there/);
  const r = await call(h, "POST", "threads/main/messages", { text: "hi" });
  assert.equal(r.status, 201);
  assert.equal(r.body.message.text, "hi");
  await h.idle();
  const m = await call(h, "GET", "threads/main/messages");
  assert.deepEqual(m.body.messages.map(x => x.text), ["hi", "Hi."]);
});

test("api: a few text files are the most that can come with a message, and a picture or PDF is turned away", () => {
  const txt = { type: "text", name: "a.txt", text: "hello" };
  assert.equal(files([txt, txt]).length, 2);
  assert.throws(() => files(Array(7).fill(txt)), /at most 6 text files/);
  assert.throws(() => files([{ type: "image", media_type: "image/png", data: "AAAA", name: "a.png" }]), /a\.png is not text/);
  assert.throws(() => files([{ type: "pdf", data: "AAAA", name: "x.pdf" }]), /x\.pdf is not text/);
  assert.throws(() => files([{ type: "movie" }]), /not valid/);
  assert.throws(() => files("nope"), /too many/);
  assert.deepEqual(files(undefined), []);
});

test("api: things are made, changed, read and removed through one set of routes, with the engine's checks", async () => {
  const h = make();
  const made = await call(h, "POST", "items", { kind: "goal", title: "Learn to swim", steps: ["Book lessons"] });
  const id = made.body.item.id;
  assert.equal(made.status, 201);
  await call(h, "PATCH", `items/${id}`, { done: [1], status: "done" });
  assert.deepEqual((await call(h, "GET", `items/${id}`)).body.item.steps, [{ text: "Book lessons", done: true }]);
  await fails(call(h, "POST", "items", { kind: "approval", title: "x" }), 400, /does not keep that/);
  await fails(call(h, "PATCH", `items/${id}`, { status: "great" }), 400, /Status must be/);
  await fails(call(h, "DELETE", "items/nope"), 404, /nothing with that id/);
  await call(h, "DELETE", `items/${id}`);
  assert.equal(h.store.item(id), null);
  await fails(call(h, "DELETE", "items/main"), 400, /Main conversation stays/);
  const p = (await call(h, "POST", "items", { kind: "panel", type: "checklist", title: "Packing", items: ["Passport"] })).body.item;
  assert.equal(p.size, 1);
  assert.equal(p.items, undefined, "a list does not carry contents");
  assert.deepEqual((await call(h, "GET", `items/${p.id}`)).body.item.items, [{ text: "Passport", done: false }]);
  // `kind` names the item in the body; it must not be read as the note's own kind
  const n = await call(h, "POST", "items", { kind: "memory", text: "My sister Priya lives in Delhi", about: ["Priya"] });
  assert.equal(n.status, 201);
  assert.deepEqual(n.body.item.about, ["Priya"]);
});

test("api: settings, the log, export and delete-everything", async () => {
  const h = make();
  assert.equal((await call(h, "PUT", "settings", { name: "Juno", tone: "warm" })).body.settings.name, "Juno");
  await fails(call(h, "PUT", "settings", { tone: "rude" }), 400, /Tone/);
  await call(h, "POST", "items", { kind: "goal", title: "Swim" });
  assert.match((await call(h, "GET", "events")).body.events[0].text, /You created a goal: Swim/);
  const ex = await call(h, "GET", "export");
  assert.match(ex.headers["content-disposition"], /roxan-export.json/);
  assert.ok(ex.body.settings.some(s => s.k === "settings"));
  await fails(call(h, "POST", "wipe", {}), 400, /delete everything/);
  assert.equal((await call(h, "POST", "wipe", { confirm: "delete everything" })).status, 200);
  assert.equal(h.core.cfg().name, "Roxan");
  await fails(call(h, "GET", "nowhere"), 404, /No such route/);
});
