#!/usr/bin/env bash
# verify.sh — Check that the deployment environment is correctly configured.
# Run on the mini: ssh mini 'bash -s' < deploy/verify.sh
# Exit 0 = all critical checks pass. Exit 1 = something is wrong.
set -uo pipefail

APP_DIR="/Users/jasper/apps/upidstay"
RUNNER_DIR="/Users/jasper/actions-runner"
PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $*"; ((PASS++)); }
fail() { echo "  [FAIL] $*"; ((FAIL++)); }
warn() { echo "  [WARN] $*"; ((WARN++)); }

echo "=== upidstay deployment verification ==="
echo "Host: $(hostname) | User: $(whoami) | $(date)"
echo ""

# --- Tools ---
echo "--- Tools ---"
if command -v node &>/dev/null; then pass "node $(node --version)"; else fail "node not found"; fi
if command -v pnpm &>/dev/null; then pass "pnpm $(pnpm --version)"; else fail "pnpm not found"; fi
if command -v pm2 &>/dev/null; then pass "pm2 $(pm2 --version)"; else fail "pm2 not found"; fi

# --- Directories ---
echo ""
echo "--- Directories ---"
if [ -d "$APP_DIR" ]; then pass "App dir: $APP_DIR"; else fail "App dir missing: $APP_DIR"; fi
if [ -d "$APP_DIR/data" ]; then pass "Data dir: $APP_DIR/data"; else fail "Data dir missing"; fi
if [ -d "$APP_DIR/.next" ]; then pass "Next.js build exists"; else warn "No .next build directory"; fi
if [ -d "$APP_DIR/node_modules" ]; then pass "node_modules present"; else fail "node_modules missing"; fi

# --- PM2 processes ---
echo ""
echo "--- PM2 Processes ---"
if command -v pm2 &>/dev/null; then
  UPIDSTAY_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == 'upidstay':
        print(p['pm2_env']['status'])
        sys.exit(0)
print('not_found')
" 2>/dev/null || echo "error")

  if [ "$UPIDSTAY_STATUS" = "online" ]; then
    pass "PM2 upidstay: online"
  else
    fail "PM2 upidstay: $UPIDSTAY_STATUS"
  fi

  RUNNER_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == 'github-runner':
        print(p['pm2_env']['status'])
        sys.exit(0)
print('not_found')
" 2>/dev/null || echo "error")

  if [ "$RUNNER_STATUS" = "online" ]; then
    pass "PM2 github-runner: online"
  else
    fail "PM2 github-runner: $RUNNER_STATUS"
  fi
fi

# --- PM2 startup (launchd) ---
echo ""
echo "--- Boot persistence ---"
if launchctl list 2>/dev/null | grep -q pm2; then
  pass "PM2 launchd plist registered"
else
  fail "PM2 launchd plist not found (pm2 won't start on reboot)"
fi

# --- GitHub Actions runner ---
echo ""
echo "--- GitHub Actions Runner ---"
if [ -f "$RUNNER_DIR/.runner" ]; then
  pass "Runner configured: $RUNNER_DIR"
else
  fail "Runner not configured ($RUNNER_DIR/.runner missing)"
fi

# --- Health check ---
echo ""
echo "--- Health Check ---"
if curl -sf -o /dev/null --max-time 5 http://localhost:3080; then
  pass "http://localhost:3080 responds"
else
  fail "http://localhost:3080 not responding"
fi

# --- Disk space ---
echo ""
echo "--- Disk Space ---"
DISK_PCT=$(df -h / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if [ "$DISK_PCT" -lt 90 ]; then
  pass "Disk usage: ${DISK_PCT}%"
else
  warn "Disk usage: ${DISK_PCT}% (>90%)"
fi

# --- Summary ---
echo ""
echo "=== Results: $PASS passed, $FAIL failed, $WARN warnings ==="
if [ "$FAIL" -gt 0 ]; then
  echo "Some checks FAILED. Review output above."
  exit 1
else
  echo "All critical checks passed."
  exit 0
fi
