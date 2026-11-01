import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { cloudinaryUrl, resourceByPublicIds } from '@/lib/cloudinary';
import { revalidateSite } from '@/lib/cache';
import { AdminMediaQueryInput, AdminCreatePhotoInput } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = AdminMediaQueryInput.parse(searchParams);

    const skip = (query.page - 1) * query.limit;

    const [rows, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.photo.findMany({
        where: { status: query.status },
        include: {
          album: {
            select: { id: true, slug: true, title: true },
          },
        },
        orderBy:
          query.status === 'APPROVED'
            ? [
                { album: { slug: 'asc' } },
                { sortOrder: 'asc' },
                { createdAt: 'asc' },
                { id: 'asc' },
              ]
            : [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.limit,
      }),
      prisma.photo.count({
        where: { status: query.status },
      }),
      prisma.photo.count({ where: { status: 'PENDING' } }),
      prisma.photo.count({ where: { status: 'APPROVED' } }),
      prisma.photo.count({ where: { status: 'REJECTED' } }),
    ]);

    const approvedPhotos =
      query.status === 'APPROVED' && rows.length > 0
        ? await prisma.photo.findMany({
            where: {
              albumId: { in: [...new Set(rows.map((photo) => photo.albumId))] },
              status: 'APPROVED',
            },
            orderBy: [
              { albumId: 'asc' },
              { sortOrder: 'asc' },
              { createdAt: 'asc' },
              { id: 'asc' },
            ],
            select: { id: true, albumId: true },
          })
        : [];
    const albumPositions = new Map<string, number>();
    const albumPhotoCounts = new Map<string, number>();
    for (const photo of approvedPhotos) {
      albumPhotoCounts.set(photo.albumId, (albumPhotoCounts.get(photo.albumId) ?? 0) + 1);
      albumPositions.set(photo.id, albumPhotoCounts.get(photo.albumId) ?? 0);
    }

    const formattedRows = rows.map((photo) => ({
      ...photo,
      src: cloudinaryUrl(photo.publicId, { width: 1200, height: 900, crop: 'limit' }),
      thumbSrc: cloudinaryUrl(photo.publicId, { width: 400, height: 400, crop: 'fill' }),
      albumPosition: albumPositions.get(photo.id) ?? null,
      albumPhotoCount: albumPhotoCounts.get(photo.albumId) ?? 0,
    }));

    return ok({
      rows: formattedRows,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit) || 1,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  });
}

/**
 * Creates an admin/couple Photo row for an asset already uploaded directly
 * to Cloudinary. Admin uploads bypass moderation: status APPROVED, source ADMIN.
 */
export async function POST(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const body = await req.json();
    const input = AdminCreatePhotoInput.parse(body);

    const album = await prisma.album.findUnique({ where: { slug: input.albumSlug } });
    if (!album) {
      return fail('NOT_FOUND', 'Album not found.', { status: 404 });
    }

    // Idempotency guard: same publicId is never registered twice
    const existingPhoto = await prisma.photo.findUnique({
      where: { publicId: input.publicId },
    });
    if (existingPhoto) {
      return ok({ photoId: existingPhoto.id, existing: true });
    }

    // Server-side asset verification against Cloudinary (A3 guard)
    const resources = await resourceByPublicIds([input.publicId]);
    const resource = resources[0];
    if (!resource) {
      return fail('ASSET_NOT_FOUND', 'Asset not found on media storage.', { status: 404 });
    }

    // Append to the end of the album's existing ordering
    const latest = await prisma.photo.findFirst({
      where: { albumId: album.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (latest?.sortOrder ?? -1) + 1;

    const photo = await prisma.$transaction(async (tx) => {
      const created = await tx.photo.create({
        data: {
          albumId: album.id,
          publicId: input.publicId,
          width: resource.width,
          height: resource.height,
          caption: input.caption ?? null,
          altText: input.altText ?? null,
          sortOrder,
          status: 'APPROVED',
          source: 'ADMIN',
          uploadedBy: admin.email,
        },
      });

      await tx.auditLog.create({
        data: {
          actor: admin.email,
          action: 'PHOTO_CREATE',
          entity: 'Photo',
          entityId: created.id,
          meta: {
            albumSlug: album.slug,
            publicId: created.publicId,
            sortOrder,
          },
        },
      });

      return created;
    });

    // Revalidate public surfaces so the new photo appears immediately
    await revalidateSite(['/', '/gallery', `/gallery/${album.slug}`]);

    return ok({ photoId: photo.id, existing: false });
  });
}
