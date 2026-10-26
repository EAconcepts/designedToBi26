import { expect, test } from '@playwright/test';
import { addAdminSession } from './admin-session';

test.describe('Guest Upload Flow E2E (Subphase 3.4)', () => {
  test('shows the inactive screen when the upload window is closed', async ({ page }) => {
    // uploadsOpen defaults to false in PRE mode; no token is required anymore
    await page.goto('/upload');

    await expect(page.getByRole('heading', { name: /Upload Link Inactive/i })).toBeVisible();
    await expect(page.getByText(/Guest uploads are not open at this time/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /return to celebration homepage/i })).toBeVisible();
  });

  test('renders the upload dropzone when the upload window is open', async ({ context, page }) => {
    await addAdminSession(context);

    // Open the window via the admin settings API (no token involved)
    await page.request.post('/api/admin/settings', {
      data: { uploadsOpen: true },
      headers: { 'Content-Type': 'application/json' },
    });

    await page.goto('/upload');

    await expect(page.getByRole('heading', { name: /Share Your Moments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Drag & drop photos here/i })).toBeVisible();
  });
});
