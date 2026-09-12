#!/bin/bash
# ===========================================================================
# Ship.
#
# The one way work on platform-backend goes live: merge it into main, push,
# then publish the Workers — in that order, stopping at the first step that
# fails.
#
# It exists because doing this by hand went wrong once, in a way that is easy
# to repeat. A merge failed on a stale worktree registration, and the deploy
# chained after it with `;` ran anyway — from the development checkout rather
# than from main. The content happened to be identical that time. There is no
# reason it would be the next.
#
# Three rules make that impossible here:
#
#   set -euo pipefail   nothing runs after a step that failed, including a
#                       failure in the middle of a pipe
#   deploy from main    the Workers are published from a fresh checkout of the
#                       commit just pushed to main — never from the tree
#                       somebody is editing, which may hold anything
#   touch no branches   the merge is made on a detached checkout of
#                       origin/main and reaches main only by being pushed, so
#                       a dry run leaves the repository exactly as it was
#
# Usage
#     tools/ship.sh              merge, push main, publish the student app
#     tools/ship.sh --api        also apply remote D1 migrations and deploy the
#                                API first: migrations, then the API that reads
#                                them, then the app that calls the API
#     tools/ship.sh --dry-run    merge and verify locally, publish nothing
#     tools/ship.sh -m "..."     the merge commit's message
# ===========================================================================
set -euo pipefail

BRANCH="${BRANCH:-platform-backend}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

API=0; DRY=0; MSG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --api)     API=1 ;;
    --dry-run) DRY=1 ;;
    -m)        shift; MSG="${1:-}" ;;
    *)         echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

say() { printf "\n\033[1m%s\033[0m\n" "$1"; }
die() { printf "\n\033[31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# --------------------------------------------------------------------------
say "Preconditions"
[ -z "$(git status --porcelain)" ] \
  || die "The working tree has uncommitted changes. Shipping describes a commit, not a tree — commit or stash first."
git fetch -q origin
[ "$(git rev-parse "$BRANCH")" = "$(git rev-parse "origin/$BRANCH")" ] \
  || die "$BRANCH is not in step with origin/$BRANCH. Push or pull it first."
echo "  $BRANCH at $(git log --oneline -1 "$BRANCH")"
[ -n "$MSG" ] || MSG="Merge into main: $(git log -1 --format=%s "origin/$BRANCH")"

# --------------------------------------------------------------------------
say "Merge into main"
# A stale registration is exactly what broke the manual version. Prune first,
# and use a directory that has never existed so nothing can be half-there.
#
# Detached at origin/main, not a checkout of the local `main` branch. A
# worktree on a branch commits to that branch, and branches are shared with
# every checkout of the repository: the first dry run of this script merged
# into local `main`, and the real run after it found the work "already
# merged" and published the dry run's commit. Nothing here moves
# refs/heads/main now — a merge reaches main by push, or is discarded with
# the worktree.
git worktree prune
WT="$(mktemp -d "${TMPDIR:-/tmp}/oplo-ship.XXXXXX")"
cleanup() {
  git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || true
  rm -rf "$WT"
}
trap cleanup EXIT
rmdir "$WT"                                   # `worktree add` creates it
git worktree add -q --detach "$WT" origin/main
if git -C "$WT" merge-base --is-ancestor "origin/$BRANCH" HEAD; then
  echo "  main already contains $BRANCH"
else
  git -C "$WT" merge --no-ff -q "origin/$BRANCH" -m "$MSG"
  echo "  merged: $(git -C "$WT" log --oneline -1)"
fi

# --------------------------------------------------------------------------
say "Verify what is about to be published"
for f in learn/app.js learn/learn.js learn/store.js learn/annotate.js learn/api.js; do
  node --check "$WT/$f"
done
if [ "$API" = 1 ]; then
  for f in api/src/index.js api/src/repo/d1.js api/src/core/guard.js; do
    node --check "$WT/$f"
  done
fi
( cd "$WT" && python3 tools/checklinks.py >/dev/null ) \
  || die "checklinks failed on the merged tree."
echo "  the scripts parse and every site link resolves"

if [ "$DRY" = 1 ]; then
  say "Dry run — nothing leaves this machine"
  git -C "$WT" log --oneline -3
  exit 0
fi

# --------------------------------------------------------------------------
say "Push main"
git -C "$WT" push -q origin HEAD:refs/heads/main
[ "$(git -C "$WT" rev-parse HEAD)" = "$(git ls-remote origin refs/heads/main | cut -f1)" ] \
  || die "origin/main is not the commit that was just merged. Stopping before any deploy."
echo "  origin/main at $(git -C "$WT" log --oneline -1)"

# Everything from here runs inside the checkout of main. That is the rule.
cd "$WT"

if [ "$API" = 1 ]; then
  say "Database migrations (production)"
  npx --yes wrangler d1 migrations apply oplo-platform-db --remote -c api/wrangler.toml
  say "API"
  npx --yes wrangler deploy --env production -c api/wrangler.toml
fi

say "Student app"
npx --yes wrangler deploy --env production

say "Shipped $(git log --oneline -1)"
