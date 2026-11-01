/* What the agent tests share: a SQLite that answers like a Durable Object's, a
   clock the test moves by hand, a scripted model, and a Core wired to them. */
import { DatabaseSync } from "node:sqlite";
import { Store } from "../agent/db.js";
import { Core } from "../agent/core.js";

export const sqlite = () => {
  const db = new DatabaseSync(":memory:");
  return { exec: (q, ...b) => { const rows = db.prepare(q).all(...b); return { toArray: () => rows }; } };      // runs at once, like the real one
};

// A model that answers from a list, one entry per call. An entry is a response, or a function of the request.
export const text = t => ({ content: [{ type: "text", text: t }], stop_reason: "end_turn", usage: { in: 100, out: 10 } });
export const tools = (calls, t = "") => ({
  content: [...(t ? [{ type: "text", text: t }] : []), ...calls.map(([name, input], i) => ({ type: "tool_use", id: `tu_${name}_${i}`, name, input }))],
  stop_reason: "tool_use", usage: { in: 100, out: 10 },
});

export function scripted(list) {
  const calls = [];
  const model = async req => {
    calls.push(structuredClone({ system: req.system, messages: req.messages, tools: req.tools.map(t => t.name), effort: req.effort }));
    const next = list.shift();
    if (!next) throw new Error("the scripted model was called more times than expected");
    const r = typeof next === "function" ? await next(req) : next;
    if (r instanceof Error) throw r;
    for (const b of r.content) if (b.type === "text") req.onText?.(b.text);
    return r;
  };
  model.calls = calls;
  model.push = (...more) => list.push(...more);
  return model;
}

// A model that waits until it is aborted, as a long answer does.
export const hangs = () => req => new Promise((_, reject) => req.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true }));

export const START = Date.UTC(2026, 10, 1, 9, 0);          // Sunday 1 Nov 2026, 09:00 UTC

export function make({ model = scripted([]), fetcher, env = { ROXAN_MODEL_KEY: "k", ROXAN_INVITE: "code" }, tz = "UTC", settings = {} } = {}) {
  const t = { now: START };
  const events = [], alarms = [];
  const store = new Store(sqlite(), () => t.now);
  const core = new Core({
    store, env, model, fetcher: fetcher ?? (async () => { throw new Error("no network in tests"); }),
    clock: () => t.now, emit: m => events.push(m), alarm: at => alarms.push(at),
  });
  core.settings({ tz, ...settings });
  events.length = 0;
  return {
    core, store, events, alarms, t, model,
    advance: ms => { t.now += ms; },
    sent: type => events.filter(e => e.t === type),
    idle: async () => { while (core.active.size) await Promise.all([...core.active.values()].map(r => r.done)); },
  };
}

export const page = (html, { status = 200, type = "text/html" } = {}) => new Response(html, { status, headers: { "content-type": type } });
