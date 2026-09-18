#!/bin/bash
# Create Saswat Chen student account at Excel High School.
#
# Usage:
#   bash scripts/create-student.sh 'Saswat Chen' saswatc@nycstudents.net 'TempPass2026!'
#
# Requires: npx wrangler (for local D1 access)
#           The oplo-platform-db database must exist.
#
# This creates:
#   1. The Oplo Account (email, name, password)
#   2. The profile (name, initials)
#   3. A learn.student role at Excel High School
#   4. Organization membership at Excel High School

set -e

NAME="${1:-Saswat Chen}"
EMAIL="${2:-saswatc@nycstudents.net}"
PASSWORD="${3:-TempPass2026!}"

DB="oplo-platform-db"
NOW=$(node -e 'process.stdout.write(String(Date.now()))')

# Derive account fields from name
FIRST=$(echo "$NAME" | cut -d' ' -f1)
INITIALS=$(echo "$NAME" | awk '{for(i=1;i<=NF&&i<=2;i++) printf toupper(substr($i,1,1)); print ""}')
EMAIL_LOWER=$(echo "$EMAIL" | tr 'A-Z' 'a-z')

# Check if account already exists
EXISTING=$(npx wrangler d1 execute "$DB" -- \
  "SELECT id FROM accounts WHERE email_lower = '$EMAIL_LOWER'" 2>/dev/null | grep -oP 'acc_\w+' || echo "")

if [ -n "$EXISTING" ]; then
  echo "Account already exists: $EXISTING ($EMAIL_LOWER)"
  echo "Updating profile..."
  npx wrangler d1 execute "$DB" -- \
    "UPDATE profiles SET name = '$NAME', first_name = '$FIRST', initials = '$INITIALS', updated_at = $NOW WHERE account_id = '$EXISTING'" 2>/dev/null || true
  echo "Account $EXISTING updated."
  exit 0
fi

# Generate password hash (PBKDF2-SHA256, matching the Worker's crypto)
ITER=$(grep -oE 'PBKDF2_ITERATIONS = [0-9]+' /Users/saswatjimac/Library/CloudStorage/Dropbox/oplocloud.com/api/src/lib/crypto.js | grep -oE '[0-9]+$')
[ -n "$ITER" ] || ITER=210000

HASH_SALT=$(node -e '
const c=require("node:crypto");
const salt=c.randomBytes(16);
const bits=c.pbkdf2Sync(process.argv[1],salt,Number(process.argv[2]),32,"sha256");
process.stdout.write(bits.toString("base64")+" "+salt.toString("base64"));
' "$PASSWORD" "$ITER")
HASH=$(echo "$HASH_SALT" | cut -d' ' -f1)
SALT=$(echo "$HASH_SALT" | cut -d' ' -f2)

ACCOUNT_ID="acc_$(echo "$EMAIL_LOWER" | tr -cd 'a-z0-9' | head -c 24)"
PROFILE_ID="prof_$ACCOUNT_ID"

echo "Creating account: $ACCOUNT_ID"
echo "Email: $EMAIL_LOWER"
echo "Name: $NAME"
echo "Password: [protected] (${ITER} iterations)"

# Check if Excel High School org exists, create if not
ORG=$(npx wrangler d1 execute "$DB" -- \
  "SELECT id FROM organizations WHERE slug = 'excel-high-school'" 2>/dev/null | grep -oP 'org_\w+' || echo "")

if [ -z "$ORG" ]; then
  ORG="org_$(date +%s)"
  npx wrangler d1 execute "$DB" -- \
    "INSERT INTO organizations (id, slug, name, kind, created_at, updated_at)
     VALUES ('$ORG', 'excel-high-school', 'Excel High School', 'school', $NOW, $NOW)" 2>/dev/null || true
  echo "Created organization: $ORG"
fi

# Insert the account
npx wrangler d1 execute "$DB" -- \
  "INSERT INTO accounts (id, email, email_lower, email_verified, pw_hash, pw_salt, pw_iterations, status, created_at, updated_at)
   VALUES ('$ACCOUNT_ID', '$EMAIL', '$EMAIL_LOWER', 1, '$HASH', '$SALT', $ITER, 'active', $NOW, $NOW)" 2>/dev/null || true

# Insert the profile
npx wrangler d1 execute "$DB" -- \
  "INSERT INTO profiles (account_id, name, first_name, initials, avatar_hue, title, created_at, updated_at)
   VALUES ('$ACCOUNT_ID', '$NAME', '$FIRST', '$INITIALS', '#0071e3', 'Student', $NOW, $NOW)" 2>/dev/null || true

# Grant learn.student role at Excel High School
npx wrangler d1 execute "$DB" -- \
  "INSERT OR IGNORE INTO account_roles (id, account_id, product, role, org_id, created_at)
   VALUES ('rol_${ACCOUNT_ID}_l', '$ACCOUNT_ID', 'learn', 'student', '$ORG', $NOW)" 2>/dev/null || true

# Add to organization as member
npx wrangler d1 execute "$DB" -- \
  "INSERT OR IGNORE INTO organization_memberships (id, org_id, account_id, role, created_at)
   VALUES ('mem_${ACCOUNT_ID}', '$ORG', '$ACCOUNT_ID', 'member', $NOW)" 2>/dev/null || true

echo ""
echo "=== Account created successfully ==="
echo "ID: $ACCOUNT_ID"
echo "Email: $EMAIL"
echo "Organization: Excel High School ($ORG)"
echo "Role: learn.student"
echo "Password: $PASSWORD"
echo ""
echo "Next steps:"
echo "  1. Deploy the auth Worker: cd auth && npx wrangler deploy"
echo "  2. Deploy the API: cd api && npx wrangler deploy"
echo "  3. Update DNS: Create A/AAAA or CNAME record for auth.oplocloud.com in Cloudflare"
echo "  4. Sign in at https://auth.oplocloud.com with $EMAIL"
