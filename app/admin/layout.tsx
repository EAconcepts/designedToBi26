import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { signOut } from '@/lib/auth';
import { SITE } from '@/content/site.config';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import Image from 'next/image';

// Preserve the intended destination so the magic-link flow returns to the
// dashboard instead of bouncing to the public home page (Auth.js defaults to "/").
const ADMIN_SIGNIN_URL = '/login?callbackUrl=%2Fadmin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect(ADMIN_SIGNIN_URL);
  }

  const navItems = [
    { label: 'Overview', href: '/admin' },
    { label: 'Guests & RSVPs', href: '/admin/rsvps' },
    { label: 'Gifts', href: '/admin/gifts' },
    { label: 'Media', href: '/admin/media' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-ivory text-ink-900 flex flex-col">
      <header className="relative border-b border-gold-500/20 bg-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="font-serif font-bold text-xl text-magenta-900 tracking-tight"
          >
            <Image src={SITE.brand.logo.src} alt="Couple Logo" width={50} height={50} />
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
          <AdminMobileNav items={navItems} />
          <span className="text-ink-600 hidden sm:inline">
            Signed in as <strong className="text-ink-900 font-medium">{admin.email}</strong>
          </span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: ADMIN_SIGNIN_URL });
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

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
