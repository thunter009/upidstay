#!/usr/bin/env bash
# setup-mini.sh — Idempotent server setup for the Mac Mini.
# Run as jasper: ssh mini 'bash -s' < deploy/setup-mini.sh
# Or manually: scp deploy/setup-mini.sh mini: && ssh mini './setup-mini.sh'
# Safe to re-run at any time.
set -euo pipefail

APP_DIR="/Users/jasper/apps/upidstay"
LOCAL_BIN="/Users/jasper/.local/bin"

# Ensure local bin is on PATH for this session
export PATH="$LOCAL_BIN:$PATH"

log() { echo "[setup] $(date '+%H:%M:%S') $*"; }
ok()  { echo "  [OK] $*"; }
skip() { echo "  [SKIP] $* (already configured)"; }

log "Starting Mac Mini setup"
log "Running as $(whoami) on $(hostname)"

# --- PATH persistence ---
SHELL_RC="$HOME/.zshrc"
if grep -q '.local/bin' "$SHELL_RC" 2>/dev/null; then
  skip "PATH includes $LOCAL_BIN"
else
  log "Adding $LOCAL_BIN to PATH in $SHELL_RC"
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
  ok "PATH updated"
fi

# --- pnpm ---
if command -v pnpm &>/dev/null; then
  skip "pnpm $(pnpm --version)"
else
  log "Installing pnpm via standalone installer"
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  export PATH="$LOCAL_BIN:$PATH"
  ok "pnpm $(pnpm --version)"
fi

# --- pm2 ---
if command -v pm2 &>/dev/null; then
  skip "pm2 $(pm2 --version)"
else
  log "Installing pm2 via pnpm"
  pnpm add -g pm2
  ok "pm2 $(pm2 --version)"
fi

# --- App directory ---
if [ -d "$APP_DIR" ]; then
  skip "App directory $APP_DIR"
else
  log "Creating $APP_DIR"
  mkdir -p "$APP_DIR"
  ok "Created $APP_DIR"
fi

# --- Data directory (SQLite DB) ---
if [ -d "$APP_DIR/data" ]; then
  skip "Data directory $APP_DIR/data"
else
  log "Creating data directory"
  mkdir -p "$APP_DIR/data"
  ok "Created $APP_DIR/data"
fi

# --- Kill bare process if running (one-time migration to PM2) ---
BARE_PID=$(lsof -ti :3080 2>/dev/null || true)
if [ -n "$BARE_PID" ]; then
  # Check if it's already managed by PM2
  if pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
sys.exit(0 if any(p['name'] == 'upidstay' for p in procs) else 1)
" 2>/dev/null; then
    skip "Port 3080 is PM2-managed upidstay"
  else
    log "Stopping bare process on port 3080 (PID: $BARE_PID)"
    kill "$BARE_PID" 2>/dev/null || true
    sleep 2
    ok "Bare process stopped"
  fi
fi

# --- .env from template ---
if [ -f "$APP_DIR/.env" ]; then
  skip ".env file"
else
  if [ -f "$APP_DIR/.env.example" ]; then
    log "Creating .env from template"
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    ok "Created .env"
  else
    log "Creating default .env"
    cat > "$APP_DIR/.env" <<'ENVEOF'
PORT=3080
DB_PATH=data/chat.db
NODE_ENV=production
ENVEOF
    ok "Created .env with defaults"
  fi
fi

# --- PM2 startup (launchd) ---
if launchctl list 2>/dev/null | grep -q pm2; then
  skip "PM2 startup (launchd plist)"
else
  log "Configuring PM2 startup for $(whoami)"
  # pm2 startup generates a command — on macOS as non-root it auto-configures for the current user
  pm2 startup launchd 2>&1 | tail -5
  ok "PM2 startup configured"
fi

log "Setup complete. Next: run setup-runner.sh with RUNNER_TOKEN"
