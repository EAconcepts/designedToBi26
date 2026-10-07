import { EnvelopeIntro } from '@/components/brand';
import {
  ColourOfDay,
  EventsSection,
  FaqSection,
  GalleryTeaser,
  GiftTeaser,
  Hero,
  InvitationText,
  RsvpContacts,
  StoryTimeline,
  VenueSection,
} from '@/components/sections';

export default function HomePage() {
  return (
    <>
      <EnvelopeIntro />
      <Hero />
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
