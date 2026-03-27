# AGENTS.md — Upidstay

> Guidelines for AI coding agents working in this Next.js + Socket.IO real-time chat codebase.
> Upidstay is a kid-friendly Pig Latin chat app with difficulty modes, voice I/O, and emoji avatars.

---

## Rule 0: Human Override

The human's instructions override everything below. If told to do something that conflicts with these rules, follow the human.

---

## Rule 1: No File Deletion

Never delete files or directories without explicit permission. Even files you just created. If you think something should be removed, ask first and receive written approval before proposing any deletion command.

---

## Rule 2: No Destructive Git or Filesystem Commands

Absolutely forbidden unless the human gives the exact command and explicit approval:

- `git reset --hard`
- `git clean -fd`
- `rm -rf`
- Any command that can delete or overwrite code/data

Prefer safe alternatives: `git status`, `git diff`, `git stash`, copying to backups. If there is any uncertainty about what a command might delete, stop and ask.

---

## Rule 3: Branch Policy

All work happens on `main`. No feature branches unless explicitly requested.

---

## Rule 4: No Script-Based Code Changes

Never run scripts that bulk-modify code (codemods, sed/awk refactors, one-off transform scripts). Make all code changes manually, file by file. For many similar changes, use parallel subagents.

---

## Rule 5: No File Proliferation

Never create variant files like `server_v2.ts`, `chat-room-improved.tsx`, `types_backup.ts`. Revise existing files in place. New files are only for genuinely new functionality. The bar for creating new files is high.

---

## Rule 6: Quality Checks After Changes

After any code changes, verify no errors were introduced:

```bash
pnpm build          # Next.js production build
pnpm test           # Vitest unit tests
pnpm lint           # ESLint
ubs $(git diff --name-only)  # Bug scanner on changed files
```

If errors appear, understand and fix each one properly — do not suppress or ignore.

---

## Rule 7: Multi-Agent Awareness

Never stash, revert, or overwrite another agent's uncommitted changes. If you see unexpected modifications, investigate before touching them.

---

## Rule 8: Atomic Commits

Each commit should be a single logical change. Don't bundle unrelated work.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x | App Router, `"use client"` for interactive pages |
| UI | React | 19.x | Hooks only, no class components |
| Language | TypeScript | 5 | Strict mode enabled |
| Styling | Tailwind CSS | 4 | `@tailwindcss/postcss`, kid-friendly custom palette |
| Animation | Framer Motion | 12.x | Spring animations, `motion.div` wrappers |
| Real-time | Socket.IO | 4.8.x | Server + client packages |
| Database | SQLite via sql.js | 1.14.x | WebAssembly, in-memory + file export |
| Dev runner | tsx | 4.x | Runs server.ts directly (no compile step) |
| Tests | Vitest | 4.x | Colocated `*.test.ts` files |
| Package mgr | pnpm | latest | Frozen lockfile in CI |

---

## Server Architecture — READ THIS CAREFULLY

**The server is NOT Express.** It is bare `http.createServer()` wrapping the Next.js request handler, with Socket.IO attached to the same HTTP server.

```
server.ts
├── http.createServer((req, res) => handle(req, res))  ← Next.js handler
├── new Server(httpServer, { cors: { origin: "*" } })  ← Socket.IO
├── SQLite init (sql.js, in-memory + file at data/chat.db)
├── Room management (in-memory Map<slug, Map<socketId, RoomUser>>)
└── Message buffering (in-memory Map<slug, ChatMessage[]>, capped at 100)
```

**Adding custom HTTP routes** requires intercepting requests BEFORE the Next.js handler:
```typescript
const httpServer = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/upload') {
    // handle custom route
  } else {
    handle(req, res);  // Next.js handles everything else
  }
});
```

**Port selection:**
- Dev: 3000 (default), overridable via `-p` flag or `PORT` env
- Production: 3080 (set in PM2 ecosystem config)
- E2E tests: 3099 (set in Playwright webServer config)

---

## Socket.IO Event Protocol

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `join-room` | Client → Server | `{ room, username, avatar }` | Server slugifies room name |
| `room-joined` | Server → Client | `{ slug, displayName }` | Canonical slug + display name |
| `send-message` | Client → Server | `{ english, pigLatin }` | Pig latin computed client-side |
| `new-message` | Server → Room | Full ChatMessage | Broadcast to all room members |
| `message-history` | Server → Client | ChatMessage[] | Up to 100, on join |
| `typing` | Client → Server | (none) | |
| `user-typing` | Server → Room | `{ username }` | Excludes sender |
| `leave-room` | Client → Server | (none) | |
| `room-users` | Server → Room | RoomUser[] | After any join/leave/change |
| `user-joined` | Server → Room | `{ username }` | System notification |
| `user-left` | Server → Room | `{ username }` | System notification |
| `room-list` | Server → All | Array<{ name, slug, count }> | Active + historical rooms |
| `disconnect` | Auto | (none) | Socket.IO handles cleanup |

