/* The one place the model is called. A model here is a function

     ({ system, messages, tools, signal, onText, effort }) -> { content, stop_reason, usage }

   so the engine can be tested with a scripted one. The engine keeps its
   conversation as content blocks (text, tool_use, tool_result); the model
   service speaks chat completions, so this file translates both ways and
   hands back blocks the engine can pass to the next round untouched. */

const BASE = "https://api.inceptionlabs.ai/v1";
const MODEL = "mercury-3";
const MAX_TOKENS = 16000;            // one round, reasoning included; also the cost ceiling
const EFFORTS = new Set(["instant", "low", "medium", "high"]);

class ModelError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function problem(e) {
  if (e?.status === 429) return { code: "busy", message: "Roxan is busy right now. Try again in a moment." };
  if (e instanceof TypeError || e?.name === "TimeoutError") return { code: "unreachable", message: "Roxan could not reach its model. Try again in a moment." };
  return { code: "unavailable", message: "Roxan is not available right now." };
}

// The engine's blocks, as chat messages: a tool result is a message of its own, and a call rides on the assistant's turn.
export function wire(system, messages) {
  const out = [{ role: "system", content: typeof system === "string" ? system : system.map(b => b.text).join("\n\n") }];
  for (const m of messages) {
    const parts = typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content;
    if (m.role === "assistant") {
      const text = parts.filter(p => p.type === "text").map(p => p.text).join("");
      const calls = parts.filter(p => p.type === "tool_use").map(p => ({ id: p.id, type: "function", function: { name: p.name, arguments: JSON.stringify(p.input ?? {}) } }));
      out.push({ role: "assistant", content: text || (calls.length ? null : ""), ...(calls.length ? { tool_calls: calls } : {}) });
      continue;
    }
    for (const p of parts) if (p.type === "tool_result") out.push({ role: "tool", tool_call_id: p.tool_use_id, content: (p.is_error ? "Error: " : "") + (typeof p.content === "string" ? p.content : JSON.stringify(p.content)) });
    const rest = parts.filter(p => p.type !== "tool_result");
    if (!rest.length) continue;
    out.push({ role: "user", content: rest.map(p => p.text).join("\n") });
  }
  return out;
}

const parse = s => { try { return JSON.parse(s || "{}"); } catch { return {}; } };

export function realModel(env) {
  const url = `${(env.ROXAN_MODEL_URL || BASE).replace(/\/$/, "")}/chat/completions`;
  const model = env.ROXAN_MODEL || MODEL;

  async function once(body, signal, onText) {
    let spoke = false;
    try {
      const res = await fetch(url, {
        method: "POST", body: JSON.stringify(body),
        headers: { authorization: `Bearer ${env.ROXAN_MODEL_KEY}`, "content-type": "application/json" },
        signal: AbortSignal.any([AbortSignal.timeout(120_000), ...(signal ? [signal] : [])]),
      });
      if (!res.ok) throw new ModelError(res.status, `the model service answered ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "", text = "", finish = null, usage = {};
      const calls = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        for (let nl; (nl = buf.indexOf("\n")) >= 0;) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:") || line.slice(5).trim() === "[DONE]") continue;
          let c;
          try { c = JSON.parse(line.slice(5)); } catch { continue; }
          if (c.error) throw new ModelError(500, `the model service failed mid-reply: ${String(c.error.message || "").slice(0, 200)}`);
          if (c.usage) usage = c.usage;
          const ch = c.choices?.[0];
          if (!ch) continue;
          if (ch.delta?.content) { text += ch.delta.content; spoke = true; onText?.(ch.delta.content); }
          for (const t of ch.delta?.tool_calls || []) {
            const k = (calls[t.index ?? 0] ||= { id: "", name: "", args: "" });
            if (t.id) k.id = t.id;
            if (t.function?.name) k.name += t.function.name;
            if (t.function?.arguments) k.args += t.function.arguments;
          }
          if (ch.finish_reason) finish = ch.finish_reason;
        }
      }
      const uses = calls.filter(k => k.name).map((k, i) => ({ type: "tool_use", id: k.id || `call_${i}`, name: k.name, input: parse(k.args) }));
      return {
        content: [...(text ? [{ type: "text", text }] : []), ...uses],
        stop_reason: finish === "length" ? "max_tokens" : finish === "content_filter" ? "refusal" : uses.length ? "tool_use" : "end_turn",
        usage: { in: usage.prompt_tokens || 0, out: usage.completion_tokens || 0 },
      };
    } catch (e) { e.spoke = spoke; throw e; }
  }

  return async function call({ system, messages, tools, signal, onText, effort = "medium", maxTokens = MAX_TOKENS }) {
    const body = {
      model, messages: wire(system, messages), stream: true, stream_options: { include_usage: true },
      max_completion_tokens: maxTokens, reasoning_effort: EFFORTS.has(effort) ? effort : "medium",
      ...(tools?.length ? { tools: tools.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })) } : {}),
    };
    try { return await once(body, signal, onText); }
    catch (e) {
      // One more try for a service that hiccuped before it said anything.
      if (!e.spoke && !signal?.aborted && (e.status >= 500 || e instanceof TypeError)) { await new Promise(r => setTimeout(r, 500)); return once(body, signal, onText); }
      throw e;
    }
  };
}
