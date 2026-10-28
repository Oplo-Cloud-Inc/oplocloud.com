#!/usr/bin/env bash
# The gates that run before anything is published (O7, X6): bash tools/verify.sh [gate ...]
#
#   syntax       node --check on every script of learn/ui, learn/shell, learn/i18n and learn/students
#                (a glob, so a new file is covered the day it is added)
#   stamp        python3 tools/stamp.py --check: no ?v=0 placeholder, no stale hash on the three pages
#   lints        api/scripts/check-ui.mjs and api/scripts/check-i18n.mjs
#   routes       api/scripts/test-routes.mjs: the route table the menu relies on
#   lint-tests   api/scripts/test-lint.mjs: every lint code is seen to fail on a fixture
#   gates        api/scripts/test-gates.mjs: these gates are seen to fail
#
# With no names, all of them. Every gate runs even when one fails, so one run shows everything that is
# wrong; the exit code is 1 if any gate failed, and the last line is RESULT: ok or RESULT: fail <n> gates.
# The Deploy workflow's verify job and the CI workflow both run this, so a lint broken in a push stops
# the publish. OL_LEARN_ROOT points the syntax, stamp and lints gates at another copy of learn/ (test-gates.mjs).
# It reads the repository and writes nothing.
set -uo pipefail
cd "$(dirname "$0")/.."
LEARN="${OL_LEARN_ROOT:-learn}"
failed=0

syntax() {
  local bad=0 f
  for f in "$LEARN"/ui/*.js "$LEARN"/shell/*.js "$LEARN"/i18n/*.js "$LEARN"/students/*.js; do
    node --check "$f" || { echo "syntax: $f does not parse" >&2; bad=1; }
  done
  return $bad
}
gate() {
  local name="$1"; shift
  echo "== $name"
  if "$@"; then echo "   ok"; else echo "   FAILED: $name"; failed=$((failed + 1)); fi
}

want=("$@")
[ ${#want[@]} -gt 0 ] || want=(syntax stamp lints routes lint-tests gates)
for g in "${want[@]}"; do
  case "$g" in
    syntax)     gate "syntax of learn/ui, learn/shell, learn/i18n, learn/students" syntax ;;
    stamp)      gate "asset stamps (STAMP001)" python3 tools/stamp.py --check ;;
    lints)      gate "check-ui" node api/scripts/check-ui.mjs
                gate "check-i18n" node api/scripts/check-i18n.mjs ;;
    routes)     gate "route table" node api/scripts/test-routes.mjs ;;
    lint-tests) gate "lint fixtures" node api/scripts/test-lint.mjs ;;
    gates)      gate "gate fixtures" node api/scripts/test-gates.mjs ;;
    *)          echo "unknown gate: $g" >&2; exit 2 ;;
  esac
done

if [ "$failed" -eq 0 ]; then echo "RESULT: ok"; else echo "RESULT: fail $failed gates"; exit 1; fi
