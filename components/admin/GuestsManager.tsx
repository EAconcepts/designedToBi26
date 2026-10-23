'use client';

import { useState, useEffect, useCallback } from 'react';
import { GuestModal, type GuestData } from './GuestModal';

interface GuestRow {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  side: 'PARTNER_A' | 'PARTNER_B' | 'BOTH';
  maxPartySize: number;
  createdAt: string;
  events: Array<{ slug: string; title: string }>;
  rsvpStatus: string;
}

export function GuestsManager() {
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<string>('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestData | null>(null);

  const fetchGuests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (sideFilter) params.set('side', sideFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/guests?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to fetch guests');
      }
      setRows(data.data.rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching guests');
    } finally {
      setLoading(false);
    }
  }, [search, sideFilter]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('q', search.trim());
        if (sideFilter) params.set('side', sideFilter);
        params.set('limit', '100');

        const res = await fetch(`/api/admin/guests?${params.toString()}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.message || 'Failed to fetch guests');
        }
        setRows(data.data.rows);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error fetching guests');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [search, sideFilter]);

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-lg border border-ink-100 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-gold-500"
          />

          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            className="rounded-md border border-ink-300 px-3 py-2 text-sm bg-white focus:outline-gold-500"
          >
            <option value="">All Sides</option>
            <option value="BOTH">Both</option>
            <option value="PARTNER_A">Partner A (Bride)</option>
            <option value="PARTNER_B">Partner B (Groom)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGuest(null);
            setModalOpen(true);
          }}
          className="rounded-md bg-magenta-700 hover:bg-magenta-800 text-white px-5 py-2 text-sm font-semibold min-h-[44px]"
        >
          + Add Guest
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Content list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Loading guest directory...</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink-500 bg-white rounded-lg border border-ink-100">
          No guests found matching your filters.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-ink-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Side</th>
                  <th className="px-4 py-3 font-semibold">Cap</th>
                  <th className="px-4 py-3 font-semibold">RSVP Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink-900">{row.displayName}</div>
                      <div className="text-xs text-ink-500">
                        {row.phone || row.email || 'No contact provided'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-600">{row.side}</td>
                    <td className="px-4 py-3.5 text-sm font-medium">{row.maxPartySize}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${
                          row.rsvpStatus === 'ATTENDING'
                            ? 'bg-green-100 text-green-800'
                            : row.rsvpStatus === 'DECLINED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.rsvpStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGuest({
                            id: row.id,
                            displayName: row.displayName,
                            email: row.email,
                            phone: row.phone,
                            side: row.side,
                            maxPartySize: row.maxPartySize,
                            events: row.events,
                          });
                          setModalOpen(true);
                        }}
                        className="rounded px-2.5 py-1 text-xs border border-magenta-200 hover:bg-magenta-50 text-magenta-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 640px) */}
          <div className="sm:hidden space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink-900">{row.displayName}</h3>
                    <p className="text-xs text-ink-500">
                      {row.phone || row.email || 'No contact provided'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.rsvpStatus === 'ATTENDING'
                        ? 'bg-green-100 text-green-800'
                        : row.rsvpStatus === 'DECLINED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {row.rsvpStatus}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-ink-600 border-t pt-2">
                  <div>Max Party: {row.maxPartySize}</div>
                  <div>Side: {row.side}</div>
                </div>

                <div className="pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuest({
                        id: row.id,
                        displayName: row.displayName,
                        email: row.email,
                        phone: row.phone,
                        side: row.side,
                        maxPartySize: row.maxPartySize,
                        events: row.events,
                      });
                      setModalOpen(true);
                    }}
                    className="w-full rounded border border-magenta-300 py-2 text-xs font-semibold text-magenta-800 hover:bg-magenta-50 min-h-[44px]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Guest Modal */}
      {modalOpen && (
        <GuestModal
          guest={editingGuest}
          onClose={() => {
            setModalOpen(false);
            setEditingGuest(null);
          }}
          onSuccess={fetchGuests}
        />
      )}
    </div>
  );
}
