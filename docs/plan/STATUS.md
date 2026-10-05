# Build Status

_Updated: 2026-10-05 · Current phase: 0 Foundation · Current subphase: 0.6 Core libraries_

> This file is the handoff surface between sessions/agents. Update it at the **end of every
> working session** and whenever a gate is passed, a blocker appears, or a decision is taken.
> Never delete history — append.

## Progress

| Phase           | Subphase                           | State       | Evidence (PR, URL, command output)                                           |
| --------------- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| 0 Foundation    | 0.1 Repo, git, tooling             | done        | commit 03e52dd; lint/format/typecheck/commitlint pass                        |
| 0 Foundation    | 0.2 Env + local DB                 | done        | docker-compose (dev+test DBs), lib/env.ts, vitest 5/5                        |
| 0 Foundation    | 0.3 Tokens, fonts, shell           | done        | tokens in globals.css, fonts, UI primitives, build ok                        |
| 0 Foundation    | 0.4 Brand contract + config        | done        | SITE config typed, SVG placeholder, app/icon.png, og:image 200, 7/7 tests    |
| 0 Foundation    | 0.5 Prisma + seed                  | done        | Prisma 6.19.3 schema §7.2, migration init, idempotent seed, 11/11 tests pass |
| 0 Foundation    | 0.6 Core libraries                 | not-started |                                                                              |
| 0 Foundation    | 0.7 Auth.js admin gate             | not-started |                                                                              |
| 0 Foundation    | 0.8 Health, metadata, noindex      | not-started |                                                                              |
| 0 Foundation    | 0.9 Test harness                   | not-started |                                                                              |
| 0 Foundation    | 0.10 CI/CD, Vercel, Neon           | not-started |                                                                              |
| 0 Foundation    | 0.11 Docs + amendments             | not-started |                                                                              |
| 0 Foundation    | **Phase exit gate**                | not-started |                                                                              |
| 1 Public        | 1.1 Home composition               | not-started |                                                                              |
| 1 Public        | 1.2 Guest link + session           | not-started |                                                                              |
| 1 Public        | 1.3 Hero + opening sequence        | not-started |                                                                              |
| 1 Public        | 1.4 Countdown + invitation text    | not-started |                                                                              |
| 1 Public        | 1.5 Story timeline                 | not-started |                                                                              |
| 1 Public        | 1.6 Events + ICS                   | not-started |                                                                              |
| 1 Public        | 1.7 Venue + deep links             | not-started |                                                                              |
| 1 Public        | 1.8 Colour, teasers, FAQ, footer   | not-started |                                                                              |
| 1 Public        | 1.9 Perf + a11y pass               | not-started |                                                                              |
| 1 Public        | **Phase exit gate**                | not-started |                                                                              |
| 2 RSVP/gifts    | 2.1 Validation schemas             | not-started |                                                                              |
| 2 RSVP/gifts    | 2.2 RSVP API                       | not-started |                                                                              |
| 2 RSVP/gifts    | 2.3 RSVP UI + phone path           | not-started |                                                                              |
| 2 RSVP/gifts    | 2.4 RSVP email                     | not-started |                                                                              |
| 2 RSVP/gifts    | 2.5 Admin RSVP/guests              | not-started |                                                                              |
| 2 RSVP/gifts    | 2.6 Gift UI                        | not-started |                                                                              |
| 2 RSVP/gifts    | 2.7 Paystack core                  | not-started |                                                                              |
| 2 RSVP/gifts    | 2.8 Gift complete + receipt        | not-started |                                                                              |
| 2 RSVP/gifts    | 2.9 Admin ledger                   | not-started |                                                                              |
| 2 RSVP/gifts    | **Phase exit gate**                | not-started |                                                                              |
| 3 Gallery/admin | 3.1 Cloudinary helpers             | not-started |                                                                              |
| 3 Gallery/admin | 3.2 Gallery + lightbox             | not-started |                                                                              |
| 3 Gallery/admin | 3.3 sync/zip scripts               | not-started |                                                                              |
| 3 Gallery/admin | 3.4 Guest uploads                  | not-started |                                                                              |
| 3 Gallery/admin | 3.5 Moderation queue               | not-started |                                                                              |
| 3 Gallery/admin | 3.6 Settings + mode + QR           | not-started |                                                                              |
| 3 Gallery/admin | 3.7 Overview + guests import       | not-started |                                                                              |
| 3 Gallery/admin | 3.8 Mode matrix                    | not-started |                                                                              |
| 3 Gallery/admin | **Phase exit gate (soft launch)**  | not-started |                                                                              |
| 4 Hardening     | 4.1 Secrets/env parity             | not-started |                                                                              |
| 4 Hardening     | 4.2 Rate limiting                  | not-started |                                                                              |
| 4 Hardening     | 4.3 Headers/CSP/review             | not-started |                                                                              |
| 4 Hardening     | 4.4 Live payments drills           | not-started |                                                                              |
| 4 Hardening     | 4.5 Real content/brand swap        | not-started |                                                                              |
| 4 Hardening     | 4.6 Domain/email/noindex           | not-started |                                                                              |
| 4 Hardening     | 4.7 Observability                  | not-started |                                                                              |
| 4 Hardening     | 4.8 Device/a11y/perf matrix        | not-started |                                                                              |
| 4 Hardening     | 4.9 Backup/rollback/runbook        | not-started |                                                                              |
| 4 Hardening     | **Phase exit gate (launch ready)** | not-started |                                                                              |
| 5 Ops           | 5.1 Public launch (6 Nov)          | not-started |                                                                              |
| 5 Ops           | 5.2 Batches + monitoring           | not-started |                                                                              |
| 5 Ops           | 5.3 RSVP deadline (5 Dec)          | not-started |                                                                              |
| 5 Ops           | 5.4 Freeze (14–19 Dec)             | not-started |                                                                              |
| 5 Ops           | 5.5 Wedding day (19 Dec)           | not-started |                                                                              |
| 5 Ops           | 5.6 Post-wedding                   | not-started |                                                                              |

