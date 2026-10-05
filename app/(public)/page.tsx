'use client';

import { Button, Container, GoldRule, SectionHeading, useToast } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';

export default function HomePage() {
  const { showToast } = useToast();

  return (
    <div className="flex flex-col">
      {/* Light Hero Section */}
      <section className="py-20 sm:py-28 md:py-32 text-center bg-ivory">
        <Container size="md" className="flex flex-col items-center">
          <Logo size={80} className="mb-6 drop-shadow-sm" />

          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gold-500 font-semibold mb-3">
            The Wedding Celebration of
          </p>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold text-ink-900 tracking-tight leading-none mb-4">
            Adetolani &amp; Emmanuel
          </h1>

          <p className="font-signature text-2xl sm:text-3xl text-gold-500 mb-6">
            Adetolani Esther &amp; Abiodun Emmanuel
          </p>

          <GoldRule withDiamond className="max-w-xs" />

          <p className="text-base sm:text-lg text-ink-600 font-medium max-w-lg mb-8">
            Saturday, 19 December 2026 · 11:00 WAT
            <br />
            Methodist Church, Olorunsogo-GeriAlimi, Ilorin, Kwara State
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                showToast('RSVP flow opens in Sprint 2', {
                  title: 'RSVP Preview',
                  type: 'info',
                })
              }
            >
              Respond to Invitation
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                showToast('Directions & Map card will open here', {
                  title: 'Location',
                  type: 'info',
                })
              }
            >
              View Venue &amp; Directions
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() =>
                showToast('Interactive toast confirmed!', {
                  title: 'Token Verification',
                  type: 'success',
                })
              }
            >
              Test Notification
            </Button>
          </div>
        </Container>
      </section>

      {/* Night Section exercising data-theme="night" */}
      <section data-theme="night" className="py-20 sm:py-28 bg-night text-ivory">
        <Container size="md" className="text-center">
          <SectionHeading
            eyebrow="Celebration Palette"
            title="Colours of the Day"
            description="Our wedding palette reflects warmth, royalty, and joy. Guests are welcome to incorporate White, Gold, and Magenta."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto my-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white border border-gold-500/30 mb-3 shadow-inner" />
              <span className="font-display font-medium text-lg text-white">White</span>
              <span className="text-xs text-ivory/60 mt-1">Purity &amp; Light</span>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-gold-500/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gold-500 shadow-md mb-3" />
              <span className="font-display font-medium text-lg text-gold-500">Gold</span>
              <span className="text-xs text-ivory/60 mt-1">Elegance &amp; Grace</span>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-magenta-600/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-magenta-600 shadow-md mb-3" />
              <span className="font-display font-medium text-lg text-magenta-600">Magenta</span>
              <span className="text-xs text-ivory/60 mt-1">Royalty &amp; Love</span>
            </div>
          </div>

          <p className="font-signature text-2xl text-gold-500 mt-6">#designedToBi&apos;26</p>
        </Container>
      </section>
    </div>
  );
}
