import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const GUEST_COOKIE_NAME = 'guest_session';
export const GUEST_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

// Guest ids are cuids; the HMAC signature is the real guarantee — this only
// rejects obviously malformed values before hitting the database.
const GUEST_ID_PATTERN = /^[a-z0-9]{10,64}$/;

function isValidGuestId(id: string): boolean {
  return GUEST_ID_PATTERN.test(id);
}

export function signGuestId(id: string, secret: string = env.server.GUEST_COOKIE_SECRET): string {
  const hmac = createHmac('sha256', secret).update(id).digest('hex');
  return `${id}.${hmac}`;
}

export function verifyGuestToken(
  token: string,
  secret: string = env.server.GUEST_COOKIE_SECRET,
): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [id, providedSignature] = parts;
  if (!id || !providedSignature || !isValidGuestId(id)) return null;

  const expectedSignature = createHmac('sha256', secret).update(id).digest('hex');

  try {
    const a = Buffer.from(providedSignature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  return id;
}

export function setGuestCookie(
  response: NextResponse,
  id: string,
  secret: string = env.server.GUEST_COOKIE_SECRET,
): void {
  const token = signGuestId(id, secret);
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
}

export function clearGuestCookie(response: NextResponse): void {
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: 0,
  });
}

export function getGuestId(
  req: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } },
  secret: string = env.server.GUEST_COOKIE_SECRET,
): string | null {
  const cookie = req.cookies.get(GUEST_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyGuestToken(cookie.value, secret);
}
