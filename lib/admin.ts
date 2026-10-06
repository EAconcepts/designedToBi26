import { auth } from '@/lib/auth';
import { env } from '@/lib/env';

/**
 * Checks whether an email is in the ADMIN_ALLOWLIST (case-insensitive, trimmed).
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = new Set(
    env.server.ADMIN_ALLOWLIST.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  return allowlist.has(email.trim().toLowerCase());
}

/**
 * Server-side guard returning the authenticated admin user or null.
 * Enforces defense-in-depth: checks the session and re-verifies the allow-list.
 */
export async function requireAdmin(): Promise<{ email: string } | null> {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email || !isAdmin(email)) {
      return null;
    }

    return {
      email: email.trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}
