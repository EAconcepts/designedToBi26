import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { verifyPaystackSignature } from '@/lib/paystack';
import { env } from '@/lib/env';

describe('Paystack Signature Verification', () => {
  const secret = env.server.PAYSTACK_SECRET_KEY;
  const rawBody = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'gift_test123', amount: 500000 },
  });

  function makeSignature(body: string, sec = secret): string {
    return crypto.createHmac('sha512', sec).update(body).digest('hex');
  }

  it('accepts a valid HMAC-SHA512 signature', () => {
    const validSig = makeSignature(rawBody);
    expect(verifyPaystackSignature(rawBody, validSig)).toBe(true);
  });

  it('proves length-guard regression: short signature returns false without crashing', () => {
    const shortSig = 'abcd1234';
    expect(() => verifyPaystackSignature(rawBody, shortSig)).not.toThrow();
    expect(verifyPaystackSignature(rawBody, shortSig)).toBe(false);
  });

  it('returns false for non-hex signature without crashing', () => {
    const nonHex = 'zz'.repeat(64);
    expect(() => verifyPaystackSignature(rawBody, nonHex)).not.toThrow();
    expect(verifyPaystackSignature(rawBody, nonHex)).toBe(false);
  });

  it('returns false for empty or null signature', () => {
    expect(verifyPaystackSignature(rawBody, null)).toBe(false);
    expect(verifyPaystackSignature(rawBody, '')).toBe(false);
    expect(verifyPaystackSignature(rawBody, undefined as unknown as string)).toBe(false);
  });

  it('returns false for signature generated with a different secret', () => {
    const wrongSecretSig = makeSignature(rawBody, 'different-secret-key-123456');
    expect(verifyPaystackSignature(rawBody, wrongSecretSig)).toBe(false);
  });

  it('returns false for signature generated for a different payload body', () => {
    const differentBodySig = makeSignature('different body content');
    expect(verifyPaystackSignature(rawBody, differentBodySig)).toBe(false);
  });
});
