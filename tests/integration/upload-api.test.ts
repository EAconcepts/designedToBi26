import { describe, expect, it, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postSignRoute } from '@/app/api/upload/sign/route';
import { POST as postCompleteRoute } from '@/app/api/upload/complete/route';
import { prisma } from '@/lib/db';
import * as cloudinary from '@/lib/cloudinary';
import { signGuestId, GUEST_COOKIE_NAME } from '@/lib/guest-cookie';

const TEST_TOKEN = 'test_upload_secret_token_123';

describe('Upload API Integration (Subphase 3.4)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Ensure Setting exists with active upload window and known token
    await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        uploadsOpen: true,
        uploadToken: TEST_TOKEN,
        uploadsCloseAt: null,
      },
      create: {
        id: 1,
        mode: 'PRE',
        uploadsOpen: true,
        uploadToken: TEST_TOKEN,
      },
    });

    // Clean up test photos
    await prisma.photo.deleteMany({
      where: {
        publicId: {
          startsWith: 'wedding/guest-uploads/',
        },
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.photo.deleteMany({
      where: {
        publicId: {
          startsWith: 'wedding/guest-uploads/',
        },
      },
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.setting.updateMany({
      where: { id: 1 },
      data: {
        uploadsOpen: false,
        uploadsCloseAt: null,
      },
    });
    await prisma.photo.deleteMany({
      where: {
        publicId: {
          startsWith: 'wedding/guest-uploads/',
        },
      },
    });
  });

  describe('POST /api/upload/sign', () => {
    it('returns signed parameters and server-generated publicId when token and window are valid', async () => {
      const req = new NextRequest('http://localhost:3000/api/upload/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({}),
      });

      const res = await postSignRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.uploadUrl).toContain('https://api.cloudinary.com/v1_1/');
      expect(json.data.publicId).toMatch(/^wedding\/guest-uploads\/\d{4}\/\d{2}\/[a-f0-9]{16}$/);
      expect(json.data.folder).toMatch(/^wedding\/guest-uploads\/\d{4}\/\d{2}$/);
      expect(json.data.signature).toBeDefined();
      expect(json.data.maxBytes).toBe(10485760);
      expect(json.data.allowedFormats).toContain('heic');
    });

    it('rejects missing or wrong token with 401 INVALID_TOKEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/upload/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': 'wrong-token',
        },
        body: JSON.stringify({}),
      });

      const res = await postSignRoute(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects signing when uploadsOpen is false with 403 UPLOADS_CLOSED', async () => {
      await prisma.setting.update({
        where: { id: 1 },
        data: { uploadsOpen: false },
      });

      const req = new NextRequest('http://localhost:3000/api/upload/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({}),
      });

      const res = await postSignRoute(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('UPLOADS_CLOSED');
    });

    it('rejects signing when upload window is expired with 403 UPLOADS_CLOSED', async () => {
      await prisma.setting.update({
        where: { id: 1 },
        data: {
          uploadsOpen: true,
          uploadsCloseAt: new Date(Date.now() - 3600_000), // 1 hour ago
        },
      });

      const req = new NextRequest('http://localhost:3000/api/upload/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({}),
      });

      const res = await postSignRoute(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('UPLOADS_CLOSED');
    });
  });

  describe('POST /api/upload/complete', () => {
    it('returns 404 ASSET_NOT_FOUND and creates NO database row when Cloudinary has not received the file', async () => {
      vi.spyOn(cloudinary, 'resourceByPublicIds').mockResolvedValue([]);

      const fakePublicId = 'wedding/guest-uploads/2026/10/fake1234567890ab';
      const req = new NextRequest('http://localhost:3000/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({
          publicId: fakePublicId,
          caption: 'My memory',
        }),
      });

      const res = await postCompleteRoute(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('ASSET_NOT_FOUND');

      // Assert zero database rows created (A3 security invariant)
      const row = await prisma.photo.findUnique({
        where: { publicId: fakePublicId },
      });
      expect(row).toBeNull();
    });

    it('creates a PENDING photo row with dimensions from Cloudinary and handles idempotent repeat calls', async () => {
      const publicId = 'wedding/guest-uploads/2026/10/valid1234567890ab';
      vi.spyOn(cloudinary, 'resourceByPublicIds').mockResolvedValue([
        {
          public_id: publicId,
          width: 3024,
          height: 4032,
          format: 'jpg',
          created_at: new Date().toISOString(),
          bytes: 1800000,
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({
          publicId,
          caption: 'Dancing at the reception',
        }),
      });

      const res = await postCompleteRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.photoId).toBeDefined();

      const photoId = json.data.photoId;

      // Verify row in database
      const row = await prisma.photo.findUnique({
        where: { id: photoId },
        include: { album: true },
      });
      expect(row).not.toBeNull();
      expect(row?.status).toBe('PENDING');
      expect(row?.source).toBe('GUEST');
      expect(row?.uploadedBy).toBe('guest');
      expect(row?.width).toBe(3024);
      expect(row?.height).toBe(4032);
      expect(row?.caption).toBe('Dancing at the reception');
      expect(row?.album.slug).toBe('guest-moments');

      // Repeat call for idempotency with fresh request payload
      const reqRepeat = new NextRequest('http://localhost:3000/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
        },
        body: JSON.stringify({
          publicId,
          caption: 'Dancing at the reception',
        }),
      });
      const resRepeat = await postCompleteRoute(reqRepeat);
      expect(resRepeat.status).toBe(200);
      const jsonRepeat = await resRepeat.json();
      expect(jsonRepeat.data.photoId).toBe(photoId);

      // Verify count is still exactly 1
      const count = await prisma.photo.count({
        where: { publicId },
      });
      expect(count).toBe(1);
    });

    it('attributes upload to the guest session when a cookie is present', async () => {
      const publicId = 'wedding/guest-uploads/2026/10/guest1234567890ab';
      vi.spyOn(cloudinary, 'resourceByPublicIds').mockResolvedValue([
        {
          public_id: publicId,
          width: 1200,
          height: 1600,
          format: 'heic',
          created_at: new Date().toISOString(),
          bytes: 900000,
        },
      ]);

      const e2eGuest = await prisma.guest.findFirst({
        where: { displayName: 'E2E Deterministic Guest' },
      });
      expect(e2eGuest).not.toBeNull();
      const cookieVal = signGuestId(e2eGuest!.id);

      const req = new NextRequest('http://localhost:3000/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': TEST_TOKEN,
          cookie: `${GUEST_COOKIE_NAME}=${cookieVal}`,
        },
        body: JSON.stringify({
          publicId,
          caption: 'Table 4 selfie',
        }),
      });

      const res = await postCompleteRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      const row = await prisma.photo.findUnique({
        where: { id: json.data.photoId },
      });
      expect(row?.uploadedBy).toBe(e2eGuest!.id);
    });
  });
});
