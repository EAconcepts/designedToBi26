# Operations Runbook

**Project:** Adetolani Esther & Abiodun Emmanuel Wedding Website (`#designedToBi'26`)  
**Status:** Skeleton (Sprint 0) · Detailed operational drills delivered in Sprint 4  
**Reference:** Architecture §19.2–19.4

---

## 1. Emergency Contacts & Access

| Role                 | Name             | Channel                  | Responsibility                                                 |
| :------------------- | :--------------- | :----------------------- | :------------------------------------------------------------- |
| **Lead Developer**   | Emmanuel         | WhatsApp / Phone         | Technical escalations, deployment, rollbacks, database restore |
| **Groom**            | Abiodun Emmanuel | WhatsApp / Phone         | Administrative decisions, vendor queries                       |
| **Bride**            | Adetolani Esther | WhatsApp / Phone         | Brand/copy approval, wedding timeline                          |
| **RSVP Coordinator** | Shola Mass       | `09026892898` / WhatsApp | Offline guest RSVP queries                                     |
| **RSVP Coordinator** | Adeola           | `08136437963` / WhatsApp | Offline guest RSVP queries                                     |

---

## 2. Runbook: Payment Issue (§19.2)

1. **Locate transaction:** Search the transaction `reference` in the Paystack Dashboard.
2. **Reconciliation (Paid but still `PENDING`):**
   - Replay the webhook event directly from the Paystack Dashboard.
   - Or run the CLI reconciliation script: `pnpm gifts:reconcile` (available in Sprint 2).
3. **Duplicate charges:**
   - Confirm exactly one gift record exists with `SUCCESS`.
   - Refund the extra charge(s) directly via Paystack Dashboard.
4. **Audit trail:** Record resolution details and rationale in the administrative audit log.

---

## 3. Runbook: Site Down or Slow / Rollback (§19.3)

1. **Platform status:**
   - Check [Vercel Status](https://www.vercel-status.com/) and inspect the latest deployment logs.
   - Check [Neon Status](https://neonstatus.com/) and verify compute connection limits.
2. **Instant rollback:**
   - In Vercel Project Dashboard: navigate to **Deployments** → locate previous stable deployment → select **Instant Rollback**.
   - For database issues, utilize Neon Point-in-Time Restore (PITR) to revert to the pre-incident timestamp.
3. **Motion / Performance mitigation:**
   - If low-end devices crash during opening animations, toggle sequence off in `content/site.config.ts`.
4. **Guest communication fallback:**
   - Distribute direct bank transfer account details and landmark directions directly to guests via WhatsApp broadcasts.

---

## 4. Runbook: Wedding Day Operations (§19.4)

1. **Onsite administrative lead:** Ensure a designated coordinator has `/admin` authenticated on their mobile device.
2. **Venue network check:** Test the `/upload/[token]` QR upload route on the venue's local cellular networks prior to the ceremony.
3. **Network fallback:** If mobile networks struggle, switch the QR target to a shared Google Photos / Cloud folder fallback.
4. **Live moderation:** Admins batch-approve photos in `/admin/media` during reception intervals.
