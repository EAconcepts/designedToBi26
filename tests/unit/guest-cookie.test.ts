import { describe, it, expect } from 'vitest';
import {
  signGuestId,
  verifyGuestToken,
  getGuestId,
  setGuestCookie,
  clearGuestCookie,
  GUEST_COOKIE_NAME,
} from '@/lib/guest-cookie';
import { NextResponse } from 'next/server';

describe('lib/guest-cookie', () => {
  const secretA = 'secret-a-for-testing-only-1234567890';
  const secretB = 'secret-b-different-key-123456789012';
  const validId = 'clx1234567890abcdefghijk';

  it('performs clean round-trip signing and verification', () => {
    const token = signGuestId(validId, secretA);
    const verified = verifyGuestToken(token, secretA);
    expect(verified).toBe(validId);
  });

  it('returns null on tampered id or signature', () => {
    const token = signGuestId(validId, secretA);
    const [id, sig] = token.split('.');

    // Tamper id
    expect(verifyGuestToken(`abcdefghij0123456789abcde.${sig}`, secretA)).toBeNull();

    // Tamper signature
    const badSig = sig!.slice(0, -2) + '00';
    expect(verifyGuestToken(`${id}.${badSig}`, secretA)).toBeNull();
  });

  it('returns null when verified with a different secret', () => {
    const token = signGuestId(validId, secretA);
    expect(verifyGuestToken(token, secretB)).toBeNull();
  });

  it('returns null on garbage inputs', () => {
    expect(verifyGuestToken('', secretA)).toBeNull();
    expect(verifyGuestToken('invalid-token-without-dot', secretA)).toBeNull();
    expect(verifyGuestToken('a.b.c', secretA)).toBeNull();
    // Uppercase ids do not match the cuid shape
    expect(verifyGuestToken('VALIDGUESTID00000.signature', secretA)).toBeNull();
    // Too short to be a real id
    expect(verifyGuestToken('abc.signature', secretA)).toBeNull();
  });

  it('sets and clears cookies on NextResponse', () => {
    const res = NextResponse.json({ ok: true });
    setGuestCookie(res, validId, secretA);

    const cookie = res.cookies.get(GUEST_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toContain(validId);
    expect(cookie?.httpOnly).toBe(true);

    const dummyReq = {
      cookies: {
        get: (name: string) => (name === GUEST_COOKIE_NAME ? { value: cookie!.value } : undefined),
      },
    };
    expect(getGuestId(dummyReq, secretA)).toBe(validId);

    clearGuestCookie(res);
    const cleared = res.cookies.get(GUEST_COOKIE_NAME);
    expect(cleared?.maxAge).toBe(0);
  });
});
