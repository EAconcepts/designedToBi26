'use client';

import { useState } from 'react';
import type { RsvpListRow } from '@/lib/validation/admin';

export interface ManualRsvpModalProps {
  guest: RsvpListRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualRsvpModal({ guest, onClose, onSuccess }: ManualRsvpModalProps) {
  const [source, setSource] = useState<'PHONE' | 'WHATSAPP'>('PHONE');
  const [declined, setDeclined] = useState(guest?.status === 'DECLINED');
  const [allowDeadlineOverride, setAllowDeadlineOverride] = useState(true);
  const [message, setMessage] = useState(guest?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attendees state
  const [attendees, setAttendees] = useState<
    Array<{ name: string; events: string[]; meal?: string; dietary?: string }>
  >(
    guest?.attendees && guest.attendees.length > 0
      ? guest.attendees.map((a) => ({
          name: a.name,
          events: a.events,
          meal: a.meal ?? undefined,
          dietary: a.dietary ?? undefined,
        }))
      : [{ name: guest?.guestName || '', events: ['solemnization', 'reception'] }],
  );

  if (!guest) return null;

  const maxPartySize = guest.maxPartySize;

  const handleAddAttendee = () => {
    if (attendees.length < maxPartySize) {
      setAttendees([...attendees, { name: '', events: ['solemnization', 'reception'] }]);
    }
  };

  const handleRemoveAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const handleAttendeeNameChange = (index: number, name: string) => {
    const updated = [...attendees];
    const target = updated[index];
    if (target) {
      updated[index] = { ...target, name };
      setAttendees(updated);
    }
  };

  const handleToggleEvent = (index: number, eventSlug: string) => {
    const updated = [...attendees];
    const target = updated[index];
    if (!target) return;
    const currentEvents = target.events;
    const newEvents = currentEvents.includes(eventSlug)
      ? currentEvents.length > 1
        ? currentEvents.filter((e) => e !== eventSlug)
        : currentEvents
      : [...currentEvents, eventSlug];
    updated[index] = { ...target, events: newEvents };
    setAttendees(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        declined,
        source,
        allowDeadlineOverride,
        attendees: declined
          ? []
          : attendees.map((a) => ({
              name: a.name.trim(),
              events: a.events,
              meal: a.meal?.trim() || null,
              dietary: a.dietary?.trim() || null,
            })),
        message: message.trim() || null,
      };

      const res = await fetch(`/api/admin/rsvps/${guest.guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to record manual RSVP');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900">Manual RSVP Entry</h2>
            <p className="text-xs text-ink-500">
              Guest: <strong>{guest.guestName}</strong> (Cap: {maxPartySize})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-ink-800">
          {/* Source & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'PHONE' | 'WHATSAPP')}
                className="w-full rounded-md border border-ink-300 p-2 text-sm bg-white"
              >
                <option value="PHONE">Phone Call</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select
                value={declined ? 'DECLINED' : 'ATTENDING'}
                onChange={(e) => setDeclined(e.target.value === 'DECLINED')}
                className="w-full rounded-md border border-ink-300 p-2 text-sm bg-white"
              >
                <option value="ATTENDING">Attending</option>
                <option value="DECLINED">Declined</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deadlineOverride"
              checked={allowDeadlineOverride}
              onChange={(e) => setAllowDeadlineOverride(e.target.checked)}
              className="rounded text-gold-600"
            />
            <label htmlFor="deadlineOverride" className="text-xs text-ink-600">
              Allow deadline override (admin privilege)
            </label>
          </div>

          {!declined && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-gold-700 uppercase tracking-wide">
                  Attendees ({attendees.length} / {maxPartySize})
                </span>
                {attendees.length < maxPartySize && (
                  <button
                    type="button"
                    onClick={handleAddAttendee}
                    className="text-xs text-magenta-700 font-medium hover:underline"
                  >
                    + Add Attendee
                  </button>
                )}
              </div>

              {attendees.map((attendee, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-ink-200 p-3 bg-neutral-50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Attendee Name"
                      value={attendee.name}
                      onChange={(e) => handleAttendeeNameChange(idx, e.target.value)}
                      required
                      className="flex-1 rounded border border-ink-300 p-1.5 text-sm"
                    />
                    {attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(idx)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendee.events.includes('solemnization')}
                        onChange={() => handleToggleEvent(idx, 'solemnization')}
                      />
                      <span>Solemnization</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendee.events.includes('reception')}
                        onChange={() => handleToggleEvent(idx, 'reception')}
                      />
                      <span>Reception</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <div>
              <label className="block text-xs font-semibold mb-1">Message to Couple</label>
              <textarea
                placeholder="Optional private message"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded border border-ink-300 p-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded px-4 py-2 text-sm border border-ink-300 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-magenta-700 hover:bg-magenta-800 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save RSVP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
