# Phase 2 — RSVP and gifting (Sprint 2)

**Dates:** Sat 17 Oct – Fri 23 Oct 2026
**Outcome:** guests can RSVP (web or phone path) with per-person, per-event detail, and can give
money by bank transfer or Paystack with an authoritative, idempotent, reconcilable payment flow.
Admins can see and edit RSVPs. Payments run in **test mode** for this phase.

Architecture refs: §8, §9.2–9.5, §12, §13, §21.2–21.3. Amendments applied: **A2, A9, A14, A16, A17**.

---

## 2.0 Phase entry gate

### Internal

- [ ] Phase 1 exit gate satisfied (budgets green on `main`).
- [ ] `lib/validation/`, `lib/api.ts`, `lib/money.ts`, `lib/ics.ts`, `lib/csv.ts` present and tested.
- [ ] Guest cookie + `/api/session/guest` working (subphase 1.2).

### External

- [ ] **Paystack account approved** (KYC complete) and **test keys** obtained. Without test keys,
      subphases 2.6–2.8 cannot exit — log as blocked and start 2.1–2.5.
- [ ] Brevo sender email verified; a custom domain is not required. Domain authentication can be
      added later to improve deliverability.
- [ ] RSVP contact numbers verified on WhatsApp (needed for the fallback path copy).
- [ ] Meal decision answered (§20.2.2): `SITE.rsvp.collectMeal` true/false and options. The code
      must work for both — set it explicitly either way before finishing 2.3.

### Decisions

- [ ] Fee handling (§20.2.4): couple absorbs vs "cover the fee" option. **Default if unanswered:
      couple absorbs** (no fee line item in v1); the schema leaves room to add it.
- [ ] Gift amount bounds: `SITE.gift.minAmountMinor` (default ₦1,000 = 100000) and a max
      (default ₦500,000 = 50000000). Confirm with the couple.
- [ ] Gift visibility: private to the couple (§20.2.6) — **assumed yes**; nothing gift-related is
      rendered publicly.

---

## Subphase 2.1 — Validation schemas and shared types

**Goal:** one place defines what the client and server both accept; the server never trusts the
client shape.

**Files:** `lib/validation/rsvp.ts`, `lib/validation/gift.ts`, `lib/validation/admin.ts`.

**Contracts**

```ts
// lib/validation/rsvp.ts
export const RsvpAttendeeInput = z.object({
  name: z.string().trim().min(2).max(80),
  events: z.array(z.string().min(1).max(40)).min(1), // slugs; enum-validated server-side against invitations
  meal: z.string().trim().max(60).optional(),
  dietary: z.string().trim().max(200).optional(),
});
export const RsvpInput = z.object({
  declined: z.boolean().default(false),
  attendees: z.array(RsvpAttendeeInput).max(10).default([]),
  message: z.string().trim().max(600).optional(),
});
export type RsvpInput = z.infer<typeof RsvpInput>;

// admin override of the same payload (2.5)
export const AdminRsvpInput = RsvpInput.extend({
  guestId: z.string().min(1),
  source: z.enum(['PHONE', 'WHATSAPP']).default('PHONE'),
});

// lib/validation/gift.ts
export const GiftInitInput = z.object({
  fundSlug: z.string().min(1).max(40),
  amountMinor: z.number().int().positive(),
  giverName: z.string().trim().min(2).max(80),
  giverEmail: z.string().trim().email().max(160), // required by Paystack (§9.4)
  message: z.string().trim().max(300).optional(),
  isAnonymous: z.boolean().default(false),
});
export const BankTransferDeclareInput = z.object({
  fundSlug: z.string().min(1).max(40).optional(),
  amountMinor: z.number().int().positive().optional(),
  giverName: z.string().trim().min(2).max(80),
  giverEmail: z.string().trim().email().max(160).optional(),
  message: z.string().trim().max(300).optional(),
  isAnonymous: z.boolean().default(false),
});
```

