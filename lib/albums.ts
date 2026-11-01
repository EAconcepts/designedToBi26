import { prisma } from '@/lib/db';
import { isAlbumVisible } from '@/lib/mode';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { MediaStatus, type SiteMode } from '@prisma/client';

export const ALBUM_PHOTOS_PAGE_SIZE = 24;

export interface AlbumPhotoItem {
  id: string;
  publicId: string;
  src: string;
  thumbSrc: string;
  width: number;
  height: number;
  caption: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface AlbumWithCounts {
  id: string;
  slug: string;
  title: string;
  visibleFrom: SiteMode;
  isLocked: boolean;
  photoCount: number;
  coverUrl: string;
  coverPhoto: {
    publicId: string;
    width: number;
    height: number;
    altText?: string | null;
  } | null;
  lockCondition: string;
}

export function getAlbumLockCondition(visibleFrom: SiteMode): string {
  if (visibleFrom === 'LIVE') {
    return 'Unlocked on the wedding day (19 Dec 2026)';
  }
  if (visibleFrom === 'POST') {
    return 'Unlocked following the wedding celebration';
  }
  return 'Available';
}

/**
 * Returns all albums annotated with approved photo counts, cover image, and lock status.
 */
export async function getVisibleAlbums(mode: SiteMode): Promise<AlbumWithCounts[]> {
  const albums = await prisma.album.findMany({
    orderBy: { id: 'asc' },
    include: {
      photos: {
        where: { status: MediaStatus.APPROVED },
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: {
          publicId: true,
          width: true,
          height: true,
          altText: true,
        },
      },
      _count: {
        select: {
          photos: {
            where: { status: MediaStatus.APPROVED },
          },
        },
      },
    },
  });

  return albums.map((album) => {
    const isLocked = !isAlbumVisible(album.visibleFrom, mode);
    const cover = album.photos[0] ?? null;
    const coverUrl = cover
      ? cloudinaryUrl(cover.publicId, { width: 800, height: 600, crop: 'fill' })
      : '/img-1.jpg';

    return {
      id: album.id,
      slug: album.slug,
      title: album.title,
      visibleFrom: album.visibleFrom,
      isLocked,
      photoCount: album._count.photos,
      coverUrl,
      coverPhoto: cover
        ? {
            publicId: cover.publicId,
            width: cover.width,
            height: cover.height,
            altText: cover.altText,
          }
        : null,
      lockCondition: getAlbumLockCondition(album.visibleFrom),
    };
  });
}

/**
 * Retrieves a single album by slug.
 * Returns null if the album does not exist OR is locked in the current mode (no existence leak per §3.2).
 */
export async function getAlbumBySlug(slug: string, mode: SiteMode) {
  const album = await prisma.album.findUnique({
    where: { slug },
  });

  if (!album) {
    return null;
  }

  // If album is locked in the current site mode, treat as 404 to avoid existence leakage
  if (!isAlbumVisible(album.visibleFrom, mode)) {
    return null;
  }

  return album;
}

/**
 * Fetches approved photos for an unlocked album with pagination.
 */
export async function getPhotos(
  albumSlug: string,
  mode: SiteMode,
  page: number = 1,
  pageSize: number = ALBUM_PHOTOS_PAGE_SIZE,
): Promise<{
  album: { id: string; slug: string; title: string };
  photos: AlbumPhotoItem[];
  total: number;
  page: number;
  totalPages: number;
} | null> {
  const album = await getAlbumBySlug(albumSlug, mode);
  if (!album) {
    return null;
  }

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: {
        albumId: album.id,
        status: MediaStatus.APPROVED,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        publicId: true,
        width: true,
        height: true,
        caption: true,
        altText: true,
        sortOrder: true,
        createdAt: true,
      },
    }),
    prisma.photo.count({
      where: {
        albumId: album.id,
        status: MediaStatus.APPROVED,
      },
    }),
  ]);

  return {
    album: {
      id: album.id,
      slug: album.slug,
      title: album.title,
    },
    photos: photos.map((p) => ({
      ...p,
      src: cloudinaryUrl(p.publicId, { width: 1400, height: 900, crop: 'limit' }),
      thumbSrc: cloudinaryUrl(p.publicId, { width: 600, height: 600, crop: 'fill' }),
    })),
    total,
    page: safePage,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
