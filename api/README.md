# Oplo platform API

Identity, organizations, and product data for Oplo. One Worker, one database,
every product.

This is **not** an OEdu backend. It is the platform's, and OEdu is the
first product to consume it.

```
                        Oplo Account
                             │
                       Oplo Identity
                             │
        ┌───────────┬────────┼────────┬───────────┐
        │           │        │        │           │
      OEdu       OMaps   OShopping  Roxan   …future products
        │           │        │        │           │
   learn_*       maps_*   shopping_*  roxan_*    <product>_*
```

The distinction shows up in one place and it is the important one: every
product table references `account_id`, never a product-local user id. A person
who is a teacher in OEdu and a seller in OShopping is one row in `accounts`
with two rows in `account_roles`, not two accounts that share an email
address. Signing in once is what makes them one person.

Identity and organization tables are unprefixed because they belong to the
platform. Product tables carry their product's prefix, so a second product
adds tables rather than negotiating for space in these ones.

**A product must not add its own account table, its own password column, or
its own login page.** If a future Oplo product needs something identity-shaped
that is not here, it belongs here — added to the platform, available to
everything — rather than solved locally and duplicated four times.

## Status

| | |
| --- | --- |
| Proven locally | 42 assertions, `scripts/prove.sh` |
| Deployed | **not yet** — see `LAUNCH.md` |
| Blocking launch | email verification, password reset, durable rate limiting |

`LAUNCH.md` is the honest list of what is unfinished. Nothing on it is hidden
behind a working-looking screen; the Console's System tab shows users the same
facts.

```
Browser
   │
Worker          routing, CORS, session resolution   src/index.js
   │
Routes          request shape, response shape       src/routes/
   │
Services        domain rules — what a grade means   src/services/
   │
Repository      the only file that knows SQL        src/repo/d1.js
   │
D1              oplo-platform-db
```

Nothing skips a layer. In particular no route touches `env.DB` directly, which
is what makes D1 replaceable later without the frontend noticing.

## Running it locally

```bash
cd api
npm install
npx wrangler d1 migrations apply oplo-platform-db --local
npx wrangler dev --local --port 8787
```

The first platform administrator has to exist before any API call can create
anybody, so it is made directly against the database. This is the one
privileged out-of-band step:

```bash
./scripts/bootstrap-admin.sh 'a-long-password' 'you@example.com' 'Your Name'
```

Then prove the whole thing works:

```bash
./scripts/prove.sh
```

That script walks the workflow this architecture is judged against, using
nothing but the public HTTP API and three separate cookie jars — one per
person, which is what makes it a test of authorization rather than of one
omnipotent session. It ends with the refusals, which are the part that matters:
a student cannot change their own grade, and a teacher who does not teach them
cannot read it.

## Deploying it

```bash
export CLOUDFLARE_API_TOKEN=...          # D1:Edit and Workers Scripts:Edit
./scripts/deploy.sh
```

It creates the database if it does not exist, writes the id into
`wrangler.toml`, applies migrations remotely, generates and stores
`SESSION_PEPPER`, and deploys. It is idempotent — run it again after a failure
rather than unpicking a half-done state.

One step stays manual: adding the DNS record for `api.oplocloud.com` in the
zone, because that is a change to a zone rather than to this project.

Then the first administrator, and the check from outside:

```bash
./scripts/bootstrap-admin.sh 'a-long-password' 'you@example.com' 'Your Name' --remote
./scripts/verify-production.sh you@example.com
```

`verify-production.sh` tests what only production can prove: real TLS, that
plain HTTP does not serve, the `Secure`/`HttpOnly`/`SameSite` flags on the
session cookie, CORS from the actual `oplocloud.com` origin, that an unknown
origin is refused, and that identity comes from the session rather than from
anything in the request. **Do not merge the frontend until it passes.**

`SESSION_PEPPER` is mixed into session-token hashes before they are stored, so
a leaked database cannot be turned into live sessions without also holding a
secret that never leaves Cloudflare. Do not rotate it casually: changing it
signs out every account at once.

## What is enforced, and where

| Rule | Where |
| --- | --- |
| Who you are | `src/core/auth.js` — from the session token, never the request body |
| What you may do | `src/core/guard.js` — every decision, in one function |
| What a grade means | `src/services/grades.js` |
| What an answer is worth | `src/services/progress.js` |
| SQL | `src/repo/d1.js`, and nowhere else |

The rule worth stating twice: **a student may read their own grade and may
never write one.** There is no branch in `guard.js` that permits it, and the
proof script fails loudly if one ever appears.

## Passwords

PBKDF2-SHA256, per-account random salt, iteration count stored per row so it
can be raised later without invalidating existing passwords. `verifyPassword`
reports when a row is due for a rehash and sign-in does it transparently —
which is the part most implementations forget and the part that makes the
number changeable at all.

Argon2id would be the better answer in general. Workers give us WebCrypto and
no native modules, and a WebAssembly Argon2 would have to run inside a CPU-time
budget measured in milliseconds. PBKDF2 at a high iteration count is what this
platform can honestly afford today, and a login that exceeds the CPU budget
fails closed for everybody — a worse security outcome than a slightly cheaper
KDF.

## Known gaps

In `LAUNCH.md`, with what each one needs and what it blocks. The short version:
email verification, password reset and durable rate limiting block a public
launch; grade history, session pruning and observability block scale.

## Keeping the layering honest

```bash
./scripts/check-boundaries.sh
```

Fails if a route or service reaches `env.DB`, if SQL appears outside
`src/repo/`, if a layer imports past its neighbour, if the frontend reaches the
network outside `learn/api.js`, or if password material reappears in the
browser. Comments are stripped before it looks, so it checks the code rather
than the prose describing it.

D1 is the current implementation, not the contract. The check is what stops
that sentence from becoming decoration.

## Free tier

D1 and Workers have free-tier limits and this is built to sit inside them:
sessions are touched at most once a day rather than on every request, XP is
batched rather than written per answer, and grade summaries are computed in one
query per course rather than per student. None of that assumes the free tier is
unlimited — it assumes it is a budget.
