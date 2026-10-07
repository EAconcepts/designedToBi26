interface RsvpStepperProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function RsvpStepper({ currentStep, steps }: RsvpStepperProps) {
  return (
    <nav className="rsvp-stepper" aria-label="RSVP Progress">
      <ol className="rsvp-stepper__list">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <li
              key={label}
              className={`rsvp-stepper__item ${isCurrent ? 'is-current' : ''} ${
                isCompleted ? 'is-completed' : ''
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="rsvp-stepper__indicator" aria-hidden="true">
                {isCompleted ? '✓' : stepNumber}
              </span>
              <span className="rsvp-stepper__label">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
