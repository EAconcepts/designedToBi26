import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getGiftsRoute } from '@/app/api/admin/gifts/route';
import { PATCH as patchGiftRoute } from '@/app/api/admin/gifts/[id]/route';
import { GET as exportGiftsRoute } from '@/app/api/admin/gifts/export/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';
import { GiftChannel, GiftStatus } from '@prisma/client';

describe('Admin Gifts API Integration', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { entity: 'Gift' } });
    await prisma.gift.deleteMany();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({ where: { entity: 'Gift' } });
    await prisma.gift.deleteMany();
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401 UNAUTHENTICATED', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/gifts');
    const res = await getGiftsRoute(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('lists gifts with status counts, fund breakdown, and aggregate statistics', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const fund = await prisma.fund.findFirst({ where: { isActive: true } });
    expect(fund).toBeDefined();

    // Create a Paystack SUCCESS gift
    await prisma.gift.create({
      data: {
        reference: 'gift_test_paystack_success',
        amountMinor: 5000000,
        currency: 'NGN',
        giverName: 'Online Donor',
        giverEmail: 'online@example.com',
        channel: GiftChannel.PAYSTACK,
        status: GiftStatus.SUCCESS,
        fundId: fund?.id,
        paidAt: new Date(),
      },
    });

    // Create a Bank transfer PENDING gift
    await prisma.gift.create({
      data: {
        reference: 'gift_test_bank_pending',
        amountMinor: 2500000,
        currency: 'NGN',
        giverName: 'Bank Donor',
        channel: GiftChannel.BANK_TRANSFER_DECLARED,
        status: GiftStatus.PENDING,
        fundId: fund?.id,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/gifts');
    const res = await getGiftsRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.gifts).toHaveLength(2);
    expect(body.data.stats.totalSuccessMinor).toBe(5000000);
    expect(body.data.stats.statusCounts.SUCCESS).toBe(1);
    expect(body.data.stats.statusCounts.PENDING).toBe(1);

    // Test filter by channel
    const reqChannel = new NextRequest(
      'http://localhost:3000/api/admin/gifts?channel=BANK_TRANSFER_DECLARED',
    );
    const resChannel = await getGiftsRoute(reqChannel);
    const bodyChannel = await resChannel.json();
    expect(bodyChannel.ok).toBe(true);
    expect(bodyChannel.data.gifts).toHaveLength(1);
    expect(bodyChannel.data.gifts[0].giverName).toBe('Bank Donor');
  });

  it('forbids manual mutation of PAYSTACK transactions with 403 FORBIDDEN_TRANSITION (§F13)', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const paystackGift = await prisma.gift.create({
      data: {
        reference: 'gift_test_paystack_guard',
        amountMinor: 1000000,
        giverName: 'Paystack Giver',
        giverEmail: 'donor@example.com',
        channel: GiftChannel.PAYSTACK,
        status: GiftStatus.PENDING,
      },
    });

    const patchReq = new NextRequest(`http://localhost:3000/api/admin/gifts/${paystackGift.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUCCESS' }),
    });

    const patchRes = await patchGiftRoute(patchReq, {
      params: Promise.resolve({ id: paystackGift.id }),
    });

    expect(patchRes.status).toBe(403);
    const body = await patchRes.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('Paystack transactions cannot be altered');
  });

  it('allows marking a declared bank transfer as SUCCESS and creates an AuditLog row', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const bankGift = await prisma.gift.create({
      data: {
        reference: 'gift_test_bank_verify',
        amountMinor: 3000000,
        giverName: 'Uncle Johnson',
        channel: GiftChannel.BANK_TRANSFER_DECLARED,
        status: GiftStatus.PENDING,
      },
    });

    const patchReq = new NextRequest(`http://localhost:3000/api/admin/gifts/${bankGift.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUCCESS' }),
    });

    const patchRes = await patchGiftRoute(patchReq, {
      params: Promise.resolve({ id: bankGift.id }),
    });

    expect(patchRes.status).toBe(200);
    const body = await patchRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('SUCCESS');
    expect(body.data.paidAt).not.toBeNull();

    // Verify AuditLog row was written
    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: 'Gift', entityId: bankGift.id },
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe('GIFT_MARK_RECEIVED');
    expect(auditLogs[0]?.actor).toBe('admin@example.com');
  });

  it('exports CSV with UTF-8 BOM containing gift ledger records', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    await prisma.gift.create({
      data: {
        reference: 'gift_test_csv_export',
        amountMinor: 1500000,
        giverName: 'CSV Exporter Donor',
        giverEmail: 'csv@example.com',
        channel: GiftChannel.BANK_TRANSFER_DECLARED,
        status: GiftStatus.SUCCESS,
        isAnonymous: true,
        message: 'Congratulations on your wedding!',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/gifts/export');
    const res = await exportGiftsRoute(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Must start with UTF-8 BOM: 0xEF, 0xBB, 0xBF
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);

    const csvText = new TextDecoder('utf-8').decode(bytes);
    expect(csvText).toContain('gift_test_csv_export');
    expect(csvText).toContain('CSV Exporter Donor (Anonymous to public)');
    expect(csvText).toContain('1500000');
  });
});
