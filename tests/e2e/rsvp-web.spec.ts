import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const E2E_GUEST_CODE = 'e2e9test';

async function clearGuestRsvp() {
  const urls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
    'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
  ].filter(Boolean) as string[];

  for (const url of new Set(urls)) {
    try {
      const client = new PrismaClient({ datasources: { db: { url } } });
      await client.rsvp.deleteMany({
        where: { guest: { code: E2E_GUEST_CODE } },
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
    await clearGuestRsvp();
  });

  test.afterAll(async () => {
    await clearGuestRsvp();
  });
  test('unauthenticated visitor sees contacts panel and no form inputs', async ({ page }) => {
    await page.goto('/rsvp');

    // Verify Contacts Panel is displayed
    await expect(page.getByRole('region', { name: 'RSVP Contacts' })).toBeVisible();
    await expect(page.getByText('Personal Invitation Required')).toBeVisible();
    await expect(page.getByRole('link', { name: /call shola mass/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /message shola mass on whatsapp/i })).toBeVisible();

    // Verify no form elements are rendered
    await expect(page.locator('form.editorial-form')).toHaveCount(0);
    await expect(page.locator('input[name="attendee-0-name"]')).toHaveCount(0);
  });

  test('authenticated guest completes 4-step RSVP submission with party cap and calendar links', async ({
    page,
  }) => {
    // 1. Authenticate guest via invitation link
    await page.goto(`/i/${E2E_GUEST_CODE}`);
    await expect(page).toHaveURL('/');

    // Dismiss opening sequence if visible
    const skipIntro = page.getByRole('button', { name: /skip introduction/i });
    if (await skipIntro.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipIntro.click();
    }

    // 2. Navigate to RSVP
    await page.goto('/rsvp');

    // Wait for form to load
    await expect(page.locator('form.editorial-form')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();

    // Verify prefilled name and party cap
    const firstAttendeeInput = page.locator('input[name="attendee-0-name"]');
    await expect(firstAttendeeInput).toHaveValue('E2E Deterministic Guest');

    // Add companion (maxPartySize is 2)
    const addCompanionBtn = page.getByRole('button', { name: '+ Add companion' });
    await expect(addCompanionBtn).toBeVisible();
    await addCompanionBtn.click();

    // Second attendee row now exists
    const secondAttendeeInput = page.locator('input[name="attendee-1-name"]');
    await expect(secondAttendeeInput).toBeVisible();
    await secondAttendeeInput.fill('Companion Guest');

    // Assert "+ Add companion" button is hidden now that party cap (2) is reached
    await expect(addCompanionBtn).toHaveCount(0);

    // Advance to Step 2: Events
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 2 of 4')).toBeVisible();

    // Both attendees are visible in step 2 with invited events
    await expect(page.getByText('E2E Deterministic Guest')).toBeVisible();
    await expect(page.getByText('Companion Guest')).toBeVisible();

    // Advance to Step 3: Details & Notes
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 3 of 4')).toBeVisible();

    await page.locator('#song-request').fill('Sweet Mother - Prince Nico Mbarga');
    await page.locator('#couple-message').fill('Congratulations Adetolani and Emmanuel!');

    // Advance to Step 4: Review & Confirm
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Step 4 of 4')).toBeVisible();

    // Verify summary contains details
    await expect(page.getByText('Joyfully Attending')).toBeVisible();
    await expect(page.getByText('E2E Deterministic Guest')).toBeVisible();
    await expect(page.getByText('Companion Guest')).toBeVisible();
    await expect(page.getByText('Sweet Mother - Prince Nico Mbarga')).toBeVisible();

    // Submit RSVP
    await page.getByRole('button', { name: /confirm and send rsvp/i }).click();

    // Verify success screen
    await expect(page.getByRole('region', { name: 'RSVP Confirmation' })).toBeVisible();
    await expect(page.getByText('We’re overjoyed you’ll be with us!')).toBeVisible();
    await expect(page.getByRole('link', { name: /add to calendar/i }).first()).toBeVisible();

    // Test "Edit Response" button re-opens form
    await page.getByRole('button', { name: /edit response/i }).click();
    await expect(page.locator('form.editorial-form')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });

  test('authenticated guest can submit a decline response', async ({ page }) => {
    // 1. Authenticate guest via invitation link
    await page.goto(`/i/${E2E_GUEST_CODE}`);
    await expect(page).toHaveURL('/');

    const skipIntro = page.getByRole('button', { name: /skip introduction/i });
    if (await skipIntro.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipIntro.click();
    }

    // 2. Navigate to RSVP
    await page.goto('/rsvp');
    await expect(page.locator('form.editorial-form')).toBeVisible();

    // Check "Regretfully decline"
    await page.getByLabel(/regretfully decline/i).check();

    // Advance through steps to submit
    await page.getByRole('button', { name: /continue/i }).click(); // To step 2
    await page.getByRole('button', { name: /continue/i }).click(); // To step 3
    await page.locator('#couple-message').fill('Sending all our love and blessings!');
    await page.getByRole('button', { name: /continue/i }).click(); // To step 4

    await expect(page.getByText('Regretfully Declining')).toBeVisible();
    await page.getByRole('button', { name: /confirm and send rsvp/i }).click();

    // Verify declined confirmation screen
    await expect(page.getByRole('region', { name: 'RSVP Confirmation' })).toBeVisible();
    await expect(page.getByText('Thank you for letting us know.')).toBeVisible();
  });
});