**Refinements the server applies after Zod** (so schema stays reusable client-side):
`declined === true ⇒ attendees.length === 0`; each attendee's `events` must be a subset of the
guest's invited slugs; `attendees.length ≤ guest.maxPartySize`; `amountMinor` within
`SITE.gift.min/max`; if `SITE.rsvp.collectMeal === false`, `meal`/`dietary` are discarded (not
rejected) so an old client cannot fail.

**Acceptance criteria:** schemas exported, typed, imported by both a client form and a server
route without pulling server-only code (`import type` discipline).

**Tests (`tests/unit/`):** `rsvp-schema.test.ts` (min/max lengths, trim, max 10 attendees,
`declined` default, rejects 11 attendees, accepts empty attendees only when declined — handled by
server rules, document that), `gift-schema.test.ts` (email required, integer minor units,
rejects 0/negative/float amounts).

**Exit gate:** `pnpm test:unit` green.

---

## Subphase 2.2 — RSVP API

**Goal:** the transactional core of F8, correct under retry and hostile input.

**File:** `app/api/rsvp/route.ts`, `lib/rsvp.ts` (domain logic, kept out of the route for
testability).

**Endpoint contract**

```
POST /api/rsvp                     Auth: guest cookie (signed)
Body: RsvpInput
200 → { ok: true, data: {
  status: "ATTENDING" | "DECLINED",
  attendees: { name: string; events: string[] }[],
  respondedAt: string,               // ISO
  emailSent: boolean
}}
Errors: 401 GUEST_REQUIRED · 400 VALIDATION (+fields) · 409 RSVP_CLOSED ·
        409 PARTY_SIZE_EXCEEDED · 403 NOT_INVITED · 429 RATE_LIMITED (Sprint 4) · 500 INTERNAL
```

**Server rules, in order (each maps to exactly one error code)**

1. `getGuestCode()` → null ⇒ `401 GUEST_REQUIRED`.
2. Zod parse ⇒ `400 VALIDATION` with `fields` keyed by the _input path_
   (e.g. `attendees.0.name`).
3. Load guest + `Invitation` rows + settings in one query. Missing guest ⇒ `401 GUEST_REQUIRED`
   (uniform with an invalid cookie).
4. Mode/deadline: `mode === "POST"` or `now > settings.rsvpDeadline` ⇒ `409 RSVP_CLOSED`.
5. If not `declined`: `attendees.length` must be ≥ 1 and ≤ `guest.maxPartySize` ⇒
   `409 PARTY_SIZE_EXCEEDED`.
6. Every `attendee.events` entry must exist in the site's event slugs **and** in this guest's
   invitations ⇒ `403 NOT_INVITED` (identify nothing about other guests).
7. Strip `meal`/`dietary` when `collectMeal` is false.

**Transaction (`prisma.$transaction`)**

```
deleteMany RsvpAttendee where rsvpId = existing (cascades AttendeeEvent)
upsert Rsvp by guestId → { status, source: WEB, message, respondedAt: now }
create RsvpAttendee rows + AttendeeEvent rows for each (attendee × event)
```

No existing RSVP ⇒ create path. `status` = `DECLINED` when `declined`, else `ATTENDING`.
(Pending stays `PENDING` only for a guest who has never submitted — never for a submit.)

**After commit** (never inside the transaction): if `guest.email` exists, send the confirmation
email; failure is caught, logged, and reported as `emailSent: false` — **the RSVP is still
successful**. Use `after()` from `next/server` if available.

**Acceptance criteria**

- [ ] A retry of the identical payload (double-tap submit) leaves exactly one `Rsvp`, N attendees
      and the right `AttendeeEvent` rows — no duplicates.
- [ ] Submitting 3 attendees to a `maxPartySize: 2` guest returns `PARTY_SIZE_EXCEEDED` and
      writes nothing (assert row counts unchanged).
- [ ] Asking for an event the guest is not invited to returns `NOT_INVITED` and writes nothing.
- [ ] After the deadline passes (set `rsvpDeadline` in the past in the test) returns `RSVP_CLOSED`.
- [ ] In `POST` mode returns `RSVP_CLOSED` even before the deadline.
- [ ] No cookie ⇒ `401` with the envelope; malformed JSON ⇒ `400`.
- [ ] The response never contains another guest's data.

