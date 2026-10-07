'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RsvpListRow } from '@/lib/validation/admin';
import { ManualRsvpModal } from './ManualRsvpModal';

export function RsvpsManager() {
  const [rows, setRows] = useState<RsvpListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nonRespondersOnly, setNonRespondersOnly] = useState(false);

  // Modal
  const [activeGuest, setActiveGuest] = useState<RsvpListRow | null>(null);

  const fetchRsvps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (nonRespondersOnly) params.set('nonResponders', 'true');

      const res = await fetch(`/api/admin/rsvps?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to fetch RSVPs');
      }
      setRows(data.data.rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching RSVPs');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, nonRespondersOnly]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('q', search.trim());
        if (statusFilter) params.set('status', statusFilter);
        if (nonRespondersOnly) params.set('nonResponders', 'true');

        const res = await fetch(`/api/admin/rsvps?${params.toString()}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.message || 'Failed to fetch RSVPs');
        }
        setRows(data.data.rows);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error fetching RSVPs');
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
  }, [search, statusFilter, nonRespondersOnly]);

  // Derived stats
  const totalGuests = rows.length;
  const attendingGuests = rows.filter((r) => r.status === 'ATTENDING');
  const totalHeadcount = attendingGuests.reduce((sum, r) => sum + r.headcount, 0);
  const declinedCount = rows.filter((r) => r.status === 'DECLINED').length;
  const pendingCount = rows.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-medium">Total Guests</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">{totalGuests}</p>
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-green-700 font-medium">
            Attending (Headcount)
          </p>
          <p className="text-2xl font-bold text-green-800 mt-1">
            {attendingGuests.length}{' '}
            <span className="text-sm font-normal text-ink-500">({totalHeadcount} seats)</span>
          </p>
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-red-700 font-medium">Declined</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{declinedCount}</p>
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gold-700 font-medium">
            Pending Response
          </p>
          <p className="text-2xl font-bold text-gold-800 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Control bar: search, filters, actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-lg border border-ink-100 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-gold-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={nonRespondersOnly}
            className="rounded-md border border-ink-300 px-3 py-2 text-sm bg-white focus:outline-gold-500"
          >
            <option value="">All Statuses</option>
            <option value="ATTENDING">Attending</option>
            <option value="DECLINED">Declined</option>
            <option value="PENDING">Pending</option>
          </select>

          <label className="inline-flex items-center gap-2 text-sm text-ink-700 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={nonRespondersOnly}
              onChange={(e) => setNonRespondersOnly(e.target.checked)}
              className="rounded text-gold-600"
            />
            <span>Non-responders only</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/rsvps/export"
            download="rsvps-export.csv"
            className="inline-flex items-center justify-center rounded-md border border-gold-600 px-4 py-2 text-sm font-medium text-gold-700 hover:bg-gold-50 min-h-[44px]"
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Content list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Loading RSVP responses...</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink-500 bg-white rounded-lg border border-ink-100">
          No RSVP records found matching your filters.
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-ink-800">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-ink-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Party / Seats</th>
                  <th className="px-4 py-3 font-semibold">Events</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Responded</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((row) => (
                  <tr key={row.guestId} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink-900">{row.guestName}</div>
                      <div className="text-xs text-ink-500">
                        {row.phone || row.email || row.side}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium">{row.headcount}</span> / {row.maxPartySize}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-600">
                      {row.status === 'ATTENDING' && row.attendees.length > 0 ? (
                        <div>
                          {Object.entries(row.headcountByEvent).map(([slug, count]) => (
                            <span key={slug} className="inline-block mr-2 capitalize">
                              {slug}: {count}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-500">{row.source || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-ink-500">
                      {row.respondedAt
                        ? new Date(row.respondedAt).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveGuest(row)}
                        className="rounded px-3 py-1.5 text-xs font-medium text-magenta-800 hover:bg-magenta-50 border border-magenta-200"
                      >
                        {row.status === 'PENDING' ? 'Log RSVP' : 'Edit'}
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
                key={row.guestId}
                className="rounded-lg border border-ink-100 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink-900">{row.guestName}</h3>
                    <p className="text-xs text-ink-500">{row.phone || row.email || row.side}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                <div className="flex justify-between text-xs text-ink-600 border-t pt-2">
                  <div>
                    <span className="font-medium text-ink-900">{row.headcount}</span> of{' '}
                    {row.maxPartySize} attending
                  </div>
                  <div>Source: {row.source || 'Pending'}</div>
                </div>

                {row.status === 'ATTENDING' && row.attendees.length > 0 && (
                  <div className="text-xs text-ink-600 bg-neutral-50 p-2 rounded">
                    <strong>Attendees:</strong> {row.attendees.map((a) => a.name).join(', ')}
                  </div>
                )}

                <div className="pt-2 border-t flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveGuest(row)}
                    className="w-full rounded-md border border-magenta-300 py-2.5 text-sm font-semibold text-magenta-800 hover:bg-magenta-50 min-h-[44px]"
                  >
                    {row.status === 'PENDING' ? 'Log RSVP' : 'Edit RSVP'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Manual RSVP Modal */}
      {activeGuest && (
        <ManualRsvpModal
          guest={activeGuest}
          onClose={() => setActiveGuest(null)}
          onSuccess={fetchRsvps}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ATTENDING') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
        Attending
      </span>
    );
  }
  if (status === 'DECLINED') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
      Pending
    </span>
  );
}
