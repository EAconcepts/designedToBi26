import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GiftComplete } from '@/components/sections/GiftComplete';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gift Received | Adetolani & Emmanuel',
  description: 'Thank you for your generous wedding gift to Adetolani & Emmanuel.',
};

export default function GiftCompletePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center py-12">
      <Suspense
        fallback={
          <div className="text-center py-12 text-sm text-ink-500">Loading gift confirmation...</div>
        }
      >
        <GiftComplete />
      </Suspense>
    </main>
  );
}
