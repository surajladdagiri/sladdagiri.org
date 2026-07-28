#!/usr/bin/env bash
#
# Atlas daily refresh — self-hosted runner.
#
# Pulls latest, runs the pipeline, commits src/data/atlas.js if it changed,
# and pushes. Vercel redeploys from the push.
#
# Install: see scripts/pipeline/SERVER-SETUP.md
#
set -euo pipefail

REPO="${ATLAS_REPO:-$HOME/atlas/sladdagiri.org}"
VENV="${ATLAS_VENV:-$HOME/atlas/venv}"
ENVFILE="${ATLAS_ENV:-$HOME/atlas/.env}"
BRANCH="${ATLAS_BRANCH:-main}"

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

log "=== Atlas refresh starting ==="

# --- secrets ---------------------------------------------------------------
if [ -f "$ENVFILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
  log "loaded env from $ENVFILE"
else
  log "WARN: no env file at $ENVFILE — running without model keys"
fi

# --- repo ------------------------------------------------------------------
cd "$REPO"
log "repo: $(pwd)  branch: $(git rev-parse --abbrev-ref HEAD)"

# Discard any local drift in the generated file, then sync.
git checkout -- src/data/atlas.js 2>/dev/null || true
git fetch --quiet origin "$BRANCH"
git reset --hard --quiet "origin/$BRANCH"
log "synced to origin/$BRANCH @ $(git rev-parse --short HEAD)"

# --- run -------------------------------------------------------------------
# shellcheck disable=SC1091
. "$VENV/bin/activate"
log "python: $(python --version 2>&1)"

set +e
python scripts/pipeline/run.py
STATUS=$?
set -e

if [ $STATUS -ne 0 ]; then
  log "ERROR: pipeline exited $STATUS — leaving repo untouched"
  exit $STATUS
fi

# --- commit ----------------------------------------------------------------
if git diff --quiet -- src/data/atlas.js; then
  log "no changes — nothing to push"
else
  git config user.name  "atlas-bot"
  git config user.email "atlas-bot@sladdagiri.org"
  git add src/data/atlas.js
  git commit --quiet -m "atlas: daily refresh $(date +%Y-%m-%d)"
  git push --quiet origin "$BRANCH"
  log "pushed $(git rev-parse --short HEAD) — Vercel will redeploy"
fi

# --- optional explicit deploy hook -----------------------------------------
if [ -n "${VERCEL_DEPLOY_HOOK:-}" ]; then
  code=$(curl -sS -X POST "$VERCEL_DEPLOY_HOOK" -o /dev/null -w '%{http_code}')
  log "vercel deploy hook -> $code"
fi

log "=== Atlas refresh done ==="
