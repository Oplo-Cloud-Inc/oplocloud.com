#!/bin/bash
# Bootstrap: the first platform administrator has to exist before any API call
# can create anybody, so it is made directly against the database. This is the
# one and only privileged out-of-band step, and it is the correct place for it.
set -e
DB="oplo-platform-db"
run() { npx wrangler d1 execute "$DB" --local --command "$1" >/dev/null 2>&1; }
NOW=$(node -e 'process.stdout.write(String(Date.now()))')
# PBKDF2-SHA256, the same derivation the Worker verifies against.
read -r HASH SALT <<< "$(node -e '
const c=require("node:crypto");
const salt=c.randomBytes(16);
const bits=c.pbkdf2Sync(process.argv[1],salt,210000,32,"sha256");
process.stdout.write(bits.toString("base64")+" "+salt.toString("base64"));
' "$1")"
run "INSERT INTO organizations (id,slug,name,kind,created_at,updated_at)
     VALUES ('org_oplo','oplo','Oplo Learn','school',$NOW,$NOW)"
run "INSERT INTO accounts (id,email,email_lower,email_verified,pw_hash,pw_salt,pw_iterations,status,created_at,updated_at)
     VALUES ('acc_root','$2','$(echo "$2" | tr 'A-Z' 'a-z')',1,'$HASH','$SALT',210000,'active',$NOW,$NOW)"
run "INSERT INTO profiles (account_id,name,first_name,initials,avatar_hue,title,created_at,updated_at)
     VALUES ('acc_root','$3','$(echo "$3" | cut -d' ' -f1)','$(echo "$3" | awk '{for(i=1;i<=NF&&i<=2;i++)printf toupper(substr($i,1,1))}')','#0071e3','Administrator',$NOW,$NOW)"
run "INSERT INTO organization_memberships (id,org_id,account_id,role,created_at)
     VALUES ('mem_root','org_oplo','acc_root','owner',$NOW)"
run "INSERT INTO account_roles (id,account_id,product,role,org_id,created_at)
     VALUES ('rol_root_p','acc_root','platform','admin',NULL,$NOW)"
run "INSERT INTO account_roles (id,account_id,product,role,org_id,created_at)
     VALUES ('rol_root_l','acc_root','learn','admin','org_oplo',$NOW)"
echo "Seeded platform administrator: $2"
