import crypto from 'crypto';
import { GiftStatus, Prisma } from '@prisma/client';

/**
 * Generates a 128-bit cryptographically secure gift reference (§7.2).
 */
export function createGiftReference(): string {
  return `gift_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Maps Paystack status string to Prisma GiftStatus enum.
 */
export function mapPaystackStatus(status: string): GiftStatus {
  const normalized = status.toLowerCase().trim();
  switch (normalized) {
    case 'success':
      return 'SUCCESS';
    case 'failed':
      return 'FAILED';
    case 'abandoned':
      return 'ABANDONED';
    case 'reversed':
      return 'FAILED';
    case 'pending':
      return 'PENDING';
    default:
      return 'FAILED';
  }
}

/**
 * Redacts Paystack webhook event payload (§13.2).
 * Strictly retains only non-sensitive transaction fields:
 * event, reference, amount, currency, status, id, paid_at.
 * Explicitly strips customer, authorization, metadata, and all PII/card details.
 */
export function redactPaystackEvent(raw: unknown): Prisma.InputJsonValue {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const obj = raw as Record<string, unknown>;
  const data =
    typeof obj.data === 'object' && obj.data !== null ? (obj.data as Record<string, unknown>) : {};

  const redacted: Record<string, Prisma.InputJsonValue | undefined> = {};

  if (typeof obj.event === 'string') {
    redacted.event = obj.event;
  }
  if (typeof obj.mismatch === 'boolean') {
    redacted.mismatch = obj.mismatch;
  }
  if (typeof obj.stage === 'string') {
    redacted.stage = obj.stage;
  }

  redacted.data = {
    reference: typeof data.reference === 'string' ? data.reference : null,
    amount: typeof data.amount === 'number' ? data.amount : null,
    currency: typeof data.currency === 'string' ? data.currency : null,
    status: typeof data.status === 'string' ? data.status : null,
    id: typeof data.id === 'number' ? data.id : null,
    paid_at: typeof data.paid_at === 'string' ? data.paid_at : null,
  };

  return redacted as unknown as Prisma.InputJsonValue;
}
