import { GuestsManager } from '@/components/admin/GuestsManager';

export const metadata = {
  title: 'Guest Directory | Admin',
};

export default function AdminGuestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-magenta-900">Guest Directory</h1>
          <p className="text-sm text-ink-600">
            Keep track of households, contact details and party sizes, and manage responses taken
            over the phone.
          </p>
        </div>
      </div>

      <GuestsManager />
    </div>
  );
}
