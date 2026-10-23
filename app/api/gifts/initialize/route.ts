import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { SITE } from '@/content/site.config';
import { GiftInitInput } from '@/lib/validation/gift';
import { getGuestId } from '@/lib/guest-cookie';
import { createGiftReference } from '@/lib/payments';
import { initializeTransaction } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON body');
    }

    const input = GiftInitInput.parse(rawBody);

    // 1. Validate Fund exists and is active
    const fund = await prisma.fund.findUnique({
      where: { slug: input.fundSlug },
    });

    if (!fund || !fund.isActive) {
      return fail('NOT_FOUND', 'The selected fund is not active or could not be found.');
    }

    // 2. Validate amount limits against site config
    if (
      input.amountMinor < SITE.gift.minAmountMinor ||
      input.amountMinor > SITE.gift.maxAmountMinor
    ) {
      return fail(
        'VALIDATION',
        `Gift amount must be between ₦${(SITE.gift.minAmountMinor / 100).toLocaleString('en-NG')} and ₦${(SITE.gift.maxAmountMinor / 100).toLocaleString('en-NG')}.`,
        { status: 409 },
      );
    }

    // 3. Resolve optional guest association
    const guestId = getGuestId(request);
    const guest = guestId
      ? await prisma.guest.findUnique({
          where: { id: guestId },
          select: { id: true },
        })
      : null;

    const reference = createGiftReference();

    // 4. Create PENDING Gift record BEFORE calling gateway
    const gift = await prisma.gift.create({
      data: {
        fundId: fund.id,
        guestId: guest?.id ?? null,
        giverName: input.giverName,
        giverEmail: input.giverEmail,
        amountMinor: input.amountMinor,
        currency: 'NGN',
        channel: 'PAYSTACK',
        reference,
        status: 'PENDING',
        message: input.message ?? null,
        isAnonymous: input.isAnonymous,
      },
    });

    // 5. Initialize with Paystack
    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const callbackUrl = `${siteUrl}/gift/complete?reference=${encodeURIComponent(reference)}`;

    try {
      const paystackData = await initializeTransaction({
        email: input.giverEmail,
        amountMinor: input.amountMinor,
        reference,
        callbackUrl,
        metadata: {
          fundSlug: fund.slug,
          giftId: gift.id,
          guestId: guest?.id,
        },
      });

      return ok({
        authorizationUrl: paystackData.authorization_url,
        reference,
      });
    } catch (err) {
      console.error('[PAYSTACK INITIALIZE ERROR]:', err);

      await prisma.gift.update({
        where: { id: gift.id },
        data: {
          status: 'FAILED',
          rawEvent: {
            stage: 'initialize',
            reason: err instanceof Error ? err.message : 'Unknown gateway error',
          },
        },
      });

      return fail(
        'PAYSTACK_UNAVAILABLE',
        'Payment gateway is temporarily unavailable. Please consider making a direct bank transfer.',
      );
    }
  });
}
