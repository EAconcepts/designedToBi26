import { describe, expect, it } from 'vitest';
import { RsvpAttendeeInput, RsvpInput, AdminRsvpInput, OpenRsvpInput } from '@/lib/validation/rsvp';

describe('RSVP attendee schema', () => {
  it('accepts valid attendee input and trims whitespace', () => {
    const parsed = RsvpAttendeeInput.safeParse({
      name: '  Adeola Ogunleye  ',
      events: ['solemnization', 'reception'],
      meal: '  Jollof Rice & Beef  ',
      dietary: '  No peanuts  ',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Adeola Ogunleye');
      expect(parsed.data.events).toEqual(['solemnization', 'reception']);
      expect(parsed.data.meal).toBe('Jollof Rice & Beef');
      expect(parsed.data.dietary).toBe('No peanuts');
    }
  });

  it('rejects attendee names with fewer than 2 characters or greater than 80 characters', () => {
    expect(
      RsvpAttendeeInput.safeParse({
        name: 'A',
        events: ['solemnization'],
      }).success,
    ).toBe(false);

    expect(
      RsvpAttendeeInput.safeParse({
        name: 'A'.repeat(81),
        events: ['solemnization'],
      }).success,
    ).toBe(false);
  });

  it('requires at least one event slug in events array', () => {
    const emptyEvents = RsvpAttendeeInput.safeParse({
      name: 'Tunde Bakare',
      events: [],
    });
    expect(emptyEvents.success).toBe(false);
  });

  it('enforces maximum character length on meal and dietary fields', () => {
    expect(
      RsvpAttendeeInput.safeParse({
        name: 'Tunde Bakare',
        events: ['solemnization'],
        meal: 'M'.repeat(61),
      }).success,
    ).toBe(false);

    expect(
      RsvpAttendeeInput.safeParse({
        name: 'Tunde Bakare',
        events: ['solemnization'],
        dietary: 'D'.repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe('RSVP submission schema', () => {
  it('provides default values for declined and attendees', () => {
    const parsed = RsvpInput.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.declined).toBe(false);
      expect(parsed.data.attendees).toEqual([]);
    }
  });

  it('accepts up to 10 attendees', () => {
    const tenAttendees = Array.from({ length: 10 }, (_, i) => ({
      name: `Guest ${i + 1}`,
      events: ['solemnization'],
    }));

    const parsed = RsvpInput.safeParse({
      attendees: tenAttendees,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects more than 10 attendees', () => {
    const elevenAttendees = Array.from({ length: 11 }, (_, i) => ({
      name: `Guest ${i + 1}`,
      events: ['solemnization'],
    }));

    const parsed = RsvpInput.safeParse({
      attendees: elevenAttendees,
    });
    expect(parsed.success).toBe(false);
  });

  it('trims and bounds songRequest and message', () => {
    const parsed = RsvpInput.safeParse({
      songRequest: '  Sweet Mother - Prince Nico Mbarga  ',
      message: '  Congratulations to the couple!  ',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.songRequest).toBe('Sweet Mother - Prince Nico Mbarga');
      expect(parsed.data.message).toBe('Congratulations to the couple!');
    }

    expect(
      RsvpInput.safeParse({
        songRequest: 'S'.repeat(121),
      }).success,
    ).toBe(false);

    expect(
      RsvpInput.safeParse({
        message: 'M'.repeat(601),
      }).success,
    ).toBe(false);
  });
});

describe('Open RSVP schema (public submission)', () => {
  it('requires a responder name', () => {
    const missing = OpenRsvpInput.safeParse({ declined: true });
    expect(missing.success).toBe(false);

    const tooShort = OpenRsvpInput.safeParse({ name: 'A', declined: true });
    expect(tooShort.success).toBe(false);
  });

  it('accepts optional email and phone and defaults newResponse to false', () => {
    const parsed = OpenRsvpInput.safeParse({
      name: '  Tolu Familia  ',
      email: 'tolu@example.com',
      phone: '08012345678',
      declined: false,
      attendees: [{ name: 'Tolu Familia', events: ['solemnization'] }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Tolu Familia');
      expect(parsed.data.email).toBe('tolu@example.com');
      expect(parsed.data.newResponse).toBe(false);
    }
  });

  it('rejects malformed email and phone values', () => {
    expect(OpenRsvpInput.safeParse({ name: 'Tolu', email: 'not-an-email' }).success).toBe(false);
    expect(OpenRsvpInput.safeParse({ name: 'Tolu', phone: '12' }).success).toBe(false);
  });

  it('defaults newResponse to false and accepts an explicit true', () => {
    const base = OpenRsvpInput.parse({ name: 'Tolu Familia' });
    expect(base.newResponse).toBe(false);

    const fresh = OpenRsvpInput.parse({ name: 'Tolu Familia', newResponse: true });
    expect(fresh.newResponse).toBe(true);
  });
});

describe('Admin RSVP schema', () => {
  it('requires guestId and defaults source to PHONE', () => {
    const missingGuestId = AdminRsvpInput.safeParse({
      declined: false,
      attendees: [{ name: 'Ayo', events: ['solemnization'] }],
    });
    expect(missingGuestId.success).toBe(false);

    const validWithDefaults = AdminRsvpInput.safeParse({
      guestId: 'guest_123',
      declined: false,
    });
    expect(validWithDefaults.success).toBe(true);
    if (validWithDefaults.success) {
      expect(validWithDefaults.data.source).toBe('PHONE');
    }
  });

  it('accepts WHATSAPP source and rejects invalid sources', () => {
    const whatsapp = AdminRsvpInput.safeParse({
      guestId: 'guest_123',
      source: 'WHATSAPP',
    });
    expect(whatsapp.success).toBe(true);

    const invalid = AdminRsvpInput.safeParse({
      guestId: 'guest_123',
      source: 'TELEGRAM',
    });
    expect(invalid.success).toBe(false);
  });
});
