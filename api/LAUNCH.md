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

### 7. Audit trail — done

`learn_grade_events` (migration `0004`) records both sides of every change to
every mark: what it was, what it became, who did it, when, and the reason if
one was given. It is written by the repository rather than by a caller, so a
route cannot forget it, and nothing deletes from it. `GET /api/v1/grades/history`
reads it, under the same permission as the grade it describes — which includes
the student, who can therefore see that their own mark was changed.

What is still missing is a way to *undo* from that history. The record is
there; putting a "restore this" next to each entry is a screen, not a schema.

### 7b. Grading policies — done

Late, extra credit and drop-lowest are in the engine (migration `0006`), and
each one reports what it did: `dropped` names the marks, `latePenalty` gives
the points deducted, `extraCredit` gives the points added. A policy that
changes a grade without saying so is indistinguishable from a bug.

There is deliberately **no per-day late penalty**. Charging per day needs the
moment the work arrived and nothing records that — a teacher ticks "late" when
they mark it, which may be a week later. A per-day figure computed from
marking time would be invented, and the student could not check it.

The final percentage is **uncapped**. Extra credit can take a course past 100%
and that is the arithmetic of the rules the school wrote. A ceiling is itself a
policy; applying one nobody asked for would be the engine overruling the
teacher, silently.

### 8. Observability

No structured logging, no error aggregation, no alerting. A 500 in production
is currently invisible unless somebody reports it. Workers Analytics Engine or
a Logpush destination, plus a request id threaded through `errorResponse`.

---

### 9. Credits earned at EHS

The graduation dashboard counts transferred credit and shows this year's EHS
course grades, but finishing an EHS course does not yet award credit toward a
requirement area. Courses carry no credit value or area, and nothing marks one
complete. Until that exists "Earned at EHS" reads 0 and the orange segments on
the requirement bars stay empty — the dashboard says 0 rather than guessing.

**Needs:** a credit value and a requirement area on each course, a completion
event (the final grade entered), and `ehsByArea` filled from it in
`services/graduation.js`, which is already written to receive it.

### 10. A registrar screen for transfer evaluation

Importing a transcript and accepting or declining a transferred course are
API-only today: `scripts/import-transcript.mjs` and
`PATCH /api/v1/transcript-courses/:courseId`. Both are enforced to
administrators. A Console tab over the same endpoints is the next step, and it
changes nothing in the API.

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
- A graduation dashboard computed on the server: EHS's two diploma tracks, the
  transfer cap and residency minimums, a transfer range where partial semesters
  are at risk, and achievements earned from the record itself
- 57 assertions in `scripts/prove.sh`, and an architecture check in
  `scripts/check-boundaries.sh` that fails the build if a route reaches D1
  directly or the frontend reaches the network outside `api.js`
