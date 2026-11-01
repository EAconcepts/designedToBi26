# Phase 4 — Hardening (Sprint 4)

**Dates:** Sat 31 Oct – Thu 5 Nov 2026 (public launch Fri 6 Nov)
**Outcome:** the site is secure, observable, fast on real devices, running against **live**
Paystack with a tested rollback path, and the couple has been trained. No new features.

Architecture refs: §13–§16, §19, §10.3–10.4.

---

## 4.0 Phase entry gate

### Internal

- [ ] Phase 3 exit gate satisfied (soft launch feedback captured).
- [ ] All soft-launch feedback triaged: fixed now, deferred with a reason, or rejected with a
      reason — recorded in `STATUS.md`. Nothing silently dropped.
- [ ] `pnpm test && pnpm test:e2e` green on `main`.

### External

- [ ] **Paystack account approved with LIVE keys.** Blocking for 4.4.
- [ ] Custom domain and DNS access (optional; Vercel hostname is sufficient).
- [ ] Real assets delivered: logo, floral art, magenta value from the invitation, pre-wedding
      photos, story copy, invitation wording (blocking for 4.5 — start earlier if they arrive).
- [ ] Brevo sender email verified and sending to external recipients (if not done in Sprint 2).
- [ ] Sentry account created (free tier is fine).
- [ ] A second admin user (coordinator) created for the couple's team.

### Decisions

- [ ] Rate-limiting approach: **Vercel Firewall rules** if the plan includes them, else Upstash
      (§5). Record the choice; both are already in the env list.
- [ ] Turnstile: only if spam is observed (§5). Decide by evidence, not anxiety.
- [ ] Retention period (§20.2.14) — default 90 days post-wedding if unanswered.
- [ ] Live-stream: yes/no and platform (affects the LIVE banner only).

---

## Subphase 4.1 — Secrets, env parity and configuration review

**Goal:** production is configured deliberately, not inherited from a preview.

**Tasks**

1. `lib/env.ts` schema review: every key required in production fails fast if missing; dev-only
   relaxations are explicit and named (`isDevFallback`), not `optional()` defaults.
2. Audit Vercel env vars: correct value **per environment**; no test keys in Production; no
   shared `AUTH_SECRET`/`GUEST_COOKIE_SECRET` between Preview and Production
   (`openssl rand -base64 32` twice). Record a redacted matrix in `STATUS.md`
   (key name + environment + "set/missing", never values).
3. Confirm `.env*` are ignored and no secret exists in git history:
   `git log --all -p | grep -E "sk_|re_|pk_|AKIA" ` → no matches (add as a CI step if practical).
4. `ADMIN_ALLOWLIST` contains exactly the intended addresses (couple + developer + coordinators).
5. `NEXT_PUBLIC_*` audit: only site URL (and Turnstile/analytics if present) is exposed.
6. Turnstile **not** wired unless triggered; if triggered, add both keys and the widget.

**Acceptance criteria**

- [ ] Env matrix recorded; zero missing keys in Production.
- [ ] Different secrets per environment (verified by comparing Vercel values by eye — record
      "distinct: yes" per secret).
- [ ] CI grep step for common secret prefixes passes.

**Exit gate:** checklist complete in `STATUS.md`; no code changes required unless a key was
wrongly hard-coded anywhere.

---

## Subphase 4.2 — Rate limiting, spam and abuse controls

**Goal:** the endpoints most likely to be hit by robots are protected without hurting real guests.

**Files:** `lib/rate-limit.ts`, `app/api/*/route.ts` call sites, `middleware.ts` (if using
Vercel Firewall rules, the config may live in `vercel.json` instead).

**Targets (per IP; guest cookie also counted where present)**

