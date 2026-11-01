# 00 — Conventions (binding for every phase)

Everything here is enforced by CI. If a phase file says "per conventions", it means this file.

---

## 1. Toolchain and versions

| Tool            | Policy                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node            | Pick one LTS supported by Vercel (22 or 24) and pin it in `.nvmrc`, `package.json#engines`, CI `node-version` and Vercel project settings. All four must match.                                                   |
| Package manager | **pnpm**, pinned via `corepack` + `"packageManager"` field in `package.json`. Never npm/yarn. Lockfile committed.                                                                                                 |
| TypeScript      | `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `verbatimModuleSyntax: true`. No `any` (use `unknown` + Zod parse). No `@ts-ignore` (use `@ts-expect-error` with a reason comment). |
| Next.js         | App Router, stable release. React Server Components by default.                                                                                                                                                   |
| Tailwind        | Version installed by the scaffold. **v4** → tokens in `app/globals.css` via `@theme`; **v3** → `tailwind.config.ts`. Verify which one the scaffold produced before writing tokens.                                |
| ESLint          | Flat config from scaffold + `eslint-config-next` + `typescript-eslint` recommended. `pnpm lint` must exit 0.                                                                                                      |
| Prettier        | `.prettierrc` committed (printWidth 100, singleQuote, semi true, trailingComma "all"). CI runs `prettier --check .`.                                                                                              |

**Dependency policy:** add a dependency only when the task requires it, record it in
`package.json` (never a global install), and justify it in the PR description. No UI kits, no
state libraries, no date libraries (`Intl` + `lib/datetime.ts` cover this project).

---

## 2. Repository layout

Scaffold at the repo root next to `docs/` (amendment A10).

```
.
├─ app/
│  ├─ layout.tsx                 # Root: fonts, metadata, providers
│  ├─ globals.css                # Tokens (@theme / :root), base layer
│  ├─ robots.ts                  # noindex, nofollow  (A11)
│  ├─ opengraph-image.tsx        # Single generic OG card
│  ├─ icon.png                   # Favicon (regenerated when the real logo lands)
│  ├─ (public)/
│  │  ├─ layout.tsx              # Public shell: header, footer, skip link
│  │  ├─ page.tsx                # Home
│  │  ├─ rsvp/ gift/ gift/complete/ gallery/ gallery/[slug]/ thank-you/ privacy/
│  │  └─ i/[code]/route.ts       # Capability link: cookie + redirect
│  ├─ upload/[token]/page.tsx
│  ├─ admin/
│  │  ├─ layout.tsx              # requireAdmin() gate for all pages
│  │  ├─ page.tsx  guests/  rsvps/  gifts/  media/  settings/
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts
│     ├─ session/guest/route.ts
│     ├─ rsvp/route.ts
│     ├─ events/[slug]/ics/route.ts
│     ├─ gifts/initialize/route.ts
│     ├─ gifts/declare/route.ts
│     ├─ gifts/verify/route.ts
│     ├─ webhooks/paystack/route.ts
│     ├─ upload/sign/route.ts
│     ├─ upload/complete/route.ts
│     ├─ health/route.ts
│     └─ admin/**/route.ts       # every file calls requireAdmin()
├─ components/
│  ├─ brand/Logo.tsx             # only file that reads SITE.brand.logo
│  ├─ ui/                        # primitives (Button, GoldRule, ...)
│  ├─ sections/                  # Hero, Story, Events, ...
│  └─ motion/                    # opening sequence, scroll scenes
├─ lib/
│  ├─ env.ts  db.ts  auth.ts  admin.ts  settings.ts  cache.ts
│  ├─ api.ts  guest-cookie.ts  cloudinary.ts  paystack.ts
│  ├─ money.ts  datetime.ts  ics.ts  mode.ts  csv.ts  codes.ts
│  ├─ email/  (client + templates)
│  └─ validation/ (zod schemas, one file per domain)
├─ content/site.config.ts
├─ prisma/schema.prisma  seed.ts
├─ scripts/seed-guests.ts  sync-album.ts  zip-album.ts  reconcile-gifts.ts
├─ public/brand/  public/fonts/
├─ tests/unit/  tests/integration/  tests/e2e/
├─ docker-compose.yml            # dev + test Postgres (A12)
├─ .env.example
├─ .github/workflows/ci.yml  pull_request_template.md
├─ README.md  RUNBOOK.md
```

**Placement rules**

- A file has exactly one job. If you are unsure whether something is `lib/` or `components/`, it is
  `lib/` when it has no JSX.
- No barrel files (`index.ts` re-exports) except `components/ui/index.ts` for primitives.
- Client components: `"use client"` at the top; server components get no directive.
- Colocate a component with its section; share only genuinely reused pieces via `components/ui/`.

---

## 3. Environment and secrets

- `lib/env.ts` (amendment A15) parses `process.env` with a Zod schema at module load and exports a
  typed, frozen `env`. Server-only secrets are non-`NEXT_PUBLIC_`. It also exports
  `env.isDev` / `env.isProd` / `env.isPreview` (from `NODE_ENV` + `VERCEL_ENV`) so feature guards
  never re-derive them. Access `process.env` **only**
  through `lib/env.ts` (ESLint rule `no-restricted-globals`/`no-process-env` enforced; if the rule
  is unavailable, add a unit test that greps source for `process.env.` outside `lib/env.ts`).
- `.env.example` lists **every** key with an empty value and a one-line comment. `tests/unit/env-example.test.ts`
  asserts the schema keys and `.env.example` keys are identical. CI fails on drift.
- `.env`, `.env.local`, `.env*.local` are git-ignored. Never commit a real value, ever — if a
  secret is committed, rotate it immediately and note it in `STATUS.md`.
- Same variable names across all environments (local, preview, production). Values differ, names
  never do.
- `NEXT_PUBLIC_*` only for: `NEXT_PUBLIC_SITE_URL`, Turnstile site key (if ever added), analytics
  ID. No Paystack public key (checkout is initialised server-side).

**Variable set (architecture §14.2 + A14):** `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`,
`AUTH_SECRET`, `GUEST_COOKIE_SECRET`, `ADMIN_ALLOWLIST`, `NOTIFY_EMAIL`, `BREVO_API_KEY`,
`EMAIL_FROM`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`CLOUDINARY_UPLOAD_PRESET`, `PAYSTACK_SECRET_KEY`, plus optional hardening keys
(`SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).

