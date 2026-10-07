import { expect, test } from '@playwright/test';

test('home has its planned section anchors and navigation targets', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const id of ['story', 'events', 'venue', 'details', 'rsvp']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('main section')).toHaveCount(10);
  await expect(page.locator('nav a[href="#story"]')).toBeVisible();
  await expect(page.locator('nav a[href="#events"]')).toBeVisible();
  await expect(page.locator('nav a[href="#venue"]')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'RSVP' }),
  ).toBeVisible();
});
