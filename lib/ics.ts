export interface IcsEvent {
  slug: string;
  title: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  timeTbc?: boolean;
  venue?: {
    name: string;
    address?: string | null;
  };
  notes?: string | null;
  url?: string | null;
}

export interface IcsOptions {
  siteUrl?: string;
  domain?: string;
  now?: Date;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatUtcDateTime(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function formatUtcDateOnly(d: Date): string {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
}

function foldLine(line: string): string {
  if (Buffer.byteLength(line, 'utf-8') <= 75) {
    return line;
  }

  const parts: string[] = [];
  let remaining = line;
  let maxBytes = 75;

  while (remaining.length > 0) {
    let sliceLen = remaining.length;
    while (sliceLen > 0 && Buffer.byteLength(remaining.slice(0, sliceLen), 'utf-8') > maxBytes) {
      sliceLen--;
    }
    if (sliceLen === 0) {
      sliceLen = 1;
    }
    parts.push(remaining.slice(0, sliceLen));
    remaining = remaining.slice(sliceLen);
    maxBytes = 74; // Subsequent lines prefix with 1 space
  }

  return parts.join('\r\n ');
}

export function buildIcs(events: IcsEvent[], opts?: IcsOptions): string {
  const siteUrl = opts?.siteUrl ?? 'https://designedtobi26.com';
  let domain = opts?.domain;
  if (!domain) {
    try {
      domain = new URL(siteUrl).hostname;
    } catch {
      domain = 'designedtobi26.com';
    }
  }

  const now = opts?.now ?? new Date();
  const dtstamp = formatUtcDateTime(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Adetolani Esther & Abiodun Emmanuel Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    const start = typeof event.startsAt === 'string' ? new Date(event.startsAt) : event.startsAt;
    const uid = `${event.slug}@${domain}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);

    if (event.timeTbc) {
      lines.push(`DTSTART;VALUE=DATE:${formatUtcDateOnly(start)}`);
    } else {
      lines.push(`DTSTART:${formatUtcDateTime(start)}`);
      if (event.endsAt) {
        const end = typeof event.endsAt === 'string' ? new Date(event.endsAt) : event.endsAt;
        lines.push(`DTEND:${formatUtcDateTime(end)}`);
      } else {
        const twoHoursLater = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        lines.push(`DTEND:${formatUtcDateTime(twoHoursLater)}`);
      }
    }

    lines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeText(event.notes)}`);
    }

    if (event.venue) {
      const loc = event.venue.address
        ? `${event.venue.name}, ${event.venue.address}`
        : event.venue.name;
      lines.push(`LOCATION:${escapeText(loc)}`);
    }

    const eventUrl = event.url ?? siteUrl;
    if (eventUrl) {
      lines.push(`URL:${escapeText(eventUrl)}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
