import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { AdminRsvpInput } from '@/lib/validation/rsvp';
import { submitRsvpTransaction } from '@/lib/rsvp';
import { getSettingsUncached } from '@/lib/settings';
import { isBeforeDeadline } from '@/lib/datetime';
import { revalidateSite } from '@/lib/cache';
import { RsvpStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ guestId: string }> },
): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { guestId } = await context.params;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON payload');
    }

    const bodyObj = typeof rawBody === 'object' && rawBody !== null ? rawBody : {};
    const input = AdminRsvpInput.parse({ ...bodyObj, guestId });

    const [guest, settings] = await Promise.all([
      prisma.guest.findUnique({
        where: { id: guestId },
        include: {
          invitations: {
            include: { event: true },
          },
        },
      }),
      getSettingsUncached(),
    ]);

    if (!guest) {
      return fail('NOT_FOUND', 'Guest not found');
    }

    // Deadline check (bypassed if allowDeadlineOverride is true)
    if (!input.allowDeadlineOverride) {
      if (settings?.mode === 'POST') {
        return fail('RSVP_CLOSED', 'Wedding celebration has concluded.');
      }
      if (settings?.rsvpDeadline && !isBeforeDeadline(new Date(), settings.rsvpDeadline)) {
        return fail('RSVP_CLOSED', 'The RSVP deadline has passed.');
      }
    }

    // Party size check
    if (!input.declined && input.attendees.length > guest.maxPartySize) {
      return fail(
        'PARTY_SIZE_EXCEEDED',
        `Guest max party size is ${guest.maxPartySize}, but received ${input.attendees.length} attendees.`,
      );
    }

    // Invited events check
    const invitedEventSlugs = new Set(guest.invitations.map((i) => i.event.slug));
    const eventSlugToId = new Map<string, string>();
    for (const inv of guest.invitations) {
      eventSlugToId.set(inv.event.slug, inv.event.id);
    }

    if (!input.declined) {
      for (const att of input.attendees) {
        for (const evSlug of att.events) {
          if (!invitedEventSlugs.has(evSlug)) {
            return fail('NOT_INVITED', `Guest is not invited to event "${evSlug}".`);
          }
        }
      }
    }

    const finalStatus = input.declined ? RsvpStatus.DECLINED : RsvpStatus.ATTENDING;

    await prisma.$transaction(async (tx) => {
      await submitRsvpTransaction(tx, {
        guestId: guest.id,
        status: finalStatus,
        source: input.source,
        songRequest: input.songRequest ?? null,
        message: input.message ?? null,
        attendees: input.declined ? [] : input.attendees,
        eventSlugToId,
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'RSVP_MANUAL_ENTRY',
          entity: 'Rsvp',
          entityId: guest.id,
          meta: {
            source: input.source,
            status: finalStatus,
            attendeeCount: input.declined ? 0 : input.attendees.length,
            allowDeadlineOverride: input.allowDeadlineOverride,
          },
        },
      });
    });

    await revalidateSite(['/rsvp', '/admin/rsvps', '/admin/guests']);

    const response = ok({ status: finalStatus });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}
