import { afterEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { cleanupTestRows } from '@/tests/factories';

// Strict security & isolation assertion
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || !dbUrl.includes('wedding_test')) {
  throw new Error(
    `[INTEGRATION TEST GUARD] DATABASE_URL must contain "wedding_test" to prevent destructive operations on non-test databases. Received: "${dbUrl ?? '(undefined)'}"`,
  );
}

afterEach(async () => {
  await cleanupTestRows();
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});
