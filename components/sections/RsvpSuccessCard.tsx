import Link from 'next/link';
import { SITE } from '@/content/site.config';
import type { RsvpFormApi } from '@/components/forms/useRsvpForm';
import Image from 'next/image';

interface RsvpSuccessCardProps {
  form: RsvpFormApi;
}

export function RsvpSuccessCard({ form }: RsvpSuccessCardProps) {
  const { attendees, completedStatus, handleEditResponse } = form;

  return (
    <div className="form-success paper-card !px-2" role="region" aria-label="RSVP Confirmation">
      <Image src={SITE.brand.logo.src} alt="Couple Logo" width={46} height={46} />

      <p className="section-kicker section-kicker--gold">Response Received</p>
      <h2 className="form-success__title">
        {completedStatus === 'ATTENDING'
          ? 'We’re overjoyed you’ll be with us!'
          : 'Thank you for letting us know.'}
      </h2>
      <p className="form-success__subtitle">
        {completedStatus === 'ATTENDING'
          ? `Your response for ${attendees.length} ${
              attendees.length === 1 ? 'guest' : 'guests'
            } has been recorded. Add the dates below to your calendar.`
          : 'We’re sorry you can’t make it, but we deeply appreciate your warm wishes and love.'}
      </p>

      {completedStatus === 'ATTENDING' && (
        <div className="form-success__events">
          {SITE.events
            .filter((ev) => attendees.some((att) => att.events.includes(ev.slug)))
            .map((ev) => {
              const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `${ev.title} - Adetolani & Emmanuel`,
              )}&dates=20261219T100000Z/20261219T140000Z&location=${encodeURIComponent(
                `${SITE.venue.name}, ${SITE.venue.address}, ${SITE.venue.city}`,
              )}`;

              return (
                <div key={ev.slug} className="success-event-card">
                  <div>
                    <strong>{ev.title}</strong>
                    <p>Saturday, 19 December 2026</p>
                  </div>
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--glass"
                  >
                    Add to Calendar
                  </a>
                </div>
              );
            })}
        </div>
      )}

      <div className="form-success__actions">
        <button type="button" className="button !button--glass" onClick={handleEditResponse}>
          Edit Response
        </button>
        <Link href="/" className="button !button--magenta">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
