import { describe, it, expect } from 'vitest';
import {
  signGuestCode,
  verifyGuestToken,
  getGuestCode,
  setGuestCookie,
  clearGuestCookie,
  GUEST_COOKIE_NAME,
} from '@/lib/guest-cookie';
import { NextResponse } from 'next/server';

describe('lib/guest-cookie', () => {
  const secretA = 'secret-a-for-testing-only-1234567890';
  const secretB = 'secret-b-different-key-123456789012';
  const validCode = '23456789';

  it('performs clean round-trip signing and verification', () => {
    const token = signGuestCode(validCode, secretA);
    const verified = verifyGuestToken(token, secretA);
    expect(verified).toBe(validCode);
  });

  it('returns null on tampered code or signature', () => {
    const token = signGuestCode(validCode, secretA);
    const [code, sig] = token.split('.');

    // Tamper code
    expect(verifyGuestToken(`abcdefgh.${sig}`, secretA)).toBeNull();

    // Tamper signature
    const badSig = sig!.slice(0, -2) + '00';
    expect(verifyGuestToken(`${code}.${badSig}`, secretA)).toBeNull();
  });

  it('returns null when verified with a different secret', () => {
    const token = signGuestCode(validCode, secretA);
    expect(verifyGuestToken(token, secretB)).toBeNull();
  });

  it('returns null on garbage inputs', () => {
    expect(verifyGuestToken('', secretA)).toBeNull();
    expect(verifyGuestToken('invalid-token-without-dot', secretA)).toBeNull();
    expect(verifyGuestToken('a.b.c', secretA)).toBeNull();
    expect(verifyGuestToken('00000000.signature', secretA)).toBeNull(); // 0 is not in alphabet
  });

  it('sets and clears cookies on NextResponse', () => {
    const res = NextResponse.json({ ok: true });
    setGuestCookie(res, validCode, secretA);

    const cookie = res.cookies.get(GUEST_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toContain(validCode);
    expect(cookie?.httpOnly).toBe(true);

    const dummyReq = {
      cookies: {
        get: (name: string) => (name === GUEST_COOKIE_NAME ? { value: cookie!.value } : undefined),
      },
    };
    expect(getGuestCode(dummyReq, secretA)).toBe(validCode);

    clearGuestCookie(res);
    const cleared = res.cookies.get(GUEST_COOKIE_NAME);
    expect(cleared?.maxAge).toBe(0);
  });
});
