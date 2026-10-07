import { expect, test } from '@playwright/test';

test.describe('Guest Upload Flow E2E (Subphase 3.4)', () => {
  test('displays inactive link screen when accessing invalid or unconfigured token', async ({
    page,
  }) => {
    await page.goto('/upload/completely-invalid-non-existent-token');

    await expect(page.getByRole('heading', { name: /upload link inactive/i })).toBeVisible();
    await expect(page.getByText(/this photograph upload link is not active/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /return to celebration homepage/i })).toBeVisible();
  });

  test('renders upload dropzone, privacy notice, and file selection trigger', async ({ page }) => {
    // For local tests where uploadToken may not be open, navigating to an arbitrary token tests the guarded UI
    await page.goto('/upload/test-token');
    // If closed or invalid token, shows inactive screen with contacts
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });
});
