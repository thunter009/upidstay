# AGENTS.md — Upidstay

> Guidelines for AI coding agents working in this Next.js + Socket.IO real-time chat codebase.
> Upidstay is a kid-friendly Pig Latin chat app with difficulty modes, voice I/O, and emoji avatars.

**Contract**: durable rules only, 250-line budget; dated lessons → journal; task specifics → beads.
Adding when full means deleting something weaker.

---

## Rules

0. **Human override** — the human's instructions override everything below.
1. **No file deletion** without explicit permission, even files you just created.
2. **No destructive git/fs commands** (`git reset --hard`, `git clean -fd`, `rm -rf`, anything that can delete or overwrite code/data) unless the human gives the exact command and explicit approval. Prefer `git status`/`diff`/`stash`, backups. Uncertain → stop and ask.
3. **Branch policy**: all work on `main`. No feature branches unless requested.
4. **No script-based bulk code changes** (codemods, sed/awk refactors). Edit manually file by file; for many similar changes use parallel subagents.
5. **No file proliferation**: no `server_v2.ts` / `_improved` / `_backup` variants. Revise in place; new files only for genuinely new functionality.
6. **Quality checks after changes**: `pnpm build`, `pnpm test`, `pnpm lint`, `ubs $(git diff --name-only)`. Fix errors properly — never suppress.
7. **Multi-agent awareness**: never stash/revert/overwrite another agent's uncommitted changes; investigate unexpected modifications first.
8. **Atomic commits**: one logical change each.

---

## Tech Stack

Next.js 16 (App Router) · React 19 (hooks only) · TypeScript 5 strict · Tailwind CSS 4 (`@tailwindcss/postcss`, kid palette) · Framer Motion 12 · Socket.IO 4.8 · SQLite via sql.js (WASM, in-memory + file export) · tsx 4 (runs `server.ts` directly, no compile step) · Vitest (colocated `*.test.ts`) · pnpm (frozen lockfile in CI).

---

## Server Architecture

**The server is NOT Express.** `server.ts` is bare `http.createServer()` wrapping the Next.js handler, with Socket.IO attached to the same HTTP server. It also holds: SQLite init (sql.js, file at `data/chat.db`), in-memory room map (`Map<slug, Map<socketId, RoomUser>>`), and a per-room message buffer capped at 100.

Custom HTTP routes must intercept the request BEFORE calling the Next.js `handle(req, res)` fallback inside the `createServer` callback.

**Ports**: dev 3000 (`-p` flag or `PORT` env) · production 3080 (PM2 ecosystem config).

---

