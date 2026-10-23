'use client';

import Link from 'next/link';
import type { GuestSession } from '@/lib/validation/session';
import { useRsvpForm } from '@/components/forms/useRsvpForm';
import { RsvpStepper } from '@/components/ui/RsvpStepper';
import { RsvpContactsPanel } from '@/components/sections/RsvpContactsPanel';
import { RsvpStepAttendees } from '@/components/sections/RsvpStepAttendees';
import { RsvpStepEvents } from '@/components/sections/RsvpStepEvents';
import { RsvpStepDetails } from '@/components/sections/RsvpStepDetails';
import { RsvpStepReview } from '@/components/sections/RsvpStepReview';
import { RsvpSuccessCard } from '@/components/sections/RsvpSuccessCard';

interface RsvpFormProps {
  session: GuestSession | null;
}

const STEPS = ['Attendees', 'Events', 'Details & Notes', 'Review & Confirm'];

export function RsvpForm({ session }: RsvpFormProps) {
  const form = useRsvpForm(session);

  if (form.isClosed) {
    return (
      <RsvpContactsPanel
        title="RSVPs Are Now Closed"
        subtitle="The deadline to respond online has passed. If you need assistance with your attendance, please message our team directly."
        isClosed
      />
    );
  }

  if (form.isComplete) {
    return <RsvpSuccessCard form={form} />;
  }

  return (
    <div className="rsvp-form-container paper-section">
      <RsvpStepper currentStep={form.step} totalSteps={4} steps={STEPS} />

      {form.generalError && (
        <div className="alert alert--error" role="alert">
          {form.generalError}
        </div>
      )}

      <form className="editorial-form" onSubmit={form.handleSubmit} noValidate>
        {/* Honeypot field */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
          value={form.honeypot}
          onChange={(e) => form.setHoneypot(e.target.value)}
          aria-hidden="true"
        />

        {form.step === 1 && <RsvpStepAttendees form={form} />}
        {form.step === 2 && <RsvpStepEvents form={form} />}
        {form.step === 3 && <RsvpStepDetails form={form} />}
        {form.step === 4 && <RsvpStepReview form={form} />}

        {/* Stepper Navigation Buttons */}
        <div className="form-actions">
          {form.step > 1 && (
            <button
              type="button"
              className="button button--glass"
              onClick={form.handlePrevStep}
              disabled={form.isSubmitting}
            >
              Back
            </button>
          )}

          {form.step < 4 ? (
            <button
              key="btn-continue"
              type="button"
              className="button button--magenta"
              onClick={form.handleNextStep}
            >
              Continue <span>→</span>
            </button>
          ) : (
            <button
              key="btn-submit"
              type="submit"
              className="button button--magenta"
              disabled={form.isSubmitting}
            >
              {form.isSubmitting ? 'Sending your response...' : 'Confirm and Send RSVP'}
            </button>
          )}
        </div>

        <p className="privacy-hint">
          Your response is confidential and will be used only for seating and guest arrangements.{' '}
          <Link href="/privacy">Privacy Notice</Link>
        </p>
      </form>
    </div>
  );
}
