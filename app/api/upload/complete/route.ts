import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/db';
import { resourceByPublicIds } from '@/lib/cloudinary';
import { validateUploadWindow } from '@/lib/uploads';
import { getGuestId } from '@/lib/guest-cookie';
import { UploadCompleteInput } from '@/lib/validation/upload';

export async function POST(req: NextRequest) {
  return handle(req, async () => {
    // 1. Active upload window check (no token required — open link for anyone)
    const access = await validateUploadWindow();

    if (!access.ok) {
      return fail(access.error, access.message, { status: access.status });
    }

    // 2. Validate request body
    const body = await req.json();
    const { publicId, caption } = UploadCompleteInput.parse(body);

    // 3. Idempotency guard: if already recorded, return existing photoId directly
    const existingPhoto = await prisma.photo.findUnique({
      where: { publicId },
    });

    if (existingPhoto) {
      return ok({ photoId: existingPhoto.id });
    }

    // 4. Server-side asset verification against Cloudinary (A3 guard)
    const resources = await resourceByPublicIds([publicId]);
    const resource = resources[0];

    if (!resource) {
      return fail('ASSET_NOT_FOUND', 'Asset not found on media storage.', { status: 404 });
    }

    // 5. Determine target album ('guest-moments')
    let guestAlbum = await prisma.album.findUnique({
      where: { slug: 'guest-moments' },
    });

    if (!guestAlbum) {
      guestAlbum = await prisma.album.create({
        data: {
          slug: 'guest-moments',
          title: 'Guest Moments',
          visibleFrom: 'LIVE',
        },
      });
    }

    // 6. Attribution via session cookie
    const guestId = getGuestId(req);
    const uploadedBy = guestId ?? 'guest';

    // 7. Persist pending photo row
    const photo = await prisma.photo.create({
      data: {
        albumId: guestAlbum.id,
        publicId,
        width: resource.width,
        height: resource.height,
        caption: caption || null,
        altText: caption || null,
        sortOrder: 0,
        status: 'PENDING',
        source: 'GUEST',
        uploadedBy,
      },
    });

    return ok({ photoId: photo.id });
  });
}
