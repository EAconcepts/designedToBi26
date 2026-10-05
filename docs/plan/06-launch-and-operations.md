# Phase 5 — Launch and operations (6 Nov 2026 → post-wedding)

**Outcome:** invitations go out safely, RSVPs and gifts are collected and reconciled, the wedding
day runs without a deploy, and the site closes out cleanly with data exported and retained per
policy.

Architecture refs: §17 (roadmap), §19 (checklists/runbooks), §13.2 (privacy), §16 (observability).

This phase is **operational**, not a build phase. Entry/exit gates are checklists executed in the
real world; each stage has its own gates so a failure never costs more than one stage.

---

## 5.0 Phase entry gate (all stages)

### Internal

- [ ] Phase 4 exit gate fully satisfied — no open critical/high issues.
- [ ] `STATUS.md` shows a clean blocker list (or every blocker explicitly accepted by the couple).
- [ ] Final `main` build deployed to production and verified within the last 48 hours.

### External

- [ ] Couple's written approval to send invitations.
- [ ] Guest list final (or a first batch of ~20 identified) and every row has a code.
- [ ] WhatsApp message template approved by the couple (§12).
- [ ] A named person is on call for the first 72 hours after each batch.

### Decisions

- [ ] Batch strategy approved: family first, then friends, then colleagues (architecture §17).
- [ ] RSVP deadline confirmed (proposed Sat 5 Dec 2026) — already in `Setting.rsvpDeadline`.

---

## Stage 5.1 — Public launch (Fri 6 Nov 2026)

**Tasks**

1. Final smoke test on production, in this order, on a phone:
   `/` → personalised link → `/rsvp` submit → email received → `/gift` → test-free **live** micro
   payment (₦1,000) → receipt → admin ledger shows it → refund it immediately in the Paystack
   dashboard (document that the row stays `SUCCESS` with an audit note — see 4.4).
2. Verify uptime monitor is green; Sentry is receiving; analytics funnels are counting.
3. Send batch 1 (immediate family, ≤ 30 links) using the admin "Copy WhatsApp message" per guest.
4. Monitor for 24 h.

**Entry gate:** Phase 4 exit gate.
**Exit gate**

- [ ] Batch 1 sent (count recorded); ≥ 5 RSVPs completed within 24 h (evidence: admin list).
- [ ] Zero unresolved errors in Sentry for the window; any issue triaged and either fixed
      (with a regression test) or documented.
- [ ] Payment drill refund visible in the ledger and the gateway.
- [ ] `STATUS.md` updated: launch date, batch counts, RSVP conversion, defects.

---

## Stage 5.2 — Batch sending and monitoring (7 Nov → 5 Dec)

**Tasks**

1. Send remaining batches (20–40 links per batch, ≥ 24 h apart) so problems stay containable.
2. Daily (or every 2 days) checks — use this short routine:
   ```
   - Sentry: new issues?
   - Vercel: 5xx rate, function errors
   - Admin → RSVPs: conversion vs. non-responders
   - Admin → Gifts: any PENDING older than 30 min → pnpm gifts:reconcile
   - Admin → Media: any uploads unexpectedly? (should be none before the window)
   ```
3. Chase non-responders using the admin filter + WhatsApp/phone (the F9 path).
4. Weekly `gifts:reconcile` (daily in the final week) and a running reconciliation note in
   `RUNBOOK.md`.
5. Content changes only through admin/seed/config — **never a direct DB edit in production**
   unless it is an emergency, in which case it is audited and noted.
6. Deployments: allowed but boring. Any deploy after **14 Dec** requires the freeze rules below.

**Entry gate:** Stage 5.1 exit gate.
**Exit gate**

- [ ] All batches sent; every batch's 24 h review recorded.
- [ ] RSVP conversion tracked weekly in `STATUS.md` (target ≥ 80% of households by 5 Dec).
- [ ] Zero unreconciled payments (every `PENDING` older than 30 min explained).
- [ ] No open critical/high defects.

---

## Stage 5.3 — RSVP deadline and final headcount (Sat 5 Dec 2026)

