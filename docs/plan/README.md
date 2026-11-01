# Implementation Plan — Wedding Invitation Site

**Source of truth for _what_ and _why_:** [`../architecture.md`](../architecture.md) (v2)
**Source of truth for _how_ and _when_:** this folder.

This plan turns architecture v2 into an executable build order. Every phase and subphase has an
**entry gate** (conditions that must be true before work starts) and an **exit gate** (objective
evidence that the work is finished). Nothing is "done" until its exit gate is satisfied with
recorded evidence.

---

## 1. How to use this plan (read this first, always)

### 1.1 Execution rules

1. **Read in order:** `architecture.md` → `00-conventions.md` → the phase file you are working in.
2. **One subphase at a time.** Complete its tasks, its acceptance criteria and its tests before
   starting the next. Do not parallelise across subphases within a phase.
3. **Entry gate before work.** If any entry-gate item is false, do not start. Record the blocker in
   [`STATUS.md`](STATUS.md) under `## Blocked` and stop or pick up a phase whose gate is open.
4. **Exit gate before "done".** Run every command listed. Paste the evidence (command output,
   preview URL, screenshot) into `STATUS.md`. A gate item you cannot verify is _not_ satisfied.
5. **Conventions are binding.** File paths, API envelopes, error codes, naming and test placement
   are defined in `00-conventions.md`. If you believe a convention is wrong, add an **Amendment**
   (§3 below) instead of silently diverging.
6. **No undocumented decisions.** Anything the architecture and this plan do not specify: record
   the decision, the alternatives and the reason in `STATUS.md` under `## Decisions taken`.
7. **Small, reviewable PRs.** One PR per subphase (or per coherent task group where a subphase is
   large). Never push to `main`. See `00-conventions.md` §9.
8. **Never weaken a gate to pass it.** If a gate fails, fix the code or raise an amendment. Do not
   lower a threshold, delete a test or edit an assertion to make it green.
9. **Keep `STATUS.md` current at the end of every working session** — the next agent (or session)
   picks up from it.

### 1.2 Definition of Done for any feature

In addition to a subphase's own acceptance criteria, every shipped feature must satisfy
architecture §21.6:

- [ ] Matches the approved design at 390px and desktop widths
- [ ] Keyboard and screen-reader usable; reduced-motion path implemented
- [ ] Inputs validated with Zod; error paths return the standard envelope
- [ ] Unit/integration/e2e tests added for the logic (not just the happy path)
- [ ] No Lighthouse regression (perf ≥ 90, LCP ≤ 2.5s)
- [ ] Content editable via admin/seed/script as designed — no hard-coded content edits needed
- [ ] README/RUNBOOK updated if it changed anything operational

---

## 2. Plan index

| File                                                                           | Covers                                                                                                            | Architecture ref |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------- |
| [`00-conventions.md`](00-conventions.md)                                       | Toolchain, repo layout, env, TS/style rules, API envelope, error codes, auth, data access, testing, git, CI/CD    | §4–§6, §13–§15   |
| [`01-sprint-0-foundation.md`](01-sprint-0-foundation.md)                       | Repo, scaffold, tokens, Prisma, seed, libs, Auth.js, health, CI, Vercel/Neon, test harness                        | §5–§7, §14, §18  |
| [`02-sprint-1-public-experience.md`](02-sprint-1-public-experience.md)         | Guest link + cookie, hero/opening, countdown, story, events, venue, colour/FAQ/footer, perf & a11y pass           | §3, §9.1, §10    |
| [`03-sprint-2-rsvp-and-gifting.md`](03-sprint-2-rsvp-and-gifting.md)           | RSVP API/UI/emails, phone path, admin RSVP, bank details, Paystack (init/webhook/verify/reconcile), receipts      | §8–§9, §12       |
| [`04-sprint-3-gallery-uploads-admin.md`](04-sprint-3-gallery-uploads-admin.md) | Cloudinary, albums, lightbox, locked states, QR uploads, moderation, admin settings/overview/ledger, site modes   | §11–§12          |
| [`05-sprint-4-hardening.md`](05-sprint-4-hardening.md)                         | Sentry, rate limiting, headers/CSP, live payments, device matrix, real assets, load test, backup/restore, RUNBOOK | §13–§16, §19     |
| [`06-launch-and-operations.md`](06-launch-and-operations.md)                   | Launch, batch invites, RSVP deadline, freeze, wedding day, post-wedding, retention                                | §17, §19         |
| [`STATUS.md`](STATUS.md)                                                       | Live progress, blockers, evidence, decisions (create on Day 1)                                                    | —                |

