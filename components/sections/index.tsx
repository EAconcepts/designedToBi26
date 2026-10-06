import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Container, GoldRule, Reveal, SectionHeading } from '@/components/ui';
import { SITE } from '@/content/site.config';
import { formatTimeWAT } from '@/lib/datetime';
import { Greeting } from './Greeting';

const partnerBNames = SITE.couple.b.split(' ');
const names = `${SITE.couple.a.split(' ')[0]} & ${partnerBNames[partnerBNames.length - 1] ?? SITE.couple.b}`;
const weddingDate = SITE.home.dateLabel;

function SectionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        secondary
          ? 'inline-flex min-h-11 items-center justify-center rounded-full border border-gold-500 px-6 py-2.5 font-medium text-ink-900 transition-colors hover:bg-gold-500/10'
          : 'inline-flex min-h-11 items-center justify-center rounded-full bg-magenta-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-magenta-800'
      }
    >
      {children}
    </Link>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="home-title" className="bg-ivory py-16 text-center sm:py-24 md:py-28">
      <Container size="md" className="flex flex-col items-center">
        <Logo size={104} className="mb-6" />
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
          {SITE.home.heroEyebrow}
        </p>
        <h1
          id="home-title"
          className="font-display text-5xl font-semibold leading-none tracking-tight text-ink-900 sm:text-7xl"
        >
          {names}
        </h1>
        <GoldRule withDiamond className="max-w-xs" />
        <p className="mb-8 text-base font-medium text-ink-600 sm:text-lg">
          {weddingDate} · 11:00 WAT
          <br />
          {SITE.venue.name}, {SITE.venue.city}, {SITE.venue.state}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <SectionLink href="/rsvp">RSVP</SectionLink>
          <SectionLink href="#venue" secondary>
            Directions
          </SectionLink>
        </div>
        <p className="mt-8 font-signature text-3xl text-gold-500">{SITE.hashtag}</p>
      </Container>
    </section>
  );
}

