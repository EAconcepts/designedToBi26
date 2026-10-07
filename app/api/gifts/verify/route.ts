import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { formatNGN } from '@/lib/money';
import { verifyTransaction } from '@/lib/paystack';
import { sendGiftReceiptEmail, sendGiftNotificationEmail } from '@/lib/email/send';

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
      include: { fund: true },
    });

    if (!gift) {
      return fail('NOT_FOUND', 'Gift transaction not found');
    }

    let currentStatus = gift.status;

    // Active verification fallback: If transaction is still PENDING on Paystack channel,
    // verify on-demand with Paystack API in case the webhook hasn't arrived or was dropped.
    if (currentStatus === 'PENDING' && gift.channel === 'PAYSTACK') {
      try {
        const remote = await verifyTransaction(reference);
        if (
          remote.status === 'success' &&
          remote.amount === gift.amountMinor &&
          remote.currency === gift.currency
        ) {
          await prisma.gift.update({
            where: { id: gift.id },
            data: {
              status: 'SUCCESS',
              paidAt: new Date(),
              providerRef: String(remote.id),
            },
          });
          currentStatus = 'SUCCESS';

          const fundTitle = gift.fund?.title || 'Wedding Registry';

          // Asynchronously dispatch donor receipt & coordinator notification
          if (gift.giverEmail) {
            void sendGiftReceiptEmail({
              giverEmail: gift.giverEmail,
              giverName: gift.giverName,
              amountFormatted: formatNGN(gift.amountMinor),
              fundTitle,
              reference: gift.reference,
              message: gift.message || undefined,
            });
          }
          void sendGiftNotificationEmail({
            giverName: gift.giverName,
            giverEmail: gift.giverEmail || undefined,
            amountFormatted: formatNGN(gift.amountMinor),
            fundTitle,
            message: gift.message || undefined,
            channel: 'PAYSTACK',
            reference: gift.reference,
          });
        } else if (remote.status === 'failed') {
          await prisma.gift.update({
            where: { id: gift.id },
            data: { status: 'FAILED' },
          });
          currentStatus = 'FAILED';
        } else if (remote.status === 'abandoned') {
          await prisma.gift.update({
            where: { id: gift.id },
            data: { status: 'ABANDONED' },
          });
          currentStatus = 'ABANDONED';
        }
      } catch (err) {
        // Paystack verify error or still pending: fall through to current status
        console.warn(
          `[PAYSTACK VERIFY ON-DEMAND]: ${reference}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // §13.1: Expose status ONLY. Never leak payer identity, amount, or fund.
    const res = ok({ status: currentStatus });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  });
}