**Generating secrets:** `openssl rand -base64 32` for `AUTH_SECRET` and `GUEST_COOKIE_SECRET`.
Separate values per environment.

---

## 4. Source of truth (amendment A8)

| Data                                                                                                                                                     | Lives in                 | Runtime reads                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------- |
| Couple names, initials, hashtag, timezone, colours, invitation wording, brand/logo, RSVP contacts, venue display copy, event _seed_ values, meal options | `content/site.config.ts` | config (server components)            |
| Mode, RSVP deadline, uploads window/token, live-stream URL, events, venue, funds, bank accounts, albums, milestones, guests, RSVPs, gifts, photos        | PostgreSQL               | DB via `lib/cache.ts` (tagged `site`) |

- Seed **copies** config → DB for events/venue/deadline. After seed, the DB value wins; config is
  never re-read for those fields.
- Changing `site.config.ts` requires a redeploy. Changing operational data does not.

---

## 5. Design tokens and styling

Tokens live in `app/globals.css` exactly as architecture §3.1 defines them (`--ivory`,
`--white`, `--gold-500`, `--gold-grad`, `--magenta-600`, `--magenta-800`, `--ink-900`, `--ink-600`).

- Map them into the Tailwind theme (v4 `@theme` / v3 `extend.colors`) so utilities such as
  `bg-ivory`, `text-ink-900`, `border-gold-500` exist. Never hard-code a hex value in a component.
- Fonts via `next/font` at the root layout: Display (Cormorant Garamond), Body (Jost or Inter),
  Signature (script) — self-hosted, `display: swap`, Latin subset, hero font preloaded.
- Dark sections are opt-in via `data-theme="night"` on a section element; the token set inverts
  under that attribute.
- Gold is decorative only: never body text on ivory (contrast rule, §3.1).
- Animate `transform` and `opacity` only. No animated `width`, `height`, `top`, `left`, `margin`.
- Every animated element must have a `prefers-reduced-motion` path (Framer's `useReducedMotion`
  or a CSS media query).

