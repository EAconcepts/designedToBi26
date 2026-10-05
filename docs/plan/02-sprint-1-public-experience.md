# Phase 1 — Public experience (Sprint 1)

**Dates:** Sat 10 Oct – Fri 16 Oct 2026
**Outcome:** the complete public site — personalised link, hero, opening sequence, countdown,
story, events, venue, colour of the day, FAQ — on a preview URL, inside the performance and
accessibility budgets, using placeholders for every asset the couple has not yet supplied.

Architecture refs: §3, §9.1, §10. Amendments applied: **A1, A2, A4, A11**.

---

## 1.0 Phase entry gate

### Internal

- [ ] Phase 0 exit gate fully satisfied; evidence in `STATUS.md`.
- [ ] `pnpm verify && pnpm test:e2e` green on `main` before branching.
- [ ] Placeholders exist for every image slot (`public/placeholders/`), so no task waits on assets.

### External

- [ ] Invitation image supplied (or accept the §3.1 magenta placeholder and flag it for Sprint 4).
- [ ] Reception time known **or** the couple explicitly accepts "Time to be announced" (the
      `timeTbc` path must be built either way).
- [ ] Venue pin: if not supplied, the MapCard placeholder path is used (A4) — no blocking.

### Decisions

- [ ] Display font chosen (Cormorant Garamond **or** Fraunces) and body font (Jost **or** Inter);
      recorded in `STATUS.md`. One each — no mixing mid-sprint.
- [ ] Whether the home page has a hero **video** (default: no; poster image only, `SITE.hero.video = null`).

**Blocked ⇒ stop and log it.**

---

## Subphase 1.1 — Home composition and section primitives

**Goal:** the page skeleton from architecture §10.1 exists as real, styled, accessible sections
with placeholder content, so later subphases fill rather than restructure.

**Files:** `components/sections/*`, `app/(public)/page.tsx`, `components/ui/*`.

**Tasks**

1. Build the section shell components (each a server component unless noted):
   `Hero`, `InvitationText`, `StoryTimeline`, `EventsSection`, `VenueSection`,
   `ColourOfDay`, `GalleryTeaser`, `GiftTeaser`, `FaqSection`, `RsvpContacts`, `SiteFooter`.
   Each takes content from `SITE` / DB reads through `lib/cache.ts` — **no hard-coded copy** in JSX.
