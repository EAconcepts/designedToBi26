import { encode } from 'next-auth/jwt';
import type { BrowserContext } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@example.com';
export const AUTH_SECRET =
  process.env.AUTH_SECRET || 'uqxfaUFAiALabLo2W9v79eSM4qiuE+JQmbkWTNvB7fU=';

export async function createAdminSessionToken(): Promise<string> {
  return await encode({
    token: { email: ADMIN_EMAIL },
    secret: AUTH_SECRET,
    salt: 'authjs.session-token',
  });
}

export async function addAdminSession(context: BrowserContext): Promise<void> {
  const token = await createAdminSessionToken();
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
