# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js)
npm run build     # Production build
npm run lint      # Run ESLint
npm start         # Start production server
```

No test runner is configured yet.

## Architecture

This is a **Next.js 16 App Router** project using **React 19**, **TypeScript** (strict mode), and **Tailwind CSS v4**.

- `src/app/` — App Router pages and layouts. `layout.tsx` sets up Geist fonts globally; `page.tsx` is the home route.
- `src/types/todo.ts` — Core domain types: `Todo` (id, title, completed, createdAt, optional targetTime/completedAt) and `UserStats` (streak tracking, badges).
- Path alias `@/*` maps to `src/*`.

The app is in early development — only the scaffold and type definitions exist so far. The `Todo` and `UserStats` types indicate the intended features: todo management with completion tracking, time targets, streaks, and badges.
