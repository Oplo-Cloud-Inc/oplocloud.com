/* The routes of one person's Roxan, after the Worker has checked who is asking.

   route() takes the parts of the path below /api, the query, and the parsed body,
   and answers { status, body, headers? }. It checks what came in at the edge and
   leaves everything else to the engine, which has no idea it is on the web. */
import { Invalid, line, cardish } from "./util.js";
import { EDITABLE, slim } from "./kinds.js";

const LIMIT = { text: 100_000, files: 12, images: 6, image: 5_000_000, pdf: 6_000_000, textFiles: 6, name: 120 };
const IMAGES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

// Attachments are read for the message they come with and not kept: only their names are.
export function files(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > LIMIT.files) throw new Invalid("That is too many attachments.");
  const n = { image: 0, pdf: 0, text: 0 };
  return list.map(f => {
    const name = line(f?.name, LIMIT.name) || "file";
    if (f?.type === "image") {
      if (!IMAGES.has(f.media_type) || typeof f.data !== "string" || !BASE64.test(f.data) || f.data.length > LIMIT.image) throw new Invalid(`${name} is not an image Roxan can read, or is too large.`);
      if (++n.image > LIMIT.images) throw new Invalid(`Send at most ${LIMIT.images} images at once.`);
      return { kind: "image", name, media_type: f.media_type, data: f.data };
    }
    if (f?.type === "pdf") {
      if (typeof f.data !== "string" || !BASE64.test(f.data) || f.data.length > LIMIT.pdf) throw new Invalid(`${name} is not a PDF Roxan can read, or is too large.`);
      if (++n.pdf > 1) throw new Invalid("Send one PDF at a time.");
      return { kind: "pdf", name, data: f.data };
    }
    if (f?.type === "text") {
      if (typeof f.text !== "string" || !f.text.trim() || f.text.length > LIMIT.text) throw new Invalid(`${name} is empty or too long.`);
      if (++n.text > LIMIT.textFiles) throw new Invalid(`Send at most ${LIMIT.textFiles} text files at once.`);
      if (cardish(f.text)) throw new Invalid(`${name} seems to hold a card number. Roxan never needs one.`);
      return { kind: "text", name, text: f.text };
    }
    throw new Invalid("An attachment is not valid.");
  });
}

const ok = (body, status = 200, headers) => ({ status, body, headers });
const obj = body => { if (!body || typeof body !== "object" || Array.isArray(body)) throw new Invalid("Send a JSON object."); return body; };

export async function route(core, method, parts, query, body) {
  const [a, b, c] = parts, m = method;
  const none = () => { throw new Invalid("No such route.", 404); };

  if (a === "state") return m === "GET" ? ok(core.state()) : none();

  if (a === "threads" && b) {
    if (c === "messages" && m === "GET") return ok({ messages: core.messages(b, Number(query.get("before")) || undefined) });
    if (c === "messages" && m === "DELETE") { core.clear(b); return ok({ ok: true }); }
    if (c === "messages" && m === "POST") {
      const text = typeof obj(body).text === "string" ? body.text.trim() : "", fl = files(body.files);
      if (!text && !fl.length) throw new Invalid("Write a message.");
      if (!text) throw new Invalid("Say something about what you attached.");
      if (text.length > LIMIT.text) throw new Invalid("That message is too long.");
      if (cardish(text)) throw new Invalid("That looks like a card number. Keep card numbers in your vault; Roxan never needs them.");
      return ok(await core.send(b, { text, files: fl }), 201);
    }
    if (c === "retry" && m === "POST") return ok(await core.retry(b), 201);
    return none();
  }

  if (a === "runs" && b && c === "stop" && m === "POST") { core.stop(b); return ok({ ok: true }); }

  if (a === "items") {
    if (!b && m === "POST") {
      const { kind, ...fields } = obj(body);                    // `kind` names the item here; a note's own kind is set with a PATCH
      if (!EDITABLE.includes(kind)) throw new Invalid("Roxan does not keep that.");
      return ok({ item: slim(core.create(kind, fields)) }, 201);
    }
    const it = b && core.store.item(b);
    if (!it || !EDITABLE.includes(it.kind)) throw new Invalid("There is nothing with that id.", 404);
    if (!c && m === "GET") return ok({ item: it });
    if (!c && m === "PATCH") return ok({ item: slim(core.update(b, obj(body))) });
    if (!c && m === "DELETE") { core.remove(b); return ok({ ok: true }); }
    if (c === "run" && m === "POST") { core.runNow(b); return ok({ ok: true }, 202); }
    if (c === "take" && m === "POST") { const r = core.take(b); return ok({ idea: r.idea, goal: r.goal }); }
    return none();
  }

  if (a === "approvals" && b && m === "POST") return ok({ approval: await core.resolve(b, obj(body).decision) });
  if (a === "questions" && b && m === "POST") return ok(await core.answerQuestion(b, obj(body).answer), 201);

  if (a === "settings" && m === "PUT") return ok({ settings: core.settings(obj(body)) });
  if (a === "events" && m === "GET") return ok({ events: core.store.events({ before: Number(query.get("before")) || undefined, limit: Math.min(100, Number(query.get("limit")) || 60) }) });
  if (a === "seen" && m === "POST") { core.seen(); return ok({ ok: true }); }
  if (a === "export" && m === "GET") return ok(core.export(), 200, { "content-disposition": 'attachment; filename="roxan-export.json"' });
  if (a === "wipe" && m === "POST") {
    if (obj(body).confirm !== "delete everything") throw new Invalid('Send {"confirm":"delete everything"} to delete everything.');
    core.wipe();
    return ok({ ok: true });
  }
  return none();
}
