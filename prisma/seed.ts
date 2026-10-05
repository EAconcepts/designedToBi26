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

  // 5. Bank Account placeholders (marked isActive: false until couple provides verified details)
  const defaultAccounts = [
    {
      label: 'Default Wedding Account',
      bankName: 'Guaranty Trust Bank (GTB)',
      accountName: 'Abiodun Emmanuel / Adetolani Esther',
      accountNumber: '0000000000',
      currency: 'NGN',
      sortOrder: 0,
      isActive: false,
    },
  ];

  for (const acct of defaultAccounts) {
    const existing = await client.bankAccount.findFirst({
      where: { accountNumber: acct.accountNumber },
    });
    if (!existing) {
      await client.bankAccount.create({ data: acct });
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
