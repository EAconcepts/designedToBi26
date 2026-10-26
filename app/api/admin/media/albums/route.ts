import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const albums = await prisma.album.findMany({
      orderBy: { id: 'asc' },
      select: {
        slug: true,
        title: true,
        visibleFrom: true,
        _count: { select: { photos: true } },
      },
    });

    return ok({
      albums: albums.map((album) => ({
        slug: album.slug,
        title: album.title,
        visibleFrom: album.visibleFrom,
        photoCount: album._count.photos,
      })),
    });
  });
}
