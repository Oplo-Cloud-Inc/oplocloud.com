#!/bin/bash
# ===========================================================================
# Sets or resets an account's password, out of band.
#
#   ./scripts/set-password.sh <email> [--remote]
#
# The password is asked for twice, with nothing echoed: it never appears on
# the command line, in shell history, or in a terminal's scrollback. Twelve
# characters at least — the API itself sets no minimum, because a school
# chooses what it hands out, but this is for accounts that reach finance.
#
# Setting a password makes the account `active` and verified, and signs out
# every session it had, so a reset also ends a stolen one. It only ever
# changes an account that already exists (provision-account.sh makes them).
# Local by default; --remote is production.
# ===========================================================================
set -e
cd "$(dirname "$0")/.."
DB="oplo-platform-db"
EMAIL="$1"; WHERE="--local"; [ "${2:-}" = "--remote" ] && WHERE="--remote"
[ -n "$EMAIL" ] || { echo "usage: $0 <email> [--remote]" >&2; exit 2; }
[[ "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || { echo "That doesn't look like an email address: $EMAIL" >&2; exit 2; }
LOWER=$(echo "$EMAIL" | tr 'A-Z' 'a-z')

out=$(npx wrangler d1 execute "$DB" $WHERE --json --command "SELECT id FROM accounts WHERE email_lower='$LOWER'" 2>/dev/null) || true
echo "$out" | grep -q '"id"' || { echo "There is no account for $EMAIL. Make it first with provision-account.sh." >&2; exit 1; }

printf "New password for %s: " "$EMAIL" >&2; read -rs P1; echo >&2
printf "Again: " >&2; read -rs P2; echo >&2
[ "$P1" = "$P2" ] || { echo "The two didn't match. Nothing was changed." >&2; exit 1; }
[ ${#P1} -ge 12 ] || { echo "Use at least 12 characters. Nothing was changed." >&2; exit 1; }
[ ${#P1} -le 512 ] || { echo "That password is too long (512 at most). Nothing was changed." >&2; exit 1; }

ITER=$(grep -oE 'PBKDF2_ITERATIONS = [0-9]+' src/lib/crypto.js | grep -oE '[0-9]+$')
[ -n "$ITER" ] || { echo "Could not read PBKDF2_ITERATIONS from src/lib/crypto.js" >&2; exit 1; }
# The same PBKDF2-SHA256 derivation the Worker verifies against; the password reaches node by environment, not argv.
read -r HASH SALT <<< "$(PW="$P1" node -e '
const c = require("node:crypto"), salt = c.randomBytes(16);
process.stdout.write(c.pbkdf2Sync(process.env.PW, salt, Number(process.argv[1]), 32, "sha256").toString("base64") + " " + salt.toString("base64"));
' "$ITER")"
unset P1 P2
NOW=$(node -e 'process.stdout.write(String(Date.now()))')
SQL=$(mktemp -t setpw).sql; trap 'rm -f "$SQL"' EXIT
cat > "$SQL" <<SQLEOF
UPDATE accounts SET pw_hash='$HASH', pw_salt='$SALT', pw_iterations=$ITER, status='active', email_verified=1, updated_at=$NOW WHERE email_lower='$LOWER';
UPDATE sessions SET revoked_at=$NOW WHERE revoked_at IS NULL AND account_id=(SELECT id FROM accounts WHERE email_lower='$LOWER');
SQLEOF
npx wrangler d1 execute "$DB" $WHERE --file "$SQL" >/dev/null 2>&1 || { echo "Stopped: the update failed." >&2; exit 1; }
echo "Password set for $EMAIL — the account is active, and any earlier sessions were signed out."
[ "$WHERE" = "--remote" ] && echo "(--remote: production)" || echo "(--local: nothing in production was touched)"
