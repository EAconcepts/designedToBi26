import crypto from 'node:crypto';
import { getSettingsUncached } from '@/lib/settings';
import type { Setting } from '@prisma/client';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per §3.0 / §3.4
export const ALLOWED_UPLOAD_FORMATS = 'jpg,jpeg,png,webp,gif,heic,heif';

export type UploadAccessResult =
  | { ok: true; setting: Setting }
  | { ok: false; error: 'INVALID_TOKEN' | 'UPLOADS_CLOSED'; message: string; status: number };

/**
 * Validates upload authorization token and active upload window.
 * Uses constant-time comparison against Setting.uploadToken.
 */
export async function validateUploadAccess(
  providedToken: string | null | undefined,
): Promise<UploadAccessResult> {
  const setting = await getSettingsUncached();

  if (!setting || !setting.uploadToken || !providedToken) {
    return {
      ok: false,
      error: 'INVALID_TOKEN',
      message: 'Upload token is invalid or missing.',
      status: 401,
    };
  }

  // Constant-time comparison
  const a = Buffer.from(providedToken.trim());
  const b = Buffer.from(setting.uploadToken.trim());
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return {
      ok: false,
      error: 'INVALID_TOKEN',
      message: 'Upload token is invalid.',
      status: 401,
    };
  }

  // Active window check
  if (!setting.uploadsOpen) {
    return {
      ok: false,
      error: 'UPLOADS_CLOSED',
      message: 'Guest uploads are currently closed.',
      status: 403,
    };
  }

  if (setting.uploadsCloseAt && new Date() > new Date(setting.uploadsCloseAt)) {
    return {
      ok: false,
      error: 'UPLOADS_CLOSED',
      message: 'The guest upload window has closed.',
      status: 403,
    };
  }

  return { ok: true, setting };
}

/**
 * Generates a server-controlled Cloudinary publicId:
 * wedding/guest-uploads/<yyyy>/<mm>/<16 hex chars>
 */
export function generateGuestPublicId(now: Date = new Date()): {
  publicId: string;
  folder: string;
} {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const randomHex = crypto.randomBytes(8).toString('hex'); // 16 hex chars
  const folder = `wedding/guest-uploads/${yyyy}/${mm}`;
  const publicId = `${folder}/${randomHex}`;

  return { publicId, folder };
}