**Gate protocol:** every phase file ends with an exit gate split into **Automated evidence**
(commands with expected results), **Manual evidence** (things a human must look at) and
**Docs** (what must be updated). Every phase file begins with an entry gate split into
**Internal** (previous gates, repo state), **External** (accounts, assets, people) and
**Decisions** (open architecture questions that block that phase).

---

## 3. Amendments to architecture v2 (apply in Phase 0)

These are gaps found on review. They do not change any v2 decision; they complete it. **Phase 0.11
requires applying these to `architecture.md`** so the two documents cannot drift.

| ID      | Amendment                                                                                                                                                                                                                                                                                                                                                                                     | Why                                                                                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1**  | Add `GET /api/session/guest` to §8.2. Returns the guest resolved from the signed cookie: `{ displayName, maxPartySize, events, rsvp, greeting }`, or `{ guest: null }`.                                                                                                                                                                                                                       | `/` is ISR/static (§4.3) but the greeting and RSVP pre-fill need the HttpOnly cookie (§10.1). A static page cannot read cookies. Resolution: keep `/` static, and hydrate the greeting and pre-fill in a client island that calls this endpoint after load. The endpoint is `cache: no-store`. |
| **A2**  | Add `GET /api/events/[slug]/ics` to §8.2.                                                                                                                                                                                                                                                                                                                                                     | §21.5 requires server-side `.ics` generation but no route exists. Returns `text/calendar; charset=utf-8` with `Content-Disposition: attachment`.                                                                                                                                               |
| **A3**  | `/api/upload/sign` generates the Cloudinary `public_id` server-side; `/api/upload/complete` verifies the asset exists via the Cloudinary Admin API and reads `width`/`height` from it.                                                                                                                                                                                                        | Otherwise a client can create `Photo` rows pointing at assets that were never uploaded (broken gallery), and there is no defined source for `width`/`height`.                                                                                                                                  |
| **A4**  | Venue map: no Google Static Maps (API key + billing). Implement `MapCard` as a designed poster (venue name, pin icon, deep-link buttons) that lazy-loads an OpenStreetMap embed in a modal on tap. Deep links: Google Maps, Waze, Uber; Bolt only if the device test passes, else drop it. Placeholder poster until the couple supplies the pin (§7.2 `lat/lng` TODO).                        | Avoids a paid key and an account dependency; OSM embed needs no key.                                                                                                                                                                                                                           |
| **A5**  | Add to §5 dependencies: `nanoid`, `next-auth` + `@auth/prisma-adapter`, `csv-parse`, `qrcode.react`, `browser-image-compression`, `@axe-core/playwright`, `@lhci/cli`, `husky`, `lint-staged`, `@commitlint/*`.                                                                                                                                                                               | Required by §21.4 (codes), §12 (admin), §11.2 (sync script), §9.6 (compression), §15 (a11y/perf CI), and standard git practice.                                                                                                                                                                |
| **A6**  | Auth.js details: `next-auth` v5 (or current stable), Prisma adapter against `AdminUser`, `EmailProvider` with a custom `sendVerificationRequest` that sends via Brevo, JWT session strategy, `maxAge` 30 min for the magic link and 8h for the session. Allow-list enforced **twice**: in the `signIn` callback _and_ in `requireAdmin()` (defence in depth).                                 | §5 says "Auth.js + Brevo" but does not pin the mechanism; allow-list must not depend on a single check.                                                                                                                                                                                        |
| **A7**  | All mode/content-dependent Prisma reads go through `lib/cache.ts` (`unstable_cache(..., { tags: ['site'] })`), and every mutation calls the `revalidateSite(paths)` helper, which does **both** `revalidateTag('site')` and `revalidatePath()` for each affected route.                                                                                                                       | Otherwise `revalidateTag('site')` (§9.7) has no effect on cached data, or the data refreshes while the ISR HTML does not — either way the mode toggle appears broken.                                                                                                                          |
| **A8**  | Single source of truth table (in `00-conventions.md` §4): `content/site.config.ts` owns brand/copy/static facts and is the _input_ to `prisma/seed.ts`; the database owns operational state (mode, deadline, events, funds, accounts, albums, milestones). Runtime reads config **only** for brand/copy/contacts. `SITE.rsvp.deadline` seeds `Setting.rsvpDeadline`; after seed, the DB wins. | Both `SITE.rsvp.deadline` and `Setting.rsvpDeadline` exist in v2; without a rule they will diverge.                                                                                                                                                                                            |
| **A9**  | `/gift/complete` polls `GET /api/gifts/verify?ref=` with exponential backoff (2s→4s→8s, ~30s total), then settles on a "we'll email you when it lands" state. Never derive success from the redirect.                                                                                                                                                                                         | §9.4 shows polling but not the state machine or the timeout path.                                                                                                                                                                                                                              |
| **A10** | Scaffold at the **repo root** (alongside `docs/`), not in a nested `wedding-site/` folder.                                                                                                                                                                                                                                                                                                    | The working directory is already `wedding-invite/` and contains `docs/`.                                                                                                                                                                                                                       |
| **A11** | Add routes: `/privacy` (§13.2 requires a linked privacy notice) and `app/robots.ts` returning `noindex, nofollow` (§10.5).                                                                                                                                                                                                                                                                    | Neither has an implementation target in §8.                                                                                                                                                                                                                                                    |
| **A12** | Local Postgres via `docker-compose.yml` (dev DB `wedding_dev`, test DB `wedding_test`); CI uses the same image as a service container.                                                                                                                                                                                                                                                        | Integration/e2e tests (§15) need an isolated database.                                                                                                                                                                                                                                         |
| **A13** | Vercel build command runs `prisma migrate deploy` before `next build`; local development uses `prisma migrate dev`. Migrations are forward-only.                                                                                                                                                                                                                                              | §14.3 requires it but no command is specified.                                                                                                                                                                                                                                                 |
| **A14** | Add `NOTIFY_EMAIL` to §14.2 env vars (couple/coordinator notification address for gift receipts and webhook alerts).                                                                                                                                                                                                                                                                          | §9.4 requires "notification to couple" with no configured recipient.                                                                                                                                                                                                                           |
| **A15** | `lib/env.ts`: a Zod schema for all environment variables, parsed once on boot; `tests/unit/env-example.test.ts` fails CI if `.env.example` and the schema drift apart.                                                                                                                                                                                                                        | §14.2 lists vars by prose; drift is otherwise invisible until a deploy fails.                                                                                                                                                                                                                  |
| **A16** | `tests/unit/admin-guard-coverage.test.ts`: statically scans `app/api/admin/**/route.ts` and fails if any file does not import and call `requireAdmin()`.                                                                                                                                                                                                                                      | A layout guard protects pages but **not** API routes; a new admin endpoint added later would ship unauthenticated.                                                                                                                                                                             |
| **A17** | Add `inviteMessage` template to `SITE` (with `{{name}}` and `{{link}}` placeholders) for the admin "Copy WhatsApp message" action (§12).                                                                                                                                                                                                                                                      | §12 requires the copy action but no template exists.                                                                                                                                                                                                                                           |
| **A18** | `Guest.side` is surfaced as an admin list filter in Sprint 3; if unused by then, remove the column in the same sprint.                                                                                                                                                                                                                                                                        | Prevents dead schema.                                                                                                                                                                                                                                                                          |
| **A19** | Add to §8.2: `POST /api/gifts/declare` (the "I've sent a transfer" form of §9.5 has no endpoint) and the `GET/PATCH` admin collections for guests, RSVPs, gifts, media and settings (§8.2 lists only `* /api/admin/**` by wildcard). Add to §8.1: `/gallery/[slug]` album detail (§11 implies per-album pages).                                                                               | §9.5, §11 and §12 require them; §8 omitted them.                                                                                                                                                                                                                                               |
| **A20** | `scripts/seed-guests.ts` supports `--export` (guest list with links) so the final headcount export in Phase 5.3 does not require a new tool.                                                                                                                                                                                                                                                  | §12 defines only import.                                                                                                                                                                                                                                                                       |

