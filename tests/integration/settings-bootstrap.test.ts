import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { getSettingsUncached } from '@/lib/settings';

describe('Settings Bootstrap Integration', () => {
  beforeAll(async () => {
    // Delete setting if exists to test bootstrap from empty state
    await prisma.setting.deleteMany({ where: { id: 1 } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates the setting row when none exists, then returns the same row on subsequent calls', async () => {
    const firstCall = await getSettingsUncached();
    expect(firstCall.id).toBe(1);
    expect(firstCall.mode).toBe('PRE');

    const secondCall = await getSettingsUncached();
    expect(secondCall.id).toBe(firstCall.id);
    expect(secondCall.mode).toBe(firstCall.mode);

    const count = await prisma.setting.count();
    expect(count).toBe(1);
  });

  it('handles multiple concurrent bootstrap calls without unique constraint collisions', async () => {
    await prisma.setting.deleteMany({ where: { id: 1 } });

    // Simulate 10 simultaneous Next.js build workers querying settings on empty DB
    const results = await Promise.all([
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
      getSettingsUncached(),
    ]);

    expect(results).toHaveLength(10);
    results.forEach((res) => {
      expect(res.id).toBe(1);
      expect(res.mode).toBe('PRE');
    });

    const count = await prisma.setting.count();
    expect(count).toBe(1);
  });
});
