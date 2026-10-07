import { expect, test } from '@playwright/test';

test('opening sequence runs once per session and can be skipped', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('opening-sequence')).toBeVisible({ timeout: 3000 });

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('opening-sequence')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('opening-sequence')).toHaveCount(0);
});

test('opening sequence never appears in reduced-motion mode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /adetolani|emmanuel/i })).toBeVisible({
    timeout: 1000,
  });
  await expect(page.getByTestId('opening-sequence')).toHaveCount(0);
});
