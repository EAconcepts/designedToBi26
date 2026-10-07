import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import { importGuests } from '@/scripts/seed-guests';
import { makeEvent, cleanupTestRows } from '@/tests/factories';

describe('Seed Guests Bulk Import Integration Tests', () => {
  const testPrefix = 'seed_test_';

  beforeEach(async () => {
    await cleanupTestRows(testPrefix);
    // Also clean up by exact prefix in display name
    await prisma.guest.deleteMany({
      where: { displayName: { startsWith: testPrefix } },
    });
  });

  afterEach(async () => {
    await cleanupTestRows(testPrefix);
    await prisma.guest.deleteMany({
      where: { displayName: { startsWith: testPrefix } },
    });
  });

  it('imports 20 guests idempotently (running twice results in 20 guests and updates)', async () => {
    // Ensure default events exist
    const ev1 = await makeEvent(undefined, {
      slug: `${testPrefix}solemnization`,
      title: 'Solemnization',
    });
    const ev2 = await makeEvent(undefined, { slug: `${testPrefix}reception`, title: 'Reception' });

    // Generate 20 test rows
    const rows = ['displayName,email,phone,side,maxPartySize,invitedTo'];
    for (let i = 1; i <= 20; i++) {
      rows.push(
        `"${testPrefix}Guest ${i}",guest${i}@example.com,+23480000000${i.toString().padStart(2, '0')},BOTH,${(i % 3) + 1},${ev1.slug};${ev2.slug}`,
      );
    }
    const csvContent = rows.join('\n');

    // Run 1: Should create 20 guests
    const run1 = await importGuests(csvContent, { force: true });
    expect(run1).toHaveLength(20);
    expect(run1.every((r) => r.action === 'created')).toBe(true);

    const countAfterRun1 = await prisma.guest.count({
      where: { displayName: { startsWith: testPrefix } },
    });
    expect(countAfterRun1).toBe(20);

    // Verify invitations were created
    const invitationsCount1 = await prisma.invitation.count({
      where: { guest: { displayName: { startsWith: testPrefix } } },
    });
    expect(invitationsCount1).toBe(40); // 20 guests * 2 events

    // Run 2: Re-import same 20 guests with updated email/phone
    const run2 = await importGuests(csvContent, { force: true });
    expect(run2).toHaveLength(20);
    expect(run2.every((r) => r.action === 'updated')).toBe(true);

    const countAfterRun2 = await prisma.guest.count({
      where: { displayName: { startsWith: testPrefix } },
    });
    expect(countAfterRun2).toBe(20); // No duplicate rows created!

    // Verify invitation count unchanged
    const invitationsCount2 = await prisma.invitation.count({
      where: { guest: { displayName: { startsWith: testPrefix } } },
    });
    expect(invitationsCount2).toBe(40);
  });

  it('fails with line number and rolls back all writes if any event slug is unknown', async () => {
    const ev1 = await makeEvent(undefined, {
      slug: `${testPrefix}valid_event`,
      title: 'Valid Event',
    });

    const csvContent = `displayName,email,side,invitedTo
"${testPrefix}Valid Row 1",valid1@example.com,BOTH,${ev1.slug}
"${testPrefix}Invalid Row 2",valid2@example.com,BOTH,non_existent_event_slug_12345
"${testPrefix}Valid Row 3",valid3@example.com,BOTH,${ev1.slug}`;

    await expect(importGuests(csvContent, { force: true })).rejects.toThrow(
      /Line 3: Unknown event slug "non_existent_event_slug_12345"/,
    );

    // Assert complete rollback: 0 guests created
    const count = await prisma.guest.count({
      where: { displayName: { startsWith: testPrefix } },
    });
    expect(count).toBe(0);
  });

  it('dry-run returns simulated result without touching database', async () => {
    const ev1 = await makeEvent(undefined, { slug: `${testPrefix}dry_event`, title: 'Dry Event' });

    const csvContent = `displayName,email,side,invitedTo
"${testPrefix}Dry Guest 1",dry1@example.com,BOTH,${ev1.slug}
"${testPrefix}Dry Guest 2",dry2@example.com,PARTNER_A,${ev1.slug}`;

    const result = await importGuests(csvContent, { dryRun: true, force: true });
    expect(result).toHaveLength(2);
    expect(result[0]?.code).toBe('DRY_RUN_');

    const count = await prisma.guest.count({
      where: { displayName: { startsWith: testPrefix } },
    });
    expect(count).toBe(0);
  });
});
