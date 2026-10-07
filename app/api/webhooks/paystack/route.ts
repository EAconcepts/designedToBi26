import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { formatNGN } from '@/lib/money';
import { verifyPaystackSignature, verifyTransaction } from '@/lib/paystack';
import { mapPaystackStatus, redactPaystackEvent } from '@/lib/payments';
import { sendGiftReceiptEmail, sendGiftNotificationEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  const signature = request.headers.get('x-paystack-signature');
  const rawBody = await request.text();

  // 1. HMAC signature verification
  if (!verifyPaystackSignature(rawBody, signature)) {
    return fail('UNAUTHENTICATED', 'Invalid or missing webhook signature');
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      status?: string;
      id?: number;
      paid_at?: string;
      [key: string]: unknown;
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return fail('VALIDATION', 'Invalid JSON body');
  }

  // 2. Ignore non-charge.success events gracefully
  if (event.event !== 'charge.success' || !event.data?.reference) {
    return ok({ ignored: true });
  }

  const reference = event.data.reference;

  // 3. Find the Gift record
  const gift = await prisma.gift.findUnique({
    where: { reference },
    include: { fund: true },
  });

  if (!gift) {
    console.warn(`[PAYSTACK WEBHOOK]: Unknown reference received: ${reference}`);
    return ok({ unknown: true });
  }

  // 4. Idempotency check: Already processed successfully
  if (gift.status === 'SUCCESS') {
    return ok({ duplicate: true });
  }

  // 5. Server-side remote verification via Paystack API
  let remote: { status: string; amount: number; currency: string; id: number };
  try {
    remote = await verifyTransaction(reference);
  } catch (err) {
    console.error(`[PAYSTACK VERIFY EXCEPTION]: Could not verify reference ${reference}:`, err);
    return ok({ verifyFailed: true });
  }

  // 6. Integrity check: Amount and currency matching
  if (remote.amount !== gift.amountMinor || remote.currency !== gift.currency) {
    console.error(
      `[PAYSTACK AMOUNT MISMATCH]: Expected ${gift.amountMinor} ${gift.currency}, received ${remote.amount} ${remote.currency} for ref ${reference}`,
    );

    await prisma.gift.update({
      where: { id: gift.id },
      data: {
        rawEvent: redactPaystackEvent({ ...event, mismatch: true }),
      },
    });

    return ok({ mismatch: true });
  }

  // 7. Check remote status
  if (remote.status !== 'success') {
    await prisma.gift.update({
      where: { id: gift.id },
      data: {
        status: mapPaystackStatus(remote.status),
        rawEvent: redactPaystackEvent(event),
      },
    });
    return ok({ status: remote.status });
  }

  // 8. Transition to SUCCESS
  const updatedGift = await prisma.gift.update({
    where: { id: gift.id },
    data: {
      status: 'SUCCESS',
      providerRef: String(remote.id),
      paidAt: new Date(),
      rawEvent: redactPaystackEvent(event),
    },
    include: { fund: true },
  });

  // 9. Dispatch emails (non-blocking)
  if (updatedGift.giverEmail) {
    void sendGiftReceiptEmail({
      giverEmail: updatedGift.giverEmail,
      giverName: updatedGift.giverName,
      amountFormatted: formatNGN(updatedGift.amountMinor),
      fundTitle: gift.fund?.title ?? 'Wedding Celebration Gift',
      reference: updatedGift.reference,
      message: updatedGift.message,
    });
  }

  void sendGiftNotificationEmail({
    giverName: updatedGift.isAnonymous ? 'Anonymous' : updatedGift.giverName,
    giverEmail: updatedGift.giverEmail,
    amountFormatted: formatNGN(updatedGift.amountMinor),
    fundTitle: gift.fund?.title ?? 'Wedding Celebration Gift',
    reference: updatedGift.reference,
    channel: 'Paystack',
    message: updatedGift.message,
  });

  return ok({ processed: true });
}
