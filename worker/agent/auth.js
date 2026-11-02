/* Who is asking. There are two ways in, and either way the account is a hash and nothing else about the person.

   An Oplo Account is how people come in. They sign in on auth.oplocloud.com; worker/agent/connect.js trades that
   session for a ticket that is good for a minute, and /api/session trades the ticket for a cookie of Roxan's own.
   Roxan keeps a hash of the account's id: not the name, the email or the session. ROXAN_SECRET signs the tickets and
   these cookies (without it this way in is off), and ROXAN_DENY, a list of Oplo account ids, shuts an account out at once.

   An invite code is one person's key, kept for the owner. Its account is a hash of the code, so removing a code from
   ROXAN_INVITE locks that account out at once (its data stays until deleted), and its cookies are signed with a key made
   from the invite list.

   Either way the cookie is signed, and JavaScript on the page cannot read it. */
import { sha256 } from "./util.js";

export const COOKIE = "rx_s";
const DAYS = { invite: 28, oplo: 7 };                     // an Oplo sign-in is shorter: a shared computer should not stay signed in for a month
const TICKET_SECONDS = 60;
const enc = new TextEncoder();

const split = raw => String(raw || "").split(",").map(c => c.trim()).filter(Boolean);
export const codes = env => split(env.ROXAN_INVITE);
export const account = code => sha256("roxan-account|" + String(code).trim()).then(h => h.slice(0, 32));
// An Oplo account here starts with "u", which no invite code's account can: those are hex.
export const oploAccount = id => sha256("roxan-oplo|" + String(id)).then(h => "u" + h.slice(0, 31));
const isOplo = acct => acct[0] === "u";
export const maxAge = acct => DAYS[isOplo(acct) ? "oplo" : "invite"] * 86400;

// A short or missing secret counts as none: a forged cookie must never be checked against a key anybody can guess.
const secret = env => (String(env.ROXAN_SECRET || "").length >= 32 ? String(env.ROXAN_SECRET) : null);
export const oploOn = env => Boolean(secret(env));

// Constant-time, so a wrong code does not reveal how much of it was right.
function same(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0, n = Math.max(a.length, b.length); i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

const lists = new Map();                                  // a list from the environment → its accounts, so a request does not hash every entry
async function accountsIn(kind, raw, hash) {
  const key = kind + "|" + String(raw || "");
  if (!lists.has(key)) { if (lists.size > 8) lists.clear(); lists.set(key, new Set(await Promise.all(split(raw).map(hash)))); }
  return lists.get(key);
}
const allowed = env => accountsIn("invite", env.ROXAN_INVITE, account);
export const blocked = async (acct, env) => (await accountsIn("deny", env.ROXAN_DENY, oploAccount)).has(acct);

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const hmac = (key, usage) => crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
const sessionKey = (acct, env) => (isOplo(acct) ? secret(env) && "roxan-session|oplo|" + secret(env) : "roxan-session|" + env.ROXAN_INVITE);

// The account for this code, or null. Every configured code is compared, so timing does not say which one matched.
export async function accountFor(given, env) {
  let found = false;
  for (const c of codes(env)) found = same(c, String(given).trim()) || found;
  return found && String(given).trim() ? account(given) : null;
}

export async function token(acct, env, now = Date.now()) {
  const body = `${acct}.${Math.floor(now / 1000) + maxAge(acct)}`;
  return `${body}.${b64(await crypto.subtle.sign("HMAC", await hmac(sessionKey(acct, env), "sign"), enc.encode(body)))}`;
}

// The account in this request's cookie, if the cookie is genuine, unexpired and its account is still let in.
export async function who(request, env, now = Date.now()) {
  const raw = /(?:^|;\s*)rx_s=([^;]+)/.exec(request.headers.get("cookie") || "")?.[1];
  const [acct, exp, sig] = (raw || "").split(".");
  if (!acct || !exp || !sig || Number(exp) * 1000 < now) return null;
  const key = sessionKey(acct, env);
  if (!key) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await hmac(key, "verify"), unb64(sig), enc.encode(`${acct}.${exp}`)))) return null;
  } catch { return null; }
  if (isOplo(acct)) return (await blocked(acct, env)) ? null : acct;
  return (await allowed(env)).has(acct) ? acct : null;
}

export const cookie = (value, request, age = 0) => `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${value ? age : 0}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;

/* The ticket: an Oplo account's id, the page's nonce and a deadline, signed. The nonce is made by the page that asked and
   goes with the ticket when it is redeemed, so a ticket copied from the wire is no use to anyone who did not ask for it. */
export const nonceOk = n => typeof n === "string" && /^[\w-]{16,64}$/.test(n);
const ticketKey = (env, usage) => hmac("roxan-ticket|" + secret(env), usage);

export async function ticket(sub, nonce, env, now = Date.now()) {
  if (!secret(env) || !nonceOk(nonce)) throw new Error("A ticket needs the secret and a nonce.");
  const body = b64(enc.encode(JSON.stringify({ sub: String(sub), nonce, exp: Math.floor(now / 1000) + TICKET_SECONDS })));
  return `${body}.${b64(await crypto.subtle.sign("HMAC", await ticketKey(env, "sign"), enc.encode(body)))}`;
}

// The Oplo account id a genuine, unexpired ticket was made for with this nonce, or null.
export async function redeem(given, nonce, env, now = Date.now()) {
  if (!secret(env) || !nonceOk(nonce) || typeof given !== "string") return null;
  const [body, sig] = given.split(".");
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await ticketKey(env, "verify"), unb64(sig), enc.encode(body)))) return null;
    const t = JSON.parse(new TextDecoder().decode(unb64(body)));
    return Number(t.exp) * 1000 >= now && same(t.nonce, nonce) && typeof t.sub === "string" && t.sub ? t.sub : null;
  } catch { return null; }
}
