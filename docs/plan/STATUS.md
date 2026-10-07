# Build Status

_Updated: 2026-10-07 · Current phase: 2 RSVP/gifts · Current subphase: 2.3 RSVP UI (Subphase 2.2 complete)_

> This file is the handoff surface between sessions/agents. Update it at the **end of every
> working session** and whenever a gate is passed, a blocker appears, or a decision is taken.
> Never delete history — append.

## Progress

| Phase        | Subphase                         | State | Evidence (PR, URL, command output)                                                                                                                                         |
| ------------ | -------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Foundation | 0.1 Repo, git, tooling           | done  | commit 03e52dd; lint/format/typecheck/commitlint pass                                                                                                                      |
| 0 Foundation | 0.2 Env + local DB               | done  | docker-compose (dev+test DBs), lib/env.ts, vitest 5/5                                                                                                                      |
| 0 Foundation | 0.3 Tokens, fonts, shell         | done  | tokens in globals.css, fonts, UI primitives, build ok                                                                                                                      |
| 0 Foundation | 0.4 Brand contract + config      | done  | SITE config typed, SVG placeholder, app/icon.png, og:image 200, 7/7 tests                                                                                                  |
| 0 Foundation | 0.5 Prisma + seed                | done  | Prisma 6.19.3 schema §7.2, migration init, idempotent seed, 11/11 tests pass                                                                                               |
| 0 Foundation | 0.6 Core libraries               | done  | 10 core libs (api, money, datetime, mode, ics, csv, codes, cookie, cache, validation), 58/58 tests pass                                                                    |
| 0 Foundation | 0.7 Auth.js admin gate           | done  | next-auth@5.0.0-beta.32 + @auth/prisma-adapter 2.11.3, migration auth_adapter, 66/66 tests pass, 13 routes build, manual signin verified                                   |
| 0 Foundation | 0.8 Health, metadata, noindex    | done  | /api/health 200/503 tested, robots.txt Disallow: /, 4 security headers, branded 404, NDPA privacy                                                                          |
| 0 Foundation | 0.9 Test harness                 | done  | vitest workspaces (unit/integration), .env.test isolation guard, factories + cleanup, playwright e2e smoke mobile green, v8 coverage                                       |
| 0 Foundation | 0.10 CI/CD, Vercel, Neon         | done  | .github/workflows/ci.yml (5 jobs), lighthouserc.json, PR template (9a83b1c); Vercel build fix (9c90b99); dev pushed to remote                                              |
| 0 Foundation | 0.11 Docs + amendments           | done  | architecture.md A1–A20 verified inline; comprehensive README.md quickstart & dependency tracker; RUNBOOK.md skeleton (§19.2–19.4)                                          |
| 0 Foundation | **Phase exit gate**              | done  | All 10 automated exit gate commands verified green (frozen-lockfile, docker, migrate, seedx2, lint/format/typecheck, unit, integration, build, e2e, health)                |
| 1 Public     | 1.1 Home composition             | done  | `pnpm verify` green; `pnpm test:e2e` 4/4 green; `pnpm build` confirms static `/` and all placeholder routes.                                                               |
| 1 Public     | 1.2 Guest link + session         | done  | `pnpm verify` green; guest-link contract checks and E2E personalised/unknown-link flows pass; `/api/session/guest` is dynamic.                                             |
| 1 Public     | 1.3 Hero + opening sequence      | done  | Full-bleed portrait hero, vignette, gold corners, animated wax seal envelope dialog with sessionStorage guard, reduced motion check, escape handling.                      |
| 1 Public     | 1.4 Countdown + invitation text  | done  | Date milestones (19 Dec, 11 O'clock, 26 Forever), gold rule, dynamic guest greeting integration via `/api/session/guest`.                                                  |
| 1 Public     | 1.5 Story timeline               | done  | Alternating photo story cards with explicit dimensions and lazy loading (`March 2026`, `May 2026`).                                                                        |
| 1 Public     | 1.6 Events + ICS                 | done  | Solemnization & Reception cards with Google Calendar render links and dress code chips.                                                                                    |
| 1 Public     | 1.7 Venue + deep links           | done  | Methodist Church Olorunsogo-GeriAlimi card with map vector art, directions button, address anchor.                                                                         |
| 1 Public     | 1.8 Colour, teasers, FAQ, footer | done  | White/Gold/Magenta swatches (`id="details"`), tabbed gallery teaser, gift funds teaser, `<details>` accordion FAQ, dark `#designedToBi'26` footer.                         |
| 1 Public     | 1.9 Perf + a11y pass             | done  | `pnpm check:bundle` 179.98 KB (budget ≤ 180 KB); Axe 0 serious/critical across all 6 public routes; image audit clean; content audit zero leakage; 12/12 E2E.              |
| 1 Public     | **Phase exit gate**              | done  | `pnpm verify` (lint, format, typecheck, 61 unit tests, 14 integration tests), `pnpm test:e2e` (12/12 green), `pnpm build` (19/19 routes), bundle under budget.             |
| 2 RSVP/gifts | 2.1 Validation schemas           | done  | Schemas & types in `lib/validation/{rsvp,gift,admin}.ts`, `lib/validation/index.ts`; unit tests (rsvp-schema, gift-schema, admin-schema) pass 85/85; `pnpm verify` green.  |
| 2 RSVP/gifts | 2.2 RSVP API                     | done  | POST `/api/rsvp` route + `lib/rsvp.ts` domain logic; unit tests (`rsvp.test.ts`) 9/9; integration suite (`rsvp-api.test.ts`) 10/10; `pnpm verify` 24/24 integration green. |
| 2 RSVP/gifts | 2.3 RSVP UI + phone path         | done  | Mobile-first 4-step stepper (`RsvpForm`, `RsvpStepper`, `AttendeeRow`) + phone/WhatsApp panel (`RsvpContactsPanel`); honeypot; axe clean; 3/3 E2E.                         |
| 2 RSVP/gifts | 2.4 RSVP email                   | done  | Resend client & templates (`rsvp-confirmation.tsx`, `rsvp-notification.tsx`, `send.ts`); non-blocking post-commit; 8 unit + 12 integration tests green.                    |
| 2 RSVP/gifts | 2.5 Admin RSVP/guests            | done  | Admin RSVP list, filters, manual phone/WhatsApp entry modal, guest directory, personalized invite link/WhatsApp generator, UTF-8 BOM CSV export, and E2E coverage.         |

| 2 RSVP/gifts | 2.6 Gift UI | done | `/gift` page with active funds & bank accounts, `GiftTabs` (?tab=online/bank), amount preset chips with live ₦ format, `CopyField` with fallback, `FundCard` selection, and bank transfer declaration flow. |
| 2 RSVP/gifts | 2.7 Paystack core | done | `lib/paystack.ts` (init/verify/HMAC length-guarded timing-safe), `lib/payments.ts` (128-bit ref, PII redaction), `POST /api/gifts/initialize`, `POST /api/webhooks/paystack` (idempotent + remote verify), `GET /api/gifts/verify`, `POST /api/gifts/declare`, `scripts/reconcile-gifts.ts`. |
| 2 RSVP/gifts | 2.8 Gift complete + receipt | done | `/gift/complete` state machine with exponential backoff polling, React Email templates (`gift-receipt.tsx`, `gift-notification.tsx`), donor + couple emails, full unit/integration/E2E test suite passing. |
| 2 RSVP/gifts | 2.9 Admin ledger | not-started | |
| 2 RSVP/gifts | **Phase exit gate** | not-started | |
| 3 Gallery/admin | 3.1 Cloudinary helpers | not-started | |
| 3 Gallery/admin | 3.2 Gallery + lightbox | not-started | |
| 3 Gallery/admin | 3.3 sync/zip scripts | not-started | |
| 3 Gallery/admin | 3.4 Guest uploads | not-started | |
| 3 Gallery/admin | 3.5 Moderation queue | not-started | |
| 3 Gallery/admin | 3.6 Settings + mode + QR | not-started | |
| 3 Gallery/admin | 3.7 Overview + guests import | not-started | |
| 3 Gallery/admin | 3.8 Mode matrix | not-started | |
| 3 Gallery/admin | **Phase exit gate (soft launch)** | not-started | |
| 4 Hardening | 4.1 Secrets/env parity | not-started | |
| 4 Hardening | 4.2 Rate limiting | not-started | |
| 4 Hardening | 4.3 Headers/CSP/review | not-started | |
| 4 Hardening | 4.4 Live payments drills | not-started | |
| 4 Hardening | 4.5 Real content/brand swap | not-started | |
| 4 Hardening | 4.6 Domain/email/noindex | not-started | |
| 4 Hardening | 4.7 Observability | not-started | |
| 4 Hardening | 4.8 Device/a11y/perf matrix | not-started | |
| 4 Hardening | 4.9 Backup/rollback/runbook | not-started | |
| 4 Hardening | **Phase exit gate (launch ready)** | not-started | |
| 5 Ops | 5.1 Public launch (6 Nov) | not-started | |
| 5 Ops | 5.2 Batches + monitoring | not-started | |
| 5 Ops | 5.3 RSVP deadline (5 Dec) | not-started | |
| 5 Ops | 5.4 Freeze (14–19 Dec) | not-started | |
| 5 Ops | 5.5 Wedding day (19 Dec) | not-started | |
| 5 Ops | 5.6 Post-wedding | not-started | |

**State legend:** `not-started` · `in-progress` · `blocked` · `gate-failed` · `done`

## Blocked

_Nothing blocked yet._

Format: `<item> — blocking <phase.subphase> — owner <who> — raised <date> — next action <what>`

## Decisions taken

- 2026-10-07 — Subphases 1.3–1.9 and Phase 1 Exit Gate completed. Full prototype UI migrated into Next.js App Router with 100% architectural invariants preserved:
  - Envelope opening sequence encapsulated in `EnvelopeIntro.tsx` mounting directly on `HomePage` (`/`) with `sessionStorage` guard, reduced-motion bypass, and capture-phase Escape key handler.
  - Modern first-load JS budget asserted at 179.98 KB gzipped (≤ 180 KB budget) via `scripts/check-bundle.mjs`. Zod and Framer Motion code-split from critical root entry.
  - Permanent Axe accessibility suite established at `tests/e2e/a11y.spec.ts` asserting 0 serious or critical violations across all 6 public routes (`/`, `/rsvp`, `/gift`, `/gallery`, `/thank-you`, `/privacy`).
  - Mobile top navigation tuned to display responsive typography and keep navigation targets accessible across 390px viewports without horizontal scroll.
  - Seeding extended in `prisma/seed.ts` to include deterministic `e2e9test` test guest with solemnization and reception invites.

- 2026-10-06 — Began Sprint 1 subphases 1.1 and 1.2. Home remains a static public route; guest personalisation is isolated to client-side fetches from `GET /api/session/guest`, so no public server component reads cookies.
- 2026-10-06 — Completed Sprint 1 subphases 1.1 and 1.2. Playwright’s dev server loads `.env.test` for deterministic E2E credentials; production builds continue to require the normal deployment environment.
- 2026-10-05 — Plan created with amendments A1–A20 (see `README.md` §3).
- 2026-10-05 — Subphase 0.1 scaffold completed: Next.js 16.3.8 (App Router), React 19.2.8, Tailwind CSS v4.3.3 (@theme in app/globals.css), ESLint 9.39.5, TypeScript 5.9.3, Node pinned to 24 in .nvmrc and package.json#engines, pnpm 12.9.1. Prettier, Husky, lint-staged, and commitlint configured.
- 2026-10-05 — Subphase 0.2 env and database setup completed: PostgreSQL 16 via docker-compose.yml running wedding_dev & wedding_test; .env.example documented with all 19 keys; lib/env.ts Zod schema with server/public separation and frozen exports; ESLint no-restricted-syntax rule blocking direct process.env usage outside lib/env.ts.
- 2026-10-05 — Subphase 0.3 design tokens and shell completed: Tailwind v4 @theme configured with ivory, gold, magenta, ink, and night tokens; night theme inversion block; Google Fonts (Cormorant Garamond, Jost, Alex Brush); UI primitives (Button, Container, GoldRule, SectionHeading, Toast); public & admin shells; pnpm verify & build green.
- 2026-10-05 — Subphase 0.4 brand contract and site config completed: `content/site.config.ts` holding typed `SITE` object from architecture §21.1 and amendments A8, A17; `public/brand/logo-placeholder.svg` monogram; `components/brand/Logo.tsx` sole consumer; `app/icon.png` 512x512 rasterized via sharp; `app/opengraph-image.tsx` 1200x630 using next/og ImageResponse; unit test catching missing assets.
- 2026-10-05 — Subphase 0.5 Prisma schema, migration, and seed completed: Prisma 6.19.3 pinned with directUrl and §7.2 schema verbatim plus required indices (`RsvpAttendee.rsvpId`, `AttendeeEvent.eventId`, `Photo.status`); migration `20261005152307_init` created; idempotent seed (`prisma/seed.ts`) populating Setting, Venue, Events, Funds, BankAccount placeholder, Albums, Milestones, and AdminUsers; `lib/db.ts` Prisma singleton; `lib/settings.ts` cached getter.
- 2026-10-05 — Subphase 0.6 core libraries completed: 10 modules implemented (`lib/api.ts`, `lib/money.ts`, `lib/datetime.ts`, `lib/mode.ts`, `lib/ics.ts`, `lib/csv.ts`, `lib/codes.ts`, `lib/guest-cookie.ts`, `lib/cache.ts`, `lib/validation/common.ts`); Next.js 16 `revalidateTag(tag, 'max')` profile support; 52 unit tests (exceeding ≥ 40 assertions requirement) + 6 integration tests passing.
- 2026-10-06 — Subphase 0.7 Auth.js admin gate completed: installed `next-auth@5.0.0-beta.32`, `@auth/prisma-adapter@2.11.3`, and `resend@6.32.0`; created migration `20261006091013_auth_adapter` adding `emailVerified` and `image` columns to `AdminUser` and creating `VerificationToken` table (per `01-sprint-0-foundation.md` §0.7 schema delta note); mapped `AdminUser` to `User` via Prisma client proxy; Resend provider with 30-min magic links and console logging in non-production; JWT 8-hour sessions; allow-list enforced at `signIn` callback and `requireAdmin()` guard (A6); admin shell layout at `app/admin/layout.tsx` with signout and 6 route placeholders; `app/api/admin/ping` route; `tests/unit/admin-guard-coverage.test.ts` enforcing guard coverage across all admin routes and layout; vitest `server.deps.inline` configured for `next-auth`; 66/66 tests passing and 13 routes built successfully.
- 2026-10-06 — Subphase 0.8 Health, metadata, and noindex completed: implemented `GET /api/health` with `SELECT 1` checking DB connectivity and 503 fallback when unreachable; created `app/robots.ts` emitting `Disallow: /` and verified root metadata `robots: { index: false, follow: false }` (A11); created branded `app/not-found.tsx` with Return Home button; configured baseline security headers in `next.config.ts` (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`); enhanced `app/(public)/privacy/page.tsx` with NDPA 2023 notice covering purpose, data collected, retention, and correction/deletion contacts; created `tests/integration/health.test.ts` verifying 200 and 503 closed-port paths; 68/68 tests passing, 14 routes compiled.
- 2026-10-06 — Subphase 0.9 Test harness completed: configured Vitest workspaces with distinct `unit` and `integration` projects; added test isolation guard in `tests/integration/setup.ts` and `global-setup.ts` requiring `DATABASE_URL` to contain `wedding_test`; created `.env.test` pointing to `wedding_test`; created test factories in `tests/factories.ts` (`makeGuest`, `makeEvent`, `makeInvitation`, `makeRsvp`, `makeFund`, `makeGift`) with unique prefixes and `cleanupTestRows()` helper; verified `E2E_GUEST_CODE` seeded and printed in global setup; installed Playwright, `@axe-core/playwright`, and `@vitest/coverage-v8`; configured `playwright.config.ts` with Mobile Chrome 390px, iPhone Safari, and Desktop Chrome projects; wrote and passed `tests/e2e/smoke.spec.ts` (root load, single h1, zero console errors, skip link focus/activation); all acceptance criteria met (unit tests finish in < 3s, integration test fails loudly on non-test DB, mobile smoke spec green, coverage report generates); `pnpm verify` (69/69 tests green across 21 test files).
- 2026-10-06 — Subphase 0.10 CI/CD, Vercel, Neon repository setup: created `.github/workflows/ci.yml` per conventions §12 defining 5 jobs (`static`, `integration`, `build-e2e`, `e2e`, `lighthouse`) with Postgres 16 health-checked service container; configured `lighthouserc.json` with performance, a11y, best-practices, LCP, and CLS thresholds; created `.github/pull_request_template.md` with checklist per conventions §9; installed `@lhci/cli` and added `lighthouse` script to `package.json`; all local verify checks passing.

## Evidence log

- 2026-10-07 — Subphase 2.4 — `lib/email/client.ts`, `lib/email/templates/rsvp-confirmation.tsx`, `lib/email/templates/rsvp-notification.tsx`, and `lib/email/send.ts` implemented with `@react-email/components` and Resend. Post-commit hook in `POST /api/rsvp` dispatches guest confirmation email and notifies coordinators (A14) on first WEB response without blocking or failing transaction. 8 unit tests (`tests/unit/email.test.ts`) and 12 integration tests (`tests/integration/rsvp-api.test.ts`) passing; `pnpm check:bundle` passes at 179.98 KB; `pnpm test:e2e` passes 15/15 green; `pnpm verify` passes with 0 lint, 0 format, 0 type errors, 102 unit tests, and 26 integration tests.
- 2026-10-07 — Subphase 2.3 — `RsvpForm`, `RsvpStepper`, `AttendeeRow`, and `RsvpContactsPanel` implemented. Verified unauthenticated visitor sees contact cards and zero inputs; authenticated guest sees 4-step stepper with prefill, party size capping, event check list, dietary notes, honeypot, and confirmation screen. Playwright E2E (`tests/e2e/rsvp-web.spec.ts`) passed 3/3 green; permanent axe a11y passed across all routes with 0 serious/critical violations; `pnpm check:bundle` reported 179.98 KB modern gzipped first-load JS for `/` against 180 KB budget; `pnpm verify` passed with 0 lint, 0 format, 0 type errors, 94/94 unit tests, and 24/24 integration tests.
- 2026-10-07 — Subphase 2.2 — `POST /api/rsvp` route handler and `lib/rsvp.ts` domain service implemented with transactional seat cap checking (`FOR UPDATE`), upsert semantics, honeypot, closed RSVP handling, and optimistic response formatting. Unit tests (`tests/unit/rsvp.test.ts`) 9/9 green; integration tests (`tests/integration/rsvp-api.test.ts`) 10/10 green across all branch matrix conditions; `pnpm verify` passed with 0 lint/format/type errors and 24/24 integration tests.
- 2026-10-07 — Subphase 2.1 — RSVP, Gift, and Admin Zod validation schemas implemented in `lib/validation/{rsvp,gift,admin}.ts` and re-exported from `lib/validation/index.ts`. Strict email normalisation, phone E.164 sanitisation, honeypot rejection, pagination clamping, and positive integer kobo parsing covered. Unit tests (`tests/unit/{rsvp,gift,admin}-schema.test.ts`) passed 85/85 green; `pnpm verify` passed with 0 lint, 0 format, 0 type errors, 85 unit tests, and 14 integration tests.
- 2026-10-07 — Subphases 1.3–1.9 & Phase 1 Exit Gate — `pnpm verify` passed with 0 lint errors, 0 format issues, 0 type errors, 61/61 unit tests, and 14/14 integration tests; `pnpm test:e2e` passed 12/12 on Mobile Chrome 390px (including permanent Axe a11y suite with 0 serious/critical violations on `/`, `/rsvp`, `/gift`, `/gallery`, `/thank-you`, `/privacy`); `pnpm check:bundle` reported 179.98 KB modern gzipped first-load JS for `/` against 180 KB budget; `pnpm build` compiled all 19 routes successfully with Turbopack.
- 2026-10-06 — Subphases 1.1–1.2 — `pnpm verify` passed after `pnpm prisma generate`; `pnpm test:e2e` passed 4/4 on Mobile Chrome 390px (home structure, skip-link smoke, valid personalised link, unknown link); `pnpm build` passed with 19 static/dynamic routes and `/` reported static.
- 2026-10-05 — Subphase 0.1 — commit 03e52dd — `pnpm lint` (0 errors), `pnpm format:check` (0 errors), `pnpm typecheck` (0 errors), commitlint rejects bad messages, initial commit created.
- 2026-10-05 — Subphase 0.2 — docker-compose up -d (wedding_dev, wedding_test verified via psql '\l'), tests/unit/env-example.test.ts (1 test passed), tests/unit/env.test.ts (4 tests passed), pnpm verify green.
- 2026-10-05 — Subphase 0.3 — next build (5/5 static routes compiled successfully), hex check verified (only globals.css contains hex literals), pnpm verify green.
- 2026-10-05 — Subphase 0.4 — `rg "logo-placeholder" app components` (0 matches), `tests/unit/brand.test.ts` (2 tests passed), `pnpm verify` (7/7 tests passed, 0 lint/format/type errors), `curl http://localhost:3000/opengraph-image` returned 200 OK.
- 2026-10-05 — Subphase 0.5 — `prisma validate` (valid), `prisma migrate dev --name init` (20261005152307_init applied), `pnpm seed` run twice in a row (0 row duplication, counts identical), `prisma migrate reset --force` reproduces identical state, `tests/integration/db.test.ts` (4 tests passed), `pnpm verify` (11/11 tests green), `pnpm build` (6/6 static routes compiled).
- 2026-10-05 — Subphase 0.6 — `pnpm test:unit` (13 test files, 52/52 tests passed), `pnpm test:integration` (3 test files, 6/6 tests passed), `pnpm verify` (58/58 tests passed, 0 lint/format/type errors), `pnpm build` (6/6 static routes compiled in 4.8s).
- 2026-10-06 — Subphase 0.7 — `prisma migrate dev --name auth_adapter` applied cleanly; `pnpm seed` verified idempotent; `curl http://localhost:3000/api/admin/ping` returned 401 UNAUTHENTICATED; `curl -i http://localhost:3000/admin` redirected (307) to `/api/auth/signin`; sign-in with non-allowlisted email redirected to `/api/auth/error?error=AccessDenied`; sign-in with allowlisted email redirected to `/api/auth/verify-request?provider=resend&type=email`; negative guard coverage test verified failing when `requireAdmin()` was temporarily removed from ping route; `pnpm verify` (66/66 tests passed across 19 test files, 0 lint/format/type errors); `pnpm build` (13/13 static/dynamic routes compiled in 6.2s).
- 2026-10-06 — Subphase 0.8 — `curl -i localhost:3000/api/health` returned 200 OK JSON with no-store cache control; `curl -i localhost:3000/robots.txt` returned Disallow: /; `curl -I localhost:3000/` verified all 4 baseline security headers present; `curl localhost:3000/non-existent-page` returned 404; `tests/integration/health.test.ts` (2 tests passed); `pnpm verify` (68/68 tests passed across 20 test files, 0 lint/format/type errors); `pnpm build` (14/14 static/dynamic routes compiled in 3.3s).
- 2026-10-06 — Subphase 0.9 — `pnpm test:unit` (15 test files, 59/59 tests passed in 1.5s without DB); `pnpm test:integration` verified failing loudly when pointing to `wedding_dev` (`Error: [INTEGRATION TEST GUARD] DATABASE_URL must contain "wedding_test"`); `pnpm test:integration` passed against `wedding_test` (6 test files, 10/10 tests passed in 5.8s); `pnpm test:e2e` ran `tests/e2e/smoke.spec.ts` against Mobile Chrome 390px project (1/1 passed in 2.0s); `pnpm test:coverage` generated V8 coverage report; `pnpm verify` (69/69 tests passed across 21 test files, 0 lint/format/type errors); `pnpm build` (14/14 static/dynamic routes compiled in 9.5s).
- 2026-10-06 — Subphase 0.10 — commit `9a83b1c` created with `.github/workflows/ci.yml`, `lighthouserc.json`, `.github/pull_request_template.md`, `@lhci/cli` 0.15.1; `lhci collect` verified executing and collecting Lighthouse report against localhost; commit `9c90b99` fixed Vercel variable font slice loading and decoupled route handler types; branch `dev` pushed cleanly to origin remote.
- 2026-10-06 — Subphase 0.11 — verified all 20 amendments (A1–A20) reflected inline across `docs/architecture.md` (§7.2, §8.1, §8.2, §12, §13.1, §14.2, §21.1) with no plan/architecture contradictions; created `RUNBOOK.md` skeleton mirroring §19.2–19.4; created comprehensive `README.md` containing prerequisite specs, 10-minute quickstart, scripts table, environment variables breakdown, architectural guardrails, and external dependency tracker; `pnpm verify` and `pnpm build` green.
- 2026-10-06 — Subphase 0.12 (Phase exit gate) — all 10 automated exit gate commands executed and verified green: `pnpm install --frozen-lockfile` (0 errors), `docker compose up -d` (wedding_dev on 5432, wedding_test on 5433), `pnpm prisma migrate deploy` (applied cleanly, 0 pending), `pnpm seed && pnpm seed` (idempotency verified twice, 0 duplicates), `pnpm lint && pnpm format:check && pnpm typecheck` (all 3 pass cleanly with 0 errors), `pnpm test:unit` (15 test files, 59/59 passed in 1.34s without DB), `pnpm test:integration` (6 test files, 10/10 passed in 4.87s against isolated wedding_test), `pnpm build` (14/14 static/dynamic routes compiled successfully in 2.8s), `pnpm test:e2e` (Mobile Chrome 390px smoke test passed in 2.0s), `curl -s localhost:3000/api/health` returned HTTP 200 `{"ok":true,"data":{"db":"up",...}}`. Phase 0 Foundation complete! Ready for Sprint 1 (Public Experience).

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
