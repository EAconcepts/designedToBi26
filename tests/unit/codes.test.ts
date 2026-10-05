import { describe, it, expect } from 'vitest';
import { newGuestCode, normalizeGuestCode, isValidGuestCode, CODE_ALPHABET } from '@/lib/codes';

describe('lib/codes', () => {
  it('CODE_ALPHABET contains no confusing characters (0, O, 1, I, l)', () => {
    const forbidden = ['0', 'O', 'o', '1', 'I', 'i', 'l', 'L'];
    for (const char of forbidden) {
      expect(CODE_ALPHABET).not.toContain(char);
    }
  });

  it('generates an 8-character code strictly from the alphabet', () => {
    const code = newGuestCode();
    expect(code).toHaveLength(8);
    for (const ch of code) {
      expect(CODE_ALPHABET).toContain(ch);
    }
    expect(isValidGuestCode(code)).toBe(true);
  });

  it('normalizes codes by trimming whitespace and lowercasing', () => {
    expect(normalizeGuestCode('  aBc23456  ')).toBe('abc23456');
  });

  it('generates 10,000 unique codes with zero collisions', () => {
    const iterations = 10000;
    const generated = new Set<string>();

    for (let i = 0; i < iterations; i++) {
      const code = newGuestCode();
      expect(code).toHaveLength(8);
      generated.add(code);
    }

    expect(generated.size).toBe(iterations);
  });
});
