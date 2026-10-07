import Link from 'next/link';
import type { SiteMode } from '@prisma/client';
import { Monogram } from '@/components/brand';
import { SITE } from '@/content/site.config';
import { Countdown } from './Countdown';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export interface HeroProps {
  mode?: SiteMode;
  liveStreamUrl?: string | null;
}

export function Hero({ mode = 'PRE', liveStreamUrl }: HeroProps) {
  const firstNameA = SITE.couple.a.split(' ')[0] ?? 'Adetolani';
  const firstNameB = SITE.couple.b.split(' ')[0] ?? 'Abiodun';

  // Mode-driven eyebrow
  const eyebrow =
    mode === 'POST'
      ? 'Thank you for celebrating with us'
      : mode === 'LIVE'
        ? 'Today we celebrate'
        : 'Together with our families';

  return (
    <section className="hero" id="home">
      <div
        className="hero-carousel"
        role="img"
        aria-label="The couple dressed for their celebration"
      >
        <div className="hero-slide hero-slide--1" />
        <div className="hero-slide hero-slide--2" />
        <div className="hero-slide hero-slide--3" />
      </div>
      <div className="hero-shade" />
      <div className="corner corner--tl" />
      <div className="corner corner--tr" />
      <div className="hero-copy">
        <p className="eyebrow" data-testid="hero-eyebrow">
          {eyebrow}
        </p>
        <Monogram />
        <h1>
          {firstNameA} <em>&amp;</em> {firstNameB}
        </h1>

        <div className="ornament my-2">
          <span />
          <Countdown mode={mode} />
          <span />
        </div>

        <p className="hero-place">
          {SITE.venue.city}, {SITE.venue.state}
        </p>

        <div className="hero-actions">
          {mode === 'POST' ? (
            <>
              <Link
                href="/gallery"
                className="button button--magenta"
                data-testid="hero-primary-cta"
              >
                View Photo Gallery <ArrowIcon />
              </Link>
              <Link href="/gift" className="button button--glass" data-testid="hero-secondary-cta">
                Send a Love Gift
              </Link>
            </>
          ) : mode === 'LIVE' ? (
            <>
              {liveStreamUrl ? (
                <a
                  href={liveStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--magenta"
                  data-testid="hero-primary-cta"
                >
                  Watch Livestream <ArrowIcon />
                </a>
              ) : (
                <Link
                  href="/rsvp"
                  className="button button--magenta"
                  data-testid="hero-primary-cta"
                >
                  Joyfully respond <ArrowIcon />
                </Link>
              )}
              <a href="#events" className="button button--glass" data-testid="hero-secondary-cta">
                View Schedule
              </a>
            </>
          ) : (
            <>
              <Link href="/rsvp" className="button button--magenta" data-testid="hero-primary-cta">
                Joyfully respond <ArrowIcon />
              </Link>
              <a href="#venue" className="button button--glass" data-testid="hero-secondary-cta">
                View directions
              </a>
            </>
          )}
        </div>
      </div>
      <div className="scroll-cue">
        <span />
        <p>Discover our story</p>
        <p style={{ textTransform: 'none' }} className="text-[10px]">
          #designedToBi&apos;26
        </p>
      </div>
    </section>
  );
}
