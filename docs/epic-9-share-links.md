# Epic 9: Shareable Room Links

## Overview
Join rooms via URL links + native share. Parent texts link to kid's tablet, kid taps, they're in.

## Goals
- Zero-friction room joining via URL
- Share button with native share API + clipboard fallback
- URL-safe room name slugification
- Works on Chrome, Safari, mobile browsers

## Quality Gates
- All vitest tests pass (`pnpm test`)
- Playwright browser verification passes for each UI story
- No TypeScript errors (`pnpm build`)
- Existing functionality unbroken

---

## User Stories

### S-9.1: Room name slugification utility

**As a** developer
**I want** a `slugifyRoom()` function
**So that** room names are URL-safe while preserving display names

**Acceptance Criteria:**
- `src/lib/slugify.ts` exports `slugifyRoom(name: string): string`
- Lowercases, trims, replaces spaces with hyphens
- Strips non-alphanumeric chars (except hyphens)
- Strips emoji
- Collapses multiple hyphens
- Idempotent (slugifying a slug returns same slug)
- Throws on empty input
- `src/lib/slugify.test.ts` covers ≥ 8 edge cases

## Exit Condition

```bash
set -e
cd /Users/thom/10-19_projects/upidstay

# Files exist
test -f src/lib/slugify.ts
test -f src/lib/slugify.test.ts

# Test file has real assertions (not just imports)
grep -qE "expect\(.*\)\." src/lib/slugify.test.ts

# Tests pass
pnpm test -- --run src/lib/slugify.test.ts

# No build errors
pnpm build
```

---

### S-9.2: Dynamic /join/[room] route

**As a** kid receiving a link
**I want** to open `/join/rainbow-party` and have the room pre-filled
**So that** I just enter my name and pick an avatar

**Acceptance Criteria:**
- `src/app/join/[room]/page.tsx` exists
- URL param `room` pre-fills and locks room name input (disabled)
- Fallback: `/join?room=<name>` query param also works
- `/join` with no param shows empty editable room input
- Uses `slugifyRoom()` from S-9.1 to normalize

## Exit Condition

```bash
set -e
cd /Users/thom/10-19_projects/upidstay

# Route file exists
test -f src/app/join/page.tsx || test -f "src/app/join/[room]/page.tsx"

# Build succeeds (route compiles)
pnpm build

# Start server for playwright verification
pnpm run dev -- -p 3099 &
PID=$!
sleep 6

# Verify /join/test-room pre-fills room name
playwright-cli open http://localhost:3099/join/test-room
sleep 2
playwright-cli snapshot

# Check room input is pre-filled and disabled
playwright-cli eval "document.querySelector('input[disabled]')?.value || ''" > /tmp/pw-join-room.txt 2>&1
grep -qi "test-room" /tmp/pw-join-room.txt

# Verify /join with no param has empty editable input
playwright-cli goto http://localhost:3099/join
sleep 1
playwright-cli eval "document.querySelector('input:not([disabled])')?.placeholder || ''" > /tmp/pw-join-empty.txt 2>&1
# Should have a placeholder (empty room input is editable)
test -s /tmp/pw-join-empty.txt

playwright-cli close
kill $PID 2>/dev/null
rm -f /tmp/pw-join-room.txt /tmp/pw-join-empty.txt
```

---

### S-9.3: Copy link / Invite button in chat header

**As a** kid in a room
**I want** to tap "Invite" and get a shareable link
**So that** I can send it to my friends

**Acceptance Criteria:**
- "Invite" button visible in chat room header
- Generates `<origin>/join/<room-slug>` URL
- Copies to clipboard via `navigator.clipboard.writeText()`
- Toast "Link copied!" visible for ≥ 1.5s
- Button has `aria-label="Invite"` for accessibility

## Exit Condition

```bash
set -e
cd /Users/thom/10-19_projects/upidstay

# Invite button exists in chat-room component
grep -q "Invite\|invite" src/components/chat-room.tsx

# Build succeeds
pnpm build

# Start server
pnpm run dev -- -p 3099 &
PID=$!
sleep 6

# Join a room so we can see the chat header
playwright-cli open http://localhost:3099
sleep 2
playwright-cli snapshot

# Fill in join form
playwright-cli eval "document.querySelectorAll('.kid-input').length" > /tmp/pw-inputs.txt 2>&1

# Type name and room
playwright-cli fill e1 "TestKid"
playwright-cli fill e2 "share-test"
# Click join button
playwright-cli eval "document.querySelector('.big-button')?.click()"
sleep 2
playwright-cli snapshot

# Verify invite button exists in chat header
playwright-cli eval "document.querySelector('[aria-label=\"Invite\"]')?.tagName || document.querySelector('button')?.textContent?.includes('Invite') || ''" > /tmp/pw-invite.txt 2>&1
test -s /tmp/pw-invite.txt

playwright-cli close
kill $PID 2>/dev/null
rm -f /tmp/pw-inputs.txt /tmp/pw-invite.txt
```

---

### S-9.4: Native share API with fallback

**As a** parent on mobile
**I want** the share button to open my phone's share sheet
**So that** I can text the room link to my kid

**Acceptance Criteria:**
- When `navigator.share` exists: calls it with `{ title: "Join my Pig Latin room!", url }`
- When `navigator.share` undefined: falls back to clipboard copy (same as S-9.3)
- `src/lib/share.ts` exports `shareRoom(roomSlug: string): Promise<void>`
- Unit test mocks `navigator.share` and verifies payload
- Unit test mocks absence of `navigator.share` and verifies clipboard fallback

## Exit Condition

```bash
set -e
cd /Users/thom/10-19_projects/upidstay

# Share utility exists
test -f src/lib/share.ts

# Test file exists with navigator.share mock
test -f src/lib/share.test.ts
grep -qE "navigator.share|mock|vi.fn" src/lib/share.test.ts

# Tests pass
pnpm test -- --run src/lib/share.test.ts

# No build errors
pnpm build
```
