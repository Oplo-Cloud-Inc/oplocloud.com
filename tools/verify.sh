#!/usr/bin/env bash
# The gates that run before anything is published (O7, X6): bash tools/verify.sh [gate ...]
#
#   syntax       node --check on every script of learn/ui, learn/shell, learn/i18n and the module folders (MODULES in
#                api/scripts/lib-lint.mjs); a glob, so a new file is covered the day it is added
#   stamp        python3 tools/stamp.py --check: no ?v=0 placeholder, no stale hash on the three pages
#   lints        api/scripts/check-ui.mjs and api/scripts/check-i18n.mjs
#   design       api/scripts/check-design.mjs: DESIGN.md names every token family, template, component file and phone answer (D1)
#   migrations   api/scripts/check-migrations.mjs: no two migrations share a number, none after 0070 drops or renames (O13)
#   audit        api/scripts/check-audit.mjs: every write route of a migrated module is in the audit registry, writes its row, and has a proof that asserts it (O17)
#   api          api/scripts/test-request-id.mjs: the API's error path (X4), called as a function: no server, no database
#   routes       api/scripts/test-routes.mjs: the route table the menu relies on
#   lint-tests   api/scripts/test-lint.mjs: every lint code is seen to fail on a fixture
#   gates        api/scripts/test-gates.mjs: these gates are seen to fail
#
# With no names, all of them. Every gate runs even when one fails, so one run shows everything that is
# wrong; the exit code is 1 if any gate failed, and the last line is RESULT: ok or RESULT: fail <n> gates.
# The Deploy workflow's verify job and the CI workflow both run this, so a lint broken in a push stops
# the publish. OL_LEARN_ROOT points the syntax, stamp, lints and design gates at another copy of learn/, OL_DESIGN_MD the design gate
# at another DESIGN.md, OL_MIGRATIONS_DIR the migrations gate at another copy of api/migrations, and OL_AUDIT_ROUTES the audit gate at
# another registry (test-gates.mjs).
# It reads the repository and writes nothing.
set -uo pipefail
cd "$(dirname "$0")/.."
LEARN="${OL_LEARN_ROOT:-learn}"
failed=0

syntax() {
  local bad=0 f m mods
  mods=$(node --input-type=module -e 'import { MODULES } from "./api/scripts/lib-lint.mjs"; console.log(MODULES.join(" "))') || return 1
  for f in "$LEARN"/ui/*.js "$LEARN"/shell/*.js "$LEARN"/i18n/*.js $(for m in $mods; do ls "$LEARN/$m"/*.js; done); do
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
[ ${#want[@]} -gt 0 ] || want=(syntax stamp lints design migrations audit api routes lint-tests gates)
for g in "${want[@]}"; do
  case "$g" in
    syntax)     gate "syntax of learn/ui, learn/shell, learn/i18n and the module folders" syntax ;;
    stamp)      gate "asset stamps (STAMP001)" python3 tools/stamp.py --check ;;
    lints)      gate "check-ui" node api/scripts/check-ui.mjs
                gate "check-i18n" node api/scripts/check-i18n.mjs ;;
    design)     gate "design law (DES001-DES006)" node api/scripts/check-design.mjs ;;
    migrations) gate "migration numbers (MIG001-MIG003)" node api/scripts/check-migrations.mjs ;;
    audit)      gate "audit coverage (AUD001-AUD003)" node api/scripts/check-audit.mjs ;;
    api)        gate "api error path" node api/scripts/test-request-id.mjs ;;
    routes)     gate "route table" node api/scripts/test-routes.mjs ;;
    lint-tests) gate "lint fixtures" node api/scripts/test-lint.mjs ;;
    gates)      gate "gate fixtures" node api/scripts/test-gates.mjs ;;
    *)          echo "unknown gate: $g" >&2; exit 2 ;;
  esac
done

if [ "$failed" -eq 0 ]; then echo "RESULT: ok"; else echo "RESULT: fail $failed gates"; exit 1; fi
