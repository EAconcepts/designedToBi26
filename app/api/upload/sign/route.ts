import { type NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { signUploadParams } from '@/lib/cloudinary';
import {
  validateUploadAccess,
  generateGuestPublicId,
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_FORMATS,
} from '@/lib/uploads';
import { UploadSignInput } from '@/lib/validation/upload';

export async function POST(req: NextRequest) {
  return handle(req, async () => {
    // 1. Auth check via header or body
    const headerToken = req.headers.get('x-upload-token');
    let bodyToken: string | undefined;

    try {
      const body = await req.json().catch(() => ({}));
      const parsed = UploadSignInput.safeParse(body);
      if (parsed.success) {
        bodyToken = parsed.data.token;
      }
    } catch {
      // Body may be empty, which is completely valid per contract
    }

    const token = headerToken || bodyToken;
    const access = await validateUploadAccess(token);

    if (!access.ok) {
      return fail(access.error, access.message, { status: access.status });
    }

    // 2. Generate server-controlled publicId
    const { publicId, folder } = generateGuestPublicId();
    const timestamp = Math.floor(Date.now() / 1000);

    // 3. Sign parameters for Cloudinary direct upload
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
      apiKey: signed.apiKey,
      timestamp: signed.timestamp,
      signature: signed.signature,
      maxBytes: MAX_UPLOAD_BYTES,
      allowedFormats: ALLOWED_UPLOAD_FORMATS,
    });
  });
}
