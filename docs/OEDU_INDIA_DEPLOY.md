# Deploying the India admin work (migration 0024) — runbook

Prepared 2026-10-17. **Nothing here has been run against production.** Branch `claude/india-deploy-prep` = `origin/main` + the seed script + the India commit + the demo-school commit; every proof passes on that exact tree (people import 14, platform 12, india 12, demo switch 7 + 2, test-india 18).

What ships: India classes / identity numbers / consent / Compliance / load-from-a-file (API + console), `organizations.region`, the demo-school switch (`DEMO_ORGS`) and `set-demo-passwords.sh`. The people import and its console are already live (API 49040b3c, edu f8093ea9).

## 0. Before anything (read-only)
1. **Restore point (D1 Time Travel).** Note the bookmark first: `cd api && npx wrangler d1 time-travel info oplo-platform-db --env production`. Taken 2026-10-17 before any of this: `00000344-00000000-00005107-c20aefd609bebf8d5fe72b0b99e9bd46` (take a fresh one right before step 1). To go back: `npx wrangler d1 time-travel restore oplo-platform-db --bookmark=<it>` — this rewinds the whole database, so it is for a bad migration, not a bad deploy (a bad deploy is a Worker rollback, below).
2. **D1 access.** `cd api && npx wrangler d1 migrations list oplo-platform-db --remote --env production` — on 2026-10-17 this showed `0024_india.sql` as the only pending migration. (It failed once with `7403 not authorized` and worked on retry; if it keeps failing, `npx wrangler login` again.)
3. Live API is version `49040b3c`, edu `f8093ea9` (`wrangler deployments list --env production`). If either differs, someone else deployed: compare before building on it.

## 1. Migration — before the API
0024 only adds a column (`organizations.region`, default `'US'`) and new tables; the *old* API runs fine on it. The *new* API reads `region` on `/me`, so it must not go first.
`cd api && npx wrangler d1 migrations apply oplo-platform-db --remote --env production` (answer the prompt; do not use `CI=true` with OAuth login).

## 2. API
From a clean archive: `git archive claude/india-deploy-prep api efm/js | tar -x -C <scratch>` then `cd <scratch>/api && npx wrangler deploy --env production` (api imports `../../../efm/js/books.js`, so `efm/js` must be in the archive).
Then check CORS keeps Kern: for each of edu, kern, auth `curl -s -D- -H "origin: https://<host>.oplocloud.com" https://api.oplocloud.com/api/v1/me | grep -i allow-origin`.
The deploy also sets two production vars: `DEMO_ORGS = "org_sfhs"` (that school's mail never leaves) and `DEMO_MAIL_DOMAINS = "sfhs.in"` (nothing is ever mailed to an @sfhs.in address, in any school). Both only matter once a mail provider is connected; today nothing is sent at all.

## 3. Console (edu)
The copy must be **live files + this change**, never the repo tree, because a deploy replaces the whole asset set (on 2026-10-17 a copy built from an older commit dropped the 10 `phone-*` files; repaired the same hour).
1. Fetch every file of https://edu.oplocloud.com/ and `cmp` against `git archive origin/main learn`. Expected differences today: `index.html`, `oplo-chrome.css`, `oplo-menu.js` (main has newer brand wording that is not live). Anything else = another deploy; stop and look.
2. Start from the live files; overlay from the branch only: `api.js app.js india.js parent/index.html platform.js`. For `index.html`, take the live one, add `<script src="india.js?v=…">` before `platform.js`, and rewrite every `?v=` to the first 8 hex of its file's sha1 (check none is stale and none points at a missing file).
3. `npx wrangler deploy --env production` from that copy (needs `wrangler.toml` + `worker/index.js`); "N new or modified assets" should be 6.
A staged copy of exactly this, built 2026-10-17 against the live files, is in `ship-people/stage/edu` (rebuild if live has moved).

## 4. Main
The branch is merged to `main` (fast-forward) **before** deploying, at the owner's instruction, so a push to `main` can never replace edu with a tree that lacks India. If `main` deploys edu from git when CI has secrets, that push also puts main's brand wording on edu and the India console before the API has 0024: harmless (India places stay hidden until `/me` reports region IN), but do steps 1–3 promptly.

## 5. The SFHS demo school (made-up data, no passwords in the repo)
- `cd api && node scripts/seed-demo-school.mjs --remote` — school `org_sfhs`, four invited people, made an `IN` school because 0024 is applied.
- Load the roster: Data Center › Imports › People with `oedu_import_people.csv` (add `guardian_email`/`guardian_name` columns for parents), then **Load from a file** under India with `oedu_import_india_details.csv`.
- Bulk demo password: `./scripts/set-demo-passwords.sh org_sfhs --remote` (asks twice, shows nothing; refuses any school not in `DEMO_ORGS`; skips anyone already active, in two schools, or a platform admin). Tell people the password some other way.
- Or one person: `./scripts/set-password.sh ritika.sood@sfhs.in --remote`.

## Rollback
API: `npx wrangler rollback 49040b3c-afb0-41d2-9a29-e76220eb2d4b --env production -m "back out India"` (the migration stays; it is harmless to the old API). Edu: `npx wrangler rollback f8093ea9-e0ab-470e-877f-502a35d26d6d --env production`.

## Not covered
Remote D1 limits for the 200-row import chunks; a sign-in link for invited people (they still need a password set by `set-password.sh` / the demo script); fees, WhatsApp/SMS, board file layouts (see OEDU_INDIA_ADMIN_READINESS.md).


## Later migrations (0026–0032), not run

The India playbook build (`OEDU_INDIA_PLAYBOOK_BUILD.md`) adds seven migrations after 0024: school profile (0026), the section as roster (0027), the class register and its lock (0028), the exam cycle (0029), the class teacher's day and diary (0030), certificates and public disclosure (0031), competencies and the progress card (0032). **0025 is the AI panel's.** All are additive and the old API runs on them. Apply them with the same command as 0024, before the API; the proofs listed in that document were run on a database built from 0001 to 0032.
