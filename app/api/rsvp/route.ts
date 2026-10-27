import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { getGuestId, setGuestCookie } from '@/lib/guest-cookie';
import { getSettingsUncached } from '@/lib/settings';
import { OpenRsvpInput } from '@/lib/validation/rsvp';
import { evaluateRsvpRules, submitRsvpTransaction } from '@/lib/rsvp';
import { SITE } from '@/content/site.config';
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const THROTTLE_MAX_NEW_GUESTS = 10;

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}

function hashIp(ip: string): string {
  return createHmac('sha256', env.server.GUEST_COOKIE_SECRET)
    .update(`ip:${ip}`)
    .digest('hex')
    .slice(0, 32);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    // 1. Parse request JSON body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail('VALIDATION', 'Invalid JSON payload', {
        fields: { root: ['Malformed or invalid JSON'] },
      });
    }

    if (!rawBody || typeof rawBody !== 'object') {
      return fail('VALIDATION', 'Invalid JSON payload', {
        fields: { root: ['Payload must be an object'] },
      });
    }

    const input = OpenRsvpInput.parse(rawBody);

    // 2. Load settings, events, and the session guest (if any)
    const sessionGuestId = input.newResponse ? null : getGuestId(request);
    const [settings, events, sessionGuest] = await Promise.all([
      getSettingsUncached(),
      prisma.event.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true },
      }),
      sessionGuestId
        ? prisma.guest.findUnique({
            where: { id: sessionGuestId },
            include: {
              rsvp: { select: { id: true, respondedAt: true } },
              invitations: { include: { event: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    // 3. Evaluate server-side business rules
    const invitations = sessionGuest?.invitations ?? events.map((event) => ({ event }));
    const evalResult = evaluateRsvpRules({
      input,
      guest: {
        id: sessionGuest?.id ?? '',
        maxPartySize: sessionGuest?.maxPartySize ?? SITE.rsvp.maxPartySize,
        invitations,
      },
      settings,
      now: new Date(),
      collectMeal: SITE.rsvp.collectMeal,
    });

    if (!evalResult.ok) {
      return fail(evalResult.code, evalResult.message);
    }

    // 4. Resolve the guest record: reuse the session guest or create a new one
    const identity = {
      displayName: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    };

    let guest = sessionGuest;
    let wasFirstResponse = true;

    if (guest) {
      wasFirstResponse = !guest.rsvp || !guest.rsvp.respondedAt;
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          displayName: identity.displayName,
          ...(input.email ? { email: input.email } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
        },
        include: {
          rsvp: { select: { id: true, respondedAt: true } },
          invitations: { include: { event: true } },
        },
      });
    } else {
      // Light per-IP throttle (replaces the old invite-code gate)
      const ipHash = hashIp(clientIp(request));
      const recentNewGuests = await prisma.guest.count({
        where: { ipHash, createdAt: { gte: new Date(Date.now() - THROTTLE_WINDOW_MS) } },
      });
      if (recentNewGuests >= THROTTLE_MAX_NEW_GUESTS) {
        return fail(
          'RATE_LIMITED',
          'Too many responses from this device. Please wait a few minutes and try again.',
        );
      }

      guest = await prisma.guest.create({
        data: {
          ...identity,
          side: 'BOTH',
          maxPartySize: SITE.rsvp.maxPartySize,
          ipHash,
          invitations: {
            create: events.map((event) => ({ eventId: event.id })),
          },
        },
        include: {
          rsvp: { select: { id: true, respondedAt: true } },
          invitations: { include: { event: true } },
        },
      });
    }

    // 5. Build event slug to ID mapping from guest invitations
    const eventSlugToId = new Map<string, string>();
    for (const inv of guest.invitations) {
      eventSlugToId.set(inv.event.slug, inv.event.id);
    }

    // 6. Execute database transaction
    const result = await prisma.$transaction(async (tx) => {
      return submitRsvpTransaction(tx, {
        guestId: guest.id,
        status: evalResult.status,
        source: 'WEB',
        message: input.message,
        attendees: evalResult.sanitizedAttendees,
        eventSlugToId,
      });
    });

    // 7. Post-commit: send confirmation email to guest if email exists
    let emailSent = false;
    if (guest.email) {
      emailSent = await sendRsvpConfirmationEmail({
        guestEmail: guest.email,
        guestName: guest.displayName,
        status: evalResult.status,
        attendees: evalResult.sanitizedAttendees,
        invitedEvents: guest.invitations.map((i) => ({
          slug: i.event.slug,
          title: i.event.title,
          startsAt: i.event.startsAt,
          timeTbc: i.event.timeTbc,
        })),
        message: input.message,
      });
    }

    // 8. Post-commit (A14): Notify couple/coordinator only on first WEB response
    if (wasFirstResponse) {
      sendRsvpNotificationEmail({
        guestName: guest.displayName,
        status: evalResult.status,
        attendees: evalResult.sanitizedAttendees,
        message: input.message,
      }).catch((err) => {
        console.error('[RSVP NOTIFICATION ASYNC ERROR]:', err);
      });
    }

    const response = ok({
      status: evalResult.status,
      attendees: result.attendees,
      respondedAt: result.respondedAt,
      emailSent,
    });
    response.headers.set('Cache-Control', 'no-store');
    setGuestCookie(response, guest.id);
    return response;
  });
}
