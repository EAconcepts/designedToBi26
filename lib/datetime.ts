import { SITE } from '@/content/site.config';

export const WAT_TIME_ZONE = 'Africa/Lagos';

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

export function formatDateWAT(
  date: Date | string,
  style: 'full' | 'short' | 'month-day' = 'full',
): string {
  const d = toDate(date);
  if (style === 'month-day') {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: WAT_TIME_ZONE,
      month: 'long',
      day: 'numeric',
    }).format(d);
  }
  if (style === 'short') {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: WAT_TIME_ZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatTimeWAT(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatDateTimeWAT(date: Date | string): string {
  const d = toDate(date);
  return `${formatDateWAT(d, 'full')} at ${formatTimeWAT(d)}`;
}

export function isBeforeDeadline(date: Date | string, deadline: Date | string): boolean {
  const now = toDate(date);
  let dead = toDate(deadline);

  if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    dead = new Date(`${deadline}T23:59:59.999+01:00`);
  }

  return now.getTime() <= dead.getTime();
}

export function countdownTargetISO(): string {
  const firstEvent = SITE.events[0];
  if (firstEvent?.startsAt) {
    return new Date(firstEvent.startsAt).toISOString();
  }
  return '2026-12-19T10:00:00.000Z';
}
