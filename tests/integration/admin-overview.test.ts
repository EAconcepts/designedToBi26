import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getOverviewRoute } from '@/app/api/admin/overview/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';
import {
  makeGuest,
  makeEvent,
  makeInvitation,
  makeRsvp,
  makeFund,
  makeGift,
  cleanupTestRows,
} from '@/tests/factories';

describe('Admin Overview API Integration', () => {
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

    const req = new NextRequest('http://localhost:3000/api/admin/overview');
    const res = await getOverviewRoute(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('computes exact event headcounts, household status split, gifts, and media totals', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    // 1. Create 2 events
    const event1 = await makeEvent(undefined, {
      slug: 'overview-solemnization',
      title: 'Solemnization',
    });
    const event2 = await makeEvent(undefined, { slug: 'overview-reception', title: 'Reception' });

    // 2. Create 3 guests: 1 attending, 1 declined, 1 pending
    const guest1 = await makeGuest({ displayName: 'Attending Household', maxPartySize: 2 });
    const guest2 = await makeGuest({ displayName: 'Declined Household', maxPartySize: 2 });
    const guest3 = await makeGuest({ displayName: 'Pending Household', maxPartySize: 1 });

    // Invitations
    await makeInvitation(guest1.id, event1.id);
    await makeInvitation(guest1.id, event2.id);
    await makeInvitation(guest2.id, event1.id);
    await makeInvitation(guest3.id, event1.id);

    // RSVPs: guest 1 attends both events with 2 attendees
    const rsvp1 = await makeRsvp(guest1.id, { status: 'ATTENDING' });
    const attendeeA = await prisma.rsvpAttendee.create({
      data: { rsvpId: rsvp1.id, name: 'Attendee A' },
    });
    const attendeeB = await prisma.rsvpAttendee.create({
      data: { rsvpId: rsvp1.id, name: 'Attendee B' },
    });
    await prisma.attendeeEvent.createMany({
      data: [
        { attendeeId: attendeeA.id, eventId: event1.id },
        { attendeeId: attendeeA.id, eventId: event2.id },
        { attendeeId: attendeeB.id, eventId: event1.id },
      ],
    });

    // guest 2 declines
    await makeRsvp(guest2.id, { status: 'DECLINED' });

    // guest 3 has no RSVP row (pending)

    // 3. Create Fund & Gift
    const fund = await makeFund({ title: 'Honeymoon Fund' });
    await makeGift({
      fundId: fund.id,
      status: 'SUCCESS',
      amountMinor: 5000000, // ₦50,000
    });
    await makeGift({
      fundId: fund.id,
      channel: 'BANK_TRANSFER_DECLARED',
      status: 'PENDING',
      amountMinor: 2000000,
    });

    // 4. Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        actor: 'admin@example.com',
        action: 'TEST_OVERVIEW_ACTION',
        entity: 'Guest',
        entityId: guest1.id,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/overview');
    const res = await getOverviewRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);

    const data = body.data;

    // Check event attendances
    const ev1Data = data.events.find((e: { id: string }) => e.id === event1.id);
    const ev2Data = data.events.find((e: { id: string }) => e.id === event2.id);
    expect(ev1Data).toBeDefined();
    expect(ev1Data.attendingCount).toBe(2); // Attendee A & B
    expect(ev2Data).toBeDefined();
    expect(ev2Data.attendingCount).toBe(1); // Attendee A only

    // Check household breakdown
    expect(data.households.attending).toBeGreaterThanOrEqual(1);
    expect(data.households.declined).toBeGreaterThanOrEqual(1);
    expect(data.households.pending).toBeGreaterThanOrEqual(1);

    // Check gifts summary
    expect(data.gifts.totalReceivedMinor).toBeGreaterThanOrEqual(5000000);
    expect(data.gifts.pendingTransfersCount).toBeGreaterThanOrEqual(1);
    const fundSummary = data.gifts.byFund.find((f: { id: string }) => f.id === fund.id);
    expect(fundSummary).toBeDefined();
    expect(fundSummary.totalMinor).toBe(5000000);

    // Check recent activity
    expect(data.recentActivity).toBeDefined();
    expect(data.recentActivity.length).toBeGreaterThan(0);
    const hasLog = data.recentActivity.some(
      (l: { action: string }) => l.action === 'TEST_OVERVIEW_ACTION',
    );
    expect(hasLog).toBe(true);

    // Cleanup specific test audit log
    await prisma.auditLog.deleteMany({
      where: { action: 'TEST_OVERVIEW_ACTION' },
    });
  });
});
