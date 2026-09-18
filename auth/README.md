# Oplo Identity — auth.oplocloud.com

The authentication portal for the Oplo ecosystem. A Cloudflare Worker
that serves the sign-in experience, handles OAuth/OIDC redirects, and
proxies API calls to api.oplocloud.com.

```
auth/
├─ wrangler.toml       — Worker config, auth.oplocloud.com routing
├─ index.js            — The Worker: page serving, API proxy, OIDC discovery
├─ auth.css            — Auth-specific styles (extends oplo-design.css)
├─ app.js              — Client-side auth logic (sign-in, passkey, recovery)
└─ README.md           — You are here
```

---

## What this is

**auth.oplocloud.com** is the front door of Oplo Identity. It does
three things:

1. **Serves the sign-in page** at `/` — email first, then method
   (passkey preferred, password fallback). Also serves `/register`
   and `/recovery` views.

2. **Forwards API calls** to api.oplocloud.com, attaching the
   session cookie so the platform API can resolve who the user is.
   The API sets the session cookie on the `oplocloud.com` domain,
   so it is shared across every Oplo product.

3. **Serves the OIDC discovery document** at
   `/.well-known/openid-configuration`, so Oplo products can discover
   the identity endpoints.

---

## Why a separate subdomain

The session cookie lives on `oplocloud.com` (set by api.oplocloud.com
with `Domain=oplocloud.com`). This means it is sent on every request
to every Oplo subdomain — `edu.oplocloud.com`, `auth.oplocloud.com`,
`api.oplocloud.com` — without any special configuration.

The split is about **separation of concerns**, not isolation:

| Subdomain | Purpose |
|---|---|
| `auth.oplocloud.com` | Identity — sign-in, registration, recovery, OIDC discovery |
| `api.oplocloud.com` | Data — session management, all platform APIs |
| `edu.oplocloud.com` | OEdu — the education product |
| `oplocloud.com` | Marketing site and static assets |

Sign in at `auth.oplocloud.com`, and the session is valid everywhere.

---

## The sign-in flow

```
User opens auth.oplocloud.com
       │
       ▼
Email? ──► Continue ──► api.oplocloud.com/auth/login
       │                        │
       │              ┌─────────┴─────────┐
       │              │ Has password?     │
       │              │  Yes → verify     │
       │              │  No → prompt for  │
       │              │    password or    │
       │              │    passkey        │
       │              └─────────┬─────────┘
       │                        │
       │                   Set-Cookie
       │                   (oplocloud.com)
       │                        │
       ▼                        ▼
   Redirect to product (cookie sent automatically)
```

The password field is intentionally **not** the first thing users
see. Email is. After email, the system determines the appropriate
authentication method — passkey if available, password as fallback.

---

## How the pages switch

The Worker serves a single HTML document. The page switches its view
based on the URL path:

| Path | View |
|---|---|
| `/` | Sign in (email first) |
| `/sign-in` | Sign in (same as `/`) |
| `/register` | Create an account |
| `/recovery` | Password recovery |
| `/callback` | OAuth/OIDC callback handler |

The client-side `app.js` renders the correct view into `#authMain`
and handles all interactions.

---

## Running locally

```bash
cd auth
npm install wrangler
npx wrangler dev --local --port 8788
# open http://localhost:8788
```

API calls are proxied to `api.oplocloud.com` (or wherever
`API_BASE` points). For local testing with the API running on
`localhost:8787`, set `API_BASE=http://localhost:8787`:

```bash
npx wrangler dev --local --port 8788 --api
```

---

## Deploying

```bash
cd auth
npx wrangler deploy                  → auth.<subdomain>.workers.dev
npx wrangler deploy --env production → auth.oplocloud.com
```

The production environment attaches the `auth.oplocloud.com`
custom domain (managed in the Cloudflare zone for oplocloud.com).
The DNS record is created automatically on deploy.

---

## Relationship to oplo-accounts

The `oplo-accounts/` directory contains a local prototype of the
identity server using ZITADEL + Postgres in Docker. That prototype
runs at `http://localhost:8080` and demonstrates the full OIDC
flow in isolation.

**auth.oplocloud.com** is the production-facing portal. It does not
run ZITADEL — it proxies to api.oplocloud.com, which holds the real
session logic. When the platform API moves to a full identity provider
(ZITADEL, or its replacement), auth.oplocloud.com continues to serve
the same pages; only the API proxy target changes.

---

## Files that reference this

| File | What it does |
|---|---|
| `sign-in/index.html` | Marketing site sign-in page — form now redirects to auth.oplocloud.com |
| `wrangler.toml` (root) | Documents auth.oplocloud.com as a platform subdomain |
| `sitemap.xml` | Includes auth.oplocloud.com |
| `README.md` (root) | Lists auth/ as a project component |
| `api/wrangler.toml` | API at api.oplocloud.com (auth proxy target) |
