import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import type { Setting } from '@prisma/client';

export async function getSettingsUncached(): Promise<Setting> {
  // 1. Fast path: check if record already exists (read-only, no write lock)
  const existing = await prisma.setting.findUnique({
    where: { id: 1 },
  });

  if (existing) {
    return existing;
  }

  // 2. Slow path: bootstrap singleton row if DB is fresh
  try {
    return await prisma.setting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  } catch (error: unknown) {
    // Under concurrent Next.js build workers, simultaneous upserts on a fresh DB can race
    // with PostgreSQL unique constraint P2002. If so, read the row created by the winning worker.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const fallback = await prisma.setting.findUnique({
          where: { id: 1 },
        });
        if (fallback) {
          return fallback;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    throw error;
  }
}

export const getSettings = unstable_cache(async () => getSettingsUncached(), ['site-settings'], {
  tags: ['site'],
});