| Endpoint                              | Limit (suggested)                        | Notes                                                                                                                                                                               |
| ------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/rsvp`                      | 10 / 10 min                              | a household edits a few times                                                                                                                                                       |
| `POST /api/gifts/initialize`          | 10 / hour                                | protects gateway quota                                                                                                                                                              |
| `GET /api/gifts/verify`               | 60 / min                                 | polling is expected                                                                                                                                                                 |
| `POST /api/gifts/declare`             | 5 / hour                                 |                                                                                                                                                                                     |
| `POST /api/upload/sign` + `/complete` | 30 / 10 min                              | a batch is ≤ 10 files                                                                                                                                                               |
| `GET /i/[code]`                       | 30 / min                                 | **uniform 404/redirect behaviour preserved** — never 429 here, or response timing/content leaks code validity; instead throttle by delaying nothing and returning the same redirect |
| Admin login                           | Auth.js defaults + 10 / 15 min per email |                                                                                                                                                                                     |

**Tasks**

1. Implement `lib/rate-limit.ts` with a single interface so the backend can be swapped:
   `await limit("rsvp", ip)` → `{ ok, remaining } | throw/return fail("RATE_LIMITED")`.
   Backend: Vercel Firewall (config-based) or `@upstash/ratelimit` (add only if chosen).
2. Return `429` with `Retry-After` and the standard envelope.
3. Honeypot field on RSVP, declaration and (if used) wall-like public forms; if filled ⇒ silently
   accept and drop (log only), so bots do not learn.
4. Log every rate-limited hit (path + IP hash) for tuning; thresholds become config, not code.
5. If observed spam on uploads or RSVP after launch, enable Turnstile on **only** the affected
   forms (env keys already documented).

**Acceptance criteria**

- [ ] 11 RSVP submissions from one IP in a test ⇒ the 11th gets `429` with `Retry-After`.
- [ ] A legitimate guest completing RSVP twice in a row is never throttled (test the 10-min window
      with 3 sequential submissions).
- [ ] Guest-code probing does not reveal validity via status codes (fuzz test: valid and invalid
      codes return the same status and body).
- [ ] Upload flow still works on a congested network (re-test on device; parallel uploads share a
      budget).

**Tests:** integration for each limited endpoint (429 + envelope + `Retry-After`), unit for the
limiter's window logic (with an injected clock), plus the validity-fuzz test above.

**Exit gate:** all green on preview with the chosen backend actually enabled (evidence: a real
429 response pasted into `STATUS.md`).

---

## Subphase 4.3 — Security headers, CSP and a focused review

**Goal:** architecture §13.1 controls actually deployed and verified.

**Files:** `next.config.ts` headers, `app/layout.tsx` (meta where needed), `scripts/security-scan.mjs`.

**Tasks**

1. Headers on all routes (including static, via `headers()` in `next.config`):
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (and `frame-ancestors 'none'` in CSP)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (only after HTTPS
     is confirmed on the apex and www — otherwise you lock yourself out)
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
   - `Content-Security-Policy` pragmatic baseline:
     `default-src 'self'; img-src 'self' data: blob: https://res.cloudinary.com; font-src 'self';
style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'
https://challenges.cloudflare.com; connect-src 'self' https://api.paystack.co
https://res.cloudinary.com https://*.sentry.io; frame-src https://checkout.paystack.co
https://www.openstreetmap.org https://www.google.com; frame-ancestors 'none'; base-uri 'self';
form-action 'self' https://checkout.paystack.co; object-src 'none'`
     Note: `script-src 'unsafe-inline'` is required by Next.js unless a nonce strategy is adopted;
     document the trade-off in `RUNBOOK.md`. If Auth.js/Paystack inline scripts need
     `'unsafe-inline'` only for styles, tighten `script-src` and retest.
2. Verify with `scripts/security-scan.mjs`: fetch `/`, `/rsvp`, `/admin`, `/api/health` and assert
   every header + assert `noindex` in meta and the `X-Robots-Tag` header.
3. Focused review against §13.1, item by item (record pass/fail in `STATUS.md`):
   - guest codes unguessable + uniform responses
   - webhook signature length guard (regression test present)
   - `/gifts/verify` returns status only
   - admin guarded at layout **and** every API route (A16 test green)
   - no raw HTML rendering from user input (grep for `dangerouslySetInnerHTML` — should be zero
     outside reviewed cases)
   - secrets server-only (bundle grep)
   - upload signed + verified (A3 test green)
   - bank details editable only via admin/DB and audited
4. Dependency audit: `pnpm audit --prod` → no high/critical; if any, fix or document why.

**Acceptance criteria**

- [ ] `security-scan` passes on all four routes (add it to CI).
- [ ] `rg "dangerouslySetInnerHTML" app components lib` → zero matches (or each match reviewed
      and justified in `STATUS.md`).
- [ ] `pnpm audit --prod` clean or waived with reasons.
- [ ] CSP verified not to break: fonts, Cloudinary images, Paystack redirect, OSM modal, magic
      link emails' landing page. Test each in the browser console for violations.

**Tests:** the scan script wired into CI; keep A16 and signature tests as the guard rails.

