import Link from 'next/link';
import { Monogram } from '@/components/brand';
import { SITE } from '@/content/site.config';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function Hero() {
  const firstNameA = SITE.couple.a.split(' ')[0] ?? 'Adetolani';
  const firstNameB = SITE.couple.b.split(' ')[0] ?? 'Abiodun';

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
        {/* <div className="hero-dots" aria-hidden="true">
          <span className="hero-dot hero-dot--1" />
          <span className="hero-dot hero-dot--2" />
          <span className="hero-dot hero-dot--3" />
        </div> */}
      </div>
      <div className="hero-shade" />
      <div className="corner corner--tl" />
      <div className="corner corner--tr" />
      <div className="hero-copy">
        <p className="eyebrow">Together with our families</p>
        <Monogram />
        <h1>
          {firstNameA} <em>&amp;</em> {firstNameB}
        </h1>
        <div className="ornament">
          <span />
          <b>19 · 12 · 2026</b>
          <span />
        </div>
        <p className="hero-place">
          {SITE.venue.city}, {SITE.venue.state}
        </p>
        <div className="hero-actions">
          <Link href="/rsvp" className="button button--magenta">
            Joyfully respond <ArrowIcon />
          </Link>
          <a href="#venue" className="button button--glass">
            View directions
          </a>
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
