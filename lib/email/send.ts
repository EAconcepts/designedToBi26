import * as React from 'react';
import { env } from '@/lib/env';
import { SITE } from '@/content/site.config';
import { formatDateWAT, formatTimeWAT } from '@/lib/datetime';
import { sendEmail } from './client';
import {
  RsvpConfirmationEmail,
  type RsvpConfirmationEmailProps,
} from './templates/rsvp-confirmation';
import {
  RsvpNotificationEmail,
  type RsvpNotificationEmailProps,
} from './templates/rsvp-notification';

export interface SendRsvpConfirmationParams {
  guestEmail: string;
  guestName: string;
  guestCode: string;
  status: 'ATTENDING' | 'DECLINED';
  attendees: Array<{
    name: string;
    events: string[];
    meal?: string | null;
    dietary?: string | null;
  }>;
  invitedEvents: Array<{
    slug: string;
    title: string;
    startsAt: string | Date;
    timeTbc: boolean;
  }>;
  venueName?: string;
  songRequest?: string | null;
  message?: string | null;
}

export async function sendRsvpConfirmationEmail(
  params: SendRsvpConfirmationParams,
): Promise<boolean> {
  try {
    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const manageRsvpUrl = `${siteUrl}/rsvp`;
    const calendarUrl = `${siteUrl}/#schedule`;
    const venueName = params.venueName || SITE.venue.name;

    const formattedEvents = params.invitedEvents.map((evt) => ({
      slug: evt.slug,
      title: evt.title,
      dateFormatted: formatDateWAT(evt.startsAt, 'full'),
      timeFormatted: evt.timeTbc ? 'Time to be announced' : `${formatTimeWAT(evt.startsAt)} WAT`,
      venueName,
    }));

    const subject = `Your RSVP for Adetolani & Emmanuel — 19 December 2026`;

    const emailElement = React.createElement(RsvpConfirmationEmail, {
      guestName: params.guestName,
      status: params.status,
      attendees: params.attendees,
      events: formattedEvents,
      songRequest: params.songRequest,
      message: params.message,
      calendarUrl,
      manageRsvpUrl,
    } as RsvpConfirmationEmailProps);

    const result = await sendEmail({
      to: params.guestEmail,
      subject,
      react: emailElement,
    });

    return result.ok;
  } catch (err) {
    console.error('[RSVP CONFIRMATION SEND EXCEPTION]:', err);
    return false;
  }
}

export interface SendRsvpNotificationParams {
  guestName: string;
  status: 'ATTENDING' | 'DECLINED';
  attendees: Array<{
    name: string;
    events: string[];
    meal?: string | null;
    dietary?: string | null;
  }>;
  songRequest?: string | null;
  message?: string | null;
}

export async function sendRsvpNotificationEmail(
  params: SendRsvpNotificationParams,
): Promise<boolean> {
  try {
    const notifyEmail = env.server.NOTIFY_EMAIL;
    if (!notifyEmail) return false;

    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const adminUrl = `${siteUrl}/admin/rsvps`;
    const subject = `[RSVP Alert] ${params.guestName} (${params.status})`;

    const emailElement = React.createElement(RsvpNotificationEmail, {
      guestName: params.guestName,
      status: params.status,
      attendees: params.attendees,
      songRequest: params.songRequest,
      message: params.message,
      adminUrl,
    } as RsvpNotificationEmailProps);

    const result = await sendEmail({
      to: notifyEmail,
      subject,
      react: emailElement,
    });

    return result.ok;
  } catch (err) {
    console.error('[RSVP NOTIFICATION SEND EXCEPTION]:', err);
    return false;
  }
}
