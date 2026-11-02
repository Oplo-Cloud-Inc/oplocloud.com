/* Signing in with an Oplo Account. The password is typed on auth.oplocloud.com, in a tab of its own, by the script every
   Oplo service shares (connect.js), and this page never sees it. When that tab says it is done, this page asks
   api.oplocloud.com/connect/roxan, which is sent the Oplo session and answers with a ticket that is good for a minute,
   and trades the ticket at /api/session for Roxan's own cookie. The ticket is tied to a nonce made here, so a copy of it
   is no use to anyone else. */
import * as api from "./api.js";

// In development the sign-in page is beside this server on :8788 and the accounts service stands in on :8787
// (worker/test/fake-accounts.js); this server answers the bridge itself.
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const SCRIPT = LOCAL ? `http://${location.hostname}:8788/connect.js` : "https://auth.oplocloud.com/connect.js";
const BRIDGE = LOCAL ? "/connect/roxan" : "https://api.oplocloud.com/connect/roxan";

// The shared script, loaded when the sign-in screen is shown and never otherwise. Resolves to its OploSignIn.
let loading = null;
export function load() {
  return (loading ||= new Promise((ok, no) => {
    const s = document.createElement("script");
    const fail = () => { loading = null; s.remove(); no(new api.ApiError("The Oplo sign-in page could not be reached. Check your connection and try again.", 0, "offline")); };
    s.onload = () => (window.OploSignIn ? ok(window.OploSignIn) : fail());
    s.onerror = fail;
    s.src = SCRIPT;
    document.head.append(s);
  }));
}

const nonce = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18)))).replace(/\+/g, "-").replace(/\//g, "_");

// A ticket for this Oplo session, if there is one. The session cookie goes along on its own: it is the accounts service's.
async function ticket(n) {
  let res;
  try { res = await fetch(BRIDGE, { method: "POST", credentials: "include", headers: { "x-roxan-nonce": n } }); }
  catch { throw new api.ApiError("Oplo Accounts could not be reached. Check your connection and try again.", 0, "offline"); }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ticket) throw new api.ApiError(data?.error?.message || "Signing in did not work. Try again.", res.status, data?.error?.code || "");
  return data.ticket;
}

// Trades the Oplo sign-in for Roxan's: afterwards this browser holds Roxan's cookie.
export async function signIn() {
  const n = nonce();
  await api.exchange(await ticket(n), n);
}

// Is there an Oplo session? connect.js asks when the sign-in tab closes without saying how it went.
export const signedIn = () => ticket(nonce()).then(() => true, () => false);
