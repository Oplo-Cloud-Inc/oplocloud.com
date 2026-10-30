/* A stand-in for the model service, for tests and for trying Roxan locally with
   no key and no cost. It answers POST /v1/messages in the same event stream the
   real service uses, and does what the last thing the user said asks for:

     "remember …"      a reply and a save_memory proposal
     "forget …"        a reply and a forget_memory proposal for a listed note
     "remind me …"     a reply and a set_reminder proposal for tomorrow 9:00
     "long-test"       Markdown: a list, a code block, a table
     "slow-test"       a reply that takes ten seconds, for the Stop button
     "ghost-test"      proposals that cannot be used (an unknown note, a bad time)
     "decline-test"    a declined request
     "error-test"      a failing service
     anything else     a short reply

   node worker/test/fake-provider.js 8131   starts one by hand. */
import http from "node:http";
import { fileURLToPath } from "node:url";

const pad = n => String(n).padStart(2, "0");
const tomorrowNine = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
};

const LONG = `Here is a short plan:

1. **Decide** what matters most.
2. Do the smallest useful thing first.
3. Check it, then keep going.

A line of code, \`npm test\`, and a block:

\`\`\`js
const sum = (a, b) => a + b;
console.log(sum(2, 3));
\`\`\`

| Step | Time |
| --- | --- |
| Plan | 5 min |
| Do | 30 min |

> Small steps count.
`;

function script(body) {
  const last = body.messages[body.messages.length - 1];
  const parts = typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content;
  const said = parts.filter(p => p.type === "text").map(p => p.text).join("\n");
  const lower = said.toLowerCase();
  // The notes are listed in the second system block ("- id: text"); the first is the fixed prompt.
  const notes = [...((body.system || [])[1]?.text || "").matchAll(/^- ([A-Za-z0-9_-]+): (.+)$/gm)].map(m => ({ id: m[1], text: m[2] }));

  if (lower.includes("error-test")) return { status: 500 };
  if (lower.includes("decline-test")) return { refuse: true };
  if (lower.includes("long-test")) return { text: LONG };
  if (lower.includes("ghost-test")) return { text: "Done.", tools: [{ name: "forget_memory", input: { id: "ghost" } }, { name: "set_reminder", input: { title: "x", when: "tomorrow morning" } }] };
  if (lower.includes("slow-test")) return { text: "This reply is slow on purpose. ".repeat(12), gap: 800 };
  if (lower.includes("remind me")) {
    const what = said.replace(/^.*remind me( to)?/i, "").trim().replace(/[.!]+$/, "") || "Reminder";
    return { text: "I've drafted a reminder for tomorrow at 9:00. Approve it below to set it.", tools: [{ name: "set_reminder", input: { title: what.slice(0, 60), when: tomorrowNine() } }] };
  }
  if (lower.includes("forget")) {
    const note = notes.find(n => n.text.toLowerCase().split(/\W+/).some(w => w.length > 3 && lower.includes(w))) || notes[0];
    return note
      ? { text: `I've asked to forget "${note.text}". Approve it below.`, tools: [{ name: "forget_memory", input: { id: note.id } }] }
      : { text: "I don't have anything remembered that matches." };
  }
  if (lower.includes("remember")) {
    const fact = said.replace(/^.*remember( that)?/i, "").trim().replace(/[.!]+$/, "") || said.trim();
    return { text: "Got it. I've suggested remembering that, and you decide whether to keep it.", tools: [{ name: "save_memory", input: { text: fact.slice(0, 200) } }] };
  }
  return { text: `You said: "${said.trim().slice(0, 120)}". This is a test reply, so I am not really thinking about it.` };
}

const sse = (name, data) => `event: ${name}\ndata: ${JSON.stringify({ type: name, ...data })}\n\n`;
const chunks = (text, n = 6) => text.match(new RegExp(`[\\s\\S]{1,${n}}`, "g")) || [];

export function startFake({ gap = 0, port = 0 } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", c => (raw += c));
    req.on("end", async () => {
      if (req.method !== "POST" || !req.url.startsWith("/v1/messages")) { res.writeHead(404).end(); return; }
      const body = JSON.parse(raw);
      const record = { headers: req.headers, body, url: req.url, closed: false };
      requests.push(record);
      res.on("close", () => { record.closed = true; });
      const plan = script(body);
      if (plan.status) {
        res.writeHead(plan.status, { "content-type": "application/json" });
        res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: "the fake service was asked to fail" } }));
        return;
      }
      res.writeHead(200, { "content-type": "text/event-stream" });
      let closed = false;
      res.on("close", () => { closed = true; });
      const write = s => { if (!closed) res.write(s); };
      const pause = ms => new Promise(r => setTimeout(r, ms));
      write(sse("message_start", { message: { id: "msg_fake", type: "message", role: "assistant", model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 321, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }));
      if (plan.refuse) {
        write(sse("message_delta", { delta: { stop_reason: "refusal", stop_sequence: null, stop_details: { type: "refusal", category: "general_harms", explanation: null } }, usage: { output_tokens: 0 } }));
        write(sse("message_stop", {}));
        res.end();
        return;
      }
      // The real model may start with a thinking block whose text is omitted.
      write(sse("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "", signature: "" } }));
      write(sse("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "ZmFrZQ==" } }));
      write(sse("content_block_stop", { index: 0 }));
      let index = 1;
      if (plan.text) {
        write(sse("content_block_start", { index, content_block: { type: "text", text: "" } }));
        for (const part of chunks(plan.text, plan.gap ? 30 : 7)) {
          if (closed) return;
          write(sse("content_block_delta", { index, delta: { type: "text_delta", text: part } }));
          const ms = plan.gap || gap;
          if (ms) await pause(ms);
        }
        write(sse("content_block_stop", { index }));
        index++;
      }
      for (const t of plan.tools || []) {
        write(sse("content_block_start", { index, content_block: { type: "tool_use", id: `toolu_${index}`, name: t.name, input: {} } }));
        for (const part of chunks(JSON.stringify(t.input), 12)) write(sse("content_block_delta", { index, delta: { type: "input_json_delta", partial_json: part } }));
        write(sse("content_block_stop", { index }));
        index++;
      }
      write(sse("message_delta", { delta: { stop_reason: plan.tools ? "tool_use" : "end_turn", stop_sequence: null }, usage: { output_tokens: 48 } }));
      write(sse("message_stop", {}));
      res.end();
    });
  });
  return new Promise(resolve => server.listen(port, "127.0.0.1", () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    close: () => new Promise(r => { server.closeAllConnections?.(); server.close(r); }),
  })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 8131;
  const { url } = await startFake({ gap: 18, port });
  console.log(`fake model service on ${url}`);
}
