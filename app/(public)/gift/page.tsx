import { Container, SectionHeading } from '@/components/ui';

export default function GiftPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <SectionHeading eyebrow="With love" title="Gift options" />
      <p className="mx-auto max-w-xl text-center leading-7 text-ink-600">
        Your presence is a gift. If you would like to support our new beginning, the available
        options will be shared here.
      </p>
      {/* coming in the next sprint */}
    </Container>
  );
}