## Socket.IO Event Protocol

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-room` | C→S | `{ room, username, avatar }` (server slugifies) |
| `room-joined` | S→C | `{ slug, displayName }` |
| `send-message` | C→S | `{ english, pigLatin }` (pig latin computed client-side) |
| `new-message` | S→room | full ChatMessage |
| `message-history` | S→C | ChatMessage[] (≤100, on join) |
| `typing` / `user-typing` | C→S / S→room | none / `{ username }` (excludes sender) |
| `leave-room` | C→S | none |
| `room-users` | S→room | RoomUser[] after any join/leave/change |
| `user-joined` / `user-left` | S→room | `{ username }` system notifications |
| `room-list` | S→all | `Array<{ name, slug, count }>` active + historical |

Message IDs: `${socket.id}-${Date.now()}`; system messages `system-${Date.now()}`.

---

## Database

`messages(id PK, room /*slug*/, username, avatar, english, pig_latin, timestamp)` with index on `(room, timestamp)`; `room_names(slug PK, display_name)`. DB is exported to disk after every insert — fine for family/classroom scale.

---

## Types & Pig Latin

Interfaces (`RoomUser`, `ChatMessage`, `DifficultyLevel = "explorer" | "detective" | "spy"`, `AvatarId`) live in `src/lib/types.ts`. **`ChatMessage` is duplicated in `server.ts`** (not shared) — update both. `AVATARS` const: 24 entries in 5 categories; **IDs must stay stable** (localStorage backward compat).

`toPigLatin(text)` in `src/lib/pig-latin.ts`: vowel-start → +"way"; consonant cluster → moved to end +"ay"; "qu" is one unit; all-consonant words → +"ay"; case and punctuation preserved. `getConsonantCluster(word)` is used by `ConsonantHighlight` and `WordReveal` — changing its return type breaks UI. Algorithm is covered by unit tests: run `pnpm test` before AND after touching it.

---

## Difficulty Modes

Explorer 🗺️ = pig latin + consonant highlights + English subtitle · Detective 🔍 = pig latin only, tap word to peek English 2s · Spy 🕵️ = no hints. Own messages and system messages always show English.

---

## Layout & Conventions

- `src/app/page.tsx` — renders JoinForm or ChatRoom based on socket state; `src/app/join/[room]/` — pre-filled room name route.
- `src/components/*.tsx` — kebab-case, `"use client"`: join-form, chat-room, chat-input, message-bubble, avatar-picker, difficulty-picker, typing-indicator, word-reveal, consonant-highlight, practice-mode.
- `src/lib/*.ts` — socket-context (React Context for all Socket.IO state), types, profiles (localStorage CRUD), pig-latin, slugify, share, sounds (Web Audio), speech (TTS + recognition).
- Unit tests colocated (`src/lib/foo.test.ts`). E2E (Playwright, `e2e/`) is planned, not yet present.
- State management: Context + local state + localStorage. No Redux/Zustand.
- Styles: `src/app/globals.css` (Tailwind + custom properties).

---

## Build, Test, Deploy

Dev: `pnpm install` · `pnpm dev` (tsx watch, :3000) · `pnpm build` · `pnpm test` / `pnpm test:watch` · `pnpm lint`.

Production: Mac Mini via Tailscale — user `jasper`, `/Users/jasper/apps/upidstay`, PM2 (`deploy/ecosystem.config.cjs`). Auto-deploy: push to `main` → GitHub Actions self-hosted runner → `deploy/deploy.sh` (rsync + install + build + PM2 restart). Health: `curl http://localhost:3080`; logs: `pm2 logs upidstay`. One-time setup scripts: `deploy/setup-mini.sh`, `deploy/setup-runner.sh`, `deploy/verify.sh`.

Env vars: `PORT` (default 3000; prod 3080), `DB_PATH` (default `data/chat.db`), `NODE_ENV=production`.

---

## Issue Tracking

Beads (`br` CLI), `.beads/` committed to git. Pick work: `bv --robot-triage` (or `--robot-next`); claim `br update <id> --status in_progress`; finish `br close <id>`; sync `br sync --flush-only && git add .beads/ && git commit -m "sync beads"`. Priorities P0–P4.

---

## Common Patterns

- **New Socket.IO event**: handler in `server.ts` `io.on("connection")` → emit/listener in `src/lib/socket-context.tsx` → expose via context/`useSocket()` → wire into component.
- **New ChatMessage field**: update BOTH interfaces (types.ts + server.ts) → `ALTER TABLE messages` → `insertMessage()`/`loadHistory()` → `send-message` handler → socket-context → message-bubble.
- **New component**: `src/components/kebab-case.tsx` with `"use client"`; Tailwind + Framer Motion; kid-friendly (44px+ touch targets, big fonts, playful colors); test touch (audience uses tablets/Chromebooks).

---

## What NOT to Do

- Don't add Express — the bare `http.createServer` is intentional.
- Don't add a state manager (Redux/Zustand) or authentication (freeform usernames by design).
- Don't add external file-hosting services; everything stays on the local server.
- Don't use `react-markdown`/heavy parsers — hand-roll lightweight renderers.
- Don't change AVATAR IDs (localStorage profiles reference them).

---

## Target Audience

Kids 6–12 learning Pig Latin on school Chromebooks and family tablets: large tappable UI (44px+), colorful kid-pink/kid-sky palette, no moderation/auth (trusted Tailscale LAN), voice I/O for accessibility, sound effects (send, receive, join, correct, wrong).
