import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor, formatNGN } from '@/lib/money';

describe('lib/money', () => {
  it('toMinor(0.5) converts 0.5 Naira to 50 kobo', () => {
    expect(toMinor(0.5)).toBe(50);
  });

  it('toMinor correctly rounds decimal values like 1234.567', () => {
    expect(toMinor(1234.567)).toBe(123457);
    expect(toMinor(100.004)).toBe(10000);
    expect(toMinor(100.005)).toBe(10001);
  });

  it('fromMinor converts kobo back to major currency units', () => {
    expect(fromMinor(50)).toBe(0.5);
    expect(fromMinor(100000)).toBe(1000);
    expect(fromMinor(123457)).toBe(1234.57);
  });

  it('formatNGN outputs proper shape with Naira symbol and formatting', () => {
    expect(formatNGN(500000)).toBe('₦5,000');
    expect(formatNGN(500050)).toBe('₦5,000.50');
    expect(formatNGN(10000000)).toBe('₦100,000');
  });

  it('formatNGN supports compact notation', () => {
    const compactOutput = formatNGN(5000000, { compact: true }); // ₦50,000
    expect(compactOutput).toMatch(/^₦\d+/);
  });
});
