#!/usr/bin/env bash
# Recruit deploy script. Idempotent.
# Run by the GitHub Actions self-hosted runner (or manually) on the deploy host.
#
# Assumes:
#  - .env is present at the project root
#  - pm2 is installed and the app (PM2_APP_NAME, default "recruit") is registered
#    (see scripts/setup-deploy.sh)

set -euo pipefail

# Project root is the parent of this script's directory, unless overridden.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
APP_NAME="${PM2_APP_NAME:-recruit}"
cd "$PROJECT_DIR"

# Pull latest from main first, then re-exec this script if we're behind so
# the rest of the run uses the freshly-pulled deploy.sh.
if [ "${DEPLOY_REENTRY:-0}" != "1" ]; then
  git fetch --quiet origin main
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[deploy $(date -u +%H:%M:%SZ)] Pulling origin/main ($LOCAL → $REMOTE)"
    git reset --hard origin/main
    DEPLOY_REENTRY=1 exec bash "$PROJECT_DIR/scripts/deploy.sh"
  fi
fi

log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }

log "Project: $PROJECT_DIR"
log "Node:    $(node --version 2>/dev/null || echo 'not found')"
log "PM2:     $(pm2 --version 2>/dev/null || echo 'not found')"

if [ ! -f .env ]; then
  log "ERROR: .env not found at $PROJECT_DIR/.env"
  exit 1
fi

# Source .env so prisma generate (and any build-time hooks) see DATABASE_URL etc.
set -a
# shellcheck disable=SC1091
. ./.env
set +a

# Guard: npm ci and next build run as the current user and must be able to
# wipe/rewrite node_modules and .next. A stray `npm install`/`next build` run
# as root in this checkout leaves dirs root-owned, which trips `EACCES rmdir`
# mid-deploy and silently blocks every subsequent deploy. Fail fast with the
# exact fix instead.
RUN_USER=$(id -un)
foreign=$(find node_modules .next -xdev ! -user "$RUN_USER" -print -quit 2>/dev/null || true)
if [ -n "$foreign" ]; then
  log "ERROR: files under node_modules/.next are not owned by '$RUN_USER' (e.g. $foreign)."
  log "       Something ran as root in this checkout. Fix on the prod box with:"
  log "         sudo chown -R $RUN_USER:$RUN_USER $PROJECT_DIR/node_modules $PROJECT_DIR/.next"
  exit 1
fi

log "Installing dependencies (npm ci)"
npm ci --no-audit --no-fund

log "Generating Prisma client"
npx prisma generate

log "Running migrations (deploy)"
npx prisma migrate deploy

log "Building Next.js"
npm run build

log "Reloading pm2 process '$APP_NAME' (zero-downtime)"
# --update-env so changes in .env propagate to the new worker
pm2 reload "$APP_NAME" --update-env

log "Done"
