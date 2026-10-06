import { Container, SectionHeading } from '@/components/ui';

export default function GalleryPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <SectionHeading eyebrow="Memories" title="Our gallery" />
      <p className="mx-auto max-w-xl text-center leading-7 text-ink-600">
        The photographs that tell our story will live here, ready for you to revisit and enjoy.
      </p>
      {/* coming in the next sprint */}
    </Container>
  );
}
