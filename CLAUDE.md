# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server on http://localhost:3000
- `npm run build` / `npm start` — production build / start
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + typescript presets)
- `npm test` — Vitest in watch mode
- `npm run test:run` — Vitest one-shot (CI mode)
- Single test file: `npx vitest run src/components/meditation-player/__tests__/MeditationPlayer.test.tsx`
- Single test by name: `npx vitest run -t "<test name substring>"`

Note: `vitest.config.ts` declares `setupFiles: ['./src/test/setup.ts']`, but that file does not yet exist — create it (e.g. importing `@testing-library/jest-dom/vitest`) before running the suite, or the run will fail to start.

## Stack

Next.js 16 (App Router) + React 19, Tailwind CSS v4 (PostCSS plugin, no separate config file — styles in `src/app/globals.css`), TypeScript with `@/*` → `./src/*` path alias, Lucide icons, Vitest + jsdom + Testing Library.

`@prisma/client` is listed as a dependency, but no `prisma/` directory, schema, client singleton, or `DATABASE_URL`-backed code exists yet. Treat persistence as not-yet-wired-up; the `.env` placeholder `DATABASE_URL="file:./dev.db"` is leftover from `create-next-app`-style setup, not a working SQLite hookup.

## Architecture

Two-screen flow today, all state passed through the URL (no client store, no API routes):

1. **`/`** (`src/app/page.tsx`) — server redirect to `/mood`.
2. **`/mood`** (`src/app/mood/page.tsx`) — renders `MoodCheckIn` (client). Picks a mood, opens `QuickStartOverlay`, and on start does `router.push('/play?sessionId=...&duration=...&guidance=...&moodId=...')`. The session passed to the overlay is currently hardcoded inline.
3. **`/play`** (`src/app/play/page.tsx`) — server component reads & validates the four search params, looks up the mood from `src/lib/masterdata.ts`, then renders `MeditationPlayerClient`, which wraps `MeditationPlayer` and handles navigation. Any missing/invalid param → `redirect('/mood')`. The player is a full-screen fixed overlay (it intentionally sits outside any shell layout).

Layer rules that show up across files:

- **Master data** is hardcoded in `src/lib/masterdata.ts` (`moods` array). Treat it as the source of truth until a DB lands.
- **Domain types** live in `src/lib/types.ts` (`Mood`, `Session`, `ActiveSession`, `GuidanceLevel`, `Duration`, `CompletedSession`, `Stats`). Components import from `@/lib/types`.
- **Components** are grouped by feature under `src/components/<feature>/` with an `index.ts` barrel. All interactive components carry `'use client'`; server components stay in `src/app/*/page.tsx`.
- **Search-params-as-state** is the established pattern for cross-route handoff — keep using it rather than introducing context/store libraries unless the requirement clearly outgrows it.

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` (`DM_Sans` → `--font-dm-sans`, `IBM_Plex_Mono` → `--font-ibm-plex-mono`) and consumed through CSS variables.