**Tests**

- Integration `rsvp-api.test.ts`: happy path (2 attendees × 2 events), retry idempotency,
  party size, invitation scope, deadline, POST mode, decline path (attendees removed, status
  DECLINED), no-cookie, invalid payload, `collectMeal` stripping.
- Unit: `lib/rsvp.ts` rule functions in isolation (pure `evaluateRsvpRules(...)` returning
  `{ ok } | { code }`).

**Exit gate:** all of the above green; coverage of `lib/rsvp.ts` branches explicitly listed in
the PR description.

---

## Subphase 2.3 — RSVP UI (web) and the phone/WhatsApp path (F8, F9)

**Goal:** a mobile-first stepper that a non-technical guest completes in under a minute, plus the
no-code fallback.

**Files:** `app/(public)/rsvp/page.tsx`, `components/sections/RsvpForm.tsx`,
`components/ui/RsvpStepper.tsx`, `components/ui/AttendeeRow.tsx`, `components/sections/RsvpContactsPanel.tsx`.

**Behaviour**

1. Page is a static shell (§4.3). On mount it calls `RsvpPrefillProvider` →
   `/api/session/guest`.
   - `guest === null` ⇒ render **`RsvpContactsPanel` only** (two contacts, `tel:` + `wa.me`
     buttons, short instruction "Share your invitation link from your card, or message us").
     No RSVP form is shown without a code (§8.1). Do not guess/lookup by name in v1.
   - `guest !== null` ⇒ render the form, prefilled from `guest.rsvp` when present.
2. **Step 1 — Attendees:** number of rows capped at `maxPartySize` (a "+ Add person" button that
   disappears at the cap, with an explanatory line). Prefill names from the previous response.
   Empty state defaults to 1 row.
3. **Step 2 — Events:** per attendee, checkbox list built **only** from `guest.events`
   (invited events), showing title + date + time/TBC.
4. **Step 3 — Details:** meal select (only when `collectMeal`), dietary text, private message —
   each with a one-line explanation of who sees it ("private to the couple"). Also a "Sorry, we can't
   make it" decline toggle that disables steps 1–2 and clears them.
5. **Step 4 — Review + submit:** summary, submit → `POST /api/rsvp` → success screen with
   per-event summary, add-to-calendar links (reuse `AddToCalendar`), and an "Edit response"
   button that returns to the form.
6. Errors: field-level messages from `error.fields`; non-field codes map to human copy
   (`RSVP_CLOSED` → "RSVPs are closed — message us instead" with the contacts panel;
   `PARTY_SIZE_EXCEEDED` → "Your invitation covers N guests").
7. Honeypot field (hidden input) on the form, ignored server-side but logged if filled
   (rate limiting is Sprint 4).
8. A11y: fieldsets/legends per attendee, `aria-describedby` for hints, error summary at the top
   with `role="alert"` and focus moved to it, keyboard-only completion, `prefers-reduced-motion`
   step transitions (fade only).

**Acceptance criteria**

- [ ] Without a cookie, only the contacts panel shows — no form, no partial submission.
- [ ] With a cookie, attendee count can never exceed `maxPartySize` in the UI **and** the server
      rejects an over-limit API call made with devtools.
- [ ] Prefill: previously submitted RSVP re-opens with every value restored.
- [ ] Fully usable with keyboard; axe clean; works with JS disabled far enough to show the
      contacts panel and a `<noscript>` message.
- [ ] Step changes never trap focus; back button does not lose data (client state only — no
      navigation).

**Tests**

- E2E `rsvp-web.spec.ts`: full happy path against the seeded e2e guest (submit → success →
  `AttendeeEvent` rows asserted via the DB helper), decline path, cap enforcement, no-guest path
  shows contacts, `RSVP_CLOSED` path (flip deadline via admin/test helper and re-run).
- A11y: axe run on `/rsvp` in both states.

**Exit gate:** `pnpm test:e2e` green including the a11y run; a 390px recording/screenshot set in
`STATUS.md`.

---

## Subphase 2.4 — RSVP confirmation email

**Goal:** the guest gets a durable record; the couple's brand shows up in the inbox.

