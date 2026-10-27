'use client';

import { useState } from 'react';

export interface GuestData {
  id?: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  side: 'PARTNER_A' | 'PARTNER_B' | 'BOTH';
  maxPartySize: number;
  events: Array<{ slug: string; title?: string }>;
}

export interface GuestModalProps {
  guest: GuestData | null; // null when creating new guest
  onClose: () => void;
  onSuccess: () => void;
}

export function GuestModal({ guest, onClose, onSuccess }: GuestModalProps) {
  const isEditing = Boolean(guest?.id);

  const [displayName, setDisplayName] = useState(guest?.displayName || '');
  const [email, setEmail] = useState(guest?.email || '');
  const [phone, setPhone] = useState(guest?.phone || '');
  const [side, setSide] = useState<'PARTNER_A' | 'PARTNER_B' | 'BOTH'>(guest?.side || 'BOTH');
  const [maxPartySize, setMaxPartySize] = useState(guest?.maxPartySize || 1);
  const [eventSlugs, setEventSlugs] = useState<string[]>(
    guest?.events && guest.events.length > 0
      ? guest.events.map((e) => e.slug)
      : ['solemnization', 'reception'],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleEvent = (slug: string) => {
    if (eventSlugs.includes(slug)) {
      if (eventSlugs.length > 1) {
        setEventSlugs(eventSlugs.filter((s) => s !== slug));
      }
    } else {
      setEventSlugs([...eventSlugs, slug]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        side,
        maxPartySize: Number(maxPartySize),
        eventSlugs,
      };

      const url = isEditing ? `/api/admin/guests/${guest?.id}` : '/api/admin/guests';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to save guest');
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
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-xl font-serif font-bold text-ink-900">
            {isEditing ? 'Edit Guest' : 'Add New Guest'}
          </h2>
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
          <div>
            <label className="block text-xs font-semibold mb-1">Guest Name / Family Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. & Mrs. Adeleke"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border border-ink-300 p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as 'PARTNER_A' | 'PARTNER_B' | 'BOTH')}
                className="w-full rounded border border-ink-300 p-2 text-sm bg-white"
              >
                <option value="BOTH">Both</option>
                <option value="PARTNER_A">Partner A (Bride)</option>
                <option value="PARTNER_B">Partner B (Groom)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Max Party Size *</label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={maxPartySize}
                onChange={(e) => setMaxPartySize(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded border border-ink-300 p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-ink-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phone</label>
              <input
                type="tel"
                placeholder="+2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border border-ink-300 p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">Invited Events *</label>
            <div className="flex gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventSlugs.includes('solemnization')}
                  onChange={() => handleToggleEvent('solemnization')}
                />
                <span>Solemnization</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventSlugs.includes('reception')}
                  onChange={() => handleToggleEvent('reception')}
                />
                <span>Reception</span>
              </label>
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
              className="rounded !bg-magenta-700 bg-magenta-800 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Guest' : 'Create Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
