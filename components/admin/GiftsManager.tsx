'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatNGN } from '@/lib/money';

interface FundMeta {
  id: string;
  slug: string;
  title: string;
  goalMinor: number | null;
  verifiedMinor: number;
  giftCount: number;
}

interface GiftItem {
  id: string;
  reference: string;
  amountMinor: number;
  currency: string;
  giverName: string;
  giverEmail: string | null;
  message: string | null;
  isAnonymous: boolean;
  channel: 'PAYSTACK' | 'BANK_TRANSFER_DECLARED';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED';
  paidAt: string | null;
  createdAt: string;
  fund: { id: string; title: string; slug: string } | null;
}

interface GiftStats {
  totalSuccessMinor: number;
  totalCount: number;
  statusCounts: Record<string, number>;
  fundBreakdown: FundMeta[];
}

export function GiftsManager() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [fundFilter, setFundFilter] = useState('');

  // Confirmation Modal for Bank Transfer verification
  const [actionGift, setActionGift] = useState<GiftItem | null>(null);
  const [actionType, setActionType] = useState<'SUCCESS' | 'ABANDONED' | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      if (fundFilter) params.set('fund', fundFilter);

      const res = await fetch(`/api/admin/gifts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to fetch gifts');
      }
      setGifts(data.data.gifts);
      setStats(data.data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading gifts');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, channelFilter, fundFilter]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('q', search.trim());
        if (statusFilter) params.set('status', statusFilter);
        if (channelFilter) params.set('channel', channelFilter);
        if (fundFilter) params.set('fund', fundFilter);

        const res = await fetch(`/api/admin/gifts?${params.toString()}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.message || 'Failed to fetch gifts');
        }
        setGifts(data.data.gifts);
        setStats(data.data.stats);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error loading gifts');
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
  }, [search, statusFilter, channelFilter, fundFilter]);

  const handleStatusUpdate = async () => {
    if (!actionGift || !actionType) return;
    setActionSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/gifts/${actionGift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to update gift status');
      }
      setActionGift(null);
      setActionType(null);
      await fetchGifts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-magenta-900">Gifts & Funds Ledger</h1>
          <p className="text-sm text-ink-600">
            Real-time gift ledger, Paystack receipts, and bank transfer verifications.
          </p>
        </div>
        <a
          href="/api/admin/gifts/export"
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 text-sm font-semibold transition-colors shadow-xs"
        >
          <span>📥</span>
          <span>Export CSV</span>
        </a>
      </div>

      {/* Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-gold-200 bg-white shadow-xs">
            <span className="text-xs uppercase font-medium text-ink-500 tracking-wider">
              Total Verified Gifts
            </span>
            <p className="text-2xl font-serif font-bold text-magenta-900 mt-1">
              {formatNGN(stats.totalSuccessMinor)}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">
              {stats.statusCounts.SUCCESS || 0} confirmed donations
            </p>
          </div>

          <div className="p-4 rounded-xl border border-ink-200 bg-white shadow-xs">
            <span className="text-xs uppercase font-medium text-ink-500 tracking-wider">
              Pending Transfers
            </span>
            <p className="text-2xl font-serif font-bold text-gold-700 mt-1">
              {stats.statusCounts.PENDING || 0}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">Awaiting couple confirmation</p>
          </div>

          <div className="p-4 rounded-xl border border-ink-200 bg-white shadow-xs col-span-2">
            <span className="text-xs uppercase font-medium text-ink-500 tracking-wider mb-2 block">
              Active Fund Breakdown
            </span>
            <div className="flex flex-wrap gap-2">
              {stats.fundBreakdown.map((f) => (
                <div
                  key={f.id}
                  className="px-2.5 py-1 rounded-md bg-ivory-100 border border-ink-200 text-xs text-ink-800 flex items-center gap-2"
                >
                  <span className="font-semibold">{f.title}:</span>
                  <span className="font-mono text-gold-800">{formatNGN(f.verifiedMinor)}</span>
                  <span className="text-ink-400 text-[10px]">({f.giftCount})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-xl border border-ink-200 bg-white shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="search-input" className="block text-xs font-medium text-ink-600 mb-1">
              Search Donor or Ref
            </label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, name..."
              className="w-full rounded-md border border-ink-300 px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div>
            <label htmlFor="status-select" className="block text-xs font-medium text-ink-600 mb-1">
              Status
            </label>
            <select
              id="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-ink-300 px-3 py-1.5 text-sm text-ink-900 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS (Verified)</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="ABANDONED">ABANDONED</option>
            </select>
          </div>

          <div>
            <label htmlFor="channel-select" className="block text-xs font-medium text-ink-600 mb-1">
              Payment Channel
            </label>
            <select
              id="channel-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full rounded-md border border-ink-300 px-3 py-1.5 text-sm text-ink-900 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="">All Channels</option>
              <option value="PAYSTACK">Paystack (Online)</option>
              <option value="BANK_TRANSFER_DECLARED">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label htmlFor="fund-select" className="block text-xs font-medium text-ink-600 mb-1">
              Fund
            </label>
            <select
              id="fund-select"
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="w-full rounded-md border border-ink-300 px-3 py-1.5 text-sm text-ink-900 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="">All Funds</option>
              {stats?.fundBreakdown.map((f) => (
                <option key={f.id} value={f.slug}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gifts Table / List */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Loading ledger records...</div>
      ) : gifts.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-ink-300 bg-white text-ink-500">
          No transactions match your current filters.
        </div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-100 border-b border-ink-200 text-xs font-semibold text-ink-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Donor & Message</th>
                  <th className="py-3 px-4">Fund</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {gifts.map((g) => {
                  const dateStr = new Date(g.paidAt || g.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={g.id} className="hover:bg-ivory-50/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-ink-600">
                        {dateStr}
                        <div
                          className="font-mono text-[11px] text-ink-400 mt-0.5 truncate max-w-[120px]"
                          title={g.reference}
                        >
                          {g.reference}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-ink-900 flex items-center gap-1.5">
                          <span>{g.giverName}</span>
                          {g.isAnonymous && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-gold-50 text-gold-800 border border-gold-200 font-semibold"
                              title="Anonymous on public pages"
                            >
                              Anon
                            </span>
                          )}
                        </div>
                        {g.giverEmail && <div className="text-xs text-ink-500">{g.giverEmail}</div>}
                        {g.message && (
                          <p
                            className="text-xs text-ink-600 italic mt-1 max-w-xs line-clamp-2"
                            title={g.message}
                          >
                            &ldquo;{g.message}&rdquo;
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-ink-700">
                        {g.fund?.title || 'General'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-sm text-ink-900">
                        {formatNGN(g.amountMinor)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            g.channel === 'PAYSTACK'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {g.channel === 'PAYSTACK' ? 'Paystack' : 'Bank Transfer'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            g.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : g.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : g.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-ink-100 text-ink-600'
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right text-xs">
                        {g.channel === 'BANK_TRANSFER_DECLARED' && g.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActionGift(g);
                                setActionType('SUCCESS');
                                setActionError(null);
                              }}
                              className="px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 font-semibold cursor-pointer transition-colors"
                            >
                              Confirm Received
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionGift(g);
                                setActionType('ABANDONED');
                                setActionError(null);
                              }}
                              className="px-2 py-1 rounded text-ink-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                            >
                              Abandon
                            </button>
                          </div>
                        ) : g.channel === 'PAYSTACK' ? (
                          <span className="text-[11px] text-ink-400 italic">Paystack Managed</span>
                        ) : (
                          <span className="text-[11px] text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionGift && actionType && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 border border-ink-200">
            <h3 id="confirm-modal-title" className="font-serif text-xl font-bold text-ink-900">
              {actionType === 'SUCCESS' ? 'Confirm Bank Transfer Gift' : 'Abandon Bank Transfer'}
            </h3>

            <p className="text-sm text-ink-600 leading-relaxed">
              {actionType === 'SUCCESS' ? (
                <>
                  Are you sure you have received{' '}
                  <strong className="text-ink-900">{formatNGN(actionGift.amountMinor)}</strong> from{' '}
                  <strong className="text-ink-900">{actionGift.giverName}</strong> in your bank
                  account? This action marks the gift as confirmed in official records.
                </>
              ) : (
                <>
                  Are you sure you want to mark this declared transfer from{' '}
                  <strong className="text-ink-900">{actionGift.giverName}</strong> as abandoned?
                </>
              )}
            </p>

            <div className="p-3 rounded-lg bg-ivory-100 text-xs text-ink-700 font-mono space-y-1">
              <div>Reference: {actionGift.reference}</div>
              <div>Fund: {actionGift.fund?.title || 'General'}</div>
            </div>

            {actionError && (
              <div
                role="alert"
                className="p-3 rounded-md bg-red-50 text-red-800 text-xs border border-red-200"
              >
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => {
                  setActionGift(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-lg border border-ink-300 text-ink-700 text-sm font-semibold hover:bg-ink-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleStatusUpdate}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer shadow-xs disabled:opacity-50 ${
                  actionType === 'SUCCESS'
                    ? 'bg-green-700 hover:bg-green-800'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {actionSubmitting
                  ? 'Updating...'
                  : actionType === 'SUCCESS'
                    ? 'Yes, Confirm Received'
                    : 'Yes, Abandon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
