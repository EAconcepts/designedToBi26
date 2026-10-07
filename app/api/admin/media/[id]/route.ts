import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { revalidateSite } from '@/lib/cache';
import { AdminUpdatePhotoInput } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = AdminUpdatePhotoInput.parse(body);

    const existingPhoto = await prisma.photo.findUnique({
      where: { id },
    });

    if (!existingPhoto) {
      return fail('NOT_FOUND', 'Photograph not found.', { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const photo = await tx.photo.update({
        where: { id },
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
          ...(input.altText !== undefined ? { altText: input.altText } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'PHOTO_UPDATE',
          entity: 'Photo',
          entityId: id,
          meta: {
            oldStatus: existingPhoto.status,
            newStatus: photo.status,
            publicId: photo.publicId,
          },
        },
      });

      return photo;
    });

    // Revalidate public gallery and upload routes upon status change
    await revalidateSite(['/', '/gallery', `/gallery/${existingPhoto.albumId}`]);

    return ok({ photo: updated });
  });
}
