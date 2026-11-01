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
    const input = AdminReorderPhotoInput.parse(await req.json());
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
        return {
          moved: false,
          stillApproved: false,
          invalidPosition: false,
          currentPosition: 0,
          total: photos.length,
        };
      }

      const targetIndex =
        'position' in input ? input.position - 1 : photoIndex + (input.direction === 'up' ? -1 : 1);
      if ('position' in input && targetIndex >= photos.length) {
        return {
          moved: false,
          stillApproved: true,
          invalidPosition: true,
          currentPosition: photoIndex + 1,
          total: photos.length,
        };
      }

      const photo = photos[photoIndex];
      if (!photo) {
        return {
          moved: false,
          stillApproved: false,
          invalidPosition: false,
          currentPosition: 0,
          total: photos.length,
        };
      }

      if (targetIndex < 0 || targetIndex >= photos.length || targetIndex === photoIndex) {
        return {
          moved: false,
          stillApproved: true,
          invalidPosition: false,
          currentPosition: photoIndex + 1,
          total: photos.length,
        };
      }

      const [movedPhoto] = photos.splice(photoIndex, 1);
      if (!movedPhoto) {
        return {
          moved: false,
          stillApproved: false,
          invalidPosition: false,
          currentPosition: 0,
          total: photos.length,
        };
      }
      photos.splice(targetIndex, 0, movedPhoto);

      await Promise.all(
        photos.map((item, index) =>
          tx.photo.update({
            where: { id: item.id },
            data: { sortOrder: index },
          }),
        ),
      );

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'PHOTO_REORDER',
          entity: 'Photo',
          entityId: photo.id,
          meta: {
            albumSlug: existingPhoto.album.slug,
            ...('direction' in input ? { direction: input.direction } : {}),
            neighborPhotoId: photos[targetIndex + (targetIndex < photoIndex ? 1 : -1)]?.id ?? null,
            oldSortOrder: photo.sortOrder,
            newSortOrder: targetIndex,
            newPosition: targetIndex + 1,
          },
        },
      });

      return {
        moved: true,
        stillApproved: true,
        invalidPosition: false,
        currentPosition: targetIndex + 1,
        total: photos.length,
      };
    });

    if (!result.stillApproved) {
      return fail('VALIDATION', 'Only approved photographs can be reordered.');
    }

    if (result.invalidPosition) {
      return fail('VALIDATION', `Position must be between 1 and ${result.total}.`);
    }

    if (result.moved) {
      await revalidateSite(['/', '/gallery', `/gallery/${existingPhoto.album.slug}`]);
    }

    return ok({
      moved: result.moved,
      position: result.currentPosition,
      total: result.total,
    });
  });
}