**Exit gate:** scan green in CI; the §13.1 review table completed.

---

## Subphase 4.4 — Live payments and reconciliation

**Goal:** real money moves correctly, and every naira is accounted for.

**Tasks**

1. Create Paystack **live** keys; set in Vercel Production only; keep test keys for Preview.
2. Register the live webhook URL:
   `https://<domain>/api/webhooks/paystack` in the Paystack dashboard; enable `charge.success`.
3. Pre-launch payment drill (all four, on production):
   - ₦1,000 success → `Gift = SUCCESS`, receipt email, couple notification, ledger total correct.
   - Abandoned checkout (close the tab) → remains `PENDING` → `pnpm gifts:reconcile` marks
     `ABANDONED`.
   - Card failure (test/failure path) → `FAILED` after reconcile.
   - Webhook replay from the dashboard → idempotent, no second email, no duplicate row.
   - **Amount mismatch drill:** (test mode) send a signed payload with a different amount →
     row stays `PENDING`, alert email arrives.
4. Reconciliation runbook validated: `pnpm gifts:reconcile` scheduled how? Decide: manual weekly
   until the wedding, and daily in the final week. Record the cadence in `RUNBOOK.md`.
5. Cross-check: sum(`SUCCESS`) in the DB === Paystack dashboard settled amount for the same window.
   Record the comparison screenshot.
6. Refund path documented (Paystack dashboard → then how the row is handled: keep `SUCCESS` +
   add `meta`/audit note — do not delete).
7. Bank-transfer details verified character-by-character with the couple (printed vs site).

**Acceptance criteria**

- [ ] All five drill rows pass with evidence (dashboard + DB screenshots).
- [ ] Reconcile script run against production data returns 0 pending older than 30 min.
- [ ] Ledger total equals the gateway total for the test period.
- [ ] Every drill is recorded in `STATUS.md` with references so the couple can be shown proof.

**Tests:** no new automated tests required beyond existing ones; the drills are manual and
mandatory. If a drill reveals a bug, it ships with a regression test (conventions §10).

**Exit gate:** all drills green, or launch is blocked (this is a hard gate).

---

## Subphase 4.5 — Real content and brand swap

**Goal:** placeholders out, the couple's identity in, with zero code edits beyond config/assets.

**Tasks**

1. Logo: replace/add `public/brand/logo.svg` (or `.png`), update `SITE.brand.logo`
   (`kind`, `width`, `height`), regenerate `app/icon.png`, confirm the OG card picks it up
   (§3.4 dependents: hero, footer, favicon, OG, email templates — check all five).
2. Magenta token: sample the exact value from the invitation image into `--magenta-600`
   (and derive `--magenta-800`); re-run contrast checks for every text usage
   (`magenta-600` on ivory and on white must pass AA for normal text — if not, use it only for
   large text/CTAs with `ink-900` labels).
3. Fonts: confirm the chosen display/body/signature faces match the invitation's feel; no change
   needed unless the couple objects at the review.
4. Real content: invitation wording verbatim, story milestones + photos, FAQ, accommodation/travel,
   dress-code guidance, venue pin (`Venue.lat/lng`), reception time (clear `timeTbc` when known),
   bank accounts (activate the seed rows), meal options if any.
   Everything except DB-backed items comes from `SITE`; DB items are updated with a one-off script
   or Prisma Studio — **never by editing the seed and re-running it over real data** (document the
   safe path: `pnpm db:studio`).
5. Photos: `pnpm sync:album pre-wedding` (and later `wedding-day`), captions + alt text filled in
   via admin.
6. Florals/texture: add `public/brand/floral-corner.svg` and the paper grain; ensure the grain is
   ≤ 8 KB and disabled under reduced motion if it animates.

**Acceptance criteria**

- [ ] A side-by-side of the invitation and the site hero shows the same palette and type feel
      (screenshot for the couple's sign-off).
- [ ] All five logo dependents verified (screenshots).
- [ ] Contrast audit re-run for the new magenta: pass or documented exception.
- [ ] `rg -i "TODO\(content\)" content app components` → zero matches.
- [ ] Lighthouse re-run after the image swap (real photos are heavier — budgets still met).

**Exit gate:** couple's design sign-off recorded in `STATUS.md` (this is the §1.2 success
criterion "looks and feels premium").

---

## Subphase 4.6 — Domain, DNS, email deliverability and noindex

**Goal:** the production URL is real, emails land in inboxes, and Google ignores the site.

