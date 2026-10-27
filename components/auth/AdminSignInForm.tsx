'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function AdminSignInForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    try {
      const response = await signIn('resend', {
        email,
        redirectTo: '/admin',
        redirect: false,
      });

      setStatus(response?.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div
        role="status"
        className="rounded-2xl border border-gold-500/30 bg-ivory-100/70 p-5 space-y-2"
      >
        <p className="font-semibold text-magenta-900">Check your inbox</p>
        <p className="text-sm text-ink-600 leading-relaxed">
          If that address is authorized, a sign-in link will arrive shortly. The link expires in 30
          minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <label htmlFor="admin-email" className="block text-sm font-medium text-ink-900">
          Admin email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={status === 'sending'}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-ivory-50/50 text-ink-900 placeholder:text-ink-400 focus:outline-hidden focus:border-gold-500 disabled:opacity-60"
        />
      </div>

      {status === 'error' && (
        <p role="alert" className="text-sm text-magenta-900">
          We couldn’t send your sign-in link. Please try again.
        </p>
      )}

      <Button type="submit" size="md" className="w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending sign-in link…' : 'Email me a sign-in link'}
      </Button>

      <p className="text-center text-xs text-ink-600 leading-relaxed">
        Sign-in links are sent only to authorized admin email addresses.
      </p>
    </form>
  );
}
