import { getSettingsUncached } from '@/lib/settings';
import { RsvpContactsPanel } from '@/components/sections/RsvpContactsPanel';
import { RsvpClientPage } from './RsvpClientPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'RSVP | Adetolani & Emmanuel',
  description: 'Respond to your invitation to our wedding celebration.',
};

export default async function RsvpPage() {
  const settings = await getSettingsUncached();

  const isPastDeadline = settings.rsvpDeadline && new Date() > settings.rsvpDeadline;

  if (settings.mode === 'POST' || isPastDeadline) {
    return (
      <div className="route-page">
        <div style={{ maxWidth: '640px', margin: '40px auto' }}>
          <RsvpContactsPanel
            isClosed={true}
            title="RSVP is Closed"
            subtitle={
              settings.mode === 'POST'
                ? 'Thank you for celebrating with us! Online RSVPs are now closed as our celebration has concluded. For any urgent inquiries, please contact our coordinators below.'
                : 'The RSVP deadline has passed. Online RSVPs are now closed. For any urgent inquiries, please contact our coordinators below.'
            }
          />
        </div>
      </div>
    );
  }

  return <RsvpClientPage />;
}
