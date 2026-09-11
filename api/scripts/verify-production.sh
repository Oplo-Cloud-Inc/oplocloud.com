#!/bin/bash
# ===========================================================================
# Production verification.
#
# The point of this script is that it runs from outside. It checks the things
# that are true only in production and cannot be tested locally: real HTTPS,
# real cookie flags, and CORS from the actual oplocloud.com origin rather than
# from localhost.
#
#   ./scripts/verify-production.sh admin@example.com
#
# It asks for the password rather than taking it as an argument, because an
# argument ends up in shell history.
#
# What it does NOT do is create accounts or grades. Proving the write path in
# production means writing to the real database, and that is a decision to
# make deliberately — pass --full to include it, and it will use a clearly
# named throwaway course that you can delete afterwards.
# ===========================================================================
set -uo pipefail

API="${OPLO_API:-https://api.oplocloud.com/api/v1}"
ORIGIN="${OPLO_ORIGIN:-https://oplocloud.com}"

# A new hostname can be live and still unknown to this machine: a router that
# cached "no such host" before the record existed may hold that for half an
# hour. OPLO_PIN_IP=<an address from `dig api.oplocloud.com @1.1.1.1`> skips
# only the lookup — every request still reaches Cloudflare's edge with the real
# hostname, certificate, CORS and cookies.
if [ -n "${OPLO_PIN_IP:-}" ]; then
  PIN_HOST=$(echo "$API" | sed -E 's#^https?://([^/:]+).*#\1#')
  curl() { command curl --resolve "$PIN_HOST:443:$OPLO_PIN_IP" --resolve "$PIN_HOST:80:$OPLO_PIN_IP" "$@"; }
fi

EMAIL="${1:-}"
FULL=0
[ "${2:-}" = "--full" ] && FULL=1

pass=0; fail=0; warn=0
say()  { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; pass=$((pass+1)); }
bad()  { printf "  \033[31m✗\033[0m %s\n     %s\n" "$1" "${2:-}"; fail=$((fail+1)); }
meh()  { printf "  \033[33m!\033[0m %s\n     %s\n" "$1" "${2:-}"; warn=$((warn+1)); }

[ -n "$EMAIL" ] || { echo "usage: $0 <admin-email> [--full]"; exit 1; }

say "1. HTTPS and reachability"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/health" || echo 000)
[ "$CODE" = "200" ] && ok "health responds 200 over HTTPS" \
  || bad "the API is not answering at $API" "HTTP $CODE"

# A plain-HTTP request must not be served. Cloudflare redirects, which is the
# correct behaviour; what would be wrong is a 200.
PLAIN=$(curl -s -o /dev/null -w '%{http_code}' "$(echo "$API" | sed 's|^https|http|')/health" || echo 000)
case "$PLAIN" in
  301|302|307|308) ok "plain HTTP redirects to HTTPS ($PLAIN)" ;;
  000)             ok "plain HTTP refused outright" ;;
  200)             bad "the API answers over unencrypted HTTP" "HTTP 200 — sessions would travel in clear" ;;
  *)               meh "plain HTTP returned $PLAIN" "expected a redirect or a refusal" ;;
esac

TLS=$(curl -s -o /dev/null -w '%{ssl_verify_result}' "$API/health" || echo 1)
[ "$TLS" = "0" ] && ok "the TLS certificate verifies" || bad "certificate did not verify" "code $TLS"

