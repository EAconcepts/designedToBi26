import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const E2E_GUEST_PREFIX = 'E2E Web Guest';

async function cleanupWebGuests() {
  const urls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
    'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
  ].filter(Boolean) as string[];

  for (const url of new Set(urls)) {
    try {
      const client = new PrismaClient({ datasources: { db: { url } } });
      // Cascades to invitations, rsvp and attendees; also resets the per-IP throttle window
      await client.guest.deleteMany({
        where: { displayName: { startsWith: E2E_GUEST_PREFIX } },
      });
      await client.$disconnect();
    } catch {
      // ignore
    }
  }
}

test.describe('RSVP Web Experience', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await cleanupWebGuests();
  });

  test.afterAll(async () => {
    await cleanupWebGuests();
  });

  test('open access: any visitor sees the RSVP form without an invitation code', async ({
    page,
  }) => {
    await page.goto('/rsvp');

    await expect(page.locator('form.editorial-form')).toBeVisible();
    await expect(page.locator('#responder-name')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();

    // No gate: the contacts panel only appears when RSVP is closed
    await expect(page.getByRole('region', { name: 'RSVP Contacts' })).toHaveCount(0);
  });

  test('visitor completes the 4-step RSVP and can edit the response afterwards', async ({
    page,
  }) => {
    await page.goto('/rsvp');
    await expect(page.locator('form.editorial-form')).toBeVisible();

    // 1. Identity: typing your name prefills the first attendee row
    await page.locator('#responder-name').fill('E2E Web Guest One');
    await expect(page.locator('input[name="attendee-0-name"]')).toHaveValue('E2E Web Guest One');
    await page.locator('#responder-email').fill('e2e-web@example.com');

    // Party cap of 4: add companions until "+ Add companion" disappears
    const addCompanionBtn = page.getByRole('button', { name: '+ Add companion' });
    await expect(addCompanionBtn).toBeVisible();
    await addCompanionBtn.click();
    await addCompanionBtn.click();
    await addCompanionBtn.click();
    await expect(addCompanionBtn).toHaveCount(0);
    await expect(page.locator('input[name="attendee-3-name"]')).toBeVisible();

    await page.locator('input[name="attendee-1-name"]').fill('Companion One');
    await page.locator('input[name="attendee-2-name"]').fill('Companion Two');
    await page.locator('input[name="attendee-3-name"]').fill('Companion Three');

    // 2. Events — every event is preselected for an open response
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(page.getByText('E2E Web Guest One')).toBeVisible();
    await expect(page.getByText('Companion Three')).toBeVisible();

    // 3. Details & Notes
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await page.locator('#song-request').fill('Sweet Mother - Prince Nico Mbarga');
    await page.locator('#couple-message').fill('Congratulations Adetolani and Emmanuel!');

    // 4. Review & Confirm
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByText('Joyfully Attending')).toBeVisible();
    await expect(page.getByText('Companion One')).toBeVisible();
    await expect(page.getByText('Sweet Mother - Prince Nico Mbarga')).toBeVisible();

    await page.getByRole('button', { name: /confirm and send rsvp/i }).click();

    // Generous timeout: in dev the POST /api/rsvp route compiles on first hit
    await expect(page.getByRole('region', { name: 'RSVP Confirmation' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('We’re overjoyed you’ll be with us!')).toBeVisible();
    await expect(page.getByRole('link', { name: /add to calendar/i }).first()).toBeVisible();

    // "Edit Response" re-opens the form with the same values
    await page.getByRole('button', { name: /edit response/i }).click();
    await expect(page.locator('form.editorial-form')).toBeVisible();
    await expect(page.locator('#responder-name')).toHaveValue('E2E Web Guest One');

    // Returning later: the session cookie prefills the form
    await page.goto('/rsvp');
    await expect(page.locator('form.editorial-form')).toBeVisible();
    await expect(page.locator('#responder-name')).toHaveValue('E2E Web Guest One');
    await expect(page.getByRole('button', { name: /start a different response/i })).toBeVisible();
  });

  test('visitor can submit a decline response', async ({ page }) => {
    await page.goto('/rsvp');
    await expect(page.locator('form.editorial-form')).toBeVisible();

    await page.locator('#responder-name').fill('E2E Web Guest Decliner');
    await page.getByLabel(/regretfully decline/i).check();

    await page.getByRole('button', { name: /continue/i }).click(); // To step 2
    await page.getByRole('button', { name: /continue/i }).click(); // To step 3
    await page.locator('#couple-message').fill('Sending all our love and blessings!');
    await page.getByRole('button', { name: /continue/i }).click(); // To step 4

    await expect(page.getByText('Regretfully Declining')).toBeVisible();
    await page.getByRole('button', { name: /confirm and send rsvp/i }).click();

    await expect(page.getByRole('region', { name: 'RSVP Confirmation' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Thank you for letting us know.')).toBeVisible();
  });
});
