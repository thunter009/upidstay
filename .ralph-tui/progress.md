# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- Next.js 16 App Router dynamic params: `params` is a `Promise<{}>`, unwrap with `use(params)` in client components
- JoinForm accepts `initialRoom`/`roomLocked` props to pre-fill and disable room input

---

## 2025-02-13 - bd-ty2
- Implemented `slugifyRoom()` in `src/lib/slugify.ts`
- 10 vitest test cases in `src/lib/slugify.test.ts`
- Files changed: `src/lib/slugify.ts`, `src/lib/slugify.test.ts`
- **Learnings:**
  - Emoji stripping needs both surrogate pair range (`U+10000+`) and lone surrogate cleanup
  - Vitest config picks up all `*.test.ts` files automatically
---

## 2026-02-13 - bd-123
- Dynamic `/join/[room]` route: pre-fills room from URL param, input disabled
- Plain `/join` route: all inputs editable
- Extended `JoinForm` with `initialRoom`/`roomLocked` props
- Files changed: `src/components/join-form.tsx`, `src/app/join/[room]/page.tsx` (new), `src/app/join/page.tsx` (new)
- **Learnings:**
  - Next.js 16 `params` is async — use React `use()` to unwrap in client components
  - `slugifyRoom()` applied to URL param to normalize before pre-filling
---

## 2026-02-13 - bd-32y
- Invite button (🔗) in chat header with `aria-label="Invite"`
- Copies `${origin}/join/${slugifyRoom(room)}` to clipboard on click
- "Link copied!" toast for 2s with framer-motion animation
- Files changed: `src/components/chat-room.tsx`
- **Learnings:**
  - `room` from `useSocket()` is `string | null` — guard before passing to `slugifyRoom()`
---
