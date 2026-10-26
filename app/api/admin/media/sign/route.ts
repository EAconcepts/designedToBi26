import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { signUploadParams } from '@/lib/cloudinary';
import { generateAdminPublicId, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_FORMATS } from '@/lib/uploads';
import { AdminUploadSignInput } from '@/lib/validation/admin';

export async function POST(req: NextRequest) {
  return handle(req, async () => {
    const admin = await requireAdmin();
    if (!admin) {
      return fail('UNAUTHENTICATED', 'Admin authorization required.', { status: 401 });
    }

    const body = await req.json();
    const { albumSlug } = AdminUploadSignInput.parse(body);

    const album = await prisma.album.findUnique({ where: { slug: albumSlug } });
    if (!album) {
      return fail('NOT_FOUND', 'Album not found.', { status: 404 });
    }

    // Server-controlled publicId scoped to the target album
    const { publicId, folder } = generateAdminPublicId(album.slug);
    const timestamp = Math.floor(Date.now() / 1000);

    const signed = signUploadParams({
      folder,
      public_id: publicId,
      timestamp,
    });

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`;

    return ok({
      uploadUrl,
      publicId,
      folder,
      albumSlug: album.slug,
      apiKey: signed.apiKey,
      timestamp: signed.timestamp,
      signature: signed.signature,
      maxBytes: MAX_UPLOAD_BYTES,
      allowedFormats: ALLOWED_UPLOAD_FORMATS,
    });
  });
}
