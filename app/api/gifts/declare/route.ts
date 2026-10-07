import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { BankTransferDeclareInput } from '@/lib/validation/gift';
import { createGiftReference } from '@/lib/payments';
import { formatNGN } from '@/lib/money';
import { sendGiftNotificationEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON body');
    }

    const input = BankTransferDeclareInput.parse(rawBody);

    // Optional fund lookup
    let fundId: string | null = null;
    let fundTitle = 'General Wedding Gift';

    if (input.fundSlug) {
      const fund = await prisma.fund.findUnique({
        where: { slug: input.fundSlug },
      });
      if (fund && fund.isActive) {
        fundId = fund.id;
        fundTitle = fund.title;
      }
    }

    const reference = createGiftReference();

    const gift = await prisma.gift.create({
      data: {
        fundId,
        giverName: input.giverName,
        giverEmail: input.giverEmail || null,
        amountMinor: input.amountMinor ?? 0,
        currency: 'NGN',
        channel: 'BANK_TRANSFER_DECLARED',
        reference,
        status: 'PENDING',
        message: input.message ?? null,
        isAnonymous: input.isAnonymous,
      },
    });

    // Notify couple/coordinator
    void sendGiftNotificationEmail({
      giverName: input.isAnonymous ? 'Anonymous' : input.giverName,
      giverEmail: input.giverEmail || null,
      amountFormatted: input.amountMinor ? formatNGN(input.amountMinor) : 'Amount not specified',
      fundTitle,
      reference: gift.reference,
      channel: 'Bank Transfer (Declared)',
      message: input.message,
    });

    return ok({
      reference: gift.reference,
    });
  });
}