**Tasks**

1. Domain: apex + `www`, `www → apex` redirect, HTTPS forced, Vercel domain attached.
2. Brevo: verify the sender email and send test messages to Gmail, Outlook, iCloud, and Yahoo.
   If a custom domain is later used, configure SPF, DKIM, and DMARC for better deliverability.
3. `NEXT_PUBLIC_SITE_URL` updated in Production to the final domain (OG, calendar links, invite
   links, WhatsApp messages all derive from it — re-generate nothing; confirm they read the env).
4. `noindex` verification: `robots.txt` disallows all; `<meta name="robots" content="noindex,nofollow">`;
   `X-Robots-Tag: noindex, nofollow` header on HTML routes; Search Console is **not** required.
5. Share a production link in WhatsApp and confirm the OG preview card renders correctly (this is
   the §10.5 success check) — WhatsApp caches previews aggressively; use the debugger/preview with
   a cache-busting query if stale.
6. Uptime monitor: configure an external check on `/api/health` (and `/`) every 5 minutes with
   email/WhatsApp alerts (§16).

**Acceptance criteria**

- [ ] `curl -I https://<domain>/` → all security headers + `X-Robots-Tag`.
- [ ] Test emails in four inboxes (screenshots).
- [ ] WhatsApp preview shows the branded card with names, date and hashtag.
- [ ] Health monitor alerted in a deliberate test (stop/start or point at a bad URL for one cycle).

**Exit gate:** all four evidenced in `STATUS.md`.

---

## Subphase 4.7 — Observability and analytics

**Goal:** when something breaks at 10pm, someone knows.

**Tasks**

1. Sentry: `@sentry/nextjs` with `SENTRY_DSN` in all environments; release tags on deploy;
   source maps uploaded; **ignore** noisy transaction events if on a free tier quota.
2. Capture the three that matter: unhandled server errors, unhandled client errors, and a custom
   `payment.webhook_failed` event.
3. Analytics (Vercel Analytics or Plausible): funnels from §16 — link opened (`/i/[code]`
   success), RSVP started (form mount), RSVP completed (API 200), gift started (initialize 200),
   gift success (webhook transition). Use page views + a few custom events; **no PII in event
   properties** (no names, emails, codes, amounts tied to a person).
4. Payment logging: structured log line per webhook
   (`reference`, `event`, `outcome`, `duration`) — grep-able in Vercel logs.
5. Alerts: Sentry alert rule → email on new issues; a threshold alert on 5xx rate if the plan
   allows (Vercel).
6. `RUNBOOK.md`: how to read each of these, with links.

**Acceptance criteria**

- [ ] A deliberate `throw` in a preview environment produces a Sentry event with the release tag.
- [ ] A test RSVP completion increments the funnel event (verify in the analytics dashboard).
- [ ] Log line visible for the test payment from 4.4.
- [ ] No PII in analytics properties (review the event payload once, in writing).

**Exit gate:** evidence screenshots in `STATUS.md`.

---

## Subphase 4.8 — Device matrix, accessibility and performance on real hardware

**Goal:** §1.2 "fast on real phones" and §2.2 AA are proven, not assumed.

**Matrix (all must pass; record device + OS + browser + result)**

| Device / browser                                      | Checks                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| iPhone Safari (latest)                                | hero, RSVP, HEIC upload, lightbox, Paystack redirect back, clipboard copy |
| Mid-range Android Chrome                              | opening sequence FPS, RSVP, upload, gallery scroll                        |
| Low-end Android Chrome (or the oldest you can source) | sequence performance, no jank, upload retry                               |
| WhatsApp in-app browser (Android + iOS)               | invite link, RSVP submit, Paystack redirect (**no popups** — ADR-4)       |
| Desktop Chrome / Safari / Firefox                     | layout, keyboard, lightbox                                                |

**Tasks**

1. Run the matrix; file every defect as a `fix/` branch before launch.
2. Accessibility: axe on every route (automated) **plus** a manual pass — keyboard-only completion
   of RSVP, VoiceOver/TalkBack on the hero + RSVP form, focus visibility everywhere, zoom to 200%
   without loss of content.
3. Performance: Lighthouse on production (mobile) for `/`, `/rsvp`, `/gift`, `/gallery`; real-user
   numbers after a few days via analytics (LCP p75 < 2.5 s target).
