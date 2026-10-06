import { Container, SectionHeading } from '@/components/ui';
import { SITE } from '@/content/site.config';

export default function ThankYouPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <SectionHeading eyebrow="With gratitude" title={SITE.thankYou.headline} />
      <p className="mx-auto max-w-xl text-center leading-7 text-ink-600">{SITE.thankYou.body}</p>
      {/* coming in the next sprint */}
    </Container>
  );
}