**Message IDs** are generated as `${socket.id}-${Date.now()}`. System messages use `system-${Date.now()}`.

---

## Database Schema

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,          -- slugified room name
  username TEXT NOT NULL,
  avatar TEXT NOT NULL,         -- avatar ID string (e.g. "bear", "rocket")
  english TEXT NOT NULL,
  pig_latin TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
CREATE INDEX idx_messages_room_ts ON messages(room, timestamp);

CREATE TABLE room_names (
  slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL    -- human-readable room name
);
```

Database is saved to disk after every insert via `sqlDb.export()` → `writeFileSync()`. This is fine for the expected scale (family/classroom use).

---

## TypeScript Types

```typescript
interface RoomUser { id: string; username: string; avatar: string }

interface ChatMessage {
  id: string; username: string; avatar: string;
  english: string; pigLatin: string; timestamp: number;
}

type DifficultyLevel = "explorer" | "detective" | "spy";
type AvatarId = "bear" | "cat" | "dog" | ... // 24 total, from AVATARS const
```

**AVATARS** is a `const` array in `src/lib/types.ts` with 24 entries across 5 categories (animals, mythical, food, space, fun). IDs must remain stable for localStorage backward compat.

---

## Pig Latin Algorithm

Core function: `toPigLatin(text: string): string` in `src/lib/pig-latin.ts`.

Rules:
- Vowel-start → append "way" (`apple` → `appleway`)
- Consonant-start → move consonant cluster to end + "ay" (`hello` → `ellohay`, `string` → `ingstray`)
- "qu" treated as single unit (`question` → `estionquay`)
- All-consonant words → append "ay" (`fly` → `flyay`)
- Case preserved (Title, ALL CAPS, lower)
- Punctuation preserved in position

Helper: `getConsonantCluster(word)` → used by `ConsonantHighlight` and `WordReveal` components.

**81 unit tests** cover this thoroughly. Do not change the algorithm without running `pnpm test`.

---

## Difficulty Modes

| Mode | Display | Used For |
|------|---------|----------|
| Explorer 🗺️ | Pig latin with consonant highlights + English subtitle | Learning scaffolding |
| Detective 🔍 | Pig latin only; tap word to peek English for 2 seconds | Active practice |
| Spy 🕵️ | Full pig latin, no hints | Fluency challenge |

Own messages always show English. System messages always show English.

---

## Component Architecture

```
src/app/page.tsx          ← Home: renders JoinForm or ChatRoom based on socket state
src/app/join/[room]/      ← Dynamic route: pre-filled room name, locked input

src/components/
├── join-form.tsx          ← Profile mgmt, room selection, avatar picker
├── chat-room.tsx          ← Main chat: header, settings, message list, input
├── chat-input.tsx         ← Text input + voice mic + send button
├── message-bubble.tsx     ← Difficulty-aware message rendering + TTS
├── avatar-picker.tsx      ← 24 emoji grid by category
├── difficulty-picker.tsx  ← Explorer/Detective/Spy toggle
├── typing-indicator.tsx   ← Animated "X is typing..."
├── word-reveal.tsx        ← Detective mode tap-to-reveal
├── consonant-highlight.tsx ← Explorer mode cluster coloring
└── practice-mode.tsx      ← Solo pig latin quiz with streak counter

src/lib/
├── socket-context.tsx     ← React Context for all Socket.IO state
├── types.ts               ← Interfaces, AVATARS const, getAvatarEmoji()
├── profiles.ts            ← localStorage profile CRUD
├── pig-latin.ts           ← Core algorithm (81 tests)
├── slugify.ts             ← Room name normalization (10 tests)
├── share.ts               ← Native Share API + clipboard fallback
├── sounds.ts              ← Web Audio tone generation
└── speech.ts              ← TTS + speech recognition wrappers
```

**State management:** React Context (`SocketProvider`) + local component state + localStorage. No Redux/Zustand.

---

## File Conventions

- **Components:** `src/components/kebab-case.tsx`, `"use client"` directive
- **Utilities:** `src/lib/kebab-case.ts`
- **Unit tests:** Colocated `src/lib/foo.test.ts` (next to source file)
- **E2E tests:** `e2e/feature-name.test.ts` (Playwright, being set up)
- **Pages:** `src/app/` directory (Next.js App Router)
- **Styles:** `src/app/globals.css` (Tailwind + custom properties)

---

## Build, Test, Deploy

### Development
```bash
pnpm install            # Install deps
pnpm dev                # tsx watch server.ts → http://localhost:3000
pnpm build              # Next.js production build
pnpm test               # Vitest (unit tests, one-shot)
pnpm test:watch         # Vitest (watch mode)
pnpm lint               # ESLint
```

### Production (Mac Mini via Tailscale)
- **Target:** macOS ARM64, user `jasper`, path `/Users/jasper/apps/upidstay`
- **Process manager:** PM2 with `deploy/ecosystem.config.cjs`
- **Auto-deploy:** Push to `main` → GitHub Actions self-hosted runner → `deploy/deploy.sh` (rsync + PM2 restart)
- **Health check:** `curl http://localhost:3080`
- **Logs:** `pm2 logs upidstay`

