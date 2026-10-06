import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/admin/ping/route';

describe('Admin Ping Route Integration (/api/admin/ping)', () => {
  it('returns 401 UNAUTHENTICATED when unauthenticated', async () => {
    const response = await GET();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });
});
