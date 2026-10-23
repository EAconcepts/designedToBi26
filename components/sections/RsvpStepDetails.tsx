import type { RsvpFormApi } from '@/components/forms/useRsvpForm';

interface RsvpStepDetailsProps {
  form: RsvpFormApi;
}

export function RsvpStepDetails({ form }: RsvpStepDetailsProps) {
  const { declined, message, setMessage, songRequest, setSongRequest } = form;

  return (
    <fieldset className="form-step-fieldset">
      <legend className="form-step-legend">
        <span className="section-kicker section-kicker--gold">Step 3 of 4</span>
        <h2>A note for the couple</h2>
        <p>Share your wishes, a special song, or notes for our planning team.</p>
      </legend>

      {!declined && (
        <div className="form-field">
          <label htmlFor="song-request">
            Dance-floor song request
            <span className="field-hint">A track that is guaranteed to get you moving</span>
          </label>
          <input
            id="song-request"
            type="text"
            className="input"
            placeholder="e.g. Sweet Mother - Prince Nico Mbarga"
            value={songRequest}
            onChange={(e) => setSongRequest(e.target.value)}
            maxLength={120}
          />
        </div>
      )}

      <div className="form-field">
        <label htmlFor="couple-message">
          Private note for Adetolani &amp; Emmanuel
          <span className="field-hint">Visible only to the couple</span>
        </label>
        <textarea
          id="couple-message"
          className="input textarea"
          rows={4}
          placeholder="Share your love, memories, or prayers..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={600}
        />
      </div>
    </fieldset>
  );
}
