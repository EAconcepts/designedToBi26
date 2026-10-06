import { describe, expect, it } from 'vitest';
import { GuestSessionResponseSchema } from '@/lib/validation/session';

describe('guest session response schema', () => {
  it('accepts the public guest contract', () => {
    const response = GuestSessionResponseSchema.safeParse({
      ok: true,
      data: {
        guest: {
          displayName: 'The Adeyemi Family',
          maxPartySize: 3,
          events: ['solemnization'],
          greeting: 'Dear The Adeyemi Family',
          rsvp: {
            status: 'ATTENDING',
            respondedAt: '2026-10-06T10:00:00.000Z',
            attendees: [{ name: 'Ayo', events: ['solemnization'], meal: null, dietary: null }],
            songRequest: null,
            message: null,
          },
        },
      },
    });
    expect(response.success).toBe(true);
  });

  it('accepts an anonymous guest session and rejects private fields', () => {
    expect(GuestSessionResponseSchema.safeParse({ ok: true, data: { guest: null } }).success).toBe(
      true,
    );
    expect(
      GuestSessionResponseSchema.safeParse({
        ok: true,
        data: {
          guest: {
            displayName: 'Guest',
            maxPartySize: 1,
            events: [],
            greeting: 'Dear Guest',
            email: 'private@example.com',
            rsvp: null,
          },
        },
      }).success,
    ).toBe(false);
  });
});