export function InvitationText() {
  return (
    <section aria-labelledby="invitation-heading" className="py-16 sm:py-20">
      <Container size="sm">
        <Reveal>
          <div className="rounded-[2rem] border border-gold-500/30 bg-white px-6 py-10 text-center shadow-sm sm:px-12">
            <Greeting />
            <p className="text-sm uppercase tracking-[0.2em] text-gold-500">
              {SITE.home.invitation.eyebrow}
            </p>
            <h2
              id="invitation-heading"
              className="mt-3 font-display text-4xl text-ink-900 sm:text-5xl"
            >
              {SITE.home.invitation.title}
            </h2>
            <GoldRule withDiamond />
            <p className="whitespace-pre-line text-base leading-8 text-ink-600">
              {SITE.invitationText.message}
            </p>
            <p className="mt-7 font-display text-xl text-ink-900">{SITE.invitationText.families}</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function StoryTimeline() {
  return (
    <section
      id="story"
      aria-labelledby="story-heading"
      className="scroll-mt-20 bg-white py-16 sm:py-20"
    >
      <Container size="md">
        <SectionHeading id="story-heading" {...SITE.home.story} />
        <ol className="mx-auto max-w-2xl space-y-6 border-l border-gold-500/50 pl-6 sm:pl-8">
          {SITE.story.map((item) => (
            <li key={item.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1 size-3 rotate-45 border border-gold-500 bg-ivory sm:-left-[39px]"
              />
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                  {item.dateLabel}
                </p>
                <h3 className="mt-1 font-display text-3xl text-ink-900">{item.title}</h3>
                <p className="mt-2 leading-7 text-ink-600">{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function EventsSection() {
  return (
    <section id="events" aria-labelledby="events-heading" className="scroll-mt-20 py-16 sm:py-20">
      <Container size="lg">
        <SectionHeading id="events-heading" {...SITE.home.events} />
        <div className="grid gap-5 md:grid-cols-2">
          {SITE.events.map((event) => (
            <article
              key={event.slug}
              className="rounded-3xl border border-gold-500/30 bg-white p-6 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                {weddingDate}
              </p>
              <h3 className="mt-2 font-display text-3xl text-ink-900">{event.title}</h3>
              <p className="mt-3 text-ink-600">
                {event.timeTbc ? 'Time to be announced' : `${formatTimeWAT(event.startsAt)} WAT`}
              </p>
              <p className="mt-1 text-ink-600">{SITE.venue.name}</p>
              {event.dressCode && (
                <p className="mt-5 text-sm text-ink-600">
                  <span className="font-semibold text-ink-900">Dress code:</span> {event.dressCode}
                </p>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function VenueSection() {
  return (
    <section
      id="venue"
      aria-labelledby="venue-heading"
      className="scroll-mt-20 bg-white py-16 sm:py-20"
    >
      <Container size="lg">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <SectionHeading
              id="venue-heading"
              eyebrow={SITE.home.venue.eyebrow}
              title={SITE.home.venue.title}
              align="left"
            />
            <p className="font-display text-2xl text-ink-900">{SITE.venue.name}</p>
            <p className="mt-2 leading-7 text-ink-600">
              {SITE.venue.address}, {SITE.venue.city}, {SITE.venue.state}
            </p>
            <p className="mt-5 leading-7 text-ink-600">{SITE.venue.notes}</p>
            <a
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-magenta-600 px-6 py-2.5 font-medium text-white hover:bg-magenta-800"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.venue.name}, ${SITE.venue.city}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open directions
            </a>
          </div>
          <div
            aria-hidden="true"
            className="flex min-h-72 flex-col items-center justify-center rounded-[2rem] border-2 border-gold-500/50 bg-ivory p-8 text-center shadow-inner"
          >
            <span className="text-5xl text-magenta-600">⌖</span>
            <p className="mt-4 font-display text-3xl text-ink-900">{SITE.venue.city}</p>
            <GoldRule withDiamond className="max-w-48" />
            <p className="text-sm uppercase tracking-[0.18em] text-gold-500">
              {SITE.home.venue.cityLabel}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ColourOfDay() {
  return (
    <section
      id="details"
      aria-labelledby="colour-heading"
      data-theme="night"
      className="scroll-mt-20 bg-night py-16 sm:py-20"
    >
      <Container size="md">
        <SectionHeading
          id="colour-heading"
          {...SITE.home.colour}
          description={SITE.colourGuidance}
        />
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {SITE.colours.map((colour) => (
            <div
              key={colour}
              className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center sm:p-6"
            >
              <span
                aria-hidden="true"
                className={`mx-auto block size-10 rounded-full border border-gold-500/30 ${colour === 'White' ? 'bg-white' : colour === 'Gold' ? 'bg-gold-500' : 'bg-magenta-600'}`}
              />
              <p className="mt-3 font-display text-xl text-ivory">{colour}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function GalleryTeaser() {
  return (
    <section aria-labelledby="gallery-heading" className="py-16 sm:py-20">
      <Container size="md">
        <SectionHeading id="gallery-heading" {...SITE.home.gallery} />
        <div className="text-center">
          <SectionLink href="/gallery" secondary>
            Explore the gallery
          </SectionLink>
        </div>
      </Container>
    </section>
  );
}

export function GiftTeaser() {
  return (
    <section aria-labelledby="gift-heading" className="bg-white py-16 sm:py-20">
      <Container size="md">
        <SectionHeading id="gift-heading" {...SITE.home.gift} />
        <div className="text-center">
          <SectionLink href="/gift">View gift options</SectionLink>
        </div>
      </Container>
    </section>
  );
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="py-16 sm:py-20">
      <Container size="md">
        <SectionHeading id="faq-heading" {...SITE.home.faq} />
        <div className="space-y-3">
          {SITE.faq.map((item) => (
            <details key={item.q} className="rounded-2xl border border-gold-500/25 bg-white p-5">
              <summary className="cursor-pointer font-display text-xl text-ink-900">
                {item.q}
              </summary>
              <p className="mt-3 leading-7 text-ink-600">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function RsvpContacts() {
  return (
    <section
      id="rsvp"
      aria-labelledby="rsvp-heading"
      className="scroll-mt-20 bg-white py-16 sm:py-20"
    >
      <Container size="md">
        <SectionHeading id="rsvp-heading" {...SITE.home.rsvp} />
        <div className="grid gap-4 sm:grid-cols-2">
          {SITE.rsvpContacts.map((contact) => (
            <article
              key={contact.tel}
              className="rounded-2xl border border-gold-500/30 p-5 text-center"
            >
              <h3 className="font-display text-2xl text-ink-900">{contact.name}</h3>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <a
                  className="text-magenta-600 underline underline-offset-4"
                  href={`tel:${contact.tel}`}
                >
                  Call
                </a>
                <a
                  className="text-magenta-600 underline underline-offset-4"
                  href={`https://wa.me/${contact.wa}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer
      data-theme="night"
      className="border-t border-gold-500/30 bg-night py-12 text-ivory sm:py-16"
    >
      <Container size="lg" className="flex flex-col items-center text-center">
        <Logo size={56} variant="light" className="mb-4" />
        <p className="font-signature text-4xl text-gold-500">{names}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ivory/70">
          {SITE.hashtag} · 19 December 2026
        </p>
        <GoldRule className="max-w-48" />
        <p className="max-w-md text-sm text-ivory/70">
          For questions or help with your invitation, please contact the RSVP coordinators.
        </p>
        <Link href="/privacy" className="mt-6 text-sm text-gold-500 underline underline-offset-4">
          Privacy notice
        </Link>
      </Container>
    </footer>
  );
}
