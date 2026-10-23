import { describe, it, expect } from 'vitest';
import {
  trimmedString,
  slugSchema,
  positiveIntMinor,
  emailSchema,
  phoneSchema,
} from '@/lib/validation/common';

describe('lib/validation/common', () => {
  it('trimmedString trims whitespace and enforces bounds', () => {
    const schema = trimmedString(2, 10);
    expect(schema.parse('  hello  ')).toBe('hello');
    expect(() => schema.parse(' a ')).toThrow();
    expect(() => schema.parse('12345678901')).toThrow();
  });

  it('slugSchema accepts valid kebab-case slugs and rejects invalid ones', () => {
    expect(slugSchema.parse('solemnization-ceremony')).toBe('solemnization-ceremony');
    expect(slugSchema.parse('reception')).toBe('reception');
    expect(() => slugSchema.parse('Invalid Slug')).toThrow();
    expect(() => slugSchema.parse('invalid--slug')).toThrow();
    expect(() => slugSchema.parse('-invalid')).toThrow();
  });

  it('positiveIntMinor requires positive integers', () => {
    expect(positiveIntMinor.parse(10000)).toBe(10000);
    expect(() => positiveIntMinor.parse(0)).toThrow();
    expect(() => positiveIntMinor.parse(-50)).toThrow();
    expect(() => positiveIntMinor.parse(10.5)).toThrow();
  });

  it('emailSchema and phoneSchema validate appropriate formats', () => {
    expect(emailSchema.parse('Couple@Example.Com')).toBe('couple@example.com');
    expect(() => emailSchema.parse('not-an-email')).toThrow();

    expect(phoneSchema.parse('+234 813 643 7963')).toBe('+234 813 643 7963');
    expect(() => phoneSchema.parse('12')).toThrow();
  });
});
