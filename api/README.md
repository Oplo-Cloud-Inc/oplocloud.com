# Oplo platform API

Identity, organizations, and product data for Oplo. One Worker, one database,
every product.

This is **not** an Oplo Learn backend. It is the platform's, and Learn is the
first product to consume it. The distinction shows up in one place and it is
the important one: every product table references `account_id`, never a
product-local user id. A person who is a teacher in Learn and a seller in
OShopping is one row in `accounts` with two rows in `account_roles`, not two
accounts that share an email address.

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
npx wrangler d1 create oplo-platform-db     # take the id it prints
# paste that id into both database_id fields in wrangler.toml
npx wrangler d1 migrations apply oplo-platform-db --remote
npx wrangler secret put SESSION_PEPPER --env production
npx wrangler deploy --env production
```

`SESSION_PEPPER` is mixed into session-token hashes before they are stored, so
a leaked database cannot be turned into live sessions without also holding a
secret that never leaves Cloudflare. Generate one with
`openssl rand -base64 32`. It is not in this repository and must not be.

The production route is `api.oplocloud.com/*`. Add that hostname to the zone
before deploying.

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

These are real and are not hidden behind a working-looking screen.

- **Rate limiting is in-memory and per-isolate.** A speed bump, not a wall.
  A limiter that actually holds needs Durable Objects or KV.
- **No email verification and no password reset.** `email_verified` exists on
  the accounts table and nothing sets it.
- **Study sets are not in the database.** Learn's set authoring writes to the
  device it runs on, and the console says so on the screen where sets are
  written. This is the next table.
- **No refresh-token rotation.** Sessions are long-lived opaque tokens,
  revocable per session or per account.
- **Progress conflict resolution is last-write-wins per scope.** Safe because
  the scope is one study set, and because losing a write costs a few minutes
  of drill rather than a grade.

## Free tier

D1 and Workers have free-tier limits and this is built to sit inside them:
sessions are touched at most once a day rather than on every request, XP is
batched rather than written per answer, and grade summaries are computed in one
query per course rather than per student. None of that assumes the free tier is
unlimited — it assumes it is a budget.
