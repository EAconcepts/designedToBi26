'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type GiftStatus =
  'reading' | 'POLLING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'STILL_PROCESSING' | 'UNKNOWN';

export function GiftComplete() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';

  const [status, setStatus] = useState<GiftStatus>(() =>
    !reference.trim() ? 'UNKNOWN' : 'reading',
  );

  const pollCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!reference.trim()) {
      return;
    }

    let isMounted = true;
    pollCountRef.current = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/gifts/verify?ref=${encodeURIComponent(reference)}`, {
          cache: 'no-store',
        });

        if (res.status === 404) {
          if (isMounted) setStatus('UNKNOWN');
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.message || 'Verification check failed');
        }

        const remoteStatus: string = data.data?.status;

        if (remoteStatus === 'SUCCESS') {
          if (isMounted) setStatus('SUCCESS');
          return;
        }

        if (remoteStatus === 'FAILED') {
          if (isMounted) setStatus('FAILED');
          return;
        }

        if (remoteStatus === 'ABANDONED') {
          if (isMounted) setStatus('ABANDONED');
          return;
        }

        // Still PENDING
        pollCountRef.current += 1;

        // Stop polling after ~30s (about 5-6 attempts with backoff)
        if (pollCountRef.current >= 6) {
          if (isMounted) setStatus('STILL_PROCESSING');
          return;
        }

        if (isMounted) {
          setStatus('POLLING');
          // Exponential backoff: 2s, 4s, 8s, 8s, 8s...
          const delays = [2000, 4000, 8000, 8000, 8000, 8000];
          const delay = delays[pollCountRef.current] || 8000;
          timerRef.current = setTimeout(checkStatus, delay);
        }
      } catch (err) {
        console.warn('[VERIFY STATUS FETCH ERROR]:', err);
        pollCountRef.current += 1;
        if (pollCountRef.current >= 5) {
          if (isMounted) setStatus('STILL_PROCESSING');
        } else if (isMounted) {
          timerRef.current = setTimeout(checkStatus, 4000);
        }
      }
    };

    void checkStatus();

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reference]);

  return (
    <div className="py-12 px-4 max-w-xl mx-auto" aria-live="polite">
      {/* 1. Missing / Unknown Reference */}
      {status === 'UNKNOWN' && (
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-ivory-200 text-ink-500 flex items-center justify-center text-2xl">
            🔍
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Payment Reference Not Found
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            We couldn&apos;t verify a transaction matching this link. If your account was debited,
            please keep your bank receipt and contact us.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/gift"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-magenta-900 text-white font-serif font-bold text-sm"
            >
              Back to Gift Page
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-ink-300 text-ink-700 text-sm font-medium hover:bg-ivory"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}

      {/* 2. Reading / Polling */}
      {(status === 'reading' || status === 'POLLING') && (
        <div className="rounded-2xl border border-gold-500/30 bg-white p-10 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-gold-300 border-t-magenta-900 animate-spin" />
          <h1 className="font-serif text-2xl font-bold text-magenta-950">
            Confirming Your Payment
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed max-w-sm mx-auto">
            Please hold on a moment while we verify your transaction with Paystack.
          </p>
          <p className="font-mono text-xs text-ink-400">Reference: {reference}</p>
        </div>
      )}

      {/* 3. Terminal SUCCESS */}
      {status === 'SUCCESS' && (
        <div className="rounded-2xl border border-green-200 bg-white p-8 sm:p-10 text-center shadow-md space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl font-bold shadow-inner">
            ✓
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-gold-600 font-bold font-sans">
              Gift Received
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-magenta-950 mt-1">
              Thank You, <em className="italic font-normal text-gold-700">Truly</em>
            </h1>
            <p className="text-sm text-ink-600 leading-relaxed mt-2 max-w-md mx-auto">
              Your generosity brings warmth to our hearts as we prepare for married life. A receipt
              has been sent to your email.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-ivory-100/70 border border-gold-200/60 max-w-sm mx-auto text-xs text-ink-700 space-y-1">
            <p className="text-ink-500 uppercase tracking-wider text-[10px]">Reference</p>
            <p className="font-mono font-bold text-ink-900 break-all">{reference}</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-magenta-900 hover:bg-magenta-950 text-white font-serif font-bold text-sm transition-colors shadow-sm"
            >
              Return to Invitation
            </Link>
          </div>
        </div>
      )}

      {/* 4. Terminal FAILED */}
      {status === 'FAILED' && (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">
            ✕
          </div>
          <h1 className="font-serif text-2xl font-bold text-red-950">Payment Not Completed</h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            The transaction could not be completed by your bank. If any funds were deducted, they
            are typically reversed automatically by your provider within 24 hours.
          </p>
          <div className="p-4 rounded-lg bg-ivory-100 text-xs text-ink-700 text-left space-y-1">
            <p className="font-semibold text-magenta-900">Alternative Option:</p>
            <p>You can make a direct bank transfer on our gift page without any card fees.</p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/gift?tab=bank"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-magenta-900 text-white font-serif font-bold text-sm"
            >
              View Bank Transfer Details
            </Link>
            <Link
              href="/gift"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-ink-300 text-ink-700 text-sm font-medium hover:bg-ivory"
            >
              Try Again
            </Link>
          </div>
        </div>
      )}

      {/* 5. Terminal ABANDONED */}
      {status === 'ABANDONED' && (
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-ivory-200 text-ink-500 flex items-center justify-center text-2xl">
            ↩
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">Payment Cancelled</h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            The payment window was closed before completion. No funds were debited.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/gift"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-magenta-900 text-white font-serif font-bold text-sm"
            >
              Return to Gift Page
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-ink-300 text-ink-700 text-sm font-medium hover:bg-ivory"
            >
              Home
            </Link>
          </div>
        </div>
      )}

      {/* 6. STILL_PROCESSING */}
      {status === 'STILL_PROCESSING' && (
        <div className="rounded-2xl border border-gold-300 bg-white p-8 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold-100 text-gold-800 flex items-center justify-center text-2xl font-bold">
            ⏳
          </div>
          <h1 className="font-serif text-2xl font-bold text-magenta-950">
            Confirmation in Progress
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed max-w-sm mx-auto">
            Your transaction confirmation is taking a few moments longer than usual. Please do not
            worry — we are verifying it, and an email receipt will be sent as soon as it clears.
          </p>
          <p className="font-mono text-xs text-ink-500">Reference: {reference}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-lg bg-magenta-900 text-white font-serif font-bold text-sm"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
