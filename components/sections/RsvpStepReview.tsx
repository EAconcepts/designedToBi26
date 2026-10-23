import type { RsvpFormApi } from '@/components/forms/useRsvpForm';

interface RsvpStepReviewProps {
  form: RsvpFormApi;
}

export function RsvpStepReview({ form }: RsvpStepReviewProps) {
  const { attendees, declined, message, songRequest } = form;

  return (
    <fieldset className="form-step-fieldset">
      <legend className="form-step-legend">
        <span className="section-kicker section-kicker--gold">Step 4 of 4</span>
        <h2>Review and send your response</h2>
        <p>Please double-check your response details before submitting.</p>
      </legend>

      <div className="review-summary paper-card paper-card--flat">
        <div className="review-summary__item">
          <span className="review-label">Attendance:</span>
          <span className="review-value">
            {declined ? (
              <strong style={{ color: '#8c2438' }}>Regretfully Declining</strong>
            ) : (
              <strong style={{ color: '#2a5a3b' }}>Joyfully Attending</strong>
            )}
          </span>
        </div>

        {!declined && (
          <div className="review-summary__item">
            <span className="review-label">Guests:</span>
            <div className="review-attendees">
              {attendees.map((att, idx) => (
                <div key={idx} className="review-attendee-line">
                  <strong>{att.name}</strong> ({att.events.length}{' '}
                  {att.events.length === 1 ? 'event' : 'events'})
                </div>
              ))}
            </div>
          </div>
        )}

        {songRequest && (
          <div className="review-summary__item">
            <span className="review-label">Song Request:</span>
            <span className="review-value">{songRequest}</span>
          </div>
        )}

        {message && (
          <div className="review-summary__item">
            <span className="review-label">Note:</span>
            <span className="review-value">{message}</span>
          </div>
        )}
      </div>
    </fieldset>
  );
}
