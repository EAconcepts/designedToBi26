import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/ui';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-ink-900">
      {/* Sticky / accessible top navigation */}
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-gold-500/20">
        <Container size="lg" className="flex items-center justify-between h-16 sm:h-20">
          <Link
            href="/"
            className="flex items-center gap-3 focus-visible:outline-gold-500 rounded-lg p-1"
          >
            <Logo size={40} />
            <span className="font-display text-xl sm:text-2xl font-semibold tracking-wide text-ink-900 hidden sm:inline">
              Adetolani &amp; Emmanuel
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm uppercase tracking-wider font-medium text-ink-600"
          >
            <Link href="#story" className="hover:text-magenta-600 transition-colors">
              Story
            </Link>
            <Link href="#events" className="hover:text-magenta-600 transition-colors">
              Events
            </Link>
            <Link href="#venue" className="hover:text-magenta-600 transition-colors">
              Venue
            </Link>
            <Link href="#rsvp" className="hover:text-magenta-600 transition-colors">
              RSVP
            </Link>
            <Link
              href="#rsvp"
              className="bg-magenta-600 hover:bg-magenta-800 text-white px-3.5 py-1.5 rounded-full transition-colors text-xs normal-case font-semibold"
            >
              Respond
            </Link>
          </nav>
        </Container>
      </header>

      {/* Main targetable region */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      {/* Branded footer */}
      <footer
        data-theme="night"
        className="bg-night text-ivory py-12 sm:py-16 border-t border-gold-500/30"
      >
        <Container size="lg" className="text-center flex flex-col items-center">
          <Logo size={56} variant="light" className="mb-4" />
          <p className="font-signature text-3xl sm:text-4xl text-gold-500 mb-2">
            Adetolani &amp; Emmanuel
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-ivory/70 mb-4">
            #designedToBi&apos;26 · 19 December 2026
          </p>
          <div className="w-16 h-[1px] bg-gold-500/40 my-4" aria-hidden="true" />
          <p className="text-xs text-ivory/60 max-w-md mx-auto mb-6">
            For questions or assistance with your invitation, please reach out to the contacts on
            your card.
          </p>
          <div className="flex items-center gap-6 text-xs text-gold-500/80">
            <Link href="/privacy" className="hover:text-gold-500 underline underline-offset-4">
              Privacy Notice (NDPA)
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
