import { describe, expect, it } from 'vitest';
import { UploadCompleteInput } from '@/lib/validation/upload';

describe('Upload Validation Schemas (Subphase 3.4)', () => {
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
