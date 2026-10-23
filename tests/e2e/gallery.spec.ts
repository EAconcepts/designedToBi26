import { expect, test } from '@playwright/test';

test.describe('Gallery & Albums E2E', () => {
  test('gallery directory displays albums with mode-aware locked states', async ({ page }) => {
    await page.goto('/gallery');

    // Editorial Header
    await expect(page.getByRole('heading', { name: /wedding gallery/i })).toBeVisible();

    // In PRE mode:
    // Pre-wedding is accessible
    await expect(page.getByRole('heading', { name: /pre-wedding/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pre-wedding/i })).toBeVisible();

    // Wedding Day and Guest Moments show Coming Soon locked states
    const comingSoonBadges = page.getByText(/coming soon/i);
    await expect(comingSoonBadges.first()).toBeVisible();

    await expect(page.getByRole('heading', { name: /wedding day/i })).toBeVisible();
    await expect(page.getByText(/unlocked on the wedding day/i)).toBeVisible();

    await expect(page.getByRole('heading', { name: /guest moments/i })).toBeVisible();
    await expect(page.getByText(/unlocked following the wedding celebration/i)).toBeVisible();
  });

  test('navigates to unlocked album detail, displays photos and supports lightbox', async ({
    page,
  }) => {
    await page.goto('/gallery');

    // Click on pre-wedding album (generous timeout: dev compiles the [album] route on demand)
    await page.getByRole('link', { name: /pre-wedding/i }).click();
    await expect(page).toHaveURL(/.*\/gallery\/pre-wedding/, { timeout: 30_000 });

    // Verify detail header and photo count
    await expect(page.getByRole('heading', { name: /pre-wedding/i })).toBeVisible();
    await expect(page.getByText(/7 photographs curated with care/i)).toBeVisible();

    // Verify photo grid rendered
    const photoButtons = page.getByRole('button', { name: /view photo/i });
    await expect(photoButtons.first()).toBeVisible();

    // Click first photo to open Lightbox
    await photoButtons.first().click();
    await expect(page.getByRole('dialog', { name: /image viewer/i })).toBeVisible();
    await expect(page.getByText(/1 \/ 7/)).toBeVisible();

    // Close lightbox
    await page.getByRole('button', { name: /close image viewer/i }).click();
    await expect(page.getByRole('dialog', { name: /image viewer/i })).not.toBeVisible();

    // Click back link
    await page.getByRole('link', { name: /back to all collections/i }).click();
    await expect(page).toHaveURL(/\/gallery$/);
  });

  test('returns 404 for locked albums and unknown slugs (zero existence leak)', async ({
    page,
  }) => {
    // 1. Locked album URL directly
    const resLocked = await page.goto('/gallery/wedding-day');
    expect(resLocked?.status()).toBe(404);

    // 2. Random non-existent slug
    const resUnknown = await page.goto('/gallery/completely-unknown-slug');
    expect(resUnknown?.status()).toBe(404);
  });
});
