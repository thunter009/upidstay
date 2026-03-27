#!/usr/bin/env bash
# deploy.sh — Called by GitHub Actions after build.
# Syncs built project to the app directory and restarts via PM2.
set -euo pipefail

APP_DIR="/Users/jasper/apps/upidstay"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="${GITHUB_WORKSPACE:-$(cd "$SCRIPT_DIR/.." && pwd)}"

log() { echo "[deploy] $(date '+%H:%M:%S') $*"; }

log "Deploying ${GITHUB_SHA:-local} to $APP_DIR"

# Sync project files, preserving data/ (SQLite DB) and .env
rsync -a --delete \
  --exclude='data/' \
  --exclude='.env' \
  --exclude='node_modules/' \
  --exclude='.git/' \
  --exclude='.next/' \
  "$SOURCE_DIR/" "$APP_DIR/"

log "Installing production dependencies"
cd "$APP_DIR"
pnpm install --frozen-lockfile

log "Building Next.js"
pnpm build

log "Restarting PM2 process"
if pm2 describe upidstay > /dev/null 2>&1; then
  pm2 restart upidstay --update-env
else
  pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --only upidstay
fi

pm2 save

sleep 3

# Verify the process is online
STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == 'upidstay':
        print(p['pm2_env']['status'])
        sys.exit(0)
print('not_found')
")

if [ "$STATUS" = "online" ]; then
  log "Deploy successful — upidstay is online"
else
  log "ERROR: upidstay status is '$STATUS'"
  pm2 logs upidstay --lines 20 --nostream
  exit 1
fi
