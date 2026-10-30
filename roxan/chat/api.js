/* The gateway client: is it open, and one streamed reply. */

export class GatewayError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

// { state: "open" | "closed" | "busy" | "offline", access: true | false | undefined }
export async function health(invite) {
  try {
    const res = await fetch("/api/health", { cache: "no-store", headers: invite == null ? {} : { "x-roxan-invite": invite } });
    if (res.status === 429) return { state: "busy" };
    if (!res.ok) return { state: "offline" };
    const j = await res.json();
    return { state: j.gateway === "open" ? "open" : "closed", access: j.access };
  } catch {
    return { state: "offline" };
  }
}

// Posts one conversation, calls onEvent for each event of the reply, resolves when it ends.
export async function stream(body, invite, signal, onEvent) {
  let res;
  try {
    res = await fetch("/api/chat", { method: "POST", signal, headers: { "content-type": "application/json", "x-roxan-invite": invite }, body: JSON.stringify(body) });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new GatewayError(0, "offline", navigator.onLine ? "Roxan could not be reached." : "You are offline.");
  }
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new GatewayError(res.status, j?.error?.code || "http", j?.error?.message || `The gateway answered ${res.status}.`);
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const line = block.split("\n").find(l => l.startsWith("data: "));
      if (line) { try { onEvent(JSON.parse(line.slice(6))); } catch (e) { if (e instanceof SyntaxError) continue; throw e; } }
    }
  }
}
