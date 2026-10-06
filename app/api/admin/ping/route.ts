import { requireAdmin } from '@/lib/admin';
import { ok, fail } from '@/lib/api';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return fail('UNAUTHENTICATED', 'Admin session required');
  }

  return ok({ email: admin.email });
}
