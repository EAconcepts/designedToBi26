import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { ok, fail, handle, ERROR_STATUS_MAP, type ErrorCode } from '@/lib/api';

describe('lib/api', () => {
  it('ok() returns a 200 JSON response with ok: true and data', async () => {
    const res = ok({ user: 'test' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { user: 'test' } });
  });

  it('fail() maps every documented ErrorCode to the expected HTTP status', async () => {
    const errorCodes: ErrorCode[] = [
      'VALIDATION',
      'GUEST_REQUIRED',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'RSVP_CLOSED',
      'PARTY_SIZE_EXCEEDED',
      'NOT_INVITED',
      'UPLOADS_CLOSED',
      'INVALID_TOKEN',
      'ASSET_NOT_FOUND',
      'PAYSTACK_UNAVAILABLE',
      'RATE_LIMITED',
      'INTERNAL',
    ];

    for (const code of errorCodes) {
      const expectedStatus = ERROR_STATUS_MAP[code];
      const res = fail(code, `Error for ${code}`);
      expect(res.status).toBe(expectedStatus);

      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe(code);
      expect(body.error.message).toBe(`Error for ${code}`);
    }
  });

  it('fail() includes fields record when provided', async () => {
    const res = fail('VALIDATION', 'Invalid payload', {
      fields: { email: ['Invalid email address'] },
    });
    const body = await res.json();
    expect(body.error.fields).toEqual({
      email: ['Invalid email address'],
    });
  });

  it('handle() maps ZodError into VALIDATION failure with field details', async () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
    });

    const res = await handle(req, async () => {
      schema.parse({ name: 'ab' });
      return ok({ success: true });
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields?.name).toBeDefined();
  });

  it('handle() catches unhandled exceptions and returns 500 INTERNAL without leaking details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const req = new Request('http://localhost:3000/api/test', {
      method: 'GET',
    });

    const res = await handle(req, async () => {
      throw new Error('Sensitive database connection failure');
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INTERNAL');
    expect(body.error.message).not.toContain('Sensitive database');
    consoleError.mockRestore();
  });
});
