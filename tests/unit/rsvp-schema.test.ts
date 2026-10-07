import { describe, expect, it } from 'vitest';
import { RsvpAttendeeInput, RsvpInput, AdminRsvpInput } from '@/lib/validation/rsvp';

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
