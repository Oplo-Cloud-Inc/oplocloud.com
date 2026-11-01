/* Roxan's server, as the page sees it. Every call goes to this address with the
   signed cookie that signing in sets. The page holds no secret: the invite code
   is typed once, traded for the cookie, and forgotten. */
import { emit } from "./dom.js";

export class ApiError extends Error {
  constructor(message, status = 0, code = "") { super(message); this.status = status; this.code = code; }
}

async function send(method, url, body, signal) {
  let res;
  try {
    res = await fetch(url, { method, signal, credentials: "same-origin", headers: body === undefined ? undefined : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError("Roxan could not be reached. Check your connection and try again.", 0, "offline");
  }
  let data = null;
  try { data = await res.json(); } catch { /* an empty answer */ }
  if (!res.ok) {
    if (res.status === 401 && url !== "/api/session") emit("signedout");
    throw new ApiError(data?.error?.message || "Something went wrong. Try again.", res.status, data?.error?.code || "");
  }
  return data;
}

export const get = (path, signal) => send("GET", "/api" + path, undefined, signal);
export const post = (path, body = {}, signal) => send("POST", "/api" + path, body, signal);
export const put = (path, body) => send("PUT", "/api" + path, body);
export const patch = (path, body) => send("PATCH", "/api" + path, body);
export const del = path => send("DELETE", "/api" + path);

// Is Roxan open, and is this browser signed in? A failure to ask is an answer too.
export const health = () => send("GET", "/api/health").catch(e => ({ ok: false, offline: e.code === "offline" }));
export const signIn = code => send("POST", "/api/session", { code });
export const signOut = () => send("DELETE", "/api/session");
