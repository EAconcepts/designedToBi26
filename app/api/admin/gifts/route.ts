import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { AdminGiftQueryInput } from '@/lib/validation/admin';
import { GiftStatus, GiftChannel, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { searchParams } = new URL(request.url);
    const parseResult = AdminGiftQueryInput.safeParse({
      status: searchParams.get('status') || undefined,
      fund: searchParams.get('fund') || undefined,
      channel: searchParams.get('channel') || undefined,
      q: searchParams.get('q') || undefined,
    });

    if (!parseResult.success) {
      return fail('VALIDATION', 'Invalid query parameters');
    }

    const { status, fund, channel, q } = parseResult.data;

    const where: Prisma.GiftWhereInput = {};

    if (status) {
      where.status = status as GiftStatus;
    }

    if (channel) {
      where.channel = channel as GiftChannel;
    }

    if (fund) {
      where.fund = {
        OR: [{ id: fund }, { slug: fund }],
      };
    }

    if (q) {
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { giverName: { contains: q, mode: 'insensitive' } },
        { giverEmail: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [gifts, totalSuccessAggregate, statusGroupCounts, fundAggregates] = await Promise.all([
      prisma.gift.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          fund: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.gift.aggregate({
        _sum: { amountMinor: true },
        where: { status: GiftStatus.SUCCESS },
      }),
      prisma.gift.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.fund.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          goalMinor: true,
          gifts: {
            where: { status: GiftStatus.SUCCESS },
            select: { amountMinor: true },
          },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      SUCCESS: 0,
      PENDING: 0,
      FAILED: 0,
      ABANDONED: 0,
    };
    for (const group of statusGroupCounts) {
      statusCounts[group.status] = group._count.id;
    }

    const fundBreakdown = fundAggregates.map((f) => {
      const verifiedMinor = f.gifts.reduce((acc, g) => acc + g.amountMinor, 0);
      return {
        id: f.id,
        slug: f.slug,
        title: f.title,
        goalMinor: f.goalMinor,
        verifiedMinor,
        giftCount: f.gifts.length,
      };
    });

    return ok({
      gifts,
      stats: {
        totalSuccessMinor: totalSuccessAggregate._sum.amountMinor ?? 0,
        totalCount: gifts.length,
        statusCounts,
        fundBreakdown,
      },
    });
  });
}
