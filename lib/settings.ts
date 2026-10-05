import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import type { Setting } from '@prisma/client';

export async function getSettingsUncached(): Promise<Setting> {
  return prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export const getSettings = unstable_cache(async () => getSettingsUncached(), ['site-settings'], {
  tags: ['site'],
});
