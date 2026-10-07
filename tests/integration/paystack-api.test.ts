import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST as initializeRoute } from '@/app/api/gifts/initialize/route';
import { GET as verifyRoute } from '@/app/api/gifts/verify/route';
import { POST as declareRoute } from '@/app/api/gifts/declare/route';
import { POST as webhookRoute } from '@/app/api/webhooks/paystack/route';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import * as paystackLib from '@/lib/paystack';
import { cleanupTestRows } from '@/tests/factories';

describe('Paystack & Gifting API Integration', () => {
  let activeFund: { id: string; slug: string; title: string };

  beforeEach(async () => {
    await cleanupTestRows();
    await prisma.gift.deleteMany();
    vi.restoreAllMocks();

    // Ensure an active Fund exists
    activeFund = await prisma.fund.upsert({
      where: { slug: 'honeymoon' },
      update: { isActive: true },
      create: {
        slug: 'honeymoon',
        title: 'Honeymoon in Zanzibar',
        description: 'Help us begin married life with a relaxing getaway.',
        goalMinor: 50000000,
        isActive: true,
      },
    });
  });

  afterEach(async () => {
    await prisma.gift.deleteMany();
    await cleanupTestRows();
    vi.restoreAllMocks();
  });

  describe('POST /api/gifts/initialize', () => {
    it('creates a PENDING Gift and returns authorization URL on Paystack success', async () => {
      vi.spyOn(paystackLib, 'initializeTransaction').mockResolvedValue({
        authorization_url: 'https://checkout.paystack.com/auth123',
        access_code: 'access_123',
        reference: 'mocked_ref',
      });

      const payload = {
        fundSlug: activeFund.slug,
        amountMinor: 500000, // ₦5,000
        giverName: 'Uncle Segun',
        giverEmail: 'segun@example.com',
        message: 'Wishing you a blissful union!',
        isAnonymous: false,
      };

      const req = new NextRequest('http://localhost:3000/api/gifts/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await initializeRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.authorizationUrl).toBe('https://checkout.paystack.com/auth123');
      expect(json.data.reference).toMatch(/^gift_[0-9a-f]{32}$/);

      // Verify DB row
      const giftInDb = await prisma.gift.findUnique({
        where: { reference: json.data.reference },
      });
      expect(giftInDb).not.toBeNull();
      expect(giftInDb?.status).toBe('PENDING');
      expect(giftInDb?.channel).toBe('PAYSTACK');
      expect(giftInDb?.amountMinor).toBe(500000);
      expect(giftInDb?.giverName).toBe('Uncle Segun');
    });

    it('marks Gift as FAILED and returns 502 when Paystack initialization rejects', async () => {
      vi.spyOn(paystackLib, 'initializeTransaction').mockRejectedValue(
        new Error('Paystack gateway timeout'),
      );

      const payload = {
        fundSlug: activeFund.slug,
        amountMinor: 1000000,
        giverName: 'Aunty Funke',
        giverEmail: 'funke@example.com',
        isAnonymous: false,
      };

      const req = new NextRequest('http://localhost:3000/api/gifts/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await initializeRoute(req);
      expect(res.status).toBe(502);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('PAYSTACK_UNAVAILABLE');

      // Check DB: Gift should be marked FAILED
      const failedGift = await prisma.gift.findFirst({
        where: { giverEmail: 'funke@example.com' },
      });
      expect(failedGift).not.toBeNull();
      expect(failedGift?.status).toBe('FAILED');
    });

    it('returns 404 if the selected fund does not exist', async () => {
      const payload = {
        fundSlug: 'non-existent-fund',
        amountMinor: 500000,
        giverName: 'Test Giver',
        giverEmail: 'test@example.com',
        isAnonymous: false,
      };

      const req = new NextRequest('http://localhost:3000/api/gifts/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await initializeRoute(req);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/gifts/verify', () => {
    it('returns status only for an existing reference and returns 404 for unknown', async () => {
      const gift = await prisma.gift.create({
        data: {
          fundId: activeFund.id,
          giverName: 'Anonymous Friend',
          amountMinor: 2000000,
          currency: 'NGN',
          channel: 'PAYSTACK',
          reference: 'gift_test_verify_1234567890abcdef',
          status: 'PENDING',
        },
      });

      // Valid reference
      const req = new NextRequest(`http://localhost:3000/api/gifts/verify?ref=${gift.reference}`);
      const res = await verifyRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual({ status: 'PENDING' });
      // Assure no sensitive fields leaked
      expect(json.data.amountMinor).toBeUndefined();
      expect(json.data.giverName).toBeUndefined();

      // Unknown reference
      const reqUnknown = new NextRequest('http://localhost:3000/api/gifts/verify?ref=unknown_ref');
      const resUnknown = await verifyRoute(reqUnknown);
      expect(resUnknown.status).toBe(404);
    });
  });

  describe('POST /api/gifts/declare', () => {
    it('creates a BANK_TRANSFER_DECLARED row with PENDING status', async () => {
      const payload = {
        fundSlug: activeFund.slug,
        amountMinor: 5000000,
        giverName: 'Chief Badmus',
        giverEmail: 'badmus@example.com',
        message: 'Congratulations on your wedding!',
        isAnonymous: false,
      };

      const req = new NextRequest('http://localhost:3000/api/gifts/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await declareRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.reference).toMatch(/^gift_[0-9a-f]{32}$/);

      const declaredInDb = await prisma.gift.findUnique({
        where: { reference: json.data.reference },
      });
      expect(declaredInDb?.channel).toBe('BANK_TRANSFER_DECLARED');
      expect(declaredInDb?.status).toBe('PENDING');
      expect(declaredInDb?.giverName).toBe('Chief Badmus');
    });
  });

  describe('POST /api/webhooks/paystack', () => {
    function signPayload(bodyStr: string): string {
      return crypto
        .createHmac('sha512', env.server.PAYSTACK_SECRET_KEY)
        .update(bodyStr)
        .digest('hex');
    }

    it('rejects missing or invalid signature with 401 UNAUTHENTICATED', async () => {
      const payload = JSON.stringify({ event: 'charge.success' });
      const reqNoSig = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
        method: 'POST',
        body: payload,
      });

      const resNoSig = await webhookRoute(reqNoSig);
      expect(resNoSig.status).toBe(401);

      const reqBadSig = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': 'invalid_signature_hex_123' },
        body: payload,
      });

      const resBadSig = await webhookRoute(reqBadSig);
      expect(resBadSig.status).toBe(401);
    });

    it('successfully transitions PENDING gift to SUCCESS on valid webhook and server verification', async () => {
      const gift = await prisma.gift.create({
        data: {
          fundId: activeFund.id,
          giverName: 'Senator Alabi',
          giverEmail: 'alabi@example.com',
          amountMinor: 10000000, // ₦100,000
          currency: 'NGN',
          channel: 'PAYSTACK',
          reference: 'gift_webhook_success_ref_12345678',
          status: 'PENDING',
        },
      });

      // Mock verifyTransaction to return success
      vi.spyOn(paystackLib, 'verifyTransaction').mockResolvedValue({
        status: 'success',
        amount: 10000000,
        currency: 'NGN',
        id: 998877,
      });

      const webhookPayload = JSON.stringify({
        event: 'charge.success',
        data: {
          id: 998877,
          reference: gift.reference,
          amount: 10000000,
          currency: 'NGN',
          status: 'success',
          paid_at: new Date().toISOString(),
          customer: { email: 'donor@example.com' }, // PII that should be redacted
        },
      });

      const signature = signPayload(webhookPayload);

      const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
        method: 'POST',
        headers: {
          'x-paystack-signature': signature,
          'Content-Type': 'application/json',
        },
        body: webhookPayload,
      });

      const res = await webhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.processed).toBe(true);

      // Verify DB state
      const updatedGift = await prisma.gift.findUnique({
        where: { id: gift.id },
      });
      expect(updatedGift?.status).toBe('SUCCESS');
      expect(updatedGift?.providerRef).toBe('998877');
      expect(updatedGift?.paidAt).not.toBeNull();

      // Verify rawEvent redaction (no customer PII)
      const rawEventStr = JSON.stringify(updatedGift?.rawEvent);
      expect(rawEventStr).not.toContain('donor@example.com');
      expect(rawEventStr).not.toContain('customer');

      // Test idempotency: replay same webhook
      const replayReq = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
        method: 'POST',
        headers: {
          'x-paystack-signature': signature,
          'Content-Type': 'application/json',
        },
        body: webhookPayload,
      });
      const replayRes = await webhookRoute(replayReq);
      expect(replayRes.status).toBe(200);
      const replayJson = await replayRes.json();
      expect(replayJson.data.duplicate).toBe(true);
    });

    it('records mismatch and stays PENDING when remote amount differs', async () => {
      const gift = await prisma.gift.create({
        data: {
          fundId: activeFund.id,
          giverName: 'Mismatch Donor',
          amountMinor: 5000000,
          currency: 'NGN',
          channel: 'PAYSTACK',
          reference: 'gift_mismatch_ref_12345678901234',
          status: 'PENDING',
        },
      });

      vi.spyOn(paystackLib, 'verifyTransaction').mockResolvedValue({
        status: 'success',
        amount: 1000000, // Different amount!
        currency: 'NGN',
        id: 112233,
      });

      const webhookPayload = JSON.stringify({
        event: 'charge.success',
        data: {
          id: 112233,
          reference: gift.reference,
          amount: 5000000,
          currency: 'NGN',
        },
      });

      const req = new NextRequest('http://localhost:3000/api/webhooks/paystack', {
        method: 'POST',
        headers: {
          'x-paystack-signature': signPayload(webhookPayload),
        },
        body: webhookPayload,
      });

      const res = await webhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.mismatch).toBe(true);

      const unchangedGift = await prisma.gift.findUnique({
        where: { id: gift.id },
      });
      expect(unchangedGift?.status).toBe('PENDING');
    });
  });
});
