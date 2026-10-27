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
import { sendEmail, resend } from '@/lib/email/client';
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from '@/lib/email/send';

describe('Email Templates & Client Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
    it('returns ok: true when Resend sends successfully', async () => {
      vi.spyOn(resend.emails, 'send').mockResolvedValueOnce({
        data: { id: 'email_test_123' },
        error: null,
      } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);

      const result = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test subject',
        text: 'Hello world',
      });

      expect(result.ok).toBe(true);
      expect(result.id).toBe('email_test_123');
    });

    it('returns ok: false and never throws when Resend returns API error', async () => {
      vi.spyOn(resend.emails, 'send').mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded', name: 'rate_limit_exceeded' },
      } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);

      const result = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test subject',
        text: 'Hello world',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('returns ok: false and never throws when network throws an exception', async () => {
      vi.spyOn(resend.emails, 'send').mockRejectedValueOnce(
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
      vi.spyOn(resend.emails, 'send').mockResolvedValueOnce({
        data: { id: 'email_ok' },
        error: null,
      } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);

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
      vi.spyOn(resend.emails, 'send').mockRejectedValueOnce(new Error('Resend down'));
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
      vi.spyOn(resend.emails, 'send').mockResolvedValueOnce({
        data: { id: 'email_notify' },
        error: null,
      } as unknown as Awaited<ReturnType<typeof resend.emails.send>>);

      const success = await sendRsvpNotificationEmail({
        guestName: 'Guest Name',
        status: 'DECLINED',
        attendees: [],
      });

      expect(success).toBe(true);
    });
  });
});
