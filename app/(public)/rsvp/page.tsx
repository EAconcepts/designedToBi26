'use client';

import { RsvpPrefillProvider, useRsvpPrefill } from '@/components/forms/RsvpPrefillProvider';
import { RsvpForm } from '@/components/sections/RsvpForm';
import { RsvpContactsPanel } from '@/components/sections/RsvpContactsPanel';
import { SITE } from '@/content/site.config';

function RsvpPageContent() {
  const { guest, loading } = useRsvpPrefill();

  if (loading) {
    return (
      <div className="route-page">
        <div
          className="paper-section paper-card"
          style={{
            maxWidth: '640px',
            margin: '40px auto',
            textAlign: 'center',
            padding: '60px 24px',
          }}
        >
          <div className="locked-seal">AE</div>
          <p className="section-kicker section-kicker--gold">Preparing your invitation</p>
          <h2
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: '16px 0' }}
          >
            Loading your response details...
          </h2>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="route-page">
        <div style={{ maxWidth: '640px', margin: '40px auto' }}>
          <RsvpContactsPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="route-page">
      <div style={{ maxWidth: '680px', margin: '40px auto' }}>
        <RsvpForm guest={guest} />
      </div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <RsvpPrefillProvider>
      <noscript>
        <div className="route-page">
          <div
            className="paper-section paper-card"
            style={{
              maxWidth: '640px',
              margin: '40px auto',
              textAlign: 'center',
              padding: '40px 24px',
            }}
          >
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }}>RSVP via Phone or WhatsApp</h2>
            <p style={{ margin: '16px 0' }}>
              JavaScript is disabled in your browser. You can reach our RSVP coordinators directly:
            </p>
            {SITE.rsvpContacts.map((contact) => (
              <p key={contact.name}>
                <strong>{contact.name}:</strong> <a href={`tel:${contact.tel}`}>{contact.tel}</a>
              </p>
            ))}
          </div>
        </div>
      </noscript>
      <RsvpPageContent />
    </RsvpPrefillProvider>
  );
}
