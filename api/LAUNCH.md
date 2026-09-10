# Launch requirements

What is not finished. Tracked here rather than discovered later, and separated
by whether it blocks a public launch or blocks scale.

Nothing on this list is hidden behind a working-looking screen. Where a gap is
visible to a user, the interface says so in plain words — the Console's System
tab lists what is server-backed and what is not, and reads from the same facts
as this file.

---

## Blocks a public launch

### 1. Email verification

`accounts.email_verified` exists and nothing sets it. Today an administrator
creates accounts and hands out passwords, which is how a school actually
onboards a class, so nobody is currently relying on an unverified address for
anything. The moment self-signup exists, this becomes the gate that stops one
person claiming another's address.

**Needs:** an outbound mail path (Cloudflare Email Workers, or Resend/Postmark
via a Worker binding), a `verification_tokens` table with a short expiry, and
a `/api/v1/auth/verify` route. The token should be single-use and hashed at
rest, the same as sessions are.

**Blocked by:** choosing a mail provider. Everything else is an afternoon.

### 2. Password reset

There is no way to recover an account. An administrator can currently be asked
to create a new one, which does not scale past a small school and loses the
person's history.

**Needs:** the same mail path as above, a `reset_tokens` table, and a route
that revokes every session on success. Rate-limited per address, and the
response must be identical whether or not the address exists — otherwise the
reset form becomes a way to test which addresses hold accounts.

**Note:** `changePassword` already revokes every other session and reissues
one for the caller. Reset should do the same, minus the reissue.

### 3. Durable rate limiting

`rateLimit` in `src/core/auth.js` is an in-memory `Map`, so it is per-isolate
and resets whenever Cloudflare recycles one. It is a speed bump. The file says
so, and this entry exists so that saying so does not become a substitute for
fixing it.

The current calibration is deliberate and should carry over: **8 attempts per
account** per fifteen minutes, and **120 per network**. The second number is
high on purpose — a school sits behind one NAT, and a tight per-address limit
locks out a classroom on the ninth sign-in. That is not a security control, it
is an outage, and it arrives during a lesson.

**Options, in the order they are worth evaluating:**

| Approach | Fits | Against |
| --- | --- | --- |
| Durable Object per key | Exact counts, strong consistency | An object per email is a lot of objects; needs a cleanup story |
| Durable Object per shard (hash the key into ~64) | Bounded object count, still consistent | Approximate isolation between keys sharing a shard |
| KV with a short TTL | Trivial to write | Eventually consistent — an attacker racing several colos gets extra attempts |
| Cloudflare Rate Limiting rules | No code at all | Per-path, cannot key on a request body field like the email |

**Recommendation:** sharded Durable Objects. The interface in `auth.js` is
already `rateLimit(key)` / `rateLimitClear(key)`, so this is a change behind
two functions and no route moves.

### 4. Production deployment and verification

The API has never run outside a local Worker. Until `api.oplocloud.com` is
deployed and `scripts/verify-production.sh` passes, the frontend branch must
not merge — merging it without a backend leaves Learn unable to sign anyone in.

```
./scripts/deploy.sh
./scripts/bootstrap-admin.sh 'password' 'you@example.com' 'Your Name' --remote
./scripts/verify-production.sh you@example.com
```

The verification script checks what only production can prove: real TLS, that
plain HTTP does not serve, `Secure`/`HttpOnly`/`SameSite` on the session
cookie, CORS from the actual `oplocloud.com` origin, that an unknown origin is
refused, and that identity comes from the session rather than from anything in
the request.

---

## Blocks scale, not launch

### 5. Session hygiene

Rotation is in (every seven days of continuous use, swapped by the router so no
route has to remember). Listing and revocation are in — a person can see every
device signed in as them and sign the others out. What is missing:

- **Pruning.** `repo.pruneSessions` exists and nothing calls it. A cron trigger
  should run it nightly; expired rows otherwise accumulate for ever.
- **Reuse detection.** A rotated-away token that is presented again is a strong
  signal that it was copied. Today it simply fails. It should revoke the whole
  family and tell somebody.

### 6. Progress conflict resolution

Last-write-wins per scope, where a scope is one study set. Two devices drilling
different sets never collide; two drilling the same set at the same time, one
loses. That costs a few minutes of practice, never a grade, which is why it
was acceptable to ship. A merge on the concept state — take the higher `seen`
count and the later `last` per concept — would remove even that.

### 7. Audit trail

`learn_grades` records `graded_by` and `graded_at`, so the current state of a
grade is attributable. There is no history: a mark changed from 42 to 95 leaves
no record that it was ever 42. For an academic record that is the wrong
default.

**Needs:** an append-only `learn_grade_events` table written in the same batch
as the grade. Cheap to add now, expensive to backfill later.

### 8. Observability

No structured logging, no error aggregation, no alerting. A 500 in production
is currently invisible unless somebody reports it. Workers Analytics Engine or
a Logpush destination, plus a request id threaded through `errorResponse`.

---

## Explicitly out of scope for now

Recorded so they are decisions rather than oversights.

- **Passkeys and MFA.** Right after email verification and reset; the accounts
  table has room.
- **OAuth / social sign-in.** Not until Oplo Identity has a public presence
  worth federating.
- **Multi-region D1.** D1 read replication exists; nothing here needs it yet.
- **A separate staging environment.** `wrangler.toml` is already split by
  environment, so this is a second database and a second hostname when wanted.

---

## What is genuinely finished

So the list above is read as what remains, not as the whole picture.

- Oplo Account identity, resolved from a session and never from a request
- Server-side authorization on every route, in one function
- Grades: written by a course's teachers, read by the student they belong to,
  synchronised across devices
- Study sets: authored by teachers, published to a course, studied by the class
- Progress and XP: written by the student, priced by the server, ledger-backed
- Passwords: PBKDF2-SHA256, per-account salt, per-row iteration count with
  transparent rehash on sign-in
- Sessions: HttpOnly cookies, hashed with a server-side pepper before storage,
  rotating, listable and revocable
- 42 assertions in `scripts/prove.sh`, and an architecture check in
  `scripts/check-boundaries.sh` that fails the build if a route reaches D1
  directly or the frontend reaches the network outside `api.js`