---

## 6. API conventions

### 6.1 Envelope

Every route handler returns JSON in exactly this shape:

```ts
// success — HTTP 200 (or 201 on create)
{ "ok": true, "data": <T> }

// failure — HTTP 4xx/5xx
{ "ok": false, "error": { "code": "<ERROR_CODE>", "message": "<human readable>", "fields"?: { "<path>": ["<msg>"] } } }
```

Helpers in `lib/api.ts`:

```ts
export function ok<T>(data: T, init?: ResponseInit): Response;
export function fail(
  code: ErrorCode,
  message: string,
  opts?: { status?: number; fields?: Record<string, string[]> },
): Response;
export async function handle(req: Request, fn: () => Promise<Response>): Promise<Response>; // catches, logs, returns INTERNAL
```

### 6.2 Error code registry (single file: `lib/api.ts`)

| Code                   | HTTP | Meaning                                               |
| ---------------------- | ---- | ----------------------------------------------------- |
| `VALIDATION`           | 400  | Zod parse failure; `fields` carries per-path messages |
| `GUEST_REQUIRED`       | 401  | No/invalid guest cookie                               |
| `UNAUTHENTICATED`      | 401  | No admin session                                      |
| `FORBIDDEN`            | 403  | Session present but email not allow-listed            |
| `NOT_FOUND`            | 404  | Resource does not exist (uniform, no existence leaks) |
| `RSVP_CLOSED`          | 409  | Deadline passed or mode is `POST`                     |
| `PARTY_SIZE_EXCEEDED`  | 409  | Attendees > `maxPartySize`                            |
| `NOT_INVITED`          | 403  | Event not in the guest's invitations                  |
| `UPLOADS_CLOSED`       | 403  | Upload window shut                                    |
| `INVALID_TOKEN`        | 401  | Upload token mismatch (uniform)                       |
| `ASSET_NOT_FOUND`      | 404  | Cloudinary asset does not exist                       |
| `PAYSTACK_UNAVAILABLE` | 502  | Gateway call failed                                   |
| `RATE_LIMITED`         | 429  | Hardening sprint only                                 |
| `INTERNAL`             | 500  | Unhandled; never includes stack or internals          |

Never leak SQL, stack traces, Prisma errors or gateway payloads to the client.

### 6.3 Route handler rules

1. `export const dynamic = "force-dynamic"` (or `revalidate = 0`) for anything reading cookies,
   the DB per-request, or query params.
2. Parse **and validate** input with a Zod schema from `lib/validation/*` before any DB work.
3. Uniform responses for unguessable-resource lookups (same code/status whether or not it exists).
4. `cache: "no-store"` on every response that reflects DB state.
5. Never log secrets, full payloads or guest contact details. Payment logs carry `reference`,
   `status`, `outcome` only.
6. Mutations on money or RSVP state happen inside `prisma.$transaction`.
7. Webhooks: read `await req.text()` **before** JSON parsing (raw body for HMAC), respond `200`
   quickly, do email work after persistence (wrap in `after()` from `next/server` when available;
   otherwise `try/catch` after the commit).
8. Admin handlers: first line is `const admin = await requireAdmin(); if (!admin) return fail(...)`.

### 6.4 Error handling on the client

- Forms map `error.fields` back onto the fields; non-field errors render in an error summary
  region with `role="alert"`.
- Never render a raw thrown message.

---

## 7. Auth, guest identity and mode

- **Admin:** Auth.js v5, Prisma adapter, magic link, allow-list (A6). Guard helper:
  ```ts
  // lib/admin.ts
  export async function requireAdmin(): Promise<{ email: string } | null>;
  ```
  - `app/admin/layout.tsx` calls it and `redirect("/api/auth/signin")` when null.
  - Every `app/api/admin/**/route.ts` calls it and returns `fail("UNAUTHENTICATED" | "FORBIDDEN")`.
  - Enforced by `tests/unit/admin-guard-coverage.test.ts` (A16).
  - Sessions: JWT, 8h; magic link valid 30 min. Admin actions write `AuditLog`
    (`actor`, `action`, `entity`, `entityId`, redacted `meta`).
