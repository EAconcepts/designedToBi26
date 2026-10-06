import { execSync } from 'node:child_process';
import { prisma } from '@/lib/db';
import { seed } from '@/prisma/seed';
import { Side } from '@prisma/client';

export const E2E_GUEST_CODE = 'e2e9test';

export async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes('wedding_test')) {
    throw new Error(
      `[INTEGRATION TEST GUARD] DATABASE_URL must contain "wedding_test". Refusing to run global setup against: "${dbUrl ?? '(undefined)'}"`,
    );
  }

  // 1. Ensure migrations are deployed to test database
  try {
    execSync('pnpm prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env },
    });
  } catch (err) {
    console.error('Failed to apply migrations to test database in global setup:', err);
    throw err;
  }

  // 2. Ensure idempotent baseline seed is present
  await seed(prisma);

  // 3. Seed deterministic e2e guest
  const e2eGuest = await prisma.guest.upsert({
    where: { code: E2E_GUEST_CODE },
    update: {
      displayName: 'E2E Deterministic Guest',
      maxPartySize: 2,
      side: Side.BOTH,
    },
    create: {
      code: E2E_GUEST_CODE,
      displayName: 'E2E Deterministic Guest',
      maxPartySize: 2,
      side: Side.BOTH,
      email: 'e2e-guest@example.com',
      phone: '+2348000000001',
    },
  });

  console.log(`E2E_GUEST_CODE: ${e2eGuest.code}`);
}

export async function teardown() {
  await prisma.$disconnect().catch(() => {});
}