### Deploy scripts
| Script | Purpose |
|--------|---------|
| `deploy/deploy.sh` | rsync to Mac Mini + pnpm install + build + PM2 restart |
| `deploy/setup-mini.sh` | One-time Mac Mini setup (idempotent) |
| `deploy/setup-runner.sh` | GitHub Actions runner installation |
| `deploy/verify.sh` | Health check |
| `deploy/ecosystem.config.cjs` | PM2 config (upidstay + github-runner) |

### Environment Variables
```
PORT=3080              # HTTP server port (default 3000)
DB_PATH=data/chat.db   # SQLite file path
NODE_ENV=production    # Enables Next.js production mode
```

---

## Issue Tracking: Beads (`br` CLI)

Issues are tracked via beads-rust (`br`) in the `.beads/` directory, committed to git.

```bash
# View work
bv --robot-triage          # Graph-aware prioritized recommendations
bv --robot-next            # Single top pick
br show <id>               # Full issue details + deps

# Work on issues
br update <id> --status in_progress   # Claim
br close <id>                          # Complete
br create --title "..." --type task    # New issue

# Dependencies
br dep add <issue> <depends-on>
br dep remove <issue> <depends-on>
br dep cycles                          # Check for cycles

# Sync to git
br sync --flush-only                   # Export DB to JSONL
git add .beads/ && git commit -m "sync beads"
```

Priority: P0=critical, P1=high, P2=medium, P3=low, P4=backlog.
Types: task, bug, feature, epic, chore, docs, question.

---

## Common Patterns

### Adding a Socket.IO event
1. Add handler in `server.ts` inside the `io.on("connection")` callback
2. Add emit/listener in `src/lib/socket-context.tsx`
3. Expose via context value and `useSocket()` hook
4. Wire into component props

### Adding a new field to ChatMessage
1. Update `ChatMessage` interface in `src/lib/types.ts`
2. Update server-side `ChatMessage` interface in `server.ts` (duplicated, not shared)
3. Add DB migration: `ALTER TABLE messages ADD COLUMN ...`
4. Update `insertMessage()` and `loadHistory()` in `server.ts`
5. Update `send-message` handler to accept new field
6. Update `socket-context.tsx` to pass field through
7. Update `message-bubble.tsx` to render it

### Adding a React component
1. Create `src/components/kebab-case.tsx` with `"use client"` directive
2. Use Tailwind for styling, Framer Motion for animations
3. Kid-friendly design: large buttons (min 44px touch target), big fonts, playful colors
4. Test touch interactions (primary audience uses tablets/Chromebooks)

### Modifying the pig latin algorithm
- **Stop.** The algorithm has 81 tests for a reason. Run `pnpm test` before AND after changes.
- The `getConsonantCluster()` function is used by UI components — changing its return type breaks them.

---

## What NOT to Do

- Don't add Express. The server is intentionally bare `http.createServer`.
- Don't add a state manager (Redux, Zustand). Context + local state is sufficient.
- Don't add authentication. Usernames are freeform by design (kids pick fun names).
- Don't add external services for file hosting. Everything stays on the local server.
- Don't use `react-markdown` or heavy parsers. Hand-roll lightweight renderers.
- Don't change AVATAR IDs — existing localStorage profiles reference them.
- Don't assume the server is Express when adding HTTP routes.

---

## Target Audience

Users are **kids learning Pig Latin** (ages 6-12) on school Chromebooks and family tablets. Design accordingly:
- Large, tappable UI elements (44px+ touch targets)
- Simple, colorful interface (kid-pink, kid-sky palette in globals.css)
- No moderation/auth needed (trusted LAN environment via Tailscale)
- Voice input/output (speech recognition + TTS for accessibility)
- Sound effects for engagement (send, receive, join, correct, wrong)
