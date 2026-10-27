import { describe, expect, it } from 'vitest';
import {
  CreateGuestInput,
  UpdateGuestInput,
  AdminRsvpQueryInput,
  AdminGuestQueryInput,
  AdminUpdateGiftInput,
  AdminUploadSignInput,
  AdminCreatePhotoInput,
} from '@/lib/validation/admin';

describe('Admin create guest schema', () => {
  it('accepts valid input with defaults', () => {
    const parsed = CreateGuestInput.safeParse({
      displayName: 'Folake Adeleke',
      eventSlugs: ['solemnization', 'reception'],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.displayName).toBe('Folake Adeleke');
      expect(parsed.data.side).toBe('BOTH');
      expect(parsed.data.maxPartySize).toBe(1);
      expect(parsed.data.eventSlugs).toEqual(['solemnization', 'reception']);
    }
  });

  it('rejects invalid party sizes (< 1 or > 10)', () => {
    expect(
      CreateGuestInput.safeParse({
        displayName: 'Folake Adeleke',
        maxPartySize: 0,
        eventSlugs: ['solemnization'],
      }).success,
    ).toBe(false);

    expect(
      CreateGuestInput.safeParse({
        displayName: 'Folake Adeleke',
        maxPartySize: 11,
        eventSlugs: ['solemnization'],
      }).success,
    ).toBe(false);
  });

  it('requires at least one event slug', () => {
    expect(
      CreateGuestInput.safeParse({
        displayName: 'Folake Adeleke',
        eventSlugs: [],
      }).success,
    ).toBe(false);
  });
});

describe('Admin update guest schema', () => {
  it('allows partial fields for update', () => {
    const parsed = UpdateGuestInput.safeParse({
      maxPartySize: 4,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.maxPartySize).toBe(4);
    }
  });
});

describe('Admin queries and updates', () => {
  it('coerces nonResponders in AdminRsvpQueryInput', () => {
    const withStringTrue = AdminRsvpQueryInput.safeParse({
      nonResponders: 'true',
    });
    expect(withStringTrue.success).toBe(true);
    if (withStringTrue.success) {
      expect(withStringTrue.data.nonResponders).toBe(true);
    }

    const withBooleanFalse = AdminRsvpQueryInput.safeParse({
      nonResponders: false,
    });
    expect(withBooleanFalse.success).toBe(true);
    if (withBooleanFalse.success) {
      expect(withBooleanFalse.data.nonResponders).toBe(false);
    }
  });

  it('coerces page and limit in AdminGuestQueryInput with defaults', () => {
    const parsed = AdminGuestQueryInput.safeParse({
      page: '2',
      limit: '25',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(25);
    }

    const withDefaults = AdminGuestQueryInput.safeParse({});
    expect(withDefaults.success).toBe(true);
    if (withDefaults.success) {
      expect(withDefaults.data.page).toBe(1);
      expect(withDefaults.data.limit).toBe(50);
    }
  });

  it('allows only SUCCESS or ABANDONED in AdminUpdateGiftInput', () => {
    expect(AdminUpdateGiftInput.safeParse({ status: 'SUCCESS' }).success).toBe(true);
    expect(AdminUpdateGiftInput.safeParse({ status: 'ABANDONED' }).success).toBe(true);
    expect(AdminUpdateGiftInput.safeParse({ status: 'PENDING' }).success).toBe(false);
    expect(AdminUpdateGiftInput.safeParse({ status: 'FAILED' }).success).toBe(false);
  });
});

describe('Admin upload schemas', () => {
  it('accepts a valid album slug in AdminUploadSignInput and trims it', () => {
    const parsed = AdminUploadSignInput.safeParse({ albumSlug: '  pre-wedding  ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.albumSlug).toBe('pre-wedding');
    }
  });

  it('rejects empty or unsafe album slugs (path traversal guard)', () => {
    expect(AdminUploadSignInput.safeParse({ albumSlug: '' }).success).toBe(false);
    expect(AdminUploadSignInput.safeParse({ albumSlug: '../../etc' }).success).toBe(false);
    expect(AdminUploadSignInput.safeParse({ albumSlug: 'Pre Wedding' }).success).toBe(false);
    expect(AdminUploadSignInput.safeParse({}).success).toBe(false);
  });

  it('accepts a full AdminCreatePhotoInput payload', () => {
    const parsed = AdminCreatePhotoInput.safeParse({
      publicId: 'wedding/admin-uploads/pre-wedding/2026/10/abcdef0123456789',
      albumSlug: 'pre-wedding',
      altText: 'The couple walking on the beach',
      caption: 'Sunset stroll',
    });
    expect(parsed.success).toBe(true);
  });

  it('makes altText and caption optional and nullable', () => {
    const base = {
      publicId: 'wedding/admin-uploads/pre-wedding/2026/10/abcdef0123456789',
      albumSlug: 'pre-wedding',
    };
    expect(AdminCreatePhotoInput.safeParse(base).success).toBe(true);
    expect(AdminCreatePhotoInput.safeParse({ ...base, altText: null, caption: null }).success).toBe(
      true,
    );
  });

  it('rejects missing or unsafe publicId values', () => {
    const base = { albumSlug: 'pre-wedding' };
    expect(AdminCreatePhotoInput.safeParse({ ...base, publicId: '' }).success).toBe(false);
    expect(AdminCreatePhotoInput.safeParse({ ...base }).success).toBe(false);
    expect(
      AdminCreatePhotoInput.safeParse({ ...base, publicId: 'wedding/x/../evil' }).success,
    ).toBe(false);
    expect(AdminCreatePhotoInput.safeParse({ ...base, publicId: 'has spaces here' }).success).toBe(
      false,
    );
  });

  it('rejects altText or caption longer than 300 characters', () => {
    const base = {
      publicId: 'wedding/admin-uploads/pre-wedding/2026/10/abcdef0123456789',
      albumSlug: 'pre-wedding',
    };
    expect(AdminCreatePhotoInput.safeParse({ ...base, altText: 'a'.repeat(301) }).success).toBe(
      false,
    );
    expect(AdminCreatePhotoInput.safeParse({ ...base, caption: 'b'.repeat(301) }).success).toBe(
      false,
    );
  });
});
