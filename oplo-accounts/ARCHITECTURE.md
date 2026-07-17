# Oplo Accounts — Architecture & Plan

*Your own identity system for the whole Oplo ecosystem — the equivalent of "Sign in with Google/Apple," but yours.*

Last updated: 2026‑07‑13

---

## 1. What this is, in plain English

**Oplo Accounts** is the single login that sits behind every Oplo product. A person creates one Oplo account (`name@oplo.com`) and uses it to sign into **ODocs, OSheets, OMails, OMaps, OSurf, OPhotos, OCanvas, Roxan, and OEdu** — signing in once gets them into all of them. That "sign in once, you're in everywhere" behaviour is called **SSO (single sign‑on)**.

It also lets you offer a **"Sign in with Oplo"** button that other companies' websites can use — exactly like "Sign in with Google."

The important idea: **Google and Apple did not invent secret magic.** Their login is built on two open, public standards — **OAuth 2.0** and **OpenID Connect (OIDC)**. To "do everything Google account OAuth does," we run **our own identity server that speaks those same standards**, branded as Oplo. We *own* all of it (the data, the login screens, the rules) — we just don't re‑invent the dangerous security parts.

---

## 2. The one rule that keeps users safe

We will **not hand‑write the security core** (password hashing, token signing, session revocation, MFA). Getting any of that subtly wrong = accounts get hacked. Instead we run a **proven, open‑source identity engine** on our own server. We own the database and the experience; the audited engine handles the cryptography.

**Chosen engine: [ZITADEL](https://zitadel.com)** — a complete identity provider in a single program, backed by a PostgreSQL database (the storage you'll provide). It gives us, out of the box:

- Login, sign‑up, "remember me" sessions, and SSO across all apps
- **MFA / 2‑factor** (authenticator apps, SMS, **passkeys / Face‑ID‑style login**)
- Password reset & account recovery
- An **admin console** to manage users, apps, and security policies
- The ability to be a **"Sign in with Oplo"** provider for third parties
- Full **audit log** of every security event
- A **brandable login screen** (Oplo colors, logo, wording)

*Alternatives if we ever hit friction:* **Logto** (even simpler), **Keycloak** (heaviest / most enterprise), **Ory** (most flexible, most assembly required).

---

## 3. How a login actually works (the flow)

Each app (say ODocs) is a **"client"** of Oplo Accounts. When someone opens ODocs:

```
1. ODocs: "You're not signed in — go to accounts.oplo.com."
2. Browser redirects to the Oplo login page.
3. User signs in (or is ALREADY signed in from another app → skipped = SSO).
4. Oplo Accounts sends the browser back to ODocs with a one‑time code.
5. ODocs swaps that code for tokens:
      • ID token  → "this is who the user is" (name, email, picture)
      • Access token → "this app is allowed to call Oplo APIs on their behalf"
      • Refresh token → "get new tokens later without re‑logging‑in"
6. ODocs now shows the user as signed in.
```

Because step 3 is skipped when an Oplo session already exists, the *second* app the user opens signs them in instantly. That is the whole SSO trick — one session at `accounts.oplo.com`, shared by every app via redirects. (This uses the **Authorization Code flow with PKCE**, the modern secure standard for apps that run in a browser.)

---

## 4. The pieces

| Piece | What it is | Who provides it |
|---|---|---|
| **Identity provider** | ZITADEL, running in a container | We host it |
| **Account database** | PostgreSQL (users, credentials, devices, audit) | **You — "backend storage soon"** |
| **Each app as a client** | ODocs/OMails/etc. redirect here to log in | We wire each app |
| **SSO session** | One login cookie on the accounts domain | ZITADEL handles it |
| **Login UI** | Oplo‑branded sign‑in / sign‑up screens | We theme it |
| **Admin console** | Manage users, apps, policies | Built into ZITADEL |

---

## 5. Two separate things that share one account ⚠️

This matters, because they're often confused:

1. **Identity** — *logging in.* `name@oplo.com` is the **username** you sign in with. → **This document. Built first.**
2. **Email hosting** — *an actual mailbox* that sends/receives mail at `name@oplo.com`. This needs **email infrastructure**: a domain with **MX records**, and either a mail server or a provider (e.g. a transactional/mailbox service). **OMails** is the app in front of it. → **A separate build.** It *reuses* the same Oplo account, but delivering email is its own project.

So "`@oplo.com` connected to their email experience" = **Identity (this) + Email hosting (later).** We do identity first; it's the backbone everything else hangs on.

---

## 6. Domains (naming)

Today the site is `oplocloud.com` and you mentioned the apps will live under `op.oplocloud.com` once the domain is set up. Proposed identity endpoints:

- **`accounts.oplocloud.com`** — the Oplo Accounts login / IdP (later `accounts.oplo.com`)
- Each app is a client with a registered **redirect URL**, e.g. `https://odocs.op.oplocloud.com/auth/callback`

For the local prototype we use `localhost:8080` (IdP) and `localhost:4173` (the apps).

---

## 7. Roadmap

**Phase 0 — Prototype (now, local).** ZITADEL running in Docker on your machine + a working **"Sign in with Oplo"** demo you can click. Proves the whole flow before any domain or cloud. *(Files in this folder.)*

**Phase 1 — Production identity.** Stand ZITADEL up on the **server you manage**, point it at **your PostgreSQL**, put it behind `accounts.oplocloud.com` with HTTPS, and apply Oplo branding + MFA policy.

**Phase 2 — Wire the ecosystem.** Register every app (ODocs, OMails, Roxan, OEdu…) as a client so one login covers all — real SSO.

**Phase 3 — "Sign in with Oplo" for third parties**, developer portal, and API access tokens (the full "everything Google does" surface).

**Phase 4 — Email hosting** for `@oplo.com` behind OMails (separate infra track).

---

## 8. What I need from you to go past the prototype

- [ ] **The server** you'll manage (a cloud VM / container host) — so I can deploy ZITADEL to it.
- [ ] **The PostgreSQL database** ("backend storage") — connection details when ready.
- [ ] **DNS control** for the domain (to create `accounts.…`, HTTPS certificates, and later email MX records).
- [ ] For email: a decision on **mailbox provider vs. self‑run mail server** (Phase 4).

Until those exist, the **prototype** in this folder is the real, runnable proof of the system.
