import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  makeGuest,
  makeEvent,
  makeInvitation,
  makeRsvp,
  makeFund,
  makeGift,
  cleanupTestRows,
} from '@/tests/factories';

describe('Test Factories & Cleanup', () => {
  afterEach(async () => {
    await cleanupTestRows();
  });

  it('creates test entities with distinct prefixes and handles relations', async () => {
    const guest = await makeGuest();
    expect(guest.id).toBeDefined();
    expect(guest.displayName).toContain('Test Guest tst_');

    const event = await makeEvent();
    expect(event.id).toBeDefined();
    expect(event.slug).toContain('event-tst_');

    const invitation = await makeInvitation(guest.id, event.id);
    expect(invitation.guestId).toBe(guest.id);
    expect(invitation.eventId).toBe(event.id);

    const rsvp = await makeRsvp(guest.id);
    expect(rsvp.guestId).toBe(guest.id);
    expect(rsvp.status).toBe('PENDING');

    const fund = await makeFund();
    expect(fund.id).toBeDefined();
    expect(fund.slug).toContain('fund-tst_');

    const gift = await makeGift({ guestId: guest.id, fundId: fund.id });
    expect(gift.id).toBeDefined();
    expect(gift.reference).toContain('tref_tst_');
    expect(gift.guestId).toBe(guest.id);
    expect(gift.fundId).toBe(fund.id);

    // Now run cleanup
    await cleanupTestRows();

    const guestAfter = await prisma.guest.findUnique({ where: { id: guest.id } });
    expect(guestAfter).toBeNull();

    const eventAfter = await prisma.event.findUnique({ where: { id: event.id } });
    expect(eventAfter).toBeNull();

    const fundAfter = await prisma.fund.findUnique({ where: { id: fund.id } });
    expect(fundAfter).toBeNull();

    const giftAfter = await prisma.gift.findUnique({ where: { id: gift.id } });
    expect(giftAfter).toBeNull();
  });
});
