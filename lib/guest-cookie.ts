import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { isValidGuestCode, normalizeGuestCode } from './codes';

export const GUEST_COOKIE_NAME = 'guest_session';
export const GUEST_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

export function signGuestCode(
  code: string,
  secret: string = env.server.GUEST_COOKIE_SECRET,
): string {
  const normalized = normalizeGuestCode(code);
  const hmac = createHmac('sha256', secret).update(normalized).digest('hex');
  return `${normalized}.${hmac}`;
}

export function verifyGuestToken(
  token: string,
  secret: string = env.server.GUEST_COOKIE_SECRET,
): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [code, providedSignature] = parts;
  if (!code || !providedSignature || !isValidGuestCode(code)) return null;

  const expectedSignature = createHmac('sha256', secret).update(code).digest('hex');

  try {
    const a = Buffer.from(providedSignature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  return code;
}

export function setGuestCookie(
  response: NextResponse,
  code: string,
  secret: string = env.server.GUEST_COOKIE_SECRET,
): void {
  const token = signGuestCode(code, secret);
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

export function getGuestCode(
  req: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } },
  secret: string = env.server.GUEST_COOKIE_SECRET,
): string | null {
  const cookie = req.cookies.get(GUEST_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyGuestToken(cookie.value, secret);
}
