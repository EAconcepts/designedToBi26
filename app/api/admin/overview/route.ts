import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    // 1. Events & Attendance Breakdown
    const events = await prisma.event.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        venue: { select: { name: true } },
        _count: { select: { invitations: true } },
      },
    });

    const attendingByEvent = await prisma.attendeeEvent.groupBy({
      by: ['eventId'],
      where: {
        attendee: {
          rsvp: {
            status: 'ATTENDING',
          },
        },
      },
      _count: {
        attendeeId: true,
      },
    });

    const attendingMap = Object.fromEntries(
      attendingByEvent.map((item) => [item.eventId, item._count.attendeeId]),
    );

    const eventSummaries = events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      venueName: e.venue.name,
      invitedCount: e._count.invitations,
      attendingCount: attendingMap[e.id] ?? 0,
    }));

    // 2. Household RSVP Status Breakdown
    const totalGuests = await prisma.guest.count();
    const rsvpsByStatus = await prisma.rsvp.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const rsvpMap = Object.fromEntries(rsvpsByStatus.map((item) => [item.status, item._count.id]));

    const attendingHouseholds = rsvpMap.ATTENDING ?? 0;
    const declinedHouseholds = rsvpMap.DECLINED ?? 0;
    const pendingHouseholds = totalGuests - (attendingHouseholds + declinedHouseholds);

    // 3. Meals Breakdown
    const mealsGroup = await prisma.rsvpAttendee.groupBy({
      by: ['meal'],
      where: {
        rsvp: { status: 'ATTENDING' },
        meal: { not: null },
      },
      _count: { id: true },
    });

    const meals = mealsGroup.map((m) => ({
      meal: m.meal ?? 'Standard',
      count: m._count.id,
    }));

    // 4. Gifts Summary
    const funds = await prisma.fund.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const giftsByFund = await prisma.gift.groupBy({
      by: ['fundId'],
      where: { status: 'SUCCESS' },
      _sum: { amountMinor: true },
      _count: { id: true },
    });

    const fundGiftMap = new Map(
      giftsByFund.map((g) => [g.fundId, { sum: g._sum.amountMinor ?? 0, count: g._count.id }]),
    );

    const totalGiftSuccess = await prisma.gift.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amountMinor: true },
      _count: { id: true },
    });

    const pendingBankTransfersCount = await prisma.gift.count({
      where: {
        channel: 'BANK_TRANSFER_DECLARED',
        status: 'PENDING',
      },
    });

    // 5. Media Counts
    const pendingPhotosCount = await prisma.photo.count({
      where: { status: 'PENDING' },
    });
    const approvedPhotosCount = await prisma.photo.count({
      where: { status: 'APPROVED' },
    });

    // 6. Recent Activity (last 10 entries from AuditLog)
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actor: true,
        action: true,
        entity: true,
        entityId: true,
        meta: true,
        createdAt: true,
      },
    });

    return ok({
      events: eventSummaries,
      households: {
        total: totalGuests,
        attending: attendingHouseholds,
        declined: declinedHouseholds,
        pending: pendingHouseholds,
        nonResponders: pendingHouseholds,
      },
      meals,
      gifts: {
        totalReceivedMinor: totalGiftSuccess._sum.amountMinor ?? 0,
        totalCount: totalGiftSuccess._count.id ?? 0,
        pendingTransfersCount: pendingBankTransfersCount,
        byFund: funds.map((f) => ({
          id: f.id,
          slug: f.slug,
          title: f.title,
          goalMinor: f.goalMinor,
          totalMinor: fundGiftMap.get(f.id)?.sum ?? 0,
          count: fundGiftMap.get(f.id)?.count ?? 0,
        })),
      },
      media: {
        pendingCount: pendingPhotosCount,
        approvedCount: approvedPhotosCount,
        totalCount: pendingPhotosCount + approvedPhotosCount,
      },
      recentActivity: recentActivity.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  });
}
