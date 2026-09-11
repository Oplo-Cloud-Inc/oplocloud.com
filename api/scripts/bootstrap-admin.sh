#!/bin/bash
# Bootstrap: the first platform administrator has to exist before any API call
# can create anybody, so it is made directly against the database. This is the
# one and only privileged out-of-band step, and it is the correct place for it.
#
# Run it again to give the same administrator a new password: every row is
# written only if it is missing, except the password, which is replaced.
set -e
# wrangler finds the database through wrangler.toml, so run from api/ wherever
# the script was called from. Every command below hides its output, so from
# the wrong folder this used to fail without a word.
cd "$(dirname "$0")/.."
DB="oplo-platform-db"
# --remote as the fourth argument targets the deployed database. Local is the
# default so that a mistyped command cannot create an administrator in
# production by accident.
WHERE="--local"
[ "${4:-}" = "--remote" ] && WHERE="--remote"
# A statement that fails shows wrangler's reason rather than ending in silence.
run() {
  local out
  out=$(npx wrangler d1 execute "$DB" $WHERE --command "$1" 2>&1) || {
    echo "$out" | tail -5 >&2
    echo "Stopped: the statement above failed." >&2
    exit 1
  }
}
NOW=$(node -e 'process.stdout.write(String(Date.now()))')
# The Worker's own iteration count, read from the file that defines it. This
# script once hard-coded 210,000 and every administrator it made was one the
# Worker could not check.
ITER=$(grep -oE 'PBKDF2_ITERATIONS = [0-9]+' src/lib/crypto.js | grep -oE '[0-9]+$')
[ -n "$ITER" ] || { echo "Could not read PBKDF2_ITERATIONS from src/lib/crypto.js" >&2; exit 1; }
# PBKDF2-SHA256, the same derivation the Worker verifies against.
read -r HASH SALT <<< "$(node -e '
const c=require("node:crypto");
const salt=c.randomBytes(16);
const bits=c.pbkdf2Sync(process.argv[1],salt,Number(process.argv[2]),32,"sha256");
process.stdout.write(bits.toString("base64")+" "+salt.toString("base64"));
' "$1" "$ITER")"
run "INSERT OR IGNORE INTO organizations (id,slug,name,kind,created_at,updated_at)
     VALUES ('org_oplo','oplo','Oplo Learn','school',$NOW,$NOW)"
run "INSERT INTO accounts (id,email,email_lower,email_verified,pw_hash,pw_salt,pw_iterations,status,created_at,updated_at)
     VALUES ('acc_root','$2','$(echo "$2" | tr 'A-Z' 'a-z')',1,'$HASH','$SALT',$ITER,'active',$NOW,$NOW)
     ON CONFLICT(id) DO UPDATE SET pw_hash=excluded.pw_hash, pw_salt=excluded.pw_salt,
       pw_iterations=excluded.pw_iterations, updated_at=excluded.updated_at"
run "INSERT OR IGNORE INTO profiles (account_id,name,first_name,initials,avatar_hue,title,created_at,updated_at)
     VALUES ('acc_root','$3','$(echo "$3" | cut -d' ' -f1)','$(echo "$3" | awk '{for(i=1;i<=NF&&i<=2;i++)printf toupper(substr($i,1,1))}')','#0071e3','Administrator',$NOW,$NOW)"
run "INSERT OR IGNORE INTO organization_memberships (id,org_id,account_id,role,created_at)
     VALUES ('mem_root','org_oplo','acc_root','owner',$NOW)"
run "INSERT OR IGNORE INTO account_roles (id,account_id,product,role,org_id,created_at)
     VALUES ('rol_root_p','acc_root','platform','admin',NULL,$NOW)"
run "INSERT OR IGNORE INTO account_roles (id,account_id,product,role,org_id,created_at)
     VALUES ('rol_root_l','acc_root','learn','admin','org_oplo',$NOW)"
echo "Seeded platform administrator: $2 ($WHERE, $ITER iterations)"
