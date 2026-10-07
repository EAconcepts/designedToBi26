import { getSettings } from '@/lib/settings';
import { EnvelopeIntro } from '@/components/brand';
import {
  ColourOfDay,
  EventsSection,
  FaqSection,
  GalleryTeaser,
  GiftTeaser,
  Hero,
  LiveBanner,
  InvitationText,
  RsvpContacts,
  StoryTimeline,
  VenueSection,
} from '@/components/sections';

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <>
      <LiveBanner mode={settings.mode} liveStreamUrl={settings.liveStreamUrl} />
      <EnvelopeIntro />
      <Hero mode={settings.mode} liveStreamUrl={settings.liveStreamUrl} />
      <InvitationText />
      <StoryTimeline />
      <EventsSection />
      <VenueSection />
      <ColourOfDay />
      <GalleryTeaser />
      <GiftTeaser />
      <FaqSection />
      <RsvpContacts />
    </>
  );
}
