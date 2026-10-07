import { describe, expect, it } from 'vitest';
import { createGiftReference, mapPaystackStatus, redactPaystackEvent } from '@/lib/payments';

describe('Payments Domain Helpers', () => {
  describe('createGiftReference', () => {
    it('creates references prefixed with gift_ and 32 hex characters', () => {
      const ref = createGiftReference();
      expect(ref).toMatch(/^gift_[0-9a-f]{32}$/);
    });

    it('generates distinct references on subsequent invocations', () => {
      const ref1 = createGiftReference();
      const ref2 = createGiftReference();
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('mapPaystackStatus', () => {
    it('maps paystack statuses to GiftStatus accurately', () => {
      expect(mapPaystackStatus('success')).toBe('SUCCESS');
      expect(mapPaystackStatus('SUCCESS')).toBe('SUCCESS');
      expect(mapPaystackStatus('failed')).toBe('FAILED');
      expect(mapPaystackStatus('abandoned')).toBe('ABANDONED');
      expect(mapPaystackStatus('reversed')).toBe('FAILED');
      expect(mapPaystackStatus('pending')).toBe('PENDING');
      expect(mapPaystackStatus('unknown_status')).toBe('FAILED');
    });
  });

  describe('redactPaystackEvent', () => {
    it('retains only whitelisted non-sensitive fields and strips PII', () => {
      const rawPaystackPayload = {
        event: 'charge.success',
        data: {
          id: 305086,
          reference: 'gift_abcd1234efgh5678',
          amount: 5000000,
          currency: 'NGN',
          status: 'success',
          paid_at: '2026-12-19T14:30:00.000Z',
          // Sensitive data to strip:
          customer: {
            id: 84310,
            first_name: 'John',
            last_name: 'Doe',
            email: 'sensitive-donor@example.com',
            phone: '+2348012345678',
          },
          authorization: {
            authorization_code: 'AUTH_123456',
            bin: '408408',
            last4: '4081',
            exp_month: '12',
            exp_year: '2030',
            card_type: 'visa',
            bank: 'TEST BANK',
          },
          metadata: {
            custom_fields: [{ variable_name: 'donor', value: 'Donor Name' }],
          },
        },
      };

      const redacted = redactPaystackEvent(rawPaystackPayload) as {
        event?: string;
        data?: {
          id?: number;
          reference?: string;
          amount?: number;
          currency?: string;
          status?: string;
          paid_at?: string;
        };
      };

      // Whitelisted fields are present
      expect(redacted.event).toBe('charge.success');
      expect(redacted.data?.id).toBe(305086);
      expect(redacted.data?.reference).toBe('gift_abcd1234efgh5678');
      expect(redacted.data?.amount).toBe(5000000);
      expect(redacted.data?.currency).toBe('NGN');
      expect(redacted.data?.status).toBe('success');
      expect(redacted.data?.paid_at).toBe('2026-12-19T14:30:00.000Z');

      // PII must be completely stripped
      const serialized = JSON.stringify(redacted);
      expect(serialized).not.toContain('sensitive-donor@example.com');
      expect(serialized).not.toContain('customer');
      expect(serialized).not.toContain('authorization');
      expect(serialized).not.toContain('4081');
      expect(serialized).not.toContain('+2348012345678');
    });

    it('handles non-object and null gracefully', () => {
      expect(redactPaystackEvent(null)).toEqual({});
      expect(redactPaystackEvent(undefined)).toEqual({});
      expect(redactPaystackEvent('not an object')).toEqual({});
    });
  });
});