**Files:** `lib/email/client.ts`, `lib/email/templates/rsvp-confirmation.tsx`,
`lib/email/send.ts`.

**Tasks**

1. `lib/email/client.ts`: Brevo API client from `env`, `sendEmail({ to, subject, react })`
   wrapper that logs failures and never throws to the caller.
2. Template (React Email): monogram/logo from `SITE.brand.logo`, names, "Thank you for your
   response", per-event list with `formatDateWAT`/`formatTimeWAT`, attendee names, meal/dietary
   echo, add-to-calendar link (`NEXT_PUBLIC_SITE_URL`), RSVP contacts, hashtag. Text fallback
   part included (React Email does this; verify).
3. Send on RSVP submit (2.2) when `guest.email` exists. Set `emailSent` accordingly.
4. Subject line: `Your RSVP for Adetolani & Emmanuel — 19 December 2026`.
5. `NOTIFY_EMAIL` (A14): also notify the couple/coordinator of every new RSVP **only when the
   source is WEB and it is the first response** (avoid spam on edits).

**Acceptance criteria**

- [ ] Brevo sends a readable email to an external test recipient; screenshot in `STATUS.md`.
- [ ] Email renders acceptably in Gmail web + iOS Mail (check both, or note which were checked).
- [ ] A Brevo failure never turns a successful RSVP into a 500 (`emailSent: false` path tested).
- [ ] No PII beyond the recipient's own details in the email; no other guests listed.

**Tests**

- Unit: template renders to HTML without throwing (React Email `render()`), contains the event
  title and the correct date string, contains no `undefined`.
- Integration: with `BREVO_API_KEY` mocked at the network boundary, the submit path sets
  `emailSent: true`; when the mock rejects, `emailSent: false` and the RSVP row still exists.

**Exit gate:** `pnpm test` green; one real test-mode email delivered and recorded.

---

## Subphase 2.5 — Admin: RSVP list, manual entry, CSV export (F9, F13)

**Goal:** coordinators can do everything the web form does, from a phone.

**Files:** `app/admin/rsvps/page.tsx`, `app/admin/guests/page.tsx`,
`app/api/admin/rsvps/route.ts`, `app/api/admin/rsvps/[guestId]/route.ts`,
`app/api/admin/rsvps/export/route.ts`, `app/api/admin/guests/route.ts`,
`components/admin/*`.

**Contracts**

```
GET    /api/admin/rsvps?status=&q=&nonResponders=true   → { ok, data: { rows: RsvpListRow[], total } }
PUT    /api/admin/rsvps/[guestId]                       Body: AdminRsvpInput → { ok, data: { status } }
GET    /api/admin/rsvps/export                          → text/csv (Content-Disposition attachment)
GET    /api/admin/guests?q=&side=&page=                 → { ok, data: { rows, total } }
POST   /api/admin/guests                                Body: CreateGuestInput → { ok, data: { guest } }
PATCH  /api/admin/guests/[id]                           Body: partial → { ok, data: { guest } }
GET    /api/admin/guests/[id]/invite                    → { ok, data: { link, whatsappMessage } }
```

