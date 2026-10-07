import { describe, expect, it } from 'vitest';
import { UploadSignInput, UploadCompleteInput } from '@/lib/validation/upload';

describe('Upload Validation Schemas (Subphase 3.4)', () => {
  describe('UploadSignInput', () => {
    it('accepts empty object or token string', () => {
      expect(UploadSignInput.safeParse({}).success).toBe(true);
      expect(UploadSignInput.safeParse({ token: 'test-token' }).success).toBe(true);
    });

    it('trims token string', () => {
      const parsed = UploadSignInput.safeParse({ token: '  token-123  ' });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.token).toBe('token-123');
      }
    });
  });

  describe('UploadCompleteInput', () => {
    it('validates publicId presence and length', () => {
      expect(UploadCompleteInput.safeParse({ publicId: '' }).success).toBe(false);
      expect(
        UploadCompleteInput.safeParse({ publicId: 'wedding/guest-uploads/2026/10/abc' }).success,
      ).toBe(true);
    });

    it('validates caption optionality and max length', () => {
      expect(
        UploadCompleteInput.safeParse({
          publicId: 'wedding/123',
          caption: 'Great moment',
        }).success,
      ).toBe(true);

      expect(
        UploadCompleteInput.safeParse({
          publicId: 'wedding/123',
          caption: 'a'.repeat(301),
        }).success,
      ).toBe(false);
    });
  });
});
