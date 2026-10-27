import { expect, test } from '@playwright/test';
import { addAdminSession } from './admin-session';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Admin Media Upload E2E', () => {
  test('unauthenticated visitor to /admin/media is redirected to signin', async ({ page }) => {
    await page.goto('/admin/media');
    await expect(page).toHaveURL(/.*\/api\/auth\/signin.*/);
  });

  test('admin can queue a photo, fill metadata, and publish it to an album', async ({
    context,
    page,
  }) => {
    await addAdminSession(context);

    // Stub the browser-bound legs of the pipeline: storage transfer + Photo
    // registration (which would otherwise verify the asset on real Cloudinary).
    // The sign endpoint runs for real against the test database.
    await page.route('https://api.cloudinary.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ public_id: 'wedding/admin-uploads/pre-wedding/2026/10/stub' }),
      }),
    );
    await page.route('**/api/admin/media', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { photoId: 'stub-photo-id', existing: false } }),
          })
        : route.continue(),
    );

    await page.goto('/admin/media');
    await expect(page.getByRole('heading', { name: 'Media Moderation' })).toBeVisible();

    // 1. Open the upload panel — album defaults to the seeded pre-wedding album
    await page.getByRole('button', { name: 'Upload Photos' }).click();
    const albumSelect = page.getByLabel('Add to album');
    await expect(albumSelect).toBeVisible();
    await expect(albumSelect).toHaveValue('pre-wedding');

    // 2. Queue a file — it appears with alt text + caption metadata inputs
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'couple-portrait.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.locator('span').filter({ hasText: 'couple-portrait.png' })).toBeVisible();
    await expect(page.getByPlaceholder('Alt text (accessibility)')).toBeVisible();
    await expect(page.getByPlaceholder('Caption / memory note')).toBeVisible();

    const uploadButton = page.getByRole('button', { name: 'Upload 1 Photo' });
    await expect(uploadButton).toBeEnabled();

    await page.getByPlaceholder('Alt text (accessibility)').fill('The couple at sunset');

    // 3. Run the pipeline: sign (real) → Cloudinary (stubbed) → register (stubbed)
    await uploadButton.click();

    await expect(page.getByText('1 photo uploaded and published.')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Uploaded', { exact: true })).toBeVisible();
  });

  test('unsupported files are skipped with an inline notice and do not enable upload', async ({
    context,
    page,
  }) => {
    await addAdminSession(context);

    await page.goto('/admin/media');
    await page.getByRole('button', { name: 'Upload Photos' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });

    await expect(page.getByText(/skipped — only/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload 0 Photos' })).toBeDisabled();
  });
});
