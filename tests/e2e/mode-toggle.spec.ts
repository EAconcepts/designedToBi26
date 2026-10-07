import { expect, test, type APIRequestContext } from '@playwright/test';
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

async function setModeViaApi(request: APIRequestContext, mode: 'PRE' | 'LIVE' | 'POST') {
  const token = await createAdminSessionToken();
  await request.patch('/api/admin/settings', {
    headers: {
      cookie: `authjs.session-token=${token}`,
    },
    data: {
      mode,
      uploadsOpen: false,
      liveStreamUrl: null,
    },
  });
}

test.describe('Site Mode Toggle End-to-End (Subphase 3.8)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await setModeViaApi(request, 'PRE');
  });

  test.afterAll(async ({ request }) => {
    await setModeViaApi(request, 'PRE');
  });

  test('public surfaces reflect PRE mode by default', async ({ page }) => {
    await page.goto('/');

    // Hero in PRE mode
    const eyebrow = page.locator('[data-testid="hero-eyebrow"]');
    await expect(eyebrow).toHaveText('Together with our families');

    // Countdown active
    await expect(page.locator('[data-testid="countdown-pre"]')).toBeVisible();

    // Primary CTA is RSVP
    const primaryCta = page.locator('[data-testid="hero-primary-cta"]');
    await expect(primaryCta).toHaveText(/joyfully respond/i);
    await expect(primaryCta).toHaveAttribute('href', '/rsvp');

    // Gallery reflects PRE: Pre-wedding available, wedding-day locked
    await page.goto('/gallery');
    await expect(page.getByRole('heading', { name: /Wedding Gallery/i })).toBeVisible();
    await expect(page.getByText(/Pre-Wedding Moments/i)).toBeVisible();
    await expect(page.getByText(/Locked/i).first()).toBeVisible();
  });

  test('admin can toggle site mode to LIVE and see public changes immediately', async ({
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

    // 1. Visit Admin Settings
    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.getByRole('heading', { name: /Settings & Mode Control/i })).toBeVisible();

    // 2. Click LIVE Mode in segmented control
    const liveModeBtn = page.getByRole('button', { name: /^LIVE/i });
    await expect(liveModeBtn).toBeVisible();
    await liveModeBtn.click();

    // Confirmation modal appears
    await expect(page.getByRole('heading', { name: /Switch site to LIVE mode/i })).toBeVisible();
    const confirmBtn = page.getByRole('button', { name: /Confirm & Switch Mode/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify mode successfully switched to LIVE in admin state
    await expect(page.getByText(/Current State: Wedding Day Mode \(LIVE\)/i)).toBeVisible();

    // 3. Visit public homepage and verify LIVE surfaces
    await page.goto('/');
    const eyebrow = page.locator('[data-testid="hero-eyebrow"]');
    await expect(eyebrow).toHaveText('Today we celebrate');

    // Countdown reflects LIVE
    await expect(page.locator('[data-testid="countdown-live"]')).toBeVisible();
    await expect(page.locator('[data-testid="countdown-live"]')).toHaveText(/Today!/i);

    // 4. Clean up: restore mode back to PRE via UI
    await page.goto('/admin/settings');
    const preModeBtn = page.getByRole('button', { name: /^PRE/i });
    await expect(preModeBtn).toBeVisible();
    await preModeBtn.click();

    await expect(page.getByRole('heading', { name: /Switch site to PRE mode/i })).toBeVisible();
    const confirmPreBtn = page.getByRole('button', { name: /Confirm & Switch Mode/i });
    await expect(confirmPreBtn).toBeVisible();
    await confirmPreBtn.click();

    await expect(page.getByText(/Current State: Pre-Wedding Mode/i)).toBeVisible();
  });
});
