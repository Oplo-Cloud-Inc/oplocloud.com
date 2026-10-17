# Deploying the India admin work (migration 0024) — runbook

Prepared 2026-10-17. **Nothing here has been run against production.** Branch `claude/india-deploy-prep` = `origin/main` + the seed script + the India commit + the demo-school commit; every proof passes on that exact tree (people import 14, platform 12, india 12, demo switch 7 + 2, test-india 18).

What ships: India classes / identity numbers / consent / Compliance / load-from-a-file (API + console), `organizations.region`, the demo-school switch (`DEMO_ORGS`) and `set-demo-passwords.sh`. The people import and its console are already live (API 49040b3c, edu f8093ea9).

## 0. Before anything (read-only)
1. **Cloudflare access to D1.** On 2026-10-17 `wrangler d1 migrations list … --remote` from this machine failed with `7403 account not valid or not authorized` — the saved login deploys Workers but cannot query D1. Run `npx wrangler login` again with D1 permission, or export a `CLOUDFLARE_API_TOKEN` with D1:Edit, then:
   `cd api && npx wrangler d1 migrations list oplo-platform-db --remote --env production` — expect 0001–0023 applied, 0024 pending. If 0024 is already applied, skip step 1.
2. Live API is version `49040b3c`, edu `f8093ea9` (`wrangler deployments list --env production`). If either differs, someone else deployed: compare before building on it.

## 1. Migration — before the API
0024 only adds a column (`organizations.region`, default `'US'`) and new tables; the *old* API runs fine on it. The *new* API reads `region` on `/me`, so it must not go first.
`cd api && npx wrangler d1 migrations apply oplo-platform-db --remote --env production` (answer the prompt; do not use `CI=true` with OAuth login).

## 2. API
From a clean archive: `git archive claude/india-deploy-prep api efm/js | tar -x -C <scratch>` then `cd <scratch>/api && npx wrangler deploy --env production` (api imports `../../../efm/js/books.js`, so `efm/js` must be in the archive).
Then check CORS keeps Kern: for each of edu, kern, auth `curl -s -D- -H "origin: https://<host>.oplocloud.com" https://api.oplocloud.com/api/v1/me | grep -i allow-origin`.
The deploy also sets `DEMO_ORGS = "org_sfhs"` (production vars): that school's mail never leaves.

## 3. Console (edu)
The copy must be **live files + this change**, never the repo tree, because a deploy replaces the whole asset set (on 2026-10-17 a copy built from an older commit dropped the 10 `phone-*` files; repaired the same hour).
1. Fetch every file of https://edu.oplocloud.com/ and `cmp` against `git archive origin/main learn`. Expected differences today: `index.html`, `oplo-chrome.css`, `oplo-menu.js` (main has newer brand wording that is not live). Anything else = another deploy; stop and look.
2. Start from the live files; overlay from the branch only: `api.js app.js india.js parent/index.html platform.js`. For `index.html`, take the live one, add `<script src="india.js?v=…">` before `platform.js`, and rewrite every `?v=` to the first 8 hex of its file's sha1 (check none is stale and none points at a missing file).
3. `npx wrangler deploy --env production` from that copy (needs `wrangler.toml` + `worker/index.js`); "N new or modified assets" should be 6.
A staged copy of exactly this, built 2026-10-17 against the live files, is in `ship-people/stage/edu` (rebuild if live has moved).

## 4. Land it on main
`origin/main` deploys edu from git when CI has secrets, so push the branch to `main` (fast-forward) right after, or the next push replaces edu with a tree that lacks India. That push also carries main's brand wording to edu.

## 5. The SFHS demo school (made-up data, no passwords in the repo)
- `cd api && node scripts/seed-demo-school.mjs --remote` — school `org_sfhs`, four invited people, made an `IN` school because 0024 is applied.
- Load the roster: Data Center › Imports › People with `oedu_import_people.csv` (add `guardian_email`/`guardian_name` columns for parents), then **Load from a file** under India with `oedu_import_india_details.csv`.
- Bulk demo password: `./scripts/set-demo-passwords.sh org_sfhs --remote` (asks twice, shows nothing; refuses any school not in `DEMO_ORGS`; skips anyone already active, in two schools, or a platform admin). Tell people the password some other way.
- Or one person: `./scripts/set-password.sh ritika.sood@sfhs.in --remote`.

## Rollback
API: `npx wrangler rollback 49040b3c-afb0-41d2-9a29-e76220eb2d4b --env production -m "back out India"` (the migration stays; it is harmless to the old API). Edu: `npx wrangler rollback f8093ea9-e0ab-470e-877f-502a35d26d6d --env production`.

## Not covered
Remote D1 limits for the 200-row import chunks; a sign-in link for invited people (they still need a password set by `set-password.sh` / the demo script); fees, WhatsApp/SMS, board file layouts (see OEDU_INDIA_ADMIN_READINESS.md).
