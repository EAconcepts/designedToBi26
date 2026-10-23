import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RSVP_CLOSED'
  | 'PARTY_SIZE_EXCEEDED'
  | 'NOT_INVITED'
  | 'UPLOADS_CLOSED'
  | 'INVALID_TOKEN'
  | 'ASSET_NOT_FOUND'
  | 'PAYSTACK_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RSVP_CLOSED: 409,
  PARTY_SIZE_EXCEEDED: 409,
  NOT_INVITED: 403,
  UPLOADS_CLOSED: 403,
  INVALID_TOKEN: 401,
  ASSET_NOT_FOUND: 404,
  PAYSTACK_UNAVAILABLE: 502,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export interface ApiResponseOk<T> {
  ok: true;
  data: T;
}

export interface ApiResponseFail {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  code: ErrorCode,
  message: string,
  opts?: { status?: number; fields?: Record<string, string[]> },
): Response {
  const status = opts?.status ?? ERROR_STATUS_MAP[code] ?? 500;
  const body: ApiResponseFail = {
    ok: false,
    error: {
      code,
      message,
      ...(opts?.fields ? { fields: opts.fields } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export async function handle(req: Request, fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.') || 'root';
        if (!fields[path]) {
          fields[path] = [];
        }
        fields[path].push(issue.message);
      }
      return fail('VALIDATION', 'Validation failed', { fields });
    }

    console.error(`[API ERROR] ${req.method} ${req.url}:`, err);
    return fail('INTERNAL', 'An unexpected error occurred. Please try again.');
  }
}
