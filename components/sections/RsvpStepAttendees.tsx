import { AttendeeRow } from '@/components/ui/AttendeeRow';
import type { RsvpFormApi } from '@/components/forms/useRsvpForm';

interface RsvpStepAttendeesProps {
  form: RsvpFormApi;
}

export function RsvpStepAttendees({ form }: RsvpStepAttendeesProps) {
  const {
    attendees,
    declined,
    fieldErrors,
    maxPartySize,
    responderEmail,
    responderName,
    responderPhone,
    session,
    startFresh,
    handleAddAttendee,
    handleNameChange,
    handleRemoveAttendee,
    handleResponderNameChange,
    handleStartFresh,
    setDeclined,
    setResponderEmail,
    setResponderPhone,
  } = form;

  return (
    <fieldset className="form-step-fieldset">
      <legend className="form-step-legend">
        <span className="section-kicker section-kicker--gold">Step 1 of 4</span>
        <h2>Who is joining us?</h2>
        <p>Tell us who you are, then add everyone joining you — up to {maxPartySize} guests.</p>
      </legend>

      <div style={{ marginBottom: '24px' }}>
        <div className="form-field">
          <label htmlFor="responder-name">
            Your full name
            <span className="field-hint">Used to identify your response</span>
          </label>
          <input
            id="responder-name"
            type="text"
            className="input"
            placeholder="e.g. Adeyemi Tunde"
            value={responderName}
            onChange={(e) => handleResponderNameChange(e.target.value)}
            maxLength={100}
            aria-invalid={Boolean(fieldErrors['name'])}
          />
          {fieldErrors['name'] && (
            <p className="field-error" role="alert">
              {fieldErrors['name']}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="responder-email">
            Email address
            <span className="field-hint">Optional — we&apos;ll send your confirmation here</span>
          </label>
          <input
            id="responder-email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={responderEmail}
            onChange={(e) => setResponderEmail(e.target.value)}
            maxLength={254}
          />
          {fieldErrors['email'] && (
            <p className="field-error" role="alert">
              {fieldErrors['email']}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="responder-phone">
            Phone number
            <span className="field-hint">Optional — in case we need to reach you</span>
          </label>
          <input
            id="responder-phone"
            type="tel"
            className="input"
            placeholder="e.g. 0801 234 5678"
            value={responderPhone}
            onChange={(e) => setResponderPhone(e.target.value)}
            maxLength={25}
          />
          {fieldErrors['phone'] && (
            <p className="field-error" role="alert">
              {fieldErrors['phone']}
            </p>
          )}
        </div>
      </div>

      {session && !startFresh && (
        <p className="privacy-hint" style={{ marginBottom: '20px' }}>
          Someone else responding on this device?{' '}
          <button
            type="button"
            onClick={handleStartFresh}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: 'var(--magenta)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Start a different response
          </button>
        </p>
      )}

      <div className="choice-card choice-card--toggle" style={{ marginBottom: '24px' }}>
        <label>
          <input
            type="checkbox"
            checked={declined}
            onChange={(e) => setDeclined(e.target.checked)}
          />
          <span>
            <b>Regretfully decline</b>
            Sorry, we won’t be able to make it to the celebration
          </span>
        </label>
      </div>

      {!declined && (
        <div className="attendee-list">
          {attendees.map((attendee, index) => (
            <AttendeeRow
              key={index}
              index={index}
              name={attendee.name}
              onNameChange={(name) => handleNameChange(index, name)}
              canRemove={attendees.length > 1}
              onRemove={() => handleRemoveAttendee(index)}
              error={fieldErrors[`attendees.${index}.name`]}
            />
          ))}

          {attendees.length < maxPartySize && (
            <button
              type="button"
              className="button button--glass rsvp-add-attendee"
              onClick={handleAddAttendee}
            >
              + Add companion
            </button>
          )}
        </div>
      )}
    </fieldset>
  );
}
