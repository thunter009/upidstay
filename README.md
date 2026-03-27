# Upidstay

Pig Latin chat app. Next.js 16 + Socket.IO + SQLite, with a custom `server.ts` for real-time messaging.

## Local Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Tests: `pnpm test` | Lint: `pnpm lint` | Build: `pnpm build`

## Architecture

- `server.ts` — Custom HTTP server with Socket.IO and sql.js for message persistence
- `src/` — Next.js app router (React 19, Tailwind, Framer Motion)
- `data/chat.db` — SQLite database (auto-created, gitignored)

## Production Deployment (Mac Mini)

The app runs on a Mac Mini at `upidstay.hunter:3080` via Tailscale. Pushes to `main` auto-deploy via a self-hosted GitHub Actions runner on the mini.

### How auto-deploy works

1. Push to `main` triggers `.github/workflows/deploy.yml`
2. Self-hosted runner (on the mini) checks out the code
3. `pnpm install --frozen-lockfile && pnpm build`
4. `deploy/deploy.sh` rsyncs to `/Users/jasper/apps/upidstay`, restarts via PM2
5. Health check confirms the app responds on port 3080

### Bootstrap (fresh mini or re-setup)

Prerequisites: macOS with Homebrew, Node.js, SSH access.

```bash
# 1. Server setup (installs pnpm, pm2, creates dirs, configures launchd)
ssh mini-admin 'bash -s' < deploy/setup-mini.sh

# 2. Generate a runner registration token (expires in 1 hour)
gh api -X POST repos/thunter009/upidstay/actions/runners/registration-token --jq '.token'

# 3. Install and start the GitHub Actions runner
ssh mini "RUNNER_TOKEN=<token> bash -s" < deploy/setup-runner.sh

# 4. Verify everything is working
ssh mini 'bash -s' < deploy/verify.sh
```

After this, every push to `main` auto-deploys.

### Manual deploy (fallback)

```bash
ssh mini
cd /Users/jasper/apps/upidstay
# If the app dir is not a git clone, rsync from your local machine instead
pnpm install --frozen-lockfile
pnpm build
pm2 restart upidstay
```

### Environment Variables

See `.env.example`. Copy to `.env` on the mini:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3080` | HTTP server port |
| `DB_PATH` | `data/chat.db` | SQLite database path |
| `NODE_ENV` | `production` | Node environment |

### Troubleshooting

**App not responding:**
```bash
pm2 logs upidstay --lines 30
pm2 restart upidstay
```

**Runner not picking up jobs:**
```bash
pm2 logs github-runner --lines 30
# Re-register: generate new token, re-run setup-runner.sh
```

**Port conflict:**
```bash
lsof -i :3080
```

**Database issues:**
DB is at `/Users/jasper/apps/upidstay/data/chat.db`. Deploys never overwrite this directory.

**PM2 not starting on reboot:**
```bash
pm2 startup launchd -u jasper --hp /Users/jasper
pm2 save
```

### Assumptions

- macOS (ARM64) on the deployment target
- Node.js 25.x (any recent LTS should work)
- pnpm for package management
- Tailscale for network access (mini is not publicly reachable)
