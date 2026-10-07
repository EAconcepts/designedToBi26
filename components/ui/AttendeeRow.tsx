interface AttendeeRowProps {
  index: number;
  name: string;
  onNameChange: (name: string) => void;
  canRemove: boolean;
  onRemove: () => void;
  error?: string;
}

export function AttendeeRow({
  index,
  name,
  onNameChange,
  canRemove,
  onRemove,
  error,
}: AttendeeRowProps) {
  const inputId = `attendee-name-${index}`;
  const errorId = `attendee-error-${index}`;

  return (
    <div className="attendee-row paper-card paper-card--flat">
      <div className="attendee-row__header">
        <span className="attendee-row__index">Guest {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="attendee-row__remove-btn"
            onClick={onRemove}
            aria-label={`Remove Guest ${index + 1}`}
          >
            Remove
          </button>
        )}
      </div>

      <div className="attendee-row__fields">
        <label htmlFor={inputId} className="attendee-row__label">
          Full Name
        </label>
        <input
          id={inputId}
          name={`attendee-${index}-name`}
          type="text"
          className={`input ${error ? 'input--error' : ''}`}
          placeholder={index === 0 ? 'Your full name' : 'Companion full name'}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-describedby={error ? errorId : undefined}
          required
          minLength={2}
          maxLength={80}
        />
        {error && (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
