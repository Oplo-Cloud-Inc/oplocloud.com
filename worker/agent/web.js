/* Reading a public web page for a person: what a browser would show them as
   text, nothing more. Only plain http(s) addresses on the open internet are
   read. Anything that names a machine rather than a site (an address made of
   numbers, localhost, a port, a name with no dot, a login in the address) is
   refused, and so is every redirect that lands on one. The page is capped in
   size and time, and comes back as text for the model to read as data. */
import { Invalid, sha256 } from "./util.js";

const AGENT = "RoxanReader/1.0 (+https://roxan.oplocloud.com/help/)";
const MAX_BYTES = 1_500_000, MAX_HTML = 800_000, MAX_TEXT = 12_000, HOPS = 3;
const TEXTY = /^(text\/|application\/(xhtml\+xml|xml|json|rss\+xml|atom\+xml))/i;

export function check(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { throw new Invalid("That is not a web address."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Invalid("Roxan only reads http and https addresses.");
  if (u.username || u.password) throw new Invalid("An address with a login in it is not read.");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Invalid("Only the usual web ports are read.");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")
    || /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(host)) throw new Invalid("Roxan reads public websites, not machines or private networks.");
  return u;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; }
  return ENTITIES[e.toLowerCase()] ?? m;
});

// What a person would read on the page: no scripts, styles or markup, with the page's blocks on lines of their own.
export function readable(html) {
  let t = String(html).slice(0, MAX_HTML);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(t)?.[1] ?? "";
  t = t.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|noscript|svg|template|head|iframe)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/?(br|p|div|ul|ol|h[1-6]|tr|table|section|article|header|footer|nav|main|blockquote|pre|hr)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ");
  t = decode(t).replace(/[ \t\f\v ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { title: decode(title).replace(/\s+/g, " ").trim().slice(0, 200), text: t };
}

async function body(res) {
  const reader = res.body.getReader(), chunks = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    chunks.push(value);
    if (n > MAX_BYTES) { await reader.cancel(); break; }
  }
  const all = new Uint8Array(Math.min(n, MAX_BYTES));
  let at = 0;
  for (const c of chunks) { const part = c.subarray(0, all.length - at); all.set(part, at); at += part.length; if (at >= all.length) break; }
  return new TextDecoder("utf-8", { fatal: false }).decode(all);
}

// { url, title, text, hash, truncated } or an Invalid that says why not.
export async function fetchPage(raw, { fetcher = fetch, signal } = {}) {
  let u = check(raw), res;
  for (let hop = 0; ; hop++) {
    try {
      res = await fetcher(u.href, { redirect: "manual", headers: { "user-agent": AGENT, accept: "text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.1" }, signal: AbortSignal.any([AbortSignal.timeout(10_000), ...(signal ? [signal] : [])]) });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new Invalid("That page could not be reached.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= HOPS) throw new Invalid("That address redirects too many times.");
      try { u = check(new URL(res.headers.get("location"), u).href); } finally { res.body?.cancel?.(); }
      continue;
    }
    break;
  }
  if (!res.ok) { res.body?.cancel?.(); throw new Invalid(`That page answered ${res.status}.`); }
  const type = res.headers.get("content-type") || "text/plain";
  if (!TEXTY.test(type)) { res.body?.cancel?.(); throw new Invalid("Roxan reads pages of text, not files of that kind."); }
  const raw_ = await body(res);
  const { title, text } = /html|xml/i.test(type) ? readable(raw_) : { title: "", text: raw_.trim() };
  return { url: u.href, title, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT, hash: await sha256(text.slice(0, MAX_TEXT)) };
}
