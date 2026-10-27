import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Guest Directory | Admin',
};

export default function AdminGuestsPage() {
  redirect('/admin/rsvps');
}
