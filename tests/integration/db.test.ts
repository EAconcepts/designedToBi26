import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { getSettingsUncached } from '@/lib/settings';
import { seed } from '@/prisma/seed';

describe('Database & Seed Integration', () => {
  beforeAll(async () => {
    await seed(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retrieves singleton setting with expected mode and deadline', async () => {
    const setting = await getSettingsUncached();
    expect(setting.id).toBe(1);
    expect(setting.mode).toBe('PRE');
    expect(setting.uploadsOpen).toBe(false);
    expect(setting.rsvpDeadline).toBeInstanceOf(Date);
  });

  it('seeded venue and events with proper relations', async () => {
    const venue = await prisma.venue.findFirst({
      include: { events: true },
    });
    expect(venue).not.toBeNull();
    expect(venue?.name).toBe('Methodist Church, Olorunsogo-GeriAlimi');
    expect(venue?.events.length).toBeGreaterThanOrEqual(2);

    const solemnization = venue?.events.find((e) => e.slug === 'solemnization');
    expect(solemnization).toBeDefined();
    expect(solemnization?.timeTbc).toBe(false);

    const reception = venue?.events.find((e) => e.slug === 'reception');
    expect(reception).toBeDefined();
    expect(reception?.timeTbc).toBe(true);
  });

  it('seeded default funds and albums', async () => {
    const funds = await prisma.fund.findMany();
    const slugs = funds.map((f) => f.slug);
    expect(slugs).toContain('honeymoon');
    expect(slugs).toContain('first-home');
    expect(slugs).toContain('donation');

    const albums = await prisma.album.findMany();
    const albumSlugs = albums.map((a) => a.slug);
    expect(albumSlugs).toContain('pre-wedding');
    expect(albumSlugs).toContain('guest-moments');
    expect(albumSlugs).toContain('wedding-day');
  });

  it('preserves idempotency on subsequent seed calls', async () => {
    const beforeCount = await prisma.fund.count();
    await seed(prisma);
    const afterCount = await prisma.fund.count();
    expect(afterCount).toBe(beforeCount);
  });
});
