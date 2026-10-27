import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as rsvpRoute } from '@/app/api/rsvp/route';
import { GUEST_COOKIE_NAME, signGuestId } from '@/lib/guest-cookie';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/email/client';
import { SITE } from '@/content/site.config';
import { makeGuest, makeEvent, makeInvitation, cleanupTestRows } from '@/tests/factories';

let ipCounter = 0;

function makeRsvpRequest(options: {
  sessionGuestId?: string;
  body?: unknown;
  ip?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    // Unique per call so the per-IP creation throttle never leaks across tests
    'x-forwarded-for':
      options.ip ?? `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`,
    ...(options.headers ?? {}),
  };

  if (options.sessionGuestId) {
    headers.cookie = `${GUEST_COOKIE_NAME}=${signGuestId(options.sessionGuestId)}`;
  }

  return new NextRequest('http://localhost:3000/api/rsvp', {
    method: 'POST',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

describe('RSVP API route integration (POST /api/rsvp)', () => {
  beforeEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
    vi.spyOn(resend.emails, 'send').mockResolvedValue({
      data: null,
      error: { name: 'mock_error', message: 'Mocked in integration test' },
    } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);
    // Ensure default settings are in open state
    await prisma.setting.upsert({
      where: { id: 1 },
      create: { id: 1, mode: 'PRE', rsvpDeadline: new Date('2026-12-05T23:59:59Z') },
      update: { mode: 'PRE', rsvpDeadline: new Date('2026-12-05T23:59:59Z') },
    });
  });

  afterEach(async () => {
    await cleanupTestRows();
    vi.restoreAllMocks();
    await prisma.setting.update({
      where: { id: 1 },
      data: { mode: 'PRE', rsvpDeadline: new Date('2026-12-05T23:59:59Z') },
    });
  });

  it('handles happy path: 2 attendees × 2 events successfully', async () => {
    const guest = await makeGuest({ maxPartySize: 2 });
    const event1 = await makeEvent();
    const event2 = await makeEvent();
    await makeInvitation(guest.id, event1.id);
    await makeInvitation(guest.id, event2.id);

    const payload = {
      name: 'Adeleke Household',
      declined: false,
      attendees: [
        { name: 'Adewale Adeleke', events: [event1.slug, event2.slug] },
        { name: 'Bolanle Adeleke', events: [event1.slug] },
      ],
      message: 'So happy for both of you!',
    };

    const req = makeRsvpRequest({ sessionGuestId: guest.id, body: payload });
    const res = await rsvpRoute(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ATTENDING');
    expect(body.data.attendees).toHaveLength(2);
    expect(body.data.emailSent).toBe(false);
    expect(typeof body.data.respondedAt).toBe('string');

    // Assert DB state
    const rsvpInDb = await prisma.rsvp.findUnique({
      where: { guestId: guest.id },
      include: {
        attendees: {
          include: { events: true },
        },
      },
    });

    expect(rsvpInDb).not.toBeNull();
    expect(rsvpInDb?.status).toBe('ATTENDING');
    expect(rsvpInDb?.message).toBe('So happy for both of you!');
    expect(rsvpInDb?.attendees).toHaveLength(2);

    const totalAttendeeEvents = rsvpInDb?.attendees.reduce(
      (sum, att) => sum + att.events.length,
      0,
    );
    expect(totalAttendeeEvents).toBe(3); // 2 on first attendee, 1 on second
  });

  it('guarantees retry idempotency on double-tap submission', async () => {
    const guest = await makeGuest({ maxPartySize: 2 });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    const payload = {
      name: 'Ayo Test Household',
      declined: false,
      attendees: [{ name: 'Ayo Test', events: [event.slug] }],
    };

    // First tap
    const res1 = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res1.status).toBe(200);

    // Second tap (identical payload)
    const res2 = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res2.status).toBe(200);

    // Verify row counts in DB: exactly 1 Rsvp, 1 attendee, 1 attendeeEvent
    const rsvps = await prisma.rsvp.findMany({ where: { guestId: guest.id } });
    expect(rsvps).toHaveLength(1);

    const rsvpId = rsvps[0]!.id;
    const attendees = await prisma.rsvpAttendee.findMany({ where: { rsvpId } });
    expect(attendees).toHaveLength(1);

    const attendeeId = attendees[0]!.id;
    const attendeeEvents = await prisma.attendeeEvent.findMany({
      where: { attendeeId },
    });
    expect(attendeeEvents).toHaveLength(1);
  });

  it('rejects submissions exceeding guest maxPartySize and leaves DB unchanged', async () => {
    const guest = await makeGuest({ maxPartySize: 2 });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    const payload = {
      name: 'Too Big Household',
      declined: false,
      attendees: [
        { name: 'Person 1', events: [event.slug] },
        { name: 'Person 2', events: [event.slug] },
        { name: 'Person 3', events: [event.slug] },
      ],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('PARTY_SIZE_EXCEEDED');

    // DB remains clean
    const rsvpInDb = await prisma.rsvp.findUnique({ where: { guestId: guest.id } });
    expect(rsvpInDb).toBeNull();
  });

  it('rejects submissions requesting events not included in guest invitation', async () => {
    const guest = await makeGuest({ maxPartySize: 2 });
    const invitedEvent = await makeEvent();
    const uninvitedEvent = await makeEvent();
    await makeInvitation(guest.id, invitedEvent.id);

    const payload = {
      name: 'Picky Household',
      declined: false,
      attendees: [{ name: 'Ayo', events: [uninvitedEvent.slug] }],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_INVITED');

    const rsvpInDb = await prisma.rsvp.findUnique({ where: { guestId: guest.id } });
    expect(rsvpInDb).toBeNull();
  });

  it('rejects submissions when rsvpDeadline is in the past', async () => {
    const guest = await makeGuest();
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    await prisma.setting.update({
      where: { id: 1 },
      data: { rsvpDeadline: new Date('2020-01-01T00:00:00Z') },
    });

    const payload = {
      name: 'Late Household',
      declined: false,
      attendees: [{ name: 'Ayo', events: [event.slug] }],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('RSVP_CLOSED');
  });

  it('rejects submissions when siteMode is POST even before deadline', async () => {
    const guest = await makeGuest();
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    await prisma.setting.update({
      where: { id: 1 },
      data: { mode: 'POST' },
    });

    const payload = {
      name: 'Closed Household',
      declined: false,
      attendees: [{ name: 'Ayo', events: [event.slug] }],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('RSVP_CLOSED');
  });

  it('handles decline path: clears existing attendees and marks status DECLINED', async () => {
    const guest = await makeGuest({ maxPartySize: 2 });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    // Initial ATTENDING submission
    await rsvpRoute(
      makeRsvpRequest({
        sessionGuestId: guest.id,
        body: {
          name: 'Declining Household',
          declined: false,
          attendees: [{ name: 'Ayo Initial', events: [event.slug] }],
        },
      }),
    );

    // Subsequent DECLINED submission
    const res = await rsvpRoute(
      makeRsvpRequest({
        sessionGuestId: guest.id,
        body: {
          name: 'Declining Household',
          declined: true,
          message: 'Sorry we cannot attend!',
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('DECLINED');
    expect(body.data.attendees).toEqual([]);

    const rsvpInDb = await prisma.rsvp.findUnique({
      where: { guestId: guest.id },
      include: { attendees: true },
    });
    expect(rsvpInDb?.status).toBe('DECLINED');
    expect(rsvpInDb?.attendees).toHaveLength(0);
    expect(rsvpInDb?.message).toBe('Sorry we cannot attend!');
  });

  it('accepts an open submission with no session, creates a guest, and issues a session cookie', async () => {
    const before = await prisma.guest.count();

    const res = await rsvpRoute(
      makeRsvpRequest({
        body: {
          name: 'Test Guest tst_open',
          email: 'open-guest@example.com',
          phone: '08012345678',
          declined: false,
          attendees: [{ name: 'Open Guest', events: ['solemnization'] }],
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ATTENDING');

    // Session cookie issued for the newly created guest
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${GUEST_COOKIE_NAME}=`);

    const guests = await prisma.guest.findMany({
      where: { displayName: 'Test Guest tst_open' },
      include: { invitations: true, rsvp: true },
    });
    expect(guests).toHaveLength(1);
    expect(await prisma.guest.count()).toBe(before + 1);

    const created = guests[0]!;
    expect(created.email).toBe('open-guest@example.com');
    expect(created.phone).toBe('08012345678');
    expect(created.maxPartySize).toBe(SITE.rsvp.maxPartySize);
    expect(created.rsvp?.status).toBe('ATTENDING');
    // Invited to every seeded event so any selection is allowed
    expect(created.invitations.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a fresh guest when newResponse is set despite an existing session cookie', async () => {
    const existing = await makeGuest();

    const res = await rsvpRoute(
      makeRsvpRequest({
        sessionGuestId: existing.id,
        body: {
          name: 'Test Guest tst_fresh',
          newResponse: true,
          declined: true,
          message: 'Sorry, cannot make it',
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('DECLINED');

    // Original session guest untouched
    const untouched = await prisma.rsvp.findUnique({ where: { guestId: existing.id } });
    expect(untouched).toBeNull();

    const fresh = await prisma.guest.findFirst({
      where: { displayName: 'Test Guest tst_fresh' },
      include: { rsvp: true },
    });
    expect(fresh).not.toBeNull();
    expect(fresh?.rsvp?.status).toBe('DECLINED');
  });

  it('throttles repeated new responses from the same IP with 429 RATE_LIMITED', async () => {
    const ip = '198.51.100.7';

    // 10 new-guest submissions are allowed within the window
    for (let i = 1; i <= 10; i++) {
      const res = await rsvpRoute(
        makeRsvpRequest({
          ip,
          body: {
            name: `Test Guest tst_spam${i}`,
            declined: true,
          },
        }),
      );
      expect(res.status).toBe(200);
    }

    // The 11th is rejected
    const blocked = await rsvpRoute(
      makeRsvpRequest({
        ip,
        body: {
          name: 'Test Guest tst_spam11',
          declined: true,
        },
      }),
    );
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('rejects malformed or invalid Zod payload with 400 VALIDATION', async () => {
    const guest = await makeGuest();

    const res = await rsvpRoute(
      makeRsvpRequest({
        sessionGuestId: guest.id,
        body: {
          declined: false,
          attendees: [
            {
              name: 'A', // invalid (< 2 chars)
              events: [], // invalid (empty events)
            },
          ],
        },
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields).toBeDefined();
    expect(body.error.fields?.['name']).toBeDefined();
    expect(body.error.fields?.['attendees.0.name']).toBeDefined();
    expect(body.error.fields?.['attendees.0.events']).toBeDefined();
  });

  it('strips meal and dietary choices when SITE.rsvp.collectMeal is false', async () => {
    const guest = await makeGuest();
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    const payload = {
      name: 'Meal Household',
      declined: false,
      attendees: [
        {
          name: 'Ayo With Meal',
          events: [event.slug],
          meal: 'Jollof & Chicken',
          dietary: 'No shellfish',
        },
      ],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(200);

    const rsvpInDb = await prisma.rsvp.findUnique({
      where: { guestId: guest.id },
      include: { attendees: true },
    });

    expect(rsvpInDb?.attendees[0]?.meal).toBeNull();
    expect(rsvpInDb?.attendees[0]?.dietary).toBeNull();
  });

  it('sets emailSent: true when Resend confirmation succeeds', async () => {
    const sendSpy = vi.spyOn(resend.emails, 'send').mockResolvedValueOnce({
      data: { id: 'email_ok_123' },
      error: null,
    } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);

    const guest = await makeGuest({ email: 'happyguest@example.com' });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    const payload = {
      name: 'Happy Household',
      declined: false,
      attendees: [{ name: 'Happy Guest', events: [event.slug] }],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.emailSent).toBe(true);
    expect(sendSpy).toHaveBeenCalled();
  });

  it('sets emailSent: false and leaves RSVP committed when Resend rejects', async () => {
    vi.spyOn(resend.emails, 'send').mockRejectedValueOnce(
      new Error('Resend network connection timeout'),
    );

    const guest = await makeGuest({ email: 'failingemail@example.com' });
    const event = await makeEvent();
    await makeInvitation(guest.id, event.id);

    const payload = {
      name: 'Failing Household',
      declined: false,
      attendees: [{ name: 'Failing Email Guest', events: [event.slug] }],
    };

    const res = await rsvpRoute(makeRsvpRequest({ sessionGuestId: guest.id, body: payload }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.emailSent).toBe(false);

    // Assert RSVP row still successfully exists in DB
    const rsvpInDb = await prisma.rsvp.findUnique({
      where: { guestId: guest.id },
    });
    expect(rsvpInDb).not.toBeNull();
    expect(rsvpInDb?.status).toBe('ATTENDING');
  });
});
