import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getRsvpsRoute } from '@/app/api/admin/rsvps/route';
import { PUT as putRsvpRoute } from '@/app/api/admin/rsvps/[guestId]/route';
import { GET as exportRsvpsRoute } from '@/app/api/admin/rsvps/export/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';
import { makeGuest, makeEvent, makeInvitation, makeRsvp, cleanupTestRows } from '@/tests/factories';

describe('Admin RSVPs API Integration', () => {
  beforeEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/rsvps');
    const res = await getRsvpsRoute(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('filters RSVPs by status, query, and non-responders', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const guest1 = await makeGuest({ displayName: 'Chief Adeyemi', maxPartySize: 2 });
    const guest2 = await makeGuest({ displayName: 'Madam Olufunke', maxPartySize: 2 });
    await makeRsvp(guest1.id, { status: 'ATTENDING' });
    await makeRsvp(guest2.id, { status: 'DECLINED' });
    const guest3 = await makeGuest({ displayName: 'Pending Person', maxPartySize: 1 }); // No RSVP

    // Test non-responders filter
    const reqNonResp = new NextRequest('http://localhost:3000/api/admin/rsvps?nonResponders=true');
    const resNonResp = await getRsvpsRoute(reqNonResp);
    const bodyNonResp = await resNonResp.json();
    expect(bodyNonResp.ok).toBe(true);
    const nonRespIds = bodyNonResp.data.rows.map((r: { guestId: string }) => r.guestId);
    expect(nonRespIds).toContain(guest3.id);
    expect(nonRespIds).not.toContain(guest1.id);
    expect(nonRespIds).not.toContain(guest2.id);

    // Test search filter
    const reqSearch = new NextRequest('http://localhost:3000/api/admin/rsvps?q=Adeyemi');
    const resSearch = await getRsvpsRoute(reqSearch);
    const bodySearch = await resSearch.json();
    expect(bodySearch.ok).toBe(true);
    expect(bodySearch.data.rows).toHaveLength(1);
    expect(bodySearch.data.rows[0].guestName).toBe('Chief Adeyemi');
  });

  it('manual entry enforces party size and creates AuditLog row', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const guest = await makeGuest({ maxPartySize: 2 });
    const event1 = await makeEvent();
    await makeInvitation(guest.id, event1.id);

    // Attempt 3 attendees when maxPartySize is 2 -> should fail
    const overCapReq = new NextRequest(`http://localhost:3000/api/admin/rsvps/${guest.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'PHONE',
        declined: false,
        allowDeadlineOverride: true,
        attendees: [
          { name: 'Person 1', events: [event1.slug] },
          { name: 'Person 2', events: [event1.slug] },
          { name: 'Person 3', events: [event1.slug] },
        ],
      }),
    });

    const overCapRes = await putRsvpRoute(overCapReq, {
      params: Promise.resolve({ guestId: guest.id }),
    });
    expect(overCapRes.status).toBe(409);
    const overCapBody = await overCapRes.json();
    expect(overCapBody.error.code).toBe('PARTY_SIZE_EXCEEDED');

    // Valid manual entry
    const validReq = new NextRequest(`http://localhost:3000/api/admin/rsvps/${guest.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'WHATSAPP',
        declined: false,
        allowDeadlineOverride: true,
        attendees: [
          { name: 'Person 1', events: [event1.slug] },
          { name: 'Person 2', events: [event1.slug] },
        ],
        message: 'Phone confirmation received from guest.',
      }),
    });

    const validRes = await putRsvpRoute(validReq, {
      params: Promise.resolve({ guestId: guest.id }),
    });
    expect(validRes.status).toBe(200);

    // Verify DB & AuditLog
    const rsvpInDb = await prisma.rsvp.findUnique({
      where: { guestId: guest.id },
      include: { attendees: true },
    });
    expect(rsvpInDb?.status).toBe('ATTENDING');
    expect(rsvpInDb?.source).toBe('WHATSAPP');
    expect(rsvpInDb?.attendees).toHaveLength(2);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: guest.id, action: 'RSVP_MANUAL_ENTRY' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actor).toBe('admin@example.com');
  });

  it('exports CSV with UTF-8 BOM and escapes quotes, commas, and newlines', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const guest = await makeGuest({ displayName: 'O\'Connor, "The Great"' });
    await makeRsvp(guest.id, {
      status: 'ATTENDING',
      message: 'Line 1,\nLine 2 with "quotes" and, commas.',
    });

    const req = new NextRequest('http://localhost:3000/api/admin/rsvps/export');
    const res = await exportRsvpsRoute(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain(
      'attachment; filename="rsvps-export.csv"',
    );

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Must start with UTF-8 BOM: 0xEF, 0xBB, 0xBF
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);

    const csvText = new TextDecoder('utf-8').decode(bytes);
    // Must correctly escape the message and name
    expect(csvText).toContain('"O\'Connor, ""The Great"""');
    expect(csvText).toContain('"Line 1,\nLine 2 with ""quotes"" and, commas."');
  });
});
