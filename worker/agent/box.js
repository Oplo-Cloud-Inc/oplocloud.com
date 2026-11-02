/* Roxan's cloud computer: a private, throwaway Linux machine with internet
   access, rented from a code-sandbox service for as long as one task needs it.
   The model writes a shell command, this runs it there and hands back what it
   printed. Nothing of the person's is on the machine, and it is thrown away when
   the task ends (core.shut), with a time limit on the service's side as a backstop.

   Two calls to the service: the control API starts and kills a machine, and the
   machine's own agent runs a command over Connect (a stream of length-prefixed
   JSON frames). Both go through the Core's fetcher, so tests need no network. */
import { Invalid } from "./util.js";

const API = "https://api.e2b.app", GATEWAY = "https://sandbox.e2b.app", PORT = "49983";
const TEMPLATE = "base", LIFE = 900;                      // seconds the service keeps a machine if nobody kills it
const READ = 200_000, STDOUT = 5000, STDERR = 2000;      // what is kept from a command, and what the model is shown of it

// E2B_URL points both halves at one place, for the local stand-in; unset, each goes to its own host.
const where = (env, own) => (env.E2B_URL || own).replace(/\/$/, "");
const unavailable = (what, status) => { console.error("roxan box", what, status ?? ""); return new Invalid("The cloud computer is not available right now."); };      // never the content

async function ask(fetcher, url, init, ms, signal) {
  try { return await fetcher(url, { ...init, signal: AbortSignal.any([AbortSignal.timeout(ms), ...(signal ? [signal] : [])]) }); }
  catch (e) { if (signal?.aborted) throw e; throw unavailable("unreachable"); }
}

// A new machine: { id, token }.
export async function open(env, { fetcher = fetch, signal } = {}) {
  const res = await ask(fetcher, `${where(env, API)}/v2/sandboxes`, {
    method: "POST", headers: { "x-api-key": env.E2B_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ templateID: TEMPLATE, timeout: LIFE, metadata: { app: "roxan" } }),
  }, 30_000, signal);
  if (res.status === 429) { res.body?.cancel?.(); throw new Invalid("The cloud computer is busy. Try again in a moment."); }
  if (!res.ok) { res.body?.cancel?.(); throw unavailable("open", res.status); }
  const b = await res.json().catch(() => ({}));
  if (!b.sandboxID) throw unavailable("open", "no id");
  return { id: String(b.sandboxID), token: b.envdAccessToken || "" };
}

export async function close(env, box, { fetcher = fetch } = {}) {
  try {
    const res = await fetcher(`${where(env, API)}/sandboxes/${encodeURIComponent(box.id)}`, { method: "DELETE", headers: { "x-api-key": env.E2B_API_KEY }, signal: AbortSignal.timeout(8000) });
    res.body?.cancel?.();
  } catch { /* the service's own time limit ends it */ }
}

const frame = json => {
  const body = new TextEncoder().encode(JSON.stringify(json)), out = new Uint8Array(5 + body.length);
  new DataView(out.buffer).setUint32(1, body.length);       // byte 0 is the flags (none); then the length, big-endian
  out.set(body, 5);
  return out;
};
const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/* Runs one command on the machine: { stdout, stderr, exit, timedOut, error }.
   A command that takes longer than `seconds` is given up on, with what it had printed so far. */
export async function run(env, box, { command, seconds }, { fetcher = fetch, signal } = {}) {
  const r = { stdout: "", stderr: "", exit: null, timedOut: false, error: null, cut: false };
  const ms = seconds * 1000, dec = { stdout: new TextDecoder(), stderr: new TextDecoder() }, json = new TextDecoder();
  const res = await ask(fetcher, `${where(env, GATEWAY)}/process.Process/Start`, {
    method: "POST", body: frame({ process: { cmd: "/bin/bash", args: ["-l", "-c", command] }, stdin: false }),
    headers: {
      "content-type": "application/connect+json", "connect-protocol-version": "1", "connect-timeout-ms": String(ms),
      "e2b-sandbox-id": box.id, "e2b-sandbox-port": PORT, ...(box.token ? { "x-access-token": box.token } : {}),
    },
  }, ms + 5000, signal);
  if (!res.ok) { res.body?.cancel?.(); throw unavailable("run", res.status); }

  const take = (which, b64) => {
    const s = dec[which].decode(bytes(b64), { stream: true });
    if (r.stdout.length + r.stderr.length >= READ) { r.cut = true; return; }
    r[which] += s;
  };
  const handle = (flags, msg) => {
    if (flags & 2) { if (msg.error) r.error = String(msg.error.message || msg.error.code || "failed").slice(0, 200); return; }
    const ev = msg.event || {};
    if (ev.data?.stdout) take("stdout", ev.data.stdout);
    if (ev.data?.stderr) take("stderr", ev.data.stderr);
    if (ev.end) { r.exit = ev.end.exitCode ?? 0; if (ev.end.error && !/^exit status -?\d+$/.test(ev.end.error)) r.error = String(ev.end.error).slice(0, 200); }      // the service repeats a bad exit code as an error
  };

  const reader = res.body.getReader();
  let buf = new Uint8Array(0);
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const joined = new Uint8Array(buf.length + value.length);
      joined.set(buf);
      joined.set(value, buf.length);
      buf = joined;
      while (buf.length >= 5) {
        const len = new DataView(buf.buffer, buf.byteOffset).getUint32(1);
        if (buf.length < 5 + len) break;
        let msg = {};
        try { msg = JSON.parse(json.decode(buf.subarray(5, 5 + len))); } catch { /* a frame we cannot read says nothing */ }
        handle(buf[0], msg);
        buf = buf.subarray(5 + len);
      }
    }
  } catch (e) {
    if (signal?.aborted) throw e;
    r.timedOut = true;                                        // the time ran out, or the stream broke
    reader.cancel().catch(() => {});
  }
  return r;
}

const head = (s, n) => (s.length <= n ? s : s.slice(0, n) + "\n… (the rest is cut)");
const tail = (s, n) => (s.length <= n ? s : "(the start is cut) …\n" + s.slice(-n));

// What the model is told a command did: the end of the error output matters most, the start of the normal output.
export function show(r, seconds) {
  const exit = r.timedOut ? `no exit code: stopped waiting after ${seconds} seconds` : r.exit == null ? "unknown" : String(r.exit);
  let t = `<output exit="${exit}"${r.cut ? ' cut="true"' : ""}>\n${head(r.stdout.trim(), STDOUT) || "(nothing printed)"}\n</output>`;
  if (r.stderr.trim()) t += `\n<errors>\n${tail(r.stderr.trim(), STDERR)}\n</errors>`;
  if (r.error) t += `\n<failure>${r.error}</failure>`;
  return t;
}
