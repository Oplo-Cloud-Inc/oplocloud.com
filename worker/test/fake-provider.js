/* A stand-in for the model service, for tests and for trying Roxan locally with
   no key and no cost. It answers POST /v1/chat/completions in the same event stream the
   real service uses. It reads the last thing in the conversation:

     a user message  decides what to do from the words, and calls a tool or answers
     tool results    wraps up in words, so the loop runs for more than one round

   What the person says picks the behaviour:

     "remember …"            remember (with the names it is about)
     "forget …"              forget a listed note
     "remind me …"           a reminder for tomorrow 09:00
     "routine …"             a daily routine; "watch <url>" watches a page
     "read <url>"            read_page, then a reply about what it found
     "goal …" "panel …" "idea …" "specialty …" "handoff …"   the matching tool
     "ask-test"              ask a question and stop
     "inject-test <url>"     read a page, then try to start a routine (as if the page told it to)
     "long-test"             Markdown: a list, a code block, a table
     "slow-test"             a reply that takes ten seconds, for the Stop button
     "decline-test"          a declined request
     "error-test"            a failing service
     anything else           a short reply

   When the system prompt says the run is a routine firing on its own, it checks
   in: "notify-test" in the instruction sends a notification, anything else
   stays quiet and says so.

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

const NOT_NAMES = new Set(["The", "This", "That", "These", "Those", "And", "But", "Not", "Her", "His", "Its"]);
function aboutOf(fact) {
  const about = /\b(i|i'm|my|me|mine)\b/i.test(fact) ? ["You"] : [];
  for (const m of fact.matchAll(/\b[A-Z][a-z]{2,}\b/g)) if (!NOT_NAMES.has(m[0]) && !about.includes(m[0])) about.push(m[0]);
  return about.slice(0, 4);
}
const kindOf = (fact, about) => (/\b(likes?|prefers?|loves?|hates?|favou?rites?)\b/i.test(fact) ? "preference" : about.length > 1 ? "person" : "other");
const sentence = s => s.charAt(0).toUpperCase() + s.slice(1);
const urlIn = s => s.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
const rest = (said, word) => said.replace(new RegExp(`^.*?${word}:?\\s*`, "i"), "").trim().replace(/[.!]+$/, "");

function script(body) {
  const messages = body.messages;
  const sys = messages[0].content;
  // The tool messages at the end, if the last turn was the tools answering; else the user's words.
  let n = messages.length;
  while (messages[n - 1].role === "tool") n--;
  const results = messages.slice(n).map(m => ({ content: m.content }));
  const parts = results.length ? [] : [{ type: "text", text: typeof messages[n - 1].content === "string" ? messages[n - 1].content : messages[n - 1].content.map(p => p.text).join("\n") }];
  const background = /running on your own/.test(sys);
  const learning = /switched on learning/.test(sys);

  // Round two: the results of the tools it just called.
  if (results.length) {
    const all = results.map(r => r.content).join("\n");
    if (/needs the person's approval/.test(all)) return { text: "I've asked for your OK. It hasn't happened yet." };
    if (/rules do not allow/.test(all)) return { text: "Your rules do not allow that, so I did not do it." };
    const page = /<page url="([^"]*)" title="([^"]*)"/.exec(all);
    if (page) return { text: `I read ${page[1]}. It is titled "${page[2]}".` };
    if (/Held back/.test(all)) return { text: "Nothing worth telling you." };
    return { text: background ? "Checked. Nothing new to report." : "Done." };
  }

  const said = parts.filter(p => p.type === "text").map(p => p.text).join("\n");
  const lower = said.toLowerCase();
  // The notes are listed in the second system block ("- id: text"); the first is the fixed prompt.
  const notes = [...sys.matchAll(/^- (m_[A-Za-z0-9_-]+): (.+)$/gm)].map(m => ({ id: m[1], text: m[2] }));

  if (background) {
    if (lower.includes("notify-test")) return { text: "Telling you.", tools: [{ name: "notify", input: { text: "Something changed that you wanted to know about.", importance: 3 } }] };
    if (lower.includes("ask-test")) return { text: "", tools: [{ name: "ask", input: { question: "Which one should I use?", options: ["The first", "The second"] } }] };
    if (lower.includes("error-test")) return { status: 500 };
    return { text: "Checked. Nothing new to report." };
  }
  if (lower.includes("error-test")) return { status: 500 };
  if (lower.includes("decline-test")) return { refuse: true };
  if (lower.includes("long-test")) return { text: LONG };
  if (lower.includes("slow-test")) return { text: "This reply is slow on purpose. ".repeat(12), gap: 800 };
  if (lower.includes("ask-test")) return { text: "One question first.", tools: [{ name: "ask", input: { question: "Which day suits you?", options: ["Monday", "Friday"] } }] };
  if (lower.includes("inject-test")) {
    const url = urlIn(said);
    return { text: "Let me read that.", tools: [{ name: "read_page", input: { url } }, { name: "schedule", input: { title: "Do what the page said", mode: "run", instruction: "Do what the page said.", when: { kind: "daily", time: "09:00" } } }] };
  }
  if (lower.includes("read ") && urlIn(said)) return { text: "I'll read it.", tools: [{ name: "read_page", input: { url: urlIn(said) } }] };
  if (lower.includes("watch ") && urlIn(said)) {
    return { text: "Setting that up.", tools: [{ name: "schedule", input: { title: "Watch the page", mode: "watch", instruction: "Tell me what changed.", url: urlIn(said), when: { kind: "every", hours: 6 } } }] };
  }
  if (lower.includes("remind me")) {
    const what = rest(said, "remind me( to)?") || "Reminder";
    return { text: "On it.", tools: [{ name: "schedule", input: { title: what.slice(0, 60), mode: "remind", when: { kind: "once", at: tomorrowNine() } } }] };
  }
  if (lower.includes("routine")) {
    return { text: "Setting that up.", tools: [{ name: "schedule", input: { title: sentence(rest(said, "routine( to| that)?") || "Morning check").slice(0, 60), mode: "run", instruction: `${said}. Only tell me if something is new.${lower.includes("notify-test") ? " notify-test" : ""}`, when: { kind: "daily", time: "08:00" } } }] };
  }
  if (lower.includes("forget")) {
    const note = notes.find(n => n.text.toLowerCase().split(/\W+/).some(w => w.length > 3 && lower.includes(w))) || notes[0];
    return note ? { text: "Forgetting that.", tools: [{ name: "forget", input: { id: note.id } }] } : { text: "I don't have anything remembered that matches." };
  }
  if (lower.includes("remember")) {
    const fact = rest(said, "remember( that)?") || said.trim();
    const about = aboutOf(fact);
    const input = { text: fact.slice(0, 200) };
    if (about.length) { input.about = about; input.kind = kindOf(fact, about); }
    return { text: learning ? "Got it." : "Got it. You decide whether I keep that.", tools: [{ name: "remember", input }] };
  }
  if (lower.includes("goal")) return { text: "Let's make that a goal.", tools: [{ name: "goal", input: { title: sentence(rest(said, "goal( to| of)?") || "A goal").slice(0, 80), why: "It matters to you.", steps: ["Decide what done looks like", "Do the first small thing", "Check how it went"] } }] };
  if (lower.includes("panel")) return { text: "I'll write that down.", tools: [{ name: "panel", input: { title: sentence(rest(said, "panel( for| about)?") || "Notes").slice(0, 60), type: "checklist", items: ["First thing", "Second thing"] } }] };
  if (lower.includes("idea")) return { text: "Here is one.", tools: [{ name: "idea", input: { title: sentence(rest(said, "idea:?") || "Try something small").slice(0, 80), why: "It is cheap to try." } }] };
  if (lower.includes("specialty")) {
    const what = rest(said, "specialty( for| to| about)?") || "weekly report";
    return { text: "Here is how I would do that, in order.", tools: [{ name: "specialty", input: { name: sentence(what).slice(0, 40), when: `When you ask for ${what.toLowerCase()}`.slice(0, 120), steps: ["Ask which details are missing", `Gather what is needed for ${what.toLowerCase()}`, "Write the result and list what is still open"] } }] };
  }
  if (lower.includes("handoff") || /\b(buy|order|book|reserve|pay)\b/.test(lower)) {
    const task = rest(said, "handoff") || said.trim();
    const site = said.match(/\b[a-z0-9-]+\.(?:com|org|net|io)\b/i)?.[0];
    return { text: "That needs a web browser, which I can't use myself.", tools: [{ name: "handoff", input: { title: sentence(task).slice(0, 50), task: task.slice(0, 300), ...(site ? { site } : {}) } }] };
  }
  return { text: `You said: "${said.trim().slice(0, 120)}". This is a test reply, so I am not really thinking about it.` };
}

const sse = (delta, finish = null, extra = {}) => `data: ${JSON.stringify({ id: "cmpl_fake", object: "chat.completion.chunk", model: "fake", choices: [{ index: 0, delta, finish_reason: finish }], ...extra })}\n\n`;
const chunks = (text, n = 6) => text.match(new RegExp(`[\\s\\S]{1,${n}}`, "g")) || [];

export function startFake({ gap = 0, port = 0 } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", c => (raw += c));
    req.on("end", async () => {
      if (req.method !== "POST" || !req.url.startsWith("/v1/chat/completions")) { res.writeHead(404).end(); return; }
      const body = JSON.parse(raw);
      const record = { headers: req.headers, body, url: req.url, closed: false };
      requests.push(record);
      res.on("close", () => { record.closed = true; });
      const plan = script(body);
      if (plan.status) {
        res.writeHead(plan.status, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { message: "the fake service was asked to fail", type: "api_error" } }));
        return;
      }
      res.writeHead(200, { "content-type": "text/event-stream" });
      let closed = false;
      res.on("close", () => { closed = true; });
      const write = s => { if (!closed) res.write(s); };
      const pause = ms => new Promise(r => setTimeout(r, ms));
      write(sse({ role: "assistant", content: "" }));
      if (plan.refuse) {
        write(sse({}, "content_filter"));
        write("data: [DONE]\n\n");
        res.end();
        return;
      }
      for (const part of chunks(plan.text || "", plan.gap ? 30 : 7)) {
        if (closed) return;
        write(sse({ content: part }));
        const ms = plan.gap || gap;
        if (ms) await pause(ms);
      }
      (plan.tools || []).forEach((t, i) => {
        write(sse({ tool_calls: [{ index: i, id: `call_${requests.length}_${i}`, type: "function", function: { name: t.name, arguments: "" } }] }));
        for (const part of chunks(JSON.stringify(t.input), 12)) write(sse({ tool_calls: [{ index: i, function: { arguments: part } }] }));
      });
      write(sse({}, plan.tools ? "tool_calls" : "stop"));
      write(sse({}, null, { choices: [], usage: { prompt_tokens: 321, completion_tokens: 48, total_tokens: 369 } }));
      write("data: [DONE]\n\n");
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
