import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { signUploadParams } from '@/lib/cloudinary';
import {
  generateGuestPublicId,
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_FORMATS,
  validateUploadWindow,
} from '@/lib/uploads';

export async function POST(req: NextRequest) {
  return handle(req, async () => {
    // 1. Active upload window check (no token required — open link for anyone)
    const access = await validateUploadWindow();

    if (!access.ok) {
      return fail(access.error, access.message, { status: access.status });
    }

    // 2. Generate server-controlled publicId
    const { publicId, folder } = generateGuestPublicId();
    const timestamp = Math.floor(Date.now() / 1000);

    // 3. Sign parameters for Cloudinary direct upload
    const signed = signUploadParams({
      public_id: publicId,
      timestamp,
    });

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`;

    return ok({
      uploadUrl,
      publicId,
      apiKey: signed.apiKey,
      timestamp: signed.timestamp,
      signature: signed.signature,
      maxBytes: MAX_UPLOAD_BYTES,
      allowedFormats: ALLOWED_UPLOAD_FORMATS,
    });
  });
}
