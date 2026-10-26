import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postSignRoute } from '@/app/api/admin/media/sign/route';
import { POST as postCreateRoute } from '@/app/api/admin/media/route';
import { GET as getAlbumsRoute } from '@/app/api/admin/media/albums/route';
import { prisma } from '@/lib/db';
import * as cloudinary from '@/lib/cloudinary';
import * as adminAuth from '@/lib/admin';

const TEST_ALBUM_SLUG = 'admin-upload-test';
const TEST_PUBLIC_PREFIX = 'wedding/test-admin-uploads/';

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Admin Upload API Integration', () => {
  let albumId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Photo' } });
    await prisma.photo.deleteMany({ where: { publicId: { startsWith: TEST_PUBLIC_PREFIX } } });

    const album = await prisma.album.upsert({
      where: { slug: TEST_ALBUM_SLUG },
      update: {},
      create: {
        slug: TEST_ALBUM_SLUG,
        title: 'Admin Upload Test',
        visibleFrom: 'PRE',
      },
    });
    albumId = album.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Photo' } });
    await prisma.photo.deleteMany({ where: { albumId } });
    await prisma.album.deleteMany({ where: { slug: TEST_ALBUM_SLUG } });
  });

  it('rejects sign, create, and albums requests without an admin session', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    const signRes = await postSignRoute(
      jsonRequest('http://localhost:3000/api/admin/media/sign', {
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(signRes.status).toBe(401);

    const createRes = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        publicId: `${TEST_PUBLIC_PREFIX}2026/10/abcdef0123456789`,
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(createRes.status).toBe(401);

    const albumsRes = await getAlbumsRoute(
      new NextRequest('http://localhost:3000/api/admin/media/albums'),
    );
    expect(albumsRes.status).toBe(401);
  });

  it('sign returns a Cloudinary-signed payload scoped to the target album', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const res = await postSignRoute(
      jsonRequest('http://localhost:3000/api/admin/media/sign', {
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    const data = json.data;

    expect(data.uploadUrl).toBe(
      `https://api.cloudinary.com/v1_1/${cloudinary.signUploadParams({ timestamp: 1 }).cloudName}/image/upload`,
    );
    expect(data.albumSlug).toBe(TEST_ALBUM_SLUG);
    expect(data.publicId).toMatch(
      new RegExp(`^wedding/admin-uploads/${TEST_ALBUM_SLUG}/\\d{4}/\\d{2}/[0-9a-f]{16}$`),
    );
    expect(data.folder).toBe(data.publicId.slice(0, data.publicId.lastIndexOf('/')));
    expect(data.maxBytes).toBe(10 * 1024 * 1024);
    expect(data.allowedFormats).toContain('heic');

    // Signature must match Cloudinary's canonical sorted key=value + secret construction
    const recomputed = cloudinary.signUploadParams({
      folder: data.folder,
      public_id: data.publicId,
      timestamp: data.timestamp,
    });
    expect(data.signature).toBe(recomputed.signature);
    expect(data.apiKey).toBe(recomputed.apiKey);
    expect(data.timestamp).toBeTypeOf('number');
  });

  it('sign rejects an unknown album slug with 404', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const res = await postSignRoute(
      jsonRequest('http://localhost:3000/api/admin/media/sign', {
        albumSlug: 'no-such-album',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('create registers an APPROVED ADMIN photo appended to the album ordering', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });
    const publicId = `${TEST_PUBLIC_PREFIX}2026/10/abc123def4567890`;
    vi.spyOn(cloudinary, 'resourceByPublicIds').mockResolvedValue([
      {
        public_id: publicId,
        width: 1600,
        height: 1067,
        format: 'jpg',
        created_at: '2026-10-01T00:00:00.000Z',
        bytes: 250000,
      },
    ]);

    // Existing photo at sortOrder 5 → the new photo must land at 6 (append)
    await prisma.photo.create({
      data: {
        albumId,
        publicId: `${TEST_PUBLIC_PREFIX}seed-photo`,
        width: 800,
        height: 600,
        sortOrder: 5,
        status: 'APPROVED',
        source: 'ADMIN',
      },
    });

    const res = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        publicId,
        albumSlug: TEST_ALBUM_SLUG,
        altText: 'The couple on the terrace',
        caption: 'Golden hour',
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.existing).toBe(false);

    const photo = await prisma.photo.findUnique({ where: { id: json.data.photoId } });
    expect(photo).toMatchObject({
      albumId,
      publicId,
      width: 1600,
      height: 1067,
      status: 'APPROVED',
      source: 'ADMIN',
      uploadedBy: 'admin@example.com',
      altText: 'The couple on the terrace',
      caption: 'Golden hour',
      sortOrder: 6,
    });

    const log = await prisma.auditLog.findFirst({
      where: { entityId: json.data.photoId, action: 'PHOTO_CREATE' },
    });
    expect(log?.actor).toBe('admin@example.com');
    expect(log?.meta).toMatchObject({ albumSlug: TEST_ALBUM_SLUG, publicId });
  });

  it('create is idempotent for an already-registered publicId', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });
    const publicId = `${TEST_PUBLIC_PREFIX}2026/10/existing00000001`;
    const assetSpy = vi.spyOn(cloudinary, 'resourceByPublicIds');

    const seed = await prisma.photo.create({
      data: {
        albumId,
        publicId,
        width: 1000,
        height: 700,
        sortOrder: 0,
        status: 'APPROVED',
        source: 'ADMIN',
      },
    });

    const res = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        publicId,
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.existing).toBe(true);
    expect(json.data.photoId).toBe(seed.id);
    expect(assetSpy).not.toHaveBeenCalled();

    const count = await prisma.photo.count({ where: { publicId } });
    expect(count).toBe(1);
  });

  it('create rejects assets that do not exist on Cloudinary (A3 guard)', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });
    vi.spyOn(cloudinary, 'resourceByPublicIds').mockResolvedValue([]);

    const res = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        publicId: `${TEST_PUBLIC_PREFIX}2026/10/missingasset0001`,
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error.code).toBe('ASSET_NOT_FOUND');
  });

  it('create rejects an unknown album with 404 before contacting storage', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });
    const assetSpy = vi.spyOn(cloudinary, 'resourceByPublicIds');

    const res = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        publicId: `${TEST_PUBLIC_PREFIX}2026/10/wrongalbum000001`,
        albumSlug: 'no-such-album',
      }),
    );
    expect(res.status).toBe(404);
    expect(assetSpy).not.toHaveBeenCalled();
  });

  it('create rejects malformed bodies with 400 VALIDATION', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const res = await postCreateRoute(
      jsonRequest('http://localhost:3000/api/admin/media', {
        albumSlug: TEST_ALBUM_SLUG,
      }),
    );
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION');
  });

  it('albums lists every album with photo counts', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const res = await getAlbumsRoute(
      new NextRequest('http://localhost:3000/api/admin/media/albums'),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    const slugs = json.data.albums.map((album: { slug: string }) => album.slug);
    expect(slugs).toContain(TEST_ALBUM_SLUG);

    const entry = json.data.albums.find(
      (album: { slug: string }) => album.slug === TEST_ALBUM_SLUG,
    );
    expect(entry).toMatchObject({ title: 'Admin Upload Test', visibleFrom: 'PRE' });
    expect(entry.photoCount).toBeTypeOf('number');
  });
});
