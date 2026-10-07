import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { AdminRsvpQueryInput, type RsvpListRow } from '@/lib/validation/admin';
import { RsvpStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export type { RsvpListRow };

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const { searchParams } = new URL(request.url);
    const parseResult = AdminRsvpQueryInput.safeParse({
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
      nonResponders: searchParams.get('nonResponders') || undefined,
    });

    if (!parseResult.success) {
      return fail('VALIDATION', 'Invalid query parameters');
    }

    const { status, q, nonResponders } = parseResult.data;

    const where: Prisma.GuestWhereInput = {};

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (nonResponders) {
      where.OR = [...(where.OR || []), { rsvp: null }, { rsvp: { status: RsvpStatus.PENDING } }];
    } else if (status) {
      if (status === RsvpStatus.PENDING) {
        where.OR = [...(where.OR || []), { rsvp: null }, { rsvp: { status: RsvpStatus.PENDING } }];
      } else {
        where.rsvp = { status };
      }
    }

    const guests = await prisma.guest.findMany({
      where,
      orderBy: { displayName: 'asc' },
      include: {
        rsvp: {
          include: {
            attendees: {
              include: {
                events: {
                  include: {
                    event: { select: { slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const rows: RsvpListRow[] = guests.map((guest) => {
      const rsvp = guest.rsvp;
      const statusValue = rsvp ? rsvp.status : RsvpStatus.PENDING;
      const attendees = (rsvp?.attendees ?? []).map((att) => ({
        name: att.name,
        events: att.events.map((e) => e.event.slug),
        meal: att.meal,
        dietary: att.dietary,
      }));

      const headcountByEvent: Record<string, number> = {};
      if (statusValue === RsvpStatus.ATTENDING) {
        for (const att of attendees) {
          for (const evSlug of att.events) {
            headcountByEvent[evSlug] = (headcountByEvent[evSlug] || 0) + 1;
          }
        }
      }

      return {
        guestId: guest.id,
        guestName: guest.displayName,
        side: guest.side,
        email: guest.email,
        phone: guest.phone,
        status: statusValue,
        source: rsvp?.source ?? null,
        maxPartySize: guest.maxPartySize,
        headcount: statusValue === RsvpStatus.ATTENDING ? attendees.length : 0,
        headcountByEvent,
        respondedAt: rsvp?.respondedAt?.toISOString() ?? null,
        attendees,
        songRequest: rsvp?.songRequest ?? null,
        message: rsvp?.message ?? null,
      };
    });

    const response = ok({ rows, total: rows.length });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  });
}
