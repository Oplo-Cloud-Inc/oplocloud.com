#!/bin/bash
# ===========================================================================
# Gives somebody an account and one product role, out of band — WITHOUT a
# password.
#
#   ./scripts/provision-account.sh <email> "<Full Name>" <product> <role> [--remote]
#
#   ./scripts/provision-account.sh saswatc@oplocloud.com "Saswat Chen" efm user --remote
#
# The account is made `invited`: it exists, it has the role, and it cannot
# sign in, because there is no password and none is invented. Whoever is going
# to use it sets one with scripts/set-password.sh, which is the moment it
# becomes `active`. A password chosen for somebody else and handed over is a
# password two people know.
#
# Idempotent: run it again for an existing address and it adds only what is
# missing — the role, never a second account. Local by default, so a mistyped
# command cannot touch production. Platform administrators are made by
# bootstrap-admin.sh, not here.
# ===========================================================================
set -e
cd "$(dirname "$0")/.."
DB="oplo-platform-db"
EMAIL="$1"; NAME="$2"; PRODUCT="$3"; ROLE="$4"; WHERE="--local"
[ "${5:-}" = "--remote" ] && WHERE="--remote"
usage() { echo "usage: $0 <email> \"<Full Name>\" <product> <role> [--remote]" >&2; exit 2; }
[ -n "$EMAIL" ] && [ -n "$NAME" ] && [ -n "$PRODUCT" ] && [ -n "$ROLE" ] || usage
[[ "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || { echo "That doesn't look like an email address: $EMAIL" >&2; exit 2; }
case "$PRODUCT" in learn|maps|shopping|roxan|efm) ;; *) echo "Unknown product '$PRODUCT' (learn, maps, shopping, roxan, efm). Platform administrators are made by bootstrap-admin.sh." >&2; exit 2;; esac
case "$ROLE" in student|teacher|author|guardian|admin|user|seller) ;; *) echo "Unknown role '$ROLE'." >&2; exit 2;; esac

SQL=$(mktemp -t provision).sql
trap 'rm -f "$SQL"' EXIT
# Values go in through node, which quotes them; nothing is interpolated by hand.
node -e '
const c = require("node:crypto"), fs = require("node:fs");
const [email, name, product, role, out] = process.argv.slice(1);
const q = s => "\x27" + String(s).replace(/\x27/g, "\x27\x27") + "\x27";
const now = Date.now(), lower = email.toLowerCase();
const first = name.trim().split(/\s+/)[0];
const initials = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
const acc = "acc_" + c.randomUUID().replace(/-/g, ""), rol = "rol_" + c.randomUUID().replace(/-/g, "");
fs.writeFileSync(out, [
  `INSERT OR IGNORE INTO accounts (id,email,email_lower,email_verified,pw_hash,pw_salt,pw_iterations,status,created_at,updated_at)
     VALUES (${q(acc)},${q(email)},${q(lower)},0,NULL,NULL,NULL,\x27invited\x27,${now},${now});`,
  `INSERT OR IGNORE INTO profiles (account_id,name,first_name,initials,avatar_hue,title,created_at,updated_at)
     SELECT id,${q(name)},${q(first)},${q(initials)},\x27#0071e3\x27,NULL,${now},${now} FROM accounts WHERE email_lower=${q(lower)};`,
  `INSERT INTO account_roles (id,account_id,product,role,org_id,created_at)
     SELECT ${q(rol)}, a.id, ${q(product)}, ${q(role)}, NULL, ${now} FROM accounts a
      WHERE a.email_lower=${q(lower)}
        AND NOT EXISTS (SELECT 1 FROM account_roles r WHERE r.account_id=a.id AND r.product=${q(product)} AND r.role=${q(role)} AND r.org_id IS NULL);`
].join("\n") + "\n");
' "$EMAIL" "$NAME" "$PRODUCT" "$ROLE" "$SQL"
out=$(npx wrangler d1 execute "$DB" $WHERE --file "$SQL" 2>&1) || { echo "$out" | tail -6 >&2; echo "Stopped: the statements above failed." >&2; exit 1; }

# Say what is true now, from the database.
npx wrangler d1 execute "$DB" $WHERE --json --command "SELECT a.id, a.email, a.status, (a.pw_hash IS NOT NULL) AS has_password, p.name, (SELECT group_concat(r.product||'.'||r.role) FROM account_roles r WHERE r.account_id=a.id) AS roles FROM accounts a LEFT JOIN profiles p ON p.account_id=a.id WHERE a.email_lower='$(echo "$EMAIL" | tr 'A-Z' 'a-z')'" 2>/dev/null | node -e '
let t = ""; process.stdin.on("data", d => t += d).on("end", () => {
  const r = JSON.parse(t.slice(t.indexOf("[")))[0].results[0];
  if (!r) { console.error("The account was not found after writing — something is wrong."); process.exit(1); }
  console.log(`${r.email}  ·  ${r.name}  ·  ${r.id}\n  status: ${r.status}  ·  password: ${r.has_password ? "set" : "not set — cannot sign in yet"}  ·  roles: ${r.roles}`);
});'
[ "$WHERE" = "--remote" ] && echo "(--remote: production)" || echo "(--local: nothing in production was touched)"
