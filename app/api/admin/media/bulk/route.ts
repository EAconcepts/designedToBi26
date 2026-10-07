import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { revalidateSite } from '@/lib/cache';
import { AdminBulkMediaInput } from '@/lib/validation/admin';
import { MediaStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const body = await req.json();
    const { ids, action } = AdminBulkMediaInput.parse(body);

    const targetStatus: MediaStatus =
      action === 'approve'
        ? MediaStatus.APPROVED
        : action === 'reject'
          ? MediaStatus.REJECTED
          : MediaStatus.PENDING;

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.photo.updateMany({
        where: { id: { in: ids } },
        data: { status: targetStatus },
      });

      // Exactly one AuditLog row written for the batch per §3.5 acceptance criteria
      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: `PHOTO_BULK_${action.toUpperCase()}`,
          entity: 'Photo',
          meta: {
            count: updateResult.count,
            action,
            targetStatus,
            ids,
          },
        },
      });

      return updateResult;
    });

    // Revalidate public gallery collections
    await revalidateSite(['/', '/gallery']);

    return ok({ updated: result.count });
  });
}
