import { RsvpPrefillProvider } from '@/components/forms/RsvpPrefillProvider';
import { RsvpContacts } from '@/components/sections';
import { Container, SectionHeading } from '@/components/ui';

export default function RsvpPage() {
  return (
    <RsvpPrefillProvider>
      <Container size="md" className="pt-16 sm:pt-24">
        <SectionHeading eyebrow="RSVP" title="Your response matters to us" />
        <p className="mx-auto mb-8 max-w-xl text-center leading-7 text-ink-600">
          Use the personalised link in your invitation to share your response, or contact a
          coordinator below.
        </p>
      </Container>
      <RsvpContacts />
      {/* coming in the next sprint */}
    </RsvpPrefillProvider>
  );
}
