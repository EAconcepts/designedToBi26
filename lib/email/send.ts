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

export interface SendGiftReceiptParams {
  giverEmail: string;
  giverName: string;
  amountFormatted: string;
  fundTitle: string;
  reference: string;
  message?: string | null;
}

export async function sendGiftReceiptEmail(params: SendGiftReceiptParams): Promise<boolean> {
  try {
    const { GiftReceiptEmail } = await import('./templates/gift-receipt');

    const subject = `Thank you for your gift to ${SITE.couple.a} & ${SITE.couple.b}!`;

    const emailElement = React.createElement(GiftReceiptEmail, {
      giverName: params.giverName,
      amountFormatted: params.amountFormatted,
      fundTitle: params.fundTitle,
      reference: params.reference,
      message: params.message,
    });

    const result = await sendEmail({
      to: params.giverEmail,
      subject,
      react: emailElement,
    });

    return result.ok;
  } catch (err) {
    console.error('[GIFT RECEIPT SEND EXCEPTION]:', err);
    return false;
  }
}

export interface SendGiftNotificationParams {
  giverName: string;
  giverEmail?: string | null;
  amountFormatted: string;
  fundTitle: string;
  reference: string;
  channel: string;
  message?: string | null;
}

export async function sendGiftNotificationEmail(
  params: SendGiftNotificationParams,
): Promise<boolean> {
  try {
    const notifyEmail = env.server.NOTIFY_EMAIL;
    if (!notifyEmail) return false;

    const { GiftNotificationEmail } = await import('./templates/gift-notification');

    const siteUrl = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const ledgerUrl = `${siteUrl}/admin/gifts`;
    const subject = `[Gift Alert] ${params.amountFormatted} from ${params.giverName}`;

    const emailElement = React.createElement(GiftNotificationEmail, {
      giverName: params.giverName,
      giverEmail: params.giverEmail,
      amountFormatted: params.amountFormatted,
      fundTitle: params.fundTitle,
      reference: params.reference,
      channel: params.channel,
      message: params.message,
      ledgerUrl,
    });

    const result = await sendEmail({
      to: notifyEmail,
      subject,
      react: emailElement,
    });

    return result.ok;
  } catch (err) {
    console.error('[GIFT NOTIFICATION SEND EXCEPTION]:', err);
    return false;
  }
}
