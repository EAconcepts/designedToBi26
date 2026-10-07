import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { AdminMediaQueryInput } from '@/lib/validation/admin';

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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

    const formattedRows = rows.map((photo) => ({
      ...photo,
      src: cloudinaryUrl(photo.publicId, { width: 1200, height: 900, crop: 'limit' }),
      thumbSrc: cloudinaryUrl(photo.publicId, { width: 400, height: 400, crop: 'fill' }),
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
