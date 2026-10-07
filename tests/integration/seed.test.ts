import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { seed } from '@/prisma/seed';

describe('Seed Idempotency Integration', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('running seed() twice leaves exactly one Setting, one Venue, two Event rows, and three Album rows', async () => {
    // Run seed twice
    await seed(prisma);
    await seed(prisma);

    const settingCount = await prisma.setting.count();
    const venueCount = await prisma.venue.count();
    const eventCount = await prisma.event.count();
    const albumCount = await prisma.album.count();
    const photoCount = await prisma.photo.count();

    expect(settingCount).toBe(1);
    expect(venueCount).toBe(1);
    expect(eventCount).toBe(2);
    expect(albumCount).toBe(3);
    expect(photoCount).toBe(7);
  });
});
