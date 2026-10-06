import { Container, SectionHeading } from '@/components/ui';
import { SITE } from '@/content/site.config';

export default function PrivacyPage() {
  const coupleNames = `${SITE.couple.a} & ${SITE.couple.b}`;
  const rsvpContacts = SITE.rsvpContacts.map((c) => `${c.name} (${c.tel})`).join(', ');

  return (
    <div className="py-16 sm:py-24 bg-ivory">
      <Container size="md">
        <SectionHeading
          eyebrow="Privacy &amp; Data Protection"
          title="Privacy Notice (NDPA 2023)"
        />
        <div className="text-ink-700 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="font-semibold text-ink-900 text-lg">Purpose of Processing</h2>
            <p>
              This website is provided solely to celebrate the wedding of {coupleNames}, coordinate
              guest attendance, convey event details, manage optional registry contributions, and
              facilitate celebratory guest photos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-ink-900 text-lg">Data Collected</h2>
            <p>
              In accordance with the Nigeria Data Protection Act (NDPA 2023), we only collect the
              minimum necessary information:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-ink-600">
              <li>Guest name, invitation code, email, and phone number (if provided)</li>
              <li>RSVP responses, attendance count, and dietary/meal requirements</li>
              <li>Gift contribution declarations and messages to the couple</li>
              <li>Photos shared through the guest moments upload gallery</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-ink-900 text-lg">Retention &amp; Sharing</h2>
            <p>
              We do not sell, rent, or share personal data with commercial third parties. Data is
              retained only for the duration needed to plan, execute, and deliver post-wedding
              memories to the couple.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-ink-900 text-lg">Your Rights &amp; Contact</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal
              information. To make a request, please contact our RSVP coordination team at:{' '}
              <span className="font-medium text-ink-900">{rsvpContacts}</span>.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
