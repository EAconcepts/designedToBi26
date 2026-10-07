import { OverviewDashboard } from '@/components/admin/OverviewDashboard';

export const metadata = {
  title: 'Executive Dashboard | Admin',
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink-100 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-magenta-900">Dashboard Overview</h1>
          <p className="text-sm text-ink-600">
            Real-time headcounts, RSVP response tracking, gift totals, and recent audit activity.
          </p>
        </div>
      </div>

      <OverviewDashboard />
    </div>
  );
}
