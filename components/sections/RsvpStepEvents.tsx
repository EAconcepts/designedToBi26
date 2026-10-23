import { SITE } from '@/content/site.config';
import type { RsvpFormApi } from '@/components/forms/useRsvpForm';

interface RsvpStepEventsProps {
  form: RsvpFormApi;
}

export function RsvpStepEvents({ form }: RsvpStepEventsProps) {
  const { attendees, declined, eventSlugs, handleEventToggle } = form;

  return (
    <fieldset className="form-step-fieldset">
      <legend className="form-step-legend">
        <span className="section-kicker section-kicker--gold">Step 2 of 4</span>
        <h2>Choose your celebration moments</h2>
        <p>Select which events each guest will be attending.</p>
      </legend>

      {declined ? (
        <p className="info-box">
          You have marked your response as declined. You can advance to leave a message.
        </p>
      ) : (
        <div className="attendee-events-group">
          {attendees.map((att, attIndex) => (
            <div
              key={attIndex}
              className="paper-card paper-card--flat"
              style={{ marginBottom: '20px' }}
            >
              <h3 style={{ marginBottom: '12px' }}>{att.name || `Guest ${attIndex + 1}`}</h3>
              <div className="event-checkbox-list">
                {SITE.events
                  .filter((event) => eventSlugs.includes(event.slug))
                  .map((event) => {
                    const isChecked = att.events.includes(event.slug);
                    return (
                      <label key={event.slug} className="choice-card">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleEventToggle(attIndex, event.slug)}
                        />
                        <span>
                          <b>{event.title}</b>
                          19 December 2026 · {event.timeTbc ? 'Time to be announced' : '11:00 AM'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
