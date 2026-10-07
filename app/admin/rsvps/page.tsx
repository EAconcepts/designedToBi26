import { RsvpsManager } from '@/components/admin/RsvpsManager';

export const metadata = {
  title: 'RSVP Responses | Admin',
};

export default function AdminRsvpsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-magenta-900">RSVP Responses</h1>
          <p className="text-sm text-ink-600">
            Monitor attendee headcounts, filter responses, and enter manual phone/WhatsApp RSVPs.
          </p>
        </div>
      </div>

      <RsvpsManager />
    </div>
  );
}
