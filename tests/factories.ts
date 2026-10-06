import { prisma } from '@/lib/db';
import { newGuestCode } from '@/lib/codes';
import {
  Side,
  RsvpStatus,
  RsvpSource,
  GiftChannel,
  GiftStatus,
  type Guest,
  type Event,
  type Invitation,
  type Rsvp,
  type Fund,
  type Gift,
  type Venue,
  type Prisma,
} from '@prisma/client';
import { nanoid } from 'nanoid';

// In-memory sets to track created test IDs across runs
const createdGuestIds = new Set<string>();
const createdEventIds = new Set<string>();
const createdFundIds = new Set<string>();
const createdGiftIds = new Set<string>();
const createdVenueIds = new Set<string>();

export function getTestPrefix(): string {
  return `tst_${nanoid(8)}`;
}

export async function makeVenue(overrides?: Partial<Prisma.VenueCreateInput>): Promise<Venue> {
  const prefix = getTestPrefix();
  const venue = await prisma.venue.create({
    data: {
      name: `Test Venue ${prefix}`,
      address: '123 Test Street',
      city: 'Ilorin',
      ...overrides,
    },
  });
  createdVenueIds.add(venue.id);
  return venue;
}

export async function makeGuest(overrides?: Partial<Prisma.GuestCreateInput>): Promise<Guest> {
  const prefix = getTestPrefix();
  const guest = await prisma.guest.create({
    data: {
      code: newGuestCode(),
      displayName: `Test Guest ${prefix}`,
      side: Side.BOTH,
      maxPartySize: 2,
      email: `${prefix}@example.com`,
      phone: '+2348000000000',
      ...overrides,
    },
  });
  createdGuestIds.add(guest.id);
  return guest;
}

export async function makeEvent(
  venueId?: string,
  overrides?: Partial<Prisma.EventCreateInput>,
): Promise<Event> {
  const prefix = getTestPrefix();
  let finalVenueId = venueId;
  if (!finalVenueId) {
    const existing = await prisma.venue.findFirst();
    if (existing) {
      finalVenueId = existing.id;
    } else {
      const v = await makeVenue();
      finalVenueId = v.id;
    }
  }

  const event = await prisma.event.create({
    data: {
      slug: `event-${prefix}`,
      title: `Test Event ${prefix}`,
      startsAt: new Date('2026-10-24T10:00:00Z'),
      timeTbc: false,
      venue: {
        connect: { id: finalVenueId },
      },
      ...overrides,
    },
  });
  createdEventIds.add(event.id);
  return event;
}

export async function makeInvitation(guestId: string, eventId: string): Promise<Invitation> {
  const invitation = await prisma.invitation.create({
    data: {
      guestId,
      eventId,
    },
  });
  return invitation;
}

export async function makeRsvp(
  guestId: string,
  overrides?: Partial<Prisma.RsvpCreateInput>,
): Promise<Rsvp> {
  const rsvp = await prisma.rsvp.create({
    data: {
      guest: {
        connect: { id: guestId },
      },
      status: RsvpStatus.PENDING,
      source: RsvpSource.WEB,
      songRequest: 'Test Celebration Song',
      message: 'Looking forward to celebrating with you!',
      ...overrides,
    },
  });
  return rsvp;
}

export async function makeFund(overrides?: Partial<Prisma.FundCreateInput>): Promise<Fund> {
  const prefix = getTestPrefix();
  const fund = await prisma.fund.create({
    data: {
      slug: `fund-${prefix}`,
      title: `Test Fund ${prefix}`,
      goalMinor: 50000000,
      showProgress: true,
      isDonation: false,
      sortOrder: 10,
      isActive: true,
      ...overrides,
    },
  });
  createdFundIds.add(fund.id);
  return fund;
}

export async function makeGift(
  overrides?: Partial<Prisma.GiftUncheckedCreateInput>,
): Promise<Gift> {
  const prefix = getTestPrefix();
  const gift = await prisma.gift.create({
    data: {
      reference: `tref_${prefix}_${nanoid(6)}`,
      channel: GiftChannel.PAYSTACK,
      status: GiftStatus.PENDING,
      amountMinor: 2500000,
      currency: 'NGN',
      giverName: `Test Giver ${prefix}`,
      giverEmail: `${prefix}@example.com`,
      ...overrides,
    },
  });
  createdGiftIds.add(gift.id);
  return gift;
}

export async function cleanupTestRows(prefix?: string): Promise<void> {
  if (prefix) {
    // Delete gifts matching prefix
    await prisma.gift.deleteMany({
      where: {
        OR: [{ reference: { contains: prefix } }, { giverName: { contains: prefix } }],
      },
    });

    // Delete invitations for guests or events matching prefix
    await prisma.invitation.deleteMany({
      where: {
        OR: [
          { guest: { displayName: { contains: prefix } } },
          { event: { slug: { contains: prefix } } },
        ],
      },
    });

    // Delete RSVPs and cascades
    await prisma.rsvp.deleteMany({
      where: {
        guest: { displayName: { contains: prefix } },
      },
    });

    // Delete guests matching prefix
    await prisma.guest.deleteMany({
      where: {
        OR: [{ displayName: { contains: prefix } }, { code: { contains: prefix } }],
      },
    });

    // Delete events matching prefix
    await prisma.event.deleteMany({
      where: {
        OR: [{ slug: { contains: prefix } }, { title: { contains: prefix } }],
      },
    });

    // Delete funds matching prefix
    await prisma.fund.deleteMany({
      where: {
        OR: [{ slug: { contains: prefix } }, { title: { contains: prefix } }],
      },
    });

    // Delete venues matching prefix
    await prisma.venue.deleteMany({
      where: {
        name: { contains: prefix },
      },
    });
  } else {
    // Cleanup tracked IDs and default test prefixes
    if (createdGiftIds.size > 0) {
      await prisma.gift.deleteMany({
        where: { id: { in: Array.from(createdGiftIds) } },
      });
      createdGiftIds.clear();
    }

    // Also delete any gift with test reference prefix
    await prisma.gift.deleteMany({
      where: { reference: { startsWith: 'tref_' } },
    });

    if (createdGuestIds.size > 0) {
      // RSVP and invitations cascade on delete guest
      await prisma.guest.deleteMany({
        where: { id: { in: Array.from(createdGuestIds) } },
      });
      createdGuestIds.clear();
    }

    // Also delete any guest with test display name
    await prisma.guest.deleteMany({
      where: { displayName: { startsWith: 'Test Guest tst_' } },
    });

    if (createdEventIds.size > 0) {
      await prisma.invitation.deleteMany({
        where: { eventId: { in: Array.from(createdEventIds) } },
      });
      await prisma.event.deleteMany({
        where: { id: { in: Array.from(createdEventIds) } },
      });
      createdEventIds.clear();
    }

    await prisma.event.deleteMany({
      where: { slug: { startsWith: 'event-tst_' } },
    });

    if (createdFundIds.size > 0) {
      await prisma.fund.deleteMany({
        where: { id: { in: Array.from(createdFundIds) } },
      });
      createdFundIds.clear();
    }

    await prisma.fund.deleteMany({
      where: { slug: { startsWith: 'fund-tst_' } },
    });

    if (createdVenueIds.size > 0) {
      await prisma.venue.deleteMany({
        where: { id: { in: Array.from(createdVenueIds) } },
      });
      createdVenueIds.clear();
    }
  }
}
