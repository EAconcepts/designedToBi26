import { NextRequest } from 'next/server';
import { handle, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { toCsv } from '@/lib/csv';
import { RsvpStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required');
    }

    const guests = await prisma.guest.findMany({
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

    const headers = [
      'guest',
      'side',
      'email',
      'phone',
      'status',
      'source',
      'events',
      'attendees',
      'meal',
      'dietary',
      'songRequest',
      'message',
      'respondedAt',
    ];

    const rows = guests.map((guest) => {
      const rsvp = guest.rsvp;
      const status = rsvp?.status ?? RsvpStatus.PENDING;
      const attendeesList = (rsvp?.attendees ?? []).map((a) => a.name).join('; ');
      const allEvents = Array.from(
        new Set((rsvp?.attendees ?? []).flatMap((a) => a.events.map((e) => e.event.slug))),
      ).join('; ');
      const meals = (rsvp?.attendees ?? [])
        .map((a) => a.meal)
        .filter(Boolean)
        .join('; ');
      const dietaries = (rsvp?.attendees ?? [])
        .map((a) => a.dietary)
        .filter(Boolean)
        .join('; ');

      return {
        guest: guest.displayName,
        side: guest.side,
        email: guest.email ?? '',
        phone: guest.phone ?? '',
        status,
        source: rsvp?.source ?? '',
        events: allEvents,
        attendees: attendeesList,
        meal: meals,
        dietary: dietaries,
        songRequest: rsvp?.songRequest ?? '',
        message: rsvp?.message ?? '',
        respondedAt: rsvp?.respondedAt?.toISOString() ?? '',
      };
    });

    const csvContent = toCsv(rows, { bom: true, headers });

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvps-export.csv"',
        'Cache-Control': 'no-store',
      },
    });
  });
}