**State legend:** `not-started` · `in-progress` · `blocked` · `gate-failed` · `done`

## Blocked

_Nothing blocked yet._

Format: `<item> — blocking <phase.subphase> — owner <who> — raised <date> — next action <what>`

## Decisions taken

- 2026-10-05 — Plan created with amendments A1–A20 (see `README.md` §3).
- 2026-10-05 — Subphase 0.1 scaffold completed: Next.js 16.3.8 (App Router), React 19.2.8, Tailwind CSS v4.3.3 (@theme in app/globals.css), ESLint 9.39.5, TypeScript 5.9.3, Node pinned to 24 in .nvmrc and package.json#engines, pnpm 12.9.1. Prettier, Husky, lint-staged, and commitlint configured.
- 2026-10-05 — Subphase 0.2 env and database setup completed: PostgreSQL 16 via docker-compose.yml running wedding_dev & wedding_test; .env.example documented with all 19 keys; lib/env.ts Zod schema with server/public separation and frozen exports; ESLint no-restricted-syntax rule blocking direct process.env usage outside lib/env.ts.
- 2026-10-05 — Subphase 0.3 design tokens and shell completed: Tailwind v4 @theme configured with ivory, gold, magenta, ink, and night tokens; night theme inversion block; Google Fonts (Cormorant Garamond, Jost, Alex Brush); UI primitives (Button, Container, GoldRule, SectionHeading, Toast); public & admin shells; pnpm verify & build green.
- 2026-10-05 — Subphase 0.4 brand contract and site config completed: `content/site.config.ts` holding typed `SITE` object from architecture §21.1 and amendments A8, A17; `public/brand/logo-placeholder.svg` monogram; `components/brand/Logo.tsx` sole consumer; `app/icon.png` 512x512 rasterized via sharp; `app/opengraph-image.tsx` 1200x630 using next/og ImageResponse; unit test catching missing assets.
- 2026-10-05 — Subphase 0.5 Prisma schema, migration, and seed completed: Prisma 6.19.3 pinned with directUrl and §7.2 schema verbatim plus required indices (`RsvpAttendee.rsvpId`, `AttendeeEvent.eventId`, `Photo.status`); migration `20261005152307_init` created; idempotent seed (`prisma/seed.ts`) populating Setting, Venue, Events, Funds, BankAccount placeholder, Albums, Milestones, and AdminUsers; `lib/db.ts` Prisma singleton; `lib/settings.ts` cached getter.

## Evidence log

- 2026-10-05 — Subphase 0.1 — commit 03e52dd — `pnpm lint` (0 errors), `pnpm format:check` (0 errors), `pnpm typecheck` (0 errors), commitlint rejects bad messages, initial commit created.
- 2026-10-05 — Subphase 0.2 — docker-compose up -d (wedding_dev, wedding_test verified via psql '\l'), tests/unit/env-example.test.ts (1 test passed), tests/unit/env.test.ts (4 tests passed), pnpm verify green.
- 2026-10-05 — Subphase 0.3 — next build (5/5 static routes compiled successfully), hex check verified (only globals.css contains hex literals), pnpm verify green.
- 2026-10-05 — Subphase 0.4 — `rg "logo-placeholder" app components` (0 matches), `tests/unit/brand.test.ts` (2 tests passed), `pnpm verify` (7/7 tests passed, 0 lint/format/type errors), `curl http://localhost:3000/opengraph-image` returned 200 OK.
- 2026-10-05 — Subphase 0.5 — `prisma validate` (valid), `prisma migrate dev --name init` (20261005152307_init applied), `pnpm seed` run twice in a row (0 row duplication, counts identical), `prisma migrate reset --force` reproduces identical state, `tests/integration/db.test.ts` (4 tests passed), `pnpm verify` (11/11 tests green), `pnpm build` (6/6 static routes compiled).

## Open questions answered (from architecture §20.2)

| #   | Question                           | Answer | Date |
| --- | ---------------------------------- | ------ | ---- |
| 1   | Reception start time               |        |      |
| 2   | Meal choice yes/no                 |        |      |
| 3   | Bank accounts                      |        |      |
| 4   | Paystack fees absorbed or optional |        |      |
| 5   | International cards needed         |        |      |
| 6   | Gift visibility (assumed private)  |        |      |
| 7   | RSVP deadline                      |        |      |
| 8   | Live stream                        |        |      |
| 9   | Photographer + delivery date       |        |      |
| 10  | Accommodation/travel notes         |        |      |
| 11  | Language                           |        |      |
| 12  | Background music                   |        |      |
| 13  | Who moderates uploads              |        |      |
| 14  | Data retention period              |        |      |
