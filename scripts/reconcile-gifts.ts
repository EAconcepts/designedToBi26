import { prisma } from '../lib/db';
import { verifyTransaction } from '../lib/paystack';
import { mapPaystackStatus, redactPaystackEvent } from '../lib/payments';

async function reconcileGifts() {
  console.log('🔍 Starting gift transaction reconciliation...');

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const staleGifts = await prisma.gift.findMany({
    where: {
      channel: 'PAYSTACK',
      status: 'PENDING',
      createdAt: {
        lte: thirtyMinutesAgo,
      },
    },
  });

  if (staleGifts.length === 0) {
    console.log('✓ No stale pending transactions found.');
    return;
  }

  console.log(`Found ${staleGifts.length} stale pending gift(s). Checking with Paystack...`);

  const results: Array<{
    reference: string;
    before: string;
    after: string;
  }> = [];

  for (const gift of staleGifts) {
    try {
      const remote = await verifyTransaction(gift.reference);

      if (remote.status.toLowerCase() === 'pending') {
        results.push({
          reference: gift.reference,
          before: 'PENDING',
          after: 'PENDING (skipped)',
        });
        continue;
      }

      const newStatus = mapPaystackStatus(remote.status);

      await prisma.gift.update({
        where: { id: gift.id },
        data: {
          status: newStatus,
          providerRef: String(remote.id),
          paidAt: newStatus === 'SUCCESS' ? new Date() : null,
          rawEvent: redactPaystackEvent({ stage: 'reconcile', remote }),
        },
      });

      results.push({
        reference: gift.reference,
        before: 'PENDING',
        after: newStatus,
      });
    } catch (err) {
      console.error(`Failed to reconcile reference ${gift.reference}:`, err);
      results.push({
        reference: gift.reference,
        before: 'PENDING',
        after: 'ERROR',
      });
    }
  }

  console.table(results);
  console.log('✓ Reconciliation complete.');
}

reconcileGifts()
  .catch((e) => {
    console.error('Reconciliation error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
