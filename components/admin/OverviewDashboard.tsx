'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EventSummary {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  venueName: string;
  invitedCount: number;
  attendingCount: number;
}

interface HouseholdSummary {
  total: number;
  attending: number;
  declined: number;
  pending: number;
  nonResponders: number;
}

interface MealSummary {
  meal: string;
  count: number;
}

interface FundSummary {
  id: string;
  slug: string;
  title: string;
  goalMinor: number | null;
  totalMinor: number;
  count: number;
}

interface GiftsSummary {
  totalReceivedMinor: number;
  totalCount: number;
  pendingTransfersCount: number;
  byFund: FundSummary[];
}

interface MediaSummary {
  pendingCount: number;
  approvedCount: number;
  totalCount: number;
}

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
}

interface OverviewData {
  events: EventSummary[];
  households: HouseholdSummary;
  meals: MealSummary[];
  gifts: GiftsSummary;
  media: MediaSummary;
  recentActivity: AuditLogEntry[];
}

function formatNaira(minor: number): string {
  return `₦${(minor / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getActionBadgeStyle(action: string): string {
  if (action.includes('APPROVE') || action.includes('SUCCESS') || action.includes('CREATE')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (action.includes('REJECT') || action.includes('DELETE')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (action.includes('UPDATE') || action.includes('SETTINGS') || action.includes('TOKEN')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  return 'bg-neutral-100 text-neutral-800 border-neutral-200';
}

export function OverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/admin/overview');
        const json = await res.json();
        if (ignore) return;
        if (!res.ok || !json.ok) {
          throw new Error(json.error?.message || 'Failed to fetch overview metrics');
        }
        setData(json.data);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void fetchOverview();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">
        Loading wedding dashboard metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-sm text-red-700 border border-red-200">
        <p className="font-semibold">Unable to load dashboard metrics</p>
        <p className="mt-1">{error ?? 'Please check your connection or refresh the page.'}</p>
      </div>
    );
  }

  const { events, households, gifts, media, recentActivity } = data;
  const totalAttendingGuests = events.reduce((acc, ev) => acc + ev.attendingCount, 0);
  const respondedHouseholds = households.attending + households.declined;
  const responseRate =
    households.total > 0 ? Math.round((respondedHouseholds / households.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Action Required Banners */}
      {(media.pendingCount > 0 || gifts.pendingTransfersCount > 0) && (
        <div className="space-y-3">
          {media.pendingCount > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-2">
                <span className="text-xl">📸</span>
                <span className="text-sm font-medium">
                  <strong>{media.pendingCount}</strong> guest photo
                  {media.pendingCount === 1 ? '' : 's'} awaiting moderation.
                </span>
              </div>
              <Link
                href="/admin/media"
                className="rounded-md bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 text-xs font-semibold shadow-sm min-h-[36px] flex items-center"
              >
                Review Media Queue →
              </Link>
            </div>
          )}

          {gifts.pendingTransfersCount > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-purple-50 p-4 border border-purple-200 text-purple-900">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏦</span>
                <span className="text-sm font-medium">
                  <strong>{gifts.pendingTransfersCount}</strong> declared bank transfer
                  {gifts.pendingTransfersCount === 1 ? '' : 's'} awaiting verification.
                </span>
              </div>
              <Link
                href="/admin/gifts"
                className="rounded-md bg-purple-700 hover:bg-purple-800 text-white px-4 py-1.5 text-xs font-semibold shadow-sm min-h-[36px] flex items-center"
              >
                Verify Transfers →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attending Guests */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            Confirmed Attendees
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-magenta-900">
              {totalAttendingGuests}
            </span>
            <span className="text-xs text-ink-500">across events</span>
          </div>
          <div className="text-xs text-ink-600 pt-2 flex flex-wrap gap-1">
            {events.map((ev) => (
              <span
                key={ev.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-neutral-100 text-ink-700"
              >
                {ev.title.split(' ')[0]}: {ev.attendingCount}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Households RSVP */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            RSVP Response Rate
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-ink-900">{responseRate}%</span>
            <span className="text-xs text-ink-500">
              {respondedHouseholds} of {households.total}
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 mt-2 overflow-hidden flex">
            <div
              className="bg-green-600 h-2 transition-all"
              style={{
                width: `${households.total > 0 ? (households.attending / households.total) * 100 : 0}%`,
              }}
              title={`Attending: ${households.attending}`}
            />
            <div
              className="bg-red-500 h-2 transition-all"
              style={{
                width: `${households.total > 0 ? (households.declined / households.total) * 100 : 0}%`,
              }}
              title={`Declined: ${households.declined}`}
            />
            <div
              className="bg-amber-400 h-2 transition-all"
              style={{
                width: `${households.total > 0 ? (households.pending / households.total) * 100 : 0}%`,
              }}
              title={`Pending: ${households.pending}`}
            />
          </div>
        </div>

        {/* Card 3: Total Gifts */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            Cash Gifts Received
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-gold-700">
              {formatNaira(gifts.totalReceivedMinor)}
            </span>
            <span className="text-xs text-ink-500">{gifts.totalCount} gifts</span>
          </div>
          <p className="text-xs text-ink-600 pt-2">
            <Link href="/admin/gifts" className="text-magenta-800 font-medium hover:underline">
              View gift ledger & details →
            </Link>
          </p>
        </div>

        {/* Card 4: Media Uploads */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            Approved Photos
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-ink-900">
              {media.approvedCount}
            </span>
            <span className="text-xs text-ink-500">{media.totalCount} total</span>
          </div>
          <p className="text-xs text-ink-600 pt-2">
            <Link href="/admin/media" className="text-magenta-800 font-medium hover:underline">
              Manage photo moderation →
            </Link>
          </p>
        </div>
      </div>

      {/* Events Headcount Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-magenta-950">Headcount by Event</h2>
          <Link
            href="/admin/rsvps"
            className="text-xs font-semibold text-magenta-800 hover:underline"
          >
            View All RSVPs →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const attendancePct =
              ev.invitedCount > 0 ? Math.round((ev.attendingCount / ev.invitedCount) * 100) : 0;

            return (
              <div
                key={ev.id}
                className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink-900">{ev.title}</h3>
                    <p className="text-xs text-ink-500">{ev.venueName}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-magenta-50 text-magenta-800">
                    {attendancePct}% Confirmed
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-ink-100 pt-3">
                  <div>
                    <span className="text-2xl font-serif font-bold text-ink-900">
                      {ev.attendingCount}
                    </span>
                    <span className="text-xs text-ink-500 ml-1.5">attending</span>
                  </div>
                  <div className="text-xs text-ink-500">{ev.invitedCount} invited guests</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Household Status Breakdown & Gifts by Fund Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Household Status */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <h2 className="text-base font-serif font-bold text-ink-900">Household RSVP Status</h2>
            <Link
              href="/admin/guests"
              className="text-xs font-semibold text-magenta-800 hover:underline"
            >
              Guest Directory →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-green-50 p-3 border border-green-200">
              <span className="block text-2xl font-bold text-green-800 font-serif">
                {households.attending}
              </span>
              <span className="text-xs font-medium text-green-700">Attending</span>
            </div>

            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <span className="block text-2xl font-bold text-red-800 font-serif">
                {households.declined}
              </span>
              <span className="text-xs font-medium text-red-700">Declined</span>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
              <span className="block text-2xl font-bold text-amber-800 font-serif">
                {households.pending}
              </span>
              <span className="text-xs font-medium text-amber-700">Pending</span>
            </div>
          </div>

          <p className="text-xs text-ink-500 text-center">
            Total {households.total} registered households on the invitation list.
          </p>
        </div>

        {/* Gifts by Fund */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <h2 className="text-base font-serif font-bold text-ink-900">Gifts by Registry Fund</h2>
            <Link
              href="/admin/gifts"
              className="text-xs font-semibold text-magenta-800 hover:underline"
            >
              All Gifts →
            </Link>
          </div>

          <div className="space-y-3">
            {gifts.byFund.map((fund) => {
              const progressPct = fund.goalMinor
                ? Math.min(100, Math.round((fund.totalMinor / fund.goalMinor) * 100))
                : null;

              return (
                <div
                  key={fund.id}
                  className="rounded-lg bg-neutral-50 p-3 border border-ink-100 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-900">{fund.title}</span>
                    <span className="font-serif font-bold text-gold-800">
                      {formatNaira(fund.totalMinor)}
                    </span>
                  </div>

                  {progressPct !== null && (
                    <div className="space-y-1">
                      <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gold-600 h-1.5 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-ink-500">
                        <span>{progressPct}% of goal</span>
                        <span>Goal: {formatNaira(fund.goalMinor || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-magenta-950">
              Recent System Activity
            </h2>
            <p className="text-xs text-ink-500">
              Audit log records for recent administrative and automated changes.
            </p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500">No activity logged yet.</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {recentActivity.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium border ${getActionBadgeStyle(
                      log.action,
                    )}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-ink-700 text-xs">
                    {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="truncate max-w-[180px]">{log.actor}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
