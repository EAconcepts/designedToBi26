import crypto from 'node:crypto';
import { env } from '@/lib/env';

export interface CloudinaryUrlOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  effect?: string;
}

export interface CloudinaryResource {
  public_id: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  bytes: number;
  secure_url?: string;
}

export interface ListFolderResult {
  resources: CloudinaryResource[];
  next_cursor?: string;
}

/**
 * Builds an optimized Cloudinary delivery URL with f_auto,q_auto defaults.
 */
export function cloudinaryUrl(publicId: string, options: CloudinaryUrlOptions = {}): string {
  if (!publicId) return '';

  // If already an absolute external or local URL, return as-is
  if (
    publicId.startsWith('http://') ||
    publicId.startsWith('https://') ||
    publicId.startsWith('/')
  ) {
    return publicId;
  }

  const cloudName = env.server.CLOUDINARY_CLOUD_NAME;
  const transforms: string[] = [];

  // Format & Quality
  transforms.push(`f_${options.format || 'auto'}`);
  transforms.push(
    typeof options.quality === 'number' ? `q_${options.quality}` : `q_${options.quality || 'auto'}`,
  );

  // Dimensions & Crop
  if (options.width) {
    transforms.push(`w_${options.width}`);
  }
  if (options.height) {
    transforms.push(`h_${options.height}`);
  }
  if (options.crop) {
    transforms.push(`c_${options.crop}`);
  } else if (options.width && options.height) {
    transforms.push('c_fill');
  }

  // Effects (e.g. blur:300)
  if (options.effect) {
    transforms.push(`e_${options.effect}`);
  }

  const cleanPublicId = publicId.replace(/^\//, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${cleanPublicId}`;
}

/**
 * Generates a lightweight, heavily blurred placeholder URL for Next.js blurDataURL.
 */
export function blurUrl(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 24,
    effect: 'blur:300',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Signs client-side upload parameters using Cloudinary SHA-1 specification.
 * Parameters are sorted alphabetically, joined as key=value&key2=value2,
 * appended with the API secret, and hashed with SHA-1.
 */
export function signUploadParams(params: Record<string, string | number>): {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
} {
  const apiKey = env.server.CLOUDINARY_API_KEY;
  const apiSecret = env.server.CLOUDINARY_API_SECRET;
  const cloudName = env.server.CLOUDINARY_CLOUD_NAME;

  const timestamp =
    typeof params.timestamp === 'number' ? params.timestamp : Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { ...params, timestamp };

  const sortedKeys = Object.keys(paramsToSign).sort();
  const serialized = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&');

  const signature = crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
  };
}

/**
 * Lists resources in a Cloudinary folder with pagination support via cursor.
 */
export async function listFolder(
  folder: string,
  options: { maxResults?: number; nextCursor?: string } = {},
): Promise<ListFolderResult> {
  const cloudName = env.server.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.server.CLOUDINARY_API_KEY;
  const apiSecret = env.server.CLOUDINARY_API_SECRET;

  const maxResults = options.maxResults || 100;
  const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`);
  url.searchParams.set('prefix', folder);
  url.searchParams.set('max_results', String(maxResults));
  if (options.nextCursor) {
    url.searchParams.set('next_cursor', options.nextCursor);
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Cloudinary Admin API list error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return {
    resources: data.resources || [],
    next_cursor: data.next_cursor,
  };
}

/**
 * Fetches asset details (dimensions, format) for specific publicIds.
 */
export async function resourceByPublicIds(publicIds: string[]): Promise<CloudinaryResource[]> {
  if (publicIds.length === 0) return [];
  const cloudName = env.server.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.server.CLOUDINARY_API_KEY;
  const apiSecret = env.server.CLOUDINARY_API_SECRET;

  const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`);
  url.searchParams.set('public_ids', publicIds.join(','));

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Cloudinary Admin API fetch error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return data.resources || [];
}

/**
 * Creates a signed zip archive download URL for an album's photos.
 */
export async function createArchive(
  publicIds: string[],
  targetFolder: string = 'wedding_album',
): Promise<string> {
  const cloudName = env.server.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.server.CLOUDINARY_API_KEY;
  const apiSecret = env.server.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    flatten_folders: 'true',
    public_ids: publicIds.join(','),
    target_public_id: `${targetFolder}_${timestamp}`,
    timestamp,
  };

  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');

  const formData = new URLSearchParams();
  for (const k of sortedKeys) {
    formData.set(k, String(params[k]));
  }
  formData.set('api_key', apiKey);
  formData.set('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/generate_archive`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudinary generate_archive error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.secure_url || data.url;
}
