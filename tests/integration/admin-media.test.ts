import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMediaRoute } from '@/app/api/admin/media/route';
import { PATCH as patchPhotoRoute } from '@/app/api/admin/media/[id]/route';
import { PATCH as patchBulkRoute } from '@/app/api/admin/media/bulk/route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin';

describe('Admin Media Moderation API Integration (Subphase 3.5)', () => {
  let guestAlbumId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Photo' } });
    await prisma.photo.deleteMany({
      where: { publicId: { startsWith: 'wedding/test-mod/' } },
    });

    const album = await prisma.album.upsert({
      where: { slug: 'guest-moments' },
      update: {},
      create: {
        slug: 'guest-moments',
        title: 'Guest Moments',
        visibleFrom: 'LIVE',
      },
    });
    guestAlbumId = album.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.auditLog.deleteMany({ where: { entity: 'Photo' } });
    await prisma.photo.deleteMany({
      where: { publicId: { startsWith: 'wedding/test-mod/' } },
    });
  });

  it('rejects unauthenticated requests on all three endpoints with 401 UNAUTHENTICATED', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(null);

    // 1. GET /api/admin/media
    const reqGet = new NextRequest('http://localhost:3000/api/admin/media');
    const resGet = await getMediaRoute(reqGet);
    expect(resGet.status).toBe(401);

    // 2. PATCH /api/admin/media/[id]
    const reqPatch = new NextRequest('http://localhost:3000/api/admin/media/photo_123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const resPatch = await patchPhotoRoute(reqPatch, {
      params: Promise.resolve({ id: 'photo_123' }),
    });
    expect(resPatch.status).toBe(401);

    // 3. PATCH /api/admin/media/bulk
    const reqBulk = new NextRequest('http://localhost:3000/api/admin/media/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['p1', 'p2'], action: 'approve' }),
    });
    const resBulk = await patchBulkRoute(reqBulk);
    expect(resBulk.status).toBe(401);
  });

  it('lists media with status filtering, pagination, and counts', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    // Seed 2 PENDING and 1 APPROVED photo
    await prisma.photo.createMany({
      data: [
        {
          albumId: guestAlbumId,
          publicId: 'wedding/test-mod/photo-1',
          width: 800,
          height: 600,
          status: 'PENDING',
          source: 'GUEST',
        },
        {
          albumId: guestAlbumId,
          publicId: 'wedding/test-mod/photo-2',
          width: 800,
          height: 600,
          status: 'PENDING',
          source: 'GUEST',
        },
        {
          albumId: guestAlbumId,
          publicId: 'wedding/test-mod/photo-3',
          width: 800,
          height: 600,
          status: 'APPROVED',
          source: 'GUEST',
        },
      ],
    });

    const req = new NextRequest('http://localhost:3000/api/admin/media?status=PENDING&limit=10');
    const res = await getMediaRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.rows.length).toBeGreaterThanOrEqual(2);
    expect(json.data.counts.pending).toBeGreaterThanOrEqual(2);
    expect(json.data.counts.approved).toBeGreaterThanOrEqual(1);
  });

  it('updates a single photo and writes an AuditLog entry', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const photo = await prisma.photo.create({
      data: {
        albumId: guestAlbumId,
        publicId: 'wedding/test-mod/single-update',
        width: 1200,
        height: 1600,
        status: 'PENDING',
        source: 'GUEST',
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/media/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        caption: 'Wonderful toast',
        altText: 'Guests raising glasses',
      }),
    });

    const res = await patchPhotoRoute(req, {
      params: Promise.resolve({ id: photo.id }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.photo.status).toBe('APPROVED');
    expect(json.data.photo.caption).toBe('Wonderful toast');

    // Assert AuditLog recorded
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: photo.id, action: 'PHOTO_UPDATE' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actor).toBe('admin@example.com');
  });

  it('approves multiple photos in bulk and writes exactly one AuditLog record', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({ email: 'admin@example.com' });

    const p1 = await prisma.photo.create({
      data: {
        albumId: guestAlbumId,
        publicId: 'wedding/test-mod/bulk-1',
        width: 800,
        height: 600,
        status: 'PENDING',
      },
    });
    const p2 = await prisma.photo.create({
      data: {
        albumId: guestAlbumId,
        publicId: 'wedding/test-mod/bulk-2',
        width: 800,
        height: 600,
        status: 'PENDING',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/media/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: [p1.id, p2.id],
        action: 'approve',
      }),
    });

    const res = await patchBulkRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.updated).toBe(2);

    // Verify both are now APPROVED in the database
    const rows = await prisma.photo.findMany({
      where: { id: { in: [p1.id, p2.id] } },
    });
    expect(rows.every((r) => r.status === 'APPROVED')).toBe(true);

    // Verify exactly ONE AuditLog entry written for the entire batch
    const audits = await prisma.auditLog.findMany({
      where: { action: 'PHOTO_BULK_APPROVE' },
    });
    expect(audits.length).toBe(1);
    expect(audits[0]?.actor).toBe('admin@example.com');
  });
});
