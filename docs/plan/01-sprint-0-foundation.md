# Phase 0 — Foundation (Sprint 0)

**Dates:** Mon 5 Oct – Fri 9 Oct 2026
**Outcome:** a repo that deploys green through CI with a working database, seed, auth gate,
tokens and test harness. Everything after this is feature work on rails.

Architecture refs: §3, §5, §6, §7, §13, §14, §18. Conventions: all of `00-conventions.md`.

---

## 0.0 Phase entry gate

### Internal

- [ ] `architecture.md` v2 reviewed and accepted as source of truth; no open objection to any ADR.
- [ ] `docs/plan/README.md` amendments **A1–A20** read; you are authorised to apply them (0.12).
- [ ] Working directory is the repo root `wedding-invite/` containing only `docs/`.
- [ ] Local toolchain available: **Node ≥ 22**, **git ≥ 2.4**, **Docker**, **Corepack**.
      Verify: `node -v && git --version && docker -v && corepack --version`.

### External

- [ ] GitHub account + an empty repo created (no README/gitignore, so the push is clean).
- [ ] Vercel account created and linked to GitHub.
- [ ] Neon account created (a project can be created in 0.11).
- [ ] A named human is available for PR review during the sprint (can be the couple or a peer).

### Decisions

- [ ] Node LTS version chosen (22 or 24) — recorded in `STATUS.md`; must be Vercel-supported.
- [ ] Tailwind major version (v3/v4) determined from the scaffold output before writing tokens.

**If any box above is unchecked: do not start. Log the blocker in `STATUS.md`.**

---

## Subphase 0.1 — Repository, git and tooling

**Goal:** a version-controlled repo with enforced formatting, linting and commit style.

**Tasks**

1. `git init -b main` in the repo root; add `.gitignore` covering Node/Next/Vercel
   (`node_modules`, `.next`, `.env*` except `.env.example`, `coverage`, `playwright-report`,
   `test-results`, `.vercel`, `*.log`, `.DS_Store`).
2. Add `.editorconfig` (utf-8, lf, indent 2, trim trailing whitespace).
3. `corepack enable` then `corepack prepare pnpm@latest --activate`; confirm `pnpm -v`.
4. Scaffold the app at the repo root without clobbering `docs/` (A10):
   ```bash
   pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir=false \
     --import-alias "@/*" --turbopack --use-pnpm
   # If create-next-app refuses a non-empty directory:
   pnpm create next-app@latest .wedding-tmp --ts --tailwind --eslint --app \
     --src-dir=false --import-alias "@/*" --turbopack --use-pnpm
   rsync -a .wedding-tmp/ ./ && rm -rf .wedding-tmp
   ```
   `docs/` must survive. Record the generated Tailwind/ESLint/Next versions in `STATUS.md`.
5. Add Prettier (`.prettierrc`, `.prettierignore`) and make `pnpm format` / `pnpm format:check`
   scripts.
6. Add Husky + lint-staged (`pre-commit`: prettier + eslint --fix on staged files) and commitlint
   (`@commitlint/config-conventional`, `commit-msg` hook). `"prepare": "husky"` in `package.json`.
7. Pin versions: `.nvmrc`, `package.json#engines`, `"packageManager": "pnpm@<version>"`.
8. Initial commit: `chore: scaffold next.js app with lint, format and commit hooks`.

**Acceptance criteria**

- [ ] `pnpm install` succeeds from a clean clone.
- [ ] `pnpm lint` and `pnpm format:check` exit 0.
- [ ] A commit with a bad message (`git commit -m "bad message"`) is **rejected** by commitlint.
- [ ] `docs/architecture.md` and `docs/plan/` are tracked; `.env` is not (`git status` clean of it).
- [ ] Remote added and `main` pushed.

**Tests:** none yet (harness lands in 0.10).

---

## Subphase 0.2 — Environment layer and local database

**Goal:** env vars are schema-validated, documented and impossible to drift; a local Postgres runs
in Docker with an isolated test database.

**Tasks**

