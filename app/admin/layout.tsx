import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { signOut } from '@/lib/auth';
import { SITE } from '@/content/site.config';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect('/api/auth/signin');
  }

  const navItems = [
    { label: 'Overview', href: '/admin' },
    { label: 'Guests', href: '/admin/guests' },
    { label: 'RSVPs', href: '/admin/rsvps' },
    { label: 'Gifts', href: '/admin/gifts' },
    { label: 'Media', href: '/admin/media' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-ivory text-ink-900 flex flex-col">
      <header className="border-b border-gold-500/20 bg-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="font-serif font-bold text-xl text-magenta-900 tracking-tight"
          >
            {SITE.couple.initials}{' '}
            <span className="font-sans text-xs uppercase tracking-wider text-gold-600 font-semibold ml-1">
              Admin
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md text-ink-700 hover:text-magenta-900 hover:bg-ivory transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-600 hidden sm:inline">
            Signed in as <strong className="text-ink-900 font-medium">{admin.email}</strong>
          </span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/api/auth/signin' });
            }}
          >
            <button
              type="submit"
              className="text-xs font-medium text-ink-700 hover:text-magenta-800 border border-ink-200 hover:border-magenta-300 px-3 py-1.5 rounded-md transition-colors bg-white hover:bg-magenta-50/50 cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Mobile nav strip */}
      <div className="md:hidden border-b border-ink-200 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2.5 py-1 rounded bg-ivory text-ink-700 whitespace-nowrap hover:text-magenta-900"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
