import { describe, it, expect } from 'vitest';
import { buildIcs, type IcsEvent } from '@/lib/ics';

describe('lib/ics', () => {
  const sampleEvents: IcsEvent[] = [
    {
      slug: 'solemnization',
      title: 'Solemnization of Holy Matrimony',
      startsAt: '2026-12-19T10:00:00Z', // 11:00 WAT
      endsAt: '2026-12-19T12:00:00Z',
      timeTbc: false,
      venue: {
        name: 'Methodist Church',
        address: 'Olorunsogo-GeriAlimi, Ilorin',
      },
      notes: 'Church solemnization commences promptly at 11:00 AM WAT, followed by reception.',
      url: 'https://designedtobi26.com#events',
    },
    {
      slug: 'reception',
      title: 'Reception Dinner & Dance',
      startsAt: '2026-12-19T12:00:00Z',
      timeTbc: true,
      venue: {
        name: 'Church Event Hall',
      },
      notes: 'Time to be confirmed later.',
    },
  ];

  it('outputs CRLF line endings only and contains BEGIN:VCALENDAR and END:VCALENDAR', () => {
    const ics = buildIcs(sampleEvents);
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('END:VCALENDAR\r\n');

    // Confirm that every newline is preceded by \r
    const parts = ics.split('\n');
    for (let i = 0; i < parts.length - 1; i++) {
      expect(parts[i]?.endsWith('\r')).toBe(true);
    }
  });

  it('escapes commas, semicolons, and backslashes in descriptions and summaries', () => {
    const events: IcsEvent[] = [
      {
        slug: 'test-escape',
        title: 'Title, with comma; and semicolon \\ backslash',
        startsAt: '2026-12-19T10:00:00Z',
        notes: 'Line 1,\nLine 2; and \\ test',
      },
    ];
    const ics = buildIcs(events);
    expect(ics).toContain('Title\\, with comma\\; and semicolon \\\\ backslash');
    expect(ics).toContain('Line 1\\,\\nLine 2\\; and \\\\ test');
  });

  it('folds lines exceeding 75 octets with CRLF followed by a single space', () => {
    const events: IcsEvent[] = [
      {
        slug: 'long-line',
        title:
          'This is an exceptionally long event title designed specifically to exceed the seventy-five octet threshold for iCalendar line folding according to RFC 5545 specifications.',
        startsAt: '2026-12-19T10:00:00Z',
      },
    ];
    const ics = buildIcs(events);

    // Each physical line between CRLF should be <= 75 bytes
    const lines = ics.split('\r\n').filter(Boolean);
    for (const line of lines) {
      expect(Buffer.byteLength(line, 'utf-8')).toBeLessThanOrEqual(75);
    }

    // Verify presence of folded continuation line
    expect(ics).toMatch(/\r\n [A-Za-z]/);
  });

  it('produces VALUE=DATE when timeTbc is true and omits DTEND', () => {
    const events: IcsEvent[] = [
      {
        slug: 'tbc-event',
        title: 'TBC Event',
        startsAt: '2026-12-19T12:00:00Z',
        timeTbc: true,
      },
    ];
    const ics = buildIcs(events);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261219');
    expect(ics).not.toContain('DTEND');
  });

  it('allows round-trip parsing of DTSTART', () => {
    const events: IcsEvent[] = [
      {
        slug: 'solemnization',
        title: 'Wedding',
        startsAt: '2026-12-19T10:00:00.000Z',
      },
    ];
    const ics = buildIcs(events);
    const dtstartMatch = ics.match(/DTSTART:(\d{8}T\d{6}Z)/);
    expect(dtstartMatch).not.toBeNull();

    const timestamp = dtstartMatch![1]!;
    expect(timestamp).toBe('20261219T100000Z');
  });
});