1. `docker-compose.yml` (A12): service `postgres:16`, `POSTGRES_PASSWORD=postgres`, port 5432,
   named volumes, and an init script creating **two** databases: `wedding_dev` and `wedding_test`.
2. `.env.example` with every key from `00-conventions.md` §3 (empty values + comments).
3. `.env` locally: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public`,
   `DIRECT_URL` the same against `wedding_dev`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`,
   `AUTH_SECRET` and `GUEST_COOKIE_SECRET` generated with `openssl rand -base64 32`.
   Placeholder values for Cloudinary/Resend/Paystack are allowed and must be obviously fake
   (`test_xxx`); real keys arrive later.
4. `lib/env.ts`: Zod schema for the full variable set, exported frozen `env`, with a clear
   startup error listing the missing keys. Server secrets and `NEXT_PUBLIC_*` separated
   (`env.server.*`, `env.public.*`).
5. ESLint `no-restricted-syntax` rule forbidding `process.env` outside `lib/env.ts`.

**Acceptance criteria**

- [ ] `docker compose up -d` → `docker compose exec db psql -U postgres -c '\l'` lists
      `wedding_dev` and `wedding_test`.
- [ ] Starting the app with a missing required var fails fast with a readable error naming the key.
- [ ] `rg "process\.env\." --glob '!lib/env.ts' --glob '!node_modules'` returns nothing.

**Tests (`tests/unit/`)**

- `env-example.test.ts` — schema keys ≡ `.env.example` keys (both directions).
- `env.test.ts` — missing key produces an error naming it; extra key is ignored.

**Exit subphase gate:** `pnpm verify` green.

---

## Subphase 0.3 — Design tokens, fonts and the app shell

**Goal:** the design system exists as code before any section is built.

**Tasks**

1. `app/globals.css`: all tokens from architecture §3.1 as CSS variables in `:root`, the
   `--gold-grad` gradient, a `[data-theme="night"]` inversion block, base typography, focus-visible
   ring, `prefers-reduced-motion` global fallback, and the paper-grain overlay (≤ 8 KB, optional
   asset — add a placeholder texture or skip the file until assets arrive; the CSS must not depend
   on it existing).
2. Map tokens into the Tailwind theme (v4 `@theme` / v3 `tailwind.config.ts`) so
   `bg-ivory`, `text-ink-900`, `text-ink-600`, `border-gold-500`, `text-magenta-600`,
   `bg-magenta-600`, `bg-night` work.
3. `app/layout.tsx`: `next/font` for Display (Cormorant Garamond), Body (Jost or Inter) and
   Signature (script) with `display: "swap"` and Latin subset; `lang="en"`, correct `<head>`,
   root metadata (title template, description, `robots: { index: false, follow: false }`),
   `<body>` with the skip link target and a `<Providers>` client component (Framer Motion +
   reduced-motion context only — keep it tiny).
4. `app/(public)/layout.tsx`: header (Logo, anchor nav), `<main id="main">`, footer (privacy link,
   hashtag, RSVP contacts placeholder). `app/admin/layout.tsx` shell only (guard lands in 0.8).
5. `components/ui/`: `Button` (variants: primary magenta, secondary gold-outline, ghost),
   `GoldRule`, `SectionHeading`, `Container`, `Toast` (context + hook). Each keyboard/focus
   tested by hand.
6. Placeholder page content in `app/(public)/page.tsx` that exercises every token (light section,
   night section, gold rule, buttons) so visual review is possible.

**Acceptance criteria**

- [ ] No hex literal appears outside `globals.css` (`rg "#[0-9A-Fa-f]{6}" app components` → only
      `globals.css`).
- [ ] Fonts self-hosted: no request to `fonts.googleapis.com` in the network panel.
- [ ] Skip link visible on Tab, focus ring visible on every interactive element.
- [ ] 390px viewport: no horizontal scroll on any route.

**Tests**

- Unit: none required. Add `tests/e2e/smoke.spec.ts` later in 0.10.

**Exit subphase gate:** `pnpm build && pnpm start` renders `/` with tokens applied; Lighthouse
(local) preliminary numbers recorded in `STATUS.md`.

