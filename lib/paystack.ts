import crypto from 'crypto';
import { env } from '@/lib/env';

const BASE = 'https://api.paystack.co';

const headers = () => ({
  Authorization: `Bearer ${env.server.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export async function initializeTransaction(i: {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email: i.email,
      amount: i.amountMinor,
      currency: 'NGN',
      reference: i.reference,
      callback_url: i.callbackUrl,
      metadata: i.metadata,
    }),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? 'Paystack initialize failed');
  }

  return json.data;
}

export async function verifyTransaction(
  reference: string,
): Promise<{ status: string; amount: number; currency: string; id: number }> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
    cache: 'no-store',
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { status: string; amount: number; currency: string; id: number };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? 'Paystack verify failed');
  }

  return json.data;
}

/**
 * Length-guarded HMAC-SHA512 verification:
 * A short or malformed header returns false instead of throwing.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || typeof signature !== 'string') return false;

  // Paystack signatures are 128-hex-character sha512 digests (64 bytes)
  if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
    return false;
  }

  const expected = crypto
    .createHmac('sha512', env.server.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest();

  const received = Buffer.from(signature, 'hex');

  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
}