**Tasks**

1. Confirm `Setting.rsvpDeadline` = 5 Dec 2026 end-of-day WAT; test once that a submission after
   it returns `RSVP_CLOSED` and shows the contacts fallback.
2. Final chase: one round of WhatsApp/phone to every non-responder (admin filter).
3. Export final data for the couple:
   ```
   Admin → RSVPs → Export CSV
   Admin → Gifts → Export CSV
   pnpm seed:guests --export   (if implemented) or Prisma Studio query for guests
   ```
   Deliver as three files plus a one-page summary of headcount per event and meal totals.
4. Confirm the headcount with the couple/coordinator for the caterer; manual entries allowed until
   the couple closes it (then flip the deadline if they ask).

**Entry gate:** Stage 5.2 exit gate.
**Exit gate**

- [ ] Deadline enforced and demonstrated.
- [ ] Final CSVs delivered and opened successfully by the couple.
- [ ] Headcount per event confirmed in writing by the couple.
- [ ] RSVP target outcome recorded (≥ 80% or the honest number with context).

---

## Stage 5.4 — Deployment freeze (14–19 Dec 2026)

**Tasks**

1. Announce the freeze: only critical fixes (site down, RSVP broken, payment broken, wrong
   venue/time). Everything else waits until after the wedding.
2. Verify in advance, before the freeze:
   - `LIVE` mode switch works (practise once on 13 Dec, then switch back to `PRE`).
   - Upload window controls and QR code are ready to print.
   - Admin access confirmed on the coordinator's phone (sign-in tested on that device).
   - Runbook shortcuts (rollback, reconcile, mode toggle) reviewed with the coordinator.
   - Fallback content prepared for WhatsApp: bank details image + venue directions image
     (so guests get answers even if the site is down, §19.3).
3. No dependency upgrades, no refactors, no "quick polish".

**Entry gate:** Stage 5.3 exit gate.
**Exit gate**

