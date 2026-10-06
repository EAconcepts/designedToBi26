import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GET, checkHealth } from '@/app/api/health/route';

describe('Health Check Route Integration (/api/health)', () => {
  it('returns 200 with db: up when database is healthy', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.db).toBe('up');
    expect(body.data.version).toBe('0.1.0');
    expect(typeof body.data.time).toBe('string');
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('returns 503 with fail("INTERNAL") when database is unreachable', async () => {
    const badClient = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://postgres:postgres@localhost:59999/wedding_bad?connect_timeout=1',
        },
      },
    });

    try {
      const res = await checkHealth(badClient);
      expect(res.status).toBe(503);

      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('INTERNAL');
      expect(body.error.message).toBe('Database unreachable');
    } finally {
      await badClient.$disconnect().catch(() => {});
    }
  });
});
