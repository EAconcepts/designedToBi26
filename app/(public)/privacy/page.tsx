import { Container, SectionHeading } from '@/components/ui';

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-24 bg-ivory">
      <Container size="md">
        <SectionHeading eyebrow="Privacy &amp; Data" title="Privacy Notice (NDPA 2023)" />
        <div className="text-ink-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed space-y-4">
          <p>
            This website is provided solely for celebrating the wedding of Adetolani Esther &amp;
            Abiodun Emmanuel and managing guest attendance, dietary preferences, and gifting.
          </p>
          <p>
            In accordance with the Nigeria Data Protection Act (NDPA 2023), we collect only the
            minimum personal information required to coordinate your attendance. We never share or
            sell your contact information.
          </p>
          <p>
            For questions or requests regarding your RSVP information, please reach out to the
            contacts listed on your invitation.
          </p>
        </div>
      </Container>
    </div>
  );
}