- **Guest:** signed capability cookie (§13.1). Format `<code>.<hmac-sha256 hex of code>` using
  `GUEST_COOKIE_SECRET`. `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`,
  `Max-Age = 90 days`. Helpers in `lib/guest-cookie.ts`: `setGuestCookie`, `getGuestCode()`
  (verifies signature, returns `null` on any failure), `clearGuestCookie`.
  - The cookie is a **hint**: it remembers which household you are. It never grants more than
    that household's own data, and party size / invited events are always re-read from the DB.
  - Guest codes: `lib/codes.ts` → `customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8)`
    (nanoid, §21.4). Unique violation ⇒ regenerate, max 5 attempts.
- **Mode:** `lib/mode.ts` exports `getMode()`, `isAlbumVisible()`, and the `ORDER` map from §7.3.
  Every mode-dependent page reads mode through `lib/cache.ts`.

---

## 8. Data access, caching and revalidation

```ts
// lib/db.ts — Prisma singleton (prevents dev hot-reload connection exhaustion)
export const prisma: PrismaClient;
```

```ts
// lib/cache.ts  (amendment A7)
export function cached<T>(
  fn: () => Promise<T>,
  key: string,
  opts?: { tags?: string[] },
): () => Promise<T>;
// Every operational read: cached(prisma.x.findMany, 'events', { tags: ['site'] })
```

- After **any** mutation to operational data, call `revalidateTag("site")` **and**
  `revalidatePath(<affected route>)` (e.g. `/`, `/gallery`, `/gift`, `/rsvp`). The tag invalidates
  the cached data reads; the path invalidates the rendered ISR HTML. Doing only one of the two is
  a known source of "the toggle did nothing" bugs — a helper `revalidateSite(paths: string[])`
  in `lib/cache.ts` performs both so call sites cannot forget. This includes admin edits, mode
  changes, photo approval and RSVP-driven content.
- No raw `prisma` import outside `lib/` and `prisma/` + `scripts/` + `tests/`.
- Migrations: `prisma migrate dev --name <slug>` locally (never edit a generated migration);
  `prisma migrate deploy` in Vercel builds (A13). Forward-only, backwards-compatible for one
  release. Seed (`prisma/seed.ts`) must be **idempotent** (upsert by natural key) and runnable
  repeatedly: `pnpm seed`.

---

## 9. Git, PRs and reviews

- **Branches:** `main` (protected, always green) · `feat/<short-kebab>` · `fix/<short-kebab>` ·
  `chore/...` · `docs/...` · `test/...` · `refactor/...` · `perf/...` · `ci/...`.
- **Commits:** Conventional Commits, enforced by commitlint — `feat(scope): ...`,
  `fix(rsvp): ...`, `test(payments): ...`, `docs(plan): ...`. Subject ≤ 72 chars, imperative
  mood, body explains _why_ when non-obvious.
- **One subphase = one PR** (split further if a PR would exceed ~400 changed lines or touch more
  than one concern). PR title must be a valid Conventional Commit (it becomes the squash message).
- **Before pushing:** `pnpm verify` runs `lint`, `format:check`, `typecheck`, `test:unit`. It must
  pass locally; CI re-runs it.
- **PR template checklist:** linked subphase, screenshots (390px + desktop) for UI, tests added,
  docs updated, no `console.log`, no commented-out code, no new env vars without `.env.example`
  - Vercel updates, no dependency without justification.
- **Merge:** squash and merge, delete the branch, never force-push `main`. CI green is required
  (branch protection).
- **Rollback:** revert the merge commit (Vercel redeploys); DB changes must be safe for one
  release so a code rollback never needs a schema rollback.

---

## 10. Testing

| Layer       | Location                         | Runner                 | Needs                   |
| ----------- | -------------------------------- | ---------------------- | ----------------------- |
| Unit        | `tests/unit/**/*.test.ts`        | Vitest                 | nothing                 |
| Integration | `tests/integration/**/*.test.ts` | Vitest                 | `wedding_test` DB (A12) |
| E2E         | `tests/e2e/**/*.spec.ts`         | Playwright             | built app + test DB     |
| A11y        | inside e2e specs                 | `@axe-core/playwright` | built app               |
| Perf        | `lighthouserc.json`              | LHCI                   | built app               |