- [ ] Freeze communicated and dated in `STATUS.md`.
- [ ] Pre-freeze verification list complete (mode toggle practised, QR printed, admin access
      tested on the coordinator's phone, fallback images prepared).

---

## Stage 5.5 — Wedding week and wedding day (15–19 Dec 2026)

**Wedding day runbook (execute in order)**

**T–48 h**

- [ ] Final content check: times, venue pin, live-stream URL (if any), dress code, contacts.
- [ ] Confirm photographer's delivery plan for the `wedding-day` album (date/time, who uploads).
- [ ] Test `/upload/<token>` at home on two devices and networks.

**T–24 h**

- [ ] Set mode to `LIVE` (admin, on a phone). Verify on a private tab: live banner, "today" card,
      guest-moments unlocked, RSVP still open.
- [ ] Upload window: `uploadsOpen = true`, `uploadsCloseAt = 26 Dec 2026`.
- [ ] Regenerate the upload token **now** (not on the day), print the QR codes, place them at the
      reception tables and the entrance. Scan each printed code from a second phone.
- [ ] Confirm the moderator (name from 4.0) has admin access and has practised approving a photo.

**Wedding day (Sat 19 Dec)**

- [ ] Someone with the fallback images is reachable: bank details + directions.
- [ ] Check `/api/health` at 09:00 WAT; confirm Sentry clean.
- [ ] Moderator approves uploads in bulk during breaks (target: queue < 20 items at any time).
- [ ] **No deploys.** Critical fix only, on the freeze rules, with a second pair of eyes.
- [ ] If uploads fail on the venue network: fall back to a shared cloud folder link (prepared in
      advance) and post it to the wedding WhatsApp group.
- [ ] If the site is down: share the fallback images (directions + bank details), roll back via
      Vercel if the fault followed a deploy, and note the incident for post-wedding review.
- [ ] Log notable events (times, incidents, actions) in `STATUS.md` as they happen — memory is
      unreliable on the day.

**Entry gate:** Stage 5.4 exit gate.
**Exit gate**

- [ ] Mode is `LIVE`, uploads window open, QR codes placed and scanned.
- [ ] No unresolved incident, or every incident has a written note with impact and action.
- [ ] At least one guest upload approved during the day (proves the chain live).

---

## Stage 5.6 — Post-wedding (20 Dec 2026 → +4 weeks)

**Tasks**

1. Keep `LIVE` until the highlights are ready; then flip to `POST`:
   - hero becomes "Thank you"; RSVP closed; `wedding-day` album unlocked; countdown becomes the
     married message (mode matrix, Sprint 3 §3.8).
   - Verify every row of the mode matrix on production after the flip.
2. Close the upload window on the agreed date (`uploadsCloseAt`), regenerate the token so stale
   QR codes die, and announce the closing date to guests beforehand.
3. Photographer delivery → `pnpm sync:album wedding-day --dry-run` → review → real sync →
   captions + alt text in admin → flip album to visible (via `POST` mode) → verify on a phone.
4. `pnpm zip:album wedding-day` → send the link to the couple (24 h expiry — resend if expired).
5. Thank-you emails: if a mailing list exists, send the "photos are up" note through Resend
   (respecting rate limits and the recipient opt-in assumption — for a wedding list a single
   BCC-style batch is acceptable; document the approach). Otherwise share via the wedding group.
6. Final exports: RSVP, guests, gifts CSVs (final state), delivered to the couple.
7. Retention clean-up (§13.2), after the agreed period (default 90 days ≈ 19 Mar 2027):
   - delete dietary notes; null every `Gift.rawEvent`; remove guest `email`/`phone` for guests who
     did not RSVP-respond or who request deletion; keep payment records the couple must keep.
   - run as an audited script (`scripts/retention-clean.ts`) with `--dry-run` first, and a
     pre-clean export.
8. Handover: transfer/confirm ownership of domain, Vercel, Neon, Cloudinary, Resend, Paystack,
   GitHub to the couple or a named custodian; rotate secrets that the developer used; document
   what happens to the site after hosting expires (decision from §20.2.10 — keep 6/12/24 months).
9. Archive the repo (a final `docs/HANDOVER.md` summarising accounts, costs, how to turn it off).

**Entry gate:** Stage 5.5 exit gate.
**Exit gate (project complete)**

- [ ] `POST` mode live and verified against the full mode matrix.
- [ ] Wedding-day album published with captions and alt text; zip delivered.
- [ ] Upload window closed; stale QR codes dead.
- [ ] Final CSVs delivered; couple confirms receipt.
- [ ] Retention clean-up executed with `--dry-run` evidence and a pre-clean export retained.
- [ ] Accounts handed over; secrets rotated; `HANDOVER.md` written.
- [ ] `STATUS.md` closed out with the project retrospective: what shipped, what was deferred, what
      the couple would change.
- [ ] Success criteria from architecture §1.2 scored honestly (RSVP %, payment success %, LCP,
      downtime, gallery delivery date).

---

## Operational routines (reference card)

Keep this printed or pinned in the group chat.

| Routine             | When                                  | Command / place                                |
| ------------------- | ------------------------------------- | ---------------------------------------------- |
| Health check        | daily during launch month             | `https://<domain>/api/health`                  |
| Payment reconcile   | daily in final week, weekly otherwise | `pnpm gifts:reconcile`                         |
| Error review        | daily in launch week                  | Sentry → Issues                                |
| Non-responder chase | weekly until 5 Dec                    | Admin → RSVPs → non-responders                 |
| Upload moderation   | event day + week after                | Admin → Media                                  |
| Mode flip           | event day / post-wedding              | Admin → Settings → Mode (confirm modal)        |
| Rollback            | if a deploy breaks prod               | Vercel → Deployments → previous → Promote      |
| DB restore          | data emergency                        | Neon → Branches → restore (RUNBOOK §4.9 steps) |
| Fallback comms      | any outage                            | WhatsApp images: directions + bank details     |

**Escalation:** developer first; couple informed within 30 minutes of any guest-visible issue;
payments issues are always treated as urgent.
