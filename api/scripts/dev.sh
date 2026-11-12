#!/usr/bin/env bash
# A working local Oplo Learn in one command (X1):  bash api/scripts/dev.sh [gallery|demo|full|scale|stop]
#
#   gallery  only the static server: the component gallery, no API, no install (seconds)
#   demo     (default) a new local database, the demo school and its four people, the API, the sign-in page, the static server
#   full     demo, then the filled school: about 330 children in 13 sections and a month of registers (a few minutes)
#   scale    demo, then a school of real size: 1,801 children in 68 sections and a term of registers (see docs/perf/directory-bench.md)
#   stop     stop the servers this script started
#
# It prints the address, where the sign-in file is, and the commands that check your work. Nothing here is published:
# the database is a local file, the passwords are made up on the spot, and every address is on this computer.
# Needs node 22 and `npm ci` in api/ (demo, full and scale only). A second run keeps the database and the passwords.
#
# PORTS   API_PORT (8787), WEB_PORT (8123), AUTH_PORT (8788): the ports the app and its tools look for.
# STATE   OPLO_DEV_STATE: where the database, logs and sign-in file live. Default: ~/.oplo-learn-dev/<this folder>-<hash>/<mode>,
#         outside the repository, so a synced folder (Dropbox, iCloud, OneDrive) never holds a SQLite file it could corrupt.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-demo}"
API_PORT="${API_PORT:-8787}"; WEB_PORT="${WEB_PORT:-8123}"; AUTH_PORT="${AUTH_PORT:-8788}"
BASE="${OPLO_DEV_STATE:-$HOME/.oplo-learn-dev/$(basename "$ROOT")-$(printf %s "$ROOT" | (shasum 2>/dev/null || sha1sum) | cut -c1-6)}"
STATE="$BASE/$MODE"

die() { echo "error: $1" >&2; echo "fix: $2" >&2; exit 1; }
taken() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
free_port() { taken "$1" && die "port $1 is already in use" "stop what uses it (lsof -ti tcp:$1), or run 'bash api/scripts/dev.sh stop' if it is this script's, or pick another: $2=$(($1 + 1)) bash api/scripts/dev.sh $MODE"; return 0; }
kill_port() {   # the server listening on a port, and the wrangler that started it
  lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
  pkill -f "wrangler.* --port $1( |\$)" 2>/dev/null
  return 0
}
stop_all() {
  command -v lsof >/dev/null || die "lsof is not installed, so the servers cannot be found" "stop them by hand: the processes listening on $API_PORT, $WEB_PORT and $AUTH_PORT"
  local p; for p in "$API_PORT" "$WEB_PORT" "$AUTH_PORT"; do kill_port "$p"; done
  return 0
}
seed() {   # seed <script> <what it does>: the whole output goes to a log, and a failure shows its end
  echo "== $2"
  node "scripts/$1" > "$STATE/seed.log" 2>&1 || { tail -15 "$STATE/seed.log"; die "scripts/$1 failed (the full output is $STATE/seed.log)" "it is safe to repeat: run the same command again and it carries on"; }
  tail -4 "$STATE/seed.log"
}
wait_for() {   # wait_for <url> <seconds> <what>
  local i; for ((i = 0; i < $2; i++)); do curl -fsS "$1" >/dev/null 2>&1 && return 0; sleep 1; done
  die "$3 did not answer in $2 seconds" "read the end of its log: tail -30 $STATE/*.log"
}

case "$MODE" in
  stop) stop_all; echo "stopped (ports $API_PORT, $WEB_PORT, $AUTH_PORT)"; exit 0 ;;
  gallery|demo|full|scale) ;;
  *) die "unknown mode '$MODE'" "use one of: gallery, demo, full, scale, stop" ;;
esac
command -v node >/dev/null || die "node is not installed" "install node 22 (https://nodejs.org), then run this again"
mkdir -p "$STATE"
free_port "$WEB_PORT" WEB_PORT

if [ "$MODE" = "gallery" ]; then
  (ROOT="$ROOT" API_PORT="$API_PORT" nohup node "$ROOT/api/scripts/serve-learn.mjs" "$WEB_PORT" > "$STATE/static.log" 2>&1 &)
  wait_for "http://127.0.0.1:$WEB_PORT/learn/_ui.html" 20 "the static server"
  echo "The component gallery is up (no API):"
  echo "  Open     http://localhost:$WEB_PORT/learn/_ui.html"
  echo "  Guide    learn/README.md"
  echo "  Stop     bash api/scripts/dev.sh stop"
  exit 0
fi

