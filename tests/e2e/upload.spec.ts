import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const CANDIDATE_DBS = [
  process.env.DATABASE_URL,
  'postgresql://postgres:postgres@localhost:5432/wedding_dev?schema=public',
  'postgresql://postgres:postgres@localhost:5432/wedding_test?schema=public',
].filter(Boolean) as string[];

async function setUploadsOpen(open: boolean) {
  for (const url of new Set(CANDIDATE_DBS)) {
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    await prisma.setting.upsert({
      where: { id: 1 },
      update: { uploadsOpen: open },
      create: { id: 1, mode: 'PRE', uploadsOpen: open },
    });
    await prisma.$disconnect();
  }
}

test.describe('Guest Upload Flow E2E (Subphase 3.4)', () => {
  test('shows the inactive screen when the upload window is closed', async ({ page }) => {
    await setUploadsOpen(false);
    await page.goto('/upload');

    await expect(page.getByRole('heading', { name: /Upload Link Inactive/i })).toBeVisible();
    await expect(page.getByText(/Guest uploads are not open at this time/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /return to celebration homepage/i })).toBeVisible();
  });

  test('renders the upload dropzone when the upload window is open', async ({ page }) => {
    await setUploadsOpen(true);
    await page.goto('/upload');

    await expect(page.getByRole('heading', { name: /Share Your Moments/i })).toBeVisible();
    await expect(page.getByText(/Choose Photographs/)).toBeVisible();

    // Leave the window closed for the rest of the suite
    await setUploadsOpen(false);
  });
});
