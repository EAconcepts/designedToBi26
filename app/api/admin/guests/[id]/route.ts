import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { UpdateGuestInput } from '@/lib/validation/admin';
import { revalidateSite } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { id } = await context.params;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON payload');
    }

    const input = UpdateGuestInput.parse(rawBody);

    const existing = await prisma.guest.findUnique({
      where: { id },
      include: { invitations: true },
    });

    if (!existing) {
      return fail('NOT_FOUND', 'Guest not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If eventSlugs is provided, replace invitations
      if (input.eventSlugs) {
        const events = await tx.event.findMany({
          where: { slug: { in: input.eventSlugs } },
          select: { id: true },
        });

        await tx.invitation.deleteMany({
          where: { guestId: id },
        });

        await tx.invitation.createMany({
          data: events.map((e) => ({
            guestId: id,
            eventId: e.id,
          })),
        });
      }

      const guest = await tx.guest.update({
        where: { id },
        data: {
          displayName: input.displayName,
          email:
            input.email !== undefined
              ? input.email
                ? input.email.toLowerCase()
                : null
              : undefined,
          phone: input.phone !== undefined ? input.phone || null : undefined,
          side: input.side,
          maxPartySize: input.maxPartySize,
        },
        include: {
          invitations: {
            include: { event: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'GUEST_UPDATE',
          entity: 'Guest',
          entityId: id,
          meta: {
            displayName: guest.displayName,
            maxPartySize: guest.maxPartySize,
          },
        },
      });

      return guest;
    });

    await revalidateSite(['/rsvp', '/admin/guests', '/admin/rsvps']);

    const response = ok({ guest: updated });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { id } = await context.params;

    const existing = await prisma.guest.findUnique({
      where: { id },
    });

    if (!existing) {
      return fail('NOT_FOUND', 'Guest not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.guest.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'GUEST_DELETE',
          entity: 'Guest',
          entityId: id,
          meta: {
            displayName: existing.displayName,
          },
        },
      });
    });

    await revalidateSite(['/rsvp', '/admin/guests', '/admin/rsvps']);

    const response = ok({ deleted: true });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}
