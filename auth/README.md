# Oplo Account — auth.oplocloud.com

The one place anybody signs in to anything Oplo makes.

```
auth/
├─ wrangler.toml       — Worker config; auth.oplocloud.com as a custom domain
├─ index.js            — The Worker: page routing, security headers, OIDC discovery
└─ public/
   ├─ index.html       — The sign-in page (one document, views drawn by app.js)
   ├─ app.js           — Email → password, or "Continue as …"; then hands back
   ├─ auth.css         — The page's styles (oplocloud.com's tokens, copied)
   ├─ connect.js       — What every service loads to open this page in a tab
   └─ favicon.svg
```

---

## The rule

**Every Oplo service signs people in here, in a tab of its own.** No
service has a password field. A service loads one script and calls one
function from a click:

```html
<script src="https://auth.oplocloud.com/connect.js"></script>
```

```js
button.addEventListener("click", function () {
  OploSignIn.open({
    // optional: asked if the tab closes without saying it is done
    verify: function () { return myApi.me().then(() => true, () => false); }
  });
});

// after the refresh, once the service knows who is signed in:
OploSignIn.done();
```

---

## The flow

```
 service tab                                  auth.oplocloud.com tab
 ───────────                                  ──────────────────────
 click "Sign in"
 OploSignIn.open() ── window.open(/?return=<this address>) ──►  GET api/v1/me
 "Finish signing in on the                                      ├─ signed out: email → password
  Oplo Account tab" (pill)                                      │     POST api/v1/auth/login
                                                                │     (API sets its HttpOnly cookie)
                                                                └─ signed in: "Continue as …?"
                                                                ✓ You're signed in
             ◄── postMessage {type:"oplo:auth", action:"signed-in", next}
                 to the return address's origin only
 progress bar starts                                            opener.focus(); window.close()
 (tab comes forward)
 bar → 55%, sessionStorage flag, refresh
 after refresh: bar resumes at 62%,
 service asks GET api/v1/me → signed in → OploSignIn.done() → bar completes
```

- **The session is api.oplocloud.com's.** The page posts to the API
  directly (the API's `ALLOWED_ORIGINS` includes this host), so the
  HttpOnly cookie lands on api.oplocloud.com — the host every service
  already calls with `credentials: "include"`. No token, name or session
  is in the message; it says only "signed in, go to <address>". The
  service learns who signed in by asking the server after the refresh.
- **Who may be sent back to.** `?return=` is honoured only for an
  `https://*.oplocloud.com` address (not this host), or a localhost one
  when this page is itself on localhost. The name shown ("Continue to
  OEdu") comes from a list in app.js, never from the URL.
- **Fallbacks.** No tab allowed (popup blocker): the service's own tab
  goes to this page and is sent back afterwards. No opener (a plain
  link): the tab goes to the return address itself. Tab closed without a
  message: connect.js calls the service's `verify()`. A browser that
  won't let the tab close itself: the page says "You can close this tab"
  with a link back.

---

## Views

| Path | View |
|---|---|
| `/` | Sign in, or "Continue as …" with a session; with no `?return=`, the account page (who, OEdu, Sign out) |
| `/sign-in` | Same as `/` |
| `/recovery` | Passwords are reset by the organization's administrator |
| `/register` | Accounts are created by the organization |

Any other path without a file extension is the page too; anything that
looks like a file is looked up as one (404 if missing).

---

## Running locally

With the API on :8787 (connect.js and app.js look there, and for this
page on :8788, whenever they are served from localhost):

```bash
npx wrangler dev -c api/wrangler.toml --port 8787
cd auth && npx wrangler dev --port 8788
```

## Deploying

```bash
cd auth
npx wrangler deploy --env production    # → auth.oplocloud.com
```

The custom domain creates the DNS record and certificate on deploy. The
first deploy (2026-09-18) used zone routes with no DNS record, so the
host never resolved.
