import { Container, SectionHeading } from '@/components/ui';

export default function GiftCompletePage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <SectionHeading eyebrow="Thank you" title="We are grateful for your kindness" />
      <p className="mx-auto max-w-xl text-center leading-7 text-ink-600">
        Thank you for celebrating this new chapter with us. Your gift means so much.
      </p>
      {/* coming in the next sprint */}
    </Container>
  );
}
