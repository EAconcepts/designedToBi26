import { expect, test } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const ADMIN_EMAIL = 'admin@example.com';
const AUTH_SECRET = process.env.AUTH_SECRET || 'uqxfaUFAiALabLo2W9v79eSM4qiuE+JQmbkWTNvB7fU=';

async function createAdminSessionToken() {
  return await encode({
    token: { email: ADMIN_EMAIL },
    secret: AUTH_SECRET,
    salt: 'authjs.session-token',
  });
}

test.describe('Admin RSVP & Guest Management E2E', () => {
  test('unauthenticated visitor to /admin/rsvps is redirected to signin', async ({ page }) => {
    await page.goto('/admin/rsvps');
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
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
