# Adetolani & Emmanuel — Wedding Invitation Platform (`#designedToBi'26`)

Official digital wedding invitation and event management platform for **Adetolani Esther & Abiodun Emmanuel**.

- **Wedding Date:** Saturday, 19 December 2026
- **Venue:** Methodist Church, Olorunsogo-GeriAlimi, Ilorin, Kwara State
- **Colours of the Day:** White · Gold · Magenta
- **Documentation:** [Architecture Specification](docs/architecture.md) · [Sprint Delivery Plan](docs/plan/README.md) · [Build Status](docs/plan/STATUS.md) · [Operations Runbook](RUNBOOK.md)

---

## ⚡ First 10 Minutes Quickstart

Follow these steps to go from a fresh clone to a running local instance.

### Prerequisites

- **Node.js:** `^24.0.0` (managed via `.nvmrc`)
- **Package Manager:** `pnpm` (v10+ recommended)
- **Docker & Docker Compose:** For running isolated local PostgreSQL databases

### Step-by-Step Setup

1. **Clone repository:**

   ```bash
   git clone https://github.com/EAconcepts/designedToBi26.git
   cd designedToBi26
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   _(The default `.env.example` values work out-of-the-box with the local Docker databases and local Auth.js development mode)._

3. **Start local database containers:**

   ```bash
   docker compose up -d
   ```

   _This provisions two distinct PostgreSQL 16 databases: `wedding_dev` (port `5432`) and `wedding_test` (port `5433`)._

4. **Install dependencies:**

   ```bash
   pnpm install
   ```

5. **Deploy database schema migrations:**

   ```bash
   pnpm prisma migrate deploy
   ```

6. **Seed baseline data:**

   ```bash
   pnpm seed
   ```

   _Seeds the singleton setting (mode `PRE`), venue, events, gift funds, albums, milestones, and initial admin users._

7. **Start the development server:**

   ```bash
   pnpm dev
   ```

8. **Verify installation:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Run health check: `curl -i http://localhost:3000/api/health` (should return `HTTP/1.1 200 OK` with `{"ok":true,"data":{"db":"up",...}}`).

---

## 🛠️ Available Scripts

| Command                 | Purpose                                                                                          |
| :---------------------- | :----------------------------------------------------------------------------------------------- |
| `pnpm dev`              | Starts local Next.js development server with Turbopack                                           |
| `pnpm build`            | Compiles optimized production build with Turbopack and route type checking                       |
| `pnpm start`            | Runs the compiled production server                                                              |
| `pnpm verify`           | **Primary validation script:** Runs linting, format check, TypeScript compiler, and Vitest suite |
| `pnpm test`             | Runs all unit and integration tests                                                              |
| `pnpm test:unit`        | Runs fast in-memory unit tests (< 3s, zero DB requirement)                                       |
| `pnpm test:integration` | Runs integration tests against isolated `wedding_test` database                                  |
| `pnpm test:e2e`         | Runs Playwright end-to-end tests (including Mobile Chrome 390px project)                         |
| `pnpm test:coverage`    | Generates V8 test coverage report                                                                |
| `pnpm lint`             | Runs ESLint analysis across codebase                                                             |
| `pnpm format`           | Formats all files according to Prettier rules                                                    |
| `pnpm format:check`     | Verifies code formatting in CI without writing files                                             |
| `pnpm typecheck`        | Executes TypeScript strict typechecking (`tsc --noEmit`)                                         |
| `pnpm seed`             | Executes idempotent database seeder (`prisma/seed.ts`)                                           |
| `pnpm lighthouse`       | Executes Lighthouse CI audit against local server                                                |

---

## 🔐 Environment Variables

Environment variables are defined in `.env.example` and strictly validated at boot time via Zod in `lib/env.ts`.

