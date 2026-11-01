/* Who is asking. An invite code is one person's key: it names their account and
   nothing else about them. Signing in trades the code for a signed cookie that
   JavaScript on the page cannot read, so the code itself is typed once and not
   kept in the browser.

   The account is a hash of the code, so removing a code from ROXAN_INVITE
   locks that account out at once (its data stays until deleted). The cookie is
   signed with a key made from the invite list. */
import { sha256 } from "./util.js";

export const COOKIE = "rx_s";
const WEEKS = 4, MAX_AGE = WEEKS * 7 * 86400;
const enc = new TextEncoder();

export const codes = env => String(env.ROXAN_INVITE || "").split(",").map(c => c.trim()).filter(Boolean);
export const account = code => sha256("roxan-account|" + String(code).trim()).then(h => h.slice(0, 32));

// Constant-time, so a wrong code does not reveal how much of it was right.
function same(a, b) {
  let d = a.length ^ b.length;
  for (let i = 0, n = Math.max(a.length, b.length); i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

const accounts = new Map();                               // the invite list → its accounts, so a request does not hash every code
async function allowed(env) {
  const key = String(env.ROXAN_INVITE || "");
  if (!accounts.has(key)) { if (accounts.size > 8) accounts.clear(); accounts.set(key, new Set(await Promise.all(codes(env).map(account)))); }
  return accounts.get(key);
}

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const hmac = (env, usage) => crypto.subtle.importKey("raw", enc.encode("roxan-session|" + env.ROXAN_INVITE), { name: "HMAC", hash: "SHA-256" }, false, [usage]);

// The account for this code, or null. Every configured code is compared, so timing does not say which one matched.
export async function accountFor(given, env) {
  let found = false;
  for (const c of codes(env)) found = same(c, String(given).trim()) || found;
  return found && String(given).trim() ? account(given) : null;
}

export async function token(acct, env, now = Date.now()) {
  const body = `${acct}.${Math.floor(now / 1000) + MAX_AGE}`;
  return `${body}.${b64(await crypto.subtle.sign("HMAC", await hmac(env, "sign"), enc.encode(body)))}`;
}

// The account in this request's cookie, if the cookie is genuine, unexpired and its code is still on the list.
export async function who(request, env, now = Date.now()) {
  const raw = /(?:^|;\s*)rx_s=([^;]+)/.exec(request.headers.get("cookie") || "")?.[1];
  const [acct, exp, sig] = (raw || "").split(".");
  if (!acct || !exp || !sig || Number(exp) * 1000 < now) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await hmac(env, "verify"), unb64(sig), enc.encode(`${acct}.${exp}`)))) return null;
  } catch { return null; }
  return (await allowed(env)).has(acct) ? acct : null;
}

export const cookie = (value, request) => `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${value ? MAX_AGE : 0}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