---

## Subphase 0.4 — Brand contract and site config

**Goal:** content lives in one config; the logo is swappable by file replacement (A9/§3.4).

**Tasks**

1. `public/brand/logo-placeholder.svg` — exactly the SVG from architecture §3.4.
2. `content/site.config.ts` — full `SITE` object from §21.1, extended with:
   `gift: { minAmountMinor, presetAmountsMinor: [500000, 1000000, 2000000, 5000000] }`,
   `inviteMessage` template (A17), `rsvpContacts` (§21.1), `hero: { poster: null as string|null, video: null }`,
   `story: [] as Milestone[]`, `faq: [] as { q: string; a: string }[]`.
   Mark every `TODO` that depends on the couple with a `TODO(content):` comment and add it to the
   dependency tracker.
3. `content/site.config.types.ts` (or inference in-file) so `SITE` is fully typed and
   `as const` where it helps.
4. `components/brand/Logo.tsx`: the **only** file reading `SITE.brand.logo`; props
   `{ size?: number; variant?: "gold" | "light"; className?: string }`; plain `<img>` with
   `width`, `height`, `alt` (never `next/image` for SVG, §3.4).
5. Favicon: generate `app/icon.png` (512×512) from the placeholder (use a script
   `scripts/gen-favicon.ts` or a checked-in PNG) so the swap later is regenerate-only.
6. Metadata: `app/opengraph-image.tsx` using `next/og` `ImageResponse` reading `SITE` (logo,
   names, date, hashtag, palette). 1200×630.

**Acceptance criteria**

- [ ] `rg "logo-placeholder" app components` → no matches (only `site.config.ts` references the
      logo path).
- [ ] Changing `SITE.brand.logo.src` to a PNG and adjusting `kind/width/height` changes every
      rendering surface with no other edit (verify by temporary local change, then revert).
- [ ] OG image renders at `/opengraph-image` in the browser.

**Tests:** unit test asserting `SITE.brand.logo.src` starts with `/brand/` and the file exists on
disk (catches a missing asset).

**Exit subphase gate:** `pnpm verify` green; screenshot of `/` header + OG image attached to
`STATUS.md`.

---

## Subphase 0.5 — Prisma schema, migration and seed

**Goal:** the exact data model from architecture §7.2, applied cleanly, seeded idempotently.

**Tasks**

1. `pnpm add -D prisma && pnpm add @prisma/client`; `prisma init` with
   `directUrl = env("DIRECT_URL")` (§7.2).
2. Write `prisma/schema.prisma` **verbatim from §7.2**, plus:
   - `@@index` on `RsvpAttendee(rsvpId)`, `AttendeeEvent(eventId)`, `Photo(status)`,
     `Guest(code)` is already unique.
   - `Setting.uploadToken` remains nullable.
   - Keep `Guest.side` (A18) with an admin filter planned in Sprint 3.
3. `pnpm prisma migrate dev --name init`. Commit the migration.
4. `prisma/seed.ts` — **idempotent upserts** keyed on natural keys, in order:
   `Setting(id=1)` → `Venue` → `Event` (from `SITE.events`, `timeTbc` as configured) →
   `Invitation` rows are _not_ seeded (guests come from CSV) → `Fund` (default:
   `honeymoon`, `first-home`, `donation`) → `BankAccount` (placeholder rows marked
   `isActive: false` until the couple supplies real details) → `Album`
   (`pre-wedding`→`PRE`, `guest-moments`→`LIVE`, `wedding-day`→`POST`) → `Milestone`
   (from `SITE.story` placeholders) → `AdminUser` rows from `ADMIN_ALLOWLIST`.
   `Setting.rsvpDeadline` initialised from `SITE.rsvp.deadline` (A8).
   Export `seed()` so tests can call it; `package.json#prisma.seed = "tsx prisma/seed.ts"`.
5. `lib/settings.ts`: `getSettings()` = `prisma.setting.upsert({ where: { id: 1 }, update: {},
create: { id: 1 } })` wrapped in `cached(..., 'settings', { tags: ['site'] })`.
6. `lib/db.ts`: Prisma singleton with `globalThis` guard for hot reload.