4. Load sanity (§15, light): `k6` script hitting `/`, `/api/session/guest`, `POST /api/rsvp`
   (with seeded codes) at a burst of 100 VUs for 60 s; assert p95 < 1 s for pages and < 1.5 s for
   RSVP, error rate < 1 %. Keep the script in `tests/load/rsvp.js`.
5. `check:bundle` and `lhci` remain green in CI with the tightened CLS ≤ 0.05 assertion.

**Acceptance criteria**

- [ ] Matrix fully filled in `STATUS.md`; zero open critical/high defects.
- [ ] Manual a11y pass recorded (who did it, what they tested, what they found).
- [ ] k6 results attached; thresholds met or a documented tuning fix applied.
- [ ] Production Lighthouse mobile perf ≥ 90 on `/` and `/rsvp`.

**Exit gate:** all four; any failure here blocks launch.

---

## Subphase 4.9 — Backup, rollback and runbooks

**Goal:** recoverable from a bad deploy and a bad data change.

**Tasks**

1. Neon: confirm automated backups + point-in-time recovery are enabled; **perform one restore
   test** into a scratch branch and verify `Gift` and `Rsvp` row counts match the source at the
   chosen timestamp. Record the steps used (they go in `RUNBOOK.md`).
2. Rollback drill: deploy a deliberately broken build to production (a visible typo), then roll
   back via Vercel to the previous deployment; time it and record it. Revert the branch properly
   afterwards.
3. Data safety: confirm migrations applied so far are backwards compatible with the previous
   release (revert the code one release back against the current schema — it should boot).
4. `RUNBOOK.md` completed: payment issue (§19.2), site down/slow (§19.3), wedding day (§19.4),
   plus: rollback steps, DB restore steps, rate-limit tuning, CSP violation triage, how to rotate
   a secret, who to call.
5. Admin quick-start (2 pages, screenshots) for the couple: sign in, RSVP list, mark a bank
   transfer, flip mode, moderate uploads, copy a guest link.
6. Credentials handover list (which accounts, who owns them, where the passwords live).

**Acceptance criteria**

- [ ] Restore drill performed with row counts recorded.
- [ ] Rollback drill performed with duration recorded.
- [ ] `RUNBOOK.md` reviewed end-to-end by a second person (or read critically by the developer
      with a written note that each section is executable).
- [ ] Admin quick-start delivered and the couple has practised once.

**Exit gate:** the three artefacts (restore evidence, rollback evidence, RUNBOOK) present.

---

## 4.10 Phase exit gate — Launch readiness (Thu 5 Nov)

### Automated evidence

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm format:check && pnpm typecheck
pnpm test && pnpm test:e2e
pnpm build && pnpm check:bundle && lhci autorun
node scripts/security-scan.mjs
pnpm audit --prod
```

### The launch checklist (architecture §19.1) — every box ticked

**Content**

- [ ] Names/parents/wording match the printed invitation exactly (two-person proofread)
- [ ] Dates, times, time zone verified; reception time set or TBC intentionally
- [ ] Venue pin and deep links tested on a phone
- [ ] Bank details verified by the couple
- [ ] RSVP contacts verified on WhatsApp
- [ ] Real logo swapped in; favicon and OG card regenerated; magenta sampled
- [ ] Photos optimised with captions and alt text

**Technical**

- [ ] Production env vars set; live Paystack keys; webhook registered and drill-tested
- [ ] Database backup and restore tested (4.9)
- [ ] Domain, HTTPS, SPF/DKIM/DMARC verified
- [ ] `noindex` confirmed; WhatsApp preview correct
- [ ] Rate limiting and Sentry active
- [ ] Lighthouse mobile ≥ 90; axe no critical issues
- [ ] Upload flow tested on iPhone (HEIC) and Android over mobile data

**Operational**

- [ ] Couple and coordinators tested admin on their phones
- [ ] Guest codes generated and spot-checked; WhatsApp invite text approved
- [ ] `RUNBOOK.md` delivered

### Manual evidence

- [ ] Couple's written sign-off (message is fine) on design and content.
- [ ] All Phase 4 drill evidence (payments, restore, rollback, alerts) attached.

### Docs

- [ ] `README.md`, `RUNBOOK.md`, `STATUS.md` final and consistent with production reality.
- [ ] Dependency tracker: every row green or explicitly accepted as a risk by the couple.

**Gate rule:** public launch (Phase 5) does not start unless this gate is fully satisfied.
The single exception allowed by the risk register is _content polish_ — never payments, security
or RSVP correctness.
