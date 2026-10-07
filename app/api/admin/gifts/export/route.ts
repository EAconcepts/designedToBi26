import { NextRequest } from 'next/server';
import { handle, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { toCsv } from '@/lib/csv';
import { formatNGN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fund: {
          select: { title: true, slug: true },
        },
      },
    });

    const headers = [
      'reference',
      'date',
      'giver',
      'giverEmail',
      'fund',
      'amountNGN',
      'amountMinor',
      'currency',
      'channel',
      'status',
      'isAnonymous',
      'message',
    ];

    const rows = gifts.map((g) => ({
      reference: g.reference,
      date: g.paidAt ? g.paidAt.toISOString() : g.createdAt.toISOString(),
      giver: g.isAnonymous ? `${g.giverName} (Anonymous to public)` : g.giverName,
      giverEmail: g.giverEmail || '',
      fund: g.fund?.title || 'General',
      amountNGN: formatNGN(g.amountMinor),
      amountMinor: g.amountMinor,
      currency: g.currency,
      channel: g.channel,
      status: g.status,
      isAnonymous: g.isAnonymous ? 'Yes' : 'No',
      message: g.message || '',
    }));

    const csvContent = toCsv(rows, { bom: true, headers });
    const filename = `wedding-gifts-ledger-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  });
}
