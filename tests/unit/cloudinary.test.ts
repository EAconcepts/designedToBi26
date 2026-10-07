import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { cloudinaryUrl, blurUrl, signUploadParams } from '@/lib/cloudinary';
import { env } from '@/lib/env';

describe('lib/cloudinary', () => {
  describe('cloudinaryUrl', () => {
    it('generates standard optimized delivery URL with defaults', () => {
      const url = cloudinaryUrl('wedding/pre-wedding/photo-1');
      expect(url).toContain('https://res.cloudinary.com/');
      expect(url).toContain('/image/upload/f_auto,q_auto/wedding/pre-wedding/photo-1');
    });

    it('applies explicit width, height, and crop parameters', () => {
      const url = cloudinaryUrl('wedding/pre-wedding/photo-2', {
        width: 1200,
        height: 800,
        crop: 'fill',
      });
      expect(url).toContain('f_auto,q_auto,w_1200,h_800,c_fill');
      expect(url).toContain('/wedding/pre-wedding/photo-2');
    });

    it('applies custom quality, format, and effect', () => {
      const url = cloudinaryUrl('wedding/photo-3', {
        quality: 80,
        format: 'webp',
        effect: 'blur:200',
      });
      expect(url).toContain('f_webp,q_80,e_blur:200');
    });

    it('returns absolute and relative paths unchanged', () => {
      expect(cloudinaryUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
      expect(cloudinaryUrl('/img-1.jpg')).toBe('/img-1.jpg');
      expect(cloudinaryUrl('')).toBe('');
    });
  });

  describe('blurUrl', () => {
    it('creates a low-resolution blurred placeholder URL', () => {
      const blur = blurUrl('wedding/pre-wedding/photo-1');
      expect(blur).toContain('w_24');
      expect(blur).toContain('e_blur:300');
      expect(blur).toContain('wedding/pre-wedding/photo-1');
    });
  });

  describe('signUploadParams', () => {
    it('correctly sorts params and generates SHA-1 hex signature matching manual hash', () => {
      const timestamp = 1700000000;
      const params = {
        folder: 'wedding/guest-moments',
        public_id: 'guest_upload_123',
        timestamp,
      };

      const result = signUploadParams(params);
      expect(result.timestamp).toBe(timestamp);
      expect(result.apiKey).toBe(env.server.CLOUDINARY_API_KEY);
      expect(result.cloudName).toBe(env.server.CLOUDINARY_CLOUD_NAME);

      // Verify SHA-1 computation independently
      // Sorted keys: folder=wedding/guest-moments&public_id=guest_upload_123&timestamp=1700000000
      const serialized = `folder=wedding/guest-moments&public_id=guest_upload_123&timestamp=1700000000`;
      const expectedSignature = crypto
        .createHash('sha1')
        .update(`${serialized}${env.server.CLOUDINARY_API_SECRET}`)
        .digest('hex');

      expect(result.signature).toBe(expectedSignature);
    });
  });
});
