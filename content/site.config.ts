import type { SiteConfig } from './site.config.types';

export const SITE: SiteConfig = {
  couple: {
    a: 'Adetolani Esther',
    b: 'Abiodun Emmanuel',
    initials: 'AE',
  },
  hashtag: "#designedToBi'26",
  timezone: 'Africa/Lagos',
  colours: ['White', 'Gold', 'Magenta'],
  colourGuidance:
    'TODO(content): Guests are warmly invited to celebrate with us in White, Gold, or Magenta formal attire.',

  // Copy the families' wording verbatim from the printed invitation.
  invitationText: {
    parentsBride: 'TODO(content): Families of the bride',
    parentsGroom: 'TODO(content): Families of the groom',
    message:
      'TODO(content): Request the honour of your presence at the solemnization of holy matrimony of their children...',
    families: 'The Families of Adetolani Esther & Abiodun Emmanuel',
  },

  venue: {
    // seeds the DB (Venue)
    name: 'Methodist Church, Olorunsogo-GeriAlimi',
    address: 'Olorunsogo-GeriAlimi',
    city: 'Ilorin',
    state: 'Kwara State',
    lat: null, // TODO(content): exact pin coordinates from the couple
    lng: null,
    notes:
      'TODO(content): Landmarks, parking guidelines and access notes for guests arriving in Ilorin.',
  },

  events: [
    // seeds the DB (Event)
    {
      slug: 'solemnization',
      title: 'Solemnization of Holy Matrimony',
      startsAt: '2026-12-19T11:00:00+01:00',
      timeTbc: false,
      dressCode: 'Formal / Traditional: White, Gold, Magenta',
      notes: 'Church solemnization commences promptly at 11:00 AM WAT.',
    },
    {
      slug: 'reception',
      title: 'Reception',
      startsAt: '2026-12-19T13:00:00+01:00', // PLACEHOLDER time, rendered as "Time to be announced"
      timeTbc: true,
      dressCode: 'Formal / Traditional: White, Gold, Magenta',
      notes: 'Reception follows immediately at the church event hall.',
    },
  ],

  rsvpContacts: [
    { name: 'Shola Mass', tel: '09026892898', wa: '2349026892898' },
    { name: 'Adeola', tel: '08136437963', wa: '2348136437963' },
  ],

  rsvp: {
    collectMeal: false,
    mealOptions: [],
    deadline: '2026-12-05', // seeds Setting.rsvpDeadline (A8)
  },

  gift: {
    minAmountMinor: 100_000, // ₦1,000 in kobo
    maxAmountMinor: 50_000_000, // ₦500,000 in kobo
    presetAmountsMinor: [500_000, 1_000_000, 2_000_000, 5_000_000],
  },

  inviteMessage: "Dear {{name}}, we'd love to celebrate with you! 🤍\n{{link}}",

  hero: {
    poster: null,
    video: null,
  },

  story: [
    // seeds Milestone (placeholders until couple supplies milestones)
    {
      title: 'How We Met',
      dateLabel: 'The Beginning',
      body: 'TODO(content): Our journey began with a serendipitous meeting that turned into a lifelong friendship.',
    },
    {
      title: 'The Proposal',
      dateLabel: 'She Said Yes',
      body: 'TODO(content): Surrounded by close family and love, we decided on forever together.',
    },
  ],

  faq: [
    {
      q: 'What is the dress code?',
      a: 'The wedding colours are White, Gold, and Magenta. Formal or traditional attire is encouraged.',
    },
    {
      q: 'Can I bring a plus one?',
      a: 'Due to venue capacity, your personalised invitation specifies the maximum party size for your household.',
    },
  ],

  thankYou: {
    headline: 'Thank You for Celebrating With Us',
    body: 'TODO(content): Your love, presence, and prayers made our day truly unforgettable.',
  },

  home: {
    heroEyebrow: 'The wedding celebration of',
    dateLabel: 'Saturday, 19 December 2026',
    invitation: { eyebrow: 'With joyful hearts', title: 'An invitation to celebrate love' },
    story: {
      eyebrow: 'Our story',
      title: 'A journey towards forever',
      description: 'A few moments from the story that brought us here.',
    },
    events: { eyebrow: 'The celebration', title: 'Join us for our special day' },
    venue: {
      eyebrow: 'Venue & directions',
      title: 'Where we will say “I do”',
      cityLabel: 'Kwara State',
    },
    colour: { eyebrow: 'Colour of the day', title: 'White, Gold & Magenta' },
    gallery: {
      eyebrow: 'Memories',
      title: 'Our moments, held close',
      description: 'A collection of the memories we are excited to share with you.',
    },
    gift: {
      eyebrow: 'With love',
      title: 'A gift for our new beginning',
      description:
        'Your presence is our greatest gift. If you would like to bless our home, we would be deeply grateful.',
    },
    faq: { eyebrow: 'Helpful details', title: 'A few questions answered' },
    rsvp: {
      eyebrow: 'RSVP',
      title: 'We look forward to celebrating with you',
      description:
        'Please use your invitation link to respond online, or contact one of our RSVP coordinators.',
    },
  },

  brand: {
    logo: {
      src: '/brand/logo-placeholder.svg',
      kind: 'svg',
      width: 240,
      height: 240,
    },
  },
} as const;
