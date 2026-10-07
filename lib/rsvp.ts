import type { Prisma, SiteMode, RsvpSource, RsvpStatus } from '@prisma/client';
import type { ErrorCode } from '@/lib/api';
import type { RsvpInput } from '@/lib/validation/rsvp';

export interface EvaluateRsvpRulesGuest {
  id: string;
  maxPartySize: number;
  invitations: Array<{
    event: {
      id: string;
      slug: string;
    };
  }>;
}

export interface EvaluateRsvpRulesSettings {
  mode: SiteMode;
  rsvpDeadline: Date | null;
}

export interface SanitizedAttendee {
  name: string;
  events: string[];
  meal?: string | null;
  dietary?: string | null;
}

export type EvaluateRsvpRulesResult =
  | {
      ok: true;
      status: 'ATTENDING' | 'DECLINED';
      sanitizedAttendees: SanitizedAttendee[];
    }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
    };

export function evaluateRsvpRules(params: {
  input: RsvpInput;
  guest: EvaluateRsvpRulesGuest;
  settings: EvaluateRsvpRulesSettings;
  now?: Date;
  collectMeal?: boolean;
}): EvaluateRsvpRulesResult {
  const { input, guest, settings, now = new Date(), collectMeal = false } = params;

  // 1. Mode/deadline: mode === "POST" or now > settings.rsvpDeadline => 409 RSVP_CLOSED
  if (settings.mode === 'POST') {
    return {
      ok: false,
      code: 'RSVP_CLOSED',
      message: 'RSVPs are closed as the event has concluded.',
    };
  }

  if (settings.rsvpDeadline && now.getTime() > settings.rsvpDeadline.getTime()) {
    return {
      ok: false,
      code: 'RSVP_CLOSED',
      message: 'The RSVP deadline has passed.',
    };
  }

  // 2. If declined: attendees are empty, status is DECLINED
  if (input.declined) {
    return {
      ok: true,
      status: 'DECLINED',
      sanitizedAttendees: [],
    };
  }

  // 3. If attending: party size must be >= 1 and <= guest.maxPartySize => 409 PARTY_SIZE_EXCEEDED
  if (input.attendees.length < 1) {
    return {
      ok: false,
      code: 'PARTY_SIZE_EXCEEDED',
      message: 'Please provide at least one attendee for your party.',
    };
  }

  if (input.attendees.length > guest.maxPartySize) {
    return {
      ok: false,
      code: 'PARTY_SIZE_EXCEEDED',
      message: `Your invitation allows a maximum of ${guest.maxPartySize} guest${guest.maxPartySize === 1 ? '' : 's'}.`,
    };
  }

  // 4. Invitation scope: every attendee.events entry must exist in guest invitations => 403 NOT_INVITED
  const invitedSlugs = new Set(guest.invitations.map((inv) => inv.event.slug));
  for (const attendee of input.attendees) {
    for (const eventSlug of attendee.events) {
      if (!invitedSlugs.has(eventSlug)) {
        return {
          ok: false,
          code: 'NOT_INVITED',
          message: 'One or more selected events are not included in your invitation.',
        };
      }
    }
  }

  // 5. Sanitize attendees (strip meal and dietary if collectMeal is false)
  const sanitizedAttendees: SanitizedAttendee[] = input.attendees.map((att) => ({
    name: att.name,
    events: att.events,
    meal: collectMeal ? (att.meal ?? null) : null,
    dietary: collectMeal ? (att.dietary ?? null) : null,
  }));

  return {
    ok: true,
    status: 'ATTENDING',
    sanitizedAttendees,
  };
}

export interface SubmitRsvpParams {
  guestId: string;
  status: RsvpStatus;
  source?: RsvpSource;
  songRequest?: string | null;
  message?: string | null;
  attendees: SanitizedAttendee[];
  eventSlugToId: Map<string, string>;
  now?: Date;
}

export async function submitRsvpTransaction(
  tx: Prisma.TransactionClient,
  params: SubmitRsvpParams,
) {
  const now = params.now ?? new Date();

  // 1. Upsert Rsvp row for this guest
  const rsvp = await tx.rsvp.upsert({
    where: { guestId: params.guestId },
    create: {
      guestId: params.guestId,
      status: params.status,
      source: params.source ?? 'WEB',
      songRequest: params.songRequest?.trim() || null,
      message: params.message?.trim() || null,
      respondedAt: now,
    },
    update: {
      status: params.status,
      source: params.source ?? 'WEB',
      songRequest: params.songRequest?.trim() || null,
      message: params.message?.trim() || null,
      respondedAt: now,
    },
  });

  // 2. Clear existing attendees for this rsvp (cascades to AttendeeEvent)
  await tx.rsvpAttendee.deleteMany({
    where: { rsvpId: rsvp.id },
  });

  // 3. Create new attendee rows and attendee-event links if ATTENDING
  if (params.status === 'ATTENDING' && params.attendees.length > 0) {
    for (const attendee of params.attendees) {
      const attendeeRecord = await tx.rsvpAttendee.create({
        data: {
          rsvpId: rsvp.id,
          name: attendee.name,
          meal: attendee.meal ?? null,
          dietary: attendee.dietary ?? null,
        },
      });

      if (attendee.events.length > 0) {
        const attendeeEventData = attendee.events
          .map((slug) => {
            const eventId = params.eventSlugToId.get(slug);
            return eventId ? { attendeeId: attendeeRecord.id, eventId } : null;
          })
          .filter((item): item is { attendeeId: string; eventId: string } => item !== null);

        if (attendeeEventData.length > 0) {
          await tx.attendeeEvent.createMany({
            data: attendeeEventData,
          });
        }
      }
    }
  }

  return {
    rsvp,
    attendees: params.attendees.map((a) => ({ name: a.name, events: a.events })),
    respondedAt: now.toISOString(),
  };
}