# ---- the stack
[ -x "$ROOT/api/node_modules/.bin/wrangler" ] || die "the API's packages are not installed" "run: cd api && npm ci"
free_port "$API_PORT" API_PORT; free_port "$AUTH_PORT" AUTH_PORT
case "$STATE" in
  *Dropbox*|*CloudStorage*|*"Mobile Documents"*|*iCloud*|*OneDrive*|*"Google Drive"*)
    echo "warn: $STATE looks like a synced folder, and a synced SQLite file can be corrupted; set OPLO_DEV_STATE to a folder outside it" >&2 ;;
esac
case "$STATE" in *" "*) die "the database folder has a space in its path ($STATE)" "set OPLO_DEV_STATE to a path without spaces" ;; esac

export OPLO_D1_STATE="$STATE/d1"
CREDS="$STATE/credentials.json"
cd "$ROOT/api"
echo "== database ($STATE)"
CI=true npx wrangler d1 migrations apply oplo-platform-db --local --persist-to "$OPLO_D1_STATE" 2>&1 | tail -2
if [ ! -s "$CREDS" ]; then
  PW="Dev-$(openssl rand -hex 8)-Zq"
  ./scripts/bootstrap-admin.sh "$PW" root@oplo.test "Root Admin" 2>&1 | tail -1
  node scripts/seed-demo-school.mjs 2>&1 | tail -1
  for e in ritika.sood@sfhs.in myra.malhotra@sfhs.in tanvi.jindal@sfhs.in tarun.jindal2@gmail.example; do
    printf '%s\n%s\n' "$PW" "$PW" | ./scripts/set-password.sh "$e" >/dev/null 2>&1 || die "could not set a password for $e" "run the line above it again; the error is in the wrangler output"
  done
  (umask 077; printf '{"email":"ritika.sood@sfhs.in","password":"%s","admin":"ritika.sood@sfhs.in","teacher":"myra.malhotra@sfhs.in","student":"tanvi.jindal@sfhs.in","guardian":"tarun.jindal2@gmail.example"}\n' "$PW" > "$CREDS")
fi

echo "== servers"
ORIGINS="http://localhost:$WEB_PORT,http://127.0.0.1:$WEB_PORT,http://localhost:$AUTH_PORT,http://127.0.0.1:$AUTH_PORT"
start_api() { (nohup npx wrangler dev --ip 127.0.0.1 --port "$API_PORT" --persist-to "$OPLO_D1_STATE" --var "ALLOWED_ORIGINS:$ORIGINS" >> "$STATE/api.log" 2>&1 &); wait_for "http://127.0.0.1:$API_PORT/api/v1/health" 90 "the API"; }
(ROOT="$ROOT" API_PORT="$API_PORT" nohup node scripts/serve-learn.mjs "$WEB_PORT" > "$STATE/static.log" 2>&1 &)
(cd "$ROOT/auth" && nohup "$ROOT/api/node_modules/.bin/wrangler" dev --ip 127.0.0.1 --port "$AUTH_PORT" > "$STATE/auth.log" 2>&1 &)
wait_for "http://127.0.0.1:$WEB_PORT/learn/index.html" 20 "the static server"
start_api

export API="http://localhost:$API_PORT/api/v1" ORIGIN="http://localhost:$WEB_PORT" CRED="$CREDS"
if [ "$MODE" = "full" ]; then seed seed-sfhs-full.mjs "the filled school"; fi
if [ "$MODE" = "scale" ]; then
  seed seed-scale.mjs "the school at real size (about ten minutes)"
  # wrangler dev keeps what it has served in memory: the 7,000 registers of this seed fill its heap, and every answer after that waits for
  # a collection. A new API starts clean, so what is measured next is the Directory and not the dev server.
  kill_port "$API_PORT"; sleep 1; start_api
fi

[ "$AUTH_PORT" = 8788 ] || echo "note: the app opens its sign-in page on port 8788 and AUTH_PORT is $AUTH_PORT, so the browser cannot sign in; the commands below sign in through the API"
cat <<EOF

Oplo Learn is running ($MODE, local):
  Open       http://localhost:$WEB_PORT/learn/
  Gallery    http://localhost:$WEB_PORT/learn/_ui.html
  Sign in    ritika.sood@sfhs.in (the school's administrator); the password is in $CREDS
  API        http://localhost:$API_PORT/api/v1/health
  Check      bash tools/verify.sh                       (every lint and every test that needs no browser)
  Prove      API=$API ORIGIN=$ORIGIN CRED=$CREDS node api/scripts/prove-directory.mjs
  Browser    API=$API ORIGIN=$ORIGIN CRED=$CREDS node api/scripts/test-students.mjs
  Stop       bash api/scripts/dev.sh stop
EOF
