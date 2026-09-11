#!/bin/bash
# ===========================================================================
# Production deployment.
#
# Everything in this script needs Cloudflare credentials, which is why it is a
# script you run rather than something already done. It is idempotent: run it
# again after a failure and it picks up where it stopped rather than creating
# a second database.
#
#   1. create the D1 database (once)
#   2. write its id into wrangler.toml
#   3. apply migrations to the remote database
#   4. set the session pepper (once)
#   5. deploy the Worker
#
# After it finishes, one manual step remains — the DNS record — because that
# is a change to a zone rather than to this project, and doing it silently
# from a build script is how a hostname ends up pointing somewhere nobody
# remembers configuring.
# ===========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DB_NAME="oplo-platform-db"
say()  { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
note() { printf "  \033[2m%s\033[0m\n" "$1"; }
die()  { printf "  \033[31m✗ %s\033[0m\n" "$1"; exit 1; }

# Either a token in the environment or a session from `wrangler login` will do.
# Checking only for the token turned away the login this message recommends.
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] &&
   [[ "$(npx wrangler whoami 2>&1 || true)" == *"not authenticated"* ]]; then
  cat <<'MSG'

Cloudflare credentials are missing.

  export CLOUDFLARE_API_TOKEN=...     a token with D1:Edit and Workers Scripts:Edit
  export CLOUDFLARE_ACCOUNT_ID=...    optional if the token names one account

Create one at:
  https://dash.cloudflare.com/profile/api-tokens

Or run `npx wrangler login` in an interactive terminal instead.

MSG
  exit 1
fi

say "1. The D1 database"
EXISTING=$(npx wrangler d1 list --json 2>/dev/null \
  | node -pe "try{(JSON.parse(require('fs').readFileSync(0)).find(d=>d.name==='$DB_NAME')||{}).uuid||''}catch(e){''}" || true)

if [ -n "$EXISTING" ]; then
  DB_ID="$EXISTING"
  ok "already exists: $DB_ID"
else
  OUT=$(npx wrangler d1 create "$DB_NAME" 2>&1)
  DB_ID=$(echo "$OUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  [ -n "$DB_ID" ] || { echo "$OUT"; die "could not read the database id from wrangler's output"; }
  ok "created: $DB_ID"
fi

say "2. wrangler.toml"
if grep -q "REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE" wrangler.toml; then
  # Both the default and production bindings point at the same database. They
  # are separated here only so a staging environment can diverge later.
  sed -i.bak "s/REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE/$DB_ID/g" wrangler.toml
  sed -i.bak "s/local-development-placeholder/$DB_ID/g" wrangler.toml
  rm -f wrangler.toml.bak
  ok "database id written into wrangler.toml"
  note "commit this change — the id is configuration, not a secret"
else
  ok "already configured"
fi

say "3. Migrations"
npx wrangler d1 migrations apply "$DB_NAME" --remote
ok "schema applied to the remote database"

say "4. The session pepper"
# Mixed into session-token hashes before storage, so a leaked database is not
# a set of usable sessions. It is set once and must never change afterwards:
# changing it invalidates every live session at once.
# Read the list, then match. Under pipefail a `| grep -q` can report a miss when
# grep stops reading early, and a miss here would replace the pepper.
SECRETS=$(npx wrangler secret list --env production 2>/dev/null || true)
if [[ "$SECRETS" == *SESSION_PEPPER* ]]; then
  ok "SESSION_PEPPER already set"
  note "do not rotate it casually — every signed-in person is signed out"
else
  PEPPER=$(openssl rand -base64 32)
  echo "$PEPPER" | npx wrangler secret put SESSION_PEPPER --env production
  ok "SESSION_PEPPER generated and stored in Cloudflare"
  note "it is not written to disk and not in this repository"
fi

say "5. Deploy"
npx wrangler deploy --env production
ok "Worker deployed"

cat <<'MSG'

One step left, and it is deliberately manual.

  Add a DNS record for api.oplocloud.com in the oplocloud.com zone
  (proxied / orange cloud), so the route in wrangler.toml has a hostname to
  answer on. Cloudflare issues the certificate automatically.

Then create the first administrator:

  ./scripts/bootstrap-admin.sh 'a-long-password' 'you@example.com' 'Your Name' --remote

And check the whole thing from outside:

  ./scripts/verify-production.sh you@example.com

Do not merge the frontend branch until that verification passes.

MSG