---

## 4. Requirement traceability

| Req | Description                                             | Implemented in                                                        |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| F1  | Invitation hero, countdown, monogram, opening sequence  | Sprint 1 — subphases 1.3, 1.4                                         |
| F2  | Personalised guest links, pre-fill, party-size cap      | Sprint 0 — 0.6 (code + cookie), Sprint 1 — 1.2, Sprint 2 — 2.3        |
| F3  | Our Story timeline                                      | Sprint 1 — 1.5                                                        |
| F4  | Events (TBC time), add-to-calendar                      | Sprint 1 — 1.6 (+ A2)                                                 |
| F5  | Venue, directions, deep links, travel notes             | Sprint 1 — 1.7 (+ A4)                                                 |
| F6  | Gallery: albums, lightbox, locked states, download      | Sprint 3 — 3.2, 3.3                                                   |
| F7  | Guest uploads via QR, moderated                         | Sprint 3 — 3.4, 3.5                                                   |
| F8  | RSVP per person per event, meals, song, private message | Sprint 2 — 2.1–2.4                                                    |
| F9  | Phone/WhatsApp RSVP path + admin manual entry           | Sprint 2 — 2.3, 2.5                                                   |
| F10 | Gifting: bank details, Paystack, funds, receipts        | Sprint 2 — 2.6–2.9                                                    |
| F11 | Dress code / colour of the day                          | Sprint 1 — 1.8                                                        |
| F12 | FAQ, accommodation, contacts, hashtag                   | Sprint 1 — 1.8                                                        |
| F13 | Admin MVP                                               | Sprint 2 (RSVP) + Sprint 3 (guests, gifts, media, settings, overview) |
| F14 | Site modes PRE/LIVE/POST                                | Sprint 3 — 3.6, 3.8 (revalidate mechanics per A7)                     |

