import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import type { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function checkHealth(client: PrismaClient = prisma): Promise<Response> {
  try {
    await client.$queryRawUnsafe('SELECT 1');

    return ok(
      {
        db: 'up',
        version: '0.1.0',
        time: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch {
    return fail('INTERNAL', 'Database unreachable', { status: 503 });
  }
}

export async function GET(): Promise<Response> {
  return checkHealth();
}
