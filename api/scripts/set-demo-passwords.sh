#!/bin/bash
# ===========================================================================
# One shared password for every invited person in a DEMO school, so a demo
# can be driven as any role without setting 1,875 passwords one by one.
#
#   ./scripts/set-demo-passwords.sh <org_id> [--remote]
#
#   ./scripts/set-demo-passwords.sh org_sfhs --remote
#
# It refuses any school that is not listed in DEMO_ORGS in wrangler.toml (the
# [vars] list for local, [env.production.vars] for --remote). A real school's
# people each set their own password with set-password.sh; this is only for a
# made-up school whose accounts hold nothing real.
#
# It changes only people who are still `invited` with no password, who belong
# to that school and to no other, and who are not platform administrators:
# nobody who has already chosen a password, and nobody with a foot elsewhere.
# They become `active`. The password is asked for twice with nothing echoed,
# so it is never on the command line, in shell history or in the repository;
# tell the people who need it some other way. 12 characters at least.
# Local by default; --remote is production.
# ===========================================================================
set -e
cd "$(dirname "$0")/.."
DB="oplo-platform-db"
ORG="$1"; WHERE="--local"; SECTION="vars"
[ "${2:-}" = "--remote" ] && { WHERE="--remote"; SECTION="env.production.vars"; }
[ -n "$ORG" ] || { echo "usage: $0 <org_id> [--remote]" >&2; exit 2; }
[[ "$ORG" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "That is not an organization id: $ORG" >&2; exit 2; }

# The gate: the school must be a listed demo.
DEMOS=$(node -e '
const t = require("node:fs").readFileSync("wrangler.toml", "utf8"), want = process.argv[1];
const sec = t.split(/^\[/m).find((s) => s.startsWith(want + "]"));
const m = sec && sec.match(/^DEMO_ORGS\s*=\s*"([^"]*)"/m);
process.stdout.write(m ? m[1] : "");
' "$SECTION")
case ",$(echo "$DEMOS" | tr -d ' ')," in *",$ORG,"*) ;; *) echo "$ORG is not a demo school (DEMO_ORGS in wrangler.toml is: ${DEMOS:-empty}). Nothing was changed." >&2; exit 1;; esac

printf "Demo password for everyone invited in %s: " "$ORG" >&2; read -rs P1; echo >&2
printf "Again: " >&2; read -rs P2; echo >&2
[ "$P1" = "$P2" ] || { echo "The two didn't match. Nothing was changed." >&2; exit 1; }
[ ${#P1} -ge 12 ] || { echo "Use at least 12 characters. Nothing was changed." >&2; exit 1; }
[ ${#P1} -le 512 ] || { echo "That password is too long (512 at most). Nothing was changed." >&2; exit 1; }

ITER=$(grep -oE 'PBKDF2_ITERATIONS = [0-9]+' src/lib/crypto.js | grep -oE '[0-9]+$')
[ -n "$ITER" ] || { echo "Could not read PBKDF2_ITERATIONS from src/lib/crypto.js" >&2; exit 1; }
# The same PBKDF2-SHA256 the Worker verifies against; the password reaches node by environment, not argv.
# One salt for the lot: they are one shared password, and a hash per account would only look like more secrecy.
read -r HASH SALT <<< "$(PW="$P1" node -e '
const c = require("node:crypto"), salt = c.randomBytes(16);
process.stdout.write(c.pbkdf2Sync(process.env.PW, salt, Number(process.argv[1]), 32, "sha256").toString("base64") + " " + salt.toString("base64"));
' "$ITER")"
unset P1 P2
NOW=$(node -e 'process.stdout.write(String(Date.now()))')
SQL=$(mktemp -t demopw).sql; trap 'rm -f "$SQL"' EXIT
cat > "$SQL" <<SQLEOF
UPDATE accounts SET pw_hash='$HASH', pw_salt='$SALT', pw_iterations=$ITER, status='active', email_verified=1, updated_at=$NOW
 WHERE status='invited' AND pw_hash IS NULL
   AND EXISTS (SELECT 1 FROM organization_memberships m WHERE m.account_id=accounts.id AND m.org_id='$ORG')
   AND NOT EXISTS (SELECT 1 FROM organization_memberships m WHERE m.account_id=accounts.id AND m.org_id<>'$ORG')
   AND NOT EXISTS (SELECT 1 FROM account_roles r WHERE r.account_id=accounts.id AND r.product='platform');
SQLEOF
npx wrangler d1 execute "$DB" $WHERE --file "$SQL" >/dev/null 2>&1 || { echo "Stopped: the update failed." >&2; exit 1; }

# Say what is true now, from the database.
npx wrangler d1 execute "$DB" $WHERE --json --command "SELECT (SELECT COUNT(*) FROM accounts a JOIN organization_memberships m ON m.account_id=a.id AND m.org_id='$ORG' WHERE a.status='active' AND a.pw_hash='$HASH') AS set_now, (SELECT COUNT(*) FROM accounts a JOIN organization_memberships m ON m.account_id=a.id AND m.org_id='$ORG' WHERE a.status='invited') AS still_invited" 2>/dev/null | node -e '
let t = ""; process.stdin.on("data", d => t += d).on("end", () => {
  const r = JSON.parse(t.slice(t.indexOf("[")))[0].results[0];
  console.log(`${r.set_now} people in ${process.argv[1]} now share the demo password and are active; ${r.still_invited} are still invited (they belong to another school, or are platform administrators).`);
});' "$ORG"
[ "$WHERE" = "--remote" ] && echo "(--remote: production)" || echo "(--local: nothing in production was touched)"
