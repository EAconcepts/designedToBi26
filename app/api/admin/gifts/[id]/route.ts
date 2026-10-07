import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { AdminUpdateGiftInput } from '@/lib/validation/admin';
import { GiftChannel, GiftStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { id } = await context.params;
    if (!id) {
      return fail('VALIDATION', 'Missing gift ID');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON body');
    }

    const parseResult = AdminUpdateGiftInput.safeParse(body);
    if (!parseResult.success) {
      return fail('VALIDATION', 'Invalid update parameters');
    }

    const { status: targetStatus } = parseResult.data;

    const existingGift = await prisma.gift.findUnique({
      where: { id },
    });

    if (!existingGift) {
      return fail('NOT_FOUND', 'Gift not found');
    }

    // Crucial safety check: Never permit manual mutation of Paystack transactions (§F13)
    if (existingGift.channel === GiftChannel.PAYSTACK) {
      return fail(
        'FORBIDDEN',
        'Paystack transactions cannot be altered in admin. Manage disputes and refunds via the Paystack dashboard.',
        { status: 403 },
      );
    }

    if (existingGift.status === GiftStatus.SUCCESS) {
      return fail('VALIDATION', 'Gift is already marked as verified SUCCESS.', {
        status: 400,
      });
    }

    const updatedGift = await prisma.gift.update({
      where: { id },
      data: {
        status: targetStatus as GiftStatus,
        paidAt: targetStatus === 'SUCCESS' ? new Date() : existingGift.paidAt,
      },
      include: {
        fund: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actor: admin.email,
        action: targetStatus === 'SUCCESS' ? 'GIFT_MARK_RECEIVED' : 'GIFT_ABANDONED',
        entity: 'Gift',
        entityId: id,
        meta: {
          reference: existingGift.reference,
          channel: existingGift.channel,
          amountMinor: existingGift.amountMinor,
          fromStatus: existingGift.status,
          toStatus: targetStatus,
        },
      },
    });

    return ok(updatedGift);
  });
}
