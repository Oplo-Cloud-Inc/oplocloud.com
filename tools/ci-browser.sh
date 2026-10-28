#!/usr/bin/env bash
# The browser suites against a throwaway local stack (O7): bash tools/ci-browser.sh
#
#   1. a new local D1 database: the migrations, the root administrator, the SFHS demo school and its four people,
#      then the filled school (seed-sfhs-full.mjs, a few minutes)
#   2. the API (wrangler dev) on AP and the Learn app's static server (api/scripts/serve-learn.mjs) on SP
#   3. api/scripts/test-ui.mjs, test-shell.mjs and test-students.mjs, each run to its end
#
# The last line is RESULT: ok or RESULT: fail <n> suites; the exit code is 1 when a suite failed.
# Needs node 22, `npm ci` in api/ (wrangler, playwright-core, axe-core) and a Chromium
# (cd api && npx playwright-core install chromium).
# Writes api/.wrangler (the throwaway database; it refuses to replace one that is not a link made by this script
# unless FORCE=1), and logs and sign-in files in STATE (a new temp folder). Both servers stop when it ends.
# AP and SP default to 8817 and 8153; other values let it run beside a stack that is already up.
set -uo pipefail
cd "$(dirname "$0")/.."
REPO=$(pwd)
AP="${AP:-8817}"; SP="${SP:-8153}"
STATE="${STATE:-$(mktemp -d)}"
mkdir -p "$STATE"

if [ -e api/.wrangler ] && [ ! -L api/.wrangler ] && [ -z "${FORCE:-}" ]; then
  echo "api/.wrangler holds a local database; this would replace it. Move it away, or run with FORCE=1." >&2
  exit 2
fi

stop() {
  # wrangler dev leaves workerd behind its npx, so stop whatever listens on the two ports (one lsof each: a second
  # tcp:PORT on one command line is read as a file name, and a stale server from the last run would answer instead)
  command -v lsof >/dev/null || return 0
  local p
  for p in "$AP" "$SP"; do lsof -ti "tcp:$p" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null; done
  return 0
}
trap stop EXIT
stop

echo "== database"
cd api
rm -f .wrangler && mkdir -p "$STATE/wrangler-state" && ln -sfn "$STATE/wrangler-state" .wrangler
CI=true npx wrangler d1 migrations apply oplo-platform-db --local 2>&1 | tail -2
PW="Ci-$(openssl rand -hex 8)-Zq"
./scripts/bootstrap-admin.sh "$PW" root@oplo.test "Root Admin" 2>&1 | tail -1
node scripts/seed-demo-school.mjs 2>&1 | tail -1
for e in ritika.sood@sfhs.in myra.malhotra@sfhs.in tanvi.jindal@sfhs.in tarun.jindal2@gmail.example; do
  err=$(printf '%s\n%s\n' "$PW" "$PW" | ./scripts/set-password.sh "$e" 2>&1 >/dev/null) || { echo "could not set a password for $e: $err" >&2; exit 1; }
done
printf '{"email":"ritika.sood@sfhs.in","password":"%s"}' "$PW" > "$STATE/cred-ritika.json"

echo "== servers"
(ROOT="$REPO" API_PORT="$AP" nohup node scripts/serve-learn.mjs "$SP" > "$STATE/static.log" 2>&1 &)
(nohup npx wrangler dev --ip 127.0.0.1 --port "$AP" --var "ALLOWED_ORIGINS:http://localhost:$SP,http://127.0.0.1:$SP" > "$STATE/api.log" 2>&1 &)
up=
for _ in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:$AP/api/v1/health" >/dev/null 2>&1 && curl -fsS "http://127.0.0.1:$SP/learn/index.html" >/dev/null 2>&1; then up=1; break; fi
  sleep 1
done
[ -n "$up" ] || { echo "the servers did not come up in 90 s"; tail -20 "$STATE/api.log" "$STATE/static.log"; exit 1; }

echo "== the filled school"
export API="http://localhost:$AP/api/v1" ORIGIN="http://localhost:$SP" CRED="$STATE/cred-ritika.json"
node scripts/seed-sfhs-full.mjs 2>&1 | tail -3

cd "$REPO"
failed=0
for s in test-ui test-shell test-students; do
  echo "== $s"
  node "api/scripts/$s.mjs" || { echo "   FAILED: $s"; failed=$((failed + 1)); }
done
if [ "$failed" -eq 0 ]; then echo "RESULT: ok"; else echo "RESULT: fail $failed suites"; exit 1; fi
