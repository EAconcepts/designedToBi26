import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { revalidateSite } from '@/lib/cache';
import { AdminReorderPhotoInput } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const { id } = await params;
    const { direction } = AdminReorderPhotoInput.parse(await req.json());
    const existingPhoto = await prisma.photo.findUnique({
      where: { id },
      include: { album: { select: { slug: true } } },
    });

    if (!existingPhoto) {
      return fail('NOT_FOUND', 'Photograph not found.', { status: 404 });
    }

    if (existingPhoto.status !== 'APPROVED') {
      return fail('VALIDATION', 'Only approved photographs can be reordered.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const photos = await tx.photo.findMany({
        where: { albumId: existingPhoto.albumId, status: 'APPROVED' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, sortOrder: true },
      });
      const photoIndex = photos.findIndex((photo) => photo.id === id);

      if (photoIndex < 0) {
        return { moved: false, stillApproved: false };
      }

      const neighborIndex = photoIndex + (direction === 'up' ? -1 : 1);
      const neighbor = photos[neighborIndex];
      if (!neighbor) {
        return { moved: false, stillApproved: true };
      }

      const photo = photos[photoIndex];
      if (!photo) {
        return { moved: false, stillApproved: false };
      }

      let newSortOrder = neighbor.sortOrder;
      if (photo.sortOrder === neighbor.sortOrder) {
        const reorderedPhotos = [...photos];
        reorderedPhotos[photoIndex] = neighbor;
        reorderedPhotos[neighborIndex] = photo;
        newSortOrder = neighborIndex;

        await Promise.all(
          reorderedPhotos.map((item, index) =>
            tx.photo.update({
              where: { id: item.id },
              data: { sortOrder: index },
            }),
          ),
        );
      } else {
        await Promise.all([
          tx.photo.update({
            where: { id: photo.id },
            data: { sortOrder: neighbor.sortOrder },
          }),
          tx.photo.update({
            where: { id: neighbor.id },
            data: { sortOrder: photo.sortOrder },
          }),
        ]);
      }

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'PHOTO_REORDER',
          entity: 'Photo',
          entityId: photo.id,
          meta: {
            albumSlug: existingPhoto.album.slug,
            direction,
            neighborPhotoId: neighbor.id,
            oldSortOrder: photo.sortOrder,
            newSortOrder,
          },
        },
      });

      return { moved: true, stillApproved: true };
    });

    if (!result.stillApproved) {
      return fail('VALIDATION', 'Only approved photographs can be reordered.');
    }

    if (result.moved) {
      await revalidateSite(['/', '/gallery', `/gallery/${existingPhoto.album.slug}`]);
    }

    return ok({ moved: result.moved, direction });
  });
}
