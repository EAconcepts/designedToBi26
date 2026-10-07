import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('ref')?.trim();

    if (!reference) {
      return fail('VALIDATION', 'Payment reference is required');
    }

    const gift = await prisma.gift.findUnique({
      where: { reference },
      select: {
        status: true,
      },
    });

    if (!gift) {
      return fail('NOT_FOUND', 'Gift transaction not found');
    }

    // §13.1: Expose status ONLY. Never leak payer identity, amount, or fund.
    const res = ok({ status: gift.status });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  });
}