- Scripts: `pnpm test` (unit + integration), `pnpm test:unit`, `pnpm test:integration`,
  `pnpm test:e2e`, `pnpm test:a11y`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`,
  `pnpm check:bundle`, `pnpm security:scan`, `pnpm build`, `pnpm dev`, `pnpm seed`,
  `pnpm db:studio`, `pnpm verify` (= lint + format:check + typecheck + test:unit).
- Naming: `describe('<unit under test>')` → `it('<does what, in what condition>')`.
  Example: `it("rejects a signature shorter than the expected digest", ...)`.
- **Every bug fix ships with a regression test that fails without the fix.**
- Required coverage of _behaviour_, not line count: the gateway signature guard, RSVP transaction
  rules, party-size and invitation rules, gift state machine, mode/album visibility, `.ics`
  generation, CSV escaping, cookie signing, guest-code alphabet, settings bootstrap.
- Fixtures: `tests/factories.ts` builds guests/events/rsvps in the test DB; each test cleans up
  its own rows (`afterEach` delete by test prefix). Never point tests at the dev database.
- Integration/e2e require `DATABASE_URL` pointing at `wedding_test`; the setup script refuses to
  run if the URL does not contain `wedding_test` (guard against destructive tests on dev/prod).
- Mocking: only external network boundaries (Cloudinary, Paystack, Brevo) are mocked, in
  `tests/mocks/`. Never mock Prisma in integration tests.

---

## 11. Performance and accessibility budgets

- Initial route JS ≤ 180 KB gzipped (measured by the bundle check script); Lighthouse mobile
  perf ≥ 90; LCP ≤ 2.5 s; CLS < 0.05. CI fails below these.
- Images: Cloudinary `f_auto,q_auto`, responsive `srcset`, explicit `width`/`height` (or
  `fill` + container) to keep CLS at 0, blur placeholder where available.
- `next/dynamic` for lightbox, map embed and upload dropzone.
- A11y: one `h1` per page, semantic landmarks, skip link, visible focus rings, `aria-live` on form
  errors, `aria-hidden` on decorative gold, alt text on every photo, focus trap in lightbox/modal
  with Esc + arrow keys.

---

## 12. CI/CD

`.github/workflows/ci.yml` — on `pull_request` and `push` to `main`:

| Job           | Steps                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `static`      | checkout → setup Node (pinned) → `pnpm install --frozen-lockfile` → `prettier --check .` → `pnpm lint` → `pnpm typecheck` → `pnpm test:unit` |
| `integration` | Postgres service (`postgres:16`, health-checked) → create `wedding_test` → `prisma migrate deploy` → `pnpm test:integration`                 |
| `build-e2e`   | `prisma migrate deploy` → `prisma db seed` → `pnpm build` → upload `.next` artifact                                                          |
| `e2e`         | download artifact → `playwright test` against `next start` (test DB env) → upload report on failure                                          |
| `lighthouse`  | `next start` → `lhci autorun`                                                                                                                |

- Vercel: repo integration on `main` → production; every PR → preview deployment with the
  preview env vars and a Neon preview branch. Post a preview URL comment on the PR.
- Build command (Vercel): `prisma migrate deploy && next build`; install: `pnpm install`;
  output: default. `postinstall: prisma generate`.
- Environment promotion is **env vars only** — the same commit that is green in preview is what
  ships to production. Never hot-fix production on a laptop.
- Required secrets in GitHub: none beyond what Vercel manages (Vercel provides preview env vars).

---

## 13. Documentation

- `README.md`: what it is, local setup (prereqs, `docker compose up -d`, `pnpm i`, `cp .env.example .env`,
  `pnpm seed`, `pnpm dev`), scripts table, env table, deploy notes.
- `RUNBOOK.md`: payment issue, site down/slow, wedding day, rollback, contacts — mirrors
  architecture §19 and is delivered in Sprint 4.
- Any PR that adds an endpoint, env var, script or admin capability must update the relevant doc
  in the same PR. This is a merge-blocking checklist item.
