import Link from 'next/link';
import { SITE } from '@/content/site.config';

export interface RsvpContactsPanelProps {
  title?: string;
  subtitle?: string;
  isClosed?: boolean;
}

export function RsvpContactsPanel({
  title = 'Personal Invitation Required',
  subtitle = 'To respond online, please use the personalized invitation link sent to you or printed on your invitation card.',
  isClosed = false,
}: RsvpContactsPanelProps) {
  const whatsappIntro = encodeURIComponent(
    `Hello! I'm reaching out regarding ${SITE.couple.a} & ${SITE.couple.b}'s wedding invitation.`,
  );

  return (
    <div className="rsvp-contacts-panel paper-card" role="region" aria-label="RSVP Contacts">
      <div className="rsvp-contacts-panel__header">
        <p className="section-kicker section-kicker--gold">
          {isClosed ? 'RSVP Closed' : 'Invitation Code Required'}
        </p>
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
        <p>
          Already have your 8-character invitation code? Enter your full link (e.g.{' '}
          <code>/i/yourcode</code>) or message our coordinators above.
        </p>
        <Link href="/" className="button button--glass" style={{ color: 'var(--ink)' }}>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
