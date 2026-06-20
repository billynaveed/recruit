#!/usr/bin/env bash
# One-time bootstrap for a single-box deploy: a GitHub Actions self-hosted
# runner plus a pm2-managed app process. This is one example deployment model;
# adapt or replace it to suit your infrastructure.
#
# Run on the deploy host, as the user that should own the app process:
#   cd /path/to/recruit
#   export GITHUB_REPO=your-org/recruit
#   export GITHUB_PAT=...                 # fine-grained PAT, see below
#   bash scripts/setup-deploy.sh
#
# Before running, you need:
#   1. A GitHub fine-grained Personal Access Token for this repo with
#      Administration: Read and write, Actions: Read and write,
#      Contents: Read and write. Create at:
#      https://github.com/settings/personal-access-tokens
#   2. The token exported as GITHUB_PAT in your shell.
#
# After this script runs, every push to main triggers an automatic deploy via
# the .github/workflows/deploy.yml workflow.

set -euo pipefail

# ─── Config (override via environment) ───────────────────────────────────────
REPO="${GITHUB_REPO:?Set GITHUB_REPO=owner/repo}"
DEPLOY_USER="${DEPLOY_USER:-$(id -un)}"
APP_NAME="${PM2_APP_NAME:-recruit}"
RUNNER_NAME="${RUNNER_NAME:-${APP_NAME}-prod}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
RUNNER_VERSION="${RUNNER_VERSION:-2.319.1}"  # update as needed
RUNNER_ARCH="${RUNNER_ARCH:-x64}"

log() { printf '[setup %s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }

# ─── Sanity checks ───────────────────────────────────────────────────────────

if [ -z "${GITHUB_PAT:-}" ]; then
  log "ERROR: GITHUB_PAT env var is not set"
  log "  Create a fine-grained PAT at https://github.com/settings/personal-access-tokens"
  log "  Then: export GITHUB_PAT=... && bash scripts/setup-deploy.sh"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing pm2 globally (requires sudo)"
  sudo npm install -g pm2
fi

# ─── 1. Start the app under pm2 as the deploy user ───────────────────────────

log "Step 1/4: Start '$APP_NAME' under pm2 (as '$DEPLOY_USER')"

if sudo pm2 list 2>/dev/null | grep -q "$APP_NAME"; then
  log "  Removing any root-owned '$APP_NAME' in pm2"
  sudo pm2 delete "$APP_NAME" || true
fi

# Kill any leftover next-server holding the port
sudo pkill -f "next-server" 2>/dev/null || true
sleep 1

cd "$(dirname "${BASH_SOURCE[0]}")/.."
log "  Starting '$APP_NAME' under pm2"
pm2 start ecosystem.config.js
pm2 save

log "  Installing pm2 systemd service for boot resurrection"
# pm2 startup prints a sudo command; capture and run it
PM2_STARTUP_CMD=$(pm2 startup systemd -u "$DEPLOY_USER" --hp "$HOME" | grep -E "^sudo " || true)
if [ -n "$PM2_STARTUP_CMD" ]; then
  eval "$PM2_STARTUP_CMD"
fi

# ─── 2. Download GitHub Actions runner ───────────────────────────────────────

log "Step 2/4: Install GitHub Actions self-hosted runner"

if [ -d "$RUNNER_DIR" ] && [ -f "$RUNNER_DIR/.runner" ]; then
  log "  Runner already installed at $RUNNER_DIR — skipping download"
else
  mkdir -p "$RUNNER_DIR"
  cd "$RUNNER_DIR"
  TARBALL="actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  log "  Downloading $TARBALL"
  curl -fsSL -o "$TARBALL" \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TARBALL}"
  tar xzf "$TARBALL"
  rm "$TARBALL"
fi

# ─── 3. Register runner with the repo ────────────────────────────────────────

log "Step 3/4: Register runner with $REPO"

cd "$RUNNER_DIR"

# Get a short-lived registration token using the PAT
log "  Requesting registration token"
REG_TOKEN=$(curl -fsSL \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_PAT}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/actions/runners/registration-token" \
  | grep -oE '"token":\s*"[^"]+"' | cut -d'"' -f4)

if [ -z "$REG_TOKEN" ]; then
  log "ERROR: failed to obtain registration token. Check PAT permissions."
  exit 1
fi

if [ -f .runner ]; then
  log "  Runner already configured — skipping config step"
else
  ./config.sh \
    --url "https://github.com/${REPO}" \
    --token "$REG_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "self-hosted,${RUNNER_NAME}" \
    --work "_work" \
    --unattended \
    --replace
fi

# ─── 4. Install runner as systemd service ────────────────────────────────────

log "Step 4/4: Install runner as systemd service"

if systemctl list-unit-files 2>/dev/null | grep -q "actions.runner.*${RUNNER_NAME}"; then
  log "  Runner service already installed"
else
  sudo ./svc.sh install "$DEPLOY_USER"
  sudo ./svc.sh start
fi

log "Done. Runner status:"
sudo ./svc.sh status || true

log ""
log "Next steps:"
log "  1. Push a commit to 'main' on $REPO and watch the Actions tab on GitHub."
log "  2. The runner will pick up the deploy workflow and roll the new build."
log "  3. To unset GITHUB_PAT from your shell: unset GITHUB_PAT"
