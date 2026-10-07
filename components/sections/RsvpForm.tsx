'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GuestSession } from '@/lib/validation/session';
import { RsvpStepper } from '@/components/ui/RsvpStepper';
import { AttendeeRow } from '@/components/ui/AttendeeRow';
import { RsvpContactsPanel } from '@/components/sections/RsvpContactsPanel';
import { SITE } from '@/content/site.config';

interface RsvpFormProps {
  guest: GuestSession;
}

interface FormAttendee {
  name: string;
  events: string[];
  meal?: string;
  dietary?: string;
}

const STEPS = ['Attendees', 'Events', 'Details & Notes', 'Review & Confirm'];

export function RsvpForm({ guest }: RsvpFormProps) {
  // Initialize state from existing RSVP prefill if present
  const existingRsvp = guest.rsvp;
  const initialDeclined = existingRsvp?.status === 'DECLINED';

  const initialAttendees: FormAttendee[] =
    existingRsvp && existingRsvp.attendees.length > 0
      ? existingRsvp.attendees.map((a) => ({
          name: a.name,
          events: a.events.filter((slug) => guest.events.includes(slug)),
          meal: a.meal ?? undefined,
          dietary: a.dietary ?? undefined,
        }))
      : [
          {
            name: guest.displayName,
            events: [...guest.events],
          },
        ];

  const [step, setStep] = useState(1);
  const [declined, setDeclined] = useState(initialDeclined);
  const [attendees, setAttendees] = useState<FormAttendee[]>(initialAttendees);
  const [songRequest, setSongRequest] = useState(existingRsvp?.songRequest ?? '');
  const [message, setMessage] = useState(existingRsvp?.message ?? '');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedStatus, setCompletedStatus] = useState<'ATTENDING' | 'DECLINED'>(
    initialDeclined ? 'DECLINED' : 'ATTENDING',
  );

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isClosed, setIsClosed] = useState(false);

  // Attendee mutations
  const handleNameChange = (index: number, name: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], name };
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`attendees.${index}.name`];
      return next;
    });
  };

  const handleAddAttendee = () => {
    if (attendees.length >= guest.maxPartySize) return;
    setAttendees((prev) => [
      ...prev,
      {
        name: '',
        events: [...guest.events],
      },
    ]);
  };

  const handleRemoveAttendee = (index: number) => {
    if (attendees.length <= 1) return;
    setAttendees((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`attendees.${index}.name`];
      return next;
    });
  };

  const handleEventToggle = (attendeeIndex: number, eventSlug: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      const attendee = next[attendeeIndex];
      if (!attendee) return prev;

      const currentEvents = new Set(attendee.events);
      if (currentEvents.has(eventSlug)) {
        currentEvents.delete(eventSlug);
      } else {
        currentEvents.add(eventSlug);
      }
      next[attendeeIndex] = { ...attendee, events: Array.from(currentEvents) };
      return next;
    });
  };

  // Step validation before advancing
  const handleNextStep = () => {
    setGeneralError(null);
    const errors: Record<string, string> = {};

    if (step === 1 && !declined) {
      attendees.forEach((att, idx) => {
        if (!att.name.trim() || att.name.trim().length < 2) {
          errors[`attendees.${idx}.name`] = 'Name must be at least 2 characters';
        }
      });

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    if (step === 2 && !declined) {
      const anyEmpty = attendees.some((att) => att.events.length === 0);
      if (anyEmpty) {
        setGeneralError('Please select at least one event for every attending guest.');
        return;
      }
    }

    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setGeneralError(null);
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Honeypot tripped silently
      setIsComplete(true);
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    const payload = {
      declined,
      attendees: declined
        ? []
        : attendees.map((att) => ({
            name: att.name.trim(),
            events: att.events,
            meal: att.meal?.trim() || undefined,
            dietary: att.dietary?.trim() || undefined,
          })),
      songRequest: songRequest.trim() || undefined,
      message: message.trim() || undefined,
    };

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        const error = result.error;
        if (error?.code === 'RSVP_CLOSED') {
          setIsClosed(true);
          setGeneralError('RSVPs are now closed. Please message our coordinators directly.');
        } else if (error?.code === 'PARTY_SIZE_EXCEEDED') {
          setGeneralError(
            `Your invitation allows a maximum of ${guest.maxPartySize} guests. Please adjust your party size.`,
          );
        } else if (error?.code === 'NOT_INVITED') {
          setGeneralError('One or more selected events are not part of your invitation.');
        } else if (error?.code === 'VALIDATION' && error.fields) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(error.fields)) {
            flat[key] = (msgs as string[])[0] || 'Invalid input';
          }
          setFieldErrors(flat);
          setGeneralError('Please correct the highlighted fields and try again.');
        } else {
          setGeneralError(error?.message || 'Failed to submit your response. Please try again.');
        }
        return;
      }

      setCompletedStatus(result.data.status);
      setIsComplete(true);
    } catch {
      setGeneralError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClosed) {
    return (
      <RsvpContactsPanel
        title="RSVPs Are Now Closed"
        subtitle="The deadline to respond online has passed. If you need assistance with your attendance, please message our team directly."
        isClosed
      />
    );
  }

  if (isComplete) {
    return (
      <div className="form-success paper-card" role="region" aria-label="RSVP Confirmation">
        <div className="locked-seal">AE</div>
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
              .filter((ev) => guest.events.includes(ev.slug))
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
          <button
            type="button"
            className="button button--glass"
            onClick={() => {
              setIsComplete(false);
              setStep(1);
            }}
          >
            Edit Response
          </button>
          <Link href="/" className="button button--magenta">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rsvp-form-container paper-section">
      <RsvpStepper currentStep={step} totalSteps={4} steps={STEPS} />

      {generalError && (
        <div className="alert alert--error" role="alert">
          {generalError}
        </div>
      )}

      <form className="editorial-form" onSubmit={handleSubmit} noValidate>
        {/* Honeypot field */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          aria-hidden="true"
        />

        {/* STEP 1: ATTENDEES */}
        {step === 1 && (
          <fieldset className="form-step-fieldset">
            <legend className="form-step-legend">
              <span className="section-kicker section-kicker--gold">Step 1 of 4</span>
              <h2>Who is joining us?</h2>
              <p>Your invitation covers up to {guest.maxPartySize} guests.</p>
            </legend>

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

                {attendees.length < guest.maxPartySize && (
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
        )}

        {/* STEP 2: EVENTS */}
        {step === 2 && (
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
                        .filter((event) => guest.events.includes(event.slug))
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
                                19 December 2026 ·{' '}
                                {event.timeTbc ? 'Time to be announced' : '11:00 AM'}
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
        )}

        {/* STEP 3: DETAILS & NOTES */}
        {step === 3 && (
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
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
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
        )}

        {/* Stepper Navigation Buttons */}
        <div className="form-actions">
          {step > 1 && (
            <button
              type="button"
              className="button button--glass"
              onClick={handlePrevStep}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              key="btn-continue"
              type="button"
              className="button button--magenta"
              onClick={handleNextStep}
            >
              Continue <span>→</span>
            </button>
          ) : (
            <button
              key="btn-submit"
              type="submit"
              className="button button--magenta"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending your response...' : 'Confirm and Send RSVP'}
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