**Acceptance criteria**

- [ ] `pnpm seed` runs twice in a row without error and without duplicating rows.
- [ ] `pnpm prisma migrate reset --force` then `pnpm seed` reproduces the same state
      (assert with a row-count query).
- [ ] `prisma validate` passes; `prisma generate` output committed to `node_modules` only.
- [ ] Schema matches §7.2 field-for-field — diff it manually and note any deviation in `STATUS.md`.

**Tests (`tests/integration/`, against `wedding_test`)**

- `settings-bootstrap.test.ts` — `getSettings()` creates the row on a DB without one, then
  returns the same row.
- `seed.test.ts` — running `seed()` twice leaves exactly one `Setting`, one `Venue`, two `Event`
  rows, three `Album` rows.

**Exit subphase gate:** `DATABASE_URL` pointing at `wedding_test`, the two integration tests pass
and `pnpm prisma migrate deploy` succeeds against a freshly created empty DB.

---

## Subphase 0.6 — Core libraries

**Goal:** every shared primitive exists and is unit-tested before features need it.

| File                       | Contents                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.ts`               | `ok`, `fail`, `handle`, `ErrorCode` union, error-code → status map (conventions §6.1–6.2)                                                                                                                                                                                                                                                   |
| `lib/money.ts`             | `toMinor`, `fromMinor`, `formatNGN` (§21.3)                                                                                                                                                                                                                                                                                                 |
| `lib/datetime.ts`          | `WAT_TIME_ZONE = "Africa/Lagos"`; `formatDateWAT`, `formatTimeWAT`, `formatDateTimeWAT` via `Intl.DateTimeFormat`; `isBeforeDeadline(date, deadline)`; `countdownTargetISO`                                                                                                                                                                 |
| `lib/mode.ts`              | `ORDER`, `getMode()`, `isAlbumVisible()` (§7.3)                                                                                                                                                                                                                                                                                             |
| `lib/ics.ts`               | `buildIcs(events, opts)`: CRLF line endings, `UID` (stable: `<slug>@<site>`), `DTSTAMP`, `DTSTART`/`DTEND` in UTC (`Z`), `SUMMARY`, `LOCATION`, `DESCRIPTION` with map link, `URL`; correct escaping of `, ; \` and line folding at 75 octets; when `timeTbc` is true, emit an **all-day** `DTSTART;VALUE=DATE` event and omit `DTEND` time |
| `lib/csv.ts`               | `toCsv(rows: Record<string, unknown>[]): string` — RFC 4180 quoting, CRLF, UTF-8 BOM option                                                                                                                                                                                                                                                 |
| `lib/codes.ts`             | `newGuestCode()` (§21.4), `CODE_ALPHABET` export                                                                                                                                                                                                                                                                                            |
| `lib/guest-cookie.ts`      | `setGuestCookie`, `getGuestCode`, `clearGuestCookie` (signed, HMAC-SHA256, conventions §7)                                                                                                                                                                                                                                                  |
| `lib/cache.ts`             | `cached()` wrapper around `unstable_cache` with `tags: ['site']` **and** `revalidateSite(paths)` = `revalidateTag('site')` + `revalidatePath` for each path (A7)                                                                                                                                                                            |
| `lib/validation/common.ts` | shared primitives: `trimmedString(min,max)`, `slug`, `positiveIntMinor`                                                                                                                                                                                                                                                                     |

Install: `pnpm add nanoid zod`; `pnpm add -D tsx`.

**Acceptance criteria:** every file above exists, is imported nowhere it should not be, and
`pnpm typecheck` passes.

**Tests (`tests/unit/`) — all must exist before the gate**

- `money.test.ts` — `toMinor(0.5)` → 50; rounding of `1234.567`; `formatNGN` output shape.
- `datetime.test.ts` — a UTC instant `2026-12-19T10:00:00Z` formats as `11:00` in `Africa/Lagos`
  regardless of process TZ (run the test with `TZ=America/New_York`); deadline comparison around
  midnight boundary.
- `ics.test.ts` — CRLF only; contains `BEGIN:VCALENDAR`; a comma in the description is escaped;
  lines >75 octets are folded; `timeTbc: true` produces `VALUE=DATE`; output parses back (round
  trip of `DTSTART`).
- `csv.test.ts` — a value containing `"` and `,` and a newline is quoted correctly; empty row
  handling; header order preserved.
