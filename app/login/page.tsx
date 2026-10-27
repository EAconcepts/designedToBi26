import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/content/site.config';
import { AdminSignInForm } from '@/components/auth/AdminSignInForm';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <section className="max-w-md w-full text-center p-8 sm:p-10 rounded-3xl bg-white border border-gold-500/30 shadow-sm space-y-6">
        <Image
          src={SITE.brand.logo.src}
          alt="Couple Logo"
          width={120}
          height={120}
          className="mx-auto"
        />

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gold-700 font-semibold">
            Wedding Administration
          </p>
          <h1 className="text-3xl font-serif font-bold text-magenta-950 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            Sign in to manage the celebration for {SITE.couple.a} &amp; {SITE.couple.b}.
          </p>
        </header>

        <AdminSignInForm />

        <div className="pt-2 border-t border-ink-100">
          <Link
            href="/"
            className="text-xs text-gold-700 hover:text-gold-900 font-semibold underline underline-offset-4"
          >
            Return to the celebration homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
