export interface BrandLogoConfig {
  src: string;
  kind: 'svg' | 'png';
  width: number;
  height: number;
}

export interface RsvpContact {
  name: string;
  tel: string;
  wa: string;
}

export interface VenueConfig {
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  notes?: string;
}

export interface EventConfig {
  slug: string;
  title: string;
  startsAt: string;
  timeTbc: boolean;
  dressCode?: string;
  notes?: string;
}

export interface MilestoneConfig {
  title: string;
  dateLabel: string;
  body: string;
  photo?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SiteConfig {
  readonly couple: {
    readonly a: string;
    readonly b: string;
    readonly initials: string;
  };
  readonly hashtag: string;
  readonly timezone: string;
  readonly colours: readonly string[];
  readonly colourGuidance: string;
  readonly invitationText: {
    readonly parentsBride?: string;
    readonly parentsGroom?: string;
    readonly message?: string;
    readonly families?: string;
  };
  readonly venue: VenueConfig;
  readonly events: readonly EventConfig[];
  readonly rsvpContacts: readonly RsvpContact[];
  readonly rsvp: {
    readonly collectMeal: boolean;
    readonly mealOptions: readonly string[];
    readonly deadline: string;
    // Party cap applied to every online RSVP (open access, no per-guest codes).
    readonly maxPartySize: number;
  };
  readonly gift: {
    readonly minAmountMinor: number;
    readonly maxAmountMinor: number;
    readonly presetAmountsMinor: readonly number[];
  };
  readonly hero: {
    readonly poster: string | null;
    readonly video: string | null;
  };
  readonly story: readonly MilestoneConfig[];
  readonly faq: readonly FaqItem[];
  readonly thankYou: {
    readonly headline: string;
    readonly body: string;
  };
  readonly home: {
    readonly heroEyebrow: string;
    readonly dateLabel: string;
    readonly invitation: { readonly eyebrow: string; readonly title: string };
    readonly story: {
      readonly eyebrow: string;
      readonly title: string;
      readonly description: string;
    };
    readonly events: { readonly eyebrow: string; readonly title: string };
    readonly venue: {
      readonly eyebrow: string;
      readonly title: string;
      readonly cityLabel: string;
    };
    readonly colour: { readonly eyebrow: string; readonly title: string };
    readonly gallery: {
      readonly eyebrow: string;
      readonly title: string;
      readonly description: string;
    };
    readonly gift: {
      readonly eyebrow: string;
      readonly title: string;
      readonly description: string;
    };
    readonly faq: { readonly eyebrow: string; readonly title: string };
    readonly rsvp: {
      readonly eyebrow: string;
      readonly title: string;
      readonly description: string;
    };
  };
  readonly brand: {
    readonly logo: BrandLogoConfig;
  };
}
