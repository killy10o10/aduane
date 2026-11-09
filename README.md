# Aduane

A Ghanaian-first healthy eating app. It builds personalized, goal-based meal
plans centered on Ghanaian cuisine, with recipe videos embedded in-app so people
who can't cook can follow along.

> **Status:** Phase 1 complete (scaffold, onboarding, macro calculator, Ghana
> dish seed). See [Build status](#build-status).

## Stack

| Concern    | Choice                                           |
| ---------- | ------------------------------------------------ |
| Framework  | Next.js (App Router) + React + TypeScript        |
| Styling    | Tailwind CSS v4 + an owned component system      |
| Database   | PostgreSQL (Supabase) via Prisma                 |
| Auth       | Supabase Auth (email + Google)                   |
| Video      | YouTube iframe in a modal, behind `VideoEmbed`   |
| Hosting    | Vercel                                           |

## Getting started

```bash
npm install
cp .env.example .env            # fill in Supabase + database values
npm run db:generate             # generate the Prisma client
npm run db:push                 # create tables (or: npm run db:migrate)
npm run db:seed                 # load the Ghanaian dish dataset
npm run dev                     # http://localhost:3000
```

The app runs **without** a database for the onboarding + macro calculator flow —
targets are computed by a pure module. A database is only needed to persist
profiles and (Phase 2+) meal plans.

## Scripts

| Script                | What it does                               |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start the dev server                       |
| `npm run build`       | Production build                           |
| `npm run typecheck`   | `tsc --noEmit` across the whole project    |
| `npm test`            | Run the Vitest suite                       |
| `npm run db:seed`     | Seed dishes + ingredients                  |
| `npm run db:studio`   | Open Prisma Studio                         |

## Architecture

Clean separation, so each layer is testable and swappable:

```
data layer (Prisma schema, src/data) 
  -> services (nutrition math, plan generator)   <- pure, framework-free, tested
    -> server actions / route handlers
      -> UI (App Router pages + owned component system)
```

Key modules:

- [`src/lib/nutrition/macros.ts`](src/lib/nutrition/macros.ts) — Mifflin-St Jeor
  BMR, TDEE, goal adjustment and macro split. **Pure functions, fully unit
  tested** ([`macros.test.ts`](src/lib/nutrition/macros.test.ts)).
- [`src/data/dishes.ts`](src/data/dishes.ts) — the hand-curated Ghana-first dish
  dataset (seed source of truth).
- [`prisma/schema.prisma`](prisma/schema.prisma) — multi-user, multi-goal from
  day one; creator content and free/premium feature flags are schema'd now and
  unlocked, so adding them later needs no re-architecting.
- [`src/components/ui`](src/components/ui) — the owned component system (Button,
  Card, Field, OptionGroup, Badge, Modal, VideoEmbed, Macros).

### Design principles baked in

- **Ghana-first:** dishes carry a `Cuisine`; the generator (Phase 2) ranks
  `GHANAIAN` ahead of `INTERNATIONAL`.
- **Multi-user / multi-goal:** v1 has one user, but nothing is single-user.
- **Video is source-agnostic:** `VideoEmbed` takes `{ source, platformId }`;
  TikTok/Instagram plug in by adding one branch.
- **Feature flags now, billing later:** `Entitlement` exists and is fully
  unlocked. No payment code in v1.
- **AI (v3) is server-only:** no key ever reaches the client.

## Build status

- [x] **Phase 1** — Scaffold, Tailwind, Prisma schema, onboarding + macro
      calculator, ~50 Ghanaian dishes seeded.
- [ ] **Phase 2** — Meal-plan generator + weekly timetable + Today view.
- [ ] **Phase 3** — In-app recipe video modal + recipe detail.
- [ ] **Phase 4** — Progress tracking + grocery list.
- [ ] **Phase 5** — Creator schema surfaced in UI; multi-source video.
- [ ] **Phase 6** — AI recommendations (metered).

## Notes for the next phase

- The dish seed intentionally ships **without videos** — recipe video content is
  a Phase 3 task. The schema (`Video`) and `VideoEmbed` already support them;
  dishes show a "video coming soon" empty state until added.
- Supabase auth UI (login/signup) is not wired yet; the onboarding flow computes
  and displays targets, and persists them once a user is signed in.
