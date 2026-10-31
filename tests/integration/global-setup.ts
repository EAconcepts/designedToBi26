import { execSync } from 'node:child_process';
import { prisma } from '@/lib/db';
import { seed } from '@/prisma/seed';

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
}

export async function teardown() {
  await prisma.$disconnect().catch(() => {});
}
