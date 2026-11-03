/* Roxan's cloud browser: a real browser in the cloud, used one lookup at a time. Two calls to the service, both plain
   HTTPS with the API key in a header and no session to start or stop: a web search (titles and addresses) and a page opened
   and read as text (its JavaScript run, so it works where a plain fetch gets an empty shell). Nothing of the person's goes
   out, only a query or a public address. Both go through the Core's fetcher, so tests need no network. */
import { Invalid } from "./util.js";
import { readable } from "./web.js";

const API = "https://api.browserbase.com";
const MAX_TEXT = 12_000, RESULTS = 8;
const TEXTY = /^(text\/|application\/(xhtml\+xml|xml|json|rss\+xml|atom\+xml))/i;

// BROWSERBASE_URL points both calls at one place, for the local stand-in.
const where = env => (env.BROWSERBASE_URL || API).replace(/\/$/, "");
const unavailable = (what, status) => { console.error("roxan browser", what, status ?? ""); return new Invalid("The cloud browser is not available right now."); };      // never the content

async function post(env, path, body, ms, { fetcher = fetch, signal } = {}) {
  try {
    return await fetcher(`${where(env)}${path}`, {
      method: "POST", headers: { "x-bb-api-key": env.BROWSERBASE_API_KEY, "content-type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.any([AbortSignal.timeout(ms), ...(signal ? [signal] : [])]),
    });
  } catch (e) { if (signal?.aborted) throw e; throw unavailable(path, "unreachable"); }
}

// What the model is told when the service says no. The status is logged, never the key or the content.
function refused(path, status) {
  if (status === 402) return new Invalid("The cloud browser's allowance is used up for now.");
  if (status === 429) return new Invalid("The cloud browser is busy. Try again in a moment.");
  if (path === "/v1/fetch" && [403, 502, 504].includes(status)) return new Invalid("The cloud browser could not read that page.");
  return unavailable(path, status);
}

const tidy = (s, n) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);      // no angle brackets: a title must not be able to close the block it is shown in

// [{ title, url, date }]: the pages a search found.
export async function search(env, query, opts) {
  const res = await post(env, "/v1/search", { query, numResults: RESULTS }, 20_000, opts);
  if (!res.ok) { res.body?.cancel?.(); throw refused("/v1/search", res.status); }
  const b = await res.json().catch(() => ({}));
  return (Array.isArray(b.results) ? b.results : [])
    .map(r => ({ title: tidy(r?.title, 160), url: String(r?.url ?? ""), date: tidy(r?.publishedDate, 10) }))
    .filter(r => /^https?:\/\/[^\s<>"]+$/i.test(r.url)).slice(0, RESULTS);
}

// { url, text, truncated }: a page, opened in the cloud browser and read as text.
export async function page(env, url, opts) {
  const ask = format => post(env, "/v1/fetch", { url, format, allowRedirects: true }, 40_000, opts);
  let format = "markdown", res = await ask(format);
  if (res.status === 400) { res.body?.cancel?.(); res = await ask((format = "raw")); }      // markdown is only for HTML; plain text and JSON come back raw
  if (!res.ok) { res.body?.cancel?.(); throw refused("/v1/fetch", res.status); }
  const b = await res.json().catch(() => ({}));
  if (b.statusCode >= 400) throw new Invalid(`That page answered ${b.statusCode}.`);
  if (typeof b.content !== "string" || (b.contentType && !TEXTY.test(b.contentType))) throw new Invalid("Roxan reads pages of text, not files of that kind.");
  const text = (format === "raw" && /html|xml/i.test(b.contentType ?? "") ? readable(b.content).text : b.content).trim();
  return { url, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT };
}
