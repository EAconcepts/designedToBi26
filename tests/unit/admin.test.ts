import { describe, it, expect } from 'vitest';
import { isAdmin } from '@/lib/admin';
import { env } from '@/lib/env';

describe('Admin Allowlist Validation (lib/admin.ts)', () => {
  const getAllowedEmail = () => {
    const first = env.server.ADMIN_ALLOWLIST.split(',')[0];
    return first ? first.trim() : 'admin@example.com';
  };

  it('returns true for allowlisted emails', () => {
    const allowed = getAllowedEmail();
    expect(isAdmin(allowed)).toBe(true);
  });

  it('handles case-insensitivity correctly', () => {
    const allowed = getAllowedEmail();
    expect(isAdmin(allowed.toUpperCase())).toBe(true);
  });

  it('handles surrounding whitespace gracefully', () => {
    const allowed = getAllowedEmail();
    expect(isAdmin(`  ${allowed}  `)).toBe(true);
  });

  it('returns false for non-allowlisted emails', () => {
    expect(isAdmin('attacker@malicious.com')).toBe(false);
    expect(isAdmin('intruder@example.org')).toBe(false);
  });

  it('returns false for empty or falsy inputs', () => {
    expect(isAdmin('')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('   ')).toBe(false);
  });
});
