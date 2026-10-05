import { describe, it, expect } from 'vitest';
import {
  formatDateWAT,
  formatTimeWAT,
  formatDateTimeWAT,
  isBeforeDeadline,
  countdownTargetISO,
  WAT_TIME_ZONE,
} from '@/lib/datetime';

describe('lib/datetime', () => {
  it('formats a UTC instant 2026-12-19T10:00:00Z as 11:00 in Africa/Lagos', () => {
    const utcDate = new Date('2026-12-19T10:00:00Z');
    const timeWAT = formatTimeWAT(utcDate);
    expect(timeWAT).toBe('11:00');
  });

  it('formatDateWAT outputs full, short, and month-day representations in Africa/Lagos', () => {
    const d = new Date('2026-12-19T10:00:00Z');
    expect(formatDateWAT(d, 'full')).toContain('Saturday');
    expect(formatDateWAT(d, 'full')).toContain('19 December 2026');
    expect(formatDateWAT(d, 'short')).toContain('19 Dec 2026');
    expect(formatDateWAT(d, 'month-day')).toBe('19 December');
  });

  it('formatDateTimeWAT combines date and time in WAT', () => {
    const d = new Date('2026-12-19T10:00:00Z');
    const full = formatDateTimeWAT(d);
    expect(full).toContain('19 December 2026');
    expect(full).toContain('11:00');
  });

  it('isBeforeDeadline correctly evaluates around the midnight boundary in WAT', () => {
    const deadlineStr = '2026-12-05';

    // 2026-12-05 23:59:59 WAT is 2026-12-05 22:59:59 UTC
    const beforeDeadline = new Date('2026-12-05T22:59:59.000Z');
    expect(isBeforeDeadline(beforeDeadline, deadlineStr)).toBe(true);

    // 2026-12-06 00:00:01 WAT is 2026-12-05 23:00:01 UTC
    const afterDeadline = new Date('2026-12-05T23:00:01.000Z');
    expect(isBeforeDeadline(afterDeadline, deadlineStr)).toBe(false);
  });

  it('countdownTargetISO returns a valid ISO date matching solemnization startsAt', () => {
    const iso = countdownTargetISO();
    expect(iso).toBeDefined();
    const parsed = new Date(iso);
    expect(parsed.getTime()).not.toBeNaN();
    expect(formatTimeWAT(parsed)).toBe('11:00');
  });

  it('WAT_TIME_ZONE constant is Africa/Lagos', () => {
    expect(WAT_TIME_ZONE).toBe('Africa/Lagos');
  });
});
