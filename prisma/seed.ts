import { PrismaClient } from '@prisma/client';
import { SITE } from '../content/site.config';
import { env } from '../lib/env';

const globalPrisma = new PrismaClient();

export async function seed(client: PrismaClient = globalPrisma) {
  console.log('🌱 Starting database seed...');

  // 1. Setting singleton (id = 1)
  const setting = await client.setting.upsert({
    where: { id: 1 },
    update: {
      rsvpDeadline: new Date(SITE.rsvp.deadline),
    },
    create: {
      id: 1,
      mode: 'PRE',
      rsvpDeadline: new Date(SITE.rsvp.deadline),
      uploadsOpen: false,
    },
  });
  console.log(`✓ Setting configured (mode: ${setting.mode})`);

  // 2. Venue
  const venueAddress = `${SITE.venue.address}, ${SITE.venue.state}`;
  const existingVenue = await client.venue.findFirst({
    where: { name: SITE.venue.name },
  });

  const venue = existingVenue
    ? await client.venue.update({
        where: { id: existingVenue.id },
        data: {
          address: venueAddress,
          city: SITE.venue.city,
          lat: SITE.venue.lat,
          lng: SITE.venue.lng,
          notes: SITE.venue.notes,
        },
      })
    : await client.venue.create({
        data: {
          name: SITE.venue.name,
          address: venueAddress,
          city: SITE.venue.city,
          lat: SITE.venue.lat,
          lng: SITE.venue.lng,
          notes: SITE.venue.notes,
        },
      });
  console.log(`✓ Venue seeded: ${venue.name}`);

  // 3. Events
  for (let i = 0; i < SITE.events.length; i++) {
    const evt = SITE.events[i]!;
    await client.event.upsert({
      where: { slug: evt.slug },
      update: {
        title: evt.title,
        startsAt: new Date(evt.startsAt),
        timeTbc: evt.timeTbc,
        dressCode: evt.dressCode,
        notes: evt.notes,
        sortOrder: i,
        venueId: venue.id,
      },
      create: {
        slug: evt.slug,
        title: evt.title,
        startsAt: new Date(evt.startsAt),
        timeTbc: evt.timeTbc,
        dressCode: evt.dressCode,
        notes: evt.notes,
        sortOrder: i,
        venueId: venue.id,
      },
    });
  }
  console.log(`✓ Events seeded: ${SITE.events.length} events`);

  // 4. Funds (default funds: honeymoon, first-home, donation)
  const defaultFunds = [
    {
      slug: 'honeymoon',
      title: 'Honeymoon Fund',
      description: 'Help us make our dream honeymoon trip a memorable start to our married life.',
      sortOrder: 0,
      isDonation: false,
      showProgress: false,
    },
    {
      slug: 'first-home',
      title: 'First Home Fund',
      description: 'Support us as we set up and feather our new family nest.',
      sortOrder: 1,
      isDonation: false,
      showProgress: false,
    },
    {
      slug: 'donation',
      title: 'Charity & Giving Back',
      description:
        'In gratitude for our blessings, contribute towards our chosen charitable outreach.',
      sortOrder: 2,
      isDonation: true,
      showProgress: false,
    },
  ];

  for (const fund of defaultFunds) {
    await client.fund.upsert({
      where: { slug: fund.slug },
      update: {
        title: fund.title,
        description: fund.description,
        sortOrder: fund.sortOrder,
        isDonation: fund.isDonation,
      },
      create: fund,
    });
  }
  console.log(`✓ Funds seeded: ${defaultFunds.length} funds`);

  // 5. Bank Accounts
  const defaultAccounts = [
    {
      label: 'Default Wedding Account',
      bankName: 'Guaranty Trust Bank (GTB)',
      accountName: 'Abiodun Emmanuel / Adetolani Esther',
      accountNumber: '0000000000',
      currency: 'NGN',
      sortOrder: 0,
      isActive: true,
    },
  ];

  for (const acct of defaultAccounts) {
    const existing = await client.bankAccount.findFirst({
      where: { accountNumber: acct.accountNumber },
    });
    if (!existing) {
      await client.bankAccount.create({ data: acct });
    } else {
      await client.bankAccount.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
  }
  console.log(`✓ Bank accounts seeded: ${defaultAccounts.length} accounts`);

  // 6. Albums (pre-wedding -> PRE, guest-moments -> LIVE, wedding-day -> POST)
  const defaultAlbums = [
    {
      slug: 'pre-wedding',
      title: 'Pre-Wedding Moments',
      visibleFrom: 'PRE' as const,
    },
    {
      slug: 'guest-moments',
      title: 'Guest Moments',
      visibleFrom: 'LIVE' as const,
    },
    {
      slug: 'wedding-day',
      title: 'Wedding Day Highlights',
      visibleFrom: 'POST' as const,
    },
  ];

  for (const album of defaultAlbums) {
    await client.album.upsert({
      where: { slug: album.slug },
      update: {
        title: album.title,
        visibleFrom: album.visibleFrom,
      },
      create: album,
    });
  }
  console.log(`✓ Albums seeded: ${defaultAlbums.length} albums`);

  // 6b. Photos (seed img-1.jpg through img-7.jpg for pre-wedding album)
  const preWeddingAlbum = await client.album.findUnique({
    where: { slug: 'pre-wedding' },
  });

  if (preWeddingAlbum) {
    const defaultPhotos = [
      {
        publicId: '/img-1.jpg',
        width: 715,
        height: 953,
        caption: 'Adetolani & Emmanuel — The beginning of forever',
        altText: 'Adetolani and Emmanuel in elegant attire, pre-wedding portrait 1',
        sortOrder: 0,
      },
      {
        publicId: '/img-2.jpg',
        width: 715,
        height: 953,
        caption: 'Quiet moments together',
        altText: 'Adetolani and Emmanuel smiling warmly, pre-wedding portrait 2',
        sortOrder: 1,
      },
      {
        publicId: '/img-3.jpg',
        width: 715,
        height: 953,
        caption: 'Laughter and shared dreams',
        altText: 'Close up portrait of the couple, pre-wedding portrait 3',
        sortOrder: 2,
      },
      {
        publicId: '/img-4.jpg',
        width: 715,
        height: 953,
        caption: 'Hand in hand towards 19 December',
        altText: 'Adetolani and Emmanuel hand in hand, pre-wedding portrait 4',
        sortOrder: 3,
      },
      {
        publicId: '/img-5.jpg',
        width: 715,
        height: 953,
        caption: 'Walking in grace and purpose',
        altText: 'Adetolani and Emmanuel outdoor pose, pre-wedding portrait 5',
        sortOrder: 4,
      },
      {
        publicId: '/img-6.jpg',
        width: 715,
        height: 953,
        caption: 'Joy that overflows',
        altText: 'Joyful celebration portrait, pre-wedding portrait 6',
        sortOrder: 5,
      },
      {
        publicId: '/img-7.jpg',
        width: 566,
        height: 988,
        caption: 'Designed together in love',
        altText: 'Adetolani and Emmanuel standing together, pre-wedding portrait 7',
        sortOrder: 6,
      },
    ];

    for (const photo of defaultPhotos) {
      await client.photo.upsert({
        where: { publicId: photo.publicId },
        update: {
          albumId: preWeddingAlbum.id,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
          altText: photo.altText,
          sortOrder: photo.sortOrder,
          status: 'APPROVED',
          source: 'ADMIN',
        },
        create: {
          albumId: preWeddingAlbum.id,
          publicId: photo.publicId,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
          altText: photo.altText,
          sortOrder: photo.sortOrder,
          status: 'APPROVED',
          source: 'ADMIN',
        },
      });
    }
    console.log(`✓ Photos seeded: ${defaultPhotos.length} pre-wedding photos`);
  }

  // 7. Milestones (from SITE.story)
  for (let i = 0; i < SITE.story.length; i++) {
    const item = SITE.story[i]!;
    const existing = await client.milestone.findFirst({
      where: { title: item.title },
    });
    if (existing) {
      await client.milestone.update({
        where: { id: existing.id },
        data: {
          dateLabel: item.dateLabel,
          body: item.body,
          sortOrder: i,
        },
      });
    } else {
      await client.milestone.create({
        data: {
          title: item.title,
          dateLabel: item.dateLabel,
          body: item.body,
          sortOrder: i,
        },
      });
    }
  }
  console.log(`✓ Milestones seeded: ${SITE.story.length} milestones`);

  // 8. Admin users (from ADMIN_ALLOWLIST)
  const emails = env.server.ADMIN_ALLOWLIST.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of emails) {
    await client.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split('@')[0],
      },
    });
  }
  console.log(`✓ Admin users seeded: ${emails.length} users`);

  // 9. E2E Deterministic guest (for local testing and playwright)
  const solemnization = await client.event.findUnique({ where: { slug: 'solemnization' } });
  const reception = await client.event.findUnique({ where: { slug: 'reception' } });

  const e2eGuest = await client.guest.upsert({
    where: { code: 'e2e9test' },
    update: {
      displayName: 'E2E Deterministic Guest',
      maxPartySize: 2,
      side: 'BOTH',
    },
    create: {
      code: 'e2e9test',
      displayName: 'E2E Deterministic Guest',
      maxPartySize: 2,
      side: 'BOTH',
      email: 'e2e-guest@example.com',
      phone: '+2348000000001',
    },
  });

  if (solemnization) {
    await client.invitation.upsert({
      where: { guestId_eventId: { guestId: e2eGuest.id, eventId: solemnization.id } },
      update: {},
      create: { guestId: e2eGuest.id, eventId: solemnization.id },
    });
  }
  if (reception) {
    await client.invitation.upsert({
      where: { guestId_eventId: { guestId: e2eGuest.id, eventId: reception.id } },
      update: {},
      create: { guestId: e2eGuest.id, eventId: reception.id },
    });
  }
  console.log(`✓ E2E guest seeded: ${e2eGuest.code}`);

  console.log('🎉 Database seed completed successfully.');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(async () => {
      await globalPrisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await globalPrisma.$disconnect();
      process.exit(1);
    });
}
