import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const TEST_GIFT_REF = 'gift_e2e_completed_ref_1234567890';

async function seedTestGift() {
  const urls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
    'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
  ].filter(Boolean) as string[];

  for (const url of new Set(urls)) {
    try {
      const client = new PrismaClient({ datasources: { db: { url } } });
      const fund = await client.fund.findFirst({ where: { isActive: true } });
      if (fund) {
        await client.gift.upsert({
          where: { reference: TEST_GIFT_REF },
          update: { status: 'SUCCESS' },
          create: {
            fundId: fund.id,
            giverName: 'E2E Testing Sponsor',
            amountMinor: 5000000,
            currency: 'NGN',
            channel: 'PAYSTACK',
            reference: TEST_GIFT_REF,
            status: 'SUCCESS',
            paidAt: new Date(),
          },
        });
      }

      // Ensure at least one active bank account exists
      const existingBank = await client.bankAccount.findFirst();
      if (existingBank) {
        await client.bankAccount.update({
          where: { id: existingBank.id },
          data: { isActive: true },
        });
      }
      await client.$disconnect();
    } catch {
      // ignore
    }
  }
}

async function cleanupTestGift() {
  const urls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
    'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
  ].filter(Boolean) as string[];

  for (const url of new Set(urls)) {
    try {
      const client = new PrismaClient({ datasources: { db: { url } } });
      await client.gift.deleteMany({
        where: {
          OR: [{ reference: TEST_GIFT_REF }, { giverName: 'E2E Transfer Notifier' }],
        },
      });
      await client.$disconnect();
    } catch {
      // ignore
    }
  }
}

test.describe('Gifting Experience E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await seedTestGift();
  });

  test.afterAll(async () => {
    await cleanupTestGift();
  });

  test('switches tabs between Give Online and Bank Transfer with URL updates', async ({ page }) => {
    await page.goto('/gift');

    // Default tab is Pay Securely / Give Online
    const onlineTab = page.getByRole('tab', { name: /pay securely|give online/i });
    const bankTab = page.getByRole('tab', { name: /bank transfer/i });

    await expect(onlineTab).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('heading', { name: /where would you like your kindness to go/i }),
    ).toHaveCount(0);
    await expect(page.getByLabel(/enter an amount/i)).toBeVisible();

    // Click Bank Transfer tab
    await bankTab.click();
    await expect(bankTab).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/.*tab=bank/);
    await expect(
      page.getByRole('heading', { name: /our wedding gift account/i }).first(),
    ).toBeVisible();

    // Click back to Give Online
    await onlineTab.click();
    await expect(onlineTab).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('heading', { name: /where would you like your kindness to go/i }),
    ).toHaveCount(0);
    await expect(page.getByLabel(/enter an amount/i)).toBeVisible();
  });

  test('bank transfer copy button works and declaration form submits', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/gift?tab=bank');

    // Verify copy button exists
    const copyBtn = page.getByRole('button', { name: /copy account number/i }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText(/copied/i).first()).toBeVisible();

    // Open transfer declaration form
    const notifyBtn = page.getByRole('button', { name: /notify us of transfer/i });
    await expect(notifyBtn).toBeVisible();
    await notifyBtn.click();

    // Fill declaration form
    await page.getByRole('textbox', { name: /^your name/i }).fill('E2E Transfer Notifier');
    await page.getByRole('textbox', { name: /approximate amount/i }).fill('25,000');
    await page
      .getByRole('textbox', { name: /message to couple/i })
      .fill('Sent via mobile banking app!');
    await expect(page.getByLabel(/dedicated wish \/ fund/i)).toHaveCount(0);

    // Submit declaration
    await page.getByRole('button', { name: /submit declaration/i }).click();

    // Verify success banner with reference
    await expect(page.getByText(/thank you for letting us know/i)).toBeVisible();
    await expect(page.getByText(/gift_/i)).toBeVisible();
  });

  test('gift complete page handles missing reference and successful payment reference', async ({
    page,
  }) => {
    // 1. Missing / invalid reference
    await page.goto('/gift/complete');
    await expect(page.getByRole('heading', { name: /payment reference not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to gift page/i })).toBeVisible();

    // 2. Successful payment reference
    await page.goto(`/gift/complete?reference=${TEST_GIFT_REF}`);
    await expect(page.getByRole('heading', { name: /thank you, truly/i })).toBeVisible();
    await expect(page.getByText(TEST_GIFT_REF)).toBeVisible();
  });
});
