import { z } from 'zod';

export const UploadSignInput = z.object({
  token: z.string().trim().optional(),
});

export type UploadSignInput = z.infer<typeof UploadSignInput>;

export const UploadCompleteInput = z.object({
  publicId: z
    .string()
    .trim()
    .min(1, 'Cloudinary public ID is required')
    .max(256, 'Public ID is too long'),
  caption: z
    .string()
    .trim()
    .max(300, 'Caption cannot exceed 300 characters')
    .optional()
    .or(z.literal('')),
});

export type UploadCompleteInput = z.infer<typeof UploadCompleteInput>;
