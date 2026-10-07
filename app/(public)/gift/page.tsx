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
    <div className="route-page">
      {/* Editorial Header */}
      <header className="inner-hero">
        <div className="inner-hero__ornament">{SITE.couple.initials}</div>
        <p className="section-kicker section-kicker--gold">Your presence is our greatest gift</p>
        <h1>
          A gift, <em>with love</em>
        </h1>
        <p className="inner-hero__body">
          For those who have asked, we’ve created a few ways to contribute to our next chapter.
        </p>
        <span className="inner-hero__line" />
      </header>

      {/* Main Gifting Interface */}
      <Suspense
        fallback={
          <div className="paper-section" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p className="section-kicker">Loading gifting options...</p>
          </div>
        }
      >
        <GiftTabs funds={funds} bankAccounts={bankAccounts} />
      </Suspense>
    </div>
  );
}