Every handler: `requireAdmin()` first (A16), Zod validation, `revalidateSite([...])` after writes
(a guest's party size change affects the public RSVP form), `AuditLog` row for each mutation.

**Tasks**

1. `RsvpListRow`: guest name, status chip, source, headcount per event, responded date, side
   filter (A18 — if the filter is never used by soft launch, drop the `side` column then).
2. "Non-responders" filter = guests with `Rsvp = null` or `status = PENDING`.
3. Manual entry form: identical field set to the public form (attendees, events, meal/dietary,
   song, message) with `source = PHONE | WHATSAPP` selectable; **same server rules**
   (party size, invitations) — the admin path only bypasses the cookie and deadline
   (`allowDeadlineOverride` flag, default true, audited).
4. CSV export: `guest,side,email,phone,status,source,events,attendees,meal,dietary,message,respondedAt`
   via `lib/csv.ts`; UTF-8 BOM so Excel opens it correctly.
5. Guests page: search by name/phone, "copy link" and "copy WhatsApp message" buttons using
   `GET /api/admin/guests/[id]/invite` with `SITE.inviteMessage` template (A17) — clipboard API
   with a fallback select-and-copy on failure (WhatsApp in-app browsers block clipboard).
6. Mobile: table becomes stacked cards below 640px; buttons ≥44px; no horizontal scrolling forms.

**Acceptance criteria**

- [ ] Unauthenticated `GET /api/admin/rsvps` ⇒ 401 envelope (assert in tests).
- [ ] Admin manual entry for a `maxPartySize: 3` guest with 4 attendees is rejected.
- [ ] CSV opens in Excel/Sheets with columns intact when a message contains a comma, quote and
      newline (fixture-driven test).
- [ ] Copy-link button produces `NEXT_PUBLIC_SITE_URL/i/<code>`; copy-WhatsApp produces the
      configured template with name and link substituted.
- [ ] Every mutation writes an `AuditLog` row with `actor` = admin email.

**Tests**

- Integration: RSVP list filters, non-responder logic, CSV escaping fixture, invite link/message
  substitution, guard coverage (A16 test picks up the new files).
- E2E `admin-rsvp.spec.ts`: log in via magic link (read `VerificationToken` from the test DB),
  add a manual RSVP for a seeded guest, verify it appears in the list and in the public
  `/api/session/guest` response for that guest's cookie.

**Exit gate:** e2e green; CSV artifact checked into `STATUS.md` (as text) for review.

---

## Subphase 2.6 — Gifting UI: bank details, funds, declarations (F10)

**Goal:** a gifting hub that works even if Paystack is down.

**Files:** `app/(public)/gift/page.tsx`, `components/sections/GiftTabs.tsx`,
`components/ui/CopyField.tsx`, `components/ui/FundCard.tsx`, `components/ui/GiftForm.tsx`.

**Tasks**

1. `GiftTabs`: two tabs — "Bank transfer" and "Give online" — as real links (`?tab=` in the URL
   so back/forward works) with proper ARIA tab semantics.
2. Bank transfer panel: active `BankAccount` rows (server-rendered from DB via `cached`), each
   field with `CopyField` (account name, number, bank, label) using the clipboard API with a
   manual fallback; a line stating "transfers are confirmed manually by us".
3. "I've sent a transfer" declaration form → `POST /api/gifts/declare`
   (`BankTransferDeclareInput`) → creates `Gift` with `channel = BANK_TRANSFER_DECLARED`,
   `status = PENDING`, no `providerRef`, plus a confirmation screen. Rate-limited in Sprint 4.
   Copy makes clear it does **not** verify the transfer.
4. Online panel: `FundCard` list from the `Fund` table (`isActive`), optional progress
   (`showProgress` + `goalMinor` → percent, only when ≥ 1 goal is met), preset amount buttons
   from `SITE.gift.presetAmountsMinor`, custom amount field (formatted as ₦ live), name, email,
   optional message, anonymous checkbox with an explanation ("your name won't be shown to us in
   reports" — note: it is still visible to the couple in the ledger; word it honestly), submit.
5. Amount input: text input with numeric parsing, `toMinor`, rejects below `minAmountMinor` with
   a clear message; shows the value in kobo nowhere — only `formatNGN`.
6. Empty state: if `Fund` table is empty or no active bank accounts, show a single line
   "Giving details will appear here" — never a crash.
7. A11y: tabs keyboard-navigable, form errors per field, `aria-live` on copy feedback.

**Acceptance criteria**

- [ ] With no active bank accounts and no funds, the page renders a graceful empty state.
- [ ] Copy buttons work on iOS Safari (requires a user gesture — the copy happens inside the
      click handler).
- [ ] Declaring a transfer creates a ledger row that admin can see (verified in 2.7/2.8).
- [ ] Anonymous is reflected in the admin ledger as "Anonymous".

**Tests**

- Unit: amount parsing/formatting edge cases (₦1 000,000 separators, decimals, negative).
- E2E `gift-ui.spec.ts`: tab switching preserves URL state, copy feedback announced, declaration
  creates a `PENDING` `BANK_TRANSFER_DECLARED` row (DB assert).

**Exit gate:** `pnpm test` green.

---

## Subphase 2.7 — Paystack: initialize, webhook, verify, reconcile

**Goal:** payment integrity that satisfies success criterion "zero unreconciled transactions".

**Files:** `lib/paystack.ts` (from §21.2 verbatim + `verifyPaystackSignature`),
`lib/payments.ts` (domain), `app/api/gifts/initialize/route.ts`,
`app/api/gifts/verify/route.ts`, `app/api/webhooks/paystack/route.ts`,
`app/api/gifts/declare/route.ts`, `scripts/reconcile-gifts.ts`.

**Contracts**

```
POST /api/gifts/initialize     Body: GiftInitInput
  200 → { ok, data: { authorizationUrl: string, reference: string } }
  400 VALIDATION · 404 NOT_FOUND (unknown fund) · 409 OUT_OF_RANGE (amount) · 502 PAYSTACK_UNAVAILABLE
GET  /api/gifts/verify?ref=    200 → { ok, data: { status: "PENDING"|"SUCCESS"|"FAILED"|"ABANDONED" } }
                               404 NOT_FOUND · cache: no-store   (status ONLY — §13.1)
POST /api/webhooks/paystack     200 always when signature valid · 401 when invalid
POST /api/gifts/declare         Body: BankTransferDeclareInput → 200 { ok, data: { reference } }
```

**Tasks**

1. `lib/paystack.ts`: exactly §21.2 — `initializeTransaction`, `verifyTransaction`,
   `verifyPaystackSignature` (length-guarded, `Buffer.from(signature, "hex")`). Fail loudly if
   `PAYSTACK_SECRET_KEY` is missing (via `env`, not `!` at call sites — throw a typed config
   error).
2. `reference`: `gift_` + `crypto.randomBytes(16).toString("hex")` (128-bit, §7.2).
3. **Initialize**: validate → load fund (must be `isActive`) → bounds-check amount → create
   `Gift{ status: PENDING, channel: PAYSTACK, reference }` → call Paystack
   `initializeTransaction({ email, amount: amountMinor, reference, callbackUrl:
${NEXT_PUBLIC_SITE_URL}/gift/complete?reference=..., metadata: { fundSlug, guestId? } })`
   → return `authorization_url`.
   - Paystack failure ⇒ mark that `Gift` as `FAILED` with `rawEvent = { stage: "initialize",
reason: "<message>" }` (redacted, §13.2) and return 502 `PAYSTACK_UNAVAILABLE`.
     Ledger shows the attempt; a retry creates a fresh reference (acceptable and auditable).
   - If `guestId` is resolvable from the cookie, attach it; otherwise null.
4. **Webhook** (`app/api/webhooks/paystack/route.ts`):
   ```
   raw  = await req.text()
   sig  = req.headers.get("x-paystack-signature")
   if (!verifyPaystackSignature(raw, sig)) return fail("UNAUTHENTICATED", ...)   // 401
   event = JSON.parse(raw)
   if (event.event !== "charge.success") { log; return ok({ ignored: true }) }    // 200, no retries
   ref = event.data.reference
   gift = findUnique(ref)   → missing: log webhook_reference_unknown; return ok({}) // 200
   if (gift.status === "SUCCESS") return ok({ duplicate: true })                  // idempotent
   remote = await verifyTransaction(ref)                                          // server-side verify
   if (remote.amount !== gift.amountMinor || remote.currency !== gift.currency)
        { log amount_mismatch; persist redacted rawEvent with mismatch flag; notify NOTIFY_EMAIL; return ok({}) }
   if (remote.status !== "success") { mark FAILED/ABANDONED per mapping; return ok({}) }
   update Gift → SUCCESS, providerRef = remote.id, paidAt = now,
                 rawEvent = REDACT(event)   // event, reference, amount, currency, status, ids only
   respond ok({}) then send receipt + couple notification (after())
   ```
   Redaction whitelist: `event`, `data.reference`, `data.amount`, `data.currency`,
   `data.status`, `data.id`, `data.paid_at`. Strip `customer`, `authorization`, `channel`,
   `metadata.card` — enforced by `redactPaystackEvent()` in `lib/payments.ts` with a unit test
   asserting the payer email is absent.
5. **Verify**: look up by `reference`, return `{ status }` only, `cache: no-store`. Unknown ⇒ 404.
   Never return amount, name or fund.
6. **Reconcile script** `scripts/reconcile-gifts.ts` (`pnpm gifts:reconcile`): every `PENDING`
   `PAYSTACK` gift older than 30 minutes → `verifyTransaction` → map
   `success → SUCCESS`, `failed|abandoned|reversed → FAILED/ABANDONED`, `pending → skip`.
   Prints a table (reference, before, after) and exits non-zero if any call errors. Same
   idempotency rules as the webhook. Redacted logging only.
7. `lib/money.ts` unchanged; all amounts compared as integers.

**Acceptance criteria**

- [ ] Signature tests: valid signature accepted; **short** signature ⇒ 401 and no crash (the
      original bug); non-hex signature ⇒ 401; empty header ⇒ 401; signature for a different body
      ⇒ 401.
- [ ] Webhook replayed twice ⇒ one `SUCCESS` row, second returns `{ duplicate: true }`, one
      receipt email.
- [ ] Amount mismatch (simulate by posting an event with a different `data.amount` after the
      signature is computed with the test secret) ⇒ gift stays `PENDING`, an alert email is
      logged, and the response is 200.
- [ ] `/api/gifts/verify` returns only `status`; a fuzz of 100 random refs returns 404 with the
      same body shape every time.
- [ ] `rawEvent` never contains an email or card field (asserted by test).
- [ ] `pnpm gifts:reconcile` transitions a deliberately stale `PENDING` gift correctly.

**Tests**

- Unit: `paystack-signature.test.ts` (the five cases above — write the HMAC with the test secret
  inside the test), `redact.test.ts`, `payments-map.test.ts` (status mapping table).
- Integration `webhook.test.ts`: posts a correctly signed `charge.success` payload to the local
  server (or invokes the handler directly with a crafted `Request`) and asserts DB transitions,
  idempotency, amount mismatch and unknown reference.
- Integration `initialize.test.ts`: with Paystack mocked (fetch stub), asserts a `PENDING` row is
  created **before** the gateway call and that a gateway failure marks it `FAILED`.
- **No live network calls in CI.**

**Exit gate:** all green; the signature suite must include a test named to prove the length-guard
regression is covered.

---

## Subphase 2.8 — `/gift/complete` and the receipt (A9)

**Goal:** the guest always lands on an honest, branded status page — success is never inferred
from the redirect.

**Files:** `app/(public)/gift/complete/page.tsx`, `components/sections/GiftComplete.tsx`
(client), `lib/email/templates/gift-receipt.tsx`.

**State machine (client)**

```
reading → polling(2s, 4s, 8s, 8s, 8s …) → SUCCESS | FAILED | ABANDONED | STILL_PROCESSING
```

- The page is `force-dynamic` and reads nothing sensitive; it renders from `?reference=`.
- Missing/unknown reference ⇒ a generic "We couldn't find that reference" state with the
  contacts panel — never an error stack.
- `STILL_PROCESSING` after ~30s ⇒ "Your payment is being confirmed. We'll email you a receipt
  within a few minutes." Polling stops.
- Reduced motion: no spinner animation (static text), the status is announced via `aria-live="polite"`.
- All four terminal states are designable and reachable in tests.

**Tasks**

1. Build the four states + polling with backoff, aborting on unmount and on the terminal state.
2. `gift-receipt` email: amount `formatNGN`, fund title, reference, "Thank you" copy, from
   `SITE.couple`. Sent only on the `PENDING → SUCCESS` transition (never on replay).
3. Couple notification email: reference, amount, fund, giver name (or "Anonymous"), time — to
   `NOTIFY_EMAIL`.
4. `callback_url` from Paystack lands on `/gift/complete?reference=...` — verify in test mode.

**Acceptance criteria**

- [ ] Simulated slow webhook: page shows processing then flips to success without a reload.
- [ ] A `FAILED` transaction shows an honest failure message with the bank-transfer alternative
      and contacts (no dead end).
- [ ] Double browser tabs on the same success page send no extra emails (email only on
      transition — proven by test).
- [ ] Unknown reference shows the graceful state.

**Tests**

- Unit: `pollBackoff` schedule and terminal-state logic (pure function, no timers in tests).
- E2E `gift-flow.test-mode.spec.ts`: initialise a gift through the UI against Paystack **test
  mode** with a test card (manual step — see exit gate), or, in CI, a mocked variant that drives
  the page states directly. The CI version must cover: success, failure, unknown reference.

**Exit gate:**

- Automated: unit + mocked e2e green.
- Manual (required, recorded): one real test-mode payment with `4084 0840 8408 4081` (or the
  current Paystack test card), webhook received, `Gift` = `SUCCESS`, receipt email delivered,
  reconciliation script reports nothing pending. Attach the Paystack dashboard screenshot.

---

## Subphase 2.9 — Admin gifts ledger (partial F13)

**Goal:** the couple can see and export what came in.

**Files:** `app/admin/gifts/page.tsx`, `app/api/admin/gifts/route.ts`,
`app/api/admin/gifts/export/route.ts`, `app/api/admin/gifts/[id]/route.ts`.

**Tasks**

1. Ledger: reference, date, giver (or Anonymous), fund, amount (`formatNGN`), channel, status
   chip. Filters: status, fund, channel; search by reference/giver.
2. Totals bar: total `SUCCESS` amount, count by status, per-fund breakdown.
3. `PATCH /api/admin/gifts/[id]` — only transition `BANK_TRANSFER_DECLARED`/`PENDING` → `SUCCESS`
   ("mark received") or `PENDING → ABANDONED`; **never** allow editing a `PAYSTACK` `SUCCESS`
   row (403 with a clear message: use the Paystack dashboard). Audited.
4. CSV export of the ledger (same CSV rules as 2.5).
5. Mobile-friendly.

**Acceptance criteria**

- [ ] Attempting to flip a Paystack `SUCCESS` row via the API returns 403 (test).
- [ ] Declared bank transfers can be marked received and are audited.
- [ ] CSV total equals the sum of `SUCCESS` rows (tested with a fixture).

**Tests:** integration (transitions + forbidden transition), e2e extension of `admin-rsvp.spec.ts`
or a new `admin-gifts.spec.ts`.

**Exit gate:** green.

---

## 2.10 Phase exit gate — RSVP and gifting

### Automated evidence

```bash
pnpm lint && pnpm format:check && pnpm typecheck
pnpm test            # unit + integration, all green
pnpm test:e2e        # rsvp-web, gift UI, admin-rsvp, admin-gifts, guest-link, smoke
pnpm build && lhci autorun   # budgets still met
```

Coverage evidence: `lib/rsvp.ts`, `lib/payments.ts`, `lib/paystack.ts` branch coverage listed.

### Manual evidence (recorded in `STATUS.md`)

- [ ] Full RSVP on a real phone from a WhatsApp link, including the confirmation email.
- [ ] Full RSVP through the **phone path**: coordinator enters it in admin; the guest's own link
      then shows the recorded response.
- [ ] One real Paystack **test-mode** payment: dashboard screenshot + `Gift` row + receipt email.
- [ ] Replayed webhook produces no duplicate (dashboard "resend" or re-POST).
- [ ] `pnpm gifts:reconcile` run against the test DB with a stale `PENDING` gift.
- [ ] CSV exports open correctly in Excel and Google Sheets.

### Docs

- [ ] `README.md`: scripts `gifts:reconcile`, env var `NOTIFY_EMAIL` documented.
- [ ] `architecture.md`: confirm §8.2 matches the four shipped endpoints (or amend).
- [ ] `STATUS.md`: decisions (fee handling, amount bounds, collectMeal), evidence, blockers.

**Gate rule:** if the manual test-mode payment did not complete end to end, Phase 3 may still
start (it is independent), but **Sprint 4 may not** — the gate is blocking for launch, not for
gallery work. Record it as a running blocker.