- `codes.test.ts` — 8 chars, alphabet-only, no `0/O/1/I/l`, 10 000 generations are unique.
- `guest-cookie.test.ts` — round trip; tampered code → `null`; wrong secret → `null`; garbage →
  `null`.
- `mode.test.ts` — all 9 combinations of `isAlbumVisible`.
- `cache.test.ts` — `revalidateSite(["/", "/gallery"])` calls **both** `revalidateTag("site")`
  and `revalidatePath` once per path (mock `next/cache`); a path list of one behaves the same.
- `api.test.ts` — `fail()` maps codes to the documented status codes.

**Exit subphase gate:** `pnpm test:unit` green with ≥ 40 assertions across these files.

---

## Subphase 0.7 — Auth.js admin gate

**Goal:** magic-link admin login with an allow-list, guarded at both layers (A6).

**Tasks**

1. `pnpm add next-auth@beta @auth/prisma-adapter` (or current stable — record the version chosen).
2. `app/api/auth/[...nextauth]/route.ts` exporting `GET`/`POST` from `lib/auth.ts`'s handlers —
   without this, no sign-in flow exists at all.
3. `lib/auth.ts`:
   - `PrismaAdapter(prisma)`; model mapping: `AdminUser` → `User` (add `@@map`/field overrides
     as required by the adapter, or an `Account`/`Session`/`VerificationToken` set — **if the
     adapter requires tables not in §7.2, add them in a migration named `auth_adapter` and record
     the schema delta in `STATUS.md`**).
   - `EmailProvider` with custom `sendVerificationRequest` calling Resend with a minimal branded
     magic-link email; `maxAge: 30 * 60`.
   - `session: { strategy: "jwt", maxAge: 8 * 3600 }`.
   - `signIn` callback: return `false` for any email not in `ADMIN_ALLOWLIST` (trim, lowercase,
     comma-separated).
4. `lib/admin.ts`: `requireAdmin()` returns `{ email }` or `null`; `isAdmin(email)` helper.
5. `app/admin/layout.tsx`: `requireAdmin()` → `redirect("/api/auth/signin")`; renders an admin
   shell (top bar with nav to Overview/Guests/RSVPs/Gifts/Media/Settings, "signed in as", sign
   out) with placeholder pages at each route.
6. `app/api/admin/**` placeholder: one `GET /api/admin/ping` that calls `requireAdmin()` and
   returns `ok({ email })`.
7. `tests/unit/admin-guard-coverage.test.ts` (A16): glob `app/api/admin/**/route.ts`, assert each
   file contains `requireAdmin(`, and assert `app/admin/layout.tsx` calls it too.
