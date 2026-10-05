import { describe, expect, it } from 'vitest';
import { validateEnv } from '@/lib/env';

describe('validateEnv function', () => {
  const validMockEnv: Record<string, string> = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/wedding_dev',
    DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/wedding_dev',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    AUTH_SECRET: 'test-auth-secret-1234567890123456',
    GUEST_COOKIE_SECRET: 'test-guest-secret-1234567890123456',
    ADMIN_ALLOWLIST: 'admin@example.com',
    NOTIFY_EMAIL: 'notify@example.com',
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'noreply@example.com',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    CLOUDINARY_API_KEY: '1234567890',
    CLOUDINARY_API_SECRET: 'test_secret',
    CLOUDINARY_UPLOAD_PRESET: 'test_preset',
    PAYSTACK_SECRET_KEY: 'sk_test_key',
  };

  it('validates and returns parsed environment when all required variables are present', () => {
    const result = validateEnv(validMockEnv);
    expect(result.server.DATABASE_URL).toBe(validMockEnv.DATABASE_URL);
    expect(result.public.NEXT_PUBLIC_SITE_URL).toBe(validMockEnv.NEXT_PUBLIC_SITE_URL);
  });

  it('fails fast with an error message explicitly naming missing keys', () => {
    const invalidEnv = { ...validMockEnv };
    delete invalidEnv.DATABASE_URL;
    delete invalidEnv.NEXT_PUBLIC_SITE_URL;

    expect(() => validateEnv(invalidEnv)).toThrowError(/DATABASE_URL/);
    expect(() => validateEnv(invalidEnv)).toThrowError(/NEXT_PUBLIC_SITE_URL/);
  });

  it('ignores extra undefined environment variables', () => {
    const envWithExtra = {
      ...validMockEnv,
      EXTRA_UNUSED_VAR: 'unexpected_value',
    };

    const result = validateEnv(envWithExtra);
    expect(result.server.DATABASE_URL).toBe(validMockEnv.DATABASE_URL);
    // @ts-expect-error verifying extra variable is not typed/present on parsed server
    expect(result.server.EXTRA_UNUSED_VAR).toBeUndefined();
  });

  it('fails when an invalid email is provided for NOTIFY_EMAIL', () => {
    const invalidEmailEnv = {
      ...validMockEnv,
      NOTIFY_EMAIL: 'not-an-email',
    };

    expect(() => validateEnv(invalidEmailEnv)).toThrowError(/NOTIFY_EMAIL/);
  });
});
