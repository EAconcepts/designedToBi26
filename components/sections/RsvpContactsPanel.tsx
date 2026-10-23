import Link from 'next/link';
import { SITE } from '@/content/site.config';

export interface RsvpContactsPanelProps {
  title?: string;
  subtitle?: string;
  isClosed?: boolean;
}

export function RsvpContactsPanel({
  title = 'Contact Our RSVP Coordinators',
  subtitle = 'We would love to hear from you — reach our coordinators directly by phone or WhatsApp.',
  isClosed = false,
}: RsvpContactsPanelProps) {
  const whatsappIntro = encodeURIComponent(
    `Hello! I'm reaching out regarding ${SITE.couple.a} & ${SITE.couple.b}'s wedding invitation.`,
  );

  return (
    <div className="rsvp-contacts-panel paper-card" role="region" aria-label="RSVP Contacts">
      <div className="rsvp-contacts-panel__header">
        <p className="section-kicker section-kicker--gold">{isClosed ? 'RSVP Closed' : 'RSVP'}</p>
        <h2 className="rsvp-contacts-panel__title">{title}</h2>
        <p className="rsvp-contacts-panel__subtitle">{subtitle}</p>
      </div>

      <div className="rsvp-contacts-panel__list">
        {SITE.rsvpContacts.map((contact) => (
          <div key={contact.name} className="rsvp-contact-card">
            <div className="rsvp-contact-card__info">
              <span className="rsvp-contact-card__name">{contact.name}</span>
              <span className="rsvp-contact-card__role">RSVP Coordinator</span>
            </div>
            <div className="rsvp-contact-card__actions">
              <a
                href={`tel:${contact.tel}`}
                className="button button--call"
                aria-label={`Call ${contact.name} at ${contact.tel}`}
              >
                Call
              </a>
              <a
                href={`https://wa.me/${contact.wa}?text=${whatsappIntro}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--magenta"
                aria-label={`Message ${contact.name} on WhatsApp`}
              >
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="rsvp-contacts-panel__footer">
        <Link href="/" className="button button--glass" style={{ color: 'var(--ink)' }}>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
