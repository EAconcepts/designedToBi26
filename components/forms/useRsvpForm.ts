'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GuestSession } from '@/lib/validation/session';
import { SITE } from '@/content/site.config';

export interface FormAttendee {
  name: string;
  events: string[];
  meal?: string;
  dietary?: string;
}

export interface RsvpFormApi {
  // Derived
  session: GuestSession | null;
  maxPartySize: number;
  eventSlugs: string[];

  // Form values
  step: number;
  declined: boolean;
  attendees: FormAttendee[];
  responderName: string;
  responderEmail: string;
  responderPhone: string;
  startFresh: boolean;
  songRequest: string;
  message: string;
  honeypot: string;

  // Submission status
  isSubmitting: boolean;
  isComplete: boolean;
  completedStatus: 'ATTENDING' | 'DECLINED';
  isClosed: boolean;

  // Validation
  generalError: string | null;
  fieldErrors: Record<string, string>;

  // Actions
  setDeclined: Dispatch<SetStateAction<boolean>>;
  setResponderEmail: Dispatch<SetStateAction<string>>;
  setResponderPhone: Dispatch<SetStateAction<string>>;
  setSongRequest: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setHoneypot: Dispatch<SetStateAction<string>>;
  handleResponderNameChange: (name: string) => void;
  handleStartFresh: () => void;
  handleNameChange: (index: number, name: string) => void;
  handleAddAttendee: () => void;
  handleRemoveAttendee: (index: number) => void;
  handleEventToggle: (attendeeIndex: number, eventSlug: string) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleEditResponse: () => void;
  handleSubmit: (e: FormEvent) => void;
}

export function useRsvpForm(session: GuestSession | null): RsvpFormApi {
  // Initialize state from an existing (same-browser) response if present
  const existingRsvp = session?.rsvp ?? null;
  const initialDeclined = existingRsvp?.status === 'DECLINED';
  const maxPartySize = session?.maxPartySize ?? SITE.rsvp.maxPartySize;
  const eventSlugs = session?.events ?? SITE.events.map((event) => event.slug);

  const initialAttendees: FormAttendee[] =
    existingRsvp && existingRsvp.attendees.length > 0
      ? existingRsvp.attendees.map((a) => ({
          name: a.name,
          events: a.events.filter((slug) => eventSlugs.includes(slug)),
          meal: a.meal ?? undefined,
          dietary: a.dietary ?? undefined,
        }))
      : [
          {
            name: session?.displayName ?? '',
            events: [...eventSlugs],
          },
        ];

  const [step, setStep] = useState(1);
  const [declined, setDeclined] = useState(initialDeclined);
  const [attendees, setAttendees] = useState<FormAttendee[]>(initialAttendees);
  const [responderName, setResponderName] = useState(session?.displayName ?? '');
  const [responderEmail, setResponderEmail] = useState('');
  const [responderPhone, setResponderPhone] = useState('');
  const [startFresh, setStartFresh] = useState(false);
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
  const handleResponderNameChange = (name: string) => {
    setResponderName(name);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next['name'];
      return next;
    });
    // Convenience: keep the first attendee row in sync while it is still empty
    setAttendees((prev) => {
      const first = prev[0];
      if (!first || first.name.trim() !== '') return prev;
      return [{ ...first, name }, ...prev.slice(1)];
    });
  };

  const handleStartFresh = () => {
    setStartFresh(true);
    setResponderName('');
    setResponderEmail('');
    setResponderPhone('');
    setDeclined(false);
    setAttendees([{ name: '', events: [...eventSlugs] }]);
    setSongRequest('');
    setMessage('');
    setStep(1);
    setGeneralError(null);
    setFieldErrors({});
  };

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
    if (attendees.length >= maxPartySize) return;
    setAttendees((prev) => [
      ...prev,
      {
        name: '',
        events: [...eventSlugs],
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

    if (step === 1) {
      if (!responderName.trim() || responderName.trim().length < 2) {
        errors['name'] = 'Name must be at least 2 characters';
      }

      if (!declined) {
        attendees.forEach((att, idx) => {
          if (!att.name.trim() || att.name.trim().length < 2) {
            errors[`attendees.${idx}.name`] = 'Name must be at least 2 characters';
          }
        });
      }

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

  const handleEditResponse = () => {
    setIsComplete(false);
    setStep(1);
  };

  const handleSubmit = async (e: FormEvent) => {
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
      name: responderName.trim(),
      email: responderEmail.trim() || undefined,
      phone: responderPhone.trim() || undefined,
      newResponse: startFresh,
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
            `A single response allows a maximum of ${maxPartySize} guests. Please adjust your party size.`,
          );
        } else if (error?.code === 'RATE_LIMITED') {
          setGeneralError(
            error.message ||
              'Too many attempts from this device. Please wait a few minutes and try again.',
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

  return {
    session,
    maxPartySize,
    eventSlugs,
    step,
    declined,
    attendees,
    responderName,
    responderEmail,
    responderPhone,
    startFresh,
    songRequest,
    message,
    honeypot,
    isSubmitting,
    isComplete,
    completedStatus,
    isClosed,
    generalError,
    fieldErrors,
    setDeclined,
    setResponderEmail,
    setResponderPhone,
    setSongRequest,
    setMessage,
    setHoneypot,
    handleResponderNameChange,
    handleStartFresh,
    handleNameChange,
    handleAddAttendee,
    handleRemoveAttendee,
    handleEventToggle,
    handleNextStep,
    handlePrevStep,
    handleEditResponse,
    handleSubmit,
  };
}
