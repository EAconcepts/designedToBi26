import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getGuestCode } from '@/lib/guest-cookie';
import type { GuestSession } from '@/lib/validation/session';

export const dynamic = 'force-dynamic';

function noStore(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest): Promise<Response> {
  const code = getGuestCode(request);
  if (!code) return noStore(ok({ guest: null }));

  const guest = await prisma.guest.findUnique({
    where: { code },
    include: {
      invitations: { include: { event: { select: { slug: true } } } },
      rsvp: {
        include: {
          attendees: { include: { events: { include: { event: { select: { slug: true } } } } } },
        },
      },
    },
  });
  if (!guest) return noStore(ok({ guest: null }));

  const data: GuestSession = {
    displayName: guest.displayName,
    maxPartySize: guest.maxPartySize,
    events: guest.invitations.map((invitation) => invitation.event.slug),
    greeting: `Dear ${guest.displayName}`,
    rsvp: guest.rsvp
      ? {
          status: guest.rsvp.status,
          respondedAt: guest.rsvp.respondedAt?.toISOString() ?? null,
          attendees: guest.rsvp.attendees.map((attendee) => ({
            name: attendee.name,
            events: attendee.events.map((event) => event.event.slug),
            meal: attendee.meal,
            dietary: attendee.dietary,
          })),
          songRequest: guest.rsvp.songRequest,
          message: guest.rsvp.message,
        }
      : null,
  };
  return noStore(ok({ guest: data }));
}
