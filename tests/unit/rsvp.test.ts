import { describe, expect, it } from 'vitest';
import { evaluateRsvpRules } from '@/lib/rsvp';
import type { EvaluateRsvpRulesGuest, EvaluateRsvpRulesSettings } from '@/lib/rsvp';

describe('RSVP domain rules evaluation (evaluateRsvpRules)', () => {
  const baseGuest: EvaluateRsvpRulesGuest = {
    id: 'guest_1',
    maxPartySize: 2,
    invitations: [
      { event: { id: 'evt_1', slug: 'solemnization' } },
      { event: { id: 'evt_2', slug: 'reception' } },
    ],
  };

  const openSettings: EvaluateRsvpRulesSettings = {
    mode: 'PRE',
    rsvpDeadline: new Date('2026-12-05T23:59:59Z'),
  };

  it('rejects submissions when site mode is POST', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [{ name: 'Ayo', events: ['solemnization'] }],
      },
      guest: baseGuest,
      settings: { ...openSettings, mode: 'POST' },
      now: new Date('2026-11-01T12:00:00Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('RSVP_CLOSED');
    }
  });

  it('rejects submissions when current time is past rsvpDeadline', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [{ name: 'Ayo', events: ['solemnization'] }],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-12-06T00:00:01Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('RSVP_CLOSED');
    }
  });

  it('allows submissions before rsvpDeadline', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [{ name: 'Ayo', events: ['solemnization'] }],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ATTENDING');
      expect(result.sanitizedAttendees).toHaveLength(1);
    }
  });

  it('clears attendees and sets DECLINED when guest declines', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: true,
        attendees: [{ name: 'Ayo', events: ['solemnization'] }],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('DECLINED');
      expect(result.sanitizedAttendees).toEqual([]);
    }
  });

  it('rejects attending submission with 0 attendees', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('PARTY_SIZE_EXCEEDED');
    }
  });

  it('rejects attendee count exceeding maxPartySize', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [
          { name: 'Ayo', events: ['solemnization'] },
          { name: 'Bola', events: ['solemnization'] },
          { name: 'Chidi', events: ['solemnization'] },
        ],
      },
      guest: baseGuest, // maxPartySize = 2
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('PARTY_SIZE_EXCEEDED');
    }
  });

  it('rejects attendees selecting events not in guest invitations', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [{ name: 'Ayo', events: ['after-party-uninvited'] }],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('NOT_INVITED');
    }
  });

  it('strips meal and dietary when collectMeal is false', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [
          {
            name: 'Ayo',
            events: ['solemnization'],
            meal: 'Jollof Rice',
            dietary: 'Nut allergy',
          },
        ],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
      collectMeal: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitizedAttendees[0]?.meal).toBeNull();
      expect(result.sanitizedAttendees[0]?.dietary).toBeNull();
    }
  });

  it('preserves meal and dietary when collectMeal is true', () => {
    const result = evaluateRsvpRules({
      input: {
        declined: false,
        attendees: [
          {
            name: 'Ayo',
            events: ['solemnization'],
            meal: 'Fried Rice & Fish',
            dietary: 'Gluten free',
          },
        ],
      },
      guest: baseGuest,
      settings: openSettings,
      now: new Date('2026-11-15T12:00:00Z'),
      collectMeal: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitizedAttendees[0]?.meal).toBe('Fried Rice & Fish');
      expect(result.sanitizedAttendees[0]?.dietary).toBe('Gluten free');
    }
  });
});