2. `app/(public)/page.tsx` composes them in §10.1 order, one `<h1>` (the couple's names), section
   `aria-labelledby` wiring, and anchor ids (`#story #events #venue #details #rsvp`).
3. `components/ui/SectionHeading` (eyebrow + title + `GoldRule`), `Container`, `Reveal`
   (client wrapper: Framer `whileInView` fade-up, disabled when `useReducedMotion()`).
4. Mobile-first at 390px; night section (`data-theme="night"`) used for at least one block.
5. **Placeholder routes so no link 404s during the sprint** (they are real pages, later filled):
   `app/(public)/gallery/page.tsx`, `app/(public)/gift/page.tsx`,
   `app/(public)/gift/complete/page.tsx`, `app/(public)/rsvp/page.tsx` (contacts-only state until
   2.3), and `app/(public)/thank-you/page.tsx` (content from `SITE.thankYou` — add that key with
   placeholder copy; used in `POST` mode and after payment). Each renders the public shell, an
   `<h1>`, and a "coming in the next sprint" note **in the source only** — guest-facing copy must
   read as a real, finished page.

**Acceptance criteria**

- [ ] Home renders all sections in order at 390px and 1280px with no layout shift.
- [ ] Every section heading is reachable by anchor; nav links scroll to them.
- [ ] No `console.log`, no `TODO` outside `TODO(content):` markers.
- [ ] Axe on `/` reports 0 serious/critical issues.

**Tests:** `tests/e2e/home-structure.spec.ts` — one `h1`; each anchor target exists; nav links
navigate; `document.querySelectorAll('section').length` matches the expected count.

**Exit gate:** structure test green; screenshot (390px + desktop) in `STATUS.md`.

---

## Subphase 1.2 — Personalised invitation link, cookie and session endpoint

**Goal:** `/i/[code]` identifies a household, personalises the shell, and enforces nothing it
should not (A1).

**Files:** `app/(public)/i/[code]/route.ts`, `app/api/session/guest/route.ts`,
`components/sections/Greeting.tsx`, `components/forms/RsvpPrefillProvider.tsx`,
`lib/validation/session.ts`.

**Contracts**

```ts
// GET /api/session/guest   (cache: no-store)
// 200 → { ok: true, data: { guest: null } }
// 200 → { ok: true, data: { guest: {
//   displayName: string; maxPartySize: number; events: string[];   // invited event slugs
//   greeting: string;                                               // "Dear The Adeyemi Family"
//   rsvp: null | { status: "PENDING"|"ATTENDING"|"DECLINED"; respondedAt: string|null;
//                  attendees: { name, events, meal, dietary }[]; songRequest, message }
// } } }
// Cookie invalid/absent → { guest: null }  (never an error)
```

**Tasks**

1. `GET /i/[code]`:
   - Look up the guest by code. **Failure (unknown code, malformed) behaves identically to
     success-with-no-guest for an outside observer:** redirect to `/` with no query string and no
     differing status/latency signal; do not set a cookie.
   - Success: `setGuestCookie(code)`, `update guest.openedAt = now()` (first touch only — keep the
     earliest value), `redirect("/", RedirectType.replace)` (307).
   - Rate-limited behaviour comes in Sprint 4; for now ensure the handler is `force-dynamic`.
2. `GET /api/session/guest`: `getGuestCode()` → null ⇒ `guest: null`. Otherwise load guest,
   `Invitation` rows, and any `Rsvp` with attendees + events; return the contract above.
   Never return email/phone of the guest to the client.
3. `Greeting.tsx` (client): fetches the session endpoint once on mount; renders the personalised
   line in the InvitationText slot when present; renders nothing (not a skeleton that shifts
   layout — reserve the space with a `min-height`) when absent. `aria-live="polite"`.
4. `RsvpPrefillProvider` (client context): exposes `{ guest, loading, error }` to the RSVP form
   (Sprint 2). Include `maxPartySize` and invited `events` so the form can cap inputs **and** the
   server re-validates.
5. Ensure `/` stays static/ISR: the greeting is a client island; no `cookies()` read in any server
   component on a public route.

**Acceptance criteria**

- [ ] With a valid code: redirected to `/`, cookie set (`HttpOnly`, `Secure` in prod, `SameSite=Lax`),
      greeting shows the household name after hydration.
- [ ] With an invalid code: lands on `/`, **no** cookie, no error message, and a network capture
      shows the same redirect status as a valid one.
- [ ] Cookie value is `<code>.<hmac>`; modifying it in devtools makes `getGuestCode()` return null
      and the session endpoint return `guest: null`.
- [ ] `/` still builds as static (build log shows it prerendered) — verify in `next build` output.
- [ ] A guest's email/phone never appears in the `/api/session/guest` response.

**Tests**

- Unit: `guest-cookie` round-trip already covered (Phase 0); add `session-schema.test.ts` for the
  response contract.
- Integration: `guest-link.test.ts` — unknown code leaves no cookie; valid code sets it;
  `openedAt` keeps its first value across repeats.
- E2E (`tests/e2e/guest-link.spec.ts`): navigate to `/i/<seeded-code>` → URL becomes `/` →
  greeting contains the seeded household name → `context.cookies()` contains `guest`.

**Exit gate:** `pnpm test` + `pnpm test:e2e` green; the three cookie cases demonstrated in the
e2e run.

---

## Subphase 1.3 — Hero, logo reveal and opening sequence

**Goal:** the "gold-foil stationery" first impression, with a hard performance and
reduced-motion contract (F1).

**Files:** `components/sections/Hero.tsx`, `components/motion/OpeningSequence.tsx`,
`components/motion/LogoReveal.tsx`, `components/motion/index.ts`, `hooks/useIntroSeen.ts`.

**Tasks**

1. Hero: `Logo` (size variant), couple names in display type, date line
   "Saturday, 19 December 2026", `Countdown`, primary CTA "RSVP" → `/rsvp`, secondary
   "Directions" → `#venue`, hashtag. Reads `SITE`.
2. `LogoReveal`: `opacity` + `scale` + a gold shimmer mask sweep — **format-agnostic**, no SVG
   path drawing (§3.4). Implemented with `motion.img` and a `maskImage` gradient animation.
3. `OpeningSequence`: envelope + wax-seal → hero, Framer Motion timeline, `next/dynamic`
   (client-only), total ≤ 2.5 s, **skippable** by tapping anywhere or pressing Esc/Enter, plays
   **once per session** (`sessionStorage.wedding_intro = "1"`, guarded by `useIntroSeen`).
4. Reduced motion: `useReducedMotion()` ⇒ no opening sequence at all, no shimmer, static logo,
   immediate content. Also honour the CSS global fallback from Phase 0.
5. Guardrails: animate `transform`/`opacity` only; `will-change` only while running; the sequence
   component unmounts itself after completion; no layout shift when it ends (hero space reserved).
6. Hero image/`SITE.hero.poster`: render poster with explicit dimensions; video path stays off.

**Acceptance criteria**

- [ ] First visit in a fresh tab plays the sequence once; reload in the same tab does not replay.
- [ ] Esc or tap skips instantly; focus is not trapped; content is in the DOM for screen readers
      even during the sequence (or the sequence is `aria-hidden` and content announced after).
- [ ] `prefers-reduced-motion: reduce` ⇒ sequence never starts; logo still visible.
- [ ] Hero route JS stays within budget: `next build` first-load for `/` ≤ 180 KB gzipped
      (record the number) — Framer Motion must be code-split so it is not in the critical path.
- [ ] No CLS from the sequence (Lighthouse CLS ≤ 0.05 on `/`).

**Tests**

- E2E `opening-sequence.spec.ts`: (a) plays once per session, (b) skip works,
  (c) with `reducedMotion: 'reduce'` emulation the sequence never appears and the h1 is visible
  within 1 s.
- Lighthouse local run recorded in `STATUS.md`.

**Exit gate:** all four bullets above evidenced; perf numbers attached.

---

## Subphase 1.4 — Countdown and invitation text

**Goal:** accurate countdown to 19 Dec 2026 11:00 WAT anywhere in the world, and the invitation
wording verbatim from the printed card.

**Files:** `components/sections/Countdown.tsx` (client), `components/sections/InvitationText.tsx`,
`content/site.config.ts` (`invitationText`, `countdownTarget`).

**Tasks**

1. Countdown: target = `2026-12-19T10:00:00Z` (11:00 WAT). Days/Hours/Minutes/Seconds; ticks once
   per second; `useEffect` interval cleaned up; **renders a stable server-rendered initial value**
   (compute from build time or first client paint) to avoid hydration mismatch — never compute
   `Date.now()` in the server render and again on the client.
2. After the target passes: swap to a "We're married!" line driven by mode (PRE/LIVE/POST awareness
   comes in Sprint 3; for now handle only past/future).
3. Reduced motion: no flip/scale animation on digit change, just text.
4. `InvitationText`: renders `SITE.invitationText` paragraphs verbatim (placeholders until the
   couple supplies the wording), `Greeting` slot from 1.2, families line, signature sign-off.

**Acceptance criteria**

- [ ] With the OS timezone set to `America/Los_Angeles` the countdown still targets 11:00 WAT
      (assert in a unit test, not by eye).
- [ ] No hydration warning in the console.
- [ ] Countdown is `aria-live="off"` (avoid per-second announcements) but has a text equivalent
      for screen readers (e.g. `aria-label="Days until the wedding: 74"` updated per minute).

**Tests:** `tests/unit/countdown.test.ts` (target instant, past-target state, TZ independence via
`TZ=` env in the test file); `tests/e2e/home-structure.spec.ts` extended with a countdown presence
assertion.

**Exit gate:** unit + e2e green.

---

## Subphase 1.5 — Our Story timeline

**Goal:** F3, scroll-driven on desktop, cheap on mobile (F3, §10.2).

**Files:** `components/sections/StoryTimeline.tsx`, `components/ui/TimelineItem.tsx`,
`components/motion/ScrollLine.tsx`, `content` story entries via DB `Milestone`.

**Tasks**

1. Data: milestones from the `Milestone` table (seeded from `SITE.story`) read through
   `cached(..., 'milestones', { tags: ['site'] })`.
2. Layout: alternating cards on desktop with a vertical gold rule; stacked with a left rule on
   mobile. Photos from `public/placeholders/` until real ones arrive (`Photo`-style caption + alt).
3. Motion: `useScroll` progress over the section drives the gold line's `scaleY` inside a CSS
   `position: sticky` container (desktop only, ≥ 768px). Mobile: `Reveal` fade-up per item.
   Reduced motion: everything visible immediately, no line animation.
4. Fallback: with JS disabled the timeline must read as a normal ordered list.

**Acceptance criteria**

- [ ] Works with JS off (content visible, semantic order).
- [ ] 60fps-ish: no animated property other than `transform`/`opacity`; scrolling does not jank on
      a throttled CPU (verify via DevTools performance recording, attach trace summary).
- [ ] Reduced motion: all milestones visible, no pinning.
- [ ] Missing photos do not break the layout (placeholder state).

**Tests:** e2e `story.spec.ts` — all milestones in DOM in `sortOrder`, first/last visible after
scroll, `prefers-reduced-motion` variant shows all items without scrolling.

**Exit gate:** `pnpm test:e2e` green.

---

## Subphase 1.6 — Events, add-to-calendar (F4)

**Goal:** both events render correctly with TBC handling and working calendar files (A2).

**Files:** `components/sections/EventsSection.tsx`, `components/ui/EventCard.tsx`,
`app/api/events/[slug]/ics/route.ts`, `components/ui/AddToCalendar.tsx`,
`lib/validation/event.ts`.

**Tasks**

1. `EventsSection` reads events + venue through `cached(..., 'events', { tags: ['site'] })`,
   ordered by `sortOrder`.
2. `EventCard`: title, date (`formatDateWAT`), time (`formatTimeWAT`) **or**
   "Time to be announced" when `timeTbc`, venue name/address, dress code, notes.
3. `GET /api/events/[slug]/ics`:
   - 404 `NOT_FOUND` for unknown slug (uniform).
   - `Content-Type: text/calendar; charset=utf-8`,
     `Content-Disposition: attachment; filename="<slug>.ics"`, `cache-control` set to revalidate
     on content change (tag-based or 1-hour max-age — pick one and note it).
   - Body from `lib/ics.ts`; `timeTbc: true` ⇒ all-day event (§21.5); `LOCATION` = venue name +
     address; `DESCRIPTION` includes the map link and dress code; `URL` = event anchor.
4. `AddToCalendar`: two buttons — Google Calendar URL template
   (`https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=<UTC>&location=...&details=...`)
   and "Download .ics" linking the API route. Client component, `next/dynamic` not required.

**Acceptance criteria**

- [ ] Reception card shows "Time to be announced" and its `.ics` contains `DTSTART;VALUE=DATE`.
- [ ] Solemnization `.ics` downloads, opens in Apple Calendar/Google Calendar without an error,
      and shows 11:00 local **or** correct UTC (verify `DTSTART:20261219T100000Z`).
- [ ] Unknown slug → 404 JSON envelope.
- [ ] Google Calendar link pre-fills title, location and date/time.

**Tests**

- Unit: `ics.test.ts` extended with the exact production event (Solemnization) snapshot.
- Integration: `events-ics.test.ts` — 200 + correct headers for `solemnization`; all-day for
  `reception`; 404 for `nope`.
- E2E: click both calendar buttons; assert the `href`s and that the ICS request returns 200.

**Exit gate:** all green; a manually-opened `.ics` verified on at least one real calendar app
(screenshot in `STATUS.md`).

---

## Subphase 1.7 — Venue, directions and deep links (F5)

**Goal:** guests can get to Methodist Church, Olorunsogo-GeriAlimi without asking anyone.

**Files:** `components/sections/VenueSection.tsx`, `components/ui/MapCard.tsx`,
`components/ui/DeepLinks.tsx`, `lib/deep-links.ts`, `content/site.config.ts`.

**Tasks**

1. `lib/deep-links.ts` — pure functions returning URLs, unit-testable:
   `googleMaps(lat,lng | query)`, `waze(lat,lng)`, `uber(lat,lng)`,
   `bolt(lat,lng)` (return `null` if unsupported so the button hides).
   - Google: `https://www.google.com/maps/search/?api=1&query=<encoded>`
   - Waze: `https://waze.com/ul?ll=<lat>%2C<lng>&navigate=yes` (falls back to query search when no
     pin)
   - Uber: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=..&dropoff[longitude]=..&dropoff[name]=<venue>`
   - Bolt: only if a working format is confirmed on a device; otherwise `null` (A4).
2. `MapCard` (A4): designed poster (venue name, city, gold pin glyph, hairline frame) from a
   placeholder until `Venue.lat/lng` arrive. On tap/Enter, opens a modal (`components/ui/Modal`,
   focus trap, Esc) containing a lazy-loaded OpenStreetMap iframe:
   `https://www.openstreetmap.org/export/embed.html?bbox=..&marker=lat,lng`, plus a "Open in
   maps app" button. No API key anywhere.
3. `VenueSection`: venue name/address/city from the DB `Venue`, `notes` (landmarks, parking),
   travel & accommodation block from `SITE` (placeholder copy until the couple answers
   §20.2.10), `DeepLinks` row of buttons.
4. When `lat/lng` are still null: deep links fall back to a **query search** on the venue name +
   city, and the modal shows the text directions instead of a map. Never render a broken iframe.

**Acceptance criteria**

- [ ] On a real phone (or device emulation with app handlers), Google Maps / Waze / Uber links
      open the respective app or its install page.
- [ ] With `lat/lng == null` everything still works (query fallback, no map iframe).
- [ ] Modal traps focus, closes on Esc and backdrop click, restores focus to the trigger.
- [ ] Axe clean on the venue section.

**Tests**

- Unit: `deep-links.test.ts` — encoding, null-Bolt, query fallback when no pin.
- E2E: `venue.spec.ts` — deep-link `href`s match expected formats; modal opens, traps focus,
  closes with Esc.

**Exit gate:** green tests + the device check recorded (this is the one manual gate in the phase).

---

## Subphase 1.8 — Colour of the day, teasers, FAQ, contacts, footer

**Goal:** F11, F12 and the page ending, all content-driven.

**Files:** `components/sections/ColourOfDay.tsx`, `GalleryTeaser.tsx`, `GiftTeaser.tsx`,
`FaqSection.tsx`, `RsvpContacts.tsx`, `SiteFooter.tsx`, `app/(public)/privacy/page.tsx` (content
finalised), `content/site.config.ts`.

**Tasks**

1. `ColourOfDay`: three swatches (White `#FFFFFF`, Gold `--gold-500`, Magenta `--magenta-600`)
   with accessible labels (colour is never the only signal — name is always shown), guidance copy
   from `SITE.colourGuidance` (add with placeholder text).
2. `GalleryTeaser` / `GiftTeaser`: 2–3 placeholder images + CTA to `/gallery`, `/gift` (pages
   exist as "coming soon" placeholders until Sprints 2/3 — they must not 404).
3. `FaqSection`: `SITE.faq` array (placeholder items marked `TODO(content):`), semantic `<dl>` or
   a list of headings + answers; **no accordion JS required** — if an accordion is used it must be
   `<details>`/`<summary>` (free accessibility, no JS).
4. `RsvpContacts`: the two contacts from `SITE.rsvpContacts` with `tel:` and `wa.me` buttons
   (`https://wa.me/<wa>?text=<encoded intro>`), labelled with the contact's name. Used by the
   footer and by `/rsvp`'s no-code path (Sprint 2).
5. `SiteFooter`: privacy link, hashtag, contacts, monogram, sign-off in the signature font,
   copyright. `data-theme="night"`.
6. `/privacy` final copy: purpose, collected fields, retention (§13.2), contact for
   correction/deletion, payment-record exception.

**Acceptance criteria**

- [ ] Changing `SITE.faq` or `SITE.rsvpContacts` changes the page with no JSX edits.
- [ ] `wa.me` links use the exact configured digits (unit test on the built URL).
- [ ] Placeholder items are visibly marked `TODO(content)` in the source only — nothing ships to
      the guest-facing UI saying "placeholder" or "lorem".

**Tests:** `tests/unit/contacts.test.ts` (wa.me and tel: URL construction, including the encoded
default message); e2e asserting the footer privacy link and both contact buttons exist.

**Exit gate:** `pnpm test` green.

---

## Subphase 1.9 — Performance, accessibility and content-integrity pass

**Goal:** the phase's real exit criteria: budgets met, AA met, no placeholder leakage.

**Tasks**

1. Run Lighthouse (mobile, throttled) on `/`, `/rsvp`, `/gallery`, `/gift` — record scores.
2. Axe run across every public route in e2e (this becomes a permanent CI step).
3. Keyboard pass: tab order follows visual order, focus visible everywhere, skip link works, no
   keyboard trap outside modals (and modals trap correctly).
4. Bundle: assert first-load JS for `/` ≤ 180 KB gzipped via `scripts/check-bundle.mjs`
   (reads `.next/app-build-manifest.json`, gzips chunk files, fails over budget). Add to CI.
5. Image audit: every `<img>` has dimensions and alt; placeholders use `loading="lazy"` except the
   hero.
6. Console audit: zero warnings/errors on every public route in e2e.
7. Content audit: `rg -i "lorem|placeholder|todo|coming soon" app components` returns only
   intentional, reviewed matches.

**Acceptance criteria (phase exit)** — all must be true on the preview URL:

- [ ] Lighthouse mobile: perf ≥ 90, a11y ≥ 95, best-practices ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.05.
- [ ] Axe: 0 serious/critical on `/`, `/rsvp`, `/gift`, `/gallery`, `/thank-you`, `/privacy`.
- [ ] `pnpm check:bundle` ≤ 180 KB for `/`.
- [ ] Device check at 390px on Chrome + Safari emulation: no horizontal scroll, tap targets ≥ 44px.
- [ ] Reduced-motion pass on hero, timeline and reveal animations.

### Automated evidence

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm check:bundle && lhci autorun
```

### Manual evidence

- [ ] Full page screenshot (390px and desktop) in `STATUS.md`.
- [ ] Opening sequence recording (video or 3 screenshots: seal → reveal → hero).
- [ ] Personalised link demonstrated on a real phone inside WhatsApp (send the link to yourself).

### Docs

- [ ] `README.md` scripts section updated with `check:bundle`.
- [ ] `STATUS.md`: scores, screenshots, decisions (font choice, Bolt drop/keep).
