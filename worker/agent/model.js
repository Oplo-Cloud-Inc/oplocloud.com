/* The one place the model is called. A model here is a function

     ({ system, messages, tools, signal, onText, effort }) -> { content, stop_reason, usage }

   so the engine can be tested with a scripted one. `content` is handed back to
   the model untouched on the next round, as the API requires. */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 16000;            // one round, thinking included; also the cost ceiling
// The refusal fallback is a beta of the model's API and only some models take it. If ROXAN_MODEL names one that does not,
// the first call is refused with a 400 and the call is made again without it.
const BETAS = ["server-side-fallback-2026-07-01"];

export function problem(e) {
  if (e instanceof Anthropic.RateLimitError) return { code: "busy", message: "Roxan is busy right now. Try again in a moment." };
  if (e instanceof Anthropic.APIConnectionError) return { code: "unreachable", message: "Roxan could not reach its model. Try again in a moment." };
  return { code: "unavailable", message: "Roxan is not available right now." };
}

export function realModel(env) {
  const client = new Anthropic({ apiKey: env.ROXAN_MODEL_KEY, baseURL: env.ROXAN_MODEL_URL || undefined, maxRetries: 1, timeout: 120_000 });
  const model = env.ROXAN_MODEL || MODEL;

  async function once(body, signal, onText) {
    const stream = client.beta.messages.stream(body, { signal });
    let spoke = false;
    try {
      for await (const e of stream) if (e.type === "content_block_delta" && e.delta.type === "text_delta") { spoke = true; onText?.(e.delta.text); }
      const m = await stream.finalMessage(), u = m.usage || {};
      return { content: m.content, stop_reason: m.stop_reason, usage: { in: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0), out: u.output_tokens || 0 } };
    } catch (e) { e.spoke = spoke; throw e; }
  }

  return async function call({ system, messages, tools, signal, onText, effort = "medium", maxTokens = MAX_TOKENS }) {
    const body = { model, max_tokens: maxTokens, system, tools, messages };
    try {
      return await once({ ...body, output_config: { effort }, betas: BETAS, fallbacks: "default" }, signal, onText);
    } catch (e) {
      if (e?.status === 400 && !e.spoke && !signal?.aborted) return once(body, signal, onText);
      throw e;
    }
  };
}