8. `tests/unit/admin-guard-pages.test.ts` alternative if useful: assert `app/admin/layout.tsx`
   exists (so a new page can't bypass it).

**Acceptance criteria**

- [ ] Logged out, `/admin` redirects to the sign-in page; `/api/admin/ping` returns 401.
- [ ] An email **not** in `ADMIN_ALLOWLIST` cannot complete sign-in (Auth.js reports "Access
      Denied"); verify locally with a second address.
- [ ] Auth email renders with the site name and a working link (`pnpm dev` + a local inbox
      workaround: log the verification URL to the server console when `NODE_ENV !== "production"`
      — **never** in production).
- [ ] Guard-coverage test fails if you temporarily remove `requireAdmin()` from `ping`.

**Tests:** the guard-coverage test (unit) + `tests/e2e/admin-auth.spec.ts` (added in 0.10).

**Exit subphase gate:** `pnpm verify` green; manual sign-in demonstrated and noted in `STATUS.md`.

---

## Subphase 0.8 — Health, metadata and noindex

**Goal:** operational surface exists from day one.

**Tasks**

1. `GET /api/health` → `ok({ db: "up", version, time })`; runs `SELECT 1`; returns 503 with
   `fail("INTERNAL")` when the DB is unreachable. `cache: no-store`.
2. `app/robots.ts` → `{ rules: [{ userAgent: "*", disallow: "/" }], host, sitemap: undefined }`
   and root metadata `robots: { index: false, follow: false }` (A11).
3. `app/not-found.tsx` — branded 404 with a link home.
4. Security headers baseline in `next.config` (full CSP arrives in Sprint 4):
   `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
   `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
5. `app/(public)/privacy/page.tsx` — short NDPA-aligned notice (purpose, data collected, retention,
   contact for correction/deletion). Copy can be refined later; the route must exist (A11).

**Acceptance criteria**

- [ ] `curl -i localhost:3000/api/health` → 200 JSON.
- [ ] `curl -i localhost:3000/robots.txt` → contains `Disallow: /`.
- [ ] `curl -I localhost:3000/` → the four headers present.

**Tests:** `tests/integration/health.test.ts` (200 with DB up; 503 when `DATABASE_URL` points at
a closed port — construct a client with a bad URL in that test).

**Exit subphase gate:** `pnpm test` green.

---

## Subphase 0.9 — Test harness

**Goal:** every test layer runnable locally and in CI.

**Tasks**

1. `vitest.config.ts` with two projects/workspaces: `unit` (node env, no DB) and `integration`
   (node env, `setupFiles` that assert `DATABASE_URL` contains `wedding_test`, global setup that
   applies migrations and truncates seeded tables between files).
2. `tests/factories.ts`: `makeGuest`, `makeEvent`, `makeInvitation`, `makeRsvp`, `makeFund`,
   `makeGift` — each with a unique test prefix and an `cleanupTestRows()` helper.
3. `pnpm add -D @playwright/test @axe-core/playwright @vitest/coverage-v8`; `playwright.config.ts`:
   projects **Mobile Chrome 390px**, **iPhone Safari**, **Desktop Chrome**; `webServer` running
   `pnpm build && pnpm start` against the test DB (or `pnpm dev` for speed in local runs);
   HTML + list reporters; retry 1 in CI.
4. Seed a deterministic e2e guest in the test DB (`E2E_GUEST_CODE` printed by global setup).
5. Write `tests/e2e/smoke.spec.ts`: `/` loads, has one `h1`, no console errors, skip link works.
6. Scripts: `test`, `test:unit`, `test:integration`, `test:e2e`, `verify`.

**Acceptance criteria**

- [ ] `pnpm test:unit` needs no Docker/DB and finishes < 30 s.
- [ ] `pnpm test:integration` fails loudly if `DATABASE_URL` lacks `wedding_test`.
- [ ] `pnpm test:e2e` runs the smoke spec green on the mobile project.
- [ ] Coverage report generates (`pnpm test:unit --coverage`).

**Exit subphase gate:** all three commands green in one clean shell session, output pasted into
`STATUS.md`.

---

## Subphase 0.10 — CI/CD, Vercel and Neon

**Goal:** every push proves green; every PR gets a preview URL.

**Tasks**

1. Neon: create the project; branches `main` (production), `dev` (local development), and enable
   the Vercel integration so preview deploys get an ephemeral branch. Copy pooled `DATABASE_URL`
   and `DIRECT_URL` into Vercel env vars for production and preview.
2. Vercel project linked to the GitHub repo; set all env vars from conventions §3 for
   **Production** and **Preview** separately (Sprint 0 may leave Cloudinary/Resend/Paystack as
   test values). Set Node version to the pinned one. Build command `prisma migrate deploy && next build`,
   install `pnpm install`, postinstall `prisma generate`.
3. `.github/workflows/ci.yml` exactly as conventions §12 (jobs `static`, `integration`,
   `build-e2e`, `e2e`, `lighthouse`), with Postgres service container creating `wedding_test`.
4. `lighthouserc.json`: assertions `categories:performance ≥ 90`,
   `categories:accessibility ≥ 95`, `categories:best-practices ≥ 90`,
   `largest-contentful-paint ≤ 2500`, `cumulative-layout-shift ≤ 0.1` (tighten to 0.05 in
   Sprint 1 once imagery lands).
5. Branch protection on `main`: require PR, require `static` + `integration` + `e2e` checks,
   require 1 review, no force-push.
6. `.github/pull_request_template.md` per conventions §9.
7. PR draft → confirm a preview URL is posted → merge → confirm production deploy.

**Acceptance criteria**

- [ ] A PR with a deliberate lint error is **blocked** (record the failed run URL).
- [ ] A clean PR goes green on all five jobs and posts a preview URL.
- [ ] Merging to `main` deploys to production and `https://<prod>/api/health` returns 200.
- [ ] `prisma migrate deploy` runs on Vercel (visible in build logs) without error.
- [ ] Neon preview branch created automatically for a PR (Vercel integration log).

**Tests:** CI itself is the test. Do not weaken an assertion to get green.

**Exit subphase gate:** one full red→green cycle on a PR, evidence (URLs) in `STATUS.md`.

---

## Subphase 0.11 — Documentation and architecture amendments

**Goal:** docs match reality before feature work starts.

**Tasks**

1. Apply amendments **A1–A20** to `architecture.md`: A1/A2/A19 add the endpoints to §8.1–§8.2,
   A3/A4/A5/A6/A7/A8/A9 go into the relevant sections as notes, A11 adds `/privacy`, `/gallery/[slug]`
   and `robots` to §8.1, A14 adds `NOTIFY_EMAIL` to §14.2, A17 adds `inviteMessage` to §21.1,
   A18 adds the `side` note to §7.2, A20 adds `--export` to §12.
   Keep the v2 table of decisions intact and add a short **"v2.1 amendments"** row block at the
   top of §0 referencing this plan.
2. `README.md`: prerequisites, setup, scripts table, env table, architecture/plan links, and a
   "first 10 minutes" quickstart that a stranger could follow.
3. `RUNBOOK.md` skeleton with the four headings from architecture §19.2–19.4 (content in Sprint 4).
4. `STATUS.md` created from the template with Phase 0 rows filled in.

**Acceptance criteria**

- [ ] A person who has never seen the repo can go from clone to `pnpm dev` using only `README.md`.
- [ ] `architecture.md` contains every amendment; no plan/architecture contradiction remains
      (re-read §8.1, §8.2, §14.2, §21.1 and confirm).
- [ ] `STATUS.md` exists and is current.

**Exit subphase gate:** the checklist below.

---

## 0.12 Phase exit gate — Foundation

### Automated evidence (paste outputs into `STATUS.md`)

```bash
pnpm install --frozen-lockfile      # exit 0
docker compose up -d                # wedding_dev + wedding_test exist
pnpm prisma migrate deploy          # exit 0 against an empty DB
pnpm seed && pnpm seed              # exit 0, idempotent
pnpm lint && pnpm format:check && pnpm typecheck   # exit 0
pnpm test:unit                      # all green
pnpm test:integration               # all green (test DB)
pnpm build                          # exit 0
pnpm test:e2e                       # smoke green on mobile project
curl -s localhost:3000/api/health    # {"ok":true,...}
```

### Manual evidence

- [ ] Preview URL from a merged PR loads on a phone (screenshot).
- [ ] Magic-link admin sign-in works end to end (screenshot of `/admin` overview shell).
- [ ] `/opengraph-image` renders the branded card.
- [ ] A deliberately broken commit was blocked by CI (run URL recorded).

### Docs

- [ ] `README.md`, `RUNBOOK.md` skeleton, `STATUS.md` written and accurate.
- [ ] Amendments A1–A20 applied to `architecture.md`.
- [ ] Dependency tracker in `README.md` updated with real owners/status.

**Gate rule:** if any automated command fails, Phase 1 does not start. Fix forward on a branch.
