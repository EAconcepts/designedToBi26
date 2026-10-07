import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getGuestCode } from '@/lib/guest-cookie';
import { getSettingsUncached } from '@/lib/settings';
import { RsvpInput } from '@/lib/validation/rsvp';
import { evaluateRsvpRules, submitRsvpTransaction } from '@/lib/rsvp';
import { SITE } from '@/content/site.config';
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request, async () => {
    // 1. Guest cookie authentication
    const guestCode = getGuestCode(request);
    if (!guestCode) {
      return fail(
        'GUEST_REQUIRED',
        'Please access this page using your personalized invitation link.',
      );
    }

    // 2. Parse request JSON body
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

    const input = RsvpInput.parse(rawBody);

    // 3. Load guest, invitations with event details, and settings
    const [guest, settings] = await Promise.all([
      prisma.guest.findUnique({
        where: { code: guestCode },
        include: {
          rsvp: { select: { id: true, respondedAt: true } },
          invitations: {
            include: {
              event: true,
            },
          },
        },
      }),
      getSettingsUncached(),
    ]);

    if (!guest) {
      return fail(
        'GUEST_REQUIRED',
        'Please access this page using your personalized invitation link.',
      );
    }

    // 4. Evaluate server-side business rules
    const evalResult = evaluateRsvpRules({
      input,
      guest,
      settings,
      now: new Date(),
      collectMeal: SITE.rsvp.collectMeal,
    });

    if (!evalResult.ok) {
      return fail(evalResult.code, evalResult.message);
    }

    // 5. Build event slug to ID mapping from guest invitations
    const eventSlugToId = new Map<string, string>();
    for (const inv of guest.invitations) {
      eventSlugToId.set(inv.event.slug, inv.event.id);
    }

    // Check if this is the first response before mutating DB
    const wasFirstResponse = !guest.rsvp || !guest.rsvp.respondedAt;

    // 6. Execute database transaction
    const result = await prisma.$transaction(async (tx) => {
      return submitRsvpTransaction(tx, {
        guestId: guest.id,
        status: evalResult.status,
        source: 'WEB',
        songRequest: input.songRequest,
        message: input.message,
        attendees: evalResult.sanitizedAttendees,
        eventSlugToId,
      });
    });

    // 7. Post-commit: send confirmation email to guest if guest.email exists
    let emailSent = false;
    if (guest.email) {
      emailSent = await sendRsvpConfirmationEmail({
        guestEmail: guest.email,
        guestName: guest.displayName,
        guestCode: guest.code,
        status: evalResult.status,
        attendees: evalResult.sanitizedAttendees,
        invitedEvents: guest.invitations.map((i) => ({
          slug: i.event.slug,
          title: i.event.title,
          startsAt: i.event.startsAt,
          timeTbc: i.event.timeTbc,
        })),
        songRequest: input.songRequest,
        message: input.message,
      });
    }

    // 8. Post-commit (A14): Notify couple/coordinator only on first WEB response
    if (wasFirstResponse) {
      sendRsvpNotificationEmail({
        guestName: guest.displayName,
        status: evalResult.status,
        attendees: evalResult.sanitizedAttendees,
        songRequest: input.songRequest,
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
    return response;
  });
}
