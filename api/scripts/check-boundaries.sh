#!/bin/bash
# ===========================================================================
# The boundary check.
#
# Routes → Services → Repository → D1 is an architectural promise, and an
# architectural promise nothing enforces is a comment. This makes it a build
# failure instead.
#
# It checks four things:
#
#   1. Only the repository touches the database binding. The moment a route
#      reaches for env.DB "just this once" the abstraction is gone, and the
#      migration to Postgres that D1 was chosen to leave room for becomes a
#      rewrite instead of a file swap.
#
#   2. Only the repository writes SQL.
#
#   3. Layers do not reach downward past their neighbour. Routes may call
#      services and the repository they were handed; they may not import the
#      D1 implementation by name.
#
#   4. Only api.js talks to the network from the frontend. A second file
#      calling fetch() is a second place that knows a backend exists, and the
#      seam stops being a seam.
#
# Run it before pushing; wire it into CI when there is CI.
# ===========================================================================
set -u
cd "$(dirname "$0")/.."
fail=0

# Comments are blanked before any of this runs, with line numbers preserved.
# An architecture check that fires on the prose explaining the architecture is
# a check nobody keeps running, and a check nobody runs enforces nothing.
SCRATCH=$(mktemp -d)
trap 'rm -rf "$SCRATCH"' EXIT
code() {
  local f=$1
  local dest="$SCRATCH/$(echo "$f" | tr '/.' '__')"
  node scripts/strip-comments.js "$f" > "$dest" 2>/dev/null || cp "$f" "$dest"
  echo "$dest"
}
# Greps code-only copies while reporting the real path and line.
cgrep() {
  local pattern=$1; shift
  local out=""
  for f in "$@"; do
    [ -f "$f" ] || continue
    local stripped
    stripped=$(code "$f")
    local hit
    hit=$(grep -nE "$pattern" "$stripped" 2>/dev/null | sed "s|^|$f:|") || true
    [ -n "$hit" ] && out="$out$hit"$'\n'
  done
  printf "%s" "$out" | grep -v '^$' || true
}
jsfiles() { find "$1" -name "*.js" -type f | sort; }
say()  { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
bad()  { printf "  \033[31m✗\033[0m %s\n" "$1"; fail=1; }

say "1. Only the repository touches the database binding"
hits=$(cgrep "env\.DB|\.prepare\(|\.batch\(" $(jsfiles src | grep -v "^src/repo/" | grep -v "^src/index.js"))
if [ -z "$hits" ]; then ok "env.DB and prepared statements appear only in src/repo/"
else bad "the database binding is reached outside src/repo/:"; echo "$hits" | sed 's/^/      /'; fi

# index.js is allowed exactly one mention: constructing the repository.
construct=$(grep -c "new D1Repository(env.DB)" "$(code src/index.js)" || true)
other=$(cgrep "env\.DB" src/index.js | grep -v "new D1Repository(env.DB)" | grep -v "if (!env.DB)" || true)
if [ "$construct" = "1" ] && [ -z "$other" ]; then
  ok "src/index.js mentions env.DB only to construct the repository"
else bad "src/index.js uses env.DB beyond constructing the repository:"; echo "$other" | sed 's/^/      /'; fi

say "2. Only the repository writes SQL"
sql=$(cgrep "(SELECT |INSERT INTO|UPDATE .* SET |DELETE FROM)" $(jsfiles src | grep -v "^src/repo/"))
if [ -z "$sql" ]; then ok "no SQL outside src/repo/"
else bad "SQL found outside src/repo/:"; echo "$sql" | sed 's/^/      /'; fi

say "3. Layers do not reach past their neighbour"
deep=$(cgrep "from \"\.\./repo/|from \"\./repo/" $(jsfiles src/routes) $(jsfiles src/services))
if [ -z "$deep" ]; then ok "routes and services do not import the D1 implementation"
else bad "a route or service imports the repository implementation by name:"; echo "$deep" | sed 's/^/      /'; fi

svc=$(cgrep "from \"\.\./routes/" $(jsfiles src/services))
if [ -z "$svc" ]; then ok "services do not import routes"
else bad "a service imports a route — the arrow points the wrong way:"; echo "$svc" | sed 's/^/      /'; fi

say "4. Only api.js talks to the network from the frontend"
# tutor.js is exempt: it talks to Ollama on the user's own machine, which is
# not the Oplo API and never leaves the device.
net=$(cgrep "fetch\(|XMLHttpRequest|EventSource" $(jsfiles ../learn | grep -v "/api\.js$" | grep -v "/tutor\.js$"))
if [ -z "$net" ]; then ok "api.js is the only file that reaches the Oplo API"
else bad "the frontend reaches the network outside api.js:"; echo "$net" | sed 's/^/      /'; fi

say "5. The frontend does not hold credentials"
creds=$(cgrep "pbkdf2|PBKDF2|deriveBits|verifier|password_hash|pw_hash" $(jsfiles ../learn))
if [ -z "$creds" ]; then ok "no password derivation or verifiers in the frontend"
else bad "the frontend appears to handle password material:"; echo "$creds" | sed 's/^/      /'; fi

printf "\n"
if [ "$fail" = "0" ]; then printf "\033[1;32mBoundaries hold.\033[0m\n"; else printf "\033[1;31mBoundary violated.\033[0m\n"; fi
exit $fail