**Cut order if the schedule slips** (from architecture §20.1): Story polish → opening sequence →
Guest Moments album. Never cut: RSVP, payment integrity, admin RSVP entry, reduced-motion path.

---

## 5. External dependency tracker

Maintained in [`STATUS.md`](STATUS.md). Anything in phase `External` entry gate must be **green**
before that phase starts.

| Dependency                                                                   | Needed by                                          | Owner    | Status |
| ---------------------------------------------------------------------------- | -------------------------------------------------- | -------- | ------ |
| GitHub repo + Vercel account linked                                          | Sprint 0                                           | Emmanuel | ⬜     |
| Neon account (dev + preview branches)                                        | Sprint 0                                           | Emmanuel | ⬜     |
| Cloudinary account + signed-upload preset                                    | Sprint 0 (account), Sprint 3 (preset)              | Emmanuel | ⬜     |
| Brevo account + verified sender email                                        | Sprint 0 (account), Sprint 2 (sender)              | Emmanuel | ⬜     |
| Paystack account **approved** (KYC)                                          | Sprint 0 (start), Sprint 2 (test), Sprint 4 (live) | Couple   | ⬜     |
| Custom domain + DNS access (optional; Vercel hostname is sufficient)         | Optional                                           | Couple   | ⬜     |
| Invitation image (for magenta sampling)                                      | Sprint 1 (token), Sprint 4 (final)                 | Couple   | ⬜     |
| Real logo (SVG or ≥1600px transparent PNG)                                   | Sprint 4                                           | Couple   | ⬜     |
| Floral corner art, pre-wedding photos                                        | Sprint 1 placeholders, Sprint 4 real               | Couple   | ⬜     |
| Story copy, invitation wording verbatim                                      | Sprint 4 (placeholders until then)                 | Couple   | ⬜     |
| Reception time, venue pin, bank accounts, meal decision, accommodation notes | Before Sprint 2 (accounts/bank) / Sprint 1 (pin)   | Couple   | ⬜     |
| RSVP contact numbers verified on WhatsApp                                    | Sprint 2                                           | Couple   | ⬜     |
| Photographer + wedding-day delivery date                                     | Before wedding                                     | Couple   | ⬜     |

---

## 6. Schedule (from architecture §17)

| #   | Phase                   | Dates                     | Plan file                              |
| --- | ----------------------- | ------------------------- | -------------------------------------- |
| 0   | Foundation              | 5–9 Oct 2026              | `01-sprint-0-foundation.md`            |
| 1   | Public experience       | 10–16 Oct 2026            | `02-sprint-1-public-experience.md`     |
| 2   | RSVP and gifting        | 17–23 Oct 2026            | `03-sprint-2-rsvp-and-gifting.md`      |
| 3   | Gallery, uploads, admin | 24–30 Oct 2026            | `04-sprint-3-gallery-uploads-admin.md` |
| —   | **Soft launch**         | Fri 30 Oct 2026           | `06-launch-and-operations.md`          |
| 4   | Hardening               | 31 Oct – 5 Nov 2026       | `05-sprint-4-hardening.md`             |
| —   | **Public launch**       | Fri 6 Nov 2026            | `06-launch-and-operations.md`          |
| —   | RSVP deadline           | Sat 5 Dec 2026 (proposed) | `06-launch-and-operations.md`          |
| —   | Freeze                  | 14–19 Dec 2026            | `06-launch-and-operations.md`          |
| —   | Wedding day             | Sat 19 Dec 2026           | `06-launch-and-operations.md`          |
| —   | Post-wedding            | 20 Dec 2026 onward        | `06-launch-and-operations.md`          |

---

## 7. `STATUS.md` template (create on Day 1)

```md
# Build Status

_Last updated: <ISO timestamp> · Current phase: <0-4|launch> · Current subphase: <id>_

## Progress

| Phase | Subphase | State (not-started / in-progress / blocked / done) | Evidence |
| ----- | -------- | -------------------------------------------------- | -------- |

## Blocked

- <item> — blocked on <dependency/owner>, raised <date>, phase affected <n>

## Decisions taken

- <date> — <decision> — <alternatives> — <reason> — <amendment id if any>

## Evidence log

- <date> — <gate> — <command or URL> — <result>
```
