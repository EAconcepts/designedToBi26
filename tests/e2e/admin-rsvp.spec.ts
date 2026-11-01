import { expect, test } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { ADMIN_EMAIL, AUTH_SECRET, createAdminSessionToken } from './admin-session';

// Fabricate the verification token exactly as Auth.js v5 stores it:
// sha256(`${rawToken}${AUTH_SECRET}`) — see @auth/core send-token.
async function createMagicLinkToken(): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  const hashed = createHash('sha256').update(`${raw}${AUTH_SECRET}`).digest('hex');

  const urls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
    'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
  ].filter(Boolean) as string[];

  for (const url of new Set(urls)) {
    const client = new PrismaClient({ datasources: { db: { url } } });
    await client.verificationToken.create({
      data: {
        identifier: ADMIN_EMAIL,
        token: hashed,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await client.$disconnect();
  }
  return raw;
}

test.describe('Admin RSVP & Guest Management E2E', () => {
  test('unauthenticated visitor to /admin/rsvps is redirected to signin', async ({ page }) => {
    await page.goto('/admin/rsvps');
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
  });

  test('magic-link sign-in returns the admin to the dashboard, not the public site', async ({
    page,
  }) => {
    // 1. The unauthenticated redirect preserves the intended destination
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/api\/auth\/signin\?callbackUrl=%2Fadmin/);

    // 2. Follow the email link exactly as Auth.js would build it
    const rawToken = await createMagicLinkToken();
    await page.goto(
      `/api/auth/callback/brevo?callbackUrl=%2Fadmin&token=${rawToken}&email=${encodeURIComponent(
        ADMIN_EMAIL,
      )}`,
    );

    // 3. Signed in and back on the admin dashboard
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('authenticated admin can view RSVP dashboard, filters, and manual modal', async ({
    context,
    page,
  }) => {
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

    await page.goto('/admin/rsvps');
    await expect(page).toHaveURL('/admin/rsvps');

    // Verify Dashboard Headings & Stats
    await expect(page.getByRole('heading', { name: 'RSVP Responses' })).toBeVisible();
    await expect(page.getByText('Attending (Headcount)')).toBeVisible();
    await expect(page.locator('p', { hasText: /^Declined$/ })).toBeVisible();
    await expect(page.getByText('Pending Response')).toBeVisible();

    // Verify CSV Export link exists
    const exportLink = page.getByRole('link', { name: /export csv/i });
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toHaveAttribute('href', '/api/admin/rsvps/export');

    // Verify Search and Filter controls
    const searchInput = page.getByPlaceholder('Search by name, email, phone...');
    await expect(searchInput).toBeVisible();

    // Check Log/Edit RSVP action if guests are present
    const actionBtn = page.getByRole('button', { name: /Log RSVP|Edit RSVP/i }).first();
    if (await actionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actionBtn.click();
      await expect(page.getByRole('heading', { name: /Manual RSVP/i })).toBeVisible();
      await page.getByRole('button', { name: /cancel/i }).click();
    }
  });

  test('authenticated admin can view guest directory', async ({ context, page }) => {
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

    await page.goto('/admin/guests');
    await expect(page).toHaveURL('/admin/guests');

    await expect(page.getByRole('heading', { name: 'Guest Directory' })).toBeVisible();
    await expect(page.getByRole('button', { name: /add guest/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search by name, phone...')).toBeVisible();
  });
});
