'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { LogoReveal } from '@/components/motion';
import { Container, GoldRule } from '@/components/ui';
import { SITE } from '@/content/site.config';

const OpeningSequence = dynamic(
  () => import('@/components/motion').then((mod) => mod.OpeningSequence),
  {
    ssr: false,
    loading: () => null,
  },
);

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
    <section
      aria-labelledby="home-title"
      className="relative overflow-hidden bg-ivory py-16 text-center sm:py-24 md:py-28"
    >
      <OpeningSequence />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(233,196,95,0.16),_transparent_55%)]"
      />
      <Container size="md" className="relative z-10 flex flex-col items-center">
        <LogoReveal
          src={SITE.brand.logo.src}
          alt={`${SITE.couple.initials} monogram`}
          size={104}
          className="mb-6"
        />
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
