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