| Variable                         | Scope  | Description                                                     | Default / Example                                           |
| :------------------------------- | :----- | :-------------------------------------------------------------- | :---------------------------------------------------------- |
| `DATABASE_URL`                   | Server | Primary PostgreSQL connection string (pooled)                   | `postgresql://postgres:postgres@localhost:5432/wedding_dev` |
| `DIRECT_URL`                     | Server | Direct PostgreSQL connection string for migrations              | `postgresql://postgres:postgres@localhost:5432/wedding_dev` |
| `NEXT_PUBLIC_SITE_URL`           | Public | Canonical public website URL                                    | `http://localhost:3000`                                     |
| `AUTH_SECRET`                    | Server | NextAuth encryption secret (32+ bytes)                          | `dev-auth-secret-min-32-chars-for-testing-only`             |
| `GUEST_COOKIE_SECRET`            | Server | Secret for signing guest code hint cookies                      | `dev-guest-cookie-secret-min-32-chars-long`                 |
| `ADMIN_ALLOWLIST`                | Server | Comma-delimited list of allowed admin emails                    | `adetolani@designedtobi26.com,emmanuel@designedtobi26.com`  |
| `NOTIFY_EMAIL`                   | Server | Couple/coordinator recipient for gift and webhook notifications | `couple@designedtobi26.com`                                 |
| `RESEND_API_KEY`                 | Server | Resend API key for transactional email & magic links            | `re_dev_placeholder`                                        |
| `EMAIL_FROM`                     | Server | Verified sender address for outgoing emails                     | `invitations@designedtobi26.com`                            |
| `CLOUDINARY_CLOUD_NAME`          | Server | Cloudinary account cloud name                                   | `dev-cloud`                                                 |
| `CLOUDINARY_API_KEY`             | Server | Cloudinary API key                                              | `dev-api-key`                                               |
| `CLOUDINARY_API_SECRET`          | Server | Cloudinary API secret                                           | `dev-api-secret`                                            |
| `CLOUDINARY_UPLOAD_PRESET`       | Server | Cloudinary unsigned preset for guest uploads                    | `wedding_guest_uploads`                                     |
| `PAYSTACK_SECRET_KEY`            | Server | Paystack secret key for cash gifting                            | `sk_test_placeholder`                                       |
| `SENTRY_DSN`                     | Server | Sentry error monitoring DSN (optional in dev)                   | `""`                                                        |
| `UPSTASH_REDIS_REST_URL`         | Server | Upstash Redis URL for rate limiting (optional)                  | `""`                                                        |
| `UPSTASH_REDIS_REST_TOKEN`       | Server | Upstash Redis authentication token (optional)                   | `""`                                                        |
| `TURNSTILE_SECRET_KEY`           | Server | Cloudflare Turnstile secret key (optional)                      | `""`                                                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Cloudflare Turnstile site key (optional)                        | `""`                                                        |

---

## 📋 Dependency & Integration Tracker

Tracks external services, vendor requirements, and couple deliverables:

| Item / Dependency               | Owner             | Critical Path    | Status      | Notes                                                                    |
| :------------------------------ | :---------------- | :--------------- | :---------- | :----------------------------------------------------------------------- |
| **Neon PostgreSQL**             | Engineering       | Yes (Launch)     | In Progress | Local Docker setup active; Neon preview branch integration configured    |
| **Vercel Platform**             | Engineering       | Yes (Sprint 0)   | Done        | Turbopack build and deployment pipeline operational                      |
| **Paystack Merchant KYC**       | Couple / Lead     | Yes (Sprint 2/4) | Pending     | Test keys active in dev; live KYC submission required before Sprint 4    |
| **Cloudinary Account**          | Engineering       | Yes (Sprint 3)   | Ready       | Folders and signed upload policies defined                               |
| **Resend Domain Verification**  | Engineering       | Yes (Sprint 2)   | Pending     | Local fallback active; domain DNS records to be applied                  |
| **Real Monogram Logo**          | Couple / Designer | No (Sprint 4)    | Pending     | SVG placeholder in place via `Logo.tsx` contract                         |
| **Official Invitation Copy**    | Couple            | Yes (Sprint 1)   | In Review   | Initial draft in `content/site.config.ts`; awaiting final printed card   |
| **Venue Exact Pin & Travel**    | Couple            | Yes (Sprint 1)   | Pending     | Methodist Church, Olorunsogo-GeriAlimi; awaiting precise GPS coordinates |
| **Photographer Album Delivery** | Couple / Photo    | No (Sprint 5)    | Pending     | Delivery expected post-wedding for `wedding-day` album                   |

---

## 🏛️ Architectural Principles

1. **Source of Truth Rule:**
   - Static branding, typography, copy, and contacts are defined in `content/site.config.ts` (modifications require redeploy).
   - Operational state (site mode, events, RSVP responses, gifts, approved media) lives in PostgreSQL (modifications happen in real-time without redeploy).
   - Initial settings and venue facts seed from `site.config.ts` during initialization; after seed, the database wins.

2. **Guest Personalisation & Privacy:**
   - Public pages (`/`) are static/ISR for lightning-fast delivery and CDN caching.
   - Guest URLs (`/i/[code]`) set an encrypted, signed HttpOnly cookie.
   - Client islands hydrate personalized greetings and RSVP pre-fills dynamically via `/api/session/guest`.
   - Indexing is prevented site-wide (`robots.txt`, `<meta name="robots" content="noindex, nofollow" />`, and `X-Robots-Tag` headers).

3. **Strict Quality Gates:**
   - Every pull request runs the full automated verification suite via GitHub Actions (`static`, `integration`, `build-e2e`, `e2e`, `lighthouse`).
   - Integration tests are hard-guarded to execute only against an isolated `wedding_test` database.
   - All admin API routes must be statically and dynamically guarded with `requireAdmin()`.
