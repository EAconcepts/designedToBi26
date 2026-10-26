import { describe, expect, it } from 'vitest';
import { generateAdminPublicId, generateGuestPublicId } from '@/lib/uploads';

describe('generateAdminPublicId', () => {
  const now = new Date(Date.UTC(2026, 0, 5, 12, 0, 0)); // 2026-01-05

  it('builds a folder-scoped publicId under wedding/admin-uploads', () => {
    const { publicId, folder } = generateAdminPublicId('pre-wedding', now);

    expect(folder).toBe('wedding/admin-uploads/pre-wedding/2026/01');
    expect(publicId).toMatch(/^wedding\/admin-uploads\/pre-wedding\/2026\/01\/[0-9a-f]{16}$/);
  });

  it('pads single-digit months', () => {
    const { folder } = generateAdminPublicId('wedding-day', new Date(Date.UTC(2026, 11, 31)));
    expect(folder).toBe('wedding/admin-uploads/wedding-day/2026/12');
  });

  it('produces unique ids for identical inputs', () => {
    const a = generateAdminPublicId('pre-wedding', now);
    const b = generateAdminPublicId('pre-wedding', now);
    expect(a.publicId).not.toBe(b.publicId);
  });
});

describe('generateGuestPublicId', () => {
  it('builds a date-scoped guest folder id', () => {
    const { publicId, folder } = generateGuestPublicId(new Date(Date.UTC(2026, 9, 19)));
    expect(folder).toBe('wedding/guest-uploads/2026/10');
    expect(publicId).toMatch(/^wedding\/guest-uploads\/2026\/10\/[0-9a-f]{16}$/);
  });
});
