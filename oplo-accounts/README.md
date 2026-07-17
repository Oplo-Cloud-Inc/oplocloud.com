# Oplo Accounts — prototype quickstart

A runnable "Sign in with Oplo" you can click, before any domain or cloud exists.
For the full plan and the why, read **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

```
oplo-accounts/
├─ ARCHITECTURE.md      ← the whole system, in plain English
├─ docker-compose.yaml  ← runs ZITADEL (the identity engine) + Postgres
├─ .env.example         ← copy to .env, set a master key + admin password
└─ demo/                ← a real OIDC app that signs in with Oplo
   ├─ index.html        ← "Sign in with Oplo" screen
   ├─ callback.html     ← completes the login
   └─ app.js            ← the OIDC client config
```

---

## What you need once
- **Docker Desktop** — https://www.docker.com/products/docker-desktop/ (this is what runs the identity server). *(Not installed in the build environment, so you run this part on your Mac.)*
- The Oplo site already serves the demo at `http://localhost:4173` via `python3 -m http.server 4173`.

---

## Step 1 — start the Oplo Accounts server
```bash
cd oplo-accounts
cp .env.example .env
# (optional but recommended) generate a real master key:
#   openssl rand -base64 24 | cut -c1-32   → paste into .env as ZITADEL_MASTERKEY
docker compose up --detach
```
Wait ~30s, then open the admin console: **http://localhost:8080/ui/console**
Sign in with **`root`** / the `ZITADEL_ADMIN_PASSWORD` from your `.env`.

## Step 2 — register the demo app (creates its Client ID)
In the console:
1. **Create a Project** → name it `Oplo`.
2. Inside it → **Applications → New** → type **User Agent (SPA / PKCE)**.
3. Authentication method: **PKCE**.
4. **Redirect URI:** `http://localhost:4173/oplo-accounts/demo/callback.html`
5. **Post-logout URI:** `http://localhost:4173/oplo-accounts/demo/`
6. Save, then **copy the Client ID**.

## Step 3 — run the demo
1. Open **http://localhost:4173/oplo-accounts/demo/**
2. Expand **Connection settings**, paste the **Client ID**, keep authority `http://localhost:8080`, **Save**.
3. Click **Sign in with Oplo** → you land on the Oplo login → sign in → you're bounced back **signed in**, showing your name, email, and ID-token claims.

That round-trip *is* the whole system. Every real app (ODocs, OMails, Roxan, OEdu) plugs in the same way — and because they share one session on the accounts server, the **second** app you open signs in instantly (SSO).

---

## Handy commands
```bash
docker compose logs -f zitadel   # watch the server
docker compose down              # stop
docker compose down -v           # stop AND wipe the database (fresh start)
```

## Notes & caveats
- This runs over plain **HTTP on localhost** on purpose — it's a prototype. Production uses HTTPS behind `accounts.oplocloud.com` (see ARCHITECTURE.md → Roadmap).
- The demo loads `oidc-client-ts` from a CDN for convenience; production apps will bundle it.
- **Next to make it real:** your managed server + your PostgreSQL + DNS. Checklist at the bottom of ARCHITECTURE.md.
