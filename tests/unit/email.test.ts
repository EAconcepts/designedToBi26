import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { render } from '@react-email/render';
import {
  RsvpConfirmationEmail,
  type RsvpConfirmationEmailProps,
} from '@/lib/email/templates/rsvp-confirmation';
import {
  RsvpNotificationEmail,
  type RsvpNotificationEmailProps,
} from '@/lib/email/templates/rsvp-notification';
import { sendEmail } from '@/lib/email/client';
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from '@/lib/email/send';

describe('Email Templates & Client Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockBrevoResponse(payload: Record<string, unknown>, status = 201) {
    return vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(payload), { status }));
  }

  describe('RsvpConfirmationEmail Template', () => {
    const defaultProps: RsvpConfirmationEmailProps = {
      guestName: 'Folashade Adeleke',
      status: 'ATTENDING',
      attendees: [
        {
          name: 'Folashade Adeleke',
          events: ['solemnization', 'reception'],
          meal: 'Jollof Rice with Fried Fish',
          dietary: 'No peanuts',
        },
        {
          name: 'Deji Adeleke',
          events: ['solemnization', 'reception'],
        },
      ],
      events: [
        {
          slug: 'solemnization',
          title: 'Solemnization of Holy Matrimony',
          dateFormatted: 'Saturday, 19 December 2026',
          timeFormatted: '11:00 WAT',
          venueName: 'Methodist Church, Olorunsogo-GeriAlimi',
        },
      ],
      message: 'Congratulations to the beautiful couple!',
      calendarUrl: 'https://example.com/#schedule',
      manageRsvpUrl: 'https://example.com/rsvp',
    };

    it('renders attending email to valid HTML without errors', async () => {
      const html = await render(React.createElement(RsvpConfirmationEmail, defaultProps));

      expect(html).toContain('Folashade Adeleke');
      expect(html).toContain('Solemnization of Holy Matrimony');
      expect(html).toContain('Saturday, 19 December 2026');
      expect(html).toContain('11:00 WAT');
      expect(html).toContain('Deji Adeleke');
      expect(html).toContain('Congratulations to the beautiful couple!');
      expect(html).toContain('#designedToBi');
      // Must not contain raw undefined
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    });

    it('renders declined email cleanly without event or attendee blocks', async () => {
      const declinedProps: RsvpConfirmationEmailProps = {
        guestName: 'Uncle Segun',
        status: 'DECLINED',
        attendees: [],
        events: [],
        message: 'Wishing you all the best from London!',
      };

      const html = await render(React.createElement(RsvpConfirmationEmail, declinedProps));

      expect(html).toContain('Uncle Segun');
      expect(html).toContain('Thank you for letting us know');
      expect(html).toContain('You will be dearly missed');
      expect(html).toContain('Wishing you all the best from London!');
      expect(html).not.toContain('undefined');
    });
  });

  describe('RsvpNotificationEmail Template', () => {
    const notificationProps: RsvpNotificationEmailProps = {
      guestName: 'Chief Babatunde',
      status: 'ATTENDING',
      attendees: [
        {
          name: 'Chief Babatunde',
          events: ['solemnization', 'reception'],
        },
      ],
      message: 'Can’t wait!',
      adminUrl: 'https://example.com/admin/rsvps',
    };

    it('renders coordinator notification with guest details and admin link', async () => {
      const html = await render(React.createElement(RsvpNotificationEmail, notificationProps));

      expect(html).toContain('Chief Babatunde');
      expect(html).toContain('ATTENDING');
      expect(html).toContain('Can’t wait!');
      expect(html).toContain('https://example.com/admin/rsvps');
      expect(html).not.toContain('undefined');
    });
  });

  describe('Email Client Safe Error Handling', () => {
    it('returns ok: true when Brevo sends successfully', async () => {
      const fetchMock = mockBrevoResponse({ messageId: 'email_test_123' });

      const result = await sendEmail({
        to: ['guest@example.com', 'another@example.com'],
        subject: 'Test subject',
        text: 'Hello world',
      });

      expect(result.ok).toBe(true);
      expect(result.id).toBe('email_test_123');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"email":"another@example.com"'),
        }),
      );
    });

    it('returns ok: false and never throws when Brevo returns API error', async () => {
      mockBrevoResponse({ message: 'Rate limit exceeded' }, 429);

      const result = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test subject',
        text: 'Hello world',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('returns ok: false and never throws when network throws an exception', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new Error('Network offline or connection refused'),
      );

      const result = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test subject',
        text: 'Hello world',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Network offline');
    });
  });

  describe('High-Level Dispatch Functions', () => {
    it('sendRsvpConfirmationEmail handles success and failure gracefully', async () => {
      mockBrevoResponse({ messageId: 'email_ok' });

      const success = await sendRsvpConfirmationEmail({
        guestEmail: 'guest@example.com',
        guestName: 'Guest Name',
        status: 'ATTENDING',
        attendees: [{ name: 'Guest Name', events: ['solemnization'] }],
        invitedEvents: [
          {
            slug: 'solemnization',
            title: 'Church Ceremony',
            startsAt: '2026-12-19T11:00:00+01:00',
            timeTbc: false,
          },
        ],
      });

      expect(success).toBe(true);

      // Now test failure returns false
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Brevo down'));
      const failure = await sendRsvpConfirmationEmail({
        guestEmail: 'guest@example.com',
        guestName: 'Guest Name',
        status: 'ATTENDING',
        attendees: [{ name: 'Guest Name', events: ['solemnization'] }],
        invitedEvents: [],
      });

      expect(failure).toBe(false);
    });

    it('sendRsvpNotificationEmail returns boolean without throwing', async () => {
      mockBrevoResponse({ messageId: 'email_notify' });

      const success = await sendRsvpNotificationEmail({
        guestName: 'Guest Name',
        status: 'DECLINED',
        attendees: [],
      });

      expect(success).toBe(true);
    });
  });
});
