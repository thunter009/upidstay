#!/usr/bin/env bash
# setup-runner.sh — Install and configure GitHub Actions self-hosted runner.
# Run as jasper: ssh mini 'RUNNER_TOKEN=<token> bash -s' < deploy/setup-runner.sh
#
# Get a token: gh api -X POST repos/thunter009/upidstay/actions/runners/registration-token --jq '.token'
# Tokens expire in 1 hour and are single-use.
set -euo pipefail

RUNNER_DIR="/Users/jasper/actions-runner"
REPO_URL="https://github.com/thunter009/upidstay"
RUNNER_NAME="${RUNNER_NAME:-mini}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,macOS,ARM64}"

log() { echo "[runner] $(date '+%H:%M:%S') $*"; }
ok()  { echo "  [OK] $*"; }
skip() { echo "  [SKIP] $* (already configured)"; }

# --- Token check ---
if [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "ERROR: RUNNER_TOKEN is required."
  echo "Generate one:"
  echo "  gh api -X POST repos/thunter009/upidstay/actions/runners/registration-token --jq '.token'"
  exit 1
fi

# --- Download runner if not present ---
if [ -x "$RUNNER_DIR/run.sh" ]; then
  skip "Runner binaries"
else
  log "Downloading GitHub Actions runner"
  mkdir -p "$RUNNER_DIR"
  cd "$RUNNER_DIR"

  # Use RUNNER_URL env var if provided, otherwise fetch latest
  if [ -n "${RUNNER_URL:-}" ]; then
    DOWNLOAD_URL="$RUNNER_URL"
  else
    DOWNLOAD_URL=$(curl -sL https://api.github.com/repos/actions/runner/releases/latest \
      | python3 -c "
import sys, json
assets = json.load(sys.stdin).get('assets', [])
for a in assets:
    if 'osx-arm64' in a['name'] and a['name'].endswith('.tar.gz'):
        print(a['browser_download_url'])
        break
else:
    sys.exit(1)
" 2>/dev/null)
  fi

  if [ -z "${DOWNLOAD_URL:-}" ]; then
    echo "ERROR: Could not determine runner download URL."
    echo "Set RUNNER_URL env var to the macOS ARM64 .tar.gz URL manually."
    exit 1
  fi

  log "Downloading $DOWNLOAD_URL"
  curl -sL "$DOWNLOAD_URL" -o runner.tar.gz
  tar xzf runner.tar.gz
  rm runner.tar.gz
  ok "Runner binaries installed"
fi

# --- Configure runner ---
if [ -f "$RUNNER_DIR/.runner" ]; then
  log "Runner already configured — reconfiguring"
  cd "$RUNNER_DIR"
  ./config.sh remove --token "$RUNNER_TOKEN" 2>/dev/null || true
fi

log "Configuring runner"
cd "$RUNNER_DIR"
./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --unattended \
  --replace

ok "Runner configured as '$RUNNER_NAME'"

# --- Start via PM2 ---
if pm2 describe github-runner > /dev/null 2>&1; then
  log "Restarting github-runner in PM2"
  pm2 restart github-runner
else
  log "Starting github-runner in PM2"
  # Use the ecosystem config if available, otherwise inline
  APP_DIR="/Users/jasper/apps/upidstay"
  if [ -f "$APP_DIR/deploy/ecosystem.config.cjs" ]; then
    pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --only github-runner
  else
    pm2 start "$RUNNER_DIR/run.sh" --name github-runner --interpreter bash
  fi
fi

pm2 save
ok "Runner started and saved in PM2"

log "Done. The runner is now listening for jobs from $REPO_URL"