say "2. CORS, from the real origin"
PRE=$(curl -s -D - -o /dev/null -X OPTIONS "$API/me" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type" || true)
echo "$PRE" | grep -qi "access-control-allow-origin: $ORIGIN" \
  && ok "preflight allows $ORIGIN" \
  || bad "preflight does not allow $ORIGIN" "check ALLOWED_ORIGINS in wrangler.toml"
echo "$PRE" | grep -qi "access-control-allow-credentials: true" \
  && ok "credentials are allowed, so the session cookie can travel" \
  || bad "credentials are not allowed" "the cookie will not be sent and every call will 401"
echo "$PRE" | grep -qi "access-control-allow-origin: \*" \
  && bad "the API allows any origin" "a wildcard and cookies are incompatible by specification" \
  || ok "no wildcard origin"

EVIL=$(curl -s -D - -o /dev/null -X OPTIONS "$API/me" \
  -H "Origin: https://not-oplo.example" -H "Access-Control-Request-Method: GET" || true)
echo "$EVIL" | grep -qi "access-control-allow-origin" \
  && bad "an unknown origin is allowed" "the allowlist is not doing its job" \
  || ok "an unknown origin is refused"

say "3. Sign in, and the cookie it sets"
printf "  password for %s: " "$EMAIL"
read -rs PASSWORD
printf "\n"
JAR=$(mktemp -d)
HDRS=$(curl -s -D - -o /tmp/oplo-login-body -c "$JAR/c" -X POST "$API/auth/login" \
  -H 'content-type: application/json' -H "Origin: $ORIGIN" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" || true)
CODE=$(echo "$HDRS" | head -1 | awk '{print $2}')
[ "$CODE" = "200" ] && ok "signed in" || { bad "sign-in failed" "HTTP $CODE — $(cat /tmp/oplo-login-body)"; }

COOKIE=$(echo "$HDRS" | grep -i '^set-cookie:' | head -1)
echo "$COOKIE" | grep -qi "httponly"      && ok "cookie is HttpOnly — script cannot read it" \
  || bad "cookie is not HttpOnly" "an XSS bug would become a stolen session"
echo "$COOKIE" | grep -qi "secure"        && ok "cookie is Secure — never sent over plain HTTP" \
  || bad "cookie is not Secure" "ENVIRONMENT is probably not set to production"
echo "$COOKIE" | grep -qi "samesite=lax"  && ok "cookie is SameSite=Lax" \
  || meh "cookie SameSite is not Lax" "$COOKIE"
echo "$COOKIE" | grep -qi "max-age"       && ok "cookie carries an expiry" \
  || meh "cookie has no Max-Age" "it would die with the browser session"

say "4. The session actually works"
ME=$(curl -s -b "$JAR/c" "$API/me" || true)
echo "$ME" | grep -q '"id"' && ok "/me resolves the session to an account" || bad "/me failed" "$ME"
NAME=$(echo "$ME" | node -pe "try{JSON.parse(require('fs').readFileSync(0)).account.name}catch(e){''}")
[ -n "$NAME" ] && ok "signed in as $NAME" || bad "no account on /me" "$ME"
echo "$ME" | grep -qi "pw_hash\|pw_salt\|password" \
  && bad "the account response leaks password material" "$ME" \
  || ok "no password material in the response"

say "5. Authorization is on"
ANON=$(curl -s -o /dev/null -w '%{http_code}' "$API/grades")
[ "$ANON" = "401" ] && ok "grades are unauthorized when signed out (401)" \
  || bad "grades are readable without a session" "HTTP $ANON"
# Identity must come from the session, never from the request. Asserted this
# way rather than by expecting a 403 on ?accountId=, because an administrator
# reading another account IS permitted — the earlier version of this check
# failed on correct behaviour, which is worse than not checking at all. The
# per-role refusals are covered exhaustively by scripts/prove.sh.
WHOAMI=$(curl -s -b "$JAR/c" "$API/me?accountId=acc_somebody_else" \
  -H "X-Account-Id: acc_somebody_else" -H "Authorization: Bearer not-a-real-token" \
  | node -pe "try{JSON.parse(require('fs').readFileSync(0)).account.id}catch(e){''}")
SELF=$(echo "$ME" | node -pe "try{JSON.parse(require('fs').readFileSync(0)).account.id}catch(e){''}")
if [ -z "$WHOAMI" ]; then
  ok "a forged bearer token is rejected outright"
elif [ "$WHOAMI" = "$SELF" ]; then
  ok "identity comes from the session — query and headers are ignored"
else
  bad "the request influenced who the server thinks you are" "asked for acc_somebody_else, got $WHOAMI"
fi

if [ "$FULL" = "1" ]; then
  say "6. The write path, against the real database"
  echo "  Creating a throwaway course. Delete it afterwards."
  STAMP=$(date +%s)
  R=$(curl -s -b "$JAR/c" -X POST "$API/courses" -H 'content-type: application/json' \
    -d "{\"code\":\"verify-$STAMP\",\"title\":\"Deployment check $STAMP\",\"status\":\"draft\"}")
  CID=$(echo "$R" | node -pe "try{JSON.parse(require('fs').readFileSync(0)).course.id}catch(e){''}")
  [ -n "$CID" ] && ok "wrote a course to production D1: $CID" || bad "could not write" "$R"
  [ -n "$CID" ] && echo "     remove it with: curl -b cookie -X PATCH $API/courses/$CID -d '{\"status\":\"archived\"}'"
else
  say "6. The write path"
  printf "  \033[2mskipped — pass --full to write a throwaway course to production\033[0m\n"
fi

rm -rf "$JAR" /tmp/oplo-login-body
printf "\n\033[1m%d passed, %d failed, %d to look at\033[0m\n" "$pass" "$fail" "$warn"
if [ "$fail" -gt 0 ]; then
  printf "\033[31mDo not merge the frontend branch until these pass.\033[0m\n"
  exit 1
fi
printf "\033[32mProduction looks right. Test Learn against it in a browser before merging.\033[0m\n"
