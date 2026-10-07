import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/rsvp', '/gift', '/gallery', '/thank-you', '/privacy'];

test.describe('Accessibility (Axe)', () => {
  for (const route of ROUTES) {
    test(`zero serious/critical violations on ${route}`, async ({ page }) => {
      await page.goto(route);

      // If opening sequence modal is active on home, dismiss it for main page audit
      const skipIntro = page.getByRole('button', { name: /skip introduction/i });
      if (await skipIntro.isVisible({ timeout: 500 }).catch(() => false)) {
        await skipIntro.click();
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = results.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );

      if (seriousOrCritical.length > 0) {
        console.error(
          `A11y violations on ${route}:`,
          JSON.stringify(
            seriousOrCritical.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => n.target),
            })),
            null,
            2,
          ),
        );
      }

      expect(seriousOrCritical).toEqual([]);
    });
  }
});
