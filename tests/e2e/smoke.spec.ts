import { test, expect } from '@playwright/test';

test.describe('Smoke Spec', () => {
  test('loads home page, validates single h1, zero console errors, and verifies skip link', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Track console errors and unhandled exceptions
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // 1. Visit root
    await page.goto('/');

    // 2. Validate single h1
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toContainText('Adetolani & Emmanuel');

    // 3. Skip link accessibility check
    // Press Tab from initial page load to focus skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeFocused();

    // Trigger skip link
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main');
    await expect(mainContent).toBeFocused();

    // 4. Assert zero console errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
