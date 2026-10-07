import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SITE } from '@/content/site.config';
import { GiftTabs } from '@/components/sections/GiftTabs';

export const metadata: Metadata = {
  title: `Wedding Gift Registry | ${SITE.couple.a} & ${SITE.couple.b}`,
  description:
    'Celebrate Adetolani & Emmanuel with a gift for their honeymoon, new home, or future together.',
};

export default async function GiftPage() {
  const [funds, bankAccounts] = await Promise.all([
    prisma.fund.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        goalMinor: true,
        isActive: true,
      },
    }),
    prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        currency: true,
        label: true,
      },
    }),
  ]);

  return (
    <div className="py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
      {/* Editorial Header */}
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-12 h-12 mx-auto rounded-full bg-magenta-900 text-light-gold flex items-center justify-center font-serif font-bold text-lg shadow-sm">
          {SITE.couple.initials}
        </div>
        <p className="text-xs uppercase tracking-widest text-ink-600 font-semibold font-sans">
          Your Presence is Our Greatest Gift
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-magenta-950 tracking-tight">
          A Gift, <em className="italic font-normal text-magenta-800">With Love</em>
        </h1>
        <p className="text-sm sm:text-base text-ink-600 leading-relaxed pt-1">
          For those who have graciously asked, we have created a few meaningful ways to contribute
          to our new beginning.
        </p>
      </header>

      {/* Main Gifting Interface */}
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-ink-500">Loading gifting options...</div>
        }
      >
        <GiftTabs funds={funds} bankAccounts={bankAccounts} />
      </Suspense>
    </div>
  );
}
